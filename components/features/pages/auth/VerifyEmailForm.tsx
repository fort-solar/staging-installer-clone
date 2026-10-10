"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Mail, CheckCircle2, ShieldCheck, RefreshCw, Loader2 } from "lucide-react";
import { AuthButton } from "@/components/features/pages/auth/AuthButton";
import { AuthMessage } from "@/components/features/pages/auth/AuthMessage";
import { verifyEmailToken, requestEmailVerification } from "@/lib/localAuth";
import { useAuth } from "@/components/auth/auth-provider";

const VerifyEmailForm = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = useMemo(() => searchParams.get("token") ?? "", [searchParams]);
  const email = useMemo(() => searchParams.get("email") ?? "", [searchParams]);
  const requested = useMemo(() => searchParams.get("requested") === "1", [searchParams]);

  const { refreshSession } = useAuth();

  const [status, setStatus] = useState<{ tone: "success" | "error"; message: string } | null>(
    requested && !token
      ? {
          tone: "success",
          message: email
            ? `Verification email sent to ${email}. Open the link in your inbox to complete setup.`
            : "Verification email sent. Open the link in your inbox to complete setup.",
        }
      : null,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);

  const isTokenMissing = token.length === 0;

  const onSubmit = async () => {
    if (isTokenMissing) {
      setStatus({
        tone: "error",
        message: "Verification token missing. Open the verification link from your email.",
      });
      return;
    }

    setIsSubmitting(true);
    setStatus(null);

    try {
      const response = await verifyEmailToken(token);
      
      // Immediately refresh the local session state
      try {
        await refreshSession();
      } catch (err) {
        console.error("Failed to refresh session", err);
      }

      setStatus({
        tone: "success",
        message: response.message || "Email verified successfully. Redirecting...",
      });
      window.setTimeout(() => {
        router.push("/installer/dashboard");
      }, 600);
    } catch (error) {
      setStatus({
        tone: "error",
        message: error instanceof Error ? error.message : "Unable to verify email.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    setIsResending(true);
    setStatus(null);
    try {
      await requestEmailVerification();
      setStatus({
        tone: "success",
        message: "Verification link sent! Please check your email inbox.",
      });
    } catch (error) {
      setStatus({
        tone: "error",
        message: error instanceof Error ? error.message : "Failed to resend verification email.",
      });
    } finally {
      setIsResending(false);
    }
  };

  const checkVerificationStatus = async () => {
    setIsCheckingStatus(true);
    setStatus(null);
    try {
      const nextSession = await refreshSession();
      if (nextSession?.user.emailVerified) {
        setStatus({
          tone: "success",
          message: "Email is verified! Redirecting to dashboard...",
        });
        window.setTimeout(() => {
          router.push("/installer/dashboard");
        }, 600);
      } else {
        setStatus({
          tone: "error",
          message: "Email is still unverified. Please check your email inbox and click the verification link.",
        });
      }
    } catch (error) {
      setStatus({
        tone: "error",
        message: "Failed to check status. Make sure you are signed in.",
      });
    } finally {
      setIsCheckingStatus(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-3">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-brand-soft text-brand ring-4 ring-brand-soft/50 mb-2">
          <Mail className="h-8 w-8 animate-bounce" />
        </div>
        <h1 className="text-3xl font-semibold text-[#0F172A]">Verify Your Email</h1>
        <p className="text-base text-[#6B7280]">
          {isTokenMissing
            ? `We sent a link to ${email || "your email address"}. Confirm it to activate your installer account.`
            : `Click below to confirm ${email || "your email address"} and activate your account.`}
        </p>
      </div>

      <AuthMessage message={status?.message} tone={status?.tone} />

      {/* Checklist section */}
      <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-6 space-y-4">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Why do I need to verify my email?
        </h3>
        <ul className="space-y-3 text-sm text-slate-600">
          <li className="flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-brand shrink-0 mt-0.5" />
            <span>Complete installer registration & onboarding</span>
          </li>
          <li className="flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-brand shrink-0 mt-0.5" />
            <span>Access the active jobs board and submit bids</span>
          </li>
          <li className="flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-brand shrink-0 mt-0.5" />
            <span>Manage assignments, upload photos & request payouts</span>
          </li>
        </ul>
      </div>

      <div className="space-y-3">
        {!isTokenMissing ? (
          <AuthButton isLoading={isSubmitting} onClick={onSubmit}>
            Confirm Email
          </AuthButton>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={checkVerificationStatus}
              disabled={isCheckingStatus || isResending}
              className="flex items-center justify-center gap-2 rounded-xl border border-brand bg-brand-soft text-sm font-semibold text-brand-dark transition hover:bg-brand-muted py-3 disabled:opacity-50"
            >
              {isCheckingStatus ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Check Status
            </button>
            <button
              onClick={handleResend}
              disabled={isResending || isCheckingStatus}
              className="flex items-center justify-center gap-2 rounded-xl bg-brand text-sm font-semibold text-white transition hover:bg-brand-dark py-3 disabled:opacity-50"
            >
              {isResending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ShieldCheck className="h-4 w-4" />
              )}
              Resend Link
            </button>
          </div>
        )}
      </div>

      <p className="text-center text-sm text-[#64748B]">
        Already verified or want to sign in again?{" "}
        <Link href="/login" className="font-semibold text-[#16A34A] hover:underline">
          Login
        </Link>
      </p>
    </div>
  );
};

export { VerifyEmailForm };
