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
            <LocateFixed className="h-4 w-4" /> {activeJob.city}, {activeJob.state}.{" "}
            <span className="text-[#16A34A]">({activeJob.distanceKm}km away)</span>
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
              <Button
                type="button"
                onClick={() => void requestStartJob()}
                disabled={isStarting}
                className="mt-5 w-full rounded-xl bg-[#DDF1DD] px-8 py-2 text-lg font-medium text-[#1B8F1B] hover:bg-[#D3EBD3]"
              >
                {isStarting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Start Job
              </Button>

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
