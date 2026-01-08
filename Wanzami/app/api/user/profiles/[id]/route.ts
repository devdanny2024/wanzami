import { NextRequest, NextResponse } from "next/server";
import { authFetch } from "@/lib/authClient";

const forwardHeaders = (req: NextRequest) => {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  const auth = req.headers.get("authorization");
  if (auth) headers["Authorization"] = auth;
  const deviceId = req.headers.get("x-device-id");
  if (deviceId) headers["x-device-id"] = deviceId;
  return headers;
};

type Params = { params: { id: string } };

export async function PATCH(req: NextRequest, { params }: Params) {
  const body = await req.json();
  const result = await authFetch(`/user/profiles/${params.id}`, {
    method: "PATCH",
    headers: forwardHeaders(req),
    body: JSON.stringify(body),
  });
  return NextResponse.json(result.data, { status: result.status });
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const result = await authFetch(`/user/profiles/${params.id}`, {
    method: "DELETE",
    headers: forwardHeaders(req),
  });
  return NextResponse.json(result.data, { status: result.status });
}

