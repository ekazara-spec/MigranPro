"use client";

import React, { useState } from "react";
import { DatabaseSchema } from "@/lib/db";
import {
  BpjsFinancingPartner,
  DestinationCountry,
  ForeignAgency,
  MasterAirline,
  MasterBlkLn,
  MasterDisdukcapil,
  MasterEmbassy,
  MasterImmigrationOffice,
  MasterMedicalClinic,
  MedicalClinicPartner,
  Sponsor,
  StaffAccount,
  UserRole,
} from "@/lib/types";

interface Props {
  db: DatabaseSchema;
  loggedInStaff: StaffAccount | null;
  onRefreshDb: () => Promise<void>;
  onTriggerApi: (action: string, payload: any) => Promise<boolean>;
}

type MasterTab =
  | "KANIM"
  | "DISDUKCAPIL"
  | "CLINIC"
  | "AIRLINE"
  | "BLK"
  | "EMBASSY"
  | "AGENCY"
  | "SPONSOR"
  | "BPJS_KUR";

export function MasterPartnerDatabaseModule({
  db,
  loggedInStaff,
  onRefreshDb,
  onTriggerApi,
}: Props) {
  const [activeTab, setActiveTab] = useState<MasterTab>("KANIM");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal State
  const [modalType, setModalType] = useState<
    "ADD" | "EDIT" | null
  >(null);
  const [selectedEntity, setSelectedEntity] = useState<any>(null);

  // Form State
  const [formData, setFormData] = useState<any>({});

  const userRoleCodes = loggedInStaff
    ? [loggedInStaff.role, ...(loggedInStaff.secondaryRoles || [])]
    : [];
  const matchedRoles = (db.roles || []).filter((r) =>
    userRoleCodes.includes(r.code),
  );
  const hasRoleWriteAccess = matchedRoles.some(
    (r) =>
      !r.isReadOnly &&
      (r.permissions?.canExecuteOperation || r.permissions?.canManageStaff),
  );

  const isSuperAdminOrDirector =
    !loggedInStaff ||
    userRoleCodes.includes("DIREKTUR") ||
    userRoleCodes.includes("DIREKTUR_UTAMA") ||
    userRoleCodes.includes("ADMIN_PUSAT") ||
    userRoleCodes.includes("STAF_DOKUMEN") ||
    hasRoleWriteAccess;

  const canManageSyarikah =
    !loggedInStaff ||
    userRoleCodes.includes("DIREKTUR") ||
    userRoleCodes.includes("DIREKTUR_UTAMA") ||
    matchedRoles.some((r) => !r.isReadOnly && r.permissions?.canManageStaff);

  const immigrationOffices = db.masterImmigrationOffices || [];
  const disdukcapilList = db.masterDisdukcapil || [];
  const medicalClinics = db.masterMedicalClinics || [];
  const airlines = db.masterAirlines || [];
  const blkList = db.masterBlkLn || [];
  const embassies = db.masterEmbassies || [];
  const agencies = db.foreignAgencies || [];
  const sponsors = db.sponsors || [];
  const bpjsPartners = db.bpjsFinancingPartners || [];

  const handleOpenAddModal = () => {
    setSelectedEntity(null);
    if (activeTab === "KANIM") {
      setFormData({
        code: `KANIM-0${immigrationOffices.length + 1}`,
        name: "",
        city: "",
        province: "Jawa Barat",
        address: "",
        phone: "",
        headOfOfficeName: "",
        headOfOfficeTitle: "Kepala Kantor Imigrasi",
      });
    } else if (activeTab === "DISDUKCAPIL") {
      setFormData({
        code: `DUKCAPIL-0${disdukcapilList.length + 1}`,
        regencyCity: "",
        province: "Jawa Barat",
        officeName: "",
        address: "",
        phone: "",
      });
    } else if (activeTab === "CLINIC") {
      setFormData({
        code: `WAFID-0${medicalClinics.length + 1}`,
        name: "",
        type: "WAFID_GAMCA",
        wafidCode: "WAFID-ID-",
        city: "",
        address: "",
        phone: "",
        doctorInCharge: "",
      });
    } else if (activeTab === "AIRLINE") {
      setFormData({
        iataCode: "",
        icaoCode: "",
        name: "",
        country: "Arab Saudi",
        mainHub: "",
      });
    } else if (activeTab === "BLK") {
      setFormData({
        code: `BLK-0${blkList.length + 1}`,
        name: "",
        ownership: "MITRA_DAERAH",
        vinKemnaker: "",
        accreditationGrade: "A",
        city: "",
        address: "",
        phone: "",
        picName: "",
        capacity: 60,
      });
    } else if (activeTab === "EMBASSY") {
      setFormData({
        code: `EMB-0${embassies.length + 1}`,
        country: "Arab Saudi",
        institutionType: "EMBASSY",
        name: "",
        address: "",
        phone: "",
        email: "",
        appointmentUrl: "",
      });
    } else if (activeTab === "AGENCY") {
      setFormData({
        code: `AGN-SA-00${agencies.length + 1}`,
        name: "",
        country: "Arab Saudi",
        licenseOrWakalahNo: "",
        scheme: "SPSK (Sistem Penempatan Satu Kanal) / Musaned",
        picName: "",
        phoneEmail: "",
        defaultAgencyFeeIdr: 35000000,
        warrantyDays: 90,
        mouExpiryDate: "2028-12-31",
        status: "ACTIVE",
      });
    }
    setModalType("ADD");
  };

  const handleOpenEditModal = (item: any) => {
    setSelectedEntity(item);
    setFormData({ ...item });
    setModalType("EDIT");
  };

  const handleToggleStatus = async (item: any) => {
    if (activeTab === "AGENCY") {
      if (!canManageSyarikah) {
        alert("Hanya Superadmin / Direktur Utama yang dapat mengubah status Syarikah.");
        return;
      }
      setIsSubmitting(true);
      await onTriggerApi("UPDATE_FOREIGN_AGENCY", {
        id: item.id,
        updates: { status: item.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE" },
      });
      setIsSubmitting(false);
      return;
    }
    if (!isSuperAdminOrDirector) {
      alert("Hanya Admin Pusat / Direktur yang memiliki izin mengubah status master data.");
      return;
    }
    setIsSubmitting(true);
    await onTriggerApi("TOGGLE_MASTER_STATUS", {
      entityType: activeTab,
      id: item.id,
    });
    setIsSubmitting(false);
  };

  const handleDeleteItem = async (item: any) => {
    if (activeTab === "AGENCY") {
      if (!canManageSyarikah) {
        alert("Hanya Superadmin / Direktur Utama yang memiliki izin menghapus Master Syarikah.");
        return;
      }
      const confirmDelete = window.confirm(
        `Apakah Anda yakin ingin menghapus Syarikah "${item.name}" (${item.code})?`
      );
      if (!confirmDelete) return;

      setIsSubmitting(true);
      await onTriggerApi("DELETE_FOREIGN_AGENCY", { id: item.id });
      setIsSubmitting(false);
      return;
    }

    if (!isSuperAdminOrDirector) {
      alert("Hanya Admin Pusat / Direktur yang memiliki izin menghapus master data.");
      return;
    }
    const confirmDelete = window.confirm(
      `Apakah Anda yakin ingin menghapus data "${item.name || item.officeName || item.regencyCity}"?`
    );
    if (!confirmDelete) return;

    setIsSubmitting(true);
    await onTriggerApi("DELETE_MASTER_ITEM", {
      entityType: activeTab,
      id: item.id,
    });
    setIsSubmitting(false);
  };

  const handleSaveModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (activeTab === "AGENCY") {
      if (!canManageSyarikah) {
        alert("Hanya Superadmin / Direktur Utama yang dapat menyimpan perubahan Master Syarikah.");
        return;
      }
      setIsSubmitting(true);
      try {
        if (modalType === "ADD") {
          await onTriggerApi("CREATE_FOREIGN_AGENCY", formData);
        } else if (modalType === "EDIT" && selectedEntity) {
          await onTriggerApi("UPDATE_FOREIGN_AGENCY", {
            id: selectedEntity.id,
            updates: formData,
          });
        }
        setModalType(null);
        setSelectedEntity(null);
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    if (!isSuperAdminOrDirector) {
      alert("Hanya Admin Pusat / Direktur yang dapat menyimpan perubahan master data.");
      return;
    }

    setIsSubmitting(true);
    try {
      if (modalType === "ADD") {
        await onTriggerApi("CREATE_MASTER_ITEM", {
          entityType: activeTab,
          data: formData,
        });
      } else if (modalType === "EDIT" && selectedEntity) {
        await onTriggerApi("UPDATE_MASTER_ITEM", {
          entityType: activeTab,
          id: selectedEntity.id,
          data: formData,
        });
      }
      setModalType(null);
      setSelectedEntity(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Notice */}
      <div className="rounded-2xl border border-sky-200 bg-gradient-to-r from-sky-900 via-indigo-900 to-slate-900 p-6 text-white shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 rounded-full bg-sky-500/20 px-3 py-1 text-xs font-semibold text-sky-200 border border-sky-400/30">
              <span>🏛️ Master Data & Mitra Ekosistem Terpadu</span>
              <span>·</span>
              <span>PT. Panca Banyu Ajisakti</span>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
              Pusat Manajemen Master Data Operasional Terintegrasi
            </h1>
            <p className="max-w-3xl text-xs text-sky-100/90 leading-relaxed">
              Seluruh master data (Kantor Imigrasi, Disdukcapil, Klinik Medical Wafid, Maskapai
              Penerbangan, BLK-LN, dan Kedutaan/VFS) tersimpan secara permanen dan dapat diperbarui
              secara langsung kapan saja oleh Admin Pusat & Direksi. Data terhubung otomatis ke surat
              rekomendasi paspor, cetak dokumen, visa, dan tiket terbang CPMI.
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <span className="rounded-lg bg-emerald-500/20 border border-emerald-400/40 px-3 py-1 text-xs font-semibold text-emerald-300">
              ⚡ Status: Live & Terhubung Database
            </span>
            <span className="text-[11px] text-slate-300">
              Kewenangan: {isSuperAdminOrDirector ? "✅ Full Akses (Direktur / Staf Pusat)" : "🔒 Read-Only (Hanya Pantau)"}
            </span>
          </div>
        </div>

        {/* Tab Navigation Quick Summary */}
        <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-6 lg:grid-cols-9">
          {[
            { id: "KANIM", label: "🏛️ Kanim", count: immigrationOffices.length, desc: "Imigrasi" },
            { id: "DISDUKCAPIL", label: "🏢 Disdukcapil", count: disdukcapilList.length, desc: "KTP & KK" },
            { id: "CLINIC", label: "🏥 Medical", count: medicalClinics.length, desc: "Wafid/GAMCA" },
            { id: "AIRLINE", label: "✈️ Maskapai", count: airlines.length, desc: "Airlines" },
            { id: "BLK", label: "🏫 BLK-LN", count: blkList.length, desc: "Balai Latihan" },
            { id: "EMBASSY", label: "🌍 Kedutaan", count: embassies.length, desc: "KBSA & VFS" },
            { id: "AGENCY", label: "🤝 Syarikah", count: agencies.length, desc: "Mitra Timteng" },
            { id: "SPONSOR", label: "👥 Sponsor", count: sponsors.length, desc: "PL Lapangan" },
            { id: "BPJS_KUR", label: "🛡️ BPJS/Bank", count: bpjsPartners.length, desc: "Jaminan" },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => {
                setActiveTab(t.id as MasterTab);
                setSearchQuery("");
              }}
              className={`flex flex-col items-center justify-center rounded-xl p-2.5 text-center transition ${
                activeTab === t.id
                  ? "bg-white text-slate-900 shadow-md ring-2 ring-sky-400 font-bold"
                  : "bg-white/10 text-white hover:bg-white/20"
              }`}
            >
              <span className="text-xs">{t.label}</span>
              <span className="mt-1 text-sm font-extrabold">{t.count}</span>
              <span className="text-[10px] opacity-75">{t.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Tab Content Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        {/* Header Toolbar: Search + Action Button */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-sky-600 block">
              TABEL MASTER DATA OPERASIONAL
            </span>
            <h2 className="text-lg font-bold text-slate-900">
              {activeTab === "KANIM" && "🏛️ Master Kantor Imigrasi (Penerbitan Paspor RI)"}
              {activeTab === "DISDUKCAPIL" && "🏢 Master Disdukcapil (Dinas Kependudukan Sentra CPMI)"}
              {activeTab === "CLINIC" && "🏥 Master Klinik Medical GAMCA / Wafid GCC & Pra-Medical"}
              {activeTab === "AIRLINE" && "✈️ Master Maskapai Penerbangan (Airlines Internasional)"}
              {activeTab === "BLK" && "🏫 Master BLK-LN PT. PBA & Lembaga Sertifikasi Profesi (LSP BNSP)"}
              {activeTab === "EMBASSY" && "🌍 Master Kedutaan Besar & VFS Tasheer (Visa & Biometrik)"}
              {activeTab === "AGENCY" && "🤝 Master Syarikah Arab Saudi & Agensi Mitra Timur Tengah"}
              {activeTab === "SPONSOR" && "👥 Database Sponsor & Petugas Lapangan (PL)"}
              {activeTab === "BPJS_KUR" && "🛡️ Mitra Asuransi BPJS Ketenagakerjaan & Bank Penampung"}
            </h2>
            <p className="text-xs text-slate-500">
              Kelola daftar entitas secara langsung. Data ini selalu terintegrasi otomatis ke dokumen operasional.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <input
                type="text"
                placeholder="Cari data (nama, kota, kode)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-64 rounded-xl border border-slate-300 py-2 pl-3 pr-8 text-xs focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-2.5 text-xs text-slate-400 hover:text-slate-600"
                >
                  ✕
                </button>
              )}
            </div>

            {((isSuperAdminOrDirector && ["KANIM", "DISDUKCAPIL", "CLINIC", "AIRLINE", "BLK", "EMBASSY"].includes(activeTab)) ||
              (activeTab === "AGENCY" && canManageSyarikah)) && (
              <button
                onClick={handleOpenAddModal}
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-sky-700 transition cursor-pointer"
              >
                <span>{activeTab === "AGENCY" ? "➕ Tambah Syarikah Baru" : "➕ Tambah Data Baru"}</span>
              </button>
            )}
          </div>
        </div>

        {/* 1. KANTOR IMIGRASI TAB */}
        {activeTab === "KANIM" && (
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4 font-semibold">Kode & Nama Kantor Imigrasi</th>
                  <th className="py-3 px-4 font-semibold">Wilayah / Kota</th>
                  <th className="py-3 px-4 font-semibold">Alamat Lengkap</th>
                  <th className="py-3 px-4 font-semibold">Kontak & Pejabat Penandatangan</th>
                  <th className="py-3 px-4 font-semibold text-center">Status</th>
                  <th className="py-3 px-4 font-semibold text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {immigrationOffices
                  .filter((k: MasterImmigrationOffice) => {
                    const q = searchQuery.toLowerCase();
                    return (
                      k.name.toLowerCase().includes(q) ||
                      k.city.toLowerCase().includes(q) ||
                      k.province.toLowerCase().includes(q) ||
                      k.code.toLowerCase().includes(q)
                    );
                  })
                  .map((k: MasterImmigrationOffice) => (
                    <tr key={k.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4">
                        <span className="font-mono text-[10px] font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                          {k.code}
                        </span>
                        <p className="font-bold text-slate-900 mt-1">{k.name}</p>
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-medium text-slate-800">{k.city}</p>
                        <p className="text-[11px] text-slate-500">{k.province}</p>
                      </td>
                      <td className="py-3 px-4 max-w-xs text-slate-600 text-[11px]">
                        {k.address}
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-medium text-slate-800">{k.headOfOfficeName || "-"}</p>
                        <p className="text-[10px] text-slate-500">{k.headOfOfficeTitle || "Kepala Kantor"}</p>
                        <p className="text-[11px] text-sky-700 mt-0.5">📞 {k.phone}</p>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleToggleStatus(k)}
                          className={`rounded-full px-2.5 py-1 text-[10px] font-bold border transition ${
                            k.active
                              ? "bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100"
                              : "bg-slate-100 text-slate-500 border-slate-300 hover:bg-slate-200"
                          }`}
                          title="Klik untuk mengubah status aktif/non-aktif"
                        >
                          {k.active ? "● AKTIF" : "○ NON-AKTIF"}
                        </button>
                      </td>
                      <td className="py-3 px-4 text-right space-x-1">
                        {isSuperAdminOrDirector ? (
                          <>
                            <button
                              onClick={() => handleOpenEditModal(k)}
                              className="rounded-lg bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-700 hover:bg-sky-100 border border-sky-200"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteItem(k)}
                              className="rounded-lg bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-100 border border-rose-200"
                            >
                              Hapus
                            </button>
                          </>
                        ) : (
                          <span className="text-[10px] text-slate-400">View Only</span>
                        )}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 2. DISDUKCAPIL TAB */}
        {activeTab === "DISDUKCAPIL" && (
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4 font-semibold">Kode & Nama Dinas (Disdukcapil)</th>
                  <th className="py-3 px-4 font-semibold">Kabupaten / Kota</th>
                  <th className="py-3 px-4 font-semibold">Provinsi</th>
                  <th className="py-3 px-4 font-semibold">Alamat Kantor</th>
                  <th className="py-3 px-4 font-semibold">Kontak / Call Center</th>
                  <th className="py-3 px-4 font-semibold text-center">Status</th>
                  <th className="py-3 px-4 font-semibold text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {disdukcapilList
                  .filter((d: MasterDisdukcapil) => {
                    const q = searchQuery.toLowerCase();
                    return (
                      d.officeName.toLowerCase().includes(q) ||
                      d.regencyCity.toLowerCase().includes(q) ||
                      d.province.toLowerCase().includes(q) ||
                      d.code.toLowerCase().includes(q)
                    );
                  })
                  .map((d: MasterDisdukcapil) => (
                    <tr key={d.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4">
                        <span className="font-mono text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                          {d.code}
                        </span>
                        <p className="font-bold text-slate-900 mt-1">{d.officeName}</p>
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-800">{d.regencyCity}</td>
                      <td className="py-3 px-4 text-slate-600">{d.province}</td>
                      <td className="py-3 px-4 max-w-xs text-slate-600 text-[11px]">{d.address}</td>
                      <td className="py-3 px-4 text-sky-700 font-medium">📞 {d.phone}</td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleToggleStatus(d)}
                          className={`rounded-full px-2.5 py-1 text-[10px] font-bold border transition ${
                            d.active
                              ? "bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100"
                              : "bg-slate-100 text-slate-500 border-slate-300 hover:bg-slate-200"
                          }`}
                        >
                          {d.active ? "● AKTIF" : "○ NON-AKTIF"}
                        </button>
                      </td>
                      <td className="py-3 px-4 text-right space-x-1">
                        {isSuperAdminOrDirector ? (
                          <>
                            <button
                              onClick={() => handleOpenEditModal(d)}
                              className="rounded-lg bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-700 hover:bg-sky-100 border border-sky-200"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteItem(d)}
                              className="rounded-lg bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-100 border border-rose-200"
                            >
                              Hapus
                            </button>
                          </>
                        ) : (
                          <span className="text-[10px] text-slate-400">View Only</span>
                        )}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 3. KLINIK MEDICAL WAFID / GAMCA TAB */}
        {activeTab === "CLINIC" && (
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4 font-semibold">Nama Fasilitas Kesehatan</th>
                  <th className="py-3 px-4 font-semibold">Tipe Akreditasi</th>
                  <th className="py-3 px-4 font-semibold">Kode Wafid GCC</th>
                  <th className="py-3 px-4 font-semibold">Kota & Alamat</th>
                  <th className="py-3 px-4 font-semibold">Dokter / Kontak</th>
                  <th className="py-3 px-4 font-semibold text-center">Status</th>
                  <th className="py-3 px-4 font-semibold text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {medicalClinics
                  .filter((m: MasterMedicalClinic) => {
                    const q = searchQuery.toLowerCase();
                    return (
                      m.name.toLowerCase().includes(q) ||
                      m.city.toLowerCase().includes(q) ||
                      m.code.toLowerCase().includes(q)
                    );
                  })
                  .map((m: MasterMedicalClinic) => (
                    <tr key={m.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4">
                        <span className="font-mono text-[10px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                          {m.code}
                        </span>
                        <p className="font-bold text-slate-900 mt-1">{m.name}</p>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                            m.type === "WAFID_GAMCA"
                              ? "bg-emerald-100 text-emerald-800"
                              : m.type === "PRA_MEDICAL"
                              ? "bg-sky-100 text-sky-800"
                              : "bg-purple-100 text-purple-800"
                          }`}
                        >
                          {m.type === "WAFID_GAMCA"
                            ? "🏥 Wafid GCC (GAMCA)"
                            : m.type === "PRA_MEDICAL"
                            ? "🩺 Pra-Medical In-House"
                            : "🏥 RS Rujukan Spesialis"}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono font-medium text-slate-700">{m.wafidCode || "-"}</td>
                      <td className="py-3 px-4 max-w-xs text-slate-600 text-[11px]">
                        <p className="font-semibold text-slate-800">{m.city}</p>
                        <p className="truncate">{m.address}</p>
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-medium text-slate-800">{m.doctorInCharge || "-"}</p>
                        <p className="text-teal-700 font-semibold mt-0.5">📞 {m.phone}</p>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleToggleStatus(m)}
                          className={`rounded-full px-2.5 py-1 text-[10px] font-bold border transition ${
                            m.active
                              ? "bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100"
                              : "bg-slate-100 text-slate-500 border-slate-300 hover:bg-slate-200"
                          }`}
                        >
                          {m.active ? "● AKTIF" : "○ NON-AKTIF"}
                        </button>
                      </td>
                      <td className="py-3 px-4 text-right space-x-1">
                        {isSuperAdminOrDirector ? (
                          <>
                            <button
                              onClick={() => handleOpenEditModal(m)}
                              className="rounded-lg bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-700 hover:bg-sky-100 border border-sky-200"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteItem(m)}
                              className="rounded-lg bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-100 border border-rose-200"
                            >
                              Hapus
                            </button>
                          </>
                        ) : (
                          <span className="text-[10px] text-slate-400">View Only</span>
                        )}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 4. MASKAPAI PENERBANGAN TAB */}
        {activeTab === "AIRLINE" && (
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4 font-semibold">Nama Maskapai</th>
                  <th className="py-3 px-4 font-semibold">Kode IATA</th>
                  <th className="py-3 px-4 font-semibold">Kode ICAO</th>
                  <th className="py-3 px-4 font-semibold">Negara Asal Maskapai</th>
                  <th className="py-3 px-4 font-semibold">Main Hub / Terminal Penerbangan</th>
                  <th className="py-3 px-4 font-semibold text-center">Status</th>
                  <th className="py-3 px-4 font-semibold text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {airlines
                  .filter((a: MasterAirline) => {
                    const q = searchQuery.toLowerCase();
                    return (
                      a.name.toLowerCase().includes(q) ||
                      a.iataCode.toLowerCase().includes(q) ||
                      a.country.toLowerCase().includes(q)
                    );
                  })
                  .map((a: MasterAirline) => (
                    <tr key={a.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4 font-bold text-slate-900 flex items-center gap-2">
                        <span>✈️</span>
                        <span>{a.name}</span>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-sky-700 text-sm">{a.iataCode}</td>
                      <td className="py-3 px-4 font-mono text-slate-600">{a.icaoCode}</td>
                      <td className="py-3 px-4 font-medium text-slate-800">{a.country}</td>
                      <td className="py-3 px-4 text-slate-600 text-[11px]">{a.mainHub}</td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleToggleStatus(a)}
                          className={`rounded-full px-2.5 py-1 text-[10px] font-bold border transition ${
                            a.active
                              ? "bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100"
                              : "bg-slate-100 text-slate-500 border-slate-300 hover:bg-slate-200"
                          }`}
                        >
                          {a.active ? "● AKTIF" : "○ NON-AKTIF"}
                        </button>
                      </td>
                      <td className="py-3 px-4 text-right space-x-1">
                        {isSuperAdminOrDirector ? (
                          <>
                            <button
                              onClick={() => handleOpenEditModal(a)}
                              className="rounded-lg bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-700 hover:bg-sky-100 border border-sky-200"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteItem(a)}
                              className="rounded-lg bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-100 border border-rose-200"
                            >
                              Hapus
                            </button>
                          </>
                        ) : (
                          <span className="text-[10px] text-slate-400">View Only</span>
                        )}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 5. BLK-LN & LSP BNSP TAB */}
        {activeTab === "BLK" && (
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4 font-semibold">Nama BLK-LN / LSP</th>
                  <th className="py-3 px-4 font-semibold">Kepemilikan & VIN Kemnaker</th>
                  <th className="py-3 px-4 font-semibold">Akreditasi & Kapasitas</th>
                  <th className="py-3 px-4 font-semibold">Kota & Alamat Lengkap</th>
                  <th className="py-3 px-4 font-semibold">PIC / Instruktur Kepala</th>
                  <th className="py-3 px-4 font-semibold text-center">Status</th>
                  <th className="py-3 px-4 font-semibold text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {blkList
                  .filter((b: MasterBlkLn) => {
                    const q = searchQuery.toLowerCase();
                    return (
                      b.name.toLowerCase().includes(q) ||
                      b.city.toLowerCase().includes(q) ||
                      b.code.toLowerCase().includes(q)
                    );
                  })
                  .map((b: MasterBlkLn) => (
                    <tr key={b.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4">
                        <span className="font-mono text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          {b.code}
                        </span>
                        <p className="font-bold text-slate-900 mt-1">{b.name}</p>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                            b.ownership === "INTERNAL_PBA"
                              ? "bg-sky-100 text-sky-800"
                              : "bg-purple-100 text-purple-800"
                          }`}
                        >
                          {b.ownership === "INTERNAL_PBA" ? "🏢 INTERNAL PT. PBA" : "🤝 MITRA DAERAH"}
                        </span>
                        <p className="text-[11px] text-slate-600 mt-1">VIN: {b.vinKemnaker}</p>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          Grade {b.accreditationGrade}
                        </span>
                        <p className="text-[11px] text-slate-600 mt-1">Kapasitas: {b.capacity} Siswa</p>
                      </td>
                      <td className="py-3 px-4 max-w-xs text-slate-600 text-[11px]">
                        <p className="font-semibold text-slate-800">{b.city}</p>
                        <p className="truncate">{b.address}</p>
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-medium text-slate-800">{b.picName}</p>
                        <p className="text-sky-700 font-semibold mt-0.5">📞 {b.phone}</p>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleToggleStatus(b)}
                          className={`rounded-full px-2.5 py-1 text-[10px] font-bold border transition ${
                            b.active
                              ? "bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100"
                              : "bg-slate-100 text-slate-500 border-slate-300 hover:bg-slate-200"
                          }`}
                        >
                          {b.active ? "● AKTIF" : "○ NON-AKTIF"}
                        </button>
                      </td>
                      <td className="py-3 px-4 text-right space-x-1">
                        {isSuperAdminOrDirector ? (
                          <>
                            <button
                              onClick={() => handleOpenEditModal(b)}
                              className="rounded-lg bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-700 hover:bg-sky-100 border border-sky-200"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteItem(b)}
                              className="rounded-lg bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-100 border border-rose-200"
                            >
                              Hapus
                            </button>
                          </>
                        ) : (
                          <span className="text-[10px] text-slate-400">View Only</span>
                        )}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 6. KEDUTAAN & VFS TASHEER TAB */}
        {activeTab === "EMBASSY" && (
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4 font-semibold">Nama Institusi / Lembaga Visa</th>
                  <th className="py-3 px-4 font-semibold">Negara & Tipe</th>
                  <th className="py-3 px-4 font-semibold">Alamat Lengkap</th>
                  <th className="py-3 px-4 font-semibold">Kontak & Email</th>
                  <th className="py-3 px-4 font-semibold">Portal Janji Temu Biometrik</th>
                  <th className="py-3 px-4 font-semibold text-center">Status</th>
                  <th className="py-3 px-4 font-semibold text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {embassies
                  .filter((e: MasterEmbassy) => {
                    const q = searchQuery.toLowerCase();
                    return (
                      e.name.toLowerCase().includes(q) ||
                      e.country.toLowerCase().includes(q) ||
                      e.code.toLowerCase().includes(q)
                    );
                  })
                  .map((e: MasterEmbassy) => (
                    <tr key={e.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4">
                        <span className="font-mono text-[10px] font-bold text-violet-700 bg-violet-50 px-2 py-0.5 rounded border border-violet-200">
                          {e.code}
                        </span>
                        <p className="font-bold text-slate-900 mt-1">{e.name}</p>
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-bold text-slate-800">{e.country}</p>
                        <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                          {e.institutionType === "VFS_TASHEER" ? "Pusat Biometrik VFS" : "Kedutaan Besar Resmi"}
                        </span>
                      </td>
                      <td className="py-3 px-4 max-w-xs text-slate-600 text-[11px]">{e.address}</td>
                      <td className="py-3 px-4">
                        <p className="text-sky-700 font-semibold">📞 {e.phone}</p>
                        <p className="text-slate-500 text-[10px] mt-0.5">✉️ {e.email}</p>
                      </td>
                      <td className="py-3 px-4">
                        {e.appointmentUrl ? (
                          <a
                            href={e.appointmentUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-sky-600 hover:text-sky-800 underline"
                          >
                            <span>🔗 Buka Portal Visa</span>
                          </a>
                        ) : (
                          <span className="text-slate-400 text-[10px]">Langsung / On-site</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleToggleStatus(e)}
                          className={`rounded-full px-2.5 py-1 text-[10px] font-bold border transition ${
                            e.active
                              ? "bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100"
                              : "bg-slate-100 text-slate-500 border-slate-300 hover:bg-slate-200"
                          }`}
                        >
                          {e.active ? "● AKTIF" : "○ NON-AKTIF"}
                        </button>
                      </td>
                      <td className="py-3 px-4 text-right space-x-1">
                        {isSuperAdminOrDirector ? (
                          <>
                            <button
                              onClick={() => handleOpenEditModal(e)}
                              className="rounded-lg bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-700 hover:bg-sky-100 border border-sky-200"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteItem(e)}
                              className="rounded-lg bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-100 border border-rose-200"
                            >
                              Hapus
                            </button>
                          </>
                        ) : (
                          <span className="text-[10px] text-slate-400">View Only</span>
                        )}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 7. SYARIKAH MITRA TIMUR TENGAH TAB */}
        {activeTab === "AGENCY" && (
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4 font-semibold">Kode &amp; Nama Syarikah / Agensi</th>
                  <th className="py-3 px-4 font-semibold">Negara &amp; Skema</th>
                  <th className="py-3 px-4 font-semibold">No. Lisensi / Wakalah Musaned</th>
                  <th className="py-3 px-4 font-semibold">PIC &amp; Kontak</th>
                  <th className="py-3 px-4 font-semibold">Garansi Badil</th>
                  <th className="py-3 px-4 font-semibold text-center">Status</th>
                  <th className="py-3 px-4 font-semibold text-right">Aksi (Superadmin)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {agencies
                  .filter((a: ForeignAgency) => {
                    const q = searchQuery.toLowerCase();
                    return (
                      a.name.toLowerCase().includes(q) ||
                      a.country.toLowerCase().includes(q) ||
                      a.code.toLowerCase().includes(q) ||
                      (a.licenseOrWakalahNo || "").toLowerCase().includes(q) ||
                      (a.picName || "").toLowerCase().includes(q)
                    );
                  })
                  .map((a: ForeignAgency) => (
                    <tr key={a.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4">
                        <span className="font-mono text-[10px] font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                          {a.code}
                        </span>
                        <p className="font-bold text-slate-900 mt-1">{a.name}</p>
                        {a.mouExpiryDate && (
                          <p className="text-[10px] text-slate-500 mt-0.5">
                            MOU s/d {a.mouExpiryDate}
                          </p>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-bold text-slate-800">{a.country}</p>
                        <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-semibold border border-emerald-200">
                          {a.scheme || "SPSK Zero Cost"}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-700">{a.licenseOrWakalahNo || "-"}</td>
                      <td className="py-3 px-4">
                        <p className="font-medium text-slate-800">{a.picName || "-"}</p>
                        <p className="text-sky-700 text-[11px] mt-0.5">{a.phoneEmail || "-"}</p>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          {a.warrantyDays || 90} Hari
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(a)}
                          disabled={!canManageSyarikah || isSubmitting}
                          className={`rounded-full px-2.5 py-1 text-[10px] font-bold border transition ${
                            a.status === "ACTIVE"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100"
                              : "bg-slate-100 text-slate-500 border-slate-300 hover:bg-slate-200"
                          } ${canManageSyarikah ? "cursor-pointer" : "cursor-default"}`}
                        >
                          {a.status === "ACTIVE" ? "● AKTIF" : `○ ${a.status || "NON-AKTIF"}`}
                        </button>
                      </td>
                      <td className="py-3 px-4 text-right space-x-1 whitespace-nowrap">
                        {canManageSyarikah ? (
                          <>
                            <button
                              type="button"
                              onClick={() => handleOpenEditModal(a)}
                              className="rounded-lg bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-700 hover:bg-sky-100 border border-sky-200 cursor-pointer"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteItem(a)}
                              className="rounded-lg bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-100 border border-rose-200 cursor-pointer"
                            >
                              Hapus
                            </button>
                          </>
                        ) : (
                          <span className="text-[10px] text-slate-400">🔒 Khusus Superadmin</span>
                        )}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 8. SPONSOR / PL TAB */}
        {activeTab === "SPONSOR" && (
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4 font-semibold">Kode & Nama Sponsor (PL)</th>
                  <th className="py-3 px-4 font-semibold">Wilayah Perekrutan (Area)</th>
                  <th className="py-3 px-4 font-semibold">Nomor Telepon</th>
                  <th className="py-3 px-4 font-semibold">Nomor Rekening Bank Penampung Fee</th>
                  <th className="py-3 px-4 font-semibold">Standar Fee / CPMI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sponsors
                  .filter((s: Sponsor) => {
                    const q = searchQuery.toLowerCase();
                    return (
                      s.name.toLowerCase().includes(q) ||
                      s.area.toLowerCase().includes(q) ||
                      s.code.toLowerCase().includes(q)
                    );
                  })
                  .map((s: Sponsor) => (
                    <tr key={s.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4">
                        <span className="font-mono text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          {s.code}
                        </span>
                        <p className="font-bold text-slate-900 mt-1">{s.name}</p>
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-800">{s.area}</td>
                      <td className="py-3 px-4 text-sky-700 font-semibold">📞 {s.phone}</td>
                      <td className="py-3 px-4 font-mono text-slate-700">{s.bankAccount}</td>
                      <td className="py-3 px-4 font-bold text-emerald-700">
                        Rp {s.commissionPerCpmi.toLocaleString("id-ID")}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 9. BPJS & BANK KUR TAB */}
        {activeTab === "BPJS_KUR" && (
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4 font-semibold">Kode & Nama Institusi</th>
                  <th className="py-3 px-4 font-semibold">Kategori Kemitraan</th>
                  <th className="py-3 px-4 font-semibold">Program / Paket Jaminan</th>
                  <th className="py-3 px-4 font-semibold">Skema Pembiayaan / Premi</th>
                  <th className="py-3 px-4 font-semibold">PIC & Kontak</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {bpjsPartners
                  .filter((b: BpjsFinancingPartner) => {
                    const q = searchQuery.toLowerCase();
                    return (
                      b.name.toLowerCase().includes(q) ||
                      b.partnerType.toLowerCase().includes(q) ||
                      b.code.toLowerCase().includes(q)
                    );
                  })
                  .map((b: BpjsFinancingPartner) => (
                    <tr key={b.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4">
                        <span className="font-mono text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                          {b.code}
                        </span>
                        <p className="font-bold text-slate-900 mt-1">{b.name}</p>
                      </td>
                      <td className="py-3 px-4">
                        <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700">
                          {b.partnerType}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-700 max-w-xs">{b.programPackage}</td>
                      <td className="py-3 px-4 font-medium text-emerald-700">{b.premiumOrRateInfo}</td>
                      <td className="py-3 px-4">
                        <p className="font-medium text-slate-800">{b.picName}</p>
                        <p className="text-sky-700 text-[11px] mt-0.5">📞 {b.phone}</p>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ========================================================
          MODAL TAMBAH / EDIT MASTER DATA DINAMIS
         ======================================================== */}
      {modalType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-gradient-to-r from-sky-900 to-indigo-900 px-6 py-4 text-white flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold">
                  {modalType === "ADD" ? "➕ Tambah Master Data Baru" : "✏️ Edit Master Data Operasional"}
                </h3>
                <p className="text-xs text-sky-200">
                  Kategori: {activeTab} · Tersimpan langsung dan permanen di database PT. Panca Banyu Ajisakti
                </p>
              </div>
              <button
                onClick={() => setModalType(null)}
                className="rounded-lg bg-white/10 px-2.5 py-1 text-sm font-bold text-white hover:bg-white/20"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              {/* KANIM FORM */}
              {activeTab === "KANIM" && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Kode Kanim</label>
                      <input
                        type="text"
                        required
                        value={formData.code || ""}
                        onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                        className="w-full rounded-xl border border-slate-300 p-2 text-xs font-mono"
                        placeholder="Contoh: KANIM-CRB-1"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Kota / Kabupaten</label>
                      <input
                        type="text"
                        required
                        value={formData.city || ""}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        className="w-full rounded-xl border border-slate-300 p-2 text-xs"
                        placeholder="Contoh: Cirebon"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Nama Kantor Imigrasi Resmi</label>
                    <input
                      type="text"
                      required
                      value={formData.name || ""}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full rounded-xl border border-slate-300 p-2 text-xs font-semibold"
                      placeholder="Contoh: Kantor Imigrasi Kelas I TPI Cirebon"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Provinsi</label>
                      <input
                        type="text"
                        required
                        value={formData.province || ""}
                        onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                        className="w-full rounded-xl border border-slate-300 p-2 text-xs"
                        placeholder="Contoh: Jawa Barat"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">No. Telepon / Fax</label>
                      <input
                        type="text"
                        required
                        value={formData.phone || ""}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full rounded-xl border border-slate-300 p-2 text-xs"
                        placeholder="Contoh: (0231) 488241"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Alamat Kantor Lengkap</label>
                    <textarea
                      required
                      rows={2}
                      value={formData.address || ""}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="w-full rounded-xl border border-slate-300 p-2 text-xs"
                      placeholder="Alamat kantor berserta kode pos..."
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Nama Kepala Kantor Imigrasi</label>
                      <input
                        type="text"
                        value={formData.headOfOfficeName || ""}
                        onChange={(e) => setFormData({ ...formData, headOfOfficeName: e.target.value })}
                        className="w-full rounded-xl border border-slate-300 p-2 text-xs"
                        placeholder="Nama dan gelar pejabat..."
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Jabatan Resmi</label>
                      <input
                        type="text"
                        value={formData.headOfOfficeTitle || ""}
                        onChange={(e) => setFormData({ ...formData, headOfOfficeTitle: e.target.value })}
                        className="w-full rounded-xl border border-slate-300 p-2 text-xs"
                        placeholder="Kepala Kantor Imigrasi..."
                      />
                    </div>
                  </div>
                </>
              )}

              {/* DISDUKCAPIL FORM */}
              {activeTab === "DISDUKCAPIL" && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Kode Wilayah</label>
                      <input
                        type="text"
                        required
                        value={formData.code || ""}
                        onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                        className="w-full rounded-xl border border-slate-300 p-2 text-xs font-mono"
                        placeholder="Contoh: DUKCAPIL-3212"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Kabupaten / Kota</label>
                      <input
                        type="text"
                        required
                        value={formData.regencyCity || ""}
                        onChange={(e) => setFormData({ ...formData, regencyCity: e.target.value })}
                        className="w-full rounded-xl border border-slate-300 p-2 text-xs"
                        placeholder="Contoh: Kabupaten Indramayu"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Nama Kantor Dinas</label>
                    <input
                      type="text"
                      required
                      value={formData.officeName || ""}
                      onChange={(e) => setFormData({ ...formData, officeName: e.target.value })}
                      className="w-full rounded-xl border border-slate-300 p-2 text-xs font-semibold"
                      placeholder="Dinas Kependudukan dan Pencatatan Sipil Kab. Indramayu"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Provinsi</label>
                      <input
                        type="text"
                        required
                        value={formData.province || ""}
                        onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                        className="w-full rounded-xl border border-slate-300 p-2 text-xs"
                        placeholder="Contoh: Jawa Barat"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">No. Kontak / WhatsApp</label>
                      <input
                        type="text"
                        required
                        value={formData.phone || ""}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full rounded-xl border border-slate-300 p-2 text-xs"
                        placeholder="Contoh: (0234) 272046"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Alamat Kantor Disdukcapil</label>
                    <textarea
                      required
                      rows={2}
                      value={formData.address || ""}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="w-full rounded-xl border border-slate-300 p-2 text-xs"
                      placeholder="Alamat kantor pelayanan kependudukan..."
                    />
                  </div>
                </>
              )}

              {/* MEDICAL CLINIC FORM */}
              {activeTab === "CLINIC" && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Kode Klinik</label>
                      <input
                        type="text"
                        required
                        value={formData.code || ""}
                        onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                        className="w-full rounded-xl border border-slate-300 p-2 text-xs font-mono"
                        placeholder="Contoh: WAFID-JKT-01"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Tipe Klinik</label>
                      <select
                        value={formData.type || "WAFID_GAMCA"}
                        onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                        className="w-full rounded-xl border border-slate-300 p-2 text-xs"
                      >
                        <option value="WAFID_GAMCA">Wafid GCC (GAMCA Terakreditasi)</option>
                        <option value="PRA_MEDICAL">Pra-Medical In-House (P3MI Internal)</option>
                        <option value="RS_RUJUKAN">Rumah Sakit Rujukan / Uji Khusus</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Nama Fasilitas Kesehatan</label>
                    <input
                      type="text"
                      required
                      value={formData.name || ""}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full rounded-xl border border-slate-300 p-2 text-xs font-semibold"
                      placeholder="Contoh: Bio Medix Diagnostic Center Jakarta"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Kode Registrasi Wafid GCC</label>
                      <input
                        type="text"
                        value={formData.wafidCode || ""}
                        onChange={(e) => setFormData({ ...formData, wafidCode: e.target.value })}
                        className="w-full rounded-xl border border-slate-300 p-2 text-xs font-mono"
                        placeholder="WAFID-ID-0012"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Kota / Wilayah</label>
                      <input
                        type="text"
                        required
                        value={formData.city || ""}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        className="w-full rounded-xl border border-slate-300 p-2 text-xs"
                        placeholder="Jakarta Timur"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Dokter Penanggung Jawab</label>
                      <input
                        type="text"
                        value={formData.doctorInCharge || ""}
                        onChange={(e) => setFormData({ ...formData, doctorInCharge: e.target.value })}
                        className="w-full rounded-xl border border-slate-300 p-2 text-xs"
                        placeholder="dr. H. Muhammad Farhan, Sp.PK"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Nomor Telepon</label>
                      <input
                        type="text"
                        required
                        value={formData.phone || ""}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full rounded-xl border border-slate-300 p-2 text-xs"
                        placeholder="(021) 80878120"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Alamat Klinik Lengkap</label>
                    <textarea
                      required
                      rows={2}
                      value={formData.address || ""}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="w-full rounded-xl border border-slate-300 p-2 text-xs"
                      placeholder="Alamat laboratorium & klinik..."
                    />
                  </div>
                </>
              )}

              {/* AIRLINE FORM */}
              {activeTab === "AIRLINE" && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Kode IATA (2 Huruf)</label>
                      <input
                        type="text"
                        required
                        maxLength={3}
                        value={formData.iataCode || ""}
                        onChange={(e) => setFormData({ ...formData, iataCode: e.target.value.toUpperCase() })}
                        className="w-full rounded-xl border border-slate-300 p-2 text-xs font-mono font-bold"
                        placeholder="SV"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Kode ICAO (3 Huruf)</label>
                      <input
                        type="text"
                        required
                        maxLength={4}
                        value={formData.icaoCode || ""}
                        onChange={(e) => setFormData({ ...formData, icaoCode: e.target.value.toUpperCase() })}
                        className="w-full rounded-xl border border-slate-300 p-2 text-xs font-mono"
                        placeholder="SVA"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Nama Maskapai Penerbangan</label>
                    <input
                      type="text"
                      required
                      value={formData.name || ""}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full rounded-xl border border-slate-300 p-2 text-xs font-semibold"
                      placeholder="Contoh: Saudia (Saudi Arabian Airlines)"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Negara Asal</label>
                      <input
                        type="text"
                        required
                        value={formData.country || ""}
                        onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                        className="w-full rounded-xl border border-slate-300 p-2 text-xs"
                        placeholder="Arab Saudi"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Main Hub / Terminal</label>
                      <input
                        type="text"
                        required
                        value={formData.mainHub || ""}
                        onChange={(e) => setFormData({ ...formData, mainHub: e.target.value })}
                        className="w-full rounded-xl border border-slate-300 p-2 text-xs"
                        placeholder="JED / RUH"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* BLK FORM */}
              {activeTab === "BLK" && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Kode BLK-LN</label>
                      <input
                        type="text"
                        required
                        value={formData.code || ""}
                        onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                        className="w-full rounded-xl border border-slate-300 p-2 text-xs font-mono"
                        placeholder="BLK-PBA-01"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Kepemilikan</label>
                      <select
                        value={formData.ownership || "MITRA_DAERAH"}
                        onChange={(e) => setFormData({ ...formData, ownership: e.target.value })}
                        className="w-full rounded-xl border border-slate-300 p-2 text-xs"
                      >
                        <option value="INTERNAL_PBA">INTERNAL PT. PANCA BANYU AJISAKTI</option>
                        <option value="MITRA_DAERAH">MITRA BLK DAERAH / KONSORSIUM</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Nama BLK-LN / LSP</label>
                    <input
                      type="text"
                      required
                      value={formData.name || ""}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full rounded-xl border border-slate-300 p-2 text-xs font-semibold"
                      placeholder="BLK-LN PT. Panca Banyu Ajisakti"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">VIN Kemnaker RI</label>
                      <input
                        type="text"
                        required
                        value={formData.vinKemnaker || ""}
                        onChange={(e) => setFormData({ ...formData, vinKemnaker: e.target.value })}
                        className="w-full rounded-xl border border-slate-300 p-2 text-xs font-mono"
                        placeholder="2105317501"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Grade Akreditasi</label>
                      <select
                        value={formData.accreditationGrade || "A"}
                        onChange={(e) => setFormData({ ...formData, accreditationGrade: e.target.value })}
                        className="w-full rounded-xl border border-slate-300 p-2 text-xs font-bold"
                      >
                        <option value="A">Grade A (Unggul)</option>
                        <option value="B">Grade B (Baik)</option>
                        <option value="C">Grade C (Cukup)</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Kapasitas Siswa</label>
                      <input
                        type="number"
                        min={10}
                        required
                        value={formData.capacity || 60}
                        onChange={(e) => setFormData({ ...formData, capacity: Number(e.target.value) })}
                        className="w-full rounded-xl border border-slate-300 p-2 text-xs"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Kota / Lokasi</label>
                      <input
                        type="text"
                        required
                        value={formData.city || ""}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        className="w-full rounded-xl border border-slate-300 p-2 text-xs"
                        placeholder="Jakarta Timur"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">PIC / Instruktur Kepala</label>
                      <input
                        type="text"
                        value={formData.picName || ""}
                        onChange={(e) => setFormData({ ...formData, picName: e.target.value })}
                        className="w-full rounded-xl border border-slate-300 p-2 text-xs"
                        placeholder="Nama kepala BLK..."
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">No. Telepon Asrama</label>
                      <input
                        type="text"
                        required
                        value={formData.phone || ""}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full rounded-xl border border-slate-300 p-2 text-xs"
                        placeholder="(021) 2937373"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Alamat Asrama & Bengkel Latih</label>
                    <textarea
                      required
                      rows={2}
                      value={formData.address || ""}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="w-full rounded-xl border border-slate-300 p-2 text-xs"
                      placeholder="Alamat lengkap fasilitas BLK-LN..."
                    />
                  </div>
                </>
              )}

              {/* EMBASSY FORM */}
              {activeTab === "EMBASSY" && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Kode Lembaga</label>
                      <input
                        type="text"
                        required
                        value={formData.code || ""}
                        onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                        className="w-full rounded-xl border border-slate-300 p-2 text-xs font-mono"
                        placeholder="VFS-TASHEER-JKT"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Tipe Lembaga</label>
                      <select
                        value={formData.institutionType || "EMBASSY"}
                        onChange={(e) => setFormData({ ...formData, institutionType: e.target.value })}
                        className="w-full rounded-xl border border-slate-300 p-2 text-xs"
                      >
                        <option value="EMBASSY">Kedutaan Besar (Embassy)</option>
                        <option value="VFS_TASHEER">VFS Tasheer (Pusat Layanan Visa)</option>
                        <option value="CONSULATE">Konsulat Jenderal (KJRI/Konsulat)</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Nama Lembaga / Kantor</label>
                    <input
                      type="text"
                      required
                      value={formData.name || ""}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full rounded-xl border border-slate-300 p-2 text-xs font-semibold"
                      placeholder="Kedutaan Besar Kerajaan Arab Saudi (KBSA)"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Negara</label>
                      <input
                        type="text"
                        required
                        value={formData.country || ""}
                        onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                        className="w-full rounded-xl border border-slate-300 p-2 text-xs"
                        placeholder="Arab Saudi"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Nomor Telepon</label>
                      <input
                        type="text"
                        required
                        value={formData.phone || ""}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full rounded-xl border border-slate-300 p-2 text-xs"
                        placeholder="(021) 28094000"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Email Resmi</label>
                      <input
                        type="email"
                        value={formData.email || ""}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full rounded-xl border border-slate-300 p-2 text-xs"
                        placeholder="visa@mofa.gov.sa"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">URL Portal Janji Temu</label>
                      <input
                        type="url"
                        value={formData.appointmentUrl || ""}
                        onChange={(e) => setFormData({ ...formData, appointmentUrl: e.target.value })}
                        className="w-full rounded-xl border border-slate-300 p-2 text-xs"
                        placeholder="https://vc.tasheer.com"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Alamat Gedung Lengkap</label>
                    <textarea
                      required
                      rows={2}
                      value={formData.address || ""}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="w-full rounded-xl border border-slate-300 p-2 text-xs"
                      placeholder="Alamat kantor perwakilan..."
                    />
                  </div>
                </>
              )}

              {/* AGENCY / SYARIKAH FORM */}
              {activeTab === "AGENCY" && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Kode Syarikah / Agensi</label>
                      <input
                        type="text"
                        required
                        value={formData.code || ""}
                        onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                        className="w-full rounded-xl border border-slate-300 p-2 text-xs font-mono"
                        placeholder="AGN-SA-001"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Negara Tujuan</label>
                      <select
                        value={formData.country || "Arab Saudi"}
                        onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                        className="w-full rounded-xl border border-slate-300 p-2 text-xs font-semibold"
                      >
                        <option value="Arab Saudi">Arab Saudi</option>
                        <option value="Uni Emirat Arab (UAE)">Uni Emirat Arab (UAE)</option>
                        <option value="Kuwait">Kuwait</option>
                        <option value="Oman">Oman</option>
                        <option value="Yordania">Yordania</option>
                        <option value="Qatar">Qatar</option>
                        <option value="Bahrain">Bahrain</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Nama Syarikah / Agensi Mitra *</label>
                    <input
                      type="text"
                      required
                      value={formData.name || ""}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full rounded-xl border border-slate-300 p-2 text-xs font-semibold"
                      placeholder="Al-Maharah Human Resources Co. (ARCO / SPSK)"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Skema Penempatan</label>
                      <input
                        type="text"
                        required
                        value={formData.scheme || ""}
                        onChange={(e) => setFormData({ ...formData, scheme: e.target.value })}
                        className="w-full rounded-xl border border-slate-300 p-2 text-xs"
                        placeholder="SPSK (Sistem Penempatan Satu Kanal) / Musaned"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">No. Lisensi / Wakalah Musaned</label>
                      <input
                        type="text"
                        required
                        value={formData.licenseOrWakalahNo || ""}
                        onChange={(e) => setFormData({ ...formData, licenseOrWakalahNo: e.target.value })}
                        className="w-full rounded-xl border border-slate-300 p-2 text-xs font-mono"
                        placeholder="MUSANED-SPSK-SA-2026-8812"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">PIC &amp; Divisi Penanggung Jawab</label>
                      <input
                        type="text"
                        required
                        value={formData.picName || ""}
                        onChange={(e) => setFormData({ ...formData, picName: e.target.value })}
                        className="w-full rounded-xl border border-slate-300 p-2 text-xs"
                        placeholder="Sheikh Khalid Al-Otaibi"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Kontak (Telp &amp; Email)</label>
                      <input
                        type="text"
                        required
                        value={formData.phoneEmail || ""}
                        onChange={(e) => setFormData({ ...formData, phoneEmail: e.target.value })}
                        className="w-full rounded-xl border border-slate-300 p-2 text-xs"
                        placeholder="+966-11-4509911 · email@syarikah.sa"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Garansi Badil (Hari)</label>
                      <input
                        type="number"
                        min={0}
                        required
                        value={formData.warrantyDays ?? 90}
                        onChange={(e) => setFormData({ ...formData, warrantyDays: Number(e.target.value) })}
                        className="w-full rounded-xl border border-slate-300 p-2 text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Masa Berlaku MOU</label>
                      <input
                        type="date"
                        required
                        value={formData.mouExpiryDate || "2028-12-31"}
                        onChange={(e) => setFormData({ ...formData, mouExpiryDate: e.target.value })}
                        className="w-full rounded-xl border border-slate-300 p-2 text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Status Kemitraan</label>
                      <select
                        value={formData.status || "ACTIVE"}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                        className="w-full rounded-xl border border-slate-300 p-2 text-xs font-bold"
                      >
                        <option value="ACTIVE">ACTIVE (Aktif)</option>
                        <option value="SUSPENDED">SUSPENDED (Nonaktif)</option>
                        <option value="EXPIRED_MOU">EXPIRED MOU</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Standar Fee Agensi / Wakalah (Rp)</label>
                    <input
                      type="number"
                      min={0}
                      step={500000}
                      value={formData.defaultAgencyFeeIdr ?? 35000000}
                      onChange={(e) => setFormData({ ...formData, defaultAgencyFeeIdr: Number(e.target.value) })}
                      className="w-full rounded-xl border border-slate-300 p-2 text-xs font-mono"
                    />
                  </div>
                </>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setModalType(null)}
                  disabled={isSubmitting}
                  className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-xl bg-sky-600 px-5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-sky-700 transition"
                >
                  {isSubmitting ? "Menyimpan..." : "💾 Simpan ke Database"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
