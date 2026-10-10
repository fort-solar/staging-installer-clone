import { NextResponse } from "next/server";
import { extractApiMessage } from "@/lib/api/errors";
import { env } from "@/lib/env";
import {
  createSessionSnapshotFromProfile,
  setAuthCookies,
  setSessionSnapshotCookie,
} from "@/lib/auth/session";
import type {
  ApiErrorResponse,
  AuthMeApiResponse,
  LoginApiResponse,
  PortalRole,
  RefreshTokenApiResponse,
  RegisterApiResponse,
  SessionSnapshot,
} from "@/types/api.types";

type ServerPayload =
  | LoginApiResponse
  | RefreshTokenApiResponse
  | RegisterApiResponse
  | AuthMeApiResponse
  | ApiErrorResponse
  | null;

function buildApiUrl(path: string) {
  const base = (env.apiBaseUrl || "https://api.fortsolar.ng").replace(/\/+$/, "");
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  let normalizedPath = cleanPath;
  if (base.endsWith("/api/v1") && normalizedPath.startsWith("/api/v1")) {
    normalizedPath = normalizedPath.slice("/api/v1".length);
    if (!normalizedPath.startsWith("/")) normalizedPath = `/${normalizedPath}`;
  }
  return `${base}${normalizedPath}`;
}

export function buildErrorResponse(message: string, status = 400, error?: string) {
  return NextResponse.json(
    {
      success: false,
      error: error ?? message,
      message,
    },
    { status },
  );
}

export async function parseServerPayload<T = ServerPayload>(response: Response) {
  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    return response.json().catch(() => null) as Promise<T | null>;
  }

  return null;
}

export async function fetchFortsolar(path: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json");

  return fetch(buildApiUrl(path), {
    ...init,
    headers,
    cache: "no-store",
  });
}

export async function fetchAuthProfile(accessToken: string) {
  const response = await fetchFortsolar("/api/v1/auth/me", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  const payload = await parseServerPayload<AuthMeApiResponse | ApiErrorResponse>(response);

  if (!response.ok || !payload || payload.success === false) {
    return null;
  }

  return payload;
}

export async function refreshAccessToken(
  refreshToken: string,
  previousSnapshot: SessionSnapshot | null,
  portal: PortalRole,
) {
  const response = await fetchFortsolar("/api/v1/auth/refresh", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ refreshToken }),
  });
  const payload = await parseServerPayload<RefreshTokenApiResponse | ApiErrorResponse>(response);

  if (!response.ok || !payload || payload.success === false) {
    return null;
  }

  const profile = await fetchAuthProfile(payload.accessToken);

  return {
    payload,
    profile,
    portal,
  };
}

export async function syncSessionCookieFromProfile(
  response: NextResponse,
  payload: AuthMeApiResponse,
  previousSnapshot: SessionSnapshot | null,
  portal: PortalRole,
) {
  const snapshot = createSessionSnapshotFromProfile(
    payload,
    previousSnapshot?.expiresAt ?? null,
    portal,
  );
  await setSessionSnapshotCookie(response.cookies, snapshot);
  return snapshot;
}

export async function syncAuthCookiesFromLogin(
  response: NextResponse,
  payload: LoginApiResponse | RefreshTokenApiResponse | RegisterApiResponse,
  portal: PortalRole,
) {
  const profile = await fetchAuthProfile(payload.accessToken);
  const snapshot = await setAuthCookies(response.cookies, payload, portal);

  if (profile) {
    await setSessionSnapshotCookie(
      response.cookies,
      createSessionSnapshotFromProfile(profile, snapshot.expiresAt, portal),
    );
  }

  return {
    profile,
    snapshot,
  };
}

export async function getRequestBody(request: Request) {
  const method = request.method.toUpperCase();

  if (method === "GET" || method === "HEAD") {
    return null;
  }

  const body = await request.arrayBuffer();
  return body.byteLength ? body : null;
}

export function makeProxyHeaders(request: Request, accessToken?: string | null) {
  const headers = new Headers();
  const contentType = request.headers.get("content-type");

  if (contentType) {
    headers.set("Content-Type", contentType);
  }

  headers.set("Accept", "application/json");

  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  return headers;
}

export function getPayloadMessage(payload: unknown, fallback: string) {
  return extractApiMessage(payload, fallback);
}
