import { useState } from 'react';
import { Save, Upload } from 'lucide-react';
import { TeamManagement } from './TeamManagement';
import { CsBox, CsButton, CsPageHeader, CsSlug, CsTag } from './cs/kit';

const inputStyle: React.CSSProperties = {
  border: '2px solid var(--cs-ink)',
  background: 'var(--cs-paper)',
  color: 'var(--cs-ink)',
  fontFamily: 'var(--font-smono), monospace',
  fontSize: 12,
  padding: '9px 12px',
  width: '100%',
};

const selectStyle: React.CSSProperties = {
  ...inputStyle,
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.07em',
};

type SectionKey =
  | 'branding'
  | 'payment'
  | 'streaming'
  | 'content'
  | 'seo'
  | 'email'
  | 'team'
  | 'logs';

function Section({
  id,
  title,
  open,
  onToggle,
  children,
}: {
  id: SectionKey;
  title: string;
  open: boolean;
  onToggle: (id: SectionKey) => void;
  children: React.ReactNode;
}) {
  return (
    <div style={{ borderBottom: '1.5px solid var(--cs-line)' }}>
      <button
        onClick={() => onToggle(id)}
        className="w-full flex items-center justify-between py-4"
        style={{ background: 'transparent', textAlign: 'left' }}
      >
        <span className="cs-display" style={{ fontSize: 22, color: 'var(--cs-ink)' }}>
          {title}
        </span>
        <span className="cs-mono font-bold" style={{ color: 'var(--cs-muted)', fontSize: 14 }}>
          {open ? '−' : '+'}
        </span>
      </button>
      {open && <div className="pb-6 space-y-4">{children}</div>}
    </div>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <CsSlug className="mb-2">{children}</CsSlug>;
}

export function Settings() {
  const [openSection, setOpenSection] = useState<SectionKey | null>('branding');

  const toggle = (id: SectionKey) => setOpenSection((prev) => (prev === id ? null : id));

  return (
    <div className="space-y-8">
      <CsPageHeader
        title="The production book"
        slug="Admin settings · configure platform settings and preferences"
      />

      <CsBox className="p-6">
        {/* Branding */}
        <Section id="branding" title="Branding" open={openSection === 'branding'} onToggle={toggle}>
          <div>
            <FieldLabel>Platform logo</FieldLabel>
            <div className="flex items-center gap-4">
              <div
                className="flex items-center justify-center"
                style={{ width: 64, height: 64, background: 'var(--cs-brand)', border: '2px solid var(--cs-ink)' }}
              >
                <span className="cs-display" style={{ fontSize: 28, color: 'var(--cs-ink)' }}>W</span>
              </div>
              <CsButton variant="outline">
                <span className="inline-flex items-center gap-2">
                  <Upload className="w-3.5 h-3.5" />
                  Upload new logo
                </span>
              </CsButton>
            </div>
          </div>

          <div>
            <FieldLabel>Primary brand color</FieldLabel>
            <div className="flex items-center gap-4">
              <input type="color" defaultValue="#fd7e14" style={{ width: 60, height: 40, border: '2px solid var(--cs-ink)' }} />
              <input type="text" defaultValue="#fd7e14" style={inputStyle} />
            </div>
          </div>

          <div>
            <FieldLabel>Platform name</FieldLabel>
            <input defaultValue="Wanzami" style={inputStyle} />
          </div>

          <div>
            <FieldLabel>Tagline</FieldLabel>
            <input defaultValue="Your Premier Nigerian Streaming Platform" style={inputStyle} />
          </div>

          <CsButton variant="rust">
            <span className="inline-flex items-center gap-2">
              <Save className="w-3.5 h-3.5" />
              Save branding
            </span>
          </CsButton>
        </Section>

        {/* Payment Configuration */}
        <Section id="payment" title="Payment configuration" open={openSection === 'payment'} onToggle={toggle}>
          <div>
            <FieldLabel>Payment provider</FieldLabel>
            <div className="p-3" style={{ border: '1.5px solid var(--cs-line)', color: 'var(--cs-ink)' }}>
              Flutterwave (Global)
            </div>
          </div>

          <div>
            <FieldLabel>Currency</FieldLabel>
            <div className="p-3" style={{ border: '1.5px solid var(--cs-line)', color: 'var(--cs-muted)' }}>
              Auto (based on viewer country)
            </div>
          </div>

          <div>
            <FieldLabel>Public API key</FieldLabel>
            <input type="password" placeholder="pk_live_xxxxxxxxxxxxx" style={inputStyle} />
          </div>

          <div>
            <FieldLabel>Secret API key</FieldLabel>
            <input type="password" placeholder="sk_live_xxxxxxxxxxxxx" style={inputStyle} />
          </div>

          <div className="p-4" style={{ border: '1.5px solid var(--cs-line)', background: 'var(--cs-panel)' }}>
            <p className="text-sm" style={{ color: 'var(--cs-ink)' }}>
              <strong style={{ color: 'var(--cs-rust)' }}>Note:</strong> PPV pricing is converted automatically based on viewer location and processed via Flutterwave.
            </p>
          </div>

          <CsButton variant="rust">
            <span className="inline-flex items-center gap-2">
              <Save className="w-3.5 h-3.5" />
              Save payment settings
            </span>
          </CsButton>
        </Section>

        {/* Streaming Settings */}
        <Section id="streaming" title="Streaming settings" open={openSection === 'streaming'} onToggle={toggle}>
          <div>
            <FieldLabel>Video quality</FieldLabel>
            <select defaultValue="auto" style={selectStyle}>
              <option value="auto">Auto (Adaptive)</option>
              <option value="1080p">1080p HD</option>
              <option value="720p">720p HD</option>
              <option value="480p">480p SD</option>
            </select>
          </div>

          <div className="flex items-center justify-between p-4" style={{ border: '1.5px solid var(--cs-line)', background: 'var(--cs-panel)' }}>
            <div>
              <FieldLabel>Enable download</FieldLabel>
              <p className="text-sm mt-1" style={{ color: 'var(--cs-muted)' }}>Allow users to download content</p>
            </div>
            <input type="checkbox" style={{ width: 18, height: 18 }} />
          </div>

          <div className="flex items-center justify-between p-4" style={{ border: '1.5px solid var(--cs-line)', background: 'var(--cs-panel)' }}>
            <div>
              <FieldLabel>Autoplay next episode</FieldLabel>
              <p className="text-sm mt-1" style={{ color: 'var(--cs-muted)' }}>Automatically play next episode</p>
            </div>
            <input type="checkbox" defaultChecked style={{ width: 18, height: 18 }} />
          </div>

          <div>
            <FieldLabel>Max concurrent streams</FieldLabel>
            <input type="number" defaultValue={3} style={inputStyle} />
          </div>

          <CsButton variant="rust">
            <span className="inline-flex items-center gap-2">
              <Save className="w-3.5 h-3.5" />
              Save streaming settings
            </span>
          </CsButton>
        </Section>

        {/* Content Rules */}
        <Section id="content" title="Content rules" open={openSection === 'content'} onToggle={toggle}>
          <div className="flex items-center justify-between p-4" style={{ border: '1.5px solid var(--cs-line)', background: 'var(--cs-panel)' }}>
            <div>
              <FieldLabel>Age verification required</FieldLabel>
              <p className="text-sm mt-1" style={{ color: 'var(--cs-muted)' }}>Require age verification for 18+ content</p>
            </div>
            <input type="checkbox" defaultChecked style={{ width: 18, height: 18 }} />
          </div>

          <div className="flex items-center justify-between p-4" style={{ border: '1.5px solid var(--cs-line)', background: 'var(--cs-panel)' }}>
            <div>
              <FieldLabel>Content warnings</FieldLabel>
              <p className="text-sm mt-1" style={{ color: 'var(--cs-muted)' }}>Display content warnings before playback</p>
            </div>
            <input type="checkbox" defaultChecked style={{ width: 18, height: 18 }} />
          </div>

          <div>
            <FieldLabel>Restricted keywords</FieldLabel>
            <textarea placeholder="Enter restricted keywords, one per line" style={{ ...inputStyle, resize: 'vertical' }} rows={4} />
          </div>

          <CsButton variant="rust">
            <span className="inline-flex items-center gap-2">
              <Save className="w-3.5 h-3.5" />
              Save content rules
            </span>
          </CsButton>
        </Section>

        {/* SEO & Meta */}
        <Section id="seo" title="SEO & meta info" open={openSection === 'seo'} onToggle={toggle}>
          <div>
            <FieldLabel>Meta title</FieldLabel>
            <input defaultValue="Wanzami - Nigerian Streaming Platform" style={inputStyle} />
          </div>

          <div>
            <FieldLabel>Meta description</FieldLabel>
            <textarea
              defaultValue="Watch the best of Nigerian cinema and series. Stream movies, TV shows, and exclusive content on Wanzami."
              style={{ ...inputStyle, resize: 'vertical' }}
              rows={3}
            />
          </div>

          <div>
            <FieldLabel>Keywords</FieldLabel>
            <input defaultValue="nigerian movies, nollywood, streaming, ppv, african cinema" style={inputStyle} />
          </div>

          <CsButton variant="rust">
            <span className="inline-flex items-center gap-2">
              <Save className="w-3.5 h-3.5" />
              Save SEO settings
            </span>
          </CsButton>
        </Section>

        {/* Email Templates */}
        <Section id="email" title="Email templates" open={openSection === 'email'} onToggle={toggle}>
          <div>
            <FieldLabel>Welcome email template</FieldLabel>
            <textarea placeholder="Welcome to Wanzami! ..." style={{ ...inputStyle, resize: 'vertical' }} rows={4} />
          </div>

          <div>
            <FieldLabel>Purchase confirmation template</FieldLabel>
            <textarea placeholder="Thank you for your purchase..." style={{ ...inputStyle, resize: 'vertical' }} rows={4} />
          </div>

          <div>
            <FieldLabel>Password reset template</FieldLabel>
            <textarea placeholder="Reset your password..." style={{ ...inputStyle, resize: 'vertical' }} rows={4} />
          </div>

          <CsButton variant="rust">
            <span className="inline-flex items-center gap-2">
              <Save className="w-3.5 h-3.5" />
              Save email templates
            </span>
          </CsButton>
        </Section>

        {/* Team Members & Permissions */}
        <Section id="team" title="Team members & permissions" open={openSection === 'team'} onToggle={toggle}>
          <TeamManagement />
        </Section>

        {/* System Logs */}
        <Section id="logs" title="System logs" open={openSection === 'logs'} onToggle={toggle}>
          <div className="p-3" style={{ border: '1.5px solid var(--cs-line)', background: 'var(--cs-panel)' }}>
            <div className="flex items-center justify-between mb-1">
              <span className="cs-mono text-xs" style={{ color: 'var(--cs-muted)' }}>2024-11-23 14:32:15</span>
              <CsTag label="Success" tone="good" />
            </div>
            <p className="text-sm" style={{ color: 'var(--cs-ink)' }}>Admin user logged in from 192.168.1.1</p>
          </div>

          <div className="p-3" style={{ border: '1.5px solid var(--cs-line)', background: 'var(--cs-panel)' }}>
            <div className="flex items-center justify-between mb-1">
              <span className="cs-mono text-xs" style={{ color: 'var(--cs-muted)' }}>2024-11-23 13:15:42</span>
              <CsTag label="Info" tone="neutral" />
            </div>
            <p className="text-sm" style={{ color: 'var(--cs-ink)' }}>New movie "The King's Legacy" published</p>
          </div>

          <div className="p-3" style={{ border: '1.5px solid var(--cs-line)', background: 'var(--cs-panel)' }}>
            <div className="flex items-center justify-between mb-1">
              <span className="cs-mono text-xs" style={{ color: 'var(--cs-muted)' }}>2024-11-23 12:45:20</span>
              <CsTag label="Warning" tone="pending" />
            </div>
            <p className="text-sm" style={{ color: 'var(--cs-ink)' }}>Payment gateway response time exceeded threshold</p>
          </div>

          <div className="p-3" style={{ border: '1.5px solid var(--cs-line)', background: 'var(--cs-panel)' }}>
            <div className="flex items-center justify-between mb-1">
              <span className="cs-mono text-xs" style={{ color: 'var(--cs-muted)' }}>2024-11-23 11:22:08</span>
              <CsTag label="Error" tone="bad" />
            </div>
            <p className="text-sm" style={{ color: 'var(--cs-ink)' }}>Failed payment attempt for transaction TXN-2024112303</p>
          </div>
        </Section>
      </CsBox>
    </div>
  );
}
