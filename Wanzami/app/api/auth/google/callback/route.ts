import { NextRequest, NextResponse } from "next/server";
import { authFetch } from "@/lib/authClient";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const result = await authFetch("/auth/google/callback", {
    method: "POST",
    body: JSON.stringify({
      code: body.code,
      state: body.state,
      redirectUri: body.redirectUri,
    }),
  });
  return NextResponse.json(result.data, { status: result.status });
}
