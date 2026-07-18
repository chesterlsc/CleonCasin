import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowCounterClockwise,
  ArrowLeft,
  ArrowsLeftRight,
  CaretDown,
  CaretUp,
  CardsThree,
  ChartLineUp,
  ClockCounterClockwise,
  Crown,
  Gauge,
  HandPalm,
  Info,
  Lightning,
  Play,
  PokerChip,
  Repeat,
  SpeakerHigh,
  SpeakerSlash,
  Sun,
  Trash,
  Trophy,
  X,
} from "@phosphor-icons/react";
import {
  BACCARAT_BET_KEYS,
  BACCARAT_MAIN_BET_KEYS,
  BACCARAT_SIDE_BET_KEYS,
  baccaratBeadPlate,
  baccaratBigRoad,
  baccaratDerivedRoad,
  baccaratHandTotal,
  completeBaccaratRoundFromOpening,
  createBaccaratShoe,
  dealBaccaratOpening,
  settleBaccaratBets,
} from "./baccarat.js";
import { formatPeso } from "./game.js";
import "./baccarat.css";

const CHIP_VALUES = [100, 250, 500, 1000, 2500, 5000, 10000];
const CHIP_SRC = {
  100: "/assets/chips/chip-100.png",
  250: "/assets/chips/chip-250.png",
  500: "/assets/chips/chip-500.png",
  1000: "/assets/chips/chip-1000.svg",
  2500: "/assets/chips/chip-2500.svg",
  5000: "/assets/chips/chip-5000.svg",
  10000: "/assets/chips/chip-10000.svg",
};

const BET_META = {
  player: { label: "PLAYER", odds: "1:1", tone: "player", max: 250000, group: "main" },
  tie: { label: "TIE", odds: "8:1", tone: "tie", max: 250000, group: "main" },
  banker: { label: "BANKER", odds: "0.95:1", tone: "banker", max: 250000, group: "main" },
  playerPair: { label: "PLAYER PAIR", odds: "11:1", tone: "player-pair", max: 10000, group: "side", asset: "/assets/baccarat-sidebets/player-pair-v1.png", badge: "P" },
  panda8: { label: "PANDA 8", odds: "25:1", tone: "panda", max: 10000, group: "side", asset: "/assets/baccarat-sidebets/panda-8-v1.png", badge: "8" },
  heavenly9: { label: "HEAVENLY 9", odds: "10:1 · 75:1", tone: "heavenly", max: 10000, group: "side", asset: "/assets/baccarat-sidebets/heavenly-9-v1.png", badge: "9" },
  tiger6: { label: "TIGER 6", odds: "12:1 · 20:1", tone: "tiger-six", max: 10000, group: "side", asset: "/assets/baccarat-sidebets/tiger-6-v1.png", badge: "6" },
  tiger7: { label: "TIGER 7", odds: "40:1", tone: "tiger-seven", max: 10000, group: "side", asset: "/assets/baccarat-sidebets/tiger-7-v1.png", badge: "7" },
  bankerPair: { label: "BANKER PAIR", odds: "11:1", tone: "banker-pair", max: 10000, group: "side", asset: "/assets/baccarat-sidebets/banker-pair-v1.png", badge: "B" },
};

const DEAL_PACES = {
  cinematic: { label: "CINEMATIC", card: 620, settle: 1050, result: 5000, peel: 12000 },
  live: { label: "LIVE", card: 330, settle: 650, result: 3400, peel: 9000 },
  turbo: { label: "TURBO", card: 145, settle: 280, result: 2100, peel: 6500 },
};
const DEAL_PACE_ORDER = ["cinematic", "live", "turbo"];

const SUIT_MARKS = { spades: "♠", hearts: "♥", diamonds: "♦", clubs: "♣" };
const emptyBets = () => Object.fromEntries(BACCARAT_BET_KEYS.map((key) => [key, []]));
const totalStack = (stack = []) => stack.reduce((sum, value) => sum + value, 0);
const totalBets = (bets) => BACCARAT_BET_KEYS.reduce((sum, key) => sum + totalStack(bets[key]), 0);
function BrandLockup() {
  return (
    <span className="baccarat-brand-lockup">
      <img src="/assets/brand/cleon-casino-mark.png" alt="" aria-hidden="true" />
      <span><strong>CLEOPATRA</strong><small>CASINO</small></span>
    </span>
  );
}

function BaccaratCard({ card, order = 0, side, concealed = false }) {
  const red = ["hearts", "diamonds"].includes(card.suit);
  return (
    <div
      className={`baccarat-card${red ? " is-red" : ""} is-dealt side-${side}${concealed ? " is-concealed" : ""}`}
      style={{ "--baccarat-card-order": order }}
      aria-label={concealed ? `Face-down ${side} card` : `${card.rank} of ${card.suit}`}
    >
      <span className="baccarat-card-inner">
        <span className="baccarat-card-face baccarat-card-front" aria-hidden={concealed ? "true" : undefined}>
          {!concealed && (
            <>
              <strong>{card.rank}</strong>
              <b aria-hidden="true">{SUIT_MARKS[card.suit]}</b>
              <i aria-hidden="true">{SUIT_MARKS[card.suit]}</i>
            </>
          )}
        </span>
        <span className="baccarat-card-face baccarat-card-back" aria-hidden="true">
          <img src="/assets/brand/cleon-casino-mark.png" alt="" />
        </span>
      </span>
    </div>
  );
}

