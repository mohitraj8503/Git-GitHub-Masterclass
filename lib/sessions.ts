// Shared 7-Day Curriculum Configuration and Session Status helper.
// Acts as the single source of truth for both admin dashboard and student dashboard views.

export interface ScheduleDay {
  day: number;
  date: string;
  time: string;
  title: string;
  desc: string;
}

export const SCHEDULE_DAYS: ScheduleDay[] = [
  { day: 1, date: "2026-07-15", time: "12:30 PM – 1:30 PM", title: "Why Version Control? Setup & First Repo", desc: "Understanding Git as version control, installing Git, creating a GitHub account, and making your first repository." },
  { day: 2, date: "2026-07-16", time: "12:30 PM – 1:30 PM", title: "Git Basics — Commits, Staging & Logs", desc: "Hands-on with git init, add, commit, status, and log — building real commit history on your portfolio project." },
  { day: 3, date: "2026-07-17", time: "12:30 PM – 1:30 PM", title: "Branching Strategies & Resolving Conflicts", desc: "Creating branches, merging safely, and resolving a real merge conflict live in the Conflict Arena challenge." },
  { day: 4, date: "2026-07-18", time: "12:30 PM – 1:30 PM", title: "Going Remote — Push, Pull & First Deploy", desc: "Connecting to GitHub remotely and deploying your portfolio live via GitHub Pages for the first time." },
  { day: 5, date: "2026-07-19", time: "12:30 PM – 1:30 PM", title: "Pull Requests, Issues & Forking", desc: "Forking a shared repository, opening your first Pull Request, and going through a live PR review." },
  { day: 6, date: "2026-07-20", time: "12:30 PM – 1:30 PM", title: "Repo Hygiene, Deployment Polish & Industry Guest", desc: "Cleaning up your repo with .gitignore and a strong README, finalizing your deployed site, with an invited industry guest talk." },
  { day: 7, date: "2026-07-21", time: "12:30 PM – 1:30 PM", title: "Open Source Demo Day & Community Launch", desc: "Live merging of Pull Requests, final project demos, and the launch of the ongoing AJU GitHub community. No certificates are issued — the outcomes are your live deployed portfolio and merged contribution." },
];

export const STATUS_LABEL: Record<string, string> = {
  COMPLETED: "Completed",
  TODAY: "Today · Live",
  UPCOMING: "Upcoming",
  MISSED: "Session Passed",
};

/**
 * Calculates the status of a specific day relative to today's date and whether it was attended.
 */
export function getDayStatus(day: number, dateStr: string, attendedDays: number[]): "COMPLETED" | "TODAY" | "MISSED" | "UPCOMING" {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const session = new Date(`${dateStr}T00:00:00`);
  const sessionStart = new Date(session.getFullYear(), session.getMonth(), session.getDate());
  
  const attended = attendedDays.includes(day);

  if (todayStart.getTime() === sessionStart.getTime()) return "TODAY";
  if (attended) return "COMPLETED";
  if (todayStart.getTime() > sessionStart.getTime()) return "MISSED";
  return "UPCOMING";
}
