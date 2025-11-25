import { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Loader } from "./ui/loader";
import { toast } from "sonner";
import { Link as LinkIcon } from "lucide-react";

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

  const fetchData = async () => {
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
  };

  useEffect(() => {
    fetchData();
  }, []);

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">Team & Permissions</h1>
          <p className="text-white text-sm">
            Invite admins, manage roles. Only Super Admins can change roles or remove users.
          </p>
        </div>
        <Button
          onClick={() => setShowInviteModal(true)}
          className="bg-[#fd7e14] hover:bg-[#ff9940] text-white"
        >
          Add member
        </Button>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Pending invites</h3>
            {loadingList && <Loader size={14} />}
          </div>
          <div className="space-y-3">
            {invites.map((inv) => (
              <div
                key={inv.id}
                className="flex items-center justify-between rounded-lg border border-neutral-800 px-3 py-2"
              >
                <div>
                  <p className="text-white text-sm">{inv.email}</p>
                  <p className="text-xs text-neutral-300">
                    {inv.role} · expires {new Date(inv.expiresAt).toLocaleDateString()}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => revokeInvite(inv.id)}
                  className="border-neutral-700 text-white bg-transparent hover:bg-neutral-800"
                >
                  Revoke
                </Button>
              </div>
            ))}
            {invites.length === 0 && <p className="text-neutral-300 text-sm">No pending invites</p>}
          </div>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Team members</h3>
            {loadingList && <Loader size={14} />}
          </div>
          <div className="space-y-3">
            {members
              .filter((m) => m.role && m.role !== "USER")
              .map((m) => (
                <div
                  key={m.id}
                  className="flex items-center justify-between rounded-lg border border-neutral-800 px-3 py-2"
                >
                  <div>
                    <p className="text-white text-sm">{m.name || m.email}</p>
                    <p className="text-xs text-neutral-300">{m.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Select value={m.role} onValueChange={(v) => updateRole(m.id, v)}>
                      <SelectTrigger className="w-36 bg-neutral-950 border-neutral-800 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {roles.map((r) => (
                          <SelectItem key={r} value={r}>
                            {r.replace("_", " ")}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      size="sm"
                      onClick={() => deleteUser(m.id)}
                      className="text-white bg-red-600 border border-red-600 hover:bg-red-500 hover:text-white"
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
            {members.length === 0 && <p className="text-neutral-300 text-sm">No team members</p>}
          </div>
        </div>
      </div>

      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-2xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">Invite team member</h2>
              <Button variant="ghost" onClick={() => setShowInviteModal(false)} className="text-white">
                Close
              </Button>
            </div>
            <div className="space-y-3">
              <div>
                <Label className="text-white">Email</Label>
                <Input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="name@company.com"
                  className={`mt-1 bg-white text-black placeholder:text-neutral-600 border-neutral-800 focus:border-[#fd7e14] focus:ring-[#fd7e14] ${inputError ? "border-red-500 ring-red-500" : ""}`}
                  style={{
                    backgroundColor: "#ffffff",
                    color: "#000000",
                    caretColor: "#000000",
                  }}
                />
              </div>
              <div>
                <Label className="text-white">Role</Label>
                <Select value={inviteRole} onValueChange={(v) => setInviteRole(v)}>
                  <SelectTrigger className="mt-1 bg-neutral-950 border-neutral-800 text-white">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((r) => (
                      <SelectItem key={r} value={r}>
                        {r.replace("_", " ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full">
                <Button
                  disabled={loading || !inviteEmail}
                  onClick={() => sendInvite(true, false)}
                  className="w-full bg-[#fd7e14] hover:bg-[#ff9940] text-white"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <Loader size={16} /> Sending...
                    </span>
                  ) : (
                    "Send invite"
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={loading || !inviteEmail}
                  onClick={() => sendInvite(false, true)}
                  className="border-neutral-700 text-white w-full"
                >
                  <span className="flex items-center gap-2 justify-center">
                    <LinkIcon className="w-4 h-4" />
                    {loading ? "..." : "Share link"}
                  </span>
                </Button>
              </div>
              {generatedLink && (
                <div className="mt-2 space-y-2">
                  <Label className="text-white text-xs">Invite link</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      value={generatedLink}
                      readOnly
                      className="bg-neutral-900 text-white border-neutral-700 rounded-lg"
                      style={{ caretColor: "transparent" }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      className="border-neutral-700 text-white"
                      onClick={() => {
                        navigator.clipboard.writeText(generatedLink);
                        toast.success("Link copied");
                      }}
                    >
                      <span className="flex items-center gap-2 justify-center">
                        <LinkIcon className="w-4 h-4" />
                        Copy link
                      </span>
                    </Button>
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
