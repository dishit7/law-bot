'use client';

import type { PlaceholderField } from "@/lib/ai";
import type { PlaceholderAnswer } from "@/types/placeholders";

type PlaceholderOverviewProps = {
  placeholders: PlaceholderField[];
  answers: Record<string, PlaceholderAnswer>;
  activePlaceholderId: string | null;
  answeredCount: number;
  onJumpToPlaceholder: (placeholderId: string) => void;
};

export default function PlaceholderOverview({
  placeholders,
  answers,
  activePlaceholderId,
  answeredCount,
  onJumpToPlaceholder,
}: PlaceholderOverviewProps) {
  return (
    <section className="space-y-3 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">3. Detected placeholders</h2>
        <span className="text-xs uppercase tracking-wide text-gray-500">
          {placeholders.length} field{placeholders.length === 1 ? "" : "s"}
        </span>
      </div>
      <div className="space-y-3">
        {placeholders.length === 0 ? (
          <p className="rounded-md border border-dashed border-gray-300 bg-gray-50 p-4 text-sm text-gray-600">
            Gemini will list placeholders here after analysis.
          </p>
        ) : (
          <div className="space-y-4">
            <div className="rounded-md border border-gray-200 bg-gray-50 p-4">
              <div className="flex items-center justify-between text-xs uppercase tracking-wide text-gray-600">
                <span>Progress</span>
                <span>
                  {answeredCount}/{placeholders.length} confirmed
                </span>
              </div>
              <div className="mt-2 h-2 rounded-full bg-gray-200">
                <div
                  className="h-2 rounded-full bg-gray-900"
                  style={{
                    width:
                      placeholders.length === 0
                        ? "0%"
                        : `${Math.round((answeredCount / placeholders.length) * 100)}%`,
                  }}
                />
              </div>
            </div>
            <ul className="space-y-3">
              {placeholders.map((field, index) => {
                const record = answers[field.id];
                const isActive = field.id === activePlaceholderId;
                const status = record?.status ?? "pending";
                const statusLabel =
                  status === "confirmed"
                    ? "Confirmed"
                    : status === "pendingConfirmation"
                    ? "Needs confirmation"
                    : "Pending";

                return (
                  <li
                    key={field.id}
                    className={`rounded-md border border-gray-200 bg-white p-4 text-sm text-gray-700 transition ${
                      isActive ? "ring-1 ring-gray-900" : ""
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">{field.fieldName}</p>
                        <p className="mt-1 text-gray-600">Placeholder: {field.placeholder}</p>
                        {field.question && (
                          <p className="mt-1 text-gray-500">Question: {field.question}</p>
                        )}
                        {field.example && (
                          <p className="mt-1 text-gray-500">Example: {field.example}</p>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                            status === "confirmed"
                              ? "bg-gray-900 text-white"
                              : status === "pendingConfirmation"
                              ? "bg-gray-200 text-gray-800"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {statusLabel}
                        </span>
                        <button
                          onClick={() => onJumpToPlaceholder(field.id)}
                          className="text-xs font-medium text-gray-900 underline underline-offset-4 hover:no-underline"
                        >
                          {isActive ? "Active" : "Open"}
                        </button>
                      </div>
                    </div>
                    <p className="mt-3 rounded-md bg-gray-50 px-3 py-2 text-sm text-gray-700">
                      {record?.value ? (
                        <span className="font-medium text-gray-900">{record.value}</span>
                      ) : (
                        <span className="italic text-gray-500">
                          Waiting for a confirmed answer.
                        </span>
                      )}
                    </p>
                    {record?.status === "confirmed" && (
                      <button
                        onClick={() => onJumpToPlaceholder(field.id)}
                        className="mt-2 text-xs font-medium text-gray-900 underline underline-offset-4 hover:no-underline"
                      >
                        Edit this answer
                      </button>
                    )}
                    <p className="mt-1 text-xs text-gray-500">
                      Field {index + 1} of {placeholders.length}
                    </p>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}


