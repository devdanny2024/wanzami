const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE ??
  process.env.AUTH_SERVICE_URL ??
  "https://wanzami-backend-alb-1018329891.us-east-2.elb.amazonaws.com/api";

export type Title = {
  id: string;
  name: string;
  type: "MOVIE" | "SERIES";
  isPpv?: boolean;
  ppvPriceNaira?: number | null;
  ppvCurrency?: string | null;
  ppvDescription?: string | null;
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
  previewSpriteUrl?: string | null;
  previewVttUrl?: string | null;
  enableEndCardRating?: boolean;
  endCreditsStart?: number;
  releaseYear?: number;
  archived?: boolean;
  episodeCount?: number;
  createdAt?: string;
  updatedAt?: string;
  assetVersions?: {
    rendition: "R4K" | "R2K" | "R1080" | "R720" | "R360" | string;
    url?: string | null;
    sizeBytes?: number;
    durationSec?: number;
    status?: string;
  }[];
};

export type PpvAccess = {
  isPpv: boolean;
  hasAccess: boolean;
  priceNaira?: number | null;
  currency?: string | null;
  userPpvBanned?: boolean;
  ppvStrikeCount?: number;
  accessExpiresAt?: string | null;
};

// Give home-page catalog/recs enough time to return, especially right
// after login when cold caches or slow networks can add latency.
const DEFAULT_TIMEOUT = 30000;

async function handleJsonResponse(res: Response) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = (data as any)?.message ?? "Request failed";
    throw new Error(message);
  }
  return data as any;
}

async function fetchWithTimeout(input: RequestInfo | URL, init?: RequestInit, timeoutMs = DEFAULT_TIMEOUT) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(input, { ...init, signal: controller.signal });
    return res;
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchTitles(country?: string): Promise<Title[]> {
  const query = country ? `?country=${encodeURIComponent(country)}` : "";
  const res = await fetchWithTimeout(`${API_BASE}/titles${query}`, {
    cache: "no-store",
  });
  const data = await handleJsonResponse(res);
  return (data?.titles as Title[]) ?? [];
}

export async function fetchTitleWithEpisodes(id: string, country?: string) {
  const query = country ? `?country=${encodeURIComponent(country)}` : "";
  const res = await fetchWithTimeout(`${API_BASE}/titles/${id}${query}`, {
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
      previewSpriteUrl?: string | null;
      previewVttUrl?: string | null;
      enableEndCardRating?: boolean;
      endCreditsStart?: number;
      assetVersions?: {
        rendition: "R4K" | "R2K" | "R1080" | "R720" | "R360" | string;
        url?: string | null;
        sizeBytes?: number;
        durationSec?: number;
        status?: string;
      }[];
    }>;
    seasons?: Array<{
      id: string;
      titleId: string;
      seasonNumber: number;
      name?: string | null;
      description?: string | null;
      releaseDate?: string | null;
      status?: string | null;
      posterUrl?: string | null;
      thumbnailUrl?: string | null;
      previewSpriteUrl?: string | null;
      previewVttUrl?: string | null;
      createdAt?: string;
      updatedAt?: string;
    }>;
  };
}

export async function fetchPpvAccess(params: {
  titleId: string;
  accessToken?: string | null;
  profileId?: string | null;
  country?: string | null;
}): Promise<PpvAccess> {
  const query = new URLSearchParams();
  if (params.profileId) query.set("profileId", params.profileId);
  if (params.country) query.set("country", params.country);
  query.set("record", "false");
  const res = await fetchWithTimeout(`${API_BASE}/ppv/access/${params.titleId}?${query.toString()}`, {
    cache: "no-store",
    headers: params.accessToken
      ? {
          Authorization: `Bearer ${params.accessToken}`,
        }
      : undefined,
  });
  const data = await handleJsonResponse(res);
  return data as PpvAccess;
}

export async function initiatePpvPurchase(params: {
  titleId: string;
  accessToken: string;
  profileId?: string | null;
}): Promise<{ authorizationUrl?: string; reference?: string }> {
  const res = await fetchWithTimeout(`${API_BASE}/ppv/initiate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${params.accessToken}`,
    },
    body: JSON.stringify({
      titleId: params.titleId,
      profileId: params.profileId ?? undefined,
    }),
  });
  const data = await handleJsonResponse(res);
  return data as { authorizationUrl?: string; reference?: string };
}

export async function fetchMyPpvTitles(params: {
  accessToken: string;
  profileId?: string | null;
}): Promise<{
  activePurchases: Array<{
    title: Title;
    accessExpiresAt?: string | null;
    status?: string;
  }>;
  expiredPurchases?: Array<{
    title: Title;
    accessExpiresAt?: string | null;
    status?: string;
  }>;
}> {
  const query = new URLSearchParams();
  if (params.profileId) query.set("profileId", params.profileId);
  const res = await fetchWithTimeout(`${API_BASE}/ppv/my-titles?${query.toString()}`, {
    cache: "no-store",
    headers: {
      Authorization: `Bearer ${params.accessToken}`,
    },
  });
  const data = await handleJsonResponse(res);
  return {
    activePurchases: data?.activePurchases ?? [],
    expiredPurchases: data?.expiredPurchases ?? [],
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
  const res = await fetchWithTimeout(`${API_BASE}/popularity?${query.toString()}`, {
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
  const res = await fetchWithTimeout(`${API_BASE}/recs/continue-watching?${query.toString()}`, {
    cache: "no-store",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  const data = await handleJsonResponse(res);
  return data as { items: Array<any> };
}

export async function fetchBecauseYouWatched(
  accessToken: string,
  profileId?: string,
  opts?: { seed?: string; limit?: number }
) {
  const query = new URLSearchParams();
  if (profileId) query.set("profileId", profileId);
  if (opts?.seed) query.set("seed", opts.seed);
  if (opts?.limit) query.set("limit", String(opts.limit));
  const res = await fetchWithTimeout(`${API_BASE}/recs/because-you-watched?${query.toString()}`, {
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
  const res = await fetchWithTimeout(`${API_BASE}/recs/for-you?${query.toString()}`, {
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
  const res = await fetchWithTimeout(`${API_BASE}/events`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ events }),
  });
  await handleJsonResponse(res);
}
