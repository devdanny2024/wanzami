import { NextRequest, NextResponse } from "next/server";
import { authFetch } from "@/lib/authClient";

export async function GET(req: NextRequest) {
  const authorization = req.headers.get("authorization") ?? "";
  const result = await authFetch("/auth/me", {
    method: "GET",
    headers: {
      authorization,
    },
  });
  return NextResponse.json(result.data, { status: result.status });
}
