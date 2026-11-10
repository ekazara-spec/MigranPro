"use client";

import React, { useState } from "react";
import {
  Building2,
  ShieldCheck,
  AlertTriangle,
  Plus,
  Edit3,
  CheckCircle2,
  Users,
  MapPin,
  Phone,
  Mail,
  Lock,
  Calendar,
  Layers,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import { Branch, TenantCompany, UserRole } from "@/lib/types";

interface TenantBranchModuleProps {
  tenants: TenantCompany[];
  branches: Branch[];
  candidatesCount: number;
  selectedTenantId: string;
  onSelectTenant: (id: string) => void;
  isBranchViewOnly: boolean;
  actorRole: UserRole;
  actorName: string;
  onRefreshDb: () => void;
}

export default function TenantBranchModule({
  tenants,
  branches,
  candidatesCount,
  selectedTenantId,
  onSelectTenant,
  isBranchViewOnly,
  actorRole,
  actorName,
  onRefreshDb,
}: TenantBranchModuleProps) {
  const [showAddTenantModal, setShowAddTenantModal] = useState(false);
  const [editingTenant, setEditingTenant] = useState<TenantCompany | null>(null);
  const [tenantForm, setTenantForm] = useState({
    code: "",
    name: "",
    brandName: "",
    licenseNo: "",
    logoUrl: "/logo-panca-banyu.png",
    planTier: "ENTERPRISE" as "FREE_TRIAL" | "PRO" | "ENTERPRISE",
    planExpiresAt: "2028-12-31",
    maxCandidates: 1000,
    maxBranches: 20,
    address: "",
    phone: "",
    email: "",
    picName: "",
  });

  const [showAddBranchModal, setShowAddBranchModal] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [branchForm, setBranchForm] = useState({
    code: "",
    name: "",
    city: "",
    headName: "",
    phone: "",
    address: "",
    status: "ACTIVE" as "ACTIVE" | "INACTIVE",
  });

  const [saving, setSaving] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const activeTenant = tenants.find((t) => t.id === selectedTenantId) || tenants[0] || null;
  const tenantBranches = activeTenant ? branches.filter((b) => !b.tenantId || b.tenantId === activeTenant.id) : branches;

  const candidateUsagePct = activeTenant
    ? Math.min(100, Math.round((candidatesCount / (activeTenant.maxCandidates || 1)) * 100))
    : 0;
  const branchUsagePct = activeTenant
    ? Math.min(100, Math.round((tenantBranches.length / (activeTenant.maxBranches || 1)) * 100))
    : 0;

  async function handleSaveTenant(e: React.FormEvent) {
    e.preventDefault();
    if (isBranchViewOnly) {
      alert("Akses Ditolak: Administrasi eksekusi hanya dapat dilakukan oleh Admin Pusat / Direktur.");
      return;
    }

    setSaving(true);
    setFeedbackMsg(null);
    try {
      const isEdit = Boolean(editingTenant);
      const action = isEdit ? "UPDATE_TENANT" : "CREATE_TENANT";
      const payload = isEdit
        ? { tenantId: editingTenant?.id, updates: tenantForm }
        : tenantForm;

      const res = await fetch("/api/p3mi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          actorName,
          actorRole,
          payload,
        }),
      });

      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Gagal menyimpan data tenant.");

      setFeedbackMsg({
        type: "success",
        text: isEdit ? "Data tenant P3MI berhasil diperbarui!" : "Perusahaan P3MI (Tenant Baru) berhasil ditambahkan!",
      });
      setShowAddTenantModal(false);
      setEditingTenant(null);
      onRefreshDb();
    } catch (err: unknown) {
      setFeedbackMsg({
        type: "error",
        text: err instanceof Error ? err.message : "Terjadi kesalahan sistem.",
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveBranch(e: React.FormEvent) {
    e.preventDefault();
    if (isBranchViewOnly) {
      alert("Akses Ditolak: Administrasi eksekusi hanya dapat dilakukan oleh Admin Pusat / Direktur.");
      return;
    }

    setSaving(true);
    setFeedbackMsg(null);
    try {
      const isEdit = Boolean(editingBranch);
      const action = isEdit ? "UPDATE_BRANCH" : "CREATE_BRANCH";
      const payload = isEdit
        ? { branchId: editingBranch?.id, updates: branchForm }
        : { ...branchForm, tenantId: activeTenant?.id || "tenant-panca" };

      const res = await fetch("/api/p3mi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          actorName,
          actorRole,
          payload,
        }),
      });

      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Gagal menyimpan kantor cabang.");

      setFeedbackMsg({
        type: "success",
        text: isEdit ? "Data cabang berhasil diperbarui!" : "Kantor Cabang / BLK-LN baru berhasil ditambahkan!",
      });
      setShowAddBranchModal(false);
      setEditingBranch(null);
      onRefreshDb();
    } catch (err: unknown) {
      setFeedbackMsg({
        type: "error",
        text: err instanceof Error ? err.message : "Terjadi kesalahan sistem.",
      });
    } finally {
      setSaving(false);
    }
  }

  function openEditTenant(t: TenantCompany) {
    setEditingTenant(t);
    setTenantForm({
      code: t.code,
      name: t.name,
      brandName: t.brandName,
      licenseNo: t.licenseNo,
      logoUrl: t.logoUrl || "/logo-panca-banyu.png",
      planTier: t.planTier,
      planExpiresAt: t.planExpiresAt,
      maxCandidates: t.maxCandidates,
      maxBranches: t.maxBranches,
      address: t.address,
      phone: t.phone,
      email: t.email,
      picName: t.picName,
    });
    setShowAddTenantModal(true);
  }

  function openEditBranch(b: Branch) {
    setEditingBranch(b);
    setBranchForm({
      code: b.code,
      name: b.name,
      city: b.city,
      headName: b.headName,
      phone: b.phone,
      address: b.address || "",
      status: b.status || "ACTIVE",
    });
    setShowAddBranchModal(true);
  }

  return (
    <div className="space-y-6">
      {/* Banner Notifikasi Hak Akses Cabang */}
      {isBranchViewOnly && (
        <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-amber-200">
          <div className="flex items-center gap-3">
            <Lock className="h-5 w-5 shrink-0 text-amber-400" />
            <div className="text-sm">
              <span className="font-bold">Mode Pantau Cabang (View-Only): </span>
              Sesuai ketentuan SOP, administrasi eksekusi seluruh proses operasional (pendaftaran, mutasi tahapan, master data, dan keuangan) hanya dapat dilakukan oleh Admin Pusat / Direktur. Kantor cabang hanya memiliki hak pantau perkembangan CPMI.
            </div>
          </div>
        </div>
      )}

      {/* Alert Feedback Pesan */}
      {feedbackMsg && (
        <div
          className={`rounded-xl border p-4 text-sm ${
            feedbackMsg.type === "success"
              ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-200"
              : "border-rose-500/40 bg-rose-500/10 text-rose-200"
          }`}
        >
          <div className="flex items-center justify-between">
            <span>{feedbackMsg.text}</span>
            <button
              onClick={() => setFeedbackMsg(null)}
              className="text-xs font-semibold underline hover:text-white"
            >
              Tutup
            </button>
          </div>
        </div>
      )}

      {/* Top Header PT. Panca Banyu Ajisakti */}
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-700/60 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-6 shadow-xl lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 shrink-0 rounded-2xl bg-white p-2 border border-slate-600 shadow-md flex items-center justify-center">
            <img
              src="/logo-panca-banyu.png"
              alt="Logo PT Panca Banyu Ajisakti"
              className="h-full w-full object-contain"
            />
          </div>
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-sky-400">
              <Building2 className="h-4 w-4" />
              Modul 1: Profil Perusahaan & Jaringan Kantor Cabang
            </div>
            <h2 className="mt-0.5 text-2xl font-black text-white">
              PT. PANCA BANYU AJISAKTI
            </h2>
            <p className="mt-0.5 text-xs text-slate-300">
              Aplikasi Didedikasikan Khusus untuk PT. Panca Banyu Ajisakti (SIP3MI NO. 502/MEN/2021) · Penempatan PMI Kawasan Timur Tengah
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-3.5 py-2 text-xs font-bold text-emerald-300">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            SIP3MI Kemnaker RI Resmi
          </span>

          {!isBranchViewOnly && activeTenant && (
            <button
              onClick={() => openEditTenant(activeTenant)}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-sky-500/20 transition hover:brightness-110 cursor-pointer"
            >
              <Edit3 className="h-4 w-4" />
              Edit Profil Perusahaan
            </button>
          )}
        </div>
      </div>

      {/* Profil Tenant Aktif & Penggunaan Kuota */}
      {activeTenant && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Kartu Profil Legal Perusahaan */}
          <div className="rounded-2xl border border-slate-700/60 bg-slate-800/80 p-6 lg:col-span-2 shadow-lg">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-slate-700/60 pb-5">
              <div className="flex items-start gap-4">
                <div className="h-16 w-16 shrink-0 rounded-2xl bg-white p-2 border border-slate-600 shadow-md flex items-center justify-center">
                  <img
                    src="/logo-panca-banyu.png"
                    alt="Logo PT Panca Banyu Ajisakti"
                    className="h-full w-full object-contain"
                  />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-xl font-black text-white">{activeTenant.name}</h3>
                    <span className="rounded-full bg-emerald-500/20 border border-emerald-500/40 px-2 py-0.5 text-[11px] font-bold text-emerald-300">
                      P3MI Tunggal
                    </span>
                    <span className="rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/40 px-2 py-0.5 text-[11px] font-bold">
                      {activeTenant.status}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-slate-300 mt-0.5">
                    Merk / Brand: <span className="text-amber-300">{activeTenant.brandName}</span>
                  </p>
                  <p className="text-xs text-sky-400 font-mono mt-1 font-bold">
                    {activeTenant.licenseNo} (Kementerian Ketenagakerjaan RI)
                  </p>
                </div>
              </div>

              {!isBranchViewOnly && (
                <button
                  onClick={() => openEditTenant(activeTenant)}
                  className="flex items-center gap-1.5 rounded-lg border border-slate-600 bg-slate-700/60 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700"
                >
                  <Edit3 className="h-3.5 w-3.5" />
                  Edit Legalitas
                </button>
              )}
            </div>

            <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-300">
              <div className="flex items-start gap-2.5">
                <MapPin className="h-4 w-4 shrink-0 text-slate-400 mt-0.5" />
                <div>
                  <span className="font-semibold text-white">Alamat Kantor Pusat:</span>
                  <p className="text-slate-300 mt-0.5">{activeTenant.address}</p>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <ShieldCheck className="h-4 w-4 shrink-0 text-slate-400 mt-0.5" />
                <div>
                  <span className="font-semibold text-white">Penanggung Jawab (Direktur Utama):</span>
                  <p className="text-slate-300 mt-0.5">{activeTenant.picName}</p>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone className="h-4 w-4 shrink-0 text-slate-400" />
                <div>
                  <span className="font-semibold text-white">Telepon Resmi:</span> {activeTenant.phone}
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail className="h-4 w-4 shrink-0 text-slate-400" />
                <div>
                  <span className="font-semibold text-white">Email Operasional:</span> {activeTenant.email}
                </div>
              </div>
            </div>
          </div>

          {/* Kartu Status Kapasitas Penempatan */}
          <div className="rounded-2xl border border-slate-700/60 bg-gradient-to-br from-slate-800 to-slate-900 p-6 shadow-lg space-y-5">
            <div className="flex items-center justify-between border-b border-slate-700 pb-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase text-slate-400">
                <Sparkles className="h-4 w-4 text-amber-400" />
                Kapasitas Penempatan
              </div>
              <span className="rounded-full bg-emerald-500/20 border border-emerald-500/40 px-2.5 py-0.5 text-xs font-black text-emerald-300">
                SPSK ZERO COST
              </span>
            </div>

            <div className="text-xs text-slate-400 flex items-center justify-between">
              <span>Wilayah Operasional:</span>
              <span className="font-bold text-white">Kawasan Timur Tengah</span>
            </div>

            {/* Meter Kuota CPMI */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 font-medium">Total Kandidat CPMI Terdata:</span>
                <span className="font-bold text-sky-400">
                  {candidatesCount} CPMI
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-700">
                <div
                  className="h-full rounded-full bg-sky-500 transition-all"
                  style={{ width: `${Math.min(100, (candidatesCount / 500) * 100)}%` }}
                />
              </div>
            </div>

            {/* Meter Kuota Cabang */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 font-medium">Jaringan Kantor Cabang & BLK-LN:</span>
                <span className="font-bold text-indigo-400">
                  {tenantBranches.length} Kantor Daerah
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-700">
                <div
                  className="h-full rounded-full bg-indigo-500 transition-all"
                  style={{ width: `${Math.min(100, (tenantBranches.length / 10) * 100)}%` }}
                />
              </div>
            </div>

            <div className="rounded-xl border border-sky-500/20 bg-sky-500/10 p-3 text-[11px] text-sky-200">
              💡 Sistem beroperasi eksklusif untuk PT. Panca Banyu Ajisakti dengan kendali operasional tunggal oleh Kantor Pusat Jakarta.
            </div>
          </div>
        </div>
      )}

      {/* Daftar Kantor Cabang & BLK-LN Daerah di bawah Tenant Aktif */}
      <div className="rounded-2xl border border-slate-700/60 bg-slate-800/80 p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-700 pb-4">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Building2 className="h-5 w-5 text-sky-400" />
              Jaringan Kantor Cabang & BLK-LN ({tenantBranches.length} Kantor)
            </h3>
            <p className="text-xs text-slate-300 mt-0.5">
              Kantor cabang berfungsi sebagai pos pemantauan daerah (View-Only). Seluruh validasi tahapan dilakukan terpusat.
            </p>
          </div>

          {!isBranchViewOnly && (
            <button
              onClick={() => {
                setEditingBranch(null);
                setBranchForm({
                  code: `BR-${tenantBranches.length + 1}`,
                  name: "",
                  city: "",
                  headName: "",
                  phone: "",
                  address: "",
                  status: "ACTIVE",
                });
                setShowAddBranchModal(true);
              }}
              className="flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2 text-xs font-bold text-white hover:bg-sky-500 transition"
            >
              <Plus className="h-4 w-4" />
              Tambah Kantor Cabang Baru
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tenantBranches.map((b) => (
            <div
              key={b.id}
              className="rounded-xl border border-slate-700 bg-slate-900/70 p-4 transition hover:border-slate-600 space-y-3"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="font-mono text-[10px] font-bold text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded">
                    {b.code}
                  </span>
                  <h4 className="font-bold text-white mt-1">{b.name}</h4>
                  <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                    <MapPin className="h-3 w-3" />
                    {b.city}
                  </p>
                </div>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                    b.status === "ACTIVE"
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                      : "bg-slate-700 text-slate-400"
                  }`}
                >
                  {b.status || "ACTIVE"}
                </span>
              </div>

              <div className="border-t border-slate-800 pt-2 text-xs text-slate-300 space-y-1">
                <div>
                  <span className="text-slate-400">Kepala Cabang:</span>{" "}
                  <span className="font-semibold text-white">{b.headName}</span>
                </div>
                <div>
                  <span className="text-slate-400">Kontak:</span> {b.phone}
                </div>
                {b.address && (
                  <p className="text-[11px] text-slate-400 line-clamp-1">
                    {b.address}
                  </p>
                )}
              </div>

              <div className="border-t border-slate-800 pt-2 flex items-center justify-between">
                <span className="text-[10px] font-medium text-amber-300/80 flex items-center gap-1">
                  <Lock className="h-3 w-3" />
                  Akses View-Only
                </span>
                {!isBranchViewOnly && (
                  <button
                    onClick={() => openEditBranch(b)}
                    className="text-xs font-semibold text-sky-400 hover:text-sky-300 flex items-center gap-1"
                  >
                    <Edit3 className="h-3 w-3" />
                    Edit
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal Edit Profil Perusahaan PT. Panca Banyu Ajisakti */}
      {showAddTenantModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-700 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Building2 className="h-5 w-5 text-sky-400" />
                Edit Profil Legal PT. PANCA BANYU AJISAKTI
              </h3>
              <button
                onClick={() => setShowAddTenantModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveTenant} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-slate-300 font-semibold mb-1">Nama Legal Perusahaan P3MI</label>
                  <input
                    type="text"
                    required
                    value={tenantForm.name}
                    onChange={(e) => setTenantForm({ ...tenantForm, name: e.target.value })}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white font-bold"
                    placeholder="PT. PANCA BANYU AJISAKTI"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Nomor Izin SIP3MI Kemnaker RI</label>
                  <input
                    type="text"
                    required
                    value={tenantForm.licenseNo}
                    onChange={(e) => setTenantForm({ ...tenantForm, licenseNo: e.target.value })}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white font-mono"
                    placeholder="SIP3MI NO. 502/MEN/2021"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Nama Direktur Utama / Penanggung Jawab</label>
                  <input
                    type="text"
                    required
                    value={tenantForm.picName}
                    onChange={(e) => setTenantForm({ ...tenantForm, picName: e.target.value })}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white"
                    placeholder="Direktur Utama"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Nomor Telepon Kantor Pusat</label>
                  <input
                    type="text"
                    required
                    value={tenantForm.phone}
                    onChange={(e) => setTenantForm({ ...tenantForm, phone: e.target.value })}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white"
                    placeholder="+62-21 2937373"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Email Resmi Kantor</label>
                  <input
                    type="email"
                    required
                    value={tenantForm.email}
                    onChange={(e) => setTenantForm({ ...tenantForm, email: e.target.value })}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white"
                    placeholder="pancabanyu@yahoo.com"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-slate-300 font-semibold mb-1">Alamat Kantor Pusat</label>
                  <textarea
                    rows={2}
                    required
                    value={tenantForm.address}
                    onChange={(e) => setTenantForm({ ...tenantForm, address: e.target.value })}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white"
                    placeholder="Jl. Kayu Manis No. 51, Kel. Balekambang, Kec. Kramat Jati, Jakarta Timur"
                  />
                </div>
              </div>

              <div className="rounded-xl border border-sky-500/20 bg-sky-500/10 p-3 text-[11px] text-sky-200">
                Informasi profil ini disematkan otomatis pada Kop Surat Resmi seluruh dokumen cetak (Surat Pengantar Paspor, Rekom Disnaker, Perjanjian Kerja, dan CV Syarikah KSA).
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-700">
                <button
                  type="button"
                  onClick={() => setShowAddTenantModal(false)}
                  className="rounded-lg border border-slate-600 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-sky-600 px-5 py-2 text-xs font-bold text-white hover:bg-sky-500 disabled:opacity-50 cursor-pointer"
                >
                  {saving ? "Menyimpan..." : "Simpan Profil PT"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Tambah / Edit Cabang */}
      {showAddBranchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-700 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Building2 className="h-5 w-5 text-sky-400" />
                {editingBranch ? "Edit Kantor Cabang" : "Tambah Kantor Cabang Baru"}
              </h3>
              <button
                onClick={() => setShowAddBranchModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveBranch} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Kode Cabang</label>
                <input
                  type="text"
                  required
                  value={branchForm.code}
                  onChange={(e) => setBranchForm({ ...branchForm, code: e.target.value })}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white"
                  placeholder="IDM-01, CLP-02, dll."
                />
              </div>
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Nama Kantor Cabang / BLK-LN</label>
                <input
                  type="text"
                  required
                  value={branchForm.name}
                  onChange={(e) => setBranchForm({ ...branchForm, name: e.target.value })}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white"
                  placeholder="Cabang Indramayu & BLK Pantura"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Kota / Kabupaten</label>
                  <input
                    type="text"
                    required
                    value={branchForm.city}
                    onChange={(e) => setBranchForm({ ...branchForm, city: e.target.value })}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white"
                    placeholder="Indramayu, Jawa Barat"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Telepon Kantor</label>
                  <input
                    type="text"
                    required
                    value={branchForm.phone}
                    onChange={(e) => setBranchForm({ ...branchForm, phone: e.target.value })}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white"
                    placeholder="0234-274511"
                  />
                </div>
              </div>
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Nama Kepala Cabang</label>
                <input
                  type="text"
                  required
                  value={branchForm.headName}
                  onChange={(e) => setBranchForm({ ...branchForm, headName: e.target.value })}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white"
                  placeholder="Hj. Siti Aminah"
                />
              </div>
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Alamat Lengkap</label>
                <textarea
                  rows={2}
                  value={branchForm.address}
                  onChange={(e) => setBranchForm({ ...branchForm, address: e.target.value })}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white"
                  placeholder="Jl. Mayor Dasuki No. 12, Jatibarang"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-700">
                <button
                  type="button"
                  onClick={() => setShowAddBranchModal(false)}
                  className="rounded-lg border border-slate-600 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-sky-600 px-5 py-2 text-xs font-bold text-white hover:bg-sky-500 disabled:opacity-50"
                >
                  {saving ? "Menyimpan..." : "Simpan Cabang"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
