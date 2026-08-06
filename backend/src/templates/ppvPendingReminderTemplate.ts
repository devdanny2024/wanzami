import { colors, displayFont, monoFont, frontendBase, wrapCallSheetEmail } from "./callSheetEmail.js";

export function buildPpvPendingReminderEmail(params: {
  userName?: string | null;
  title: {
    id: string | number | bigint;
    name: string;
    posterUrl?: string | null;
    ppvPriceNaira?: number | null;
    ppvCurrency?: string | null;
  };
}) {
  const { userName, title } = params;
  const name = userName || "there";
  const watchUrl = `${frontendBase}/title/${title.id}`;
  const priceLabel =
    title.ppvPriceNaira != null
      ? `${title.ppvCurrency === "NGN" || !title.ppvCurrency ? "₦" : title.ppvCurrency + " "}${title.ppvPriceNaira.toLocaleString("en-NG")}`
      : null;

  const bodyHtml = `
    <div style="margin:18px 0 4px;font-family:${monoFont};font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:${colors.rust};">Scene 01 &mdash; Unfinished Business</div>
    <div style="font-family:${displayFont};font-weight:700;text-transform:uppercase;font-size:30px;line-height:1.05;color:${colors.ink};margin:2px 0 14px;">Still thinking it over, ${name}?</div>
    <p style="margin:0 0 20px;font-size:14px;line-height:1.6;color:${colors.ink};">You started to grab <strong>${title.name}</strong> but didn't finish checking out. It's still waiting for you.</p>

    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 18px;border:2.5px solid ${colors.ink};box-shadow:5px 5px 0 ${colors.brand};">
      ${
        title.posterUrl
          ? `<tr><td><img src="${title.posterUrl}" alt="${title.name}" width="100%" style="display:block;width:100%;height:auto;" /></td></tr>`
          : ""
      }
      <tr>
        <td style="padding:16px 18px 18px;background:${colors.paper};">
          <div style="font-family:${displayFont};font-weight:700;text-transform:uppercase;font-size:22px;color:${colors.ink};margin:0 0 10px;">${title.name}</div>
          ${
            priceLabel
              ? `<table role="presentation" cellspacing="0" cellpadding="0"><tr>
                  <td style="background:${colors.ink};padding:6px 10px;">
                    <span style="font-family:${monoFont};font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:${colors.paper};">${priceLabel} &middot; still available</span>
                  </td>
                </tr></table>`
              : ""
          }
        </td>
      </tr>
    </table>

    <table role="presentation" cellspacing="0" cellpadding="0" style="margin:0 0 8px;">
      <tr>
        <td style="background:${colors.rust};box-shadow:4px 4px 0 ${colors.ink};">
          <a href="${watchUrl}" style="display:inline-block;padding:14px 30px;font-family:${monoFont};font-size:13px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:${colors.paper};text-decoration:none;">Finish Checkout</a>
        </td>
      </tr>
    </table>

    <p style="margin:30px 0 0;font-size:14px;line-height:1.6;color:${colors.ink};">See you at the movies,<br /><span style="font-family:${displayFont};font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">The Wanzami Team</span></p>`;

  return {
    subject: `You left ${title.name} in your cart`,
    html: wrapCallSheetEmail({
      pageTitle: "Finish your Wanzami purchase",
      docLabel: "Checkout Reminder",
      bodyHtml,
      footerNote: "You're receiving this because you started a purchase on Wanzami.",
    }),
  };
}
