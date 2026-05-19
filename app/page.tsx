"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/auth-provider";

function Home() {
  const router = useRouter();
  const { isRefreshing, session } = useAuth();

  useEffect(() => {
    if (isRefreshing) {
      return;
    }

    if (!session) {
      router.replace("/login");
      return;
    }
    router.replace("/installer/dashboard");
  }, [isRefreshing, router, session]);

  return null;
}

export default Home;
