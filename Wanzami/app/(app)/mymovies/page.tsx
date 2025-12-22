'use client';

import { useEffect, useMemo, useState } from "react";
import { fetchMyPpvTitles } from "@/lib/contentClient";
import { ImageWithFallback } from "@/components/figma/ImageWithFallback";
import { motion } from "motion/react";

type PurchaseItem = {
  title: {
    id: string;
    name: string;
    thumbnailUrl?: string | null;
    posterUrl?: string | null;
    description?: string | null;
    ppvPriceNaira?: number | null;
    ppvCurrency?: string | null;
    isPpv?: boolean;
    type?: string;
    genres?: string[];
  };
  accessExpiresAt?: string | null;
  status?: string;
};

export default function MyMoviesPage() {
  const [active, setActive] = useState<PurchaseItem[]>([]);
  const [expired, setExpired] = useState<PurchaseItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
        const profileId = typeof window !== "undefined" ? localStorage.getItem("activeProfileId") : null;
        if (!token) {
          setError("Please sign in to view your purchases.");
          return;
        }
        const data = await fetchMyPpvTitles({ accessToken: token, profileId });
        if (!mounted) return;
        setActive(data.activePurchases ?? []);
        setExpired(data.expiredPurchases ?? []);
      } catch (e: any) {
        if (mounted) setError(e?.message ?? "Failed to load purchases");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    void run();
    return () => {
      mounted = false;
    };
  }, []);

  const empty = useMemo(() => !loading && !active.length && !expired.length, [loading, active.length, expired.length]);

  const handleOpen = (titleId: string) => {
    if (titleId) {
      window.location.href = `/title/${titleId}`;
    }
  };

  const renderCard = (item: PurchaseItem, isExpired?: boolean) => {
    const img = item.title.thumbnailUrl || item.title.posterUrl || "https://placehold.co/600x900/111111/FD7E14?text=Wanzami";
    const expiresLabel = item.accessExpiresAt
      ? new Date(item.accessExpiresAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })
      : null;
    return (
      <motion.div
        key={item.title.id + String(item.accessExpiresAt)}
        className="group relative cursor-pointer"
        whileHover={{ scale: 1.03 }}
        onClick={() => handleOpen(item.title.id)}
      >
        <div className="relative aspect-video rounded-xl overflow-hidden bg-gray-900">
          <ImageWithFallback src={img} alt={item.title.name} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          {isExpired && (
            <div className="absolute top-2 left-2 text-xs px-2 py-1 rounded bg-black/70 border border-white/10 text-white">
              Expired
            </div>
          )}
          {!isExpired && expiresLabel && (
            <div className="absolute top-2 left-2 text-xs px-2 py-1 rounded bg-black/70 border border-white/10 text-white">
              Expires {expiresLabel}
            </div>
          )}
        </div>
        <div className="mt-2">
          <p className="text-white text-sm font-semibold line-clamp-1">{item.title.name}</p>
          <p className="text-xs text-gray-500 line-clamp-1">
            {item.title.genres?.[0] ?? item.title.type ?? "Title"}{" "}
            {item.title.ppvPriceNaira ? `· ₦${item.title.ppvPriceNaira}` : ""}
          </p>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen bg-black pt-24 md:pt-32 pb-12 px-4 md:px-12 lg:px-16">
      <div className="flex items-center justify-between flex-wrap gap-4 mb-8">
        <div>
          <h1 className="text-white text-3xl md:text-4xl">My Movies</h1>
          <p className="text-gray-400 mt-2">Your purchased titles and access windows.</p>
        </div>
        {active.length > 0 && (
          <div className="text-sm text-gray-500">
            {active.length} active purchase{active.length === 1 ? "" : "s"}
          </div>
        )}
      </div>

      {loading && <p className="text-gray-400">Loading your purchases...</p>}
      {error && <p className="text-red-400">{error}</p>}
      {empty && (
        <div className="text-gray-400">
          No purchases yet. Buy a PPV title to see it here.
        </div>
      )}

      {!loading && !error && active.length > 0 && (
        <div className="space-y-4 mb-10">
          <h2 className="text-white text-xl">Active purchases</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {active.map((item) => renderCard(item, false))}
          </div>
        </div>
      )}

      {!loading && !error && expired.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-white text-xl">Previously purchased</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {expired.map((item) => renderCard(item, true))}
          </div>
        </div>
      )}
    </div>
  );
}
