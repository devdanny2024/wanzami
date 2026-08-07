'use client';

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createDraft, getCreatorTokens } from "@/lib/creatorClient";
import { INK, Logo, PAPER, RUST } from "../../_components/kit";

export default function NewSubmissionPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const { accessToken } = getCreatorTokens();
    if (!accessToken) {
      router.replace("/creators/login");
      return;
    }
    createDraft("Untitled film")
      .then((draft) => router.replace(`/creators/submissions/${draft.id}`))
      .catch((err: any) => setError(err?.message ?? "Could not start a new submission"));
  }, [router]);

  return (
    <div style={{ backgroundColor: PAPER, color: INK }} className="min-h-screen flex flex-col items-center justify-center gap-4 px-4">
      <Logo className="h-8 w-auto" />
      {error ? (
        <div className="text-center">
          <p className="text-sm font-medium" style={{ color: RUST }}>{error}</p>
          <button onClick={() => router.replace("/creators/dashboard")} className="mt-4 font-mono text-xs uppercase underline">
            Back to dashboard
          </button>
        </div>
      ) : (
        <p className="font-mono text-sm uppercase tracking-widest">Setting up…</p>
      )}
    </div>
  );
}
