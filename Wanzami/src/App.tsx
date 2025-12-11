'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { SplashScreen } from './components/SplashScreen';
import { AuthPage } from './components/AuthPage';
import { RegistrationFlow } from './components/RegistrationFlow';
import { HomePage } from './components/HomePage';
import { SearchPage } from './components/SearchPage';
import { Dashboard } from './components/Dashboard';
import { MovieDetailPage } from './components/MovieDetailPage';
import { PPVMoviePage } from './components/PPVMoviePage';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { BlogHomePage, BlogPost } from './components/BlogHomePage';
import { BlogPostPage } from './components/BlogPostPage';
import { BlogCategoryPage } from './components/BlogCategoryPage';
import { BlogSearchPage } from './components/BlogSearchPage';
import { PaymentPage } from './components/PaymentPage';
import { DeviceProfilePrompt } from './components/DeviceProfilePrompt';
import { ProfileChooser } from './components/ProfileChooser';
import {
  fetchTitles,
  postEvents,
  fetchPopularity,
  fetchContinueWatching,
  fetchBecauseYouWatched,
  fetchForYou,
  fetchTitleWithEpisodes,
} from './lib/contentClient';
import { MovieData } from './components/MovieCard';
import { CustomMediaPlayer } from './components/CustomMediaPlayer';
import { TopLoader } from './components/TopLoader';
import { X } from 'lucide-react';
import { Loader } from './components/ui/loader';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "https://wanzami.duckdns.org";

