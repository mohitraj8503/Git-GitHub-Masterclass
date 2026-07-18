import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== "admin") {
      return NextResponse.json({ success: false, error: "Unauthorized: Admins only." }, { status: 401 });
    }

    const { recipients, subject, body, badge } = await request.json();

    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return NextResponse.json({ success: false, error: "Recipients list is required." }, { status: 400 });
    }
    if (!subject || !subject.trim()) {
      return NextResponse.json({ success: false, error: "Subject is required." }, { status: 400 });
    }
    if (!body || !body.trim()) {
      return NextResponse.json({ success: false, error: "Message body is required." }, { status: 400 });
    }

    const resendApiKey = process.env.RESEND_API_KEY;
    if (!resendApiKey) {
      return NextResponse.json({ success: false, error: "Resend API key is not configured on the server." }, { status: 500 });
    }

    // Advanced aesthetic body formatting
    const formatEmailBody = (text: string): string => {
      if (!text) return "";
      
      const lines = text.split("\n");
      let html = "";
      let inChecklist = false;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        if (!line) {
          if (inChecklist) {
            html += `</div>`;
            inChecklist = false;
          }
          html += `<div style="height: 12px;"></div>`;
          continue;
        }

        // 1. Checklist Items
        if (line.startsWith("✅")) {
          if (!inChecklist) {
            html += `<div style="margin: 16px 0; padding: 0; display: block;">`;
            inChecklist = true;
          }
          const itemText = line.replace(/^✅/, "").trim();
          html += `
            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 8px;">
              <tr>
                <td style="vertical-align: top; width: 24px; font-size: 15px; color: #10b981; padding-top: 1px;">✅</td>
                <td style="vertical-align: top; font-size: 14px; color: #334155; line-height: 1.5; font-weight: 600;">${itemText}</td>
              </tr>
            </table>
          `;
          continue;
        }

        if (inChecklist) {
          html += `</div>`;
          inChecklist = false;
        }

        // 2. Warning Box / Important Laptop Reminder
        if (line.startsWith("⚠️")) {
          const content = line.replace(/^⚠️/, "").trim();
          html += `
            <div style="margin: 20px 0; padding: 16px; background-color: #fffbeb; border-left: 4px solid #f59e0b; border-radius: 12px; border-top: 1px solid #fef3c7; border-right: 1px solid #fef3c7; border-bottom: 1px solid #fef3c7;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td style="vertical-align: top; width: 28px; font-size: 16px; padding-top: 1px;">⚠️</td>
                  <td style="vertical-align: top; font-size: 14px; line-height: 1.5; color: #78350f; font-weight: 700;">${content}</td>
                </tr>
              </table>
            </div>
          `;
          continue;
        }

        // 3. Logistical Info Blocks (Date, Time, Venue)
        if (line.startsWith("📅") || line.startsWith("🕧") || line.startsWith("📍") || line.startsWith("👨‍🏫") || line.startsWith("👩‍🏫")) {
          const emoji = line.substring(0, 2);
          const content = line.substring(2).trim();
          const parts = content.split(":");
          const label = parts[0] ? parts[0].trim() : "";
          const val = parts.slice(1).join(":").trim();

          html += `
            <div style="margin-bottom: 8px; background-color: #f8fafc; padding: 12px 16px; border-radius: 10px; border: 1px solid #e2e8f0;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td style="vertical-align: middle; width: 26px; font-size: 16px;">${emoji}</td>
                  <td style="vertical-align: middle; font-size: 13px; color: #475569; font-weight: 700; width: 80px;">${label}:</td>
                  <td style="vertical-align: middle; font-size: 13px; color: #0f172a; font-weight: 800;">${val}</td>
                </tr>
              </table>
            </div>
          `;
          continue;
        }

        // 4. Organizer Credits / Faculty Coordinators
        if (line.startsWith("Resource Person:") || line.startsWith("Faculty Coordinator:") || line.includes("Ambassador")) {
          html += `<p style="margin: 0 0 8px 0; font-size: 13px; line-height: 1.5; color: #64748b; font-weight: 500;">${line}</p>`;
          continue;
        }

        // 5. Links
        if (line.includes("http://") || line.includes("https://")) {
          const urlRegex = /(https?:\/\/[^\s]+)/g;
          const linkedLine = line.replace(urlRegex, (url) => {
            return `<a href="${url}" target="_blank" style="color: #0284c7; text-decoration: underline; font-weight: 700;">${url}</a>`;
          });
          html += `<p style="margin: 0 0 16px 0; font-size: 14px; line-height: 1.6; color: #334155; font-weight: 500;">${linkedLine}</p>`;
          continue;
        }

        // Default Paragraph
        html += `<p style="margin: 0 0 16px 0; font-size: 14px; line-height: 1.6; color: #334155; font-weight: 500;">${line}</p>`;
      }

      if (inChecklist) {
        html += `</div>`;
      }

      return html;
    };

    const formattedBody = formatEmailBody(body);

    // Branded Badge HTML
    const badgeHtml = badge && badge.trim()
      ? `<span style="display: inline-block; background-color: #fef3c7; color: #d97706; font-size: 11px; font-weight: 800; padding: 4px 10px; border-radius: 20px; text-transform: uppercase; margin-bottom: 16px; border: 1px solid #fde68a;">${badge.trim()}</span>`
      : "";

    // Branded premium email HTML wrapper
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
                <!-- Header with High-Deliverability Text Branding -->
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
                    <div style="margin-top: 36px; border-top: 1.5px solid #f1f5f9; padding-top: 24px;">
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

    // Resend allows sending up to 50 recipients in a single call in "to" array
    // Send in batches of 50 to avoid limits
    const batchSize = 50;
    let successCount = 0;
    const errors: string[] = [];

    for (let i = 0; i < recipients.length; i += batchSize) {
      const batch = recipients.slice(i, i + batchSize);

      const resendRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${resendApiKey}`
        },
        body: JSON.stringify({
          from: "Git & GitHub Masterclass <organizer@ajumicrosoft.in>",
          to: batch,
          subject: subject,
          html: emailHtml
        })
      });

      const resendData = await resendRes.json();

      if (resendRes.ok) {
        successCount += batch.length;
      } else {
        errors.push(resendData.message || `Failed to send batch starting at index ${i}`);
      }
    }

    if (errors.length > 0) {
      return NextResponse.json({
        success: false,
        error: `Sent ${successCount} emails, but encountered errors: ${errors.join("; ")}`
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `Successfully sent broadcast email to ${successCount} recipients.`
    });

  } catch (err: any) {
    console.error("Email send error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
