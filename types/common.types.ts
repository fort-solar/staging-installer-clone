export interface GeneralStoreState {
  isHydrated: boolean;
  setHydrated: () => void;
  isCategorySidebarOpen: boolean;
  toggleCategorySidebar: () => void;
  setCategorySidebarOpen: (value: boolean) => void;
  syncState: InstallerSyncState;
  markInstallerSyncPending: (resource: InstallerSyncResource) => void;
  markInstallerSyncComplete: (resource: InstallerSyncResource) => void;
}

export type ApiMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export type InstallerSyncResource =
  | "jobs"
  | "onboarding"
  | "profile"
  | "payment_methods";

export type InstallerSyncState = {
  jobsPending: boolean;
  onboardingPending: boolean;
  profilePending: boolean;
  paymentMethodsPending: boolean;
  lastJobsSyncAt: string | null;
  lastOnboardingSyncAt: string | null;
  lastProfileSyncAt: string | null;
  lastPaymentMethodsSyncAt: string | null;
};
