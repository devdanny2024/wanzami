import { useEffect, useState, useMemo } from "react";
import { authFetch } from "@/lib/authClient";
import { CsBox, CsPageHeader, CsSlug, CsTag } from "./cs/kit";

type LogEntry = {
  id: string;
  level: string;
  message: string;
  stack?: string | null;
  path?: string | null;
  context?: any;
  userId?: string | null;
  createdAt?: string;
};

export function Logs() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const token = useMemo(() => (typeof window !== "undefined" ? localStorage.getItem("accessToken") : null), []);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await authFetch("/admin/logs", {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!res.ok) {
          throw new Error(res.data?.message || `Failed to load logs (${res.status})`);
        }
        setLogs(res.data?.logs ?? []);
      } catch (err: any) {
        setError(err?.message || "Failed to load logs");
      } finally {
        setLoading(false);
      }
    };
    void fetchLogs();
  }, [token]);

  return (
    <div className="space-y-8">
      <CsPageHeader
        title="The incident sheet"
        chip={loading ? '···' : `${logs.length} entries`}
        slug="System logs · recent errors to help you debug"
      />

      <CsBox className="p-5">
        <CsSlug>Latest entries</CsSlug>
        <div className="mt-4">
          {loading && (
            <p className="cs-mono text-xs" style={{ color: 'var(--cs-muted)' }}>
              Loading logs…
            </p>
          )}
          {error && (
            <div className="cs-border p-4" style={{ borderColor: 'var(--cs-rust)' }}>
              <p className="cs-mono text-xs font-bold uppercase" style={{ color: 'var(--cs-rust)' }}>
                {error}
              </p>
            </div>
          )}
          {!loading && !error && logs.length === 0 && (
            <p className="cs-mono text-xs" style={{ color: 'var(--cs-muted)' }}>
              No logs yet.
            </p>
          )}
          {!loading && !error && logs.length > 0 && (
            <div
              className="overflow-x-auto overflow-y-auto cs-border"
              style={{ background: 'var(--cs-panel)', maxHeight: 560 }}
            >
              <table className="w-full cs-mono" style={{ borderCollapse: 'collapse', fontSize: 11 }}>
                <thead>
                  <tr style={{ borderBottom: '2.5px solid var(--cs-ink)' }}>
                    <th
                      className="text-left py-2 px-3 font-bold uppercase"
                      style={{ fontSize: 10, letterSpacing: '0.09em', color: 'var(--cs-ink)' }}
                    >
                      Time
                    </th>
                    <th
                      className="text-left py-2 px-3 font-bold uppercase"
                      style={{ fontSize: 10, letterSpacing: '0.09em', color: 'var(--cs-ink)' }}
                    >
                      Level
                    </th>
                    <th
                      className="text-left py-2 px-3 font-bold uppercase"
                      style={{ fontSize: 10, letterSpacing: '0.09em', color: 'var(--cs-ink)' }}
                    >
                      Message
                    </th>
                    <th
                      className="text-left py-2 px-3 font-bold uppercase"
                      style={{ fontSize: 10, letterSpacing: '0.09em', color: 'var(--cs-ink)' }}
                    >
                      Path
                    </th>
                    <th
                      className="text-left py-2 px-3 font-bold uppercase"
                      style={{ fontSize: 10, letterSpacing: '0.09em', color: 'var(--cs-ink)' }}
                    >
                      User
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id} style={{ borderBottom: '1.5px solid var(--cs-line)' }}>
                      <td className="py-2 px-3" style={{ color: 'var(--cs-muted)' }}>
                        {log.createdAt ? new Date(log.createdAt).toLocaleString() : "--"}
                      </td>
                      <td className="py-2 px-3">
                        <CsTag label={log.level} tone="bad" />
                      </td>
                      <td className="py-2 px-3 max-w-sm" style={{ color: 'var(--cs-ink)' }}>
                        <div className="truncate" title={log.message}>
                          {log.message}
                        </div>
                        {log.stack && (
                          <details className="mt-1" style={{ color: 'var(--cs-muted)', fontSize: 10 }}>
                            <summary className="cursor-pointer" style={{ color: 'var(--cs-muted)' }}>
                              Stack
                            </summary>
                            <pre className="whitespace-pre-wrap" style={{ color: 'var(--cs-muted)' }}>
                              {log.stack}
                            </pre>
                          </details>
                        )}
                      </td>
                      <td className="py-2 px-3" style={{ color: 'var(--cs-muted)' }}>{log.path ?? "--"}</td>
                      <td className="py-2 px-3" style={{ color: 'var(--cs-muted)' }}>{log.userId ?? "--"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </CsBox>
    </div>
  );
}
