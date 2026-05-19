"use client";

import { useEffect } from "react";
import { useGeneralStore } from "@/store/GeneralStore";

export function SidebarInitializer() {
  const setCategorySidebarOpen = useGeneralStore(
    (s) => s.setCategorySidebarOpen
  );

  useEffect(() => {
    const isDesktop = window.matchMedia("(min-width: 1024px)").matches;

    setCategorySidebarOpen(isDesktop); 
  }, [setCategorySidebarOpen]);

  return null;
}
