"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Banknote,
  Bell,
  Briefcase,
  Building2,
  CheckCircle2,
  CreditCard,
  Eye,
  FileCheck2,
  FolderKanban,
  Globe,
  GraduationCap,
  History,
  KeyRound,
  LayoutDashboard,
  LifeBuoy,
  Lock,
  LogOut,
  MessageSquarePlus,
  Plane,
  Plus,
  Printer,
  Receipt,
  RefreshCw,
  Search,
  Send,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Stethoscope,
  TrendingUp,
  UserCheck,
  UserPlus,
  Users,
  Wallet,
  X,
  XCircle,
} from "lucide-react";
import {
  AuditLog,
  BadilReason,
  BadilRecord,
  BadilType,
  BpjsFinancingPartner,
  Branch,
  Candidate,
  CaseCategory,
  CasePriority,
  CaseStatus,
  CaseTicket,
  CommissionTerminKey,
  CpmiDocument,
  DestinationCountry,
  DOC_TEMPLATE_CONFIG,
  ForeignAgency,
  FundingScheme,
  JOURNEY_STAGES,
  JobVacancy,
  JourneyStage,
  MedicalClinicPartner,
  PlacementCostItem,
  RenewalTask,
  SpecialStatus,
  Sponsor,
  SponsorInstallment,
  StaffAccount,
  UserRole,
} from "@/lib/types";

interface DbPayload {
  branches: Branch[];
  sponsors: Sponsor[];
  staffAccounts: StaffAccount[];
  candidates: Candidate[];
  cases: CaseTicket[];
  vacancies: JobVacancy[];
  renewalTasks: RenewalTask[];
  auditLogs: AuditLog[];
  badilRecords?: BadilRecord[];
  foreignAgencies?: ForeignAgency[];
  medicalClinics?: MedicalClinicPartner[];
  bpjsFinancingPartners?: BpjsFinancingPartner[];
}

const ROLE_PERMISSIONS: Record<
  UserRole,
  {
    canVerify: boolean;
    canViewSensitive: boolean;
    canSeeFinance: boolean;
    canManageStaff: boolean;
  }
> = {
  DIREKTUR: {
    canVerify: true,
    canViewSensitive: true,
    canSeeFinance: true,
    canManageStaff: true,
  },
  ADMIN_PUSAT: {
    canVerify: true,
    canViewSensitive: true,
    canSeeFinance: true,
    canManageStaff: true,
  },
  STAF_DOKUMEN: {
    canVerify: true,
    canViewSensitive: true,
    canSeeFinance: false,
    canManageStaff: false,
  },
  KEPALA_CABANG: {
    canVerify: true,
    canViewSensitive: true,
    canSeeFinance: false,
    canManageStaff: false,
  },
  PEREKRUT_PL: {
    canVerify: false,
    canViewSensitive: false,
    canSeeFinance: false,
    canManageStaff: false,
  },
};

