import { colors, displayFont, monoFont, formatLongDate, frontendBase, wrapCallSheetEmail } from "./callSheetEmail.js";

type Rec = {
  title: string;
  posterUrl?: string | null;
  priceNaira?: number | null;
  url: string;
};

const daysRemaining = (accessExpiresAt: Date) =>
  Math.max(1, Math.ceil((accessExpiresAt.getTime() - Date.now()) / (24 * 60 * 60 * 1000)));

export function buildPpvThankYouEmail(params: {
  userName?: string | null;
  purchasedTitle: { id: string | number | bigint; name: string; posterUrl?: string | null };
  accessExpiresAt: Date;
  recs?: Rec[];
}) {
  const { userName, purchasedTitle, accessExpiresAt, recs = [] } = params;
  const name = userName || "there";
  const days = daysRemaining(accessExpiresAt);
  const expiryLabel = formatLongDate(accessExpiresAt);
  const watchUrl = `${frontendBase}/title/${purchasedTitle.id}`;

  const recCellWidth = Math.floor(100 / Math.max(recs.length, 1));
  const recsHtml = recs
    .map(
      (r) => `
        <td width="${recCellWidth}%" style="padding:0 6px;vertical-align:top;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border:1.5px solid ${colors.ink};">
            ${
              r.posterUrl
                ? `<tr><td><img src="${r.posterUrl}" alt="${r.title}" width="100%" style="display:block;width:100%;height:auto;" /></td></tr>`
                : ""
            }
            <tr>
              <td style="padding:10px 10px 2px;font-family:${displayFont};font-size:15px;color:${colors.ink};">${r.title}</td>
            </tr>
            <tr>
              <td style="padding:0 10px 12px;font-family:${monoFont};font-size:11px;color:${colors.muted};">
                ${r.priceNaira ? `&#8358;${r.priceNaira.toLocaleString("en-NG")} &middot; ` : ""}<a href="${r.url}" style="color:${colors.rust};text-decoration:none;font-weight:700;">VIEW &rarr;</a>
              </td>
            </tr>
          </table>
        </td>`,
    )
    .join("");

  const recsSection =
    recs.length > 0
      ? `
        <div style="margin:30px 0 6px;font-family:${monoFont};font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:${colors.rust};">Scene 02 &mdash; More To Watch</div>
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:10px 0 0;">
          <tr>${recsHtml}</tr>
        </table>`
      : "";

  const bodyHtml = `
    <div style="margin:18px 0 4px;font-family:${monoFont};font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:${colors.rust};">Scene 01 &mdash; Your Ticket</div>
    <div style="font-family:${displayFont};font-weight:700;text-transform:uppercase;font-size:30px;line-height:1.05;color:${colors.ink};margin:2px 0 14px;">You're in, ${name}.</div>
    <p style="margin:0 0 20px;font-size:14px;line-height:1.6;color:${colors.ink};">Your purchase of <strong>${purchasedTitle.name}</strong> is confirmed and ready whenever you are.</p>

    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 18px;border:2.5px solid ${colors.ink};box-shadow:5px 5px 0 ${colors.rust};">
      ${
        purchasedTitle.posterUrl
          ? `<tr><td><img src="${purchasedTitle.posterUrl}" alt="${purchasedTitle.name}" width="100%" style="display:block;width:100%;height:auto;" /></td></tr>`
          : ""
      }
      <tr>
        <td style="padding:16px 18px 18px;background:${colors.paper};">
          <div style="font-family:${displayFont};font-weight:700;text-transform:uppercase;font-size:22px;color:${colors.ink};margin:0 0 10px;">${purchasedTitle.name}</div>
          <table role="presentation" cellspacing="0" cellpadding="0"><tr>
            <td style="background:${colors.ink};padding:6px 10px;">
              <span style="font-family:${monoFont};font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:${colors.paper};">${days} day${days === 1 ? "" : "s"} of access &middot; until ${expiryLabel}</span>
            </td>
          </tr></table>
        </td>
      </tr>
    </table>

    <table role="presentation" cellspacing="0" cellpadding="0" style="margin:0 0 8px;">
      <tr>
        <td style="background:${colors.rust};box-shadow:4px 4px 0 ${colors.ink};">
          <a href="${watchUrl}" style="display:inline-block;padding:14px 30px;font-family:${monoFont};font-size:13px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:${colors.paper};text-decoration:none;">Watch Now</a>
        </td>
      </tr>
    </table>

    ${recsSection}

    <p style="margin:30px 0 0;font-size:14px;line-height:1.6;color:${colors.ink};">Enjoy the movie,<br /><span style="font-family:${displayFont};font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">The Wanzami Team</span></p>`;

  return {
    subject: `${purchasedTitle.name} is ready to watch`,
    html: wrapCallSheetEmail({
      pageTitle: "Your Wanzami purchase",
      docLabel: "Purchase Receipt",
      bodyHtml,
      footerNote: "You're receiving this because you made a purchase on Wanzami.",
    }),
  };
}
