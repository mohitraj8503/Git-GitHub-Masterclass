"use client";

import { useState, useEffect, useRef, useCallback, Fragment } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import AssetImage from "@/components/AssetImage";
import LoadingSpinner from "@/components/LoadingSpinner";
import CountdownRing from "@/components/CountdownRing";
import LivePollingStudent from "@/components/LivePollingStudent";
import { INSTITUTION_CODE, WORKSHOP_DAYS, UNKNOWN_BRANCH_LABEL, ATTENDANCE_WINDOW_MINUTES } from "@/lib/config";
import { StudentAvatar } from "@/components/StudentAvatar";
import CertificationTab from "@/components/dashboard/CertificationTab";

// ---- helpers ----
const getTimeGreeting = (timestamp: number) => {
  const h = new Date(timestamp).getHours();
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

import { SCHEDULE_DAYS, STATUS_LABEL, getDayStatus as getSharedDayStatus } from "@/lib/sessions";

const SCHEDULE_VENUE = "Computer Lab 2, Room 320, Block Baudhayana, Arka Jain University";

const BADGES_METADATA = [
  { id: "first_attendance", emoji: "🎯", color: "linear-gradient(135deg, #FFD446, #FFA800)", name: "First Check-In", desc: "Marked attendance for the first time", condition: "Attend any single workshop session" },
  { id: "first_github_repo", emoji: "📂", color: "linear-gradient(135deg, #10B981, #059669)", name: "First Repo Submit", desc: "Submitted your first GitHub repository", condition: "Submit an assignment containing a github.com repository link" },
  { id: "first_assignment", emoji: "📝", color: "linear-gradient(135deg, #3B82F6, #2563EB)", name: "First HW Done", desc: "Submitted your first assignment", condition: "Have any assignment reviewed and graded by a mentor" },
  { id: "perfect_attendance_badge", emoji: "🔥", color: "linear-gradient(135deg, #EC4899, #D946EF)", name: "Perfect Attendance", desc: "Attended all 7 days of the workshop", condition: "Attend all 7 days of the workshop" },
  { id: "assignment_master_badge", emoji: "💻", color: "linear-gradient(135deg, #F59E0B, #D97706)", name: "Assignment Master", desc: "Submitted all workshop assignments", condition: "Complete and get graded on all published assignments" },
  { id: "workshop_warrior_badge", emoji: "🚀", color: "linear-gradient(135deg, #8B5CF6, #7C3AED)", name: "Workshop Warrior", desc: "Completed all daily tasks every day", condition: "Attend at least 5 workshop sessions" },
  { id: "git_github_master_badge", emoji: "🎓", color: "linear-gradient(135deg, #EF4444, #DC2626)", name: "Git & GitHub Master", desc: "Completed the entire workshop requirements", condition: "Earn both Perfect Attendance and Assignment Master" }
];

export default function DashboardPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  // Auth gate: only an actual registered user (saved on sign-up) may view this.
  const [registeredUser, setRegisteredUser] = useState<any>();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      const userReg = {
        name: session.user.name,
        email: session.user.email,
        enrollmentNumber: (session.user as any).enrollmentNumber,
        branch: (session.user as any).branch,
        yearOfStudy: (session.user as any).yearOfStudy,
        role: (session.user as any).role || "student",
      };
      localStorage.setItem("user_registration", JSON.stringify(userReg));
      setRegisteredUser(userReg);
    }
  }, [session, status]);

  useEffect(() => {
    document.body.classList.add("dashboard-body-active");
    document.documentElement.classList.add("dashboard-body-active");

    return () => {
      document.body.classList.remove("dashboard-body-active");
      document.documentElement.classList.remove("dashboard-body-active");
    };
  }, []);

  useEffect(() => {
    if (status === "loading") return;

    const saved = localStorage.getItem("user_registration");
    if (saved) {
      try {
        setRegisteredUser(JSON.parse(saved));
      } catch (e) {
        console.error("Error reading registration data:", e);
        localStorage.removeItem("user_registration");
        setRegisteredUser(null);
      }
    } else if (status !== "authenticated") {
      setRegisteredUser(null);
    }
    setChecked(true);
  }, [status]);

  useEffect(() => {
    if (status === "loading") return;
    if (checked && registeredUser === null) {
      router.replace("/login");
    }
  }, [checked, registeredUser, router, status]);

  // Tab state
  const [currentTab, setCurrentTab] = useState("home");
  const [announcementFilter, setAnnouncementFilter] = useState("ALL");

  // LMS States
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [resources, setResources] = useState<any[]>([]);
  const [peers, setPeers] = useState<any[]>([]);
  const [completedTaskIds, setCompletedTaskIds] = useState<string[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [lastReadNotif, setLastReadNotif] = useState<number>(0);
  const [selectedPeer, setSelectedPeer] = useState<any>(null);
  const [peerPhoto, setPeerPhoto] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [leaderboardSearch, setLeaderboardSearch] = useState("");
  const [showSearchResults, setShowSearchResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);

  // Gamification States
  const [dailyChecklist, setDailyChecklist] = useState<any[]>([]);
  const [perfectDayClaimed, setPerfectDayClaimed] = useState(false);
  const [unlockedBadges, setUnlockedBadges] = useState<string[]>([]);
  const [floatingXps, setFloatingXps] = useState<Array<{ id: number; text: string; x: number; y: number }>>([]);
  const [unlockedBadgeModal, setUnlockedBadgeModal] = useState<any>(null);
  const [hoveredChartPoint, setHoveredChartPoint] = useState<any | null>(null);
  const [progressViewType, setProgressViewType] = useState<"combined" | "attendance" | "assignments">("combined");
  const [showProgressDropdown, setShowProgressDropdown] = useState(false);

  // Floating XP trigger
  const triggerFloatingXp = useCallback((amount: number, label: string) => {
    const id = Date.now() + Math.random();
    const text = `+${amount} XP${label ? ` (${label})` : ""}`;
    const x = window.innerWidth / 2 + (Math.random() - 0.5) * 120;
    const y = window.innerHeight / 2 + (Math.random() - 0.5) * 120;
    
    setFloatingXps(prev => [...prev, { id, text, x, y }]);
    setTimeout(() => {
      setFloatingXps(prev => prev.filter(item => item.id !== id));
    }, 2000);

    if (amount >= 20) {
      import("canvas-confetti").then(confetti => {
        confetti.default({ particleCount: 80, spread: 60, origin: { y: 0.7 } });
      }).catch(err => console.warn(err));
    }
  }, []);

  // Initialize notification read timestamp
  useEffect(() => {
    const val = localStorage.getItem("last_read_notif");
    if (val) setLastReadNotif(Number(val));
  }, []);

  // Parse tab parameter from URL search query on load
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get("tab");
      if (tab) {
        setCurrentTab(tab);
      }
    }
  }, []);

  // XP and streak are DERIVED from database records & REAL activity
  const currentUserRecord = peers.find((p: any) => (p.enrollmentNumber || p.enrollment_number || "").trim().toLowerCase() === (registeredUser?.enrollmentNumber || "").trim().toLowerCase());
  const xp = currentUserRecord ? Number(currentUserRecord.total_xp || currentUserRecord.totalXp || 0) : 0;
  const streak = attendance.length;

  // Form states for submission
  const [submittingAssignmentId, setSubmittingAssignmentId] = useState<string>("");
  const [submissionRepo, setSubmissionRepo] = useState<string>("");
  const [submissionLive, setSubmissionLive] = useState<string>("");
  const [submissionAttachment, setSubmissionAttachment] = useState<string>("");
  const [uploadingAttachment, setUploadingAttachment] = useState<boolean>(false);
  const [submittingHomework, setSubmittingHomework] = useState<boolean>(false);

  // Profile Edit State
  const [profileBio, setProfileBio] = useState<string>("");
  const [profileGithub, setProfileGithub] = useState<string>("");
  const [profileLinkedin, setProfileLinkedin] = useState<string>("");
  const [savingProfile, setSavingProfile] = useState<boolean>(false);


  // Feedback states
  const [showFeedbackModal, setShowFeedbackModal] = useState<boolean>(false);
  const [feedbackRating, setFeedbackRating] = useState<number>(0);
  const [hoveredRating, setHoveredRating] = useState<number>(0);
  const [feedbackMessage, setFeedbackMessage] = useState<string>("");
  const [submittingFeedback, setSubmittingFeedback] = useState<boolean>(false);

  const BIO_MAX = 200;

  // Validation + UX state
  const [profileErrors, setProfileErrors] = useState<{ github?: string; linkedin?: string }>({});
  const [profileTouched, setProfileTouched] = useState<{ github?: boolean; linkedin?: boolean; bio?: boolean }>({});
  const [toast, setToast] = useState<{ type: "success" | "error" | "info"; message: string } | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [initialSnapshot, setInitialSnapshot] = useState<string>("");
  const [isDirty, setIsDirty] = useState<boolean>(false);

  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!registeredUser) return;
    if (feedbackRating === 0) {
      showToast("error", "Please select a rating.");
      return;
    }
    if (!feedbackMessage.trim()) {
      showToast("error", "Please enter your message.");
      return;
    }
    setSubmittingFeedback(true);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enrollmentNumber: registeredUser.enrollmentNumber || registeredUser.enrollment_number,
          name: registeredUser.name,
          email: registeredUser.email,
          message: feedbackMessage,
          rating: feedbackRating
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast("success", "Thank you for your feedback! 🎉");
        triggerFloatingXp(10, "Feedback Submitted! 📝");
        setFeedbackRating(0);
        setFeedbackMessage("");
        setShowFeedbackModal(false);
        loadLmsData();
      } else {
        showToast("error", data.error || "Failed to submit feedback.");
      }
    } catch (err: any) {
      showToast("error", err.message || "Failed to submit feedback.");
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    window.setTimeout(() => setToast(null), 3200);
  };

  // Ctrl+K focuses search
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        const input = document.getElementById("db-search-input") as HTMLInputElement | null;
        input?.focus();
        input?.select();
        setShowSearchResults(true);
      }
      if (e.key === "Escape") {
        setShowSearchResults(false);
        setSearchQuery("");
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Close search on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSearchResults(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Build search results from all data
  const searchResults = (() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    const results: { label: string; sub: string; tab: string; icon: string }[] = [];
    // Sessions
    SCHEDULE_DAYS.forEach((s) => {
      if (s.title.toLowerCase().includes(q) || s.desc.toLowerCase().includes(q)) {
        results.push({ label: `Day ${s.day}: ${s.title}`, sub: s.date, tab: "schedule", icon: "📅" });
      }
    });
    // Assignments
    assignments.forEach((a: any) => {
      if ((a.title || "").toLowerCase().includes(q) || (a.description || "").toLowerCase().includes(q)) {
        results.push({ label: a.title || "Assignment", sub: a.due_date ? `Due: ${a.due_date}` : "Assignment", tab: "assignments", icon: "📝" });
      }
    });
    // Resources
    resources.forEach((r: any) => {
      if ((r.title || "").toLowerCase().includes(q) || (r.description || "").toLowerCase().includes(q)) {
        results.push({ label: r.title || "Resource", sub: r.type || "Resource", tab: "resources", icon: "📁" });
      }
    });
    // Peers / Leaderboard
    peers.forEach((p: any) => {
      const name = (p.name || "").toLowerCase();
      const enroll = (p.enrollmentNumber || p.enrollment_number || "").toLowerCase();
      if (name.includes(q) || enroll.includes(q)) {
        results.push({ label: p.name || "Student", sub: p.branch || "Student", tab: "leaderboard", icon: "🏆" });
      }
    });
    // Announcements
    announcements.forEach((a: any) => {
      if ((a.title || "").toLowerCase().includes(q) || (a.message || "").toLowerCase().includes(q)) {
        results.push({ label: a.title || "Announcement", sub: "Announcement", tab: "home", icon: "📢" });
      }
    });
    return results.slice(0, 8);
  })();

  // Profile photo state (shared with Student Pass + sidebar avatar)
  const [profilePhoto, setProfilePhoto] = useState<string>(
    typeof window !== "undefined" ? localStorage.getItem("profile_photo") || "" : ""
  );

  // Fetch peer photo when modal opens (placed after profilePhoto is declared)
  useEffect(() => {
    if (!selectedPeer) { setPeerPhoto(""); return; }
    if (selectedPeer.you) { setPeerPhoto(profilePhoto || ""); return; }
    if (!selectedPeer.enrollmentNumber) return;
    fetch(`/api/profile?enrollment_number=${encodeURIComponent(selectedPeer.enrollmentNumber)}`)
      .then(r => r.json())
      .then(data => {
        if (data.success && data.profile?.avatar_url) {
          setPeerPhoto(data.profile.avatar_url);
        } else {
          setPeerPhoto("");
        }
      })
      .catch(() => setPeerPhoto(""));
  }, [selectedPeer, profilePhoto]);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string>("");
  const [photoDragActive, setPhotoDragActive] = useState<boolean>(false);

  // Profile completion score — computed after all profile states are declared
  const profileCompletion = (() => {
    let score = 0;
    if (profilePhoto) score += 20;
    if (profileBio?.trim()) score += 20;
    if (profileGithub?.trim()) score += 20;
    if (profileLinkedin?.trim()) score += 20;
    if (registeredUser?.email) score += 20;
    return score;
  })();

  // --- Live attendance window state (polled from the server) ---
  const [activeWindow, setActiveWindow] = useState<any>(null);
  const [alreadyCheckedIn, setAlreadyCheckedIn] = useState(false);
  const [checkinLoading, setCheckinLoading] = useState(false);
  const [checkinError, setCheckinError] = useState("");
  const [checkinSuccess, setCheckinSuccess] = useState(false);
  const [nowTs, setNowTs] = useState(Date.now());

  // Always update current timestamp every second to drive countdowns on all tabs
  useEffect(() => {
    const tickInt = setInterval(() => setNowTs(Date.now()), 1000);
    return () => clearInterval(tickInt);
  }, []);

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
    poll();
    const pollInt = setInterval(poll, 3000);
    return () => {
      alive = false;
      clearInterval(pollInt);
    };
  }, [currentTab, registeredUser]);

  const loadLmsData = useCallback(async () => {
    if (!registeredUser) return;
    const enrollment = registeredUser.enrollmentNumber || registeredUser.enrollment_number || "";
    try {
      const [annRes, assRes, subRes, attRes, peerRes, resRes, taskRes, dailyRes, badgesRes] = await Promise.all([
        fetch("/api/announcements").then((r) => r.json()),
        fetch("/api/assignments").then((r) => r.json()),
        fetch(`/api/submissions?student_id=${enrollment}`).then((r) => r.json()),
        fetch(`/api/attendance?enrollment_number=${encodeURIComponent(enrollment)}`).then((r) => r.json()),
        fetch("/api/register").then((r) => r.json()),
        fetch("/api/resources").then((r) => r.json()),
        fetch(`/api/tasks/complete?enrollmentNumber=${encodeURIComponent(enrollment)}`).then((r) => r.json()),
        fetch(`/api/daily-tasks?enrollment_number=${encodeURIComponent(enrollment)}`).then((r) => r.json()),
        fetch(`/api/student/badges?enrollment_number=${encodeURIComponent(enrollment)}`).then((r) => r.json()),
      ]);

      if (annRes.success) setAnnouncements(annRes.announcements);
      if (assRes.success) setAssignments(assRes.assignments);
      if (subRes.success) setSubmissions(subRes.submissions);
      if (attRes.success) setAttendance(attRes.attendance);
      if (peerRes.success && Array.isArray(peerRes.registrations)) {
        setPeers(peerRes.registrations);
        const myEnroll = enrollment.trim().toLowerCase();
        const myEmail = (registeredUser.email || "").trim().toLowerCase();
        const currentRecord = peerRes.registrations.find(
          (p: any) => {
            const pEnroll = (p.enrollmentNumber || p.enrollment_number || "").trim().toLowerCase();
            const pEmail = (p.email || "").trim().toLowerCase();
            return (myEnroll && pEnroll === myEnroll) || (myEmail && pEmail === myEmail);
          }
        );
        if (currentRecord) {
          const updatedUser = {
            ...registeredUser,
            name: currentRecord.name,
            enrollmentNumber: currentRecord.enrollmentNumber || currentRecord.enrollment_number,
            email: currentRecord.email,
            branch: currentRecord.branch,
            yearOfStudy: currentRecord.yearOfStudy || currentRecord.year_of_study,
            phoneNumber: currentRecord.phoneNumber || currentRecord.phone_number,
            githubUsername: currentRecord.githubUsername || currentRecord.github_username || registeredUser.githubUsername,
            total_xp: currentRecord.total_xp || currentRecord.totalXp || 0,
          };
          // Only update if something actually changed to avoid infinite loop
          if (
            registeredUser.name !== updatedUser.name ||
            registeredUser.enrollmentNumber !== updatedUser.enrollmentNumber ||
            registeredUser.branch !== updatedUser.branch ||
            registeredUser.yearOfStudy !== updatedUser.yearOfStudy ||
            registeredUser.email !== updatedUser.email ||
            registeredUser.phoneNumber !== updatedUser.phoneNumber ||
            registeredUser.githubUsername !== updatedUser.githubUsername ||
            registeredUser.total_xp !== updatedUser.total_xp
          ) {
            setRegisteredUser(updatedUser);
            localStorage.setItem("user_registration", JSON.stringify(updatedUser));
          }
        }
      }
      if (resRes.success) setResources(resRes.resources || []);
      if (taskRes.success) setCompletedTaskIds(taskRes.completions || []);
      if (dailyRes.success) {
        setDailyChecklist(dailyRes.checklist || []);
        setPerfectDayClaimed(dailyRes.perfectDayClaimed);
      }
      if (badgesRes && badgesRes.success) {
        const newBadges = badgesRes.unlockedBadges || [];
        setUnlockedBadges((prevBadges) => {
          if (prevBadges.length > 0) {
            const newlyUnlocked = newBadges.filter((b: string) => !prevBadges.includes(b));
            newlyUnlocked.forEach((bId: string) => {
              const badgeMeta = BADGES_METADATA.find(bm => bm.id === bId);
              if (badgeMeta) {
                showToast("success", `🎉 Badge Unlocked: ${badgeMeta.name}!`);
              }
            });
          }
          return newBadges;
        });
      }
    } catch (e) {
      console.error("Failed to load dashboard data:", e);
    }
  }, [registeredUser]);

  // Load LMS data
  useEffect(() => {
    if (!registeredUser) return;
    setLoading(true);
    loadLmsData().finally(() => setLoading(false));

    // Seed editable fields from localStorage first (instant, offline-friendly),
    // then reconcile with the persisted Supabase profile record.
    const seedBio = localStorage.getItem("profile_bio") || "Passionate computer science student learning Git!";
    const seedGithub = localStorage.getItem("profile_github") || registeredUser.githubUsername || "";
    const seedLinkedin = localStorage.getItem("profile_linkedin") || "";
    setProfileBio(seedBio);
    setProfileGithub(seedGithub);
    setProfileLinkedin(seedLinkedin);
    setInitialSnapshot(`${seedBio}|${seedGithub}|${seedLinkedin}`);

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
          const finalBio = res.profile.bio ?? seedBio;
          const finalGithub = res.profile.github_username ?? seedGithub;
          const finalLinkedin = res.profile.linkedin_url ?? seedLinkedin;
          setInitialSnapshot(`${finalBio}|${finalGithub}|${finalLinkedin}`);
        }
      })
      .catch((e) => console.error("Failed to load profile:", e));
  }, [registeredUser]);

  // Track unsaved changes so the user gets a clear "Discard" affordance.
  useEffect(() => {
    const current = `${profileBio}|${profileGithub}|${profileLinkedin}`;
    setIsDirty(current !== initialSnapshot || !!photoFile);
  }, [profileBio, profileGithub, profileLinkedin, photoFile, initialSnapshot]);

  // Trigger daily login reward
  useEffect(() => {
    if (registeredUser?.enrollmentNumber) {
      fetch("/api/daily-tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enrollment_number: registeredUser.enrollmentNumber,
          task_id: "daily_login"
        })
      })
      .then(res => res.json())
      .then(data => {
        if (data.success && !data.alreadyCompleted) {
          triggerFloatingXp(5, "Daily Login Bonus! 🎉");
          loadLmsData();
        }
      })
      .catch(err => console.error("Daily login reward fail:", err));
    }
  }, [registeredUser, triggerFloatingXp, loadLmsData]);

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
      github: validateGithub(profileGithub),
      linkedin: validateLinkedin(profileLinkedin),
    };
    setProfileErrors(errors);
    setProfileTouched({ github: true, linkedin: true, bio: true });
    return !errors.github && !errors.linkedin;
  };

  const handleCopyEnrollment = async () => {
    try {
      await navigator.clipboard.writeText(registeredUser.enrollmentNumber);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      /* ignore */
    }
  };

  const handleCompleteTask = async (taskId: string) => {
    if (!registeredUser) return;
    try {
      const res = await fetch("/api/tasks/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enrollmentNumber: registeredUser.enrollmentNumber,
          taskId,
          source: "dashboard-manual",
        }),
      });
      const data = await res.json();
      if (data.success && data.xpAwarded > 0) {
        setToast({ type: "success", message: data.message });
        loadLmsData();
      } else if (data.success && data.xpAwarded === 0) {
        setToast({ type: "info", message: data.message || "You have already completed this task today!" });
      } else {
        setToast({ type: "error", message: data.error || "Unable to complete this task." });
      }
    } catch (err) {
      console.error("Failed to complete task:", err);
      setToast({ type: "error", message: "Unable to complete this task right now." });
    }
  };


  const handleDiscard = () => {
    const parts = initialSnapshot.split("|");
    setProfileBio(parts[0]);
    setProfileGithub(parts[1]);
    setProfileLinkedin(parts[2]);
    setPhotoFile(null);
    setPhotoPreview(null);
    setUploadError("");
    setProfileErrors({});
    setProfileTouched({});
    showToast("success", "Changes discarded.");
  };

  // Cropper & Cache states
  const [photoTimestamp, setPhotoTimestamp] = useState<number>(Date.now());
  const [showCropper, setShowCropper] = useState<boolean>(false);
  const [cropperRawSrc, setCropperRawSrc] = useState<string>("");
  const [cropScale, setCropScale] = useState<number>(1);
  const [cropX, setCropX] = useState<number>(0);
  const [cropY, setCropY] = useState<number>(0);

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

    if (!runValidation()) {
      setSavingProfile(false);
      showToast("error", "Please fix the highlighted fields before saving.");
      return;
    }

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
        setPhotoTimestamp(Date.now());
      }
      if (photoPreview) {
        setPhotoPreview(null);
      }
      setPhotoFile(null);
      setInitialSnapshot(`${profileBio}|${profileGithub}|${profileLinkedin}`);
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

  const handleSubmitHomework = async (e: React.FormEvent) => {
    e.preventDefault();
    const currentAss = assignments.find(a => a.id === submittingAssignmentId);
    const reqs = currentAss?.submission_requirements || { live_url: true, github_link: true, attachment: false };
    
    if (reqs.github_link && !submissionRepo) {
      alert("GitHub Repository URL is required.");
      return;
    }
    if (reqs.live_url && !submissionLive) {
      alert("Live URL is required.");
      return;
    }
    if (reqs.attachment && !submissionAttachment) {
      alert("File Attachment is required.");
      return;
    }

    setSubmittingHomework(true);

    try {
      const response = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assignment_id: submittingAssignmentId,
          student_id: registeredUser.enrollmentNumber,
          repo_url: reqs.github_link ? submissionRepo : null,
          live_url: reqs.live_url ? submissionLive : null,
          attachment_url: reqs.attachment ? submissionAttachment : null,
        })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setSubmissions(prev => {
          const filtered = prev.filter(s => s.assignment_id !== submittingAssignmentId);
          return [...filtered, data.submission];
        });
        await loadLmsData();
        alert("Assignment submitted successfully!");
        setSubmissionRepo("");
        setSubmissionLive("");
        setSubmissionAttachment("");
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
    router.replace("/");
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
        await loadLmsData();
      } else {
        setCheckinError(data.error || "Check-in failed. Please try again.");
      }
    } catch (e) {
      setCheckinError("Network error. Please try again.");
    } finally {
      setCheckinLoading(false);
    }
  };

  const getDayStatus = (day: number, dateStr: string): keyof typeof STATUS_LABEL => {
    return getSharedDayStatus(day, dateStr, attendance.map((a: any) => Number(a.session_day)));
  };

  const leaderboardMap = new Map<string, any>();
  const myEnroll = (registeredUser?.enrollmentNumber || registeredUser?.enrollment_number || "").trim().toLowerCase();

  // First, seed the map with all peer registrations from DB
  peers.forEach((p: any) => {
    const enroll = (p.enrollmentNumber || p.enrollment_number || p.enroll_number || "").trim().toLowerCase();
    if (!enroll) return;
    const isYou = myEnroll && enroll === myEnroll;
    const userXp = Number(p.total_xp || p.totalXp || 0);

    if (!leaderboardMap.has(enroll)) {
      leaderboardMap.set(enroll, {
        name: p.name,
        branch: p.branch || p.yearOfStudy || "Student",
        xp: isYou ? xp : userXp, // always use live XP for current user
        you: isYou,
        enrollmentNumber: p.enrollmentNumber || p.enrollment_number || p.enroll_number,
        github: p.github_username || p.githubUsername || p.github || "",
        bio: p.profile_bio || p.profileBio || p.bio || "",
        attendanceCount: isYou ? attendance.length : (p.attendance_count || 0),
        streak: isYou ? attendance.length : (p.streak || 0),
      });
    }
  });

  // Always ensure the current logged-in user is in the leaderboard (handles case where peers hasn't loaded yet)
  if (myEnroll) {
    if (!leaderboardMap.has(myEnroll)) {
      leaderboardMap.set(myEnroll, {
        name: registeredUser.name,
        branch: registeredUser.branch || registeredUser.yearOfStudy || "Student",
        xp: xp,
        you: true,
        enrollmentNumber: registeredUser.enrollmentNumber || registeredUser.enrollment_number,
        github: profileGithub || "",
        bio: profileBio || "",
        attendanceCount: attendance.length,
        streak: attendance.length,
      });
    } else {
      const existing = leaderboardMap.get(myEnroll);
      leaderboardMap.set(myEnroll, { ...existing, xp, you: true, github: profileGithub || existing.github || "", bio: profileBio || existing.bio || "", attendanceCount: attendance.length, streak: attendance.length });
    }
  }

  const sortedList = Array.from(leaderboardMap.values()).sort((a, b) => {
    if (b.xp !== a.xp) return b.xp - a.xp;
    return (b.attendanceCount || 0) - (a.attendanceCount || 0);
  });

  // Force Pihu Kumari (AJU/250887 or 250887) to be exactly 3rd
  const pihuIndex = sortedList.findIndex(s => {
    const enroll = (s.enrollmentNumber || "").trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
    return enroll === "250887" || enroll === "AJU250887";
  });
  if (pihuIndex >= 0) {
    const [pihuRecord] = sortedList.splice(pihuIndex, 1);
    const targetXp = sortedList[1] ? sortedList[1].xp - 10 : 300;
    pihuRecord.xp = targetXp;
    sortedList.splice(2, 0, pihuRecord);
  }

  const leaderboard = sortedList;

  const notifications = [
    ...assignments.map((a: any) => ({
      id: `assignment-${a.id}`,
      title: "New Assignment",
      desc: a.title,
      date: new Date(a.created_at || a.due_date).getTime(),
      tab: "assignments",
      icon: "📝"
    })),
    ...resources.map((r: any) => ({
      id: `resource-${r.id}`,
      title: "New Resource Shared",
      desc: r.title,
      date: new Date(r.created_at || (Date.now() - 3600000 * 2)).getTime(),
      tab: "resources",
      icon: "📁"
    })),
    ...announcements.map((ann: any) => ({
      id: `announcement-${ann.id}`,
      title: "New Announcement",
      desc: ann.title,
      date: new Date(ann.created_at || ann.date || Date.now()).getTime(),
      tab: "home",
      icon: "📢"
    }))
  ].sort((a, b) => b.date - a.date);

  const unreadCount = notifications.filter(n => n.date > lastReadNotif).length;

  // Real activity feed derived from actual submissions + attendance (no fake commits).
  const activity = [
    ...submissions.map((s: any) => ({
      type: "submission",
      text: `Submitted Day ${s.assignment_id.replace("day-", "")} Assignment`,
      time: s.submitted_at,
      action: `git push origin main`,
      badge: "pushed",
      badgeType: "push"
    })),
    ...attendance.map((a: any) => ({
      type: "attendance",
      text: `Attendance Day ${a.session_day} Verified`,
      time: a.verified_at,
      action: `git commit -m "day-${a.session_day}-attendance"`,
      badge: `+day-${a.session_day}`,
      badgeType: "add"
    })),
  ].sort((a: any, b: any) => new Date(b.time).getTime() - new Date(a.time).getTime());

  return (
    <div className="dashboard-view">
      {/* Panel 1: Sidebar */}
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

        {/* Sidebar Profile Card */}
        {registeredUser && (
          <div className="db-sidebar-profile-card">
            <div className="db-sidebar-profile-avatar" style={{ border: "none", background: "none" }}>
              <StudentAvatar name={registeredUser.name} email={registeredUser.email} avatarUrl={profilePhoto} size={42} />
            </div>
            <div className="db-sidebar-profile-info">
              <div className="db-sidebar-profile-name">{registeredUser.name || "Student"}</div>
              <div className="db-sidebar-profile-role">{registeredUser.branch || "Student"} &middot; {registeredUser.enrollmentNumber || ""}</div>
            </div>
            <span className="db-sidebar-xp-badge">{xp} XP</span>
          </div>
        )}

        <nav className="db-menu">
          <div className={`db-menu-item ${currentTab === "home" ? "active" : ""}`} onClick={() => setCurrentTab("home")}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
            <span>Home</span>
          </div>
          <div className={`db-menu-item ${currentTab === "schedule" ? "active" : ""}`} onClick={() => setCurrentTab("schedule")}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            <span>Schedule</span>
          </div>
          <div className={`db-menu-item ${currentTab === "attendance" ? "active" : ""}`} onClick={() => setCurrentTab("attendance")}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
            <span>Attendance</span>
            {activeWindow && !alreadyCheckedIn && <span className="db-menu-badge-dot"></span>}
          </div>
          <div className={`db-menu-item ${currentTab === "resources" ? "active" : ""}`} onClick={() => setCurrentTab("resources")}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
            <span>Resources</span>
          </div>
          <div className={`db-menu-item ${currentTab === "assignments" ? "active" : ""}`} onClick={() => setCurrentTab("assignments")}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            <span>Assignments</span>
          </div>
          <div className={`db-menu-item ${currentTab === "leaderboard" ? "active" : ""}`} onClick={() => setCurrentTab("leaderboard")}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
            <span>Leaderboard</span>
          </div>
          <div className={`db-menu-item ${currentTab === "certification" ? "active" : ""}`} onClick={() => setCurrentTab("certification")}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>
            <span>Certification</span>
          </div>
          <div className={`db-menu-item ${currentTab === "polls" ? "active" : ""}`} onClick={() => setCurrentTab("polls")}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
            <span>Live Polls</span>
          </div>
          <div className={`db-menu-item ${currentTab === "profile" ? "active" : ""}`} onClick={() => setCurrentTab("profile")}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            <span>Profile</span>
          </div>
        </nav>

        <div className="db-sidebar-footer">
          <div className="db-sidebar-footer-quote">
            <span className="db-sidebar-footer-quote-icon">⚡</span>
            <p>Keep Building.<br/>Keep Pushing.<br/>Keep Learning.</p>
            <div className="db-sidebar-footer-level">
              Level {Math.floor(xp / 500) + 1} Builder &nbsp;&middot;&nbsp; {xp} XP
            </div>
          </div>
          <button onClick={handleLogout} className="db-sidebar-logout-btn" title="Logout" style={{ marginTop: 10, display: "flex", alignItems: "center", gap: "8px", justifyContent: "center", width: "100%", padding: "8px 12px" }}>
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            <span style={{ fontSize: "13px", fontWeight: "700" }}>Logout</span>
          </button>
        </div>
      </aside>

      {/* Panel 2: Main Content Area */}
      <main className="db-main-content">
        {/* Header Bar */}
        <header className="db-header">
          <div className="db-header-welcome">
            <StudentAvatar name={registeredUser.name} email={registeredUser.email} avatarUrl={profilePhoto} size={42} className="db-header-user-avatar" style={{ border: "none", background: "none" }} />
            <div className="db-header-greeting-block">
              <span className="db-header-greeting-time">{getTimeGreeting(nowTs)},</span>
              <h1 className="db-header-greeting-name">{registeredUser.name || "Student"} 👋</h1>
              <div className="db-header-greeting-meta">{registeredUser.branch || "Student"} &nbsp;&middot;&nbsp; Year {registeredUser.yearOfStudy || "1"} Student</div>
            </div>
          </div>

          <div className="db-header-widgets">
            <div className="db-header-search" id="db-search-bar" ref={searchRef} style={{ position: "relative" }}>
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input
                type="text"
                placeholder="Search anything..."
                className="db-header-search-input"
                id="db-search-input"
                value={searchQuery}
                autoComplete="off"
                onChange={(e) => { setSearchQuery(e.target.value); setShowSearchResults(true); }}
                onFocus={() => setShowSearchResults(true)}
              />
              {searchQuery ? (
                <button onClick={() => { setSearchQuery(""); setShowSearchResults(false); }} style={{ background: "none", border: "none", cursor: "pointer", padding: "0 4px", color: "var(--db-text-muted)", fontSize: "16px", lineHeight: 1 }}>✕</button>
              ) : (
                <span className="db-search-shortcut">Ctrl K</span>
              )}
              {showSearchResults && searchQuery && (
                <div style={{ position: "absolute", top: "calc(100% + 8px)", left: 0, right: 0, backgroundColor: "#fff", borderRadius: "12px", boxShadow: "0 8px 32px rgba(0,0,0,0.15)", border: "1px solid rgba(0,0,0,0.08)", zIndex: 9999, overflow: "hidden", minWidth: "320px" }}>
                  {searchResults.length === 0 ? (
                    <div style={{ padding: "16px", textAlign: "center", color: "var(--db-text-muted)", fontSize: "13px" }}>No results for "{searchQuery}"</div>
                  ) : (
                    <>
                      {searchResults.map((r, i) => (
                        <button
                          key={i}
                          onClick={() => { setCurrentTab(r.tab); setSearchQuery(""); setShowSearchResults(false); }}
                          style={{ display: "flex", alignItems: "center", gap: "12px", width: "100%", padding: "10px 16px", background: "none", border: "none", borderBottom: i < searchResults.length - 1 ? "1px solid rgba(0,0,0,0.05)" : "none", cursor: "pointer", textAlign: "left", transition: "background 0.15s" }}
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f9fafb")}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                        >
                          <span style={{ fontSize: "18px", width: "24px", textAlign: "center", flexShrink: 0 }}>{r.icon}</span>
                          <div style={{ flex: 1, overflow: "hidden" }}>
                            <div style={{ fontSize: "13px", fontWeight: "700", color: "var(--db-text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.label}</div>
                            <div style={{ fontSize: "11px", color: "var(--db-text-muted)", marginTop: "1px" }}>{r.sub}</div>
                          </div>
                          <span style={{ fontSize: "11px", color: "var(--db-text-muted)", backgroundColor: "#f3f4f6", borderRadius: "6px", padding: "2px 8px", flexShrink: 0, textTransform: "capitalize" }}>{r.tab}</span>
                        </button>
                      ))}
                      <div style={{ padding: "8px 16px", backgroundColor: "#f9fafb", fontSize: "11px", color: "var(--db-text-muted)", display: "flex", alignItems: "center", gap: "4px" }}>
                        <span>↵</span> to select · <span>Esc</span> to close
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
            
            <div style={{ position: "relative" }}>
              <button
                className="db-header-bell-btn"
                id="db-bell-btn"
                onClick={() => {
                  setShowNotifications(prev => !prev);
                  const now = Date.now();
                  setLastReadNotif(now);
                  localStorage.setItem("last_read_notif", String(now));
                }}
              >
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                {unreadCount > 0 && <span className="db-header-bell-dot"></span>}
              </button>

              {showNotifications && (
                <div
                  className="modern-card"
                  style={{
                    position: "absolute",
                    top: "50px",
                    right: "0",
                    width: "320px",
                    maxHeight: "400px",
                    overflowY: "auto",
                    zIndex: 1000,
                    padding: "16px",
                    display: "block",
                    backgroundColor: "#fff",
                    boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
                    border: "1px solid rgba(0,0,0,0.06)",
                    borderRadius: "14px",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(0,0,0,0.05)", paddingBottom: "10px", marginBottom: "10px" }}>
                    <span style={{ fontWeight: "800", fontSize: "12px", color: "var(--db-text-primary)", textTransform: "uppercase" }}>Notifications</span>
                    {unreadCount > 0 && (
                      <span style={{ fontSize: "11px", color: "var(--db-accent-green)", fontWeight: "750" }}>
                        {unreadCount} New
                      </span>
                    )}
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {notifications.length === 0 ? (
                      <div style={{ padding: "20px 10px", textAlign: "center", color: "var(--db-text-muted)", fontSize: "13px" }}>
                        No notifications yet.
                      </div>
                    ) : (
                      notifications.slice(0, 10).map((n) => {
                        const elapsedMs = Date.now() - n.date;
                        const elapsedMins = Math.max(1, Math.floor(elapsedMs / 60000));
                        const elapsedHrs = Math.floor(elapsedMins / 60);
                        const timeStr = elapsedHrs > 24 ? `${Math.floor(elapsedHrs / 24)}d ago` : elapsedHrs > 0 ? `${elapsedHrs}h ago` : `${elapsedMins}m ago`;

                        return (
                          <div
                            key={n.id}
                            onClick={() => {
                              setCurrentTab(n.tab);
                              setShowNotifications(false);
                            }}
                            style={{
                              display: "flex",
                              gap: "10px",
                              padding: "8px",
                              borderRadius: "8px",
                              cursor: "pointer",
                              transition: "background 0.2s",
                              borderBottom: "1px solid rgba(0,0,0,0.02)",
                            }}
                            className="notif-item-hover"
                          >
                            <div style={{ fontSize: "18px" }}>{n.icon}</div>
                            <div style={{ display: "flex", flexDirection: "column", flex: 1, minWidth: 0, textAlign: "left" }}>
                              <span style={{ fontSize: "12px", fontWeight: "800", color: "var(--db-text-primary)" }}>{n.title}</span>
                              <span style={{ fontSize: "11px", color: "var(--db-text-muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{n.desc}</span>
                              <span style={{ fontSize: "9px", color: "rgba(0,0,0,0.4)", marginTop: "2px" }}>{timeStr}</span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* TAB: HOME */}
        {currentTab === "home" && (() => {
          const reachedDays = SCHEDULE_DAYS.filter(sd => {
            const sdDate = new Date(`${sd.date}T00:00:00`);
            const today = new Date();
            today.setHours(0,0,0,0);
            return sdDate <= today;
          });
          const lastReachedDayNum = reachedDays.length > 0 ? Math.max(...reachedDays.map(d => d.day)) : 1;

          let cumulativeScore = 0;
          const chartPoints = SCHEDULE_DAYS.map((sd) => {
            const attended = attendance.some((a: any) => Number(a.session_day) === sd.day);
            const submitted = submissions.some((s: any) => s.assignment_id === `a${sd.day}`);
            
            let dayScore = 0;
            if (progressViewType === "combined") {
              if (attended) dayScore += 50;
              if (submitted) dayScore += 50;
            } else if (progressViewType === "attendance") {
              if (attended) dayScore += 100;
            } else if (progressViewType === "assignments") {
              if (submitted) dayScore += 100;
            }
            
            cumulativeScore += dayScore;
            return Math.min(100, Math.round((cumulativeScore / 700) * 100));
          });

          const completionPct = chartPoints[chartPoints.length - 1];
          const attendancePct = WORKSHOP_DAYS > 0 ? Math.round((attendance.length / WORKSHOP_DAYS) * 100) : 0;
          const myRecord = leaderboard.find(s => s.you);
          const rank = (myRecord && myRecord.xp > 0) ? String(leaderboard.findIndex(s => s.you) + 1) : "-";
          const attendanceStatusLabel = attendancePct >= 80 ? "Excellent" : attendancePct >= 50 ? "Good" : "Needs Work";
          const attendanceStatusClass = attendancePct >= 50 ? "green" : "attention";
          const donutStrokeColor = completionPct === 0 ? "#9CA3AF" : "var(--db-accent-yellow)";

          return (
            <>
              {/* ======= ROW 1: Workshop Progress + Upcoming Event ======= */}
              <div className="home-top-row">
                {/* Left side column: Progress Chart + Quick Actions below it */}
                <div style={{ display: "flex", flexDirection: "column", gap: "20px", flex: 1, minWidth: 0 }}>
                  {/* Progress Chart Card */}
                  <div className="progress-chart-card" style={{ minHeight: "245px" }}>
                    <div className="progress-chart-header" style={{ position: "relative" }}>
                      <span className="progress-chart-title">Workshop Progress</span>
                      <span
                        className="progress-chart-dropdown"
                        style={{ cursor: "pointer", position: "relative", userSelect: "none" }}
                        onClick={() => setShowProgressDropdown(!showProgressDropdown)}
                      >
                        {progressViewType === "combined" ? "Day-wise (All Days)" : progressViewType === "attendance" ? "Day-wise (Attendance)" : "Day-wise (Assignments)"}
                        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
                        
                        {showProgressDropdown && (
                          <div style={{
                            position: "absolute",
                            top: "24px",
                            right: 0,
                            backgroundColor: "#fff",
                            border: "1.5px solid rgba(0,0,0,0.06)",
                            borderRadius: "10px",
                            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                            padding: "6px 0",
                            zIndex: 10,
                            minWidth: "180px",
                            display: "flex",
                            flexDirection: "column"
                          }}>
                            <button
                              onClick={(e) => { e.stopPropagation(); setProgressViewType("combined"); setShowProgressDropdown(false); }}
                              style={{ padding: "8px 12px", border: "none", background: "none", textAlign: "left", fontSize: "11px", fontWeight: "750", cursor: "pointer", color: "var(--db-text-primary)" }}
                            >
                              Combined Progress
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); setProgressViewType("attendance"); setShowProgressDropdown(false); }}
                              style={{ padding: "8px 12px", border: "none", background: "none", textAlign: "left", fontSize: "11px", fontWeight: "750", cursor: "pointer", color: "var(--db-text-primary)" }}
                            >
                              Attendance Only
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); setProgressViewType("assignments"); setShowProgressDropdown(false); }}
                              style={{ padding: "8px 12px", border: "none", background: "none", textAlign: "left", fontSize: "11px", fontWeight: "750", cursor: "pointer", color: "var(--db-text-primary)" }}
                            >
                              Assignments Only
                            </button>
                          </div>
                        )}
                      </span>
                    </div>

                    <div className="progress-chart-body">
                      {/* Left: big number + label + trend */}
                      <div className="progress-chart-left">
                        <div className="progress-chart-big-number">{completionPct}%</div>
                        <div className="progress-chart-completed-label">Completed</div>
                        <div className="progress-chart-trend">
                          <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/></svg>
                          {attendance.length > 0 ? Math.round((attendance.length / WORKSHOP_DAYS) * 100) : 0}% attendance rate
                        </div>
                      </div>

                      {/* Right: area chart */}
                      <div className="progress-chart-area" style={{ position: "relative" }}>
                        {(() => {
                          const pts = chartPoints;
                          const W = 500;
                          const H = 320;
                          const pad = { top: 24, right: 12, bottom: 32, left: 36 };
                          const innerW = W - pad.left - pad.right;
                          const innerH = H - pad.top - pad.bottom;
                          const yLabels = [100, 75, 50, 25, 0];
                          const xLabels = SCHEDULE_DAYS.map((sd) => `Day ${sd.day}`);
                          const scaled = pts.map((v, i) => ({
                            x: pad.left + (i / Math.max(pts.length - 1, 1)) * innerW,
                            y: pad.top + (1 - v / 100) * innerH,
                          }));

                          const reachedPoints = scaled.slice(0, lastReachedDayNum);
                          const upcomingPoints = scaled.slice(lastReachedDayNum - 1);

                          const solidLinePath = reachedPoints.length > 0
                            ? reachedPoints.map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `C ${(reachedPoints[i-1].x + p.x)/2} ${reachedPoints[i-1].y}, ${(reachedPoints[i-1].x + p.x)/2} ${p.y}, ${p.x} ${p.y}`)).join(" ")
                            : "";

                          const dashedLinePath = upcomingPoints.length > 1
                            ? upcomingPoints.map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `C ${(upcomingPoints[i-1].x + p.x)/2} ${upcomingPoints[i-1].y}, ${(upcomingPoints[i-1].x + p.x)/2} ${p.y}, ${p.x} ${p.y}`)).join(" ")
                            : "";

                          const solidAreaPath = reachedPoints.length > 0
                            ? `${solidLinePath} L ${reachedPoints[reachedPoints.length-1].x} ${pad.top + innerH} L ${pad.left} ${pad.top + innerH} Z`
                            : "";

                          return (
                            <>
                              <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet">
                                <defs>
                                  <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#FFD446" stopOpacity="0.35"/>
                                    <stop offset="100%" stopColor="#FFD446" stopOpacity="0.02"/>
                                  </linearGradient>
                                </defs>
                                {/* Y grid lines + labels */}
                                {yLabels.map((label) => {
                                  const y = pad.top + (1 - label / 100) * innerH;
                                  return (
                                    <g key={label}>
                                      <line x1={pad.left} y1={y} x2={W - pad.right} y2={y} stroke="rgba(0,0,0,0.11)" strokeWidth="1"/>
                                      <text x={pad.left - 8} y={y + 4} textAnchor="end" fontSize="11" fill="rgba(0,0,0,0.55)" fontWeight="600">{label}%</text>
                                    </g>
                                  );
                                })}
                                {/* X labels */}
                                {xLabels.map((label, i) => {
                                  const x = pad.left + (i / (xLabels.length - 1)) * innerW;
                                  return (
                                    <text key={label} x={x} y={H - 6} textAnchor="middle" fontSize="11" fill="rgba(0,0,0,0.55)" fontWeight="600">{label}</text>
                                  );
                                })}
                                {/* Area fill */}
                                {solidAreaPath && <path d={solidAreaPath} fill="url(#areaGrad)"/>}
                                {/* Solid Line (Reached) */}
                                {solidLinePath && (
                                  <>
                                    <path d={solidLinePath} fill="none" stroke="#FFD446" strokeWidth="7" strokeOpacity="0.22" strokeLinecap="round" strokeLinejoin="round"/>
                                    <path d={solidLinePath} fill="none" stroke="#FFD446" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"/>
                                  </>
                                )}
                                {/* Dashed Line (Upcoming) */}
                                {dashedLinePath && (
                                  <>
                                    <path d={dashedLinePath} fill="none" stroke="#FFD446" strokeWidth="3.5" strokeDasharray="5,5" strokeOpacity="0.6" strokeLinecap="round" strokeLinejoin="round"/>
                                  </>
                                )}
                                {/* Dots */}
                                {scaled.map((p, i) => {
                                  const isUpcoming = i >= lastReachedDayNum;
                                  const sd = SCHEDULE_DAYS[i];
                                  const attended = attendance.some((a: any) => Number(a.session_day) === sd.day);
                                  const submitted = submissions.some((s: any) => s.assignment_id === `a${sd.day}`);

                                  return (
                                    <circle
                                      key={i}
                                      cx={p.x}
                                      cy={p.y}
                                      r={hoveredChartPoint?.day === sd.day ? "7" : "5"}
                                      fill={isUpcoming ? "#fff" : "#FFD446"}
                                      stroke="#FFD446"
                                      strokeWidth="2.5"
                                      style={{ cursor: "pointer", transition: "all 0.15s" }}
                                      onMouseEnter={() => setHoveredChartPoint({
                                        x: p.x,
                                        y: p.y,
                                        day: sd.day,
                                        title: sd.title,
                                        val: pts[i],
                                        attended,
                                        submitted
                                      })}
                                      onMouseLeave={() => setHoveredChartPoint(null)}
                                    />
                                  );
                                })}
                              </svg>

                              {hoveredChartPoint && (
                                <div style={{
                                  position: "absolute",
                                  left: `${(hoveredChartPoint.x / W) * 100}%`,
                                  top: `${(hoveredChartPoint.y / H) * 100 - 15}%`,
                                  transform: "translate(-50%, -100%)",
                                  backgroundColor: "rgba(15, 23, 42, 0.95)",
                                  backdropFilter: "blur(6px)",
                                  border: "1.5px solid rgba(255, 212, 70, 0.4)",
                                  borderRadius: "10px",
                                  padding: "10px 14px",
                                  color: "#fff",
                                  fontSize: "11px",
                                  zIndex: 100,
                                  whiteSpace: "nowrap",
                                  boxShadow: "0 6px 20px rgba(0,0,0,0.25)",
                                  pointerEvents: "none",
                                  display: "flex",
                                  flexDirection: "column",
                                  gap: "3px",
                                  textAlign: "left"
                                }}>
                                  <div style={{ fontWeight: "900", color: "#FFD446" }}>Day {hoveredChartPoint.day}</div>
                                  <div style={{ fontSize: "10px", opacity: 0.85, marginBottom: "3px", maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis" }}>{hoveredChartPoint.title}</div>
                                  <div>Progress: <strong style={{ color: "#FFD446" }}>{hoveredChartPoint.val}%</strong></div>
                                  <div>Attendance: <strong>{hoveredChartPoint.attended ? "✓ Attended" : "✕ Absent"}</strong></div>
                                  <div>Assignment: <strong>{hoveredChartPoint.submitted ? "✓ Submitted" : "✕ Missing"}</strong></div>
                                </div>
                              )}
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  </div>

                  {/* Quick Actions Card (Horizontal & Larger) */}
                  <div className="quick-actions-card" style={{ minHeight: "155px", padding: "24px 28px" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "24px", width: "100%", flexWrap: "wrap" }}>
                      <div style={{ minWidth: "160px" }}>
                        <h3 className="progress-chart-title" style={{ marginBottom: "4px", fontSize: "14px", fontWeight: "800" }}>Quick Actions</h3>
                        <p style={{ fontSize: "11px", color: "var(--db-text-muted)", margin: 0, lineHeight: "1.4" }}>Shortcuts &amp; portals</p>
                      </div>
                      
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "12px", flex: 1 }}>
                        <button onClick={() => setCurrentTab("profile")} style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                          background: "rgba(0, 0, 0, 0.03)",
                          border: "1px solid rgba(0, 0, 0, 0.06)",
                          borderRadius: "12px",
                          padding: "10px 14px",
                          color: "var(--db-text-primary)",
                          cursor: "pointer",
                          transition: "all 0.2s",
                          textAlign: "left"
                        }} className="quick-action-btn">
                          <span style={{ fontSize: "18px" }}>👤</span>
                          <div style={{ display: "flex", flexDirection: "column" }}>
                            <span style={{ fontWeight: "750", fontSize: "12px" }}>My Profile</span>
                            <span style={{ fontSize: "9px", color: "var(--db-text-muted)" }}>Edit details</span>
                          </div>
                        </button>

                        <button onClick={() => setCurrentTab("schedule")} style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                          background: "rgba(0, 0, 0, 0.03)",
                          border: "1px solid rgba(0, 0, 0, 0.06)",
                          borderRadius: "12px",
                          padding: "10px 14px",
                          color: "var(--db-text-primary)",
                          cursor: "pointer",
                          transition: "all 0.2s",
                          textAlign: "left"
                        }} className="quick-action-btn">
                          <span style={{ fontSize: "18px" }}>📅</span>
                          <div style={{ display: "flex", flexDirection: "column" }}>
                            <span style={{ fontWeight: "750", fontSize: "12px" }}>Schedule</span>
                            <span style={{ fontSize: "9px", color: "var(--db-text-muted)" }}>Timeline</span>
                          </div>
                        </button>

                        <button onClick={() => setCurrentTab("resources")} style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                          background: "rgba(0, 0, 0, 0.03)",
                          border: "1px solid rgba(0, 0, 0, 0.06)",
                          borderRadius: "12px",
                          padding: "10px 14px",
                          color: "var(--db-text-primary)",
                          cursor: "pointer",
                          transition: "all 0.2s",
                          textAlign: "left"
                        }} className="quick-action-btn">
                          <span style={{ fontSize: "18px" }}>📁</span>
                          <div style={{ display: "flex", flexDirection: "column" }}>
                            <span style={{ fontWeight: "750", fontSize: "12px" }}>Resources</span>
                            <span style={{ fontSize: "9px", color: "var(--db-text-muted)" }}>Get files</span>
                          </div>
                        </button>

                        <button onClick={() => setCurrentTab("assignments")} style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                          background: "rgba(0, 0, 0, 0.03)",
                          border: "1px solid rgba(0, 0, 0, 0.06)",
                          borderRadius: "12px",
                          padding: "10px 14px",
                          color: "var(--db-text-primary)",
                          cursor: "pointer",
                          transition: "all 0.2s",
                          textAlign: "left"
                        }} className="quick-action-btn">
                          <span style={{ fontSize: "18px" }}>📝</span>
                          <div style={{ display: "flex", flexDirection: "column" }}>
                            <span style={{ fontWeight: "750", fontSize: "12px" }}>Assignments</span>
                            <span style={{ fontSize: "9px", color: "var(--db-text-muted)" }}>Homework</span>
                          </div>
                        </button>

                        <button onClick={() => setCurrentTab("attendance")} style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                          background: "rgba(255, 212, 70, 0.1)",
                          border: "1px solid rgba(255, 212, 70, 0.3)",
                          borderRadius: "12px",
                          padding: "10px 14px",
                          color: "var(--db-text-primary)",
                          cursor: "pointer",
                          transition: "all 0.2s",
                          textAlign: "left"
                        }} className="quick-action-btn">
                          <span style={{ fontSize: "18px" }}>⏱️</span>
                          <div style={{ display: "flex", flexDirection: "column" }}>
                            <span style={{ fontWeight: "750", fontSize: "12px" }}>Check In</span>
                            <span style={{ fontSize: "9px", color: "var(--db-text-muted)" }}>Attendance</span>
                          </div>
                        </button>

                        <button onClick={() => setCurrentTab("leaderboard")} style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                          background: "rgba(0, 0, 0, 0.03)",
                          border: "1px solid rgba(0, 0, 0, 0.06)",
                          borderRadius: "12px",
                          padding: "10px 14px",
                          color: "var(--db-text-primary)",
                          cursor: "pointer",
                          transition: "all 0.2s",
                          textAlign: "left"
                        }} className="quick-action-btn">
                          <span style={{ fontSize: "18px" }}>🏆</span>
                          <div style={{ display: "flex", flexDirection: "column" }}>
                            <span style={{ fontWeight: "750", fontSize: "12px" }}>Leaderboard</span>
                            <span style={{ fontSize: "9px", color: "var(--db-text-muted)" }}>Standings</span>
                          </div>
                        </button>

                        <a href="https://discord.com/events/1526478795857592401/1526481750807674881" target="_blank" rel="noopener noreferrer" style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                          background: "rgba(88, 101, 242, 0.1)",
                          border: "1px solid rgba(88, 101, 242, 0.2)",
                          borderRadius: "12px",
                          padding: "10px 14px",
                          color: "#5865F2",
                          cursor: "pointer",
                          transition: "all 0.2s",
                          textAlign: "left",
                          textDecoration: "none"
                        }} className="quick-action-btn">
                          <span style={{ fontSize: "18px" }}>💬</span>
                          <div style={{ display: "flex", flexDirection: "column" }}>
                            <span style={{ fontWeight: "750", fontSize: "12px" }}>Discord</span>
                            <span style={{ fontSize: "9px", color: "rgba(88, 101, 242, 0.7)" }}>Community</span>
                          </div>
                        </a>

                        <button onClick={() => setShowFeedbackModal(true)} style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                          background: "rgba(255, 70, 70, 0.08)",
                          border: "1px solid rgba(255, 70, 70, 0.2)",
                          borderRadius: "12px",
                          padding: "10px 14px",
                          color: "#ef4444",
                          cursor: "pointer",
                          transition: "all 0.2s",
                          textAlign: "left"
                        }} className="quick-action-btn">
                          <span style={{ fontSize: "18px" }}>⭐</span>
                          <div style={{ display: "flex", flexDirection: "column" }}>
                            <span style={{ fontWeight: "750", fontSize: "12px" }}>Feedback</span>
                            <span style={{ fontSize: "9px", color: "var(--db-text-muted)" }}>Rate us</span>
                          </div>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                  {/* Right: Upcoming Workshop */}
                  {(() => {
                    const now = new Date(nowTs);
                    // Find the first session that has not ended yet
                    let targetDay = SCHEDULE_DAYS.find(sd => {
                      const endTime = sd.day >= 3 ? "20:30:00" : "13:30:00";
                      const sessionEnd = new Date(`${sd.date}T${endTime}`).getTime();
                      return nowTs <= sessionEnd;
                    });
                    if (!targetDay) {
                      targetDay = SCHEDULE_DAYS[SCHEDULE_DAYS.length - 1]; // Fallback to last day
                    }

                    const startTime = targetDay.day >= 3 ? "19:30:00" : "12:30:00";
                    const targetTime = new Date(`${targetDay.date}T${startTime}`).getTime();
                    const endTime = targetDay.day >= 3 ? "20:30:00" : "13:30:00";
                    const sessionEnd = new Date(`${targetDay.date}T${endTime}`).getTime();

                    const diffMs = targetTime - nowTs;
                    let hours = 0;
                    let mins = 0;
                    let secs = 0;
                    if (diffMs > 0) {
                      hours = Math.floor(diffMs / (1000 * 60 * 60));
                      mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
                      secs = Math.floor((diffMs % (1000 * 60)) / 1000);
                    }
                    const padZero = (n: number) => String(n).padStart(2, "0");
                    const formatDate = (dateStr: string) => {
                      const d = new Date(`${dateStr}T00:00:00`);
                      const options: Intl.DateTimeFormatOptions = { day: "numeric", month: "long", year: "numeric" };
                      return d.toLocaleDateString("en-GB", options);
                    };

                    const isToday = now.toDateString() === new Date(targetDay.date).toDateString();
                    const isLive = isToday && nowTs >= targetTime && nowTs <= sessionEnd;

                    return (
                      <div className="event-card">
                        <div>
                          <span className="event-card-badge" style={{ color: "#16a34a", fontWeight: 800, background: "rgba(34, 197, 94, 0.1)", border: "1px solid rgba(34, 197, 94, 0.2)", padding: "4px 10px", borderRadius: "20px" }}>UPCOMING SESSION</span>
                          <h3 className="event-card-title" style={{ margin: "8px 0 2px 0" }}>Git &amp; GitHub Masterclass</h3>
                          <span style={{ fontSize: "12px", fontWeight: "750", color: "var(--db-text-muted)" }}>Day {targetDay.day}</span>
                        </div>

                        <div className="event-card-details" style={{ margin: "10px 0" }}>
                          <div className="event-card-detail">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                            <span>{formatDate(targetDay.date)}</span>
                          </div>
                          <div className="event-card-detail">
                            <span style={{ fontSize: "14px", marginRight: "4px" }}>🕢</span>
                            <span>{targetDay.time}</span>
                          </div>
                          <div className="event-card-detail">
                            <span style={{ fontSize: "14px", marginRight: "4px" }}>📍</span>
                            <span>Online via Google Meet</span>
                          </div>
                        </div>

                        {/* Countdown timer to fill height cleanly */}
                        {diffMs > 0 ? (
                          <div className="event-countdown-wrapper" style={{
                            background: "rgba(255, 255, 255, 0.45)",
                            border: "1px solid rgba(255, 255, 255, 0.6)",
                            borderRadius: "16px",
                            padding: "14px 18px",
                            display: "flex",
                            flexDirection: "column",
                            gap: "8px",
                            marginTop: "4px",
                            marginBottom: "4px"
                          }}>
                            <span style={{ fontSize: "10px", fontWeight: "800", color: "var(--db-text-muted)", letterSpacing: "1px", textTransform: "uppercase" }}>STARTS IN</span>
                            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                              <div style={{ textAlign: "center" }}>
                                <div style={{ background: "rgba(0,0,0,0.05)", border: "1px solid rgba(0,0,0,0.08)", borderRadius: "8px", padding: "6px 12px", fontSize: "20px", fontWeight: "900", color: "var(--db-text-primary)", minWidth: "28px", lineHeight: 1 }}>
                                  {padZero(hours)}
                                </div>
                                <div style={{ fontSize: "9px", fontWeight: "700", color: "var(--db-text-muted)", marginTop: "4px", textTransform: "uppercase" }}>Hours</div>
                              </div>
                              <span style={{ color: "rgba(0,0,0,0.2)", fontWeight: "900", fontSize: "18px", marginTop: "-14px" }}>:</span>
                              <div style={{ textAlign: "center" }}>
                                <div style={{ background: "rgba(0,0,0,0.05)", border: "1px solid rgba(0,0,0,0.08)", borderRadius: "8px", padding: "6px 12px", fontSize: "20px", fontWeight: "900", color: "var(--db-text-primary)", minWidth: "28px", lineHeight: 1 }}>
                                  {padZero(mins)}
                                </div>
                                <div style={{ fontSize: "9px", fontWeight: "700", color: "var(--db-text-muted)", marginTop: "4px", textTransform: "uppercase" }}>Min</div>
                              </div>
                              <span style={{ color: "rgba(0,0,0,0.2)", fontWeight: "900", fontSize: "18px", marginTop: "-14px" }}>:</span>
                              <div style={{ textAlign: "center" }}>
                                <div style={{ background: "rgba(0,0,0,0.05)", border: "1px solid rgba(0,0,0,0.08)", borderRadius: "8px", padding: "6px 12px", fontSize: "20px", fontWeight: "900", color: "var(--db-text-primary)", minWidth: "28px", lineHeight: 1 }}>
                                  {padZero(secs)}
                                </div>
                                <div style={{ fontSize: "9px", fontWeight: "700", color: "var(--db-text-muted)", marginTop: "4px", textTransform: "uppercase" }}>Sec</div>
                              </div>
                            </div>
                          </div>
                        ) : null}

                        <div className="event-meta-row" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", flexWrap: "wrap", marginBottom: "4px", marginTop: "4px" }}>
                          <span style={{
                            display: "inline-block",
                            fontSize: "11px",
                            fontWeight: "750",
                            background: "rgba(107, 114, 128, 0.1)",
                            color: "#4b5563",
                            border: "1px solid rgba(107, 114, 128, 0.2)",
                            padding: "4px 12px",
                            borderRadius: "20px"
                          }}>🚫 Registrations Closed</span>
                          <span style={{
                            display: "inline-block",
                            fontSize: "11px",
                            fontWeight: "750",
                            background: "rgba(34, 197, 94, 0.1)",
                            color: "#16a34a",
                            border: "1px solid rgba(34, 197, 94, 0.2)",
                            padding: "4px 12px",
                            borderRadius: "20px"
                          }}>🟢 Online Live Session</span>
                        </div>

                        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", marginBottom: "8px", fontSize: "13px", fontWeight: 700 }}>
                          <span style={{ color: "var(--db-text-muted)" }}>Status:</span>
                          {isLive ? (
                            <span style={{ color: "#22c55e", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                              <span className="live-dot-pulse"></span>
                              🟢 LIVE TODAY
                            </span>
                          ) : (
                            <span style={{ color: "#eab308" }}>🟡 Upcoming Session</span>
                          )}
                        </div>

                        <a
                          href="https://meet.google.com/byu-nubj-gfy"
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`event-card-btn ${isLive ? "live-glow-button" : ""}`}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "8px",
                            textDecoration: "none",
                            width: "100%",
                            boxSizing: "border-box"
                          }}
                        >
                          <span>🎥 Join Google Meet</span>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: "16px", height: "16px" }}><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                        </a>
                      </div>
                    );
                  })()}
              </div>

              {/* ======= ROW 2: 4 Stat Cards ======= */}
              <div className="stats-grid">
                <div className="stat-card blue">
                  <div className="stat-card-icon-wrapper">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                  </div>
                  <div className="stat-card-text">
                    <span className="stat-card-label">Sessions Completed</span>
                    <h3 className="stat-card-value">{attendance.length}</h3>
                    <span className="stat-card-subtext">of {WORKSHOP_DAYS}</span>
                    <div className="stat-progress-bar-bg">
                      <div className="stat-progress-bar-fill" style={{ width: `${Math.round((attendance.length / WORKSHOP_DAYS) * 100)}%` }}/>
                    </div>
                  </div>
                </div>

                <div className="stat-card green">
                  <div className="stat-card-icon-wrapper">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                  </div>
                  <div className="stat-card-text">
                    <span className="stat-card-label">Attendance</span>
                    <h3 className="stat-card-value">{attendancePct}%</h3>
                    <span className={`stat-card-subtext ${attendanceStatusClass}`}>{attendanceStatusLabel}</span>
                    <div className="stat-progress-bar-bg">
                      <div className="stat-progress-bar-fill" style={{ width: `${attendancePct}%` }}/>
                    </div>
                  </div>
                </div>

                <div className="stat-card orange">
                  <div className="stat-card-icon-wrapper">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
                  </div>
                  <div className="stat-card-text">
                    <span className="stat-card-label">Resources Accessed</span>
                    <h3 className="stat-card-value">{activity.filter((a: any) => a.type === "submission").length + attendance.length}</h3>
                    <span className="stat-card-subtext">of {WORKSHOP_DAYS * 2}</span>
                    <div className="stat-progress-bar-bg">
                      <div className="stat-progress-bar-fill" style={{ width: `${Math.min(100, Math.round(((activity.filter((a: any) => a.type === "submission").length + attendance.length) / (WORKSHOP_DAYS * 2)) * 100))}%` }}/>
                    </div>
                  </div>
                </div>

                <div className="stat-card purple">
                  <div className="stat-card-icon-wrapper">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                  </div>
                  <div className="stat-card-text">
                    <span className="stat-card-label">Assignments Done</span>
                    <h3 className="stat-card-value">{submissions.length}</h3>
                    <span className="stat-card-subtext">of {WORKSHOP_DAYS}</span>
                    <div className="stat-progress-bar-bg">
                      <div className="stat-progress-bar-fill" style={{ width: `${Math.round((submissions.length / WORKSHOP_DAYS) * 100)}%` }}/>
                    </div>
                  </div>
                </div>
              </div>

              {/* ======= ROW 3: Tasks | Progress Ring | Streak + Rank ======= */}
              <div className="bottom-grid">
                {/* Col 1: Today's Tasks (Gamified Quests) */}
                <div className="tasks-card">
                  <div className="tasks-card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                    <div>
                      <h4 className="tasks-card-title" style={{ margin: 0 }}>Daily Quests</h4>
                      {perfectDayClaimed ? (
                        <p style={{ fontSize: "10px", color: "var(--db-accent-green)", margin: "2px 0 0 0", fontWeight: "800" }}>🏆 +50 XP Perfect Day Bonus Claimed!</p>
                      ) : (
                        <p style={{ fontSize: "10px", color: "var(--db-text-muted)", margin: "2px 0 0 0" }}>Complete all to earn +50 XP Perfect Day Bonus!</p>
                      )}
                    </div>
                    <span className="tasks-card-badge" style={{ backgroundColor: "var(--db-accent-yellow)", color: "#000", fontWeight: "800" }}>
                      {dailyChecklist.filter(q => q.completed).length}/{dailyChecklist.length || 6} Done
                    </span>
                  </div>

                  {(dailyChecklist.length > 0 ? dailyChecklist : [
                    { id: "daily_login", title: "Daily Login", xp: 5, completed: true },
                    { id: "mark_attendance", title: "Mark Attendance", xp: 20, completed: attendance.length > 0 },
                    { id: "download_resources", title: "Download Today's Resources", xp: 10, completed: false },
                    { id: "open_notes", title: "Open Today's Notes", xp: 5, completed: false },
                    { id: "submit_github_repo", title: "Submit Today's GitHub Repository", xp: 30, completed: false },
                    { id: "complete_assignment", title: "Complete Today's Assignment", xp: 50, completed: submissions.length > 0 },
                  ]).map((quest) => {
                    const handleQuestClick = async () => {
                      if (quest.completed) return;

                      // Navigation routes
                      if (quest.id === "mark_attendance") {
                        setCurrentTab("attendance");
                        return;
                      }
                      if (quest.id === "complete_assignment") {
                        setCurrentTab("assignments");
                        return;
                      }
                      if (quest.id === "submit_github_repo") {
                        setCurrentTab("profile");
                        return;
                      }

                      // Instant actions (download, notes)
                      try {
                        const res = await fetch("/api/daily-tasks", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            enrollment_number: registeredUser.enrollmentNumber,
                            task_id: quest.id
                          })
                        });
                        const data = await res.json();
                        if (data.success) {
                          triggerFloatingXp(quest.xp, quest.title);
                          if (data.perfectDayBonus > 0) {
                            setTimeout(() => {
                              triggerFloatingXp(50, "Perfect Day Bonus! 🏆");
                            }, 800);
                          }
                          loadLmsData();

                          if (quest.id === "download_resources") {
                            // Trigger actual download mockup or file page
                            setCurrentTab("resources");
                          }
                          if (quest.id === "open_notes") {
                            setCurrentTab("resources");
                          }
                        }
                      } catch (err) {
                        console.error("Failed to complete daily quest:", err);
                      }
                    };

                    return (
                      <div
                        className={`daily-quest-item${quest.completed ? " completed" : ""}`}
                        key={quest.id}
                        onClick={handleQuestClick}
                        style={{ cursor: quest.completed ? "default" : "pointer" }}
                      >
                        <div className="quest-chk" />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <span className="quest-label">{quest.title}</span>
                          <div style={{ fontSize: "10px", color: "var(--db-text-muted)" }}>
                            {quest.id === "daily_login" && "Reward for showing up today!"}
                            {quest.id === "mark_attendance" && "Check in during your active session"}
                            {quest.id === "download_resources" && "Click to download presentation slides"}
                            {quest.id === "open_notes" && "Read workshop notes for today"}
                            {quest.id === "submit_github_repo" && "Add GitHub link in profile"}
                            {quest.id === "complete_assignment" && "Submit homework task"}
                          </div>
                        </div>
                        <div style={{
                          fontSize: "11px",
                          fontWeight: "800",
                          color: quest.completed ? "var(--db-text-muted)" : "var(--db-accent-green)",
                          backgroundColor: quest.completed ? "rgba(0,0,0,0.04)" : "rgba(16,185,129,0.1)",
                          padding: "3px 10px",
                          borderRadius: "20px",
                          marginLeft: "12px",
                          flexShrink: 0
                        }}>
                          +{quest.xp} XP
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Col 2: Your Progress (Donut Ring) */}
                <div className="progress-donut-card">
                  <h4 className="progress-donut-title">Your Progress</h4>
                  <div className="progress-donut-wrapper">
                    <svg viewBox="0 0 160 160">
                      <circle cx="80" cy="80" r="65" fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth="14"/>
                      <circle cx="80" cy="80" r="65" fill="none" stroke={donutStrokeColor} strokeWidth="14"
                        strokeDasharray={`${(completionPct / 100) * 2 * Math.PI * 65} ${2 * Math.PI * 65}`}
                        strokeLinecap="round"
                        style={{ transition: "stroke-dasharray 1s cubic-bezier(0.22,1,0.36,1)" }}
                      />
                    </svg>
                    <div className="progress-donut-text">
                      <span className="progress-donut-percent">{completionPct}%</span>
                      <span className="progress-donut-label">Completed</span>
                    </div>
                  </div>
                  <p className="progress-donut-message">
                    {completionPct >= 70 ? "Great job! Keep it up." : completionPct >= 30 ? "Good progress so far!" : "Start attending sessions to track progress."}
                  </p>
                  <button className="progress-donut-btn" onClick={() => setCurrentTab("resources")}>
                    <span>Continue Learning</span>
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                  </button>
                </div>

                {/* Col 3: Streak + Rank stacked */}
                <div className="bottom-grid-column">
                  {/* Attendance Streak */}
                  <div className="streak-card">
                    <div className="streak-icon">🔥</div>
                    <div className="streak-info">
                      <span className="streak-label">Attendance Streak</span>
                      <div className="streak-value">{streak}</div>
                      <span className="streak-sub">Days in a row</span>
                      <div className="streak-days">
                        {["M","T","W","T","F","S","S"].map((d, i) => {
                          const dn = i + 1;
                          const att = attendance.some((a: any) => Number(a.session_day) === dn);
                          const isToday = dn === attendance.length + 1;
                          return (
                            <div key={i} className={`streak-day ${att ? "done" : isToday ? "today" : "missed"}`}>
                              {att ? "✓" : d}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Your Rank */}
                  <div className="rank-card">
                    <div className="rank-icon">🏆</div>
                    <div className="rank-info">
                      <span className="rank-label">Your Rank</span>
                      <div className="rank-value">{rank === "-" ? "-" : `#${rank}`}</div>
                      {rank !== "-" ? (
                        <div className="rank-top-badge">Top {Math.ceil((Number(rank) / Math.max(peers.length, 1)) * 100)}%</div>
                      ) : (
                        <div className="rank-top-badge" style={{ background: "rgba(0,0,0,0.06)", color: "var(--db-text-muted)" }}>Not Ranked</div>
                      )}
                      <span className="rank-sub">of {Math.max(peers.length, 1)} participants</span>
                      <span className="rank-link" onClick={() => setCurrentTab("leaderboard")}>
                        View Leaderboard →
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* ======= ROW 4: Workshop Journey Timeline ======= */}
              <div className="workshop-journey-card">
                <div className="journey-card-header">
                  <span className="journey-card-label">Workshop Journey</span>
                  <span className="journey-card-day-badge">Day {lastReachedDayNum} of {WORKSHOP_DAYS}</span>
                </div>
                <div className="journey-timeline-row">
                  {SCHEDULE_DAYS.map((sd, idx) => {
                    const isCompleted = attendance.some((a: any) => Number(a.session_day) === sd.day);
                    const isToday = sd.day === lastReachedDayNum;
                    const status = isCompleted ? "completed" : isToday ? "today" : sd.day < lastReachedDayNum ? "locked" : "upcoming";
                    const isLast = idx === SCHEDULE_DAYS.length - 1;
                    const prevCompleted = idx > 0 && attendance.some((a: any) => Number(a.session_day) === SCHEDULE_DAYS[idx - 1].day);
                    return (
                      <Fragment key={sd.day}>
                        {idx > 0 && (
                          <div className={`journey-connector${prevCompleted ? " completed" : ""}`}/>
                        )}
                        <div className="journey-step">
                          <div className={`journey-dot ${status}`}>
                            {isCompleted ? "✓" : isToday ? `${sd.day}` : `${sd.day}`}
                          </div>
                          <span className={`journey-day-label${isToday ? " today-label" : ""}`}>Day {sd.day}</span>
                          <span className="journey-day-sublabel">
                            {isCompleted ? "Completed" : isToday ? "● Today" : sd.day < lastReachedDayNum ? "Closed" : "Upcoming"}
                          </span>
                        </div>
                      </Fragment>
                    );
                  })}
                  {/* Certificate */}
                  <div className="journey-connector"/>
                  <div className="journey-step">
                    <div className="journey-dot locked">🔒</div>
                    <span className="journey-day-label">Certificate</span>
                    <span className="journey-day-sublabel">Locked</span>
                  </div>
                </div>
              </div>
            </>
          );
        })()}

        {/* TAB: SCHEDULE */}
        {currentTab === "schedule" && (
          <div className="db-projects-section animate-in fade-in duration-300">
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

                    <Link
                      href={`/dashboard/schedule/day-${session.day}`}
                      className="modern-card schedule-card-body"
                      style={{ padding: "20px 24px", minHeight: "auto", display: "block", textDecoration: "none" }}
                    >
                      <div className="schedule-card-head">
                        <span className="schedule-day-label" style={{ fontWeight: "900", color: "var(--text-secondary)" }}>
                          {session.day === 1 ? "Day 1 — GETTING STARTED" : session.day === 2 ? "Day 2 — GETTING FAMILIAR TO GITHUB" : `Day ${session.day}`}
                        </span>
                        <span className={`schedule-tag schedule-tag--${status.toLowerCase()}`}>
                          {status === "COMPLETED" && (
                            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          )}
                          {STATUS_LABEL[status]}
                        </span>
                      </div>
                      <h4 className="schedule-title" style={{ fontSize: "20px", fontWeight: "900" }}>{session.title}</h4>
                      <p className="schedule-desc">{session.desc}</p>
                      <div className="schedule-meta">
                        <span className="schedule-chip">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                            <circle cx="12" cy="10" r="3" />
                          </svg>
                          {session.venue || SCHEDULE_VENUE}
                        </span>
                        <span className="schedule-chip schedule-chip--time">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10" />
                            <path d="M12 6v6l4 2" />
                          </svg>
                          {session.time}
                        </span>
                      </div>
                    </Link>
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
            <div className="db-projects-section animate-in fade-in duration-300">
              <h3 className="db-section-title">Attendance Space</h3>

              {/* Check-in status card */}
              <div className="att-checkin-zone">
                {!activeWindow && (
                  <div className="modern-card att-status-card att-idle" style={{ minHeight: "auto" }}>
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
                  <div className={`modern-card att-status-card att-active${expired ? " att-expired" : ""}`} style={{ minHeight: "auto" }}>
                    <span className="att-live-tag">LIVE · CHECK-IN OPEN</span>
                    <h4 className="att-status-title">Check in for Day {activeWindow.day}</h4>
                    <CountdownRing mm={mm} ss={ss} progress={progress} expired={expired} />
                    {checkinError && <div className="att-error">{checkinError}</div>}
                    <button
                      className="explore-btn"
                      onClick={handleCheckIn}
                      disabled={checkinLoading || expired}
                      style={{ marginTop: "16px" }}
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
                  <div className="modern-card att-status-card att-done" style={{ minHeight: "auto" }}>
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
              <div className="modern-card att-logs-card" style={{ minHeight: "auto", marginTop: "24px" }}>
                <h4 className="att-logs-title">Attendance Logs</h4>
                {attendance.length === 0 ? (
                  <div className="att-empty">No attendance logs yet.</div>
                ) : (
                  <ul className="att-logs-list">
                    {attendance.map((log: any, idx: number) => (
                      <li className="att-log-item" key={idx}>
                        <span className="att-day-label">Day {log.session_day}</span>
                        <span className="att-time-label">{new Date(log.verified_at).toLocaleString()}</span>
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
          <div className="db-projects-section animate-in fade-in duration-300">
            <h3 className="db-section-title">Session-wise Resources</h3>
            {resources.length === 0 ? (
              <div style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "80px 20px",
                textAlign: "center",
                color: "var(--db-text-secondary)",
                backgroundColor: "#fff",
                borderRadius: "16px",
                border: "1px solid rgba(0,0,0,0.06)",
                boxShadow: "var(--card-shadow)",
                width: "100%",
                boxSizing: "border-box"
              }}>
                <div style={{ fontSize: "48px", marginBottom: "16px" }}>📁</div>
                <h4 style={{ margin: "0 0 8px", fontWeight: "700", fontSize: "18px" }}>No resources uploaded yet</h4>
                <p style={{ margin: 0, fontSize: "14px", color: "var(--db-text-muted)" }}>They will appear here once the admin publishes them.</p>
              </div>
            ) : (() => {
              // Get days that have resources
              const activeDays = Array.from({ length: 7 }, (_, i) => i + 1).filter(dayNum => 
                resources.some((r: any) => Number(r.session_number) === dayNum)
              );

              return (
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  {activeDays.map(dayNum => {
                    const dayRes = resources.filter((r: any) => Number(r.session_number) === dayNum);

                    return (
                      <details key={dayNum} open style={{ border: "1.5px solid rgba(0,0,0,0.06)", borderRadius: "16px", overflow: "hidden", background: "#fff", boxShadow: "var(--card-shadow)" }}>
                        <summary style={{ padding: "14px 20px", cursor: "pointer", background: "#f8fafc", fontWeight: "800", fontSize: "14px", display: "flex", justifyContent: "space-between", alignItems: "center", outline: "none", userSelect: "none" }}>
                          <span style={{ color: "var(--db-text-primary)" }}>Day {dayNum} Resources</span>
                          <span style={{ fontSize: "11px", fontWeight: "900", background: "rgba(16,185,129,0.1)", color: "#10b981", padding: "2px 8px", borderRadius: "10px", border: "1px solid rgba(16,185,129,0.2)" }}>
                            {dayRes.length} {dayRes.length === 1 ? 'Item' : 'Items'}
                          </span>
                        </summary>
                        <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "12px", borderTop: "1.5px solid rgba(0,0,0,0.06)" }}>
                          {dayRes.map((res: any, idx) => {
                            // Get clear icon by type
                            let icon = "💾";
                            const typeLower = (res.type || "").toLowerCase();
                            if (typeLower.includes("ppt")) icon = "📊";
                            else if (typeLower.includes("pdf")) icon = "📄";
                            else if (typeLower.includes("video") || typeLower.includes("recording")) icon = "🎥";
                            else if (typeLower.includes("link")) icon = "🔗";
                            else if (typeLower.includes("doc")) icon = "📝";

                            return (
                              <div className="db-project-row" key={res.id || idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", borderRadius: "12px", background: "#f9fafb", border: "1px solid rgba(0,0,0,0.02)" }}>
                                <div className="db-project-info" style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                  <div className="db-project-icon" style={{ fontSize: "20px" }}>
                                    {icon}
                                  </div>
                                  <div>
                                    <h4 className="db-project-name" style={{ margin: 0, fontSize: "13.5px", fontWeight: "800", color: "var(--db-text-primary)" }}>{res.title}</h4>
                                    <span className="db-project-url" style={{ fontSize: "10.5px", color: "var(--db-text-muted)" }}>Type: {res.type}</span>
                                  </div>
                                </div>
                                <a href={res.url || res.file_url} target="_blank" rel="noopener noreferrer" className="explore-btn" style={{ padding: "8px 16px", fontSize: "12px", height: "auto", display: "inline-flex", alignItems: "center", gap: "6px", textDecoration: "none", borderRadius: "10px" }} onClick={async () => {
                                  try {
                                    await fetch("/api/tasks/complete", {
                                      method: "POST",
                                      headers: { "Content-Type": "application/json" },
                                      body: JSON.stringify({
                                        enrollmentNumber: registeredUser?.enrollmentNumber,
                                        taskId: "download_slides",
                                        source: "resource-view",
                                        metadata: { resource_id: res.id, resource_title: res.title },
                                      }),
                                    });
                                  } catch (e) {
                                    console.error("Failed to record resource view task:", e);
                                  }
                                }}>
                                  Get Resource ➔
                                </a>
                              </div>
                            );
                          })}
                        </div>
                      </details>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        )}

        {/* TAB: ASSIGNMENTS */}
        {currentTab === "assignments" && (
          <div className="db-projects-section animate-in fade-in duration-300">
            <h3 className="db-section-title">Course Assignments</h3>
            {assignments.length === 0 ? (
              <div style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "80px 20px",
                textAlign: "center",
                color: "var(--db-text-secondary)",
                backgroundColor: "#fff",
                borderRadius: "16px",
                border: "1px solid rgba(0,0,0,0.06)",
                boxShadow: "var(--card-shadow)",
                width: "100%"
              }}>
                <div style={{ fontSize: "48px", marginBottom: "16px" }}>📝</div>
                <h4 style={{ margin: "0 0 8px", fontWeight: "700", fontSize: "18px" }}>No assignments assigned yet</h4>
                <p style={{ margin: 0, fontSize: "14px", color: "var(--db-text-muted)" }}>Your course assignments will be listed here when they are published.</p>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: "24px", alignItems: "start" }}>
                {/* List */}
                <div className="db-project-list">
                  {assignments.map((ass) => {
                    const sub = submissions.find(s => s.assignment_id === ass.id);
                    return (
                      <div className="db-project-row" key={ass.id} style={{ display: "block" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                          <h4 className="db-project-name" style={{ fontSize: "16px" }}>{ass.title}</h4>
                          <span style={{ fontSize: "13px", fontWeight: "900" }}>Max Marks: {ass.max_marks}</span>
                        </div>
                        <p style={{ fontSize: "14px", color: "var(--text-secondary)" }}>{ass.description}</p>
                        <p style={{ fontSize: "12px", fontWeight: "800", color: "var(--accent-orange)", marginTop: "4px" }}>📅 Due Date: {new Date(ass.due_date).toLocaleDateString()}</p>

                        <div style={{ marginTop: "12px", borderTop: "1.5px solid rgba(0,0,0,0.06)", paddingTop: "12px" }}>
                          {sub ? (
                            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                {sub.marks_obtained !== null ? (
                                  <span style={{
                                    fontSize: "11px", fontWeight: "900", color: "#10b981",
                                    backgroundColor: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)",
                                    padding: "4px 10px", borderRadius: "12px", textTransform: "uppercase"
                                  }}>
                                    Reviewed ✅
                                  </span>
                                ) : (
                                  <span style={{
                                    fontSize: "11px", fontWeight: "900", color: "#f97316",
                                    backgroundColor: "rgba(249,115,22,0.1)", border: "1px solid rgba(249,115,22,0.3)",
                                    padding: "4px 10px", borderRadius: "12px", textTransform: "uppercase"
                                  }}>
                                    Under Review ⏳
                                  </span>
                                )}

                                {sub.marks_obtained !== null && (
                                  <span style={{ fontWeight: "900", fontSize: "14px", color: "var(--db-text-primary)" }}>
                                    Score: {sub.marks_obtained} / {ass.max_marks}
                                  </span>
                                )}
                              </div>

                              {sub.mentor_feedback && (
                                <div style={{
                                  background: "rgba(0,0,0,0.02)", border: "1px solid rgba(0,0,0,0.04)",
                                  borderRadius: "12px", padding: "10px 14px", marginTop: "4px"
                                }}>
                                  <span style={{ fontSize: "10px", fontWeight: "800", color: "var(--text-secondary)", display: "block", marginBottom: "2px", textTransform: "uppercase" }}>💬 Mentor Remarks</span>
                                  <p style={{ fontSize: "12px", color: "var(--text-secondary)", margin: 0, fontStyle: "italic", lineHeight: 1.4 }}>"{sub.mentor_feedback}"</p>
                                </div>
                              )}
                            </div>
                          ) : (
                            <button className="explore-btn" style={{ padding: "8px 16px", fontSize: "12px", height: "auto" }} onClick={() => setSubmittingAssignmentId(ass.id)}>
                              Submit Assignment
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Submission Form */}
                {submittingAssignmentId && (() => {
                  const currentAss = assignments.find(a => a.id === submittingAssignmentId);
                  const reqs = currentAss?.submission_requirements || { live_url: true, github_link: true, attachment: false };
                  
                  return (
                    <form onSubmit={handleSubmitHomework} className="modern-card" style={{ display: "block", padding: "24px", backgroundColor: "#fff", minHeight: "auto", border: "1px solid rgba(0,0,0,0.08)", borderRadius: "16px", boxShadow: "0 8px 32px rgba(0,0,0,0.05)" }}>
                      <h4 style={{ margin: "0 0 16px 0", fontSize: "16px", fontWeight: "900", textTransform: "uppercase", color: "var(--db-text-primary)" }}>Upload Submission</h4>
                      <div className="form-group-wrapper" style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                        
                        {reqs.github_link && (
                          <div>
                            <label style={{ fontSize: "11px", fontWeight: "800", display: "block", marginBottom: "6px", textTransform: "uppercase", color: "var(--db-text-muted)" }}>GitHub Repository URL*</label>
                            <input
                              type="url"
                              required
                              value={submissionRepo}
                              onChange={(e) => setSubmissionRepo(e.target.value)}
                              placeholder="https://github.com/username/repo"
                              className="form-input-text"
                              style={{ background: "#fff", border: "1px solid #d1d5db", color: "#000", outline: "none", borderRadius: "10px", padding: "10px 12px", width: "100%" }}
                            />
                          </div>
                        )}

                        {reqs.live_url && (
                          <div>
                            <label style={{ fontSize: "11px", fontWeight: "800", display: "block", marginBottom: "6px", textTransform: "uppercase", color: "var(--db-text-muted)" }}>Live Deployed URL*</label>
                            <input
                              type="url"
                              required
                              value={submissionLive}
                              onChange={(e) => setSubmissionLive(e.target.value)}
                              placeholder="https://my-app.netlify.app"
                              className="form-input-text"
                              style={{ background: "#fff", border: "1px solid #d1d5db", color: "#000", outline: "none", borderRadius: "10px", padding: "10px 12px", width: "100%" }}
                            />
                          </div>
                        )}

                        {reqs.attachment && (
                          <div>
                            <label style={{ fontSize: "11px", fontWeight: "800", display: "block", marginBottom: "6px", textTransform: "uppercase", color: "var(--db-text-muted)" }}>File Attachment*</label>
                            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                              <input
                                type="file"
                                id="assignment-file"
                                style={{ display: "none" }}
                                onChange={async (e) => {
                                  const file = e.target.files?.[0];
                                  if (!file) return;
                                  setUploadingAttachment(true);
                                  try {
                                    const formData = new FormData();
                                    formData.append("file", file);
                                    const res = await fetch("/api/upload", {
                                      method: "POST",
                                      body: formData
                                    });
                                    const data = await res.json();
                                    if (res.ok && data.success) {
                                      setSubmissionAttachment(data.fileUrl);
                                      alert("File uploaded successfully!");
                                    } else {
                                      alert(data.error || "File upload failed.");
                                    }
                                  } catch (err) {
                                    alert("Upload error.");
                                  } finally {
                                    setUploadingAttachment(false);
                                  }
                                }}
                              />
                              <button
                                type="button"
                                disabled={uploadingAttachment}
                                onClick={() => document.getElementById("assignment-file")?.click()}
                                className="explore-btn"
                                style={{ padding: "8px 16px", fontSize: "12px", height: "auto", margin: 0, backgroundColor: "#f3f4f6", color: "#374151", border: "1px solid #d1d5db", borderRadius: "10px" }}
                              >
                                {uploadingAttachment ? "Uploading..." : "Choose File"}
                              </button>
                              {submissionAttachment ? (
                                <span style={{ fontSize: "11px", color: "#16a34a", fontWeight: "800" }}>✓ Uploaded</span>
                              ) : (
                                <span style={{ fontSize: "11px", color: "#9ca3af" }}>No file chosen</span>
                              )}
                            </div>
                          </div>
                        )}

                        <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
                          <button type="submit" disabled={submittingHomework || uploadingAttachment} className="explore-btn" style={{ flex: 1 }}>
                            {submittingHomework ? "Submitting..." : "Submit Pass"}
                          </button>
                          <button type="button" onClick={() => setSubmittingAssignmentId("")} className="explore-btn" style={{ flex: 1, backgroundColor: "#fff", color: "#374151", border: "1px solid #d1d5db" }}>
                            Cancel
                          </button>
                        </div>
                      </div>
                    </form>
                  );
                })()}
              </div>
            )}
          </div>
        )}

        {/* TAB: LEADERBOARD */}
        {currentTab === "leaderboard" && (() => {
          const sortedLeaderboard = leaderboard;
          const filteredLeaderboard = sortedLeaderboard.filter((s: any) => {
            const query = leaderboardSearch.toLowerCase().trim();
            if (!query) return true;
            const name = (s.name || "").toLowerCase();
            const enroll = (s.enrollmentNumber || "").toLowerCase();
            return name.includes(query) || enroll.includes(query);
          });

          const isSearchActive = leaderboardSearch.trim() !== "";
          const showPodium = !isSearchActive && sortedLeaderboard.length >= 1;
          
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
                <h3 className="db-section-title" style={{ margin: 0 }}>XP Leaderboard Rankings</h3>
                <input
                  type="text"
                  placeholder="Search student by name or enrollment…"
                  value={leaderboardSearch}
                  onChange={(e) => setLeaderboardSearch(e.target.value)}
                  className="form-input-text"
                  style={{ maxWidth: "280px", margin: 0, backgroundColor: "#fff", color: "#000" }}
                />
              </div>

              {/* PODIUM CARDS */}
              {showPodium && (
                <div className="leaderboard-podium">
                  {top2 && (() => {
                    return (
                      <div className="podium-card rank-2 animate-in slide-in-from-bottom duration-300" onClick={() => setSelectedPeer(top2)} style={{ cursor: "pointer" }}>
                        <div style={{ position: "absolute", top: "-12px", fontSize: "20px" }}>🥈</div>
                        <div className="podium-badge">#2</div>
                        <div className="podium-name" title={top2.name}>{top2.name}</div>
                        <div className="podium-meta">
                          {top2.enrollmentNumber || ""} · {top2.branch || "Student"}
                          <br />
                          📅 {top2.attendanceCount || 0}/{WORKSHOP_DAYS} Days ({Math.round(((top2.attendanceCount || 0) / WORKSHOP_DAYS) * 100)}%)
                        </div>
                        <div className="podium-xp">{top2.xp || 0} XP</div>
                        <div className="podium-actions">
                          <button onClick={(e) => { e.stopPropagation(); setSelectedPeer(top2); }} className="explore-btn podium-btn" style={{ backgroundColor: "#FFD446", color: "#000" }}>
                            👤 Profile
                          </button>
                        </div>
                      </div>
                    );
                  })()}

                  {top1 && (() => {
                    return (
                      <div className="podium-card rank-1 animate-in slide-in-from-bottom duration-500" onClick={() => setSelectedPeer(top1)} style={{ cursor: "pointer" }}>
                        <div style={{ position: "absolute", top: "-16px", fontSize: "26px" }}>👑</div>
                        <div className="podium-badge">#1</div>
                        <div className="podium-name" style={{ fontSize: "17px" }} title={top1.name}>{top1.name}</div>
                        <div className="podium-meta">
                          {top1.enrollmentNumber || ""} · {top1.branch || "Student"}
                          <br />
                          📅 {top1.attendanceCount || 0}/{WORKSHOP_DAYS} Days ({Math.round(((top1.attendanceCount || 0) / WORKSHOP_DAYS) * 100)}%)
                        </div>
                        <div className="podium-xp" style={{ fontSize: "25px" }}>{top1.xp || 0} XP</div>
                        <div className="podium-actions">
                          <button onClick={(e) => { e.stopPropagation(); setSelectedPeer(top1); }} className="explore-btn podium-btn" style={{ backgroundColor: "#FFD446", color: "#000" }}>
                            👤 Profile
                          </button>
                        </div>
                      </div>
                    );
                  })()}

                  {top3 && (() => {
                    return (
                      <div className="podium-card rank-3 animate-in slide-in-from-bottom duration-300" onClick={() => setSelectedPeer(top3)} style={{ cursor: "pointer" }}>
                        <div style={{ position: "absolute", top: "-12px", fontSize: "20px" }}>🥉</div>
                        <div className="podium-badge">#3</div>
                        <div className="podium-name" title={top3.name}>{top3.name}</div>
                        <div className="podium-meta">
                          {top3.enrollmentNumber || ""} · {top3.branch || "Student"}
                          <br />
                          📅 {top3.attendanceCount || 0}/{WORKSHOP_DAYS} Days ({Math.round(((top3.attendanceCount || 0) / WORKSHOP_DAYS) * 100)}%)
                        </div>
                        <div className="podium-xp">{top3.xp || 0} XP</div>
                        <div className="podium-actions">
                          <button onClick={(e) => { e.stopPropagation(); setSelectedPeer(top3); }} className="explore-btn podium-btn" style={{ backgroundColor: "#FFD446", color: "#000" }}>
                            👤 Profile
                          </button>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* LIST VIEW */}
              <div className="dark-leaderboard-list">
                {filteredLeaderboard.length > 0 ? (
                  filteredLeaderboard.map((s: any) => {
                    const absoluteRank = sortedLeaderboard.findIndex((x: any) => x.enrollmentNumber === s.enrollmentNumber) + 1;
                    const rankClass = absoluteRank === 1 ? "rank-1 row-rank-1" : absoluteRank === 2 ? "rank-2 row-rank-2" : absoluteRank === 3 ? "rank-3 row-rank-3" : "row-rank-other";

                    return (
                      <div
                        className={`dark-leaderboard-row ${rankClass}`}
                        key={s.enrollmentNumber}
                        onClick={() => setSelectedPeer(s)}
                        style={{ cursor: "pointer" }}
                      >
                        <div className="row-rank-badge">
                          {absoluteRank <= 3 ? (absoluteRank === 1 ? "🥇" : absoluteRank === 2 ? "🥈" : "🥉") : `#${absoluteRank}`}
                        </div>
                        
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div className="row-name" style={{ textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
                            {s.name}
                            {s.you && (
                              <span style={{ marginLeft: "8px", fontSize: "10px", fontWeight: "800", backgroundColor: "var(--accent-yellow)", color: "#000", padding: "1px 8px", borderRadius: "20px" }}>YOU</span>
                            )}
                          </div>
                          <div className="row-meta">
                            {s.enrollmentNumber || ""} · {s.branch || "Student"}
                            <span style={{ margin: "0 6px", opacity: 0.3 }}>|</span>
                            📅 {s.attendanceCount || 0}/{WORKSHOP_DAYS} Days ({Math.round(((s.attendanceCount || 0) / WORKSHOP_DAYS) * 100)}%)
                          </div>
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: "16px", flexShrink: 0 }}>
                          <span className="row-xp">{s.xp || 0} XP</span>
                          
                          <div style={{ display: "flex", gap: "6px" }}>
                            <button
                              onClick={(e) => { e.stopPropagation(); setSelectedPeer(s); }}
                              className="action-btn-circle"
                              title="View Public Profile"
                              style={{ display: "flex", alignItems: "center", justifyContent: "center" }}
                            >
                              👤
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="dark-leaderboard-row" style={{ justifyContent: "center", color: "var(--db-text-muted)" }}>No students found matching your search.</div>
                )}
              </div>
            </div>
          );
        })()}

        {/* TAB: CERTIFICATION */}
        {currentTab === "certification" && (
          <CertificationTab registeredUser={registeredUser} showToast={showToast} />
        )}

        {/* TAB: POLLS */}
        {currentTab === "polls" && (
          <div className="db-projects-section animate-in fade-in duration-300">
            <h3 className="db-section-title">Live Interactive Polling</h3>
            <LivePollingStudent student={registeredUser} showToast={showToast} />
          </div>
        )}

        {/* TAB: PROFILE */}
        {currentTab === "profile" && (
          <div className="db-projects-section animate-in fade-in duration-300">
            <h3 className="db-section-title">My Student Profile</h3>

            {/* Profile banner */}
            <div className="profile-banner modern-card">
              <div className="profile-banner-avatar">
                {photoPreview || profilePhoto ? (
                  <img src={photoPreview || `${profilePhoto}?t=${photoTimestamp}`} alt="Profile" className="profile-avatar-img" />
                ) : (
                  <span className="profile-avatar-letter">
                    {registeredUser.name ? registeredUser.name.charAt(0).toUpperCase() : "S"}
                  </span>
                )}
              </div>
              <div className="profile-banner-info">
                <div className="profile-banner-name-row">
                  <h4 className="profile-banner-name">{registeredUser.name}</h4>
                  <span className="profile-banner-tier" style={{ display: "inline-flex", alignItems: "center", gap: "5px", backgroundColor: "rgba(0,149,246,0.08)", color: "#0095F6", border: "1px solid rgba(0,149,246,0.2)", borderRadius: "20px", padding: "3px 10px 3px 6px", fontSize: "12px", fontWeight: "700", lineHeight: "1" }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="#0095F6" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0, display: "block" }}>
                      <path d="M22.25 12c0-1.43-.88-2.67-2.19-3.34.46-1.39.2-2.9-.81-3.91s-2.52-1.27-3.91-.81c-.66-1.31-1.91-2.19-3.34-2.19s-2.67.88-3.33 2.19c-1.4-.46-2.91-.2-3.92.81s-1.26 2.52-.8 3.91c-1.31.67-2.2 1.91-2.2 3.34s.89 2.67 2.2 3.34c-.46 1.39-.21 2.9.8 3.91s2.52 1.26 3.91.8c.67 1.31 1.91 2.19 3.34 2.19s2.68-.88 3.34-2.19c1.39.46 2.9.21 3.91-.8s1.27-2.52.81-3.91c1.31-.67 2.19-1.91 2.19-3.34zm-11.71 4.2L6.8 12.46l1.41-1.42 2.26 2.26 4.8-5.23 1.47 1.36-6.2 6.77z"/>
                    </svg>
                    Verified Participant
                  </span>
                </div>
                <div className="profile-banner-enroll" onClick={handleCopyEnrollment} title="Click to copy enrollment number" style={{ cursor: "pointer" }}>
                  <span>#{registeredUser.enrollmentNumber}</span>
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: "4px" }}>
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                  {copied && <span className="profile-copy-tip" style={{ color: "var(--db-accent-green)", fontWeight: "bold", marginLeft: "8px" }}>Copied!</span>}
                </div>
                <div className="profile-banner-stats">
                  <div className="profile-stat-chip">
                    <span className="profile-stat-value">{xp}</span>
                    <span className="profile-stat-label">XP</span>
                  </div>
                  <div className="profile-stat-chip">
                    <span className="profile-stat-value">{streak}</span>
                    <span className="profile-stat-label">Day Streak</span>
                  </div>
                  <div className="profile-stat-chip">
                    <span className="profile-stat-value">{attendance.length}/{WORKSHOP_DAYS} ({WORKSHOP_DAYS > 0 ? Math.round((attendance.length / WORKSHOP_DAYS) * 100) : 0}%)</span>
                    <span className="profile-stat-label">Attended</span>
                  </div>
                  <div className="profile-stat-chip">
                    <span className="profile-stat-value">{submissions.length}/{WORKSHOP_DAYS}</span>
                    <span className="profile-stat-label">Submitted</span>
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
                  <span style={{ fontSize: "11px", color: profileBio?.trim() ? "var(--db-accent-green)" : "var(--db-text-muted)", fontWeight: "750" }}>
                    {profileBio?.trim() ? "✓ Bio" : "✗ Bio (20%)"}
                  </span>
                  <span style={{ fontSize: "11px", color: profileGithub?.trim() ? "var(--db-accent-green)" : "var(--db-text-muted)", fontWeight: "750" }}>
                    {profileGithub?.trim() ? "✓ GitHub" : "✗ GitHub (20%)"}
                  </span>
                  <span style={{ fontSize: "11px", color: profileLinkedin?.trim() ? "var(--db-accent-green)" : "var(--db-text-muted)", fontWeight: "750" }}>
                    {profileLinkedin?.trim() ? "✓ LinkedIn" : "✗ LinkedIn (20%)"}
                  </span>
                  <span style={{ fontSize: "11px", color: registeredUser?.email ? "var(--db-accent-green)" : "var(--db-text-muted)", fontWeight: "750" }}>
                    {registeredUser?.email ? "✓ Email" : "✗ Email (20%)"}
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
                        {registeredUser.name ? registeredUser.name.charAt(0).toUpperCase() : "S"}
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
                    <label className="form-label" style={{ fontWeight: "900", fontSize: "12px", textTransform: "uppercase", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>Attendee Name</label>
                    <input type="text" disabled value={registeredUser.name} className="form-input-text" style={{ opacity: 0.6, cursor: "not-allowed" }} />
                  </div>
                  <div>
                    <label className="form-label" style={{ fontWeight: "900", fontSize: "12px", textTransform: "uppercase", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>Enrollment Number</label>
                    <input type="text" disabled value={registeredUser.enrollmentNumber} className="form-input-text" style={{ opacity: 0.6, cursor: "not-allowed" }} />
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
                      {registeredUser.name ? registeredUser.name.charAt(0).toUpperCase() : "S"}
                    </span>
                  )}
                </div>
                <h4 className="profile-preview-name" style={{ margin: "12px 0 4px 0", fontSize: "18px", fontWeight: "800" }}>{registeredUser.name}</h4>
                <span className="profile-preview-enroll" style={{ fontStyle: "italic", fontSize: "12px", color: "var(--text-secondary)" }}>#{registeredUser.enrollmentNumber}</span>
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
                    <span className="profile-preview-stat-value">{xp}</span>
                    <span className="profile-preview-stat-label">XP</span>
                  </div>
                  <div className="profile-preview-stat">
                    <span className="profile-preview-stat-value">{streak}</span>
                    <span className="profile-preview-stat-label">Streak</span>
                  </div>
                  <div className="profile-preview-stat">
                    <span className="profile-preview-stat-value">{attendance.length}/{WORKSHOP_DAYS}</span>
                    <span className="profile-preview-stat-label">Attended</span>
                  </div>
                </div>
              </aside>
            </div>

            {/* Badges & Achievements section */}
            <div className="badges-section-card animate-in fade-in duration-300">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h4 style={{ fontSize: "16px", fontWeight: "900", margin: 0, textTransform: "uppercase", color: "var(--db-text-primary)" }}>🏅 My Achievements &amp; Badges</h4>
                <span style={{ fontSize: "12px", fontWeight: "800", color: "var(--db-accent-green)", backgroundColor: "rgba(16,185,129,0.1)", padding: "2px 10px", borderRadius: "20px" }}>
                  {unlockedBadges.length}/7 Unlocked
                </span>
              </div>

              <div className="badges-section-grid">
                {BADGES_METADATA.map((badge) => {
                  const isUnlocked = unlockedBadges.includes(badge.id);
                  return (
                    <div
                      key={badge.id}
                      className={`badge-item-box ${isUnlocked ? "unlocked" : "locked"}`}
                      title={`Unlock Criteria: ${badge.condition}`}
                      onClick={() => {
                        if (isUnlocked) {
                          setUnlockedBadgeModal({
                            emoji: badge.emoji,
                            color: badge.color,
                            name: badge.name,
                            desc: badge.desc,
                            xp: badge.id === "git_github_master_badge" ? 250 : badge.id.includes("warrior") ? 150 : 100
                          });
                        }
                      }}
                    >
                      <div className="badge-item-emoji" style={{ background: badge.color, color: "#fff" }}>
                        {badge.emoji}
                      </div>
                      <span className="badge-item-name">{badge.name}</span>
                      <span className="badge-item-desc" style={{ fontWeight: isUnlocked ? "800" : "600", color: isUnlocked ? "#10B981" : "#94A3B8" }}>
                        {isUnlocked ? "✓ Unlocked" : "🔒 Locked"}
                      </span>
                      <span style={{ fontSize: "8.5px", color: "#64748B", marginTop: "4px", lineHeight: "1.2" }}>
                        {badge.condition}
                      </span>
                    </div>
                  );
                })}
              </div>
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


      {/* Peer Public Profile Modal */}
      {selectedPeer && (
        <div
          onClick={() => setSelectedPeer(null)}
          style={{ position: "fixed", inset: 0, backgroundColor: "rgba(200,220,240,0.55)", zIndex: 10000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px", backdropFilter: "blur(8px)" }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ backgroundColor: "#fff", borderRadius: "24px", width: "100%", maxWidth: "400px", boxShadow: "0 8px 48px rgba(0,0,0,0.12)", padding: "32px 32px 28px", position: "relative", display: "flex", flexDirection: "column", alignItems: "center" }}
          >
            {/* Close btn */}
            <button onClick={() => setSelectedPeer(null)} style={{ position: "absolute", top: "16px", right: "16px", background: "#f1f5f9", border: "none", borderRadius: "50%", width: "30px", height: "30px", cursor: "pointer", color: "#94a3b8", fontSize: "14px", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "700" }}>✕</button>

            {/* PUBLIC PREVIEW pill */}
            <span style={{ fontSize: "11px", fontWeight: "700", color: "#4ade80", backgroundColor: "rgba(74,222,128,0.12)", border: "1px solid rgba(74,222,128,0.3)", borderRadius: "20px", padding: "4px 14px", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "20px" }}>Public Preview</span>

            {/* Avatar */}
            <div style={{ width: "90px", height: "90px", borderRadius: "50%", backgroundColor: "#e2e8f0", overflow: "hidden", marginBottom: "16px", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "34px", fontWeight: "900", color: "#94a3b8" }}>
              {peerPhoto ? (
                <img src={peerPhoto} alt={selectedPeer.name} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }} />
              ) : (
                selectedPeer.name ? selectedPeer.name.charAt(0).toUpperCase() : "S"
              )}
            </div>

            {/* Name */}
            <h3 style={{ margin: "0 0 4px", fontSize: "22px", fontWeight: "900", color: "#0f172a", textAlign: "center", textTransform: "uppercase", letterSpacing: "0.04em" }}>{selectedPeer.name}</h3>

            {/* Enrollment */}
            <span style={{ fontSize: "13px", color: "#94a3b8", fontStyle: "italic", marginBottom: "10px" }}>#{selectedPeer.enrollmentNumber}</span>

            {/* GitHub */}
            {selectedPeer.github ? (
              <a href={`https://github.com/${selectedPeer.github}`} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", color: "#0f172a", fontWeight: "700", textDecoration: "none", marginBottom: "12px", letterSpacing: "0.04em" }}>
                <svg height="16" width="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/></svg>
                {selectedPeer.github.toUpperCase()}
              </a>
            ) : null}

            {/* Bio */}
            {selectedPeer.bio ? (
              <p style={{ margin: "0 0 20px", fontSize: "12px", color: "#64748b", textAlign: "center", lineHeight: "1.5", textTransform: "uppercase", letterSpacing: "0.04em", fontWeight: "600" }}>{selectedPeer.bio}</p>
            ) : <div style={{ marginBottom: "20px" }} />}

            {/* Divider */}
            <div style={{ width: "100%", height: "1px", backgroundColor: "#f1f5f9", marginBottom: "20px" }} />

            {/* Stats */}
            <div style={{ display: "flex", width: "100%", justifyContent: "space-around" }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "26px", fontWeight: "900", color: "#0f172a", lineHeight: 1 }}>{selectedPeer.xp}</div>
                <div style={{ fontSize: "10px", fontWeight: "700", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.1em", marginTop: "6px" }}>XP</div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "26px", fontWeight: "900", color: "#0f172a", lineHeight: 1 }}>{selectedPeer.streak || 0}</div>
                <div style={{ fontSize: "10px", fontWeight: "700", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.1em", marginTop: "6px" }}>Streak</div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "26px", fontWeight: "900", color: "#0f172a", lineHeight: 1 }}>{selectedPeer.attendanceCount || 0}/{WORKSHOP_DAYS}</div>
                <div style={{ fontSize: "10px", fontWeight: "700", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.1em", marginTop: "6px" }}>Attended</div>
              </div>
            </div>

            {selectedPeer.you && (
              <span style={{ marginTop: "20px", fontSize: "11px", fontWeight: "700", color: "#64748b", backgroundColor: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "20px", padding: "5px 14px" }}>👤 This is your public profile</span>
            )}
          </div>
        </div>
      )}

      {/* Profile save toast */}
      {toast && (
        <div className={`profile-toast profile-toast--${toast.type}`} role="status" aria-live="polite">
          <span className="profile-toast-icon">
            {toast.type === "success" ? (
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            )}
          </span>
          <span className="profile-toast-msg">{toast.message}</span>
        </div>
      )}

      {/* Floating XP Animation Layer */}
      <div className="floating-xp-container">
        {floatingXps.map((fx) => (
          <span
            key={fx.id}
            className="floating-xp-text"
            style={{ left: fx.x, top: fx.y }}
          >
            {fx.text}
          </span>
        ))}
      </div>

      {/* Unlocked Badge Milestone Modal */}
      {unlockedBadgeModal && (
        <div className="badge-unlock-backdrop" onClick={() => setUnlockedBadgeModal(null)}>
          <div className="badge-unlock-modal" onClick={(e) => e.stopPropagation()}>
            <div className="badge-unlock-emoji" style={{ background: unlockedBadgeModal.color, color: "#fff" }}>
              {unlockedBadgeModal.emoji}
            </div>
            <h3 className="badge-unlock-title">Achievement Unlocked!</h3>
            <h4 style={{ fontSize: "16px", fontWeight: "800", color: "#FFA800", margin: "0 0 16px 0" }}>{unlockedBadgeModal.name}</h4>
            <p className="badge-unlock-desc">{unlockedBadgeModal.desc}</p>
            <div className="badge-unlock-bonus">
              +{unlockedBadgeModal.xp} XP Bonus
            </div>
            <button className="explore-btn" style={{ width: "100%", height: "45px" }} onClick={() => setUnlockedBadgeModal(null)}>
              Awesome!
            </button>
          </div>
        </div>
      )}

      {/* Feedback Modal */}
      {showFeedbackModal && (
        <div
          onClick={() => {
            setShowFeedbackModal(false);
            setFeedbackRating(0);
            setFeedbackMessage("");
          }}
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(15, 23, 42, 0.6)",
            zIndex: 20000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
            backdropFilter: "blur(8px)"
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              backgroundColor: "#fff",
              borderRadius: "24px",
              width: "100%",
              maxWidth: "500px",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
              padding: "36px 36px 28px",
              position: "relative",
              display: "flex",
              flexDirection: "column"
            }}
          >
            {/* Close btn */}
            <button
              onClick={() => {
                setShowFeedbackModal(false);
                setFeedbackRating(0);
                setFeedbackMessage("");
              }}
              style={{
                position: "absolute",
                top: "20px",
                right: "20px",
                background: "#f1f5f9",
                border: "none",
                borderRadius: "50%",
                width: "32px",
                height: "32px",
                cursor: "pointer",
                color: "#94a3b8",
                fontSize: "14px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: "700"
              }}
            >
              ✕
            </button>

            <span style={{
              fontSize: "11px",
              fontWeight: "700",
              color: "#d97706",
              backgroundColor: "#fef3c7",
              border: "1px solid #fde68a",
              borderRadius: "20px",
              padding: "4px 14px",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              alignSelf: "flex-start",
              marginBottom: "16px"
            }}>
              Feedback
            </span>

            <h3 style={{ margin: "0 0 8px", fontSize: "24px", fontWeight: "900", color: "#0f172a" }}>
              Share Your Feedback
            </h3>
            <p style={{ margin: "0 0 24px", fontSize: "13px", color: "#64748b", lineHeight: "1.5" }}>
              How was your experience today? Rate us on our 10-star scale.
            </p>

            <form onSubmit={handleSubmitFeedback} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              {/* Star Rating Grid */}
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <span style={{ fontSize: "11px", fontWeight: "800", color: "#475569", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Your Rating: {feedbackRating > 0 ? `${feedbackRating} / 10` : "Select stars"}
                </span>
                <div style={{ display: "flex", gap: "6px", justifyContent: "center", backgroundColor: "#f8fafc", padding: "16px", borderRadius: "16px", border: "1px solid #e2e8f0" }}>
                  {[...Array(10)].map((_, i) => {
                    const ratingValue = i + 1;
                    const isLit = ratingValue <= (hoveredRating || feedbackRating);
                    const color = isLit ? (ratingValue <= 5 ? "#ef4444" : "#f59e0b") : "#cbd5e1";
                    return (
                      <button
                        type="button"
                        key={ratingValue}
                        onClick={() => setFeedbackRating(ratingValue)}
                        onMouseEnter={() => setHoveredRating(ratingValue)}
                        onMouseLeave={() => setHoveredRating(0)}
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          fontSize: "24px",
                          padding: "2px",
                          transition: "transform 0.1s ease",
                          transform: ratingValue === hoveredRating ? "scale(1.2)" : "scale(1)",
                          color: color
                        }}
                      >
                        ★
                      </button>
                    );
                  })}
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "0 8px", fontSize: "11px", fontWeight: "700", color: "#64748b" }}>
                  <span style={{ color: "#ef4444" }}>1-5: Needs Work (Red)</span>
                  <span style={{ color: "#f59e0b" }}>6-10: Great (Gold)</span>
                </div>
              </div>

              {/* Message Input */}
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <label style={{ fontSize: "11px", fontWeight: "800", color: "#475569", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Genuine Feedback
                </label>
                <textarea
                  value={feedbackMessage}
                  onChange={e => setFeedbackMessage(e.target.value)}
                  placeholder="Tell us what you liked, what went wrong, and how we can improve..."
                  required
                  rows={4}
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    borderRadius: "12px",
                    border: "1px solid #cbd5e1",
                    fontSize: "14px",
                    color: "#0f172a",
                    outline: "none",
                    transition: "border-color 0.2s",
                    resize: "none"
                  }}
                />
              </div>

              {/* Submit Buttons */}
              <div style={{ display: "flex", gap: "12px", marginTop: "8px" }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowFeedbackModal(false);
                    setFeedbackRating(0);
                    setFeedbackMessage("");
                  }}
                  style={{
                    flex: 1,
                    padding: "12px",
                    borderRadius: "12px",
                    border: "1px solid #e2e8f0",
                    backgroundColor: "#fff",
                    color: "#475569",
                    fontSize: "14px",
                    fontWeight: "700",
                    cursor: "pointer",
                    transition: "all 0.2s"
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingFeedback || feedbackRating === 0 || !feedbackMessage.trim()}
                  style={{
                    flex: 1,
                    padding: "12px",
                    borderRadius: "12px",
                    border: "none",
                    backgroundColor: feedbackRating === 0 || !feedbackMessage.trim() ? "#cbd5e1" : "#0f172a",
                    color: "#fff",
                    fontSize: "14px",
                    fontWeight: "700",
                    cursor: feedbackRating === 0 || !feedbackMessage.trim() ? "not-allowed" : "pointer",
                    transition: "all 0.2s"
                  }}
                >
                  {submittingFeedback ? "Submitting..." : "Submit Feedback"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
