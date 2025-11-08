'use client';

import {
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { detectPlaceholders, type PlaceholderField } from "@/lib/ai";
import { extractTextFromDocx, generateCompletedDocx } from "@/lib/document";

type ProcessStatus = "idle" | "extracting" | "analyzing";
type ChatMessage = { role: "ai" | "user"; text: string };

export default function Home() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [documentText, setDocumentText] = useState<string>("");
  const [placeholders, setPlaceholders] = useState<PlaceholderField[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState<string>("");
  const [currentFieldIndex, setCurrentFieldIndex] = useState<number>(0);
  const [status, setStatus] = useState<ProcessStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [documentBuffer, setDocumentBuffer] = useState<ArrayBuffer | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [downloadStatus, setDownloadStatus] = useState<string | null>(null);

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
    setMessages([]);
    setChatInput("");
    setCurrentFieldIndex(0);
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
      setPlaceholders(detected);

      if (detected.length === 0) {
        setMessages([
          {
            role: "ai" as const,
            text: "I couldn't find any placeholders in this document. Feel free to review the text above.",
          },
        ]);
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

  const handleChatSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!chatInput.trim() || currentFieldIndex >= placeholders.length) {
      return;
    }

    const answer = chatInput.trim();
    const field = placeholders[currentFieldIndex];
    const nextIndex = currentFieldIndex + 1;

    setMessages((prev) => {
      const updated: ChatMessage[] = [...prev, { role: "user" as const, text: answer }];
      if (nextIndex >= placeholders.length) {
        updated.push({
          role: "ai" as const,
          text: "Great, we’ve captured details for every placeholder. Review them on the right.",
        });
      } else {
        const nextField = placeholders[nextIndex];
        updated.push({
          role: "ai" as const,
          text:
            nextField.question ??
            `Next up, what should I use for ${nextField.fieldName}?`,
        });
      }
      return updated;
    });

    setAnswers((prev) => ({ ...prev, [field.id]: answer }));
    setChatInput("");
    setCurrentFieldIndex(nextIndex);
  };

  const answeredCount = useMemo(
    () => placeholders.filter((field) => answers[field.id]?.trim()).length,
    [answers, placeholders],
  );

  const downloadFileName = useMemo(() => {
    if (!fileName) {
      return "lexsy-completed-safe.docx";
    }
    return fileName.replace(/\.docx$/i, "_completed.docx");
  }, [fileName]);

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

    try {
      setIsGenerating(true);
      setDownloadError(null);
      await generateCompletedDocx({
        buffer: documentBuffer,
        placeholders,
        answers,
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
  const chatActive = placeholders.length > 0;
  const chatComplete = chatActive && answeredCount === placeholders.length && placeholders.length > 0;
  const missingCount = Math.max(placeholders.length - answeredCount, 0);
  const canDownload =
    chatComplete && Boolean(documentBuffer) && placeholders.length > 0;

  useEffect(() => {
    if (!chatActive || messages.length > 0) {
      return;
    }

    const firstField = placeholders[0];
    setMessages([
      {
        role: "ai" as const,
        text:
          placeholders.length === 1
            ? `I found 1 placeholder to fill. ${
                firstField.question ??
                `Tell me the value for ${firstField.fieldName}.`
              }`
            : `I found ${placeholders.length} placeholders to fill. ${
                firstField.question ??
                `Let’s start with the ${firstField.fieldName}.`
              }`,
      },
    ]);
  }, [chatActive, messages.length, placeholders]);

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

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <h2 className="text-lg font-semibold text-slate-900">1. Upload document</h2>
          <p className="mt-2 text-sm text-slate-500">
            Supported format: <span className="font-medium text-slate-700">.docx</span>
          </p>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
            <input
              type="file"
              accept=".docx"
              onChange={handleFileChange}
              disabled={isProcessing}
              className="text-sm text-slate-700 file:mr-4 file:rounded-md file:border file:border-slate-300 file:bg-slate-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-slate-700 hover:file:bg-slate-100"
            />
            {fileName && (
              <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700">
                {fileName}
              </span>
            )}
          </div>
          <button
            onClick={handleProcessDocument}
            disabled={!selectedFile || isProcessing}
            className="mt-5 inline-flex items-center justify-center rounded-md bg-blue-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {status === "extracting" && "Extracting text..."}
            {status === "analyzing" && "Analyzing with Gemini..."}
            {status === "idle" && "Process document"}
          </button>
          {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
        </section>

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

          <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
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
                        {answeredCount}/{placeholders.length} filled
                      </span>
                    </div>
                    <div className="mt-2 h-2 rounded-full bg-slate-200">
                      <div
                        className="h-2 rounded-full bg-blue-500 transition-all"
                        style={{
                          width:
                            placeholders.length === 0
                              ? "0%"
                              : `${Math.round(
                                  (answeredCount / placeholders.length) * 100,
                                )}%`,
                        }}
                      />
                    </div>
                  </div>
                  <ul className="space-y-3">
                    {placeholders.map((field) => (
                      <li
                        key={field.id}
                        className="rounded-xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-700"
                      >
                        <p className="font-semibold text-slate-900">{field.fieldName}</p>
                        <p className="mt-1 text-slate-600">Placeholder: {field.placeholder}</p>
                        {field.question && (
                          <p className="mt-1 text-slate-500">Question: {field.question}</p>
                        )}
                        {field.example && (
                          <p className="mt-1 text-slate-500">Example: {field.example}</p>
                        )}
                        {answers[field.id] && (
                          <p className="mt-3 rounded-lg bg-white p-2 text-slate-600">
                            Answer:{" "}
                            <span className="font-medium text-slate-800">
                              {answers[field.id]}
                            </span>
                          </p>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">
              4. Chat to fill placeholders
            </h2>
            <span className="text-xs uppercase tracking-wide text-slate-400">
              {chatActive
                ? `Step ${Math.min(currentFieldIndex + 1, placeholders.length)} of ${
                    placeholders.length
                  }`
                : "Waiting"}
            </span>
          </div>

          {!chatActive ? (
            <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
              Upload a document and process it to begin the conversational fill experience.
            </p>
          ) : (
            <>
              <div className="space-y-3 rounded-xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-700">
                {messages.map((message, index) => (
                  <div key={`${message.role}-${index}`} className="flex flex-col gap-1">
                    <span
                      className={`text-xs font-semibold uppercase tracking-wide ${
                        message.role === "ai" ? "text-blue-600" : "text-slate-500"
                      }`}
                    >
                      {message.role === "ai" ? "Lexsy Assistant" : "You"}
                    </span>
                    <p className="rounded-lg bg-white/80 px-3 py-2 text-slate-700 shadow-sm">
                      {message.text}
                    </p>
                  </div>
                ))}
                {messages.length === 0 && (
                  <p className="text-slate-500">
                    Gemini is preparing your questions. This will only take a moment.
                  </p>
                )}
              </div>

              <form
                onSubmit={handleChatSubmit}
                className="flex flex-col gap-3 sm:flex-row sm:items-center"
              >
                <input
                  type="text"
                  value={chatInput}
                  onChange={(event) => setChatInput(event.target.value)}
                  placeholder={
                    currentFieldIndex >= placeholders.length
                      ? "All placeholders filled!"
                      : placeholders[currentFieldIndex].question ??
                        `Provide a value for ${placeholders[currentFieldIndex].fieldName}`
                  }
                  disabled={chatComplete}
                  className="flex-1 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
                />
                <button
                  type="submit"
                  disabled={chatComplete || !chatInput.trim()}
                  className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  {chatComplete ? "Completed" : "Send"}
                </button>
              </form>
            </>
          )}
        </section>

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
                  const value = answers[field.id];
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
                            value
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-yellow-100 text-yellow-700"
                          }`}
                        >
                          {value ? "Filled" : "Pending"}
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
                    </li>
                  );
                })}
              </ul>

              <div className="flex flex-col gap-3 rounded-xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-600">
                {missingCount > 0 ? (
                  <p>
                    Fill in the remaining{" "}
                    <span className="font-semibold text-slate-800">
                      {missingCount} field{missingCount === 1 ? "" : "s"}
                    </span>{" "}
                    via the chat so we can generate a complete document.
                  </p>
                ) : (
                  <p className="text-slate-600">
                    All placeholders are filled. Generate a completed SAFE to download.
                  </p>
                )}
                <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
                  <button
                    onClick={handleDownloadDocument}
                    disabled={!canDownload || isGenerating}
                    className="inline-flex items-center justify-center rounded-md bg-blue-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-slate-300"
                  >
                    {isGenerating ? "Preparing download..." : "Generate .docx"}
                  </button>
                  <span className="text-xs text-slate-500">
                    Output filename: <span className="font-medium">{downloadFileName}</span>
                  </span>
                </div>
                {downloadError && (
                  <p className="text-sm text-red-600">{downloadError}</p>
                )}
                {downloadStatus && !downloadError && (
                  <p className="text-sm text-emerald-600">{downloadStatus}</p>
                )}
              </div>
            </>
          )}
        </section>
      </main>
    </div>
  );
}
