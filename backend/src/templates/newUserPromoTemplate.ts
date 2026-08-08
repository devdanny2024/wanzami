import { colors, displayFont, monoFont, frontendBase, wrapCallSheetEmail } from "./callSheetEmail.js";

type PromoTitle = {
  id: string | number | bigint;
  name: string;
  posterUrl?: string | null;
  priceNaira?: number | null;
};

export function buildNewUserPromoEmail(params: {
  userName?: string | null;
  titles: PromoTitle[];
}) {
  const { userName, titles } = params;
  const name = userName || "there";
  const browseUrl = `${frontendBase}/movies`;

  const cellWidth = Math.floor(100 / Math.max(Math.min(titles.length, 3), 1));
  const titlesHtml = titles
    .slice(0, 6)
    .map(
      (t, i) => `
        ${i % 3 === 0 ? "<tr>" : ""}
        <td width="${cellWidth}%" style="padding:0 6px 12px;vertical-align:top;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border:1.5px solid ${colors.ink};">
            ${
              t.posterUrl
                ? `<tr><td><img src="${t.posterUrl}" alt="${t.name}" width="100%" style="display:block;width:100%;height:auto;" /></td></tr>`
                : ""
            }
            <tr>
              <td style="padding:10px 10px 2px;font-family:${displayFont};font-size:15px;color:${colors.ink};">${t.name}</td>
            </tr>
            <tr>
              <td style="padding:0 10px 12px;font-family:${monoFont};font-size:11px;color:${colors.muted};">
                ${t.priceNaira ? `&#8358;${t.priceNaira.toLocaleString("en-NG")}` : "Watch now"}
              </td>
            </tr>
          </table>
        </td>
        ${i % 3 === 2 || i === titles.length - 1 ? "</tr>" : ""}`,
    )
    .join("");

  const bodyHtml = `
    <div style="margin:18px 0 4px;font-family:${monoFont};font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:${colors.rust};">Scene 01 &mdash; Tonight's Picks</div>
    <div style="font-family:${displayFont};font-weight:700;text-transform:uppercase;font-size:30px;line-height:1.05;color:${colors.ink};margin:2px 0 14px;">Hey ${name}, pick your first film.</div>
    <p style="margin:0 0 20px;font-size:14px;line-height:1.6;color:${colors.ink};">You joined Wanzami but haven't picked a film yet. Here's what's playing right now, own any of these for 30 days of access, watch whenever you want.</p>

    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 20px;">
      ${titlesHtml}
    </table>

    <table role="presentation" cellspacing="0" cellpadding="0" style="margin:0 0 8px;">
      <tr>
        <td style="background:${colors.rust};box-shadow:4px 4px 0 ${colors.ink};">
          <a href="${browseUrl}" style="display:inline-block;padding:14px 30px;font-family:${monoFont};font-size:13px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:${colors.paper};text-decoration:none;">Browse & Buy</a>
        </td>
      </tr>
    </table>

    <p style="margin:30px 0 0;font-size:14px;line-height:1.6;color:${colors.ink};">See you at the movies,<br /><span style="font-family:${displayFont};font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">The Wanzami Team</span></p>`;

  return {
    subject: "Your first movie night is one tap away",
    html: wrapCallSheetEmail({
      pageTitle: "New on Wanzami",
      docLabel: "Now Playing",
      bodyHtml,
      footerNote: "You're receiving this because you created a Wanzami account.",
    }),
  };
}
