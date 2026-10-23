/* Playback protection, layer 1 and 2 (deterrence and traceability).

   A website cannot technically block screen recording; only DRM-encrypted video
   does that (planned separately, see docs/playback-protection.md). What this
   module supports instead:
   - a faint, moving watermark carrying the viewer's account ID, so any leaked
     recording can be traced back to the account it came from;
   - tamper detection, so removing or hiding that watermark stops playback. */

/** Pull the account id (`sub`) out of the access token without verifying it; the server owns verification. */
export function accountIdFromToken(token?: string | null): string | null {
  if (!token) return null;
  const part = token.split(".")[1];
  if (!part) return null;
  try {
    const b64 = part.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(part.length / 4) * 4, "=");
    const json = typeof atob === "function" ? atob(b64) : Buffer.from(b64, "base64").toString("utf8");
    const payload = JSON.parse(json) as { sub?: unknown; id?: unknown; userId?: unknown };
    const id = payload.sub ?? payload.userId ?? payload.id;
    return id === undefined || id === null || String(id).length > 40 ? null : String(id);
  } catch {
    return null;
  }
}

const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
const two = (n: number) => String(n).padStart(2, "0");

/** "ID 40298 / P12 / 21 OCT 14:05" -- the viewer, the profile and the minute of playback. */
export function watermarkLabel(opts: { accountId?: string | null; profileId?: string | null; now?: Date }): string {
  const d = opts.now ?? new Date();
  const when = `${two(d.getDate())} ${MONTHS[d.getMonth()]} ${two(d.getHours())}:${two(d.getMinutes())}`;
  const id = opts.accountId ? `ID ${opts.accountId}` : "ID --";
  const profile = opts.profileId ? ` / P${String(opts.profileId).slice(-6)}` : "";
  return `${id}${profile} / ${when}`;
}

export interface WatermarkPosition {
  /** percent of the player width / height for the tag's top-left corner */
  left: number;
  top: number;
}

/** Keep clear of the control bar (bottom) and the title area (top), and of the edges. */
export const WATERMARK_BOUNDS = { left: [6, 62], top: [14, 70] } as const;

export function randomWatermarkPosition(rand: () => number = Math.random): WatermarkPosition {
  const [l0, l1] = WATERMARK_BOUNDS.left;
  const [t0, t1] = WATERMARK_BOUNDS.top;
  return { left: Math.round(l0 + rand() * (l1 - l0)), top: Math.round(t0 + rand() * (t1 - t0)) };
}

/** A position that is far from another one, so the faint second mark never sits on the main one. */
export function oppositePosition(p: WatermarkPosition): WatermarkPosition {
  const [l0, l1] = WATERMARK_BOUNDS.left;
  const [t0, t1] = WATERMARK_BOUNDS.top;
  return { left: l0 + l1 - p.left, top: t0 + t1 - p.top };
}

export interface WatermarkSnapshot {
  connected: boolean;
  display: string;
  visibility: string;
  opacity: number;
  width: number;
  height: number;
}

/** True when the watermark has been removed, hidden, or made effectively invisible. */
export function isTampered(snap: WatermarkSnapshot | null, expectedOpacity: number): boolean {
  if (!snap || !snap.connected) return true;
  if (snap.display === "none" || snap.visibility === "hidden") return true;
  if (snap.width < 8 || snap.height < 4) return true;
  // Allow for the fade transition and rounding, but not for opacity forced near zero.
  return expectedOpacity > 0 && snap.opacity < Math.min(0.05, expectedOpacity * 0.3);
}

/** Strikes within a time window. Three inside a minute pauses playback. */
export function tooManyStrikes(strikes: number[], now: number, windowMs = 60_000, limit = 3): boolean {
  return strikes.filter((t) => now - t <= windowMs).length >= limit;
}
