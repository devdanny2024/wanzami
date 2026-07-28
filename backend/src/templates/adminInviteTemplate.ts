// Admin invitation email — Call Sheet styling, table-based, inline styles only.
// No external CSS, no web fonts, no border-radius, no box-shadow. The hard
// offset shadow is faked with a nested ink-coloured cell, the same trick the
// movie campaign template uses.

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: "Super Admin",
  CONTENT_MANAGER: "Content Manager",
  BLOG_EDITOR: "Blog Editor",
  MODERATOR: "Moderator",
  SUPPORT: "Support",
  FINANCE: "Finance",
  ANALYTICS: "Analytics",
  OPS: "Ops",
};

const ROLE_BLURBS: Record<string, string> = {
  SUPER_ADMIN:
    "Full control of the platform: content, revenue, users, roles and settings.",
  CONTENT_MANAGER:
    "Upload and manage movies, series and live events across the catalogue.",
  BLOG_EDITOR: "Write, edit and publish posts on the Wanzami blog.",
  MODERATOR: "Review reports, moderate comments and keep the platform clean.",
  SUPPORT: "Answer support tickets and help viewers with their accounts.",
  FINANCE: "Track payments, payouts, invoices and pay-per-view revenue.",
  ANALYTICS: "Read viewership, engagement and revenue reporting.",
  OPS: "Run day-to-day operations: uploads, transcoding and platform health.",
};

export const roleLabel = (role: string) =>
  ROLE_LABELS[role] ?? role.replace(/_/g, " ");

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const sprocketRow = () =>
  Array.from({ length: 16 })
    .map(
      () =>
        '<td width="6.25%" align="center"><div style="width:8px;height:11px;background:#f2ead9;"></div></td>'
    )
    .join("");

const formatExpiry = (expiresAt: Date) =>
  expiresAt.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });

