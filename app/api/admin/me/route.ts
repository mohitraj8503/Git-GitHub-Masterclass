import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== "admin") {
      return NextResponse.json({ success: false, error: "Unauthorized: Admins only." }, { status: 401 });
    }

    return NextResponse.json({
      success: true,
      user: {
        email: session.email,
        name: session.name,
        role: "admin",
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Unauthorized" }, { status: 401 });
  }
}
