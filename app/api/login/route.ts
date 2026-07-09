import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { supabase } from "@/lib/supabaseClient";

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();
    if (!username || !password) {
      return NextResponse.json({ success: false, error: "Please enter both Username (Enrollment Number) and Password (Phone Number)." }, { status: 400 });
    }

    const cleanUsername = username.trim().toUpperCase();
    const cleanPassword = password.trim();

    // 1. Try Supabase
    if (supabase) {
      const { data: profile, error } = await supabase
        .from("registrations")
        .select("*")
        .eq("enrollment_number", cleanUsername)
        .eq("phone_number", cleanPassword)
        .maybeSingle();

      if (profile && !error) {
        return NextResponse.json({
          success: true,
          user: {
            name: profile.name,
            enrollmentNumber: profile.enrollment_number,
            email: profile.email,
            branch: profile.branch || "CS",
            yearOfStudy: profile.year_of_study || "1st Year",
          }
        });
      }
    }

    // 2. Try Fallback JSON
    const dataDir = path.join(process.cwd(), "data");
    const regFilePath = path.join(dataDir, "registrations.json");

    if (fs.existsSync(regFilePath)) {
      const fileData = fs.readFileSync(regFilePath, "utf8");
      const registrations = JSON.parse(fileData);

      const found = registrations.find(
        (r: any) =>
          r.enrollmentNumber && r.enrollmentNumber.trim().toUpperCase() === cleanUsername &&
          r.phoneNumber && r.phoneNumber.trim() === cleanPassword
      );

      if (found) {
        return NextResponse.json({
          success: true,
          user: found
        });
      }
    }

    return NextResponse.json({ success: false, error: "Invalid Enrollment Number or Phone Number." }, { status: 401 });
  } catch (error) {
    console.error("Login Error:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
