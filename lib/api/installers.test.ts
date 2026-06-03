import {
  applyToInstallerJob,
  buildInstallerJobsPath,
  normalizeInstallerJobRecord,
  reportInstallerJobIssue,
  saveInstallerJob,
  startInstallerJob,
  submitInstallerOnboarding,
  unsaveInstallerJob,
} from "@/lib/api/installers";

describe("normalizeInstallerJobRecord", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("maps the admin job response shape into the installer job model", () => {
    jest.spyOn(Date, "now").mockReturnValue(new Date("2026-05-30T00:00:00.000Z").getTime());

    const normalized = normalizeInstallerJobRecord({
      id: "job-1",
      slug: "ikeja-commercial-installation",
      title: "Commercial Solar Installation",
      description: "Install a new 15kW solar system for a business customer in Ikeja.",
      location: "Ikeja, Lagos, Nigeria",
      status: "open",
      budget: 250000,
      scheduled_date: "2026-06-05T00:00:00.000Z",
      created_at: "2026-05-26T00:00:00.000Z",
      required_experience_years: 4,
      package_request_name: "Enterprise Package",
      package_request_status: "approved",
      customer_name: "Acme Foods",
      address: "14 Allen Avenue",
      city: "Ikeja",
      state: "Lagos",
      country: "Nigeria",
      system_size_kw: 15,
      notes: "Coordinate site access with the customer before arrival.",
    });

    expect(normalized.location).toBe("Ikeja, Lagos, Nigeria");
    expect(normalized.budgetLabel).toBe("₦250,000");
    expect(normalized.postedAgo).toBe("Posted 4 days ago");
    expect(normalized.jobType).toBe("Full Installation (Commercial)");
    expect(normalized.systemSize).toBe("15kW Solar System");
    expect(normalized.startDateLabel).toContain("2026");
    expect(normalized.tags).toEqual(
      expect.arrayContaining(["New", "approved", "15kW", "4+ Yrs Exp"]),
    );
    expect(normalized.requirements).toEqual(["Minimum 4 years of experience."]);
    expect(normalized.components).toEqual(
      expect.arrayContaining(["Enterprise Package", "System size: 15kW Solar System"]),
    );
    expect(normalized.siteConditions).toEqual(["14 Allen Avenue"]);
  });

  it("preserves legacy installer job fields when they are already present", () => {
    const normalized = normalizeInstallerJobRecord({
      id: "job-2",
      title: "Battery Replacement",
      description: "Replace an existing storage bank.",
      location: "Abuja, FCT",
      city: "Abuja",
      state: "FCT",
      budget: "₦55,000",
      budgetLabel: "₦55,000",
      postedAgo: "Posted 2 days ago",
      jobType: "Battery Replacement",
      systemSize: "Not specified",
      duration: "1 day",
      startDateLabel: "Flexible",
      tags: ["New", "Standard"],
      summary: "Replace a failed battery bank at a residential site.",
      scope: ["Remove the failed battery bank."],
      requirements: ["Experience with lithium battery systems."],
      components: ["Lithium battery bank"],
      siteConditions: ["Indoor installation"],
    });

    expect(normalized.budgetLabel).toBe("₦55,000");
    expect(normalized.postedAgo).toBe("Posted 2 days ago");
    expect(normalized.jobType).toBe("Battery Replacement");
    expect(normalized.tags).toEqual(["New", "Standard"]);
    expect(normalized.scope).toEqual(["Remove the failed battery bank."]);
    expect(normalized.siteConditions).toEqual(["Indoor installation"]);
  });
});

