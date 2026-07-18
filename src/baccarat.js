import { createShoe } from "./game.js";

export const BACCARAT_MAIN_BET_KEYS = ["player", "tie", "banker"];
export const BACCARAT_SIDE_BET_KEYS = ["playerPair", "panda8", "heavenly9", "tiger6", "tiger7", "bankerPair"];
export const BACCARAT_BET_KEYS = [...BACCARAT_MAIN_BET_KEYS, ...BACCARAT_SIDE_BET_KEYS];

export const BACCARAT_PAYOUTS = {
  player: 1,
  banker: 0.95,
  tie: 8,
  playerPair: 11,
  panda8: 25,
  heavenly9: 10,
  tiger6: 12,
  tiger7: 40,
  bankerPair: 11,
};

export function baccaratCardValue(card) {
  if (!card) return 0;
  if (card.rank === "A") return 1;
  if (["10", "J", "Q", "K"].includes(card.rank)) return 0;
  return Number(card.rank) || 0;
}

export function baccaratHandTotal(cards = []) {
  return cards.reduce((sum, card) => sum + baccaratCardValue(card), 0) % 10;
}

export function isBaccaratNatural(playerCards = [], bankerCards = []) {
  if (playerCards.length < 2 || bankerCards.length < 2) return false;
  return [8, 9].includes(baccaratHandTotal(playerCards.slice(0, 2)))
    || [8, 9].includes(baccaratHandTotal(bankerCards.slice(0, 2)));
}

export function playerDrawsThirdCard(playerCards = [], bankerCards = []) {
  if (isBaccaratNatural(playerCards, bankerCards)) return false;
  return baccaratHandTotal(playerCards.slice(0, 2)) <= 5;
}

export function bankerDrawsThirdCard(bankerCards = [], playerThirdCard = null, playerCards = []) {
  if (isBaccaratNatural(playerCards, bankerCards)) return false;
  const bankerTotal = baccaratHandTotal(bankerCards.slice(0, 2));

  if (!playerThirdCard) return bankerTotal <= 5;

  const playerThirdValue = baccaratCardValue(playerThirdCard);
  if (bankerTotal <= 2) return true;
  if (bankerTotal === 3) return playerThirdValue !== 8;
  if (bankerTotal === 4) return playerThirdValue >= 2 && playerThirdValue <= 7;
  if (bankerTotal === 5) return playerThirdValue >= 4 && playerThirdValue <= 7;
  if (bankerTotal === 6) return playerThirdValue === 6 || playerThirdValue === 7;
  return false;
}

export function baccaratOutcome(playerCards = [], bankerCards = []) {
  const playerTotal = baccaratHandTotal(playerCards);
  const bankerTotal = baccaratHandTotal(bankerCards);
  if (playerTotal === bankerTotal) return "tie";
  return playerTotal > bankerTotal ? "player" : "banker";
}

export function hasBaccaratPair(cards = []) {
  return cards.length >= 2 && cards[0].rank === cards[1].rank;
}

export function dealBaccaratOpening(drawCard) {
  const playerCards = [drawCard()];
  const bankerCards = [drawCard()];
  playerCards.push(drawCard());
  bankerCards.push(drawCard());

  return {
    playerCards,
    bankerCards,
    sequence: [
      { side: "player", card: playerCards[0] },
      { side: "banker", card: bankerCards[0] },
      { side: "player", card: playerCards[1] },
      { side: "banker", card: bankerCards[1] },
    ],
  };
}

