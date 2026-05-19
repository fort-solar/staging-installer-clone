import React from "react";
import { AuthLayout } from "@/components/features/pages/auth/AuthLayout";
import { LoginForm } from "@/components/features/pages/auth/LoginForm";

const Page = () => {
  return (
    <AuthLayout>
      <LoginForm />
    </AuthLayout>
  );
};

export default Page;
