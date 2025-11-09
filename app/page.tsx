'use client';

import { useState, type ChangeEvent } from "react";
import PlaceholderChat from "@/components/PlaceholderChat";
import UploadPanel from "@/components/UploadPanel";
import PlaceholderOverview from "@/components/PlaceholderOverview";
import ReviewPanel from "@/components/ReviewPanel";
import { detectPlaceholders } from "@/lib/ai";
import { extractTextFromDocx, generateCompletedDocx } from "@/lib/document";
import { usePlaceholderFlow } from "@/hooks/usePlaceholderFlow";

type ProcessStatus = "idle" | "extracting" | "analyzing";

export default function Home() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [documentText, setDocumentText] = useState<string>("");
  const [status, setStatus] = useState<ProcessStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [documentBuffer, setDocumentBuffer] = useState<ArrayBuffer | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [downloadStatus, setDownloadStatus] = useState<string | null>(null);
  const downloadFileName = fileName
    ? fileName.replace(/\.docx$/i, "_completed.docx")
    : "lexsy-completed-safe.docx";

  const {
    placeholders,
    answers,
    activePlaceholderId,
    chatLoading,
    chatError,
    confirmedAnswersMap,
    answeredCount,
    missingCount,
    initializePlaceholders,
    resetFlow,
    handleSendMessage,
    handleConfirmActiveAnswer,
    handleEditActiveAnswer,
    handleJumpToPlaceholder,
  } = usePlaceholderFlow();

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    resetFlow();

    if (!file) {
      setSelectedFile(null);
      setFileName("");
      return;
    }

    setSelectedFile(file);
    setFileName(file.name);
    setDocumentText("");
    setDocumentBuffer(null);
    setDownloadError(null);
    setDownloadStatus(null);
    setIsGenerating(false);
    setError(null);
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
      initializePlaceholders(detected);
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error ? err.message : "Something went wrong. Please try again.",
      );
    } finally {
      setStatus("idle");
    }
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

  const isProcessing = status !== "idle";
  const canDownload =
    placeholders.length > 0 &&
    missingCount === 0 &&
    Object.keys(confirmedAnswersMap).length === placeholders.length &&
    Boolean(documentBuffer);

  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <main className="mx-auto flex w-full max-w-7xl flex-col gap-12 px-8 text-slate-900">
        <header className="space-y-3">
          <h1 className="text-3xl font-semibold text-slate-900">Lexsy Placeholder Assistant</h1>
          <p className="text-sm text-slate-600">
            Upload a SAFE draft, let Gemini surface placeholders, fill them conversationally, and
            export a completed document.
          </p>
        </header>

        <section className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,3fr)_minmax(380px,1fr)] lg:items-start">
          <div className="space-y-6">
            <UploadPanel
              fileName={fileName}
              isProcessing={isProcessing}
              status={status}
              error={error}
              onFileChange={handleFileChange}
              onProcess={handleProcessDocument}
              hasSelectedFile={Boolean(selectedFile)}
            />

            <div className="space-y-6 rounded-lg bg-white p-6 shadow-lg">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900">
                  4. Chat to fill placeholders
                </h2>
                <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
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
            </div>

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
          </div>

          <div className="space-y-6">
            <PlaceholderOverview
              placeholders={placeholders}
              answers={answers}
              activePlaceholderId={activePlaceholderId}
              answeredCount={answeredCount}
              onJumpToPlaceholder={handleJumpToPlaceholder}
            />
          </div>
        </section>
      </main>
    </div>
  );
}
