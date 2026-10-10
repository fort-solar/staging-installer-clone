"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

type PaginationControlsProps = {
  page: number;
  totalPages: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  className?: string;
};

export default function PaginationControls({
  page,
  totalPages,
  totalItems,
  onPageChange,
  className,
}: PaginationControlsProps) {
  if (totalItems <= 0) {
    return null;
  }

  const resolvedTotalPages = Math.max(1, totalPages);
  const isPreviousDisabled = page <= 1;
  const isNextDisabled = page >= resolvedTotalPages;

  return (
    <nav
      aria-label="Pagination"
      className={cn(
        "flex flex-col items-center justify-between gap-4 border-t border-[#EAECF0] pt-6 sm:flex-row",
        className,
      )}
    >
      <button
        type="button"
        onClick={() => onPageChange(Math.max(page - 1, 1))}
        disabled={isPreviousDisabled}
        className="inline-flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-xl border border-[#D0D5DD] bg-white px-4 text-sm font-medium text-[#344054] transition hover:border-[#2CB22C] hover:text-[#048A05] disabled:cursor-not-allowed disabled:bg-[#F2F4F7] disabled:text-[#98A2B3] disabled:hover:border-[#D0D5DD] disabled:hover:text-[#98A2B3]"
      >
        <ChevronLeft className="h-4 w-4" />
        Prev
      </button>

      <p className="text-sm text-[#667085]">
        Page <span className="font-semibold text-[#111827]">{page}</span> of{" "}
        <span className="font-semibold text-[#111827]">{resolvedTotalPages}</span>
      </p>

      <button
        type="button"
        onClick={() => onPageChange(Math.min(page + 1, resolvedTotalPages))}
        disabled={isNextDisabled}
        className="inline-flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-xl border border-[#D0D5DD] bg-white px-4 text-sm font-medium text-[#344054] transition hover:border-[#2CB22C] hover:text-[#048A05] disabled:cursor-not-allowed disabled:bg-[#F2F4F7] disabled:text-[#98A2B3] disabled:hover:border-[#D0D5DD] disabled:hover:text-[#98A2B3]"
      >
        Next
        <ChevronRight className="h-4 w-4" />
      </button>
    </nav>
  );
}
