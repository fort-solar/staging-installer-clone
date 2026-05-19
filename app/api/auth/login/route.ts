import { NextRequest, NextResponse } from "next/server";
import {
  buildErrorResponse,
  fetchFortsolar,
  getPayloadMessage,
  parseServerPayload,
  syncAuthCookiesFromLogin,
} from "@/lib/api/server";
import { clearAuthCookies } from "@/lib/auth/session";
import type { ApiErrorResponse, LoginApiResponse } from "@/types/api.types";

type LoginRequestBody = {
  email?: string;
  password?: string;
};

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as LoginRequestBody | null;

  if (!body?.email || !body.password) {
    return buildErrorResponse("Email and password are required.", 400);
  }

  const upstream = await fetchFortsolar("/api/v1/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const payload = await parseServerPayload<LoginApiResponse | ApiErrorResponse>(upstream);

  if (!upstream.ok || !payload || payload.success === false) {
    return buildErrorResponse(
      getPayloadMessage(payload, "We could not sign you in."),
      upstream.status || 400,
    );
  }

  const cookieCarrier = new NextResponse();

  try {
    await syncAuthCookiesFromLogin(cookieCarrier, payload, "installer");
  } catch (error) {
    clearAuthCookies(cookieCarrier.cookies);
    return buildErrorResponse(
      error instanceof Error ? error.message : "Unable to start your session.",
      500,
    );
  }

  const response = NextResponse.json(payload);
  cookieCarrier.cookies.getAll().forEach((cookie) => {
    response.cookies.set(cookie);
  });

  return response;
}