export function completeBaccaratRoundFromOpening(opening, drawCard) {
  const playerCards = [...(opening?.playerCards ?? [])];
  const bankerCards = [...(opening?.bankerCards ?? [])];
  const thirdSequence = [];

  if (playerCards.length !== 2 || bankerCards.length !== 2) {
    throw new Error("A Baccarat round requires two opening cards for Player and Banker.");
  }

  if (!isBaccaratNatural(playerCards, bankerCards)) {
    let playerThirdCard = null;
    if (playerDrawsThirdCard(playerCards, bankerCards)) {
      playerThirdCard = drawCard();
      playerCards.push(playerThirdCard);
      thirdSequence.push({ side: "player", card: playerThirdCard });
    }

    if (bankerDrawsThirdCard(bankerCards, playerThirdCard, playerCards.slice(0, 2))) {
      const bankerThirdCard = drawCard();
      bankerCards.push(bankerThirdCard);
      thirdSequence.push({ side: "banker", card: bankerThirdCard });
    }
  }

  return {
    playerCards,
    bankerCards,
    sequence: [...(opening.sequence ?? []), ...thirdSequence],
    thirdSequence,
    playerTotal: baccaratHandTotal(playerCards),
    bankerTotal: baccaratHandTotal(bankerCards),
    outcome: baccaratOutcome(playerCards, bankerCards),
    playerPair: hasBaccaratPair(playerCards),
    bankerPair: hasBaccaratPair(bankerCards),
  };
}

export function baccaratSideBetMultipliers(round = {}) {
  const playerCards = round.playerCards ?? [];
  const bankerCards = round.bankerCards ?? [];
  const playerTotal = Number.isFinite(round.playerTotal) ? round.playerTotal : baccaratHandTotal(playerCards);
  const bankerTotal = Number.isFinite(round.bankerTotal) ? round.bankerTotal : baccaratHandTotal(bankerCards);
  const playerThreeCardNine = playerCards.length === 3 && playerTotal === 9;
  const bankerThreeCardNine = bankerCards.length === 3 && bankerTotal === 9;

  return {
    playerPair: (round.playerPair ?? hasBaccaratPair(playerCards)) ? BACCARAT_PAYOUTS.playerPair : 0,
    panda8: round.outcome === "player" && playerCards.length === 3 && playerTotal === 8 ? BACCARAT_PAYOUTS.panda8 : 0,
    heavenly9: playerThreeCardNine && bankerThreeCardNine ? 75 : playerThreeCardNine || bankerThreeCardNine ? BACCARAT_PAYOUTS.heavenly9 : 0,
    tiger6: round.outcome === "banker" && bankerTotal === 6 ? (bankerCards.length === 3 ? 20 : BACCARAT_PAYOUTS.tiger6) : 0,
    tiger7: round.outcome === "banker" && bankerCards.length === 3 && bankerTotal === 7 ? BACCARAT_PAYOUTS.tiger7 : 0,
    bankerPair: (round.bankerPair ?? hasBaccaratPair(bankerCards)) ? BACCARAT_PAYOUTS.bankerPair : 0,
  };
}

export function dealBaccaratRound(drawCard) {
  return completeBaccaratRoundFromOpening(dealBaccaratOpening(drawCard), drawCard);
}

export function baccaratBeadPlate(rounds = [], rows = 6, columns = 12) {
  return rounds.slice(-rows * columns).map((round, index) => ({
    ...round,
    row: index % rows,
    column: Math.floor(index / rows),
  }));
}

function layoutOutcomeRoad(entries = [], rows = 6) {
  const cells = [];
  const occupied = new Map();
  let last = null;
  let streakColumn = -1;

  entries.forEach((entry, sequenceIndex) => {
    let row = 0;
    let column = 0;
    if (!last || entry.outcome !== last.outcome) {
      streakColumn += 1;
      while (occupied.has(`0:${streakColumn}`)) streakColumn += 1;
      column = streakColumn;
    } else {
      row = last.row + 1;
      column = last.column;
      if (row >= rows || occupied.has(`${row}:${column}`)) {
        row = last.row;
        column = last.column + 1;
        while (occupied.has(`${row}:${column}`)) column += 1;
      }
    }

    const cell = { ...entry, row, column, sequenceIndex };
    cells.push(cell);
    occupied.set(`${row}:${column}`, cell);
    last = cell;
  });

  return cells;
}

