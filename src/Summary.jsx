import { useEffect, useRef, useState } from "react";
import { FilmCell, GreaseCircle, PER_STRIP } from "./ContactSheet.jsx";
import { describeScreen } from "./screenInfo.js";

export const PROBLEM_TYPES = [
  { value: "dead", label: "Dead pixel" },
  { value: "stuck", label: "Stuck pixel" },
  { value: "bleed", label: "Banding or bleed" },
  { value: "other", label: "Other" },
];

function plural(count, word) {
  return `${count} ${word}${count === 1 ? "" : "s"}`;
}

function typeLabel(type) {
  return PROBLEM_TYPES.find((item) => item.value === type)?.label.toLowerCase() ?? null;
}

// The one plain line a buyer can quote. `marks` maps plate id to a problem
// type ("" when the type was not given).
export function verdictLine(plates, seen, marks) {
  const checked = plates.filter((pattern) => seen.has(pattern.id));
  const partial = checked.length < plates.length;
  const scope = partial ? `. ${checked.length} of ${plates.length} plates seen.` : "";
  const marked = checked.filter((pattern) => marks.has(pattern.id));
  if (marked.length === 0) {
    return partial
      ? `Clean: no problems marked on the ${plural(checked.length, "plate")} seen (of ${plates.length})`
      : `Clean: no problems marked on ${plural(checked.length, "plate")}`;
  }
  const list = marked
    .map((pattern) => {
      const type = typeLabel(marks.get(pattern.id));
      return type ? `${pattern.name} (${type})` : pattern.name;
    })
    .join(", ");
  const lead = marked.length === 1 ? "Problem marked on 1 plate" : `Problems marked on ${marked.length} plates`;
  return `${lead}: ${list}${scope}`;
}

export function summaryText({ plates, seen, marks, date, screen, hz, url }) {
  const checked = plates.filter((pattern) => seen.has(pattern.id));
  const lines = [
    "Dead pixel tester result",
    `Date: ${date}`,
    `Screen: ${describeScreen(screen, hz)}`,
    `Result: ${verdictLine(plates, seen, marks)}`,
    `Plates checked (${checked.length} of ${plates.length}): ${checked.map((pattern) => pattern.name).join(", ")}`,
  ];
  if (url) {
    lines.push(`Tested with ${url}`);
  }
  return lines.join("\n");
}

async function copyText(text) {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Fall through to the selection copy below.
  }
  const area = document.createElement("textarea");
  area.value = text;
  area.setAttribute("readonly", "");
  area.style.position = "fixed";
  area.style.opacity = "0";
  document.body.append(area);
  area.select();
  let copied = false;
  try {
    copied = document.execCommand("copy");
  } catch {
    copied = false;
  }
  area.remove();
  return copied;
}

export default function Summary({ plates, seen, screenInfo, onRunAgain, onBack }) {
  const [marks, setMarks] = useState(() => new Map());
  const [copy, setCopy] = useState({ state: "idle", text: "" });
  const [date] = useState(() =>
    new Date().toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" }),
  );
  const heading = useRef(null);
  const fallback = useRef(null);

  useEffect(() => {
    heading.current?.focus();
  }, []);

  useEffect(() => {
    if (copy.state === "failed") {
      fallback.current?.select();
    }
  }, [copy.state]);

  const toggle = (id) => {
    setMarks((current) => {
      const next = new Map(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.set(id, "");
      }
      return next;
    });
    setCopy({ state: "idle", text: "" });
  };

  const setType = (id, type) => {
    setMarks((current) => new Map(current).set(id, type));
    setCopy({ state: "idle", text: "" });
  };

  const verdict = verdictLine(plates, seen, marks);
  const screenLine = describeScreen(screenInfo.screen, screenInfo.hz);

  const onCopy = async () => {
    const text = summaryText({
      plates,
      seen,
      marks,
      date,
      screen: screenInfo.screen,
      hz: screenInfo.hz,
      url: `${window.location.origin}${window.location.pathname}`,
    });
    const copied = await copyText(text);
    setCopy({ state: copied ? "copied" : "failed", text });
  };

  return (
    <main className="intro summary">
      <header className="summary-head">
        <h1 ref={heading} tabIndex={-1}>
          Did you see anything?
        </h1>
        <p className="lede">
          Tap each frame where you saw a problem, then say what kind if you can. Nothing leaves
          this page unless you copy it.
        </p>
      </header>

      <div className="sheet-strips">
        <ol className="strip" aria-label="Plates in this run" style={{ "--per-strip": PER_STRIP }}>
          {plates.map((pattern, at) => {
            const number = at + 1;
            const reached = seen.has(pattern.id);
            const marked = marks.has(pattern.id);
            const selectId = `problem-${pattern.id}`;
            return (
              <FilmCell
                key={pattern.id}
                pattern={pattern}
                number={number}
                className={[!reached && "is-out", marked && "is-marked"].filter(Boolean).join(" ")}
                buttonProps={{
                  "aria-label": `Problem on plate ${number}, ${pattern.name}`,
                  "aria-pressed": reached ? marked : undefined,
                  "aria-disabled": reached ? undefined : true,
                  "aria-describedby": reached ? undefined : "not-reached-reason",
                  onClick: () => {
                    if (reached) {
                      toggle(pattern.id);
                    }
                  },
                }}
                marks={marked && <GreaseCircle />}
              >
                <div className="hint">
                  <strong>{pattern.name}</strong>
                  {!reached && <span className="tag tag-quiet">Not reached</span>}
                  {reached && !marked && <span className="hint-text">No problem marked</span>}
                  {marked && (
                    <>
                      <label className="sr-only" htmlFor={selectId}>
                        Problem type on {pattern.name}
                      </label>
                      <select
                        id={selectId}
                        className="problem-type"
                        value={marks.get(pattern.id)}
                        onChange={(event) => setType(pattern.id, event.target.value)}
                      >
                        <option value="">Problem, type not set</option>
                        {PROBLEM_TYPES.map((item) => (
                          <option key={item.value} value={item.value}>
                            {item.label}
                          </option>
                        ))}
                      </select>
                    </>
                  )}
                </div>
              </FilmCell>
            );
          })}
        </ol>
        <p id="not-reached-reason" className="sr-only">
          The test stopped before this plate.
        </p>
      </div>

      <section className="result" aria-label="Result">
        <div className="result-copy">
          <p className="verdict" aria-live="polite">
            {verdict}
          </p>
          <p className="result-meta">
            <span>{date}</span>
            <span>{screenLine}</span>
          </p>
        </div>
        <div className="result-actions">
          <button className="start" type="button" onClick={onCopy}>
            Copy summary
          </button>
          <button className="button-quiet" type="button" onClick={onRunAgain}>
            Run again
          </button>
          <button className="button-quiet" type="button" onClick={onBack}>
            Back to start
          </button>
        </div>
        <p className="copy-status" role="status">
          {copy.state === "copied" && "Copied. Paste it into a message to the seller or a return request."}
          {copy.state === "failed" && "This browser blocked copying. The text is selected below; copy it by hand."}
        </p>
        {copy.state === "failed" && (
          <textarea
            ref={fallback}
            className="copy-fallback"
            readOnly
            value={copy.text}
            aria-label="Summary text"
            rows={6}
          />
        )}
      </section>

      <footer className="foot">
        <span>Teng Fone</span>
        <a href="https://github.com/tengfone/deadpixel-tester">Source on GitHub</a>
      </footer>
    </main>
  );
}
