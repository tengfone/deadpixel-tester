import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import App from "./App.jsx";
import { FLASH_PLATE, PATTERNS } from "./patterns.js";
import { media } from "./test/setup.js";

const TOTAL = PATTERNS.length;
const NO_FLASH = PATTERNS.filter((pattern) => pattern.kind !== "flash");
// Plate names by position, so the tests follow the plate list.
const N = (i) => PATTERNS[i].name;

function stage() {
  return document.querySelector(".stage");
}

function plateName() {
  return document.querySelector(".chip strong").textContent.replace(/^\d+\s+/, "");
}

function plateHint() {
  return document.querySelector(".chip-hint")?.textContent ?? null;
}

function counter() {
  return document.querySelector(".dock .count").textContent.replace(/\s+/g, " ").trim();
}

function startTest() {
  render(<App />);
  fireEvent.click(screen.getByRole("button", { name: "Start test" }));
}

function press(key, init = {}) {
  fireEvent.keyDown(window, { key, ...init });
}

function pointer(type, init = {}) {
  fireEvent[type](init.target ?? stage(), {
    pointerId: 1,
    pointerType: "mouse",
    isPrimary: true,
    button: 0,
    clientX: 400,
    clientY: 400,
    ...init,
  });
}

function tap(init = {}) {
  pointer("pointerDown", init);
  pointer("pointerUp", init);
}

function swipe(fromX, toX, init = {}) {
  pointer("pointerDown", { pointerType: "touch", clientX: fromX, ...init });
  pointer("pointerUp", { pointerType: "touch", clientX: toX, ...init });
}

function hideHud() {
  act(() => {
    vi.advanceTimersByTime(3000);
  });
}

describe("start and stop", () => {
  it("starts on the first plate in full screen and stops back to the intro", () => {
    startTest();
    expect(stage()).toBeInTheDocument();
    expect(plateName()).toBe(N(0));
    expect(counter()).toBe(`1 / ${TOTAL}`);
    expect(document.documentElement.requestFullscreen).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: "Exit full screen" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Stop" }));
    expect(stage()).not.toBeInTheDocument();
    expect(document.exitFullscreen).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: "Start test" })).toHaveFocus();
  });

  it("restarts from the first plate", () => {
    startTest();
    press("ArrowRight");
    fireEvent.click(screen.getByRole("button", { name: "Stop" }));
    fireEvent.click(screen.getByRole("button", { name: "Start test" }));
    expect(plateName()).toBe(N(0));
  });
});

describe("keyboard", () => {
  it("moves with arrows and space, and wraps around both ends", () => {
    startTest();
    press("ArrowRight");
    expect(plateName()).toBe(N(1));
    press("ArrowDown");
    expect(plateName()).toBe(N(2));
    press(" ");
    expect(plateName()).toBe(N(3));
    press("ArrowLeft");
    press("ArrowUp");
    expect(plateName()).toBe(N(1));
    press("ArrowLeft");
    press("ArrowLeft");
    expect(plateName()).toBe(PATTERNS[TOTAL - 1].name);
    expect(counter()).toBe(`${TOTAL} / ${TOTAL}`);
    press("ArrowLeft");
    press("ArrowRight");
    expect(plateName()).toBe(PATTERNS[TOTAL - 1].name);
  });

  it("finishes on the summary after the last plate", () => {
    startTest();
    for (let i = 0; i < TOTAL - 1; i += 1) {
      press("ArrowRight");
    }
    expect(screen.getByRole("button", { name: "Finish" })).toBeInTheDocument();
    press("ArrowRight");
    expect(stage()).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Did you see anything?" })).toHaveFocus();
    expect(document.exitFullscreen).toHaveBeenCalled();
  });

  it("ignores keys held with Ctrl, Alt or Meta, but not Shift", () => {
    startTest();
    press("ArrowRight", { ctrlKey: true });
    press("ArrowRight", { altKey: true });
    press("ArrowRight", { metaKey: true });
    press("Escape", { metaKey: true });
    expect(plateName()).toBe(N(0));
    expect(stage()).toBeInTheDocument();
    press("ArrowRight", { shiftKey: true });
    expect(plateName()).toBe(N(1));
  });

  it("lets Space activate a focused dock button without also advancing", () => {
    startTest();
    const next = screen.getByRole("button", { name: "Next" });
    next.focus();
    fireEvent.keyDown(next, { key: " " });
    expect(plateName()).toBe(N(0));
  });

  it("toggles full screen with F and Shift+F", () => {
    startTest();
    expect(document.fullscreenElement).not.toBeNull();
    press("f");
    expect(document.exitFullscreen).toHaveBeenCalledTimes(1);
    expect(document.fullscreenElement).toBeNull();
    press("F", { shiftKey: true });
    expect(document.documentElement.requestFullscreen).toHaveBeenCalledTimes(2);
    expect(document.fullscreenElement).not.toBeNull();
    expect(stage()).toBeInTheDocument();
  });

  it("leaves full screen on the first Esc and stops on the second", () => {
    startTest();
    press("Escape");
    expect(document.fullscreenElement).toBeNull();
    expect(stage()).toBeInTheDocument();
    press("Escape");
    expect(stage()).not.toBeInTheDocument();
  });

  it("does not listen for plate keys on the intro", () => {
    render(<App />);
    press("ArrowRight");
    press("f");
    expect(document.documentElement.requestFullscreen).not.toHaveBeenCalled();
  });
});

