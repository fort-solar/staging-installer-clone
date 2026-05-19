"use client";

import React, { useMemo, useRef, useState } from "react";

type OtpInputProps = {
  length?: number;
  onChange?: (value: string) => void;
};

const OtpInput = ({ length = 6, onChange }: OtpInputProps) => {
  const [values, setValues] = useState<string[]>(() => Array.from({ length }, () => ""));
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);

  const otpValue = useMemo(() => values.join(""), [values]);

  const focusInput = (index: number) => {
    const input = inputsRef.current[index];
    if (input) {
      input.focus();
      input.select();
    }
  };

  const updateValues = (nextValues: string[]) => {
    setValues(nextValues);
    onChange?.(nextValues.join(""));
  };

  const handleChange = (index: number, value: string) => {
    const sanitized = value.replace(/\D/g, "");
    if (!sanitized) {
      const nextValues = [...values];
      nextValues[index] = "";
      updateValues(nextValues);
      return;
    }

    const nextValues = [...values];
    const chars = sanitized.split("");
    let currentIndex = index;
    chars.forEach((char) => {
      if (currentIndex >= length) return;
      nextValues[currentIndex] = char;
      currentIndex += 1;
    });
    updateValues(nextValues);

    if (currentIndex < length) {
      focusInput(currentIndex);
    }
  };

  const handleKeyDown = (index: number, event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Backspace" && !values[index] && index > 0) {
      const nextValues = [...values];
      nextValues[index - 1] = "";
      updateValues(nextValues);
      focusInput(index - 1);
    }
  };

  const handlePaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault();
    const pasted = event.clipboardData.getData("text").replace(/\D/g, "");
    if (!pasted) return;

    const nextValues = [...values];
    pasted.split("").slice(0, length).forEach((char, idx) => {
      nextValues[idx] = char;
    });
    updateValues(nextValues);
    focusInput(Math.min(pasted.length, length) - 1);
  };

  return (
    <div className="flex items-center gap-3">
      {Array.from({ length }).map((_, index) => (
        <input
          key={index}
          ref={(el) => {
            inputsRef.current[index] = el;
          }}
          value={values[index]}
          onChange={(event) => handleChange(index, event.target.value)}
          onKeyDown={(event) => handleKeyDown(index, event)}
          onPaste={handlePaste}
          inputMode="numeric"
          autoComplete={index === 0 ? "one-time-code" : "off"}
          maxLength={1}
          className="h-14 w-14 rounded-2xl border border-[#E5E7EB] text-center text-lg font-semibold text-[#0F172A] shadow-sm focus:border-[#16A34A] focus:outline-none focus:ring-2 focus:ring-[#16A34A]/20"
        />
      ))}
      <input type="hidden" value={otpValue} readOnly />
    </div>
  );
};

export { OtpInput };
