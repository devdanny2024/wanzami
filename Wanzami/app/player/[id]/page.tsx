'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CustomMediaPlayer } from '@/components/CustomMediaPlayer';
import { fetchTitleWithEpisodes } from '@/lib/contentClient';

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

const buildSources = (movie?: Title | null) => {
  if (!movie) return [];
  const assets =
    movie.assetVersions
      ?.map((a) => ({ ...a, url: convertS3Url(a?.url) }))
      .filter((a) => a?.url) ?? [];
  const sorted = assets.sort(
    (a, b) => (renditionRank[b.rendition] ?? 0) - (renditionRank[a.rendition] ?? 0)
  );
  if (sorted.length) {
    const mapped = sorted.map((a) => ({
      src: a.url as string,
      label: labelForRendition(a.rendition),
      type: 'video/mp4',
    }));
    if (movie.trailerUrl) {
      mapped.push({
        src: convertS3Url(movie.trailerUrl) ?? movie.trailerUrl,
        label: 'Trailer',
        type: 'video/mp4',
      });
    }
    return mapped;
  }
  if (movie.trailerUrl) {
    return [
      {
        src: convertS3Url(movie.trailerUrl) ?? movie.trailerUrl,
        label: 'Trailer',
        type: 'video/mp4',
      },
    ];
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

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') ?? undefined : undefined;
    const profile = typeof window !== 'undefined' ? localStorage.getItem('activeProfileId') ?? undefined : undefined;
    const device = typeof window !== 'undefined' ? localStorage.getItem('deviceId') ?? undefined : undefined;
    setAuthInfo({ token, profileId: profile, deviceId: device });
  }, []);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const detail = await fetchTitleWithEpisodes(id);
        if (!cancelled) {
          setTitle(detail ?? fallbackDemo(id));
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
    void load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const sources = useMemo(() => buildSources(title), [title]);

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

  if (!title) {
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
    <div className="fixed inset-0 bg-black">
      <CustomMediaPlayer
        title={title.name ?? `Title ${id}`}
        poster={title.thumbnailUrl ?? title.posterUrl}
        sources={sources}
        episodes={title.episodes}
        currentEpisodeId={episodeId}
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
