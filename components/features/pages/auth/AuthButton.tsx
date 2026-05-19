import React from "react";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

type AuthButtonProps = React.ComponentPropsWithoutRef<"button"> & {
  isLoading?: boolean;
  showArrow?: boolean;
};

const AuthButton = ({
  isLoading,
  showArrow = true,
  className,
  children,
  ...props
}: AuthButtonProps) => {
  return (
    <Button
      type="submit"
      disabled={isLoading || props.disabled}
      className={[
        "h-14 mt-5 w-full rounded-2xl cursor-pointer bg-[linear-gradient(94.62deg,#2CB22C_-8.83%,#058A05_110.95%)] px-6",
        "text-base font-semibold text-white shadow-sm transition hover:opacity-95",
        "disabled:cursor-not-allowed disabled:opacity-70",
        className ?? "",
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      <span className="flex-1 text-left">{isLoading ? "Please wait..." : children}</span>
      {showArrow ? <ArrowRight className="h-5 w-5" /> : null}
    </Button>
  );
};

export { AuthButton };
