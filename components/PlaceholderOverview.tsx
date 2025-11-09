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
    <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">
          3. Detected placeholders
        </h2>
        <span className="text-xs uppercase tracking-wide text-slate-400">
          {placeholders.length} field{placeholders.length === 1 ? "" : "s"}
        </span>
      </div>
      <div className="space-y-3">
        {placeholders.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
            Gemini will list placeholders here after analysis.
          </p>
        ) : (
          <div className="space-y-4">
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
              <div className="flex items-center justify-between text-xs uppercase tracking-wide text-slate-500">
                <span>Progress</span>
                <span>
                  {answeredCount}/{placeholders.length} confirmed
                </span>
              </div>
              <div className="mt-2 h-2 rounded-full bg-slate-200">
                <div
                  className="h-2 rounded-full bg-blue-500 transition-all"
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
                    className={`rounded-xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-700 transition ${
                      isActive ? "ring-2 ring-blue-400" : ""
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <p className="font-semibold text-slate-900">{field.fieldName}</p>
                        <p className="mt-1 text-slate-600">Placeholder: {field.placeholder}</p>
                        {field.question && (
                          <p className="mt-1 text-slate-500">Question: {field.question}</p>
                        )}
                        {field.example && (
                          <p className="mt-1 text-slate-500">Example: {field.example}</p>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                            status === "confirmed"
                              ? "bg-emerald-100 text-emerald-700"
                              : status === "pendingConfirmation"
                              ? "bg-amber-100 text-amber-700"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {statusLabel}
                        </span>
                        <button
                          onClick={() => onJumpToPlaceholder(field.id)}
                          className="text-xs font-medium text-blue-600 hover:text-blue-500"
                        >
                          {isActive ? "Active" : "Open"}
                        </button>
                      </div>
                    </div>
                    <p className="mt-3 rounded-lg bg-white px-3 py-2 text-sm text-slate-700 shadow-sm">
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
                        className="mt-2 text-xs font-medium text-blue-600 hover:text-blue-500"
                      >
                        Edit this answer
                      </button>
                    )}
                    <p className="mt-1 text-xs text-slate-400">
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


