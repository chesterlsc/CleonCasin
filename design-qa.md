# CLEON Blackjack Mobile Round UI QA

Date: 2026-07-16

## Source visual truth

- Dealer overlap reference: `references/2026-07-16-mobile-request-dealer-before.png`
- Decision panel reference: `references/2026-07-16-mobile-request-decision-before.png`
- Side-bet result overlap reference: `references/2026-07-16-mobile-request-sidebet-before.png`
- Required outcome: dealer cards below the decorative chip rack, smaller move status, a premium full-width decision panel, immediate side-bet win announcements, compact side-bet result labels, and a trophy win-streak counter below the betting chips.

## Implementation evidence

- Mobile betting state, 390 × 844: `references/2026-07-16-mobile-request-betting-final.png`
- Mobile active-decision state, 390 × 844: `references/2026-07-16-mobile-request-decision-final.png`
- Mobile side-bet result state, 390 × 844: `references/2026-07-16-mobile-request-sidebet-final.png`
- Combined source/implementation comparison: `references/2026-07-16-mobile-request-comparison.png`

## Findings

- No actionable P0/P1/P2 differences remain for the requested mobile states.
- Dealer placement: the mobile dealer zone now begins beneath the decorative chip rack at a reduced scale. Cards no longer cover the rack or status controls.
- Dealer notification: table status uses a 26px compact pill and dealer/AI messages reduce to 7px with guarded width and ellipsis.
- Decisions: the inherited tablet grid area was removed. Hit, Stand, Double, and Split now occupy four equal columns across the full in-table panel, with stronger available states and a coral urgent-timer treatment.
- Side-bet timing: Hot 3, 21+3, and Perfect Pairs resolve immediately after the opening deal. Browser verification captured `21+3 · STRAIGHT +₱2,500.00` while the main hand was still at `YOUR MOVE · 10 SECONDS`.
- Side-bet labels: mobile result pills use short, per-circle copy such as `WIN +₱2,500`, preventing cross-circle overlap.
- Win streak: the trophy row appears directly below the betting chip rack. A positive-net test round advanced the visible streak from 0 to 1; pushes preserve it and losses reset it by rule and test.
- Layout rhythm: the betting dock is 124px to accommodate the trophy row while locked-round controls remain inside the table and the lower dock collapses to 0px.
- Branding and rules remain centered between dealer and player zones without obscuring hands or wagers.

## Interaction verification

- Started a live Free Bet round at the 390 × 844 viewport.
- Verified the dealer up-card and hole card landed below the decorative rack.
- Verified the human hand and all four decisions stayed visible in one viewport.
- Verified the decision panel used its full available width with no dead left column.
- Placed ₱250 on Hot 3, 21+3, and Perfect Pairs before dealing.
- Verified the winning 21+3 announcement and compact wager-circle badge appeared before Stand or dealer play.
- Verified a completed positive-net round advanced the trophy streak to 1.
- Verified 18/18 Node game tests passed.
- Verified the Vite production build passed.
- Verified `git diff --check` passed.

## Implementation checklist

- [x] Dealer cards below chip rack on mobile.
- [x] Smaller dealer/AI status typography.
- [x] Full-width premium in-table decision panel.
- [x] Immediate opening side-bet win announcement.
- [x] Compact, non-overlapping side-bet result labels.
- [x] Trophy win streak below chip rack.
- [x] Persistent streak restore from round history/local storage.
- [x] 390 × 844 browser verification.
- [x] Tests and production build passed.

final result: passed
