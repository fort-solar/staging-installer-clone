import React from "react";
import { Suspense } from "react";
import { AuthLayout } from "@/components/features/pages/auth/AuthLayout";
import { VerifyEmailForm } from "@/components/features/pages/auth/VerifyEmailForm";

const Page = () => {
  return (
    <AuthLayout>
      <Suspense>
         <VerifyEmailForm />
      </Suspense>
     
    </AuthLayout>
  );
};

export default Page;
