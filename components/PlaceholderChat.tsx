'use client';

import { useState } from "react";
import type { PlaceholderField } from "@/lib/ai";
import type {
  ChatMessage,
  PlaceholderAnswer,
  PlaceholderStatus,
} from "@/types/placeholders";

type PlaceholderChatProps = {
  placeholder: PlaceholderField | null;
  record: PlaceholderAnswer | undefined;
  onSendMessage: (message: string) => Promise<void>;
  onConfirm: () => void;
  onEdit: () => void;
  isLoading: boolean;
  error: string | null;
  totalCount: number;
  currentIndex: number | null;
  allConfirmed: boolean;
};

export default function PlaceholderChat({
  placeholder,
  record,
  onSendMessage,
  onConfirm,
  onEdit,
  isLoading,
  error,
  totalCount,
  currentIndex,
  allConfirmed,
}: PlaceholderChatProps) {
  const [input, setInput] = useState<string>("");
  const [localError, setLocalError] = useState<string | null>(null);

  const conversation = record?.conversation ?? [];
  const status = record?.status ?? "pending";
  const proposedAnswer = record?.value ?? "";

  let placeholderPrompt = "";
  if (placeholder) {
    const base =
      placeholder.question ??
      `What is the correct value for ${placeholder.fieldName}?`;

    placeholderPrompt =
      currentIndex && totalCount > 0
        ? `Field ${currentIndex} of ${totalCount}: ${base}`
        : base;
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!input.trim()) {
      setLocalError("Please enter a response before sending.");
      return;
    }

    if (!placeholder || isLoading || status === "pendingConfirmation" || allConfirmed) {
      return;
    }

    setLocalError(null);
    const message = input.trim();
    setInput("");
    await onSendMessage(message);
  };

  const handleConfirmClick = () => {
    onConfirm();
  };

  const handleEditClick = () => {
    onEdit();
  };

  const disableInput =
    !placeholder || isLoading || status === "pendingConfirmation" || allConfirmed;

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 sm:p-6">
        {!placeholder ? (
          <p className="text-sm text-slate-500">
            Select a placeholder from the list to begin the conversation.
          </p>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Active placeholder</p>
                <h3 className="text-lg font-semibold text-slate-900">
                  {placeholder.fieldName}
                </h3>
                <p className="text-sm text-slate-500">{placeholderPrompt}</p>
              </div>
              <div className="text-right">
                <p className="text-xs uppercase tracking-wide text-slate-400">
                  {currentIndex && totalCount
                    ? `Field ${currentIndex} of ${totalCount}`
                    : "Placeholder"}
                </p>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              {conversation.length === 0 ? (
                <p className="rounded-lg bg-white px-3 py-2 text-sm text-slate-500 shadow-sm">
                  I’ll walk you through filling this field once you respond.
                </p>
              ) : (
                conversation.map((message, index) => (
                  <div key={`${message.role}-${index}`} className="flex flex-col gap-1">
                    <span
                      className={`text-xs font-semibold uppercase tracking-wide ${
                        message.role === "ai" ? "text-blue-600" : "text-slate-500"
                      }`}
                    >
                      {message.role === "ai" ? "Lexsy Assistant" : "You"}
                    </span>
                    <p className="rounded-lg bg-white/80 px-3 py-2 text-sm text-slate-700 shadow-sm">
                      {message.text}
                    </p>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>

      {status === "pendingConfirmation" && placeholder && (
        <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
          <p className="text-sm text-slate-600">
            I understood that the {placeholder.fieldName.toLowerCase()} should be:
          </p>
          <p className="rounded-lg bg-slate-50 px-3 py-2 text-base font-semibold text-slate-900">
            {proposedAnswer}
          </p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              onClick={handleConfirmClick}
              className="inline-flex items-center justify-center rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500"
            >
              ✓ Yes, looks good
            </button>
            <button
              onClick={handleEditClick}
              className="inline-flex items-center justify-center rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-400 hover:text-slate-700"
            >
              Edit / Try again
            </button>
          </div>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:p-6"
      >
        <input
          type="text"
          value={input}
          onChange={(event) => {
            setInput(event.target.value);
            if (localError) {
              setLocalError(null);
            }
          }}
          placeholder={
            allConfirmed
              ? "All placeholders are confirmed!"
              : status === "pendingConfirmation"
              ? "Confirm the proposed answer above"
              : placeholderPrompt || "Select a placeholder to start"
          }
          disabled={disableInput}
          className="flex-1 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
        />
        <button
          type="submit"
          disabled={disableInput || !input.trim()}
          className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {isLoading ? "Thinking..." : "Send"}
        </button>
      </form>

      {(error || localError) && (
        <p className="text-sm text-red-600">{error ?? localError}</p>
      )}
    </div>
  );
}


