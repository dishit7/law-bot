'use client';

import type { ChangeEvent } from "react";

type UploadPanelProps = {
  fileName: string;
  isProcessing: boolean;
  status: "idle" | "extracting" | "analyzing";
  error: string | null;
  onFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onProcess: () => void;
  hasSelectedFile: boolean;
};

export default function UploadPanel({
  fileName,
  isProcessing,
  status,
  error,
  onFileChange,
  onProcess,
  hasSelectedFile,
}: UploadPanelProps) {
  return (
    <section className="rounded-lg bg-white p-6 shadow-lg">
      <h2 className="text-lg font-semibold text-slate-900">1. Upload document</h2>
      <p className="mt-2 text-sm text-slate-500">
        Supported format: <span className="font-medium text-slate-900">.docx</span>
      </p>
      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <input
            id="document-upload"
            type="file"
            accept=".docx"
            onChange={onFileChange}
            disabled={isProcessing}
            className="sr-only"
          />
          <label
            htmlFor="document-upload"
            className={`inline-flex items-center justify-center rounded-lg px-4 py-2.5 text-sm font-medium shadow-sm ring-1 ring-inset ring-slate-300 transition focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-white ${
              isProcessing
                ? "cursor-not-allowed bg-slate-100 text-slate-400"
                : "cursor-pointer bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            Choose file
          </label>
        </div>
        {fileName && (
          <div className="sm:flex-1 sm:min-w-0">
            <span className="inline-flex w-full items-center rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700 sm:w-auto sm:max-w-full">
              <span className="truncate">{fileName}</span>
            </span>
          </div>
        )}
      </div>
      <button
        onClick={onProcess}
        disabled={!hasSelectedFile || isProcessing}
        className="mt-6 inline-flex w-full items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-white disabled:cursor-not-allowed disabled:bg-blue-300"
      >
        {status === "extracting" && "Extracting text..."}
        {status === "analyzing" && "Analyzing with Gemini..."}
        {status === "idle" && "Process document"}
      </button>
      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
    </section>
  );
}