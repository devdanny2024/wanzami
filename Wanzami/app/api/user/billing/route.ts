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

export async function GET(req: NextRequest) {
  const result = await authFetch("/user/billing", {
    method: "GET",
    headers: forwardHeaders(req),
  });
  return NextResponse.json(result.data, { status: result.status });
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  const result = await authFetch("/user/billing", {
    method: "PUT",
    headers: forwardHeaders(req),
    body: JSON.stringify(body),
  });
  return NextResponse.json(result.data, { status: result.status });
}
