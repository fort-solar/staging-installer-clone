import { appRequest } from "@/lib/api/client";

type SubmitFormClientProps = {
  endpoint: string;
  method?: string;
  values: unknown;
};

export const submitFormClient = async <T = unknown>({
  endpoint,
  method,
  values,
}: SubmitFormClientProps): Promise<{ data?: T; error?: string }> => {
  const resolvedMethod = method ?? "POST";

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
