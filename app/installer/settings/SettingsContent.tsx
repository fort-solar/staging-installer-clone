"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ChevronDown, EllipsisVertical, Info, MapPin, Plus, Star, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SmartTabsInstaller, type TabKeyInstaller } from "@/lib/smartTabs";
import { BankIcon } from "@/components/features/icons/BankIcon";
import { HistoryIcon } from "@/components/features/icons/HistoryIcon";
import { PrintIcon } from "@/components/features/icons/PrintIcon";
import { SoonIcon } from "@/components/features/icons/SoonIcon";
import { ImageIcon } from "@/components/features/icons/ImageIcon";
import { PDFIcon } from "@/components/features/icons/PDFIcon";
import { updateCurrentUserProfile } from "@/lib/localAuth";
import { useAuth } from "@/components/auth/auth-provider";
import { useGeneralStore } from "@/store/GeneralStore";
import {
  createInstallerPaymentMethod,
  deleteInstallerPaymentMethod,
  getInstallerPaymentMethods,
  getInstallerPayouts,
  getInstallerProfile,
  getInstallerProjects,
  updateInstallerProfile,
} from "@/lib/api/installers";

type InstallerProfileState = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  location: string;
  experienceLevel: string;
  additionalInfo: string;
  skills: string[];
  completedInstallations: number;
  rating: number;
  tier: string;
};

type PaymentMethod = {
  id: string;
  accountName: string;
  accountNumber: string;
  bankName: string;
};

type InlineStatus = {
  tone: "success" | "error" | "info";
  message: string;
} | null;

type PayoutStatus = "Pending" | "Approved" | "Declined";
type PayoutFilter = "All" | PayoutStatus;

type PayoutHistoryRow = {
  id: string;
  referenceId: string;
  amount: string;
  date: string;
  status: PayoutStatus;
};

type ProjectStatus = "Scheduled" | "In Progress" | "Completed";

type InstallerProject = {
  id: string;
  title: string;
  location: string;
  summary: string;
  budget: string;
  startMeta: string;
  status: ProjectStatus;
  tags: string[];
};

const tabs = [
  {
    key: "profile",
    label: "Profile",
    link: "/installer/settings/profile",
    mobileLink: "/installer/settings/profile#section",
  },
  {
    key: "projects",
    label: "Projects",
    link: "/installer/settings/projects",
    mobileLink: "/installer/settings/projects#section",
  },
  {
    key: "bills_and_payments",
    label: "Billing & Payments",
    link: "/installer/settings/bills-and-payments",
    mobileLink: "/installer/settings/bills-and-payments#section",
  },
] as const;

const DEFAULT_SKILLS = ["Battery Configuration", "Residential", "Domestic", "Commercial"];

const EXPERIENCE_LEVELS = ["Beginner", "Intermediate", "Advanced", "Expert", "Master"];

const statusTone: Record<ProjectStatus, string> = {
  Scheduled: "bg-[#E9F6E9] text-[#149414]",
  "In Progress": "bg-[#FFF5E5] text-[#F59E0B]",
  Completed: "bg-[#E8F9EB] text-[#17A11E]",
};

const payoutTone: Record<PayoutStatus, string> = {
  Pending: "bg-[#FFF0C8] text-[#E3A100]",
  Approved: "bg-[#DFF3DF] text-[#159216]",
  Declined: "bg-[#FCE5E5] text-[#E24646]",
};

const InfoItem = ({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) => (
  <div className="flex flex-wrap items-center gap-3 text-xs lg:text-sm text-[#5B5B5B]">
    <span className="flex items-center justify-center text-[#7C7C7C]">{icon}</span>
    <div className="min-w-22.5 text-[#8B8B8B] text-xs">{label}</div>
    <div className="font-medium text-[#202020]">{value}</div>
  </div>
);

function splitFullName(value: string) {
  const trimmed = value.trim();
  const segments = trimmed.split(/\s+/).filter(Boolean);

  return {
    firstName: segments[0] ?? "",
    lastName: segments.slice(1).join(" "),
  };
}

function formatPayoutDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString();
}

