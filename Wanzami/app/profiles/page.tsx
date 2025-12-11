'use client';

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ProfileChooser } from "@/components/ProfileChooser";

export default function ProfilesPage() {
  const router = useRouter();

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
    if (!token) {
      router.replace("/login");
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-black text-white">
      <ProfileChooser
        onSelected={() => {
          router.replace("/");
        }}
        onLogout={() => {
          localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken");
          localStorage.removeItem("activeProfileId");
          localStorage.removeItem("activeProfileName");
          localStorage.removeItem("activeProfileAvatar");
          router.replace("/login");
        }}
      />
    </div>
  );
}
