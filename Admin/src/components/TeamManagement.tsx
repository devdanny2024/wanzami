import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Link as LinkIcon } from "lucide-react";
import { CsBox, CsButton, CsPageHeader, CsSlug } from "./cs/kit";

const isValidEmail = (email: string) => /\S+@\S+\.\S+/.test(email);

const roles = [
  "SUPER_ADMIN",
  "CONTENT_MANAGER",
  "BLOG_EDITOR",
  "MODERATOR",
  "SUPPORT",
  "FINANCE",
  "ANALYTICS",
  "OPS",
];

type Invite = {
  id: string;
  email: string;
  role: string;
  createdAt: string;
  expiresAt: string;
  acceptedAt?: string | null;
};

type Member = {
  id: string;
  email: string;
  role: string;
  name: string;
  createdAt: string;
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

const selectStyle: React.CSSProperties = {
  border: '2px solid var(--cs-ink)',
  background: 'var(--cs-paper)',
  color: 'var(--cs-ink)',
  fontFamily: 'var(--font-smono), monospace',
  fontSize: 11,
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.07em',
  padding: '8px 10px',
};

export function TeamManagement() {
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("CONTENT_MANAGER");
  const [invites, setInvites] = useState<Invite[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingList, setLoadingList] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [generatedLink, setGeneratedLink] = useState("");
  const [inputError, setInputError] = useState(false);

  const authHeaders = () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const fetchData = useCallback(async () => {
    setLoadingList(true);
    try {
      const [invRes, userRes] = await Promise.all([
        fetch("/api/admin/invitations", { headers: { ...authHeaders() } }),
        fetch("/api/admin/users", { headers: { ...authHeaders() } }),
      ]);
      const invData = await invRes.json();
      const userData = await userRes.json();
      if (invRes.ok) setInvites(invData.invites ?? []);
      if (userRes.ok) {
        const admins = (userData.users ?? []).filter((u: any) => u.role && u.role !== "USER");
        setMembers(admins);
      }
    } catch (err) {
      toast.error("Unable to load team data");
    } finally {
      setLoadingList(false);
    }
  }, []);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const createInvite = async (): Promise<string | null> => {
    if (!isValidEmail(inviteEmail)) {
      setInputError(true);
      toast.error("Invalid email");
      setTimeout(() => setInputError(false), 400);
      return null;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/admin/invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message ?? "Unable to send invite");
        return null;
      } else {
        const link = `${process.env.NEXT_PUBLIC_ADMIN_ORIGIN ?? "http://localhost:3001"}/admin/accept-invite?token=${data.token}&email=${encodeURIComponent(inviteEmail)}`;
        return link;
      }
    } catch (err) {
      toast.error("Unable to send invite");
      return null;
    } finally {
      setLoading(false);
    }
  };

  const sendInvite = async (closeAfter = true, copyLink = false) => {
    const link = await createInvite();
    if (!link) return;
    setGeneratedLink(link);
    if (copyLink) {
      await navigator.clipboard.writeText(link);
      toast.success("Link copied");
    } else {
      toast.success("Invite sent");
    }
    setInviteEmail("");
    if (closeAfter) setShowInviteModal(false);
    fetchData();
  };

  const revokeInvite = async (id: string) => {
    const res = await fetch(`/api/admin/invitations/${id}`, {
      method: "DELETE",
      headers: { ...authHeaders() },
    });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.message ?? "Unable to revoke invite");
      return;
    }
    toast.success("Invite revoked");
    fetchData();
  };

  const updateRole = async (id: string, role: string) => {
    const res = await fetch(`/api/admin/users/${id}/role`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({ role }),
    });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.message ?? "Unable to update role");
      return;
    }
    toast.success("Role updated");
    fetchData();
  };

  const deleteUser = async (id: string) => {
    const res = await fetch(`/api/admin/users/${id}`, {
      method: "DELETE",
      headers: { ...authHeaders() },
    });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.message ?? "Unable to remove user");
      return;
    }
    toast.success("User removed");
    fetchData();
  };

  return (
    <div className="space-y-8">
      <CsPageHeader
        title="The crew roster"
        chip={loadingList ? '···' : `${members.length} members`}
        slug="Team & permissions · only super admins can change roles"
        actions={<CsButton variant="rust" onClick={() => setShowInviteModal(true)}>Add member</CsButton>}
      />

      <div className="grid md:grid-cols-2 gap-6">
        <CsBox className="p-5">
          <div className="flex items-center justify-between">
            <CsSlug>Pending invites</CsSlug>
            {loadingList && <span className="cs-mono" style={{ fontSize: 10, color: 'var(--cs-muted)' }}>···</span>}
          </div>
          <div className="space-y-3 mt-4">
            {invites.map((inv) => (
              <div
                key={inv.id}
                className="flex items-center justify-between p-3"
                style={{ border: '1.5px solid var(--cs-line)' }}
              >
                <div>
                  <p className="cs-mono text-sm font-bold" style={{ color: 'var(--cs-ink)' }}>{inv.email}</p>
                  <p className="cs-mono mt-1" style={{ fontSize: 10, color: 'var(--cs-muted)' }}>
                    {inv.role} · expires {new Date(inv.expiresAt).toLocaleDateString()}
                  </p>
                </div>
                <CsButton variant="outline" onClick={() => revokeInvite(inv.id)}>
                  Revoke
                </CsButton>
              </div>
            ))}
            {invites.length === 0 && (
              <p className="cs-mono text-xs" style={{ color: 'var(--cs-muted)' }}>No pending invites</p>
            )}
          </div>
        </CsBox>

        <CsBox className="p-5">
          <div className="flex items-center justify-between">
            <CsSlug>Team members</CsSlug>
            {loadingList && <span className="cs-mono" style={{ fontSize: 10, color: 'var(--cs-muted)' }}>···</span>}
          </div>
          <div className="space-y-3 mt-4">
            {members
              .filter((m) => m.role && m.role !== "USER")
              .map((m) => (
                <div
                  key={m.id}
                  className="flex items-center justify-between p-3 gap-3"
                  style={{ border: '1.5px solid var(--cs-line)' }}
                >
                  <div>
                    <p className="cs-mono text-sm font-bold" style={{ color: 'var(--cs-ink)' }}>{m.name || m.email}</p>
                    <p className="cs-mono mt-1" style={{ fontSize: 10, color: 'var(--cs-muted)' }}>{m.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={m.role}
                      onChange={(e) => updateRole(m.id, e.target.value)}
                      style={selectStyle}
                    >
                      {roles.map((r) => (
                        <option key={r} value={r}>
                          {r.replace("_", " ")}
                        </option>
                      ))}
                    </select>
                    <CsButton variant="rust" onClick={() => deleteUser(m.id)}>
                      Remove
                    </CsButton>
                  </div>
                </div>
              ))}
            {members.length === 0 && (
              <p className="cs-mono text-xs" style={{ color: 'var(--cs-muted)' }}>No team members</p>
            )}
          </div>
        </CsBox>
      </div>

      {showInviteModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-6"
          style={{ background: 'rgba(22, 19, 16, 0.55)' }}
          onClick={() => setShowInviteModal(false)}
        >
          <div
            className="cs-border cs-shadow w-full max-w-md p-6"
            style={{ background: 'var(--cs-paper)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4" style={{ borderBottom: '2.5px solid var(--cs-ink)' }}>
              <div>
                <CsSlug>New call sheet entry</CsSlug>
                <h2 className="cs-display mt-1" style={{ fontSize: 28, color: 'var(--cs-ink)' }}>
                  Invite team member
                </h2>
              </div>
              <button
                onClick={() => setShowInviteModal(false)}
                className="cs-mono text-xs font-bold px-2 py-1"
                style={{ border: '2px solid var(--cs-ink)' }}
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <div className="space-y-3 mt-4">
              <div>
                <CsSlug className="mb-1">Email</CsSlug>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  // Some browsers/extensions trigger input events without change (e.g. autofill/paste).
                  // Keep state in sync so the Send/Share buttons enable reliably.
                  onInput={(e) => setInviteEmail((e.target as HTMLInputElement).value)}
                  placeholder="name@company.com"
                  style={{
                    ...fieldStyle,
                    borderColor: inputError ? 'var(--cs-rust)' : 'var(--cs-ink)',
                  }}
                />
              </div>
              <div>
                <CsSlug className="mb-1">Role</CsSlug>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  style={{ ...selectStyle, width: '100%' }}
                >
                  {roles.map((r) => (
                    <option key={r} value={r}>
                      {r.replace("_", " ")}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full">
                <CsButton
                  variant="rust"
                  disabled={loading || !inviteEmail.trim()}
                  onClick={() => sendInvite(true, false)}
                  className="w-full"
                >
                  {loading ? "Sending…" : "Send invite"}
                </CsButton>
                <CsButton
                  variant="outline"
                  disabled={loading || !inviteEmail.trim()}
                  onClick={() => sendInvite(false, true)}
                  className="w-full"
                >
                  <span className="inline-flex items-center gap-2 justify-center">
                    <LinkIcon className="w-3.5 h-3.5" />
                    {loading ? "..." : "Share link"}
                  </span>
                </CsButton>
              </div>
              {generatedLink && (
                <div className="mt-2 space-y-2">
                  <CsSlug>Invite link</CsSlug>
                  <div className="flex items-center gap-2">
                    <input
                      value={generatedLink}
                      readOnly
                      style={{ ...fieldStyle, caretColor: 'transparent' }}
                    />
                    <CsButton
                      variant="outline"
                      onClick={() => {
                        navigator.clipboard.writeText(generatedLink);
                        toast.success("Link copied");
                      }}
                    >
                      <span className="inline-flex items-center gap-2 justify-center">
                        <LinkIcon className="w-3.5 h-3.5" />
                        Copy link
                      </span>
                    </CsButton>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
