import test from "node:test";
import assert from "node:assert/strict";
import {
  compareHand,
  evaluate21Plus3,
  evaluateBustIt,
  evaluateFreeBetSideBet,
  evaluateHotThree,
  evaluatePerfectPairs,
  handValue,
  hiLoCountValue,
  isHandComplete,
  naturalBlackjackTableFlow,
  openingDealTargets,
  payoutFor,
  qualifiesFreeDouble,
  qualifiesFreeSplit,
  rightToLeftSeatIndices,
  sideBetMultiplierLabel,
  sideBetReturn,
  soloBettingExpiry,
  soloParticipantIndices,
  timeoutDecision,
  winStreakFromHistory,
} from "./game.js";

const card = (rank, suit = "spades") => ({ rank, suit });

test("aces adjust between soft and hard totals", () => {
  assert.deepEqual(handValue([card("A"), card("7")]), { total: 18, soft: true });
  assert.deepEqual(handValue([card("A"), card("7"), card("8")]), { total: 16, soft: false });
});

test("free double applies only to hard 9, 10, or 11", () => {
  assert.equal(qualifiesFreeDouble([card("5"), card("6")]), true);
  assert.equal(qualifiesFreeDouble([card("A"), card("9")]), false);
  assert.equal(qualifiesFreeDouble([card("8"), card("4")]), false);
});

test("free split excludes ten-value pairs", () => {
  assert.equal(qualifiesFreeSplit([card("8"), card("8", "hearts")]), true);
  assert.equal(qualifiesFreeSplit([card("10"), card("10", "hearts")]), false);
  assert.equal(qualifiesFreeSplit([card("J"), card("J", "hearts")]), false);
  assert.equal(qualifiesFreeSplit([card("Q"), card("Q", "hearts")]), false);
  assert.equal(qualifiesFreeSplit([card("K"), card("K", "hearts")]), false);
});

test("dealer 22 pushes in free bet mode but busts in classic", () => {
  const player = [card("10"), card("9")];
  const dealer = [card("10"), card("6"), card("6")];
  assert.equal(compareHand(player, dealer, "freebet"), "push");
  assert.equal(compareHand(player, dealer, "classic"), "win");
});

test("Six Card Charlie wins automatically even against dealer blackjack", () => {
  const player = [card("A"), card("2"), card("3"), card("4"), card("5"), card("6")];
  const dealer = [card("A"), card("K")];
  assert.equal(compareHand(player, dealer, "freebet"), "charlie");
});

test("a free stake adds profit without returning a funded stake", () => {
  assert.equal(payoutFor({ paidStake: 250, freeStake: 250 }, "win"), 750);
  assert.equal(payoutFor({ paidStake: 250, freeStake: 250 }, "push"), 250);
  assert.equal(payoutFor({ paidStake: 250, freeStake: 250 }, "lose"), 0);
});

test("21+3 returns Evolution-style poker outcomes and odds", () => {
  assert.deepEqual(
    evaluate21Plus3([card("9", "hearts"), card("10", "hearts"), card("J", "hearts")]),
    { key: "straightFlush", label: "STRAIGHT FLUSH", odds: 40 },
  );
  assert.deepEqual(
    evaluate21Plus3([card("A", "spades"), card("2", "hearts"), card("3", "diamonds")]),
    { key: "straight", label: "STRAIGHT", odds: 10 },
  );
  assert.equal(evaluate21Plus3([card("2"), card("7", "hearts"), card("K", "clubs")]), null);
});

test("Perfect Pairs distinguishes mixed, colored, and perfect pairs", () => {
  assert.deepEqual(evaluatePerfectPairs([card("8", "spades"), card("8", "hearts")]), { key: "mixedPair", label: "MIXED PAIR", odds: 6 });
  assert.deepEqual(evaluatePerfectPairs([card("Q", "hearts"), card("Q", "diamonds")]), { key: "coloredPair", label: "COLORED PAIR", odds: 12 });
  assert.deepEqual(evaluatePerfectPairs([card("A", "clubs"), card("A", "clubs")]), { key: "perfectPair", label: "PERFECT PAIR", odds: 25 });
});

