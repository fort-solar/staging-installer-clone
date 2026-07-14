import { appGet, appRequest } from "@/lib/api/client";
import type {
  ApiCollectionResponse,
  ApiDataResponse,
  ApiSuccessResponse,
  ApplyToInstallerJobPayload,
  CreateInstallerPaymentMethodPayload,
  InstallerJobApiRecord,
  InstallerJobDetailApiResponse,
  InstallerJobRecord,
  InstallerJobListApiResponse,
  InstallerJobStateApiResponse,
  InstallerOnboardingApiResponse,
  InstallerPaymentMethodListApiResponse,
  InstallerPayoutListApiResponse,
  InstallerProfileApiResponse,
  InstallerProjectListApiResponse,
  ReportInstallerJobIssuePayload,
  SaveInstallerJobPayload,
  StartInstallerJobPayload,
  SubmitInstallerOnboardingApiResponse,
  SubmitInstallerOnboardingPayload,
  UpdateInstallerProfilePayload,
} from "@/types/api.types";

type PaginationQuery = {
  page?: number;
  limit?: number;
};

type InstallerJobsQuery = PaginationQuery & {
  search?: string;
  tab?: "board" | "applications" | "saved" | "completed";
  sort?: "newest" | "oldest";
  category?:
    | "all"
    | "full_installation"
    | "maintenance"
    | "repairs"
    | "audits"
    | "battery";
  systemSize?: "all" | "small" | "medium" | "commercial";
};

type InstallerPayoutsQuery = PaginationQuery & {
  status?: "Pending" | "Approved" | "Declined" | "All";
};

const DEFAULT_PAGE_SIZE = 20;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function readString(record: Record<string, unknown>, keys: string[], fallback = "") {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return fallback;
}

function readNullableString(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }

    if (value === null) {
      return null;
    }
  }

  return null;
}

function readNumber(record: Record<string, unknown>, keys: string[], fallback = 0) {
  for (const key of keys) {
    const value = record[key];

    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === "string" && value.trim()) {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
  }

  return fallback;
}

function readNullableNumber(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = record[key];

    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === "string" && value.trim()) {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }

    if (value === null) {
      return null;
    }
  }

  return null;
}

function readArray(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    if (Array.isArray(value)) {
      return value;
    }
  }

  return [];
}

function readStringArray(record: Record<string, unknown>, keys: string[]) {
  return readArray(record, keys)
    .map((value) => (typeof value === "string" ? value.trim() : ""))
    .filter(Boolean);
}

function parseLocation(location: string) {
  const parts = location
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);

  return {
    city: parts[0] ?? "",
    state: parts[1] ?? "",
    country: parts.length > 2 ? parts[parts.length - 1] ?? "" : "",
  };
}

function buildLocation(parts: Array<string | null | undefined>) {
  return parts.map((part) => part?.trim()).filter(Boolean).join(", ");
}

function formatBudgetLabel(value: string | number) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return `₦${value.toLocaleString("en-NG")}`;
  }

  const normalized = String(value).trim();
  if (!normalized) {
    return "Budget on request";
  }

  const numeric = Number(normalized.replace(/[^\d.-]/g, ""));
  if (Number.isFinite(numeric) && /\d/.test(normalized)) {
    return normalized.includes("₦") || normalized.toLowerCase().includes("ngn")
      ? normalized
      : `₦${numeric.toLocaleString("en-NG")}`;
  }

  return normalized;
}

