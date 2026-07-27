"use client";

import React, { useState } from "react";
import { LogoFull } from "@/components/features/icons/Logo";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SearchIcon } from "../icons/SearchIcon";
import Link from "next/link";
import { useGeneralStore } from "@/store/GeneralStore";
import { usePathname, useRouter } from "next/navigation";
import { BriefcaseBusiness, ChevronDown, ChevronUp, CircleUserRound, CreditCard, HelpCircle, LogOut, Settings, List, InspectionPanel  } from "lucide-react";
import { OrdersIcon } from "../icons/OrdersIcon";
import { useAuth } from "@/components/auth/auth-provider";
import { ThemeToggle } from "@/components/ui/theme-toggle";

const DashboardHeader = ({
  query,
  onQueryChange,
}: {
  query: string;
  onQueryChange: (value: string) => void;
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const { session, signOut } = useAuth();
  const isInstallerLoggedIn = Boolean(session);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const toggleCategorySidebar = useGeneralStore((state) => state.toggleCategorySidebar);

  const userInitial = session?.user.fullName?.charAt(0)?.toUpperCase() ?? "A";
  const userFullName = session?.user.fullName ?? "Installer User";
  const userFirstName = session?.user.fullName?.split(" ")[0] ?? "Installer";
  const userEmail = session?.user.email ?? "installer@email.com";

  const handleSignOut = () => {
    void signOut();
    router.replace("/login");
  };

  return (
    <div className="fixed left-0 top-0 z-50 w-full border-b border-[#E9EEF0] bg-white">
      <div className="mx-auto w-full max-w-6xl px-4 py-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center justify-between lg:justify-start lg:mr-16 bg-white">
          <Link href="/installer/dashboard" className="bg-white">
            <LogoFull className="h-7 w-auto bg-white" />
          </Link>
          <Button
            onClick={toggleCategorySidebar}
            className="flex lg:hidden bg-[#048A05] hover:bg-[#047804] text-white rounded-md h-9 px-4 text-xs"
          >
            Filters
          </Button>
        </div>
          <div className="lg:hidden block relative max-w-lg lg:max-w-xl w-full mr-10">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9AA5AC]">
              <SearchIcon />
            </span>
            <Input
              placeholder="Search"
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
              className="pl-10 h-11 text-xs rounded-lg border-[#C9D4D9] focus-visible:ring-[#BFE8BF]"
            />
          </div>

        <div className="hidden flex-1 gap-2 items-center lg:flex lg:justify-start">
          <Button
            onClick={toggleCategorySidebar}
            className="bg-[#048A05] hidden lg:flex hover:bg-[#047804] text-white rounded-md h-9 px-4 text-xs gap-2"
          >
            <span className="grid gap-1">
              <span className="h-0.5 w-4 bg-white rounded-full" />
              <span className="h-0.5 w-4 bg-white rounded-full" />
              <span className="h-0.5 w-4 bg-white rounded-full" />
            </span>
            <span>Categories</span>
          </Button>

          <div className="hidden lg:block relative max-w-lg lg:max-w-xl w-full mr-10">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9AA5AC]">
              <SearchIcon />
            </span>
            <Input
              placeholder="Search"
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
              className="pl-10 h-11 text-xs rounded-lg border-[#C9D4D9] focus-visible:ring-[#BFE8BF]"
            />
          </div>

        </div>

        <div className="hidden lg:flex items-center gap-4 justify-end text-sm text-[#3B3B3B]">
          <ThemeToggle />
          <Link href="/installer/settings/projects" className="flex items-center gap-2 text-xs text-[#3B3B3B]">
            <OrdersIcon className="text-[#3B3B3B]/60" />
            <span className="hidden lg:block">
              Projects
            </span>
          </Link>
          <Link href="/installer/settings/bills-and-payments" className="flex items-center gap-2 text-xs text-[#3B3B3B]">
            <List className="h-4 w-4 text-[#3B3B3B]/60" />
            <span className="hidden lg:block">
              Payments
            </span>
          </Link>
          <Link href="/installer/settings/profile" className="flex items-center gap-2 text-xs text-[#3B3B3B]">
            <InspectionPanel className="h-4 w-4 text-[#3B3B3B]/60" />
            <span className="hidden lg:block">
              Profile
            </span>
          </Link>

          {isInstallerLoggedIn ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsProfileMenuOpen((prev) => !prev)}
                className="border p-1 rounded-md flex items-center gap-2"
              >
                <div className="bg-[#EBFAEB] px-3 py-1 rounded-md">
                  <p className="text-sm font-medium">{userInitial}</p>
                </div>
                <div className="text-left">
                  <p className="text-xs font-semibold line-clamp-1">{userFirstName}</p>
                  <p className="text-[10px]">Installer</p>
                </div>
                 {isInstallerLoggedIn && isProfileMenuOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}  
              </button>
            </div>
          ) : (
            <Link href="/login">
              <Button
                variant="outline"
                className="rounded-lg cursor-pointer border-[#E4E9EC] px-5 text-xs text-[#3B3B3B]"
              >
                Sign In
              </Button>
            </Link>
          )}
        </div>
      </div>

      <nav
        aria-label="Installer navigation"
        className="fixed inset-x-0 bottom-0 z-50 border-t border-[#E2E8EC] bg-white/95 px-3 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 shadow-[0_-8px_30px_rgba(15,23,42,0.08)] backdrop-blur lg:hidden"
      >
        <div className="mx-auto grid max-w-lg grid-cols-4">
          {[
            { href: "/installer/dashboard", label: "Jobs", icon: BriefcaseBusiness, active: pathname.startsWith("/installer/dashboard") || pathname.startsWith("/installer/jobs") },
            { href: "/installer/settings/projects#section", label: "Projects", icon: OrdersIcon, active: pathname.startsWith("/installer/settings/projects") },
            { href: "/installer/settings/bills-and-payments#section", label: "Payments", icon: CreditCard, active: pathname.startsWith("/installer/settings/bills-and-payments") },
            { href: isInstallerLoggedIn ? "/installer/settings/profile#section" : "/login", label: isInstallerLoggedIn ? "Profile" : "Sign in", icon: CircleUserRound, active: pathname.startsWith("/installer/settings/profile") || pathname === "/login" },
          ].map(({ href, label, icon: Icon, active }) => (
            <Link
              key={label}
              href={href}
              aria-current={active ? "page" : undefined}
              className={`flex min-w-0 flex-col items-center gap-1 rounded-xl px-1 py-1.5 text-[10px] font-medium transition-colors ${
                active ? "bg-[#EBFAEB] text-[#048A05]" : "text-[#66727A] hover:bg-[#F4F7F8] hover:text-[#30343A]"
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="w-full truncate text-center">{label}</span>
            </Link>
          ))}
        </div>
      </nav>

      {isInstallerLoggedIn && isProfileMenuOpen && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-20 bg-transparent"
            onClick={() => setIsProfileMenuOpen(false)}
            aria-label="Close profile menu"
          />
          <div className="absolute right-4 top-18 z-30 w-80 max-w-[90vw] rounded-[24px] border border-[#C9D5DF] bg-white p-4 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg border-2 border-[#17A11E] bg-[#EAF8EA] text-2xl text-[#3B3B3B]">
                  {userInitial}
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#1F2937]">{userFullName}</p>
                  <p className="text-xs text-[#4B5563]">{userEmail}</p>
                </div>
              </div>
              <ChevronUp className="h-5 w-5 text-[#4B5563]" onClick={() => setIsProfileMenuOpen(false)}/>
            </div>

            <div className="mt-4 border-t border-[#D8E0E8] pt-3">
              <Link
                href="/installer/settings/projects#section"
                className="flex lg:hidden w-full items-center gap-3 rounded-lg px-2 py-2 text-left text-[#30343A] hover:bg-[#F8FAFC]"
              >
                <OrdersIcon className="h-5 w-5" />
                Projects
              </Link>
              <Link
                href="/installer/settings/projects"
                className="hidden lg:flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left text-[#30343A] hover:bg-[#F8FAFC]"
              >
                <OrdersIcon className="h-5 w-5" />
                Projects
              </Link>
              <Link
                href="/installer/settings/bills-and-payments#section"
                className="flex lg:hidden w-full items-center gap-3 rounded-lg px-2 py-2 text-left text-[#30343A] hover:bg-[#F8FAFC]"
              >
                <List className="h-5 w-5" />
                Payments
              </Link>
              <Link
                href="/installer/settings/bills-and-payments"
                className="hidden lg:flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left text-[#30343A] hover:bg-[#F8FAFC]"
              >
                <List className="h-5 w-5" />
                Payments
              </Link>
              <Link
                href="/installer/settings/profile#section"
                className="flex lg:hidden w-full items-center gap-3 rounded-lg px-2 py-2 text-left text-[#30343A] hover:bg-[#F8FAFC]"
              >
                <InspectionPanel className="h-5 w-5" />
                Profile
              </Link>
              <Link
                href="/installer/settings/profile"
                className="hidden lg:flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left text-[#30343A] hover:bg-[#F8FAFC]"
              >
                <InspectionPanel className="h-5 w-5" />
                Profile
              </Link>
              <Link
                href="/installer/settings"
                className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left text-[#30343A] hover:bg-[#F8FAFC]"
              >
                <Settings className="h-5 w-5" />
                Settings
              </Link>
              <button className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left text-[#30343A] hover:bg-[#F8FAFC]">
                <HelpCircle className="h-5 w-5" />
                Help &amp; Support
              </button>
            </div>

            <div className="mt-4 border-t border-[#D8E0E8] pt-3">
              <button
                type="button"
                onClick={handleSignOut}
                className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left text-[#F35B5B] hover:bg-[#FFF5F5]"
              >
                <LogOut className="h-5 w-5" />
                Sign Out
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default DashboardHeader;
