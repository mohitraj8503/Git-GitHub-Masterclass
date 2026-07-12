import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import bcrypt from "bcryptjs";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { setAdminSession } from "@/lib/session";

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
    const uppercaseUsername = cleanUsername.toUpperCase();

    // 1. Try Supabase
    if (supabaseAdmin) {
      const { data: profile, error } = await supabaseAdmin
        .from("registrations")
        .select("*")
        .eq("enrollment_number", uppercaseUsername)
        .maybeSingle();

      if (profile && !error) {
        const cleanDbPhone = (profile.phone_number || "").replace(/^(\+91|0)/, "").trim();
        const cleanInputPhone = cleanPassword.replace(/^(\+91|0)/, "").trim();

        if (cleanDbPhone === cleanInputPhone) {
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

      const found = registrations.find(
        (r: any) =>
          r.enrollmentNumber && r.enrollmentNumber.trim().toUpperCase() === uppercaseUsername &&
          r.phoneNumber && r.phoneNumber.trim() === cleanPassword
      );

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
