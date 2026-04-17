const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE ??
  process.env.AUTH_SERVICE_URL ??
  "https://wanzami-backend-alb-1018329891.us-east-2.elb.amazonaws.com/api";

const IMAGE_CDN_BASE = (process.env.NEXT_PUBLIC_IMAGE_CDN_BASE_URL ?? "").trim();
const IMAGE_ORIGIN_BASE = (process.env.NEXT_PUBLIC_IMAGE_ORIGIN_BASE_URL ?? "").trim();
const IMAGE_CACHE_VERSION = (process.env.NEXT_PUBLIC_IMAGE_CACHE_VERSION ?? "").trim();

export function resolveCdnImageUrl(rawUrl?: string | null) {
  const input = (rawUrl ?? "").trim();
  if (!input || input.startsWith("data:")) return input;

  const cdnBase = IMAGE_CDN_BASE.replace(/\/+$/, "");
  let resolved = input;

  if (cdnBase) {
    if (IMAGE_ORIGIN_BASE && input.startsWith(IMAGE_ORIGIN_BASE)) {
      resolved = `${cdnBase}${input.slice(IMAGE_ORIGIN_BASE.length)}`;
    } else if (input.startsWith("/")) {
      resolved = `${cdnBase}${input}`;
    } else if (!input.includes("://")) {
      resolved = `${cdnBase}/${input}`;
    }
  }

  if (!IMAGE_CACHE_VERSION) return resolved;

  try {
    const url = new URL(resolved);
    if (!url.searchParams.has("v")) {
      url.searchParams.set("v", IMAGE_CACHE_VERSION);
    }
    return url.toString();
  } catch {
    return resolved;
  }
}

export type Title = {
  id: string;
  name: string;
  type: "MOVIE" | "SERIES";
  isPpv?: boolean;
  ppvStreamAllowed?: boolean;
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
  shortTrailerUrl?: string | null;
  previewSpriteUrl?: string | null;
  previewVttUrl?: string | null;
  enableEndCardRating?: boolean;
  endCreditsStart?: number;
  releaseDate?: string | null;
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

function normalizeTitleImages<T extends Title>(title: T): T {
  return {
    ...title,
    posterUrl: resolveCdnImageUrl(title.posterUrl),
    thumbnailUrl: resolveCdnImageUrl(title.thumbnailUrl),
    previewSpriteUrl: resolveCdnImageUrl(title.previewSpriteUrl),
    previewVttUrl: resolveCdnImageUrl(title.previewVttUrl),
    episodes: (title as any).episodes?.map((ep: any) => ({
      ...ep,
      posterUrl: resolveCdnImageUrl(ep.posterUrl),
      thumbnailUrl: resolveCdnImageUrl(ep.thumbnailUrl),
      previewSpriteUrl: resolveCdnImageUrl(ep.previewSpriteUrl),
      previewVttUrl: resolveCdnImageUrl(ep.previewVttUrl),
    })),
    seasons: (title as any).seasons?.map((s: any) => ({
      ...s,
      posterUrl: resolveCdnImageUrl(s.posterUrl),
      thumbnailUrl: resolveCdnImageUrl(s.thumbnailUrl),
      previewSpriteUrl: resolveCdnImageUrl(s.previewSpriteUrl),
      previewVttUrl: resolveCdnImageUrl(s.previewVttUrl),
    })),
  } as T;
}

function normalizeLiveEventImages<T extends LiveEvent>(event: T): T {
  return {
    ...event,
    thumbnailUrl: resolveCdnImageUrl(event.thumbnailUrl),
  };
}

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
  return ((data?.titles as Title[]) ?? []).map((title) => normalizeTitleImages(title));
}

export async function fetchTitleWithEpisodes(
  id: string,
  opts?: { country?: string; accessToken?: string | null; profileId?: string | null }
) {
  const params = new URLSearchParams();
  if (opts?.country) params.set("country", opts.country);
  if (opts?.profileId) params.set("profileId", opts.profileId);
  const query = params.toString() ? `?${params.toString()}` : "";

  const headers: Record<string, string> = {};
  if (opts?.accessToken) headers.Authorization = `Bearer ${opts.accessToken}`;

  const res = await fetchWithTimeout(`${API_BASE}/titles/${id}${query}`, {
    cache: "no-store",
    headers: Object.keys(headers).length ? headers : undefined,
  });
  const data = await handleJsonResponse(res);
  return normalizeTitleImages(data?.title as Title & {
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
  });
}

