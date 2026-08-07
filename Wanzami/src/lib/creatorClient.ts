// Client for the creator portal (creator.wanzami.tv). Uses its own token
// storage keys, deliberately separate from the viewer's accessToken/
// refreshToken, so someone can be logged into Wanzami as a viewer and as a
// creator in the same browser without either session clobbering the other.
//
// Unlike Admin, this talks to the API directly from the browser (no
// same-origin Next.js proxy), so anything sent as a custom header instead of
// a query param needs a matching CORS allowlist change on the backend.

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
  avatarUrl: string | null;
  instagram: string | null;
  youtube: string | null;
  twitter: string | null;
  website: string | null;
  bankName: string | null;
  bankAccountName: string | null;
  bankAccountNumber: string | null;
  onboarded: boolean;
  createdAt: string;
};

export type CreatorSubmissionMetrics = {
  purchases: number;
  revenueNaira: number;
};

export type CreatorDocument = {
  id: string;
  kind: string;
  fileName: string;
  createdAt: string;
};

export type CreatorSubmissionStatus = "DRAFT" | "SUBMITTED" | "IN_REVIEW" | "APPROVED" | "REJECTED";

export type CreatorSubmission = {
  id: string;
  title: string;
  synopsis: string | null;
  genres: string[];
  cast: string[];
  crew: string[];
  language: string | null;
  maturityRating: string | null;
  runtimeMinutes: number | null;
  releaseDate: string | null;
  suggestedPpvPriceNaira: number | null;
  hasMasterFile: boolean;
  hasTrailer: boolean;
  posterUrl: string | null;
  rightsDeclared: boolean;
  rightsDeclaredName: string | null;
  rightsDeclaredAt: string | null;
  status: CreatorSubmissionStatus;
  reviewNote: string | null;
  linkedTitleId: string | null;
  submittedAt: string | null;
  createdAt: string;
  documents?: CreatorDocument[];
  metrics?: CreatorSubmissionMetrics | null;
};

export type CreatorNotification = {
  id: string;
  type: "SUBMISSION_RECEIVED" | "SUBMISSION_IN_REVIEW" | "SUBMISSION_APPROVED" | "SUBMISSION_REJECTED" | "PAYOUT_LOGGED";
  title: string;
  body: string;
  submissionId: string | null;
  isRead: boolean;
  createdAt: string;
};

export type CreatorEarnings = {
  totalEarnedNaira: number;
  totalPaidNaira: number;
  balanceNaira: number;
  byTitle: { submissionId: string; title: string; revenueNaira: number }[];
  payouts: { id: string; amountNaira: number; note: string | null; paidAt: string }[];
};

