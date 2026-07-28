import { NextRequest, NextResponse } from "next/server";
import { authFetch } from "@/lib/authClient";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const authorization = req.headers.get("authorization") ?? "";
  const result = await authFetch(`/admin/blog/posts/${params.id}`, {
    method: "GET",
    headers: { Authorization: authorization },
  });
  return NextResponse.json(result.data, { status: result.status });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const authorization = req.headers.get("authorization") ?? "";
  const body = await req.text();
  const result = await authFetch(`/admin/blog/posts/${params.id}`, {
    method: "PATCH",
    headers: { Authorization: authorization },
    body,
  });
  return NextResponse.json(result.data, { status: result.status });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const authorization = req.headers.get("authorization") ?? "";
  const result = await authFetch(`/admin/blog/posts/${params.id}`, {
    method: "DELETE",
    headers: { Authorization: authorization },
  });
  if (result.status === 204) return new NextResponse(null, { status: 204 });
  return NextResponse.json(result.data, { status: result.status });
}
