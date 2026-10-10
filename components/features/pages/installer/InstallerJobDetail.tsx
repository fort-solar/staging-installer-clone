"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Bookmark,
  CircleHelp,
  Loader2,
  LocateFixed,
} from "lucide-react";
import { CautionIcon } from "../../icons/CautionIcon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ComboboxField } from "@/components/ui/combobox-field";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  applyToInstallerJob,
  getInstallerJob,
  getInstallerJobState,
  reportInstallerJobIssue,
  saveInstallerJob,
  startInstallerJob,
  unsaveInstallerJob,
  completeInstallerJob,
  uploadInstallerInstallationPhoto,
} from "@/lib/api/installers";
import { useGeneralStore } from "@/store/GeneralStore";
import type { InstallerJobRecord } from "@/types/api.types";

const InstallerJobDetail = ({ jobId }: { jobId: string }) => {
  const markInstallerSyncComplete = useGeneralStore((state) => state.markInstallerSyncComplete);
  const [job, setJob] = useState<InstallerJobRecord | null>(null);
  const [jobState, setJobState] = useState({
    appliedJobIds: [] as string[],
    savedJobIds: [] as string[],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isApplyOpen, setIsApplyOpen] = useState(false);
  const [isIssueOpen, setIsIssueOpen] = useState(false);
  const [proposal, setProposal] = useState("");
  const [proposedBudget, setProposedBudget] = useState("");
  const [issueDescription, setIssueDescription] = useState("");
  const [isApplying, setIsApplying] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [isReportingIssue, setIsReportingIssue] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoType, setPhotoType] = useState<"before" | "during" | "after" | "completion">("before");
  const [photoDescription, setPhotoDescription] = useState("");
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  const loadJobDetails = useCallback(async () => {
    setIsLoading(true);

    try {
      const [jobPayload, statePayload] = await Promise.all([
        getInstallerJob(jobId),
        getInstallerJobState(),
      ]);
      setJob(jobPayload.data);
      setJobState(statePayload.data);
      setError(null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load this job.");
    } finally {
      setIsLoading(false);
    }
  }, [jobId]);

  useEffect(() => {
    if (!jobId) {
      setIsLoading(false);
      setError("Job not found.");
      return;
    }

    void loadJobDetails();
  }, [jobId, loadJobDetails]);

  if (isLoading) {
    return (
      <div className="grid min-h-screen place-items-center bg-white text-sm text-[#667085]">
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading job details...
        </div>
      </div>
    );
  }

  if (!job || error) {
    return (
      <div className="mx-auto mt-24 max-w-6xl px-4">
        <p className="text-[#1F2937]">{error ?? "Job not found."}</p>
      </div>
    );
  }

  const activeJob = job;
  const isApplied = jobState.appliedJobIds.includes(activeJob.id);
  const isSaved = jobState.savedJobIds.includes(activeJob.id);

  async function handleApplyToJob() {
    const normalizedProposal = proposal.trim();
    const normalizedBudget = Number(proposedBudget);

    if (!normalizedProposal) {
      setMessage("A short proposal is required before you apply.");
      return;
    }

    if (!Number.isFinite(normalizedBudget) || normalizedBudget < 0) {
      setMessage("Enter a valid proposed budget.");
      return;
    }

    setIsApplying(true);
    setMessage(null);

    try {
      await applyToInstallerJob(activeJob.id, {
        jobId: activeJob.id,
        proposal: normalizedProposal,
        proposedBudget: normalizedBudget,
      });
      await loadJobDetails();
      markInstallerSyncComplete("jobs");
      setIsApplyOpen(false);
      setProposal("");
      setProposedBudget("");
      setMessage("Your application has been submitted.");
    } catch (applyError) {
      setMessage(
        applyError instanceof Error ? applyError.message : "Unable to submit your application.",
      );
    } finally {
      setIsApplying(false);
    }
  }

  async function toggleSavedJob() {
    setIsSaving(true);
    setMessage(null);

    try {
      if (isSaved) {
        await unsaveInstallerJob(activeJob.id);
        setMessage("Job removed from your saved list.");
      } else {
        await saveInstallerJob(activeJob.id, { jobId: activeJob.id });
        setMessage("Job saved successfully.");
      }

      await loadJobDetails();
      markInstallerSyncComplete("jobs");
    } catch (saveError) {
      setMessage(
        saveError instanceof Error ? saveError.message : "Unable to update your saved jobs.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function requestCompleteJob() {
    setIsCompleting(true);
    setMessage(null);

    try {
      await completeInstallerJob(activeJob.id, { jobId: activeJob.id });
      markInstallerSyncComplete("jobs");
      await loadJobDetails();
      setMessage("Job marked as completed successfully.");
    } catch (completeError) {
      setMessage(
        completeError instanceof Error ? completeError.message : "Unable to complete this job right now.",
      );
    } finally {
      setIsCompleting(false);
    }
  }

  async function handlePhotoUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!photoFile) {
      setMessage("Please select a file to upload.");
      return;
    }
    if (!activeJob.installation_id) {
      setMessage("No active installation linked to this job.");
      return;
    }

    setIsUploadingPhoto(true);
    setMessage(null);

    try {
      const formData = new FormData();
      formData.append("file", photoFile);
      formData.append("photo_type", photoType);
      if (photoDescription.trim()) {
        formData.append("description", photoDescription.trim());
      }

      await uploadInstallerInstallationPhoto(activeJob.installation_id, formData);
      setPhotoFile(null);
      setPhotoDescription("");
      setMessage("Photo uploaded successfully.");
    } catch (uploadError) {
      setMessage(
        uploadError instanceof Error ? uploadError.message : "Unable to upload photo.",
      );
    } finally {
      setIsUploadingPhoto(false);
    }
  }

  async function requestStartJob() {
    setIsStarting(true);
    setMessage(null);

    try {
      await startInstallerJob(activeJob.id, { jobId: activeJob.id });
      markInstallerSyncComplete("jobs");
      setMessage("Job start request submitted.");
    } catch (startError) {
      setMessage(
        startError instanceof Error ? startError.message : "Unable to start this job right now.",
      );
    } finally {
      setIsStarting(false);
    }
  }

  async function submitIssueReport() {
    const normalizedDescription = issueDescription.trim();

    if (!normalizedDescription) {
      setMessage("Describe the issue before submitting it.");
      return;
    }

    setIsReportingIssue(true);
    setMessage(null);

    try {
      await reportInstallerJobIssue(activeJob.id, {
        jobId: activeJob.id,
        description: normalizedDescription,
        metadata: {
          reportedFrom: "installer-portal",
        },
      });
      setIssueDescription("");
      setIsIssueOpen(false);
      setMessage("Issue report sent successfully.");
    } catch (issueError) {
      setMessage(
        issueError instanceof Error ? issueError.message : "Unable to report this issue.",
      );
    } finally {
      setIsReportingIssue(false);
    }
  }

  return (
    <div className="min-h-screen bg-white pb-10 pt-6">
      <div className="mx-auto w-full max-w-330 rounded-[30px] bg-white px-6 py-8 lg:px-8">
        <div className="flex items-center justify-between gap-2">
          <Link
            href="/installer/dashboard"
            className="inline-flex items-center gap-2 rounded-md border border-[#E2E8F0] bg-white px-4 py-2 text-sm font-medium text-[#374151]"
          >
            <ArrowLeft className="h-4 w-4" /> Job Board
          </Link>
        </div>

        <div className="mx-auto mt-4 max-w-2xl text-center">
          <h1 className="text-2xl font-semibold leading-tight text-[#111827] lg:text-4xl">
            {activeJob.title}
          </h1>
          <p className="mt-2 inline-flex items-center gap-1 text-xs text-[#4B5563]">
            <LocateFixed className="h-4 w-4" /> {activeJob.location}
            {activeJob.distanceKm > 0 ? (
              <span className="text-[#16A34A]">({activeJob.distanceKm}km away)</span>
            ) : null}
          </p>

          <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
            {isApplied ? (
              <span className="inline-flex w-full justify-center rounded-xl bg-[#DFF3DF] px-6 py-3 text-base font-semibold text-[#169A2A] lg:w-fit">
                Application Submitted
              </span>
            ) : (
              <Dialog open={isApplyOpen} onOpenChange={setIsApplyOpen}>
                <DialogTrigger asChild>
                  <button
                    type="button"
                    className="w-full rounded-xl bg-[#1FA21B] px-8 py-3 text-base font-medium text-white lg:w-fit"
                  >
                    Apply Now
                  </button>
                </DialogTrigger>
                <DialogContent className="rounded-[24px] border border-[#D6DEE7] p-0 sm:max-w-xl">
                  <DialogHeader className="border-b border-[#E6ECF2] px-6 py-5">
                    <DialogTitle>Apply to this job</DialogTitle>
                    <DialogDescription>
                      Submit a short proposal and your proposed budget for this installation.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 px-6 py-5">
                    <label className="block space-y-2 text-sm font-medium text-[#344054]">
                      <span>Proposal</span>
                      <textarea
                        value={proposal}
                        onChange={(event) => setProposal(event.target.value)}
                        className="min-h-32 w-full rounded-2xl border border-[#D0D5DD] px-4 py-3 outline-none"
                        placeholder="Explain why you are a good fit for this job."
                      />
                    </label>
                    <label className="block space-y-2 text-sm font-medium text-[#344054]">
                      <span>Proposed Budget</span>
                      <Input
                        value={proposedBudget}
                        onChange={(event) => setProposedBudget(event.target.value)}
                        inputMode="decimal"
                        placeholder="0"
                        className="h-12 rounded-2xl border-[#D0D5DD]"
                      />
                    </label>
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsApplyOpen(false)}
                        className="rounded-xl"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="button"
                        onClick={() => void handleApplyToJob()}
                        disabled={isApplying}
                        className="rounded-xl bg-[#1FA21B] text-white hover:bg-[#1A8C18]"
                      >
                        {isApplying ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                        Submit Application
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}
            <button
              type="button"
              onClick={() => void toggleSavedJob()}
              disabled={isSaving}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[#E2E8F0] bg-white px-4 py-3 text-base text-[#4B5563] lg:w-fit"
            >
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bookmark className="h-4 w-4" />}
              {isSaved ? "Saved" : "Save Job"}
            </button>
          </div>
          {message ? <p className="mt-3 text-sm text-[#475467]">{message}</p> : null}
        </div>

        <div className="mt-8 grid grid-cols-1 gap-8 rounded-b-2xl border-x border-b px-3 py-6 lg:grid-cols-[1fr_420px] lg:px-6">
          <div className="order-2 space-y-6 lg:order-1 lg:pr-8">
            <section>
              <h3 className="text-xl font-semibold text-[#171A1F] lg:text-2xl">Job Description</h3>
              <p className="mt-2 text-lg text-[#3E454F]">{activeJob.description}</p>
            </section>

            <section className="rounded-2xl border border-[#D0D5DD] bg-[#F9FAFB] p-6 space-y-4 text-[#1F2937]">
              <h4 className="text-lg font-bold text-[#111827]">System Specifications</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6 text-sm lg:text-base">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider">Inverter Size</p>
                  <p className="font-semibold text-gray-800 mt-1">{activeJob.inverter_size || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider">Panel Size & Count</p>
                  <p className="font-semibold text-gray-800 mt-1">
                    {activeJob.panel_size || "—"} ({activeJob.number_of_panels ?? 0} panels)
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider">Battery Type</p>
                  <p className="font-semibold text-gray-800 mt-1">{activeJob.battery_type || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider">Battery Capacity</p>
                  <p className="font-semibold text-gray-800 mt-1">{activeJob.battery_energy || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider">City</p>
                  <p className="font-semibold text-gray-800 mt-1">{activeJob.city || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider">State & Country</p>
                  <p className="font-semibold text-gray-800 mt-1">
                    {[activeJob.state, activeJob.country].filter(Boolean).join(", ") || "—"}
                  </p>
                </div>
              </div>
            </section>

            {activeJob.customer_name && (
              <section className="rounded-2xl border border-[#D0D5DD] bg-[#EDF7ED] p-6 space-y-4 text-[#1F2937]">
                <h4 className="text-lg font-bold text-[#1B5E20] flex items-center gap-2">
                  <span>✓</span> Customer Contact Details (Approved Installer Only)
                </h4>
                <div className="grid grid-cols-2 gap-6 text-sm lg:text-base">
                  <div>
                    <p className="text-xs text-[#2E7D32] uppercase tracking-wider">Customer Name</p>
                    <p className="font-semibold text-gray-800 mt-1">{activeJob.customer_name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#2E7D32] uppercase tracking-wider">Customer Phone</p>
                    <p className="font-semibold text-gray-800 mt-1">{activeJob.customer_phone || "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#2E7D32] uppercase tracking-wider">Customer Email</p>
                    <p className="font-semibold text-gray-800 mt-1">{activeJob.customer_email || "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#2E7D32] uppercase tracking-wider">Installation Address</p>
                    <p className="font-semibold text-gray-800 mt-1">{activeJob.customer_address || "—"}</p>
                  </div>
                </div>
              </section>
            )}

            <section>
              <h3 className="text-xl font-semibold text-[#171A1F] lg:text-2xl">Scope of Work</h3>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-lg text-[#3E454F]">
                {activeJob.scope.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-[#171A1F] lg:text-2xl">Requirements</h3>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-lg text-[#3E454F]">
                {activeJob.requirements.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-[#171A1F] lg:text-2xl">
                Installation Components
              </h3>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-lg text-[#3E454F]">
                {activeJob.components.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-[#171A1F] lg:text-2xl">Site Conditions</h3>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-lg text-[#3E454F]">
                {activeJob.siteConditions.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>

            <div className="rounded-xl border border-[#F2BE6A] bg-[#FFF8EF] p-4 text-sm font-medium text-[#424A57] lg:text-lg">
              <p className="inline-flex items-start gap-2">
                <CautionIcon className="mt-1" />
                Always verify site conditions before starting work. Report any discrepancies to
                FortSolar Support immediately.
              </p>
            </div>
          </div>

          <aside className="order-1 space-y-4 lg:order-2">
            <div className="rounded-2xl border border-[#B8C0CC] bg-[#F9FAFB] p-4">
              <p className="mb-4 inline-flex w-fit justify-start rounded-lg bg-[#DFF3DF] px-4 py-2 text-sm font-medium text-[#169A2A] lg:text-base">
                Job Summary
              </p>

              <h3 className="text-xl font-semibold text-[#171A1F] lg:text-2xl">Job Summary</h3>
              <div className="mt-3 space-y-2 text-sm lg:text-base">
                <p className="text-[#9BA2AE]">Budget</p>
                <p className="text-lg font-semibold text-[#111827] lg:text-xl">{activeJob.budgetLabel}</p>
                <p className="text-[#9BA2AE]">Job Type</p>
                <p className="text-lg font-semibold text-[#111827] lg:text-xl">{activeJob.jobType}</p>
                <p className="text-[#9BA2AE]">System Size</p>
                <p className="text-lg font-semibold text-[#111827] lg:text-xl">{activeJob.systemSize}</p>
                <p className="text-[#9BA2AE]">Est. Duration</p>
                <p className="text-lg font-semibold text-[#111827] lg:text-xl">{activeJob.duration}</p>
                <p className="text-[#9BA2AE]">Start Date</p>
                <p className="text-lg font-semibold text-[#111827] lg:text-xl">{activeJob.startDateLabel}</p>
              </div>
            </div>

            <div className="rounded-2xl border border-[#C7D1DB] bg-[#F9FBFA] p-4">
              <p className="text-sm font-semibold text-[#1F2937]">Assignment Actions</p>
              <p className="mt-1 text-xs text-[#6B7280]">
                Start the job when it has been assigned to you, or report issues directly to the
                operations team.
              </p>
              
              {isApplied && (activeJob.status === "assigned" || activeJob.status === "open") ? (
                <Button
                  type="button"
                  onClick={() => void requestStartJob()}
                  disabled={isStarting}
                  className="mt-5 w-full rounded-xl bg-[#DDF1DD] px-8 py-2 text-lg font-medium text-[#1B8F1B] hover:bg-[#D3EBD3]"
                >
                  {isStarting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Start Job
                </Button>
              ) : activeJob.status === "in-progress" || activeJob.status === "in_progress" ? (
                <>
                  <Button
                    type="button"
                    onClick={() => void requestCompleteJob()}
                    disabled={isCompleting}
                    className="mt-5 w-full rounded-xl bg-[#048A05] hover:bg-[#036B04] px-8 py-2 text-lg font-medium text-white"
                  >
                    {isCompleting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    Complete Installation
                  </Button>

                  <form onSubmit={handlePhotoUpload} className="mt-6 border-t border-gray-200 pt-4 space-y-4 text-left">
                    <p className="text-sm font-semibold text-[#1F2937]">Upload Proof of Work</p>
                    <label className="block space-y-1 text-xs font-medium text-[#344054]">
                      <span>Photo Stage Category</span>
                      <ComboboxField
                        value={photoType}
                        onValueChange={(value) => setPhotoType(value as typeof photoType)}
                        options={[{ value: "before", label: "Before Work Photo" }, { value: "during", label: "During Work Photo" }, { value: "after", label: "After Work Photo" }, { value: "completion", label: "Completion Photo" }]}
                        className="w-full h-9 rounded-lg border border-[#D0D5DD] px-2 text-xs outline-none"
                      />
                    </label>

                    <label className="block space-y-1 text-xs font-medium text-[#344054]">
                      <span>Choose Image</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setPhotoFile(e.target.files?.[0] ?? null)}
                        className="w-full text-xs text-gray-500 file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
                      />
                    </label>

                    <label className="block space-y-1 text-xs font-medium text-[#344054]">
                      <span>Short Description</span>
                      <Input
                        value={photoDescription}
                        onChange={(e) => setPhotoDescription(e.target.value)}
                        placeholder="e.g. Inverter mounted on wall"
                        className="h-8 rounded-lg text-xs"
                      />
                    </label>

                    <Button
                      type="submit"
                      disabled={isUploadingPhoto || !photoFile}
                      className="w-full text-xs bg-gray-900 text-white hover:bg-black rounded-lg py-1.5"
                    >
                      {isUploadingPhoto ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
                      Upload Photo
                    </Button>
                  </form>
                </>
              ) : activeJob.status === "completed" ? (
                <div className="mt-5 p-3 rounded-lg bg-green-50 border border-green-200 text-xs text-[#027A48] font-medium text-center">
                  Job Completed. Waiting for customer approval.
                </div>
              ) : (
                <div className="mt-5 p-3 rounded-lg bg-gray-50 border border-gray-200 text-xs text-gray-500 font-medium text-center">
                  Status: {activeJob.status}
                </div>
              )}

              <Dialog open={isIssueOpen} onOpenChange={setIsIssueOpen}>
                <DialogTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className="mt-3 w-full rounded-xl border-[#D0D5DD]"
                  >
                    Report an Issue
                  </Button>
                </DialogTrigger>
                <DialogContent className="rounded-[24px] border border-[#D6DEE7] p-0 sm:max-w-xl">
                  <DialogHeader className="border-b border-[#E6ECF2] px-6 py-5">
                    <DialogTitle>Report a job issue</DialogTitle>
                    <DialogDescription>
                      Describe the problem clearly so the operations team can act quickly.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 px-6 py-5">
                    <textarea
                      value={issueDescription}
                      onChange={(event) => setIssueDescription(event.target.value)}
                      className="min-h-32 w-full rounded-2xl border border-[#D0D5DD] px-4 py-3 outline-none"
                      placeholder="What happened on site?"
                    />
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsIssueOpen(false)}
                        className="rounded-xl"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="button"
                        onClick={() => void submitIssueReport()}
                        disabled={isReportingIssue}
                        className="rounded-xl bg-[#1F2937] text-white hover:bg-[#111827]"
                      >
                        {isReportingIssue ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                        Submit Issue
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
              <p className="mt-2 flex items-center justify-center gap-1 text-[10px] text-[#667085]">
                <CircleHelp className="h-3 w-3" />
                You can only move an accepted job into progress.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export { InstallerJobDetail };
