'use client';

import { useEffect, useState } from "react";
import { Loader } from "./ui/loader";
import { toast } from "sonner";

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

export function ProfileChooser({ onSelected, onLogout }: ProfileChooserProps) {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [kidMode, setKidMode] = useState(false);

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
    try {
      const data = await fetcher("/api/user/profiles");
      setProfiles(data.profiles ?? []);
    } catch (err: any) {
      toast.error(err.message ?? "Unable to load profiles");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfiles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSelect = async (profile: Profile) => {
    const deviceId = localStorage.getItem("deviceId");
    if (!deviceId) {
      toast.error("Missing device. Please log in again.");
      return;
    }
    try {
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
    }
  };

  const handleCreate = async () => {
    if (!name.trim()) {
      toast.error("Name is required");
      return;
    }
    setCreating(true);
    try {
      const data = await fetcher("/api/user/profiles", {
        method: "POST",
        body: JSON.stringify({
          name,
          kidMode,
          avatarUrl: avatarUrl || undefined,
        }),
      });
      setProfiles((prev) => [...prev, data.profile]);
      setName("");
      setAvatarUrl("");
      setKidMode(false);
      toast.success("Profile created");
    } catch (err: any) {
      toast.error(err.message ?? "Unable to create profile");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black">
      <div className="max-w-4xl w-full px-6">
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
                className="group relative border border-white/10 rounded-xl bg-white/5 hover:bg-white/10 transition overflow-hidden"
              >
                <div className="aspect-square bg-gradient-to-br from-[#fd7e14]/20 to-[#fd7e14]/5 flex items-center justify-center">
                  {p.avatarUrl ? (
                    <img
                      src={p.avatarUrl}
                      alt={p.name}
                      className="object-cover w-full h-full"
                    />
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
              <div className="border border-dashed border-white/20 rounded-xl p-4 bg-white/5">
                <div className="space-y-3">
                  <div className="text-white font-semibold">Create profile</div>
                  <input
                    className="w-full rounded-lg bg-black/40 border border-white/10 px-3 py-2 text-white text-sm"
                    placeholder="Profile name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                  <input
                    className="w-full rounded-lg bg-black/40 border border-white/10 px-3 py-2 text-white text-sm"
                    placeholder="Avatar image URL (optional)"
                    value={avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                  />
                  <label className="flex items-center gap-2 text-sm text-gray-300">
                    <input
                      type="checkbox"
                      checked={kidMode}
                      onChange={(e) => setKidMode(e.target.checked)}
                      className="rounded"
                    />
                    Kids profile
                  </label>
                  <button
                    onClick={handleCreate}
                    disabled={creating}
                    className="w-full rounded-lg bg-[#fd7e14] hover:bg-[#ff9f4d] text-black font-semibold px-4 py-2"
                  >
                    {creating ? "Creating..." : "Add profile"}
                  </button>
                </div>
              </div>
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
    </div>
  );
}
