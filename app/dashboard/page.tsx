"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AssetImage from "@/components/AssetImage";
import LoadingSpinner from "@/components/LoadingSpinner";
import CountdownRing from "@/components/CountdownRing";
import { INSTITUTION_CODE, WORKSHOP_DAYS, UNKNOWN_BRANCH_LABEL, ATTENDANCE_WINDOW_MINUTES } from "@/lib/config";

// Finalized, in-person curriculum. Dates are the real scheduled session days.
const SCHEDULE_DAYS = [
  { day: 1, date: "2026-07-15", time: "12:30 PM – 1:30 PM", title: "Why Version Control? Setup & First Repo", desc: "Understanding Git as version control, installing Git, creating a GitHub account, and making your first repository." },
  { day: 2, date: "2026-07-16", time: "12:30 PM – 1:30 PM", title: "Git Basics — Commits, Staging & Logs", desc: "Hands-on with git init, add, commit, status, and log — building real commit history on your portfolio project." },
  { day: 3, date: "2026-07-17", time: "12:30 PM – 1:30 PM", title: "Branching Strategies & Resolving Conflicts", desc: "Creating branches, merging safely, and resolving a real merge conflict live in the Conflict Arena challenge." },
  { day: 4, date: "2026-07-18", time: "12:30 PM – 1:30 PM", title: "Going Remote — Push, Pull & First Deploy", desc: "Connecting to GitHub remotely and deploying your portfolio live via GitHub Pages for the first time." },
  { day: 5, date: "2026-07-19", time: "12:30 PM – 1:30 PM", title: "Pull Requests, Issues & Forking", desc: "Forking a shared repository, opening your first Pull Request, and going through a live PR review." },
  { day: 6, date: "2026-07-20", time: "12:30 PM – 1:30 PM", title: "Repo Hygiene, Deployment Polish & Industry Guest", desc: "Cleaning up your repo with .gitignore and a strong README, finalizing your deployed site, with an invited industry guest talk." },
  { day: 7, date: "2026-07-21", time: "12:30 PM – 1:30 PM", title: "Open Source Demo Day & Community Launch", desc: "Live merging of Pull Requests, final project demos, and the launch of the ongoing AJU GitHub community. No certificates are issued — the outcomes are your live deployed portfolio and merged contribution." },
];

const SCHEDULE_VENUE = "Computer Lab 2, Room No. 329, Block Baudhayana, Arka Jain University";

const STATUS_LABEL: Record<string, string> = {
  COMPLETED: "Completed",
  TODAY: "Today · Live",
  UPCOMING: "Upcoming",
  MISSED: "Session Passed",
};

