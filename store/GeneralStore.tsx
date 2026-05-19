import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { persist } from "zustand/middleware";
import {
  type GeneralStoreState,
  type InstallerSyncResource,
} from "@/types/common.types";

const initialState: GeneralStoreState = {
  isHydrated: false,
  setHydrated: () => {},
  isCategorySidebarOpen: false,
  toggleCategorySidebar: () => {},
  setCategorySidebarOpen: () => {},
  syncState: {
    jobsPending: false,
    onboardingPending: false,
    profilePending: false,
    paymentMethodsPending: false,
    lastJobsSyncAt: null,
    lastOnboardingSyncAt: null,
    lastProfileSyncAt: null,
    lastPaymentMethodsSyncAt: null,
  },
  markInstallerSyncPending: () => {},
  markInstallerSyncComplete: () => {},
};

function applyPendingState(state: GeneralStoreState, resource: InstallerSyncResource) {
  if (resource === "jobs") {
    state.syncState.jobsPending = true;
    state.syncState.lastJobsSyncAt = null;
    return;
  }

  if (resource === "onboarding") {
    state.syncState.onboardingPending = true;
    state.syncState.lastOnboardingSyncAt = null;
    return;
  }

  if (resource === "profile") {
    state.syncState.profilePending = true;
    state.syncState.lastProfileSyncAt = null;
    return;
  }

  state.syncState.paymentMethodsPending = true;
  state.syncState.lastPaymentMethodsSyncAt = null;
}

function applyCompleteState(state: GeneralStoreState, resource: InstallerSyncResource) {
  const timestamp = new Date().toISOString();

  if (resource === "jobs") {
    state.syncState.jobsPending = false;
    state.syncState.lastJobsSyncAt = timestamp;
    return;
  }

  if (resource === "onboarding") {
    state.syncState.onboardingPending = false;
    state.syncState.lastOnboardingSyncAt = timestamp;
    return;
  }

  if (resource === "profile") {
    state.syncState.profilePending = false;
    state.syncState.lastProfileSyncAt = timestamp;
    return;
  }

  state.syncState.paymentMethodsPending = false;
  state.syncState.lastPaymentMethodsSyncAt = timestamp;
}

export const useGeneralStore = create<GeneralStoreState>()(
  persist(
    immer((set) => ({
      ...initialState,

      setHydrated: () => {
        set((state) => {
          state.isHydrated = true;
        });
      },

      toggleCategorySidebar: () => {
        set((state) => {
          state.isCategorySidebarOpen = !state.isCategorySidebarOpen;
        });
      },

      setCategorySidebarOpen: (value) => {
        set((state) => {
          state.isCategorySidebarOpen = value;
        });
      },

      markInstallerSyncPending: (resource) => {
        set((state) => {
          applyPendingState(state, resource);
        });
      },

      markInstallerSyncComplete: (resource) => {
        set((state) => {
          applyCompleteState(state, resource);
        });
      },
    })),
    {
      name: "installer-general-store",
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.setHydrated();
        }
      },
    },
  ),
);
