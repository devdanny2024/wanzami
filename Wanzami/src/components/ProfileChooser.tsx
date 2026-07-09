'use client';

import { useEffect, useState, useRef } from "react";
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
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-cs-paper text-cs-ink">
      {/* Paper vignette */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_80%_at_50%_-10%,rgba(253,126,20,0.10),transparent_55%)]" />

      <div
        className="fixed top-0 left-0 right-0 h-1 bg-cs-line z-10"
        style={{ opacity: barVisible ? 1 : 0, transition: "opacity 0.2s ease" }}
      >
        <div
          className="h-full bg-brand"
          style={{ width: `${barProgress}%`, transition: "width 0.2s ease" }}
        />
      </div>

      <div className="relative z-[1] w-full max-w-5xl container-page py-14 sm:py-16">
        <div className="text-center mb-10 sm:mb-14">
          <p className="cs-slug mb-3">Call sheet — cast &amp; crew</p>
          <h1 className="font-heading text-5xl sm:text-6xl md:text-7xl tracking-wide text-cs-ink leading-[0.95] uppercase">
            Who&apos;s Watching?
          </h1>
          <p className="text-cs-muted mt-3 text-sm sm:text-base">
            Pick a profile to start streaming — or add a new one (max 4).
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-3 text-cs-muted py-16">
            <Loader />
            <span>Loading profiles...</span>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5 sm:gap-7 justify-items-center mb-12">
            {profiles.map((p) => (
              <button
                key={p.id}
                onClick={() => handleSelect(p)}
                className="group flex flex-col items-center gap-3 w-full max-w-[160px] focus:outline-none"
              >
                <div className="relative w-full aspect-square overflow-hidden bg-cs-panel cs-border-thin transition-all duration-200 group-hover:-translate-y-1 group-hover:cs-shadow group-hover:ring-2 group-hover:ring-cs-rust group-focus-visible:ring-2 group-focus-visible:ring-cs-rust">
                  {p.avatarUrl ? (
                    <img src={p.avatarUrl} alt={p.name} className="object-cover w-full h-full" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-brand/30 to-brand/5 flex items-center justify-center">
                      <span className="font-heading text-6xl sm:text-7xl text-cs-ink/90">
                        {p.name.slice(0, 1).toUpperCase()}
                      </span>
                    </div>
                  )}
                  {p.kidMode && (
                    <span className="absolute top-2 left-2 bg-emerald-500/90 px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wide text-white border border-white/70">
                      Kids
                    </span>
                  )}
                </div>
                <span className="text-sm sm:text-base font-medium text-cs-muted transition-colors group-hover:text-cs-ink truncate max-w-full">
                  {p.name}
                </span>
              </button>
            ))}

            {profiles.length < 4 && (
              <button
                onClick={() => setShowModal(true)}
                className="group flex flex-col items-center gap-3 w-full max-w-[160px] focus:outline-none"
              >
                <div className="relative w-full aspect-square border-2 border-dashed border-cs-ink/40 bg-cs-panel flex items-center justify-center transition-all duration-200 group-hover:-translate-y-1 group-hover:border-cs-rust group-focus-visible:ring-2 group-focus-visible:ring-cs-rust">
                  <span className="flex h-16 w-16 items-center justify-center rounded-full cs-border-thin bg-cs-paper text-4xl font-light text-cs-ink transition-colors group-hover:border-cs-rust group-hover:text-cs-rust">
                    +
                  </span>
                </div>
                <span className="text-sm sm:text-base font-medium text-cs-muted transition-colors group-hover:text-cs-ink">
                  Add profile
                </span>
              </button>
            )}
          </div>
        )}

        <div className="flex items-center justify-center">
          <button
            onClick={onLogout}
            className="min-h-10 px-5 py-2.5 font-mono text-xs font-bold uppercase tracking-[0.08em] cs-border-thin text-cs-muted hover:text-cs-ink hover:bg-cs-panel transition-colors"
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
              className="w-full max-w-lg md:max-w-2xl bg-cs-panel cs-border cs-shadow-lg p-5 sm:p-6 text-cs-ink max-h-[85vh] overflow-auto"
            >
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="font-heading text-2xl sm:text-3xl tracking-wide uppercase text-cs-ink">Create profile</h3>
                  <p className="text-cs-muted text-sm">Pick an avatar and name.</p>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full cs-border-thin bg-cs-paper hover:bg-cs-panel transition-colors"
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-5">
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 justify-items-center">
                  {AVATAR_OPTIONS.map((src) => (
                    <button
                      key={src}
                      onClick={() => setSelectedAvatar(src)}
                      className={`border-2 w-full aspect-square max-w-[88px] overflow-hidden transition-all ${
                        selectedAvatar === src
                          ? "border-cs-rust ring-2 ring-cs-rust/40"
                          : "border-cs-ink/30 hover:border-cs-ink"
                      }`}
                    >
                      <img src={src} alt="Avatar option" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>

                <div className="space-y-2">
                  <label className="block font-mono text-[11px] font-bold uppercase tracking-[0.08em] text-cs-ink">Profile name</label>
                  <input
                    className="w-full bg-cs-paper cs-border-thin px-3 py-3 text-cs-ink text-sm focus:outline-none focus:border-cs-rust focus:ring-1 focus:ring-cs-rust transition-colors"
                    placeholder="Profile name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>

                <label className="flex items-center gap-2 text-sm text-cs-ink">
                  <input
                    type="checkbox"
                    checked={kidMode}
                    onChange={(e) => setKidMode(e.target.checked)}
                    className="rounded accent-brand"
                  />
                  Kids profile
                </label>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    onClick={() => setShowModal(false)}
                    className="min-h-10 px-4 py-2.5 cs-border-thin text-cs-muted hover:text-cs-ink hover:bg-cs-paper font-mono text-xs font-bold uppercase tracking-[0.08em] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreate}
                    disabled={creating}
                    className="min-h-10 px-5 py-2.5 bg-cs-rust text-cs-paper font-mono text-xs font-bold uppercase tracking-[0.08em] cs-shadow-sm disabled:opacity-60 transition-transform hover:-translate-y-0.5"
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
