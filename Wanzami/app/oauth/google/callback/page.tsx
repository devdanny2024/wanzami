'use client';

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { TopLoader } from "@/components/TopLoader";

type Status = "pending" | "success" | "error";

export default function GoogleCallbackPage() {
  const search = useSearchParams();
  const router = useRouter();
  const code = search.get("code");
  const state = search.get("state");
  const [status, setStatus] = useState<Status>("pending");
  const [message, setMessage] = useState("Connecting your Google account...");

  useEffect(() => {
    const handleExchange = async () => {
      if (!code) {
        setStatus("error");
        setMessage("Missing authorization code from Google.");
        return;
      }
      try {
        const redirectUri =
          typeof window !== "undefined"
            ? `${window.location.origin}/oauth/google/callback`
            : undefined;
        const res = await fetch("/api/auth/google/callback", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code, state, redirectUri }),
        });
        const data = await res.json();
        if (!res.ok) {
          const msg = data?.message ?? "Unable to complete Google sign-in.";
          setStatus("error");
          setMessage(msg);
          return;
        }
        if (data.accessToken) localStorage.setItem("accessToken", data.accessToken);
        if (data.refreshToken) localStorage.setItem("refreshToken", data.refreshToken);
        if (data.deviceId) localStorage.setItem("deviceId", data.deviceId);
        setStatus("success");
        setMessage("Signed in with Google. Redirecting...");
        setTimeout(() => {
          router.replace("/");
          window.location.href = "/";
        }, 500);
      } catch (err) {
        setStatus("error");
        setMessage("Something went wrong while connecting Google. Please try again.");
      }
    };
    void handleExchange();
  }, [code, state, router]);

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-6">
      <TopLoader active />
      <div className="max-w-md w-full bg-white/5 border border-white/10 rounded-2xl p-8 text-center">
        <h1 className="text-2xl font-semibold mb-3">Google Sign-In</h1>
        <p className="text-gray-300 mb-6">{message}</p>
        {status === "error" && (
          <a
            href="/login"
            className="inline-flex items-center justify-center px-6 py-3 bg-[#fd7e14] text-white rounded-xl font-semibold hover:bg-[#e86f0f] transition-colors"
          >
            Back to login
          </a>
        )}
      </div>
    </div>
  );
}
