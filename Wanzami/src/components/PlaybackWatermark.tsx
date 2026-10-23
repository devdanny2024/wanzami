'use client';

import { useEffect, useRef } from "react";
import {
  isTampered,
  oppositePosition,
  randomWatermarkPosition,
  tooManyStrikes,
  watermarkLabel,
} from "@/lib/playbackProtection";

/* Traceable watermark for full playback. A faint tag with the viewer's account ID
   drifts across the picture, with a fainter second tag opposite it. It does not
   stop recording; it makes any leak traceable. If it is removed or hidden it is
   put back, and repeated attempts pause playback (onTamper).

   The tags are built with plain DOM calls inside one React-owned host element,
   never as React children. That way, if a browser extension or a person deletes a
   tag, React is never asked to reconcile a node it no longer owns (which would
   crash the page). Inline styles and neutral attributes only, so ad blockers and
   cosmetic filters do not hide it by accident. */

const MAIN_OPACITY = 0.24;
const FAINT_OPACITY = 0.08;
const MOVE_EVERY_MS = 35_000;
const FADE_MS = 1_000;
const CHECK_EVERY_MS = 1_500;

const BASE_STYLE: Partial<CSSStyleDeclaration> = {
  position: "absolute",
  zIndex: "8",
  pointerEvents: "none",
  userSelect: "none",
  whiteSpace: "nowrap",
  color: "#ffffff",
  fontFamily: "var(--font-space-mono), ui-monospace, monospace",
  fontWeight: "700",
  letterSpacing: "0.08em",
  fontSize: "clamp(10px, 1.05vw, 15px)",
  textShadow: "0 0 3px rgba(0,0,0,0.75)",
  transition: `opacity ${FADE_MS}ms ease`,
  display: "block",
  visibility: "visible",
};

const HOST_STYLE: Partial<CSSStyleDeclaration> = {
  position: "absolute",
  top: "0",
  right: "0",
  bottom: "0",
  left: "0",
  zIndex: "8",
  pointerEvents: "none",
  display: "block",
  visibility: "visible",
  opacity: "1",
};

export function PlaybackWatermark({
  accountId,
  profileId,
  onTamper,
}: {
  accountId?: string | null;
  profileId?: string | null;
  onTamper: () => void;
}) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const onTamperRef = useRef(onTamper);
  onTamperRef.current = onTamper;

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const parent = host.parentElement;

    let pos = randomWatermarkPosition();
    let shown = true;
    let fading = false;
    let strikes: number[] = [];
    const timers: number[] = [];

    const make = (kind: string) => {
      const el = document.createElement("div");
      el.setAttribute("data-pb", kind);
      el.setAttribute("aria-hidden", "true");
      return el;
    };
    const main = make("a");
    const faint = make("b");

    const styleHost = () => Object.assign(host.style, HOST_STYLE);
    const paint = () => {
      const label = watermarkLabel({ accountId, profileId });
      const opp = oppositePosition(pos);
      for (const [el, p, o] of [
        [main, pos, MAIN_OPACITY],
        [faint, opp, FAINT_OPACITY],
      ] as const) {
        Object.assign(el.style, BASE_STYLE);
        el.style.left = `${p.left}%`;
        el.style.top = `${p.top}%`;
        el.style.opacity = shown ? String(o) : "0";
        if (el.textContent !== label) el.textContent = label;
      }
    };

    styleHost();
    host.append(main, faint);
    paint();

    const strike = () => {
      const now = Date.now();
      strikes = [...strikes.filter((t) => now - t < 120_000), now];
      if (tooManyStrikes(strikes, now)) onTamperRef.current();
    };

    // put back whatever was removed or restyled; returns true if anything had to be fixed
    const guard = (): boolean => {
      let fixed = false;
      if (!host.isConnected && parent && parent.isConnected) {
        parent.appendChild(host);
        fixed = true;
      }
      for (const el of [main, faint]) {
        if (el.parentElement !== host) {
          host.appendChild(el);
          fixed = true;
        }
      }
      const snap = (el: HTMLElement, expected: number) => {
        const cs = window.getComputedStyle(el);
        const r = el.getBoundingClientRect();
        return isTampered(
          {
            connected: el.isConnected,
            display: cs.display,
            visibility: cs.visibility,
            opacity: parseFloat(cs.opacity),
            width: r.width,
            height: r.height,
          },
          expected,
        );
      };
      if (!fading && (snap(host, 1) || snap(main, MAIN_OPACITY))) fixed = true;
      if (fixed) {
        styleHost();
        paint();
      }
      return fixed;
    };

    const check = window.setInterval(() => {
      if (guard()) strike();
    }, CHECK_EVERY_MS);
    timers.push(check);

    // keep the minute current
    timers.push(window.setInterval(paint, 20_000));

    // drift: fade out, move, fade in
    timers.push(
      window.setInterval(() => {
        fading = true;
        shown = false;
        paint();
        timers.push(
          window.setTimeout(() => {
            pos = randomWatermarkPosition();
            shown = true;
            paint();
            timers.push(window.setTimeout(() => (fading = false), FADE_MS));
          }, FADE_MS),
        );
      }, MOVE_EVERY_MS),
    );

    // react at once to deletion
    const observers: MutationObserver[] = [];
    const watch = (target: Node | null) => {
      if (!target) return;
      const o = new MutationObserver(() => {
        // cheap structural check only; the full style check runs on the timer
        const intact = host.isConnected && main.parentElement === host && faint.parentElement === host;
        if (!intact && guard()) strike();
      });
      o.observe(target, { childList: true });
      observers.push(o);
    };
    watch(host);
    watch(parent);

    return () => {
      timers.forEach((t) => {
        window.clearInterval(t);
        window.clearTimeout(t);
      });
      observers.forEach((o) => o.disconnect());
      main.remove();
      faint.remove();
    };
  }, [accountId, profileId]);

  return <div ref={hostRef} data-pb="host" aria-hidden="true" style={HOST_STYLE as React.CSSProperties} />;
}
