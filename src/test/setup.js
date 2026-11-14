import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, beforeEach, vi } from "vitest";

// jsdom has no matchMedia. Tests flip `media.reduced` before rendering, or
// call `media.setReduced()` to fire a change event while mounted.
const listeners = new Set();
export const media = {
  reduced: false,
  setReduced(value) {
    this.reduced = value;
    listeners.forEach((listener) => listener());
  },
};

function matchMedia(query) {
  const list = {
    media: query,
    get matches() {
      return query.includes("prefers-reduced-motion") ? media.reduced : false;
    },
    addEventListener: (_type, listener) => {
      if (query.includes("prefers-reduced-motion")) {
        listeners.add(listener);
      }
    },
    removeEventListener: (_type, listener) => listeners.delete(listener),
  };
  return list;
}

// Minimal full-screen API: request sets the element and fires the event.
function installFullscreen() {
  let element = null;
  Object.defineProperty(document, "fullscreenEnabled", { configurable: true, value: true });
  Object.defineProperty(document, "fullscreenElement", { configurable: true, get: () => element });
  document.documentElement.requestFullscreen = vi.fn(function request() {
    element = this;
    document.dispatchEvent(new Event("fullscreenchange"));
    return Promise.resolve();
  });
  document.exitFullscreen = vi.fn(() => {
    element = null;
    document.dispatchEvent(new Event("fullscreenchange"));
    return Promise.resolve();
  });
}

beforeEach(() => {
  media.reduced = false;
  listeners.clear();
  window.matchMedia = matchMedia;
  installFullscreen();
  // jsdom does not implement canvas; give the grid a context that records calls.
  HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
    setTransform: vi.fn(),
    fillRect: vi.fn(),
    fillStyle: "",
  }));
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});
