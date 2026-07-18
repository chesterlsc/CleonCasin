import test from "node:test";
import assert from "node:assert/strict";
import {
  baccaratCardValue,
  baccaratBeadPlate,
  baccaratBigRoad,
  baccaratDerivedRoad,
  baccaratHandTotal,
  baccaratOpeningPeelOrder,
  baccaratOutcome,
  baccaratSideBetMultipliers,
  bankerDrawsThirdCard,
  completeBaccaratRoundFromOpening,
  dealBaccaratOpening,
  dealBaccaratRound,
  hasBaccaratPair,
  isBaccaratNatural,
  playerDrawsThirdCard,
  revealBaccaratPeelQueue,
  settleBaccaratBets,
} from "./baccarat.js";

const card = (rank, suit = "spades") => ({ rank, suit });

test("baccarat card values and totals use the ones digit", () => {
  assert.equal(baccaratCardValue(card("A")), 1);
  assert.equal(baccaratCardValue(card("9")), 9);
  assert.equal(baccaratCardValue(card("K")), 0);
  assert.equal(baccaratHandTotal([card("8"), card("7")]), 5);
  assert.equal(baccaratHandTotal([card("K"), card("Q")]), 0);
});

test("naturals stop both hands and player draws on five or lower", () => {
  assert.equal(isBaccaratNatural([card("4"), card("5")], [card("3"), card("4")]), true);
  assert.equal(playerDrawsThirdCard([card("2"), card("3")], [card("4"), card("3")]), true);
  assert.equal(playerDrawsThirdCard([card("4"), card("2")], [card("3"), card("4")]), false);
  assert.equal(playerDrawsThirdCard([card("4"), card("5")], [card("3"), card("4")]), false);
});

test("banker follows the standard third-card tableau", () => {
  const banker = (total) => [card(String(total)), card("K")];
  assert.equal(bankerDrawsThirdCard(banker(2), card("8"), [card("2"), card("2")]), true);
  assert.equal(bankerDrawsThirdCard(banker(3), card("8"), [card("2"), card("2")]), false);
  assert.equal(bankerDrawsThirdCard(banker(3), card("7"), [card("2"), card("2")]), true);
  assert.equal(bankerDrawsThirdCard(banker(4), card("2"), [card("2"), card("2")]), true);
  assert.equal(bankerDrawsThirdCard(banker(4), card("1"), [card("2"), card("2")]), false);
  assert.equal(bankerDrawsThirdCard(banker(5), card("4"), [card("2"), card("2")]), true);
  assert.equal(bankerDrawsThirdCard(banker(5), card("3"), [card("2"), card("2")]), false);
  assert.equal(bankerDrawsThirdCard(banker(6), card("7"), [card("2"), card("2")]), true);
  assert.equal(bankerDrawsThirdCard(banker(6), card("5"), [card("2"), card("2")]), false);
  assert.equal(bankerDrawsThirdCard(banker(5), null, [card("3"), card("3")]), true);
  assert.equal(bankerDrawsThirdCard(banker(6), null, [card("3"), card("3")]), false);
});

test("a deterministic round deals player then banker and applies third-card rules", () => {
  const shoe = [card("2"), card("3"), card("3"), card("2"), card("6"), card("4")];
  const round = dealBaccaratRound(() => shoe.shift());
  assert.deepEqual(round.sequence.map((item) => item.side), ["player", "banker", "player", "banker", "player", "banker"]);
  assert.equal(round.playerTotal, 1);
  assert.equal(round.bankerTotal, 9);
  assert.equal(round.outcome, "banker");
});

test("third cards are not drawn until both opening hands have been dealt", () => {
  const shoe = [card("2"), card("3"), card("3"), card("2"), card("6"), card("4")];
  let draws = 0;
  const draw = () => {
    draws += 1;
    return shoe.shift();
  };
  const opening = dealBaccaratOpening(draw);
  assert.equal(draws, 4);
  assert.equal(opening.playerCards.length, 2);
  assert.equal(opening.bankerCards.length, 2);

  const round = completeBaccaratRoundFromOpening(opening, draw);
  assert.equal(draws, 6);
  assert.deepEqual(round.thirdSequence.map((item) => item.side), ["player", "banker"]);
  assert.equal(round.playerTotal, 1);
  assert.equal(round.bankerTotal, 9);
});

test("opening peel order follows the latest active Player or Banker wager", () => {
  assert.deepEqual(baccaratOpeningPeelOrder({ player: 100, banker: 0 }, ["player"]), ["player", "player", "banker", "banker"]);
  assert.deepEqual(baccaratOpeningPeelOrder({ player: 0, banker: 100 }, ["banker"]), ["banker", "banker", "player", "player"]);
  assert.deepEqual(baccaratOpeningPeelOrder({ player: 100, banker: 100 }, ["player", "banker"]), ["banker", "banker", "player", "player"]);
  assert.deepEqual(baccaratOpeningPeelOrder({ player: 0, banker: 0, tie: 100 }, ["tie"]), ["player", "player", "banker", "banker"]);
});

test("quick peel reveals every remaining card in the active peel stage", () => {
  assert.deepEqual(revealBaccaratPeelQueue({ player: 0, banker: 0 }, ["player", "player", "banker", "banker"]), { player: 2, banker: 2 });
  assert.deepEqual(revealBaccaratPeelQueue({ player: 2, banker: 2 }, ["player", "banker"]), { player: 3, banker: 3 });
});

