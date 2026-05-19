import React from "react";
import { AuthLayout } from "@/components/features/pages/auth/AuthLayout";
import { Suspense } from "react";
import { SignupForm } from "@/components/features/pages/auth/SignupForm";

const Page = () => {
  return (
    <AuthLayout>
      <Suspense>
         <SignupForm />
      </Suspense>
    </AuthLayout>
  );
};

export default Page;
