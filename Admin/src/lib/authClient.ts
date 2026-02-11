const AUTH_SERVICE_URL =
  // Prefer server-side auth base first
  process.env.AUTH_SERVICE_URL ??
  // Fallbacks for browser-side config
  process.env.NEXT_PUBLIC_AUTH_SERVICE_URL ??
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  process.env.NEXT_PUBLIC_API_BASE ??
  // Hard fallback to Wanzami prod backend API
  "https://wanzami-backend-alb-1018329891.us-east-2.elb.amazonaws.com/api";

export async function authFetch(path: string, init?: RequestInit) {
  try {
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
  } catch (error: any) {
    return {
      ok: false,
      status: 502,
      data: {
        message: "Upstream auth service unreachable",
        error: error?.message || "fetch failed",
      },
    };
  }
}
