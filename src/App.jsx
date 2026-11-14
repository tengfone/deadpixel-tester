import { useCallback, useEffect, useRef, useState } from "react";
import "./App.css";
import { BAR_COLOURS, PATTERNS } from "./patterns.js";

const HUD_MS = 3000;
const EDGE_ZONE = 0.15;
const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";

function useReducedMotion() {
  const [reduced, setReduced] = useState(() => Boolean(window.matchMedia?.(REDUCED_MOTION).matches));
  useEffect(() => {
    const media = window.matchMedia?.(REDUCED_MOTION);
    if (!media?.addEventListener) {
      return undefined;
    }
    const onChange = () => setReduced(media.matches);
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);
  return reduced;
}

function fsElement() {
  return document.fullscreenElement || document.webkitFullscreenElement || null;
}

function fsSupported() {
  return Boolean(document.fullscreenEnabled || document.webkitFullscreenEnabled);
}

function settle(result) {
  if (result && typeof result.catch === "function") {
    result.catch(() => {});
  }
}

function requestFs(node = document.documentElement) {
  const request = node.requestFullscreen || node.webkitRequestFullscreen;
  if (!request || fsElement()) {
    return;
  }
  try {
    settle(request.call(node));
  } catch {
    // Some browsers throw instead of rejecting when full screen is refused.
  }
}

function exitFs() {
  const exit = document.exitFullscreen || document.webkitExitFullscreen;
  if (!exit || !fsElement()) {
    return;
  }
  try {
    settle(exit.call(document));
  } catch {
    // Some browsers throw instead of rejecting when full screen is refused.
  }
}

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
  const [canFullscreen] = useState(fsSupported);
  const [fullscreen, setFullscreen] = useState(() => Boolean(fsElement()));
  const hideTimer = useRef(0);
  const touchStart = useRef(null);
  const startButton = useRef(null);
  const returnFocus = useRef(false);

  const reducedMotion = useReducedMotion();
  const pattern = PATTERNS[index];
  const hint = reducedMotion && pattern.stillHint ? pattern.stillHint : pattern.hint;

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

  const stop = useCallback(() => {
    window.clearTimeout(hideTimer.current);
    returnFocus.current = true;
    setRunning(false);
    setHudOpen(true);
    exitFs();
  }, []);

  const start = useCallback(() => {
    requestFs();
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
    const onKey = (event) => {
      if (event.altKey || event.ctrlKey || event.metaKey) {
        return;
      }
      const key = event.key.toLowerCase();
      if (key === "escape") {
        event.preventDefault();
        stop();
        return;
      }
      if (key === " " && event.target.closest?.("button")) {
        return;
      }
      if (key === "arrowright" || key === "arrowdown" || key === " ") {
        event.preventDefault();
        step(1);
      } else if (key === "arrowleft" || key === "arrowup") {
        event.preventDefault();
        step(-1);
      } else if (key === "f") {
        requestFs();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [running, step, stop]);

  useEffect(() => {
    const onFullscreen = () => {
      const active = Boolean(fsElement());
      setFullscreen(active);
      if (running && !active) {
        revealHud();
      }
    };
    document.addEventListener("fullscreenchange", onFullscreen);
    document.addEventListener("webkitfullscreenchange", onFullscreen);
    return () => {
      document.removeEventListener("fullscreenchange", onFullscreen);
      document.removeEventListener("webkitfullscreenchange", onFullscreen);
    };
  }, [revealHud, running]);

  useEffect(() => () => window.clearTimeout(hideTimer.current), []);

  useEffect(() => {
    if (!running && returnFocus.current) {
      returnFocus.current = false;
      startButton.current?.focus();
    }
  }, [running]);

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
      const edge = Math.max(56, window.innerHeight * EDGE_ZONE);
      const nearEdge = event.clientY < edge || event.clientY > window.innerHeight - edge;
      if (event.pointerType !== "mouse" && nearEdge) {
        revealHud();
      } else {
        step(1);
      }
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
              <button ref={startButton} className="start" type="button" onClick={start}>
                Start test
              </button>
              <span className="plate-count">{PATTERNS.length} plates</span>
            </div>
          </div>
          <ul className="controls">
            <li>
              Click or tap the screen for the next plate. Swipe to move back. On a touch
              screen, tap near the top or bottom edge to show the controls.
            </li>
            <li>
              <kbd>←</kbd> <kbd>→</kbd> move. <kbd>Space</kbd> advances. <kbd>F</kbd> fills the screen.
              In full screen, <kbd>Esc</kbd> leaves full screen; press <kbd>Esc</kbd> again to stop.
            </li>
            <li>The controls hide so they do not cover the pixels you are checking.</li>
            <li>
              Plate 6 blinks black and white. If flashing light affects you, skip it, or turn on
              reduced motion to get a still split instead.
            </li>
          </ul>
        </div>
        <footer className="foot">
          <span>Black, white, primaries, flash, ramps, bars, grid</span>
          <span>Teng Fone</span>
        </footer>
      </main>}

      {running && (
        <div
          className={hudOpen ? "stage hud-open" : "stage"}
          onPointerDown={onPointerDown}
          onPointerUp={onPointerUp}
          onPointerCancel={() => {
            touchStart.current = null;
          }}
          onPointerMove={(event) => {
            if (event.pointerType === "mouse") {
              revealHud();
            }
          }}
        >
          <Plate pattern={pattern} />
          <p className="sr-only" aria-live="polite">
            {pattern.name}. {hint} Plate {index + 1} of {PATTERNS.length}.
          </p>
          <div className="chip">
            <strong>
              {String(index + 1).padStart(2, "0")} {pattern.name}
            </strong>
            {labelOn && <span>{hint}</span>}
          </div>
          <div className="dock" onFocus={revealHud}>
            <button type="button" aria-label="Previous" onClick={() => step(-1)}>
              <span className="dock-long">Previous</span>
              <span className="dock-short" aria-hidden="true">←</span>
            </button>
            <div className="count">
              {index + 1} / {PATTERNS.length}
            </div>
            <button type="button" aria-label="Next" onClick={() => step(1)}>
              <span className="dock-long">Next</span>
              <span className="dock-short" aria-hidden="true">→</span>
            </button>
            {canFullscreen && (
              <button type="button" onClick={() => (fullscreen ? exitFs() : requestFs())}>
                {fullscreen ? "Exit full screen" : "Full screen"}
              </button>
            )}
            <button type="button" onClick={stop}>
              Stop
            </button>
          </div>
        </div>
      )}
    </>
  );
}
