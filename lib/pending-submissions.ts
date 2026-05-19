"use client";

import { appLogger } from "@/lib/api/logger";
import type { PendingEndpointSubmission, PortalRole } from "@/types/api.types";

const STORAGE_KEY = "fortsolar_installer_pending_submissions_v1";

function canUseStorage() {
  return typeof window !== "undefined";
}

function readSubmissions() {
  if (!canUseStorage()) {
    return [] as PendingEndpointSubmission[];
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as PendingEndpointSubmission[]) : [];
  } catch {
    return [] as PendingEndpointSubmission[];
  }
}

function writeSubmissions(entries: PendingEndpointSubmission[]) {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

export function queuePendingSubmission({
  action,
  endpoint,
  method,
  values,
  portal,
  notes,
}: Omit<PendingEndpointSubmission, "id" | "createdAt">) {
  const entry: PendingEndpointSubmission = {
    id: window.crypto?.randomUUID?.() ?? `pending_${Date.now()}`,
    action,
    endpoint,
    method,
    values,
    portal,
    notes,
    createdAt: new Date().toISOString(),
  };

  writeSubmissions([entry, ...readSubmissions()]);
  appLogger.info(`Queued pending submission for ${action}.`, entry);
  return entry;
}

export function queuePendingPortalSubmission(
  action: string,
  endpoint: string,
  method: string,
  values: Record<string, unknown>,
  portal: PortalRole,
  notes?: string,
) {
  return queuePendingSubmission({
    action,
    endpoint,
    method,
    values,
    portal,
    notes,
  });
}
