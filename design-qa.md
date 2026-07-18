# CLEOPATRA Speed Baccarat Design QA

## Latest 3D concept fidelity pass

- Source visual truth: `/Users/macbookairm3/Documents/Cleon Casino/references/2026-07-18-baccarat-3d-concept-source.png`
- Desktop betting implementation: `/Users/macbookairm3/Documents/Cleon Casino/references/2026-07-18-baccarat-3d-desktop-betting-final.png`
- Desktop dealt implementation: `/Users/macbookairm3/Documents/Cleon Casino/references/2026-07-18-baccarat-3d-desktop-dealt-final.png`
- Combined comparison evidence: `/Users/macbookairm3/Documents/Cleon Casino/references/2026-07-18-baccarat-3d-comparison.png`
- Dedicated responsive table plates: `/Users/macbookairm3/Documents/Cleon Casino/public/assets/baccarat-table-3d-v2.png` and `/Users/macbookairm3/Documents/Cleon Casino/public/assets/baccarat-table-3d-mobile-v2.png`
- Verified browser viewport: 1280 × 720 desktop. The source is a tall mobile concept; the comparison therefore evaluates shared material depth, hierarchy, and component anatomy rather than claiming pixel-identical coordinates across different aspect ratios.
- State: betting-open and live four-card dealt states with the Road View drawer collapsed; the expanded populated Road View was separately measured after settlement.

### Latest findings

- No actionable P0, P1, or P2 differences remain for the requested 3D-table correction.
- The table now visibly matches the concept's depth cues: sculpted black leather outer rail, double antique-bronze inlay, recessed stitched graphite felt, symmetrical metallic shoes, soft ambient occlusion, and a deep lower rail.
- Player and Banker now use concept-style stacked labels and illuminated total capsules. Cards have a warm off-white face, physical tilt, layered overlap, and heavier cast shadows.
- The central CLEOPATRA lockup is vertical like the source, main wagers use raised blue/green/coral panels, and side wagers use six compact icon-led panels.
- Desktop starts with Road View collapsed so the complete dimensional table remains visible. Mobile keeps Road View open by default to follow the supplied tall concept; both states remain functional.

### Latest required fidelity surfaces

- Fonts and typography: passed. Georgia carries the plaque and centered casino lockup while Inter retains compact live-table readability. Labels, odds, totals, and status copy remain unwrapped.
- Spacing and layout rhythm: passed. At 1280 × 720, the wager layout ends at y=540 and the collapsed Road View begins at y=559, leaving a 19px gap. The viewport remains exactly 1280 × 720 with no document overflow.
- Colors and visual tokens: passed. The implementation now shares the source's charcoal felt, satin-black leather, antique-bronze inlays, champagne typography, Player blue, Tie green, and Banker coral.
- Image quality and asset fidelity: passed. Both generated table plates are high-resolution project assets (1672 × 941 desktop and 941 × 1672 mobile), with real rendered card shoes, stitched felt, leather, and metal rather than CSS substitutes.
- Copy and content: passed. `SPEED BACCARAT`, `CLEOPATRA`, main payouts, official Tiger 6/Tiger 7/Panda 8/Heavenly 9 rules, and all live statuses remain correct. The source's decorative `DRAGON 7` label was intentionally not copied because the verified game implements Tiger 6.
- Interaction states: passed. A Player wager, Deal Now, cinematic four-card arrival, settlement, Road View expand/collapse, and populated-road spacing were exercised in the browser.
- Console/runtime regression: the previously clean console baseline is preserved; the current browser pass rendered both states without an error boundary or runtime interruption, and the production build plus 30 automated tests passed.

## Comparison target

