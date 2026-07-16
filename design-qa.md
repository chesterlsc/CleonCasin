# CLEON Blackjack Mobile Table Optimization QA

Date: 2026-07-16

**Source visual truth**

- User-supplied pre-change mobile reference: `references/2026-07-16-mobile-table-optimize-reference.jpg`
- Required transformation: reduce the lower control ratio, give the table most of the mobile viewport, place live decisions inside the felt, and center the complete CLEON lockup with `BLACKJACK PAYS 3 TO 2` immediately beneath it.

**Implementation evidence**

- Final arena betting state, 390 × 844: `references/2026-07-16-mobile-table-optimize-waiting-final.png`
- Final arena active-decision state, 390 × 844: `references/2026-07-16-mobile-table-optimize-active-final.png`
- Final CLEON ONE waiting state, 390 × 844: `references/2026-07-16-mobile-table-optimize-solo-waiting.png`
- Final CLEON ONE active state, 390 × 844: `references/2026-07-16-mobile-table-optimize-solo-active.png`
- Full before/after comparison: `references/2026-07-16-mobile-table-optimize-comparison.png`
- Focused table/control comparison: `references/2026-07-16-mobile-table-optimize-comparison-focused.png`

**Viewport and state**

- Primary viewport: 390 × 844, CLEON ROYALE and CLEON ONE, Free Bet.
- Responsive regression: 360 × 800, CLEON ROYALE betting state.
- States verified: betting, dealing transition, human decision, advance/table continuation, dealer transition, settled, solo betting, and solo timed decision.
- The source is a Safari phone screenshot containing browser chrome; the implementation capture is the browser-rendered app viewport. Full and focused comparisons preserve this known framing difference instead of treating browser chrome as product UI.

**Findings**

- No actionable P0/P1/P2 differences remain.
- Fonts and typography: the complete serif `CLEON CASINO` wordmark remains crisp and centered; `BLACKJACK PAYS 3 TO 2` is the first line directly below the capsule, followed by the smaller mode-specific rules. Decision labels use the existing compact Inter UI hierarchy.
- Spacing and layout rhythm: the 390 × 844 betting layout is now 100px header / 632px table / 112px betting dock. During dealing, player, AI, and dealer phases the disabled lower dock collapses completely, producing a 100px header / 744px table / 0px dock composition.
- Colors and visual tokens: graphite felt, warm-gold branding and wager marks, mint timing/action accents, coral Deal action, and platinum rule copy remain consistent with the approved CLEON system.
- Image quality and asset fidelity: the real 1254px CLEON emblem, 1487px table texture, and 256px denomination chip assets are used directly. All runtime images loaded with nonzero intrinsic width.
- Copy and content: the full CLEON wordmark, Blackjack submark, payout headline, Free Bet rules, balance, wager total, and action labels remain visible and accurate.
- Interaction and affordance: Hit, Stand, Double, and Split now live in a compact glass panel inside the lower felt. The betting dock shows only the chip rack, wager total, and Deal action; it disappears while a round is locked and returns for betting/settlement.
- Responsive behavior: no horizontal or vertical document overflow at 360 × 800 or 390 × 844. The table, decisions, logo, rules, hands, and wager circles remain inside the viewport.

**Comparison history**

- Iteration 1, P1: the source placed the full action row outside the table and reserved a very large lower area for chips, Deal, and disabled decisions. Fixed by adding a mobile-only in-table decision panel and reducing the betting dock from 238px to 112px.
- Iteration 1, P2: keeping the reduced dock visible during an active round still consumed space with disabled chips and Deal. Fixed by collapsing the entire dock to 0px for dealing, AI, player, and dealer phases; the table grows to 744px and all live decisions remain accessible inside it.
- Iteration 2, P2: the first compact decision heading included secondary text that truncated at 390px. Fixed by removing the redundant helper line and retaining the live timer plus four explicit button labels.
- Post-fix evidence: `references/2026-07-16-mobile-table-optimize-active-final.png` and both comparison images show the final full-height table, centered brand/rule stack, and in-table controls.

**Measured clearance**

- 360 × 800 betting: dealer cards end at 223.6px; logo begins at 252.9px; logo ends at 306.9px; rules begin at 314.9px; rules end at 359.4px; player cards begin at 382.8px and end at 474.9px; wager rail begins at 504.9px and ends at 588.9px; dock begins at 688px.
- 390 × 844 active: dealer cards end at 231.4px; logo begins at 293.4px; rules end at 403px; player cards begin at 479.5px and end at 571.6px; wager rail begins at 623.4px and ends at 707.4px; decisions begin at 765px and end at 836px.
- Browser geometry confirmed no dealer/logo, logo/rules, rules/cards, cards/rail, rail/decision, or decision/viewport collision.

**Primary interactions tested**

- Placed and retained a ₱250 main wager in the compact betting dock.
- Started a live arena round from the compact Deal action.
- Verified the human timer and all four decision buttons appeared inside the felt.
- Activated Stand through the new in-table control and verified the round continued through the remaining table action.
- Verified CLEON ONE automatically started from its betting clock and displayed its 12-second in-table decision panel.
- Verified the betting dock returns after settlement.
- Verified browser console warnings/errors: none.
- Verified 17/17 Node game tests passed.
- Verified the Vite production build passed.

**Implementation checklist**

- [x] Table occupies the clear majority of the mobile viewport.
- [x] Bottom betting dock reduced from 238px to 112px.
- [x] Locked-round dock collapses to 0px.
- [x] Hit, Stand, Double, and Split placed inside the felt.
- [x] Full CLEON capsule centered within the table.
- [x] `BLACKJACK PAYS 3 TO 2` immediately below the logo.
- [x] Arena and solo betting/active states verified.
- [x] 360 × 800 and 390 × 844 responsive layouts verified.
- [x] No overlap, clipping, overflow, missing assets, or browser console errors.
- [x] Tests and production build passed.

final result: passed
