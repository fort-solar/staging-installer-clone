"use client";

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { APP_SESSION_EXPIRED_EVENT, appGet, isAppSessionExpiredError } from "@/lib/api/client";
import { getErrorMessage } from "@/lib/api/errors";
import { createSessionSnapshotFromProfile } from "@/lib/auth/session";
import { clearClientAuthState, syncClientAuthState } from "@/lib/localAuth";
import type { AuthMeApiResponse, PortalRole, SessionSnapshot } from "@/types/api.types";

type AuthContextValue = {
  session: SessionSnapshot | null;
  isRefreshing: boolean;
  isAuthenticated: boolean;
  portal: PortalRole;
  refreshSession: () => Promise<SessionSnapshot | null>;
  clearSession: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({
  children,
  initialSession,
  portal,
}: {
  children: ReactNode;
  initialSession: SessionSnapshot | null;
  portal: PortalRole;
}) {
  const [session, setSession] = useState<SessionSnapshot | null>(initialSession);
  const [isRefreshing, setIsRefreshing] = useState(true);
  const hasHandledSessionExpiryRef = useRef(false);

  const clearSession = useCallback(() => {
    hasHandledSessionExpiryRef.current = false;
    setSession(null);
    clearClientAuthState();
  }, []);

  const applySessionFromProfile = useCallback(
    (payload: AuthMeApiResponse, previousExpiresAt: string | null) => {
      const nextSession = createSessionSnapshotFromProfile(
        payload,
        previousExpiresAt,
        portal,
      );
      syncClientAuthState(nextSession);
      setSession(nextSession);
      return nextSession;
    },
    [portal],
  );

  const refreshSession = useCallback(async () => {
    try {
      const payload = await appGet<AuthMeApiResponse>("/api/v1/auth/me");
      const nextSession = applySessionFromProfile(payload, session?.expiresAt ?? null);
      hasHandledSessionExpiryRef.current = false;
      return nextSession;
    } catch (error) {
      if (isAppSessionExpiredError(error)) {
        clearSession();
        return null;
      }

      throw error;
    }
  }, [applySessionFromProfile, clearSession, session?.expiresAt]);

  useEffect(() => {
    function onSessionExpired() {
      if (hasHandledSessionExpiryRef.current) {
        return;
      }

      hasHandledSessionExpiryRef.current = true;
      clearSession();
    }

    window.addEventListener(APP_SESSION_EXPIRED_EVENT, onSessionExpired as EventListener);

    return () => {
      window.removeEventListener(APP_SESSION_EXPIRED_EVENT, onSessionExpired as EventListener);
    };
  }, [clearSession]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const payload = await appGet<AuthMeApiResponse>("/api/v1/auth/me");

        if (cancelled) {
          return;
        }

        hasHandledSessionExpiryRef.current = false;
        applySessionFromProfile(payload, initialSession?.expiresAt ?? null);
      } catch (error) {
        if (cancelled) {
          return;
        }

        if (isAppSessionExpiredError(error)) {
          clearSession();
        } else if (initialSession) {
          syncClientAuthState(initialSession);
          setSession(initialSession);
        } else {
          clearClientAuthState();
          setSession(null);
        }

        if (process.env.NODE_ENV !== "production") {
          console.warn(
            "[fortsolar-installer/auth]",
            getErrorMessage(error, "Unable to refresh session."),
          );
        }
      } finally {
        if (!cancelled) {
          setIsRefreshing(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [applySessionFromProfile, clearSession, initialSession]);

  useEffect(() => {
    if (session) {
      syncClientAuthState(session);
    }
  }, [session]);

  const value = useMemo(
    () => ({
      session,
      isRefreshing,
      isAuthenticated: Boolean(session),
      portal,
      refreshSession,
      clearSession,
    }),
    [clearSession, isRefreshing, portal, refreshSession, session],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider.");
  }

  return context;
}
