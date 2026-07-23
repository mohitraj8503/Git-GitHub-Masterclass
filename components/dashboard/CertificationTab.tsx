"use client";

import React, { useState, useEffect } from "react";
import {
  CertificateCanvas,
  defaultCertificateData,
} from "@/components/certificate/CertificateCanvas";
import {
  downloadCertificatePNG,
  downloadCertificatePDF,
  type CertificateRegistrationData,
} from "@/lib/certificateExport";
import { CertificateData } from "@/types/certificate";

const LINKEDIN_TEMPLATES = [
  {
    id: 1,
    name: "Elegant & Grateful ❤️",
    text: `🎓 Completed the Git & GitHub Masterclass ❤️

I'm truly grateful to share that I've successfully completed the Git & GitHub Masterclass, an incredible learning journey that strengthened my understanding of version control, collaboration, and modern software development practices.

Every session was filled with practical knowledge, hands-on learning, and real-world insights that have inspired me to keep growing as a developer.

A heartfelt thank you to Arka Jain University and the Microsoft Learn Student Ambassadors for creating such a meaningful learning experience.

❤️ A very special thanks to Mohit Raj (@mohitraj8503) for being an outstanding mentor and instructor. Your guidance, patience, encouragement, and passion for teaching helped me build confidence, improve my development skills, and motivated me to continue learning every single day. I'm sincerely grateful for your constant support.

🎖️ Certificate Earned: Git & GitHub Masterclass

📍 Arka Jain University

#Git #GitHub #VersionControl #OpenSource #SoftwareDevelopment #Developer #Programming #MicrosoftLearn #MicrosoftLearnStudentAmbassadors #ArkaJainUniversity #Learning #TechCommunity #Coding #CareerGrowth #AI #ComputerScience #StudentDeveloper #ContinuousLearning`,
  },
  {
    id: 2,
    name: "Modern & Inspirational ❤️",
    text: `🚀 Another Milestone Achieved! ❤️

Learning is one of the most rewarding investments we can make, and today I'm excited to share that I've successfully completed the Git & GitHub Masterclass.

This experience enhanced my understanding of Git, GitHub, collaborative development, branching strategies, and open-source workflows while giving me practical exposure to industry practices.

A sincere thank you to Arka Jain University and the Microsoft Learn Student Ambassadors for organizing this wonderful learning opportunity.

❤️ My deepest gratitude goes to Mohit Raj (@mohitraj8503) for being an exceptional teacher and mentor. Your continuous encouragement, practical teaching style, and willingness to support every learner made this journey truly memorable. Thank you for helping me grow, improve, and become a more confident developer.

Looking forward to applying these skills to exciting new projects.

🎖️ Certificate Earned: Git & GitHub Masterclass

📍 Arka Jain University

#Git #GitHub #VersionControl #OpenSource #SoftwareDevelopment #Developer #Programming #MicrosoftLearn #MicrosoftLearnStudentAmbassadors #ArkaJainUniversity #Learning #TechCommunity #Coding #CareerGrowth #AI #ComputerScience #StudentDeveloper #ContinuousLearning`,
  },
  {
    id: 3,
    name: "Professional & Premium ❤️",
    text: `✨ Proud to Share This Achievement ❤️

I'm delighted to announce that I've successfully completed the Git & GitHub Masterclass, gaining valuable knowledge of version control systems, GitHub collaboration, and professional software development workflows.

This journey has strengthened both my technical skills and my confidence in building real-world projects.

Thank you to Arka Jain University and the Microsoft Learn Student Ambassadors for organizing such a well-structured and impactful workshop.

❤️ A special appreciation to Mohit Raj (@mohitraj8503) for your remarkable mentorship. Your dedication, patience, and inspiring way of teaching created an environment where learning became enjoyable and meaningful. Thank you for believing in every student and encouraging us to keep pushing forward.

Here's to many more milestones ahead.

🎖️ Certificate Earned: Git & GitHub Masterclass

📍 Arka Jain University

#Git #GitHub #VersionControl #OpenSource #SoftwareDevelopment #Developer #Programming #MicrosoftLearn #MicrosoftLearnStudentAmbassadors #ArkaJainUniversity #Learning #TechCommunity #Coding #CareerGrowth #AI #ComputerScience #StudentDeveloper #ContinuousLearning`,
  },
  {
    id: 4,
    name: "Warm & Heartfelt ❤️",
    text: `🎉 A Proud Learning Milestone ❤️

I'm happy to share that I've successfully completed the Git & GitHub Masterclass.

This workshop provided practical experience with Git, GitHub, collaboration workflows, version control, and open-source development while helping me understand how modern development teams work together.

My sincere thanks to Arka Jain University and the Microsoft Learn Student Ambassadors for making this opportunity possible.

❤️ A heartfelt thank you to Mohit Raj (@mohitraj8503). Your mentorship, unwavering support, and genuine passion for teaching have made a lasting impact on my learning journey. Thank you for encouraging us to think beyond the classroom, solve real problems, and continuously improve ourselves as developers.

I'm excited for the opportunities that lie ahead.

🎖️ Certificate Earned: Git & GitHub Masterclass

📍 Arka Jain University

#Git #GitHub #VersionControl #OpenSource #SoftwareDevelopment #Developer #Programming #MicrosoftLearn #MicrosoftLearnStudentAmbassadors #ArkaJainUniversity #Learning #TechCommunity #Coding #CareerGrowth #AI #ComputerScience #StudentDeveloper #ContinuousLearning`,
  },
  {
    id: 5,
    name: "LinkedIn Featured Style ❤️",
    text: `🏆 Learning • Growing • Building ❤️

I'm incredibly excited to share that I've successfully completed the Git & GitHub Masterclass.

This experience has given me practical exposure to Git, GitHub, collaborative software development, version control, and open-source contribution while strengthening my passion for technology and continuous learning.

A huge thank you to Arka Jain University and the Microsoft Learn Student Ambassadors for organizing such a valuable and inspiring workshop.

❤️ My sincere appreciation goes to Mohit Raj (@mohitraj8503) for being more than just an instructor. Thank you for your constant motivation, practical guidance, and unwavering support throughout this journey. Your mentorship has helped me develop not only technical knowledge but also the confidence to keep learning, building, and growing as a developer.

Looking forward to applying these learnings to future projects and embracing new challenges.

🎖️ Certificate Earned: Git & GitHub Masterclass

📍 Arka Jain University

#Git #GitHub #VersionControl #OpenSource #SoftwareDevelopment #Developer #Programming #MicrosoftLearn #MicrosoftLearnStudentAmbassadors #ArkaJainUniversity #Learning #TechCommunity #Coding #CareerGrowth #AI #ComputerScience #StudentDeveloper #ContinuousLearning`,
  },
];

