import { NextRequest, NextResponse } from "next/server";
import { authFetch } from "@/lib/authClient";

export async function POST(req: NextRequest) {
  const authorization = req.headers.get("authorization") ?? "";
  const result = await authFetch("/admin/email/campaign/retry-failed", {
    method: "POST",
    headers: { Authorization: authorization },
  });
  return NextResponse.json(result.data, { status: result.status });
}