describe("pointer", () => {
  it("advances on a primary click", () => {
    startTest();
    tap();
    expect(plateName()).toBe(N(1));
  });

  it("ignores right and middle clicks and blocks the context menu", () => {
    startTest();
    tap({ button: 2 });
    tap({ button: 1 });
    expect(plateName()).toBe(N(0));
    const menu = fireEvent.contextMenu(stage());
    expect(menu).toBe(false);
  });

  it("ignores a secondary touch, even mid-gesture", () => {
    startTest();
    pointer("pointerDown", { pointerType: "touch", pointerId: 1, clientX: 400 });
    pointer("pointerDown", { pointerType: "touch", pointerId: 2, isPrimary: false, clientX: 40 });
    pointer("pointerUp", { pointerType: "touch", pointerId: 2, isPrimary: false, clientX: 40 });
    expect(plateName()).toBe(N(0));
    // The primary finger still owns the gesture: a 200px swipe left.
    pointer("pointerUp", { pointerType: "touch", pointerId: 1, clientX: 200 });
    expect(plateName()).toBe(N(1));
  });

  it("goes forward on a swipe left and back on a swipe right", () => {
    startTest();
    swipe(500, 300);
    expect(plateName()).toBe(N(1));
    swipe(300, 500);
    expect(plateName()).toBe(N(0));
    swipe(300, 500);
    expect(plateName()).toBe(PATTERNS[TOTAL - 1].name);
  });

  it("ignores short or mostly vertical drags", () => {
    startTest();
    swipe(400, 370);
    pointer("pointerDown", { pointerType: "touch", clientX: 400, clientY: 200 });
    pointer("pointerUp", { pointerType: "touch", clientX: 340, clientY: 500 });
    expect(plateName()).toBe(N(0));
  });

  it("only reveals the HUD on a touch tap near the top edge", () => {
    vi.useFakeTimers();
    startTest();
    hideHud();
    expect(stage()).not.toHaveClass("hud-open");
    expect(plateHint()).toBeNull();

    tap({ pointerType: "touch", clientY: 10 });
    expect(stage()).toHaveClass("hud-open");
    expect(plateName()).toBe(N(0));
    expect(plateHint()).toBe(PATTERNS[0].hint);

    tap({ pointerType: "touch", clientY: window.innerHeight / 2 });
    expect(plateName()).toBe(N(1));
  });

  it("still advances on a mouse click near the top edge", () => {
    startTest();
    tap({ clientY: 10 });
    expect(plateName()).toBe(N(1));
  });

  it("drops a gesture when the pointer is cancelled", () => {
    startTest();
    pointer("pointerDown", { pointerType: "touch" });
    pointer("pointerCancel", { pointerType: "touch" });
    pointer("pointerUp", { pointerType: "touch" });
    expect(plateName()).toBe(N(0));
  });
});

