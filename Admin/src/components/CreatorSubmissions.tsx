import { useCallback, useEffect, useState } from "react";
import { Check, ExternalLink, Mail, X } from "lucide-react";
import { toast } from "sonner";
import { CsBox, CsButton, CsPageHeader, CsSlug, CsStat, CsTag } from "./cs/kit";

type Submission = {
  id: string;
  title: string;
  synopsis: string | null;
  status: "UPLOADING" | "SUBMITTED" | "IN_REVIEW" | "APPROVED" | "REJECTED";
  reviewNote: string | null;
  fileKey: string | null;
  linkedTitleId: string | null;
  createdAt: string;
  creator: { id: string; name: string; email: string; bio: string | null; reelUrl: string | null };
};

const authHeaders = () => {
  const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const statusTone = (status: Submission["status"]): "good" | "bad" | "pending" => {
  if (status === "APPROVED") return "good";
  if (status === "REJECTED") return "bad";
  return "pending";
};

export function CreatorSubmissions() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"ALL" | Submission["status"]>("SUBMITTED");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [titleIdDraft, setTitleIdDraft] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const qs = filter === "ALL" ? "" : `?status=${filter}`;
      const res = await fetch(`/api/admin/creators/submissions${qs}`, { headers: authHeaders() });
      if (!res.ok) throw new Error(`Status ${res.status}`);
      const data = await res.json();
      setSubmissions(data.submissions ?? []);
    } catch {
      toast.error("Could not load creator submissions");
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
      const linkedTitleId = titleIdDraft[id]?.trim();
      const res = await fetch(`/api/admin/creators/submissions/${id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify(linkedTitleId ? { linkedTitleId } : {}),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || `Status ${res.status}`);
      toast.success("Submission approved");
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
      const res = await fetch(`/api/admin/creators/submissions/${id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({}),
      });
      if (!res.ok) throw new Error(`Status ${res.status}`);
      toast.success("Submission rejected");
      void load();
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to reject");
    } finally {
      setBusyId(null);
    }
  };

  const pendingCount = submissions.filter((s) => s.status === "SUBMITTED" || s.status === "IN_REVIEW").length;

  return (
    <div className="space-y-6">
      <CsPageHeader title="Creator Submissions" slug="Content / Creators" chip="Review queue" />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <CsStat label="Awaiting review" value={String(pendingCount)} />
        <CsStat label="Showing" value={String(submissions.length)} hint={filter === "ALL" ? "All statuses" : filter} />
        <CsStat label="Signups from" value="creator.wanzami.tv" />
      </div>

      <div className="flex gap-2 flex-wrap">
        {(["SUBMITTED", "IN_REVIEW", "APPROVED", "REJECTED", "ALL"] as const).map((f) => (
          <CsButton key={f} variant={filter === f ? "rust" : "outline"} onClick={() => setFilter(f)}>
            {f}
          </CsButton>
        ))}
      </div>

      <div className="space-y-4">
        {loading ? (
          <p className="text-sm" style={{ color: "var(--cs-muted)" }}>Loading…</p>
        ) : submissions.length === 0 ? (
          <CsBox className="p-6">
            <p className="text-sm" style={{ color: "var(--cs-muted)" }}>No submissions in this view.</p>
          </CsBox>
        ) : (
          submissions.map((s) => (
            <CsBox key={s.id} className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3">
                    <p className="cs-mono font-bold" style={{ fontSize: 18 }}>{s.title}</p>
                    <CsTag label={s.status} tone={statusTone(s.status)} />
                    {s.linkedTitleId && <CsTag label={`title #${s.linkedTitleId}`} tone="neutral" />}
                  </div>
                  <div className="flex flex-wrap items-center gap-4 mt-2 text-sm" style={{ color: "var(--cs-muted)" }}>
                    <span className="inline-flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" />{s.creator.name} &middot; {s.creator.email}</span>
                    {s.creator.reelUrl && (
                      <a href={s.creator.reelUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5" style={{ color: "var(--cs-brand)" }}>
                        Reel <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                  {s.synopsis && <p className="text-sm mt-3" style={{ color: "var(--cs-ink)", maxWidth: 700 }}>{s.synopsis}</p>}
                  {s.creator.bio && (
                    <p className="text-sm mt-2" style={{ color: "var(--cs-muted)", maxWidth: 700 }}>{s.creator.bio}</p>
                  )}
                  {s.reviewNote && (
                    <p className="text-sm mt-2" style={{ color: "var(--cs-rust)" }}>{s.reviewNote}</p>
                  )}
                  <p className="cs-mono mt-3" style={{ fontSize: 10, color: "var(--cs-muted)" }}>
                    Submitted {new Date(s.createdAt).toLocaleString()}
                  </p>
                </div>
                {(s.status === "SUBMITTED" || s.status === "IN_REVIEW") && (
                  <div className="flex flex-col gap-2 shrink-0 items-end">
                    <input
                      value={titleIdDraft[s.id] ?? ""}
                      onChange={(e) => setTitleIdDraft((prev) => ({ ...prev, [s.id]: e.target.value }))}
                      placeholder="Catalogue title ID (optional)"
                      style={{
                        border: "2px solid var(--cs-ink)",
                        background: "var(--cs-paper)",
                        color: "var(--cs-ink)",
                        fontFamily: "var(--font-smono), monospace",
                        fontSize: 11,
                        padding: "6px 10px",
                        width: 200,
                      }}
                    />
                    <div className="flex gap-2">
                      <CsButton variant="outline" onClick={() => reject(s.id)} disabled={busyId === s.id}>
                        <span className="inline-flex items-center gap-2"><X className="w-3.5 h-3.5" />Reject</span>
                      </CsButton>
                      <CsButton variant="rust" onClick={() => approve(s.id)} disabled={busyId === s.id}>
                        <span className="inline-flex items-center gap-2"><Check className="w-3.5 h-3.5" />Approve</span>
                      </CsButton>
                    </div>
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
