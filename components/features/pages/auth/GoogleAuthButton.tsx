"use client";

import React, { useEffect, useRef, useState } from "react";
import { GoogleLogin } from "@react-oauth/google";
import { GoogleIcon } from "@/components/features/icons/GoogleIcon";
import { cn } from "@/lib/utils";

type GoogleAuthButtonProps = {
  className?: string;
  label?: string;
} & Omit<
  React.ComponentProps<typeof GoogleLogin>,
  "containerProps" | "shape" | "size" | "text" | "theme" | "width"
>;

const DEFAULT_BUTTON_WIDTH = 360;

const GoogleAuthButton = ({
  className,
  label = "Continue With Google",
  ...googleButtonProps
}: GoogleAuthButtonProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [buttonWidth, setButtonWidth] = useState(DEFAULT_BUTTON_WIDTH);

  useEffect(() => {
    const node = containerRef.current;

    if (!node) {
      return;
    }

    const updateWidth = () => {
      const nextWidth = Math.max(Math.floor(node.getBoundingClientRect().width), 200);
      setButtonWidth((currentWidth) => (currentWidth === nextWidth ? currentWidth : nextWidth));
    };

    updateWidth();

    const observer = new ResizeObserver(updateWidth);
    observer.observe(node);

    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative w-full rounded-2xl focus-within:ring-2 focus-within:ring-[#16A34A]/20",
        className,
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none flex h-12 w-full items-center justify-center gap-3 rounded-2xl border border-[#E5E7EB] bg-white px-4 text-[15px] font-medium text-[#6B7280] shadow-[0_1px_2px_rgba(15,23,42,0.04)]"
      >
        <GoogleIcon />
        <span>{label}</span>
      </div>
      <GoogleLogin
        {...googleButtonProps}
        text="continue_with"
        shape="rectangular"
        theme="outline"
        size="large"
        width={buttonWidth}
        containerProps={{
          className:
            "absolute inset-x-0 top-0 z-10 origin-top scale-y-[1.2] opacity-0 [&>div]:!w-full [&_iframe]:!w-full",
        }}
      />
    </div>
  );
};

export { GoogleAuthButton };
