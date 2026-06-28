import { TONE_STYLES, type StatusTone } from "../lib/status";
import { cn } from "./ui/utils";

// Dot + label badge driven by the shared status tones. Status is never color
// alone — the label is always present (a11y: color-not-only).
export function StatusBadge({
  tone,
  label,
  className,
}: {
  tone: StatusTone;
  label: string;
  className?: string;
}) {
  const style = TONE_STYLES[tone];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
        style.badge,
        className
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", style.dot)} aria-hidden="true" />
      {label}
    </span>
  );
}
