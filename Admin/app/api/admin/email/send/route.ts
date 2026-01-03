import { NextRequest, NextResponse } from "next/server";
import { authFetch } from "@/lib/authClient";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const authorization = req.headers.get("authorization") ?? "";
  const result = await authFetch("/admin/email/send", {
    method: "POST",
    headers: { Authorization: authorization },
    body: JSON.stringify(body),
  });
  return NextResponse.json(result.data, { status: result.status });
}
