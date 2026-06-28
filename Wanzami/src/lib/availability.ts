// Derives the "Coming Soon" / "Leaving Soon" badge shown on cards and posters.
// Kept framework-free so both MovieCard and the landing poster tiles can share it.

export type Availability = "LIVE" | "COMING_SOON" | "LEAVING_SOON";

export type AvailabilityBadge = {
  kind: "COMING_SOON" | "LEAVING_SOON";
  label: string;
};

type AvailabilityInput = {
  availability?: Availability | null;
  availableFrom?: string | null;
  leavingAt?: string | null;
};

function formatShortDate(value?: string | null): string | null {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function getAvailabilityBadge(item: AvailabilityInput): AvailabilityBadge | null {
  if (item.availability === "COMING_SOON") {
    const date = formatShortDate(item.availableFrom);
    return { kind: "COMING_SOON", label: date ? `Coming ${date}` : "Coming Soon" };
  }
  if (item.availability === "LEAVING_SOON") {
    const date = formatShortDate(item.leavingAt);
    return { kind: "LEAVING_SOON", label: date ? `Leaving ${date}` : "Leaving Soon" };
  }
  return null;
}

// Coming Soon titles are not watchable yet (trailers still allowed).
export function isComingSoon(item: AvailabilityInput): boolean {
  return item.availability === "COMING_SOON";
}
