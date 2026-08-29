import { NextRequest, NextResponse } from "next/server";
import {
  ADMIN_COOKIE_NAME,
  SESSION_TTL_SECONDS,
  adminPasswordMatches,
  createAdminSessionToken,
} from "@/lib/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { password?: unknown };
    const password = typeof body.password === "string" ? body.password : "";

    if (!password) {
      return NextResponse.json(
        { success: false, error: "Password is required." },
        { status: 400 },
      );
    }

    if (!adminPasswordMatches(password)) {
      console.warn("[admin-auth] login_failed");
      return NextResponse.json(
        { success: false, error: "Invalid password." },
        { status: 401 },
      );
    }

    const response = NextResponse.json({ success: true });
    response.cookies.set({
      name: ADMIN_COOKIE_NAME,
      value: createAdminSessionToken(),
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: SESSION_TTL_SECONDS,
    });

    console.info("[admin-auth] login_succeeded");
    return response;
  } catch (error) {
    console.error("[admin-auth] login_error", error);
    return NextResponse.json(
      { success: false, error: "Admin login is temporarily unavailable." },
      { status: 500 },
    );
  }
}
