"use client";

import { useEffect, useState } from "react";
import { Bell, ExternalLink, Loader2, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  getNotificationSocketConfig,
  getNotifications,
  getRealtimeAccessToken,
  markNotificationAsRead,
} from "@/lib/notifications";
import type { NotificationRecord } from "@/types/api.types";

declare global {
  interface Window {
    OneSignal?: {
      init: (options: Record<string, unknown>) => Promise<void>;
      Notifications: {
        requestPermission: () => Promise<void>;
      };
    };
    OneSignalDeferred?: Array<
      (oneSignal: NonNullable<Window["OneSignal"]>) => void | Promise<void>
    >;
    __fortsolarOneSignalInitialized?: boolean;
  }
}

const apiOrigin =
  process.env.NEXT_PUBLIC_FORTSOLAR_API_BASE_URL ?? "https://api.fortsolar.ng";

function formatTimestamp(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
}

function InstallerNotificationCenter() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isActivatingBrowserPush, setIsActivatingBrowserPush] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [browserPushMessage, setBrowserPushMessage] = useState<string | null>(null);

  const unreadCount = notifications.filter((item) => !item.is_read).length;

  async function loadNotifications(refresh = false) {
    if (refresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      const payload = await getNotifications();
      setNotifications(payload.data);
      setError(null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load notifications.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }

  useEffect(() => {
    void loadNotifications();
  }, []);

  useEffect(() => {
    if (!open) {
      return;
    }

    void loadNotifications(true);
  }, [open]);

  useEffect(() => {
    let disposed = false;
    let disconnect: (() => void) | null = null;

    (async () => {
      try {
        const [socketConfig, tokenPayload, socketClient] = await Promise.all([
          getNotificationSocketConfig(),
          getRealtimeAccessToken(),
          import("socket.io-client"),
        ]);

        if (disposed) {
          return;
        }

        const socket = socketClient.io(apiOrigin, {
          path: socketConfig.socketPath || "/socket.io",
          auth: {
            token: tokenPayload.accessToken,
          },
          transports: ["websocket", "polling"],
        });

        const refreshFromRealtime = () => {
          void loadNotifications(true);
        };

        socketConfig.defaultEventNames.forEach((eventName) => {
          socket.on(eventName, refreshFromRealtime);
        });

        disconnect = () => {
          socket.disconnect();
        };
      } catch {
        disconnect = null;
      }
    })();

    return () => {
      disposed = true;
      disconnect?.();
    };
  }, []);

  async function handleNotificationClick(notification: NotificationRecord) {
    try {
      if (!notification.is_read) {
        await markNotificationAsRead(notification.id, {
          openedAt: new Date().toISOString(),
        });
        setNotifications((current) =>
          current.map((item) =>
            item.id === notification.id ? { ...item, is_read: true } : item,
          ),
        );
      }

      if (notification.link) {
        setOpen(false);
        router.push(notification.link);
      }
    } catch (markError) {
      setError(
        markError instanceof Error
          ? markError.message
          : "Unable to update the notification.",
      );
    }
  }

  async function activateBrowserPush() {
    const appId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;
    const safariWebId = process.env.NEXT_PUBLIC_ONESIGNAL_SAFARI_WEB_ID;

    if (!appId) {
      setBrowserPushMessage("Browser push is not configured for this environment yet.");
      return;
    }

    setIsActivatingBrowserPush(true);
    setBrowserPushMessage(null);

    try {
      await new Promise<void>((resolve, reject) => {
        if (typeof window === "undefined") {
          reject(new Error("Browser notifications are only available in the browser."));
          return;
        }

        window.OneSignalDeferred = window.OneSignalDeferred || [];
        window.OneSignalDeferred.push(async (oneSignal) => {
          try {
            if (!window.__fortsolarOneSignalInitialized) {
              const initConfig: Record<string, unknown> = {
                appId,
                serviceWorkerPath: "/OneSignalSDKWorker.js",
                serviceWorkerUpdaterPath: "/OneSignalSDKUpdaterWorker.js",
                notifyButton: { enable: false },
                allowLocalhostAsSecureOrigin: process.env.NODE_ENV !== "production",
              };

              if (safariWebId) {
                initConfig.safari_web_id = safariWebId;
              }

              await oneSignal.init(initConfig);
              window.__fortsolarOneSignalInitialized = true;
            }

            await oneSignal.Notifications.requestPermission();
            resolve();
          } catch (initError) {
            reject(initError);
          }
        });

        window.setTimeout(() => {
          reject(new Error("The browser notification SDK did not finish loading."));
        }, 5000);
      });

      setBrowserPushMessage("Browser notifications are now enabled.");
    } catch (activationError) {
      setBrowserPushMessage(
        activationError instanceof Error
          ? activationError.message
          : "Unable to enable browser notifications.",
      );
    } finally {
      setIsActivatingBrowserPush(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#D1D5DB] bg-white text-[#374151]"
          aria-label="Open notifications"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 ? (
            <span className="absolute right-1 top-1 inline-flex min-w-5 items-center justify-center rounded-full bg-[#16A34A] px-1 text-[10px] font-semibold text-white">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          ) : null}
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl rounded-[24px] border border-[#D6DEE7] bg-white p-0 sm:max-w-2xl">
        <DialogHeader className="border-b border-[#E6ECF2] px-6 py-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <DialogTitle className="text-left text-xl text-[#111827]">
                Notifications
              </DialogTitle>
              <DialogDescription className="mt-1 text-left text-sm text-[#667085]">
                Installer alerts, job updates, and payout activity.
              </DialogDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => void loadNotifications(true)}
                disabled={isRefreshing}
                className="rounded-xl border-[#D0D7E2] text-[#344054]"
              >
                {isRefreshing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                Refresh
              </Button>
              <Button
                type="button"
                onClick={() => void activateBrowserPush()}
                disabled={isActivatingBrowserPush}
                className="rounded-xl bg-[#169A2A] text-white hover:bg-[#138523]"
              >
                {isActivatingBrowserPush ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : null}
                Enable Browser Alerts
              </Button>
            </div>
          </div>
          {browserPushMessage ? (
            <p className="mt-3 text-left text-sm text-[#475467]">{browserPushMessage}</p>
          ) : null}
          {error ? <p className="mt-3 text-left text-sm text-[#D64545]">{error}</p> : null}
        </DialogHeader>

        <div className="max-h-[70vh] overflow-y-auto px-6 py-4">
          {isLoading ? (
            <div className="flex min-h-56 items-center justify-center text-sm text-[#667085]">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading notifications...
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex min-h-56 items-center justify-center rounded-2xl border border-dashed border-[#D8DFE8] bg-[#FAFBFC] text-sm text-[#667085]">
              No notifications yet.
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.map((notification) => (
                <button
                  key={notification.id}
                  type="button"
                  onClick={() => void handleNotificationClick(notification)}
                  className={`w-full rounded-2xl border px-4 py-4 text-left transition ${
                    notification.is_read
                      ? "border-[#E4E8EF] bg-white"
                      : "border-[#CFE7D1] bg-[#F6FFF7]"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-[#101828]">
                          {notification.title}
                        </p>
                        {!notification.is_read ? (
                          <span className="inline-flex h-2.5 w-2.5 rounded-full bg-[#16A34A]" />
                        ) : null}
                      </div>
                      <p className="mt-2 text-sm leading-6 text-[#475467]">
                        {notification.message}
                      </p>
                      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-[#667085]">
                        <span>{notification.type}</span>
                        <span>{formatTimestamp(notification.created_at)}</span>
                      </div>
                    </div>
                    {notification.link ? (
                      <ExternalLink className="mt-1 h-4 w-4 shrink-0 text-[#98A2B3]" />
                    ) : null}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export { InstallerNotificationCenter };
