'use client';

import { useEffect, useMemo, useState } from "react";
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

type Device = {
  id: string;
  deviceId: string;
  label?: string | null;
  createdAt?: string;
  lastSeen?: string;
  profile?: {
    id: string;
    name: string;
    avatarUrl?: string | null;
    kidMode?: boolean;
  } | null;
};

type Billing = {
  id: string;
  provider: "PAYSTACK" | "FLUTTERWAVE";
  providerCustomerId?: string | null;
  planCode?: string | null;
  status?: string | null;
  billingEmail?: string | null;
  paymentMethodBrand?: string | null;
  paymentMethodLast4?: string | null;
  country?: string | null;
  postalCode?: string | null;
  nextPaymentAt?: string | null;
} | null;

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
  const [loading, setLoading] = useState(true);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [billing, setBilling] = useState<Billing>(null);
  const [profileName, setProfileName] = useState("");
  const [kidMode, setKidMode] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState("/avatars/avatar1.svg");
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [billingForm, setBillingForm] = useState({
    provider: "PAYSTACK",
    providerCustomerId: "",
    planCode: "",
    status: "active",
    billingEmail: "",
    paymentMethodBrand: "",
    paymentMethodLast4: "",
    country: "",
    postalCode: "",
    nextPaymentAt: "",
  });

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
      const [p, d, b] = await Promise.all([
        fetcher("/api/user/profiles"),
        fetcher("/api/user/devices"),
        fetcher("/api/user/billing"),
      ]);
      setProfiles(p.profiles ?? []);
      setDevices(d.devices ?? []);
      setBilling(b.billing ?? null);
      if (b.billing) {
        setBillingForm((prev) => ({
          ...prev,
          provider: b.billing.provider ?? prev.provider,
          providerCustomerId: b.billing.providerCustomerId ?? "",
          planCode: b.billing.planCode ?? "",
          status: b.billing.status ?? "active",
          billingEmail: b.billing.billingEmail ?? "",
          paymentMethodBrand: b.billing.paymentMethodBrand ?? "",
          paymentMethodLast4: b.billing.paymentMethodLast4 ?? "",
          country: b.billing.country ?? "",
          postalCode: b.billing.postalCode ?? "",
          nextPaymentAt: b.billing.nextPaymentAt ?? "",
        }));
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

  const assignProfileToDevice = async (deviceId: string, profileId: string) => {
    try {
      const data = await fetcher(`/api/user/devices/${deviceId}/profile`, {
        method: "POST",
        body: JSON.stringify({ profileId }),
      });
      setDevices((prev) =>
        prev.map((d) =>
          d.deviceId === deviceId ? { ...d, profile: data.device.profile } : d
        )
      );
      toast.success("Device profile updated");
    } catch (err: any) {
      toast.error(err.message ?? "Unable to update device");
    }
  };

  const saveBilling = async () => {
    try {
      const payload = {
        ...billingForm,
        nextPaymentAt: billingForm.nextPaymentAt || undefined,
      };
      const data = await fetcher("/api/user/billing", {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      setBilling(data.billing ?? null);
      toast.success("Billing saved");
    } catch (err: any) {
      toast.error(err.message ?? "Unable to save billing");
    }
  };

  if (!hasAuth) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#0b0b0c] text-white px-6">
        <div className="text-center space-y-3 max-w-xl">
          <h1 className="text-3xl font-semibold">Sign in to manage your account</h1>
          <p className="text-gray-400">
            Profiles, devices, and billing are available after you log in.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0b0b0c] text-white px-6 py-10">
      <div className="max-w-6xl mx-auto space-y-10">
        <div className="flex flex-col gap-2">
          <h1 className="text-4xl font-semibold">Account Settings</h1>
          <p className="text-gray-400">
            Manage profiles, devices, and billing (Paystack / Flutterwave).
          </p>
        </div>

        {loading ? (
          <div className="flex items-center gap-3 text-gray-300">
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

            {/* Devices */}
            <section className="bg-[#141414] border border-gray-800 rounded-xl p-6 space-y-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-semibold">Devices</h2>
                  <p className="text-gray-400 text-sm">
                    See connected devices and pick which profile each uses.
                  </p>
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                {devices.length === 0 && (
                  <div className="text-gray-400 text-sm">No devices yet.</div>
                )}
                {devices.map((d) => (
                  <div
                    key={d.id}
                    className="border border-gray-800 rounded-lg p-4 bg-[#0f0f10] space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-lg font-semibold">
                          {d.label || "Unnamed device"}
                        </div>
                        <div className="text-xs text-gray-500 break-all">
                          {d.deviceId}
                        </div>
                      </div>
                      <span className="text-xs text-gray-400">
                        {d.lastSeen ? new Date(d.lastSeen).toLocaleString() : ""}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm text-gray-300">Profile:</span>
                      {profiles.map((p) => (
                        <button
                          key={p.id}
                          onClick={() => assignProfileToDevice(d.deviceId, p.id)}
                          className={`px-3 py-1 rounded-full text-sm border ${
                            d.profile?.id === p.id
                              ? "border-[#fd7e14] text-[#fd7e14] bg-[#fd7e14]/10"
                              : "border-gray-700 text-gray-300 hover:border-[#fd7e14]"
                          }`}
                        >
                          {p.name}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Billing */}
            <section className="bg-[#141414] border border-gray-800 rounded-xl p-6 space-y-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-semibold">Billing</h2>
                  <p className="text-gray-400 text-sm">
                    Store Paystack / Flutterwave customer details and plan code. No cards are kept here.
                  </p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm text-gray-300">Provider</label>
                  <select
                    className="w-full mt-1 rounded-lg bg-[#0f0f10] border border-gray-700 px-3 py-2"
                    value={billingForm.provider}
                    onChange={(e) =>
                      setBillingForm((prev) => ({ ...prev, provider: e.target.value }))
                    }
                  >
                    <option value="PAYSTACK">Paystack</option>
                    <option value="FLUTTERWAVE">Flutterwave</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm text-gray-300">Customer ID</label>
                  <input
                    className="w-full mt-1 rounded-lg bg-[#0f0f10] border border-gray-700 px-3 py-2"
                    value={billingForm.providerCustomerId}
                    onChange={(e) =>
                      setBillingForm((prev) => ({ ...prev, providerCustomerId: e.target.value }))
                    }
                    placeholder="From Paystack/Flutterwave"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-300">Plan code</label>
                  <input
                    className="w-full mt-1 rounded-lg bg-[#0f0f10] border border-gray-700 px-3 py-2"
                    value={billingForm.planCode}
                    onChange={(e) =>
                      setBillingForm((prev) => ({ ...prev, planCode: e.target.value }))
                    }
                    placeholder="Subscription plan code"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-300">Status</label>
                  <input
                    className="w-full mt-1 rounded-lg bg-[#0f0f10] border border-gray-700 px-3 py-2"
                    value={billingForm.status}
                    onChange={(e) =>
                      setBillingForm((prev) => ({ ...prev, status: e.target.value }))
                    }
                    placeholder="active | past_due | canceled"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-300">Billing email</label>
                  <input
                    className="w-full mt-1 rounded-lg bg-[#0f0f10] border border-gray-700 px-3 py-2"
                    value={billingForm.billingEmail}
                    onChange={(e) =>
                      setBillingForm((prev) => ({ ...prev, billingEmail: e.target.value }))
                    }
                    placeholder="billing email"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm text-gray-300">Brand</label>
                    <input
                      className="w-full mt-1 rounded-lg bg-[#0f0f10] border border-gray-700 px-3 py-2"
                      value={billingForm.paymentMethodBrand}
                      onChange={(e) =>
                        setBillingForm((prev) => ({ ...prev, paymentMethodBrand: e.target.value }))
                      }
                      placeholder="Visa"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-300">Last4</label>
                    <input
                      className="w-full mt-1 rounded-lg bg-[#0f0f10] border border-gray-700 px-3 py-2"
                      value={billingForm.paymentMethodLast4}
                      onChange={(e) =>
                        setBillingForm((prev) => ({ ...prev, paymentMethodLast4: e.target.value }))
                      }
                      maxLength={4}
                      placeholder="1234"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm text-gray-300">Country</label>
                    <input
                      className="w-full mt-1 rounded-lg bg-[#0f0f10] border border-gray-700 px-3 py-2"
                      value={billingForm.country}
                      onChange={(e) =>
                        setBillingForm((prev) => ({ ...prev, country: e.target.value }))
                      }
                      placeholder="NG"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-300">Postal code</label>
                    <input
                      className="w-full mt-1 rounded-lg bg-[#0f0f10] border border-gray-700 px-3 py-2"
                      value={billingForm.postalCode}
                      onChange={(e) =>
                        setBillingForm((prev) => ({ ...prev, postalCode: e.target.value }))
                      }
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm text-gray-300">Next payment at (ISO date)</label>
                  <input
                    className="w-full mt-1 rounded-lg bg-[#0f0f10] border border-gray-700 px-3 py-2"
                    value={billingForm.nextPaymentAt}
                    onChange={(e) =>
                      setBillingForm((prev) => ({ ...prev, nextPaymentAt: e.target.value }))
                    }
                    placeholder="2025-12-01T00:00:00Z"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="text-xs text-gray-400">
                  Portal links should come from your Paystack/Flutterwave checkout session.
                </div>
                <button
                  onClick={saveBilling}
                  className="bg-[#fd7e14] hover:bg-[#ff9f4d] text-black font-semibold px-4 py-2 rounded-lg"
                >
                  Save billing
                </button>
              </div>
            </section>
          </div>
        )}
      </div>
      {showProfileModal && (
        <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-md flex items-center justify-center px-4">
          <div className="w-full max-w-lg bg-[#111]/95 border border-white/10 rounded-2xl p-6 text-white shadow-2xl">
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

            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mb-4 justify-items-center">
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
