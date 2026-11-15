import Plate from "./Plate.jsx";
import { FLASH_SECONDS, PATTERNS } from "./patterns.js";

// Frames per film strip on wide screens. Thirteen plates make strips of 7 and 6.
// The strips are one list; the grid breaks it into rows, so a phone shows the
// same frames as a two-column grid.
export const PER_STRIP = 7;

// The edge-print frame marker, drawn rather than typed.
export function EdgeMark() {
  return (
    <svg className="edge-mark" viewBox="0 0 6 8" aria-hidden="true" focusable="false">
      <path d="M0 0 L6 4 L0 8 Z" fill="currentColor" />
    </svg>
  );
}

// Thumbnails go through the same Plate renderer as the test, so every colour
// and the 1-device-pixel grid are the real thing. The only stand-in is the
// blink, which a contact sheet shows as its still black/white split.
export function Thumb({ pattern }) {
  if (pattern.kind === "flash") {
    return (
      <div className="plate thumb-split">
        <span />
        <span />
      </div>
    );
  }
  return <Plate pattern={pattern} />;
}

// Grease-pencil marks. Paths are drawn in a 100x100 box and stretched to the
// frame, with a non-scaling stroke so the line weight stays even.
export function GreaseBox({ className = "grease-box" }) {
  return (
    <svg className={`grease ${className}`} viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true" focusable="false">
      <path
        d="M4 6 C30 3 70 4 97 5 C98 35 97 68 96 95 C66 97 34 96 3 94 C2 64 3 34 5 3"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

export function GreaseRing() {
  return (
    <svg className="grease grease-ring" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true" focusable="false">
      <path
        d="M46 2 C84 1 97 3 98 20 C99 50 99 80 97 92 C95 98 80 98 52 98 C24 99 6 99 3 93 C1 80 1 40 2 14 C3 4 20 3 60 4"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

// The editor's circle: a loop drawn round a chosen frame, with the overshoot
// of a hand that does not lift. Used on the summary to mark a problem.
export function GreaseCircle() {
  return (
    <svg className="grease grease-circle" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true" focusable="false">
      <path
        d="M52 4 C82 4 98 22 97 50 C96 80 76 97 48 96 C20 95 3 78 4 49 C5 22 24 5 58 7 C66 8 72 10 77 14"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

export function GreaseStrike() {
  return (
    <svg className="grease grease-strike" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true" focusable="false">
      <path d="M6 8 C40 40 62 62 94 92 M92 10 C60 38 40 62 8 90" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

function StartNote() {
  return (
    <span className="start-note" aria-hidden="true">
      <span className="start-word">start</span>
      <svg viewBox="0 0 64 24" focusable="false">
        <path d="M2 14 C18 10 36 9 58 12 M48 4 C52 7 56 10 60 12 C55 15 51 18 47 21" />
      </svg>
    </span>
  );
}

function flashTag(includeFlash, reducedMotion) {
  if (!includeFlash) {
    return "Left out";
  }
  if (reducedMotion) {
    return "Still split";
  }
  return `Flashes every ${FLASH_SECONDS} s`;
}

// One cell of film: the frame (a real plate render) with its edge-printed
// number, as a button, and whatever sits on paper beneath it.
export function FilmCell({ pattern, number, className, buttonProps, marks, children }) {
  return (
    <li className={["cell", className].filter(Boolean).join(" ")}>
      <button type="button" className="film" {...buttonProps}>
        <span className="frame" aria-hidden="true">
          <Thumb pattern={pattern} />
        </span>
        <span className="edge" aria-hidden="true">
          <EdgeMark />
          {number}
        </span>
        {marks}
      </button>
      {children}
    </li>
  );
}

export default function ContactSheet({ includeFlash, reducedMotion, onStartAt }) {
  return (
    <div className="sheet-strips">
      <ol className="strip" aria-label="Plates" style={{ "--per-strip": PER_STRIP }}>
        {PATTERNS.map((pattern, at) => {
          const number = at + 1;
          const flash = pattern.kind === "flash";
          const out = flash && !includeFlash;
          const hint = flash && reducedMotion && pattern.stillHint ? pattern.stillHint : pattern.hint;
          return (
            <FilmCell
              key={pattern.id}
              pattern={pattern}
              number={number}
              className={[flash && "is-flash", out && "is-out"].filter(Boolean).join(" ")}
              buttonProps={{
                "aria-label": `Start at plate ${number}, ${pattern.name}`,
                "aria-disabled": out || undefined,
                "aria-describedby": out ? "flash-out-reason" : undefined,
                onClick: () => {
                  if (!out) {
                    onStartAt(pattern);
                  }
                },
              }}
              marks={
                <>
                  {number === 1 ? <GreaseBox /> : !out && <GreaseBox className="grease-box grease-hover" />}
                  {out && <GreaseStrike />}
                </>
              }
            >
              <p className="hint">
                <strong>{pattern.name}</strong>
                <span className="hint-text">{hint}</span>
                {flash && (
                  <span className={includeFlash && !reducedMotion ? "tag" : "tag tag-quiet"}>
                    {flashTag(includeFlash, reducedMotion)}
                  </span>
                )}
                {out && (
                  <span id="flash-out-reason" className="sr-only">
                    Left out of the test. Tick Include flashing plate to start here.
                  </span>
                )}
              </p>
              {number === 1 && <StartNote />}
              {flash && !out && <GreaseRing />}
            </FilmCell>
          );
        })}
      </ol>
    </div>
  );
}