function formatPostedAgo(value: string) {
  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp)) {
    return "Recently posted";
  }

  const diffMs = Date.now() - timestamp;
  const diffMinutes = Math.max(1, Math.floor(diffMs / (1000 * 60)));

  if (diffMinutes < 60) {
    return `Posted ${diffMinutes} minute${diffMinutes === 1 ? "" : "s"} ago`;
  }

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return `Posted ${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
  }

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) {
    return `Posted ${diffDays} day${diffDays === 1 ? "" : "s"} ago`;
  }

  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths < 12) {
    return `Posted ${diffMonths} month${diffMonths === 1 ? "" : "s"} ago`;
  }

  const diffYears = Math.floor(diffMonths / 12);
  return `Posted ${diffYears} year${diffYears === 1 ? "" : "s"} ago`;
}

function formatDateLabel(value: string | null) {
  if (!value) {
    return "Flexible";
  }

  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp)) {
    return value;
  }

  return new Intl.DateTimeFormat("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(timestamp);
}

function inferJobType(record: Record<string, unknown>, systemSizeKw: number | null) {
  const explicitJobType = readString(record, ["jobType"]);
  if (explicitJobType) {
    return explicitJobType;
  }

  const source = [
    readString(record, ["title"]),
    readString(record, ["description", "summary"]),
    readString(record, ["package_request_name"]),
  ]
    .join(" ")
    .toLowerCase();

  if (source.includes("maintenance") || source.includes("servicing")) {
    return "Maintenance & Servicing";
  }

  if (source.includes("repair") || source.includes("troubleshoot")) {
    return "Repairs & Troubleshooting";
  }

  if (source.includes("audit")) {
    return "Energy Audit";
  }

  if (source.includes("battery")) {
    return "Battery Replacement";
  }

  if ((systemSizeKw ?? 0) >= 15) {
    return "Full Installation (Commercial)";
  }

  if ((systemSizeKw ?? 0) > 0) {
    return "Full Installation";
  }

  return "Installation Opportunity";
}

function formatSystemSize(record: Record<string, unknown>, systemSizeKw: number | null) {
  const explicitSystemSize = readString(record, ["systemSize"]);
  if (explicitSystemSize) {
    return explicitSystemSize;
  }

  if (systemSizeKw && systemSizeKw > 0) {
    return `${systemSizeKw}kW Solar System`;
  }

  return "Not specified";
}

function inferDuration(
  record: Record<string, unknown>,
  scheduledDate: string | null,
  deadline: string | null,
) {
  const explicitDuration = readString(record, ["duration"]);
  if (explicitDuration) {
    return explicitDuration;
  }

  if (scheduledDate && deadline) {
    const scheduledTimestamp = Date.parse(scheduledDate);
    const deadlineTimestamp = Date.parse(deadline);

    if (Number.isFinite(scheduledTimestamp) && Number.isFinite(deadlineTimestamp)) {
      const diffDays = Math.ceil(
        Math.abs(deadlineTimestamp - scheduledTimestamp) / (1000 * 60 * 60 * 24),
      );

      if (diffDays > 0) {
        return `${diffDays} day${diffDays === 1 ? "" : "s"}`;
      }
    }
  }

  return "To be confirmed";
}

function buildSummary(record: Record<string, unknown>, description: string) {
  const explicitSummary = readString(record, ["summary"]);
  if (explicitSummary) {
    return explicitSummary;
  }

  if (!description) {
    return "Job details will be shared after review.";
  }

  if (description.length <= 160) {
    return description;
  }

  return `${description.slice(0, 157).trimEnd()}...`;
}

function buildList(record: Record<string, unknown>, keys: string[], fallback: string[]) {
  const explicit = readStringArray(record, keys);
  if (explicit.length) {
    return explicit;
  }

  return fallback.filter(Boolean);
}

function buildTags(
  record: Record<string, unknown>,
  createdAt: string,
  systemSizeKw: number | null,
  requiredExperienceYears: number,
) {
  const explicitTags = readStringArray(record, ["tags"]);
  if (explicitTags.length) {
    return explicitTags;
  }

  const tags = new Set<string>();
  const createdTimestamp = Date.parse(createdAt);

  if (Number.isFinite(createdTimestamp) && Date.now() - createdTimestamp <= 1000 * 60 * 60 * 24 * 7) {
    tags.add("New");
  }

  const packageRequestStatus = readString(record, ["package_request_status"]);
  if (packageRequestStatus) {
    tags.add(packageRequestStatus.replace(/[_-]+/g, " "));
  }

  if (systemSizeKw && systemSizeKw > 0) {
    tags.add(`${systemSizeKw}kW`);
  }

  if (requiredExperienceYears > 0) {
    tags.add(`${requiredExperienceYears}+ Yrs Exp`);
  }

  return Array.from(tags);
}

export function normalizeInstallerJobRecord(record: InstallerJobApiRecord): InstallerJobRecord {
  const raw: Record<string, unknown> = isRecord(record) ? record : {};
  const locationFromFields = buildLocation([
    readString(raw, ["address"]),
    readString(raw, ["city"]),
    readString(raw, ["state"]),
    readString(raw, ["country"]),
  ]);
  const location = readString(raw, ["location"], locationFromFields);
  const parsedLocation = parseLocation(location);
  const city = readString(raw, ["city"], parsedLocation.city);
  const state = readString(raw, ["state"], parsedLocation.state);
  const country = readString(raw, ["country"], parsedLocation.country);
  const budget =
    raw.budget === null || raw.budget === undefined
      ? readString(raw, ["budgetLabel"], "Budget on request")
      : (raw.budget as string | number);
  const createdAt = readString(raw, ["created_at"], new Date().toISOString());
  const scheduledDate = readNullableString(raw, ["scheduled_date"]);
  const deadline = readNullableString(raw, ["deadline"]);
  const requiredExperienceYears = readNumber(raw, ["required_experience_years"], 0);
  const systemSizeKw = readNullableNumber(raw, ["system_size_kw"]);
  const description = readString(raw, ["description", "summary"]);
  const summary = buildSummary(raw, description);
  const jobType = inferJobType(raw, systemSizeKw);
  const systemSize = formatSystemSize(raw, systemSizeKw);
  const startDateLabel = readString(raw, ["startDateLabel"], formatDateLabel(scheduledDate || deadline));
  const notes = readNullableString(raw, ["notes"]);

  return {
    id: readString(raw, ["id"]),
    slug: readString(raw, ["slug"], readString(raw, ["id"])),
    title: readString(raw, ["title"], "Untitled Job"),
    description,
    location,
    status: readString(raw, ["status"], "open"),
    budget,
    deadline,
    scheduled_date: scheduledDate,
    created_at: createdAt,
    required_experience_years: requiredExperienceYears,
    installation_id: readNullableString(raw, ["installation_id"]),
    package_request_id: readNullableString(raw, ["package_request_id"]),
    package_request_name: readNullableString(raw, ["package_request_name"]),
    package_request_status: readNullableString(raw, ["package_request_status"]),
    assigned_to: readNullableString(raw, ["assigned_to"]),
    customer_user_id: readNullableString(raw, ["customer_user_id"]),
    customer_name: readNullableString(raw, ["customer_name"]),
    customer_email: readNullableString(raw, ["customer_email"]),
    customer_phone: readNullableString(raw, ["customer_phone"]),
    address: readNullableString(raw, ["address"]),
    city,
    state,
    country,
    system_size_kw: systemSizeKw,
    notes,
    distanceKm: readNumber(raw, ["distanceKm", "distance_km"], 0),
    budgetLabel: readString(raw, ["budgetLabel"], formatBudgetLabel(budget)),
    postedAgo: readString(raw, ["postedAgo"], formatPostedAgo(createdAt)),
    jobType,
    systemSize,
    duration: inferDuration(raw, scheduledDate, deadline),
    startDateLabel,
    tags: buildTags(raw, createdAt, systemSizeKw, requiredExperienceYears),
    summary,
    scope: buildList(raw, ["scope"], summary ? [summary] : []),
    requirements: buildList(
      raw,
      ["requirements"],
      requiredExperienceYears > 0 ? [`Minimum ${requiredExperienceYears} years of experience.`] : [],
    ),
    components: buildList(
      raw,
      ["components"],
      [
        readString(raw, ["package_request_name"]),
        systemSize !== "Not specified" ? `System size: ${systemSize}` : "",
      ],
    ),
    siteConditions: buildList(
      raw,
      ["siteConditions"],
      [
        readString(raw, ["address", "location"]) || "Site inspection details will be confirmed.",
      ],
    ),
  };
}

function normalizeInstallerJobListResponse(
  payload: InstallerJobListApiResponse,
): ApiCollectionResponse<InstallerJobRecord> {
  return {
    ...payload,
    data: payload.data.map(normalizeInstallerJobRecord),
  };
}

function normalizeInstallerJobDetailResponse(
  payload: InstallerJobDetailApiResponse,
): ApiDataResponse<InstallerJobRecord> {
  return {
    ...payload,
    data: normalizeInstallerJobRecord(payload.data),
  };
}

function buildQuery(params: Record<string, string | number | undefined>) {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") {
      return;
    }

    searchParams.set(key, String(value));
  });

  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

export function buildInstallerJobsPath(params: InstallerJobsQuery = {}) {
  return `/api/v1/installers/jobs${buildQuery({
    ...params,
    limit: params.limit ?? DEFAULT_PAGE_SIZE,
  })}`;
}

export function listInstallerJobs(params: InstallerJobsQuery = {}) {
  return appGet<InstallerJobListApiResponse>(buildInstallerJobsPath(params)).then(
    normalizeInstallerJobListResponse,
  );
}

export function getInstallerJobState() {
  return appGet<InstallerJobStateApiResponse>("/api/v1/installers/jobs/state");
}

export function getInstallerJob(id: string) {
  return appGet<InstallerJobDetailApiResponse>(`/api/v1/installers/jobs/${id}`).then(
    normalizeInstallerJobDetailResponse,
  );
}

export function applyToInstallerJob(id: string, payload: ApplyToInstallerJobPayload) {
  return appRequest<ApiSuccessResponse>(`/api/v1/installers/jobs/${id}/apply`, {
    method: "POST",
    body: payload,
  });
}

export function saveInstallerJob(id: string, payload: SaveInstallerJobPayload) {
  return appRequest<ApiSuccessResponse>(`/api/v1/installers/jobs/${id}/saved`, {
    method: "POST",
    body: payload,
  });
}

export function unsaveInstallerJob(id: string) {
  return appRequest<ApiSuccessResponse>(`/api/v1/installers/jobs/${id}/saved`, {
    method: "DELETE",
  });
}

export function startInstallerJob(id: string, payload: StartInstallerJobPayload) {
  return appRequest<ApiSuccessResponse>(`/api/v1/installers/jobs/${id}/start`, {
    method: "POST",
    body: payload,
  });
}

export function reportInstallerJobIssue(
  id: string,
  payload: ReportInstallerJobIssuePayload,
) {
  return appRequest<ApiSuccessResponse>(`/api/v1/installers/jobs/${id}/issues`, {
    method: "POST",
    body: payload,
  });
}

export function getInstallerOnboarding() {
  return appGet<InstallerOnboardingApiResponse>("/api/v1/installers/onboarding");
}

function buildInstallerOnboardingFormData(payload: SubmitInstallerOnboardingPayload) {
  const formData = new FormData();
  const parsedExperienceYears = Number.parseInt(payload.profile.yearsOfExperience, 10);
  const profile = {
    ...payload.profile,
    location: payload.profile.primaryLocation,
    experienceYears: Number.isFinite(parsedExperienceYears) ? parsedExperienceYears : null,
  };
  const verification = {
    idFileName:
      payload.verification.idFileName?.trim() ||
      (payload.verification.id_file instanceof File ? payload.verification.id_file.name : ""),
    certificateFileName:
      payload.verification.certificateFileName?.trim() ||
      (payload.verification.certificate_file instanceof File
        ? payload.verification.certificate_file.name
        : ""),
  };

  formData.append("profile", JSON.stringify(profile));
  formData.append("serviceAreas", JSON.stringify(payload.serviceAreas));
  formData.append("verification", JSON.stringify(verification));

  if (payload.verification.id_file) {
    formData.append("id_file", payload.verification.id_file);
  }

  if (payload.verification.certificate_file) {
    formData.append("certificate_file", payload.verification.certificate_file);
  }

  return formData;
}

export function submitInstallerOnboarding(payload: SubmitInstallerOnboardingPayload) {
  return appRequest<SubmitInstallerOnboardingApiResponse>("/api/v1/installers/onboarding", {
    method: "POST",
    body: buildInstallerOnboardingFormData(payload),
  });
}

export function getInstallerProfile() {
  return appGet<InstallerProfileApiResponse>("/api/v1/installers/profile");
}

export function updateInstallerProfile(payload: UpdateInstallerProfilePayload) {
  return appRequest<InstallerProfileApiResponse>("/api/v1/installers/profile", {
    method: "PATCH",
    body: payload,
  });
}

export function getInstallerProjects(params: PaginationQuery = {}) {
  return appGet<InstallerProjectListApiResponse>(
    `/api/v1/installers/projects${buildQuery({
      ...params,
      limit: params.limit ?? DEFAULT_PAGE_SIZE,
    })}`,
  );
}

export function getInstallerPaymentMethods() {
  return appGet<InstallerPaymentMethodListApiResponse>(
    "/api/v1/installers/payment-methods",
  );
}

export function createInstallerPaymentMethod(
  payload: CreateInstallerPaymentMethodPayload,
) {
  return appRequest<ApiSuccessResponse>("/api/v1/installers/payment-methods", {
    method: "POST",
    body: payload,
  });
}

export function deleteInstallerPaymentMethod(id: string) {
  return appRequest<ApiSuccessResponse>(`/api/v1/installers/payment-methods/${id}`, {
    method: "DELETE",
  });
}

export function getInstallerPayouts(params: InstallerPayoutsQuery = {}) {
  return appGet<InstallerPayoutListApiResponse>(
    `/api/v1/installers/payouts${buildQuery({
      ...params,
      limit: params.limit ?? DEFAULT_PAGE_SIZE,
    })}`,
  );
}

export function completeInstallerJob(id: string, payload: { jobId: string }) {
  return appRequest<ApiSuccessResponse>(`/api/v1/installers/jobs/${id}/complete`, {
    method: "POST",
    body: payload,
  });
}

export function uploadInstallerInstallationPhoto(id: string, formData: FormData) {
  return appRequest<ApiSuccessResponse>(`/api/v1/installers/installations/${id}/photos`, {
    method: "POST",
    body: formData,
  });
}
