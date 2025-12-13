'use client';

import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { TopLoader } from "@/components/TopLoader";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

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
  const [canRenderShell, setCanRenderShell] = useState(() => {
    if (typeof window === "undefined") return false;
    const token = localStorage.getItem("accessToken");
    const profileId = localStorage.getItem("activeProfileId");
    const isSplashRoute = pathname?.startsWith("/splash");
    const isProfileRoute = pathname?.startsWith("/profiles");
    const isAuthRoute =
      pathname?.startsWith("/login") ||
      pathname?.startsWith("/register") ||
      pathname?.startsWith("/forgot-password") ||
      pathname?.startsWith("/reset-password") ||
      pathname?.startsWith("/verify-email") ||
      pathname?.startsWith("/oauth/");

    if (!token && !isSplashRoute && !isAuthRoute) return false;
    if (token && !profileId && !isProfileRoute && !isAuthRoute) return false;
    return true;
  });

  const currentPage = useMemo(() => {
    if (!pathname) return "home";
    if (pathname.startsWith("/search")) return "search";
    if (pathname.startsWith("/dashboard")) return "dashboard";
    if (pathname.startsWith("/settings")) return "settings";
    if (pathname.startsWith("/payment")) return "payment";
    if (pathname.startsWith("/movies")) return "movies";
    if (pathname.startsWith("/series")) return "series";
    if (pathname.startsWith("/kids")) return "kids";
    if (pathname.startsWith("/originals")) return "originals";
    if (pathname.startsWith("/mylist")) return "mylist";
    if (pathname.startsWith("/blog")) return "blog";
    return "home";
  }, [pathname]);

  useEffect(() => {
    // Prompt user to pick a profile after login
    if (typeof window === "undefined") return;
    const isProfileRoute = pathname?.startsWith("/profiles");
    const isAuthRoute =
      pathname?.startsWith("/login") ||
      pathname?.startsWith("/register") ||
      pathname?.startsWith("/forgot-password") ||
      pathname?.startsWith("/reset-password") ||
      pathname?.startsWith("/verify-email") ||
      pathname?.startsWith("/oauth/");
    const token = localStorage.getItem("accessToken");
    const isSplashRoute = pathname?.startsWith("/splash");
    const shouldBlockAppShell = !token && !isAuthRoute && !isSplashRoute;

    // If logged out, send to splash instead of silently showing the app shell
    if (shouldBlockAppShell) {
      setCanRenderShell(false);
      router.replace("/splash");
      return;
    }

    const profileId = localStorage.getItem("activeProfileId");
    if (token && !profileId && !isAuthRoute && !isProfileRoute) {
      setCanRenderShell(false);
      router.replace("/profiles");
      return;
    }

    setCanRenderShell(true);
    if (isAuthRoute || isProfileRoute) return;
  }, [pathname, router]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const checkExpiry = () => {
      const token = localStorage.getItem("accessToken");
      const expMs = getExpiryMs(token);
      if (!expMs) return;
      if (expMs <= Date.now()) {
        logout();
      }
    };

    checkExpiry();
    const interval = window.setInterval(checkExpiry, 15000);
    const onStorage = (e: StorageEvent) => {
      if (e.key === "accessToken") {
        checkExpiry();
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
      {children}
      <Footer />
    </div>
  );
}
