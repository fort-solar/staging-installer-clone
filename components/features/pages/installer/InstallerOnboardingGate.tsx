"use client";

import React, { useEffect, useMemo, useState } from "react";
import { ArrowRight, CheckCircle2, UploadCloud, X } from "lucide-react";
import {
  queuePendingInstallerSubmission,
  sessionSnapshotToMockSession,
} from "@/lib/localAuth";
import {
  completeInstallerOnboarding,
  defaultInstallerOnboardingState,
  getInstallerOnboardingState,
  saveInstallerOnboardingState,
  type InstallerOnboardingData,
} from "@/lib/installerStorage";
import { LogoFull } from "@/components/features/icons/Logo";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/components/auth/auth-provider";
import { useGeneralStore } from "@/store/GeneralStore";

const LOCATIONS = [
  "Port Harcourt",
  "Lagos",
  "Abuja",
  "Uyo",
  "Maitama",
  "Benin",
  "Enugu",
];

const SPECIALIZATIONS = [
  "Residential",
  "Commercial",
  "Maintenance",
  "Energy Audits",
];

const StepDots = ({ step }: { step: 1 | 2 | 3 }) => (
  <div className="mb-6 flex items-center gap-1">
    {[1, 2, 3].map((dot) => (
      <span
        key={dot}
        className={`h-3 w-3 rounded-full ${dot <= step ? "bg-[#25B229]" : "bg-[#D8DCE2]"
          }`}
      />
    ))}
  </div>
);

