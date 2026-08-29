import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type UpstreamMember = {
  ID?: string;
  RecordDate?: string;
  Name?: string;
  Email?: string;
  Phone?: string;
  CreatedAt?: string;
  UpdatedAt?: string;
};

type UpstreamAttendance = {
  ID?: string;
  MemberID?: string;
  RecordDate?: string;
  EventName?: string;
  Rating?: string;
  Suggestion?: string;
  Member?: UpstreamMember | null;
  CreatedAt?: string;
  UpdatedAt?: string;
};

type AttendanceRow = {
  id: string;
  memberId: string;
  name: string;
  email: string;
  phone: string;
  eventName: string;
  rating: string;
  suggestion: string;
  recordDate: string;
  memberSince: string;
};

const baseURL = process.env.BASE_URL?.trim();
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function normalizeRecord(record: UpstreamAttendance): AttendanceRow {
  return {
    id: String(record.ID ?? ""),
    memberId: String(record.MemberID ?? record.Member?.ID ?? ""),
    name: String(record.Member?.Name ?? "").trim(),
    email: String(record.Member?.Email ?? "").trim(),
    phone: String(record.Member?.Phone ?? "").trim(),
    eventName: String(record.EventName ?? "").trim(),
    rating: String(record.Rating ?? "").trim(),
    suggestion: String(record.Suggestion ?? "").trim(),
    recordDate: String(record.RecordDate ?? record.CreatedAt ?? ""),
    memberSince: String(record.Member?.RecordDate ?? record.Member?.CreatedAt ?? ""),
  };
}

export async function GET(request: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json(
      { success: false, error: "Unauthorized." },
      { status: 401 },
    );
  }

  const date = request.nextUrl.searchParams.get("date")?.trim() ?? "";

  if (!DATE_RE.test(date)) {
    return NextResponse.json(
      { success: false, error: "A valid date in YYYY-MM-DD format is required." },
      { status: 400 },
    );
  }

  if (!baseURL) {
    console.error("[admin-attendance] configuration_error", {
      reason: "BASE_URL is missing",
    });

    return NextResponse.json(
      { success: false, error: "Attendance service is not configured." },
      { status: 500 },
    );
  }

  const url = `${baseURL.replace(/\/+$/, "")}/api/v1/registrations/attendance?date=${encodeURIComponent(date)}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);
  const startedAt = Date.now();

  try {
    const upstream = await fetch(url, {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "no-store",
      signal: controller.signal,
    });

    const raw = await upstream.text();
    let parsed: { success?: boolean; data?: UpstreamAttendance[]; error?: string | null } | null = null;

    try {
      parsed = raw ? JSON.parse(raw) : null;
    } catch {
      parsed = null;
    }

    if (!upstream.ok || !parsed?.success) {
      console.warn("[admin-attendance] upstream_rejected", {
        status: upstream.status,
        date,
        durationMs: Date.now() - startedAt,
      });

      return NextResponse.json(
        {
          success: false,
          error:
            typeof parsed?.error === "string" && parsed.error.trim()
              ? parsed.error
              : "Unable to fetch attendance for the selected date.",
        },
        { status: upstream.status >= 500 ? 502 : upstream.status || 502 },
      );
    }

    const rows = Array.isArray(parsed.data)
      ? parsed.data.map(normalizeRecord)
      : [];

    console.info("[admin-attendance] report_loaded", {
      date,
      records: rows.length,
      durationMs: Date.now() - startedAt,
    });

    return NextResponse.json(
      { success: true, data: rows },
      {
        status: 200,
        headers: { "Cache-Control": "no-store" },
      },
    );
  } catch (error) {
    const timedOut = error instanceof Error && error.name === "AbortError";

    console.error("[admin-attendance] fetch_failed", {
      date,
      durationMs: Date.now() - startedAt,
      reason: error instanceof Error ? error.message : "Unknown error",
    });

    return NextResponse.json(
      {
        success: false,
        error: timedOut
          ? "Attendance service took too long to respond."
          : "Could not reach the attendance service.",
      },
      { status: timedOut ? 504 : 502 },
    );
  } finally {
    clearTimeout(timeout);
  }
}
