'use client';

import type { PlaceholderField } from "@/lib/ai";
import type { PlaceholderAnswer } from "@/types/placeholders";

type ReviewPanelProps = {
  placeholders: PlaceholderField[];
  answers: Record<string, PlaceholderAnswer>;
  missingCount: number;
  canDownload: boolean;
  downloadFileName: string;
  isGenerating: boolean;
  downloadError: string | null;
  downloadStatus: string | null;
  onDownload: () => void;
  onJumpToPlaceholder: (placeholderId: string) => void;
};

export default function ReviewPanel({
  placeholders,
  answers,
  missingCount,
  canDownload,
  downloadFileName,
  isGenerating,
  downloadError,
  downloadStatus,
  onDownload,
  onJumpToPlaceholder,
}: ReviewPanelProps) {
  return (
    <section className="space-y-5 rounded-lg bg-white p-6 shadow-lg">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold text-slate-900">Review & download</h2>
        <p className="text-sm text-slate-600">
          {placeholders.length === 0
            ? "Upload a document to begin."
            : missingCount === 0
            ? "All placeholders are confirmed. You're ready to export the completed SAFE."
            : `Confirm the remaining ${missingCount} field${missingCount === 1 ? "" : "s"} to unlock download.`}
        </p>
      </div>

      <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
        <button
          onClick={onDownload}
          disabled={!canDownload || isGenerating}
          className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-white disabled:cursor-not-allowed disabled:bg-blue-300"
        >
          {isGenerating ? "Preparing download..." : "Download completed SAFE"}
        </button>
        <span className="text-xs font-medium text-slate-600">
          Output filename: <span className="font-semibold text-slate-900">{downloadFileName}</span>
        </span>
      </div>

      {downloadError && <p className="text-sm text-red-600">{downloadError}</p>}
      {downloadStatus && !downloadError && (
        <p className="text-sm text-green-600">{downloadStatus}</p>
      )}
    </section>
  );
}


