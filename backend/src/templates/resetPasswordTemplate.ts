export const resetPasswordTemplate = (params: {
  name: string;
  resetUrl: string;
}) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>Reset your password</title>
</head>
<body style="background:#0b0b0c;margin:0;padding:0;font-family:Arial,sans-serif;color:#f5f5f5;">
  <table width="100%" cellspacing="0" cellpadding="0" style="padding:24px 0;">
    <tr>
      <td align="center">
        <table width="520" cellspacing="0" cellpadding="0" style="background:#111;border:1px solid #222;border-radius:12px;padding:32px;">
          <tr>
            <td align="center" style="padding-bottom:24px;">
              <img src="https://assets.wanzami.com/logo.png" alt="Wanzami" width="120" style="display:block;" />
            </td>
          </tr>
          <tr>
            <td style="font-size:20px;font-weight:700;padding-bottom:12px;">Reset your password</td>
          </tr>
          <tr>
            <td style="font-size:14px;line-height:1.6;color:#cfcfcf;padding-bottom:24px;">
              Hi ${params.name || "there"},<br/>
              We received a request to reset your Wanzami password. Click the button below to choose a new one. This link expires in 1 hour.
            </td>
          </tr>
          <tr>
            <td align="center" style="padding-bottom:24px;">
              <a href="${params.resetUrl}" style="background:#fd7e14;color:#fff;text-decoration:none;padding:14px 24px;border-radius:10px;font-weight:700;display:inline-block;">Reset password</a>
            </td>
          </tr>
          <tr>
            <td style="font-size:12px;line-height:1.6;color:#9a9a9a;padding-bottom:16px;">
              If the button doesn't work, copy and paste this link into your browser:<br/>
              <a href="${params.resetUrl}" style="color:#fd7e14;">${params.resetUrl}</a>
            </td>
          </tr>
          <tr>
            <td style="font-size:12px;color:#9a9a9a;">
              If you didn't request a password reset, you can safely ignore this email. Your password will not change.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;
