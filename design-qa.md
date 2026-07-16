# CLEOPATRA Responsive Wordmark QA

Date: 2026-07-17

## Source visual truth

- User issue capture: `/var/folders/yt/kcls64mx48d25tx442463l2c0000gn/T/TemporaryItems/NSIRD_screencaptureui_Mb5vCT/Screenshot 2026-07-17 at 12.19.42 AM.png`
- Product constraint: retain the full emblem, `CLEOPATRA CASINO` wordmark, `BLACKJACK` sub-label, and centered table rules while preventing the long wordmark from crowding the gold capsule.

## Implementation evidence

- Mobile implementation, 390 x 844: `references/2026-07-17-cleopatra-wordmark-mobile-final.png`
- Desktop implementation, 1440 x 900: `references/2026-07-17-cleopatra-wordmark-desktop-final.png`
- Full mobile before/after comparison: `references/2026-07-17-cleopatra-wordmark-full-comparison.png`
- Focused source/fix comparison: `references/2026-07-17-cleopatra-wordmark-focused-comparison.png`
- State: Free Bet table, waiting for bets, initial sample hands visible.

## Full-view comparison evidence

- The mobile before/after sheet confirms the table composition, cards, betting circles, rules, chip rack, and deal control remain in their original positions.
- The only material layout change is the centered wordmark capsule: it is wider and the display lettering scales down slightly to create safe edge spacing.

## Focused region comparison evidence

- The focused comparison shows the original long wordmark approaching the right capsule edge and the revised lockup retaining clear space on both sides.
- At 390px, the capsule is 343.2px wide, the wordmark is 196.8px wide, and the wordmark retains 54.7px of right-side space after the emblem and internal layout are accounted for.

## Findings

- No actionable P0/P1/P2 differences remain.
- Fonts and typography: the same Georgia display stack, gold/platinum hierarchy, weight, and one-line wordmark are preserved. Responsive size and tracking now prevent edge crowding.
- Spacing and layout rhythm: capsule width and horizontal padding increased without moving the dealer cards or the three rule lines. Document width remains exactly 390px with no horizontal overflow.
- Colors and visual tokens: the existing graphite, warm-gold outline, platinum wordmark, and gold `BLACKJACK` label are unchanged.
- Image quality and asset fidelity: the supplied C-and-crown raster emblem is retained at its intended aspect ratio with no replacement or stretching.
- Copy and content: `CLEOPATRA CASINO`, `BLACKJACK`, and all rule text remain complete and unwrapped.

## Comparison history

- Earlier P2: the renamed wordmark used sizing and padding tuned for the shorter CLEON name, so `CLEOPATRA CASINO` visually crowded the right edge.
- Fix: expanded the responsive capsule, reduced the mobile display size and tracking slightly, added a no-wrap constraint, and increased desktop right padding.
- Post-fix evidence: the full and focused comparison sheets show safe spacing with no card, rule, or betting-layout regression.

## Interaction and runtime verification

- Chip tap increased the main wager from PHP 250 to PHP 350.
- Browser console warnings/errors: none.
- Mobile horizontal overflow: none (`documentWidth` 390 at a 390px viewport).
- Node game tests: 18/18 passed.
- Vite production build: passed.
- `git diff --check`: passed.

## Implementation checklist

- [x] Full Cleopatra wordmark retained.
- [x] Mobile capsule edge crowding removed.
- [x] Desktop capsule padding balanced.
- [x] Cards and rules remain in place.
- [x] No horizontal overflow.
- [x] Primary chip interaction still works.
- [x] Browser console is clean.

final result: passed
