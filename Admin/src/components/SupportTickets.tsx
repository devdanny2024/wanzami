import { useCallback, useEffect, useState } from "react";
import { CsBox, CsButton, CsPageHeader, CsSlug, CsTag } from "./cs/kit";

type Ticket = {
  id: string;
  email: string;
  subject: string;
  message: string;
  status: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
  priority: string;
  createdAt: string;
};

type TicketsResponse = {
  tickets: Ticket[];
  counts?: Record<string, number>;
};

type TicketMessage = {
  id: string;
  ticketId: string;
  message: string;
  isAdmin: boolean;
  createdAt: string;
  userEmail?: string | null;
  userName?: string | null;
};

type MessagesResponse = {
  messages: TicketMessage[];
};

const authHeaders = () => {
  const token =
    typeof window !== "undefined"
      ? window.localStorage.getItem("accessToken")
      : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const fieldStyle: React.CSSProperties = {
  border: '2px solid var(--cs-ink)',
  background: 'var(--cs-paper)',
  color: 'var(--cs-ink)',
  fontFamily: 'var(--font-smono), monospace',
  fontSize: 12,
  padding: '9px 12px',
  width: '100%',
};

const ticketTone = (status: Ticket["status"]): "good" | "bad" | "pending" | "neutral" => {
  if (status === "OPEN") return "pending";
  if (status === "IN_PROGRESS") return "neutral";
  if (status === "RESOLVED") return "good";
  return "bad";
};

export function SupportTickets() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [reply, setReply] = useState("");
  const [replying, setReplying] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [query, setQuery] = useState<string>("");
  const [days, setDays] = useState<string>("7");
  const [counts, setCounts] = useState<Record<string, number>>({});

  const load = useCallback(async (opts?: { status?: string; q?: string; days?: string }) => {
    setLoading(true);
    setError(null);
    try {
      const url = new URL("/api/admin/support/tickets", window.location.origin);
      const statusParam = opts?.status ?? statusFilter;
      const qParam = opts?.q ?? query;
      const daysParam = opts?.days ?? days;

      if (statusParam && statusParam !== "all") {
        url.searchParams.set("status", statusParam);
      }
      if (qParam) {
        url.searchParams.set("q", qParam);
      }
      if (daysParam && daysParam !== "all") {
        url.searchParams.set("days", daysParam);
      }

      const res = await fetch(url.toString(), {
        headers: {
          ...authHeaders(),
        },
        cache: "no-store",
      });
      if (!res.ok) {
        throw new Error(`Failed to load tickets (${res.status})`);
      }
      const data = (await res.json()) as TicketsResponse;
      setTickets(data.tickets ?? []);
      if (data.counts) {
        setCounts(data.counts);
        try {
          window.localStorage.setItem(
            "wanzami-support-open-count",
            String(data.counts["OPEN"] ?? 0),
          );
        } catch {
          // ignore
        }
      }
    } catch (err: any) {
      setError(err?.message ?? "Failed to load tickets");
    } finally {
      setLoading(false);
    }
  }, [days, query, statusFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  const loadMessages = async (ticket: Ticket) => {
    try {
      const res = await fetch(`/api/admin/support/tickets/${ticket.id}/messages`, {
        headers: {
          ...authHeaders(),
        },
        cache: "no-store",
      });
      if (!res.ok) {
        throw new Error(`Failed to load messages (${res.status})`);
      }
      const data = (await res.json()) as MessagesResponse;
      setMessages(data.messages ?? []);
      setSelectedTicket(ticket);
    } catch (err: any) {
      setError(err?.message ?? "Failed to load messages");
    }
  };

  const updateStatus = async (id: string, status: Ticket["status"]) => {
    try {
      const res = await fetch(`/api/admin/support/tickets/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders(),
        },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        throw new Error(`Failed to update status (${res.status})`);
      }
      await load();
    } catch (err: any) {
      setError(err?.message ?? "Failed to update ticket");
    }
  };

  const sendReply = async () => {
    if (!selectedTicket || !reply.trim()) return;
    setReplying(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/support/tickets/${selectedTicket.id}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders(),
        },
        body: JSON.stringify({ message: reply }),
      });
      if (!res.ok) {
        throw new Error(`Failed to send reply (${res.status})`);
      }
      setReply("");
      await loadMessages(selectedTicket);
    } catch (err: any) {
      setError(err?.message ?? "Failed to send reply");
    } finally {
      setReplying(false);
    }
  };

  return (
    <div className="space-y-8">
      <CsPageHeader
        title="The help desk"
        chip={loading ? '···' : `${counts["OPEN"] ?? 0} open`}
        slug="Support tickets · contact page and in-app bubble"
        actions={
          <CsButton variant="outline" onClick={() => void load()}>
            Refresh
          </CsButton>
        }
      />

      <div className="flex flex-wrap gap-4 text-xs">
        <span className="cs-mono" style={{ color: 'var(--cs-muted)' }}>
          Open: <span className="font-bold" style={{ color: 'var(--cs-ink)' }}>{counts["OPEN"] ?? 0}</span>
        </span>
        <span className="cs-mono" style={{ color: 'var(--cs-muted)' }}>
          In progress: <span className="font-bold" style={{ color: 'var(--cs-ink)' }}>{counts["IN_PROGRESS"] ?? 0}</span>
        </span>
        <span className="cs-mono" style={{ color: 'var(--cs-muted)' }}>
          Resolved: <span className="font-bold" style={{ color: 'var(--cs-ink)' }}>{counts["RESOLVED"] ?? 0}</span>
        </span>
      </div>

      {/* Search + Filters */}
      <div className="grid gap-4 md:grid-cols-3">
        <input
          type="text"
          placeholder="SEARCH SUBJECT OR MESSAGE"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              void load({ q: e.currentTarget.value });
            }
          }}
          style={fieldStyle}
        />
        <select
          value={statusFilter}
          onChange={(e) => {
            const value = e.target.value;
            setStatusFilter(value);
            void load({ status: value });
          }}
          style={{ ...fieldStyle, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em' }}
        >
          <option value="all">All statuses</option>
          <option value="OPEN">Open</option>
          <option value="IN_PROGRESS">In progress</option>
          <option value="RESOLVED">Resolved</option>
          <option value="CLOSED">Closed</option>
        </select>
        <select
          value={days}
          onChange={(e) => {
            const value = e.target.value;
            setDays(value);
            void load({ days: value });
          }}
          style={{ ...fieldStyle, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em' }}
        >
          <option value="7">Last 7 days</option>
          <option value="30">Last 30 days</option>
          <option value="all">All time</option>
        </select>
      </div>

      {error && (
        <div className="cs-border p-4" style={{ borderColor: 'var(--cs-rust)' }}>
          <p className="cs-mono text-xs font-bold uppercase" style={{ color: 'var(--cs-rust)' }}>
            {error}
          </p>
        </div>
      )}

      {loading && tickets.length === 0 && (
        <CsSlug>Loading tickets…</CsSlug>
      )}

      {tickets.length === 0 && !loading && (
        <CsBox className="p-5">
          <CsSlug>Nothing filed here yet</CsSlug>
          <p className="mt-2 text-sm" style={{ color: 'var(--cs-ink)' }}>No tickets yet.</p>
        </CsBox>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {tickets.map((t) => (
          <CsBox key={t.id} className="p-4" shadow={false}>
            <div className="flex justify-between gap-2 mb-1">
              <span className="cs-mono text-xs font-bold uppercase truncate" style={{ color: 'var(--cs-ink)' }}>
                {t.subject}
              </span>
              <CsTag label={t.status.replace("_", " ")} tone={ticketTone(t.status)} />
            </div>
            <p className="cs-mono text-xs truncate" style={{ color: 'var(--cs-muted)' }}>
              {t.email} · {new Date(t.createdAt).toLocaleString()}
            </p>
            <p className="text-sm mt-3" style={{ color: 'var(--cs-ink)' }}>
              {t.message.length > 160 ? `${t.message.slice(0, 160)}…` : t.message}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                onClick={() => void loadMessages(t)}
                className="cs-mono text-[10px] font-bold uppercase px-2 py-1 transition-colors hover:bg-[var(--cs-panel)]"
                style={{ border: '2px solid var(--cs-ink)', color: 'var(--cs-ink)', letterSpacing: '0.08em' }}
              >
                View thread
              </button>
              <button
                onClick={() => void updateStatus(t.id, "OPEN")}
                className="cs-mono text-[10px] font-bold uppercase px-2 py-1 transition-colors hover:bg-[var(--cs-panel)]"
                style={{ border: '1.5px solid var(--cs-line)', color: 'var(--cs-muted)', letterSpacing: '0.08em' }}
              >
                Open
              </button>
              <button
                onClick={() => void updateStatus(t.id, "IN_PROGRESS")}
                className="cs-mono text-[10px] font-bold uppercase px-2 py-1 transition-colors hover:bg-[var(--cs-panel)]"
                style={{ border: '1.5px solid var(--cs-line)', color: 'var(--cs-muted)', letterSpacing: '0.08em' }}
              >
                In progress
              </button>
              <button
                onClick={() => void updateStatus(t.id, "RESOLVED")}
                className="cs-mono text-[10px] font-bold uppercase px-2 py-1 transition-colors hover:bg-[var(--cs-panel)]"
                style={{ border: '1.5px solid var(--cs-line)', color: 'var(--cs-muted)', letterSpacing: '0.08em' }}
              >
                Resolved
              </button>
              <button
                onClick={() => void updateStatus(t.id, "CLOSED")}
                className="cs-mono text-[10px] font-bold uppercase px-2 py-1 transition-colors hover:bg-[var(--cs-panel)]"
                style={{ border: '1.5px solid var(--cs-line)', color: 'var(--cs-muted)', letterSpacing: '0.08em' }}
              >
                Closed
              </button>
            </div>
          </CsBox>
        ))}
      </div>

      {selectedTicket && (
        <CsBox className="p-5">
          <div className="flex items-center justify-between gap-2 pb-3" style={{ borderBottom: '2.5px solid var(--cs-ink)' }}>
            <div className="min-w-0">
              <CsSlug>Conversation</CsSlug>
              <h3 className="cs-display mt-1 truncate" style={{ fontSize: 26, color: 'var(--cs-ink)' }}>
                {selectedTicket.subject}
              </h3>
              <p className="cs-mono text-xs truncate" style={{ color: 'var(--cs-muted)' }}>{selectedTicket.email}</p>
            </div>
            <CsTag label={selectedTicket.status.replace("_", " ")} tone={ticketTone(selectedTicket.status)} />
          </div>

          <div className="space-y-3 mt-4 overflow-y-auto" style={{ maxHeight: 288 }}>
            {messages.map((m) => (
              <div key={m.id} className={`flex ${m.isAdmin ? "justify-end" : "justify-start"}`}>
                <div
                  className="px-3 py-2 text-xs"
                  style={{
                    maxWidth: '80%',
                    border: m.isAdmin ? '1.5px solid var(--cs-brand)' : '1.5px solid var(--cs-line)',
                    background: m.isAdmin ? 'var(--cs-panel)' : 'var(--cs-paper)',
                    color: 'var(--cs-ink)',
                  }}
                >
                  <p className="whitespace-pre-wrap">{m.message}</p>
                  <p className="cs-mono mt-1" style={{ fontSize: 10, color: 'var(--cs-muted)' }}>
                    {new Date(m.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
            {messages.length === 0 && (
              <p className="cs-mono text-xs" style={{ color: 'var(--cs-muted)' }}>
                No messages yet for this ticket.
              </p>
            )}
          </div>

          <div className="space-y-2 mt-4">
            <textarea
              rows={3}
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              placeholder="Type an internal reply to the customer…"
              style={{ ...fieldStyle, resize: 'none' }}
            />
            <div className="flex justify-between items-center">
              <button
                type="button"
                onClick={() => setSelectedTicket(null)}
                className="cs-mono text-xs font-bold uppercase"
                style={{ color: 'var(--cs-muted)' }}
              >
                Close thread
              </button>
              <CsButton
                type="button"
                variant="rust"
                disabled={replying || !reply.trim()}
                onClick={() => void sendReply()}
              >
                {replying ? "Sending…" : "Send reply"}
              </CsButton>
            </div>
          </div>
        </CsBox>
      )}
    </div>
  );
}
