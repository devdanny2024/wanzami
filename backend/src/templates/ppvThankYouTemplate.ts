type Rec = { title: string; priceNaira?: number | null; url?: string };

const frontendBase =
  process.env.APP_ORIGIN ||
  process.env.FRONTEND_URL ||
  "https://wanzami.vercel.app";

export function buildPpvThankYouEmail(params: {
  userName?: string | null;
  purchasedTitle: string;
  recs?: Rec[];
}) {
  const { userName, purchasedTitle, recs = [] } = params;
  const name = userName || "there";
  const recList =
    recs.length > 0
      ? recs
          .map(
            (r) =>
              `<li style="margin-bottom:6px;"><strong>${r.title}</strong>${
                r.priceNaira ? ` · ₦${r.priceNaira}` : ""
              }${r.url ? ` – <a href="${r.url}" style="color:#fd7e14;">View</a>` : ""}</li>`
          )
          .join("")
      : "";

  const recSection =
    recs.length > 0
      ? `<p style="margin:0 0 8px 0;">You might also like:</p><ul style="padding-left:18px;margin:0 0 12px 0;">${recList}</ul>`
      : "";

  return {
    subject: "Thanks for your purchase!",
    html: `
      <div style="font-family:Arial,sans-serif;font-size:14px;line-height:1.5;color:#0f172a;">
        <h2 style="color:#fd7e14;margin-bottom:8px;">Thank you, ${name}!</h2>
        <p style="margin:0 0 12px 0;">Your purchase of <strong>${purchasedTitle}</strong> was successful.</p>
        <p style="margin:0 0 12px 0;">
          You can start watching right away: 
          <a href="${frontendBase}/title" style="color:#fd7e14;text-decoration:none;">Open Wanzami</a>
        </p>
        ${recSection}
        <p style="margin:12px 0 0 0;">Enjoy your movie,<br/>Team Wanzami</p>
      </div>
    `,
  };
}
