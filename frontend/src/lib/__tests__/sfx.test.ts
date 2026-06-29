import assert from "node:assert/strict";
import test, { beforeEach, afterEach } from "node:test";
import { isSfxMuted, setSfxMuted, SFX_KEY } from "../sfx";

// Mock window + localStorage cho node:test (sfx.ts guard `typeof window`).
const store = new Map<string, string>();
const localStorageMock = {
  getItem: (k: string) => store.get(k) ?? null,
  setItem: (k: string, v: string) => store.set(k, v),
  removeItem: (k: string) => store.delete(k),
};
const windowMock = { localStorage: localStorageMock };
(globalThis as unknown as { window: typeof windowMock }).window = windowMock;

beforeEach(() => store.clear());
afterEach(() => store.clear());

test("isSfxMuted: default false khi localStorage trống", () => {
  assert.equal(isSfxMuted(), false);
});

test("setSfxMuted(true) → isSfxMuted true + lưu localStorage", () => {
  setSfxMuted(true);
  assert.equal(isSfxMuted(), true);
  assert.equal(store.get(SFX_KEY), "1");
});

test("setSfxMuted(false) → isSfxMuted false + localStorage '0'", () => {
  setSfxMuted(true); // set true trước
  setSfxMuted(false);
  assert.equal(isSfxMuted(), false);
  assert.equal(store.get(SFX_KEY), "0");
});
