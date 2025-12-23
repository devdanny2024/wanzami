'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CustomMediaPlayer } from '@/components/CustomMediaPlayer';
import { fetchPpvAccess, fetchTitleWithEpisodes } from '@/lib/contentClient';

type Title = Awaited<ReturnType<typeof fetchTitleWithEpisodes>>;

const renditionRank: Record<string, number> = {
  R4K: 5,
  R2K: 4,
  R1080: 3,
  R720: 2,
  R360: 1,
};

const convertS3Url = (url?: string | null) => {
  if (!url) return url;
  const trimmed = url.trim();
  if (!trimmed) return trimmed;

  const ensureHttps = (value: string) => {
    if (value.startsWith('https://')) return value;
    if (value.startsWith('http://')) return `https://${value.slice(7)}`;
    if (value.startsWith('//')) return `https:${value}`;
    if (/^[a-z0-9.-]+\.s3\./i.test(value)) return `https://${value}`;
    return value;
  };

  if (trimmed.startsWith('s3://')) {
    const withoutScheme = trimmed.replace('s3://', '');
    const [bucket, ...rest] = withoutScheme.split('/');
    const key = rest.join('/');
    const region = process.env.NEXT_PUBLIC_S3_REGION || 'eu-north-1';
    return ensureHttps(`${bucket}.s3.${region}.amazonaws.com/${key}`);
  }

  return ensureHttps(trimmed);
};

const labelForRendition = (r?: string) => {
  switch (r) {
    case 'R4K':
      return '4K';
    case 'R2K':
      return '2K';
    case 'R1080':
      return '1080p';
    case 'R720':
      return '720p';
    case 'R360':
      return '360p';
    default:
      return r ?? 'Source';
  }
};

const buildSourcesFromAssets = (
  assetsInput?: {
    rendition: 'R4K' | 'R2K' | 'R1080' | 'R720' | 'R360' | string;
    url?: string | null;
    sizeBytes?: number;
    durationSec?: number;
    status?: string;
  }[] | null
) => {
  const assets =
    assetsInput
      ?.map((a) => ({ ...a, url: convertS3Url(a?.url) }))
      .filter((a) => a?.url) ?? [];
  const sorted = assets.sort(
    (a, b) => (renditionRank[b.rendition] ?? 0) - (renditionRank[a.rendition] ?? 0)
  );
  if (sorted.length) {
    return sorted.map((a) => ({
      src: a.url as string,
      label: labelForRendition(a.rendition),
      type: 'video/mp4',
    }));
  }

  return [
    {
      src: 'https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      label: 'Demo',
      type: 'video/mp4',
    },
  ];
};

const fallbackDemo = (id?: string | null) => ({
  id: id ?? Date.now().toString(),
  name: `Title ${id ?? ''}`.trim(),
  posterUrl: 'https://placehold.co/800x450/111111/FD7E14?text=Wanzami',
  thumbnailUrl: 'https://placehold.co/800x450/111111/FD7E14?text=Wanzami',
  trailerUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
  type: 'MOVIE' as const,
  assetVersions: [],
});

export default function PlayerPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const router = useRouter();
  const searchParams = useSearchParams();
  const episodeId = searchParams?.get('episodeId') ?? undefined;
  const startTime = searchParams?.get('startTime')
    ? Number(searchParams.get('startTime'))
    : undefined;

  const [title, setTitle] = useState<Title | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [authInfo, setAuthInfo] = useState<{ token?: string; profileId?: string; deviceId?: string }>({});
  const [country, setCountry] = useState<string | null>(null);
  const [ppvDenied, setPpvDenied] = useState(false);
  const [blocked, setBlocked] = useState(false);

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') ?? undefined : undefined;
    const profile = typeof window !== 'undefined' ? localStorage.getItem('activeProfileId') ?? undefined : undefined;
    const device = typeof window !== 'undefined' ? localStorage.getItem('deviceId') ?? undefined : undefined;
    const storedCountry = typeof window !== 'undefined' ? localStorage.getItem('countryCode') ?? 'NG' : undefined;
    setAuthInfo({ token, profileId: profile, deviceId: device });
    setCountry(storedCountry ?? null);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const detail = await fetchTitleWithEpisodes(id, country ?? undefined);
        if (!cancelled) {
          setTitle(detail ?? fallbackDemo(id));
          try {
            const access = await fetchPpvAccess({
              titleId: id,
              accessToken: authInfo.token,
              profileId: authInfo.profileId,
              country,
            });
            if (!cancelled && access?.isPpv && !access?.hasAccess) {
              // Record violation with record=true
              if (authInfo.token) {
                void fetch(
                  `${process.env.NEXT_PUBLIC_API_BASE ?? process.env.AUTH_SERVICE_URL ?? 'https://api.carlylehub.org/api'}/ppv/access/${id}?record=true`,
                  {
                    headers: { Authorization: `Bearer ${authInfo.token}` },
                  }
                ).catch(() => {});
              }
              setPpvDenied(true);
              setBlocked(true);
            } else {
              setPpvDenied(false);
              setBlocked(false);
            }
          } catch (err: any) {
            console.warn('PPV access check failed', err?.message ?? err);
          }
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err?.message ?? 'Unable to load title');
          setTitle(fallbackDemo(id));
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
  }, [id, country, authInfo.token, authInfo.profileId]);

  const activeEpisode = useMemo(() => {
    const list = title?.episodes ?? [];
    if (!list?.length) return undefined;
    if (episodeId) {
      return list.find((ep) => ep.id === episodeId) ?? list[0];
    }
    return list[0];
  }, [episodeId, title?.episodes]);

  const sources = useMemo(() => {
    if (activeEpisode?.assetVersions?.length) {
      return buildSourcesFromAssets(activeEpisode.assetVersions);
    }
    return buildSourcesFromAssets(title?.assetVersions);
  }, [activeEpisode?.assetVersions, title?.assetVersions]);

  const handleClose = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      router.push('/');
    }
  };

  if (loading && !title) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="animate-spin h-10 w-10 border-2 border-white/30 border-t-white rounded-full mx-auto" />
          <p className="text-sm text-white/70">Loading player...</p>
        </div>
      </div>
    );
  }

  useEffect(() => {
    if (blocked) {
      const timer = setTimeout(() => {
        router.push('/');
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [blocked, router]);

  if (!title || ppvDenied || blocked) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-6 text-center">
        <p className="text-lg font-semibold mb-2">
          {ppvDenied || blocked
            ? "Purchase required to access this title."
            : "Oops, we couldn't load that title."}
        </p>
        <p className="text-sm text-gray-400 mb-4">
          {ppvDenied || blocked
            ? "Please buy the title to continue. This attempt has been logged."
            : error ?? ""}
        </p>
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
    <div className="fixed inset-0 bg-black">
      <CustomMediaPlayer
        title={title.name ?? `Title ${id}`}
        poster={title.thumbnailUrl ?? title.posterUrl}
        previewSpriteUrl={title.previewSpriteUrl}
        previewVttUrl={title.previewVttUrl}
        enableEndCardRating={title.enableEndCardRating ?? true}
        endCreditsStart={title.endCreditsStart ?? undefined}
        sources={sources}
        episodes={title.episodes}
        currentEpisodeId={episodeId ?? activeEpisode?.id}
        startTimeSeconds={startTime}
        titleId={title.id}
        accessToken={authInfo.token}
        profileId={authInfo.profileId}
        deviceId={authInfo.deviceId}
        onClose={handleClose}
      />
    </div>
  );
}
