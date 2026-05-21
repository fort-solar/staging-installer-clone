import { appGet, appRequest } from "@/lib/api/client";
import type {
  ApiSuccessResponse,
  ApplyToInstallerJobPayload,
  CreateInstallerPaymentMethodPayload,
  InstallerJobDetailApiResponse,
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
  SubmitInstallerOnboardingPayload,
  UpdateInstallerProfilePayload,
} from "@/types/api.types";

type PaginationQuery = {
  page?: number;
  limit?: number;
};

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

export function listInstallerJobs(params: PaginationQuery = {}) {
  return appGet<InstallerJobListApiResponse>(
    `/api/v1/installers/jobs${buildQuery(params)}`,
  );
}

export function getInstallerJobState() {
  return appGet<InstallerJobStateApiResponse>("/api/v1/installers/jobs/state");
}

export function getInstallerJob(id: string) {
  return appGet<InstallerJobDetailApiResponse>(`/api/v1/installers/jobs/${id}`);
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

export function submitInstallerOnboarding(payload: SubmitInstallerOnboardingPayload) {
  return appRequest<ApiSuccessResponse>("/api/v1/installers/onboarding", {
    method: "POST",
    body: payload,
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
    `/api/v1/installers/projects${buildQuery(params)}`,
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

export function getInstallerPayouts(params: PaginationQuery = {}) {
  return appGet<InstallerPayoutListApiResponse>(
    `/api/v1/installers/payouts${buildQuery(params)}`,
  );
}
