import { NextRequest, NextResponse } from "next/server";
import { authFetch } from "@/lib/authClient";

// Public proxy: the invitee has no session yet, so no Authorization header is
// forwarded. The invite token in the query string is the only credential.
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token") ?? "";
  const result = await authFetch(
    `/admin/invitations/lookup?token=${encodeURIComponent(token)}`,
    { method: "GET" }
  );
  return NextResponse.json(result.data, { status: result.status });
}
