'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { MovieDetailPage } from '@/components/MovieDetailPage';
import { fetchPpvAccess, fetchTitleWithEpisodes, initiatePpvPurchase, type PpvAccess } from '@/lib/contentClient';

type Title = Awaited<ReturnType<typeof fetchTitleWithEpisodes>>;

const mapToDetailMovie = (title: Title | null, fallbackId: string) => {
  if (!title) {
    return {
      id: fallbackId,
      backendId: fallbackId,
      title: `Title ${fallbackId}`,
      image: 'https://placehold.co/1200x675/111111/FD7E14?text=Wanzami',
      rating: 'PG',
      duration: '2h 00m',
      year: '2024',
      genre: 'Action',
      description: 'Content coming soon.',
      maturityRating: 'PG',
      episodes: [],
      seasons: [],
    };
  }
  const durationMinutes = title.runtimeMinutes ?? 0;
  const hours = Math.floor(durationMinutes / 60);
  const minutes = durationMinutes % 60;
  const durationLabel =
    durationMinutes > 0 ? `${hours}h ${minutes.toString().padStart(2, '0')}m` : undefined;
  return {
    id: title.id,
    backendId: title.id,
    title: title.name,
    image: title.thumbnailUrl || title.posterUrl || 'https://placehold.co/1200x675/111111/FD7E14?text=Wanzami',
    rating: title.maturityRating ?? 'PG',
    duration: durationLabel ?? '2h 00m',
    year: title.releaseYear ? String(title.releaseYear) : '2024',
    genre: title.genres?.[0] ?? 'Drama',
    description: title.description,
    maturityRating: title.maturityRating,
    episodes: title.episodes ?? [],
    seasons: (title as any).seasons ?? [],
    type: title.type,
    posterUrl: title.posterUrl,
    thumbnailUrl: title.thumbnailUrl,
    trailerUrl: title.trailerUrl,
    assetVersions: title.assetVersions,
  };
};

export default function TitlePage({ params }: { params: { id: string } }) {
  const { id } = params;
  const router = useRouter();
  const [title, setTitle] = useState<Title | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [country, setCountry] = useState<string | null>(null);
  const [ppvAccess, setPpvAccess] = useState<PpvAccess | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [profileId, setProfileId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = window.localStorage.getItem('countryCode');
      const token = window.localStorage.getItem('accessToken');
      const profile = window.localStorage.getItem('activeProfileId');
      setCountry(stored ?? 'NG');
      setAccessToken(token);
      setProfileId(profile);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const detail = await fetchTitleWithEpisodes(id, country ?? undefined);
        if (!cancelled) {
          setTitle(detail ?? null);
          if (detail) {
            try {
              const access = await fetchPpvAccess({
                titleId: id,
                accessToken,
                profileId,
                country,
              });
              if (!cancelled) setPpvAccess(access);
            } catch (err: any) {
              // Non-blocking; still render title
              if (!cancelled) setPpvAccess(null);
              console.warn('PPV access check failed', err?.message ?? err);
            }
          }
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err?.message ?? 'Unable to load title');
          setTitle(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    if (country !== null) {
      void load();
    }
    return () => {
      cancelled = true;
    };
  }, [id, country]);

  const detailMovie = useMemo(() => mapToDetailMovie(title, id), [title, id]);

  if (loading && !title) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="animate-spin h-10 w-10 border-2 border-white/30 border-t-white rounded-full mx-auto" />
          <p className="text-sm text-white/70">Loading title...</p>
        </div>
      </div>
    );
  }

  if (!detailMovie) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-6">
        <p className="text-lg font-semibold mb-2">Oops, we couldn't load that title.</p>
        {error ? <p className="text-sm text-gray-400 mb-4">{error}</p> : null}
        <button
          className="px-4 py-2 rounded-lg bg-[#fd7e14] hover:bg-[#e86f0f] text-white"
          onClick={() => router.push('/')}
        >
          Go Home
        </button>
      </div>
    );
  }

  return (
    <MovieDetailPage
      movie={detailMovie}
      ppvInfo={{
        isPpv: Boolean(title?.isPpv),
        hasAccess: ppvAccess?.hasAccess ?? !title?.isPpv,
        priceNaira: title?.ppvPriceNaira ?? ppvAccess?.priceNaira,
        currency: title?.ppvCurrency ?? ppvAccess?.currency ?? 'NGN',
        userPpvBanned: ppvAccess?.userPpvBanned ?? false,
      }}
      onClose={() => router.push('/')}
      onPlayClick={(movie) => {
        const targetId = movie?.backendId ?? movie?.id ?? id;
        const episodeId =
          movie?.currentEpisode?.id ??
          (movie?.type === 'SERIES' && Array.isArray(movie?.episodes) ? movie.episodes[0]?.id : undefined);
        const url = episodeId ? `/player/${targetId}?episodeId=${encodeURIComponent(episodeId)}` : `/player/${targetId}`;
        router.push(url);
      }}
      onBuyClick={async () => {
        if (!accessToken) {
          router.push('/login');
          return;
        }
        try {
          const res = await fetchPpvAccess({
            titleId: id,
            accessToken,
            profileId,
            country,
          });
          if (res?.hasAccess) {
            // Already purchased; just play
            const url = `/player/${id}`;
            router.push(url);
            return;
          }
          const { authorizationUrl } = await initiatePpvPurchase({
            titleId: id,
            accessToken,
            profileId,
          });
          if (authorizationUrl) {
            window.location.href = authorizationUrl;
          }
        } catch (e: any) {
          alert(e?.message ?? 'Unable to start purchase');
        }
      }}
    />
  );
}
