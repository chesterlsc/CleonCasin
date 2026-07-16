# CLEON Casino Blackjack

A cinematic browser blackjack table inspired by premium live-casino interfaces. It includes Classic and Free Bet modes, a PHP-denominated table balance, configurable player/AI seats, four functional side bets, and a simulated casino-style cashier.

## Run locally

```bash
npm install
npm run dev -- --host 127.0.0.1 --port 4173
```

Open [http://127.0.0.1:4173/](http://127.0.0.1:4173/).

## Table features

- Six configurable seats: choose `YOU`, `AI`, or `EMPTY` between rounds.
- Classic Blackjack and Free Bet Blackjack modes.
- Free Double on hard 9, 10, or 11.
- Free Split on pairs except 10-value cards.
- Dealer 22 pushes in Free Bet mode.
- Six Card Charlie in Free Bet mode.
- Six-deck continuous shoe with visible card count.
- PHP balance, bet selection, settlement, and a simulated Deposit flow.
- Hot 3, 21+3, Perfect Pairs, and Bust It side bets with published live-blackjack-style paytables.
- CLEON ONE focused play and CLEON ROYALE six-seat table play.
- Responsive desktop and mobile layouts, keyboard focus states, reduced-motion support, and optional sound.

The cashier is intentionally a sandbox interaction. It does not connect to payment rails, request credentials, or move real money.

## Deploy on Railway

Connect Railway to this repository. The default commands are ready for deployment:

- Build command: `npm run build`
- Start command: `npm start`
- Health URL: `/`

Railway provides `PORT` automatically and the start script binds Vite to `0.0.0.0` on that port.

The wager ledger is stored at `.data/cleon-casino.json`. Railway's normal filesystem is ephemeral, so attach a persistent volume mounted at `/app/.data` if round history and simulated deposits must survive redeploys and restarts. Do not seed the deployed volume with a private local ledger.

## Verification

```bash
npm test
npm run build
```

The approved design source, final implementation captures, and comparison sheet are in [`references/`](./references/). See [`design-qa.md`](./design-qa.md) for the completed QA record.
