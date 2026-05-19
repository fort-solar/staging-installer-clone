"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Bookmark, LocateFixed, MoreVertical, CircleHelp } from "lucide-react";
import {
  queuePendingInstallerSubmission,
  sessionSnapshotToMockSession,
} from "@/lib/localAuth";
import { installerJobs } from "@/lib/installerJobs";
import { getInstallerJobState, saveInstallerJobState } from "@/lib/installerStorage";
import { CautionIcon } from "../../icons/CautionIcon";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useAuth } from "@/components/auth/auth-provider";
import { useGeneralStore } from "@/store/GeneralStore";

const InstallerJobDetail = ({ jobId }: { jobId: string }) => {
  const { session: authSession } = useAuth();
  const markInstallerSyncPending = useGeneralStore((state) => state.markInstallerSyncPending);
  const session = useMemo(() => sessionSnapshotToMockSession(authSession), [authSession]);
  const [query, setQuery] = useState(() =>
    session && session.role === "installer"
      ? getInstallerJobState(session)
      : { appliedJobIds: [] as string[], savedJobIds: [] as string[] }
  );
  const [jobActionMessage, setJobActionMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!session || session.role !== "installer") return;
    saveInstallerJobState(session, query);
  }, [query, session]);

  const job = useMemo(() => installerJobs.find((item) => item.id === jobId), [jobId]);
  if (!job) {
    return (
      <div className="mx-auto mt-24 max-w-6xl px-4">
        <p className="text-[#1F2937]">Job not found.</p>
      </div>
    );
  }

  const isApplied = query.appliedJobIds.includes(job.id);
  const isSaved = query.savedJobIds.includes(job.id);

  const applyToJob = () => {
    if (isApplied) {
      return;
    }

    setQuery((prev) => ({
      ...prev,
      appliedJobIds: [...prev.appliedJobIds, job.id],
    }));
    markInstallerSyncPending("jobs");
    queuePendingInstallerSubmission(
      "installer_job_apply",
      `/api/v1/installers/jobs/${job.id}/apply`,
      "POST",
      { jobId: job.id },
      "Installer job application endpoint has not been supplied yet. The application was captured for later API hookup.",
    );
    setJobActionMessage("Application saved locally and queued until the installer jobs endpoint is ready.");
  };

  const toggleSavedJob = () => {
    setQuery((prev) => ({
      ...prev,
      savedJobIds: prev.savedJobIds.includes(job.id)
        ? prev.savedJobIds.filter((id) => id !== job.id)
        : [...prev.savedJobIds, job.id],
    }));
    markInstallerSyncPending("jobs");
    queuePendingInstallerSubmission(
      isSaved ? "installer_job_unsave" : "installer_job_save",
      `/api/v1/installers/jobs/${job.id}/saved`,
      isSaved ? "DELETE" : "POST",
      { jobId: job.id },
      "Installer saved-job endpoint has not been supplied yet. The action was captured for later API hookup.",
    );
    setJobActionMessage(
      isSaved
        ? "Saved-job removal was queued until the installer jobs endpoint is ready."
        : "Saved-job action was queued until the installer jobs endpoint is ready.",
    );
  };

  const requestStartJob = () => {
    markInstallerSyncPending("jobs");
    queuePendingInstallerSubmission(
      "installer_job_start",
      `/api/v1/installers/jobs/${job.id}/start`,
      "POST",
      { jobId: job.id },
      "Installer job start endpoint has not been supplied yet. The action was captured for later API hookup.",
    );
    setJobActionMessage("Start-job request queued until the installer jobs endpoint is available.");
  };

  const reportJobIssue = () => {
    markInstallerSyncPending("jobs");
    queuePendingInstallerSubmission(
      "installer_job_report_issue",
      `/api/v1/installers/jobs/${job.id}/issues`,
      "POST",
      { jobId: job.id },
      "Installer issue-report endpoint has not been supplied yet. The action was captured for later API hookup.",
    );
    setJobActionMessage("Issue report captured locally and queued until the installer jobs endpoint is available.");
  };

  return (
    <div className="min-h-screen bg-white pb-10 pt-6">
      <div className="mx-auto w-full max-w-330 rounded-[30px]  bg-white px-6 py-8 lg:px-8">
        <div className="flex items-center justify-between gap-2">
          <Link
            href="/installer/dashboard"
            className="inline-flex items-center gap-2 rounded-md border border-[#E2E8F0] bg-white px-4 py-2 text-sm font-medium text-[#374151]"
          >
            <ArrowLeft className="h-4 w-4" /> Job Board
          </Link>
        </div>

        <div className="mx-auto mt-4 max-w-2xl text-center">
          <h1 className="text-2xl lg:text-4xl font-semibold leading-tight text-[#111827]">{job.title}</h1>
          <p className="mt-2 inline-flex items-center gap-1 text-xs text-[#4B5563]">
            <LocateFixed className="h-4 w-4" /> {job.city} {job.state}.{" "}
            <span className="text-[#16A34A]">({job.distanceKm}km away)</span>
          </p>

          <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
            {isApplied ? (
              <span className="inline-flex justify-center rounded-xl bg-[#DFF3DF] px-6 py-3 text-base font-semibold text-[#169A2A] w-full lg:w-fit">
                Job Assigned
              </span>
            ) : (
              <>
                <button
                  type="button"
                  onClick={applyToJob}
                  className="rounded-xl bg-[#1FA21B] px-8 py-3 text-base font-medium text-white w-full lg:w-fit"
                >
                  Apply Now
                </button>
                <button
                  type="button"
                  onClick={toggleSavedJob}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#E2E8F0] bg-white px-4 py-3 text-base text-[#4B5563] w-full lg:w-fit"
                >
                  <Bookmark className="h-4 w-4" /> {isSaved ? "Saved" : "Save Job"}
                </button>
              </>
            )}
          </div>
          {jobActionMessage && (
            <p className="mt-3 text-sm text-[#475467]">{jobActionMessage}</p>
          )}
        </div>

        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_420px] border-l border-r border-b px-3 lg:px-6 py-6 rounded-b-2xl">
          <div className="space-y-6 lg:pr-8 order-2 lg:order-1">
            <section>
              <h3 className="text-xl lg:text-2xl font-semibold text-[#171A1F]">Job Description</h3>
              <p className="mt-2 text-lg text-[#3E454F]">{job.description}</p>
            </section>

            <section>
              <h3 className="text-xl lg:text-2xl font-semibold text-[#171A1F]">Scope of Work</h3>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-lg text-[#3E454F]">
                {job.scope.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>

            <section>
              <h3 className="text-xl lg:text-2xl font-semibold text-[#171A1F]">Requirements</h3>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-lg text-[#3E454F]">
                {job.requirements.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>

            <section>
              <h3 className="text-xl lg:text-2xl font-semibold text-[#171A1F]">Installation Components</h3>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-lg text-[#3E454F]">
                {job.components.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>

            <section>
              <h3 className="text-xl lg:text-2xl font-semibold text-[#171A1F]">Site Conditions</h3>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-lg text-[#3E454F]">
                {job.siteConditions.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>

            {!isApplied && (
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={applyToJob}
                  className="rounded-xl bg-[#1FA21B] px-8 py-3 text-base font-medium text-white w-full lg:w-fit"
                >
                  Apply Now
                </button>
                <button
                  type="button"
                  onClick={toggleSavedJob}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#E2E8F0] bg-white px-4 py-3 text-base text-[#4B5563] w-full lg:w-fit"
                >
                  <Bookmark className="h-4 w-4" /> {isSaved ? "Saved" : "Save Job"}
                </button>
              </div>
            )}

            <div className="rounded-xl border border-[#F2BE6A] bg-[#FFF8EF] p-4 text-sm lg:text-lg font-medium text-[#424A57]">
              <p className="inline-flex items-start gap-2">
                <CautionIcon className="mt-1" />
                Always verify site conditions before starting work. Report any discrepancies
                to FortSolar Support immediately.
              </p>
            </div>
          </div>

          <aside className="space-y-4 order-1 lg:order-2">
            {isApplied && (
              <div className="rounded-2xl border border-[#C7D1DB] bg-[#F9FBFA] p-4">
                <div className="flex items-start justify-between">
                  <p className="inline-flex rounded-lg bg-[#FFF0CA] px-4 py-2 text-sm font-semibold text-[#C08A00]">
                    Scheduled
                  </p>
                  <MoreVertical className="h-4 w-4 text-[#6B7280]" />
                </div>

                <p className="mt-3 text-sm font-semibold text-[#1F2937]">
                  Scheduled <span className="ml-1 text-xs text-[#6B7280]">April 9th, 2025</span>
                </p>
                <p className="text-xs text-[#6B7280]">
                  Job will start when you update the status to in progress.
                </p>

                <div className="mt-4 text-sm">
                  <div className="border-l border-[#058A05] pl-4 pb-2">
                    <div className="relative">
                      <RadioGroup defaultValue="option-one">
                        <RadioGroupItem value="option-one" id="option-one" className="absolute -left-6 top-0 h-4 w-4 border-2 border-[#058A05] bg-white outline-[#058A05]" />
                      </RadioGroup>
                      <p className="tracking-[-0.01em] font-medium text-[#16A34A]">Job Assigned to Me</p>
                      <p className="text-xs leading-5 text-[#8C8C8C]">Apr 9, 2023 - 10:23am</p>
                    </div>
                  </div>
                  <div className="border-l border-[#058A05] pl-4 pb-2">
                    <div className="relative">
                      <RadioGroup defaultValue="option-one">
                        <RadioGroupItem value="option-one" id="option-one" className="absolute -left-6 top-0 h-4 w-4 border-2 border-[#058A05] bg-white outline-[#058A05]" />
                      </RadioGroup>
                      <p className="tracking-[-0.01em] font-medium text-[#16A34A]">Scheduled</p>
                      <p className="text-xs leading-5 text-[#8C8C8C]">Nov 10, 2023</p>
                    </div>
                  </div>
                  <div className="border-l border-[#D1D1D1 pl-4 pb-2">
                    <div className="relative">
                      <span className="absolute -left-6 top-0 h-4 w-4 rounded-full border-2 border-[#3B3B3BB2] bg-white" />
                      <p className="tracking-[-0.01em] font-medium text-[#50555C]">In Progres</p>
                      <p className="text-xs leading-5 text-[#8C8C8C]">Nov 10, 2023</p>
                    </div>
                  </div>
                  <div className="border-l border-[#D1D1D1 pl-4 pb-2">
                    <div className="relative">
                      <span className="absolute -left-6 top-0 h-4 w-4 rounded-full border-2 border-[#D9D9D9] bg-white" />
                      <p className="tracking-[-0.01em] font-medium text-[#D1D1D1]">Checklist</p>
                      <p className="text-xs leading-5 text-[#D1D1D1]">Checklist & Proof Uploaded</p>
                    </div>
                  </div>
                  <div className="border-l border-[#D1D1D1 pl-4 pb-2">
                    <div className="relative">
                      <span className="absolute -left-6 top-0 h-4 w-4 rounded-full border-2 border-[#D9D9D9] bg-white" />
                      <p className="tracking-[-0.01em] font-medium text-[#D1D1D1]">Completed</p>
                      <p className="text-xs leading-5 text-[#D1D1D1]">Job Verified</p>
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={requestStartJob}
                  className="mt-5 w-full rounded-xl bg-[#DDF1DD] px-8 py-2 text-lg font-medium text-[#1B8F1B]"
                >
                  Start Job
                </button>
                <p className="text-[7px] flex gap-1 items-center justify-center mt-2"><CircleHelp className="w-2 h-2"/>Click on start job when youre ready to start working and update the status to in proress</p>
              </div>
            )}

            <div className="rounded-2xl border border-[#B8C0CC] bg-[#F9FAFB] p-4">
              <p className="mb-4 inline-flex w-fit justify-start rounded-lg bg-[#DFF3DF] px-4 py-2 text-sm lg:text-base font-medium text-[#169A2A]">
                {isApplied ? "Job Assigned" : "Job Summary"}
              </p>

              <h3 className="text-xl lg:text-2xl font-semibold text-[#171A1F]">Job Summary</h3>
              <div className="mt-3 space-y-2 text-sm lg:text-base">
                <p className="text-[#9BA2AE]">Budget</p>
                <p className="font-semibold text-[#111827] text-lg lg:text-xl">{job.budgetLabel}</p>
                <p className="text-[#9BA2AE]">Job Type</p>
                <p className="font-semibold text-[#111827] text-lg lg:text-xl">{job.jobType}</p>
                <p className="text-[#9BA2AE]">System Size</p>
                <p className="font-semibold text-[#111827] text-lg lg:text-xl">{job.systemSize}</p>
                <p className="text-[#9BA2AE]">Est. Duration</p>
                <p className="font-semibold text-[#111827] text-lg lg:text-xl">{job.duration}</p>
                <p className="text-[#9BA2AE]">Start Date</p>
                <p className="font-semibold text-[#111827] text-lg lg:text-xl">{job.startDateLabel}</p>
              </div>

              {isApplied ? (
                <button
                  type="button"
                  onClick={reportJobIssue}
                  className="mt-4 w-full rounded-xl bg-[#FCE5E5] px-8 py-2 text-lg font-medium text-[#EF4444]"
                >
                  Report Issue
                </button>
              ) : (
                <div className="mt-4 flex items-center gap-4">
                  <button
                    type="button"
                    onClick={applyToJob}
                    className="flex-1 rounded-xl bg-[#1FA21B] px-8 py-2 text-lg font-medium text-white"
                  >
                    Apply Now
                  </button>
                  <button
                    type="button"
                    onClick={toggleSavedJob}
                    className="rounded-xl border border-[#D1D5DB] p-3"
                  >
                    <Bookmark className="h-4 w-4 text-[#4B5563]" />
                  </button>
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export { InstallerJobDetail };
