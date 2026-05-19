import React from "react";
import { AuthLayout } from "@/components/features/pages/auth/AuthLayout";
import { ForgotPasswordForm } from "@/components/features/pages/auth/ForgotPasswordForm";

const Page = () => {
  return (
    <AuthLayout>
      <ForgotPasswordForm />
    </AuthLayout>
  );
};

export default Page;
