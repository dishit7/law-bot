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
    <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-gray-900">1. Upload document</h2>
      <p className="mt-2 text-sm text-gray-600">
        Supported format: <span className="font-medium text-gray-900">.docx</span>
      </p>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          type="file"
          accept=".docx"
          onChange={onFileChange}
          disabled={isProcessing}
          className="text-sm text-gray-700 file:mr-4 file:rounded-md file:border file:border-gray-300 file:bg-gray-100 file:px-3 file:py-2 file:text-sm file:font-medium file:text-gray-900 hover:file:bg-gray-200"
        />
        {fileName && (
          <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-700">
            {fileName}
          </span>
        )}
      </div>
      <button
        onClick={onProcess}
        disabled={!hasSelectedFile || isProcessing}
        className="mt-5 inline-flex items-center justify-center rounded-md bg-gray-900 px-5 py-2 text-sm font-semibold text-white transition hover:bg-gray-700 disabled:cursor-not-allowed disabled:bg-gray-300"
      >
        {status === "extracting" && "Extracting text..."}
        {status === "analyzing" && "Analyzing with Gemini..."}
        {status === "idle" && "Process document"}
      </button>
      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
    </section>
  );
}


