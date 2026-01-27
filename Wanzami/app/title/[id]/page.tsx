'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { MovieDetailPage } from '@/components/MovieDetailPage';
import { FlutterwaveCheckoutModal } from '@/components/FlutterwaveCheckoutModal';
import { PpvPaymentChoiceModal } from '@/components/PpvPaymentChoiceModal';
import {
  fetchPpvAccess,
  fetchTitleWithEpisodes,
  initiatePpvPurchase,
  initiatePaystackPurchase,
  verifyPaystackPurchase,
  verifyFlutterwavePurchase,
  type PpvAccess,
} from '@/lib/contentClient';

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

  const isLikelyVideo = (u?: string | null) =>
    typeof u === 'string' &&
    ['.mp4', '.m3u8', '.mov', '.webm'].some((ext) => u.toLowerCase().includes(ext));

  const shortTrailer =
    (title as any)?.shortTrailerUrl && isLikelyVideo((title as any).shortTrailerUrl)
      ? (title as any).shortTrailerUrl
      : isLikelyVideo(title.previewSpriteUrl)
        ? title.previewSpriteUrl
        : null;

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
    shortTrailerUrl: shortTrailer,
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
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [buyLoading, setBuyLoading] = useState(false);
  const [paymentChoiceOpen, setPaymentChoiceOpen] = useState(false);
  const useV4 = process.env.NEXT_PUBLIC_PPV_FLOW === 'v4';

  const loadFlutterwaveScript = () =>
    new Promise<void>((resolve, reject) => {
      if (typeof window === 'undefined') return resolve();
      if ((window as any).FlutterwaveCheckout) return resolve();
      const existing = document.getElementById('flutterwave-v3-js');
      if (existing) {
        existing.addEventListener('load', () => resolve());
        return;
      }
      const script = document.createElement('script');
      script.id = 'flutterwave-v3-js';
      script.src = 'https://checkout.flutterwave.com/v3.js';
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Unable to load Flutterwave'));
      document.body.appendChild(script);
    });

  const markOwned = (titleId: string) => {
    if (typeof window === 'undefined') return;
    try {
      const raw = window.localStorage.getItem('wanzami:ppvOwned') ?? '[]';
      const list = JSON.parse(raw) as Array<string>;
      const key = String(titleId);
      if (!list.includes(key)) {
        list.push(key);
        window.localStorage.setItem('wanzami:ppvOwned', JSON.stringify(list));
      }
    } catch {
      // Ignore storage errors (private mode, quota, etc).
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = window.localStorage.getItem('countryCode');
      const token = window.localStorage.getItem('accessToken');
      const profile = window.localStorage.getItem('activeProfileId');
      setCountry(stored ?? 'NG');
      setAccessToken(token);
      setProfileId(profile);

      // If there is no access token at all, unauthenticated users
      // should not be able to open title pages directly. Redirect
      // them back to the splash/auth flow.
      if (!token) {
        router.replace('/splash');
      }
    }
  }, [router]);

  useEffect(() => {
    if (!accessToken) return;
    if (typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    const txRef = url.searchParams.get('tx_ref');
    const transactionId = url.searchParams.get('transaction_id');
    const status = url.searchParams.get('status');
    if (!txRef && !transactionId) return;

    const finalize = async () => {
      try {
        await verifyFlutterwavePurchase({
          accessToken,
          transactionId: transactionId ?? undefined,
          txRef: txRef ?? undefined,
        });
        const access = await fetchPpvAccess({
          titleId: id,
          accessToken,
          profileId,
          country,
        });
        setPpvAccess(access);
        if (access?.hasAccess) {
          markOwned(id);
          router.push(`/player/${id}`);
        }
      } catch (err: any) {
        console.warn('Flutterwave verify after redirect failed', err?.message ?? err);
      } finally {
        url.searchParams.delete('tx_ref');
        url.searchParams.delete('transaction_id');
        url.searchParams.delete('status');
        window.history.replaceState({}, '', url.toString());
      }
    };

    if (!status || status.toLowerCase() === 'successful') {
      void finalize();
    }
  }, [accessToken, id, profileId, country, router]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const detail = await fetchTitleWithEpisodes(id, {
          country: country ?? undefined,
          accessToken,
          profileId,
        });
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
    if (country !== null && accessToken) {
      void load();
    }
    return () => {
      cancelled = true;
    };
  }, [id, country, accessToken, profileId]);

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

  const priceValue = title?.ppvPriceNaira ?? ppvAccess?.priceNaira ?? null;
  const currency = title?.ppvCurrency ?? ppvAccess?.currency ?? 'NGN';
  const amountLabel = priceValue ? priceValue.toLocaleString() : '';

  return (
    <>
      <MovieDetailPage
        movie={detailMovie}
        ppvInfo={{
          isPpv: Boolean(title?.isPpv),
          hasAccess: ppvAccess?.hasAccess ?? !title?.isPpv,
          priceNaira: priceValue,
          currency,
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
        onBuyClick={() => {
          if (!accessToken) {
            router.push('/login');
            return;
          }
          if (ppvAccess?.hasAccess) {
            router.push(`/player/${id}`);
            return;
          }
          setPaymentChoiceOpen(true);
        }}
      />
      <PpvPaymentChoiceModal
        open={paymentChoiceOpen}
        onOpenChange={setPaymentChoiceOpen}
        onSelect={(provider) => {
          setPaymentChoiceOpen(false);
          if (!accessToken) return;
          if (provider === 'flutterwave') {
            if (useV4) {
              setCheckoutOpen(true);
              return;
            }
            (async () => {
              setBuyLoading(true);
              try {
                const init = await initiatePpvPurchase({
                  titleId: id,
                  accessToken,
                  profileId,
                });
                await loadFlutterwaveScript();
                const flutterwave = (window as any).FlutterwaveCheckout;
                if (!flutterwave) throw new Error('Flutterwave unavailable');
                flutterwave({
                  public_key: init.publicKey,
                  tx_ref: init.txRef,
                  amount: init.amount,
                  currency: init.currency,
                  payment_options: 'card,banktransfer,ussd,opay,googlepay,applepay',
                  customer: {
                    email: init.customer?.email,
                    name: init.customer?.name,
                  },
                  customizations: {
                    title: init.title?.name ?? 'Wanzami',
                    description: 'Wanzami PPV purchase',
                  },
                  redirect_url: init.redirectUrl,
                  callback: async (data: any) => {
                    try {
                      await verifyFlutterwavePurchase({
                        accessToken,
                        transactionId: data?.transaction_id,
                        txRef: data?.tx_ref,
                      });
                      const access = await fetchPpvAccess({
                        titleId: id,
                        accessToken,
                        profileId,
                        country,
                      });
                      setPpvAccess(access);
                      if (access?.hasAccess) {
                        markOwned(id);
                        router.push(`/player/${id}`);
                      }
                    } catch (err: any) {
                      alert(err?.message ?? 'Payment verification failed');
                    } finally {
                      setBuyLoading(false);
                    }
                  },
                  onclose: () => {
                    setBuyLoading(false);
                  },
                });
              } catch (err: any) {
                setBuyLoading(false);
                alert(err?.message ?? 'Unable to start purchase');
              }
            })();
            return;
          }

          (async () => {
            setBuyLoading(true);
            try {
              const init = await initiatePaystackPurchase({
                titleId: id,
                accessToken,
                profileId,
              });
              if (init?.authorizationUrl) {
                window.location.href = init.authorizationUrl;
                return;
              }
              if (init?.reference) {
                await verifyPaystackPurchase({ accessToken, reference: init.reference });
                const access = await fetchPpvAccess({
                  titleId: id,
                  accessToken,
                  profileId,
                  country,
                });
                setPpvAccess(access);
                if (access?.hasAccess) {
                  markOwned(id);
                  router.push(`/player/${id}`);
                }
              }
            } catch (err: any) {
              alert(err?.message ?? 'Unable to start Paystack');
            } finally {
              setBuyLoading(false);
            }
          })();
        }}
      />
      {accessToken && useV4 ? (
        <FlutterwaveCheckoutModal
          open={checkoutOpen}
          onOpenChange={setCheckoutOpen}
          titleId={id}
          accessToken={accessToken}
          amountLabel={amountLabel}
          currency={currency}
          onSuccess={() => router.push(`/player/${id}`)}
        />
      ) : null}
      {buyLoading ? (
        <div className="fixed inset-0 z-[9999] bg-black/70 flex items-center justify-center">
          <div className="bg-[#0d0d0d] border border-white/10 rounded-xl px-6 py-5 flex flex-col items-center gap-3">
            <div className="h-10 w-10 border-2 border-white/20 border-t-[#fd7e14] rounded-full animate-spin" />
            <p className="text-sm text-white/80">Starting payment...</p>
          </div>
        </div>
      ) : null}
    </>
  );
}
