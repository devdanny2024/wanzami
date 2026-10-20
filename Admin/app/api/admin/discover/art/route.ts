import { NextRequest, NextResponse } from "next/server";
import { authFetch } from "@/lib/authClient";

export async function PUT(req: NextRequest) {
  const authorization = req.headers.get("authorization") ?? "";
  const body = await req.json();
  const result = await authFetch("/admin/discover/art", {
    method: "PUT",
    headers: { Authorization: authorization },
    body: JSON.stringify(body),
  });
  return NextResponse.json(result.data, { status: result.status });
}
