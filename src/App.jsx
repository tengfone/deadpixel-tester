import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "./App.css";
import ContactSheet, { EdgeMark } from "./ContactSheet.jsx";
import Plate from "./Plate.jsx";
import { FLASH_PLATE, FLASH_SECONDS, PATTERNS } from "./patterns.js";

const HUD_MS = 3000;
const EDGE_ZONE = 0.15;
// Cumulative mouse travel, in CSS px, before a hidden dock comes back.
const MOVE_REVEAL_PX = 8;
const TAP_SLOP_PX = 12;
const SWIPE_PX = 48;
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
  const root = document.documentElement;
  return Boolean(
    (document.fullscreenEnabled && root.requestFullscreen) ||
      (document.webkitFullscreenEnabled && root.webkitRequestFullscreen),
  );
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

// A pointer click drops focus afterwards, so a clicked dock button does not
// keep the dock pinned open through :focus-within. Keyboard activation
// (detail 0) keeps focus where it is.
function DockButton({ onClick, ...props }) {
  return (
    <button
      type="button"
      {...props}
      onClick={(event) => {
        if (event.detail > 0) {
          event.currentTarget.blur();
        }
        onClick(event);
      }}
    />
  );
}

// Returns the warning as a bold lead word (only when the plate will really
// flash) and the sentence after it.
function flashWarning(included, reducedMotion) {
  if (!included) {
    return { lead: null, text: "The black and white blink is left out of the test." };
  }
  if (reducedMotion) {
    return {
      lead: null,
      text: `Plate ${FLASH_PLATE} is shown as a still black and white split because reduced motion is on.`,
    };
  }
  return {
    lead: "Warning:",
    text: `plate ${FLASH_PLATE} flips between black and white every ${FLASH_SECONDS} seconds. Untick this if flashing light affects you. You can also skip it during the test.`,
  };
}

function Chevron({ direction }) {
  return (
    <svg className="chevron" viewBox="0 0 10 16" aria-hidden="true" focusable="false">
      <path d={direction === "left" ? "M8 2 L2 8 L8 14" : "M2 2 L8 8 L2 14"} />
    </svg>
  );
}

