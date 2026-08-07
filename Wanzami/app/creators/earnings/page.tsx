'use client';

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Coins, Wallet } from "lucide-react";
import { fetchEarnings, getCreatorTokens, type CreatorEarnings } from "@/lib/creatorClient";
import { Card, INK, MUTED, PANEL, PAPER, RUST, Skeleton, Slug } from "../_components/kit";

export default function CreatorEarningsPage() {
  const router = useRouter();
  const [earnings, setEarnings] = useState<CreatorEarnings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { accessToken } = getCreatorTokens();
    if (!accessToken) {
      router.replace("/creators/login");
      return;
    }
    fetchEarnings()
      .then(setEarnings)
      .catch(() => router.replace("/creators/login"))
      .finally(() => setLoading(false));
  }, [router]);

  if (loading) {
    return (
      <div style={{ backgroundColor: PAPER }} className="min-h-screen">
        <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 space-y-6">
          <Skeleton className="h-9 w-64" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {[0, 1, 2].map((i) => <Skeleton key={i} className="h-24" />)}
          </div>
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (!earnings) return null;

  return (
    <div style={{ backgroundColor: PAPER, color: INK }} className="min-h-screen">
      <header className="sticky top-0 z-50 border-b-[3px]" style={{ backgroundColor: PAPER, borderColor: INK }}>
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link href="/creators/dashboard" className="inline-flex items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-[0.12em]">
            <ArrowLeft className="h-3.5 w-3.5" />
            Dashboard
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14 space-y-8">
        <div>
          <Slug>Statement</Slug>
          <h1 className="font-heading mt-1 text-4xl uppercase tracking-wide sm:text-5xl">Earnings</h1>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="border-[2.5px] p-5" style={{ borderColor: INK, backgroundColor: PANEL }}>
            <Slug>Total earned</Slug>
            <p className="font-heading mt-1.5 text-4xl tracking-wide">₦{earnings.totalEarnedNaira.toLocaleString()}</p>
          </div>
          <div className="border-[2.5px] p-5" style={{ borderColor: INK, backgroundColor: PANEL }}>
            <Slug>Paid out</Slug>
            <p className="font-heading mt-1.5 text-4xl tracking-wide">₦{earnings.totalPaidNaira.toLocaleString()}</p>
          </div>
          <div className="border-[2.5px] p-5" style={{ borderColor: INK, backgroundColor: INK }}>
            <Slug tone="rust">Balance</Slug>
            <p className="font-heading mt-1.5 text-4xl tracking-wide" style={{ color: PAPER }}>
              ₦{earnings.balanceNaira.toLocaleString()}
            </p>
          </div>
        </div>

        <Card>
          <Slug>By title</Slug>
          <div className="mt-3">
            {earnings.byTitle.length === 0 ? (
              <p className="text-sm" style={{ color: MUTED }}>Nothing live yet.</p>
            ) : (
              earnings.byTitle.map((t) => (
                <div key={t.submissionId} className="flex items-center justify-between py-2.5" style={{ borderBottom: "1px solid #d8cbac" }}>
                  <span className="inline-flex items-center gap-2 text-sm font-medium">
                    <Coins className="h-3.5 w-3.5" style={{ color: RUST }} />
                    {t.title}
                  </span>
                  <span className="font-mono text-sm font-bold">₦{t.revenueNaira.toLocaleString()}</span>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-2.5">
            <Wallet className="h-4 w-4" style={{ color: RUST }} />
            <Slug>Payout history</Slug>
          </div>
          <div className="mt-3">
            {earnings.payouts.length === 0 ? (
              <p className="text-sm" style={{ color: MUTED }}>No payouts logged yet.</p>
            ) : (
              earnings.payouts.map((p) => (
                <div key={p.id} className="flex items-start justify-between gap-4 py-2.5" style={{ borderBottom: "1px solid #d8cbac" }}>
                  <div>
                    <p className="font-mono text-sm font-bold">₦{p.amountNaira.toLocaleString()}</p>
                    {p.note && <p className="text-sm" style={{ color: MUTED }}>{p.note}</p>}
                  </div>
                  <span className="font-mono text-[11px]" style={{ color: MUTED }}>
                    {new Date(p.paidAt).toLocaleDateString()}
                  </span>
                </div>
              ))
            )}
          </div>
        </Card>

        <p className="text-sm" style={{ color: MUTED }}>
          Payouts are logged manually by the Wanzami team for now, this balance is a statement, not an automatic
          transfer. Add your bank details in Settings so we know where to send it.
        </p>
      </main>
    </div>
  );
}

