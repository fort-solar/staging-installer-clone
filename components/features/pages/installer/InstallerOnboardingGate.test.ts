import {
  getOnboardingValidationState,
  isAcceptedVerificationFile,
  type OnboardingFormState,
} from "@/components/features/pages/installer/InstallerOnboardingGate";

function createOnboardingState(
  overrides: Partial<OnboardingFormState> = {},
): OnboardingFormState {
  return {
    currentStep: 2,
    completed: false,
    profile: {
      name: "Installer Example",
      primaryLocation: "Lagos",
      yearsOfExperience: "3",
      specializations: ["Residential"],
      notifyOnNewJobs: true,
      ...(overrides.profile ?? {}),
    },
    verification: {
      idFile: null,
      certificateFile: null,
      idFileName: "",
      certificateFileName: "",
      ...(overrides.verification ?? {}),
    },
    serviceAreas: overrides.serviceAreas ?? [],
  };
}

describe("installer onboarding validation", () => {
  it("requires both an id card and certificate before step two can continue", () => {
    expect(
      getOnboardingValidationState(
        createOnboardingState({
          verification: {
            idFile: null,
            certificateFile: null,
            idFileName: "installer-id.pdf",
            certificateFileName: "",
          },
        }),
      ).canProceedStep2,
    ).toBe(false);

    expect(
      getOnboardingValidationState(
        createOnboardingState({
          verification: {
            idFile: null,
            certificateFile: null,
            idFileName: "installer-id.pdf",
            certificateFileName: "solar-cert.png",
          },
        }),
      ).canProceedStep2,
    ).toBe(true);
  });

  it("accepts only pdf and image verification uploads", () => {
    expect(
      isAcceptedVerificationFile(
        new File(["id"], "installer-id.pdf", { type: "application/pdf" }),
      ),
    ).toBe(true);
    expect(
      isAcceptedVerificationFile(
        new File(["badge"], "license.jpg", { type: "image/jpeg" }),
      ),
    ).toBe(true);
    expect(
      isAcceptedVerificationFile(
        new File(["notes"], "notes.txt", { type: "text/plain" }),
      ),
    ).toBe(false);
  });
});