export default function DashboardPage() {
  const router = useRouter();

  // Auth gate: only an actual registered user (saved on sign-up) may view this.
  const [registeredUser, setRegisteredUser] = useState<any>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("user_registration");
    if (saved) {
      try {
        setRegisteredUser(JSON.parse(saved));
      } catch (e) {
        console.error("Error reading registration data:", e);
      }
    }
    setChecked(true);
  }, []);

  useEffect(() => {
    if (checked && !registeredUser) {
      router.replace("/register");
    }
  }, [checked, registeredUser, router]);

  // Tab state
  const [currentTab, setCurrentTab] = useState("home");

  // LMS States
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [peers, setPeers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // XP and streak are DERIVED from REAL activity (attendance marks + submissions),
  // so a brand-new student starts at 0 XP / 0-day streak and the values persist
  // across reloads (they come from the server, not a hardcoded starting value).
  const xp = attendance.length * 50 + submissions.length * 100;
  const streak = attendance.length;

  // Form states for submission
  const [submittingAssignmentId, setSubmittingAssignmentId] = useState<string>("");
  const [submissionRepo, setSubmissionRepo] = useState<string>("");
  const [submissionLive, setSubmissionLive] = useState<string>("");
  const [submittingHomework, setSubmittingHomework] = useState<boolean>(false);

  // Profile Edit State
  const [profileBio, setProfileBio] = useState<string>("");
  const [profileGithub, setProfileGithub] = useState<string>("");
  const [profileLinkedin, setProfileLinkedin] = useState<string>("");
  const [savingProfile, setSavingProfile] = useState<boolean>(false);

  // Profile photo state (shared with Student Pass + sidebar avatar)
  const [profilePhoto, setProfilePhoto] = useState<string>(
    typeof window !== "undefined" ? localStorage.getItem("profile_photo") || "" : ""
  );
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string>("");

  // --- Live attendance window state (polled from the server) ---
  const [activeWindow, setActiveWindow] = useState<any>(null);
  const [alreadyCheckedIn, setAlreadyCheckedIn] = useState(false);
  const [checkinLoading, setCheckinLoading] = useState(false);
  const [checkinError, setCheckinError] = useState("");
  const [checkinSuccess, setCheckinSuccess] = useState(false);
  const [nowTs, setNowTs] = useState(Date.now());

  // Poll the active attendance window while the Attendance tab is open.
  useEffect(() => {
    if (currentTab !== "attendance" || !registeredUser) return;
    let alive = true;
    const poll = async () => {
      try {
        const res = await fetch(
          `/api/attendance/window?enrollment_number=${encodeURIComponent(registeredUser.enrollmentNumber)}`
        );
        const data = await res.json();
        if (!alive) return;
        if (data.success && data.window) {
          setActiveWindow(data.window);
          if (data.already_checked_in) {
            setAlreadyCheckedIn(true);
            setCheckinSuccess(true);
          }
        } else {
          setActiveWindow(null);
        }
      } catch (e) {
        /* keep previous state on transient errors */
      }
    };
    const tick = () => setNowTs(Date.now());
    poll();
    const pollInt = setInterval(poll, 3000);
    const tickInt = setInterval(tick, 1000);
    return () => {
      alive = false;
      clearInterval(pollInt);
      clearInterval(tickInt);
    };
  }, [currentTab, registeredUser]);

  // Load LMS data
  useEffect(() => {
    if (!registeredUser) return;
    setLoading(true);

    const load = async () => {
      try {
        const [annRes, assRes, subRes, attRes, peerRes] = await Promise.all([
          fetch("/api/announcements").then((r) => r.json()),
          fetch("/api/assignments").then((r) => r.json()),
          fetch(`/api/submissions?student_id=${registeredUser.enrollmentNumber}`).then((r) => r.json()),
          fetch(`/api/attendance?enrollment_number=${encodeURIComponent(registeredUser.enrollmentNumber)}`).then((r) => r.json()),
          fetch("/api/register").then((r) => r.json()),
        ]);

        if (annRes.success) setAnnouncements(annRes.announcements);
        if (assRes.success) setAssignments(assRes.assignments);
        if (subRes.success) setSubmissions(subRes.submissions);
        if (attRes.success) setAttendance(attRes.attendance);
        if (peerRes.success && Array.isArray(peerRes.registrations)) setPeers(peerRes.registrations);
      } catch (e) {
        console.error("Failed to load dashboard data:", e);
      } finally {
        setLoading(false);
      }
    };

    load();

    // Seed editable fields from localStorage first (instant, offline-friendly),
    // then reconcile with the persisted Supabase profile record.
    setProfileBio(localStorage.getItem("profile_bio") || "Passionate computer science student learning Git!");
    setProfileGithub(localStorage.getItem("profile_github") || registeredUser.githubUsername || "");
    setProfileLinkedin(localStorage.getItem("profile_linkedin") || "");

    fetch(`/api/profile?enrollment_number=${encodeURIComponent(registeredUser.enrollmentNumber)}`)
      .then((r) => r.json())
      .then((res) => {
        if (res.success && res.profile) {
          if (res.profile.bio != null) setProfileBio(res.profile.bio);
          if (res.profile.github_username != null) setProfileGithub(res.profile.github_username);
          if (res.profile.linkedin_url != null) setProfileLinkedin(res.profile.linkedin_url);
          if (res.profile.avatar_url) {
            setProfilePhoto(res.profile.avatar_url);
            localStorage.setItem("profile_photo", res.profile.avatar_url);
          }
        }
      })
      .catch((e) => console.error("Failed to load profile:", e));
  }, [registeredUser]);

  // Cropper & Cache states
  const [photoTimestamp, setPhotoTimestamp] = useState<number>(Date.now());
  const [showCropper, setShowCropper] = useState<boolean>(false);
  const [cropperRawSrc, setCropperRawSrc] = useState<string>("");
  const [cropScale, setCropScale] = useState<number>(1);
  const [cropX, setCropX] = useState<number>(0);
  const [cropY, setCropY] = useState<number>(0);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError("");
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(file.type)) {
      setUploadError("Only JPG, PNG, or WEBP images are allowed.");
      e.target.value = "";
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setUploadError("Image is too large. Maximum size is 5MB.");
      e.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setCropperRawSrc(reader.result as string);
      setCropScale(1);
      setCropX(0);
      setCropY(0);
      setShowCropper(true);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleApplyCrop = () => {
    const imgElement = new Image();
    imgElement.src = cropperRawSrc;
    imgElement.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 300;
      canvas.height = 300;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, 300, 300);

      const natW = imgElement.naturalWidth;
      const natH = imgElement.naturalHeight;
      const baseWidth = 300;
      const baseHeight = 300 * (natH / natW);

      ctx.save();
      // Translate to center, apply offset, scale, and draw centered
      ctx.translate(150 + cropX * 1.5, 150 + cropY * 1.5);
      ctx.scale(cropScale, cropScale);
      ctx.drawImage(imgElement, -150, -baseHeight / 2, baseWidth, baseHeight);
      ctx.restore();

      canvas.toBlob((blob) => {
        if (!blob) return;
        const croppedFile = new File([blob], "profile_photo.png", { type: "image/png" });
        setPhotoFile(croppedFile);
        setPhotoPreview(canvas.toDataURL("image/png"));
        setShowCropper(false);
      }, "image/png");
    };
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    setUploadError("");

    localStorage.setItem("profile_bio", profileBio);
    localStorage.setItem("profile_github", profileGithub);
    localStorage.setItem("profile_linkedin", profileLinkedin);

    try {
      const form = new FormData();
      form.append("enrollment_number", registeredUser.enrollmentNumber);
      form.append("bio", profileBio);
      form.append("github_username", profileGithub);
      form.append("linkedin_url", profileLinkedin);
      if (photoFile) form.append("photo", photoFile);

      const res = await fetch("/api/profile", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to save profile.");
      }

      if (data.avatar_url) {
        setProfilePhoto(data.avatar_url);
        localStorage.setItem("profile_photo", data.avatar_url);
        setPhotoTimestamp(Date.now()); // Update timestamp to bypass cache
      }
      if (photoPreview) {
        setPhotoPreview(null);
      }
      setPhotoFile(null);
      alert("Profile updated successfully!");
    } catch (err: any) {
      alert(err.message || "Failed to save profile.");
    } finally {
      setSavingProfile(false);
    }
  };

  // Normalize a GitHub handle/url into a clickable https URL.
  const githubUrl = (handle: string) => {
    const h = (handle || "").trim();
    if (!h) return "";
    return /^https?:\/\//i.test(h) ? h : `https://github.com/${h.replace(/^@/, "")}`;
  };

  const handleSubmitHomework = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!submissionRepo) return alert("Repository URL is required.");
    setSubmittingHomework(true);

    try {
      const response = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assignment_id: submittingAssignmentId,
          student_id: registeredUser.enrollmentNumber,
          repo_url: submissionRepo,
          live_url: submissionLive
        })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setSubmissions(prev => {
          const filtered = prev.filter(s => s.assignment_id !== submittingAssignmentId);
          return [...filtered, data.submission];
        });
        alert("Assignment submitted successfully!");
        setSubmissionRepo("");
        setSubmissionLive("");
        setSubmittingAssignmentId("");
      } else {
        alert(data.error || "Submission failed.");
      }
    } catch (err) {
      alert("Network error.");
    } finally {
      setSubmittingHomework(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("user_registration");
    setRegisteredUser(null);
    router.replace("/register");
  };

  if (!registeredUser) {
    return (
      <div style={{ padding: "80px 20px", textAlign: "center" }}>
        <p>Redirecting to registration…</p>
      </div>
    );
  }



  const handleCheckIn = async () => {
    if (!activeWindow) return;
    setCheckinLoading(true);
    setCheckinError("");
    try {
      const res = await fetch("/api/attendance/check-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enrollment_number: registeredUser.enrollmentNumber,
          window_id: activeWindow.id,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setCheckinSuccess(true);
        setAlreadyCheckedIn(true);
        setAttendance((prev) => [
          ...prev,
          { session_day: data.day, verified_at: new Date().toISOString() },
        ]);
      } else {
        setCheckinError(data.error || "Check-in failed. Please try again.");
      }
    } catch (e) {
      setCheckinError("Network error. Please try again.");
    } finally {
      setCheckinLoading(false);
    }
  };

  // Compute each session's real status from the actual calendar date and the
  // student's real attendance record (never hardcoded).
  //  - TODAY: the session's scheduled date is today (this session is live now).
  //  - COMPLETED: a real attendance record exists for this day.
  //  - MISSED / "Session Passed": the date has passed with no attendance record.
  //  - UPCOMING: the scheduled date is still in the future.
  const getDayStatus = (day: number, dateStr: string): keyof typeof STATUS_LABEL => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const session = new Date(`${dateStr}T00:00:00`);
    const sessionStart = new Date(session.getFullYear(), session.getMonth(), session.getDate());
    const attended = attendance.some((l: any) => Number(l.session_day) === day);
    if (todayStart.getTime() === sessionStart.getTime()) return "TODAY";
    if (attended) return "COMPLETED";
    if (todayStart.getTime() > sessionStart.getTime()) return "MISSED";
    return "UPCOMING";
  };

  // Build the leaderboard from the real current user + real registered peers.
  const leaderboard = [
    { name: registeredUser.name, branch: registeredUser.branch, xp, you: true },
    ...peers
      .filter((p: any) => p.enrollmentNumber !== registeredUser.enrollmentNumber)
      .map((p: any) => ({ name: p.name, branch: p.branch, xp: null, you: false })),
  ].sort((a, b) => (b.xp ?? -1) - (a.xp ?? -1));

  // Real activity feed derived from actual submissions + attendance (no fake commits).
  const activity = [
    ...submissions.map((s: any) => ({
      type: "submission",
      text: `Submitted assignment · ${s.repo_url}`,
      time: s.submitted_at,
    })),
    ...attendance.map((a: any) => ({
      type: "attendance",
      text: `Attendance marked for Day ${a.session_day}`,
      time: a.verified_at,
    })),
  ].sort((a: any, b: any) => new Date(b.time).getTime() - new Date(a.time).getTime());

  return (
    <div className="dashboard-view">
      {/* Left Sidebar */}
      <aside className="db-sidebar">
        <a href="/" className="db-logo" style={{ display: "flex", justifyContent: "center", padding: "10px 0", borderBottom: "1.5px solid var(--black)", cursor: "pointer", width: "100%" }}>
          <img src="/images/github-logo.png" alt="GitHub Logo" style={{ maxHeight: "24px", maxWidth: "24px", objectFit: "contain" }} />
        </a>
        <nav className="db-menu">
          <div className={`db-menu-item ${currentTab === "home" ? "active" : ""}`} onClick={() => setCurrentTab("home")} title="Home">
            <svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/></svg>
          </div>
          <div className={`db-menu-item ${currentTab === "schedule" ? "active" : ""}`} onClick={() => setCurrentTab("schedule")} title="Schedule">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
          </div>
          <div className={`db-menu-item ${currentTab === "attendance" ? "active" : ""}`} onClick={() => setCurrentTab("attendance")} title="Attendance">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
          </div>
          <div className={`db-menu-item ${currentTab === "resources" ? "active" : ""}`} onClick={() => setCurrentTab("resources")} title="Resources">
            <svg viewBox="0 0 24 24"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
          </div>
          <div className={`db-menu-item ${currentTab === "assignments" ? "active" : ""}`} onClick={() => setCurrentTab("assignments")} title="Assignments">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
          </div>
          <div className={`db-menu-item ${currentTab === "leaderboard" ? "active" : ""}`} onClick={() => setCurrentTab("leaderboard")} title="XP Leaderboard">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
          </div>
          <div className={`db-menu-item ${currentTab === "profile" ? "active" : ""}`} onClick={() => setCurrentTab("profile")} title="Profile">
            <svg viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          </div>
        </nav>
      </aside>

      {/* Main Panel */}
      <main className="db-main-content">
        <header className="db-header">
          <h1 className="db-title" style={{ textTransform: "uppercase" }}>{currentTab} Space</h1>
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <span className="db-activity-badge" style={{ backgroundColor: "var(--accent-yellow)", color: "var(--black)", border: "1.5px solid var(--black)" }}>🔥 {streak} Day Streak</span>
            <span className="db-activity-badge" style={{ backgroundColor: "#151304", color: "#fff" }}>⭐ {xp} XP</span>
          </div>
        </header>

        {/* TAB: HOME */}
        {currentTab === "home" && (
          <>
            {/* Welcome Banner */}
            <div className="db-welcome-banner">
              <div className="db-welcome-text-wrapper">
                <span className="db-welcome-tag">Git &amp; GitHub Masterclass</span>
                <h2 className="db-welcome-title">Welcome back, {registeredUser.name}!</h2>
                <p className="db-welcome-desc">
                  Your attendance score is **{Math.round((attendance.length / WORKSHOP_DAYS) * 100)}%**. Attend all {WORKSHOP_DAYS} in-person sessions in Computer Lab 2 (Room 329, Block Baudhayana) to keep your streak alive and earn your live deployed portfolio by Day 7!
                </p>
              </div>
              <AssetImage src="/images/mlsa-badge.png" loading="lazy" alt="MLSA Badge" className="db-welcome-img" style={{ maxHeight: "80px" }} />
            </div>

            {/* Announcements Section */}
            <div className="db-projects-section">
              <h3 className="db-section-title">Latest Announcements</h3>
              <div className="db-project-list">
                {loading ? (
                  <LoadingSpinner label="Loading announcements…" />
                ) : announcements.length > 0 ? (
                  announcements.map((ann) => (
                    <div className="db-project-row" key={ann.id} style={{ display: "block" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                        <h4 className="db-project-name" style={{ fontSize: "16px" }}>{ann.title}</h4>
                        <span style={{ fontSize: "11px", fontWeight: "600", textTransform: "uppercase", padding: "2px 8px", background: "#f7f6f1", borderRadius: "100px" }}>{ann.type}</span>
                      </div>
                      <p style={{ margin: 0, fontSize: "13px", color: "#666" }}>{ann.content}</p>
                    </div>
                  ))
                ) : (
                  <div className="db-project-row">No announcements yet.</div>
                )}
              </div>
            </div>
          </>
        )}

        {/* TAB: SCHEDULE */}
        {currentTab === "schedule" && (
          <div className="db-projects-section">
            <h3 className="db-section-title">In-Person {WORKSHOP_DAYS}-Day Session Timeline</h3>
            <div className="schedule-timeline">
              {SCHEDULE_DAYS.map((session, idx) => {
                const status = getDayStatus(session.day, session.date);
                const isToday = status === "TODAY";
                return (
                  <div
                    className={`schedule-card schedule-card--${status.toLowerCase()}${isToday ? " schedule-card--today" : ""}`}
                    key={session.day}
                    style={{ ["--i" as any]: idx }}
                  >
                    <div className="schedule-node-col">
                      <div className="schedule-node">
                        {status === "COMPLETED" ? (
                          <svg className="schedule-node-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        ) : (
                          <span className="schedule-node-num">D{session.day}</span>
                        )}
                      </div>
                    </div>

                    <div className="schedule-card-body">
                      <span className="schedule-accent" aria-hidden="true" />
                      <div className="schedule-card-head">
                        <span className="schedule-day-label">Day {session.day}</span>
                        <span className={`schedule-tag schedule-tag--${status.toLowerCase()}`}>
                          {status === "COMPLETED" && (
                            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          )}
                          {STATUS_LABEL[status]}
                        </span>
                      </div>
                      <h4 className="schedule-title">{session.title}</h4>
                      <p className="schedule-desc">{session.desc}</p>
                      <div className="schedule-meta">
                        <span className="schedule-chip">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                            <circle cx="12" cy="10" r="3" />
                          </svg>
                          {SCHEDULE_VENUE}
                        </span>
                        <span className="schedule-chip schedule-chip--time">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10" />
                            <path d="M12 6v6l4 2" />
                          </svg>
                          {session.time}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB: ATTENDANCE */}
        {currentTab === "attendance" && (() => {
          const expiresAt = activeWindow ? new Date(activeWindow.expires_at).getTime() : 0;
          const remainingMs = Math.max(0, expiresAt - nowTs);
          const totalMs = ATTENDANCE_WINDOW_MINUTES * 60 * 1000;
          const secs = Math.floor(remainingMs / 1000);
          const mm = String(Math.floor(secs / 60)).padStart(2, "0");
          const ss = String(secs % 60).padStart(2, "0");
          const progress = totalMs ? remainingMs / totalMs : 0;
          const expired = !!activeWindow && remainingMs <= 0;

          return (
            <div className="db-projects-section">
              <h3 className="db-section-title">Attendance Space</h3>

              {/* Check-in status card */}
              <div className="att-checkin-zone">
                {!activeWindow && (
                  <div className="att-status-card att-idle">
                    <div className="att-status-icon">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="9" />
                        <path d="M12 7v5l3 2" />
                      </svg>
                    </div>
                    <h4 className="att-status-title">No attendance window is open</h4>
                    <p className="att-status-sub">
                      Your instructor will open check-in during the live session. This card lights up the moment they do — you can&apos;t check in until then.
                    </p>
                  </div>
                )}

                {activeWindow && !alreadyCheckedIn && (
                  <div className={`att-status-card att-active${expired ? " att-expired" : ""}`}>
                    <span className="att-live-tag">LIVE · CHECK-IN OPEN</span>
                    <h4 className="att-status-title">Check in for Day {activeWindow.day}</h4>
                    <CountdownRing mm={mm} ss={ss} progress={progress} expired={expired} />
                    {checkinError && <div className="att-error">{checkinError}</div>}
                    <button
                      className="att-checkin-btn"
                      onClick={handleCheckIn}
                      disabled={checkinLoading || expired}
                    >
                      {expired
                        ? "Window Closed"
                        : checkinLoading
                        ? "Checking in…"
                        : `CHECK IN NOW — DAY ${activeWindow.day}`}
                    </button>
                    {expired && (
                      <p className="att-status-sub att-status-sub--warn">
                        This check-in window has closed.
                      </p>
                    )}
                  </div>
                )}

                {activeWindow && alreadyCheckedIn && (
                  <div className="att-status-card att-done">
                    <div className="att-check-mark">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </div>
                    <h4 className="att-status-title">You&apos;re checked in for Day {activeWindow.day}</h4>
                    <p className="att-status-sub">Your attendance was recorded. See you at the next session!</p>
                  </div>
                )}
              </div>

              {/* Attendance logs */}
              <div className="att-logs-card">
                <h4 className="att-logs-title">Attendance Logs</h4>
                {attendance.length === 0 ? (
                  <div className="att-empty">No attendance logs yet.</div>
                ) : (
                  <ul className="att-logs-list">
                    {attendance.map((log: any, idx: number) => (
                      <li className="att-log-row" key={idx}>
                        <span className="att-log-day">Day {log.session_day}</span>
                        <span className="att-log-time">{new Date(log.verified_at).toLocaleString()}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          );
        })()}

        {/* TAB: RESOURCES */}
        {currentTab === "resources" && (
          <div className="db-projects-section">
            <h3 className="db-section-title">Session-wise Resources</h3>
            <div className="db-project-list">
              {[
                { title: "Day 1 PPT: Git Fundamentals", type: "PPT", url: "#" },
                { title: "Day 1 PDF: Git Cheat Sheet Commands", type: "PDF", url: "#" },
                { title: "Day 2 Video Recording: Local Commits Showcase", type: "Recording", url: "#" },
                { title: "Official Microsoft Learn Git Path", type: "Microsoft Learn", url: "https://learn.microsoft.com/" },
              ].map((res, idx) => (
                <div className="db-project-row" key={idx}>
                  <div className="db-project-info">
                    <div className="db-project-icon" style={{ fontWeight: "bold" }}>
                      💾
                    </div>
                    <div>
                      <h4 className="db-project-name">{res.title}</h4>
                      <span className="db-project-url">Resource Format: {res.type}</span>
                    </div>
                  </div>
                  <a href={res.url} target="_blank" rel="noopener noreferrer" className="form-submit-btn" style={{ padding: "6px 12px", textDecoration: "none", fontSize: "12px" }}>
                    Get Resource
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB: ASSIGNMENTS */}
        {currentTab === "assignments" && (
          <div className="db-projects-section">
            <h3 className="db-section-title">Course Assignments</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: "24px", alignItems: "start" }}>
              {/* List */}
              <div className="db-project-list">
                {assignments.map((ass) => {
                  const sub = submissions.find(s => s.assignment_id === ass.id);
                  return (
                    <div className="db-project-row" key={ass.id} style={{ display: "block" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                        <h4 className="db-project-name" style={{ fontSize: "16px" }}>{ass.title}</h4>
                        <span style={{ fontSize: "12px", fontWeight: "700" }}>Max Marks: {ass.max_marks}</span>
                      </div>
                      <p style={{ fontSize: "13px", color: "#666" }}>{ass.description}</p>
                      <p style={{ fontSize: "11px", fontWeight: "600" }}>📅 Due Date: {new Date(ass.due_date).toLocaleDateString()}</p>

                      <div style={{ marginTop: "12px", borderTop: "1px solid rgba(0,0,0,0.05)", paddingTop: "12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        {sub ? (
                          <div>
                            <span style={{ color: "var(--colors--green)", fontWeight: "bold", fontSize: "13px" }}>Submitted ✓</span>
                            {sub.marks_obtained !== null && (
                              <span style={{ marginLeft: "12px", fontWeight: "bold" }}>Marks: {sub.marks_obtained} / {ass.max_marks}</span>
                            )}
                            {sub.mentor_feedback && (
                              <p style={{ fontSize: "11px", color: "#666", margin: "4px 0 0 0" }}>💬 Mentor Remarks: {sub.mentor_feedback}</p>
                            )}
                          </div>
                        ) : (
                          <button className="form-submit-btn" style={{ padding: "6px 12px", fontSize: "12px" }} onClick={() => setSubmittingAssignmentId(ass.id)}>
                            Submit Assignment
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Submission Form */}
              {submittingAssignmentId && (
                <form onSubmit={handleSubmitHomework} className="db-welcome-banner" style={{ display: "block" }}>
                  <h4 style={{ margin: "0 0 16px 0", fontSize: "16px", fontWeight: "700" }}>Upload Submission</h4>
                  <div className="form-group-wrapper" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    <div>
                      <label style={{ fontSize: "12px", fontWeight: "bold", display: "block", marginBottom: "4px" }}>GitHub Repository URL*</label>
                      <input
                        type="url"
                        required
                        value={submissionRepo}
                        onChange={(e) => setSubmissionRepo(e.target.value)}
                        placeholder="https://github.com/username/repo"
                        className="form-input-field"
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: "12px", fontWeight: "bold", display: "block", marginBottom: "4px" }}>Live Demo URL (Optional)</label>
                      <input
                        type="url"
                        value={submissionLive}
                        onChange={(e) => setSubmissionLive(e.target.value)}
                        placeholder="https://repo.github.io/site"
                        className="form-input-field"
                      />
                    </div>
                    <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
                      <button type="submit" disabled={submittingHomework} className="form-submit-btn" style={{ flex: 1 }}>
                        {submittingHomework ? "Submitting..." : "Submit Pass"}
                      </button>
                      <button type="button" onClick={() => setSubmittingAssignmentId("")} className="button secondary w-button" style={{ margin: 0 }}>
                        Cancel
                      </button>
                    </div>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

        {/* TAB: LEADERBOARD */}
        {currentTab === "leaderboard" && (
          <div className="db-projects-section">
            <h3 className="db-section-title">XP Leaderboard rankings</h3>
            <div className="db-project-list">
              {leaderboard.map((student, idx) => (
                <div className="db-project-row" key={idx} style={{ border: student.you ? "1.5px solid var(--accent-yellow)" : "1.5px solid var(--black)" }}>
                  <div className="db-project-info">
                    <div className="db-project-icon" style={{ fontWeight: "bold", background: idx === 0 ? "var(--accent-yellow)" : "#f7f6f1" }}>
                      #{idx + 1}
                    </div>
                    <div>
                      <h4 className="db-project-name">{student.name} {student.you && "(You)"}</h4>
                      <span className="db-project-url">{student.branch || UNKNOWN_BRANCH_LABEL} | {student.you ? "🌱 Learner" : "—"}</span>
                    </div>
                  </div>
                  <span style={{ fontWeight: "bold" }}>{student.xp !== null ? `${student.xp} XP` : "—"}</span>
                </div>
              ))}
              {leaderboard.length === 0 && <div className="db-project-row">No participants yet.</div>}
            </div>
          </div>
        )}

        {/* TAB: PROFILE */}
        {currentTab === "profile" && (
          <div className="db-projects-section">
            <h3 className="db-section-title">My Student Profile</h3>
            <div className="profile-layout">
              {/* LEFT: editable form */}
              <form onSubmit={handleSaveProfile} className="db-welcome-banner profile-form-card" style={{ display: "block" }}>
                {/* Photo upload control */}
                <div className="profile-photo-upload">
                  <div className="profile-avatar">
                    {photoPreview || profilePhoto ? (
                      <img
                        src={photoPreview || `${profilePhoto}?t=${photoTimestamp}`}
                        alt="Profile preview"
                        className="profile-avatar-img"
                      />
                    ) : (
                      <span className="profile-avatar-letter">
                        {registeredUser.name ? registeredUser.name.charAt(0).toUpperCase() : "S"}
                      </span>
                    )}
                    <label className="profile-avatar-overlay" title="Upload photo">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                        <circle cx="12" cy="13" r="4" />
                      </svg>
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        onChange={handlePhotoChange}
                        style={{ display: "none" }}
                      />
                    </label>
                  </div>
                  <div className="profile-photo-meta">
                    <span className="profile-photo-title">Profile Photo</span>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button
                        type="button"
                        className="profile-photo-btn"
                        onClick={() => {
                          const input = document.querySelector<HTMLInputElement>(".profile-avatar-overlay input");
                          input?.click();
                        }}
                      >
                        {photoPreview || profilePhoto ? "Change Photo" : "Upload Photo"}
                      </button>
                      {(photoPreview || profilePhoto) && (
                        <button
                          type="button"
                          className="profile-photo-btn"
                          style={{ backgroundColor: "#faf9f6" }}
                          onClick={() => {
                            if (photoPreview) {
                              setCropperRawSrc(photoPreview);
                            } else if (profilePhoto) {
                              setCropperRawSrc(profilePhoto);
                            }
                            setCropScale(1);
                            setCropX(0);
                            setCropY(0);
                            setShowCropper(true);
                          }}
                        >
                          Edit / Crop
                        </button>
                      )}
                    </div>
                    <span className="profile-photo-hint">JPG, PNG or WEBP · max 5MB</span>
                  </div>
                </div>

                {uploadError && <div className="profile-upload-error">{uploadError}</div>}

                <div className="profile-fields">
                  <div>
                    <label className="form-label">Attendee Name</label>
                    <input type="text" disabled value={registeredUser.name} className="form-input-text" style={{ opacity: 0.6, cursor: "not-allowed" }} />
                  </div>
                  <div>
                    <label className="form-label">Enrollment Number</label>
                    <input type="text" disabled value={registeredUser.enrollmentNumber} className="form-input-text" style={{ opacity: 0.6, cursor: "not-allowed" }} />
                  </div>
                  <div>
                    <label className="form-label">GitHub Username</label>
                    <input type="text" value={profileGithub} onChange={(e) => setProfileGithub(e.target.value)} placeholder="github-username" className="form-input-text" />
                  </div>
                  <div>
                    <label className="form-label">LinkedIn Profile Link</label>
                    <input type="url" value={profileLinkedin} onChange={(e) => setProfileLinkedin(e.target.value)} placeholder="https://linkedin.com/in/username" className="form-input-text" />
                  </div>
                </div>

                <div className="profile-bio-block">
                  <label className="form-label">Profile Bio</label>
                  <textarea value={profileBio} onChange={(e) => setProfileBio(e.target.value)} className="form-input-text" style={{ minHeight: "90px", resize: "vertical" }}></textarea>
                </div>

                <button type="submit" disabled={savingProfile} className="form-submit-btn profile-save-btn">
                  {savingProfile ? "Saving..." : "Save Profile Details"}
                </button>
              </form>

              {/* RIGHT: live public preview */}
              <aside className="db-welcome-banner profile-preview-card">
                <span className="profile-preview-tag">Public Preview</span>
                <div className="profile-preview-avatar">
                  {photoPreview || profilePhoto ? (
                    <img src={photoPreview || `${profilePhoto}?t=${photoTimestamp}`} alt="Profile" className="profile-avatar-img" />
                  ) : (
                    <span className="profile-avatar-letter">
                      {registeredUser.name ? registeredUser.name.charAt(0).toUpperCase() : "S"}
                    </span>
                  )}
                </div>
                <h4 className="profile-preview-name">{registeredUser.name}</h4>
                <span className="profile-preview-enroll">#{INSTITUTION_CODE}-{registeredUser.enrollmentNumber}</span>
                {githubUrl(profileGithub) ? (
                  <a className="profile-preview-link" href={githubUrl(profileGithub)} target="_blank" rel="noopener noreferrer">
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M12 .5C5.7.5.5 5.7.5 12c0 5.1 3.3 9.4 7.9 10.9.6.1.8-.2.8-.6v-2c-3.2.7-3.9-1.5-3.9-1.5-.5-1.3-1.3-1.7-1.3-1.7-1.1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1 1.8 2.7 1.3 3.4 1 .1-.8.4-1.3.7-1.6-2.6-.3-5.3-1.3-5.3-5.7 0-1.3.5-2.3 1.2-3.1-.1-.3-.5-1.5.1-3.1 0 0 1-.3 3.3 1.2a11.5 11.5 0 0 1 6 0c2.3-1.5 3.3-1.2 3.3-1.2.6 1.6.2 2.8.1 3.1.8.8 1.2 1.8 1.2 3.1 0 4.4-2.7 5.4-5.3 5.7.4.4.8 1.1.8 2.2v3.3c0 .4.2.7.8.6 4.6-1.5 7.9-5.8 7.9-10.9C23.5 5.7 18.3.5 12 .5z"/></svg>
                    {profileGithub}
                  </a>
                ) : (
                  <span className="profile-preview-link profile-preview-link--muted">No GitHub username yet</span>
                )}
                <p className="profile-preview-bio">
                  {profileBio || "Your bio will appear here for peers to see."}
                </p>
              </aside>
            </div>
          </div>
        )}
      </main>

      {/* Right Side Panel */}
      <aside className="db-right-panel">
        <header className="db-rp-header">
          <div className="db-rp-balance-card">
            <span className="db-rp-balance-label">Student Pass</span>
            <h4 className="db-rp-balance-val">#{INSTITUTION_CODE}-{registeredUser.enrollmentNumber}</h4>
          </div>
          <div className="db-rp-profile">
            {profilePhoto ? (
              <img
                src={`${profilePhoto}?t=${photoTimestamp}`}
                alt="Student avatar"
                className="db-rp-avatar"
              />
            ) : (
              <div style={{ width: "44px", height: "44px", borderRadius: "50%", border: "1.5px solid var(--black)", backgroundColor: "#ffffff", display: "flex", justifyContent: "center", alignItems: "center", fontWeight: "bold", fontSize: "16px", textTransform: "uppercase", lineHeight: "44px", textAlign: "center" }}>
                {registeredUser.name ? registeredUser.name.charAt(0) : "S"}
              </div>
            )}
          </div>
        </header>

        <section className="db-activity-section">
          <h3 className="db-section-title">Recent Activity</h3>

          <div className="db-activity-list" style={{ overflowY: "auto", flex: 1, maxHeight: "250px" }}>
            <div className="db-activity-group">
              <span className="db-activity-date">Today</span>
              <div className="db-activity-item">
                <div className="db-activity-meta">
                  <span className="db-activity-action">git commit -m "initial"</span>
                  <span className="db-activity-time">12:44 PM</span>
                </div>
                <span className="db-activity-badge add">+a1b2c3d</span>
              </div>
              <div className="db-activity-item">
                <div className="db-activity-meta">
                  <span className="db-activity-action">git push origin main</span>
                  <span className="db-activity-time">12:46 PM</span>
                </div>
                <span className="db-activity-badge" style={{ backgroundColor: "#f7f6f1" }}>pushed</span>
              </div>
            </div>

            <div className="db-activity-group">
              <span className="db-activity-date">Yesterday</span>
              <div className="db-activity-item">
                <div className="db-activity-meta">
                  <span className="db-activity-action">git clone repo-url</span>
                  <span className="db-activity-time">03:10 PM</span>
                </div>
                <span className="db-activity-badge sub">-cloned</span>
              </div>
            </div>
          </div>

          <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: "12px" }}>
            <a href="https://discord.com/" target="_blank" rel="noopener noreferrer" className="form-submit-btn" style={{ textDecoration: "none" }}>
              Join Discord
            </a>
            <a href="/" className="button secondary w-button" style={{ display: "block", textAlign: "center", textDecoration: "none" }}>
              Back to Home
            </a>
            <button
              onClick={handleLogout}
              className="button secondary w-button"
              style={{ display: "block", textAlign: "center", border: "1.5px solid var(--colors--coral)", color: "var(--colors--coral)", background: "none", cursor: "pointer", width: "100%" }}
            >
              Logout Account
            </button>
          </div>
        </section>
      </aside>

      {/* Cropper Modal */}
      {showCropper && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          backgroundColor: "rgba(0, 0, 0, 0.6)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 9999,
          padding: "20px"
        }}>
          <div className="db-welcome-banner" style={{
            maxWidth: "400px",
            width: "100%",
            backgroundColor: "#ffffff",
            border: "1.5px solid var(--black)",
            borderRadius: "12px",
            padding: "24px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            boxShadow: "6px 6px 0px 0px var(--black)"
          }}>
            <h4 className="att-status-title" style={{ fontSize: "18px", margin: "0 0 4px 0" }}>Edit & Crop Photo</h4>
            <p className="att-status-sub" style={{ fontSize: "12px", marginBottom: "16px" }}>
              Zoom and drag sliders to center your face inside the circle.
            </p>

            {/* Preview Circle */}
            <div style={{
              width: "200px",
              height: "200px",
              borderRadius: "50%",
              overflow: "hidden",
              border: "1.5px solid var(--black)",
              position: "relative",
              backgroundColor: "#f7f6f1",
              marginBottom: "20px"
            }}>
              <img
                src={cropperRawSrc}
                alt="Raw preview"
                style={{
                  position: "absolute",
                  left: "50%",
                  top: "50%",
                  width: "200px",
                  height: "auto",
                  transform: `translate(-50%, -50%) translate(${cropX}px, ${cropY}px) scale(${cropScale})`,
                  transformOrigin: "center",
                  maxWidth: "none"
                }}
              />
            </div>

            {/* Sliders */}
            <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: "12px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", fontWeight: "700" }}>
                  <span>Zoom</span>
                  <span>{Math.round(cropScale * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="3"
                  step="0.05"
                  value={cropScale}
                  onChange={(e) => setCropScale(parseFloat(e.target.value))}
                  style={{ width: "100%", cursor: "pointer", accentColor: "var(--accent-yellow)" }}
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", fontWeight: "700" }}>
                  <span>Position X</span>
                  <span>{cropX}px</span>
                </div>
                <input
                  type="range"
                  min="-100"
                  max="100"
                  step="1"
                  value={cropX}
                  onChange={(e) => setCropX(parseInt(e.target.value))}
                  style={{ width: "100%", cursor: "pointer", accentColor: "var(--accent-yellow)" }}
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", fontWeight: "700" }}>
                  <span>Position Y</span>
                  <span>{cropY}px</span>
                </div>
                <input
                  type="range"
                  min="-100"
                  max="100"
                  step="1"
                  value={cropY}
                  onChange={(e) => setCropY(parseInt(e.target.value))}
                  style={{ width: "100%", cursor: "pointer", accentColor: "var(--accent-yellow)" }}
                />
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: "flex", gap: "12px", width: "100%", marginTop: "24px" }}>
              <button
                type="button"
                className="profile-photo-btn"
                style={{ flex: 1, backgroundColor: "#ffffff", justifyContent: "center", display: "flex" }}
                onClick={() => setShowCropper(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="profile-photo-btn"
                style={{ flex: 1, backgroundColor: "var(--accent-yellow)", justifyContent: "center", display: "flex" }}
                onClick={handleApplyCrop}
              >
                Apply Crop
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
