'use client';

import { useEffect, useState, type ChangeEvent } from "react";
import PlaceholderChat from "@/components/PlaceholderChat";
import UploadPanel from "@/components/UploadPanel";
import PlaceholderOverview from "@/components/PlaceholderOverview";
import ReviewPanel from "@/components/ReviewPanel";
import { detectPlaceholders, type PlaceholderField } from "@/lib/ai";
import { extractTextFromDocx, generateCompletedDocx } from "@/lib/document";
import type {
  ChatMessage,
  PlaceholderAnswer,
  PlaceholderStatus,
} from "@/types/placeholders";

type ProcessStatus = "idle" | "extracting" | "analyzing";

export default function Home() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [documentText, setDocumentText] = useState<string>("");
  const [placeholders, setPlaceholders] = useState<PlaceholderField[]>([]);
  const [answers, setAnswers] = useState<Record<string, PlaceholderAnswer>>({});
  const [activePlaceholderId, setActivePlaceholderId] = useState<string | null>(null);
  const [status, setStatus] = useState<ProcessStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [documentBuffer, setDocumentBuffer] = useState<ArrayBuffer | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [downloadStatus, setDownloadStatus] = useState<string | null>(null);
  const [chatLoading, setChatLoading] = useState<boolean>(false);
  const [chatError, setChatError] = useState<string | null>(null);

  const confirmedAnswersMap = placeholders.reduce<Record<string, string>>(
    (acc, field) => {
      const record = answers[field.id];
      if (record?.status === "confirmed" && record.value.trim()) {
        acc[field.id] = record.value.trim();
      }
      return acc;
    },
    {},
  );

  const answeredCount = Object.keys(confirmedAnswersMap).length;

  const downloadFileName = fileName
    ? fileName.replace(/\.docx$/i, "_completed.docx")
    : "lexsy-completed-safe.docx";

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      setSelectedFile(null);
      setFileName("");
      return;
    }

    setSelectedFile(file);
    setFileName(file.name);
    setDocumentText("");
    setPlaceholders([]);
    setAnswers({});
    setActivePlaceholderId(null);
    setDocumentBuffer(null);
    setDownloadError(null);
    setDownloadStatus(null);
    setIsGenerating(false);
    setError(null);
    setChatError(null);
  };

  const handleProcessDocument = async () => {
    if (!selectedFile) {
      setError("Please choose a .docx file first.");
      return;
    }

    try {
      setError(null);
      setDownloadError(null);
      setDownloadStatus(null);
      setStatus("extracting");

      const buffer = await selectedFile.arrayBuffer();
      setDocumentBuffer(buffer);

      const text = await extractTextFromDocx(selectedFile);
      setDocumentText(text);

      setStatus("analyzing");
      const detected = await detectPlaceholders(text);
      setPlaceholders(detected);

      const initialAnswers = detected.reduce<Record<string, PlaceholderAnswer>>(
        (acc, field) => {
          acc[field.id] = {
            status: "pending",
            value: "",
            conversation: [],
          };
          return acc;
        },
        {},
      );

      setAnswers(initialAnswers);
      setActivePlaceholderId(detected[0]?.id ?? null);

      if (detected.length === 0) {
        setChatError(
          "I couldn't find any placeholders in this document. Feel free to review the text above.",
        );
      } else {
        setChatError(null);
      }
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error ? err.message : "Something went wrong. Please try again.",
      );
    } finally {
      setStatus("idle");
    }
  };

  const updateAnswerRecord = (
    placeholderId: string,
    updater: (current: PlaceholderAnswer) => PlaceholderAnswer,
  ) => {
    setAnswers((prev) => {
      const current = prev[placeholderId];
      if (!current) {
        return prev;
      }
      return {
        ...prev,
        [placeholderId]: updater(current),
      };
    });
  };

  const appendMessage = (placeholderId: string, message: ChatMessage) => {
    updateAnswerRecord(placeholderId, (current) => ({
      ...current,
      conversation: [...current.conversation, message],
    }));
  };

  const handleDownloadDocument = async () => {
    if (!documentBuffer) {
      setDownloadError(
        "Original document data missing. Please re-upload the file and process it again.",
      );
      return;
    }

    if (placeholders.length === 0) {
      setDownloadError("No placeholders detected to populate.");
      return;
    }

    if (Object.keys(confirmedAnswersMap).length !== placeholders.length) {
      setDownloadError("Please confirm every placeholder before downloading.");
      return;
    }

    try {
      setIsGenerating(true);
      setDownloadError(null);
      await generateCompletedDocx({
        buffer: documentBuffer,
        placeholders,
        answers: confirmedAnswersMap,
        fileName: downloadFileName,
      });
      setDownloadStatus("Download started. Check your downloads folder.");
    } catch (err) {
      console.error(err);
      setDownloadError(
        err instanceof Error
          ? err.message
          : "Failed to generate the completed document. Please try again.",
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSendMessage = async (message: string) => {
    if (!activePlaceholderId) {
      return;
    }

    const trimmed = message.trim();
    if (!trimmed) {
      return;
    }

    const placeholder = placeholders.find((field) => field.id === activePlaceholderId);
    const record = answers[activePlaceholderId];

    if (!placeholder || !record) {
      return;
    }

    const conversationForLLM = [
      ...record.conversation,
      { role: "user" as const, text: trimmed },
    ];

    appendMessage(activePlaceholderId, { role: "user", text: trimmed });
    setChatError(null);
    setChatLoading(true);

    try {
      const response = await fetch("/api/chat-fill", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          placeholder,
          message: trimmed,
          conversation: conversationForLLM,
          confirmedAnswers: confirmedAnswersMap,
        }),
      });

      if (!response.ok) {
        throw new Error("The assistant couldn't parse that. Please try again.");
      }

      const payload: {
        answer?: string;
        followUp?: string | null;
      } = await response.json();

      const proposedAnswer = payload.answer?.trim() ?? "";
      const followUp =
        payload.followUp?.trim() ||
        (proposedAnswer
          ? `I'll set ${placeholder.fieldName} to "${proposedAnswer}". Does that look right?`
          : `I couldn't determine the value yet. Can you clarify the ${placeholder.fieldName}?`);

      appendMessage(activePlaceholderId, {
        role: "ai",
        text: followUp,
      });

      if (proposedAnswer) {
        updateAnswerRecord(activePlaceholderId, (current) => ({
          ...current,
          status: "pendingConfirmation",
          value: proposedAnswer,
        }));
      } else {
        updateAnswerRecord(activePlaceholderId, (current) => ({
          ...current,
          status: "pending",
        }));
      }
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Sorry, I ran into an issue. Please try rephrasing your answer.";
      setChatError(message);
      appendMessage(activePlaceholderId, {
        role: "ai",
        text: message,
      });
    } finally {
      setChatLoading(false);
    }
  };

  const handleConfirmActiveAnswer = () => {
    if (!activePlaceholderId) {
      return;
    }

    updateAnswerRecord(activePlaceholderId, (current) => ({
      ...current,
      status: "confirmed",
    }));
    appendMessage(activePlaceholderId, {
      role: "ai",
      text: "Great! I've logged that answer.",
    });

    const nextPending = placeholders.find((field) => {
      if (field.id === activePlaceholderId) {
        return false;
      }
      const record = answers[field.id];
      return !record || record.status !== "confirmed";
    });

    setActivePlaceholderId(nextPending?.id ?? null);
  };

  const handleEditActiveAnswer = () => {
    if (!activePlaceholderId) {
      return;
    }

    updateAnswerRecord(activePlaceholderId, (current) => ({
      ...current,
      status: "pending",
    }));
    appendMessage(activePlaceholderId, {
      role: "ai",
      text: "No problem—let's update that. What's the correct value?",
    });
  };

  const handleJumpToPlaceholder = (placeholderId: string) => {
    setActivePlaceholderId(placeholderId);
    setChatError(null);
  };

  useEffect(() => {
    if (placeholders.length === 0) {
      if (activePlaceholderId !== null) {
        setActivePlaceholderId(null);
      }
      return;
    }

    const firstPending = placeholders.find((field) => {
      const record = answers[field.id];
      return !record || record.status !== "confirmed";
    });

    if (!activePlaceholderId) {
      const nextId = firstPending?.id ?? null;
      if (nextId !== activePlaceholderId) {
        setActivePlaceholderId(nextId);
      }
      return;
    }

    const currentRecord = answers[activePlaceholderId];
    if (currentRecord?.status === "confirmed") {
      const nextId = firstPending?.id ?? null;
      if (nextId !== activePlaceholderId) {
        setActivePlaceholderId(nextId);
      }
    }
  }, [activePlaceholderId, answers, placeholders]);

  useEffect(() => {
    if (!activePlaceholderId) {
      return;
    }

    const record = answers[activePlaceholderId];
    const placeholder = placeholders.find((field) => field.id === activePlaceholderId);

    if (!record || !placeholder) {
      return;
    }

    if (record.conversation.length > 0 || record.status !== "pending") {
      return;
    }

    const question =
      placeholder.question ??
      `What is the correct value for ${placeholder.fieldName}?`;

    setAnswers((prev) => {
      const current = prev[activePlaceholderId];
      if (!current) {
        return prev;
      }
      return {
        ...prev,
        [activePlaceholderId]: {
          ...current,
          conversation: [...current.conversation, { role: "ai", text: question }],
        },
      };
    });
  }, [activePlaceholderId, answers, placeholders]);

  const isProcessing = status !== "idle";
  const chatActive = placeholders.length > 0;
  const missingCount = Math.max(placeholders.length - answeredCount, 0);
  const canDownload =
    placeholders.length > 0 &&
    missingCount === 0 &&
    Object.keys(confirmedAnswersMap).length === placeholders.length &&
    Boolean(documentBuffer);

  return (
    <div className="min-h-screen bg-slate-100 py-12">
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-6 text-slate-800">
        <header className="space-y-3">
          <h1 className="text-3xl font-semibold text-slate-900">Lexsy Placeholder Finder</h1>
          <p className="text-base text-slate-600">
            Upload a SAFE draft, extract the raw text, and let Gemini identify template
            placeholders. This is the foundation for the interactive filling workflow.
          </p>
        </header>

        <UploadPanel
          fileName={fileName}
          isProcessing={isProcessing}
          status={status}
          error={error}
          onFileChange={handleFileChange}
          onProcess={handleProcessDocument}
          hasSelectedFile={Boolean(selectedFile)}
        />

        <section className="grid gap-6 md:grid-cols-2">
          <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">2. Extracted text</h2>
              <span className="text-xs uppercase tracking-wide text-slate-400">
                {documentText ? `${documentText.length} chars` : "Awaiting upload"}
              </span>
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-700">
              {documentText ? (
                <pre className="max-h-72 whitespace-pre-wrap wrap-break-word overflow-y-auto">
                  {documentText}
                </pre>
              ) : (
                <p className="text-slate-500">
                  Upload a .docx file and click “Process document” to view its raw contents.
                </p>
              )}
            </div>
          </div>

          <PlaceholderOverview
            placeholders={placeholders}
            answers={answers}
            activePlaceholderId={activePlaceholderId}
            answeredCount={answeredCount}
            onJumpToPlaceholder={handleJumpToPlaceholder}
          />
        </section>

        <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">
              4. Chat to fill placeholders
            </h2>
            <span className="text-xs uppercase tracking-wide text-slate-400">
              {placeholders.length > 0
                ? answeredCount === placeholders.length
                  ? "All placeholders confirmed"
                  : `${answeredCount}/${placeholders.length} confirmed`
                : "Waiting"}
            </span>
          </div>

          <PlaceholderChat
            placeholder={
              activePlaceholderId
                ? placeholders.find((field) => field.id === activePlaceholderId) ?? null
                : null
            }
            record={activePlaceholderId ? answers[activePlaceholderId] : undefined}
            onSendMessage={handleSendMessage}
            onConfirm={handleConfirmActiveAnswer}
            onEdit={handleEditActiveAnswer}
            isLoading={chatLoading}
            error={chatError}
            totalCount={placeholders.length}
            currentIndex={
              activePlaceholderId
                ? placeholders.findIndex((field) => field.id === activePlaceholderId) + 1
                : null
            }
            allConfirmed={answeredCount === placeholders.length && placeholders.length > 0}
          />
        </section>

        <ReviewPanel
          placeholders={placeholders}
          answers={answers}
          missingCount={missingCount}
          canDownload={canDownload}
          downloadFileName={downloadFileName}
          isGenerating={isGenerating}
          downloadError={downloadError}
          downloadStatus={downloadStatus}
          onDownload={handleDownloadDocument}
          onJumpToPlaceholder={handleJumpToPlaceholder}
        />
      </main>
    </div>
  );
}
