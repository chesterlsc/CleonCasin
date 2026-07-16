# CLEON Blackjack Design QA

Date: 2026-07-16

**Source visual truth**

- `/var/folders/yt/kcls64mx48d25tx442463l2c0000gn/T/TemporaryItems/NSIRD_screencaptureui_rqo0HK/Screenshot 2026-07-16 at 5.47.51 PM.png`

**Implementation evidence**

- Desktop full view: `references/2026-07-16-circle-rail-after-2.png`
- Compact desktop full view: `references/2026-07-16-circle-rail-after-3.png`
- Mobile full view: `references/2026-07-16-circle-rail-mobile-final.png`
- Focused source/implementation comparison: `references/2026-07-16-circle-rail-comparison-final.png`
- Final desktop deal-flow and placed-chip view: `references/2026-07-16-deal-flow-desktop-final.png`
- Final mobile placed-chip view: `references/2026-07-16-deal-flow-mobile-final.png`
- Live compact positive-result banner: `references/2026-07-16-result-banner-desktop-final.png`
- Mobile revenue save/reset controls: `references/2026-07-16-stats-actions-mobile.png`
- Clean desktop CLEON ONE and revenue controls: `references/2026-07-16-solo-rules-desktop-final.png`
- Exact 1614 × 466 Blackjack result-banner regression: `references/2026-07-16-result-banner-overlap-fixed-desktop.png`
- Mobile Blackjack result-banner regression: `references/2026-07-16-result-banner-overlap-fixed-mobile.png`

**Viewport and state**

- Desktop: 1280 × 720, CLEON ROYALE, Free Bet, waiting-for-bets state.
- Compact desktop: 940 × 600, CLEON ROYALE, Free Bet, waiting-for-bets state.
- Mobile: 484 × 805, focused player/dealer table, Free Bet, waiting-for-bets state.
- The focused comparison normalizes the supplied 940 × 300 cropped source and the implementation rail to the same visual scale.

**Full-view comparison evidence**

- The five-circle rail remains centered directly below the human hand at desktop and mobile sizes.
- At 940 × 600 the responsive rail uses 82 / 96 / 120 / 96 / 82px circles and stays fully inside the table stage.
- At 484 × 805 the rail uses 56 / 66 / 84 / 66 / 56px circles with no overlap, clipping, horizontal scroll, or collision with the controls.

**Focused comparison evidence**

- The final comparison reproduces the source order and hierarchy: Hot 3, 21+3, enlarged center chip, Perfect Pairs, and Bust It.
- All five targets are exact circles rather than ellipses; browser geometry confirmed equal width and height for every ring.
- The source's burgundy/pink treatment is intentionally mapped to CLEON's approved graphite felt, warm-gold marks, and mint active-wager state.

**Findings**

- No actionable P0/P1/P2 differences remain.
- Fonts and typography: 21+3 keeps the heavy italic display treatment, Perfect Pairs stays stacked, and the smaller Hot 3/Bust It targets preserve the source hierarchy without introducing a second font system.
- Spacing and layout rhythm: the outer side bets are smaller than the inner side bets, the center chip is dominant, and the gaps remain tight and even across desktop and mobile.
- Colors and visual tokens: warm-gold hairlines and marks sit on opaque graphite-felt circles so unrelated AI wager stacks do not show through; mint remains reserved for the active funded main wager.
- Image quality and asset fidelity: the table, CLEON mark, and rendered chip assets load at full intrinsic resolution. The bonus marks use the existing Phosphor icon family rather than CSS or handcrafted SVG substitutes.
- Copy and content: Hot 3 and Bust It display their exact published payout ranges and join 21+3 and Perfect Pairs as funded side bets.
- Accessibility and behavior: all five wager targets are semantic buttons with descriptive labels, keyboard focus, click placement, drag/drop support, and independent clear controls.
- Responsive branding: the full CLEON emblem, `CLEON CASINO`, and `BLACKJACK` lockup remains visible at 888 × 560, 484 × 805, and 360 × 800 without intersecting the dealer, player hand, rules, wager rail, or controls.

**Comparison history**

