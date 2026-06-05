"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ChevronDown,
  ChevronUp,
  EllipsisVertical,
  HelpCircle,
  Loader2,
  LocateFixed,
  LogOut,
  Receipt,
  Search,
  Settings,
  SlidersHorizontal,
  Wrench,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { LogoFull } from "@/components/features/icons/Logo";
import {
  getInstallerJobState,
  listInstallerJobs,
  saveInstallerJob,
  unsaveInstallerJob,
} from "@/lib/api/installers";
import { useAuth } from "@/components/auth/auth-provider";
import PaginationControls from "@/components/ui/pagination-controls";
import { useGeneralStore } from "@/store/GeneralStore";
import { InstallerNotificationCenter } from "@/components/features/layout/InstallerNotificationCenter";
import type { InstallerJobRecord, PaginationMeta } from "@/types/api.types";

type JobTab = "board" | "applications" | "completed" | "saved";
type Category = "all" | "full_installation" | "maintenance" | "repairs" | "audits" | "battery";
type SystemSize = "all" | "small" | "medium" | "commercial";
type SortOrder = "newest" | "oldest";

const tabs: Array<{ key: JobTab; label: string }> = [
  { key: "board", label: "Job Board" },
  { key: "applications", label: "My Applications" },
  { key: "completed", label: "Completed Jobs" },
  { key: "saved", label: "Saved Jobs" },
];

const categoryItems = [
  { key: "all" as Category, label: "All Jobs" },
  { key: "full_installation" as Category, label: "Full Installations" },
  { key: "maintenance" as Category, label: "Maintenance & Servicing" },
  { key: "repairs" as Category, label: "Repairs & Troubleshooting" },
  { key: "audits" as Category, label: "Energy Audits" },
  { key: "battery" as Category, label: "Battery Replacement" },
];

const systemSizeItems = [
  { key: "all" as SystemSize, label: "All Sizes" },
  { key: "small" as SystemSize, label: "Small Home (0 - 3.5kVA)" },
  { key: "medium" as SystemSize, label: "Medium (5kVA - 10kVA)" },
  { key: "commercial" as SystemSize, label: "Commercial (15kVA+)" },
];

const JOBS_PAGE_SIZE = 20;

type SidebarFiltersProps = {
  isMobile?: boolean;
  category: Category;
  setCategory: React.Dispatch<React.SetStateAction<Category>>;
  systemSize: SystemSize;
  setSystemSize: React.Dispatch<React.SetStateAction<SystemSize>>;
  isCategoryOpen: boolean;
  setIsCategoryOpen: React.Dispatch<React.SetStateAction<boolean>>;
};

const SidebarFilters = ({
  isMobile = false,
  category,
  setCategory,
  systemSize,
  setSystemSize,
  isCategoryOpen,
  setIsCategoryOpen,
}: SidebarFiltersProps) => (
  <aside className="rounded-2xl border border-[#E3E7EB] bg-white p-6">
    <div className="pt-6">
      <button
        type="button"
        onClick={() => setIsCategoryOpen((prev) => !prev)}
        className="flex w-full items-center justify-between text-xl font-semibold text-[#13161A] lg:text-2xl"
      >
        Job Categories
        <span className="text-[#6B7280]">
          {isCategoryOpen ? <ChevronUp /> : <ChevronDown />}
        </span>
      </button>

      {isCategoryOpen ? (
        <div className="mt-4 space-y-3 text-base text-[#20242A]">
          {categoryItems.map((item) => (
            <label key={item.key} className="flex cursor-pointer items-center gap-3">
              <input
                type="radio"
                name={isMobile ? "category-mobile" : "category"}
                checked={category === item.key}
                onChange={() => setCategory(item.key)}
                className="h-5 w-5"
              />
              {item.label}
            </label>
          ))}
        </div>
      ) : null}
    </div>

    <div className="mt-8 border-t border-[#D4D7DB] pt-6">
      <h3 className="text-base text-[#9A9EA6]">System Size</h3>
      <div className="mt-4 space-y-3 text-base text-[#20242A]">
        {systemSizeItems.map((item) => (
          <label key={item.key} className="flex cursor-pointer items-center gap-3">
            <input
              type="radio"
              name={isMobile ? "system-mobile" : "system"}
              checked={systemSize === item.key}
              onChange={() => setSystemSize(item.key)}
              className="h-5 w-5"
            />
            {item.label}
          </label>
        ))}
      </div>
    </div>
  </aside>
);

