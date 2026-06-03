"use client";

import React, { useEffect, useState } from "react";
import { ArrowRight, CheckCircle2, Loader2, UploadCloud, X } from "lucide-react";
import { LogoFull } from "@/components/features/icons/Logo";
import { Field, FieldLabel } from "@/components/ui/field";
import GradientCheckbox from "@/components/ui/gradient-checkbox";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/components/auth/auth-provider";
import { useGeneralStore } from "@/store/GeneralStore";
import {
  getInstallerOnboarding,
  getInstallerProfile,
  submitInstallerOnboarding,
} from "@/lib/api/installers";

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

export type OnboardingFormState = {
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
    idFile: File | null;
    certificateFile: File | null;
    idFileName: string;
    certificateFileName: string;
  };
  serviceAreas: string[];
};

const StepDots = ({ step }: { step: 1 | 2 | 3 }) => (
  <div className="mb-6 flex items-center gap-1">
    {[1, 2, 3].map((dot) => (
      <span
        key={dot}
        className={`h-3 w-3 rounded-full ${dot <= step ? "bg-[#25B229]" : "bg-[#D8DCE2]"}`}
      />
    ))}
  </div>
);

function toStringValue(value: unknown, fallback = "") {
  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }

  return fallback;
}

function toBooleanValue(value: unknown, fallback = true) {
  return typeof value === "boolean" ? value : fallback;
}

