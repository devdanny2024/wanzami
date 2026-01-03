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

type Recipient = {
  email: string;
  name?: string;
};

const emailRegex = /\S+@\S+\.\S+/;

const parseEmailList = (input: string) =>
  input
    .split(/[\n,;]+/)
    .map((item) => item.trim())
    .filter(Boolean)
    .filter((item, idx, arr) => emailRegex.test(item) && arr.indexOf(item) === idx);

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

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    const text = await file.text();
    const lines = text
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    const next: Recipient[] = [];
    const invalid: string[] = [];

    for (const line of lines) {
      const parts = line.split(/,|\t/).map((p) => p.trim()).filter(Boolean);
      const email = parts.find((p) => emailRegex.test(p));
      if (!email) {
        invalid.push(line);
        continue;
      }
      const name = parts.find((p) => p !== email);
      next.push({ email, name });
    }

    if (next.length === 0) {
      toast.error("No valid email addresses found in the file.");
      setUploadInfo({ fileName: file.name, imported: 0, invalid: lines.length });
      return;
    }

    setRecipients((prev) => {
      const combined = [...prev, ...next];
      const dedup = new Map<string, Recipient>();
      combined.forEach((rec) => {
        const key = rec.email.toLowerCase();
        dedup.set(key, { ...dedup.get(key), ...rec });
      });
      return Array.from(dedup.values());
    });

    setUploadInfo({ fileName: file.name, imported: next.length, invalid: invalid.length });
    toast.success(`Loaded ${next.length} recipients${invalid.length ? `, skipped ${invalid.length}` : ""}.`);
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

  const sendLive = async () => {
    if (!readyToSend) {
      toast.error("Upload recipients and complete the template before sending.");
      return;
    }
    if (!window.confirm(`Send this email to ${dedupedRecipients.length} recipients?`)) {
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
          recipients: dedupedRecipients,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data?.message ?? "Failed to queue emails");
        return;
      }
      const timestamp = new Date().toLocaleString();
      setLastSend(`Queued ${dedupedRecipients.length} emails at ${timestamp}`);
      toast.success(data?.message ?? `Queued ${dedupedRecipients.length} emails.`);
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
          Upload a recipient list, craft a template, send tests, and launch campaigns with confidence.
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
                CSV or TXT
              </Badge>
            </div>
            <p className="text-neutral-400 text-sm">Upload a CSV (name,email) or paste addresses below.</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <label className="border border-dashed border-neutral-700 hover:border-[#fd7e14] transition-colors rounded-lg p-4 flex flex-col items-center gap-2 text-neutral-300 cursor-pointer">
              <Upload className="w-6 h-6 text-[#fd7e14]" />
              <p className="text-sm text-center">
                Drop a CSV/TXT file here, or click to choose.
              </p>
              <Input
                type="file"
                accept=".csv,.txt"
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
                  <div className="bg-neutral-900 border border-neutral-800 rounded-md p-3 text-neutral-200 text-sm whitespace-pre-wrap overflow-y-auto">
                    {personalizedPreview || "Your template preview will appear here."}
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
              <p className="text-neutral-500 text-sm">Upload a file or paste emails to see them here.</p>
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
                <li>Upload a CSV of users (name,email) or paste addresses.</li>
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
