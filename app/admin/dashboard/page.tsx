"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import LoadingSpinner from "@/components/LoadingSpinner";
import CountdownRing from "@/components/CountdownRing";
import LivePollingAdmin from "@/components/LivePollingAdmin";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import {
  INSTITUTION_CODE,
  WORKSHOP_DAYS,
  ATTENDANCE_WINDOW_MINUTES,
  DEFAULT_ASSIGNMENT_MAX_MARKS,
  DEFAULT_ANNOUNCEMENT_TYPE,
  UNKNOWN_BRANCH_LABEL,
} from "@/lib/config";


const getTimeGreeting = (ts: number) => {
  const h = new Date(ts).getHours();
  if (h >= 5 && h < 12) return "Good Morning ☀️";
  if (h >= 12 && h < 17) return "Good Afternoon 🌤️";
  if (h >= 17 && h < 21) return "Good Evening 🌇";
  return "Good Night 🌙";
};

function useCountUp(target: number, duration = 900) {
  const [count, setCount] = useState(0);
  const rafRef = useRef<number | null>(null);
  useEffect(() => {
    if (target === 0) { setCount(0); return; }
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      setCount(Math.round(p * target));
      if (p < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [target, duration]);
  return count;
}

import { SCHEDULE_DAYS, getDayStatus } from "@/lib/sessions";

export default function AdminDashboardPage() {
  const router = useRouter();
  const [adminUser, setAdminUser] = useState<any>(null);
  const [checked, setChecked] = useState(false);
  const [currentTab, setCurrentTab] = useState("home");
  const [nowTs, setNowTs] = useState(Date.now());

  // Data states
  const [stats, setStats] = useState<any>({
    totalStudents: 0, avgAttendancePct: 0, resourcesPublished: 0,
    assignmentsPendingReview: 0, topPerformer: null, sessionsCompleted: 0,
    perDayAttendance: [], resourcesPerDay: {}, totalAnnouncements: 0,
    totalAssignments: 0, gradedSubmissions: 0, recentCheckins: [],
  });
  const [statsDelta, setStatsDelta] = useState<{ students: number; attendance: number; resources: number; pending: number }>({ students: 0, attendance: 0, resources: 0, pending: 0 });
  const [health, setHealth] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [resources, setResources] = useState<any[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [loadingAssignments, setLoadingAssignments] = useState(true);
  const [loadingResources, setLoadingResources] = useState(true);
  const [studentsError, setStudentsError] = useState<string | null>(null);

  // Attendance window
  const [adminWindow, setAdminWindow] = useState<any>(null);
  const [qrDay, setQrDay] = useState(1);
  const [opening, setOpening] = useState(false);
  const [closing, setClosing] = useState(false);
  const [adminNow, setAdminNow] = useState(Date.now());

  // Attendance sub-tab and live window summary
  const [attendanceSub, setAttendanceSub] = useState<'live' | 'analytics'>('live');
  const [lastSummary, setLastSummary] = useState<any>(null);
  // Report data for analytics tab
  const [report, setReport] = useState<any>(null);
  const [reportLoading, setReportLoading] = useState<boolean>(true);
  const [reportError, setReportError] = useState<string | null>(null);
  const [exporting, setExporting] = useState<boolean>(false);
  const [analyticsSearch, setAnalyticsSearch] = useState<string>("");
  const [analyticsSort, setAnalyticsSort] = useState<{ key: string; direction: "asc" | "desc" } | null>(null);
  const [selectedAnalyticsDay, setSelectedAnalyticsDay] = useState<number | null>(null);
  const [updatingManualAtt, setUpdatingManualAtt] = useState<string | null>(null);
  const prevWindowRef = useRef<any>(null);
  
  // Leaderboard enhancements
  const [awardingStudent, setAwardingStudent] = useState<any>(null);
  const [awardAmount, setAwardAmount] = useState<string>("10");
  const [awardReason, setAwardReason] = useState<string>("");
  const [awardSubmitting, setAwardSubmitting] = useState<boolean>(false);
  const [awardError, setAwardError] = useState<string | null>(null);

  const [historyStudent, setHistoryStudent] = useState<any>(null);
  const [studentHistory, setStudentHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState<boolean>(false);

  const [leaderboardSearch, setLeaderboardSearch] = useState<string>("");
  const [leaderboardPage, setLeaderboardPage] = useState<number>(1);
  const leaderboardItemsPerPage = 10;
  // Student table sorting/searching
  const [studentSearch, setStudentSearch] = useState<string>("");
  const [studentSortConfig, setStudentSortConfig] = useState<{
    key: string;
    direction: "asc" | "desc";
  } | null>(null);

  // Forms
  const [newResTitle, setNewResTitle] = useState("");
  const [newResType, setNewResType] = useState("PPT");
  const [newResUrl, setNewResUrl] = useState("");
  const [newResDay, setNewResDay] = useState(1);
  const [creatingRes, setCreatingRes] = useState(false);

  const [newAssTitle, setNewAssTitle] = useState("");
  const [newAssDesc, setNewAssDesc] = useState("");
  const [newAssDueDate, setNewAssDueDate] = useState("");
  const [newAssMaxMarks, setNewAssMaxMarks] = useState(String(DEFAULT_ASSIGNMENT_MAX_MARKS));
  const [creatingAss, setCreatingAss] = useState(false);
  const [reqLiveUrl, setReqLiveUrl] = useState(true);
  const [reqGithubLink, setReqGithubLink] = useState(true);
  const [reqAttachment, setReqAttachment] = useState(false);

  const [newAnnTitle, setNewAnnTitle] = useState("");
  const [newAnnContent, setNewAnnContent] = useState("");
  const [newAnnType, setNewAnnType] = useState(DEFAULT_ANNOUNCEMENT_TYPE);
  const [creatingAnn, setCreatingAnn] = useState(false);

  const [selectedSubId, setSelectedSubId] = useState("");
  const [gradeMarks, setGradeMarks] = useState("");
  const [gradeFeedback, setGradeFeedback] = useState("");
  const [grading, setGrading] = useState(false);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string>("");
  const [gradingSubmission, setGradingSubmission] = useState<any>(null);
  const [manualBonusXp, setManualBonusXp] = useState<string>("0");
  const [exportingCsv, setExportingCsv] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3200);
  };

  // ===== Admin Profile Edit State (mirrors student profile) =====
  const [adminName, setAdminName] = useState<string>(adminUser?.name || "Admin");
  const [profileBio, setProfileBio] = useState<string>("");
  const [profileGithub, setProfileGithub] = useState<string>("");
  const [profileLinkedin, setProfileLinkedin] = useState<string>("");
  const [savingProfile, setSavingProfile] = useState<boolean>(false);

  const BIO_MAX = 200;

  const [profileErrors, setProfileErrors] = useState<{ name?: string; github?: string; linkedin?: string }>({});
  const [profileTouched, setProfileTouched] = useState<{ name?: boolean; github?: boolean; linkedin?: boolean; bio?: boolean }>({});
  const [copied, setCopied] = useState<boolean>(false);
  const [initialSnapshot, setInitialSnapshot] = useState<string>("");
  const [isDirty, setIsDirty] = useState<boolean>(false);

  // Profile photo state (shared with sidebar + header avatar)
  const [profilePhoto, setProfilePhoto] = useState<string>(
    typeof window !== "undefined" ? localStorage.getItem("admin_profile_photo") || "" : ""
  );
  const [photoFile, setPhotoFile] = useState<string | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string>("");
  const [photoDragActive, setPhotoDragActive] = useState<boolean>(false);
  const [lastSaved, setLastSaved] = useState<string>(
    typeof window !== "undefined" ? localStorage.getItem("admin_profile_updated_at") || "" : ""
  );

  // Profile completion score
  const profileCompletion = (() => {
    let score = 0;
    if (profilePhoto) score += 20;
    if (adminName?.trim()) score += 20;
    if (profileGithub?.trim()) score += 20;
    if (profileLinkedin?.trim()) score += 20;
    if (profileBio?.trim()) score += 20;
    return score;
  })();

  // Cropper & cache states
  const [photoTimestamp, setPhotoTimestamp] = useState<number>(Date.now());
  const [showCropper, setShowCropper] = useState<boolean>(false);
  const [cropperRawSrc, setCropperRawSrc] = useState<string>("");
  const [cropScale, setCropScale] = useState<number>(1);
  const [cropX, setCropX] = useState<number>(0);
  const [cropY, setCropY] = useState<number>(0);

  // Seed editable profile fields from localStorage once admin is known
  useEffect(() => {
    if (!adminUser) return;
    const seedName = localStorage.getItem("admin_profile_name") || adminUser.name || "Admin";
    const seedBio = localStorage.getItem("admin_profile_bio") || "";
    const seedGithub = localStorage.getItem("admin_profile_github") || "";
    const seedLinkedin = localStorage.getItem("admin_profile_linkedin") || "";
    setAdminName(seedName);
    setProfileBio(seedBio);
    setProfileGithub(seedGithub);
    setProfileLinkedin(seedLinkedin);
    setInitialSnapshot(`${seedName}|${seedBio}|${seedGithub}|${seedLinkedin}`);
  }, [adminUser]);

  // Track unsaved changes
  useEffect(() => {
    const current = `${adminName}|${profileBio}|${profileGithub}|${profileLinkedin}`;
    setIsDirty(current !== initialSnapshot || !!photoFile);
  }, [adminName, profileBio, profileGithub, profileLinkedin, photoFile, initialSnapshot]);

  const validateName = (value: string): string | undefined => {
    if (!value.trim()) return "Name cannot be empty.";
    return undefined;
  };

  const validateGithub = (value: string): string | undefined => {
    const v = value.trim();
    if (!v) return undefined;
    if (/^https?:\/\//i.test(v)) {
      try {
        const host = new URL(v).hostname.toLowerCase();
        if (!host.includes("github.com")) return "Enter a username or a github.com URL.";
      } catch {
        return "That doesn't look like a valid URL.";
      }
    } else if (!/^[a-zA-Z\d](?:[a-zA-Z\d]|-(?=[a-zA-Z\d])){0,38}$/.test(v)) {
      return "GitHub usernames are 1–39 chars: letters, numbers, hyphens.";
    }
    return undefined;
  };

  const validateLinkedin = (value: string): string | undefined => {
    const v = value.trim();
    if (!v) return undefined;
    if (!/^https?:\/\/(www\.)?linkedin\.com\//i.test(v)) {
      return "Enter a full linkedin.com profile URL.";
    }
    return undefined;
  };

  const runValidation = (): boolean => {
    const errors = {
      name: validateName(adminName),
      github: validateGithub(profileGithub),
      linkedin: validateLinkedin(profileLinkedin),
    };
    setProfileErrors(errors);
    setProfileTouched({ name: true, github: true, linkedin: true, bio: true });
    return !errors.name && !errors.github && !errors.linkedin;
  };

  const handleCopyEmail = async () => {
    if (!adminUser?.email) return;
    try {
      await navigator.clipboard.writeText(adminUser.email);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  };

  const handleDiscard = () => {
    const parts = initialSnapshot.split("|");
    setAdminName(parts[0]);
    setProfileBio(parts[1]);
    setProfileGithub(parts[2]);
    setProfileLinkedin(parts[3]);
    setPhotoFile(null);
    setPhotoPreview(null);
    setUploadError("");
    setProfileErrors({});
    setProfileTouched({});
    showToast("success", "Changes discarded.");
  };

  const processPhotoFile = (file: File | undefined | null) => {
    if (!file) return;
    setUploadError("");
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(file.type)) {
      setUploadError("Only JPG, PNG, or WEBP images are allowed.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setUploadError("Image is too large. Maximum size is 5MB.");
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
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0];
    processPhotoFile(file);
    e.target.value = "";
  };

  const handlePhotoDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setPhotoDragActive(false);
    const file = e.dataTransfer.files && e.dataTransfer.files[0];
    processPhotoFile(file);
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
      ctx.translate(150 + cropX * 1.5, 150 + cropY * 1.5);
      ctx.scale(cropScale, cropScale);
      ctx.drawImage(imgElement, -150, -baseHeight / 2, baseWidth, baseHeight);
      ctx.restore();
      canvas.toBlob((blob) => {
        if (!blob) return;
        const dataUrl = canvas.toDataURL("image/png");
        setPhotoFile(dataUrl);
        setPhotoPreview(dataUrl);
        setShowCropper(false);
      }, "image/png");
    };
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    setUploadError("");

    if (!runValidation()) {
      setSavingProfile(false);
      showToast("error", "Please fix the highlighted fields before saving.");
      return;
    }

    try {
      localStorage.setItem("admin_profile_name", adminName);
      localStorage.setItem("admin_profile_bio", profileBio);
      localStorage.setItem("admin_profile_github", profileGithub);
      localStorage.setItem("admin_profile_linkedin", profileLinkedin);

      // Upload the (cropped) photo to the backend so it's stored in Supabase
      // storage like students' avatars. Falls back to the local data URL when
      // Supabase isn't configured.
      if (photoPreview) {
        let finalPhoto = photoPreview;
        try {
          const blobRes = await fetch(photoPreview);
          const blob = await blobRes.blob();
          const upForm = new FormData();
          upForm.append("role", "admin");
          upForm.append("email", adminUser?.email || "admin");
          upForm.append("photo", new File([blob], "profile_photo.png", { type: "image/png" }));
          const up = await fetch("/api/profile", { method: "POST", body: upForm });
          const upData = await up.json();
          if (up.ok && upData.success && upData.avatar_url) {
            finalPhoto = upData.avatar_url;
          }
        } catch {
          /* keep local data URL fallback */
        }
        localStorage.setItem("admin_profile_photo", finalPhoto);
        setProfilePhoto(finalPhoto);
      }

      const updated = { ...adminUser, name: adminName };
      setAdminUser(updated);
      localStorage.setItem("user_registration", JSON.stringify(updated));

      const savedAt = new Date().toLocaleString();
      setLastSaved(savedAt);
      localStorage.setItem("admin_profile_updated_at", savedAt);

      setPhotoFile(null);
      setPhotoPreview(null);
      setPhotoTimestamp(Date.now());
      setInitialSnapshot(`${adminName}|${profileBio}|${profileGithub}|${profileLinkedin}`);
      setIsDirty(false);
      showToast("success", "Profile updated successfully!");
    } catch (err: any) {
      showToast("error", err.message || "Failed to save profile.");
    } finally {
      setSavingProfile(false);
    }
  };

  const githubUrl = (handle: string) => {
    const h = (handle || "").trim();
    if (!h) return "";
    return /^https?:\/\//i.test(h) ? h : `https://github.com/${h.replace(/^@/, "")}`;
  };

  // Renders a small trend chip (↑/↓) comparing the latest stats to the
  // snapshot captured on the previous dashboard load.
  const StatTrend = ({ delta, suffix = "" }: { delta: number; suffix?: string }) => {
    if (!delta) return null;
    const up = delta > 0;
    return (
      <span style={{ fontSize: "11px", fontWeight: "800", color: up ? "#16a34a" : "#dc2626" }}>
        {up ? "↑" : "↓"} {Math.abs(delta)}{suffix}{" "}
        <span style={{ color: "var(--db-text-muted)", fontWeight: "600" }}>since last sync</span>
      </span>
    );
  };

  // Auth gate — check for admin session via API call
  useEffect(() => {
    const saved = localStorage.getItem("user_registration");
    if (saved) {
      try {
        const u = JSON.parse(saved);
        if (u.role === "admin") {
          setAdminUser(u);
          setChecked(true);
          return;
        }
      } catch {}
    }
    // Also try verifying via cookie session
    fetch("/api/admin/me")
      .then(r => r.json())
      .then(data => {
        if (data.success && data.user) {
          setAdminUser(data.user);
        } else {
          router.replace("/login");
        }
      })
      .catch(() => router.replace("/login"))
      .finally(() => setChecked(true));
  }, [router]);

  useEffect(() => {
    if (checked && !adminUser) {
      router.replace("/login");
    }
  }, [checked, adminUser, router]);

  // Add dashboard body class
  useEffect(() => {
    document.body.classList.add("dashboard-body-active");
    document.documentElement.classList.add("dashboard-body-active");
    return () => {
      document.body.classList.remove("dashboard-body-active");
      document.documentElement.classList.remove("dashboard-body-active");
    };
  }, []);

  // Tick clock
  useEffect(() => {
    const t = setInterval(() => setNowTs(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const loadData = useCallback(async () => {
    setLoadingStats(true);
    setLoadingStudents(true);
    setLoadingAssignments(true);
    setLoadingResources(true);

    try {
      const [statsRes, studRes, assRes, subRes, annRes, resRes] = await Promise.all([
        fetch("/api/admin/analytics").then(r => r.json()),
        fetch("/api/register").then(r => r.json()),
        fetch("/api/assignments").then(r => r.json()),
        fetch("/api/submissions").then(r => r.json()),
        fetch("/api/announcements").then(r => r.json()),
        fetch("/api/resources").then(r => r.json()),
      ]);

      if (statsRes.success) {
        const s = statsRes.stats;
        setStats(s);

        // Compute trend deltas vs the snapshot stored on the previous load.
        const prevRaw = typeof window !== "undefined" ? localStorage.getItem("admin_stats_prev") : null;
        const prev = prevRaw ? JSON.parse(prevRaw) : null;
        setStatsDelta({
          students: prev ? s.totalStudents - prev.totalStudents : 0,
          attendance: prev ? s.avgAttendancePct - prev.avgAttendancePct : 0,
          resources: prev ? s.resourcesPublished - prev.resourcesPublished : 0,
          pending: prev ? s.assignmentsPendingReview - prev.assignmentsPendingReview : 0,
        });
        if (typeof window !== "undefined") {
          localStorage.setItem("admin_stats_prev", JSON.stringify({
            totalStudents: s.totalStudents,
            avgAttendancePct: s.avgAttendancePct,
            resourcesPublished: s.resourcesPublished,
            assignmentsPendingReview: s.assignmentsPendingReview,
          }));
        }
      }
      if (studRes.success && Array.isArray(studRes.registrations)) {
        setStudents(studRes.registrations);
      } else {
        setStudentsError(studRes?.error || "Could not load students.");
      }
      if (assRes.success) setAssignments(assRes.assignments || []);
      if (subRes.success) setSubmissions(subRes.submissions || []);
      if (annRes.success) setAnnouncements(annRes.announcements || []);
      if (resRes.success) setResources(resRes.resources || []);

      // Health probe (non-blocking for the rest of the dashboard).
      fetch("/api/admin/health").then(r => r.json()).then((h) => {
        if (h.success) setHealth(h.health);
      }).catch(() => { /* health is non-critical */ });
    // Fetch attendance report for analytics tab
       const reportRes = await fetch("/api/admin/attendance-report").then(r => r.json());
       if (reportRes.success) {
         setReport(reportRes);
         setReportLoading(false);
       } else {
         setReportError(reportRes.error || "Failed to load attendance report");
         setReportLoading(false);
       }

     } catch (e) {
      console.error("Failed to load admin data:", e);
    } finally {
      setLoadingStats(false);
      setLoadingStudents(false);
      setLoadingAssignments(false);
      setLoadingResources(false);
    }
  }, []);

  useEffect(() => {
    if (adminUser) loadData();
  }, [adminUser, loadData]);

  const handleAwardXp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!awardingStudent) return;
    if (!awardReason.trim()) {
      setAwardError("A reason is required to award/deduct XP.");
      return;
    }
    setAwardSubmitting(true);
    setAwardError(null);
    try {
      const res = await fetch("/api/admin/xp-awards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enrollmentNumber: awardingStudent.enrollment_number || awardingStudent.enrollmentNumber,
          amount: awardAmount,
          reason: awardReason
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast("success", `${Number(awardAmount) >= 0 ? "+" : ""}${awardAmount} XP awarded to ${awardingStudent.name}`);
        
        // Update local student XP state immediately
        setStudents(prev => prev.map(s => {
          const enrollS = (s.enrollment_number || s.enrollmentNumber || "").trim().toUpperCase();
          const enrollTarget = (awardingStudent.enrollment_number || awardingStudent.enrollmentNumber || "").trim().toUpperCase();
          if (enrollS === enrollTarget) {
            return { ...s, total_xp: (s.total_xp || 0) + Number(awardAmount) };
          }
          return s;
        }));
        
        // Reload analytics so Top Performer updates if changed
        fetch("/api/admin/analytics").then(r => r.json()).then(statsRes => {
          if (statsRes.success) setStats(statsRes.stats);
        }).catch(() => {});

        setAwardingStudent(null);
        setAwardReason("");
        setAwardAmount("10");
      } else {
        setAwardError(data.error || "Failed to award XP.");
      }
    } catch (err: any) {
      setAwardError(err.message || "Network error.");
    } finally {
      setAwardSubmitting(false);
    }
  };

  const handleToggleManualAttendance = async (enrollmentNumber: string, day: number, currentlyPresent: boolean) => {
    setUpdatingManualAtt(enrollmentNumber);
    try {
      const res = await fetch("/api/admin/manual-attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enrollmentNumber,
          day,
          present: !currentlyPresent
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast("success", `Successfully marked ${!currentlyPresent ? 'Present' : 'Absent'}!`);
        // Reload all data so dashboard and reports update
        loadData();
      } else {
        showToast("error", data.error || "Failed to update attendance");
      }
    } catch (err: any) {
      showToast("error", err.message || "Failed to update attendance");
    } finally {
      setUpdatingManualAtt(null);
    }
  };

  const loadXpHistory = async (student: any) => {
    setHistoryStudent(student);
    setLoadingHistory(true);
    setStudentHistory([]);
    try {
      const enroll = student.enrollment_number || student.enrollmentNumber;
      const res = await fetch(`/api/admin/xp-awards?enrollmentNumber=${encodeURIComponent(enroll)}`);
      const data = await res.json();
      if (data.success) {
        setStudentHistory(data.awards || []);
      }
    } catch (err) {
      console.error("Failed to load XP history:", err);
    } finally {
      setLoadingHistory(false);
    }
  };

  // Poll attendance window
  const pollAdminWindow = useCallback(async () => {
    try {
      const res = await fetch("/api/attendance/window");
      const data = await res.json();
      if (data.success && data.window) {
        setAdminWindow({ ...data.window, checkins: data.checkins || [] });
        prevWindowRef.current = { ...data.window, checkins: data.checkins || [] };
      } else {
        if (prevWindowRef.current) {
          // Window just closed
          const win = prevWindowRef.current;
          setLastSummary({
            day: win.day,
            checkins: win.checkins || [],
            totalRegistered: students.length || stats.totalStudents,
          });
          prevWindowRef.current = null;
          loadData();
        }
        setAdminWindow(null);
      }
    } catch {}
  }, [students.length, stats.totalStudents, loadData]);


  useEffect(() => {
    if (!adminUser) return;
    let alive = true;
    const poll = async () => { if (alive) await pollAdminWindow(); };
    const tick = () => setAdminNow(Date.now());
    poll();
    const pollInt = setInterval(poll, 2500);
    const tickInt = setInterval(tick, 1000);
    return () => { alive = false; clearInterval(pollInt); clearInterval(tickInt); };
  }, [adminUser, pollAdminWindow]);

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
        setLastSummary(null); // Clear any previous summary
        showToast("success", `Day ${qrDay} attendance window opened!`);
      }
    } finally { setOpening(false); }
  };

  const handleCloseWindow = async () => {
    setClosing(true);
    try {
      await fetch("/api/attendance/window/close", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      // Capture summary before clearing window
      if (adminWindow) {
        const totalRegistered = students.length || stats.totalStudents || 0;
        const checkedIn = adminWindow.checkins || [];
        const summary = {
          day: adminWindow.day,
          checkins: checkedIn,
          totalRegistered,
          timestamp: new Date().toISOString(),
        };
        setLastSummary(summary);
      }
      setAdminWindow(null);
      prevWindowRef.current = null;
      loadData();
      showToast("success", "Attendance window closed.");
    } finally { setClosing(false); }
  };

  const handleExportExcel = async () => {
    if (!report) {
      showToast("error", "No attendance data loaded yet to export.");
      return;
    }
    setExporting(true);
    try {
      const ExcelJS = (await import("exceljs")).default;
      const workbook = new ExcelJS.Workbook();
      
      // SHEET 1: Summary
      const sheet1 = workbook.addWorksheet("Summary");
      sheet1.views = [{ showGridLines: true }];
      
      // Title Row
      sheet1.mergeCells("A1:E1");
      const titleCell = sheet1.getCell("A1");
      titleCell.value = "Git & GitHub Masterclass — Executive Attendance Report";
      titleCell.font = { name: "Segoe UI", size: 14, bold: true, color: { argb: "FFFFFF" } };
      titleCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "1E3A8A" } }; // Navy Blue
      titleCell.alignment = { horizontal: "center", vertical: "middle" };
      sheet1.getRow(1).height = 40;
      
      // Details Info
      sheet1.addRow([]);
      sheet1.addRow(["Report Date & Time:", new Date().toLocaleString()]);
      sheet1.addRow([]);
      
      // Style info cells nicely
      const labelFont = { name: "Segoe UI", size: 10, bold: true, color: { argb: "64748B" } };
      const valFont = { name: "Segoe UI", size: 10, bold: true, color: { argb: "0F172A" } };
      sheet1.getRow(3).getCell(1).font = labelFont;
      sheet1.getRow(3).getCell(2).font = valFont;

      // Draw Summary Dashboard Cards (Row 5 & 6)
      sheet1.mergeCells("A5:A6");
      const card1 = sheet1.getCell("A5");
      card1.value = `Total Enrolled\n${report.totalRegistered}`;
      card1.font = { name: "Segoe UI", size: 11, bold: true, color: { argb: "1E293B" } };
      card1.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
      card1.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "F1F5F9" } };
      card1.border = {
        top: { style: "medium", color: { argb: "CBD5E1" } },
        bottom: { style: "medium", color: { argb: "CBD5E1" } },
        left: { style: "medium", color: { argb: "CBD5E1" } },
        right: { style: "medium", color: { argb: "CBD5E1" } }
      };

      sheet1.mergeCells("B5:C6");
      const card2 = sheet1.getCell("B5");
      card2.value = `Overall Attendance\n${report.overallRate}%`;
      const isHighAttendance = report.overallRate >= 75;
      card2.font = { name: "Segoe UI", size: 11, bold: true, color: { argb: isHighAttendance ? "15803D" : "B91C1C" } };
      card2.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
      card2.fill = { type: "pattern", pattern: "solid", fgColor: { argb: isHighAttendance ? "DCFCE7" : "FEE2E2" } };
      card2.border = {
        top: { style: "medium", color: { argb: isHighAttendance ? "86EFAC" : "FCA5A5" } },
        bottom: { style: "medium", color: { argb: isHighAttendance ? "86EFAC" : "FCA5A5" } },
        left: { style: "medium", color: { argb: isHighAttendance ? "86EFAC" : "FCA5A5" } },
        right: { style: "medium", color: { argb: isHighAttendance ? "86EFAC" : "FCA5A5" } }
      };

      sheet1.mergeCells("D5:E6");
      const card3 = sheet1.getCell("D5");
      const sessionsHeldCount = report.perDay?.filter((d: any) => d.checkedIn > 0).length || 0;
      card3.value = `Sessions Held\n${sessionsHeldCount} / ${WORKSHOP_DAYS}`;
      card3.font = { name: "Segoe UI", size: 11, bold: true, color: { argb: "0F172A" } };
      card3.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
      card3.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "F1F5F9" } };
      card3.border = {
        top: { style: "medium", color: { argb: "CBD5E1" } },
        bottom: { style: "medium", color: { argb: "CBD5E1" } },
        left: { style: "medium", color: { argb: "CBD5E1" } },
        right: { style: "medium", color: { argb: "CBD5E1" } }
      };

      sheet1.addRow([]); // Row 7 spacer
      sheet1.addRow([]); // Row 8 spacer
      
      // Day Summary Table Header (Row 9)
      const dayHeaderRow = ["Day", "Session Date", "Checked In", "Total Registered", "Attendance %"];
      const headerRowNum = 9;
      const headerRowObj = sheet1.getRow(headerRowNum);
      dayHeaderRow.forEach((val, idx) => {
        headerRowObj.getCell(idx + 1).value = val;
      });
      headerRowObj.height = 25;
      for (let col = 1; col <= 5; col++) {
        const cell = headerRowObj.getCell(col);
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "1E3A8A" } };
        cell.font = { name: "Segoe UI", size: 10, bold: true, color: { argb: "FFFFFF" } };
        cell.alignment = { horizontal: "center", vertical: "middle" };
        cell.border = {
          top: { style: "thin", color: { argb: "CCCCCC" } },
          bottom: { style: "medium", color: { argb: "1E3A8A" } },
          left: { style: "thin", color: { argb: "CCCCCC" } },
          right: { style: "thin", color: { argb: "CCCCCC" } }
        };
      }
      
      // Add day rows starting row 10
      report.perDay.forEach((dayData: any) => {
        const scheduleDay = SCHEDULE_DAYS.find((sd: any) => sd.day === dayData.day);
        const dateStr = scheduleDay ? scheduleDay.date : "N/A";
        const newRow = sheet1.addRow([
          `Day ${dayData.day}`,
          dateStr,
          dayData.checkedIn,
          report.totalRegistered,
          `${dayData.pct}%`
        ]);
        newRow.height = 20;
        
        for (let col = 1; col <= 5; col++) {
          const cell = newRow.getCell(col);
          cell.font = { name: "Segoe UI", size: 10 };
          cell.border = {
            top: { style: "thin", color: { argb: "EEEEEE" } },
            bottom: { style: "thin", color: { argb: "EEEEEE" } },
            left: { style: "thin", color: { argb: "EEEEEE" } },
            right: { style: "thin", color: { argb: "EEEEEE" } }
          };
          if (col === 1 || col === 2) {
            cell.alignment = { horizontal: "center", vertical: "middle" };
          } else {
            cell.alignment = { horizontal: "right", vertical: "middle" };
          }
        }
      });
      
      // Set Column Widths for Sheet 1
      sheet1.columns = [
        { width: 16 }, // Day
        { width: 20 }, // Session Date
        { width: 16 }, // Checked In
        { width: 22 }, // Total Registered
        { width: 18 }  // Attendance %
      ];
      
      // SHEET 2: Detailed Attendance
      const sheet2 = workbook.addWorksheet("Detailed Attendance");
      sheet2.views = [{ state: "frozen", ySplit: 1, showGridLines: true }];
      
      // Header row
      const headers2 = [
        "Name", 
        "Enrollment Number", 
        "Branch", 
        "Year of Study", 
        "Day 1", 
        "Day 2", 
        "Day 3", 
        "Day 4", 
        "Day 5", 
        "Day 6", 
        "Day 7", 
        "Total Attendance %"
      ];
      const header2Row = sheet2.addRow(headers2);
      header2Row.height = 28;
      for (let col = 1; col <= headers2.length; col++) {
        const cell = header2Row.getCell(col);
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "1E3A8A" } }; // Navy Blue
        cell.font = { name: "Segoe UI", size: 10, bold: true, color: { argb: "FFFFFF" } };
        cell.alignment = { horizontal: "center", vertical: "middle" };
        cell.border = {
          top: { style: "thin", color: { argb: "CCCCCC" } },
          bottom: { style: "medium", color: { argb: "1E3A8A" } },
          left: { style: "thin", color: { argb: "CCCCCC" } },
          right: { style: "thin", color: { argb: "CCCCCC" } }
        };
      }
      
      // Add student records (sorted by name)
      const sortedStudents = [...(report.students || [])].sort((a: any, b: any) =>
        (a.name || "").localeCompare(b.name || "")
      );
      
      sortedStudents.forEach((student: any) => {
        const rowValues: any[] = [
          student.name || "Unknown",
          student.enrollmentNumber || "",
          student.branch || "N/A",
          student.yearOfStudy ? `Year ${student.yearOfStudy}` : "N/A"
        ];
        
        let presentCount = 0;
        let heldCount = 0;
        
        for (let d = 1; d <= 7; d++) {
          const isPresent = student.presentDays?.includes(d);
          const isWindowOpen = adminWindow && adminWindow.day === d;
          const dayReport = report?.perDay?.find((pd: any) => pd.day === d);
          const isHeld = (dayReport && dayReport.checkedIn > 0) || d <= (stats.sessionsCompleted || 0);
          
          if (isPresent) {
            rowValues.push("Present");
            presentCount++;
            heldCount++;
          } else if (isWindowOpen) {
            rowValues.push("Waiting");
            heldCount++;
          } else if (isHeld) {
            rowValues.push("Absent");
            heldCount++;
          } else {
            rowValues.push("N/A");
          }
        }
        
        const ratePct = heldCount > 0 ? Math.round((presentCount / heldCount) * 100) : 0;
        rowValues.push(`${ratePct}%`);
        
        const studentRow = sheet2.addRow(rowValues);
        studentRow.height = 22;
        
        // Style cells
        for (let col = 1; col <= headers2.length; col++) {
          const cell = studentRow.getCell(col);
          cell.font = { name: "Segoe UI", size: 10 };
          cell.border = {
            top: { style: "thin", color: { argb: "EEEEEE" } },
            bottom: { style: "thin", color: { argb: "EEEEEE" } },
            left: { style: "thin", color: { argb: "EEEEEE" } },
            right: { style: "thin", color: { argb: "EEEEEE" } }
          };
          
          if (col === 1) {
            cell.alignment = { horizontal: "left", vertical: "middle" };
          } else {
            cell.alignment = { horizontal: "center", vertical: "middle" };
          }
          
          // Conditional cell formatting (Days 1-7 are columns 5 to 11)
          if (col >= 5 && col <= 11) {
            const val = cell.value;
            if (val === "Present") {
              cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "DCFCE7" } }; // Soft green
              cell.font = { name: "Segoe UI", size: 10, color: { argb: "15803D" }, bold: true };
            } else if (val === "Absent") {
              cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FEE2E2" } }; // Soft red
              cell.font = { name: "Segoe UI", size: 10, color: { argb: "B91C1C" }, bold: true };
            } else if (val === "Waiting") {
              cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FEF3C7" } }; // Soft yellow
              cell.font = { name: "Segoe UI", size: 10, color: { argb: "D97706" }, bold: true };
            } else {
              cell.font = { name: "Segoe UI", size: 10, color: { argb: "94A3B8" } };
            }
          }
          
          // Style last % rate cell with conditional highlight (<75% low attendance flag)
          if (col === 12) {
            const isLowAttendance = ratePct < 75;
            cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: isLowAttendance ? "FEE2E2" : "DCFCE7" } };
            cell.font = { name: "Segoe UI", size: 10, bold: true, color: { argb: isLowAttendance ? "B91C1C" : "15803D" } };
          }
        }
      });
      
      // Auto-fit column widths for Sheet 2 dynamically
      sheet2.columns.forEach((column: any) => {
        let maxLen = 0;
        column.eachCell({ includeEmpty: true }, (cell: any) => {
          const val = cell.value ? String(cell.value) : "";
          if (val.length > maxLen) {
            maxLen = val.length;
          }
        });
        column.width = Math.max(maxLen + 4, 12);
      });
      
      // Save file
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      const todayStr = new Date().toISOString().split("T")[0];
      anchor.download = `Git-GitHub-Masterclass-Attendance-Report-${todayStr}.xlsx`;
      anchor.click();
      window.URL.revokeObjectURL(url);
      
      showToast("success", "Exported Excel file successfully!");
    } catch (err: any) {
      console.error("Excel generation error:", err);
      showToast("error", "Failed to generate Excel file.");
    } finally {
      setExporting(false);
    }
  };

  const handleCreateResource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newResTitle || !newResType || !newResUrl) return;
    setCreatingRes(true);
    try {
      const res = await fetch("/api/resources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newResTitle, type: newResType, url: newResUrl, session_number: newResDay }),
      });
      if (res.ok) {
        showToast("success", "Resource published successfully!");
        setNewResTitle(""); setNewResUrl("");
        loadData();
      } else {
        showToast("error", "Failed to publish resource.");
      }
    } catch { showToast("error", "Network error."); }
    finally { setCreatingRes(false); }
  };

  const handleDeleteResource = async (id: string) => {
    if (!confirm("Are you sure you want to delete this resource?")) return;
    try {
      const res = await fetch(`/api/resources/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        showToast("success", "Resource deleted successfully!");
        loadData();
      } else {
        showToast("error", "Failed to delete resource.");
      }
    } catch {
      showToast("error", "Network error.");
    }
  };

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAssTitle || !newAssDesc || !newAssDueDate) return;
    if (!reqLiveUrl && !reqGithubLink && !reqAttachment) {
      showToast("error", "At least one submission field must be selected.");
      return;
    }
    setCreatingAss(true);
    try {
      const match = newAssTitle.match(/Day\s*(\d+)/i);
      const session_day = match ? Number(match[1]) : null;

      const res = await fetch("/api/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newAssTitle,
          description: newAssDesc,
          due_date: newAssDueDate,
          max_marks: newAssMaxMarks,
          session_day,
          submission_requirements: {
            live_url: reqLiveUrl,
            github_link: reqGithubLink,
            attachment: reqAttachment
          }
        }),
      });
      if (res.ok) {
        showToast("success", "Assignment published!");
        setNewAssTitle(""); setNewAssDesc(""); setNewAssDueDate("");
        setReqLiveUrl(true); setReqGithubLink(true); setReqAttachment(false);
        loadData();
      } else {
        showToast("error", "Failed to create assignment.");
      }
    } catch { showToast("error", "Network error."); }
    finally { setCreatingAss(false); }
  };

  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAnnTitle || !newAnnContent) return;
    setCreatingAnn(true);
    try {
      const res = await fetch("/api/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newAnnTitle, content: newAnnContent, type: newAnnType }),
      });
      if (res.ok) {
        showToast("success", "Announcement broadcasted!");
        setNewAnnTitle(""); setNewAnnContent("");
        loadData();
      } else {
        showToast("error", "Failed to broadcast.");
      }
    } catch { showToast("error", "Network error."); }
    finally { setCreatingAnn(false); }
  };

  const handleEvaluate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubId || gradeMarks === "") return;
    setGrading(true);
    try {
      const res = await fetch("/api/admin/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          submission_id: selectedSubId,
          marks_obtained: gradeMarks,
          mentor_feedback: gradeFeedback,
          manual_bonus_xp: Number(manualBonusXp)
        }),
      });
      if (res.ok) {
        showToast("success", "Evaluation saved and XP updated!");
        setSelectedSubId("");
        setGradeMarks("");
        setGradeFeedback("");
        setManualBonusXp("0");
        setGradingSubmission(null);
        loadData();
      } else {
        showToast("error", "Failed to save evaluation.");
      }
    } catch { showToast("error", "Network error."); }
    finally { setGrading(false); }
  };

  const handleLogout = async () => {
    try { await fetch("/api/admin/logout", { method: "POST" }); } catch {}
    localStorage.removeItem("user_registration");
    router.replace("/login");
  };

  const filteredStudents = students.filter(s =>
    (s.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.enrollmentNumber || s.enrollment_number || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const pendingSubmissions = submissions.filter(s => s.marks_obtained === null || s.marks_obtained === undefined);
  const gradedSubmissions = submissions.filter(s => s.marks_obtained !== null && s.marks_obtained !== undefined);
  const workshopCompletionPct = Math.round((stats.sessionsCompleted / WORKSHOP_DAYS) * 100);
  const todayCheckins = adminWindow ? (adminWindow.checkins?.length || 0) : 0;

  // Stat card count-up animations
  const animStudents = useCountUp(stats.totalStudents);
  const animAttendance = useCountUp(stats.avgAttendancePct);
  const animResources = useCountUp(stats.resourcesPublished);
  const animPending = useCountUp(stats.assignmentsPendingReview);

  if (!adminUser) {
    return (
      <div style={{ padding: "80px 20px", textAlign: "center" }}>
        <p>Verifying admin access…</p>
      </div>
    );
  }

  // Attendance ring
  const expiresAt = adminWindow ? new Date(adminWindow.expires_at).getTime() : 0;
  const remainingMs = Math.max(0, expiresAt - adminNow);
  const totalMs = ATTENDANCE_WINDOW_MINUTES * 60 * 1000;
  const secs = Math.floor(remainingMs / 1000);
  const mm = String(Math.floor(secs / 60)).padStart(2, "0");
  const ss = String(secs % 60).padStart(2, "0");
  const attProgress = totalMs ? remainingMs / totalMs : 0;

  const MENU_ITEMS = [
    { id: "home", label: "Home", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg> },
    { id: "sessions", label: "Sessions", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> },
    { id: "attendance", label: "Attendance", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>, badge: adminWindow },
    { id: "resources", label: "Resources", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg> },
    { id: "assignments", label: "Assignments", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>, badge: pendingSubmissions.length > 0 },
    { id: "leaderboard", label: "Leaderboard", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg> },
    { id: "students", label: "Students", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
    { id: "polls", label: "Live Polls", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg> },
    { id: "profile", label: "Profile", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> },
  ];

  return (
    <div className="dashboard-view">
      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", top: "20px", right: "20px", zIndex: 9999,
          backgroundColor: toast.type === "success" ? "#16a34a" : "#dc2626",
          color: "#fff", padding: "12px 20px", borderRadius: "10px",
          fontSize: "13px", fontWeight: "700", boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
          animation: "slideInRight 0.3s ease",
        }}>
          {toast.type === "success" ? "✅" : "❌"} {toast.message}
        </div>
      )}

      {/* ===== SIDEBAR ===== */}
      <aside className="db-sidebar">
        <a href="/" className="db-sidebar-logo-section">
          <div className="db-sidebar-logo-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '26px', height: '26px', color: '#ffffff' }}>
              <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
            </svg>
          </div>
          <div className="db-sidebar-logo-text-wrapper">
            <span className="db-sidebar-logo-title">Git &amp; GitHub</span>
            <span className="db-sidebar-logo-subtitle">MASTERCLASS</span>
          </div>
        </a>

        {/* Admin Profile Card */}
        <div className="db-sidebar-profile-card">
          <div className="db-sidebar-profile-avatar" style={{ background: "var(--db-accent-yellow)", color: "#000", overflow: "hidden" }}>
            <img src={profilePhoto || "/images/mohit_raj.png"} alt="Admin" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
          <div className="db-sidebar-profile-info">
            <div className="db-sidebar-profile-name">{adminUser.name || "Admin"}</div>
            <div className="db-sidebar-profile-role">Workshop Organizer</div>
          </div>
          <span className="db-sidebar-xp-badge" style={{ background: "var(--db-accent-yellow)", color: "#000" }}>ADMIN</span>
        </div>

        <nav className="db-menu">
          {MENU_ITEMS.map((item) => (
            <div
              key={item.id}
              className={`db-menu-item ${currentTab === item.id ? "active" : ""}`}
              onClick={() => setCurrentTab(item.id)}
              style={{ position: "relative" }}
            >
              {item.icon}
              <span>{item.label}</span>
              {item.badge && <span className="db-menu-badge-dot" />}
            </div>
          ))}
        </nav>

        <div className="db-sidebar-footer">
          <div className="db-sidebar-footer-quote">
            <span className="db-sidebar-footer-quote-icon">⚡</span>
            <p>Organizer Mode.<br />Build the experience.<br />Shape the future.</p>
          </div>
          <button onClick={handleLogout} className="db-sidebar-logout-btn" title="Logout"
            style={{ marginTop: 10, display: "flex", alignItems: "center", gap: "8px", justifyContent: "center", width: "100%", padding: "8px 12px" }}>
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            <span style={{ fontSize: "13px", fontWeight: "700" }}>Logout</span>
          </button>
        </div>
      </aside>

      {/* ===== MAIN CONTENT ===== */}
      <main className="db-main-content">
        {/* Header */}
        <header className="db-header">
          <div className="db-header-welcome">
            <div className="db-header-user-avatar" style={{ backgroundColor: "var(--db-accent-yellow)", display: "flex", justifyContent: "center", alignItems: "center", fontWeight: "900", fontSize: "16px", color: "#000", overflow: "hidden" }}>
              <img src="/images/mohit_raj.png" alt="Admin" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
            <div className="db-header-greeting-block">
              <span className="db-header-greeting-time">{getTimeGreeting(nowTs)},</span>
              <h1 className="db-header-greeting-name">{adminUser.name || "Admin"} 👋</h1>
              <div className="db-header-greeting-meta">Workshop Organizer &nbsp;·&nbsp; Admin Console</div>
            </div>
          </div>
          <div className="db-header-widgets">
            <div style={{
              background: "var(--db-accent-yellow)", borderRadius: "8px",
              padding: "6px 14px", fontSize: "11px", fontWeight: "900",
              color: "#000", letterSpacing: "0.5px", textTransform: "uppercase",
            }}>
              🛡️ Admin Mode
            </div>
          </div>
        </header>

        {/* ======= TAB: HOME ======= */}
        {currentTab === "home" && (
          <>
            {/* Stat Cards Row */}
            {loadingStats ? (
              <LoadingSpinner label="Loading dashboard…" />
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "20px" }}>
                <div className="modern-card" onClick={() => setCurrentTab("students")} style={{ cursor: "pointer", padding: "20px 24px", display: "flex", flexDirection: "column", gap: "4px", backgroundColor: "#fff" }}>
                  <span style={{ fontSize: "11px", fontWeight: "800", color: "var(--db-text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>Total Students</span>
                  <h3 style={{ fontSize: "28px", fontWeight: "900", color: "var(--db-text-primary)", margin: 0 }}>{animStudents}</h3>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                    <span style={{ fontSize: "11px", color: "var(--db-text-muted)", fontWeight: "600" }}>Registered</span>
                    <StatTrend delta={statsDelta.students} />
                  </div>
                </div>
                <div className="modern-card" onClick={() => setCurrentTab("attendance")} style={{ cursor: "pointer", padding: "20px 24px", display: "flex", flexDirection: "column", gap: "4px", backgroundColor: "#fff" }}>
                  <span style={{ fontSize: "11px", fontWeight: "800", color: "var(--db-text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>Avg Attendance</span>
                  <h3 style={{ fontSize: "28px", fontWeight: "900", color: "var(--db-text-primary)", margin: 0 }}>{animAttendance}%</h3>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                    <span style={{ fontSize: "11px", color: "var(--db-text-muted)", fontWeight: "600" }}>Across sessions</span>
                    <StatTrend delta={statsDelta.attendance} suffix="%" />
                  </div>
                </div>
                <div className="modern-card" onClick={() => setCurrentTab("resources")} style={{ cursor: "pointer", padding: "20px 24px", display: "flex", flexDirection: "column", gap: "4px", backgroundColor: "#fff" }}>
                  <span style={{ fontSize: "11px", fontWeight: "800", color: "var(--db-text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>Resources Published</span>
                  <h3 style={{ fontSize: "28px", fontWeight: "900", color: "var(--db-text-primary)", margin: 0 }}>{animResources}</h3>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                    <span style={{ fontSize: "11px", color: "var(--db-text-muted)", fontWeight: "600" }}>Live now</span>
                    <StatTrend delta={statsDelta.resources} />
                  </div>
                </div>
                <div className="modern-card" onClick={() => setCurrentTab("assignments")} style={{ cursor: "pointer", padding: "20px 24px", display: "flex", flexDirection: "column", gap: "4px", backgroundColor: "#fff", borderLeft: pendingSubmissions.length > 0 ? "4px solid var(--db-accent-orange)" : undefined }}>
                  <span style={{ fontSize: "11px", fontWeight: "800", color: "var(--db-text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>Pending Review</span>
                  <h3 style={{ fontSize: "28px", fontWeight: "900", color: pendingSubmissions.length > 0 ? "var(--db-accent-orange)" : "var(--db-text-primary)", margin: 0 }}>{animPending}</h3>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                    <span style={{ fontSize: "11px", color: "var(--db-text-muted)", fontWeight: "600" }}>Submissions</span>
                    <StatTrend delta={statsDelta.pending} />
                  </div>
                </div>
              </div>
            )}

            {/* Main content grid */}
            <div className="home-top-row" style={{ marginTop: "20px" }}>
              {/* Left col */}
              <div style={{ display: "flex", flexDirection: "column", gap: "20px", flex: 1, minWidth: 0 }}>

                {/* Admin Actions Needed */}
                <div className="progress-chart-card" style={{ minHeight: "auto", padding: "22px 24px" }}>
                  <div className="progress-chart-header" style={{ marginBottom: "16px" }}>
                    <span className="progress-chart-title">⚡ Admin Actions Needed</span>
                    <span style={{ fontSize: "11px", color: "var(--db-text-muted)", fontWeight: "600" }}>Click to act</span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {!adminWindow && (
                      <div
                        onClick={() => setCurrentTab("attendance")}
                        style={{
                          display: "flex", alignItems: "center", gap: "12px", padding: "12px 16px",
                          borderRadius: "10px", border: "1.5px solid rgba(255,212,70,0.5)",
                          background: "rgba(255,212,70,0.08)", cursor: "pointer", transition: "all 0.2s",
                        }}
                        className="quick-action-btn"
                      >
                        <span style={{ fontSize: "18px" }}>🕐</span>
                        <div>
                          <div style={{ fontSize: "13px", fontWeight: "800", color: "var(--db-text-primary)" }}>Open Attendance Window</div>
                          <div style={{ fontSize: "11px", color: "var(--db-text-muted)" }}>No window is currently active for students</div>
                        </div>
                        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginLeft: "auto", flexShrink: 0, color: "var(--db-text-muted)" }}><polyline points="9 18 15 12 9 6"/></svg>
                      </div>
                    )}
                    {pendingSubmissions.length > 0 && (
                      <div
                        onClick={() => setCurrentTab("assignments")}
                        style={{
                          display: "flex", alignItems: "center", gap: "12px", padding: "12px 16px",
                          borderRadius: "10px", border: "1.5px solid rgba(249,115,22,0.3)",
                          background: "rgba(249,115,22,0.06)", cursor: "pointer", transition: "all 0.2s",
                        }}
                        className="quick-action-btn"
                      >
                        <span style={{ fontSize: "18px" }}>📝</span>
                        <div>
                          <div style={{ fontSize: "13px", fontWeight: "800", color: "var(--db-text-primary)" }}>{pendingSubmissions.length} submission{pendingSubmissions.length !== 1 ? "s" : ""} awaiting review</div>
                          <div style={{ fontSize: "11px", color: "var(--db-text-muted)" }}>Grade and provide feedback</div>
                        </div>
                        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginLeft: "auto", flexShrink: 0, color: "var(--db-text-muted)" }}><polyline points="9 18 15 12 9 6"/></svg>
                      </div>
                    )}
                    <div
                      onClick={() => setCurrentTab("resources")}
                      style={{
                        display: "flex", alignItems: "center", gap: "12px", padding: "12px 16px",
                        borderRadius: "10px", border: "1.5px solid rgba(0,0,0,0.07)",
                        background: "rgba(0,0,0,0.02)", cursor: "pointer", transition: "all 0.2s",
                      }}
                      className="quick-action-btn"
                    >
                      <span style={{ fontSize: "18px" }}>📁</span>
                      <div>
                        <div style={{ fontSize: "13px", fontWeight: "800", color: "var(--db-text-primary)" }}>Publish session resources</div>
                        <div style={{ fontSize: "11px", color: "var(--db-text-muted)" }}>{resources.length} resource{resources.length !== 1 ? "s" : ""} published so far</div>
                      </div>
                      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginLeft: "auto", flexShrink: 0, color: "var(--db-text-muted)" }}><polyline points="9 18 15 12 9 6"/></svg>
                    </div>
                    <div
                      onClick={() => setCurrentTab("assignments")}
                      style={{
                        display: "flex", alignItems: "center", gap: "12px", padding: "12px 16px",
                        borderRadius: "10px", border: "1.5px solid rgba(0,0,0,0.07)",
                        background: "rgba(0,0,0,0.02)", cursor: "pointer", transition: "all 0.2s",
                      }}
                      className="quick-action-btn"
                    >
                      <span style={{ fontSize: "18px" }}>📚</span>
                      <div>
                        <div style={{ fontSize: "13px", fontWeight: "800", color: "var(--db-text-primary)" }}>Create new assignment</div>
                        <div style={{ fontSize: "11px", color: "var(--db-text-muted)" }}>{assignments.length} assignment{assignments.length !== 1 ? "s" : ""} created so far</div>
                      </div>
                      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginLeft: "auto", flexShrink: 0, color: "var(--db-text-muted)" }}><polyline points="9 18 15 12 9 6"/></svg>
                    </div>
                    {(!adminWindow && pendingSubmissions.length === 0 && resources.length > 0 && assignments.length > 0) && (
                      <div style={{ padding: "16px", textAlign: "center", color: "var(--db-text-muted)", fontSize: "13px" }}>
                        ✅ All caught up! No urgent actions needed.
                      </div>
                    )}
                  </div>
                </div>

                {/* Quick Action Buttons */}
                <div className="quick-actions-card" style={{ padding: "22px 24px" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "24px", width: "100%", flexWrap: "wrap" }}>
                    <div style={{ minWidth: "140px" }}>
                      <h3 className="progress-chart-title" style={{ marginBottom: "4px", fontSize: "14px", fontWeight: "800" }}>Quick Actions</h3>
                      <p style={{ fontSize: "11px", color: "var(--db-text-muted)", margin: 0, lineHeight: "1.4" }}>Admin shortcuts</p>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "10px", flex: 1 }}>
                      {[
                        { icon: "⏱️", label: "Open Attendance", sub: "Start check-in", tab: "attendance", highlight: !adminWindow },
                        { icon: "📁", label: "Publish Resource", sub: "Upload files", tab: "resources" },
                        { icon: "📝", label: "New Assignment", sub: "Create task", tab: "assignments" },
                        { icon: "🏆", label: "Leaderboard", sub: "View rankings", tab: "leaderboard" },
                        { icon: "👥", label: "Students", sub: "Manage roster", tab: "students" },
                        { icon: "📢", label: "Announce", sub: "Broadcast msg", tab: "sessions" },
                      ].map(a => (
                        <button key={a.tab + a.label} onClick={() => setCurrentTab(a.tab)}
                          style={{
                            display: "flex", alignItems: "center", gap: "10px",
                            background: a.highlight ? "rgba(255,212,70,0.12)" : "rgba(0,0,0,0.03)",
                            border: a.highlight ? "1px solid rgba(255,212,70,0.4)" : "1px solid rgba(0,0,0,0.06)",
                            borderRadius: "12px", padding: "10px 14px", color: "var(--db-text-primary)",
                            cursor: "pointer", transition: "all 0.2s", textAlign: "left",
                          }} className="quick-action-btn">
                          <span style={{ fontSize: "18px" }}>{a.icon}</span>
                          <div style={{ display: "flex", flexDirection: "column" }}>
                            <span style={{ fontWeight: "750", fontSize: "12px" }}>{a.label}</span>
                            <span style={{ fontSize: "9px", color: "var(--db-text-muted)" }}>{a.sub}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Horizontally aligned Check-ins and Top Performer widgets */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                  {/* Today's Check-ins */}
                  <div className="event-card" style={{ minHeight: "auto", padding: "16px 20px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "16px", width: "100%" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <div style={{ fontSize: "36px", fontWeight: "900", color: adminWindow ? "var(--db-accent-yellow)" : "var(--db-text-muted)", lineHeight: 1 }}>
                          {todayCheckins}
                        </div>
                        <div>
                          <span className="event-card-badge" style={{ color: "var(--db-accent-orange)", fontWeight: 800, fontSize: "10px", display: "block", marginBottom: "2px" }}>TODAY'S CHECK-INS</span>
                          <span style={{ fontSize: "11px", color: "var(--db-text-muted)", display: "flex", alignItems: "center", gap: "4px" }}>
                            {adminWindow ? (
                              <>
                                <span style={{ color: "#22c55e", fontWeight: "800" }}>🟢 LIVE</span> · Day {adminWindow.day}
                              </>
                            ) : "No active window"}
                          </span>
                        </div>
                      </div>
                      <button onClick={() => setCurrentTab("attendance")} className="quick-action-btn"
                        style={{ padding: "8px 14px", borderRadius: "8px", border: "1px solid rgba(0,0,0,0.08)", background: "rgba(0,0,0,0.03)", cursor: "pointer", fontSize: "12px", fontWeight: "700", color: "var(--db-text-primary)" }}>
                        {adminWindow ? "Logs →" : "Open Window →"}
                      </button>
                    </div>
                  </div>

                  {/* Top Performer */}
                  <div className="event-card" style={{ minHeight: "auto", padding: "16px 20px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "16px", width: "100%" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <span style={{ fontSize: "28px" }}>🏆</span>
                        <div>
                          <span className="event-card-badge" style={{ color: "var(--db-accent-orange)", fontWeight: 800, fontSize: "10px", display: "block", marginBottom: "2px" }}>TOP PERFORMER</span>
                          {stats.topPerformer ? (
                            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                              <span style={{ fontSize: "12px", fontWeight: "900", color: "var(--db-text-primary)" }}>{stats.topPerformer.name}</span>
                              <span style={{ background: "var(--db-accent-yellow)", color: "#000", borderRadius: "20px", padding: "1px 6px", fontSize: "10px", fontWeight: "900" }}>
                                {stats.topPerformer.xp} XP
                              </span>
                            </div>
                          ) : (
                            <span style={{ fontSize: "11px", color: "var(--db-text-muted)" }}>No data yet</span>
                          )}
                        </div>
                      </div>
                      <button onClick={() => setCurrentTab("leaderboard")} className="quick-action-btn"
                        style={{ padding: "8px 14px", borderRadius: "8px", border: "1px solid rgba(0,0,0,0.08)", background: "rgba(0,0,0,0.03)", cursor: "pointer", fontSize: "12px", fontWeight: "700", color: "var(--db-text-primary)" }}>
                        Leaderboard →
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right col: Workshop Completion only */}
              <div style={{ display: "flex", flexDirection: "column", gap: "16px", width: "320px", flexShrink: 0 }}>
                {/* Workshop Completion */}
                <div className="modern-card" style={{ minHeight: "auto", padding: "20px", backgroundColor: "#fff", display: "flex", flexDirection: "column", gap: "14px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ color: "var(--db-accent-orange)", fontWeight: 900, fontSize: "10px", letterSpacing: "1px", textTransform: "uppercase" }}>WORKSHOP COMPLETION</span>
                    <span style={{ fontSize: "10px", color: "var(--db-text-muted)", fontWeight: "800" }}>{stats.sessionsCompleted}/{WORKSHOP_DAYS} DAYS</span>
                  </div>
                  
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "14px", padding: "4px 0" }}>
                    {/* Ring Progress */}
                    <div style={{ position: "relative", width: "84px", height: "84px" }}>
                      <svg viewBox="0 0 100 100" style={{ width: "100%", height: "100%", transform: "rotate(-90deg)" }}>
                        <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(0,0,0,0.05)" strokeWidth="9" />
                        <circle cx="50" cy="50" r="40" fill="none"
                           stroke={workshopCompletionPct === 0 ? "#D1D5DB" : "var(--db-accent-yellow)"}
                           strokeWidth="9"
                           strokeDasharray={`${251.2 * workshopCompletionPct / 100} 251.2`}
                           strokeLinecap="round"
                           style={{ transition: "stroke-dasharray 0.5s ease" }}
                        />
                      </svg>
                      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                        <span style={{ fontSize: "18px", fontWeight: "900", color: "var(--db-text-primary)" }}>{workshopCompletionPct}%</span>
                      </div>
                    </div>

                    {/* Stats details */}
                    <div style={{ textAlign: "center", width: "100%" }}>
                      <div style={{ fontSize: "13px", fontWeight: "800", color: "var(--db-text-primary)" }}>
                        {stats.sessionsCompleted} of {WORKSHOP_DAYS} Sessions
                      </div>
                      <div style={{ fontSize: "11px", color: "var(--db-text-muted)", marginTop: "2px" }}>
                        Fully conducted sessions
                      </div>
                      {/* Simple progress bar under */}
                      <div style={{ width: "100%", height: "5px", background: "rgba(0,0,0,0.05)", borderRadius: "4px", marginTop: "10px", overflow: "hidden" }}>
                        <div style={{ width: `${workshopCompletionPct}%`, height: "100%", background: "linear-gradient(90deg, #FFD446, #FFC200)", borderRadius: "4px", transition: "width 0.5s ease" }}></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Additional Quick Actions in Right Sidebar */}
                <div className="modern-card" style={{ minHeight: "auto", padding: "20px", backgroundColor: "#fff", display: "flex", flexDirection: "column", gap: "14px" }}>
                  <span style={{ color: "var(--db-accent-orange)", fontWeight: 900, fontSize: "10px", letterSpacing: "1px", textTransform: "uppercase" }}>CONSOLE SHORTCUTS</span>
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {[
                      { icon: "⏱️", label: "Open Attendance", tab: "attendance" },
                      { icon: "📁", label: "Upload Resources", tab: "resources" },
                      { icon: "📝", label: "Review Assignments", tab: "assignments" },
                      { icon: "👥", label: "Student Directory", tab: "students" },
                    ].map(btn => (
                      <button
                        key={btn.tab}
                        onClick={() => setCurrentTab(btn.tab)}
                        style={{
                          display: "flex", alignItems: "center", gap: "12px",
                          background: "rgba(0,0,0,0.03)", border: "1px solid rgba(0,0,0,0.06)",
                          borderRadius: "10px", padding: "10px 14px", color: "var(--db-text-primary)",
                          cursor: "pointer", transition: "all 0.2s", width: "100%", textAlign: "left"
                        }}
                        className="quick-action-btn"
                      >
                        <span style={{ fontSize: "16px" }}>{btn.icon}</span>
                        <span style={{ fontWeight: "750", fontSize: "12px" }}>{btn.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* System Status & Sync Card */}
                <div className="modern-card" style={{ minHeight: "auto", padding: "20px", backgroundColor: "#fff", display: "flex", flexDirection: "column", gap: "12px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ color: "var(--db-accent-orange)", fontWeight: 900, fontSize: "10px", letterSpacing: "1px", textTransform: "uppercase" }}>DATABASE & SYSTEM STATUS</span>
                    {health && (
                      <span style={{ fontSize: "9px", color: "var(--db-text-muted)", fontWeight: "700" }}>
                        {health.latencyMs}ms
                      </span>
                    )}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "11px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 8px", borderRadius: "6px", background: health?.db?.status === "connected" ? "rgba(34,197,94,0.06)" : "rgba(239,68,68,0.06)" }}>
                      <span style={{ color: "var(--db-text-secondary)", fontWeight: "600" }}>Supabase DB Connection</span>
                      <span style={{ color: health?.db?.status === "connected" ? "#16a34a" : "#dc2626", fontWeight: "800", display: "flex", alignItems: "center", gap: "4px" }}>
                        <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: health?.db?.status === "connected" ? "#22c55e" : "#ef4444", display: "inline-block" }}></span>
                        {health ? (health.db.status === "connected" ? `Connected · ${health.db.latencyMs}ms` : "Disconnected") : "Checking…"}
                      </span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 8px", borderRadius: "6px", background: health?.syncMode === "live" ? "rgba(34,197,94,0.06)" : "rgba(245,158,11,0.06)" }}>
                      <span style={{ color: "var(--db-text-secondary)", fontWeight: "600" }}>API Sync Mode</span>
                      <span style={{ color: health?.syncMode === "live" ? "#16a34a" : "#b45309", fontWeight: "800" }}>
                        {health ? (health.syncMode === "live" ? "Live Database Sync" : "Local Fallback") : "Checking…"}
                      </span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 8px", borderRadius: "6px", background: "rgba(0,0,0,0.02)" }}>
                      <span style={{ color: "var(--db-text-secondary)", fontWeight: "600" }}>Attendance Window</span>
                      <span style={{ color: adminWindow ? "#16a34a" : (health?.window?.status === "open" ? "#16a34a" : "var(--db-text-muted)"), fontWeight: "850" }}>
                        {adminWindow ? "🟢 Open (Day " + adminWindow.day + ")" : (health?.window?.status === "open" ? `🟢 Open (Day ${health.window.day})` : "🔴 Closed")}
                      </span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 8px", borderRadius: "6px", background: "rgba(0,0,0,0.02)" }}>
                      <span style={{ color: "var(--db-text-secondary)", fontWeight: "600" }}>Auth Secret Keys</span>
                      <span style={{ color: health?.auth?.configured ? "#16a34a" : "var(--db-accent-orange)", fontWeight: "800" }}>
                        {health ? (health.auth?.configured ? "Configured" : "Default (insecure)") : "Checking…"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Session Roadmap Card */}
                <div className="modern-card" style={{ minHeight: "auto", padding: "20px", backgroundColor: "#fff", display: "flex", flexDirection: "column", gap: "12px" }}>
                  <span style={{ color: "var(--db-accent-orange)", fontWeight: 900, fontSize: "10px", letterSpacing: "1px", textTransform: "uppercase" }}>SESSION ROADMAP</span>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {SCHEDULE_DAYS.map((sd) => {
                      const perDay = (stats.perDayAttendance || []).find((d: any) => d.day === sd.day);
                      const attendeeCount = perDay?.attendeeCount ?? 0;
                      const pct = perDay?.percentage ?? 0;
                      const isCompleted = sd.day <= stats.sessionsCompleted;
                      const isNext = sd.day === stats.sessionsCompleted + 1;
                      return (
                        <div key={sd.day} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "6px 8px", borderRadius: "6px", background: isNext ? "rgba(255,212,70,0.08)" : "rgba(0,0,0,0.02)", border: isNext ? "1px solid rgba(255,212,70,0.3)" : "none" }}>
                          <span style={{ fontSize: "14px" }}>{isCompleted ? "✅" : isNext ? "⭐" : "📅"}</span>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: "750", fontSize: "11px", color: "var(--db-text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>Day {sd.day}: {sd.title.split("—")[0]}</div>
                            <div style={{ fontSize: "9px", color: "var(--db-text-muted)" }}>
                              {isCompleted ? `${attendeeCount} attended · ${pct}%` : isNext ? "Next up" : "Scheduled"}
                            </div>
                          </div>
                          {isCompleted && (
                            <span style={{ fontSize: "10px", fontWeight: "800", color: "var(--db-accent-green)" }}>{attendeeCount}</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Workshop Journey Stepper */}
            <div style={{ marginTop: "20px", background: "#fff", borderRadius: "16px", border: "1px solid rgba(0,0,0,0.08)", padding: "24px", boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
                <h3 style={{ fontSize: "14px", fontWeight: "800", margin: 0, color: "var(--db-text-primary)" }}>Workshop Journey — Admin Control</h3>
                <span style={{ fontSize: "11px", color: "var(--db-text-muted)", fontWeight: "600" }}>Click a day to manage it</span>
              </div>
              <div style={{ display: "flex", gap: "8px", overflowX: "auto", paddingBottom: "4px" }}>
                {SCHEDULE_DAYS.map((sd) => {
                  const today = new Date();
                  const sessionDate = new Date(sd.date + "T00:00:00");
                  const isPast = today > sessionDate;
                  const isToday = today.toDateString() === sessionDate.toDateString();
                  const perDay = (stats.perDayAttendance || []).find((d: any) => d.day === sd.day);
                  const dayAttendees = perDay?.attendeeCount ?? 0;
                  const dayResources = (stats.resourcesPerDay || {})[sd.day] || 0;
                  const dayAssignments = assignments.filter((a: any) => (a.title || "").toLowerCase().includes(`day ${sd.day}`)).length;
                  return (
                    <div
                      key={sd.day}
                      onClick={() => setCurrentTab("sessions")}
                      style={{
                        flex: "0 0 auto", minWidth: "140px", padding: "14px 12px",
                        borderRadius: "12px", cursor: "pointer", transition: "all 0.2s",
                        border: isToday ? "2px solid var(--db-accent-yellow)" : "1.5px solid rgba(0,0,0,0.08)",
                        background: isToday ? "rgba(255,212,70,0.08)" : isPast ? "rgba(0,0,0,0.02)" : "#fff",
                        textAlign: "center",
                      }}
                      className="quick-action-btn"
                    >
                      <div style={{ fontSize: "11px", fontWeight: "900", color: isToday ? "#000" : "var(--db-text-muted)", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                        DAY {sd.day} {isToday ? "· TODAY" : ""}
                      </div>
                      <div style={{ fontSize: "11px", color: "var(--db-text-muted)", lineHeight: "1.3", marginBottom: "8px" }}>{sd.title.split("—")[0]}</div>
                      <div style={{ display: "flex", justifyContent: "center", gap: "6px", marginBottom: "6px" }}>
                        <span style={{ fontSize: "10px", fontWeight: "700", padding: "2px 7px", borderRadius: "10px", background: dayAttendees > 0 ? "rgba(34,197,94,0.12)" : "rgba(0,0,0,0.05)", color: dayAttendees > 0 ? "#16a34a" : "var(--db-text-muted)" }}>
                          👥 {dayAttendees}
                        </span>
                        <span style={{ fontSize: "10px", fontWeight: "700", padding: "2px 7px", borderRadius: "10px", background: "rgba(0,0,0,0.05)", color: "var(--db-text-muted)" }}>
                          📁 {dayResources}
                        </span>
                        <span style={{ fontSize: "10px", fontWeight: "700", padding: "2px 7px", borderRadius: "10px", background: "rgba(0,0,0,0.05)", color: "var(--db-text-muted)" }}>
                          📝 {dayAssignments}
                        </span>
                      </div>
                      <div style={{ fontSize: "10px", fontWeight: "700", color: "rgba(0,0,0,0.4)" }}>{sd.date}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {/* ======= TAB: SESSIONS ======= */}
        {currentTab === "sessions" && (
          <div className="db-projects-section">
            <h3 className="db-section-title">Sessions Management</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {SCHEDULE_DAYS.map((sd) => {
                const today = new Date();
                const sessionDate = new Date(sd.date + "T00:00:00");
                const isPast = today > sessionDate;
                const isToday = today.toDateString() === sessionDate.toDateString();
                const dayResources = resources.filter((r: any) => r.session_number === sd.day);
                const dayAssignments = assignments.filter((a: any) => (a.title || "").toLowerCase().includes(`day ${sd.day}`));
                return (
                  <div key={sd.day} className="db-project-row" style={{ display: "block", padding: "16px 20px" }}>
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px", flexWrap: "wrap" }}>
                      <div style={{ flex: 1, minWidth: "200px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
                          <span style={{
                            padding: "2px 10px", borderRadius: "20px", fontSize: "10px", fontWeight: "900",
                            background: isToday ? "rgba(255,212,70,0.2)" : isPast ? "rgba(34,197,94,0.1)" : "rgba(0,0,0,0.06)",
                            color: isToday ? "#000" : isPast ? "#16a34a" : "var(--db-text-muted)",
                            border: isToday ? "1px solid rgba(255,212,70,0.5)" : "1px solid transparent",
                          }}>
                            DAY {sd.day}{isToday ? " · TODAY" : isPast ? " · PAST" : " · UPCOMING"}
                          </span>
                        </div>
                        <h4 className="db-project-name" style={{ marginBottom: "4px" }}>{sd.title}</h4>
                        <div style={{ fontSize: "12px", color: "var(--db-text-muted)" }}>{sd.date} · {sd.time}</div>
                        <div style={{ display: "flex", gap: "8px", marginTop: "8px", flexWrap: "wrap" }}>
                          <span style={{ fontSize: "11px", padding: "3px 10px", borderRadius: "20px", background: "rgba(0,0,0,0.05)", color: "var(--db-text-muted)", fontWeight: "700" }}>
                            📁 {dayResources.length} resource{dayResources.length !== 1 ? "s" : ""}
                          </span>
                          <span style={{ fontSize: "11px", padding: "3px 10px", borderRadius: "20px", background: "rgba(0,0,0,0.05)", color: "var(--db-text-muted)", fontWeight: "700" }}>
                            📝 {dayAssignments.length} assignment{dayAssignments.length !== 1 ? "s" : ""}
                          </span>
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: "8px", flexShrink: 0, flexWrap: "wrap" }}>
                        <button onClick={() => { setQrDay(sd.day); setCurrentTab("attendance"); }}
                          style={{ padding: "7px 14px", borderRadius: "8px", border: "1.5px solid rgba(0,0,0,0.12)", background: "#fff", cursor: "pointer", fontSize: "12px", fontWeight: "700", color: "var(--db-text-primary)" }}>
                          ⏱️ Attendance
                        </button>
                        <button onClick={() => { setNewResDay(sd.day); setCurrentTab("resources"); }}
                          style={{ padding: "7px 14px", borderRadius: "8px", border: "1.5px solid rgba(0,0,0,0.12)", background: "#fff", cursor: "pointer", fontSize: "12px", fontWeight: "700", color: "var(--db-text-primary)" }}>
                          📁 Resources
                        </button>
                        <button onClick={() => { setNewAssTitle(`Day ${sd.day}: `); setCurrentTab("assignments"); }}
                          style={{ padding: "7px 14px", borderRadius: "8px", border: "1.5px solid rgba(255,212,70,0.6)", background: "rgba(255,212,70,0.1)", cursor: "pointer", fontSize: "12px", fontWeight: "700", color: "var(--db-text-primary)" }}>
                          📝 Assignment
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {currentTab === "attendance" && (
          <div className="db-projects-section">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
              <h3 className="db-section-title" style={{ margin: 0 }}>Attendance Control</h3>
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  onClick={() => setAttendanceSub('live')}
                  style={{
                    padding: "8px 16px",
                    borderRadius: "10px",
                    border: "none",
                    background: attendanceSub === 'live' ? "var(--db-accent-yellow)" : "#f1f5f9",
                    color: attendanceSub === 'live' ? "#000" : "#64748b",
                    fontWeight: "800",
                    fontSize: "12px",
                    cursor: "pointer",
                    boxShadow: attendanceSub === 'live' ? "0 4px 12px rgba(251, 191, 36, 0.25)" : "none",
                    transition: "all 0.2s"
                  }}
                >
                  ⏱️ Live Window
                </button>
                <button
                  onClick={() => { setAttendanceSub('analytics'); if (!selectedAnalyticsDay) setSelectedAnalyticsDay(1); }}
                  style={{
                    padding: "8px 16px",
                    borderRadius: "10px",
                    border: "none",
                    background: attendanceSub === 'analytics' ? "var(--db-accent-orange)" : "#f1f5f9",
                    color: attendanceSub === 'analytics' ? "#fff" : "#64748b",
                    fontWeight: "800",
                    fontSize: "12px",
                    cursor: "pointer",
                    boxShadow: attendanceSub === 'analytics' ? "0 4px 12px rgba(249, 115, 22, 0.25)" : "none",
                    transition: "all 0.2s"
                  }}
                >
                  📊 Roster & Analytics
                </button>
              </div>
            </div>

            {/* ======= SUBTAB: LIVE CONTROL ======= */}
            {attendanceSub === 'live' && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "24px", alignItems: "start" }}>
                <div className="modern-card" style={{ padding: "28px", display: "flex", flexDirection: "column", gap: "12px", minHeight: "auto", backgroundColor: "#fff" }}>
                  <h4 style={{ fontSize: "18px", fontWeight: "700", color: "var(--db-text-primary)", margin: 0 }}>Open Check-in Window</h4>
                  <p style={{ fontSize: "13px", fontWeight: "400", color: "var(--db-text-secondary)", lineHeight: "1.6", margin: 0 }}>
                    Pick the session day, then open a {ATTENDANCE_WINDOW_MINUTES}-minute, server-validated check-in window. Students can only check in while it&apos;s live.
                  </p>
                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", margin: "12px 0" }}>
                    {Array.from({ length: WORKSHOP_DAYS }, (_, i) => i + 1).map((d) => (
                      <button
                        key={d}
                        onClick={() => setQrDay(d)}
                        disabled={!!adminWindow}
                        style={{
                          width: "36px", height: "36px", borderRadius: "50%",
                          border: qrDay === d ? "2px solid var(--db-accent-yellow)" : "1.5px solid rgba(0,0,0,0.08)",
                          background: qrDay === d ? "var(--db-accent-yellow)" : "#fff",
                          color: qrDay === d ? "#1a1a2e" : "var(--db-text-primary)",
                          fontWeight: "700", cursor: !!adminWindow ? "not-allowed" : "pointer",
                          opacity: !!adminWindow && qrDay !== d ? 0.5 : 1,
                          transition: "all 0.2s"
                        }}
                        className="quick-action-btn"
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                  <button
                    className="explore-btn"
                    onClick={handleOpenWindow}
                    disabled={opening || !!adminWindow}
                    style={{ width: "100%", padding: "12px", borderRadius: "12px", fontWeight: "800", fontSize: "14px" }}
                  >
                    {opening ? "Opening…" : adminWindow ? `Day ${adminWindow.day} window is live` : `Open Check-in for Day ${qrDay}`}
                  </button>
                  {adminWindow && (
                    <button
                      className="profile-discard-btn"
                      onClick={handleCloseWindow}
                      disabled={closing}
                      style={{ width: "100%", padding: "12px", borderRadius: "12px", fontWeight: "800", fontSize: "14px", marginTop: "8px", border: "1px solid #ef4444", color: "#ef4444" }}
                    >
                      {closing ? "Closing…" : "Close Window Early"}
                    </button>
                  )}
                </div>

                {adminWindow ? (
                  <div className="modern-card att-status-card" style={{ minHeight: "auto", padding: "28px", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: "16px", backgroundColor: "#fff" }}>
                    <span className="att-live-tag">LIVE WINDOW · DAY {adminWindow.day}</span>
                    <CountdownRing mm={mm} ss={ss} progress={attProgress} />
                    <div className="att-qr" style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                      <div style={{ background: "#fff", padding: "12px", borderRadius: "12px", display: "inline-block", boxShadow: "0 2px 10px rgba(0,0,0,0.05)" }}>
                        <QRCodeSVG value={adminWindow.session_token} size={150} level="M" />
                      </div>
                      <span style={{ display: "block", fontSize: "11px", color: "var(--db-text-muted)", marginTop: "8px" }}>Session token · valid only while this window is live</span>
                    </div>
                    <div style={{ fontSize: "14px", fontWeight: "700", color: "var(--db-text-primary)", marginTop: "12px" }}>
                      <strong>{adminWindow.checkins.length}</strong> checked in
                    </div>
                    <div style={{ width: "100%", maxHeight: "200px", overflowY: "auto", marginTop: "8px" }}>
                      {adminWindow.checkins.length === 0 ? (
                        <div style={{ fontSize: "13px", color: "var(--db-text-muted)", padding: "20px 0" }}>No check-ins yet — waiting for students…</div>
                      ) : (
                        <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "8px" }}>
                          {adminWindow.checkins.map((c: any, i: number) => (
                            <li key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", borderRadius: "8px", background: "rgba(0,0,0,0.02)", fontSize: "12px" }}>
                              <span style={{ fontWeight: "700", color: "var(--db-text-primary)" }}>{c.name}</span>
                              <span style={{ color: "var(--db-text-secondary)" }}>{new Date(c.checked_in_at).toLocaleTimeString()}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="modern-card att-status-card" style={{ minHeight: "auto", padding: "32px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", backgroundColor: "#fff", gap: "12px" }}>
                    <div className="att-status-icon" style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: "28px", height: "28px", color: "var(--db-text-muted)" }}>
                        <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" />
                      </svg>
                    </div>
                    <h4 style={{ fontSize: "18px", fontWeight: "700", color: "var(--db-text-primary)", margin: 0 }}>No active window</h4>
                    <p style={{ fontSize: "13px", color: "var(--db-text-secondary)", margin: 0, maxWidth: "280px" }}>Open a check-in window from the left to start collecting attendance in real time.</p>
                  </div>
                )}
              </div>
            )}

            {/* ======= SUBTAB: ANALYTICS & MANUAL OVERRIDE ======= */}
            {attendanceSub === 'analytics' && (
              <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                {/* Summary Metrics Row */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
                  <div className="stat-card-modern" style={{ background: "#fff", border: "1.5px solid rgba(0,0,0,0.06)", borderRadius: "20px", padding: "20px" }}>
                    <span style={{ fontSize: "11px", fontWeight: "800", color: "var(--db-text-muted)", textTransform: "uppercase" }}>Registered Students</span>
                    <div style={{ fontSize: "28px", fontWeight: "900", color: "var(--db-text-primary)", marginTop: "4px" }}>{report?.totalRegistered || 0}</div>
                  </div>
                  <div className="stat-card-modern" style={{ background: "#fff", border: "1.5px solid rgba(0,0,0,0.06)", borderRadius: "20px", padding: "20px" }}>
                    <span style={{ fontSize: "11px", fontWeight: "800", color: "var(--db-text-muted)", textTransform: "uppercase" }}>Avg Attendance Rate</span>
                    <div style={{ fontSize: "28px", fontWeight: "900", color: "var(--db-accent-orange)", marginTop: "4px" }}>{report?.overallRate || 0}%</div>
                  </div>
                  <div className="stat-card-modern" style={{ background: "#fff", border: "1.5px solid rgba(0,0,0,0.06)", borderRadius: "20px", padding: "20px" }}>
                    <span style={{ fontSize: "11px", fontWeight: "800", color: "var(--db-text-muted)", textTransform: "uppercase" }}>Sessions Held</span>
                    <div style={{ fontSize: "28px", fontWeight: "900", color: "var(--db-accent-green)", marginTop: "4px" }}>
                      {report?.perDay?.filter((d: any) => d.checkedIn > 0).length || 0} / {WORKSHOP_DAYS}
                    </div>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: "24px", alignItems: "start", flexWrap: "wrap" }}>
                  {/* Left Column: Sessions List */}
                  <div className="modern-card" style={{ padding: "24px", backgroundColor: "#fff" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                      <h4 style={{ margin: 0, fontSize: "15px", fontWeight: "800" }}>Daily Session Summaries</h4>
                      <button
                        onClick={handleExportExcel}
                        disabled={exporting}
                        style={{ padding: "6px 12px", background: "none", border: "1.5px solid #eaeaea", borderRadius: "8px", fontSize: "11px", fontWeight: "800", cursor: "pointer", color: "var(--db-text-secondary)" }}
                      >
                        {exporting ? "Exporting..." : "📥 Export Excel"}
                      </button>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                      {(report?.perDay || []).map((dayData: any) => {
                        const isLive = adminWindow?.day === dayData.day;
                        const isSelected = selectedAnalyticsDay === dayData.day;

                        return (
                          <div
                            key={dayData.day}
                            onClick={() => setSelectedAnalyticsDay(dayData.day)}
                            style={{
                              padding: "16px",
                              borderRadius: "16px",
                              border: isSelected ? "1.5px solid var(--db-accent-orange)" : "1.5px solid rgba(0,0,0,0.06)",
                              background: isSelected ? "rgba(249, 115, 22, 0.02)" : "#fdfdfd",
                              cursor: "pointer",
                              transition: "all 0.2s"
                            }}
                          >
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <div>
                                <div style={{ fontSize: "14px", fontWeight: "800", color: "var(--db-text-primary)" }}>Day {dayData.day} Session</div>
                                <div style={{ fontSize: "11px", color: "var(--db-text-muted)", marginTop: "2px" }}>
                                  {dayData.checkedIn} Checked In ({dayData.pct}%)
                                </div>
                              </div>

                              <div>
                                {isLive ? (
                                  <span style={{ fontSize: "9px", background: "rgba(239, 68, 68, 0.1)", color: "#ef4444", padding: "4px 8px", borderRadius: "20px", fontWeight: "900" }}>LIVE</span>
                                ) : dayData.checkedIn > 0 ? (
                                  <span style={{ fontSize: "9px", background: "rgba(16, 185, 129, 0.1)", color: "#10b981", padding: "4px 8px", borderRadius: "20px", fontWeight: "900" }}>HELD</span>
                                ) : (
                                  <span style={{ fontSize: "9px", background: "#f3f4f6", color: "#64748b", padding: "4px 8px", borderRadius: "20px", fontWeight: "900" }}>UPCOMING</span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Right Column: Detailed Student Override */}
                  {selectedAnalyticsDay && (
                    <div className="modern-card" style={{ padding: "24px", backgroundColor: "#fff" }}>
                      <h4 style={{ margin: "0 0 12px 0", fontSize: "15px", fontWeight: "800" }}>
                        Attendance Roster: <span style={{ color: "var(--db-accent-orange)" }}>Day {selectedAnalyticsDay}</span>
                      </h4>

                      {/* Search student roster */}
                      <input
                        type="text"
                        placeholder="Search student by name or roll..."
                        value={analyticsSearch}
                        onChange={(e) => setAnalyticsSearch(e.target.value)}
                        style={{
                          width: "100%",
                          padding: "10px 14px",
                          borderRadius: "10px",
                          border: "1.5px solid #eaeaea",
                          fontSize: "12px",
                          outline: "none",
                          marginBottom: "16px"
                        }}
                      />

                      <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "400px", overflowY: "auto" }}>
                        {reportLoading ? (
                          <div style={{ textAlign: "center", padding: "20px", color: "var(--db-text-muted)" }}>Loading roster...</div>
                        ) : (report?.students || [])
                          .filter((s: any) =>
                            s.name.toLowerCase().includes(analyticsSearch.toLowerCase()) ||
                            s.enrollmentNumber.toLowerCase().includes(analyticsSearch.toLowerCase())
                          )
                          .map((student: any) => {
                            const isPresent = student.presentDays?.includes(selectedAnalyticsDay);
                            const isWindowOpen = adminWindow && adminWindow.day === selectedAnalyticsDay;
                            const dayReport = report?.perDay?.find((pd: any) => pd.day === selectedAnalyticsDay);
                            const isNotStarted = !isWindowOpen && (!dayReport || dayReport.checkedIn === 0);

                            let badgeBg = "#f1f5f9";
                            let badgeColor = "#64748b";
                            let badgeText = "⚪ Not Started";

                            if (isPresent) {
                              badgeBg = "rgba(16, 185, 129, 0.1)";
                              badgeColor = "#10b981";
                              badgeText = "🟢 Present";
                            } else if (isWindowOpen) {
                              badgeBg = "rgba(251, 191, 36, 0.1)";
                              badgeColor = "#d97706";
                              badgeText = "🟡 Waiting";
                            } else if (!isNotStarted) {
                              badgeBg = "rgba(239, 68, 68, 0.1)";
                              badgeColor = "#ef4444";
                              badgeText = "🔴 Absent";
                            }

                            return (
                              <div
                                key={student.enrollmentNumber}
                                style={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  alignItems: "center",
                                  padding: "12px 16px",
                                  borderRadius: "12px",
                                  background: "#f9fafb",
                                  border: "1px solid rgba(0,0,0,0.03)"
                                }}
                              >
                                <div>
                                  <div style={{ fontSize: "13px", fontWeight: "800", color: "var(--db-text-primary)" }}>{student.name}</div>
                                  <div style={{ fontSize: "10px", color: "var(--db-text-muted)", marginTop: "2px" }}>
                                    {student.enrollmentNumber} · {student.branch}
                                  </div>
                                </div>

                                <div
                                  style={{
                                    padding: "6px 12px",
                                    borderRadius: "8px",
                                    fontSize: "11px",
                                    fontWeight: "800",
                                    background: badgeBg,
                                    color: badgeColor,
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "6px",
                                    minWidth: "90px",
                                    justifyContent: "center"
                                  }}
                                >
                                  {badgeText}
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ======= TAB: RESOURCES ======= */}
        {currentTab === "resources" && (
          <div className="db-projects-section">
            <h3 className="db-section-title">Resources Manager</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: "24px", alignItems: "start" }}>
              <form onSubmit={handleCreateResource} className="modern-card" style={{ display: "block", padding: "24px", backgroundColor: "#fff" }}>
                <h4 style={{ margin: "0 0 16px 0", fontSize: "15px", fontWeight: "800" }}>Publish New Resource</h4>
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  <div>
                    <label style={{ fontSize: "12px", fontWeight: "bold", display: "block", marginBottom: "4px" }}>Session Day*</label>
                    <select value={newResDay} onChange={(e) => setNewResDay(Number(e.target.value))} className="form-input-text">
                      {SCHEDULE_DAYS.map(sd => <option key={sd.day} value={sd.day}>Day {sd.day} — {sd.title.split("—")[0]}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: "12px", fontWeight: "bold", display: "block", marginBottom: "4px" }}>Resource Title*</label>
                    <input type="text" required value={newResTitle} onChange={(e) => setNewResTitle(e.target.value)}
                      placeholder="e.g. Day 1 Slides: Git Fundamentals" className="form-input-text" />
                  </div>
                  <div>
                    <label style={{ fontSize: "12px", fontWeight: "bold", display: "block", marginBottom: "4px" }}>Resource Type*</label>
                    <select value={newResType} onChange={(e) => setNewResType(e.target.value)} className="form-input-text">
                      {["PPT", "PDF", "Recording", "Link", "ZIP"].map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: "12px", fontWeight: "bold", display: "block", marginBottom: "4px" }}>Resource URL*</label>
                    <input type="url" required value={newResUrl} onChange={(e) => setNewResUrl(e.target.value)}
                      placeholder="https://drive.google.com/..." className="form-input-text" />
                  </div>
                  <button type="submit" disabled={creatingRes} className="explore-btn" style={{ marginTop: "8px", width: "100%", padding: "12px", borderRadius: "12px" }}>
                    {creatingRes ? "Publishing…" : "Publish Resource"}
                  </button>
                </div>
              </form>
              <div className="db-project-list">
                <h4 style={{ margin: "0 0 12px 0", fontSize: "14px", fontWeight: "800" }}>Published Resources ({resources.length})</h4>
                {loadingResources ? <LoadingSpinner label="Loading resources…" /> : resources.length > 0 ? (
                  resources.map((res: any) => (
                    <div className="db-project-row" key={res.id} style={{ display: "block" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                        <h4 className="db-project-name">{res.title}</h4>
                        <span className="db-activity-badge" style={{ backgroundColor: "#f7f6f1" }}>{res.type}</span>
                      </div>
                      {res.session_number && <div style={{ fontSize: "11px", color: "var(--db-text-muted)", fontWeight: "700", marginBottom: "4px" }}>Day {res.session_number}</div>}
                      <a href={res.url || res.file_url} target="_blank" rel="noopener noreferrer"
                        style={{ fontSize: "12px", color: "var(--db-accent-orange)", textDecoration: "underline", wordBreak: "break-all" }}>
                        {res.url || res.file_url}
                      </a>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "4px" }}>
                        <div style={{ fontSize: "11px", color: "#999" }}>{new Date(res.created_at).toLocaleDateString()}</div>
                        <button
                          onClick={() => handleDeleteResource(res.id)}
                          style={{
                            background: "transparent", border: "none", color: "#ef4444",
                            fontSize: "11px", fontWeight: "750", cursor: "pointer",
                            padding: "2px 6px", borderRadius: "4px", transition: "all 0.2s"
                          }}
                          className="quick-action-btn"
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    </div>
                  ))
                ) : <div className="db-project-row">No resources published yet.</div>}
              </div>
            </div>
          </div>
        )}

        {currentTab === "assignments" && (() => {
          const totalAssignments = assignments.length;
          const totalSubmissions = submissions.length;
          const pendingCount = submissions.filter(s => s.marks_obtained === null || s.marks_obtained === undefined).length;
          const gradedCount = submissions.filter(s => s.marks_obtained !== null && s.marks_obtained !== undefined);
          const avgMarks = gradedCount.length > 0
            ? (gradedCount.reduce((sum, s) => sum + Number(s.marks_obtained || 0), 0) / gradedCount.length).toFixed(1)
            : "0.0";

          // Calculate counts per assignment
          const getAssignmentStats = (assId: string) => {
            const assSubs = submissions.filter(s => s.assignment_id === assId);
            const total = assSubs.length;
            const pending = assSubs.filter(s => s.marks_obtained === null || s.marks_obtained === undefined).length;
            const graded = total - pending;
            return { total, pending, graded };
          };

          // Export submissions for an assignment to CSV
          const handleExportCSV = (ass: any) => {
            const assSubs = submissions.filter(s => s.assignment_id === ass.id);
            const csvRows = [
              ["Student Name", "Enrollment Number", "Assignment Title", "Marks Obtained", "Max Marks", "Submission Time", "Status", "Feedback"]
            ];

            assSubs.forEach(sub => {
              const student = students.find(s => s.id === sub.student_id) || {};
              csvRows.push([
                student.name || "N/A",
                student.enrollment_number || student.enrollmentNumber || "N/A",
                ass.title,
                sub.marks_obtained !== null ? sub.marks_obtained : "Pending Review",
                ass.max_marks || 10,
                new Date(sub.submitted_at).toLocaleString(),
                sub.marks_obtained !== null ? "Reviewed" : "Pending",
                sub.mentor_feedback || ""
              ]);
            });

            const csvContent = "data:text/csv;charset=utf-8," 
              + csvRows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(",")).join("\n");
            
            const encodedUri = encodeURI(csvContent);
            const link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", `${ass.title.replace(/\s+/g, "_")}_results.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          };

          const selectedAss = assignments.find(a => String(a.id) === String(selectedAssignmentId));
          const selectedAssSubs = selectedAssignmentId 
            ? submissions.filter(s => String(s.assignment_id) === String(selectedAssignmentId))
            : [];

          return (
            <div className="db-projects-section animate-in fade-in duration-300">
              {/* Summary Stats Cards */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "24px" }}>
                <div className="stat-card-modern" style={{ background: "#fff", border: "1.5px solid rgba(0,0,0,0.06)", borderRadius: "20px", padding: "20px", boxShadow: "0 4px 20px rgba(0,0,0,0.02)" }}>
                  <span style={{ fontSize: "11px", fontWeight: "800", color: "var(--db-text-muted)", textTransform: "uppercase" }}>Total Assignments</span>
                  <div style={{ fontSize: "28px", fontWeight: "900", color: "var(--db-text-primary)", marginTop: "4px" }}>{totalAssignments}</div>
                </div>
                <div className="stat-card-modern" style={{ background: "#fff", border: "1.5px solid rgba(0,0,0,0.06)", borderRadius: "20px", padding: "20px", boxShadow: "0 4px 20px rgba(0,0,0,0.02)" }}>
                  <span style={{ fontSize: "11px", fontWeight: "800", color: "var(--db-text-muted)", textTransform: "uppercase" }}>Total Submissions</span>
                  <div style={{ fontSize: "28px", fontWeight: "900", color: "var(--db-text-primary)", marginTop: "4px" }}>{totalSubmissions}</div>
                </div>
                <div className="stat-card-modern" style={{ background: "#fff", border: "1.5px solid rgba(0,0,0,0.06)", borderRadius: "20px", padding: "20px", boxShadow: "0 4px 20px rgba(0,0,0,0.02)" }}>
                  <span style={{ fontSize: "11px", fontWeight: "800", color: "var(--db-text-muted)", textTransform: "uppercase" }}>Pending Reviews</span>
                  <div style={{ fontSize: "28px", fontWeight: "900", color: "var(--db-accent-orange)", marginTop: "4px" }}>{pendingCount}</div>
                </div>
                <div className="stat-card-modern" style={{ background: "#fff", border: "1.5px solid rgba(0,0,0,0.06)", borderRadius: "20px", padding: "20px", boxShadow: "0 4px 20px rgba(0,0,0,0.02)" }}>
                  <span style={{ fontSize: "11px", fontWeight: "800", color: "var(--db-text-muted)", textTransform: "uppercase" }}>Average Marks</span>
                  <div style={{ fontSize: "28px", fontWeight: "900", color: "var(--db-accent-green)", marginTop: "4px" }}>{avgMarks} <span style={{ fontSize: "12px", color: "var(--db-text-muted)" }}>/ 10</span></div>
                </div>
              </div>

              <h3 className="db-section-title">Assignments &amp; Grading</h3>
              
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: "24px", alignItems: "start" }} className="form-row-responsive">
                {/* Create Assignment Form */}
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  <h4 style={{ margin: 0, fontSize: "13px", fontWeight: "900", color: "var(--db-text-primary)", textTransform: "uppercase", letterSpacing: "0.5px" }}>Create Assignment</h4>
                  <form onSubmit={handleCreateAssignment} className="modern-card" style={{ display: "block", padding: "24px", backgroundColor: "#fff", border: "1.5px solid rgba(0,0,0,0.06)", borderRadius: "20px", boxShadow: "0 8px 32px rgba(0,0,0,0.02)" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                      <div>
                        <label style={{ fontSize: "11px", fontWeight: "800", display: "block", marginBottom: "6px", color: "var(--db-text-muted)", textTransform: "uppercase" }}>Title*</label>
                        <input type="text" required value={newAssTitle} onChange={(e) => setNewAssTitle(e.target.value)}
                          placeholder="e.g. Day 3: Branching & Merging" className="form-input-text" style={{ background: "#fff", border: "1px solid #d1d5db", color: "#000", outline: "none", borderRadius: "10px", padding: "10px 12px", width: "100%" }} />
                      </div>
                      
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                        <div>
                          <label style={{ fontSize: "11px", fontWeight: "800", display: "block", marginBottom: "6px", color: "var(--db-text-muted)", textTransform: "uppercase" }}>Due Date*</label>
                          <input type="datetime-local" required value={newAssDueDate} onChange={(e) => setNewAssDueDate(e.target.value)} className="form-input-text" style={{ background: "#fff", border: "1px solid #d1d5db", color: "#000", outline: "none", borderRadius: "10px", padding: "10px 12px", width: "100%" }} />
                        </div>
                        <div>
                          <label style={{ fontSize: "11px", fontWeight: "800", display: "block", marginBottom: "6px", color: "var(--db-text-muted)", textTransform: "uppercase" }}>Max Marks*</label>
                          <input type="number" required value={newAssMaxMarks} onChange={(e) => setNewAssMaxMarks(e.target.value)} className="form-input-text" style={{ background: "#fff", border: "1px solid #d1d5db", color: "#000", outline: "none", borderRadius: "10px", padding: "10px 12px", width: "100%" }} />
                        </div>
                      </div>

                      <div>
                        <label style={{ fontSize: "11px", fontWeight: "800", display: "block", marginBottom: "6px", color: "var(--db-text-muted)", textTransform: "uppercase" }}>Required Fields</label>
                        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "2px" }}>
                          <label style={{ display: "flex", alignItems: "center", gap: "6px", background: reqLiveUrl ? "rgba(255,212,70,0.12)" : "rgba(0,0,0,0.03)", border: reqLiveUrl ? "1px solid rgba(255,212,70,0.4)" : "1px solid rgba(0,0,0,0.08)", borderRadius: "8px", padding: "6px 10px", cursor: "pointer", fontSize: "11px", color: reqLiveUrl ? "#b45309" : "#666", transition: "all 0.2s" }}>
                            <input type="checkbox" checked={reqLiveUrl} onChange={(e) => setReqLiveUrl(e.target.checked)} style={{ accentColor: "var(--db-accent-orange)" }} />
                            <span>🔗 Live URL</span>
                          </label>
                          <label style={{ display: "flex", alignItems: "center", gap: "6px", background: reqGithubLink ? "rgba(255,212,70,0.12)" : "rgba(0,0,0,0.03)", border: reqGithubLink ? "1px solid rgba(255,212,70,0.4)" : "1px solid rgba(0,0,0,0.08)", borderRadius: "8px", padding: "6px 10px", cursor: "pointer", fontSize: "11px", color: reqGithubLink ? "#b45309" : "#666", transition: "all 0.2s" }}>
                            <input type="checkbox" checked={reqGithubLink} onChange={(e) => setReqGithubLink(e.target.checked)} style={{ accentColor: "var(--db-accent-orange)" }} />
                            <span>💻 GitHub Repo</span>
                          </label>
                          <label style={{ display: "flex", alignItems: "center", gap: "6px", background: reqAttachment ? "rgba(255,212,70,0.12)" : "rgba(0,0,0,0.03)", border: reqAttachment ? "1px solid rgba(255,212,70,0.4)" : "1px solid rgba(0,0,0,0.08)", borderRadius: "8px", padding: "6px 10px", cursor: "pointer", fontSize: "11px", color: reqAttachment ? "#b45309" : "#666", transition: "all 0.2s" }}>
                            <input type="checkbox" checked={reqAttachment} onChange={(e) => setReqAttachment(e.target.checked)} style={{ accentColor: "var(--db-accent-orange)" }} />
                            <span>📎 Attachment</span>
                          </label>
                        </div>
                      </div>

                      <div>
                        <label style={{ fontSize: "11px", fontWeight: "800", display: "block", marginBottom: "6px", color: "var(--db-text-muted)", textTransform: "uppercase" }}>Description*</label>
                        <textarea required value={newAssDesc} onChange={(e) => setNewAssDesc(e.target.value)}
                          placeholder="Add instructions, problem details..." className="form-input-text" style={{ background: "#fff", border: "1px solid #d1d5db", color: "#000", outline: "none", borderRadius: "10px", padding: "10px 12px", minHeight: "70px", width: "100%", fontFamily: "inherit" }} />
                      </div>

                      <button type="submit" disabled={creatingAss} className="explore-btn" style={{ width: "100%", padding: "12px", borderRadius: "12px", fontWeight: "800" }}>
                        {creatingAss ? "Publishing…" : "Publish Assignment"}
                      </button>
                    </div>
                  </form>
                </div>

                {/* Published Assignments Cards */}
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  <h4 style={{ margin: 0, fontSize: "13px", fontWeight: "900", color: "var(--db-text-primary)", textTransform: "uppercase", letterSpacing: "0.5px" }}>Published Assignments</h4>
                  <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                    {loadingAssignments ? <LoadingSpinner label="Loading assignments…" /> : assignments.length > 0 ? (
                      assignments.map((ass: any, idx) => {
                        const { total, pending, graded } = getAssignmentStats(ass.id);
                        return (
                          <div className="modern-card animate-in fade-in duration-300" key={ass.id} style={{ display: "block", padding: "20px", backgroundColor: "#fff", border: "1.5px solid rgba(0,0,0,0.06)", borderRadius: "20px", boxShadow: "0 4px 24px rgba(0,0,0,0.02)" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "10px" }}>
                              <div>
                                <h4 style={{ margin: "0 0 2px 0", fontSize: "15px", fontWeight: "850", color: "var(--db-text-primary)" }}>{ass.title}</h4>
                                <span style={{ fontSize: "11px", fontWeight: "700", color: "var(--db-text-muted)" }}>🗓️ Day {idx + 1} · Due {new Date(ass.due_date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}</span>
                              </div>
                              <span style={{ fontSize: "10px", fontWeight: "800", padding: "4px 10px", borderRadius: "12px", backgroundColor: "rgba(16,185,129,0.1)", color: "#10b981", border: "1.5px solid rgba(16,185,129,0.2)" }}>
                                MAX {ass.max_marks || 10} MARKS
                              </span>
                            </div>
                            
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px", background: "rgba(0,0,0,0.02)", borderRadius: "12px", padding: "10px 14px", margin: "14px 0" }}>
                              <div style={{ textAlign: "center" }}>
                                <div style={{ fontSize: "15px", fontWeight: "900", color: "var(--db-text-primary)" }}>{total}</div>
                                <div style={{ fontSize: "9px", color: "var(--db-text-muted)", fontWeight: "700" }}>SUBMITTED</div>
                              </div>
                              <div style={{ textAlign: "center" }}>
                                <div style={{ fontSize: "15px", fontWeight: "900", color: "var(--db-accent-orange)" }}>{pending}</div>
                                <div style={{ fontSize: "9px", color: "var(--db-accent-orange)", fontWeight: "700" }}>PENDING</div>
                              </div>
                              <div style={{ textAlign: "center" }}>
                                <div style={{ fontSize: "15px", fontWeight: "900", color: "var(--db-accent-green)" }}>{graded}</div>
                                <div style={{ fontSize: "9px", color: "var(--db-accent-green)", fontWeight: "700" }}>REVIEWED</div>
                              </div>
                            </div>

                            <div style={{ display: "flex", gap: "10px" }}>
                              <button
                                onClick={() => setSelectedAssignmentId(String(ass.id))}
                                className={`explore-btn ${String(selectedAssignmentId) === String(ass.id) ? "active" : ""}`}
                                style={{ flex: 1, height: "36px", fontSize: "11px", fontWeight: "800", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "10px" }}
                              >
                                📋 View Submissions
                              </button>
                              <button
                                onClick={() => handleExportCSV(ass)}
                                style={{ height: "36px", padding: "0 14px", background: "#f8fafc", border: "1.5px solid #cbd5e1", borderRadius: "10px", cursor: "pointer", fontSize: "11px", fontWeight: "850", color: "#64748b" }}
                              >
                                📤 Export CSV
                              </button>
                            </div>
                          </div>
                        );
                      })
                    ) : <div className="modern-card" style={{ padding: "20px" }}>No assignments created yet.</div>}
                  </div>
                </div>
              </div>

              {/* Submissions Section Table */}
              {selectedAssignmentId && selectedAss && (
                <div className="modern-card animate-in slide-in-from-bottom duration-300" style={{ marginTop: "24px", padding: "24px", backgroundColor: "#fff", border: "1.5px solid rgba(0,0,0,0.06)", borderRadius: "24px", display: "block" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "12px" }}>
                    <div>
                      <h4 style={{ margin: 0, fontSize: "15px", fontWeight: "900", color: "var(--db-text-primary)", textTransform: "uppercase" }}>
                        Submissions for: <span style={{ color: "var(--db-accent-orange)" }}>{selectedAss.title}</span>
                      </h4>
                      <span style={{ fontSize: "11px", color: "var(--db-text-muted)", fontWeight: "600" }}>
                        Showing {selectedAssSubs.length} submissions
                      </span>
                    </div>
                    <button
                      onClick={() => setSelectedAssignmentId("")}
                      style={{ padding: "6px 12px", background: "#f1f5f9", border: "none", borderRadius: "8px", fontSize: "11px", fontWeight: "800", cursor: "pointer", color: "#64748b" }}
                    >
                      ✕ Close Panel
                    </button>
                  </div>

                  <div className="table-responsive" style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "12px" }}>
                      <thead>
                        <tr style={{ borderBottom: "2px solid #f1f5f9", color: "var(--db-text-muted)" }}>
                          <th style={{ padding: "12px 8px", fontWeight: "800" }}>Student Details</th>
                          <th style={{ padding: "12px 8px", fontWeight: "800" }}>Artifact Links</th>
                          <th style={{ padding: "12px 8px", fontWeight: "800" }}>Submitted At</th>
                          <th style={{ padding: "12px 8px", fontWeight: "800" }}>Status</th>
                          <th style={{ padding: "12px 8px", fontWeight: "800" }}>Feedback</th>
                          <th style={{ padding: "12px 8px", fontWeight: "800", textAlign: "right" }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedAssSubs.length > 0 ? (
                          selectedAssSubs.map((sub: any) => {
                            const student = students.find(s => s.id === sub.student_id) || {};
                            const isGraded = sub.marks_obtained !== null && sub.marks_obtained !== undefined;

                            return (
                              <tr key={sub.id} style={{ borderBottom: "1.5px solid #f8fafc" }}>
                                <td style={{ padding: "12px 8px" }}>
                                  <div style={{ fontWeight: "750", color: "var(--db-text-primary)" }}>{student.name || "Unknown student"}</div>
                                  <div style={{ fontSize: "10px", color: "var(--db-text-muted)" }}>#{student.enrollment_number || student.enrollmentNumber}</div>
                                </td>
                                <td style={{ padding: "12px 8px" }}>
                                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                                    {sub.repo_url && (
                                      <a href={sub.repo_url} target="_blank" rel="noopener noreferrer" style={{ padding: "4px 8px", background: "rgba(0,0,0,0.05)", border: "1px solid rgba(0,0,0,0.08)", borderRadius: "6px", display: "flex", alignItems: "center", gap: "4px", textDecoration: "none", color: "#000", fontWeight: "700", fontSize: "10px" }}>
                                        📁 Repo
                                      </a>
                                    )}
                                    {sub.live_url && (
                                      <a href={sub.live_url} target="_blank" rel="noopener noreferrer" style={{ padding: "4px 8px", background: "rgba(0,0,0,0.05)", border: "1px solid rgba(0,0,0,0.08)", borderRadius: "6px", display: "flex", alignItems: "center", gap: "4px", textDecoration: "none", color: "#000", fontWeight: "700", fontSize: "10px" }}>
                                        🔗 Live
                                      </a>
                                    )}
                                  </div>
                                </td>
                                <td style={{ padding: "12px 8px", color: "var(--db-text-muted)" }}>
                                  {new Date(sub.submitted_at).toLocaleString()}
                                </td>
                                <td style={{ padding: "12px 8px" }}>
                                  {isGraded ? (
                                    <span style={{ fontSize: "10px", fontWeight: "800", color: "var(--db-accent-green)", backgroundColor: "rgba(16,185,129,0.1)", padding: "2px 8px", borderRadius: "12px" }}>
                                      Reviewed ({sub.marks_obtained}/{selectedAss.max_marks || 10})
                                    </span>
                                  ) : (
                                    <span style={{ fontSize: "10px", fontWeight: "800", color: "var(--db-accent-orange)", backgroundColor: "rgba(249,115,22,0.1)", padding: "2px 8px", borderRadius: "12px" }}>
                                      Pending Review
                                    </span>
                                  )}
                                </td>
                                <td style={{ padding: "12px 8px", maxWidth: "160px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "var(--db-text-secondary)" }}>
                                  {sub.mentor_feedback ? (
                                    <span title={sub.mentor_feedback}>{sub.mentor_feedback}</span>
                                  ) : (
                                    <span style={{ fontStyle: "italic", color: "var(--db-text-muted)" }}>No feedback yet</span>
                                  )}
                                </td>
                                <td style={{ padding: "12px 8px", textAlign: "right" }}>
                                  <button
                                    onClick={() => {
                                      setSelectedSubId(sub.id);
                                      setGradingSubmission({ ...sub, studentName: student.name, studentEnroll: student.enrollment_number || student.enrollmentNumber, studentEmail: student.email });
                                      setGradeMarks(sub.marks_obtained !== null && sub.marks_obtained !== undefined ? String(sub.marks_obtained) : "");
                                      setGradeFeedback(sub.mentor_feedback || "");
                                      setManualBonusXp("0");
                                    }}
                                    className="explore-btn"
                                    style={{ padding: "6px 12px", height: "30px", fontSize: "10px", fontWeight: "800", borderRadius: "8px" }}
                                  >
                                    ✏️ {isGraded ? "Edit Grade" : "Grade"}
                                  </button>
                                </td>
                              </tr>
                            );
                          })
                        ) : (
                          <tr>
                            <td colSpan={6} style={{ padding: "24px", textAlign: "center", color: "var(--db-text-muted)" }}>
                              No submissions received for this assignment yet.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Grading Modal Overlay */}
              {selectedSubId && gradingSubmission && (
                <div style={{
                  position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
                  backgroundColor: "rgba(15,23,42,0.6)", backdropFilter: "blur(4px)",
                  display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000
                }}>
                  <form onSubmit={handleEvaluate} className="modern-card animate-in scale-in duration-200" style={{
                    backgroundColor: "#fff", border: "none", borderRadius: "28px",
                    width: "100%", maxWidth: "500px", padding: "32px", boxShadow: "0 24px 64px rgba(15,23,42,0.15)",
                    display: "flex", flexDirection: "column", gap: "20px", color: "var(--db-text-primary)"
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "900", textTransform: "uppercase", letterSpacing: "0.5px", color: "#1e293b", display: "flex", alignItems: "center", gap: "8px" }}>
                        <span>📝</span> Grade Submission
                      </h3>
                      <button
                        type="button"
                        onClick={() => { setSelectedSubId(""); setGradingSubmission(null); }}
                        style={{ background: "#f1f5f9", border: "none", width: "28px", height: "28px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", cursor: "pointer", color: "#64748b", fontWeight: "bold" }}
                      >
                        ✕
                      </button>
                    </div>

                    {/* Student details */}
                    <div style={{ background: "linear-gradient(135deg, #f8fafc, #f1f5f9)", borderRadius: "16px", padding: "16px", display: "flex", alignItems: "center", gap: "12px", border: "1px solid rgba(0,0,0,0.03)" }}>
                      <div style={{ width: "40px", height: "40px", borderRadius: "50%", backgroundColor: "#e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px" }}>
                        👤
                      </div>
                      <div>
                        <div style={{ fontWeight: "800", fontSize: "15px", color: "#0f172a" }}>{gradingSubmission.studentName}</div>
                        <div style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>
                          <span style={{ background: "#eaeaea", padding: "2px 6px", borderRadius: "6px", fontWeight: "800", marginRight: "4px" }}>{gradingSubmission.studentEnroll}</span>
                          {gradingSubmission.studentEmail}
                        </div>
                      </div>
                    </div>

                    {/* Submitted details */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px", background: "#f8fafc", border: "1.5px solid #f1f5f9", borderRadius: "16px", padding: "16px" }}>
                      <span style={{ fontSize: "10px", fontWeight: "800", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px" }}>Submitted Artifacts</span>
                      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "2px" }}>
                        {gradingSubmission.repo_url && (
                          <a href={gradingSubmission.repo_url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none", padding: "8px 16px", background: "#f1f5f9", border: "1.5px solid #e2e8f0", color: "#1e293b", borderRadius: "10px", fontSize: "11px", fontWeight: "800", display: "flex", alignItems: "center", gap: "6px", transition: "transform 0.15s" }}>
                            💻 GitHub Repo
                          </a>
                        )}
                        {gradingSubmission.live_url && (
                          <a href={gradingSubmission.live_url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none", padding: "8px 16px", background: "var(--db-accent-orange)", color: "#fff", borderRadius: "10px", fontSize: "11px", fontWeight: "800", display: "flex", alignItems: "center", gap: "6px", transition: "transform 0.15s" }}>
                            🔗 Live Preview
                          </a>
                        )}
                      </div>
                      <div style={{ fontSize: "10px", color: "#94a3b8", marginTop: "4px", display: "flex", alignItems: "center", gap: "4px" }}>
                        <span>📅</span> Submitted: {new Date(gradingSubmission.submitted_at).toLocaleString()}
                      </div>
                    </div>

                    {/* Marks & Bonus XP */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                      <div>
                        <label style={{ fontSize: "10px", fontWeight: "800", color: "#64748b", display: "block", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Marks (out of {selectedAss?.max_marks || 10})*</label>
                        <input
                          type="number"
                          required
                          min="0"
                          max={selectedAss?.max_marks || 10}
                          value={gradeMarks}
                          onChange={(e) => setGradeMarks(e.target.value)}
                          className="form-input-text"
                          style={{ background: "#f8fafc", border: "1.5px solid #cbd5e1", borderRadius: "12px", padding: "10px 14px", width: "100%", outline: "none", fontSize: "13px", fontWeight: "700" }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: "10px", fontWeight: "800", color: "#64748b", display: "block", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Additional Bonus XP</label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={manualBonusXp}
                          onChange={(e) => setManualBonusXp(e.target.value)}
                          className="form-input-text"
                          style={{ background: "#f8fafc", border: "1.5px solid #cbd5e1", borderRadius: "12px", padding: "10px 14px", width: "100%", outline: "none", fontSize: "13px", fontWeight: "700" }}
                        />
                      </div>
                    </div>

                    {/* Feedback with quick chips */}
                    <div>
                      <label style={{ fontSize: "10px", fontWeight: "800", color: "#64748b", display: "block", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Mentor Feedback</label>
                      <textarea
                        value={gradeFeedback}
                        onChange={(e) => setGradeFeedback(e.target.value)}
                        placeholder="Provide constructive feedback here..."
                        className="form-input-text"
                        style={{ background: "#f8fafc", border: "1.5px solid #cbd5e1", borderRadius: "12px", padding: "10px 14px", minHeight: "80px", width: "100%", fontFamily: "inherit", outline: "none", fontSize: "13px", resize: "vertical" }}
                      />
                      
                      {/* Quick feedback chips */}
                      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginTop: "10px" }}>
                        {[
                          "Excellent Work", "Good Repository", "Clean Code",
                          "Improve README", "Add Comments", "Complete Submission"
                        ].map(chip => (
                          <button
                            key={chip}
                            type="button"
                            onClick={() => setGradeFeedback(prev => prev ? `${prev}. ${chip}.` : `${chip}.`)}
                            style={{
                              background: "#f1f5f9", border: "none",
                              borderRadius: "20px", padding: "6px 12px", fontSize: "10px",
                              fontWeight: "750", cursor: "pointer", color: "#475569",
                              transition: "all 0.15s"
                            }}
                            className="quick-action-btn"
                          >
                            ➕ {chip}
                          </button>
                        ))}
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={grading}
                      className="explore-btn"
                      style={{ width: "100%", padding: "12px", borderRadius: "14px", fontWeight: "800", height: "48px", background: "var(--db-accent-yellow)", color: "#000", border: "none", fontSize: "13px", boxShadow: "0 4px 12px rgba(251, 191, 36, 0.25)", cursor: "pointer", transition: "transform 0.15s" }}
                    >
                      {grading ? "Saving evaluation…" : "Publish Grade & Award XP"}
                    </button>
                  </form>
                </div>
              )}
            </div>
          );
        })()}
        {currentTab === "leaderboard" && (() => {
          const getStudentAttendance = (student: any) => {
            if (!student) return { presentDaysCount: 0, percentage: 0 };
            const enroll = (student?.enrollment_number || student?.enrollmentNumber || "").trim().toUpperCase();
            const sReport = report?.students?.find((rs: any) => (rs.enrollmentNumber || "").trim().toUpperCase() === enroll);
            const presentDaysCount = sReport?.presentDays?.length || 0;
            const percentage = WORKSHOP_DAYS > 0 ? Math.round((presentDaysCount / WORKSHOP_DAYS) * 100) : 0;
            return { presentDaysCount, percentage };
          };

          // Pre-sorting leaderboard students (breaking ties with attendance)
          const sortedLeaderboard = students
            .slice()
            .sort((a: any, b: any) => {
              const xpDiff = (b.total_xp || 0) - (a.total_xp || 0);
              if (xpDiff !== 0) return xpDiff;
              const attA = getStudentAttendance(a).presentDaysCount;
              const attB = getStudentAttendance(b).presentDaysCount;
              return attB - attA;
            });

          const filteredLeaderboard = sortedLeaderboard.filter((s: any) => {
            const query = leaderboardSearch.toLowerCase().trim();
            if (!query) return true;
            const name = (s.name || "").toLowerCase();
            const enroll = (s.enrollmentNumber || s.enrollment_number || "").toLowerCase();
            return name.includes(query) || enroll.includes(query);
          });

          // Pagination
          const totalItems = filteredLeaderboard.length;
          const totalPages = Math.ceil(totalItems / leaderboardItemsPerPage) || 1;
          const startIndex = (leaderboardPage - 1) * leaderboardItemsPerPage;
          const paginatedLeaderboard = filteredLeaderboard.slice(startIndex, startIndex + leaderboardItemsPerPage);

          // Get top 3 of the entire filtered cohort (only show podium on page 1 of search-free state)
          const isSearchActive = leaderboardSearch.trim() !== "";
          const showPodium = leaderboardPage === 1 && !isSearchActive && sortedLeaderboard.length >= 1;
          
          const top1 = showPodium ? sortedLeaderboard[0] : null;
          const top2 = showPodium && sortedLeaderboard.length >= 2 ? sortedLeaderboard[1] : null;
          const top3 = showPodium && sortedLeaderboard.length >= 3 ? sortedLeaderboard[2] : null;

          return (
            <div className="db-projects-section animate-in fade-in duration-300">
              <style dangerouslySetInnerHTML={{ __html: `
                .leaderboard-podium {
                  display: flex;
                  justify-content: center;
                  align-items: flex-end;
                  gap: 16px;
                  margin-bottom: 36px;
                  padding-top: 10px;
                }
                .podium-card {
                  background: #ffffff;
                  border-radius: 24px;
                  padding: 24px 16px;
                  flex: 1;
                  min-width: 200px;
                  max-width: 260px;
                  display: flex;
                  flex-direction: column;
                  align-items: center;
                  text-align: center;
                  position: relative;
                  border: 1.5px solid rgba(0, 0, 0, 0.06);
                  box-shadow: 0 8px 32px rgba(0,0,0,0.05);
                  transition: transform 0.2s, box-shadow 0.2s;
                }
                .podium-card:hover {
                  transform: translateY(-4px);
                  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.08);
                }
                .podium-card.rank-1 {
                  border: 2px solid #FFD446;
                  box-shadow: 0 10px 30px rgba(255, 212, 70, 0.15);
                  background: linear-gradient(180deg, #fffdf2 0%, #ffffff 100%);
                  z-index: 2;
                  transform: scale(1.05) translateY(-8px);
                }
                .podium-card.rank-1:hover {
                  transform: scale(1.05) translateY(-12px);
                }
                .podium-card.rank-2 {
                  border: 2px solid #C0C0C0;
                  background: linear-gradient(180deg, #fafafa 0%, #ffffff 100%);
                  z-index: 1;
                }
                .podium-card.rank-3 {
                  border: 2px solid #CD7F32;
                  background: linear-gradient(180deg, #fffcf9 0%, #ffffff 100%);
                  z-index: 1;
                }
                .podium-badge {
                  width: 44px;
                  height: 44px;
                  border-radius: 50%;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  font-size: 18px;
                  font-weight: 900;
                  color: #fff;
                  margin-bottom: 12px;
                  box-shadow: 0 4px 10px rgba(0,0,0,0.15);
                }
                .podium-card.rank-1 .podium-badge {
                  background: linear-gradient(135deg, #FFD446, #FFA800);
                  color: #000;
                }
                .podium-card.rank-2 .podium-badge {
                  background: linear-gradient(135deg, #E0E0E0, #9E9E9E);
                  color: #000;
                }
                .podium-card.rank-3 .podium-badge {
                  background: linear-gradient(135deg, #D7A15C, #965A38);
                }
                .podium-name {
                  font-size: 15px;
                  font-weight: 750;
                  color: var(--db-text-primary);
                  margin-bottom: 4px;
                  text-overflow: ellipsis;
                  overflow: hidden;
                  white-space: nowrap;
                  max-width: 100%;
                }
                .podium-meta {
                  font-size: 11px;
                  color: var(--db-text-muted);
                  margin-bottom: 10px;
                }
                .podium-xp {
                  font-size: 22px;
                  font-weight: 800;
                  color: #FFD446;
                  margin-bottom: 16px;
                  text-shadow: 0 0 10px rgba(255,212,70,0.15);
                }
                .podium-actions {
                  display: flex;
                  gap: 8px;
                  margin-top: auto;
                  width: 100%;
                }
                .podium-btn {
                  flex: 1;
                  padding: 6px 4px;
                  font-size: 10px;
                  height: auto;
                  min-width: auto;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  gap: 4px;
                }
                
                .dark-leaderboard-list {
                  display: flex;
                  flex-direction: column;
                  gap: 10px;
                }
                .dark-leaderboard-row {
                  background: #ffffff;
                  border: 1.5px solid rgba(0, 0, 0, 0.06);
                  border-radius: 24px;
                  padding: 14px 20px;
                  display: flex;
                  align-items: center;
                  gap: 14px;
                  transition: all 0.2s;
                }
                .dark-leaderboard-row:hover {
                  border-color: rgba(255, 212, 70, 0.25);
                  background: #fbfbfd;
                }
                .dark-leaderboard-row.rank-1 {
                  border-color: rgba(255, 212, 70, 0.35);
                  background: linear-gradient(90deg, #fffdf2 0%, #ffffff 100%);
                }
                .dark-leaderboard-row.rank-2 {
                  border-color: rgba(192, 192, 192, 0.25);
                  background: linear-gradient(90deg, #fafafa 0%, #ffffff 100%);
                }
                .dark-leaderboard-row.rank-3 {
                  border-color: rgba(205, 127, 50, 0.25);
                  background: linear-gradient(90deg, #fffbf9 0%, #ffffff 100%);
                }
                .row-rank-badge {
                  width: 32px;
                  height: 32px;
                  border-radius: 50%;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  font-weight: 900;
                  font-size: 12px;
                  flex-shrink: 0;
                }
                .row-rank-1 .row-rank-badge {
                  background: linear-gradient(135deg, #FFD446, #FFA800);
                  color: #000;
                }
                .row-rank-2 .row-rank-badge {
                  background: linear-gradient(135deg, #E0E0E0, #9E9E9E);
                  color: #000;
                }
                .row-rank-3 .row-rank-badge {
                  background: linear-gradient(135deg, #D7A15C, #965A38);
                  color: #fff;
                }
                .row-rank-other .row-rank-badge {
                  background: rgba(0, 0, 0, 0.04);
                  color: var(--db-text-muted);
                  border: 1.5px solid rgba(0,0,0,0.06);
                }
                .row-name {
                  font-size: 14px;
                  font-weight: 700;
                  color: var(--db-text-primary);
                }
                .row-meta {
                  font-size: 11px;
                  color: var(--db-text-muted);
                }
                .row-xp {
                  font-size: 16px;
                  font-weight: 800;
                  color: #FFD446;
                  flex-shrink: 0;
                }
                .action-btn-circle {
                  width: 32px;
                  height: 32px;
                  border-radius: 50%;
                  border: 1px solid rgba(0, 0, 0, 0.08);
                  background: rgba(0, 0, 0, 0.02);
                  color: var(--db-text-primary);
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  cursor: pointer;
                  transition: all 0.2s;
                  font-size: 13px;
                }
                .action-btn-circle:hover {
                  background: #FFD446;
                  color: #000;
                  border-color: #FFD446;
                }
                @media (max-width: 600px) {
                  .leaderboard-podium {
                    flex-direction: column;
                    align-items: center;
                    gap: 16px;
                  }
                  .podium-card {
                    width: 100%;
                    max-width: 100%;
                    transform: none !important;
                  }
                  .dark-leaderboard-row {
                    flex-wrap: wrap;
                  }
                }
              `}} />
              
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
                <h3 className="db-section-title" style={{ margin: 0 }}>Student Leaderboard</h3>
                <input
                  type="text"
                  placeholder="Search student by name or enrollment…"
                  value={leaderboardSearch}
                  onChange={(e) => {
                    setLeaderboardSearch(e.target.value);
                    setLeaderboardPage(1);
                  }}
                  className="form-input-text"
                  style={{ maxWidth: "280px", margin: 0, backgroundColor: "#fff", color: "#000" }}
                />
              </div>

              {/* PODIUM CARDS (Top 3 Ranks, visible on page 1 of search-free state) */}
              {showPodium && (
                <div className="leaderboard-podium">
                  {top2 && (() => {
                    const att = getStudentAttendance(top2);
                    return (
                      <div className="podium-card rank-2 animate-in slide-in-from-bottom duration-300">
                        <div style={{ position: "absolute", top: "-12px", fontSize: "20px" }}>🥈</div>
                        <div className="podium-badge">#2</div>
                        <div className="podium-name" title={top2.name}>{top2.name}</div>
                        <div className="podium-meta">
                          {top2.enrollmentNumber || top2.enrollment_number || ""} · {top2.branch || UNKNOWN_BRANCH_LABEL}
                          <br />
                          📅 {att.presentDaysCount}/{WORKSHOP_DAYS} Days ({att.percentage}%)
                        </div>
                        <div className="podium-xp">{top2.total_xp || 0} XP</div>
                        <div className="podium-actions">
                          <button onClick={() => setAwardingStudent(top2)} className="explore-btn podium-btn" style={{ backgroundColor: "#FFD446", color: "#000" }}>
                            🏆 Award
                          </button>
                          <button onClick={() => loadXpHistory(top2)} className="explore-btn podium-btn" style={{ backgroundColor: "rgba(255,255,255,0.06)", color: "#fff", border: "1px solid rgba(255,255,255,0.1)" }}>
                            📜 Trail
                          </button>
                        </div>
                      </div>
                    );
                  })()}

                  {top1 && (() => {
                    const att = getStudentAttendance(top1);
                    return (
                      <div className="podium-card rank-1 animate-in slide-in-from-bottom duration-500">
                        <div style={{ position: "absolute", top: "-16px", fontSize: "26px" }}>👑</div>
                        <div className="podium-badge">#1</div>
                        <div className="podium-name" style={{ fontSize: "17px" }} title={top1.name}>{top1.name}</div>
                        <div className="podium-meta">
                          {top1.enrollmentNumber || top1.enrollment_number || ""} · {top1.branch || UNKNOWN_BRANCH_LABEL}
                          <br />
                          📅 {att.presentDaysCount}/{WORKSHOP_DAYS} Days ({att.percentage}%)
                        </div>
                        <div className="podium-xp" style={{ fontSize: "25px" }}>{top1.total_xp || 0} XP</div>
                        <div className="podium-actions">
                          <button onClick={() => setAwardingStudent(top1)} className="explore-btn podium-btn" style={{ backgroundColor: "#FFD446", color: "#000" }}>
                            🏆 Award
                          </button>
                          <button onClick={() => loadXpHistory(top1)} className="explore-btn podium-btn" style={{ backgroundColor: "rgba(255,255,255,0.06)", color: "#fff", border: "1px solid rgba(255,255,255,0.1)" }}>
                            📜 Trail
                          </button>
                        </div>
                      </div>
                    );
                  })()}

                  {top3 && (() => {
                    const att = getStudentAttendance(top3);
                    return (
                      <div className="podium-card rank-3 animate-in slide-in-from-bottom duration-300">
                        <div style={{ position: "absolute", top: "-12px", fontSize: "20px" }}>🥉</div>
                        <div className="podium-badge">#3</div>
                        <div className="podium-name" title={top3.name}>{top3.name}</div>
                        <div className="podium-meta">
                          {top3.enrollmentNumber || top3.enrollment_number || ""} · {top3.branch || UNKNOWN_BRANCH_LABEL}
                          <br />
                          📅 {att.presentDaysCount}/{WORKSHOP_DAYS} Days ({att.percentage}%)
                        </div>
                        <div className="podium-xp">{top3.total_xp || 0} XP</div>
                        <div className="podium-actions">
                          <button onClick={() => setAwardingStudent(top3)} className="explore-btn podium-btn" style={{ backgroundColor: "#FFD446", color: "#000" }}>
                            🏆 Award
                          </button>
                          <button onClick={() => loadXpHistory(top3)} className="explore-btn podium-btn" style={{ backgroundColor: "rgba(255,255,255,0.06)", color: "#fff", border: "1px solid rgba(255,255,255,0.1)" }}>
                            📜 Trail
                          </button>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* LIST VIEW */}
              <div className="dark-leaderboard-list">
                {loadingStudents ? (
                  <LoadingSpinner label="Loading leaderboard…" />
                ) : paginatedLeaderboard.length > 0 ? (
                  paginatedLeaderboard.map((s: any) => {
                    const absoluteRank = sortedLeaderboard.findIndex((x: any) => (x.id || x.enrollmentNumber || x.enrollment_number) === (s.id || s.enrollmentNumber || s.enrollment_number)) + 1;
                    const att = getStudentAttendance(s);
                    const rankClass = absoluteRank === 1 ? "rank-1 row-rank-1" : absoluteRank === 2 ? "rank-2 row-rank-2" : absoluteRank === 3 ? "rank-3 row-rank-3" : "row-rank-other";

                    return (
                      <div className={`dark-leaderboard-row ${rankClass}`} key={s.id || s.enrollmentNumber || s.enrollment_number}>
                        <div className="row-rank-badge">
                          {absoluteRank <= 3 ? (absoluteRank === 1 ? "🥇" : absoluteRank === 2 ? "🥈" : "🥉") : `#${absoluteRank}`}
                        </div>
                        
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div className="row-name" style={{ textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>{s.name}</div>
                          <div className="row-meta">
                            {s.enrollmentNumber || s.enrollment_number || ""} · {s.branch || UNKNOWN_BRANCH_LABEL}
                            <span style={{ margin: "0 6px", opacity: 0.3 }}>|</span>
                            📅 {att.presentDaysCount}/{WORKSHOP_DAYS} Days ({att.percentage}%)
                          </div>
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: "16px", flexShrink: 0 }}>
                          <span className="row-xp">{s.total_xp || 0} XP</span>
                          
                          <div style={{ display: "flex", gap: "6px" }}>
                            <button
                              onClick={() => setAwardingStudent(s)}
                              className="action-btn-circle"
                              title="Award/Deduct XP"
                              style={{ display: "flex", alignItems: "center", justifyContent: "center" }}
                            >
                              🏆
                            </button>
                            <button
                              onClick={() => loadXpHistory(s)}
                              className="action-btn-circle"
                              title="XP Award Audit Trail"
                              style={{ display: "flex", alignItems: "center", justifyContent: "center" }}
                            >
                              📜
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="modern-card" style={{ padding: "40px", textAlign: "center", color: "var(--db-text-muted)", backgroundColor: "#151304", border: "1.5px solid rgba(255, 212, 70, 0.15)", borderRadius: "16px" }}>
                    No participants match your query.
                  </div>
                )}
              </div>

              {/* PAGINATION */}
              {totalPages > 1 && (
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "20px", flexWrap: "wrap", gap: "12px" }}>
                  <span style={{ fontSize: "12px", color: "var(--db-text-muted)" }}>
                    Showing {startIndex + 1} - {Math.min(startIndex + leaderboardItemsPerPage, totalItems)} of {totalItems} students
                  </span>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button
                      className="explore-btn"
                      disabled={leaderboardPage === 1}
                      onClick={() => setLeaderboardPage(prev => Math.max(prev - 1, 1))}
                      style={{ padding: "6px 12px", fontSize: "12px", height: "auto", minWidth: "auto" }}
                    >
                      Previous
                    </button>
                    <button
                      className="explore-btn"
                      disabled={leaderboardPage === totalPages}
                      onClick={() => setLeaderboardPage(prev => Math.min(prev + 1, totalPages))}
                      style={{ padding: "6px 12px", fontSize: "12px", height: "auto", minWidth: "auto" }}
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })()}

        {/* ======= TAB: STUDENTS ======= */}
        {currentTab === "students" && (() => {
          const avgXp = students.length > 0 
            ? Math.round(students.reduce((sum, s) => sum + Number(s.total_xp || 0), 0) / students.length) 
            : 0;
          const sortedByXp = [...students].sort((a, b) => Number(b.total_xp || 0) - Number(a.total_xp || 0));
          const topPerformer = sortedByXp[0] || null;

          return (
            <div className="db-projects-section animate-in fade-in duration-300">
              {/* Summary Cards */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "24px" }}>
                <div className="stat-card-modern" style={{ background: "#fff", border: "1.5px solid rgba(0,0,0,0.06)", borderRadius: "20px", padding: "20px" }}>
                  <span style={{ fontSize: "11px", fontWeight: "800", color: "var(--db-text-muted)", textTransform: "uppercase" }}>Registered Students</span>
                  <div style={{ fontSize: "28px", fontWeight: "900", color: "var(--db-text-primary)", marginTop: "4px" }}>{students.length}</div>
                </div>
                <div className="stat-card-modern" style={{ background: "#fff", border: "1.5px solid rgba(0,0,0,0.06)", borderRadius: "20px", padding: "20px" }}>
                  <span style={{ fontSize: "11px", fontWeight: "800", color: "var(--db-text-muted)", textTransform: "uppercase" }}>Average Student XP</span>
                  <div style={{ fontSize: "28px", fontWeight: "900", color: "var(--db-accent-orange)", marginTop: "4px" }}>{avgXp} XP</div>
                </div>
                <div className="stat-card-modern" style={{ background: "#fff", border: "1.5px solid rgba(0,0,0,0.06)", borderRadius: "20px", padding: "20px" }}>
                  <span style={{ fontSize: "11px", fontWeight: "800", color: "var(--db-text-muted)", textTransform: "uppercase" }}>👑 Top Performer</span>
                  <div style={{ fontSize: "18px", fontWeight: "900", color: "var(--db-accent-green)", marginTop: "10px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {topPerformer ? `${topPerformer.name} (${topPerformer.total_xp || 0} XP)` : "—"}
                  </div>
                </div>
              </div>

              {/* Roster Controls */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "12px" }}>
                <h3 className="db-section-title" style={{ margin: 0 }}>Student Roster Directory</h3>
                <input
                  type="text"
                  placeholder="Search by name or enrollment…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="form-input-text"
                  style={{ maxWidth: "260px", margin: 0, padding: "8px 12px", borderRadius: "8px", border: "1.5px solid #eaeaea", outline: "none", fontSize: "12px" }}
                />
              </div>

              {/* Roster List */}
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {loadingStudents ? <LoadingSpinner label="Loading students roster…" /> :
                  studentsError ? <div className="db-project-row" style={{ color: "var(--colors--coral)" }}>{studentsError}</div> :
                  filteredStudents.length > 0 ? filteredStudents.map((s: any) => {
                    const enroll = s.enrollmentNumber || s.enrollment_number || "";
                    const normalizedEnroll = enroll.trim().toUpperCase();
                    
                    // Fetch attendance days count
                    const sReport = report?.students?.find((rs: any) => (rs.enrollmentNumber || "").trim().toUpperCase() === normalizedEnroll);
                    const attCount = sReport?.presentDays?.length || 0;
                    
                    // Fetch submissions count
                    const subCount = submissions.filter((sub: any) => (sub.student_id || "").trim().toUpperCase() === normalizedEnroll).length;
                    
                    // Initials for avatar
                    const initials = s.name ? s.name.split(" ").map((n: string) => n[0]).slice(0, 2).join("").toUpperCase() : "👤";

                    return (
                      <div className="modern-card animate-in fade-in duration-200" key={s.id || enroll} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 24px", backgroundColor: "#fff", border: "1.5px solid rgba(0,0,0,0.05)", borderRadius: "20px", gap: "16px", flexWrap: "wrap" }}>
                        {/* Left: Avatar & Info */}
                        <div style={{ display: "flex", alignItems: "center", gap: "16px", flex: 1, minWidth: "240px" }}>
                          <div style={{ width: "42px", height: "42px", borderRadius: "50%", backgroundColor: "rgba(30,58,138,0.05)", color: "var(--db-text-primary)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", fontWeight: "900", border: "1px solid rgba(30,58,138,0.1)" }}>
                            {initials}
                          </div>
                          <div>
                            <h4 style={{ margin: 0, fontSize: "14px", fontWeight: "800", color: "#0f172a" }}>{s.name}</h4>
                            <div style={{ fontSize: "11px", color: "var(--db-text-muted)", marginTop: "2px", display: "flex", gap: "6px", flexWrap: "wrap", alignItems: "center" }}>
                              <span style={{ background: "#f1f5f9", padding: "2px 6px", borderRadius: "6px", fontWeight: "850", color: "#475569" }}>#{enroll}</span>
                              <span>{s.email}</span>
                            </div>
                          </div>
                        </div>

                        {/* Middle: Stats */}
                        <div style={{ display: "flex", gap: "24px", flexWrap: "wrap", alignItems: "center" }}>
                          <div style={{ textAlign: "center" }}>
                            <div style={{ fontSize: "13px", fontWeight: "900", color: "var(--db-text-primary)" }}>{s.branch || "N/A"}</div>
                            <div style={{ fontSize: "9px", color: "var(--db-text-muted)", fontWeight: "800", textTransform: "uppercase", marginTop: "2px" }}>Branch</div>
                          </div>
                          <div style={{ textAlign: "center" }}>
                            <div style={{ fontSize: "13px", fontWeight: "900", color: "var(--db-text-primary)" }}>{attCount}/7</div>
                            <div style={{ fontSize: "9px", color: "var(--db-text-muted)", fontWeight: "800", textTransform: "uppercase", marginTop: "2px" }}>Attendance</div>
                          </div>
                          <div style={{ textAlign: "center" }}>
                            <div style={{ fontSize: "13px", fontWeight: "900", color: "var(--db-text-primary)" }}>{subCount} Done</div>
                            <div style={{ fontSize: "9px", color: "var(--db-text-muted)", fontWeight: "800", textTransform: "uppercase", marginTop: "2px" }}>Submissions</div>
                          </div>
                          <div style={{ textAlign: "center" }}>
                            <div style={{ fontSize: "11px", background: "var(--db-accent-yellow)", color: "#000", padding: "4px 10px", borderRadius: "20px", fontWeight: "900" }}>{s.total_xp || 0} XP</div>
                            <div style={{ fontSize: "9px", color: "var(--db-text-muted)", fontWeight: "800", textTransform: "uppercase", marginTop: "2px" }}>Points</div>
                          </div>
                        </div>

                        {/* Right: Actions */}
                        <div>
                          <button
                            onClick={() => loadXpHistory(s)}
                            className="explore-btn"
                            style={{ padding: "8px 16px", borderRadius: "10px", fontSize: "11px", fontWeight: "800", height: "36px", display: "flex", alignItems: "center", gap: "6px" }}
                          >
                            📜 History
                          </button>
                        </div>
                      </div>
                    );
                  }) : <div className="db-project-row">No students match your query.</div>}
              </div>
            </div>
          );
        })()}

        {/* ======= TAB: POLLS ======= */}
        {currentTab === "polls" && (
          <div className="db-projects-section animate-in fade-in duration-300">
            <h3 className="db-section-title">Live Polling Dashboard</h3>
            <LivePollingAdmin adminEmail={adminUser?.email || "admin@githubpages.in"} showToast={showToast} />
          </div>
        )}

        {/* ======= TAB: PROFILE ======= */}
        {currentTab === "profile" && (
          <div className="db-projects-section animate-in fade-in duration-300">
            <h3 className="db-section-title">Admin Profile</h3>

            {/* Profile banner */}
            <div className="profile-banner modern-card">
              <div className="profile-banner-avatar">
                {photoPreview || profilePhoto ? (
                  <img src={photoPreview || `${profilePhoto}?t=${photoTimestamp}`} alt="Profile" className="profile-avatar-img" />
                ) : (
                  <span className="profile-avatar-letter">
                    {adminName ? adminName.charAt(0).toUpperCase() : "A"}
                  </span>
                )}
              </div>
              <div className="profile-banner-info">
                <div className="profile-banner-name-row">
                  <h4 className="profile-banner-name">{adminName || "Admin"}</h4>
                  <span className="profile-banner-tier" style={{ display: "inline-flex", alignItems: "center", gap: "5px", backgroundColor: "rgba(245,158,11,0.12)", color: "#b45309", border: "1px solid rgba(245,158,11,0.3)", borderRadius: "20px", padding: "3px 10px 3px 6px", fontSize: "12px", fontWeight: "700", lineHeight: "1" }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="#b45309" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0, display: "block" }}>
                      <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.98V12H5V6.3l7-3.11v8.8z" />
                    </svg>
                    Workshop Organizer
                  </span>
                </div>
                <div className="profile-banner-enroll" onClick={handleCopyEmail} title="Click to copy email" style={{ cursor: "pointer" }}>
                  <span>{adminUser?.email || "admin@workshop.edu"}</span>
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: "4px" }}>
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                  {copied && <span className="profile-copy-tip" style={{ color: "var(--db-accent-green)", fontWeight: "bold", marginLeft: "8px" }}>Copied!</span>}
                </div>
                <div className="profile-banner-stats">
                  <div className="profile-stat-chip" style={{ background: "rgba(0,0,0,0.03)", border: "1px solid rgba(0,0,0,0.06)" }}>
                    <span className="profile-stat-value">{stats.totalStudents}</span>
                    <span className="profile-stat-label">Students</span>
                  </div>
                  <div className="profile-stat-chip" style={{ background: "rgba(0,0,0,0.03)", border: "1px solid rgba(0,0,0,0.06)" }}>
                    <span className="profile-stat-value">{stats.sessionsCompleted}/{WORKSHOP_DAYS}</span>
                    <span className="profile-stat-label">Sessions</span>
                  </div>
                  <div className="profile-stat-chip" style={{ background: "rgba(0,0,0,0.03)", border: "1px solid rgba(0,0,0,0.06)" }}>
                    <span className="profile-stat-value">{stats.resourcesPublished}</span>
                    <span className="profile-stat-label">Resources</span>
                  </div>
                  <div className="profile-stat-chip" style={{ background: "rgba(0,0,0,0.03)", border: "1px solid rgba(0,0,0,0.06)" }}>
                    <span className="profile-stat-value">{stats.assignmentsPendingReview}</span>
                    <span className="profile-stat-label">Pending</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Profile Completion Progress Card */}
            {profileCompletion < 100 && (
              <div className="modern-card" style={{ display: "block", padding: "20px 24px", marginBottom: "24px", backgroundColor: "#fff" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                  <span style={{ fontWeight: "800", fontSize: "12px", color: "var(--db-text-primary)", textTransform: "uppercase" }}>Profile Completion Progress</span>
                  <span style={{ fontWeight: "900", fontSize: "14px", color: "var(--db-accent-green)" }}>{profileCompletion}% Complete</span>
                </div>
                <div style={{ width: "100%", height: "10px", backgroundColor: "rgba(0,0,0,0.06)", borderRadius: "10px", overflow: "hidden" }}>
                  <div style={{ width: `${profileCompletion}%`, height: "100%", backgroundColor: "var(--db-accent-green)", borderRadius: "10px", transition: "width 0.4s ease-in-out" }} />
                </div>
                <div style={{ display: "flex", gap: "16px", marginTop: "12px", flexWrap: "wrap" }}>
                  <span style={{ fontSize: "11px", color: profilePhoto ? "var(--db-accent-green)" : "var(--db-text-muted)", fontWeight: "750" }}>
                    {profilePhoto ? "✓ Photo" : "✗ Photo (20%)"}
                  </span>
                  <span style={{ fontSize: "11px", color: adminName?.trim() ? "var(--db-accent-green)" : "var(--db-text-muted)", fontWeight: "750" }}>
                    {adminName?.trim() ? "✓ Name" : "✗ Name (20%)"}
                  </span>
                  <span style={{ fontSize: "11px", color: profileGithub?.trim() ? "var(--db-accent-green)" : "var(--db-text-muted)", fontWeight: "750" }}>
                    {profileGithub?.trim() ? "✓ GitHub" : "✗ GitHub (20%)"}
                  </span>
                  <span style={{ fontSize: "11px", color: profileLinkedin?.trim() ? "var(--db-accent-green)" : "var(--db-text-muted)", fontWeight: "750" }}>
                    {profileLinkedin?.trim() ? "✓ LinkedIn" : "✗ LinkedIn (20%)"}
                  </span>
                  <span style={{ fontSize: "11px", color: profileBio?.trim() ? "var(--db-accent-green)" : "var(--db-text-muted)", fontWeight: "750" }}>
                    {profileBio?.trim() ? "✓ Bio" : "✗ Bio (20%)"}
                  </span>
                </div>
              </div>
            )}

            <div className="profile-layout">
              {/* LEFT: editable form */}
              <form onSubmit={handleSaveProfile} className="modern-card profile-form-card" style={{ display: "block", padding: "32px", backgroundColor: "#fff", minHeight: "auto" }}>
                {/* Photo upload control */}
                <div
                  className={`profile-photo-upload${photoDragActive ? " is-dragging" : ""}`}
                  onDragOver={(e) => { e.preventDefault(); setPhotoDragActive(true); }}
                  onDragLeave={(e) => { e.preventDefault(); setPhotoDragActive(false); }}
                  onDrop={handlePhotoDrop}
                >
                  <div className="profile-avatar">
                    {photoPreview || profilePhoto ? (
                      <img
                        src={photoPreview || `${profilePhoto}?t=${photoTimestamp}`}
                        alt="Profile preview"
                        className="profile-avatar-img"
                      />
                    ) : (
                      <span className="profile-avatar-letter">
                        {adminName ? adminName.charAt(0).toUpperCase() : "A"}
                      </span>
                    )}
                    <label className="profile-avatar-overlay" title="Upload photo">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
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
                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
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
                    <span className="profile-photo-hint">Drag &amp; drop or click · JPG, PNG, WEBP · max 5MB</span>
                  </div>
                </div>

                {uploadError && <div className="profile-upload-error">{uploadError}</div>}

                <div className="profile-fields">
                  <div>
                    <label className="form-label" style={{ fontWeight: "900", fontSize: "12px", textTransform: "uppercase", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>Display Name</label>
                    <input
                      type="text"
                      value={adminName}
                      onChange={(e) => { setAdminName(e.target.value); if (profileTouched.name) setProfileErrors((p) => ({ ...p, name: validateName(e.target.value) })); }}
                      onBlur={() => { setProfileTouched((p) => ({ ...p, name: true })); setProfileErrors((p) => ({ ...p, name: validateName(adminName) })); }}
                      placeholder="Your name"
                      className={`form-input-text${profileTouched.name && profileErrors.name ? " has-error" : ""}`}
                    />
                    {profileTouched.name && profileErrors.name && (
                      <span className="profile-error-text">{profileErrors.name}</span>
                    )}
                  </div>
                  <div>
                    <label className="form-label" style={{ fontWeight: "900", fontSize: "12px", textTransform: "uppercase", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>Email</label>
                    <input type="text" disabled value={adminUser?.email || ""} className="form-input-text" style={{ opacity: 0.6, cursor: "not-allowed" }} />
                  </div>
                  <div>
                    <label className="form-label" style={{ fontWeight: "900", fontSize: "12px", textTransform: "uppercase", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>GitHub Username</label>
                    <input
                      type="text"
                      value={profileGithub}
                      onChange={(e) => { setProfileGithub(e.target.value); if (profileTouched.github) setProfileErrors((p) => ({ ...p, github: validateGithub(e.target.value) })); }}
                      onBlur={() => { setProfileTouched((p) => ({ ...p, github: true })); setProfileErrors((p) => ({ ...p, github: validateGithub(profileGithub) })); }}
                      placeholder="github-username"
                      className={`form-input-text${profileTouched.github && profileErrors.github ? " has-error" : ""}`}
                    />
                    {profileTouched.github && profileErrors.github && (
                      <span className="profile-error-text">{profileErrors.github}</span>
                    )}
                  </div>
                  <div>
                    <label className="form-label" style={{ fontWeight: "900", fontSize: "12px", textTransform: "uppercase", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>LinkedIn Profile Link</label>
                    <input
                      type="url"
                      value={profileLinkedin}
                      onChange={(e) => { setProfileLinkedin(e.target.value); if (profileTouched.linkedin) setProfileErrors((p) => ({ ...p, linkedin: validateLinkedin(e.target.value) })); }}
                      onBlur={() => { setProfileTouched((p) => ({ ...p, linkedin: true })); setProfileErrors((p) => ({ ...p, linkedin: validateLinkedin(profileLinkedin) })); }}
                      placeholder="https://linkedin.com/in/username"
                      className={`form-input-text${profileTouched.linkedin && profileErrors.linkedin ? " has-error" : ""}`}
                    />
                    {profileTouched.linkedin && profileErrors.linkedin && (
                      <span className="profile-error-text">{profileErrors.linkedin}</span>
                    )}
                  </div>
                </div>

                <div className="profile-bio-block">
                  <div className="profile-bio-label-row">
                    <label className="form-label" style={{ fontWeight: "900", fontSize: "12px", textTransform: "uppercase", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>Profile Bio</label>
                    <span className="profile-bio-counter">{profileBio.length}/{BIO_MAX}</span>
                  </div>
                  <textarea
                    value={profileBio}
                    maxLength={BIO_MAX}
                    onChange={(e) => setProfileBio(e.target.value)}
                    className="form-input-text"
                    style={{ minHeight: "90px", resize: "vertical" }}
                  ></textarea>
                </div>

                <div className="profile-actions">
                  {isDirty && <span className="profile-dirty-tag">● Unsaved changes</span>}
                  <div className="profile-action-btns">
                    {isDirty && (
                      <button type="button" onClick={handleDiscard} disabled={savingProfile} className="profile-discard-btn">
                        Discard
                      </button>
                    )}
                    <button type="submit" disabled={savingProfile} className="explore-btn profile-save-btn">
                      {savingProfile ? "Saving..." : "Save Details"}
                    </button>
                  </div>
                </div>
              </form>

              {/* RIGHT: live public preview */}
              <aside className="modern-card profile-preview-card" style={{ padding: "32px", backgroundColor: "#fff", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", minHeight: "auto" }}>
                <span className="profile-preview-tag" style={{ color: "var(--accent-green)", backgroundColor: "rgba(16,185,129,0.1)", padding: "4px 12px", borderRadius: "20px", fontSize: "11px", fontWeight: "800" }}>Public Preview</span>
                <div className="profile-preview-avatar" style={{ border: "2px solid #eaeaea", width: "100px", height: "100px", borderRadius: "50%", overflow: "hidden", marginTop: "16px" }}>
                  {photoPreview || profilePhoto ? (
                    <img src={photoPreview || `${profilePhoto}?t=${photoTimestamp}`} alt="Profile" className="profile-avatar-img" />
                  ) : (
                    <span className="profile-avatar-letter" style={{ fontSize: "28px" }}>
                      {adminName ? adminName.charAt(0).toUpperCase() : "A"}
                    </span>
                  )}
                </div>
                <h4 className="profile-preview-name" style={{ margin: "12px 0 4px 0", fontSize: "18px", fontWeight: "800" }}>{adminName || "Admin"}</h4>
                <span className="profile-preview-enroll" style={{ fontStyle: "italic", fontSize: "12px", color: "var(--text-secondary)" }}>{adminUser?.email || "admin@workshop.edu"}</span>
                {githubUrl(profileGithub) ? (
                  <a className="profile-preview-link" href={githubUrl(profileGithub)} target="_blank" rel="noopener noreferrer" style={{ marginTop: "12px", color: "var(--accent-blue)" }}>
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" style={{ marginRight: "6px" }}><path d="M12 .5C5.7.5.5 5.7.5 12c0 5.1 3.3 9.4 7.9 10.9.6.1.8-.2.8-.6v-2c-3.2.7-3.9-1.5-3.9-1.5-.5-1.3-1.3-1.7-1.3-1.7-1.1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1 1.8 2.7 1.3 3.4 1 .1-.8.4-1.3.7-1.6-2.6-.3-5.3-1.3-5.3-5.7 0-1.3.5-2.3 1.2-3.1-.1-.3-.5-1.5.1-3.1 0 0 1-.3 3.3 1.2a11.5 11.5 0 0 1 6 0c2.3-1.5 3.3-1.2 3.3-1.2.6 1.6.2 2.8.1 3.1.8.8 1.2 1.8 1.2 3.1 0 4.4-2.7 5.4-5.3 5.7.4.4.8 1.1.8 2.2v3.3c0 .4.2.7.8.6 4.6-1.5 7.9-5.8 7.9-10.9C23.5 5.7 18.3.5 12 .5z"/></svg>
                    {profileGithub}
                  </a>
                ) : (
                  <span className="profile-preview-link profile-preview-link--muted" style={{ marginTop: "12px" }}>No GitHub username yet</span>
                )}
                {profileLinkedin.trim() && (
                  <a className="profile-preview-link" href={profileLinkedin} target="_blank" rel="noopener noreferrer" style={{ marginTop: "6px", color: "#0a66c2" }}>
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" style={{ marginRight: "6px" }}>
                      <path d="M4.98 3.5C4.98 4.88 3.87 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1s2.48 1.12 2.48 2.5zM.5 8h4V23h-4V8zm7.5 0h3.8v2.05h.05c.53-1 1.83-2.05 3.77-2.05 4.03 0 4.78 2.65 4.78 6.1V23h-4v-6.6c0-1.57-.03-3.6-2.2-3.6-2.2 0-2.53 1.72-2.53 3.49V23h-4V8z"/>
                    </svg>
                    LinkedIn
                  </a>
                )}
                <p className="profile-preview-bio" style={{ fontSize: "13px", color: "var(--text-secondary)", marginTop: "12px" }}>
                  {profileBio || "Your bio will appear here for peers to see."}
                </p>
                <div className="profile-preview-stats">
                  <div className="profile-preview-stat">
                    <span className="profile-preview-stat-value">{stats.totalStudents}</span>
                    <span className="profile-preview-stat-label">Students</span>
                  </div>
                  <div className="profile-preview-stat">
                    <span className="profile-preview-stat-value">{stats.sessionsCompleted}/{WORKSHOP_DAYS}</span>
                    <span className="profile-preview-stat-label">Sessions</span>
                  </div>
                  <div className="profile-preview-stat">
                    <span className="profile-preview-stat-value">{stats.resourcesPublished}</span>
                    <span className="profile-preview-stat-label">Resources</span>
                  </div>
                </div>

                {/* Account & Access */}
                <div style={{ width: "100%", marginTop: "24px", borderTop: "1px solid rgba(0,0,0,0.08)", paddingTop: "18px", textAlign: "left" }}>
                  <span style={{ fontSize: "10px", fontWeight: "900", color: "var(--db-text-muted)", letterSpacing: "1px", textTransform: "uppercase" }}>Account &amp; Access</span>
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "12px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12px" }}>
                      <span style={{ color: "var(--db-text-muted)", fontWeight: "600" }}>Role</span>
                      <span style={{ fontWeight: "800", color: "var(--db-text-primary)" }}>Workshop Organizer</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12px" }}>
                      <span style={{ color: "var(--db-text-muted)", fontWeight: "600" }}>Data Sync</span>
                      <span style={{ fontWeight: "800", color: health?.syncMode === "live" ? "#16a34a" : "#b45309" }}>
                        {health ? (health.syncMode === "live" ? "Live" : "Local") : "—"}
                      </span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12px" }}>
                      <span style={{ color: "var(--db-text-muted)", fontWeight: "600" }}>Last Updated</span>
                      <span style={{ fontWeight: "800", color: "var(--db-text-primary)" }}>{lastSaved || "Not yet"}</span>
                    </div>
                  </div>
                </div>

                <button onClick={handleLogout} className="db-sidebar-logout-btn"
                  style={{ marginTop: "24px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", width: "100%", padding: "10px" }}>
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                  Logout from Admin Console
                </button>
              </aside>
            </div>
          </div>
        )}
      </main>

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
          <div className="modern-card" style={{
            maxWidth: "400px",
            width: "100%",
            backgroundColor: "#ffffff",
            padding: "24px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            minHeight: "auto"
          }}>
            <h4 style={{ fontSize: "18px", margin: "0 0 4px 0", fontWeight: "900" }}>Edit &amp; Crop Photo</h4>
            <p style={{ fontSize: "12px", marginBottom: "16px", color: "var(--text-secondary)" }}>
              Zoom and drag sliders to center your face inside the circle.
            </p>

            {/* Preview Circle */}
            <div style={{
              width: "200px",
              height: "200px",
              borderRadius: "50%",
              overflow: "hidden",
              border: "2px solid #eaeaea",
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
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", fontWeight: "900" }}>
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
                  style={{ width: "100%", cursor: "pointer", accentColor: "var(--accent-orange)" }}
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", fontWeight: "900" }}>
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
                  style={{ width: "100%", cursor: "pointer", accentColor: "var(--accent-orange)" }}
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", fontWeight: "900" }}>
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
                  style={{ width: "100%", cursor: "pointer", accentColor: "var(--accent-orange)" }}
                />
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: "flex", gap: "12px", width: "100%", marginTop: "24px" }}>
              <button
                type="button"
                className="explore-btn"
                style={{ flex: 1, backgroundColor: "#ffffff", color: "#000", border: "1px solid #eaeaea", height: "auto" }}
                onClick={() => setShowCropper(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="explore-btn"
                style={{ flex: 1, height: "auto" }}
                onClick={handleApplyCrop}
              >
                Apply Crop
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Award XP */}
      {awardingStudent && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: "rgba(0, 0, 0, 0.6)", display: "flex",
          alignItems: "center", justifyContent: "center", zIndex: 1000,
          backdropFilter: "blur(4px)"
        }}>
          <form onSubmit={handleAwardXp} className="modern-card animate-in zoom-in duration-200" style={{
            backgroundColor: "#111007", border: "2px solid #FFD446",
            borderRadius: "24px", padding: "28px", width: "100%",
            maxWidth: "420px", color: "#fff", display: "flex",
            flexDirection: "column", gap: "16px"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h4 style={{ margin: 0, fontFamily: "var(--font-anton)", fontSize: "20px", textTransform: "uppercase", letterSpacing: "0.5px", color: "#FFD446" }}>
                Award / Deduct XP
              </h4>
              <button type="button" onClick={() => setAwardingStudent(null)} style={{ background: "none", border: "none", color: "#a5a5b5", fontSize: "20px", cursor: "pointer" }}>
                ✕
              </button>
            </div>
            <div style={{ fontSize: "14px", color: "#a5a5b5" }}>
              Adjusting XP for <strong>{awardingStudent.name}</strong> ({awardingStudent.enrollmentNumber || awardingStudent.enrollment_number})
            </div>
            
            {awardError && (
              <div style={{ color: "var(--db-accent-red)", backgroundColor: "rgba(239, 68, 68, 0.1)", padding: "10px 14px", borderRadius: "8px", fontSize: "13px" }}>
                {awardError}
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "12px", fontWeight: "900", textTransform: "uppercase", letterSpacing: "0.5px" }}>XP Amount</label>
              <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                <input
                  type="number"
                  className="form-input-text"
                  value={awardAmount}
                  onChange={(e) => setAwardAmount(e.target.value)}
                  style={{ margin: 0, backgroundColor: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.1)", color: "#fff" }}
                  placeholder="e.g. 10 or -15"
                  required
                />
                <div style={{ display: "flex", gap: "4px" }}>
                  <button
                    type="button"
                    onClick={() => setAwardAmount(prev => String(Math.abs(Number(prev || 0))))}
                    className="explore-btn"
                    style={{
                      padding: "4px 8px", fontSize: "11px", height: "auto", minWidth: "auto",
                      backgroundColor: Number(awardAmount) >= 0 ? "#FFD446" : "rgba(255,255,255,0.05)",
                      color: Number(awardAmount) >= 0 ? "#000" : "#fff"
                    }}
                  >
                    Positive
                  </button>
                  <button
                    type="button"
                    onClick={() => setAwardAmount(prev => String(-Math.abs(Number(prev || 0))))}
                    className="explore-btn"
                    style={{
                      padding: "4px 8px", fontSize: "11px", height: "auto", minWidth: "auto",
                      backgroundColor: Number(awardAmount) < 0 ? "var(--db-accent-red)" : "rgba(255,255,255,0.05)",
                      color: "#fff"
                    }}
                  >
                    Negative
                  </button>
                </div>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "12px", fontWeight: "900", textTransform: "uppercase", letterSpacing: "0.5px" }}>Reason (Required)</label>
              <textarea
                className="form-input-text"
                value={awardReason}
                onChange={(e) => setAwardReason(e.target.value)}
                style={{ margin: 0, backgroundColor: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.1)", color: "#fff", minHeight: "80px", fontFamily: "inherit" }}
                placeholder="e.g. Helped debug a merge conflict for another team"
                required
              />
            </div>

            <div style={{ display: "flex", gap: "12px", marginTop: "12px" }}>
              <button
                type="button"
                className="explore-btn"
                style={{ flex: 1, backgroundColor: "transparent", color: "#fff", border: "1px solid rgba(255,255,255,0.1)", height: "auto" }}
                onClick={() => setAwardingStudent(null)}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={awardSubmitting}
                className="explore-btn"
                style={{ flex: 1, backgroundColor: "#FFD446", color: "#000", height: "auto" }}
              >
                {awardSubmitting ? "Awarding..." : "Award XP"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: XP History */}
      {historyStudent && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: "rgba(0, 0, 0, 0.6)", display: "flex",
          alignItems: "center", justifyContent: "center", zIndex: 1000,
          backdropFilter: "blur(4px)"
        }}>
          <div className="modern-card animate-in zoom-in duration-200" style={{
            backgroundColor: "#111007", border: "2px solid #FFD446",
            borderRadius: "24px", padding: "28px", width: "100%",
            maxWidth: "500px", display: "flex",
            flexDirection: "column", gap: "16px", color: "#fff"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h4 style={{ margin: 0, fontFamily: "var(--font-anton)", fontSize: "20px", textTransform: "uppercase", letterSpacing: "0.5px", color: "#FFD446" }}>
                XP History Trail
              </h4>
              <button type="button" onClick={() => setHistoryStudent(null)} style={{ background: "none", border: "none", color: "#a5a5b5", fontSize: "20px", cursor: "pointer" }}>
                ✕
              </button>
            </div>
            <div style={{ fontSize: "14px", color: "#a5a5b5", borderBottom: "1.5px solid rgba(255,255,255,0.08)", paddingBottom: "12px" }}>
              Auditable records for <strong>{historyStudent.name}</strong>
            </div>

            <div style={{ overflowY: "auto", flex: 1, display: "flex", flexDirection: "column", gap: "10px", maxHeight: "300px", paddingRight: "4px" }}>
              {loadingHistory ? (
                <div style={{ textAlign: "center", padding: "24px", color: "#a5a5b5" }}>Loading history...</div>
              ) : (
                studentHistory.map((h: any) => (
                  <div key={h.id || h.created_at} style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: "12px"
                  }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "4px", minWidth: 0 }}>
                      <div style={{ fontSize: "13px", fontWeight: "600", color: "#fff", overflowWrap: "anywhere" }}>
                        {h.reason}
                      </div>
                      <div style={{ fontSize: "11px", color: "#a5a5b5" }}>
                        Awarded by: <strong>{h.awarded_by || h.awardedBy || "Admin"}</strong>
                      </div>
                      <div style={{ fontSize: "10px", color: "#6b7280" }}>
                        {new Date(h.created_at || h.createdAt).toLocaleString()}
                      </div>
                    </div>
                    <div style={{
                      fontSize: "14px", fontWeight: "800", flexShrink: 0,
                      color: h.amount >= 0 ? "#22c55e" : "#ef4444"
                    }}>
                      {h.amount >= 0 ? `+${h.amount}` : h.amount} XP
                    </div>
                  </div>
                ))
              )}
            </div>

            <div style={{ display: "flex", marginTop: "12px" }}>
              <button
                type="button"
                className="explore-btn"
                style={{ flex: 1, backgroundColor: "#FFD446", color: "#000", height: "auto" }}
                onClick={() => setHistoryStudent(null)}
              >
                Close Trail
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}






