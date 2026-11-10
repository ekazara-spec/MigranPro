"use client";

import React, { useState } from "react";
import {
  MessageSquare,
  Send,
  ExternalLink,
  Users,
  CheckCircle2,
  Clock,
  Phone,
  Search,
  Filter,
  Sparkles,
  Lock,
  RefreshCw,
  Bell,
  Building2,
} from "lucide-react";
import { Candidate, Sponsor, UserRole, WhatsAppMessageType, WhatsAppNotification } from "@/lib/types";

interface WhatsAppGatewayModuleProps {
  whatsAppLogs: WhatsAppNotification[];
  candidates: Candidate[];
  sponsors: Sponsor[];
  isBranchViewOnly: boolean;
  actorRole: UserRole;
  actorName: string;
  onRefreshDb: () => void;
}

export default function WhatsAppGatewayModule({
  whatsAppLogs,
  candidates,
  sponsors,
  isBranchViewOnly,
  actorRole,
  actorName,
  onRefreshDb,
}: WhatsAppGatewayModuleProps) {
  const [targetType, setTargetType] = useState<"CPMI" | "SPONSOR" | "CUSTOM">("CPMI");
  const [selectedCandidateId, setSelectedCandidateId] = useState<string>(candidates[0]?.id || "");
  const [selectedSponsorId, setSelectedSponsorId] = useState<string>(sponsors[0]?.id || "");
  const [messageType, setMessageType] = useState<WhatsAppMessageType>("STAGE_UPDATE");
  
  const [recipientPhone, setRecipientPhone] = useState<string>(candidates[0]?.phone || "081223344551");
  const [recipientName, setRecipientName] = useState<string>(candidates[0]?.fullName || "Siti Aminah");
  const [messageTitle, setMessageTitle] = useState<string>("Pemberitahuan Status Medical FIT Pra-Terbang");
  const [messageBody, setMessageBody] = useState<string>(
    `Yth. Sdri Siti Aminah, Selamat! Hasil Medical Check-Up Pra-Terbang Anda di Klinik Mitra dinyatakan FIT. Berkas Anda kini diproses untuk penerbitan Paspor & Pengajuan Visa Kerja Arab Saudi (Zero Cost Syarikah). Tetap jaga kesehatan dan stand by.`
  );

  const [searchQuery, setSearchQuery] = useState("");
  const [filterRole, setFilterRole] = useState<string>("ALL");
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Template Generator
  function applyTemplate(type: WhatsAppMessageType, c?: Candidate, sp?: Sponsor) {
    setMessageType(type);
    if (type === "STAGE_UPDATE") {
      const name = c?.fullName || "Calon PMI";
      setMessageTitle(`Pemberitahuan Tahapan: Medical FIT & Paspor`);
      setMessageBody(
        `Yth. Sdri ${name}, Selamat! Berkas dokumen dan tahapan Anda di PT. Panca Banyu Ajisakti telah dinyatakan LENGKAP & FIT. Berkas kini diproses ke kedutaan untuk penerbitan Visa Kerja Timur Tengah (Zero Cost). Tetap stand by.`
      );
    } else if (type === "COMMISSION_PAID") {
      const spName = sp?.name || "Bpk/Ibu Sponsor";
      const cName = c?.fullName || "CPMI";
      setMessageTitle(`Pencairan Dana Komisi Sponsor`);
      setMessageBody(
        `Yth. ${spName} (Sponsor), Dana termin komisi sponsor untuk CPMI an. ${cName} telah berhasil ditransfer oleh Kasir Pusat PT. Panca Banyu Ajisakti. Silakan periksa mutasi rekening Anda. Terima kasih atas kerjasamanya.`
      );
    } else if (type === "EXPIRY_REMINDER") {
      const name = c?.fullName || "Calon PMI";
      setMessageTitle(`Peringatan Masa Berlaku Dokumen H-30`);
      setMessageBody(
        `PENTING: Yth. Sdri ${name}, masa berlaku dokumen Paspor/Medical Anda tersisa kurang dari 30 hari. Tim Admin Pusat telah menyiapkan surat pengantar perpanjangan. Harap segera melapor ke kantor.`
      );
    } else if (type === "INTERVIEW_INVITE") {
      const name = c?.fullName || "Calon PMI";
      setMessageTitle(`Undangan Wawancara Video Call Syarikah`);
      setMessageBody(
        `Yth. Sdri ${name}, Anda dijadwalkan mengikuti sesi wawancara video call bersama perwakilan Syarikah Timur Tengah pada hari ini pukul 15:00 WIB. Petugas interpreter kami akan mendampingi Anda di kantor.`
      );
    } else {
      setMessageTitle(`Pengumuman Operasional P3MI`);
      setMessageBody(
        `Yth. Bpk/Ibu, salam dari PT. Panca Banyu Ajisakti. Berikut informasi terbaru terkait kelengkapan berkas penempatan tenaga kerja ke Kawasan Timur Tengah.`
      );
    }
  }

  function handleSelectCandidate(candId: string) {
    setSelectedCandidateId(candId);
    const c = candidates.find((x) => x.id === candId);
    if (c) {
      setRecipientName(c.fullName);
      setRecipientPhone(c.phone || "081223344551");
      applyTemplate(messageType, c);
    }
  }

  function handleSelectSponsor(spId: string) {
    setSelectedSponsorId(spId);
    const sp = sponsors.find((x) => x.id === spId);
    if (sp) {
      setRecipientName(sp.name);
      setRecipientPhone(sp.phone || "081298765432");
      const c = candidates.find((x) => x.id === selectedCandidateId);
      applyTemplate("COMMISSION_PAID", c, sp);
    }
  }

  async function handleSendGateway() {
    if (isBranchViewOnly) {
      alert("Akses Ditolak: Pengiriman notifikasi gateway operasional hanya dapat dieksekusi oleh Admin Pusat.");
      return;
    }

    if (!recipientPhone || !messageBody) {
      alert("Nomor telepon penerima dan isi pesan tidak boleh kosong.");
      return;
    }

    setSending(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/p3mi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "SEND_WHATSAPP_MESSAGE",
          actorName,
          actorRole,
          payload: {
            recipientPhone,
            recipientName,
            recipientRole: targetType === "CUSTOM" ? "CPMI" : targetType,
            candidateId: selectedCandidateId,
            candidateName: recipientName,
            messageType,
            title: messageTitle,
            messageBody,
          },
        }),
      });

      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Gagal mengirim pesan WhatsApp.");

      setFeedback({
        type: "success",
        text: `Notifikasi WhatsApp berhasil dikirim dan dicatat ke log (${recipientName})!`,
      });
      onRefreshDb();
    } catch (err: unknown) {
      setFeedback({
        type: "error",
        text: err instanceof Error ? err.message : "Terjadi kegagalan sistem.",
      });
    } finally {
      setSending(false);
    }
  }

  function handleOpenDirectWhatsApp() {
    let cleanPhone = recipientPhone.replace(/[^0-9]/g, "");
    if (cleanPhone.startsWith("0")) {
      cleanPhone = "62" + cleanPhone.slice(1);
    }
    const encodedText = encodeURIComponent(messageBody);
    window.open(`https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodedText}`, "_blank");
  }

  const filteredLogs = whatsAppLogs.filter((log) => {
    const matchesRole = filterRole === "ALL" || log.recipientRole === filterRole;
    const matchesSearch =
      log.recipientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.recipientPhone.includes(searchQuery) ||
      log.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesRole && matchesSearch;
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
              Pengiriman notifikasi otomatis WhatsApp Gateway terintegrasi dieksekusi secara terpusat oleh Admin Pusat / Kasir Pusat. Anda dapat melihat riwayat notifikasi yang telah dikirim ke CPMI & Sponsor binaan.
            </div>
          </div>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-700/60 bg-gradient-to-r from-slate-900 via-emerald-950/40 to-slate-900 p-6 shadow-xl lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-400">
            <MessageSquare className="h-4 w-4" />
            Modul 3: Integrasi WhatsApp Gateway Otomatis
          </div>
          <h2 className="mt-1 text-2xl font-black text-white">
            Notifikasi Otomatis & Direct WhatsApp CPMI / Sponsor
          </h2>
          <p className="mt-1 text-sm text-slate-300">
            Kirim update tahapan medical/visa, konfirmasi pencairan DP komisi sponsor, pengingat dokumen H-30, serta panggilan interview majikan langsung ke nomor HP WhatsApp resmi.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 px-3 py-1 text-xs font-bold text-emerald-300">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            Gateway Online (Ready)
          </span>
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

      {/* Panel Utama: Form Kirim Pesan & Template */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Kolom 1: Formulir Kirim Notifikasi */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-700/60 bg-slate-800/80 p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-700 pb-3">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Send className="h-4 w-4 text-emerald-400" />
              Kirim Pesan WhatsApp Gateway
            </h3>
            <span className="text-xs text-slate-400">Template Cepat Siap Pakai</span>
          </div>

          <div className="space-y-4 text-xs">
            {/* Pilihan Target Penerima */}
            <div>
              <label className="block text-slate-300 font-bold mb-1.5 uppercase">
                1. Pilih Kategori Penerima:
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setTargetType("CPMI");
                    handleSelectCandidate(selectedCandidateId);
                  }}
                  className={`flex-1 rounded-lg px-3 py-2 font-bold transition ${
                    targetType === "CPMI"
                      ? "bg-emerald-600 text-white shadow"
                      : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                  }`}
                >
                  Kandidat CPMI ({candidates.length})
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTargetType("SPONSOR");
                    handleSelectSponsor(selectedSponsorId);
                  }}
                  className={`flex-1 rounded-lg px-3 py-2 font-bold transition ${
                    targetType === "SPONSOR"
                      ? "bg-emerald-600 text-white shadow"
                      : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                  }`}
                >
                  Mitra Sponsor ({sponsors.length})
                </button>
                <button
                  type="button"
                  onClick={() => setTargetType("CUSTOM")}
                  className={`flex-1 rounded-lg px-3 py-2 font-bold transition ${
                    targetType === "CUSTOM"
                      ? "bg-emerald-600 text-white shadow"
                      : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                  }`}
                >
                  Nomor Kustom
                </button>
              </div>
            </div>

            {/* Dropdown CPMI / Sponsor */}
            {targetType === "CPMI" && (
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Pilih Data CPMI:
                </label>
                <select
                  value={selectedCandidateId}
                  onChange={(e) => handleSelectCandidate(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white"
                >
                  {candidates.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.regNumber} — {c.fullName} ({c.phone || "No HP Kosong"})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {targetType === "SPONSOR" && (
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Pilih Mitra Sponsor / PL:
                </label>
                <select
                  value={selectedSponsorId}
                  onChange={(e) => handleSelectSponsor(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white"
                >
                  {sponsors.map((sp) => (
                    <option key={sp.id} value={sp.id}>
                      {sp.code} — {sp.name} ({sp.phone})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Template Buttons */}
            <div>
              <label className="block text-slate-300 font-bold mb-1.5 uppercase">
                2. Pilih Template Pesan:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => applyTemplate("STAGE_UPDATE", candidates.find((c) => c.id === selectedCandidateId))}
                  className={`rounded-lg px-2.5 py-1.5 font-semibold text-[11px] transition text-left ${
                    messageType === "STAGE_UPDATE"
                      ? "bg-emerald-500 text-slate-950 font-bold shadow"
                      : "bg-slate-700 text-slate-200 hover:bg-slate-600"
                  }`}
                >
                  ✓ Lolos Medical / Tahapan
                </button>
                <button
                  type="button"
                  onClick={() => applyTemplate("COMMISSION_PAID", candidates.find((c) => c.id === selectedCandidateId), sponsors.find((s) => s.id === selectedSponsorId))}
                  className={`rounded-lg px-2.5 py-1.5 font-semibold text-[11px] transition text-left ${
                    messageType === "COMMISSION_PAID"
                      ? "bg-emerald-500 text-slate-950 font-bold shadow"
                      : "bg-slate-700 text-slate-200 hover:bg-slate-600"
                  }`}
                >
                  💰 Pencairan DP Sponsor
                </button>
                <button
                  type="button"
                  onClick={() => applyTemplate("EXPIRY_REMINDER", candidates.find((c) => c.id === selectedCandidateId))}
                  className={`rounded-lg px-2.5 py-1.5 font-semibold text-[11px] transition text-left ${
                    messageType === "EXPIRY_REMINDER"
                      ? "bg-emerald-500 text-slate-950 font-bold shadow"
                      : "bg-slate-700 text-slate-200 hover:bg-slate-600"
                  }`}
                >
                  ⚠️ Pengingat H-30 Dokumen
                </button>
                <button
                  type="button"
                  onClick={() => applyTemplate("INTERVIEW_INVITE", candidates.find((c) => c.id === selectedCandidateId))}
                  className={`rounded-lg px-2.5 py-1.5 font-semibold text-[11px] transition text-left ${
                    messageType === "INTERVIEW_INVITE"
                      ? "bg-emerald-500 text-slate-950 font-bold shadow"
                      : "bg-slate-700 text-slate-200 hover:bg-slate-600"
                  }`}
                >
                  📞 Undangan Interview KSA
                </button>
              </div>
            </div>

            {/* Data Penerima & Isi Pesan */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Nama Penerima</label>
                <input
                  type="text"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white"
                  placeholder="Nama Lengkap"
                />
              </div>
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Nomor WhatsApp (HP)</label>
                <input
                  type="text"
                  value={recipientPhone}
                  onChange={(e) => setRecipientPhone(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white"
                  placeholder="08xxxxxxxxxx"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Judul / Perihal Pesan</label>
              <input
                type="text"
                value={messageTitle}
                onChange={(e) => setMessageTitle(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white"
                placeholder="Perihal notifikasi"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Teks Pesan WhatsApp</label>
              <textarea
                rows={4}
                value={messageBody}
                onChange={(e) => setMessageBody(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white leading-relaxed font-sans"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-700">
              <button
                type="button"
                onClick={handleOpenDirectWhatsApp}
                className="flex items-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-2.5 text-xs font-bold text-emerald-300 hover:bg-emerald-500/20 transition cursor-pointer"
              >
                <ExternalLink className="h-4 w-4" />
                Buka Direct WhatsApp (Web / HP)
              </button>

              <button
                type="button"
                disabled={sending || isBranchViewOnly}
                onClick={handleSendGateway}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-emerald-500/20 hover:brightness-110 disabled:opacity-50 transition cursor-pointer"
              >
                <Send className="h-4 w-4" />
                {sending ? "Mengirim..." : "Kirim & Catat ke Gateway Log"}
              </button>
            </div>
          </div>
        </div>

        {/* Kolom 2: Live Preview Chat Bubble */}
        <div className="rounded-2xl border border-slate-700/60 bg-gradient-to-b from-slate-900 to-slate-800 p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-700 pb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-400" />
              Live Preview Tampilan WhatsApp
            </h3>
            <span className="text-[10px] text-emerald-400 font-mono">Mobile View</span>
          </div>

          <div className="rounded-xl bg-[#0b141a] p-4 border border-[#202c33] shadow-inner space-y-3 font-sans">
            <div className="flex items-center gap-2.5 border-b border-[#202c33] pb-2 text-slate-300 text-xs">
              <div className="h-8 w-8 rounded-full bg-emerald-700 text-white font-bold flex items-center justify-center text-xs">
                {recipientName ? recipientName.slice(0, 2).toUpperCase() : "WA"}
              </div>
              <div>
                <p className="font-bold text-white text-xs">{recipientName || "Penerima"}</p>
                <p className="text-[10px] text-slate-400">{recipientPhone || "0812xxxx"}</p>
              </div>
            </div>

            {/* Bubble Pesan WhatsApp Hijau */}
            <div className="flex justify-end">
              <div className="max-w-[90%] rounded-lg rounded-tr-none bg-[#005c4b] p-3 text-white text-xs shadow space-y-1.5">
                <p className="font-bold text-amber-300 text-[11px] border-b border-emerald-600/60 pb-1">
                  📢 {messageTitle}
                </p>
                <p className="whitespace-pre-line text-[11px] leading-relaxed text-slate-100">
                  {messageBody}
                </p>
                <div className="flex items-center justify-end gap-1 text-[9px] text-emerald-200 pt-1">
                  <span>10:15</span>
                  <CheckCircle2 className="h-3 w-3 text-sky-400" />
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-700 bg-slate-800/80 p-3 text-[11px] text-slate-300 space-y-1">
            <div className="font-bold text-white flex items-center gap-1.5">
              <Bell className="h-3.5 w-3.5 text-amber-400" />
              Integrasi Otomatis Sistem:
            </div>
            <p>
              Setiap kali Admin Pusat melakukan klik &quot;Lolos Medical&quot;, &quot;Cairkan DP Sponsor&quot;, atau &quot;Lolos Interview Majikan&quot;, sistem otomatis menerbitkan draft pesan WhatsApp ke antrean log.
            </p>
          </div>
        </div>
      </div>

      {/* Tabel Riwayat Log Notifikasi WhatsApp */}
      <div className="rounded-2xl border border-slate-700/60 bg-slate-800/80 p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-700 pb-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-emerald-400" />
              Riwayat Pengiriman Notifikasi WhatsApp ({filteredLogs.length} Pesan)
            </h3>
            <p className="text-xs text-slate-300 mt-0.5">
              Seluruh rekam jejak pesan ke CPMI dan Sponsor disimpan permanen untuk kepatuhan audit.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari penerima / judul..."
                className="rounded-lg border border-slate-700 bg-slate-900 pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-400"
              />
            </div>

            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-white"
            >
              <option value="ALL">Semua Peran</option>
              <option value="CPMI">Kandidat CPMI</option>
              <option value="SPONSOR">Sponsor / PL</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900/80 text-[10px] uppercase tracking-wider text-slate-400 border-b border-slate-700">
              <tr>
                <th className="px-4 py-3">Waktu Kirim</th>
                <th className="px-4 py-3">Penerima & Peran</th>
                <th className="px-4 py-3">No. WhatsApp</th>
                <th className="px-4 py-3">Kategori</th>
                <th className="px-4 py-3">Judul & Cuplikan Pesan</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-right">Direct Chat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/60">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-700/40 transition">
                  <td className="px-4 py-3 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                    {log.sentAt}
                  </td>
                  <td className="px-4 py-3 font-bold text-white whitespace-nowrap">
                    <div>{log.recipientName}</div>
                    <span
                      className={`inline-block mt-0.5 rounded px-1.5 py-0.2 text-[9px] font-bold ${
                        log.recipientRole === "SPONSOR"
                          ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                          : "bg-sky-500/20 text-sky-300 border border-sky-500/30"
                      }`}
                    >
                      {log.recipientRole}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-emerald-400 whitespace-nowrap">
                    {log.recipientPhone}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="rounded bg-slate-700 px-2 py-0.5 text-[10px] font-semibold text-slate-200">
                      {log.messageType}
                    </span>
                  </td>
                  <td className="px-4 py-3 max-w-xs">
                    <p className="font-semibold text-white truncate">{log.title}</p>
                    <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                      {log.messageBody}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-center whitespace-nowrap">
                    <span className="rounded-full bg-emerald-500/20 border border-emerald-500/40 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                      TERKIRIM
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <button
                      onClick={() => {
                        let clean = log.recipientPhone.replace(/[^0-9]/g, "");
                        if (clean.startsWith("0")) clean = "62" + clean.slice(1);
                        window.open(`https://api.whatsapp.com/send?phone=${clean}`, "_blank");
                      }}
                      className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-300 hover:bg-emerald-500/20"
                    >
                      Chat WA
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
