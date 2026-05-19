"use client";

import React, { useState } from "react";
import { LogoFull } from "@/components/features/icons/Logo";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SearchIcon } from "../icons/SearchIcon";
import Link from "next/link";
import { useGeneralStore } from "@/store/GeneralStore";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronUp, HelpCircle, LogOut, Settings, List, InspectionPanel  } from "lucide-react";
import { OrdersIcon } from "../icons/OrdersIcon";
import { useAuth } from "@/components/auth/auth-provider";
import { logoutUser } from "@/lib/localAuth";

const DashboardHeader = ({
  query,
  onQueryChange,
}: {
  query: string;
  onQueryChange: (value: string) => void;
}) => {
  const router = useRouter();
  const { session } = useAuth();
  const isInstallerLoggedIn = Boolean(session);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const toggleCategorySidebar = useGeneralStore((state) => state.toggleCategorySidebar);

  const userInitial = session?.user.fullName?.charAt(0)?.toUpperCase() ?? "A";
  const userFullName = session?.user.fullName ?? "Installer User";
  const userFirstName = session?.user.fullName?.split(" ")[0] ?? "Installer";
  const userEmail = session?.user.email ?? "installer@email.com";

  const signOut = async () => {
    await logoutUser();
    router.push("/login");
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
            className="block lg:hidden bg-[#058A05] hover:bg-[#047804] text-white rounded-md h-9 px-4 text-xs gap-2"
          >
            <span className="grid gap-1">
              <span className="h-0.5 w-4 bg-white rounded-full" />
              <span className="h-0.5 w-4 bg-white rounded-full" />
              <span className="h-0.5 w-4 bg-white rounded-full" />
            </span>
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

        <div className="flex-1 flex gap-10 lg:gap-2 items-center justify-end lg:justify-start">
          <Button
            onClick={toggleCategorySidebar}
            className="bg-[#058A05] hidden lg:flex hover:bg-[#047804] text-white rounded-md h-9 px-4 text-xs gap-2"
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

          <div className="flex lg:hidden items-center gap-6 justify-end text-sm text-[#3B3B3B]">
            <Link
              href="/installer/settings/projects#section"
              className="relative flex h-9 w-9 items-center justify-center rounded-md"
            >
              <OrdersIcon className="text-[#3B3B3B]/60" />
              <span className="sr-only">Projects</span>
            </Link>
            <Link
              href="/installer/settings"
              className="relative flex h-9 w-9 items-center justify-center rounded-md"
            >
              <Settings className="h-4 w-4 text-[#3B3B3B]/60" />
              <span className="sr-only">Settings</span>
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
                  className="rounded-lg cursor-pointer border-[#E4E9EC] px-3 py-2 lg:px-5 text-xs text-[#3B3B3B]"
                >
                  Sign In
                </Button>
              </Link>
            )}
          </div>
        </div>

        <div className="hidden lg:flex items-center gap-4 justify-end text-sm text-[#3B3B3B]">
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
                onClick={signOut}
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
