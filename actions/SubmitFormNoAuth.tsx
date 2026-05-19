"use server";

import { BASE_URL } from "@/components/features/constants";
import { FormProps, FetchResponseType } from "@/types/api.types";

const submitFormNoAuthentication: (props: FormProps) => FetchResponseType = async ({
  endpoint,
  method,
  values,
}) => {
  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: method ?? "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(values),
    });


    if (!response.ok) {
      const isJson = response.headers.get("Content-Type")?.includes("application/json");
      const errorResponse = isJson ? await response.json().catch(() => null) : null;
     
    

      const errorMessage =
      errorResponse && typeof errorResponse === "object"
        ? Object.entries(errorResponse)
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            .map(([key, value]) => (Array.isArray(value) ? value.join(", ") : value))
            .join(" | ")
        : response.statusText;

      throw new Error(errorMessage);
    }
    const data = await response.json();
    return { data };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Something went wrong!" };
  }
};

export { submitFormNoAuthentication };