export default function App() {

  const router = useRouter();
  const pathname = usePathname();
  const [showSplash, setShowSplash] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pendingVerification, setPendingVerification] = useState<{ email: string; name: string } | null>(null);
  const [selectedMovie, setSelectedMovie] = useState<any>(null);
  const [purchasedMovies, setPurchasedMovies] = useState<number[]>([]);
  const [ownedMovies, setOwnedMovies] = useState<number[]>([]);
  const [selectedBlogPost, setSelectedBlogPost] = useState<BlogPost | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showRegistration, setShowRegistration] = useState(false);
  const [showDevicePrompt, setShowDevicePrompt] = useState(false);
  const [activeProfile, setActiveProfile] = useState<{ id: string; name: string; avatarUrl?: string | null } | null>(null);
  const [catalogMovies, setCatalogMovies] = useState<MovieData[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [top10, setTop10] = useState<MovieData[]>([]);
  const [trending, setTrending] = useState<MovieData[]>([]);
  const [continueWatchingItems, setContinueWatchingItems] = useState<any[]>([]);
  const [becauseYouWatchedItems, setBecauseYouWatchedItems] = useState<any[]>([]);
  const [forYouItems, setForYouItems] = useState<any[]>([]);
  const [serverContinueWatching, setServerContinueWatching] = useState<any[]>([]);
  const [recsLoading, setRecsLoading] = useState(false);
  const [recsError, setRecsError] = useState<string | null>(null);
  const [playerMovie, setPlayerMovie] = useState<any | null>(null);
  const [authChecking, setAuthChecking] = useState(true);
  const [pageAssetsLoaded, setPageAssetsLoaded] = useState(false);
  const [initialOverlay, setInitialOverlay] = useState(false);
  const [uiTransitionLoading, setUiTransitionLoading] = useState(false);
  const [profileChooserLoading, setProfileChooserLoading] = useState(false);
  const [initialBlocker, setInitialBlocker] = useState(false);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeError, setRouteError] = useState<string | null>(null);
  const [cookieChoice, setCookieChoice] = useState<"accepted" | "rejected" | null>(() => {
    if (typeof window === "undefined") return null;
    const stored = localStorage.getItem("cookieConsent");
    if (stored === "accepted" || stored === "rejected") return stored as any;
    return null;
  });
  const [showCookieBanner, setShowCookieBanner] = useState(() => {
    if (typeof window === "undefined") return true;
    const stored = localStorage.getItem("cookieConsent");
    return stored !== "accepted" && stored !== "rejected";
  });
  const [bootLoader, setBootLoader] = useState(true);
  const [restoredSelected, setRestoredSelected] = useState(false);
  const [restoredPlayer, setRestoredPlayer] = useState(false);
  const globalLoading =
    catalogLoading ||
    recsLoading ||
    authChecking ||
    profileChooserLoading ||
    !pageAssetsLoaded ||
    uiTransitionLoading ||
    bootLoader ||
    routeLoading;

  useEffect(() => {
    // Debug loading flags to diagnose blank screen
    // eslint-disable-next-line no-console
    console.log("[App] loading flags", {
      bootLoader,
      authChecking,
      initialBlocker,
      pageAssetsLoaded,
      catalogLoading,
      recsLoading,
      uiTransitionLoading,
      profileChooserLoading,
      routeLoading,
      globalLoading,
    });
  }, [
    bootLoader,
    authChecking,
    initialBlocker,
    pageAssetsLoaded,
    catalogLoading,
    recsLoading,
    uiTransitionLoading,
    profileChooserLoading,
    routeLoading,
    globalLoading,
  ]);
  const mapPathToPage = useCallback((path: string) => {
    const clean = path || "/";
    if (clean.startsWith("/search")) return "search";
    if (clean.startsWith("/dashboard")) return "dashboard";
    if (clean.startsWith("/ppv")) return "ppv";
    if (clean.startsWith("/payment")) return "payment";
    if (clean.startsWith("/movies")) return "movies";
    if (clean.startsWith("/series")) return "series";
    if (clean.startsWith("/kids")) return "kids";
    if (clean.startsWith("/originals")) return "originals";
    if (clean.startsWith("/mylist")) return "mylist";
    if (clean.startsWith("/blog/post")) return "blogpost";
    if (clean.startsWith("/blog/category")) return "blogcategory";
    if (clean.startsWith("/blog/search")) return "blogsearch";
    if (clean.startsWith("/blog")) return "blog";
    return "home";
  }, []);

  const resolvedPage = useMemo(() => mapPathToPage(pathname ?? "/"), [mapPathToPage, pathname]);

  const parsePathIds = useCallback((path: string) => {
    const titleMatch = path.match(/^\/title\/([^/?#]+)/);
    const playerMatch = path.match(/^\/player\/([^/?#]+)/);
    const episodeMatch = path.match(/[?&]episodeId=([^&#]+)/);
    const startMatch = path.match(/[?&]startTime=([^&#]+)/);
    return {
      titleId: titleMatch?.[1],
      playerId: playerMatch?.[1],
      episodeId: episodeMatch ? decodeURIComponent(episodeMatch[1]) : undefined,
      startTime: startMatch ? Number(startMatch[1]) : undefined,
    };
  }, []);

  const allowGuestPlayback = useMemo(() => {
    const { playerId } = parsePathIds(pathname ?? "/");
    return Boolean(playerId);
  }, [parsePathIds, pathname]);

  const makeStubBlogPost = useCallback(
    (id: string): BlogPost => ({
      id: Number(id) || Date.now(),
      title: `Post ${id}`,
      subtitle: "",
      image: "https://placehold.co/800x450/111111/FD7E14?text=Blog+Post",
      category: "General",
      author: {
        name: "Wanzami",
        avatar: "https://placehold.co/64x64/111111/FD7E14?text=W",
      },
      date: new Date().toISOString().slice(0, 10),
      readTime: "3 min read",
      excerpt: "Content coming soon.",
    }),
    []
  );

  const loadTitleById = useCallback(
    async (id?: string | null) => {
      if (!id) return null;
      const fromCatalog = catalogMovies.find((m) => m.backendId === id || String(m.id) === id);
      const needsDetail = !fromCatalog || !(fromCatalog as any).assetVersions;
      if (!needsDetail) return fromCatalog;
      try {
        const detail = await fetchTitleWithEpisodes(id);
        if (!detail) return fromCatalog ?? null;
        return {
          id: Number(detail.id) || Date.now(),
          backendId: detail.id,
          title: detail.name,
          image: detail.thumbnailUrl || detail.posterUrl,
          description: detail.description,
          trailerUrl: detail.trailerUrl,
          type: detail.type,
          episodes: detail.episodes,
          assetVersions: detail.assetVersions,
        };
      } catch {
        return fromCatalog ?? null;
      }
    },
    [catalogMovies]
  );

  const fallbackDemo = useCallback(
    (id?: string | null) => ({
      id: id ?? Date.now(),
      backendId: id ?? String(Date.now()),
      title: `Title ${id ?? ""}`.trim(),
      image: "https://placehold.co/800x450/111111/FD7E14?text=Wanzami",
      trailerUrl: "https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
      type: "MOVIE",
    }),
    []
  );

  
  useEffect(() => {
    const { titleId, playerId, episodeId, startTime } = parsePathIds(pathname ?? "/");
    let cancelled = false;
    const needsLoad = Boolean(titleId || playerId);
    setRouteError(null);
    setRouteLoading(needsLoad);

    const hydrate = async () => {
      try {
        if (titleId) {
          const found = await loadTitleById(titleId);
          if (!cancelled) {
            if (found) {
              setSelectedMovie(found);
            } else {
              // Keep UX alive with a placeholder
              setSelectedMovie(fallbackDemo(titleId));
            }
          }
        }
        if (playerId) {
          let found: any | null = null;
          try {
            found = await loadTitleById(playerId);
          } catch (err: any) {
            // Gracefully fall back even if the fetch rejects
            console.warn("[player] loadTitleById failed, falling back to demo", err);
          }
          if (!cancelled) {
            const base = found ?? fallbackDemo(playerId);
            const withStart = startTime ? { ...base, startTimeSeconds: startTime } : base;
            const withEpisode = episodeId ? { ...withStart, currentEpisodeId: episodeId } : withStart;
            setPlayerMovie(withEpisode);
          }
        }
      } catch (err: any) {
        if (!cancelled) {
          setRouteError(err?.message ?? "Unable to load title");
          if (playerId) {
            const base = fallbackDemo(playerId);
            const withStart = startTime ? { ...base, startTimeSeconds: startTime } : base;
            const withEpisode = episodeId ? { ...withStart, currentEpisodeId: episodeId } : withStart;
            setPlayerMovie(withEpisode);
          }
        }
      } finally {
        if (!cancelled) {
          setRouteLoading(false);
        }
      }
    };

    if (needsLoad) {
      void hydrate();
    } else {
      setRouteLoading(false);
    }

    return () => {
      cancelled = true;
    };
  }, [pathname, parsePathIds, loadTitleById]);

  // Safety: if landing on /player/:id and playerMovie is still null, hydrate it
  useEffect(() => {
    const { playerId, episodeId, startTime } = parsePathIds(pathname ?? "/");
    if (!playerId || playerMovie) return;
    let cancelled = false;
    const hydrate = async () => {
      try {
        const found = await loadTitleById(playerId);
        if (cancelled) return;
        const base = found ?? fallbackDemo(playerId);
        const withStart = startTime ? { ...base, startTimeSeconds: startTime } : base;
        const withEpisode = episodeId ? { ...withStart, currentEpisodeId: episodeId } : withStart;
        setPlayerMovie(withEpisode);
      } catch (err: any) {
        if (cancelled) return;
        const demo = fallbackDemo(playerId);
        const withStart = startTime ? { ...demo, startTimeSeconds: startTime } : demo;
        const withEpisode = episodeId ? { ...withStart, currentEpisodeId: episodeId } : withStart;
        setPlayerMovie(withEpisode);
      }
    };
    void hydrate();
    return () => {
      cancelled = true;
    };
  }, [pathname, parsePathIds, loadTitleById, fallbackDemo, playerMovie]);

  // Blog route parsing for direct links
  useEffect(() => {
    const path = pathname ?? "/";
    const postMatch = path.match(/^\/blog\/post\/([^/?#]+)/);
    const categoryMatch = path.match(/^\/blog\/category\/([^/?#]+)/);

    if (postMatch) {
      const postId = decodeURIComponent(postMatch[1]);
      if (!selectedBlogPost || String(selectedBlogPost.id) !== postId) {
        setSelectedBlogPost(makeStubBlogPost(postId));
      }
    } else if (categoryMatch) {
      const cat = decodeURIComponent(categoryMatch[1]);
      if (selectedCategory !== cat) {
        setSelectedCategory(cat);
      }
    }
  }, [pathname, selectedBlogPost, selectedCategory, makeStubBlogPost]);
  const resolveApiUrl = (input: RequestInfo | URL) => {
    if (typeof input === "string" && input.startsWith("/api/")) {
      return `${API_BASE}${input}`;
    }
    return input;
  };

  const fetchWithTimeout = async (input: RequestInfo | URL, init?: RequestInit, timeoutMs = 8000) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(resolveApiUrl(input), { ...init, signal: controller.signal });
      return res;
    } finally {
      clearTimeout(timer);
    }
  };

  const CookieBanner = () =>
    showCookieBanner ? (
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[10010] w-[95%] max-w-3xl">
        <div className="bg-neutral-900/95 border border-neutral-700 rounded-xl shadow-lg px-4 py-3 md:px-6 md:py-4 text-white">
          <div className="flex items-start gap-3">
            <div className="flex-1 space-y-2">
              <div className="font-semibold text-sm md:text-base">Cookies & Preferences</div>
              <p className="text-xs md:text-sm text-neutral-300">
                We use cookies to improve your experience. Accept to allow all, or reject to opt out of non-essential cookies.
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  className="px-4 py-2 bg-[#fd7e14] hover:bg-[#e86f0f] text-white text-sm rounded-lg"
                  onClick={() => {
                    setCookieChoice("accepted");
                    setShowCookieBanner(false);
                    localStorage.setItem("cookieConsent", "accepted");
                  }}
                >
                  Accept
                </button>
                <button
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-sm rounded-lg"
                  onClick={() => {
                    setCookieChoice("rejected");
                    setShowCookieBanner(false);
                    localStorage.setItem("cookieConsent", "rejected");
                  }}
                >
                  Reject
                </button>
              </div>
            </div>
            <button
              aria-label="Close cookie banner"
              className="p-2 text-neutral-300 hover:text-white"
              onClick={() => {
                setCookieChoice("rejected");
                setShowCookieBanner(false);
                localStorage.setItem("cookieConsent", "rejected");
              }}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    ) : null;

  const CookieManagerButton =
    cookieChoice && !showCookieBanner ? (
      <button
        className="fixed bottom-4 left-4 z-[10005] px-3 py-2 text-xs rounded-lg border border-white/20 bg-white/5 text-white hover:bg-white/10"
        onClick={() => setShowCookieBanner(true)}
      >
        Cookie preferences
      </button>
    ) : null;

  const startUiTransition = (duration = 600) => {
    setUiTransitionLoading(true);
    setTimeout(() => setUiTransitionLoading(false), duration);
  };

  const handleSplashComplete = () => {
    startUiTransition();
    setShowSplash(false);
    setShowRegistration(true); // Show registration after splash
  };

  const handleSplashLogin = () => {
    startUiTransition();
    setShowSplash(false);
    setShowRegistration(false);
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('signup') === '1') {
      setShowSplash(false);
      setShowRegistration(true);
      setPendingVerification(null);
    }
    const storedConsent = typeof window !== "undefined" ? localStorage.getItem("cookieConsent") : null;
    if (storedConsent === "accepted" || storedConsent === "rejected") {
      setCookieChoice(storedConsent as any);
      setShowCookieBanner(false);
    } else {
      setCookieChoice(null);
      setShowCookieBanner(true);
    }
  }, []);

  useEffect(() => {
    if (allowGuestPlayback) {
      setShowSplash(false);
      setShowRegistration(false);
    }
  }, [allowGuestPlayback]);

  // Deprecated persisted selection load (handled via URL now)
  useEffect(() => {
    if (restoredSelected) return;
    setRestoredSelected(true);
  }, [restoredSelected]);

  // Deprecated persisted player load (handled via URL now)
  useEffect(() => {
    if (restoredPlayer) return;
    setRestoredPlayer(true);
  }, [restoredPlayer]);

  useEffect(() => {
    const maybeLoadEpisodes = async () => {
      if (!playerMovie || playerMovie?.episodes || playerMovie?.type !== "SERIES") return;
      try {
        const detail = await fetchTitleWithEpisodes(playerMovie.backendId ?? playerMovie.id);
        if (detail?.episodes?.length) {
          const enriched = { ...playerMovie, episodes: detail.episodes };
          setPlayerMovie(enriched);
          setSelectedMovie((prev) => (prev ? { ...prev, episodes: detail.episodes } : prev));
          if (typeof window !== "undefined") {
            localStorage.setItem("playerMovie", JSON.stringify(enriched));
          }
        }
      } catch {
        // ignore
      }
    };
    void maybeLoadEpisodes();
  }, [playerMovie]);

  useEffect(() => {
    const t = setTimeout(() => setBootLoader(false), 1500);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (pageAssetsLoaded && !authChecking && !catalogLoading) {
      const t = setTimeout(() => setInitialBlocker(false), 150);
      return () => clearTimeout(t);
    }
  }, [pageAssetsLoaded, authChecking, catalogLoading]);

  useEffect(() => {
    const t = setTimeout(() => setInitialBlocker(false), 10000);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!uiTransitionLoading) return;
    const t = setTimeout(() => setUiTransitionLoading(false), 1500);
    return () => clearTimeout(t);
  }, [uiTransitionLoading]);

  useEffect(() => {
    let cancelled = false;

    const clearLocalSession = () => {
      setIsAuthenticated(false);
      setShowRegistration(false);
      setPendingVerification(null);
      setShowDevicePrompt(false);
      setActiveProfile(null);
      setShowSplash(false);
      if (typeof window !== 'undefined') {
        localStorage.removeItem('activeProfileId');
        localStorage.removeItem('activeProfileName');
        localStorage.removeItem('activeProfileAvatar');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
      }
    };

    const validateToken = async (token: string) => {
      const res = await fetchWithTimeout("/api/auth/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const message = (data as any)?.message ?? "Unauthorized";
        throw new Error(message);
      }
      return token;
    };

    const restoreSession = async () => {
      const access = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
      const refresh = typeof window !== 'undefined' ? localStorage.getItem('refreshToken') : null;

      if (!access && !refresh) {
        if (!cancelled) {
          setShowSplash(true);
          setShowRegistration(false);
          setPendingVerification(null);
          setAuthChecking(false);
        }
        return;
      }

      setShowSplash(false);
      setShowRegistration(false);
      setPendingVerification(null);

      try {
        let nextAccess = access;

        if (!nextAccess) {
          throw new Error("Missing access token");
        }

        try {
          await validateToken(nextAccess);
        } catch {
          if (!refresh) {
            throw new Error("Session expired");
          }
          const refreshRes = await fetchWithTimeout("/api/auth/refresh", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ refreshToken: refresh }),
          });
          const refreshData = await refreshRes.json().catch(() => ({}));
          if (!refreshRes.ok || !refreshData?.accessToken) {
            const message = refreshData?.message ?? "Session expired";
            throw new Error(message);
          }
          nextAccess = refreshData.accessToken as string;
          localStorage.setItem("accessToken", refreshData.accessToken as string);
          if (refreshData.refreshToken) {
            localStorage.setItem("refreshToken", refreshData.refreshToken as string);
          }
          await validateToken(nextAccess);
        }

        if (cancelled) return;

        setIsAuthenticated(true);
        setPendingVerification(null);
        setShowRegistration(false);

        const profileId = localStorage.getItem('activeProfileId');
        const profileName = localStorage.getItem('activeProfileName');
        const profileAvatar = localStorage.getItem('activeProfileAvatar');
        if (profileId && profileName) {
          setActiveProfile({ id: profileId, name: profileName, avatarUrl: profileAvatar });
        }
      } catch {
        if (cancelled) return;
        clearLocalSession();
      } finally {
        if (!cancelled) setAuthChecking(false);
      }
    };

    void restoreSession();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleRegistrationComplete = (data: { email: string; name: string }) => {
    setShowRegistration(false);
    setIsAuthenticated(false);
    setPendingVerification(data);
  };

  const handleRegistrationBack = () => {
    setShowRegistration(false);
    setShowSplash(true);
    setPendingVerification(null);
  };

  const handleShowLoginFromRegistration = () => {
    startUiTransition();
    setShowRegistration(false);
    setPendingVerification(null);
  };

  const handleAuth = () => {
    startUiTransition();
    setIsAuthenticated(true);
    setPendingVerification(null);
    const hasLabel = typeof window !== 'undefined' ? localStorage.getItem('deviceLabel') : null;
    if (!hasLabel) {
      setShowDevicePrompt(true);
    }
    setActiveProfile(null);
  };

  const handleShowSignup = () => {
    startUiTransition();
    setShowRegistration(true);
    setPendingVerification(null);
  };

  const handleLogout = (options?: { showLogin?: boolean }) => {
    setIsAuthenticated(false);
    setSelectedMovie(null);
    setShowRegistration(options?.showLogin ? false : true);
    setPendingVerification(null);
    setShowDevicePrompt(false);
    setActiveProfile(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('activeProfileId');
      localStorage.removeItem('activeProfileName');
      localStorage.removeItem('activeProfileAvatar');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    }
  };

  const handleNavigate = (page: string) => {
    startUiTransition();
    setSelectedMovie(null);
    const targetPath = page === "home" ? "/" : `/${page}`;
    router.push(targetPath);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const sendEvent = async (eventType: "IMPRESSION" | "PLAY_START", movie?: MovieData) => {
    try {
      const accessToken = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
      if (!accessToken) return;
      const profileId = activeProfile?.id;
      const deviceId = typeof window !== 'undefined' ? localStorage.getItem('deviceId') ?? undefined : undefined;
      const titleId = movie?.backendId ?? (movie?.id ? String(movie.id) : undefined);
      if (!titleId) return;
      await postEvents(
        [
          {
            eventType,
            profileId,
            titleId,
            occurredAt: new Date().toISOString(),
            deviceId,
          },
        ],
        accessToken
      );
    } catch {
      // best effort
    }
  };

  const handleMovieClick = async (movie: any) => {
    startUiTransition();
    let enriched = movie;
    if (movie?.type === "SERIES" && !movie.episodes) {
      try {
        const detail = await fetchTitleWithEpisodes(movie.backendId ?? movie.id);
        if (detail?.episodes) {
          enriched = { ...movie, episodes: detail.episodes };
        }
      } catch {
        // best effort; ignore failures
      }
    }
    setSelectedMovie(enriched);
    const targetId = enriched.backendId ?? enriched.id;
    if (targetId) {
      router.push(`/title/${targetId}`);
    }
    void sendEvent("IMPRESSION", enriched);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCloseMovie = () => {
    startUiTransition();
    setSelectedMovie(null);
    setPlayerMovie(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem("selectedMovie");
      localStorage.removeItem("playerMovie");
    }
    const merged = combineContinueWatching(serverContinueWatching, activeProfile?.id);
    setContinueWatchingItems(merged);
    router.push("/");
  };

  const handlePlayClick = (movie: any) => {
    setPlayerMovie(movie);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("playerMovie", JSON.stringify(movie));
      } catch {
        // ignore
      }
    }
    const targetId = movie?.backendId ?? movie?.id?.toString?.();
    if (targetId) {
      router.push(`/player/${targetId}`);
    }
    void sendEvent("PLAY_START", movie);
  };

  const handleResumeClick = (movie: any) => {
    // For continue watching: jump straight into player
    setPlayerMovie(movie);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("playerMovie", JSON.stringify(movie));
      } catch {
        // ignore
      }
    }
    const targetId = movie?.backendId ?? movie?.id?.toString?.();
    if (targetId) {
      router.push(`/player/${targetId}`);
    }
    void sendEvent("PLAY_START", movie);
  };

  const handleRentMovie = (movie: any) => {
    setPurchasedMovies([...purchasedMovies, movie.id]);
    const currencySymbol = movie.currency === 'NGN' ? '₦' : movie.currency === 'USDC' ? 'USDC ' : '$';
    alert(`Successfully rented "${movie.title}" for ${currencySymbol}${movie.price.toLocaleString()}. You have 48 hours to watch!`);
  };

  const handleBuyMovie = (movie: any) => {
    setOwnedMovies([...ownedMovies, movie.id]);
    const currencySymbol = movie.currency === 'NGN' ? '₦' : movie.currency === 'USDC' ? 'USDC ' : '$';
    alert(`Successfully purchased "${movie.title}" for ${currencySymbol}${movie.buyPrice.toLocaleString()}. You own this movie forever!`);
  };

  const isPurchased = (movieId: number) => purchasedMovies.includes(movieId);
  const isOwned = (movieId: number) => ownedMovies.includes(movieId);

  const handleBlogPostClick = (post: BlogPost) => {
    setSelectedBlogPost(post);
    router.push(`/blog/post/${post.id ?? "post"}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCategoryClick = (category: string) => {
    setSelectedCategory(category);
    router.push(`/blog/category/${encodeURIComponent(category)}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBlogSearchClick = () => {
    router.push(`/blog/search`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const readLocalResume = (profileId?: string | null) => {
    if (typeof window === "undefined") return [];
    const keyPrefix = `progress:${profileId ?? "anon"}:`;
    const items: Array<{ titleId: string; completionPercent: number; updatedAt: number; time?: number; duration?: number }> = [];
    Object.keys(localStorage).forEach((key) => {
      if (!key.startsWith(keyPrefix)) return;
      const titleId = key.slice(keyPrefix.length);
      const raw = localStorage.getItem(key);
      if (!raw) return;
      try {
        const parsed = JSON.parse(raw) as { time?: number; duration?: number; updatedAt?: number };
        const completion = parsed.duration ? Math.min(1, Math.max(0, (parsed.time ?? 0) / parsed.duration)) : 0;
        if (!Number.isFinite(completion) || completion <= 0) return;
        items.push({
          titleId,
          completionPercent: completion,
          updatedAt: parsed.updatedAt ?? Date.now(),
          time: parsed.time,
          duration: parsed.duration,
        });
      } catch {
        // ignore malformed
      }
    });
    return items.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
  };

  const combineContinueWatching = (serverItems: any[], profileId?: string | null) => {
    const local = readLocalResume(profileId);
    const mergedMap = new Map<string, any>();
    serverItems.forEach((item) => {
      if (!item?.id) return;
      const startTimeSeconds =
        item.positionSeconds ?? item.progressSeconds ?? item.currentTime ?? item.resumeTime ?? null;
      mergedMap.set(String(item.id), { ...item, updatedAt: item.updatedAt ?? Date.now(), startTimeSeconds });
    });
    local.forEach((loc) => {
      const existing = mergedMap.get(loc.titleId);
      if (existing) {
        const current = existing.completionPercent ?? 0;
        if (loc.completionPercent > current) {
          mergedMap.set(loc.titleId, { ...existing, completionPercent: loc.completionPercent, startTimeSeconds: loc.time ?? existing.startTimeSeconds });
        }
      } else {
        const fallback = catalogMovies.find((m) => m.backendId === loc.titleId);
        mergedMap.set(loc.titleId, {
          id: loc.titleId,
          name: fallback?.title ?? `Title ${loc.titleId}`,
          type: fallback?.type ?? "MOVIE",
          posterUrl: fallback?.posterUrl ?? fallback?.image,
          thumbnailUrl: fallback?.thumbnailUrl ?? fallback?.image,
          completionPercent: loc.completionPercent,
          updatedAt: loc.updatedAt ?? Date.now(),
          startTimeSeconds: loc.time,
        });
      }
    });
    const mergedList = Array.from(mergedMap.values())
      .sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0))
      .slice(0, 10);

    return mergedList.map((item, idx) => {
      const match = catalogMovies.find((m) => m.backendId === item.id || String(m.id) === String(item.id));
      const fallbackId = Number(item.id);
      const numericId = Number.isNaN(fallbackId) ? Date.now() + idx : fallbackId;
      const seasonLabel =
        item.seasonNumber || item.episodeNumber
          ? `S${item.seasonNumber ?? "?"}E${item.episodeNumber ?? "?"}`
          : undefined;
      const resolvedBaseTitle = match?.title ?? item.titleName ?? item.name ?? `Title ${item.id}`;
      const resolvedTitle =
        item.type === "SERIES" && seasonLabel
          ? `${resolvedBaseTitle} • ${seasonLabel}${item.episodeName ? `: ${item.episodeName}` : ""}`
          : resolvedBaseTitle;
      const resolvedImage =
        match?.image ??
        item.thumbnailUrl ??
        item.posterUrl ??
        "https://placehold.co/600x900/111111/FD7E14?text=Wanzami";
      const durationSeconds = (match?.runtimeMinutes ?? item.runtimeMinutes ?? 0) * 60;
      const computedStart =
        item.startTimeSeconds ??
        (item.completionPercent && durationSeconds ? Math.max(5, Math.min(durationSeconds - 1, item.completionPercent * durationSeconds)) : undefined);
      return {
        id: match?.id ?? numericId,
        backendId: match?.backendId ?? String(item.id),
        title: resolvedTitle,
        image: resolvedImage,
        rating: match?.rating,
        type: match?.type ?? item.type,
        completionPercent: item.completionPercent,
        updatedAt: item.updatedAt,
        startTimeSeconds: computedStart,
        currentEpisodeId: item.episodeId,
        currentEpisodeLabel: seasonLabel,
      } as MovieData;
    });
  };

  const handleBackToBlog = () => {
    setSelectedBlogPost(null);
    setSelectedCategory(null);
    router.push('/blog');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    const catalogSettled = !catalogLoading || !!catalogError;
    const recsSettled = !isAuthenticated || !activeProfile || !recsLoading;
    const ready = !authChecking && catalogSettled && recsSettled && pageAssetsLoaded;

    if (ready) {
      const t = setTimeout(() => setInitialOverlay(false), 200);
      return () => clearTimeout(t);
    }
  }, [authChecking, catalogLoading, catalogError, recsLoading, isAuthenticated, activeProfile, pageAssetsLoaded]);

  useEffect(() => {
    if (isAuthenticated && !activeProfile) {
      setProfileChooserLoading(true);
      const t = setTimeout(() => setProfileChooserLoading(false), 500);
      return () => clearTimeout(t);
    }
    // If profile becomes available, ensure the loader is cleared.
    if (activeProfile) {
      setProfileChooserLoading(false);
    }
  }, [isAuthenticated, activeProfile]);

  useEffect(() => {
    let isMounted = true;
    const loadTitles = async () => {
      try {
        setCatalogLoading(true);
        setCatalogError(null);
        const storedCountry = typeof window !== "undefined" ? localStorage.getItem("countryCode") : null;
        const titles = await fetchTitles(storedCountry ?? "NG");
        if (!isMounted) return;
        const mapped = titles
          .filter((t) => !t.archived)
          .map((title, idx) => {
            const numericId = Number(title.id);
            const safeId = Number.isNaN(numericId) ? Date.now() + idx : numericId;
            const fallbackImage = "https://placehold.co/600x900/111111/FD7E14?text=Wanzami";
            const primaryGenre = title.genres?.[0];
            const displayRating = title.maturityRating ?? "PG";
            return {
              id: safeId,
              backendId: title.id,
              title: title.name,
              image: title.thumbnailUrl || title.posterUrl || fallbackImage,
              description: title.description ?? undefined,
              trailerUrl: title.trailerUrl ?? undefined,
              year: title.releaseYear ? String(title.releaseYear) : undefined,
              genre: primaryGenre ?? (title.type === "SERIES" ? "Series" : "Movie"),
              rating: displayRating,
              createdAt: title.createdAt,
              type: title.type,
            } as MovieData;
          });
        setCatalogMovies(mapped);
      } catch (err: any) {
        if (!isMounted) return;
        const friendly = err?.name === "AbortError" ? "Catalog load timed out" : err?.message ?? "Failed to load catalog";
        setCatalogError(friendly);
      } finally {
        if (isMounted) {
          setCatalogLoading(false);
        }
      }
    };
    void loadTitles();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;
    const loadRecs = async () => {
      const accessToken = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
      const profileId = activeProfile?.id;
      if (!accessToken) return;
      try {
        setRecsLoading(true);
        setRecsError(null);

        const cw = await fetchContinueWatching(accessToken, profileId);
        if (isMounted) {
          setServerContinueWatching(cw.items ?? []);
          setContinueWatchingItems(combineContinueWatching(cw.items ?? [], profileId));
        }

        const byw = await fetchBecauseYouWatched(accessToken, profileId);
        if (isMounted) setBecauseYouWatchedItems(byw.items ?? []);

        const [top10Res, trendingRes, forYouRes] = await Promise.all([
          fetchPopularity({ type: "MOVIE", window: "DAILY" }),
          fetchPopularity({ type: "MOVIE", window: "TRENDING" }),
          fetchForYou(accessToken, profileId),
        ]);

        const mapItems = (ids: { titleId: string }[]) => {
          const mapped: MovieData[] = [];
          ids.forEach((item, idx) => {
            const match = catalogMovies.find((m) => m.backendId === item.titleId);
            if (match) {
              mapped.push(match);
            } else {
              mapped.push({
                id: Number(item.titleId) || Date.now() + idx,
                backendId: item.titleId,
                title: `Title ${item.titleId}`,
                image: "https://placehold.co/600x900/111111/FD7E14?text=Wanzami",
              } as MovieData);
            }
          });
          return mapped;
        };

        if (isMounted) {
          setTop10(mapItems(top10Res.items ?? []));
          setTrending(mapItems(trendingRes.items ?? []));
          setForYouItems(forYouRes.items ?? []);
        }
      } catch (err: any) {
        const message = err?.name === "AbortError" ? "Recommendations timed out" : err?.message ?? "Failed to load recommendations";
        if (message.toLowerCase().includes("invalid") || message.toLowerCase().includes("expired")) {
          handleLogout({ showLogin: true });
        }
        if (isMounted) setRecsError(message);
      } finally {
        if (isMounted) setRecsLoading(false);
      }
    };

    if (activeProfile) {
      void loadRecs();
    }
    return () => {
      isMounted = false;
    };
  }, [activeProfile, catalogMovies]);

  // Keep continue watching in sync with local resume data even if we didn't fetch recs
  useEffect(() => {
    const merged = combineContinueWatching(serverContinueWatching, activeProfile?.id);
    setContinueWatchingItems(merged);
  }, [serverContinueWatching, catalogMovies, activeProfile]);

  useEffect(() => {
    const markAssetsLoaded = () => setPageAssetsLoaded(true);
    if (document.readyState === "complete") {
      setPageAssetsLoaded(true);
      return undefined;
    }
    window.addEventListener("load", markAssetsLoaded);
    return () => window.removeEventListener("load", markAssetsLoaded);
  }, []);

  // Avoid flashing the auth screen while we are still validating any existing session.
  if (authChecking && !allowGuestPlayback) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center">
        <TopLoader active />
        <p className="mt-3 text-sm text-gray-300">Checking your session...</p>
      </div>
    );
  }

  if (showSplash && !allowGuestPlayback) {
    return (
      <>
        <SplashScreen
          onStartRegistration={handleSplashComplete}
          onLogin={handleSplashLogin}
        />
        <CookieBanner />
        {CookieManagerButton}
      </>
    );
  }

  // Show registration page if not authenticated
  if (!isAuthenticated && showRegistration && !allowGuestPlayback) {
    return (
      <>
        <RegistrationFlow
          onAuth={handleRegistrationComplete}
          onBack={handleRegistrationBack}
          onLogin={handleShowLoginFromRegistration}
        />
        <CookieBanner />
        {CookieManagerButton}
      </>
    );
  }

  // Show auth page if not authenticated
  if (!isAuthenticated && !allowGuestPlayback) {
    if (pendingVerification) {
      return (
        <>
          <div className="min-h-screen bg-black text-white flex items-center justify-center px-6 py-20">
            <div className="max-w-lg w-full bg-white/5 border border-white/10 rounded-2xl p-8">
              <h1 className="text-2xl font-semibold mb-4">Verify your email</h1>
              <p className="text-gray-300 mb-6">
                We sent a verification link to <span className="text-[#fd7e14]">{pendingVerification.email}</span>. Please verify to continue.
              </p>
              <a
                href="/login"
                className="inline-flex items-center justify-center px-6 py-3 bg-[#fd7e14] text-white rounded-xl font-semibold hover:bg-[#e86f0f] transition-colors"
              >
                Go to Login
              </a>
            </div>
          </div>
          <CookieBanner />
        </>
      );
    }
    return (
      <>
        <AuthPage onAuth={handleAuth} onShowSignup={handleShowSignup} />
        <CookieBanner />
        {CookieManagerButton}
      </>
    );
  }

  // Force profile selection before entering the app
  if (isAuthenticated && !activeProfile && !allowGuestPlayback) {
    if (profileChooserLoading) {
      return (
        <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center">
          <TopLoader active />
          <p className="mt-3 text-sm text-gray-300">Loading profiles...</p>
        </div>
      );
    }
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <TopLoader active />
        <ProfileChooser onSelected={(p) => setActiveProfile(p)} onLogout={handleLogout} />
      </div>
    );
  }

  if (routeError) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-6">
        <TopLoader active />
        <p className="mt-6 text-lg font-semibold">Oops, we couldn't load that title.</p>
        <p className="text-sm text-gray-400 mt-2">{routeError}</p>
        <button
          className="mt-6 px-4 py-2 rounded-lg bg-[#fd7e14] hover:bg-[#e86f0f] text-white"
          onClick={() => router.push("/")}
        >
          Go Home
        </button>
      </div>
    );
  }

  // Check if selected movie is a PPV movie
  const isPPVMovie = selectedMovie && selectedMovie.price !== undefined;
  const activeProfileId = activeProfile?.id;

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
      if (value.startsWith("https://")) return value;
      if (value.startsWith("http://")) return `https://${value.slice(7)}`;
      if (value.startsWith("//")) return `https:${value}`;
      if (/^[a-z0-9.-]+\\.s3\\./i.test(value)) return `https://${value}`;
      return value;
    };

    if (trimmed.startsWith("s3://")) {
      const withoutScheme = trimmed.replace("s3://", "");
      const [bucket, ...rest] = withoutScheme.split("/");
      const key = rest.join("/");
      // Default region matches backend env; adjust if bucket/region changes.
      const region = process.env.NEXT_PUBLIC_S3_REGION || "eu-north-1";
      return ensureHttps(`${bucket}.s3.${region}.amazonaws.com/${key}`);
    }

    return ensureHttps(trimmed);
  };

  const labelForRendition = (r?: string) => {
    switch (r) {
      case "R4K":
        return "4K";
      case "R2K":
        return "2K";
      case "R1080":
        return "1080p";
      case "R720":
        return "720p";
      case "R360":
        return "360p";
      default:
        return r ?? "Source";
    }
  };

  const buildSources = (movie: any) => {
    if (!movie) return [];
    const currentEpisode = movie.currentEpisodeId
      ? movie.episodes?.find((e: any) => String(e.id) === String(movie.currentEpisodeId))
      : null;
    const assets = (currentEpisode?.assetVersions ?? movie.assetVersions ?? []).map((a: any) => ({
      ...a,
      url: convertS3Url(a?.url),
    })).filter((a: any) => a?.url);
    const sorted = assets.sort((a: any, b: any) => (renditionRank[b.rendition] ?? 0) - (renditionRank[a.rendition] ?? 0));
    if (sorted.length) {
      const mapped = sorted.map((a: any) => ({
        src: a.url,
        label: labelForRendition(a.rendition),
        type: "video/mp4",
      }));
      if (movie.trailerUrl) {
        mapped.push({
          src: convertS3Url(movie.trailerUrl) ?? movie.trailerUrl,
          label: "Trailer",
          type: "video/mp4",
        });
      }
      return mapped;
    }
    // Fallback to trailer/demo
    return [
      {
        src:
          movie.trailerUrl || "https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
        label: movie.trailerUrl ? "1080p" : "Demo",
        type: "video/mp4",
      },
      {
        src:
          movie.trailerUrl || "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
        label: movie.trailerUrl ? "720p" : "Demo Alt",
        type: "video/mp4",
      },
      {
        src:
          movie.trailerUrl || "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
        label: movie.trailerUrl ? "540p" : "Demo Low",
        type: "video/mp4",
      },
    ];
  };

  return (
    <div className="min-h-screen bg-black">
      <TopLoader active={globalLoading} />
      {showDevicePrompt && (
        <DeviceProfilePrompt
          onClose={() => setShowDevicePrompt(false)}
          onSaved={() => setShowDevicePrompt(false)}
        />
      )}
      {/* Navbar - shown on all pages except movie detail */}
      {!selectedMovie && (
        <Navbar
          currentPage={resolvedPage}
          onNavigate={handleNavigate}
          onLogout={handleLogout}
          isAuthenticated={isAuthenticated}
        />
      )}

      {/* Main content */}
      {selectedMovie ? (
        isPPVMovie ? (
          <PPVMoviePage
            key="ppv-detail"
            movie={selectedMovie}
            onClose={handleCloseMovie}
            onRent={handleRentMovie}
            onBuy={handleBuyMovie}
            isPurchased={isPurchased(selectedMovie.id)}
            isOwned={isOwned(selectedMovie.id)}
            timeRemaining={isPurchased(selectedMovie.id) && !isOwned(selectedMovie.id) ? "1 day 13 hours" : undefined}
          />
        ) : (
          <MovieDetailPage
            key="movie-detail"
            movie={selectedMovie}
            onClose={handleCloseMovie}
            onPlayClick={handlePlayClick}
          />
        )
      ) : resolvedPage === 'home' ? (
        <div key="home">
          <HomePage
            onMovieClick={handleMovieClick}
            onContinueClick={handleResumeClick}
            movies={catalogMovies}
            loading={catalogLoading}
            error={catalogError}
            top10={top10}
            trending={trending}
            continueWatching={continueWatchingItems}
            becauseYouWatched={becauseYouWatchedItems}
            recsLoading={recsLoading}
            recsError={recsError}
          />
          <Footer />
        </div>
      ) : resolvedPage === 'search' ? (
        <div key="search">
          <SearchPage
            onMovieClick={handleMovieClick}
            movies={catalogMovies}
            loading={catalogLoading}
            error={catalogError}
          />
          <Footer />
        </div>
      ) : resolvedPage === 'dashboard' ? (
        <div key="dashboard">
          <Dashboard onMovieClick={handleMovieClick} />
          <Footer />
        </div>
      ) : resolvedPage === 'ppv' ? (
        <div key="ppv">
          <div className="min-h-screen bg-black pt-24 md:pt-32 pb-12 px-4 md:px-12 lg:px-16">
            <h1 className="text-white text-3xl md:text-4xl mb-4">Pay-Per-View</h1>
            <p className="text-gray-400 mb-8">Rent premium movies and watch for 48 hours</p>
            <div className="text-gray-500">Browse all PPV content - Full catalog coming soon!</div>
          </div>
          <Footer />
        </div>
      ) : resolvedPage === 'payment' ? (
        <div key="payment">
          <PaymentPage />
          <Footer />
        </div>
      ) : resolvedPage === 'movies' ? (
        <div key="movies">
          <div className="min-h-screen bg-black pt-24 md:pt-32 pb-12 px-4 md:px-12 lg:px-16">
            <h1 className="text-white text-3xl md:text-4xl mb-8">Movies</h1>
            <p className="text-gray-400">Browse all movies - Coming soon!</p>
          </div>
          <Footer />
        </div>
      ) : resolvedPage === 'series' ? (
        <div key="series">
          <div className="min-h-screen bg-black pt-24 md:pt-32 pb-12 px-4 md:px-12 lg:px-16">
            <h1 className="text-white text-3xl md:text-4xl mb-8">Series</h1>
            <p className="text-gray-400">Browse all series - Coming soon!</p>
          </div>
          <Footer />
        </div>
      ) : resolvedPage === 'kids' ? (
        <div key="kids">
          <div className="min-h-screen bg-black pt-24 md:pt-32 pb-12 px-4 md:px-12 lg:px-16">
            <h1 className="text-white text-3xl md:text-4xl mb-8">Kids</h1>
            <p className="text-gray-400">Kids content - Coming soon!</p>
          </div>
          <Footer />
        </div>
      ) : resolvedPage === 'originals' ? (
        <div key="originals">
          <div className="min-h-screen bg-black pt-24 md:pt-32 pb-12 px-4 md:px-12 lg:px-16">
            <h1 className="text-white text-3xl md:text-4xl mb-8">Wanzami Originals</h1>
            <p className="text-gray-400">Exclusive original content - Coming soon!</p>
          </div>
          <Footer />
        </div>
      ) : resolvedPage === 'mylist' ? (
        <div key="mylist">
          <div className="min-h-screen bg-black pt-24 md:pt-32 pb-12 px-4 md:px-12 lg:px-16">
            <h1 className="text-white text-3xl md:text-4xl mb-8">My List</h1>
            <p className="text-gray-400">Your saved content - Coming soon!</p>
          </div>
          <Footer />
        </div>
      ) : resolvedPage === 'blog' ? (
        <div key="blog">
          <BlogHomePage onPostClick={handleBlogPostClick} onCategoryClick={handleCategoryClick} onSearchClick={handleBlogSearchClick} />
          <Footer />
        </div>
      ) : resolvedPage === 'blogpost' ? (
        <div key="blogpost">
          <BlogPostPage post={selectedBlogPost} onBack={handleBackToBlog} />
          <Footer />
        </div>
      ) : resolvedPage === 'blogcategory' ? (
        <div key="blogcategory">
          <BlogCategoryPage category={selectedCategory} onPostClick={handleBlogPostClick} onBack={handleBackToBlog} />
          <Footer />
        </div>
      ) : resolvedPage === 'blogsearch' ? (
        <div key="blogsearch">
          <BlogSearchPage onPostClick={handleBlogPostClick} onBack={handleBackToBlog} />
          <Footer />
        </div>
      ) : null}

      {/* Cookie consent */}
      {!cookieChoice && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[10010] w-[95%] max-w-3xl">
          <div className="bg-neutral-900/95 border border-neutral-700 rounded-xl shadow-lg px-4 py-3 md:px-6 md:py-4 text-white">
            <div className="flex items-start gap-3">
              <div className="flex-1 space-y-2">
                <div className="font-semibold text-sm md:text-base">Cookies & Preferences</div>
                <p className="text-xs md:text-sm text-neutral-300">
                  We use cookies to improve your experience. Accept to allow all, or reject to opt out of non-essential cookies.
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    className="px-4 py-2 bg-[#fd7e14] hover:bg-[#e86f0f] text-white text-sm rounded-lg"
                    onClick={() => {
                      setCookieChoice("accepted");
                      localStorage.setItem("cookieConsent", "accepted");
                    }}
                  >
                    Accept
                  </button>
                  <button
                    className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-sm rounded-lg"
                    onClick={() => {
                      setCookieChoice("rejected");
                      localStorage.setItem("cookieConsent", "rejected");
                    }}
                  >
                    Reject
                  </button>
                </div>
              </div>
              <button
                aria-label="Close cookie banner"
                className="p-2 text-neutral-300 hover:text-white"
                onClick={() => {
                  setCookieChoice("rejected");
                  localStorage.setItem("cookieConsent", "rejected");
                }}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {playerMovie && (
        <CustomMediaPlayer
          title={playerMovie.title}
          poster={playerMovie.image ?? playerMovie.thumbnailUrl ?? playerMovie.posterUrl}
          titleId={playerMovie.backendId ?? playerMovie.id?.toString?.()}
          startTimeSeconds={playerMovie.startTimeSeconds}
          profileId={activeProfileId}
          episodes={playerMovie.episodes}
          currentEpisodeId={playerMovie.currentEpisodeId}
          sources={buildSources(playerMovie)}
          onEvent={(eventType, metadata) => {
            const allowed: Array<"PLAY_START" | "PLAY_END" | "SCRUB" | "IMPRESSION"> = [
              "PLAY_START",
              "PLAY_END",
              "SCRUB",
              "IMPRESSION",
            ];
            if (!allowed.includes(eventType as any)) return;
            const accessToken = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
            if (!accessToken) return;
            const deviceId = typeof window !== 'undefined' ? localStorage.getItem('deviceId') ?? undefined : undefined;
            const payload = {
              eventType: eventType as (typeof allowed)[number],
              profileId: activeProfileId,
              titleId: playerMovie.backendId ?? playerMovie.id?.toString?.(),
              occurredAt: new Date().toISOString(),
              deviceId,
              metadata,
            };
            void postEvents([payload], accessToken);
          }}
          onClose={() => {
            setPlayerMovie(null);
            if (typeof window !== "undefined" && window.history.length > 1) {
              router.back();
            } else {
              const targetId = selectedMovie?.backendId ?? selectedMovie?.id;
              if (targetId) {
                router.push(`/title/${targetId}`);
              } else {
                router.push("/");
              }
            }
          }}
        />
      )}
    </div>
  );
}
