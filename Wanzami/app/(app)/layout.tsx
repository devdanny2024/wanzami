'use client';

import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { TopLoader } from "@/components/TopLoader";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [canRenderShell, setCanRenderShell] = useState(() => {
    if (typeof window === "undefined") return false;
    const token = localStorage.getItem("accessToken");
    const isSplashRoute = pathname?.startsWith("/splash");
    return !!token || isSplashRoute;
  });

  const currentPage = useMemo(() => {
    if (!pathname) return "home";
    if (pathname.startsWith("/search")) return "search";
    if (pathname.startsWith("/dashboard")) return "dashboard";
    if (pathname.startsWith("/settings")) return "settings";
    if (pathname.startsWith("/ppv")) return "ppv";
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
      pathname?.startsWith("/verify-email");
    const token = localStorage.getItem("accessToken");
    const isSplashRoute = pathname?.startsWith("/splash");
    const shouldBlockAppShell = !token && !isAuthRoute && !isSplashRoute;

    // If logged out, send to splash instead of silently showing the app shell
    if (shouldBlockAppShell) {
      setCanRenderShell(false);
      router.replace("/splash");
      return;
    }

    setCanRenderShell(true);

    if (isAuthRoute || isProfileRoute) return;
    const profileId = localStorage.getItem("activeProfileId");
    if (token && !profileId) {
      router.replace("/profiles");
    }
  }, [pathname, router]);

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
        onLogout={() => {
          if (typeof window !== "undefined") {
            localStorage.removeItem("accessToken");
            localStorage.removeItem("refreshToken");
            localStorage.removeItem("deviceId");
            localStorage.removeItem("activeProfileId");
            localStorage.removeItem("activeProfileName");
            localStorage.removeItem("activeProfileAvatar");
          }
          router.replace("/login");
        }}
        isAuthenticated={true}
      />
      {children}
      <Footer />
    </div>
  );
}
