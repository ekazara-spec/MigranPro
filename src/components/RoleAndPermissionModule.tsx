"use client";

import React, { useState } from "react";
import {
  AppRole,
  AuditLog,
  Branch,
  Candidate,
  Sponsor,
  StaffAccount,
} from "@/lib/types";
import {
  ShieldCheck,
  Shield,
  Users,
  KeyRound,
  CheckCircle2,
  XCircle,
  Plus,
  Trash2,
  Edit3,
  Save,
  Lock,
  Unlock,
  Building2,
  History,
  FileCheck2,
  Briefcase,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Search,
  Filter,
  LayoutGrid,
  Table,
  X,
} from "lucide-react";

export interface NavigationModuleItem {
  id: string;
  code: string;
  name: string;
  group: "INFORMATION" | "OPERASIONAL" | "FINANCE" | "ADMINISTRATOR" | "SETTING";
  groupLabel: string;
  description: string;
}

export const APP_MODULES: NavigationModuleItem[] = [
  // 1. INFORMATION
  {
    id: "beranda",
    code: "MOD_BERANDA",
    name: "Beranda (Dashboard)",
    group: "INFORMATION",
    groupLabel: "1. Information",
    description: "Command Center ringkasan statistik & alur CPMI",
  },
  {
    id: "pengingat",
    code: "MOD_PENGINGAT",
    name: "Pengingat Dokumen",
    group: "INFORMATION",
    groupLabel: "1. Information",
    description: "Radar jatuh tempo masa berlaku paspor/medikal/visa (< 30 hari)",
  },
  {
    id: "cases",
    code: "MOD_CASES",
    name: "Case (Pengaduan PMI)",
    group: "INFORMATION",
    groupLabel: "1. Information",
    description: "Helpdesk tiket kendala & perlindungan luar negeri",
  },
  {
    id: "portal_cpmi",
    code: "MOD_PORTAL",
    name: "Portal Mandiri CPMI",
    group: "INFORMATION",
    groupLabel: "1. Information",
    description: "Cek NIK mandiri untuk transparansi calon pekerja & keluarga",
  },

  // 2. OPERASIONAL
  {
    id: "cpmi",
    code: "MOD_CPMI",
    name: "Person (Data CPMI)",
    group: "OPERASIONAL",
    groupLabel: "2. Operasional",
    description: "Pendaftaran calon pekerja, berkas digital & alur Rekom/Non-Rekom",
  },
  {
    id: "vacancy",
    code: "MOD_VACANCY",
    name: "Job Order (Lowongan)",
    group: "OPERASIONAL",
    groupLabel: "2. Operasional",
    description: "Permintaan kuota & kualifikasi majikan/syarikah Timur Tengah",
  },
  {
    id: "employer_matching",
    code: "MOD_MATCHING",
    name: "Wawancara Majikan",
    group: "OPERASIONAL",
    groupLabel: "2. Operasional",
    description: "Penjodohan kandidat & video call Syarikah dua zona waktu",
  },
  {
    id: "pelatihan",
    code: "MOD_PELATIHAN",
    name: "BLK-LN & Pelatihan",
    group: "OPERASIONAL",
    groupLabel: "2. Operasional",
    description: "Pelatihan bahasa Arab, kompetensi tata graha & monitoring asrama",
  },
  {
    id: "medical_visa",
    code: "MOD_MED_VISA",
    name: "Medical, Visa & Terbang",
    group: "OPERASIONAL",
    groupLabel: "2. Operasional",
    description: "Medical Gamca Wafid Fit, pengajuan visa KSA & tiket penerbangan",
  },
  {
    id: "doc_print",
    code: "MOD_DOC_PRINT",
    name: "Cetak Dokumen (PDF)",
    group: "OPERASIONAL",
    groupLabel: "2. Operasional",
    description: "Generator Paspor Imigrasi, Rekom Disnaker, PK Resmi & CV Syarikah",
  },

  // 3. FINANCE & ACCOUNTING
  {
    id: "keuangan",
    code: "MOD_KEUANGAN",
    name: "Keuangan & Fee Sponsor",
    group: "FINANCE",
    groupLabel: "3. Finance & Accounting",
    description: "Pencairan fee sponsor bertahap (DP 1, DP 2, DP 3 & Pelunasan)",
  },
  {
    id: "aruskas_kasbon",
    code: "MOD_ARUSKAS",
    name: "Arus Kas & Kasbon Bank",
    group: "FINANCE",
    groupLabel: "3. Finance & Accounting",
    description: "Buku kas operasional, kasbon potong komisi & invoice Wakalah SAR",
  },

  // 4. ADMINISTRATOR
  {
    id: "saas_tenants",
    code: "MOD_PROFIL_PT",
    name: "Profil PT & Cabang",
    group: "ADMINISTRATOR",
    groupLabel: "4. Administrator",
    description: "Profil legal PT. Panca Banyu Ajisakti & pos kantor cabang daerah",
  },
  {
    id: "cabang_audit",
    code: "MOD_STAF_AUDIT",
    name: "Staf, Sponsor & Audit",
    group: "ADMINISTRATOR",
    groupLabel: "4. Administrator",
    description: "Manajemen staf, hak akses per role & audit log",
  },

  // 5. SETTING / PENGATURAN
  {
    id: "master_data",
    code: "MOD_MASTER_DATA",
    name: "Master Data & Mitra",
    group: "SETTING",
    groupLabel: "5. Setting / Pengaturan",
    description: "Database Syarikah Timur Tengah, Klinik Gamca, Asuransi, Maskapai",
  },
  {
    id: "whatsapp_gateway",
    code: "MOD_WA_GATEWAY",
    name: "WhatsApp Gateway",
    group: "SETTING",
    groupLabel: "5. Setting / Pengaturan",
    description: "Broadcast notifikasi tahapan otomatis & gateway pengiriman pesan",
  },
  {
    id: "maintenance",
    code: "MOD_MAINTENANCE",
    name: "Maintenance & Backup",
    group: "SETTING",
    groupLabel: "5. Setting / Pengaturan",
    description: "Khusus Superadmin: Backup database (.json), restore & reset data dummy",
  },
];

interface Props {
  roles?: AppRole[];
  staffAccounts: StaffAccount[];
  branches: Branch[];
  sponsors: Sponsor[];
  auditLogs: AuditLog[];
  candidates: Candidate[];
  loggedInStaff: StaffAccount | null;
  isBranchViewOnly: boolean;
  canManageStaff?: boolean;
  actorName: string;
  actorRole: string;
  onRefreshDb: () => void;
  onSwitchStaffAccount: (staff: StaffAccount) => void;
  onStaffUpdated?: (staff: StaffAccount) => void;
  onOpenAddStaffModal: () => void;
}

