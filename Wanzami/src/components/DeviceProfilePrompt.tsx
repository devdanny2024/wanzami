'use client';

import { useState } from "react";
import { toast } from "sonner";
import { Loader } from "./ui/loader";

interface DeviceProfilePromptProps {
  onClose: () => void;
  onSaved: (label: string) => void;
}

export function DeviceProfilePrompt({ onClose, onSaved }: DeviceProfilePromptProps) {
  const [label, setLabel] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async () => {
    setError("");
    if (!label.trim()) {
      setError("Please enter a name for this device.");
      return;
    }
    const accessToken = localStorage.getItem("accessToken");
    const deviceId = localStorage.getItem("deviceId");
    if (!accessToken || !deviceId) {
      setError("Missing session. Please log in again.");
      return;
    }
    setLoading(true);
    const res = await fetch("/api/auth/device-label", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ deviceId, label }),
    });
    const data = await res.json();
    if (!res.ok) {
      const msg = data.message ?? "Unable to save device.";
      setError(msg);
      toast.error(msg);
      setLoading(false);
      return;
    }
    localStorage.setItem("deviceLabel", label);
    toast.success("Device saved");
    setLoading(false);
    onSaved(label);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
      <div className="w-full max-w-md bg-graphite border border-white/10 rounded-2xl p-5 sm:p-6 text-foreground shadow-2xl">
        <h2 className="font-heading text-2xl sm:text-3xl tracking-wide mb-2">Save this device</h2>
        <p className="text-ash mb-5 text-sm leading-6">
          Name this device to keep it in your allowed device list (max 4). This helps you manage Wanzami Profiles.
        </p>
        <div className="space-y-2 mb-5">
          <label className="block text-xs text-gray-400 uppercase tracking-wide">
            Device name
          </label>
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="w-full bg-ink-2 border border-white/10 rounded-lg px-3 py-3 text-foreground focus:border-brand focus:ring-1 focus:ring-brand focus:outline-none text-sm transition-colors"
            placeholder="e.g. Living Room TV, Soliu's Laptop"
          />
          {error && <p className="text-sm text-red-400">{error}</p>}
        </div>
        <div className="flex gap-2 justify-end">
          <button
            onClick={onClose}
            className="min-h-10 px-4 py-2.5 rounded-lg border border-white/10 text-ash hover:text-foreground hover:bg-white/5 transition-colors text-sm"
          >
            Skip for now
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="min-h-10 px-4 py-2.5 rounded-lg bg-brand text-black font-semibold hover:bg-brand-light transition-colors disabled:opacity-60 text-sm"
          >
            <span className="flex items-center gap-2 justify-center">
              {loading && <Loader size={14} />}
              {loading ? "Saving..." : "Save device"}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
