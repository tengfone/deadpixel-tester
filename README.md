# Dead pixel tester

A full-screen monitor check for dead, stuck, and uneven pixels. The page fills the display with a colour or pattern you can trust, then gets the controls out of the way.

Live demo: [deadpixel-tester.vercel.app](https://deadpixel-tester.vercel.app/)

## What it shows

1. Solid plates: black, white, red, green, blue
2. A slow black/white blink, so a stuck pixel keeps its colour while the field changes
3. Horizontal and vertical black-to-white ramps
4. Primary colour bars
5. A fine grid on black and on white

A pixel that stays dark on white is dead. A pixel that stays bright on black, or keeps one colour through the blink, is stuck. Bands in a ramp are uneven backlight or bad colour steps. If your system asks for reduced motion, the blink becomes a still black/white split instead of flashing.

## Controls

- **Start test** fills the screen, using the browser full-screen API when it is allowed
- Click or tap the plate for the next pattern
- Swipe left for the next plate, swipe right for the previous one
- Arrow keys move, Space advances, F requests full screen, Esc stops
- Move the pointer to bring the control bar back. It hides so it does not cover the pixels you are checking

On a phone the stage is the full viewport even when the browser will not enter full screen.

## Run it locally

```bash
npm install
npm start
```

`npm start` opens the Vite dev server. `npm run build` writes `build/`, which is the directory Vercel already publishes.

## Repo metadata

Description: Full-screen monitor test for dead, stuck, and uneven pixels.

Topics: `monitor`, `dead-pixels`, `display-test`, `react`, `vite`
