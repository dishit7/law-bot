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
  const progress =
    placeholders.length === 0
      ? 0
      : Math.round((answeredCount / placeholders.length) * 100);

  return (
    <section className="space-y-6 rounded-lg bg-white p-6 shadow-lg">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">3. Detected placeholders</h2>
        <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
          {placeholders.length} field{placeholders.length === 1 ? "" : "s"}
        </span>
      </div>
      <div className="space-y-4">
        {placeholders.length === 0 ? (
          <p className="rounded-lg bg-slate-100 px-4 py-3 text-sm text-slate-600">
            Gemini will list placeholders here after analysis.
          </p>
        ) : (
          <>
            <div className="rounded-lg bg-slate-50 p-4">
              <div className="flex items-center justify-between text-xs font-medium uppercase tracking-wide text-slate-600">
                <span>Progress</span>
                <span>
                  {answeredCount}/{placeholders.length} confirmed
                </span>
              </div>
              <div className="mt-3 h-1.5 w-full rounded-full bg-slate-200">
                <div
                  className="h-1.5 rounded-full bg-blue-600 transition-all"
                  style={{ width: `${progress}%` }}
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

                const badgeClasses =
                  status === "confirmed"
                    ? "bg-green-100 text-green-800"
                    : status === "pendingConfirmation"
                    ? "bg-blue-100 text-blue-800"
                    : "bg-slate-100 text-slate-800";

                return (
                  <li
                    key={field.id}
                    className={`rounded-lg bg-white p-5 text-sm text-slate-700 shadow-sm ring-1 ring-transparent transition hover:shadow-md ${
                      isActive ? "ring-2 ring-blue-500" : ""
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-1">
                        <p className="text-base font-semibold text-slate-900">{field.fieldName}</p>
                        <p className="text-sm text-slate-500">
                          Placeholder: <span className="font-medium text-slate-700">{field.placeholder}</span>
                        </p>
                        {field.question && (
                          <p className="text-sm text-slate-500">
                            Question: <span className="text-slate-600">{field.question}</span>
                          </p>
                        )}
                        {field.example && (
                          <p className="text-sm text-slate-500">
                            Example: <span className="text-slate-600">{field.example}</span>
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${badgeClasses}`}
                        >
                          {statusLabel}
                        </span>
                        <button
                          onClick={() => onJumpToPlaceholder(field.id)}
                          className={`text-xs font-medium ${
                            isActive ? "text-blue-600" : "text-slate-600"
                          } underline underline-offset-4 hover:text-blue-700 hover:no-underline`}
                        >
                          {isActive ? "Active" : "Open"}
                        </button>
                      </div>
                    </div>
                    <p className="mt-4 rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-700">
                      {record?.value ? (
                        <span className="font-medium text-slate-900">{record.value}</span>
                      ) : (
                        <span className="italic text-slate-500">
                          Waiting for a confirmed answer.
                        </span>
                      )}
                    </p>
                    {record?.status === "confirmed" && (
                      <button
                        onClick={() => onJumpToPlaceholder(field.id)}
                        className="mt-3 text-xs font-medium text-blue-600 underline underline-offset-4 hover:text-blue-700 hover:no-underline"
                      >
                        Edit this answer
                      </button>
                    )}
                    <p className="mt-2 text-xs font-medium text-slate-400">
                      Field {index + 1} of {placeholders.length}
                    </p>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </div>
    </section>
  );
}


