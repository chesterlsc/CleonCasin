export const SUITS = ["spades", "hearts", "diamonds", "clubs"];
export const RANKS = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];

const SUIT_COLORS = {
  spades: "black",
  clubs: "black",
  hearts: "red",
  diamonds: "red",
};

export const SIDE_BET_PAYOUTS = {
  twentyOneThree: {
    flush: 5,
    straight: 10,
    threeOfAKind: 30,
    straightFlush: 40,
    suitedTrips: 100,
  },
  perfectPairs: {
    mixedPair: 6,
    coloredPair: 12,
    perfectPair: 25,
  },
  hotThree: {
    total19: 1,
    total20: 2,
    total21: 4,
    suited21: 20,
    threeSevens: 100,
  },
  bustIt: {
    threeCards: 1,
    fourCards: 2,
    fiveCards: 9,
    sixCards: 50,
    sevenCards: 100,
    eightPlusCards: 250,
  },
};

export function cardPoint(rank) {
  if (rank === "A") return 11;
  if (["K", "Q", "J"].includes(rank)) return 10;
  return Number(rank);
}

export function createShoe(deckCount = 6, random = Math.random) {
  const cards = [];

  for (let deck = 0; deck < deckCount; deck += 1) {
    for (const suit of SUITS) {
      for (const rank of RANKS) cards.push({ rank, suit });
    }
  }

  for (let index = cards.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [cards[index], cards[swapIndex]] = [cards[swapIndex], cards[index]];
  }

  return cards;
}

export function rightToLeftSeatIndices(seats) {
  return seats
    .map((seat, index) => ({ seat, index }))
    .filter(({ seat }) => Boolean(seat?.hands?.[0]))
    .map(({ index }) => index)
    .reverse();
}

export function openingDealTargets(seats, passes = 2) {
  const seatOrder = rightToLeftSeatIndices(seats);
  return Array.from({ length: passes }, () => [...seatOrder, "dealer"]).flat();
}

export function timeoutDecision(cards) {
  return handValue(cards).total <= 11 ? "hit" : "stand";
}

export function soloBettingExpiry(mainBet = 0) {
  const playerParticipates = Number(mainBet) > 0;
  return {
    startRound: true,
    playerParticipates,
    spectator: !playerParticipates,
  };
}

export function winStreakFromHistory(history = []) {
  let streak = 0;

  for (const round of history) {
    const net = Number(round?.net || 0);
    if (net < 0) break;
    if (net > 0) streak += 1;
  }

  return streak;
}

export function hiLoCountValue(card) {
  if (!card) return 0;
  if (["2", "3", "4", "5", "6"].includes(card.rank)) return 1;
  if (["10", "J", "Q", "K", "A"].includes(card.rank)) return -1;
  return 0;
}

export function handValue(cards) {
  let total = cards.reduce((sum, card) => sum + cardPoint(card.rank), 0);
  let aces = cards.filter((card) => card.rank === "A").length;

  while (total > 21 && aces > 0) {
    total -= 10;
    aces -= 1;
  }

  const soft = cards.some((card) => card.rank === "A") && total <= 21 && aces > 0;
  return { total, soft };
}

export function isBlackjack(cards) {
  return cards.length === 2 && handValue(cards).total === 21;
}

export function naturalBlackjackTableFlow(cards, tableVariant = "arena") {
  const playerNatural = isBlackjack(cards);
  return {
    playerNatural,
    continueOtherPlayers: playerNatural && tableVariant === "arena",
    dealerRevealOnly: playerNatural && tableVariant === "solo",
  };
}

export function isHandComplete(cards, mode = "classic") {
  return handValue(cards).total >= 21 || isSixCardCharlie(cards, mode);
}

export function isPair(cards) {
  return cards.length === 2 && cardPoint(cards[0].rank) === cardPoint(cards[1].rank);
}

export function evaluatePerfectPairs(cards) {
  if (cards.length !== 2 || cards[0].rank !== cards[1].rank) return null;

  if (cards[0].suit === cards[1].suit) {
    return { key: "perfectPair", label: "PERFECT PAIR", odds: SIDE_BET_PAYOUTS.perfectPairs.perfectPair };
  }

  if (SUIT_COLORS[cards[0].suit] === SUIT_COLORS[cards[1].suit]) {
    return { key: "coloredPair", label: "COLORED PAIR", odds: SIDE_BET_PAYOUTS.perfectPairs.coloredPair };
  }

  return { key: "mixedPair", label: "MIXED PAIR", odds: SIDE_BET_PAYOUTS.perfectPairs.mixedPair };
}

