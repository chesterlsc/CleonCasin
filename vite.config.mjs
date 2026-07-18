import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = dirname(fileURLToPath(import.meta.url));
const dataFile = resolve(projectRoot, ".data/cleon-casino.json");
const emptyLedger = { history: [], deposits: [], withdrawals: [] };

async function readLedger() {
  try {
    return { ...emptyLedger, ...JSON.parse(await readFile(dataFile, "utf8")) };
  } catch {
    await mkdir(dirname(dataFile), { recursive: true });
    await writeFile(dataFile, JSON.stringify(emptyLedger, null, 2));
    return structuredClone(emptyLedger);
  }
}

async function writeLedger(ledger) {
  await mkdir(dirname(dataFile), { recursive: true });
  await writeFile(dataFile, JSON.stringify(ledger, null, 2));
}

function readBody(request) {
  return new Promise((resolveBody, reject) => {
    let body = "";
    request.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1_000_000) request.destroy();
    });
    request.on("end", () => {
      try {
        resolveBody(body ? JSON.parse(body) : {});
      } catch (error) {
        reject(error);
      }
    });
    request.on("error", reject);
  });
}

function dailySoloPlayers(date = new Date()) {
  const key = date.toISOString().slice(0, 10);
  const hash = [...key].reduce((total, character) => ((total * 31) + character.charCodeAt(0)) >>> 0, 7);
  return 50 + (hash % 51);
}

function buildStats(history) {
  const totalWagered = history.reduce((sum, round) => sum + Number(round.totalBet || 0), 0);
  const totalWins = history.reduce((sum, round) => sum + Math.max(0, Number(round.net || 0)), 0);
  const netRevenue = history.reduce((sum, round) => sum + Number(round.net || 0), 0);
  const wins = history.filter((round) => Number(round.net || 0) > 0).length;
  return {
    rounds: history.length,
    totalWagered,
    totalWins,
    netRevenue,
    winRate: history.length ? Math.round((wins / history.length) * 100) : 0,
  };
}

function createCasinoApi() {
  return async (request, response, next) => {
    if (!request.url?.startsWith("/api/")) return next();

    response.setHeader("Content-Type", "application/json; charset=utf-8");
    response.setHeader("Cache-Control", "no-store");

    try {
      const pathname = new URL(request.url, "http://cleon.local").pathname;
      const ledger = await readLedger();

      if (request.method === "GET" && pathname === "/api/session") {
        response.end(JSON.stringify({
          stats: buildStats(ledger.history),
          history: ledger.history.slice(0, 80),
          deposits: ledger.deposits.slice(0, 20),
          withdrawals: ledger.withdrawals.slice(0, 20),
          lobby: { dailySoloPlayers: dailySoloPlayers(), decisionSeconds: 12 },
        }));
        return;
      }

      if (request.method === "GET" && pathname === "/api/history") {
        response.end(JSON.stringify({ history: ledger.history.slice(0, 80), stats: buildStats(ledger.history) }));
        return;
      }

      if (request.method === "GET" && pathname === "/api/export") {
        response.end(JSON.stringify({
          exportedAt: new Date().toISOString(),
          stats: buildStats(ledger.history),
          history: ledger.history,
          deposits: ledger.deposits,
          withdrawals: ledger.withdrawals,
        }));
        return;
      }

      if (request.method === "POST" && pathname === "/api/history") {
        const payload = await readBody(request);
        const record = {
          id: payload.id || `round-${Date.now()}`,
          createdAt: payload.createdAt || new Date().toISOString(),
          game: payload.game === "baccarat" ? "baccarat" : "blackjack",
          lobby: payload.lobby === "baccarat" ? "baccarat" : payload.lobby === "solo" ? "solo" : "arena",
          mode: payload.mode === "speed" ? "speed" : payload.mode === "classic" ? "classic" : "freebet",
          mainBet: Math.max(0, Number(payload.mainBet || 0)),
          sideBets: Math.max(0, Number(payload.sideBets || 0)),
          totalBet: Math.max(0, Number(payload.totalBet || 0)),
          returned: Math.max(0, Number(payload.returned || 0)),
          net: Number(payload.net || 0),
          outcome: String(payload.outcome || "settled").slice(0, 40),
          playerTotal: Number(payload.playerTotal || 0),
          dealerTotal: Number(payload.dealerTotal || 0),
          balanceAfter: Math.max(0, Number(payload.balanceAfter || 0)),
        };
        ledger.history.unshift(record);
        ledger.history = ledger.history.slice(0, 500);
        await writeLedger(ledger);
        response.statusCode = 201;
        response.end(JSON.stringify({ record, stats: buildStats(ledger.history) }));
        return;
      }

      if (request.method === "POST" && pathname === "/api/deposits") {
        const payload = await readBody(request);
        const deposit = {
          id: `deposit-${Date.now()}`,
          createdAt: new Date().toISOString(),
          method: String(payload.method || "cashier").slice(0, 32),
          amount: Math.max(0, Number(payload.amount || 0)),
        };
        ledger.deposits.unshift(deposit);
        ledger.deposits = ledger.deposits.slice(0, 100);
        await writeLedger(ledger);
        response.statusCode = 201;
        response.end(JSON.stringify({ deposit }));
        return;
      }

      if (request.method === "POST" && pathname === "/api/withdrawals") {
        const payload = await readBody(request);
        const withdrawal = {
          id: `withdrawal-${Date.now()}`,
          createdAt: new Date().toISOString(),
          method: String(payload.method || "cashier").slice(0, 32),
          amount: Math.max(0, Number(payload.amount || 0)),
        };
        ledger.withdrawals.unshift(withdrawal);
        ledger.withdrawals = ledger.withdrawals.slice(0, 100);
        await writeLedger(ledger);
        response.statusCode = 201;
        response.end(JSON.stringify({ withdrawal }));
        return;
      }

      if (request.method === "POST" && pathname === "/api/reset") {
        await writeLedger({ ...structuredClone(emptyLedger), deposits: ledger.deposits, withdrawals: ledger.withdrawals });
        response.end(JSON.stringify({ ok: true, stats: buildStats([]) }));
        return;
      }

      response.statusCode = 404;
      response.end(JSON.stringify({ error: "Not found" }));
    } catch (error) {
      response.statusCode = 500;
      response.end(JSON.stringify({ error: error instanceof Error ? error.message : "Casino ledger error" }));
    }
  };
}

const casinoApiPlugin = {
  name: "cleon-casino-ledger",
  configureServer(server) {
    server.middlewares.use(createCasinoApi());
  },
  configurePreviewServer(server) {
    server.middlewares.use(createCasinoApi());
  },
};

export default defineConfig({
  optimizeDeps: {
    include: ["react", "react-dom/client"],
  },
  server: {
    host: "0.0.0.0",
    allowedHosts: ["terminal.local"],
    warmup: {
      clientFiles: ["./src/main.jsx"],
    },
  },
  preview: {
    host: "0.0.0.0",
    allowedHosts: true,
  },
  plugins: [react(), casinoApiPlugin],
});
