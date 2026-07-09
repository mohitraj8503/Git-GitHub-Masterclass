"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import AssetImage from "@/components/AssetImage";
import LoadingSpinner from "@/components/LoadingSpinner";
import { QRCodeSVG } from "qrcode.react";
import CountdownRing from "@/components/CountdownRing";
import {
  INSTITUTION_CODE,
  WORKSHOP_DAYS,
  ATTENDANCE_WINDOW_MINUTES,
  DEFAULT_ASSIGNMENT_MAX_MARKS,
  DEFAULT_ANNOUNCEMENT_TYPE,
  UNKNOWN_BRANCH_LABEL,
} from "@/lib/config";

export default function AdminDashboardPage() {
  const [currentTab, setCurrentTab] = useState("analytics");

  // Stats / Data States
  const [stats, setStats] = useState({
    totalRegistrations: 0,
    activeStudents: 0,
    attendanceRate: 0,
    assignmentCompletionRate: 0,
  });

  const [students, setStudents] = useState<any[]>([]);
  const [studentsError, setStudentsError] = useState<string | null>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);

  // Loading states (distinct from empty — real empty only shows after fetch settles)
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [loadingAssignments, setLoadingAssignments] = useState(true);
  const [loadingAnnouncements, setLoadingAnnouncements] = useState(true);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState("");

  // Assignment Creator Form
  const [newAssTitle, setNewAssTitle] = useState("");
  const [newAssDesc, setNewAssDesc] = useState("");
  const [newAssDueDate, setNewAssDueDate] = useState("");
  const [newAssMaxMarks, setNewAssMaxMarks] = useState(String(DEFAULT_ASSIGNMENT_MAX_MARKS));
  const [creatingAss, setCreatingAss] = useState(false);

  // Announcement Form
  const [newAnnTitle, setNewAnnTitle] = useState("");
  const [newAnnContent, setNewAnnContent] = useState("");
  const [newAnnType, setNewAnnType] = useState(DEFAULT_ANNOUNCEMENT_TYPE);
  const [creatingAnn, setCreatingAnn] = useState(false);

  // Grading Modal/State
  const [selectedSubId, setSelectedSubId] = useState("");
  const [gradeMarks, setGradeMarks] = useState("");
  const [gradeFeedback, setGradeFeedback] = useState("");
  const [grading, setGrading] = useState(false);

  // QR Day selection (day to open a check-in window for)
  const [qrDay, setQrDay] = useState(1);

  // Live attendance window state (polled from the server)
  const [adminWindow, setAdminWindow] = useState<any>(null);
  const [opening, setOpening] = useState(false);
  const [closing, setClosing] = useState(false);
  const [adminNow, setAdminNow] = useState(Date.now());

  // Load Admin Data
  const loadData = () => {
    // 1. Fetch Stats
    fetch("/api/admin/analytics")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setStats(data.stats);
      })
      .finally(() => setLoadingStats(false));

    // 2. Fetch Assignments
    fetch("/api/assignments")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setAssignments(data.assignments);
      })
      .finally(() => setLoadingAssignments(false));

    // 3. Fetch All Submissions
    fetch("/api/submissions")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setSubmissions(data.submissions);
      });

    // 4. Fetch All Announcements
    fetch("/api/announcements")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setAnnouncements(data.announcements);
      })
      .finally(() => setLoadingAnnouncements(false));

    // 5. Load Students from the registrations API (Supabase-backed, local fallback)
    fetch("/api/register", { method: "GET" })
      .then((res) => res.json())
      .then((data) => {
        if (data && data.success && Array.isArray(data.registrations)) {
          setStudents(data.registrations);
        } else {
          setStudentsError(data?.error || "Unable to load registered students.");
        }
      })
      .catch(() => {
        setStudentsError("Network error while loading registered students.");
      })
      .finally(() => setLoadingStudents(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  // --- Attendance window control (admin) ---
  const pollAdminWindow = async () => {
    try {
      const res = await fetch("/api/attendance/window");
      const data = await res.json();
      if (data.success && data.window) {
        setAdminWindow({ ...data.window, checkins: data.checkins || [] });
      } else {
        setAdminWindow(null);
      }
    } catch (e) {
      /* keep previous state on transient errors */
    }
  };

  useEffect(() => {
    if (currentTab !== "attendance") return;
    let alive = true;
    const poll = async () => {
      if (!alive) return;
      await pollAdminWindow();
    };
    const tick = () => setAdminNow(Date.now());
    poll();
    const pollInt = setInterval(poll, 2500);
    const tickInt = setInterval(tick, 1000);
    return () => {
      alive = false;
      clearInterval(pollInt);
      clearInterval(tickInt);
    };
  }, [currentTab]);

  const handleOpenWindow = async () => {
    setOpening(true);
    try {
      const res = await fetch("/api/attendance/window", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ day: qrDay }),
      });
      const data = await res.json();
      if (data.success && data.window) {
        setAdminWindow({ ...data.window, checkins: [] });
      }
    } finally {
      setOpening(false);
    }
  };

  const handleCloseWindow = async () => {
    setClosing(true);
    try {
      await fetch("/api/attendance/window/close", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      setAdminWindow(null);
    } finally {
      setClosing(false);
    }
  };

  // Post new assignment
  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAssTitle || !newAssDesc || !newAssDueDate) return;
    setCreatingAss(true);

    try {
      const response = await fetch("/api/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newAssTitle,
          description: newAssDesc,
          due_date: newAssDueDate,
          max_marks: newAssMaxMarks,
        }),
      });
      if (response.ok) {
        alert("Assignment created successfully!");
        setNewAssTitle("");
        setNewAssDesc("");
        setNewAssDueDate("");
        loadData();
      }
    } catch (err) {
      alert("Error creating assignment");
    } finally {
      setCreatingAss(false);
    }
  };

  // Post new announcement
  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAnnTitle || !newAnnContent) return;
    setCreatingAnn(true);

    try {
      const response = await fetch("/api/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newAnnTitle,
          content: newAnnContent,
          type: newAnnType,
        }),
      });
      if (response.ok) {
        alert("Announcement broadcasted successfully!");
        setNewAnnTitle("");
        setNewAnnContent("");
        loadData();
      }
    } catch (err) {
      alert("Error broadcasting announcement");
    } finally {
      setCreatingAnn(false);
    }
  };

  // Submit Grading
  const handleEvaluate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubId || gradeMarks === "") return;
    setGrading(true);

    try {
      const response = await fetch("/api/admin/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          submission_id: selectedSubId,
          marks_obtained: gradeMarks,
          mentor_feedback: gradeFeedback,
        }),
      });
      if (response.ok) {
        alert("Evaluation saved!");
        setSelectedSubId("");
        setGradeMarks("");
        setGradeFeedback("");
        loadData();
      }
    } catch (err) {
      alert("Error saving evaluation");
    } finally {
      setGrading(false);
    }
  };

  const filteredStudents = students.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.enrollmentNumber.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="dashboard-view">
      {/* Left Sidebar */}
      <aside className="db-sidebar">
        <div className="db-logo" style={{ display: "flex", justifyContent: "center", padding: "10px 0", borderBottom: "1.5px solid var(--black)" }}>
          <img src="/images/github-logo.png" alt="GitHub Logo" style={{ maxHeight: "24px", maxWidth: "24px", objectFit: "contain" }} />
        </div>
        <nav className="db-menu">
          <div className={`db-menu-item ${currentTab === "analytics" ? "active" : ""}`} onClick={() => setCurrentTab("analytics")} title="Analytics">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
          </div>
          <div className={`db-menu-item ${currentTab === "students" ? "active" : ""}`} onClick={() => setCurrentTab("students")} title="Students">
            <svg viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          </div>
          <div className={`db-menu-item ${currentTab === "attendance" ? "active" : ""}`} onClick={() => setCurrentTab("attendance")} title="Attendance Control">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="9" y1="9" x2="15" y2="9"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="13" y2="17"/></svg>
          </div>
          <div className={`db-menu-item ${currentTab === "assignments" ? "active" : ""}`} onClick={() => setCurrentTab("assignments")} title="Assignments Manager">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
          </div>
          <div className={`db-menu-item ${currentTab === "evaluation" ? "active" : ""}`} onClick={() => setCurrentTab("evaluation")} title="Evaluation Portal">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
          </div>
          <div className={`db-menu-item ${currentTab === "announcements" ? "active" : ""}`} onClick={() => setCurrentTab("announcements")} title="Announcements">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
          </div>
        </nav>
      </aside>

      {/* Main Panel */}
      <main className="db-main-content">
        <header className="db-header">
          <h1 className="db-title" style={{ textTransform: "uppercase" }}>Organizer Console ({currentTab})</h1>
          <Link href="/" className="button secondary w-button" style={{ margin: 0, padding: "8px 16px" }}>
            Back to Front
          </Link>
        </header>

        {/* TAB: ANALYTICS */}
        {currentTab === "analytics" && (
          <>
            {/* Stats Overview */}
            {loadingStats ? (
              <LoadingSpinner label="Loading analytics…" />
            ) : (
              <div className="db-stats-row">
                <div className="db-stat-card yellow-accent">
                  <span className="db-stat-label">Total Registrants</span>
                  <h3 className="db-stat-value">{stats.totalRegistrations}</h3>
                </div>
                <div className="db-stat-card">
                  <span className="db-stat-label">Active Today</span>
                  <h3 className="db-stat-value">{stats.activeStudents}</h3>
                </div>
                <div className="db-stat-card">
                  <span className="db-stat-label">Avg Attendance Rate</span>
                  <h3 className="db-stat-value">{stats.attendanceRate}%</h3>
                </div>
              </div>
            )}

            {/* Performance charts mockup */}
            <div className="db-projects-section">
              <h3 className="db-section-title">Workshop Performance Dashboard</h3>
              <div className="db-welcome-banner" style={{ display: "block" }}>
                <h4 style={{ margin: "0 0 16px 0", fontSize: "16px", fontWeight: "700" }}>Assignment Submission Progress</h4>
                <div style={{ background: "#f7f6f1", height: "24px", borderRadius: "12px", overflow: "hidden", display: "flex", border: "1.5px solid var(--black)" }}>
                  <div style={{ width: `${stats.assignmentCompletionRate}%`, background: "var(--accent-yellow)", transition: "width 0.5s" }}></div>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: "8px", fontSize: "12px", fontWeight: "bold" }}>
                  <span>Completed submissions: {stats.assignmentCompletionRate}%</span>
                  <span>Target: 100%</span>
                </div>
              </div>
            </div>
          </>
        )}

        {/* TAB: STUDENTS */}
        {currentTab === "students" && (
          <div className="db-projects-section">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 className="db-section-title">Registered Students List</h3>
              <input
                type="text"
                placeholder="Search name or enrollment..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="form-input-field"
                style={{ maxWidth: "250px", margin: 0 }}
              />
            </div>
            
            <div className="db-project-list">
              {loadingStudents ? (
                <LoadingSpinner label="Loading students…" />
              ) : studentsError ? (
                <div className="db-project-row" style={{ color: "var(--colors--coral)" }}>{studentsError}</div>
              ) : filteredStudents.length > 0 ? (
                filteredStudents.map((student) => (
                  <div className="db-project-row" key={student.id}>
                    <div className="db-project-info">
                      <div className="db-project-icon" style={{ fontWeight: "bold" }}>
                        👨‍🎓
                      </div>
                      <div>
                        <h4 className="db-project-name">{student.name}</h4>
                        <span className="db-project-url">Pass ID: #{INSTITUTION_CODE}-{student.enrollmentNumber} | {student.email}</span>
                      </div>
                    </div>
                    <span className="db-activity-badge" style={{ backgroundColor: "#f7f6f1" }}>{student.branch || UNKNOWN_BRANCH_LABEL}</span>
                  </div>
                ))
              ) : (
                <div className="db-project-row">No students match your query.</div>
              )}
            </div>
          </div>
        )}

        {/* TAB: ATTENDANCE CONTROL */}
        {currentTab === "attendance" && (() => {
          const expiresAt = adminWindow ? new Date(adminWindow.expires_at).getTime() : 0;
          const remainingMs = Math.max(0, expiresAt - adminNow);
          const totalMs = ATTENDANCE_WINDOW_MINUTES * 60 * 1000;
          const secs = Math.floor(remainingMs / 1000);
          const mm = String(Math.floor(secs / 60)).padStart(2, "0");
          const ss = String(secs % 60).padStart(2, "0");
          const progress = totalMs ? remainingMs / totalMs : 0;

          return (
            <div className="db-projects-section">
              <h3 className="db-section-title">Attendance Control</h3>
              <div className="att-admin-grid">
                {/* Control panel */}
                <div className="att-control-card">
                  <h4 className="att-control-title">Open Check-in Window</h4>
                  <p className="att-control-sub">
                    Pick the session day, then open a {ATTENDANCE_WINDOW_MINUTES}-minute, server-validated check-in window. Students can only check in while it&apos;s live.
                  </p>
                  <div className="att-day-picker">
                    {Array.from({ length: WORKSHOP_DAYS }, (_, i) => i + 1).map((d) => (
                      <button
                        key={d}
                        className={`att-day-chip${qrDay === d ? " active" : ""}`}
                        onClick={() => setQrDay(d)}
                        disabled={!!adminWindow}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                  <button
                    className="att-open-btn"
                    onClick={handleOpenWindow}
                    disabled={opening || !!adminWindow}
                  >
                    {opening ? "Opening…" : adminWindow ? `Day ${adminWindow.day} window is live` : `Open Check-in for Day ${qrDay}`}
                  </button>
                  {adminWindow && (
                    <button className="att-close-btn" onClick={handleCloseWindow} disabled={closing}>
                      {closing ? "Closing…" : "Close Window Early"}
                    </button>
                  )}
                </div>

                {/* Live window panel */}
                {adminWindow ? (
                  <div className="att-live-card">
                    <span className="att-live-tag">LIVE WINDOW · DAY {adminWindow.day}</span>
                    <CountdownRing mm={mm} ss={ss} progress={progress} />
                    <div className="att-qr">
                      <div className="att-qr-box">
                        <QRCodeSVG value={adminWindow.session_token} size={150} level="M" />
                      </div>
                      <span className="att-qr-label">Session token · valid only while this window is live</span>
                    </div>
                    <div className="att-checkin-count">
                      <strong>{adminWindow.checkins.length}</strong> checked in
                    </div>
                    <div className="att-checkin-list">
                      {adminWindow.checkins.length === 0 ? (
                        <div className="att-empty">No check-ins yet — waiting for students…</div>
                      ) : (
                        <ul>
                          {adminWindow.checkins.map((c: any, i: number) => (
                            <li key={i}>
                              <span className="att-checkin-name">{c.name}</span>
                              <span className="att-checkin-time">
                                {new Date(c.checked_in_at).toLocaleTimeString()}
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="att-live-card att-live-idle">
                    <div className="att-live-idle-icon">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="9" />
                        <path d="M12 7v5l3 2" />
                      </svg>
                    </div>
                    <h4>No active window</h4>
                    <p>Open a check-in window from the left to start collecting attendance in real time.</p>
                  </div>
                )}
              </div>
            </div>
          );
        })()}

        {/* TAB: ASSIGNMENTS MANAGER */}
        {currentTab === "assignments" && (
          <div className="db-projects-section">
            <h3 className="db-section-title">Assignment Creator Panel</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: "24px", alignItems: "start" }}>
              {/* Creator Form */}
              <form onSubmit={handleCreateAssignment} className="db-welcome-banner" style={{ display: "block" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  <div>
                    <label style={{ fontSize: "12px", fontWeight: "bold", display: "block", marginBottom: "4px" }}>Assignment Title*</label>
                    <input
                      type="text"
                      required
                      value={newAssTitle}
                      onChange={(e) => setNewAssTitle(e.target.value)}
                      placeholder="e.g. Day 3: Branching & Merging"
                      className="form-input-field"
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: "12px", fontWeight: "bold", display: "block", marginBottom: "4px" }}>Due Date*</label>
                    <input
                      type="datetime-local"
                      required
                      value={newAssDueDate}
                      onChange={(e) => setNewAssDueDate(e.target.value)}
                      className="form-input-field"
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: "12px", fontWeight: "bold", display: "block", marginBottom: "4px" }}>Maximum Marks*</label>
                    <input
                      type="number"
                      required
                      value={newAssMaxMarks}
                      onChange={(e) => setNewAssMaxMarks(e.target.value)}
                      placeholder="10"
                      className="form-input-field"
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: "12px", fontWeight: "bold", display: "block", marginBottom: "4px" }}>Description Details*</label>
                    <textarea
                      required
                      value={newAssDesc}
                      onChange={(e) => setNewAssDesc(e.target.value)}
                      placeholder="Add detailed rubrics and homework submission criteria..."
                      className="form-input-field"
                      style={{ minHeight: "100px" }}
                    />
                  </div>
                  <button type="submit" disabled={creatingAss} className="form-submit-btn" style={{ marginTop: "12px" }}>
                    {creatingAss ? "Creating..." : "Publish Assignment"}
                  </button>
                </div>
              </form>

              {/* Published List */}
              <div className="db-project-list">
                {loadingAssignments ? (
                  <LoadingSpinner label="Loading assignments…" />
                ) : assignments.length > 0 ? (
                  assignments.map((ass) => (
                    <div className="db-project-row" key={ass.id} style={{ display: "block" }}>
                      <h4 className="db-project-name">{ass.title}</h4>
                      <p style={{ margin: "4px 0", fontSize: "13px", color: "#666" }}>{ass.description}</p>
                      <span style={{ fontSize: "11px", fontWeight: "600" }}>📅 Due: {new Date(ass.due_date).toLocaleDateString()} | Marks: {ass.max_marks}</span>
                    </div>
                  ))
                ) : (
                  <div className="db-project-row">No assignments created yet.</div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB: EVALUATION PORTAL */}
        {currentTab === "evaluation" && (
          <div className="db-projects-section">
            <h3 className="db-section-title">Grade Student Homework Submissions</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: "24px", alignItems: "start" }}>
              {/* List */}
              <div className="db-project-list">
                {submissions.map((sub) => {
                  const student = students.find((s) => s.enrollmentNumber === sub.student_id);
                  const assignment = assignments.find((a) => a.id === sub.assignment_id);
                  return (
                    <div className="db-project-row" key={sub.id} style={{ display: "block" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                        <h4 className="db-project-name" style={{ fontSize: "15px" }}>
                          {student?.name || "Student"} - {assignment?.title || "Assignment"}
                        </h4>
                        <span style={{ fontSize: "11px", color: "#666" }}>{new Date(sub.submitted_at).toLocaleDateString()}</span>
                      </div>
                      <div style={{ fontSize: "13px", margin: "6px 0" }}>
                        <strong>Repo:</strong> <a href={sub.repo_url} target="_blank" rel="noreferrer" style={{ color: "blue" }}>{sub.repo_url}</a>
                        {sub.live_url && (
                          <span style={{ marginLeft: "12px" }}>
                            <strong>Live:</strong> <a href={sub.live_url} target="_blank" rel="noreferrer" style={{ color: "blue" }}>{sub.live_url}</a>
                          </span>
                        )}
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "10px" }}>
                        <div>
                          {sub.marks_obtained !== null ? (
                            <span style={{ fontWeight: "bold", color: "var(--colors--green)" }}>Graded: {sub.marks_obtained} Marks</span>
                          ) : (
                            <span style={{ fontWeight: "bold", color: "var(--colors--orange)" }}>Pending Evaluation</span>
                          )}
                        </div>
                        <button className="form-submit-btn" style={{ padding: "4px 10px", fontSize: "12px" }} onClick={() => setSelectedSubId(sub.id)}>
                          Evaluate
                        </button>
                      </div>
                    </div>
                  );
                })}
                {submissions.length === 0 && <div className="db-project-row">No homework submissions uploaded yet.</div>}
              </div>

              {/* Evaluation Panel */}
              {selectedSubId && (
                <form onSubmit={handleEvaluate} className="db-welcome-banner" style={{ display: "block" }}>
                  <h4 style={{ margin: "0 0 16px 0", fontSize: "16px", fontWeight: "700" }}>Award Marks</h4>
                  <div className="form-group-wrapper" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    <div>
                      <label style={{ fontSize: "12px", fontWeight: "bold", display: "block", marginBottom: "4px" }}>Marks Obtained*</label>
                      <input
                        type="number"
                        required
                        value={gradeMarks}
                        onChange={(e) => setGradeMarks(e.target.value)}
                        placeholder="10"
                        className="form-input-field"
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: "12px", fontWeight: "bold", display: "block", marginBottom: "4px" }}>Mentor Feedback</label>
                      <textarea
                        value={gradeFeedback}
                        onChange={(e) => setGradeFeedback(e.target.value)}
                        placeholder="Good job on branching. Avoid commit clutter next time..."
                        className="form-input-field"
                        style={{ minHeight: "80px" }}
                      />
                    </div>
                    <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
                      <button type="submit" disabled={grading} className="form-submit-btn" style={{ flex: 1 }}>
                        {grading ? "Saving..." : "Save Grades"}
                      </button>
                      <button type="button" onClick={() => setSelectedSubId("")} className="button secondary w-button" style={{ margin: 0 }}>
                        Cancel
                      </button>
                    </div>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

        {/* TAB: ANNOUNCEMENTS */}
        {currentTab === "announcements" && (
          <div className="db-projects-section">
            <h3 className="db-section-title">System announcements manager</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: "24px", alignItems: "start" }}>
              {/* Form */}
              <form onSubmit={handleCreateAnnouncement} className="db-welcome-banner" style={{ display: "block" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  <div>
                    <label style={{ fontSize: "12px", fontWeight: "bold", display: "block", marginBottom: "4px" }}>Announcement Title*</label>
                    <input
                      type="text"
                      required
                      value={newAnnTitle}
                      onChange={(e) => setNewAnnTitle(e.target.value)}
                      placeholder="e.g. Schedule Change: Session starts at 3PM"
                      className="form-input-field"
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: "12px", fontWeight: "bold", display: "block", marginBottom: "4px" }}>Announcement Category*</label>
                    <select
                      value={newAnnType}
                      onChange={(e) => setNewAnnType(e.target.value)}
                      className="form-input-field"
                    >
                      <option value="general">General</option>
                      <option value="schedule">Schedule</option>
                      <option value="assignment">Assignment</option>
                      <option value="reminder">Reminder</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: "12px", fontWeight: "bold", display: "block", marginBottom: "4px" }}>Message Content*</label>
                    <textarea
                      required
                      value={newAnnContent}
                      onChange={(e) => setNewAnnContent(e.target.value)}
                      placeholder="Add announcement details..."
                      className="form-input-field"
                      style={{ minHeight: "100px" }}
                    />
                  </div>
                  <button type="submit" disabled={creatingAnn} className="form-submit-btn" style={{ marginTop: "12px" }}>
                    {creatingAnn ? "Broadcasting..." : "Broadcast Message"}
                  </button>
                </div>
              </form>

              {/* Announcements List */}
              <div className="db-project-list">
                {loadingAnnouncements ? (
                  <LoadingSpinner label="Loading announcements…" />
                ) : announcements.length > 0 ? (
                  announcements.map((ann) => (
                    <div className="db-project-row" key={ann.id} style={{ display: "block" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                        <h4 className="db-project-name">{ann.title}</h4>
                        <span className="db-activity-badge" style={{ backgroundColor: "#f7f6f1" }}>{ann.type}</span>
                      </div>
                      <p style={{ margin: "4px 0", fontSize: "13px", color: "#666" }}>{ann.content}</p>
                      <span style={{ fontSize: "11px", color: "#999" }}>{new Date(ann.created_at).toLocaleDateString()}</span>
                    </div>
                  ))
                ) : (
                  <div className="db-project-row">No announcements published yet.</div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
