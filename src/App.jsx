import { useCallback, useEffect, useRef, useState } from "react";
import "./App.css";
import { BAR_COLOURS, PATTERNS } from "./patterns.js";

const HUD_MS = 1600;

function Plate({ pattern }) {
  if (pattern.kind === "solid") {
    return <div className="plate" style={{ background: pattern.color }} />;
  }
  if (pattern.kind === "flash") {
    return <div className="plate plate-flash" />;
  }
  if (pattern.kind === "ramp-h") {
    return <div className="plate plate-ramp-h" />;
  }
  if (pattern.kind === "ramp-v") {
    return <div className="plate plate-ramp-v" />;
  }
  if (pattern.kind === "bars") {
    return (
      <div className="plate plate-bars">
        {BAR_COLOURS.map((color) => (
          <span key={color} style={{ background: color }} />
        ))}
      </div>
    );
  }
  return (
    <div
      className="plate plate-grid"
      style={{ "--grid-base": pattern.base, "--grid-line": pattern.line }}
    />
  );
}

export default function App() {
  const [running, setRunning] = useState(false);
  const [index, setIndex] = useState(0);
  const [hudOpen, setHudOpen] = useState(true);
  const [labelOn, setLabelOn] = useState(true);
  const stageRef = useRef(null);
  const hideTimer = useRef(0);
  const touchStart = useRef(null);

  const pattern = PATTERNS[index];

  const armHide = useCallback(() => {
    window.clearTimeout(hideTimer.current);
    hideTimer.current = window.setTimeout(() => {
      setHudOpen(false);
      setLabelOn(false);
    }, HUD_MS);
  }, []);

  const revealHud = useCallback(() => {
    setHudOpen(true);
    armHide();
  }, [armHide]);

  const step = useCallback(
    (delta) => {
      const count = PATTERNS.length;
      setIndex((current) => (current + delta + count) % count);
      setLabelOn(true);
      setHudOpen(true);
      armHide();
    },
    [armHide],
  );

  const stop = useCallback(async () => {
    window.clearTimeout(hideTimer.current);
    setRunning(false);
    setHudOpen(true);
    if (document.fullscreenElement) {
      await document.exitFullscreen().catch(() => {});
    }
  }, []);

  const start = useCallback(() => {
    setIndex(0);
    setRunning(true);
    setLabelOn(true);
    setHudOpen(true);
    armHide();
  }, [armHide]);

  useEffect(() => {
    if (!running) {
      return undefined;
    }
    const node = stageRef.current;
    if (node && node.requestFullscreen && !document.fullscreenElement) {
      node.requestFullscreen().catch(() => {});
    }
    return undefined;
  }, [running]);

  useEffect(() => {
    if (!running) {
      return undefined;
    }
    const onKey = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        stop();
        return;
      }
      if (event.key === "ArrowRight" || event.key === "ArrowDown" || event.key === " ") {
        event.preventDefault();
        step(1);
      } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
        event.preventDefault();
        step(-1);
      } else if (event.key === "f") {
        const node = stageRef.current;
        if (node && !document.fullscreenElement) {
          node.requestFullscreen().catch(() => {});
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [running, step, stop]);

  useEffect(() => {
    const onFullscreen = () => {
      if (running && !document.fullscreenElement) {
        revealHud();
      }
    };
    document.addEventListener("fullscreenchange", onFullscreen);
    return () => document.removeEventListener("fullscreenchange", onFullscreen);
  }, [revealHud, running]);

  useEffect(() => () => window.clearTimeout(hideTimer.current), []);

  const onPointerDown = (event) => {
    if (event.target.closest(".dock")) {
      return;
    }
    touchStart.current = { x: event.clientX, y: event.clientY };
  };

  const onPointerUp = (event) => {
    if (event.target.closest(".dock") || !touchStart.current) {
      touchStart.current = null;
      return;
    }
    const dx = event.clientX - touchStart.current.x;
    const dy = event.clientY - touchStart.current.y;
    touchStart.current = null;
    if (Math.abs(dx) < 12 && Math.abs(dy) < 12) {
      step(1);
      return;
    }
    if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy)) {
      step(dx < 0 ? 1 : -1);
    }
  };

  return (
    <>
      {!running && <main className="intro">
        <header className="mast">
          <span>Screen check</span>
          <a href="https://github.com/tengfone/deadpixel-tester">Source</a>
        </header>
        <div className="intro-main">
          <div className="strip" aria-hidden="true">
            {BAR_COLOURS.map((color) => (
              <span key={color} style={{ background: color }} />
            ))}
          </div>
          <div>
            <h1>Dead pixel tester</h1>
            <p className="lede">
              Fill this screen with a colour you can trust. A pixel that stays dark on white,
              or bright on black, is dead or stuck.
            </p>
            <div className="actions">
              <button className="start" type="button" onClick={start}>
                Start test
              </button>
              <span className="plate-count">{PATTERNS.length} plates</span>
            </div>
          </div>
          <ul className="controls">
            <li>
              Click or tap the screen for the next plate. Swipe to move back.
            </li>
            <li>
              <kbd>←</kbd> <kbd>→</kbd> move. <kbd>Space</kbd> advances. <kbd>Esc</kbd> stops. <kbd>F</kbd> fills the screen.
            </li>
            <li>The controls hide so they do not cover the pixels you are checking.</li>
          </ul>
        </div>
        <footer className="foot">
          <span>Black, white, primaries, flash, ramps, bars, grid</span>
          <span>Teng Fone</span>
        </footer>
      </main>}

      {running && (
        <div
          ref={stageRef}
          className={hudOpen ? "stage hud-open" : "stage"}
          onPointerDown={onPointerDown}
          onPointerUp={onPointerUp}
          onPointerMove={revealHud}
        >
          <Plate pattern={pattern} />
          <p className="sr-only" aria-live="polite">
            {pattern.name}. {pattern.hint} Plate {index + 1} of {PATTERNS.length}.
          </p>
          <div className="chip">
            <strong>
              {String(index + 1).padStart(2, "0")} {pattern.name}
            </strong>
            {labelOn && <span>{pattern.hint}</span>}
          </div>
          <div className="dock">
            <button type="button" onClick={() => step(-1)}>
              Previous
            </button>
            <div className="count">
              {index + 1} / {PATTERNS.length}
            </div>
            <button type="button" onClick={() => step(1)}>
              Next
            </button>
            <button
              type="button"
              onClick={() => {
                const node = stageRef.current;
                if (!node) return;
                if (document.fullscreenElement) {
                  document.exitFullscreen().catch(() => {});
                } else {
                  node.requestFullscreen().catch(() => {});
                }
              }}
            >
              Full screen
            </button>
            <button type="button" onClick={stop}>
              Stop
            </button>
          </div>
        </div>
      )}
    </>
  );
}
