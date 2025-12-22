'use client';

import { useEffect, useState } from "react";
import { Loader } from "./ui/loader";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";

type Profile = {
  id: string;
  name: string;
  avatarUrl?: string | null;
  kidMode?: boolean;
};

interface ProfileChooserProps {
  onSelected: (profile: Profile) => void;
  onLogout: () => void;
}

const headersWithAuth = () => {
  const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
  const deviceId = typeof window !== "undefined" ? localStorage.getItem("deviceId") : null;
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  if (deviceId) headers["x-device-id"] = deviceId;
  return headers;
};

const AVATAR_OPTIONS = [
  "/avatars/avatar1.svg",
  "/avatars/avatar2.svg",
  "/avatars/avatar3.svg",
  "/avatars/avatar4.svg",
  "/avatars/avatar5.svg",
  "/avatars/avatar6.svg",
];

export function ProfileChooser({ onSelected, onLogout }: ProfileChooserProps) {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [barVisible, setBarVisible] = useState(false);
  const [barProgress, setBarProgress] = useState(0);
  const progressTimer = useRef<NodeJS.Timeout | null>(null);
  const [name, setName] = useState("");
  const [kidMode, setKidMode] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState(AVATAR_OPTIONS[0]);
  const [showModal, setShowModal] = useState(false);

  const startBar = () => {
    if (progressTimer.current) clearInterval(progressTimer.current);
    setBarVisible(true);
    setBarProgress(10);
    progressTimer.current = setInterval(() => {
      setBarProgress((p) => (p < 90 ? p + 8 : p));
    }, 250);
  };

  const finishBar = () => {
    if (progressTimer.current) clearInterval(progressTimer.current);
    setBarProgress(100);
    setTimeout(() => {
      setBarVisible(false);
      setBarProgress(0);
    }, 300);
  };

  const fetcher = async (path: string, init?: RequestInit) => {
    const res = await fetch(path, {
      ...init,
      headers: {
        ...headersWithAuth(),
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

  const loadProfiles = async () => {
    setLoading(true);
    startBar();
    try {
      const data = await fetcher("/api/user/profiles");
      setProfiles(data.profiles ?? []);
    } catch (err: any) {
      toast.error(err.message ?? "Unable to load profiles");
    } finally {
      setLoading(false);
      finishBar();
    }
  };

  useEffect(() => {
    loadProfiles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (showModal) {
      const original = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = original;
      };
    }
  }, [showModal]);

  const handleSelect = async (profile: Profile) => {
    const deviceId = localStorage.getItem("deviceId");
    if (!deviceId) {
      toast.error("Missing device. Please log in again.");
      return;
    }
    try {
      startBar();
      await fetcher(`/api/user/devices/${deviceId}/profile`, {
        method: "POST",
        body: JSON.stringify({ profileId: profile.id }),
      });
      localStorage.setItem("activeProfileId", profile.id);
      localStorage.setItem("activeProfileName", profile.name);
      if (profile.avatarUrl) {
        localStorage.setItem("activeProfileAvatar", profile.avatarUrl);
      } else {
        localStorage.removeItem("activeProfileAvatar");
      }
      onSelected(profile);
    } catch (err: any) {
      toast.error(err.message ?? "Unable to select profile");
    } finally {
      finishBar();
    }
  };

  const handleCreate = async () => {
    if (!name.trim()) {
      toast.error("Name is required");
      return;
    }
    setCreating(true);
    startBar();
    try {
      const data = await fetcher("/api/user/profiles", {
        method: "POST",
        body: JSON.stringify({
          name,
          kidMode,
          avatarUrl: selectedAvatar,
        }),
      });
      setProfiles((prev) => [...prev, data.profile]);
      setName("");
      setKidMode(false);
      setSelectedAvatar(AVATAR_OPTIONS[0]);
      setShowModal(false);
      toast.success("Profile created");
    } catch (err: any) {
      toast.error(err.message ?? "Unable to create profile");
    } finally {
      setCreating(false);
      finishBar();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black">
      <div
        className="fixed top-0 left-0 right-0 h-1 bg-white/10"
        style={{ opacity: barVisible ? 1 : 0, transition: "opacity 0.2s ease" }}
      >
        <div
          className="h-full bg-[#fd7e14]"
          style={{ width: `${barProgress}%`, transition: "width 0.2s ease" }}
        />
      </div>
      <div className="max-w-5xl w-full px-6">
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-semibold text-white">Who&apos;s watching?</h1>
          <p className="text-gray-400 mt-2">Pick a profile or create a new one (max 4).</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-3 text-gray-300">
            <Loader />
            <span>Loading profiles...</span>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4 mb-10">
            {profiles.map((p) => (
              <button
                key={p.id}
                onClick={() => handleSelect(p)}
                className="group relative border border-white/10 rounded-xl bg-white/5 hover:bg-white/10 transition overflow-hidden max-w-xs mx-auto"
              >
                <div className="aspect-square max-h-40 bg-gradient-to-br from-[#fd7e14]/20 to-[#fd7e14]/5 flex items-center justify-center">
                  {p.avatarUrl ? (
                    <img src={p.avatarUrl} alt={p.name} className="object-cover w-full h-full" />
                  ) : (
                    <span className="text-5xl text-white/80 font-semibold">
                      {p.name.slice(0, 1).toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="p-3 text-left">
                  <div className="text-lg font-semibold text-white">{p.name}</div>
                  {p.kidMode && <div className="text-xs text-emerald-400 mt-1">Kids</div>}
                </div>
              </button>
            ))}

            {profiles.length < 4 && (
              <button
                onClick={() => setShowModal(true)}
                className="border border-dashed border-white/20 rounded-xl p-4 bg-white/5 hover:border-[#fd7e14]/60 hover:bg-white/10 transition relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-white/5 blur-xl" />
                <div className="relative flex flex-col items-center justify-center h-full gap-3">
                  <div className="w-16 h-16 rounded-full bg-white/10 border border-white/20 flex items-center justify-center backdrop-blur-md">
                    <span className="text-3xl text-white">+</span>
                  </div>
                  <div className="text-white font-semibold">Add profile</div>
                  <div className="text-xs text-gray-400">Tap to create</div>
                </div>
              </button>
            )}
          </div>
        )}

        <div className="flex items-center justify-center gap-4">
          <button
            onClick={onLogout}
            className="px-4 py-2 text-sm rounded-lg border border-white/10 text-gray-300 hover:bg-white/5"
          >
            Sign out
          </button>
        </div>
      </div>

      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[9999] px-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-xl md:max-w-2xl bg-white/8 border border-white/10 rounded-2xl p-6 text-white shadow-2xl max-h-[80vh] overflow-auto"
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-xl font-semibold">Create profile</h3>
                  <p className="text-gray-400 text-sm">Pick an avatar and name.</p>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="w-9 h-9 rounded-full border border-white/15 bg-white/5 hover:bg-white/10"
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 justify-items-center">
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

                <div className="space-y-2">
                  <label className="text-sm text-gray-300">Profile name</label>
                  <input
                    className="w-full rounded-lg bg-black/40 border border-white/10 px-3 py-3 text-white text-sm"
                    placeholder="Profile name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
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

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 rounded-lg border border-white/10 text-gray-300 hover:bg-white/5 text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreate}
                    disabled={creating}
                    className="px-4 py-2 rounded-lg bg-[#fd7e14] hover:bg-[#ff9f4d] text-black font-semibold disabled:opacity-60 text-sm"
                  >
                    {creating ? "Creating..." : "Add profile"}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
