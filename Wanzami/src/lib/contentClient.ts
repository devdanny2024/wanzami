const API_BASE = process.env.AUTH_SERVICE_URL ?? "http://localhost:4000/api";

export type Title = {
  id: string;
  name: string;
  type: "MOVIE" | "SERIES";
  description?: string | null;
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
  return data?.title as Title & { episodes?: any[] };
}
