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
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
