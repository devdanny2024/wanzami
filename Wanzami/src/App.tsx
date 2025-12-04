import { useEffect, useState } from 'react';
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

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pendingVerification, setPendingVerification] = useState<{ email: string; name: string } | null>(null);
  const [currentPage, setCurrentPage] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("currentPage") ?? "home";
    }
    return "home";
  });
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
  const globalLoading = catalogLoading || recsLoading;

  const handleSplashComplete = () => {
    setShowSplash(false);
    setShowRegistration(true); // Show registration after splash
  };

  const handleSplashLogin = () => {
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
  }, []);

  useEffect(() => {
    // Restore auth state and selected profile from localStorage so a reload doesn't sign the user out.
    const access = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    const refresh = typeof window !== 'undefined' ? localStorage.getItem('refreshToken') : null;
    if (access || refresh) {
      setShowSplash(false);
      setIsAuthenticated(true);
      setShowRegistration(false);
      setPendingVerification(null);

      const profileId = localStorage.getItem('activeProfileId');
      const profileName = localStorage.getItem('activeProfileName');
      const profileAvatar = localStorage.getItem('activeProfileAvatar');
      if (profileId && profileName) {
        setActiveProfile({ id: profileId, name: profileName, avatarUrl: profileAvatar });
      }
    }
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
    setShowRegistration(false);
    setPendingVerification(null);
  };

  const handleAuth = () => {
    setIsAuthenticated(true);
    setPendingVerification(null);
    const hasLabel = typeof window !== 'undefined' ? localStorage.getItem('deviceLabel') : null;
    if (!hasLabel) {
      setShowDevicePrompt(true);
    }
    setActiveProfile(null);
  };

  const handleShowSignup = () => {
    setShowRegistration(true);
    setPendingVerification(null);
  };

  const handleLogout = (options?: { showLogin?: boolean }) => {
    setIsAuthenticated(false);
    setCurrentPage('home');
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
    setCurrentPage(page);
    setSelectedMovie(null);
    if (typeof window !== 'undefined') {
      localStorage.setItem("currentPage", page);
    }
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
    void sendEvent("IMPRESSION", enriched);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCloseMovie = () => {
    setSelectedMovie(null);
    const merged = combineContinueWatching(serverContinueWatching, activeProfile?.id);
    setContinueWatchingItems(merged);
  };

  const handlePlayClick = (movie: any) => {
    setPlayerMovie(movie);
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
    setCurrentPage('blogpost');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCategoryClick = (category: string) => {
    setSelectedCategory(category);
    setCurrentPage('blogcategory');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBlogSearchClick = () => {
    setCurrentPage('blogsearch');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const readLocalResume = (profileId?: string | null) => {
    if (typeof window === "undefined") return [];
    const keyPrefix = `progress:${profileId ?? "anon"}:`;
    const items: Array<{ titleId: string; completionPercent: number; updatedAt: number }> = [];
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
      mergedMap.set(String(item.id), { ...item });
    });
    local.forEach((loc) => {
      const existing = mergedMap.get(loc.titleId);
      if (existing) {
        const current = existing.completionPercent ?? 0;
        if (loc.completionPercent > current) {
          mergedMap.set(loc.titleId, { ...existing, completionPercent: loc.completionPercent });
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
        });
      }
    });
    return Array.from(mergedMap.values()).map((item, idx) => {
      const match = catalogMovies.find((m) => m.backendId === item.id || String(m.id) === String(item.id));
      const fallbackId = Number(item.id);
      const numericId = Number.isNaN(fallbackId) ? Date.now() + idx : fallbackId;
      return {
        id: match?.id ?? numericId,
        backendId: match?.backendId ?? String(item.id),
        title: match?.title ?? item.name ?? `Title ${item.id}`,
        image:
          match?.image ??
          item.thumbnailUrl ??
          item.posterUrl ??
          "https://placehold.co/600x900/111111/FD7E14?text=Wanzami",
        rating: match?.rating,
        type: match?.type ?? item.type,
        completionPercent: item.completionPercent,
      } as MovieData;
    });
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("currentPage", currentPage);
    }
  }, [currentPage]);

  const handleBackToBlog = () => {
    setCurrentPage('blog');
    setSelectedBlogPost(null);
    setSelectedCategory(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

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
        setCatalogError(err?.message ?? "Failed to load catalog");
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
        const message = err?.message ?? "Failed to load recommendations";
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

  // Show splash screen
  if (showSplash) {
    return <SplashScreen onStartRegistration={handleSplashComplete} onLogin={handleSplashLogin} />;
  }

  // Show registration page if not authenticated
  if (!isAuthenticated && showRegistration) {
    return (
      <RegistrationFlow
        onAuth={handleRegistrationComplete}
        onBack={handleRegistrationBack}
        onLogin={handleShowLoginFromRegistration}
      />
    );
  }

  // Show auth page if not authenticated
  if (!isAuthenticated) {
    if (pendingVerification) {
      return (
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
      );
    }
    return <AuthPage onAuth={handleAuth} onShowSignup={handleShowSignup} />;
  }

  // Force profile selection before entering the app
  if (isAuthenticated && !activeProfile) {
    return <ProfileChooser onSelected={(p) => setActiveProfile(p)} onLogout={handleLogout} />;
  }

  // Check if selected movie is a PPV movie
  const isPPVMovie = selectedMovie && selectedMovie.price !== undefined;
  const activeProfileId = activeProfile?.id;

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
          currentPage={currentPage}
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
      ) : currentPage === 'home' ? (
        <div key="home">
          <HomePage
            onMovieClick={handleMovieClick}
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
      ) : currentPage === 'search' ? (
        <div key="search">
          <SearchPage
            onMovieClick={handleMovieClick}
            movies={catalogMovies}
            loading={catalogLoading}
            error={catalogError}
          />
          <Footer />
        </div>
      ) : currentPage === 'dashboard' ? (
        <div key="dashboard">
          <Dashboard onMovieClick={handleMovieClick} />
          <Footer />
        </div>
      ) : currentPage === 'ppv' ? (
        <div key="ppv">
          <div className="min-h-screen bg-black pt-24 md:pt-32 pb-12 px-4 md:px-12 lg:px-16">
            <h1 className="text-white text-3xl md:text-4xl mb-4">Pay-Per-View</h1>
            <p className="text-gray-400 mb-8">Rent premium movies and watch for 48 hours</p>
            <div className="text-gray-500">Browse all PPV content - Full catalog coming soon!</div>
          </div>
          <Footer />
        </div>
      ) : currentPage === 'payment' ? (
        <div key="payment">
          <PaymentPage />
          <Footer />
        </div>
      ) : currentPage === 'movies' ? (
        <div key="movies">
          <div className="min-h-screen bg-black pt-24 md:pt-32 pb-12 px-4 md:px-12 lg:px-16">
            <h1 className="text-white text-3xl md:text-4xl mb-8">Movies</h1>
            <p className="text-gray-400">Browse all movies - Coming soon!</p>
          </div>
          <Footer />
        </div>
      ) : currentPage === 'series' ? (
        <div key="series">
          <div className="min-h-screen bg-black pt-24 md:pt-32 pb-12 px-4 md:px-12 lg:px-16">
            <h1 className="text-white text-3xl md:text-4xl mb-8">Series</h1>
            <p className="text-gray-400">Browse all series - Coming soon!</p>
          </div>
          <Footer />
        </div>
      ) : currentPage === 'kids' ? (
        <div key="kids">
          <div className="min-h-screen bg-black pt-24 md:pt-32 pb-12 px-4 md:px-12 lg:px-16">
            <h1 className="text-white text-3xl md:text-4xl mb-8">Kids</h1>
            <p className="text-gray-400">Kids content - Coming soon!</p>
          </div>
          <Footer />
        </div>
      ) : currentPage === 'originals' ? (
        <div key="originals">
          <div className="min-h-screen bg-black pt-24 md:pt-32 pb-12 px-4 md:px-12 lg:px-16">
            <h1 className="text-white text-3xl md:text-4xl mb-8">Wanzami Originals</h1>
            <p className="text-gray-400">Exclusive original content - Coming soon!</p>
          </div>
          <Footer />
        </div>
      ) : currentPage === 'mylist' ? (
        <div key="mylist">
          <div className="min-h-screen bg-black pt-24 md:pt-32 pb-12 px-4 md:px-12 lg:px-16">
            <h1 className="text-white text-3xl md:text-4xl mb-8">My List</h1>
            <p className="text-gray-400">Your saved content - Coming soon!</p>
          </div>
          <Footer />
        </div>
      ) : currentPage === 'blog' ? (
        <div key="blog">
          <BlogHomePage onPostClick={handleBlogPostClick} onCategoryClick={handleCategoryClick} onSearchClick={handleBlogSearchClick} />
          <Footer />
        </div>
      ) : currentPage === 'blogpost' ? (
        <div key="blogpost">
          <BlogPostPage post={selectedBlogPost} onBack={handleBackToBlog} />
          <Footer />
        </div>
      ) : currentPage === 'blogcategory' ? (
        <div key="blogcategory">
          <BlogCategoryPage category={selectedCategory} onPostClick={handleBlogPostClick} onBack={handleBackToBlog} />
          <Footer />
        </div>
      ) : currentPage === 'blogsearch' ? (
        <div key="blogsearch">
          <BlogSearchPage onPostClick={handleBlogPostClick} onBack={handleBackToBlog} />
          <Footer />
        </div>
      ) : null}

      {playerMovie && (
        <CustomMediaPlayer
          title={playerMovie.title}
          poster={playerMovie.image ?? playerMovie.thumbnailUrl ?? playerMovie.posterUrl}
          titleId={playerMovie.backendId ?? playerMovie.id?.toString?.()}
          profileId={activeProfileId}
          sources={[
            {
              src:
                playerMovie.trailerUrl ||
                "https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
              label: playerMovie.trailerUrl ? "Default" : "Demo",
              type: "video/mp4",
            },
          ]}
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
          onClose={() => setPlayerMovie(null)}
        />
      )}
    </div>
  );
}
