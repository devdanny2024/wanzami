'use client';

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { TopLoader } from "@/components/TopLoader";

function VerifyEmailContent() {
  const search = useSearchParams();
  const token = search.get("token") ?? "";
  const email = search.get("email") ?? "";
  const [status, setStatus] = useState<"pending" | "success" | "error">(
    "pending"
  );
  const [message, setMessage] = useState("Verifying your email...");
  const [resendMsg, setResendMsg] = useState("");
  const [resendLoading, setResendLoading] = useState(false);

  useEffect(() => {
    const verify = async () => {
      if (!token || !email) {
        setStatus("error");
        setMessage("Missing verification token.");
        return;
      }
      const res = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus("error");
        setMessage(data.message ?? "Verification failed.");
        return;
      }
      setStatus("success");
      setMessage("Email verified. You can now log in.");
    };
    verify();
  }, [token, email]);

  const handleResend = async () => {
    setResendMsg("");
    setResendLoading(true);
    const res = await fetch("/api/auth/resend-verification", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    if (!res.ok) {
      setResendMsg(data.message ?? "Unable to resend. Try again.");
    } else {
      setResendMsg("Verification email resent. Check your inbox.");
    }
    setResendLoading(false);
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-6">
      <TopLoader active={status === "pending" || resendLoading} />
      <div className="max-w-md w-full bg-white/5 border border-white/10 rounded-2xl p-8 text-center">
        <h1 className="text-2xl font-semibold mb-4">Email Verification</h1>
        <p className="text-gray-300 mb-6">{message}</p>
        {status === "success" && (
          <a
            href="/login"
            className="inline-flex items-center justify-center px-6 py-3 bg-[#fd7e14] text-white rounded-xl font-semibold hover:bg-[#e86f0f] transition-colors"
          >
            Go to Login
          </a>
        )}
        {status !== "success" && email && (
          <div className="mt-6 space-y-2">
            <button
              onClick={handleResend}
              disabled={resendLoading}
              className="w-full inline-flex items-center justify-center px-6 py-3 bg-white/10 hover:bg-white/15 text-white rounded-xl font-semibold border border-white/15 transition-colors disabled:opacity-60"
            >
              {resendLoading ? "Resending..." : "Resend verification email"}
            </button>
            {resendMsg && (
              <p className="text-sm text-gray-300">{resendMsg}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black text-white flex items-center justify-center">Loading...</div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}
