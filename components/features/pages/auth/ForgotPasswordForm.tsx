"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { AuthInput } from "@/components/features/pages/auth/AuthInput";
import { AuthButton } from "@/components/features/pages/auth/AuthButton";
import { AuthMessage } from "@/components/features/pages/auth/AuthMessage";
import { submitFormClient } from "@/lib/submitFormClient";

type ForgotPasswordValues = {
  email: string;
};

const FORGOT_PASSWORD_ENDPOINT = "/auth/forgot-password";

const ForgotPasswordForm = () => {
  const [status, setStatus] = useState<{ tone: "success" | "error"; message: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordValues>({
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (values: ForgotPasswordValues) => {
    setIsSubmitting(true);
    setStatus(null);
    const { error } = await submitFormClient({
      endpoint: FORGOT_PASSWORD_ENDPOINT,
      values,
    });
    if (error) {
      setStatus({ tone: "error", message: error });
    } else {
      setStatus({
        tone: "success",
        message: "Reset link sent. Check your email.",
      });
    }
    setIsSubmitting(false);
  };

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <h1 className="text-3xl font-semibold text-[#0F172A]">Forgot Password?</h1>
        <p className="text-base text-[#6B7280]">
          Enter the email you used to create your account, we&apos;ll send you a
          link to reset your password.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <AuthInput
          label="Email"
          type="email"
          placeholder="example@email.com"
          autoComplete="email"
          {...register("email", {
            required: "Email is required",
          })}
          error={errors.email?.message}
        />

        <AuthMessage message={status?.message} tone={status?.tone} />

        <AuthButton isLoading={isSubmitting}>Send Reset Link</AuthButton>
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

export { ForgotPasswordForm };
