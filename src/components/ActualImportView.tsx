"use client";

import { useRef, useState } from "react";

interface ImportResult {
  imported: number;
  skipped: number;
  warnings: string[];
}

export default function ActualImportView() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<"idle" | "uploading" | "success" | "error">("idle");
  const [result, setResult] = useState<ImportResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setFileName(e.target.files?.[0]?.name ?? null);
    setStatus("idle");
    setResult(null);
    setErrorMsg(null);
  }

  async function handleImport() {
    const file = fileRef.current?.files?.[0];
    if (!file) return;

    setStatus("uploading");
    setResult(null);
    setErrorMsg(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/actuals/import", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) {
        setStatus("error");
        setErrorMsg(data.error ?? "Import failed");
      } else {
        setStatus("success");
        setResult(data);
      }
    } catch {
      setStatus("error");
      setErrorMsg("Network error — please try again");
    }
  }

  return (
    <div className="space-y-5 max-w-2xl">
      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-5 text-sm space-y-2">
        <p className="font-semibold text-blue-900">How to import actuals</p>
        <ol className="list-decimal list-inside space-y-1 text-blue-700">
          <li>Download the template — columns are pre-filled with your profit centers and configured past + actual periods</li>
          <li>Fill in the actual revenue values for each profit center and period</li>
          <li>Upload the completed file below</li>
        </ol>
        <p className="text-xs text-blue-500 pt-1">
          Periods outside the past and actual ranges are ignored. Re-importing a file overwrites existing values.
        </p>
      </div>

      {/* Template download */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-gray-800">Download Template</p>
          <p className="text-xs text-gray-400 mt-0.5">
            Excel file with your profit centers and period columns
          </p>
        </div>
        <a
          href="/api/actuals/template"
          className="flex items-center gap-2 text-xs px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors font-medium shrink-0"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Download Template
        </a>
      </div>

      {/* Upload */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
        <p className="text-sm font-semibold text-gray-800">Upload Actuals</p>

        <label
          className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-xl cursor-pointer transition-colors
            ${fileName ? "border-blue-300 bg-blue-50/50" : "border-gray-200 bg-gray-50 hover:bg-gray-100 hover:border-gray-300"}`}
        >
          <div className="text-center pointer-events-none">
            {fileName ? (
              <>
                <p className="text-sm font-medium text-blue-700">{fileName}</p>
                <p className="text-xs text-gray-400 mt-1">Click to change file</p>
              </>
            ) : (
              <>
                <svg className="w-8 h-8 text-gray-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-sm text-gray-500">Click to select an Excel file</p>
                <p className="text-xs text-gray-400 mt-1">.xlsx only</p>
              </>
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept=".xlsx"
            className="hidden"
            onChange={handleFileChange}
          />
        </label>

        <button
          onClick={handleImport}
          disabled={!fileName || status === "uploading"}
          className="w-full py-2.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {status === "uploading" ? "Importing…" : "Import Actuals"}
        </button>
      </div>

      {/* Result banner */}
      {status === "success" && result && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-5 space-y-2">
          <p className="text-sm font-semibold text-green-800">Import complete</p>
          <p className="text-sm text-green-700">
            {result.imported} value{result.imported !== 1 ? "s" : ""} imported
            {result.skipped > 0 && (
              <span className="text-green-600">
                {" "}· {result.skipped} cell{result.skipped !== 1 ? "s" : ""} skipped (outside past/actual range)
              </span>
            )}
          </p>
          {result.warnings.length > 0 && (
            <ul className="text-xs text-amber-700 space-y-0.5 pt-1 border-t border-green-200 mt-2">
              {result.warnings.map((w, i) => (
                <li key={i} className="flex items-start gap-1">
                  <span>⚠</span>
                  <span>{w}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {status === "error" && errorMsg && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-5">
          <p className="text-sm font-semibold text-red-800">Import failed</p>
          <p className="text-sm text-red-700 mt-1">{errorMsg}</p>
        </div>
      )}
    </div>
  );
}
