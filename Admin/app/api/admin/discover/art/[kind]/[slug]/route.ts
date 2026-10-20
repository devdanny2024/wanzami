import { NextRequest, NextResponse } from "next/server";
import { authFetch } from "@/lib/authClient";

export async function DELETE(req: NextRequest, { params }: { params: { kind: string; slug: string } }) {
  const authorization = req.headers.get("authorization") ?? "";
  const result = await authFetch(`/admin/discover/art/${encodeURIComponent(params.kind)}/${encodeURIComponent(params.slug)}`, {
    method: "DELETE",
    headers: { Authorization: authorization },
  });
  return NextResponse.json(result.data, { status: result.status });
}
