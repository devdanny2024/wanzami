import { useCallback, useEffect, useState } from "react";
import { Check, ExternalLink, Instagram, Mail, Phone, X, Youtube } from "lucide-react";
import { toast } from "sonner";
import { CsBox, CsButton, CsPageHeader, CsSlug, CsStat, CsTag } from "./cs/kit";

type Application = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  bio: string;
  reelUrl: string | null;
  instagram: string | null;
  youtube: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED";
  reviewNote: string | null;
  reviewedAt: string | null;
  createdAt: string;
  accountStatus: "PENDING_SETUP" | "ACTIVE" | "SUSPENDED" | null;
};

const authHeaders = () => {
  const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const statusTone = (status: Application["status"]): "good" | "bad" | "pending" => {
  if (status === "APPROVED") return "good";
  if (status === "REJECTED") return "bad";
  return "pending";
};

export function CreatorApplications() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"ALL" | Application["status"]>("PENDING");
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const qs = filter === "ALL" ? "" : `?status=${filter}`;
      const res = await fetch(`/api/admin/creators/applications${qs}`, { headers: authHeaders() });
      if (!res.ok) throw new Error(`Status ${res.status}`);
      const data = await res.json();
      setApplications(data.applications ?? []);
    } catch {
      toast.error("Could not load creator applications");
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    void load();
  }, [load]);

  const approve = async (id: string) => {
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/creators/applications/${id}/approve`, {
        method: "POST",
        headers: authHeaders(),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || `Status ${res.status}`);
      toast.success(data.emailSent ? "Approved, invite email sent" : "Approved, but the invite email failed to send");
      void load();
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to approve");
    } finally {
      setBusyId(null);
    }
  };

  const reject = async (id: string) => {
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/creators/applications/${id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({}),
      });
      if (!res.ok) throw new Error(`Status ${res.status}`);
      toast.success("Application rejected");
      void load();
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to reject");
    } finally {
      setBusyId(null);
    }
  };

  const pendingCount = applications.filter((a) => a.status === "PENDING").length;

  return (
    <div className="space-y-6">
      <CsPageHeader title="Creator Applications" slug="Content / Creators" chip="Review queue" />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <CsStat label="Pending review" value={String(pendingCount)} />
        <CsStat label="Showing" value={String(applications.length)} hint={filter === "ALL" ? "All statuses" : filter} />
        <CsStat label="Applies from" value="creator.wanzami.tv" />
      </div>

      <div className="flex gap-2">
        {(["PENDING", "APPROVED", "REJECTED", "ALL"] as const).map((f) => (
          <CsButton key={f} variant={filter === f ? "rust" : "outline"} onClick={() => setFilter(f)}>
            {f}
          </CsButton>
        ))}
      </div>

      <div className="space-y-4">
        {loading ? (
          <p className="text-sm" style={{ color: "var(--cs-muted)" }}>Loading…</p>
        ) : applications.length === 0 ? (
          <CsBox className="p-6">
            <p className="text-sm" style={{ color: "var(--cs-muted)" }}>No applications in this view.</p>
          </CsBox>
        ) : (
          applications.map((a) => (
            <CsBox key={a.id} className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3">
                    <p className="cs-mono font-bold" style={{ fontSize: 18 }}>{a.name}</p>
                    <CsTag label={a.status} tone={statusTone(a.status)} />
                    {a.accountStatus && <CsTag label={`account: ${a.accountStatus}`} tone="neutral" />}
                  </div>
                  <div className="flex flex-wrap items-center gap-4 mt-2 text-sm" style={{ color: "var(--cs-muted)" }}>
                    <span className="inline-flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" />{a.email}</span>
                    {a.phone && <span className="inline-flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" />{a.phone}</span>}
                    {a.instagram && <span className="inline-flex items-center gap-1.5"><Instagram className="w-3.5 h-3.5" />{a.instagram}</span>}
                    {a.youtube && <span className="inline-flex items-center gap-1.5"><Youtube className="w-3.5 h-3.5" />{a.youtube}</span>}
                  </div>
                  <p className="text-sm mt-3" style={{ color: "var(--cs-ink)", maxWidth: 700 }}>{a.bio}</p>
                  {a.reelUrl && (
                    <a
                      href={a.reelUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 mt-2 text-sm"
                      style={{ color: "var(--cs-brand)" }}
                    >
                      Watch reel <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                  <p className="cs-mono mt-3" style={{ fontSize: 10, color: "var(--cs-muted)" }}>
                    Applied {new Date(a.createdAt).toLocaleString()}
                  </p>
                </div>
                {a.status === "PENDING" && (
                  <div className="flex gap-2 shrink-0">
                    <CsButton variant="outline" onClick={() => reject(a.id)} disabled={busyId === a.id}>
                      <span className="inline-flex items-center gap-2"><X className="w-3.5 h-3.5" />Reject</span>
                    </CsButton>
                    <CsButton variant="rust" onClick={() => approve(a.id)} disabled={busyId === a.id}>
                      <span className="inline-flex items-center gap-2"><Check className="w-3.5 h-3.5" />Approve</span>
                    </CsButton>
                  </div>
                )}
              </div>
            </CsBox>
          ))
        )}
      </div>
    </div>
  );
}
