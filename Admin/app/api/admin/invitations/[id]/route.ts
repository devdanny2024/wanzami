import { NextRequest, NextResponse } from "next/server";
import { authFetch } from "@/lib/authClient";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const authorization = _req.headers.get("authorization") ?? "";
  const result = await authFetch(`/admin/invitations/${params.id}`, {
    method: "DELETE",
    headers: {
      Authorization: authorization,
    },
  });
  return NextResponse.json(result.data, { status: result.status });
}
