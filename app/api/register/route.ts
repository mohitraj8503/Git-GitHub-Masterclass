import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { supabaseAdmin } from "@/lib/supabaseServer";

const DATA_DIR = path.join(process.cwd(), "data");
const FILE_PATH = path.join(DATA_DIR, "registrations.json");

async function findExistingRegistrationByEmail(email: string) {
  const normalizedEmail = email.trim().toLowerCase();

  if (supabaseAdmin) {
    try {
      const { data, error } = await supabaseAdmin
        .from("registrations")
        .select("id, email, google_id, github_id")
        .eq("email", normalizedEmail)
        .maybeSingle();

      if (!error && data) {
        return data;
      }
    } catch (e) {
      console.error("Supabase duplicate-email lookup failed:", e);
    }
  }

  if (!fs.existsSync(FILE_PATH)) {
    return null;
  }

  try {
    const registrations = JSON.parse(fs.readFileSync(FILE_PATH, "utf8"));
    return registrations.find((reg: any) => reg.email && reg.email.toLowerCase() === normalizedEmail) || null;
  } catch (e) {
    console.error("Fallback duplicate-email lookup failed:", e);
    return null;
  }
}

const TASK_XP_REWARDS: Record<string, number> = {
  mark_attendance: 20,
  download_slides: 10,
  complete_assignment: 40,
  push_github: 20,
  fill_feedback: 10,
};

