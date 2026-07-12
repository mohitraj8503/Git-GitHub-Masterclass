import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { getSession } from "@/lib/session";

const DATA_DIR = path.join(process.cwd(), "data");
const XP_AWARDS_FILE = path.join(DATA_DIR, "xp_awards.json");
const REGISTRATIONS_FILE = path.join(DATA_DIR, "registrations.json");

// Helper to write to local JSON files safely
function writeJsonFile(filePath: string, data: any) {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== "admin") {
      return NextResponse.json({ success: false, error: "Unauthorized: Admins only." }, { status: 401 });
    }

    const { enrollmentNumber, amount, reason } = await request.json();

    if (!enrollmentNumber || amount === undefined || !reason || !reason.trim()) {
      return NextResponse.json({ success: false, error: "Missing enrollment number, amount, or reason." }, { status: 400 });
    }

    const parsedAmount = parseInt(amount, 10);
    if (isNaN(parsedAmount)) {
      return NextResponse.json({ success: false, error: "Amount must be a valid integer." }, { status: 400 });
    }

    const awardedBy = session.name || session.email || "Admin";

    if (supabaseAdmin) {
      // Find student ID from registrations
      const { data: student, error: studentError } = await supabaseAdmin
        .from("registrations")
        .select("id, total_xp")
        .eq("enrollment_number", enrollmentNumber.trim().toUpperCase())
        .maybeSingle();

      if (studentError || !student) {
        return NextResponse.json({ success: false, error: "Student not found in Supabase." }, { status: 404 });
      }

      // Insert award
      const { data: awardData, error: awardError } = await supabaseAdmin
        .from("xp_awards")
        .insert({
          student_id: student.id,
          amount: parsedAmount,
          reason: reason.trim(),
          awarded_by: awardedBy
        })
        .select()
        .single();

      if (awardError) {
        return NextResponse.json({ success: false, error: awardError.message }, { status: 500 });
      }

      // Keep total_xp cached in registrations table
      const newTotal = (student.total_xp || 0) + parsedAmount;
      await supabaseAdmin
        .from("registrations")
        .update({ total_xp: newTotal })
        .eq("id", student.id);

      return NextResponse.json({ success: true, award: awardData });
    }

    // === Local JSON Fallback ===
    if (!fs.existsSync(REGISTRATIONS_FILE)) {
      return NextResponse.json({ success: false, error: "Local registrations database not found." }, { status: 404 });
    }

    const registrations = JSON.parse(fs.readFileSync(REGISTRATIONS_FILE, "utf8"));
    const studentIdx = registrations.findIndex(
      (r: any) => (r.enrollmentNumber || r.enrollment_number || "").trim().toUpperCase() === enrollmentNumber.trim().toUpperCase()
    );

    if (studentIdx === -1) {
      return NextResponse.json({ success: false, error: "Student not found locally." }, { status: 404 });
    }

    const student = registrations[studentIdx];
    const studentId = student.id || student.enrollmentNumber;

    let awards = [];
    if (fs.existsSync(XP_AWARDS_FILE)) {
      awards = JSON.parse(fs.readFileSync(XP_AWARDS_FILE, "utf8"));
    }

    const newAward = {
      id: crypto.randomUUID(),
      student_id: studentId,
      amount: parsedAmount,
      reason: reason.trim(),
      awarded_by: awardedBy,
      created_at: new Date().toISOString()
    };

    awards.push(newAward);
    writeJsonFile(XP_AWARDS_FILE, awards);

    // Keep cached total_xp in registrations.json
    const oldXp = student.total_xp || student.totalXp || 0;
    registrations[studentIdx].total_xp = oldXp + parsedAmount;
    writeJsonFile(REGISTRATIONS_FILE, registrations);

    return NextResponse.json({ success: true, award: newAward });

  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== "admin") {
      return NextResponse.json({ success: false, error: "Unauthorized: Admins only." }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const enrollmentNumber = searchParams.get("enrollmentNumber");

    if (!enrollmentNumber) {
      return NextResponse.json({ success: false, error: "Missing enrollmentNumber parameter." }, { status: 400 });
    }

    if (supabaseAdmin) {
      // Find student ID
      const { data: student, error: studentError } = await supabaseAdmin
        .from("registrations")
        .select("id")
        .eq("enrollment_number", enrollmentNumber.trim().toUpperCase())
        .maybeSingle();

      if (studentError || !student) {
        return NextResponse.json({ success: true, awards: [] });
      }

      // Fetch awards
      const { data: awards, error: awardsError } = await supabaseAdmin
        .from("xp_awards")
        .select("*")
        .eq("student_id", student.id)
        .order("created_at", { ascending: false });

      if (awardsError) {
        return NextResponse.json({ success: false, error: awardsError.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, awards: awards || [] });
    }

    // === Local JSON Fallback ===
    if (!fs.existsSync(REGISTRATIONS_FILE)) {
      return NextResponse.json({ success: true, awards: [] });
    }

    const registrations = JSON.parse(fs.readFileSync(REGISTRATIONS_FILE, "utf8"));
    const student = registrations.find(
      (r: any) => (r.enrollmentNumber || r.enrollment_number || "").trim().toUpperCase() === enrollmentNumber.trim().toUpperCase()
    );

    if (!student) {
      return NextResponse.json({ success: true, awards: [] });
    }

    const studentId = student.id || student.enrollmentNumber;

    if (!fs.existsSync(XP_AWARDS_FILE)) {
      return NextResponse.json({ success: true, awards: [] });
    }

    const awards = JSON.parse(fs.readFileSync(XP_AWARDS_FILE, "utf8"));
    const filteredAwards = awards
      .filter((a: any) => (a.student_id === studentId || a.studentId === studentId))
      .sort((a: any, b: any) => new Date(b.created_at || b.createdAt).getTime() - new Date(a.created_at || a.createdAt).getTime());

    return NextResponse.json({ success: true, awards: filteredAwards });

  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
