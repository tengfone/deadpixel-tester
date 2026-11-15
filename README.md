# Dead pixel tester

A full-screen monitor check for dead, stuck, and uneven pixels. The page fills the display with a colour or pattern you can trust, then gets the controls out of the way.

Live demo: [deadpixel-tester.vercel.app](https://deadpixel-tester.vercel.app/)

![Dead pixel tester: the contact-sheet intro, then the test plates in full screen](assets/demo.gif)

## What it shows

Thirteen plates, in this order:

1. Black
2. Dark grey 5% (`#0d0d0d`, code value 13 of 255) and dark grey 10% (`#1a1a1a`, 26 of 255), for backlight bleed and IPS glow
3. Solid white, red, green, blue
4. A slow black/white blink, so a stuck pixel keeps its colour while the field changes
5. Horizontal and vertical black-to-white ramps
6. Colour bars: white, yellow, cyan, green, magenta, red, blue, black
7. A fine grid on black and on white, drawn so each line is exactly one device pixel at full intensity

A pixel that stays dark on white is dead. A pixel that stays bright on black, or keeps one colour through the blink, is stuck. Bands in a ramp are uneven backlight or bad colour steps. On the dark greys, view in a dim room and look at the edges and corners: light pooling there is backlight bleed, and a glow that moves as you move your head is IPS glow.

The intro is a contact sheet of every plate. Click or tap any frame to start the test at that plate.

The blink flips between black and white every 0.7 seconds. The intro screen warns about it before you start and has an **Include flashing plate** checkbox. It is ticked by default unless your system asks for reduced motion. During the test, **Skip flashing** in the control bar drops it. With reduced motion on, the blink becomes a still black/white split instead of flashing.

## Controls

- **Start test** fills the screen from plate 1, using the browser full-screen API when it is allowed. Any frame on the contact sheet starts at its own plate the same way
- Click (primary button) or tap the plate for the next pattern. Right and middle clicks do nothing
- Swipe left for the next plate, swipe right for the previous one
- Arrow keys move, Space advances, F toggles full screen
- Esc leaves full screen; press Esc again to stop the test
- Going forward from the last plate (the button reads **Finish** there) ends the test
- Move the mouse, or on a touch screen tap near the top or bottom edge, to bring the control bar and plate label back. They hide so they do not cover the pixels you are checking, and a small bump of the mouse does not bring them back

On a phone the stage is the full viewport even when the browser will not enter full screen.

## Summary

After the last plate, or when you stop after seeing at least three plates, the summary asks "Did you see anything?" and shows the frames again. Tap a frame to circle it as a problem and, if you like, pick a type: dead pixel, stuck pixel, banding or bleed, or other. Plates the test did not reach are greyed out.

The verdict is one plain line, such as "Clean: no problems marked on 13 plates" or "Problems marked on 2 plates: White (dead pixel), Grid on white (stuck pixel)", with the date and this screen's size. **Copy summary** puts a short plain-text report on the clipboard, ready to paste to a seller or into a return request. **Run again** starts over from plate 1; **Back to start** returns to the contact sheet. Nothing is uploaded or stored.

## Screen info

The intro footer and the summary show the screen size in CSS pixels times the device pixel ratio, which gives the device pixels, and an estimated refresh rate ("about 60 Hz"). The rate is measured from animation frames over about a second after the page loads and only appears once measured; browsers can cap or throttle animation frames, so treat it as an estimate.

## Run it locally

```bash
npm install
npm start
```

`npm start` opens the Vite dev server. `npm run build` writes `build/`, which is the directory Vercel already publishes.

## Checks

```bash
npm run lint      # ESLint
npm test          # unit tests (Vitest + Testing Library)
npm run test:e2e  # browser smoke test against `vite preview` (Playwright)
```

The end-to-end test needs a Playwright Chromium build. Run `npx playwright install chromium` once, or point `PLAYWRIGHT_CHROMIUM_PATH` at an existing Chromium binary. CI runs lint, unit tests, and the build on every push and pull request.
