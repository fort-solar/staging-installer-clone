"use client";

import { appRequest } from "@/lib/api/client";
import {
  createSessionSnapshot,
  createSessionSnapshotFromProfile,
  createSessionSnapshotFromUpdatedUser,
} from "@/lib/auth/session";
import { queuePendingPortalSubmission } from "@/lib/pending-submissions";
import type {
  AuthMeApiResponse,
  AuthProfileUpdateApiResponse,
  ClientAuthState,
  LoginApiResponse,
  PortalRole,
  RegisterApiResponse,
  SessionSnapshot,
  VerifyEmailApiResponse,
  VerifyEmailRequestApiResponse,
} from "@/types/api.types";

export type UserRole = "customer" | "installer" | "admin";

export type MockUser = {
  id: string;
  fullName: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  role: UserRole;
  status: string;
  emailVerified: boolean;
};

export type MockSession = {
  userId: string;
  email: string;
  fullName: string;
  role: UserRole;
  signedInAt: string;
};

const AUTH_STATE_KEY = "fortsolar_installer_auth_state_v1";

function canUseStorage() {
  return typeof window !== "undefined";
}

function safeParse<T>(value: string | null, fallback: T): T {
  if (!value) {
    return fallback;
  }

  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function toClientAuthState(snapshot: SessionSnapshot): ClientAuthState {
  return {
    session: {
      userId: snapshot.session.userId,
      email: snapshot.session.email,
      fullName: snapshot.session.fullName,
      role: snapshot.session.role,
      signedInAt: snapshot.session.signedInAt,
    },
    user: {
      id: snapshot.user.id,
      email: snapshot.user.email,
      fullName: snapshot.user.fullName,
      name: snapshot.user.name,
      phone: snapshot.user.phone ?? "",
      address: snapshot.user.address ?? "",
      role: snapshot.user.role,
      status: snapshot.user.status,
      emailVerified: snapshot.user.emailVerified,
    },
    portal: snapshot.portal,
    expiresAt: snapshot.expiresAt,
  };
}

function fromClientAuthState(state: ClientAuthState): MockSession {
  return {
    userId: state.session.userId,
    email: state.session.email,
    fullName: state.session.fullName,
    role: state.session.role,
    signedInAt: state.session.signedInAt,
  };
}

function fromClientUserState(state: ClientAuthState): MockUser {
  return {
    id: state.user.id,
    fullName: state.user.fullName,
    name: state.user.name,
    email: state.user.email,
    phone: state.user.phone ?? "",
    address: state.user.address ?? "",
    role: state.user.role,
    status: state.user.status,
    emailVerified: state.user.emailVerified,
  };
}

export function readClientAuthState() {
  if (!canUseStorage()) {
    return null as ClientAuthState | null;
  }

  return safeParse<ClientAuthState | null>(
    window.localStorage.getItem(AUTH_STATE_KEY),
    null,
  );
}

export function syncClientAuthState(snapshot: SessionSnapshot) {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.setItem(AUTH_STATE_KEY, JSON.stringify(toClientAuthState(snapshot)));
}

export function clearClientAuthState() {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.removeItem(AUTH_STATE_KEY);
}

export function sessionSnapshotToMockSession(snapshot: SessionSnapshot | null) {
  if (!snapshot) {
    return null;
  }

  return {
    userId: snapshot.session.userId,
    email: snapshot.session.email,
    fullName: snapshot.user.fullName,
    role: snapshot.user.role,
    signedInAt: snapshot.session.signedInAt,
  } satisfies MockSession;
}

export function sessionSnapshotToMockUser(snapshot: SessionSnapshot | null) {
  if (!snapshot) {
    return null;
  }

  return {
    id: snapshot.user.id,
    fullName: snapshot.user.fullName,
    name: snapshot.user.name,
    email: snapshot.user.email,
    phone: snapshot.user.phone ?? "",
    address: snapshot.user.address ?? "",
    role: snapshot.user.role,
    status: snapshot.user.status,
    emailVerified: snapshot.user.emailVerified,
  } satisfies MockUser;
}

export const getMockSession = (): MockSession | null => {
  const state = readClientAuthState();
  return state ? fromClientAuthState(state) : null;
};

export const clearMockSession = () => {
  clearClientAuthState();
};

export const getMockCurrentUser = (): MockUser | null => {
  const state = readClientAuthState();
  return state ? fromClientUserState(state) : null;
};

type RegisterPayload = {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  password: string;
  role: PortalRole;
};

function buildFullName(name: string | undefined, fullName: string | undefined) {
  return fullName?.trim() || name?.trim() || "";
}

function buildNameParts(fullName: string) {
  const normalized = fullName.trim();
  const parts = normalized.split(/\s+/).filter(Boolean);

  return {
    name: parts[0] ?? normalized,
    fullName: normalized,
  };
}

function syncAuthResponse(
  payload: LoginApiResponse | RegisterApiResponse,
  portal: PortalRole,
) {
  const fullName = buildFullName(payload.user.name, payload.user.fullName);
  const nameParts = buildNameParts(fullName);
  const snapshot = createSessionSnapshot(
    {
      session: {
        ...payload.session,
        fullName,
      },
      user: {
        ...payload.user,
        ...nameParts,
        phone: payload.user.phone,
        address: payload.user.address,
      },
    },
    portal,
    payload.expiresIn > 0
      ? new Date(Date.now() + payload.expiresIn * 1000).toISOString()
      : null,
  );

  syncClientAuthState(snapshot);
  return fromClientAuthState(toClientAuthState(snapshot));
}

async function ensureInstallerPortalAccess(
  payload: LoginApiResponse | RegisterApiResponse,
) {
  if (payload.user.role === "installer") {
    return null;
  }

  await logoutUser().catch(() => undefined);

  return "This portal is restricted to installer accounts.";
}

export const registerMockUser = async (
  payload: RegisterPayload,
): Promise<{ session?: MockSession; error?: string }> => {
  try {
    const response = await appRequest<RegisterApiResponse>("/api/auth/register", {
      method: "POST",
      body: {
        email: payload.email,
        password: payload.password,
        name: payload.fullName,
        role: payload.role,
      },
    });

    const installerAccessError = await ensureInstallerPortalAccess(response);

    if (installerAccessError) {
      return { error: installerAccessError };
    }

    return {
      session: syncAuthResponse(response, payload.role),
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Unable to create account.",
    };
  }
};

type LoginPayload = {
  email: string;
  password: string;
};

type GoogleAuthPayload = {
  idToken: string;
};

export const loginMockUser = async (
  payload: LoginPayload,
): Promise<{ session?: MockSession; error?: string }> => {
  try {
    const response = await appRequest<LoginApiResponse>("/api/auth/login", {
      method: "POST",
      body: payload,
    });

    const installerAccessError = await ensureInstallerPortalAccess(response);

    if (installerAccessError) {
      return { error: installerAccessError };
    }

    return {
      session: syncAuthResponse(response, "installer"),
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Unable to sign in.",
    };
  }
};

export async function authenticateWithGoogle(
  payload: GoogleAuthPayload,
): Promise<{ session?: MockSession; error?: string }> {
  try {
    const response = await appRequest<LoginApiResponse>("/api/auth/google", {
      method: "POST",
      body: payload,
    });

    const installerAccessError = await ensureInstallerPortalAccess(response);

    if (installerAccessError) {
      return { error: installerAccessError };
    }

    return {
      session: syncAuthResponse(response, "installer"),
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Unable to sign in with Google.",
    };
  }
}

export async function requestEmailVerification() {
  return appRequest<VerifyEmailRequestApiResponse>("/api/v1/auth/verify-email/request", {
    method: "POST",
  });
}

export async function verifyEmailToken(token: string) {
  return appRequest<VerifyEmailApiResponse>("/api/v1/auth/verify-email", {
    method: "POST",
    body: { token },
  });
}

export async function hydrateClientAuthFromProfile(portal: PortalRole) {
  const payload = await appRequest<AuthMeApiResponse>("/api/v1/auth/me", {
    method: "GET",
  });
  const snapshot = createSessionSnapshotFromProfile(payload, null, portal);
  syncClientAuthState(snapshot);
  return snapshot;
}

export async function logoutUser() {
  try {
    await appRequest("/api/auth/logout", {
      method: "POST",
      body: {},
    });
  } finally {
    clearClientAuthState();
  }
}

export async function updateCurrentUserProfile(values: {
  name: string;
  phone: string;
  address: string;
}) {
  const payload = await appRequest<AuthProfileUpdateApiResponse>("/api/v1/auth/me", {
    method: "PATCH",
    body: values,
  });
  const state = readClientAuthState();

  if (state) {
    const snapshot = createSessionSnapshotFromUpdatedUser(
      payload,
      state.session,
      state.expiresAt ?? null,
      state.portal,
    );
    syncClientAuthState(snapshot);
  }

  return payload;
}

export function queuePendingInstallerSubmission(
  action: string,
  endpoint: string,
  method: string,
  values: Record<string, unknown>,
  notes?: string,
) {
  return queuePendingPortalSubmission(action, endpoint, method, values, "installer", notes);
}

export const queuePendingStoreSubmission = queuePendingInstallerSubmission;