test("Hot 3 follows the published totals, suited 21, and 7-7-7 paytable", () => {
  assert.deepEqual(evaluateHotThree([card("7", "hearts"), card("7", "hearts"), card("7", "hearts")]), { key: "threeSevens", label: "7-7-7", odds: 100 });
  assert.deepEqual(evaluateHotThree([card("5", "clubs"), card("7", "clubs"), card("9", "clubs")]), { key: "suited21", label: "SUITED 21", odds: 20 });
  assert.deepEqual(evaluateHotThree([card("10", "spades"), card("5", "hearts"), card("6", "clubs")]), { key: "total21", label: "TOTAL 21", odds: 4 });
  assert.deepEqual(evaluateHotThree([card("10"), card("5", "hearts"), card("5", "clubs")]), { key: "total20", label: "TOTAL 20", odds: 2 });
  assert.deepEqual(evaluateHotThree([card("10"), card("5", "hearts"), card("4", "clubs")]), { key: "total19", label: "TOTAL 19", odds: 1 });
  assert.equal(evaluateHotThree([card("10"), card("2", "hearts"), card("3", "clubs")]), null);
});

test("Bust It pays by final dealer bust-card count and pushes on player Blackjack", () => {
  const bustResult = (count, rank) => evaluateBustIt(Array.from({ length: count }, () => card(rank)));
  assert.deepEqual(bustResult(3, "K"), { key: "threeCards", label: "3-CARD BUST", odds: 1 });
  assert.deepEqual(bustResult(4, "6"), { key: "fourCards", label: "4-CARD BUST", odds: 2 });
  assert.deepEqual(bustResult(5, "5"), { key: "fiveCards", label: "5-CARD BUST", odds: 9 });
  assert.deepEqual(bustResult(6, "4"), { key: "sixCards", label: "6-CARD BUST", odds: 50 });
  assert.deepEqual(bustResult(7, "4"), { key: "sevenCards", label: "7-CARD BUST", odds: 100 });
  assert.deepEqual(bustResult(8, "4"), { key: "eightPlusCards", label: "8+-CARD BUST", odds: 250 });
  assert.equal(evaluateBustIt([card("10"), card("7")]), null);

  const pushed = evaluateBustIt([card("10"), card("7")], [card("A"), card("K", "hearts")]);
  assert.deepEqual(pushed, { key: "push", label: "PUSH", odds: 0, push: true });
  assert.equal(sideBetReturn(250, pushed), 250);
  assert.equal(sideBetReturn(250, bustResult(8, "4")), 62750);
});

test("Free Bet side bet pays by the number of free tokens used", () => {
  assert.equal(evaluateFreeBetSideBet(0), null);
  assert.deepEqual(evaluateFreeBetSideBet(1), {
    key: "oneToken",
    label: "1 FREE BET TOKEN",
    wagerLabel: "FREE BET",
    tokens: 1,
    odds: 3,
  });
  assert.equal(evaluateFreeBetSideBet(2).odds, 10);
  assert.equal(evaluateFreeBetSideBet(3).odds, 30);
  assert.equal(evaluateFreeBetSideBet(4).odds, 60);
  assert.equal(evaluateFreeBetSideBet(5).odds, 100);
  assert.equal(evaluateFreeBetSideBet(7).odds, 100);
  assert.equal(sideBetReturn(250, evaluateFreeBetSideBet(3)), 7750);
});

test("side bet win badges display the published multiplier", () => {
  assert.equal(sideBetMultiplierLabel({ odds: 4 }), "×4");
  assert.equal(sideBetMultiplierLabel({ odds: 25 }), "×25");
  assert.equal(sideBetMultiplierLabel({ odds: 100 }), "×100");
  assert.equal(sideBetMultiplierLabel({ odds: 0, push: true }), null);
  assert.equal(sideBetMultiplierLabel(null), null);
});

