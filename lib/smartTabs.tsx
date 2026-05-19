"use client";

import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";


export type TabKeyInstaller =
  | "profile"
  | "projects"
  | "bills_and_payments"



export type TabInstaller = Readonly<{
  key: TabKeyInstaller;
  label: string;
  link: string;
  mobileLink?: string;
}>;

function useResizeObserver<T extends HTMLElement>(
  ref: React.RefObject<T | null>,
  onResize: () => void
) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const ro = new ResizeObserver(() => onResize());
    ro.observe(el);

    return () => ro.disconnect();
  }, [ref, onResize]);
}

function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(min-width: 1024px)").matches;
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

    const media = window.matchMedia("(min-width: 1024px)");
    const handleChange = (event: MediaQueryListEvent) => setIsDesktop(event.matches);

    media.addEventListener("change", handleChange);
    return () => media.removeEventListener("change", handleChange);
  }, []);

  return isDesktop;
}


export function SmartTabsInstaller({
  tabs,
  activeTab,
  onChange,
}: {
  tabs: readonly TabInstaller[];         
  activeTab: TabKeyInstaller;
  onChange: (key: TabKeyInstaller) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const moreBtnRef = useRef<HTMLButtonElement>(null);
  const isDesktop = useIsDesktop();

  const measureRowRef = useRef<HTMLDivElement>(null);
  const tabMeasureRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  const [visibleKeys, setVisibleKeys] = useState<TabKeyInstaller[]>(tabs.map((t) => t.key));
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  const visibleTabs = useMemo(
    () => tabs.filter((t) => visibleKeys.includes(t.key)),
    [tabs, visibleKeys]
  );
  const overflowTabs = useMemo(
    () => tabs.filter((t) => !visibleKeys.includes(t.key)),
    [tabs, visibleKeys]
  );

  const recalc = () => {
    const container = containerRef.current;
    const moreBtn = moreBtnRef.current;
    if (!container || !moreBtn) return;

    const containerWidth = container.clientWidth;

    const widths = tabs.map((t) => tabMeasureRefs.current[t.key]?.offsetWidth ?? 0);
    const gap = 8;

    const totalTabsWidth = widths.reduce((a, b) => a + b, 0) + (tabs.length - 1) * gap;
    if (totalTabsWidth <= containerWidth) {
      setVisibleKeys(tabs.map((t) => t.key));
      setIsMoreOpen(false);
      return;
    }

    const available = containerWidth - moreBtn.offsetWidth - gap;
    let used = 0;
    const nextVisible: TabKeyInstaller[] = [];

    for (let i = 0; i < tabs.length; i++) {
      const w = widths[i];
      const addGap = nextVisible.length > 0 ? gap : 0;

      if (used + addGap + w <= available) {
        used += addGap + w;
        nextVisible.push(tabs[i].key);
      } else {
        break;
      }
    }

    if (nextVisible.length === 0) nextVisible.push(tabs[0].key);
    setVisibleKeys(nextVisible);
  };

  useLayoutEffect(() => {
    recalc();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tabs.length]);

  useResizeObserver(containerRef, recalc);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!isMoreOpen) return;
      const container = containerRef.current;
      if (!container) return;
      if (!container.contains(e.target as Node)) setIsMoreOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [isMoreOpen]);

  return (
    <div className="w-full">
      <div
        ref={containerRef}
        className="relative flex flex-wrap  items-center lg:gap-10 rounded-sm border border-[#F0F0F0] bg-[#FAFAFA] p-1 overflow-hidden"
      >
        {visibleTabs.map((tab) => (
          <Button
        asChild
            key={tab.key}
            onClick={() => onChange(tab.key)}
            className={`whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium transition  ${
              activeTab === tab.key
                ? "bg-white text-[#202020] shadow-sm hover:bg-white hover:opacity-90"
                : "text-[#7C7C7C] hover:text-[#202020] bg-transparent hover:bg-white"
            }`}
          >
            <Link href={isDesktop ? tab.link : tab.mobileLink ?? tab.link}>
            {tab.label}
            </Link>
            
          </Button>
        ))}

        {overflowTabs.length > 0 && (
          <div className="relative ml-auto">
            <button
              ref={moreBtnRef}
              onClick={() => setIsMoreOpen((v) => !v)}
              className={`whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium transition ${
                overflowTabs.some((t) => t.key === activeTab)
                  ? "bg-white text-[#202020] shadow-sm"
                  : "text-[#7C7C7C] hover:text-[#202020]"
              }`}
            >
              More <span className="ml-1 text-xs">▾</span>
            </button>

            {isMoreOpen && (
              <div className="absolute right-0 mt-2 w-56 overflow-hidden rounded-md border border-[#EAEAEA] bg-white shadow-lg z-50">
                {overflowTabs.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => {
                      onChange(tab.key);
                      setIsMoreOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-[#F6F6F6] ${
                      activeTab === tab.key ? "font-semibold text-[#202020]" : "text-[#3B3B3B]"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* hidden “More” measurer (NOT same ref) */}
        <button
          className="pointer-events-none absolute opacity-0 -z-10 whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium"
        >
          More ▾
        </button>
      </div>

      {/* hidden measurement row */}
      <div ref={measureRowRef} className="absolute left-0 top-0 -z-10 opacity-0 pointer-events-none">
        <div className="flex items-center gap-2 p-2">
          {tabs.map((tab) => (
            <button
              key={`m-${tab.key}`}
              ref={(el) => {
                tabMeasureRefs.current[tab.key] = el;
              }}
              className="whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium"
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
