const AUTH_SERVICE_URL =
  // Prefer server-side auth base first
  process.env.AUTH_SERVICE_URL ??
  // Fallbacks for browser-side config
  process.env.NEXT_PUBLIC_AUTH_SERVICE_URL ??
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  process.env.NEXT_PUBLIC_API_BASE ??
  // Hard fallback to Wanzami prod backend API
  "https://wanzami-backend-alb-1018329891.us-east-2.elb.amazonaws.com/api";

const AUTH_FETCH_TIMEOUT_MS = Number(process.env.AUTH_FETCH_TIMEOUT_MS ?? 12000);

function withLeadingSlash(path: string) {
  return path.startsWith("/") ? path : `/${path}`;
}

function createTimeoutSignal(signal?: AbortSignal) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(new Error("auth fetch timeout")), AUTH_FETCH_TIMEOUT_MS);

  if (signal) {
    if (signal.aborted) {
      controller.abort(signal.reason);
    } else {
      signal.addEventListener("abort", () => controller.abort(signal.reason), { once: true });
    }
  }

  return {
    signal: controller.signal,
    cleanup: () => clearTimeout(timeoutId),
  };
}

export async function authFetch(path: string, init?: RequestInit) {
  const targetUrl = `${AUTH_SERVICE_URL}${withLeadingSlash(path)}`;
  const { signal, cleanup } = createTimeoutSignal(init?.signal);

  try {
    const res = await fetch(targetUrl, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(init?.headers ?? {}),
      },
      cache: "no-store",
      signal,
    });

    const data = await res.json().catch(() => ({}));
    return { ok: res.ok, status: res.status, data };
  } catch (error: any) {
    const timedOut = error?.name === "AbortError";

    return {
      ok: false,
      status: timedOut ? 504 : 502,
      data: {
        message: timedOut
          ? `Upstream auth service timed out after ${AUTH_FETCH_TIMEOUT_MS}ms`
          : "Upstream auth service unreachable",
        error: error?.message || "fetch failed",
      },
    };
  } finally {
    cleanup();
  }
}
