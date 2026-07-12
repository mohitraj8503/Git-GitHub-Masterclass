"use client";

import { useState, useEffect, useRef, useCallback, Fragment } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AssetImage from "@/components/AssetImage";
import LoadingSpinner from "@/components/LoadingSpinner";
import CountdownRing from "@/components/CountdownRing";
import { INSTITUTION_CODE, WORKSHOP_DAYS, UNKNOWN_BRANCH_LABEL, ATTENDANCE_WINDOW_MINUTES } from "@/lib/config";

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

const SCHEDULE_VENUE = "Computer Lab 2, Room No. 329, Block Baudhayana, Arka Jain University";

export default function DashboardPage() {
  const router = useRouter();

  // Auth gate: only an actual registered user (saved on sign-up) may view this.
  const [registeredUser, setRegisteredUser] = useState<any>();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    document.body.classList.add("dashboard-body-active");
    document.documentElement.classList.add("dashboard-body-active");

    const saved = localStorage.getItem("user_registration");
    if (saved) {
      try {
        setRegisteredUser(JSON.parse(saved));
      } catch (e) {
        console.error("Error reading registration data:", e);
        localStorage.removeItem("user_registration");
        setRegisteredUser(null);
      }
    } else {
      setRegisteredUser(null);
    }

    setChecked(true);
    return () => {
      document.body.classList.remove("dashboard-body-active");
      document.documentElement.classList.remove("dashboard-body-active");
    };
  }, []);

  useEffect(() => {
    if (checked && registeredUser === null) {
      router.replace("/register");
    }
  }, [checked, registeredUser, router]);

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
  const [showSearchResults, setShowSearchResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);

  // Initialize notification read timestamp
  useEffect(() => {
    const val = localStorage.getItem("last_read_notif");
    if (val) setLastReadNotif(Number(val));
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


  const BIO_MAX = 200;

  // Validation + UX state
  const [profileErrors, setProfileErrors] = useState<{ github?: string; linkedin?: string }>({});
  const [profileTouched, setProfileTouched] = useState<{ github?: boolean; linkedin?: boolean; bio?: boolean }>({});
  const [toast, setToast] = useState<{ type: "success" | "error" | "info"; message: string } | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [initialSnapshot, setInitialSnapshot] = useState<string>("");
  const [isDirty, setIsDirty] = useState<boolean>(false);

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

  const loadLmsData = useCallback(async () => {
    if (!registeredUser) return;
    try {
      const [annRes, assRes, subRes, attRes, peerRes, resRes, taskRes] = await Promise.all([
        fetch("/api/announcements").then((r) => r.json()),
        fetch("/api/assignments").then((r) => r.json()),
        fetch(`/api/submissions?student_id=${registeredUser.enrollmentNumber}`).then((r) => r.json()),
        fetch(`/api/attendance?enrollment_number=${encodeURIComponent(registeredUser.enrollmentNumber)}`).then((r) => r.json()),
        fetch("/api/register").then((r) => r.json()),
        fetch("/api/resources").then((r) => r.json()),
        fetch(`/api/tasks/complete?enrollmentNumber=${encodeURIComponent(registeredUser.enrollmentNumber)}`).then((r) => r.json()),
      ]);

      if (annRes.success) setAnnouncements(annRes.announcements);
      if (assRes.success) setAssignments(assRes.assignments);
      if (subRes.success) setSubmissions(subRes.submissions);
      if (attRes.success) setAttendance(attRes.attendance);
      if (peerRes.success && Array.isArray(peerRes.registrations)) {
        setPeers(peerRes.registrations);
        const myEnroll = registeredUser.enrollmentNumber.trim().toLowerCase();
        const currentRecord = peerRes.registrations.find(
          (p: any) =>
            (p.enrollmentNumber || p.enrollment_number || "").trim().toLowerCase() === myEnroll
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
          };
          // Only update if something actually changed to avoid infinite loop
          if (
            registeredUser.name !== updatedUser.name ||
            registeredUser.branch !== updatedUser.branch ||
            registeredUser.yearOfStudy !== updatedUser.yearOfStudy ||
            registeredUser.email !== updatedUser.email ||
            registeredUser.phoneNumber !== updatedUser.phoneNumber ||
            registeredUser.githubUsername !== updatedUser.githubUsername
          ) {
            setRegisteredUser(updatedUser);
            localStorage.setItem("user_registration", JSON.stringify(updatedUser));
          }
        }
      }
      if (resRes.success) setResources(resRes.resources || []);
      if (taskRes.success) setCompletedTaskIds(taskRes.completions || []);
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

  // First, seed the map with all peer registrations from DB
  peers.forEach((p: any) => {
    const enroll = (p.enrollmentNumber || p.enrollment_number || p.enroll_number || "").trim().toLowerCase();
    if (!enroll) return;
    const isYou = enroll === (registeredUser?.enrollmentNumber || "").trim().toLowerCase();
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
  if (registeredUser?.enrollmentNumber) {
    const myEnroll = registeredUser.enrollmentNumber.trim().toLowerCase();
    if (!leaderboardMap.has(myEnroll)) {
      leaderboardMap.set(myEnroll, {
        name: registeredUser.name,
        branch: registeredUser.branch || registeredUser.yearOfStudy || "Student",
        xp: xp,
        you: true,
        enrollmentNumber: registeredUser.enrollmentNumber,
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

  const leaderboard = Array.from(leaderboardMap.values()).sort((a, b) => b.xp - a.xp);

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
        <a href="#" className="db-sidebar-logo-section" onClick={(e) => { e.preventDefault(); setCurrentTab("home"); }}>
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
            <div className="db-sidebar-profile-avatar">
              {profilePhoto ? (
                <img src={`${profilePhoto}?t=${photoTimestamp}`} alt="avatar" />
              ) : (
                <span className="db-sidebar-profile-avatar-letter">
                  {registeredUser.name ? registeredUser.name.charAt(0).toUpperCase() : "S"}
                </span>
              )}

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
            {profilePhoto ? (
              <img src={`${profilePhoto}?t=${photoTimestamp}`} alt="Avatar" className="db-header-user-avatar" />
            ) : (
              <div className="db-header-user-avatar" style={{ backgroundColor: "#f3f4f6", display: "flex", justifyContent: "center", alignItems: "center", fontWeight: "bold", fontSize: "16px", color: "#6b7280" }}>
                {registeredUser.name ? registeredUser.name.charAt(0).toUpperCase() : "S"}
              </div>
            )}
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
          const completionPct = WORKSHOP_DAYS > 0 ? Math.round(((attendance.length * 0.6 + submissions.length * 0.4) / WORKSHOP_DAYS) * 100) : 0;
          const attendancePct = WORKSHOP_DAYS > 0 ? Math.round((attendance.length / WORKSHOP_DAYS) * 100) : 0;
          const chartPoints = SCHEDULE_DAYS.map((sd, i) => {
            const done = attendance.some((a: any) => Number(a.session_day) === sd.day);
            const sub = submissions.some((s: any) => s.assignment_id === `day-${sd.day}`);
            const val = done && sub ? 100 : done ? 70 : sub ? 50 : (i < attendance.length ? 30 : 0);
            return val;
          });
          const rank = leaderboard.findIndex(s => s.you) + 1;
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
                    <div className="progress-chart-header">
                      <span className="progress-chart-title">Workshop Progress</span>
                      <span className="progress-chart-dropdown">
                        Day-wise (All Days)
                        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
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
                      <div className="progress-chart-area">
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
                          const linePath = scaled.map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `C ${(scaled[i-1].x + p.x)/2} ${scaled[i-1].y}, ${(scaled[i-1].x + p.x)/2} ${p.y}, ${p.x} ${p.y}`)).join(" ");
                          const areaPath = `${linePath} L ${scaled[scaled.length-1].x} ${pad.top + innerH} L ${pad.left} ${pad.top + innerH} Z`;
                          return (
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
                              <path d={areaPath} fill="url(#areaGrad)"/>
                              {/* Line Glow */}
                              <path d={linePath} fill="none" stroke="#FFD446" strokeWidth="7" strokeOpacity="0.22" strokeLinecap="round" strokeLinejoin="round"/>
                              {/* Line Main */}
                              <path d={linePath} fill="none" stroke="#FFD446" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"/>
                              {/* Dots */}
                              {scaled.map((p, i) => (
                                pts[i] > 0 && <circle key={i} cx={p.x} cy={p.y} r="5" fill="#FFD446" stroke="#fff" strokeWidth="2"/>
                              ))}
                            </svg>
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

                        <a href="https://discord.gg/" target="_blank" rel="noopener noreferrer" style={{
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
                      </div>
                    </div>
                  </div>
                </div>

                 {/* Right: Upcoming Workshop */}
                <div className="event-card">
                  <div>
                    <span className="event-card-badge" style={{ color: "var(--db-accent-orange)", fontWeight: 800 }}>UPCOMING WORKSHOP</span>
                    <h3 className="event-card-title">Git &amp; GitHub Masterclass</h3>
                  </div>

                  <div className="event-card-details">
                    <div className="event-card-detail">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                      <span>15 July 2026</span>
                    </div>
                    <div className="event-card-detail">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
                      <span>12:30 PM – 1:30 PM</span>
                    </div>
                    <div className="event-card-detail">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                      <span>Seminar Hall, AJU Campus</span>
                    </div>
                  </div>

                  {/* Countdown timer to fill height cleanly */}
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
                        <div style={{ background: "rgba(0,0,0,0.05)", border: "1px solid rgba(0,0,0,0.08)", borderRadius: "8px", padding: "6px 12px", fontSize: "20px", fontWeight: "900", color: "var(--db-text-primary)", minWidth: "28px", lineHeight: 1 }}>03</div>
                        <div style={{ fontSize: "9px", fontWeight: "700", color: "var(--db-text-muted)", marginTop: "4px", textTransform: "uppercase" }}>Days</div>
                      </div>
                      <span style={{ color: "rgba(0,0,0,0.2)", fontWeight: "900", fontSize: "18px", marginTop: "-14px" }}>:</span>
                      <div style={{ textAlign: "center" }}>
                        <div style={{ background: "rgba(0,0,0,0.05)", border: "1px solid rgba(0,0,0,0.08)", borderRadius: "8px", padding: "6px 12px", fontSize: "20px", fontWeight: "900", color: "var(--db-text-primary)", minWidth: "28px", lineHeight: 1 }}>14</div>
                        <div style={{ fontSize: "9px", fontWeight: "700", color: "var(--db-text-muted)", marginTop: "4px", textTransform: "uppercase" }}>Hours</div>
                      </div>
                      <span style={{ color: "rgba(0,0,0,0.2)", fontWeight: "900", fontSize: "18px", marginTop: "-14px" }}>:</span>
                      <div style={{ textAlign: "center" }}>
                        <div style={{ background: "rgba(0,0,0,0.05)", border: "1px solid rgba(0,0,0,0.08)", borderRadius: "8px", padding: "6px 12px", fontSize: "20px", fontWeight: "900", color: "var(--db-text-primary)", minWidth: "28px", lineHeight: 1 }}>45</div>
                        <div style={{ fontSize: "9px", fontWeight: "700", color: "var(--db-text-muted)", marginTop: "4px", textTransform: "uppercase" }}>Min</div>
                      </div>
                    </div>
                  </div>

                  <div className="event-meta-row" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", flexWrap: "wrap", marginBottom: "4px" }}>
                    <span style={{
                      display: "inline-block",
                      fontSize: "11px",
                      fontWeight: "750",
                      background: "rgba(239, 68, 68, 0.1)",
                      color: "#dc2626",
                      border: "1px solid rgba(239, 68, 68, 0.2)",
                      padding: "4px 12px",
                      borderRadius: "20px"
                    }}>🔥 Only 8 seats left!</span>
                    <div className="event-card-offline-badge" style={{ margin: 0, padding: "4px 12px" }}>Offline Workshop</div>
                  </div>

                  <button className="event-card-btn" onClick={() => setCurrentTab("schedule")}>
                    <span>View Schedule</span>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                  </button>
                </div>
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
                {/* Col 1: Today's Tasks */}
                <div className="tasks-card">
                  <div className="tasks-card-header">
                    <h4 className="tasks-card-title">Today&apos;s Tasks</h4>
                    <span className="tasks-card-badge">
                      {completedTaskIds.length}/5 Done
                    </span>
                  </div>

                  {[
                    { id: "mark_attendance", label: "Mark Attendance", sub: "You're marked present", pts: "+20 XP", done: completedTaskIds.includes("mark_attendance") },
                    { id: "download_slides", label: "Download Workshop Slides", sub: "Get today's presentation", pts: "+10 XP", done: completedTaskIds.includes("download_slides") },
                    { id: "complete_assignment", label: "Complete Assignment 1", sub: "Submit before tomorrow", pts: "+40 XP", done: completedTaskIds.includes("complete_assignment") },
                    { id: "push_github", label: "Push Code to GitHub", sub: "Upload your repository", pts: "+20 XP", done: completedTaskIds.includes("push_github") },
                    { id: "fill_feedback", label: "Fill Feedback Form", sub: "Help us improve", pts: "+10 XP", done: completedTaskIds.includes("fill_feedback") },
                  ].map((task, i) => (
                    <div className="task-item" key={i} style={{ cursor: "default" }}>
                      <div className={`task-check${task.done ? " done" : ""}`}/>
                      <div className="task-text-block">
                        <span className={`task-label${task.done ? " done" : ""}`}>{task.label}</span>
                        <span className="task-sublabel">{task.sub}</span>
                      </div>
                      <div className="task-pts-badge" style={{ fontSize: "11px", fontWeight: "750", color: "var(--db-accent-green)", background: "rgba(16,185,129,0.1)", padding: "2px 8px", borderRadius: "10px", marginLeft: "auto", marginRight: "8px" }}>
                        {task.pts}
                      </div>
                      <div className="task-chevron">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
                      </div>
                    </div>
                  ))}
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
                      <div className="rank-value">#{rank || 1}</div>
                      {peers.length > 1 && (
                        <div className="rank-top-badge">Top {Math.ceil(((rank || 1) / Math.max(peers.length, 1)) * 100)}%</div>
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
                  <span className="journey-card-day-badge">Day {Math.min(attendance.length + 1, WORKSHOP_DAYS)} of {WORKSHOP_DAYS}</span>
                </div>
                <div className="journey-timeline-row">
                  {SCHEDULE_DAYS.map((sd, idx) => {
                    const isCompleted = attendance.some((a: any) => Number(a.session_day) === sd.day);
                    const isToday = sd.day === Math.min(attendance.length + 1, WORKSHOP_DAYS) && !isCompleted;
                    const status = isCompleted ? "completed" : isToday ? "today" : "upcoming";
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
                            {isCompleted ? "Completed" : isToday ? "● Today" : "Upcoming"}
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

                    <div className="modern-card schedule-card-body" style={{ padding: "20px 24px", minHeight: "auto" }}>
                      <div className="schedule-card-head">
                        <span className="schedule-day-label" style={{ fontWeight: "900", color: "var(--text-secondary)" }}>Day {session.day}</span>
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
                width: "100%"
              }}>
                <div style={{ fontSize: "48px", marginBottom: "16px" }}>📁</div>
                <h4 style={{ margin: "0 0 8px", fontWeight: "700", fontSize: "18px" }}>No resources uploaded yet</h4>
                <p style={{ margin: 0, fontSize: "14px", color: "var(--db-text-muted)" }}>They will appear here once the admin publishes them.</p>
              </div>
            ) : (
              <div className="db-project-list">
                {resources.map((res, idx) => (
                  <div className="db-project-row" key={res.id || idx}>
                    <div className="db-project-info">
                      <div className="db-project-icon" style={{ fontWeight: "bold" }}>
                        💾
                      </div>
                      <div>
                        <h4 className="db-project-name">{res.title}</h4>
                        <span className="db-project-url">Resource Format: {res.type}</span>
                      </div>
                    </div>
                    <a href={res.url} target="_blank" rel="noopener noreferrer" className="explore-btn" style={{ padding: "8px 16px", fontSize: "12px", height: "auto" }} onClick={async () => {
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
                      Get Resource
                    </a>
                  </div>
                ))}
              </div>
            )}
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

                        <div style={{ marginTop: "12px", borderTop: "1px solid rgba(0,0,0,0.05)", paddingTop: "12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          {sub ? (
                            <div>
                              <span style={{ color: "var(--accent-green)", fontWeight: "900", fontSize: "14px" }}>Submitted ✓</span>
                              {sub.marks_obtained !== null && (
                                <span style={{ marginLeft: "12px", fontWeight: "900" }}>Marks: {sub.marks_obtained} / {ass.max_marks}</span>
                              )}
                              {sub.mentor_feedback && (
                                <p style={{ fontSize: "12px", color: "var(--text-secondary)", margin: "4px 0 0 0" }}>💬 Mentor Remarks: {sub.mentor_feedback}</p>
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
        {currentTab === "leaderboard" && (
          <div className="db-projects-section animate-in fade-in duration-300">
            <h3 className="db-section-title">XP Leaderboard Rankings</h3>
            <div className="db-project-list">
              {leaderboard.map((student, idx) => {
                const rankIcon = idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : `#${idx + 1}`;
                const rankBg = idx === 0 ? "linear-gradient(135deg,#f59e0b,#fcd34d)" : idx === 1 ? "linear-gradient(135deg,#9ca3af,#d1d5db)" : idx === 2 ? "linear-gradient(135deg,#b45309,#d97706)" : "#f3f4f6";
                const rankColor = idx < 3 ? "#fff" : "#374151";
                return (
                  <div
                    className="db-project-row"
                    key={student.enrollmentNumber || idx}
                    onClick={() => setSelectedPeer(student)}
                    style={{
                      border: student.you ? "2px solid var(--accent-yellow)" : "1px solid rgba(0,0,0,0.06)",
                      background: student.you ? "rgba(251,191,36,0.06)" : "#fff",
                      cursor: "pointer",
                      transition: "box-shadow 0.15s, transform 0.15s",
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 16px rgba(0,0,0,0.1)"; (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = ""; (e.currentTarget as HTMLElement).style.transform = ""; }}
                  >
                    <div className="db-project-info">
                      <div
                        className="db-project-icon"
                        style={{ fontWeight: "900", background: rankBg, color: rankColor, fontSize: idx < 3 ? "18px" : "13px", minWidth: "40px", borderRadius: "10px" }}
                      >
                        {rankIcon}
                      </div>
                      <div>
                        <h4 className="db-project-name" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          {student.name}
                          {student.you && (
                            <span style={{ fontSize: "10px", fontWeight: "800", backgroundColor: "var(--accent-yellow)", color: "#000", padding: "1px 8px", borderRadius: "20px" }}>YOU</span>
                          )}
                        </h4>
                        <span className="db-project-url">{student.branch || "Student"}{student.enrollmentNumber ? ` · ${student.enrollmentNumber}` : ""}</span>
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <span style={{ fontWeight: "900", fontSize: "16px", color: student.xp > 0 ? "var(--db-accent-green)" : "var(--db-text-muted)" }}>
                        {student.xp} XP
                      </span>
                    </div>
                  </div>
                );
              })}
              {leaderboard.length === 0 && loading && (
                <div className="db-project-row" style={{ justifyContent: "center", color: "var(--db-text-muted)" }}>Loading participants...</div>
              )}
              {leaderboard.length === 0 && !loading && (
                <div className="db-project-row" style={{ justifyContent: "center", color: "var(--db-text-muted)" }}>No participants yet.</div>
              )}
            </div>
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
    </div>
  );
}