export default function App() {
  const [running, setRunning] = useState(false);
  const [index, setIndex] = useState(0);
  const [hudOpen, setHudOpen] = useState(true);
  const [labelOn, setLabelOn] = useState(true);
  const [canFullscreen] = useState(fsSupported);
  const [fullscreen, setFullscreen] = useState(() => Boolean(fsElement()));
  // null until the visitor touches the checkbox, so the default keeps
  // following the reduced-motion preference.
  const [flashChoice, setFlashChoice] = useState(null);
  const hideTimer = useRef(0);
  const touchStart = useRef(null);
  const mouseTravel = useRef({ last: null, distance: 0 });
  const startButton = useRef(null);
  const nextButton = useRef(null);
  const returnFocus = useRef(false);

  const reducedMotion = useReducedMotion();
  const includeFlash = flashChoice ?? !reducedMotion;
  const plates = useMemo(
    () => (includeFlash ? PATTERNS : PATTERNS.filter((item) => item.kind !== "flash")),
    [includeFlash],
  );
  const pattern = plates[index] ?? plates[0];
  const hint = reducedMotion && pattern.stillHint ? pattern.stillHint : pattern.hint;
  const warning = flashWarning(includeFlash, reducedMotion);

  const armHide = useCallback(() => {
    window.clearTimeout(hideTimer.current);
    hideTimer.current = window.setTimeout(() => {
      setHudOpen(false);
      setLabelOn(false);
      mouseTravel.current = { last: null, distance: 0 };
    }, HUD_MS);
  }, []);

  const revealHud = useCallback(() => {
    setHudOpen(true);
    setLabelOn(true);
    armHide();
  }, [armHide]);

  const step = useCallback(
    (delta) => {
      const count = plates.length;
      setIndex((current) => (current + delta + count) % count);
      setLabelOn(true);
      setHudOpen(true);
      armHide();
    },
    [armHide, plates.length],
  );

  // Drop the flashing plate mid-test and land on the plate that followed it.
  const skipFlash = useCallback(() => {
    const at = plates.findIndex((item) => item.kind === "flash");
    setFlashChoice(false);
    if (at !== -1) {
      setIndex(at % (plates.length - 1));
    }
    setLabelOn(true);
    setHudOpen(true);
    armHide();
  }, [armHide, plates]);

  const toggleFs = useCallback(() => {
    if (fsElement()) {
      exitFs();
    } else {
      requestFs();
    }
  }, []);

  const stop = useCallback(() => {
    window.clearTimeout(hideTimer.current);
    returnFocus.current = true;
    setRunning(false);
    setHudOpen(true);
    exitFs();
  }, []);

  const start = useCallback(() => {
    requestFs();
    // Freeze the choice so a preference change mid-test cannot reshuffle plates.
    setFlashChoice(includeFlash);
    setIndex(0);
    setRunning(true);
    setLabelOn(true);
    setHudOpen(true);
    armHide();
  }, [armHide, includeFlash]);

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
        // Browsers usually consume Esc to leave full screen themselves. If one
        // passes it through, leave full screen first and stop on the next Esc.
        if (fsElement()) {
          exitFs();
        } else {
          stop();
        }
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
        event.preventDefault();
        toggleFs();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [running, step, stop, toggleFs]);

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
    // Only the primary button of the primary pointer starts a tap or swipe:
    // right and middle clicks, and a second finger, never change the plate.
    if (event.target.closest(".dock") || !event.isPrimary || event.button !== 0) {
      return;
    }
    touchStart.current = { id: event.pointerId, x: event.clientX, y: event.clientY };
  };

  const onPointerUp = (event) => {
    const origin = touchStart.current;
    if (!origin || event.pointerId !== origin.id) {
      return;
    }
    touchStart.current = null;
    if (event.target.closest(".dock")) {
      return;
    }
    const dx = event.clientX - origin.x;
    const dy = event.clientY - origin.y;
    if (Math.abs(dx) < TAP_SLOP_PX && Math.abs(dy) < TAP_SLOP_PX) {
      const edge = Math.max(56, window.innerHeight * EDGE_ZONE);
      const nearEdge = event.clientY < edge || event.clientY > window.innerHeight - edge;
      if (event.pointerType !== "mouse" && nearEdge) {
        revealHud();
      } else {
        step(1);
      }
      return;
    }
    if (Math.abs(dx) > SWIPE_PX && Math.abs(dx) > Math.abs(dy)) {
      step(dx < 0 ? 1 : -1);
    }
  };

  const onPointerMove = (event) => {
    if (event.pointerType !== "mouse") {
      return;
    }
    if (hudOpen) {
      armHide();
      return;
    }
    // A hidden dock only returns after deliberate movement, so a nudged desk
    // or mouse does not cover the pixels being checked.
    const travel = mouseTravel.current;
    const point = { x: event.clientX, y: event.clientY };
    if (travel.last) {
      travel.distance += Math.hypot(point.x - travel.last.x, point.y - travel.last.y);
    }
    travel.last = point;
    if (travel.distance > MOVE_REVEAL_PX) {
      mouseTravel.current = { last: null, distance: 0 };
      revealHud();
    }
  };

  return (
    <>
      {!running && (
        <main className="intro">
          <header className="head">
            <div className="head-copy">
              <h1>Dead pixel tester</h1>
              <p className="lede">
                Fill this screen with a colour you can trust. A pixel that stays dark on white is
                dead; one that stays bright or coloured on black is stuck.
              </p>
            </div>
            <div className="head-side">
              <div className="actions">
                <button ref={startButton} className="start" type="button" onClick={start}>
                  Start test
                </button>
                <span className="plate-count">{plates.length} plates</span>
              </div>
              <div className="flash-setting">
                <label>
                  <input
                    type="checkbox"
                    checked={includeFlash}
                    onChange={(event) => setFlashChoice(event.target.checked)}
                    aria-describedby="flash-warning"
                  />
                  Include flashing plate
                </label>
                <p id="flash-warning" className={warning.lead ? "warning" : undefined}>
                  {warning.lead && (
                    <>
                      <strong className="warning-lead">{warning.lead}</strong>{" "}
                    </>
                  )}
                  {warning.text}
                </p>
              </div>
            </div>
          </header>

          <ContactSheet includeFlash={includeFlash} reducedMotion={reducedMotion} />

          <ul className="controls" aria-label="Controls">
            <li>
              Click or tap the screen for the next plate. Swipe left for the next plate, right
              for the previous one. On a touch screen, tap near the top or bottom edge to show
              the controls.
            </li>
            <li>
              <kbd>←</kbd> <kbd>→</kbd> move. <kbd>Space</kbd> advances. <kbd>F</kbd> toggles full
              screen.
              In full screen, <kbd>Esc</kbd> leaves full screen; press <kbd>Esc</kbd> again to stop.
            </li>
            <li>The controls hide so they do not cover the pixels you are checking.</li>
          </ul>
          <footer className="foot">
            <span>Teng Fone</span>
            <a href="https://github.com/tengfone/deadpixel-tester">Source on GitHub</a>
          </footer>
        </main>
      )}

      {running && (
        <div
          className={hudOpen ? "stage hud-open" : "stage"}
          onPointerDown={onPointerDown}
          onPointerUp={onPointerUp}
          onPointerCancel={(event) => {
            if (touchStart.current?.id === event.pointerId) {
              touchStart.current = null;
            }
          }}
          onPointerMove={onPointerMove}
          onContextMenu={(event) => event.preventDefault()}
        >
          <Plate pattern={pattern} />
          <p className="sr-only" aria-live="polite">
            {pattern.name}. {hint} Plate {index + 1} of {plates.length}.
          </p>
          <div className="chip" aria-hidden="true">
            <strong>
              <span className="chip-no">
                <EdgeMark />
                {index + 1}
              </span>{" "}
              {pattern.name}
            </strong>
            {labelOn && <span className="chip-hint">{hint}</span>}
          </div>
          <div className="dock" onFocus={revealHud}>
            <DockButton aria-label="Previous" onClick={() => step(-1)}>
              <span className="dock-long">Previous</span>
              <span className="dock-short" aria-hidden="true">
                <Chevron direction="left" />
              </span>
            </DockButton>
            <div className="count">
              {index + 1} / {plates.length}
            </div>
            <DockButton ref={nextButton} aria-label="Next" onClick={() => step(1)}>
              <span className="dock-long">Next</span>
              <span className="dock-short" aria-hidden="true">
                <Chevron direction="right" />
              </span>
            </DockButton>
            {pattern.kind === "flash" && !reducedMotion && (
              <DockButton
                className="dock-skip"
                onClick={(event) => {
                  skipFlash();
                  // The button disappears with the plate; keep keyboard focus in the dock.
                  if (event.detail === 0) {
                    nextButton.current?.focus();
                  }
                }}
              >
                Skip flashing
              </DockButton>
            )}
            {canFullscreen && (
              <DockButton onClick={toggleFs}>
                {fullscreen ? "Exit full screen" : "Full screen"}
              </DockButton>
            )}
            <DockButton onClick={stop}>Stop</DockButton>
          </div>
        </div>
      )}
    </>
  );
}
