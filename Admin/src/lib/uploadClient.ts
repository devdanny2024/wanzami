import { authFetch } from "./authClient";

export type UploadInitResponse = {
  jobId: string;
  uploadId: string;
  key: string;
  partSize: number;
  partCount: number;
  presignedParts: { partNumber: number; url: string }[];
  uploadedParts?: { partNumber: number; size: number; etag?: string }[];
  uploadedBytes?: number;
};

export type UploadParams = {
  kind: "MOVIE" | "SERIES" | "EPISODE";
  titleId?: number;
  titleName?: string;
  episodeId?: number;
  episodeName?: string;
  seasonNumber?: number;
  episodeNumber?: number;
  rendition?: string;
  file: File;
};

type UploadSession = {
  signature: string;
  jobId: string;
  uploadId: string;
  key: string;
  partSize: number;
  partCount: number;
  kind: UploadParams["kind"];
  titleId?: number;
  episodeId?: number;
  createdAt: string;
};

const SESSION_KEY = "wanzami:multipart-sessions";

const getSignature = (file: File) => `${file.name}::${file.size}::${file.lastModified}`;

const loadSessions = (): UploadSession[] => {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as UploadSession[]) : [];
  } catch {
    return [];
  }
};

const saveSessions = (sessions: UploadSession[]) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(sessions));
};

const saveSession = (session: UploadSession) => {
  const sessions = loadSessions().filter((s) => s.signature !== session.signature);
  sessions.push(session);
  saveSessions(sessions);
};

const clearSession = (signature: string) => {
  const sessions = loadSessions().filter((s) => s.signature !== signature);
  saveSessions(sessions);
};

export type UploadProgress = {
  uploadedBytes: number;
  totalBytes: number;
};

// Retries the resume call on transient failures instead of giving up after one
// attempt. A single network blip or backend restart used to be enough to make
// initUpload() abandon a partially-uploaded session and start a huge file over
// from byte 0 under a brand new key, even though the old session was still
// resumable. Only a 409 (already completed) or 410 (upload gone on R2) means
// the session truly can't be resumed; anything else is worth retrying.
async function tryResume(jobId: string, token?: string): Promise<UploadInitResponse | null> {
  const maxAttempts = 4;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const resume = await authFetch(`/admin/uploads/${jobId}/resume`, {
      method: "POST",
      headers: {
        Authorization: token ? `Bearer ${token}` : "",
      },
    });
    if (resume.ok) {
      return resume.data as UploadInitResponse;
    }
    if (resume.status === 409 || resume.status === 410) {
      return null;
    }
    if (attempt < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, attempt * 2000));
    }
  }
  return null;
}

export async function initUpload(params: UploadParams, token?: string): Promise<UploadInitResponse> {
  const { file, ...rest } = params;
  const signature = getSignature(file);
  const existing = loadSessions().find(
    (s) =>
      s.signature === signature &&
      s.kind === rest.kind &&
      s.titleId === rest.titleId &&
      s.episodeId === rest.episodeId
  );
  if (existing?.jobId) {
    const resumed = await tryResume(existing.jobId, token);
    if (resumed) {
      return resumed;
    }
    // Only reached if the job is genuinely gone/completed server-side, or every
    // resume attempt failed after retries. Safe to start a fresh session now.
    clearSession(signature);
  }
  const res = await authFetch("/admin/uploads/init", {
    method: "POST",
    headers: {
      Authorization: token ? `Bearer ${token}` : "",
    },
    body: JSON.stringify({
      ...rest,
      fileName: file.name,
      bytesTotal: file.size,
      contentType: file.type || "application/octet-stream",
    }),
  });
  if (!res.ok) {
    throw new Error(res.data?.message ?? "Init upload failed");
  }
  const init = res.data as UploadInitResponse;
  saveSession({
    signature,
    jobId: init.jobId,
    uploadId: init.uploadId,
    key: init.key,
    partSize: init.partSize,
    partCount: init.partCount,
    kind: rest.kind,
    titleId: rest.titleId,
    episodeId: rest.episodeId,
    createdAt: new Date().toISOString(),
  });
  return init;
}

export async function uploadMultipart(
  file: File,
  init: UploadInitResponse,
  token: string | null,
  onProgress?: (p: UploadProgress) => void
) {
  const parts: { ETag: string; PartNumber: number }[] = [];
  const partUploads: number[] = new Array(init.partCount).fill(0);
  const signature = getSignature(file);
  const maxConcurrency = Math.max(
    2,
    Number(process.env.NEXT_PUBLIC_UPLOAD_MAX_CONCURRENCY ?? "6")
  );
  let cursor = 0;

  const uploadPart = async (part: { partNumber: number; url: string }, index: number) => {
    const start = (part.partNumber - 1) * init.partSize;
    const end = Math.min(start + init.partSize, file.size);
    const blob = file.slice(start, end);
    const res = await fetch(part.url, {
      method: "PUT",
      body: blob,
    });
    if (!res.ok) {
      throw new Error(`Part ${part.partNumber} upload failed`);
    }
    const etag = res.headers.get("etag") ?? `part-${part.partNumber}`;
    parts.push({ ETag: etag, PartNumber: part.partNumber });
    partUploads[part.partNumber - 1] = end - start;
    const uploadedBytes = partUploads.reduce((sum, size) => sum + size, 0);
    onProgress?.({ uploadedBytes, totalBytes: file.size });
    await authFetch(`/admin/uploads/${init.jobId}/progress`, {
      method: "PATCH",
      headers: {
        Authorization: token ? `Bearer ${token}` : "",
      },
      body: JSON.stringify({ bytesUploaded: uploadedBytes }),
    });
  };

  if (init.uploadedParts && init.uploadedParts.length) {
    for (const part of init.uploadedParts) {
      if (!part.partNumber) continue;
      partUploads[part.partNumber - 1] = part.size ?? 0;
      if (part.etag) {
        parts.push({ ETag: part.etag, PartNumber: part.partNumber });
      }
    }
    const uploadedBytes = init.uploadedBytes ?? partUploads.reduce((sum, size) => sum + size, 0);
    onProgress?.({ uploadedBytes, totalBytes: file.size });
  }

  const workers = Array.from({ length: Math.min(maxConcurrency, init.presignedParts.length) }, async () => {
    while (cursor < init.presignedParts.length) {
      const index = cursor;
      cursor += 1;
      await uploadPart(init.presignedParts[index], index);
    }
  });

  await Promise.all(workers);

  const complete = await authFetch(`/admin/uploads/${init.jobId}/complete`, {
    method: "POST",
    headers: {
      Authorization: token ? `Bearer ${token}` : "",
    },
    body: JSON.stringify({
      uploadId: init.uploadId,
      key: init.key,
      parts: parts.sort((a, b) => a.PartNumber - b.PartNumber),
    }),
  });
  if (!complete.ok) {
    throw new Error(complete.data?.message ?? "Complete upload failed");
  }
  clearSession(signature);
}
