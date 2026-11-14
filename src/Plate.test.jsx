import { render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import Plate, { GridPlate } from "./Plate.jsx";
import { PATTERNS } from "./patterns.js";

describe("Plate", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("renders every known pattern", () => {
    for (const pattern of PATTERNS) {
      const { container, unmount } = render(<Plate pattern={pattern} />);
      expect(container.querySelector(".plate")).toBeInTheDocument();
      unmount();
    }
  });

  it("throws on an unknown kind in development", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<Plate pattern={{ id: "x", kind: "mystery" }} />)).toThrow(
      'Unknown plate kind "mystery"',
    );
  });

  it("logs and falls back to black on an unknown kind in production", () => {
    vi.stubEnv("DEV", false);
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const { container } = render(<Plate pattern={{ id: "x", kind: "mystery" }} />);
    expect(error).toHaveBeenCalledWith(expect.stringContaining('Unknown plate kind "mystery"'));
    expect(container.querySelector(".plate")).toHaveStyle({ background: "#000" });
  });
});

describe("GridPlate", () => {
  function renderGrid(dpr, size = { width: 32, height: 16 }) {
    vi.spyOn(window, "devicePixelRatio", "get").mockReturnValue(dpr);
    vi.spyOn(HTMLCanvasElement.prototype, "getBoundingClientRect").mockReturnValue({
      ...size,
      top: 0,
      left: 0,
      right: size.width,
      bottom: size.height,
    });
    const context = { setTransform: vi.fn(), fillRect: vi.fn(), fillStyle: "" };
    const fills = [];
    context.fillRect.mockImplementation((...rect) => fills.push([context.fillStyle, ...rect]));
    HTMLCanvasElement.prototype.getContext = vi.fn(() => context);
    const view = render(<GridPlate base="#000000" line="#ffffff" pitch={8} />);
    return { canvas: view.container.querySelector("canvas"), fills };
  }

  it("draws one-device-pixel lines at full intensity on a 2x screen", () => {
    const { canvas, fills } = renderGrid(2);
    expect(canvas.width).toBe(64);
    expect(canvas.height).toBe(32);
    expect(fills[0]).toEqual(["#000000", 0, 0, 64, 32]);
    const lines = fills.slice(1);
    expect(lines.every(([colour]) => colour === "#ffffff")).toBe(true);
    const vertical = lines.filter(([, , y, w]) => y === 0 && w === 1).map(([, x]) => x);
    const horizontal = lines.filter(([, x, , , h]) => x === 0 && h === 1).map(([, , y]) => y);
    expect(vertical).toEqual([0, 16, 32, 48]);
    expect(horizontal).toEqual([0, 16]);
  });

  it("keeps lines one pixel wide on a 1x screen", () => {
    const { canvas, fills } = renderGrid(1);
    expect(canvas.width).toBe(32);
    const vertical = fills.slice(1).filter(([, , y, w]) => y === 0 && w === 1).map(([, x]) => x);
    expect(vertical).toEqual([0, 8, 16, 24]);
  });

  it("re-arms a resolution query for the current ratio", () => {
    const queries = [];
    const original = window.matchMedia;
    window.matchMedia = (query) => {
      queries.push(query);
      return original(query);
    };
    renderGrid(2);
    expect(queries).toContain("(resolution: 2dppx)");
  });
});

describe("GridPlate device-pixel box", () => {
  it("falls back to CSS size times ratio when the device box reports CSS pixels", () => {
    let callback;
    vi.stubGlobal(
      "ResizeObserver",
      class {
        constructor(cb) {
          callback = cb;
        }
        observe() {}
        disconnect() {}
      },
    );
    vi.spyOn(window, "requestAnimationFrame").mockImplementation((cb) => {
      cb();
      // Drawn already, so report no pending frame.
      return 0;
    });
    vi.spyOn(window, "devicePixelRatio", "get").mockReturnValue(2);
    vi.spyOn(HTMLCanvasElement.prototype, "getBoundingClientRect").mockReturnValue({ width: 32, height: 16 });
    const { container } = render(<GridPlate base="#000" line="#fff" />);
    const canvas = container.querySelector("canvas");

    // An emulated screen reports CSS pixels in the device box: ignore it.
    callback([{ devicePixelContentBoxSize: [{ inlineSize: 32, blockSize: 16 }] }]);
    expect(canvas.width).toBe(64);
    // A real one reports snapped device pixels: use them.
    callback([{ devicePixelContentBoxSize: [{ inlineSize: 65, blockSize: 33 }] }]);
    expect(canvas.width).toBe(65);
    expect(canvas.height).toBe(33);
    vi.unstubAllGlobals();
  });
});