- Source visual truth: `/Users/macbookairm3/.codex/generated_images/019f6a4c-5bb0-76d1-a377-1e987b4c1e43/exec-98507634-0218-4270-9c27-11d4aa46099d.png`
- Timer reference: `/Users/macbookairm3/Desktop/Screenshot 2026-07-18 at 6.52.02 PM.png`
- Mobile implementation screenshot: `/Users/macbookairm3/Documents/Cleon Casino/references/2026-07-18-baccarat-table-first-mobile-final.png`
- Desktop implementation screenshot: `/Users/macbookairm3/Documents/Cleon Casino/references/2026-07-18-baccarat-table-first-desktop-final.png`
- Full-view comparison evidence: `/Users/macbookairm3/Documents/Cleon Casino/references/2026-07-18-baccarat-table-first-design-comparison.png`
- Focused timer comparison evidence: `/Users/macbookairm3/Documents/Cleon Casino/references/2026-07-18-baccarat-timer-design-comparison.png`
- Road-spacing bug reference: `/var/folders/yt/kcls64mx48d25tx442463l2c0000gn/T/TemporaryItems/NSIRD_screencaptureui_tF5vUx/Screenshot 2026-07-18 at 7.37.02 PM.png`
- Road-spacing implementation screenshot: `/Users/macbookairm3/Documents/Cleon Casino/references/2026-07-18-baccarat-road-spacing-desktop-final.png`
- Focused road-spacing evidence: `/Users/macbookairm3/Documents/Cleon Casino/references/2026-07-18-baccarat-road-spacing-focused-final.png`
- Primary viewport: 390 × 844, portrait mobile.
- Secondary viewport: 1440 × 900 desktop request, 1309 × 818 rendered browser content area.
- State: betting-open state for the final full-view comparison; live dealing, result, road-drawer, wager, spectator-round, and peel states were also exercised separately.

## Findings

- No actionable P0, P1, or P2 differences remain.
- Populated Big Road rings are now visually separate. Their border is included in the declared diameter, and each vertically adjacent row retains a visible felt-grid gap instead of allowing the rings to touch or merge.
- The selected table-first hierarchy is present: curved premium felt bowl, upper Player/Banker hand zone, centered brand, three primary betting answers, two-row mobile treasure bets, lower-rail road drawer, chip rack, and compact Deal control.
- The timer matches the supplied interaction reference: a mint circular progress arc with a large white remaining-second value, a dark inset center, and a clear depleted segment.
- The implementation intentionally retains published Tiger 6 rules instead of the generated mock's `DRAGON 7` label. It also starts road history empty and records only the current shoe instead of reproducing the mock's illustrative seeded results.

## Required fidelity surfaces

- Fonts and typography: passed. Georgia supplies the premium display character used by the target while Inter remains the compact UI face. The mobile wordmark, wager labels, odds, drawer headers, and dock values do not wrap or clip.
- Spacing and layout rhythm: passed. At 390 × 844, the earlier browser pass reported `scrollWidth: 390`, `scrollHeight: 844`, zero hand-to-brand overlap, and zero bet-to-road overlap in the normal table view. In the current populated desktop Road View, a Big Road cell measured 14.73px high and its border-box ring measured 12px high, leaving 2.73px of deliberate vertical clearance.
- Colors and visual tokens: passed. Graphite felt and lacquer surfaces use warmer and brighter rail highlights after the second pass; Player blue, Tie mint, Banker coral, and champagne-gold accents follow the selected target.
- Image quality and asset fidelity: passed. The supplied CLEOPATRA brand mark, existing table texture, and denomination-specific chip assets remain sharp. Phosphor provides the functional icon family; no placeholder logo or fake side-bet artwork is present.
- Copy and content: passed. Main payouts, pair odds, Panda 8, Heavenly 9, Tiger 6, Tiger 7, current-shoe labels, and the non-predictive road disclaimer are coherent and rule-aligned.
- Interaction states: passed. The circular timer advances, the table auto-runs spectator rounds, the road drawer collapses from 136px to 38px and reopens, bets enable Deal Now, and peel mode keeps concealed rank and suit content out of the mounted card face until reveal.
- Accessibility: passed for the requested flow. Controls retain semantic buttons and labels, concealed cards have neutral accessible names, motion honors `prefers-reduced-motion`, and the primary mobile controls remain reachable in one viewport.

## Comparison history

### Pass 1 — blocked