export async function fetchPpvAccess(params: {
  titleId: string;
  accessToken?: string | null;
  profileId?: string | null;
  country?: string | null;
}): Promise<PpvAccess> {
  const query = new URLSearchParams();
  if (params.profileId) query.set("profileId", params.profileId);
  const fallbackCountry =
    typeof window !== "undefined" ? window.localStorage.getItem("countryCode") : null;
  const country = params.country ?? fallbackCountry ?? null;
  if (country) query.set("country", country);
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
}): Promise<{
  flow?: string;
  publicKey?: string;
  txRef?: string;
  amount?: number;
  currency?: string;
  customer?: { email?: string; name?: string };
  title?: { id?: number; name?: string };
  redirectUrl?: string;
}> {
  const res = await fetchWithTimeout(`${API_BASE}/ppv/initiate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${params.accessToken}`,
    },
    body: JSON.stringify({
      titleId: params.titleId,
      profileId: params.profileId ?? undefined,
      country:
        typeof window !== "undefined"
          ? window.localStorage.getItem("countryCode") ?? undefined
          : undefined,
    }),
  });
  const data = await handleJsonResponse(res);
  return data as any;
}

export async function verifyFlutterwavePurchase(params: {
  accessToken: string;
  transactionId?: string | number;
  txRef?: string;
}) {
  const res = await fetchWithTimeout(`${API_BASE}/ppv/flutterwave/verify`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${params.accessToken}`,
    },
    body: JSON.stringify({
      transactionId: params.transactionId,
      txRef: params.txRef,
    }),
  });
  return (await handleJsonResponse(res)) as any;
}

export async function initiatePaystackPurchase(params: {
  titleId: string;
  accessToken: string;
  profileId?: string | null;
}) {
  const res = await fetchWithTimeout(`${API_BASE}/ppv/paystack/initiate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${params.accessToken}`,
    },
    body: JSON.stringify({
      titleId: params.titleId,
      profileId: params.profileId ?? undefined,
      country:
        typeof window !== "undefined"
          ? window.localStorage.getItem("countryCode") ?? undefined
          : undefined,
    }),
  });
  return (await handleJsonResponse(res)) as any;
}

export async function verifyPaystackPurchase(params: {
  accessToken: string;
  reference: string;
}) {
  const res = await fetchWithTimeout(`${API_BASE}/ppv/paystack/verify`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${params.accessToken}`,
    },
    body: JSON.stringify({ reference: params.reference }),
  });
  return (await handleJsonResponse(res)) as any;
}

export async function initiatePpvV4General(params: {
  titleId: string;
  accessToken: string;
  method: "card" | "bank_transfer" | "ussd" | "opay" | "googlepay" | "applepay";
  card?: { number: string; cvv: string; expiryMonth: string; expiryYear: string; pin?: string };
  customer?: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    country?: string;
    address?: {
      line1?: string;
      city?: string;
      state?: string;
      postalCode?: string;
      country?: string;
    };
  };
  bankTransfer?: Record<string, any>;
  ussd?: { bankCode?: string; phoneNumber?: string };
  opay?: { phoneNumber?: string };
  googlepay?: { cardHolderName?: string };
  applepay?: { cardHolderName?: string };
}): Promise<{
  reference?: string;
  chargeId?: string;
  status?: string;
  nextAction?: any;
  paymentInstruction?: any;
  customerId?: string;
  paymentMethodId?: string;
}> {
  const res = await fetchWithTimeout(`${API_BASE}/ppv/v4/initiate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${params.accessToken}`,
    },
    body: JSON.stringify({
      titleId: params.titleId,
      method: params.method,
      card: params.card,
      customer: params.customer,
      bankTransfer: params.bankTransfer,
      ussd: params.ussd,
      opay: params.opay,
      googlepay: params.googlepay,
      applepay: params.applepay,
    }),
  });
  return (await handleJsonResponse(res)) as any;
}

