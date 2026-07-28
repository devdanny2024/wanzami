"use client";

import type { CSSProperties, ReactNode } from "react";
import { AlertTriangle, Check, Info, X } from "lucide-react";
import { Toaster as SonnerToaster } from "sonner";

/* Call Sheet toasts — the canonical toaster for the admin.
   Every variant carries a stamp: an icon plus an uppercase word. Colour only
   reinforces what the stamp already says, so success, error, warning and info
   stay apart for anyone who cannot separate them by hue.
   All visual rules live in the "Toasts" section of app/globals.css. */

function Stamp({
  icon,
  label,
  background,
  color,
}: {
  icon: ReactNode;
  label: string;
  background: string;
  color: string;
}) {
  return (
    <span className="cs-toast-stamp" style={{ background, color }}>
      {icon}
      {label}
    </span>
  );
}

const glyph = { size: 11, strokeWidth: 3, "aria-hidden": true } as const;

const csIcons = {
  success: (
    <Stamp
      icon={<Check {...glyph} />}
      label="Done"
      background="var(--cs-brand)"
      color="var(--cs-ink)"
    />
  ),
  error: (
    <Stamp
      icon={<X {...glyph} />}
      label="Failed"
      background="var(--cs-rust)"
      color="#ffffff"
    />
  ),
  warning: (
    <Stamp
      icon={<AlertTriangle {...glyph} />}
      label="Caution"
      background="var(--cs-ink)"
      color="#ffffff"
    />
  ),
  info: (
    <Stamp
      icon={<Info {...glyph} />}
      label="Note"
      background="var(--cs-paper)"
      color="var(--cs-ink)"
    />
  ),
};

/* Sonner reads these three variables for anything the stylesheet below does
   not claim outright, so the fallbacks land on Call Sheet paper and ink. */
const toasterStyle = {
  "--width": "384px",
  "--normal-bg": "var(--cs-paper)",
  "--normal-text": "var(--cs-ink)",
  "--normal-border": "var(--cs-ink)",
} as CSSProperties;

export function Toaster(props: React.ComponentProps<typeof SonnerToaster>) {
  return (
    <SonnerToaster
      theme="light"
      className="cs-toaster"
      style={toasterStyle}
      icons={csIcons}
      toastOptions={{
        classNames: {
          toast: "cs-toast",
          title: "cs-toast-title",
          description: "cs-toast-description",
        },
      }}
      {...props}
    />
  );
}
