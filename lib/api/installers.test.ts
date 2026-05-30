import { normalizeInstallerJobRecord } from "@/lib/api/installers";

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
