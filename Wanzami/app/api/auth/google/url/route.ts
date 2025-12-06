import { NextRequest, NextResponse } from "next/server";
import { authFetch } from "@/lib/authClient";

export async function GET(req: NextRequest) {
  const redirectUri = req.nextUrl.searchParams.get("redirectUri");
  const query = redirectUri ? `?redirectUri=${encodeURIComponent(redirectUri)}` : "";
  const result = await authFetch(`/auth/google/url${query}`, {
    method: "GET",
  });
  return NextResponse.json(result.data, { status: result.status });
}