test("opening cards are dealt from the visually rightmost occupied seat to the left", () => {
  const seats = [
    { hands: [{}] },
    { hands: [] },
    { hands: [{}] },
    { hands: [{}] },
  ];
  assert.deepEqual(rightToLeftSeatIndices(seats), [3, 2, 0]);
});

test("a player in the middle is dealt and acts in physical order instead of last", () => {
  const seats = [
    { role: "ai", hands: [{}] },
    { role: "ai", hands: [{}] },
    { role: "you", hands: [{}] },
    { role: "ai", hands: [{}] },
    { role: "ai", hands: [{}] },
    { role: "empty", hands: [] },
  ];

  assert.deepEqual(rightToLeftSeatIndices(seats), [4, 3, 2, 1, 0]);
  assert.deepEqual(openingDealTargets(seats), [4, 3, 2, 1, 0, "dealer", 4, 3, 2, 1, 0, "dealer"]);
  assert.equal(rightToLeftSeatIndices(seats).indexOf(2), 2);
});

test("21 and blackjack hands are complete before another player decision", () => {
  assert.equal(isHandComplete([card("A"), card("K")]), true);
  assert.equal(isHandComplete([card("7"), card("7"), card("7")]), true);
  assert.equal(isHandComplete([card("10"), card("6")]), false);
});

test("a natural blackjack uses lobby-specific dealer flow and the standard total return", () => {
  const playerNatural = [card("A"), card("K")];
  assert.equal(isHandComplete(playerNatural), true);
  assert.deepEqual(naturalBlackjackTableFlow(playerNatural, "arena"), {
    playerNatural: true,
    continueOtherPlayers: true,
    dealerRevealOnly: false,
  });
  assert.deepEqual(naturalBlackjackTableFlow(playerNatural, "solo"), {
    playerNatural: true,
    continueOtherPlayers: false,
    dealerRevealOnly: true,
  });
  assert.equal(compareHand(playerNatural, [card("10"), card("6"), card("5")]), "blackjack");
  assert.equal(compareHand(playerNatural, [card("A"), card("Q")]), "push");
  assert.equal(payoutFor({ paidStake: 250, freeStake: 0 }, "blackjack"), 625);
});

test("the solo betting timer starts a single-player autoplay round without a wager", () => {
  assert.deepEqual(soloBettingExpiry(250), {
    startRound: true,
    playerParticipates: true,
    spectator: false,
  });
  assert.deepEqual(soloBettingExpiry(0), {
    startRound: true,
    playerParticipates: false,
    spectator: true,
  });

  const seats = [
    { role: "ai" },
    { role: "ai" },
    { role: "you" },
    { role: "ai" },
  ];
  assert.deepEqual(soloParticipantIndices(seats), [2]);
  assert.deepEqual(soloParticipantIndices([{ role: "ai" }]), []);
});

test("Evolution-style timeout play hits 11 or lower and stands on 12 or higher", () => {
  assert.equal(timeoutDecision([card("6"), card("5")]), "hit");
  assert.equal(timeoutDecision([card("7"), card("5")]), "stand");
  assert.equal(timeoutDecision([card("10"), card("7")]), "stand");
});

test("Hi-Lo card count values low, neutral, and high cards", () => {
  assert.equal(hiLoCountValue(card("2")), 1);
  assert.equal(hiLoCountValue(card("8")), 0);
  assert.equal(hiLoCountValue(card("A")), -1);
});

test("win streak counts recent wins, preserves pushes, and stops at a loss", () => {
  assert.equal(winStreakFromHistory([{ net: 250 }, { net: 0 }, { net: 100 }, { net: -250 }, { net: 500 }]), 2);
  assert.equal(winStreakFromHistory([{ net: 0 }, { net: 0 }]), 0);
  assert.equal(winStreakFromHistory([{ net: -10 }, { net: 250 }]), 0);
});
