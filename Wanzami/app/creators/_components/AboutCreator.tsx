'use client';

import { useEffect, useState } from "react";
import Link from "next/link";
import { Instagram, Twitter, Youtube, Globe } from "lucide-react";
import { fetchCreatorForTitle, type TitleCreator } from "@/lib/creatorClient";
import { INK, MUTED, PAPER, RUST } from "./kit";

// Additive, self-contained: rendered below the main title detail page
// without touching that component's internals. Renders nothing if the
// title has no linked creator, or the lookup fails.
export function AboutCreator({ titleId }: { titleId: string }) {
  const [creator, setCreator] = useState<TitleCreator | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchCreatorForTitle(titleId)
      .then((c) => !cancelled && setCreator(c))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [titleId]);

  if (!creator) return null;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <div className="border-[2px] p-5" style={{ borderColor: INK, backgroundColor: PAPER }}>
        <p className="font-mono text-[10px] font-bold uppercase tracking-[0.12em]" style={{ color: MUTED }}>
          About the creator
        </p>
        <div className="mt-3 flex items-start gap-4">
          {creator.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={creator.avatarUrl} alt={creator.name} className="h-14 w-14 shrink-0 rounded-full object-cover border-2" style={{ borderColor: INK }} />
          ) : (
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2 font-heading text-xl" style={{ borderColor: INK, backgroundColor: "#f7f1e3" }}>
              {creator.name.charAt(0)}
            </div>
          )}
          <div className="min-w-0">
            <Link href={`/creators/${creator.id}`} className="font-heading text-xl uppercase tracking-wide hover:underline">
              {creator.name}
            </Link>
            {creator.bio && <p className="mt-1 text-sm" style={{ color: "#3c342a" }}>{creator.bio}</p>}
            <div className="mt-2 flex items-center gap-3">
              {creator.instagram && (
                <a href={creator.instagram} target="_blank" rel="noreferrer" aria-label="Instagram">
                  <Instagram className="h-4 w-4" style={{ color: RUST }} />
                </a>
              )}
              {creator.youtube && (
                <a href={creator.youtube} target="_blank" rel="noreferrer" aria-label="YouTube">
                  <Youtube className="h-4 w-4" style={{ color: RUST }} />
                </a>
              )}
              {creator.twitter && (
                <a href={creator.twitter} target="_blank" rel="noreferrer" aria-label="Twitter">
                  <Twitter className="h-4 w-4" style={{ color: RUST }} />
                </a>
              )}
              {creator.website && (
                <a href={creator.website} target="_blank" rel="noreferrer" aria-label="Website">
                  <Globe className="h-4 w-4" style={{ color: RUST }} />
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