export default function RoleAndPermissionModule({
  roles = [],
  staffAccounts,
  branches,
  sponsors,
  auditLogs,
  candidates,
  loggedInStaff,
  isBranchViewOnly,
  canManageStaff = false,
  actorName,
  actorRole,
  onRefreshDb,
  onSwitchStaffAccount,
  onStaffUpdated,
  onOpenAddStaffModal,
}: Props) {
  const hasStaffManagePrivilege =
    !isBranchViewOnly && (Boolean(canManageStaff) || actorRole === "DIREKTUR");

  const [activeSubTab, setActiveSubTab] = useState<
    "matrix" | "roles" | "staff" | "sponsors" | "audit"
  >("matrix");

  // State Matrix Edit In-Memory
  const [roleMenuMap, setRoleMenuMap] = useState<Record<string, string[]>>({});
  const [roleManageStaffMap, setRoleManageStaffMap] = useState<Record<string, boolean>>({});
  const [isMatrixDirty, setIsMatrixDirty] = useState(false);
  const [savingMatrix, setSavingMatrix] = useState(false);

  // State Tampilan & Aksi Daftar Akun Staf
  const [staffViewMode, setStaffViewMode] = useState<"matrix" | "cards">("matrix");
  const [staffSearchQuery, setStaffSearchQuery] = useState("");
  const [staffRoleFilter, setStaffRoleFilter] = useState("ALL");
  const [editingStaff, setEditingStaff] = useState<StaffAccount | null>(null);
  const [savingStaffEdit, setSavingStaffEdit] = useState(false);
  const [deletingStaff, setDeletingStaff] = useState<StaffAccount | null>(null);
  const [deletingStaffBusy, setDeletingStaffBusy] = useState(false);

  // State Tampilan & Aksi Database Sponsor (PL)
  const [sponsorViewMode, setSponsorViewMode] = useState<"matrix" | "cards">("matrix");
  const [sponsorSearchQuery, setSponsorSearchQuery] = useState("");
  const [sponsorBranchFilter, setSponsorBranchFilter] = useState("ALL");
  const [showAddSponsorModal, setShowAddSponsorModal] = useState(false);
  const [newSponsorForm, setNewSponsorForm] = useState({
    name: "",
    phone: "",
    area: "",
    branchId: "ALL",
    bankAccount: "",
    commissionPerCpmi: 5000000,
  });
  const [savingAddSponsor, setSavingAddSponsor] = useState(false);
  const [editingSponsor, setEditingSponsor] = useState<Sponsor | null>(null);
  const [savingEditSponsor, setSavingEditSponsor] = useState(false);
  const [deletingSponsor, setDeletingSponsor] = useState<Sponsor | null>(null);
  const [deletingSponsorBusy, setDeletingSponsorBusy] = useState(false);

  // State Modal Tambah Role
  const [showAddRoleModal, setShowAddRoleModal] = useState(false);
  const [newRoleForm, setNewRoleForm] = useState({
    code: "",
    name: "",
    description: "",
    isReadOnly: false,
    canManageStaff: false,
    allowedScope: "ALL" as "ALL" | "BRANCH" | "OWN",
    allowedMenus: ["beranda", "cpmi"] as string[],
  });

  // State Modal Edit Role
  const [editingRole, setEditingRole] = useState<AppRole | null>(null);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [feedbackMsg, setFeedbackMsg] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Sinkronisasi in-memory matrix dari prop roles
  React.useEffect(() => {
    const map: Record<string, string[]> = {};
    const manageMap: Record<string, boolean> = {};
    for (const r of roles) {
      map[r.id] = [...(r.allowedMenus || [])];
      manageMap[r.id] = Boolean(r.permissions?.canManageStaff || r.code === "DIREKTUR");
    }
    setRoleMenuMap(map);
    setRoleManageStaffMap(manageMap);
    setIsMatrixDirty(false);
  }, [roles]);

  // Toggle modul tertentu untuk role tertentu
  function handleToggleMenu(roleId: string, menuId: string) {
    if (isBranchViewOnly) return;
    setRoleMenuMap((prev) => {
      const current = prev[roleId] || [];
      const updated = current.includes(menuId)
        ? current.filter((m) => m !== menuId)
        : [...current, menuId];
      return { ...prev, [roleId]: updated };
    });
    setIsMatrixDirty(true);
  }

  // Pilih Semua / Hapus Semua modul untuk role tertentu
  function handleToggleAllMenus(roleId: string, selectAll: boolean) {
    if (isBranchViewOnly) return;
    setRoleMenuMap((prev) => ({
      ...prev,
      [roleId]: selectAll ? APP_MODULES.map((m) => m.id) : ["beranda"],
    }));
    setIsMatrixDirty(true);
  }

  // Toggle izin kelola, edit & hapus akun user untuk role tertentu
  function handleToggleManageStaffPerm(roleId: string, roleCode: string) {
    if (isBranchViewOnly || roleCode === "DIREKTUR") return;
    setRoleManageStaffMap((prev) => ({
      ...prev,
      [roleId]: !prev[roleId],
    }));
    setIsMatrixDirty(true);
  }

  // Simpan seluruh perubahan matrix perizinan ke API
  async function handleSaveMatrix() {
    setSavingMatrix(true);
    setFeedbackMsg(null);
    try {
      for (const role of roles) {
        const updatedMenus = roleMenuMap[role.id];
        const nextManageStaff =
          role.code === "DIREKTUR"
            ? true
            : Boolean(roleManageStaffMap[role.id]);
        if (updatedMenus) {
          const res = await fetch("/api/p3mi", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "UPDATE_ROLE",
              actorName,
              actorRole,
              payload: {
                id: role.id,
                allowedMenus: updatedMenus,
                permissions: {
                  ...role.permissions,
                  canSeeFinance:
                    role.code === "DIREKTUR" || updatedMenus.includes("keuangan"),
                  canManageStaff: nextManageStaff,
                },
              },
            }),
          });
          const data = await res.json();
          if (!data.ok) throw new Error(data.error || `Gagal menyimpan role ${role.name}`);
        }
      }

      setFeedbackMsg({
        type: "success",
        text: "Matrix hak akses modul & menu seluruh role berhasil diperbarui!",
      });
      setIsMatrixDirty(false);
      onRefreshDb();
    } catch (err: unknown) {
      setFeedbackMsg({
        type: "error",
        text: err instanceof Error ? err.message : "Gagal menyimpan matrix perizinan.",
      });
    } finally {
      setSavingMatrix(false);
    }
  }

  // Submit Buat Role Baru
  async function handleCreateRole(e: React.FormEvent) {
    e.preventDefault();
    setFeedbackMsg(null);
    try {
      const res = await fetch("/api/p3mi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "CREATE_ROLE",
          actorName,
          actorRole,
          payload: {
            code: newRoleForm.code,
            name: newRoleForm.name,
            description: newRoleForm.description,
            isReadOnly: newRoleForm.isReadOnly,
            allowedScope: newRoleForm.allowedScope,
            allowedMenus: newRoleForm.allowedMenus,
            permissions: {
              canVerify: !newRoleForm.isReadOnly,
              canViewSensitive: true,
              canSeeFinance: newRoleForm.allowedMenus.includes("keuangan"),
              canManageStaff: Boolean(newRoleForm.canManageStaff),
              canExecuteOperation: !newRoleForm.isReadOnly,
            },
          },
        }),
      });

      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Gagal membuat role baru.");

      setFeedbackMsg({
        type: "success",
        text: `Role '${newRoleForm.name}' (${newRoleForm.code}) berhasil dibuat!`,
      });
      setShowAddRoleModal(false);
      setNewRoleForm({
        code: "",
        name: "",
        description: "",
        isReadOnly: false,
        canManageStaff: false,
        allowedScope: "ALL",
        allowedMenus: ["beranda", "cpmi"],
      });
      onRefreshDb();
    } catch (err: unknown) {
      setFeedbackMsg({
        type: "error",
        text: err instanceof Error ? err.message : "Terjadi kesalahan.",
      });
    }
  }

  // Submit Edit Role
  async function handleUpdateRole(e: React.FormEvent) {
    e.preventDefault();
    if (!editingRole) return;
    setFeedbackMsg(null);
    try {
      const res = await fetch("/api/p3mi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "UPDATE_ROLE",
          actorName,
          actorRole,
          payload: {
            id: editingRole.id,
            name: editingRole.name,
            description: editingRole.description,
            isReadOnly: editingRole.isReadOnly,
            allowedScope: editingRole.allowedScope,
            allowedMenus: editingRole.allowedMenus,
            permissions: editingRole.permissions,
          },
        }),
      });

      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Gagal memperbarui role.");

      setFeedbackMsg({
        type: "success",
        text: `Role '${editingRole.name}' berhasil diperbarui!`,
      });
      setEditingRole(null);
      onRefreshDb();
    } catch (err: unknown) {
      setFeedbackMsg({
        type: "error",
        text: err instanceof Error ? err.message : "Terjadi kesalahan.",
      });
    }
  }

  // Hapus Role Kustom
  async function handleDeleteRole(role: AppRole) {
    if (role.isSystemRole) {
      alert("Role bawaan sistem tidak boleh dihapus.");
      return;
    }
    if (!confirm(`Yakin ingin menghapus role kustom '${role.name}'?`)) return;

    try {
      const res = await fetch("/api/p3mi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "DELETE_ROLE",
          actorName,
          actorRole,
          payload: { id: role.id },
        }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Gagal menghapus role.");

      setFeedbackMsg({
        type: "success",
        text: `Role '${role.name}' berhasil dihapus.`,
      });
      onRefreshDb();
    } catch (err: unknown) {
      setFeedbackMsg({
        type: "error",
        text: err instanceof Error ? err.message : "Gagal menghapus.",
      });
    }
  }

  // Simpan Perubahan Edit Akun Staf (Khusus Superadmin / Role Pengelola Staf)
  async function handleUpdateStaff(e: React.FormEvent) {
    e.preventDefault();
    if (!editingStaff) return;
    setSavingStaffEdit(true);
    setFeedbackMsg(null);
    try {
      const res = await fetch("/api/p3mi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "UPDATE_STAFF",
          actorName,
          actorRole,
          payload: {
            id: editingStaff.id,
            name: editingStaff.name,
            email: editingStaff.email,
            role: editingStaff.role,
            secondaryRoles: editingStaff.secondaryRoles || [],
            branchId: editingStaff.branchId,
            phone: editingStaff.phone,
            pinCode: editingStaff.pinCode,
            active: editingStaff.active,
          },
        }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Gagal memperbarui akun staf.");

      if (loggedInStaff?.id === data.staff.id && onStaffUpdated) {
        onStaffUpdated(data.staff);
      }
      setFeedbackMsg({
        type: "success",
        text: `Akun staf '${data.staff.name}' (${data.staff.roleLabel}) berhasil diperbarui.`,
      });
      setEditingStaff(null);
      onRefreshDb();
    } catch (err: unknown) {
      setFeedbackMsg({
        type: "error",
        text: err instanceof Error ? err.message : "Gagal memperbarui akun staf.",
      });
    } finally {
      setSavingStaffEdit(false);
    }
  }

  // Hapus Akun Staf (Khusus Superadmin / Role Pengelola Staf)
  async function handleConfirmDeleteStaff() {
    if (!deletingStaff) return;
    setDeletingStaffBusy(true);
    setFeedbackMsg(null);
    try {
      const res = await fetch("/api/p3mi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "DELETE_STAFF",
          actorName,
          actorRole,
          payload: {
            id: deletingStaff.id,
            currentLoggedInStaffId: loggedInStaff?.id,
          },
        }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Gagal menghapus akun staf.");

      setFeedbackMsg({
        type: "success",
        text: `Akun staf '${deletingStaff.name}' berhasil dihapus.`,
      });
      setDeletingStaff(null);
      onRefreshDb();
    } catch (err: unknown) {
      setFeedbackMsg({
        type: "error",
        text: err instanceof Error ? err.message : "Gagal menghapus akun staf.",
      });
    } finally {
      setDeletingStaffBusy(false);
    }
  }

  // Filter akun staf untuk tampilan matrix & kartu
  const filteredStaffAccounts = staffAccounts.filter((st) => {
    if (staffRoleFilter !== "ALL" && st.role !== staffRoleFilter) return false;
    if (staffSearchQuery.trim()) {
      const q = staffSearchQuery.toLowerCase();
      const matchName = st.name.toLowerCase().includes(q);
      const matchEmail = st.email.toLowerCase().includes(q);
      const matchPhone = (st.phone || "").toLowerCase().includes(q);
      const matchRole = (st.roleLabel || st.role).toLowerCase().includes(q);
      if (!matchName && !matchEmail && !matchPhone && !matchRole) return false;
    }
    return true;
  });

  // Handler Tambah Sponsor PL
  async function handleCreateSponsor(e: React.FormEvent) {
    e.preventDefault();
    setSavingAddSponsor(true);
    setFeedbackMsg(null);
    try {
      const res = await fetch("/api/p3mi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "CREATE_SPONSOR",
          actorName,
          actorRole,
          payload: {
            name: newSponsorForm.name.trim(),
            phone: newSponsorForm.phone.trim() || "-",
            area: newSponsorForm.area.trim() || "-",
            branchId:
              newSponsorForm.branchId === "ALL"
                ? branches[0]?.id || "br-idm"
                : newSponsorForm.branchId,
            bankAccount: newSponsorForm.bankAccount.trim() || "-",
            commissionPerCpmi: Number(newSponsorForm.commissionPerCpmi) || 5000000,
          },
        }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Gagal menambahkan Sponsor PL.");

      setFeedbackMsg({
        type: "success",
        text: `Sponsor / PL '${data.sponsor?.name || newSponsorForm.name}' berhasil ditambahkan.`,
      });
      setShowAddSponsorModal(false);
      setNewSponsorForm({
        name: "",
        phone: "",
        area: "",
        branchId: "ALL",
        bankAccount: "",
        commissionPerCpmi: 5000000,
      });
      onRefreshDb();
    } catch (err: unknown) {
      setFeedbackMsg({
        type: "error",
        text: err instanceof Error ? err.message : "Gagal menambahkan Sponsor PL.",
      });
    } finally {
      setSavingAddSponsor(false);
    }
  }

  // Handler Edit Sponsor PL
  async function handleUpdateSponsor(e: React.FormEvent) {
    e.preventDefault();
    if (!editingSponsor) return;
    setSavingEditSponsor(true);
    setFeedbackMsg(null);
    try {
      const res = await fetch("/api/p3mi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "UPDATE_SPONSOR",
          actorName,
          actorRole,
          payload: {
            id: editingSponsor.id,
            updates: {
              code: editingSponsor.code.trim(),
              name: editingSponsor.name.trim(),
              area: editingSponsor.area.trim() || "-",
              branchId: editingSponsor.branchId,
              phone: editingSponsor.phone.trim() || "-",
              bankAccount: (editingSponsor.bankAccount || "").trim() || "-",
              commissionPerCpmi: Number(editingSponsor.commissionPerCpmi) || 0,
            },
          },
        }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Gagal memperbarui data Sponsor PL.");

      setFeedbackMsg({
        type: "success",
        text: `Data Sponsor / PL '${editingSponsor.name}' berhasil diperbarui.`,
      });
      setEditingSponsor(null);
      onRefreshDb();
    } catch (err: unknown) {
      setFeedbackMsg({
        type: "error",
        text: err instanceof Error ? err.message : "Gagal memperbarui data Sponsor PL.",
      });
    } finally {
      setSavingEditSponsor(false);
    }
  }

  // Handler Hapus Sponsor PL
  async function handleConfirmDeleteSponsor() {
    if (!deletingSponsor) return;
    setDeletingSponsorBusy(true);
    setFeedbackMsg(null);
    try {
      const res = await fetch("/api/p3mi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "DELETE_SPONSOR",
          actorName,
          actorRole,
          payload: { id: deletingSponsor.id },
        }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Gagal menghapus data Sponsor PL.");

      setFeedbackMsg({
        type: "success",
        text: `Sponsor / PL '${deletingSponsor.name}' (${deletingSponsor.code}) berhasil dihapus.`,
      });
      setDeletingSponsor(null);
      onRefreshDb();
    } catch (err: unknown) {
      setFeedbackMsg({
        type: "error",
        text: err instanceof Error ? err.message : "Gagal menghapus data Sponsor PL.",
      });
    } finally {
      setDeletingSponsorBusy(false);
    }
  }

  // Filter daftar sponsor untuk tampilan matrix & kartu
  const filteredSponsors = sponsors.filter((sp) => {
    if (sponsorBranchFilter !== "ALL" && sp.branchId !== sponsorBranchFilter) return false;
    if (sponsorSearchQuery.trim()) {
      const q = sponsorSearchQuery.toLowerCase();
      const matchName = sp.name.toLowerCase().includes(q);
      const matchCode = sp.code.toLowerCase().includes(q);
      const matchArea = (sp.area || "").toLowerCase().includes(q);
      const matchPhone = (sp.phone || "").toLowerCase().includes(q);
      const matchBank = (sp.bankAccount || "").toLowerCase().includes(q);
      if (!matchName && !matchCode && !matchArea && !matchPhone && !matchBank) return false;
    }
    return true;
  });

  // Filter modul berdasarkan pencarian
  const filteredModules = APP_MODULES.filter(
    (m) =>
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.groupLabel.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Banner View-Only Cabang */}
      {isBranchViewOnly && (
        <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-amber-200">
          <div className="flex items-center gap-3">
            <Lock className="h-5 w-5 shrink-0 text-amber-400" />
            <div className="text-sm">
              <span className="font-bold">Mode Pantau Cabang (View-Only): </span>
              Pengaturan akun staf, pembuatan role baru, dan konfigurasi hak akses modul hanya dapat diubah oleh Admin Pusat / Direktur Utama.
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
              className="text-xs font-semibold underline hover:text-white cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </div>
      )}

      {/* Header Utama Modul RBAC & Role */}
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-700/60 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-6 shadow-xl lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-sky-400">
            <ShieldCheck className="h-4 w-4" />
            Manajemen Peran & Hak Akses (Multi-User RBAC)
          </div>
          <h2 className="mt-1 text-2xl font-black text-white">
            Tata Kelola Staf, Peran (Role) & Matrix Modul
          </h2>
          <p className="mt-1 text-xs text-slate-300">
            Atur siapa yang berhak melihat dan mengeksekusi setiap modul dari ke-5 grup kerja operasional PT. Panca Banyu Ajisakti.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {!isBranchViewOnly && (
            <button
              onClick={() => setShowAddRoleModal(true)}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-sky-500/20 transition hover:brightness-110 cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              + Tambah Role Baru
            </button>
          )}

          {hasStaffManagePrivilege && (
            <button
              onClick={onOpenAddStaffModal}
              className="flex items-center gap-2 rounded-xl border border-slate-600 bg-slate-800 px-4 py-2.5 text-xs font-bold text-white hover:bg-slate-700 transition cursor-pointer"
            >
              <Users className="h-4 w-4 text-sky-400" />
              + Tambah Akun Staf
            </button>
          )}
        </div>
      </div>

      {/* Sub-Tab Navigasi */}
      <div className="flex gap-2 border-b border-slate-700 pb-2 overflow-x-auto text-xs font-semibold">
        <button
          onClick={() => setActiveSubTab("matrix")}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 transition cursor-pointer ${
            activeSubTab === "matrix"
              ? "bg-sky-600 text-white shadow"
              : "bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white"
          }`}
        >
          <Shield className="h-4 w-4 text-sky-300" />
          Matrix Hak Akses Modul ({roles.length} Role)
          {isMatrixDirty && (
            <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
          )}
        </button>

        <button
          onClick={() => setActiveSubTab("staff")}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 transition cursor-pointer ${
            activeSubTab === "staff"
              ? "bg-sky-600 text-white shadow"
              : "bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white"
          }`}
        >
          <Users className="h-4 w-4 text-teal-300" />
          Daftar Akun Staf ({staffAccounts.length} User)
        </button>

        <button
          onClick={() => setActiveSubTab("roles")}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 transition cursor-pointer ${
            activeSubTab === "roles"
              ? "bg-sky-600 text-white shadow"
              : "bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white"
          }`}
        >
          <KeyRound className="h-4 w-4 text-indigo-300" />
          Katalog Peran & Cakupan
        </button>

        <button
          onClick={() => setActiveSubTab("sponsors")}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 transition cursor-pointer ${
            activeSubTab === "sponsors"
              ? "bg-sky-600 text-white shadow"
              : "bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white"
          }`}
        >
          <Briefcase className="h-4 w-4 text-amber-300" />
          Database Sponsor PL ({sponsors.length})
        </button>

        <button
          onClick={() => setActiveSubTab("audit")}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 transition cursor-pointer ${
            activeSubTab === "audit"
              ? "bg-sky-600 text-white shadow"
              : "bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white"
          }`}
        >
          <History className="h-4 w-4 text-slate-300" />
          Log Jejak Audit ({auditLogs.length})
        </button>
      </div>

      {/* ============================================================
          PANEL 1: MATRIX HAK AKSES MODUL PER ROLE
         ============================================================ */}
      {activeSubTab === "matrix" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/60 p-4 rounded-xl border border-slate-700">
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="h-3.5 w-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari modul atau grup..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="rounded-lg border border-slate-700 bg-slate-800 pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-sky-500 w-64"
                />
              </div>
              <span className="text-xs text-slate-400">
                Menampilkan <strong>{filteredModules.length}</strong> modul
              </span>
            </div>

            <div className="flex items-center gap-3">
              {isMatrixDirty && (
                <span className="text-xs font-semibold text-amber-300 flex items-center gap-1.5 animate-pulse">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  Ada perubahan belum disimpan
                </span>
              )}
              {!isBranchViewOnly && (
                <button
                  onClick={handleSaveMatrix}
                  disabled={savingMatrix || !isMatrixDirty}
                  className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow hover:bg-emerald-500 disabled:opacity-40 cursor-pointer"
                >
                  <Save className="h-3.5 w-3.5" />
                  {savingMatrix ? "Menyimpan Matrix..." : "Simpan Perubahan Matrix"}
                </button>
              )}
            </div>
          </div>

          {/* Matrix Grid Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-700 bg-slate-900 shadow-xl">
            <table className="w-full text-left text-xs text-slate-200">
              <thead className="bg-slate-950 text-slate-300 uppercase text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4 min-w-[240px] sticky left-0 z-10 bg-slate-950 shadow-md">
                    Modul Sistem (5 Grup Kerja)
                  </th>
                  {roles.map((r) => (
                    <th key={r.id} className="py-3 px-3 text-center min-w-[140px]">
                      <div className="font-bold text-white">{r.name}</div>
                      <div className="text-[9px] font-mono text-sky-400 lowercase">
                        {r.code}
                      </div>
                      <div className="mt-1 flex items-center justify-center gap-1">
                        <span
                          className={`rounded px-1.5 py-0.2 text-[8px] font-bold ${
                            r.isReadOnly
                              ? "bg-amber-500/20 text-amber-300"
                              : "bg-emerald-500/20 text-emerald-300"
                          }`}
                        >
                          {r.isReadOnly ? "View-Only" : "Akses Penuh"}
                        </span>
                        {!isBranchViewOnly && (
                          <button
                            onClick={() => {
                              const curr = roleMenuMap[r.id] || [];
                              const allChecked = curr.length === APP_MODULES.length;
                              handleToggleAllMenus(r.id, !allChecked);
                            }}
                            className="text-[9px] text-slate-400 hover:text-white underline"
                            title="Centang / Hapus Semua"
                          >
                            All
                          </button>
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {/* Loop per Grup Modul */}
                {(
                  [
                    "INFORMATION",
                    "OPERASIONAL",
                    "FINANCE",
                    "ADMINISTRATOR",
                    "SETTING",
                  ] as const
                ).map((grp) => {
                  const grpModules = filteredModules.filter((m) => m.group === grp);
                  if (grpModules.length === 0) return null;

                  const grpColor =
                    grp === "INFORMATION"
                      ? "text-indigo-400 bg-indigo-950/30 border-indigo-900/50"
                      : grp === "OPERASIONAL"
                      ? "text-teal-400 bg-teal-950/30 border-teal-900/50"
                      : grp === "FINANCE"
                      ? "text-emerald-400 bg-emerald-950/30 border-emerald-900/50"
                      : grp === "ADMINISTRATOR"
                      ? "text-sky-400 bg-sky-950/30 border-sky-900/50"
                      : "text-amber-400 bg-amber-950/30 border-amber-900/50";

                  return (
                    <React.Fragment key={grp}>
                      <tr className={`border-y ${grpColor}`}>
                        <td
                          colSpan={roles.length + 1}
                          className="py-2 px-4 font-bold text-xs uppercase tracking-wider"
                        >
                          {grpModules[0]?.groupLabel}
                        </td>
                      </tr>
                      {grpModules.map((mod) => (
                        <tr
                          key={mod.id}
                          className="hover:bg-slate-800/40 transition-colors"
                        >
                          <td className="py-2.5 px-4 sticky left-0 z-10 bg-slate-900/95 border-r border-slate-800/80">
                            <div className="font-semibold text-white">{mod.name}</div>
                            <div className="text-[10px] text-slate-400 line-clamp-1">
                              {mod.description}
                            </div>
                          </td>
                          {roles.map((r) => {
                            const allowed = (roleMenuMap[r.id] || []).includes(mod.id);
                            return (
                              <td
                                key={r.id}
                                className="py-2 px-3 text-center align-middle"
                              >
                                <button
                                  type="button"
                                  disabled={isBranchViewOnly}
                                  onClick={() => handleToggleMenu(r.id, mod.id)}
                                  className={`inline-flex items-center justify-center h-7 w-7 rounded-lg transition cursor-pointer ${
                                    allowed
                                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 hover:bg-emerald-500/30"
                                      : "bg-slate-800/50 text-slate-600 border border-slate-800 hover:border-slate-700"
                                  } disabled:cursor-not-allowed`}
                                  title={`${r.name}: ${allowed ? "Diizinkan" : "Disembunyikan"}`}
                                >
                                  {allowed ? (
                                    <CheckCircle2 className="h-4 w-4" />
                                  ) : (
                                    <XCircle className="h-4 w-4" />
                                  )}
                                </button>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </React.Fragment>
                  );
                })}

                {/* Baris Khusus Hak Akses Superadmin Kelola/Edit/Hapus Akun Staf */}
                <tr className="border-y text-rose-300 bg-rose-950/30 border-rose-900/50">
                  <td
                    colSpan={roles.length + 1}
                    className="py-2 px-4 font-bold text-xs uppercase tracking-wider"
                  >
                    6. Izin Khusus Superadmin (Edit &amp; Hapus User)
                  </td>
                </tr>
                <tr className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-2.5 px-4 sticky left-0 z-10 bg-slate-900/95 border-r border-slate-800/80">
                    <div className="font-semibold text-white">
                      Kelola, Edit &amp; Hapus Akun User
                    </div>
                    <div className="text-[10px] text-slate-400 line-clamp-1">
                      Wewenang Superadmin untuk menambah, mengubah data/PIN/role, dan menghapus akun staf
                    </div>
                  </td>
                  {roles.map((r) => {
                    const isDirector = r.code === "DIREKTUR";
                    const canManage = isDirector || Boolean(roleManageStaffMap[r.id]);
                    return (
                      <td key={r.id} className="py-2 px-3 text-center align-middle">
                        <button
                          type="button"
                          disabled={isBranchViewOnly || isDirector}
                          onClick={() => handleToggleManageStaffPerm(r.id, r.code)}
                          className={`inline-flex items-center justify-center h-7 w-7 rounded-lg transition cursor-pointer ${
                            canManage
                              ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30"
                              : "bg-slate-800/50 text-slate-600 border border-slate-800 hover:border-slate-700"
                          } disabled:cursor-not-allowed`}
                          title={
                            isDirector
                              ? "Direktur Utama (Superadmin) selalu memiliki hak penuh kelola user"
                              : `${r.name}: ${
                                  canManage
                                    ? "Bisa Edit & Hapus User"
                                    : "Tidak Bisa Edit & Hapus User"
                                }`
                          }
                        >
                          {canManage ? (
                            <ShieldCheck className="h-4 w-4" />
                          ) : (
                            <XCircle className="h-4 w-4" />
                          )}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              </tbody>
            </table>
          </div>

          <div className="rounded-xl border border-sky-500/20 bg-sky-500/10 p-3 text-[11px] text-sky-200">
            💡 <strong>Prinsip Kerja Matrix RBAC:</strong> Menu yang dicentang hijau akan otomatis tampil di sidebar saat staf dengan role bersangkutan login. Menu yang disilang merah otomatis disembunyikan dan diisolasi demi kepatuhan operasional P3MI.
          </div>
        </div>
      )}

      {/* ============================================================
          PANEL 2: KATALOG PERAN (ROLE) & PENGATURAN DETAIL
         ============================================================ */}
      {activeSubTab === "roles" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {roles.map((role) => {
              const staffCount = staffAccounts.filter((s) => s.role === role.code).length;
              return (
                <div
                  key={role.id}
                  className="rounded-2xl border border-slate-700 bg-slate-900/80 p-5 space-y-4 shadow-lg hover:border-slate-600 transition"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded">
                        {role.code}
                      </span>
                      <h4 className="font-bold text-white text-base mt-1">
                        {role.name}
                      </h4>
                    </div>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        role.isSystemRole
                          ? "bg-slate-700 text-slate-300"
                          : "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                      }`}
                    >
                      {role.isSystemRole ? "Bawaan Sistem" : "Role Kustom"}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 min-h-[36px] line-clamp-2">
                    {role.description || "Tidak ada keterangan tambahan."}
                  </p>

                  <div className="border-t border-slate-800 pt-3 text-xs space-y-1.5 text-slate-400">
                    <div className="flex justify-between">
                      <span>Cakupan Wilayah:</span>
                      <strong className="text-white">
                        {role.allowedScope === "ALL"
                          ? "Seluruh Cabang (Pusat)"
                          : role.allowedScope === "BRANCH"
                          ? "Wilayah Cabang Sendiri"
                          : "Kandidat PL Sendiri"}
                      </strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Hak Eksekusi:</span>
                      <strong
                        className={role.isReadOnly ? "text-amber-400" : "text-emerald-400"}
                      >
                        {role.isReadOnly ? "View-Only (Pantau)" : "Akses Penuh (Eksekusi)"}
                      </strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Jumlah Staf Aktif:</span>
                      <strong className="text-sky-400">{staffCount} Pengguna</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Modul Diizinkan:</span>
                      <strong className="text-white">
                        {role.allowedMenus?.length || 0} / {APP_MODULES.length} Modul
                      </strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Edit &amp; Hapus User:</span>
                      <strong
                        className={
                          role.permissions?.canManageStaff || role.code === "DIREKTUR"
                            ? "text-amber-300"
                            : "text-slate-500"
                        }
                      >
                        {role.permissions?.canManageStaff || role.code === "DIREKTUR"
                          ? "Superadmin (Bisa Edit & Hapus)"
                          : "Tidak Diizinkan"}
                      </strong>
                    </div>
                  </div>

                  {!isBranchViewOnly && (
                    <div className="border-t border-slate-800 pt-3 flex items-center justify-between">
                      <button
                        onClick={() => setEditingRole(role)}
                        className="text-xs font-semibold text-sky-400 hover:text-sky-300 flex items-center gap-1 cursor-pointer"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                        Edit Role
                      </button>

                      {!role.isSystemRole && (
                        <button
                          onClick={() => handleDeleteRole(role)}
                          className="text-xs font-semibold text-rose-400 hover:text-rose-300 flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Hapus
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ============================================================
          PANEL 3: DAFTAR AKUN STAF (MATRIX BARIS KOLOM & KARTU)
         ============================================================ */}
      {activeSubTab === "staff" && (
        <div className="space-y-4">
          {/* Toolbar Kontrol Daftar Akun */}
          <div className="flex flex-col gap-3 rounded-xl border border-slate-700 bg-slate-900/70 p-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-1">
              <p className="text-xs text-slate-300">
                Total <strong className="text-white">{staffAccounts.length}</strong> akun staf terdaftar (menampilkan{" "}
                <strong className="text-sky-300">{filteredStaffAccounts.length}</strong> user). Klik{" "}
                <strong>Login</strong> untuk menguji simulasi role secara langsung.
              </p>
              <div className="flex items-center gap-2 text-[11px]">
                {hasStaffManagePrivilege ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 px-2.5 py-0.5 font-semibold text-amber-300">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Akses Superadmin Aktif: Bisa Tambah, Edit &amp; Hapus User
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-800 border border-slate-700 px-2.5 py-0.5 font-medium text-slate-400">
                    <Lock className="h-3 w-3" />
                    Mode Standar: Hanya role Superadmin / Kelola Staf yang dapat mengedit atau menghapus user
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="h-3.5 w-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari nama, email, telp..."
                  value={staffSearchQuery}
                  onChange={(e) => setStaffSearchQuery(e.target.value)}
                  className="w-48 rounded-lg border border-slate-700 bg-slate-800 pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-400 focus:border-sky-500 focus:outline-none"
                />
              </div>

              <select
                value={staffRoleFilter}
                onChange={(e) => setStaffRoleFilter(e.target.value)}
                className="rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1.5 text-xs text-slate-200 focus:border-sky-500 focus:outline-none"
              >
                <option value="ALL">Semua Role ({staffAccounts.length})</option>
                {roles.map((r) => (
                  <option key={r.code} value={r.code}>
                    {r.name}
                  </option>
                ))}
              </select>

              {/* Toggle Matrix Baris & Kolom vs Kartu */}
              <div className="inline-flex rounded-lg border border-slate-700 bg-slate-950 p-0.5 text-xs">
                <button
                  type="button"
                  onClick={() => setStaffViewMode("matrix")}
                  className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 font-semibold transition cursor-pointer ${
                    staffViewMode === "matrix"
                      ? "bg-sky-600 text-white shadow-sm"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <Table className="h-3.5 w-3.5" />
                  Matrix Baris &amp; Kolom
                </button>
                <button
                  type="button"
                  onClick={() => setStaffViewMode("cards")}
                  className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 font-semibold transition cursor-pointer ${
                    staffViewMode === "cards"
                      ? "bg-sky-600 text-white shadow-sm"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <LayoutGrid className="h-3.5 w-3.5" />
                  Kartu
                </button>
              </div>

              {hasStaffManagePrivilege && (
                <button
                  onClick={onOpenAddStaffModal}
                  className="flex items-center gap-1.5 rounded-lg bg-sky-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-sky-500 cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Tambah Akun Staf
                </button>
              )}
            </div>
          </div>

          {/* TAMPILAN 1: MATRIX BARIS & KOLOM */}
          {staffViewMode === "matrix" && (
            <div className="overflow-x-auto rounded-2xl border border-slate-700 bg-slate-900 shadow-xl">
              <table className="w-full text-left text-xs text-slate-200">
                <thead className="bg-slate-950 text-[10px] font-bold uppercase tracking-wider text-slate-300 border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-3 text-center w-10">No</th>
                    <th className="py-3 px-4 min-w-[200px]">Nama Staf &amp; Email Login</th>
                    <th className="py-3 px-3 min-w-[170px]">Peran (Role RBAC)</th>
                    <th className="py-3 px-3 min-w-[160px]">Wilayah Akses</th>
                    <th className="py-3 px-3 min-w-[140px]">No. Telp &amp; PIN</th>
                    <th className="py-3 px-3 text-center min-w-[125px]">Hak Kelola User</th>
                    <th className="py-3 px-3 text-center min-w-[100px]">Status</th>
                    <th className="py-3 px-4 text-right min-w-[210px]">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/70">
                  {filteredStaffAccounts.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400">
                        Tidak ada akun staf yang cocok dengan filter pencarian.
                      </td>
                    </tr>
                  ) : (
                    filteredStaffAccounts.map((st, idx) => {
                      const isCurrent = loggedInStaff?.id === st.id;
                      const branchLabel =
                        st.branchId === "ALL"
                          ? "Seluruh Cabang (Pusat)"
                          : branches.find((b) => b.id === st.branchId)?.name || st.branchId;
                      const matchedRole = roles.find((r) => r.code === st.role);
                      const isUserSuperadmin =
                        st.role === "DIREKTUR" || Boolean(matchedRole?.permissions?.canManageStaff);

                      return (
                        <tr
                          key={st.id}
                          className={`transition-colors ${
                            isCurrent
                              ? "bg-sky-950/35 hover:bg-sky-950/45"
                              : "hover:bg-slate-800/45"
                          }`}
                        >
                          <td className="py-3 px-3 text-center font-mono text-slate-400">
                            {idx + 1}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-white">{st.name}</span>
                              {isCurrent && (
                                <span className="rounded bg-sky-500/20 px-1.5 py-0.5 text-[9px] font-bold text-sky-300 border border-sky-500/30">
                                  Login
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] font-mono text-slate-400">{st.email}</div>
                          </td>
                          <td className="py-3 px-3">
                            <div className="flex flex-wrap gap-1">
                              <span className="inline-flex rounded-full bg-slate-800 border border-slate-700 px-2.5 py-0.5 text-[10px] font-bold text-sky-300">
                                {matchedRole?.name || st.role}
                              </span>
                              {(st.secondaryRoles || []).map((sr) => {
                                const srObj = roles.find((r) => r.code === sr);
                                return (
                                  <span
                                    key={sr}
                                    className="inline-flex rounded-full bg-indigo-500/15 border border-indigo-500/30 px-2 py-0.5 text-[10px] font-semibold text-indigo-300"
                                  >
                                    + {srObj?.name || sr}
                                  </span>
                                );
                              })}
                            </div>
                            <div className="mt-0.5 text-[10px] font-mono text-slate-500">
                              {st.role}
                              {st.secondaryRoles?.length
                                ? ` + ${st.secondaryRoles.join(", ")}`
                                : ""}
                            </div>
                          </td>
                          <td className="py-3 px-3 text-slate-300 font-medium">
                            {branchLabel}
                          </td>
                          <td className="py-3 px-3">
                            <div className="text-slate-300">{st.phone || "-"}</div>
                            <div className="text-[10px] text-slate-400">
                              Pass: <strong className="font-mono text-white">{st.pinCode}</strong>
                            </div>
                          </td>
                          <td className="py-3 px-3 text-center">
                            {isUserSuperadmin ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 text-[10px] font-bold text-amber-300">
                                <ShieldCheck className="h-3 w-3" />
                                Superadmin
                              </span>
                            ) : (
                              <span className="inline-flex rounded-full bg-slate-800 px-2 py-0.5 text-[10px] text-slate-400">
                                Standar
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span
                              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                st.active
                                  ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                                  : "bg-rose-500/15 text-rose-300 border border-rose-500/30"
                              }`}
                            >
                              ● {st.active ? "Aktif" : "Non-Aktif"}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center justify-end gap-1.5">
                              {isCurrent ? (
                                <span className="rounded-lg bg-sky-500/20 text-sky-300 px-2.5 py-1 text-[10px] font-bold border border-sky-500/30">
                                  ✓ Aktif
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  disabled={!st.active}
                                  onClick={() => onSwitchStaffAccount(st)}
                                  className="rounded-lg bg-sky-600 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-sky-500 disabled:opacity-40 transition cursor-pointer"
                                >
                                  Login
                                </button>
                              )}

                              {hasStaffManagePrivilege && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => setEditingStaff({ ...st })}
                                    title={`Edit User ${st.name}`}
                                    className="inline-flex items-center gap-1 rounded-lg border border-slate-600 bg-slate-800 px-2.5 py-1 text-[11px] font-semibold text-slate-200 hover:border-sky-400 hover:text-sky-300 transition cursor-pointer"
                                  >
                                    <Edit3 className="h-3 w-3" />
                                    Edit
                                  </button>
                                  <button
                                    type="button"
                                    disabled={isCurrent}
                                    onClick={() => setDeletingStaff(st)}
                                    title={
                                      isCurrent
                                        ? "Akun sedang login tidak dapat dihapus"
                                        : `Hapus User ${st.name}`
                                    }
                                    className="inline-flex items-center gap-1 rounded-lg border border-rose-500/30 bg-rose-500/10 px-2.5 py-1 text-[11px] font-semibold text-rose-300 hover:bg-rose-500/25 disabled:opacity-35 disabled:cursor-not-allowed transition cursor-pointer"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                    Hapus
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* TAMPILAN 2: KARTU (CARD GRID) */}
          {staffViewMode === "cards" && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {filteredStaffAccounts.map((st) => {
                const isCurrent = loggedInStaff?.id === st.id;
                const branchLabel =
                  st.branchId === "ALL"
                    ? "Seluruh Cabang (Pusat)"
                    : branches.find((b) => b.id === st.branchId)?.name || st.branchId;
                const matchedRole = roles.find((r) => r.code === st.role);
                const isUserSuperadmin =
                  st.role === "DIREKTUR" || Boolean(matchedRole?.permissions?.canManageStaff);

                return (
                  <div
                    key={st.id}
                    className={`rounded-2xl border p-4.5 transition space-y-3 ${
                      isCurrent
                        ? "border-sky-500 bg-sky-950/40 ring-2 ring-sky-500/30"
                        : "border-slate-700 bg-slate-900/80"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-bold text-white">{st.name}</p>
                        <p className="text-[11px] font-mono text-slate-400">{st.email}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className="rounded-full bg-slate-800 border border-slate-700 px-2 py-0.5 text-[10px] font-bold text-sky-300">
                          {matchedRole?.name || st.role}
                        </span>
                        {(st.secondaryRoles || []).map((sr) => {
                          const srObj = roles.find((r) => r.code === sr);
                          return (
                            <span
                              key={sr}
                              className="rounded-full bg-indigo-500/15 border border-indigo-500/30 px-2 py-0.5 text-[9px] font-semibold text-indigo-300"
                            >
                              + {srObj?.name || sr}
                            </span>
                          );
                        })}
                        {isUserSuperadmin && (
                          <span className="rounded-full bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 text-[9px] font-bold text-amber-300">
                            Superadmin
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-xs text-slate-300 space-y-1">
                      <p>
                        Wilayah Akses: <strong>{branchLabel}</strong>
                      </p>
                      <p className="text-slate-400 text-[11px]">
                        Telp: {st.phone} · Pass: <strong className="font-mono text-white">{st.pinCode}</strong>
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2">
                      <span
                        className={`text-[10px] font-bold ${
                          st.active ? "text-emerald-400" : "text-rose-400"
                        }`}
                      >
                        ● {st.active ? "Akun Aktif" : "Non-Aktif"}
                      </span>

                      <div className="flex items-center gap-1.5">
                        {hasStaffManagePrivilege && (
                          <>
                            <button
                              type="button"
                              onClick={() => setEditingStaff({ ...st })}
                              className="inline-flex items-center gap-1 rounded-lg border border-slate-600 bg-slate-800 px-2.5 py-1 text-[11px] font-semibold text-slate-200 hover:border-sky-400 hover:text-sky-300 transition cursor-pointer"
                            >
                              <Edit3 className="h-3 w-3" />
                              Edit
                            </button>
                            <button
                              type="button"
                              disabled={isCurrent}
                              onClick={() => setDeletingStaff(st)}
                              title={
                                isCurrent
                                  ? "Akun sedang login tidak dapat dihapus"
                                  : "Hapus Akun Staf"
                              }
                              className="inline-flex items-center gap-1 rounded-lg border border-rose-500/30 bg-rose-500/10 px-2.5 py-1 text-[11px] font-semibold text-rose-300 hover:bg-rose-500/25 disabled:opacity-35 disabled:cursor-not-allowed transition cursor-pointer"
                            >
                              <Trash2 className="h-3 w-3" />
                              Hapus
                            </button>
                          </>
                        )}

                        {isCurrent ? (
                          <span className="rounded bg-sky-500/20 text-sky-300 px-2.5 py-1 text-[10px] font-bold border border-sky-500/30">
                            ✓ Sedang Login
                          </span>
                        ) : (
                          <button
                            type="button"
                            disabled={!st.active}
                            onClick={() => onSwitchStaffAccount(st)}
                            className="rounded-lg bg-sky-600 px-3 py-1 text-xs font-semibold text-white hover:bg-sky-500 disabled:opacity-40 transition cursor-pointer"
                          >
                            Login Akun Ini
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ============================================================
          PANEL 4: DATABASE SPONSOR (PL) (MATRIX BARIS KOLOM & KARTU)
         ============================================================ */}
      {activeSubTab === "sponsors" && (
        <div className="space-y-4">
          {/* Toolbar Kontrol Database Sponsor PL */}
          <div className="flex flex-col gap-3 rounded-xl border border-slate-700 bg-slate-900/70 p-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-sm font-bold text-white">
                  Database Petugas Lapangan (Sponsor / PL Rekrutmen)
                </h3>
                <span className="rounded-full bg-amber-500/20 text-amber-300 px-2.5 py-0.5 text-[10px] font-bold border border-amber-500/30">
                  {sponsors.length} Sponsor Terdaftar
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Menampilkan <strong className="text-sky-300">{filteredSponsors.length}</strong> mitra sponsor lapangan perekrut PMI kawasan Timur Tengah.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="h-3.5 w-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari kode, nama PL, wilayah..."
                  value={sponsorSearchQuery}
                  onChange={(e) => setSponsorSearchQuery(e.target.value)}
                  className="w-48 rounded-lg border border-slate-700 bg-slate-800 pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-400 focus:border-sky-500 focus:outline-none"
                />
              </div>

              <select
                value={sponsorBranchFilter}
                onChange={(e) => setSponsorBranchFilter(e.target.value)}
                className="rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1.5 text-xs text-slate-200 focus:border-sky-500 focus:outline-none"
              >
                <option value="ALL">Semua Cabang ({sponsors.length})</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>

              {/* Toggle Matrix Baris & Kolom vs Kartu */}
              <div className="inline-flex rounded-lg border border-slate-700 bg-slate-950 p-0.5 text-xs">
                <button
                  type="button"
                  onClick={() => setSponsorViewMode("matrix")}
                  className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 font-semibold transition cursor-pointer ${
                    sponsorViewMode === "matrix"
                      ? "bg-sky-600 text-white shadow-sm"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <Table className="h-3.5 w-3.5" />
                  Matrix Baris &amp; Kolom
                </button>
                <button
                  type="button"
                  onClick={() => setSponsorViewMode("cards")}
                  className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 font-semibold transition cursor-pointer ${
                    sponsorViewMode === "cards"
                      ? "bg-sky-600 text-white shadow-sm"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <LayoutGrid className="h-3.5 w-3.5" />
                  Kartu
                </button>
              </div>

              {hasStaffManagePrivilege && (
                <button
                  type="button"
                  onClick={() => setShowAddSponsorModal(true)}
                  className="flex items-center gap-1.5 rounded-lg bg-sky-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-sky-500 cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Tambah Sponsor PL
                </button>
              )}
            </div>
          </div>

          {/* TAMPILAN 1: MATRIX BARIS & KOLOM */}
          {sponsorViewMode === "matrix" && (
            <div className="overflow-x-auto rounded-2xl border border-slate-700 bg-slate-900 shadow-xl">
              <table className="w-full text-left text-xs text-slate-200">
                <thead className="bg-slate-950 text-[10px] font-bold uppercase tracking-wider text-slate-300 border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-3 text-center w-10">No</th>
                    <th className="py-3 px-4 min-w-[180px]">Kode &amp; Nama Sponsor (PL)</th>
                    <th className="py-3 px-3 min-w-[180px]">Wilayah &amp; Cabang</th>
                    <th className="py-3 px-3 min-w-[130px]">Kontak (HP/WA)</th>
                    <th className="py-3 px-3 min-w-[200px]">Rekening Bank</th>
                    <th className="py-3 px-3 text-right min-w-[120px]">Fee / CPMI</th>
                    <th className="py-3 px-3 text-center min-w-[100px]">Total CPMI</th>
                    {hasStaffManagePrivilege && (
                      <th className="py-3 px-4 text-right min-w-[150px]">Aksi</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/70">
                  {filteredSponsors.length === 0 ? (
                    <tr>
                      <td
                        colSpan={hasStaffManagePrivilege ? 8 : 7}
                        className="py-8 text-center text-slate-400"
                      >
                        Tidak ada data sponsor PL yang cocok dengan filter pencarian.
                      </td>
                    </tr>
                  ) : (
                    filteredSponsors.map((sp, idx) => {
                      const cpmiCount = candidates.filter((c) => c.sponsorId === sp.id).length;
                      const branchName =
                        branches.find((b) => b.id === sp.branchId)?.name || sp.branchId;

                      return (
                        <tr key={sp.id} className="hover:bg-slate-800/45 transition-colors">
                          <td className="py-3 px-3 text-center font-mono text-slate-400">
                            {idx + 1}
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-bold text-white">{sp.name}</div>
                            <div className="text-[10px] font-mono font-bold text-amber-400">
                              {sp.code}
                            </div>
                          </td>
                          <td className="py-3 px-3">
                            <div className="text-slate-200 font-medium">{sp.area || "-"}</div>
                            <div className="text-[10px] text-slate-400">{branchName}</div>
                          </td>
                          <td className="py-3 px-3 font-mono text-[11px] text-slate-300">
                            {sp.phone || "-"}
                          </td>
                          <td className="py-3 px-3 font-mono text-[11px] text-slate-300">
                            {sp.bankAccount || "-"}
                          </td>
                          <td className="py-3 px-3 text-right font-semibold text-emerald-300">
                            Rp {(sp.commissionPerCpmi || 0).toLocaleString("id-ID")}
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span className="inline-flex rounded-full bg-sky-500/15 border border-sky-500/30 px-2.5 py-0.5 text-[10px] font-bold text-sky-300">
                              {cpmiCount} CPMI
                            </span>
                          </td>
                          {hasStaffManagePrivilege && (
                            <td className="py-3 px-4">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => setEditingSponsor({ ...sp })}
                                  className="inline-flex items-center gap-1 rounded-lg border border-slate-600 bg-slate-800 px-2.5 py-1 text-[11px] font-semibold text-slate-200 hover:border-sky-400 hover:text-sky-300 transition cursor-pointer"
                                >
                                  <Edit3 className="h-3 w-3" />
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setDeletingSponsor(sp)}
                                  className="inline-flex items-center gap-1 rounded-lg border border-rose-500/30 bg-rose-500/10 px-2.5 py-1 text-[11px] font-semibold text-rose-300 hover:bg-rose-500/25 transition cursor-pointer"
                                >
                                  <Trash2 className="h-3 w-3" />
                                  Hapus
                                </button>
                              </div>
                            </td>
                          )}
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* TAMPILAN 2: KARTU (CARD GRID) */}
          {sponsorViewMode === "cards" && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredSponsors.map((sp) => {
                const cpmiCount = candidates.filter((c) => c.sponsorId === sp.id).length;
                const branchName =
                  branches.find((b) => b.id === sp.branchId)?.name || sp.branchId;

                return (
                  <div
                    key={sp.id}
                    className="rounded-2xl border border-slate-700 bg-slate-900/80 p-4.5 space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-mono font-bold text-amber-400">
                          {sp.code}
                        </span>
                        <h4 className="font-bold text-white text-sm">{sp.name}</h4>
                      </div>
                      <span className="rounded-full bg-sky-500/15 border border-sky-500/30 px-2.5 py-0.5 text-[10px] font-bold text-sky-300">
                        {cpmiCount} CPMI
                      </span>
                    </div>

                    <div className="text-xs text-slate-300 space-y-1">
                      <p>
                        Wilayah: <strong>{sp.area}</strong> ({branchName})
                      </p>
                      <p className="text-slate-400 text-[11px]">Kontak: {sp.phone}</p>
                      <p className="text-[11px] font-mono text-slate-400">
                        Rek: {sp.bankAccount || "-"}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-2">
                      <span className="text-[11px] font-semibold text-emerald-300">
                        Fee: Rp {(sp.commissionPerCpmi || 0).toLocaleString("id-ID")}
                      </span>
                      {hasStaffManagePrivilege && (
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setEditingSponsor({ ...sp })}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-600 bg-slate-800 px-2.5 py-1 text-[11px] font-semibold text-slate-200 hover:border-sky-400 hover:text-sky-300 transition cursor-pointer"
                          >
                            <Edit3 className="h-3 w-3" />
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingSponsor(sp)}
                            className="inline-flex items-center gap-1 rounded-lg border border-rose-500/30 bg-rose-500/10 px-2.5 py-1 text-[11px] font-semibold text-rose-300 hover:bg-rose-500/25 transition cursor-pointer"
                          >
                            <Trash2 className="h-3 w-3" />
                            Hapus
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ============================================================
          PANEL 5: JEJAK AUDIT LOG
         ============================================================ */}
      {activeSubTab === "audit" && (
        <div className="rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-xl space-y-4">
          <div className="border-b border-slate-800 pb-3">
            <h3 className="text-base font-bold text-white">
              Jejak Audit Log Operasional & Keamanan Sistem
            </h3>
            <p className="text-xs text-slate-400">
              Pencatatan riwayat setiap aksi mutasi berkas, cetak dokumen, pencairan komisi, dan login sesuai UU PDP.
            </p>
          </div>

          <div className="space-y-2.5 max-h-[600px] overflow-y-auto pr-2">
            {auditLogs.map((log) => (
              <div
                key={log.id}
                className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5 text-xs text-slate-300 space-y-1"
              >
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-sky-400 flex items-center gap-1.5">
                    <History className="h-3.5 w-3.5" />
                    {log.actorName} ({log.actorRole})
                  </span>
                  <span className="font-mono text-slate-500">{log.timestamp}</span>
                </div>
                <p className="font-semibold text-white">{log.summary}</p>
                {log.details && (
                  <p className="text-slate-400 text-[11px]">{log.details}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ============================================================
          MODAL: TAMBAH ROLE BARU (CUSTOM DYNAMIC ROLE)
         ============================================================ */}
      {showAddRoleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-700 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-sky-400" />
                Tambah Peran Akses Baru (Custom Role)
              </h3>
              <button
                onClick={() => setShowAddRoleModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateRole} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Nama Peran (Role Name)
                  </label>
                  <input
                    type="text"
                    required
                    value={newRoleForm.name}
                    onChange={(e) =>
                      setNewRoleForm({
                        ...newRoleForm,
                        name: e.target.value,
                        code:
                          newRoleForm.code ||
                          e.target.value.toUpperCase().replace(/\s+/g, "_"),
                      })
                    }
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white"
                    placeholder="Contoh: Staf Keuangan & Kasir"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Kode Peran (System Code)
                  </label>
                  <input
                    type="text"
                    required
                    value={newRoleForm.code}
                    onChange={(e) =>
                      setNewRoleForm({
                        ...newRoleForm,
                        code: e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, "_"),
                      })
                    }
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white font-mono"
                    placeholder="STAF_KEUANGAN"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-slate-300 font-semibold mb-1">
                    Deskripsi Tugas / Peran
                  </label>
                  <textarea
                    rows={2}
                    value={newRoleForm.description}
                    onChange={(e) =>
                      setNewRoleForm({ ...newRoleForm, description: e.target.value })
                    }
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white"
                    placeholder="Jelaskan ruang lingkup kerja dan tanggung jawab role ini..."
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Cakupan Wilayah Akses
                  </label>
                  <select
                    value={newRoleForm.allowedScope}
                    onChange={(e) =>
                      setNewRoleForm({
                        ...newRoleForm,
                        allowedScope: e.target.value as any,
                      })
                    }
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white"
                  >
                    <option value="ALL">Seluruh Cabang (Pusat Lintas Cabang)</option>
                    <option value="BRANCH">Wilayah Cabang Sendiri</option>
                    <option value="OWN">Kandidat Sendiri (PL)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Hak Eksekusi
                  </label>
                  <select
                    value={newRoleForm.isReadOnly ? "true" : "false"}
                    onChange={(e) =>
                      setNewRoleForm({
                        ...newRoleForm,
                        isReadOnly: e.target.value === "true",
                      })
                    }
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white"
                  >
                    <option value="false">Akses Penuh (Bisa Input/Mutasi Data)</option>
                    <option value="true">View-Only (Hanya Memantau)</option>
                  </select>
                </div>

                <label className="sm:col-span-2 flex items-center gap-2.5 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newRoleForm.canManageStaff}
                    onChange={(e) =>
                      setNewRoleForm({
                        ...newRoleForm,
                        canManageStaff: e.target.checked,
                      })
                    }
                    className="rounded border-slate-600 text-amber-500 focus:ring-amber-500"
                  />
                  <div>
                    <p className="font-bold text-amber-200">
                      Hak Akses Superadmin: Tambah, Edit &amp; Hapus Akun User
                    </p>
                    <p className="text-[11px] text-amber-300/80">
                      Jika dicentang, role ini berwenang mengelola, mengedit, menonaktifkan, dan menghapus akun user staf.
                    </p>
                  </div>
                </label>
              </div>

              {/* Checklist Modul yang Diizinkan */}
              <div className="space-y-2 pt-2 border-t border-slate-700">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white">
                    Pilih Modul yang Boleh Diakses ({newRoleForm.allowedMenus.length} Modul)
                  </span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setNewRoleForm({
                          ...newRoleForm,
                          allowedMenus: APP_MODULES.map((m) => m.id),
                        })
                      }
                      className="text-[11px] text-sky-400 hover:underline"
                    >
                      Pilih Semua
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setNewRoleForm({
                          ...newRoleForm,
                          allowedMenus: ["beranda"],
                        })
                      }
                      className="text-[11px] text-slate-400 hover:underline"
                    >
                      Reset (Beranda Saja)
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto border border-slate-800 p-2.5 rounded-xl bg-slate-950/40">
                  {APP_MODULES.map((mod) => {
                    const isChecked = newRoleForm.allowedMenus.includes(mod.id);
                    return (
                      <label
                        key={mod.id}
                        className="flex items-center gap-2 p-1.5 rounded hover:bg-slate-800/60 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            const updated = e.target.checked
                              ? [...newRoleForm.allowedMenus, mod.id]
                              : newRoleForm.allowedMenus.filter((m) => m !== mod.id);
                            setNewRoleForm({ ...newRoleForm, allowedMenus: updated });
                          }}
                          className="rounded border-slate-700 text-sky-600 focus:ring-sky-500"
                        />
                        <span className="text-[11px] text-slate-200">{mod.name}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-700">
                <button
                  type="button"
                  onClick={() => setShowAddRoleModal(false)}
                  className="rounded-lg border border-slate-600 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-sky-600 px-5 py-2 text-xs font-bold text-white hover:bg-sky-500 cursor-pointer"
                >
                  Simpan Peran Baru
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================
          MODAL: EDIT ROLE
         ============================================================ */}
      {editingRole && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-700 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Edit3 className="h-5 w-5 text-sky-400" />
                Edit Peran: {editingRole.name} ({editingRole.code})
              </h3>
              <button
                onClick={() => setEditingRole(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateRole} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Nama Peran (Role Name)
                </label>
                <input
                  type="text"
                  required
                  value={editingRole.name}
                  onChange={(e) =>
                    setEditingRole({ ...editingRole, name: e.target.value })
                  }
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Deskripsi Peran
                </label>
                <textarea
                  rows={2}
                  value={editingRole.description}
                  onChange={(e) =>
                    setEditingRole({ ...editingRole, description: e.target.value })
                  }
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Cakupan Wilayah
                  </label>
                  <select
                    value={editingRole.allowedScope}
                    onChange={(e) =>
                      setEditingRole({
                        ...editingRole,
                        allowedScope: e.target.value as any,
                      })
                    }
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white"
                  >
                    <option value="ALL">Seluruh Cabang (Pusat)</option>
                    <option value="BRANCH">Wilayah Cabang Sendiri</option>
                    <option value="OWN">Kandidat Sendiri (PL)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Hak Eksekusi
                  </label>
                  <select
                    value={editingRole.isReadOnly ? "true" : "false"}
                    onChange={(e) =>
                      setEditingRole({
                        ...editingRole,
                        isReadOnly: e.target.value === "true",
                      })
                    }
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white"
                  >
                    <option value="false">Akses Penuh (Bisa Mutasi)</option>
                    <option value="true">View-Only (Pantau Sahaja)</option>
                  </select>
                </div>

                <label className="col-span-2 flex items-center gap-2.5 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 cursor-pointer">
                  <input
                    type="checkbox"
                    disabled={editingRole.code === "DIREKTUR"}
                    checked={
                      editingRole.code === "DIREKTUR" ||
                      Boolean(editingRole.permissions?.canManageStaff)
                    }
                    onChange={(e) =>
                      setEditingRole({
                        ...editingRole,
                        permissions: {
                          ...editingRole.permissions,
                          canManageStaff: e.target.checked,
                        },
                      })
                    }
                    className="rounded border-slate-600 text-amber-500 focus:ring-amber-500"
                  />
                  <div>
                    <p className="font-bold text-amber-200">
                      Hak Akses Superadmin: Tambah, Edit &amp; Hapus Akun User
                    </p>
                    <p className="text-[11px] text-amber-300/80">
                      {editingRole.code === "DIREKTUR"
                        ? "Direktur Utama (Superadmin) selalu memiliki wewenang penuh kelola akun user."
                        : "Aktifkan bila role ini diizinkan mengedit dan menghapus akun staf di modul Daftar Akun."}
                    </p>
                  </div>
                </label>

                <label className="col-span-2 flex items-center gap-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 cursor-pointer">
                  <input
                    type="checkbox"
                    disabled={editingRole.code === "DIREKTUR"}
                    checked={
                      editingRole.code === "DIREKTUR" ||
                      Boolean(editingRole.permissions?.canSeeFinance)
                    }
                    onChange={(e) =>
                      setEditingRole({
                        ...editingRole,
                        permissions: {
                          ...editingRole.permissions,
                          canSeeFinance: e.target.checked,
                        },
                      })
                    }
                    className="rounded border-slate-600 text-emerald-500 focus:ring-emerald-500"
                  />
                  <div>
                    <p className="font-bold text-emerald-200">
                      Hak Akses Finansial: Lihat Biaya &amp; Margin Penempatan CPMI
                    </p>
                    <p className="text-[11px] text-emerald-300/80">
                      {editingRole.code === "DIREKTUR"
                        ? "Superadmin selalu dapat melihat rincian biaya & margin penempatan."
                        : "Hanya aktifkan pada role Keuangan. Divisi lain otomatis melihat label terbatas."}
                    </p>
                  </div>
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-700">
                <button
                  type="button"
                  onClick={() => setEditingRole(null)}
                  className="rounded-lg border border-slate-600 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-sky-600 px-5 py-2 text-xs font-bold text-white hover:bg-sky-500 cursor-pointer"
                >
                  Simpan Perubahan Role
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================
          MODAL: EDIT AKUN STAF (KHUSUS SUPERADMIN)
         ============================================================ */}
      {editingStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-700 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Edit3 className="h-5 w-5 text-sky-400" />
                Edit Akun User: {editingStaff.name}
              </h3>
              <button
                type="button"
                onClick={() => setEditingStaff(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateStaff} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-slate-300 font-semibold mb-1">
                    Nama Lengkap User *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingStaff.name}
                    onChange={(e) =>
                      setEditingStaff({ ...editingStaff, name: e.target.value })
                    }
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-slate-300 font-semibold mb-1">
                    Email Login *
                  </label>
                  <input
                    type="email"
                    required
                    value={editingStaff.email}
                    onChange={(e) =>
                      setEditingStaff({ ...editingStaff, email: e.target.value })
                    }
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Peran (Role RBAC)
                  </label>
                  <select
                    value={editingStaff.role}
                    onChange={(e) =>
                      setEditingStaff({
                        ...editingStaff,
                        role: e.target.value,
                      })
                    }
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white"
                  >
                    {roles.map((r) => (
                      <option key={r.code} value={r.code}>
                        {r.name} ({r.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Wilayah / Cabang
                  </label>
                  <select
                    value={editingStaff.branchId}
                    onChange={(e) =>
                      setEditingStaff({
                        ...editingStaff,
                        branchId: e.target.value,
                      })
                    }
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white"
                  >
                    <option value="ALL">Seluruh Cabang (Pusat)</option>
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    No. Telp / WhatsApp
                  </label>
                  <input
                    type="text"
                    value={editingStaff.phone}
                    onChange={(e) =>
                      setEditingStaff({ ...editingStaff, phone: e.target.value })
                    }
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Password / PIN Login
                  </label>
                  <input
                    type="text"
                    required
                    value={editingStaff.pinCode}
                    onChange={(e) =>
                      setEditingStaff({ ...editingStaff, pinCode: e.target.value })
                    }
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white font-mono"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-slate-300 font-semibold mb-1.5">
                    Peran Tambahan / Rangkap Divisi (Opsional)
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 rounded-xl border border-slate-800 bg-slate-950/50 p-2.5 max-h-36 overflow-y-auto">
                    {roles
                      .filter((r) => r.code !== editingStaff.role)
                      .map((r) => {
                        const checked = (editingStaff.secondaryRoles || []).includes(r.code);
                        return (
                          <label
                            key={r.code}
                            className="flex items-center gap-2 rounded px-1.5 py-1 hover:bg-slate-800/60 cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={(e) => {
                                const current = editingStaff.secondaryRoles || [];
                                const next = e.target.checked
                                  ? [...current, r.code]
                                  : current.filter((x) => x !== r.code);
                                setEditingStaff({
                                  ...editingStaff,
                                  secondaryRoles: next,
                                });
                              }}
                              className="rounded border-slate-600 text-sky-500"
                            />
                            <span className="text-[11px] text-slate-200 truncate">
                              {r.name}
                            </span>
                          </label>
                        );
                      })}
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-slate-300 font-semibold mb-1">
                    Status Akun User
                  </label>
                  <select
                    value={editingStaff.active ? "true" : "false"}
                    onChange={(e) =>
                      setEditingStaff({
                        ...editingStaff,
                        active: e.target.value === "true",
                      })
                    }
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white"
                  >
                    <option value="true">Aktif (Diizinkan Login)</option>
                    <option value="false">Non-Aktif (Diblokir Sementara)</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-700">
                <button
                  type="button"
                  onClick={() => setEditingStaff(null)}
                  className="rounded-lg border border-slate-600 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={savingStaffEdit}
                  className="rounded-lg bg-sky-600 px-5 py-2 text-xs font-bold text-white hover:bg-sky-500 disabled:opacity-50 cursor-pointer"
                >
                  {savingStaffEdit ? "Menyimpan..." : "Simpan Perubahan User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================
          MODAL: KONFIRMASI HAPUS AKUN STAF (KHUSUS SUPERADMIN)
         ============================================================ */}
      {deletingStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-rose-500/40 bg-slate-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-500/20 text-rose-400">
                <Trash2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  Hapus Akun User Staf?
                </h3>
                <p className="mt-1 text-xs text-slate-300">
                  Akun <strong>{deletingStaff.name}</strong> ({deletingStaff.email}) dengan role{" "}
                  <strong className="text-sky-300">{deletingStaff.roleLabel}</strong> akan dihapus permanen dari sistem dan dicatat di Log Audit.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setDeletingStaff(null)}
                className="rounded-lg border border-slate-600 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={deletingStaffBusy}
                onClick={handleConfirmDeleteStaff}
                className="rounded-lg bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-500 disabled:opacity-50 cursor-pointer"
              >
                {deletingStaffBusy ? "Menghapus..." : "Ya, Hapus User"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================
          MODAL: TAMBAH SPONSOR / PL BARU
         ============================================================ */}
      {showAddSponsorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-700 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-amber-400" />
                Tambah Sponsor / PL Rekrutmen
              </h3>
              <button
                type="button"
                onClick={() => setShowAddSponsorModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSponsor} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-slate-300 font-semibold mb-1">
                    Nama Lengkap Sponsor / PL *
                  </label>
                  <input
                    type="text"
                    required
                    value={newSponsorForm.name}
                    onChange={(e) =>
                      setNewSponsorForm({ ...newSponsorForm, name: e.target.value })
                    }
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white"
                    placeholder="Contoh: H. Ahmad Fauzi"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Wilayah Garapan
                  </label>
                  <input
                    type="text"
                    value={newSponsorForm.area}
                    onChange={(e) =>
                      setNewSponsorForm({ ...newSponsorForm, area: e.target.value })
                    }
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white"
                    placeholder="Indramayu & Subang"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Cabang Induk
                  </label>
                  <select
                    value={newSponsorForm.branchId}
                    onChange={(e) =>
                      setNewSponsorForm({ ...newSponsorForm, branchId: e.target.value })
                    }
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white"
                  >
                    <option value="ALL">Pilih Cabang Otomatis</option>
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    No. Telp / WhatsApp
                  </label>
                  <input
                    type="text"
                    value={newSponsorForm.phone}
                    onChange={(e) =>
                      setNewSponsorForm({ ...newSponsorForm, phone: e.target.value })
                    }
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white"
                    placeholder="0812-xxxx-xxxx"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Standar Fee / CPMI (Rp)
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={50000}
                    value={newSponsorForm.commissionPerCpmi}
                    onChange={(e) =>
                      setNewSponsorForm({
                        ...newSponsorForm,
                        commissionPerCpmi: Number(e.target.value) || 0,
                      })
                    }
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white font-mono"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-slate-300 font-semibold mb-1">
                    Rekening Bank Pencairan Komisi
                  </label>
                  <input
                    type="text"
                    value={newSponsorForm.bankAccount}
                    onChange={(e) =>
                      setNewSponsorForm({ ...newSponsorForm, bankAccount: e.target.value })
                    }
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white font-mono"
                    placeholder="BRI 4192-01-xxxx a.n. Nama Sponsor"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-700">
                <button
                  type="button"
                  onClick={() => setShowAddSponsorModal(false)}
                  className="rounded-lg border border-slate-600 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={savingAddSponsor}
                  className="rounded-lg bg-sky-600 px-5 py-2 text-xs font-bold text-white hover:bg-sky-500 disabled:opacity-50 cursor-pointer"
                >
                  {savingAddSponsor ? "Menyimpan..." : "Simpan Sponsor PL"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================
          MODAL: EDIT DATA SPONSOR / PL
         ============================================================ */}
      {editingSponsor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-700 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Edit3 className="h-5 w-5 text-sky-400" />
                Edit Sponsor PL: {editingSponsor.name}
              </h3>
              <button
                type="button"
                onClick={() => setEditingSponsor(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateSponsor} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Kode Sponsor (PL) *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingSponsor.code}
                    onChange={(e) =>
                      setEditingSponsor({ ...editingSponsor, code: e.target.value })
                    }
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Cabang Induk
                  </label>
                  <select
                    value={editingSponsor.branchId}
                    onChange={(e) =>
                      setEditingSponsor({ ...editingSponsor, branchId: e.target.value })
                    }
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white"
                  >
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-slate-300 font-semibold mb-1">
                    Nama Lengkap Sponsor / PL *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingSponsor.name}
                    onChange={(e) =>
                      setEditingSponsor({ ...editingSponsor, name: e.target.value })
                    }
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Wilayah Garapan
                  </label>
                  <input
                    type="text"
                    value={editingSponsor.area}
                    onChange={(e) =>
                      setEditingSponsor({ ...editingSponsor, area: e.target.value })
                    }
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    No. Telp / WhatsApp
                  </label>
                  <input
                    type="text"
                    value={editingSponsor.phone}
                    onChange={(e) =>
                      setEditingSponsor({ ...editingSponsor, phone: e.target.value })
                    }
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-slate-300 font-semibold mb-1">
                    Rekening Bank Pencairan
                  </label>
                  <input
                    type="text"
                    value={editingSponsor.bankAccount || ""}
                    onChange={(e) =>
                      setEditingSponsor({
                        ...editingSponsor,
                        bankAccount: e.target.value,
                      })
                    }
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white font-mono"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-slate-300 font-semibold mb-1">
                    Standar Fee / CPMI (Rp)
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={50000}
                    value={editingSponsor.commissionPerCpmi}
                    onChange={(e) =>
                      setEditingSponsor({
                        ...editingSponsor,
                        commissionPerCpmi: Number(e.target.value) || 0,
                      })
                    }
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-700">
                <button
                  type="button"
                  onClick={() => setEditingSponsor(null)}
                  className="rounded-lg border border-slate-600 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={savingEditSponsor}
                  className="rounded-lg bg-sky-600 px-5 py-2 text-xs font-bold text-white hover:bg-sky-500 disabled:opacity-50 cursor-pointer"
                >
                  {savingEditSponsor ? "Menyimpan..." : "Simpan Perubahan Sponsor"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================
          MODAL: KONFIRMASI HAPUS SPONSOR / PL
         ============================================================ */}
      {deletingSponsor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-rose-500/40 bg-slate-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-500/20 text-rose-400">
                <Trash2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  Hapus Data Sponsor / PL?
                </h3>
                <p className="mt-1 text-xs text-slate-300">
                  Sponsor <strong>{deletingSponsor.name}</strong> ({deletingSponsor.code}) wilayah{" "}
                  <strong className="text-amber-300">{deletingSponsor.area}</strong> akan dihapus permanen dan dicatat pada Log Audit.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setDeletingSponsor(null)}
                className="rounded-lg border border-slate-600 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={deletingSponsorBusy}
                onClick={handleConfirmDeleteSponsor}
                className="rounded-lg bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-500 disabled:opacity-50 cursor-pointer"
              >
                {deletingSponsorBusy ? "Menghapus..." : "Ya, Hapus Sponsor"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
