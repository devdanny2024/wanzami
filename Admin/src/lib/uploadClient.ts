import { authFetch } from "./authClient";

export type UploadInitResponse = {
  jobId: string;
  uploadId: string;
  key: string;
  partSize: number;
  partCount: number;
  presignedParts: { partNumber: number; url: string }[];
};

export type UploadParams = {
  kind: "MOVIE" | "SERIES" | "EPISODE";
  titleId?: number;
  titleName?: string;
  episodeId?: number;
  episodeName?: string;
  seasonNumber?: number;
  episodeNumber?: number;
  file: File;
  renditions?: string[];
};

export type UploadProgress = {
  uploadedBytes: number;
  totalBytes: number;
};

export async function initUpload(params: UploadParams, token?: string): Promise<UploadInitResponse> {
  const { file, ...rest } = params;
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
  return res.data as UploadInitResponse;
}

export async function uploadMultipart(
  file: File,
  init: UploadInitResponse,
  token: string | null,
  onProgress?: (p: UploadProgress) => void
) {
  const parts: { ETag: string; PartNumber: number }[] = [];
  let uploaded = 0;
  for (const part of init.presignedParts) {
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
    uploaded = end;
    onProgress?.({ uploadedBytes: uploaded, totalBytes: file.size });
    await authFetch(`/admin/uploads/${init.jobId}/progress`, {
      method: "PATCH",
      headers: {
        Authorization: token ? `Bearer ${token}` : "",
      },
      body: JSON.stringify({ bytesUploaded: uploaded }),
    });
  }

  const complete = await authFetch(`/admin/uploads/${init.jobId}/complete`, {
    method: "POST",
    headers: {
      Authorization: token ? `Bearer ${token}` : "",
    },
    body: JSON.stringify({
      uploadId: init.uploadId,
      key: init.key,
      parts,
    }),
  });
  if (!complete.ok) {
    throw new Error(complete.data?.message ?? "Complete upload failed");
  }
}
