import { NextRequest, NextResponse } from "next/server";
import { authFetch } from "@/lib/authClient";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const authHeader = req.headers.get("authorization") ?? undefined;
  const result = await authFetch("/auth/complete-onboarding", {
    method: "POST",
    headers: authHeader ? { authorization: authHeader } : undefined,
    body: JSON.stringify(body),
  });
  return NextResponse.json(result.data, { status: result.status });
}
