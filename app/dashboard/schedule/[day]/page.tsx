"use client";

import React, { use, useEffect } from "react";
import Link from "next/link";
import { SCHEDULE_DAYS } from "@/lib/sessions";

interface PageProps {
  params: Promise<{ day: string }>;
}

const SCHEDULE_VENUE = "Computer Lab 2, Room 320, Block Baudhayana";

export default function DaySchedulePage({ params }: PageProps) {
  const { day } = use(params);
  const [githubUsername, setGithubUsername] = React.useState<string>("mohitraj8503");

  // Clear dashboard dark theme classes on mount
  useEffect(() => {
    document.body.classList.remove("dashboard-body-active");
    document.documentElement.classList.remove("dashboard-body-active");

    const user = JSON.parse(localStorage.getItem("user_registration") || "null");
    const username = user?.githubUsername || user?.github_username || "";
    if (username) {
      setGithubUsername(username);
    }
  }, []);

  const dayNumber = parseInt(day.replace("day-", ""), 10);
  const session = SCHEDULE_DAYS.find((s) => s.day === dayNumber);

  useEffect(() => {
    if (typeof window !== "undefined" && session) {
      const user = JSON.parse(localStorage.getItem("user_registration") || "null");
      const enrollment = user?.enrollmentNumber || user?.enrollment_number || "";
      if (enrollment) {
        fetch("/api/daily-tasks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ enrollment_number: enrollment, task_id: "open_notes" })
        }).catch(err => console.error("Notes completion trigger failed:", err));
      }
    }
  }, [session]);

  // Format date nicely (e.g. 2026-07-16 -> 16 July 2026)
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "";
    const date = new Date(`${dateStr}T00:00:00`);
    return date.toLocaleDateString("en-US", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const formattedDate = session ? formatDate(session.date) : "";

  if (!session) {
    return (
      <div style={{
        minHeight: "100vh",
        backgroundColor: "#F9FAFB",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        fontFamily: "var(--font-plus-jakarta-sans), 'Plus Jakarta Sans', sans-serif"
      }}>
        <div style={{
          maxWidth: "400px",
          width: "100%",
          backgroundColor: "#FFFFFF",
          borderRadius: "16px",
          padding: "32px",
          boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)",
          border: "1px solid #F3F4F6",
          textAlign: "center"
        }}>
          <h1 style={{ fontSize: "24px", fontWeight: "900", color: "#111827", marginBottom: "16px" }}>Day Not Found</h1>
          <p style={{ color: "#6B7280", marginBottom: "24px" }}>The requested schedule day does not exist.</p>
          <Link
            href="/dashboard?tab=schedule"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "12px 24px",
              backgroundColor: "#FFD446",
              color: "#111827",
              fontWeight: "700",
              borderRadius: "12px",
              textDecoration: "none"
            }}
          >
            Back to Schedule
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="day-guide-body">
      {/* Self-contained CSS Reset and Styles to prevent any styles bleeding */}
      <style jsx global>{`
        html, body {
          background-image: url('https://cdn.pixabay.com/photo/2020/12/25/04/51/polar-lights-5858656_1280.jpg') !important;
          background-size: cover !important;
          background-position: center !important;
          background-attachment: fixed !important;
          background-repeat: no-repeat !important;
          color: #FFFFFF !important;
          overflow: auto !important;
          height: auto !important;
          min-height: 100vh !important;
        }

        .day-guide-body {
          font-family: var(--font-plus-jakarta-sans), "Plus Jakarta Sans", system-ui, -apple-system, sans-serif !important;
          background: rgba(15, 23, 42, 0.35) !important;
          backdrop-filter: blur(6px);
          color: #FFFFFF;
          min-height: 100vh;
          padding: 40px 32px;
          box-sizing: border-box;
        }

        .day-guide-container {
          max-width: 1440px;
          margin: 0 auto;
          box-sizing: border-box;
        }

        .day-guide-back {
          display: inline-flex;
          align-items: center;
          font-size: 14px;
          font-weight: 700;
          color: #E2E8F0 !important;
          text-decoration: none;
          margin-bottom: 24px;
          transition: color 0.2s;
          font-family: var(--font-plus-jakarta-sans), "Plus Jakarta Sans", sans-serif !important;
        }

        .day-guide-back:hover {
          color: #FFFFFF !important;
        }

        .day-guide-badge {
          display: inline-block;
          padding: 6px 12px;
          background-color: rgba(255, 212, 70, 0.25);
          color: #FFD446;
          font-size: 11px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 1px;
          border-radius: 9999px;
          margin-bottom: 12px;
          font-family: var(--font-plus-jakarta-sans), "Plus Jakarta Sans", sans-serif !important;
          border: 1px solid rgba(255, 212, 70, 0.3);
        }

        .day-guide-title {
          font-size: 32px;
          font-weight: 800;
          color: #FFFFFF !important;
          margin-top: 0;
          margin-bottom: 12px;
          letter-spacing: -0.5px;
          line-height: 1.25;
          text-transform: none !important;
          font-family: var(--font-plus-jakarta-sans), "Plus Jakarta Sans", sans-serif !important;
          text-shadow: 0 2px 4px rgba(0,0,0,0.5);
        }

        .day-guide-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 16px;
          font-size: 13px;
          font-weight: 600;
          color: #E2E8F0 !important;
          border-bottom: 1px solid rgba(255, 255, 255, 0.25);
          padding-bottom: 16px;
          margin-bottom: 24px;
          align-items: center;
          font-family: var(--font-plus-jakarta-sans), "Plus Jakarta Sans", sans-serif !important;
        }

        .day-guide-meta-item {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .day-guide-meta-item svg {
          width: 16px;
          height: 16px;
          color: #CBD5E1 !important;
          flex-shrink: 0;
        }

        .day-guide-meta-dot {
          color: #94A3B8;
        }

        .day-guide-intro {
          font-size: 16px;
          line-height: 1.6;
          color: #F8FAFC !important;
          margin-top: 0;
          margin-bottom: 24px;
          font-weight: 500;
          font-family: var(--font-plus-jakarta-sans), "Plus Jakarta Sans", sans-serif !important;
          text-shadow: 0 1px 2px rgba(0,0,0,0.5);
        }

        .day-guide-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 24px;
        }

        @media (min-width: 1024px) {
          .day-guide-grid {
            grid-template-columns: 1fr 1fr;
            gap: 32px;
          }
        }

        .day-guide-card {
          background-color: rgba(255, 255, 255, 0.94) !important;
          border: 1px solid rgba(255, 255, 255, 0.15) !important;
          backdrop-filter: blur(10px);
          border-radius: 16px;
          padding: 24px;
          display: flex;
          flex-direction: column;
          box-shadow: 0 10px 25px -5px rgba(0,0,0,0.3), 0 8px 10px -6px rgba(0,0,0,0.3);
          transition: box-shadow 0.2s, transform 0.2s;
          box-sizing: border-box;
          font-family: var(--font-plus-jakarta-sans), "Plus Jakarta Sans", sans-serif !important;
        }

        .day-guide-card:hover {
          box-shadow: 0 20px 25px -5px rgba(0,0,0,0.4), 0 10px 10px -5px rgba(0,0,0,0.4);
          transform: translateY(-2px);
        }

        .day-guide-card-header {
          display: flex;
          align-items: flex-start;
          gap: 16px;
          margin-bottom: 16px;
        }

        .day-guide-card-icon {
          background-color: rgba(255, 212, 70, 0.15);
          color: #111827;
          padding: 10px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .day-guide-card-icon svg {
          width: 20px;
          height: 20px;
        }

        .day-guide-card-title-section {
          flex: 1;
        }

        .day-guide-card-title {
          font-size: 18px;
          font-weight: 700;
          color: #111827;
          margin: 0;
          font-family: var(--font-plus-jakarta-sans), "Plus Jakarta Sans", sans-serif !important;
        }

        .day-guide-card-desc {
          font-size: 14px;
          line-height: 1.5;
          color: #4B5563;
          margin-top: 6px;
          margin-bottom: 0;
          font-family: var(--font-plus-jakarta-sans), "Plus Jakarta Sans", sans-serif !important;
        }

        .day-guide-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 12px 20px;
          background-color: #FFD446;
          color: #111827;
          font-weight: 700;
          font-size: 14px;
          text-decoration: none;
          border-radius: 10px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.05);
          transition: background-color 0.2s, transform 0.1s;
          font-family: var(--font-plus-jakarta-sans), "Plus Jakarta Sans", sans-serif !important;
        }

        .day-guide-btn:hover {
          background-color: #F5C518;
        }

        .day-guide-btn:active {
          transform: scale(0.98);
        }

        .day-guide-btn svg {
          width: 14px;
          height: 14px;
          margin-left: 6px;
        }

        .day-guide-steps {
          border-top: 1px solid #F3F4F6;
          padding-top: 16px;
          margin-top: auto; /* Push step details to bottom of card */
        }

        .day-guide-steps-title {
          font-size: 11px;
          font-weight: 800;
          color: #4B5563;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-top: 0;
          margin-bottom: 10px;
          font-family: var(--font-plus-jakarta-sans), "Plus Jakarta Sans", sans-serif !important;
        }

        .day-guide-steps-list {
          list-style-type: decimal;
          list-style-position: inside;
          padding-left: 0;
          margin: 0;
        }

        .day-guide-steps-list li {
          font-size: 13.5px;
          line-height: 1.55;
          color: #4B5563;
          margin-bottom: 8px;
          font-family: var(--font-plus-jakarta-sans), "Plus Jakarta Sans", sans-serif !important;
        }

        .day-guide-steps-list li code {
          background-color: #F3F4F6;
          border: 1px solid #E5E7EB;
          padding: 2px 6px;
          border-radius: 4px;
          font-family: monospace;
          font-size: 12px;
          color: #1F2937;
        }

        .day-guide-banner {
          background-color: rgba(15, 23, 42, 0.5) !important;
          border: 1px solid rgba(255, 212, 70, 0.4) !important;
          backdrop-filter: blur(8px);
          border-radius: 16px;
          padding: 16px;
          text-align: center;
          margin-top: 24px;
          font-family: var(--font-plus-jakarta-sans), "Plus Jakarta Sans", sans-serif !important;
        }

        .day-guide-banner p {
          margin: 0;
          font-weight: 700;
          color: #FFFFFF !important;
          font-size: 14.5px;
          text-shadow: 0 1px 2px rgba(0,0,0,0.5);
        }

        .day-challenge-card {
          background-color: rgba(255, 212, 70, 0.15) !important;
          border: 1px solid rgba(255, 212, 70, 0.4) !important;
          border-left: 5px solid #FFD446 !important;
          backdrop-filter: blur(10px);
          border-radius: 16px;
          padding: 24px;
          margin-top: 32px;
          margin-bottom: 24px;
          box-shadow: 0 10px 25px -5px rgba(0,0,0,0.2);
          box-sizing: border-box;
          font-family: var(--font-plus-jakarta-sans), "Plus Jakarta Sans", sans-serif !important;
        }

        .day-challenge-card-title {
          font-size: 20px;
          font-weight: 800;
          color: #FFD446;
          margin: 0 0 10px 0;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .day-challenge-card-desc {
          font-size: 14.5px;
          line-height: 1.6;
          color: #F8FAFC !important;
          margin: 0;
          font-weight: 500;
        }

        .day-guide-placeholder {
          background-color: #FFFFFF;
          border: 1px solid rgba(0, 0, 0, 0.08);
          border-radius: 16px;
          padding: 48px 32px;
          text-align: center;
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
          font-family: var(--font-plus-jakarta-sans), "Plus Jakarta Sans", sans-serif !important;
        }

        .day-guide-placeholder-icon {
          width: 56px;
          height: 56px;
          background-color: rgba(255, 212, 70, 0.1);
          color: #855B00;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 16px;
        }

        .day-guide-placeholder-icon svg {
          width: 28px;
          height: 28px;
        }

        .day-guide-placeholder-title {
          font-size: 22px;
          font-weight: 800;
          color: #111827;
          margin-top: 0;
          margin-bottom: 8px;
        }

        .day-guide-placeholder-desc {
          font-size: 14.5px;
          color: #4B5563;
          max-w: 400px;
          margin: 0 auto 20px;
          line-height: 1.5;
        }

        @media (max-width: 640px) {
          .day-guide-body {
            padding: 24px 16px !important;
          }
          .day-guide-title {
            font-size: 24px;
          }
          .day-guide-meta {
            flex-direction: column;
            align-items: flex-start;
            gap: 8px;
            padding-bottom: 12px;
          }
          .day-guide-meta-dot {
            display: none;
          }
          .day-guide-card {
            padding: 20px;
          }
        }
      `}</style>

      <div className="day-guide-container">
        {/* Back Link */}
        <div>
          <Link href="/dashboard?tab=schedule" className="day-guide-back">
            <svg
              style={{ marginRight: "8px", width: "16px", height: "16px" }}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth="2.5"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Back to Schedule
          </Link>
        </div>

        {/* Header Section */}
        <header style={{ marginBottom: "24px" }}>
          <span className="day-guide-badge">
            {dayNumber === 1 ? "GETTING STARTED — DAY 1" : dayNumber === 2 ? "DAY 2 — GETTING FAMILIAR TO GITHUB" : `DAY ${dayNumber} — GUIDE`}
          </span>
          <h1 className="day-guide-title">
            {session.title}
          </h1>

          {/* Meta Info */}
          <div className="day-guide-meta">
            <div className="day-guide-meta-item">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2" />
              </svg>
              {session.time}
            </div>
            <span className="day-guide-meta-dot">•</span>
            <div className="day-guide-meta-item">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {formattedDate}
            </div>
            <span className="day-guide-meta-dot">•</span>
            <div className="day-guide-meta-item">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {SCHEDULE_VENUE}
            </div>
          </div>
        </header>

        {/* Content Section */}
        <main>
          {dayNumber === 1 && (
            <div>
              {/* Intro Line */}
              <p className="day-guide-intro">
                Complete these essential prerequisite steps to configure your local development environment before the first hands-on session.
              </p>

              {/* Day 1 Grid */}
              <div className="day-guide-grid">
                {/* Step 1: Install Git */}
                <section className="day-guide-card">
                  <div className="day-guide-card-header">
                    <div className="day-guide-card-icon">
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div className="day-guide-card-title-section">
                      <h2 className="day-guide-card-title">1. Local Environment Setup: Install Git</h2>
                      <p className="day-guide-card-desc">
                        Git is a distributed version control system that tracks changes in your source code during software development. Installing Git locally is required to manage project history and interact with remote repositories.
                      </p>
                    </div>
                  </div>

                  {/* Primary Button */}
                  <div style={{ margin: "20px 0" }}>
                    <a
                      href="https://git-scm.com/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="day-guide-btn"
                    >
                      Download Git Installer
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  </div>

                  {/* Sub Guide */}
                  <div className="day-guide-steps">
                    <h3 className="day-guide-steps-title">Quick Setup Instructions</h3>
                    <ol className="day-guide-steps-list">
                      <li>Visit the official Git website to download the installer for your operating system (Windows, macOS, or Linux).</li>
                      <li>Execute the installer. We recommend keeping the default configuration settings unless you have specific environment requirements.</li>
                      <li>Verify the installation by opening your terminal or command prompt and running the command: <code>git --version</code>.</li>
                    </ol>
                  </div>
                </section>

                {/* Step 2: Create a GitHub Account */}
                <section className="day-guide-card">
                  <div className="day-guide-card-header">
                    <div className="day-guide-card-icon">
                      <svg viewBox="0 0 24 24" fill="currentColor">
                        <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.167 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.577.688.479C19.138 20.164 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
                      </svg>
                    </div>
                    <div className="day-guide-card-title-section">
                      <h2 className="day-guide-card-title">2. Cloud Configuration: Create a GitHub Account</h2>
                      <p className="day-guide-card-desc">
                        GitHub is a cloud-based hosting service for Git repositories, enabling code collaboration, issue tracking, and automated deployments. A free account is required to publish your work and submit assignments.
                      </p>
                    </div>
                  </div>

                  {/* Primary Button */}
                  <div style={{ margin: "20px 0" }}>
                    <a
                      href="https://github.com/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="day-guide-btn"
                    >
                      Create GitHub Account
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  </div>

                  {/* Sub Guide */}
                  <div className="day-guide-steps">
                    <h3 className="day-guide-steps-title">Registration Tips</h3>
                    <ol className="day-guide-steps-list">
                      <li>Click the button above to navigate to GitHub's sign-up page.</li>
                      <li>Choose a professional username (e.g., combining your first and last name), as this will serve as your public developer identity.</li>
                      <li>Confirm your registration and verify your email address to activate your account.</li>
                    </ol>
                  </div>
                </section>
              </div>

              {/* Closing Note */}
              <div className="day-guide-banner">
                <p>
                  🎉 Once both steps are completed, your environment is ready for the session. We look forward to seeing you at {session.time.split("–")[0]}!
                </p>
              </div>
            </div>
          )}

          {dayNumber === 2 && (
            <div>
              {/* Intro Line */}
              <p className="day-guide-intro">
                Before today's session, set up your GitHub Profile README — a special repository that displays a personal introduction on your GitHub profile page.
              </p>

              {/* Day 2 Grid */}
              <div className="day-guide-grid">
                {/* Step 1: Create Your Profile Repository */}
                <section className="day-guide-card">
                  <div className="day-guide-card-header">
                    <div className="day-guide-card-icon">
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                      </svg>
                    </div>
                    <div className="day-guide-card-title-section">
                      <h2 className="day-guide-card-title">1. Setup: Create Your Profile Repository</h2>
                      <p className="day-guide-card-desc">
                        GitHub has a special feature: if you create a repository with the exact same name as your GitHub username, its README file will automatically display on your profile page.
                      </p>
                    </div>
                  </div>

                  {/* Primary Button */}
                  <div style={{ margin: "20px 0" }}>
                    <a
                      href="https://github.com/new"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="day-guide-btn"
                    >
                      Go to GitHub
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  </div>

                  {/* Sub Guide */}
                  <div className="day-guide-steps">
                    <h3 className="day-guide-steps-title">Quick Setup Instructions</h3>
                    <ol className="day-guide-steps-list">
                      <li>Go to github.com and click the "+" icon → "New repository"</li>
                      <li>Name the repository exactly the same as your GitHub username (this is what makes it special — GitHub will detect this automatically)</li>
                      <li>Make sure the repository is set to Public</li>
                      <li>Check the box to "Add a README file" when creating it</li>
                      <li>Click "Create repository" — you'll see a note from GitHub confirming this is your special profile README repo</li>
                    </ol>
                  </div>
                </section>

                {/* Step 2: Build Your README with GPRM */}
                <section className="day-guide-card">
                  <div className="day-guide-card-header">
                    <div className="day-guide-card-icon">
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div className="day-guide-card-title-section">
                      <h2 className="day-guide-card-title">2. Customization: Build Your README with GPRM</h2>
                      <p className="day-guide-card-desc">
                        GPRM (GitHub Profile README Maker) is a free tool that lets you build a polished, professional profile README visually — no need to write raw markdown from scratch.
                      </p>
                    </div>
                  </div>

                  {/* Primary Button */}
                  <div style={{ margin: "20px 0" }}>
                    <a
                      href="https://gprm.itsvg.in/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="day-guide-btn"
                    >
                      Open GPRM
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  </div>

                  {/* Sub Guide */}
                  <div className="day-guide-steps">
                    <h3 className="day-guide-steps-title">Quick Setup Instructions</h3>
                    <ol className="day-guide-steps-list">
                      <li>Open GPRM and explore the different sections it offers (intro, skills, GitHub stats, social links, etc.)</li>
                      <li>Customize each section with your own details — your name, what you're learning, your skills, and links to your socials/portfolio</li>
                      <li>Once you're happy with the preview, copy the generated markdown code</li>
                      <li>Go back to your profile repository on GitHub, open the README.md file, click edit (pencil icon), paste in the generated code, and commit the change</li>
                      <li>Visit your GitHub profile page (github.com/your-username) to see your new README live</li>
                    </ol>
                  </div>
                </section>
              </div>

              {/* Competition Callout Section */}
              <div className="day-challenge-card">
                <h3 className="day-challenge-card-title">
                  <span>🏆</span> Today's Challenge
                </h3>
                <p className="day-challenge-card-desc">
                  This is a competition! The student with the best-designed, most creative GitHub Profile README today will earn a spot in the Top 3 of the leaderboard — plus a special surprise. Make your profile stand out!
                </p>
              </div>

              {/* Closing Note */}
              <div className="day-guide-banner">
                <p>
                  🎉 Once your profile README is live, you're ready for today's session — see you at {session.time.split("–")[0]}!
                </p>
              </div>
            </div>
          )}

          {dayNumber === 3 && (
            <div>
              {/* Intro Line */}
              <p className="day-guide-intro">
                Access the essential resources, documentation, interactive tools, and repositories for today's hands-on Git CLI session.
              </p>

              {/* Day 3 Grid */}
              <div className="day-guide-grid">
                {/* Resource 1: Git Documentation */}
                <section className="day-guide-card">
                  <div className="day-guide-card-header">
                    <div className="day-guide-card-icon">
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                    </div>
                    <div className="day-guide-card-title-section">
                      <h2 className="day-guide-card-title">Git Documentation</h2>
                      <p className="day-guide-card-desc">
                        Official documentation for every Git command. Use this as your primary reference guide.
                      </p>
                    </div>
                  </div>

                  {/* Primary Button */}
                  <div style={{ margin: "20px 0" }}>
                    <a
                      href="https://git-scm.com/docs"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="day-guide-btn"
                    >
                      Open Documentation
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  </div>

                  {/* Sub Guide */}
                  <div className="day-guide-steps">
                    <h3 className="day-guide-steps-title">Quick Instructions</h3>
                    <ol className="day-guide-steps-list">
                      <li>Click <strong>Open Documentation</strong>.</li>
                      <li>Search any Git command (e.g., <code>git status</code>).</li>
                      <li>Read examples and options.</li>
                      <li>Use it whenever you're stuck.</li>
                    </ol>
                  </div>
                </section>

                {/* Resource 2: Git Cheat Sheet */}
                <section className="day-guide-card">
                  <div className="day-guide-card-header">
                    <div className="day-guide-card-icon">
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div className="day-guide-card-title-section">
                      <h2 className="day-guide-card-title">Git Cheat Sheet</h2>
                      <p className="day-guide-card-desc">
                        One-page PDF containing all beginner Git commands. Keep this open during hands-on exercises.
                      </p>
                    </div>
                  </div>

                  {/* Primary Button */}
                  <div style={{ margin: "20px 0" }}>
                    <a
                      href="https://education.github.com/git-cheat-sheet-education.pdf"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="day-guide-btn"
                    >
                      Download Cheat Sheet
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                    </a>
                  </div>

                  {/* Sub Guide */}
                  <div className="day-guide-steps">
                    <h3 className="day-guide-steps-title">Quick Instructions</h3>
                    <ol className="day-guide-steps-list">
                      <li>Download the PDF cheat sheet.</li>
                      <li>Keep it open in a side window during practice.</li>
                      <li>Refer to commands while typing in your terminal.</li>
                    </ol>
                  </div>
                </section>

                {/* Resource 3: Interactive Git Practice */}
                <section className="day-guide-card">
                  <div className="day-guide-card-header">
                    <div className="day-guide-card-icon">
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="day-guide-card-title-section">
                      <h2 className="day-guide-card-title">Interactive Git Practice</h2>
                      <p className="day-guide-card-desc">
                        Learn Git visually using interactive animations. Best for visual understanding of branches and commits.
                      </p>
                    </div>
                  </div>

                  {/* Primary Button */}
                  <div style={{ margin: "20px 0" }}>
                    <a
                      href="https://learngitbranching.js.org/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="day-guide-btn"
                    >
                      Start Practice
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                      </svg>
                    </a>
                  </div>

                  {/* Sub Guide */}
                  <div className="day-guide-steps">
                    <h3 className="day-guide-steps-title">Quick Instructions</h3>
                    <ol className="day-guide-steps-list">
                      <li>Open the website in your browser.</li>
                      <li>Start from the Introduction levels.</li>
                      <li>Complete the first few exercises.</li>
                      <li>Observe how commits and branches work visually.</li>
                    </ol>
                  </div>
                </section>

                {/* Resource 4: Today's Demo Repository */}
                <section className="day-guide-card">
                  <div className="day-guide-card-header">
                    <div className="day-guide-card-icon">
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                      </svg>
                    </div>
                    <div className="day-guide-card-title-section">
                      <h2 className="day-guide-card-title">Today's Demo Repository</h2>
                      <p className="day-guide-card-desc">
                        Clone this repository and follow along with the instructor's live exercises during class.
                      </p>
                    </div>
                  </div>

                  {/* Primary Button */}
                  <div style={{ margin: "20px 0" }}>
                    <a
                      href={`https://github.com/${githubUsername}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="day-guide-btn"
                    >
                      Open Repository
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  </div>

                  {/* Sub Guide */}
                  <div className="day-guide-steps">
                    <h3 className="day-guide-steps-title">Quick Instructions</h3>
                    <ol className="day-guide-steps-list">
                      <li>Open the repository on GitHub.</li>
                      <li>Clone it locally using your Git terminal.</li>
                      <li>Follow along with the instructor.</li>
                      <li>Make your own commits during class.</li>
                    </ol>
                  </div>
                </section>

                {/* Resource 5: Assignment Repository */}
                <section className="day-guide-card" style={{ gridColumn: "span 1" }}>
                  <div className="day-guide-card-header">
                    <div className="day-guide-card-icon">
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                      </svg>
                    </div>
                    <div className="day-guide-card-title-section">
                      <h2 className="day-guide-card-title">Assignment Submission</h2>
                      <p className="day-guide-card-desc">
                        Submit your hands-on exercises and portfolio commit details for evaluation.
                      </p>
                    </div>
                  </div>

                  {/* Primary Button */}
                  <div style={{ margin: "20px 0" }}>
                    <Link
                      href="/dashboard?tab=assignments"
                      className="day-guide-btn"
                    >
                      Submit Assignment
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                      </svg>
                    </Link>
                  </div>

                  {/* Sub Guide */}
                  <div className="day-guide-steps">
                    <h3 className="day-guide-steps-title">Quick Instructions</h3>
                    <ol className="day-guide-steps-list">
                      <li>Complete the assigned tasks on your repository.</li>
                      <li>Click the button above to go to the submission form.</li>
                      <li>Provide your repository link and optional notes.</li>
                      <li>Submit to record your progress and earn XP.</li>
                    </ol>
                  </div>
                </section>
              </div>

              {/* Closing Note */}
              <div className="day-guide-banner">
                <p>
                  🎉 Once you have reviewed the cheat sheet and prepared your environment, you're ready for the session!
                </p>
              </div>
            </div>
          )}

          {dayNumber !== 1 && dayNumber !== 2 && dayNumber !== 3 && (
            <div className="day-guide-placeholder">
              <div className="day-guide-placeholder-icon">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h2 className="day-guide-placeholder-title">Details Coming Soon</h2>
              <p className="day-guide-placeholder-desc">
                The checklist, setup instructions, and resources for Day {session.day} will be made live shortly before the session begins.
              </p>
              <Link
                href="/dashboard?tab=schedule"
                className="day-guide-btn"
              >
                Return to Schedule
              </Link>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
