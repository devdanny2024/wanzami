import { useState } from 'react';
import { Flag, MessageSquare, Shield, CheckCircle, XCircle } from 'lucide-react';
import { CsBox, CsButton, CsPageHeader, CsSlug, CsStat, CsTag } from './cs/kit';

const flaggedComments = [
  {
    id: 1,
    user: 'Anonymous User',
    movie: 'The King\'s Legacy',
    comment: 'This movie is terrible and waste of time',
    reason: 'Spam',
    reportedBy: 'User123',
    date: '2024-11-23 10:30',
    status: 'Pending',
  },
  {
    id: 2,
    user: 'MovieFan456',
    movie: 'Lagos Streets',
    comment: 'Inappropriate content warning needed',
    reason: 'Inappropriate Content',
    reportedBy: 'User456',
    date: '2024-11-23 09:15',
    status: 'Pending',
  },
  {
    id: 3,
    user: 'CriticPro',
    movie: 'Coming Home',
    comment: 'Spoiler alert: the ending is predictable',
    reason: 'Spoilers',
    reportedBy: 'User789',
    date: '2024-11-22 18:45',
    status: 'Pending',
  },
];

const reviews = [
  {
    id: 1,
    user: 'Chukwudi Okonkwo',
    movie: 'The King\'s Legacy',
    rating: 5,
    review: 'Outstanding performance by the lead actors. A must-watch!',
    date: '2024-11-23',
    status: 'Approved',
  },
  {
    id: 2,
    user: 'Amara Johnson',
    movie: 'Lagos Streets',
    rating: 4,
    review: 'Great cinematography and compelling storyline.',
    date: '2024-11-22',
    status: 'Approved',
  },
  {
    id: 3,
    user: 'Emeka Nwachukwu',
    movie: 'Coming Home',
    rating: 3,
    review: 'Good movie but pacing could be better.',
    date: '2024-11-21',
    status: 'Pending',
  },
];

const suspiciousActivity = [
  {
    id: 1,
    user: 'SuspiciousUser123',
    activity: 'Multiple failed payment attempts',
    severity: 'High',
    date: '2024-11-23 11:20',
  },
  {
    id: 2,
    user: 'SpamBot456',
    activity: 'Posting identical comments on multiple movies',
    severity: 'Medium',
    date: '2024-11-23 10:05',
  },
  {
    id: 3,
    user: 'AccountSharer789',
    activity: 'Login from 5+ different locations within 1 hour',
    severity: 'High',
    date: '2024-11-22 22:30',
  },
];

const TABS = [
  { key: 'comments', label: 'Flagged comments' },
  { key: 'reviews', label: 'Reviews' },
  { key: 'activity', label: 'Suspicious activity' },
] as const;

type TabKey = (typeof TABS)[number]['key'];

function ToggleRow({
  label,
  hint,
  defaultChecked = false,
}: {
  label: string;
  hint: string;
  defaultChecked?: boolean;
}) {
  const [checked, setChecked] = useState(defaultChecked);
  return (
    <div
      className="flex items-center justify-between p-4"
      style={{ border: '1.5px solid var(--cs-line)', background: 'var(--cs-panel)' }}
    >
      <div>
        <p className="cs-mono text-xs font-bold uppercase" style={{ color: 'var(--cs-ink)' }}>{label}</p>
        <p className="text-sm mt-1" style={{ color: 'var(--cs-muted)' }}>{hint}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => setChecked((c) => !c)}
        className="transition-colors"
        style={{
          width: 40,
          height: 22,
          border: '2px solid var(--cs-ink)',
          background: checked ? 'var(--cs-brand)' : 'var(--cs-paper)',
          position: 'relative',
          flexShrink: 0,
        }}
      >
        <span
          className="transition-transform"
          style={{
            position: 'absolute',
            top: 1,
            left: checked ? 20 : 1,
            width: 16,
            height: 16,
            background: 'var(--cs-ink)',
          }}
        />
      </button>
    </div>
  );
}

