import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
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

// Use the production logo from the us-east-2 bucket (public HTTP URL).
const LOGO_SRC = "https://wanzami-bucket-east.s3.us-east-2.amazonaws.com/wanzami_assets/wanzami_logo.png";

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
  const sampleRecipient = dedupedRecipients[0] ?? { name: "Subscriber", email: "user@example.com" };
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
      const queued = data?.queued ?? slice.length;
      const failed = data?.failed ?? 0;
      setLastSend(
        `Queued ${queued} emails at ${timestamp}${failed ? ` (${failed} failed)` : ""} [indexes ${startIndex} - ${
          startIndex + slice.length - 1
        }]`
      );
      toast.success(data?.message ?? `Queued ${queued} emails.${failed ? ` ${failed} failed.` : ""}`);
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
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl text-white">Email Service</h1>
        <p className="text-neutral-400">
          Upload a recipient list (CSV/XLSX), craft a template, send tests, and launch campaigns with confidence.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-neutral-900 border-neutral-800">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-neutral-400 text-xs">Audience ready</p>
                <p className="text-2xl text-white font-semibold">{dedupedRecipients.length}</p>
              </div>
              <Users className="w-10 h-10 text-[#fd7e14]" />
            </div>
            <p className="text-xs text-neutral-500 mt-2">Unique addresses after deduplication.</p>
          </CardContent>
        </Card>
        <Card className="bg-neutral-900 border-neutral-800">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-neutral-400 text-xs">Test list</p>
                <p className="text-2xl text-white font-semibold">{validTestEmails.length}</p>
              </div>
              <TestTube className="w-10 h-10 text-emerald-400" />
            </div>
            <p className="text-xs text-neutral-500 mt-2">Addresses that will receive the next test.</p>
          </CardContent>
        </Card>
        <Card className="bg-neutral-900 border-neutral-800">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-neutral-400 text-xs">Template</p>
                <p className="text-2xl text-white font-semibold">
                  {templateSubject.trim().length > 0 ? "Ready" : "Draft"}
                </p>
              </div>
              <FileText className="w-10 h-10 text-sky-400" />
            </div>
            <p className="text-xs text-neutral-500 mt-2 truncate">{templateSubject || "Add a subject"}</p>
          </CardContent>
        </Card>
        <Card className="bg-neutral-900 border-neutral-800">
          <CardContent className="pt-4 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-neutral-400 text-xs">Last actions</p>
                <p className="text-sm text-white font-semibold">
                  {lastSend || lastTest || "No sends yet"}
                </p>
              </div>
              <MailCheck className="w-10 h-10 text-amber-300" />
            </div>
            {lastTest && <p className="text-[11px] text-neutral-500">Test: {lastTest}</p>}
            {lastSend && <p className="text-[11px] text-neutral-500">Live: {lastSend}</p>}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="bg-neutral-900 border-neutral-800">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-white text-lg">Upload recipients</CardTitle>
              <Badge className="bg-neutral-800 text-neutral-200 border border-neutral-700">
                CSV, TXT, XLSX
              </Badge>
            </div>
            <p className="text-neutral-400 text-sm">Upload a CSV or Excel file (name,email) or paste addresses below.</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <label className="border border-dashed border-neutral-700 hover:border-[#fd7e14] transition-colors rounded-lg p-4 flex flex-col items-center gap-2 text-neutral-300 cursor-pointer">
              <Upload className="w-6 h-6 text-[#fd7e14]" />
              <p className="text-sm text-center">
                Drop a CSV/TXT/XLSX file here, or click to choose.
              </p>
              <Input
                type="file"
                accept=".csv,.txt,.xlsx,.xls"
                className="hidden"
                onChange={(e) => void handleFileUpload(e.target.files)}
              />
            </label>

            <div className="space-y-2">
              <label className="text-sm text-neutral-300">Quick add emails</label>
              <Textarea
                value={manualList}
                onChange={(e) => setManualList(e.target.value)}
                placeholder="One email per line or comma separated"
                className="bg-neutral-950 border-neutral-800 text-white"
                rows={4}
              />
              <div className="flex items-center justify-between">
                <Button
                  size="sm"
                  variant="outline"
                  className="border-neutral-700 text-white"
                  onClick={handleManualAdd}
                >
                  <Inbox className="w-4 h-4 mr-2" />
                  Add emails
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="text-neutral-400 hover:text-white"
                  onClick={clearAudience}
                  title="Clear audience"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-neutral-400">Last upload</span>
                <span className="text-white">{uploadInfo.fileName ?? "—"}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-neutral-400">Imported</span>
                <span className="text-white">{uploadInfo.imported}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-neutral-400">Skipped</span>
                <span className="text-amber-400">{uploadInfo.invalid}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-neutral-900 border-neutral-800 lg:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-white text-lg">Template</CardTitle>
                <p className="text-neutral-400 text-sm">Write the subject and body you want to send.</p>
              </div>
              <div className="flex gap-2">
                <Badge className="bg-neutral-800 text-neutral-200 border border-neutral-700">{"{{name}}"}</Badge>
                <Badge className="bg-neutral-800 text-neutral-200 border border-neutral-700">{"{{email}}"}</Badge>
                <Button size="sm" variant="outline" className="border-neutral-700 text-white" onClick={loadFilmmakerTemplate}>
                  <FileText className="w-4 h-4 mr-2" />
                  Load filmmaker template
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm text-neutral-300">Subject</label>
              <Input
                value={templateSubject}
                onChange={(e) => setTemplateSubject(e.target.value)}
                className="bg-neutral-950 border-neutral-800 text-white"
                placeholder="Subject"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm text-neutral-300">Email body</label>
                <Textarea
                  value={templateBody}
                  onChange={(e) => setTemplateBody(e.target.value)}
                  className="bg-neutral-950 border-neutral-800 text-white h-full"
                  rows={12}
                  placeholder="Paste your HTML or text email template here"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-neutral-300">Preview</label>
                <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-4 h-full flex flex-col gap-3">
                  <div className="flex items-center gap-2 text-sm text-neutral-400">
                    <span className="font-semibold text-white">To:</span>
                    <span>{sampleRecipient.name ?? "Subscriber"} &lt;{sampleRecipient.email}&gt;</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-neutral-400">
                    <span className="font-semibold text-white">Subject:</span>
                    <span>{templateSubject || "Subject goes here"}</span>
                  </div>
                  <div className="bg-neutral-900 border border-neutral-800 rounded-md p-3 text-neutral-200 text-sm overflow-y-auto">
                    {isHtmlTemplate ? (
                      <div
                        className="text-neutral-200 text-sm leading-relaxed [&_*]:max-w-full [&_*]:text-current"
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
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="bg-neutral-900 border-neutral-800 lg:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-white text-lg">Audience preview</CardTitle>
                <p className="text-neutral-400 text-sm">
                  Showing the first {Math.min(dedupedRecipients.length, 8)} recipients.
                </p>
              </div>
              <Badge className="bg-neutral-800 text-neutral-200 border border-neutral-700">
                {dedupedRecipients.length} ready
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {dedupedRecipients.length === 0 && (
              <p className="text-neutral-500 text-sm">Upload a CSV/XLSX file or paste emails to see them here.</p>
            )}
            {dedupedRecipients.slice(0, 8).map((recipient) => (
              <div
                key={recipient.email}
                className="flex items-center justify-between bg-neutral-950 border border-neutral-800 rounded-md px-3 py-2"
              >
                <div>
                  <p className="text-white text-sm">{recipient.name || "Unnamed recipient"}</p>
                  <p className="text-xs text-neutral-400">{recipient.email}</p>
                </div>
                <Badge className="bg-neutral-800 text-neutral-200 border border-neutral-700">Ready</Badge>
              </div>
            ))}
            {dedupedRecipients.length > 8 && (
              <p className="text-xs text-neutral-500">
                +{dedupedRecipients.length - 8} more recipients not shown.
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="bg-neutral-900 border-neutral-800">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-white text-lg">Send controls</CardTitle>
              <Badge className={readyToSend ? "bg-emerald-500/20 text-emerald-300" : "bg-neutral-800 text-neutral-200 border border-neutral-700"}>
                {readyToSend ? "Ready" : "Draft"}
              </Badge>
            </div>
            <p className="text-neutral-400 text-sm">Send a test first, then launch to your audience.</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm text-neutral-300">Test email addresses</label>
              <Textarea
                value={testEmailsInput}
                onChange={(e) => setTestEmailsInput(e.target.value)}
                className="bg-neutral-950 border-neutral-800 text-white"
                rows={4}
                placeholder="qa@wanzami.com, product@wanzami.com"
              />
              <p className="text-xs text-neutral-500">Separate by commas or new lines.</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-sm text-neutral-300">Batch size</label>
                <Input
                  type="number"
                  min={1}
                  value={batchSize}
                  onChange={(e) => setBatchSize(Number(e.target.value) || 1)}
                  className="bg-neutral-950 border-neutral-800 text-white"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm text-neutral-300">Start index</label>
                <Input
                  type="number"
                  min={0}
                  value={startIndex}
                  onChange={(e) => setStartIndex(Math.max(0, Number(e.target.value) || 0))}
                  className="bg-neutral-950 border-neutral-800 text-white"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button
                className="bg-neutral-800 text-white hover:bg-neutral-700"
                onClick={sendTests}
                disabled={sendingTest}
              >
                <TestTube className="w-4 h-4 mr-2" />
                {sendingTest ? "Sending tests..." : "Send test emails"}
              </Button>
              <Button
                className="bg-[#fd7e14] hover:bg-[#ff9940] text-white flex-1"
                onClick={sendLive}
                disabled={sendingLive || !readyToSend}
              >
                <Send className="w-4 h-4 mr-2" />
                {sendingLive ? "Queueing..." : `Send to ${dedupedRecipients.length || 0} users`}
              </Button>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm text-neutral-400">
                <span>Readiness</span>
                <span>{readyToSend ? "Ready to send" : "Waiting on audience/template"}</span>
              </div>
              <Progress value={readyToSend ? 100 : Math.min(60, dedupedRecipients.length ? 60 : 30)} />
              {lastTest && <p className="text-xs text-neutral-500">Last test: {lastTest}</p>}
              {lastSend && <p className="text-xs text-neutral-500">Last live send: {lastSend}</p>}
            </div>

            <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-3 space-y-2">
              <div className="flex items-center gap-2 text-sm text-neutral-300">
                <MailCheck className="w-4 h-4 text-emerald-400" />
                <p>Flow</p>
              </div>
              <ol className="list-decimal list-inside text-xs text-neutral-400 space-y-1">
                <li>Upload a CSV or Excel file (name,email) or paste addresses.</li>
                <li>Write or paste your template. Use {"{{name}}"} and {"{{email}}"} placeholders.</li>
                <li>Send a test to the QA list before launching to everyone.</li>
              </ol>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
