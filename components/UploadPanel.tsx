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
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
      <h2 className="text-lg font-semibold text-slate-900">1. Upload document</h2>
      <p className="mt-2 text-sm text-slate-500">
        Supported format: <span className="font-medium text-slate-700">.docx</span>
      </p>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          type="file"
          accept=".docx"
          onChange={onFileChange}
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
        onClick={onProcess}
        disabled={!hasSelectedFile || isProcessing}
        className="mt-5 inline-flex items-center justify-center rounded-md bg-blue-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-slate-300"
      >
        {status === "extracting" && "Extracting text..."}
        {status === "analyzing" && "Analyzing with Gemini..."}
        {status === "idle" && "Process document"}
      </button>
      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
    </section>
  );
}


