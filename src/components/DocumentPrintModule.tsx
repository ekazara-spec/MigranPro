"use client";

import React, { useState } from "react";
import {
  Printer,
  FileText,
  FileCheck2,
  Download,
  Users,
  Building2,
  Calendar,
  CheckCircle2,
  Lock,
  ExternalLink,
  ChevronRight,
  Sparkles,
  QrCode,
  ShieldCheck,
} from "lucide-react";
import { Candidate, MasterImmigrationOffice, TenantCompany } from "@/lib/types";

interface DocumentPrintModuleProps {
  candidates: Candidate[];
  activeTenant: TenantCompany | null;
  isBranchViewOnly: boolean;
  preselectedCandidateId?: string;
  onOpenSyarikahBiodata?: (candidate: Candidate) => void;
  masterImmigrationOffices?: MasterImmigrationOffice[];
}

export type DocTemplateType =
  | "PENGANTAR_PASPOR"
  | "REKOM_DESA"
  | "PK_RESMI"
  | "IZIN_KELUARGA"
  | "BIODATA_SYARIKAH";

export default function DocumentPrintModule({
  candidates,
  activeTenant,
  isBranchViewOnly,
  preselectedCandidateId,
  onOpenSyarikahBiodata,
  masterImmigrationOffices = [],
}: DocumentPrintModuleProps) {
  const [selectedCandidateId, setSelectedCandidateId] = useState<string>(
    preselectedCandidateId || candidates[0]?.id || ""
  );
  const [selectedDocType, setSelectedDocType] = useState<DocTemplateType>("PENGANTAR_PASPOR");
  const [selectedKanimId, setSelectedKanimId] = useState<string>(
    masterImmigrationOffices[0]?.id || ""
  );

  const selectedKanim = masterImmigrationOffices.find((k) => k.id === selectedKanimId) || masterImmigrationOffices[0] || null;

  const candidate = candidates.find((c) => c.id === selectedCandidateId) || candidates[0] || null;

  const tenantName = activeTenant?.name || "PT. PANCA BANYU AJISAKTI";
  const tenantLicense = activeTenant?.licenseNo || "SIP3MI NO. 502/MEN/2021";
  const tenantAddress = activeTenant?.address || "Jl. Kayu Manis No. 51, Jakarta Timur";
  const tenantPhone = activeTenant?.phone || "021-87901122";
  const tenantEmail = activeTenant?.email || "operasional@pancabanyuajisakti.co.id";
  const picName = activeTenant?.picName || "H. Bambang Wijaya, S.E.";

  const today = new Date();
  const dateFormatted = `${today.getDate()} ${
    [
      "Januari",
      "Februari",
      "Maret",
      "April",
      "Mei",
      "Juni",
      "Juli",
      "Agustus",
      "September",
      "Oktober",
      "November",
      "Desember",
    ][today.getMonth()]
  } ${today.getFullYear()}`;

  function handleTriggerPrint() {
    window.print();
  }

  return (
    <div className="space-y-6">
      {/* Non-Printable Header & Controls */}
      <div className="print:hidden space-y-4">
        <div className="flex flex-col gap-4 rounded-2xl border border-slate-700/60 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-6 shadow-xl lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400">
              <Printer className="h-4 w-4" />
              Modul 2: Cetak Dokumen Otomatis (PDF Generator)
            </div>
            <h2 className="mt-1 text-2xl font-black text-white">
              Cetak Berkas Resmi Penempatan & CV Syarikah
            </h2>
            <p className="mt-1 text-sm text-slate-300">
              Otomatisasi pembuatan surat pengantar paspor Imigrasi, surat rekomendasi izin desa, Perjanjian Penempatan (PK Resmi), izin keluarga, dan CV Syarikah Timur Tengah ber-Kop Surat P3MI.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleTriggerPrint}
              disabled={!candidate}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-emerald-500/20 hover:brightness-110 transition disabled:opacity-50 cursor-pointer"
            >
              <Printer className="h-4 w-4" />
              Cetak Dokumen Sekarang (PDF / Print)
            </button>
          </div>
        </div>

        {/* Filter Controls: Pilih CPMI & Jenis Dokumen */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 rounded-xl border border-slate-700/60 bg-slate-800/80 p-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">
              1. Pilih Calon Pekerja Migran Indonesia (CPMI):
            </label>
            <select
              value={selectedCandidateId}
              onChange={(e) => setSelectedCandidateId(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white font-semibold outline-none"
            >
              {candidates.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.regNumber} — {c.fullName} ({c.destinationCountry} - {c.stage})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">
              2. Pilih Jenis Dokumen Resmi:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setSelectedDocType("PENGANTAR_PASPOR")}
                className={`rounded-lg px-2.5 py-1.5 text-xs font-bold transition text-left ${
                  selectedDocType === "PENGANTAR_PASPOR"
                    ? "bg-amber-500 text-slate-950 shadow"
                    : "bg-slate-700 text-slate-200 hover:bg-slate-600"
                }`}
              >
                1. Pengantar Paspor
              </button>
              <button
                type="button"
                onClick={() => setSelectedDocType("REKOM_DESA")}
                className={`rounded-lg px-2.5 py-1.5 text-xs font-bold transition text-left ${
                  selectedDocType === "REKOM_DESA"
                    ? "bg-amber-500 text-slate-950 shadow"
                    : "bg-slate-700 text-slate-200 hover:bg-slate-600"
                }`}
              >
                2. Rekomendasi Desa
              </button>
              <button
                type="button"
                onClick={() => setSelectedDocType("PK_RESMI")}
                className={`rounded-lg px-2.5 py-1.5 text-xs font-bold transition text-left ${
                  selectedDocType === "PK_RESMI"
                    ? "bg-amber-500 text-slate-950 shadow"
                    : "bg-slate-700 text-slate-200 hover:bg-slate-600"
                }`}
              >
                3. PK Resmi P3MI
              </button>
              <button
                type="button"
                onClick={() => setSelectedDocType("IZIN_KELUARGA")}
                className={`rounded-lg px-2.5 py-1.5 text-xs font-bold transition text-left ${
                  selectedDocType === "IZIN_KELUARGA"
                    ? "bg-amber-500 text-slate-950 shadow"
                    : "bg-slate-700 text-slate-200 hover:bg-slate-600"
                }`}
              >
                4. Izin Suami/Wali
              </button>
              <button
                type="button"
                onClick={() => setSelectedDocType("BIODATA_SYARIKAH")}
                className={`rounded-lg px-2.5 py-1.5 text-xs font-bold transition text-left col-span-2 sm:col-span-1 ${
                  selectedDocType === "BIODATA_SYARIKAH"
                    ? "bg-sky-500 text-slate-950 shadow"
                    : "bg-slate-700 text-slate-200 hover:bg-slate-600"
                }`}
              >
                5. CV Syarikah KSA
              </button>
            </div>
          </div>
        </div>

        {/* Dynamic Selector Kanim jika memilih Surat Pengantar Paspor */}
        {selectedDocType === "PENGANTAR_PASPOR" && masterImmigrationOffices.length > 0 && (
          <div className="rounded-xl border border-sky-700/60 bg-sky-950/60 p-4">
            <label className="block text-xs font-bold text-sky-300 uppercase mb-1.5">
              🏛️ Pilih Kantor Imigrasi Tujuan (Terhubung Master Data Kanim):
            </label>
            <div className="flex flex-wrap items-center gap-3">
              <select
                value={selectedKanimId || selectedKanim?.id || ""}
                onChange={(e) => setSelectedKanimId(e.target.value)}
                className="flex-1 rounded-lg border border-sky-600 bg-slate-900 px-3 py-2 text-xs text-white font-semibold outline-none focus:ring-1 focus:ring-sky-400"
              >
                {masterImmigrationOffices
                  .filter((k) => k.active !== false)
                  .map((k) => (
                    <option key={k.id} value={k.id}>
                      {k.code} — {k.name} ({k.city}, {k.province})
                    </option>
                  ))}
              </select>
              {selectedKanim && (
                <span className="text-xs text-sky-200">
                  Pejabat: <strong className="text-white">{selectedKanim.headOfOfficeName || "-"}</strong> ({selectedKanim.headOfOfficeTitle || "Kepala Kanim"})
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Dokumen Paper Area (A4 Layout) */}
      {candidate ? (
        <div className="flex justify-center">
          <div className="w-full max-w-4xl rounded-2xl bg-white p-8 md:p-12 text-slate-900 shadow-2xl border border-slate-300 print:border-none print:shadow-none print:p-0 print:m-0 print:max-w-none text-sm font-sans">
            {/* KOP SURAT RESMI P3MI */}
            <div className="border-b-4 border-double border-slate-900 pb-4 text-center">
              <div className="flex items-center justify-between gap-4">
                {/* Logo Resmi P3MI (PT. Panca Banyu Ajisakti) */}
                <div className="h-20 w-24 shrink-0 flex items-center justify-center">
                  <img
                    src={activeTenant?.logoUrl || "/logo-panca-banyu.png"}
                    alt={`Logo ${tenantName}`}
                    width={90}
                    height={76}
                    style={{ width: 90, height: 76 }}
                    className="h-20 w-24 object-contain"
                  />
                </div>

                {/* Teks Legalitas Kop Surat Tengah */}
                <div className="flex-1 text-center">
                  <h1 className="text-xl md:text-2xl font-black tracking-wide uppercase text-slate-900">
                    {tenantName}
                  </h1>
                  <p className="text-xs md:text-sm font-bold text-slate-800">
                    SURAT IZIN PERUSAHAAN PENEMPATAN PEKERJA MIGRAN INDONESIA (SIP3MI)
                  </p>
                  <p className="text-xs font-mono font-bold text-sky-900 print:text-black">
                    {tenantLicense}
                  </p>
                  <p className="text-[11px] text-slate-700 font-medium mt-0.5">
                    Kantor Pusat: {tenantAddress} · Telp: {tenantPhone} · Email: {tenantEmail}
                  </p>
                </div>

                {/* Logo Resmi SISKOP2MI (KEMNAKER RI - SPSK) */}
                <div className="h-20 w-44 shrink-0 flex items-center justify-end">
                  <img
                    src="/logo-siskop2mi.svg"
                    alt="Logo Resmi SISKOP2MI Kemnaker RI"
                    width={176}
                    height={64}
                    style={{ width: 176, height: 64 }}
                    className="h-16 w-44 object-contain"
                  />
                </div>
              </div>
            </div>

            {/* KONTEN DOKUMEN: TEMPLATE 1 - SURAT PENGANTAR PASPOR */}
            {selectedDocType === "PENGANTAR_PASPOR" && (
              <div className="mt-6 space-y-4 leading-relaxed text-slate-800">
                <div className="flex justify-between text-xs">
                  <div>
                    <p><span className="font-bold">Nomor Surat:</span> 089/EXT-PAS/SP-IM/2026</p>
                    <p><span className="font-bold">Lampiran:</span> 1 (Satu) Berkas Persyaratan</p>
                    <p><span className="font-bold">Perihal:</span> <span className="font-bold underline">Permohonan Penerbitan Paspor RI Baru bagi Calon Pekerja Migran Indonesia (CPMI)</span></p>
                  </div>
                  <div className="text-right">
                    <p>Jakarta, {dateFormatted}</p>
                  </div>
                </div>

                <div className="mt-4">
                  <p className="font-bold">Kepada Yth.</p>
                  <p className="font-bold">{selectedKanim?.headOfOfficeTitle || "Kepala Kantor Imigrasi"}</p>
                  <p className="font-bold text-slate-900">{selectedKanim?.name || "Kantor Imigrasi Kelas I / Non TPI"}</p>
                  <p className="text-xs text-slate-600">{selectedKanim?.address || "Di Tempat"}</p>
                  <p className="text-xs font-semibold text-slate-800">
                    di {selectedKanim ? selectedKanim.city : "Tempat"}
                  </p>
                </div>

                <p className="text-justify">
                  Dengan hormat,
                  <br />
                  Sehubungan dengan program penempatan Pekerja Migran Indonesia (PMI) ke Kawasan Timur Tengah secara resmi dan berkekuatan hukum, bersama surat ini kami dari <strong>{tenantName}</strong> selaku P3MI berizin resmi Kemnaker RI, mengajukan permohonan pembuatan Paspor RI Baru bagi Calon Pekerja Migran Indonesia kami dengan data sebagai berikut:
                </p>

                <div className="my-3 rounded-lg border border-slate-300 bg-slate-50 p-4 text-xs space-y-2">
                  <div className="grid grid-cols-3">
                    <span className="font-bold text-slate-600">Nomor Registrasi Sistem</span>
                    <span className="col-span-2 font-mono font-bold text-slate-900">: {candidate.regNumber}</span>
                  </div>
                  <div className="grid grid-cols-3">
                    <span className="font-bold text-slate-600">Nama Lengkap</span>
                    <span className="col-span-2 font-bold text-slate-900">: {candidate.fullName}</span>
                  </div>
                  <div className="grid grid-cols-3">
                    <span className="font-bold text-slate-600">NIK (Nomor Induk Kependudukan)</span>
                    <span className="col-span-2 font-mono">: {candidate.nik || "3212155408980001"}</span>
                  </div>
                  <div className="grid grid-cols-3">
                    <span className="font-bold text-slate-600">Tempat, Tanggal Lahir</span>
                    <span className="col-span-2">
                      : {candidate.birthPlace ? `${candidate.birthPlace}, ${candidate.birthDate || ""}` : (candidate.birthDate || "Indramayu, 14 Agustus 1998")}
                    </span>
                  </div>
                  <div className="grid grid-cols-3">
                    <span className="font-bold text-slate-600">Jenis Kelamin / Agama</span>
                    <span className="col-span-2">
                      : {candidate.gender === "L" ? "Laki-laki" : "Perempuan"} / {candidate.registrationForm?.religion || "Islam"}
                    </span>
                  </div>
                  <div className="grid grid-cols-3">
                    <span className="font-bold text-slate-600">Alamat KTP</span>
                    <span className="col-span-2">: {candidate.address || "Desa Jatibarang Baru, Kec. Jatibarang, Kab. Indramayu, Jawa Barat"}</span>
                  </div>
                  <div className="grid grid-cols-3">
                    <span className="font-bold text-slate-600">Negara Tujuan Penempatan</span>
                    <span className="col-span-2 font-bold text-sky-800">: {candidate.destinationCountry} (Kawasan Timur Tengah)</span>
                  </div>
                  <div className="grid grid-cols-3">
                    <span className="font-bold text-slate-600">Jabatan / Pekerjaan</span>
                    <span className="col-span-2">: {candidate.jobSector}</span>
                  </div>
                  <div className="grid grid-cols-3">
                    <span className="font-bold text-slate-600">Skema Pembiayaan</span>
                    <span className="col-span-2 font-bold text-emerald-700">: Zero Cost Majikan / Syarikah Luar Negeri</span>
                  </div>
                </div>

                <p className="text-justify">
                  P3MI kami menjamin sepenuhnya bahwa CPMI tersebut di atas adalah benar terdaftar secara sah pada Sistem Penempatan dan Perlindungan PMI (SISKOP2MI) Kemnaker RI, tidak akan dialihkan ke luar negeri secara non-prosedural, dan seluruh biaya penerbitan paspor ditanggung sesuai skema penempatan resmi.
                </p>

                <p>
                  Demikian surat pengantar permohonan ini kami sampaikan, atas bantuan dan kerja sama Bapak/Ibu {selectedKanim?.headOfOfficeTitle || "Kepala Kantor Imigrasi"} beserta jajaran diucapkan terima kasih.
                </p>

                {/* Tanda Tangan */}
                <div className="mt-8 flex justify-between pt-4">
                  <div className="text-center w-48">
                    <p className="text-xs text-slate-600">Mengetahui,</p>
                    <p className="text-xs font-bold text-slate-800">Calon Pekerja Migran</p>
                    <div className="h-20" />
                    <p className="font-bold underline text-xs">{candidate.fullName}</p>
                    <p className="text-[10px] text-slate-500">NIK: {candidate.nik || "-"}</p>
                  </div>

                  <div className="text-center w-64">
                    <p className="text-xs text-slate-600">Hormat Kami,</p>
                    <p className="text-xs font-bold text-slate-800">{tenantName}</p>
                    <div className="h-20 flex items-center justify-center">
                      <div className="rounded-full border border-rose-600/60 p-2 text-[9px] font-bold text-rose-700 rotate-[-12deg]">
                        [ STEMPEL RESMI P3MI ]
                      </div>
                    </div>
                    <p className="font-bold underline text-xs">{picName}</p>
                    <p className="text-[10px] text-slate-500">Direktur Utama</p>
                  </div>
                </div>
              </div>
            )}

            {/* KONTEN DOKUMEN: TEMPLATE 2 - REKOMENDASI IZIN DESA */}
            {selectedDocType === "REKOM_DESA" && (
              <div className="mt-6 space-y-4 leading-relaxed text-slate-800">
                <div className="flex justify-between text-xs">
                  <div>
                    <p><span className="font-bold">Nomor:</span> 142/EXT-PBA/REK-DESA/2026</p>
                    <p><span className="font-bold">Sifat:</span> Biasa / Penting</p>
                    <p><span className="font-bold">Perihal:</span> <span className="font-bold underline">Permohonan Surat Rekomendasi Izin Bekerja ke Luar Negeri</span></p>
                  </div>
                  <div className="text-right">
                    <p>{dateFormatted}</p>
                  </div>
                </div>

                <div className="mt-4">
                  <p className="font-bold">Kepada Yth.</p>
                  <p className="font-bold">Bapak / Ibu Kepala Desa / Lurah</p>
                  <p>Di Wilayah Domisili CPMI</p>
                </div>

                <p className="text-justify">
                  Dengan hormat,
                  <br />
                  Dalam rangka pelaksanaan Undang-Undang No. 18 Tahun 2017 tentang Pelindungan Pekerja Migran Indonesia serta pemenuhan persyaratan database terpadu SISKOP2MI, kami dari <strong>{tenantName}</strong> memohon kiranya Bapak/Ibu Kepala Desa/Lurah berkenan menerbitkan Surat Keterangan Izin Orang Tua/Suami dan Rekomendasi Domisili bagi warga masyarakat Bapak/Ibu:
                </p>

                <div className="my-3 rounded-lg border border-slate-300 bg-slate-50 p-4 text-xs space-y-2">
                  <div className="grid grid-cols-3">
                    <span className="font-bold text-slate-600">Nama CPMI</span>
                    <span className="col-span-2 font-bold text-slate-900">: {candidate.fullName}</span>
                  </div>
                  <div className="grid grid-cols-3">
                    <span className="font-bold text-slate-600">NIK / Nomor KK</span>
                    <span className="col-span-2 font-mono">: {candidate.nik || "3212155408980001"}</span>
                  </div>
                  <div className="grid grid-cols-3">
                    <span className="font-bold text-slate-600">Tempat & Tanggal Lahir</span>
                    <span className="col-span-2">
                      : {candidate.birthPlace ? `${candidate.birthPlace}, ${candidate.birthDate || ""}` : (candidate.birthDate || "-")}
                    </span>
                  </div>
                  <div className="grid grid-cols-3">
                    <span className="font-bold text-slate-600">Alamat Tempat Tinggal</span>
                    <span className="col-span-2">: {candidate.address || "-"}</span>
                  </div>
                  <div className="grid grid-cols-3">
                    <span className="font-bold text-slate-600">Negara Penempatan</span>
                    <span className="col-span-2 font-bold text-sky-800">: {candidate.destinationCountry}</span>
                  </div>
                </div>

                <p className="text-justify">
                  Perusahaan kami menjamin proses rekrutmen ini berjalan sesuai ketentuan hukum Republik Indonesia dengan skema perlindungan penuh, tanpa pungutan liar, dan biaya penempatan ditanggung oleh pihak pengguna jasa (Zero Cost).
                </p>

                <div className="mt-8 flex justify-end pt-4">
                  <div className="text-center w-64">
                    <p className="text-xs text-slate-600">P3MI Penyelenggara,</p>
                    <p className="text-xs font-bold text-slate-800">{tenantName}</p>
                    <div className="h-20" />
                    <p className="font-bold underline text-xs">{picName}</p>
                    <p className="text-[10px] text-slate-500">Direktur Utama</p>
                  </div>
                </div>
              </div>
            )}

            {/* KONTEN DOKUMEN: TEMPLATE 3 - PERJANJIAN PENEMPATAN (PK RESMI) */}
            {selectedDocType === "PK_RESMI" && (
              <div className="mt-6 space-y-4 leading-relaxed text-slate-800 text-xs">
                <div className="text-center border-b border-slate-300 pb-2">
                  <h2 className="text-base font-black uppercase text-slate-900">
                    PERJANJIAN PENEMPATAN PEKERJA MIGRAN INDONESIA
                  </h2>
                  <p className="text-xs font-semibold text-slate-600">
                    Nomor: PP/P3MI/{candidate.regNumber}/2026
                  </p>
                </div>

                <p className="text-justify">
                  Pada hari ini, tanggal <strong>{dateFormatted}</strong>, telah dibuat dan disepakati perjanjian penempatan antara:
                </p>

                <div className="space-y-1.5 pl-4 border-l-2 border-slate-400">
                  <p><strong>1. PIHAK PERTAMA:</strong> {tenantName}, beralamat di {tenantAddress}, dalam hal ini diwakili oleh <strong>{picName}</strong> selaku Direktur Utama, selanjutnya disebut sebagai <strong>P3MI</strong>.</p>
                  <p><strong>2. PIHAK KEDUA:</strong> <strong>{candidate.fullName}</strong>, NIK: {candidate.nik || "-"}, beralamat di {candidate.address || "-"}, selanjutnya disebut sebagai <strong>CALON PEKERJA MIGRAN INDONESIA (CPMI)</strong>.</p>
                </div>

                <p className="text-justify">
                  Kedua belah pihak sepakat mengikatkan diri dalam Perjanjian Penempatan dengan ketentuan dan syarat-syarat sebagai berikut:
                </p>

                <div className="space-y-2">
                  <p><strong>PASAL 1 — HAK DAN KEWAJIBAN P3MI:</strong> P3MI berkewajiban mengurus seluruh dokumen penempatan (visa kerja resmi, paspor, tiket penerbangan PP, asuransi perlindungan), memberikan pelatihan kompetensi BLK-LN secara memadai, dan memfasilitasi pendampingan hukum selama masa kontrak kerja 2 tahun.</p>
                  <p><strong>PASAL 2 — HAK DAN KEWAJIBAN CPMI:</strong> CPMI berhak mendapatkan gaji penuh tanpa potongan, akomodasi layak, makan 3x sehari, asuransi ketenagakerjaan, dan waktu istirahat teratur. CPMI berkewajiban mentaati peraturan majikan dan hukum negara penempatan ({candidate.destinationCountry}).</p>
                  <p><strong>PASAL 3 — BIAYA PENEMPATAN (ZERO COST):</strong> Seluruh biaya proses rekrutmen, visa, paspor, medical check-up, pelatihan, dan tiket penerbangan ditanggung langsung oleh Syarikah / Majikan Pengguna Jasa sesuai skema Zero Cost Kemnaker RI.</p>
                </div>

                {/* Tanda Tangan Materai */}
                <div className="mt-8 flex justify-between pt-4">
                  <div className="text-center w-52">
                    <p className="text-xs font-bold text-slate-800">PIHAK KEDUA (CPMI)</p>
                    <div className="h-8" />
                    <div className="inline-block rounded border border-dashed border-slate-400 px-3 py-1 text-[9px] text-slate-500">
                      MATERAI Rp 10.000
                    </div>
                    <div className="h-6" />
                    <p className="font-bold underline text-xs">{candidate.fullName}</p>
                  </div>

                  <div className="text-center w-52">
                    <p className="text-xs font-bold text-slate-800">PIHAK PERTAMA (P3MI)</p>
                    <div className="h-20 flex items-center justify-center">
                      <span className="text-[10px] text-rose-700 font-bold">[ STEMPEL PERUSAHAAN ]</span>
                    </div>
                    <p className="font-bold underline text-xs">{picName}</p>
                    <p className="text-[10px] text-slate-500">Direktur Utama</p>
                  </div>
                </div>
              </div>
            )}

            {/* KONTEN DOKUMEN: TEMPLATE 4 - SURAT IZIN SUAMI/KELUARGA */}
            {selectedDocType === "IZIN_KELUARGA" && (
              <div className="mt-6 space-y-4 leading-relaxed text-slate-800">
                <div className="text-center border-b border-slate-300 pb-2">
                  <h2 className="text-base font-black uppercase text-slate-900">
                    SURAT PERNYATAAN IZIN SUAMI / ORANG TUA / WALI
                  </h2>
                </div>

                <p>Yang bertanda tangan di bawah ini:</p>

                <div className="my-2 rounded-lg border border-slate-300 bg-slate-50 p-4 text-xs space-y-2">
                  <div className="grid grid-cols-3">
                    <span className="font-bold text-slate-600">Nama Pemberi Izin</span>
                    <span className="col-span-2 font-bold text-slate-900">: .....................................................................</span>
                  </div>
                  <div className="grid grid-cols-3">
                    <span className="font-bold text-slate-600">NIK Pemberi Izin</span>
                    <span className="col-span-2">: .....................................................................</span>
                  </div>
                  <div className="grid grid-cols-3">
                    <span className="font-bold text-slate-600">Hubungan Keluarga</span>
                    <span className="col-span-2">: [ ] Suami &nbsp;&nbsp;&nbsp; [ ] Orang Tua (Ayah/Ibu) &nbsp;&nbsp;&nbsp; [ ] Wali</span>
                  </div>
                  <div className="grid grid-cols-3">
                    <span className="font-bold text-slate-600">Alamat Tempat Tinggal</span>
                    <span className="col-span-2">: {candidate.address || "..........................................................."}</span>
                  </div>
                </div>

                <p className="text-justify">
                  Dengan penuh kesadaran dan tanpa ada paksaan dari pihak manapun, menyatakan <strong>MEMBERIKAN IZIN SEPENUHNYA</strong> kepada:
                </p>

                <div className="my-2 rounded-lg border border-slate-300 bg-slate-50 p-4 text-xs space-y-2">
                  <div className="grid grid-cols-3">
                    <span className="font-bold text-slate-600">Nama CPMI</span>
                    <span className="col-span-2 font-bold text-slate-900">: {candidate.fullName}</span>
                  </div>
                  <div className="grid grid-cols-3">
                    <span className="font-bold text-slate-600">NIK CPMI</span>
                    <span className="col-span-2 font-mono">: {candidate.nik || "-"}</span>
                  </div>
                  <div className="grid grid-cols-3">
                    <span className="font-bold text-slate-600">Negara Penempatan</span>
                    <span className="col-span-2 font-bold text-sky-800">: {candidate.destinationCountry} (Timur Tengah)</span>
                  </div>
                </div>

                <p className="text-justify">
                  Untuk bekerja ke luar negeri selama jangka waktu kontrak kerja 2 (dua) tahun melalui P3MI resmi <strong>{tenantName}</strong>. Apabila di kemudian hari terdapat hal-hal yang tidak diinginkan di luar prosedur, saya tidak akan menuntut pihak P3MI selama P3MI telah menjalankan kewajiban sesuai undang-undang.
                </p>

                {/* Tanda Tangan */}
                <div className="mt-8 flex justify-between pt-4 text-xs">
                  <div className="text-center w-52">
                    <p className="text-slate-600">Mengetahui,</p>
                    <p className="font-bold text-slate-800">Kepala Desa / Lurah Setempat</p>
                    <div className="h-20" />
                    <p className="font-bold underline">( ............................................ )</p>
                  </div>

                  <div className="text-center w-52">
                    <p className="text-slate-600">{dateFormatted}</p>
                    <p className="font-bold text-slate-800">Yang Memberi Izin (Suami/Orang Tua)</p>
                    <div className="h-6" />
                    <div className="inline-block rounded border border-dashed border-slate-400 px-2 py-0.5 text-[9px] text-slate-500">
                      MATERAI 10.000
                    </div>
                    <div className="h-6" />
                    <p className="font-bold underline">( ............................................ )</p>
                  </div>
                </div>
              </div>
            )}

            {/* KONTEN DOKUMEN: TEMPLATE 5 - BIODATA SYARIKAH TIMUR TENGAH (IDENTIK CONTOH_PRINTOUT_BIODATA.PDF) */}
            {selectedDocType === "BIODATA_SYARIKAH" && (
              <div className="mt-4 space-y-4 leading-relaxed text-slate-900 text-xs">
                {/* Banner Akses Modal Asli contoh_printout_biodata.pdf */}
                <div className="rounded-xl border-2 border-indigo-500 bg-indigo-50 p-4 text-indigo-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md print:hidden">
                  <div>
                    <span className="rounded bg-indigo-600 text-white px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                      Format Resmi Sistem (contoh_printout_biodata.pdf)
                    </span>
                    <h3 className="font-extrabold text-sm text-indigo-950 mt-1">
                      Printout Biodata Syarikah / CV Majikan Arab Saudi
                    </h3>
                    <p className="text-xs text-indigo-800 mt-0.5">
                      Sistem telah menyediakan formulir asli bilingual (Inggris & Arab) lengkap dengan penempatan pas foto, foto berdiri seluruh badan (Full-Body 3R/4R), rincian paspor, serta tabel keahlian kerja rumah tangga.
                    </p>
                  </div>
                  {onOpenSyarikahBiodata && (
                    <button
                      type="button"
                      onClick={() => onOpenSyarikahBiodata(candidate)}
                      className="shrink-0 flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-black text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-700 transition cursor-pointer"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Buka Format Asli & Editor Foto
                    </button>
                  )}
                </div>

                {/* Lembar Format Resmi CV Syarikah (A4 Layout Identik contoh_printout_biodata.pdf) */}
                <div className="rounded-lg border-2 border-slate-900 p-4 space-y-3 font-sans bg-white">
                  {/* Header Aplikasi & Gaji SAR */}
                  <div className="flex flex-col sm:flex-row justify-between items-start border-b-2 border-slate-900 pb-3 gap-3">
                    <div>
                      <h2 className="text-base font-black uppercase tracking-wide text-slate-900">
                        APPLICATION FOR EMPLOYMENT / طلب استخدام
                      </h2>
                      <p className="text-xs font-bold text-indigo-900">
                        SAUDI MANPOWER RECRUITMENT PROGRAM (SPSK ZERO COST)
                      </p>
                      <p className="font-mono text-xs font-bold text-slate-800 mt-0.5">
                        REFERENCE NO. / الرقم المرجعي : {candidate.regNumber}
                      </p>
                    </div>

                    <div className="border border-slate-900 rounded p-2 bg-slate-50 text-[11px] space-y-0.5 min-w-[220px]">
                      <div className="flex justify-between">
                        <span className="font-bold">Post Applied For / الوظيفة:</span>
                        <span className="font-bold text-indigo-900">HOUSEMAID</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-bold">Monthly Salary / الراتب:</span>
                        <span className="font-bold text-emerald-800">SAR 1500</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-bold">Contract Period / مدة العقد:</span>
                        <span className="font-bold">2 YEARS</span>
                      </div>
                    </div>
                  </div>

                  {/* Body Grid: Kiri Tabel Data, Kanan 2 Foto Resmi (Pas Foto + Full Body) */}
                  <div className="grid grid-cols-12 gap-4">
                    {/* Kolom Kiri: Tabel Data (8 Kolom) */}
                    <div className="col-span-8 space-y-3">
                      {/* Tabel 1: Passport Details */}
                      <div>
                        <div className="bg-slate-900 text-white font-bold text-[10px] px-2 py-1 uppercase flex justify-between">
                          <span>PASSPORT DETAILS</span>
                          <span>بيانات جواز السفر</span>
                        </div>
                        <table className="w-full text-[10px] border border-slate-900 border-t-0">
                          <tbody>
                            <tr className="border-b border-slate-300">
                              <td className="w-1/3 px-2 py-1 font-bold bg-slate-100">Number / الرقم</td>
                              <td className="px-2 py-1 font-mono font-bold text-slate-900">
                                {candidate.documents.find((d) => d.docType === "PASPOR")?.docNumber || "B 1234567"}
                              </td>
                            </tr>
                            <tr className="border-b border-slate-300">
                              <td className="px-2 py-1 font-bold bg-slate-100">Date of Issue / تاريخ الإصدار</td>
                              <td className="px-2 py-1 font-mono">15-01-2025</td>
                            </tr>
                            <tr className="border-b border-slate-300">
                              <td className="px-2 py-1 font-bold bg-slate-100">Date of Expiry / تاريخ الانتهاء</td>
                              <td className="px-2 py-1 font-mono">
                                {candidate.documents.find((d) => d.docType === "PASPOR")?.expiryDate || "15-01-2035"}
                              </td>
                            </tr>
                            <tr>
                              <td className="px-2 py-1 font-bold bg-slate-100">Place of Issue / مكان الإصدار</td>
                              <td className="px-2 py-1">KANIM CIREBON / JAKARTA</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>

                      {/* Tabel 2: General Details */}
                      <div>
                        <div className="bg-slate-900 text-white font-bold text-[10px] px-2 py-1 uppercase flex justify-between">
                          <span>GENERAL DETAILS</span>
                          <span>البيانات العامة</span>
                        </div>
                        <table className="w-full text-[10px] border border-slate-900 border-t-0">
                          <tbody>
                            <tr className="border-b border-slate-300">
                              <td className="w-1/3 px-2 py-1 font-bold bg-slate-100">Full Name / الاسم الكامل</td>
                              <td className="px-2 py-1 font-bold text-slate-900">{candidate.fullName}</td>
                            </tr>
                            <tr className="border-b border-slate-300">
                              <td className="px-2 py-1 font-bold bg-slate-100">Nationality / الجنسية</td>
                              <td className="px-2 py-1 font-bold">INDONESIAN / إندونيسية</td>
                            </tr>
                            <tr className="border-b border-slate-300">
                              <td className="px-2 py-1 font-bold bg-slate-100">Religion / الديانة</td>
                              <td className="px-2 py-1">{candidate.registrationForm?.religion || "ISLAM / مسلم"}</td>
                            </tr>
                            <tr className="border-b border-slate-300">
                              <td className="px-2 py-1 font-bold bg-slate-100">Date & Place of Birth / تاريخ ومكان الميلاد</td>
                              <td className="px-2 py-1">
                                {candidate.birthPlace ? `${candidate.birthPlace}, ${candidate.birthDate || ""}` : (candidate.birthDate || "-")}
                              </td>
                            </tr>
                            <tr className="border-b border-slate-300">
                              <td className="px-2 py-1 font-bold bg-slate-100">Age / العمر</td>
                              <td className="px-2 py-1 font-bold">{candidate.registrationForm?.realAge || 26} Years Old / سنة</td>
                            </tr>
                            <tr className="border-b border-slate-300">
                              <td className="px-2 py-1 font-bold bg-slate-100">Marital Status / الحالة الاجتماعية</td>
                              <td className="px-2 py-1">{candidate.maritalStatus || "MARRIED / متزوجة"}</td>
                            </tr>
                            <tr className="border-b border-slate-300">
                              <td className="px-2 py-1 font-bold bg-slate-100">Height & Weight / الطول والوزن</td>
                              <td className="px-2 py-1 font-mono">
                                {candidate.registrationForm?.heightCm || 158} cm / {candidate.registrationForm?.weightKg || 52} kg
                              </td>
                            </tr>
                            <tr>
                              <td className="px-2 py-1 font-bold bg-slate-100">Languages / اللغات</td>
                              <td className="px-2 py-1">
                                Arabic: {candidate.training?.targetLanguage === "Arab" ? "Fluent / جيدة" : "Basic / مقبولة"} · English: Fair
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>

                      {/* Tabel 3: Previous Employment */}
                      <div>
                        <div className="bg-slate-900 text-white font-bold text-[10px] px-2 py-1 uppercase flex justify-between">
                          <span>PREVIOUS EMPLOYMENT</span>
                          <span>الخبرة العملية السابقة</span>
                        </div>
                        <div className="border border-slate-900 border-t-0 p-2 text-[10px] bg-slate-50">
                          {candidate.registrationForm?.overseasExperiences && candidate.registrationForm.overseasExperiences.length > 0 ? (
                            candidate.registrationForm.overseasExperiences.map((exp, idx) => (
                              <p key={idx} className="font-semibold text-slate-900">
                                • {exp.countryAndCity} ({exp.period}): {exp.remarks || "Domestic Helper"}
                              </p>
                            ))
                          ) : (
                            <p className="text-slate-800">
                              • SAUDI ARABIA - RIYADH (2 YEARS): Housekeeping & Childcare (Ex-Saudi / خبرة سابقة بالسعودية)
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Tabel 4: Skills Matrix */}
                      <div>
                        <div className="bg-slate-900 text-white font-bold text-[10px] px-2 py-1 uppercase flex justify-between">
                          <span>SKILLS & DUTIES</span>
                          <span>المهارات والواجبات</span>
                        </div>
                        <div className="border border-slate-900 border-t-0 p-2 grid grid-cols-3 gap-2 text-[10px]">
                          <div>[ √ ] Cleaning / نظافة</div>
                          <div>[ √ ] Cooking / طبخ</div>
                          <div>[ √ ] Washing / غسيل</div>
                          <div>[ √ ] Ironing / كوي</div>
                          <div>[ √ ] Babysitting / رعاية أطفال</div>
                          <div>[ √ ] Elderly Care / رعاية مسنين</div>
                        </div>
                      </div>
                    </div>

                    {/* Kolom Kanan: 2 Foto Berdampingan (4 Kolom) */}
                    <div className="col-span-4 flex flex-col gap-3">
                      {/* Pas Foto Wajah 4x6 */}
                      <div className="border-2 border-slate-900 rounded p-1 flex flex-col items-center bg-slate-50">
                        <span className="text-[9px] font-bold text-slate-700 uppercase mb-1">
                          PASSPORT PHOTO / صورة شخصية
                        </span>
                        <div className="h-32 w-24 bg-slate-200 border border-slate-400 overflow-hidden flex items-center justify-center">
                          {candidate.avatarUrl ? (
                            <img src={candidate.avatarUrl} alt="Passport" className="h-full w-full object-cover" />
                          ) : (
                            <Users className="h-10 w-10 text-slate-400" />
                          )}
                        </div>
                      </div>

                      {/* Foto Berdiri Seluruh Badan (Full-Body 3R/4R) */}
                      <div className="border-2 border-slate-900 rounded p-1 flex flex-col items-center bg-slate-50 flex-1">
                        <span className="text-[9px] font-bold text-slate-700 uppercase mb-1">
                          FULL BODY PHOTO / صورة كاملة
                        </span>
                        <div className="h-64 w-full bg-slate-200 border border-slate-400 overflow-hidden flex items-center justify-center">
                          {candidate.fullBodyPhotoUrl ? (
                            <img src={candidate.fullBodyPhotoUrl} alt="Full Body" className="h-full w-full object-cover" />
                          ) : (
                            <div className="text-center p-2 text-slate-400 text-[10px]">
                              <Users className="h-12 w-12 mx-auto mb-1 text-slate-400" />
                              <span>FOTO BERDIRI FULL BODY 3R/4R</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Footer Pengesahan Legal P3MI */}
                  <div className="pt-3 border-t-2 border-slate-900 flex justify-between items-center text-[10px] text-slate-700">
                    <div>
                      <p className="font-bold">P3MI PENYELENGGARA: {tenantName}</p>
                      <p>{tenantLicense}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">SPSK KEMNAKER RI CERTIFIED</p>
                      <p>Kawasan Timur Tengah (Zero Cost Program)</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-700 bg-slate-800/80 p-12 text-center text-slate-400">
          Belum ada data CPMI yang dipilih untuk dicetak.
        </div>
      )}
    </div>
  );
}
