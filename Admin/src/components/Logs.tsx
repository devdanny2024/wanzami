import { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { authFetch } from "@/lib/authClient";

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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl text-white">System Logs</h1>
          <p className="text-neutral-400 mt-1">Recent errors to help you debug issues</p>
        </div>
      </div>

      <Card className="bg-neutral-900 border-neutral-800">
        <CardHeader>
          <CardTitle className="text-white">Latest entries</CardTitle>
        </CardHeader>
        <CardContent>
          {loading && <p className="text-neutral-400 text-sm">Loading logs...</p>}
          {error && <p className="text-red-400 text-sm">{error}</p>}
          {!loading && !error && logs.length === 0 && <p className="text-neutral-500 text-sm">No logs yet.</p>}
          {!loading && !error && logs.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-neutral-800 text-neutral-400">
                    <th className="text-left py-2 px-3">Time</th>
                    <th className="text-left py-2 px-3">Level</th>
                    <th className="text-left py-2 px-3">Message</th>
                    <th className="text-left py-2 px-3">Path</th>
                    <th className="text-left py-2 px-3">User</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id} className="border-b border-neutral-800 hover:bg-neutral-800/40">
                      <td className="py-2 px-3 text-neutral-300">
                        {log.createdAt ? new Date(log.createdAt).toLocaleString() : "--"}
                      </td>
                      <td className="py-2 px-3">
                        <Badge className="bg-red-500/20 text-red-300">{log.level}</Badge>
                      </td>
                      <td className="py-2 px-3 text-white max-w-md">
                        <div className="truncate" title={log.message}>
                          {log.message}
                        </div>
                        {log.stack && (
                          <details className="text-xs text-neutral-400 mt-1">
                            <summary className="cursor-pointer text-neutral-300">Stack</summary>
                            <pre className="whitespace-pre-wrap text-neutral-400">{log.stack}</pre>
                          </details>
                        )}
                      </td>
                      <td className="py-2 px-3 text-neutral-400">{log.path ?? "--"}</td>
                      <td className="py-2 px-3 text-neutral-400">{log.userId ?? "--"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
