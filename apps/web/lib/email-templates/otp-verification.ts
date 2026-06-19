export interface OtpEmailData {
  email: string;
  code: string;
  appUrl: string;
}

export function buildOtpEmail(data: OtpEmailData): {
  subject: string;
  html: string;
  text: string;
} {
  const { email, code, appUrl } = data;
  const subject = `${code} is your Church Pass verification code`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${subject}</title>
</head>
<body style="margin:0;padding:0;background-color:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0a0a0a;padding:60px 16px 80px;">
    <tr>
      <td align="center">
        <table width="480" cellpadding="0" cellspacing="0" style="max-width:480px;width:100%;text-align:center;">
          
          <!-- Logo / Header -->
          <tr>
            <td align="center" style="padding-bottom:48px;">
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:#4f46e5;border-radius:8px;width:36px;height:36px;text-align:center;vertical-align:middle;">
                    <span style="color:#ffffff;font-size:20px;font-weight:900;line-height:36px;display:inline-block;">✦</span>
                  </td>
                  <td style="padding-left:10px;vertical-align:middle;">
                    <span style="font-size:20px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">Church Pass</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Content Card -->
          <tr>
            <td style="background:#111111;border:1px solid #222222;border-radius:24px;padding:48px 36px 40px;">
              <h1 style="margin:0 0 12px;font-size:24px;font-weight:800;color:#ffffff;line-height:1.2;">
                Verify your email
              </h1>
              
              <p style="margin:0 0 32px;font-size:14px;color:#9ca3af;line-height:1.5;">
                Here's the one-time verification code you requested:
              </p>

              <!-- Verification Code Box (Nike Style) -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
                <tr>
                  <td style="border-top:1px solid #222222;border-bottom:1px solid #222222;padding:24px 0;">
                    <span style="font-size:40px;font-weight:800;color:#ffffff;letter-spacing:6px;line-height:1;display:inline-block;margin-left:6px;">${code}</span>
                  </td>
                </tr>
              </table>

              <!-- Expiration Warning -->
              <p style="margin:0 0 8px;font-size:13px;font-weight:700;color:#ffffff;line-height:1.5;">
                This code expires after 15 minutes.
              </p>
              
              <p style="margin:0;font-size:12px;color:#6b7280;line-height:1.5;max-width:320px;margin-left:auto;margin-right:auto;">
                If you've already received this code or don't need it any more, ignore this email.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding-top:40px;">
              <p style="margin:0;font-size:12px;color:#4b5563;line-height:1.5;">
                Sent by <a href="${appUrl}" style="color:#6366f1;text-decoration:none;">Church Pass</a><br/>
                <a href="mailto:help@churchpass.events" style="color:#4b5563;text-decoration:none;">help@churchpass.events</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`.trim();

  const text = [
    `Verify your email`,
    `Here's the one-time verification code you requested:`,
    ``,
    `------------------------`,
    `      ${code}`,
    `------------------------`,
    ``,
    `This code expires after 15 minutes.`,
    `If you've already received this code or don't need it any more, ignore this email.`,
    ``,
    `— Church Pass`,
  ].join("\n");

  return { subject, html, text };
}
