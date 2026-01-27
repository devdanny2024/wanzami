import { config } from "../config.js";

type TokenCache = {
  accessToken: string;
  expiresAt: number;
};

let tokenCache: TokenCache | null = null;

const tokenUrl =
  "https://idp.flutterwave.com/realms/flutterwave/protocol/openid-connect/token";

export const getFlutterwaveAccessToken = async () => {
  const now = Date.now();
  if (tokenCache && tokenCache.expiresAt - 60_000 > now) {
    return tokenCache.accessToken;
  }

  const clientId = config.flutterwave.publicKey;
  const clientSecret = config.flutterwave.secretKey;
  if (!clientId || !clientSecret) {
    throw new Error("Flutterwave V4 client credentials not configured");
  }

  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: "client_credentials",
  });

  const res = await fetch(tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      (json as any)?.error_description ||
        (json as any)?.message ||
        "Failed to fetch Flutterwave access token"
    );
  }

  const accessToken = (json as any)?.access_token as string | undefined;
  const expiresIn = Number((json as any)?.expires_in ?? 0);
  if (!accessToken) {
    throw new Error("Flutterwave token response missing access_token");
  }

  tokenCache = {
    accessToken,
    expiresAt: now + (expiresIn > 0 ? expiresIn * 1000 : 55 * 60 * 1000),
  };
  return accessToken;
};
