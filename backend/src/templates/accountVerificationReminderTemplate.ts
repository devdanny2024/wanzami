import { colors, displayFont, monoFont, wrapCallSheetEmail } from "./callSheetEmail.js";

export function buildAccountVerificationReminderEmail(params: {
  userName?: string | null;
  verifyUrl: string;
}) {
  const { userName, verifyUrl } = params;
  const name = userName || "there";

  const bodyHtml = `
    <div style="margin:18px 0 4px;font-family:${monoFont};font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:${colors.rust};">Scene 01 &mdash; Finish Signing Up</div>
    <div style="font-family:${displayFont};font-weight:700;text-transform:uppercase;font-size:30px;line-height:1.05;color:${colors.ink};margin:2px 0 14px;">Almost there, ${name}.</div>
    <p style="margin:0 0 24px;font-size:14px;line-height:1.6;color:${colors.ink};">You started creating a Wanzami account but never confirmed your email. One click and you're in.</p>

    <table role="presentation" cellspacing="0" cellpadding="0" style="margin:0 0 8px;">
      <tr>
        <td style="background:${colors.rust};box-shadow:4px 4px 0 ${colors.ink};">
          <a href="${verifyUrl}" style="display:inline-block;padding:14px 30px;font-family:${monoFont};font-size:13px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:${colors.paper};text-decoration:none;">Verify Email</a>
        </td>
      </tr>
    </table>

    <p style="margin:24px 0 0;font-size:12px;line-height:1.6;color:${colors.muted};">If the button doesn't work, copy this link into your browser:<br /><a href="${verifyUrl}" style="color:${colors.rust};">${verifyUrl}</a></p>

    <p style="margin:24px 0 0;font-size:14px;line-height:1.6;color:${colors.ink};">See you soon,<br /><span style="font-family:${displayFont};font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">The Wanzami Team</span></p>`;

  return {
    subject: "Finish setting up your Wanzami account",
    html: wrapCallSheetEmail({
      pageTitle: "Verify your Wanzami account",
      docLabel: "Account Setup",
      bodyHtml,
      footerNote: "You're receiving this because an account was started with this email on Wanzami.",
    }),
  };
}
