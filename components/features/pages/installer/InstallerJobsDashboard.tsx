"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ChevronDown,
  ChevronUp,
  EllipsisVertical,
  HelpCircle,
  LocateFixed,
  LogOut,
  Search,
  Settings,
  SlidersHorizontal,
  Receipt,
  Wrench,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { LogoFull } from "@/components/features/icons/Logo";
import {
  logoutUser,
  queuePendingInstallerSubmission,
  sessionSnapshotToMockSession,
} from "@/lib/localAuth";
import { installerJobs } from "@/lib/installerJobs";
import { getInstallerJobState, saveInstallerJobState } from "@/lib/installerStorage";
import { useAuth } from "@/components/auth/auth-provider";
import { useGeneralStore } from "@/store/GeneralStore";


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
  { key: "small" as SystemSize, label: "Small Home (0 - 3.5kVA)" },
  { key: "medium" as SystemSize, label: "Medium (5kVA - 10kVA)" },
  { key: "commercial" as SystemSize, label: "Commercial (15kVA+)" },
];

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
        className="flex w-full items-center justify-between text-xl lg:text-2xl font-semibold text-[#13161A]"
      >
        Job Categories
        <span className="text-[#6B7280]">
          {isCategoryOpen ? <ChevronUp /> : <ChevronDown />}
        </span>
      </button>

      {isCategoryOpen && (
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
      )}
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

