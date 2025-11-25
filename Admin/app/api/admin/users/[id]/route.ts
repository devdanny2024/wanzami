import { NextRequest, NextResponse } from "next/server";
import { authFetch } from "@/lib/authClient";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await req.json();
  const authorization = req.headers.get("authorization") ?? "";
  const result = await authFetch(`/admin/users/${params.id}/role`, {
    method: "PATCH",
    headers: {
      Authorization: authorization,
    },
    body: JSON.stringify(body),
  });
  return NextResponse.json(result.data, { status: result.status });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const authorization = req.headers.get("authorization") ?? "";
  const result = await authFetch(`/admin/users/${params.id}`, {
    method: "DELETE",
    headers: {
      Authorization: authorization,
    },
  });
  return NextResponse.json(result.data, { status: result.status });
}
