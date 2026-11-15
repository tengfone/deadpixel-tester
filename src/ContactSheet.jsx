import Plate from "./Plate.jsx";
import { FLASH_SECONDS, PATTERNS } from "./patterns.js";

// Frames per film strip on wide screens. Eleven plates make strips of 6 and 5.
const PER_STRIP = 6;

const STRIPS = [];
for (let at = 0; at < PATTERNS.length; at += PER_STRIP) {
  STRIPS.push(PATTERNS.slice(at, at + PER_STRIP).map((pattern, i) => ({ pattern, number: at + i + 1 })));
}

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
function Thumb({ pattern }) {
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
function GreaseBox() {
  return (
    <svg className="grease grease-box" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true" focusable="false">
      <path
        d="M4 6 C30 3 70 4 97 5 C98 35 97 68 96 95 C66 97 34 96 3 94 C2 64 3 34 5 3"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

function GreaseRing() {
  return (
    <svg className="grease grease-ring" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true" focusable="false">
      <path
        d="M46 2 C84 1 97 3 98 20 C99 50 99 80 97 92 C95 98 80 98 52 98 C24 99 6 99 3 93 C1 80 1 40 2 14 C3 4 20 3 60 4"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

function GreaseStrike() {
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

export default function ContactSheet({ includeFlash, reducedMotion }) {
  return (
    <div className="sheet-strips">
      {STRIPS.map((strip) => {
        const first = strip[0].number;
        const last = strip[strip.length - 1].number;
        return (
          <ol key={first} className="strip" start={first} aria-label={`Plates ${first} to ${last}`}>
            {strip.map(({ pattern, number }) => {
              const flash = pattern.kind === "flash";
              const out = flash && !includeFlash;
              const hint = flash && reducedMotion && pattern.stillHint ? pattern.stillHint : pattern.hint;
              return (
                <li key={pattern.id} className={["cell", flash && "is-flash", out && "is-out"].filter(Boolean).join(" ")}>
                  <div className="film">
                    <div className="frame" aria-hidden="true">
                      <Thumb pattern={pattern} />
                    </div>
                    <span className="edge" aria-hidden="true">
                      <EdgeMark />
                      {number}
                    </span>
                    {number === 1 && <GreaseBox />}
                    {out && <GreaseStrike />}
                  </div>
                  <p className="hint">
                    <strong>{pattern.name}</strong>
                    <span className="hint-text">{hint}</span>
                    {flash && (
                      <span className={includeFlash && !reducedMotion ? "tag" : "tag tag-quiet"}>
                        {flashTag(includeFlash, reducedMotion)}
                      </span>
                    )}
                  </p>
                  {number === 1 && <StartNote />}
                  {flash && !out && <GreaseRing />}
                </li>
              );
            })}
          </ol>
        );
      })}
    </div>
  );
}
