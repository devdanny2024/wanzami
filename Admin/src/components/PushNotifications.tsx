import { useCallback, useEffect, useState } from "react";
import { Bell, Send } from "lucide-react";
import { toast } from "sonner";
import { CsBox, CsButton, CsPageHeader, CsSlug, CsStat, CsTag } from "./cs/kit";

type Broadcast = {
  id: string;
  title: string;
  body: string;
  imageUrl: string | null;
  recipientCount: number;
  createdAt: string;
};

const authHeaders = () => {
  const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const fieldStyle: React.CSSProperties = {
  border: "2px solid var(--cs-ink)",
  background: "var(--cs-paper)",
  color: "var(--cs-ink)",
  fontFamily: "var(--font-smono), monospace",
  fontSize: 12,
  padding: "9px 12px",
  width: "100%",
};

export function PushNotifications() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [sending, setSending] = useState(false);
  const [history, setHistory] = useState<Broadcast[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  const loadHistory = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/notifications/history", { headers: authHeaders() });
      if (!res.ok) throw new Error(`Status ${res.status}`);
      const data = await res.json();
      setHistory(data.broadcasts ?? []);
    } catch {
      toast.error("Could not load broadcast history");
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  useEffect(() => {
    void loadHistory();
  }, [loadHistory]);

  const send = async () => {
    if (!title.trim() || !body.trim()) {
      toast.error("Title and message are required");
      return;
    }
    setSending(true);
    try {
      const res = await fetch("/api/admin/notifications/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({
          title: title.trim(),
          body: body.trim(),
          imageUrl: imageUrl.trim() || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || `Status ${res.status}`);
      toast.success("Push notification sent");
      setTitle("");
      setBody("");
      setImageUrl("");
      void loadHistory();
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to send push notification");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <CsPageHeader title="Notifications" slug="Community / Push" chip="Broadcast" />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <CsStat label="Registered devices" value={String(history[0]?.recipientCount ?? "—")} hint="As of last send" />
        <CsStat label="Broadcasts sent" value={String(history.length)} hint="Most recent 30" />
        <CsStat label="Last sent" value={history[0] ? new Date(history[0].createdAt).toLocaleDateString() : "None yet"} />
      </div>

      <CsBox className="p-5">
        <div className="flex items-center justify-between">
          <CsSlug>Compose broadcast</CsSlug>
          <CsTag label="Sends to all users" tone="neutral" />
        </div>
        <p className="text-sm mt-2" style={{ color: "var(--cs-muted)" }}>
          Delivered as a real push notification to every device that has the app installed and notifications enabled.
        </p>

        <div className="mt-4 space-y-4">
          <div className="space-y-2">
            <CsSlug>Title</CsSlug>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={fieldStyle}
              placeholder="New movie just dropped"
              maxLength={80}
            />
          </div>
          <div className="space-y-2">
            <CsSlug>Message</CsSlug>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              style={{ ...fieldStyle, resize: "vertical" }}
              rows={4}
              placeholder="Tell users what's new"
              maxLength={200}
            />
          </div>
          <div className="space-y-2">
            <CsSlug>Image URL (optional)</CsSlug>
            <input
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              style={fieldStyle}
              placeholder="https://…"
            />
          </div>
          <div className="flex justify-end">
            <CsButton variant="rust" onClick={send} disabled={sending}>
              <span className="inline-flex items-center gap-2">
                <Send className="w-3.5 h-3.5" />
                {sending ? "Sending…" : "Send broadcast"}
              </span>
            </CsButton>
          </div>
        </div>
      </CsBox>

      <CsBox className="p-5">
        <CsSlug>Send history</CsSlug>
        <div className="mt-4 space-y-3">
          {loadingHistory ? (
            <p className="text-sm" style={{ color: "var(--cs-muted)" }}>Loading…</p>
          ) : history.length === 0 ? (
            <div className="flex items-center gap-2 text-sm" style={{ color: "var(--cs-muted)" }}>
              <Bell className="w-4 h-4" />
              No broadcasts sent yet
            </div>
          ) : (
            history.map((b) => (
              <div key={b.id} className="cs-border-thin p-3 flex items-start justify-between gap-4">
                <div>
                  <p className="cs-mono font-bold" style={{ fontSize: 13 }}>{b.title}</p>
                  <p className="text-sm mt-1" style={{ color: "var(--cs-muted)" }}>{b.body}</p>
                </div>
                <div className="text-right shrink-0">
                  <CsTag label={`${b.recipientCount} devices`} tone="neutral" />
                  <p className="cs-mono mt-1" style={{ fontSize: 10, color: "var(--cs-muted)" }}>
                    {new Date(b.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </CsBox>
    </div>
  );
}
