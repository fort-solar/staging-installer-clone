import { appGet, appRequest } from "@/lib/api/client";
import type {
  AuthAccessTokenApiResponse,
  NotificationListApiResponse,
  NotificationSocketConfigApiResponse,
} from "@/types/api.types";

export function getNotificationSocketConfig() {
  return appGet<NotificationSocketConfigApiResponse>(
    "/api/v1/notifications/realtime/socket-io",
  );
}

export function getNotifications() {
  return appGet<NotificationListApiResponse>("/api/v1/notifications/");
}

export function markNotificationAsRead(id: string, metadata: Record<string, unknown> = {}) {
  return appRequest(`/api/v1/notifications/${id}`, {
    method: "PATCH",
    body: {
      is_read: true,
      metadata: {
        deliveryStatus: "Read",
        ...metadata,
      },
    },
  });
}

export function getRealtimeAccessToken() {
  return appGet<AuthAccessTokenApiResponse>("/api/auth/access-token");
}