describe("HUD and dock", () => {
  it("hides the dock and hint after three seconds", () => {
    vi.useFakeTimers();
    startTest();
    expect(stage()).toHaveClass("hud-open");
    expect(plateHint()).toBe(PATTERNS[0].hint);
    hideHud();
    expect(stage()).not.toHaveClass("hud-open");
    expect(plateHint()).toBeNull();
  });

  it("needs more than 8px of mouse travel to bring the dock back", () => {
    vi.useFakeTimers();
    startTest();
    hideHud();
    // 2 + 2 + 4 = 8px of travel: still hidden.
    pointer("pointerMove", { clientX: 400, clientY: 400 });
    pointer("pointerMove", { clientX: 402, clientY: 400 });
    pointer("pointerMove", { clientX: 400, clientY: 400 });
    pointer("pointerMove", { clientX: 400, clientY: 404 });
    expect(stage()).not.toHaveClass("hud-open");
    pointer("pointerMove", { clientX: 400, clientY: 405 });
    expect(stage()).toHaveClass("hud-open");
    expect(plateHint()).toBe(PATTERNS[0].hint);
  });

  it("does not reveal the dock on touch movement", () => {
    vi.useFakeTimers();
    startTest();
    hideHud();
    pointer("pointerMove", { pointerType: "touch", clientX: 0 });
    pointer("pointerMove", { pointerType: "touch", clientX: 300 });
    expect(stage()).not.toHaveClass("hud-open");
  });

  it("brings the dock back when a dock button takes keyboard focus", () => {
    vi.useFakeTimers();
    startTest();
    hideHud();
    act(() => screen.getByRole("button", { name: "Next" }).focus());
    expect(stage()).toHaveClass("hud-open");
  });

  it("drops focus after a pointer click on a dock button but keeps it for keyboard", () => {
    startTest();
    const next = screen.getByRole("button", { name: "Next" });
    next.focus();
    fireEvent.click(next, { detail: 1 });
    expect(next).not.toHaveFocus();
    expect(plateName()).toBe(N(1));

    next.focus();
    fireEvent.click(next, { detail: 0 });
    expect(next).toHaveFocus();
    expect(plateName()).toBe(N(2));
  });

  it("does not treat a press on the dock as a plate tap", () => {
    startTest();
    const previous = screen.getByRole("button", { name: "Previous" });
    pointer("pointerDown", { target: previous });
    pointer("pointerUp", { target: previous });
    expect(plateName()).toBe(N(0));
  });

  it("announces the plate once, from the live region only", () => {
    startTest();
    const chip = document.querySelector(".chip");
    expect(chip).toHaveAttribute("aria-hidden", "true");
    const live = document.querySelector("[aria-live]");
    expect(live).toHaveTextContent(`Black. ${PATTERNS[0].hint} Plate 1 of ${TOTAL}.`);
  });
});

describe("flashing plate", () => {
  function goToFlash() {
    for (let i = 1; i < FLASH_PLATE; i += 1) {
      press("ArrowRight");
    }
  }

  it("is included by default with the warning shown before starting", () => {
    render(<App />);
    const box = screen.getByRole("checkbox", { name: "Include flashing plate" });
    expect(box).toBeChecked();
    expect(box).toHaveAccessibleDescription(new RegExp(`plate ${FLASH_PLATE} flips between black and white`, "i"));
    expect(screen.getByText(`${TOTAL} plates`)).toBeInTheDocument();
  });

  it("can be left out from the intro", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("checkbox", { name: "Include flashing plate" }));
    expect(screen.getByText(`${NO_FLASH.length} plates`)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Start test" }));
    const seen = new Set();
    for (let i = 0; i < NO_FLASH.length; i += 1) {
      seen.add(plateName());
      press("ArrowRight");
    }
    expect(seen.size).toBe(NO_FLASH.length);
    expect(seen.has("Stuck pixel")).toBe(false);
    expect(document.querySelector(".plate-flash")).toBeNull();
  });

  it("can be skipped from the dock during the test", () => {
    startTest();
    goToFlash();
    expect(plateName()).toBe("Stuck pixel");
    expect(document.querySelector(".plate-flash")).toBeInTheDocument();
    const skip = screen.getByRole("button", { name: "Skip flashing" });
    skip.focus();
    fireEvent.click(skip, { detail: 0 });
    expect(plateName()).toBe(PATTERNS[FLASH_PLATE].name);
    expect(counter()).toBe(`${FLASH_PLATE} / ${NO_FLASH.length}`);
    expect(screen.getByRole("button", { name: "Next" })).toHaveFocus();
    expect(screen.queryByRole("button", { name: "Skip flashing" })).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Stop" }));
    fireEvent.click(screen.getByRole("button", { name: "Back to start" }));
    expect(screen.getByRole("checkbox", { name: "Include flashing plate" })).not.toBeChecked();
  });

  it("only offers the skip button on the flashing plate", () => {
    startTest();
    expect(screen.queryByRole("button", { name: "Skip flashing" })).toBeNull();
  });
});

