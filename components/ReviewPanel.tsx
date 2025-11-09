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
    <section className="space-y-4 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">
          5. Review & download completed document
        </h2>
        {placeholders.length > 0 && (
          <span className="text-xs uppercase tracking-wide text-gray-500">
            {missingCount === 0
              ? "Ready to download"
              : `${missingCount} field${missingCount === 1 ? "" : "s"} remaining`}
          </span>
        )}
      </div>

      {placeholders.length === 0 ? (
        <p className="rounded-md border border-dashed border-gray-300 bg-gray-50 p-4 text-sm text-gray-600">
          Once Gemini detects placeholders and you provide answers, you can review and download the
          completed SAFE here.
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
                  className="rounded-md border border-gray-200 bg-white p-4 text-sm text-gray-700"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-gray-900">{field.fieldName}</p>
                      <p className="mt-1 text-xs uppercase tracking-wide text-gray-500">
                        {field.placeholder}
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                        status === "confirmed"
                          ? "bg-gray-900 text-white"
                          : status === "pendingConfirmation"
                          ? "bg-gray-200 text-gray-800"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {status === "confirmed"
                        ? "Confirmed"
                        : status === "pendingConfirmation"
                        ? "Needs confirmation"
                        : "Pending"}
                    </span>
                  </div>
                  <p className="mt-3 rounded-md bg-gray-50 px-3 py-2 text-sm text-gray-700">
                    {value ? (
                      <span className="font-medium text-gray-900">{value}</span>
                    ) : (
                      <span className="italic text-gray-500">
                        Awaiting your answer in the chat above.
                      </span>
                    )}
                  </p>
                  {status === "confirmed" && (
                    <button
                      onClick={() => onJumpToPlaceholder(field.id)}
                      className="mt-2 text-xs font-medium text-gray-900 underline underline-offset-4 hover:no-underline"
                    >
                      Edit this answer
                    </button>
                  )}
                </li>
              );
            })}
          </ul>

          <div className="flex flex-col gap-3 rounded-md border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
            {missingCount > 0 ? (
              <p>
                Confirm the remaining{" "}
                <span className="font-semibold text-gray-900">
                  {missingCount} field{missingCount === 1 ? "" : "s"}
                </span>{" "}
                via the chat so we can generate a complete document.
              </p>
            ) : (
              <p>
                All placeholders are confirmed. Generate a completed SAFE to download.
              </p>
            )}
            <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
              <button
                onClick={onDownload}
                disabled={!canDownload || isGenerating}
                className="inline-flex items-center justify-center rounded-md bg-gray-900 px-5 py-2 text-sm font-semibold text-white transition hover:bg-gray-700 disabled:cursor-not-allowed disabled:bg-gray-300"
              >
                {isGenerating ? "Preparing download..." : "Generate .docx"}
              </button>
              <span className="text-xs text-gray-600">
                Output filename: <span className="font-medium text-gray-900">{downloadFileName}</span>
              </span>
            </div>
            {downloadError && <p className="text-sm text-red-600">{downloadError}</p>}
            {downloadStatus && !downloadError && (
              <p className="text-sm text-green-600">{downloadStatus}</p>
            )}
          </div>
        </>
      )}
    </section>
  );
}


