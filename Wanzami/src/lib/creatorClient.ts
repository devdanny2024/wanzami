// Client for the creator portal (creator.wanzami.tv). Uses its own token
// storage keys, deliberately separate from the viewer's accessToken/
// refreshToken, so someone can be logged into Wanzami as a viewer and as a
// creator in the same browser without either session clobbering the other.

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE ??
  process.env.AUTH_SERVICE_URL ??
  "https://api.blvckcode.io/api";

const ACCESS_KEY = "creatorAccessToken";
const REFRESH_KEY = "creatorRefreshToken";

export type CreatorSignupInput = {
  name: string;
  email: string;
  password: string;
  bio?: string;
  reelUrl?: string;
};

export type CreatorProfile = {
  id: string;
  name: string;
  email: string;
  status: "ACTIVE" | "SUSPENDED";
  bio: string | null;
  reelUrl: string | null;
  onboarded: boolean;
  createdAt: string;
};

export type CreatorSubmissionMetrics = {
  purchases: number;
  revenueNaira: number;
};

export type CreatorSubmission = {
  id: string;
  title: string;
  synopsis: string | null;
  status: "UPLOADING" | "SUBMITTED" | "IN_REVIEW" | "APPROVED" | "REJECTED";
  reviewNote: string | null;
  createdAt: string;
  metrics: CreatorSubmissionMetrics | null;
};

export function getCreatorTokens() {
  if (typeof window === "undefined") return { accessToken: null, refreshToken: null };
  return {
    accessToken: localStorage.getItem(ACCESS_KEY),
    refreshToken: localStorage.getItem(REFRESH_KEY),
  };
}

export function setCreatorTokens(accessToken: string, refreshToken: string) {
  localStorage.setItem(ACCESS_KEY, accessToken);
  localStorage.setItem(REFRESH_KEY, refreshToken);
}

export function clearCreatorTokens() {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

async function request(path: string, init?: RequestInit) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}

async function authedRequest(path: string, init?: RequestInit): Promise<{ ok: boolean; status: number; data: any }> {
  const { accessToken } = getCreatorTokens();
  const res = await request(path, {
    ...init,
    headers: { Authorization: `Bearer ${accessToken}`, ...(init?.headers ?? {}) },
  });
  if (res.status !== 401) return res;

  const { refreshToken } = getCreatorTokens();
  if (!refreshToken) return res;
  const refreshed = await request("/creators/refresh", {
    method: "POST",
    body: JSON.stringify({ refreshToken }),
  });
  if (!refreshed.ok || !refreshed.data?.accessToken) {
    clearCreatorTokens();
    return res;
  }
  setCreatorTokens(refreshed.data.accessToken, refreshed.data.refreshToken);
  return request(path, {
    ...init,
    headers: { Authorization: `Bearer ${refreshed.data.accessToken}`, ...(init?.headers ?? {}) },
  });
}

export async function signup(input: CreatorSignupInput) {
  const res = await request("/creators/signup", { method: "POST", body: JSON.stringify(input) });
  if (!res.ok) {
    const message =
      res.data?.message ?? (res.data?.errors ? "Please check the form and try again" : "Could not create your account");
    throw new Error(message);
  }
  setCreatorTokens(res.data.accessToken, res.data.refreshToken);
  return res.data;
}

export async function login(email: string, password: string) {
  const res = await request("/creators/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error(res.data?.message || "Invalid email or password");
  setCreatorTokens(res.data.accessToken, res.data.refreshToken);
  return res.data;
}

export function logout() {
  clearCreatorTokens();
}

export async function fetchMe(): Promise<CreatorProfile> {
  const res = await authedRequest("/creators/me");
  if (!res.ok) throw new Error(res.data?.message || "Not signed in");
  return res.data;
}

export async function fetchSubmissions(): Promise<CreatorSubmission[]> {
  const res = await authedRequest("/creators/submissions");
  if (!res.ok) throw new Error(res.data?.message || "Could not load submissions");
  return res.data.submissions ?? [];
}

export type DailyAnalytics = { date: string; purchases: number; revenueNaira: number };

export async function fetchSubmissionAnalytics(id: string): Promise<DailyAnalytics[]> {
  const res = await authedRequest(`/creators/submissions/${id}/analytics`);
  if (!res.ok) throw new Error(res.data?.message || "Could not load analytics");
  return res.data.daily ?? [];
}

export async function completeOnboarding() {
  const res = await authedRequest("/creators/me/onboarding-complete", { method: "POST" });
  if (!res.ok) throw new Error(res.data?.message || "Could not save onboarding");
  return res.data;
}

export async function updateCredentials(input: {
  currentPassword: string;
  newEmail?: string;
  newPassword?: string;
}) {
  const res = await authedRequest("/creators/me/credentials", {
    method: "PATCH",
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(res.data?.message || "Could not update your account");
  return res.data;
}

const PART_SIZE = 8 * 1024 * 1024; // 8MB, comfortably above R2's 5MB multipart minimum.

export async function uploadSubmission(
  file: File,
  meta: { title: string; synopsis?: string },
  onProgress?: (pct: number) => void
) {
  const start = await authedRequest("/creators/submissions", {
    method: "POST",
    body: JSON.stringify({ title: meta.title, synopsis: meta.synopsis, contentType: file.type || "video/mp4" }),
  });
  if (!start.ok) throw new Error(start.data?.message || "Could not start upload");
  const { submissionId, key } = start.data;

  const partCount = Math.max(1, Math.ceil(file.size / PART_SIZE));
  const partNumbers = Array.from({ length: partCount }, (_, i) => i + 1);
  const partsRes = await authedRequest(`/creators/submissions/${submissionId}/parts`, {
    method: "POST",
    body: JSON.stringify({ partNumbers }),
  });
  if (!partsRes.ok) throw new Error(partsRes.data?.message || "Could not prepare upload");

  const uploadedParts: { partNumber: number; eTag: string }[] = [];
  for (let i = 0; i < partsRes.data.parts.length; i++) {
    const { partNumber, url } = partsRes.data.parts[i];
    const byteOffset = (partNumber - 1) * PART_SIZE;
    const chunk = file.slice(byteOffset, byteOffset + PART_SIZE);
    const putRes = await fetch(url, { method: "PUT", body: chunk });
    if (!putRes.ok) throw new Error(`Upload failed on part ${partNumber}`);
    const eTag = putRes.headers.get("ETag") || putRes.headers.get("etag") || "";
    uploadedParts.push({ partNumber, eTag: eTag.replace(/"/g, "") });
    onProgress?.(Math.round(((i + 1) / partsRes.data.parts.length) * 100));
  }

  const complete = await authedRequest(`/creators/submissions/${submissionId}/complete`, {
    method: "POST",
    body: JSON.stringify({ parts: uploadedParts.map((p) => ({ partNumber: p.partNumber, eTag: `"${p.eTag}"` })) }),
  });
  if (!complete.ok) throw new Error(complete.data?.message || "Could not finalize upload");
  return { submissionId, key };
}
