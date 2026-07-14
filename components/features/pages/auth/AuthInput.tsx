import React from "react";
import { Input } from "@/components/ui/input";

type AuthInputProps = React.ComponentPropsWithoutRef<"input"> & {
  label?: string;
  error?: string;
};

const AuthInput = ({ label, error, id, className, required, ...props }: AuthInputProps) => {
  const inputId =
    id ?? props.name ?? (label ? label.replace(/\s+/g, "-").toLowerCase() : undefined);

  return (
    <div className="space-y-2">
      {label ? (
        <label htmlFor={inputId} className="text-sm font-medium text-[#111827]">
          {label}
          {required ? <span className="text-red-500 ml-1">*</span> : null}
        </label>
      ) : null}
      <Input
        id={inputId}
        required={required}
        aria-invalid={Boolean(error)}
        className={[
          "h-14 rounded-2xl border border-transparent bg-[#F3F4F6] px-4 text-base text-[#111827]",
          "placeholder:text-[#9CA3AF] focus-visible:border-[#16A34A] focus-visible:ring-[#16A34A]/30",
          error ? "border-red-400 focus-visible:border-red-400 focus-visible:ring-red-300/40" : "",
          className ?? "",
        ]
          .filter(Boolean)
          .join(" ")}
        {...props}
      />
      {error ? <p className="text-xs text-red-500">{error}</p> : null}
    </div>
  );
};

export { AuthInput };
