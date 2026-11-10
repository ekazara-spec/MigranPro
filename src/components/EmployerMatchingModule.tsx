"use client";

import React, { useState } from "react";
import {
  UserCheck,
  Video,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  Plus,
  Search,
  ExternalLink,
  Users,
  Building2,
  Lock,
  Sparkles,
  Phone,
  DollarSign,
  Briefcase,
  AlertCircle,
} from "lucide-react";
import {
  Candidate,
  EmployerInterview,
  ForeignAgency,
  InterviewStatus,
  JobVacancy,
  UserRole,
} from "@/lib/types";

interface EmployerMatchingModuleProps {
  employerInterviews: EmployerInterview[];
  candidates: Candidate[];
  vacancies: JobVacancy[];
  foreignAgencies?: ForeignAgency[];
  isBranchViewOnly: boolean;
  actorRole: UserRole;
  actorName: string;
  onRefreshDb: () => void;
}

export default function EmployerMatchingModule({
  employerInterviews,
  candidates,
  vacancies,
  foreignAgencies = [],
  isBranchViewOnly,
  actorRole,
  actorName,
  onRefreshDb,
}: EmployerMatchingModuleProps) {
  const [activeSubTab, setActiveSubTab] = useState<"jadwal" | "pool">("jadwal");

  // Modal Buat Jadwal Interview Baru
  const [showAddModal, setShowAddModal] = useState(false);
  const [interviewForm, setInterviewForm] = useState({
    candidateId: candidates[0]?.id || "",
    candidateName: candidates[0]?.fullName || "",
    syarikahName: "Maharah Human Resources Co. (KSA)",
    jobSector: "Penata Laksana Rumah Tangga (PLRT / Housemaid)",
    interviewDate: new Date(Date.now() + 86400000).toISOString().split("T")[0],
    interviewTimeKsa: "11:30 KSA (15:30 WIB)",
    interviewMethod: "ZOOM" as "ZOOM" | "GOOGLE_MEET" | "WHATSAPP_VIDEO",
    meetingLinkOrPhone: "https://zoom.us/j/89123049182",
    interviewerName: "Sheikh Abdulrahman Al-Otaibi",
    interpreterName: "Ust. Fauzan Hakim (P3MI Pusat)",
    notes: "Kandidat mampu bahasa Arab dasar, disiapkan di ruang interview kantor pusat",
  });

  // Modal Update Hasil Interview
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [selectedInterview, setSelectedInterview] = useState<EmployerInterview | null>(null);
  const [resultStatus, setResultStatus] = useState<InterviewStatus>("PASSED");
  const [agreedSalarySar, setAgreedSalarySar] = useState<number>(1500);
  const [resultNotes, setResultNotes] = useState<string>("Kandidat lolos wawancara, majikan menyepakati gaji 1.500 SAR dan bersedia proses e-Visa Musaned segera.");

  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Kandidat yang siap untuk interview majikan (LEAD, PROSPECT, CPMI, READY)
  const readyCandidatePool = candidates.filter((c) => {
    return (
      c.stage === "LEAD" ||
      c.stage === "PROSPECT" ||
      c.stage === "CPMI" ||
      c.stage === "READY"
    );
  });

  // Statistik Wawancara
  const totalInterviews = employerInterviews.length;
  const passedCount = employerInterviews.filter((i) => i.status === "PASSED").length;
  const scheduledCount = employerInterviews.filter((i) => i.status === "SCHEDULED").length;
  const failedCount = employerInterviews.filter((i) => i.status === "FAILED").length;

  function openScheduleForCandidate(cand: Candidate) {
    setInterviewForm({
      candidateId: cand.id,
      candidateName: cand.fullName,
      syarikahName: cand.agencyPartner || "Maharah Human Resources Co. (KSA)",
      jobSector: cand.jobSector || "Penata Laksana Rumah Tangga (PLRT)",
      interviewDate: new Date(Date.now() + 86400000).toISOString().split("T")[0],
      interviewTimeKsa: "11:30 KSA (15:30 WIB)",
      interviewMethod: "ZOOM",
      meetingLinkOrPhone: "https://zoom.us/j/89123049182",
      interviewerName: "Perwakilan Syarikah KSA",
      interpreterName: "Ust. Fauzan Hakim (P3MI Pusat)",
      notes: `Kandidat siap seleksi untuk penempatan ${cand.destinationCountry}`,
    });
    setShowAddModal(true);
  }

  async function handleSaveInterview(e: React.FormEvent) {
    e.preventDefault();
    if (isBranchViewOnly) {
      alert("Akses Ditolak: Penjadwalan wawancara hanya dapat dieksekusi oleh Admin Pusat.");
      return;
    }
    setSaving(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/p3mi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "CREATE_EMPLOYER_INTERVIEW",
          actorName,
          actorRole,
          payload: interviewForm,
        }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Gagal menjadwalkan wawancara.");

      setFeedback({
        type: "success",
        text: `Jadwal wawancara video call untuk ${interviewForm.candidateName} berhasil dibuat & notifikasi WhatsApp terkirim!`,
      });
      setShowAddModal(false);
      onRefreshDb();
    } catch (err: unknown) {
      setFeedback({ type: "error", text: err instanceof Error ? err.message : "Gagal menyimpan." });
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdateResult(e: React.FormEvent) {
    e.preventDefault();
    if (isBranchViewOnly) {
      alert("Akses Ditolak: Keputusan hasil seleksi wawancara hanya dapat dieksekusi oleh Admin Pusat.");
      return;
    }
    if (!selectedInterview) return;
    setSaving(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/p3mi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "UPDATE_EMPLOYER_INTERVIEW",
          actorName,
          actorRole,
          payload: {
            interviewId: selectedInterview.id,
            status: resultStatus,
            agreedSalarySar,
            notes: resultNotes,
          },
        }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Gagal memperbarui hasil wawancara.");

      setFeedback({
        type: "success",
        text: `Hasil wawancara ${selectedInterview.candidateName} diperbarui (${resultStatus})!`,
      });
      setShowUpdateModal(false);
      setSelectedInterview(null);
      onRefreshDb();
    } catch (err: unknown) {
      setFeedback({ type: "error", text: err instanceof Error ? err.message : "Gagal menyimpan." });
    } finally {
      setSaving(false);
    }
  }

  const filteredInterviews = employerInterviews.filter((item) => {
    const matchesStatus = filterStatus === "ALL" || item.status === filterStatus;
    const matchesSearch =
      item.candidateName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.syarikahName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.jobSector.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Banner Hak Akses Cabang */}
      {isBranchViewOnly && (
        <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-amber-200">
          <div className="flex items-center gap-3">
            <Lock className="h-5 w-5 shrink-0 text-amber-400" />
            <div className="text-sm">
              <span className="font-bold">Mode Pantau Cabang (View-Only): </span>
              Penjadwalan wawancara video call dengan majikan/Syarikah luar negeri dan keputusan kelulusan dieksekusi oleh Admin Pusat & Interpreter P3MI. Cabang dapat memantau jadwal dan hasil seleksi.
            </div>
          </div>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-700/60 bg-gradient-to-r from-slate-900 via-sky-950/40 to-slate-900 p-6 shadow-xl lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-sky-400">
            <UserCheck className="h-4 w-4" />
            Modul 5: Seleksi & Wawancara Majikan (Matching)
          </div>
          <h2 className="mt-1 text-2xl font-black text-white">
            Job Matching CPMI vs Job Order & Jadwal Interview Video Call
          </h2>
          <p className="mt-1 text-sm text-slate-300">
            Pencocokan kriteria calon pekerja dengan permintaan Syarikah Timur Tengah (SPSK), pengaturan sesi video call (Zoom / Google Meet), pendampingan interpreter bahasa Arab, dan rekap kelulusan.
          </p>
        </div>

        {/* Sub-tab Switcher */}
        <div className="flex rounded-xl border border-slate-700 bg-slate-800 p-1">
          <button
            onClick={() => setActiveSubTab("jadwal")}
            className={`rounded-lg px-4 py-2 text-xs font-bold transition ${
              activeSubTab === "jadwal"
                ? "bg-sky-500 text-slate-950 shadow"
                : "text-slate-300 hover:text-white"
            }`}
          >
            1. Jadwal & Hasil Wawancara ({employerInterviews.length})
          </button>
          <button
            onClick={() => setActiveSubTab("pool")}
            className={`rounded-lg px-4 py-2 text-xs font-bold transition ${
              activeSubTab === "pool"
                ? "bg-sky-500 text-slate-950 shadow"
                : "text-slate-300 hover:text-white"
            }`}
          >
            2. Pool Matching CPMI ({readyCandidatePool.length})
          </button>
        </div>
      </div>

      {feedback && (
        <div
          className={`rounded-xl border p-4 text-sm ${
            feedback.type === "success"
              ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-200"
              : "border-rose-500/40 bg-rose-500/10 text-rose-200"
          }`}
        >
          <div className="flex items-center justify-between">
            <span>{feedback.text}</span>
            <button
              onClick={() => setFeedback(null)}
              className="text-xs font-semibold underline hover:text-white"
            >
              Tutup
            </button>
          </div>
        </div>
      )}

      {/* --- SUB-TAB 1: JADWAL & HASIL WAWANCARA --- */}
      {activeSubTab === "jadwal" && (
        <div className="space-y-6">
          {/* Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="rounded-2xl border border-slate-700/60 bg-slate-800/80 p-5 shadow-lg">
              <span className="text-xs font-bold text-slate-400 uppercase">Total Sesi Wawancara</span>
              <p className="mt-2 text-2xl font-black text-white">{totalInterviews}</p>
              <p className="mt-1 text-[11px] text-slate-400">Diagendakan dengan Syarikah KSA/Timteng</p>
            </div>

            <div className="rounded-2xl border border-slate-700/60 bg-slate-800/80 p-5 shadow-lg">
              <span className="text-xs font-bold text-slate-400 uppercase">Lolos Seleksi Majikan</span>
              <p className="mt-2 text-2xl font-black text-emerald-400">{passedCount}</p>
              <p className="mt-1 text-[11px] text-slate-400">Siap proses penerbitan Visa Kerja SPSK</p>
            </div>

            <div className="rounded-2xl border border-slate-700/60 bg-slate-800/80 p-5 shadow-lg">
              <span className="text-xs font-bold text-slate-400 uppercase">Terjadwal (Akan Datang)</span>
              <p className="mt-2 text-2xl font-black text-sky-400">{scheduledCount}</p>
              <p className="mt-1 text-[11px] text-slate-400">Menunggu sesi video call berlangsung</p>
            </div>

            <div className="rounded-2xl border border-slate-700/60 bg-slate-800/80 p-5 shadow-lg">
              <span className="text-xs font-bold text-slate-400 uppercase">Reseleksi / Belum Lolos</span>
              <p className="mt-2 text-2xl font-black text-amber-400">{failedCount}</p>
              <p className="mt-1 text-[11px] text-slate-400">Dialihkan ke job order / majikan lain</p>
            </div>
          </div>

          {/* Tabel Jadwal Wawancara Video Call */}
          <div className="rounded-2xl border border-slate-700/60 bg-slate-800/80 p-6 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-700 pb-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Video className="h-5 w-5 text-sky-400" />
                  Jadwal & Rekap Hasil Interview Video Call ({filteredInterviews.length} Wawancara)
                </h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  Dilengkapi pendampingan interpreter bahasa Arab di kantor pusat saat wawancara.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari CPMI / Syarikah..."
                    className="rounded-lg border border-slate-700 bg-slate-900 pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-400"
                  />
                </div>

                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-white"
                >
                  <option value="ALL">Semua Status</option>
                  <option value="SCHEDULED">SCHEDULED (Terjadwal)</option>
                  <option value="PASSED">PASSED (Lolos)</option>
                  <option value="FAILED">FAILED (Gagal/Reseleksi)</option>
                </select>

                {!isBranchViewOnly && (
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2 text-xs font-bold text-white hover:bg-sky-500 transition"
                  >
                    <Plus className="h-4 w-4" />
                    Jadwalkan Wawancara
                  </button>
                )}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-900/80 text-[10px] uppercase tracking-wider text-slate-400 border-b border-slate-700">
                  <tr>
                    <th className="px-4 py-3">Jadwal & Waktu</th>
                    <th className="px-4 py-3">Kandidat CPMI</th>
                    <th className="px-4 py-3">Syarikah & Posisi</th>
                    <th className="px-4 py-3">Metode & Link Video</th>
                    <th className="px-4 py-3">Interpreter & Pewawancara</th>
                    <th className="px-4 py-3 text-center">Hasil Seleksi</th>
                    <th className="px-4 py-3 text-right">Gaji SAR</th>
                    <th className="px-4 py-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/60">
                  {filteredInterviews.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-700/40 transition">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="font-bold text-white font-mono">{item.interviewDate}</div>
                        <div className="text-[10px] text-amber-300 flex items-center gap-1 mt-0.5">
                          <Clock className="h-3 w-3" />
                          {item.interviewTimeKsa}
                        </div>
                      </td>
                      <td className="px-4 py-3 font-bold text-white whitespace-nowrap">
                        {item.candidateName}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="font-semibold text-white">{item.syarikahName}</div>
                        <div className="text-[10px] text-slate-400">{item.jobSector}</div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="rounded bg-slate-700 px-2 py-0.5 text-[10px] font-bold text-sky-300">
                          {item.interviewMethod}
                        </span>
                        {item.meetingLinkOrPhone && (
                          <a
                            href={item.meetingLinkOrPhone}
                            target="_blank"
                            rel="noreferrer"
                            className="block text-[10px] text-sky-400 underline hover:text-sky-300 mt-0.5 max-w-[140px] truncate"
                          >
                            Buka Link Video Call
                          </a>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-[11px]">
                        <div>Pewawancara: {item.interviewerName}</div>
                        <div className="text-slate-400">Pendamping: {item.interpreterName}</div>
                      </td>
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                            item.status === "PASSED"
                              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                              : item.status === "FAILED"
                              ? "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                              : "bg-sky-500/20 text-sky-300 border border-sky-500/40"
                          }`}
                        >
                          {item.status === "PASSED"
                            ? "✓ LOLOS SELEKSI"
                            : item.status === "FAILED"
                            ? "✗ GAGAL / RESELEKSI"
                            : "TERJADWAL"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-emerald-400 whitespace-nowrap">
                        {item.agreedSalarySar ? `${item.agreedSalarySar.toLocaleString("id-ID")} SAR` : "-"}
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        {!isBranchViewOnly ? (
                          <button
                            onClick={() => {
                              setSelectedInterview(item);
                              setResultStatus(item.status);
                              setAgreedSalarySar(item.agreedSalarySar || 1500);
                              setResultNotes(item.notes || "");
                              setShowUpdateModal(true);
                            }}
                            className="rounded-lg border border-sky-500/40 bg-sky-500/10 px-2.5 py-1 text-[11px] font-semibold text-sky-300 hover:bg-sky-500/20"
                          >
                            Update Hasil
                          </button>
                        ) : (
                          <span className="text-xs text-slate-500">View</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* --- SUB-TAB 2: POOL MATCHING CPMI VS JOB ORDER --- */}
      {activeSubTab === "pool" && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-700/60 bg-slate-800/80 p-6 shadow-xl space-y-4">
            <div className="border-b border-slate-700 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Users className="h-5 w-5 text-sky-400" />
                Pool Kandidat CPMI Siap Kerja ({readyCandidatePool.length} Kandidat)
              </h3>
              <p className="text-xs text-slate-300 mt-0.5">
                Kandidat yang telah melengkapi berkas dan dinyatakan fit, siap dipasangkan dengan Job Order Syarikah Timur Tengah.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {readyCandidatePool.map((c) => (
                <div
                  key={c.id}
                  className="rounded-xl border border-slate-700 bg-slate-900/70 p-4 space-y-3 hover:border-slate-600 transition"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-mono text-[10px] text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded font-bold">
                        {c.regNumber}
                      </span>
                      <h4 className="font-bold text-white mt-1 text-sm">{c.fullName}</h4>
                      <p className="text-xs text-slate-400">
                        Usia: {c.registrationForm?.realAge || 26} Tahun · {c.destinationCountry}
                      </p>
                    </div>
                    <span className="rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-bold">
                      {c.stage}
                    </span>
                  </div>

                  <div className="rounded-lg border border-slate-800 bg-slate-800/50 p-2.5 text-xs text-slate-300 space-y-1">
                    <div>
                      <span className="text-slate-400">Posisi:</span>{" "}
                      <span className="font-semibold text-white">{c.jobSector}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Mitra Syarikah:</span>{" "}
                      <span className="font-semibold text-amber-300">
                        {c.agencyPartner || "Maharah Human Resources"}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400">Bahasa Target:</span>{" "}
                      {c.training?.targetLanguage || "Arab"}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-800 flex justify-end">
                    {!isBranchViewOnly ? (
                      <button
                        onClick={() => openScheduleForCandidate(c)}
                        className="flex items-center gap-1.5 rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-sky-500 transition"
                      >
                        <Video className="h-3.5 w-3.5" />
                        Jadwalkan Interview
                      </button>
                    ) : (
                      <span className="text-xs text-slate-500">View Only</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL BUAT JADWAL INTERVIEW --- */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-700 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Video className="h-5 w-5 text-sky-400" />
                Jadwalkan Wawancara Video Call Majikan
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleSaveInterview} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Kandidat CPMI</label>
                <select
                  value={interviewForm.candidateId}
                  onChange={(e) => {
                    const c = candidates.find((x) => x.id === e.target.value);
                    if (c) {
                      setInterviewForm({
                        ...interviewForm,
                        candidateId: c.id,
                        candidateName: c.fullName,
                        jobSector: c.jobSector,
                      });
                    }
                  }}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white font-bold"
                >
                  {candidates.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.regNumber} — {c.fullName} ({c.jobSector})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Nama Syarikah Mitra</label>
                  <input
                    type="text"
                    required
                    value={interviewForm.syarikahName}
                    onChange={(e) => setInterviewForm({ ...interviewForm, syarikahName: e.target.value })}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Posisi / Sektor</label>
                  <input
                    type="text"
                    required
                    value={interviewForm.jobSector}
                    onChange={(e) => setInterviewForm({ ...interviewForm, jobSector: e.target.value })}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Tanggal Wawancara</label>
                  <input
                    type="date"
                    required
                    value={interviewForm.interviewDate}
                    onChange={(e) => setInterviewForm({ ...interviewForm, interviewDate: e.target.value })}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Waktu Wawancara (KSA / WIB)</label>
                  <input
                    type="text"
                    required
                    value={interviewForm.interviewTimeKsa}
                    onChange={(e) => setInterviewForm({ ...interviewForm, interviewTimeKsa: e.target.value })}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white"
                    placeholder="11:30 KSA (15:30 WIB)"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Platform Video Call</label>
                  <select
                    value={interviewForm.interviewMethod}
                    onChange={(e) => setInterviewForm({ ...interviewForm, interviewMethod: e.target.value as any })}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white"
                  >
                    <option value="ZOOM">Zoom Meeting</option>
                    <option value="GOOGLE_MEET">Google Meet</option>
                    <option value="WHATSAPP_VIDEO">WhatsApp Video Call</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Link / No Kontak</label>
                  <input
                    type="text"
                    required
                    value={interviewForm.meetingLinkOrPhone}
                    onChange={(e) => setInterviewForm({ ...interviewForm, meetingLinkOrPhone: e.target.value })}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white"
                    placeholder="https://zoom.us/j/..."
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Pewawancara (Majikan/HR)</label>
                  <input
                    type="text"
                    required
                    value={interviewForm.interviewerName}
                    onChange={(e) => setInterviewForm({ ...interviewForm, interviewerName: e.target.value })}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white"
                    placeholder="Sheikh Abdulrahman Al-Otaibi"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Petugas Interpreter Pendamping</label>
                  <input
                    type="text"
                    required
                    value={interviewForm.interpreterName}
                    onChange={(e) => setInterviewForm({ ...interviewForm, interpreterName: e.target.value })}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white"
                    placeholder="Ust. Fauzan Hakim (P3MI Pusat)"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Catatan Persiapan</label>
                <textarea
                  rows={2}
                  value={interviewForm.notes}
                  onChange={(e) => setInterviewForm({ ...interviewForm, notes: e.target.value })}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white"
                  placeholder="Instruksi untuk CPMI & briefing bahasa"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-700">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-lg border border-slate-600 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-sky-600 px-5 py-2 text-xs font-bold text-white hover:bg-sky-500 disabled:opacity-50"
                >
                  {saving ? "Menjadwalkan..." : "Jadwalkan & Kirim WA"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL UPDATE HASIL INTERVIEW --- */}
      {showUpdateModal && selectedInterview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-700 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-emerald-400" />
                Update Hasil Wawancara Majikan
              </h3>
              <button onClick={() => setShowUpdateModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleUpdateResult} className="space-y-4 text-xs">
              <div className="rounded-lg border border-slate-700 bg-slate-800 p-3 space-y-1">
                <p className="font-bold text-white">{selectedInterview.candidateName}</p>
                <p className="text-slate-400">Syarikah: {selectedInterview.syarikahName} ({selectedInterview.jobSector})</p>
                <p className="text-sky-400 font-mono">Jadwal: {selectedInterview.interviewDate} ({selectedInterview.interviewTimeKsa})</p>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Keputusan Hasil Seleksi</label>
                <select
                  value={resultStatus}
                  onChange={(e) => setResultStatus(e.target.value as any)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white font-bold"
                >
                  <option value="PASSED">✓ LOLOS SELEKSI (Lanjut Proses Visa SPSK)</option>
                  <option value="FAILED">✗ GAGAL / PERLU RESELEKSI MAJIKAN LAIN</option>
                  <option value="SCHEDULED">TERJADWAL / TUNDA</option>
                </select>
              </div>

              {resultStatus === "PASSED" && (
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Gaji Disepakati (SAR / Bulan)</label>
                  <input
                    type="number"
                    min="1000"
                    value={agreedSalarySar}
                    onChange={(e) => setAgreedSalarySar(Number(e.target.value))}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white font-mono text-sm font-bold"
                  />
                  <p className="text-[10px] text-slate-400 mt-0.5">Standar minimal SPSK Arab Saudi: 1.500 SAR</p>
                </div>
              )}

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Catatan Hasil Wawancara</label>
                <textarea
                  rows={3}
                  value={resultNotes}
                  onChange={(e) => setResultNotes(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white"
                  placeholder="Catatan keahlian, preferensi majikan, dll."
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-700">
                <button
                  type="button"
                  onClick={() => setShowUpdateModal(false)}
                  className="rounded-lg border border-slate-600 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-emerald-600 px-5 py-2 text-xs font-bold text-white hover:bg-emerald-500 disabled:opacity-50"
                >
                  {saving ? "Menyimpan..." : "Simpan Hasil & Kirim Notifikasi"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