export function Moderation() {
  const [activeTab, setActiveTab] = useState<TabKey>('comments');

  return (
    <div className="space-y-8">
      <CsPageHeader
        title="The review desk"
        chip="Moderation"
        slug="Comments, reviews, and reports"
      />

      {/* Moderation Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <CsStat label="Pending reports" value="23" hint="Awaiting review" />
        <CsStat label="Total comments" value="8,342" hint="+12.3% this week" />
        <CsStat label="Suspicious activity" value="7" hint="Requires attention" />
        <CsStat label="Auto-filtered" value="156" hint="By profanity filter" />
      </div>

      {/* Content Tabs */}
      <CsBox className="p-5">
        <div className="flex flex-wrap gap-2 pb-4" style={{ borderBottom: '2.5px solid var(--cs-ink)' }}>
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className="cs-mono font-bold uppercase transition-colors"
              style={{
                fontSize: 11,
                letterSpacing: '0.07em',
                padding: '8px 14px',
                border: '2px solid var(--cs-ink)',
                background: activeTab === tab.key ? 'var(--cs-ink)' : 'var(--cs-paper)',
                color: activeTab === tab.key ? '#fff' : 'var(--cs-ink)',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'comments' && (
          <div className="space-y-4 mt-4">
            {flaggedComments.map((comment) => (
              <div key={comment.id} className="p-4" style={{ border: '1.5px solid var(--cs-line)' }}>
                <div className="flex items-start justify-between mb-3 gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="cs-mono text-xs font-bold uppercase" style={{ color: 'var(--cs-ink)' }}>{comment.user}</span>
                      <CsTag label={`on ${comment.movie}`} tone="neutral" />
                    </div>
                    <p className="cs-mono text-xs" style={{ color: 'var(--cs-muted)' }}>{comment.date}</p>
                  </div>
                  <CsTag label={comment.reason} tone="bad" />
                </div>

                <div className="mb-3 p-3" style={{ background: 'var(--cs-panel)', border: '1.5px solid var(--cs-line)' }}>
                  <p className="text-sm" style={{ color: 'var(--cs-ink)' }}>{comment.comment}</p>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <p className="cs-mono text-xs" style={{ color: 'var(--cs-muted)' }}>Reported by: {comment.reportedBy}</p>
                  <div className="flex gap-2">
                    <CsButton variant="outline">
                      <span className="inline-flex items-center gap-2">
                        <CheckCircle className="w-3.5 h-3.5" />
                        Approve
                      </span>
                    </CsButton>
                    <CsButton variant="rust">
                      <span className="inline-flex items-center gap-2">
                        <XCircle className="w-3.5 h-3.5" />
                        Remove
                      </span>
                    </CsButton>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'reviews' && (
          <div className="space-y-4 mt-4">
            {reviews.map((review) => (
              <div key={review.id} className="p-4" style={{ border: '1.5px solid var(--cs-line)' }}>
                <div className="flex items-start justify-between mb-3 gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="cs-mono text-xs font-bold uppercase" style={{ color: 'var(--cs-ink)' }}>{review.user}</span>
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <span
                            key={i}
                            className="text-sm"
                            style={{ color: i < review.rating ? 'var(--cs-brand)' : 'var(--cs-line)' }}
                          >
                            ★
                          </span>
                        ))}
                      </div>
                    </div>
                    <p className="cs-mono text-xs" style={{ color: 'var(--cs-muted)' }}>{review.movie} · {review.date}</p>
                  </div>
                  <CsTag label={review.status} tone={review.status === 'Approved' ? 'good' : 'pending'} />
                </div>

                <div className="mb-3 p-3" style={{ background: 'var(--cs-panel)', border: '1.5px solid var(--cs-line)' }}>
                  <p className="text-sm" style={{ color: 'var(--cs-ink)' }}>{review.review}</p>
                </div>

                {review.status === 'Pending' && (
                  <div className="flex gap-2 justify-end">
                    <CsButton variant="outline">
                      <span className="inline-flex items-center gap-2">
                        <CheckCircle className="w-3.5 h-3.5" />
                        Approve
                      </span>
                    </CsButton>
                    <CsButton variant="rust">
                      <span className="inline-flex items-center gap-2">
                        <XCircle className="w-3.5 h-3.5" />
                        Reject
                      </span>
                    </CsButton>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {activeTab === 'activity' && (
          <div className="space-y-4 mt-4">
            {suspiciousActivity.map((activity) => (
              <div key={activity.id} className="p-4" style={{ border: '1.5px solid var(--cs-line)' }}>
                <div className="flex items-start justify-between mb-3 gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="cs-mono text-xs font-bold uppercase" style={{ color: 'var(--cs-ink)' }}>{activity.user}</span>
                      <CsTag label={activity.severity} tone={activity.severity === 'High' ? 'bad' : 'pending'} />
                    </div>
                    <p className="cs-mono text-xs" style={{ color: 'var(--cs-muted)' }}>{activity.date}</p>
                  </div>
                </div>

                <div className="mb-3 p-3" style={{ background: 'var(--cs-panel)', border: '1.5px solid var(--cs-line)' }}>
                  <p className="text-sm" style={{ color: 'var(--cs-ink)' }}>{activity.activity}</p>
                </div>

                <div className="flex gap-2 justify-end">
                  <CsButton variant="outline">Investigate</CsButton>
                  <CsButton variant="rust">Suspend account</CsButton>
                </div>
              </div>
            ))}
          </div>
        )}
      </CsBox>

      {/* Profanity Filter */}
      <CsBox className="p-5">
        <CsSlug>Auto-filter settings</CsSlug>
        <p className="text-sm mt-1 mb-4" style={{ color: 'var(--cs-muted)' }}>Configure automatic content moderation</p>
        <div className="space-y-3">
          <ToggleRow
            label="Profanity filter"
            hint="Automatically filter profane language"
            defaultChecked
          />
          <ToggleRow
            label="Spam detection"
            hint="Detect and flag repetitive comments"
            defaultChecked
          />
          <ToggleRow
            label="Auto-approve reviews"
            hint="Automatically approve reviews from trusted users"
          />
        </div>
      </CsBox>
    </div>
  );
}