test("official Baccarat roads use bead order, streak columns, ties, and derived markers", () => {
  const outcomes = ["player", "player", "banker", "tie", "banker", "player", "banker", "player", "player", "player"];
  const rounds = outcomes.map((outcome, index) => ({ outcome, playerPair: index === 0, bankerPair: index === 2 }));
  const bead = baccaratBeadPlate(rounds);
  assert.deepEqual(bead.slice(0, 7).map(({ row, column }) => [row, column]), [[0, 0], [1, 0], [2, 0], [3, 0], [4, 0], [5, 0], [0, 1]]);

  const big = baccaratBigRoad(rounds);
  assert.deepEqual(big.slice(0, 5).map(({ outcome, row, column }) => [outcome, row, column]), [
    ["player", 0, 0],
    ["player", 1, 0],
    ["banker", 0, 1],
    ["banker", 1, 1],
    ["player", 0, 2],
  ]);
  assert.equal(big[2].ties, 1);
  assert.equal(baccaratDerivedRoad(rounds, 1).length > 0, true);
  assert.equal(baccaratDerivedRoad(rounds, 2).length > 0, true);
});

test("outcomes and pair side bets use final totals and opening ranks", () => {
  assert.equal(baccaratOutcome([card("8"), card("A")], [card("4"), card("4")]), "player");
  assert.equal(baccaratOutcome([card("4"), card("4")], [card("8"), card("K")]), "tie");
  assert.equal(hasBaccaratPair([card("Q"), card("Q", "hearts")]), true);
  assert.equal(hasBaccaratPair([card("10"), card("K")]), false);
});

test("settlement pays Player, commissioned Banker, Tie pushes, and pairs", () => {
  const bets = { player: 100, banker: 100, tie: 100, playerPair: 100, bankerPair: 100 };

  const bankerWin = settleBaccaratBets(bets, { outcome: "banker", playerPair: false, bankerPair: true, playerCards: [card("3"), card("4")], bankerCards: [card("Q"), card("Q")] });
  assert.equal(bankerWin.returnedByBet.banker, 195);
  assert.equal(bankerWin.returnedByBet.bankerPair, 1200);
  assert.equal(bankerWin.returned, 1395);

  const tie = settleBaccaratBets(bets, { outcome: "tie", playerPair: true, bankerPair: false, playerCards: [card("Q"), card("Q")], bankerCards: [card("5"), card("5", "hearts")] });
  assert.equal(tie.returnedByBet.player, 100);
  assert.equal(tie.returnedByBet.banker, 100);
  assert.equal(tie.returnedByBet.tie, 900);
  assert.equal(tie.returnedByBet.playerPair, 1200);
  assert.equal(tie.returned, 2300);
});

test("Panda 8, Tiger 6, Tiger 7, and Heavenly 9 use their published outcomes", () => {
  const panda = baccaratSideBetMultipliers({
    outcome: "player",
    playerCards: [card("2"), card("2"), card("4")],
    bankerCards: [card("3"), card("4")],
    playerTotal: 8,
    bankerTotal: 7,
  });
  assert.equal(panda.panda8, 25);

  const twoCardTiger = baccaratSideBetMultipliers({
    outcome: "banker",
    playerCards: [card("2"), card("3")],
    bankerCards: [card("2"), card("4")],
    playerTotal: 5,
    bankerTotal: 6,
  });
  assert.equal(twoCardTiger.tiger6, 12);

  const threeCardTiger = baccaratSideBetMultipliers({
    outcome: "banker",
    playerCards: [card("2"), card("4"), card("K")],
    bankerCards: [card("2"), card("2"), card("3")],
    playerTotal: 6,
    bankerTotal: 7,
  });
  assert.equal(threeCardTiger.tiger7, 40);
  assert.equal(threeCardTiger.tiger6, 0);

  const heavenly = baccaratSideBetMultipliers({
    outcome: "tie",
    playerCards: [card("2"), card("3"), card("4")],
    bankerCards: [card("A"), card("3"), card("5")],
    playerTotal: 9,
    bankerTotal: 9,
  });
  assert.equal(heavenly.heavenly9, 75);
});

test("new side bets return stake plus the published profit multiplier", () => {
  const bets = { panda8: 100, heavenly9: 100, tiger6: 100, tiger7: 100 };
  const panda = settleBaccaratBets(bets, {
    outcome: "player",
    playerCards: [card("2"), card("2"), card("4")],
    bankerCards: [card("3"), card("4")],
    playerTotal: 8,
    bankerTotal: 7,
  });
  assert.equal(panda.returnedByBet.panda8, 2600);
  assert.equal(panda.multiplierByBet.panda8, 25);

  const tiger = settleBaccaratBets(bets, {
    outcome: "banker",
    playerCards: [card("2"), card("3")],
    bankerCards: [card("2"), card("4"), card("K")],
    playerTotal: 5,
    bankerTotal: 6,
  });
  assert.equal(tiger.returnedByBet.tiger6, 2100);
  assert.equal(tiger.multiplierByBet.tiger6, 20);
});
