import { useCallback, useEffect, useMemo, useState } from "react";
import { Download, ExternalLink, Mail, MessageCircle, Search } from "lucide-react";
import { toast } from "sonner";
import { CsBox, CsButton, CsColumn, CsPageHeader, CsStat, CsTable, CsTag } from "./cs/kit";

type Lead = {
  id: string;
  name: string;
  domain: string | null;
  siteUrl: string | null;
  contactType: "EMAIL" | "WHATSAPP";
  contactValue: string;
  contactSource: string;
  verification: string;
  confidence: "HIGH" | "MEDIUM" | "LOW";
  country: string | null;
  sourceUrl: string | null;
  scrapedAt: string | null;
};

type Facets = {
  confidence: Partial<Record<Lead["confidence"], number>>;
  contactType: Partial<Record<Lead["contactType"], number>>;
};

const authHeaders = () => {
  const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const confidenceTone = (c: Lead["confidence"]): "good" | "bad" | "pending" => {
  if (c === "HIGH") return "good";
  if (c === "LOW") return "bad";
  return "pending";
};

// mx_invalid means the domain accepts no mail, so the address is effectively
// dead. Worth flagging in the table rather than burying in a detail view.
const verificationTone = (v: string): "good" | "bad" | "neutral" =>
  v === "mx_invalid" ? "bad" : v === "mx_valid" ? "good" : "neutral";

const PAGE_SIZE = 50;

export function FilmmakerLeads() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [facets, setFacets] = useState<Facets>({ confidence: {}, contactType: {} });
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const [typeFilter, setTypeFilter] = useState<"ALL" | Lead["contactType"]>("ALL");
  const [confFilter, setConfFilter] = useState<"ALL" | Lead["confidence"]>("ALL");
  const [countryFilter, setCountryFilter] = useState("");
  const [searchDraft, setSearchDraft] = useState("");
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: String(PAGE_SIZE) });
      if (typeFilter !== "ALL") params.set("contactType", typeFilter);
      if (confFilter !== "ALL") params.set("confidence", confFilter);
      if (countryFilter) params.set("country", countryFilter);
      if (search) params.set("search", search);

      const res = await fetch(`/api/admin/filmmaker-leads?${params}`, { headers: authHeaders() });
      if (!res.ok) throw new Error(`Status ${res.status}`);
      const data = await res.json();
      setLeads(data.leads ?? []);
      setFacets(data.facets ?? { confidence: {}, contactType: {} });
      setTotal(data.total ?? 0);
      setTotalPages(data.totalPages ?? 1);
    } catch {
      toast.error("Could not load filmmaker leads");
    } finally {
      setLoading(false);
    }
  }, [page, typeFilter, confFilter, countryFilter, search]);

  useEffect(() => {
    void load();
  }, [load]);

  // Any filter change invalidates the current page number.
  useEffect(() => {
    setPage(1);
  }, [typeFilter, confFilter, countryFilter, search]);

  const countries = useMemo(
    () => Array.from(new Set(leads.map((l) => l.country).filter(Boolean) as string[])).sort(),
    [leads]
  );

  // Exports the current filtered page. The scraper owns the full-corpus export,
  // so this is for handing a working shortlist to someone, not for backup.
  const exportCsv = () => {
    if (leads.length === 0) {
      toast.error("Nothing to export");
      return;
    }
    const header = ["name", "contactType", "contactValue", "confidence", "verification", "country", "sourceUrl"];
    const escape = (v: string) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
    const body = leads.map((l) =>
      [l.name, l.contactType, l.contactValue, l.confidence, l.verification, l.country ?? "", l.sourceUrl ?? ""]
        .map((v) => escape(String(v)))
        .join(",")
    );
    const blob = new Blob([[header.join(","), ...body].join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `filmmaker-leads-page${page}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${leads.length} leads`);
  };

  const columns: CsColumn<Lead>[] = [
    {
      key: "name",
      header: "Name",
      cell: (l) => (
        <div className="flex items-center gap-2">
          <span className="font-bold">{l.name || "Unknown"}</span>
          {l.siteUrl ? (
            <a href={l.siteUrl} target="_blank" rel="noopener noreferrer" title={l.siteUrl}>
              <ExternalLink size={13} style={{ color: "var(--cs-muted)" }} />
            </a>
          ) : null}
        </div>
      ),
    },
    {
      key: "contact",
      header: "Contact",
      cell: (l) => (
        <div className="flex items-center gap-2">
          {l.contactType === "EMAIL" ? <Mail size={13} /> : <MessageCircle size={13} />}
          {l.contactType === "EMAIL" ? (
            <a href={`mailto:${l.contactValue}`} className="underline">
              {l.contactValue}
            </a>
          ) : (
            <a
              href={`https://wa.me/${l.contactValue.replace(/\D/g, "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              {l.contactValue}
            </a>
          )}
        </div>
      ),
    },
    { key: "country", header: "Country", cell: (l) => l.country ?? "—" },
    {
      key: "confidence",
      header: "Confidence",
      cell: (l) => <CsTag label={l.confidence} tone={confidenceTone(l.confidence)} />,
    },
    {
      key: "verification",
      header: "Verified",
      cell: (l) => <CsTag label={l.verification} tone={verificationTone(l.verification)} />,
    },
    { key: "source", header: "Found via", cell: (l) => l.contactSource },
  ];

  const filterButton = (active: boolean, label: string, onClick: () => void, count?: number) => (
    <button
      key={label}
      onClick={onClick}
      className="cs-mono font-bold uppercase"
      style={{
        fontSize: 11,
        padding: "6px 12px",
        letterSpacing: "0.06em",
        border: "2px solid var(--cs-ink)",
        background: active ? "var(--cs-ink)" : "var(--cs-paper)",
        color: active ? "#fff" : "var(--cs-ink)",
      }}
    >
      {label}
      {typeof count === "number" ? ` (${count})` : ""}
    </button>
  );

  return (
    <div className="space-y-6">
      <CsPageHeader
        title="Filmmaker Leads"
        slug="Creator acquisition"
        chip={`${total} total`}
        actions={
          <CsButton variant="outline" onClick={exportCsv}>
            <span className="flex items-center gap-2">
              <Download size={14} /> Export page
            </span>
          </CsButton>
        }
      />

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <CsStat label="Total leads" value={String(total)} />
        <CsStat label="Emails" value={String(facets.contactType.EMAIL ?? 0)} />
        <CsStat label="WhatsApp" value={String(facets.contactType.WHATSAPP ?? 0)} />
        <CsStat
          label="High confidence"
          value={String(facets.confidence.HIGH ?? 0)}
          hint="Found as a direct link"
        />
      </div>

      <CsBox>
        <div className="flex flex-wrap items-center gap-4 p-4">
          <div className="flex flex-wrap gap-2">
            {filterButton(typeFilter === "ALL", "All", () => setTypeFilter("ALL"))}
            {filterButton(typeFilter === "EMAIL", "Email", () => setTypeFilter("EMAIL"), facets.contactType.EMAIL)}
            {filterButton(
              typeFilter === "WHATSAPP",
              "WhatsApp",
              () => setTypeFilter("WHATSAPP"),
              facets.contactType.WHATSAPP
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {(["ALL", "HIGH", "MEDIUM", "LOW"] as const).map((c) =>
              filterButton(
                confFilter === c,
                c,
                () => setConfFilter(c),
                c === "ALL" ? undefined : facets.confidence[c]
              )
            )}
          </div>

          {countries.length > 0 ? (
            <select
              value={countryFilter}
              onChange={(e) => setCountryFilter(e.target.value)}
              className="cs-mono font-bold uppercase"
              style={{
                fontSize: 11,
                padding: "6px 10px",
                border: "2px solid var(--cs-ink)",
                background: "var(--cs-paper)",
                color: "var(--cs-ink)",
              }}
            >
              <option value="">All countries</option>
              {countries.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          ) : null}

          <form
            className="ml-auto flex items-center gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              setSearch(searchDraft.trim());
            }}
          >
            <input
              value={searchDraft}
              onChange={(e) => setSearchDraft(e.target.value)}
              placeholder="Name, contact, domain"
              className="cs-mono"
              style={{
                fontSize: 12,
                padding: "7px 10px",
                border: "2px solid var(--cs-ink)",
                background: "var(--cs-paper)",
                color: "var(--cs-ink)",
                minWidth: 200,
              }}
            />
            <CsButton type="submit" variant="ink">
              <span className="flex items-center gap-2">
                <Search size={13} /> Find
              </span>
            </CsButton>
          </form>
        </div>
      </CsBox>

      <CsTable
        columns={columns}
        rows={leads}
        rowKey={(l) => l.id}
        loading={loading}
        emptySlug="No leads yet"
        emptyBody="Run the filmmaker-scraper and push its results to populate this list."
      />

      {totalPages > 1 ? (
        <div className="flex items-center justify-between">
          <span className="cs-mono" style={{ fontSize: 11, color: "var(--cs-muted)" }}>
            Page {page} of {totalPages}
          </span>
          <div className="flex gap-2">
            <CsButton variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              Previous
            </CsButton>
            <CsButton variant="outline" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
              Next
            </CsButton>
          </div>
        </div>
      ) : null}
    </div>
  );
}
