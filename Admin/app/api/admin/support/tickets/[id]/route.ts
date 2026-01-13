import { NextRequest, NextResponse } from "next/server";
import { authFetch } from "@/lib/authClient";

type Params = { params: { id: string } };

export async function PATCH(req: NextRequest, { params }: Params) {
  const body = await req.json();
  const authorization = req.headers.get("authorization") ?? "";
  const result = await authFetch(`/admin/support/tickets/${params.id}`, {
    method: "PATCH",
    headers: {
      Authorization: authorization,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  return NextResponse.json(result.data, { status: result.status });
}

