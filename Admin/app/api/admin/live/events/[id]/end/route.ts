import { NextRequest, NextResponse } from "next/server";
import { authFetch } from "@/lib/authClient";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const authorization = req.headers.get("authorization") ?? "";
  const result = await authFetch(`/admin/live/events/${params.id}/end`, {
    method: "POST",
    headers: { Authorization: authorization },
  });
  return NextResponse.json(result.data, { status: result.status });
}
