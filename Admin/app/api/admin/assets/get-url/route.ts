import { NextRequest, NextResponse } from "next/server";
import { authFetch } from "@/lib/authClient";

// Proxy: client -> /api/admin/assets/get-url -> backend /admin/assets/get-url
export async function POST(req: NextRequest) {
  const authorization = req.headers.get("authorization") ?? "";
  const body = await req.json();
  const result = await authFetch("/admin/assets/get-url", {
    method: "POST",
    headers: { Authorization: authorization },
    body: JSON.stringify(body),
  });
  return NextResponse.json(result.data, { status: result.status });
}