function calcDaysLeft(expiryDate?: string): number | null {
  if (!expiryDate) return null;
  const now = new Date();
  const todayUtc = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  const parts = expiryDate.split("-").map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) return null;
  const expUtc = Date.UTC(parts[0], parts[1] - 1, parts[2]);
  return Math.round((expUtc - todayUtc) / (1000 * 60 * 60 * 24));
}

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function buildSvgDataUrl(svg: string): string {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

const AVATAR_PRESETS: {
  id: string;
  label: string;
  gender: "P" | "L";
  url: string;
}[] = [
  {
    id: "preset-hijab-red",
    label: "Wanita Berhijab (Latar Merah)",
    gender: "P",
    url: buildSvgDataUrl(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 140"><rect width="120" height="140" rx="16" fill="#dc2626"/><path d="M18 140 C18 96, 102 96, 102 140 Z" fill="#0f172a"/><path d="M32 62 C32 22, 88 22, 88 62 C88 86, 78 104, 60 108 C42 104, 32 86, 32 62 Z" fill="#1e293b"/><ellipse cx="60" cy="58" rx="19" ry="22" fill="#fde68a"/><circle cx="53" cy="55" r="2.2" fill="#0f172a"/><circle cx="67" cy="55" r="2.2" fill="#0f172a"/><path d="M54 66 Q60 71 66 66" stroke="#b45309" stroke-width="2" fill="none"/><path d="M46 105 L60 124 L74 105 Z" fill="#ffffff"/></svg>`
    ),
  },
  {
    id: "preset-hijab-blue",
    label: "Wanita Berhijab (Latar Biru)",
    gender: "P",
    url: buildSvgDataUrl(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 140"><rect width="120" height="140" rx="16" fill="#0284c7"/><path d="M18 140 C18 96, 102 96, 102 140 Z" fill="#1e293b"/><path d="M32 62 C32 22, 88 22, 88 62 C88 86, 78 104, 60 108 C42 104, 32 86, 32 62 Z" fill="#0f766e"/><ellipse cx="60" cy="58" rx="19" ry="22" fill="#fef3c7"/><circle cx="53" cy="55" r="2.2" fill="#0f172a"/><circle cx="67" cy="55" r="2.2" fill="#0f172a"/><path d="M54 66 Q60 71 66 66" stroke="#b45309" stroke-width="2" fill="none"/><path d="M46 105 L60 124 L74 105 Z" fill="#ffffff"/></svg>`
    ),
  },
  {
    id: "preset-female-formal",
    label: "Wanita Formal (Kemeja Putih)",
    gender: "P",
    url: buildSvgDataUrl(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 140"><rect width="120" height="140" rx="16" fill="#e11d48"/><path d="M34 55 C34 24, 86 24, 86 55 L88 82 L32 82 Z" fill="#0f172a"/><path d="M20 140 C20 96, 100 96, 100 140 Z" fill="#ffffff"/><path d="M48 96 L60 116 L72 96 Z" fill="#fde68a"/><ellipse cx="60" cy="58" rx="20" ry="23" fill="#fde68a"/><path d="M38 48 Q60 32 82 48 C80 30, 40 30, 38 48 Z" fill="#0f172a"/><circle cx="53" cy="56" r="2.2" fill="#0f172a"/><circle cx="67" cy="56" r="2.2" fill="#0f172a"/><path d="M54 67 Q60 72 66 67" stroke="#be123c" stroke-width="2" fill="none"/></svg>`
    ),
  },
  {
    id: "preset-male-red",
    label: "Pria Formal (Latar Merah)",
    gender: "L",
    url: buildSvgDataUrl(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 140"><rect width="120" height="140" rx="16" fill="#dc2626"/><path d="M18 140 C18 94, 102 94, 102 140 Z" fill="#0f172a"/><path d="M46 96 L60 124 L74 96 Z" fill="#ffffff"/><path d="M57 104 L63 104 L65 132 L55 132 Z" fill="#0284c7"/><ellipse cx="60" cy="56" rx="21" ry="24" fill="#fcd34d"/><path d="M39 48 C39 26, 81 26, 81 48 C75 38, 45 38, 39 48 Z" fill="#0f172a"/><circle cx="52" cy="55" r="2.3" fill="#0f172a"/><circle cx="68" cy="55" r="2.3" fill="#0f172a"/><path d="M53 67 Q60 71 67 67" stroke="#78350f" stroke-width="2.2" fill="none"/></svg>`
    ),
  },
  {
    id: "preset-male-blue",
    label: "Pria Formal (Latar Biru)",
    gender: "L",
    url: buildSvgDataUrl(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 140"><rect width="120" height="140" rx="16" fill="#0369a1"/><path d="M18 140 C18 94, 102 94, 102 140 Z" fill="#1e293b"/><path d="M46 96 L60 124 L74 96 Z" fill="#ffffff"/><path d="M57 104 L63 104 L65 132 L55 132 Z" fill="#dc2626"/><ellipse cx="60" cy="56" rx="21" ry="24" fill="#fde68a"/><path d="M39 48 C39 26, 81 26, 81 48 C75 38, 45 38, 39 48 Z" fill="#0f172a"/><circle cx="52" cy="55" r="2.3" fill="#0f172a"/><circle cx="68" cy="55" r="2.3" fill="#0f172a"/><path d="M53 67 Q60 71 67 67" stroke="#78350f" stroke-width="2.2" fill="none"/></svg>`
    ),
  },
];

function getCandidateAvatarUrl(
  c: Pick<Candidate, "avatarUrl" | "gender" | "fullName" | "destinationCountry">
): string {
  if (c.avatarUrl) return c.avatarUrl;
  const middleEast = [
    "Arab Saudi",
    "Uni Emirat Arab (UAE)",
    "Kuwait",
    "Oman",
    "Yordania",
  ].includes(c.destinationCountry);
  if (c.gender === "L") {
    return c.fullName.length % 2 === 0 ? AVATAR_PRESETS[3].url : AVATAR_PRESETS[4].url;
  }
  if (middleEast) {
    return c.fullName.length % 2 === 0 ? AVATAR_PRESETS[0].url : AVATAR_PRESETS[1].url;
  }
  const idx = c.fullName.length % 3;
  return AVATAR_PRESETS[idx].url;
}

export default function PASMigranProCommandCenter() {
  const [db, setDb] = useState<DbPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeNav, setActiveNav] = useState<
    | "beranda"
    | "cpmi"
    | "keuangan"
    | "pelatihan"
    | "pengingat"
    | "cases"
    | "vacancy"
    | "portal_cpmi"
    | "medical_visa"
    | "master_data"
    | "cabang_audit"
  >("beranda");

  // Sesi Login Superadmin (Single Superadmin · Multi-Tenant Ready)
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [superAdminEmail, setSuperAdminEmail] = useState("superadmin@pasmigranpro.id");
  const [superAdminPassword, setSuperAdminPassword] = useState("SuperAdmin2026!");
  const [showSuperAdminPassword, setShowSuperAdminPassword] = useState(false);
  const [superAdminError, setSuperAdminError] = useState("");

  // Sesi Login Staf Multi-User
  const [loggedInStaff, setLoggedInStaff] = useState<StaffAccount | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginEmail, setLoginEmail] = useState("direktur@pasmigranpro.id");
  const [loginPin, setLoginPin] = useState("1234");
  const [loginError, setLoginError] = useState("");

  // Filter & Pencarian
  const [selectedBranchId, setSelectedBranchId] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [stageFilter, setStageFilter] = useState<string>("ALL");
  const [countryFilter, setCountryFilter] = useState<string>("ALL");
  const [docStatusFilter, setDocStatusFilter] = useState<string>("ALL");
  const [cpmiViewMode, setCpmiViewMode] = useState<"DETAIL_ORANG" | "MATRIKS_BERKAS">("DETAIL_ORANG");

  // Detail Berkas CPMI terpilih
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>("cpmi-1");
  const [revealedSensitiveDocs, setRevealedSensitiveDocs] = useState<Record<string, boolean>>({});

  // State Modul Keuangan (Pembayaran Fee Sponsor Bertahap DP1, DP2, DP3, Pelunasan & HPP)
  const [financeSponsorFilter, setFinanceSponsorFilter] = useState<string>("ALL");
  const [selectedFinanceCandidateId, setSelectedFinanceCandidateId] = useState<string>("cpmi-1");
  const [payingTerminModal, setPayingTerminModal] = useState<{
    candidate: Candidate;
    installment: SponsorInstallment;
    sponsorName: string;
    stageWarningMsg?: string;
  } | null>(null);
  const [payTerminForm, setPayTerminForm] = useState({
    paymentMethod: "TRANSFER_BANK" as "TRANSFER_BANK" | "TUNAI_KAS",
    notes: "",
    forceOverride: false,
  });
  const [receiptPreviewModal, setReceiptPreviewModal] = useState<{
    candidate: Candidate;
    installment: SponsorInstallment;
    sponsorName: string;
    sponsorArea: string;
  } | null>(null);
  const [newCostForm, setNewCostForm] = useState({
    category: "LAINNYA" as PlacementCostItem["category"],
    title: "",
    amount: 750000,
    borneBy: "AGENSI_MAJIKAN" as PlacementCostItem["borneBy"],
    status: "PAID" as "PENDING" | "PAID",
  });

  // Detail Kasus terpilih (Case Management)
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>("case-1");
  const [caseStatusFilter, setCaseStatusFilter] = useState<string>("ALL");
  const [showNewCaseModal, setShowNewCaseModal] = useState(false);
  const [newCaseForm, setNewCaseForm] = useState({
    candidateId: "cpmi-7",
    category: "GAJI_TERLAMBAT" as CaseCategory,
    priority: "HIGH" as CasePriority,
    title: "",
    description: "",
    picName: "Rina Kartika (Admin Pusat)",
    escalatedTo: "",
    targetResolutionDate: "2026-10-25",
  });
  const [newCaseNoteText, setNewCaseNoteText] = useState("");
  const [newCaseStatusUpdate, setNewCaseStatusUpdate] = useState<CaseStatus | "">("");
  const [newCaseEscalationUpdate, setNewCaseEscalationUpdate] = useState("");

  // State Lowongan (Job Order / Vacancy)
  const [showNewVacancyModal, setShowNewVacancyModal] = useState(false);
  const [newVacancyForm, setNewVacancyForm] = useState({
    title: "",
    destinationCountry: "Taiwan" as JobVacancy["destinationCountry"],
    jobSector: "Caregiver (Perawat Lansia)",
    agencyPartner: "",
    employerName: "",
    salaryForeign: "NT$ 27.470 / bulan",
    salaryIdrEstimate: 13200000,
    placementFee: 32000000,
    quotaTotal: 20,
    genderPref: "P" as "P" | "L" | "P/L",
    minEducation: "SMP / SMA",
    ageRange: "21 - 40 Tahun",
    closingDate: "2026-11-30",
    requirementsText:
      "Wajib KTP Elektronik 16 digit & KK asli\nSehat jasmani & rohani (Medical FIT)\nSurat izin keluarga diketahui Kepala Desa",
  });
  const [applyingVacancy, setApplyingVacancy] = useState<JobVacancy | null>(null);
  const [applyForm, setApplyForm] = useState({
    fullName: "",
    phone: "",
    nik: "",
    gender: "P" as "P" | "L",
    branchId: "br-idm",
  });

  // State Portal Mandiri CPMI/PMI
  const [portalNikInput, setPortalNikInput] = useState("3212155408980001");
  const [portalPinInput, setPortalPinInput] = useState("980001");
  const [portalCandidateId, setPortalCandidateId] = useState<string | null>("cpmi-1");
  const [portalComplaintTitle, setPortalComplaintTitle] = useState("");
  const [portalComplaintDesc, setPortalComplaintDesc] = useState("");
  const [portalComplaintCategory, setPortalComplaintCategory] =
    useState<CaseCategory>("MAJIKAN_PEKERJAAN");

  // State Tambah Staf Baru
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [newStaffForm, setNewStaffForm] = useState({
    name: "",
    email: "",
    role: "STAF_DOKUMEN" as UserRole,
    branchId: "ALL",
    phone: "",
    pinCode: "1234",
  });

  // Notifikasi / Feedback Banner
  const [toast, setToast] = useState<{
    type: "success" | "error" | "warning";
    title: string;
    details?: string[];
  } | null>(null);

  // Modal Tambah CPMI / Lead Baru
  const [showAddModal, setShowAddModal] = useState(false);
  const [duplicateNikAlert, setDuplicateNikAlert] = useState<{
    candidate: Candidate;
    branchName: string;
    message: string;
  } | null>(null);
  const [newForm, setNewForm] = useState({
    stage: "LEAD" as JourneyStage,
    nik: "",
    fullName: "",
    gender: "P" as "P" | "L",
    avatarUrl: "",
    birthPlace: "",
    birthDate: "",
    phone: "",
    address: "",
    education: "SMA/SMK",
    maritalStatus: "Belum Kawin",
    destinationCountry: "Taiwan",
    jobSector: "Caregiver (Perawat Lansia)",
    employerName: "",
    agencyPartner: "",
    branchId: "br-idm",
    sponsorId: "sp-1",
  });

  // Modal Edit / Verifikasi Dokumen & Pratinjau Fisik / Scan Berkas
  const [editingDoc, setEditingDoc] = useState<{
    candidate: Candidate;
    doc: CpmiDocument;
  } | null>(null);
  const [viewingPhysicalDoc, setViewingPhysicalDoc] = useState<{
    candidate: Candidate;
    doc: CpmiDocument;
  } | null>(null);
  const [physicalDocZoom, setPhysicalDocZoom] = useState<number>(100);
  const [docForm, setDocForm] = useState({
    status: "VERIFIED" as CpmiDocument["status"],
    docNumber: "",
    issuedBy: "",
    issueDate: "",
    expiryDate: "",
    medicalResult: "FIT" as "FIT" | "UNFIT" | "PENDING",
    notes: "",
    fileDataUrl: "",
    fileName: "",
  });

  // Modal Perpanjangan Cepat dari Halaman Pengingat
  const [renewingTask, setRenewingTask] = useState<RenewalTask | null>(null);
  const [renewNewExpiry, setRenewNewExpiry] = useState("");

  // State Fitur Badil (Pergantian Kandidat Timur Tengah / Umum)
  const [showBadilModal, setShowBadilModal] = useState(false);
  const [badilForm, setBadilForm] = useState({
    originalCandidateId: "cpmi-10",
    replacementCandidateId: "cpmi-4",
    badilType: "PRA_TERBANG" as BadilType,
    reason: "UNFIT_WAFID_MEDICAL" as BadilReason,
    reasonNotes: "",
    sponsorDpTreatment: "CARRY_OVER_TO_REPLACEMENT" as
      | "CARRY_OVER_TO_REPLACEMENT"
      | "REFUND_CLAWBACK"
      | "ABSORBED_BY_P3MI",
    wakalahFeeScheme: "FULL_WAKALAH_FEE" as
      | "FULL_WAKALAH_FEE"
      | "FREE_WARRANTY_REPLACEMENT",
  });

  // State Modul Master Data & Mitra Ekosistem P3MI
  const [masterSubTab, setMasterSubTab] = useState<
    "AGENCY" | "SPONSOR" | "CLINIC" | "BPJS_KUR" | "BADIL_BRANCH"
  >("AGENCY");
  const [showAddAgencyModal, setShowAddAgencyModal] = useState(false);
  const [newAgencyForm, setNewAgencyForm] = useState({
    code: "",
    name: "",
    country: "Arab Saudi" as DestinationCountry,
    licenseOrWakalahNo: "",
    scheme: "SPSK (Sistem Penempatan Satu Kanal) / Musaned",
    picName: "",
    phoneEmail: "",
    defaultAgencyFeeIdr: 38000000,
    warrantyDays: 90,
    mouExpiryDate: "2028-12-31",
  });

  const [showAddSponsorModal, setShowAddSponsorModal] = useState(false);
  const [newSponsorForm, setNewSponsorForm] = useState({
    name: "",
    phone: "",
    area: "",
    branchId: "br-idm",
    bankAccount: "",
    commissionPerCpmi: 6000000,
  });

  const [showAddClinicModal, setShowAddClinicModal] = useState(false);
  const [newClinicForm, setNewClinicForm] = useState({
    name: "",
    accreditation: "WAFID_GCC_GAMCA" as MedicalClinicPartner["accreditation"],
    city: "",
    picName: "",
    phone: "",
    standardMcuFeeIdr: 1650000,
    targetCountries: "Arab Saudi, UAE, Kuwait, Oman",
  });

  const [showAddBpjsModal, setShowAddBpjsModal] = useState(false);
  const [newBpjsForm, setNewBpjsForm] = useState({
    name: "",
    partnerType: "BPJS_KETENAGAKERJAAN" as BpjsFinancingPartner["partnerType"],
    programPackage: "",
    premiumOrRateInfo: "",
    picName: "",
    phone: "",
  });

  const [showAddBranchModal, setShowAddBranchModal] = useState(false);
  const [newBranchForm, setNewBranchForm] = useState({
    code: "",
    name: "",
    city: "",
    headName: "",
    phone: "",
  });

  async function fetchDb() {
    setLoading(true);
    try {
      const res = await fetch("/api/p3mi");
      const data: DbPayload = await res.json();
      setDb(data);
      if (!loggedInStaff && data.staffAccounts?.length > 0) {
        setLoggedInStaff(data.staffAccounts[0]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedAuth = window.sessionStorage.getItem("pasmigranpro_superadmin_auth");
      if (savedAuth === "true") {
        setIsAuthenticated(true);
      }
    }
    fetchDb();
  }, []);

  function handleSuperAdminLogin(e: React.FormEvent) {
    e.preventDefault();
    setSuperAdminError("");
    const emailClean = superAdminEmail.trim().toLowerCase();
    const passClean = superAdminPassword.trim();

    const validUser =
      emailClean === "superadmin@pasmigranpro.id" ||
      emailClean === "superadmin" ||
      emailClean === "admin@pasmigranpro.id" ||
      emailClean === "direktur@pasmigranpro.id";
    const validPass =
      passClean === "SuperAdmin2026!" ||
      passClean === "superadmin" ||
      passClean === "admin123" ||
      passClean === "1234";

    if (!validUser || !validPass) {
      setSuperAdminError(
        "Kredensial Superadmin tidak sesuai. Gunakan akun demo: superadmin@pasmigranpro.id / SuperAdmin2026!"
      );
      return;
    }

    const superAdminAccount: StaffAccount = {
      id: "superadmin-master",
      name: "Superadmin Utama (Master Tenant)",
      email: "superadmin@pasmigranpro.id",
      role: "DIREKTUR",
      roleLabel: "Superadmin · Multi-Tenant Master",
      branchId: "ALL",
      phone: "0811-1000-8899",
      pinCode: "1234",
      active: true,
    };

    setLoggedInStaff(superAdminAccount);
    setSelectedBranchId("ALL");
    setIsAuthenticated(true);
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem("pasmigranpro_superadmin_auth", "true");
    }
    setToast({
      type: "success",
      title: "Selamat Datang, Superadmin Utama (Master Tenant P3MI)",
      details: [
        "Otorisasi Penuh Multi-Tenant & Akses Lintas Seluruh Cabang P3MI Aktif.",
      ],
    });
  }

  function handleSuperAdminLogout() {
    setIsAuthenticated(false);
    if (typeof window !== "undefined") {
      window.sessionStorage.removeItem("pasmigranpro_superadmin_auth");
    }
  }

  const currentRole: UserRole = loggedInStaff?.role || "DIREKTUR";
  const perms = ROLE_PERMISSIONS[currentRole];

  async function callApi(action: string, payload: Record<string, unknown> = {}) {
    const branchObj = db?.branches.find((b) => b.id === selectedBranchId);
    const res = await fetch("/api/p3mi", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action,
        actorName: loggedInStaff?.name || "H. Bambang Wijaya, S.E.",
        actorRole: currentRole,
        branchName: branchObj ? branchObj.name : "Kantor Pusat Jakarta",
        payload,
      }),
    });
    const data = await res.json();
    if (data.db) {
      setDb(data.db);
    }
    return { status: res.status, data };
  }

  // Handler Login Multi-User Staf
  async function handleStaffLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoginError("");
    const { data } = await callApi("LOGIN_STAFF", {
      email: loginEmail,
      pinCode: loginPin,
    });
    if (!data.ok) {
      setLoginError(data.error || "Gagal login.");
      return;
    }
    const st: StaffAccount = data.staff;
    setLoggedInStaff(st);
    if (st.branchId !== "ALL") {
      setSelectedBranchId(st.branchId);
    } else {
      setSelectedBranchId("ALL");
    }
    setShowLoginModal(false);
    setRevealedSensitiveDocs({});
    setToast({
      type: "success",
      title: `Login Berhasil: ${st.name} (${st.roleLabel})`,
      details: [
        st.branchId === "ALL"
          ? "Akses lintas seluruh cabang P3MI aktif."
          : `Akses dikunci otomatis ke cabang Anda (${
              db?.branches.find((b) => b.id === st.branchId)?.name
            }).`,
      ],
    });
  }

  // Filter kandidat berdasarkan cabang, pencarian, tahapan, dan negara tujuan
  const filteredCandidates = useMemo(() => {
    if (!db) return [];
    const middleEastCountries = [
      "Arab Saudi",
      "Uni Emirat Arab (UAE)",
      "Kuwait",
      "Oman",
      "Yordania",
    ];
    return db.candidates.filter((c) => {
      if (selectedBranchId !== "ALL" && c.branchId !== selectedBranchId) return false;
      if (stageFilter !== "ALL" && c.stage !== stageFilter) return false;
      if (countryFilter === "TIMUR_TENGAH") {
        if (!middleEastCountries.includes(c.destinationCountry)) return false;
      } else if (countryFilter === "ASIA_PASIFIK") {
        if (middleEastCountries.includes(c.destinationCountry)) return false;
      } else if (countryFilter !== "ALL" && c.destinationCountry !== countryFilter) {
        return false;
      }
      if (docStatusFilter !== "ALL") {
        const verifiedCount = c.documents.filter((d) => d.status === "VERIFIED").length;
        const hasExpired = c.documents.some((d) => {
          const dl = calcDaysLeft(d.expiryDate);
          return d.status === "EXPIRED" || (dl !== null && dl < 0);
        });
        if (docStatusFilter === "COMPLETE_10" && (verifiedCount < c.documents.length || hasExpired)) {
          return false;
        }
        if (docStatusFilter === "INCOMPLETE" && verifiedCount === c.documents.length && !hasExpired) {
          return false;
        }
        if (docStatusFilter === "HAS_EXPIRED" && !hasExpired) {
          return false;
        }
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = c.fullName.toLowerCase().includes(q);
        const matchNik = (c.nik || "").toLowerCase().includes(q);
        const matchReg = c.regNumber.toLowerCase().includes(q);
        const matchDest = c.destinationCountry.toLowerCase().includes(q);
        if (!matchName && !matchNik && !matchReg && !matchDest) return false;
      }
      return true;
    });
  }, [db, selectedBranchId, stageFilter, countryFilter, docStatusFilter, searchQuery]);

  const selectedCandidate = useMemo(() => {
    if (!db || !selectedCandidateId) return null;
    return (
      db.candidates.find((c) => c.id === selectedCandidateId) ||
      filteredCandidates[0] ||
      db.candidates[0] ||
      null
    );
  }, [db, selectedCandidateId, filteredCandidates]);

  const filteredCases = useMemo(() => {
    if (!db || !db.cases) return [];
    return db.cases.filter((cs) => {
      if (selectedBranchId !== "ALL" && cs.branchId !== selectedBranchId) return false;
      if (caseStatusFilter !== "ALL" && cs.status !== caseStatusFilter) return false;
      return true;
    });
  }, [db, selectedBranchId, caseStatusFilter]);

  const selectedCase = useMemo(() => {
    if (!db || !db.cases) return null;
    return (
      db.cases.find((c) => c.id === selectedCaseId) ||
      filteredCases[0] ||
      db.cases[0] ||
      null
    );
  }, [db, selectedCaseId, filteredCases]);

  const portalCandidate = useMemo(() => {
    if (!db || !portalCandidateId) return null;
    return db.candidates.find((c) => c.id === portalCandidateId) || null;
  }, [db, portalCandidateId]);

  // Statistik & Item Perlu Perhatian + Ringkasan Keuangan
  const stats = useMemo(() => {
    if (!db) {
      return {
        totalCpmi: 0,
        departing30Days: 0,
        openCasesCount: 0,
        overdueCasesCount: 0,
        criticalDocsCount: 0,
        paidCommission: 0,
        unpaidCommission: 0,
        totalRevenue: 0,
        totalHppCost: 0,
        netMargin: 0,
        terminUnpaidCounts: { DP1: 0, DP2: 0, DP3: 0, PELUNASAN: 0 } as Record<
          CommissionTerminKey,
          number
        >,
        stageCounts: {} as Record<JourneyStage, number>,
        expiringDocsList: [] as {
          candidate: Candidate;
          doc: CpmiDocument;
          daysLeft: number | null;
        }[],
        missingExpiryDocs: [] as {
          candidate: Candidate;
          doc: CpmiDocument;
        }[],
      };
    }

    const branchScoped = db.candidates.filter(
      (c) => selectedBranchId === "ALL" || c.branchId === selectedBranchId
    );
    const branchCases = (db.cases || []).filter(
      (cs) => selectedBranchId === "ALL" || cs.branchId === selectedBranchId
    );

    const openCases = branchCases.filter((cs) => cs.status !== "RESOLVED");
    const overdueCases = openCases.filter((cs) => {
      const dl = calcDaysLeft(cs.targetResolutionDate);
      return dl !== null && dl < 0;
    });

    const stageCounts: Record<JourneyStage, number> = {
      LEAD: 0,
      PROSPECT: 0,
      CPMI: 0,
      READY: 0,
      DEPLOYED: 0,
      ACTIVE_WORKER: 0,
      RETURNED: 0,
      ALUMNI: 0,
    };

    let departing30Days = 0;
    let paidCommission = 0;
    let unpaidCommission = 0;
    let totalRevenue = 0;
    let totalHppCost = 0;
    const terminUnpaidCounts: Record<CommissionTerminKey, number> = {
      DP1: 0,
      DP2: 0,
      DP3: 0,
      PELUNASAN: 0,
    };

    const expiringDocsList: {
      candidate: Candidate;
      doc: CpmiDocument;
      daysLeft: number | null;
    }[] = [];
    const missingExpiryDocs: {
      candidate: Candidate;
      doc: CpmiDocument;
    }[] = [];

    for (const c of branchScoped) {
      stageCounts[c.stage] = (stageCounts[c.stage] || 0) + 1;
      if (c.departureDate) {
        const dLeft = calcDaysLeft(c.departureDate);
        if (dLeft !== null && dLeft >= 0 && dLeft <= 30) {
          departing30Days++;
        }
      }

      if (c.finance) {
        totalRevenue += c.finance.agencyFeeRevenue || c.placementFee || 0;
        for (const cost of c.finance.costItems || []) {
          totalHppCost += cost.amount;
        }
        if (c.sponsorId && c.sponsorCommission > 0) {
          for (const inst of c.finance.sponsorInstallments || []) {
            if (inst.status === "PAID") {
              paidCommission += inst.amount;
            } else {
              unpaidCommission += inst.amount;
              terminUnpaidCounts[inst.terminKey] =
                (terminUnpaidCounts[inst.terminKey] || 0) + 1;
            }
          }
        }
      } else if (!c.commissionPaid && c.sponsorCommission > 0) {
        unpaidCommission += c.sponsorCommission;
      }

      for (const doc of c.documents) {
        const tpl = DOC_TEMPLATE_CONFIG.find((t) => t.docType === doc.docType);
        if (tpl?.hasExpiry && doc.status !== "MISSING") {
          if (!doc.expiryDate) {
            missingExpiryDocs.push({ candidate: c, doc });
          } else {
            const dl = calcDaysLeft(doc.expiryDate);
            if (dl !== null && dl <= 60) {
              expiringDocsList.push({ candidate: c, doc, daysLeft: dl });
            }
          }
        }
      }
    }

    expiringDocsList.sort((a, b) => (a.daysLeft ?? 999) - (b.daysLeft ?? 999));

    return {
      totalCpmi: branchScoped.length,
      departing30Days,
      openCasesCount: openCases.length,
      overdueCasesCount: overdueCases.length,
      criticalDocsCount: expiringDocsList.length + missingExpiryDocs.length,
      paidCommission,
      unpaidCommission,
      totalRevenue,
      totalHppCost,
      netMargin: totalRevenue - totalHppCost - (paidCommission + unpaidCommission),
      terminUnpaidCounts,
      stageCounts,
      expiringDocsList,
      missingExpiryDocs,
    };
  }, [db, selectedBranchId]);

  // Handler Buka Dokumen Sensitif (Catat Audit UU PDP)
  async function handleRevealSensitive(candidate: Candidate, doc: CpmiDocument) {
    if (!perms.canViewSensitive) {
      setToast({
        type: "error",
        title: "Akses Dokumen Sensitif Dibatasi (RBAC)",
        details: [
          `Akun "${loggedInStaff?.name}" (${loggedInStaff?.roleLabel}) tidak memiliki izin membuka dokumen sensitif (${doc.title}).`,
          "Gunakan akun Admin Pusat, Staf Dokumen, Kepala Cabang, atau Direktur.",
        ],
      });
      return;
    }

    const isAlreadyRevealed = revealedSensitiveDocs[doc.id];
    if (!isAlreadyRevealed) {
      await callApi("LOG_SENSITIVE_VIEW", {
        candidateId: candidate.id,
        documentId: doc.id,
      });
      setRevealedSensitiveDocs((prev) => ({ ...prev, [doc.id]: true }));
      setToast({
        type: "warning",
        title: `Akses Dokumen Sensitif Tercatat (UU PDP)`,
        details: [
          `${loggedInStaff?.name} membuka "${doc.title}" milik ${candidate.fullName}.`,
          "Akses ini telah disimpan secara permanen di Jejak Audit perusahaan.",
        ],
      });
    } else {
      setRevealedSensitiveDocs((prev) => ({ ...prev, [doc.id]: false }));
    }
  }

  // Handler Buka Pratinjau Fisik / Scan Dokumen (KTP, Paspor, KK, Medical, Visa, dll.)
  async function handleOpenPhysicalDoc(candidate: Candidate, doc: CpmiDocument) {
    if (doc.isSensitive && !perms.canViewSensitive) {
      setToast({
        type: "error",
        title: "Akses Fisik Dokumen Sensitif Dibatasi (RBAC)",
        details: [
          `Akun "${loggedInStaff?.name}" (${loggedInStaff?.roleLabel}) tidak memiliki izin melihat fisik dokumen sensitif (${doc.title}).`,
        ],
      });
      return;
    }
    setPhysicalDocZoom(100);
    setViewingPhysicalDoc({ candidate, doc });
    if (doc.isSensitive && !revealedSensitiveDocs[doc.id]) {
      setRevealedSensitiveDocs((prev) => ({ ...prev, [doc.id]: true }));
      await callApi("LOG_SENSITIVE_VIEW", {
        candidateId: candidate.id,
        documentId: doc.id,
      });
    }
  }

  // Handler Naik/Ubah Tahap dengan Journey Gatekeeper
  async function handleStageChange(candidate: Candidate, targetStage: JourneyStage) {
    const { status, data } = await callApi("CHANGE_STAGE", {
      candidateId: candidate.id,
      targetStage,
    });

    if (status === 422 || !data.ok) {
      setToast({
        type: "error",
        title: `Journey Engine Mengunci Kenaikan ke Tahap "${targetStage}"`,
        details: data.blockers || [data.error],
      });
    } else {
      setToast({
        type: "success",
        title: `Tahapan ${candidate.fullName} Naik ke ${targetStage}`,
        details: [
          `Seluruh dokumen wajib untuk tahap ${targetStage} telah terverifikasi dan aktif.`,
        ],
      });
    }
  }

  // Handler Periksa Awal AI (OCR)
  async function handleRunAiCheck(candidate: Candidate, doc: CpmiDocument) {
    const { data } = await callApi("RUN_AI_CHECK", {
      candidateId: candidate.id,
      documentId: doc.id,
    });
    if (data.ok && data.doc) {
      setToast({
        type: data.doc.aiCheckStatus === "MATCH" ? "success" : "warning",
        title: `Hasil Asisten Periksa Awal AI: ${data.doc.title}`,
        details: [data.doc.aiCheckNotes],
      });
    }
  }

  // Handler Simpan Perubahan / Verifikasi Dokumen
  async function handleSaveDocument(e: React.FormEvent) {
    e.preventDefault();
    if (!editingDoc) return;

    const { data } = await callApi("UPDATE_DOCUMENT", {
      candidateId: editingDoc.candidate.id,
      documentId: editingDoc.doc.id,
      ...docForm,
    });

    if (data.ok) {
      setToast({
        type: "success",
        title: `Dokumen "${editingDoc.doc.title}" Diperbarui`,
        details: [
          `Status: ${docForm.status} | Masa berlaku: ${
            docForm.expiryDate || "Tidak diisi (tanpa pengingat otomatis)"
          }`,
        ],
      });
      setEditingDoc(null);
    } else {
      setToast({
        type: "error",
        title: "Gagal memperbarui dokumen",
        details: [data.error],
      });
    }
  }

  // Handler Tambah Kandidat Baru (dengan Pencegahan NIK Ganda)
  async function handleCreateCandidate(e: React.FormEvent) {
    e.preventDefault();
    setDuplicateNikAlert(null);

    const { status, data } = await callApi("CREATE_CANDIDATE", newForm);
    if (status === 409 && data.duplicateNik) {
      setDuplicateNikAlert({
        candidate: data.existingCandidate,
        branchName: data.existingBranchName,
        message: data.error,
      });
      return;
    }

    if (!data.ok) {
      setToast({
        type: "error",
        title: "Gagal Mendaftarkan CPMI",
        details: [data.error],
      });
      return;
    }

    setShowAddModal(false);
    setSelectedCandidateId(data.candidate.id);
    setActiveNav("cpmi");
    setToast({
      type: "success",
      title: `Berkas ${data.candidate.fullName} (${data.candidate.regNumber}) Berhasil Dibuat`,
      details: [
        data.candidate.nik
          ? `NIK ${data.candidate.nik} tervalidasi unik di seluruh cabang.`
          : "Terdaftar sebagai Lead lapangan. NIK & dokumen wajib dapat dilengkapi menyusul.",
      ],
    });
  }

  // Handler Selesaikan / Perpanjang Tugas dari halaman Pengingat
  async function handleCompleteRenewal(e: React.FormEvent) {
    e.preventDefault();
    if (!renewingTask) return;
    const { data } = await callApi("UPDATE_RENEWAL_TASK", {
      taskId: renewingTask.id,
      status: "COMPLETED",
      newExpiryDate: renewNewExpiry,
    });
    if (data.ok) {
      setToast({
        type: "success",
        title: `Perpanjangan "${renewingTask.docTitle}" Selesai`,
        details: [
          `Tanggal habis berlaku baru (${renewNewExpiry}) telah disimpan untuk ${renewingTask.candidateName}.`,
          `Dokumen kembali dihitung lengkap & aktif untuk kenaikan tahapan Journey Engine.`,
        ],
      });
      setRenewingTask(null);
      setRenewNewExpiry("");
    }
  }

  // Handler Buat Kasus Baru
  async function handleCreateCase(e: React.FormEvent) {
    e.preventDefault();
    const { data } = await callApi("CREATE_CASE", {
      ...newCaseForm,
      reportedBy: `${loggedInStaff?.name} (${loggedInStaff?.roleLabel})`,
    });
    if (data.ok) {
      setShowNewCaseModal(false);
      setSelectedCaseId(data.caseTicket.id);
      setToast({
        type: "success",
        title: `Tiket Penanganan Kasus ${data.caseTicket.ticketNumber} Dibuat`,
        details: [`Penanggung Jawab: ${data.caseTicket.picName}`],
      });
    }
  }

  // Handler Tambah Catatan Tindak Lanjut Kasus
  async function handleAddCaseNote(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedCase || !newCaseNoteText.trim()) return;
    const { data } = await callApi("ADD_CASE_NOTE", {
      caseId: selectedCase.id,
      note: newCaseNoteText,
      newStatus: newCaseStatusUpdate || undefined,
      escalatedTo: newCaseEscalationUpdate || undefined,
    });
    if (data.ok) {
      setNewCaseNoteText("");
      setNewCaseStatusUpdate("");
      setNewCaseEscalationUpdate("");
      setToast({
        type: "success",
        title: `Tindak Lanjut Kasus ${selectedCase.ticketNumber} Tersimpan`,
      });
    }
  }

  // Handler Buat Lowongan Baru
  async function handleCreateVacancy(e: React.FormEvent) {
    e.preventDefault();
    const { data } = await callApi("CREATE_VACANCY", newVacancyForm);
    if (data.ok) {
      setShowNewVacancyModal(false);
      setToast({
        type: "success",
        title: `Lowongan ${data.vacancy.code} (${data.vacancy.title}) Ditayangkan`,
      });
    }
  }

  // Handler Pelamar Melamar dari Lowongan Publik -> Masuk jadi LEAD
  async function handleApplyFromVacancy(e: React.FormEvent) {
    e.preventDefault();
    if (!applyingVacancy) return;
    const { status, data } = await callApi("APPLY_VACANCY_PUBLIC", {
      vacancyId: applyingVacancy.id,
      ...applyForm,
    });
    if (status === 409 || !data.ok) {
      setToast({
        type: "error",
        title: "Pendaftaran Pelamar Ditolak",
        details: [data.error],
      });
      return;
    }
    setApplyingVacancy(null);
    setSelectedCandidateId(data.candidate.id);
    setToast({
      type: "success",
      title: `Pelamar "${data.candidate.fullName}" Otomatis Masuk Sebagai LEAD!`,
      details: [
        `No Registrasi: ${data.candidate.regNumber} · Terhubung ke Lowongan ${applyingVacancy.code}.`,
        `Tanpa salin ulang data — langsung siap diproses di menu Data CPMI.`,
      ],
    });
  }

  // Handler Login Portal Mandiri CPMI
  function handlePortalLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!db) return;
    const cleanNik = portalNikInput.trim();
    const found = db.candidates.find(
      (c) => c.nik === cleanNik || c.regNumber.toLowerCase() === cleanNik.toLowerCase()
    );
    if (!found) {
      setToast({
        type: "error",
        title: "NIK / Nomor Registrasi Tidak Ditemukan",
        details: ["Pastikan 16 digit NIK yang Anda masukkan sudah terdaftar di PASMigranPro."],
      });
      return;
    }
    setPortalCandidateId(found.id);
    setToast({
      type: "success",
      title: `Selamat Datang di Portal Mandiri, ${found.fullName}`,
    });
  }

  // Handler Kirim Pengaduan dari Portal Mandiri CPMI
  async function handlePortalSubmitComplaint(e: React.FormEvent) {
    e.preventDefault();
    if (!portalCandidate || !portalComplaintTitle.trim()) return;
    const { data } = await callApi("CREATE_CASE", {
      candidateId: portalCandidate.id,
      category: portalComplaintCategory,
      priority: "HIGH",
      title: portalComplaintTitle,
      description: portalComplaintDesc,
      picName: "Rina Kartika (Admin Pusat)",
      reportedBy: `Portal Mandiri CPMI/PMI (${portalCandidate.fullName})`,
    });
    if (data.ok) {
      setPortalComplaintTitle("");
      setPortalComplaintDesc("");
      setToast({
        type: "success",
        title: `Pengaduan Anda (${data.caseTicket.ticketNumber}) Telah Diterima Kantor P3MI`,
        details: [
          "Tim Perlindungan & Penanganan Kasus PT Panca Banyu Ajisakti telah menerima notifikasi darurat Anda.",
        ],
      });
    }
  }

  // Kandidat terpilih di Modul Keuangan HPP
  const financeCandidate = useMemo(() => {
    if (!db) return null;
    return (
      db.candidates.find((c) => c.id === selectedFinanceCandidateId) ||
      db.candidates[0] ||
      null
    );
  }, [db, selectedFinanceCandidateId]);

  // Handler Bayar Termin Fee Sponsor (DP1 -> DP2 -> DP3 -> Pelunasan)
  async function handlePaySponsorTermin(e: React.FormEvent) {
    e.preventDefault();
    if (!payingTerminModal) return;

    const { status, data } = await callApi("PAY_SPONSOR_TERMIN", {
      candidateId: payingTerminModal.candidate.id,
      terminKey: payingTerminModal.installment.terminKey,
      paymentMethod: payTerminForm.paymentMethod,
      notes: payTerminForm.notes,
      forceOverride: payTerminForm.forceOverride,
    });

    if (status === 422 && data.stageWarning) {
      setPayingTerminModal((prev) =>
        prev
          ? {
              ...prev,
              stageWarningMsg: data.error,
            }
          : null
      );
      return;
    }

    if (!data.ok) {
      setToast({
        type: "error",
        title: "Pencairan Termin Fee Sponsor Ditolak",
        details: [data.error],
      });
      return;
    }

    const updatedCandidate: Candidate = data.candidate;
    const paidInst: SponsorInstallment = data.installment;
    const spObj = db?.sponsors.find((s) => s.id === updatedCandidate.sponsorId);

    setPayingTerminModal(null);
    setPayTerminForm({
      paymentMethod: "TRANSFER_BANK",
      notes: "",
      forceOverride: false,
    });
    setToast({
      type: "success",
      title: `Pencairan ${paidInst.label} Berhasil Dicatat (${formatRupiah(paidInst.amount)})`,
      details: [
        `No. Kwitansi: ${paidInst.receiptNumber} · Penerima: ${spObj?.name || "-"}`,
        `CPMI: ${updatedCandidate.fullName} (${updatedCandidate.regNumber})`,
      ],
    });
    setReceiptPreviewModal({
      candidate: updatedCandidate,
      installment: paidInst,
      sponsorName: spObj?.name || "Sponsor Lapangan",
      sponsorArea: spObj?.area || "-",
    });
  }

  // Handler Tambah Komponen Biaya HPP Baru per CPMI
  async function handleAddCostItem(e: React.FormEvent) {
    e.preventDefault();
    if (!financeCandidate || !newCostForm.title.trim()) return;
    const { data } = await callApi("ADD_COST_ITEM", {
      candidateId: financeCandidate.id,
      ...newCostForm,
    });
    if (data.ok) {
      setNewCostForm({
        category: "LAINNYA",
        title: "",
        amount: 750000,
        borneBy: "AGENSI_MAJIKAN",
        status: "PAID",
      });
      setToast({
        type: "success",
        title: `Komponen Biaya HPP Ditambahkan untuk ${financeCandidate.fullName}`,
      });
    }
  }

  if (loading || !db) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <div className="flex flex-col items-center gap-3">
          <img
            src="/logo-pas.png"
            alt="PASMigranPro Logo"
            className="h-14 w-14 rounded-2xl bg-white object-contain p-1.5 shadow-xl animate-pulse"
          />
          <p className="text-sm font-medium text-slate-300">
            Memuat Ekosistem PASMigranPro P3MI...
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 p-6 text-white">
        {/* Elemen Dekorasi Cahaya Latar (Ambient Glow Halus) */}
        <div className="pointer-events-none absolute -top-40 -left-40 h-96 w-96 rounded-full bg-sky-500/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-teal-500/15 blur-3xl" />

        {/* KARTU LOGIN SUPERADMIN TERPUSAT YANG BERSIH & ELEGAN */}
        <div className="relative z-10 w-full max-w-md">
          {/* Header Logo & Identitas Perusahaan di Atas Kartu */}
          <div className="mb-6 flex flex-col items-center text-center">
            <img
              src="/logo-pas.png"
              alt="PASMigranPro Logo"
              className="h-14 w-14 rounded-2xl bg-white object-contain p-1.5 shadow-xl ring-2 ring-white/20"
            />
            <div className="mt-3 flex items-center gap-2">
              <span className="text-2xl font-extrabold tracking-tight text-white">
                PASMigranPro
              </span>
              <span className="rounded-full border border-teal-400/40 bg-teal-500/20 px-2.5 py-0.5 text-[10px] font-bold tracking-wider text-teal-300 uppercase">
                Enterprise Cloud
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-400">
              PT Panca Banyu Ajisakti · Sistem Manajemen Operasional P3MI
            </p>
          </div>

          <div className="rounded-3xl border border-white/15 bg-slate-900/85 p-8 shadow-2xl backdrop-blur-xl">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-500/15 px-3 py-1 text-[11px] font-bold text-emerald-300">
                <Lock className="h-3 w-3" />
                Otorisasi Superadmin
              </span>
              <span className="font-mono text-[11px] text-slate-400">Multi-Tenant</span>
            </div>

            <h2 className="mt-4 text-xl font-extrabold text-white">
              Masuk ke Command Center
            </h2>

            {/* Informasi Tenant Aktif */}
            <div className="mt-4 flex items-center justify-between rounded-2xl border border-sky-500/25 bg-sky-500/10 px-4 py-2.5 text-xs">
              <div>
                <span className="text-[10px] font-bold tracking-wider text-sky-300 uppercase block">
                  Master Tenant P3MI
                </span>
                <strong className="text-white">PT Panca Banyu Ajisakti</strong>
              </div>
              <span className="rounded-lg bg-sky-500/20 px-2 py-0.5 text-[10px] font-bold text-sky-200 border border-sky-400/30">
                Verified
              </span>
            </div>

            {superAdminError && (
              <div className="mt-4 rounded-xl border border-rose-500/40 bg-rose-500/15 p-3 text-xs text-rose-200">
                <p className="font-bold flex items-center gap-1.5">
                  <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0" />
                  Autentikasi Ditolak
                </p>
                <p className="mt-1 text-[11px]">{superAdminError}</p>
              </div>
            )}

            <form onSubmit={handleSuperAdminLogin} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Email / Username Superadmin
                </label>
                <input
                  type="text"
                  required
                  value={superAdminEmail}
                  onChange={(e) => setSuperAdminEmail(e.target.value)}
                  placeholder="superadmin@pasmigranpro.id"
                  className="w-full rounded-xl border border-white/15 bg-slate-950/90 px-4 py-3 text-sm font-medium text-white placeholder-slate-500 focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20 focus:outline-none"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-300">
                    Kata Sandi / Kunci Otorisasi
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowSuperAdminPassword(!showSuperAdminPassword)}
                    className="text-[11px] font-semibold text-sky-400 hover:text-sky-300"
                  >
                    {showSuperAdminPassword ? "Sembunyikan" : "Tampilkan Sandi"}
                  </button>
                </div>
                <input
                  type={showSuperAdminPassword ? "text" : "password"}
                  required
                  value={superAdminPassword}
                  onChange={(e) => setSuperAdminPassword(e.target.value)}
                  placeholder="••••••••••••••"
                  className="w-full rounded-xl border border-white/15 bg-slate-950/90 px-4 py-3 font-mono text-sm text-white placeholder-slate-500 focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-teal-500 px-5 py-3.5 text-sm font-extrabold text-slate-950 shadow-lg shadow-sky-500/25 transition hover:from-sky-400 hover:to-teal-400"
              >
                Masuk ke Command Center P3MI
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>

            {/* Box Kredensial Demo 1 User Superadmin */}
            <div className="mt-5 rounded-2xl border border-white/10 bg-slate-950/70 p-3.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-200 flex items-center gap-1.5">
                  <KeyRound className="h-3.5 w-3.5 text-amber-400" />
                  Akun Demo Superadmin
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setSuperAdminEmail("superadmin@pasmigranpro.id");
                    setSuperAdminPassword("SuperAdmin2026!");
                    setSuperAdminError("");
                  }}
                  className="rounded-lg border border-sky-400/30 bg-sky-500/15 px-2.5 py-1 text-[10px] font-bold text-sky-300 hover:bg-sky-500/25"
                >
                  ⚡ Isi Otomatis
                </button>
              </div>
              <div className="mt-2 space-y-1 font-mono text-[11px] text-slate-300">
                <div className="flex justify-between">
                  <span className="text-slate-500">Username:</span>
                  <span className="font-bold text-white">superadmin@pasmigranpro.id</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Password:</span>
                  <span className="font-bold text-teal-300">SuperAdmin2026!</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* SIDEBAR PASMIGRANPRO */}
      <aside className="hidden w-64 shrink-0 flex-col bg-slate-900 text-white lg:flex">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <img
              src="/logo-pas.png"
              alt="PASMigranPro Logo"
              className="h-9 w-9 shrink-0 rounded-lg bg-white object-contain p-0.5 shadow-sm"
            />
            <div>
              <p className="text-base font-bold tracking-tight text-white">PASMigranPro</p>
              <p className="text-[11px] text-slate-400">Sistem Operasional P3MI</p>
            </div>
          </div>
          <span className="rounded-full bg-teal-500/20 px-2 py-0.5 text-[10px] font-semibold text-teal-300 border border-teal-500/30">
            Internal
          </span>
        </div>

        {/* Pilihan Cabang Aktif di Sidebar */}
        <div className="border-b border-white/10 px-4 py-3.5">
          <label className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            <Building2 className="h-3.5 w-3.5 text-sky-400" />
            Filter Cabang P3MI
          </label>
          <select
            value={selectedBranchId}
            disabled={loggedInStaff ? loggedInStaff.branchId !== "ALL" : false}
            onChange={(e) => setSelectedBranchId(e.target.value)}
            className="w-full rounded-lg border border-white/15 bg-slate-800 px-2.5 py-2 text-xs font-medium text-white focus:border-sky-400 focus:outline-none disabled:opacity-60"
          >
            <option value="ALL">Seluruh Cabang ({db.candidates.length} CPMI)</option>
            {db.branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.code} · {b.name}
              </option>
            ))}
          </select>
        </div>

        {/* Menu Navigasi Utama */}
        <nav className="flex-1 space-y-1 px-3 py-4 text-sm">
          <button
            onClick={() => setActiveNav("beranda")}
            className={`flex w-full items-center justify-between rounded-lg px-3 py-2 font-medium transition ${
              activeNav === "beranda"
                ? "bg-sky-500 text-white shadow-sm"
                : "text-slate-300 hover:bg-white/5 hover:text-white"
            }`}
          >
            <span className="flex items-center gap-2.5">
              <LayoutDashboard className="h-4 w-4" />
              Beranda
            </span>
          </button>

          <button
            onClick={() => setActiveNav("cpmi")}
            className={`flex w-full items-center justify-between rounded-lg px-3 py-2 font-medium transition ${
              activeNav === "cpmi"
                ? "bg-sky-500 text-white shadow-sm"
                : "text-slate-300 hover:bg-white/5 hover:text-white"
            }`}
          >
            <span className="flex items-center gap-2.5">
              <Users className="h-4 w-4" />
              Person (Data CPMI)
            </span>
            <span className="rounded-full bg-white/15 px-2 py-0.5 text-[11px] font-semibold">
              {stats.totalCpmi}
            </span>
          </button>

          <button
            onClick={() => setActiveNav("keuangan")}
            className={`flex w-full items-center justify-between rounded-lg px-3 py-2 font-medium transition ${
              activeNav === "keuangan"
                ? "bg-emerald-600 text-white shadow-sm"
                : "text-emerald-300 hover:bg-white/5 hover:text-white"
            }`}
          >
            <span className="flex items-center gap-2.5">
              <Wallet className="h-4 w-4" />
              Keuangan & Fee Sponsor
            </span>
            <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-bold text-emerald-200">
              DP 1-3 & Lunas
            </span>
          </button>

          <button
            onClick={() => setActiveNav("pelatihan")}
            className={`flex w-full items-center justify-between rounded-lg px-3 py-2 font-medium transition ${
              activeNav === "pelatihan"
                ? "bg-sky-500 text-white shadow-sm"
                : "text-slate-300 hover:bg-white/5 hover:text-white"
            }`}
          >
            <span className="flex items-center gap-2.5">
              <GraduationCap className="h-4 w-4" />
              BLK-LN & Pelatihan
            </span>
            <span className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] text-slate-300">
              Asrama
            </span>
          </button>

          <button
            onClick={() => setActiveNav("pengingat")}
            className={`flex w-full items-center justify-between rounded-lg px-3 py-2 font-medium transition ${
              activeNav === "pengingat"
                ? "bg-sky-500 text-white shadow-sm"
                : "text-slate-300 hover:bg-white/5 hover:text-white"
            }`}
          >
            <span className="flex items-center gap-2.5">
              <Bell className="h-4 w-4" />
              Pengingat Dokumen
            </span>
            {stats.criticalDocsCount > 0 && (
              <span className="rounded-full bg-rose-500 px-2 py-0.5 text-[11px] font-bold text-white">
                {stats.criticalDocsCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveNav("cases")}
            className={`flex w-full items-center justify-between rounded-lg px-3 py-2 font-medium transition ${
              activeNav === "cases"
                ? "bg-sky-500 text-white shadow-sm"
                : "text-slate-300 hover:bg-white/5 hover:text-white"
            }`}
          >
            <span className="flex items-center gap-2.5">
              <LifeBuoy className="h-4 w-4" />
              Case (Pengaduan PMI)
            </span>
            {stats.openCasesCount > 0 && (
              <span className="rounded-full bg-amber-500 px-2 py-0.5 text-[11px] font-bold text-slate-950">
                {stats.openCasesCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveNav("vacancy")}
            className={`flex w-full items-center justify-between rounded-lg px-3 py-2 font-medium transition ${
              activeNav === "vacancy"
                ? "bg-sky-500 text-white shadow-sm"
                : "text-slate-300 hover:bg-white/5 hover:text-white"
            }`}
          >
            <span className="flex items-center gap-2.5">
              <Briefcase className="h-4 w-4" />
              Vacancy (Lowongan)
            </span>
            <span className="rounded-full bg-white/10 px-2 py-0.5 text-[11px]">
              {db.vacancies?.length || 0}
            </span>
          </button>

          <button
            onClick={() => setActiveNav("portal_cpmi")}
            className={`flex w-full items-center justify-between rounded-lg px-3 py-2 font-medium transition ${
              activeNav === "portal_cpmi"
                ? "bg-teal-600 text-white shadow-sm"
                : "text-teal-300 hover:bg-white/5 hover:text-white"
            }`}
          >
            <span className="flex items-center gap-2.5">
              <Smartphone className="h-4 w-4" />
              Portal Mandiri CPMI
            </span>
            <span className="rounded bg-teal-500/20 px-1.5 py-0.5 text-[10px] text-teal-200">
              Cek NIK
            </span>
          </button>

          <button
            onClick={() => setActiveNav("medical_visa")}
            className={`flex w-full items-center justify-between rounded-lg px-3 py-2 font-medium transition ${
              activeNav === "medical_visa"
                ? "bg-sky-500 text-white shadow-sm"
                : "text-slate-300 hover:bg-white/5 hover:text-white"
            }`}
          >
            <span className="flex items-center gap-2.5">
              <Stethoscope className="h-4 w-4" />
              Medical, Visa & Terbang
            </span>
          </button>

          <button
            onClick={() => setActiveNav("master_data")}
            className={`flex w-full items-center justify-between rounded-lg px-3 py-2 font-medium transition ${
              activeNav === "master_data"
                ? "bg-amber-500 text-slate-950 font-bold shadow-sm"
                : "text-amber-300 hover:bg-white/5 hover:text-white"
            }`}
          >
            <span className="flex items-center gap-2.5">
              <FolderKanban className="h-4 w-4" />
              Master Data & Mitra
            </span>
            <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-bold text-amber-200">
              Agensi/Badil
            </span>
          </button>

          <button
            onClick={() => setActiveNav("cabang_audit")}
            className={`flex w-full items-center justify-between rounded-lg px-3 py-2 font-medium transition ${
              activeNav === "cabang_audit"
                ? "bg-sky-500 text-white shadow-sm"
                : "text-slate-300 hover:bg-white/5 hover:text-white"
            }`}
          >
            <span className="flex items-center gap-2.5">
              <History className="h-4 w-4" />
              Staf, Sponsor & Audit
            </span>
          </button>
        </nav>

        {/* Info Superadmin yang Sedang Login di Bawah Sidebar */}
        <div className="border-t border-white/10 p-4 space-y-3">
          <div className="rounded-xl bg-slate-800/90 p-3 text-xs border border-white/10">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase text-teal-400">
                Superadmin Aktif
              </span>
              <button
                onClick={handleSuperAdminLogout}
                className="text-[10px] font-semibold text-rose-300 hover:underline"
              >
                Logout
              </button>
            </div>
            <p className="mt-1 font-bold text-white truncate">
              superadmin@pasmigranpro.id
            </p>
            <p className="text-[11px] text-slate-400 truncate">
              Tenant: PT Panca Banyu Ajisakti
            </p>
          </div>

          <div className="rounded-xl bg-white/5 p-3 text-[11px] leading-relaxed text-slate-300">
            <p className="font-semibold text-white flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-teal-400" />
              Pelengkap SISKOP2MI
            </p>
            <p className="mt-1 text-slate-400">
              Satu berkas digital per CPMI. Tersambung dari lowongan sampai purna.
            </p>
          </div>
        </div>
      </aside>

      {/* MAIN AREA */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* TOP HEADER */}
        <header className="sticky top-0 z-20 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white/95 px-6 py-3.5 backdrop-blur">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-slate-900">
                {activeNav === "beranda" && "Command Center Operasional P3MI"}
                {activeNav === "cpmi" && "Manajemen Data CPMI & Satu Berkas Digital"}
                {activeNav === "keuangan" &&
                  "Keuangan P3MI: Pembayaran Bertahap Fee Sponsor (DP1–DP3 & Pelunasan) & HPP"}
                {activeNav === "pelatihan" &&
                  "Manajemen BLK-LN, Asrama, Bahasa & Uji Kompetensi (BNSP/SSW)"}
                {activeNav === "pengingat" && "Pengingat Masa Berlaku Dokumen & Tugas Perpanjangan"}
                {activeNav === "cases" && "Penanganan Kasus, Pengaduan & Perlindungan PMI"}
                {activeNav === "vacancy" && "Publikasi Lowongan (Job Order) & Akuisisi Lead"}
                {activeNav === "portal_cpmi" && "Portal Mandiri CPMI/PMI (Cek Status & Pengaduan)"}
                {activeNav === "medical_visa" && "Pemantauan Medical Check-Up, Visa & Keberangkatan"}
                {activeNav === "master_data" &&
                  "Master Data & Database Mitra P3MI (Agensi/Syarikah, Sponsor, Klinik Wafid, BPJS/KUR & Badil)"}
                {activeNav === "cabang_audit" && "Manajemen Staf (RBAC), Komisi Sponsor & Jejak Audit"}
              </h1>
            </div>
            <p className="text-xs text-slate-500">
              PT Panca Banyu Ajisakti (P3MI Resmi) · Data terpusat seluruh cabang & perekrut
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Indikator Sesi Superadmin (Multi-Tenant Master) & Tombol Logout */}
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs">
              <ShieldCheck className="h-4 w-4 text-teal-600" />
              <div className="text-left">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-teal-700 leading-none">
                  SUPERADMIN · MASTER TENANT
                </span>
                <span className="font-bold text-slate-900">
                  {loggedInStaff?.name || "Superadmin Utama"}
                </span>
              </div>
              <button
                onClick={handleSuperAdminLogout}
                title="Keluar ke Halaman Login Superadmin"
                className="ml-2 inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1 text-[11px] font-bold text-rose-700 hover:bg-rose-100 transition"
              >
                <LogOut className="h-3.5 w-3.5" />
                Keluar
              </button>
            </div>

            <button
              onClick={() => setShowBadilModal(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-900 shadow-xs transition hover:bg-amber-100"
            >
              <RefreshCw className="h-3.5 w-3.5 text-amber-700" />
              Proses Badil (Pengganti)
            </button>

            <button
              onClick={() => {
                setDuplicateNikAlert(null);
                setShowAddModal(true);
              }}
              className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-slate-800"
            >
              <UserPlus className="h-3.5 w-3.5 text-sky-400" />
              + Daftarkan CPMI / Lead
            </button>

            <button
              onClick={async () => {
                await callApi("RESET_DEMO_DATA");
                setRevealedSensitiveDocs({});
                setToast({
                  type: "success",
                  title: "Data Demo Direset ke Kondisi Awal",
                });
              }}
              title="Reset Data Contoh"
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
          </div>
        </header>

        {/* Navigasi Mobile */}
        <div className="flex gap-1 overflow-x-auto border-b border-slate-200 bg-white px-4 py-2 lg:hidden">
          {[
            { id: "beranda", label: "Beranda" },
            { id: "cpmi", label: `Person (${stats.totalCpmi})` },
            { id: "keuangan", label: "Keuangan (DP 1-3)" },
            { id: "pelatihan", label: "BLK-LN & Asrama" },
            { id: "pengingat", label: `Pengingat (${stats.criticalDocsCount})` },
            { id: "cases", label: `Case (${stats.openCasesCount})` },
            { id: "vacancy", label: `Vacancy (${db.vacancies?.length || 0})` },
            { id: "portal_cpmi", label: "Portal CPMI" },
            { id: "medical_visa", label: "Medical & Visa" },
            { id: "cabang_audit", label: "Staf & Audit" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveNav(tab.id as typeof activeNav)}
              className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold ${
                activeNav === tab.id
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-600"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* TOAST BANNER FEEDBACK */}
        {toast && (
          <div className="mx-6 mt-4 rounded-xl border border-slate-200 bg-white p-4 shadow-md">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                {toast.type === "success" && (
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-teal-600" />
                )}
                {toast.type === "error" && (
                  <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-rose-600" />
                )}
                {toast.type === "warning" && (
                  <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
                )}
                <div>
                  <p className="text-sm font-bold text-slate-900">{toast.title}</p>
                  {toast.details && toast.details.length > 0 && (
                    <ul className="mt-1 space-y-1 text-xs text-slate-600">
                      {toast.details.map((d, idx) => (
                        <li key={idx} className="flex items-center gap-1.5">
                          <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                          {d}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
              <button
                onClick={() => setToast(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* CONTENT BODY */}
        <main className="flex-1 p-6">
          {/* =========================================================
              TAB 1: BERANDA COMMAND CENTER (PERSIS PANEL MIGRANPRO)
             ========================================================= */}
          {activeNav === "beranda" && (
            <div className="space-y-6">
              {/* 4 KPI Utama Persis MigranPro: Total CPMI/PMI, Berangkat 30 Hari, Case Terbuka, Komisi Terutang */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex items-center justify-between text-slate-500">
                    <span className="text-xs font-semibold uppercase tracking-wider">
                      Total CPMI / PMI
                    </span>
                    <Users className="h-4 w-4 text-sky-600" />
                  </div>
                  <p className="mt-2 text-3xl font-bold text-slate-900">{stats.totalCpmi}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    Satu berkas digital unik per NIK 16 digit
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex items-center justify-between text-slate-500">
                    <span className="text-xs font-semibold uppercase tracking-wider">
                      Berangkat 30 Hari
                    </span>
                    <Plane className="h-4 w-4 text-teal-600" />
                  </div>
                  <p className="mt-2 text-3xl font-bold text-slate-900">
                    {stats.departing30Days}
                  </p>
                  <p className="mt-1 text-xs text-teal-700 font-medium">
                    Semua dokumen keberangkatan wajib lengkap
                  </p>
                </div>

                <button
                  onClick={() => setActiveNav("cases")}
                  className="rounded-2xl border border-rose-200 bg-rose-50/40 p-5 text-left shadow-sm transition hover:border-rose-300"
                >
                  <div className="flex items-center justify-between text-rose-700">
                    <span className="text-xs font-semibold uppercase tracking-wider">
                      Case Terbuka
                    </span>
                    <LifeBuoy className="h-4 w-4 text-rose-600" />
                  </div>
                  <p className="mt-2 text-3xl font-bold text-rose-600">
                    {stats.openCasesCount}
                  </p>
                  <p className="mt-1 text-xs text-rose-700">
                    {stats.overdueCasesCount} kasus lewat dari target penanganan →
                  </p>
                </button>

                <button
                  onClick={() => setActiveNav("keuangan")}
                  className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-5 text-left shadow-sm transition hover:border-emerald-300"
                >
                  <div className="flex items-center justify-between text-emerald-800">
                    <span className="text-xs font-semibold uppercase tracking-wider">
                      Fee Sponsor Terutang (DP1–Lunas)
                    </span>
                    <Wallet className="h-4 w-4 text-emerald-600" />
                  </div>
                  <p className="mt-2 text-2xl font-bold text-rose-600">
                    {perms.canSeeFinance
                      ? formatRupiah(stats.unpaidCommission)
                      : "Terbatas (RBAC)"}
                  </p>
                  <p className="mt-1 text-xs text-emerald-800 font-medium">
                    Kelola Termin DP 1, DP 2, DP 3 & Pelunasan →
                  </p>
                </button>
              </div>

              {/* Journey Engine Pipeline Visual */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-sky-600">
                      Journey Engine · Satu Jalur Seluruh Kantor
                    </span>
                    <h2 className="text-base font-bold text-slate-900">
                      Sebaran CPMI/PMI per Tahapan Penempatan
                    </h2>
                  </div>
                  <button
                    onClick={() => setActiveNav("cpmi")}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-sky-600 hover:underline"
                  >
                    Buka Semua Berkas CPMI <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
                  {JOURNEY_STAGES.map((st, idx) => {
                    const count = stats.stageCounts[st.key] || 0;
                    return (
                      <button
                        key={st.key}
                        onClick={() => {
                          setStageFilter(st.key);
                          setActiveNav("cpmi");
                        }}
                        className={`group flex flex-col justify-between rounded-xl border p-3.5 text-left transition hover:-translate-y-0.5 hover:shadow-md ${
                          st.isEngineControlled
                            ? "border-sky-200 bg-sky-50/50 hover:border-sky-400"
                            : "border-slate-200 bg-slate-50 hover:border-slate-300"
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold uppercase text-slate-400">
                              0{idx + 1}
                            </span>
                            {st.isEngineControlled && (
                              <span
                                title="Dikendalikan Journey Engine (Syarat Dokumen Wajib)"
                                className="h-2 w-2 rounded-full bg-sky-500"
                              />
                            )}
                          </div>
                          <p className="mt-1 text-sm font-bold text-slate-900 group-hover:text-sky-700">
                            {st.label}
                          </p>
                          <p className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-slate-500">
                            {st.shortDesc}
                          </p>
                        </div>
                        <div className="mt-3 flex items-baseline justify-between border-t border-slate-200/70 pt-2">
                          <span className="text-lg font-extrabold text-slate-900">{count}</span>
                          <span className="text-[10px] text-slate-500">orang</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Grid 2 Kolom: Perlu Perhatian Segera & Keberangkatan Terdekat */}
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-slate-900">
                        Perlu Perhatian Segera (Dokumen & Kasus)
                      </h3>
                      <span className="rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-bold text-rose-700">
                        {stats.criticalDocsCount + stats.openCasesCount} hal
                      </span>
                    </div>
                    <button
                      onClick={() => setActiveNav("pengingat")}
                      className="text-xs font-semibold text-sky-600 hover:underline"
                    >
                      Kelola Semua Pengingat →
                    </button>
                  </div>

                  <div className="space-y-2.5">
                    {/* Tampilkan juga kasus kritis yang lewat SLA */}
                    {db.cases
                      ?.filter((cs) => cs.status !== "RESOLVED")
                      .map((cs) => (
                        <div
                          key={cs.id}
                          className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50/70 p-3.5"
                        >
                          <div className="flex items-start gap-3">
                            <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-rose-600" />
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-xs font-bold text-slate-900">
                                  [{cs.ticketNumber}] {cs.candidateName} ({cs.destinationCountry})
                                </span>
                                <span className="rounded-full bg-rose-600 px-2 py-0.5 text-[10px] font-bold text-white">
                                  KASUS {cs.priority} · {cs.status}
                                </span>
                              </div>
                              <p className="mt-1 text-xs text-slate-700 font-medium">{cs.title}</p>
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              setSelectedCaseId(cs.id);
                              setActiveNav("cases");
                            }}
                            className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-700"
                          >
                            Tangani Kasus
                          </button>
                        </div>
                      ))}

                    {stats.expiringDocsList.map(({ candidate, doc, daysLeft }) => {
                      const isExpired = daysLeft !== null && daysLeft < 0;
                      const isCritical7 = daysLeft !== null && daysLeft >= 0 && daysLeft <= 7;
                      return (
                        <div
                          key={doc.id}
                          className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border p-3.5 ${
                            isExpired
                              ? "border-rose-200 bg-rose-50/70"
                              : isCritical7
                              ? "border-amber-300 bg-amber-50/70"
                              : "border-slate-200 bg-slate-50"
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <span
                              className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${
                                isExpired
                                  ? "bg-rose-600"
                                  : isCritical7
                                  ? "bg-amber-500"
                                  : "bg-sky-500"
                              }`}
                            />
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-xs font-bold text-slate-900">
                                  {candidate.fullName}
                                </span>
                                <span className="rounded bg-white px-1.5 py-0.5 text-[10px] font-semibold text-slate-600 border border-slate-200">
                                  {candidate.destinationCountry} · Tahap {candidate.stage}
                                </span>
                                <span
                                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                    isExpired
                                      ? "bg-rose-600 text-white"
                                      : isCritical7
                                      ? "bg-amber-500 text-white"
                                      : "bg-sky-100 text-sky-800"
                                  }`}
                                >
                                  {isExpired
                                    ? `EXPIRED (${Math.abs(daysLeft!)} hari lalu) — Berhenti Dihitung Lengkap!`
                                    : `Habis dalam ${daysLeft} hari (${doc.expiryDate})`}
                                </span>
                              </div>
                              <p className="mt-1 text-xs text-slate-600">
                                <strong className="text-slate-800">{doc.title}</strong> · No:{" "}
                                {doc.docNumber || "-"} ({doc.issuedBy || "-"})
                              </p>
                            </div>
                          </div>

                          <button
                            onClick={() => {
                              setSelectedCandidateId(candidate.id);
                              setActiveNav("cpmi");
                            }}
                            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 hover:bg-slate-100"
                          >
                            Buka Berkas
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Keberangkatan Terdekat & Lowongan Aktif */}
                <div className="space-y-6">
                  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <Plane className="h-4 w-4 text-sky-600" />
                      Jadwal Keberangkatan & Terbang
                    </h3>
                    <ul className="mt-3 divide-y divide-slate-100">
                      {db.candidates
                        .filter((c) => c.flightInfo)
                        .map((c) => (
                          <li
                            key={c.id}
                            className="flex items-center justify-between py-2.5 text-xs"
                          >
                            <div>
                              <p className="font-bold text-slate-900">{c.fullName}</p>
                              <p className="text-sky-600 font-medium">{c.flightInfo}</p>
                              <p className="text-[11px] text-slate-400">
                                Tujuan: {c.destinationCountry} ({c.stage})
                              </p>
                            </div>
                            <div className="text-right">
                              <span className="rounded-md bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-700">
                                {c.departureDate}
                              </span>
                            </div>
                          </li>
                        ))}
                    </ul>
                    <div className="mt-3 flex items-center gap-2 rounded-lg bg-teal-50 px-3 py-2 text-[11px] text-teal-800">
                      <span className="h-2 w-2 rounded-full bg-teal-500" />
                      Semua dokumen wajib diverifikasi sebelum tiket diterbitkan
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        <Briefcase className="h-4 w-4 text-teal-600" />
                        Job Order / Lowongan Aktif
                      </h3>
                      <button
                        onClick={() => setActiveNav("vacancy")}
                        className="text-[11px] font-semibold text-sky-600 hover:underline"
                      >
                        Lihat Semua →
                      </button>
                    </div>
                    <ul className="mt-3 space-y-2.5">
                      {db.vacancies?.slice(0, 3).map((v) => (
                        <li
                          key={v.id}
                          className="rounded-lg border border-slate-100 bg-slate-50 p-2.5 text-xs"
                        >
                          <div className="flex items-center justify-between font-bold text-slate-900">
                            <span>{v.destinationCountry}</span>
                            <span className="text-[11px] text-teal-700">
                              Kuota {v.quotaFilled}/{v.quotaTotal}
                            </span>
                          </div>
                          <p className="mt-0.5 text-[11px] text-slate-600 truncate">{v.title}</p>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* =========================================================
              TAB 2: PERSON / DATA CPMI & SATU BERKAS DIGITAL PER ORANG
             ========================================================= */}
          {activeNav === "cpmi" && (
            <div className="space-y-6">
              {/* Bar Pilihan Tampilan Berkas: Detail per Orang vs Tabel Matriks 10 Berkas (KTP, Paspor, Medical, Visa, dll.) */}
              <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-sky-600">
                    Pusat Verifikasi Dokumen & Berkas Digital CPMI
                  </span>
                  <h2 className="text-base font-bold text-slate-900">
                    Cek Status Verifikasi KTP, KK, Paspor, Medical Check-Up, PK & Visa
                  </h2>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={docStatusFilter}
                    onChange={(e) => setDocStatusFilter(e.target.value)}
                    className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-800"
                  >
                    <option value="ALL">Filter Berkas: Semua Status ({db.candidates.length} CPMI)</option>
                    <option value="INCOMPLETE">Belum Lengkap / Belum Verified</option>
                    <option value="COMPLETE_10">Sudah Lengkap 10/10 Verified</option>
                    <option value="HAS_EXPIRED">Ada Dokumen Kedaluwarsa (Expired)</option>
                  </select>

                  <div className="inline-flex rounded-xl border border-slate-200 bg-slate-100 p-1">
                    <button
                      onClick={() => setCpmiViewMode("DETAIL_ORANG")}
                      className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                        cpmiViewMode === "DETAIL_ORANG"
                          ? "bg-slate-900 text-white shadow-sm"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      Detail Berkas Per Orang
                    </button>
                    <button
                      onClick={() => setCpmiViewMode("MATRIKS_BERKAS")}
                      className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                        cpmiViewMode === "MATRIKS_BERKAS"
                          ? "bg-sky-600 text-white shadow-sm"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      Tabel Matriks 10 Berkas (KTP, Paspor, Visa)
                    </button>
                  </div>
                </div>
              </div>

              {cpmiViewMode === "MATRIKS_BERKAS" && (
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">
                        Matriks Rekapitulasi Verifikasi 10 Berkas Wajib Seluruh CPMI ({filteredCandidates.length} Kandidat)
                      </h3>
                      <p className="text-xs text-slate-500">
                        Klik langsung pada badge dokumen (misal <strong>KTP</strong>, <strong>Paspor</strong>, <strong>Medical</strong>, atau <strong>Visa</strong>) untuk langsung memverifikasi atau mengisi nomor & masa berlaku berkas.
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-[11px]">
                      <span className="inline-flex items-center gap-1 font-semibold text-teal-800">
                        <span className="h-2.5 w-2.5 rounded-full bg-teal-500" /> VERIFIED (Sudah Diverifikasi)
                      </span>
                      <span className="inline-flex items-center gap-1 font-semibold text-sky-800">
                        <span className="h-2.5 w-2.5 rounded-full bg-sky-500" /> UPLOADED (Menunggu Verifikasi)
                      </span>
                      <span className="inline-flex items-center gap-1 font-semibold text-slate-600">
                        <span className="h-2.5 w-2.5 rounded-full bg-slate-300" /> MISSING (Belum Ada)
                      </span>
                      <span className="inline-flex items-center gap-1 font-semibold text-rose-700">
                        <span className="h-2.5 w-2.5 rounded-full bg-rose-600" /> EXPIRED (Kedaluwarsa)
                      </span>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase text-slate-600">
                          <th className="py-3 px-3">Nama CPMI & Negara</th>
                          <th className="py-3 px-2 text-center">Skor</th>
                          {DOC_TEMPLATE_CONFIG.map((tpl) => (
                            <th key={tpl.docType} className="py-3 px-2 text-center">
                              {tpl.docType === "AKTA_IJAZAH"
                                ? "Akta/Ijazah"
                                : tpl.docType === "IZIN_KELUARGA"
                                ? "Izin Kel."
                                : tpl.docType === "SERTIFIKAT_KOMPETENSI"
                                ? "Sertifikat"
                                : tpl.docType === "PERJANJIAN_PENEMPATAN"
                                ? "PK / Kontrak"
                                : tpl.docType === "TIKET_EKTKLN"
                                ? "Tiket/eKTKLN"
                                : tpl.docType}
                            </th>
                          ))}
                          <th className="py-3 px-3 text-right">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredCandidates.map((c) => {
                          const verCount = c.documents.filter((d) => d.status === "VERIFIED").length;
                          return (
                            <tr key={c.id} className="hover:bg-slate-50/80">
                              <td className="py-3 px-3">
                                <div className="font-bold text-slate-900">{c.fullName}</div>
                                <div className="text-[11px] text-slate-500">
                                  {c.destinationCountry} · Tahap <strong>{c.stage}</strong>
                                </div>
                              </td>
                              <td className="py-3 px-2 text-center">
                                <span
                                  className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                                    verCount === c.documents.length
                                      ? "bg-teal-100 text-teal-800"
                                      : "bg-amber-100 text-amber-800"
                                  }`}
                                >
                                  {verCount}/{c.documents.length}
                                </span>
                              </td>
                              {DOC_TEMPLATE_CONFIG.map((tpl) => {
                                const doc = c.documents.find((d) => d.docType === tpl.docType);
                                if (!doc) return <td key={tpl.docType} className="py-3 px-2 text-center">-</td>;
                                const dl = calcDaysLeft(doc.expiryDate);
                                const isExp = doc.status === "EXPIRED" || (dl !== null && dl < 0);
                                return (
                                  <td key={doc.id} className="py-2.5 px-1.5 text-center">
                                    <button
                                      onClick={() => {
                                        setSelectedCandidateId(c.id);
                                        handleOpenPhysicalDoc(c, doc);
                                      }}
                                      title={`${doc.title} (${doc.status}) — Klik untuk melihat fisik berkas / verifikasi`}
                                      className={`w-full rounded-lg border px-2 py-1 text-[10px] font-bold transition hover:scale-105 ${
                                        isExp
                                          ? "border-rose-300 bg-rose-600 text-white"
                                          : doc.status === "VERIFIED"
                                          ? "border-teal-200 bg-teal-50 text-teal-800 hover:bg-teal-100"
                                          : doc.status === "UPLOADED"
                                          ? "border-sky-200 bg-sky-50 text-sky-800 hover:bg-sky-100"
                                          : "border-slate-200 bg-slate-100 text-slate-500 hover:bg-slate-200"
                                      }`}
                                    >
                                      {isExp
                                        ? "EXPIRED"
                                        : doc.status === "VERIFIED"
                                        ? "✓ VERIFIED"
                                        : doc.status === "UPLOADED"
                                        ? "⏳ UPLOAD"
                                        : "✕ BELUM"}
                                    </button>
                                  </td>
                                );
                              })}
                              <td className="py-3 px-3 text-right">
                                <button
                                  onClick={() => {
                                    setSelectedCandidateId(c.id);
                                    setCpmiViewMode("DETAIL_ORANG");
                                  }}
                                  className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-sky-700 hover:bg-sky-50"
                                >
                                  Detail Berkas
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
              <div className="space-y-4 xl:col-span-4">
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Cari Nama, 16-digit NIK, No Reg..."
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 py-2 text-xs text-slate-900 focus:border-sky-500 focus:bg-white focus:outline-none"
                    />
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <select
                      value={stageFilter}
                      onChange={(e) => setStageFilter(e.target.value)}
                      className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-700"
                    >
                      <option value="ALL">Semua Tahapan</option>
                      {JOURNEY_STAGES.map((s) => (
                        <option key={s.key} value={s.key}>
                          Tahap: {s.label}
                        </option>
                      ))}
                    </select>

                    <select
                      value={countryFilter}
                      onChange={(e) => setCountryFilter(e.target.value)}
                      className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-700"
                    >
                      <option value="ALL">Semua Negara (Asia & Timteng)</option>
                      <option value="TIMUR_TENGAH">★ Kawasan Timur Tengah (Semua)</option>
                      <option value="ASIA_PASIFIK">★ Kawasan Asia Timur & Tenggara</option>
                      <optgroup label="Skema Timur Tengah (SPSK / Formal / Tadbeer / QIZ)">
                        <option value="Arab Saudi">Arab Saudi (SPSK / Musaned)</option>
                        <option value="Uni Emirat Arab (UAE)">Uni Emirat Arab (UAE - Tadbeer/MOHRE)</option>
                        <option value="Kuwait">Kuwait (Sektor Formal / Wakalah)</option>
                        <option value="Oman">Oman (Hospitality / Caregiver)</option>
                        <option value="Yordania">Yordania (Jordan - Garment QIZ)</option>
                      </optgroup>
                      <optgroup label="Skema Asia Timur & Asia Tenggara">
                        <option value="Taiwan">Taiwan</option>
                        <option value="Hong Kong">Hong Kong</option>
                        <option value="Jepang">Jepang (SSW)</option>
                        <option value="Singapura">Singapura</option>
                        <option value="Korea Selatan">Korea Selatan</option>
                        <option value="Malaysia">Malaysia</option>
                      </optgroup>
                    </select>
                  </div>
                </div>

                <div className="space-y-2.5 max-h-[72vh] overflow-y-auto pr-1">
                  {filteredCandidates.map((c) => {
                    const isSelected = selectedCandidate?.id === c.id;
                    const verifiedCount = c.documents.filter((d) => d.status === "VERIFIED").length;
                    const expiredCount = c.documents.filter((d) => {
                      const dl = calcDaysLeft(d.expiryDate);
                      return d.status === "EXPIRED" || (dl !== null && dl < 0);
                    }).length;
                    const criticalCount = c.documents.filter((d) => {
                      const dl = calcDaysLeft(d.expiryDate);
                      return dl !== null && dl >= 0 && dl <= 30;
                    }).length;
                    const branchName =
                      db.branches.find((b) => b.id === c.branchId)?.name || c.branchId;

                    return (
                      <button
                        key={c.id}
                        onClick={() => setSelectedCandidateId(c.id)}
                        className={`w-full rounded-2xl border p-4 text-left transition ${
                          isSelected
                            ? "border-sky-500 bg-sky-50/60 ring-2 ring-sky-500/20 shadow-sm"
                            : "border-slate-200 bg-white hover:border-slate-300"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-3">
                            <img
                              src={getCandidateAvatarUrl(c)}
                              alt={c.fullName}
                              className="h-11 w-9 shrink-0 rounded-lg border border-slate-300 object-cover shadow-xs"
                            />
                            <div>
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span className="text-sm font-bold text-slate-900">
                                  {c.fullName}
                                </span>
                                {c.specialStatus !== "NORMAL" && (
                                  <span
                                    className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                                      c.specialStatus === "REHIRE"
                                        ? "bg-purple-100 text-purple-800"
                                        : c.specialStatus === "BADIL_REPLACEMENT"
                                        ? "bg-amber-100 text-amber-900 border border-amber-300"
                                        : c.specialStatus === "REPLACED_OUT"
                                        ? "bg-rose-100 text-rose-800 border border-rose-300"
                                        : c.specialStatus === "BLACKLISTED"
                                        ? "bg-rose-600 text-white"
                                        : "bg-slate-200 text-slate-700"
                                    }`}
                                  >
                                    {c.specialStatus === "BADIL_REPLACEMENT"
                                      ? "BADIL (PENGGANTI)"
                                      : c.specialStatus === "REPLACED_OUT"
                                      ? "BATAL / DIGANTIKAN BADIL"
                                      : c.specialStatus}
                                  </span>
                                )}
                              </div>
                              <p className="mt-0.5 text-[11px] font-mono text-slate-500">
                                {c.regNumber} · NIK: {c.nik ? c.nik : "Belum diisi (Lead)"}
                              </p>
                            </div>
                          </div>
                          <span className="rounded-full bg-slate-900 px-2.5 py-0.5 text-[10px] font-bold text-white shrink-0">
                            {c.stage}
                          </span>
                        </div>

                        <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-600">
                          <span>
                            🌏 <strong>{c.destinationCountry}</strong> · {c.jobSector}
                          </span>
                          <span className="text-slate-400">{branchName}</span>
                        </div>

                        <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5 text-[11px]">
                          <span className="font-medium text-slate-600">
                            Berkas Verified:{" "}
                            <strong className="text-teal-700">
                              {verifiedCount}/{c.documents.length}
                            </strong>
                          </span>
                          <div className="flex items-center gap-1.5">
                            {expiredCount > 0 && (
                              <span className="rounded bg-rose-100 px-1.5 py-0.5 text-[10px] font-bold text-rose-700">
                                {expiredCount} Expired
                              </span>
                            )}
                            {criticalCount > 0 && (
                              <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-800">
                                {criticalCount} &lt;30hr
                              </span>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="xl:col-span-8">
                {selectedCandidate ? (
                  <div className="space-y-6">
                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-5">
                        <div className="flex items-start gap-4">
                          {/* Pas Foto / Avatar CPMI dengan Tombol Ganti Foto */}
                          <div className="flex flex-col items-center gap-1.5 shrink-0">
                            <img
                              src={getCandidateAvatarUrl(selectedCandidate)}
                              alt={selectedCandidate.fullName}
                              className="h-20 w-16 rounded-xl border-2 border-slate-300 object-cover shadow-sm"
                            />
                            <label className="cursor-pointer rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-semibold text-slate-700 hover:bg-sky-50 hover:text-sky-700 hover:border-sky-200">
                              📷 Ganti Foto
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (!file) return;
                                  const reader = new FileReader();
                                  reader.onload = async () => {
                                    const dataUrl = String(reader.result || "");
                                    await callApi("UPDATE_CANDIDATE", {
                                      candidateId: selectedCandidate.id,
                                      updates: { avatarUrl: dataUrl },
                                    });
                                    setToast({
                                      type: "success",
                                      title: `Pas Foto ${selectedCandidate.fullName} Berhasil Diperbarui`,
                                      details: [
                                        "Foto resmi otomatis tampil di Kartu Kandidat, e-KTP Scan, dan Biodata Paspor.",
                                      ],
                                    });
                                  };
                                  reader.readAsDataURL(file);
                                }}
                              />
                            </label>
                          </div>

                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="rounded-md bg-sky-100 px-2 py-0.5 text-xs font-mono font-bold text-sky-800">
                                {selectedCandidate.regNumber}
                              </span>
                              <h2 className="text-xl font-bold text-slate-900">
                                {selectedCandidate.fullName}
                              </h2>
                              <span className="rounded-full bg-slate-900 px-3 py-0.5 text-xs font-bold text-white">
                                Tahap: {selectedCandidate.stage}
                              </span>
                              {selectedCandidate.specialStatus !== "NORMAL" && (
                                <span
                                  className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                                    selectedCandidate.specialStatus === "BADIL_REPLACEMENT"
                                      ? "bg-amber-500 text-slate-950"
                                      : selectedCandidate.specialStatus === "REPLACED_OUT"
                                      ? "bg-rose-600 text-white"
                                      : "bg-rose-600 text-white"
                                  }`}
                                >
                                  {selectedCandidate.specialStatus === "BADIL_REPLACEMENT"
                                    ? "★ KANDIDAT BADIL (PENGGANTI)"
                                    : selectedCandidate.specialStatus === "REPLACED_OUT"
                                    ? "DIGANTIKAN OLEH BADIL"
                                    : selectedCandidate.specialStatus}
                                </span>
                              )}
                            </div>

                            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
                              <span className="font-mono">
                                <strong>NIK (16 Digit Unik):</strong>{" "}
                                {selectedCandidate.nik ? (
                                  <span className="text-teal-700 font-bold">
                                    {selectedCandidate.nik} ✓
                                  </span>
                                ) : (
                                  <span className="text-amber-600 font-semibold">
                                    Belum diisi (Tahap Lead)
                                  </span>
                                )}
                              </span>
                              <span>
                                <strong>No HP:</strong> {selectedCandidate.phone}
                              </span>
                              <span>
                                <strong>Cabang:</strong>{" "}
                                {db.branches.find((b) => b.id === selectedCandidate.branchId)?.name}
                              </span>
                              <span>
                                <strong>PIN Portal CPMI:</strong>{" "}
                                <code className="rounded bg-slate-100 px-1.5 py-0.5 font-bold text-slate-800">
                                  {selectedCandidate.portalPin || "123456"}
                                </code>
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              onClick={() => {
                                const fallbackRepl =
                                  db.candidates.find(
                                    (cand) =>
                                      cand.id !== selectedCandidate.id &&
                                      cand.specialStatus === "NORMAL" &&
                                      ["LEAD", "PROSPECT", "CPMI"].includes(cand.stage)
                                  )?.id || "cpmi-4";
                                setBadilForm((prev) => ({
                                  ...prev,
                                  originalCandidateId: selectedCandidate.id,
                                  replacementCandidateId: fallbackRepl,
                                  badilType: ["DEPLOYED", "ACTIVE_WORKER", "RETURNED"].includes(
                                    selectedCandidate.stage
                                  )
                                    ? "GARANSI_90_HARI"
                                    : "PRA_TERBANG",
                                  reason: ["DEPLOYED", "ACTIVE_WORKER", "RETURNED"].includes(
                                    selectedCandidate.stage
                                  )
                                    ? "PULANG_GARANSI_90_HARI"
                                    : "UNFIT_WAFID_MEDICAL",
                                  wakalahFeeScheme: ["DEPLOYED", "ACTIVE_WORKER", "RETURNED"].includes(
                                    selectedCandidate.stage
                                  )
                                    ? "FREE_WARRANTY_REPLACEMENT"
                                    : "FULL_WAKALAH_FEE",
                                }));
                                setShowBadilModal(true);
                              }}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-900 hover:bg-amber-100"
                            >
                              <RefreshCw className="h-3.5 w-3.5 text-amber-700" />
                              Proses Badil (Ganti Kandidat)
                            </button>

                            <select
                              value={selectedCandidate.specialStatus}
                              onChange={async (e) => {
                                const newSpec = e.target.value as SpecialStatus;
                                await callApi("UPDATE_CANDIDATE", {
                                  candidateId: selectedCandidate.id,
                                  updates: { specialStatus: newSpec },
                                });
                                setToast({
                                  type: "warning",
                                  title: `Status Jalur Khusus Diubah ke ${newSpec}`,
                                });
                              }}
                              className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-semibold text-slate-800"
                            >
                              <option value="NORMAL">Jalur Normal (Aktif)</option>
                              <option value="BADIL_REPLACEMENT">Badil (Kandidat Pengganti)</option>
                              <option value="REPLACED_OUT">Replaced Out (Digantikan Badil)</option>
                              <option value="REHIRE">Rehire (Eks-PMI Kembali Berangkat)</option>
                              <option value="INACTIVE">Inactive (Ditunda / Mundur)</option>
                              <option value="BLACKLISTED">Blacklisted (Diblokir)</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      {/* BANNER INFORMASI JEJAK BADIL JIKA KANDIDAT INI TERKAIT BADIL */}
                      {selectedCandidate.badilInfo && (
                        <div className="mt-4 rounded-xl border border-amber-300 bg-amber-50/80 p-4 text-xs">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <RefreshCw className="h-4 w-4 text-amber-700" />
                              <strong className="text-amber-950 text-sm">
                                {selectedCandidate.badilInfo.role === "REPLACEMENT_CANDIDATE"
                                  ? `Kandidat Pengganti (Badil) — Menggantikan: ${selectedCandidate.badilInfo.linkedCandidateName} (${selectedCandidate.badilInfo.linkedRegNumber})`
                                  : `Kandidat Batal/Pulang Dini — Telah Digantikan oleh Badil: ${selectedCandidate.badilInfo.linkedCandidateName} (${selectedCandidate.badilInfo.linkedRegNumber})`}
                              </strong>
                            </div>
                            <span className="rounded-full bg-amber-200 px-2.5 py-0.5 text-[10px] font-bold text-amber-950">
                              Skema: {selectedCandidate.badilInfo.badilType === "GARANSI_90_HARI" ? "Badil Garansi < 90 Hari" : "Badil Pra-Terbang (Wafid/Visa)"}
                            </span>
                          </div>
                          <div className="mt-2.5 grid grid-cols-1 gap-2 sm:grid-cols-3 text-[11px] text-amber-900">
                            <div className="rounded-lg bg-white/80 p-2 border border-amber-200">
                              <span className="text-slate-500 block">Alasan Badil:</span>
                              <strong>{selectedCandidate.badilInfo.reason}</strong>
                            </div>
                            <div className="rounded-lg bg-white/80 p-2 border border-amber-200">
                              <span className="text-slate-500 block">Carry-Over DP Sponsor:</span>
                              <strong className="text-emerald-700">
                                {formatRupiah(selectedCandidate.badilInfo.transferredSponsorDpAmount)}
                              </strong>{" "}
                              (Sunk Cost Awal: {formatRupiah(selectedCandidate.badilInfo.sunkCostAmount)})
                            </div>
                            <div className="rounded-lg bg-white/80 p-2 border border-amber-200">
                              <span className="text-slate-500 block">Perlakuan Wakalah / Agency Fee:</span>
                              <strong>
                                {selectedCandidate.badilInfo.wakalahFeeScheme === "FREE_WARRANTY_REPLACEMENT"
                                  ? "Free Replacement Garansi (Rp 0)"
                                  : "Wakalah Fee Penuh Dialihkan (100%)"}
                              </strong>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4 text-xs">
                        <div className="rounded-xl bg-slate-50 p-3">
                          <span className="text-slate-400 block">Negara & Jabatan</span>
                          <strong className="text-slate-900 mt-0.5 block">
                            {selectedCandidate.destinationCountry} · {selectedCandidate.jobSector}
                          </strong>
                        </div>
                        <div className="rounded-xl bg-slate-50 p-3">
                          <span className="text-slate-400 block">Majikan / Agensi Mitra</span>
                          <strong className="text-slate-900 mt-0.5 block truncate">
                            {selectedCandidate.employerName || "Belum ditentukan"}
                          </strong>
                        </div>
                        <div className="rounded-xl bg-slate-50 p-3">
                          <span className="text-slate-400 block">Penerbangan & Jadwal</span>
                          <strong className="text-slate-900 mt-0.5 block">
                            {selectedCandidate.flightInfo
                              ? `${selectedCandidate.flightInfo} (${selectedCandidate.departureDate})`
                              : "Belum dijadwalkan"}
                          </strong>
                        </div>
                        <div className="rounded-xl bg-slate-50 p-3">
                          <span className="text-slate-400 block">Biaya & Margin Penempatan</span>
                          <strong className="text-teal-700 mt-0.5 block">
                            {perms.canSeeFinance
                              ? `${formatRupiah(selectedCandidate.placementFee)} (Margin ${formatRupiah(
                                  selectedCandidate.placementFee - selectedCandidate.costIncurred
                                )})`
                              : "Hanya Direktur & Keuangan"}
                          </strong>
                        </div>
                      </div>

                      {!selectedCandidate.nik && (
                        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3.5">
                          <div className="text-xs text-amber-900">
                            <strong>Kandidat masih pada tahap Lead tanpa NIK.</strong> Masukkan 16 digit NIK untuk memvalidasi keunikan berkas sebelum naik ke tahap Prospect.
                          </div>
                          <form
                            onSubmit={async (e) => {
                              e.preventDefault();
                              const formData = new FormData(e.currentTarget);
                              const nikVal = String(formData.get("nikInput") || "").trim();
                              const { data } = await callApi("UPDATE_CANDIDATE", {
                                candidateId: selectedCandidate.id,
                                updates: { nik: nikVal },
                              });
                              if (!data.ok) {
                                setToast({
                                  type: "error",
                                  title: "Gagal Menyimpan NIK",
                                  details: [data.error],
                                });
                              } else {
                                setToast({
                                  type: "success",
                                  title: "NIK 16 Digit Tervalidasi Unik & Disimpan",
                                });
                              }
                            }}
                            className="flex items-center gap-2"
                          >
                            <input
                              name="nikInput"
                              type="text"
                              maxLength={16}
                              placeholder="Masukkan 16 digit NIK..."
                              className="rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-xs font-mono"
                            />
                            <button
                              type="submit"
                              className="rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-700"
                            >
                              Simpan NIK
                            </button>
                          </form>
                        </div>
                      )}
                    </div>

                    {/* JOURNEY ENGINE INTERAKTIF */}
                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                        <div>
                          <span className="text-[11px] font-bold uppercase tracking-wider text-sky-600">
                            Journey Gatekeeper · Validasi Otomatis
                          </span>
                          <h3 className="text-base font-bold text-slate-900">
                            Tahapan Penempatan CPMI (Klik Tahap untuk Pindah / Uji Validasi)
                          </h3>
                        </div>
                        <button
                          onClick={() => {
                            setPortalCandidateId(selectedCandidate.id);
                            setPortalNikInput(selectedCandidate.nik || selectedCandidate.regNumber);
                            setActiveNav("portal_cpmi");
                          }}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-teal-200 bg-teal-50 px-3 py-1.5 text-xs font-semibold text-teal-800 hover:bg-teal-100"
                        >
                          <Smartphone className="h-3.5 w-3.5" />
                          Lihat di Portal Mandiri CPMI
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-8">
                        {JOURNEY_STAGES.map((st, idx) => {
                          const currentIdx = JOURNEY_STAGES.findIndex(
                            (s) => s.key === selectedCandidate.stage
                          );
                          const isCurrent = st.key === selectedCandidate.stage;
                          const isPassed = idx < currentIdx;

                          return (
                            <button
                              key={st.key}
                              onClick={() => handleStageChange(selectedCandidate, st.key)}
                              className={`flex flex-col justify-between rounded-xl border p-2.5 text-left transition ${
                                isCurrent
                                  ? "border-sky-600 bg-sky-600 text-white shadow-sm"
                                  : isPassed
                                  ? "border-teal-200 bg-teal-50/70 text-teal-900 hover:border-teal-400"
                                  : "border-slate-200 bg-slate-50 text-slate-700 hover:border-sky-300 hover:bg-white"
                              }`}
                            >
                              <div className="flex items-center justify-between text-[10px] font-bold">
                                <span>0{idx + 1}</span>
                                {isPassed && <CheckCircle2 className="h-3.5 w-3.5 text-teal-600" />}
                                {isCurrent && <span className="rounded bg-white/20 px-1">Aktif</span>}
                              </div>
                              <p className="mt-1.5 text-xs font-bold">{st.label}</p>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* DAFTAR 10 DOKUMEN WAJIB & SENSITIF */}
                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <h3 className="text-base font-bold text-slate-900">
                            Kelengkapan Berkas Digital, Masa Berlaku & Verifikasi AI
                          </h3>
                          <p className="text-xs text-slate-500">
                            Dokumen bertanda <strong className="text-rose-600">Sensitif (UU PDP)</strong>{" "}
                            mencatat nama pembuka ke Jejak Audit setiap kali dilihat.
                          </p>
                        </div>
                      </div>

                      <div className="space-y-3">
                        {selectedCandidate.documents.map((doc) => {
                          const daysLeft = calcDaysLeft(doc.expiryDate);
                          const tpl = DOC_TEMPLATE_CONFIG.find((t) => t.docType === doc.docType);
                          const isExpired =
                            doc.status === "EXPIRED" || (daysLeft !== null && daysLeft < 0);
                          const isCritical =
                            daysLeft !== null && daysLeft >= 0 && daysLeft <= 30;
                          const isRevealed = revealedSensitiveDocs[doc.id];

                          return (
                            <div
                              key={doc.id}
                              className={`rounded-xl border p-4 transition ${
                                isExpired
                                  ? "border-rose-300 bg-rose-50/60"
                                  : doc.status === "VERIFIED"
                                  ? "border-slate-200 bg-white"
                                  : doc.status === "UPLOADED"
                                  ? "border-sky-200 bg-sky-50/30"
                                  : "border-slate-200 bg-slate-50/60"
                              }`}
                            >
                              <div className="flex flex-wrap items-start justify-between gap-3">
                                <div className="space-y-1">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className="text-sm font-bold text-slate-900">
                                      {doc.title}
                                    </span>

                                    <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                                      Syarat Tahap: {doc.requiredAtStage}
                                    </span>

                                    {doc.isSensitive && (
                                      <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-semibold text-rose-700 border border-rose-200">
                                        <Lock className="h-2.5 w-2.5" /> Sensitif (UU PDP)
                                      </span>
                                    )}

                                    <span
                                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                                        isExpired
                                          ? "bg-rose-600 text-white"
                                          : doc.status === "VERIFIED"
                                          ? "bg-teal-100 text-teal-800"
                                          : doc.status === "UPLOADED"
                                          ? "bg-sky-100 text-sky-800"
                                          : "bg-slate-200 text-slate-600"
                                      }`}
                                    >
                                      {isExpired ? "EXPIRED (Berhenti Dihitung Lengkap)" : doc.status}
                                    </span>

                                    {doc.docType === "MEDICAL" && doc.medicalResult && (
                                      <span
                                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                          doc.medicalResult === "FIT"
                                            ? "bg-emerald-600 text-white"
                                            : "bg-rose-600 text-white"
                                        }`}
                                      >
                                        Hasil MCU: {doc.medicalResult}
                                      </span>
                                    )}
                                  </div>

                                  <p className="text-xs text-slate-500">{tpl?.description}</p>

                                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-700">
                                    <span>
                                      <strong>Nomor Berkas:</strong>{" "}
                                      {doc.docNumber ? (
                                        doc.isSensitive && !isRevealed ? (
                                          <span className="font-mono text-slate-400">
                                            •••••••••••• (Tersamar)
                                          </span>
                                        ) : (
                                          <span className="font-mono font-semibold text-slate-900">
                                            {doc.docNumber}
                                          </span>
                                        )
                                      ) : (
                                        <span className="text-slate-400">Belum diisi</span>
                                      )}
                                    </span>

                                    {doc.issuedBy && (
                                      <span>
                                        <strong>Penerbit/Klinik:</strong> {doc.issuedBy}
                                      </span>
                                    )}

                                    {tpl?.hasExpiry && (
                                      <span>
                                        <strong>Masa Berlaku:</strong>{" "}
                                        {doc.expiryDate ? (
                                          <span
                                            className={`font-semibold ${
                                              isExpired
                                                ? "text-rose-600"
                                                : isCritical
                                                ? "text-amber-600"
                                                : "text-teal-700"
                                            }`}
                                          >
                                            {doc.expiryDate}{" "}
                                            {daysLeft !== null &&
                                              (daysLeft < 0
                                                ? `(Lewat ${Math.abs(daysLeft)} hari)`
                                                : `(${daysLeft} hari lagi)`)}
                                          </span>
                                        ) : (
                                          <span className="text-amber-600 font-medium">
                                            Tanggal belum diisi (Pengingat belum aktif)
                                          </span>
                                        )}
                                      </span>
                                    )}
                                  </div>

                                  {doc.aiCheckNotes && (
                                    <div
                                      className={`mt-2 flex items-start gap-2 rounded-lg p-2 text-[11px] ${
                                        doc.aiCheckStatus === "MATCH"
                                          ? "bg-teal-50 text-teal-900 border border-teal-200"
                                          : "bg-amber-50 text-amber-900 border border-amber-200"
                                      }`}
                                    >
                                      <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-sky-600" />
                                      <span>
                                        <strong>Periksa Awal AI:</strong> {doc.aiCheckNotes}
                                      </span>
                                    </div>
                                  )}
                                </div>

                                <div className="flex flex-wrap items-center gap-2">
                                  <button
                                    onClick={() =>
                                      handleOpenPhysicalDoc(selectedCandidate, doc)
                                    }
                                    className="inline-flex items-center gap-1.5 rounded-lg border border-teal-300 bg-teal-50 px-3 py-1.5 text-[11px] font-bold text-teal-800 shadow-xs hover:bg-teal-100"
                                  >
                                    <Eye className="h-3.5 w-3.5 text-teal-700" />
                                    {doc.fileDataUrl
                                      ? "Lihat Scan Asli"
                                      : doc.status === "MISSING"
                                      ? "Pratinjau / Upload Fisik"
                                      : "Lihat Fisik / Scan"}
                                  </button>

                                  {doc.isSensitive && doc.docNumber && (
                                    <button
                                      onClick={() =>
                                        handleRevealSensitive(selectedCandidate, doc)
                                      }
                                      className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-rose-700 hover:bg-rose-50"
                                    >
                                      <Lock className="h-3 w-3" />
                                      {isRevealed ? "Sembunyikan No" : "Buka No Sensitif"}
                                    </button>
                                  )}

                                  <button
                                    onClick={() => handleRunAiCheck(selectedCandidate, doc)}
                                    className="inline-flex items-center gap-1 rounded-lg border border-sky-200 bg-sky-50 px-2.5 py-1.5 text-[11px] font-semibold text-sky-700 hover:bg-sky-100"
                                  >
                                    <Sparkles className="h-3.5 w-3.5" />
                                    Cek AI
                                  </button>

                                  <button
                                    onClick={() => {
                                      setEditingDoc({ candidate: selectedCandidate, doc });
                                      setDocForm({
                                        status:
                                          doc.status === "MISSING" ? "VERIFIED" : doc.status,
                                        docNumber: doc.docNumber || "",
                                        issuedBy: doc.issuedBy || "",
                                        issueDate: doc.issueDate || "",
                                        expiryDate: doc.expiryDate || "",
                                        medicalResult: doc.medicalResult || "FIT",
                                        notes: doc.notes || "",
                                        fileDataUrl: doc.fileDataUrl || "",
                                        fileName: doc.fileName || "",
                                      });
                                    }}
                                    className="inline-flex items-center gap-1 rounded-lg bg-slate-900 px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-slate-800"
                                  >
                                    <FileCheck2 className="h-3.5 w-3.5" />
                                    {isExpired
                                      ? "Perpanjang / Update"
                                      : doc.status === "MISSING"
                                      ? "Unggah / Isi"
                                      : "Edit / Verifikasi"}
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
            </div>
          )}

          {/* =========================================================
              TAB 3: PENGINGAT DOKUMEN KEDALUWARSA & TUGAS PERPANJANGAN
             ========================================================= */}
          {activeNav === "pengingat" && (
            <div className="space-y-6">
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                  <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                    <p className="text-xs font-bold uppercase tracking-wider text-sky-700">
                      1. Peringatan Bertingkat (30, 14, 7 Hari)
                    </p>
                    <p className="mt-1.5 text-xs leading-relaxed text-slate-600">
                      Peringatan 30 hari memulai proses perpanjangan paspor/medical, sedangkan peringatan 7 hari menentukan keberangkatan batal atau tidak.
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                    <p className="text-xs font-bold uppercase tracking-wider text-teal-700">
                      2. Dikirim Sekali per Ambang, Bukan Tiap Malam
                    </p>
                    <p className="mt-1.5 text-xs leading-relaxed text-slate-600">
                      Sistem mencatat ambang peringatan yang sudah dikirim dan langsung membuat <strong>Tugas Perpanjangan</strong> agar staf tidak kebal terhadap spam notifikasi.
                    </p>
                  </div>
                  <div className="rounded-xl border border-rose-100 bg-rose-50/50 p-4">
                    <p className="text-xs font-bold uppercase tracking-wider text-rose-700">
                      3. Dokumen Habis Berhenti Dihitung Lengkap
                    </p>
                    <p className="mt-1.5 text-xs leading-relaxed text-slate-600">
                      Saat masa berlaku lewat, status dokumen otomatis menjadi <strong>EXPIRED</strong> dan menghentikan kenaikan kandidat ke tahap berikutnya.
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h2 className="text-base font-bold text-slate-900">
                      Daftar Tugas Perpanjangan Dokumen (Paspor, Medical, Visa)
                    </h2>
                    <p className="text-xs text-slate-500">
                      Jatuh tempo tugas sama dengan tanggal kedaluwarsa dokumen terkait.
                    </p>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 text-[11px] font-bold uppercase text-slate-500">
                        <th className="py-3 px-3">Ambang Peringatan</th>
                        <th className="py-3 px-3">Nama CPMI/PMI</th>
                        <th className="py-3 px-3">Dokumen & Nomor</th>
                        <th className="py-3 px-3">Tanggal Habis Berlaku</th>
                        <th className="py-3 px-3">Sisa Hari</th>
                        <th className="py-3 px-3">Status Tugas</th>
                        <th className="py-3 px-3 text-right">Tindakan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {db.renewalTasks.map((task) => {
                        const isExpired = task.daysLeft < 0;
                        return (
                          <tr key={task.id} className="hover:bg-slate-50">
                            <td className="py-3.5 px-3">
                              <span
                                className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${
                                  task.tierLabel === "EXPIRED"
                                    ? "bg-rose-600 text-white"
                                    : task.tierLabel === "7_HARI"
                                    ? "bg-amber-500 text-white"
                                    : task.tierLabel === "14_HARI"
                                    ? "bg-amber-100 text-amber-900"
                                    : "bg-sky-100 text-sky-900"
                                }`}
                              >
                                {task.tierLabel === "EXPIRED"
                                  ? "KEDALUWARSA (EXPIRED)"
                                  : `Tier <= ${task.tierLabel.replace("_", " ")}`}
                              </span>
                            </td>
                            <td className="py-3.5 px-3 font-bold text-slate-900">
                              {task.candidateName}
                            </td>
                            <td className="py-3.5 px-3">
                              <p className="font-semibold text-slate-800">{task.docTitle}</p>
                              <p className="text-[11px] font-mono text-slate-500">
                                No: {task.docNumber || "-"}
                              </p>
                            </td>
                            <td className="py-3.5 px-3 font-mono font-semibold text-slate-800">
                              {task.dueDate}
                            </td>
                            <td className="py-3.5 px-3">
                              <span
                                className={`font-bold ${
                                  isExpired ? "text-rose-600" : "text-amber-700"
                                }`}
                              >
                                {isExpired
                                  ? `Lewat ${Math.abs(task.daysLeft)} hari`
                                  : `${task.daysLeft} hari lagi`}
                              </span>
                            </td>
                            <td className="py-3.5 px-3">
                              <span
                                className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${
                                  task.status === "COMPLETED"
                                    ? "bg-teal-100 text-teal-800"
                                    : "bg-rose-100 text-rose-800"
                                }`}
                              >
                                {task.status === "COMPLETED" ? "SELESAI DIPERPANJANG" : "WAJIB TINDAKAN"}
                              </span>
                            </td>
                            <td className="py-3.5 px-3 text-right">
                              <div className="flex justify-end gap-2">
                                <button
                                  onClick={() => {
                                    setRenewingTask(task);
                                    setRenewNewExpiry("2027-01-20");
                                  }}
                                  className="rounded-lg bg-slate-900 px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-slate-800"
                                >
                                  Perpanjang Dokumen
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedCandidateId(task.candidateId);
                                    setActiveNav("cpmi");
                                  }}
                                  className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-slate-700 hover:bg-slate-50"
                                >
                                  Lihat CPMI
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* =========================================================
              TAB 4: CASE MANAGEMENT / PENANGANAN KASUS & PENGADUAN PMI
             ========================================================= */}
          {activeNav === "cases" && (
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
              {/* Daftar Tiket Kasus di Kiri */}
              <div className="space-y-4 xl:col-span-5">
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <select
                    value={caseStatusFilter}
                    onChange={(e) => setCaseStatusFilter(e.target.value)}
                    className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-800"
                  >
                    <option value="ALL">Semua Status Kasus ({db.cases?.length || 0})</option>
                    <option value="OPEN">OPEN (Baru Masuk)</option>
                    <option value="IN_PROGRESS">IN PROGRESS (Sedang Ditangani)</option>
                    <option value="ESCALATED">ESCALATED (Eskalasi KJRI/KDEI/Mitra)</option>
                    <option value="RESOLVED">RESOLVED (Selesai)</option>
                  </select>

                  <button
                    onClick={() => setShowNewCaseModal(true)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-rose-700"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Buat Tiket Kasus
                  </button>
                </div>

                <div className="space-y-3">
                  {filteredCases.map((cs) => {
                    const isSelected = selectedCase?.id === cs.id;
                    const slaDays = calcDaysLeft(cs.targetResolutionDate);
                    const isOverdue =
                      cs.status !== "RESOLVED" && slaDays !== null && slaDays < 0;

                    return (
                      <button
                        key={cs.id}
                        onClick={() => setSelectedCaseId(cs.id)}
                        className={`w-full rounded-2xl border p-4 text-left transition ${
                          isSelected
                            ? "border-rose-500 bg-rose-50/40 ring-2 ring-rose-500/20 shadow-sm"
                            : "border-slate-200 bg-white hover:border-slate-300"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono text-xs font-bold text-slate-500">
                            {cs.ticketNumber}
                          </span>
                          <div className="flex items-center gap-1.5">
                            {isOverdue && (
                              <span className="rounded bg-rose-600 px-2 py-0.5 text-[10px] font-bold text-white">
                                Lewat Target {Math.abs(slaDays!)} Hari
                              </span>
                            )}
                            <span
                              className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                                cs.priority === "CRITICAL"
                                  ? "bg-rose-600 text-white"
                                  : cs.priority === "HIGH"
                                  ? "bg-amber-500 text-white"
                                  : "bg-slate-200 text-slate-700"
                              }`}
                            >
                              {cs.priority}
                            </span>
                            <span
                              className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                                cs.status === "RESOLVED"
                                  ? "bg-teal-100 text-teal-800"
                                  : cs.status === "ESCALATED"
                                  ? "bg-purple-100 text-purple-800"
                                  : "bg-amber-100 text-amber-900"
                              }`}
                            >
                              {cs.status}
                            </span>
                          </div>
                        </div>

                        <p className="mt-2 text-sm font-bold text-slate-900">{cs.title}</p>
                        <p className="mt-1 text-xs text-slate-600">
                          PMI: <strong>{cs.candidateName}</strong> · Negara:{" "}
                          <strong>{cs.destinationCountry}</strong>
                        </p>
                        <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2 text-[11px] text-slate-500">
                          <span>PIC: {cs.picName}</span>
                          <span>Target SLA: {cs.targetResolutionDate}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Detail Kasus & Timeline Penanganan di Kanan */}
              <div className="xl:col-span-7">
                {selectedCase ? (
                  <div className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="border-b border-slate-100 pb-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="rounded bg-slate-900 px-2.5 py-1 font-mono text-xs font-bold text-white">
                            {selectedCase.ticketNumber}
                          </span>
                          <span className="rounded-full bg-rose-100 px-3 py-0.5 text-xs font-bold text-rose-800">
                            Kategori: {selectedCase.category.replace("_", " ")}
                          </span>
                        </div>
                        <button
                          onClick={() => {
                            setSelectedCandidateId(selectedCase.candidateId);
                            setActiveNav("cpmi");
                          }}
                          className="text-xs font-semibold text-sky-600 hover:underline"
                        >
                          Buka Berkas Lengkap {selectedCase.candidateName} →
                        </button>
                      </div>

                      <h2 className="mt-3 text-lg font-bold text-slate-900">
                        {selectedCase.title}
                      </h2>
                      <p className="mt-1.5 text-xs leading-relaxed text-slate-600">
                        {selectedCase.description}
                      </p>

                      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 text-xs">
                        <div className="rounded-xl bg-slate-50 p-3">
                          <span className="text-slate-400 block">Nama PMI & Negara</span>
                          <strong className="text-slate-900 mt-0.5 block">
                            {selectedCase.candidateName} ({selectedCase.destinationCountry})
                          </strong>
                        </div>
                        <div className="rounded-xl bg-slate-50 p-3">
                          <span className="text-slate-400 block">Majikan Luar Negeri</span>
                          <strong className="text-slate-900 mt-0.5 block">
                            {selectedCase.employerName || "-"}
                          </strong>
                        </div>
                        <div className="rounded-xl bg-slate-50 p-3">
                          <span className="text-slate-400 block">Penanggung Jawab (PIC)</span>
                          <strong className="text-slate-900 mt-0.5 block">
                            {selectedCase.picName}
                          </strong>
                        </div>
                        <div className="rounded-xl bg-rose-50/70 p-3">
                          <span className="text-rose-600 block">Instansi Eskalasi</span>
                          <strong className="text-rose-900 mt-0.5 block">
                            {selectedCase.escalatedTo || "Internal P3MI"}
                          </strong>
                        </div>
                      </div>
                    </div>

                    {/* Timeline Jejak Penanganan Kasus */}
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">
                        Jejak Kronologi & Tindak Lanjut Penanganan Kasus
                      </h3>
                      <div className="mt-3 space-y-3 border-l-2 border-sky-200 pl-4">
                        {selectedCase.timeline.map((item) => (
                          <div
                            key={item.id}
                            className="rounded-xl border border-slate-100 bg-slate-50 p-3.5 text-xs"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-slate-900">
                                {item.authorName}{" "}
                                <span className="font-normal text-slate-500">
                                  ({item.authorRole})
                                </span>
                              </span>
                              <span className="font-mono text-[11px] text-slate-400">
                                {item.createdAt}
                              </span>
                            </div>
                            <p className="mt-1.5 text-slate-700 leading-relaxed">{item.note}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Form Tambah Tindak Lanjut / Eskalasi / Selesaikan Kasus */}
                    <form
                      onSubmit={handleAddCaseNote}
                      className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3 text-xs"
                    >
                      <p className="font-bold text-slate-900 flex items-center gap-1.5">
                        <MessageSquarePlus className="h-4 w-4 text-sky-600" />
                        Catat Tindak Lanjut / Update Status / Eskalasi Kasus
                      </p>
                      <textarea
                        rows={3}
                        required
                        value={newCaseNoteText}
                        onChange={(e) => setNewCaseNoteText(e.target.value)}
                        placeholder="Tuliskan hasil komunikasi dengan majikan, agensi mitra, atau KJRI/KDEI..."
                        className="w-full rounded-lg border border-slate-300 bg-white p-2.5 text-xs"
                      />
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div>
                          <label className="font-semibold text-slate-700 block mb-1">
                            Ubah Status Kasus (Opsional)
                          </label>
                          <select
                            value={newCaseStatusUpdate}
                            onChange={(e) =>
                              setNewCaseStatusUpdate(e.target.value as CaseStatus | "")
                            }
                            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2"
                          >
                            <option value="">Tetap ({selectedCase.status})</option>
                            <option value="IN_PROGRESS">IN_PROGRESS (Sedang Ditangani)</option>
                            <option value="ESCALATED">ESCALATED (Dieskalasikan ke Perwakilan RI)</option>
                            <option value="RESOLVED">RESOLVED (Kasus Selesai / Tuntas)</option>
                          </select>
                        </div>
                        <div>
                          <label className="font-semibold text-slate-700 block mb-1">
                            Eskalasi ke Instansi / Agensi Mitra
                          </label>
                          <input
                            type="text"
                            value={newCaseEscalationUpdate}
                            onChange={(e) => setNewCaseEscalationUpdate(e.target.value)}
                            placeholder="Misal: KDEI Taipei / KJRI Hong Kong / BP2MI"
                            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2"
                          />
                        </div>
                      </div>
                      <div className="flex justify-end">
                        <button
                          type="submit"
                          className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2 font-semibold text-white hover:bg-slate-800"
                        >
                          <Send className="h-3.5 w-3.5" />
                          Simpan Tindak Lanjut
                        </button>
                      </div>
                    </form>
                  </div>
                ) : null}
              </div>
            </div>
          )}

          {/* =========================================================
              TAB 5: VACANCY / PUBLIKASI LOWONGAN & AKUISISI LEAD
             ========================================================= */}
          {activeNav === "vacancy" && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-sky-600">
                    Rantai Penempatan Terhubung · Asia Pasifik & Timur Tengah
                  </span>
                  <h2 className="text-base font-bold text-slate-900">
                    Publikasi Job Order / Lowongan Luar Negeri & Pendaftaran Lead Otomatis
                  </h2>
                  <p className="text-xs text-slate-500">
                    Mendukung penuh <strong>Skema Timur Tengah (Arab Saudi SPSK/Musaned, UAE Tadbeer/MOHRE, Kuwait, Oman, Yordania QIZ)</strong> dan <strong>Asia Pasifik (Taiwan, Jepang SSW, Hong Kong, Singapura)</strong>.
                  </p>
                </div>

                <button
                  onClick={() => setShowNewVacancyModal(true)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white hover:bg-slate-800"
                >
                  <Plus className="h-4 w-4 text-sky-400" />
                  + Buat Job Order / Lowongan Baru
                </button>
              </div>

              {/* Panel Informasi Skema Penempatan Timur Tengah */}
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-5 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="rounded-full bg-emerald-600 px-2.5 py-0.5 text-[10px] font-bold uppercase text-white">
                      Skema Resmi Timur Tengah (100% Zero Cost / Full Employer Paid)
                    </span>
                    <h3 className="mt-1.5 text-sm font-bold text-slate-900">
                      Standar Regulasi Penempatan Timur Tengah: Arab Saudi, UAE, Kuwait, Oman & Yordania
                    </h3>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5 text-xs">
                  <div className="rounded-xl border border-emerald-200 bg-white p-3">
                    <p className="font-bold text-slate-900">🇸🇦 Arab Saudi (SPSK)</p>
                    <p className="mt-1 text-[11px] text-slate-600">
                      Sistem Penempatan Satu Kanal (SISKOP2MI–Musaned). Pemberi kerja wajib Badan Usaha (<strong>Syarikah</strong>), Medical Wafid & Biometrik Tasheer.
                    </p>
                  </div>
                  <div className="rounded-xl border border-emerald-200 bg-white p-3">
                    <p className="font-bold text-slate-900">🇦🇪 UAE (Dubai/Abu Dhabi)</p>
                    <p className="mt-1 text-[11px] text-slate-600">
                      Skema <strong>Tadbeer Center & MOHRE</strong> sektor Hospitality/Housekeeping. Medical Wafid (GAMCA) & e-Visa Kerja Dubai.
                    </p>
                  </div>
                  <div className="rounded-xl border border-emerald-200 bg-white p-3">
                    <p className="font-bold text-slate-900">🇰🇼 Kuwait (Formal)</p>
                    <p className="mt-1 text-[11px] text-slate-600">
                      Penempatan sektor formal berbadan hukum (Spa Therapist, Salon, Hospitality, Klinik). Wajib Medical Wafid & SKCK Mabes Polri.
                    </p>
                  </div>
                  <div className="rounded-xl border border-emerald-200 bg-white p-3">
                    <p className="font-bold text-slate-900">🇴🇲 Oman (Muscat)</p>
                    <p className="mt-1 text-[11px] text-slate-600">
                      Sektor Perhotelan Bintang 5, Restoran & Caregiver Formal dengan perlindungan kontrak KBRI Muscat & Medical Wafid.
                    </p>
                  </div>
                  <div className="rounded-xl border border-emerald-200 bg-white p-3">
                    <p className="font-bold text-slate-900">🇯🇴 Yordania (Jordan)</p>
                    <p className="mt-1 text-[11px] text-slate-600">
                      Operator Garment Ekspor di <strong>Kawasan Industri QIZ (Amman/Irbid)</strong> & Hospitality dengan fasilitas asrama penuh.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {db.vacancies?.map((vac) => {
                  const pct = Math.min(
                    100,
                    Math.round((vac.quotaFilled / Math.max(1, vac.quotaTotal)) * 100)
                  );
                  return (
                    <div
                      key={vac.id}
                      className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
                    >
                      <div>
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="rounded bg-sky-100 px-2.5 py-0.5 font-mono text-xs font-bold text-sky-800">
                              {vac.code}
                            </span>
                            <span className="rounded-full bg-slate-900 px-3 py-0.5 text-xs font-bold text-white">
                              🌏 {vac.destinationCountry}
                            </span>
                            {[
                              "Arab Saudi",
                              "Uni Emirat Arab (UAE)",
                              "Kuwait",
                              "Oman",
                              "Yordania",
                            ].includes(vac.destinationCountry) && (
                              <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800 border border-emerald-300">
                                Skema Timur Tengah · Zero Cost
                              </span>
                            )}
                          </div>

                          <button
                            onClick={() =>
                              callApi("TOGGLE_VACANCY_PUBLISH", { vacancyId: vac.id })
                            }
                            className={`rounded-full px-3 py-1 text-[11px] font-bold transition ${
                              vac.isPublished
                                ? "bg-teal-100 text-teal-800 hover:bg-teal-200"
                                : "bg-slate-200 text-slate-600 hover:bg-slate-300"
                            }`}
                          >
                            {vac.isPublished ? "● Tayang di Kanal Publik" : "○ Draft / Ditutup"}
                          </button>
                        </div>

                        <h3 className="mt-3 text-base font-bold text-slate-900">{vac.title}</h3>
                        <p className="mt-1 text-xs text-slate-500">
                          Agensi Mitra: <strong>{vac.agencyPartner}</strong> · Pemberi Kerja:{" "}
                          {vac.employerName}
                        </p>

                        <div className="mt-4 grid grid-cols-3 gap-2 rounded-xl bg-slate-50 p-3 text-xs">
                          <div>
                            <span className="text-slate-400 block text-[11px]">Gaji Kontrak</span>
                            <strong className="text-teal-700">{vac.salaryForeign}</strong>
                            <span className="block text-[10px] text-slate-500">
                              ± {formatRupiah(vac.salaryIdrEstimate)}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[11px]">Syarat Usia & Pend</span>
                            <strong className="text-slate-800">{vac.ageRange}</strong>
                            <span className="block text-[10px] text-slate-500">
                              Min. {vac.minEducation} ({vac.genderPref})
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[11px]">Batas Lamaran</span>
                            <strong className="text-slate-800">{vac.closingDate}</strong>
                          </div>
                        </div>

                        {/* Progress Kuota Job Order */}
                        <div className="mt-4">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-slate-700">
                              Kuota Terisi: {vac.quotaFilled} dari {vac.quotaTotal} orang
                            </span>
                            <span className="font-bold text-sky-600">{pct}%</span>
                          </div>
                          <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                            <div
                              className="h-full rounded-full bg-sky-500 transition-all"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>

                        <ul className="mt-4 space-y-1 text-xs text-slate-600">
                          {vac.requirements.map((req, i) => (
                            <li key={i} className="flex items-center gap-2">
                              <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-teal-600" />
                              {req}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-4">
                        <span className="text-[11px] text-slate-400">
                          Pelamar otomatis tercatat di Journey Engine
                        </span>
                        <button
                          onClick={() => {
                            setApplyingVacancy(vac);
                            setApplyForm({
                              fullName: "",
                              phone: "",
                              nik: "",
                              gender: vac.genderPref === "L" ? "L" : "P",
                              branchId: "br-idm",
                            });
                          }}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-sky-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-sky-700"
                        >
                          <UserPlus className="h-3.5 w-3.5" />
                          Simulasikan Pelamar Melamar Lowongan Ini
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* =========================================================
              TAB 6: PORTAL MANDIRI CPMI / PMI (SELF-SERVICE PORTAL)
             ========================================================= */}
          {activeNav === "portal_cpmi" && (
            <div className="mx-auto max-w-5xl space-y-6">
              {/* Bar Simulasi Login NIK CPMI */}
              <div className="rounded-2xl border border-teal-200 bg-gradient-to-r from-slate-900 to-slate-800 p-6 text-white shadow-md">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <span className="rounded-full bg-teal-500/20 px-3 py-1 text-[11px] font-bold text-teal-300 border border-teal-400/30">
                      Portal Mandiri CPMI / PMI · Transparansi Tanpa Perlu Telepon Kantor
                    </span>
                    <h2 className="mt-2 text-xl font-bold">
                      Pantau Status Penempatan, Dokumen & Pengaduan Mandiri
                    </h2>
                    <p className="mt-1 text-xs text-slate-300">
                      CPMI/PMI cukup login menggunakan 16 digit NIK & PIN untuk melihat progres tahapan secara real-time.
                    </p>
                  </div>

                  <form onSubmit={handlePortalLogin} className="flex flex-wrap items-center gap-2">
                    <input
                      type="text"
                      value={portalNikInput}
                      onChange={(e) => setPortalNikInput(e.target.value)}
                      placeholder="Masukkan 16 digit NIK..."
                      className="rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-xs font-mono text-white placeholder:text-slate-400"
                    />
                    <input
                      type="text"
                      value={portalPinInput}
                      onChange={(e) => setPortalPinInput(e.target.value)}
                      placeholder="PIN (6 digit)"
                      className="w-24 rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-xs font-mono text-white placeholder:text-slate-400"
                    />
                    <button
                      type="submit"
                      className="rounded-lg bg-teal-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-teal-400"
                    >
                      Cek Berkas Saya
                    </button>
                  </form>
                </div>

                {/* Pilihan Cepat Contoh Akun CPMI/PMI untuk Demo */}
                <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-white/10 pt-3 text-xs">
                  <span className="text-slate-400">Pilih Cepat Akun Demo CPMI/PMI:</span>
                  {db.candidates.slice(0, 5).map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        setPortalCandidateId(c.id);
                        setPortalNikInput(c.nik || c.regNumber);
                        setPortalPinInput(c.portalPin || "123456");
                      }}
                      className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition ${
                        portalCandidate?.id === c.id
                          ? "bg-teal-500 text-slate-950"
                          : "bg-white/10 text-slate-200 hover:bg-white/20"
                      }`}
                    >
                      {c.fullName} ({c.stage})
                    </button>
                  ))}
                </div>
              </div>

              {portalCandidate && (
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                  {/* Progres Tahapan & Checklist Dokumen CPMI */}
                  <div className="space-y-6 lg:col-span-2">
                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-4">
                        <div>
                          <p className="text-xs font-mono text-slate-500">
                            {portalCandidate.regNumber} · NIK:{" "}
                            {portalCandidate.nik || "Belum dilengkapi"}
                          </p>
                          <h3 className="text-lg font-bold text-slate-900">
                            {portalCandidate.fullName}
                          </h3>
                          <p className="text-xs text-slate-600">
                            Negara Tujuan: <strong>{portalCandidate.destinationCountry}</strong> ·{" "}
                            {portalCandidate.jobSector}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] font-bold uppercase text-slate-400 block">
                            Tahap Saat Ini
                          </span>
                          <span className="mt-1 inline-block rounded-full bg-teal-600 px-3.5 py-1 text-xs font-bold text-white">
                            {portalCandidate.stage}
                          </span>
                        </div>
                      </div>

                      {/* Stepper Progres untuk CPMI */}
                      <div className="mt-4 grid grid-cols-4 gap-2 sm:grid-cols-8">
                        {JOURNEY_STAGES.map((st, idx) => {
                          const curIdx = JOURNEY_STAGES.findIndex(
                            (s) => s.key === portalCandidate.stage
                          );
                          const done = idx <= curIdx;
                          return (
                            <div
                              key={st.key}
                              className={`rounded-xl border p-2 text-center ${
                                idx === curIdx
                                  ? "border-teal-600 bg-teal-50 font-bold text-teal-900"
                                  : done
                                  ? "border-teal-200 bg-teal-50/40 text-teal-700"
                                  : "border-slate-100 bg-slate-50 text-slate-400"
                              }`}
                            >
                              <p className="text-[10px]">0{idx + 1}</p>
                              <p className="text-[11px] font-semibold truncate">{st.label}</p>
                            </div>
                          );
                        })}
                      </div>

                      {/* Checklist Dokumen dari Sudut Pandang CPMI */}
                      <h4 className="mt-6 mb-3 text-sm font-bold text-slate-900">
                        Status Kelengkapan Dokumen Anda
                      </h4>
                      <div className="space-y-2">
                        {portalCandidate.documents.map((d) => {
                          const dl = calcDaysLeft(d.expiryDate);
                          const isExp = d.status === "EXPIRED" || (dl !== null && dl < 0);
                          return (
                            <div
                              key={d.id}
                              className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-3.5 py-2.5 text-xs"
                            >
                              <div>
                                <p className="font-semibold text-slate-800">{d.title}</p>
                                {d.expiryDate && (
                                  <p className="text-[11px] text-slate-500">
                                    Berlaku s/d: {d.expiryDate}
                                  </p>
                                )}
                              </div>
                              <span
                                className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                                  isExp
                                    ? "bg-rose-600 text-white"
                                    : d.status === "VERIFIED"
                                    ? "bg-teal-100 text-teal-800"
                                    : d.status === "UPLOADED"
                                    ? "bg-sky-100 text-sky-800"
                                    : "bg-slate-200 text-slate-600"
                                }`}
                              >
                                {isExp
                                  ? "Kedaluwarsa (Harap Perbarui)"
                                  : d.status === "VERIFIED"
                                  ? "✓ Lengkap & Terverifikasi"
                                  : d.status === "UPLOADED"
                                  ? "Sedang Diperiksa Admin"
                                  : "Belum Diunggah"}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Kolom Kanan Portal: Form Pengaduan / Bantuan Darurat PMI */}
                  <div className="space-y-6">
                    <div className="rounded-2xl border border-rose-200 bg-white p-6 shadow-sm">
                      <div className="flex items-center gap-2 text-rose-600">
                        <LifeBuoy className="h-5 w-5" />
                        <h3 className="text-sm font-bold text-slate-900">
                          Layanan Pengaduan & Bantuan PMI
                        </h3>
                      </div>
                      <p className="mt-1.5 text-xs leading-relaxed text-slate-500">
                        Mengalami kendala di tempat kerja, gaji terlambat, atau butuh pendampingan? Kirim laporan resmi langsung ke Command Center P3MI.
                      </p>

                      <form onSubmit={handlePortalSubmitComplaint} className="mt-4 space-y-3 text-xs">
                        <div>
                          <label className="font-bold text-slate-700 block mb-1">
                            Kategori Kendala
                          </label>
                          <select
                            value={portalComplaintCategory}
                            onChange={(e) =>
                              setPortalComplaintCategory(e.target.value as CaseCategory)
                            }
                            className="w-full rounded-lg border border-slate-300 px-3 py-2"
                          >
                            <option value="GAJI_TERLAMBAT">Gaji Terlambat / Tidak Sesuai</option>
                            <option value="MAJIKAN_PEKERJAAN">Kendala Majikan / Jam Kerja</option>
                            <option value="KESEHATAN_KECELAKAAN">Sakit / Kecelakaan Kerja</option>
                            <option value="DOKUMEN_IMIGRASI">Masalah Paspor / Izin Tinggal</option>
                            <option value="PEMULANGAN_DINI">Permohonan Kepulangan</option>
                          </select>
                        </div>

                        <div>
                          <label className="font-bold text-slate-700 block mb-1">
                            Judul Laporan *
                          </label>
                          <input
                            type="text"
                            required
                            value={portalComplaintTitle}
                            onChange={(e) => setPortalComplaintTitle(e.target.value)}
                            placeholder="Contoh: Mohon bantuan komunikasi jadwal istirahat..."
                            className="w-full rounded-lg border border-slate-300 px-3 py-2"
                          />
                        </div>

                        <div>
                          <label className="font-bold text-slate-700 block mb-1">
                            Keterangan Lengkap *
                          </label>
                          <textarea
                            rows={3}
                            required
                            value={portalComplaintDesc}
                            onChange={(e) => setPortalComplaintDesc(e.target.value)}
                            placeholder="Ceritakan kronologi atau bantuan yang dibutuhkan..."
                            className="w-full rounded-lg border border-slate-300 p-2.5"
                          />
                        </div>

                        <button
                          type="submit"
                          className="w-full rounded-lg bg-rose-600 py-2.5 font-bold text-white shadow-sm hover:bg-rose-700"
                        >
                          Kirim Pengaduan Resmi ke P3MI
                        </button>
                      </form>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* =========================================================
              TAB 7: MEDICAL, VISA & KEBERANGKATAN
             ========================================================= */}
          {activeNav === "medical_visa" && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-4">
                <h2 className="text-base font-bold text-slate-900">
                  Matriks Pemantauan Paspor, Medical Check-Up, Visa & Keberangkatan
                </h2>
                <p className="text-xs text-slate-500">
                  Pantau status FIT/UNFIT sarana kesehatan, masa berlaku paspor, pengajuan visa, dan kesiapan terbang seluruh CPMI.
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-[11px] font-bold uppercase text-slate-500">
                      <th className="py-3 px-3">CPMI & Negara</th>
                      <th className="py-3 px-3">Tahap</th>
                      <th className="py-3 px-3">Paspor RI</th>
                      <th className="py-3 px-3">Medical Check-Up</th>
                      <th className="py-3 px-3">Visa Kerja</th>
                      <th className="py-3 px-3">SISKOP2MI & Penerbangan</th>
                      <th className="py-3 px-3 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredCandidates.map((c) => {
                      const paspor = c.documents.find((d) => d.docType === "PASPOR");
                      const med = c.documents.find((d) => d.docType === "MEDICAL");
                      const visa = c.documents.find((d) => d.docType === "VISA");
                      const medDays = calcDaysLeft(med?.expiryDate);
                      const pasporDays = calcDaysLeft(paspor?.expiryDate);

                      return (
                        <tr key={c.id} className="hover:bg-slate-50">
                          <td className="py-3.5 px-3">
                            <p className="font-bold text-slate-900">{c.fullName}</p>
                            <p className="text-[11px] text-slate-500">
                              {c.destinationCountry} · {c.jobSector}
                            </p>
                          </td>
                          <td className="py-3.5 px-3">
                            <span className="rounded-full bg-slate-900 px-2.5 py-0.5 text-[10px] font-bold text-white">
                              {c.stage}
                            </span>
                          </td>
                          <td className="py-3.5 px-3">
                            {paspor?.status !== "MISSING" ? (
                              <div>
                                <span className="font-mono font-semibold text-slate-800">
                                  {paspor?.docNumber || "Terlampir"}
                                </span>
                                <p
                                  className={`text-[11px] ${
                                    pasporDays !== null && pasporDays < 60
                                      ? "font-bold text-rose-600"
                                      : "text-slate-500"
                                  }`}
                                >
                                  Exp: {paspor?.expiryDate || "Belum diisi"}
                                </p>
                              </div>
                            ) : (
                              <span className="text-slate-400">Belum ada</span>
                            )}
                          </td>
                          <td className="py-3.5 px-3">
                            {med?.status !== "MISSING" ? (
                              <div>
                                <span
                                  className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                                    med?.status === "EXPIRED" || (medDays !== null && medDays < 0)
                                      ? "bg-rose-600 text-white"
                                      : med?.medicalResult === "FIT"
                                      ? "bg-teal-100 text-teal-800"
                                      : "bg-amber-100 text-amber-800"
                                  }`}
                                >
                                  {med?.status === "EXPIRED" || (medDays !== null && medDays < 0)
                                    ? "MCU EXPIRED"
                                    : `MCU: ${med?.medicalResult || "PENDING"}`}
                                </span>
                                <p className="mt-0.5 text-[11px] text-slate-500">
                                  Exp: {med?.expiryDate || "Tanggal kosong"}
                                </p>
                              </div>
                            ) : (
                              <span className="text-slate-400">Belum Medical</span>
                            )}
                          </td>
                          <td className="py-3.5 px-3">
                            {visa?.status !== "MISSING" ? (
                              <div>
                                <span className="font-mono font-semibold text-teal-700">
                                  {visa?.docNumber}
                                </span>
                                <p className="text-[11px] text-slate-500">
                                  Exp: {visa?.expiryDate || "-"}
                                </p>
                              </div>
                            ) : (
                              <span className="text-slate-400">Menunggu</span>
                            )}
                          </td>
                          <td className="py-3.5 px-3">
                            <p className="font-mono text-[11px] text-slate-700">
                              {c.siskop2miId || "Belum input SISKOP2MI"}
                            </p>
                            <p className="text-[11px] font-medium text-sky-600">
                              {c.flightInfo
                                ? `${c.flightInfo} (${c.departureDate})`
                                : "Belum terjadwal"}
                            </p>
                          </td>
                          <td className="py-3.5 px-3 text-right">
                            <button
                              onClick={() => {
                                setSelectedCandidateId(c.id);
                                setActiveNav("cpmi");
                              }}
                              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-800 hover:bg-slate-100"
                            >
                              Kelola
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* =========================================================
              TAB 8: STAF MULTI-USER (RBAC), SPONSOR & JEJAK AUDIT
             ========================================================= */}
          {activeNav === "cabang_audit" && (
            <div className="space-y-6">
              {/* Manajemen Staf & Multi-User RBAC */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      Manajemen Akun Staf & Hak Akses Berbasis Peran (Multi-User RBAC)
                    </h3>
                    <p className="text-xs text-slate-500">
                      Klik tombol <strong>Login sebagai Akun Ini</strong> untuk menguji sesi multi-user dan isolasi cabang secara langsung.
                    </p>
                  </div>
                  {perms.canManageStaff && (
                    <button
                      onClick={() => setShowAddStaffModal(true)}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white hover:bg-slate-800"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      + Tambah Staf Baru
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {db.staffAccounts?.map((st) => {
                    const isCurrent = loggedInStaff?.id === st.id;
                    const branchLabel =
                      st.branchId === "ALL"
                        ? "Seluruh Cabang (Pusat)"
                        : db.branches.find((b) => b.id === st.branchId)?.name || st.branchId;

                    return (
                      <div
                        key={st.id}
                        className={`rounded-xl border p-4 ${
                          isCurrent
                            ? "border-sky-500 bg-sky-50/50 ring-2 ring-sky-500/20"
                            : "border-slate-200 bg-slate-50/60"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-sm font-bold text-slate-900">{st.name}</p>
                            <p className="text-[11px] font-mono text-slate-500">{st.email}</p>
                          </div>
                          <span className="rounded-full bg-slate-900 px-2 py-0.5 text-[10px] font-bold text-white">
                            {st.role}
                          </span>
                        </div>
                        <p className="mt-2 text-xs text-slate-600">
                          Wilayah Akses: <strong>{branchLabel}</strong>
                        </p>
                        <div className="mt-3 flex items-center justify-between border-t border-slate-200/70 pt-2.5">
                          <span className="text-[11px] font-mono text-slate-500">
                            PIN: <strong>{st.pinCode}</strong>
                          </span>
                          {isCurrent ? (
                            <span className="rounded bg-teal-100 px-2 py-1 text-[10px] font-bold text-teal-800">
                              ✓ Sedang Aktif
                            </span>
                          ) : (
                            <button
                              onClick={async () => {
                                const { data } = await callApi("LOGIN_STAFF", {
                                  email: st.email,
                                  pinCode: st.pinCode,
                                });
                                if (data.ok) {
                                  setLoggedInStaff(data.staff);
                                  setSelectedBranchId(
                                    data.staff.branchId === "ALL" ? "ALL" : data.staff.branchId
                                  );
                                  setRevealedSensitiveDocs({});
                                  setToast({
                                    type: "success",
                                    title: `Beralih Akun ke ${data.staff.name} (${data.staff.roleLabel})`,
                                  });
                                }
                              }}
                              className="rounded-lg bg-sky-600 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-sky-700"
                            >
                              Login Akun Ini
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Kartu Cabang & Sponsor */}
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h3 className="text-base font-bold text-slate-900">
                    Kantor Pusat & Jaringan Cabang P3MI
                  </h3>
                  <div className="mt-4 space-y-3">
                    {db.branches.map((b) => {
                      const count = db.candidates.filter((c) => c.branchId === b.id).length;
                      return (
                        <div
                          key={b.id}
                          className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-3.5"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="rounded bg-slate-900 px-2 py-0.5 text-[10px] font-mono font-bold text-white">
                                {b.code}
                              </span>
                              <p className="text-sm font-bold text-slate-900">{b.name}</p>
                            </div>
                            <p className="mt-1 text-xs text-slate-500">
                              Kepala: {b.headName} · {b.city} ({b.phone})
                            </p>
                          </div>
                          <div className="text-right">
                            <span className="text-lg font-extrabold text-sky-600">{count}</span>
                            <span className="block text-[10px] text-slate-400">Berkas CPMI</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h3 className="text-base font-bold text-slate-900">
                    Komisi Sponsor / Petugas Lapangan (PL)
                  </h3>
                  <div className="mt-4 space-y-3">
                    {db.sponsors.map((sp) => (
                      <div
                        key={sp.id}
                        className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-3.5"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="rounded bg-teal-700 px-2 py-0.5 text-[10px] font-mono font-bold text-white">
                              {sp.code}
                            </span>
                            <p className="text-sm font-bold text-slate-900">{sp.name}</p>
                          </div>
                          <p className="mt-1 text-xs text-slate-500">
                            Area: {sp.area} · HP: {sp.phone}
                          </p>
                        </div>
                        <div className="text-right text-xs">
                          <p className="text-slate-500">
                            Terbayar:{" "}
                            <strong className="text-teal-700">
                              {perms.canSeeFinance ? formatRupiah(sp.paidAmount) : "•••"}
                            </strong>
                          </p>
                          <p className="text-rose-600 font-bold mt-0.5">
                            Terutang:{" "}
                            {perms.canSeeFinance ? formatRupiah(sp.payableAmount) : "•••"}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Tabel Jejak Audit Tidak Terhapuskan */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-4">
                  <h3 className="text-base font-bold text-slate-900">
                    Riwayat Aktivitas & Jejak Audit Permanen (Kepatuhan UU PDP)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Mencatat siapa mengubah tahapan apa, verifikasi dokumen, penolakan NIK ganda, tindak lanjut kasus, dan siapa saja yang membuka dokumen sensitif CPMI.
                  </p>
                </div>

                <div className="space-y-2.5">
                  {db.auditLogs.map((log) => (
                    <div
                      key={log.id}
                      className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3.5 text-xs"
                    >
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                              log.actionType === "SENSITIVE_DOC_VIEW"
                                ? "bg-rose-100 text-rose-800"
                                : log.actionType === "NIK_DUPLICATE_BLOCKED"
                                ? "bg-rose-600 text-white"
                                : log.actionType === "CASE_UPDATED"
                                ? "bg-amber-100 text-amber-900"
                                : log.actionType === "STAGE_CHANGE"
                                ? "bg-sky-100 text-sky-800"
                                : "bg-teal-100 text-teal-800"
                            }`}
                          >
                            {log.actionType}
                          </span>
                          <span className="font-bold text-slate-900">{log.actorName}</span>
                          <span className="text-slate-400">({log.branchName})</span>
                        </div>
                        <p className="font-semibold text-slate-800">{log.summary}</p>
                        {log.details && <p className="text-slate-500">{log.details}</p>}
                      </div>
                      <span className="font-mono text-[11px] text-slate-400">{log.timestamp}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* =========================================================
              TAB 9: MODUL KEUANGAN P3MI — PEMBAYARAN FEE SPONSOR BERTAHAP
              (DP 1, DP 2, DP 3, PELUNASAN), RINCIAN HPP, KUR PMI & MARGIN
             ========================================================= */}
          {activeNav === "keuangan" && (
            <div className="space-y-6">
              {!perms.canSeeFinance ? (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 p-8 text-center">
                  <Lock className="mx-auto h-10 w-10 text-rose-600" />
                  <h3 className="mt-3 text-base font-bold text-rose-950">
                    Modul Keuangan & Fee Sponsor Dibatasi (RBAC)
                  </h3>
                  <p className="mx-auto mt-1 max-w-lg text-xs text-rose-800">
                    Akun Anda saat ini (<strong>{loggedInStaff?.name}</strong> —{" "}
                    {loggedInStaff?.roleLabel}) tidak memiliki hak akses membuka Buku Besar Keuangan,
                    HPP Penempatan, dan Pencairan Termin Komisi Sponsor. Silakan beralih ke akun{" "}
                    <strong>Direktur</strong> atau <strong>Admin Operasional Pusat</strong>.
                  </p>
                  <button
                    onClick={() => setShowLoginModal(true)}
                    className="mt-4 rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800"
                  >
                    Ganti ke Akun Direktur / Admin Pusat
                  </button>
                </div>
              ) : (
                <>
                  {/* 4 KPI Keuangan Eksekutif */}
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                      <div className="flex items-center justify-between text-slate-500">
                        <span className="text-xs font-semibold uppercase tracking-wider">
                          Total Pendapatan (Agency Fee)
                        </span>
                        <TrendingUp className="h-4 w-4 text-sky-600" />
                      </div>
                      <p className="mt-2 text-2xl font-extrabold text-slate-900">
                        {formatRupiah(stats.totalRevenue)}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        Akumulasi Placement / Agency Fee ({stats.totalCpmi} CPMI)
                      </p>
                    </div>

                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-5 shadow-sm">
                      <div className="flex items-center justify-between text-emerald-800">
                        <span className="text-xs font-semibold uppercase tracking-wider">
                          Fee Sponsor Sudah Cair
                        </span>
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      </div>
                      <p className="mt-2 text-2xl font-extrabold text-emerald-700">
                        {formatRupiah(stats.paidCommission)}
                      </p>
                      <p className="mt-1 text-xs text-emerald-800">
                        Akumulasi termin DP 1, DP 2, DP 3 & Pelunasan lunas
                      </p>
                    </div>

                    <div className="rounded-2xl border border-rose-200 bg-rose-50/40 p-5 shadow-sm">
                      <div className="flex items-center justify-between text-rose-800">
                        <span className="text-xs font-semibold uppercase tracking-wider">
                          Sisa Fee Sponsor Terutang
                        </span>
                        <Wallet className="h-4 w-4 text-rose-600" />
                      </div>
                      <p className="mt-2 text-2xl font-extrabold text-rose-600">
                        {formatRupiah(stats.unpaidCommission)}
                      </p>
                      <p className="mt-1 text-[11px] text-rose-800 font-medium">
                        Belum cair: DP1 ({stats.terminUnpaidCounts.DP1}) · DP2 (
                        {stats.terminUnpaidCounts.DP2}) · DP3 ({stats.terminUnpaidCounts.DP3}) ·
                        Pelunasan ({stats.terminUnpaidCounts.PELUNASAN})
                      </p>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-slate-900 p-5 text-white shadow-sm">
                      <div className="flex items-center justify-between text-slate-300">
                        <span className="text-xs font-semibold uppercase tracking-wider">
                          Estimasi Margin Bersih P3MI
                        </span>
                        <Banknote className="h-4 w-4 text-teal-400" />
                      </div>
                      <p className="mt-2 text-2xl font-extrabold text-teal-400">
                        {formatRupiah(stats.netMargin)}
                      </p>
                      <p className="mt-1 text-[11px] text-slate-400">
                        Setelah dikurangi HPP ({formatRupiah(stats.totalHppCost)}) & Fee Sponsor
                      </p>
                    </div>
                  </div>

                  {/* BAGIAN 1: MATRIKS PEMBAYARAN FEE SPONSOR BERTAHAP (DP 1, DP 2, DP 3, PELUNASAN) */}
                  <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
                      <div>
                        <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                          Kontrol Anti-Boncos Sponsor / PL
                        </span>
                        <h2 className="mt-1 text-base font-bold text-slate-900">
                          Pembayaran Fee Sponsor Bertahap (DP 1 · DP 2 · DP 3 · Pelunasan)
                        </h2>
                        <p className="text-xs text-slate-500">
                          Pencairan komisi sponsor dikunci berurutan sesuai tahapan progres CPMI:
                          <strong> DP 1 (20% saat Medical FIT)</strong> →{" "}
                          <strong>DP 2 (25% saat Paspor & Rekom ID)</strong> →{" "}
                          <strong>DP 3 (25% saat Visa & Kontrak PK)</strong> →{" "}
                          <strong>Pelunasan (30% saat Terbang)</strong>.
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <select
                          value={financeSponsorFilter}
                          onChange={(e) => setFinanceSponsorFilter(e.target.value)}
                          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-800"
                        >
                          <option value="ALL">Semua Sponsor / PL ({db.sponsors.length})</option>
                          {db.sponsors.map((sp) => (
                            <option key={sp.id} value={sp.id}>
                              {sp.code} · {sp.name} ({sp.area})
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Kartu Rekapitulasi Saldo per Sponsor */}
                    <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
                      {db.sponsors.map((sp) => {
                        const totalSp = sp.paidAmount + sp.payableAmount;
                        const pct = totalSp > 0 ? Math.round((sp.paidAmount / totalSp) * 100) : 0;
                        const cpmiCount = db.candidates.filter((c) => c.sponsorId === sp.id).length;
                        return (
                          <div
                            key={sp.id}
                            onClick={() =>
                              setFinanceSponsorFilter(
                                financeSponsorFilter === sp.id ? "ALL" : sp.id
                              )
                            }
                            className={`cursor-pointer rounded-xl border p-4 transition ${
                              financeSponsorFilter === sp.id
                                ? "border-emerald-500 bg-emerald-50/50 ring-2 ring-emerald-500/20"
                                : "border-slate-200 bg-slate-50/70 hover:border-slate-300"
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <div>
                                <span className="rounded bg-slate-900 px-2 py-0.5 font-mono text-[10px] font-bold text-white">
                                  {sp.code}
                                </span>
                                <p className="mt-1 text-sm font-bold text-slate-900">{sp.name}</p>
                                <p className="text-[11px] text-slate-500">
                                  Area: {sp.area} · {cpmiCount} CPMI
                                </p>
                              </div>
                              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-800">
                                {pct}% Cair
                              </span>
                            </div>

                            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-200">
                              <div
                                className="h-full rounded-full bg-emerald-600 transition-all"
                                style={{ width: `${pct}%` }}
                              />
                            </div>

                            <div className="mt-2.5 flex items-center justify-between text-xs">
                              <span className="text-slate-600">
                                Sudah Cair:{" "}
                                <strong className="text-emerald-700">
                                  {formatRupiah(sp.paidAmount)}
                                </strong>
                              </span>
                              <span className="text-rose-600 font-bold">
                                Sisa: {formatRupiah(sp.payableAmount)}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Daftar CPMI & 4 Kartu Termin (DP1, DP2, DP3, PELUNASAN) */}
                    <div className="mt-5 space-y-4">
                      {db.candidates
                        .filter((c) => {
                          if (selectedBranchId !== "ALL" && c.branchId !== selectedBranchId)
                            return false;
                          if (!c.sponsorId || c.sponsorCommission <= 0) return false;
                          if (
                            financeSponsorFilter !== "ALL" &&
                            c.sponsorId !== financeSponsorFilter
                          )
                            return false;
                          return true;
                        })
                        .map((c) => {
                          const sp = db.sponsors.find((s) => s.id === c.sponsorId);
                          const installments = c.finance?.sponsorInstallments || [];
                          const paidSum = installments
                            .filter((i) => i.status === "PAID")
                            .reduce((acc, i) => acc + i.amount, 0);
                          const totalFee = c.sponsorCommission || 0;
                          const pctPaid =
                            totalFee > 0 ? Math.round((paidSum / totalFee) * 100) : 0;

                          return (
                            <div
                              key={c.id}
                              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                            >
                              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
                                <div>
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className="font-mono text-xs font-bold text-sky-700">
                                      {c.regNumber}
                                    </span>
                                    <h3 className="text-sm font-bold text-slate-900">
                                      {c.fullName}
                                    </h3>
                                    <span className="rounded-md bg-slate-900 px-2 py-0.5 text-[10px] font-bold text-white">
                                      Tahap Saat Ini: {c.stage}
                                    </span>
                                    <span className="rounded-md bg-sky-50 px-2 py-0.5 text-[11px] font-semibold text-sky-800 border border-sky-200">
                                      {c.destinationCountry} · {c.jobSector}
                                    </span>
                                  </div>
                                  <p className="mt-1 text-xs text-slate-500">
                                    Sponsor Pengirim:{" "}
                                    <strong className="text-slate-800">
                                      {sp?.name || "-"} ({sp?.code})
                                    </strong>{" "}
                                    · Total Fee Sponsor:{" "}
                                    <strong className="text-slate-900">
                                      {formatRupiah(totalFee)}
                                    </strong>
                                  </p>
                                </div>

                                <div className="flex items-center gap-3">
                                  <div className="text-right text-xs">
                                    <span className="block font-bold text-emerald-700">
                                      Terbayar: {formatRupiah(paidSum)} ({pctPaid}%)
                                    </span>
                                    <span className="block text-[11px] text-rose-600 font-semibold">
                                      Sisa Terutang: {formatRupiah(Math.max(0, totalFee - paidSum))}
                                    </span>
                                  </div>
                                  <button
                                    onClick={() => {
                                      setSelectedFinanceCandidateId(c.id);
                                      const el = document.getElementById("hpp-breakdown-panel");
                                      el?.scrollIntoView({ behavior: "smooth" });
                                    }}
                                    className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                                  >
                                    Lihat Rincian HPP →
                                  </button>
                                </div>
                              </div>

                              {/* 4 Kolom Termin: DP 1, DP 2, DP 3, PELUNASAN */}
                              <div className="mt-3.5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                                {installments.map((inst, idx) => {
                                  const isPaid = inst.status === "PAID";
                                  const prevInst = idx > 0 ? installments[idx - 1] : null;
                                  const isPrevUnpaid = prevInst && prevInst.status !== "PAID";

                                  const stageOrder: JourneyStage[] = [
                                    "LEAD",
                                    "PROSPECT",
                                    "CPMI",
                                    "READY",
                                    "DEPLOYED",
                                    "ACTIVE_WORKER",
                                    "RETURNED",
                                    "ALUMNI",
                                  ];
                                  const currentIdx = stageOrder.indexOf(c.stage);
                                  const reqIdx = stageOrder.indexOf(inst.requiredStage);
                                  const stageReached = currentIdx >= reqIdx;

                                  return (
                                    <div
                                      key={inst.terminKey}
                                      className={`flex flex-col justify-between rounded-xl border p-3.5 text-xs transition ${
                                        isPaid
                                          ? "border-emerald-200 bg-emerald-50/60"
                                          : stageReached && !isPrevUnpaid
                                          ? "border-amber-300 bg-amber-50/50"
                                          : "border-slate-200 bg-slate-50"
                                      }`}
                                    >
                                      <div>
                                        <div className="flex items-center justify-between gap-1">
                                          <span className="font-extrabold text-slate-900">
                                            {inst.terminKey === "PELUNASAN"
                                              ? "TERMIN 4 · PELUNASAN"
                                              : `TERMIN ${idx + 1} · ${inst.terminKey}`}{" "}
                                            ({inst.percentage}%)
                                          </span>
                                          {isPaid ? (
                                            <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-bold text-white">
                                              ✓ LUNAS
                                            </span>
                                          ) : stageReached && !isPrevUnpaid ? (
                                            <span className="rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-bold text-slate-950">
                                              SIAP CAIR
                                            </span>
                                          ) : (
                                            <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-semibold text-slate-700">
                                              TERTUNDA
                                            </span>
                                          )}
                                        </div>

                                        <p className="mt-1.5 text-base font-extrabold text-slate-900">
                                          {formatRupiah(inst.amount)}
                                        </p>

                                        <p className="mt-1 text-[11px] leading-snug text-slate-600">
                                          Syarat: <strong>{inst.label}</strong> (Min.{" "}
                                          <span className="font-mono font-bold">
                                            {inst.requiredStage}
                                          </span>
                                          )
                                        </p>

                                        {isPaid && (
                                          <div className="mt-2 rounded-lg border border-emerald-200 bg-white p-2 text-[11px] text-slate-600">
                                            <p className="font-mono font-bold text-emerald-800">
                                              {inst.receiptNumber}
                                            </p>
                                            <p>
                                              Cair: <strong>{inst.paidAt}</strong> (
                                              {inst.paymentMethod || "Transfer Bank"})
                                            </p>
                                          </div>
                                        )}
                                      </div>

                                      <div className="mt-3 pt-2 border-t border-slate-200/70">
                                        {isPaid ? (
                                          <button
                                            type="button"
                                            onClick={() =>
                                              setReceiptPreviewModal({
                                                candidate: c,
                                                installment: inst,
                                                sponsorName: sp?.name || "Sponsor Lapangan",
                                                sponsorArea: sp?.area || "-",
                                              })
                                            }
                                            className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-emerald-300 bg-white px-3 py-1.5 text-[11px] font-bold text-emerald-800 hover:bg-emerald-100"
                                          >
                                            <Receipt className="h-3.5 w-3.5" />
                                            Kwitansi {inst.terminKey}
                                          </button>
                                        ) : (
                                          <button
                                            type="button"
                                            disabled={Boolean(isPrevUnpaid)}
                                            onClick={() => {
                                              setPayTerminForm({
                                                paymentMethod: "TRANSFER_BANK",
                                                notes: `Pencairan ${inst.label} a.n ${c.fullName}`,
                                                forceOverride: false,
                                              });
                                              setPayingTerminModal({
                                                candidate: c,
                                                installment: inst,
                                                sponsorName: sp?.name || "Sponsor",
                                                stageWarningMsg: !stageReached
                                                  ? `Tahap ${c.fullName} saat ini baru "${c.stage}", sedangkan syarat ${inst.label} adalah minimal tahap "${inst.requiredStage}".`
                                                  : undefined,
                                              });
                                            }}
                                            className={`inline-flex w-full items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-bold transition ${
                                              isPrevUnpaid
                                                ? "cursor-not-allowed bg-slate-200 text-slate-400"
                                                : stageReached
                                                ? "bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm"
                                                : "bg-slate-900 text-white hover:bg-slate-800"
                                            }`}
                                          >
                                            <CreditCard className="h-3.5 w-3.5" />
                                            {isPrevUnpaid
                                              ? `Bayar ${prevInst?.terminKey} Dulu`
                                              : `Bayar ${inst.terminKey}`}
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>

                  {/* BAGIAN 2: RINCIAN HPP BIAYA PENEMPATAN PER CPMI, SKEMA PEMBIAYAAN (KUR / ZERO COST) & LABA BERSIH */}
                  {financeCandidate && financeCandidate.finance && (
                    <div
                      id="hpp-breakdown-panel"
                      className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
                        <div>
                          <span className="text-[11px] font-bold uppercase tracking-wider text-sky-600">
                            Buku Besar HPP Penempatan & Pembiayaan KUR PMI
                          </span>
                          <h3 className="text-base font-bold text-slate-900">
                            Rincian Komponen Biaya Proses (HPP) & Margin per CPMI
                          </h3>
                        </div>

                        <div className="flex items-center gap-2">
                          <label className="text-xs font-bold text-slate-600">Pilih CPMI:</label>
                          <select
                            value={financeCandidate.id}
                            onChange={(e) => setSelectedFinanceCandidateId(e.target.value)}
                            className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-900"
                          >
                            {db.candidates.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.regNumber} · {c.fullName} ({c.destinationCountry} - {c.stage})
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="mt-5 grid grid-cols-1 gap-6 lg:grid-cols-12">
                        {/* Kolom Kiri: Skema Pembiayaan, KUR PMI & Kalkulasi Margin */}
                        <div className="space-y-4 lg:col-span-5">
                          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs space-y-3">
                            <h4 className="font-bold text-slate-900 text-sm">
                              Skema Pembiayaan & Status KUR PMI
                            </h4>

                            <div>
                              <label className="block font-bold text-slate-700 mb-1">
                                Skema Biaya Penempatan (Sesuai Aturan BP2MI)
                              </label>
                              <select
                                value={financeCandidate.finance.fundingScheme}
                                onChange={async (e) => {
                                  await callApi("UPDATE_FINANCE_SCHEME", {
                                    candidateId: financeCandidate.id,
                                    fundingScheme: e.target.value as FundingScheme,
                                  });
                                  setToast({
                                    type: "success",
                                    title: `Skema Pembiayaan ${financeCandidate.fullName} Diperbarui`,
                                  });
                                }}
                                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-semibold"
                              >
                                <option value="ZERO_COST_MAJIKAN">
                                  Zero Cost (100% Ditanggung Majikan / Agensi)
                                </option>
                                <option value="KUR_PMI_BANK">
                                  KUR PMI Perbankan (BNI / BRI / Mandiri / Bank Daerah)
                                </option>
                                <option value="POTONG_GAJI_RESMI">
                                  Cicilan Potong Gaji Resmi Terukur
                                </option>
                                <option value="MANDIRI_BERTAHAP">
                                  Pembayaran Mandiri Bertahap oleh CPMI
                                </option>
                              </select>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block font-bold text-slate-700 mb-1">
                                  Bank KUR / Lembaga Pembiayaan
                                </label>
                                <input
                                  type="text"
                                  value={financeCandidate.finance.fundingBankOrAgency || ""}
                                  onChange={async (e) => {
                                    await callApi("UPDATE_FINANCE_SCHEME", {
                                      candidateId: financeCandidate.id,
                                      fundingBankOrAgency: e.target.value,
                                    });
                                  }}
                                  placeholder="Contoh: KUR PMI Bank BNI"
                                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5"
                                />
                              </div>

                              <div>
                                <label className="block font-bold text-slate-700 mb-1">
                                  Status Pengajuan KUR
                                </label>
                                <select
                                  value={
                                    financeCandidate.finance.kurStatus || "NOT_APPLICABLE"
                                  }
                                  onChange={async (e) => {
                                    await callApi("UPDATE_FINANCE_SCHEME", {
                                      candidateId: financeCandidate.id,
                                      kurStatus: e.target.value,
                                    });
                                    setToast({
                                      type: "success",
                                      title: `Status KUR PMI Diperbarui ke ${e.target.value}`,
                                    });
                                  }}
                                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 font-bold"
                                >
                                  <option value="NOT_APPLICABLE">Tanpa KUR (Zero Cost)</option>
                                  <option value="PENGAJUAN">PENGAJUAN (Proses Analis Bank)</option>
                                  <option value="DISETUJUI">DISETUJUI (Akad Kredit Disetujui)</option>
                                  <option value="CAIR_LUNAS">CAIR_LUNAS (Dana KUR Cair)</option>
                                </select>
                              </div>
                            </div>

                            {(() => {
                              const costList = financeCandidate.finance.costItems || [];
                              const hppTotal = costList.reduce(
                                (acc, item) => acc + item.amount,
                                0
                              );
                              const hppPaid = costList
                                .filter((i) => i.status === "PAID")
                                .reduce((acc, item) => acc + item.amount, 0);
                              const sponsorFee = financeCandidate.sponsorCommission || 0;
                              const grossRev =
                                financeCandidate.finance.agencyFeeRevenue ||
                                financeCandidate.placementFee ||
                                0;
                              const margin = grossRev - hppTotal - sponsorFee;

                              return (
                                <div className="mt-3 rounded-xl bg-slate-900 p-4 text-white space-y-2">
                                  <div className="flex justify-between text-xs">
                                    <span className="text-slate-300">
                                      Pendapatan Placement / Agency Fee:
                                    </span>
                                    <span className="font-bold text-sky-300">
                                      {formatRupiah(grossRev)}
                                    </span>
                                  </div>
                                  <div className="flex justify-between text-xs">
                                    <span className="text-slate-300">
                                      Total HPP Operasional ({hppPaid > 0 ? "Terbayar " + formatRupiah(hppPaid) : "0"}):
                                    </span>
                                    <span className="font-bold text-amber-300">
                                      - {formatRupiah(hppTotal)}
                                    </span>
                                  </div>
                                  <div className="flex justify-between text-xs">
                                    <span className="text-slate-300">
                                      Total Fee Sponsor (DP1–Pelunasan):
                                    </span>
                                    <span className="font-bold text-rose-300">
                                      - {formatRupiah(sponsorFee)}
                                    </span>
                                  </div>
                                  <div className="flex justify-between border-t border-white/15 pt-2 text-sm font-extrabold">
                                    <span>Margin Bersih P3MI (Per CPMI):</span>
                                    <span
                                      className={
                                        margin >= 0 ? "text-emerald-400" : "text-rose-400"
                                      }
                                    >
                                      {formatRupiah(margin)}
                                    </span>
                                  </div>
                                </div>
                              );
                            })()}
                          </div>

                          {/* Form Tambah Komponen Biaya HPP */}
                          <form
                            onSubmit={handleAddCostItem}
                            className="rounded-xl border border-slate-200 bg-white p-4 text-xs space-y-3"
                          >
                            <h4 className="font-bold text-slate-900">
                              + Tambah Komponen Biaya HPP Baru
                            </h4>
                            <div className="grid grid-cols-2 gap-2.5">
                              <div>
                                <label className="block font-semibold text-slate-600 mb-1">
                                  Kategori Biaya
                                </label>
                                <select
                                  value={newCostForm.category}
                                  onChange={(e) =>
                                    setNewCostForm({
                                      ...newCostForm,
                                      category: e.target.value as PlacementCostItem["category"],
                                    })
                                  }
                                  className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5"
                                >
                                  <option value="MEDICAL_CHECKUP">Medical Check-Up</option>
                                  <option value="PASPOR_IMIGRASI">Paspor & Imigrasi</option>
                                  <option value="PELATIHAN_BLK_SERTIFIKASI">Pelatihan BLK-LN & BNSP</option>
                                  <option value="VISA_TETO_KEDUTAAN">Visa & Legalisir</option>
                                  <option value="TIKET_PESAWAT_HANDLING">Tiket Pesawat & Handling</option>
                                  <option value="BPJS_ASURANSI_PMI">BPJS Ketenagakerjaan PMI</option>
                                  <option value="LAINNYA">Lainnya</option>
                                </select>
                              </div>
                              <div>
                                <label className="block font-semibold text-slate-600 mb-1">
                                  Nominal (Rp)
                                </label>
                                <input
                                  type="number"
                                  required
                                  value={newCostForm.amount}
                                  onChange={(e) =>
                                    setNewCostForm({
                                      ...newCostForm,
                                      amount: Number(e.target.value),
                                    })
                                  }
                                  className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5"
                                />
                              </div>
                            </div>
                            <div>
                              <label className="block font-semibold text-slate-600 mb-1">
                                Uraian Komponen Biaya *
                              </label>
                              <input
                                type="text"
                                required
                                value={newCostForm.title}
                                onChange={(e) =>
                                  setNewCostForm({ ...newCostForm, title: e.target.value })
                                }
                                placeholder="Contoh: Biaya Tes Psikometri / Travel Bandara"
                                className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5"
                              />
                            </div>
                            <button
                              type="submit"
                              className="w-full rounded-lg bg-slate-900 py-2 font-bold text-white hover:bg-slate-800"
                            >
                              Tambahkan ke HPP {financeCandidate.fullName}
                            </button>
                          </form>
                        </div>

                        {/* Kolom Kanan: Tabel Komponen Biaya HPP */}
                        <div className="lg:col-span-7">
                          <div className="overflow-x-auto rounded-xl border border-slate-200">
                            <table className="w-full text-left text-xs">
                              <thead className="bg-slate-100 text-[11px] font-bold uppercase text-slate-600">
                                <tr>
                                  <th className="px-3.5 py-3">Komponen Biaya (HPP)</th>
                                  <th className="px-3.5 py-3">Vendor / Instansi</th>
                                  <th className="px-3.5 py-3">Nominal</th>
                                  <th className="px-3.5 py-3">Status</th>
                                  <th className="px-3.5 py-3 text-right">Aksi</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {(financeCandidate.finance.costItems || []).map((item) => (
                                  <tr key={item.id} className="hover:bg-slate-50">
                                    <td className="px-3.5 py-3">
                                      <span className="rounded bg-slate-200 px-1.5 py-0.5 text-[10px] font-bold text-slate-700">
                                        {item.category}
                                      </span>
                                      <p className="mt-1 font-bold text-slate-900">{item.title}</p>
                                      {item.paidDate && (
                                        <p className="text-[10px] text-slate-400">
                                          Tanggal: {item.paidDate}
                                        </p>
                                      )}
                                    </td>
                                    <td className="px-3.5 py-3">
                                      <span className="rounded-md bg-sky-50 px-2 py-0.5 text-[10px] font-semibold text-sky-800 border border-sky-200">
                                        {item.vendorName || "Vendor P3MI"}
                                      </span>
                                    </td>
                                    <td className="px-3.5 py-3 font-extrabold text-slate-900">
                                      {formatRupiah(item.amount)}
                                    </td>
                                    <td className="px-3.5 py-3">
                                      <span
                                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                          item.status === "PAID"
                                            ? "bg-emerald-100 text-emerald-800"
                                            : "bg-amber-100 text-amber-800"
                                        }`}
                                      >
                                        {item.status}
                                      </span>
                                    </td>
                                    <td className="px-3.5 py-3 text-right">
                                      <button
                                        onClick={async () => {
                                          const nextStatus =
                                            item.status === "PAID" ? "PENDING" : "PAID";
                                          await callApi("UPDATE_COST_ITEM", {
                                            candidateId: financeCandidate.id,
                                            costItemId: item.id,
                                            status: nextStatus,
                                          });
                                          setToast({
                                            type: "success",
                                            title: `Status Biaya "${item.title}" diubah ke ${nextStatus}`,
                                          });
                                        }}
                                        className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-100"
                                      >
                                        {item.status === "PAID"
                                          ? "Tandai Pending"
                                          : "Tandai Lunas"}
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* =========================================================
              TAB 10: MODUL PELATIHAN BLK-LN, ASRAMA & UJI KOMPETENSI
             ========================================================= */}
          {activeNav === "pelatihan" && (
            <div className="space-y-6">
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-sky-600">
                      Integrasi BLK-LN & Asrama Pelatihan P3MI
                    </span>
                    <h2 className="text-base font-bold text-slate-900">
                      Pemantauan Kehadiran Asrama, Nilai Bahasa & Sertifikasi Kompetensi (BNSP / SSW)
                    </h2>
                    <p className="text-xs text-slate-500">
                      Memastikan setiap CPMI lulus uji kompetensi bahasa & keterampilan sebelum pengajuan Visa Kerja dan PAP.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {filteredCandidates.map((c) => {
                    const tr = c.training;
                    if (!tr) return null;
                    return (
                      <div
                        key={c.id}
                        className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 text-xs space-y-3"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-sky-700">
                                {c.regNumber}
                              </span>
                              <h3 className="text-sm font-bold text-slate-900">{c.fullName}</h3>
                            </div>
                            <p className="text-slate-500 mt-0.5">
                              {tr.blkLocation} · Masuk Asrama:{" "}
                              <strong>{tr.dormitoryCheckIn || "Belum Masuk"}</strong>
                            </p>
                          </div>
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                              tr.examStatus === "LULUS_KOMPETEN"
                                ? "bg-emerald-600 text-white"
                                : tr.examStatus === "REMEDIAL"
                                ? "bg-rose-600 text-white"
                                : "bg-amber-500 text-slate-950"
                            }`}
                          >
                            {tr.examStatus}
                          </span>
                        </div>

                        <div className="grid grid-cols-3 gap-2 rounded-xl bg-white p-3 border border-slate-200/80">
                          <div>
                            <span className="text-[10px] text-slate-400 block">
                              Presensi Asrama
                            </span>
                            <span className="text-base font-extrabold text-slate-900">
                              {tr.attendancePct}%
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block">
                              {tr.targetLanguage}
                            </span>
                            <span className="text-base font-extrabold text-sky-700">
                              {tr.languageScore} / 100
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block">
                              Praktik Kerja
                            </span>
                            <span className="text-base font-extrabold text-teal-700">
                              {tr.skillScore} / 100
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                          <span className="text-[11px] text-slate-600">
                            Instruktur: <strong>{tr.instructorNotes}</strong>
                          </span>
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={async () => {
                                await callApi("UPDATE_TRAINING", {
                                  candidateId: c.id,
                                  attendancePct: 98,
                                  languageScore: Math.max(tr.languageScore, 88),
                                  skillScore: Math.max(tr.skillScore, 90),
                                  examStatus: "LULUS_KOMPETEN",
                                  instructorNotes:
                                    "Lulus ujian kompetensi bahasa & praktik kerja, siap proses Visa & PAP.",
                                });
                                setToast({
                                  type: "success",
                                  title: `${c.fullName} Dinyatakan LULUS KOMPETEN (BLK-LN)`,
                                });
                              }}
                              className="rounded-lg bg-emerald-600 px-3 py-1.5 text-[11px] font-bold text-white hover:bg-emerald-700"
                            >
                              Luluskan Uji Kompetensi
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* =========================================================
              TAB 11: MODUL MASTER DATA & DATABASE MITRA EKOSISTEM P3MI + KENDALI BADIL
             ========================================================= */}
          {activeNav === "master_data" && (
            <div className="space-y-6">
              {/* Ringkasan KPI Master Data & Mitra P3MI */}
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
                <button
                  onClick={() => setMasterSubTab("AGENCY")}
                  className={`rounded-2xl border p-4 text-left transition ${
                    masterSubTab === "AGENCY"
                      ? "border-sky-500 bg-sky-50/70 ring-2 ring-sky-500/20"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <span className="text-[11px] font-bold uppercase text-sky-700 block">
                    1. Agensi / Syarikah
                  </span>
                  <p className="mt-1.5 text-2xl font-extrabold text-slate-900">
                    {db.foreignAgencies?.length || 0}
                  </p>
                  <p className="mt-0.5 text-[11px] text-slate-500">
                    Mitra Timteng (SPSK/Tadbeer) & Asia
                  </p>
                </button>

                <button
                  onClick={() => setMasterSubTab("SPONSOR")}
                  className={`rounded-2xl border p-4 text-left transition ${
                    masterSubTab === "SPONSOR"
                      ? "border-emerald-500 bg-emerald-50/70 ring-2 ring-emerald-500/20"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <span className="text-[11px] font-bold uppercase text-emerald-700 block">
                    2. Database Sponsor (PL)
                  </span>
                  <p className="mt-1.5 text-2xl font-extrabold text-slate-900">
                    {db.sponsors.length}
                  </p>
                  <p className="mt-0.5 text-[11px] text-slate-500">
                    Korlap & Rekening Termin DP1–Lunas
                  </p>
                </button>

                <button
                  onClick={() => setMasterSubTab("CLINIC")}
                  className={`rounded-2xl border p-4 text-left transition ${
                    masterSubTab === "CLINIC"
                      ? "border-teal-500 bg-teal-50/70 ring-2 ring-teal-500/20"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <span className="text-[11px] font-bold uppercase text-teal-700 block">
                    3. Klinik Medical / Wafid
                  </span>
                  <p className="mt-1.5 text-2xl font-extrabold text-slate-900">
                    {db.medicalClinics?.length || 0}
                  </p>
                  <p className="mt-0.5 text-[11px] text-slate-500">
                    Wafid (GAMCA GCC) & Kemenkes RI
                  </p>
                </button>

                <button
                  onClick={() => setMasterSubTab("BPJS_KUR")}
                  className={`rounded-2xl border p-4 text-left transition ${
                    masterSubTab === "BPJS_KUR"
                      ? "border-purple-500 bg-purple-50/70 ring-2 ring-purple-500/20"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <span className="text-[11px] font-bold uppercase text-purple-700 block">
                    4. Mitra BPJS & Bank KUR
                  </span>
                  <p className="mt-1.5 text-2xl font-extrabold text-slate-900">
                    {db.bpjsFinancingPartners?.length || 0}
                  </p>
                  <p className="mt-0.5 text-[11px] text-slate-500">
                    BPJS PMI, Asuransi & Bank KUR
                  </p>
                </button>

                <button
                  onClick={() => setMasterSubTab("BADIL_BRANCH")}
                  className={`rounded-2xl border p-4 text-left transition ${
                    masterSubTab === "BADIL_BRANCH"
                      ? "border-amber-500 bg-amber-50/70 ring-2 ring-amber-500/20"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <span className="text-[11px] font-bold uppercase text-amber-800 block">
                    5. Kendali Badil & Cabang
                  </span>
                  <p className="mt-1.5 text-2xl font-extrabold text-amber-900">
                    {db.badilRecords?.length || 0} Badil
                  </p>
                  <p className="mt-0.5 text-[11px] text-slate-500">
                    & {db.branches.length} Kantor Cabang P3MI
                  </p>
                </button>
              </div>

              {/* SUB-TAB 1: DATABASE AGENSI MITRA LUAR NEGERI & SYARIKAH TIMUR TENGAH */}
              {masterSubTab === "AGENCY" && (
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-sky-600">
                        Master Database Agensi Mitra Luar Negeri & Syarikah Timur Tengah
                      </span>
                      <h2 className="text-base font-bold text-slate-900">
                        Daftar Syarikah (Saudi SPSK, UAE Tadbeer, Kuwait, Oman, Yordania) & Agensi Asia Timur
                      </h2>
                      <p className="text-xs text-slate-500">
                        Mencakup nomor izin Wakalah / Musaned / TETO, tarif standar Wakalah/Agency Fee, dan masa garansi pergantian Badil (90–180 hari).
                      </p>
                    </div>
                    <button
                      onClick={() => setShowAddAgencyModal(true)}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800"
                    >
                      <Plus className="h-4 w-4 text-sky-400" />
                      + Tambah Agensi / Syarikah Baru
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase text-slate-600">
                          <th className="py-3 px-3">Kode & Nama Agensi / Syarikah</th>
                          <th className="py-3 px-3">Negara & Kawasan</th>
                          <th className="py-3 px-3">No. Lisensi / Wakalah & Skema</th>
                          <th className="py-3 px-3">PIC & Kontak</th>
                          <th className="py-3 px-3 text-right">Standar Wakalah/Agency Fee</th>
                          <th className="py-3 px-3 text-center">Garansi Badil</th>
                          <th className="py-3 px-3 text-center">Masa Berlaku MOU</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {db.foreignAgencies?.map((ag) => (
                          <tr key={ag.id} className="hover:bg-slate-50/80">
                            <td className="py-3.5 px-3">
                              <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] font-bold text-slate-700">
                                {ag.code}
                              </span>
                              <p className="mt-1 font-bold text-slate-900">{ag.name}</p>
                            </td>
                            <td className="py-3.5 px-3">
                              <span className="font-bold text-slate-900 block">{ag.country}</span>
                              <span
                                className={`mt-0.5 inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                  ag.region === "TIMUR_TENGAH"
                                    ? "bg-amber-100 text-amber-900"
                                    : "bg-sky-100 text-sky-800"
                                }`}
                              >
                                {ag.region === "TIMUR_TENGAH" ? "Timur Tengah (GCC)" : "Asia Pasifik"}
                              </span>
                            </td>
                            <td className="py-3.5 px-3">
                              <span className="font-mono font-semibold text-teal-800 block">
                                {ag.licenseOrWakalahNo}
                              </span>
                              <span className="text-[11px] text-slate-500">{ag.scheme}</span>
                            </td>
                            <td className="py-3.5 px-3">
                              <p className="font-semibold text-slate-800">{ag.picName}</p>
                              <p className="text-[11px] text-slate-500">{ag.phoneEmail}</p>
                            </td>
                            <td className="py-3.5 px-3 text-right font-bold text-emerald-700">
                              {formatRupiah(ag.defaultAgencyFeeIdr)}
                            </td>
                            <td className="py-3.5 px-3 text-center">
                              <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-900 border border-amber-200">
                                {ag.warrantyDays} Hari
                              </span>
                            </td>
                            <td className="py-3.5 px-3 text-center">
                              <span className="font-mono font-semibold text-slate-800 block">
                                {ag.mouExpiryDate}
                              </span>
                              <span className="rounded-full bg-teal-100 px-2 py-0.5 text-[10px] font-bold text-teal-800">
                                {ag.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* SUB-TAB 2: DATABASE SPONSOR / PEREKRUT LAPANGAN (PL) */}
              {masterSubTab === "SPONSOR" && (
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
                        Master Database Sponsor / Perekrut Lapangan (PL)
                      </span>
                      <h2 className="text-base font-bold text-slate-900">
                        Data Mitra Perekrut Lapangan, Wilayah Korlap & Rekening Pencairan Termin (DP1–Pelunasan)
                      </h2>
                    </div>
                    <button
                      onClick={() => setShowAddSponsorModal(true)}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700"
                    >
                      <Plus className="h-4 w-4" />
                      + Tambah Sponsor (PL) Baru
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase text-slate-600">
                          <th className="py-3 px-3">Kode & Nama Sponsor (PL)</th>
                          <th className="py-3 px-3">Wilayah Korlap & Cabang</th>
                          <th className="py-3 px-3">No. HP & Rekening Bank</th>
                          <th className="py-3 px-3 text-center">Jumlah CPMI</th>
                          <th className="py-3 px-3 text-right">Standar Fee / CPMI</th>
                          <th className="py-3 px-3 text-right">Sudah Cair (DP1–Lunas)</th>
                          <th className="py-3 px-3 text-right">Sisa Terutang</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {db.sponsors.map((sp) => {
                          const cpmiCount = db.candidates.filter(
                            (c) => c.sponsorId === sp.id
                          ).length;
                          const brName =
                            db.branches.find((b) => b.id === sp.branchId)?.name || sp.branchId;
                          return (
                            <tr key={sp.id} className="hover:bg-slate-50/80">
                              <td className="py-3.5 px-3">
                                <span className="rounded bg-emerald-100 px-1.5 py-0.5 font-mono text-[10px] font-bold text-emerald-900">
                                  {sp.code}
                                </span>
                                <p className="mt-1 font-bold text-slate-900">{sp.name}</p>
                              </td>
                              <td className="py-3.5 px-3">
                                <p className="font-semibold text-slate-800">{sp.area}</p>
                                <p className="text-[11px] text-slate-500">{brName}</p>
                              </td>
                              <td className="py-3.5 px-3">
                                <p className="font-mono text-slate-800">{sp.phone}</p>
                                <p className="text-[11px] font-semibold text-sky-700">
                                  🏦 {sp.bankAccount || "BRI / Mandiri Terdaftar"}
                                </p>
                              </td>
                              <td className="py-3.5 px-3 text-center">
                                <span className="rounded-full bg-slate-100 px-2.5 py-1 font-bold text-slate-900">
                                  {cpmiCount} CPMI
                                </span>
                              </td>
                              <td className="py-3.5 px-3 text-right font-bold text-slate-900">
                                {formatRupiah(sp.commissionPerCpmi)}
                              </td>
                              <td className="py-3.5 px-3 text-right font-bold text-emerald-700">
                                {formatRupiah(sp.paidAmount)}
                              </td>
                              <td className="py-3.5 px-3 text-right font-bold text-rose-600">
                                {formatRupiah(sp.payableAmount)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* SUB-TAB 3: DATABASE MITRA KLINIK MEDICAL CHECK-UP (WAFID GCC & KEMENKES RI) */}
              {masterSubTab === "CLINIC" && (
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-teal-700">
                        Master Mitra Sarana Kesehatan & Klinik Medical Check-Up
                      </span>
                      <h2 className="text-base font-bold text-slate-900">
                        Daftar Klinik Terakreditasi Wafid (eks-GAMCA Timur Tengah) & Kemenkes RI (Asia Pasifik)
                      </h2>
                    </div>
                    <button
                      onClick={() => setShowAddClinicModal(true)}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-teal-600 px-4 py-2 text-xs font-bold text-white hover:bg-teal-700"
                    >
                      <Plus className="h-4 w-4" />
                      + Tambah Klinik Mitra MCU
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase text-slate-600">
                          <th className="py-3 px-3">Kode & Nama Klinik / RS</th>
                          <th className="py-3 px-3">Jenis Akreditasi</th>
                          <th className="py-3 px-3">Kota & Dokter PIC</th>
                          <th className="py-3 px-3">Negara Tujuan Layanan</th>
                          <th className="py-3 px-3 text-right">Tarif Standar MCU</th>
                          <th className="py-3 px-3 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {db.medicalClinics?.map((cl) => (
                          <tr key={cl.id} className="hover:bg-slate-50/80">
                            <td className="py-3.5 px-3">
                              <span className="rounded bg-teal-50 px-1.5 py-0.5 font-mono text-[10px] font-bold text-teal-800 border border-teal-200">
                                {cl.code}
                              </span>
                              <p className="mt-1 font-bold text-slate-900">{cl.name}</p>
                            </td>
                            <td className="py-3.5 px-3">
                              <span
                                className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                                  cl.accreditation === "WAFID_GCC_GAMCA"
                                    ? "bg-amber-100 text-amber-900"
                                    : cl.accreditation === "WAFID_DAN_KEMENKES"
                                    ? "bg-purple-100 text-purple-900"
                                    : "bg-sky-100 text-sky-900"
                                }`}
                              >
                                {cl.accreditation === "WAFID_GCC_GAMCA"
                                  ? "★ WAFID / GAMCA (Timur Tengah)"
                                  : cl.accreditation === "WAFID_DAN_KEMENKES"
                                  ? "★ WAFID GCC & KEMENKES RI"
                                  : "KEMENKES RI (Asia Pasifik)"}
                              </span>
                            </td>
                            <td className="py-3.5 px-3">
                              <p className="font-semibold text-slate-800">{cl.city}</p>
                              <p className="text-[11px] text-slate-500">
                                {cl.picName} · {cl.phone}
                              </p>
                            </td>
                            <td className="py-3.5 px-3 text-slate-700 font-medium">
                              {cl.targetCountries}
                            </td>
                            <td className="py-3.5 px-3 text-right font-bold text-slate-900">
                              {formatRupiah(cl.standardMcuFeeIdr)}
                            </td>
                            <td className="py-3.5 px-3 text-center">
                              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                                {cl.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* SUB-TAB 4: DATABASE MITRA BPJS KETENAGAKERJAAN, ASURANSI & BANK KUR PMI */}
              {masterSubTab === "BPJS_KUR" && (
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-purple-700">
                        Master Mitra Pelindungan Jaminan Sosial & Perbankan KUR PMI
                      </span>
                      <h2 className="text-base font-bold text-slate-900">
                        Database BPJS Ketenagakerjaan PMI, Konsorsium Asuransi & Bank Penyalur KUR / Payroll Syariah
                      </h2>
                    </div>
                    <button
                      onClick={() => setShowAddBpjsModal(true)}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-purple-600 px-4 py-2 text-xs font-bold text-white hover:bg-purple-700"
                    >
                      <Plus className="h-4 w-4" />
                      + Tambah Mitra BPJS / Bank KUR
                    </button>
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {db.bpjsFinancingPartners?.map((pt) => (
                      <div
                        key={pt.id}
                        className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 text-xs space-y-2.5"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span
                              className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                                pt.partnerType === "BPJS_KETENAGAKERJAAN"
                                  ? "bg-teal-100 text-teal-900"
                                  : pt.partnerType === "ASURANSI_PMI"
                                  ? "bg-sky-100 text-sky-900"
                                  : "bg-amber-100 text-amber-900"
                              }`}
                            >
                              {pt.partnerType}
                            </span>
                            <h3 className="mt-1.5 text-sm font-bold text-slate-900">{pt.name}</h3>
                          </div>
                          <span className="font-mono text-[10px] font-bold text-slate-500">
                            {pt.code}
                          </span>
                        </div>
                        <div className="rounded-xl bg-white p-3 border border-slate-200/80 space-y-1">
                          <p className="text-slate-700">
                            <strong>Skema / Paket:</strong> {pt.programPackage}
                          </p>
                          <p className="text-emerald-700 font-bold">
                            <strong>Premi / Plafon & Bunga:</strong> {pt.premiumOrRateInfo}
                          </p>
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                          <span>PIC: {pt.picName}</span>
                          <span className="font-mono">{pt.phone}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* SUB-TAB 5: BUKU BESAR KENDALI BADIL TIMUR TENGAH & MASTER KANTOR CABANG */}
              {masterSubTab === "BADIL_BRANCH" && (
                <div className="space-y-6">
                  {/* BUKU BESAR KENDALI BADIL (PENGGANTI SLOT PENEMPATAN) */}
                  <div className="rounded-2xl border border-amber-300 bg-white p-6 shadow-sm">
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700">
                          Kendali Badil (بديل · Replacement Candidate) Timur Tengah & Umum
                        </span>
                        <h2 className="text-base font-bold text-slate-900">
                          Buku Besar Pergantian Kandidat Badil (Pra-Terbang Wafid/Visa & Klaim Masa Garansi 90 Hari)
                        </h2>
                        <p className="text-xs text-slate-500">
                          Mencatat otomatis peralihan slot Wakalah/Job Order dari CPMI Awal ke CPMI Pengganti (Badil), Carry-Over DP Sponsor, dan Sunk Cost.
                        </p>
                      </div>
                      <button
                        onClick={() => setShowBadilModal(true)}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-slate-950 shadow-sm hover:bg-amber-400"
                      >
                        <RefreshCw className="h-4 w-4" />
                        + Proses Pergantian Badil Baru
                      </button>
                    </div>

                    <div className="space-y-3">
                      {db.badilRecords?.map((bd) => (
                        <div
                          key={bd.id}
                          className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4 text-xs"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-200/80 pb-3">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="rounded-md bg-amber-500 px-2 py-0.5 font-mono text-[11px] font-black text-slate-950">
                                {bd.code}
                              </span>
                              <span className="font-bold text-slate-900 text-sm">
                                {bd.destinationCountry} · {bd.agencyPartner}
                              </span>
                              <span className="rounded-full bg-white px-2.5 py-0.5 text-[10px] font-bold text-amber-900 border border-amber-300">
                                {bd.badilType === "GARANSI_90_HARI"
                                  ? "Badil Masa Garansi (< 90 Hari)"
                                  : "Badil Pra-Terbang (Wafid/Visa/Batal)"}
                              </span>
                            </div>
                            <span className="text-[11px] text-slate-500">
                              Diproses: <strong>{bd.createdAt}</strong> oleh {bd.processedBy}
                            </span>
                          </div>

                          <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-4">
                            <div className="rounded-xl bg-white p-3 border border-rose-200">
                              <span className="text-[10px] font-bold uppercase text-rose-600 block">
                                Kandidat Awal (Digantikan)
                              </span>
                              <strong className="text-slate-900 block mt-0.5">
                                {bd.originalCandidateName}
                              </strong>
                              <span className="font-mono text-[11px] text-slate-500">
                                {bd.originalRegNumber} · Alasan: {bd.reason}
                              </span>
                            </div>

                            <div className="rounded-xl bg-white p-3 border border-teal-300">
                              <span className="text-[10px] font-bold uppercase text-teal-700 block">
                                Kandidat Badil (Pengganti)
                              </span>
                              <strong className="text-slate-900 block mt-0.5">
                                {bd.replacementCandidateName}
                              </strong>
                              <button
                                onClick={() => {
                                  setSelectedCandidateId(bd.replacementCandidateId);
                                  setActiveNav("cpmi");
                                }}
                                className="mt-1 inline-flex items-center gap-1 text-[11px] font-bold text-sky-600 hover:underline"
                              >
                                {bd.replacementRegNumber} · Buka Berkas →
                              </button>
                            </div>

                            <div className="rounded-xl bg-white p-3 border border-amber-200">
                              <span className="text-[10px] font-bold uppercase text-slate-500 block">
                                Perlakuan DP Sponsor & Sunk Cost
                              </span>
                              <strong className="text-emerald-700 block mt-0.5">
                                Carry-Over DP: {formatRupiah(bd.transferredSponsorDpAmount)}
                              </strong>
                              <span className="text-[11px] text-rose-600 font-semibold">
                                Sunk Cost Awal: {formatRupiah(bd.sunkCostAmount)}
                              </span>
                            </div>

                            <div className="rounded-xl bg-white p-3 border border-amber-200">
                              <span className="text-[10px] font-bold uppercase text-slate-500 block">
                                Skema Wakalah / Agency Fee
                              </span>
                              <strong className="text-slate-900 block mt-0.5">
                                {bd.wakalahFeeScheme === "FREE_WARRANTY_REPLACEMENT"
                                  ? "Free Replacement Garansi (Rp 0)"
                                  : "100% Wakalah Fee Utuh"}
                              </strong>
                              <span className="text-[11px] text-slate-500">
                                Majikan: {bd.employerName}
                              </span>
                            </div>
                          </div>

                          <p className="mt-2.5 text-[11px] text-slate-600">
                            <strong>Catatan Kronologi Badil:</strong> {bd.reasonNotes}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* MASTER KANTOR CABANG & BLK-LN P3MI */}
                  <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-sky-600">
                          Master Jaringan Kantor Cabang Daerah & BLK-LN
                        </span>
                        <h3 className="text-base font-bold text-slate-900">
                          Daftar Kantor Cabang P3MI PT Panca Banyu Ajisakti
                        </h3>
                      </div>
                      <button
                        onClick={() => setShowAddBranchModal(true)}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800"
                      >
                        <Plus className="h-4 w-4 text-sky-400" />
                        + Tambah Kantor Cabang Baru
                      </button>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                      {db.branches.map((br) => (
                        <div
                          key={br.id}
                          className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs"
                        >
                          <span className="rounded bg-sky-100 px-2 py-0.5 font-mono text-[10px] font-bold text-sky-900">
                            {br.code}
                          </span>
                          <h4 className="mt-1.5 font-bold text-slate-900 text-sm">{br.name}</h4>
                          <p className="text-slate-500 mt-0.5">Kota: {br.city}</p>
                          <p className="mt-2 font-semibold text-slate-700">
                            Kepala Cabang: {br.headName}
                          </p>
                          <p className="font-mono text-[11px] text-slate-500">{br.phone}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* =========================================================
          MODAL PENCAIRAN TERMIN FEE SPONSOR (DP 1, DP 2, DP 3, PELUNASAN)
         ========================================================= */}
      {payingTerminModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                  Pencairan Bertahap Fee Sponsor
                </span>
                <h3 className="mt-1 text-base font-bold text-slate-900">
                  {payingTerminModal.installment.label} (
                  {payingTerminModal.installment.percentage}%)
                </h3>
              </div>
              <button
                onClick={() => setPayingTerminModal(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500">Nama CPMI:</span>
                <strong className="text-slate-900">
                  {payingTerminModal.candidate.fullName} ({payingTerminModal.candidate.stage})
                </strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Sponsor / PL Penerima:</span>
                <strong className="text-slate-900">{payingTerminModal.sponsorName}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Syarat Pencairan:</span>
                <strong className="text-sky-700">
                  {payingTerminModal.installment.label} (Min. {payingTerminModal.installment.requiredStage})
                </strong>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-2 text-sm">
                <span className="font-bold text-slate-700">Nominal Termin:</span>
                <span className="font-extrabold text-emerald-700">
                  {formatRupiah(payingTerminModal.installment.amount)}
                </span>
              </div>
            </div>

            {payingTerminModal.stageWarningMsg && (
              <div className="mt-3 rounded-xl border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900">
                <p className="font-bold flex items-center gap-1.5">
                  <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
                  Peringatan Gatekeeper Tahapan CPMI
                </p>
                <p className="mt-1 leading-relaxed">{payingTerminModal.stageWarningMsg}</p>
                <label className="mt-2.5 flex items-center gap-2 font-bold text-amber-950 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={payTerminForm.forceOverride}
                    onChange={(e) =>
                      setPayTerminForm({
                        ...payTerminForm,
                        forceOverride: e.target.checked,
                      })
                    }
                    className="h-4 w-4 rounded border-amber-400"
                  />
                  Setujui Pencairan Lebih Awal (Otorisasi Kasbon Direktur/Admin)
                </label>
              </div>
            )}

            <form onSubmit={handlePaySponsorTermin} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Metode Pembayaran</label>
                <select
                  value={payTerminForm.paymentMethod}
                  onChange={(e) =>
                    setPayTerminForm({
                      ...payTerminForm,
                      paymentMethod: e.target.value as "TRANSFER_BANK" | "TUNAI_KAS",
                    })
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 font-semibold"
                >
                  <option value="TRANSFER_BANK">Transfer Bank Perusahaan (Rekening P3MI)</option>
                  <option value="TUNAI_KAS">Tunai Kas Operasional Kantor</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Catatan / Referensi Bukti Transfer
                </label>
                <input
                  type="text"
                  value={payTerminForm.notes}
                  onChange={(e) =>
                    setPayTerminForm({ ...payTerminForm, notes: e.target.value })
                  }
                  placeholder="Contoh: Transfer Mandiri ref #882910"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPayingTerminModal(null)}
                  className="rounded-lg border border-slate-200 px-4 py-2 font-semibold text-slate-600"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-emerald-600 px-5 py-2 font-bold text-white hover:bg-emerald-700"
                >
                  Konfirmasi Bayar & Terbitkan Kwitansi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================
          MODAL KWITANSI RESMI PEMBAYARAN TERMIN FEE SPONSOR
         ========================================================= */}
      {receiptPreviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div className="flex items-center gap-3">
                <img
                  src="/logo-pas.png"
                  alt="Logo PT Panca Banyu Ajisakti"
                  className="h-11 w-11 rounded-lg border border-slate-200 object-contain p-0.5"
                />
                <div>
                  <p className="text-xs font-extrabold uppercase tracking-wider text-slate-900">
                    PT Panca Banyu Ajisakti (PASMigranPro)
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Bukti Kwitansi Pencairan Termin Fee Sponsor / PL Resmi
                  </p>
                </div>
              </div>
              <button
                onClick={() => setReceiptPreviewModal(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 rounded-xl border-2 border-dashed border-emerald-300 bg-emerald-50/40 p-4 text-xs space-y-2.5">
              <div className="flex items-center justify-between border-b border-emerald-200 pb-2">
                <span className="font-mono font-bold text-emerald-900">
                  No. Kwitansi: {receiptPreviewModal.installment.receiptNumber}
                </span>
                <span className="rounded-full bg-emerald-600 px-2.5 py-0.5 text-[10px] font-bold text-white">
                  LUNAS TERVERIFIKASI
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-slate-500 block">Dibayarkan Kepada (Sponsor/PL):</span>
                  <strong className="text-slate-900">
                    {receiptPreviewModal.sponsorName} ({receiptPreviewModal.sponsorArea})
                  </strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Tanggal & Metode Pencairan:</span>
                  <strong className="text-slate-900">
                    {receiptPreviewModal.installment.paidAt} ·{" "}
                    {receiptPreviewModal.installment.paymentMethod || "Transfer Bank"}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Atas Nama CPMI:</span>
                  <strong className="text-slate-900">
                    {receiptPreviewModal.candidate.fullName} (
                    {receiptPreviewModal.candidate.regNumber})
                  </strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Negara Tujuan & Tahap:</span>
                  <strong className="text-slate-900">
                    {receiptPreviewModal.candidate.destinationCountry} · Tahap{" "}
                    {receiptPreviewModal.candidate.stage}
                  </strong>
                </div>
              </div>

              <div className="rounded-lg bg-white p-3 border border-emerald-200">
                <span className="text-[11px] text-slate-500 block">
                  Uraian Termin Pembayaran:
                </span>
                <p className="font-bold text-slate-900">
                  {receiptPreviewModal.installment.label} (
                  {receiptPreviewModal.installment.percentage}% dari Total Fee{" "}
                  {formatRupiah(receiptPreviewModal.candidate.sponsorCommission)})
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Syarat Tahap: Minimal {receiptPreviewModal.installment.requiredStage}
                </p>
                <p className="mt-2 text-lg font-extrabold text-emerald-700">
                  Nominal Cair: {formatRupiah(receiptPreviewModal.installment.amount)}
                </p>
              </div>
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-800 hover:bg-slate-50"
              >
                <Printer className="h-3.5 w-3.5" />
                Cetak Kwitansi
              </button>
              <button
                type="button"
                onClick={() => setReceiptPreviewModal(null)}
                className="rounded-lg bg-slate-900 px-5 py-2 text-xs font-bold text-white hover:bg-slate-800"
              >
                Selesai
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          MODAL LOGIN MULTI-USER STAF (RBAC)
         ========================================================= */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <img
                  src="/logo-pas.png"
                  alt="PASMigranPro"
                  className="h-8 w-8 rounded-lg border border-slate-200 object-contain p-0.5"
                />
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Login Multi-User PASMigranPro
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Pilih akun staf atau masukkan Email & PIN (Default: 1234)
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowLoginModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {loginError && (
              <div className="mt-3 rounded-lg bg-rose-50 p-2.5 text-xs font-semibold text-rose-700 border border-rose-200">
                {loginError}
              </div>
            )}

            <div className="mt-3">
              <p className="text-[11px] font-bold uppercase text-slate-400 mb-1.5">
                Pilih Cepat Akun Staf (Klik untuk Isi):
              </p>
              <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                {db.staffAccounts?.map((st) => (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => {
                      setLoginEmail(st.email);
                      setLoginPin(st.pinCode);
                    }}
                    className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left text-xs transition ${
                      loginEmail === st.email
                        ? "border-sky-500 bg-sky-50 font-semibold text-sky-900"
                        : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    <div>
                      <p className="font-bold">{st.name}</p>
                      <p className="text-[11px] text-slate-500">{st.roleLabel}</p>
                    </div>
                    <span className="font-mono text-[10px] text-slate-400">PIN: {st.pinCode}</span>
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleStaffLogin} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Email Staf</label>
                <input
                  type="email"
                  required
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">PIN Keamanan</label>
                <input
                  type="password"
                  required
                  value={loginPin}
                  onChange={(e) => setLoginPin(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowLoginModal(false)}
                  className="rounded-lg border border-slate-200 px-4 py-2 font-semibold text-slate-600"
                >
                  Tutup
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-slate-900 px-5 py-2 font-semibold text-white hover:bg-slate-800"
                >
                  Masuk Sesi Staf
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================
          MODAL BUAT TIKET KASUS BARU (CASE MANAGEMENT)
         ========================================================= */}
      {showNewCaseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                Buka Tiket Penanganan Kasus / Pengaduan PMI
              </h3>
              <button
                onClick={() => setShowNewCaseModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleCreateCase} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Pilih CPMI / PMI *</label>
                <select
                  value={newCaseForm.candidateId}
                  onChange={(e) =>
                    setNewCaseForm({ ...newCaseForm, candidateId: e.target.value })
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                >
                  {db.candidates.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.fullName} ({c.destinationCountry} - {c.stage})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Kategori Kasus</label>
                  <select
                    value={newCaseForm.category}
                    onChange={(e) =>
                      setNewCaseForm({
                        ...newCaseForm,
                        category: e.target.value as CaseCategory,
                      })
                    }
                    className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  >
                    <option value="GAJI_TERLAMBAT">Gaji Terlambat</option>
                    <option value="MAJIKAN_PEKERJAAN">Masalah Majikan / Pekerjaan</option>
                    <option value="KESEHATAN_KECELAKAAN">Kesehatan / Kecelakaan</option>
                    <option value="DOKUMEN_IMIGRASI">Dokumen / Imigrasi</option>
                    <option value="PEMULANGAN_DINI">Pemulangan Dini</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Prioritas & Urgensi</label>
                  <select
                    value={newCaseForm.priority}
                    onChange={(e) =>
                      setNewCaseForm({
                        ...newCaseForm,
                        priority: e.target.value as CasePriority,
                      })
                    }
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 font-bold"
                  >
                    <option value="CRITICAL">CRITICAL (Darurat)</option>
                    <option value="HIGH">HIGH (Tinggi)</option>
                    <option value="MEDIUM">MEDIUM (Menengah)</option>
                    <option value="LOW">LOW (Rendah)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Judul Kasus *</label>
                <input
                  type="text"
                  required
                  value={newCaseForm.title}
                  onChange={(e) => setNewCaseForm({ ...newCaseForm, title: e.target.value })}
                  placeholder="Ringkasan masalah yang dihadapi PMI"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Kronologi / Deskripsi Masalah *
                </label>
                <textarea
                  rows={3}
                  required
                  value={newCaseForm.description}
                  onChange={(e) =>
                    setNewCaseForm({ ...newCaseForm, description: e.target.value })
                  }
                  className="w-full rounded-lg border border-slate-300 p-2.5"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Target Penyelesaian (SLA)
                  </label>
                  <input
                    type="date"
                    value={newCaseForm.targetResolutionDate}
                    onChange={(e) =>
                      setNewCaseForm({
                        ...newCaseForm,
                        targetResolutionDate: e.target.value,
                      })
                    }
                    className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Eskalasi Instansi (Opsional)
                  </label>
                  <input
                    type="text"
                    value={newCaseForm.escalatedTo}
                    onChange={(e) =>
                      setNewCaseForm({ ...newCaseForm, escalatedTo: e.target.value })
                    }
                    placeholder="KDEI / KJRI / Agensi Mitra"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowNewCaseModal(false)}
                  className="rounded-lg border border-slate-200 px-4 py-2 font-semibold text-slate-600"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-rose-600 px-5 py-2 font-semibold text-white hover:bg-rose-700"
                >
                  Simpan Tiket Kasus
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================
          MODAL TAMBAH JOB ORDER / LOWONGAN BARU
         ========================================================= */}
      {showNewVacancyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                Tambah Job Order / Publikasi Lowongan Baru
              </h3>
              <button
                onClick={() => setShowNewVacancyModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleCreateVacancy} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Judul Lowongan *</label>
                <input
                  type="text"
                  required
                  value={newVacancyForm.title}
                  onChange={(e) =>
                    setNewVacancyForm({ ...newVacancyForm, title: e.target.value })
                  }
                  placeholder="Contoh: Caregiver Rumah Sakit Taipei"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Negara Tujuan</label>
                  <select
                    value={newVacancyForm.destinationCountry}
                    onChange={(e) =>
                      setNewVacancyForm({
                        ...newVacancyForm,
                        destinationCountry: e.target.value as JobVacancy["destinationCountry"],
                      })
                    }
                    className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  >
                    <optgroup label="Timur Tengah (SPSK / Tadbeer / Formal / QIZ)">
                      <option value="Arab Saudi">Arab Saudi (SPSK / Musaned)</option>
                      <option value="Uni Emirat Arab (UAE)">Uni Emirat Arab (UAE)</option>
                      <option value="Kuwait">Kuwait</option>
                      <option value="Oman">Oman</option>
                      <option value="Yordania">Yordania (Jordan)</option>
                    </optgroup>
                    <optgroup label="Asia Timur & Tenggara">
                      <option value="Taiwan">Taiwan</option>
                      <option value="Hong Kong">Hong Kong</option>
                      <option value="Jepang">Jepang</option>
                      <option value="Singapura">Singapura</option>
                      <option value="Malaysia">Malaysia</option>
                      <option value="Korea Selatan">Korea Selatan</option>
                    </optgroup>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Kuota Dibutuhkan</label>
                  <input
                    type="number"
                    value={newVacancyForm.quotaTotal}
                    onChange={(e) =>
                      setNewVacancyForm({
                        ...newVacancyForm,
                        quotaTotal: Number(e.target.value),
                      })
                    }
                    className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Agensi Mitra Luar Negeri *
                  </label>
                  <input
                    type="text"
                    required
                    value={newVacancyForm.agencyPartner}
                    onChange={(e) =>
                      setNewVacancyForm({ ...newVacancyForm, agencyPartner: e.target.value })
                    }
                    placeholder="Nama agensi mitra"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Gaji Kontrak *</label>
                  <input
                    type="text"
                    required
                    value={newVacancyForm.salaryForeign}
                    onChange={(e) =>
                      setNewVacancyForm({ ...newVacancyForm, salaryForeign: e.target.value })
                    }
                    placeholder="NT$ 27.470 / bulan"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowNewVacancyModal(false)}
                  className="rounded-lg border border-slate-200 px-4 py-2 font-semibold text-slate-600"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-slate-900 px-5 py-2 font-semibold text-white hover:bg-slate-800"
                >
                  Tayangkan Lowongan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================
          MODAL SIMULASI PELAMAR PUBLIK MELAMAR LOWONGAN -> JADI LEAD
         ========================================================= */}
      {applyingVacancy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900">
              Formulir Lamaran Kanal Publik: {applyingVacancy.code}
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              {applyingVacancy.title} ({applyingVacancy.destinationCountry}) — Pelamar otomatis tercatat sebagai <strong>LEAD</strong>.
            </p>
            <form onSubmit={handleApplyFromVacancy} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Nama Lengkap Pelamar *</label>
                <input
                  type="text"
                  required
                  value={applyForm.fullName}
                  onChange={(e) => setApplyForm({ ...applyForm, fullName: e.target.value })}
                  placeholder="Contoh: Rini Wulandari"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">No. HP / WhatsApp *</label>
                <input
                  type="text"
                  required
                  value={applyForm.phone}
                  onChange={(e) => setApplyForm({ ...applyForm, phone: e.target.value })}
                  placeholder="0812-xxxx-xxxx"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  NIK 16 Digit (Opsional untuk Lead)
                </label>
                <input
                  type="text"
                  maxLength={16}
                  value={applyForm.nik}
                  onChange={(e) => setApplyForm({ ...applyForm, nik: e.target.value })}
                  placeholder="Boleh dikosongkan dulu saat melamar"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Pilih Cabang Terdekat Domisili
                </label>
                <select
                  value={applyForm.branchId}
                  onChange={(e) => setApplyForm({ ...applyForm, branchId: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                >
                  {db.branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setApplyingVacancy(null)}
                  className="rounded-lg border border-slate-200 px-4 py-2 font-semibold text-slate-600"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-sky-600 px-4 py-2 font-semibold text-white hover:bg-sky-700"
                >
                  Kirim Lamaran (Masuk ke Lead)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================
          MODAL TAMBAH STAF BARU
         ========================================================= */}
      {showAddStaffModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900">Tambah Akun Staf P3MI Baru</h3>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const { data } = await callApi("CREATE_STAFF", newStaffForm);
                if (data.ok) {
                  setShowAddStaffModal(false);
                  setToast({
                    type: "success",
                    title: `Akun Staf ${data.staff.name} Berhasil Ditambahkan`,
                  });
                }
              }}
              className="mt-4 space-y-3 text-xs"
            >
              <div>
                <label className="font-bold text-slate-700 block mb-1">Nama Lengkap *</label>
                <input
                  type="text"
                  required
                  value={newStaffForm.name}
                  onChange={(e) => setNewStaffForm({ ...newStaffForm, name: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Email Login *</label>
                <input
                  type="email"
                  required
                  value={newStaffForm.email}
                  onChange={(e) => setNewStaffForm({ ...newStaffForm, email: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Peran RBAC</label>
                <select
                  value={newStaffForm.role}
                  onChange={(e) =>
                    setNewStaffForm({ ...newStaffForm, role: e.target.value as UserRole })
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                >
                  <option value="ADMIN_PUSAT">Admin Operasional Pusat</option>
                  <option value="STAF_DOKUMEN">Staf Dokumen, Medical & Visa</option>
                  <option value="KEPALA_CABANG">Kepala Cabang Daerah</option>
                  <option value="PEREKRUT_PL">Perekrut / Sponsor Lapangan (PL)</option>
                  <option value="DIREKTUR">Direktur</option>
                </select>
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Penempatan Cabang</label>
                <select
                  value={newStaffForm.branchId}
                  onChange={(e) =>
                    setNewStaffForm({ ...newStaffForm, branchId: e.target.value })
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                >
                  <option value="ALL">Seluruh Cabang (Kantor Pusat)</option>
                  {db.branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddStaffModal(false)}
                  className="rounded-lg border border-slate-200 px-4 py-2 font-semibold text-slate-600"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-slate-900 px-4 py-2 font-semibold text-white"
                >
                  Simpan Akun Staf
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================
          MODAL DAFTARKAN CPMI / LEAD BARU + DETEKSI NIK GANDA
         ========================================================= */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Daftarkan Berkas CPMI / Lead Baru
                </h3>
                <p className="text-xs text-slate-500">
                  NIK 16 digit dijaga unik di seluruh cabang. Untuk tahap <strong>Lead</strong>, cukup Nama & Kontak dulu.
                </p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-sky-200 bg-sky-50/70 p-3 text-xs">
              <span className="text-sky-900">
                💡 <strong>Ingin menguji pencegahan NIK ganda?</strong> Klik tombol di samping untuk mengisi NIK Sri Wahyuni yang sudah terdaftar:
              </span>
              <button
                type="button"
                onClick={() =>
                  setNewForm((prev) => ({
                    ...prev,
                    stage: "PROSPECT",
                    nik: "3212155408980001",
                    fullName: "Sri Wahyuni (Input Ulang Cabang Lain)",
                    phone: "0812-8821-3301",
                  }))
                }
                className="rounded-lg bg-sky-600 px-3 py-1.5 font-semibold text-white hover:bg-sky-700"
              >
                Simulasikan NIK Ganda
              </button>
            </div>

            {duplicateNikAlert && (
              <div className="mt-4 rounded-xl border-2 border-rose-500 bg-rose-50 p-4">
                <div className="flex items-start gap-3">
                  <ShieldAlert className="h-6 w-6 shrink-0 text-rose-600" />
                  <div className="flex-1">
                    <p className="text-sm font-bold text-rose-900">
                      Pendaftaran Ditolak: NIK 16 Digit Sudah Terdaftar!
                    </p>
                    <p className="mt-1 text-xs text-rose-800">{duplicateNikAlert.message}</p>
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-rose-200 bg-white p-3">
                      <div className="text-xs">
                        <p className="font-bold text-slate-900">
                          {duplicateNikAlert.candidate.fullName} (
                          {duplicateNikAlert.candidate.regNumber})
                        </p>
                        <p className="text-slate-500">
                          Cabang: {duplicateNikAlert.branchName} · Tahap Saat Ini:{" "}
                          <strong>{duplicateNikAlert.candidate.stage}</strong>
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedCandidateId(duplicateNikAlert.candidate.id);
                          setShowAddModal(false);
                          setActiveNav("cpmi");
                        }}
                        className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800"
                      >
                        Buka Berkas yang Sudah Ada →
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleCreateCandidate} className="mt-4 space-y-4 text-xs">
              {/* PILIHAN PAS FOTO / AVATAR CPMI BARU */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5">
                <label className="font-bold text-slate-800 block mb-2">
                  📷 Pas Foto Resmi / Avatar CPMI (Tampil di Profil, e-KTP & Biodata Paspor)
                </label>
                <div className="flex flex-wrap items-center gap-4">
                  <img
                    src={newForm.avatarUrl || AVATAR_PRESETS[0].url}
                    alt="Pratinjau Pas Foto CPMI"
                    className="h-20 w-16 shrink-0 rounded-xl border-2 border-slate-300 bg-white object-cover shadow-sm"
                  />
                  <div className="flex-1 space-y-2">
                    <div className="flex flex-wrap gap-1.5">
                      {AVATAR_PRESETS.map((preset) => {
                        const isSelected =
                          (newForm.avatarUrl || AVATAR_PRESETS[0].url) === preset.url;
                        return (
                          <button
                            key={preset.id}
                            type="button"
                            onClick={() => setNewForm({ ...newForm, avatarUrl: preset.url })}
                            className={`inline-flex items-center gap-1.5 rounded-lg border px-2 py-1 text-[11px] font-semibold transition ${
                              isSelected
                                ? "border-sky-600 bg-sky-600 text-white shadow-xs"
                                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
                            }`}
                          >
                            <img
                              src={preset.url}
                              alt={preset.label}
                              className="h-5 w-4 rounded-xs object-cover"
                            />
                            {preset.label}
                          </button>
                        );
                      })}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <label className="cursor-pointer inline-flex items-center gap-1.5 rounded-lg border border-sky-300 bg-white px-3 py-1.5 text-[11px] font-bold text-sky-700 hover:bg-sky-50">
                        📤 Upload Pas Foto Asli (JPG/PNG) dari Komputer
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            const reader = new FileReader();
                            reader.onload = () => {
                              setNewForm((prev) => ({
                                ...prev,
                                avatarUrl: String(reader.result || ""),
                              }));
                            };
                            reader.readAsDataURL(file);
                          }}
                        />
                      </label>
                      {newForm.avatarUrl && (
                        <span className="text-[11px] font-semibold text-teal-700">
                          ✓ Pas foto siap disimpan
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Tahap Awal Pendaftaran
                  </label>
                  <select
                    value={newForm.stage}
                    onChange={(e) =>
                      setNewForm({ ...newForm, stage: e.target.value as JourneyStage })
                    }
                    className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  >
                    <option value="LEAD">Lead (Dari Lowongan / Sponsor - NIK Opsional)</option>
                    <option value="PROSPECT">Prospect (Berkas Awal - NIK 16 Digit Wajib)</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    NIK (16 Digit Angka Unik){" "}
                    {newForm.stage === "LEAD" ? "(Boleh Menyusul)" : "*"}
                  </label>
                  <input
                    type="text"
                    maxLength={16}
                    value={newForm.nik}
                    onChange={(e) => setNewForm({ ...newForm, nik: e.target.value })}
                    placeholder="Contoh: 3212155408980001"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Nama Lengkap Sesuai KTP *
                  </label>
                  <input
                    type="text"
                    required
                    value={newForm.fullName}
                    onChange={(e) => setNewForm({ ...newForm, fullName: e.target.value })}
                    placeholder="Nama lengkap calon pekerja migran"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Nomor HP / WhatsApp *
                  </label>
                  <input
                    type="text"
                    required
                    value={newForm.phone}
                    onChange={(e) => setNewForm({ ...newForm, phone: e.target.value })}
                    placeholder="0812-xxxx-xxxx"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Negara Tujuan Penempatan
                  </label>
                  <select
                    value={newForm.destinationCountry}
                    onChange={(e) =>
                      setNewForm({ ...newForm, destinationCountry: e.target.value })
                    }
                    className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  >
                    <optgroup label="Timur Tengah (SPSK / Tadbeer / Formal / QIZ)">
                      <option value="Arab Saudi">Arab Saudi (SPSK / Musaned)</option>
                      <option value="Uni Emirat Arab (UAE)">Uni Emirat Arab (UAE)</option>
                      <option value="Kuwait">Kuwait</option>
                      <option value="Oman">Oman</option>
                      <option value="Yordania">Yordania (Jordan)</option>
                    </optgroup>
                    <optgroup label="Asia Timur & Tenggara">
                      <option value="Taiwan">Taiwan</option>
                      <option value="Hong Kong">Hong Kong</option>
                      <option value="Jepang">Jepang</option>
                      <option value="Singapura">Singapura</option>
                      <option value="Malaysia">Malaysia</option>
                      <option value="Korea Selatan">Korea Selatan</option>
                    </optgroup>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Sektor / Jabatan Pekerjaan
                  </label>
                  <input
                    type="text"
                    value={newForm.jobSector}
                    onChange={(e) => setNewForm({ ...newForm, jobSector: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Cabang P3MI</label>
                  <select
                    value={newForm.branchId}
                    onChange={(e) => setNewForm({ ...newForm, branchId: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  >
                    {db.branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Sponsor / Perekrut Lapangan (PL)
                  </label>
                  <select
                    value={newForm.sponsorId}
                    onChange={(e) => setNewForm({ ...newForm, sponsorId: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  >
                    <option value="">Datang Langsung (Tanpa Sponsor)</option>
                    {db.sponsors.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.area})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-lg border border-slate-200 px-4 py-2 font-semibold text-slate-600"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-slate-900 px-5 py-2 font-semibold text-white hover:bg-slate-800"
                >
                  Simpan Berkas CPMI
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================
          MODAL EDIT / VERIFIKASI / PERPANJANG DOKUMEN CPMI + UPLOAD FISIK
         ========================================================= */}
      {editingDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {editingDoc.doc.title}
                </h3>
                <p className="text-xs text-slate-500">
                  Berkas milik: <strong>{editingDoc.candidate.fullName}</strong>
                </p>
              </div>
              <button
                onClick={() => setEditingDoc(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveDocument} className="mt-4 space-y-3.5 text-xs">
              {/* Upload File Fisik Scan (JPG / PNG / PDF) */}
              <div className="rounded-xl border border-dashed border-sky-300 bg-sky-50/50 p-3.5">
                <label className="font-bold text-sky-900 block mb-1">
                  Unggah File Fisik / Scan Dokumen (Foto JPG, PNG, atau PDF)
                </label>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = () => {
                      setDocForm((prev) => ({
                        ...prev,
                        fileDataUrl: String(reader.result || ""),
                        fileName: file.name,
                      }));
                    };
                    reader.readAsDataURL(file);
                  }}
                  className="block w-full text-[11px] text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-sky-600 file:px-3 file:py-1.5 file:text-[11px] file:font-semibold file:text-white hover:file:bg-sky-700"
                />
                {docForm.fileName && (
                  <p className="mt-1.5 text-[11px] font-semibold text-teal-700">
                    ✓ File terlampir: {docForm.fileName}
                  </p>
                )}
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Status Verifikasi Berkas
                </label>
                <select
                  value={docForm.status}
                  onChange={(e) =>
                    setDocForm({
                      ...docForm,
                      status: e.target.value as CpmiDocument["status"],
                    })
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 font-semibold"
                >
                  <option value="VERIFIED">VERIFIED (Sah & Memenuhi Syarat Tahapan)</option>
                  <option value="UPLOADED">UPLOADED (Menunggu Verifikasi Admin)</option>
                  <option value="REJECTED">REJECTED (Ditolak / Foto Buram)</option>
                  <option value="EXPIRED">EXPIRED (Kedaluwarsa)</option>
                  <option value="MISSING">MISSING (Belum Ada)</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Nomor Dokumen (No Paspor / NIK / No Surat / Visa)
                </label>
                <input
                  type="text"
                  value={docForm.docNumber}
                  onChange={(e) => setDocForm({ ...docForm, docNumber: e.target.value })}
                  placeholder="Masukkan nomor dokumen..."
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Instansi Penerbit / Sarana Kesehatan (Klinik)
                </label>
                <input
                  type="text"
                  value={docForm.issuedBy}
                  onChange={(e) => setDocForm({ ...docForm, issuedBy: e.target.value })}
                  placeholder="Contoh: Imigrasi Cirebon / Klinik Utama Pramita"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                />
              </div>

              {editingDoc.doc.docType === "MEDICAL" && (
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Hasil Pemeriksaan Medical Check-Up
                  </label>
                  <select
                    value={docForm.medicalResult}
                    onChange={(e) =>
                      setDocForm({
                        ...docForm,
                        medicalResult: e.target.value as "FIT" | "UNFIT" | "PENDING",
                      })
                    }
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 font-bold"
                  >
                    <option value="FIT">FIT (Layak Terbang / Bekerja)</option>
                    <option value="UNFIT">UNFIT (Tidak Layak - Blokir Tahap Ready)</option>
                    <option value="PENDING">PENDING (Menunggu Hasil Lab)</option>
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Tanggal Terbit / Periksa
                  </label>
                  <input
                    type="date"
                    value={docForm.issueDate}
                    onChange={(e) => setDocForm({ ...docForm, issueDate: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Tanggal Habis Berlaku (Expiry)
                  </label>
                  <input
                    type="date"
                    value={docForm.expiryDate}
                    onChange={(e) => setDocForm({ ...docForm, expiryDate: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    const current = editingDoc;
                    setEditingDoc(null);
                    handleOpenPhysicalDoc(current.candidate, current.doc);
                  }}
                  className="inline-flex items-center gap-1 rounded-lg border border-teal-200 bg-teal-50 px-3 py-2 font-semibold text-teal-800 hover:bg-teal-100"
                >
                  <Eye className="h-3.5 w-3.5" />
                  Lihat Fisik Berkas
                </button>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingDoc(null)}
                    className="rounded-lg border border-slate-200 px-4 py-2 font-semibold text-slate-600"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="rounded-lg bg-slate-900 px-5 py-2 font-semibold text-white hover:bg-slate-800"
                  >
                    Simpan & Verifikasi
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================
          MODAL PRATINJAU FISIK / SCAN DOKUMEN DIGITAL (KTP, PASPOR, MEDICAL, VISA, DLL.)
         ========================================================= */}
      {viewingPhysicalDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-sm">
          <div className="flex max-h-[94vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
            {/* Header Bar Viewer Fisik */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-900 px-6 py-4 text-white">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded bg-teal-500/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-teal-300 border border-teal-400/30">
                    Pratinjau Fisik / Scan Berkas Digital
                  </span>
                  {viewingPhysicalDoc.doc.isSensitive && (
                    <span className="rounded bg-rose-500/20 px-2 py-0.5 text-[10px] font-bold text-rose-300 border border-rose-400/30">
                      🔒 Dilindungi UU PDP (Tercatat di Audit Log)
                    </span>
                  )}
                </div>
                <h3 className="mt-1 text-base font-bold text-white">
                  {viewingPhysicalDoc.doc.title} — {viewingPhysicalDoc.candidate.fullName} (
                  {viewingPhysicalDoc.candidate.destinationCountry})
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <div className="inline-flex rounded-lg border border-white/15 bg-slate-800 p-0.5 text-[11px]">
                  {[100, 115, 130].map((zm) => (
                    <button
                      key={zm}
                      onClick={() => setPhysicalDocZoom(zm)}
                      className={`rounded-md px-2 py-1 font-bold ${
                        physicalDocZoom === zm
                          ? "bg-sky-600 text-white"
                          : "text-slate-300 hover:text-white"
                      }`}
                    >
                      {zm}%
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1 rounded-lg border border-white/20 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-700"
                >
                  <Printer className="h-3.5 w-3.5" />
                  Cetak
                </button>
                <button
                  onClick={() => setViewingPhysicalDoc(null)}
                  className="rounded-lg bg-white/10 p-1.5 text-slate-300 hover:bg-white/20 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Navigasi Cepat 10 Berkas Milik Kandidat Ini */}
            <div className="flex items-center gap-1.5 overflow-x-auto border-b border-slate-200 bg-slate-50 px-6 py-2.5">
              <span className="mr-1 shrink-0 text-[11px] font-bold text-slate-500">
                Pindah Berkas:
              </span>
              {viewingPhysicalDoc.candidate.documents.map((d) => {
                const active = d.id === viewingPhysicalDoc.doc.id;
                return (
                  <button
                    key={d.id}
                    onClick={() => handleOpenPhysicalDoc(viewingPhysicalDoc.candidate, d)}
                    className={`shrink-0 rounded-lg border px-2.5 py-1 text-[11px] font-bold transition ${
                      active
                        ? "border-slate-900 bg-slate-900 text-white"
                        : d.status === "VERIFIED"
                        ? "border-teal-200 bg-teal-50 text-teal-800 hover:bg-teal-100"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    {d.docType} {d.status === "VERIFIED" ? "✓" : ""}
                  </button>
                );
              })}
            </div>

            {/* Area Kanvas Scan Fisik Berkas */}
            <div className="flex-1 overflow-y-auto bg-slate-200/70 p-6">
              <div
                style={{
                  transform: `scale(${physicalDocZoom / 100})`,
                  transformOrigin: "top center",
                }}
                className="mx-auto max-w-2xl transition-transform"
              >
                {/* JIKA ADA FILE SCAN YG DIUPLOAD USER (GAMBAR/FOTO ASLI) */}
                {viewingPhysicalDoc.doc.fileDataUrl ? (
                  <div className="relative overflow-hidden rounded-2xl border-2 border-slate-300 bg-white p-4 shadow-xl">
                    <div className="mb-3 flex items-center justify-between border-b border-slate-100 pb-2 text-xs">
                      <span className="font-bold text-teal-800">
                        📷 File Scan Fisik Terunggah: {viewingPhysicalDoc.doc.fileName || "scan-berkas.jpg"}
                      </span>
                      <span className="rounded-full bg-teal-100 px-2.5 py-0.5 text-[10px] font-bold text-teal-800">
                        Status: {viewingPhysicalDoc.doc.status}
                      </span>
                    </div>
                    <img
                      src={viewingPhysicalDoc.doc.fileDataUrl}
                      alt={viewingPhysicalDoc.doc.title}
                      className="mx-auto max-h-[460px] rounded-xl object-contain"
                    />
                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                      <span className="-rotate-12 select-none text-2xl font-black tracking-widest text-slate-900/10 uppercase">
                        DOKUMEN RAHASIA UU PDP · PASMIGRANPRO
                      </span>
                    </div>
                  </div>
                ) : viewingPhysicalDoc.doc.status === "MISSING" ? (
                  <div className="rounded-2xl border-2 border-dashed border-slate-400 bg-white p-10 text-center shadow-inner">
                    <FileCheck2 className="mx-auto h-12 w-12 text-slate-400" />
                    <h4 className="mt-3 text-base font-bold text-slate-900">
                      Fisik Berkas "{viewingPhysicalDoc.doc.title}" Belum Diunggah (MISSING)
                    </h4>
                    <p className="mx-auto mt-1 max-w-md text-xs text-slate-500">
                      Kandidat atau staf cabang belum mengunggah scan fisik berkas ini. Anda dapat mengunggah foto/scan sekarang menggunakan tombol di bawah.
                    </p>
                  </div>
                ) : viewingPhysicalDoc.doc.docType === "KTP" ? (
                  /* VISUAL SCAN FISIK E-KTP REPUBLIK INDONESIA DI ATAS KERTAS SCANNER */
                  <div className="rounded-2xl border border-slate-300 bg-white p-6 shadow-xl">
                    <div className="mb-4 flex items-center justify-between border-b border-slate-200 pb-2.5 text-[11px] text-slate-500 font-mono">
                      <span>
                        📄 FILE_SCAN: E_KTP_{viewingPhysicalDoc.candidate.regNumber.replace(/-/g, "_")}.JPG (300 DPI · COLOR SCAN)
                      </span>
                      <span className="rounded bg-teal-50 px-2 py-0.5 font-sans font-bold text-teal-700 border border-teal-200">
                        ✓ OCR NIK Match 100%
                      </span>
                    </div>

                    {/* Kartu Fisik e-KTP */}
                    <div className="relative mx-auto max-w-xl overflow-hidden rounded-2xl border-2 border-sky-400/80 bg-gradient-to-br from-sky-200 via-cyan-100 to-sky-300 p-6 text-slate-950 shadow-lg">
                      {/* Pola Guilloche / Garis Halus Latar e-KTP */}
                      <div
                        className="pointer-events-none absolute inset-0 opacity-20"
                        style={{
                          backgroundImage:
                            "repeating-radial-gradient(circle at 20% 50%, transparent 0, transparent 8px, rgba(3, 105, 161, 0.25) 9px, transparent 10px)",
                        }}
                      />

                      {/* Header Provinsi & Kabupaten/Kota */}
                      <div className="relative z-10 border-b border-sky-900/30 pb-2 text-center leading-tight">
                        <p className="text-sm font-black tracking-wider uppercase">
                          PROVINSI{" "}
                          {viewingPhysicalDoc.candidate.branchId === "br-clp"
                            ? "JAWA TENGAH"
                            : viewingPhysicalDoc.candidate.branchId === "br-jkt"
                            ? "DKI JAKARTA"
                            : "JAWA BARAT"}
                        </p>
                        <p className="text-sm font-black tracking-wider uppercase">
                          {viewingPhysicalDoc.candidate.birthPlace
                            ? `KABUPATEN / KOTA ${viewingPhysicalDoc.candidate.birthPlace.toUpperCase()}`
                            : "KABUPATEN INDRAMAYU"}
                        </p>
                      </div>

                      <div className="relative z-10 mt-3 grid grid-cols-12 gap-3">
                        {/* Kolom Data Kiri e-KTP */}
                        <div className="col-span-8 space-y-1 text-[11px] leading-snug">
                          <div className="mb-1.5 flex items-baseline">
                            <span className="w-28 font-black text-sm tracking-tight">NIK</span>
                            <span className="font-mono text-base font-black tracking-widest text-slate-950">
                              : {viewingPhysicalDoc.candidate.nik || viewingPhysicalDoc.doc.docNumber || "3212155408980001"}
                            </span>
                          </div>
                          <div className="flex">
                            <span className="w-28 font-semibold">Nama</span>
                            <span className="font-extrabold uppercase">
                              : {viewingPhysicalDoc.candidate.fullName}
                            </span>
                          </div>
                          <div className="flex">
                            <span className="w-28 font-semibold">Tempat/Tgl Lahir</span>
                            <span className="font-bold uppercase">
                              : {viewingPhysicalDoc.candidate.birthPlace || "INDRAMAYU"},{" "}
                              {viewingPhysicalDoc.candidate.birthDate || "14-08-1998"}
                            </span>
                          </div>
                          <div className="flex items-center justify-between pr-2">
                            <div className="flex">
                              <span className="w-28 font-semibold">Jenis Kelamin</span>
                              <span className="font-bold">
                                : {viewingPhysicalDoc.candidate.gender === "P" ? "PEREMPUAN" : "LAKI-LAKI"}
                              </span>
                            </div>
                            <span className="font-semibold">
                              Gol. Darah : <strong>O</strong>
                            </span>
                          </div>
                          <div className="flex">
                            <span className="w-28 font-semibold">Alamat</span>
                            <span className="font-bold uppercase truncate">
                              : {viewingPhysicalDoc.candidate.address || "BLOK DESA RT 004/002"}
                            </span>
                          </div>
                          <div className="flex pl-4">
                            <span className="w-24 font-semibold">RT/RW</span>
                            <span className="font-bold">: 004 / 002</span>
                          </div>
                          <div className="flex pl-4">
                            <span className="w-24 font-semibold">Kel/Desa</span>
                            <span className="font-bold uppercase">
                              : {viewingPhysicalDoc.candidate.birthPlace || "KARANGAMPEL"}
                            </span>
                          </div>
                          <div className="flex pl-4">
                            <span className="w-24 font-semibold">Kecamatan</span>
                            <span className="font-bold uppercase">
                              : {viewingPhysicalDoc.candidate.birthPlace || "KARANGAMPEL"}
                            </span>
                          </div>
                          <div className="flex">
                            <span className="w-28 font-semibold">Agama</span>
                            <span className="font-bold">: ISLAM</span>
                          </div>
                          <div className="flex">
                            <span className="w-28 font-semibold">Status Perkawinan</span>
                            <span className="font-bold uppercase">
                              : {viewingPhysicalDoc.candidate.maritalStatus || "KAWIN"}
                            </span>
                          </div>
                          <div className="flex">
                            <span className="w-28 font-semibold">Pekerjaan</span>
                            <span className="font-bold">: KARYAWAN SWASTA / CPMI</span>
                          </div>
                          <div className="flex">
                            <span className="w-28 font-semibold">Kewarganegaraan</span>
                            <span className="font-bold">: WNI</span>
                          </div>
                          <div className="flex">
                            <span className="w-28 font-semibold">Berlaku Hingga</span>
                            <span className="font-bold">: SEUMUR HIDUP</span>
                          </div>
                        </div>

                        {/* Kolom Pas Foto & Tanda Tangan Kanan e-KTP */}
                        <div className="col-span-4 flex flex-col items-center justify-between pt-1">
                          <div className="relative flex h-32 w-24 flex-col items-center justify-end overflow-hidden rounded border-2 border-white bg-red-600 shadow-md">
                            <img
                              src={getCandidateAvatarUrl(viewingPhysicalDoc.candidate)}
                              alt={viewingPhysicalDoc.candidate.fullName}
                              className="h-full w-full object-cover"
                            />
                          </div>

                          <div className="mt-2 text-center text-[10px] leading-tight">
                            <p className="font-bold uppercase">
                              {viewingPhysicalDoc.candidate.birthPlace || "INDRAMAYU"}
                            </p>
                            <p className="text-[9px] text-slate-700">12-04-2021</p>
                            {/* Tanda Tangan Goresan Pena */}
                            <svg
                              viewBox="0 0 120 36"
                              className="mx-auto mt-1 h-7 w-24 text-slate-900"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2.2"
                            >
                              <path d="M10 26 Q 28 6, 42 22 T 75 16 Q 92 10, 110 24" />
                              <path d="M22 28 L 96 20" strokeWidth="1.2" />
                            </svg>
                          </div>
                        </div>
                      </div>

                      {/* Watermark Pelindung UU PDP */}
                      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                        <span className="-rotate-12 select-none text-lg font-black tracking-widest text-sky-950/15 uppercase">
                          SALINAN SCAN RESMI PASMIGRANPRO · UU PDP
                        </span>
                      </div>
                    </div>

                    {/* Stempel Verifikasi Digital di Bawah Kertas Scan */}
                    <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-slate-50 px-4 py-2.5 text-[11px] text-slate-600 border border-slate-200">
                      <span>
                        <strong>Status Berkas:</strong>{" "}
                        <span className="font-bold text-teal-700">
                          {viewingPhysicalDoc.doc.status}
                        </span>{" "}
                        · Diverifikasi oleh:{" "}
                        <strong>{viewingPhysicalDoc.doc.verifiedBy || "Admin Pusat (Rina)"}</strong>
                      </span>
                      <span className="text-slate-500">
                        Ingin mengganti dengan foto KTP asli dari komputer? Klik tombol{" "}
                        <strong>Upload / Ganti File Scan Fisik</strong> di kiri bawah.
                      </span>
                    </div>
                  </div>
                ) : viewingPhysicalDoc.doc.docType === "PASPOR" ? (
                  /* VISUAL FISIK HALAMAN BIODATA PASPOR REPUBLIK INDONESIA 48 HALAMAN */
                  <div className="relative overflow-hidden rounded-2xl border-2 border-emerald-700/40 bg-gradient-to-b from-amber-50/90 via-emerald-50/70 to-teal-50/90 p-6 text-slate-900 shadow-xl">
                    <div className="flex items-center justify-between border-b-2 border-emerald-800/30 pb-3">
                      <div>
                        <p className="text-xs font-black tracking-widest text-emerald-900 uppercase">
                          REPUBLIK INDONESIA · REPUBLIC OF INDONESIA
                        </p>
                        <p className="text-[11px] font-bold text-slate-600">
                          PASPOR / PASSPORT (48 HALAMAN)
                        </p>
                      </div>
                      <div className="text-right font-mono">
                        <span className="text-[10px] text-slate-500 block">No. Paspor / Passport No.</span>
                        <strong className="text-base font-black text-emerald-950">
                          {viewingPhysicalDoc.doc.docNumber || "E9928172"}
                        </strong>
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-12 gap-4 text-xs">
                      <div className="col-span-4 flex flex-col items-center justify-center rounded-xl border border-emerald-800/20 bg-white/80 p-3">
                        <div className="flex h-32 w-24 flex-col items-center justify-center overflow-hidden rounded border border-emerald-700/30 bg-sky-700 text-white shadow-xs">
                          <img
                            src={getCandidateAvatarUrl(viewingPhysicalDoc.candidate)}
                            alt={viewingPhysicalDoc.candidate.fullName}
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <span className="mt-2 rounded bg-emerald-100 px-2 py-0.5 text-[9px] font-bold text-emerald-900">
                          CHIP BIOMETRIK AKTIF
                        </span>
                      </div>
                      <div className="col-span-8 grid grid-cols-2 gap-y-2.5 gap-x-4">
                        <div className="col-span-2">
                          <span className="text-[10px] text-slate-500 block uppercase">
                            Nama Lengkap / Full Name
                          </span>
                          <strong className="text-sm font-black uppercase">
                            {viewingPhysicalDoc.candidate.fullName}
                          </strong>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 block uppercase">
                            Kewarganegaraan / Nationality
                          </span>
                          <strong>INDONESIA (IDN)</strong>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 block uppercase">
                            Tanggal Lahir / Date of Birth
                          </span>
                          <strong>{viewingPhysicalDoc.candidate.birthDate || "14 AUG 1998"}</strong>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 block uppercase">
                            Tanggal Pengeluaran / Date of Issue
                          </span>
                          <strong>{viewingPhysicalDoc.doc.issueDate || "10 JAN 2026"}</strong>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 block uppercase">
                            Habis Berlaku / Date of Expiry
                          </span>
                          <strong className="text-emerald-800">
                            {viewingPhysicalDoc.doc.expiryDate || "10 JAN 2031"}
                          </strong>
                        </div>
                        <div className="col-span-2">
                          <span className="text-[10px] text-slate-500 block uppercase">
                            Kantor yang Mengeluarkan / Issuing Office & No. Reg
                          </span>
                          <strong>
                            {viewingPhysicalDoc.doc.issuedBy || "KANIM KELAS I CIREBON"} · NIK:{" "}
                            {viewingPhysicalDoc.candidate.nik || "-"}
                          </strong>
                        </div>
                      </div>
                    </div>

                    {/* MRZ (Machine Readable Zone) 2 Baris */}
                    <div className="mt-5 rounded-lg bg-white/90 p-3 font-mono text-xs tracking-widest text-slate-800 border border-slate-300">
                      <p className="truncate">
                        P&lt;IDN{viewingPhysicalDoc.candidate.fullName.toUpperCase().replace(/\s+/g, "<<")}&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;
                      </p>
                      <p className="truncate mt-0.5">
                        {(viewingPhysicalDoc.doc.docNumber || "E9928172").padEnd(9, "<")}4IDN9808142{viewingPhysicalDoc.candidate.gender === "P" ? "F" : "M"}3101105&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;08
                      </p>
                    </div>
                  </div>
                ) : viewingPhysicalDoc.doc.docType === "MEDICAL" ? (
                  /* VISUAL FISIK SERTIFIKAT MEDICAL CHECK-UP FIT / WAFID GCC */
                  <div className="relative overflow-hidden rounded-2xl border-2 border-teal-600/40 bg-white p-6 text-slate-900 shadow-xl">
                    <div className="flex items-start justify-between border-b-2 border-slate-200 pb-4">
                      <div>
                        <span className="rounded bg-teal-100 px-2 py-0.5 text-[10px] font-bold text-teal-900">
                          SERTIFIKAT KESEHATAN CPMI / WAFID (GAMCA) & KEMENKES RI
                        </span>
                        <h4 className="mt-1 text-base font-black text-slate-900 uppercase">
                          {viewingPhysicalDoc.doc.issuedBy || "KLINIK UTAMA PRAMITA / WAFID MEDICAL CENTER"}
                        </h4>
                        <p className="text-xs text-slate-500">
                          No. Sertifikat: <strong className="font-mono">{viewingPhysicalDoc.doc.docNumber || "MCU-2026-8821"}</strong>
                        </p>
                      </div>
                      <div
                        className={`rounded-xl border-2 px-4 py-2 text-center font-black ${
                          viewingPhysicalDoc.doc.medicalResult === "UNFIT"
                            ? "border-rose-600 bg-rose-50 text-rose-700"
                            : "border-emerald-600 bg-emerald-50 text-emerald-700"
                        }`}
                      >
                        <span className="text-[10px] block uppercase">KESIMPULAN MEDIS</span>
                        <span className="text-lg">
                          {viewingPhysicalDoc.doc.medicalResult || "FIT"} TO WORK
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
                      <div className="rounded-lg bg-slate-50 p-3">
                        <span className="text-slate-400 block">Nama Pasien / CPMI</span>
                        <strong className="text-slate-900">{viewingPhysicalDoc.candidate.fullName}</strong>
                      </div>
                      <div className="rounded-lg bg-slate-50 p-3">
                        <span className="text-slate-400 block">Negara Tujuan</span>
                        <strong className="text-slate-900">{viewingPhysicalDoc.candidate.destinationCountry}</strong>
                      </div>
                      <div className="rounded-lg bg-slate-50 p-3">
                        <span className="text-slate-400 block">Pemeriksaan Fisik, Rontgen Thorax & Lab</span>
                        <strong className="text-emerald-700">Normal / Bebas TB & Hepatitis / Negatif</strong>
                      </div>
                      <div className="rounded-lg bg-slate-50 p-3">
                        <span className="text-slate-400 block">Tanggal Periksa s/d Kedaluwarsa (90 Hari)</span>
                        <strong>
                          {viewingPhysicalDoc.doc.issueDate || "2026-09-01"} s/d{" "}
                          <span className="text-teal-700">{viewingPhysicalDoc.doc.expiryDate || "2026-12-01"}</span>
                        </strong>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* VISUAL FISIK DOKUMEN RESMI LAINNYA (KK, AKTA/IJAZAH, IZIN KELUARGA, SERTIFIKAT BNSP, PK, VISA, TIKET) */
                  <div className="relative overflow-hidden rounded-2xl border-2 border-slate-300 bg-white p-6 text-slate-900 shadow-xl">
                    <div className="flex items-start justify-between border-b-2 border-slate-200 pb-4">
                      <div>
                        <span className="rounded bg-sky-100 px-2 py-0.5 text-[10px] font-bold text-sky-900 uppercase">
                          DOKUMEN RESMI PENEMPATAN PMI · {viewingPhysicalDoc.doc.docType}
                        </span>
                        <h4 className="mt-1 text-base font-black text-slate-900 uppercase">
                          {viewingPhysicalDoc.doc.title}
                        </h4>
                        <p className="text-xs text-slate-500">
                          Nomor Registrasi Berkas:{" "}
                          <strong className="font-mono text-slate-900">
                            {viewingPhysicalDoc.doc.docNumber || "REG-DOC-2026-VERIFIED"}
                          </strong>
                        </p>
                      </div>
                      <div className="rounded-xl border-2 border-teal-600 bg-teal-50 px-3 py-1.5 text-center">
                        <span className="text-[10px] font-bold text-teal-800 block">STATUS FISIK</span>
                        <span className="text-xs font-black text-teal-900">
                          {viewingPhysicalDoc.doc.status}
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
                      <div className="rounded-lg bg-slate-50 p-3">
                        <span className="text-slate-400 block">Nama Lengkap CPMI</span>
                        <strong className="text-slate-900">{viewingPhysicalDoc.candidate.fullName}</strong>
                      </div>
                      <div className="rounded-lg bg-slate-50 p-3">
                        <span className="text-slate-400 block">NIK 16 Digit</span>
                        <strong className="font-mono text-slate-900">
                          {viewingPhysicalDoc.candidate.nik || "-"}
                        </strong>
                      </div>
                      <div className="rounded-lg bg-slate-50 p-3">
                        <span className="text-slate-400 block">Instansi Penerbit / Pejabat Berwenang</span>
                        <strong className="text-slate-900">
                          {viewingPhysicalDoc.doc.issuedBy || "Instansi Resmi Terkait / Disnaker / KBRI"}
                        </strong>
                      </div>
                      <div className="rounded-lg bg-slate-50 p-3">
                        <span className="text-slate-400 block">Diverifikasi Oleh & Masa Berlaku</span>
                        <strong className="text-teal-800">
                          {viewingPhysicalDoc.doc.verifiedBy || "Admin Pusat"} ·{" "}
                          {viewingPhysicalDoc.doc.expiryDate || "Berlaku Aktif"}
                        </strong>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Footer Aksi Cepat di Bawah Pratinjau Fisik */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-white px-6 py-4 text-xs">
              <div className="flex flex-wrap items-center gap-2">
                <label className="cursor-pointer inline-flex items-center gap-1.5 rounded-xl border border-sky-300 bg-sky-50 px-3.5 py-2 font-bold text-sky-800 hover:bg-sky-100">
                  <span>📤 Upload / Ganti File Scan Fisik (JPG/PNG)</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file || !viewingPhysicalDoc) return;
                      const reader = new FileReader();
                      reader.onload = async () => {
                        const dataUrl = String(reader.result || "");
                        const { data } = await callApi("UPDATE_DOCUMENT", {
                          candidateId: viewingPhysicalDoc.candidate.id,
                          documentId: viewingPhysicalDoc.doc.id,
                          fileDataUrl: dataUrl,
                          fileName: file.name,
                          status:
                            viewingPhysicalDoc.doc.status === "MISSING"
                              ? "UPLOADED"
                              : viewingPhysicalDoc.doc.status,
                        });
                        if (data.ok) {
                          const updatedCand = (data.db as DbPayload).candidates.find(
                            (c) => c.id === viewingPhysicalDoc.candidate.id
                          );
                          const updatedDoc = updatedCand?.documents.find(
                            (d) => d.id === viewingPhysicalDoc.doc.id
                          );
                          if (updatedCand && updatedDoc) {
                            setViewingPhysicalDoc({ candidate: updatedCand, doc: updatedDoc });
                          }
                          setToast({
                            type: "success",
                            title: `File Scan Fisik "${file.name}" Berhasil Diunggah`,
                          });
                        }
                      };
                      reader.readAsDataURL(file);
                    }}
                  />
                </label>

                <button
                  onClick={() => {
                    const cur = viewingPhysicalDoc;
                    setViewingPhysicalDoc(null);
                    setEditingDoc({ candidate: cur.candidate, doc: cur.doc });
                    setDocForm({
                      status: cur.doc.status === "MISSING" ? "VERIFIED" : cur.doc.status,
                      docNumber: cur.doc.docNumber || "",
                      issuedBy: cur.doc.issuedBy || "",
                      issueDate: cur.doc.issueDate || "",
                      expiryDate: cur.doc.expiryDate || "",
                      medicalResult: cur.doc.medicalResult || "FIT",
                      notes: cur.doc.notes || "",
                      fileDataUrl: cur.doc.fileDataUrl || "",
                      fileName: cur.doc.fileName || "",
                    });
                  }}
                  className="rounded-xl border border-slate-300 bg-white px-3.5 py-2 font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Edit Nomor / Tanggal Berkas
                </button>
              </div>

              <div className="flex items-center gap-2">
                {viewingPhysicalDoc.doc.status !== "VERIFIED" && (
                  <button
                    onClick={async () => {
                      const { data } = await callApi("UPDATE_DOCUMENT", {
                        candidateId: viewingPhysicalDoc.candidate.id,
                        documentId: viewingPhysicalDoc.doc.id,
                        status: "VERIFIED",
                        docNumber:
                          viewingPhysicalDoc.doc.docNumber ||
                          `VER-${viewingPhysicalDoc.doc.docType}-2026`,
                      });
                      if (data.ok) {
                        const updatedCand = (data.db as DbPayload).candidates.find(
                          (c) => c.id === viewingPhysicalDoc.candidate.id
                        );
                        const updatedDoc = updatedCand?.documents.find(
                          (d) => d.id === viewingPhysicalDoc.doc.id
                        );
                        if (updatedCand && updatedDoc) {
                          setViewingPhysicalDoc({ candidate: updatedCand, doc: updatedDoc });
                        }
                        setToast({
                          type: "success",
                          title: `Fisik Berkas "${viewingPhysicalDoc.doc.title}" Disahkan (VERIFIED)`,
                        });
                      }
                    }}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-teal-600 px-4 py-2 font-bold text-white shadow-sm hover:bg-teal-700"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Setujui & Verifikasi Fisik Berkas (VERIFIED)
                  </button>
                )}
                <button
                  onClick={() => setViewingPhysicalDoc(null)}
                  className="rounded-xl bg-slate-900 px-4 py-2 font-semibold text-white hover:bg-slate-800"
                >
                  Tutup Pratinjau
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          MODAL PERPANJANGAN CEPAT DARI TUGAS PENGINGAT
         ========================================================= */}
      {renewingTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900">
              Selesaikan Tugas Perpanjangan Dokumen
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              {renewingTask.docTitle} milik <strong>{renewingTask.candidateName}</strong>
            </p>
            <form onSubmit={handleCompleteRenewal} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Tanggal Habis Berlaku Baru (Setelah Diperpanjang) *
                </label>
                <input
                  type="date"
                  required
                  value={renewNewExpiry}
                  onChange={(e) => setRenewNewExpiry(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setRenewingTask(null)}
                  className="rounded-lg border border-slate-200 px-4 py-2 font-semibold text-slate-600"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-teal-600 px-4 py-2 font-semibold text-white hover:bg-teal-700"
                >
                  Simpan Perpanjangan & Selesaikan Tugas
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================
          MODAL PROSES PERGANTIAN KANDIDAT BADIL (TIMUR TENGAH / UMUM)
         ========================================================= */}
      {showBadilModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="rounded bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-900">
                  Mekanisme Badil (بديل · Replacement Candidate)
                </span>
                <h3 className="mt-1 text-lg font-bold text-slate-900">
                  Proses Pergantian Kandidat Badil & Alih Slot Wakalah / Fee Sponsor
                </h3>
                <p className="text-xs text-slate-500">
                  Mengalihkan slot Job Order/Syarikah dari kandidat yang batal/unfit/pulang garansi ke kandidat pengganti secara otomatis.
                </p>
              </div>
              <button
                onClick={() => setShowBadilModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const { data } = await callApi("PROCESS_BADIL", badilForm);
                if (!data.ok) {
                  setToast({
                    type: "error",
                    title: "Gagal Memproses Badil",
                    details: [data.error],
                  });
                  return;
                }
                setShowBadilModal(false);
                setSelectedCandidateId(data.replacementCandidate.id);
                setToast({
                  type: "success",
                  title: `Proses Badil Berhasil (${data.badilRecord.code})`,
                  details: [
                    `${data.replacementCandidate.fullName} resmi menggantikan ${data.originalCandidate.fullName} (${data.originalCandidate.destinationCountry}).`,
                    `Carry-Over DP Sponsor: ${formatRupiah(
                      data.badilRecord.transferredSponsorDpAmount
                    )} · Sunk Cost Tercatat: ${formatRupiah(data.badilRecord.sunkCostAmount)}.`,
                  ],
                });
              }}
              className="mt-4 space-y-4 text-xs"
            >
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-rose-200 bg-rose-50/50 p-3.5">
                  <label className="font-bold text-rose-900 block mb-1.5">
                    1. Pilih Kandidat Awal (Yang Batal / Digantikan) *
                  </label>
                  <select
                    value={badilForm.originalCandidateId}
                    onChange={(e) =>
                      setBadilForm({ ...badilForm, originalCandidateId: e.target.value })
                    }
                    className="w-full rounded-lg border border-rose-300 bg-white px-3 py-2 font-semibold text-slate-900"
                  >
                    {db.candidates.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.fullName} ({c.regNumber}) · {c.destinationCountry} [{c.stage}]
                      </option>
                    ))}
                  </select>
                </div>

                <div className="rounded-xl border border-teal-300 bg-teal-50/50 p-3.5">
                  <label className="font-bold text-teal-900 block mb-1.5">
                    2. Pilih Kandidat Pengganti (Kandidat Badil) *
                  </label>
                  <select
                    value={badilForm.replacementCandidateId}
                    onChange={(e) =>
                      setBadilForm({ ...badilForm, replacementCandidateId: e.target.value })
                    }
                    className="w-full rounded-lg border border-teal-300 bg-white px-3 py-2 font-semibold text-slate-900"
                  >
                    {db.candidates
                      .filter((c) => c.id !== badilForm.originalCandidateId)
                      .map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.fullName} ({c.regNumber}) · {c.destinationCountry} [{c.stage}]
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Kategori Kejadian Badil
                  </label>
                  <select
                    value={badilForm.badilType}
                    onChange={(e) => {
                      const val = e.target.value as BadilType;
                      setBadilForm({
                        ...badilForm,
                        badilType: val,
                        wakalahFeeScheme:
                          val === "GARANSI_90_HARI"
                            ? "FREE_WARRANTY_REPLACEMENT"
                            : "FULL_WAKALAH_FEE",
                      });
                    }}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 font-semibold"
                  >
                    <option value="PRA_TERBANG">
                      Badil Pra-Terbang (Unfit Wafid / Batal Sebelum Berangkat)
                    </option>
                    <option value="GARANSI_90_HARI">
                      Badil Masa Garansi (&lt; 90 Hari Setelah Terbang / Pulang Dini)
                    </option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Alasan Spesifik Pergantian Badil
                  </label>
                  <select
                    value={badilForm.reason}
                    onChange={(e) =>
                      setBadilForm({ ...badilForm, reason: e.target.value as BadilReason })
                    }
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 font-semibold"
                  >
                    <option value="UNFIT_WAFID_MEDICAL">
                      UNFIT Medical Wafid (GAMCA) / Klinik
                    </option>
                    <option value="MUNDUR_SEPIHAK">
                      Mengundurkan Diri Sepihak / Kendala Izin Keluarga
                    </option>
                    <option value="GAGAL_VISA_TASHEER">
                      Kendala Biometrik Tasheer / Penolakan Visa / Enjaz
                    </option>
                    <option value="PULANG_GARANSI_90_HARI">
                      Klaim Garansi Syarikah (&lt; 90 Hari di Negara Tujuan)
                    </option>
                    <option value="LAINNYA">Alasan Operasional Lainnya</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Perlakuan DP Fee Sponsor yang Sudah Cair di Kandidat Awal
                  </label>
                  <select
                    value={badilForm.sponsorDpTreatment}
                    onChange={(e) =>
                      setBadilForm({
                        ...badilForm,
                        sponsorDpTreatment: e.target.value as typeof badilForm.sponsorDpTreatment,
                      })
                    }
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 font-semibold"
                  >
                    <option value="CARRY_OVER_TO_REPLACEMENT">
                      Carry-Over (Alihkan DP1/DP2 ke Kandidat Badil Pengganti)
                    </option>
                    <option value="REFUND_CLAWBACK">
                      Potong / Tagih Pengembalian dari Komisi Sponsor Berikutnya
                    </option>
                    <option value="ABSORBED_BY_P3MI">
                      Ditanggung Beban Risiko P3MI (Tanpa Potong Sponsor)
                    </option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Perlakuan Pendapatan Wakalah / Agency Fee Syarikah
                  </label>
                  <select
                    value={badilForm.wakalahFeeScheme}
                    onChange={(e) =>
                      setBadilForm({
                        ...badilForm,
                        wakalahFeeScheme: e.target.value as typeof badilForm.wakalahFeeScheme,
                      })
                    }
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 font-semibold"
                  >
                    <option value="FULL_WAKALAH_FEE">
                      Wakalah Fee Utuh 100% (Melanjutkan Tagihan Slot Awal)
                    </option>
                    <option value="FREE_WARRANTY_REPLACEMENT">
                      Free Replacement Garansi (Rp 0 — Pengganti Cuma-Cuma ke Syarikah)
                    </option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Catatan Kronologi & Kesepakatan Badil
                </label>
                <textarea
                  rows={2}
                  value={badilForm.reasonNotes}
                  onChange={(e) => setBadilForm({ ...badilForm, reasonNotes: e.target.value })}
                  placeholder="Contoh: Nomor Wakalah Musaned dialihkan ke kandidat pengganti atas persetujuan Syarikah..."
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                />
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => setShowBadilModal(false)}
                  className="rounded-lg border border-slate-200 px-4 py-2 font-semibold text-slate-600"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-amber-500 px-5 py-2 font-bold text-slate-950 hover:bg-amber-400"
                >
                  Eksekusi Pergantian Badil Sekarang
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================
          MODAL TAMBAH MASTER AGENSI MITRA LUAR NEGERI / SYARIKAH
         ========================================================= */}
      {showAddAgencyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900">
              Tambah Master Agensi Mitra Luar Negeri / Syarikah
            </h3>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const { data } = await callApi("CREATE_FOREIGN_AGENCY", newAgencyForm);
                if (data.ok) {
                  setShowAddAgencyModal(false);
                  setToast({
                    type: "success",
                    title: `Agensi/Syarikah "${data.agency.name}" Berhasil Ditambahkan`,
                  });
                }
              }}
              className="mt-4 space-y-3 text-xs"
            >
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Negara Tujuan *</label>
                  <select
                    value={newAgencyForm.country}
                    onChange={(e) =>
                      setNewAgencyForm({
                        ...newAgencyForm,
                        country: e.target.value as DestinationCountry,
                      })
                    }
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 font-semibold"
                  >
                    <option value="Arab Saudi">Arab Saudi (SPSK / Musaned)</option>
                    <option value="Uni Emirat Arab (UAE)">Uni Emirat Arab (UAE)</option>
                    <option value="Kuwait">Kuwait</option>
                    <option value="Oman">Oman</option>
                    <option value="Yordania">Yordania (QIZ)</option>
                    <option value="Taiwan">Taiwan</option>
                    <option value="Hong Kong">Hong Kong</option>
                    <option value="Jepang">Jepang (SSW)</option>
                    <option value="Singapura">Singapura</option>
                    <option value="Malaysia">Malaysia</option>
                    <option value="Korea Selatan">Korea Selatan</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    No. Lisensi / Wakalah / Musaned *
                  </label>
                  <input
                    type="text"
                    required
                    value={newAgencyForm.licenseOrWakalahNo}
                    onChange={(e) =>
                      setNewAgencyForm({ ...newAgencyForm, licenseOrWakalahNo: e.target.value })
                    }
                    placeholder="MUSANED-SA-2026-XXXX"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono"
                  />
                </div>
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Nama Resmi Agensi / Syarikah *
                </label>
                <input
                  type="text"
                  required
                  value={newAgencyForm.name}
                  onChange={(e) => setNewAgencyForm({ ...newAgencyForm, name: e.target.value })}
                  placeholder="Contoh: Saudi Manpower Solutions Co. (SMASCO)"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Standar Wakalah/Agency Fee (Rp)
                  </label>
                  <input
                    type="number"
                    value={newAgencyForm.defaultAgencyFeeIdr}
                    onChange={(e) =>
                      setNewAgencyForm({
                        ...newAgencyForm,
                        defaultAgencyFeeIdr: Number(e.target.value),
                      })
                    }
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Masa Garansi Badil (Hari)
                  </label>
                  <input
                    type="number"
                    value={newAgencyForm.warrantyDays}
                    onChange={(e) =>
                      setNewAgencyForm({
                        ...newAgencyForm,
                        warrantyDays: Number(e.target.value),
                      })
                    }
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Nama PIC Agensi</label>
                  <input
                    type="text"
                    value={newAgencyForm.picName}
                    onChange={(e) =>
                      setNewAgencyForm({ ...newAgencyForm, picName: e.target.value })
                    }
                    className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Tanggal Berakhir MOU
                  </label>
                  <input
                    type="date"
                    value={newAgencyForm.mouExpiryDate}
                    onChange={(e) =>
                      setNewAgencyForm({ ...newAgencyForm, mouExpiryDate: e.target.value })
                    }
                    className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddAgencyModal(false)}
                  className="rounded-lg border border-slate-200 px-4 py-2 font-semibold text-slate-600"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-slate-900 px-4 py-2 font-bold text-white"
                >
                  Simpan Master Agensi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================
          MODAL TAMBAH MASTER SPONSOR / PEREKRUT LAPANGAN (PL)
         ========================================================= */}
      {showAddSponsorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900">
              Tambah Master Sponsor / Perekrut Lapangan (PL)
            </h3>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const { data } = await callApi("CREATE_SPONSOR", newSponsorForm);
                if (data.ok) {
                  setShowAddSponsorModal(false);
                  setToast({
                    type: "success",
                    title: `Sponsor "${data.sponsor.name}" (${data.sponsor.code}) Ditambahkan`,
                  });
                }
              }}
              className="mt-4 space-y-3 text-xs"
            >
              <div>
                <label className="font-bold text-slate-700 block mb-1">Nama Lengkap Sponsor *</label>
                <input
                  type="text"
                  required
                  value={newSponsorForm.name}
                  onChange={(e) => setNewSponsorForm({ ...newSponsorForm, name: e.target.value })}
                  placeholder="Contoh: H. Dedi Kusnadi (Korlap Subang)"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Wilayah Operasional *</label>
                <input
                  type="text"
                  required
                  value={newSponsorForm.area}
                  onChange={(e) => setNewSponsorForm({ ...newSponsorForm, area: e.target.value })}
                  placeholder="Contoh: Subang & Majalengka"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Bank & No. Rekening Pencairan DP1–Pelunasan *
                </label>
                <input
                  type="text"
                  required
                  value={newSponsorForm.bankAccount}
                  onChange={(e) =>
                    setNewSponsorForm({ ...newSponsorForm, bankAccount: e.target.value })
                  }
                  placeholder="BRI 0192-01-009281-50-2 a.n Dedi Kusnadi"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">No. HP / WA</label>
                  <input
                    type="text"
                    value={newSponsorForm.phone}
                    onChange={(e) =>
                      setNewSponsorForm({ ...newSponsorForm, phone: e.target.value })
                    }
                    className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Standar Komisi / CPMI (Rp)
                  </label>
                  <input
                    type="number"
                    value={newSponsorForm.commissionPerCpmi}
                    onChange={(e) =>
                      setNewSponsorForm({
                        ...newSponsorForm,
                        commissionPerCpmi: Number(e.target.value),
                      })
                    }
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddSponsorModal(false)}
                  className="rounded-lg border border-slate-200 px-4 py-2 font-semibold text-slate-600"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-emerald-600 px-4 py-2 font-bold text-white"
                >
                  Simpan Master Sponsor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================
          MODAL TAMBAH MASTER KLINIK MEDICAL CHECK-UP / WAFID GCC
         ========================================================= */}
      {showAddClinicModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900">
              Tambah Master Klinik Mitra Medical Check-Up
            </h3>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const { data } = await callApi("CREATE_MEDICAL_CLINIC", newClinicForm);
                if (data.ok) {
                  setShowAddClinicModal(false);
                  setToast({
                    type: "success",
                    title: `Klinik Mitra "${data.clinic.name}" Berhasil Ditambahkan`,
                  });
                }
              }}
              className="mt-4 space-y-3 text-xs"
            >
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Nama Klinik / Rumah Sakit *
                </label>
                <input
                  type="text"
                  required
                  value={newClinicForm.name}
                  onChange={(e) => setNewClinicForm({ ...newClinicForm, name: e.target.value })}
                  placeholder="Contoh: Klinik Wafid Al-Falah Jakarta"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Jenis Akreditasi</label>
                <select
                  value={newClinicForm.accreditation}
                  onChange={(e) =>
                    setNewClinicForm({
                      ...newClinicForm,
                      accreditation: e.target.value as MedicalClinicPartner["accreditation"],
                    })
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 font-semibold"
                >
                  <option value="WAFID_GCC_GAMCA">Wafid / eks-GAMCA (Khusus Timur Tengah GCC)</option>
                  <option value="KEMENKES_RI_ASIA">Kemenkes RI (Asia Pasifik)</option>
                  <option value="WAFID_DAN_KEMENKES">Terakreditasi Ganda (Wafid GCC & Kemenkes RI)</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Kota Lokasi</label>
                  <input
                    type="text"
                    value={newClinicForm.city}
                    onChange={(e) => setNewClinicForm({ ...newClinicForm, city: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Tarif Standar MCU (Rp)
                  </label>
                  <input
                    type="number"
                    value={newClinicForm.standardMcuFeeIdr}
                    onChange={(e) =>
                      setNewClinicForm({
                        ...newClinicForm,
                        standardMcuFeeIdr: Number(e.target.value),
                      })
                    }
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddClinicModal(false)}
                  className="rounded-lg border border-slate-200 px-4 py-2 font-semibold text-slate-600"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-teal-600 px-4 py-2 font-bold text-white"
                >
                  Simpan Master Klinik
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================
          MODAL TAMBAH MITRA BPJS / ASURANSI / BANK KUR PMI
         ========================================================= */}
      {showAddBpjsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900">
              Tambah Mitra BPJS, Asuransi atau Bank Penyalur KUR PMI
            </h3>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const { data } = await callApi("CREATE_BPJS_FINANCING", newBpjsForm);
                if (data.ok) {
                  setShowAddBpjsModal(false);
                  setToast({
                    type: "success",
                    title: `Mitra "${data.partner.name}" Berhasil Ditambahkan`,
                  });
                }
              }}
              className="mt-4 space-y-3 text-xs"
            >
              <div>
                <label className="font-bold text-slate-700 block mb-1">Kategori Mitra</label>
                <select
                  value={newBpjsForm.partnerType}
                  onChange={(e) =>
                    setNewBpjsForm({
                      ...newBpjsForm,
                      partnerType: e.target.value as BpjsFinancingPartner["partnerType"],
                    })
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 font-semibold"
                >
                  <option value="BPJS_KETENAGAKERJAAN">BPJS Ketenagakerjaan PMI</option>
                  <option value="ASURANSI_PMI">Konsorsium Asuransi PMI</option>
                  <option value="BANK_KUR_PMI">Bank Penyalur KUR PMI / Payroll</option>
                </select>
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Nama Instansi / Bank *</label>
                <input
                  type="text"
                  required
                  value={newBpjsForm.name}
                  onChange={(e) => setNewBpjsForm({ ...newBpjsForm, name: e.target.value })}
                  placeholder="Contoh: Bank Mandiri — KUR Pekerja Migran Indonesia"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Skema / Paket Program *</label>
                <input
                  type="text"
                  required
                  value={newBpjsForm.programPackage}
                  onChange={(e) =>
                    setNewBpjsForm({ ...newBpjsForm, programPackage: e.target.value })
                  }
                  placeholder="Contoh: Pembiayaan KUR PMI Penempatan Jepang & Taiwan"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Tarif Premi / Plafon & Bunga *
                </label>
                <input
                  type="text"
                  required
                  value={newBpjsForm.premiumOrRateInfo}
                  onChange={(e) =>
                    setNewBpjsForm({ ...newBpjsForm, premiumOrRateInfo: e.target.value })
                  }
                  placeholder="Contoh: Plafon s/d Rp 50 Juta · Bunga 6% p.a."
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddBpjsModal(false)}
                  className="rounded-lg border border-slate-200 px-4 py-2 font-semibold text-slate-600"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-purple-600 px-4 py-2 font-bold text-white"
                >
                  Simpan Mitra
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================
          MODAL TAMBAH KANTOR CABANG P3MI BARU
         ========================================================= */}
      {showAddBranchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900">
              Tambah Kantor Cabang Daerah / BLK-LN P3MI
            </h3>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const { data } = await callApi("CREATE_BRANCH", newBranchForm);
                if (data.ok) {
                  setShowAddBranchModal(false);
                  setToast({
                    type: "success",
                    title: `Kantor Cabang "${data.branch.name}" Berhasil Ditambahkan`,
                  });
                }
              }}
              className="mt-4 space-y-3 text-xs"
            >
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Kode Cabang *</label>
                  <input
                    type="text"
                    required
                    value={newBranchForm.code}
                    onChange={(e) => setNewBranchForm({ ...newBranchForm, code: e.target.value })}
                    placeholder="Contoh: CBG-CRB"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Kota / Kabupaten *</label>
                  <input
                    type="text"
                    required
                    value={newBranchForm.city}
                    onChange={(e) => setNewBranchForm({ ...newBranchForm, city: e.target.value })}
                    placeholder="Contoh: Cirebon"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  />
                </div>
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Nama Kantor Cabang *</label>
                <input
                  type="text"
                  required
                  value={newBranchForm.name}
                  onChange={(e) => setNewBranchForm({ ...newBranchForm, name: e.target.value })}
                  placeholder="Contoh: Cabang Cirebon & Kuningan"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Nama Kepala Cabang *</label>
                <input
                  type="text"
                  required
                  value={newBranchForm.headName}
                  onChange={(e) =>
                    setNewBranchForm({ ...newBranchForm, headName: e.target.value })
                  }
                  placeholder="Contoh: H. Asep Hidayat, S.Sos."
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">No. Telepon Kantor</label>
                <input
                  type="text"
                  value={newBranchForm.phone}
                  onChange={(e) => setNewBranchForm({ ...newBranchForm, phone: e.target.value })}
                  placeholder="0231-xxxxxx"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddBranchModal(false)}
                  className="rounded-lg border border-slate-200 px-4 py-2 font-semibold text-slate-600"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-slate-900 px-4 py-2 font-bold text-white"
                >
                  Simpan Kantor Cabang
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
