import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowDown,
  ArrowCounterClockwise,
  ArrowUp,
  ArrowsLeftRight,
  CaretRight,
  CaretUp,
  CardsThree,
  ChartLineUp,
  CheckCircle,
  CircleDashed,
  ClockCounterClockwise,
  Copy,
  Crown,
  DownloadSimple,
  Eye,
  EyeSlash,
  FireSimple,
  Gauge,
  Gear,
  HandPalm,
  Hourglass,
  Lightning,
  LinkSimple,
  List,
  Play,
  Plus,
  PokerChip,
  Question,
  QrCode,
  Receipt,
  Robot,
  Seal,
  SpeakerHigh,
  SpeakerSlash,
  SpinnerGap,
  StackSimple,
  Timer,
  Trash,
  TrendDown,
  TrendUp,
  Trophy,
  User,
  UsersThree,
  X,
} from "@phosphor-icons/react";
import {
  aiDecision,
  compareHand,
  createShoe,
  dealerShouldHit,
  evaluate21Plus3,
  evaluateBustIt,
  evaluateHotThree,
  evaluatePerfectPairs,
  formatPeso,
  handValue,
  hiLoCountValue,
  isBlackjack,
  isHandComplete,
  isPair,
  isSixCardCharlie,
  naturalBlackjackTableFlow,
  openingDealTargets,
  payoutFor,
  qualifiesFreeDouble,
  qualifiesFreeSplit,
  rightToLeftSeatIndices,
  sideBetReturn,
  soloBettingExpiry,
  timeoutDecision,
  winStreakFromHistory,
} from "./game.js";

const SUIT_MARKS = {
  spades: "♠",
  hearts: "♥",
  diamonds: "♦",
  clubs: "♣",
};

const BETS = [100, 250, 500, 1000, 2500, 5000, 10000];
const DECK_OPTIONS = [2, 6, 8];
const MAX_BET = 250000;
const SIDE_BET_MAX = 10000;
const CASHIER_MAX = 500000;
const DEAL_SPEEDS = {
  slow: { label: "SLOW", step: 360, card: 1180, reveal: 1700, dealerGap: 1500, settle: 900, transition: 820, max: 8500 },
  normal: { label: "NORMAL", step: 220, card: 880, reveal: 1150, dealerGap: 1050, settle: 680, transition: 620, max: 6200 },
  turbo: { label: "TURBO", step: 85, card: 480, reveal: 620, dealerGap: 520, settle: 380, transition: 300, max: 2600 },
};
const DEAL_SPEED_ORDER = ["normal", "turbo", "slow"];
const ROUND_LOCKED_PHASES = ["dealing", "ai-turn", "playing", "dealer"];
const EMPTY_STATS = { rounds: 0, totalWagered: 0, totalWins: 0, netRevenue: 0, winRate: 0 };
const AI_NAMES = ["Nova", "Rook", "Ace", "Knight", "Mika", "Seven"];
const CHIP_SRC = Object.fromEntries(BETS.map((value) => [
  value,
  `/assets/chips/chip-${value}.${value >= 1000 ? "svg" : "png"}`,
]));
const DEAL_VECTORS = [
  { x: "72vw", y: "-44vh", spin: "-26deg" },
  { x: "57vw", y: "-51vh", spin: "-19deg" },
  { x: "41vw", y: "-57vh", spin: "-12deg" },
  { x: "26vw", y: "-51vh", spin: "14deg" },
  { x: "12vw", y: "-44vh", spin: "21deg" },
  { x: "5vw", y: "-38vh", spin: "27deg" },
];
const CHIP_FLIGHT_TARGETS = [
  { left: "13.5%", top: "70%" },
  { left: "30.5%", top: "78%" },
  { left: "47%", top: "83%" },
  { left: "63.5%", top: "78%" },
  { left: "79%", top: "70%" },
  { left: "90%", top: "63%" },
];
const SIDE_BET_FLIGHT_TARGETS = {
  main: { left: "50%", top: "85%" },
  hotThree: { left: "34%", top: "84%" },
  twentyOneThree: { left: "43%", top: "85%" },
  perfectPairs: { left: "57%", top: "85%" },
  bustIt: { left: "66%", top: "84%" },
};
const SIDE_BET_KEYS = ["hotThree", "twentyOneThree", "perfectPairs", "bustIt"];
const SIDE_BET_LABELS = {
  hotThree: "HOT 3",
  twentyOneThree: "21+3",
  perfectPairs: "PERFECT PAIRS",
  bustIt: "BUST IT",
};
const WIN_STREAK_KEY = "cleopatra-win-streak";
const LEGACY_WIN_STREAK_KEY = "cleon-win-streak";
const emptySideBetStacks = () => Object.fromEntries(SIDE_BET_KEYS.map((key) => [key, []]));
const emptySideBets = () => Object.fromEntries(
  SIDE_BET_KEYS.map((key) => [key, { stake: 0, result: null, returned: 0 }]),
);
const PAYMENT_METHODS = [
  { id: "gcash", label: "GCash", helper: "Mobile wallet", logo: "/assets/gcash-logo.svg", tone: "gcash" },
  { id: "maya", label: "Maya", helper: "Wallet & bank", logo: "/assets/maya-logo.svg", tone: "maya" },
  { id: "bank", label: "QR Ph", helper: "Online bank · InstaPay", logo: "/assets/qr-ph-logo.svg", tone: "bank" },
];

const card = (rank, suit) => ({ rank, suit });

const readWinStreak = () => {
  if (typeof window === "undefined") return 0;
  try {
    const currentValue = window.localStorage.getItem(WIN_STREAK_KEY);
    const legacyValue = window.localStorage.getItem(LEGACY_WIN_STREAK_KEY);
    return Math.max(0, Number(currentValue ?? legacyValue) || 0);
  } catch {
    return 0;
  }
};

const persistWinStreak = (value) => {
  try {
    window.localStorage.setItem(WIN_STREAK_KEY, String(value));
  } catch {
    // The in-memory streak remains available when storage is blocked.
  }
};

function displayHand(id, cards, bet = 250, action = "") {
  return {
    id,
    cards,
    bet,
    paidStake: 0,
    freeStake: 0,
    state: "done",
    action,
    outcome: "",
  };
}

function decomposeBet(amount) {
  const chips = [];
  let remaining = Math.max(0, Math.round(amount));

  for (const value of [...BETS].reverse()) {
    while (remaining >= value && chips.length < 12) {
      chips.push(value);
      remaining -= value;
    }
  }

  return chips.length ? chips : amount > 0 ? [BETS[0]] : [];
}

function ChipAsset({ value, className = "", style, alt = "" }) {
  return <img className={className} style={style} src={CHIP_SRC[value] ?? CHIP_SRC[250]} alt={alt} draggable="false" />;
}

function BetStack({ values, total, compact = false }) {
  const visible = values.slice(-4);
  const chipCount = values.length;

  return (
    <div className={`bet-stack${compact ? " is-compact" : ""}`} aria-label={`Bet ${formatPeso(total)}, ${chipCount} ${chipCount === 1 ? "chip" : "chips"}`}>
      <div className="bet-stack-chips" aria-hidden="true">
        {visible.map((value, index) => (
          <ChipAsset key={`${value}-${index}`} value={value} className="stack-chip" style={{ "--stack-index": index, "--stack-rotate": `${(index - 1) * 4}deg` }} />
        ))}
      </div>
      <span className="bet-chip-count" aria-hidden="true"><b>{chipCount}</b><small>{chipCount === 1 ? "CHIP" : "CHIPS"}</small></span>
      <strong>{formatPeso(total).replace(".00", "")}</strong>
    </div>
  );
}

