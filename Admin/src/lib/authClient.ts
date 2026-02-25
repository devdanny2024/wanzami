const AUTH_SERVICE_URL =
  // Prefer server-side auth base first
  process.env.AUTH_SERVICE_URL ??
  // Fallbacks for browser-side config
  process.env.NEXT_PUBLIC_AUTH_SERVICE_URL ??
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  process.env.NEXT_PUBLIC_API_BASE ??
  "";

const AUTH_FETCH_TIMEOUT_MS = Number(process.env.AUTH_FETCH_TIMEOUT_MS ?? 25000);

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
  if (!AUTH_SERVICE_URL) {
    return {
      ok: false,
      status: 500,
      data: {
        message: "Auth service base URL not configured",
        error: "Set AUTH_SERVICE_URL (or NEXT_PUBLIC_AUTH_SERVICE_URL / NEXT_PUBLIC_API_BASE_URL)",
      },
    };
  }

  const targetUrl = `${AUTH_SERVICE_URL}${withLeadingSlash(path)}`;
  const maxAttempts = 3;
  let lastError: any;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
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
      lastError = error;
      const timedOut = error?.name === "AbortError";
      const retryable = timedOut || (error?.message || "").toLowerCase().includes("fetch");
      if (!(retryable && attempt < maxAttempts)) {
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
      }
      await new Promise((resolve) => setTimeout(resolve, 600));
    } finally {
      cleanup();
    }
  }

  return {
    ok: false,
    status: 502,
    data: {
      message: "Upstream auth service unreachable",
      error: lastError?.message || "fetch failed",
    },
  };
}
