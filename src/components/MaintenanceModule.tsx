"use client";

import React, { useState } from "react";
import { DatabaseSchema } from "@/lib/db";
import { StaffAccount } from "@/lib/types";
import {
  AlertTriangle,
  CheckCircle2,
  Database,
  Download,
  FileJson,
  HardDrive,
  Lock,
  RefreshCw,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  Upload,
} from "lucide-react";

interface MaintenanceModuleProps {
  db: DatabaseSchema;
  loggedInStaff: StaffAccount | null;
  actorName: string;
  actorRole: string;
  canAccessMaintenance: boolean;
  onRefreshDb: () => void;
}

export default function MaintenanceModule({
  db,
  loggedInStaff,
  actorName,
  actorRole,
  canAccessMaintenance,
  onRefreshDb,
}: MaintenanceModuleProps) {
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // State Restore File
  const [restorePreview, setRestorePreview] = useState<{
    fileName: string;
    snapshot: Partial<DatabaseSchema> & { exportedAt?: string; scope?: string };
  } | null>(null);

  // State Modal Konfirmasi Reset
  const [confirmMode, setConfirmMode] = useState<null | "CLEAN_PROD" | "RESET_DEMO">(
    null
  );
  const [confirmKeyword, setConfirmKeyword] = useState("");

  if (!canAccessMaintenance) {
    return (
      <div className="rounded-2xl border border-rose-500/40 bg-slate-900 p-8 text-center shadow-xl space-y-3">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500/20 text-rose-400">
          <Lock className="h-6 w-6" />
        </div>
        <h3 className="text-lg font-bold text-white">
          Akses Terbatas — Khusus Superadmin (Direktur Utama)
        </h3>
        <p className="mx-auto max-w-md text-xs text-slate-400">
          Modul Maintenance (Backup, Restore &amp; Reset Database) hanya boleh diakses oleh
          Direktur Utama atau peran Superadmin berizin khusus.
        </p>
      </div>
    );
  }

  async function handleDownloadBackup(scope: "FULL" | "CORE") {
    setBusyAction(`BACKUP_${scope}`);
    setFeedback(null);
    try {
      const res = await fetch("/api/p3mi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "BACKUP_DATABASE",
          actorName,
          actorRole,
          payload: { scope },
        }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Gagal membuat backup database.");

      const now = new Date();
      const pad = (n: number) => String(n).padStart(2, "0");
      const stamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(
        now.getDate()
      )}-${pad(now.getHours())}${pad(now.getMinutes())}`;
      const filename =
        scope === "CORE"
          ? `pasmigranpro-backup-inti-${stamp}.json`
          : `pasmigranpro-backup-full-${stamp}.json`;

      const blob = new Blob([JSON.stringify(data.snapshot, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      setFeedback({
        type: "success",
        text: `File backup '${filename}' berhasil diunduh dan dicatat ke Log Audit.`,
      });
      onRefreshDb();
    } catch (err: unknown) {
      setFeedback({
        type: "error",
        text: err instanceof Error ? err.message : "Gagal mengunduh backup.",
      });
    } finally {
      setBusyAction(null);
    }
  }

  function handleSelectRestoreFile(e: React.ChangeEvent<HTMLInputElement>) {
    setFeedback(null);
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result || "{}"));
        if (
          !parsed ||
          typeof parsed !== "object" ||
          !Array.isArray(parsed.branches) ||
          !Array.isArray(parsed.staffAccounts)
        ) {
          throw new Error(
            "Struktur JSON tidak valid. Pastikan file berasal dari hasil Backup PASMigranPro."
          );
        }
        setRestorePreview({
          fileName: file.name,
          snapshot: parsed,
        });
      } catch (err: unknown) {
        setRestorePreview(null);
        setFeedback({
          type: "error",
          text:
            err instanceof Error
              ? err.message
              : "File backup JSON tidak dapat dibaca.",
        });
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  async function handleConfirmRestore() {
    if (!restorePreview) return;
    setBusyAction("RESTORE");
    setFeedback(null);
    try {
      const res = await fetch("/api/p3mi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "RESTORE_DATABASE",
          actorName,
          actorRole,
          payload: { snapshot: restorePreview.snapshot },
        }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Gagal memulihkan database.");

      setFeedback({
        type: "success",
        text: `Database berhasil dipulihkan dari '${restorePreview.fileName}'.`,
      });
      setRestorePreview(null);
      onRefreshDb();
    } catch (err: unknown) {
      setFeedback({
        type: "error",
        text: err instanceof Error ? err.message : "Gagal melakukan restore database.",
      });
    } finally {
      setBusyAction(null);
    }
  }

  async function handleExecuteReset() {
    if (!confirmMode) return;
    const requiredText = confirmMode === "CLEAN_PROD" ? "BERSIHKAN" : "RESET DEMO";
    if (confirmKeyword.trim().toUpperCase() !== requiredText) return;

    setBusyAction(confirmMode);
    setFeedback(null);
    try {
      const action =
        confirmMode === "CLEAN_PROD" ? "CLEAR_OPERATIONAL_DATA" : "RESET_DEMO_DATA";
      const res = await fetch("/api/p3mi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          actorName,
          actorRole,
          payload: {},
        }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Gagal menjalankan reset data.");

      setFeedback({
        type: "success",
        text:
          confirmMode === "CLEAN_PROD"
            ? "Data dummy operasional berhasil dibersihkan. Direktur Utama, User Staf, Role RBAC, Profil PT & Master Referensi tetap aman tersimpan."
            : "Database berhasil dikembalikan ke kondisi data contoh (Seed Demo) beserta Direktur Utama & 12 staf.",
      });
      setConfirmMode(null);
      setConfirmKeyword("");
      onRefreshDb();
    } catch (err: unknown) {
      setFeedback({
        type: "error",
        text: err instanceof Error ? err.message : "Gagal menjalankan reset.",
      });
    } finally {
      setBusyAction(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-700/60 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-6 shadow-xl lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400">
            <ShieldCheck className="h-4 w-4" />
            Pengaturan Sistem · Khusus Superadmin ({loggedInStaff?.name || "Direktur Utama"})
          </div>
          <h2 className="mt-1 text-2xl font-black text-white">
            Modul Maintenance, Backup &amp; Reset Database
          </h2>
          <p className="mt-1 text-xs text-slate-300">
            Cadangkan seluruh data PT. Panca Banyu Ajisakti ke file JSON, pulihkan database dari cadangan, atau bersihkan data dummy sebelum operasional penuh.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold border ${
              db.isCleanProduction
                ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-300"
                : "bg-sky-500/15 border-sky-500/40 text-sky-300"
            }`}
          >
            <HardDrive className="h-3.5 w-3.5" />
            {db.isCleanProduction
              ? "Mode Produksi Bersih (Tanpa Data Contoh)"
              : "Mode Data Contoh Aktif (Untuk Uji Coba)"}
          </span>
        </div>
      </div>

      {feedback && (
        <div
          className={`flex items-center justify-between rounded-xl border p-4 text-xs ${
            feedback.type === "success"
              ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-200"
              : "border-rose-500/40 bg-rose-500/10 text-rose-200"
          }`}
        >
          <span className="flex items-center gap-2 font-semibold">
            {feedback.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-rose-400" />
            )}
            {feedback.text}
          </span>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="underline hover:text-white cursor-pointer"
          >
            Tutup
          </button>
        </div>
      )}

      {/* Ringkasan Statistik Isi Database Saat Ini */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <div className="rounded-xl border border-slate-700 bg-slate-900 p-3.5">
          <p className="text-[10px] font-bold uppercase text-slate-400">User &amp; Role</p>
          <p className="mt-1 text-xl font-black text-white">
            {db.staffAccounts.length}{" "}
            <span className="text-xs font-semibold text-sky-400">
              / {(db.roles || []).length} Role
            </span>
          </p>
        </div>
        <div className="rounded-xl border border-slate-700 bg-slate-900 p-3.5">
          <p className="text-[10px] font-bold uppercase text-slate-400">Data CPMI</p>
          <p className="mt-1 text-xl font-black text-white">{db.candidates.length}</p>
        </div>
        <div className="rounded-xl border border-slate-700 bg-slate-900 p-3.5">
          <p className="text-[10px] font-bold uppercase text-slate-400">Sponsor PL</p>
          <p className="mt-1 text-xl font-black text-white">{db.sponsors.length}</p>
        </div>
        <div className="rounded-xl border border-slate-700 bg-slate-900 p-3.5">
          <p className="text-[10px] font-bold uppercase text-slate-400">Lowongan &amp; Case</p>
          <p className="mt-1 text-xl font-black text-white">
            {db.vacancies.length}{" "}
            <span className="text-xs font-semibold text-amber-400">
              / {db.cases.length} Case
            </span>
          </p>
        </div>
        <div className="rounded-xl border border-slate-700 bg-slate-900 p-3.5">
          <p className="text-[10px] font-bold uppercase text-slate-400">Kas &amp; Invoice</p>
          <p className="mt-1 text-xl font-black text-white">
            {(db.cashJournals?.length || 0) + (db.syarikahInvoices?.length || 0)}
          </p>
        </div>
        <div className="rounded-xl border border-slate-700 bg-slate-900 p-3.5">
          <p className="text-[10px] font-bold uppercase text-slate-400">Log Audit</p>
          <p className="mt-1 text-xl font-black text-white">{db.auditLogs.length}</p>
        </div>
      </div>

      {/* 3 Panel Aksi Utama */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* 1. BACKUP DATABASE */}
        <div className="rounded-2xl border border-slate-700 bg-slate-900 p-5 shadow-xl flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/20 text-sky-400">
                <Database className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">1. Backup Database</h3>
                <p className="text-[11px] text-slate-400">Ekspor cadangan aman (.JSON)</p>
              </div>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Unduh salinan lengkap seluruh database sistem atau hanya data inti (User, Role, Cabang &amp; Master Mitra) sebagai arsip sebelum perubahan besar.
            </p>
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              disabled={busyAction !== null}
              onClick={() => handleDownloadBackup("FULL")}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-sky-500 disabled:opacity-50 transition cursor-pointer"
            >
              <Download className="h-4 w-4" />
              {busyAction === "BACKUP_FULL"
                ? "Menyiapkan Backup..."
                : "Download Full Backup (.JSON)"}
            </button>
            <button
              type="button"
              disabled={busyAction !== null}
              onClick={() => handleDownloadBackup("CORE")}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-600 bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 disabled:opacity-50 transition cursor-pointer"
            >
              <FileJson className="h-4 w-4 text-amber-400" />
              {busyAction === "BACKUP_CORE"
                ? "Menyiapkan Backup Inti..."
                : "Backup Inti (User, Role & Master Saja)"}
            </button>
          </div>
        </div>

        {/* 2. RESTORE DATABASE */}
        <div className="rounded-2xl border border-slate-700 bg-slate-900 p-5 shadow-xl flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400">
                <Upload className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">2. Restore Database</h3>
                <p className="text-[11px] text-slate-400">Pulihkan dari file .JSON</p>
              </div>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Unggah file backup <code className="text-sky-300">.json</code> hasil ekspor PASMigranPro untuk mengembalikan kondisi data perusahaan beserta akun stafnya.
            </p>

            {restorePreview && (
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-[11px] text-emerald-200 space-y-1">
                <p className="font-bold text-white truncate">
                  File: {restorePreview.fileName}
                </p>
                <p>
                  CPMI: <strong>{restorePreview.snapshot.candidates?.length || 0}</strong> · User:{" "}
                  <strong>{restorePreview.snapshot.staffAccounts?.length || 0}</strong> · Cabang:{" "}
                  <strong>{restorePreview.snapshot.branches?.length || 0}</strong>
                </p>
              </div>
            )}
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-800">
            <label className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-slate-600 bg-slate-800/70 px-4 py-2.5 text-xs font-semibold text-slate-200 hover:border-emerald-400 hover:text-emerald-300 transition cursor-pointer">
              <Upload className="h-4 w-4" />
              Pilih File Backup (.JSON)
              <input
                type="file"
                accept=".json,application/json"
                onChange={handleSelectRestoreFile}
                className="hidden"
              />
            </label>

            {restorePreview && (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setRestorePreview(null)}
                  className="flex-1 rounded-xl border border-slate-600 px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={busyAction !== null}
                  onClick={handleConfirmRestore}
                  className="flex-1 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-500 disabled:opacity-50 cursor-pointer"
                >
                  {busyAction === "RESTORE" ? "Memulihkan..." : "Pulihkan Sekarang"}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 3. RESET & BERSIHKAN DATA */}
        <div className="rounded-2xl border border-rose-500/35 bg-slate-900 p-5 shadow-xl flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/20 text-rose-400">
                <ShieldAlert className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">3. Reset &amp; Bersihkan Data</h3>
                <p className="text-[11px] text-rose-300">Zona Sensitif (Superadmin Only)</p>
              </div>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Pilih <strong>Bersihkan Data Dummy</strong> saat siap memulai data operasional asli (akun Direktur Utama, 12 Staf, Role &amp; Master Data tetap utuh), atau kembalikan ke data contoh untuk pelatihan.
            </p>
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              disabled={busyAction !== null}
              onClick={() => {
                setConfirmKeyword("");
                setConfirmMode("CLEAN_PROD");
              }}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-rose-500 disabled:opacity-50 transition cursor-pointer"
            >
              <Trash2 className="h-4 w-4" />
              Bersihkan Data Dummy Operasional (Go-Live)
            </button>

            <button
              type="button"
              disabled={busyAction !== null}
              onClick={() => {
                setConfirmKeyword("");
                setConfirmMode("RESET_DEMO");
              }}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-2 text-xs font-semibold text-amber-300 hover:bg-amber-500/20 disabled:opacity-50 transition cursor-pointer"
            >
              <RotateCcw className="h-4 w-4" />
              Kembalikan Data Contoh (Reset Seed Awal)
            </button>
          </div>
        </div>
      </div>

      {/* Modal Konfirmasi Keamanan Reset */}
      {confirmMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-rose-500/50 bg-slate-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-500/20 text-rose-400">
                <RefreshCw className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  {confirmMode === "CLEAN_PROD"
                    ? "Konfirmasi Bersihkan Data Dummy"
                    : "Konfirmasi Reset ke Data Contoh"}
                </h3>
                <p className="mt-1 text-xs text-slate-300 leading-relaxed">
                  {confirmMode === "CLEAN_PROD"
                    ? "Seluruh data contoh (CPMI, Sponsor PL, Case, Lowongan, Kas/Invoice & Log Audit lama) akan dikosongkan. Direktur Utama, 12 Staf, Role RBAC, Profil PT & Master Data Referensi tetap dipertahankan."
                    : "Seluruh perubahan data akan digantikan oleh data contoh bawaan sistem (11 CPMI contoh, Sponsor contoh, beserta Direktur Utama & ke-12 staf divisi)."}
                </p>
              </div>
            </div>

            <div className="space-y-1.5 text-xs">
              <label className="block font-semibold text-slate-300">
                Ketik{" "}
                <strong className="font-mono text-rose-300">
                  {confirmMode === "CLEAN_PROD" ? "BERSIHKAN" : "RESET DEMO"}
                </strong>{" "}
                untuk melanjutkan:
              </label>
              <input
                type="text"
                value={confirmKeyword}
                onChange={(e) => setConfirmKeyword(e.target.value)}
                placeholder={confirmMode === "CLEAN_PROD" ? "BERSIHKAN" : "RESET DEMO"}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white font-mono focus:border-rose-500 focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setConfirmMode(null);
                  setConfirmKeyword("");
                }}
                className="rounded-lg border border-slate-600 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={
                  busyAction !== null ||
                  confirmKeyword.trim().toUpperCase() !==
                    (confirmMode === "CLEAN_PROD" ? "BERSIHKAN" : "RESET DEMO")
                }
                onClick={handleExecuteReset}
                className="rounded-lg bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-500 disabled:opacity-40 cursor-pointer"
              >
                {busyAction ? "Memproses..." : "Eksekusi Sekarang"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
