# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **New-monitor buyers** checking a new monitor or laptop within the return window.
- **Second-hand buyers** checking a used screen, laptop or phone in front of the seller, often on the device itself or on a phone.
- **People diagnosing a speck** they already see, who want to know whether it is a dead pixel, a stuck pixel or dust.

## Product Purpose

Fill the display with colours and patterns that can be trusted, so the user can spot dead, stuck and uneven pixels, then get every control out of the way. Success is a confident verdict (dead, stuck, banding, or clean) in a minute or two.

## Positioning

A plain, no-install, no-ads web tool with honest plates: a fine grid drawn at exact device-pixel size, a black/white blink for stuck pixels with a photosensitivity warning and opt-out, and controls that hide so they never cover the pixels being checked.

## Operating Context

Run on the screen under test, in full screen where the browser allows it, often in a shop or at a seller's place, sometimes on a phone. The user looks closely at the panel, moving through plates by click, tap, swipe or keyboard.

## Capabilities and Constraints

- Eleven plates in order: black, white, red, green, blue, stuck-pixel blink (0.7 s), horizontal ramp, vertical ramp, colour bars, grid on black, grid on white (`src/patterns.js`).
- Flashing plate is opt-out on the intro screen ("Include flashing plate"), defaults off under reduced motion, can be skipped during the test, and becomes a still split under reduced motion.
- Controls: Start test (full-screen API when allowed); click/tap next; swipe left/right; arrow keys; Space; F full screen; Esc leaves full screen then stops. Control bar and plate label auto-hide and return on deliberate mouse movement or an edge tap.
- The plates themselves are test equipment: their colours and geometry must stay exact and are not part of the visual redesign.
- Stack: Vite, React 19, plain CSS. Vitest unit tests and a Playwright smoke test.

## Brand Commitments

None binding. The name "Dead pixel tester" is in use.

## Evidence on Hand

No usage data or testimonials; do not invent them.

## Product Principles

1. The plates are the product; chrome never touches them.
2. Explain what to look for in one sentence per plate, in plain words.
3. Safety first: the flashing plate is warned about and easy to avoid.
4. Works on a phone in a stranger's living room as well as on a desk.

## Accessibility & Inclusion

Photosensitivity: the flashing plate keeps its warning, opt-out and reduced-motion behaviour.