export type PublicCreatorProfile = {
  id: string;
  name: string;
  bio: string | null;
  avatarUrl: string | null;
  instagram: string | null;
  youtube: string | null;
  twitter: string | null;
  website: string | null;
  titles: { id: string; name: string; posterUrl: string | null; thumbnailUrl: string | null }[];
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

// Raw-body upload (poster/avatar/document): no "Content-Type: application/json"
// default, the file's own type goes through instead.
async function authedUpload(path: string, file: File | Blob, contentType: string) {
  const { accessToken } = getCreatorTokens();
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": contentType },
    body: file,
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
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

export async function updateProfile(input: {
  name?: string;
  bio?: string;
  reelUrl?: string;
  instagram?: string;
  youtube?: string;
  twitter?: string;
  website?: string;
}): Promise<CreatorProfile> {
  const res = await authedRequest("/creators/me/profile", { method: "PATCH", body: JSON.stringify(input) });
  if (!res.ok) throw new Error(res.data?.message || "Could not update your profile");
  return res.data;
}

export async function updatePayoutDetails(input: {
  bankName?: string;
  bankAccountName?: string;
  bankAccountNumber?: string;
}): Promise<CreatorProfile> {
  const res = await authedRequest("/creators/me/payout-details", { method: "PATCH", body: JSON.stringify(input) });
  if (!res.ok) throw new Error(res.data?.message || "Could not update payout details");
  return res.data;
}

export async function uploadAvatar(file: File): Promise<string> {
  const res = await authedUpload("/creators/me/avatar", file, file.type || "image/jpeg");
  if (!res.ok) throw new Error(res.data?.message || "Could not upload avatar");
  return res.data.avatarUrl;
}

export async function fetchEarnings(): Promise<CreatorEarnings> {
  const res = await authedRequest("/creators/me/earnings");
  if (!res.ok) throw new Error(res.data?.message || "Could not load earnings");
  return res.data;
}

export async function fetchNotifications(): Promise<{ unreadCount: number; notifications: CreatorNotification[] }> {
  const res = await authedRequest("/creators/notifications");
  if (!res.ok) throw new Error(res.data?.message || "Could not load notifications");
  return res.data;
}

export async function markNotificationRead(id: string) {
  await authedRequest(`/creators/notifications/${id}/read`, { method: "POST" });
}

export async function markAllNotificationsRead() {
  await authedRequest("/creators/notifications/read-all", { method: "POST" });
}

export async function fetchPublicCreatorProfile(id: string): Promise<PublicCreatorProfile> {
  const res = await request(`/creators/${id}/public`);
  if (!res.ok) throw new Error(res.data?.message || "Creator not found");
  return res.data;
}

export type TitleCreator = {
  id: string;
  name: string;
  bio: string | null;
  avatarUrl: string | null;
  instagram: string | null;
  youtube: string | null;
  twitter: string | null;
  website: string | null;
};

export async function fetchCreatorForTitle(titleId: string): Promise<TitleCreator | null> {
  const res = await request(`/creators/by-title/${titleId}/public`);
  if (!res.ok) return null;
  return res.data.creator;
}

// ---------------------------------------------------------------------------
// Submissions — draft-first wizard
// ---------------------------------------------------------------------------

export async function fetchSubmissions(): Promise<CreatorSubmission[]> {
  const res = await authedRequest("/creators/submissions");
  if (!res.ok) throw new Error(res.data?.message || "Could not load submissions");
  return res.data.submissions ?? [];
}

export async function fetchSubmission(id: string): Promise<CreatorSubmission> {
  const res = await authedRequest(`/creators/submissions/${id}`);
  if (!res.ok) throw new Error(res.data?.message || "Could not load submission");
  return res.data;
}

export async function createDraft(title: string): Promise<CreatorSubmission> {
  const res = await authedRequest("/creators/submissions", { method: "POST", body: JSON.stringify({ title }) });
  if (!res.ok) throw new Error(res.data?.message || "Could not start a new submission");
  return res.data;
}

export type DraftUpdateInput = Partial<{
  title: string;
  synopsis: string;
  genres: string[];
  cast: string[];
  crew: string[];
  language: string;
  maturityRating: string;
  runtimeMinutes: number;
  releaseDate: string;
  suggestedPpvPriceNaira: number;
  rightsDeclared: boolean;
  rightsDeclaredName: string;
}>;

export async function updateDraft(id: string, input: DraftUpdateInput): Promise<CreatorSubmission> {
  const res = await authedRequest(`/creators/submissions/${id}`, { method: "PATCH", body: JSON.stringify(input) });
  if (!res.ok) throw new Error(res.data?.message || "Could not save changes");
  return res.data;
}

export async function deleteDraft(id: string) {
  const res = await authedRequest(`/creators/submissions/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error(res.data?.message || "Could not delete draft");
}

export async function submitDraft(id: string): Promise<CreatorSubmission> {
  const res = await authedRequest(`/creators/submissions/${id}/submit`, { method: "POST" });
  if (!res.ok) throw new Error(res.data?.message || "Could not submit");
  return res.data;
}

export async function uploadSubmissionPoster(id: string, file: File): Promise<string> {
  const res = await authedUpload(`/creators/submissions/${id}/poster`, file, file.type || "image/jpeg");
  if (!res.ok) throw new Error(res.data?.message || "Could not upload poster");
  return res.data.posterUrl;
}

export async function uploadSubmissionDocument(id: string, file: File, kind: string): Promise<CreatorDocument> {
  const params = new URLSearchParams({ kind, filename: file.name });
  const res = await authedUpload(`/creators/submissions/${id}/documents?${params}`, file, file.type || "application/octet-stream");
  if (!res.ok) throw new Error(res.data?.message || "Could not upload document");
  return res.data;
}

export async function deleteSubmissionDocument(id: string, docId: string) {
  await authedRequest(`/creators/submissions/${id}/documents/${docId}`, { method: "DELETE" });
}

export type DailyAnalytics = { date: string; purchases: number; revenueNaira: number };

export async function fetchSubmissionAnalytics(id: string): Promise<DailyAnalytics[]> {
  const res = await authedRequest(`/creators/submissions/${id}/analytics`);
  if (!res.ok) throw new Error(res.data?.message || "Could not load analytics");
  return res.data.daily ?? [];
}

// --- Master file + trailer: direct multipart upload to R2. ---

const PART_SIZE = 8 * 1024 * 1024; // 8MB, comfortably above R2's 5MB multipart minimum.

async function uploadViaMultipart(
  submissionId: string,
  file: File,
  kind: "master" | "trailer",
  onProgress?: (pct: number) => void
) {
  const start = await authedRequest(`/creators/submissions/${submissionId}/${kind}/start`, {
    method: "POST",
    body: JSON.stringify({ contentType: file.type || "video/mp4" }),
  });
  if (!start.ok) throw new Error(start.data?.message || "Could not start upload");

  const partCount = Math.max(1, Math.ceil(file.size / PART_SIZE));
  const partNumbers = Array.from({ length: partCount }, (_, i) => i + 1);
  const partsRes = await authedRequest(`/creators/submissions/${submissionId}/${kind}/parts`, {
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

  const complete = await authedRequest(`/creators/submissions/${submissionId}/${kind}/complete`, {
    method: "POST",
    body: JSON.stringify({ parts: uploadedParts.map((p) => ({ partNumber: p.partNumber, eTag: `"${p.eTag}"` })) }),
  });
  if (!complete.ok) throw new Error(complete.data?.message || "Could not finalize upload");
}

export async function uploadMasterFile(submissionId: string, file: File, onProgress?: (pct: number) => void) {
  return uploadViaMultipart(submissionId, file, "master", onProgress);
}

export async function uploadTrailerFile(submissionId: string, file: File, onProgress?: (pct: number) => void) {
  return uploadViaMultipart(submissionId, file, "trailer", onProgress);
}
