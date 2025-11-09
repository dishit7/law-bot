'use client';

import { useState } from "react";
import type { PlaceholderField } from "@/lib/ai";
import type {
  ChatMessage,
  PlaceholderAnswer,
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
    <div className="space-y-5">
      <div className="rounded-lg bg-white p-6 shadow-lg">
        {!placeholder ? (
          <p className="text-sm text-slate-500">
            Select a placeholder from the list to begin the conversation.
          </p>
        ) : (
          <>
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <p className="text-xs font-medium uppercase tracking-wide text-blue-600">
                  Active placeholder
                </p>
                <h3 className="text-xl font-semibold text-slate-900">{placeholder.fieldName}</h3>
                <p className="text-sm text-slate-600">{placeholderPrompt}</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  {currentIndex && totalCount
                    ? `Field ${currentIndex} of ${totalCount}`
                    : "Placeholder"}
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              {conversation.length === 0 ? (
                <p className="rounded-lg bg-slate-100 px-4 py-3 text-sm text-slate-600">
                  I’ll walk you through filling this field once you respond.
                </p>
              ) : (
                conversation.map((message, index) => {
                  const isAssistant = message.role === "ai";
                  return (
                    <div key={`${message.role}-${index}`} className="flex flex-col gap-1">
                      <span
                        className={`text-xs font-medium uppercase tracking-wide ${
                          isAssistant ? "text-blue-600" : "text-slate-600"
                        }`}
                      >
                        {isAssistant ? "Lexsy Assistant" : "You"}
                      </span>
                      <p
                        className={`rounded-lg px-4 py-3 text-sm text-slate-800 shadow-sm ${
                          isAssistant
                            ? "bg-slate-100"
                            : "bg-white ring-1 ring-inset ring-slate-200"
                        }`}
                      >
                        {message.text}
                      </p>
                    </div>
                  );
                })
              )}
            </div>
          </>
        )}
      </div>

      {status === "pendingConfirmation" && placeholder && (
        <div className="space-y-4 rounded-lg bg-white p-6 shadow-lg">
          <p className="text-sm text-slate-600">
            I understood that the {placeholder.fieldName.toLowerCase()} should be:
          </p>
          <p className="rounded-lg bg-slate-50 px-4 py-3 text-base font-semibold text-slate-900 ring-1 ring-inset ring-slate-200">
            {proposedAnswer}
          </p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              onClick={handleConfirmClick}
              className="inline-flex w-full items-center justify-center rounded-lg bg-green-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-white sm:w-auto"
            >
              ✓ Yes, looks good
            </button>
            <button
              onClick={handleEditClick}
              className="inline-flex w-full items-center justify-center rounded-lg bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm ring-1 ring-inset ring-slate-300 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-white sm:w-auto"
            >
              Edit / Try again
            </button>
          </div>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-3 rounded-lg bg-white p-4 shadow-lg sm:flex-row sm:items-center sm:gap-4 sm:p-5"
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
          className="flex-1 rounded-lg bg-slate-50 px-4 py-2.5 text-sm text-slate-800 ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-white disabled:cursor-not-allowed disabled:bg-slate-100"
        />
        <button
          type="submit"
          disabled={disableInput || !input.trim()}
          className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-white disabled:cursor-not-allowed disabled:bg-blue-300"
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