'use client';

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { motion } from "motion/react";
import { Instagram, Twitter, Youtube, Globe, Film } from "lucide-react";
import { fetchPublicCreatorProfile, type PublicCreatorProfile } from "@/lib/creatorClient";
import { INK, Logo, MUTED, PANEL, PAPER, RUST, Skeleton } from "../_components/kit";

// Public page, no auth gate: this is what a viewer sees when they click
// through from "About the creator" on a title page.
export default function PublicCreatorProfilePage() {
  const params = useParams();
  const id = params.id as string;

  const [profile, setProfile] = useState<PublicCreatorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchPublicCreatorProfile(id)
      .then((p) => !cancelled && setProfile(p))
      .catch(() => !cancelled && setNotFound(true))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return (
      <div style={{ backgroundColor: PAPER }} className="min-h-screen">
        <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 space-y-6">
          <Skeleton className="h-24 w-24 rounded-full" />
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-20 w-full" />
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Skeleton className="h-48" />
            <Skeleton className="h-48" />
            <Skeleton className="h-48" />
            <Skeleton className="h-48" />
          </div>
        </div>
      </div>
    );
  }

  if (notFound || !profile) {
    return (
      <div style={{ backgroundColor: PAPER, color: INK }} className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-sm font-medium" style={{ color: RUST }}>Creator not found.</p>
          <Link href="/" className="mt-4 inline-block font-mono text-xs uppercase underline">
            Back to Wanzami
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: PAPER, color: INK }} className="min-h-screen">
      <header className="border-b-[3px]" style={{ borderColor: INK }}>
        <div className="mx-auto flex max-w-4xl items-center px-4 py-3 sm:px-6">
          <Link href="/" aria-label="Wanzami">
            <Logo />
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-14 sm:px-6 sm:py-20">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col items-start gap-5 sm:flex-row sm:items-center"
        >
          {profile.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profile.avatarUrl}
              alt={profile.name}
              className="h-24 w-24 shrink-0 rounded-full object-cover border-[3px]"
              style={{ borderColor: INK }}
            />
          ) : (
            <div
              className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full border-[3px] font-heading text-4xl"
              style={{ borderColor: INK, backgroundColor: PANEL }}
            >
              {profile.name.charAt(0)}
            </div>
          )}
          <div className="min-w-0">
            <p className="font-mono text-[11px] font-bold uppercase tracking-[0.12em]" style={{ color: MUTED }}>
              Wanzami creator
            </p>
            <h1 className="font-heading mt-1 text-4xl uppercase tracking-wide sm:text-5xl">{profile.name}</h1>
            {profile.bio && (
              <p className="mt-3 max-w-xl text-sm leading-relaxed" style={{ color: "#3c342a" }}>
                {profile.bio}
              </p>
            )}
            <div className="mt-4 flex items-center gap-4">
              {profile.instagram && (
                <a href={profile.instagram} target="_blank" rel="noreferrer" aria-label="Instagram">
                  <Instagram className="h-5 w-5" style={{ color: RUST }} />
                </a>
              )}
              {profile.youtube && (
                <a href={profile.youtube} target="_blank" rel="noreferrer" aria-label="YouTube">
                  <Youtube className="h-5 w-5" style={{ color: RUST }} />
                </a>
              )}
              {profile.twitter && (
                <a href={profile.twitter} target="_blank" rel="noreferrer" aria-label="Twitter">
                  <Twitter className="h-5 w-5" style={{ color: RUST }} />
                </a>
              )}
              {profile.website && (
                <a href={profile.website} target="_blank" rel="noreferrer" aria-label="Website">
                  <Globe className="h-5 w-5" style={{ color: RUST }} />
                </a>
              )}
            </div>
          </div>
        </motion.div>

        <div className="mt-12">
          <p className="font-mono text-[11px] font-bold uppercase tracking-[0.12em]" style={{ color: MUTED }}>
            {profile.titles.length > 0 ? `Films on Wanzami (${profile.titles.length})` : "Films on Wanzami"}
          </p>

          {profile.titles.length === 0 ? (
            <div className="mt-4 flex flex-col items-center gap-3 border-[2px] border-dashed p-10 text-center" style={{ borderColor: "#d8cbac" }}>
              <Film className="h-6 w-6" style={{ color: MUTED }} />
              <p className="text-sm" style={{ color: MUTED }}>Nothing published yet.</p>
            </div>
          ) : (
            <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
              {profile.titles.map((t, i) => (
                <motion.div
                  key={t.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.05, ease: [0.16, 1, 0.3, 1] }}
                >
                  <Link href={`/title/${t.id}`} className="group block">
                    <div className="border-2 overflow-hidden" style={{ borderColor: INK, backgroundColor: PANEL }}>
                      {t.posterUrl || t.thumbnailUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={t.posterUrl ?? t.thumbnailUrl ?? undefined}
                          alt={t.name}
                          className="aspect-[2/3] w-full object-cover transition-transform group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex aspect-[2/3] w-full items-center justify-center">
                          <Film className="h-6 w-6" style={{ color: MUTED }} />
                        </div>
                      )}
                    </div>
                    <p className="mt-2 truncate text-sm font-medium">{t.name}</p>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