export function baccaratBigRoad(rounds = [], rows = 6) {
  const entries = [];
  let pendingTies = 0;

  rounds.forEach((round) => {
    if (round.outcome === "tie") {
      if (entries.length) entries[entries.length - 1].ties += 1;
      else pendingTies += 1;
      return;
    }

    entries.push({
      outcome: round.outcome,
      ties: pendingTies,
      playerPair: Boolean(round.playerPair),
      bankerPair: Boolean(round.bankerPair),
      playerTotal: round.playerTotal,
      bankerTotal: round.bankerTotal,
    });
    pendingTies = 0;
  });

  return layoutOutcomeRoad(entries, rows);
}

export function baccaratDerivedRoad(rounds = [], lookback = 1, rows = 6) {
  const bigRoad = baccaratBigRoad(rounds, rows);
  const occupied = new Map(bigRoad.map((cell) => [`${cell.row}:${cell.column}`, cell]));
  const columnDepth = (column) => bigRoad.filter((cell) => cell.column === column).length;
  const markers = [];

  bigRoad.forEach((cell) => {
    let color = null;
    if (cell.row === 0) {
      const previousColumn = cell.column - 1;
      const comparedColumn = cell.column - 1 - lookback;
      if (comparedColumn >= 0) {
        color = columnDepth(previousColumn) === columnDepth(comparedColumn) ? "red" : "blue";
      }
    } else {
      const comparedColumn = cell.column - lookback;
      if (comparedColumn >= 0) {
        const sameRow = occupied.has(`${cell.row}:${comparedColumn}`);
        const aboveRow = occupied.has(`${cell.row - 1}:${comparedColumn}`);
        color = sameRow === aboveRow ? "red" : "blue";
      }
    }
    if (color) markers.push({ outcome: color });
  });

  return layoutOutcomeRoad(markers, rows).map((cell) => ({ ...cell, color: cell.outcome }));
}

export function settleBaccaratBets(bets = {}, round) {
  const returnedByBet = Object.fromEntries(BACCARAT_BET_KEYS.map((key) => [key, 0]));
  const stakeByBet = Object.fromEntries(BACCARAT_BET_KEYS.map((key) => [key, Math.max(0, Number(bets[key] || 0))]));
  const multiplierByBet = Object.fromEntries(BACCARAT_BET_KEYS.map((key) => [key, 0]));

  if (round.outcome === "tie") {
    returnedByBet.player = stakeByBet.player;
    returnedByBet.banker = stakeByBet.banker;
    returnedByBet.tie = stakeByBet.tie * (BACCARAT_PAYOUTS.tie + 1);
    multiplierByBet.tie = BACCARAT_PAYOUTS.tie;
  } else if (round.outcome === "player") {
    returnedByBet.player = stakeByBet.player * (BACCARAT_PAYOUTS.player + 1);
    multiplierByBet.player = BACCARAT_PAYOUTS.player;
  } else {
    returnedByBet.banker = stakeByBet.banker * (BACCARAT_PAYOUTS.banker + 1);
    multiplierByBet.banker = BACCARAT_PAYOUTS.banker;
  }

  const sideMultipliers = baccaratSideBetMultipliers(round);
  for (const key of BACCARAT_SIDE_BET_KEYS) {
    const multiplier = sideMultipliers[key] || 0;
    multiplierByBet[key] = multiplier;
    if (multiplier) returnedByBet[key] = stakeByBet[key] * (multiplier + 1);
  }

  const totalBet = Object.values(stakeByBet).reduce((sum, value) => sum + value, 0);
  const returned = Math.round(Object.values(returnedByBet).reduce((sum, value) => sum + value, 0) * 100) / 100;

  return {
    stakeByBet,
    returnedByBet,
    multiplierByBet,
    totalBet,
    returned,
    net: Math.round((returned - totalBet) * 100) / 100,
  };
}

export function createBaccaratShoe(random = Math.random) {
  return createShoe(8, random);
}
