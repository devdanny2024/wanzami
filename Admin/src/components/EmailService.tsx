import { useMemo, useState } from "react";
import {
  FileText,
  Inbox,
  MailCheck,
  Send,
  TestTube,
  Trash2,
  Upload,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { CsBox, CsButton, CsPageHeader, CsSlug, CsStat, CsTag } from "./cs/kit";

type Recipient = {
  email: string;
  name?: string;
};

const emailRegex = /^[^\s@]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/i;
const sanitizeEmail = (val?: string | null) =>
  (val ?? "")
    .replace(/[\u200b\uFEFF]/g, "")
    .trim()
    .replace(/[;,.:]+$/g, "")
    .replace(/\.@/g, "@")
    .toLowerCase();
const isValidEmail = (val?: string | null) => {
  const s = sanitizeEmail(val);
  return !!s && emailRegex.test(s);
};

const parseEmailList = (input: string) =>
  input
    .split(/[\n,;]+/)
    .map((item) => sanitizeEmail(item))
    .filter(Boolean)
    .filter((item, idx, arr) => isValidEmail(item) && arr.indexOf(item) === idx);

const normalizeHeader = (key: string) => key.toLowerCase().replace(/\s+/g, "");
const EMAIL_HEADERS = ["email", "e-mail", "mail", "address", "emailaddress"];
const NAME_HEADERS = ["name", "fullname", "full_name", "full name"];

// Prefer serving logo via CDN if configured (CloudFront, etc.).
const MEDIA_BASE =
  process.env.NEXT_PUBLIC_MEDIA_CDN_BASE || process.env.NEXT_PUBLIC_MEDIA_BASE;
const FALLBACK_BUCKET = process.env.NEXT_PUBLIC_S3_BUCKET || "wanzami-bucket";
const FALLBACK_REGION = process.env.NEXT_PUBLIC_S3_REGION || "eu-north-1";
const LOGO_KEY = "wanzami_assets/wanzami_logo.png";
const LOGO_SRC = MEDIA_BASE
  ? `${MEDIA_BASE.replace(/\/+$/, "")}/${LOGO_KEY}`
  : `https://${FALLBACK_BUCKET}.s3.${FALLBACK_REGION}.amazonaws.com/${LOGO_KEY}`;

const pickRecipientFromRow = (row: Record<string, any>): Recipient | null => {
  const entries = Object.entries(row).filter(([, v]) => v !== null && v !== undefined && String(v).trim().length > 0);
  if (!entries.length) return null;

  const byHeader = (candidates: string[]) =>
    entries.find(([key]) => candidates.includes(normalizeHeader(key)))?.[1] as string | undefined;

  const headerEmail = byHeader(EMAIL_HEADERS)?.toString().trim();
  const fallbackEmail = entries.map(([, v]) => sanitizeEmail(v.toString())).find((v) => isValidEmail(v));
  const email = headerEmail && isValidEmail(headerEmail) ? headerEmail : fallbackEmail;
  if (!email || !isValidEmail(email)) return null;

  const headerName = (byHeader(NAME_HEADERS) as string | undefined)?.toString().trim();
  const name =
    headerName && headerName.length > 0
      ? headerName
      : entries
          .map(([, v]) => v.toString().trim())
          .find((v) => v.length > 0 && !emailRegex.test(v));

  return { email, name };
};

const FILMMAKER_TEMPLATE_SUBJECT = "Are you the filmmaker who can pull an audience?";
const FILMMAKER_TEMPLATE_BODY = `<!DOCTYPE html>
<html lang="en">
<body style="margin:0;padding:0;background:#0f0f0f;font-family:Arial,Helvetica,sans-serif;color:#f5f5f5;">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
    <tr>
      <td align="center" style="padding:32px 12px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="640" style="max-width:640px;background:#111;border:1px solid #1f1f1f;border-radius:12px;overflow:hidden;">
          <tr>
            <td style="padding:20px 24px 0 24px;">
              <img src="${LOGO_SRC}" alt="Wanzami TV" width="150" style="display:block;border:0;outline:none;text-decoration:none;height:auto;" />
            </td>
          </tr>
          <tr>
            <td style="padding:28px 24px 12px 24px;background:linear-gradient(135deg, #171717 0%, #0f0f0f 50%, #111 100%);">
              <div style="font-size:12px;letter-spacing:0.3px;color:#cfcfcf;text-transform:uppercase;">Wanzami TV Presents</div>
              <h1 style="margin:12px 0 6px 0;font-size:26px;line-height:1.3;color:#f97316;">
                If you're really a filmmaker, prove your film can pull an audience.
              </h1>
              <p style="margin:4px 0 0 0;font-size:15px;line-height:1.5;color:#e5e5e5;">
                Wanzami isn't looking for excuses. We're looking for stories people actually want to see.
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding:20px 24px;">
              <p style="margin:0 0 14px 0;font-size:15px;line-height:1.6;color:#e5e5e5;">
                Hi {{name}},
              </p>
              <p style="margin:0 0 16px 0;font-size:15px;line-height:1.6;color:#e5e5e5;">
                Submit your 15–20 minute short film and let the audience decide. We are selecting <strong>20 filmmakers</strong> who believe in their craft. Entry fee is <strong>₦50,000</strong> — refunded if your film is not shortlisted.
              </p>

              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:8px 0 16px 0;">
                <tr>
                  <td style="padding:14px 16px;background:#0c0c0c;border:1px solid #1f1f1f;border-radius:10px;">
                    <p style="margin:0;font-size:15px;line-height:1.6;color:#f5f5f5;">
                      <strong style="color:#f97316;">No panel.</strong> Just an audience that wants to see your film. Prices go to the films with the highest streams. Rally your supporters — the more views you drive, the higher your chances of winning.
                    </p>
                  </td>
                </tr>
              </table>

              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:8px 0 18px 0;">
                <tr>
                  <td style="padding:14px 16px;background:#0c0c0c;border:1px solid #1f1f1f;border-radius:10px;">
                    <p style="margin:0 0 10px 0;font-size:14px;letter-spacing:0.4px;text-transform:uppercase;color:#cfcfcf;">Prizes for the top 3 films</p>
                    <ul style="margin:0;padding-left:18px;color:#e5e5e5;font-size:15px;line-height:1.6;">
                      <li>🥇 ₦1,000,000</li>
                      <li>🥈 ₦750,000</li>
                      <li>🥉 ₦500,000</li>
                    </ul>
                  </td>
                </tr>
              </table>

              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:8px 0 18px 0;">
                <tr>
                  <td style="padding:14px 16px;background:#0c0c0c;border:1px solid #1f1f1f;border-radius:10px;">
                    <p style="margin:0;font-size:15px;line-height:1.6;color:#e5e5e5;">
                      <strong>Deadline:</strong> Submission closes January 30th, 2026.<br/>
                      <strong>Contact:</strong> <a href="mailto:info@wanzamientertainment.com" style="color:#f97316;text-decoration:none;">info@wanzamientertainment.com</a>
                    </p>
                  </td>
                </tr>
              </table>
              <p style="margin:10px 0 0 0;font-size:12px;line-height:1.5;color:#a3a3a3;text-align:center;">
                Terms and conditions apply. If your film is not shortlisted, your entry fee is refunded.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

const fieldStyle: React.CSSProperties = {
  border: '2px solid var(--cs-ink)',
  background: 'var(--cs-paper)',
  color: 'var(--cs-ink)',
  fontFamily: 'var(--font-smono), monospace',
  fontSize: 12,
  padding: '9px 12px',
  width: '100%',
};

export function EmailService() {
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [uploadInfo, setUploadInfo] = useState<{ fileName?: string; imported: number; invalid: number }>({
    fileName: undefined,
    imported: 0,
    invalid: 0,
  });
  const [manualList, setManualList] = useState("");
  const [templateSubject, setTemplateSubject] = useState("Important update from Wanzami");
  const [templateBody, setTemplateBody] = useState(
    "Hi {{name}},\n\nWe have an update to share with you. Replace this text with your own HTML or plain text template. You can use {{name}} and {{email}} placeholders.\n\nThanks for being with Wanzami!"
  );
  const [testEmailsInput, setTestEmailsInput] = useState("qa@wanzami.com\nproduct@wanzami.com");
  const [sendingTest, setSendingTest] = useState(false);
  const [sendingLive, setSendingLive] = useState(false);
  const [lastTest, setLastTest] = useState<string | null>(null);
  const [lastSend, setLastSend] = useState<string | null>(null);
  const [batchSize, setBatchSize] = useState<number>(50);
  const [startIndex, setStartIndex] = useState<number>(0);
  const [loadingAudience, setLoadingAudience] = useState(false);
  const token = useMemo(() => (typeof window !== "undefined" ? localStorage.getItem("accessToken") : null), []);

  const validTestEmails = useMemo(() => parseEmailList(testEmailsInput), [testEmailsInput]);
  const dedupedRecipients = useMemo(() => {
    const seen = new Map<string, Recipient>();
    for (const r of recipients) {
      const key = r.email.toLowerCase();
      seen.set(key, { ...seen.get(key), ...r });
    }
    return Array.from(seen.values());
  }, [recipients]);
  const readyToSend = dedupedRecipients.length > 0 && templateSubject.trim().length > 0 && templateBody.trim().length > 0;
  const sampleRecipient = useMemo(
    () => dedupedRecipients[0] ?? { name: "Subscriber", email: "user@example.com" },
    [dedupedRecipients]
  );
  const authHeaders = useMemo(() => (token ? { Authorization: `Bearer ${token}` } : {}), [token]);
  const isHtmlTemplate = useMemo(() => /<\s*[\w!]/.test(templateBody), [templateBody]);

  const parseDelimitedText = (text: string) => {
    const lines = text
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
    const next: Recipient[] = [];
    let invalid = 0;
    for (const line of lines) {
      const parts = line.split(/,|\t/).map((p) => sanitizeEmail(p)).filter(Boolean);
      const email = parts.find((p) => isValidEmail(p));
      if (!email) {
        invalid += 1;
        continue;
      }
      const name = parts.find((p) => p !== email);
      next.push({ email, name });
    }
    return { next, invalid };
  };

  const parseExcel = async (file: File) => {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: "array" });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) return { next: [], invalid: 0 };
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json<Record<string, any>>(sheet, { defval: "" });
    const next: Recipient[] = [];
    let invalid = 0;
    rows.forEach((row) => {
      const rec = pickRecipientFromRow(
        Object.fromEntries(
          Object.entries(row).map(([k, v]) => [k, typeof v === "string" ? sanitizeEmail(v) : v])
        )
      );
      if (rec) {
        next.push(rec);
      } else {
        invalid += 1;
      }
    });
    return { next, invalid };
  };

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    const ext = file.name.toLowerCase();
    let parsed: { next: Recipient[]; invalid: number } = { next: [], invalid: 0 };

    try {
      if (ext.endsWith(".xlsx") || ext.endsWith(".xls")) {
        parsed = await parseExcel(file);
      } else {
        const text = await file.text();
        parsed = parseDelimitedText(text);
      }
    } catch (err) {
      toast.error("Failed to read file. Please try again or use CSV/XLSX.");
      return;
    }

    if (parsed.next.length === 0) {
      toast.error("No valid email addresses found in the file.");
      setUploadInfo({ fileName: file.name, imported: 0, invalid: parsed.invalid });
      return;
    }

    setRecipients((prev) => {
      const combined = [...prev, ...parsed.next];
      const dedup = new Map<string, Recipient>();
      combined.forEach((rec) => {
        const key = rec.email.toLowerCase();
        dedup.set(key, { ...dedup.get(key), ...rec });
      });
      return Array.from(dedup.values());
    });

    setUploadInfo({ fileName: file.name, imported: parsed.next.length, invalid: parsed.invalid });
    toast.success(`Loaded ${parsed.next.length} recipients${parsed.invalid ? `, skipped ${parsed.invalid}` : ""}.`);
  };

  const handleManualAdd = () => {
    const emails = parseEmailList(manualList);
    if (emails.length === 0) {
      toast.error("Add at least one valid email address.");
      return;
    }
    setRecipients((prev) => {
      const combined = [...prev, ...emails.map((email) => ({ email }))];
      const dedup = new Map<string, Recipient>();
      combined.forEach((rec) => {
        const key = rec.email.toLowerCase();
        dedup.set(key, { ...dedup.get(key), ...rec });
      });
      return Array.from(dedup.values());
    });
    setManualList("");
    setUploadInfo((info) => ({ ...info, imported: info.imported + emails.length }));
    toast.success(`Added ${emails.length} manual recipient${emails.length > 1 ? "s" : ""}.`);
  };

  const sendTests = async () => {
    if (!templateSubject.trim() || !templateBody.trim()) {
      toast.error("Add a subject and template before sending a test.");
      return;
    }
    if (validTestEmails.length === 0) {
      toast.error("Add at least one test email address.");
      return;
    }

    setSendingTest(true);
    try {
      const res = await fetch("/api/admin/email/test", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({
          subject: templateSubject,
          html: templateBody,
          recipients: validTestEmails.map((email) => ({ email })),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data?.message ?? "Failed to send test emails");
        return;
      }
      const timestamp = new Date().toLocaleString();
      setLastTest(`Sent ${validTestEmails.length} test email${validTestEmails.length > 1 ? "s" : ""} at ${timestamp}`);
      toast.success(data?.message ?? "Test emails queued");
    } catch (err) {
      toast.error("Failed to send test emails");
    } finally {
      setSendingTest(false);
    }
  };

  const loadAllRegisteredUsers = async () => {
    setLoadingAudience(true);
    try {
      const res = await fetch("/api/admin/email/audience", {
        method: "GET",
        headers: { "Content-Type": "application/json", ...authHeaders },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data?.message ?? "Failed to load registered users");
        return;
      }
      const list = (data?.recipients as Recipient[] | undefined) ?? [];
      if (!list.length) {
        toast.info("No registered users found to add.");
        return;
      }
      setRecipients((prev) => {
        const existing = new Map<string, Recipient>();
        for (const r of prev) {
          existing.set(sanitizeEmail(r.email), r);
        }
        for (const r of list) {
          const email = sanitizeEmail(r.email);
          if (!isValidEmail(email)) continue;
          existing.set(email, { email, name: r.name });
        }
        return Array.from(existing.values());
      });
      toast.success(`Loaded ${list.length} registered users into the audience.`);
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to load registered users");
    } finally {
      setLoadingAudience(false);
    }
  };

  const loadFilmmakerTemplate = () => {
    setTemplateSubject(FILMMAKER_TEMPLATE_SUBJECT);
    setTemplateBody(FILMMAKER_TEMPLATE_BODY);
    toast.success("Loaded the filmmaker campaign template");
  };

  const sendLive = async () => {
    if (!readyToSend) {
      toast.error("Upload recipients and complete the template before sending.");
      return;
    }

    const cleanedRecipients = dedupedRecipients
      .map((r) => ({
        email: sanitizeEmail(r.email),
        name: r.name?.trim() || undefined,
      }))
      .filter((r) => !!r.email && isValidEmail(r.email));
    const invalidCount = dedupedRecipients.length - cleanedRecipients.length;
    if (invalidCount > 0) {
      const invalidEmails = dedupedRecipients
        .map((r) => sanitizeEmail(r.email))
        .filter((e) => !isValidEmail(e))
        .slice(0, 3);
      toast.info(
        `Removed ${invalidCount} invalid email${invalidCount > 1 ? "s" : ""}${
          invalidEmails.length ? `: ${invalidEmails.join(", ")}` : ""
        }.`
      );
    }
    if (cleanedRecipients.length === 0) {
      toast.error("No valid email addresses to send. Please clean the list and try again.");
      return;
    }
    const slice = cleanedRecipients.slice(
      Math.max(0, startIndex),
      Math.max(0, startIndex) + Math.max(1, batchSize || 1)
    );
    if (slice.length === 0) {
      toast.error("No recipients in the selected batch. Adjust start index or batch size.");
      return;
    }

    if (!window.confirm(`Send this email to ${slice.length} recipients (indexes ${startIndex} to ${startIndex + slice.length - 1})?`)) {
      return;
    }

    setSendingLive(true);
    try {
      const res = await fetch("/api/admin/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({
          subject: templateSubject,
          html: templateBody,
          recipients: slice,
          startIndex,
          batchSize,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const issues = (data?.issues || data?.errors) as any[] | undefined;
        if (issues?.length) {
          const first = issues[0];
          const detail = first?.path ? ` (${first.path.join(".")})` : "";
          const value = first?.received || first?.message;
          toast.error(`${first?.message ?? data?.message ?? "Failed to queue emails"}${detail}${value ? `: ${value}` : ""}`);
        } else {
          toast.error(data?.message ?? "Failed to queue emails");
        }
        return;
      }
      const timestamp = new Date().toLocaleString();
      const queued = data?.queued ?? data?.queuedCount ?? slice.length;
      const failed = data?.failed ?? 0;
      const jobId = data?.jobId;
      setLastSend(
        `Enqueued ${queued} emails${failed ? ` (${failed} failed)` : ""} at ${timestamp} [indexes ${startIndex} - ${
          startIndex + slice.length - 1
        }]${jobId ? ` job: ${jobId}` : ""}`
      );
      toast.success(data?.message ?? `Enqueued ${queued} emails.${failed ? ` ${failed} failed.` : ""}`);
      const failedList: string[] = (data?.failedRecipients as string[] | undefined) ?? [];
      if (failedList.length) {
        const sample = failedList.slice(0, 5).join(", ");
        toast.info(`Failed to queue ${failedList.length} email(s): ${sample}`);
      }
      setStartIndex((prev) => prev + Math.max(1, batchSize || 1));
    } catch (err) {
      toast.error("Failed to queue emails");
    } finally {
      setSendingLive(false);
    }
  };

  const clearAudience = () => {
    setRecipients([]);
    setUploadInfo({ fileName: undefined, imported: 0, invalid: 0 });
  };

  const personalizedPreview = useMemo(() => {
    const base = templateBody || "";
    return base
      .replace(/{{\s*name\s*}}/gi, sampleRecipient.name ?? "Subscriber")
      .replace(/{{\s*email\s*}}/gi, sampleRecipient.email ?? "user@example.com");
  }, [templateBody, sampleRecipient]);

  return (
    <div className="space-y-8 email-service-root">
      <CsPageHeader
        title="The wire room"
        chip={readyToSend ? 'Ready' : 'Draft'}
        slug="Email service · upload a list, craft a template, send tests, launch campaigns"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <CsStat label="Audience ready" value={String(dedupedRecipients.length)} hint="Unique addresses after deduplication" />
        <CsStat label="Test list" value={String(validTestEmails.length)} hint="Will receive the next test" />
        <CsStat
          label="Template"
          value={templateSubject.trim().length > 0 ? "Ready" : "Draft"}
          hint={templateSubject || "Add a subject"}
        />
        <CsStat label="Last actions" value={lastSend || lastTest ? "Logged" : "None yet"} hint={lastSend || lastTest || "No sends yet"} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <CsBox className="p-5">
          <div className="flex items-center justify-between">
            <CsSlug>Upload recipients</CsSlug>
            <CsTag label="CSV, TXT, XLSX" tone="neutral" />
          </div>
          <p className="text-sm mt-2" style={{ color: 'var(--cs-muted)' }}>
            Upload a CSV or Excel file (name,email) or paste addresses below.
          </p>

          <div className="mt-4 space-y-4">
            <label
              className="flex flex-col items-center gap-2 p-4 cursor-pointer"
              style={{ border: '1.5px dashed var(--cs-ink)' }}
            >
              <Upload className="w-6 h-6" style={{ color: 'var(--cs-rust)' }} />
              <p className="text-sm text-center" style={{ color: 'var(--cs-muted)' }}>
                Drop a CSV/TXT/XLSX file here, or click to choose.
              </p>
              <input
                type="file"
                accept=".csv,.txt,.xlsx,.xls"
                className="hidden"
                onChange={(e) => void handleFileUpload(e.target.files)}
              />
            </label>

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <CsSlug>Quick add emails</CsSlug>
                <CsButton variant="rust" onClick={() => void loadAllRegisteredUsers()} disabled={loadingAudience}>
                  <span className="inline-flex items-center gap-2">
                    <Users className="w-3.5 h-3.5" />
                    {loadingAudience ? "Loading users..." : "Add all registered users"}
                  </span>
                </CsButton>
              </div>
              <textarea
                value={manualList}
                onChange={(e) => setManualList(e.target.value)}
                placeholder="One email per line or comma separated"
                style={{ ...fieldStyle, resize: 'vertical' }}
                rows={4}
              />
              <div className="flex items-center justify-between">
                <CsButton variant="outline" onClick={handleManualAdd}>
                  <span className="inline-flex items-center gap-2">
                    <Inbox className="w-3.5 h-3.5" />
                    Add emails
                  </span>
                </CsButton>
                <button
                  onClick={clearAudience}
                  title="Clear audience"
                  className="p-2"
                  style={{ color: 'var(--cs-muted)' }}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="p-3 space-y-2" style={{ border: '1.5px solid var(--cs-line)', background: 'var(--cs-panel)' }}>
              <div className="flex items-center justify-between text-sm">
                <span style={{ color: 'var(--cs-muted)' }}>Last upload</span>
                <span style={{ color: 'var(--cs-ink)' }}>{uploadInfo.fileName ?? "—"}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span style={{ color: 'var(--cs-muted)' }}>Imported</span>
                <span style={{ color: 'var(--cs-ink)' }}>{uploadInfo.imported}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span style={{ color: 'var(--cs-muted)' }}>Skipped</span>
                <span style={{ color: 'var(--cs-rust)' }}>{uploadInfo.invalid}</span>
              </div>
            </div>
          </div>
        </CsBox>

        <CsBox className="p-5 lg:col-span-2">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <CsSlug>Template</CsSlug>
                <p className="text-sm mt-1" style={{ color: 'var(--cs-muted)' }}>Write the subject and body you want to send.</p>
              </div>
              <div className="flex gap-2 items-center flex-wrap">
                <CsTag label="{{name}}" tone="neutral" />
                <CsTag label="{{email}}" tone="neutral" />
                <CsButton variant="outline" onClick={loadFilmmakerTemplate}>
                  <span className="inline-flex items-center gap-2">
                    <FileText className="w-3.5 h-3.5" />
                    Load filmmaker template
                  </span>
                </CsButton>
              </div>
            </div>

            <div className="mt-4 space-y-2">
              <CsSlug>Subject</CsSlug>
              <input
                value={templateSubject}
                onChange={(e) => setTemplateSubject(e.target.value)}
                style={fieldStyle}
                placeholder="Subject"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div className="space-y-2">
                <CsSlug>Email body</CsSlug>
                <textarea
                  value={templateBody}
                  onChange={(e) => setTemplateBody(e.target.value)}
                  style={{ ...fieldStyle, resize: 'vertical' }}
                  rows={12}
                  placeholder="Paste your HTML or text email template here"
                />
              </div>
              <div className="space-y-2">
                <CsSlug>Preview</CsSlug>
                <div className="p-4 flex flex-col gap-3" style={{ border: '1.5px solid var(--cs-line)', background: 'var(--cs-panel)' }}>
                  <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--cs-muted)' }}>
                    <span className="font-bold" style={{ color: 'var(--cs-ink)' }}>To:</span>
                    <span>{sampleRecipient.name ?? "Subscriber"} &lt;{sampleRecipient.email}&gt;</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--cs-muted)' }}>
                    <span className="font-bold" style={{ color: 'var(--cs-ink)' }}>Subject:</span>
                    <span>{templateSubject || "Subject goes here"}</span>
                  </div>
                  <div
                    className="overflow-y-auto text-sm"
                    style={{ background: 'var(--cs-paper)', border: '1.5px solid var(--cs-line)', padding: 12, color: 'var(--cs-ink)' }}
                  >
                    {isHtmlTemplate ? (
                      <div
                        className="text-sm leading-relaxed [&_*]:max-w-full [&_*]:text-current"
                        dangerouslySetInnerHTML={{
                          __html: personalizedPreview || "Your template preview will appear here.",
                        }}
                      />
                    ) : (
                      <div className="whitespace-pre-wrap">{personalizedPreview || "Your template preview will appear here."}</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
        </CsBox>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <CsBox className="p-5 lg:col-span-2">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <CsSlug>Audience preview</CsSlug>
              <p className="text-sm mt-1" style={{ color: 'var(--cs-muted)' }}>
                Showing the first {Math.min(dedupedRecipients.length, 8)} recipients.
              </p>
            </div>
            <CsTag label={`${dedupedRecipients.length} ready`} tone="neutral" />
          </div>
          <div className="space-y-3 mt-4">
            {dedupedRecipients.length === 0 && (
              <p className="text-sm" style={{ color: 'var(--cs-muted)' }}>Upload a CSV/XLSX file or paste emails to see them here.</p>
            )}
            {dedupedRecipients.slice(0, 8).map((recipient) => (
              <div
                key={recipient.email}
                className="flex items-center justify-between px-3 py-2"
                style={{ border: '1.5px solid var(--cs-line)' }}
              >
                <div>
                  <p className="text-sm" style={{ color: 'var(--cs-ink)' }}>{recipient.name || "Unnamed recipient"}</p>
                  <p className="text-xs mt-1" style={{ color: 'var(--cs-muted)' }}>{recipient.email}</p>
                </div>
                <CsTag label="Ready" tone="good" />
              </div>
            ))}
            {dedupedRecipients.length > 8 && (
              <p className="text-xs" style={{ color: 'var(--cs-muted)' }}>
                +{dedupedRecipients.length - 8} more recipients not shown.
              </p>
            )}
          </div>
        </CsBox>

        <CsBox className="p-5">
          <div className="flex items-center justify-between">
            <CsSlug>Send controls</CsSlug>
            <CsTag label={readyToSend ? "Ready" : "Draft"} tone={readyToSend ? "good" : "neutral"} />
          </div>
          <p className="text-sm mt-2" style={{ color: 'var(--cs-muted)' }}>Send a test first, then launch to your audience.</p>

          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <CsSlug>Test email addresses</CsSlug>
              <textarea
                value={testEmailsInput}
                onChange={(e) => setTestEmailsInput(e.target.value)}
                style={{ ...fieldStyle, resize: 'vertical' }}
                rows={4}
                placeholder="qa@wanzami.com, product@wanzami.com"
              />
              <p className="text-xs" style={{ color: 'var(--cs-muted)' }}>Separate by commas or new lines.</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <CsSlug>Batch size</CsSlug>
                <input
                  type="number"
                  min={1}
                  value={batchSize}
                  onChange={(e) => setBatchSize(Number(e.target.value) || 1)}
                  style={fieldStyle}
                />
              </div>
              <div className="space-y-1">
                <CsSlug>Start index</CsSlug>
                <input
                  type="number"
                  min={0}
                  value={startIndex}
                  onChange={(e) => setStartIndex(Math.max(0, Number(e.target.value) || 0))}
                  style={fieldStyle}
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <CsButton variant="outline" onClick={sendTests} disabled={sendingTest}>
                <span className="inline-flex items-center gap-2">
                  <TestTube className="w-3.5 h-3.5" />
                  {sendingTest ? "Sending tests..." : "Send test emails"}
                </span>
              </CsButton>
              <CsButton variant="rust" onClick={sendLive} disabled={sendingLive || !readyToSend} className="flex-1">
                <span className="inline-flex items-center gap-2 justify-center">
                  <Send className="w-3.5 h-3.5" />
                  {sendingLive ? "Queueing..." : `Send to ${dedupedRecipients.length || 0} users`}
                </span>
              </CsButton>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm" style={{ color: 'var(--cs-muted)' }}>
                <span>Readiness</span>
                <span>{readyToSend ? "Ready to send" : "Waiting on audience/template"}</span>
              </div>
              <div style={{ height: 8, background: 'var(--cs-panel)', border: '1.5px solid var(--cs-line)' }}>
                <div
                  style={{
                    height: '100%',
                    width: `${readyToSend ? 100 : Math.min(60, dedupedRecipients.length ? 60 : 30)}%`,
                    background: 'var(--cs-rust)',
                  }}
                />
              </div>
              {lastTest && <p className="text-xs" style={{ color: 'var(--cs-muted)' }}>Last test: {lastTest}</p>}
              {lastSend && <p className="text-xs" style={{ color: 'var(--cs-muted)' }}>Last live send: {lastSend}</p>}
            </div>

            <div className="p-3 space-y-2" style={{ border: '1.5px solid var(--cs-line)', background: 'var(--cs-panel)' }}>
              <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--cs-ink)' }}>
                <MailCheck className="w-4 h-4" style={{ color: 'var(--cs-rust)' }} />
                <p>Flow</p>
              </div>
              <ol className="list-decimal list-inside text-xs space-y-1" style={{ color: 'var(--cs-muted)' }}>
                <li>Upload a CSV or Excel file (name,email) or paste addresses.</li>
                <li>Write or paste your template. Use {"{{name}}"} and {"{{email}}"} placeholders.</li>
                <li>Send a test to the QA list before launching to everyone.</li>
              </ol>
            </div>
          </div>
        </CsBox>
      </div>
    </div>
  );
}
