import { NextRequest, NextResponse } from "next/server";
import {
  buildErrorResponse,
  fetchFortsolar,
  getPayloadMessage,
  parseServerPayload,
  syncAuthCookiesFromLogin,
} from "@/lib/api/server";
import { clearAuthCookies } from "@/lib/auth/session";
import type { ApiErrorResponse, RegisterApiResponse } from "@/types/api.types";

type RegisterRequestBody = {
  email?: string;
  password?: string;
  name?: string;
  role?: string;
};

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as RegisterRequestBody | null;

  if (!body?.email || !body.password || !body.name) {
    return buildErrorResponse("Name, email, and password are required.", 400);
  }

  const upstream = await fetchFortsolar("/api/v1/auth/register", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: body.email,
      password: body.password,
      name: body.name,
      role: body.role ?? "installer",
    }),
  });
  const payload = await parseServerPayload<RegisterApiResponse | ApiErrorResponse>(upstream);

  if (!upstream.ok || !payload || payload.success === false) {
    return buildErrorResponse(
      getPayloadMessage(payload, "We could not create your account."),
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
