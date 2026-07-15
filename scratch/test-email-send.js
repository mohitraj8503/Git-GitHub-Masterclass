const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let value = match[2] ? match[2].trim() : '';
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.substring(1, value.length - 1);
    }
    env[match[1]] = value;
  }
});

async function main() {
  console.log("=== SENDING WELCOME EMAIL TEST TO ORGANIZER ===");
  
  const badge = "Session 1 Details";
  const subject = "Git and GitHub Masterclass - Day 1 Welcome & Logistics";
  const body = `Hello Everyone,

Welcome to the Git & GitHub Masterclass community. We're excited to have you join us for this 7-day journey.

The Department of Engineering & IT, Arka Jain University, is hosting this hands-on workshop for B.Tech, BCA & Diploma students — and it all begins today.

💻 What you'll learn:
✅ Git & GitHub — Beginner to Advanced
✅ Build & Deploy Your Own Portfolio Website
✅ Open Source Contribution
✅ Microsoft Learn Modules
✅ Real-World Developer Workflow
✅ Microsoft Developer Benefits

⚠️ Important: Please bring your own laptop to every session — this is a fully hands-on workshop.

📅 Date: 15th July 2026 (Day 1 of 7)
🕧 Time: 12:30 PM
📍 Venue: Computer Lab, Room No. 320, Block Baudhayan

Resource Person: Mohit Raj (Microsoft Learn Student Ambassador)
Faculty Coordinator: Prof. Rakhi Jha (Microsoft Learn Student Ambassador Faculty Lead)

🌐 Track your progress, attendance, and assignments here:
https://ajumicrosoft.in

See you there — let's start building! 🚀`;

  const formattedBody = body
    .trim()
    .split("\n")
    .map(para => para.trim() ? `<p style="margin: 0 0 16px 0; font-size: 15px; line-height: 1.6; color: #334155;">${para}</p>` : `<div style="height: 12px;"></div>`)
    .join("");

  const badgeHtml = badge && badge.trim()
    ? `<span style="display: inline-block; background-color: #fef3c7; color: #d97706; font-size: 11px; font-weight: 800; padding: 4px 10px; border-radius: 20px; text-transform: uppercase; margin-bottom: 16px; border: 1px solid #fde68a;">${badge.trim()}</span>`
    : "";

  const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${subject}</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #faf6eb; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #faf6eb; padding: 32px 16px;">
        <tr>
          <td align="center">
            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 24px; border: 1px solid #e9e3d5; overflow: hidden; box-shadow: 0 10px 15px -3px rgba(139,92,26,0.05), 0 4px 6px -2px rgba(139,92,26,0.02);">
              <!-- Header with Logos -->
              <tr>
                <td style="padding: 24px 32px; background-color: #ffffff; border-bottom: 2px solid #faf6eb;">
                  <table border="0" cellpadding="0" cellspacing="0" width="100%">
                    <tr>
                      <td align="left" style="vertical-align: middle;">
                        <div style="font-size: 13px; font-weight: 800; color: #0b132b; letter-spacing: 0.5px; text-transform: uppercase;">Arka Jain University</div>
                        <div style="font-size: 9px; color: #64748b; font-weight: 600; margin-top: 2px;">Dept. of Engineering &amp; IT</div>
                      </td>
                      <td align="right" style="vertical-align: middle;">
                        <div style="font-size: 11px; font-weight: 800; color: #0284c7; letter-spacing: 0.5px; text-transform: uppercase;">Ambassador Program</div>
                        <div style="font-size: 9px; color: #64748b; font-weight: 600; margin-top: 2px;">Microsoft Learn</div>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              <!-- Subheader bar with golden bottom accent -->
              <tr>
                <td style="padding: 20px 32px; background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); text-align: center; border-bottom: 3px solid #d97706;">
                  <div style="font-size: 16px; font-weight: 900; color: #ffffff; letter-spacing: 1px; text-transform: uppercase;">Git &amp; GitHub Masterclass</div>
                  <div style="font-size: 10px; color: #f59e0b; font-weight: 700; margin-top: 4px; text-transform: uppercase; letter-spacing: 1.5px;">Microsoft Learn Student Ambassadors</div>
                </td>
              </tr>
              <!-- Content Area -->
              <tr>
                <td style="padding: 40px 32px 32px 32px;">
                  ${badgeHtml}
                  <h1 style="margin: 0 0 24px 0; font-size: 22px; font-weight: 850; color: #0f172a; line-height: 1.35; letter-spacing: -0.5px;">${subject}</h1>
                  <div style="font-size: 15px; color: #334155;">
                    ${formattedBody}
                  </div>
                  <div style="margin-top: 36px; border-top: 1.5px solid #faf6eb; padding-top: 24px;">
                    <p style="margin: 0; font-size: 13px; color: #64748b; font-weight: 700;">Warm regards,</p>
                    <p style="margin: 4px 0 0 0; font-size: 14px; color: #0f172a; font-weight: 850; letter-spacing: -0.2px;">Git &amp; GitHub Masterclass Team</p>
                  </div>
                </td>
              </tr>
              <!-- Footer -->
              <tr>
                <td style="padding: 24px 32px; background-color: #faf6eb; text-align: center; border-top: 1.5px solid #e9e3d5;">
                  <p style="margin: 0; font-size: 11px; color: #64748b; line-height: 1.6;">Organized by Microsoft Learn Student Ambassador Program at Arka Jain University.</p>
                  <p style="margin: 6px 0 0 0; font-size: 10px; color: #94a3b8;">&copy; 2026 Git &amp; GitHub Masterclass. All Rights Reserved.</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  const resendApiKey = env.RESEND_API_KEY;
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${resendApiKey}`
    },
    body: JSON.stringify({
      from: "Git & GitHub Masterclass <organizer@ajumicrosoft.in>",
      to: ["pm.enthuse@gmail.com"],
      subject: subject,
      html: emailHtml
    })
  });

  const data = await res.json();
  console.log("Resend response:", data);
}

main();
