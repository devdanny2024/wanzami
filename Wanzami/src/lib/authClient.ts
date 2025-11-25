const AUTH_SERVICE_URL =
  process.env.AUTH_SERVICE_URL ?? "http://localhost:4000/api";

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
  if (!res.ok) {
    return {
      ok: false,
      status: res.status,
      data,
    };
  }

  return { ok: true, status: res.status, data };
}
