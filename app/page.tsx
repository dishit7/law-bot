'use client';

import { useState, type ChangeEvent } from "react";
import { detectPlaceholders, type PlaceholderField } from "@/lib/ai";
import { extractTextFromDocx } from "@/lib/document";

type ProcessStatus = "idle" | "extracting" | "analyzing";

export default function Home() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [documentText, setDocumentText] = useState<string>("");
  const [placeholders, setPlaceholders] = useState<PlaceholderField[]>([]);
  const [status, setStatus] = useState<ProcessStatus>("idle");
  const [error, setError] = useState<string | null>(null);

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
    setError(null);
  };

  const handleProcessDocument = async () => {
    if (!selectedFile) {
      setError("Please choose a .docx file first.");
      return;
    }

    try {
      setError(null);
      setStatus("extracting");

      const text = await extractTextFromDocx(selectedFile);
      setDocumentText(text);

      setStatus("analyzing");
      const detected = await detectPlaceholders(text);
      setPlaceholders(detected);
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error ? err.message : "Something went wrong. Please try again.",
      );
    } finally {
      setStatus("idle");
    }
  };

  const isProcessing = status !== "idle";

  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col gap-8 px-6 py-16">
      <header className="space-y-3">
        <h1 className="text-3xl font-semibold text-zinc-900">Lexsy Placeholder Finder</h1>
        <p className="text-base text-zinc-600">
          Upload a SAFE draft, extract the raw text, and let Gemini identify template
          placeholders. This is the foundation for the interactive filling workflow.
        </p>
      </header>

      <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-medium text-zinc-900">1. Upload document</h2>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <input
            type="file"
            accept=".docx"
            onChange={handleFileChange}
            disabled={isProcessing}
            className="text-sm"
          />
          {fileName && (
            <span className="rounded-full bg-zinc-100 px-3 py-1 text-sm text-zinc-700">
              {fileName}
            </span>
          )}
        </div>
        <button
          onClick={handleProcessDocument}
          disabled={!selectedFile || isProcessing}
          className="mt-5 inline-flex items-center justify-center rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-300"
        >
          {status === "extracting" && "Extracting text..."}
          {status === "analyzing" && "Analyzing with Gemini..."}
          {status === "idle" && "Process document"}
        </button>
        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <div className="space-y-3 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-zinc-900">2. Extracted text</h2>
            <span className="text-xs text-zinc-500">
              {documentText ? `${documentText.length} chars` : "No text yet"}
            </span>
          </div>
          <div className="rounded-lg border border-zinc-100 bg-zinc-50 p-4 text-sm text-zinc-700">
            {documentText ? (
              <pre className="max-h-64 whitespace-pre-wrap wrap-break-word overflow-y-auto">
                {documentText}
              </pre>
            ) : (
              <p className="text-zinc-500">
                Upload a .docx file and click &ldquo;Process document&rdquo; to view its raw
                contents.
              </p>
            )}
          </div>
        </div>

        <div className="space-y-3 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-zinc-900">3. Detected placeholders</h2>
            <span className="text-xs text-zinc-500">
              {placeholders.length} field{placeholders.length === 1 ? "" : "s"}
            </span>
          </div>
          <div className="space-y-3">
            {placeholders.length === 0 ? (
              <p className="rounded-lg border border-dashed border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-500">
                Gemini will list placeholders here after analysis.
              </p>
            ) : (
              <ul className="space-y-3">
                {placeholders.map((field) => (
                  <li
                    key={field.id}
                    className="rounded-lg border border-zinc-100 bg-zinc-50 p-4 text-sm text-zinc-700"
                  >
                    <p className="font-medium text-zinc-900">{field.fieldName}</p>
                    <p className="mt-1 text-zinc-600">Placeholder: {field.placeholder}</p>
                    {field.question && (
                      <p className="mt-1 text-zinc-500">Question: {field.question}</p>
                    )}
                    {field.example && (
                      <p className="mt-1 text-zinc-500">Example: {field.example}</p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
