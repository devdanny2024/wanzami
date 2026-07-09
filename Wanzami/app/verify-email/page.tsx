'use client';

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Mail, CheckCircle, XCircle } from "lucide-react";
import { TopLoader } from "@/components/TopLoader";

function VerifyEmailContent() {
  const router = useRouter();
  const search = useSearchParams();
  const token = search.get("token") ?? "";
  const email = search.get("email") ?? "";
  const [status, setStatus] = useState<"pending" | "success" | "error">("pending");
  const [message, setMessage] = useState("Verifying your email...");
  const [resendMsg, setResendMsg] = useState("");
  const [resendLoading, setResendLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [cooldown]);

  useEffect(() => {
    const verify = async () => {
      if (!token) {
        // User likely arrived from signup with only email param; prompt them to use the emailed link.
        setStatus("pending");
        setMessage(email ? "Check your inbox and click the verification link. You can also resend below." : "Use the link we emailed to verify your account.");
        return;
      }
      if (!email) {
        setStatus("error");
        setMessage("Missing email address for verification.");
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
    void verify();
  }, [token, email]);

  const handleResend = async () => {
    if (cooldown > 0 || !email) return;
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
      setCooldown(45);
    }
    setResendLoading(false);
  };

  const renderIcon = () => {
    if (status === "success") {
      return (
        <div className="cs-border rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-10 h-10 text-emerald-600" />
        </div>
      );
    }
    if (status === "error") {
      return (
        <div className="cs-border rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
          <XCircle className="w-10 h-10 text-cs-rust" />
        </div>
      );
    }
    return (
      <div className="cs-border rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
        <Mail className="w-10 h-10 text-cs-rust" />
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-cs-paper text-cs-ink cs-paper-root flex items-center justify-center px-4 sm:px-6 py-10 auth-root">
      <TopLoader active={status === "pending" || resendLoading} />
      <div className="max-w-md w-full text-center">
        {renderIcon()}
        <h1 className="font-heading text-4xl sm:text-5xl tracking-wide leading-none mb-3 uppercase text-cs-ink">
          {status === "success" ? "Email verified!" : status === "error" ? "Verification failed" : "Verify your email"}
        </h1>
        <p className="text-cs-muted mb-6">{message}</p>

        {status !== "success" && email && (
          <div className="bg-cs-panel cs-border cs-shadow-sm p-6 mb-6 text-left">
            <p className="text-cs-ink mb-3">We sent a verification link to</p>
            <p className="text-cs-ink font-semibold mb-4 break-all">{email}</p>
            <ul className="text-cs-muted space-y-2 list-disc list-inside">
              <li>Check your spam or junk folder</li>
              <li>Make sure you entered the correct email</li>
              <li>The link expires in 24 hours</li>
            </ul>
          </div>
        )}

        {status === "success" ? (
          <button
            onClick={() => router.push("/login")}
            className="w-full bg-cs-rust text-cs-paper font-mono text-sm font-bold uppercase tracking-[0.07em] py-3 cs-shadow-sm transition-transform hover:-translate-y-0.5"
          >
            Continue to login
          </button>
        ) : (
          <div className="space-y-3">
            <button
              onClick={handleResend}
              disabled={resendLoading || cooldown > 0}
              className="w-full bg-cs-rust text-cs-paper font-mono text-sm font-bold uppercase tracking-[0.07em] py-3 cs-shadow-sm transition-transform hover:-translate-y-0.5 disabled:opacity-60"
            >
              {resendLoading ? "Resending..." : cooldown > 0 ? `Resend in ${cooldown}s` : "Resend verification email"}
            </button>
            <button
              onClick={() => router.push("/login")}
              className="w-full bg-cs-paper cs-border text-cs-ink font-mono text-sm font-bold uppercase tracking-[0.07em] py-3 transition-colors hover:bg-cs-ink hover:text-cs-paper"
            >
              Back to login
            </button>
            {resendMsg && <p className="text-sm text-cs-muted">{resendMsg}</p>}
          </div>
        )}
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-cs-paper text-cs-ink cs-paper-root flex items-center justify-center auth-root font-mono text-xs uppercase tracking-[0.08em]">
          Loading...
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
