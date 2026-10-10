"use client";

import React, { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { logoutUser, type UserRole } from "@/lib/localAuth";
import { useAuth } from "@/components/auth/auth-provider";

const RoleGuard = ({
  expectedRole,
  children,
}: {
  expectedRole: UserRole;
  children: React.ReactNode;
}) => {
  const router = useRouter();
  const handledRoleMismatchRef = useRef(false);
  const { isRefreshing, session } = useAuth();

  useEffect(() => {
    if (isRefreshing) {
      return;
    }

    if (!session) {
      router.replace("/login");
      return;
    }

    if (session.user.role !== expectedRole && !handledRoleMismatchRef.current) {
      handledRoleMismatchRef.current = true;

      void logoutUser().finally(() => {
        router.replace("/login");
      });
      return;
    }

    if (!session.user.emailVerified) {
      router.replace(`/verify-email?email=${encodeURIComponent(session.user.email)}`);
    }
  }, [expectedRole, isRefreshing, router, session]);

  if (isRefreshing && !session) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#F7F7F7] text-sm text-[#4B5563]">
        Loading your dashboard...
      </div>
    );
  }

  if (session && session.user.role !== expectedRole) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#F7F7F7] text-sm text-[#4B5563]">
        Redirecting to the correct portal...
      </div>
    );
  }

  return <>{children}</>;
};

export { RoleGuard };
