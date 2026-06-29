import assert from "node:assert/strict";
import test from "node:test";
import { buildAuthHref, getSafeCallbackPath } from "../auth-redirect";

test("getSafeCallbackPath keeps local application paths", () => {
  assert.equal(getSafeCallbackPath("/practice"), "/practice");
  assert.equal(getSafeCallbackPath("/exercises/123"), "/exercises/123");
});

test("getSafeCallbackPath rejects empty, external, and auth-loop paths", () => {
  assert.equal(getSafeCallbackPath(null), "/dashboard");
  assert.equal(getSafeCallbackPath(""), "/dashboard");
  assert.equal(getSafeCallbackPath("https://example.com"), "/dashboard");
  assert.equal(getSafeCallbackPath("//example.com"), "/dashboard");
  assert.equal(getSafeCallbackPath("/login?callbackUrl=/practice"), "/dashboard");
  assert.equal(getSafeCallbackPath("/register"), "/dashboard");
});

test("buildAuthHref preserves callback only when it is not the default dashboard", () => {
  assert.equal(buildAuthHref("/register", "/dashboard"), "/register");
  assert.equal(buildAuthHref("/login", "/practice"), "/login?callbackUrl=%2Fpractice");
});
