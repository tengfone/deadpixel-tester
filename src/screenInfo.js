import { useEffect, useState } from "react";

// Common panel refresh rates. A measured rate within 4% of one of these is
// reported as that rate; anything else is reported rounded.
const KNOWN_HZ = [24, 30, 48, 50, 60, 72, 75, 85, 90, 100, 120, 144, 160, 165, 170, 180, 200, 240, 280, 360, 480, 500];
const MEASURE_MS = 1000;
const MIN_FRAMES = 20;

// Estimates the refresh rate from frame-to-frame intervals in milliseconds.
// The median ignores the odd long frame (a busy main thread, a tab switch).
export function estimateRefresh(intervals) {
  const usable = intervals.filter((ms) => ms > 1 && ms < 100).sort((a, b) => a - b);
  if (usable.length < MIN_FRAMES) {
    return null;
  }
  const median = usable[Math.floor(usable.length / 2)];
  const hz = 1000 / median;
  const near = KNOWN_HZ.find((known) => Math.abs(hz - known) / known < 0.04);
  return near ?? Math.round(hz);
}

export function readScreen() {
  const ratio = window.devicePixelRatio || 1;
  const width = window.screen?.width || window.innerWidth;
  const height = window.screen?.height || window.innerHeight;
  return {
    width,
    height,
    ratio,
    deviceWidth: Math.round(width * ratio),
    deviceHeight: Math.round(height * ratio),
  };
}

function formatRatio(ratio) {
  return `${Number(ratio.toFixed(2))}×`;
}

// "1440 × 900 at 2× = 2880 × 1800 device pixels, about 60 Hz"
export function describeScreen(screen, hz) {
  const css = `${screen.width} × ${screen.height}`;
  const device = `${screen.deviceWidth} × ${screen.deviceHeight} device pixels`;
  const size = screen.ratio === 1 ? device : `${css} at ${formatRatio(screen.ratio)} = ${device}`;
  return hz ? `${size}, about ${hz} Hz` : size;
}

// Screen size now, refresh rate after about a second of animation frames.
// Measuring never blocks: until it finishes, hz is null and nothing is shown.
export function useScreenInfo() {
  const [screen, setScreen] = useState(readScreen);
  const [hz, setHz] = useState(null);

  useEffect(() => {
    const update = () => setScreen(readScreen());
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  useEffect(() => {
    if (typeof window.requestAnimationFrame !== "function") {
      return undefined;
    }
    const intervals = [];
    let last = null;
    let begun = null;
    let frame = 0;
    const tick = (time) => {
      if (begun === null) {
        begun = time;
      } else {
        intervals.push(time - last);
      }
      last = time;
      if (time - begun < MEASURE_MS) {
        frame = window.requestAnimationFrame(tick);
        return;
      }
      setHz(estimateRefresh(intervals));
    };
    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, []);

  return { screen, hz };
}