export const adminInviteTemplate = (params: {
  email: string;
  role: string;
  acceptUrl: string;
  expiresAt: Date;
  invitedByName?: string | null;
  invitedByEmail?: string | null;
  adminOrigin: string;
}) => {
  const label = roleLabel(params.role);
  const blurb =
    ROLE_BLURBS[params.role] ?? "Access to the Wanzami admin dashboard.";
  const inviter =
    params.invitedByName?.trim() ||
    params.invitedByEmail?.trim() ||
    "The Wanzami team";
  const inviterLine = params.invitedByEmail
    ? `${escapeHtml(inviter)} (${escapeHtml(params.invitedByEmail)})`
    : escapeHtml(inviter);
  const url = escapeHtml(params.acceptUrl);
  const expiry = formatExpiry(params.expiresAt);

  return `<!DOCTYPE html>
<html lang="en">
<body style="margin:0;padding:0;background:#161310;font-family:Arial,Helvetica,sans-serif;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(
    inviter
  )} invited you to the Wanzami admin dashboard as ${escapeHtml(label)}.</div>
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
    <tr>
      <td align="center" style="padding:32px 12px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="max-width:600px;background:#ffffff;border:3px solid #161310;">

          <!-- Sprocket strip -->
          <tr>
            <td style="background:#161310;padding:10px 20px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"><tr>
                ${sprocketRow()}
              </tr></table>
            </td>
          </tr>

          <!-- Wordmark -->
          <tr>
            <td style="padding:24px 28px 0 28px;">
              <div style="font-family:Arial Black,Arial,Helvetica,sans-serif;font-weight:900;font-size:26px;letter-spacing:3px;text-transform:uppercase;color:#161310;">Wanzami</div>
              <div style="margin-top:6px;font-family:'Courier New',Courier,monospace;font-size:11px;letter-spacing:2px;color:#6e6a64;text-transform:uppercase;">Production office &middot; Admin dashboard</div>
            </td>
          </tr>

          <!-- Sticker -->
          <tr>
            <td style="padding:18px 28px 0 28px;">
              <span style="display:inline-block;background:#fd7e14;color:#161310;font-weight:bold;font-size:11px;letter-spacing:1px;text-transform:uppercase;padding:6px 14px;">Crew invitation</span>
            </td>
          </tr>

          <!-- Headline -->
          <tr>
            <td style="padding:16px 28px 0 28px;">
              <h1 style="margin:0;font-family:Arial Black,Arial,Helvetica,sans-serif;font-weight:900;font-size:32px;line-height:1.05;letter-spacing:1px;text-transform:uppercase;color:#161310;">You're on the call sheet</h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:16px 28px 0 28px;">
              <p style="margin:0;font-size:15px;line-height:1.6;color:#333333;">
                ${inviterLine} invited you to join the Wanzami admin dashboard.
              </p>
              <p style="margin:14px 0 0 0;font-size:15px;line-height:1.6;color:#333333;">
                Wanzami is an African streaming platform &mdash; movies, series, live events and pay-per-view. The admin dashboard is where the team runs it: the catalogue, the viewers, the revenue.
              </p>
            </td>
          </tr>

          <!-- Role card -->
          <tr>
            <td style="padding:22px 28px 0 28px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"><tr>
                <td style="background:#161310;padding:0 5px 5px 0;">
                  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#f6f6f6;border:3px solid #161310;">
                    <tr>
                      <td style="padding:16px 18px;">
                        <div style="font-family:'Courier New',Courier,monospace;font-size:10px;font-weight:bold;letter-spacing:2px;color:#6e6a64;text-transform:uppercase;">Your role</div>
                        <div style="margin-top:6px;font-family:Arial Black,Arial,Helvetica,sans-serif;font-weight:900;font-size:20px;letter-spacing:1px;text-transform:uppercase;color:#161310;">${escapeHtml(
                          label
                        )}</div>
                        <div style="margin-top:8px;font-size:14px;line-height:1.55;color:#333333;">${escapeHtml(
                          blurb
                        )}</div>
                        <div style="margin-top:14px;border-top:2px dashed #161310;"></div>
                        <div style="margin-top:12px;font-family:'Courier New',Courier,monospace;font-size:11px;line-height:1.7;color:#6e6a64;text-transform:uppercase;letter-spacing:1px;">
                          Account &middot; ${escapeHtml(params.email)}<br/>
                          Invite expires &middot; ${escapeHtml(expiry)}
                        </div>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr></table>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td style="padding:24px 28px 0 28px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
                <td style="background:#161310;padding:0 6px 6px 0;">
                  <a href="${url}" style="display:inline-block;background:#d1490f;color:#ffffff;text-decoration:none;font-weight:bold;font-size:13px;letter-spacing:1px;text-transform:uppercase;padding:14px 28px;border:3px solid #161310;">Accept invitation</a>
                </td>
              </tr></table>
              <p style="margin:14px 0 0 0;font-size:13px;line-height:1.6;color:#6e6a64;">
                You'll pick a name and a password, and then you're straight into the dashboard.
              </p>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding:24px 28px 0 28px;">
              <div style="border-top:2px dashed #161310;"></div>
            </td>
          </tr>

          <!-- Plain link fallback -->
          <tr>
            <td style="padding:18px 28px 0 28px;">
              <div style="font-family:'Courier New',Courier,monospace;font-size:10px;font-weight:bold;letter-spacing:2px;color:#6e6a64;text-transform:uppercase;">If the button doesn't work</div>
              <p style="margin:8px 0 0 0;font-size:13px;line-height:1.6;color:#333333;word-break:break-all;">
                Copy this link into your browser:<br/>
                <a href="${url}" style="color:#d1490f;">${url}</a>
              </p>
              <p style="margin:12px 0 0 0;font-size:13px;line-height:1.6;color:#6e6a64;">
                This invitation expires on ${escapeHtml(
                  expiry
                )}. If it lapses, ask ${escapeHtml(
    inviter
  )} to send a fresh one. If you weren't expecting this, ignore the email &mdash; nothing happens until you accept.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:26px 28px 24px 28px;" align="center">
              <div style="font-family:'Courier New',Courier,monospace;font-size:10px;letter-spacing:1px;color:#6e6a64;text-align:center;">
                Wanzami admin &middot; <a href="${escapeHtml(
                  params.adminOrigin
                )}" style="color:#6e6a64;">${escapeHtml(
    params.adminOrigin.replace(/^https?:\/\//, "")
  )}</a><br/>
                Staff only. Do not forward this email.
              </div>
            </td>
          </tr>

          <!-- Sprocket strip -->
          <tr>
            <td style="background:#161310;padding:10px 20px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"><tr>
                ${sprocketRow()}
              </tr></table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
};