describe("reduced motion", () => {
  it("leaves the flashing plate out by default", () => {
    media.reduced = true;
    render(<App />);
    expect(screen.getByRole("checkbox", { name: "Include flashing plate" })).not.toBeChecked();
    expect(screen.getByText(`${NO_FLASH.length} plates`)).toBeInTheDocument();
  });

  it("shows a still split with its own hint when the plate is included", () => {
    media.reduced = true;
    render(<App />);
    const box = screen.getByRole("checkbox", { name: "Include flashing plate" });
    fireEvent.click(box);
    expect(box).toHaveAccessibleDescription(/still black and white split/);
    fireEvent.click(screen.getByRole("button", { name: "Start test" }));
    for (let i = 1; i < FLASH_PLATE; i += 1) {
      press("ArrowRight");
    }
    const flash = PATTERNS[FLASH_PLATE - 1];
    expect(plateName()).toBe(flash.name);
    expect(plateHint()).toBe(flash.stillHint);
    expect(screen.queryByRole("button", { name: "Skip flashing" })).toBeNull();
  });

  it("follows a preference change until the visitor picks", () => {
    render(<App />);
    const box = screen.getByRole("checkbox", { name: "Include flashing plate" });
    expect(box).toBeChecked();
    act(() => media.setReduced(true));
    expect(box).not.toBeChecked();
    fireEvent.click(box);
    act(() => media.setReduced(false));
    act(() => media.setReduced(true));
    expect(box).toBeChecked();
  });
});

describe("intro copy", () => {
  it("describes the real swipe directions and full-screen key", () => {
    render(<App />);
    const list = screen.getByRole("list", { name: "Controls" });
    expect(within(list).getByText(/Swipe left for the next plate, right\s+for the previous one/)).toBeInTheDocument();
    expect(within(list).getByText(/toggles full\s+screen/)).toBeInTheDocument();
  });
});

describe("contact sheet", () => {
  it("shows every plate in order with its name and hint", () => {
    render(<App />);
    const frames = within(screen.getByRole("list", { name: "Plates" })).getAllByRole("listitem");
    expect(frames).toHaveLength(TOTAL);
    frames.forEach((frame, i) => {
      expect(frame).toHaveTextContent(PATTERNS[i].name);
      expect(frame).toHaveTextContent(PATTERNS[i].hint);
    });
    expect(frames[FLASH_PLATE - 1]).toHaveTextContent("Flashes every 0.7 s");
  });

  it("marks the flashing frame as left out when it is unticked", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("checkbox", { name: "Include flashing plate" }));
    const flash = document.querySelectorAll(".cell")[FLASH_PLATE - 1];
    expect(flash).toHaveClass("is-out");
    expect(flash).toHaveTextContent("Left out");
    const frame = screen.getByRole("button", { name: `Start at plate ${FLASH_PLATE}, ${N(FLASH_PLATE - 1)}` });
    expect(frame).toHaveAttribute("aria-disabled", "true");
    expect(frame).toHaveAccessibleDescription(/Left out of the test/);
    fireEvent.click(frame);
    expect(stage()).not.toBeInTheDocument();
  });

  it("shows the still hint under the flashing frame with reduced motion", () => {
    media.reduced = true;
    render(<App />);
    const flash = document.querySelectorAll(".cell")[FLASH_PLATE - 1];
    expect(flash).toHaveTextContent(PATTERNS[FLASH_PLATE - 1].stillHint);
  });
});

describe("starting from a frame", () => {
  it("starts the test at the clicked frame in full screen", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: `Start at plate 9, ${N(8)}` }));
    expect(stage()).toBeInTheDocument();
    expect(plateName()).toBe(N(8));
    expect(counter()).toBe(`9 / ${TOTAL}`);
    expect(document.documentElement.requestFullscreen).toHaveBeenCalledTimes(1);
  });

  it("lands on the same plate when the flashing plate is left out", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("checkbox", { name: "Include flashing plate" }));
    fireEvent.click(screen.getByRole("button", { name: `Start at plate 9, ${N(8)}` }));
    expect(plateName()).toBe(N(8));
    expect(counter()).toBe(`8 / ${NO_FLASH.length}`);
  });

  it("names every frame and reaches them by keyboard", () => {
    render(<App />);
    const frames = PATTERNS.map((pattern, i) =>
      screen.getByRole("button", { name: `Start at plate ${i + 1}, ${pattern.name}` }),
    );
    frames.forEach((frame) => expect(frame).not.toHaveAttribute("tabindex", "-1"));
    frames[3].focus();
    expect(frames[3]).toHaveFocus();
  });
});

