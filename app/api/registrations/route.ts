import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RegisterMemberRequest = {
  Name: string;
  Email: string;
  Phone: string;
  Type: string;
  EventName: string;
  Rating: string;
  LookingForwardTo: string;
  Suggestion: string;
};

type UpstreamRegistrationResponse = {
  success: boolean;
  data?: unknown;
  error?: string | null;
};

type ApiErrorBody = {
  success: false;
  error: string;
  requestId: string;
};

const baseURL = process.env.BASE_URL?.trim();

function log(
  level: "info" | "warn" | "error",
  event: string,
  requestId: string,
  data: Record<string, unknown> = {},
) {
  const entry = {
    timestamp: new Date().toISOString(),
    scope: "registration-api",
    event,
    requestId,
    ...data,
  };

  console[level](JSON.stringify(entry));
}

function errorResponse(
  status: number,
  requestId: string,
  error: string,
): NextResponse<ApiErrorBody> {
  return NextResponse.json(
    {
      success: false,
      error,
      requestId,
    },
    {
      status,
      headers: {
        "Cache-Control": "no-store",
        "X-Request-Id": requestId,
      },
    },
  );
}

function normalizePayload(value: unknown): RegisterMemberRequest | null {
  if (!value || typeof value !== "object") return null;

  const body = value as Record<string, unknown>;

  const payload: RegisterMemberRequest = {
    Name: String(body.Name ?? "").trim(),
    Email: String(body.Email ?? "").trim(),
    Phone: String(body.Phone ?? "").trim(),
    Type: String(body.Type ?? "").trim(),
    EventName: String(body.EventName ?? "").trim().toUpperCase(),
    Rating: String(body.Rating ?? "").trim(),
    LookingForwardTo: String(body.LookingForwardTo ?? "").trim(),
    Suggestion: String(body.Suggestion ?? "").trim(),
  };

  if (
    !payload.Name ||
    !payload.Email ||
    !payload.Phone ||
    !payload.Type ||
    !payload.EventName
  ) {
    return null;
  }

  return payload;
}

function buildRegistrationURL(base: string): string {
  return `${base.replace(/\/+$/, "")}/api/v1/registrations`;
}

function parseUpstreamResponse(rawBody: string): UpstreamRegistrationResponse | null {
  if (!rawBody.trim()) return null;

  try {
    return JSON.parse(rawBody) as UpstreamRegistrationResponse;
  } catch {
    return null;
  }
}

function getUpstreamMessage(
  response: UpstreamRegistrationResponse | null,
  rawBody: string,
): string | null {
  if (typeof response?.error === "string" && response.error.trim()) {
    return response.error.trim().slice(0, 300);
  }

  const clean = rawBody.trim();
  if (!clean || /<!doctype|<html/i.test(clean)) return null;

  return clean.slice(0, 300);
}

export async function POST(request: NextRequest) {
  const requestId = request.headers.get("x-request-id") ?? crypto.randomUUID();
  const startedAt = Date.now();

  if (!baseURL) {
    log("error", "configuration_error", requestId, {
      reason: "BASE_URL is missing",
    });

    return errorResponse(
      500,
      requestId,
      "Registration is temporarily unavailable. Please try again later.",
    );
  }

  const registrationURL = buildRegistrationURL(baseURL);

  let payload: RegisterMemberRequest | null;

  try {
    payload = normalizePayload(await request.json());
  } catch (error) {
    log("warn", "invalid_json", requestId, {
      reason: error instanceof Error ? error.message : "Unknown JSON parse error",
    });

    return errorResponse(
      400,
      requestId,
      "The registration data could not be read. Please refresh and try again.",
    );
  }

  if (!payload) {
    log("warn", "validation_failed", requestId);

    return errorResponse(
      400,
      requestId,
      "Please complete all required registration fields and try again.",
    );
  }

  // Deliberately avoid logging name, email and phone.
  log("info", "registration_request_received", requestId, {
    attendeeType: payload.Type,
    eventName: payload.EventName,
    hasRating: Boolean(payload.Rating),
    hasSuggestion: Boolean(payload.Suggestion),
  });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);

  try {
    const upstreamResponse = await fetch(registrationURL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "X-Request-Id": requestId,
      },
      body: JSON.stringify(payload),
      cache: "no-store",
      signal: controller.signal,
    });

    const rawBody = await upstreamResponse.text().catch(() => "");
    const upstreamBody = parseUpstreamResponse(rawBody);

    if (!upstreamResponse.ok) {
      const upstreamMessage = getUpstreamMessage(upstreamBody, rawBody);

      log(upstreamResponse.status >= 500 ? "error" : "warn", "registration_upstream_rejected", requestId, {
        upstreamStatus: upstreamResponse.status,
        durationMs: Date.now() - startedAt,
        upstreamMessage,
      });

      if (upstreamResponse.status >= 400 && upstreamResponse.status < 500) {
        return errorResponse(
          upstreamResponse.status,
          requestId,
          upstreamMessage ||
            "The registration details were not accepted. Please check them and try again.",
        );
      }

      return errorResponse(
        502,
        requestId,
        "The registration service could not complete your request. Please try again shortly.",
      );
    }

    if (upstreamBody && upstreamBody.success === false) {
      log("error", "invalid_upstream_success_response", requestId, {
        upstreamStatus: upstreamResponse.status,
        durationMs: Date.now() - startedAt,
      });

      return errorResponse(
        502,
        requestId,
        "The registration service returned an unexpected response.",
      );
    }

    log("info", "registration_succeeded", requestId, {
      upstreamStatus: upstreamResponse.status,
      durationMs: Date.now() - startedAt,
    });

    return NextResponse.json(
      {
        success: true,
        data:
          typeof upstreamBody?.data === "string"
            ? upstreamBody.data
            : "Registration received successfully.",
        requestId,
      },
      {
        status: 201,
        headers: {
          "Cache-Control": "no-store",
          "X-Request-Id": requestId,
        },
      },
    );
  } catch (error) {
    const isAbortError = error instanceof Error && error.name === "AbortError";

    log(
      "error",
      isAbortError ? "registration_upstream_timeout" : "registration_upstream_unreachable",
      requestId,
      {
        durationMs: Date.now() - startedAt,
        reason: error instanceof Error ? error.message : "Unknown upstream error",
      },
    );

    return errorResponse(
      isAbortError ? 504 : 502,
      requestId,
      isAbortError
        ? "The registration service took too long to respond. Please try again."
        : "We could not reach the registration service. Please try again shortly.",
    );
  } finally {
    clearTimeout(timeout);
  }
}
