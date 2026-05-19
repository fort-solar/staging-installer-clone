"use client";

import type { MockSession } from "@/lib/localAuth";

export type InstallerOnboardingData = {
  currentStep: 1 | 2 | 3;
  completed: boolean;
  profile: {
    name: string;
    primaryLocation: string;
    yearsOfExperience: string;
    specializations: string[];
    notifyOnNewJobs: boolean;
  };
  verification: {
    idFileName: string;
    certificateFileName: string;
  };
  serviceAreas: string[];
  updatedAt: string;
};

export type InstallerJobState = {
  appliedJobIds: string[];
  savedJobIds: string[];
};

const onboardingKey = (userId: string) =>
  `fortsolar_installer_onboarding_${userId}`;
const jobsKey = (userId: string) => `fortsolar_installer_jobs_${userId}`;

const canUseStorage = () => typeof window !== "undefined";

const safeParse = <T>(value: string | null, fallback: T): T => {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
};

export const defaultInstallerOnboardingState = (
  session: MockSession
): InstallerOnboardingData => ({
  currentStep: 1,
  completed: false,
  profile: {
    name: session.fullName,
    primaryLocation: "",
    yearsOfExperience: "2",
    specializations: [],
    notifyOnNewJobs: true,
  },
  verification: {
    idFileName: "",
    certificateFileName: "",
  },
  serviceAreas: [],
  updatedAt: new Date().toISOString(),
});

export const getInstallerOnboardingState = (
  session: MockSession
): InstallerOnboardingData => {
  if (!canUseStorage()) return defaultInstallerOnboardingState(session);
  const stored = safeParse<InstallerOnboardingData | null>(
    window.localStorage.getItem(onboardingKey(session.userId)),
    null
  );
  if (!stored) return defaultInstallerOnboardingState(session);
  return {
    ...defaultInstallerOnboardingState(session),
    ...stored,
    profile: {
      ...defaultInstallerOnboardingState(session).profile,
      ...stored.profile,
    },
    verification: {
      ...defaultInstallerOnboardingState(session).verification,
      ...stored.verification,
    },
  };
};

export const saveInstallerOnboardingState = (
  session: MockSession,
  data: InstallerOnboardingData
) => {
  if (!canUseStorage()) return;
  window.localStorage.setItem(
    onboardingKey(session.userId),
    JSON.stringify({ ...data, updatedAt: new Date().toISOString() })
  );
};

export const completeInstallerOnboarding = (
  session: MockSession,
  data: InstallerOnboardingData
) => {
  saveInstallerOnboardingState(session, {
    ...data,
    completed: true,
    currentStep: 3,
    updatedAt: new Date().toISOString(),
  });
};

export const getInstallerJobState = (session: MockSession): InstallerJobState => {
  if (!canUseStorage()) return { appliedJobIds: [], savedJobIds: [] };
  return safeParse<InstallerJobState>(
    window.localStorage.getItem(jobsKey(session.userId)),
    { appliedJobIds: [], savedJobIds: [] }
  );
};

export const saveInstallerJobState = (
  session: MockSession,
  data: InstallerJobState
) => {
  if (!canUseStorage()) return;
  window.localStorage.setItem(jobsKey(session.userId), JSON.stringify(data));
};
