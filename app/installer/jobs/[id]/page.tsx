"use client";

import React from "react";
import { useParams } from "next/navigation";
import { InstallerJobDetail } from "@/components/features/pages/installer/InstallerJobDetail";

const InstallerJobDetailPage = () => {
  const params = useParams<{ id: string }>();
  const jobId = params?.id ?? "";
  return <InstallerJobDetail jobId={jobId} />;
};

export default InstallerJobDetailPage;
