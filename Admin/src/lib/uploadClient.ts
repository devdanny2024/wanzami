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
  rendition?: string;
  file: File;
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
  const partUploads: number[] = new Array(init.presignedParts.length).fill(0);
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
    partUploads[index] = end - start;
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
}