const SettingsContent = ({ page }: { page: TabKeyInstaller }) => {
  const { session } = useAuth();
  const markInstallerSyncComplete = useGeneralStore((state) => state.markInstallerSyncComplete);
  const [activeTab, setActiveTab] = useState<TabKeyInstaller>(page ? page : "profile");
  const [skillInput, setSkillInput] = useState("");
  const [isSkillEditorOpen, setIsSkillEditorOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isPayoutFilterOpen, setIsPayoutFilterOpen] = useState(false);
  const [payoutFilter, setPayoutFilter] = useState<PayoutFilter>("All");
  const [projects, setProjects] = useState<InstallerProject[]>([]);
  const [payoutHistory, setPayoutHistory] = useState<PayoutHistoryRow[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isPaymentSaving, setIsPaymentSaving] = useState(false);

  const [paymentForm, setPaymentForm] = useState({
    accountName: "",
    accountNumber: "",
    bankName: "",
  });

  const sessionFullName = session?.user.fullName ?? "Installer User";
  const sessionNames = splitFullName(sessionFullName);
  const sessionEmail = session?.user.email ?? "";
  const sessionPhone = session?.user.phone ?? "";
  const sessionAddress = session?.user.address ?? "";

  const defaultProfile = useMemo<InstallerProfileState>(() => ({
    firstName: sessionNames.firstName || "Installer",
    lastName: sessionNames.lastName,
    email: sessionEmail,
    phone: sessionPhone,
    address: sessionAddress,
    location: "",
    experienceLevel: "Intermediate",
    additionalInfo: "",
    skills: DEFAULT_SKILLS,
    completedInstallations: 0,
    rating: 0,
    tier: "Tier I",
  }), [sessionAddress, sessionEmail, sessionNames.firstName, sessionNames.lastName, sessionPhone]);

  const [profile, setProfile] = useState<InstallerProfileState>(defaultProfile);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [profileStatus, setProfileStatus] = useState<InlineStatus>(null);
  const [paymentStatus, setPaymentStatus] = useState<InlineStatus>(null);
  const [isProfileSaving, setIsProfileSaving] = useState(false);

  useEffect(() => {
    if (!session) {
      setIsInitialLoading(false);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const [profilePayload, paymentPayload, projectPayload, payoutPayload] = await Promise.all([
          getInstallerProfile(),
          getInstallerPaymentMethods(),
          getInstallerProjects({ page: 1, limit: 100 }),
          getInstallerPayouts({ page: 1, limit: 100 }),
        ]);

        if (cancelled) {
          return;
        }

        const profileNames = splitFullName(session.user.fullName);

        setProfile({
          firstName: profileNames.firstName || defaultProfile.firstName,
          lastName: profileNames.lastName,
          email: profilePayload.data.email || session.user.email,
          phone: session.user.phone ?? "",
          address: session.user.address ?? "",
          location: profilePayload.data.primaryLocation || profilePayload.data.location || "",
          experienceLevel: profilePayload.data.experienceLevel || "Intermediate",
          additionalInfo: profilePayload.data.additionalInfo || "",
          skills: profilePayload.data.skills.length > 0 ? profilePayload.data.skills : DEFAULT_SKILLS,
          completedInstallations: profilePayload.data.completedInstallations,
          rating: profilePayload.data.rating,
          tier: profilePayload.data.tier || "Tier I",
        });
        setPaymentMethods(paymentPayload.data);
        setProjects(
          projectPayload.data.map((project) => ({
            id: project.id,
            title: project.title,
            location: project.location,
            summary: project.summary,
            budget: project.budget,
            startMeta: project.startMeta,
            status:
              project.status === "Scheduled" ||
              project.status === "In Progress" ||
              project.status === "Completed"
                ? project.status
                : "Scheduled",
            tags: project.tags,
          })),
        );
        setPayoutHistory(
          payoutPayload.data.map((row) => ({
            id: row.id,
            referenceId: row.referenceId,
            amount: row.amount,
            date: formatPayoutDate(row.date),
            status:
              row.status === "Pending" || row.status === "Approved" || row.status === "Declined"
                ? row.status
                : "Pending",
          })),
        );
        setProfileStatus(null);
        setPaymentStatus(null);
      } catch (error) {
        if (!cancelled) {
          const message =
            error instanceof Error ? error.message : "Unable to load your installer settings.";
          setProfileStatus({ tone: "error", message });
          setPaymentStatus({ tone: "error", message });
        }
      } finally {
        if (!cancelled) {
          setIsInitialLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [defaultProfile.firstName, session]);

  const handleProfileSave = async () => {
    const fullName = `${profile.firstName} ${profile.lastName}`.trim();

    if (!fullName) {
      setProfileStatus({
        tone: "error",
        message: "First name and last name are required.",
      });
      return;
    }

    setIsProfileSaving(true);
    setProfileStatus(null);

    try {
      await Promise.all([
        updateCurrentUserProfile({
          name: fullName,
          phone: profile.phone,
          address: profile.address,
        }),
        updateInstallerProfile({
          email: profile.email,
          location: profile.location,
          experienceLevel: profile.experienceLevel,
          additionalInfo: profile.additionalInfo,
          skills: profile.skills,
          completedInstallations: profile.completedInstallations,
          rating: profile.rating,
          tier: profile.tier,
        }),
      ]);
      markInstallerSyncComplete("profile");

      setProfileStatus({
        tone: "success",
        message: "Your installer profile has been updated.",
      });
    } catch (error) {
      setProfileStatus({
        tone: "error",
        message: error instanceof Error ? error.message : "Unable to save profile right now.",
      });
    } finally {
      setIsProfileSaving(false);
    }
  };

  const addSkill = () => {
    const value = skillInput.trim();
    if (!value) return;
    if (profile.skills.some((skill) => skill.toLowerCase() === value.toLowerCase())) {
      setSkillInput("");
      return;
    }
    setProfile((prev) => ({ ...prev, skills: [...prev.skills, value] }));
    setSkillInput("");
  };

  const removeSkill = (skill: string) => {
    setProfile((prev) => ({
      ...prev,
      skills: prev.skills.filter((item) => item !== skill),
    }));
  };

  const addPaymentMethod = async () => {
    const accountName = paymentForm.accountName.trim();
    const accountNumber = paymentForm.accountNumber.trim();
    const bankName = paymentForm.bankName.trim();

    if (!accountName || !accountNumber || !bankName) {
      setPaymentStatus({
        tone: "error",
        message: "Account name, account number, and bank name are required.",
      });
      return;
    }

    setIsPaymentSaving(true);
    setPaymentStatus(null);

    try {
      await createInstallerPaymentMethod({
        accountName,
        accountNumber,
        bankName,
      });
      const payload = await getInstallerPaymentMethods();
      setPaymentMethods(payload.data);
      markInstallerSyncComplete("payment_methods");
      setPaymentForm({ accountName: "", accountNumber: "", bankName: "" });
      setIsPaymentModalOpen(false);
      setPaymentStatus({
        tone: "success",
        message: "Payment method added successfully.",
      });
    } catch (error) {
      setPaymentStatus({
        tone: "error",
        message: error instanceof Error ? error.message : "Unable to add this payment method.",
      });
    } finally {
      setIsPaymentSaving(false);
    }
  };

  const removePaymentMethod = async (id: string) => {
    setIsPaymentSaving(true);
    setPaymentStatus(null);

    try {
      await deleteInstallerPaymentMethod(id);
      const payload = await getInstallerPaymentMethods();
      setPaymentMethods(payload.data);
      markInstallerSyncComplete("payment_methods");
      setPaymentStatus({
        tone: "success",
        message: "Payment method removed successfully.",
      });
    } catch (error) {
      setPaymentStatus({
        tone: "error",
        message: error instanceof Error ? error.message : "Unable to remove this payment method.",
      });
    } finally {
      setIsPaymentSaving(false);
    }
  };

  const filteredPayoutHistory = useMemo(() => {
    if (payoutFilter === "All") return payoutHistory;
    return payoutHistory.filter((row) => row.status === payoutFilter);
  }, [payoutFilter, payoutHistory]);

  return (
    <div className="min-h-screen bg-white py-10">
      <div className="mx-auto w-full max-w-7xl px-6 py-6 lg:mt-0">
        <div className="flex items-center justify-between gap-2">
          <Link
            href="/installer/dashboard"
            className="inline-flex items-center gap-2 rounded-md border border-[#E2E8F0] bg-white px-4 py-2 text-sm font-medium text-[#374151]"
          >
            <ArrowLeft className="h-4 w-4" /> Home
          </Link>
        </div>

        {isInitialLoading ? (
          <p className="mt-4 text-sm text-[#667085]">Loading your installer settings...</p>
        ) : null}

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[350px_1fr]">
          <aside className="w-full rounded-t-3xl border-t border-x border-[#ECECEC] bg-white p-6 lg:py-10">
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="flex h-32 w-32 items-center justify-center rounded-[32px] border border-[#E3E3E3] bg-[#F3F4F6] text-5xl font-semibold text-[#5B5B5B] shadow-sm">
                {profile.firstName?.charAt(0)?.toUpperCase() || "A"}
              </div>
              <div>
                <p className="text-xl lg:text-2xl font-semibold text-[#202020] flex items-center gap-3">
                  {profile.firstName} {profile.lastName}
                  <span className="flex flex-col text-[#FFA726] text-[10px] font-bold items-center border w-fit p-1 rounded-md border-[#FFA726]">
                    <Star className="w-2 h-2 lg:w-3 lg:h-3" />
                    <span>{profile.rating}</span>
                  </span>
                </p>
                <span className="mt-2 inline-flex items-center rounded-l-full bg-[#168ABD1A] px-4 py-1 text-sm font-medium text-[#168ABD]">
                  Installer
                </span>
                <span className="bg-[#EBFAEB] mt-2 inline-flex items-center rounded-r-full px-4 py-1 text-sm font-medium text-[#036D03]">
                  {profile.tier}
                </span>
              </div>
            </div>

            <div className="mt-8 flex flex-col gap-4">
              <InfoItem
                icon={
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  >
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2A19.8 19.8 0 0 1 3 5.18 2 2 0 0 1 5 3h3a2 2 0 0 1 2 1.72c.12.86.3 1.7.54 2.5a2 2 0 0 1-.45 1.9L9 10.91a16 16 0 0 0 4.09 4.09l1.79-1.09a2 2 0 0 1 1.9-.45c.8.24 1.64.42 2.5.54A2 2 0 0 1 22 16.92z" />
                  </svg>
                }
                label="Phone Number"
                value={profile.phone}
              />
              <InfoItem icon={
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <path d="M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" />
                  <path d="m22 6-10 7L2 6" />
                </svg>
              } label="Email" value={profile.email} />
              <InfoItem icon={
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <path d="M12 22s7-4.5 7-11a7 7 0 0 0-14 0c0 6.5 7 11 7 11z" />
                  <circle cx="12" cy="11" r="3" />
                </svg>
              } label="Location" value={profile.location} />
            </div>

            <div className="mt-8">
              <p className="text-xl lg:text-2xl font-semibold text-[#202020]">Skills</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {profile.skills.map((skill) => (
                  <span
                    key={skill}
                    className="rounded-full border border-[#5E6673] bg-white px-4 py-1 text-sm font-medium text-[#50555C]"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-10 flex items-center justify-between py-1 text-sm">
              <span className="font-semibold text-[#202020] underline decoration-[#9C9C9C] underline-offset-4">
                Completed Intallations
              </span>
              <span className="text-xl font-semibold text-[#202020] underline decoration-[#9C9C9C] underline-offset-4">
                {profile.completedInstallations}
              </span>
            </div>
          </aside>

          <section className="rounded-t-3xl border-t border-x border-[#ECECEC] bg-white px-3 py-6 lg:py-8 lg:px-8  overflow-x-auto">
            <div className="flex flex-col gap-6 w-full">
              <div className="w-full overflow-x-auto scroll-mt-24 lg:scroll-mt-0" id="section">
                <SmartTabsInstaller tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
              </div>

              {activeTab === "profile" && (
                <div className="space-y-6">
                  <h2 className="text-xl lg:text-2xl font-semibold text-[#202020]">Personal Details</h2>

                  <div className="grid gap-6 lg:grid-cols-2">
                    <label className="space-y-2 text-sm font-medium text-[#202020]">
                      <span className="text-[#5B5B5B]">First Name</span>
                      <Input
                        value={profile.firstName}
                        onChange={(e) => setProfile((prev) => ({ ...prev, firstName: e.target.value }))}
                        className="h-12 rounded-xl border-[#E3E3E3] bg-white text-base"
                      />
                    </label>
                    <label className="space-y-2 text-sm font-medium text-[#202020]">
                      <span className="text-[#5B5B5B]">Last Name</span>
                      <Input
                        value={profile.lastName}
                        onChange={(e) => setProfile((prev) => ({ ...prev, lastName: e.target.value }))}
                        className="h-12 rounded-xl border-[#E3E3E3] bg-white text-base"
                      />
                    </label>
                    <label className="space-y-2 text-sm font-medium text-[#202020]">
                      <span className="text-[#5B5B5B]">Email Address</span>
                      <Input
                        value={profile.email}
                        readOnly
                        className="h-12 rounded-xl border-[#E3E3E3] bg-[#F8FAFC] text-base text-[#667085]"
                      />
                    </label>
                    <label className="space-y-2 text-sm font-medium text-[#202020]">
                      <span className="text-[#5B5B5B]">Phone Number</span>
                      <Input
                        value={profile.phone}
                        onChange={(e) => setProfile((prev) => ({ ...prev, phone: e.target.value }))}
                        className="h-12 rounded-xl border-[#E3E3E3] bg-white text-base"
                      />
                    </label>
                    <label className="space-y-2 text-sm font-medium text-[#202020] lg:col-span-2">
                      <span className="text-[#5B5B5B]">Address</span>
                      <Input
                        value={profile.address}
                        onChange={(e) => setProfile((prev) => ({ ...prev, address: e.target.value }))}
                        className="h-12 rounded-xl border-[#E3E3E3] bg-white text-base"
                      />
                    </label>

                    <label className="space-y-2 text-sm font-medium text-[#202020]">
                      <span className="text-[#5B5B5B]">Experience Level</span>
                      <select
                        value={profile.experienceLevel}
                        onChange={(e) => setProfile((prev) => ({ ...prev, experienceLevel: e.target.value }))}
                        className="h-12 w-full rounded-xl border border-[#E3E3E3] bg-white px-3 text-base outline-none"
                      >
                        {EXPERIENCE_LEVELS.map((level) => (
                          <option key={level} value={level}>
                            {level}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="space-y-2 text-sm font-medium text-[#202020] lg:col-span-2">
                      <span className="text-[#5B5B5B]">Additional Info</span>
                      <textarea
                        value={profile.additionalInfo}
                        onChange={(e) =>
                          setProfile((prev) => ({
                            ...prev,
                            additionalInfo: e.target.value,
                          }))
                        }
                        className="min-h-28 w-full rounded-xl border border-[#E3E3E3] bg-white px-3 py-3 text-base outline-none"
                      />
                    </label>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-2xl font-semibold text-[#202020]">Skills</h3>
                      <Button
                        type="button"
                        onClick={() => setIsSkillEditorOpen((prev) => !prev)}
                        className="rounded-full bg-[#E9EEF2] px-5 text-[#1F2937] hover:bg-[#DCE4EA]"
                      >
                        {isSkillEditorOpen ? "Done" : "Edit Skills"}
                      </Button>
                    </div>

                    <div className="rounded-2xl border border-[#E3E3E3] bg-[#FAFAFA] p-4">
                      <div className="flex flex-wrap gap-2">
                        {profile.skills.map((skill) => (
                          <span
                            key={skill}
                            className="inline-flex items-center gap-2 rounded-full border border-[#5E6673] bg-white px-4 py-1 text-sm font-medium text-[#50555C]"
                          >
                            {skill}
                            {isSkillEditorOpen && (
                              <button type="button" onClick={() => removeSkill(skill)}>
                                <Trash2 className="h-3 w-3 text-[#D64545]" />
                              </button>
                            )}
                          </span>
                        ))}
                      </div>

                      {isSkillEditorOpen && (
                        <div className="mt-4 flex flex-wrap items-center gap-2">
                          <Input
                            value={skillInput}
                            onChange={(e) => setSkillInput(e.target.value)}
                            placeholder="Add new skill"
                            className="h-11 max-w-60 rounded-xl border-[#E3E3E3]"
                          />
                          <Button
                            type="button"
                            onClick={addSkill}
                            className="h-11 rounded-xl bg-[#1D9A1D] px-5 text-white hover:bg-[#168416]"
                          >
                            Add Skill
                          </Button>
                        </div>
                      )}
                    </div>

                    <div className="rounded-2xl border border-[#E3E3E3] bg-[#FAFAFA] p-4">
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                          <p className="text-sm font-medium text-[#202020]">Save profile changes</p>
                          <p className="text-xs text-[#667085]">
                            Name, phone, and address sync through `/api/v1/auth/me`. Installer-only fields are kept locally and queued until their endpoint is ready.
                          </p>
                        </div>
                        <Button
                          type="button"
                          onClick={handleProfileSave}
                          disabled={isProfileSaving}
                          className="rounded-xl bg-[#18A11B] px-6 text-white hover:bg-[#138A16] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {isProfileSaving ? "Saving..." : "Save Profile"}
                        </Button>
                      </div>
                      {profileStatus && (
                        <p
                          className={`mt-3 text-sm ${
                            profileStatus.tone === "error"
                              ? "text-[#D64545]"
                              : profileStatus.tone === "success"
                                ? "text-[#15803D]"
                                : "text-[#475467]"
                          }`}
                        >
                          {profileStatus.message}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "projects" && (
                <div className="space-y-6">
                  {projects.map((project) => (
                    <div key={project.id} className="rounded-[22px] border border-[#DCE1E7] bg-white p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="text-sm lg:text-base leading-none font-bold text-[#1F2937]">{project.title}</h3>
                          <p className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-[#07940F]">
                            <MapPin className="h-4 w-4" /> {project.location}
                          </p>
                        </div>
                        <EllipsisVertical className="h-5 w-5 text-[#7B8390]" />
                      </div>

                      <p className="mt-3 text-sm text-[#5B6472] leading-snug">{project.summary}</p>

                      <div className="mt-4 flex flex-wrap gap-2">
                        {project.tags.map((tag) => (
                          <span
                            key={`${project.id}-${tag}`}
                            className={`rounded-md px-3 py-1 text-xs text-white ${tag.includes("New") ? "bg-[#2563EB]" : tag.includes("Standard") ? "bg-[#059669]" : "bg-[#475569]"
                              }`}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>

                      <div className="mt-4 border-t border-[#D7DDE3] pt-4 flex flex-wrap items-center justify-between gap-2">
                        <p className="text-sm lg:text-base font-bold text-[#1D2430]">{project.budget}</p>
                        <div className="flex items-center gap-3">
                          {project.status === "Completed" && (
                            <>
                              <ImageIcon />
                              <PDFIcon />
                            </>
                          )}
                          <span className="rounded-xl bg-[#F3F4F6] px-4 py-2 text-[#9098A5] text-xs font-medium">
                            {project.startMeta}
                          </span>
                          <span className={`rounded-xl px-4 py-2 text-xs font-medium ${statusTone[project.status]}`}>
                            {project.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                  {projects.length === 0 && !isInitialLoading ? (
                    <div className="rounded-[22px] border border-[#DCE1E7] bg-white p-6 text-sm text-[#667085]">
                      No assigned projects yet.
                    </div>
                  ) : null}
                </div>
              )}

              {activeTab === "bills_and_payments" && (
                <div className="space-y-6">
                  <div className="rounded-[22px] border border-[#DCE1E7] bg-white p-6">
                    <h2 className="text-lg font-bold text-[#1B2330]">Payment Details</h2>
                    <p className="mt-2 inline-flex items-center gap-2 text-[#5B6472] text-xs">
                      <Info className="h-4 w-4 hidden lg:block" />
                      Having issues updating your payment details send us a message now here projects@fortsolar.ng
                    </p>

                    <p className="mt-4 mb-2 text-[#1B2330] text-sm">
                      {paymentMethods.length === 0
                        ? "You have not set any payment details yet."
                        : "Your payment methods:"}
                    </p>

                    <Button
                      type="button"
                      onClick={() => setIsPaymentModalOpen(true)}
                      className="w-full lg:w-fit mt-4 rounded-xl bg-[#18A11B] px-6 py-5 text-white hover:bg-[#138A16]"
                    >
                      Add Payment Details
                    </Button>
                    {paymentStatus && (
                      <p
                        className={`mt-3 text-sm ${
                          paymentStatus.tone === "error"
                            ? "text-[#D64545]"
                            : paymentStatus.tone === "success"
                              ? "text-[#15803D]"
                              : "text-[#475467]"
                        }`}
                      >
                        {paymentStatus.message}
                      </p>
                    )}

                    <div className="mt-5 flex flex-wrap gap-3">
                      {paymentMethods.map((method) => (
                        <div
                          key={method.id}
                          className="w-full lg:w-fit lg:min-w-80  rounded-xl border border-[#D9DEE5] bg-white p-2 flex items-center justify-between"
                        >
                          <div className="flex items-center gap-3">
                            <div className="rounded-xl bg-[#EFF2F7] p-2">
                              <BankIcon className="h-8 lg:h-10 w-8 lg:w-10" />
                            </div>
                            <div>
                              <p className="text-[#253143] text-sm font-semibold">{method.accountName}</p>
                              <p className="text-[#1C2430] text-sm font-bold">{method.accountNumber}</p>
                              <p className="text-[#4C5563] text-sm">{method.bankName}</p>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => void removePaymentMethod(method.id)}
                            disabled={isPaymentSaving}
                          >
                            <Trash2 className="h-5 w-5 text-[#D64545]" />
                          </button>
                        </div>
                      ))}

                      <button
                        type="button"
                        onClick={() => setIsPaymentModalOpen(true)}
                        className="w-16 h-16 rounded-xl border border-[#D9DEE5] bg-[#F7F8FA] grid place-items-center"
                      >
                        <Plus className="h-10 w-10 text-[#4B5563]" />
                      </button>
                    </div>
                  </div>

                  <div className="rounded-[22px] border border-[#E4E8ED] bg-white p-6">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h3 className="inline-flex items-center gap-1 lg:gap-3 text-lg mb-3 lg:mb-0 font-bold text-[#1B2330]">
                        <HistoryIcon /> Payout History
                      </h3>
                      <div className="relative w-full lg:w-fit">
                        <button
                          type="button"
                          onClick={() => setIsPayoutFilterOpen((prev) => !prev)}
                          className="inline-flex items-center gap-2 rounded-lg border border-[#E5E9EF] bg-white px-4 py-2 text-[#6D7683] w-full lg:w-fit"
                        >
                          <SoonIcon /> {payoutFilter} <ChevronDown className="h-4 w-4" />
                        </button>
                        {isPayoutFilterOpen && (
                          <div className="absolute right-0 top-12 z-20 w-40 rounded-xl border border-[#E5E9EF] bg-white p-1 shadow-sm">
                            {(["All", "Pending", "Approved", "Declined"] as PayoutFilter[]).map((value) => (
                              <button
                                key={value}
                                type="button"
                                onClick={() => {
                                  setPayoutFilter(value);
                                  setIsPayoutFilterOpen(false);
                                }}
                                className={`w-full rounded-lg px-3 py-2 text-left text-sm ${payoutFilter === value ? "bg-[#EBFAEB] text-[#168416]" : "text-[#4B5563]"
                                  }`}
                              >
                                {value}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-4 overflow-x-auto">
                      <table className="w-full min-w-150 text-left">
                        <thead>
                          <tr className="text-[#6D7683] text-base font-medium border-b border-[#E6E9EF]">
                            <th className="py-3">Reference ID</th>
                            <th className="py-3">Amount</th>
                            <th className="py-3">Date</th>
                            <th className="py-3">Status</th>
                            <th className="py-3">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredPayoutHistory.map((row) => (
                            <tr key={row.id} className="text-base text-[#556070] border-b">
                              <td className="py-3">{row.referenceId}</td>
                              <td className="py-3">{row.amount}</td>
                              <td className="py-3">{row.date}</td>
                              <td className="py-3">
                                <span className={`rounded-full px-4 py-1 text-XS font-medium ${payoutTone[row.status]}`}>
                                  {row.status}
                                </span>
                              </td>
                              <td className="py-3">
                                <div className="flex justify-center">
                                  {
                                    row.status === "Pending" && (<SoonIcon className="h-4 w-4" />)
                                  }
                                  {
                                    row.status === "Approved" && (<PrintIcon className="h-5 w-5" />)
                                  }
                                  {
                                    row.status === "Declined" && (<div className="h-5 w-5" />)
                                  }
                                </div>
                              </td>
                            </tr>
                          ))}
                          {filteredPayoutHistory.length === 0 && (
                            <tr>
                              <td colSpan={5} className="py-6 text-center text-sm text-[#7B8593]">
                                No payout records for this filter.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>

      {isPaymentModalOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/30 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-xl font-semibold text-[#1B2330]">Add Payment Method</h3>
            <div className="mt-4 space-y-4">
              <label className="space-y-1 block">
                <span className="text-sm text-[#475467]">Account Name</span>
                <Input
                  value={paymentForm.accountName}
                  onChange={(e) =>
                    setPaymentForm((prev) => ({ ...prev, accountName: e.target.value }))
                  }
                  className="h-11 rounded-xl"
                />
              </label>

              <label className="space-y-1 block">
                <span className="text-sm text-[#475467]">Account Number</span>
                <Input
                  value={paymentForm.accountNumber}
                  onChange={(e) =>
                    setPaymentForm((prev) => ({ ...prev, accountNumber: e.target.value }))
                  }
                  className="h-11 rounded-xl"
                />
              </label>

              <label className="space-y-1 block">
                <span className="text-sm text-[#475467]">Bank Name</span>
                <Input
                  value={paymentForm.bankName}
                  onChange={(e) =>
                    setPaymentForm((prev) => ({ ...prev, bankName: e.target.value }))
                  }
                  className="h-11 rounded-xl"
                />
              </label>
            </div>

            <div className="mt-6 flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsPaymentModalOpen(false)}
                className="rounded-xl"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={() => void addPaymentMethod()}
                disabled={isPaymentSaving}
                className="rounded-xl bg-[#18A11B] hover:bg-[#138A16]"
              >
                {isPaymentSaving ? "Saving..." : "Save Method"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


export default SettingsContent;
