import { NextRequest, NextResponse } from "next/server";
import { authFetch } from "@/lib/authClient";

export async function GET(req: NextRequest) {
  const authorization = req.headers.get("authorization") ?? "";
  const result = await authFetch("/admin/titles", {
    method: "GET",
    headers: { Authorization: authorization },
  });
  return NextResponse.json(result.data, { status: result.status });
}

export async function POST(req: NextRequest) {
  const authorization = req.headers.get("authorization") ?? "";
  const body = await req.json();
  const result = await authFetch("/admin/titles", {
    method: "POST",
    headers: { Authorization: authorization },
    body: JSON.stringify(body),
  });
  return NextResponse.json(result.data, { status: result.status });
}
