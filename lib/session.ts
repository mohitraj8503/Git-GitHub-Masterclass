import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const SECRET_KEY = new TextEncoder().encode(
  process.env.ADMIN_SESSION_SECRET || "githubpages-masterclass-admin-secret-key-default-32-chars"
);

export async function encrypt(payload: any) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(SECRET_KEY);
}

export async function decrypt(input: string): Promise<any> {
  try {
    const { payload } = await jwtVerify(input, SECRET_KEY, {
      algorithms: ["HS256"],
    });
    return payload;
  } catch (e) {
    return null;
  }
}

export async function getSession(req?: NextRequest) {
  let session = "";
  if (req) {
    session = req.cookies.get("admin_session")?.value || "";
  } else {
    const cookieStore = await cookies();
    session = cookieStore.get("admin_session")?.value || "";
  }
  if (!session) return null;
  return await decrypt(session);
}

export async function setAdminSession(user: any) {
  const session = await encrypt({
    email: user.email,
    name: user.name,
    role: "admin",
  });
  const cookieStore = await cookies();
  cookieStore.set("admin_session", session, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24, // 24 hours
  });
}

export async function clearAdminSession() {
  const cookieStore = await cookies();
  cookieStore.set("admin_session", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}
