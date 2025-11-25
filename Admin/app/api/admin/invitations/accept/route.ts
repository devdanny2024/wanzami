import { NextRequest, NextResponse } from "next/server";
import { authFetch } from "@/lib/authClient";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const result = await authFetch("/admin/invitations/accept", {
    method: "POST",
    body: JSON.stringify(body),
  });
  return NextResponse.json(result.data, { status: result.status });
}
