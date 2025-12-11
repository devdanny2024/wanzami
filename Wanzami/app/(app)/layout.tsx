'use client';

import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { TopLoader } from "@/components/TopLoader";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

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
    if (isAuthRoute || isProfileRoute) return;
    const token = localStorage.getItem("accessToken");
    const profileId = localStorage.getItem("activeProfileId");
    if (token && !profileId) {
      router.replace("/profiles");
    }
  }, [pathname, router]);

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
        onLogout={() => router.push("/login")}
        isAuthenticated={true}
      />
      {children}
      <Footer />
    </div>
  );
}