function PeelControl({ side, cardNumber, cardTotal, onPeel }) {
  const [holding, setHolding] = useState(false);
  const holdRef = useRef(null);

  const cancel = () => {
    window.clearTimeout(holdRef.current);
    setHolding(false);
  };

  const start = (event) => {
    event.preventDefault();
    cancel();
    setHolding(true);
    holdRef.current = window.setTimeout(() => {
      setHolding(false);
      onPeel();
    }, 620);
  };

  useEffect(() => () => window.clearTimeout(holdRef.current), []);

  return (
    <button
      type="button"
      className={`baccarat-peel-control${holding ? " is-holding" : ""}`}
      onPointerDown={start}
      onPointerUp={cancel}
      onPointerLeave={cancel}
      onPointerCancel={cancel}
      onClick={(event) => { if (event.detail === 0) onPeel(); }}
      onContextMenu={(event) => event.preventDefault()}
      onDragStart={(event) => event.preventDefault()}
      aria-label={`Hold to peel ${side} card ${cardNumber}`}
    >
      <HandPalm size={17} weight="duotone" />
      <span><strong>HOLD TO PEEL</strong><small>{side.toUpperCase()} · CARD {cardNumber} OF {cardTotal}</small></span>
      <i aria-hidden="true"></i>
    </button>
  );
}

function BaccaratHand({ side, cards, active, revealedCount = 3, canPeel = false, activePeel = false, onPeel }) {
  const fullyRevealed = cards.length > 0 && revealedCount >= cards.length;
  const total = fullyRevealed ? baccaratHandTotal(cards) : null;
  return (
    <section className={`baccarat-hand is-${side}${active ? " is-active" : ""}${!fullyRevealed && cards.length ? " is-concealed" : ""}${activePeel ? " is-peel-turn" : ""}`} aria-label={`${side} hand${total === null ? cards.length ? `${Math.min(revealedCount, cards.length)} of ${cards.length} cards revealed` : " waiting" : ` total ${total}`}`}>
      <header>
        <span>{side.toUpperCase()}</span>
        <b>{total ?? (!fullyRevealed && cards.length ? "?" : "—")}</b>
      </header>
      <div className={`baccarat-card-row cards-${cards.length}`}>
        {cards.map((card, index) => <BaccaratCard key={`${card.rank}-${card.suit}-${index}`} card={card} order={index} side={side} concealed={index >= revealedCount} />)}
      </div>
      {canPeel && activePeel && revealedCount < cards.length && <PeelControl side={side} cardNumber={revealedCount + 1} cardTotal={cards.length} onPeel={onPeel} />}
    </section>
  );
}

function SideBetMark({ meta }) {
  if (!meta.asset) return null;
  return (
    <span className="baccarat-side-bet-mark" aria-hidden="true">
      <img src={meta.asset} alt="" />
      <b>{meta.badge}</b>
    </span>
  );
}

function WagerStack({ values, amount }) {
  if (!amount) return null;
  return (
    <span className="baccarat-wager-stack" aria-label={`${values.length} chips totaling ${formatPeso(amount)}`}>
      <span className="baccarat-stack-images" aria-hidden="true">
        {values.slice(-3).map((value, index) => (
          <img key={`${value}-${index}`} src={CHIP_SRC[value]} alt="" style={{ "--stack-index": index }} />
        ))}
      </span>
      <b>{formatPeso(amount).replace(".00", "")}</b>
      <small>{values.length}</small>
    </span>
  );
}

