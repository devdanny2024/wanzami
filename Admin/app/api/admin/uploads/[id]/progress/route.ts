import { NextRequest, NextResponse } from "next/server";
import { authFetch } from "@/lib/authClient";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const authorization = req.headers.get("authorization") ?? "";
  const body = await req.json();
  const result = await authFetch(`/admin/uploads/${params.id}/progress`, {
    method: "PATCH",
    headers: { Authorization: authorization },
    body: JSON.stringify(body),
  });
  return NextResponse.json(result.data, { status: result.status });
}