function BettingSpot({ id, label, odds, Icon, values, total, result, dragging, disabled, onPlace, onClear }) {
  const interactive = !disabled;

  return (
    <div
      className={`betting-spot spot-${id}${dragging ? " is-drop-ready" : ""}${total > 0 ? " has-bet" : ""}${result?.result ? " has-result" : ""}${!interactive ? " is-disabled" : ""}`}
      data-testid={`betting-spot-${id}`}
      data-bet-target={id === "hot-three" ? "hotThree" : id === "twenty-one-three" ? "twentyOneThree" : id === "perfect-pairs" ? "perfectPairs" : "bustIt"}
      onDragOver={(event) => {
        if (!interactive) return;
        event.preventDefault();
        event.dataTransfer.dropEffect = "copy";
      }}
      onDrop={(event) => {
        if (!interactive) return;
        event.preventDefault();
        const value = Number(event.dataTransfer.getData("application/x-blackjack-chip") || event.dataTransfer.getData("text/plain"));
        if (Number.isFinite(value)) onPlace(value);
      }}
    >
      <button
        type="button"
        className="betting-spot-action"
        disabled={!interactive}
        aria-label={`${label} betting spot. ${odds}. ${total ? `Bet ${formatPeso(total)}.` : "No bet."} ${interactive ? "Tap or drop a chip to add." : "Betting is closed."}`}
        onClick={() => onPlace()}
      >
        <span className="betting-spot-ring" aria-hidden="true">
          <Icon size={12} weight="duotone" />
          <strong>
            {label === "PERFECT PAIRS" ? <>PERFECT<br />PAIRS</>
              : label === "BUST IT" ? <>BUST<br />IT</>
                : label}
          </strong>
          <span>{odds}</span>
        </span>
        {total > 0 ? <BetStack values={values} total={total} compact /> : <small>DROP CHIP</small>}
        {result?.stake > 0 && (
          <b className={`side-bet-result${result.result?.push ? " is-push" : result.returned > 0 ? " is-win" : ""}`}>
            <span className="side-bet-result-full">
              {result.result?.push
                ? "PUSH · BET RETURNED"
                : result.returned > 0
                  ? `${result.result.label} +${formatPeso(result.returned - result.stake)}`
                  : "NO WIN"}
            </span>
            <span className="side-bet-result-compact">
              {result.result?.push
                ? "PUSH"
                : result.returned > 0
                  ? `WIN +${formatPeso(result.returned - result.stake).replace(".00", "")}`
                  : "NO WIN"}
            </span>
          </b>
        )}
      </button>
      {total > 0 && interactive && (
        <button
          type="button"
          className="spot-clear"
          aria-label={`Clear ${label} bet`}
          onClick={(event) => {
            event.stopPropagation();
            onClear();
          }}
        >
          <X size={13} weight="bold" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}

function WinStreakBadge({ value, compact = false }) {
  return (
    <div className={`win-streak-badge${value > 0 ? " is-active" : ""}${compact ? " is-compact" : ""}`} aria-label={`${value} round win streak`}>
      <Trophy size={compact ? 14 : 16} weight={value > 0 ? "fill" : "duotone"} aria-hidden="true" />
      <strong>{value}</strong>
    </div>
  );
}

const INITIAL_SEATS = [
  { id: "seat-1", role: "ai", name: "Nova", hands: [displayHand("show-1", [card("10", "clubs"), card("5", "diamonds")])] },
  { id: "seat-2", role: "ai", name: "Rook", hands: [displayHand("show-2", [card("9", "spades"), card("9", "hearts")])] },
  { id: "seat-3", role: "you", name: "You", hands: [displayHand("show-3", [card("K", "spades"), card("Q", "diamonds")])] },
  { id: "seat-4", role: "ai", name: "Ace", hands: [displayHand("show-4", [card("8", "clubs"), card("9", "diamonds")])] },
  { id: "seat-5", role: "ai", name: "Knight", hands: [displayHand("show-5", [card("7", "spades"), card("2", "hearts")], 250, "FREE DOUBLE")] },
  { id: "seat-6", role: "empty", name: "Empty", hands: [] },
];

const INITIAL_GAME = {
  phase: "betting",
  message: "PLACE YOUR BETS",
  dealer: {
    cards: [card("A", "diamonds"), card("2", "spades"), card("2", "clubs"), card("6", "hearts")],
    hidden: false,
  },
  seats: INITIAL_SEATS,
  activeSeat: null,
  activeHand: 0,
  round: 0,
  sideBets: emptySideBets(),
};

function copyGame(game) {
  return {
    ...game,
    dealer: { ...game.dealer, cards: [...game.dealer.cards] },
    sideBets: Object.fromEntries(SIDE_BET_KEYS.map((key) => [
      key,
      { ...(game.sideBets?.[key] ?? { stake: 0, result: null, returned: 0 }) },
    ])),
    seats: game.seats.map((seat) => ({
      ...seat,
      hands: seat.hands.map((hand) => ({ ...hand, cards: [...hand.cards] })),
    })),
  };
}

function PlayingCard({ value, hidden = false, index = 0, targetSeat = null, isDealer = false }) {
  const isRed = value && ["hearts", "diamonds"].includes(value.suit);
  const vector = isDealer ? { x: "28vw", y: "-14vh", spin: "18deg" } : DEAL_VECTORS[targetSeat] ?? DEAL_VECTORS[2];
  const hasMotion = Number.isFinite(value?.motionOrder);

  return (
    <div
      className={`playing-card${hidden ? " card-back" : ""}${isRed ? " is-red" : ""}${hasMotion ? " is-dealt" : ""}`}
      style={{
        "--card-index": index,
        "--card-rest-rotate": `${(index - 1) * 1.7}deg`,
        "--deal-delay": `${value?.motionDelay ?? 0}ms`,
        "--deal-x": vector.x,
        "--deal-y": vector.y,
        "--deal-spin": vector.spin,
      }}
      aria-label={hidden ? "Face-down dealer card" : `${value.rank} of ${value.suit}`}
    >
      {hidden ? (
        <CardsThree size={24} weight="duotone" aria-hidden="true" />
      ) : (
        <>
          <span className="card-rank">{value.rank}</span>
          <span className="card-suit" aria-hidden="true">{SUIT_MARKS[value.suit]}</span>
        </>
      )}
    </div>
  );
}

function BrandLockup({ compact = false }) {
  return (
    <span className={`brand-lockup${compact ? " is-compact" : ""}`}>
      <img src="/assets/brand/cleon-casino-mark.png" alt="" aria-hidden="true" />
      <span>
        <strong>CLEOPATRA</strong>
        <small>CASINO</small>
      </span>
    </span>
  );
}

function PaymentBrand({ provider, compact = false }) {
  return (
    <span className={`payment-brand${compact ? " is-compact" : ""}`} aria-hidden="true">
      <img src={provider.logo} alt="" />
    </span>
  );
}

function PaymentQr({ provider, reference }) {
  const size = 21;
  const seed = [...`${provider.id}-${reference}`].reduce((total, character) => ((total * 33) + character.charCodeAt(0)) >>> 0, 17);
  const finderValue = (x, y, originX, originY) => {
    const localX = x - originX;
    const localY = y - originY;
    if (localX < 0 || localX > 6 || localY < 0 || localY > 6) return null;
    return localX === 0 || localX === 6 || localY === 0 || localY === 6 || (localX >= 2 && localX <= 4 && localY >= 2 && localY <= 4);
  };
  const cells = [];

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const finder = finderValue(x, y, 0, 0) ?? finderValue(x, y, size - 7, 0) ?? finderValue(x, y, 0, size - 7);
      const filled = finder ?? (((x * 17) + (y * 29) + seed + ((x * y) % 11)) % 5 < 2);
      if (filled) cells.push(<rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" rx="0.08" />);
    }
  }

  return (
    <div className="payment-qr" aria-label={`${provider.label} deposit QR request`}>
      <svg viewBox={`-2 -2 ${size + 4} ${size + 4}`} role="img" aria-hidden="true">{cells}</svg>
      <span><PaymentBrand provider={provider} compact /></span>
    </div>
  );
}

function LiveStats({ stats, compact = false }) {
  const items = [
    { label: "TOTAL WINS", value: formatPeso(stats.totalWins), Icon: Trophy, tone: "win" },
    { label: "NET REVENUE", value: `${stats.netRevenue >= 0 ? "+" : "−"}${formatPeso(Math.abs(stats.netRevenue))}`, Icon: stats.netRevenue >= 0 ? TrendUp : TrendDown, tone: stats.netRevenue >= 0 ? "win" : "loss" },
    { label: "ROUNDS", value: stats.rounds.toLocaleString("en-PH"), Icon: Receipt, tone: "neutral" },
    { label: "WIN RATE", value: `${stats.winRate}%`, Icon: ChartLineUp, tone: "neutral" },
  ];

  return (
    <div className={`live-stats${compact ? " is-compact" : ""}`} aria-label="Cleopatra session statistics">
      {items.map(({ label, value, Icon, tone }) => (
        <div key={label} className={`live-stat tone-${tone}`}>
          <Icon size={compact ? 15 : 17} weight="duotone" aria-hidden="true" />
          <span><small>{label}</small><strong>{value}</strong></span>
        </div>
      ))}
    </div>
  );
}

function DecisionClock({ seconds, limit, label = "DECISION" }) {
  const progress = Math.max(0, Math.min(1, seconds / limit));
  return (
    <div className={`decision-clock${seconds <= 3 ? " is-urgent" : ""}`} style={{ "--timer-progress": `${progress * 360}deg` }} aria-label={`${label}: ${seconds} seconds remaining`}>
      <span><Timer size={16} weight="duotone" aria-hidden="true" /><b>{seconds}</b></span>
      <small>{label}</small>
    </div>
  );
}

function SoloBettingPrompt({
  seconds,
  selectedChip,
  selectedBet,
  disabled,
  onChip,
  onChipPointerDown,
  onChipPointerMove,
  onChipPointerUp,
  onChipPointerCancel,
  onUndo,
  onDouble,
}) {
  return (
    <div className="solo-betting-prompt" role="status" aria-label={`Place your bets. ${seconds} seconds shown on the betting clock.`}>
      <strong>PLACE YOUR BETS</strong>
      <div className="solo-bet-timer" style={{ "--bet-progress": `${(seconds / 12) * 100}%` }}>
        <span></span>
        <b>{seconds}</b>
      </div>
      <div className="solo-chip-rack" aria-label="Solo table chip rack">
        <button type="button" className="solo-rack-action" onClick={onUndo} disabled={disabled || selectedBet <= 0}>
          <ArrowCounterClockwise size={22} weight="bold" aria-hidden="true" />
          <small>UNDO</small>
        </button>
        {BETS.map((bet) => (
          <button
            key={bet}
            type="button"
            className={`solo-rack-chip${selectedChip === bet ? " is-active" : ""}`}
            onClick={(event) => onChip(event, bet)}
            onPointerDown={(event) => onChipPointerDown(event, bet)}
            onPointerMove={onChipPointerMove}
            onPointerUp={onChipPointerUp}
            onPointerCancel={onChipPointerCancel}
            disabled={disabled}
            aria-label={`Add ${formatPeso(bet)} chip to the main bet. Drag to a betting circle.`}
          >
            <ChipAsset value={bet} className="solo-chip-asset" />
            <small>{formatPeso(bet).replace(".00", "")}</small>
          </button>
        ))}
        <button type="button" className="solo-rack-action" onClick={onDouble} disabled={disabled || selectedBet <= 0}>
          <b>×2</b>
          <small>DOUBLE</small>
        </button>
      </div>
    </div>
  );
}

function CasinoLobby({ stats, dailyPlayers, onEnter, onHistory }) {
  const tables = [
    {
      id: "solo",
      eyebrow: "SOLO LIVE TABLE",
      title: "CLEOPATRA ONE",
      copy: "A focused dealer-versus-you table with a full 12-second decision window for every move.",
      timer: "12 SEC",
      minimum: "₱100 MIN",
      players: `${dailyPlayers} TODAY`,
      accent: "mint",
    },
    {
      id: "arena",
      eyebrow: "MULTI-SEAT ARENA",
      title: "CLEOPATRA ROYALE",
      copy: "Choose any seat, watch every AI decision, and queue your next move before your turn arrives.",
      timer: "10 SEC",
      minimum: "₱100 MIN",
      players: "6 SEATS",
      accent: "coral",
    },
  ];

  return (
    <main className="casino-lobby">
      <header className="lobby-topbar">
        <BrandLockup />
        <div className="lobby-actions">
          <button type="button" className="history-button" onClick={onHistory}><ClockCounterClockwise size={19} /> BET HISTORY</button>
          <span className="lobby-balance-note"><UsersThree size={18} weight="duotone" /> {dailyPlayers} SOLO PLAYERS TODAY</span>
        </div>
      </header>

      <section className="lobby-hero">
        <div className="lobby-hero-copy">
          <span className="lobby-kicker"><Crown size={17} weight="fill" /> CLEOPATRA LIVE BLACKJACK</span>
          <h1>Choose your table.<br />Own every decision.</h1>
          <p>Classic and Free Bet blackjack with Evolution-style pacing, tracked PHP results, and a persistent round ledger.</p>
          <LiveStats stats={stats} />
        </div>
        <div className="lobby-brand-orbit" aria-hidden="true">
          <span className="orbit orbit-one"></span>
          <span className="orbit orbit-two"></span>
          <img src="/assets/brand/cleon-casino-mark.png" alt="" />
          <b>LIVE</b>
        </div>
      </section>

      <section className="lobby-tables" aria-label="Cleopatra blackjack tables">
        <div className="lobby-section-heading">
          <div><span>LIVE NOW</span><h2>Blackjack tables</h2></div>
          <p>Both tables include Hot 3, 21+3, Perfect Pairs, and Bust It side bets.</p>
        </div>
        <div className="table-card-grid">
          {tables.map((table) => (
            <article key={table.id} className={`lobby-table-card accent-${table.accent}`}>
              <div className="table-card-preview">
                <div className="mini-table-felt">
                  <img src="/assets/brand/cleon-casino-mark.png" alt="" aria-hidden="true" />
                  <span>{table.title}</span>
                </div>
                <span className="live-pill"><i></i> LIVE</span>
              </div>
              <div className="table-card-content">
                <span>{table.eyebrow}</span>
                <h3>{table.title}</h3>
                <p>{table.copy}</p>
                <div className="table-card-meta">
                  <b><Timer size={16} /> {table.timer}</b>
                  <b><PokerChip size={16} /> {table.minimum}</b>
                  <b><UsersThree size={16} /> {table.players}</b>
                </div>
                <button type="button" onClick={() => onEnter(table.id)}>
                  <Play size={19} weight="fill" /> ENTER TABLE <CaretRight size={18} weight="bold" />
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

function HistoryModal({ history, stats, onClose }) {
  const [filter, setFilter] = useState("all");
  const visibleHistory = history.filter((round) => filter === "all" || (filter === "wins" ? round.net > 0 : round.net <= 0));
  const dateFormatter = new Intl.DateTimeFormat("en-PH", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

  return (
    <Modal title="Bet history" onClose={onClose} className="history-modal">
      <div className="history-summary">
        <LiveStats stats={stats} compact />
        <div className="history-filters" role="tablist" aria-label="History filter">
          {[{ id: "all", label: "ALL" }, { id: "wins", label: "WINS" }, { id: "other", label: "PUSH / LOSS" }].map((item) => (
            <button key={item.id} type="button" className={filter === item.id ? "is-active" : ""} onClick={() => setFilter(item.id)}>{item.label}</button>
          ))}
        </div>
      </div>
      <div className="history-ledger">
        <div className="history-ledger-head"><span>ROUND</span><span>WAGER</span><span>RETURN</span><span>NET</span><span>BALANCE</span></div>
        {visibleHistory.length ? visibleHistory.map((round) => (
          <article key={round.id} className={`history-row${round.net > 0 ? " is-win" : round.net === 0 ? " is-push" : " is-loss"}`}>
            <div>
              <b>{String(round.outcome).toUpperCase()}</b>
              <small>{dateFormatter.format(new Date(round.createdAt))} · {round.lobby === "solo" ? "SOLO" : "ARENA"} · {String(round.mode).toUpperCase()}</small>
            </div>
            <strong>{formatPeso(round.totalBet)}</strong>
            <strong>{formatPeso(round.returned)}</strong>
            <strong>{round.net >= 0 ? "+" : "−"}{formatPeso(Math.abs(round.net))}</strong>
            <strong>{formatPeso(round.balanceAfter)}</strong>
          </article>
        )) : (
          <div className="history-empty"><Receipt size={34} weight="duotone" /><strong>No rounds in this view</strong><p>Your settled wagers will appear here automatically.</p></div>
        )}
      </div>
    </Modal>
  );
}

function Hand({ hand, hiddenCard = false, concealTotal = false, totalPending = false, hideStatus = false, isActive = false, targetSeat = null, isDealer = false }) {
  const hasCards = hand.cards.length > 0;
  const totalIsHidden = hiddenCard || concealTotal || !hasCards;
  const value = totalIsHidden ? null : handValue(hand.cards);
  const hiddenLabel = hiddenCard || isDealer ? "Dealer total hidden" : "Hand total pending first card";

  return (
    <div className={`hand${isActive ? " is-active" : ""}`}>
      <span className={`hand-total${totalIsHidden ? " is-concealed" : ""}`} aria-label={totalIsHidden ? hiddenLabel : `Hand total ${value.total}`}>
        {totalIsHidden ? (totalPending && !hiddenCard ? "—" : "?") : value.soft && value.total < 21 ? `${value.total - 10} / ${value.total}` : value.total}
      </span>
      <div className="card-fan">
        {hand.cards.map((item, index) => (
          <PlayingCard
            key={`${item.rank}-${item.suit}-${index}`}
            value={item}
            hidden={hiddenCard && index === 1}
            index={index}
            targetSeat={targetSeat}
            isDealer={isDealer}
          />
        ))}
      </div>
      {!hideStatus && (hand.action || hand.outcome) && (
        <span className={`hand-status ${hand.outcome || "feature"}`}>
          {hand.outcome ? hand.outcome.toUpperCase() : hand.action}
        </span>
      )}
    </div>
  );
}

function SeatSelector({ activeRole, onChoose }) {
  const options = [
    { id: "you", label: "YOU", Icon: User },
    { id: "ai", label: "AI", Icon: Robot },
    { id: "empty", label: "EMPTY", Icon: CircleDashed },
  ];

  return (
    <div className="seat-selector" role="menu" aria-label="Choose seat occupant" onClick={(event) => event.stopPropagation()}>
      {options.map(({ id, label, Icon }) => (
        <button
          key={id}
          type="button"
          className={activeRole === id ? "is-selected" : ""}
          onClick={() => onChoose(id)}
          role="menuitem"
        >
          <Icon size={18} weight={id === activeRole ? "fill" : "regular"} aria-hidden="true" />
          {label}
        </button>
      ))}
    </div>
  );
}

function Seat({ seat, index, game, selected, onSelect, onRoleChange, pendingBet, pendingChips, draggingChip, onBetDrop, decisionSeconds, decisionLimit }) {
  const active = game.activeSeat === index;
  const canConfigure = ["betting", "settled"].includes(game.phase);
  const roundStake = seat.hands.reduce((sum, hand) => sum + (hand.paidStake || 0) + (hand.freeStake || 0), 0);
  const shownBet = seat.role === "you" && canConfigure
    ? pendingBet
    : roundStake || seat.hands[0]?.bet || 0;
  const shownChips = seat.role === "you" && canConfigure ? pendingChips : decomposeBet(shownBet);

  return (
    <div
      role="button"
      tabIndex={0}
      className={`table-seat seat-${index} role-${seat.role}${active ? " is-turn" : ""}${selected ? " is-selected" : ""}${draggingChip && seat.role === "you" && canConfigure ? " is-drop-ready" : ""}`}
      onClick={(event) => {
        event.stopPropagation();
        if (canConfigure) onSelect(index);
      }}
      onKeyDown={(event) => {
        if (canConfigure && ["Enter", " "].includes(event.key)) {
          event.preventDefault();
          onSelect(index);
        }
      }}
      onDragOver={(event) => {
        if (seat.role !== "you" || !canConfigure) return;
        event.preventDefault();
        event.dataTransfer.dropEffect = "copy";
      }}
      onDrop={(event) => {
        if (seat.role !== "you" || !canConfigure) return;
        event.preventDefault();
        event.stopPropagation();
        const value = Number(event.dataTransfer.getData("application/x-blackjack-chip") || event.dataTransfer.getData("text/plain"));
        if (Number.isFinite(value)) onBetDrop(value);
      }}
      aria-label={`${seat.name} seat. ${seat.role}. ${canConfigure ? "Select to change occupant." : "Seat is locked during the round."}`}
      data-seat={index}
    >
      {seat.role === "empty" ? (
        <div className="empty-seat">
          <Plus size={26} weight="bold" aria-hidden="true" />
          <span>EMPTY</span>
        </div>
      ) : (
        <>
          <div className={`seat-hands hands-${seat.hands.length}`}>
            {seat.hands.map((hand, handIndex) => (
              <Hand
                key={hand.id}
                hand={hand}
                isActive={active && game.activeHand === handIndex}
                targetSeat={index}
                totalPending={game.phase === "dealing" && hand.cards.length === 0}
                hideStatus={game.phase === "dealing"}
              />
            ))}
          </div>
          <div className="seat-identity">
            <strong>{seat.name}</strong>
            <span>{seat.role === "you" ? "YOU" : "AI"}</span>
          </div>
          <div className="seat-bet">
            <BetStack values={shownChips} total={shownBet} compact />
          </div>
          {active && ["ai-turn", "playing"].includes(game.phase) && (
            <DecisionClock seconds={decisionSeconds} limit={decisionLimit} label={seat.role === "you" ? "YOUR MOVE" : "AI WINDOW"} />
          )}
        </>
      )}
      {selected && <SeatSelector activeRole={seat.role} onChoose={(role) => onRoleChange(index, role)} />}
    </div>
  );
}

function Modal({ title, children, onClose, className = "" }) {
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section className={`modal ${className}`} role="dialog" aria-modal="true" aria-label={title} onMouseDown={(event) => event.stopPropagation()}>
        <header>
          <div>
            <span className="modal-kicker">CLEOPATRA CASINO</span>
            <h2>{title}</h2>
          </div>
          <button type="button" className="icon-button" onClick={onClose} aria-label={`Close ${title}`}>
            <X size={22} aria-hidden="true" />
          </button>
        </header>
        {children}
      </section>
    </div>
  );
}

function TableSettingsModal({ deckCount, showCardCount, statsMinimized, dealSpeed, onDeckCount, onCardCount, onStatsMinimized, onDealSpeed, onClose }) {
  return (
    <Modal title="Table settings" onClose={onClose} className="settings-modal">
      <div className="settings-content">
        <section>
          <div className="setting-copy"><StackSimple size={21} weight="duotone" /><span><strong>Decks in the shoe</strong><small>A new shuffled shoe loads immediately.</small></span></div>
          <div className="segmented-setting" role="radiogroup" aria-label="Deck count">
            {DECK_OPTIONS.map((count) => <button key={count} type="button" className={deckCount === count ? "is-selected" : ""} onClick={() => onDeckCount(count)} role="radio" aria-checked={deckCount === count}>{count} DECKS</button>)}
          </div>
        </section>
        <section>
          <div className="setting-copy"><Eye size={21} weight="duotone" /><span><strong>Card count</strong><small>Show the running Hi-Lo count, true count, and cards left.</small></span></div>
          <button type="button" className={`setting-switch${showCardCount ? " is-on" : ""}`} onClick={() => onCardCount(!showCardCount)} aria-pressed={showCardCount}><span></span>{showCardCount ? "OPEN" : "HIDDEN"}</button>
        </section>
        <section>
          <div className="setting-copy"><ChartLineUp size={21} weight="duotone" /><span><strong>Revenue statistics</strong><small>Keep the felt clean or show your complete session numbers.</small></span></div>
          <button type="button" className={`setting-switch${!statsMinimized ? " is-on" : ""}`} onClick={() => onStatsMinimized(!statsMinimized)} aria-pressed={!statsMinimized}><span></span>{statsMinimized ? "MINIMIZED" : "VISIBLE"}</button>
        </section>
        <section>
          <div className="setting-copy"><Gauge size={21} weight="duotone" /><span><strong>Deal speed</strong><small>Controls card flight, reveal, and dealer pacing.</small></span></div>
          <div className="segmented-setting" role="radiogroup" aria-label="Deal speed">
            {DEAL_SPEED_ORDER.map((speed) => <button key={speed} type="button" className={dealSpeed === speed ? "is-selected" : ""} onClick={() => onDealSpeed(speed)} role="radio" aria-checked={dealSpeed === speed}>{DEAL_SPEEDS[speed].label}</button>)}
          </div>
        </section>
      </div>
    </Modal>
  );
}

export function App() {
  const [view, setView] = useState("table");
  const [tableVariant, setTableVariant] = useState("arena");
  const [mode, setMode] = useState("freebet");
  const [walletBalance, setWalletBalance] = useState(10250);
  const [betStack, setBetStack] = useState([250]);
  const [sideBetStacks, setSideBetStacks] = useState(emptySideBetStacks);
  const [selectedChip, setSelectedChip] = useState(250);
  const [draggingChip, setDraggingChip] = useState(null);
  const [touchChipDrag, setTouchChipDrag] = useState(null);
  const [chipFlight, setChipFlight] = useState(null);
  const [selectedSeat, setSelectedSeat] = useState(null);
  const [soundOn, setSoundOn] = useState(true);
  const [dealSpeed, setDealSpeed] = useState("normal");
  const [deckCount, setDeckCount] = useState(6);
  const [showCardCount, setShowCardCount] = useState(false);
  const [runningCount, setRunningCount] = useState(0);
  const [statsMinimized, setStatsMinimized] = useState(false);
  const [sideBetAnnouncement, setSideBetAnnouncement] = useState(null);
  const [totalWinPopup, setTotalWinPopup] = useState(null);
  const [winStreak, setWinStreak] = useState(readWinStreak);
  const [isMobileTable, setIsMobileTable] = useState(false);
  const [cashierOpen, setCashierOpen] = useState(false);
  const [cashierMode, setCashierMode] = useState("deposit");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [depositAmount, setDepositAmount] = useState(1000);
  const [depositMethod, setDepositMethod] = useState("gcash");
  const [depositAccount, setDepositAccount] = useState("");
  const [cashierReference, setCashierReference] = useState("");
  const [cashierStep, setCashierStep] = useState("details");
  const [cashierProcessing, setCashierProcessing] = useState(false);
  const [toast, setToast] = useState("");
  const [game, setGame] = useState(INITIAL_GAME);
  const [shoeCount, setShoeCount] = useState(312);
  const [casinoStats, setCasinoStats] = useState(EMPTY_STATS);
  const [betHistory, setBetHistory] = useState([]);
  const [dailySoloPlayers, setDailySoloPlayers] = useState(74);
  const [decisionSeconds, setDecisionSeconds] = useState(10);
  const [bettingSeconds, setBettingSeconds] = useState(12);
  const [decisionNonce, setDecisionNonce] = useState(0);
  const [advanceDecision, setAdvanceDecision] = useState(null);
  const [statsResetArmed, setStatsResetArmed] = useState(false);

  const gameRef = useRef(INITIAL_GAME);
  const shoeRef = useRef([]);
  const touchChipDragRef = useRef(null);
  const suppressChipClickRef = useRef(false);
  const toastTimerRef = useRef(null);
  const chipTimerRef = useRef(null);
  const sideBetAnnouncementTimerRef = useRef(null);
  const totalWinTimerRef = useRef(null);
  const decisionTimerRef = useRef(null);
  const statsResetTimerRef = useRef(null);
  const aiTimerRefs = useRef([]);
  const advanceDecisionRef = useRef(null);
  const roundTurnOrderRef = useRef([]);
  const roundTurnPositionRef = useRef(-1);
  const actRef = useRef(null);
  const startRoundRef = useRef(null);
  const motionCounterRef = useRef(0);
  const audioContextRef = useRef(null);
  const walletBalanceRef = useRef(10250);
  const runningCountRef = useRef(0);
  const selectedBet = useMemo(() => betStack.reduce((sum, value) => sum + value, 0), [betStack]);
  const sideBetTotals = useMemo(() => Object.fromEntries(
    SIDE_BET_KEYS.map((key) => [key, (sideBetStacks[key] ?? []).reduce((sum, value) => sum + value, 0)]),
  ), [sideBetStacks]);
  const totalSelectedBet = selectedBet + Object.values(sideBetTotals).reduce((sum, value) => sum + value, 0);
  const speedConfig = DEAL_SPEEDS[dealSpeed];
  const decisionLimit = tableVariant === "solo" ? 12 : 10;
  const depositProvider = PAYMENT_METHODS.find((method) => method.id === depositMethod) ?? PAYMENT_METHODS[0];
  const cashierAvailable = ROUND_LOCKED_PHASES.includes(game.phase)
    ? walletBalance
    : Math.max(0, walletBalance - totalSelectedBet);
  const trueCount = shoeCount > 0 ? runningCount / Math.max(1, shoeCount / 52) : 0;

  useEffect(() => {
    const mobileQuery = window.matchMedia("(max-width: 760px)");
    const syncMobileMode = () => {
      setIsMobileTable(mobileQuery.matches);
      if (mobileQuery.matches) setStatsMinimized(true);
    };
    syncMobileMode();
    mobileQuery.addEventListener?.("change", syncMobileMode);

    return () => {
      mobileQuery.removeEventListener?.("change", syncMobileMode);
      window.clearTimeout(toastTimerRef.current);
      window.clearTimeout(chipTimerRef.current);
      window.clearTimeout(sideBetAnnouncementTimerRef.current);
      window.clearTimeout(totalWinTimerRef.current);
      window.clearInterval(decisionTimerRef.current);
      window.clearTimeout(statsResetTimerRef.current);
      aiTimerRefs.current.forEach((timer) => window.clearTimeout(timer));
      audioContextRef.current?.close?.();
    };
  }, []);

  useEffect(() => {
    if (tableVariant !== "solo" || !["betting", "settled"].includes(game.phase) || totalWinPopup) return undefined;
    setBettingSeconds(12);
    let launchTimer = null;
    const timer = window.setInterval(() => {
      setBettingSeconds((seconds) => {
        if (seconds > 1) return seconds - 1;
        window.clearInterval(timer);
        launchTimer = window.setTimeout(() => startRoundRef.current?.({ automatic: true }), 0);
        return 0;
      });
    }, 1000);
    return () => {
      window.clearInterval(timer);
      window.clearTimeout(launchTimer);
    };
  }, [tableVariant, game.phase, game.round, totalWinPopup]);

  useEffect(() => {
    let active = true;
    fetch("/api/session")
      .then((response) => response.ok ? response.json() : Promise.reject(new Error("Session API unavailable")))
      .then((session) => {
        if (!active) return;
        const history = Array.isArray(session.history) ? session.history : [];
        setCasinoStats({ ...EMPTY_STATS, ...session.stats });
        setBetHistory(history);
        if (history.length) {
          const streak = winStreakFromHistory(history);
          setWinStreak(streak);
          persistWinStreak(streak);
        }
        setDailySoloPlayers(Number(session.lobby?.dailySoloPlayers || 74));
      })
      .catch(() => {
        if (active) setDailySoloPlayers(74);
      });
    return () => { active = false; };
  }, []);

  const commitGame = (nextGame) => {
    gameRef.current = nextGame;
    setGame(nextGame);
  };

  const showToast = (message) => {
    window.clearTimeout(toastTimerRef.current);
    setToast(message);
    toastTimerRef.current = window.setTimeout(() => setToast(""), 2600);
  };

  const updateBalance = (updater) => {
    const nextBalance = typeof updater === "function" ? updater(walletBalanceRef.current) : updater;
    walletBalanceRef.current = nextBalance;
    setWalletBalance(nextBalance);
    return nextBalance;
  };

  const dismissSideBetAnnouncement = () => {
    window.clearTimeout(sideBetAnnouncementTimerRef.current);
    setSideBetAnnouncement(null);
  };

  const dismissTotalWinPopup = () => {
    window.clearTimeout(totalWinTimerRef.current);
    setTotalWinPopup(null);
  };

  const showTotalWinPopup = (label, amount) => {
    window.clearTimeout(totalWinTimerRef.current);
    setTotalWinPopup({ id: Date.now(), label, amount });
    totalWinTimerRef.current = window.setTimeout(() => setTotalWinPopup(null), 3600);
  };

  const saveRoundHistory = async (round) => {
    const optimisticRecord = {
      id: round.id || `round-${Date.now()}`,
      createdAt: new Date().toISOString(),
      ...round,
    };
    setBetHistory((history) => [optimisticRecord, ...history.filter((item) => item.id !== optimisticRecord.id)].slice(0, 80));
    setCasinoStats((stats) => {
      const rounds = stats.rounds + 1;
      const wins = Math.round((stats.winRate / 100) * stats.rounds) + (round.net > 0 ? 1 : 0);
      return {
        rounds,
        totalWagered: stats.totalWagered + round.totalBet,
        totalWins: stats.totalWins + Math.max(0, round.net),
        netRevenue: stats.netRevenue + round.net,
        winRate: rounds ? Math.round((wins / rounds) * 100) : 0,
      };
    });
    setWinStreak((current) => {
      const next = round.net > 0 ? current + 1 : round.net < 0 ? 0 : current;
      persistWinStreak(next);
      return next;
    });

    try {
      const response = await fetch("/api/history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(optimisticRecord),
      });
      if (!response.ok) throw new Error("History API unavailable");
      const payload = await response.json();
      setCasinoStats({ ...EMPTY_STATS, ...payload.stats });
      setBetHistory((history) => [payload.record, ...history.filter((item) => item.id !== optimisticRecord.id && item.id !== payload.record.id)].slice(0, 80));
    } catch {
      // Keep the optimistic session ledger without interrupting the finished round.
    }
  };

  const saveRevenueSnapshot = async () => {
    const exportedAt = new Date();
    let snapshot = {
      exportedAt: exportedAt.toISOString(),
      stats: casinoStats,
      history: betHistory,
    };
    try {
      const response = await fetch("/api/export");
      if (response.ok) snapshot = await response.json();
    } catch {
      // The in-memory snapshot remains available when the local ledger API is unavailable.
    }
    const file = new Blob([JSON.stringify(snapshot, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(file);
    const link = document.createElement("a");
    link.href = url;
    link.download = `cleopatra-revenue-${exportedAt.toISOString().slice(0, 10)}.json`;
    document.body.append(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
    showToast("Revenue snapshot saved.");
  };

  const armOrResetRevenueStats = async () => {
    if (!statsResetArmed) {
      window.clearTimeout(statsResetTimerRef.current);
      setStatsResetArmed(true);
      statsResetTimerRef.current = window.setTimeout(() => setStatsResetArmed(false), 4200);
      showToast("Press CONFIRM to reset revenue and round history.");
      return;
    }

    window.clearTimeout(statsResetTimerRef.current);
    setStatsResetArmed(false);
    try {
      const response = await fetch("/api/reset", { method: "POST" });
      if (!response.ok) throw new Error("Reset API unavailable");
      const payload = await response.json();
      setCasinoStats({ ...EMPTY_STATS, ...payload.stats });
      setBetHistory([]);
      setWinStreak(0);
      persistWinStreak(0);
      showToast("Revenue stats and round history reset.");
    } catch {
      showToast("Revenue reset failed. The saved ledger was not changed.");
    }
  };

  const enterTable = (variant) => {
    if (ROUND_LOCKED_PHASES.includes(gameRef.current.phase)) return;
    const next = copyGame(gameRef.current);
    const humanIndex = Math.max(0, next.seats.findIndex((seat) => seat.role === "you"));
    next.dealer = { cards: [], hidden: false, totalHidden: false };
    if (variant === "solo") {
      next.seats = next.seats.map((seat, index) => ({
        ...seat,
        role: index === humanIndex ? "you" : seat.role === "empty" ? "empty" : "ai",
        name: index === humanIndex ? "You" : seat.name === "You" ? AI_NAMES[index % AI_NAMES.length] : seat.name,
        hands: [],
      }));
      next.message = "CLEOPATRA ONE · 12 SECOND DECISIONS";
    } else {
      next.seats = next.seats.map((seat) => ({ ...seat, hands: [] }));
      next.message = "CLEOPATRA ROYALE · CHOOSE YOUR SEAT";
    }
    next.phase = "betting";
    next.activeSeat = null;
    setTableVariant(variant);
    advanceDecisionRef.current = null;
    setAdvanceDecision(null);
    setDecisionSeconds(variant === "solo" ? 12 : 10);
    commitGame(next);
    setView("table");
  };

  const getAudioContext = () => {
    if (!soundOn) return null;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return null;
    if (!audioContextRef.current) audioContextRef.current = new AudioContext();
    if (audioContextRef.current.state === "suspended") audioContextRef.current.resume?.();
    return audioContextRef.current;
  };

  const playTone = (frequency = 360, duration = 0.07) => {
    const context = getAudioContext();
    if (!context) return;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(0.035, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + duration);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + duration);
  };

  const playCardSound = (variation = 0) => {
    const context = getAudioContext();
    if (!context) return;

    const duration = 0.075;
    const buffer = context.createBuffer(1, Math.ceil(context.sampleRate * duration), context.sampleRate);
    const data = buffer.getChannelData(0);
    for (let index = 0; index < data.length; index += 1) {
      const envelope = 1 - index / data.length;
      data[index] = (Math.random() * 2 - 1) * envelope * envelope;
    }

    const source = context.createBufferSource();
    const filter = context.createBiquadFilter();
    const gain = context.createGain();
    source.buffer = buffer;
    source.playbackRate.value = 0.92 + (variation % 5) * 0.035;
    filter.type = "bandpass";
    filter.frequency.value = 1750 + (variation % 4) * 190;
    filter.Q.value = 0.72;
    gain.gain.setValueAtTime(0.0001, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.055, context.currentTime + 0.006);
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + duration);
    source.connect(filter);
    filter.connect(gain);
    gain.connect(context.destination);
    source.start();
    source.stop(context.currentTime + duration);

    const slap = context.createOscillator();
    const slapGain = context.createGain();
    slap.type = "triangle";
    slap.frequency.setValueAtTime(125 + (variation % 3) * 12, context.currentTime);
    slapGain.gain.setValueAtTime(0.022, context.currentTime);
    slapGain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.028);
    slap.connect(slapGain);
    slapGain.connect(context.destination);
    slap.start();
    slap.stop(context.currentTime + 0.03);
  };

  const playResultSound = (kind) => {
    const context = getAudioContext();
    if (!context) return;
    const notes = kind === "win" ? [523, 659, 784] : kind === "push" ? [330, 440] : [220, 165];
    notes.forEach((frequency, index) => {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      const start = context.currentTime + index * 0.09;
      oscillator.type = kind === "lose" ? "sine" : "triangle";
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(kind === "win" ? 0.04 : 0.026, start + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.22);
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start(start);
      oscillator.stop(start + 0.24);
    });
  };

  const announceSideBetWins = (sideBets, keys = SIDE_BET_KEYS) => {
    const wins = keys.flatMap((key) => {
      const sideBet = sideBets[key];
      if (!sideBet?.stake || sideBet.returned <= sideBet.stake || !sideBet.result?.label) return [];
      return [{
        key,
        label: SIDE_BET_LABELS[key],
        result: sideBet.result.label,
        profit: sideBet.returned - sideBet.stake,
      }];
    });
    if (!wins.length) return;
    window.clearTimeout(sideBetAnnouncementTimerRef.current);
    setSideBetAnnouncement({ id: `${Date.now()}-${wins.map((win) => win.key).join("-")}`, wins });
    sideBetAnnouncementTimerRef.current = window.setTimeout(() => setSideBetAnnouncement(null), 3600);
    playTone(880, 0.12);
  };

  const loadShoe = (count = deckCount) => {
    shoeRef.current = createShoe(count);
    runningCountRef.current = 0;
    setRunningCount(0);
    setShoeCount(shoeRef.current.length);
  };

  const draw = () => {
    const cutCardThreshold = Math.max(24, Math.floor(deckCount * 52 * 0.16));
    if (shoeRef.current.length < cutCardThreshold) loadShoe(deckCount);
    const nextCard = shoeRef.current.pop();
    runningCountRef.current += hiLoCountValue(nextCard);
    setRunningCount(runningCountRef.current);
    setShoeCount(shoeRef.current.length);
    return nextCard;
  };

  const drawWithMotion = (motionOrder = 0) => ({
    ...draw(),
    motionId: ++motionCounterRef.current,
    motionOrder,
    motionDelay: motionOrder * speedConfig.step,
  });

  const updateBetMessage = (mainTotal, nextSideTotals = sideBetTotals) => {
    dismissSideBetAnnouncement();
    const next = copyGame(gameRef.current);
    const combinedTotal = mainTotal + Object.values(nextSideTotals).reduce((sum, value) => sum + value, 0);
    next.phase = "betting";
    next.activeSeat = null;
    next.sideBets = Object.fromEntries(SIDE_BET_KEYS.map((key) => [
      key,
      { stake: nextSideTotals[key] ?? 0, result: null, returned: 0 },
    ]));
    next.message = combinedTotal > 0 ? `TOTAL BET — ${formatPeso(combinedTotal)}` : "SELECT A CHIP";
    commitGame(next);
  };

  const placeChip = (target, value = selectedChip) => {
    if (!["betting", "settled"].includes(gameRef.current.phase)) return;
    if (target !== "main" && selectedBet <= 0) {
      showToast("Place a main bet before adding side bets.");
      playTone(150, 0.08);
      return;
    }
    const targetTotal = target === "main" ? selectedBet : sideBetTotals[target];
    const targetLimit = target === "main" ? MAX_BET : SIDE_BET_MAX;
    const nextTargetTotal = targetTotal + value;
    const nextCombinedTotal = totalSelectedBet + value;

    if (nextCombinedTotal > walletBalanceRef.current || nextTargetTotal > targetLimit) {
      showToast(nextCombinedTotal > walletBalanceRef.current
        ? "That wager exceeds your PHP balance."
        : `${target === "main" ? "Main" : "Side"} bet limit is ${formatPeso(targetLimit)}.`);
      playTone(150, 0.08);
      return;
    }

    const humanSeat = gameRef.current.seats.findIndex((seat) => seat.role === "you");
    const nextMainTotal = target === "main" ? nextTargetTotal : selectedBet;
    const nextSideTotals = {
      ...sideBetTotals,
      ...(target === "main" ? {} : { [target]: nextTargetTotal }),
    };
    setSelectedChip(value);
    if (target === "main") setBetStack((stack) => [...stack, value]);
    else setSideBetStacks((stacks) => ({ ...stacks, [target]: [...(stacks[target] ?? []), value] }));
    setSelectedSeat(null);
    window.clearTimeout(chipTimerRef.current);
    setChipFlight({
      id: `${Date.now()}-${target}-${value}`,
      value,
      target,
      style: SIDE_BET_FLIGHT_TARGETS[target] ?? CHIP_FLIGHT_TARGETS[Math.max(0, humanSeat)],
    });
    chipTimerRef.current = window.setTimeout(() => setChipFlight(null), 760);
    updateBetMessage(nextMainTotal, nextSideTotals);
    playTone(520 + Math.min(value, 500) * 0.18, 0.055);
  };

  const addChip = (value) => placeChip("main", value);

  const undoChip = () => {
    if (!["betting", "settled"].includes(gameRef.current.phase) || !betStack.length) return;
    const nextStack = betStack.slice(0, -1);
    const mainTotal = nextStack.reduce((sum, value) => sum + value, 0);
    setBetStack(nextStack);
    setSelectedChip(nextStack.at(-1) ?? 250);
    if (mainTotal === 0) {
      const clearedSideBets = emptySideBetStacks();
      setSideBetStacks(clearedSideBets);
      updateBetMessage(0, Object.fromEntries(SIDE_BET_KEYS.map((key) => [key, 0])));
    } else {
      updateBetMessage(mainTotal);
    }
    playTone(240, 0.05);
  };

  const doubleBet = () => {
    if (!["betting", "settled"].includes(gameRef.current.phase) || !betStack.length) return;
    const doubledMain = selectedBet * 2;
    if (doubledMain > MAX_BET || totalSelectedBet + selectedBet > walletBalanceRef.current) {
      showToast(doubledMain > MAX_BET ? `Main bet limit is ${formatPeso(MAX_BET)}.` : "That wager exceeds your PHP balance.");
      playTone(150, 0.08);
      return;
    }
    const nextStack = [...betStack, ...betStack];
    setBetStack(nextStack);
    updateBetMessage(doubledMain);
    playTone(620, 0.07);
  };

  const clearBet = () => {
    if (!["betting", "settled"].includes(gameRef.current.phase) || !betStack.length) return;
    setBetStack([]);
    setSideBetStacks(emptySideBetStacks());
    updateBetMessage(0, Object.fromEntries(SIDE_BET_KEYS.map((key) => [key, 0])));
    playTone(180, 0.07);
  };

  const clearSideBet = (target) => {
    if (!["betting", "settled"].includes(gameRef.current.phase) || !(sideBetStacks[target] ?? []).length) return;
    const nextStacks = { ...sideBetStacks, [target]: [] };
    const nextTotals = Object.fromEntries(
      SIDE_BET_KEYS.map((key) => [key, (nextStacks[key] ?? []).reduce((sum, value) => sum + value, 0)]),
    );
    setSideBetStacks(nextStacks);
    updateBetMessage(selectedBet, nextTotals);
    playTone(180, 0.07);
  };

  const beginChipDrag = (event, value) => {
    if (!["betting", "settled"].includes(gameRef.current.phase)) {
      event.preventDefault();
      return;
    }
    event.dataTransfer.effectAllowed = "copy";
    event.dataTransfer.setData("application/x-blackjack-chip", String(value));
    event.dataTransfer.setData("text/plain", String(value));
    setSelectedChip(value);
    setDraggingChip(value);
  };

  const beginTouchChipDrag = (event, value) => {
    if ((event.pointerType === "mouse" && !isMobileTable) || !["betting", "settled"].includes(gameRef.current.phase)) return;
    touchChipDragRef.current = {
      pointerId: event.pointerId,
      value,
      startX: event.clientX,
      startY: event.clientY,
      dragging: false,
    };
    setSelectedChip(value);
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };

  const moveTouchChipDrag = (event) => {
    const drag = touchChipDragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const distance = Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY);
    if (!drag.dragging && distance < 8) return;
    event.preventDefault();
    drag.dragging = true;
    suppressChipClickRef.current = true;
    setDraggingChip(drag.value);
    setTouchChipDrag({ value: drag.value, x: event.clientX, y: event.clientY });
  };

  const finishTouchChipDrag = (event) => {
    const drag = touchChipDragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    if (drag.dragging) {
      event.preventDefault();
      const dropElement = document.elementFromPoint(event.clientX, event.clientY);
      const target = dropElement?.closest?.("[data-bet-target]")?.dataset.betTarget;
      if (target) placeChip(target, drag.value);
      window.setTimeout(() => { suppressChipClickRef.current = false; }, 0);
    }
    if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    touchChipDragRef.current = null;
    setTouchChipDrag(null);
    setDraggingChip(null);
  };

  const cancelTouchChipDrag = (event) => {
    if (touchChipDragRef.current?.pointerId !== event.pointerId) return;
    touchChipDragRef.current = null;
    suppressChipClickRef.current = false;
    setTouchChipDrag(null);
    setDraggingChip(null);
  };

  const handleChipTap = (event, value) => {
    if (suppressChipClickRef.current) {
      event.preventDefault();
      return;
    }
    addChip(value);
  };

  const queueAdvanceDecision = (action) => {
    if (gameRef.current.phase !== "ai-turn" || tableVariant !== "arena") return;
    const nextDecision = advanceDecisionRef.current === action ? null : action;
    advanceDecisionRef.current = nextDecision;
    setAdvanceDecision(nextDecision);
    playTone(nextDecision ? 620 : 260, 0.06);
    showToast(nextDecision ? `${action.toUpperCase()} QUEUED — WILL PLAY ON YOUR TURN` : "ADVANCE DECISION CLEARED");
  };

  const runTableTurns = (baseGame, orderedSeatIndices, position = 0, handIndex = 0) => {
    if (position >= orderedSeatIndices.length) {
      const ready = copyGame(baseGame);
      const human = ready.seats.find((seat) => seat.role === "you");
      roundTurnOrderRef.current = [];
      roundTurnPositionRef.current = -1;
      const naturalFlow = naturalBlackjackTableFlow(human?.hands[0]?.cards ?? [], tableVariant);
      ready.phase = "dealer";
      ready.activeSeat = null;
      ready.activeHand = 0;
      ready.message = naturalFlow.playerNatural
        ? tableVariant === "solo"
          ? "BLACKJACK · CHECKING DEALER"
          : "BLACKJACK · DEALER REVEALS"
        : "DEALER PLAYING";
      commitGame(ready);
      const dealerTimer = window.setTimeout(
        () => settleDealer(ready, { revealOnly: naturalFlow.dealerRevealOnly }),
        speedConfig.transition,
      );
      aiTimerRefs.current.push(dealerTimer);
      return;
    }

    const seatIndex = orderedSeatIndices[position];
    const sourceSeat = baseGame.seats[seatIndex];
    const activeHandIndex = sourceSeat?.hands.findIndex((hand, index) => (
      index >= handIndex && hand.state !== "done" && !isHandComplete(hand.cards, mode)
    )) ?? -1;

    if (!sourceSeat || activeHandIndex < 0) {
      runTableTurns(baseGame, orderedSeatIndices, position + 1, 0);
      return;
    }

    if (sourceSeat.role === "you") {
      const ready = copyGame(baseGame);
      roundTurnOrderRef.current = [...orderedSeatIndices];
      roundTurnPositionRef.current = position;
      ready.phase = "playing";
      ready.activeSeat = seatIndex;
      ready.activeHand = activeHandIndex;
      const queuedDecision = advanceDecisionRef.current;
      ready.message = queuedDecision
        ? `ADVANCE ${queuedDecision.toUpperCase()} · EXECUTING`
        : `YOUR MOVE · ${decisionLimit} SECONDS`;
      setDecisionSeconds(decisionLimit);
      commitGame(ready);
      if (queuedDecision) {
        advanceDecisionRef.current = null;
        setAdvanceDecision(null);
        const advanceTimer = window.setTimeout(() => actRef.current?.(queuedDecision), 260);
        aiTimerRefs.current.push(advanceTimer);
      }
      return;
    }

    const deciding = copyGame(baseGame);
    const seat = deciding.seats[seatIndex];
    deciding.phase = "ai-turn";
    deciding.activeSeat = seatIndex;
    deciding.activeHand = activeHandIndex;
    deciding.message = `${seat.name.toUpperCase()} DECIDING · 10 SECOND WINDOW`;
    setDecisionSeconds(10);
    commitGame(deciding);

    const countdown = window.setInterval(() => setDecisionSeconds((seconds) => Math.max(0, seconds - 1)), 1000);
    aiTimerRefs.current.push(countdown);
    const thinkTime = dealSpeed === "slow" ? 2300 : dealSpeed === "turbo" ? 760 : 1450;
    const turnTimer = window.setTimeout(() => {
      window.clearInterval(countdown);
      const decided = copyGame(gameRef.current);
      const target = decided.seats[seatIndex];
      const hand = target.hands[activeHandIndex];
      if (!hand) {
        runTableTurns(decided, orderedSeatIndices, position + 1, 0);
        return;
      }

      let aiMotionOrder = 0;
      const aiDealCard = () => drawWithMotion(aiMotionOrder++);
      const decision = aiDecision(hand.cards, decided.dealer.cards[0], mode);

      if (decision === "split" && hand.cards.length === 2) {
        const freeSplit = mode === "freebet" && qualifiesFreeSplit(hand.cards);
        const splitAces = hand.cards[0].rank === "A";
        const [firstCard, secondCard] = hand.cards;
        const splitHands = [firstCard, secondCard].map((splitCard, index) => ({
          ...hand,
          id: `${hand.id}-ai-${index}-${Date.now()}`,
          cards: [splitCard, aiDealCard()],
          paidStake: 0,
          freeStake: freeSplit ? hand.bet : 0,
          state: splitAces ? "done" : "active",
          action: freeSplit ? "FREE SPLIT" : "SPLIT",
        }));
        target.hands.splice(activeHandIndex, 1, ...splitHands);
        decided.message = `${target.name.toUpperCase()} ${freeSplit ? "FREE SPLITS" : "SPLITS"}`;
      } else if (decision === "double" && hand.cards.length === 2) {
        hand.cards.push(aiDealCard());
        hand.freeStake += hand.bet;
        hand.action = "FREE DOUBLE";
        hand.state = "done";
        decided.message = `${target.name.toUpperCase()} FREE DOUBLES`;
      } else if (decision === "hit") {
        hand.cards.push(aiDealCard());
        hand.action = "HIT";
        const total = handValue(hand.cards).total;
        if (total >= 21 || isSixCardCharlie(hand.cards, mode)) hand.state = "done";
        decided.message = total > 21
          ? `${target.name.toUpperCase()} BUSTS`
          : `${target.name.toUpperCase()} HITS TO ${total}`;
      } else {
        hand.action = "STAND";
        hand.state = "done";
        decided.message = `${target.name.toUpperCase()} STANDS ON ${handValue(hand.cards).total}`;
      }

      commitGame(decided);
      if (aiMotionOrder) {
        for (let index = 0; index < aiMotionOrder; index += 1) {
          window.setTimeout(() => playCardSound(index + seatIndex), index * speedConfig.step);
        }
      }

      const updatedTarget = decided.seats[seatIndex];
      const currentHandStillActive = updatedTarget.hands[activeHandIndex]?.state !== "done";
      const nextHandIndex = updatedTarget.hands.findIndex((nextHand, index) => index > activeHandIndex && nextHand.state !== "done");
      const resultGap = aiMotionOrder ? Math.max(520, speedConfig.card * 0.68) : 520;
      const nextTimer = window.setTimeout(() => {
        if (currentHandStillActive) runTableTurns(decided, orderedSeatIndices, position, activeHandIndex);
        else if (nextHandIndex >= 0) runTableTurns(decided, orderedSeatIndices, position, nextHandIndex);
        else runTableTurns(decided, orderedSeatIndices, position + 1, 0);
      }, resultGap);
      aiTimerRefs.current.push(nextTimer);
    }, thinkTime);
    aiTimerRefs.current.push(turnTimer);
  };

  const settleDealer = (baseGame = gameRef.current, { revealOnly = false } = {}) => {
    const revealed = copyGame(baseGame);

    const finalizeRound = (dealerTurn, delay = speedConfig.settle) => {
      window.setTimeout(() => {
        const settled = copyGame(dealerTurn);
        let returned = 0;
        let fundedStake = 0;
        const humanResults = [];

        settled.seats.forEach((seat) => {
          seat.hands.forEach((hand) => {
            const result = compareHand(hand.cards, settled.dealer.cards, mode);
            hand.outcome = result;
            hand.state = "done";
            if (seat.role === "you") {
              returned += payoutFor(hand, result);
              fundedStake += hand.paidStake;
              humanResults.push(result);
            }
          });
        });

        const settlementHumanSeat = settled.seats.find((seat) => seat.role === "you");
        const settlementPlayerCards = settlementHumanSeat?.hands[0]?.cards ?? [];
        if (settled.sideBets.bustIt?.stake) {
          settled.sideBets.bustIt.result = evaluateBustIt(settled.dealer.cards, settlementPlayerCards);
        }

        const sideBetWins = [];
        Object.entries(settled.sideBets).forEach(([key, sideBet]) => {
          if (!sideBet.stake) return;
          fundedStake += sideBet.stake;
          sideBet.returned = sideBetReturn(sideBet.stake, sideBet.result);
          returned += sideBet.returned;
          if (sideBet.returned > sideBet.stake) sideBetWins.push(key);
        });
        announceSideBetWins(settled.sideBets, ["bustIt"]);

        const net = returned - fundedStake;
        const balanceAfter = updateBalance((balance) => balance + returned);
        if (!humanResults.length) settled.message = "AI ROUND COMPLETE";
        else if (net > 0) settled.message = sideBetWins.length && humanResults.every((result) => result === "lose") ? "SIDE BET WIN" : "YOU WIN";
        else if (net === 0) settled.message = "PUSH — BET RETURNED";
        else settled.message = `DEALER WINS ${formatPeso(Math.abs(net))}`;

        settled.phase = "settled";
        settled.activeSeat = null;
        settled.activeHand = 0;
        commitGame(settled);
        if (humanResults.length) {
          const kind = net > 0 ? "win" : net === 0 ? "push" : "lose";
          const label = kind === "win" && humanResults.every((result) => result === "blackjack")
            ? "BLACKJACK"
            : kind === "win" && sideBetWins.length && humanResults.every((result) => result === "lose")
              ? "SIDE BET WIN"
            : kind === "win"
              ? "YOU WIN"
              : "";
          playResultSound(kind);
          if (kind === "win") showTotalWinPopup(label, returned);

          const humanSeat = settled.seats.find((seat) => seat.role === "you");
          const playerTotal = humanSeat?.hands[0] ? handValue(humanSeat.hands[0].cards).total : 0;
          const dealerTotal = handValue(settled.dealer.cards).total;
          const sideStake = Object.values(settled.sideBets).reduce((sum, sideBet) => sum + Number(sideBet.stake || 0), 0);
          saveRoundHistory({
            id: `round-${settled.round}-${Date.now()}`,
            lobby: tableVariant,
            mode,
            mainBet: Math.max(0, fundedStake - sideStake),
            sideBets: sideStake,
            totalBet: fundedStake,
            returned,
            net,
            outcome: kind === "win" ? label.toLowerCase().replaceAll(" ", "-") : kind,
            playerTotal,
            dealerTotal,
            balanceAfter,
          });
        }
        if (humanResults.length && net === 0) showToast(settled.message);
        else {
          window.clearTimeout(toastTimerRef.current);
          setToast("");
        }
      }, delay);
    };

    revealed.phase = "dealer";
    revealed.message = "REVEALING HOLE CARD";
    revealed.dealer.hidden = false;
    revealed.dealer.totalHidden = true;
    commitGame(revealed);
    playTone(330, 0.11);

    const drawDealerCardsOneByOne = (dealerTurn, hitNumber = 0) => {
      if (!dealerShouldHit(dealerTurn.dealer.cards)) {
        const standing = copyGame(dealerTurn);
        standing.message = hitNumber ? "DEALER STANDS · SETTLING" : "DEALER STANDS";
        commitGame(standing);
        finalizeRound(standing);
        return;
      }

      const nextDealer = copyGame(dealerTurn);
      nextDealer.dealer.cards.push(drawWithMotion(0));
      nextDealer.message = `DEALER DRAWS CARD ${hitNumber + 1}`;
      commitGame(nextDealer);
      playCardSound(hitNumber + 6);
      const timer = window.setTimeout(
        () => drawDealerCardsOneByOne(nextDealer, hitNumber + 1),
        speedConfig.dealerGap,
      );
      aiTimerRefs.current.push(timer);
    };

    const revealTimer = window.setTimeout(() => {
      const dealerTurn = copyGame(revealed);
      dealerTurn.dealer.totalHidden = false;
      dealerTurn.message = revealOnly ? "HOLE CARD REVEALED · SETTLING" : "HOLE CARD REVEALED";
      commitGame(dealerTurn);
      if (revealOnly) {
        finalizeRound(dealerTurn, Math.max(360, speedConfig.settle));
        return;
      }
      const drawTimer = window.setTimeout(() => drawDealerCardsOneByOne(dealerTurn), Math.max(420, speedConfig.dealerGap * 0.55));
      aiTimerRefs.current.push(drawTimer);
    }, speedConfig.reveal);
    aiTimerRefs.current.push(revealTimer);
  };

  const startRound = ({ automatic = false, spectator = false } = {}) => {
    const current = gameRef.current;
    if (!["betting", "settled"].includes(current.phase)) return;
    const humanSeat = current.seats.find((seat) => seat.role === "you");
    const expiry = automatic ? soloBettingExpiry(selectedBet) : null;
    let spectatorRound = spectator || Boolean(expiry?.spectator);
    aiTimerRefs.current.forEach((timer) => window.clearTimeout(timer));
    aiTimerRefs.current = [];
    window.clearInterval(decisionTimerRef.current);
    advanceDecisionRef.current = null;
    setAdvanceDecision(null);
    dismissSideBetAnnouncement();
    dismissTotalWinPopup();
    if (selectedBet <= 0 && !spectatorRound) {
      showToast("Add at least one chip before dealing.");
      return;
    }
    if (humanSeat && !spectatorRound && walletBalanceRef.current < totalSelectedBet) {
      if (automatic) {
        spectatorRound = true;
        showToast("WAGER SKIPPED · WATCHING TABLE ROUND");
      } else {
        setCashierMode("deposit");
        setCashierOpen(true);
        showToast("Add to your PHP balance to cover the main and side bets.");
        return;
      }
    }

    const cutCardThreshold = Math.max(24, Math.floor(deckCount * 52 * 0.16));
    if (shoeRef.current.length < cutCardThreshold) loadShoe(deckCount);
    const next = copyGame(current);
    next.round += 1;
    next.phase = "dealing";
    next.message = spectatorRound ? "TABLE ROUND · OTHER PLAYERS ACTIVE" : "DEALING FROM THE SHOE";
    next.activeSeat = null;
    next.activeHand = 0;
    next.spectator = spectatorRound;
    next.dealer = { cards: [], hidden: true, totalHidden: true };
    next.sideBets = Object.fromEntries(SIDE_BET_KEYS.map((key) => [
      key,
      { stake: spectatorRound ? 0 : sideBetTotals[key], result: null, returned: 0 },
    ]));

    next.seats = next.seats.map((seat) => {
      const participates = spectatorRound
        ? seat.role === "ai"
        : seat.role !== "empty" && (tableVariant === "arena" && !isMobileTable ? true : seat.role === "you");
      const tableBet = seat.role === "you" ? selectedBet : Math.max(selectedBet, 250);
      return {
        ...seat,
        hands: !participates
        ? []
        : [{
            id: `round-${next.round}-${seat.id}-0`,
            cards: [],
            bet: tableBet,
            paidStake: seat.role === "you" && !spectatorRound ? selectedBet : 0,
            freeStake: 0,
            state: "active",
            action: "",
            outcome: "",
          }],
      };
    });

    const humanIndex = next.seats.findIndex((seat) => seat.role === "you");
    if (humanIndex >= 0 && !spectatorRound) {
      updateBalance((balance) => balance - totalSelectedBet);
    }

    const dealPlan = openingDealTargets(next.seats).map((target) => ({
      target,
      card: drawWithMotion(0),
    }));

    setSelectedSeat(null);
    setChipFlight(null);
    roundTurnOrderRef.current = [];
    roundTurnPositionRef.current = -1;
    commitGame(next);

    dealPlan.forEach(({ target, card }, index) => {
      const cardTimer = window.setTimeout(() => {
        const staged = copyGame(gameRef.current);
        if (staged.phase !== "dealing" || staged.round !== next.round) return;
        if (target === "dealer") staged.dealer.cards.push(card);
        else staged.seats[target]?.hands[0]?.cards.push(card);
        staged.message = `DEALING RIGHT TO LEFT · ${index + 1}/${dealPlan.length}`;
        commitGame(staged);
        playCardSound(index);
      }, index * speedConfig.step);
      aiTimerRefs.current.push(cardTimer);
    });

    const finalCardStart = Math.max(0, dealPlan.length - 1) * speedConfig.step;
    const dealDuration = Math.min(speedConfig.max, finalCardStart + speedConfig.card + 80);
    const dealCompleteTimer = window.setTimeout(() => {
      const ready = copyGame(gameRef.current);
      if (ready.phase !== "dealing" || ready.round !== next.round) return;

      ready.seats.forEach((seat) => {
        seat.hands.forEach((hand) => {
          if (isBlackjack(hand.cards)) {
            hand.state = "done";
            hand.action = "BLACKJACK";
          } else if (isHandComplete(hand.cards, mode)) {
            hand.state = "done";
            hand.action = "21";
          }
        });
      });

      const dealerUpCard = ready.dealer.cards[0];
      const humanHand = humanIndex >= 0 ? ready.seats[humanIndex]?.hands[0] : null;
      if (humanHand && dealerUpCard) {
        const openingCards = humanHand.cards.slice(0, 2);
        ready.sideBets.hotThree.result = evaluateHotThree([...openingCards, dealerUpCard]);
        ready.sideBets.twentyOneThree.result = evaluate21Plus3([...openingCards, dealerUpCard]);
        ready.sideBets.perfectPairs.result = evaluatePerfectPairs(openingCards);
        ["hotThree", "twentyOneThree", "perfectPairs"].forEach((key) => {
          const sideBet = ready.sideBets[key];
          if (sideBet?.stake) sideBet.returned = sideBetReturn(sideBet.stake, sideBet.result);
        });
        announceSideBetWins(ready.sideBets, ["hotThree", "twentyOneThree", "perfectPairs"]);
      }

      runTableTurns(ready, rightToLeftSeatIndices(ready.seats));
    }, dealDuration);
    aiTimerRefs.current.push(dealCompleteTimer);
  };

  startRoundRef.current = startRound;

  const finishOrAdvance = (nextGame, completionMessage = "") => {
    const human = nextGame.seats[nextGame.activeSeat];
    const nextHandIndex = human.hands.findIndex((hand, index) => index > nextGame.activeHand && hand.state !== "done");

    if (nextHandIndex >= 0) {
      nextGame.activeHand = nextHandIndex;
      nextGame.message = `PLAYING HAND ${nextHandIndex + 1}`;
      setDecisionNonce((nonce) => nonce + 1);
      commitGame(nextGame);
      return;
    }

    window.clearInterval(decisionTimerRef.current);
    const orderedSeatIndices = roundTurnOrderRef.current;
    const currentPosition = roundTurnPositionRef.current;
    nextGame.activeSeat = null;
    nextGame.activeHand = 0;
    nextGame.message = completionMessage || "TABLE ACTION CONTINUES RIGHT TO LEFT";
    commitGame(nextGame);
    const continueTimer = window.setTimeout(() => {
      runTableTurns(nextGame, orderedSeatIndices, currentPosition + 1, 0);
    }, speedConfig.transition);
    aiTimerRefs.current.push(continueTimer);
  };

  const act = (action, { automatic = false } = {}) => {
    const current = gameRef.current;
    if (current.phase !== "playing" || current.activeSeat === null) return;

    const next = copyGame(current);
    const seat = next.seats[next.activeSeat];
    const hand = seat.hands[next.activeHand];
    if (!hand) return;
    if (hand.state === "done" || isHandComplete(hand.cards, mode)) {
      hand.state = "done";
      hand.action = isBlackjack(hand.cards) ? "BLACKJACK" : "21";
      finishOrAdvance(next);
      return;
    }
    const freeDouble = mode === "freebet" && qualifiesFreeDouble(hand.cards);
    const freeSplit = mode === "freebet" && qualifiesFreeSplit(hand.cards);

    if (action === "hit") {
      hand.cards.push(drawWithMotion(0));
      hand.action = automatic ? "AUTO HIT" : "HIT";
      const total = handValue(hand.cards).total;
      if (automatic) next.message = `AUTO HIT · ${total} · ${decisionLimit} SECONDS`;
      if (total >= 21 || isSixCardCharlie(hand.cards, mode)) {
        hand.state = "done";
        if (total === 21) hand.action = "21";
      }
    }

    if (action === "stand") {
      hand.state = "done";
      hand.action = automatic ? "AUTO STAND" : "STAND";
    }

    if (action === "double") {
      if (hand.cards.length !== 2) return;
      if (!freeDouble && walletBalance < hand.bet) {
        setCashierMode("deposit");
        setCashierOpen(true);
        showToast("Top up your PHP balance to double.");
        return;
      }
      if (freeDouble) {
        hand.freeStake += hand.bet;
        hand.action = "FREE DOUBLE";
      } else {
        updateBalance((balance) => balance - hand.bet);
        hand.paidStake += hand.bet;
        hand.action = "DOUBLE";
      }
      hand.cards.push(drawWithMotion(0));
      hand.state = "done";
    }

    if (action === "split") {
      if (!isPair(hand.cards)) return;
      if (!freeSplit && walletBalance < hand.bet) {
        setCashierMode("deposit");
        setCashierOpen(true);
        showToast("Top up your PHP balance to split.");
        return;
      }

      if (!freeSplit) updateBalance((balance) => balance - hand.bet);
      const [firstCard, secondCard] = hand.cards;
      const splitAces = firstCard.rank === "A";
      const firstHand = {
        ...hand,
        id: `${hand.id}-a`,
        cards: [firstCard, drawWithMotion(0)],
        state: splitAces ? "done" : "active",
        action: freeSplit ? "FREE SPLIT" : "SPLIT",
      };
      const secondHand = {
        ...hand,
        id: `${hand.id}-b`,
        cards: [secondCard, drawWithMotion(1)],
        paidStake: freeSplit ? 0 : hand.bet,
        freeStake: freeSplit ? hand.bet : 0,
        state: splitAces ? "done" : "active",
        action: freeSplit ? "FREE SPLIT" : "SPLIT",
      };
      if (isHandComplete(firstHand.cards, mode)) firstHand.state = "done";
      if (isHandComplete(secondHand.cards, mode)) secondHand.state = "done";
      seat.hands.splice(next.activeHand, 1, firstHand, secondHand);
    }

    if (action === "stand") playTone(240, 0.07);
    else {
      playCardSound(7);
      if (action === "split") window.setTimeout(() => playCardSound(8), speedConfig.step);
    }

    const active = seat.hands[next.activeHand];
    if (active.state === "done") {
      finishOrAdvance(next, automatic ? `AUTO ${action.toUpperCase()} · TIMER EXPIRED` : "");
    }
    else {
      commitGame(next);
      setDecisionNonce((nonce) => nonce + 1);
    }
  };

  actRef.current = act;

  const chooseRole = (seatIndex, role) => {
    const current = gameRef.current;
    if (!["betting", "settled"].includes(current.phase)) return;
    const next = copyGame(current);

    if (role === "you") {
      next.seats.forEach((seat, index) => {
        if (index !== seatIndex && seat.role === "you") {
          seat.role = "ai";
          seat.name = AI_NAMES.find((name) => !next.seats.some((item) => item.name === name)) ?? "Nova";
        }
      });
    }

    const target = next.seats[seatIndex];
    target.role = role;
    target.name = role === "you"
      ? "You"
      : role === "empty"
        ? "Empty"
        : target.name === "You" || target.name === "Empty"
          ? AI_NAMES.find((name) => !next.seats.some((seat) => seat.name === name)) ?? "Nova"
          : target.name;
    target.hands = [];

    next.phase = "betting";
    next.message = role === "empty" ? "SEAT CLEARED" : `${target.name.toUpperCase()} TOOK THE SEAT`;
    next.activeSeat = null;
    setSelectedSeat(null);
    commitGame(next);
    playTone(320, 0.05);
  };

  const changeMode = (nextMode) => {
    if (!["betting", "settled"].includes(game.phase)) return;
    setMode(nextMode);
    const next = copyGame(gameRef.current);
    next.phase = "betting";
    next.message = nextMode === "freebet" ? "FREE BET TABLE" : "CLASSIC TABLE";
    next.activeSeat = null;
    commitGame(next);
  };

  const submitCashier = (event) => {
    event.preventDefault();
    const amount = Number(depositAmount);
    const transactionLabel = cashierMode === "withdraw" ? "withdrawal" : "deposit";
    if (!Number.isFinite(amount) || amount < 100 || amount > CASHIER_MAX) {
      showToast(`Choose a ${transactionLabel} from ₱100 to ${formatPeso(CASHIER_MAX)}.`);
      return;
    }
    if (cashierMode === "withdraw" && amount > cashierAvailable) {
      showToast(`Available to withdraw: ${formatPeso(cashierAvailable)}.`);
      return;
    }
    if (cashierStep === "details") {
      if (cashierMode === "withdraw" && depositAccount.trim().length < 6) {
        showToast(depositMethod === "bank" ? "Enter the receiving bank account or mobile number." : `Enter the mobile number linked to ${depositProvider.label}.`);
        return;
      }
      setCashierReference(cashierMode === "deposit" ? `CLD-${Date.now().toString(36).slice(-7).toUpperCase()}` : "");
      setCashierStep("review");
      playTone(420, 0.05);
      return;
    }
    setCashierProcessing(true);
    window.setTimeout(() => {
      const isWithdrawal = cashierMode === "withdraw";
      updateBalance((balance) => isWithdrawal ? Math.max(0, balance - amount) : balance + amount);
      fetch(isWithdrawal ? "/api/withdrawals" : "/api/deposits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, method: depositMethod }),
      }).catch(() => {});
      setCashierProcessing(false);
      setCashierOpen(false);
      setCashierStep("details");
      setCashierReference("");
      playTone(680, 0.13);
      const reference = isWithdrawal
        ? `CLW-${Date.now().toString(36).slice(-7).toUpperCase()}`
        : cashierReference || `CLD-${Date.now().toString(36).slice(-7).toUpperCase()}`;
      showToast(isWithdrawal
        ? `${formatPeso(amount)} withdrawal sent to ${depositProvider.label} · ${reference}`
        : `${formatPeso(amount)} received via ${depositProvider.label} · ${reference}`);
    }, 850);
  };

  const copyDepositLink = () => {
    const depositLink = `cleopatra://deposit/${cashierReference || "pending"}`;
    navigator.clipboard?.writeText(depositLink).catch(() => {});
    showToast("CLEOPATRA deposit link copied.");
  };

  const resetTable = (requestedDeckCount = deckCount) => {
    const nextDeckCount = Number.isInteger(requestedDeckCount) ? requestedDeckCount : deckCount;
    const reset = copyGame(INITIAL_GAME);
    reset.seats = gameRef.current.seats.map((seat) => ({ ...seat, hands: [] }));
    reset.dealer = { cards: [], hidden: false };
    reset.message = "NEW SHOE READY";
    commitGame(reset);
    setDeckCount(nextDeckCount);
    loadShoe(nextDeckCount);
    advanceDecisionRef.current = null;
    setAdvanceDecision(null);
    setMenuOpen(false);
    showToast(`Fresh ${nextDeckCount}-deck shoe loaded.`);
  };

  const activeHand = useMemo(() => {
    if (game.phase !== "playing" || game.activeSeat === null) return null;
    const hand = game.seats[game.activeSeat]?.hands[game.activeHand] ?? null;
    return hand && hand.state !== "done" && !isHandComplete(hand.cards, mode) ? hand : null;
  }, [game, mode]);

  const advanceHand = useMemo(() => {
    if (game.phase !== "ai-turn" || tableVariant !== "arena") return null;
    const humanSeat = game.seats.find((seat) => seat.role === "you");
    const hand = humanSeat?.hands.find((item) => item.state !== "done" && !isHandComplete(item.cards, mode)) ?? null;
    return hand;
  }, [game, tableVariant, mode]);
  const decisionHand = activeHand ?? advanceHand;
  const isAdvanceMode = Boolean(advanceHand && !activeHand);
  const canHit = Boolean(decisionHand && handValue(decisionHand.cards).total < 21);
  const canDouble = Boolean(decisionHand && decisionHand.cards.length === 2);
  const canSplit = Boolean(decisionHand && isPair(decisionHand.cards));
  const freeDouble = Boolean(decisionHand && mode === "freebet" && qualifiesFreeDouble(decisionHand.cards));
  const freeSplit = Boolean(decisionHand && mode === "freebet" && qualifiesFreeSplit(decisionHand.cards));
  const SpeedIcon = dealSpeed === "turbo" ? Lightning : dealSpeed === "slow" ? Hourglass : Gauge;

  const handleDecision = (action) => {
    if (isAdvanceMode) queueAdvanceDecision(action);
    else act(action);
  };

  useEffect(() => {
    window.clearInterval(decisionTimerRef.current);
    if (game.phase !== "playing" || game.activeSeat === null) return undefined;

    let remaining = decisionLimit;
    setDecisionSeconds(remaining);
    decisionTimerRef.current = window.setInterval(() => {
      remaining -= 1;
      setDecisionSeconds(Math.max(0, remaining));
      if (remaining <= 0) {
        window.clearInterval(decisionTimerRef.current);
        const current = gameRef.current;
        const expiringHand = current.activeSeat === null
          ? null
          : current.seats[current.activeSeat]?.hands[current.activeHand];
        const timedAction = tableVariant === "solo" && expiringHand
          ? timeoutDecision(expiringHand.cards)
          : "stand";
        window.setTimeout(
          () => actRef.current?.(timedAction, { automatic: tableVariant === "solo" }),
          0,
        );
        return;
      }
      if (remaining <= 3) playTone(190 + remaining * 35, 0.045);
    }, 1000);

    return () => window.clearInterval(decisionTimerRef.current);
  }, [game.phase, game.activeSeat, game.activeHand, game.round, decisionNonce, decisionLimit, tableVariant]);

  const cycleDealSpeed = () => {
    if (!["betting", "settled"].includes(gameRef.current.phase)) return;
    setDealSpeed((current) => DEAL_SPEED_ORDER[(DEAL_SPEED_ORDER.indexOf(current) + 1) % DEAL_SPEED_ORDER.length]);
    playTone(dealSpeed === "normal" ? 720 : dealSpeed === "turbo" ? 260 : 480, 0.06);
  };

  if (view === "lobby") {
    return (
      <>
        <CasinoLobby stats={casinoStats} dailyPlayers={dailySoloPlayers} onEnter={enterTable} onHistory={() => setHistoryOpen(true)} />
        {historyOpen && <HistoryModal history={betHistory} stats={casinoStats} onClose={() => setHistoryOpen(false)} />}
      </>
    );
  }

  return (
    <main
      className={`casino-app phase-${game.phase} table-${tableVariant}${tableVariant === "solo" && ["betting", "settled"].includes(game.phase) ? " is-solo-betting" : ""}${tableVariant === "solo" && game.spectator && ROUND_LOCKED_PHASES.includes(game.phase) ? " is-spectator-round" : ""}`}
      style={{ "--card-deal-duration": `${speedConfig.card}ms`, "--dealer-reveal-duration": `${speedConfig.reveal}ms` }}
      onClick={() => selectedSeat !== null && setSelectedSeat(null)}
    >
      <header className="topbar">
        <div className="topbar-left">
          <button type="button" className="icon-button menu-button" onClick={(event) => { event.stopPropagation(); setMenuOpen((open) => !open); }} aria-label="Open table menu">
            <List size={25} weight="bold" aria-hidden="true" />
          </button>
          <button type="button" className="topbar-brand-button" onClick={() => !ROUND_LOCKED_PHASES.includes(game.phase) && setView("lobby")} aria-label="Open Cleopatra Casino lobby" disabled={ROUND_LOCKED_PHASES.includes(game.phase)}>
            <BrandLockup compact />
          </button>
          <div className="balance-panel" aria-label={`PHP balance ${formatPeso(walletBalance)}`}>
            <div>
              <span>PHP BALANCE</span>
              <strong>{formatPeso(walletBalance)}</strong>
            </div>
            <PokerChip size={32} weight="duotone" aria-hidden="true" />
          </div>
          {menuOpen && (
            <div className="table-menu" onClick={(event) => event.stopPropagation()}>
              <span>TABLE MENU</span>
              <button type="button" onClick={() => resetTable(deckCount)}>New {deckCount}-deck shoe</button>
              <button type="button" onClick={() => { setSettingsOpen(true); setMenuOpen(false); }}>Table settings</button>
              <button type="button" onClick={() => { setInfoOpen(true); setMenuOpen(false); }}>Rules & payouts</button>
              <button type="button" onClick={() => { setHistoryOpen(true); setMenuOpen(false); }}>Bet history & revenue</button>
              <button type="button" onClick={() => { setView("lobby"); setMenuOpen(false); }}>Casino lobby</button>
            </div>
          )}
        </div>

        <div className="mode-toggle" aria-label="Blackjack game mode">
          <button type="button" className={mode === "classic" ? "is-active" : ""} onClick={() => changeMode("classic")} disabled={ROUND_LOCKED_PHASES.includes(game.phase)}>CLASSIC</button>
          <button type="button" className={mode === "freebet" ? "is-active" : ""} onClick={() => changeMode("freebet")} disabled={ROUND_LOCKED_PHASES.includes(game.phase)}>FREE BET</button>
        </div>

        <div className="topbar-actions">
          <button type="button" className="history-button topbar-history" onClick={() => setHistoryOpen(true)}><ClockCounterClockwise size={18} /> HISTORY</button>
          <button type="button" className="deposit-button" onClick={() => setCashierOpen(true)}>CASHIER</button>
          <button type="button" className="icon-button sound-button" onClick={() => setSoundOn((enabled) => !enabled)} aria-label={soundOn ? "Mute sound" : "Enable sound"}>
            {soundOn ? <SpeakerHigh size={24} aria-hidden="true" /> : <SpeakerSlash size={24} aria-hidden="true" />}
          </button>
          <button type="button" className="icon-button" onClick={() => setSettingsOpen(true)} aria-label="Open table settings">
            <Gear size={24} aria-hidden="true" />
          </button>
          <button type="button" className="icon-button help-button" onClick={() => setInfoOpen(true)} aria-label="How to play">
            <Question size={24} weight="bold" aria-hidden="true" />
          </button>
        </div>
      </header>

      {touchChipDrag && (
        <ChipAsset
          value={touchChipDrag.value}
          className="touch-chip-ghost"
          style={{ left: touchChipDrag.x, top: touchChipDrag.y }}
          alt=""
        />
      )}

      <section className="table-stage" aria-label={`${mode === "freebet" ? "Free Bet" : "Classic"} Blackjack table`}>
        <img className="table-background" src="/assets/carbon-club-table.png" alt="Premium graphite blackjack table with card shoe and chip rack" />

        <div className="table-session-badge"><span></span>{tableVariant === "solo" ? "CLEOPATRA ONE · SOLO" : "CLEOPATRA ROYALE · 6 SEATS"} · {deckCount} DECKS</div>
        <div className={`table-stats-panel${statsMinimized ? " is-minimized" : ""}`}>
          <button type="button" className="stats-collapse" onClick={() => setStatsMinimized((value) => !value)} aria-label={statsMinimized ? "Show revenue statistics" : "Minimize revenue statistics"}>
            {statsMinimized ? <ChartLineUp size={18} weight="duotone" /> : <CaretUp size={17} weight="bold" />}
            <span>{statsMinimized ? "STATS" : "MINIMIZE"}</span>
          </button>
          {!statsMinimized && (
            <>
              <LiveStats stats={casinoStats} compact />
              <div className="stats-actions" aria-label="Revenue statistics actions">
                <button type="button" className="stats-action" onClick={saveRevenueSnapshot}>
                  <DownloadSimple size={13} weight="bold" aria-hidden="true" /> SAVE
                </button>
                <button
                  type="button"
                  className={`stats-action is-danger${statsResetArmed ? " is-armed" : ""}`}
                  onClick={armOrResetRevenueStats}
                  disabled={ROUND_LOCKED_PHASES.includes(game.phase)}
                >
                  <Trash size={13} weight="bold" aria-hidden="true" /> {statsResetArmed ? "CONFIRM" : "RESET"}
                </button>
              </div>
            </>
          )}
        </div>

        <div className="table-message" role="status" aria-live="polite">
          <span className={`status-dot phase-${game.phase}`}></span>
          {game.message}
        </div>

        {sideBetAnnouncement && (
          <div className="side-bet-announcement" role="status" aria-live="polite">
            <Trophy size={20} weight="fill" aria-hidden="true" />
            <span>
              <small>SIDE BET HIT</small>
              <strong>{sideBetAnnouncement.wins.map((win) => `${win.label} · ${win.result} +${formatPeso(win.profit)}`).join("  •  ")}</strong>
            </span>
          </div>
        )}

        {totalWinPopup && (
          <div className="total-win-popup" role="status" aria-live="assertive">
            <div className="total-win-panel">
              <span className="total-win-icon"><Trophy size={30} weight="fill" aria-hidden="true" /></span>
              <span className="total-win-copy">
                <small>{totalWinPopup.label}</small>
                <strong>TOTAL WIN</strong>
              </span>
              <b>{formatPeso(totalWinPopup.amount)}</b>
            </div>
          </div>
        )}

        {tableVariant === "solo" && ["betting", "settled"].includes(game.phase) && !totalWinPopup && (
          <SoloBettingPrompt
            seconds={bettingSeconds}
            selectedChip={selectedChip}
            selectedBet={selectedBet}
            disabled={!['betting', 'settled'].includes(game.phase)}
            onChip={handleChipTap}
            onChipPointerDown={beginTouchChipDrag}
            onChipPointerMove={moveTouchChipDrag}
            onChipPointerUp={finishTouchChipDrag}
            onChipPointerCancel={cancelTouchChipDrag}
            onUndo={undoChip}
            onDouble={doubleBet}
          />
        )}

        <button
          type="button"
          className={`deal-speed-control speed-${dealSpeed}`}
          onClick={cycleDealSpeed}
          disabled={!['betting', 'settled'].includes(game.phase)}
          aria-label={`Deal speed ${speedConfig.label}. Click to change`}
        >
          <SpeedIcon size={20} weight={dealSpeed === "turbo" ? "fill" : "duotone"} aria-hidden="true" />
          <span><small>DEAL SPEED</small><strong>{speedConfig.label}</strong></span>
        </button>

        <div className="dealer-zone" aria-label="Dealer hand">
          <span className="zone-label">DEALER</span>
          {game.dealer.cards.length ? (
            <Hand hand={displayHand("dealer", game.dealer.cards)} hiddenCard={game.dealer.hidden} concealTotal={game.dealer.totalHidden} isDealer />
          ) : (
            <div className="dealer-placeholder"><CardsThree size={34} weight="duotone" aria-hidden="true" /></div>
          )}
        </div>

        <div className="table-brand" aria-label="Cleopatra Casino Blackjack table">
          <img src="/assets/brand/cleon-casino-mark.png" alt="" aria-hidden="true" />
          <span><strong>CLEOPATRA CASINO</strong><small>BLACKJACK</small></span>
        </div>

        <div className="table-rules" aria-hidden="true">
          <strong>BLACKJACK PAYS 3 TO 2</strong>
          <span>{mode === "freebet" ? "FREE DOUBLE ON HARD 9 · 10 · 11" : "DEALER STANDS ON ALL 17"}</span>
          <b>{mode === "freebet" ? "DEALER 22 PUSHES" : "INSURANCE PAYS 2 TO 1"}</b>
        </div>

        <div className="center-betting-arc" aria-label="Main and side bet spots">
          <BettingSpot
            id="hot-three"
            label="HOT 3"
            odds="1:1—100:1"
            Icon={FireSimple}
            values={sideBetStacks.hotThree}
            total={sideBetTotals.hotThree}
            result={game.phase === "settled" || game.sideBets.hotThree?.returned > game.sideBets.hotThree?.stake ? game.sideBets.hotThree : null}
            dragging={Boolean(draggingChip)}
            disabled={!['betting', 'settled'].includes(game.phase)}
            onPlace={(value) => placeChip("hotThree", value)}
            onClear={() => clearSideBet("hotThree")}
          />
          <BettingSpot
            id="twenty-one-three"
            label="21+3"
            odds="5:1—100:1"
            Icon={CardsThree}
            values={sideBetStacks.twentyOneThree}
            total={sideBetTotals.twentyOneThree}
            result={game.phase === "settled" || game.sideBets.twentyOneThree?.returned > game.sideBets.twentyOneThree?.stake ? game.sideBets.twentyOneThree : null}
            dragging={Boolean(draggingChip)}
            disabled={!['betting', 'settled'].includes(game.phase)}
            onPlace={(value) => placeChip("twentyOneThree", value)}
            onClear={() => clearSideBet("twentyOneThree")}
          />
          <button
            type="button"
            className={`main-bet-circle${selectedBet > 0 ? " has-bet" : ""}${draggingChip ? " is-drop-ready" : ""}`}
            data-bet-target="main"
            disabled={!['betting', 'settled'].includes(game.phase)}
            onClick={() => placeChip("main")}
            onDragOver={(event) => {
              if (!['betting', 'settled'].includes(game.phase)) return;
              event.preventDefault();
              event.dataTransfer.dropEffect = "copy";
            }}
            onDrop={(event) => {
              event.preventDefault();
              const value = Number(event.dataTransfer.getData("application/x-blackjack-chip") || event.dataTransfer.getData("text/plain"));
              if (Number.isFinite(value)) placeChip("main", value);
            }}
            aria-label={`Main bet ${formatPeso(selectedBet)}. Tap or drop a chip to add.`}
          >
            <PokerChip className="main-bet-icon" size={58} weight="duotone" aria-hidden="true" />
            <span>MAIN BET</span>
            {selectedBet > 0 ? <BetStack values={betStack} total={selectedBet} compact /> : <small>DROP CHIP</small>}
          </button>
          <BettingSpot
            id="perfect-pairs"
            label="PERFECT PAIRS"
            odds="6:1—25:1"
            Icon={PokerChip}
            values={sideBetStacks.perfectPairs}
            total={sideBetTotals.perfectPairs}
            result={game.phase === "settled" || game.sideBets.perfectPairs?.returned > game.sideBets.perfectPairs?.stake ? game.sideBets.perfectPairs : null}
            dragging={Boolean(draggingChip)}
            disabled={!['betting', 'settled'].includes(game.phase)}
            onPlace={(value) => placeChip("perfectPairs", value)}
            onClear={() => clearSideBet("perfectPairs")}
          />
          <BettingSpot
            id="bust-it"
            label="BUST IT"
            odds="1:1—250:1"
            Icon={Seal}
            values={sideBetStacks.bustIt}
            total={sideBetTotals.bustIt}
            result={game.phase === "settled" || game.sideBets.bustIt?.returned > game.sideBets.bustIt?.stake ? game.sideBets.bustIt : null}
            dragging={Boolean(draggingChip)}
            disabled={!['betting', 'settled'].includes(game.phase)}
            onPlace={(value) => placeChip("bustIt", value)}
            onClear={() => clearSideBet("bustIt")}
          />
          <div className="table-win-streak">
            <WinStreakBadge value={winStreak} compact />
          </div>
        </div>

        <section className={`table-decision-controls${isAdvanceMode ? " is-advance-mode" : ""}${decisionSeconds <= 3 ? " is-urgent" : ""}`} aria-label="Player decisions">
          <div className="table-decision-heading" role="status" aria-live="polite">
            <span className="status-dot phase-playing"></span>
            <strong>
              {isAdvanceMode
                ? advanceDecision ? `${advanceDecision.toUpperCase()} QUEUED` : "ADVANCE DECISION"
                : decisionHand ? `YOUR MOVE · ${decisionSeconds} SECONDS` : "PLAYER DECISIONS"}
            </strong>
            <small>{isAdvanceMode ? "CHOOSE BEFORE YOUR TURN" : "HIT · STAND · DOUBLE · SPLIT"}</small>
          </div>
          <div className={`action-controls${isAdvanceMode ? " is-advance-mode" : ""}`}>
            <button type="button" className={advanceDecision === "hit" ? "is-queued" : ""} onClick={() => handleDecision("hit")} disabled={!canHit} aria-pressed={isAdvanceMode ? advanceDecision === "hit" : undefined}>
              <Plus size={20} weight="bold" aria-hidden="true" />
              {isAdvanceMode && advanceDecision === "hit" ? "HIT QUEUED" : "HIT"}
            </button>
            <button type="button" className={advanceDecision === "stand" ? "is-queued" : ""} onClick={() => handleDecision("stand")} disabled={!decisionHand} aria-pressed={isAdvanceMode ? advanceDecision === "stand" : undefined}>
              <HandPalm size={21} aria-hidden="true" />
              {isAdvanceMode && advanceDecision === "stand" ? "STAND QUEUED" : "STAND"}
            </button>
            <button type="button" className={`${freeDouble ? "free-action" : ""}${advanceDecision === "double" ? " is-queued" : ""}`} onClick={() => handleDecision("double")} disabled={!canDouble} aria-pressed={isAdvanceMode ? advanceDecision === "double" : undefined}>
              {freeDouble && <span className="free-bet-badge"><Lightning size={10} weight="fill" /> FREE BET</span>}
              <PokerChip size={20} weight="duotone" aria-hidden="true" />
              {isAdvanceMode && advanceDecision === "double" ? "DOUBLE QUEUED" : freeDouble ? "FREE DOUBLE" : "DOUBLE"}
            </button>
            <button type="button" className={`${freeSplit ? "free-action" : ""}${advanceDecision === "split" ? " is-queued" : ""}`} onClick={() => handleDecision("split")} disabled={!canSplit} aria-pressed={isAdvanceMode ? advanceDecision === "split" : undefined}>
              {freeSplit && <span className="free-bet-badge"><Lightning size={10} weight="fill" /> FREE BET</span>}
              <ArrowsLeftRight size={21} aria-hidden="true" />
              {isAdvanceMode && advanceDecision === "split" ? "SPLIT QUEUED" : freeSplit ? "FREE SPLIT" : "SPLIT"}
            </button>
          </div>
        </section>

        <div className="seats-layer">
          {game.seats.map((seat, index) => (
            <Seat
              key={seat.id}
              seat={seat}
              index={index}
              game={game}
              selected={selectedSeat === index}
              onSelect={(seatIndex) => { setSelectedSeat((current) => current === seatIndex ? null : seatIndex); }}
              onRoleChange={chooseRole}
              pendingBet={selectedBet}
              pendingChips={betStack}
              draggingChip={draggingChip}
              onBetDrop={(value) => placeChip("main", value)}
              decisionSeconds={decisionSeconds}
              decisionLimit={game.phase === "ai-turn" ? 10 : decisionLimit}
            />
          ))}
        </div>

        {chipFlight && (
          <ChipAsset
            key={chipFlight.id}
            value={chipFlight.value}
            className={`chip-flight to-${chipFlight.target}`}
            style={chipFlight.style}
          />
        )}

        <button type="button" className={`shoe-meter${showCardCount ? " is-open" : ""}`} onClick={() => setShowCardCount((visible) => !visible)} aria-label={showCardCount ? `Running count ${runningCount}, true count ${trueCount.toFixed(1)}, ${shoeCount} cards remaining. Hide card count.` : "Open card count"}>
          {showCardCount ? (
            <><strong>RC {runningCount >= 0 ? "+" : ""}{runningCount}</strong><span>TC {trueCount >= 0 ? "+" : ""}{trueCount.toFixed(1)}</span><small>{shoeCount} LEFT</small></>
          ) : (
            <><EyeSlash size={17} weight="duotone" aria-hidden="true" /><small>COUNT</small></>
          )}
        </button>
      </section>

      <section className="control-dock" aria-label="Blackjack controls">
        {isAdvanceMode && (
          <div className="advance-decision-bar" role="status" aria-live="polite">
            <Lightning size={16} weight="fill" aria-hidden="true" />
            <span><strong>ADVANCE DECISION</strong><small>Choose now while {game.seats[game.activeSeat]?.name ?? "another seat"} plays</small></span>
            <b>{advanceDecision ? `${advanceDecision.toUpperCase()} QUEUED` : "READY"}</b>
          </div>
        )}
        <div className="bet-controls">
          <div className="bet-heading">
            <span>DRAG A CHIP · TAP ADDS MAIN</span>
            <strong>TOTAL {formatPeso(totalSelectedBet)}</strong>
          </div>
          <div className="bet-row">
            <button type="button" className="mini-control" onClick={undoChip} disabled={!betStack.length || !["betting", "settled"].includes(game.phase)} aria-label="Undo last chip">
              <ArrowCounterClockwise size={16} weight="bold" aria-hidden="true" />
            </button>
            {BETS.map((bet) => (
              <button
                key={bet}
                type="button"
                className={`chip-button${selectedChip === bet ? " is-active" : ""}${draggingChip === bet ? " is-dragging" : ""}`}
                onClick={(event) => handleChipTap(event, bet)}
                disabled={!['betting', 'settled'].includes(game.phase)}
                draggable={!isMobileTable && ['betting', 'settled'].includes(game.phase)}
                onDragStart={(event) => beginChipDrag(event, bet)}
                onDragEnd={() => setDraggingChip(null)}
                onPointerDown={(event) => beginTouchChipDrag(event, bet)}
                onPointerMove={moveTouchChipDrag}
                onPointerUp={finishTouchChipDrag}
                onPointerCancel={cancelTouchChipDrag}
                aria-label={`Add ${formatPeso(bet)} chip to main bet. Drag to another betting spot.`}
              >
                <ChipAsset value={bet} className="rack-chip" />
                <span>+{formatPeso(bet).replace(".00", "")}</span>
              </button>
            ))}
            <button type="button" className="mini-control clear-control" onClick={clearBet} disabled={!betStack.length || !["betting", "settled"].includes(game.phase)} aria-label="Clear bet">
              <Trash size={16} weight="bold" aria-hidden="true" />
            </button>
          </div>
        </div>

        <button type="button" className="deal-button" onClick={startRound} disabled={selectedBet <= 0 || ROUND_LOCKED_PHASES.includes(game.phase)}>
          <CardsThree size={26} weight="duotone" aria-hidden="true" />
          {game.phase === "settled" ? "DEAL AGAIN" : "DEAL"}
        </button>

        <div className={`action-controls${isAdvanceMode ? " is-advance-mode" : ""}`}>
          <button type="button" className={advanceDecision === "hit" ? "is-queued" : ""} onClick={() => handleDecision("hit")} disabled={!canHit} aria-pressed={isAdvanceMode ? advanceDecision === "hit" : undefined}>
            <Plus size={20} weight="bold" aria-hidden="true" />
            {isAdvanceMode && advanceDecision === "hit" ? "HIT QUEUED" : "HIT"}
          </button>
          <button type="button" className={advanceDecision === "stand" ? "is-queued" : ""} onClick={() => handleDecision("stand")} disabled={!decisionHand} aria-pressed={isAdvanceMode ? advanceDecision === "stand" : undefined}>
            <HandPalm size={21} aria-hidden="true" />
            {isAdvanceMode && advanceDecision === "stand" ? "STAND QUEUED" : "STAND"}
          </button>
          <button type="button" className={`${freeDouble ? "free-action" : ""}${advanceDecision === "double" ? " is-queued" : ""}`} onClick={() => handleDecision("double")} disabled={!canDouble} aria-pressed={isAdvanceMode ? advanceDecision === "double" : undefined}>
            {freeDouble && <span className="free-bet-badge"><Lightning size={10} weight="fill" /> FREE BET</span>}
            <PokerChip size={20} weight="duotone" aria-hidden="true" />
            {isAdvanceMode && advanceDecision === "double" ? "DOUBLE QUEUED" : freeDouble ? "FREE DOUBLE" : "DOUBLE"}
          </button>
          <button type="button" className={`${freeSplit ? "free-action" : ""}${advanceDecision === "split" ? " is-queued" : ""}`} onClick={() => handleDecision("split")} disabled={!canSplit} aria-pressed={isAdvanceMode ? advanceDecision === "split" : undefined}>
            {freeSplit && <span className="free-bet-badge"><Lightning size={10} weight="fill" /> FREE BET</span>}
            <ArrowsLeftRight size={21} aria-hidden="true" />
            {isAdvanceMode && advanceDecision === "split" ? "SPLIT QUEUED" : freeSplit ? "FREE SPLIT" : "SPLIT"}
          </button>
        </div>
      </section>

      {cashierOpen && (
        <Modal title="CLEOPATRA Cashier" onClose={() => { if (!cashierProcessing) { setCashierOpen(false); setCashierStep("details"); setCashierReference(""); } }} className="deposit-modal cashier-modal">
          <form className={cashierStep === "review" && cashierMode === "deposit" ? "is-deposit-request" : ""} onSubmit={submitCashier}>
            <div className="cashier-mode-tabs" role="tablist" aria-label="Cashier transaction">
              <button
                type="button"
                className={cashierMode === "deposit" ? "is-active" : ""}
                onClick={() => { setCashierMode("deposit"); setCashierStep("details"); setCashierReference(""); }}
                role="tab"
                aria-selected={cashierMode === "deposit"}
              >
                <ArrowDown size={17} weight="bold" /> DEPOSIT
              </button>
              <button
                type="button"
                className={cashierMode === "withdraw" ? "is-active" : ""}
                onClick={() => { setCashierMode("withdraw"); setCashierStep("details"); setCashierReference(""); }}
                role="tab"
                aria-selected={cashierMode === "withdraw"}
              >
                <ArrowUp size={17} weight="bold" /> WITHDRAW
              </button>
            </div>
            {cashierStep === "details" ? (
              <>
                <p className="modal-intro">
                  {cashierMode === "deposit"
                    ? "Choose a Philippine channel and generate your payment request."
                    : "Choose where to send funds from your CLEOPATRA PHP balance."}
                </p>
                <div className="cashier-trust-row">
                  <PokerChip size={17} weight="duotone" />
                  <span>{cashierMode === "withdraw" ? "WITHDRAWABLE BALANCE" : "PHP BALANCE"}</span>
                  <b>{formatPeso(cashierMode === "withdraw" ? cashierAvailable : walletBalance)}</b>
                  <small>AVAILABLE</small>
                </div>
                <div className="method-grid" role="radiogroup" aria-label={`${cashierMode === "deposit" ? "Deposit" : "Withdrawal"} method`}>
                  {PAYMENT_METHODS.map(({ id, label, helper, tone, ...provider }) => (
                    <button key={id} type="button" className={`${depositMethod === id ? "is-selected" : ""} provider-${tone}`} onClick={() => { setDepositMethod(id); setDepositAccount(""); }} role="radio" aria-checked={depositMethod === id}>
                      <span className="provider-icon"><PaymentBrand provider={{ id, label, helper, tone, ...provider }} /></span>
                      <span className="provider-copy"><strong>{label}</strong><small>{helper}</small></span>
                      {depositMethod === id && <CheckCircle size={18} weight="fill" aria-hidden="true" />}
                    </button>
                  ))}
                </div>

                {cashierMode === "withdraw" && (
                  <label className="account-field">
                    <span>Receiving {depositMethod === "bank" ? "bank account or mobile number" : `${depositProvider.label} mobile number`}</span>
                    <div><PaymentBrand provider={depositProvider} compact /><input type="text" inputMode="tel" autoComplete="tel" placeholder="09XX XXX XXXX" value={depositAccount} onChange={(event) => setDepositAccount(event.target.value)} /></div>
                  </label>
                )}

                <label className="amount-field">
                  <span>{cashierMode === "withdraw" ? "Withdrawal" : "Deposit"} amount · max {formatPeso(cashierMode === "withdraw" ? Math.min(CASHIER_MAX, cashierAvailable) : CASHIER_MAX)}</span>
                  <div><b>₱</b><input type="number" min="100" max={cashierMode === "withdraw" ? Math.min(CASHIER_MAX, cashierAvailable) : CASHIER_MAX} step="100" value={depositAmount} onChange={(event) => setDepositAmount(event.target.value)} /></div>
                </label>
                <div className="quick-amounts" aria-label={`Quick ${cashierMode} amounts`}>
                  {(cashierMode === "withdraw" ? [500, 1000, 5000, 10000] : [1000, 10000, 50000, 250000]).map((amount) => (
                    <button key={amount} type="button" disabled={cashierMode === "withdraw" && amount > cashierAvailable} className={Number(depositAmount) === amount ? "is-selected" : ""} onClick={() => setDepositAmount(amount)}>{cashierMode === "withdraw" ? "−" : "+"}{formatPeso(amount).replace(".00", "")}</button>
                  ))}
                </div>
              </>
            ) : (
              <div className="cashier-review">
                <span className={`review-provider provider-${depositProvider.tone}`}><PaymentBrand provider={depositProvider} compact /><b>{depositProvider.label}</b></span>
                {cashierMode === "deposit" ? (
                  <>
                    <h3>Scan to deposit</h3>
                    <p className="payment-request-copy">Scan with {depositProvider.label}, or copy the payment link and finish in your wallet app.</p>
                    <PaymentQr provider={depositProvider} reference={cashierReference} />
                    <button type="button" className="payment-link-card" onClick={copyDepositLink}>
                      <LinkSimple size={19} weight="bold" aria-hidden="true" />
                      <span><small>PAYMENT LINK</small><strong>{cashierReference}</strong></span>
                      <Copy size={17} weight="bold" aria-hidden="true" />
                    </button>
                    <div className="deposit-request-total"><span>AMOUNT TO PAY</span><strong>{formatPeso(Number(depositAmount) || 0)}</strong></div>
                  </>
                ) : (
                  <>
                    <h3>Confirm your withdrawal</h3>
                    <dl>
                      <div><dt>Debit from</dt><dd>CLEOPATRA PHP BALANCE</dd></div>
                      <div><dt>Send to</dt><dd>{depositAccount}</dd></div>
                      <div><dt>Withdrawal</dt><dd>{formatPeso(Number(depositAmount) || 0)}</dd></div>
                      <div><dt>Processing fee</dt><dd>₱0.00</dd></div>
                      <div className="review-total"><dt>Total</dt><dd>{formatPeso(Number(depositAmount) || 0)}</dd></div>
                    </dl>
                  </>
                )}
                <button type="button" className="cashier-back" onClick={() => setCashierStep("details")} disabled={cashierProcessing}>EDIT DETAILS</button>
              </div>
            )}
            <button type="submit" className={`cashier-submit is-${cashierMode}`} disabled={cashierProcessing}>
              {cashierProcessing
                ? <SpinnerGap className="spinner" size={22} aria-hidden="true" />
                : cashierMode === "withdraw"
                  ? <ArrowUp size={22} weight="bold" aria-hidden="true" />
                  : cashierStep === "review"
                    ? <QrCode size={22} weight="bold" aria-hidden="true" />
                    : <ArrowDown size={22} weight="bold" aria-hidden="true" />}
              {cashierProcessing
                ? `PROCESSING ${cashierMode.toUpperCase()}`
                : cashierStep === "details"
                  ? "CONTINUE"
                  : cashierMode === "withdraw"
                    ? `CONFIRM ${formatPeso(Number(depositAmount) || 0)}`
                    : `I'VE PAID · CREDIT ${formatPeso(Number(depositAmount) || 0)}`}
            </button>
          </form>
        </Modal>
      )}

      {settingsOpen && (
        <TableSettingsModal
          deckCount={deckCount}
          showCardCount={showCardCount}
          statsMinimized={statsMinimized}
          dealSpeed={dealSpeed}
          onDeckCount={(count) => { resetTable(count); setSettingsOpen(false); }}
          onCardCount={setShowCardCount}
          onStatsMinimized={setStatsMinimized}
          onDealSpeed={setDealSpeed}
          onClose={() => setSettingsOpen(false)}
        />
      )}

      {infoOpen && (
        <Modal title={mode === "freebet" ? "Free Bet rules" : "Classic rules"} onClose={() => setInfoOpen(false)} className="rules-modal">
          <div className="rules-content">
            {mode === "freebet" ? (
              <>
                <div><strong>Free Double</strong><p>Hard totals of 9, 10, or 11 receive one extra card with the extra stake covered.</p></div>
                <div><strong>Free Split</strong><p>Split matching-rank pairs for free except 10s, Jacks, Queens, and Kings.</p></div>
                <div><strong>Dealer 22</strong><p>A dealer total of 22 pushes all live non-blackjack hands.</p></div>
                <div><strong>Six Card Charlie</strong><p>Six cards totaling 21 or less win automatically, even against dealer blackjack.</p></div>
                <div><strong>CLEOPATRA Advance Decision</strong><p>On CLEOPATRA ROYALE, queue Hit, Stand, Double, or Split while AI seats complete their decisions.</p></div>
              </>
            ) : (
              <>
                <div><strong>Beat the dealer</strong><p>Finish closer to 21 without going over. Dealer stands on all 17.</p></div>
                <div><strong>Blackjack</strong><p>A natural two-card 21 pays 3 to 2.</p></div>
                <div><strong>Double</strong><p>Double the wager, receive exactly one more card, then stand.</p></div>
                <div><strong>Split</strong><p>Matching values may be split into two separately played hands.</p></div>
              </>
            )}
            <div className="side-payout-card"><strong>21+3</strong><p>Flush 5:1 · Straight 10:1 · Trips 30:1 · Straight Flush 40:1 · Suited Trips 100:1.</p></div>
            <div className="side-payout-card"><strong>Perfect Pairs</strong><p>Mixed Pair 6:1 · Colored Pair 12:1 · Perfect Pair 25:1.</p></div>
            <div className="side-payout-card"><strong>Hot 3</strong><p>Total 19 pays 1:1 · 20 pays 2:1 · 21 pays 4:1 · suited 21 pays 20:1 · 7-7-7 pays 100:1.</p></div>
            <div className="side-payout-card"><strong>Bust It</strong><p>Dealer busts with 3 / 4 / 5 / 6 / 7 / 8+ cards pay 1:1 / 2:1 / 9:1 / 50:1 / 100:1 / 250:1. Player Blackjack pushes.</p></div>
          </div>
        </Modal>
      )}

      {historyOpen && <HistoryModal history={betHistory} stats={casinoStats} onClose={() => setHistoryOpen(false)} />}

      {toast && <div className="toast" role="status"><CheckCircle size={19} weight="fill" aria-hidden="true" />{toast}</div>}
    </main>
  );
}
