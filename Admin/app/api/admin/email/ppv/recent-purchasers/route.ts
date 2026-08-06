import { NextRequest, NextResponse } from "next/server";
import { authFetch } from "@/lib/authClient";

export async function POST(req: NextRequest) {
  const authorization = req.headers.get("authorization") ?? "";
  const days = req.nextUrl.searchParams.get("days");
  const path = `/admin/email/ppv/recent-purchasers${days ? `?days=${encodeURIComponent(days)}` : ""}`;
  const result = await authFetch(path, {
    method: "POST",
    headers: { Authorization: authorization },
  });
  return NextResponse.json(result.data, { status: result.status });
}
