import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";

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

  const load = async (opts?: { status?: string; q?: string; days?: string }) => {
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
  };

  useEffect(() => {
    void load();
  }, []);

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
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl text-white">Support Tickets</h1>
          <p className="text-sm text-neutral-400">
            Messages submitted from the Contact page and in-app support bubble.
          </p>
          <div className="mt-1 flex flex-wrap gap-3 text-xs text-neutral-400">
            <span>
              Open:{" "}
              <span className="text-neutral-200">
                {counts["OPEN"] ?? 0}
              </span>
            </span>
            <span>
              In progress:{" "}
              <span className="text-neutral-200">
                {counts["IN_PROGRESS"] ?? 0}
              </span>
            </span>
            <span>
              Resolved:{" "}
              <span className="text-neutral-200">
                {counts["RESOLVED"] ?? 0}
              </span>
            </span>
          </div>
        </div>
        <div className="flex flex-col md:flex-row gap-2 md:items-center">
          <input
            type="text"
            placeholder="Search subject or message"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                void load({ q: e.currentTarget.value });
              }
            }}
            className="w-full md:w-56 rounded-lg bg-neutral-900 border border-neutral-700 px-3 py-1.5 text-xs text-white outline-none focus:border-[#fd7e14] focus:ring-1 focus:ring-[#fd7e14]"
          />
          <select
            value={statusFilter}
            onChange={(e) => {
              const value = e.target.value;
              setStatusFilter(value);
              void load({ status: value });
            }}
            className="rounded-lg bg-neutral-900 border border-neutral-700 px-3 py-1.5 text-xs text-white outline-none focus:border-[#fd7e14] focus:ring-1 focus:ring-[#fd7e14]"
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
            className="rounded-lg bg-neutral-900 border border-neutral-700 px-3 py-1.5 text-xs text-white outline-none focus:border-[#fd7e14] focus:ring-1 focus:ring-[#fd7e14]"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="all">All time</option>
          </select>
          <button
            onClick={() => void load()}
            className="px-3 py-1.5 rounded-lg text-sm bg-neutral-800 text-white hover:bg-neutral-700 border border-neutral-700"
          >
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="text-sm text-red-400 bg-red-950/40 border border-red-800 rounded-lg px-4 py-2">
          {error}
        </div>
      )}

      {loading && tickets.length === 0 && (
        <p className="text-sm text-neutral-400">Loading tickets…</p>
      )}

      {tickets.length === 0 && !loading && (
        <p className="text-sm text-neutral-400">No tickets yet.</p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {tickets.map((t) => (
          <Card
            key={t.id}
            className="bg-neutral-900 border-neutral-800 flex flex-col"
          >
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-white flex justify-between gap-2">
                <span className="truncate">{t.subject}</span>
                <Badge
                  variant="outline"
                  className="text-[10px] uppercase tracking-wide border-neutral-700 text-neutral-100 bg-neutral-900"
                >
                  {t.status.replace("_", " ")}
                </Badge>
              </CardTitle>
              <p className="text-xs text-neutral-400 truncate">
                {t.email} • {new Date(t.createdAt).toLocaleString()}
              </p>
              </CardHeader>
            <CardContent className="flex-1 flex flex-col gap-3">
              <p className="text-sm text-neutral-200 line-clamp-4">
                {t.message}
              </p>
              <div className="mt-auto flex flex-wrap gap-2">
                <button
                  onClick={() => void loadMessages(t)}
                  className="px-2 py-1 text-xs rounded-md border border-neutral-700 text-neutral-100 hover:bg-neutral-800"
                >
                  View thread
                </button>
                <button
                  onClick={() => void updateStatus(t.id, "OPEN")}
                  className="px-2 py-1 text-xs rounded-md border border-neutral-700 text-neutral-200 hover:bg-neutral-800"
                >
                  Open
                </button>
                <button
                  onClick={() => void updateStatus(t.id, "IN_PROGRESS")}
                  className="px-2 py-1 text-xs rounded-md border border-neutral-700 text-neutral-200 hover:bg-neutral-800"
                >
                  In progress
                </button>
                <button
                  onClick={() => void updateStatus(t.id, "RESOLVED")}
                  className="px-2 py-1 text-xs rounded-md border border-neutral-700 text-neutral-200 hover:bg-neutral-800"
                >
                  Resolved
                </button>
                <button
                  onClick={() => void updateStatus(t.id, "CLOSED")}
                  className="px-2 py-1 text-xs rounded-md border border-neutral-700 text-neutral-200 hover:bg-neutral-800"
                >
                  Closed
                </button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedTicket && (
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-[2fr,1fr] gap-4">
          <Card className="bg-neutral-900 border-neutral-800">
            <CardHeader>
              <CardTitle className="text-white text-sm flex items-center justify-between gap-2">
                <span className="truncate">
                  Conversation • {selectedTicket.subject}
                </span>
                <Badge
                  variant="outline"
                  className="text-[10px] uppercase tracking-wide border-neutral-700 text-neutral-100 bg-neutral-900"
                >
                  {selectedTicket.status.replace("_", " ")}
                </Badge>
              </CardTitle>
              <p className="text-xs text-neutral-400 truncate">
                {selectedTicket.email}
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="max-h-72 overflow-y-auto space-y-3 pr-1">
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={`flex ${
                      m.isAdmin ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`rounded-lg px-3 py-2 text-xs max-w-[80%] ${
                        m.isAdmin
                          ? "bg-[#fd7e14]/20 border border-[#fd7e14]/40 text-amber-50"
                          : "bg-neutral-800 border border-neutral-700 text-neutral-50"
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{m.message}</p>
                      <p className="mt-1 text-[10px] text-neutral-300">
                        {new Date(m.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
                {messages.length === 0 && (
                  <p className="text-xs text-neutral-500">
                    No messages yet for this ticket.
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <textarea
                  rows={3}
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  placeholder="Type an internal reply to the customer…"
                  className="w-full rounded-md bg-neutral-950 border border-neutral-800 px-3 py-2 text-xs text-white outline-none focus:border-[#fd7e14] focus:ring-1 focus:ring-[#fd7e14] resize-none"
                />
                <div className="flex justify-between items-center">
                  <button
                    type="button"
                    onClick={() => setSelectedTicket(null)}
                    className="text-xs text-neutral-400 hover:text-neutral-200"
                  >
                    Close thread
                  </button>
                  <button
                    type="button"
                    disabled={replying || !reply.trim()}
                    onClick={() => void sendReply()}
                    className="px-3 py-1.5 rounded-md text-xs font-semibold bg-[#fd7e14] text-white hover:bg-[#ff9f4d] disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {replying ? "Sending…" : "Send reply"}
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
