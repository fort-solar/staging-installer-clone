import "server-only";
import { z } from "zod";

const DEFAULT_API_BASE_URL = "https://api.fortsolar.ng";

export function readNonEmptyEnv(...values: Array<string | null | undefined>) {
  for (const value of values) {
    const normalized = value?.trim();

    if (normalized) {
      return normalized;
    }
  }

  return undefined;
}

const serverEnvSchema = z.object({
  FORTSOLAR_API_BASE_URL: z.string().url(),
  NEXT_PUBLIC_FORTSOLAR_API_BASE_URL: z.string().url(),
  FORTSOLAR_INSTALLER_SESSION_SECRET: z.string().min(32, "must be at least 32 characters long"),
  NEXT_PUBLIC_GOOGLE_CLIENT_ID: z.string().optional(),
  NEXT_PUBLIC_ONESIGNAL_APP_ID: z.string().optional(),
  NEXT_PUBLIC_ONESIGNAL_SAFARI_WEB_ID: z.string().optional(),
});

const parsedEnv = serverEnvSchema.safeParse({
  FORTSOLAR_API_BASE_URL: readNonEmptyEnv(
    process.env.FORTSOLAR_API_BASE_URL,
    process.env.NEXT_PUBLIC_FORTSOLAR_API_BASE_URL,
    DEFAULT_API_BASE_URL,
  ),
  NEXT_PUBLIC_FORTSOLAR_API_BASE_URL: readNonEmptyEnv(
    process.env.NEXT_PUBLIC_FORTSOLAR_API_BASE_URL,
    process.env.FORTSOLAR_API_BASE_URL,
    DEFAULT_API_BASE_URL,
  ),
  FORTSOLAR_INSTALLER_SESSION_SECRET: readNonEmptyEnv(
    process.env.FORTSOLAR_INSTALLER_SESSION_SECRET,
    process.env.FORTSOLAR_SESSION_SECRET,
  ),
  NEXT_PUBLIC_GOOGLE_CLIENT_ID: readNonEmptyEnv(process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID),
  NEXT_PUBLIC_ONESIGNAL_APP_ID: readNonEmptyEnv(process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID),
  NEXT_PUBLIC_ONESIGNAL_SAFARI_WEB_ID: readNonEmptyEnv(
    process.env.NEXT_PUBLIC_ONESIGNAL_SAFARI_WEB_ID,
  ),
});

if (!parsedEnv.success) {
  const details = parsedEnv.error.issues
    .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
    .join("; ");

  throw new Error(`Invalid Fortsolar environment configuration. ${details}`);
}

export const env = {
  apiBaseUrl: parsedEnv.data.FORTSOLAR_API_BASE_URL,
  publicApiBaseUrl: parsedEnv.data.NEXT_PUBLIC_FORTSOLAR_API_BASE_URL,
  sessionSecret: parsedEnv.data.FORTSOLAR_INSTALLER_SESSION_SECRET,
  googleClientId: parsedEnv.data.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? null,
  oneSignalAppId: parsedEnv.data.NEXT_PUBLIC_ONESIGNAL_APP_ID ?? null,
  oneSignalSafariWebId: parsedEnv.data.NEXT_PUBLIC_ONESIGNAL_SAFARI_WEB_ID ?? null,
} as const;
