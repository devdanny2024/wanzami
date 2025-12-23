'use client';

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Input } from "../../../src/components/ui/input";
import { Label } from "../../../src/components/ui/label";
import { Button } from "../../../src/components/ui/button";
import { Loader } from "../../../src/components/ui/loader";
import { toast } from "sonner";

const isStrong = (pwd: string) =>
  pwd.length >= 8 &&
  /[A-Z]/.test(pwd) &&
  /[a-z]/.test(pwd) &&
  /[0-9]/.test(pwd) &&
  /[^A-Za-z0-9]/.test(pwd);

function AcceptInviteContent() {
  const search = useSearchParams();
  const router = useRouter();
  const token = search.get("token") ?? "";
  const emailParam = search.get("email") ?? "";

  const [name, setName] = useState("");
  const [email, setEmail] = useState(emailParam);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isStrong(password)) {
      toast.error("Password must have upper, lower, number, symbol, 8+ chars.");
      return;
    }
    setLoading(true);
    const res = await fetch("/api/admin/invitations/accept", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, email, name, password }),
    });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.message ?? "Invite invalid or expired");
      setLoading(false);
      return;
    }
    localStorage.setItem("accessToken", data.accessToken);
    localStorage.setItem("refreshToken", data.refreshToken);
    localStorage.setItem("deviceId", data.deviceId);
    toast.success("Welcome to Wanzami Admin");
    router.push("/admin/login");
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white flex items-center justify-center px-4">
      <div className="w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-2xl p-8">
        <h1 className="text-2xl font-semibold mb-2">Accept invitation</h1>
        <p className="text-neutral-400 mb-6">
          Set your password to activate your admin account.
        </p>
        <form className="space-y-4" onSubmit={onSubmit}>
          <div>
            <Label className="text-neutral-300">Full name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="mt-1 bg-neutral-950 border-neutral-800"
            />
          </div>
          <div>
            <Label className="text-neutral-300">Email</Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1 bg-neutral-950 border-neutral-800"
            />
          </div>
          <div>
            <Label className="text-neutral-300">Password</Label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="mt-1 bg-neutral-950 border-neutral-800"
              placeholder="Use upper, lower, number, symbol"
            />
          </div>
          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-[#fd7e14] hover:bg-[#ff9940] text-white transition-all disabled:opacity-60"
          >
            <span className="flex items-center gap-2 justify-center">
              {loading && <Loader size={16} />}
              {loading ? "Setting up..." : "Accept invite"}
            </span>
          </Button>
        </form>
      </div>
    </div>
  );
}

export default function AcceptInvitePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-neutral-950 text-white flex items-center justify-center">Loading...</div>}>
      <AcceptInviteContent />
    </Suspense>
  );
}
