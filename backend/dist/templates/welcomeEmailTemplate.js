export const welcomeEmailTemplate = (params) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>Welcome to Wanzami</title>
</head>
<body style="background:#0b0b0c;margin:0;padding:0;font-family:Arial,sans-serif;color:#f5f5f5;">
  <table width="100%" cellspacing="0" cellpadding="0" style="padding:24px 0;">
    <tr>
      <td align="center">
        <table width="520" cellspacing="0" cellpadding="0" style="background:#111;border:1px solid #222;border-radius:12px;padding:32px;">
          <tr>
            <td align="center" style="padding-bottom:20px;">
              <img src="https://wanzami-bucket.s3.eu-north-1.amazonaws.com/wanzami_assets/wanzami_logo.png" alt="Wanzami" width="120" style="display:block;" />
            </td>
          </tr>
          <tr>
            <td style="font-size:22px;font-weight:700;padding-bottom:12px;">Welcome to the Wanzami family!</td>
          </tr>
          <tr>
            <td style="font-size:14px;line-height:1.6;color:#cfcfcf;padding-bottom:20px;">
              Hi ${params.name || "there"}, we're thrilled to have you. Dive into stories made for us — here are a few to start with.
            </td>
          </tr>
          <tr>
            <td>
              <table width="100%" cellspacing="0" cellpadding="0" style="border-spacing:12px 16px;">
                <tr>
                  <td width="50%" style="background:#191919;border:1px solid #222;border-radius:10px;overflow:hidden;">
                    <img src="https://images.unsplash.com/photo-1713845784782-51b36d805391?auto=format&fit=crop&w=600&q=80" alt="Sacred Pulse" width="100%" style="display:block;" />
                    <div style="padding:10px 12px;font-size:13px;font-weight:700;color:#fd7e14;">Sacred Pulse</div>
                    <div style="padding:0 12px 12px 12px;font-size:12px;color:#b5b5b5;">Drama · 2024</div>
                  </td>
                  <td width="50%" style="background:#191919;border:1px solid #222;border-radius:10px;overflow:hidden;">
                    <img src="https://images.unsplash.com/photo-1677435013662-ef31e32ff9f8?auto=format&fit=crop&w=600&q=80" alt="City Lights" width="100%" style="display:block;" />
                    <div style="padding:10px 12px;font-size:13px;font-weight:700;color:#fd7e14;">City Lights</div>
                    <div style="padding:0 12px 12px 12px;font-size:12px;color:#b5b5b5;">Thriller · Lagos</div>
                  </td>
                </tr>
                <tr>
                  <td width="50%" style="background:#191919;border:1px solid #222;border-radius:10px;overflow:hidden;">
                    <img src="https://images.unsplash.com/photo-1657356217561-6ed26b47e116?auto=format&fit=crop&w=600&q=80" alt="Ancestral Calling" width="100%" style="display:block;" />
                    <div style="padding:10px 12px;font-size:13px;font-weight:700;color:#fd7e14;">Ancestral Calling</div>
                    <div style="padding:0 12px 12px 12px;font-size:12px;color:#b5b5b5;">Fantasy · Epic journeys</div>
                  </td>
                  <td width="50%" style="background:#191919;border:1px solid #222;border-radius:10px;overflow:hidden;">
                    <img src="https://images.unsplash.com/photo-1758875913518-7869eb5e1e91?auto=format&fit=crop&w=600&q=80" alt="Rhythm & Soul" width="100%" style="display:block;" />
                    <div style="padding:10px 12px;font-size:13px;font-weight:700;color:#fd7e14;">Rhythm & Soul</div>
                    <div style="padding:0 12px 12px 12px;font-size:12px;color:#b5b5b5;">Musical · Feel good</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:20px 0 8px 0;">
              <a href="${process.env.APP_ORIGIN ?? "https://wanzami.vercel.app"}" style="background:#fd7e14;color:#fff;text-decoration:none;padding:14px 24px;border-radius:10px;font-weight:700;display:inline-block;">Start watching</a>
            </td>
          </tr>
          <tr>
            <td style="font-size:12px;line-height:1.6;color:#9a9a9a;text-align:center;padding-top:8px;">
              Need help? Reply to this email or visit our help center.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;
