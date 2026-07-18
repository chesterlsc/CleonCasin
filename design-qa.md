# CLEOPATRA Speed Baccarat Peel and Road-Board QA

Date: 2026-07-18

## Source visual truth

- User reference: `/var/folders/yt/kcls64mx48d25tx442463l2c0000gn/T/TemporaryItems/NSIRD_screencaptureui_Be53ud/Screenshot 2026-07-18 at 11.16.59 AM.png`
- Design target: preserve the reference's centered Player / Tie / Banker hierarchy, illustrated side-bet row, and official Baccarat history boards while translating the saturated reference into CLEOPATRA's graphite, warm-gold, blue, coral, and mint palette.

## Implementation evidence

- Desktop implementation at 1280 x 720: `references/2026-07-18-baccarat-road-console-1280x720.png`
- Aligned visual comparison: `references/2026-07-18-baccarat-road-comparison.png`
- Desktop state: betting open, populated shoe history, Peel off, Player / Tie / Banker markets centered, six illustrated side bets, and five result roads visible.
- Mobile measurement state: 390 x 844, complete table and controls visible in one viewport.

## Full and focused comparison

- The comparison places the complete supplied reference above the same focused region in CLEOPATRA. Both use a central three-outcome betting hierarchy, a dedicated side-bet strip, a left chronological board, and a right trend board.
- The implementation intentionally keeps the existing premium felt table rather than copying the reference's bright orange and purple shell. Geometry, visual priority, and road-board placement follow the reference while colors and surfaces remain native to CLEOPATRA.
- The Bead Plate, Big Road, Big Eye Boy, Small Road, and Cockroach Pig are all rendered from the current shoe history. The large roads remain legible while the three derived roads use appropriately compact marks.

## Five fidelity surfaces

- Typography: the existing casino serif and compact technical labels are preserved. Player, Tie, and Banker remain the dominant betting labels; board headers and shoe counts use small scoreboard typography.
- Spacing and layout rhythm: the central betting area stays unobstructed, the road boards align low on the felt, and side bets maintain equal spacing without crossing the main markets.
- Colors and visual tokens: Player uses blue, Banker uses coral red, Tie uses mint green, and board framing uses graphite and warm gold. Pale road cells preserve the readability of official Baccarat scoreboards.
- Icon and asset fidelity: every side bet uses a real Phosphor icon with a compact odds badge. No emoji, placeholder boxes, CSS-drawn symbols, or fake image assets are used.
- Copy and content: side-bet names and published odds are complete. Result-board labels, shoe number, and Player / Banker / Tie counts are present through visible headers or accessible road labels.

## Sequencing and interaction verification

- Entering Speed Baccarat and switching Peel on works.
- The initial deal consumes exactly four cards before any tableau decision: Player, Banker, Player, Banker.
- Cards reveal one at a time. Browser verification caught an intermediate state with Player fully revealed, Banker at card 1 of 2, and exactly four opening cards removed from the shoe.
- The selected Player-first or Banker-first preference controls the opening peel queue without changing the official alternating physical deal.
- Only after all four opening cards are revealed does the standard third-card tableau run. A verified round then drew one required Player third card and offered that card as its own peel.
- Spectator rounds still play without a wager and update the five road boards.

## Comparison history and fixes

- P1 runtime: the first browser pass rendered blank because a renamed reveal variable was still referenced. The stale reference was corrected and the table now renders normally.
- P1 mobile width: a late inherited rule reduced the betting grid to 183px. The final mobile override restores a 376px grid inside a 390px viewport.
- P1 mobile header: an inherited grid-area assignment made the mode console overflow the top bar by 25px. The mode control now remains inside the bar at a 35px height.
- P3 observation: the three derived-road marks are intentionally very small at 1280px so all five official roads fit without covering the table. They remain distinguishable by mark shape and color.

## Runtime and responsive verification

- Desktop viewport: 1280 x 720 with no horizontal or vertical overflow.
- Mobile viewport: 390 x 844 with document width 390px, document height 844px, 376px betting and result-board widths, and the dock fully inside the viewport.
- Failed runtime images: 0 of 13.
- Browser console warnings/errors: none.
- Side-bet SVG icon count: 6.
- Node game tests: 30/30 passed.
- Vite production build: passed.
- `git diff --check`: passed.

## Implementation checklist

- [x] One-card-at-a-time peel.
- [x] No third card before both two-card opening hands are peeled.
- [x] Player-first or Banker-first peel preference.
- [x] Standard alternating opening deal preserved.
- [x] Illustrated side-bet spots with odds badges.
- [x] Bead Plate, Big Road, Big Eye Boy, Small Road, and Cockroach Pig.
- [x] Desktop and mobile layout verified without overflow.
- [x] Primary spectator and peel flows verified.
- [x] Browser console and runtime assets clean.

final result: passed
