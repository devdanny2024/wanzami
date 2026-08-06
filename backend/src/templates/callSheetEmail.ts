// Shared "Call Sheet" brand chrome for transactional emails — same tokens as
// app/globals.css (--color-cs-*) and every printed Call Sheet document.
// Email clients strip custom @font-face, so the display/mono stacks fall
// back the same way the PDF letterheads do: Arial Narrow/Impact
// approximates Bebas Neue, Courier New approximates Space Mono.

export const frontendBase =
  process.env.APP_ORIGIN ||
  process.env.FRONTEND_URL ||
  "https://www.wanzami.tv";

export const logoUrl = `${frontendBase}/wanzami-logo.png`;

export const colors = {
  paper: "#f2ead9",
  panel: "#f7f1e3",
  ink: "#161310",
  rust: "#d1490f",
  brand: "#fd7e14",
  muted: "#6b5f4d",
  line: "#d9cfba",
};

// Single-quoted: these get embedded inside double-quoted style="" attributes
// throughout these templates, so double-quoted font names would close the
// attribute early and silently drop every style after them.
export const displayFont = `'Arial Narrow','Helvetica Neue Condensed',Impact,sans-serif`;
export const monoFont = `'Courier New',Courier,monospace`;
export const bodyFont = `'Segoe UI',Helvetica,Arial,sans-serif`;

export const formatLongDate = (date: Date) =>
  date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

const sprocketRow = () => {
  const holes = Array.from({ length: 34 })
    .map(
      () =>
        `<td width="9" style="padding:0 3px;"><div style="width:9px;height:9px;background:${colors.paper};"></div></td>`,
    )
    .join("");
  return `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:${colors.ink};">
      <tr><td style="padding:7px 14px;"><table role="presentation" cellspacing="0" cellpadding="0"><tr>${holes}</tr></table></td></tr>
    </table>`;
};

/**
 * Wraps a template's body content (the inner "Scene" sections) in the full
 * Call Sheet letterhead shell: sprocket strips, logo + wordmark + document
 * ref block, ink card border with a hard offset shadow, and a mono footer.
 */
export function wrapCallSheetEmail(params: {
  pageTitle: string;
  docLabel: string;
  bodyHtml: string;
  footerNote: string;
}) {
  const { pageTitle, docLabel, bodyHtml, footerNote } = params;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${pageTitle}</title>
</head>
<body style="margin:0;padding:0;background:${colors.paper};font-family:${bodyFont};color:${colors.ink};">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:${colors.paper};padding:32px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;background:${colors.panel};border:2.5px solid ${colors.ink};box-shadow:7px 7px 0 ${colors.ink};">
          <tr><td>${sprocketRow()}</td></tr>

          <tr>
            <td style="padding:20px 28px 4px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td width="46" style="vertical-align:middle;">
                    <table role="presentation" cellspacing="0" cellpadding="0" style="width:40px;height:40px;background:${colors.ink};border:2px solid ${colors.ink};">
                      <tr><td align="center" style="vertical-align:middle;"><img src="${logoUrl}" alt="Wanzami" width="26" style="display:block;" /></td></tr>
                    </table>
                  </td>
                  <td style="vertical-align:middle;padding-left:10px;">
                    <div style="font-family:${displayFont};font-weight:700;text-transform:uppercase;font-size:19px;color:${colors.ink};line-height:1;">Wanzami Entertainment</div>
                    <div style="font-family:${monoFont};font-size:9px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:${colors.muted};margin-top:3px;">Lagos, Nigeria</div>
                  </td>
                  <td align="right" style="vertical-align:middle;font-family:${monoFont};font-size:9px;letter-spacing:1px;text-transform:uppercase;color:${colors.muted};line-height:1.7;">
                    Document &middot; <strong style="color:${colors.ink};">${docLabel}</strong><br />
                    Issued &middot; <strong style="color:${colors.ink};">${formatLongDate(new Date()).toUpperCase()}</strong>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding:14px 28px 0;border-top:2px solid ${colors.ink};">
              ${bodyHtml}
            </td>
          </tr>

          <tr>
            <td style="padding:20px 28px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-top:2px solid ${colors.ink};padding-top:12px;">
                <tr>
                  <td style="font-family:${monoFont};font-size:9px;letter-spacing:1px;text-transform:uppercase;color:${colors.muted};">${footerNote}</td>
                  <td align="right" style="font-family:${monoFont};font-size:9px;letter-spacing:1px;text-transform:uppercase;"><a href="${frontendBase}/contact" style="color:${colors.rust};text-decoration:none;">Help Centre</a></td>
                </tr>
              </table>
            </td>
          </tr>

          <tr><td>${sprocketRow()}</td></tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`.trim();
}
