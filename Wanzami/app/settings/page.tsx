'use client';

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader } from "@/components/ui/loader";

type Profile = {
  id: string;
  name: string;
  avatarUrl?: string | null;
  kidMode?: boolean;
  language?: string;
  autoplay?: boolean;
};

const AVATAR_OPTIONS = [
  "/avatars/avatar1.svg",
  "/avatars/avatar2.svg",
  "/avatars/avatar3.svg",
  "/avatars/avatar4.svg",
  "/avatars/avatar5.svg",
  "/avatars/avatar6.svg",
];

const authHeaders = () => {
  const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
  const deviceId = typeof window !== "undefined" ? localStorage.getItem("deviceId") : null;
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  if (deviceId) headers["x-device-id"] = deviceId;
  return headers;
};

export default function SettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [profileName, setProfileName] = useState("");
  const [kidMode, setKidMode] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState("/avatars/avatar1.svg");
  const [showProfileModal, setShowProfileModal] = useState(false);

  const hasAuth = useMemo(() => {
    if (typeof window === "undefined") return false;
    return Boolean(localStorage.getItem("accessToken"));
  }, []);

  const fetcher = async (path: string, init?: RequestInit) => {
    const res = await fetch(path, {
      ...init,
      headers: {
        ...authHeaders(),
        ...(init?.headers ?? {}),
      },
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const msg = data.message ?? "Request failed";
      throw new Error(msg);
    }
    return data;
  };

  const loadAll = async () => {
    if (!hasAuth) {
      setLoading(false);
      return;
    }
    try {
      const p = await fetcher("/api/user/profiles");
      setProfiles(p.profiles ?? []);
    } catch (err: any) {
      toast.error(err.message ?? "Unable to load settings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (showProfileModal) {
      const original = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = original;
      };
    }
  }, [showProfileModal]);

  const createProfile = async () => {
    if (profiles.length >= 4) {
      toast.error("You can only have up to 4 profiles.");
      return;
    }
    if (!profileName.trim()) {
      toast.error("Name is required");
      return;
    }
    try {
      const data = await fetcher("/api/user/profiles", {
        method: "POST",
        body: JSON.stringify({ name: profileName, kidMode, avatarUrl: selectedAvatar }),
      });
      setProfiles((prev) => [...prev, data.profile]);
      setProfileName("");
      setKidMode(false);
      setSelectedAvatar("/avatars/avatar1.svg");
      setShowProfileModal(false);
      toast.success("Profile created");
    } catch (err: any) {
      toast.error(err.message ?? "Unable to create profile");
    }
  };

  const deleteProfile = async (id: string) => {
    try {
      await fetcher(`/api/user/profiles/${id}`, { method: "DELETE" });
      setProfiles((prev) => prev.filter((p) => p.id !== id));
      toast.success("Profile removed");
    } catch (err: any) {
      toast.error(err.message ?? "Unable to delete profile");
    }
  };

  if (!hasAuth) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#0b0b0c] text-white px-6">
        <div className="text-center space-y-3 max-w-xl">
          <h1 className="text-3xl font-semibold">Sign in to manage your account</h1>
          <p className="text-gray-400">
            Profiles are available after you log in.
          </p>
        </div>
      </main>
    );
  }

    return (
      <main className="min-h-screen bg-[#0b0b0c] text-white px-4 md:px-6 py-6 md:py-10 flex justify-start md:justify-center">
        <div className="w-full max-w-6xl space-y-8 md:space-y-10">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="px-3 py-2 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-sm text-white/80"
            >
              Back
            </button>
            <h1 className="text-4xl font-semibold">Account Settings</h1>
          </div>
          <p className="text-gray-400">
            Manage your Wanzami profiles. Billing and wallet will return with the next design update.
          </p>
        </div>

          {loading ? (
            <div className="flex items-center justify-center gap-3 text-gray-300 py-20">
            <Loader />
            <span>Loading your settings…</span>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Profiles */}
            <section className="bg-[#141414] border border-gray-800 rounded-xl p-6 space-y-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-semibold">Profiles</h2>
                  <p className="text-gray-400 text-sm">
                    Create and edit viewing profiles (Netflix-style, up to 4).
                  </p>
                </div>
                {profiles.length < 4 && (
                  <button
                    onClick={() => setShowProfileModal(true)}
                    className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/10 hover:bg-white/15 text-sm"
                  >
                    <span className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center">+</span>
                    Add profile
                  </button>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {profiles.map((p) => (
                  <div
                    key={p.id}
                    className="border border-gray-800 rounded-lg p-4 bg-[#0f0f10] space-y-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 md:w-14 md:h-14 rounded-full overflow-hidden border border-white/10">
                        {p.avatarUrl ? (
                          <img src={p.avatarUrl} alt={p.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-[#fd7e14]/20 flex items-center justify-center text-white text-xl font-semibold">
                            {p.name.slice(0, 1).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="text-lg font-semibold">{p.name}</div>
                        {p.kidMode ? (
                          <div className="text-xs text-emerald-400 mt-1">Kids</div>
                        ) : (
                          <div className="text-xs text-gray-500 mt-1">Standard</div>
                        )}
                      </div>
                      <button
                        className="text-sm text-red-400 hover:text-red-300"
                        onClick={() => deleteProfile(p.id)}
                        disabled={profiles.length <= 1}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>

          </div>
        )}
      </div>
      {showProfileModal && (
        <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-md flex items-center justify-center px-4">
          <div className="w-full max-w-xl md:max-w-2xl bg-[#111]/95 border border-white/10 rounded-2xl p-6 text-white shadow-2xl max-h-[80vh] overflow-auto">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xl font-semibold">Create profile</h3>
                <p className="text-gray-400 text-sm">Pick an avatar and name.</p>
              </div>
              <button
                onClick={() => setShowProfileModal(false)}
                className="w-9 h-9 rounded-full border border-white/15 bg-white/5 hover:bg-white/10"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4 justify-items-center">
              {AVATAR_OPTIONS.map((src) => (
                <button
                  key={src}
                  onClick={() => setSelectedAvatar(src)}
                  className={`rounded-xl border w-24 h-24 overflow-hidden ${
                    selectedAvatar === src
                      ? "border-[#fd7e14] bg-[#fd7e14]/10"
                      : "border-white/10 hover:border-white/30"
                  }`}
                >
                  <img src={src} alt="Avatar option" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>

            <div className="space-y-3">
              <div className="space-y-2">
                <label className="text-sm text-gray-300">Profile name</label>
                <input
                  className="w-full rounded-lg bg-black/40 border border-white/10 px-3 py-3 text-white text-sm"
                  placeholder="e.g. Peter"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                />
              </div>

              <label className="flex items-center gap-2 text-sm text-gray-300">
                <input
                  type="checkbox"
                  checked={kidMode}
                  onChange={(e) => setKidMode(e.target.checked)}
                  className="rounded"
                />
                Kids profile
              </label>

              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={() => setShowProfileModal(false)}
                  className="px-4 py-2 rounded-lg border border-white/10 text-gray-300 hover:bg-white/5 text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={createProfile}
                  disabled={profiles.length >= 4}
                  className="px-4 py-2 rounded-lg bg-[#fd7e14] hover:bg-[#ff9f4d] text-black font-semibold disabled:opacity-60 text-sm"
                >
                  {profiles.length >= 4 ? "Profile limit reached" : "Add profile"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
