// Creator portal approval email — same Call Sheet visual language as
// adminInviteTemplate, condensed for a single audience/purpose.

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

export const creatorInviteTemplate = (params: {
  name: string;
  email: string;
  setPasswordUrl: string;
  creatorOrigin: string;
}) => {
  const name = escapeHtml(params.name);
  const url = escapeHtml(params.setPasswordUrl);

  return `<!DOCTYPE html>
<html lang="en">
<body style="margin:0;padding:0;background:#161310;font-family:Arial,Helvetica,sans-serif;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">Your Wanzami creator application was approved. Set your password to get in.</div>
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
    <tr>
      <td align="center" style="padding:32px 12px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="max-width:600px;background:#ffffff;border:3px solid #161310;">

          <tr>
            <td style="background:#161310;padding:10px 20px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"><tr>
                ${sprocketRow()}
              </tr></table>
            </td>
          </tr>

          <tr>
            <td style="padding:24px 28px 0 28px;">
              <div style="font-family:Arial Black,Arial,Helvetica,sans-serif;font-weight:900;font-size:26px;letter-spacing:3px;text-transform:uppercase;color:#161310;">Wanzami</div>
              <div style="margin-top:6px;font-family:'Courier New',Courier,monospace;font-size:11px;letter-spacing:2px;color:#6e6a64;text-transform:uppercase;">Creator portal</div>
            </td>
          </tr>

          <tr>
            <td style="padding:18px 28px 0 28px;">
              <span style="display:inline-block;background:#fd7e14;color:#161310;font-weight:bold;font-size:11px;letter-spacing:1px;text-transform:uppercase;padding:6px 14px;">You're in</span>
            </td>
          </tr>

          <tr>
            <td style="padding:16px 28px 0 28px;">
              <h1 style="margin:0;font-family:Arial Black,Arial,Helvetica,sans-serif;font-weight:900;font-size:32px;line-height:1.05;letter-spacing:1px;text-transform:uppercase;color:#161310;">Your application was approved</h1>
            </td>
          </tr>

          <tr>
            <td style="padding:16px 28px 0 28px;">
              <p style="margin:0;font-size:15px;line-height:1.6;color:#333333;">
                Hi ${name}, your Wanzami creator application is approved. Set a password and you're straight into the dashboard to upload your film.
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding:24px 28px 0 28px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
                <td style="background:#161310;padding:0 6px 6px 0;">
                  <a href="${url}" style="display:inline-block;background:#d1490f;color:#ffffff;text-decoration:none;font-weight:bold;font-size:13px;letter-spacing:1px;text-transform:uppercase;padding:14px 28px;border:3px solid #161310;">Set your password</a>
                </td>
              </tr></table>
            </td>
          </tr>

          <tr>
            <td style="padding:24px 28px 0 28px;">
              <div style="border-top:2px dashed #161310;"></div>
            </td>
          </tr>

          <tr>
            <td style="padding:18px 28px 0 28px;">
              <div style="font-family:'Courier New',Courier,monospace;font-size:10px;font-weight:bold;letter-spacing:2px;color:#6e6a64;text-transform:uppercase;">If the button doesn't work</div>
              <p style="margin:8px 0 0 0;font-size:13px;line-height:1.6;color:#333333;word-break:break-all;">
                Copy this link into your browser:<br/>
                <a href="${url}" style="color:#d1490f;">${url}</a>
              </p>
              <p style="margin:12px 0 0 0;font-size:13px;line-height:1.6;color:#6e6a64;">
                This link expires in 7 days. If it lapses, reply to this email and we'll send a fresh one.
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding:26px 28px 24px 28px;" align="center">
              <div style="font-family:'Courier New',Courier,monospace;font-size:10px;letter-spacing:1px;color:#6e6a64;text-align:center;">
                Wanzami creators &middot; <a href="${escapeHtml(
                  params.creatorOrigin
                )}" style="color:#6e6a64;">${escapeHtml(
    params.creatorOrigin.replace(/^https?:\/\//, "")
  )}</a>
              </div>
            </td>
          </tr>

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