export async function authorizePpvV4General(params: {
  accessToken: string;
  chargeId: string;
  authorization: Record<string, any>;
}) {
  const res = await fetchWithTimeout(`${API_BASE}/ppv/v4/authorize`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${params.accessToken}`,
    },
    body: JSON.stringify({
      chargeId: params.chargeId,
      authorization: params.authorization,
    }),
  });
  return (await handleJsonResponse(res)) as any;
}

export async function verifyPpvV4General(params: {
  accessToken: string;
  chargeId: string;
}) {
  const url = new URL(`${API_BASE}/ppv/v4/verify`);
  url.searchParams.set("chargeId", params.chargeId);
  const res = await fetchWithTimeout(url.toString(), {
    headers: {
      Authorization: `Bearer ${params.accessToken}`,
    },
  });
  return (await handleJsonResponse(res)) as any;
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
    activePurchases: (data?.active ?? data?.activePurchases ?? []).map((p: any) => ({
      ...p,
      title: p?.title ? normalizeTitleImages(p.title as Title) : p?.title,
    })),
    expiredPurchases: (data?.expired ?? data?.expiredPurchases ?? []).map((p: any) => ({
      ...p,
      title: p?.title ? normalizeTitleImages(p.title as Title) : p?.title,
    })),
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

export type LiveEvent = {
  id: string;
  title: string;
  description?: string | null;
  thumbnailUrl?: string | null;
  category?: string | null;
  status: "SCHEDULED" | "LIVE" | "ENDED";
  isPublished?: boolean;
  visibility?: "PRIVATE" | "UNLISTED" | "PUBLIC";
  unlistedSlug?: string | null;
  playbackUrl?: string | null;
  scheduledStartAt?: string | null;
  createdAt?: string;
  startedAt?: string | null;
  endedAt?: string | null;
  viewerCount?: number;
  replay?: {
    status?: "NONE" | "PENDING_INFRA" | "PROCESSING" | "READY" | "FAILED";
    playbackUrl?: string | null;
    readyAt?: string | null;
    note?: string | null;
  };
};

export type LiveChatMessage = {
  id: string;
  eventId: string;
  userId: string;
  userName: string;
  userRole?: string;
  message: string;
  isPinned?: boolean;
  createdAt: string;
};

export type LiveReactionTotal = {
  type: string;
  count: number;
};

export type LiveEngagementSnapshot = {
  serverTime: string;
  messages: LiveChatMessage[];
  reactionTotals: LiveReactionTotal[];
  recentReactions: Array<{
    id: string;
    type: string;
    createdAt: string;
    user?: { id: string; name: string } | null;
  }>;
};

export async function fetchLiveEvents(accessToken: string) {
  const res = await fetchWithTimeout(`${API_BASE}/live/events`, {
    cache: "no-store",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  const data = await handleJsonResponse(res);
  return ((data?.events as LiveEvent[]) ?? []).map((event) => normalizeLiveEventImages(event));
}

export async function fetchLiveEventById(id: string, accessToken: string) {
  const res = await fetchWithTimeout(`${API_BASE}/live/events/${id}`, {
    cache: "no-store",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  const data = await handleJsonResponse(res);
  return data?.event ? normalizeLiveEventImages(data.event as LiveEvent) : null;
}

export async function fetchLiveEventByUnlistedSlug(slug: string, accessToken: string) {
  const safeSlug = slug.trim();
  const res = await fetchWithTimeout(`${API_BASE}/live/events/unlisted/${encodeURIComponent(safeSlug)}`, {
    cache: "no-store",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  const data = await handleJsonResponse(res);
  return data?.event ? normalizeLiveEventImages(data.event as LiveEvent) : null;
}

export async function fetchLiveEngagementSnapshot(eventId: string, accessToken: string, since?: string | null) {
  const query = new URLSearchParams();
  if (since) query.set("since", since);
  const suffix = query.toString() ? `?${query.toString()}` : "";
  const res = await fetchWithTimeout(`${API_BASE}/live/events/${eventId}/engagement${suffix}`, {
    cache: "no-store",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  }, 20000);
  const data = await handleJsonResponse(res);
  return data as LiveEngagementSnapshot;
}

export async function sendLiveChatMessage(eventId: string, accessToken: string, message: string) {
  const res = await fetchWithTimeout(`${API_BASE}/live/events/${eventId}/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ message }),
  });
  const data = await handleJsonResponse(res);
  return (data?.message as LiveChatMessage) ?? null;
}

export async function sendLiveReaction(eventId: string, accessToken: string, type: string) {
  const res = await fetchWithTimeout(`${API_BASE}/live/events/${eventId}/reactions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ type }),
  });
  return handleJsonResponse(res);
}

export async function sendLiveViewerHeartbeat(eventId: string, accessToken: string) {
  const res = await fetchWithTimeout(`${API_BASE}/live/events/${eventId}/viewer-heartbeat`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    cache: "no-store",
  }, 15000);
  const data = await handleJsonResponse(res);
  return data as { viewerCount: number; status?: "SCHEDULED" | "LIVE" | "ENDED"; windowMs?: number };
}

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
