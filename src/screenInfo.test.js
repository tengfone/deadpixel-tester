import { describe, expect, it } from "vitest";
import { describeScreen, estimateRefresh } from "./screenInfo.js";
import { summaryText, verdictLine } from "./Summary.jsx";
import { PATTERNS } from "./patterns.js";

const frames = (ms, count = 60) => Array.from({ length: count }, () => ms);

describe("estimateRefresh", () => {
  it("snaps to common rates", () => {
    expect(estimateRefresh(frames(16.7))).toBe(60);
    expect(estimateRefresh(frames(6.94, 144))).toBe(144);
    expect(estimateRefresh(frames(8.33, 120))).toBe(120);
  });

  it("ignores the odd long frame and needs enough frames", () => {
    expect(estimateRefresh([...frames(16.67), 250, 90, 50])).toBe(60);
    expect(estimateRefresh(frames(16.7, 5))).toBeNull();
  });

  it("rounds a rate that is not a common one", () => {
    expect(estimateRefresh(frames(1000 / 133))).toBe(133);
  });
});

describe("describeScreen", () => {
  const retina = { width: 1440, height: 900, ratio: 2, deviceWidth: 2880, deviceHeight: 1800 };
  it("multiplies the CSS size by the pixel ratio", () => {
    expect(describeScreen(retina, null)).toBe("1440 × 900 at 2× = 2880 × 1800 device pixels");
    expect(describeScreen(retina, 60)).toBe("1440 × 900 at 2× = 2880 × 1800 device pixels, about 60 Hz");
  });

  it("keeps it short at 1×", () => {
    expect(describeScreen({ width: 1920, height: 1080, ratio: 1, deviceWidth: 1920, deviceHeight: 1080 }, 144)).toBe(
      "1920 × 1080 device pixels, about 144 Hz",
    );
  });
});

describe("summary text", () => {
  const seen = new Set(PATTERNS.map((pattern) => pattern.id));
  it("says clean with the plate count", () => {
    expect(verdictLine(PATTERNS, seen, new Map())).toBe(`Clean: no problems marked on ${PATTERNS.length} plates`);
  });

  it("lists marked plates, with the type when given", () => {
    const marks = new Map([["white", "dead"], ["grid-white", ""]]);
    expect(verdictLine(PATTERNS, seen, marks)).toBe("Problems marked on 2 plates: White (dead pixel), Grid on white");
  });

  it("writes a paste-ready block", () => {
    const text = summaryText({
      plates: PATTERNS,
      seen,
      marks: new Map([["grey-10", "bleed"]]),
      date: "15 November 2026",
      screen: { width: 1920, height: 1080, ratio: 1, deviceWidth: 1920, deviceHeight: 1080 },
      hz: 60,
      url: "https://example.test/",
    });
    expect(text.split("\n")).toEqual([
      "Dead pixel tester result",
      "Date: 15 November 2026",
      "Screen: 1920 × 1080 device pixels, about 60 Hz",
      "Result: Problem marked on 1 plate: Dark grey 10% (banding or bleed)",
      `Plates checked (${PATTERNS.length} of ${PATTERNS.length}): ${PATTERNS.map((pattern) => pattern.name).join(", ")}`,
      "Tested with https://example.test/",
    ]);
  });
});
