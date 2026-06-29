import assert from "node:assert/strict";
import test, { beforeEach, afterEach } from "node:test";
import { prefersReducedMotion } from "../confetti";

// Mock window.matchMedia cho node:test (confetti.ts guard `typeof window`).
let reduceMatches = false;
const matchMediaMock = (query: string): MediaQueryList => ({
  matches: query.includes("prefers-reduced-motion") ? reduceMatches : false,
  media: query,
  onchange: null,
  addListener: () => {},
  removeListener: () => {},
  addEventListener: () => {},
  removeEventListener: () => {},
  dispatchEvent: () => false,
});
const windowMock = { matchMedia: matchMediaMock };
(globalThis as unknown as { window: typeof windowMock }).window = windowMock;

beforeEach(() => {
  reduceMatches = false;
});
afterEach(() => {
  reduceMatches = false;
});

test("prefersReducedMotion: false khi matchMedia không match reduce", () => {
  reduceMatches = false;
  assert.equal(prefersReducedMotion(), false);
});

test("prefersReducedMotion: true khi matchMedia matches reduce", () => {
  reduceMatches = true;
  assert.equal(prefersReducedMotion(), true);
});
