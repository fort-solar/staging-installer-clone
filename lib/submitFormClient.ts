import { appRequest } from "@/lib/api/client";
import { queuePendingPortalSubmission } from "@/lib/pending-submissions";

type SubmitFormClientProps = {
  endpoint: string;
  method?: string;
  values: unknown;
};

const PENDING_ENDPOINTS: Record<string, string> = {
  "/auth/forgot-password": "forgot_password",
  "/auth/reset-password": "reset_password",
};

export const submitFormClient = async <T = unknown>({
  endpoint,
  method,
  values,
}: SubmitFormClientProps): Promise<{ data?: T; error?: string }> => {
  const resolvedMethod = method ?? "POST";

  if (endpoint in PENDING_ENDPOINTS) {
    queuePendingPortalSubmission(
      PENDING_ENDPOINTS[endpoint],
      endpoint,
      resolvedMethod,
      (values ?? {}) as Record<string, unknown>,
      "installer",
      "Endpoint not supplied yet. Payload captured for later API hookup.",
    );

    return {
      data: {
        success: true,
        pending: true,
      } as T,
    };
  }

  try {
    const data = await appRequest<T>(endpoint, {
      method: resolvedMethod as "POST" | "PUT" | "PATCH" | "DELETE",
      body: (values ?? null) as Record<string, unknown> | null,
    });

    return { data };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Something went wrong.",
    };
  }
};