function useDebouncedValue<T>(value: T, delayMs = 300) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedValue(value);
    }, delayMs);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [delayMs, value]);

  return debouncedValue;
}

const InstallerJobsDashboard = () => {
  const router = useRouter();
  const { session, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<JobTab>("board");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<Category>("all");
  const [systemSize, setSystemSize] = useState<SystemSize>("all");
  const [sortOrder, setSortOrder] = useState<SortOrder>("newest");
  const [isSortMenuOpen, setIsSortMenuOpen] = useState(false);
  const [isJobCategoryOpen, setIsJobCategoryOpen] = useState(false);
  const [isSystemSizeOpen, setIsSystemSizeOpen] = useState(false);
  const [isCategoryOpen, setIsCategoryOpen] = useState(true);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [jobs, setJobs] = useState<InstallerJobRecord[]>([]);
  const [jobState, setJobState] = useState({
    appliedJobIds: [] as string[],
    savedJobIds: [] as string[],
  });
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [page, setPage] = useState(1);
  const [isLoadingJobs, setIsLoadingJobs] = useState(true);
  const [isLoadingJobState, setIsLoadingJobState] = useState(true);
  const [jobsError, setJobsError] = useState<string | null>(null);
  const [jobActionMessage, setJobActionMessage] = useState<string | null>(null);
  const [savingJobId, setSavingJobId] = useState<string | null>(null);
  const isSidebarOpen = useGeneralStore((state) => state.isCategorySidebarOpen);
  const setCategorySidebarOpen = useGeneralStore((state) => state.setCategorySidebarOpen);
  const toggleCategorySidebar = useGeneralStore((state) => state.toggleCategorySidebar);
  const markInstallerSyncComplete = useGeneralStore((state) => state.markInstallerSyncComplete);
  const debouncedQuery = useDebouncedValue(query);

  const userInitial = session?.user.fullName?.charAt(0)?.toUpperCase() ?? "A";
  const userName = session?.user.fullName ?? "Installer User";
  const userEmail = session?.user.email ?? "installer@fortsolar.ng";

  const loadJobs = useCallback(async (nextPage: number) => {
    setIsLoadingJobs(true);

    try {
      const payload = await listInstallerJobs({
        page: nextPage,
        limit: JOBS_PAGE_SIZE,
        search: debouncedQuery.trim() || undefined,
        tab: activeTab,
        sort: sortOrder,
        category,
        systemSize,
      });
      setJobs(payload.data);
      setPagination(payload.pagination ?? null);
      setJobsError(null);
    } catch (error) {
      setJobsError(error instanceof Error ? error.message : "Unable to load jobs right now.");
    } finally {
      setIsLoadingJobs(false);
    }
  }, [activeTab, category, debouncedQuery, sortOrder, systemSize]);

  const loadJobState = useCallback(async () => {
    setIsLoadingJobState(true);

    try {
      const payload = await getInstallerJobState();
      setJobState(payload.data);
      setJobsError(null);
    } catch (error) {
      setJobsError(
        error instanceof Error
          ? error.message
          : "Unable to load your installer job state right now.",
      );
    } finally {
      setIsLoadingJobState(false);
    }
  }, []);

  useEffect(() => {
    void loadJobs(page);
  }, [loadJobs, page]);

  useEffect(() => {
    setPage(1);
  }, [activeTab, category, debouncedQuery, sortOrder, systemSize]);

  useEffect(() => {
    void loadJobState();
  }, [loadJobState]);

  const visibleJobs = useMemo(() => jobs, [jobs]);
  const totalVisibleJobs = pagination?.total ?? visibleJobs.length;

  const handleSignOut = () => {
    void signOut();
    router.replace("/login");
  };

  async function toggleSavedJob(jobId: string) {
    const isCurrentlySaved = jobState.savedJobIds.includes(jobId);
    setSavingJobId(jobId);
    setJobActionMessage(null);

    try {
      if (isCurrentlySaved) {
        await unsaveInstallerJob(jobId);
        setJobActionMessage("Job removed from your saved list.");
      } else {
        await saveInstallerJob(jobId, { jobId });
        setJobActionMessage("Job saved successfully.");
      }

      await Promise.all([loadJobState(), loadJobs(page)]);
      markInstallerSyncComplete("jobs");
    } catch (error) {
      setJobActionMessage(
        error instanceof Error ? error.message : "Unable to update the saved job list.",
      );
    } finally {
      setSavingJobId(null);
    }
  }

  const pageTitle =
    activeTab === "board"
      ? `Available Jobs (${totalVisibleJobs})`
      : activeTab === "applications"
        ? `My Applications (${totalVisibleJobs})`
        : activeTab === "saved"
          ? `Saved Jobs (${totalVisibleJobs})`
          : `Completed Jobs (${totalVisibleJobs})`;

  return (
    <div className="min-h-screen bg-white">
      {isSidebarOpen ? (
        <div
          className="fixed inset-0 z-40 bg-black/30 lg:hidden"
          onClick={() => setCategorySidebarOpen(false)}
        />
      ) : null}

      <div>
        <div className="flex w-full items-center justify-between gap-2 px-6 pt-6">
          <LogoFull className="h-8 w-auto lg:h-10" />
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleCategorySidebar}
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#D1D5DB] bg-white px-3 text-sm text-[#374151]"
            >
              <SlidersHorizontal className="h-4 w-4" />
              <span className="hidden sm:inline">Filters</span>
            </button>
            <InstallerNotificationCenter />
            <div className="relative block">
              <button
                type="button"
                onClick={() => setIsProfileMenuOpen((prev) => !prev)}
                className="flex items-center gap-2 rounded-md border p-2"
              >
                <div className="rounded-md border border-[#17A11E] bg-[#EBFAEB] px-3 py-1">
                  <p className="text-sm font-medium">{userInitial}</p>
                </div>
                <div className="text-left">
                  <p className="line-clamp-1 text-xs font-semibold">{userName}</p>
                  <p className="text-[10px]">Installer</p>
                </div>
                {isProfileMenuOpen ? (
                  <ChevronUp className="h-3 w-3" />
                ) : (
                  <ChevronDown className="h-3 w-3" />
                )}
              </button>

              {isProfileMenuOpen ? (
                <div className="absolute right-0 top-12 z-30 w-80 max-w-[90vw] rounded-[24px] border border-[#C9D5DF] bg-white p-4 shadow-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg border-2 border-[#17A11E] bg-[#EAF8EA] text-2xl text-[#3B3B3B]">
                        {userInitial}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[#1F2937]">{userName}</p>
                        <p className="text-xs text-[#4B5563]">{userEmail}</p>
                      </div>
                    </div>
                    <ChevronUp
                      className="h-5 w-5 text-[#4B5563]"
                      onClick={() => setIsProfileMenuOpen(false)}
                    />
                  </div>

                  <div className="mt-4 border-t border-[#D8E0E8] pt-3">
                    <Link
                      href="/installer/settings/projects#section"
                      className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left text-[#30343A] hover:bg-[#F8FAFC]"
                    >
                      <Wrench className="h-5 w-5" />
                      Projects
                    </Link>
                    <Link
                      href="/installer/settings/bills-and-payments#section"
                      className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left text-[#30343A] hover:bg-[#F8FAFC]"
                    >
                      <Receipt className="h-5 w-5" />
                      Bills and payments
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
              ) : null}
            </div>
          </div>
        </div>

        <div className="mx-auto grid w-full max-w-400 grid-cols-1 gap-6 px-4 py-8 lg:grid-cols-[360px_1fr]">
          {isSidebarOpen ? (
            <div className="fixed inset-y-0 left-0 z-50 w-full max-w-sm overflow-y-auto border-r border-[#E3E7EB] bg-white p-4 lg:hidden">
              <div className="mb-4 flex items-center justify-between">
                <p className="text-lg font-semibold text-[#111827]">Filters</p>
                <button
                  type="button"
                  className="rounded-lg border border-[#D1D5DB] bg-white p-2"
                  onClick={() => setCategorySidebarOpen(false)}
                  aria-label="Close filters"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <SidebarFilters
                isMobile
                category={category}
                setCategory={setCategory}
                systemSize={systemSize}
                setSystemSize={setSystemSize}
                isCategoryOpen={isCategoryOpen}
                setIsCategoryOpen={setIsCategoryOpen}
              />
            </div>
          ) : null}

          <div className={`hidden lg:block ${isSidebarOpen ? "" : "lg:hidden"}`}>
            <SidebarFilters
              category={category}
              setCategory={setCategory}
              systemSize={systemSize}
              setSystemSize={setSystemSize}
              isCategoryOpen={isCategoryOpen}
              setIsCategoryOpen={setIsCategoryOpen}
            />
          </div>

          <main className="rounded-2xl border border-[#E3E7EB] bg-white p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="inline-flex flex-wrap rounded-xl border border-[#ECEEF0] bg-[#7373730D] p-1">
                {tabs.map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setActiveTab(tab.key)}
                    className={`rounded-lg px-4 py-2 text-sm lg:text-base ${
                      tab.key === activeTab
                        ? "bg-white font-semibold text-[#111827]"
                        : "text-[#6B7280]"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-7 flex flex-wrap items-center justify-between gap-3">
              <h1 className="text-xl font-semibold text-[#0F172A] lg:text-2xl">{pageTitle}</h1>

              <div className="flex flex-wrap items-center gap-3">
                <label className="flex h-11 w-full items-center gap-3 rounded-xl border border-[#D1D5DB] bg-white px-4 lg:w-fit">
                  <Search className="h-4 w-4 text-[#6B7280]" />
                  <input
                    placeholder="Search by title or location..."
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    className="w-full text-sm outline-none lg:w-56"
                  />
                </label>

                <div className="relative w-full lg:w-fit">
                  <button
                    type="button"
                    onClick={() => {
                      setIsJobCategoryOpen(false);
                      setIsSystemSizeOpen(false);
                      setIsSortMenuOpen((prev) => !prev);
                    }}
                    className="inline-flex h-11 w-full items-center justify-between gap-2 rounded-xl border border-[#D1D5DB] bg-white px-4 text-sm text-[#4B5563]"
                  >
                    <div className="inline-flex items-center gap-2">
                      <SlidersHorizontal className="h-4 w-4" />
                      {sortOrder === "newest" ? "Newest" : "Oldest"}
                    </div>
                    <ChevronDown className="h-4 w-4" />
                  </button>

                  {isSortMenuOpen ? (
                    <div className="absolute right-0 top-12 z-20 w-36 rounded-xl border border-[#E5E7EB] bg-white p-1 shadow-md">
                      {(["newest", "oldest"] as SortOrder[]).map((value) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => {
                            setSortOrder(value);
                            setIsSortMenuOpen(false);
                          }}
                          className={`w-full rounded-lg px-3 py-2 text-left text-sm ${
                            sortOrder === value
                              ? "bg-[#EBFAEB] text-[#15803D]"
                              : "text-[#374151]"
                          }`}
                        >
                          {value === "newest" ? "Newest" : "Oldest"}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>

                <div className="relative block w-full lg:hidden">
                  <button
                    type="button"
                    onClick={() => {
                      setIsSystemSizeOpen(false);
                      setIsSortMenuOpen(false);
                      setIsJobCategoryOpen((prev) => !prev);
                    }}
                    className="inline-flex h-11 w-full items-center justify-between gap-2 rounded-xl border border-[#D1D5DB] bg-white px-4 text-sm text-[#4B5563]"
                  >
                    <div className="inline-flex items-center gap-2">
                      <SlidersHorizontal className="h-4 w-4" />
                      {categoryItems.find((item) => item.key === category)?.label}
                    </div>
                    <ChevronDown className="h-4 w-4" />
                  </button>

                  {isJobCategoryOpen ? (
                    <div className="absolute right-0 top-12 z-20 w-48 rounded-xl border border-[#E5E7EB] bg-white p-1 shadow-md">
                      {categoryItems.map((item) => (
                        <button
                          key={item.key}
                          type="button"
                          onClick={() => {
                            setCategory(item.key);
                            setIsJobCategoryOpen(false);
                          }}
                          className={`w-full rounded-lg px-3 py-2 text-left text-sm ${
                            category === item.key
                              ? "bg-[#EBFAEB] text-[#15803D]"
                              : "text-[#374151]"
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>

                <div className="relative block w-full lg:hidden">
                  <button
                    type="button"
                    onClick={() => {
                      setIsJobCategoryOpen(false);
                      setIsSortMenuOpen(false);
                      setIsSystemSizeOpen((prev) => !prev);
                    }}
                    className="inline-flex h-11 w-full items-center justify-between gap-2 rounded-xl border border-[#D1D5DB] bg-white px-4 text-sm text-[#4B5563]"
                  >
                    <div className="inline-flex items-center gap-2">
                      <SlidersHorizontal className="h-4 w-4" />
                      {systemSizeItems.find((item) => item.key === systemSize)?.label}
                    </div>
                    <ChevronDown className="h-4 w-4" />
                  </button>

                  {isSystemSizeOpen ? (
                    <div className="absolute right-0 top-12 z-20 w-56 rounded-xl border border-[#E5E7EB] bg-white p-1 shadow-md">
                      {systemSizeItems.map((item) => (
                        <button
                          key={item.key}
                          type="button"
                          onClick={() => {
                            setSystemSize(item.key);
                            setIsSystemSizeOpen(false);
                          }}
                          className={`w-full rounded-lg px-3 py-2 text-left text-sm ${
                            systemSize === item.key
                              ? "bg-[#EBFAEB] text-[#15803D]"
                              : "text-[#374151]"
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
            </div>

            {jobActionMessage ? (
              <p className="mt-4 text-sm text-[#475467]">{jobActionMessage}</p>
            ) : null}
            {jobsError ? <p className="mt-4 text-sm text-[#D64545]">{jobsError}</p> : null}

            {isLoadingJobs || isLoadingJobState ? (
              <div className="flex min-h-80 items-center justify-center text-sm text-[#667085]">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading installer jobs...
              </div>
            ) : (
              <>
                <div className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-3">
                  {visibleJobs.map((job) => {
                    const isSaved = jobState.savedJobIds.includes(job.id);
                    const isApplied = jobState.appliedJobIds.includes(job.id);

                    return (
                      <div
                        key={job.id}
                        className="rounded-2xl border border-[#DCE1E7] bg-[#FAFAFA] p-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <Link
                            href={`/installer/jobs/${job.id}`}
                            className="text-base font-bold text-[#1F2937]"
                          >
                            {job.title}
                          </Link>
                          <EllipsisVertical className="h-4 w-4 text-[#6B7280]" />
                        </div>
                        <p className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-[#0F9F2A]">
                          <LocateFixed className="h-4 w-4" />
                          {job.location}
                        </p>
                        <p className="mt-3 line-clamp-3 text-sm text-[#5B6472]">
                          {job.summary}
                        </p>

                        <div className="mt-3 flex flex-wrap gap-2">
                          {job.tags.map((tag) => (
                            <span
                              key={tag}
                              className={`rounded-sm px-2 py-1 text-[10px] text-white ${
                                tag.includes("New")
                                  ? "bg-[#2563EB]"
                                  : tag.includes("Standard")
                                    ? "bg-[#059669]"
                                    : "bg-[#4B5563]"
                              }`}
                            >
                              {tag}
                            </span>
                          ))}
                        </div>

                        <div className="mt-4 border-t border-[#D7DDE3] pt-3">
                          <div className="flex items-center justify-between">
                            <p className="text-base font-bold text-[#111827]">{job.budgetLabel}</p>
                            <p className="text-[10px] text-[#6B7280]">{job.postedAgo}</p>
                          </div>
                          <div className="mt-3 flex items-center gap-2">
                            <Link
                              href={`/installer/jobs/${job.id}`}
                              className="rounded-lg bg-[#1FA21B] px-3 py-2 text-sm font-medium text-white"
                            >
                              {isApplied ? "View Application" : "View Job"}
                            </Link>
                            <button
                              type="button"
                              onClick={() => void toggleSavedJob(job.id)}
                              disabled={savingJobId === job.id}
                              className={`inline-flex items-center rounded-lg border px-3 py-2 text-sm ${
                                isSaved
                                  ? "border-[#1FA21B] bg-[#EBFAEB] text-[#1FA21B]"
                                  : "border-[#D1D5DB] text-[#4B5563]"
                              }`}
                            >
                              {savingJobId === job.id ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              ) : null}
                              {isSaved ? "Saved" : "Save Job"}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {visibleJobs.length === 0 ? (
                    <div className="col-span-full rounded-2xl border border-[#DCE1E7] bg-white p-8 text-center text-sm text-[#6B7280]">
                      No jobs found for this tab or filter.
                    </div>
                  ) : null}
                </div>

                {pagination && visibleJobs.length > 0 ? (
                  <PaginationControls
                    className="mt-6"
                    page={pagination.page}
                    totalPages={pagination.totalPages}
                    totalItems={pagination.total}
                    onPageChange={setPage}
                  />
                ) : null}
              </>
            )}
          </main>
        </div>
      </div>

      {isProfileMenuOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-20 bg-transparent"
          onClick={() => setIsProfileMenuOpen(false)}
          aria-label="Close profile menu"
        />
      ) : null}

      {isSortMenuOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-10 bg-transparent"
          onClick={() => setIsSortMenuOpen(false)}
          aria-label="Close sort menu"
        />
      ) : null}
    </div>
  );
};

export { InstallerJobsDashboard };
