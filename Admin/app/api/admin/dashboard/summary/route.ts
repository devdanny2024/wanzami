import { NextRequest, NextResponse } from "next/server";
import { authFetch } from "@/lib/authClient";

export async function GET(req: NextRequest) {
  const authorization = req.headers.get("authorization") ?? "";
  const result = await authFetch("/admin/dashboard/summary", {
    method: "GET",
    headers: { Authorization: authorization },
  });
  return NextResponse.json(result.data, { status: result.status });
}

