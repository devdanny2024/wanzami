'use client';

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AlertTriangle } from "lucide-react";
import { Loader } from "@/components/ui/loader";

type Profile = {
  id: string;
  name: string;
  avatarUrl?: string | null;
  kidMode?: boolean;
  language?: string;
  autoplay?: boolean;
  preferences?: Record<string, any> | null;
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
  const [activeProfileId, setActiveProfileId] = useState<string | null>(null);
  const [autoplay, setAutoplay] = useState(true);
  const [language, setLanguage] = useState("en");
  const [dataSaver, setDataSaver] = useState(false);
  const [defaultQuality, setDefaultQuality] = useState<"auto" | "hd" | "sd">("auto");
  const [emailUpdates, setEmailUpdates] = useState(true);
  const [productNews, setProductNews] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const setActiveProfileFromProfile = (profile: Profile) => {
    setActiveProfileId(profile.id);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("activeProfileId", profile.id);
      } catch {
        // ignore
      }
    }
    setAutoplay(profile.autoplay ?? true);
    setLanguage(profile.language ?? "en");
    const prefs = (profile.preferences ?? {}) as any;
    setDataSaver(Boolean(prefs.dataSaver));
    setDefaultQuality((prefs.defaultQuality as any) ?? "auto");
    setEmailUpdates(prefs.emailUpdates !== false);
    setProductNews(Boolean(prefs.productNews));
  };

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
      const list: Profile[] = p.profiles ?? [];
      setProfiles(list);
      const storedActive = typeof window !== "undefined" ? localStorage.getItem("activeProfileId") : null;
      const active = list.find((prof) => prof.id === storedActive) ?? list[0] ?? null;
      if (active) {
        setActiveProfileFromProfile(active);
      }
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

  useEffect(() => {
    if (showDeleteModal) {
      const original = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = original;
      };
    }
  }, [showDeleteModal]);

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

  const savePreferences = async () => {
    if (!activeProfileId) return;
    try {
      const body = {
        language,
        autoplay,
        preferences: {
          dataSaver,
          defaultQuality,
          emailUpdates,
          productNews,
        },
      };
      await fetcher(`/api/user/profiles/${activeProfileId}`, {
        method: "PATCH",
        body: JSON.stringify(body),
      });
      toast.success("Preferences saved");
    } catch (err: any) {
      toast.error(err.message ?? "Unable to save preferences");
    }
  };

  const deleteAccount = async () => {
    if (deleteConfirmText !== "DELETE") return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await fetcher("/api/user/account", { method: "DELETE" });
      // Success: clear local auth state exactly like the app's logout flow, then leave.
      if (typeof window !== "undefined") {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("deviceId");
        localStorage.removeItem("activeProfileId");
        localStorage.removeItem("activeProfileName");
        localStorage.removeItem("activeProfileAvatar");
      }
      toast.success("Your account has been deleted");
      setShowDeleteModal(false);
      router.replace("/login");
    } catch (err: any) {
      const msg = err.message ?? "Unable to delete your account. Please try again.";
      setDeleteError(msg);
      toast.error(msg);
    } finally {
      setDeleting(false);
    }
  };

  if (!hasAuth) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-cs-paper text-cs-ink cs-paper-root px-6 home-root">
        <div className="text-center space-y-3 max-w-xl">
          <h1 className="font-heading text-4xl sm:text-5xl tracking-wide leading-none uppercase text-cs-ink">Sign in to manage your account</h1>
          <p className="text-cs-muted">
            Profiles are available after you log in.
          </p>
        </div>
      </main>
    );
  }

    return (
      <main className="min-h-screen bg-cs-paper text-cs-ink cs-paper-root pt-24 md:pt-28 pb-10 container-page home-root">
        <div className="w-full max-w-5xl mx-auto space-y-8 md:space-y-10">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="min-h-10 px-3 py-2 cs-border-thin bg-cs-panel hover:bg-cs-paper font-mono text-xs font-bold uppercase tracking-[0.08em] text-cs-muted hover:text-cs-ink transition-colors"
            >
              Back
            </button>
            <h1 className="font-heading text-4xl sm:text-5xl tracking-wide leading-none uppercase text-cs-ink">Account Settings</h1>
          </div>
          <p className="text-cs-muted">
            Manage your Wanzami profiles. Billing and wallet will return with the next design update.
          </p>
        </div>

          {loading ? (
            <div className="flex items-center justify-center gap-3 text-cs-muted py-20">
            <Loader />
            <span>Loading your settings…</span>
          </div>
        ) : (
            <div className="space-y-8">
            {/* Profiles */}
            <section className="bg-cs-panel cs-border cs-shadow p-5 sm:p-6 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="font-heading text-2xl sm:text-3xl tracking-wide uppercase text-cs-ink">Profiles</h2>
                  <p className="text-cs-muted text-sm">
                    Create and edit viewing profiles (Netflix-style, up to 4).
                  </p>
                </div>
                {profiles.length < 4 && (
                  <button
                    onClick={() => setShowProfileModal(true)}
                    className="self-start sm:self-auto flex items-center gap-2 min-h-10 px-4 py-2 cs-border-thin bg-cs-paper hover:bg-cs-panel font-mono text-xs font-bold uppercase tracking-[0.08em] transition-colors"
                  >
                    <span className="w-6 h-6 rounded-full cs-border-thin text-cs-rust flex items-center justify-center">+</span>
                    Add profile
                  </button>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {profiles.map((p) => (
                  <div
                    key={p.id}
                    className="cs-border-thin p-4 bg-cs-paper space-y-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 md:w-14 md:h-14 rounded-full overflow-hidden cs-border-thin">
                        {p.avatarUrl ? (
                          <img src={p.avatarUrl} alt={p.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-brand/20 flex items-center justify-center text-cs-ink text-xl font-semibold">
                            {p.name.slice(0, 1).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="text-lg font-semibold text-cs-ink">{p.name}</div>
                        {p.kidMode ? (
                          <div className="text-xs text-emerald-600 mt-1 font-mono uppercase tracking-wide">Kids</div>
                        ) : (
                          <div className="text-xs text-cs-muted mt-1 font-mono uppercase tracking-wide">Standard</div>
                        )}
                      </div>
                      <button
                        className="text-sm text-cs-rust hover:text-cs-ink font-mono uppercase tracking-wide"
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

              {/* Profile preferences */}
              <section className="cs-border cs-shadow bg-cs-panel p-5 md:p-6 space-y-4">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div>
                    <h2 className="font-heading text-xl sm:text-2xl tracking-wide uppercase text-cs-ink">Profile preferences</h2>
                    <p className="text-cs-muted text-sm">
                      Playback, data and notifications for your selected profile.
                    </p>
                  </div>
                  {profiles.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {profiles.map((p) => {
                        const isActive = p.id === activeProfileId;
                        return (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => setActiveProfileFromProfile(p)}
                            className={`px-3 py-1.5 font-mono text-xs font-bold uppercase tracking-[0.06em] border-2 transition-colors ${
                              isActive
                                ? "bg-cs-ink border-cs-ink text-cs-paper"
                                : "bg-cs-paper border-cs-ink/30 text-cs-ink hover:border-cs-ink"
                            }`}
                          >
                            {p.name}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="block font-mono text-[11px] font-bold uppercase tracking-[0.08em] text-cs-ink">Language</label>
                    <select
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      className="w-full bg-cs-paper cs-border-thin px-3 py-2.5 text-sm text-cs-ink focus:outline-none focus:border-cs-rust focus:ring-1 focus:ring-cs-rust transition-colors"
                    >
                      <option value="en">English</option>
                      <option value="fr">French</option>
                      <option value="es">Spanish</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <div className="space-y-1">
                      <p className="text-sm text-cs-ink font-semibold">Autoplay next episode</p>
                      <p className="text-xs text-cs-muted">
                        Continue watching automatically when an episode ends.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAutoplay((v) => !v)}
                      className={`w-12 h-7 rounded-full border-2 transition-colors flex items-center px-1 ${
                        autoplay
                          ? "bg-brand border-cs-ink justify-end"
                          : "bg-cs-panel border-cs-ink/40 justify-start"
                      }`}
                    >
                      <span className="w-4 h-4 rounded-full bg-cs-ink" />
                    </button>
                  </div>
                </div>

                {/* Playback & data */}
                <div className="grid gap-4 md:grid-cols-2 pt-2 border-t border-cs-line mt-2">
                  <div className="space-y-2">
                    <label className="block font-mono text-[11px] font-bold uppercase tracking-[0.08em] text-cs-ink">Default quality</label>
                    <select
                      value={defaultQuality}
                      onChange={(e) => setDefaultQuality(e.target.value as any)}
                      className="w-full bg-cs-paper cs-border-thin px-3 py-2.5 text-sm text-cs-ink focus:outline-none focus:border-cs-rust focus:ring-1 focus:ring-cs-rust transition-colors"
                    >
                      <option value="auto">Auto</option>
                      <option value="hd">HD</option>
                      <option value="sd">Data saver</option>
                    </select>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <div className="space-y-1">
                      <p className="text-sm text-cs-ink font-semibold">Data saver on mobile</p>
                      <p className="text-xs text-cs-muted">
                        Prefer lower resolutions when streaming on mobile data.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setDataSaver((v) => !v)}
                      className={`w-12 h-7 rounded-full border-2 transition-colors flex items-center px-1 ${
                        dataSaver
                          ? "bg-brand border-cs-ink justify-end"
                          : "bg-cs-panel border-cs-ink/40 justify-start"
                      }`}
                    >
                      <span className="w-4 h-4 rounded-full bg-cs-ink" />
                    </button>
                  </div>
                </div>

                {/* Notifications */}
                <div className="grid gap-4 md:grid-cols-2 pt-2 border-t border-cs-line mt-2">
                  <div className="flex items-center justify-between gap-3">
                    <div className="space-y-1">
                      <p className="text-sm text-cs-ink font-semibold">Email updates</p>
                      <p className="text-xs text-cs-muted">
                        Receive recommendations and account updates.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setEmailUpdates((v) => !v)}
                      className={`w-12 h-7 rounded-full border-2 transition-colors flex items-center px-1 ${
                        emailUpdates
                          ? "bg-brand border-cs-ink justify-end"
                          : "bg-cs-panel border-cs-ink/40 justify-start"
                      }`}
                    >
                      <span className="w-4 h-4 rounded-full bg-cs-ink" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <div className="space-y-1">
                      <p className="text-sm text-cs-ink font-semibold">Product news</p>
                      <p className="text-xs text-cs-muted">
                        Hear about new features and releases.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setProductNews((v) => !v)}
                      className={`w-12 h-7 rounded-full border-2 transition-colors flex items-center px-1 ${
                        productNews
                          ? "bg-brand border-cs-ink justify-end"
                          : "bg-cs-panel border-cs-ink/40 justify-start"
                      }`}
                    >
                      <span className="w-4 h-4 rounded-full bg-cs-ink" />
                    </button>
                  </div>
                </div>

                <div className="flex justify-end pt-3">
                  <button
                    type="button"
                    onClick={savePreferences}
                    className="min-h-10 px-5 py-2.5 bg-cs-rust text-cs-paper font-mono text-sm font-bold uppercase tracking-[0.07em] cs-shadow-sm transition-transform hover:-translate-y-0.5"
                  >
                    Save changes
                  </button>
                </div>
              </section>

              {/* Danger zone */}
              <section
                className="bg-cs-panel p-5 sm:p-6 space-y-4"
                style={{ border: "2.5px solid var(--color-cs-rust)", boxShadow: "4px 4px 0 var(--color-cs-rust)" }}
              >
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-cs-rust shrink-0" />
                  <h2 className="font-heading text-xl sm:text-2xl tracking-wide uppercase text-cs-rust">Danger zone</h2>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 border-t border-cs-line">
                  <div className="space-y-1 max-w-md">
                    <p className="text-sm text-cs-ink font-semibold">Delete account</p>
                    <p className="text-xs text-cs-muted">
                      Permanently deletes your account, every profile, your entire watch history, and your purchase
                      records. This cannot be undone and there is no recovery period.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setDeleteConfirmText("");
                      setDeleteError(null);
                      setShowDeleteModal(true);
                    }}
                    className="min-h-10 px-5 py-2.5 bg-cs-rust text-cs-paper font-mono text-sm font-bold uppercase tracking-[0.07em] cs-shadow-sm transition-transform hover:-translate-y-0.5 shrink-0 self-start sm:self-auto"
                  >
                    Delete account
                  </button>
                </div>
              </section>

          </div>
        )}
      </div>
      {showProfileModal && (
        <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-md flex items-center justify-center px-4">
          <div className="w-full max-w-lg md:max-w-2xl bg-cs-panel cs-border cs-shadow-lg p-5 sm:p-6 text-cs-ink max-h-[85vh] overflow-auto">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="font-heading text-2xl sm:text-3xl tracking-wide uppercase text-cs-ink">Create profile</h3>
                <p className="text-cs-muted text-sm">Pick an avatar and name.</p>
              </div>
              <button
                onClick={() => setShowProfileModal(false)}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full cs-border-thin bg-cs-paper hover:bg-cs-panel transition-colors"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mb-5 justify-items-center">
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

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="block font-mono text-[11px] font-bold uppercase tracking-[0.08em] text-cs-ink">Profile name</label>
                <input
                  className="w-full bg-cs-paper cs-border-thin px-3 py-3 text-cs-ink text-sm focus:outline-none focus:border-cs-rust focus:ring-1 focus:ring-cs-rust transition-colors"
                  placeholder="e.g. Peter"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                />
              </div>

              <label className="flex items-center gap-2 text-sm text-cs-muted">
                <input
                  type="checkbox"
                  checked={kidMode}
                  onChange={(e) => setKidMode(e.target.checked)}
                  className="rounded accent-brand"
                />
                Kids profile
              </label>

              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={() => setShowProfileModal(false)}
                  className="min-h-10 px-4 py-2.5 cs-border-thin text-cs-muted hover:text-cs-ink hover:bg-cs-paper font-mono text-xs font-bold uppercase tracking-[0.08em] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={createProfile}
                  disabled={profiles.length >= 4}
                  className="min-h-10 px-5 py-2.5 bg-cs-rust text-cs-paper font-mono text-xs font-bold uppercase tracking-[0.08em] cs-shadow-sm disabled:opacity-60 transition-transform hover:-translate-y-0.5"
                >
                  {profiles.length >= 4 ? "Profile limit reached" : "Add profile"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {showDeleteModal && (
        <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-md flex items-center justify-center px-4">
          <div
            className="w-full max-w-md bg-cs-panel p-5 sm:p-6 text-cs-ink"
            style={{ border: "2.5px solid var(--color-cs-rust)", boxShadow: "6px 6px 0 var(--color-cs-rust)" }}
          >
            <div className="flex items-start gap-3 mb-4">
              <AlertTriangle className="w-6 h-6 text-cs-rust shrink-0 mt-1" />
              <div>
                <h3 className="font-heading text-2xl sm:text-3xl tracking-wide uppercase text-cs-rust">Delete account</h3>
                <p className="text-cs-muted text-sm mt-1">
                  This permanently deletes your Wanzami account. It removes all of your profiles, your entire watch
                  history, your saved list, and your purchase records. This action cannot be undone, there is no
                  grace period and no way to recover the data afterward.
                </p>
              </div>
            </div>

            <div className="space-y-2 mb-4">
              <label className="block font-mono text-[11px] font-bold uppercase tracking-[0.08em] text-cs-ink">
                Type DELETE to confirm
              </label>
              <input
                autoFocus
                className="w-full bg-cs-paper cs-border-thin px-3 py-2.5 text-sm text-cs-ink focus:outline-none focus:border-cs-rust focus:ring-1 focus:ring-cs-rust transition-colors"
                placeholder="DELETE"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                disabled={deleting}
              />
            </div>

            {deleteError && (
              <p className="text-cs-rust text-sm font-mono mb-4">{deleteError}</p>
            )}

            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
                className="min-h-10 px-4 py-2.5 cs-border-thin text-cs-muted hover:text-cs-ink hover:bg-cs-paper font-mono text-xs font-bold uppercase tracking-[0.08em] transition-colors disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                onClick={deleteAccount}
                disabled={deleteConfirmText !== "DELETE" || deleting}
                className="min-h-10 px-5 py-2.5 bg-cs-rust text-cs-paper font-mono text-xs font-bold uppercase tracking-[0.08em] cs-shadow-sm disabled:opacity-60 transition-transform hover:-translate-y-0.5 flex items-center gap-2"
              >
                {deleting ? (
                  <>
                    <Loader size={14} color="#f7f1e3" />
                    Deleting…
                  </>
                ) : (
                  "Permanently delete"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
