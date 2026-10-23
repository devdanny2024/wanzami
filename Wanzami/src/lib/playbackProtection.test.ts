/* Run with: npm run test:protection */
import test from "node:test";
import assert from "node:assert/strict";
import {
  WATERMARK_BOUNDS,
  accountIdFromToken,
  isTampered,
  oppositePosition,
  randomWatermarkPosition,
  tooManyStrikes,
  watermarkLabel,
} from "./playbackProtection.ts";

const jwt = (payload: object) => {
  const b = (o: object) => Buffer.from(JSON.stringify(o)).toString("base64url");
  return `${b({ alg: "none" })}.${b(payload)}.sig`;
};

test("account id is read from the token's sub; junk gives null", () => {
  assert.equal(accountIdFromToken(jwt({ sub: "40298" })), "40298");
  assert.equal(accountIdFromToken(jwt({ userId: 77 })), "77");
  assert.equal(accountIdFromToken("not.a.token"), null);
  assert.equal(accountIdFromToken(null), null);
  assert.equal(accountIdFromToken(jwt({ sub: "x".repeat(80) })), null);
});

test("label carries account, profile and the minute", () => {
  const d = new Date(2026, 9, 21, 14, 5);
  assert.equal(watermarkLabel({ accountId: "40298", profileId: "12", now: d }), "ID 40298 / P12 / 21 OCT 14:05");
  assert.equal(watermarkLabel({ now: d }), "ID -- / 21 OCT 14:05");
});

test("positions stay inside the safe bounds for any random value", () => {
  for (const r of [0, 0.25, 0.5, 0.999999, 1]) {
    const p = randomWatermarkPosition(() => r);
    assert.ok(p.left >= WATERMARK_BOUNDS.left[0] && p.left <= WATERMARK_BOUNDS.left[1]);
    assert.ok(p.top >= WATERMARK_BOUNDS.top[0] && p.top <= WATERMARK_BOUNDS.top[1]);
    const o = oppositePosition(p);
    assert.ok(o.left >= WATERMARK_BOUNDS.left[0] && o.left <= WATERMARK_BOUNDS.left[1]);
    assert.ok(o.top >= WATERMARK_BOUNDS.top[0] && o.top <= WATERMARK_BOUNDS.top[1]);
  }
});

test("tamper: removed, hidden, collapsed or forced transparent all count", () => {
  const ok = { connected: true, display: "block", visibility: "visible", opacity: 0.22, width: 120, height: 14 };
  assert.equal(isTampered(ok, 0.22), false);
  assert.equal(isTampered(null, 0.22), true);
  assert.equal(isTampered({ ...ok, connected: false }, 0.22), true);
  assert.equal(isTampered({ ...ok, display: "none" }, 0.22), true);
  assert.equal(isTampered({ ...ok, visibility: "hidden" }, 0.22), true);
  assert.equal(isTampered({ ...ok, width: 0 }, 0.22), true);
  assert.equal(isTampered({ ...ok, opacity: 0 }, 0.22), true);
});

test("mid-fade is not tamper, but only while a fade is expected", () => {
  const fading = { connected: true, display: "block", visibility: "visible", opacity: 0, width: 120, height: 14 };
  assert.equal(isTampered(fading, 0), false); // expected invisible during the fade
  assert.equal(isTampered(fading, 0.22), true); // expected visible, so it is hidden
});

test("three strikes in a minute trips the limit; old strikes expire", () => {
  const now = 1_000_000;
  assert.equal(tooManyStrikes([now - 5000, now - 4000], now), false);
  assert.equal(tooManyStrikes([now - 5000, now - 4000, now - 1000], now), true);
  assert.equal(tooManyStrikes([now - 90_000, now - 80_000, now - 70_000], now), false);
});
