"use client";

import React, { useEffect, useMemo, useState } from "react";
import { LogoTransparent } from "../../icons/LogoTransparent";
import { LogoIcon } from "@/components/features/icons/LogoIcon";

const DEFAULT_SOLAR_FACTS = [
  "Did you know? Nigeria gets enough sunlight each year to power the whole country.",
  "Solar panels can still produce electricity even on cloudy days.",
  "A solar system can cut household electricity costs for many years.",
  "The sun delivers more energy to Earth in one hour than the world uses in a year.",
  "Solar energy is one of the cleanest ways to reduce generator dependence.",
];

type AuthLayoutProps = {
  children: React.ReactNode;
  asideTitle?: string;
  asideBody?: string;
  asideFacts?: string[];
};

const TypewriterText = ({ texts }: { texts: string[] }) => {
  const [factIndex, setFactIndex] = useState(0);
  const [text, setText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const activeTexts = useMemo(
    () => (texts.length > 0 ? texts : DEFAULT_SOLAR_FACTS),
    [texts]
  );

  useEffect(() => {
    const currentFact = activeTexts[factIndex % activeTexts.length];
    const typingSpeed = isDeleting ? 30 : 55;
    const holdDelay = !isDeleting && text === currentFact ? 2000 : 0;

    const timeout = window.setTimeout(() => {
      if (!isDeleting) {
        if (text === currentFact) {
          setIsDeleting(true);
          return;
        }
        setText(currentFact.slice(0, text.length + 1));
        return;
      }

      if (text.length === 0) {
        setIsDeleting(false);
        setFactIndex((prev) => (prev + 1) % activeTexts.length);
        return;
      }

      setText(currentFact.slice(0, text.length - 1));
    }, typingSpeed + holdDelay);

    return () => window.clearTimeout(timeout);
  }, [activeTexts, factIndex, isDeleting, text]);

  return (
    <span>
      {text}
      <span className="ml-1 inline-block h-[1.1em] w-0.5 animate-pulse bg-white/90 align-middle" />
    </span>
  );
};

const AuthLayout = ({
  children,
  asideTitle = "SOLAR FACT",
  asideBody = DEFAULT_SOLAR_FACTS[0],
  asideFacts,
}: AuthLayoutProps) => {
  const facts = asideFacts?.length
    ? asideFacts
    : asideBody !== DEFAULT_SOLAR_FACTS[0]
      ? [asideBody]
      : DEFAULT_SOLAR_FACTS;

  return (
    <div className="relative min-h-screen bg-white">
      <div className="min-h-screen lg:grid lg:grid-cols-[1.3fr_1fr]">
        <main className="lg:flex max-h-screen items-start justify-center overflow-y-auto px-0 lg:py-12 lg:px-16">
          <div className="block lg:hidden relative h-full overflow-hidden w-full">
            <div className="absolute inset-0 fortsolar-auth-gradient" />
            <div className="relative flex h-full w-full flex-col justify-between items-center text-center px-6 py-10 text-white">
              <LogoTransparent className="h-10" />
              <div className="max-w-105">
                <p className="text-xs font-semibold tracking-[0.32em] text-white/70 mt-10">
                  {asideTitle}
                </p>
                <p className="mt-4 text-xl font-semibold leading-snug min-h-20">
                  <TypewriterText texts={facts} />
                </p>
              </div>
            </div>
          </div>
          <div className="w-full max-w-115 space-y-8 py-14 px-6">
            <div className="h-15 w-15 hidden lg:block">
              <LogoIcon />
            </div>
            {children}
          </div>
        </main>
        <aside className="relative hidden lg:block">
          <div className="fixed right-0 top-0 hidden h-screen w-[45%] overflow-hidden lg:block lg:w-[45%]">
            <div className="absolute inset-0 fortsolar-auth-gradient" />
            <div className="relative flex h-full w-full flex-col justify-between px-20 py-20 text-white">
              <LogoTransparent className="h-10" />
              <div className="max-w-105">
                <p className="text-xs font-semibold tracking-[0.32em] text-white/70">
                  {asideTitle}
                </p>
                <p className="mt-4 text-2xl font-semibold leading-snug min-h-28">
                  <TypewriterText texts={facts} />
                </p>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export { AuthLayout };