export async function GET() {
  try {
    if (supabaseAdmin) {
      // 1. Fetch registrations
      const { data: regs, error: regsErr } = await supabaseAdmin
        .from("registrations")
        .select("*")
        .order("registered_at", { ascending: false });

      if (!regsErr && regs) {
        // 2. Fetch task completions
        const { data: completions } = await supabaseAdmin
          .from("task_completions")
          .select("enrollment_number, task_id");

        // 3. Fetch manual awards
        const { data: awards } = await supabaseAdmin
          .from("xp_awards")
          .select("student_id, amount");

        // Map task completions
        const completionsMap: Record<string, number> = {};
        (completions || []).forEach((c: any) => {
          const key = (c.enrollment_number || "").trim().toUpperCase();
          const reward = TASK_XP_REWARDS[c.task_id] || 0;
          completionsMap[key] = (completionsMap[key] || 0) + reward;
        });

        // Map manual awards
        const awardsMap: Record<string, number> = {};
        (awards || []).forEach((a: any) => {
          const key = a.student_id;
          awardsMap[key] = (awardsMap[key] || 0) + (a.amount || 0);
        });

        // Compute dynamic total_xp
        const enrichedRegs = regs.map((r: any) => {
          const keyComp = (r.enrollment_number || "").trim().toUpperCase();
          const keyAward = r.id;
          const compXp = completionsMap[keyComp] || 0;
          const awardXp = awardsMap[keyAward] || 0;
          return {
            ...r,
            total_xp: compXp + awardXp
          };
        });

        return NextResponse.json({ success: true, registrations: enrichedRegs });
      }
      console.warn("Supabase registrations query failed, falling back to local file. Error:", regsErr);
    }

    // Local JSON Fallback
    const filePath = path.join(process.cwd(), "data", "registrations.json");
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ success: true, registrations: [] });
    }

    const registrations = JSON.parse(fs.readFileSync(filePath, "utf8"));
    
    // Fetch local task completions
    const completionsPath = path.join(process.cwd(), "data", "task_completions.json");
    let completionsLocal: any[] = [];
    if (fs.existsSync(completionsPath)) {
      completionsLocal = JSON.parse(fs.readFileSync(completionsPath, "utf8"));
    }

    // Fetch local manual awards
    const awardsPath = path.join(process.cwd(), "data", "xp_awards.json");
    let awardsLocal: any[] = [];
    if (fs.existsSync(awardsPath)) {
      awardsLocal = JSON.parse(fs.readFileSync(awardsPath, "utf8"));
    }

    // Map task completions
    const completionsMap: Record<string, number> = {};
    completionsLocal.forEach((c: any) => {
      const key = (c.enrollmentNumber || c.enrollment_number || "").trim().toUpperCase();
      const reward = TASK_XP_REWARDS[c.taskId || c.task_id] || 0;
      completionsMap[key] = (completionsMap[key] || 0) + reward;
    });

    // Map manual awards
    const awardsMap: Record<string, number> = {};
    awardsLocal.forEach((a: any) => {
      const key = a.student_id || a.studentId;
      awardsMap[key] = (awardsMap[key] || 0) + (a.amount || 0);
    });

    const enrichedRegsLocal = registrations.map((r: any) => {
      const keyComp = (r.enrollmentNumber || r.enrollment_number || "").trim().toUpperCase();
      const keyAward = r.id || r.enrollmentNumber;
      const compXp = completionsMap[keyComp] || 0;
      const awardXp = awardsMap[keyAward] || 0;
      return {
        ...r,
        total_xp: compXp + awardXp
      };
    });

    return NextResponse.json({ success: true, registrations: enrichedRegsLocal });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      name,
      enrollmentNumber,
      email,
      phoneNumber,
      branch,
      yearOfStudy,
      sectionClass,
      gitExperience,
      githubUsername,
      hasLaptop,
      hasGithubAccount,
      availableAllDays,
      joiningReason,
      agreeCodeOfConduct,
    } = body;

    // Server-side validation
    if (!name || !name.trim()) {
      return NextResponse.json({ success: false, error: "Full Name is required." }, { status: 400 });
    }
    if (!enrollmentNumber || !enrollmentNumber.trim()) {
      return NextResponse.json({ success: false, error: "Enrollment Number is required." }, { status: 400 });
    }
    if (!email || !email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ success: false, error: "A valid Email Address is required." }, { status: 400 });
    }
    if (!phoneNumber || !phoneNumber.trim()) {
      return NextResponse.json({ success: false, error: "Phone Number (WhatsApp) is required." }, { status: 400 });
    }
    if (!branch || !branch.trim()) {
      return NextResponse.json({ success: false, error: "Branch / Department is required." }, { status: 400 });
    }
    if (!yearOfStudy || !["1st Year", "2nd Year", "3rd Year", "4th Year"].includes(yearOfStudy)) {
      return NextResponse.json({ success: false, error: "Year of Study is required." }, { status: 400 });
    }
    if (!gitExperience) {
      return NextResponse.json({ success: false, error: "Please indicate if you have used Git/GitHub before." }, { status: 400 });
    }
    if (!hasLaptop) {
      return NextResponse.json({ success: false, error: "Please indicate if you can bring a laptop." }, { status: 400 });
    }
    if (!hasGithubAccount) {
      return NextResponse.json({ success: false, error: "Please indicate if you have a GitHub account." }, { status: 400 });
    }
    if (!availableAllDays) {
      return NextResponse.json({ success: false, error: "Please indicate your availability." }, { status: 400 });
    }
    if (!agreeCodeOfConduct) {
      return NextResponse.json({ success: false, error: "You must agree to the Code of Conduct to register." }, { status: 400 });
    }

    const newId = Date.now().toString();
    const cleanEmail = email.trim().toLowerCase();
    const cleanEnrollment = enrollmentNumber.trim();

    const existingRegistration = await findExistingRegistrationByEmail(cleanEmail);
    if (existingRegistration) {
      let message = "An account with this email already exists. Please log in instead.";
      if (existingRegistration.google_id) {
        message = "An account with this email already exists. This account uses Google Sign-In. Please log in with Google instead.";
      } else if (existingRegistration.github_id) {
        message = "An account with this email already exists. This account uses GitHub Sign-In. Please log in with GitHub instead.";
      }
      return NextResponse.json({ success: false, error: message }, { status: 409 });
    }

    // Check if Supabase client is available
    if (supabaseAdmin) {
      console.log("Supabase client initialized. Persisting to Supabase database...");

      // 1. Check duplicate email in Supabase
      const { data: emailCheck, error: emailErr } = await supabaseAdmin
        .from("registrations")
        .select("id")
        .eq("email", cleanEmail)
        .maybeSingle();

      if (emailErr) {
        console.error("Supabase email query error:", emailErr);
        return NextResponse.json({ success: false, error: "Database error. Please try again." }, { status: 500 });
      }
      if (emailCheck) {
        return NextResponse.json({ success: false, error: "This email address is already registered." }, { status: 400 });
      }

      // 2. Check duplicate enrollment number in Supabase
      const { data: enrollmentCheck, error: enrollmentErr } = await supabaseAdmin
        .from("registrations")
        .select("id")
        .eq("enrollment_number", cleanEnrollment)
        .maybeSingle();

      if (enrollmentErr) {
        console.error("Supabase enrollment query error:", enrollmentErr);
        return NextResponse.json({ success: false, error: "Database error. Please try again." }, { status: 500 });
      }
      if (enrollmentCheck) {
        return NextResponse.json({ success: false, error: "This enrollment number is already registered." }, { status: 400 });
      }

      // 3. Insert record into Supabase
      const { error: insertErr } = await supabaseAdmin
        .from("registrations")
        .insert({
          id: newId,
          name: name.trim(),
          enrollment_number: cleanEnrollment,
          email: cleanEmail,
          phone_number: phoneNumber.trim(),
          branch: branch.trim(),
          year_of_study: yearOfStudy,
          section_class: sectionClass ? sectionClass.trim() : null,
          git_experience: gitExperience,
          has_laptop: hasLaptop,
          has_github_account: hasGithubAccount,
          available_all_days: availableAllDays,
          joining_reason: joiningReason ? joiningReason.trim() : null,
        });

      if (insertErr) {
        console.error("Supabase insert error:", insertErr);
        return NextResponse.json({ success: false, error: "Failed to save registration in Supabase database." }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        message: "Registration completed successfully and saved to Supabase!",
      });
    }

    // Fallback: Local JSON persistence if Supabase environment variables are missing
    console.warn("Supabase credentials missing. Falling back to local data/registrations.json persistence.");

    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    let registrations = [];
    if (fs.existsSync(FILE_PATH)) {
      try {
        const fileContent = fs.readFileSync(FILE_PATH, "utf8");
        registrations = JSON.parse(fileContent);
      } catch (err) {
        console.error("Error reading registrations file, resetting:", err);
      }
    }

    const emailExists = registrations.some(
      (reg: any) => reg.email.toLowerCase() === cleanEmail
    );
    if (emailExists) {
      return NextResponse.json({ success: false, error: "This email address is already registered." }, { status: 400 });
    }

    const enrollmentExists = registrations.some(
      (reg: any) => reg.enrollmentNumber.trim().toLowerCase() === cleanEnrollment.toLowerCase()
    );
    if (enrollmentExists) {
      return NextResponse.json({ success: false, error: "This enrollment number is already registered." }, { status: 400 });
    }

    const newEntry = {
      id: newId,
      name: name.trim(),
      enrollmentNumber: cleanEnrollment,
      email: cleanEmail,
      phoneNumber: phoneNumber.trim(),
      branch: branch.trim(),
      yearOfStudy,
      sectionClass: sectionClass ? sectionClass.trim() : "",
      gitExperience,
      githubUsername: githubUsername ? githubUsername.trim() : "",
      hasLaptop,
      hasGithubAccount,
      availableAllDays,
      joiningReason: joiningReason ? joiningReason.trim() : "",
      agreeCodeOfConduct,
      registeredAt: new Date().toISOString(),
    };

    registrations.push(newEntry);
    fs.writeFileSync(FILE_PATH, JSON.stringify(registrations, null, 2), "utf8");

    return NextResponse.json({
      success: true,
      message: "Registration completed successfully! (Saved locally)",
    });
  } catch (error: any) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error. Please try again." },
      { status: 500 }
    );
  }
}
