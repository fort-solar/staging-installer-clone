"use client";

import React, {  useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
// import { GoogleLogin } from "@react-oauth/google";
import { AuthInput } from "@/components/features/pages/auth/AuthInput";
import { PasswordInput } from "@/components/features/pages/auth/PasswordInput";
import { AuthButton } from "@/components/features/pages/auth/AuthButton";
import { AuthMessage } from "@/components/features/pages/auth/AuthMessage";
import { GoogleIcon } from "../../icons/GoogleIcon";
import {
  registerMockUser,
  requestEmailVerification,
  updateCurrentUserProfile,
} from "@/lib/localAuth";

type SignupFormValues = {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  password: string;
  confirmPassword: string;
  acceptTerms: boolean;
};

const SignupForm = () => {
  const [status, setStatus] = useState<{ tone: "success" | "error"; message: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<SignupFormValues>({
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      address: "",
      password: "",
      confirmPassword: "",
      acceptTerms: false,
    },
  });

  // eslint-disable-next-line react-hooks/incompatible-library
  const passwordValue = watch("password");

  const onSubmit = async (values: SignupFormValues) => {
    if (values.password !== values.confirmPassword) {
      setStatus({ tone: "error", message: "Passwords do not match." });
      return;
    }

    if (!values.acceptTerms) {
      setStatus({ tone: "error", message: "You must accept the terms & conditions." });
      return;
    }

    setIsSubmitting(true);
    setStatus(null);
    const { error, session } = await registerMockUser({
      fullName: values.fullName,
      email: values.email,
      phone: values.phone,
      address: values.address,
      password: values.password,
      role: "installer" 
    });

    if (error) {
      setStatus({ tone: "error", message: error });
      setIsSubmitting(false);
      return;
    }

    if (!session) {
      setStatus({ tone: "error", message: "Unable to create account. Please try again." });
      setIsSubmitting(false);
      return;
    }

    await updateCurrentUserProfile({
      name: values.fullName,
      phone: values.phone,
      address: values.address,
    }).catch(() => null);

    await requestEmailVerification().catch(() => null);

    setStatus({ tone: "success", message: "Account created. Check your email to verify your address." });
    router.push(`/verify-email?email=${encodeURIComponent(values.email)}&requested=1`);
    setIsSubmitting(false);
  };

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <h1 className="text-3xl font-semibold text-[#0F172A]">
          Join the Fortsolar Installer Network.
        </h1>
        <p className="text-base text-[#6B7280]">
          Create your installer account to access onboarding, active jobs,
          project delivery tools, and payout tracking.
        </p>
      </div>

      <div className="space-y-5">
        <div className="flex items-center justify-center gap-4 rounded-2xl border border-transparent px-4 h-14 text-[#737373] cursor-pointer bg-[#FAFAFA] hover:bg-[#fafafac8]">
          {/* <GoogleLogin
                    onSuccess={() => setStatus({ tone: "success", message: "Google sign-in success." })}
                    onError={() => setStatus({ tone: "error", message: "Google sign-in failed." })}
                    size="large"
                    width="100%"
                    text="continue_with"
                    shape="rectangular"
                  /> */}
          <GoogleIcon />
          Continue With Google
        </div>

        <div className="flex items-center gap-4 text-xs uppercase tracking-[0.32em] text-[#94A3B8]">
          <span className="h-px flex-1 bg-[#E2E8F0]" />
          Or
          <span className="h-px flex-1 bg-[#E2E8F0]" />
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <AuthInput
          label="Full Name"
          placeholder="eg. John Doe"
          {...register("fullName", { required: "Full name is required" })}
          error={errors.fullName?.message}
        />

        <AuthInput
          label="Email"
          type="email"
          placeholder="example@email.com"
          autoComplete="email"
          {...register("email", { required: "Email is required" })}
          error={errors.email?.message}
        />

        <AuthInput
          label="Phone"
          type="tel"
          placeholder="902 2367 890"
          autoComplete="tel"
          {...register("phone", { required: "Phone is required" })}
          error={errors.phone?.message}
        />

        <AuthInput
          label="Address"
          placeholder="suite 5 ..."
          autoComplete="street-address"
          {...register("address", { required: "Address is required" })}
          error={errors.address?.message}
        />

        <PasswordInput
          label="Password"
          placeholder="••••••••••••••"
          autoComplete="new-password"
          {...register("password", {
            required: "Password is required",
            minLength: { value: 8, message: "Use at least 8 characters" },
          })}
          error={errors.password?.message}
        />

        <PasswordInput
          label="Confirm Password"
          placeholder="••••••••••••••"
          autoComplete="new-password"
          {...register("confirmPassword", {
            required: "Please confirm your password",
            validate: (value) => value === passwordValue || "Passwords do not match",
          })}
          error={errors.confirmPassword?.message}
        />

        <label className="flex items-center gap-3 text-sm text-[#475569]">
          <input
            type="checkbox"
            className="h-5 w-5 rounded-md border-[#E2E8F0] text-[#16A34A] focus:ring-[#16A34A]/30"
            {...register("acceptTerms")}
          />
          Accept Terms &amp; Conditions
        </label>

        <AuthMessage message={status?.message} tone={status?.tone} />

        <AuthButton isLoading={isSubmitting}>Create My Account</AuthButton>
      </form>

      <div className="space-y-2 text-center text-sm text-[#64748B]">
        <p>
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-[#16A34A] hover:underline">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
};

export { SignupForm };