function toStringArray(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function normalizeToken(value: string) {
  return value.trim().toLowerCase();
}

function extractFileName(value: string) {
  const normalized = value.trim();

  if (!normalized) {
    return "";
  }

  const [withoutQuery] = normalized.split(/[?#]/, 1);
  const segments = withoutQuery.split("/").filter(Boolean);
  return segments[segments.length - 1] ?? normalized;
}

function extractVerificationDocumentName(value: unknown) {
  if (typeof value === "string") {
    return extractFileName(value);
  }

  if (!isRecord(value)) {
    return "";
  }

  const upload = isRecord(value.upload) ? value.upload : value;
  const directName =
    toStringValue(upload.original_filename) ||
    toStringValue(upload.name) ||
    toStringValue(upload.file_name) ||
    toStringValue(upload.filename) ||
    toStringValue(upload.stored_filename);

  if (directName) {
    return directName;
  }

  return extractFileName(
    toStringValue(upload.file_path) ||
      toStringValue(upload.url) ||
      toStringValue(upload.path),
  );
}

export function isAcceptedVerificationFile(file: File) {
  const normalizedType = file.type.trim().toLowerCase();
  const normalizedName = file.name.trim().toLowerCase();

  return (
    normalizedType.startsWith("image/") ||
    normalizedType === "application/pdf" ||
    /\.(pdf|png|jpe?g|webp|gif|svg)$/.test(normalizedName)
  );
}

export function getOnboardingValidationState(state: OnboardingFormState) {
  return {
    canProceedStep1:
      state.profile.name.trim().length > 0 &&
      state.profile.primaryLocation.trim().length > 0 &&
      state.profile.specializations.length > 0,
    canProceedStep2:
      state.verification.idFileName.trim().length > 0 &&
      state.verification.certificateFileName.trim().length > 0,
    canSubmitStep3: state.serviceAreas.length > 0,
  };
}

function addUniqueValue(list: string[], value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return list;
  }

  const normalized = normalizeToken(trimmed);

  if (list.some((item) => normalizeToken(item) === normalized)) {
    return list;
  }

  return [...list, trimmed];
}

function buildDefaultState(fullName: string): OnboardingFormState {
  return {
    currentStep: 1,
    completed: false,
    profile: {
      name: fullName,
      primaryLocation: "",
      yearsOfExperience: "",
      specializations: [],
      notifyOnNewJobs: true,
    },
    verification: {
      idFile: null,
      certificateFile: null,
      idFileName: "",
      certificateFileName: "",
    },
    serviceAreas: [],
  };
}

function toOnboardingState(
  fullName: string,
  payload: Awaited<ReturnType<typeof getInstallerOnboarding>>["data"],
  installerProfile?: Awaited<ReturnType<typeof getInstallerProfile>>["data"] | null,
) {
  const fallback = buildDefaultState(fullName);
  const onboardingProfile = isRecord(payload.profile) ? payload.profile : {};
  const profileName = toStringValue(onboardingProfile.name, fallback.profile.name);
  const primaryLocation =
    toStringValue(onboardingProfile.primaryLocation) ||
    toStringValue(onboardingProfile.location) ||
    toStringValue(installerProfile?.primaryLocation) ||
    toStringValue(installerProfile?.location);
  const specializations =
    toStringArray(onboardingProfile.specializations).length > 0
      ? toStringArray(onboardingProfile.specializations)
      : toStringArray(installerProfile?.specializations);
  const verificationRecord = isRecord(payload.verification) ? payload.verification : {};
  const idFileName =
    extractVerificationDocumentName(verificationRecord.id_file) ||
    extractVerificationDocumentName(verificationRecord.id_file_url) ||
    toStringValue(verificationRecord.idFileName);
  const certificateFileName =
    extractVerificationDocumentName(verificationRecord.certificate_file) ||
    extractVerificationDocumentName(verificationRecord.certificate_file_url) ||
    toStringValue(verificationRecord.certificateFileName);
  const verification = {
    idFile: null,
    certificateFile: null,
    idFileName,
    certificateFileName,
  };
  const serviceAreas =
    toStringArray(payload.serviceAreas).length > 0
      ? toStringArray(payload.serviceAreas)
      : toStringArray(installerProfile?.serviceAreas);
  const completed = payload.completed || Boolean(installerProfile?.onboardingCompleted);
  const hasProfileStepCompleted = primaryLocation.trim().length > 0 && specializations.length > 0;
  const hasVerificationStepCompleted =
    verification.idFileName.trim().length > 0 && verification.certificateFileName.trim().length > 0;
  const currentStep = completed
    ? 3
    : !hasProfileStepCompleted
      ? 1
      : !hasVerificationStepCompleted
        ? 2
        : 3;

  return {
    currentStep,
    completed,
    profile: {
      name: profileName,
      primaryLocation,
      yearsOfExperience:
        toStringValue(onboardingProfile.yearsOfExperience) ||
        toStringValue(onboardingProfile.experienceYears) ||
        toStringValue(installerProfile?.experienceYears),
      specializations,
      notifyOnNewJobs:
        typeof onboardingProfile.notifyOnNewJobs === "boolean"
          ? onboardingProfile.notifyOnNewJobs
          : toBooleanValue(installerProfile?.notifyOnNewJobs, true),
    },
    verification,
    serviceAreas,
  } satisfies OnboardingFormState;
}

const InstallerOnboardingGate = ({ children }: { children: React.ReactNode }) => {
  const { session } = useAuth();
  const markInstallerSyncComplete = useGeneralStore((state) => state.markInstallerSyncComplete);
  const [state, setState] = useState<OnboardingFormState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [specializationInput, setSpecializationInput] = useState("");
  const [serviceAreaInput, setServiceAreaInput] = useState("");

  useEffect(() => {
    if (!session || session.user.role !== "installer") {
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    (async () => {
      const [onboardingResult, profileResult] = await Promise.allSettled([
        getInstallerOnboarding(),
        getInstallerProfile(),
      ]);

      if (cancelled) {
        return;
      }

      try {
        if (onboardingResult.status !== "fulfilled") {
          throw onboardingResult.reason;
        }

        const profileData =
          profileResult.status === "fulfilled" ? profileResult.value.data : null;
        setState(toOnboardingState(session.user.fullName, onboardingResult.value.data, profileData));
        setMessage(null);
      } catch (error) {
        const profileData =
          profileResult.status === "fulfilled" ? profileResult.value.data : null;

        if (profileData) {
          setState(
            toOnboardingState(
              session.user.fullName,
              {
                completed: Boolean(profileData.onboardingCompleted),
                profile: {},
                verification: {},
                serviceAreas: profileData.serviceAreas,
              },
              profileData,
            ),
          );
          setMessage(
            error instanceof Error
              ? error.message
              : "Unable to load your onboarding state. Showing your saved profile details instead.",
          );
          return;
        }

        setState(buildDefaultState(session.user.fullName));
        setMessage(
          error instanceof Error
            ? error.message
            : "Unable to load your onboarding state. You can still continue.",
        );
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [session]);

  const shouldShow = state ? !state.completed : false;

  useEffect(() => {
    if (!shouldShow) {
      return;
    }

    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
    };
  }, [shouldShow]);

  if (!session || session.user.role !== "installer") {
    return <>{children}</>;
  }

  if (isLoading || !state) {
    return (
      <>
        {children}
        <div className="fixed inset-0 z-80 grid place-items-center bg-white text-sm text-[#667085]">
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading your onboarding state...
          </div>
        </div>
      </>
    );
  }

  const { canProceedStep1, canProceedStep2, canSubmitStep3 } =
    getOnboardingValidationState(state);

  const updateState = (updater: (prev: OnboardingFormState) => OnboardingFormState) => {
    setState((previous) => (previous ? updater(previous) : previous));
  };

  const toggleServiceArea = (value: string) => {
    updateState((previous) => {
      const exists = previous.serviceAreas.includes(value);

      return {
        ...previous,
        serviceAreas: exists
          ? previous.serviceAreas.filter((item) => item !== value)
          : [...previous.serviceAreas, value],
      };
    });
  };

  const addSpecialization = (value: string) => {
    updateState((previous) => ({
      ...previous,
      profile: {
        ...previous.profile,
        specializations: addUniqueValue(previous.profile.specializations, value),
      },
    }));
    setSpecializationInput("");
  };

  const addServiceArea = (value: string) => {
    updateState((previous) => ({
      ...previous,
      serviceAreas: addUniqueValue(previous.serviceAreas, value),
    }));
    setServiceAreaInput("");
  };

  const updateVerificationFile = (
    field: "idFile" | "certificateFile",
    fileNameField: "idFileName" | "certificateFileName",
    label: string,
    file: File | null,
  ) => {
    if (file && !isAcceptedVerificationFile(file)) {
      setMessage(`${label} must be uploaded as a PDF or image file.`);
      return;
    }

    setMessage(null);
    updateState((previous) => ({
      ...previous,
      verification: {
        ...previous.verification,
        [field]: file,
        [fileNameField]: file?.name ?? "",
      },
    }));
  };

  async function handleSubmit() {
    const currentState = state;

    if (!currentState) {
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    try {
      const response = await submitInstallerOnboarding({
        profile: currentState.profile,
        verification: {
          idFileName: currentState.verification.idFileName,
          certificateFileName: currentState.verification.certificateFileName,
          id_file: currentState.verification.idFile,
          certificate_file: currentState.verification.certificateFile,
        },
        serviceAreas: currentState.serviceAreas,
      });
      setState((previous) =>
        previous
          ? {
              ...previous,
              completed: response.data.onboardingCompleted,
              currentStep: 3,
              profile: {
                ...previous.profile,
                primaryLocation:
                  response.data.primaryLocation ??
                  response.data.location ??
                  previous.profile.primaryLocation,
                yearsOfExperience:
                  toStringValue(response.data.experienceYears) ||
                  previous.profile.yearsOfExperience,
                specializations:
                  response.data.specializations.length > 0
                    ? response.data.specializations
                    : previous.profile.specializations,
                notifyOnNewJobs: response.data.notifyOnNewJobs,
              },
              serviceAreas:
                response.data.serviceAreas.length > 0
                  ? response.data.serviceAreas
                  : previous.serviceAreas,
            }
          : previous,
      );
      markInstallerSyncComplete("onboarding");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Unable to submit your onboarding right now.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      {children}
      {shouldShow ? (
        <div className="fixed inset-0 z-80 h-screen bg-white">
          <div className="mx-auto flex h-screen w-full flex-col gap-10 overflow-hidden px-6 py-12 lg:flex-row lg:gap-0 lg:px-14">
            <div className="w-72 lg:sticky lg:top-12 lg:block lg:self-start">
              <LogoFull className="h-10 w-auto" />
              <p className="mt-2 text-sm font-medium tracking-[0.25em] text-[#4B5563]">
                INSTALLER PORTAL
              </p>
            </div>

            <div className="flex flex-1 overflow-y-auto bg-white lg:px-20">
              <div className="flex min-h-full w-full items-start justify-start py-2 lg:py-4">
                <div className="w-full rounded-[38px] border border-[#D7E2E8] bg-white px-6 py-8 lg:max-w-xl lg:px-12 lg:py-12">
                  <StepDots step={state.currentStep} />

                  {state.currentStep === 1 ? (
                    <>
                      <h2 className="text-xl font-semibold text-[#0B0F17] lg:text-3xl">
                        Finish Setting Up Your Profile
                      </h2>
                      <p className="mt-2 text-base text-[#556070]">
                        This information helps us connect you with relevant installation jobs near
                        you.
                      </p>

                      <div className="mt-10 space-y-6">
                        <Field className="space-y-4 gap-0">
                          <FieldLabel className="mb-3 text-base font-medium text-[#3E3F43]">
                            Name
                          </FieldLabel>
                          <Input
                            value={state.profile.name}
                            onChange={(event) =>
                              updateState((previous) => ({
                                ...previous,
                                profile: { ...previous.profile, name: event.target.value },
                              }))
                            }
                            className="h-10 w-full rounded-[24px] border-none bg-[#B8C0CC33] px-6 text-base text-[#3B3B3BE5] outline-none"
                          />
                        </Field>

                        <Field className="space-y-2 gap-0">
                          <FieldLabel className="mb-3 text-base font-medium text-[#3E3F43]">
                            Primary Service Location
                          </FieldLabel>
                          <Input
                            value={state.profile.primaryLocation}
                            onChange={(event) =>
                              updateState((previous) => ({
                                ...previous,
                                profile: { ...previous.profile, primaryLocation: event.target.value },
                              }))
                            }
                            placeholder="eg. Port Harcourt"
                            className="h-10 w-full rounded-[24px] border-none bg-[#B8C0CC33] px-6 text-base text-[#3B3B3BE5] outline-none"
                          />
                          <div className="mt-3 flex flex-wrap gap-2">
                            {LOCATIONS.filter(
                              (location) => normalizeToken(location) !== normalizeToken(state.profile.primaryLocation),
                            ).map((location) => (
                              <button
                                key={location}
                                type="button"
                                onClick={() =>
                                  updateState((previous) => ({
                                    ...previous,
                                    profile: { ...previous.profile, primaryLocation: location },
                                  }))
                                }
                                className="rounded-xl bg-[#5A646F] px-4 py-2 text-xs font-medium text-white"
                              >
                                {location}
                              </button>
                            ))}
                          </div>
                        </Field>

                        <Field className="space-y-2 gap-0">
                          <FieldLabel className="mb-3 text-base font-medium text-[#3E3F43]">
                            Years of Experience
                          </FieldLabel>
                          <Input
                            type="number"
                            min={0}
                            value={state.profile.yearsOfExperience}
                            onChange={(event) =>
                              updateState((previous) => ({
                                ...previous,
                                profile: {
                                  ...previous.profile,
                                  yearsOfExperience: event.target.value,
                                },
                              }))
                            }
                            className="h-10 w-full rounded-[24px] border-none bg-[#B8C0CC33] px-6 text-base text-[#3B3B3BE5] outline-none"
                          />
                        </Field>

                        <div className="space-y-2">
                          <label className="mb-3 text-base font-medium text-[#3E3F43]">
                            Installation Specializations
                          </label>
                          <div className="mt-4 rounded-[24px] bg-[#B8C0CC33] p-4">
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
                                      updateState((previous) => ({
                                        ...previous,
                                        profile: {
                                          ...previous.profile,
                                          specializations: previous.profile.specializations.filter(
                                            (item) => item !== spec,
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
                            <div className="mb-3 flex gap-2">
                              <Input
                                value={specializationInput}
                                onChange={(event) => setSpecializationInput(event.target.value)}
                                placeholder="Type a specialization"
                                className="h-10 rounded-[20px] border-none bg-white px-4 text-sm"
                              />
                              <button
                                type="button"
                                onClick={() => addSpecialization(specializationInput)}
                                className="rounded-xl bg-[#12A312] px-4 py-2 text-sm font-medium text-white"
                              >
                                Add
                              </button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {SPECIALIZATIONS.filter(
                                (item) => !state.profile.specializations.includes(item),
                              ).map((item) => (
                                <button
                                  key={item}
                                  type="button"
                                  onClick={() => addSpecialization(item)}
                                  className="rounded-xl bg-[#5A646F] px-4 py-2 text-xs font-medium text-white"
                                >
                                  + {item}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>

                        <GradientCheckbox
                          checked={state.profile.notifyOnNewJobs}
                          onChange={(event) =>
                            updateState((previous) => ({
                              ...previous,
                              profile: {
                                ...previous.profile,
                                notifyOnNewJobs: event.target.checked,
                              },
                            }))
                          }
                          label="Send me notifications when new jobs are available in my region."
                          labelClassName="text-base font-medium text-[#3E3F43]"
                        />
                      </div>
                    </>
                  ) : null}

                  {state.currentStep === 2 ? (
                    <>
                      <h2 className="text-xl font-semibold text-[#0B0F17] lg:text-3xl">
                        Verification &amp; Certification
                      </h2>
                      <p className="mt-2 text-base text-[#556070]">
                        Please upload the required documents to verify your identity and expertise. PDF and image files only.
                      </p>

                      <div className="mt-10 space-y-6">
                        <div className="space-y-2">
                          <label className="text-base font-medium text-[#3E3F43]">
                            Valid ID Upload (National ID/Driver&apos;s License/Voter&apos;s Card)
                          </label>
                          <label className="mt-4 flex h-14 cursor-pointer items-center rounded-[24px] border border-[#B8C0CC33] bg-white">
                            <span className="flex h-full items-center gap-2 border-r border-[#DADDE2] bg-[#FAFAFA] px-6 text-sm font-medium text-[#444C58]">
                              <UploadCloud className="h-6 w-6" /> Upload File
                            </span>
                            <span className="px-4 text-xs text-[#9BA2AE] lg:text-sm">
                              {state.verification.idFileName || "No file chosen"}
                            </span>
                            <input
                              type="file"
                              accept="application/pdf,image/*"
                              className="hidden"
                              onChange={(event) => {
                                const file = event.target.files?.[0] ?? null;
                                event.target.value = "";
                                updateVerificationFile("idFile", "idFileName", "Valid ID", file);
                              }}
                            />
                          </label>
                          {state.verification.idFileName ? (
                            <p className="flex items-center justify-between text-xs text-[#5A646F] lg:text-sm">
                              <span>{state.verification.idFileName}</span>
                              <CheckCircle2 className="h-3 w-3 text-[#25B229] lg:h-5 lg:w-5" />
                            </p>
                          ) : null}
                        </div>

                        <div className="space-y-2">
                          <label className="text-base font-medium text-[#3E3F43]">
                            Relevant Certification (Solar Training, Electrical License)
                          </label>
                          <label className="mt-4 flex h-14 cursor-pointer items-center rounded-[24px] border border-[#B8C0CC33] bg-white">
                            <span className="flex h-full items-center gap-2 border-r border-[#DADDE2] bg-[#FAFAFA] px-6 text-sm font-medium text-[#444C58]">
                              <UploadCloud className="h-6 w-6" /> Upload File
                            </span>
                            <span className="px-4 text-xs text-[#9BA2AE] lg:text-sm">
                              {state.verification.certificateFileName || "No file chosen"}
                            </span>
                            <input
                              type="file"
                              accept="application/pdf,image/*"
                              className="hidden"
                              onChange={(event) => {
                                const file = event.target.files?.[0] ?? null;
                                event.target.value = "";
                                updateVerificationFile("certificateFile", "certificateFileName", "Relevant certification", file);
                              }}
                            />
                          </label>
                          {state.verification.certificateFileName ? (
                            <p className="flex items-center justify-between text-xs text-[#5A646F] lg:text-sm">
                              <span>{state.verification.certificateFileName}</span>
                              <CheckCircle2 className="h-3 w-3 text-[#25B229] lg:h-5 lg:w-5" />
                            </p>
                          ) : null}
                        </div>
                      </div>
                    </>
                  ) : null}

                  {state.currentStep === 3 ? (
                    <>
                      <h2 className="text-xl font-semibold text-[#0B0F17] lg:text-3xl">
                        Choose Your Service Areas
                      </h2>
                      <p className="mt-2 text-base text-[#556070]">
                        Select the cities you are willing to accept installation jobs in.
                      </p>

                      <div className="mt-10 space-y-2">
                        <label className="text-base font-medium text-[#3E3F43]">
                          Select Service Areas
                        </label>
                        <div className="mt-4 rounded-[24px] border border-[#DADDE2] p-4">
                          <div className="min-h-22 rounded-4xl border border-[#DADDE2] bg-[#B8C0CC33] p-3">
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
                              {state.serviceAreas.length === 0 ? (
                                <span className="text-sm text-[#B1B7C1]">
                                  No area selected yet
                                </span>
                              ) : null}
                            </div>
                          </div>
                          <div className="mt-3 flex gap-2">
                            <Input
                              value={serviceAreaInput}
                              onChange={(event) => setServiceAreaInput(event.target.value)}
                              placeholder="Type a city"
                              className="h-10 rounded-[20px] border-[#D0D5DD] px-4 text-sm"
                            />
                            <button
                              type="button"
                              onClick={() => addServiceArea(serviceAreaInput)}
                              className="rounded-xl bg-[#12A312] px-4 py-2 text-sm font-medium text-white"
                            >
                              Add
                            </button>
                          </div>
                          <div className="mt-3 flex flex-wrap gap-2">
                            {LOCATIONS.filter((area) => !state.serviceAreas.includes(area)).map((area) => (
                              <button
                                key={area}
                                type="button"
                                onClick={() => addServiceArea(area)}
                                className="rounded-xl bg-[#5A646F] px-4 py-2 text-xs text-white"
                              >
                                + {area}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </>
                  ) : null}

                  {message ? <p className="mt-6 text-sm text-[#D64545]">{message}</p> : null}

                  <div className="mt-14 flex items-center justify-between">
                    {state.currentStep > 1 ? (
                      <button
                        type="button"
                        onClick={() =>
                          updateState((previous) => ({
                            ...previous,
                            currentStep: (previous.currentStep - 1) as 1 | 2 | 3,
                          }))
                        }
                        className="h-12 cursor-pointer rounded-xl border-2 border-[#ADB0B5] px-5 text-lg font-medium lg:px-8"
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
                          updateState((previous) => ({ ...previous, currentStep: 2 }));
                          return;
                        }

                        if (state.currentStep === 2 && canProceedStep2) {
                          updateState((previous) => ({ ...previous, currentStep: 3 }));
                          return;
                        }

                        if (state.currentStep === 3 && canSubmitStep3) {
                          void handleSubmit();
                        }
                      }}
                      disabled={
                        isSubmitting ||
                        (state.currentStep === 1 && !canProceedStep1) ||
                        (state.currentStep === 2 && !canProceedStep2) ||
                        (state.currentStep === 3 && !canSubmitStep3)
                      }
                      className="flex h-12 items-center gap-3 rounded-xl bg-[#12A312] px-5 text-lg font-medium text-white disabled:cursor-not-allowed disabled:opacity-50 lg:px-8"
                    >
                      {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                      {state.currentStep === 3 ? "Submit" : "Next"}
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
};

export { InstallerOnboardingGate };
