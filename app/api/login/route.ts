import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import bcrypt from "bcryptjs";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { setAdminSession } from "@/lib/session";

const normalizeEnrollmentNumber = (enrollment: string) => {
  const clean = enrollment.trim().toUpperCase();
  const digits = clean.replace(/\D/g, "");
  if (digits) {
    return `AJU/${digits}`;
  }
  return clean;
};

const normalizePhoneNumber = (phone: string) => {
  let digits = phone.replace(/\D/g, "").trim();
  if (digits.length === 12 && digits.startsWith("91")) {
    digits = digits.substring(2);
  } else if (digits.length === 11 && digits.startsWith("0")) {
    digits = digits.substring(1);
  }
  return digits;
};

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();
    if (!username || !password) {
      return NextResponse.json({ success: false, error: "Please enter both Username/Email and Password." }, { status: 400 });
    }

    const cleanUsername = username.trim();
    const cleanPassword = password.trim();

    // ---- ADMIN AUTH FLOW ----
    if (cleanUsername.toLowerCase() === "admin@githubpages.in") {
      let adminRecord = null;

      // 1. Try Supabase admins table
      if (supabaseAdmin) {
        try {
          const { data, error } = await supabaseAdmin
            .from("admins")
            .select("*")
            .eq("email", cleanUsername.toLowerCase())
            .maybeSingle();

          if (data && !error) {
            adminRecord = data;
          }
        } catch (e) {
          console.warn("Supabase admins query failed, trying local fallback:", e);
        }
      }

      // 2. Try Fallback JSON
      if (!adminRecord) {
        const dataDir = path.join(process.cwd(), "data");
        const adminFilePath = path.join(dataDir, "admins.json");

        if (fs.existsSync(adminFilePath)) {
          const fileData = fs.readFileSync(adminFilePath, "utf8");
          const admins = JSON.parse(fileData);
          adminRecord = admins.find(
            (a: any) => a.email.toLowerCase() === cleanUsername.toLowerCase()
          );
        }
      }

      if (adminRecord) {
        const passwordMatch = await bcrypt.compare(cleanPassword, adminRecord.password_hash);
        if (passwordMatch) {
          const adminUser = {
            name: adminRecord.name || "Admin",
            email: adminRecord.email,
            role: "admin",
          };
          await setAdminSession(adminUser);
          return NextResponse.json({
            success: true,
            user: adminUser,
          });
        }
      }

      return NextResponse.json({ success: false, error: "Invalid Admin Email or Password." }, { status: 401 });
    }

    // ---- STUDENT AUTH FLOW ----
    const targetEnrollment = normalizeEnrollmentNumber(cleanUsername);
    const targetPhone = normalizePhoneNumber(cleanPassword);

    // 1. Try Supabase
    if (supabaseAdmin) {
      const { data: profile, error } = await supabaseAdmin
        .from("registrations")
        .select("*")
        .eq("enrollment_number", targetEnrollment)
        .maybeSingle();

      if (profile && !error) {
        const cleanDbPhone = normalizePhoneNumber(profile.phone_number || "");

        if (cleanDbPhone === targetPhone) {
          return NextResponse.json({
            success: true,
            user: {
              name: profile.name,
              enrollmentNumber: profile.enrollment_number,
              email: profile.email,
              branch: profile.branch || "CS",
              yearOfStudy: profile.year_of_study || "1st Year",
              role: "student",
            }
          });
        }
      }
    }

    // 2. Try Fallback JSON
    const dataDir = path.join(process.cwd(), "data");
    const regFilePath = path.join(dataDir, "registrations.json");

    if (fs.existsSync(regFilePath)) {
      const fileData = fs.readFileSync(regFilePath, "utf8");
      const registrations = JSON.parse(fileData);

      const found = registrations.find((r: any) => {
        const rEnroll = normalizeEnrollmentNumber(r.enrollmentNumber || r.enrollment_number || "");
        const rPhone = normalizePhoneNumber(r.phoneNumber || r.phone_number || "");
        return rEnroll === targetEnrollment && rPhone === targetPhone;
      });

      if (found) {
        return NextResponse.json({
          success: true,
          user: {
            ...found,
            role: "student",
          }
        });
      }
    }

    return NextResponse.json({ success: false, error: "Invalid Enrollment Number or Phone Number." }, { status: 401 });
  } catch (error) {
    console.error("Login Error:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