describe("summary", () => {
  function runToSummary() {
    startTest();
    for (let i = 0; i < TOTAL; i += 1) {
      press("ArrowRight");
    }
  }

  function frame(i) {
    return screen.getByRole("button", { name: `Problem on plate ${i + 1}, ${N(i)}` });
  }

  function verdict() {
    return document.querySelector(".verdict").textContent;
  }

  it("is clean until a frame is marked", () => {
    runToSummary();
    expect(verdict()).toBe(`Clean: no problems marked on ${TOTAL} plates`);
    expect(frame(0)).toHaveAttribute("aria-pressed", "false");
  });

  it("lists marked frames with their problem type", () => {
    runToSummary();
    const white = PATTERNS.findIndex((pattern) => pattern.id === "white");
    const gridWhite = PATTERNS.findIndex((pattern) => pattern.id === "grid-white");
    fireEvent.click(frame(white));
    fireEvent.click(frame(gridWhite));
    expect(frame(white)).toHaveAttribute("aria-pressed", "true");
    fireEvent.change(screen.getByLabelText(`Problem type on ${N(white)}`), { target: { value: "dead" } });
    fireEvent.change(screen.getByLabelText(`Problem type on ${N(gridWhite)}`), { target: { value: "stuck" } });
    expect(verdict()).toBe(`Problems marked on 2 plates: ${N(white)} (dead pixel), ${N(gridWhite)} (stuck pixel)`);

    fireEvent.click(frame(gridWhite));
    expect(verdict()).toBe(`Problem marked on 1 plate: ${N(white)} (dead pixel)`);
  });

  it("copies a plain-text summary", async () => {
    const writeText = vi.fn(() => Promise.resolve());
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText } });
    runToSummary();
    fireEvent.click(frame(1));
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Copy summary" }));
    });
    const text = writeText.mock.calls[0][0];
    expect(text).toMatch(/^Dead pixel tester result\n/);
    expect(text).toContain(`Result: Problem marked on 1 plate: ${N(1)}`);
    expect(text).toMatch(/Screen: .*device pixels/);
    expect(text).toContain(`Plates checked (${TOTAL} of ${TOTAL})`);
    expect(screen.getByRole("status")).toHaveTextContent(/Copied/);
  });

  it("shows plates the run did not reach as not reached, after a Stop", () => {
    startTest();
    press("ArrowRight");
    press("ArrowRight");
    fireEvent.click(screen.getByRole("button", { name: "Stop" }));
    expect(screen.getByRole("heading", { name: "Did you see anything?" })).toBeInTheDocument();
    expect(frame(5)).toHaveAttribute("aria-disabled", "true");
    expect(frame(5)).toHaveAccessibleDescription(/stopped before this plate/);
    fireEvent.click(frame(5));
    expect(frame(5)).not.toHaveAttribute("aria-pressed");
    expect(verdict()).toBe(`Clean: no problems marked on the 3 plates seen (of ${TOTAL})`);
  });

  it("goes back to the start, or runs again from plate 1", () => {
    runToSummary();
    fireEvent.click(screen.getByRole("button", { name: "Run again" }));
    expect(plateName()).toBe(N(0));
    for (let i = 0; i < TOTAL; i += 1) {
      press("ArrowRight");
    }
    fireEvent.click(screen.getByRole("button", { name: "Back to start" }));
    expect(screen.getByRole("button", { name: "Start test" })).toHaveFocus();
  });
});

describe("grey plates", () => {
  it("follow black and drive the flashing plate number in the warning", () => {
    expect(PATTERNS.slice(0, 3).map((pattern) => pattern.color)).toEqual(["#000000", "#0d0d0d", "#1a1a1a"]);
    render(<App />);
    expect(screen.getByRole("checkbox", { name: "Include flashing plate" })).toHaveAccessibleDescription(
      new RegExp(`plate ${FLASH_PLATE} flips`),
    );
    expect(FLASH_PLATE).toBe(8);
  });
});
