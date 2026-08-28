import { NextRequest, NextResponse } from "next/server";
import { authFetch } from "@/lib/authClient";

export async function DELETE(req: NextRequest, { params }: { params: { currency: string } }) {
  const authorization = req.headers.get("authorization") ?? "";
  const result = await authFetch(`/admin/ppv/fx-rates/${params.currency}`, {
    method: "DELETE",
    headers: { Authorization: authorization },
  });
  if (result.status === 204) return new NextResponse(null, { status: 204 });
  return NextResponse.json(result.data, { status: result.status });
}
