"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { AuthInput } from "@/components/features/pages/auth/AuthInput";
import { AuthButton } from "@/components/features/pages/auth/AuthButton";
import { AuthMessage } from "@/components/features/pages/auth/AuthMessage";
import { submitFormClient } from "@/lib/submitFormClient";

type ResetPasswordValues = {
  password: string;
  confirmPassword: string;
};

const RESET_PASSWORD_ENDPOINT = "/auth/reset-password";

const ResetPasswordForm = () => {
  const searchParams = useSearchParams();
  const token = useMemo(() => searchParams.get("token") ?? "", [searchParams]);
  const [status, setStatus] = useState<{ tone: "success" | "error"; message: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ResetPasswordValues>({
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (values: ResetPasswordValues) => {
    if (!token) {
      setStatus({ tone: "error", message: "Reset token is missing. Please use the link from your email." });
      return;
    }

    if (values.password !== values.confirmPassword) {
      setStatus({ tone: "error", message: "Passwords do not match." });
      return;
    }

    setIsSubmitting(true);
    setStatus(null);
    const { error } = await submitFormClient({
      endpoint: RESET_PASSWORD_ENDPOINT,
      values: {
        token,
        password: values.password,
        confirmPassword: values.confirmPassword,
      },
    });
    if (error) {
      setStatus({ tone: "error", message: error });
    } else {
      setStatus({
        tone: "success",
        message: "Password updated. You can now log in.",
      });
    }
    setIsSubmitting(false);
  };

  const isTokenMissing = !token;
  const passwordValue = watch("password");
  const confirmValue = watch("confirmPassword");
  const passwordsMatch = !passwordValue || passwordValue === confirmValue;

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <h1 className="text-3xl font-semibold text-[#0F172A]">Reset Your Password</h1>
        <p className="text-base text-[#6B7280]">
          No need to make it complicated, just choose something secure and easy
          to remember.
        </p>
      </div>

      {isTokenMissing ? (
        <AuthMessage
          tone="error"
          message="Reset token missing. Please use the password reset link sent to your email."
        />
      ) : null}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <AuthInput
          label="New Password"
          type="password"
          placeholder="••••••••••••••"
          autoComplete="new-password"
          {...register("password", {
            required: "Password is required",
            minLength: { value: 8, message: "Use at least 8 characters" },
          })}
          error={errors.password?.message}
        />

        <AuthInput
          label="Confirm New Password"
          type="password"
          placeholder="••••••••••••••"
          autoComplete="new-password"
          {...register("confirmPassword", {
            required: "Please confirm your password",
            validate: (value) => value === passwordValue || "Passwords do not match",
          })}
          error={errors.confirmPassword?.message}
        />

        {!passwordsMatch ? (
          <AuthMessage tone="error" message="Passwords do not match." />
        ) : null}

        <AuthMessage message={status?.message} tone={status?.tone} />

        <AuthButton isLoading={isSubmitting} disabled={isTokenMissing}>
          Update Password
        </AuthButton>
      </form>

      <p className="text-center text-sm text-[#64748B]">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-[#16A34A] hover:underline">
          Login
        </Link>
      </p>
    </div>
  );
};

export { ResetPasswordForm };