function BaccaratBetSpot({ id, values, amount, result, multiplier, selectedChip, disabled, stat, onAdd, onClear }) {
  const meta = BET_META[id];
  const won = Number(result || 0) > Number(amount || 0);
  const pushed = Number(result || 0) === Number(amount || 0) && amount > 0;
  const resultLabel = meta.group === "side" && multiplier
    ? `×${multiplier}`
    : won
      ? `+${formatPeso(result - amount).replace(".00", "")}`
      : "PUSH";

  return (
    <div className={`baccarat-bet-wrap is-${meta.group} spot-${meta.tone}${amount ? " has-bet" : ""}${won ? " is-win" : pushed ? " is-push" : ""}`}>
      {(won || pushed) && <span className="baccarat-spot-result">{resultLabel}</span>}
      <button
        type="button"
        className="baccarat-bet-spot"
        data-baccarat-target={id}
        disabled={disabled}
        onClick={() => onAdd(id, selectedChip)}
        onDragOver={(event) => { if (!disabled) event.preventDefault(); }}
        onDrop={(event) => {
          if (disabled) return;
          event.preventDefault();
          const value = Number(event.dataTransfer.getData("application/x-cleopatra-chip") || event.dataTransfer.getData("text/plain"));
          if (Number.isFinite(value)) onAdd(id, value);
        }}
        aria-label={`${meta.label} pays ${meta.odds}. ${amount ? `Bet ${formatPeso(amount)}.` : "No bet."} Tap or drop a chip to add.`}
      >
        <SideBetMark meta={meta} />
        <span>{meta.label}</span>
        <strong>{meta.odds}</strong>
        {meta.group === "main" && stat && (
          <span className="baccarat-bet-stat"><b>{stat.percent}%</b><small>{stat.count} RESULTS</small></span>
        )}
        <small>MAX {formatPeso(meta.max).replace(".00", "")}</small>
        <WagerStack values={values} amount={amount} />
      </button>
      {amount > 0 && !disabled && (
        <button type="button" className="baccarat-clear-spot" onClick={() => onClear(id)} aria-label={`Clear ${meta.label} bet`}>
          <X size={12} weight="bold" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}

function BaccaratRoadGrid({ cells, columns, kind, label }) {
  const cellMap = new Map(cells.map((cell) => [`${cell.row}:${cell.column}`, cell]));
  return (
    <div className={`baccarat-road-grid road-kind-${kind}`} style={{ "--road-columns": columns }} aria-label={label}>
      {Array.from({ length: columns * 6 }, (_, index) => {
        const row = index % 6;
        const column = Math.floor(index / 6);
        const cell = cellMap.get(`${row}:${column}`);
        return (
          <span key={`${row}-${column}`} className="baccarat-road-cell" style={{ gridRow: row + 1, gridColumn: column + 1 }}>
            {cell && (
              <i className={`road-mark mark-${cell.color ?? cell.outcome}`}>
                {kind === "bead" && (cell.outcome === "player" ? "P" : cell.outcome === "banker" ? "B" : "T")}
                {kind === "big" && cell.ties > 0 && <small>{cell.ties}</small>}
                {kind !== "derived" && cell.playerPair && <b className="pair-dot pair-player"></b>}
                {kind !== "derived" && cell.bankerPair && <b className="pair-dot pair-banker"></b>}
              </i>
            )}
          </span>
        );
      })}
    </div>
  );
}

function BaccaratRoadConsole({ rounds, shoeNumber, expanded, onToggle }) {
  const fitColumns = (cells, columns) => {
    const maxColumn = cells.reduce((max, cell) => Math.max(max, cell.column), 0);
    const firstColumn = Math.max(0, maxColumn - columns + 1);
    return cells.filter((cell) => cell.column >= firstColumn).map((cell) => ({ ...cell, column: cell.column - firstColumn }));
  };
  const bead = baccaratBeadPlate(rounds, 6, 12);
  const big = fitColumns(baccaratBigRoad(rounds, 6), 16);
  const bigEye = fitColumns(baccaratDerivedRoad(rounds, 1, 6), 12);
  const small = fitColumns(baccaratDerivedRoad(rounds, 2, 6), 12);
  const cockroach = fitColumns(baccaratDerivedRoad(rounds, 3, 6), 12);
  const counts = rounds.reduce((summary, round) => ({ ...summary, [round.outcome]: summary[round.outcome] + 1 }), { player: 0, banker: 0, tie: 0 });

  return (
    <section className={`baccarat-road-console${expanded ? " is-expanded" : " is-collapsed"}`} aria-label="Official Baccarat result roads">
      <button type="button" className="baccarat-road-toggle" onClick={onToggle} aria-expanded={expanded}>
        <span><ChartLineUp size={15} weight="duotone" /><strong>ROAD VIEW</strong></span>
        <small>CURRENT SHOE · RESULTS DO NOT PREDICT THE NEXT HAND</small>
        <b className="count-player">P {counts.player}</b>
        <b className="count-banker">B {counts.banker}</b>
        <b className="count-tie">T {counts.tie}</b>
        {expanded ? <CaretDown size={16} weight="bold" /> : <CaretUp size={16} weight="bold" />}
      </button>
      <div className="baccarat-road-console-content">
        <article className="baccarat-road-board bead-board">
          <header><span><Sun size={13} weight="duotone" /> BEAD PLATE</span><b>LAST {Math.min(rounds.length, 72)}</b></header>
          <BaccaratRoadGrid cells={bead} columns={12} kind="bead" label="Chronological bead plate" />
        </article>
        <article className="baccarat-road-board pattern-board">
          <header>
            <span><strong>SHOE #{shoeNumber}</strong><b className="count-player">P {counts.player}</b><b className="count-banker">B {counts.banker}</b><b className="count-tie">T {counts.tie}</b></span>
            <small>BIG ROAD · DERIVED ROADS</small>
          </header>
          <BaccaratRoadGrid cells={big} columns={16} kind="big" label="Baccarat Big Road" />
          <div className="baccarat-derived-roads">
            <div className="baccarat-derived-panel derived-big-eye"><small>BIG EYE</small><BaccaratRoadGrid cells={bigEye} columns={12} kind="derived" label="Big Eye Boy road" /></div>
            <div className="baccarat-derived-panel derived-small"><small>SMALL ROAD</small><BaccaratRoadGrid cells={small} columns={12} kind="derived" label="Small Road" /></div>
            <div className="baccarat-derived-panel derived-cockroach"><small>COCKROACH</small><BaccaratRoadGrid cells={cockroach} columns={12} kind="derived" label="Cockroach Pig road" /></div>
          </div>
        </article>
      </div>
    </section>
  );
}

function BaccaratTimerRing({ seconds }) {
  const progress = Math.max(0, Math.min(1, seconds / 12));
  return (
    <div className="baccarat-betting-clock" aria-label={`${seconds} seconds to place bets`}>
      <div className="baccarat-timer-ring" style={{ "--timer-progress": `${progress * 360}deg` }}>
        <strong>{seconds}</strong>
      </div>
      <span><i aria-hidden="true"></i> BETTING OPEN</span>
    </div>
  );
}

function BaccaratRules({ onClose }) {
  return (
    <div className="baccarat-rules-backdrop" role="presentation" onMouseDown={onClose}>
      <section className="baccarat-rules-modal" role="dialog" aria-modal="true" aria-label="Speed Baccarat rules" onMouseDown={(event) => event.stopPropagation()}>
        <header><span><Crown size={18} weight="fill" /> SPEED BACCARAT</span><button type="button" onClick={onClose} aria-label="Close rules"><X size={18} /></button></header>
        <div>
          <article><strong>Closest to 9</strong><p>Aces count 1, tens and face cards count 0, and only the final digit of each hand total matters.</p></article>
          <article><strong>Automatic tableau</strong><p>The opening two cards for each hand resolve first. Only after those four cards are revealed does the standard tableau decide whether Player, Banker, or both receive a third card. Naturals of 8 or 9 stand.</p></article>
          <article><strong>Main payouts</strong><p>Player pays 1:1. Banker pays 0.95:1 after the standard 5% commission. Tie pays 8:1 and pushes Player and Banker wagers.</p></article>
          <article><strong>Pair payouts</strong><p>Player Pair and Banker Pair each pay 11:1 when that hand&apos;s opening two cards share the same rank.</p></article>
          <article><strong>Panda 8 · 25:1</strong><p>Wins when the Player beats the Banker with a three-card total of 8.</p></article>
          <article><strong>Tiger 6 · 12:1 / 20:1</strong><p>Wins on a Banker total of 6: two cards pay 12:1 and three cards pay 20:1.</p></article>
          <article><strong>Tiger 7 · 40:1</strong><p>Wins when the Banker beats the Player with a three-card total of 7.</p></article>
          <article><strong>Heavenly 9 · 10:1 / 75:1</strong><p>One three-card 9 pays 10:1. Player and Banker both finishing with three-card 9 pays 75:1.</p></article>
          <article><strong>Cinematic pace</strong><p>Choose Cinematic, Live, or Turbo dealing. Cinematic stretches card arrivals and settlement for more suspense.</p></article>
          <article><strong>Card-by-card peel</strong><p>Enable Peel and choose Player or Banker first. Every physical card reveals separately; any required third card is dealt only after the opening four are exposed, then receives its own peel. Unpeeled cards reveal automatically.</p></article>
          <article><strong>Official road console</strong><p>The Bead Plate records results chronologically. The Big Road groups Player and Banker streaks, while Big Eye Boy, Small Road, and Cockroach Pig describe changes in the Big Road pattern. Roads reset with every new shoe and never predict the next hand.</p></article>
        </div>
      </section>
    </div>
  );
}

export function SpeedBaccarat({ balance, onBalanceChange, onBack, onHistory, onRoundSettled, soundOn, onToggleSound, cashierOpen = false, onCashier }) {
  const [phase, setPhase] = useState("betting");
  const [seconds, setSeconds] = useState(12);
  const [selectedChip, setSelectedChip] = useState(250);
  const [bets, setBets] = useState(emptyBets);
  const [lastBets, setLastBets] = useState(emptyBets);
  const [actions, setActions] = useState([]);
  const [playerCards, setPlayerCards] = useState([]);
  const [bankerCards, setBankerCards] = useState([]);
  const [roundResult, setRoundResult] = useState(null);
  const [settlement, setSettlement] = useState(null);
  const [message, setMessage] = useState("PLACE YOUR BETS");
  const [road, setRoad] = useState([]);
  const [shoeNumber, setShoeNumber] = useState(1);
  const [roadOpen, setRoadOpen] = useState(() => typeof window !== "undefined" && window.innerWidth <= 760);
  const [rulesOpen, setRulesOpen] = useState(false);
  const [paceId, setPaceId] = useState("cinematic");
  const [peelEnabled, setPeelEnabled] = useState(false);
  const [peelFirst, setPeelFirst] = useState("player");
  const [revealedCounts, setRevealedCounts] = useState({ player: 3, banker: 3 });
  const [nextPeelSide, setNextPeelSide] = useState(null);
  const shoeRef = useRef(createBaccaratShoe());
  const audioRef = useRef(null);
  const timersRef = useRef([]);
  const phaseRef = useRef("betting");
  const betsRef = useRef(bets);
  const balanceRef = useRef(balance);
  const paceRef = useRef("cinematic");
  const peelEnabledRef = useRef(false);
  const peelFirstRef = useRef("player");
  const revealedCountsRef = useRef(revealedCounts);
  const peelQueueRef = useRef([]);
  const peelCompleteRef = useRef(null);
  const peelAutoTimerRef = useRef(null);
  const peelNextRef = useRef(null);
  const roundRef = useRef(0);
  const startRoundRef = useRef(null);

  const betTotals = useMemo(() => Object.fromEntries(BACCARAT_BET_KEYS.map((key) => [key, totalStack(bets[key])])), [bets]);
  const totalBet = useMemo(() => Object.values(betTotals).reduce((sum, value) => sum + value, 0), [betTotals]);
  const bettingOpen = phase === "betting";

  useEffect(() => { betsRef.current = bets; }, [bets]);
  useEffect(() => { balanceRef.current = balance; }, [balance]);
  useEffect(() => { phaseRef.current = phase; }, [phase]);
  useEffect(() => { paceRef.current = paceId; }, [paceId]);
  useEffect(() => { peelEnabledRef.current = peelEnabled; }, [peelEnabled]);
  useEffect(() => { peelFirstRef.current = peelFirst; }, [peelFirst]);
  useEffect(() => { revealedCountsRef.current = revealedCounts; }, [revealedCounts]);

  const clearTimers = () => {
    timersRef.current.forEach((timer) => window.clearTimeout(timer));
    timersRef.current = [];
  };

  useEffect(() => () => {
    clearTimers();
    peelQueueRef.current = [];
    peelCompleteRef.current = null;
    audioRef.current?.close?.();
  }, []);

  const playSound = (type) => {
    if (!soundOn) return;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    if (!audioRef.current) audioRef.current = new AudioContext();
    const context = audioRef.current;
    context.resume?.().catch?.(() => {});
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const startsAt = context.currentTime;
    const isResult = type === "result";
    const isPeel = type === "peel";
    const duration = isResult ? 0.22 : isPeel ? 0.15 : 0.08;
    oscillator.type = isResult ? "sine" : "triangle";
    oscillator.frequency.setValueAtTime(isResult ? 520 : isPeel ? 245 : 180, startsAt);
    oscillator.frequency.exponentialRampToValueAtTime(isResult ? 780 : isPeel ? 480 : 92, startsAt + duration * 0.82);
    gain.gain.setValueAtTime(isResult ? 0.04 : isPeel ? 0.032 : 0.025, startsAt);
    gain.gain.exponentialRampToValueAtTime(0.0001, startsAt + duration);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(startsAt);
    oscillator.stop(startsAt + duration + 0.01);
  };

  const cyclePace = () => {
    if (!bettingOpen) return;
    setPaceId((current) => {
      const next = DEAL_PACE_ORDER[(DEAL_PACE_ORDER.indexOf(current) + 1) % DEAL_PACE_ORDER.length];
      paceRef.current = next;
      setMessage(`${DEAL_PACES[next].label} DEAL PACE`);
      return next;
    });
  };

  const togglePeel = () => {
    if (!bettingOpen) return;
    setPeelEnabled((current) => {
      const next = !current;
      peelEnabledRef.current = next;
      setMessage(next ? "CARD PEEL ARMED" : "CARD PEEL OFF");
      return next;
    });
  };

  const cyclePeelFirst = () => {
    if (!bettingOpen) return;
    setPeelFirst((current) => {
      const next = current === "player" ? "banker" : "player";
      peelFirstRef.current = next;
      setMessage(`${next.toUpperCase()} CARDS WILL PEEL FIRST`);
      return next;
    });
  };

  const addWager = (target, value = selectedChip) => {
    if (!bettingOpen || !BACCARAT_BET_KEYS.includes(target)) return;
    const amount = Number(value);
    const currentTotal = totalBets(betsRef.current);
    const targetTotal = totalStack(betsRef.current[target]);
    if (!Number.isFinite(amount) || amount <= 0) return;
    if (targetTotal + amount > BET_META[target].max) {
      setMessage(`${BET_META[target].label} LIMIT ${formatPeso(BET_META[target].max)}`);
      return;
    }
    if (currentTotal + amount > balanceRef.current) {
      setMessage("INSUFFICIENT PHP BALANCE");
      return;
    }
    setBets((current) => ({ ...current, [target]: [...current[target], amount] }));
    setActions((current) => [...current, target]);
    setMessage(`${BET_META[target].label} · ${formatPeso(targetTotal + amount)}`);
  };

  const clearSpot = (target) => {
    if (!bettingOpen) return;
    setBets((current) => ({ ...current, [target]: [] }));
    setActions((current) => current.filter((item) => item !== target));
    setMessage("BET CLEARED");
  };

  const clearAll = () => {
    if (!bettingOpen) return;
    setBets(emptyBets());
    setActions([]);
    setMessage("PLACE YOUR BETS");
  };

  const undo = () => {
    if (!bettingOpen || !actions.length) return;
    const target = actions[actions.length - 1];
    setBets((current) => ({ ...current, [target]: current[target].slice(0, -1) }));
    setActions((current) => current.slice(0, -1));
    setMessage("LAST CHIP REMOVED");
  };

  const repeatLast = () => {
    if (!bettingOpen) return;
    const repeatTotal = totalBets(lastBets);
    if (!repeatTotal) return;
    if (repeatTotal > balanceRef.current) {
      setMessage("INSUFFICIENT BALANCE TO REPEAT");
      return;
    }
    setBets(Object.fromEntries(BACCARAT_BET_KEYS.map((key) => [key, [...lastBets[key]]])));
    setActions(BACCARAT_BET_KEYS.flatMap((key) => lastBets[key].map(() => key)));
    setMessage(`REPEATED · ${formatPeso(repeatTotal)}`);
  };

  const drawCard = () => shoeRef.current.pop();

  const settleRound = ({ completedRound, fundedBets, fundedTotals, fundedTotal, startingBalance, roundId, pace }) => {
      const result = settleBaccaratBets(fundedTotals, completedRound);
      const returned = result.returned;
      const balanceAfter = Math.round((startingBalance - fundedTotal + returned) * 100) / 100;
      if (returned) onBalanceChange((current) => current + returned);
      setRoundResult(completedRound);
      setSettlement(result);
      setRoad((current) => [...current, completedRound]);
      playSound("result");
      const resultTotal = completedRound.outcome === "tie"
        ? `${completedRound.playerTotal} — ${completedRound.bankerTotal}`
        : completedRound[`${completedRound.outcome}Total`];
      setMessage(`${completedRound.outcome.toUpperCase()} WINS · ${resultTotal}`);
      setPhase("result");

      if (fundedTotal) {
        setLastBets(fundedBets);
        onRoundSettled?.({
          id: `baccarat-${roundId}-${Date.now()}`,
          game: "baccarat",
          lobby: "baccarat",
          mode: "speed",
          mainBet: fundedTotals.player + fundedTotals.banker + fundedTotals.tie,
          sideBets: BACCARAT_SIDE_BET_KEYS.reduce((sum, key) => sum + fundedTotals[key], 0),
          totalBet: fundedTotal,
          returned,
          net: result.net,
          outcome: completedRound.outcome,
          playerTotal: completedRound.playerTotal,
          dealerTotal: completedRound.bankerTotal,
          balanceAfter,
        });
      }

      const resetTimer = window.setTimeout(() => {
        setBets(emptyBets());
        setActions([]);
        setPlayerCards([]);
        setBankerCards([]);
        setRoundResult(null);
        setSettlement(null);
        revealedCountsRef.current = { player: 3, banker: 3 };
        setRevealedCounts({ player: 3, banker: 3 });
        setNextPeelSide(null);
        setSeconds(12);
        setMessage("PLACE YOUR BETS");
        setPhase("betting");
      }, pace.result);
      timersRef.current.push(resetTimer);
  };

  const scheduleAutoPeel = () => {
    window.clearTimeout(peelAutoTimerRef.current);
    const side = peelQueueRef.current[0];
    if (!side) return;
    const pace = DEAL_PACES[paceRef.current];
    const perCardWindow = Math.max(1800, Math.round(pace.peel / Math.max(2, peelQueueRef.current.length)));
    const timer = window.setTimeout(() => peelNextRef.current?.(side), perCardWindow);
    peelAutoTimerRef.current = timer;
    timersRef.current.push(timer);
  };

  const beginPeel = (queue, onComplete, stageLabel) => {
    if (!queue.length) {
      onComplete();
      return;
    }
    peelQueueRef.current = [...queue];
    peelCompleteRef.current = onComplete;
    phaseRef.current = "peeling";
    setPhase("peeling");
    setNextPeelSide(queue[0]);
    const cardNumber = revealedCountsRef.current[queue[0]] + 1;
    setMessage(`${stageLabel} · PEEL ${queue[0].toUpperCase()} CARD ${cardNumber}`);
    scheduleAutoPeel();
  };

  const revealNextCard = (side) => {
    if (phaseRef.current !== "peeling" || peelQueueRef.current[0] !== side) return;
    window.clearTimeout(peelAutoTimerRef.current);
    const nextCounts = { ...revealedCountsRef.current, [side]: revealedCountsRef.current[side] + 1 };
    revealedCountsRef.current = nextCounts;
    setRevealedCounts(nextCounts);
    playSound("peel");
    peelQueueRef.current = peelQueueRef.current.slice(1);

    if (peelQueueRef.current.length) {
      const nextSide = peelQueueRef.current[0];
      setNextPeelSide(nextSide);
      setMessage(`${side.toUpperCase()} CARD REVEALED · NEXT ${nextSide.toUpperCase()} CARD ${nextCounts[nextSide] + 1}`);
      scheduleAutoPeel();
      return;
    }

    const onComplete = peelCompleteRef.current;
    peelCompleteRef.current = null;
    setNextPeelSide(null);
    phaseRef.current = "tableau";
    setPhase("tableau");
    setMessage("OPENING CARDS REVEALED · CHECKING TABLEAU");
    const timer = window.setTimeout(() => onComplete?.(), DEAL_PACES[paceRef.current].settle);
    timersRef.current.push(timer);
  };

  peelNextRef.current = revealNextCard;

  const stageCards = (sequence, pace, onComplete, startingCardNumber = 0) => {
    phaseRef.current = "dealing";
    setPhase("dealing");
    sequence.forEach(({ side, card }, index) => {
      const timer = window.setTimeout(() => {
        const nextCard = { ...card, dealOrder: index };
        if (side === "player") setPlayerCards((current) => [...current, nextCard]);
        else setBankerCards((current) => [...current, nextCard]);
        playSound("card");
        const cardNumber = startingCardNumber + sequence.slice(0, index + 1).filter((item) => item.side === side).length;
        setMessage(`${side.toUpperCase()} CARD ${cardNumber} PLACED`);
      }, index * pace.card);
      timersRef.current.push(timer);
    });
    const completeAt = Math.max(520, sequence.length * pace.card + 220);
    const timer = window.setTimeout(onComplete, completeAt);
    timersRef.current.push(timer);
  };

  const continueTableau = (context) => {
    const completedRound = completeBaccaratRoundFromOpening(context.opening, drawCard);
    const settlementContext = { ...context, completedRound };
    if (!completedRound.thirdSequence.length) {
      setMessage("NO THIRD CARD · SETTLING ROUND");
      const timer = window.setTimeout(() => settleRound(settlementContext), context.pace.settle);
      timersRef.current.push(timer);
      return;
    }

    setMessage(`TABLEAU CALLS ${completedRound.thirdSequence.length === 2 ? "TWO THIRD CARDS" : `${completedRound.thirdSequence[0].side.toUpperCase()} THIRD CARD`}`);
    stageCards(completedRound.thirdSequence, context.pace, () => {
      if (!context.usePeel) {
        const timer = window.setTimeout(() => settleRound(settlementContext), context.pace.settle);
        timersRef.current.push(timer);
        return;
      }
      beginPeel(completedRound.thirdSequence.map((item) => item.side), () => settleRound(settlementContext), "THIRD CARD");
    }, 2);
  };

  const startRound = () => {
    if (phaseRef.current !== "betting") return;
    const fundedBets = Object.fromEntries(BACCARAT_BET_KEYS.map((key) => [key, [...betsRef.current[key]]]));
    const fundedTotals = Object.fromEntries(BACCARAT_BET_KEYS.map((key) => [key, totalStack(fundedBets[key])]));
    const fundedTotal = Object.values(fundedTotals).reduce((sum, value) => sum + value, 0);
    const startingBalance = balanceRef.current;
    if (fundedTotal > startingBalance) {
      setMessage("INSUFFICIENT PHP BALANCE");
      setSeconds(12);
      return;
    }

    clearTimers();
    peelQueueRef.current = [];
    peelCompleteRef.current = null;
    roundRef.current += 1;
    const roundId = roundRef.current;
    if (shoeRef.current.length < 60) {
      shoeRef.current = createBaccaratShoe();
      setShoeNumber((current) => current + 1);
      setRoad([]);
    }
    const opening = dealBaccaratOpening(drawCard);
    const pace = DEAL_PACES[paceRef.current];
    const usePeel = peelEnabledRef.current;
    const roundContext = { opening, fundedBets, fundedTotals, fundedTotal, startingBalance, roundId, pace, usePeel };
    phaseRef.current = "dealing";
    setPhase("dealing");
    setSeconds(0);
    setMessage(fundedTotal ? "NO MORE BETS" : "WATCHING LIVE ROUND");
    setPlayerCards([]);
    setBankerCards([]);
    setRoundResult(null);
    setSettlement(null);
    const openingRevealCounts = usePeel ? { player: 0, banker: 0 } : { player: 3, banker: 3 };
    revealedCountsRef.current = openingRevealCounts;
    setRevealedCounts(openingRevealCounts);
    setNextPeelSide(null);
    if (fundedTotal) onBalanceChange((current) => current - fundedTotal);

    stageCards(opening.sequence, pace, () => {
      if (!usePeel) {
        continueTableau(roundContext);
        return;
      }
      const first = peelFirstRef.current;
      const second = first === "player" ? "banker" : "player";
      beginPeel([first, first, second, second], () => continueTableau(roundContext), "OPENING CARDS");
    });
  };

  startRoundRef.current = startRound;

  useEffect(() => {
    if (phase !== "betting" || cashierOpen) return undefined;
    const timer = window.setInterval(() => {
      setSeconds((current) => {
        if (current > 1) return current - 1;
        window.clearInterval(timer);
        window.setTimeout(() => startRoundRef.current?.(), 0);
        return 0;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [phase, cashierOpen]);

  const playerActive = (phase === "dealing" && playerCards.length <= bankerCards.length) || (phase === "peeling" && nextPeelSide === "player");
  const bankerActive = (phase === "dealing" && bankerCards.length < playerCards.length) || (phase === "peeling" && nextPeelSide === "banker");
  const roadCounts = road.reduce((summary, round) => ({ ...summary, [round.outcome]: summary[round.outcome] + 1 }), { player: 0, banker: 0, tie: 0 });
  const roadTotal = Math.max(1, road.length);
  const mainStats = {
    player: { count: roadCounts.player, percent: Math.round((roadCounts.player / roadTotal) * 100) },
    tie: { count: roadCounts.tie, percent: Math.round((roadCounts.tie / roadTotal) * 100) },
    banker: { count: roadCounts.banker, percent: Math.round((roadCounts.banker / roadTotal) * 100) },
  };
  const positiveReturn = settlement && settlement.returned > settlement.totalBet;
  const winningSideBets = settlement
    ? BACCARAT_SIDE_BET_KEYS.filter((key) => betTotals[key] > 0 && settlement.multiplierByBet[key] > 0)
    : [];

  return (
    <main className={`baccarat-app phase-${phase} pace-${paceId}${peelEnabled ? " is-peel-enabled" : ""}${roadOpen ? " road-open" : " road-collapsed"}`}>
      <header className="baccarat-topbar">
        <div className="baccarat-topbar-left">
          <button type="button" className="baccarat-icon-button" onClick={onBack} disabled={!bettingOpen} aria-label="Return to Cleopatra Casino lobby"><ArrowLeft size={21} weight="bold" /></button>
          <BrandLockup />
          <div className="baccarat-balance" aria-label={`PHP balance ${formatPeso(balance)}`}><span>PHP BALANCE</span><strong>{formatPeso(balance)}</strong><PokerChip size={26} weight="duotone" /></div>
        </div>
        <div className="baccarat-mode-console">
          <div className="baccarat-mode-pill"><Lightning size={17} weight="fill" /><span><small>12 SECOND BETTING</small><strong>SPEED BACCARAT</strong></span></div>
          <button type="button" className="baccarat-experience-button" onClick={cyclePace} disabled={!bettingOpen} aria-label={`Deal pace ${DEAL_PACES[paceId].label}. Activate to change.`}>
            <Gauge size={18} weight="duotone" /><span><small>DEAL PACE</small><strong>{DEAL_PACES[paceId].label}</strong></span>
          </button>
          <button type="button" className={`baccarat-experience-button is-peel${peelEnabled ? " is-active" : ""}`} onClick={togglePeel} disabled={!bettingOpen} aria-pressed={peelEnabled}>
            <HandPalm size={18} weight="duotone" /><span><small>CARD REVEAL</small><strong>PEEL {peelEnabled ? "ON" : "OFF"}</strong></span>
          </button>
          <button type="button" className="baccarat-experience-button is-order" onClick={cyclePeelFirst} disabled={!bettingOpen || !peelEnabled} aria-label={`Peel ${peelFirst} cards first. Activate to change.`}>
            <ArrowsLeftRight size={18} weight="duotone" /><span><small>PEEL FIRST</small><strong>{peelFirst.toUpperCase()}</strong></span>
          </button>
        </div>
        <div className="baccarat-topbar-actions">
          <button type="button" className="baccarat-history-button" onClick={onHistory}><ClockCounterClockwise size={18} /> HISTORY</button>
          <button type="button" className="baccarat-cashier-button" onClick={() => onCashier?.(totalBet)} disabled={!bettingOpen || cashierOpen} aria-label="Open Cleopatra Cashier">
            <PokerChip size={19} weight="duotone" /><span>CASHIER</span>
          </button>
          <button type="button" className="baccarat-icon-button" onClick={onToggleSound} aria-label={soundOn ? "Mute sound" : "Enable sound"}>{soundOn ? <SpeakerHigh size={22} /> : <SpeakerSlash size={22} />}</button>
          <button type="button" className="baccarat-icon-button" onClick={() => setRulesOpen(true)} aria-label="Speed Baccarat rules"><Info size={22} /></button>
        </div>
      </header>

      <section className="baccarat-stage" aria-label="Cleopatra Speed Baccarat table">
        <picture className="baccarat-table-plate">
          <source media="(max-width: 760px)" srcSet="/assets/baccarat-table-3d-mobile-v2.png" />
          <img className="baccarat-table-background" src="/assets/baccarat-table-3d-v2.png" alt="Premium dimensional graphite Speed Baccarat table" />
        </picture>
        <div className="baccarat-table-shell" aria-hidden="true"><i></i><span></span><b></b></div>
        <div className="baccarat-live-badge"><span></span> SPEED BACCARAT</div>
        <div className={`baccarat-status status-${phase}`} role="status" aria-live="polite"><i></i>{message}</div>

        {bettingOpen && <BaccaratTimerRing seconds={seconds} />}

        <div className="baccarat-shoe" aria-label={`${shoeRef.current.length} cards remaining in the shoe`}>
          <CardsThree size={30} weight="duotone" /><span><small>8-DECK SHOE</small><strong>{shoeRef.current.length} CARDS</strong></span>
        </div>

        <div className="baccarat-hands">
          <BaccaratHand
            side="player"
            cards={playerCards}
            active={playerActive}
            revealedCount={revealedCounts.player}
            canPeel={phase === "peeling"}
            activePeel={nextPeelSide === "player"}
            onPeel={() => revealNextCard("player")}
          />
          <div className="baccarat-versus" aria-hidden="true"><span>VS</span></div>
          <BaccaratHand
            side="banker"
            cards={bankerCards}
            active={bankerActive}
            revealedCount={revealedCounts.banker}
            canPeel={phase === "peeling"}
            activePeel={nextPeelSide === "banker"}
            onPeel={() => revealNextCard("banker")}
          />
        </div>

        <div className="baccarat-table-brand" aria-label="Cleopatra Casino Speed Baccarat">
          <img src="/assets/brand/cleon-casino-mark.png" alt="" aria-hidden="true" />
          <span><strong>CLEOPATRA</strong><small>CASINO</small><em>SPEED BACCARAT</em></span>
        </div>

        <div className="baccarat-table-rules" aria-hidden="true"><strong>CLOSEST TO 9 WINS</strong><span>BANKER PAYS 0.95 TO 1 · TIE PAYS 8 TO 1</span></div>

        <div className="baccarat-bet-layout" aria-label="Speed Baccarat betting spots">
          <div className="baccarat-main-bet-row">
            {BACCARAT_MAIN_BET_KEYS.map((key) => (
              <BaccaratBetSpot
                key={key}
                id={key}
                values={bets[key]}
                amount={betTotals[key]}
                result={settlement?.returnedByBet[key]}
                multiplier={settlement?.multiplierByBet[key]}
                stat={mainStats[key]}
                selectedChip={selectedChip}
                disabled={!bettingOpen}
                onAdd={addWager}
                onClear={clearSpot}
              />
            ))}
          </div>
          <div className="baccarat-side-bet-console">
            <span className="baccarat-side-bet-label"><Crown size={12} weight="fill" /><b>ROYAL TREASURES</b><small>SIX LIVE MARKETS</small></span>
            <div className="baccarat-side-bet-row">
              {BACCARAT_SIDE_BET_KEYS.map((key) => (
                <BaccaratBetSpot
                  key={key}
                  id={key}
                  values={bets[key]}
                  amount={betTotals[key]}
                  result={settlement?.returnedByBet[key]}
                  multiplier={settlement?.multiplierByBet[key]}
                  selectedChip={selectedChip}
                  disabled={!bettingOpen}
                  onAdd={addWager}
                  onClear={clearSpot}
                />
              ))}
            </div>
          </div>
        </div>

        <BaccaratRoadConsole rounds={road} shoeNumber={shoeNumber} expanded={roadOpen} onToggle={() => setRoadOpen((current) => !current)} />

        {roundResult && (
          <div className={`baccarat-result-banner result-${roundResult.outcome}`} role="status" aria-live="assertive">
            <span><small>ROUND RESULT</small><strong>{roundResult.outcome.toUpperCase()} WINS</strong></span>
            <b>{roundResult.outcome === "player" ? roundResult.playerTotal : roundResult.outcome === "banker" ? roundResult.bankerTotal : `${roundResult.playerTotal} — ${roundResult.bankerTotal}`}</b>
          </div>
        )}

        {winningSideBets.length > 0 && (
          <div className="baccarat-side-win-ribbon" role="status" aria-live="assertive">
            <Crown size={17} weight="fill" />
            <span><small>TREASURE WIN</small><strong>{winningSideBets.map((key) => `${BET_META[key].label} ×${settlement.multiplierByBet[key]}`).join(" · ")}</strong></span>
          </div>
        )}

        {positiveReturn && (
          <div className="baccarat-total-win" role="status" aria-live="assertive">
            <Trophy size={25} weight="fill" /><span><small>TOTAL RETURN</small><strong>{formatPeso(settlement.returned)}</strong></span>
          </div>
        )}
      </section>

      <section className="baccarat-dock" aria-label="Speed Baccarat controls">
        <div className="baccarat-dock-copy"><span>SELECT A CHIP · TAP A BETTING SPOT</span><strong>TOTAL {formatPeso(totalBet)}</strong></div>
        <div className="baccarat-chip-row">
          <button type="button" className="baccarat-dock-action" onClick={undo} disabled={!bettingOpen || !actions.length} aria-label="Undo last chip"><ArrowCounterClockwise size={18} /></button>
          {CHIP_VALUES.map((value) => (
            <button
              key={value}
              type="button"
              className={`baccarat-chip${selectedChip === value ? " is-selected" : ""}`}
              onClick={() => setSelectedChip(value)}
              draggable={bettingOpen}
              onDragStart={(event) => {
                event.dataTransfer.setData("application/x-cleopatra-chip", String(value));
                event.dataTransfer.setData("text/plain", String(value));
              }}
              disabled={!bettingOpen}
              aria-label={`Select ${formatPeso(value)} chip`}
            >
              <img src={CHIP_SRC[value]} alt="" />
              <span>{formatPeso(value).replace(".00", "")}</span>
            </button>
          ))}
          <button type="button" className="baccarat-dock-action" onClick={clearAll} disabled={!bettingOpen || !totalBet} aria-label="Clear all Baccarat bets"><Trash size={18} /></button>
        </div>
        <div className="baccarat-primary-actions">
          <button type="button" className="baccarat-repeat" onClick={repeatLast} disabled={!bettingOpen || !totalBets(lastBets)}><Repeat size={18} weight="bold" /> REPEAT</button>
          <button type="button" className="baccarat-deal" onClick={startRound} disabled={!bettingOpen || !totalBet}><Play size={18} weight="fill" /> DEAL NOW</button>
        </div>
      </section>

      {rulesOpen && <BaccaratRules onClose={() => setRulesOpen(false)} />}
    </main>
  );
}
