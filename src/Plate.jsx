import { useEffect, useRef } from "react";
import { BAR_COLOURS, GRID_PITCH } from "./patterns.js";

// Draws the grid in device pixels so every line is exactly one physical pixel
// at full intensity, whatever the devicePixelRatio. A CSS gradient grid is
// 1 CSS px wide, which is 2+ device pixels on a high-density screen.
// The device-pixel box is exact where it is right, but some environments
// (device emulation, for one) report CSS pixels there. Trust it only when it
// agrees with the CSS size times the ratio, to within snapping.
function pickSize(devicePixels, estimate) {
  if (devicePixels && Math.abs(devicePixels - estimate) <= 1) {
    return devicePixels;
  }
  return Math.round(estimate);
}

export function GridPlate({ base, line, pitch = GRID_PITCH }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return undefined;
    }
    let frame = 0;
    let deviceSize = null;
    let media = null;

    const draw = () => {
      frame = 0;
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      const width = pickSize(deviceSize?.width, rect.width * dpr);
      const height = pickSize(deviceSize?.height, rect.height * dpr);
      if (!width || !height) {
        return;
      }
      if (canvas.width !== width) {
        canvas.width = width;
      }
      if (canvas.height !== height) {
        canvas.height = height;
      }
      const context = canvas.getContext("2d");
      if (!context) {
        return;
      }
      context.setTransform(1, 0, 0, 1, 0, 0);
      context.fillStyle = base;
      context.fillRect(0, 0, width, height);
      context.fillStyle = line;
      const step = Math.max(2, Math.round(pitch * dpr));
      for (let x = 0; x < width; x += step) {
        context.fillRect(x, 0, 1, height);
      }
      for (let y = 0; y < height; y += step) {
        context.fillRect(0, y, width, 1);
      }
    };

    const schedule = () => {
      if (!frame) {
        frame = window.requestAnimationFrame(draw);
      }
    };

    // A resolution query matches only the current ratio, so re-arm it each
    // time it flips (browser zoom, or the window moving to another display).
    const onRatio = () => {
      watchRatio();
      schedule();
    };
    const watchRatio = () => {
      media?.removeEventListener?.("change", onRatio);
      media = window.matchMedia?.(`(resolution: ${window.devicePixelRatio || 1}dppx)`) ?? null;
      media?.addEventListener?.("change", onRatio);
    };
    watchRatio();

    let observer = null;
    if (typeof ResizeObserver === "function") {
      observer = new ResizeObserver((entries) => {
        const box = entries[entries.length - 1]?.devicePixelContentBoxSize?.[0];
        deviceSize = box ? { width: box.inlineSize, height: box.blockSize } : null;
        schedule();
      });
      try {
        observer.observe(canvas, { box: "device-pixel-content-box" });
      } catch {
        observer.observe(canvas);
      }
    }
    window.addEventListener("resize", schedule);
    draw();

    return () => {
      window.cancelAnimationFrame(frame);
      observer?.disconnect();
      media?.removeEventListener?.("change", onRatio);
      window.removeEventListener("resize", schedule);
    };
  }, [base, line, pitch]);

  return <canvas ref={canvasRef} className="plate plate-grid" data-testid="grid-canvas" />;
}

export default function Plate({ pattern }) {
  switch (pattern.kind) {
    case "solid":
      return <div className="plate" style={{ background: pattern.color }} />;
    case "flash":
      return <div className="plate plate-flash" />;
    case "ramp-h":
      return <div className="plate plate-ramp-h" />;
    case "ramp-v":
      return <div className="plate plate-ramp-v" />;
    case "bars":
      return (
        <div className="plate plate-bars">
          {BAR_COLOURS.map((color) => (
            <span key={color} style={{ background: color }} />
          ))}
        </div>
      );
    case "grid":
      return <GridPlate base={pattern.base} line={pattern.line} />;
    default: {
      const message = `Unknown plate kind "${pattern.kind}" for pattern "${pattern.id}".`;
      if (import.meta.env.DEV) {
        throw new Error(message);
      }
      console.error(message);
      return <div className="plate" style={{ background: "#000" }} />;
    }
  }
}
