"use client";

import React from "react";
import { RoleGuard } from "@/components/features/auth/RoleGuard";
import { InstallerOnboardingGate } from "@/components/features/pages/installer/InstallerOnboardingGate";

const InstallerLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <RoleGuard expectedRole="installer">
      <InstallerOnboardingGate>{children}</InstallerOnboardingGate>
    </RoleGuard>
  );
};

export default InstallerLayout;
