'use client';

import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { TopLoader } from "@/components/TopLoader";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

function getExpiryMs(token: string | null) {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length < 2) return null;
  try {
    const payload = JSON.parse(atob(parts[1]));
    if (typeof payload.exp === "number") {
      return payload.exp * 1000;
    }
  } catch {
    return null;
  }
  return null;
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isRefreshing = useRef(false);

  const refreshSession = useCallback(async () => {
    if (typeof window === "undefined") return false;
    const refreshToken = localStorage.getItem("refreshToken");
    if (!refreshToken) return false;
    if (isRefreshing.current) return true;
    isRefreshing.current = true;
    try {
      const res = await fetch("/api/auth/refresh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.accessToken) return false;

      localStorage.setItem("accessToken", data.accessToken);
      if (data.refreshToken) localStorage.setItem("refreshToken", data.refreshToken);
      if (data.deviceId) localStorage.setItem("deviceId", data.deviceId);
      return true;
    } catch {
      return false;
    } finally {
      isRefreshing.current = false;
    }
  }, []);

  const logout = useCallback(() => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("deviceId");
      localStorage.removeItem("activeProfileId");
      localStorage.removeItem("activeProfileName");
      localStorage.removeItem("activeProfileAvatar");
    }
    router.replace("/login");
  }, [router]);
  const [canRenderShell, setCanRenderShell] = useState(false);

  const currentPage = useMemo(() => {
    if (!pathname) return "home";
    if (pathname.startsWith("/search")) return "search";
    if (pathname.startsWith("/onboarding")) return "home";
    if (pathname.startsWith("/dashboard")) return "dashboard";
    if (pathname.startsWith("/settings")) return "settings";
    if (pathname.startsWith("/payment")) return "payment";
    if (pathname.startsWith("/movies")) return "movies";
    if (pathname.startsWith("/series")) return "series";
    if (pathname.startsWith("/kids")) return "kids";
    if (pathname.startsWith("/originals")) return "originals";
    if (pathname.startsWith("/mylist")) return "mylist";
    if (pathname.startsWith("/mymovies")) return "mymovies";
    return "home";
  }, [pathname]);

  useEffect(() => {
    // Prompt user to pick a profile after login, try refreshing if missing access token
    if (typeof window === "undefined") return;
    const run = async () => {
      const isProfileRoute = pathname?.startsWith("/profiles");
      const isOnboardingRoute = pathname?.startsWith("/onboarding");
      const isAuthRoute =
        pathname?.startsWith("/login") ||
        pathname?.startsWith("/register") ||
        pathname?.startsWith("/forgot-password") ||
        pathname?.startsWith("/reset-password") ||
        pathname?.startsWith("/verify-email") ||
        pathname?.startsWith("/oauth/");
      const isAuthOrOnboardingRoute = isAuthRoute || isOnboardingRoute;
      const isSplashRoute = pathname?.startsWith("/splash");
      let token = localStorage.getItem("accessToken");

      if (!token && !isAuthOrOnboardingRoute && !isSplashRoute) {
        const refreshed = await refreshSession();
        token = refreshed ? localStorage.getItem("accessToken") : null;
        if (!token) {
          setCanRenderShell(false);
          router.replace("/splash");
          return;
        }
      }

      const profileId = localStorage.getItem("activeProfileId");
      if (token && !profileId && !isAuthOrOnboardingRoute && !isProfileRoute) {
        setCanRenderShell(false);
        router.replace("/profiles");
        return;
      }

      setCanRenderShell(true);
    };
    void run();
  }, [pathname, refreshSession, router]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const checkExpiry = async () => {
      const token = localStorage.getItem("accessToken");
      const expMs = getExpiryMs(token);
      const now = Date.now();
      const threshold = 5 * 60 * 1000; // 5 minutes

      // If no token but refresh exists, try to refresh
      if (!token && localStorage.getItem("refreshToken")) {
        const ok = await refreshSession();
        if (!ok) logout();
        return;
      }

      if (!expMs) return;
      if (expMs <= now) {
        const ok = await refreshSession();
        if (!ok) logout();
        return;
      }
      if (expMs - now < threshold) {
        await refreshSession();
      }
    };

    void checkExpiry();
    const interval = window.setInterval(() => void checkExpiry(), 15000);
    const onStorage = (e: StorageEvent) => {
      if (e.key === "accessToken") {
        void checkExpiry();
      }
    };
    window.addEventListener("storage", onStorage);
    return () => {
      clearInterval(interval);
      window.removeEventListener("storage", onStorage);
    };
  }, [logout]);

  // Avoid rendering the home shell before redirecting unauthenticated users to splash
  if (!canRenderShell) {
    return null;
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <TopLoader active />
      <Navbar
        currentPage={currentPage}
        onNavigate={(page) => {
          const targetPath = page === "home" ? "/" : `/${page}`;
          router.push(targetPath);
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
        onLogout={logout}
        isAuthenticated={true}
      />
      <main className="pt-28 md:pt-32 px-4 md:px-6">{children}</main>
      <Footer />
    </div>
  );
}