const InstallerOnboardingGate = ({ children }: { children: React.ReactNode }) => {
  const { session: authSession } = useAuth();
  const markInstallerSyncPending = useGeneralStore((state) => state.markInstallerSyncPending);
  const session = useMemo(() => sessionSnapshotToMockSession(authSession), [authSession]);
  const [state, setState] = useState<InstallerOnboardingData | null>(() =>
    session && session.role === "installer"
      ? getInstallerOnboardingState(session)
      : null
  );

  useEffect(() => {
    if (!session || !state || state.completed) return;
    saveInstallerOnboardingState(session, state);
  }, [session, state]);
  const shouldShow = !!state && !state.completed;

  useEffect(() => {
    if (!shouldShow) return;
    const prevBodyOverflow = document.body.style.overflow;
    const prevHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = prevBodyOverflow;
      document.documentElement.style.overflow = prevHtmlOverflow;
    };
  }, [shouldShow]);

  if (!state || !session || session.role !== "installer") {
    return <>{children}</>;
  }

  const canProceedStep1 =
    state.profile.name.trim().length > 0 &&
    state.profile.primaryLocation.trim().length > 0 &&
    state.profile.specializations.length > 0;
  const canProceedStep2 =
    state.verification.idFileName.trim().length > 0 &&
    state.verification.certificateFileName.trim().length > 0;
  const canSubmitStep3 = state.serviceAreas.length > 0;

  const updateState = (updater: (prev: InstallerOnboardingData) => InstallerOnboardingData) => {
    setState((prev) => {
      if (!prev) return prev;
      return updater(prev);
    });
  };

  const toggleServiceArea = (value: string) => {
    updateState((prev) => {
      const exists = prev.serviceAreas.includes(value);
      return {
        ...prev,
        serviceAreas: exists
          ? prev.serviceAreas.filter((item) => item !== value)
          : [...prev.serviceAreas, value],
      };
    });
  };

  return (
    <>
      {children}
      {shouldShow && (
        <div className="fixed inset-0 z-80 h-screen bg-white">
          <div className="mx-auto flex flex-col lg:flex-row gap-10 lg:gap-0 h-screen w-full  overflow-hidden px-6 py-12 lg:px-14">
            <div className="w-72 lg:sticky lg:top-12 lg:block lg:self-start">
              <LogoFull className="h-10 w-auto" />
              <p className="mt-2 text-sm font-medium tracking-[0.25em] text-[#4B5563]">
                INSTALLER PORTAL
              </p>
            </div>

            <div className="flex flex-1 overflow-y-auto bg-white lg:px-20">
              <div className="flex min-h-full w-full items-start justify-start py-2 lg:py-4">
                <div className="w-full lg:max-w-xl rounded-[38px] border border-[#D7E2E8] bg-white px-6 py-8 lg:px-12 lg:py-12">
                  <StepDots step={state.currentStep} />

                  {state.currentStep === 1 && (
                    <>
                      <h2 className="text-xl lg:text-3xl font-semibold text-[#0B0F17]">
                        Finish Setting Up Your Profile
                      </h2>
                      <p className="mt-2 text-base text-[#556070]">
                        This information helps us connect you with relevant installation jobs near you.
                      </p>

                      <div className="mt-10 space-y-6">
                        <Field className="space-y-4 gap-0">
                          <FieldLabel className="text-base font-medium text-[#3E3F43] mb-3">Name</FieldLabel>
                          <Input
                            value={state.profile.name}
                            onChange={(event) =>
                              updateState((prev) => ({
                                ...prev,
                                profile: { ...prev.profile, name: event.target.value },
                              }))
                            }
                            className="h-10 w-full text-base rounded-[24px]  border-none bg-[#B8C0CC33] px-6  outline-none text-[#3B3B3BE5]"
                          />
                        </Field>

                        <Field className="space-y-2 gap-0">
                          <FieldLabel className="text-base font-medium text-[#3E3F43] mb-3">Primary Service Location</FieldLabel>
                          <Select
                            value={state.profile.primaryLocation}
                            onValueChange={(value) =>
                              updateState((prev) => ({
                                ...prev,
                                profile: {
                                  ...prev.profile,
                                  primaryLocation: value,
                                },
                              }))
                            }
                          >
                            <SelectTrigger className="h-10 w-full text-base rounded-[24px] border-none bg-[#B8C0CC33] px-6 outline-none text-[#3B3B3BE5]">
                              <SelectValue placeholder="eg. Port Harcourt" />
                            </SelectTrigger>
                            <SelectContent className="z-120">
                              <SelectGroup>
                                {LOCATIONS.map((location) => (
                                  <SelectItem key={location} value={location}>
                                    {location}
                                  </SelectItem>
                                ))}
                              </SelectGroup>
                            </SelectContent>
                          </Select>
                        </Field>

                        <Field className="space-y-2 gap-0">
                          <FieldLabel className="text-base font-medium text-[#3E3F43] mb-3">Years of Experience</FieldLabel>
                          <Input
                            type="number"
                            min={0}
                            value={state.profile.yearsOfExperience}
                            onChange={(event) =>
                              updateState((prev) => ({
                                ...prev,
                                profile: {
                                  ...prev.profile,
                                  yearsOfExperience: event.target.value,
                                },
                              }))
                            }
                            className="h-10 w-full text-base rounded-[24px]  border-none bg-[#B8C0CC33] px-6  outline-none text-[#3B3B3BE5]"
                          />
                        </Field>

                        <div className="space-y-2">
                          <label className="text-base font-medium text-[#3E3F43] mb-3">Installation Specializations</label>
                          <div className="rounded-[24px] mt-4 border-none  bg-[#B8C0CC33] p-4">
                            <div className="mb-3 flex flex-wrap gap-3">
                              {state.profile.specializations.map((spec) => (
                                <span
                                  key={spec}
                                  className="inline-flex items-center gap-2 rounded-xl bg-[#50555C] px-3 py-2 text-xs font-medium text-white"
                                >
                                  {spec}
                                  <button
                                    type="button"
                                    onClick={() =>
                                      updateState((prev) => ({
                                        ...prev,
                                        profile: {
                                          ...prev.profile,
                                          specializations: prev.profile.specializations.filter(
                                            (item) => item !== spec
                                          ),
                                        },
                                      }))
                                    }
                                  >
                                    <X className="h-4 w-4" />
                                  </button>
                                </span>
                              ))}
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {SPECIALIZATIONS.filter(
                                (item) => !state.profile.specializations.includes(item)
                              ).map((item) => (
                                <button
                                  key={item}
                                  type="button"
                                  onClick={() =>
                                    updateState((prev) => ({
                                      ...prev,
                                      profile: {
                                        ...prev.profile,
                                        specializations: [...prev.profile.specializations, item],
                                      },
                                    }))
                                  }
                                  className="rounded-xl bg-[#5A646F] px-4 py-2 text-xs font-medium text-white"
                                >
                                  + {item}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>

                        <label className="flex items-center gap-3 text-base font-medium text-[#3E3F43]">
                          <input
                            type="checkbox"
                            className="h-5 w-5 rounded-md border-[#E2E8F0] text-[#16A34A] focus:ring-[#16A34A]/30"
                             checked={state.profile.notifyOnNewJobs}
                            onChange={(event) =>
                              updateState((prev) => ({
                                ...prev,
                                profile: {
                                  ...prev.profile,
                                  notifyOnNewJobs: event.target.checked,
                                },
                              }))
                            }
                          />
                          Send me notifications when new jobs are available in my region.
                        </label>
                      </div>
                    </>
                  )}

                  {state.currentStep === 2 && (
                    <>
                      <h2 className="text-xl lg:text-3xl font-semibold text-[#0B0F17]">
                         Verification &amp; Certification
                      </h2>
                      <p className="mt-2 text-base text-[#556070]">
                       Please upload the required documents to verify your identity and expertise. Your data is kept private and secure.
                      </p>

                      <div className="mt-10 space-y-6">
                        <div className="space-y-2">
                          <label className="text-base font-medium text-[#3E3F43]">
                            Valid ID Upload (National ID/Driver&apos;s License/Voter&apos;s Card)
                          </label>
                          <label className="flex h-14 mt-4 cursor-pointer items-center rounded-[24px] border border-[#B8C0CC33] bg-white">
                            <span className="flex h-full items-center gap-2 border-r border-[#DADDE2] bg-[#FAFAFA] px-6 text-sm font-medium text-[#444C58]">
                              <UploadCloud className="h-6 w-6" /> Upload File
                            </span>
                            <span className="px-4 text-xs lg:ext-sm text-[#9BA2AE]">
                              {state.verification.idFileName || "No file chosen"}
                            </span>
                            <input
                              type="file"
                              className="hidden"
                              onChange={(event) =>
                                updateState((prev) => ({
                                  ...prev,
                                  verification: {
                                    ...prev.verification,
                                    idFileName: event.target.files?.[0]?.name ?? "",
                                  },
                                }))
                              }
                            />
                          </label>
                          {state.verification.idFileName && (
                            <p className="flex items-center justify-between text-xs lg:ext-sm text-[#5A646F]">
                              <span>{state.verification.idFileName}</span>
                              <CheckCircle2 className="h-3 w-3 lg:h-5 lg:w-5 text-[#25B229]" />
                            </p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <label className="text-base font-medium text-[#3E3F43]">
                            Relevant Certification (Solar Training, Electrical License)
                          </label>
                          <label className="flex h-14 mt-4 cursor-pointer items-center rounded-[24px] border border-[#B8C0CC33] bg-white">
                            <span className="flex h-full items-center gap-2 border-r border-[#DADDE2] bg-[#FAFAFA] px-6 text-sm font-medium text-[#444C58]">
                              <UploadCloud className="h-6 w-6" /> Upload File
                            </span>
                            <span className="px-4 text-xs lg:ext-sm text-[#9BA2AE]">
                              {state.verification.certificateFileName || "No file chosen"}
                            </span>
                            <input
                              type="file"
                              className="hidden"
                              onChange={(event) =>
                                updateState((prev) => ({
                                  ...prev,
                                  verification: {
                                    ...prev.verification,
                                    certificateFileName:
                                      event.target.files?.[0]?.name ?? "",
                                  },
                                }))
                              }
                            />
                          </label>
                           {state.verification.certificateFileName && (
                            <p className="flex items-center justify-between text-xs lg:ext-sm text-[#5A646F]">
                              <span>{state.verification.certificateFileName}</span>
                              <CheckCircle2 className="h-3 w-3 lg:h-5 lg:w-5 text-[#25B229]" />
                            </p>
                          )}
                        </div>
                      </div>
                    </>
                  )}

                  {state.currentStep === 3 && (
                    <>
                     <h2 className="text-xl lg:text-3xl font-semibold text-[#0B0F17]">
                         Choose Your Service Areas
                      </h2>
                      <p className="mt-2 text-base text-[#556070]">
                        Select the cities you are willing to accept installation jobs in.
                      </p>

                      <div className="mt-10 space-y-2">
                        <label className="text-base font-medium text-[#3E3F43]">Select Service Areas</label>
                        <div className="rounded-[24px] mt-4 border border-[#DADDE2] p-4">
                          <div className="min-h-22 rounded-4xl border border-[#DADDE2] bg-[#B8C0CC33]  p-3">
                            <div className="flex flex-wrap gap-3">
                              {state.serviceAreas.map((area) => (
                                <span
                                  key={area}
                                  className="inline-flex items-center gap-2 rounded-xl bg-[#606873] px-3 py-2 text-sm text-white"
                                >
                                  {area}
                                  <button type="button" onClick={() => toggleServiceArea(area)}>
                                    <X className="h-4 w-4" />
                                  </button>
                                </span>
                              ))}
                              {state.serviceAreas.length === 0 && (
                                <span className="text-sm text-[#B1B7C1]">No area selected yet</span>
                              )}
                            </div>
                          </div>
                          <div className="mt-3 flex flex-wrap gap-2">
                            {LOCATIONS.filter((area) => !state.serviceAreas.includes(area)).map(
                              (area) => (
                                <button
                                  key={area}
                                  type="button"
                                  onClick={() => toggleServiceArea(area)}
                                  className="rounded-xl bg-[#5A646F] px-4 py-2 text-xs text-white"
                                >
                                  + {area}
                                </button>
                              )
                            )}
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  <div className="mt-14 flex items-center justify-between">
                    {state.currentStep > 1 ? (
                      <button
                        type="button"
                        onClick={() =>
                          updateState((prev) => ({
                            ...prev,
                            currentStep: (prev.currentStep - 1) as 1 | 2 | 3,
                          }))
                        }
                        className="h-12 rounded-xl border-2 border-[#ADB0B5] cursor-pointer px-5 lg:px-8 text-lg font-medium"
                      >
                        Previous
                      </button>
                    ) : (
                      <span />
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        if (state.currentStep === 1 && canProceedStep1) {
                          updateState((prev) => ({ ...prev, currentStep: 2 }));
                          return;
                        }
                        if (state.currentStep === 2 && canProceedStep2) {
                          updateState((prev) => ({ ...prev, currentStep: 3 }));
                          return;
                        }
                        if (state.currentStep === 3 && canSubmitStep3) {
                          const latest = getInstallerOnboardingState(session);
                          markInstallerSyncPending("onboarding");
                          queuePendingInstallerSubmission(
                            "installer_onboarding_submit",
                            "/api/v1/installers/onboarding",
                            "POST",
                            {
                              profile: state.profile,
                              verification: state.verification,
                              serviceAreas: state.serviceAreas,
                            },
                            "Installer onboarding endpoint has not been supplied yet. The completed onboarding payload was queued for later API hookup.",
                          );
                          completeInstallerOnboarding(session, {
                            ...latest,
                            ...state,
                            completed: true,
                          });
                          setState((prev) =>
                            prev
                              ? { ...prev, completed: true, currentStep: 3 }
                              : defaultInstallerOnboardingState(session)
                          );
                        }
                      }}
                      disabled={
                        (state.currentStep === 1 && !canProceedStep1) ||
                        (state.currentStep === 2 && !canProceedStep2) ||
                        (state.currentStep === 3 && !canSubmitStep3)
                      }
                      className="flex h-12 items-center gap-3 rounded-xl bg-[#12A312] cursor-pointer px-5 lg:px-8 text-lg font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {state.currentStep === 3 ? "Submit" : "Next"}
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export { InstallerOnboardingGate };
