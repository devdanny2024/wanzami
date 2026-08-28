import { NextRequest, NextResponse } from "next/server";
import { authFetch } from "@/lib/authClient";

export async function GET(req: NextRequest) {
  const authorization = req.headers.get("authorization") ?? "";
  const result = await authFetch("/admin/ppv/fx-rates", {
    method: "GET",
    headers: { Authorization: authorization },
  });
  return NextResponse.json(result.data, { status: result.status });
}

export async function PUT(req: NextRequest) {
  const authorization = req.headers.get("authorization") ?? "";
  const body = await req.text();
  const result = await authFetch("/admin/ppv/fx-rates", {
    method: "PUT",
    headers: { Authorization: authorization },
    body,
  });
  return NextResponse.json(result.data, { status: result.status });
}
