'use client';

import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { TopLoader } from "@/components/TopLoader";
import { usePathname, useRouter } from "next/navigation";
import { useMemo } from "react";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const currentPage = useMemo(() => {
    if (!pathname) return "home";
    if (pathname.startsWith("/search")) return "search";
    if (pathname.startsWith("/dashboard")) return "dashboard";
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
