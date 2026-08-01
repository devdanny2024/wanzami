import { NextRequest, NextResponse } from "next/server";
import { AUTH_SERVICE_URL } from "@/lib/authClient";

// Forwards raw image bytes to the API, which writes them to the media bucket.
// authFetch is not used here because it forces a JSON content type.
export async function POST(req: NextRequest) {
  if (!AUTH_SERVICE_URL) {
    return NextResponse.json({ message: "Auth service base URL not configured" }, { status: 500 });
  }

  const authorization = req.headers.get("authorization") ?? "";
  const contentType = req.headers.get("content-type") ?? "application/octet-stream";
  const kind = req.headers.get("x-asset-kind") ?? "asset";
  const body = await req.arrayBuffer();

  try {
    const res = await fetch(`${AUTH_SERVICE_URL}/admin/assets/upload`, {
      method: "POST",
      headers: {
        Authorization: authorization,
        "Content-Type": contentType,
        "x-asset-kind": kind,
      },
      body,
      cache: "no-store",
    });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (error: any) {
    return NextResponse.json(
      { message: "Upload failed", error: error?.message ?? "fetch failed" },
      { status: 502 }
    );
  }
}
