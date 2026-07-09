'use client';

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { TopLoader } from "@/components/TopLoader";

type Status = "pending" | "success" | "error";

function CallbackContent() {
  const search = useSearchParams();
  const router = useRouter();
  const code = search.get("code");
  const state = search.get("state");
  const [status, setStatus] = useState<Status>("pending");
  const [message, setMessage] = useState("Connecting your Google account...");
  const [errorCode, setErrorCode] = useState<string | null>(null);

  useEffect(() => {
    const handleExchange = async () => {
      if (!code) {
        setStatus("error");
        setMessage("Missing authorization code from Google.");
        return;
      }
      try {
        const apiBase =
          process.env.NEXT_PUBLIC_API_BASE ||
          process.env.AUTH_SERVICE_URL ||
          "https://api.carlylehub.org/api";
        const redirectUri =
          typeof window !== "undefined"
            ? `${window.location.origin}/oauth/google/callback`
            : undefined;
        const res = await fetch(`${apiBase.replace(/\/+$/, "")}/auth/google/callback`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code, state, redirectUri }),
        });
        const data = await res.json();
        if (!res.ok) {
          const apiCode = data?.code as string | undefined;
          const msg =
            apiCode === "ACCOUNT_NOT_FOUND_FOR_GOOGLE"
              ? "We couldn't complete Google sign-in for this email. Please try signing up first, then use Google to sign in."
              : apiCode === "AUTH_TEMPORARILY_UNAVAILABLE"
                ? "Login is temporarily unavailable because the service is having a database issue. Please try again shortly."
                : "Google sign-in is temporarily unavailable. Please try again later.";
          setStatus("error");
          setMessage(msg);
          setErrorCode(apiCode ?? null);
          return;
        }
        if (data.accessToken) localStorage.setItem("accessToken", data.accessToken);
        if (data.refreshToken) localStorage.setItem("refreshToken", data.refreshToken);
        if (data.deviceId) localStorage.setItem("deviceId", data.deviceId);
        setStatus("success");
        const needsOnboarding = Boolean(data.needsOnboarding);
        if (needsOnboarding) {
          setMessage("Welcome to Wanzami. Let\u2019s personalize your experience.");
          setTimeout(() => {
            router.replace("/onboarding");
            window.location.href = "/onboarding";
          }, 500);
        } else {
          setMessage("Signed in with Google. Redirecting...");
          setTimeout(() => {
            router.replace("/");
            window.location.href = "/";
          }, 500);
        }
       } catch (err) {
        setStatus("error");
        setMessage("Something went wrong while connecting Google. Please try again.");
        setErrorCode(null);
      }
    };
    void handleExchange();
  }, [code, state, router]);

  return (
    <div className="min-h-screen bg-cs-paper text-cs-ink cs-paper-root flex flex-col items-center justify-center px-6">
      <TopLoader active />
      <div className="max-w-md w-full bg-cs-panel cs-border cs-shadow p-8 text-center">
        <h1 className="font-heading text-3xl tracking-wide uppercase text-cs-ink mb-3">Google Sign-In</h1>
        <p className="text-cs-muted mb-6">{message}</p>
        {status === "error" && (
          <div className="flex flex-col items-center gap-3">
            <a
              href="/login"
              className="inline-flex items-center justify-center px-6 py-3 bg-cs-rust text-cs-paper font-mono text-sm font-bold uppercase tracking-[0.07em] cs-shadow-sm transition-transform hover:-translate-y-0.5"
            >
              Back to login
            </a>
            {errorCode === "ACCOUNT_NOT_FOUND_FOR_GOOGLE" && (
              <a
                href="/register"
                className="inline-flex items-center justify-center px-6 py-3 cs-border text-cs-ink font-mono text-xs font-bold uppercase tracking-[0.07em] hover:bg-cs-ink hover:text-cs-paper transition-colors"
              >
                Go to sign up
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export const dynamic = "force-dynamic";

export default function GoogleCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-cs-paper text-cs-ink cs-paper-root flex flex-col items-center justify-center px-6">
          <TopLoader active />
          <p className="mt-3 font-mono text-xs uppercase tracking-[0.08em] text-cs-muted">Preparing Google sign-in...</p>
        </div>
      }
    >
      <CallbackContent />
    </Suspense>
  );
}
