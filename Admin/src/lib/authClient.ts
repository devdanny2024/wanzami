const AUTH_SERVICE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  process.env.NEXT_PUBLIC_AUTH_SERVICE_URL ??
  process.env.AUTH_SERVICE_URL ??
  "http://localhost:4000/api";

export async function authFetch(path: string, init?: RequestInit) {
  const res = await fetch(`${AUTH_SERVICE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });

  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}
