import { NextRequest, NextResponse } from "next/server";
import { authFetch } from "@/lib/authClient";

export async function PATCH(req: NextRequest, { params }: { params: { id: string; sourceId: string } }) {
  const authorization = req.headers.get("authorization") ?? "";
  const body = await req.json().catch(() => ({}));
  const result = await authFetch(`/admin/live/events/${params.id}/sources/${params.sourceId}`, {
    method: "PATCH",
    headers: { Authorization: authorization },
    body: JSON.stringify(body),
  });
  return NextResponse.json(result.data, { status: result.status });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string; sourceId: string } }) {
  const authorization = req.headers.get("authorization") ?? "";
  const result = await authFetch(`/admin/live/events/${params.id}/sources/${params.sourceId}`, {
    method: "DELETE",
    headers: { Authorization: authorization },
  });
  if (result.status === 204) {
    return new NextResponse(null, { status: 204 });
  }
  return NextResponse.json(result.data, { status: result.status });
}
