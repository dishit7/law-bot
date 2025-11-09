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
    <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">
          5. Review & download completed document
        </h2>
        {placeholders.length > 0 && (
          <span className="text-xs uppercase tracking-wide text-slate-400">
            {missingCount === 0
              ? "Ready to download"
              : `${missingCount} field${missingCount === 1 ? "" : "s"} remaining`}
          </span>
        )}
      </div>

      {placeholders.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
          Once Gemini detects placeholders and you provide answers, you can review and
          download the completed SAFE here.
        </p>
      ) : (
        <>
          <ul className="space-y-3">
            {placeholders.map((field) => {
              const record = answers[field.id];
              const status = record?.status ?? "pending";
              const value = record?.value ?? "";

              return (
                <li
                  key={`review-${field.id}`}
                  className="rounded-xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-700"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-slate-900">{field.fieldName}</p>
                      <p className="mt-1 text-xs uppercase tracking-wide text-slate-400">
                        {field.placeholder}
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                        status === "confirmed"
                          ? "bg-emerald-100 text-emerald-700"
                          : status === "pendingConfirmation"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {status === "confirmed"
                        ? "Confirmed"
                        : status === "pendingConfirmation"
                        ? "Needs confirmation"
                        : "Pending"}
                    </span>
                  </div>
                  <p className="mt-3 rounded-lg bg-white px-3 py-2 text-sm text-slate-700 shadow-sm">
                    {value ? (
                      <span className="font-medium text-slate-900">{value}</span>
                    ) : (
                      <span className="italic text-slate-500">
                        Awaiting your answer in the chat above.
                      </span>
                    )}
                  </p>
                  {status === "confirmed" && (
                    <button
                      onClick={() => onJumpToPlaceholder(field.id)}
                      className="mt-2 text-xs font-medium text-blue-600 hover:text-blue-500"
                    >
                      Edit this answer
                    </button>
                  )}
                </li>
              );
            })}
          </ul>

          <div className="flex flex-col gap-3 rounded-xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-600">
            {missingCount > 0 ? (
              <p>
                Confirm the remaining{" "}
                <span className="font-semibold text-slate-800">
                  {missingCount} field{missingCount === 1 ? "" : "s"}
                </span>{" "}
                via the chat so we can generate a complete document.
              </p>
            ) : (
              <p className="text-slate-600">
                All placeholders are confirmed. Generate a completed SAFE to download.
              </p>
            )}
            <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
              <button
                onClick={onDownload}
                disabled={!canDownload || isGenerating}
                className="inline-flex items-center justify-center rounded-md bg-blue-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {isGenerating ? "Preparing download..." : "Generate .docx"}
              </button>
              <span className="text-xs text-slate-500">
                Output filename: <span className="font-medium">{downloadFileName}</span>
              </span>
            </div>
            {downloadError && <p className="text-sm text-red-600">{downloadError}</p>}
            {downloadStatus && !downloadError && (
              <p className="text-sm text-emerald-600">{downloadStatus}</p>
            )}
          </div>
        </>
      )}
    </section>
  );
}


