const API_BASE = process.env.AUTH_SERVICE_URL ?? "https://wanzami.duckdns.org/api";

export type Title = {
  id: string;
  name: string;
  type: "MOVIE" | "SERIES";
  description?: string | null;
  genres?: string[];
  cast?: string[];
  crew?: string[];
  language?: string | null;
  maturityRating?: string | null;
  runtimeMinutes?: number | null;
  countryAvailability?: string[];
  isOriginal?: boolean;
  posterUrl?: string | null;
  thumbnailUrl?: string | null;
  trailerUrl?: string | null;
  releaseYear?: number;
  archived?: boolean;
  episodeCount?: number;
  createdAt?: string;
  updatedAt?: string;
};

async function handleJsonResponse(res: Response) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = (data as any)?.message ?? "Request failed";
    throw new Error(message);
  }
  return data as any;
}

export async function fetchTitles(): Promise<Title[]> {
  const res = await fetch(`${API_BASE}/titles`, {
    cache: "no-store",
  });
  const data = await handleJsonResponse(res);
  return (data?.titles as Title[]) ?? [];
}

export async function fetchTitleWithEpisodes(id: string) {
  const res = await fetch(`${API_BASE}/titles/${id}`, {
    cache: "no-store",
  });
  const data = await handleJsonResponse(res);
  return data?.title as Title & {
    episodes?: Array<{
      id: string;
      seasonNumber: number;
      episodeNumber: number;
      name: string;
      synopsis?: string | null;
      runtimeMinutes?: number | null;
    }>;
  };
}

export async function fetchPopularity(params: {
  country?: string;
  type?: "MOVIE" | "SERIES";
  window?: "DAILY" | "TRENDING";
}) {
  const query = new URLSearchParams();
  if (params.country) query.set("country", params.country);
  if (params.type) query.set("type", params.type);
  if (params.window) query.set("window", params.window);
  const res = await fetch(`${API_BASE}/popularity?${query.toString()}`, {
    cache: "no-store",
  });
  const data = await handleJsonResponse(res);
  return data as {
    country: string;
    type: string;
    window: string;
    items: Array<{ titleId: string; count?: number }>;
    computedAt: string | null;
  };
}

export async function fetchContinueWatching(accessToken: string, profileId?: string) {
  const query = new URLSearchParams();
  if (profileId) query.set("profileId", profileId);
  const res = await fetch(`${API_BASE}/recs/continue-watching?${query.toString()}`, {
    cache: "no-store",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  const data = await handleJsonResponse(res);
  return data as { items: Array<any> };
}

export async function fetchBecauseYouWatched(accessToken: string, profileId?: string) {
  const query = new URLSearchParams();
  if (profileId) query.set("profileId", profileId);
  const res = await fetch(`${API_BASE}/recs/because-you-watched?${query.toString()}`, {
    cache: "no-store",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  const data = await handleJsonResponse(res);
  return data as { items: Array<any>; anchors: string[] };
}

export async function fetchForYou(accessToken: string, profileId?: string) {
  const query = new URLSearchParams();
  if (profileId) query.set("profileId", profileId);
  const res = await fetch(`${API_BASE}/recs/for-you?${query.toString()}`, {
    cache: "no-store",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  const data = await handleJsonResponse(res);
  return data as { items: Array<any>; anchors: string[] };
}

export type EngagementEventInput = {
  eventType:
    | "PLAY_START"
    | "PLAY_END"
    | "SCRUB"
    | "SKIP"
    | "SEARCH"
    | "ADD_TO_LIST"
    | "THUMBS_UP"
    | "THUMBS_DOWN"
    | "IMPRESSION";
  profileId?: string | number;
  titleId?: string | number;
  episodeId?: string | number;
  sessionId?: string | number;
  occurredAt?: string;
  country?: string;
  deviceId?: string;
  metadata?: Record<string, any>;
};

export async function postEvents(events: EngagementEventInput[], accessToken: string) {
  if (!events.length) return;
  const res = await fetch(`${API_BASE}/events`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ events }),
  });
  await handleJsonResponse(res);
}
