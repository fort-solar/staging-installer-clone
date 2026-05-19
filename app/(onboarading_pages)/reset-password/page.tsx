import React from "react";
import { AuthLayout } from "@/components/features/pages/auth/AuthLayout";
import { Suspense } from "react";
import { ResetPasswordForm } from "@/components/features/pages/auth/ResetPasswordForm";

const Page = () => {
  return (
    <AuthLayout>
      <Suspense>
        <ResetPasswordForm />
      </Suspense>
    </AuthLayout>
  );
};

export default Page;