const InstallerJobsDashboard = () => {
  const router = useRouter();
  const { session: authSession } = useAuth();
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
  const isSidebarOpen = useGeneralStore((state) => state.isCategorySidebarOpen);
  const setCategorySidebarOpen = useGeneralStore((state) => state.setCategorySidebarOpen);
  const toggleCategorySidebar = useGeneralStore((state) => state.toggleCategorySidebar);
  const markInstallerSyncPending = useGeneralStore((state) => state.markInstallerSyncPending);
  const session = useMemo(() => sessionSnapshotToMockSession(authSession), [authSession]);
  const [jobState, setJobState] = useState(() =>
    session && session.role === "installer"
      ? getInstallerJobState(session)
      : { appliedJobIds: [] as string[], savedJobIds: [] as string[] }
  );

  useEffect(() => {
    if (!session || session.role !== "installer") return;
    saveInstallerJobState(session, jobState);
  }, [jobState, session]);

  const visibleJobs = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = installerJobs.filter((job) => {
      const matchesQuery =
        q.length === 0 ||
        job.title.toLowerCase().includes(q) ||
        job.city.toLowerCase().includes(q) ||
        job.state.toLowerCase().includes(q);
      const matchesCategory =
        category === "all"
          ? true
          : category === "full_installation"
            ? job.jobType.toLowerCase().includes("full")
            : category === "maintenance"
              ? job.title.toLowerCase().includes("maintenance")
              : category === "repairs"
                ? job.title.toLowerCase().includes("repair")
                : category === "audits"
                  ? job.title.toLowerCase().includes("audit")
                  : job.title.toLowerCase().includes("battery");
      const matchesSystem =
        systemSize === "all"
          ? true
          : systemSize === "small"
            ? job.systemSize.toLowerCase().includes("3kva")
            : systemSize === "medium"
              ? job.systemSize.toLowerCase().includes("5kva")
              : job.jobType.toLowerCase().includes("commercial");

      if (!matchesQuery || !matchesCategory || !matchesSystem) return false;
      if (activeTab === "applications") return jobState.appliedJobIds.includes(job.id);
      if (activeTab === "saved") return jobState.savedJobIds.includes(job.id);
      if (activeTab === "completed") return false;
      return true;
    });

    return sortOrder === "oldest" ? [...filtered].reverse() : filtered;
  }, [
    activeTab,
    category,
    jobState.appliedJobIds,
    jobState.savedJobIds,
    query,
    sortOrder,
    systemSize,
  ]);

  const userInitial = session?.fullName?.charAt(0)?.toUpperCase() ?? "A";
  const userName = session?.fullName ?? "Amara Johnson";
  const userEmail = session?.email ?? "amara.j@email.com";

  const handleSignOut = async () => {
    await logoutUser();
    router.push("/login");
  };

  const toggleSavedJob = (jobId: string) => {
    const isCurrentlySaved = jobState.savedJobIds.includes(jobId);

    setJobState((prev) => ({
      ...prev,
      savedJobIds: isCurrentlySaved
        ? prev.savedJobIds.filter((id) => id !== jobId)
        : [...prev.savedJobIds, jobId],
    }));
    markInstallerSyncPending("jobs");

    queuePendingInstallerSubmission(
      isCurrentlySaved ? "installer_job_unsave" : "installer_job_save",
      `/api/v1/installers/jobs/${jobId}/saved`,
      isCurrentlySaved ? "DELETE" : "POST",
      { jobId },
      "Installer job save endpoints have not been supplied yet. The action was captured for later API hookup.",
    );
  };

  return (
    <div className="min-h-screen bg-white">
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 lg:hidden"
          onClick={() => setCategorySidebarOpen(false)}
        />
      )}

      <div>
        <div className="flex items-center justify-between w-full gap-2 px-6 pt-6">
          <LogoFull className="h-8 lg:h-10  w-auto" />
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleCategorySidebar}
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#D1D5DB] bg-white px-3 text-sm text-[#374151]"
            >
              <SlidersHorizontal className="h-4 w-4" />
              <span className="hidden sm:inline">Filters</span>
            </button>
            <div className="relative block">
              <button
                type="button"
                onClick={() => setIsProfileMenuOpen((prev) => !prev)}
                className="border p-2 rounded-md flex items-center gap-2"
              >
                <div className="border border-[#17A11E] bg-[#EBFAEB] px-3 py-1 rounded-md">
                  <p className="text-sm font-medium">{userInitial}</p>
                </div>
                <div className="text-left">
                  <p className="text-xs font-semibold line-clamp-1">{userName}</p>
                  <p className="text-[10px]">Installer</p>
                </div>
                {isProfileMenuOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>

              {isProfileMenuOpen && (
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
                    <ChevronUp className="h-5 w-5 text-[#4B5563]" onClick={() => setIsProfileMenuOpen(false)} />
                  </div>

                  <div className="mt-4 border-t border-[#D8E0E8] pt-3">
                    {/* <button className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left text-[#30343A] hover:bg-[#F8FAFC]">
                    <Wrench className="h-5 w-5" />
                    My Jobs
                  </button> */}
                    <Link href="/installer/settings/projects#section">
                      <button className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left text-[#30343A] hover:bg-[#F8FAFC]">
                        <Wrench className="h-5 w-5" />
                        Projects
                      </button>
                    </Link>
                    <Link href="/installer/settings/bills-and-payments#section">
                      <button className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left text-[#30343A] hover:bg-[#F8FAFC]">
                        <Receipt className="h-5 w-5" />
                        Bills and payments
                      </button>
                    </Link>

                    <Link href="/installer/settings">
                      <button className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left text-[#30343A] hover:bg-[#F8FAFC]">
                        <Settings className="h-5 w-5" />
                        Settings
                      </button>
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
              )}
            </div>
          </div></div>
        <div className="mx-auto grid w-full max-w-400 grid-cols-1 gap-6 px-4 py-8 lg:grid-cols-[360px_1fr]">

          {isSidebarOpen && (
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
          )}

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
              <div className="flex items-center justify-between w-full gap-2">

                <div className="flex items-center gap-2">
                  <div className="inline-flex flex-wrap rounded-xl border border-[#ECEEF0] bg-[#7373730D] p-1">
                    {tabs.map((tab) => (
                      <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`rounded-lg px-4 py-2 text-sm lg:text-base ${tab.key === activeTab
                          ? "bg-white font-semibold text-[#111827]"
                          : "text-[#6B7280]"
                          }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>

              </div>

            </div>

            <div className="flex justify-between items-center mt-7 gap-3 flex-wrap">
              <h1 className="text-xl lg:text-2xl font-semibold text-[#0F172A]">
                {activeTab === "board" && `Available Jobs (${visibleJobs.length})`}
                {activeTab === "applications" && `My Applications (${visibleJobs.length})`}
                {activeTab === "saved" && `Saved Jobs (${visibleJobs.length})`}
                {activeTab === "completed" && "Completed Jobs (0)"}
              </h1>

              <div className="flex items-center gap-3 flex-wrap">
                <label className="flex h-11 items-center gap-3 rounded-xl border border-[#D1D5DB] bg-white px-4  w-full lg:w-fit">
                  <Search className="h-4 w-4 text-[#6B7280]" />
                  <input
                    placeholder="Search by city, state..."
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    className="w-full lg:w-56 text-sm outline-none"
                  />
                </label>

                <div className="relative w-full lg:w-fit">
                  <button
                    type="button"
                    onClick={() => { setIsJobCategoryOpen(false); setIsSystemSizeOpen(false); setIsSortMenuOpen((prev) => !prev) }}
                    className="inline-flex justify-between w-full h-11 items-center gap-2 rounded-xl border border-[#D1D5DB] bg-white px-4 text-sm text-[#4B5563]"
                  >
                    <div className="inline-flex items-center gap-2">
                      <SlidersHorizontal className="h-4 w-4" />
                      {sortOrder === "newest" ? "Newest" : "Oldest"}
                    </div>

                    <ChevronDown className="h-4 w-4" />
                  </button>

                  {isSortMenuOpen && (
                    <div className="absolute right-0 top-12 z-20 w-36 rounded-xl border border-[#E5E7EB] bg-white p-1 shadow-md">
                      <button
                        type="button"
                        onClick={() => {
                          setSortOrder("newest");
                          setIsSortMenuOpen(false);
                        }}
                        className={`w-full rounded-lg px-3 py-2 text-left text-sm ${sortOrder === "newest" ? "bg-[#EBFAEB] text-[#15803D]" : "text-[#374151]"
                          }`}
                      >
                        Newest
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSortOrder("oldest");
                          setIsSortMenuOpen(false);
                        }}
                        className={`w-full rounded-lg px-3 py-2 text-left text-sm ${sortOrder === "oldest" ? "bg-[#EBFAEB] text-[#15803D]" : "text-[#374151]"
                          }`}
                      >
                        Oldest
                      </button>
                    </div>
                  )}
                </div>
                <div className="block lg:hidden relative w-full">
                  <button
                    type="button"
                    onClick={() => { setIsSystemSizeOpen(false); setIsSortMenuOpen(false); setIsJobCategoryOpen((prev) => !prev) }}
                    className="inline-flex w-full h-11 justify-between items-center gap-2 rounded-xl border border-[#D1D5DB] bg-white px-4 text-sm text-[#4B5563]"
                  >
                    <div className="inline-flex items-center gap-2">
                      <SlidersHorizontal className="h-4 w-4" />
                      {categoryItems.find((c) => c.key === category)?.label}
                    </div>

                    <ChevronDown className="h-4 w-4" />
                  </button>

                  {isJobCategoryOpen && (
                    <div className="absolute right-0 top-12 z-20 w-36 rounded-xl border border-[#E5E7EB] bg-white p-1 shadow-md">
                      {categoryItems.map((c, i) => (
                        <button
                          type="button"
                          key={i}
                          onClick={() => {
                            setCategory(c.key)
                            setIsJobCategoryOpen(false);
                          }}
                          className={`w-full rounded-lg px-3 py-2 text-left text-sm ${category === c.key ? "bg-[#EBFAEB] text-[#15803D]" : "text-[#374151]"
                            }`}
                        >
                          {c.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="block lg:hidden relative w-full">
                  <button
                    type="button"
                    onClick={() => { setIsJobCategoryOpen(false); setIsSortMenuOpen(false); setIsSystemSizeOpen((prev) => !prev); }}
                    className="inline-flex w-full h-11 justify-between items-center gap-2 rounded-xl border border-[#D1D5DB] bg-white px-4 text-sm text-[#4B5563]"
                  >
                    <div className="inline-flex items-center gap-2">
                      <SlidersHorizontal className="h-4 w-4" />
                      {systemSizeItems.find((s) => s.key === systemSize)?.label}
                    </div>

                    <ChevronDown className="h-4 w-4" />
                  </button>

                  {isSystemSizeOpen && (
                    <div className="absolute right-0 top-12 z-20 w-36 rounded-xl border border-[#E5E7EB] bg-white p-1 shadow-md">
                      {systemSizeItems.map((s, i) => (
                        <button
                          type="button"
                          key={i}
                          onClick={() => {
                            setSystemSize(s.key)
                            setIsSystemSizeOpen(false);
                          }}
                          className={`w-full rounded-lg px-3 py-2 text-left text-sm ${systemSize === s.key ? "bg-[#EBFAEB] text-[#15803D]" : "text-[#374151]"
                            }`}
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-3">
              {visibleJobs.map((job) => {
                const isSaved = jobState.savedJobIds.includes(job.id);
                const isApplied = jobState.appliedJobIds.includes(job.id);

                return (
                  <div key={job.id} className="rounded-2xl border border-[#DCE1E7] bg-[#FAFAFA] p-4">
                    <div className="flex items-start justify-between gap-3">
                      <Link href={`/installer/jobs/${job.id}`} className="text-base font-bold text-[#1F2937]">
                        {job.title}
                      </Link>
                      <EllipsisVertical className="h-4 w-4 text-[#6B7280]" />
                    </div>
                    <p className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-[#0F9F2A]">
                      <LocateFixed className="h-4 w-4" />
                      {job.city}, {job.state}.
                    </p>
                    <p className="mt-3 line-clamp-3 text-sm text-[#5B6472]">{job.summary}</p>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {job.tags.map((tag) => (
                        <span
                          key={tag}
                          className={`rounded-sm px-2 py-1 text-[10px] text-white ${tag.includes("New")
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
                          {isApplied ? "View Assignment" : "View Job"}
                        </Link>
                        <button
                          type="button"
                          onClick={() => toggleSavedJob(job.id)}
                          className={`rounded-lg border px-3 py-2 text-sm ${isSaved
                            ? "border-[#1FA21B] bg-[#EBFAEB] text-[#1FA21B]"
                            : "border-[#D1D5DB] text-[#4B5563]"
                            }`}
                        >
                          {isSaved ? "Saved" : "Save Job"}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}

              {visibleJobs.length === 0 && (
                <div className="col-span-full rounded-2xl border border-[#DCE1E7] bg-white p-8 text-center text-sm text-[#6B7280]">
                  No jobs found for this tab/filter yet.
                </div>
              )}
            </div>
          </main>
        </div>
      </div>


      {isProfileMenuOpen && (
        <button
          type="button"
          className="fixed inset-0 z-20 bg-transparent"
          onClick={() => setIsProfileMenuOpen(false)}
          aria-label="Close profile menu"
        />
      )}

      {isSortMenuOpen && (
        <button
          type="button"
          className="fixed inset-0 z-10 bg-transparent"
          onClick={() => setIsSortMenuOpen(false)}
          aria-label="Close sort menu"
        />
      )}

    </div>
  );
};

export { InstallerJobsDashboard };
