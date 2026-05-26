"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { GoogleLogin } from "@react-oauth/google";
import { AuthInput } from "@/components/features/pages/auth/AuthInput";
import { AuthButton } from "@/components/features/pages/auth/AuthButton";
import { AuthMessage } from "@/components/features/pages/auth/AuthMessage";
import { useAuth } from "@/components/auth/auth-provider";
import { authenticateWithGoogle, loginMockUser } from "@/lib/localAuth";
import { useRouter } from "next/navigation";

type LoginFormValues = {
  email: string;
  password: string;
  remember: boolean;
};

const LoginForm = () => {
  const [status, setStatus] = useState<{ tone: "success" | "error"; message: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const { refreshSession } = useAuth();
  const isGoogleAuthEnabled = Boolean(process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    defaultValues: {
      email: "",
      password: "",
      remember: true,
    },
  });

  const onSubmit = async (values: LoginFormValues) => {
    setIsSubmitting(true);
    setStatus(null);
    const { error } = await loginMockUser({
      email: values.email,
      password: values.password,
    });

    if (error) {
      setStatus({ tone: "error", message: error });
    } else {
      setStatus({ tone: "success", message: "Login successful. Redirecting..." });
      router.push("/installer/dashboard");
    }
    setIsSubmitting(false);
  };

  const handleGoogleAuth = async (idToken: string) => {
    setIsSubmitting(true);
    setStatus(null);
    const { error } = await authenticateWithGoogle({ idToken });

    if (error) {
      setStatus({ tone: "error", message: error });
    } else {
      await refreshSession().catch(() => null);
      setStatus({ tone: "success", message: "Login successful. Redirecting..." });
      router.push("/installer/dashboard");
      router.refresh();
    }

    setIsSubmitting(false);
  };

  return (
    <div className="space-y-8 ">
      <div className="space-y-3">
        <h1 className="text-3xl font-semibold text-[#0F172A]">Welcome back!</h1>
        <p className="text-base text-[#6B7280]">
          Sign in to manage installer jobs, onboarding progress, project updates,
          and payout information.
        </p>
      </div>

      {isGoogleAuthEnabled ? (
        <div className="space-y-5">
          <div className="rounded-2xl border border-[#E5E7EB] bg-[#FAFAFA] px-4 py-3">
            <GoogleLogin
              onSuccess={(response) => {
                if (!response.credential) {
                  setStatus({ tone: "error", message: "Google sign-in did not return an ID token." });
                  return;
                }

                void handleGoogleAuth(response.credential);
              }}
              onError={() => setStatus({ tone: "error", message: "Google sign-in failed." })}
              text="continue_with"
              shape="rectangular"
              theme="outline"
              size="large"
              width="320"
            />
          </div>

          <div className="flex items-center gap-4 text-xs uppercase tracking-[0.32em] text-[#94A3B8]">
            <span className="h-px flex-1 bg-[#E2E8F0]" />
            Or
            <span className="h-px flex-1 bg-[#E2E8F0]" />
          </div>
        </div>
      ) : null}

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

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-[#111827]" htmlFor="password">
              Password
            </label>
            <Link
              href="/forgot-password"
              className="text-sm font-medium text-[#16A34A] hover:underline"
            >
              Forgot Password
            </Link>
          </div>
          <AuthInput
            id="password"
            type="password"
            placeholder="••••••••••••••"
            autoComplete="current-password"
            {...register("password", {
              required: "Password is required",
            })}
            error={errors.password?.message}
          />
        </div>

        <label className="flex items-center gap-3 text-sm text-[#475569]">
          <input
            type="checkbox"
            className="h-5 w-5 rounded-md border-[#E2E8F0] text-[#16A34A] focus:ring-[#16A34A]/30"
            {...register("remember")}
          />
          Remember Me
        </label>

        <AuthMessage message={status?.message} tone={status?.tone} />

        <AuthButton isLoading={isSubmitting}>Login to Your Account</AuthButton>
      </form>

      <div className="space-y-2 text-center text-sm text-[#64748B]">
        <p>
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="font-semibold text-[#16A34A] hover:underline">
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  );
};

export { LoginForm };