interface CertificationTabProps {
  registeredUser: any;
  showToast?: (type: any, message: string) => void;
}

export default function CertificationTab({
  registeredUser,
  showToast,
}: CertificationTabProps) {
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<{
    eligible: boolean;
    certificate?: any;
    reason?: string;
    day1Present?: boolean;
    otherDaysPresentCount?: number;
    totalDaysPresent?: number;
  } | null>(null);

  const [exporting, setExporting] = useState(false);

  const enrollmentNumber =
    registeredUser?.enrollmentNumber ||
    registeredUser?.enrollment_number ||
    "";

  useEffect(() => {
    async function fetchStatus() {
      if (!enrollmentNumber) {
        setLoading(false);
        setStatus({
          eligible: false,
          reason:
            "We couldn't find your enrollment number. Please log in with a registered account.",
          day1Present: false,
          otherDaysPresentCount: 0,
          totalDaysPresent: 0,
        });
        return;
      }

      try {
        const res = await fetch(
          `/api/certificates/my-status?enrollment_number=${encodeURIComponent(
            enrollmentNumber
          )}`
        );
        const data = await res.json();
        setStatus(data);
      } catch (err) {
        console.error("Failed to fetch certificate status:", err);
        setStatus({
          eligible: false,
          reason:
            "Unable to check certificate status. Please check your connection and try again.",
        });
      } finally {
        setLoading(false);
      }
    }

    fetchStatus();
  }, [enrollmentNumber]);

  if (loading) {
    return (
      <div className="db-projects-section animate-in fade-in duration-300">
        <h3 className="db-section-title">🎓 Certification Studio</h3>
        <div
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "16px",
            padding: "48px 24px",
            textAlign: "center",
            color: "#94A3B8",
          }}
        >
          <div
            style={{
              display: "inline-block",
              width: "24px",
              height: "24px",
              border: "3px solid rgba(255,255,255,0.1)",
              borderTopColor: "#F59E0B",
              borderRadius: "50%",
              animation: "spin 1s linear infinite",
              marginBottom: "12px",
            }}
          />
          <div>Checking your workshop certification eligibility...</div>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  // State: Student IS ELIGIBLE
  if (status?.eligible && status?.certificate) {
    const certData: CertificateData = {
      ...defaultCertificateData,
      recipientName:
        status.certificate.recipientName ||
        registeredUser?.name ||
        "Student",
      enrollmentId: enrollmentNumber,
      certificateId: status.certificate.certificateId,
      completionDate: "23 JULY 2026",
      winnerRank: status.certificate.winnerRank ? Number(status.certificate.winnerRank) : undefined,
      description: status.certificate.description || defaultCertificateData.description,
    };

    const certRegData: CertificateRegistrationData = {
      recipientName: certData.recipientName,
      enrollmentId: enrollmentNumber,
      completionDate: certData.completionDate,
      customCertificateId: certData.certificateId,
    };

    // ALWAYS use production URL https://ajumicrosoft.in (NEVER localhost!)
    const BASE_DOMAIN = "https://ajumicrosoft.in";
    const verifyUrl = `${BASE_DOMAIN}/verify?id=${encodeURIComponent(
      status.certificate.certificateId || `GT/${enrollmentNumber}`
    )}`;

    const handlePNGDownload = async () => {
      setExporting(true);
      try {
        await downloadCertificatePNG({
          fileName: `Git_GitHub_Masterclass_Certificate_${certData.recipientName.replace(
            /\s+/g,
            "_"
          )}.png`,
          certData: certRegData,
        });
        showToast?.("success", "Certificate PNG downloaded successfully!");
      } catch (err) {
        showToast?.("error", "Failed to generate PNG image.");
      } finally {
        setExporting(false);
      }
    };

    const handlePDFDownload = async () => {
      setExporting(true);
      try {
        await downloadCertificatePDF({
          fileName: `Git_GitHub_Masterclass_Certificate_${certData.recipientName.replace(
            /\s+/g,
            "_"
          )}.pdf`,
          certData: certRegData,
        });
        showToast?.("success", "Certificate PDF downloaded successfully!");
      } catch (err) {
        showToast?.("error", "Failed to generate PDF document.");
      } finally {
        setExporting(false);
      }
    };

    // Directly copies random template caption & opens LinkedIn in new tab instantly (0 modals!)
    const handleAddLinkedInDirect = async () => {
      const randomIndex = Math.floor(Math.random() * LINKEDIN_TEMPLATES.length);
      const selectedTemplate = LINKEDIN_TEMPLATES[randomIndex];

      const fullPostText = `${selectedTemplate.text}\n\n🎖️ Verify Certificate:\n${verifyUrl}`;

      try {
        await navigator.clipboard.writeText(fullPostText);
        showToast?.(
          "success",
          "Caption copied to clipboard! Opening LinkedIn..."
        );
      } catch (e) {
        showToast?.("info", "Opening LinkedIn...");
      }

      const shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
        verifyUrl
      )}`;
      window.open(shareUrl, "_blank", "noopener,noreferrer");
    };

    return (
      <div className="db-projects-section animate-in fade-in duration-300">
        <h3 className="db-section-title">🎓 Masterclass Certification</h3>

        {/* Congratulations Banner */}
        <div
          style={{
            background:
              "linear-gradient(135deg, #FEF3C7 0%, #E0E7FF 50%, #D1FAE5 100%)",
            border: "1px solid #F59E0B",
            borderRadius: "20px",
            padding: "28px",
            marginBottom: "32px",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
            boxShadow: "0 10px 25px -5px rgba(245, 158, 11, 0.15)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "12px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
              <div
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "50%",
                  background: "#0F172A",
                  color: "#FFFFFF",
                  border: "2px solid #1E293B",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 4px 12px rgba(15, 23, 42, 0.3)",
                  flexShrink: 0,
                }}
              >
                <svg width="26" height="26" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
                </svg>
              </div>
              <div>
                <h4
                  style={{
                    color: "#0F172A",
                    fontSize: "22px",
                    fontWeight: 800,
                    margin: 0,
                    letterSpacing: "-0.01em",
                  }}
                >
                  Congratulations, {certData.recipientName}!
                </h4>
                <div
                  style={{ color: "#334155", fontSize: "14px", fontWeight: 600, marginTop: "2px" }}
                >
                  Your official Git &amp; GitHub Masterclass Certificate is ready.
                </div>
              </div>
            </div>

            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                background: "#DCFCE7",
                border: "1.5px solid #16A34A",
                color: "#14532D",
                padding: "8px 16px",
                borderRadius: "9999px",
                fontSize: "12px",
                fontWeight: 800,
                letterSpacing: "0.05em",
                boxShadow: "0 2px 8px rgba(22, 163, 74, 0.15)",
              }}
            >
              <span
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  background: "#16A34A",
                }}
              />
              VERIFIED &amp; ISSUED
            </div>
          </div>

          <p
            style={{
              color: "#1E293B",
              fontSize: "14px",
              fontWeight: 500,
              lineHeight: 1.6,
              margin: 0,
            }}
          >
            You met all attendance and project requirements for the 7-Day
            Hands-on Workshop organized by{" "}
            <strong style={{ color: "#0F172A", fontWeight: 700 }}>Arka Jain University</strong> in collaboration with{" "}
            <strong style={{ color: "#0F172A", fontWeight: 700 }}>Microsoft Learn Student Ambassadors</strong> &amp;{" "}
            <strong style={{ color: "#0F172A", fontWeight: 700 }}>GitHub</strong>.
          </p>

          {/* Action Bar */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              flexWrap: "wrap",
              marginTop: "8px",
            }}
          >
            {/* Add to LinkedIn Direct Button (Copies random caption + opens LinkedIn with ZERO modals) */}
            <button
              onClick={handleAddLinkedInDirect}
              style={{
                background: "#0A66C2",
                color: "#FFFFFF",
                border: "none",
                borderRadius: "12px",
                padding: "12px 20px",
                fontSize: "14px",
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                boxShadow: "0 4px 14px rgba(10,102,194,0.35)",
                transition: "transform 0.15s, background 0.15s",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "#004182")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "#0A66C2")
              }
            >
              <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.25V10.9H6.46M7.86 6.74a1.64 1.64 0 1 0 0 3.28 1.64 1.64 0 0 0 0-3.28Z" />
              </svg>
              Add to LinkedIn
            </button>

            <button
              onClick={handlePNGDownload}
              disabled={exporting}
              style={{
                background: "#D97706",
                color: "#FFFFFF",
                border: "none",
                borderRadius: "12px",
                padding: "12px 20px",
                fontSize: "14px",
                fontWeight: 700,
                cursor: exporting ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                boxShadow: "0 4px 12px rgba(217, 119, 6, 0.3)",
                transition: "opacity 0.2s",
              }}
            >
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Download PNG
            </button>

            <button
              onClick={handlePDFDownload}
              disabled={exporting}
              style={{
                background: "#0F172A",
                color: "#FFFFFF",
                border: "none",
                borderRadius: "12px",
                padding: "12px 20px",
                fontSize: "14px",
                fontWeight: 700,
                cursor: exporting ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                boxShadow: "0 4px 12px rgba(15, 23, 42, 0.25)",
              }}
            >
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
              Download PDF
            </button>

            <a
              href={verifyUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                background: "#15803D",
                color: "#FFFFFF",
                border: "none",
                borderRadius: "12px",
                padding: "12px 20px",
                fontSize: "14px",
                fontWeight: 700,
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                boxShadow: "0 4px 12px rgba(21, 128, 61, 0.25)",
              }}
            >
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
              View Verification Page
            </a>
          </div>
        </div>

        {/* Live Certificate Canvas Embed */}
        <div
          style={{
            backgroundImage:
              "linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url('https://cdn.pixabay.com/photo/2021/11/21/21/14/mountain-6815304_1280.jpg')",
            backgroundSize: "cover",
            backgroundPosition: "center",
            padding: "28px 20px",
            borderRadius: "24px",
            border: "1px solid rgba(255,255,255,0.15)",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.8)",
            display: "flex",
            justifyContent: "center",
            overflow: "auto",
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "900px",
              aspectRatio: "1200 / 820",
              position: "relative",
              overflow: "hidden",
              borderRadius: "12px",
            }}
          >
            <div
              style={{
                width: 1200,
                height: 820,
                transform: "scale(0.75)",
                transformOrigin: "top left",
                position: "absolute",
                top: 0,
                left: 0,
              }}
            >
              <CertificateCanvas data={certData} scale={1} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // State: Student IS NOT ELIGIBLE
  return (
    <div className="db-projects-section animate-in fade-in duration-300">
      <h3 className="db-section-title">🎓 Certification Status</h3>

      <div
        style={{
          background: "rgba(245,158,11,0.06)",
          border: "1px solid rgba(245,158,11,0.25)",
          borderRadius: "20px",
          padding: "32px",
          marginBottom: "32px",
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", gap: "16px" }}>
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "50%",
              background: "rgba(245,158,11,0.15)",
              border: "1px solid rgba(245,158,11,0.4)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "22px",
              flexShrink: 0,
            }}
          >
            ⚠️
          </div>

          <div style={{ flex: 1 }}>
            <h4
              style={{
                color: "#F59E0B",
                fontSize: "20px",
                fontWeight: 800,
                margin: "0 0 8px 0",
              }}
            >
              Certificate Not Yet Available
            </h4>
            <p
              style={{
                color: "#E2E8F0",
                fontSize: "15px",
                lineHeight: 1.6,
                margin: "0 0 20px 0",
              }}
            >
              {status?.reason ||
                "Minimum attendance criteria for certificate eligibility was not met."}
            </p>

            {/* Attendance Breakdown Grid */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                gap: "12px",
                background: "rgba(0,0,0,0.3)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "14px",
                padding: "20px",
                marginBottom: "20px",
              }}
            >
              <div>
                <div
                  style={{ color: "#94A3B8", fontSize: "12px", fontWeight: 700 }}
                >
                  DAY 1 (MANDATORY)
                </div>
                <div
                  style={{
                    color: status?.day1Present ? "#22C55E" : "#EF4444",
                    fontSize: "16px",
                    fontWeight: 800,
                    marginTop: "4px",
                  }}
                >
                  {status?.day1Present ? "Present ✅" : "Absent ❌"}
                </div>
              </div>

              <div>
                <div
                  style={{ color: "#94A3B8", fontSize: "12px", fontWeight: 700 }}
                >
                  REMAINING SESSIONS
                </div>
                <div
                  style={{
                    color:
                      (status?.otherDaysPresentCount || 0) >= 4
                        ? "#22C55E"
                        : "#F59E0B",
                    fontSize: "16px",
                    fontWeight: 800,
                    marginTop: "4px",
                  }}
                >
                  {status?.otherDaysPresentCount || 0} / 5 Attended{" "}
                  {(status?.otherDaysPresentCount || 0) >= 4 ? "✅" : "❌"}
                </div>
              </div>

              <div>
                <div
                  style={{ color: "#94A3B8", fontSize: "12px", fontWeight: 700 }}
                >
                  TOTAL ATTENDANCE
                </div>
                <div
                  style={{
                    color: "#F8FAFC",
                    fontSize: "16px",
                    fontWeight: 800,
                    marginTop: "4px",
                  }}
                >
                  {status?.totalDaysPresent || 0} / 6 Days Present
                </div>
              </div>
            </div>

            <div style={{ color: "#64748B", fontSize: "13px", lineHeight: 1.5 }}>
              💡 If you believe your attendance record is inaccurate, please contact the
              Microsoft Learn Student Ambassador team or Arka Jain University coordinators.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
