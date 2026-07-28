import { NextRequest, NextResponse } from "next/server";
import { authFetch } from "@/lib/authClient";

export async function GET(req: NextRequest) {
  const authorization = req.headers.get("authorization") ?? "";
  const qs = req.nextUrl.search ?? "";
  const result = await authFetch(`/admin/blog/posts${qs}`, {
    method: "GET",
    headers: { Authorization: authorization },
  });
  return NextResponse.json(result.data, { status: result.status });
}

export async function POST(req: NextRequest) {
  const authorization = req.headers.get("authorization") ?? "";
  const body = await req.text();
  const result = await authFetch(`/admin/blog/posts`, {
    method: "POST",
    headers: { Authorization: authorization },
    body,
  });
  return NextResponse.json(result.data, { status: result.status });
}
