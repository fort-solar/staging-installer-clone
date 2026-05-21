import { NextRequest, NextResponse } from "next/server";
import { buildErrorResponse, refreshAccessToken } from "@/lib/api/server";
import {
  getAuthTokens,
  getSessionSnapshotFromCookieStore,
  setAuthCookies,
} from "@/lib/auth/session";
import type { AuthAccessTokenApiResponse } from "@/types/api.types";

export async function GET(request: NextRequest) {
  const currentSnapshot = await getSessionSnapshotFromCookieStore(request.cookies);
  const { accessToken, refreshToken } = getAuthTokens(request.cookies);
  const portal = currentSnapshot?.portal ?? "installer";
  const activeAccessToken = accessToken;

  if (!activeAccessToken && refreshToken) {
    const refreshed = await refreshAccessToken(refreshToken, currentSnapshot, portal);

    if (!refreshed) {
      return buildErrorResponse("Your session has expired. Please sign in again.", 401);
    }

    const response = NextResponse.json<AuthAccessTokenApiResponse>({
      success: true,
      accessToken: refreshed.payload.accessToken,
    });
    await setAuthCookies(response.cookies, refreshed.payload, portal);
    return response;
  }

  if (!activeAccessToken) {
    return buildErrorResponse("No access token is available.", 401);
  }

  return NextResponse.json<AuthAccessTokenApiResponse>({
    success: true,
    accessToken: activeAccessToken,
  });
}