export function evaluate21Plus3(cards) {
  if (cards.length !== 3) return null;

  const sameRank = cards.every((item) => item.rank === cards[0].rank);
  const sameSuit = cards.every((item) => item.suit === cards[0].suit);
  const rankValues = cards.map((item) => ({ A: 14, J: 11, Q: 12, K: 13 }[item.rank] ?? Number(item.rank)));
  const uniqueRanks = [...new Set(rankValues)].sort((a, b) => a - b);
  const straight = uniqueRanks.length === 3 && (
    uniqueRanks[2] - uniqueRanks[0] === 2
    || uniqueRanks.join(",") === "2,3,14"
  );

  if (sameRank && sameSuit) {
    return { key: "suitedTrips", label: "SUITED TRIPS", odds: SIDE_BET_PAYOUTS.twentyOneThree.suitedTrips };
  }
  if (straight && sameSuit) {
    return { key: "straightFlush", label: "STRAIGHT FLUSH", odds: SIDE_BET_PAYOUTS.twentyOneThree.straightFlush };
  }
  if (sameRank) {
    return { key: "threeOfAKind", label: "THREE OF A KIND", odds: SIDE_BET_PAYOUTS.twentyOneThree.threeOfAKind };
  }
  if (straight) {
    return { key: "straight", label: "STRAIGHT", odds: SIDE_BET_PAYOUTS.twentyOneThree.straight };
  }
  if (sameSuit) {
    return { key: "flush", label: "FLUSH", odds: SIDE_BET_PAYOUTS.twentyOneThree.flush };
  }
  return null;
}

export function evaluateHotThree(cards) {
  if (cards.length !== 3) return null;

  if (cards.every((item) => item.rank === "7")) {
    return { key: "threeSevens", label: "7-7-7", odds: SIDE_BET_PAYOUTS.hotThree.threeSevens };
  }

  const total = handValue(cards).total;
  const suited = cards.every((item) => item.suit === cards[0].suit);
  if (total === 21 && suited) {
    return { key: "suited21", label: "SUITED 21", odds: SIDE_BET_PAYOUTS.hotThree.suited21 };
  }
  if (total === 21) {
    return { key: "total21", label: "TOTAL 21", odds: SIDE_BET_PAYOUTS.hotThree.total21 };
  }
  if (total === 20) {
    return { key: "total20", label: "TOTAL 20", odds: SIDE_BET_PAYOUTS.hotThree.total20 };
  }
  if (total === 19) {
    return { key: "total19", label: "TOTAL 19", odds: SIDE_BET_PAYOUTS.hotThree.total19 };
  }
  return null;
}

export function evaluateBustIt(dealerCards, playerCards = []) {
  if (isBlackjack(playerCards)) {
    return { key: "push", label: "PUSH", odds: 0, push: true };
  }
  if (handValue(dealerCards).total <= 21) return null;

  const payout = {
    3: ["threeCards", 1],
    4: ["fourCards", 2],
    5: ["fiveCards", 9],
    6: ["sixCards", 50],
    7: ["sevenCards", 100],
  }[dealerCards.length] ?? ["eightPlusCards", 250];

  return {
    key: payout[0],
    label: `${dealerCards.length >= 8 ? "8+" : dealerCards.length}-CARD BUST`,
    odds: payout[1],
  };
}

export function sideBetReturn(stake, result) {
  if (!stake || !result) return 0;
  if (result.push) return stake;
  return stake * (result.odds + 1);
}

export function qualifiesFreeSplit(cards) {
  return isPair(cards) && cardPoint(cards[0].rank) !== 10;
}

export function qualifiesFreeDouble(cards) {
  const value = handValue(cards);
  return cards.length === 2 && !value.soft && [9, 10, 11].includes(value.total);
}

export function isSixCardCharlie(cards, mode) {
  return mode === "freebet" && cards.length >= 6 && handValue(cards).total <= 21;
}

export function dealerShouldHit(cards) {
  return handValue(cards).total < 17;
}

export function compareHand(playerCards, dealerCards, mode = "classic") {
  const player = handValue(playerCards);
  const dealer = handValue(dealerCards);
  const playerNatural = isBlackjack(playerCards);
  const dealerNatural = isBlackjack(dealerCards);

  if (player.total > 21) return "lose";
  if (isSixCardCharlie(playerCards, mode)) return "charlie";
  if (playerNatural && !dealerNatural) return "blackjack";
  if (dealerNatural && !playerNatural) return "lose";
  if (playerNatural && dealerNatural) return "push";
  if (mode === "freebet" && dealer.total === 22) return "push";
  if (dealer.total > 21) return "win";
  if (player.total > dealer.total) return "win";
  if (player.total < dealer.total) return "lose";
  return "push";
}

export function payoutFor(hand, result) {
  const paidStake = hand.paidStake ?? 0;
  const freeStake = hand.freeStake ?? 0;

  if (result === "blackjack") return paidStake * 2.5 + freeStake * 1.5;
  if (["win", "charlie"].includes(result)) return paidStake * 2 + freeStake;
  if (result === "push") return paidStake;
  return 0;
}

export function aiDecision(cards, dealerUpCard, mode = "classic") {
  const value = handValue(cards);
  const dealerValue = cardPoint(dealerUpCard.rank);

  if (mode === "freebet" && qualifiesFreeSplit(cards)) return "split";
  if (mode === "freebet" && qualifiesFreeDouble(cards)) return "double";

  if (isPair(cards)) {
    const pairValue = cardPoint(cards[0].rank);
    if ([8, 11].includes(pairValue)) return "split";
    if (pairValue === 10) return "stand";
  }

  if (value.soft) {
    if (value.total >= 19) return "stand";
    if (value.total === 18 && dealerValue <= 8) return "stand";
    return "hit";
  }

  if (value.total >= 17) return "stand";
  if (value.total <= 11) return "hit";
  if (dealerValue >= 2 && dealerValue <= 6) return "stand";
  return "hit";
}

export function formatPeso(amount) {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 2,
  }).format(amount);
}
