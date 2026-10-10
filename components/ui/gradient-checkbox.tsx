"use client";

import * as React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

type GradientCheckboxProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "children" | "type"
> & {
  label?: React.ReactNode;
  className?: string;
  labelClassName?: string;
  indicatorClassName?: string;
};

const GradientCheckbox = React.forwardRef<HTMLInputElement, GradientCheckboxProps>(
  ({ label, className, labelClassName, indicatorClassName, disabled, ...props }, ref) => (
    <label
      className={cn(
        "inline-flex items-center gap-3",
        disabled && "cursor-not-allowed opacity-60",
        className,
      )}
    >
      <span className="relative inline-flex shrink-0">
        <input
          {...props}
          ref={ref}
          type="checkbox"
          disabled={disabled}
          className="peer sr-only"
        />
        <span
          className={cn(
            "flex h-5 w-5 items-center justify-center rounded-md border border-[#D0D5DD] bg-white shadow-sm transition-all duration-200",
            "peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[#22A128]/35",
            "peer-checked:border-transparent peer-checked:bg-[linear-gradient(94.62deg,#2CB22C_-8.83%,#048A05_110.95%)] peer-checked:shadow-[0_10px_24px_rgba(34,161,40,0.22)]",
            "peer-checked:[&_svg]:opacity-100",
            indicatorClassName,
          )}
        >
          <Check className="h-3.5 w-3.5 text-white opacity-0 transition-opacity duration-200" />
        </span>
      </span>
      {label ? (
        <span className={cn("text-sm text-[#475569]", labelClassName)}>{label}</span>
      ) : null}
    </label>
  ),
);

GradientCheckbox.displayName = "GradientCheckbox";

export default GradientCheckbox;
