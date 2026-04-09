const frontendBase =
  process.env.APP_ORIGIN ||
  process.env.FRONTEND_URL ||
  "https://www.wanzami.tv";

const logoUrl = "https://wanzami-bucket.s3.eu-north-1.amazonaws.com/wanzami_assets/wanzami_logo.png";
const unveilGraphicUrl = "https://wanzami-media-eu-576393818319.s3.eu-north-1.amazonaws.com/email-assets/wanzami-new-look-unveil.jpg";
const featurePosters = [
  { title: "Ruin", image: `${frontendBase}/remotion-posters/poster-1.jpg` },
  { title: "Against Creation", image: `${frontendBase}/remotion-posters/poster-3.jpg` },
  { title: "Traffick", image: `${frontendBase}/remotion-posters/poster-4.jpg` },
];

export function buildPlatformRefreshEmailTemplate(params?: {
  name?: string | null;
  ctaUrl?: string;
  unsubscribeUrl?: string;
  privacyUrl?: string;
  helpUrl?: string;
}) {
  const name = params?.name || "{{name}}";
  const ctaUrl = params?.ctaUrl || frontendBase;
  const unsubscribeUrl = params?.unsubscribeUrl || `${frontendBase}/unsubscribe`;
  const privacyUrl = params?.privacyUrl || `${frontendBase}/privacy`;
  const helpUrl = params?.helpUrl || `${frontendBase}/contact`;
  const postersHtml = featurePosters
    .map(
      (poster) => `
        <td width="33.33%" style="padding:0 6px;vertical-align:top;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#171717;border:1px solid #2a2a2a;border-radius:12px;overflow:hidden;">
            <tr>
              <td>
                <img src="${poster.image}" alt="${poster.title}" width="100%" style="display:block;width:100%;height:auto;" />
              </td>
            </tr>
            <tr>
              <td style="padding:10px 10px 12px;font-size:13px;font-weight:700;color:#ffffff;">${poster.title}</td>
            </tr>
          </table>
        </td>`
    )
    .join("");

  return {
    subject: "A fresh new Wanzami TV experience is here",
    html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Wanzami TV Update</title>
</head>
<body style="margin:0;padding:0;background:#090909;font-family:Arial,sans-serif;color:#f5f5f5;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#090909;padding:32px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;background:#111111;border:1px solid #232323;border-radius:18px;overflow:hidden;">
          <tr>
            <td style="background:linear-gradient(135deg,#fd7e14 0%,#ff5a1f 100%);padding:36px 32px 28px;text-align:center;">
              <img src="${logoUrl}" alt="Wanzami TV" width="132" style="display:block;margin:0 auto 18px;max-width:132px;" />
              <div style="font-size:28px;line-height:1.2;font-weight:800;color:#ffffff;">Something big just happened at Wanzami TV</div>
            </td>
          </tr>
          <tr>
            <td style="padding:32px 32px 20px;">
              <p style="margin:0 0 18px;font-size:16px;line-height:1.7;color:#f4f4f4;">Hi ${name},</p>
              <p style="margin:0 0 18px;font-size:16px;line-height:1.7;color:#d7d7d7;">Something big just happened at Wanzami TV - and we couldn't wait to tell you about it.</p>
              <p style="margin:0 0 18px;font-size:16px;line-height:1.7;color:#d7d7d7;">We've been hard at work behind the scenes, and today we're thrilled to unveil a brand-new look, a smoother experience, and exciting new features designed with <strong style="color:#ffffff;">YOU</strong> in mind.</p>

              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 24px;background:#171717;border:1px solid #2a2a2a;border-radius:16px;overflow:hidden;">
                <tr>
                  <td>
                    <img src="${unveilGraphicUrl}" alt="The new look of Wanzami TV" width="100%" style="display:block;width:100%;height:auto;" />
                  </td>
                </tr>
                <tr>
                  <td style="padding:16px 18px;">
                    <div style="font-size:18px;font-weight:800;color:#ffffff;margin:0 0 6px;">A bold new look, same powerful stories</div>
                    <div style="font-size:14px;line-height:1.7;color:#d0d0d0;">Step into the refreshed Wanzami TV experience with sharper visuals, smoother browsing, and the stories you love front and center.</div>
                  </td>
                </tr>
              </table>

              <div style="margin:28px 0 18px;font-size:18px;font-weight:700;color:#ffffff;">✨ Here's what's new:</div>

              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 24px;">
                <tr>
                  <td style="padding:0 0 12px;font-size:15px;line-height:1.7;color:#d7d7d7;">• A fresh, modern design - cleaner, bolder, and easier on the eyes</td>
                </tr>
                <tr>
                  <td style="padding:0 0 12px;font-size:15px;line-height:1.7;color:#d7d7d7;">• Improved navigation so you can find your favourite content faster than ever</td>
                </tr>
                <tr>
                  <td style="padding:0 0 12px;font-size:15px;line-height:1.7;color:#d7d7d7;">• Upgraded streaming quality for an even more immersive viewing experience</td>
                </tr>
                <tr>
                  <td style="padding:0 0 12px;font-size:15px;line-height:1.7;color:#d7d7d7;">• New personalization features to tailor your feed to what you love</td>
                </tr>
                <tr>
                  <td style="padding:0 0 12px;font-size:15px;line-height:1.7;color:#d7d7d7;">• Performance improvements for faster load times and seamless browsing</td>
                </tr>
              </table>

              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 22px;">
                <tr>
                  ${postersHtml}
                </tr>
              </table>

              <div style="margin:0 0 18px;padding:18px 20px;border:1px solid #2a2a2a;border-radius:14px;background:#171717;">
                <div style="margin:0 0 8px;font-size:17px;font-weight:700;color:#ffffff;">📱 And that's not all - our mobile app is coming soon!</div>
                <div style="font-size:15px;line-height:1.7;color:#d0d0d0;">Take Wanzami TV with you wherever you go. Be the first to know when it drops by staying tuned to your inbox.</div>
              </div>

              <p style="margin:0 0 22px;font-size:16px;line-height:1.7;color:#d7d7d7;">Ready to experience the new Wanzami TV?</p>

              <table role="presentation" cellspacing="0" cellpadding="0" align="center" style="margin:0 auto 24px;">
                <tr>
                  <td align="center" style="border-radius:999px;background:#fd7e14;">
                    <a href="${ctaUrl}" style="display:inline-block;padding:15px 28px;border-radius:999px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;">Visit Wanzami TV Now</a>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 18px;font-size:15px;line-height:1.7;color:#d7d7d7;">Dive in, explore the new look, and enjoy your favourite shows like never before. We'd love to hear what you think.</p>
              <p style="margin:0;font-size:15px;line-height:1.7;color:#d7d7d7;">Happy watching,<br /><strong style="color:#ffffff;">The Wanzami TV Team</strong></p>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 32px 30px;border-top:1px solid #232323;font-size:12px;line-height:1.8;color:#9a9a9a;text-align:center;">
              You're receiving this email because you have an active account with Wanzami TV.<br />
              <a href="${unsubscribeUrl}" style="color:#fd7e14;text-decoration:none;">Unsubscribe</a>
              &nbsp;|&nbsp;
              <a href="${privacyUrl}" style="color:#fd7e14;text-decoration:none;">Privacy Policy</a>
              &nbsp;|&nbsp;
              <a href="${helpUrl}" style="color:#fd7e14;text-decoration:none;">Help Centre</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`.trim(),
  };
}