- Iteration 1, P1: the outer HGT and Bust It marks were too small and the five-circle rail felt pinched. Fixed by increasing the full-size geometry and strengthening the center-to-side ratio. Evidence: `references/2026-07-16-circle-rail-after-1.png` and `references/2026-07-16-circle-rail-after-2.png`.
- Iteration 2, P1: the larger desktop rail clipped at the bottom of the 940 × 600 table stage. Fixed with a dedicated compact-desktop size tier. Evidence: `references/2026-07-16-circle-rail-after-3.png`.
- Iteration 2, P2: transparent circle interiors allowed unrelated AI chip stacks to visually cross the reference rail. Fixed with felt-matched opaque interiors while preserving the thin gold-ring treatment.
- Iteration 3: focused and full-view comparisons found no remaining actionable P0/P1/P2 issue. Evidence: `references/2026-07-16-circle-rail-comparison-final.png` and `references/2026-07-16-circle-rail-mobile-final.png`.

**Primary interactions tested**

- Added a ₱250 chip to the 21+3 target, verified its clear control appeared, cleared it, and verified the no-bet state returned.
- Verified opening-card totals progress from one-card value to the completed two-card value while the hand label remains neutral through the full deal.
- Verified the arena dealt and acted in physical right-to-left order: seats 4, 3, human seat 2, then the remaining seats to the left after the human stood.
- Verified a live positive result uses the compact non-blocking banner and leaves the player hand, wager row, and action controls unobstructed.
- Verified the exact reported `BLACKJACK`, `+₱2,750.00`, and `₱12,250.00` combination has a 13px title/amount gap and a 13px amount/balance gap at 1614 × 466, with no collision or viewport escape.
- Verified the mobile result banner hides the secondary balance card, keeps a 7px title/amount gap, and remains fully contained during and after its entrance animation.
- Verified the placed main chip renders at 59 × 59px inside a 120px target on desktop and 50 × 50px inside an 84px target on mobile.
- Verified CLEON ONE times out to `AUTO STAND` on 20 and keeps the full two-card hand unchanged.
- Verified natural Blackjack is lobby-specific: CLEON ROYALE continues remaining players and the full dealer phase, while CLEON ONE reveals the existing dealer hole card, draws no additional dealer cards, and settles.
- Verified the CLEON ONE betting clock starts a player round when a wager is present and a spectator round for the other players and dealer when no human wager is present; spectator hands remain visible and the clock never resets from 0 back to 12 without a round.
- Verified all four spectator hands fit the 484 × 805 mobile viewport in a single non-overlapping row with 8px outer margins and visible cards, totals, names, and decisions.
- Verified the positive-result banner contains only the result title and total returned amount (funded stake plus profit), with no balance card and no profit-only figure.
- Verified the Evolution-style timeout rule with regression coverage: Hit on 11 or lower, Stand on 12 or higher, with a fresh 12-second window after an unresolved automatic Hit.
- Verified a settled dealer win remains in the table message while the control-area toast stays empty.
- Verified SAVE and guarded RESET controls render in the revenue panel; the first reset press changes to CONFIRM without mutating the ledger.
- Verified the export API returns the full local history, deposit ledger, and computed revenue statistics.
- Verified all runtime images completed with nonzero intrinsic width.
- Verified browser console warnings/errors: none.
- Verified 17/17 Node game tests and the Vite production build passed.

**Implementation checklist**

- [x] Five-circle reference order and proportions.
- [x] True circular geometry at desktop, compact desktop, and mobile sizes.
- [x] Existing main, 21+3, and Perfect Pairs logic preserved.
- [x] Hot 3 is a functional wager using the 19 / 20 / 21 / suited 21 / 7-7-7 paytable.
- [x] Bust It is a functional wager using the 3 / 4 / 5 / 6 / 7 / 8+ dealer-bust-card paytable and player-Blackjack push.
- [x] Full CLEON table branding remains visible and non-overlapping across compact desktop and mobile sizes.
- [x] No rail clipping, control collision, or horizontal overflow.
- [x] Progressive one-card/two-card player totals with no early Blackjack announcement.
- [x] Right-to-left opening deal and full-table action order, including a human in the middle.
- [x] Large physical placed chips at desktop and mobile sizes.
- [x] Compact positive-result banner with no hand or control overlap.
- [x] Royale natural Blackjack waits for the shared round; solo natural Blackjack reveals only the dealer hole card and settles without a draw.
- [x] Solo betting-clock expiry always starts a player or visible-hand spectator table round instead of resetting the waiting state.
- [x] Win banner omits balance and reports total returned rather than net profit.
- [x] Evolution-style solo timeout auto-play with a single action per timer expiry.
- [x] Dealer-win control toast removed while preserving the table result message.
- [x] Full revenue snapshot export and guarded history/stat reset that preserves deposits.
- [x] Focused source/implementation comparison completed.
- [x] Runtime, interaction, test, and build verification completed.

final result: passed
