import { NextRequest, NextResponse } from "next/server";
import { authFetch } from "@/lib/authClient";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const authorization = req.headers.get("authorization") ?? "";
  const body = await req.json().catch(() => ({}));
  const result = await authFetch(`/admin/live/events/${params.id}/sources/switch`, {
    method: "POST",
    headers: { Authorization: authorization },
    body: JSON.stringify(body),
  });
  return NextResponse.json(result.data, { status: result.status });
}
