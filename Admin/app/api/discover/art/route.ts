import { NextResponse } from "next/server";
import { authFetch } from "@/lib/authClient";

// Public: the Admin reads the same override map the website uses.
export async function GET() {
  const result = await authFetch("/discover/art", { method: "GET" });
  return NextResponse.json(result.data, { status: result.status });
}
