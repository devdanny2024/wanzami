const AUTH_SERVICE_URL =
  // Prefer server-side auth base first
  process.env.AUTH_SERVICE_URL ??
  // Fallbacks for browser-side config
  process.env.NEXT_PUBLIC_AUTH_SERVICE_URL ??
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  // Hard fallback to EC2 backend so we never hit localhost in prod
  "http://ec2-16-171-135-137.eu-north-1.compute.amazonaws.com:4000/api";

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
