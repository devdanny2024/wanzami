import { NextRequest, NextResponse } from "next/server";
import { authFetch } from "@/lib/authClient";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const authorization = req.headers.get("authorization") ?? "";
  const { searchParams } = new URL(req.url);
  const limit = searchParams.get("limit");
  const query = limit ? `?limit=${encodeURIComponent(limit)}` : "";
  const result = await authFetch(`/admin/live/events/${params.id}/chat${query}`, {
    method: "GET",
    headers: { Authorization: authorization },
  });
  return NextResponse.json(result.data, { status: result.status });
}