describe("submitInstallerOnboarding", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("serializes the updated multipart onboarding payload", async () => {
    const originalFetch = global.fetch;
    const responsePayload = {
      success: true,
      message: "Onboarding submitted",
      data: {
        id: "installer-1",
        userId: "user-1",
        email: "installer@example.com",
        location: "Lagos",
        primaryLocation: "Lagos",
        experienceLevel: null,
        experienceYears: 3,
        additionalInfo: null,
        skills: [],
        specializations: ["Residential"],
        serviceAreas: ["Lagos", "Ogun"],
        completedInstallations: 0,
        rating: 0,
        tier: null,
        notifyOnNewJobs: true,
        onboardingCompleted: true,
        onboardingCompletedAt: "2026-05-30T12:00:00.000Z",
      },
    };
    const fetchMock = jest.fn().mockResolvedValue(
      {
        ok: true,
        status: 200,
        headers: {
          get: (name: string) =>
            name.toLowerCase() === "content-type" ? "application/json" : null,
        },
        json: async () => responsePayload,
        text: async () => JSON.stringify(responsePayload),
      },
    );
    Object.defineProperty(global, "fetch", {
      configurable: true,
      writable: true,
      value: fetchMock,
    });
    const idFile = new File(["id"], "installer-id.pdf", {
      type: "application/pdf",
    });
    const certificateFile = new File(["certificate"], "nabcep.png", {
      type: "image/png",
    });

    try {
      await submitInstallerOnboarding({
        profile: {
          name: "Installer Example",
          primaryLocation: "Lagos",
          yearsOfExperience: "3",
          specializations: ["Residential"],
          notifyOnNewJobs: true,
        },
        verification: {
          idFileName: idFile.name,
          certificateFileName: certificateFile.name,
          id_file: idFile,
          certificate_file: certificateFile,
        },
        serviceAreas: ["Lagos", "Ogun"],
      });

      expect(fetchMock).toHaveBeenCalledTimes(1);

      const [path, init] = fetchMock.mock.calls[0] ?? [];
      expect(path).toBe("/api/proxy/api/v1/installers/onboarding");

      const body = init?.body;
      expect(body).toBeInstanceOf(FormData);

      const formData = body as FormData;
      expect(JSON.parse(String(formData.get("profile")))).toEqual({
        name: "Installer Example",
        primaryLocation: "Lagos",
        location: "Lagos",
        yearsOfExperience: "3",
        experienceYears: 3,
        specializations: ["Residential"],
        notifyOnNewJobs: true,
      });
      expect(JSON.parse(String(formData.get("serviceAreas")))).toEqual([
        "Lagos",
        "Ogun",
      ]);
      expect(JSON.parse(String(formData.get("verification")))).toEqual({
        idFileName: "installer-id.pdf",
        certificateFileName: "nabcep.png",
      });
      expect(formData.get("id_file")).toBe(idFile);
      expect(formData.get("certificate_file")).toBe(certificateFile);
      expect(formData.get("Profile")).toBeNull();
      expect(formData.get("ServiceAreas")).toBeNull();
      expect(formData.get("Verification")).toBeNull();
    } finally {
      Object.defineProperty(global, "fetch", {
        configurable: true,
        writable: true,
        value: originalFetch,
      });
    }
  });
});

describe("installer job request helpers", () => {
  it("builds installer job requests with the active board filters", () => {
    expect(
      buildInstallerJobsPath({
        page: 2,
        search: "lagos",
        tab: "saved",
        sort: "oldest",
        category: "maintenance",
        systemSize: "commercial",
      }),
    ).toBe(
      "/api/v1/installers/jobs?page=2&search=lagos&tab=saved&sort=oldest&category=maintenance&systemSize=commercial&limit=20",
    );
  });
});

describe("installer job mutations", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("sends apply, save, start, and issue-report payloads to the correct endpoints", async () => {
    const originalFetch = global.fetch;
    const responsePayload = {
      success: true,
      message: "OK",
    };
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: {
        get: (name: string) =>
          name.toLowerCase() === "content-type" ? "application/json" : null,
      },
      json: async () => responsePayload,
      text: async () => JSON.stringify(responsePayload),
    });
    Object.defineProperty(global, "fetch", {
      configurable: true,
      writable: true,
      value: fetchMock,
    });

    try {
      await applyToInstallerJob("job-1", {
        jobId: "job-1",
        proposal: "I can deliver this install in 5 days.",
        proposedBudget: 250000,
      });
      await saveInstallerJob("job-1", { jobId: "job-1" });
      await unsaveInstallerJob("job-1");
      await startInstallerJob("job-1", { jobId: "job-1" });
      await reportInstallerJobIssue("job-1", {
        jobId: "job-1",
        description: "Customer phone number is unreachable.",
        metadata: {
          reportedFrom: "installer-portal",
        },
      });

      expect(fetchMock.mock.calls).toEqual([
        [
          "/api/proxy/api/v1/installers/jobs/job-1/apply",
          expect.objectContaining({
            method: "POST",
            body: JSON.stringify({
              jobId: "job-1",
              proposal: "I can deliver this install in 5 days.",
              proposedBudget: 250000,
            }),
          }),
        ],
        [
          "/api/proxy/api/v1/installers/jobs/job-1/saved",
          expect.objectContaining({
            method: "POST",
            body: JSON.stringify({
              jobId: "job-1",
            }),
          }),
        ],
        [
          "/api/proxy/api/v1/installers/jobs/job-1/saved",
          expect.objectContaining({
            method: "DELETE",
          }),
        ],
        [
          "/api/proxy/api/v1/installers/jobs/job-1/start",
          expect.objectContaining({
            method: "POST",
            body: JSON.stringify({
              jobId: "job-1",
            }),
          }),
        ],
        [
          "/api/proxy/api/v1/installers/jobs/job-1/issues",
          expect.objectContaining({
            method: "POST",
            body: JSON.stringify({
              jobId: "job-1",
              description: "Customer phone number is unreachable.",
              metadata: {
                reportedFrom: "installer-portal",
              },
            }),
          }),
        ],
      ]);
    } finally {
      Object.defineProperty(global, "fetch", {
        configurable: true,
        writable: true,
        value: originalFetch,
      });
    }
  });
});
