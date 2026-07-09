// Central configuration for the Git & GitHub Masterclass app.
// Single source of truth for values that were previously hardcoded as magic
// strings/arrays across the dashboard and admin console.

/** Institution code used in student pass IDs and session codes (e.g. #AJU-…, SESSION-DAY-x-AJU-ACTIVE). */
export const INSTITUTION_CODE = "AJU";

/** Total length of the workshop in days. Drives the attendance day selectors and schedule copy. */
export const WORKSHOP_DAYS = 7;

/** Default maximum marks for a newly created assignment. */
export const DEFAULT_ASSIGNMENT_MAX_MARKS = 10;

/** Default category for a newly created announcement. */
export const DEFAULT_ANNOUNCEMENT_TYPE = "general";

/** Neutral fallback shown when a student's branch/department is not recorded. */
export const UNKNOWN_BRANCH_LABEL = "Not specified";

/** Duration of an admin-opened attendance check-in window, in minutes.
 *  Configurable per session — bump this if 5 minutes proves too tight for
 *  real classroom conditions (slow wifi, students opening the app). The
 *  "time-boxed, admin-triggered, server-validated" model is unchanged. */
export const ATTENDANCE_WINDOW_MINUTES = 5;
