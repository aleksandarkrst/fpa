"use client";

import { useEffect, useRef, useState } from "react";
import type { MasterDataRow } from "@/lib/types";

export default function MasterDataView() {
  const [rows, setRows] = useState<MasterDataRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function load() {
    const res = await fetch("/api/master-data");
    setRows(await res.json());
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setStatus(null);
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await fetch("/api/master-data/import", { method: "POST", body: fd });
      const data = await res.json();
      if (res.ok) {
        setStatus({ type: "success", msg: `Successfully imported ${data.imported} row${data.imported !== 1 ? "s" : ""}.` });
        await load();
      } else {
        setStatus({ type: "error", msg: data.error ?? "Import failed" });
      }
    } catch {
      setStatus({ type: "error", msg: "Network error during import" });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleClearAll() {
    if (!confirm("Delete all master data? This cannot be undone.")) return;
    await fetch("/api/master-data", { method: "DELETE" });
    setStatus(null);
    await load();
  }

  function handleDownloadTemplate() {
    window.location.href = "/api/master-data/template";
  }

  return (
    <div className="space-y-6">
      {/* Actions */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">
          Import / Export
        </h2>
        <div className="flex flex-wrap gap-3 items-center">
          <label className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium cursor-pointer transition-colors
            ${uploading ? "bg-gray-100 text-gray-400" : "bg-blue-600 hover:bg-blue-700 text-white"}`}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            {uploading ? "Importing…" : "Upload Excel (.xlsx)"}
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx"
              className="hidden"
              disabled={uploading}
              onChange={handleFileChange}
            />
          </label>

          <button
            onClick={handleDownloadTemplate}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download Template
          </button>

          {rows.length > 0 && (
            <button
              onClick={handleClearAll}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-red-600 border border-red-200 hover:bg-red-50 transition-colors ml-auto"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Clear All
            </button>
          )}
        </div>

        {status && (
          <div className={`mt-4 px-4 py-3 rounded-lg text-sm font-medium
            ${status.type === "success" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
            {status.msg}
          </div>
        )}

        <p className="mt-3 text-xs text-gray-400">
          Excel must contain one sheet with columns: legal_entity_code, legal_entity_name, department_code, department_name, profit_center_code, profit_center_name, cost_center_code, cost_center_name
        </p>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
            Master Data
          </h2>
          {rows.length > 0 && (
            <span className="text-xs text-gray-400">{rows.length} row{rows.length !== 1 ? "s" : ""}</span>
          )}
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-400 text-sm">Loading…</div>
        ) : rows.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-sm">
            No master data yet. Upload an Excel file to get started.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Legal Entity</th>
                  <th className="px-4 py-3 text-left font-medium">Department</th>
                  <th className="px-4 py-3 text-left font-medium">Profit Center</th>
                  <th className="px-4 py-3 text-left font-medium">Cost Center</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rows.map((r, i) => (
                  <tr key={i} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs text-gray-400 mr-1">{r.legal_entity_code}</span>
                      <span className="text-gray-700">{r.legal_entity_name}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs text-gray-400 mr-1">{r.department_code}</span>
                      <span className="text-gray-700">{r.department_name}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs text-gray-400 mr-1">{r.profit_center_code}</span>
                      <span className="text-gray-700">{r.profit_center_name}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs text-gray-400 mr-1">{r.cost_center_code}</span>
                      <span className="text-gray-700">{r.cost_center_name}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