- P1 mobile: the expanded 174px road panel covered the second treasure-bet row.
- P1 desktop: the 164px road panel overlapped the lower side-bet console by 37px.
- P2 visual surface: the felt, rail, and primary betting answers were materially darker and flatter than option 3.

Fixes made:

- Reduced the open mobile drawer to 136px and the desktop drawer to 122px while preserving the five road grids and functional collapsed strip.
- Moved the mobile hand layer upward, widened the centered CLEOPATRA lockup, and preserved a measured gap between cards, branding, wagers, and the road console.
- Increased table texture brightness, strengthened the warm-metal rail, and added clearer blue, mint, and coral depth to the three main betting answers.

### Pass 2 — passed

- Post-fix mobile evidence: 390 × 844 with no horizontal or vertical overflow; all six treasure bets and the complete open road drawer are visible.
- Post-fix desktop evidence: no wager/road overlap and the full side-bet row remains visible above the drawer.
- Browser console check: no warnings or errors.
- Tests: 30/30 passed.
- Production build: passed.

### Pass 3 — blocked

- P1 road readability: the user's populated-road screenshot showed vertically adjacent Big Road circles touching and visually merging.
- Root cause: each ring declared a 14px content width and then added a 2px border on every side, producing an 18px outer circle that exceeded the compact grid row height.

Fixes made:

- Changed result markers to `border-box` sizing so the ring border is contained inside the declared diameter.
- Reduced Big Road rings to a controlled 12px desktop diameter and 8px mobile diameter.
- Increased the expanded Road View drawer to 218px desktop, 198px tablet, and 170px mobile so the official six-row road structure retains visible vertical air. The drawer remains compact when collapsed.

### Pass 4 — passed

- Focused post-fix evidence shows distinct gaps between every vertically stacked red and blue Big Road ring.
- Browser measurement at 1280 × 720: 12px ring inside a 14.73px row, `box-sizing: border-box`, 2.73px vertical clearance.
- No unrelated card sizing changed; the live hand row remains at its verified 122px height.
- Tests: 30/30 passed.
- Production build and whitespace validation: passed.

### Pass 5 — blocked

- P1 concept fidelity: the earlier Carbon Club table remained too flat and dark compared with the supplied concept. Thin outline rails and a low-contrast texture did not create the reference's recessed felt bowl, thick padded surround, bronze depth, or twin metallic card shoes.
- P2 component anatomy: Player/Banker totals remained inside compact horizontal headers, the CLEOPATRA mark used a horizontal capsule, and the wager panels lacked the source's raised material treatment.

Fixes made:

- Generated and integrated separate high-resolution desktop and portrait-mobile 3D table plates using the supplied concept as the art-direction reference.
- Rebuilt the hand headers as stacked labels and total capsules, strengthened card depth and shadows, changed the center brand to a vertical lockup, and added raised material treatment to all main and side wagers.
- Removed the redundant flat CSS rail shell and hid the table-rule line that collided with the concept-style center branding.
- Defaulted Road View to collapsed on desktop and open on mobile so the responsive hierarchy follows the available aspect ratio.

### Pass 6 — passed

- The combined source/implementation comparison shows matching leather, bronze, felt, card-shoe, card, brand, wager-panel, and road-drawer art direction.
- Browser geometry at 1280 × 720 confirms no document overflow and a 19px gap between wagers and the collapsed Road View.
- Live dealt cards remain clear of the central brand and Player/Banker totals remain legible.
- Expanded populated Road View retains a 12px Big Road ring inside a 14.73px row, leaving 2.73px vertical clearance.
- Tests: 30/30 passed.
- Production build and whitespace validation: passed.

## Primary interactions tested

- Enter Speed Baccarat from the live-casino lobby.
- Observe the 12-second circular betting countdown and automatic no-wager round.
- Place a Player wager and enable Deal Now.
- Enable optional peel mode and verify concealed-card semantics.
- Collapse and reopen Road View.
- Verify mobile and desktop table sizing, all wager spots, chip rack, result history, and console output.

## Follow-up polish

- No remaining P3 item is required for this concept-fidelity pass.

final result: passed
