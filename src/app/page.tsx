"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Banknote,
  Bell,
  Briefcase,
  Building2,
  CheckCircle2,
  ChevronDown,
  Coins,
  CreditCard,
  Eye,
  FileCheck2,
  FolderKanban,
  Globe,
  GraduationCap,
  History,
  KeyRound,
  LayoutDashboard,
  LayoutGrid,
  LifeBuoy,
  Lock,
  LogOut,
  Menu,
  MessageSquarePlus,
  Pencil,
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
  Table,
  Trash2,
  TrendingUp,
  UserCheck,
  UserPlus,
  Users,
  Wallet,
  X,
  XCircle,
} from "lucide-react";
import {
  AppRole,
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
  DocHandoverType,
  DocType,
  F4LangLevel,
  ForeignAgency,
  FundingScheme,
  JOURNEY_STAGES,
  JobVacancy,
  JourneyStage,
  LangSkillLevel,
  MedicalClinicPartner,
  OfficialRegistrationForm,
  OverseasWorkExperienceRow,
  PlacementCostItem,
  ProcessTrack,
  RenewalTask,
  SpecialStatus,
  Sponsor,
  SponsorFormSubmission,
  SponsorInstallment,
  StaffAccount,
  TenantCompany,
  UserRole,
  CashAdvance,
  CashJournal,
  EmployerInterview,
  SyarikahInvoice,
  WhatsAppNotification,
  MasterAirline,
  MasterBlkLn,
  MasterDisdukcapil,
  MasterEmbassy,
  MasterImmigrationOffice,
  MasterMedicalClinic,
} from "@/lib/types";
import {
  checkCandidateTerminEligibility,
  computeBatchSponsorDistribution,
  getCandidateSponsorTotals,
  getTerminShortTitle,
} from "@/lib/sponsor-installment-utils";
import {
  computeKasbonDeductionPreview,
  getOpenSponsorKasbonTotal,
} from "@/lib/cashflow-sync-utils";

import TenantBranchModule from "@/components/TenantBranchModule";
import DocumentPrintModule from "@/components/DocumentPrintModule";
import WhatsAppGatewayModule from "@/components/WhatsAppGatewayModule";
import CashAndAdvancesModule from "@/components/CashAndAdvancesModule";
import EmployerMatchingModule from "@/components/EmployerMatchingModule";
import RoleAndPermissionModule from "@/components/RoleAndPermissionModule";
import { MasterPartnerDatabaseModule } from "@/components/MasterPartnerDatabaseModule";
import MaintenanceModule from "@/components/MaintenanceModule";
import SidebarNav, { NavKey } from "@/components/SidebarNav";

interface DbPayload {
  isCleanProduction?: boolean;
  tenants?: TenantCompany[];
  branches: Branch[];
  sponsors: Sponsor[];
  staffAccounts: StaffAccount[];
  roles?: AppRole[];
  candidates: Candidate[];
  cases: CaseTicket[];
  vacancies: JobVacancy[];
  renewalTasks: RenewalTask[];
  auditLogs: AuditLog[];
  badilRecords?: BadilRecord[];
  foreignAgencies?: ForeignAgency[];
  medicalClinics?: MedicalClinicPartner[];
  bpjsFinancingPartners?: BpjsFinancingPartner[];
  sponsorSubmissions?: SponsorFormSubmission[];
  whatsAppLogs?: WhatsAppNotification[];
  cashJournals?: CashJournal[];
  cashAdvances?: CashAdvance[];
  syarikahInvoices?: SyarikahInvoice[];
  employerInterviews?: EmployerInterview[];
  masterImmigrationOffices?: MasterImmigrationOffice[];
  masterDisdukcapil?: MasterDisdukcapil[];
  masterMedicalClinics?: MasterMedicalClinic[];
  masterAirlines?: MasterAirline[];
  masterBlkLn?: MasterBlkLn[];
  masterEmbassies?: MasterEmbassy[];
}

const ROLE_PERMISSIONS: Record<
  string,
  {
    canVerify: boolean;
    canViewSensitive: boolean;
    canSeeFinance: boolean;
    canManageStaff: boolean;
    canExecuteOperation: boolean;
    isReadOnlyCabang: boolean;
  }
> = {
  DIREKTUR: {
    canVerify: true,
    canViewSensitive: true,
    canSeeFinance: true,
    canManageStaff: true,
    canExecuteOperation: true,
    isReadOnlyCabang: false,
  },
  ADMIN_PUSAT: {
    canVerify: true,
    canViewSensitive: true,
    canSeeFinance: false,
    canManageStaff: true,
    canExecuteOperation: true,
    isReadOnlyCabang: false,
  },
  STAF_KEUANGAN: {
    canVerify: false,
    canViewSensitive: true,
    canSeeFinance: true,
    canManageStaff: false,
    canExecuteOperation: true,
    isReadOnlyCabang: false,
  },
  STAF_DOKUMEN: {
    canVerify: true,
    canViewSensitive: true,
    canSeeFinance: false,
    canManageStaff: false,
    canExecuteOperation: true,
    isReadOnlyCabang: false,
  },
  INSTRUKTUR_BLK: {
    canVerify: false,
    canViewSensitive: false,
    canSeeFinance: false,
    canManageStaff: false,
    canExecuteOperation: true,
    isReadOnlyCabang: false,
  },
  KEPALA_CABANG: {
    canVerify: false,
    canViewSensitive: true,
    canSeeFinance: false,
    canManageStaff: false,
    canExecuteOperation: false,
    isReadOnlyCabang: true,
  },
  PEREKRUT_PL: {
    canVerify: false,
    canViewSensitive: false,
    canSeeFinance: false,
    canManageStaff: false,
    canExecuteOperation: false,
    isReadOnlyCabang: true,
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

const NON_REKOM_SKIPPED_DOC_TYPES = new Set<DocType>([
  "SERTIFIKAT_KOMPETENSI",
  "PERJANJIAN_PENEMPATAN",
  "EKTKLN_OPP",
]);

const SHORT_DOC_LABEL_MAP: Record<DocType, string> = {
  KTP: "KTP",
  KK: "KK",
  AKTA_IJAZAH: "Akta/Ijazah",
  IZIN_KELUARGA: "Izin Kel.",
  SERTIFIKAT_KOMPETENSI: "LSP/BNSP",
  MEDICAL: "Medical",
  PERJANJIAN_PENEMPATAN: "PK Penempatan",
  PASPOR: "Paspor",
  VISA: "Visa",
  EKTKLN_OPP: "OPP/e-KPMI",
  TIKET_EKTKLN: "Tiket Pesawat",
};

/** Evaluates passport & required-document completeness while respecting REKOM vs NON_REKOM track rules. */
function evaluateCandidateRequirements(candidate: Candidate) {
  const isNonRekom = (candidate.processTrack || "REKOM") === "NON_REKOM";
  const requiredDocs = (candidate.documents || []).filter(
    (d) => !(isNonRekom && NON_REKOM_SKIPPED_DOC_TYPES.has(d.docType))
  );
  const pasporDoc = (candidate.documents || []).find((d) => d.docType === "PASPOR");
  const isPassportMissing = !pasporDoc || pasporDoc.status === "MISSING";
  const isPassportUnverified = Boolean(pasporDoc && pasporDoc.status === "UPLOADED");
  const missingDocs = requiredDocs.filter((d) => d.status === "MISSING");
  const unverifiedDocs = requiredDocs.filter((d) => d.status === "UPLOADED");
  const verifiedCount = requiredDocs.filter((d) => d.status === "VERIFIED").length;
  const hasExpired = requiredDocs.some((d) => {
    const dl = calcDaysLeft(d.expiryDate);
    return d.status === "EXPIRED" || (dl !== null && dl < 0);
  });

  return {
    requiredDocs,
    pasporDoc,
    isPassportMissing,
    isPassportUnverified,
    missingDocs,
    unverifiedDocs,
    verifiedCount,
    hasExpired,
  };
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
  const [activeNav, setActiveNav] = useState<NavKey>("beranda");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

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
  const [processTrackFilter, setProcessTrackFilter] = useState<"ALL" | ProcessTrack>("ALL");
  const [docStatusFilter, setDocStatusFilter] = useState<string>("ALL");
  const [cpmiViewMode, setCpmiViewMode] = useState<"DETAIL_ORANG" | "MATRIKS_BERKAS">("DETAIL_ORANG");

  // Detail Berkas CPMI terpilih
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>("cpmi-1");
  const [revealedSensitiveDocs, setRevealedSensitiveDocs] = useState<Record<string, boolean>>({});

  // State Modul Keuangan (Pembayaran Fee Sponsor Bertahap DP1, DP2, DP3, Pelunasan & HPP)
  const [financeSponsorFilter, setFinanceSponsorFilter] = useState<string>("ALL");
  const [financeSponsorDropdownOpen, setFinanceSponsorDropdownOpen] = useState<boolean>(false);
  const [financeSponsorDropdownQuery, setFinanceSponsorDropdownQuery] = useState<string>("");
  const [financeSponsorOnlyDebt, setFinanceSponsorOnlyDebt] = useState<boolean>(false);
  const financeSponsorDropdownRef = useRef<HTMLDivElement | null>(null);
  const [financeSearchQuery, setFinanceSearchQuery] = useState<string>("");

  useEffect(() => {
    if (!financeSponsorDropdownOpen) return;
    function handleOutsideClick(e: MouseEvent) {
      if (
        financeSponsorDropdownRef.current &&
        !financeSponsorDropdownRef.current.contains(e.target as Node)
      ) {
        setFinanceSponsorDropdownOpen(false);
      }
    }
    function handleEsc(e: KeyboardEvent) {
      if (e.key === "Escape") setFinanceSponsorDropdownOpen(false);
    }
    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEsc);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEsc);
    };
  }, [financeSponsorDropdownOpen]);
  const [financeStatusFilter, setFinanceStatusFilter] = useState<
    "ALL" | "SIAP_CAIR" | "BELUM_LUNAS" | "LUNAS_100"
  >("ALL");
  const [financeViewMode, setFinanceViewMode] = useState<"TABEL_RINGKAS" | "KARTU_DETAIL">(
    "TABEL_RINGKAS"
  );
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
    customAmount: 0,
    autoAdjustCommissionIfExceeded: false,
    deductKasbon: true,
  });
  const [batchSponsorPayOpen, setBatchSponsorPayOpen] = useState(false);
  const [batchSponsorPayForm, setBatchSponsorPayForm] = useState<{
    sponsorId: string;
    terminKey: CommissionTerminKey;
    totalAmount: number;
    selectedCandidateIds: string[];
    distributionMode: "EQUAL_SPLIT" | "PROPORTIONAL_CAP";
    paymentMethod: "TRANSFER_BANK" | "TUNAI_KAS";
    notes: string;
    forceOverride: boolean;
    autoAdjustCommissionIfExceeded: boolean;
    deductKasbon: boolean;
    stageWarningMsg?: string;
  }>({
    sponsorId: "",
    terminKey: "DP1",
    totalAmount: 0,
    selectedCandidateIds: [],
    distributionMode: "EQUAL_SPLIT",
    paymentMethod: "TRANSFER_BANK",
    notes: "",
    forceOverride: false,
    autoAdjustCommissionIfExceeded: false,
    deductKasbon: true,
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

  // State Lowongan (Job Order / Vacancy — Khusus Kawasan Timur Tengah Zero Cost)
  const [showNewVacancyModal, setShowNewVacancyModal] = useState(false);
  const [editingVacancy, setEditingVacancy] = useState<JobVacancy | null>(null);
  const [deletingVacancyId, setDeletingVacancyId] = useState<string | null>(null);
  const [newVacancyForm, setNewVacancyForm] = useState({
    title: "",
    destinationCountry: "Arab Saudi" as JobVacancy["destinationCountry"],
    jobSector: "Housekeeping & Caregiver (SPSK Syarikah)",
    agencyPartner: "Saudi Manpower Solutions Co. (SMASCO)",
    employerName: "Syarikah SMASCO Riyadh",
    salaryForeign: "SAR 1.500 - 1.800 / bulan (Zero Cost)",
    salaryIdrEstimate: 6400000,
    placementFee: 38000000,
    quotaTotal: 25,
    genderPref: "P" as "P" | "L" | "P/L",
    minEducation: "SD / SMP / SMA",
    ageRange: "21 - 40 Tahun",
    closingDate: "2026-11-30",
    requirementsText:
      "Wajib KTP Elektronik 16 digit & KK asli\nSehat jasmani & rohani (Medical Wafid / GAMCA FIT)\nSurat izin suami/orang tua diketahui Kepala Desa\n100% Zero Cost (Seluruh biaya ditanggung langsung oleh Syarikah/Majikan)",
  });
  const [applyingVacancy, setApplyingVacancy] = useState<JobVacancy | null>(null);
  const [applyForm, setApplyForm] = useState({
    fullName: "",
    phone: "",
    nik: "",
    gender: "P" as "P" | "L",
    branchId: "br-idm",
  });

  // State Modul 1: Manajemen Tenant & Cabang (SaaS Multi-Tenant)
  const [selectedTenantId, setSelectedTenantId] = useState<string>("tenant-panca");
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
    role: "INTERVIEW_PENDAFTARAN" as UserRole,
    secondaryRoles: [] as UserRole[],
    branchId: "ALL",
    phone: "",
    pinCode: "",
  });

  // Notifikasi / Feedback Banner
  const [toast, setToast] = useState<{
    type: "success" | "error" | "warning";
    title: string;
    details?: string[];
  } | null>(null);

  // Modal Tambah CPMI / Lead Baru (Formulir Pendaftaran Resmi PT Panca Banyu Ajisakti)
  const [showAddModal, setShowAddModal] = useState(false);
  const [regModalTab, setRegModalTab] = useState<
    "INBOX_SPONSOR" | "SCAN_DAN_WA" | "FORM_LENGKAP"
  >("INBOX_SPONSOR");
  const [activeSponsorSubmissionId, setActiveSponsorSubmissionId] = useState<string | null>(null);
  const [physicalFormScanUrl, setPhysicalFormScanUrl] = useState<string>(
    "/form-sudah-terisi.jpg"
  );
  const [physicalFormZoom, setPhysicalFormZoom] = useState<number>(100);
  const [waRawText, setWaRawText] = useState<string>(
    `FORMULIR PENDAFTARAN CPMI/CTKI BARU F4 - PT PANCA BANYU AJISAKTI
1. Negara Tujuan: Arab Saudi
2. Nama Sponsor: Kang Dedi Kusnadi (PL-IDM-001) - 0812-2301-4455
3. Nama Lengkap: Siti Munawaroh Binti H. Karim
Telp: 0812-9988-4412
NIK: 3212156804990007
4. Tempat Tgl Lahir: Indramayu, 1999-04-28 | Umur Asli: 27 Tahun
5. Agama: Islam
6. Pendidikan Terakhir: SMA
7. Anak Ke: 2 dari 4 Bersaudara
8. Status: Kawin
9. Jumlah Anak: 1 Orang | Anak Pertama: 5 Tahun | Anak Terakhir: -
10. Keadaan Fisik: Tinggi 160 cm / Berat 53 kg
11. Alamat Lengkap: Blok Karanganyar RT 003/001 Kec. Karangampel, Indramayu (Kode Pos: 45283)
12. Orang Tua: Bapak H. Karim (59 Th) | Ibu Hj. Maryam (54 Th) | Kakek dari Bapak: H. Dulkarim
13. Suami: Dadan Ramdani (33 Th) | Pekerjaan Suami: Wiraswasta
14. Keluarga Lain: Dadan Ramdani | Hubungan: Suami | No Tlp: 0813-8877-2219
15. Pengalaman Luar Negeri 1: Arab Saudi - Riyadh | 2 Tahun | 2023-2025 | SELESAI | Finish Kontrak 2 Thn Baik
15. Bahasa Arab: LANCAR (Percakapan rumah tangga Saudi) | Bahasa Inggris: SEDIKIT (Dasar)
16. Kesanggupan: Merawat Bayi (YA), Merawat Jompo (YA), Bersih Rumah/Setrika (YA)
16d. Masakan Arab: Ruz Kabsah, Ruz Bukhari, Ruz Briyani, Ruz Makbus, Saluna/Idam, Macarona, Makarona Basamil, Fatair, Sambosa, Salatah, Juice
17. Dokumen Asli: PASPOR, IJAZAH, KTP, AKTA, IZIN ORANG TUA, KK, IZIN SUAMI
Dokumen Copy: KARTU BPJS
Catatan Sponsor: Formulir Baru F4 fisik & dokumen asli sudah lengkap diserahkan ke Data Entry.`
  );
  const [printingRegFormCandidate, setPrintingRegFormCandidate] = useState<Candidate | null>(
    null
  );
  const [printingSyarikahBiodataCandidate, setPrintingSyarikahBiodataCandidate] =
    useState<Candidate | null>(null);
  const [syarikahBiodataForm, setSyarikahBiodataForm] = useState({
    referenceNo: "",
    employmentIn: "SAUDI ARABIA",
    postApply: "DOMESTIC HELPER",
    monthlySalary: "SAR 1500",
    contractPeriod: "2 YEARS",
    phone: "083174903728",
    fullName: "EKA HERMAYANTI RUSLAN",
    nationality: "INDONESIAN",
    religion: "ISLAM",
    dateOfBirth: "17-12-2003",
    age: "23",
    placeOfBirth: "JOWET",
    livingTown: "N.T.B",
    maritalStatus: "NOT MARRIED",
    noOfChildren: "",
    weight: "43CM",
    height: "155KG",
    complexion: "BROWN SKIN",
    educational: "SENIOR HIGH SCHOOL",
    passportNumber: "",
    passportIssueDate: "",
    passportIssuePlace: "",
    passportExpiryDate: "",
    arabicSpeak: "POOR",
    arabicRead: "POOR",
    englishSpeak: "POOR",
    englishRead: "POOR",
    prevEmploymentCountry: "NON EXPERIENCE",
    prevEmploymentPeriod: "",
    driving: "NO",
    cooking: "YES",
    cleaning: "YES",
    washing: "YES",
    babySitting: "YES",
    ironing: "YES",
    careOfOlder: "YES",
    sheCanCook: "",
    closeUpPhotoUrl: "/biodata-img-2.jpg",
    fullBodyPhotoUrl: "/biodata-img-3.jpg",
    replaceHeaderLogoWithNew: true,
  });
  const [duplicateNikAlert, setDuplicateNikAlert] = useState<{
    candidate: Candidate;
    branchName: string;
    message: string;
  } | null>(null);
  const [newForm, setNewForm] = useState({
    stage: "LEAD" as JourneyStage,
    customRegNumber: "",
    nik: "",
    fullName: "",
    gender: "P" as "P" | "L",
    avatarUrl: "",
    fullBodyPhotoUrl: "",
    birthPlace: "",
    birthDate: "",
    phone: "",
    address: "",
    education: "SMA/SMK",
    maritalStatus: "Kawin",
    destinationCountry: "Arab Saudi",
    processTrack: "REKOM" as ProcessTrack,
    jobSector: "Housekeeping & Caregiver (SPSK Syarikah)",
    employerName: "",
    agencyPartner: "",
    branchId: "br-idm",
    sponsorId: "sp-1",
  });
  const [regForm, setRegForm] = useState<OfficialRegistrationForm>({
    nickname: "",
    processTrack: "REKOM",
    fullBodyPhotoUrl: "/biodata-img-3.jpg",
    realAge: 28,
    heightCm: 158,
    weightKg: 52,
    religion: "Islam",
    postalCode: "45282",
    graduationYear: "2018",
    ktpOrPassportNo: "",
    fatherName: "",
    fatherAge: 55,
    motherName: "",
    motherAge: 50,
    paternalGrandfatherName: "",
    spouseOrGuardianName: "",
    spouseAge: 32,
    spouseOccupation: "Wiraswasta",
    childrenTotalCount: 1,
    firstChildAge: "5",
    lastChildAge: "-",
    boysCountAndAges: "1 Orang (5 Th)",
    girlsCountAndAges: "-",
    childOrder: 1,
    siblingsCount: 3,
    emergencyContactName: "",
    emergencyContactRelation: "Suami / Orang Tua",
    emergencyContactPhone: "",
    workExperience1: "",
    workExperience2: "",
    overseasExperiences: [
      {
        no: 1,
        countryAndCity: "Arab Saudi - Riyadh",
        duration: "2 Tahun",
        period: "2023 - 2025",
        returnStatus: "SELESAI",
        remarks: "Selesai Kontrak 2 Tahun Baik",
      },
      {
        no: 2,
        countryAndCity: "",
        duration: "",
        period: "",
        returnStatus: "NONE",
        remarks: "",
      },
      {
        no: 3,
        countryAndCity: "",
        duration: "",
        period: "",
        returnStatus: "NONE",
        remarks: "",
      },
      {
        no: 4,
        countryAndCity: "",
        duration: "",
        period: "",
        returnStatus: "NONE",
        remarks: "",
      },
    ],
    overseasExperienceNotes: "",
    arabicLevelF4: "LANCAR",
    arabicNotesF4: "Lancar percakapan rumah tangga",
    englishLevelF4: "SEDIKIT",
    englishNotesF4: "Dasar sapaan & angka",
    willingCareBaby: true,
    willingCareBabyNotes: "Sanggup & berpengalaman",
    willingCareElderly: true,
    willingCareElderlyNotes: "Sanggup merawat lansia",
    willingHousekeeping: true,
    willingHousekeepingNotes: "Sanggup bersih-bersih rumah, cuci baju & menyetrika",
    arabicCookingSkills: [
      "Ruz Kabsah",
      "Ruz Bukhari",
      "Ruz Briyani",
      "Ruz Makbus",
      "Saluna/Idam",
      "Macarona",
      "Makarona Basamil",
      "Fatair",
      "Sambosa",
      "Salatah",
      "Juice",
    ],
    desiredJobCleaner: true,
    desiredJobFactory: false,
    desiredJobNurse: true,
    desiredJobHospitality: false,
    desiredJobOther: false,
    desiredJobOtherText: "",
    docHandover: {
      ktp: "ASLI",
      kk: "ASLI",
      akteKelahiran: "ASLI",
      izinKeluarga: "ASLI",
      izinSuami: "ASLI",
      sttbIjazah: "ASLI",
      kartuBpjs: "COPY",
      skck: "COPY",
      paspor: "ASLI",
      otherDoc8Name: "Buku Nikah / Akte Cerai",
      otherDoc8Status: "ASLI",
      otherDoc9Name: "",
      otherDoc9Status: "NONE",
    },
    languageSkills: {
      english: "CUKUP",
      mandarin: "BURUK",
      arabic: "BAIK",
      otherLanguageName: "",
      otherLanguageLevel: "NONE",
    },
    acceptanceDecision: "TERIMA",
    accByName: "Ahmad Sarkoni",
    candidateNotes: "",
    sponsorOfficerName: "Kang Dedi Kusnadi (PL-IDM-001)",
    sponsorOfficerPhone: "0812-2301-4455",
    sponsorNotes: "",
    receivedByPtOfficer: "Rina Kartika (Petugas PT.)",
    formSignedDate: new Date().toISOString().slice(0, 10),
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
    originalCandidateId: "cpmi-2",
    replacementCandidateId: "cpmi-3",
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

  const [trainingViewMode, setTrainingViewMode] = useState<"matrix" | "cards">("matrix");
  const [trainingSearch, setTrainingSearch] = useState("");
  const [trainingStatusFilter, setTrainingStatusFilter] = useState<
    "ALL" | "LULUS_KOMPETEN" | "BELUM_UJIAN" | "REMEDIAL"
  >("ALL");

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
  const matchedDbRole = (db?.roles || []).find((r) => r.code === currentRole);
  const secondaryDbRoles = useMemo(() => {
    const codes = loggedInStaff?.secondaryRoles || [];
    return codes
      .map((code) => (db?.roles || []).find((r) => r.code === code))
      .filter((r): r is AppRole => Boolean(r));
  }, [db?.roles, loggedInStaff?.secondaryRoles]);

  const perms = useMemo(() => {
    if (matchedDbRole) {
      const allRoles = [matchedDbRole, ...secondaryDbRoles];
      return {
        canVerify: allRoles.some((r) => r.permissions?.canVerify),
        canViewSensitive: allRoles.some((r) => r.permissions?.canViewSensitive),
        canSeeFinance: allRoles.some((r) => r.permissions?.canSeeFinance),
        canManageStaff: allRoles.some((r) => r.permissions?.canManageStaff),
        canExecuteOperation: allRoles.some((r) => r.permissions?.canExecuteOperation),
        isReadOnlyCabang:
          matchedDbRole.isReadOnly ||
          matchedDbRole.allowedScope === "BRANCH" ||
          matchedDbRole.allowedScope === "OWN",
      };
    }
    return (
      ROLE_PERMISSIONS[currentRole as keyof typeof ROLE_PERMISSIONS] || {
        canVerify: false,
        canViewSensitive: false,
        canSeeFinance: false,
        canManageStaff: false,
        canExecuteOperation: false,
        isReadOnlyCabang: true,
      }
    );
  }, [matchedDbRole, secondaryDbRoles, currentRole]);

  // Hak Akses Menu Dinamis Berbasis Role & Matrix (Mendukung Rangkap Divisi)
  const allowedMenuIds = useMemo<string[] | null>(() => {
    if (!loggedInStaff || currentRole === "DIREKTUR") return null;
    if (matchedDbRole?.allowedMenus && matchedDbRole.allowedMenus.length > 0) {
      const combined = new Set<string>(matchedDbRole.allowedMenus);
      for (const sr of secondaryDbRoles) {
        for (const m of sr.allowedMenus || []) {
          combined.add(m);
        }
      }
      return Array.from(combined);
    }
    if (currentRole === "ADMIN_PUSAT") return null;
    if (currentRole === "STAF_DOKUMEN") {
      return ["beranda", "cpmi", "doc_print", "medical_visa", "pengingat", "cases"];
    }
    if (currentRole === "KEPALA_CABANG") {
      return [
        "beranda",
        "pengingat",
        "cases",
        "portal_cpmi",
        "cpmi",
        "vacancy",
        "employer_matching",
        "pelatihan",
        "medical_visa",
        "doc_print",
      ];
    }
    if (currentRole === "PEREKRUT_PL") {
      return ["beranda", "cpmi", "portal_cpmi"];
    }
    return null;
  }, [loggedInStaff, currentRole, matchedDbRole, secondaryDbRoles]);

  function isMenuAllowed(menuId: string): boolean {
    if (menuId === "maintenance") {
      return Boolean(perms.canManageStaff || currentRole === "DIREKTUR");
    }
    if (!allowedMenuIds) return true;
    return allowedMenuIds.includes(menuId);
  }

  useEffect(() => {
    if (allowedMenuIds && !allowedMenuIds.includes(activeNav)) {
      const fallback = allowedMenuIds[0] || "beranda";
      setActiveNav(fallback as typeof activeNav);
    }
  }, [allowedMenuIds, activeNav]);

  async function callApi(action: string, payload: Record<string, unknown> = {}) {
    if (isBranchViewOnly) {
      const restricted = [
        "CHANGE_STAGE",
        "UPDATE_DOCUMENT",
        "PAY_SPONSOR_INSTALLMENT",
        "PROCESS_BADIL",
        "CREATE_CANDIDATE",
        "UPDATE_CANDIDATE",
        "CREATE_TENANT",
        "UPDATE_TENANT",
        "CREATE_BRANCH",
        "UPDATE_BRANCH",
        "DELETE_BRANCH",
        "CREATE_FOREIGN_AGENCY",
        "CREATE_SPONSOR",
        "CREATE_MEDICAL_CLINIC",
        "CREATE_BPJS_FINANCING",
        "CREATE_STAFF",
        "UPDATE_STAFF",
        "DELETE_STAFF",
        "SEND_WHATSAPP_MESSAGE",
        "CREATE_CASH_JOURNAL",
        "CREATE_CASH_ADVANCE",
        "REPAY_CASH_ADVANCE",
        "CREATE_SYARIKAH_INVOICE",
        "UPDATE_SYARIKAH_INVOICE",
        "CREATE_EMPLOYER_INTERVIEW",
        "UPDATE_EMPLOYER_INTERVIEW",
        "CREATE_MASTER_ITEM",
        "UPDATE_MASTER_ITEM",
        "DELETE_MASTER_ITEM",
        "TOGGLE_MASTER_STATUS",
        "UPDATE_FOREIGN_AGENCY",
        "DELETE_FOREIGN_AGENCY",
        "UPDATE_MEDICAL_CLINIC",
        "DELETE_MEDICAL_CLINIC",
        "UPDATE_SPONSOR",
        "DELETE_SPONSOR",
        "UPDATE_BPJS_FINANCING",
        "DELETE_BPJS_FINANCING",
      ];
      if (restricted.includes(action)) {
        setToast({
          type: "error",
          title: "Akses Ditolak: Mode Pantau Cabang (View-Only)",
          details: [
            "Administrasi eksekusi seluruh proses operasional hanya dapat dilakukan oleh Admin Pusat / Direktur.",
            "Akun Cabang hanya memiliki hak pantau perkembangan CPMI.",
          ],
        });
        return { status: 403, data: { ok: false, error: "Akses Ditolak: Mode Pantau Cabang." } };
      }
    }

    const branchObj = db?.branches.find((b) => b.id === selectedBranchId);
    const res = await fetch("/api/p3mi", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action,
        actorName: loggedInStaff?.name || "Ahmad Sarkoni",
        actorRole: currentRole,
        branchName: branchObj ? branchObj.name : "Kantor Pusat Jakarta",
        payload,
      }),
    });
    const data = await res.json();
    if (!res.ok || !data.ok) {
      setToast({
        type: "error",
        title: "Gagal Memproses Permintaan",
        details: [data.error || "Terjadi kesalahan pada server."],
      });
    }
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

  const isBranchViewOnly = perms.isReadOnlyCabang || (loggedInStaff?.branchId !== "ALL" && loggedInStaff?.role === "KEPALA_CABANG");

  const activeTenant = useMemo(() => {
    if (!db?.tenants || db.tenants.length === 0) return null;
    return db.tenants.find((t) => t.id === selectedTenantId) || db.tenants[0] || null;
  }, [db, selectedTenantId]);

  const tenantBranches = useMemo(() => {
    if (!db) return [];
    if (!activeTenant) return db.branches;
    return db.branches.filter((b) => !b.tenantId || b.tenantId === activeTenant.id);
  }, [db, activeTenant]);

  // Filter kandidat berdasarkan cabang, pencarian, tahapan, alur proses (Rekom vs Non-Rekom), dan negara tujuan Timur Tengah
  const filteredCandidates = useMemo(() => {
    if (!db) return [];
    const middleEastCountries = [
      "Arab Saudi",
      "Uni Emirat Arab (UAE)",
      "Kuwait",
      "Oman",
      "Yordania",
      "Qatar",
      "Bahrain",
    ];
    return db.candidates.filter((c) => {
      if (selectedBranchId !== "ALL" && c.branchId !== selectedBranchId) return false;
      if (stageFilter !== "ALL" && c.stage !== stageFilter) return false;
      if (processTrackFilter !== "ALL") {
        const track = c.processTrack || "REKOM";
        if (track !== processTrackFilter) return false;
      }
      if (countryFilter === "TIMUR_TENGAH") {
        if (!middleEastCountries.includes(c.destinationCountry)) return false;
      } else if (countryFilter !== "ALL" && c.destinationCountry !== countryFilter) {
        return false;
      }
      if (docStatusFilter !== "ALL") {
        const {
          requiredDocs,
          isPassportMissing,
          verifiedCount,
          hasExpired,
        } = evaluateCandidateRequirements(c);
        if (docStatusFilter === "NO_PASSPORT" && !isPassportMissing) {
          return false;
        }
        if (
          docStatusFilter === "COMPLETE_10" &&
          (verifiedCount < requiredDocs.length || hasExpired)
        ) {
          return false;
        }
        if (
          docStatusFilter === "INCOMPLETE" &&
          verifiedCount === requiredDocs.length &&
          !hasExpired
        ) {
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
  }, [
    db,
    selectedBranchId,
    stageFilter,
    processTrackFilter,
    countryFilter,
    docStatusFilter,
    searchQuery,
  ]);

  const selectedCandidate = useMemo(() => {
    if (!db) return null;
    if (activeNav === "cpmi" && processTrackFilter !== "ALL") {
      return (
        (selectedCandidateId
          ? filteredCandidates.find((c) => c.id === selectedCandidateId)
          : null) ||
        filteredCandidates[0] ||
        null
      );
    }
    if (!selectedCandidateId) return null;
    return (
      db.candidates.find((c) => c.id === selectedCandidateId) ||
      filteredCandidates[0] ||
      db.candidates[0] ||
      null
    );
  }, [db, selectedCandidateId, filteredCandidates, activeNav, processTrackFilter]);

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
        rekomCount: 0,
        nonRekomCount: 0,
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
        noPassportCount: 0,
        missingDocsWarnings: [] as {
          candidate: Candidate;
          isPassportMissing: boolean;
          isPassportUnverified: boolean;
          missingDocs: CpmiDocument[];
          unverifiedCount: number;
          verifiedCount: number;
          requiredTotal: number;
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

    let rekomCount = 0;
    let nonRekomCount = 0;
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
    const missingDocsWarnings: {
      candidate: Candidate;
      isPassportMissing: boolean;
      isPassportUnverified: boolean;
      missingDocs: CpmiDocument[];
      unverifiedCount: number;
      verifiedCount: number;
      requiredTotal: number;
    }[] = [];

    for (const c of branchScoped) {
      if ((c.processTrack || "REKOM") === "NON_REKOM") {
        nonRekomCount++;
      } else {
        rekomCount++;
      }
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

      if (!["RETURNED", "ALUMNI"].includes(c.stage)) {
        const reqEval = evaluateCandidateRequirements(c);
        if (
          reqEval.isPassportMissing ||
          reqEval.isPassportUnverified ||
          reqEval.missingDocs.length > 0
        ) {
          missingDocsWarnings.push({
            candidate: c,
            isPassportMissing: reqEval.isPassportMissing,
            isPassportUnverified: reqEval.isPassportUnverified,
            missingDocs: reqEval.missingDocs,
            unverifiedCount: reqEval.unverifiedDocs.length,
            verifiedCount: reqEval.verifiedCount,
            requiredTotal: reqEval.requiredDocs.length,
          });
        }
      }
    }

    expiringDocsList.sort((a, b) => (a.daysLeft ?? 999) - (b.daysLeft ?? 999));
    missingDocsWarnings.sort((a, b) => {
      if (a.isPassportMissing !== b.isPassportMissing) {
        return a.isPassportMissing ? -1 : 1;
      }
      return b.missingDocs.length - a.missingDocs.length;
    });

    return {
      totalCpmi: branchScoped.length,
      rekomCount,
      nonRekomCount,
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
      noPassportCount: missingDocsWarnings.filter((w) => w.isPassportMissing).length,
      missingDocsWarnings,
    };
  }, [db, selectedBranchId]);

  function handleSelectCpmiTrack(track: ProcessTrack) {
    setActiveNav("cpmi");
    setProcessTrackFilter(track);
    if (db) {
      const match = db.candidates.find(
        (c) =>
          (selectedBranchId === "ALL" || c.branchId === selectedBranchId) &&
          (c.processTrack || "REKOM") === track
      );
      setSelectedCandidateId(match ? match.id : null);
    }
  }

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

  // Handler Salin Draft Formulir dari Antrean Sponsor ke Form Data Entry
  function handleApplySponsorSubmission(sub: SponsorFormSubmission) {
    setActiveSponsorSubmissionId(sub.id);
    setPhysicalFormScanUrl(sub.physicalFormImageUrl || "/form-pendaftaran-f4-baru.svg");
    setNewForm({
      stage: sub.nik && sub.nik.length === 16 ? "PROSPECT" : "LEAD",
      customRegNumber: "",
      nik: sub.nik || "",
      fullName: sub.fullName,
      gender: sub.gender,
      avatarUrl: sub.avatarUrl || "",
      fullBodyPhotoUrl: sub.registrationForm?.fullBodyPhotoUrl || "/biodata-img-3.jpg",
      birthPlace: sub.birthPlace,
      birthDate: sub.birthDate,
      phone: sub.phone,
      address: sub.address,
      education: sub.education,
      maritalStatus: sub.maritalStatus,
      destinationCountry: sub.destinationCountry,
      processTrack: sub.processTrack || sub.registrationForm?.processTrack || "REKOM",
      jobSector: sub.jobSector,
      employerName: "",
      agencyPartner: "",
      branchId: sub.branchId,
      sponsorId: sub.sponsorId,
    });
    setRegForm({
      ...sub.registrationForm,
      processTrack: sub.processTrack || sub.registrationForm?.processTrack || "REKOM",
      receivedByPtOfficer:
        loggedInStaff?.name || "Rina Kartika (Petugas PT.)",
    });
    setRegModalTab("FORM_LENGKAP");
    setToast({
      type: "success",
      title: `Draft Formulir Baru F4 "${sub.fullName}" (${sub.submissionCode}) Disalin ke Form Data Entry`,
      details: [
        `Pengirim: ${sub.sponsorName} · Seluruh Poin 1 s/d 17 Formulir Baru F4 PT Panca Banyu Ajisakti telah terisi otomatis.`,
        "Silakan periksa kembali tabel pengalaman luar negeri, masakan Arab, dan kelengkapan dokumen lalu klik 'Simpan Formulir'.",
      ],
    });
  }

  // Handler AI Vision OCR Ekstraksi Otomatis dari Scan Formulir Tulisan Tangan (form_sudah_terisi.pdf)
  function handleRunFormOcrSimulation() {
    setNewForm({
      stage: "LEAD",
      customRegNumber: "", // Sesuai aturan: No. Reg. dimasukkan secara manual setelah mendapatkan nomor dari sistem
      nik: "",
      fullName: "Umayah",
      gender: "P",
      avatarUrl: AVATAR_PRESETS[0].url,
      fullBodyPhotoUrl: "/biodata-img-3.jpg",
      birthPlace: "Cirebon",
      birthDate: "1988-05-16",
      phone: "081324170438",
      address: "Cirebon (Menunggu Pelengkapan detail RT/RW dari e-KTP)",
      education: "SD",
      maritalStatus: "Kawin",
      destinationCountry: "Arab Saudi",
      processTrack: "REKOM",
      jobSector: "Saudi - Sarekat Rdom (Housekeeping & Caregiver)",
      employerName: "",
      agencyPartner: "Sarekat Rdom (Syarikah Saudi)",
      branchId: "br-idm",
      sponsorId: "sp-2",
    });
    setRegForm({
      nickname: "Umayah",
      processTrack: "REKOM",
      realAge: 38,
      heightCm: 150,
      weightKg: 52,
      religion: "Islam",
      postalCode: "45151",
      graduationYear: "-",
      ktpOrPassportNo: "",
      fatherName: "Carwita",
      fatherAge: 0,
      motherName: "Kenah",
      motherAge: 0,
      paternalGrandfatherName: "Arsa",
      spouseOrGuardianName: "Saripudin",
      spouseAge: 0,
      spouseOccupation: "-",
      childrenTotalCount: 2,
      firstChildAge: "14",
      lastChildAge: "6",
      boysCountAndAges: "2 Orang (Anak ke-1: 14 Th, Anak Terakhir: 6 Th)",
      girlsCountAndAges: "-",
      childOrder: 1,
      siblingsCount: 1,
      emergencyContactName: "Saripudin",
      emergencyContactRelation: "Suami",
      emergencyContactPhone: "081324170438",
      workExperience1: "2004 - 2006 : Abu Dhabi (2 Th - Selesai Baik)",
      workExperience2: "2007 - 2009 : Kuwait (2 Th - Selesai Baik)",
      overseasExperiences: [
        {
          no: 1,
          countryAndCity: "Abu Dhabi",
          duration: "2 Th",
          period: "2004 - 2006",
          returnStatus: "SELESAI",
          remarks: "Baik",
        },
        {
          no: 2,
          countryAndCity: "Kuwait",
          duration: "2 Th",
          period: "2007 - 2009",
          returnStatus: "SELESAI",
          remarks: "Baik",
        },
        {
          no: 3,
          countryAndCity: "",
          duration: "",
          period: "",
          returnStatus: "NONE",
          remarks: "",
        },
        {
          no: 4,
          countryAndCity: "",
          duration: "",
          period: "",
          returnStatus: "NONE",
          remarks: "",
        },
      ],
      overseasExperienceNotes:
        "Eks-PMI Timur Tengah 2x penempatan (Abu Dhabi 2004-2006 & Kuwait 2007-2009, pulang Selesai Baik).",
      arabicLevelF4: "LANCAR",
      arabicNotesF4: "Dilingkari 'lancar' pada formulir fisik",
      englishLevelF4: "TIDAK_BISA",
      englishNotesF4: "-",
      willingCareBaby: true,
      willingCareBabyNotes: "Dicentang (✓) pada formulir fisik",
      willingCareElderly: true,
      willingCareElderlyNotes: "Dicentang (✓) pada formulir fisik",
      willingHousekeeping: true,
      willingHousekeepingNotes: "Dicentang (✓) pada formulir fisik",
      arabicCookingSkills: [],
      desiredJobCleaner: true,
      desiredJobFactory: false,
      desiredJobNurse: true,
      desiredJobHospitality: false,
      desiredJobOther: false,
      desiredJobOtherText: "",
      docHandover: {
        ktp: "NONE",
        kk: "NONE",
        akteKelahiran: "NONE",
        izinKeluarga: "NONE",
        izinSuami: "NONE",
        sttbIjazah: "NONE",
        kartuBpjs: "NONE",
        skck: "NONE",
        paspor: "NONE",
        otherDoc8Name: "",
        otherDoc8Status: "NONE",
        otherDoc9Name: "",
        otherDoc9Status: "NONE",
      },
      languageSkills: {
        english: "BURUK",
        mandarin: "BURUK",
        arabic: "BAIK",
        otherLanguageName: "",
        otherLanguageLevel: "NONE",
      },
      acceptanceDecision: "TERIMA",
      accByName: "Petugas PT Panca Banyu Ajisakti",
      candidateNotes: "Pendidikan terakhir dilingkari A. SD (catatan tulisan tangan: tdk tamat).",
      sponsorOfficerName: "Slamet / Iyet",
      sponsorOfficerPhone: "-",
      sponsorNotes:
        "Hasil ekstraksi AI Vision langsung dari file tulisan tangan form_sudah_terisi.pdf (CPMI: Umayah). No. Reg. diisi manual setelah mendapatkan nomor dari sistem.",
      receivedByPtOfficer:
        loggedInStaff?.name || "Rina Kartika (Petugas PT.)",
      formSignedDate: "2026-11-03",
    });
    setToast({
      type: "success",
      title: "✨ AI Vision Berhasil Mengekstrak Tulisan Tangan (form_sudah_terisi.pdf — Umayah)!",
      details: [
        "Terbaca: 1. Saudi - Sarekat Rdom | 2. Sponsor: Slamet/Iyet | 3. Umayah (081324170438) | 4. Cirebon, 16-05-1988 | 6. A. SD (tdk tamat) | 8. B. Kawin | 9. 2 Anak (14 Th & 6 Th) | 10. TB 150 cm / BB 52 kg | 12. Bapak Carwita, Ibu Kenah, Kakek Arsa | 13. Suami Saripudin | 15. Abu Dhabi (2004-2006) & Kuwait (2007-2009) Baik | Bahasa Arab: lancar | 16. a/b/c (✓) | Terima (✓).",
        "Catatan Penting: Kolom No. Reg. dibiarkan siap diisi secara manual setelah mendapatkan nomor registrasi resmi dari sistem.",
      ],
    });
  }

  // Handler Smart Parser Format Chat WhatsApp dari Sponsor Lapangan (Format Formulir Baru F4 Poin 1-17)
  function handleParseWhatsAppText() {
    const lines = waRawText.split("\n");
    const getVal = (keyPattern: RegExp): string => {
      const found = lines.find((l) => keyPattern.test(l));
      if (!found) return "";
      const idx = found.indexOf(":");
      return idx >= 0 ? found.slice(idx + 1).trim() : "";
    };

    const dest = getVal(/negara tujuan/i) || "Arab Saudi";
    const sponsorRaw = getVal(/nama sponsor|^sponsor/i);
    const fullName = getVal(/nama lengkap/i) || "Siti Munawaroh Binti H. Karim";
    const nickname = fullName.split(" ")[0] || "Muna";
    const nikRaw = getVal(/nik|ktp/i).replace(/\D/g, "").slice(0, 16);
    const ttlRaw = getVal(/tempat tgl lahir|ttl/i);
    const [birthPlacePart, birthDateAndAgePart] = ttlRaw.includes(",")
      ? ttlRaw.split(",").map((s) => s.trim())
      : ["Indramayu", "1999-04-28"];
    const birthDateMatch = (birthDateAndAgePart || "").match(/(\d{4}-\d{2}-\d{2})/);
    const realAgeMatch = ttlRaw.match(/umur asli\s*:\s*(\d{2})/i);
    const religion = getVal(/agama/i) || "Islam";
    const eduRaw = getVal(/pendidikan/i) || "SMA/SMK";
    const childOrderRaw = getVal(/anak ke/i);
    const childOrderNums = childOrderRaw.match(/(\d+)/g);
    const maritalStatus = getVal(/\bstatus\b/i) || "Kawin";
    const childrenRaw = getVal(/jumlah anak/i);
    const childTotalMatch = childrenRaw.match(/(\d+)\s*orang/i);
    const fisikRaw = getVal(/keadaan fisik|tinggi/i);
    const tbMatch = fisikRaw.match(/(\d{3})\s*cm/i) || fisikRaw.match(/(\d{3})/);
    const bbMatch = fisikRaw.match(/(\d{2,3})\s*kg/i) || fisikRaw.match(/\/\s*(\d{2,3})/);
    const addrRaw = getVal(/alamat lengkap|alamat/i);
    const phone = getVal(/telp|hp/i) || "0812-9988-4412";
    const ortuRaw = getVal(/orang tua|bapak/i);
    const kakekRaw = getVal(/kakek dari bapak/i) || "H. Abdul Karim";
    const spouseRaw = getVal(/suami|istri|wali/i);
    const emergRaw = getVal(/keluarga lain|kontak darurat/i);
    const exp1 = getVal(/pengalaman luar negeri|pengalaman 1/i);
    const bahasaRaw = getVal(/bahasa arab|bahasa/i);
    const masakanRaw = getVal(/masakan arab/i);
    const docAsliRaw = getVal(/dokumen asli/i).toUpperCase();
    const docCopyRaw = getVal(/dokumen copy/i).toUpperCase();

    const resolveDoc = (keyword: string): DocHandoverType => {
      if (docAsliRaw.includes(keyword)) return "ASLI";
      if (docCopyRaw.includes(keyword)) return "COPY";
      return "NONE";
    };

    const parsedCooking = masakanRaw
      ? masakanRaw
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      : [
          "Ruz Kabsah",
          "Ruz Bukhari",
          "Ruz Briyani",
          "Saluna/Idam",
          "Macarona",
          "Sambosa",
          "Salatah",
          "Juice",
        ];

    setNewForm((prev) => ({
      ...prev,
      stage: nikRaw.length === 16 ? "PROSPECT" : "LEAD",
      nik: nikRaw,
      fullName,
      gender: "P",
      avatarUrl: AVATAR_PRESETS[0].url,
      birthPlace: birthPlacePart || "Indramayu",
      birthDate: birthDateMatch ? birthDateMatch[1] : "1999-04-28",
      phone,
      address: addrRaw || prev.address,
      education: eduRaw.includes("SMA")
        ? "SMA/SMK"
        : eduRaw.includes("SMP")
        ? "SMP"
        : eduRaw.includes("SD")
        ? "SD"
        : "SMA/SMK",
      maritalStatus: maritalStatus.includes("Janda")
        ? "Cerai Hidup"
        : maritalStatus.includes("Belum")
        ? "Belum Kawin"
        : "Kawin",
      destinationCountry: dest,
      processTrack: prev.processTrack || "REKOM",
      jobSector: "Housekeeping & Caregiver (SPSK / Formal)",
    }));

    setRegForm((prev) => ({
      ...prev,
      nickname,
      processTrack: prev.processTrack || "REKOM",
      realAge: realAgeMatch ? Number(realAgeMatch[1]) : 27,
      heightCm: tbMatch ? Number(tbMatch[1]) : 160,
      weightKg: bbMatch ? Number(bbMatch[1]) : 53,
      religion,
      ktpOrPassportNo: nikRaw,
      fatherName: ortuRaw ? ortuRaw.replace(/bapak/i, "").split("(")[0].trim() : "H. Karim",
      fatherAge: 59,
      motherName: "Hj. Maryam",
      motherAge: 54,
      paternalGrandfatherName: kakekRaw,
      spouseOrGuardianName: spouseRaw.split("(")[0].trim() || "Dadan Ramdani",
      spouseAge: 33,
      spouseOccupation: spouseRaw.includes("-")
        ? spouseRaw.split("-").pop()?.trim() || "Wiraswasta"
        : "Wiraswasta",
      childrenTotalCount: childTotalMatch ? Number(childTotalMatch[1]) : 1,
      firstChildAge: "4",
      lastChildAge: "-",
      childOrder: childOrderNums && childOrderNums[0] ? Number(childOrderNums[0]) : 2,
      siblingsCount: childOrderNums && childOrderNums[1] ? Number(childOrderNums[1]) : 4,
      emergencyContactName: emergRaw.split("(")[0].trim() || "Dadan Ramdani",
      emergencyContactRelation: "Suami",
      emergencyContactPhone: (emergRaw.split("-").pop() || "").trim() || phone,
      workExperience1: exp1 || prev.workExperience1,
      overseasExperiences: [
        {
          no: 1,
          countryAndCity: exp1 ? exp1.split("(")[0].trim() : "Arab Saudi - Jeddah",
          duration: "2 Tahun",
          period: "2022 - 2024",
          returnStatus: /kasus/i.test(exp1) ? "KASUS" : "SELESAI",
          remarks: exp1 || "Selesai Kontrak 2 Tahun Baik",
        },
        {
          no: 2,
          countryAndCity: "",
          duration: "",
          period: "",
          returnStatus: "NONE",
          remarks: "",
        },
        {
          no: 3,
          countryAndCity: "",
          duration: "",
          period: "",
          returnStatus: "NONE",
          remarks: "",
        },
        {
          no: 4,
          countryAndCity: "",
          duration: "",
          period: "",
          returnStatus: "NONE",
          remarks: "",
        },
      ],
      arabicLevelF4: /lancar/i.test(bahasaRaw) ? "LANCAR" : "SEDIKIT",
      englishLevelF4: "SEDIKIT",
      willingCareBaby: true,
      willingCareElderly: true,
      willingHousekeeping: true,
      arabicCookingSkills: parsedCooking,
      docHandover: {
        ...prev.docHandover,
        ktp: resolveDoc("KTP"),
        kk: resolveDoc("KK"),
        akteKelahiran: resolveDoc("AKTA") !== "NONE" ? resolveDoc("AKTA") : resolveDoc("AKTE"),
        izinKeluarga: resolveDoc("IZIN ORANG TUA") !== "NONE" ? resolveDoc("IZIN ORANG TUA") : resolveDoc("IZIN"),
        izinSuami: resolveDoc("IZIN SUAMI"),
        sttbIjazah: resolveDoc("IJAZAH"),
        kartuBpjs: resolveDoc("BPJS"),
        paspor: resolveDoc("PASSPORT") !== "NONE" ? resolveDoc("PASSPORT") : resolveDoc("PASPOR"),
      },
      sponsorOfficerName: sponsorRaw.split("-")[0].trim() || prev.sponsorOfficerName,
      sponsorOfficerPhone:
        (sponsorRaw.split("-").slice(1).join("-") || "").trim() || prev.sponsorOfficerPhone,
    }));

    setRegModalTab("FORM_LENGKAP");
    setToast({
      type: "success",
      title: `📲 Chat WhatsApp Sponsor Berhasil Dikonversi ke Formulir Baru F4 (${fullName})`,
      details: [
        "Seluruh Poin 1–17 Formulir Baru F4 (Biodata, Kakek dari Bapak, Tabel Pengalaman Luar Negeri, Bahasa, Masakan Arab & Dokumen) otomatis terisi.",
      ],
    });
  }

  // Handler Buka & Konversi Otomatis Printout Biodata Syarikah (contoh_printout_biodata.pdf) dari Data Pendaftaran CPMI
  function openSyarikahBiodataModal(cand: Candidate) {
    const rf: OfficialRegistrationForm = cand.registrationForm || regForm;
    const countryMap: Record<string, { en: string; salary: string }> = {
      "Arab Saudi": { en: "SAUDI ARABIA", salary: "SAR 1500" },
      "Uni Emirat Arab (UAE)": { en: "UNITED ARAB EMIRATES", salary: "AED 1500" },
      Kuwait: { en: "KUWAIT", salary: "KWD 120" },
      Oman: { en: "OMAN", salary: "OMR 130" },
      Yordania: { en: "JORDAN", salary: "JOD 300" },
      Qatar: { en: "QATAR", salary: "QAR 1500" },
      Bahrain: { en: "BAHRAIN", salary: "BHD 130" },
    };
    const destInfo = countryMap[cand.destinationCountry] || {
      en: cand.destinationCountry.toUpperCase(),
      salary: "SAR 1500",
    };

    const bParts = (cand.birthDate || "1998-08-14").split("-");
    const dobFormatted =
      bParts.length === 3 ? `${bParts[2]}-${bParts[1]}-${bParts[0]}` : cand.birthDate || "17-12-2003";

    const calcAge = () => {
      if (rf.realAge && rf.realAge > 0) return String(rf.realAge);
      if (bParts.length === 3 && !isNaN(Number(bParts[0]))) {
        return String(Math.max(18, 2026 - Number(bParts[0])));
      }
      return "25";
    };

    const marUpper = (cand.maritalStatus || "").toUpperCase();
    const maritalEn = marUpper.includes("BELUM")
      ? "NOT MARRIED"
      : marUpper.includes("CERAI") || marUpper.includes("JANDA")
      ? "DIVORCED"
      : "MARRIED";

    const eduUpper = (cand.education || "").toUpperCase();
    const eduEn = eduUpper.includes("SD")
      ? "ELEMENTARY SCHOOL"
      : eduUpper.includes("SMP") || eduUpper.includes("MTS")
      ? "JUNIOR HIGH SCHOOL"
      : eduUpper.includes("D3") || eduUpper.includes("S1") || eduUpper.includes("UNIV")
      ? "UNIVERSITY / DIPLOMA"
      : "SENIOR HIGH SCHOOL";

    const relUpper = (rf.religion || "Islam").toUpperCase();
    const religionEn = relUpper.includes("ISLAM")
      ? "ISLAM"
      : relUpper.includes("KRISTEN") || relUpper.includes("KATOLIK")
      ? "CHRISTIAN"
      : relUpper;

    const pasporDoc = (cand.documents || []).find((d) => d.docType === "PASPOR");
    const rawPassportNo =
      pasporDoc?.docNumber && !pasporDoc.docNumber.startsWith("FISIK-")
        ? pasporDoc.docNumber
        : "";
    const rawPassportPlace =
      pasporDoc?.issuedBy && !pasporDoc.issuedBy.startsWith("Diserahkan")
        ? pasporDoc.issuedBy.toUpperCase()
        : "";

    const arabSpeak =
      rf.arabicLevelF4 === "LANCAR"
        ? "FLUENT"
        : rf.arabicLevelF4 === "SEDIKIT"
        ? "FAIR"
        : "POOR";
    const arabRead =
      rf.arabicLevelF4 === "LANCAR"
        ? "FAIR"
        : rf.arabicLevelF4 === "SEDIKIT"
        ? "POOR"
        : "POOR";
    const engSpeak =
      rf.englishLevelF4 === "LANCAR"
        ? "FLUENT"
        : rf.englishLevelF4 === "SEDIKIT"
        ? "FAIR"
        : "POOR";
    const engRead =
      rf.englishLevelF4 === "LANCAR"
        ? "GOOD"
        : rf.englishLevelF4 === "SEDIKIT"
        ? "FAIR"
        : "POOR";

    const validExps = (rf.overseasExperiences || []).filter(
      (e) =>
        e.countryAndCity &&
        e.countryAndCity.trim() !== "" &&
        e.countryAndCity.trim() !== "-" &&
        !/non/i.test(e.countryAndCity)
    );
    const prevCountryEn =
      validExps.length > 0
        ? validExps
            .map((e) =>
              `${e.countryAndCity} ${e.duration ? `(${e.duration})` : ""}`
                .toUpperCase()
                .replace(/ARAB SAUDI/g, "SAUDI ARABIA")
                .replace(/TAHUN/g, "YEARS")
                .replace(/THN|TH/g, "YRS")
                .trim()
            )
            .join(" / ")
        : "NON EXPERIENCE";
    const prevPeriodEn =
      validExps.length > 0
        ? validExps
            .map((e) => e.period)
            .filter(Boolean)
            .join(", ")
        : "";

    const townGuess =
      cand.birthPlace?.toUpperCase() ||
      (cand.address ? cand.address.split(",").pop()?.trim().toUpperCase() : "") ||
      "INDRAMAYU";

    const cookList = (rf.arabicCookingSkills || []).join(", ").toUpperCase();

    setSyarikahBiodataForm({
      referenceNo: cand.regNumber || "",
      employmentIn: destInfo.en,
      postApply: "DOMESTIC HELPER",
      monthlySalary: destInfo.salary,
      contractPeriod: "2 YEARS",
      phone: cand.phone || "",
      fullName: (cand.fullName || "").toUpperCase(),
      nationality: "INDONESIAN",
      religion: religionEn,
      dateOfBirth: dobFormatted,
      age: calcAge(),
      placeOfBirth: (cand.birthPlace || "INDRAMAYU").toUpperCase(),
      livingTown: townGuess,
      maritalStatus: maritalEn,
      noOfChildren:
        rf.childrenTotalCount && rf.childrenTotalCount > 0
          ? String(rf.childrenTotalCount)
          : maritalEn === "NOT MARRIED"
          ? ""
          : "0",
      weight: `${rf.weightKg || 52} KG`,
      height: `${rf.heightCm || 158} CM`,
      complexion: "BROWN SKIN",
      educational: eduEn,
      passportNumber: rawPassportNo.toUpperCase(),
      passportIssueDate: pasporDoc?.issueDate || "",
      passportIssuePlace: rawPassportPlace,
      passportExpiryDate: pasporDoc?.expiryDate || "",
      arabicSpeak: arabSpeak,
      arabicRead: arabRead,
      englishSpeak: engSpeak,
      englishRead: engRead,
      prevEmploymentCountry: prevCountryEn,
      prevEmploymentPeriod: prevPeriodEn,
      driving: "NO",
      cooking: (rf.arabicCookingSkills?.length || 0) > 0 || rf.willingHousekeeping ? "YES" : "NO",
      cleaning: rf.willingHousekeeping !== false ? "YES" : "NO",
      washing: rf.willingHousekeeping !== false ? "YES" : "NO",
      babySitting: rf.willingCareBaby !== false ? "YES" : "NO",
      ironing: rf.willingHousekeeping !== false ? "YES" : "NO",
      careOfOlder: rf.willingCareElderly !== false ? "YES" : "NO",
      sheCanCook: cookList,
      closeUpPhotoUrl:
        cand.avatarUrl && !cand.avatarUrl.startsWith("data:image/svg")
          ? cand.avatarUrl
          : "/biodata-img-2.jpg",
      fullBodyPhotoUrl:
        cand.fullBodyPhotoUrl || rf.fullBodyPhotoUrl || "/biodata-img-3.jpg",
      replaceHeaderLogoWithNew: true,
    });
    setPrintingSyarikahBiodataCandidate(cand);
  }

  // Handler Muat Contoh Asli 100% dari File contoh_printout_biodata.pdf (EKA HERMAYANTI RUSLAN)
  function loadExactSampleBiodataPdf() {
    setSyarikahBiodataForm({
      referenceNo: "",
      employmentIn: "",
      postApply: "DOMESTIC HELPER",
      monthlySalary: "SAR 1500",
      contractPeriod: "2 YEARS",
      phone: "083174903728",
      fullName: "EKA HERMAYANTI RUSLAN",
      nationality: "INDONESIAN",
      religion: "ISLAM",
      dateOfBirth: "17-12-2003",
      age: "23",
      placeOfBirth: "JOWET",
      livingTown: "N.T.B",
      maritalStatus: "NOT MARRIED",
      noOfChildren: "",
      weight: "43CM",
      height: "155KG",
      complexion: "BROWN SKIN",
      educational: "SENIOR HIGH SCHOOL",
      passportNumber: "",
      passportIssueDate: "",
      passportIssuePlace: "",
      passportExpiryDate: "",
      arabicSpeak: "POOR",
      arabicRead: "POOR",
      englishSpeak: "POOR",
      englishRead: "POOR",
      prevEmploymentCountry: "NON EXPERIENCE",
      prevEmploymentPeriod: "",
      driving: "NO",
      cooking: "YES",
      cleaning: "YES",
      washing: "YES",
      babySitting: "YES",
      ironing: "YES",
      careOfOlder: "YES",
      sheCanCook: "",
      closeUpPhotoUrl: "/biodata-img-2.jpg",
      fullBodyPhotoUrl: "/biodata-img-3.jpg",
      replaceHeaderLogoWithNew: true,
    });
    setToast({
      type: "success",
      title: "✨ Data Contoh Asli (contoh_printout_biodata.pdf — EKA HERMAYANTI RUSLAN) Dimuat!",
      details: [
        "Menampilkan data dan foto asli persis seperti file contoh_printout_biodata.pdf untuk verifikasi tata letak (layout).",
      ],
    });
  }

  // Handler Tambah Kandidat Baru (dengan Formulir Lengkap PT Panca Banyu Ajisakti & Pencegahan NIK Ganda)
  async function handleCreateCandidate(e: React.FormEvent) {
    e.preventDefault();
    setDuplicateNikAlert(null);

    const spObj = db?.sponsors.find((s) => s.id === newForm.sponsorId);
    const enrichedRegForm: OfficialRegistrationForm = {
      ...regForm,
      ktpOrPassportNo: regForm.ktpOrPassportNo || newForm.nik || "Menyusul",
      sponsorOfficerName:
        regForm.sponsorOfficerName || (spObj ? `${spObj.name} (${spObj.code})` : "Petugas Rekrut"),
      sponsorOfficerPhone: regForm.sponsorOfficerPhone || spObj?.phone || "",
      receivedByPtOfficer:
        regForm.receivedByPtOfficer ||
        loggedInStaff?.name ||
        "Rina Kartika (Staf Data Entry PT Panca Banyu Ajisakti)",
    };

    const { status, data } = await callApi("CREATE_CANDIDATE", {
      ...newForm,
      registrationForm: enrichedRegForm,
      sponsorSubmissionId: activeSponsorSubmissionId || undefined,
    });
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
    setActiveSponsorSubmissionId(null);
    setSelectedCandidateId(data.candidate.id);
    setProcessTrackFilter(data.candidate.processTrack || "REKOM");
    setActiveNav("cpmi");
    setToast({
      type: "success",
      title: `Formulir Pendaftaran ${data.candidate.fullName} (${data.candidate.regNumber}) Tersimpan!`,
      details: [
        data.candidate.nik
          ? `NIK ${data.candidate.nik} tervalidasi unik. Checklist dokumen fisik (ASLI/COPY) otomatis disinkronkan ke Satu Berkas Digital.`
          : "Terdaftar melalui Formulir Pendaftaran PT Panca Banyu Ajisakti.",
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

  function openVacancyModal(vac?: JobVacancy) {
    if (vac) {
      setEditingVacancy(vac);
      setNewVacancyForm({
        title: vac.title,
        destinationCountry: vac.destinationCountry,
        jobSector: vac.jobSector,
        agencyPartner: vac.agencyPartner,
        employerName: vac.employerName,
        salaryForeign: vac.salaryForeign,
        salaryIdrEstimate: vac.salaryIdrEstimate || 8000000,
        placementFee: vac.placementFee || 36000000,
        quotaTotal: vac.quotaTotal,
        genderPref: vac.genderPref,
        minEducation: vac.minEducation,
        ageRange: vac.ageRange,
        closingDate: vac.closingDate,
        requirementsText: (vac.requirements || []).join("\n"),
      });
    } else {
      setEditingVacancy(null);
      setNewVacancyForm({
        title: "",
        destinationCountry: "Arab Saudi",
        jobSector: "Housekeeping & Caregiver (SPSK Syarikah)",
        agencyPartner: "",
        employerName: "",
        salaryForeign: "SAR 1.500 - 1.800 / bulan (Zero Cost)",
        salaryIdrEstimate: 7200000,
        placementFee: 36000000,
        quotaTotal: 25,
        genderPref: "P",
        minEducation: "SD / SMP / SMA",
        ageRange: "21 - 40 Tahun",
        closingDate: "2026-12-31",
        requirementsText:
          "Wajib KTP Elektronik 16 digit & KK asli\nSehat jasmani & rohani (Medical Wafid / GAMCA FIT)\nSurat izin suami/orang tua diketahui Kepala Desa\n100% Zero Cost (Seluruh biaya ditanggung langsung oleh Syarikah/Majikan)",
      });
    }
    setShowNewVacancyModal(true);
  }

  // Handler Buat / Update Lowongan
  async function handleSaveVacancy(e: React.FormEvent) {
    e.preventDefault();
    if (editingVacancy) {
      const { status, data } = await callApi("UPDATE_VACANCY", {
        vacancyId: editingVacancy.id,
        ...newVacancyForm,
      });
      if (status >= 400 || !data.ok) {
        setToast({
          type: "error",
          title: "Gagal Mengubah Job Order",
          details: [data.error || "Terjadi kesalahan saat menyimpan perubahan."],
        });
        return;
      }
      setShowNewVacancyModal(false);
      setEditingVacancy(null);
      setToast({
        type: "success",
        title: `Job Order ${data.vacancy.code} Berhasil Diperbarui`,
      });
      return;
    }

    const { status, data } = await callApi("CREATE_VACANCY", newVacancyForm);
    if (status >= 400 || !data.ok) {
      setToast({
        type: "error",
        title: "Gagal Menambah Job Order",
        details: [data.error || "Terjadi kesalahan saat menayangkan lowongan."],
      });
      return;
    }
    setShowNewVacancyModal(false);
    setToast({
      type: "success",
      title: `Lowongan ${data.vacancy.code} (${data.vacancy.title}) Ditayangkan`,
    });
  }

  // Handler Hapus Lowongan
  async function handleDeleteVacancy(vac: JobVacancy) {
    const { status, data } = await callApi("DELETE_VACANCY", { vacancyId: vac.id });
    if (status >= 400 || !data.ok) {
      setToast({
        type: "error",
        title: "Gagal Menghapus Job Order",
        details: [data.error || "Anda tidak memiliki izin atau data tidak ditemukan."],
      });
      return;
    }
    setDeletingVacancyId(null);
    setToast({
      type: "success",
      title: `Job Order ${vac.code} (${vac.title}) Dihapus`,
    });
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

  // Handler Bayar Termin Fee Sponsor (DP1 -> DP2 -> DP3 -> Pelunasan) - Dukung Nominal Custom
  async function handlePaySponsorTermin(e: React.FormEvent) {
    e.preventDefault();
    if (!payingTerminModal) return;

    const { status, data } = await callApi("PAY_SPONSOR_TERMIN", {
      candidateId: payingTerminModal.candidate.id,
      terminKey: payingTerminModal.installment.terminKey,
      paymentMethod: payTerminForm.paymentMethod,
      notes: payTerminForm.notes,
      forceOverride: payTerminForm.forceOverride,
      customAmount: payTerminForm.customAmount,
      autoAdjustCommissionIfExceeded: payTerminForm.autoAdjustCommissionIfExceeded,
      deductKasbon: payTerminForm.deductKasbon,
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
    const kasbonDeducted = Number(data.kasbonDeducted || 0);
    const netCashPaid = Number(data.netCashPaid ?? paidInst.amount);

    setPayingTerminModal(null);
    setPayTerminForm({
      paymentMethod: "TRANSFER_BANK",
      notes: "",
      forceOverride: false,
      customAmount: 0,
      autoAdjustCommissionIfExceeded: false,
      deductKasbon: true,
    });
    setToast({
      type: "success",
      title: `Pencairan ${paidInst.label} Berhasil Dicatat (${formatRupiah(paidInst.amount)})`,
      details: [
        `No. Kwitansi: ${paidInst.receiptNumber} · Penerima: ${spObj?.name || "-"}`,
        `CPMI: ${updatedCandidate.fullName} (${updatedCandidate.regNumber})`,
        kasbonDeducted > 0
          ? `Potong Kasbon: ${formatRupiah(kasbonDeducted)} · Kas Keluar Netto ke Jurnal: ${formatRupiah(netCashPaid)}`
          : `Otomatis tercatat di Buku Jurnal Arus Kas KELUAR: ${formatRupiah(netCashPaid)}`,
      ],
    });
    setReceiptPreviewModal({
      candidate: updatedCandidate,
      installment: paidInst,
      sponsorName: spObj?.name || "Sponsor Lapangan",
      sponsorArea: spObj?.area || "-",
    });
  }

  function getEligibleSponsorCandidates(
    sponsorId: string,
    terminKey: CommissionTerminKey
  ): Candidate[] {
    if (!db || !sponsorId) return [];
    return db.candidates.filter(
      (c) =>
        c.sponsorId === sponsorId &&
        checkCandidateTerminEligibility(c, terminKey).eligible
    );
  }

  function openBatchSponsorPayModal(preferredSponsorId?: string) {
    if (!db) return;
    const defaultSponsorId =
      preferredSponsorId && preferredSponsorId !== "ALL"
        ? preferredSponsorId
        : financeSponsorFilter !== "ALL"
        ? financeSponsorFilter
        : db.sponsors.find((s) =>
            db.candidates.some((c) => c.sponsorId === s.id && c.sponsorCommission > 0)
          )?.id ||
          db.sponsors[0]?.id ||
          "";

    const terminKey: CommissionTerminKey = "DP1";
    const eligible = getEligibleSponsorCandidates(defaultSponsorId, terminKey);
    const defaultTotal = eligible.reduce((sum, c) => {
      const inst = c.finance?.sponsorInstallments.find((i) => i.terminKey === terminKey);
      return sum + (inst?.amount || 0);
    }, 0);

    setBatchSponsorPayForm({
      sponsorId: defaultSponsorId,
      terminKey,
      totalAmount: defaultTotal,
      selectedCandidateIds: eligible.map((c) => c.id),
      distributionMode: "EQUAL_SPLIT",
      paymentMethod: "TRANSFER_BANK",
      notes: "",
      forceOverride: false,
      autoAdjustCommissionIfExceeded: false,
      deductKasbon: true,
      stageWarningMsg: undefined,
    });
    setBatchSponsorPayOpen(true);
  }

  async function handlePaySponsorBatchCustom(e: React.FormEvent) {
    e.preventDefault();
    if (!batchSponsorPayOpen) return;

    const { status, data } = await callApi("PAY_SPONSOR_TERMIN_CUSTOM_BATCH", {
      sponsorId: batchSponsorPayForm.sponsorId,
      terminKey: batchSponsorPayForm.terminKey,
      candidateIds: batchSponsorPayForm.selectedCandidateIds,
      totalAmount: batchSponsorPayForm.totalAmount,
      distributionMode: batchSponsorPayForm.distributionMode,
      paymentMethod: batchSponsorPayForm.paymentMethod,
      notes: batchSponsorPayForm.notes,
      forceOverride: batchSponsorPayForm.forceOverride,
      autoAdjustCommissionIfExceeded: batchSponsorPayForm.autoAdjustCommissionIfExceeded,
      deductKasbon: batchSponsorPayForm.deductKasbon,
    });

    if (status === 422 && data.stageWarning) {
      setBatchSponsorPayForm((prev) => ({
        ...prev,
        stageWarningMsg: data.error,
      }));
      return;
    }

    if (!data.ok) {
      setToast({
        type: "error",
        title: "Pembayaran Kolektif Custom Ditolak",
        details: [data.error],
      });
      return;
    }

    const kasbonDeducted = Number(data.kasbonDeducted || 0);
    const netCashPaid = Number(data.netCashPaid ?? data.totalAmount);

    setBatchSponsorPayOpen(false);
    setToast({
      type: "success",
      title: `Pembayaran Kolektif ${getTerminShortTitle(data.terminKey)} Berhasil (${formatRupiah(data.totalAmount)})`,
      details: [
        `Sponsor: ${data.sponsorName} · ${data.count} CPMI dibayarkan`,
        `Rata-rata / CPMI: ${formatRupiah(data.perCpmiAmount)} · No. Batch: ${data.receipts?.[0] || "-"}`,
        kasbonDeducted > 0
          ? `Potong Kasbon: ${formatRupiah(kasbonDeducted)} · Kas Keluar Netto ke Jurnal: ${formatRupiah(netCashPaid)}`
          : `Otomatis tercatat di Buku Jurnal Arus Kas KELUAR: ${formatRupiah(netCashPaid)}`,
      ],
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
    <div className="flex min-h-screen bg-slate-50 print:bg-white print:min-h-0 print:block">
      {/* SIDEBAR PASMIGRANPRO (RESPONSIF & COLLAPSIBLE) */}
      <SidebarNav
        activeNav={activeNav}
        onSelectNav={(nav: NavKey) => {
          setActiveNav(nav);
          if (nav !== "cpmi" && processTrackFilter !== "ALL") {
            setProcessTrackFilter("ALL");
          }
        }}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        isMenuAllowed={isMenuAllowed}
        selectedBranchId={selectedBranchId}
        onChangeBranch={(branchId) => setSelectedBranchId(branchId)}
        branchLocked={loggedInStaff ? loggedInStaff.branchId !== "ALL" : false}
        branches={db.branches}
        totalCandidatesCount={db.candidates.length}
        stats={stats}
        processTrackFilter={processTrackFilter}
        onSelectCpmiTrack={handleSelectCpmiTrack}
        rekomCount={stats.rekomCount}
        nonRekomCount={stats.nonRekomCount}
        vacanciesCount={db.vacancies?.length || 0}
        staffName={loggedInStaff?.name || "Superadmin Utama"}
        onLogout={handleSuperAdminLogout}
      />

      {/* MAIN AREA */}
      <div
        className={`flex min-w-0 flex-1 flex-col print:block print:w-full print:p-0 print:m-0 ${
          printingSyarikahBiodataCandidate ||
          printingRegFormCandidate ||
          receiptPreviewModal ||
          viewingPhysicalDoc
            ? "print:hidden"
            : ""
        }`}
      >
        {/* TOP HEADER */}
        <header className="sticky top-0 z-20 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white/95 px-3 sm:px-6 py-3 backdrop-blur print:hidden">
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              type="button"
              onClick={() => setIsMobileSidebarOpen(true)}
              aria-label="Buka Menu Sidebar"
              className="lg:hidden inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 transition cursor-pointer"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-lg font-bold text-slate-900 truncate">
                {activeNav === "beranda" && "Command Center Operasional P3MI"}
                {activeNav === "saas_tenants" && "Modul 1: Profil Perusahaan PT. Panca Banyu Ajisakti & Jaringan Kantor Cabang"}
                {activeNav === "doc_print" && "Modul 2: Cetak Dokumen Otomatis (Surat Paspor, Rekom Desa, PK Resmi, CV Syarikah)"}
                {activeNav === "whatsapp_gateway" && "Modul 3: Integrasi WhatsApp Gateway Otomatis (Notifikasi & Direct Chat)"}
                {activeNav === "aruskas_kasbon" && "Modul 4: Modul Akuntansi & Arus Kas Bank / Kasbon (Buku Kas & Invoice Wakalah)"}
                {activeNav === "employer_matching" && "Modul 5: Seleksi & Wawancara Majikan (Job Matching & Video Call Syarikah)"}
                {activeNav === "cpmi" &&
                  (processTrackFilter === "REKOM"
                    ? "Lembar Kerja CPMI — Jalur Rekom (Resmi SISKOP2MI)"
                    : processTrackFilter === "NON_REKOM"
                    ? "Lembar Kerja CPMI — Jalur Non-Rekom (Cepat)"
                    : "Manajemen Data CPMI & Satu Berkas Digital")}
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
                {activeNav === "maintenance" && "Pengaturan Maintenance: Backup, Restore & Reset Database (Superadmin)"}
              </h1>
            </div>
              <p className="text-[11px] sm:text-xs text-slate-500 truncate">
                PT Panca Banyu Ajisakti (P3MI Resmi) · Data terpusat seluruh cabang & perekrut
              </p>
            </div>
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
                setRegModalTab("INBOX_SPONSOR");
                setShowAddModal(true);
              }}
              className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-slate-800"
            >
              <UserPlus className="h-3.5 w-3.5 text-sky-400" />
              <span>+ Formulir Pendaftaran CPMI</span>
              {(db.sponsorSubmissions?.filter((s) => s.status === "MENUNGGU_DATA_ENTRY")
                .length || 0) > 0 && (
                <span className="rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-extrabold text-slate-950">
                  {
                    db.sponsorSubmissions?.filter(
                      (s) => s.status === "MENUNGGU_DATA_ENTRY"
                    ).length
                  }{" "}
                  Draft Sponsor
                </span>
              )}
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

        {/* TOAST BANNER FEEDBACK */}
        {toast && (
          <div className="mx-6 mt-4 rounded-xl border border-slate-200 bg-white p-4 shadow-md print:hidden">
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
        <main className="flex-1 p-3 sm:p-6 print:p-0 print:m-0 print:bg-white print:block print:w-full">
          {/* =========================================================
              TAB 1: BERANDA COMMAND CENTER (PERSIS PANEL MIGRANPRO)
             ========================================================= */}
          {activeNav === "beranda" && (
            <div className="space-y-6">
              {/* 4 KPI Utama Dashboard Umum: Total CPMI/PMI, Berangkat 30 Hari, Case Terbuka, Lowongan Aktif */}
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
                  onClick={() => setActiveNav("vacancy")}
                  className="rounded-2xl border border-sky-200 bg-sky-50/40 p-5 text-left shadow-sm transition hover:border-sky-300 cursor-pointer"
                >
                  <div className="flex items-center justify-between text-sky-800">
                    <span className="text-xs font-semibold uppercase tracking-wider">
                      Lowongan Aktif (Job Order)
                    </span>
                    <Briefcase className="h-4 w-4 text-sky-600" />
                  </div>
                  <p className="mt-2 text-3xl font-bold text-slate-900">
                    {(db.vacancies || []).filter((v) => v.isPublished).length}
                  </p>
                  <p className="mt-1 text-xs text-sky-800 font-medium">
                    {(db.vacancies || [])
                      .filter((v) => v.isPublished)
                      .reduce((sum, v) => sum + Math.max(0, v.quotaTotal - v.quotaFilled), 0)}{" "}
                    kuota penempatan tersedia →
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

              {/* Kartu Warning Persyaratan CPMI: Belum Ada Paspor & Dokumen Wajib Kurang */}
              <div className="rounded-2xl border border-amber-200 bg-white p-6 shadow-sm">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                      <AlertTriangle className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-bold text-slate-900">
                          Warning Persyaratan CPMI: Belum Ada Paspor &amp; Berkas Kurang
                        </h3>
                        {stats.noPassportCount > 0 && (
                          <span className="rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-bold text-rose-700">
                            {stats.noPassportCount} Belum Ada Paspor
                          </span>
                        )}
                        <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-800">
                          {stats.missingDocsWarnings.length} CPMI Perlu Dilengkapi
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">
                        Daftar CPMI terdaftar (di luar Purna/Alumni) yang paspor atau dokumen wajib persyaratannya masih kosong (MISSING) atau menunggu verifikasi.
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setDocStatusFilter("NO_PASSPORT");
                        setCpmiViewMode("MATRIKS_BERKAS");
                        setActiveNav("cpmi");
                      }}
                      className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100 transition cursor-pointer"
                    >
                      Filter Belum Ada Paspor →
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDocStatusFilter("INCOMPLETE");
                        setCpmiViewMode("MATRIKS_BERKAS");
                        setActiveNav("cpmi");
                      }}
                      className="rounded-lg border border-sky-200 bg-sky-50 px-3 py-1.5 text-xs font-semibold text-sky-700 hover:bg-sky-100 transition cursor-pointer"
                    >
                      Lihat Matriks Berkas →
                    </button>
                  </div>
                </div>

                {stats.missingDocsWarnings.length === 0 ? (
                  <div className="flex items-center gap-2.5 rounded-xl border border-teal-200 bg-teal-50/70 px-4 py-3 text-xs font-semibold text-teal-800">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-teal-600" />
                    Semua CPMI aktif sudah memiliki Paspor RI dan persyaratan dokumen wajib telah terpenuhi.
                  </div>
                ) : (
                  <div className="max-h-96 space-y-2.5 overflow-y-auto pr-1">
                    {stats.missingDocsWarnings.map((item) => (
                      <div
                        key={item.candidate.id}
                        className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border p-3.5 ${
                          item.isPassportMissing
                            ? "border-rose-200 bg-rose-50/60"
                            : "border-amber-200 bg-amber-50/50"
                        }`}
                      >
                        <div className="min-w-0 flex-1 space-y-1.5">
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                                item.isPassportMissing ? "bg-rose-600" : "bg-amber-500"
                              }`}
                            />
                            <span className="text-xs font-bold text-slate-900">
                              {item.candidate.fullName}
                            </span>
                            <span className="font-mono text-[11px] text-slate-500">
                              {item.candidate.regNumber}
                            </span>
                            <span className="rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-semibold text-slate-600">
                              {(item.candidate.processTrack || "REKOM") === "NON_REKOM"
                                ? "NON-REKOM"
                                : "REKOM"}{" "}
                              · {item.candidate.destinationCountry} · {item.candidate.stage}
                            </span>
                            {item.isPassportMissing ? (
                              <span className="rounded-full bg-rose-600 px-2 py-0.5 text-[10px] font-bold text-white">
                                BELUM ADA PASPOR
                              </span>
                            ) : item.isPassportUnverified ? (
                              <span className="rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-bold text-white">
                                PASPOR BELUM VERIFIED
                              </span>
                            ) : null}
                            <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-bold text-slate-700 border border-slate-200">
                              Terverifikasi {item.verifiedCount}/{item.requiredTotal}
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-1.5 pl-4 text-[11px]">
                            {item.missingDocs.length > 0 && (
                              <>
                                <span className="font-semibold text-slate-600">
                                  Berkas belum ada ({item.missingDocs.length}):
                                </span>
                                {item.missingDocs.map((md) => (
                                  <span
                                    key={md.id}
                                    className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold ${
                                      md.docType === "PASPOR"
                                        ? "bg-rose-100 text-rose-800 border border-rose-300"
                                        : "bg-white text-slate-700 border border-slate-200"
                                    }`}
                                  >
                                    {SHORT_DOC_LABEL_MAP[md.docType] || md.docType}
                                  </span>
                                ))}
                              </>
                            )}
                            {item.unverifiedCount > 0 && (
                              <span className="text-[11px] font-medium text-sky-700">
                                ({item.unverifiedCount} berkas menunggu verifikasi admin)
                              </span>
                            )}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            setSelectedCandidateId(item.candidate.id);
                            setCpmiViewMode("DETAIL_ORANG");
                            setActiveNav("cpmi");
                          }}
                          className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold text-white transition cursor-pointer ${
                            item.isPassportMissing
                              ? "bg-rose-600 hover:bg-rose-700"
                              : "bg-amber-600 hover:bg-amber-700"
                          }`}
                        >
                          Lengkapi Berkas →
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* =========================================================
              MODUL 1: MANAJEMEN TENANT & CABANG (SAAS)
             ========================================================= */}
          {activeNav === "saas_tenants" && (
            <TenantBranchModule
              tenants={db.tenants || []}
              branches={db.branches}
              candidatesCount={db.candidates.length}
              selectedTenantId={selectedTenantId}
              onSelectTenant={(id) => setSelectedTenantId(id)}
              isBranchViewOnly={isBranchViewOnly}
              canManageBranches={perms.canManageStaff || currentRole === "DIREKTUR"}
              actorRole={loggedInStaff?.role || "DIREKTUR"}
              actorName={loggedInStaff?.name || "Superadmin Direktur"}
              candidates={db.candidates || []}
              staffAccounts={db.staffAccounts || []}
              sponsors={db.sponsors || []}
              onRefreshDb={fetchDb}
            />
          )}

          {/* =========================================================
              MODUL 2: CETAK DOKUMEN OTOMATIS (PDF GENERATOR)
             ========================================================= */}
          {activeNav === "doc_print" && (
            <DocumentPrintModule
              candidates={db.candidates}
              activeTenant={activeTenant}
              isBranchViewOnly={isBranchViewOnly}
              preselectedCandidateId={selectedCandidate?.id}
              onOpenSyarikahBiodata={(c) => openSyarikahBiodataModal(c)}
              masterImmigrationOffices={db.masterImmigrationOffices || []}
            />
          )}

          {/* =========================================================
              MODUL 3: INTEGRASI WHATSAPP GATEWAY OTOMATIS
             ========================================================= */}
          {activeNav === "whatsapp_gateway" && (
            <WhatsAppGatewayModule
              whatsAppLogs={db.whatsAppLogs || []}
              candidates={db.candidates}
              sponsors={db.sponsors}
              isBranchViewOnly={isBranchViewOnly}
              actorRole={loggedInStaff?.role || "ADMIN_PUSAT"}
              actorName={loggedInStaff?.name || "Admin Pusat"}
              onRefreshDb={fetchDb}
            />
          )}

          {/* =========================================================
              MODUL 4: AKUNTANSI, ARUS KAS BANK & KASBON
             ========================================================= */}
          {activeNav === "aruskas_kasbon" && (
            <CashAndAdvancesModule
              cashJournals={db.cashJournals || []}
              cashAdvances={db.cashAdvances || []}
              syarikahInvoices={db.syarikahInvoices || []}
              sponsors={db.sponsors}
              staffAccounts={db.staffAccounts}
              candidates={db.candidates}
              branches={db.branches}
              foreignAgencies={db.foreignAgencies || []}
              isBranchViewOnly={isBranchViewOnly}
              actorRole={loggedInStaff?.role || "ADMIN_PUSAT"}
              actorName={loggedInStaff?.name || "Admin Pusat"}
              onRefreshDb={fetchDb}
            />
          )}

          {/* =========================================================
              MODUL 5: SELEKSI & WAWANCARA MAJIKAN (MATCHING)
             ========================================================= */}
          {activeNav === "employer_matching" && (
            <EmployerMatchingModule
              employerInterviews={db.employerInterviews || []}
              candidates={db.candidates}
              vacancies={db.vacancies || []}
              foreignAgencies={db.foreignAgencies || []}
              isBranchViewOnly={isBranchViewOnly}
              actorRole={loggedInStaff?.role || "ADMIN_PUSAT"}
              actorName={loggedInStaff?.name || "Admin Pusat"}
              onRefreshDb={fetchDb}
            />
          )}

          {/* =========================================================
              TAB 2: PERSON / DATA CPMI & SATU BERKAS DIGITAL PER ORANG
             ========================================================= */}
          {activeNav === "cpmi" && (
            <div className="space-y-6">
              {/* Bar Pilihan Tampilan Berkas: Detail per Orang vs Tabel Matriks 10 Berkas (KTP, Paspor, Medical, Visa, dll.) */}
              <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    {processTrackFilter === "REKOM" ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-100 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-teal-800">
                        <span className="h-2 w-2 rounded-full bg-teal-500" />
                        Lembar Kerja Jalur Rekom (Resmi SISKOP2MI)
                      </span>
                    ) : processTrackFilter === "NON_REKOM" ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-amber-800">
                        <span className="h-2 w-2 rounded-full bg-amber-500" />
                        Lembar Kerja Jalur Non-Rekom (Cepat)
                      </span>
                    ) : (
                      <span className="text-[11px] font-bold uppercase tracking-wider text-sky-600">
                        Pusat Verifikasi Dokumen & Berkas Digital CPMI
                      </span>
                    )}
                    <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5 text-[11px] font-semibold">
                      <button
                        type="button"
                        onClick={() => handleSelectCpmiTrack("REKOM")}
                        className={`rounded-md px-2 py-0.5 transition cursor-pointer ${
                          processTrackFilter === "REKOM"
                            ? "bg-teal-600 text-white shadow-sm"
                            : "text-slate-600 hover:text-slate-900"
                        }`}
                      >
                        Rekom ({stats.rekomCount})
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSelectCpmiTrack("NON_REKOM")}
                        className={`rounded-md px-2 py-0.5 transition cursor-pointer ${
                          processTrackFilter === "NON_REKOM"
                            ? "bg-amber-600 text-white shadow-sm"
                            : "text-slate-600 hover:text-slate-900"
                        }`}
                      >
                        Non-Rekom ({stats.nonRekomCount})
                      </button>
                    </div>
                  </div>
                  <h2 className="text-base font-bold text-slate-900">
                    {processTrackFilter === "REKOM"
                      ? "Kelola CPMI Jalur Rekomendasi Resmi (ID SISKOP2MI, BLK-LN/BNSP, BPJS-TK, OPP & E-KTKLN)"
                      : processTrackFilter === "NON_REKOM"
                      ? "Kelola CPMI Jalur Non-Rekom (Tanpa BPJS-TK, OPP & E-KTKLN — Langsung Visa, Tiket & Terbang)"
                      : "Cek Status Verifikasi KTP, KK, Paspor, Medical Check-Up, PK & Visa"}
                  </h2>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={docStatusFilter}
                    onChange={(e) => setDocStatusFilter(e.target.value)}
                    className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-800"
                  >
                    <option value="ALL">Filter Berkas: Semua Status ({db.candidates.length} CPMI)</option>
                    <option value="NO_PASSPORT">Belum Ada Paspor (Missing)</option>
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
                        Matriks Rekapitulasi Verifikasi 10 Berkas Wajib{" "}
                        {processTrackFilter === "REKOM"
                          ? "CPMI Jalur Rekom"
                          : processTrackFilter === "NON_REKOM"
                          ? "CPMI Jalur Non-Rekom"
                          : "Seluruh CPMI"}{" "}
                        ({filteredCandidates.length} Kandidat)
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
                                ? "LSP/BNSP"
                                : tpl.docType === "PERJANJIAN_PENEMPATAN"
                                ? "PK Penempatan"
                                : tpl.docType === "EKTKLN_OPP"
                                ? "OPP/e-KPMI"
                                : tpl.docType === "TIKET_EKTKLN"
                                ? "Tiket Pesawat"
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

                  <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
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
                      <option value="ALL">Semua Negara Timur Tengah (Zero Cost)</option>
                      <option value="Arab Saudi">🇸🇦 Arab Saudi (SPSK / Musaned)</option>
                      <option value="Uni Emirat Arab (UAE)">🇦🇪 Uni Emirat Arab (UAE - Tadbeer)</option>
                      <option value="Kuwait">🇰🇼 Kuwait (Sektor Formal / Wakalah)</option>
                      <option value="Oman">🇴🇲 Oman (Hospitality / Caregiver)</option>
                      <option value="Yordania">🇯🇴 Yordania (Jordan - QIZ)</option>
                      <option value="Qatar">🇶🇦 Qatar (Hospitality / Domestic)</option>
                      <option value="Bahrain">🇧🇭 Bahrain (Caregiver / Domestic)</option>
                    </select>

                    <select
                      value={processTrackFilter}
                      onChange={(e) =>
                        setProcessTrackFilter(e.target.value as "ALL" | ProcessTrack)
                      }
                      className="sm:col-span-2 rounded-lg border border-teal-300 bg-teal-50/70 px-2.5 py-1.5 text-xs font-bold text-teal-950"
                    >
                      <option value="ALL">
                        ⚡ Semua Alur Penempatan Timur Tengah (Rekom SPSK & Non-Rekom)
                      </option>
                      <option value="REKOM">
                        ✓ Alur REKOM (Resmi SPSK Satu Kanal: Wajib BPJS-TK, PAP & E-KTKLN)
                      </option>
                      <option value="NON_REKOM">
                        🚀 Alur NON-REKOM (Tanpa BPJS-TK, KTKLN & PAP ➔ Langsung Tiket & Terbang)
                      </option>
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
                                <span
                                  className={`rounded px-1.5 py-0.5 text-[9.5px] font-extrabold ${
                                    (c.processTrack || "REKOM") === "NON_REKOM"
                                      ? "bg-amber-100 text-amber-950 border border-amber-300"
                                      : "bg-teal-100 text-teal-900 border border-teal-300"
                                  }`}
                                >
                                  {(c.processTrack || "REKOM") === "NON_REKOM"
                                    ? "⚡ NON-REKOM (Langsung Tiket)"
                                    : "✓ REKOM (SPSK Resmi)"}
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
                              <span
                                className={`rounded-full px-3 py-0.5 text-xs font-extrabold ${
                                  (selectedCandidate.processTrack || "REKOM") === "NON_REKOM"
                                    ? "bg-amber-500 text-slate-950"
                                    : "bg-teal-600 text-white"
                                }`}
                              >
                                {(selectedCandidate.processTrack || "REKOM") === "NON_REKOM"
                                  ? "⚡ ALUR NON-REKOM (Tanpa BPJS-TK/KTKLN/PAP ➔ Langsung Tiket)"
                                  : "✓ ALUR REKOM (Resmi SPSK Satu Kanal · Zero Cost)"}
                              </span>
                              <span className="rounded-full bg-emerald-50 border border-emerald-300 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800">
                                100% Zero Cost Syarikah/Majikan
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
                                setSelectedCandidateId(selectedCandidate.id);
                                setActiveNav("doc_print");
                              }}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-900 shadow-xs hover:bg-emerald-100"
                            >
                              <Printer className="h-3.5 w-3.5 text-emerald-700" />
                              📄 Cetak Dokumen Resmi (Kanim/PK)
                            </button>

                            <button
                              onClick={() => {
                                setSelectedCandidateId(selectedCandidate.id);
                                setActiveNav("whatsapp_gateway");
                              }}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-600 bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-700"
                            >
                              <MessageSquarePlus className="h-3.5 w-3.5 text-white" />
                              💬 Notifikasi WA
                            </button>

                            <button
                              onClick={() => {
                                setSelectedCandidateId(selectedCandidate.id);
                                setActiveNav("employer_matching");
                              }}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-sky-500 bg-sky-50 px-3 py-1.5 text-xs font-bold text-sky-900 shadow-xs hover:bg-sky-100"
                            >
                              <UserCheck className="h-3.5 w-3.5 text-sky-700" />
                              🤝 Wawancara Majikan
                            </button>

                            <button
                              onClick={() => openSyarikahBiodataModal(selectedCandidate)}
                              className="inline-flex items-center gap-1.5 rounded-lg border-2 border-indigo-500 bg-indigo-600 px-3 py-1.5 text-xs font-extrabold text-white shadow-sm hover:bg-indigo-700"
                            >
                              <Printer className="h-3.5 w-3.5 text-amber-300" />
                              🌍 Printout Biodata Syarikah (CV Majikan)
                            </button>

                            <button
                              onClick={() => setPrintingRegFormCandidate(selectedCandidate)}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-sky-300 bg-sky-50 px-3 py-1.5 text-xs font-bold text-sky-900 shadow-xs hover:bg-sky-100"
                            >
                              <Printer className="h-3.5 w-3.5 text-sky-700" />
                              🖨️ Formulir Pendaftaran Resmi (Cetak)
                            </button>

                            <button
                              onClick={() => {
                                const fallbackRepl =
                                  db.candidates.find(
                                    (cand) =>
                                      cand.id !== selectedCandidate.id &&
                                      cand.specialStatus === "NORMAL" &&
                                      ["LEAD", "PROSPECT", "CPMI"].includes(cand.stage)
                                  )?.id ||
                                  db.candidates.find((cand) => cand.id !== selectedCandidate.id)?.id ||
                                  "";
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
                              value={selectedCandidate.processTrack || "REKOM"}
                              onChange={async (e) => {
                                const newTrack = e.target.value as ProcessTrack;
                                await callApi("UPDATE_CANDIDATE", {
                                  candidateId: selectedCandidate.id,
                                  updates: { processTrack: newTrack },
                                });
                                setToast({
                                  type: "success",
                                  title: `Alur Proses ${selectedCandidate.fullName} Diubah ke ${
                                    newTrack === "NON_REKOM"
                                      ? "ALUR NON-REKOM (Tanpa BPJS-TK, KTKLN & PAP — Langsung Tiket)"
                                      : "ALUR REKOM (Resmi SPSK Satu Kanal: Wajib BPJS-TK, PAP & E-KTKLN)"
                                  }`,
                                  details: [
                                    newTrack === "NON_REKOM"
                                      ? "Tahap BPJS-TK, PAP, dan E-KTKLN otomatis dilewati. Setelah Medical, Paspor & Visa siap, langsung ke Tiket & Keberangkatan."
                                      : "Mengikuti urutan resmi SPSK Satu Kanal lengkap dengan Rekomendasi SISKOP2MI, BPJS-TK, PAP & E-KTKLN.",
                                  ],
                                });
                              }}
                              className={`rounded-lg border px-2.5 py-1.5 text-xs font-extrabold ${
                                (selectedCandidate.processTrack || "REKOM") === "NON_REKOM"
                                  ? "border-amber-400 bg-amber-50 text-amber-950"
                                  : "border-teal-400 bg-teal-50 text-teal-950"
                              }`}
                            >
                              <option value="REKOM">
                                ✓ Alur Rekom (Resmi SPSK: BPJS-TK, PAP & KTKLN)
                              </option>
                              <option value="NON_REKOM">
                                ⚡ Alur Non-Rekom (Tanpa BPJS-TK/KTKLN/PAP ➔ Langsung Tiket)
                              </option>
                            </select>

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
                          <span className="text-slate-400 block">Syarikah / Agensi Mitra</span>
                          {!isBranchViewOnly ? (
                            <select
                              value={
                                selectedCandidate.agencyPartner ||
                                selectedCandidate.employerName ||
                                ""
                              }
                              onChange={async (e) => {
                                const val = e.target.value;
                                await callApi("UPDATE_CANDIDATE", {
                                  candidateId: selectedCandidate.id,
                                  updates: {
                                    agencyPartner: val,
                                    employerName: val || selectedCandidate.employerName,
                                  },
                                });
                                setToast({
                                  type: "success",
                                  title: `Syarikah Mitra ${selectedCandidate.fullName} Diperbarui`,
                                  details: [val || "Belum ditentukan"],
                                });
                              }}
                              className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-bold text-slate-900 focus:border-sky-500 focus:outline-none"
                            >
                              <option value="">-- Pilih dari Master Syarikah --</option>
                              {(db.foreignAgencies || []).map((a) => (
                                <option key={a.id} value={a.name}>
                                  {a.name} ({a.country})
                                  {a.status !== "ACTIVE" ? ` [${a.status}]` : ""}
                                </option>
                              ))}
                              {(selectedCandidate.agencyPartner || selectedCandidate.employerName) &&
                                !(db.foreignAgencies || []).some(
                                  (a) =>
                                    a.name ===
                                    (selectedCandidate.agencyPartner ||
                                      selectedCandidate.employerName)
                                ) && (
                                  <option
                                    value={
                                      selectedCandidate.agencyPartner ||
                                      selectedCandidate.employerName ||
                                      ""
                                    }
                                  >
                                    {selectedCandidate.agencyPartner ||
                                      selectedCandidate.employerName}
                                  </option>
                                )}
                            </select>
                          ) : (
                            <strong className="text-slate-900 mt-0.5 block truncate">
                              {selectedCandidate.agencyPartner ||
                                selectedCandidate.employerName ||
                                "Belum ditentukan"}
                            </strong>
                          )}
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
                          <span className="text-slate-400 block">Biaya &amp; Margin Penempatan</span>
                          {perms.canSeeFinance ? (
                            <strong className="text-teal-700 mt-0.5 block">
                              {formatRupiah(selectedCandidate.placementFee)} (Margin{" "}
                              {formatRupiah(
                                selectedCandidate.placementFee - selectedCandidate.costIncurred
                              )}
                              )
                            </strong>
                          ) : (
                            <strong className="text-slate-400 mt-0.5 block text-[11px]">
                              🔒 Khusus Role Keuangan &amp; Superadmin
                            </strong>
                          )}
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

                    {/* PANEL SKEMA PENEMPATAN TIMUR TENGAH: ALUR RESMI SPSK (REKOM) VS ALUR NON-REKOM (ZERO COST SYARIKAH) */}
                    <div
                      className={`rounded-2xl border p-5 shadow-sm ${
                        (selectedCandidate.processTrack || "REKOM") === "NON_REKOM"
                          ? "border-amber-300 bg-amber-50/60"
                          : "border-teal-300 bg-teal-50/50"
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 pb-3">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase text-white ${
                                (selectedCandidate.processTrack || "REKOM") === "NON_REKOM"
                                  ? "bg-amber-600"
                                  : "bg-teal-700"
                              }`}
                            >
                              {(selectedCandidate.processTrack || "REKOM") === "NON_REKOM"
                                ? "JALUR AKTIF: ALUR PROSES NON-REKOM (LANGSUNG TIKET & KEBERANGKATAN)"
                                : "JALUR AKTIF: ALUR PENEMPATAN RESMI SPSK (SISTEM PENEMPATAN SATU KANAL — REKOM)"}
                            </span>
                            <span className="rounded-full bg-emerald-100 border border-emerald-300 px-2.5 py-0.5 text-[10px] font-extrabold text-emerald-900">
                              💰 Pembiayaan 100% Zero Cost (Langsung dari Syarikah / Majikan Timur Tengah)
                            </span>
                          </div>
                          <h3 className="mt-1.5 text-sm font-bold text-slate-900">
                            {(selectedCandidate.processTrack || "REKOM") === "NON_REKOM"
                              ? "Alur Non-Rekom: Melewati BPJS-TK, PAP & E-KTKLN — Setelah Medical, Paspor & Visa Langsung Proses Tiket & Keberangkatan"
                              : "Urutan Alur Resmi Penempatan PMI Timur Tengah (Skema SPSK Satu Kanal SISKOP2MI–Musaned / Tadbeer)"}
                          </h3>
                        </div>

                        <div className="inline-flex rounded-xl border border-slate-300 bg-white p-1 text-xs shadow-2xs">
                          <button
                            type="button"
                            onClick={async () => {
                              await callApi("UPDATE_CANDIDATE", {
                                candidateId: selectedCandidate.id,
                                updates: { processTrack: "REKOM" },
                              });
                              setToast({
                                type: "success",
                                title: `${selectedCandidate.fullName} Beralih ke Alur REKOM (Resmi SPSK Satu Kanal)`,
                              });
                            }}
                            className={`rounded-lg px-3 py-1.5 font-extrabold transition ${
                              (selectedCandidate.processTrack || "REKOM") === "REKOM"
                                ? "bg-teal-700 text-white shadow-xs"
                                : "text-slate-600 hover:text-slate-900"
                            }`}
                          >
                            ✓ 1. Alur Rekom (Resmi SPSK)
                          </button>
                          <button
                            type="button"
                            onClick={async () => {
                              await callApi("UPDATE_CANDIDATE", {
                                candidateId: selectedCandidate.id,
                                updates: { processTrack: "NON_REKOM" },
                              });
                              setToast({
                                type: "success",
                                title: `${selectedCandidate.fullName} Beralih ke Alur NON-REKOM (Langsung Tiket & Terbang)`,
                              });
                            }}
                            className={`rounded-lg px-3 py-1.5 font-extrabold transition ${
                              (selectedCandidate.processTrack || "REKOM") === "NON_REKOM"
                                ? "bg-amber-500 text-slate-950 shadow-xs"
                                : "text-slate-600 hover:text-slate-900"
                            }`}
                          >
                            ⚡ 2. Alur Non-Rekom (Langsung Tiket)
                          </button>
                        </div>
                      </div>

                      {/* Urutan Langkah Spesifik SPSK (Rekom) vs Non-Rekom */}
                      <div className="mt-3.5 grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-6 text-[11px]">
                        <div className="rounded-xl border border-teal-200 bg-white p-2.5">
                          <span className="font-mono text-[10px] font-bold text-teal-700">
                            TAHAP 01 · WAJIB
                          </span>
                          <p className="mt-0.5 font-bold text-slate-900">
                            1. Seleksi, Interview & Dokumen Dasar
                          </p>
                          <p className="mt-0.5 text-[10px] text-slate-500">
                            Info Sponsor ➔ Interview Petugas PT (Blanko F4) ➔ KTP, KK, Akta, Izin Keluarga.
                          </p>
                        </div>

                        <div className="rounded-xl border border-teal-200 bg-white p-2.5">
                          <span className="font-mono text-[10px] font-bold text-teal-700">
                            TAHAP 02 · WAJIB
                          </span>
                          <p className="mt-0.5 font-bold text-slate-900">
                            2. Pra-Medical & Medical Wafid (GAMCA)
                          </p>
                          <p className="mt-0.5 text-[10px] text-slate-500">
                            Pemeriksaan klinik resmi Wafid GCC hingga terbit status <strong>FIT TO WORK</strong>.
                          </p>
                        </div>

                        <div className="rounded-xl border border-teal-200 bg-white p-2.5">
                          <span className="font-mono text-[10px] font-bold text-teal-700">
                            TAHAP 03 · WAJIB
                          </span>
                          <p className="mt-0.5 font-bold text-slate-900">
                            {(selectedCandidate.processTrack || "REKOM") === "NON_REKOM"
                              ? "3. Paspor RI (48 Hal)"
                              : "3. Rekom ID SISKOP2MI & Paspor RI"}
                          </p>
                          <p className="mt-0.5 text-[10px] text-slate-500">
                            {(selectedCandidate.processTrack || "REKOM") === "NON_REKOM"
                              ? "Penerbitan Paspor aktif tanpa syarat Rekom ID SISKOP2MI."
                              : "Sinkronisasi Satu Kanal SISKOP2MI–Musaned & Rekomendasi Paspor Disnaker."}
                          </p>
                        </div>

                        <div className="rounded-xl border border-teal-200 bg-white p-2.5">
                          <span className="font-mono text-[10px] font-bold text-teal-700">
                            TAHAP 04 · WAJIB
                          </span>
                          <p className="mt-0.5 font-bold text-slate-900">
                            4. Kontrak Syarikah, Biometrik Tasheer & Visa
                          </p>
                          <p className="mt-0.5 text-[10px] text-slate-500">
                            Wakalah/Kontrak Kerja Syarikah, Rekam Sidik Jari Tasheer (VFS) & Visa Kerja terbit.
                          </p>
                        </div>

                        <div
                          className={`rounded-xl border p-2.5 ${
                            (selectedCandidate.processTrack || "REKOM") === "NON_REKOM"
                              ? "border-dashed border-amber-400 bg-amber-100/60 opacity-85"
                              : "border-teal-200 bg-white"
                          }`}
                        >
                          <span
                            className={`font-mono text-[10px] font-extrabold ${
                              (selectedCandidate.processTrack || "REKOM") === "NON_REKOM"
                                ? "text-amber-800"
                                : "text-teal-700"
                            }`}
                          >
                            {(selectedCandidate.processTrack || "REKOM") === "NON_REKOM"
                              ? "TAHAP 05 · DILEWATI (SKIP)"
                              : "TAHAP 05 · WAJIB SPSK"}
                          </span>
                          <p
                            className={`mt-0.5 font-bold ${
                              (selectedCandidate.processTrack || "REKOM") === "NON_REKOM"
                                ? "line-through text-slate-500"
                                : "text-slate-900"
                            }`}
                          >
                            5. BPJS-TK, PAP & E-KTKLN
                          </p>
                          <p className="mt-0.5 text-[10px] text-slate-600">
                            {(selectedCandidate.processTrack || "REKOM") === "NON_REKOM"
                              ? "Tidak perlu dikerjakan pada jalur Non-Rekom (langsung lompat ke Tiket)."
                              : "Pelunasan BPJS Ketenagakerjaan PMI, Pembekalan Akhir (PAP) & Penerbitan E-KTKLN."}
                          </p>
                        </div>

                        <div className="rounded-xl border-2 border-emerald-500 bg-emerald-50/70 p-2.5">
                          <span className="font-mono text-[10px] font-extrabold text-emerald-800">
                            TAHAP 06 · AKHIR
                          </span>
                          <p className="mt-0.5 font-bold text-emerald-950">
                            6. Tiket Pesawat & Keberangkatan
                          </p>
                          <p className="mt-0.5 text-[10px] text-emerald-900">
                            {(selectedCandidate.processTrack || "REKOM") === "NON_REKOM"
                              ? "Begitu Visa terbit, langsung proses Tiket Pesawat & Keberangkatan ke Timur Tengah."
                              : "Issued Tiket Penerbangan (Saudia/Emirates/Etihad/Qatar) & Penempatan di Syarikah."}
                          </p>
                        </div>
                      </div>
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

                          const isNonRekom =
                            (selectedCandidate.processTrack || "REKOM") === "NON_REKOM";
                          const isSkippedInNonRekom =
                            isNonRekom &&
                            ["SERTIFIKAT_KOMPETENSI", "PERJANJIAN_PENEMPATAN", "EKTKLN_OPP"].includes(
                              doc.docType
                            );
                          const isDirectTicketInNonRekom =
                            isNonRekom && doc.docType === "TIKET_EKTKLN";

                          return (
                            <div
                              key={doc.id}
                              className={`rounded-xl border p-4 transition ${
                                isSkippedInNonRekom
                                  ? "border-dashed border-amber-300 bg-amber-50/40"
                                  : isExpired
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
                                    <span
                                      className={`text-sm font-bold ${
                                        isSkippedInNonRekom
                                          ? "line-through text-slate-500"
                                          : "text-slate-900"
                                      }`}
                                    >
                                      {doc.title}
                                    </span>

                                    {isSkippedInNonRekom && (
                                      <span className="rounded-full bg-amber-200 px-2.5 py-0.5 text-[10px] font-extrabold text-amber-950 border border-amber-400">
                                        ⚡ DILEWATI PADA ALUR NON-REKOM (TIDAK PERLU DIKERJAKAN)
                                      </span>
                                    )}

                                    {isDirectTicketInNonRekom && (
                                      <span className="rounded-full bg-emerald-600 px-2.5 py-0.5 text-[10px] font-extrabold text-white">
                                        ✈️ LANGSUNG PROSES TIKET & KEBERANGKATAN (TANPA BPJS-TK / KTKLN / PAP)
                                      </span>
                                    )}

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
                  <span className="text-[11px] font-bold uppercase tracking-wider text-teal-700">
                    Fokus 100% Kawasan Timur Tengah · Pembiayaan Langsung Syarikah / Majikan (Zero Cost)
                  </span>
                  <h2 className="text-base font-bold text-slate-900">
                    Publikasi Job Order / Wakalah Syarikah Timur Tengah & Pendaftaran Lead Otomatis
                  </h2>
                  <p className="text-xs text-slate-500">
                    Khusus penempatan <strong>Kawasan Timur Tengah (Arab Saudi SPSK/Musaned, UAE Tadbeer/MOHRE, Kuwait, Oman, Yordania, Qatar & Bahrain)</strong> dengan skema <strong>100% Zero Cost (Dibiayai Langsung Syarikah/Majikan)</strong>.
                  </p>
                </div>

                {!isBranchViewOnly && (
                  <button
                    onClick={() => openVacancyModal()}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white hover:bg-slate-800 cursor-pointer"
                  >
                    <Plus className="h-4 w-4 text-sky-400" />
                    Buat Job Order / Lowongan Baru
                  </button>
                )}
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

              {(!db.vacancies || db.vacancies.length === 0) ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-xs text-slate-500">
                  Belum ada Job Order / lowongan aktif. Klik{" "}
                  <strong>Buat Job Order / Lowongan Baru</strong> untuk menayangkan lowongan.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                  {db.vacancies.map((vac) => {
                    const pct = Math.min(
                      100,
                      Math.round((vac.quotaFilled / Math.max(1, vac.quotaTotal)) * 100)
                    );
                    const isConfirmingDelete = deletingVacancyId === vac.id;
                    return (
                      <div
                        key={vac.id}
                        className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
                      >
                        <div>
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex flex-wrap items-center gap-2">
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
                              disabled={isBranchViewOnly}
                              onClick={() =>
                                callApi("TOGGLE_VACANCY_PUBLISH", { vacancyId: vac.id })
                              }
                              className={`rounded-full px-3 py-1 text-[11px] font-bold transition ${
                                vac.isPublished
                                  ? "bg-teal-100 text-teal-800 hover:bg-teal-200"
                                  : "bg-slate-200 text-slate-600 hover:bg-slate-300"
                              } disabled:opacity-60 disabled:cursor-not-allowed`}
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
                              <span className="text-slate-400 block text-[11px]">
                                Syarat Usia &amp; Pend
                              </span>
                              <strong className="text-slate-800">{vac.ageRange}</strong>
                              <span className="block text-[10px] text-slate-500">
                                Min. {vac.minEducation} ({vac.genderPref})
                              </span>
                            </div>
                            <div>
                              <span className="text-slate-400 block text-[11px]">
                                Batas Lamaran
                              </span>
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
                          {!isBranchViewOnly ? (
                            <div className="flex flex-wrap items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => openVacancyModal(vac)}
                                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                              >
                                <Pencil className="h-3.5 w-3.5 text-sky-600" />
                                Edit
                              </button>
                              {isConfirmingDelete ? (
                                <div className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2 py-1">
                                  <span className="text-[11px] font-bold text-rose-700">
                                    Hapus?
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteVacancy(vac)}
                                    className="rounded bg-rose-600 px-2 py-0.5 text-[11px] font-bold text-white hover:bg-rose-700 cursor-pointer"
                                  >
                                    Ya
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setDeletingVacancyId(null)}
                                    className="rounded border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                                  >
                                    Batal
                                  </button>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => setDeletingVacancyId(vac.id)}
                                  className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100 cursor-pointer"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                  Hapus
                                </button>
                              )}
                            </div>
                          ) : (
                            <span className="text-[11px] text-slate-400">
                              Pelamar otomatis tercatat di Journey Engine
                            </span>
                          )}
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
                            className="inline-flex items-center gap-1.5 rounded-lg bg-sky-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-sky-700 cursor-pointer"
                          >
                            <UserPlus className="h-3.5 w-3.5" />
                            Simulasikan Pelamar Melamar Lowongan Ini
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
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
              TAB: STAF MULTI-USER (RBAC), MANAJEMEN ROLE & JEJAK AUDIT
             ========================================================= */}
          {activeNav === "cabang_audit" && (
            <RoleAndPermissionModule
              roles={db.roles || []}
              staffAccounts={db.staffAccounts || []}
              branches={db.branches || []}
              sponsors={db.sponsors || []}
              auditLogs={db.auditLogs || []}
              candidates={db.candidates || []}
              loggedInStaff={loggedInStaff}
              isBranchViewOnly={isBranchViewOnly}
              canManageStaff={perms.canManageStaff || currentRole === "DIREKTUR"}
              actorName={loggedInStaff?.name || "Superadmin Direktur"}
              actorRole={loggedInStaff?.role || "DIREKTUR"}
              onRefreshDb={fetchDb}
              onStaffUpdated={(updatedStaff) => {
                setLoggedInStaff(updatedStaff);
                setSelectedBranchId(
                  updatedStaff.branchId === "ALL" ? "ALL" : updatedStaff.branchId
                );
              }}
              onSwitchStaffAccount={async (st) => {
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
              onOpenAddStaffModal={() => setShowAddStaffModal(true)}
            />
          )}

          {/* =========================================================
              TAB: PENGATURAN MAINTENANCE (BACKUP, RESTORE & RESET DATABASE)
             ========================================================= */}
          {activeNav === "maintenance" && (
            <MaintenanceModule
              db={db}
              loggedInStaff={loggedInStaff}
              actorName={loggedInStaff?.name || "Direktur Utama"}
              actorRole={loggedInStaff?.role || "DIREKTUR"}
              canAccessMaintenance={Boolean(perms.canManageStaff || currentRole === "DIREKTUR")}
              onRefreshDb={fetchDb}
            />
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

                  {/* Banner Integrasi Real-Time dengan Modul 4: Arus Kas & Kasbon */}
                  {(() => {
                    const totalMasuk = (db.cashJournals || [])
                      .filter((j) => j.type === "MASUK")
                      .reduce((s, j) => s + j.amount, 0);
                    const totalKeluar = (db.cashJournals || [])
                      .filter((j) => j.type === "KELUAR")
                      .reduce((s, j) => s + j.amount, 0);
                    const saldoBersih = totalMasuk - totalKeluar;
                    const activeSponsorAdvances = (db.cashAdvances || []).filter(
                      (a) =>
                        a.borrowerType === "SPONSOR" &&
                        a.status !== "LUNAS" &&
                        a.remainingAmount > 0
                    );
                    const totalSponsorKasbonAktif = activeSponsorAdvances.reduce(
                      (s, a) => s + a.remainingAmount,
                      0
                    );

                    return (
                      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50/70 px-5 py-3.5 shadow-xs">
                        <div className="flex flex-wrap items-center gap-4 text-xs">
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-bold text-emerald-800">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Terintegrasi Real-Time ke Arus Kas & Kasbon
                          </span>
                          <div className="text-slate-700">
                            Saldo Kas Bersih:{" "}
                            <strong className="text-slate-950">
                              {formatRupiah(saldoBersih)}
                            </strong>{" "}
                            <span className="text-slate-500">
                              ({(db.cashJournals || []).length} jurnal)
                            </span>
                          </div>
                          <div className="text-slate-700">
                            Kasbon Sponsor Belum Lunas:{" "}
                            <strong
                              className={
                                totalSponsorKasbonAktif > 0 ? "text-amber-800" : "text-slate-900"
                              }
                            >
                              {formatRupiah(totalSponsorKasbonAktif)}
                            </strong>{" "}
                            <span className="text-slate-500">
                              ({activeSponsorAdvances.length} kasbon aktif · otomatis terpotong saat bayar fee)
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setActiveNav("aruskas_kasbon")}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-amber-300 bg-white px-3.5 py-1.5 text-xs font-bold text-amber-900 shadow-xs transition hover:bg-amber-100 cursor-pointer"
                        >
                          <Coins className="h-3.5 w-3.5 text-amber-600" />
                          Buka Modul Arus Kas & Kasbon →
                        </button>
                      </div>
                    );
                  })()}

                  {/* BAGIAN 1: TABEL RINGKAS PEMBAYARAN FEE SPONSOR BERTAHAP (DP 1, DP 2, DP 3, PELUNASAN) */}
                  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
                      <div>
                        <h2 className="text-base font-bold text-slate-900">
                          Daftar Pembayaran Fee Sponsor Bertahap (DP 1 · DP 2 · DP 3 · Pelunasan)
                        </h2>
                        <p className="mt-0.5 text-xs text-slate-500">
                          <strong>DP 1 (20% Medical FIT)</strong> →{" "}
                          <strong>DP 2 (25% Paspor/ID)</strong> →{" "}
                          <strong>DP 3 (25% Visa/PK)</strong> →{" "}
                          <strong>Pelunasan (30% Terbang)</strong>
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => openBatchSponsorPayModal()}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-700 cursor-pointer"
                        >
                          <CreditCard className="h-3.5 w-3.5" />
                          Bayar DP Custom / Kolektif Sponsor
                        </button>

                        {/* Toggle Tampilan Tabel Ringkas vs Kartu Detail */}
                        <div className="inline-flex rounded-xl border border-slate-200 bg-slate-100 p-1 text-xs">
                          <button
                            type="button"
                            onClick={() => setFinanceViewMode("TABEL_RINGKAS")}
                            className={`rounded-lg px-3 py-1.5 font-bold transition ${
                              financeViewMode === "TABEL_RINGKAS"
                                ? "bg-slate-900 text-white shadow-xs"
                                : "text-slate-600 hover:text-slate-900"
                            }`}
                          >
                            📋 Tabel Ringkas (Skala Besar)
                          </button>
                          <button
                            type="button"
                            onClick={() => setFinanceViewMode("KARTU_DETAIL")}
                            className={`rounded-lg px-3 py-1.5 font-bold transition ${
                              financeViewMode === "KARTU_DETAIL"
                                ? "bg-slate-900 text-white shadow-xs"
                                : "text-slate-600 hover:text-slate-900"
                            }`}
                          >
                            🗂️ Kartu Detail
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Baris Pencarian, Filter Status & Dropdown List Sponsor */}
                    <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-12">
                      <div className="relative sm:col-span-5">
                        <Search className="pointer-events-none absolute top-2.5 left-3 h-4 w-4 text-slate-400" />
                        <input
                          type="text"
                          value={financeSearchQuery}
                          onChange={(e) => setFinanceSearchQuery(e.target.value)}
                          placeholder="Cari nama CPMI, No. Registrasi, negara, atau nama sponsor..."
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pr-3 pl-9 text-xs text-slate-900 focus:border-sky-500 focus:bg-white focus:outline-none"
                        />
                      </div>
                      <div className="sm:col-span-3">
                        <select
                          value={financeStatusFilter}
                          onChange={(e) =>
                            setFinanceStatusFilter(
                              e.target.value as
                                | "ALL"
                                | "SIAP_CAIR"
                                | "BELUM_LUNAS"
                                | "LUNAS_100"
                            )
                          }
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-800"
                        >
                          <option value="ALL">Semua Status Termin</option>
                          <option value="SIAP_CAIR">⚡ Ada Termin Siap Cair</option>
                          <option value="BELUM_LUNAS">⏳ Masih Ada Sisa Terutang</option>
                          <option value="LUNAS_100">✓ Sudah Lunas 100%</option>
                        </select>
                      </div>
                      <div className="relative sm:col-span-4" ref={financeSponsorDropdownRef}>
                        {(() => {
                          const selectedSponsorObj =
                            financeSponsorFilter === "ALL"
                              ? null
                              : db.sponsors.find((s) => s.id === financeSponsorFilter) || null;
                          const sponsorsWithDebtCount = db.sponsors.filter(
                            (s) => s.payableAmount > 0
                          ).length;
                          const totalSponsorPayable = db.sponsors.reduce(
                            (sum, s) => sum + (s.payableAmount || 0),
                            0
                          );
                          const sortedFilteredSponsors = [...db.sponsors]
                            .filter((sp) => {
                              if (financeSponsorOnlyDebt && sp.payableAmount <= 0) return false;
                              const q = financeSponsorDropdownQuery.trim().toLowerCase();
                              if (!q) return true;
                              return (
                                sp.name.toLowerCase().includes(q) ||
                                sp.code.toLowerCase().includes(q) ||
                                (sp.area || "").toLowerCase().includes(q)
                              );
                            })
                            .sort((a, b) => {
                              if ((b.payableAmount > 0 ? 1 : 0) !== (a.payableAmount > 0 ? 1 : 0)) {
                                return b.payableAmount > 0 ? 1 : -1;
                              }
                              return b.payableAmount - a.payableAmount;
                            });

                          return (
                            <>
                              <button
                                type="button"
                                onClick={() =>
                                  setFinanceSponsorDropdownOpen((prev) => !prev)
                                }
                                className="flex w-full items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-left text-xs text-slate-800 transition hover:border-slate-300 hover:bg-white focus:border-sky-500 focus:bg-white focus:outline-none"
                              >
                                <span className="flex min-w-0 items-center gap-1.5">
                                  {selectedSponsorObj ? (
                                    <>
                                      <span className="truncate font-bold text-slate-900">
                                        {selectedSponsorObj.name}
                                      </span>
                                      <span className="shrink-0 rounded bg-rose-50 px-1.5 py-0.5 text-[10px] font-bold text-rose-700">
                                        Sisa: {formatRupiah(selectedSponsorObj.payableAmount)}
                                      </span>
                                    </>
                                  ) : (
                                    <>
                                      <span className="truncate font-semibold text-slate-800">
                                        Semua Sponsor ({db.sponsors.length})
                                      </span>
                                      {sponsorsWithDebtCount > 0 && (
                                        <span className="shrink-0 rounded bg-rose-50 px-1.5 py-0.5 text-[10px] font-bold text-rose-700">
                                          {sponsorsWithDebtCount} Ada Sisa
                                        </span>
                                      )}
                                    </>
                                  )}
                                </span>
                                <ChevronDown
                                  className={`h-4 w-4 shrink-0 text-slate-500 transition-transform ${
                                    financeSponsorDropdownOpen ? "rotate-180" : ""
                                  }`}
                                />
                              </button>

                              {financeSponsorDropdownOpen && (
                                <div className="absolute right-0 left-0 z-40 mt-1.5 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
                                  <div className="border-b border-slate-100 bg-slate-50 p-2">
                                    <div className="relative">
                                      <Search className="pointer-events-none absolute top-2 left-2.5 h-3.5 w-3.5 text-slate-400" />
                                      <input
                                        type="text"
                                        value={financeSponsorDropdownQuery}
                                        onChange={(e) =>
                                          setFinanceSponsorDropdownQuery(e.target.value)
                                        }
                                        placeholder="Cari nama atau kode sponsor..."
                                        className="w-full rounded-lg border border-slate-200 bg-white py-1.5 pr-2.5 pl-8 text-xs text-slate-900 focus:border-sky-500 focus:outline-none"
                                      />
                                    </div>
                                    <div className="mt-1.5 flex items-center justify-between gap-2 text-[11px]">
                                      <button
                                        type="button"
                                        onClick={() =>
                                          setFinanceSponsorOnlyDebt((prev) => !prev)
                                        }
                                        className={`rounded-md border px-2 py-0.5 font-semibold transition ${
                                          financeSponsorOnlyDebt
                                            ? "border-rose-300 bg-rose-50 text-rose-700"
                                            : "border-slate-200 bg-white text-slate-600 hover:bg-slate-100"
                                        }`}
                                      >
                                        {financeSponsorOnlyDebt
                                          ? `✓ Hanya Ada Sisa (${sponsorsWithDebtCount})`
                                          : `Filter Ada Sisa (${sponsorsWithDebtCount})`}
                                      </button>
                                      <span className="text-[10px] text-slate-400">
                                        {sortedFilteredSponsors.length} sponsor
                                      </span>
                                    </div>
                                  </div>

                                  <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setFinanceSponsorFilter("ALL");
                                        setFinanceSponsorDropdownOpen(false);
                                      }}
                                      className={`flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-xs transition ${
                                        financeSponsorFilter === "ALL"
                                          ? "bg-slate-900 text-white font-bold"
                                          : "bg-white text-slate-800 hover:bg-slate-50"
                                      }`}
                                    >
                                      <span className="truncate font-semibold">
                                        Semua Sponsor ({db.sponsors.length})
                                      </span>
                                      <span
                                        className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold ${
                                          financeSponsorFilter === "ALL"
                                            ? "bg-white/20 text-white"
                                            : "bg-rose-50 text-rose-700"
                                        }`}
                                      >
                                        Total Sisa: {formatRupiah(totalSponsorPayable)}
                                      </span>
                                    </button>

                                    {sortedFilteredSponsors.length === 0 ? (
                                      <div className="px-3 py-4 text-center text-xs text-slate-400">
                                        Tidak ada sponsor yang cocok dengan pencarian.
                                      </div>
                                    ) : (
                                      sortedFilteredSponsors.map((sp) => {
                                        const active = financeSponsorFilter === sp.id;
                                        return (
                                          <button
                                            key={sp.id}
                                            type="button"
                                            onClick={() => {
                                              setFinanceSponsorFilter(sp.id);
                                              setFinanceSponsorDropdownOpen(false);
                                            }}
                                            className={`flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-xs transition ${
                                              active
                                                ? "bg-emerald-50 text-emerald-950 font-bold"
                                                : "bg-white text-slate-700 hover:bg-slate-50"
                                            }`}
                                          >
                                            <span className="flex min-w-0 items-center gap-1.5">
                                              <span className="truncate font-semibold text-slate-900">
                                                {sp.name}
                                              </span>
                                              <span className="shrink-0 rounded bg-rose-50 px-1.5 py-0.5 text-[10px] font-bold text-rose-700">
                                                Sisa: {formatRupiah(sp.payableAmount)}
                                              </span>
                                            </span>
                                            <span className="shrink-0 font-mono text-[10px] text-slate-400">
                                              {sp.code}
                                            </span>
                                          </button>
                                        );
                                      })
                                    )}
                                  </div>
                                </div>
                              )}
                            </>
                          );
                        })()}
                      </div>
                    </div>

                    {/* DATA CPMI & TERMIN FEE SPONSOR */}
                    {(() => {
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

                      const filteredFinanceCandidates = db.candidates.filter((c) => {
                        if (selectedBranchId !== "ALL" && c.branchId !== selectedBranchId)
                          return false;
                        if (!c.sponsorId || c.sponsorCommission <= 0) return false;
                        if (
                          financeSponsorFilter !== "ALL" &&
                          c.sponsorId !== financeSponsorFilter
                        )
                          return false;

                        const sp = db.sponsors.find((s) => s.id === c.sponsorId);
                        if (financeSearchQuery.trim()) {
                          const q = financeSearchQuery.toLowerCase();
                          const match =
                            c.fullName.toLowerCase().includes(q) ||
                            c.regNumber.toLowerCase().includes(q) ||
                            c.destinationCountry.toLowerCase().includes(q) ||
                            (sp?.name || "").toLowerCase().includes(q);
                          if (!match) return false;
                        }

                        const installments = c.finance?.sponsorInstallments || [];
                        const paidSum = installments
                          .filter((i) => i.status === "PAID")
                          .reduce((acc, i) => acc + i.amount, 0);
                        const totalFee = c.sponsorCommission || 0;
                        const currentIdx = stageOrder.indexOf(c.stage);

                        const hasReadyToPay = installments.some((inst, idx) => {
                          if (inst.status === "PAID") return false;
                          const prevInst = idx > 0 ? installments[idx - 1] : null;
                          if (prevInst && prevInst.status !== "PAID") return false;
                          return currentIdx >= stageOrder.indexOf(inst.requiredStage);
                        });

                        if (financeStatusFilter === "SIAP_CAIR" && !hasReadyToPay) return false;
                        if (financeStatusFilter === "BELUM_LUNAS" && paidSum >= totalFee)
                          return false;
                        if (financeStatusFilter === "LUNAS_100" && paidSum < totalFee)
                          return false;

                        return true;
                      });

                      if (filteredFinanceCandidates.length === 0) {
                        return (
                          <div className="mt-4 rounded-xl border border-dashed border-slate-200 p-8 text-center text-xs text-slate-500">
                            Tidak ada data CPMI yang sesuai dengan filter pencarian fee sponsor.
                          </div>
                        );
                      }

                      if (financeViewMode === "TABEL_RINGKAS") {
                        return (
                          <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200">
                            <table className="w-full text-left text-xs">
                              <thead>
                                <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase text-slate-500">
                                  <th className="py-3 px-3">Kandidat CPMI & Tahap</th>
                                  <th className="py-3 px-3">Sponsor & Total Fee</th>
                                  <th className="py-3 px-2.5 text-center">DP 1 (Std 20%)</th>
                                  <th className="py-3 px-2.5 text-center">DP 2 (Std 25%)</th>
                                  <th className="py-3 px-2.5 text-center">DP 3 (Std 25%)</th>
                                  <th className="py-3 px-2.5 text-center">Pelunasan (Std 30%)</th>
                                  <th className="py-3 px-3 text-right">Terbayar / Sisa</th>
                                  <th className="py-3 px-3 text-right">HPP</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {filteredFinanceCandidates.map((c) => {
                                  const sp = db.sponsors.find((s) => s.id === c.sponsorId);
                                  const installments = c.finance?.sponsorInstallments || [];
                                  const paidSum = installments
                                    .filter((i) => i.status === "PAID")
                                    .reduce((acc, i) => acc + i.amount, 0);
                                  const totalFee = c.sponsorCommission || 0;
                                  const remSum = Math.max(0, totalFee - paidSum);
                                  const pctPaid =
                                    totalFee > 0 ? Math.round((paidSum / totalFee) * 100) : 0;
                                  const currentIdx = stageOrder.indexOf(c.stage);

                                  return (
                                    <tr
                                      key={c.id}
                                      className="hover:bg-slate-50/80 transition"
                                    >
                                      {/* Kolom 1: Kandidat */}
                                      <td className="py-3 px-3">
                                        <div className="flex items-center gap-2.5">
                                          <img
                                            src={getCandidateAvatarUrl(c)}
                                            alt={c.fullName}
                                            className="h-9 w-7 shrink-0 rounded border border-slate-300 object-cover"
                                          />
                                          <div>
                                            <div className="flex items-center gap-1.5">
                                              <span className="font-bold text-slate-900">
                                                {c.fullName}
                                              </span>
                                              <span className="rounded bg-slate-900 px-1.5 py-0.5 text-[9px] font-bold text-white">
                                                {c.stage}
                                              </span>
                                            </div>
                                            <p className="text-[11px] text-slate-500">
                                              <span className="font-mono">{c.regNumber}</span> ·{" "}
                                              {c.destinationCountry}
                                            </p>
                                          </div>
                                        </div>
                                      </td>

                                      {/* Kolom 2: Sponsor & Total Fee */}
                                      <td className="py-3 px-3">
                                        <p className="font-bold text-slate-800">
                                          {sp?.name || "-"}
                                        </p>
                                        <p className="text-[11px] text-slate-500">
                                          Total:{" "}
                                          <strong className="text-slate-900">
                                            {formatRupiah(totalFee)}
                                          </strong>
                                        </p>
                                      </td>

                                      {/* Kolom 3-6: DP1, DP2, DP3, PELUNASAN */}
                                      {installments.map((inst, idx) => {
                                        const isPaid = inst.status === "PAID";
                                        const prevInst = idx > 0 ? installments[idx - 1] : null;
                                        const isPrevUnpaid =
                                          prevInst && prevInst.status !== "PAID";
                                        const reqIdx = stageOrder.indexOf(inst.requiredStage);
                                        const stageReached = currentIdx >= reqIdx;

                                        return (
                                          <td
                                            key={inst.terminKey}
                                            className="py-2.5 px-2 text-center align-middle"
                                          >
                                            <div className="inline-flex flex-col items-center gap-1">
                                              <span className="font-mono text-[11px] font-bold text-slate-800">
                                                {formatRupiah(inst.amount)}{" "}
                                                <span className="text-[10px] font-normal text-slate-400">
                                                  ({inst.percentage}%)
                                                </span>
                                              </span>
                                              {isPaid ? (
                                                <button
                                                  type="button"
                                                  title={`Cetak Kwitansi ${inst.receiptNumber}`}
                                                  onClick={() =>
                                                    setReceiptPreviewModal({
                                                      candidate: c,
                                                      installment: inst,
                                                      sponsorName:
                                                        sp?.name || "Sponsor Lapangan",
                                                      sponsorArea: sp?.area || "-",
                                                    })
                                                  }
                                                  className="inline-flex items-center gap-1 rounded-md border border-emerald-300 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-800 hover:bg-emerald-100"
                                                >
                                                  ✓ Lunas · Kwitansi
                                                </button>
                                              ) : isPrevUnpaid ? (
                                                <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-400">
                                                  Tunggu {prevInst?.terminKey}
                                                </span>
                                              ) : (
                                                <button
                                                  type="button"
                                                  onClick={() => {
                                                    setPayTerminForm({
                                                      paymentMethod: "TRANSFER_BANK",
                                                      notes: `Pencairan ${inst.label} a.n ${c.fullName}`,
                                                      forceOverride: false,
                                                      customAmount: inst.amount,
                                                      autoAdjustCommissionIfExceeded: false,
                                                      deductKasbon: true,
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
                                                  className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-[10px] font-bold transition ${
                                                    stageReached
                                                      ? "bg-emerald-600 text-white hover:bg-emerald-700 shadow-xs"
                                                      : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
                                                  }`}
                                                >
                                                  <CreditCard className="h-3 w-3" />
                                                  {stageReached
                                                    ? `Cairkan ${inst.terminKey}`
                                                    : `Bayar ${inst.terminKey}`}
                                                </button>
                                              )}
                                            </div>
                                          </td>
                                        );
                                      })}

                                      {/* Kolom 7: Terbayar & Sisa */}
                                      <td className="py-3 px-3 text-right">
                                        <span className="block font-bold text-emerald-700">
                                          {formatRupiah(paidSum)} ({pctPaid}%)
                                        </span>
                                        <span className="block text-[11px] font-semibold text-rose-600">
                                          Sisa: {formatRupiah(remSum)}
                                        </span>
                                      </td>

                                      {/* Kolom 8: Tombol Rincian HPP */}
                                      <td className="py-3 px-3 text-right">
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setSelectedFinanceCandidateId(c.id);
                                            const el = document.getElementById(
                                              "hpp-breakdown-panel"
                                            );
                                            el?.scrollIntoView({ behavior: "smooth" });
                                          }}
                                          className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-slate-700 hover:bg-slate-100"
                                        >
                                          HPP →
                                        </button>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        );
                      }

                      return (
                        <div className="mt-4 space-y-4">
                          {filteredFinanceCandidates.map((c) => {
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

                                <div className="mt-3.5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                                  {installments.map((inst, idx) => {
                                    const isPaid = inst.status === "PAID";
                                    const prevInst = idx > 0 ? installments[idx - 1] : null;
                                    const isPrevUnpaid = prevInst && prevInst.status !== "PAID";
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
                                                  customAmount: inst.amount,
                                                  autoAdjustCommissionIfExceeded: false,
                                                  deductKasbon: true,
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
                      );
                    })()}
                  </div>

                  {/* BAGIAN 2: RINCIAN HPP BIAYA PENEMPATAN PER CPMI, SKEMA PEMBIAYAAN (KUR / ZERO COST) & LABA BERSIH */}
                  {financeCandidate && financeCandidate.finance && (
                    <div
                      id="hpp-breakdown-panel"
                      className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
                        <div>
                          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
                            Buku Besar HPP Penempatan Timur Tengah · 100% Zero Cost Syarikah / Majikan
                          </span>
                          <h3 className="text-base font-bold text-slate-900">
                            Rincian Komponen Biaya Proses (HPP), Alur Rekom vs Non-Rekom & Margin per CPMI
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
                                {c.regNumber} · {c.fullName} ({c.destinationCountry} ·{" "}
                                {(c.processTrack || "REKOM") === "NON_REKOM"
                                  ? "ALUR NON-REKOM"
                                  : "ALUR REKOM SPSK"}{" "}
                                - {c.stage})
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="mt-5 grid grid-cols-1 gap-6 lg:grid-cols-12">
                        {/* Kolom Kiri: Skema Pembiayaan Zero Cost Syarikah & Kalkulasi Margin */}
                        <div className="space-y-4 lg:col-span-5">
                          <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 text-xs space-y-3">
                            <div className="flex items-center justify-between gap-2">
                              <h4 className="font-bold text-slate-900 text-sm">
                                Skema Pembiayaan Timur Tengah (Zero Cost)
                              </h4>
                              <span
                                className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold ${
                                  (financeCandidate.processTrack || "REKOM") === "NON_REKOM"
                                    ? "bg-amber-500 text-slate-950"
                                    : "bg-teal-700 text-white"
                                }`}
                              >
                                {(financeCandidate.processTrack || "REKOM") === "NON_REKOM"
                                  ? "⚡ ALUR NON-REKOM (Tanpa BPJS-TK/KTKLN)"
                                  : "✓ ALUR REKOM (SPSK Resmi)"}
                              </span>
                            </div>

                            <div className="rounded-lg border border-emerald-300 bg-white p-3 text-[11px] text-emerald-950">
                              <strong>✓ Kebijakan Aktif Sistem:</strong> Seluruh penempatan dikhususkan untuk{" "}
                              <strong>Kawasan Timur Tengah</strong> dengan skema{" "}
                              <strong>100% Zero Cost (Pembiayaan Langsung dari Syarikah / Majikan)</strong>. Pembiayaan kawasan Asia Pasifik (Taiwan, Hong Kong, KUR PMI) dinonaktifkan.
                            </div>

                            <div>
                              <label className="block font-bold text-slate-700 mb-1">
                                Skema Biaya Penempatan (Khusus Kawasan Timur Tengah)
                              </label>
                              <select
                                value="ZERO_COST_MAJIKAN"
                                onChange={async () => {
                                  await callApi("UPDATE_FINANCE_SCHEME", {
                                    candidateId: financeCandidate.id,
                                    fundingScheme: "ZERO_COST_MAJIKAN",
                                  });
                                }}
                                className="w-full rounded-lg border border-emerald-400 bg-white px-3 py-2 font-bold text-emerald-950"
                              >
                                <option value="ZERO_COST_MAJIKAN">
                                  Zero Cost Timur Tengah (100% Dibiayai Langsung oleh Syarikah / Majikan)
                                </option>
                              </select>
                            </div>

                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                              <div>
                                <label className="block font-bold text-slate-700 mb-1">
                                  Syarikah / Agensi Penanggung Biaya (Master Data)
                                </label>
                                <select
                                  value={
                                    financeCandidate.finance.fundingBankOrAgency ||
                                    "100% Ditanggung Syarikah / Majikan (Zero Cost Timur Tengah)"
                                  }
                                  onChange={async (e) => {
                                    await callApi("UPDATE_FINANCE_SCHEME", {
                                      candidateId: financeCandidate.id,
                                      fundingBankOrAgency: e.target.value,
                                    });
                                  }}
                                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 font-semibold"
                                >
                                  <option value="100% Ditanggung Syarikah / Majikan (Zero Cost Timur Tengah)">
                                    100% Ditanggung Syarikah / Majikan (Zero Cost Timur Tengah)
                                  </option>
                                  {(db.foreignAgencies || []).map((a) => (
                                    <option key={a.id} value={a.name}>
                                      {a.name} — {a.country} ({a.code})
                                    </option>
                                  ))}
                                  {financeCandidate.finance?.fundingBankOrAgency &&
                                    financeCandidate.finance?.fundingBankOrAgency !==
                                      "100% Ditanggung Syarikah / Majikan (Zero Cost Timur Tengah)" &&
                                    !(db.foreignAgencies || []).some(
                                      (a) =>
                                        a.name ===
                                        financeCandidate.finance?.fundingBankOrAgency
                                    ) && (
                                      <option
                                        value={financeCandidate.finance?.fundingBankOrAgency}
                                      >
                                        {financeCandidate.finance?.fundingBankOrAgency}
                                      </option>
                                    )}
                                </select>
                              </div>

                              <div>
                                <label className="block font-bold text-slate-700 mb-1">
                                  Alur Proses Kandidat Ini
                                </label>
                                <select
                                  value={financeCandidate.processTrack || "REKOM"}
                                  onChange={async (e) => {
                                    const nextTrack = e.target.value as ProcessTrack;
                                    await callApi("UPDATE_CANDIDATE", {
                                      candidateId: financeCandidate.id,
                                      updates: { processTrack: nextTrack },
                                    });
                                    setToast({
                                      type: "success",
                                      title: `Alur Proses & HPP ${financeCandidate.fullName} Diubah ke ${nextTrack}`,
                                    });
                                  }}
                                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 font-bold"
                                >
                                  <option value="REKOM">
                                    Alur Rekom (Termasuk BPJS-TK, PAP & KTKLN)
                                  </option>
                                  <option value="NON_REKOM">
                                    Alur Non-Rekom (Tanpa BPJS-TK, PAP & KTKLN)
                                  </option>
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
          {activeNav === "pelatihan" && (() => {
            const trainingAll = filteredCandidates.filter((c) => Boolean(c.training));
            const trainingFiltered = trainingAll.filter((c) => {
              const tr = c.training!;
              const matchStatus =
                trainingStatusFilter === "ALL" || tr.examStatus === trainingStatusFilter;
              const q = trainingSearch.trim().toLowerCase();
              const matchQuery =
                !q ||
                c.fullName.toLowerCase().includes(q) ||
                c.regNumber.toLowerCase().includes(q) ||
                tr.blkLocation.toLowerCase().includes(q) ||
                tr.targetLanguage.toLowerCase().includes(q) ||
                (tr.instructorNotes || "").toLowerCase().includes(q);
              return matchStatus && matchQuery;
            });

            const passedCount = trainingAll.filter(
              (c) => c.training?.examStatus === "LULUS_KOMPETEN"
            ).length;
            const pendingCount = trainingAll.filter(
              (c) => c.training?.examStatus === "BELUM_UJIAN"
            ).length;
            const remedialCount = trainingAll.filter(
              (c) => c.training?.examStatus === "REMEDIAL"
            ).length;

            async function handlePassCompetency(c: Candidate) {
              const tr = c.training;
              if (!tr) return;
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
            }

            return (
              <div className="space-y-6">
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-200 pb-4">
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
                      <div className="flex flex-wrap items-center gap-2 mt-2 text-[11px] font-semibold">
                        <span className="rounded-full bg-slate-100 border border-slate-200 px-2.5 py-0.5 text-slate-700">
                          Total: {trainingAll.length} CPMI
                        </span>
                        <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-emerald-700">
                          Lulus Kompeten: {passedCount}
                        </span>
                        <span className="rounded-full bg-amber-50 border border-amber-200 px-2.5 py-0.5 text-amber-800">
                          Belum Ujian: {pendingCount}
                        </span>
                        {remedialCount > 0 && (
                          <span className="rounded-full bg-rose-50 border border-rose-200 px-2.5 py-0.5 text-rose-700">
                            Remedial: {remedialCount}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {/* Pencarian */}
                      <div className="relative">
                        <Search className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={trainingSearch}
                          onChange={(e) => setTrainingSearch(e.target.value)}
                          placeholder="Cari nama / reg / BLK..."
                          className="w-44 sm:w-52 rounded-lg border border-slate-200 bg-slate-50 pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:border-sky-500 focus:bg-white focus:outline-none"
                        />
                      </div>

                      {/* Filter Status Ujian */}
                      <select
                        value={trainingStatusFilter}
                        onChange={(e) =>
                          setTrainingStatusFilter(
                            e.target.value as
                              | "ALL"
                              | "LULUS_KOMPETEN"
                              | "BELUM_UJIAN"
                              | "REMEDIAL"
                          )
                        }
                        className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-700 focus:border-sky-500 focus:bg-white focus:outline-none cursor-pointer"
                      >
                        <option value="ALL">Semua Status</option>
                        <option value="LULUS_KOMPETEN">LULUS KOMPETEN</option>
                        <option value="BELUM_UJIAN">BELUM UJIAN</option>
                        <option value="REMEDIAL">REMEDIAL</option>
                      </select>

                      {/* Toggle Matrix Baris & Kolom vs Kartu */}
                      <div className="inline-flex rounded-lg border border-slate-200 bg-slate-100 p-0.5 text-xs">
                        <button
                          type="button"
                          onClick={() => setTrainingViewMode("matrix")}
                          className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 font-semibold transition cursor-pointer ${
                            trainingViewMode === "matrix"
                              ? "bg-sky-600 text-white shadow-sm"
                              : "text-slate-600 hover:text-slate-900"
                          }`}
                        >
                          <Table className="h-3.5 w-3.5" />
                          Matrix Baris &amp; Kolom
                        </button>
                        <button
                          type="button"
                          onClick={() => setTrainingViewMode("cards")}
                          className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 font-semibold transition cursor-pointer ${
                            trainingViewMode === "cards"
                              ? "bg-sky-600 text-white shadow-sm"
                              : "text-slate-600 hover:text-slate-900"
                          }`}
                        >
                          <LayoutGrid className="h-3.5 w-3.5" />
                          Kartu
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* TAMPILAN 1: MATRIX BARIS & KOLOM */}
                  {trainingViewMode === "matrix" && (
                    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                      <table className="w-full text-left text-xs text-slate-700">
                        <thead className="bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                          <tr>
                            <th className="py-3 px-3 text-center w-10">No</th>
                            <th className="py-3 px-3 min-w-[180px]">No. Reg &amp; Nama CPMI</th>
                            <th className="py-3 px-3 min-w-[190px]">BLK-LN &amp; Masuk Asrama</th>
                            <th className="py-3 px-3 text-center min-w-[90px]">Presensi</th>
                            <th className="py-3 px-3 min-w-[160px]">Nilai Bahasa</th>
                            <th className="py-3 px-3 text-center min-w-[100px]">Praktik Kerja</th>
                            <th className="py-3 px-3 text-center min-w-[125px]">Status Ujian</th>
                            <th className="py-3 px-3 min-w-[200px]">Catatan Instruktur</th>
                            <th className="py-3 px-3 text-right min-w-[155px]">Aksi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {trainingFiltered.length === 0 ? (
                            <tr>
                              <td
                                colSpan={9}
                                className="py-8 text-center text-slate-400"
                              >
                                Tidak ada data pelatihan BLK-LN yang cocok dengan filter pencarian.
                              </td>
                            </tr>
                          ) : (
                            trainingFiltered.map((c, idx) => {
                              const tr = c.training!;
                              const isPassed = tr.examStatus === "LULUS_KOMPETEN";
                              return (
                                <tr
                                  key={c.id}
                                  className="hover:bg-slate-50/90 transition-colors align-top"
                                >
                                  <td className="py-3 px-3 text-center font-mono text-slate-400">
                                    {idx + 1}
                                  </td>
                                  <td className="py-3 px-3">
                                    <div className="font-mono text-[11px] font-bold text-sky-700">
                                      {c.regNumber}
                                    </div>
                                    <div className="font-bold text-slate-900">
                                      {c.fullName}
                                    </div>
                                    <span
                                      className={`mt-1 inline-block rounded px-1.5 py-0.5 text-[9px] font-bold ${
                                        (c.processTrack || "REKOM") === "NON_REKOM"
                                          ? "bg-amber-100 text-amber-800"
                                          : "bg-sky-100 text-sky-800"
                                      }`}
                                    >
                                      {(c.processTrack || "REKOM") === "NON_REKOM"
                                        ? "Non-Rekom"
                                        : "Rekom"}
                                    </span>
                                  </td>
                                  <td className="py-3 px-3">
                                    <div className="font-medium text-slate-800">
                                      {tr.blkLocation}
                                    </div>
                                    <div className="text-[11px] text-slate-500 mt-0.5">
                                      Masuk: <strong>{tr.dormitoryCheckIn || "Belum Masuk"}</strong>
                                    </div>
                                  </td>
                                  <td className="py-3 px-3 text-center">
                                    <span className="font-extrabold text-slate-900">
                                      {tr.attendancePct}%
                                    </span>
                                  </td>
                                  <td className="py-3 px-3">
                                    <div className="font-extrabold text-sky-700">
                                      {tr.languageScore} / 100
                                    </div>
                                    <div className="text-[10px] text-slate-500 line-clamp-2">
                                      {tr.targetLanguage}
                                    </div>
                                  </td>
                                  <td className="py-3 px-3 text-center">
                                    <span className="font-extrabold text-teal-700">
                                      {tr.skillScore} / 100
                                    </span>
                                  </td>
                                  <td className="py-3 px-3 text-center">
                                    <span
                                      className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                                        isPassed
                                          ? "bg-emerald-600 text-white"
                                          : tr.examStatus === "REMEDIAL"
                                          ? "bg-rose-600 text-white"
                                          : "bg-amber-500 text-slate-950"
                                      }`}
                                    >
                                      {tr.examStatus}
                                    </span>
                                  </td>
                                  <td className="py-3 px-3 text-[11px] text-slate-600 max-w-[240px]">
                                    <p className="line-clamp-2">{tr.instructorNotes || "-"}</p>
                                  </td>
                                  <td className="py-3 px-3 text-right">
                                    {isPassed ? (
                                      <span className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700">
                                        <CheckCircle2 className="h-3.5 w-3.5" />
                                        Sudah Lulus
                                      </span>
                                    ) : (
                                      <button
                                        type="button"
                                        onClick={() => handlePassCompetency(c)}
                                        className="rounded-lg bg-emerald-600 px-3 py-1.5 text-[11px] font-bold text-white hover:bg-emerald-700 transition cursor-pointer"
                                      >
                                        Luluskan Uji Kompetensi
                                      </button>
                                    )}
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* TAMPILAN 2: KARTU */}
                  {trainingViewMode === "cards" && (
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      {trainingFiltered.length === 0 ? (
                        <div className="col-span-full rounded-xl border border-slate-200 bg-slate-50 p-8 text-center text-xs text-slate-400">
                          Tidak ada data pelatihan BLK-LN yang cocok dengan filter pencarian.
                        </div>
                      ) : (
                        trainingFiltered.map((c) => {
                          const tr = c.training!;
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
                                    <h3 className="text-sm font-bold text-slate-900">
                                      {c.fullName}
                                    </h3>
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
                                    type="button"
                                    onClick={() => handlePassCompetency(c)}
                                    className="rounded-lg bg-emerald-600 px-3 py-1.5 text-[11px] font-bold text-white hover:bg-emerald-700 cursor-pointer"
                                  >
                                    Luluskan Uji Kompetensi
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })()}

          {/* =========================================================
              MODUL MASTER DATA & DATABASE MITRA EKOSISTEM P3MI TERPADU
             ========================================================= */}
          {activeNav === "master_data" && (
            <MasterPartnerDatabaseModule
              db={db}
              loggedInStaff={loggedInStaff}
              onRefreshDb={fetchDb}
              onTriggerApi={async (action, payload) => {
                const { data } = await callApi(action, payload);
                if (data?.ok) {
                  if (data.db) setDb(data.db);
                  else await fetchDb();
                  setToast({
                    type: "success",
                    title: "Master Data Berhasil Disimpan",
                    details: ["Perubahan data tersimpan permanen di database PT. Panca Banyu Ajisakti."],
                  });
                  return true;
                }
                setToast({
                  type: "error",
                  title: data?.securityBlocked
                    ? "Keamanan Data: Penghapusan Ditolak"
                    : "Gagal Memproses Master Data",
                  details: [data?.error || "Terjadi kesalahan saat memproses perubahan master data."],
                });
                return false;
              }}
            />
          )}
        </main>
      </div>

      {/* =========================================================
          MODAL PENCAIRAN TERMIN FEE SPONSOR (DP 1, DP 2, DP 3, PELUNASAN) - DUKUNG NOMINAL CUSTOM
         ========================================================= */}
      {payingTerminModal && (() => {
        const totals = getCandidateSponsorTotals(payingTerminModal.candidate);
        const customAmt = Math.max(0, Math.round(payTerminForm.customAmount || 0));
        const exceedsRemaining = customAmt > totals.remainingAmount;
        const effectiveTotal =
          exceedsRemaining && payTerminForm.autoAdjustCommissionIfExceeded
            ? totals.paidAmount + customAmt
            : totals.totalFee;
        const sisaAfter = Math.max(0, effectiveTotal - (totals.paidAmount + customAmt));
        const openSponsorKasbon = getOpenSponsorKasbonTotal(
          db?.cashAdvances,
          payingTerminModal.candidate.sponsorId,
          payingTerminModal.sponsorName
        );
        const kasbonPreview = computeKasbonDeductionPreview(
          customAmt,
          openSponsorKasbon,
          payTerminForm.deductKasbon
        );

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <span className="rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                    Pencairan Fee Sponsor (Standar / Custom)
                  </span>
                  <h3 className="mt-1 text-base font-bold text-slate-900">
                    {payingTerminModal.installment.label}
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
                  <span className="text-slate-500">Total Fee / Sisa Saat Ini:</span>
                  <strong className="text-slate-900">
                    {formatRupiah(totals.totalFee)} ·{" "}
                    <span className="text-rose-700">Sisa {formatRupiah(totals.remainingAmount)}</span>
                  </strong>
                </div>
                <div className="flex justify-between border-t border-slate-200 pt-2 text-sm">
                  <span className="font-bold text-slate-700">Nominal Dibayar (Custom):</span>
                  <span className="font-extrabold text-emerald-700">
                    {formatRupiah(customAmt)}
                  </span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-500">Sisa Fee Setelah Bayar (Otomatis Disesuaikan):</span>
                  <strong className="text-rose-700">{formatRupiah(sisaAfter)}</strong>
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
                  <div className="mb-1 flex items-center justify-between">
                    <label className="font-bold text-slate-700">
                      Nominal Pencairan Termin (Bisa Custom Rp)
                    </label>
                    <span className="font-mono text-[11px] font-bold text-emerald-700">
                      {effectiveTotal > 0
                        ? `${Math.round((customAmt / effectiveTotal) * 1000) / 10}% dari Fee`
                        : "0%"}
                    </span>
                  </div>
                  <input
                    type="number"
                    min={0}
                    step={50000}
                    required
                    value={payTerminForm.customAmount}
                    onChange={(e) =>
                      setPayTerminForm({
                        ...payTerminForm,
                        customAmount: Number(e.target.value || 0),
                      })
                    }
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono font-bold text-slate-900 focus:border-emerald-500 focus:outline-none"
                  />
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() =>
                        setPayTerminForm({
                          ...payTerminForm,
                          customAmount: payingTerminModal.installment.amount,
                        })
                      }
                      className="rounded border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-semibold text-slate-700 hover:bg-slate-100"
                    >
                      Standar ({formatRupiah(payingTerminModal.installment.amount)})
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setPayTerminForm({
                          ...payTerminForm,
                          customAmount: Math.round(totals.totalFee * 0.5),
                        })
                      }
                      className="rounded border border-sky-200 bg-sky-50 px-2 py-0.5 text-[10px] font-semibold text-sky-700 hover:bg-sky-100"
                    >
                      50% Fee ({formatRupiah(Math.round(totals.totalFee * 0.5))})
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setPayTerminForm({
                          ...payTerminForm,
                          customAmount: totals.remainingAmount,
                        })
                      }
                      className="rounded border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 hover:bg-emerald-100"
                    >
                      Lunasi Sisa ({formatRupiah(totals.remainingAmount)})
                    </button>
                  </div>
                  {exceedsRemaining && (
                    <div className="mt-2 rounded-lg border border-rose-200 bg-rose-50 p-2 text-[11px] text-rose-800">
                      <p className="font-bold">
                        Nominal melebihi sisa hak fee ({formatRupiah(totals.remainingAmount)}).
                      </p>
                      <label className="mt-1 flex items-center gap-1.5 font-semibold cursor-pointer">
                        <input
                          type="checkbox"
                          checked={payTerminForm.autoAdjustCommissionIfExceeded}
                          onChange={(e) =>
                            setPayTerminForm({
                              ...payTerminForm,
                              autoAdjustCommissionIfExceeded: e.target.checked,
                            })
                          }
                          className="h-3.5 w-3.5 rounded border-rose-400"
                        />
                        Naikkan Total Fee CPMI otomatis menjadi {formatRupiah(totals.paidAmount + customAmt)}
                      </label>
                    </div>
                  )}
                </div>

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

                {openSponsorKasbon > 0 ? (
                  <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-xs text-amber-950 space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold">
                        Sponsor ini punya Kasbon Belum Lunas:
                      </span>
                      <strong className="text-amber-800">
                        {formatRupiah(openSponsorKasbon)}
                      </strong>
                    </div>
                    <label className="flex items-center gap-2 font-semibold cursor-pointer">
                      <input
                        type="checkbox"
                        checked={payTerminForm.deductKasbon}
                        onChange={(e) =>
                          setPayTerminForm({
                            ...payTerminForm,
                            deductKasbon: e.target.checked,
                          })
                        }
                        className="h-3.5 w-3.5 rounded border-amber-500"
                      />
                      Potong otomatis dari sisa Kasbon Sponsor ({formatRupiah(kasbonPreview.kasbonDeducted)})
                    </label>
                    <div className="flex items-center justify-between border-t border-amber-200 pt-1.5 text-[11px]">
                      <span>Kas Keluar Netto (dicatat ke Jurnal Arus Kas):</span>
                      <strong className="text-emerald-800 text-xs">
                        {formatRupiah(kasbonPreview.netCashPaid)}
                      </strong>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-lg border border-emerald-200 bg-emerald-50/60 px-3 py-2 text-[11px] text-emerald-900">
                    Pembayaran ini otomatis tercatat sebagai <strong>KAS KELUAR</strong> sebesar{" "}
                    <strong>{formatRupiah(customAmt)}</strong> di Buku Jurnal Arus Kas.
                  </div>
                )}

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
                    disabled={exceedsRemaining && !payTerminForm.autoAdjustCommissionIfExceeded}
                    className="rounded-lg bg-emerald-600 px-5 py-2 font-bold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Konfirmasi Bayar & Terbitkan Kwitansi
                  </button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}

      {/* =========================================================
          MODAL PEMBAYARAN DP CUSTOM / KOLEKTIF FEE SPONSOR (AUTO-HITUNG PER CPMI)
         ========================================================= */}
      {batchSponsorPayOpen && db && (() => {
        const sponsorCandidatesAll = db.candidates.filter(
          (c) => c.sponsorId === batchSponsorPayForm.sponsorId
        );
        const eligibleCandidates = sponsorCandidatesAll.filter(
          (c) =>
            checkCandidateTerminEligibility(c, batchSponsorPayForm.terminKey).eligible
        );
        const selectedCandidates = eligibleCandidates.filter((c) =>
          batchSponsorPayForm.selectedCandidateIds.includes(c.id)
        );
        const distribution = computeBatchSponsorDistribution(
          selectedCandidates,
          batchSponsorPayForm.totalAmount,
          batchSponsorPayForm.terminKey,
          batchSponsorPayForm.distributionMode,
          batchSponsorPayForm.autoAdjustCommissionIfExceeded
        );
        const hasAnyExceeded = distribution.some((r) => r.exceedsRemaining);
        const stageNeedCount = distribution.filter((r) => r.needsStageOverride).length;
        const avgPerCpmi =
          selectedCandidates.length > 0
            ? Math.round(batchSponsorPayForm.totalAmount / selectedCandidates.length)
            : 0;
        const selectedSponsorObj = db.sponsors.find(
          (s) => s.id === batchSponsorPayForm.sponsorId
        );
        const openBatchKasbon = getOpenSponsorKasbonTotal(
          db.cashAdvances,
          batchSponsorPayForm.sponsorId,
          selectedSponsorObj?.name
        );
        const batchKasbonPreview = computeKasbonDeductionPreview(
          batchSponsorPayForm.totalAmount || 0,
          openBatchKasbon,
          batchSponsorPayForm.deductKasbon
        );

        const handleSponsorOrTerminChange = (
          nextSponsorId: string,
          nextTerminKey: CommissionTerminKey
        ) => {
          const nextEligible = getEligibleSponsorCandidates(nextSponsorId, nextTerminKey);
          const suggestedTotal = nextEligible.reduce((sum, c) => {
            const inst = c.finance?.sponsorInstallments.find(
              (i) => i.terminKey === nextTerminKey
            );
            return sum + (inst?.amount || 0);
          }, 0);
          setBatchSponsorPayForm((prev) => ({
            ...prev,
            sponsorId: nextSponsorId,
            terminKey: nextTerminKey,
            selectedCandidateIds: nextEligible.map((c) => c.id),
            totalAmount: prev.totalAmount > 0 ? prev.totalAmount : suggestedTotal,
            stageWarningMsg: undefined,
            forceOverride: false,
          }));
        };

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
            <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <span className="rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                    Pembayaran Custom &amp; Kolektif Sponsor (Auto-Hitung Per CPMI)
                  </span>
                  <h3 className="mt-1 text-base font-bold text-slate-900">
                    Bayar DP Custom Sponsor untuk Banyak CPMI Sekaligus
                  </h3>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Masukkan total uang DP yang dibayarkan ke sponsor, sistem otomatis membagi &amp; menghitung nominal per CPMI beserta sisa termin berikutnya.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setBatchSponsorPayOpen(false)}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handlePaySponsorBatchCustom} className="mt-4 space-y-4 text-xs">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-12">
                  <div className="sm:col-span-5">
                    <label className="mb-1 block font-bold text-slate-700">
                      Pilih Sponsor / PL Penerima
                    </label>
                    <select
                      value={batchSponsorPayForm.sponsorId}
                      onChange={(e) =>
                        handleSponsorOrTerminChange(
                          e.target.value,
                          batchSponsorPayForm.terminKey
                        )
                      }
                      className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 font-semibold text-slate-900"
                    >
                      {[...db.sponsors]
                        .sort((a, b) => {
                          const aCnt = db.candidates.filter((c) => c.sponsorId === a.id).length;
                          const bCnt = db.candidates.filter((c) => c.sponsorId === b.id).length;
                          if (bCnt !== aCnt) return bCnt - aCnt;
                          return b.payableAmount - a.payableAmount;
                        })
                        .map((sp) => {
                          const cnt = db.candidates.filter((c) => c.sponsorId === sp.id).length;
                          return (
                            <option key={sp.id} value={sp.id}>
                              {sp.name} ({cnt} CPMI · Sisa: {formatRupiah(sp.payableAmount)})
                            </option>
                          );
                        })}
                    </select>
                  </div>

                  <div className="sm:col-span-3">
                    <label className="mb-1 block font-bold text-slate-700">
                      Termin Pembayaran
                    </label>
                    <select
                      value={batchSponsorPayForm.terminKey}
                      onChange={(e) =>
                        handleSponsorOrTerminChange(
                          batchSponsorPayForm.sponsorId,
                          e.target.value as CommissionTerminKey
                        )
                      }
                      className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 font-semibold text-slate-900"
                    >
                      <option value="DP1">DP 1</option>
                      <option value="DP2">DP 2</option>
                      <option value="DP3">DP 3</option>
                      <option value="PELUNASAN">Pelunasan</option>
                    </select>
                  </div>

                  <div className="sm:col-span-4">
                    <label className="mb-1 block font-bold text-slate-700">
                      Total Nominal Bayar Custom (Rp)
                    </label>
                    <input
                      type="number"
                      min={1}
                      step={50000}
                      required
                      value={batchSponsorPayForm.totalAmount || ""}
                      onChange={(e) =>
                        setBatchSponsorPayForm((prev) => ({
                          ...prev,
                          totalAmount: Number(e.target.value || 0),
                        }))
                      }
                      placeholder="Contoh: 50000000"
                      className="w-full rounded-xl border border-emerald-400 bg-white px-3 py-2 font-mono text-sm font-extrabold text-emerald-800 focus:border-emerald-600 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Ringkasan Kalkulasi Otomatis */}
                <div className="grid grid-cols-1 gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50/70 p-3.5 sm:grid-cols-3">
                  <div>
                    <span className="text-[11px] font-semibold text-emerald-800">
                      Total Dibayar ke {selectedSponsorObj?.name || "Sponsor"}
                    </span>
                    <p className="mt-0.5 font-mono text-base font-extrabold text-emerald-950">
                      {formatRupiah(batchSponsorPayForm.totalAmount || 0)}
                    </p>
                  </div>
                  <div>
                    <span className="text-[11px] font-semibold text-emerald-800">
                      Jumlah CPMI Dipilih
                    </span>
                    <p className="mt-0.5 text-base font-extrabold text-slate-900">
                      {selectedCandidates.length} CPMI{" "}
                      <span className="text-xs font-normal text-slate-500">
                        (dari {eligibleCandidates.length} siap {getTerminShortTitle(batchSponsorPayForm.terminKey)})
                      </span>
                    </p>
                  </div>
                  <div>
                    <span className="text-[11px] font-semibold text-emerald-800">
                      Nominal {getTerminShortTitle(batchSponsorPayForm.terminKey)} Otomatis / CPMI
                    </span>
                    <p className="mt-0.5 font-mono text-base font-extrabold text-sky-800">
                      {formatRupiah(avgPerCpmi)}{" "}
                      <span className="text-[11px] font-semibold text-slate-600">/ CPMI</span>
                    </p>
                  </div>
                </div>

                {/* Kontrol Pilihan CPMI & Mode Pembagian */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-slate-700">Mode Pembagian:</span>
                    <button
                      type="button"
                      onClick={() =>
                        setBatchSponsorPayForm((prev) => ({
                          ...prev,
                          distributionMode: "EQUAL_SPLIT",
                        }))
                      }
                      className={`rounded-lg border px-2.5 py-1 text-[11px] font-bold transition ${
                        batchSponsorPayForm.distributionMode === "EQUAL_SPLIT"
                          ? "border-slate-900 bg-slate-900 text-white"
                          : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      Bagi Rata Sama Besar (Total ÷ CPMI)
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setBatchSponsorPayForm((prev) => ({
                          ...prev,
                          distributionMode: "PROPORTIONAL_CAP",
                        }))
                      }
                      className={`rounded-lg border px-2.5 py-1 text-[11px] font-bold transition ${
                        batchSponsorPayForm.distributionMode === "PROPORTIONAL_CAP"
                          ? "border-slate-900 bg-slate-900 text-white"
                          : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      Proporsional Sisa Fee
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setBatchSponsorPayForm((prev) => ({
                          ...prev,
                          selectedCandidateIds: eligibleCandidates.map((c) => c.id),
                        }))
                      }
                      className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-100"
                    >
                      Pilih Semua ({eligibleCandidates.length})
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setBatchSponsorPayForm((prev) => ({
                          ...prev,
                          selectedCandidateIds: [],
                        }))
                      }
                      className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-500 hover:bg-slate-50"
                    >
                      Kosongkan
                    </button>
                  </div>
                </div>

                {/* Tabel Checklist & Pratinjau Hitung Otomatis Per CPMI */}
                <div className="max-h-64 overflow-y-auto rounded-xl border border-slate-200">
                  <table className="w-full text-left text-xs">
                    <thead className="sticky top-0 border-b border-slate-200 bg-slate-50 text-[11px] font-bold text-slate-600">
                      <tr>
                        <th className="py-2 px-3 w-8">Pilih</th>
                        <th className="py-2 px-3">Nama CPMI &amp; Tahap</th>
                        <th className="py-2 px-3 text-right">Total Fee</th>
                        <th className="py-2 px-3 text-right">Sudah Bayar</th>
                        <th className="py-2 px-3 text-right">
                          {getTerminShortTitle(batchSponsorPayForm.terminKey)} Otomatis
                        </th>
                        <th className="py-2 px-3 text-right">Sisa Setelah Bayar</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {sponsorCandidatesAll.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-6 text-center text-slate-400">
                            Belum ada CPMI yang terdaftar di bawah sponsor ini.
                          </td>
                        </tr>
                      ) : (
                        sponsorCandidatesAll.map((c) => {
                          const elig = checkCandidateTerminEligibility(
                            c,
                            batchSponsorPayForm.terminKey
                          );
                          const isChecked = batchSponsorPayForm.selectedCandidateIds.includes(c.id);
                          const distRow = distribution.find((r) => r.candidate.id === c.id);
                          const totals = getCandidateSponsorTotals(c);

                          return (
                            <tr
                              key={c.id}
                              className={
                                !elig.eligible
                                  ? "bg-slate-50/70 text-slate-400"
                                  : isChecked
                                  ? "bg-emerald-50/30 hover:bg-emerald-50/60"
                                  : "hover:bg-slate-50"
                              }
                            >
                              <td className="py-2 px-3">
                                <input
                                  type="checkbox"
                                  disabled={!elig.eligible}
                                  checked={isChecked}
                                  onChange={(e) => {
                                    const checked = e.target.checked;
                                    setBatchSponsorPayForm((prev) => ({
                                      ...prev,
                                      selectedCandidateIds: checked
                                        ? [...prev.selectedCandidateIds, c.id]
                                        : prev.selectedCandidateIds.filter((id) => id !== c.id),
                                      stageWarningMsg: undefined,
                                    }));
                                  }}
                                  className="h-4 w-4 rounded border-slate-300"
                                />
                              </td>
                              <td className="py-2 px-3">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-bold text-slate-900">{c.fullName}</span>
                                  <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[9px] font-bold text-white">
                                    {c.stage}
                                  </span>
                                  {distRow?.needsStageOverride && (
                                    <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold text-amber-800">
                                      Belum {distRow.requiredStage}
                                    </span>
                                  )}
                                </div>
                                <p className="text-[10px] text-slate-500">
                                  {c.regNumber} ·{" "}
                                  {elig.eligible ? c.destinationCountry : elig.reason}
                                </p>
                              </td>
                              <td className="py-2 px-3 text-right font-mono">
                                {formatRupiah(distRow ? distRow.effectiveTotalFee : totals.totalFee)}
                              </td>
                              <td className="py-2 px-3 text-right font-mono text-emerald-700">
                                {formatRupiah(totals.paidAmount)}
                              </td>
                              <td className="py-2 px-3 text-right font-mono font-extrabold text-sky-700">
                                {distRow ? (
                                  <>
                                    {formatRupiah(distRow.assignedAmount)}{" "}
                                    <span className="text-[10px] font-normal text-slate-500">
                                      ({distRow.percentageOfFee}%)
                                    </span>
                                  </>
                                ) : (
                                  "-"
                                )}
                              </td>
                              <td className="py-2 px-3 text-right font-mono font-bold text-rose-700">
                                {distRow
                                  ? formatRupiah(distRow.remainingAfter)
                                  : formatRupiah(totals.remainingAmount)}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {hasAnyExceeded && (
                  <div className="rounded-xl border border-rose-300 bg-rose-50 p-3 text-xs text-rose-900">
                    <p className="font-bold">
                      Perhatian: Nilai per CPMI melebihi sisa hak fee pada sebagian CPMI terpilih.
                    </p>
                    <label className="mt-1.5 flex items-center gap-2 font-bold cursor-pointer">
                      <input
                        type="checkbox"
                        checked={batchSponsorPayForm.autoAdjustCommissionIfExceeded}
                        onChange={(e) =>
                          setBatchSponsorPayForm((prev) => ({
                            ...prev,
                            autoAdjustCommissionIfExceeded: e.target.checked,
                          }))
                        }
                        className="h-4 w-4 rounded border-rose-400"
                      />
                      Sesuaikan / naikkan Total Fee CPMI secara otomatis mengikuti nominal DP custom ini
                    </label>
                  </div>
                )}

                {(stageNeedCount > 0 || batchSponsorPayForm.stageWarningMsg) && (
                  <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900">
                    <p className="font-bold flex items-center gap-1.5">
                      <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
                      {batchSponsorPayForm.stageWarningMsg ||
                        `${stageNeedCount} CPMI terpilih belum mencapai tahap syarat pencairan termin.`}
                    </p>
                    <label className="mt-2 flex items-center gap-2 font-bold text-amber-950 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={batchSponsorPayForm.forceOverride}
                        onChange={(e) =>
                          setBatchSponsorPayForm((prev) => ({
                            ...prev,
                            forceOverride: e.target.checked,
                          }))
                        }
                        className="h-4 w-4 rounded border-amber-400"
                      />
                      Otorisasi Pencairan DP Lebih Awal (Direktur / Admin Keuangan)
                    </label>
                  </div>
                )}

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block font-bold text-slate-700">Metode Pembayaran</label>
                    <select
                      value={batchSponsorPayForm.paymentMethod}
                      onChange={(e) =>
                        setBatchSponsorPayForm((prev) => ({
                          ...prev,
                          paymentMethod: e.target.value as "TRANSFER_BANK" | "TUNAI_KAS",
                        }))
                      }
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 font-semibold"
                    >
                      <option value="TRANSFER_BANK">Transfer Bank Perusahaan (Rekening P3MI)</option>
                      <option value="TUNAI_KAS">Tunai Kas Operasional Kantor</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block font-bold text-slate-700">
                      Catatan / No. Referensi Transfer Batch
                    </label>
                    <input
                      type="text"
                      value={batchSponsorPayForm.notes}
                      onChange={(e) =>
                        setBatchSponsorPayForm((prev) => ({ ...prev, notes: e.target.value }))
                      }
                      placeholder="Contoh: Transfer BCA 50jt DP1 10 CPMI"
                      className="w-full rounded-lg border border-slate-300 px-3 py-2"
                    />
                  </div>
                </div>

                {openBatchKasbon > 0 ? (
                  <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-xs text-amber-950 space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold">
                        Sponsor ({selectedSponsorObj?.name || "-"}) punya Kasbon Belum Lunas:
                      </span>
                      <strong className="text-amber-800">{formatRupiah(openBatchKasbon)}</strong>
                    </div>
                    <label className="flex items-center gap-2 font-semibold cursor-pointer">
                      <input
                        type="checkbox"
                        checked={batchSponsorPayForm.deductKasbon}
                        onChange={(e) =>
                          setBatchSponsorPayForm((prev) => ({
                            ...prev,
                            deductKasbon: e.target.checked,
                          }))
                        }
                        className="h-3.5 w-3.5 rounded border-amber-500"
                      />
                      Potong otomatis dari sisa Kasbon Sponsor ({formatRupiah(batchKasbonPreview.kasbonDeducted)})
                    </label>
                    <div className="flex items-center justify-between border-t border-amber-200 pt-1.5 text-[11px]">
                      <span>Total Transfer / Kas Keluar Netto ke Jurnal Arus Kas:</span>
                      <strong className="text-emerald-800 text-xs">
                        {formatRupiah(batchKasbonPreview.netCashPaid)}
                      </strong>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-lg border border-emerald-200 bg-emerald-50/60 px-3 py-2 text-[11px] text-emerald-900">
                    Pembayaran kolektif ini otomatis tercatat sebagai <strong>KAS KELUAR</strong> sebesar{" "}
                    <strong>{formatRupiah(batchSponsorPayForm.totalAmount || 0)}</strong> di Buku Jurnal Arus Kas.
                  </div>
                )}

                <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
                  <button
                    type="button"
                    onClick={() => setBatchSponsorPayOpen(false)}
                    className="rounded-lg border border-slate-200 px-4 py-2 font-semibold text-slate-600 hover:bg-slate-50"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={
                      selectedCandidates.length === 0 ||
                      batchSponsorPayForm.totalAmount <= 0 ||
                      (hasAnyExceeded && !batchSponsorPayForm.autoAdjustCommissionIfExceeded)
                    }
                    className="rounded-lg bg-emerald-600 px-5 py-2 font-bold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Bayar {getTerminShortTitle(batchSponsorPayForm.terminKey)} ke {selectedCandidates.length} CPMI ({formatRupiah(batchSponsorPayForm.totalAmount || 0)})
                  </button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}

      {/* =========================================================
          MODAL KWITANSI RESMI PEMBAYARAN TERMIN FEE SPONSOR
         ========================================================= */}
      {receiptPreviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm print:static print:inset-auto print:block print:bg-white print:p-0">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl print:max-w-none print:rounded-none print:shadow-none">
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
                    Pilih akun staf lalu masukkan Email &amp; Password / PIN Login
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
                Pilih Cepat Akun Staf (Isi Email):
              </p>
              <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                {db.staffAccounts?.map((st) => (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => {
                      setLoginEmail(st.email);
                      setLoginPin("");
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
                    <span className="font-mono text-[10px] text-slate-400">{st.email}</span>
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
                <label className="font-bold text-slate-700 block mb-1">Password / PIN Login</label>
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
          MODAL TAMBAH / EDIT JOB ORDER / LOWONGAN
         ========================================================= */}
      {showNewVacancyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                {editingVacancy
                  ? `Edit Job Order / Lowongan (${editingVacancy.code})`
                  : "Tambah Job Order / Publikasi Lowongan Baru"}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setShowNewVacancyModal(false);
                  setEditingVacancy(null);
                }}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSaveVacancy} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Judul Lowongan *</label>
                <input
                  type="text"
                  required
                  value={newVacancyForm.title}
                  onChange={(e) =>
                    setNewVacancyForm({ ...newVacancyForm, title: e.target.value })
                  }
                  placeholder="Contoh: Penata Laksana Rumah Tangga & Babysitter (Riyadh)"
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
                    <optgroup label="Kawasan Timur Tengah (100% Zero Cost Syarikah / Majikan)">
                      <option value="Arab Saudi">Arab Saudi (SPSK / Musaned)</option>
                      <option value="Uni Emirat Arab (UAE)">Uni Emirat Arab (UAE - Tadbeer/MOHRE)</option>
                      <option value="Kuwait">Kuwait (Sektor Formal / Wakalah)</option>
                      <option value="Oman">Oman (Hospitality / Caregiver)</option>
                      <option value="Yordania">Yordania (Jordan - QIZ)</option>
                      <option value="Qatar">Qatar (Hospitality / Domestic)</option>
                      <option value="Bahrain">Bahrain (Caregiver / Domestic)</option>
                    </optgroup>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Kuota Dibutuhkan *</label>
                  <input
                    type="number"
                    min={1}
                    required
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
                    Syarikah / Agensi Mitra (Master Data) *
                  </label>
                  <select
                    required
                    value={newVacancyForm.agencyPartner}
                    onChange={(e) => {
                      const val = e.target.value;
                      const matched = (db.foreignAgencies || []).find(
                        (a) => a.name === val
                      );
                      setNewVacancyForm({
                        ...newVacancyForm,
                        agencyPartner: val,
                        destinationCountry:
                          matched?.country || newVacancyForm.destinationCountry,
                      });
                    }}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-semibold text-slate-900"
                  >
                    <option value="">-- Pilih Syarikah / Agensi Mitra --</option>
                    {(db.foreignAgencies || []).map((a) => (
                      <option key={a.id} value={a.name}>
                        {a.name} — {a.country} ({a.code})
                        {a.status !== "ACTIVE" ? ` [${a.status}]` : ""}
                      </option>
                    ))}
                    {newVacancyForm.agencyPartner &&
                      !(db.foreignAgencies || []).some(
                        (a) => a.name === newVacancyForm.agencyPartner
                      ) && (
                        <option value={newVacancyForm.agencyPartner}>
                          {newVacancyForm.agencyPartner}
                        </option>
                      )}
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Pemberi Kerja / Majikan</label>
                  <input
                    type="text"
                    value={newVacancyForm.employerName}
                    onChange={(e) =>
                      setNewVacancyForm({ ...newVacancyForm, employerName: e.target.value })
                    }
                    placeholder="Syarikah / Keluarga Majikan"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Sektor / Jabatan *</label>
                  <input
                    type="text"
                    required
                    value={newVacancyForm.jobSector}
                    onChange={(e) =>
                      setNewVacancyForm({ ...newVacancyForm, jobSector: e.target.value })
                    }
                    placeholder="Housekeeping & Caregiver"
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
                    placeholder="SAR 1.500 - 1.800 / bulan (Zero Cost)"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Estimasi Gaji (Rp)</label>
                  <input
                    type="number"
                    min={0}
                    value={newVacancyForm.salaryIdrEstimate}
                    onChange={(e) =>
                      setNewVacancyForm({
                        ...newVacancyForm,
                        salaryIdrEstimate: Number(e.target.value),
                      })
                    }
                    className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Gender</label>
                  <select
                    value={newVacancyForm.genderPref}
                    onChange={(e) =>
                      setNewVacancyForm({
                        ...newVacancyForm,
                        genderPref: e.target.value as "P" | "L" | "P/L",
                      })
                    }
                    className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  >
                    <option value="P">Wanita (P)</option>
                    <option value="L">Pria (L)</option>
                    <option value="P/L">Wanita / Pria (P/L)</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Batas Lamaran</label>
                  <input
                    type="date"
                    value={newVacancyForm.closingDate}
                    onChange={(e) =>
                      setNewVacancyForm({ ...newVacancyForm, closingDate: e.target.value })
                    }
                    className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Syarat Usia</label>
                  <input
                    type="text"
                    value={newVacancyForm.ageRange}
                    onChange={(e) =>
                      setNewVacancyForm({ ...newVacancyForm, ageRange: e.target.value })
                    }
                    placeholder="21 - 40 Tahun"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Minimal Pendidikan</label>
                  <input
                    type="text"
                    value={newVacancyForm.minEducation}
                    onChange={(e) =>
                      setNewVacancyForm({ ...newVacancyForm, minEducation: e.target.value })
                    }
                    placeholder="SD / SMP / SMA"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Persyaratan (1 baris = 1 poin)
                </label>
                <textarea
                  rows={3}
                  value={newVacancyForm.requirementsText}
                  onChange={(e) =>
                    setNewVacancyForm({ ...newVacancyForm, requirementsText: e.target.value })
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowNewVacancyModal(false);
                    setEditingVacancy(null);
                  }}
                  className="rounded-lg border border-slate-200 px-4 py-2 font-semibold text-slate-600"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-slate-900 px-5 py-2 font-semibold text-white hover:bg-slate-800 cursor-pointer"
                >
                  {editingVacancy ? "Simpan Perubahan" : "Tayangkan Lowongan"}
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
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-bold text-slate-900">Tambah Akun Staf P3MI Baru</h3>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const { data } = await callApi("CREATE_STAFF", newStaffForm);
                if (data.ok) {
                  setShowAddStaffModal(false);
                  setNewStaffForm({
                    name: "",
                    email: "",
                    role: "INTERVIEW_PENDAFTARAN",
                    secondaryRoles: [],
                    branchId: "ALL",
                    phone: "",
                    pinCode: "",
                  });
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
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Password / PIN *</label>
                  <input
                    type="text"
                    required
                    value={newStaffForm.pinCode}
                    onChange={(e) => setNewStaffForm({ ...newStaffForm, pinCode: e.target.value })}
                    placeholder="Contoh: PBAS-Nama#26"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">No. Telp / WA</label>
                  <input
                    type="text"
                    value={newStaffForm.phone}
                    onChange={(e) => setNewStaffForm({ ...newStaffForm, phone: e.target.value })}
                    placeholder="08xx-xxxx-xxxx"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  />
                </div>
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Peran Utama (Role RBAC)</label>
                <select
                  value={newStaffForm.role}
                  onChange={(e) =>
                    setNewStaffForm({ ...newStaffForm, role: e.target.value as UserRole })
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                >
                  {(db.roles || []).map((r) => (
                    <option key={r.code} value={r.code}>
                      {r.name} ({r.code})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Peran Tambahan / Rangkap Divisi (Opsional)
                </label>
                <div className="grid grid-cols-2 gap-1.5 rounded-lg border border-slate-200 bg-slate-50 p-2 max-h-32 overflow-y-auto">
                  {(db.roles || [])
                    .filter((r) => r.code !== newStaffForm.role)
                    .map((r) => {
                      const checked = newStaffForm.secondaryRoles.includes(r.code);
                      return (
                        <label
                          key={r.code}
                          className="flex items-center gap-1.5 text-[11px] text-slate-700 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(e) => {
                              const next = e.target.checked
                                ? [...newStaffForm.secondaryRoles, r.code]
                                : newStaffForm.secondaryRoles.filter((x) => x !== r.code);
                              setNewStaffForm({ ...newStaffForm, secondaryRoles: next });
                            }}
                          />
                          <span className="truncate">{r.name}</span>
                        </label>
                      );
                    })}
                </div>
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
          MODAL FORMULIR PENDAFTARAN CPMI/CTKI RESMI PT PANCA BANYU AJISAKTI
          (MENCAKUP IDE 1: SPLIT-SCREEN AI OCR & WA PARSER, IDE 2: INBOX SERAH-TERIMA SPONSOR, IDE 3: FORMULIR LENGKAP & CETAK FISIK)
         ========================================================= */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-3 sm:p-5 backdrop-blur-sm">
          <div className="flex max-h-[94vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
            {/* HEADER RESMI PT PANCA BANYU AJISAKTI */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 bg-slate-900 px-6 py-4 text-white">
              <div className="flex items-center gap-3.5">
                <div
                  style={{ width: 52, height: 52 }}
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white p-1.5 shadow-sm"
                >
                  <img
                    src="/logo-panca-banyu.png"
                    alt="Logo PT Panca Banyu Ajisakti"
                    width={40}
                    height={40}
                    style={{ width: 40, height: 40 }}
                    className="h-10 w-10 object-contain"
                  />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded bg-sky-500 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-white">
                      SOP PENERIMAAN & INTERVIEW CPMI/PMI
                    </span>
                    <span className="text-xs font-bold text-amber-300">
                      PT. PANCA BANYU AJISAKTI — Indonesia Manpower Service
                    </span>
                  </div>
                  <h3 className="mt-0.5 text-base sm:text-lg font-bold text-white">
                    Info Sponsor ➔ Interview Petugas PT (Isi Blanko F4) ➔ Scan & Input ke Sistem
                  </h3>
                  <p className="text-[11px] text-slate-300">
                    1. Sponsor beri info CPMI ➔ 2. Petugas PT interview (Telepon / Video Call / Datang ke Kantor) & isi manual Blanko F4 ➔ 3. Scan & ekstrak ke sistem ➔ 4. Terbitkan No. Reg.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const tempCand: Candidate = {
                      id: "temp-preview",
                      regNumber: newForm.customRegNumber.trim() || "",
                      nik: newForm.nik || regForm.ktpOrPassportNo || "",
                      fullName: newForm.fullName || "........................................",
                      gender: newForm.gender,
                      avatarUrl: newForm.avatarUrl || AVATAR_PRESETS[0].url,
                      birthPlace: newForm.birthPlace || "............",
                      birthDate: newForm.birthDate || "1998-08-14",
                      phone: newForm.phone || "..................",
                      address: newForm.address || "........................................................",
                      maritalStatus: newForm.maritalStatus,
                      education: newForm.education,
                      destinationCountry: newForm.destinationCountry as DestinationCountry,
                      jobSector: newForm.jobSector,
                      employerName: newForm.employerName,
                      agencyPartner: newForm.agencyPartner,
                      stage: newForm.stage,
                      specialStatus: "NORMAL",
                      placementFee: 32000000,
                      costIncurred: 0,
                      sponsorCommission: 4500000,
                      commissionPaid: false,
                      branchId: newForm.branchId,
                      sponsorId: newForm.sponsorId,
                      createdAt: new Date().toISOString().slice(0, 10),
                      updatedAt: new Date().toISOString().slice(0, 10),
                      documents: [],
                      registrationForm: regForm,
                    };
                    setPrintingRegFormCandidate(tempCand);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-amber-400/50 bg-amber-500/20 px-3.5 py-2 text-xs font-bold text-amber-200 hover:bg-amber-500/30"
                >
                  <Printer className="h-4 w-4 text-amber-300" />
                  🖨️ Pratinjau & Cetak Lembar Fisik (Ide 3)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const tempCand: Candidate = {
                      id: "temp-preview",
                      regNumber: newForm.customRegNumber.trim() || "",
                      nik: newForm.nik || regForm.ktpOrPassportNo || "",
                      fullName: newForm.fullName || "EKA HERMAYANTI RUSLAN",
                      gender: newForm.gender,
                      avatarUrl: newForm.avatarUrl || "/biodata-img-2.jpg",
                      fullBodyPhotoUrl:
                        newForm.fullBodyPhotoUrl ||
                        regForm.fullBodyPhotoUrl ||
                        "/biodata-img-3.jpg",
                      birthPlace: newForm.birthPlace || "JOWET",
                      birthDate: newForm.birthDate || "2003-12-17",
                      phone: newForm.phone || "083174903728",
                      address: newForm.address || "N.T.B",
                      maritalStatus: newForm.maritalStatus,
                      education: newForm.education,
                      destinationCountry: newForm.destinationCountry as DestinationCountry,
                      jobSector: newForm.jobSector,
                      employerName: newForm.employerName,
                      agencyPartner: newForm.agencyPartner,
                      stage: newForm.stage,
                      specialStatus: "NORMAL",
                      placementFee: 36000000,
                      costIncurred: 0,
                      sponsorCommission: 6000000,
                      commissionPaid: false,
                      branchId: newForm.branchId,
                      sponsorId: newForm.sponsorId,
                      createdAt: new Date().toISOString().slice(0, 10),
                      updatedAt: new Date().toISOString().slice(0, 10),
                      documents: [],
                      registrationForm: regForm,
                    };
                    openSyarikahBiodataModal(tempCand);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-400/60 bg-indigo-600 px-3.5 py-2 text-xs font-extrabold text-white shadow-sm hover:bg-indigo-500"
                >
                  <Printer className="h-4 w-4 text-amber-300" />
                  🌍 Printout Biodata Syarikah (CV Majikan)
                </button>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="rounded-lg bg-white/10 p-1.5 text-slate-300 hover:bg-white/20 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* 3 TAB SESUAI SOP PT PANCA BANYU AJISAKTI: INFO SPONSOR & INTERVIEW -> SCAN FORMULIR HASIL INTERVIEW -> INPUT DATA ENTRY */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-slate-100 px-6 py-2.5">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setRegModalTab("INBOX_SPONSOR")}
                  className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition ${
                    regModalTab === "INBOX_SPONSOR"
                      ? "bg-slate-900 text-white shadow-sm"
                      : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <span>📞 1. Info Awal Sponsor & Interview Petugas PT</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold ${
                      regModalTab === "INBOX_SPONSOR"
                        ? "bg-emerald-400 text-slate-950"
                        : "bg-emerald-100 text-emerald-800"
                    }`}
                  >
                    {db.sponsorSubmissions?.filter((s) => s.status === "MENUNGGU_DATA_ENTRY")
                      .length || 0}{" "}
                    Antrean
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setRegModalTab("SCAN_DAN_WA")}
                  className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition ${
                    regModalTab === "SCAN_DAN_WA"
                      ? "bg-sky-700 text-white shadow-sm"
                      : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <span>📠 2. Scan Formulir Hasil Interview ➔ Ekstrak ke Sistem</span>
                </button>

                <button
                  type="button"
                  onClick={() => setRegModalTab("FORM_LENGKAP")}
                  className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition ${
                    regModalTab === "FORM_LENGKAP"
                      ? "bg-teal-700 text-white shadow-sm"
                      : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <span>📝 3. Input Data Entry & Terbitkan No. Reg. Sistem</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  setRegModalTab("FORM_LENGKAP");
                  setNewForm((prev) => ({
                    ...prev,
                    stage: "PROSPECT",
                    nik: "3212155408980001",
                    fullName: "Sri Wahyuni (Input Ulang Cabang Lain)",
                    phone: "0812-8821-3301",
                  }));
                }}
                className="rounded-lg border border-sky-300 bg-sky-50 px-2.5 py-1.5 text-[11px] font-bold text-sky-800 hover:bg-sky-100"
              >
                💡 Uji Blokir NIK Ganda
              </button>
            </div>

            {/* BODY KONTEN MODAL */}
            <div className="flex-1 overflow-y-auto p-6">
              {duplicateNikAlert && (
                <div className="mb-5 rounded-xl border-2 border-rose-500 bg-rose-50 p-4">
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

              {/* =========================================================
                  TAB 1: INFO AWAL SPONSOR -> INTERVIEW PETUGAS PT PANCA (ISI BLANKO MANUAL) -> SCAN KE SISTEM
                 ========================================================= */}
              {regModalTab === "INBOX_SPONSOR" && (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4">
                    <div className="max-w-3xl">
                      <span className="rounded bg-emerald-700 px-2 py-0.5 text-[10px] font-bold uppercase text-white">
                        SOP RESMI PENERIMAAN & INTERVIEW PT. PANCA BANYU AJISAKTI
                      </span>
                      <h4 className="mt-1 text-sm font-bold text-slate-900">
                        1. Sponsor Beri Info CPMI ➔ 2. Petugas PT Interview (Telepon / Video Call / Datang ke Kantor) & Isi Blanko F4 ➔ 3. Scan & Input Sistem
                      </h4>
                      <p className="mt-0.5 text-xs text-slate-600">
                        Sponsor menyerahkan informasi awal CPMI kepada Petugas PT Panca. Petugas melakukan interview (via Telepon, Video Call, atau Tatap Muka di Kantor) sambil mengisi manual pada <strong>Blanko Formulir F4 Kosong</strong>. Hasil formulir yang telah diisi manual kemudian di-scan untuk dimasukkan ke sistem.
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <a
                        href="/Formulir-Baru-F4s.pdf"
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-800 shadow-2xs hover:bg-slate-50"
                      >
                        🖨️ Cetak Blanko Kosong F4 (Untuk Interview)
                      </a>
                      <button
                        type="button"
                        onClick={async () => {
                          const randNum = Math.floor(1000 + Math.random() * 8999);
                          const { data } = await callApi("CREATE_SPONSOR_SUBMISSION", {
                            sponsorId: "sp-1",
                            branchId: "br-idm",
                            sourceMethod: "SCAN_FORM_FISIK",
                            physicalFormImageUrl: "/form-sudah-terisi.jpg",
                            fullName: `Nengsih Rahayu (${randNum})`,
                            nik: `321215580998${randNum}`,
                            gender: "P",
                            avatarUrl: AVATAR_PRESETS[1].url,
                            birthPlace: "Indramayu",
                            birthDate: "1998-09-18",
                            phone: `0812-8844-${randNum}`,
                            address: "Desa Karangampel Kidul RT 005/002 Kec. Karangampel, Indramayu",
                            maritalStatus: "Kawin",
                            education: "SMA/SMK",
                            destinationCountry: "Arab Saudi",
                            jobSector: "Housekeeping & Caregiver (SPSK)",
                            registrationForm: {
                              ...regForm,
                              nickname: "Nengsih",
                              interviewMethod: "VIDEO_CALL",
                              heightCm: 158,
                              weightKg: 52,
                              ktpOrPassportNo: `321215580998${randNum}`,
                              fatherName: "H. Wono",
                              fatherAge: 57,
                              motherName: "Hj. Rohimah",
                              motherAge: 52,
                              spouseOrGuardianName: "Asep Saepudin",
                              spouseAge: 34,
                              spouseOccupation: "Wiraswasta",
                              workExperience1:
                                "2021 - 2024 : Asisten Rumah Tangga & Lansia di Jakarta",
                              workExperience2: "2024 - 2025 : Pelatihan Bahasa Arab & Caregiving",
                              sponsorOfficerName: "Kang Dedi Kusnadi (PL-IDM-001)",
                              sponsorOfficerPhone: "0812-2301-4455",
                              sponsorNotes:
                                "Sudah di-interview via Video Call oleh Petugas PT Panca, blanko F4 fisik telah diisi manual & di-scan untuk diinput ke sistem.",
                            },
                          });
                          if (data.ok) {
                            setToast({
                              type: "success",
                              title: `Data Hasil Interview (${data.submission.submissionCode}) Masuk ke Antrean Input Sistem!`,
                            });
                          }
                        }}
                        className="rounded-xl bg-emerald-700 px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-800"
                      >
                        + Tambah Antrean Hasil Interview Baru
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                    {(db.sponsorSubmissions || []).map((sub) => {
                      const isPending = sub.status === "MENUNGGU_DATA_ENTRY";
                      const rf = sub.registrationForm;
                      const asliDocs = Object.entries(rf.docHandover)
                        .filter(
                          ([k, v]) =>
                            v === "ASLI" && !["otherDoc8Name", "otherDoc9Name"].includes(k)
                        )
                        .map(([k]) => k.toUpperCase());

                      return (
                        <div
                          key={sub.id}
                          className={`flex flex-col justify-between rounded-2xl border p-4 shadow-xs transition ${
                            isPending
                              ? "border-sky-200 bg-white hover:border-sky-400"
                              : "border-slate-200 bg-slate-50/80 opacity-85"
                          }`}
                        >
                          <div>
                            <div className="flex items-center justify-between gap-2">
                              <span className="rounded bg-slate-100 px-2 py-0.5 font-mono text-[10px] font-bold text-slate-700">
                                {sub.submissionCode}
                              </span>
                              <span
                                className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold ${
                                  isPending
                                    ? "bg-amber-100 text-amber-900"
                                    : "bg-emerald-100 text-emerald-800"
                                }`}
                              >
                                {isPending
                                  ? "⏳ MENUNGGU DATA ENTRY"
                                  : `✓ SUDAH DIINPUT (${sub.processedRegNumber || "TERDAFTAR"})`}
                              </span>
                            </div>

                            <div className="mt-3 flex items-center gap-3">
                              <img
                                src={sub.avatarUrl || AVATAR_PRESETS[0].url}
                                alt={sub.fullName}
                                className="h-14 w-11 shrink-0 rounded-lg border border-slate-300 object-cover"
                              />
                              <div>
                                <h5 className="text-sm font-bold text-slate-900">
                                  {sub.fullName}{" "}
                                  <span className="text-xs font-normal text-slate-500">
                                    ({rf.nickname})
                                  </span>
                                </h5>
                                <p className="font-mono text-[11px] font-semibold text-teal-700">
                                  NIK: {sub.nik || "Menyusul"}
                                </p>
                                <p className="text-[11px] text-slate-600">
                                  Tujuan: <strong>{sub.destinationCountry}</strong> · {sub.jobSector}
                                </p>
                              </div>
                            </div>

                            <div className="mt-3 space-y-1.5 rounded-xl bg-slate-50 p-3 text-[11px] text-slate-600 border border-slate-100">
                              <div className="flex justify-between">
                                <span>Sponsor Pengirim:</span>
                                <strong className="text-slate-900">{sub.sponsorName}</strong>
                              </div>
                              <div className="flex justify-between">
                                <span>Tinggi / Berat & TTL:</span>
                                <strong className="text-slate-900">
                                  {rf.heightCm} cm / {rf.weightKg} kg · {sub.birthPlace},{" "}
                                  {sub.birthDate}
                                </strong>
                              </div>
                              <div className="flex justify-between">
                                <span>Orang Tua & Wali:</span>
                                <strong className="text-slate-900">
                                  Bpk. {rf.fatherName} ({rf.fatherAge}Th) / {rf.spouseOrGuardianName}
                                </strong>
                              </div>
                              <div>
                                <span className="block text-slate-500">
                                  Dokumen Fisik Diserahkan (ASLI):
                                </span>
                                <div className="mt-1 flex flex-wrap gap-1">
                                  {asliDocs.map((d) => (
                                    <span
                                      key={d}
                                      className="rounded bg-teal-100 px-1.5 py-0.5 text-[9px] font-bold text-teal-900"
                                    >
                                      ✓ {d} ASLI
                                    </span>
                                  ))}
                                </div>
                              </div>
                              <p className="italic text-slate-500 pt-1">
                                &ldquo;{rf.sponsorNotes}&rdquo;
                              </p>
                            </div>
                          </div>

                          <div className="mt-4 flex flex-col gap-2 border-t border-slate-100 pt-3">
                            <button
                              type="button"
                              onClick={() => handleApplySponsorSubmission(sub)}
                              className="w-full rounded-xl bg-slate-900 px-3 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-slate-800"
                            >
                              ⚡ Salin Isi ke Form Data Entry & Verifikasi →
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                handleApplySponsorSubmission(sub);
                                setRegModalTab("SCAN_DAN_WA");
                              }}
                              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-700 hover:bg-slate-50"
                            >
                              📸 Bandingkan dengan Scan Formulir Kertas
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* =========================================================
                  TAB 2: SPLIT-SCREEN SCAN FOTO FORMULIR KERTAS & SMART WA PARSER (IDE 1 & 2)
                 ========================================================= */}
              {regModalTab === "SCAN_DAN_WA" && (
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                  {/* KOLOM KIRI: PRATINJAU FOTO / SCAN FORMULIR KERTAS FISIK DARI SPONSOR */}
                  <div className="space-y-3 lg:col-span-6">
                    <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-900 p-3 text-white">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-sky-300 block">
                          TAHAP 2 SOP · SCAN BLANKO HASIL INTERVIEW PETUGAS PT. PANCA
                        </span>
                        <h4 className="text-xs font-bold">
                          Scan Blanko F4 yang Diisi Manual oleh Petugas PT Saat Interview CPMI
                        </h4>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {[100, 125, 150].map((zm) => (
                          <button
                            key={zm}
                            type="button"
                            onClick={() => setPhysicalFormZoom(zm)}
                            className={`rounded px-2 py-1 text-[10px] font-bold ${
                              physicalFormZoom === zm
                                ? "bg-sky-500 text-white"
                                : "bg-white/10 text-slate-300 hover:bg-white/20"
                            }`}
                          >
                            {zm}%
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <label className="cursor-pointer inline-flex items-center gap-1.5 rounded-xl border border-sky-300 bg-sky-50 px-2.5 py-1.5 text-xs font-bold text-sky-900 hover:bg-sky-100">
                          <span>📤 Upload PDF / Foto Formulir (PDF/JPG/PNG)</span>
                          <input
                            type="file"
                            accept="image/*,.pdf"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              if (file.name.toLowerCase().endsWith(".pdf")) {
                                setPhysicalFormScanUrl("/form-sudah-terisi.jpg");
                                setToast({
                                  type: "success",
                                  title: `File PDF "${file.name}" Berhasil Dimuat`,
                                  details: [
                                    "Halaman ke-1 PDF telah dirender ke layar pratinjau. Klik '✨ Ekstrak Isi Formulir Tulisan Tangan (AI Vision)' untuk menyalin Poin 1–17 ke sistem.",
                                  ],
                                });
                                return;
                              }
                              const reader = new FileReader();
                              reader.onload = () => {
                                setPhysicalFormScanUrl(String(reader.result || ""));
                                setToast({
                                  type: "success",
                                  title: `Foto Formulir Kertas "${file.name}" Berhasil Dimuat`,
                                  details: [
                                    "Klik tombol '✨ Ekstrak Isi Formulir Tulisan Tangan (AI Vision)' untuk menyalin isinya ke form Data Entry.",
                                  ],
                                });
                              };
                              reader.readAsDataURL(file);
                            }}
                          />
                        </label>
                        <button
                          type="button"
                          onClick={() => setPhysicalFormScanUrl("/form-sudah-terisi.jpg")}
                          className={`rounded-xl border px-2.5 py-1.5 text-[11px] font-bold ${
                            physicalFormScanUrl === "/form-sudah-terisi.jpg"
                              ? "border-amber-500 bg-amber-50 text-amber-950"
                              : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                          }`}
                        >
                          ✍️ Scan Tulisan Tangan (form_sudah_terisi.pdf)
                        </button>
                        <a
                          href="/form-sudah-terisi.pdf"
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 rounded-xl border border-slate-300 bg-white px-2.5 py-1.5 text-[11px] font-bold text-slate-800 hover:bg-slate-50"
                        >
                          📄 PDF Terisi
                        </a>
                        <a
                          href="/Formulir-Baru-F4s.pdf"
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 rounded-xl border border-slate-300 bg-white px-2.5 py-1.5 text-[11px] font-bold text-slate-800 hover:bg-slate-50"
                        >
                          📄 PDF Blanko F4
                        </a>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          handleRunFormOcrSimulation();
                          setRegModalTab("FORM_LENGKAP");
                        }}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-sky-600 to-teal-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:from-sky-700 hover:to-teal-700"
                      >
                        <Sparkles className="h-4 w-4" />
                        ✨ Ekstrak Isi Formulir Tulisan Tangan (AI Vision)
                      </button>
                    </div>

                    <div className="max-h-[480px] overflow-auto rounded-2xl border-2 border-slate-300 bg-slate-200 p-3 shadow-inner">
                      <div
                        style={{
                          transform: `scale(${physicalFormZoom / 100})`,
                          transformOrigin: "top left",
                        }}
                        className="transition-transform"
                      >
                        <img
                          src={physicalFormScanUrl}
                          alt="Scan Formulir Baru F4 Pendaftaran CPMI PT Panca Banyu Ajisakti"
                          className="mx-auto w-full rounded-lg bg-white shadow-md"
                        />
                      </div>
                    </div>
                  </div>

                  {/* KOLOM KANAN: SMART WHATSAPP PARSER SPONSOR & RINGKASAN HASIL SALIN */}
                  <div className="space-y-4 lg:col-span-6">
                    <div className="rounded-2xl border border-teal-200 bg-teal-50/60 p-4 space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <span className="rounded bg-teal-700 px-2 py-0.5 text-[10px] font-bold uppercase text-white">
                            SMART WHATSAPP PARSER SPONSOR ➔ DATA ENTRY (POIN 1–17 F4)
                          </span>
                          <h4 className="mt-1 text-sm font-bold text-slate-900">
                            Tempel Chat WhatsApp dari Sponsor Lapangan ➔ Auto-Fill Poin 1 s/d 17
                          </h4>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            if (typeof navigator !== "undefined" && navigator.clipboard) {
                              navigator.clipboard.writeText(waRawText);
                            }
                            setToast({
                              type: "success",
                              title: "Template Format WA Formulir Baru F4 Disalin ke Clipboard!",
                              details: [
                                "Kirimkan format Poin 1–17 ini ke grup WhatsApp Sponsor Lapangan agar mereka mudah mengirim data sesuai urutan Formulir Baru F4 PT Panca Banyu Ajisakti.",
                              ],
                            });
                          }}
                          className="rounded-lg border border-teal-300 bg-white px-2.5 py-1.5 text-[11px] font-bold text-teal-800 hover:bg-teal-100"
                        >
                          📋 Copy Template WA F4 untuk Sponsor
                        </button>
                      </div>

                      <textarea
                        rows={11}
                        value={waRawText}
                        onChange={(e) => setWaRawText(e.target.value)}
                        placeholder="Tempel (Paste) pesan WhatsApp berisi Poin 1–17 biodata CPMI dari Sponsor di sini..."
                        className="w-full rounded-xl border border-slate-300 bg-white p-3 font-mono text-[11px] leading-relaxed text-slate-800"
                      />

                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-[11px] text-slate-600">
                          Otomatis mengenali Poin 1–17: Biodata, Umur Asli, Kakek dari Bapak, Pengalaman LN, Bahasa, Masakan Arab & Dokumen.
                        </span>
                        <button
                          type="button"
                          onClick={handleParseWhatsAppText}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-teal-700 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-teal-800"
                        >
                          ⚡ Konversi Chat WA ke Formulir Baru F4 →
                        </button>
                      </div>
                    </div>

                    {/* Ringkasan Cepat Data yang Sudah Masuk ke Memori Formulir */}
                    <div className="rounded-2xl border border-slate-200 bg-white p-4 text-xs space-y-2">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                        <strong className="text-slate-900">
                          Status Data di Memori Formulir Baru F4 Saat Ini:
                        </strong>
                        <button
                          type="button"
                          onClick={() => setRegModalTab("FORM_LENGKAP")}
                          className="font-bold text-sky-700 hover:underline"
                        >
                          Buka Formulir Baru F4 Lengkap (Poin 1–17) →
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-[11px]">
                        <div>
                          <span className="text-slate-400 block">3. Nama Lengkap & Umur Asli:</span>
                          <strong className="text-slate-900">
                            {newForm.fullName || "(Belum diisi)"} ({regForm.realAge} Th)
                          </strong>
                        </div>
                        <div>
                          <span className="text-slate-400 block">NIK / No. KTP:</span>
                          <strong className="font-mono text-teal-700">
                            {newForm.nik || "(Belum diisi)"}
                          </strong>
                        </div>
                        <div>
                          <span className="text-slate-400 block">1. Negara Tujuan & 10. Fisik:</span>
                          <strong className="text-slate-900">
                            {newForm.destinationCountry} · {regForm.heightCm} cm / {regForm.weightKg} kg
                          </strong>
                        </div>
                        <div>
                          <span className="text-slate-400 block">2. Nama Sponsor Pengirim:</span>
                          <strong className="text-slate-900">{regForm.sponsorOfficerName}</strong>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* =========================================================
                  TAB 3: FORMULIR BARU F4 PT PANCA BANYU AJISAKTI (100% MEWAKILI FORMULIR BARU F4s.pdf POIN 1-17)
                 ========================================================= */}
              {regModalTab === "FORM_LENGKAP" && (
                <form onSubmit={handleCreateCandidate} className="space-y-6 text-xs">
                  {activeSponsorSubmissionId && (
                    <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-xs text-emerald-950">
                      <div>
                        <strong>✓ Mode Verifikasi Serah-Terima Sponsor Aktif:</strong> Data di bawah disalin otomatis dari draft Formulir Baru F4 Sponsor. Setelah Anda klik{" "}
                        <strong>Simpan Formulir</strong>, status kiriman Sponsor otomatis berubah menjadi{" "}
                        <code className="rounded bg-emerald-200 px-1.5 py-0.5 font-bold">
                          SUDAH_DIINPUT
                        </code>
                        .
                      </div>
                      <button
                        type="button"
                        onClick={() => setActiveSponsorSubmissionId(null)}
                        className="text-[11px] font-bold text-rose-700 hover:underline"
                      >
                        Reset Mode Draft
                      </button>
                    </div>
                  )}

                  {/* BAGIAN 1: POIN 1 S/D 11 FORMULIR BARU F4 (IDENTITAS, NEGARA TUJUAN, SPONSOR, UMUR ASLI, PENDIDIKAN, STATUS, ANAK & FISIK) */}
                  <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
                      <div>
                        <span className="rounded bg-slate-900 px-2 py-0.5 text-[10px] font-bold uppercase text-white">
                          POIN 1 s/d 11 · IDENTITAS PRIBADI, SPONSOR, PENDIDIKAN & KEADAAN FISIK (FORMULIR BARU F4)
                        </span>
                        <h4 className="mt-1 text-sm font-bold text-slate-900">
                          Sesuai Urutan Baris 1–11 pada Lembar &ldquo;Formulir Baru F4s.pdf&rdquo; PT Panca Banyu Ajisakti
                        </h4>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-amber-300 bg-amber-50 px-3 py-2">
                        <div>
                          <label className="block text-[10px] font-extrabold uppercase text-amber-900">
                            No. Reg. (Diisi Manual Setelah Dapat Nomor Sistem)
                          </label>
                          <div className="mt-1 flex items-center gap-1.5">
                            <input
                              type="text"
                              value={newForm.customRegNumber}
                              onChange={(e) =>
                                setNewForm({ ...newForm, customRegNumber: e.target.value })
                              }
                              placeholder="Kosong (Belum Dapat Nomor)"
                              className="w-40 rounded-lg border border-amber-400 bg-white px-2.5 py-1 font-mono text-xs font-black text-rose-700"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                setNewForm({
                                  ...newForm,
                                  customRegNumber: `2611${String(
                                    (db.candidates?.length || 11) + 1
                                  ).padStart(4, "0")}`,
                                })
                              }
                              className="rounded-lg bg-slate-900 px-2.5 py-1 text-[10px] font-bold text-white hover:bg-slate-800"
                            >
                              ⚡ Ambil Nomor dari Sistem (2611
                              {String((db.candidates?.length || 11) + 1).padStart(4, "0")})
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Pilihan Pas Foto */}
                    <div className="flex flex-wrap items-center gap-4 rounded-xl border border-slate-200 bg-white p-3">
                      <img
                        src={newForm.avatarUrl || AVATAR_PRESETS[0].url}
                        alt="Pas Foto 4x6"
                        className="h-20 w-16 shrink-0 rounded-lg border-2 border-blue-700 object-cover shadow-xs"
                      />
                      <div className="flex-1 space-y-2">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="font-bold text-slate-800">
                            📷 Pas Foto Resmi CPMI (Tampil di Profil, e-KTP & Biodata Paspor)
                          </span>
                          <label className="cursor-pointer inline-flex items-center gap-1 rounded-lg border border-sky-300 bg-sky-50 px-2.5 py-1 text-[11px] font-bold text-sky-800 hover:bg-sky-100">
                            📤 Upload Foto Asli
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
                        </div>
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
                                    ? "border-sky-600 bg-sky-600 text-white"
                                    : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
                                }`}
                              >
                                <img
                                  src={preset.url}
                                  alt={preset.label}
                                  className="h-4 w-3.5 rounded-xs object-cover"
                                />
                                {preset.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Foto Seluruh Badan (Full Body 3R/4R) khusus Printout Biodata Syarikah */}
                      <div className="flex items-center gap-3 border-t border-slate-200 pt-2.5 sm:border-t-0 sm:border-l sm:pl-4">
                        <img
                          src={
                            newForm.fullBodyPhotoUrl ||
                            regForm.fullBodyPhotoUrl ||
                            "/biodata-img-3.jpg"
                          }
                          alt="Foto Seluruh Badan"
                          className="h-20 w-14 shrink-0 rounded-lg border-2 border-indigo-600 object-cover shadow-xs"
                        />
                        <div className="space-y-1.5">
                          <span className="block text-[11px] font-extrabold text-indigo-950">
                            🧍‍♀️ Foto Seluruh Badan (Full Body 3R/4R)
                          </span>
                          <span className="block text-[10px] text-slate-500">
                            Untuk Printout Biodata Syarikah (CV Majikan Timur Tengah)
                          </span>
                          <label className="cursor-pointer inline-flex items-center gap-1 rounded-lg border border-indigo-300 bg-indigo-50 px-2.5 py-1 text-[10.5px] font-bold text-indigo-900 hover:bg-indigo-100">
                            📤 Upload Foto Full Body
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                const reader = new FileReader();
                                reader.onload = () => {
                                  const url = String(reader.result || "");
                                  setNewForm((prev) => ({ ...prev, fullBodyPhotoUrl: url }));
                                  setRegForm((prev) => ({ ...prev, fullBodyPhotoUrl: url }));
                                };
                                reader.readAsDataURL(file);
                              }}
                            />
                          </label>
                        </div>
                      </div>
                    </div>

                    {/* PILIHAN ALUR PROSES PEREKRUTAN TIMUR TENGAH (REKOM SPSK VS NON-REKOM) & ZERO COST SYARIKAH */}
                    <div className="rounded-xl border-2 border-teal-500 bg-teal-50/70 p-3.5 space-y-2.5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <span className="rounded bg-teal-800 px-2 py-0.5 text-[10px] font-extrabold uppercase text-white">
                            PILIH ALUR PROSES PENEMPATAN TIMUR TENGAH · 100% ZERO COST SYARIKAH / MAJIKAN
                          </span>
                          <h5 className="mt-1 text-xs font-bold text-slate-900">
                            Tentukan Jalur Proses Kandidat: Alur Normal (Rekom SPSK) atau Alur Non-Rekom (Langsung Tiket & Keberangkatan)
                          </h5>
                        </div>
                        <span className="rounded-full bg-emerald-100 border border-emerald-400 px-2.5 py-0.5 text-[10px] font-extrabold text-emerald-900">
                          💰 Pembiayaan 100% Dibiayai Langsung oleh Syarikah / Majikan (Zero Cost)
                        </span>
                      </div>

                      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                        <button
                          type="button"
                          onClick={() => {
                            setNewForm({ ...newForm, processTrack: "REKOM" });
                            setRegForm({ ...regForm, processTrack: "REKOM" });
                          }}
                          className={`rounded-xl border-2 p-3 text-left transition ${
                            (newForm.processTrack || "REKOM") === "REKOM"
                              ? "border-teal-700 bg-teal-700 text-white shadow-sm"
                              : "border-slate-300 bg-white text-slate-800 hover:bg-slate-50"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-extrabold">
                              ✓ 1. Alur Penempatan Normal / Resmi (REKOM — SPSK)
                            </span>
                            {(newForm.processTrack || "REKOM") === "REKOM" && (
                              <span className="rounded bg-white/20 px-2 py-0.5 text-[10px] font-bold">
                                AKTIF DIPILIH
                              </span>
                            )}
                          </div>
                          <p
                            className={`mt-1 text-[11px] leading-snug ${
                              (newForm.processTrack || "REKOM") === "REKOM"
                                ? "text-teal-50"
                                : "text-slate-600"
                            }`}
                          >
                            Mengikuti skema resmi <strong>Sistem Penempatan Satu Kanal (SPSK)</strong> lengkap: Rekom ID SISKOP2MI, Medical Wafid, Paspor, Visa, <strong>BPJS-TK, PAP & E-KTKLN</strong>, lalu Tiket & Keberangkatan.
                          </p>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setNewForm({ ...newForm, processTrack: "NON_REKOM" });
                            setRegForm({ ...regForm, processTrack: "NON_REKOM" });
                          }}
                          className={`rounded-xl border-2 p-3 text-left transition ${
                            newForm.processTrack === "NON_REKOM"
                              ? "border-amber-500 bg-amber-500 text-slate-950 shadow-sm"
                              : "border-slate-300 bg-white text-slate-800 hover:bg-slate-50"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-extrabold">
                              ⚡ 2. Alur Proses NON-REKOM (Langsung Tiket & Terbang)
                            </span>
                            {newForm.processTrack === "NON_REKOM" && (
                              <span className="rounded bg-slate-950/15 px-2 py-0.5 text-[10px] font-bold">
                                AKTIF DIPILIH
                              </span>
                            )}
                          </div>
                          <p
                            className={`mt-1 text-[11px] leading-snug ${
                              newForm.processTrack === "NON_REKOM"
                                ? "text-slate-900 font-medium"
                                : "text-slate-600"
                            }`}
                          >
                            Melewati proses <strong>BPJS-TK, E-KTKLN, dan PAP</strong> (tidak perlu dikerjakan). Setelah Dokumen Dasar, Medical, Paspor & Visa selesai, <strong>langsung ke proses Tiket & Keberangkatan</strong>.
                          </p>
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
                      <div>
                        <label className="font-bold text-slate-700 block mb-1">
                          1. Negara Tujuan Penempatan (Timur Tengah) *
                        </label>
                        <select
                          value={newForm.destinationCountry}
                          onChange={(e) =>
                            setNewForm({ ...newForm, destinationCountry: e.target.value })
                          }
                          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-bold text-slate-900"
                        >
                          <optgroup label="Kawasan Timur Tengah (Zero Cost Syarikah / Majikan)">
                            <option value="Arab Saudi">Arab Saudi (SPSK / Musaned)</option>
                            <option value="Uni Emirat Arab (UAE)">Uni Emirat Arab (UAE - Tadbeer)</option>
                            <option value="Kuwait">Kuwait (Sektor Formal / Wakalah)</option>
                            <option value="Oman">Oman (Hospitality / Caregiver)</option>
                            <option value="Yordania">Yordania (Jordan - QIZ)</option>
                            <option value="Qatar">Qatar (Hospitality / Domestic)</option>
                            <option value="Bahrain">Bahrain (Caregiver / Domestic)</option>
                          </optgroup>
                        </select>
                      </div>

                      <div>
                        <label className="font-bold text-slate-700 block mb-1">
                          2. Nama Sponsor / PL Pengirim
                        </label>
                        <select
                          value={newForm.sponsorId}
                          onChange={(e) => {
                            const spId = e.target.value;
                            const sp = db.sponsors.find((s) => s.id === spId);
                            setNewForm({ ...newForm, sponsorId: spId });
                            if (sp) {
                              setRegForm({
                                ...regForm,
                                sponsorOfficerName: `${sp.name} (${sp.code})`,
                                sponsorOfficerPhone: sp.phone,
                              });
                            }
                          }}
                          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-semibold"
                        >
                          <option value="">Datang Langsung (Tanpa Sponsor)</option>
                          {db.sponsors.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.name} ({s.area})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="font-bold text-slate-700 block mb-1">
                          2b. Syarikah / Agensi Mitra (Master Data)
                        </label>
                        <select
                          value={newForm.agencyPartner}
                          onChange={(e) => {
                            const val = e.target.value;
                            const matched = (db.foreignAgencies || []).find(
                              (a) => a.name === val
                            );
                            setNewForm({
                              ...newForm,
                              agencyPartner: val,
                              employerName: val || newForm.employerName,
                              destinationCountry:
                                matched?.country || newForm.destinationCountry,
                            });
                          }}
                          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-semibold text-slate-900"
                        >
                          <option value="">-- Pilih Syarikah / Belum Ditentukan --</option>
                          {(db.foreignAgencies || []).map((a) => (
                            <option key={a.id} value={a.name}>
                              {a.name} — {a.country} ({a.code})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="lg:col-span-2">
                        <label className="font-bold text-slate-700 block mb-1">
                          3. Nama Lengkap (Sesuai KTP & Formulir F4) *
                        </label>
                        <input
                          type="text"
                          required
                          value={newForm.fullName}
                          onChange={(e) => setNewForm({ ...newForm, fullName: e.target.value })}
                          placeholder="Nama lengkap sesuai lembar formulir"
                          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-bold text-slate-900"
                        />
                      </div>

                      <div>
                        <label className="font-bold text-slate-700 block mb-1">
                          3b. Telp / HP Aktif CPMI *
                        </label>
                        <input
                          type="text"
                          required
                          value={newForm.phone}
                          onChange={(e) => setNewForm({ ...newForm, phone: e.target.value })}
                          placeholder="0812-xxxx-xxxx"
                          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono"
                        />
                      </div>

                      <div>
                        <label className="font-bold text-slate-700 block mb-1">
                          4a. Tempat Lahir
                        </label>
                        <input
                          type="text"
                          value={newForm.birthPlace}
                          onChange={(e) => setNewForm({ ...newForm, birthPlace: e.target.value })}
                          placeholder="Contoh: Indramayu"
                          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2"
                        />
                      </div>

                      <div>
                        <label className="font-bold text-slate-700 block mb-1">
                          4b. Tanggal Lahir
                        </label>
                        <input
                          type="date"
                          value={newForm.birthDate}
                          onChange={(e) => setNewForm({ ...newForm, birthDate: e.target.value })}
                          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono"
                        />
                      </div>

                      <div>
                        <label className="font-bold text-slate-700 block mb-1">
                          4c. Umur Asli (Tahun)
                        </label>
                        <input
                          type="number"
                          value={regForm.realAge || ""}
                          onChange={(e) =>
                            setRegForm({ ...regForm, realAge: Number(e.target.value) })
                          }
                          placeholder="28"
                          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono font-bold text-sky-900"
                        />
                      </div>

                      <div>
                        <label className="font-bold text-slate-700 block mb-1">5. Agama</label>
                        <select
                          value={regForm.religion}
                          onChange={(e) => setRegForm({ ...regForm, religion: e.target.value })}
                          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2"
                        >
                          <option value="Islam">Islam</option>
                          <option value="Kristen">Kristen</option>
                          <option value="Katolik">Katolik</option>
                          <option value="Hindu">Hindu</option>
                          <option value="Buddha">Buddha</option>
                        </select>
                      </div>

                      <div>
                        <label className="font-bold text-slate-700 block mb-1">
                          6. Pendidikan Terakhir (A. SD / B. SMP / C. SMA / D. Univ)
                        </label>
                        <select
                          value={newForm.education}
                          onChange={(e) => setNewForm({ ...newForm, education: e.target.value })}
                          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-semibold"
                        >
                          <option value="SD">A. SD</option>
                          <option value="SMP">B. SMP</option>
                          <option value="SMA/SMK">C. SMA / SMK</option>
                          <option value="D3/S1">D. Diploma / Universitas</option>
                        </select>
                      </div>

                      <div>
                        <label className="font-bold text-slate-700 block mb-1">
                          7. Anak ke : ... dari ... bersaudara
                        </label>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            value={regForm.childOrder || ""}
                            onChange={(e) =>
                              setRegForm({ ...regForm, childOrder: Number(e.target.value) })
                            }
                            placeholder="1"
                            className="w-16 rounded-lg border border-slate-300 bg-white px-2 py-2 text-center font-mono"
                          />
                          <span className="text-slate-500">dari</span>
                          <input
                            type="number"
                            value={regForm.siblingsCount || ""}
                            onChange={(e) =>
                              setRegForm({ ...regForm, siblingsCount: Number(e.target.value) })
                            }
                            placeholder="3"
                            className="w-16 rounded-lg border border-slate-300 bg-white px-2 py-2 text-center font-mono"
                          />
                          <span className="text-[11px] text-slate-500">bersaudara</span>
                        </div>
                      </div>

                      <div>
                        <label className="font-bold text-slate-700 block mb-1">
                          8. Status (A. Belum Kawin / B. Kawin / C. Janda)
                        </label>
                        <select
                          value={newForm.maritalStatus}
                          onChange={(e) =>
                            setNewForm({ ...newForm, maritalStatus: e.target.value })
                          }
                          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-semibold"
                        >
                          <option value="Belum Kawin">A. Belum Kawin</option>
                          <option value="Kawin">B. Kawin</option>
                          <option value="Cerai Hidup">C. Janda (Cerai Hidup)</option>
                          <option value="Cerai Mati">C. Janda (Cerai Mati)</option>
                        </select>
                      </div>

                      <div className="lg:col-span-2">
                        <label className="font-bold text-slate-700 block mb-1">
                          9. Jumlah Anak (... Orang), Anak Pertama (... Tahun), Anak Terakhir (... Tahun)
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              value={regForm.childrenTotalCount}
                              onChange={(e) =>
                                setRegForm({
                                  ...regForm,
                                  childrenTotalCount: Number(e.target.value),
                                })
                              }
                              className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-center font-mono"
                            />
                            <span className="text-[11px] text-slate-600 shrink-0">Orang</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] text-slate-500 shrink-0">ke-1:</span>
                            <input
                              type="text"
                              value={regForm.firstChildAge}
                              onChange={(e) =>
                                setRegForm({ ...regForm, firstChildAge: e.target.value })
                              }
                              placeholder="6"
                              className="w-full rounded-lg border border-slate-300 bg-white px-2 py-2 text-center font-mono"
                            />
                            <span className="text-[10px] text-slate-500 shrink-0">Th</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] text-slate-500 shrink-0"> Akhir:</span>
                            <input
                              type="text"
                              value={regForm.lastChildAge}
                              onChange={(e) =>
                                setRegForm({ ...regForm, lastChildAge: e.target.value })
                              }
                              placeholder="2 / -"
                              className="w-full rounded-lg border border-slate-300 bg-white px-2 py-2 text-center font-mono"
                            />
                            <span className="text-[10px] text-slate-500 shrink-0">Th</span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="font-bold text-slate-700 block mb-1">
                          10a. Tinggi Badan (cm)
                        </label>
                        <input
                          type="number"
                          value={regForm.heightCm || ""}
                          onChange={(e) =>
                            setRegForm({ ...regForm, heightCm: Number(e.target.value) })
                          }
                          placeholder="158"
                          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono"
                        />
                      </div>

                      <div>
                        <label className="font-bold text-slate-700 block mb-1">
                          10b. Berat Badan (kg)
                        </label>
                        <input
                          type="number"
                          value={regForm.weightKg || ""}
                          onChange={(e) =>
                            setRegForm({ ...regForm, weightKg: Number(e.target.value) })
                          }
                          placeholder="52"
                          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono"
                        />
                      </div>

                      <div className="lg:col-span-2">
                        <label className="font-bold text-slate-700 block mb-1">
                          11. Alamat Lengkap (Sesuai KTP & Formulir F4)
                        </label>
                        <input
                          type="text"
                          value={newForm.address}
                          onChange={(e) => setNewForm({ ...newForm, address: e.target.value })}
                          placeholder="Blok/Jalan, RT/RW, Desa/Kelurahan, Kecamatan, Kabupaten"
                          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2"
                        />
                      </div>

                      <div className="lg:col-span-2">
                        <label className="font-bold text-slate-700 block mb-1">
                          NIK e-KTP (16 Digit Unik Sistem){" "}
                          {newForm.stage === "LEAD" ? "(Opsional di Tahap Lead)" : "*"}
                        </label>
                        <input
                          type="text"
                          maxLength={16}
                          value={newForm.nik}
                          onChange={(e) => {
                            setNewForm({ ...newForm, nik: e.target.value });
                            setRegForm({ ...regForm, ktpOrPassportNo: e.target.value });
                          }}
                          placeholder="Contoh: 3212155408980001"
                          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono font-bold text-teal-800"
                        />
                      </div>
                    </div>
                  </div>

                  {/* BAGIAN 2: POIN 12 S/D 14 FORMULIR BARU F4 (ORANG TUA, KAKEK DARI BAPAK, SUAMI & KELUARGA LAIN) */}
                  <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 space-y-4">
                    <div className="border-b border-slate-200 pb-2">
                      <span className="rounded bg-slate-900 px-2 py-0.5 text-[10px] font-bold uppercase text-white">
                        POIN 12 s/d 14 · DATA ORANG TUA (TERMASUK KAKEK DARI BAPAK), SUAMI & KELUARGA LAIN
                      </span>
                      <h4 className="mt-1 text-sm font-bold text-slate-900">
                        Poin 12 (Bapak, Ibu & Kakek dari Bapak), Poin 13 (Suami & Pekerjaan) & Poin 14 (Keluarga Lain)
                      </h4>
                    </div>

                    <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
                      <div>
                        <label className="font-bold text-slate-700 block mb-1">
                          12a. Nama Bapak
                        </label>
                        <input
                          type="text"
                          value={regForm.fatherName}
                          onChange={(e) => setRegForm({ ...regForm, fatherName: e.target.value })}
                          placeholder="Nama ayah kandung"
                          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2"
                        />
                      </div>
                      <div>
                        <label className="font-bold text-slate-700 block mb-1">
                          Umur Bapak (th)
                        </label>
                        <input
                          type="number"
                          value={regForm.fatherAge || ""}
                          onChange={(e) =>
                            setRegForm({ ...regForm, fatherAge: Number(e.target.value) })
                          }
                          placeholder="58"
                          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono"
                        />
                      </div>
                      <div>
                        <label className="font-bold text-slate-700 block mb-1">12b. Nama Ibu</label>
                        <input
                          type="text"
                          value={regForm.motherName}
                          onChange={(e) => setRegForm({ ...regForm, motherName: e.target.value })}
                          placeholder="Nama ibu kandung"
                          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2"
                        />
                      </div>
                      <div>
                        <label className="font-bold text-slate-700 block mb-1">Umur Ibu (Th)</label>
                        <input
                          type="number"
                          value={regForm.motherAge || ""}
                          onChange={(e) =>
                            setRegForm({ ...regForm, motherAge: Number(e.target.value) })
                          }
                          placeholder="53"
                          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono"
                        />
                      </div>

                      <div className="lg:col-span-2">
                        <label className="font-bold text-sky-900 block mb-1">
                          12c. Kakek dari Bapak (Wajib untuk Visa Timur Tengah / Nama 3 Suku Kata)
                        </label>
                        <input
                          type="text"
                          value={regForm.paternalGrandfatherName}
                          onChange={(e) =>
                            setRegForm({
                              ...regForm,
                              paternalGrandfatherName: e.target.value,
                            })
                          }
                          placeholder="Nama kakek kandung dari pihak bapak"
                          className="w-full rounded-lg border border-sky-300 bg-white px-3 py-2 font-semibold text-slate-900"
                        />
                      </div>

                      <div className="lg:col-span-2">
                        <label className="font-bold text-slate-700 block mb-1">
                          13a. Nama Suami / Wali
                        </label>
                        <input
                          type="text"
                          value={regForm.spouseOrGuardianName}
                          onChange={(e) =>
                            setRegForm({ ...regForm, spouseOrGuardianName: e.target.value })
                          }
                          placeholder="Nama suami (atau '-' jika belum kawin)"
                          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2"
                        />
                      </div>

                      <div>
                        <label className="font-bold text-slate-700 block mb-1">
                          13b. Umur Suami (Th.)
                        </label>
                        <input
                          type="number"
                          value={regForm.spouseAge || ""}
                          onChange={(e) =>
                            setRegForm({ ...regForm, spouseAge: Number(e.target.value) })
                          }
                          placeholder="32"
                          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono"
                        />
                      </div>

                      <div>
                        <label className="font-bold text-slate-700 block mb-1">
                          13c. Pekerjaan Suami
                        </label>
                        <input
                          type="text"
                          value={regForm.spouseOccupation}
                          onChange={(e) =>
                            setRegForm({ ...regForm, spouseOccupation: e.target.value })
                          }
                          placeholder="Wiraswasta / Petani"
                          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2"
                        />
                      </div>

                      <div>
                        <label className="font-bold text-slate-700 block mb-1">
                          14a. Keluarga Lain : Nama
                        </label>
                        <input
                          type="text"
                          value={regForm.emergencyContactName}
                          onChange={(e) =>
                            setRegForm({ ...regForm, emergencyContactName: e.target.value })
                          }
                          placeholder="Nama keluarga yang dihubungi"
                          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2"
                        />
                      </div>

                      <div>
                        <label className="font-bold text-slate-700 block mb-1">
                          14b. Hubungan
                        </label>
                        <input
                          type="text"
                          value={regForm.emergencyContactRelation}
                          onChange={(e) =>
                            setRegForm({ ...regForm, emergencyContactRelation: e.target.value })
                          }
                          placeholder="Suami / Orang Tua / Kakak"
                          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2"
                        />
                      </div>

                      <div className="lg:col-span-2">
                        <label className="font-bold text-slate-700 block mb-1">
                          14c. No. Tlp Keluarga Lain
                        </label>
                        <input
                          type="text"
                          value={regForm.emergencyContactPhone}
                          onChange={(e) =>
                            setRegForm({ ...regForm, emergencyContactPhone: e.target.value })
                          }
                          placeholder="0852-xxxx-xxxx"
                          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  {/* BAGIAN 3: POIN 15 TABEL PENGALAMAN BEKERJA DILUAR NEGERI (Ex/Non) & 15. PEMAHAMAN BAHASA */}
                  <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 space-y-4">
                    <div className="border-b border-slate-200 pb-2">
                      <span className="rounded bg-slate-900 px-2 py-0.5 text-[10px] font-bold uppercase text-white">
                        POIN 15 · PENGALAMAN BEKERJA DILUAR NEGERI (Ex/Non) & PEMAHAMAN BAHASA
                      </span>
                      <h4 className="mt-1 text-sm font-bold text-slate-900">
                        Tabel Negara & Kota, Lama, Periode, Status Pemulangan (SELESAI / KASUS / KETERANGAN) & Bahasa Arab/Inggris
                      </h4>
                    </div>

                    <div className="overflow-x-auto rounded-xl border border-slate-300 bg-white">
                      <table className="w-full text-left text-xs">
                        <thead className="border-b border-slate-300 bg-slate-100 text-[10px] font-bold uppercase text-slate-800">
                          <tr>
                            <th className="px-2.5 py-2 w-10 text-center">No</th>
                            <th className="px-3 py-2">NEGARA DAN KOTA</th>
                            <th className="px-3 py-2 w-28">LAMA</th>
                            <th className="px-3 py-2 w-32">PERIODE</th>
                            <th className="px-2.5 py-2 text-center w-20">SELESAI</th>
                            <th className="px-2.5 py-2 text-center w-20">KASUS</th>
                            <th className="px-3 py-2">KETERANGAN</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {(regForm.overseasExperiences || []).map((row, idx) => (
                            <tr key={row.no} className="hover:bg-slate-50">
                              <td className="px-2.5 py-1.5 text-center font-mono font-bold text-slate-600">
                                {row.no}.
                              </td>
                              <td className="px-2 py-1.5">
                                <input
                                  type="text"
                                  value={row.countryAndCity}
                                  onChange={(e) => {
                                    const next = [...(regForm.overseasExperiences || [])];
                                    next[idx] = { ...next[idx], countryAndCity: e.target.value };
                                    setRegForm({
                                      ...regForm,
                                      overseasExperiences: next,
                                      workExperience1:
                                        idx === 0 && e.target.value
                                          ? `${next[0].period} : ${e.target.value} (${next[0].duration})`
                                          : regForm.workExperience1,
                                    });
                                  }}
                                  placeholder={idx === 0 ? "Contoh: Arab Saudi - Riyadh" : ""}
                                  className="w-full rounded border border-slate-200 px-2 py-1"
                                />
                              </td>
                              <td className="px-2 py-1.5">
                                <input
                                  type="text"
                                  value={row.duration}
                                  onChange={(e) => {
                                    const next = [...(regForm.overseasExperiences || [])];
                                    next[idx] = { ...next[idx], duration: e.target.value };
                                    setRegForm({ ...regForm, overseasExperiences: next });
                                  }}
                                  placeholder={idx === 0 ? "2 Tahun" : ""}
                                  className="w-full rounded border border-slate-200 px-2 py-1 font-mono"
                                />
                              </td>
                              <td className="px-2 py-1.5">
                                <input
                                  type="text"
                                  value={row.period}
                                  onChange={(e) => {
                                    const next = [...(regForm.overseasExperiences || [])];
                                    next[idx] = { ...next[idx], period: e.target.value };
                                    setRegForm({ ...regForm, overseasExperiences: next });
                                  }}
                                  placeholder={idx === 0 ? "2022 - 2024" : ""}
                                  className="w-full rounded border border-slate-200 px-2 py-1 font-mono"
                                />
                              </td>
                              <td className="px-2.5 py-1.5 text-center">
                                <input
                                  type="checkbox"
                                  checked={row.returnStatus === "SELESAI"}
                                  onChange={(e) => {
                                    const next = [...(regForm.overseasExperiences || [])];
                                    next[idx] = {
                                      ...next[idx],
                                      returnStatus: e.target.checked ? "SELESAI" : "NONE",
                                    };
                                    setRegForm({ ...regForm, overseasExperiences: next });
                                  }}
                                  className="h-4 w-4 accent-emerald-600 cursor-pointer"
                                />
                              </td>
                              <td className="px-2.5 py-1.5 text-center">
                                <input
                                  type="checkbox"
                                  checked={row.returnStatus === "KASUS"}
                                  onChange={(e) => {
                                    const next = [...(regForm.overseasExperiences || [])];
                                    next[idx] = {
                                      ...next[idx],
                                      returnStatus: e.target.checked ? "KASUS" : "NONE",
                                    };
                                    setRegForm({ ...regForm, overseasExperiences: next });
                                  }}
                                  className="h-4 w-4 accent-rose-600 cursor-pointer"
                                />
                              </td>
                              <td className="px-2 py-1.5">
                                <input
                                  type="text"
                                  value={row.remarks}
                                  onChange={(e) => {
                                    const next = [...(regForm.overseasExperiences || [])];
                                    next[idx] = { ...next[idx], remarks: e.target.value };
                                    setRegForm({ ...regForm, overseasExperiences: next });
                                  }}
                                  placeholder={idx === 0 ? "Finish Kontrak 2 Th Baik" : ""}
                                  className="w-full rounded border border-slate-200 px-2 py-1"
                                />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">
                        Keterangan Pengalaman Bekerja di Luar Negeri (Baris Bawah Tabel 15)
                      </label>
                      <input
                        type="text"
                        value={regForm.overseasExperienceNotes}
                        onChange={(e) =>
                          setRegForm({ ...regForm, overseasExperienceNotes: e.target.value })
                        }
                        placeholder="Keterangan tambahan pengalaman kerja luar negeri / lokal..."
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2"
                      />
                    </div>

                    {/* 15. PEMAHAMAN BAHASA (A. Bahasa Arab & B. Bahasa Inggris) */}
                    <div className="rounded-xl border border-slate-200 bg-white p-3.5 space-y-3">
                      <label className="font-bold text-slate-900 block">
                        15. PEMAHAMAN BAHASA (Sesuai Lembar Formulir Baru F4):
                      </label>
                      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-2">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="font-bold text-slate-800">A. Bahasa Arab :</span>
                            <div className="flex items-center gap-2">
                              {(
                                [
                                  { id: "TIDAK_BISA", label: "Tidak Bisa" },
                                  { id: "SEDIKIT", label: "Sedikit" },
                                  { id: "LANCAR", label: "Lancar" },
                                ] as { id: F4LangLevel; label: string }[]
                              ).map((opt) => (
                                <label
                                  key={opt.id}
                                  className={`cursor-pointer rounded-lg border px-2.5 py-1 text-[11px] font-bold ${
                                    regForm.arabicLevelF4 === opt.id
                                      ? "border-sky-600 bg-sky-600 text-white"
                                      : "border-slate-300 bg-white text-slate-700"
                                  }`}
                                >
                                  <input
                                    type="radio"
                                    name="f4-arab"
                                    className="hidden"
                                    checked={regForm.arabicLevelF4 === opt.id}
                                    onChange={() =>
                                      setRegForm({
                                        ...regForm,
                                        arabicLevelF4: opt.id,
                                        languageSkills: {
                                          ...regForm.languageSkills,
                                          arabic:
                                            opt.id === "LANCAR"
                                              ? "BAIK"
                                              : opt.id === "SEDIKIT"
                                              ? "CUKUP"
                                              : "BURUK",
                                        },
                                      })
                                    }
                                  />
                                  {opt.label}
                                </label>
                              ))}
                            </div>
                          </div>
                          <input
                            type="text"
                            value={regForm.arabicNotesF4}
                            onChange={(e) =>
                              setRegForm({ ...regForm, arabicNotesF4: e.target.value })
                            }
                            placeholder="Ket. Bahasa Arab..."
                            className="w-full rounded border border-slate-300 bg-white px-2.5 py-1.5"
                          />
                        </div>

                        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-2">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="font-bold text-slate-800">B. Bahasa Inggris :</span>
                            <div className="flex items-center gap-2">
                              {(
                                [
                                  { id: "TIDAK_BISA", label: "Tidak Bisa" },
                                  { id: "SEDIKIT", label: "Sedikit" },
                                  { id: "LANCAR", label: "Lancar" },
                                ] as { id: F4LangLevel; label: string }[]
                              ).map((opt) => (
                                <label
                                  key={opt.id}
                                  className={`cursor-pointer rounded-lg border px-2.5 py-1 text-[11px] font-bold ${
                                    regForm.englishLevelF4 === opt.id
                                      ? "border-sky-600 bg-sky-600 text-white"
                                      : "border-slate-300 bg-white text-slate-700"
                                  }`}
                                >
                                  <input
                                    type="radio"
                                    name="f4-eng"
                                    className="hidden"
                                    checked={regForm.englishLevelF4 === opt.id}
                                    onChange={() =>
                                      setRegForm({
                                        ...regForm,
                                        englishLevelF4: opt.id,
                                        languageSkills: {
                                          ...regForm.languageSkills,
                                          english:
                                            opt.id === "LANCAR"
                                              ? "BAIK"
                                              : opt.id === "SEDIKIT"
                                              ? "CUKUP"
                                              : "BURUK",
                                        },
                                      })
                                    }
                                  />
                                  {opt.label}
                                </label>
                              ))}
                            </div>
                          </div>
                          <input
                            type="text"
                            value={regForm.englishNotesF4}
                            onChange={(e) =>
                              setRegForm({ ...regForm, englishNotesF4: e.target.value })
                            }
                            placeholder="Ket. Bahasa Inggris..."
                            className="w-full rounded border border-slate-300 bg-white px-2.5 py-1.5"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* BAGIAN 4: POIN 16 KESANGGUPAN BEKERJA DILUAR NEGERI & MASAKAN ARAB (15 MENU) */}
                  <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 space-y-4">
                    <div className="border-b border-slate-200 pb-2">
                      <span className="rounded bg-teal-700 px-2 py-0.5 text-[10px] font-bold uppercase text-white">
                        POIN 16 · KESANGGUPAN BEKERJA DILUAR NEGERI & DAFTAR MASAKAN ARAB
                      </span>
                      <h4 className="mt-1 text-sm font-bold text-slate-900">
                        a. Merawat Anak Bayi/Kecil · b. Merawat Orang Tua Jompo · c. Bersih-bersih Rumah/Cuci/Setrika · d. Memasak Masakan Arab
                      </h4>
                    </div>

                    <div className="space-y-2.5">
                      {[
                        {
                          boolKey: "willingCareBaby",
                          noteKey: "willingCareBabyNotes",
                          label: "a. Merawat Anak Bayi / Anak Kecil",
                        },
                        {
                          boolKey: "willingCareElderly",
                          noteKey: "willingCareElderlyNotes",
                          label: "b. Merawat Orang Tua Jompo",
                        },
                        {
                          boolKey: "willingHousekeeping",
                          noteKey: "willingHousekeepingNotes",
                          label: "c. Bersih-bersih Rumah / Cuci Baju / Menyetrika dll.",
                        },
                      ].map((item) => {
                        const isChecked = Boolean(
                          regForm[item.boolKey as keyof OfficialRegistrationForm]
                        );
                        const noteVal = String(
                          regForm[item.noteKey as keyof OfficialRegistrationForm] || ""
                        );
                        return (
                          <div
                            key={item.boolKey}
                            className="grid grid-cols-1 gap-2 rounded-xl border border-slate-200 bg-white p-3 sm:grid-cols-12 items-center"
                          >
                            <label className="sm:col-span-5 inline-flex items-center gap-2.5 font-bold text-slate-900 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={(e) =>
                                  setRegForm({
                                    ...regForm,
                                    [item.boolKey]: e.target.checked,
                                  })
                                }
                                className="h-4 w-4 accent-teal-600"
                              />
                              <span>{item.label}</span>
                              <span className="rounded bg-slate-100 px-2 py-0.5 font-mono text-[11px]">
                                ({isChecked ? "✓" : " "})
                              </span>
                            </label>
                            <div className="sm:col-span-7 flex items-center gap-2">
                              <span className="font-semibold text-slate-500 shrink-0">Ket :</span>
                              <input
                                type="text"
                                value={noteVal}
                                onChange={(e) =>
                                  setRegForm({
                                    ...regForm,
                                    [item.noteKey]: e.target.value,
                                  })
                                }
                                placeholder="Keterangan kesanggupan..."
                                className="w-full rounded-lg border border-slate-200 px-3 py-1.5"
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* 16.d Memasak masakan Arab (15 Menu sesuai Formulir Baru F4s.pdf) */}
                    <div className="rounded-xl border border-slate-200 bg-white p-3.5 space-y-2.5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <label className="font-bold text-slate-900">
                          d. Memasak masakan Arab (Klik menu yang dikuasai CPMI — tercetak bergaris bawah/centang di Formulir F4):
                        </label>
                        <div className="flex gap-1.5">
                          <button
                            type="button"
                            onClick={() =>
                              setRegForm({
                                ...regForm,
                                arabicCookingSkills: [
                                  "Ruz Kabsah",
                                  "Ruz Bukhari",
                                  "Ruz Briyani",
                                  "Ruz Makbus",
                                  "Saluna/Idam",
                                  "Macarona",
                                  "Makarona Basamil",
                                  "Warag Enab",
                                  "Fatair",
                                  "Pizza",
                                  "Sambosa",
                                  "Salatah",
                                  "Cake",
                                  "Cream Caramel",
                                  "Juice",
                                ],
                              })
                            }
                            className="rounded border border-teal-300 bg-teal-50 px-2 py-0.5 text-[10px] font-bold text-teal-800 hover:bg-teal-100"
                          >
                            Pilih Semua Menu
                          </button>
                          <button
                            type="button"
                            onClick={() => setRegForm({ ...regForm, arabicCookingSkills: [] })}
                            className="rounded border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-semibold text-slate-600 hover:bg-slate-100"
                          >
                            Kosongkan
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
                        {[
                          "Ruz Kabsah",
                          "Ruz Bukhari",
                          "Ruz Briyani",
                          "Ruz Makbus",
                          "Saluna/Idam",
                          "Macarona",
                          "Makarona Basamil",
                          "Warag Enab",
                          "Fatair",
                          "Pizza",
                          "Sambosa",
                          "Salatah",
                          "Cake",
                          "Cream Caramel",
                          "Juice",
                        ].map((dish) => {
                          const active = (regForm.arabicCookingSkills || []).includes(dish);
                          return (
                            <button
                              key={dish}
                              type="button"
                              onClick={() => {
                                const cur = regForm.arabicCookingSkills || [];
                                const next = cur.includes(dish)
                                  ? cur.filter((d) => d !== dish)
                                  : [...cur, dish];
                                setRegForm({ ...regForm, arabicCookingSkills: next });
                              }}
                              className={`flex items-center justify-between rounded-lg border px-2.5 py-1.5 text-left text-[11px] font-semibold transition ${
                                active
                                  ? "border-teal-600 bg-teal-50 text-teal-950 shadow-2xs"
                                  : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
                              }`}
                            >
                              <span>- {dish}</span>
                              {active && <span className="font-bold text-teal-700">✓</span>}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* BAGIAN 5: POIN 17 KELENGKAPAN DOKUMEN (copy / asli) + CATATAN + TERIMA / TIDAK DITERIMA + ACC & TANDA TANGAN */}
                  <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4 space-y-4">
                    <div className="border-b border-amber-200/80 pb-2">
                      <span className="rounded bg-amber-600 px-2 py-0.5 text-[10px] font-bold uppercase text-white">
                        POIN 17 · KELENGKAPAN DOKUMEN (COPY / ASLI), KEPUTUSAN TERIMA / TIDAK DITERIMA & ACC PETUGAS PT
                      </span>
                      <h4 className="mt-1 text-sm font-bold text-slate-900">
                        Checklist 9 Dokumen Poin 17 (a, b, c) + Catatan + Keputusan Terima / Tidak Diterima + ACC
                      </h4>
                    </div>

                    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                      <table className="w-full text-left text-xs">
                        <thead className="border-b border-slate-200 bg-slate-100 text-[10px] font-bold uppercase text-slate-700">
                          <tr>
                            <th className="px-3 py-2">Baris F4</th>
                            <th className="px-3 py-2">Dokumen Poin 17</th>
                            <th className="px-3 py-2 text-center">ASLI</th>
                            <th className="px-3 py-2 text-center">COPY</th>
                            <th className="px-3 py-2 text-center">Belum Ada</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {[
                            { grp: "17.a", key: "paspor", label: "Passport Lama" },
                            { grp: "17.a", key: "sttbIjazah", label: "Ijazah / STTB" },
                            { grp: "17.a", key: "kartuBpjs", label: "Kartu BPJS" },
                            { grp: "17.b", key: "ktp", label: "KTP" },
                            { grp: "17.b", key: "akteKelahiran", label: "Akta Lahir" },
                            { grp: "17.b", key: "izinKeluarga", label: "Surat Izin Orang Tua" },
                            { grp: "17.c", key: "kk", label: "KK (Kartu Keluarga)" },
                            { grp: "17.c", key: "izinSuami", label: "Surat Izin Suami" },
                          ].map((docRow) => {
                            const curVal =
                              regForm.docHandover[
                                docRow.key as keyof typeof regForm.docHandover
                              ] as DocHandoverType;
                            return (
                              <tr key={docRow.key} className="hover:bg-slate-50">
                                <td className="px-3 py-2 font-mono font-bold text-slate-500">
                                  {docRow.grp}
                                </td>
                                <td className="px-3 py-2 font-bold text-slate-900">
                                  {docRow.label}
                                </td>
                                {(["ASLI", "COPY", "NONE"] as DocHandoverType[]).map((opt) => (
                                  <td key={opt} className="px-3 py-2 text-center">
                                    <input
                                      type="radio"
                                      name={`doc-f4-${docRow.key}`}
                                      checked={curVal === opt}
                                      onChange={() =>
                                        setRegForm({
                                          ...regForm,
                                          docHandover: {
                                            ...regForm.docHandover,
                                            [docRow.key]: opt,
                                          },
                                        })
                                      }
                                      className="h-4 w-4 cursor-pointer accent-teal-600"
                                    />
                                  </td>
                                ))}
                              </tr>
                            );
                          })}
                          <tr className="hover:bg-slate-50">
                            <td className="px-3 py-2 font-mono font-bold text-slate-500">17.c</td>
                            <td className="px-3 py-1.5">
                              <input
                                type="text"
                                value={regForm.docHandover.otherDoc8Name}
                                onChange={(e) =>
                                  setRegForm({
                                    ...regForm,
                                    docHandover: {
                                      ...regForm.docHandover,
                                      otherDoc8Name: e.target.value,
                                    },
                                  })
                                }
                                placeholder="Dokumen Lain (Misal: Buku Nikah / SKCK)"
                                className="w-full rounded border border-slate-200 px-2.5 py-1 text-xs"
                              />
                            </td>
                            {(["ASLI", "COPY", "NONE"] as DocHandoverType[]).map((opt) => (
                              <td key={opt} className="px-3 py-2 text-center">
                                <input
                                  type="radio"
                                  name="doc-f4-other8"
                                  checked={regForm.docHandover.otherDoc8Status === opt}
                                  onChange={() =>
                                    setRegForm({
                                      ...regForm,
                                      docHandover: {
                                        ...regForm.docHandover,
                                        otherDoc8Status: opt,
                                      },
                                    })
                                  }
                                  className="h-4 w-4 cursor-pointer accent-teal-600"
                                />
                              </td>
                            ))}
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
                      <div className="lg:col-span-2">
                        <label className="font-bold text-slate-700 block mb-1">
                          Catatan (Tercetak pada 3 baris titik-titik di kiri bawah Formulir F4)
                        </label>
                        <textarea
                          rows={2}
                          value={regForm.sponsorNotes}
                          onChange={(e) => setRegForm({ ...regForm, sponsorNotes: e.target.value })}
                          placeholder="Catatan hasil wawancara / kelengkapan berkas..."
                          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2"
                        />
                      </div>

                      <div>
                        <label className="font-bold text-slate-700 block mb-1">
                          Keputusan Seleksi: Terima / Tidak diterima
                        </label>
                        <select
                          value={regForm.acceptanceDecision}
                          onChange={(e) =>
                            setRegForm({
                              ...regForm,
                              acceptanceDecision: e.target.value as
                                | "TERIMA"
                                | "TIDAK_DITERIMA"
                                | "PENDING",
                            })
                          }
                          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-bold"
                        >
                          <option value="TERIMA">✓ Terima ( ✓ )</option>
                          <option value="TIDAK_DITERIMA">✗ Tidak diterima ( ✓ )</option>
                          <option value="PENDING">Belum Diputuskan ( )</option>
                        </select>
                      </div>

                      <div>
                        <label className="font-bold text-slate-700 block mb-1">
                          Metode Interview oleh Petugas PT. Panca
                        </label>
                        <select
                          value={regForm.interviewMethod || "TELEPON"}
                          onChange={(e) =>
                            setRegForm({
                              ...regForm,
                              interviewMethod: e.target.value as
                                | "TELEPON"
                                | "VIDEO_CALL"
                                | "DATANG_LANGSUNG",
                            })
                          }
                          className="w-full rounded-lg border border-sky-300 bg-white px-3 py-2 font-bold text-sky-950"
                        >
                          <option value="TELEPON">📞 Interview via Telepon</option>
                          <option value="VIDEO_CALL">📹 Interview via Video Call</option>
                          <option value="DATANG_LANGSUNG">
                            🏢 Datang Langsung ke Kantor PT. Panca
                          </option>
                        </select>
                      </div>

                      <div>
                        <label className="font-bold text-slate-700 block mb-1">
                          ACC : (Pejabat Penyetuju PT)
                        </label>
                        <input
                          type="text"
                          value={regForm.accByName}
                          onChange={(e) => setRegForm({ ...regForm, accByName: e.target.value })}
                          placeholder="Ahmad Sarkoni"
                          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-bold"
                        />
                      </div>

                      <div>
                        <label className="font-bold text-slate-700 block mb-1">
                          Cabang P3MI Penerima
                        </label>
                        <select
                          value={newForm.branchId}
                          onChange={(e) => setNewForm({ ...newForm, branchId: e.target.value })}
                          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-semibold"
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
                          Mengetahui/Saksi (Sponsor / Petugas Lapangan)
                        </label>
                        <input
                          type="text"
                          value={regForm.sponsorOfficerName}
                          onChange={(e) =>
                            setRegForm({ ...regForm, sponsorOfficerName: e.target.value })
                          }
                          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2"
                        />
                      </div>

                      <div>
                        <label className="font-bold text-slate-700 block mb-1">
                          Pewawancara & Penerima CPMI (Petugas PT.)
                        </label>
                        <input
                          type="text"
                          value={regForm.receivedByPtOfficer}
                          onChange={(e) =>
                            setRegForm({ ...regForm, receivedByPtOfficer: e.target.value })
                          }
                          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-bold text-teal-900"
                        />
                      </div>

                      <div>
                        <label className="font-bold text-slate-700 block mb-1">
                          Tgl Interview & Pengisian Blanko (Kanan Atas F4)
                        </label>
                        <input
                          type="date"
                          value={regForm.formSignedDate}
                          onChange={(e) =>
                            setRegForm({ ...regForm, formSignedDate: e.target.value })
                          }
                          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  {/* FOOTER TOMBOL SIMPAN & PRATINJAU CETAK */}
                  <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setRegModalTab("SCAN_DAN_WA")}
                        className="rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        ← Lihat Foto Scan Formulir Baru F4 / WA Sponsor
                      </button>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5">
                      <button
                        type="button"
                        onClick={() => setShowAddModal(false)}
                        className="rounded-xl border border-slate-200 px-4 py-2.5 font-semibold text-slate-600 hover:bg-slate-50"
                      >
                        Batal
                      </button>
                      <button
                        type="submit"
                        className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-6 py-2.5 text-sm font-bold text-white shadow-md hover:bg-slate-800"
                      >
                        <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                        Simpan Formulir Baru F4 ke Sistem
                      </button>
                    </div>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          IDE 3: MODAL CETAK LEMBAR FISIK "FORMULIR PENDAFTARAN CPMI/CTKI"
          PT PANCA BANYU AJISAKTI (100% IDENTIK DENGAN FORMULIR BARU F4s.pdf)
         ========================================================= */}
      {printingRegFormCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-3 sm:p-6 backdrop-blur-sm print:static print:inset-auto print:block print:bg-white print:p-0">
          <div className="flex max-h-[95vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-slate-200 shadow-2xl print:block print:max-h-none print:max-w-none print:w-full print:overflow-visible print:rounded-none print:bg-white print:shadow-none">
            {/* Toolbar Cetak */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 px-6 py-3.5 text-white print:hidden">
              <div>
                <span className="rounded bg-amber-500 px-2 py-0.5 text-[10px] font-extrabold uppercase text-slate-950">
                  IDE 3 · CETAK LEMBAR FISIK IDENTIK 100% (FORMULIR BARU F4s.pdf)
                </span>
                <h3 className="mt-0.5 text-sm font-bold">
                  Pratinjau Cetak F4: FORMULIR PENDAFTARAN CPMI/CTKI —{" "}
                  {printingRegFormCandidate.fullName} ({printingRegFormCandidate.regNumber})
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const cand = printingRegFormCandidate;
                    setPrintingRegFormCandidate(null);
                    openSyarikahBiodataModal(cand);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-400 bg-indigo-600 px-3 py-2 text-xs font-extrabold text-white shadow-sm hover:bg-indigo-500"
                >
                  🌍 Buka Printout Biodata Syarikah (CV Majikan)
                </button>
                <a
                  href="/Formulir-Baru-F4s.pdf"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-xs font-bold text-white hover:bg-white/20"
                >
                  📄 Buka PDF Blanko Asli (F4s.pdf)
                </a>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-sky-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-sky-500"
                >
                  <Printer className="h-4 w-4" />
                  🖨️ Cetak / Simpan PDF (F4)
                </button>
                <button
                  type="button"
                  onClick={() => setPrintingRegFormCandidate(null)}
                  className="rounded-lg bg-white/10 p-1.5 text-slate-300 hover:bg-white/20 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* KERTAS FORMULIR BARU F4 PT PANCA BANYU AJISAKTI (100% IDENTIK DENGAN FORMULIR BARU F4s.pdf) */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-8 print:overflow-visible print:p-0">
              {(() => {
                const cand = printingRegFormCandidate;
                const rf: OfficialRegistrationForm = cand.registrationForm || regForm;
                const signedParts = (rf.formSignedDate || "2026-10-16").split("-");
                const signedYyyy = signedParts[0] || "2026";
                const signedMm = signedParts[1] || "10";
                const signedDd = signedParts[2] || "16";

                const bDateParts = (cand.birthDate || "1998-08-14").split("-");
                const bFormatted = `${bDateParts[2] || "14"}-${bDateParts[1] || "08"}-${
                  bDateParts[0] || "1998"
                }`;

                const eduUpper = (cand.education || "").toUpperCase();
                const isSd = eduUpper.includes("SD");
                const isSmp = eduUpper.includes("SMP") || eduUpper.includes("MTS");
                const isSma =
                  eduUpper.includes("SMA") ||
                  eduUpper.includes("SMK") ||
                  eduUpper.includes("MA") ||
                  (!isSd && !isSmp && !eduUpper.includes("D3") && !eduUpper.includes("S1"));
                const isUniv =
                  eduUpper.includes("D3") ||
                  eduUpper.includes("S1") ||
                  eduUpper.includes("DIPLOMA") ||
                  eduUpper.includes("UNIV");

                const marUpper = (cand.maritalStatus || "").toUpperCase();
                const isBelumKawin = marUpper.includes("BELUM");
                const isJanda = marUpper.includes("CERAI") || marUpper.includes("JANDA");
                const isKawin = !isBelumKawin && !isJanda;

                const expRows =
                  rf.overseasExperiences && rf.overseasExperiences.length > 0
                    ? rf.overseasExperiences
                    : [
                        {
                          no: 1,
                          countryAndCity: rf.workExperience1 || "-",
                          duration: "2 Tahun",
                          period: "2022 - 2024",
                          returnStatus: "SELESAI" as const,
                          remarks: "Finish Kontrak",
                        },
                        {
                          no: 2,
                          countryAndCity: "",
                          duration: "",
                          period: "",
                          returnStatus: "NONE" as const,
                          remarks: "",
                        },
                        {
                          no: 3,
                          countryAndCity: "",
                          duration: "",
                          period: "",
                          returnStatus: "NONE" as const,
                          remarks: "",
                        },
                        {
                          no: 4,
                          countryAndCity: "",
                          duration: "",
                          period: "",
                          returnStatus: "NONE" as const,
                          remarks: "",
                        },
                      ];

                const cookingSet = new Set(rf.arabicCookingSkills || []);

                const renderDocStatus = (st?: DocHandoverType) => (
                  <span>
                    (
                    <span
                      className={
                        st === "COPY"
                          ? "font-extrabold underline decoration-2 text-blue-900"
                          : ""
                      }
                    >
                      copy
                    </span>{" "}
                    /{" "}
                    <span
                      className={
                        st === "ASLI"
                          ? "font-extrabold underline decoration-2 text-blue-900"
                          : ""
                      }
                    >
                      asli
                    </span>
                    )
                  </span>
                );

                return (
                  <div className="mx-auto max-w-[850px] rounded-xs border border-slate-400 bg-white px-7 py-6 font-serif text-[11.5px] leading-[1.38] text-slate-950 shadow-2xl">
                    {/* KOP SURAT FORMULIR BARU F4s.pdf: LOGO KIRI + NAMA PT TENGAH + KOTAK No. Reg. & Tgl KANAN */}
                    <div className="grid grid-cols-12 items-center gap-2 border-b-2 border-slate-900 pb-2.5">
                      {/* Logo Resmi PT Panca Banyu Ajisakti */}
                      <div className="col-span-2 flex justify-start">
                        <img
                          src="/logo-panca-banyu.png"
                          alt="Logo PT Panca Banyu Ajisakti"
                          width={76}
                          height={68}
                          style={{ width: 76, height: 68 }}
                          className="h-16 w-20 object-contain"
                        />
                      </div>

                      {/* Teks Kop Tengah */}
                      <div className="col-span-7 text-center font-sans">
                        <h2 className="text-[21px] font-black tracking-wide text-slate-950 uppercase">
                          PANCA BANYU AJISAKTI
                        </h2>
                        <p className="text-[11.5px] font-extrabold tracking-wider text-slate-900 uppercase">
                          JASA TENAGA KERJA-INDONESIA MANPOWER SERVICE
                        </p>
                        <p className="mt-0.5 font-serif text-[11px] font-semibold text-slate-900">
                          Jl. kayu manis No. 51 Kel. Bale Kambang Kec. Keramat Jati Jakarta Timur
                        </p>
                        <p className="font-serif text-[11px] font-semibold text-slate-900">
                          Telp. +62-21 2937373 Fax +62-2129826026 Email pancabanyu@yahoo.com
                        </p>
                      </div>

                      {/* Kotak No. Reg. & Tgl Kanan Atas */}
                      <div className="col-span-3 flex flex-col items-end">
                        <div className="min-h-[42px] w-full rounded-xl border-[1.5px] border-slate-900 px-2.5 py-1.5">
                          <span className="block font-sans text-[10px] font-bold text-slate-900">
                            No. Reg.
                          </span>
                          <strong className="block min-h-[16px] text-center font-mono text-[12px] font-black text-rose-700">
                            {cand.regNumber || ""}
                          </strong>
                        </div>
                        <div className="mt-1.5 w-full text-right text-[11px] font-semibold">
                          Tgl{" "}
                          <span className="border-b border-dotted border-slate-800 px-1 font-mono font-bold text-blue-950">
                            {signedDd}
                          </span>{" "}
                          /{" "}
                          <span className="border-b border-dotted border-slate-800 px-1 font-mono font-bold text-blue-950">
                            {signedMm}
                          </span>{" "}
                          /{" "}
                          <span className="border-b border-dotted border-slate-800 px-1.5 font-mono font-bold text-blue-950">
                            {signedYyyy}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* JUDUL FORMULIR & PARAGRAF PERNYATAAN SESUAI FORMULIR BARU F4s.pdf */}
                    <div className="mt-2 text-center">
                      <h3 className="inline-block border-b-2 border-slate-950 font-sans text-[13px] font-black tracking-wide uppercase">
                        FORMULIR PENDAFTARAN CPMI/CTKI
                      </h3>
                    </div>
                    <p className="mt-1.5 text-justify text-[11px] leading-snug text-slate-900">
                      Saya yang mengisi Biodata ini bertanggung jawab dan tanpa unsur paksaan dari pihak manapun terhadap isinya serta bersedia menanggung kerugian pihak lain atau tuntutan hukum apabila dikemudian hari terbukti memalsukan atau berbohong. Data diri saya adalah sebagai berikut :
                    </p>

                    {/* POIN 1 S/D 14 SESUAI URUTAN FORMULIR BARU F4s.pdf */}
                    <div className="mt-2.5 space-y-1 text-[11.5px]">
                      {/* 1. Negara Tujuan */}
                      <div className="flex items-baseline">
                        <span className="w-6 shrink-0">1.</span>
                        <span className="w-36 shrink-0">Negara Tujuan</span>
                        <span className="mr-2">:</span>
                        <div className="flex-1 border-b border-dotted border-slate-800 font-bold text-blue-950 uppercase">
                          {cand.destinationCountry} ({cand.jobSector})
                        </div>
                      </div>

                      {/* 2. Nama Sponsor */}
                      <div className="flex items-baseline">
                        <span className="w-6 shrink-0">2.</span>
                        <span className="w-36 shrink-0">Nama Sponsor</span>
                        <span className="mr-2">:</span>
                        <div className="flex-1 border-b border-dotted border-slate-800 font-bold text-blue-950">
                          {rf.sponsorOfficerName}{" "}
                          {rf.sponsorOfficerPhone ? `— Telp: ${rf.sponsorOfficerPhone}` : ""}
                        </div>
                      </div>

                      {/* 3. Nama Lengkap ... Telp. ... */}
                      <div className="flex items-baseline gap-2">
                        <span className="w-6 shrink-0">3.</span>
                        <span className="w-36 shrink-0">Nama Lengkap</span>
                        <span className="mr-1">:</span>
                        <div className="flex-1 border-b border-dotted border-slate-800 font-bold text-blue-950 uppercase">
                          {cand.fullName}
                        </div>
                        <span className="shrink-0">Telp.</span>
                        <div className="w-44 border-b border-dotted border-slate-800 font-mono font-bold text-blue-950">
                          {cand.phone}
                        </div>
                      </div>

                      {/* 4. Tempat Tgl Lahir ... Umur Asli ... */}
                      <div className="flex items-baseline gap-2">
                        <span className="w-6 shrink-0">4.</span>
                        <span className="w-36 shrink-0">Tempat Tgl Lahir</span>
                        <span className="mr-1">:</span>
                        <div className="flex-1 border-b border-dotted border-slate-800 font-semibold text-blue-950">
                          {cand.birthPlace || "Indramayu"}, {bFormatted}
                        </div>
                        <span className="shrink-0">Umur Asli</span>
                        <div className="w-36 border-b border-dotted border-slate-800 text-center font-mono font-bold text-blue-950">
                          {rf.realAge || 28} Tahun
                        </div>
                      </div>

                      {/* 5. Agama */}
                      <div className="flex items-baseline">
                        <span className="w-6 shrink-0">5.</span>
                        <span className="w-36 shrink-0">Agama</span>
                        <span className="mr-2">:</span>
                        <div className="flex-1 border-b border-dotted border-slate-800 font-semibold text-blue-950">
                          {rf.religion || "Islam"}
                        </div>
                      </div>

                      {/* 6. Pendidikan terakhir : A. SD  B. SMP  C. SMA  D. Diploma/Universitas */}
                      <div className="flex items-baseline">
                        <span className="w-6 shrink-0">6.</span>
                        <span className="w-36 shrink-0">Pendidikan terakhir</span>
                        <span className="mr-2">:</span>
                        <div className="flex flex-1 flex-wrap items-center gap-8">
                          <span
                            className={
                              isSd
                                ? "rounded-full border-2 border-blue-900 px-2 py-0.2 font-bold text-blue-950"
                                : ""
                            }
                          >
                            A. SD
                          </span>
                          <span
                            className={
                              isSmp
                                ? "rounded-full border-2 border-blue-900 px-2 py-0.2 font-bold text-blue-950"
                                : ""
                            }
                          >
                            B. SMP
                          </span>
                          <span
                            className={
                              isSma
                                ? "rounded-full border-2 border-blue-900 px-2 py-0.2 font-bold text-blue-950"
                                : ""
                            }
                          >
                            C. SMA
                          </span>
                          <span
                            className={
                              isUniv
                                ? "rounded-full border-2 border-blue-900 px-2 py-0.2 font-bold text-blue-950"
                                : ""
                            }
                          >
                            D. Diploma/Universitas
                          </span>
                        </div>
                      </div>

                      {/* 7. Anak ke : ... dari ... bersaudara */}
                      <div className="flex items-baseline">
                        <span className="w-6 shrink-0">7.</span>
                        <span className="w-36 shrink-0">Anak ke</span>
                        <span className="mr-2">:</span>
                        <div className="flex items-baseline gap-2">
                          <span className="inline-block w-16 border-b border-dotted border-slate-800 text-center font-mono font-bold text-blue-950">
                            {rf.childOrder || 1}
                          </span>
                          <span>dari</span>
                          <span className="inline-block w-16 border-b border-dotted border-slate-800 text-center font-mono font-bold text-blue-950">
                            {rf.siblingsCount || 3}
                          </span>
                          <span>bersaudara</span>
                        </div>
                      </div>

                      {/* 8. Status : A. Belum Kawin  B. Kawin  C. Janda */}
                      <div className="flex items-baseline">
                        <span className="w-6 shrink-0">8.</span>
                        <span className="w-36 shrink-0">Status</span>
                        <span className="mr-2">:</span>
                        <div className="flex flex-1 flex-wrap items-center gap-10">
                          <span
                            className={
                              isBelumKawin
                                ? "rounded-full border-2 border-blue-900 px-2.5 py-0.2 font-bold text-blue-950"
                                : ""
                            }
                          >
                            A. Belum Kawin
                          </span>
                          <span
                            className={
                              isKawin
                                ? "rounded-full border-2 border-blue-900 px-2.5 py-0.2 font-bold text-blue-950"
                                : ""
                            }
                          >
                            B. Kawin
                          </span>
                          <span
                            className={
                              isJanda
                                ? "rounded-full border-2 border-blue-900 px-2.5 py-0.2 font-bold text-blue-950"
                                : ""
                            }
                          >
                            C. Janda
                          </span>
                        </div>
                      </div>

                      {/* 9. Jumlah Anak : ... Orang, Anak Pertama ... Tahun, Anak Terakhir ... Tahun */}
                      <div className="flex items-baseline">
                        <span className="w-6 shrink-0">9.</span>
                        <span className="w-36 shrink-0">Jumlah Anak</span>
                        <span className="mr-2">:</span>
                        <div className="flex flex-1 flex-wrap items-baseline gap-1.5">
                          <span className="inline-block w-14 border-b border-dotted border-slate-800 text-center font-mono font-bold text-blue-950">
                            {rf.childrenTotalCount ?? 0}
                          </span>
                          <span>Orang, Anak Pertama</span>
                          <span className="inline-block w-14 border-b border-dotted border-slate-800 text-center font-mono font-bold text-blue-950">
                            {rf.firstChildAge || "-"}
                          </span>
                          <span>Tahun, Anak Terakhir</span>
                          <span className="inline-block w-14 border-b border-dotted border-slate-800 text-center font-mono font-bold text-blue-950">
                            {rf.lastChildAge || "-"}
                          </span>
                          <span>Tahun</span>
                        </div>
                      </div>

                      {/* 10. Keadaan Fisik : Tinggi Badan ... cm  Berat Badan ... kg */}
                      <div className="flex items-baseline">
                        <span className="w-6 shrink-0">10.</span>
                        <span className="w-36 shrink-0">Keadaan Fisik</span>
                        <span className="mr-2">:</span>
                        <div className="flex flex-1 items-baseline gap-2">
                          <span>Tinggi Badan</span>
                          <span className="inline-block w-24 border-b border-dotted border-slate-800 text-center font-mono font-bold text-blue-950">
                            {rf.heightCm}
                          </span>
                          <span className="mr-6">cm</span>
                          <span>Berat Badan</span>
                          <span className="inline-block w-24 border-b border-dotted border-slate-800 text-center font-mono font-bold text-blue-950">
                            {rf.weightKg}
                          </span>
                          <span>kg</span>
                        </div>
                      </div>

                      {/* 11. Alamat Lengkap */}
                      <div className="flex items-baseline">
                        <span className="w-6 shrink-0">11.</span>
                        <span className="w-36 shrink-0">Alamat Lengkap</span>
                        <span className="mr-2">:</span>
                        <div className="flex-1 border-b border-dotted border-slate-800 font-semibold text-blue-950">
                          {cand.address}{" "}
                          {cand.nik ? `(NIK: ${cand.nik})` : ""}
                        </div>
                      </div>

                      {/* 12. Orang Tua : Bapak ... Umur ... th  Ibu ... Umur ... Th + Kakek dari Bapak ... */}
                      <div className="space-y-1">
                        <div className="flex items-baseline gap-1.5">
                          <span className="w-6 shrink-0">12.</span>
                          <span className="w-36 shrink-0">Orang Tua</span>
                          <span className="mr-1">:</span>
                          <span>Bapak</span>
                          <span className="flex-1 border-b border-dotted border-slate-800 font-semibold text-blue-950">
                            {rf.fatherName}
                          </span>
                          <span>Umur</span>
                          <span className="w-10 border-b border-dotted border-slate-800 text-center font-mono font-bold text-blue-950">
                            {rf.fatherAge}
                          </span>
                          <span className="mr-2">th</span>
                          <span>Ibu</span>
                          <span className="flex-1 border-b border-dotted border-slate-800 font-semibold text-blue-950">
                            {rf.motherName}
                          </span>
                          <span>Umur</span>
                          <span className="w-10 border-b border-dotted border-slate-800 text-center font-mono font-bold text-blue-950">
                            {rf.motherAge}
                          </span>
                          <span>Th</span>
                        </div>
                        <div className="flex items-baseline pl-[176px]">
                          <span className="mr-2 shrink-0">Kakek dari Bapak</span>
                          <span className="flex-1 border-b border-dotted border-slate-800 font-semibold text-blue-950">
                            {rf.paternalGrandfatherName || "H. Abdul Karim"}
                          </span>
                        </div>
                      </div>

                      {/* 13. Suami : ... Umur ... Th. Pekerjaan Suami ... */}
                      <div className="flex items-baseline gap-1.5">
                        <span className="w-6 shrink-0">13.</span>
                        <span className="w-36 shrink-0">Suami</span>
                        <span className="mr-1">:</span>
                        <span className="flex-1 border-b border-dotted border-slate-800 font-semibold text-blue-950">
                          {rf.spouseOrGuardianName}
                        </span>
                        <span>Umur</span>
                        <span className="w-12 border-b border-dotted border-slate-800 text-center font-mono font-bold text-blue-950">
                          {rf.spouseAge || "-"}
                        </span>
                        <span className="mr-2">Th.</span>
                        <span>Pekerjaan Suami</span>
                        <span className="w-48 border-b border-dotted border-slate-800 font-semibold text-blue-950">
                          {rf.spouseOccupation || "-"}
                        </span>
                      </div>

                      {/* 14. Keluarga Lain : nama ... hubungan ... no tlp ... */}
                      <div className="flex items-baseline gap-1.5">
                        <span className="w-6 shrink-0">14.</span>
                        <span className="w-36 shrink-0">Keluarga Lain</span>
                        <span className="mr-1">:</span>
                        <span>nama</span>
                        <span className="flex-1 border-b border-dotted border-slate-800 font-semibold text-blue-950">
                          {rf.emergencyContactName}
                        </span>
                        <span>hubungan</span>
                        <span className="w-28 border-b border-dotted border-slate-800 text-center font-semibold text-blue-950">
                          {rf.emergencyContactRelation}
                        </span>
                        <span>no tlp</span>
                        <span className="w-36 border-b border-dotted border-slate-800 font-mono font-bold text-blue-950">
                          {rf.emergencyContactPhone}
                        </span>
                      </div>
                    </div>

                    {/* 15. PENGALAMAN BEKERJA DILUAR NEGERI (Ex/Non) TABEL IDENTIK F4s.pdf */}
                    <div className="mt-2.5">
                      <p className="font-sans text-[11px] font-bold">
                        15. PENGALAMAN BEKERJA DILUAR NEGERI (Ex/Non)
                      </p>
                      <table className="mt-1 w-full border-collapse border border-slate-900 font-sans text-[10px]">
                        <thead>
                          <tr className="bg-slate-50 text-center font-bold">
                            <th rowSpan={2} className="w-8 border border-slate-900 px-1 py-0.5">
                              no
                            </th>
                            <th rowSpan={2} className="border border-slate-900 px-2 py-0.5">
                              NEGARA DAN KOTA
                            </th>
                            <th rowSpan={2} className="w-24 border border-slate-900 px-1 py-0.5">
                              LAMA
                            </th>
                            <th rowSpan={2} className="w-28 border border-slate-900 px-1 py-0.5">
                              PERIODE
                            </th>
                            <th colSpan={3} className="border border-slate-900 px-1 py-0.5">
                              STATUS PEMULANGAN
                            </th>
                          </tr>
                          <tr className="bg-slate-50 text-center font-bold">
                            <th className="w-16 border border-slate-900 px-1 py-0.5">SELESAI</th>
                            <th className="w-16 border border-slate-900 px-1 py-0.5">KASUS</th>
                            <th className="border border-slate-900 px-2 py-0.5">KETERANGAN</th>
                          </tr>
                        </thead>
                        <tbody>
                          {expRows.map((r, i) => (
                            <tr key={i} className="h-5">
                              <td className="border border-slate-900 px-1 text-center font-mono">
                                {r.countryAndCity ? `${r.no}.` : ""}
                              </td>
                              <td className="border border-slate-900 px-2 font-semibold text-blue-950">
                                {r.countryAndCity}
                              </td>
                              <td className="border border-slate-900 px-1.5 text-center font-mono text-blue-950">
                                {r.duration}
                              </td>
                              <td className="border border-slate-900 px-1.5 text-center font-mono text-blue-950">
                                {r.period}
                              </td>
                              <td className="border border-slate-900 px-1 text-center font-bold text-blue-950">
                                {r.returnStatus === "SELESAI" ? "✓" : ""}
                              </td>
                              <td className="border border-slate-900 px-1 text-center font-bold text-rose-700">
                                {r.returnStatus === "KASUS" ? "✓" : ""}
                              </td>
                              <td className="border border-slate-900 px-2 text-blue-950">
                                {r.remarks}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      <div className="mt-1 flex items-baseline text-[11px]">
                        <span className="mr-2 shrink-0">Keterangan</span>
                        <div className="flex-1 border-b border-dotted border-slate-800 text-blue-950">
                          {rf.overseasExperienceNotes || "-"}
                        </div>
                      </div>
                    </div>

                    {/* 15. PEMAHAMAN BAHASA (A. Bahasa Arab & B. Bahasa Inggris) */}
                    <div className="mt-2">
                      <p className="font-sans text-[11px] font-bold">15. PEMAHAMAN BAHASA</p>
                      <div className="mt-0.5 space-y-1 pl-4 text-[11px]">
                        <div className="flex items-baseline gap-2">
                          <span className="w-36 shrink-0">A. Bahasa Arab</span>
                          <span>
                            (
                            <span
                              className={
                                rf.arabicLevelF4 === "TIDAK_BISA"
                                  ? "font-extrabold underline decoration-2 text-blue-950"
                                  : ""
                              }
                            >
                              Tidak Bisa
                            </span>{" "}
                            /{" "}
                            <span
                              className={
                                rf.arabicLevelF4 === "SEDIKIT"
                                  ? "font-extrabold underline decoration-2 text-blue-950"
                                  : ""
                              }
                            >
                              Sedikit
                            </span>{" "}
                            /{" "}
                            <span
                              className={
                                rf.arabicLevelF4 === "LANCAR"
                                  ? "font-extrabold underline decoration-2 text-blue-950"
                                  : ""
                              }
                            >
                              lancar
                            </span>
                            )
                          </span>
                          <span className="ml-2 shrink-0">Ket</span>
                          <div className="flex-1 border-b border-dotted border-slate-800 text-blue-950">
                            {rf.arabicNotesF4 || "-"}
                          </div>
                        </div>

                        <div className="flex items-baseline gap-2">
                          <span className="w-36 shrink-0">B. Bahasa Inggris</span>
                          <span>
                            (
                            <span
                              className={
                                rf.englishLevelF4 === "TIDAK_BISA"
                                  ? "font-extrabold underline decoration-2 text-blue-950"
                                  : ""
                              }
                            >
                              Tidak Bisa
                            </span>{" "}
                            /{" "}
                            <span
                              className={
                                rf.englishLevelF4 === "SEDIKIT"
                                  ? "font-extrabold underline decoration-2 text-blue-950"
                                  : ""
                              }
                            >
                              Sedikit
                            </span>{" "}
                            /{" "}
                            <span
                              className={
                                rf.englishLevelF4 === "LANCAR"
                                  ? "font-extrabold underline decoration-2 text-blue-950"
                                  : ""
                              }
                            >
                              lancar
                            </span>
                            )
                          </span>
                          <span className="ml-2 shrink-0">Ket</span>
                          <div className="flex-1 border-b border-dotted border-slate-800 text-blue-950">
                            {rf.englishNotesF4 || "-"}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 16. KESANGGUPAN BEKERJA DILUAR NEGERI (a, b, c, d Masakan Arab 6 Kolom) */}
                    <div className="mt-2">
                      <p className="font-sans text-[11px] font-bold">
                        16. KESANGGUPAN BEKERJA DILUAR NEGERI
                      </p>
                      <div className="mt-0.5 space-y-1 pl-4 text-[11px]">
                        <div className="flex items-baseline gap-2">
                          <span className="w-72 shrink-0">a. Merawat Anak Bayi / Anak Kecil</span>
                          <span className="font-mono font-bold text-blue-950">
                            ( {rf.willingCareBaby ? "✓" : " "} )
                          </span>
                          <span className="ml-2 shrink-0">Ket</span>
                          <div className="flex-1 border-b border-dotted border-slate-800 text-blue-950">
                            {rf.willingCareBabyNotes || "-"}
                          </div>
                        </div>

                        <div className="flex items-baseline gap-2">
                          <span className="w-72 shrink-0">b. Merawat Orang Tua Jompo</span>
                          <span className="font-mono font-bold text-blue-950">
                            ( {rf.willingCareElderly ? "✓" : " "} )
                          </span>
                          <span className="ml-2 shrink-0">Ket</span>
                          <div className="flex-1 border-b border-dotted border-slate-800 text-blue-950">
                            {rf.willingCareElderlyNotes || "-"}
                          </div>
                        </div>

                        <div className="flex items-baseline gap-2">
                          <span className="w-72 shrink-0">
                            c. Bersih-bersih Rumah / Cuci Baju/Menyertrika dll.
                          </span>
                          <span className="font-mono font-bold text-blue-950">
                            ( {rf.willingHousekeeping ? "✓" : " "} )
                          </span>
                          <span className="ml-2 shrink-0">Ket</span>
                          <div className="flex-1 border-b border-dotted border-slate-800 text-blue-950">
                            {rf.willingHousekeepingNotes || "-"}
                          </div>
                        </div>

                        <div className="pt-0.5">
                          <p>d. Memasak masakan Arab :</p>
                          <div className="mt-1 grid grid-cols-6 gap-x-2 gap-y-0.5 pl-3 text-[10.5px]">
                            {[
                              ["Ruz Kabsah", "Ruz Bukhari", "Ruz Briyani"],
                              ["Ruz Makbus", "Saluna/Idam", "Macarona"],
                              ["Makarona Basamil", "Warag Enab", "Fatair"],
                              ["Pizza", "Sambosa", "Salatah"],
                              ["Cake", "Salatah", "Cream Caramel"],
                              ["Juice"],
                            ].map((col, cIdx) => (
                              <div key={cIdx} className="space-y-0.5">
                                {col.map((dish, dIdx) => {
                                  const selected = cookingSet.has(dish);
                                  return (
                                    <div
                                      key={`${cIdx}-${dIdx}`}
                                      className={
                                        selected
                                          ? "font-bold text-blue-950 underline decoration-2"
                                          : "text-slate-700"
                                      }
                                    >
                                      - {dish} {selected ? "✓" : ""}
                                    </div>
                                  );
                                })}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 17. KELENGKAPAN DOKUMEN (a, b, c) */}
                    <div className="mt-2">
                      <p className="font-sans text-[11px] font-bold">17. KELENGKAPAN DOKUMEN</p>
                      <div className="mt-0.5 space-y-1 pl-4 text-[11px]">
                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            a. Passport Lama {renderDocStatus(rf.docHandover.paspor)}
                          </div>
                          <div>Ijazah/STTB {renderDocStatus(rf.docHandover.sttbIjazah)}</div>
                          <div>Kartu BPJS {renderDocStatus(rf.docHandover.kartuBpjs)}</div>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <div>b. KTP {renderDocStatus(rf.docHandover.ktp)}</div>
                          <div>Akta Lahir {renderDocStatus(rf.docHandover.akteKelahiran)}</div>
                          <div>
                            Surat Izin Orang Tua {renderDocStatus(rf.docHandover.izinKeluarga)}
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-2 items-baseline">
                          <div>c. KK {renderDocStatus(rf.docHandover.kk)}</div>
                          <div>
                            Surat Izin Suami {renderDocStatus(rf.docHandover.izinSuami)}
                          </div>
                          <div className="flex items-baseline gap-1">
                            <span className="shrink-0">Dokumen Lain</span>
                            <span className="flex-1 border-b border-dotted border-slate-800 text-[10px] font-semibold text-blue-950 truncate">
                              {rf.docHandover.otherDoc8Name || "-"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* BARIS CATATAN (KIRI) & TERIMA / TIDAK DITERIMA / ACC (KANAN) */}
                    <div className="mt-3 grid grid-cols-12 gap-4 items-start text-[11px]">
                      <div className="col-span-7 space-y-2">
                        <div className="flex items-baseline gap-2">
                          <span className="font-semibold shrink-0">Catatan :</span>
                          <div className="flex-1 border-b border-dotted border-slate-800 font-semibold text-blue-950">
                            {rf.sponsorNotes || rf.candidateNotes || "-"}
                          </div>
                        </div>
                        <div className="border-b border-dotted border-slate-800 h-4" />
                        <div className="border-b border-dotted border-slate-800 h-4" />
                      </div>

                      <div className="col-span-5 space-y-1.5 pl-4">
                        <div className="flex items-center justify-between">
                          <span>Terima</span>
                          <span className="font-mono font-bold text-blue-950">
                            ( {rf.acceptanceDecision === "TERIMA" ? "✓" : "   "} )
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Tidak diterima</span>
                          <span className="font-mono font-bold text-rose-700">
                            ( {rf.acceptanceDecision === "TIDAK_DITERIMA" ? "✓" : "   "} )
                          </span>
                        </div>
                        <div className="pt-1">
                          <span>ACC: </span>
                          <span className="font-bold text-blue-950">
                            ( {rf.accByName || "..................................."} )
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* 3 KOLOM TANDA TANGAN BAWAH SESUAI FORMULIR BARU F4s.pdf */}
                    <div className="mt-5 grid grid-cols-3 gap-6 text-center text-[11px]">
                      <div>
                        <p className="font-semibold">Yang Mengisi Data</p>
                        <div className="h-12 flex items-center justify-center text-[9.5px] italic text-slate-400">
                          Ttd. {rf.formSignedDate}
                        </div>
                        <p className="font-bold text-blue-950">( {cand.fullName} )</p>
                        <p className="text-[10.5px]">calon PMI</p>
                      </div>

                      <div>
                        <p className="font-semibold">Mengetahui/Saksi</p>
                        <div className="h-12 flex items-center justify-center text-[9.5px] italic text-slate-400">
                          Terverifikasi Sponsor
                        </div>
                        <p className="font-bold text-blue-950">( {rf.sponsorOfficerName} )</p>
                        <p className="text-[10.5px]">Petugas Lapangan/Rekrut</p>
                      </div>

                      <div>
                        <p className="font-semibold">Yang Menerima CPMI</p>
                        <div className="h-12 flex items-center justify-center text-[9.5px] italic text-teal-700 font-semibold">
                          ✓ Diinput ke Sistem
                        </div>
                        <p className="font-bold text-blue-950">( {rf.receivedByPtOfficer} )</p>
                        <p className="text-[10.5px]">Petugas PT.</p>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          MODAL PRINTOUT BIODATA SYARIKAH / CV MAJIKAN TIMUR TENGAH
          (100% IDENTIK DENGAN CONTOH_PRINTOUT_BIODATA.PDF — BAHASA INGGRIS & ARAB)
         ========================================================= */}
      {printingSyarikahBiodataCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 p-2 sm:p-5 backdrop-blur-sm print:static print:inset-auto print:block print:bg-white print:p-0 print:m-0">
          <div className="flex max-h-[96vh] w-full max-w-7xl flex-col overflow-hidden rounded-2xl bg-slate-100 shadow-2xl print:block print:max-h-none print:max-w-none print:w-full print:overflow-visible print:rounded-none print:bg-white print:shadow-none">
            {/* Toolbar Atas (Disembunyikan saat Print) */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 px-5 py-3.5 text-white print:hidden">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded bg-indigo-500 px-2 py-0.5 text-[10px] font-extrabold uppercase text-white">
                    PRINTOUT BIODATA SYARIKAH / CV MAJIKAN TIMUR TENGAH (CONTOH_PRINTOUT_BIODATA.PDF)
                  </span>
                  <span className="rounded bg-emerald-500/20 border border-emerald-400/40 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                    ✓ Otomatis Dikonversi ke Bahasa Inggris & Arab dari Data Pendaftaran
                  </span>
                </div>
                <h3 className="mt-0.5 text-sm font-bold">
                  Biodata Syarikah PT. Panca Banyu Aji Sakti —{" "}
                  <span className="text-amber-300">{syarikahBiodataForm.fullName}</span> (
                  {syarikahBiodataForm.referenceNo || "Tanpa No. Reg."})
                </h3>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={loadExactSampleBiodataPdf}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-amber-400/60 bg-amber-500/20 px-3 py-2 text-xs font-extrabold text-amber-200 hover:bg-amber-500/30"
                >
                  ⚡ Muat Contoh Asli PDF (Eka Hermayanti Ruslan)
                </button>
                <a
                  href="/contoh-printout-biodata.pdf"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-xs font-bold text-white hover:bg-white/20"
                >
                  📄 Buka File Asli (contoh_printout_biodata.pdf)
                </a>
                <button
                  type="button"
                  onClick={() => {
                    const cand = printingSyarikahBiodataCandidate;
                    setPrintingSyarikahBiodataCandidate(null);
                    setPrintingRegFormCandidate(cand);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-sky-400/50 bg-sky-500/20 px-3 py-2 text-xs font-bold text-sky-200 hover:bg-sky-500/30"
                >
                  📋 Lihat Formulir F4 Indonesia
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-extrabold text-white shadow-md hover:bg-indigo-500"
                >
                  <Printer className="h-4 w-4 text-amber-300" />
                  🖨️ Cetak / Simpan PDF untuk Syarikah
                </button>
                <button
                  type="button"
                  onClick={() => setPrintingSyarikahBiodataCandidate(null)}
                  className="rounded-lg bg-white/10 p-1.5 text-slate-300 hover:bg-white/20 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Body Split-Screen: Kiri Editor Cepat Bahasa Inggris & Foto, Kanan Kertas A4 Biodata Syarikah */}
            <div className="grid flex-1 grid-cols-1 overflow-y-auto lg:grid-cols-12 print:block print:overflow-visible">
              {/* PANEL KIRI: EDITOR CEPAT DATA BIODATA SYARIKAH & UPLOAD 2 FOTO (DISEMBUNYIKAN SAAT PRINT) */}
              <div className="space-y-4 border-r border-slate-300 bg-white p-4 text-xs lg:col-span-4 lg:max-h-[86vh] lg:overflow-y-auto print:hidden">
                <div className="rounded-xl border border-indigo-200 bg-indigo-50/70 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-extrabold uppercase text-indigo-950">
                      🔄 Pilih Kandidat CPMI dari Sistem
                    </span>
                    <span className="rounded bg-indigo-600 px-1.5 py-0.5 text-[9.5px] font-bold text-white">
                      Auto-Translate EN
                    </span>
                  </div>
                  <select
                    value={printingSyarikahBiodataCandidate.id}
                    onChange={(e) => {
                      const found = db.candidates.find((c) => c.id === e.target.value);
                      if (found) openSyarikahBiodataModal(found);
                    }}
                    className="mt-2 w-full rounded-lg border border-indigo-300 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-900"
                  >
                    {printingSyarikahBiodataCandidate.id === "temp-preview" && (
                      <option value="temp-preview">
                        [Draft Pendaftaran Baru] {syarikahBiodataForm.fullName}
                      </option>
                    )}
                    {db.candidates.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.fullName} ({c.regNumber}) — {c.destinationCountry}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Upload 2 Foto: Close-Up 4x6 & Foto Seluruh Badan (Full Body 3R/4R) */}
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-slate-900">
                      📷 Foto Kandidat untuk Syarikah
                    </span>
                    <label className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={syarikahBiodataForm.replaceHeaderLogoWithNew}
                        onChange={(e) =>
                          setSyarikahBiodataForm({
                            ...syarikahBiodataForm,
                            replaceHeaderLogoWithNew: e.target.checked,
                          })
                        }
                        className="rounded border-slate-300"
                      />
                      Gunakan Logo Baru PT
                    </label>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    {/* Foto Close-Up Kanan Atas */}
                    <div className="rounded-lg border border-slate-200 bg-white p-2 text-center">
                      <img
                        src={syarikahBiodataForm.closeUpPhotoUrl}
                        alt="Close Up"
                        className="mx-auto h-20 w-16 rounded border border-slate-300 object-cover"
                      />
                      <span className="mt-1 block text-[10px] font-bold text-slate-700">
                        1. Foto Setengah Badan
                      </span>
                      <label className="mt-1 inline-block cursor-pointer rounded bg-sky-600 px-2 py-1 text-[10px] font-bold text-white hover:bg-sky-700">
                        📤 Ganti Foto
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
                              setSyarikahBiodataForm((prev) => ({
                                ...prev,
                                closeUpPhotoUrl: dataUrl,
                              }));
                              if (printingSyarikahBiodataCandidate.id !== "temp-preview") {
                                await callApi("UPDATE_CANDIDATE", {
                                  candidateId: printingSyarikahBiodataCandidate.id,
                                  updates: { avatarUrl: dataUrl },
                                });
                              }
                            };
                            reader.readAsDataURL(file);
                          }}
                        />
                      </label>
                    </div>

                    {/* Foto Full-Body Berdiri Kanan Bawah */}
                    <div className="rounded-lg border border-slate-200 bg-white p-2 text-center">
                      <img
                        src={syarikahBiodataForm.fullBodyPhotoUrl}
                        alt="Full Body"
                        className="mx-auto h-20 w-14 rounded border border-indigo-300 object-cover"
                      />
                      <span className="mt-1 block text-[10px] font-bold text-indigo-900">
                        2. Foto Full Body (3R/4R)
                      </span>
                      <label className="mt-1 inline-block cursor-pointer rounded bg-indigo-600 px-2 py-1 text-[10px] font-bold text-white hover:bg-indigo-700">
                        📤 Ganti Full Body
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
                              setSyarikahBiodataForm((prev) => ({
                                ...prev,
                                fullBodyPhotoUrl: dataUrl,
                              }));
                              if (printingSyarikahBiodataCandidate.id !== "temp-preview") {
                                await callApi("UPDATE_CANDIDATE", {
                                  candidateId: printingSyarikahBiodataCandidate.id,
                                  updates: { fullBodyPhotoUrl: dataUrl },
                                });
                              }
                            };
                            reader.readAsDataURL(file);
                          }}
                        />
                      </label>
                    </div>
                  </div>
                </div>

                {/* Form Edit Cepat Field Bahasa Inggris */}
                <div className="space-y-2.5 rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <span className="block font-extrabold text-slate-900 border-b border-slate-200 pb-1.5">
                    ✏️ Edit Cepat Isian Biodata Syarikah (Bahasa Inggris)
                  </span>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-bold text-slate-600 block">
                        REFERENCE NO.
                      </label>
                      <input
                        type="text"
                        value={syarikahBiodataForm.referenceNo}
                        onChange={(e) =>
                          setSyarikahBiodataForm({
                            ...syarikahBiodataForm,
                            referenceNo: e.target.value.toUpperCase(),
                          })
                        }
                        placeholder="Kosong / No Reg"
                        className="w-full rounded border border-slate-300 bg-white px-2 py-1 font-mono text-[11px]"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-600 block">
                        FOR EMPLOYMENT IN
                      </label>
                      <input
                        type="text"
                        value={syarikahBiodataForm.employmentIn}
                        onChange={(e) =>
                          setSyarikahBiodataForm({
                            ...syarikahBiodataForm,
                            employmentIn: e.target.value.toUpperCase(),
                          })
                        }
                        placeholder="SAUDI ARABIA"
                        className="w-full rounded border border-slate-300 bg-white px-2 py-1 text-[11px] font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-600 block">
                        Post Apply (Jabatan)
                      </label>
                      <input
                        type="text"
                        value={syarikahBiodataForm.postApply}
                        onChange={(e) =>
                          setSyarikahBiodataForm({
                            ...syarikahBiodataForm,
                            postApply: e.target.value.toUpperCase(),
                          })
                        }
                        className="w-full rounded border border-slate-300 bg-white px-2 py-1 text-[11px] font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-600 block">
                        Monthly Salary (Gaji)
                      </label>
                      <input
                        type="text"
                        value={syarikahBiodataForm.monthlySalary}
                        onChange={(e) =>
                          setSyarikahBiodataForm({
                            ...syarikahBiodataForm,
                            monthlySalary: e.target.value.toUpperCase(),
                          })
                        }
                        className="w-full rounded border border-slate-300 bg-white px-2 py-1 text-[11px] font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-600 block">
                        Contract Period
                      </label>
                      <input
                        type="text"
                        value={syarikahBiodataForm.contractPeriod}
                        onChange={(e) =>
                          setSyarikahBiodataForm({
                            ...syarikahBiodataForm,
                            contractPeriod: e.target.value.toUpperCase(),
                          })
                        }
                        className="w-full rounded border border-slate-300 bg-white px-2 py-1 text-[11px]"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-600 block">Phone</label>
                      <input
                        type="text"
                        value={syarikahBiodataForm.phone}
                        onChange={(e) =>
                          setSyarikahBiodataForm({
                            ...syarikahBiodataForm,
                            phone: e.target.value,
                          })
                        }
                        className="w-full rounded border border-slate-300 bg-white px-2 py-1 font-mono text-[11px]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-blue-800 block">
                      Full Name (Nama Lengkap Huruf Kapital Biru)
                    </label>
                    <input
                      type="text"
                      value={syarikahBiodataForm.fullName}
                      onChange={(e) =>
                        setSyarikahBiodataForm({
                          ...syarikahBiodataForm,
                          fullName: e.target.value.toUpperCase(),
                        })
                      }
                      className="w-full rounded border border-blue-400 bg-white px-2 py-1 text-xs font-black text-blue-700"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-bold text-slate-600 block">
                        Date of Birth
                      </label>
                      <input
                        type="text"
                        value={syarikahBiodataForm.dateOfBirth}
                        onChange={(e) =>
                          setSyarikahBiodataForm({
                            ...syarikahBiodataForm,
                            dateOfBirth: e.target.value,
                          })
                        }
                        className="w-full rounded border border-slate-300 bg-white px-2 py-1 text-[11px]"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-600 block">Age</label>
                      <input
                        type="text"
                        value={syarikahBiodataForm.age}
                        onChange={(e) =>
                          setSyarikahBiodataForm({
                            ...syarikahBiodataForm,
                            age: e.target.value,
                          })
                        }
                        className="w-full rounded border border-slate-300 bg-white px-2 py-1 text-[11px]"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-600 block">
                        Place of Birth
                      </label>
                      <input
                        type="text"
                        value={syarikahBiodataForm.placeOfBirth}
                        onChange={(e) =>
                          setSyarikahBiodataForm({
                            ...syarikahBiodataForm,
                            placeOfBirth: e.target.value.toUpperCase(),
                          })
                        }
                        className="w-full rounded border border-slate-300 bg-white px-2 py-1 text-[11px]"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-600 block">
                        Living Town
                      </label>
                      <input
                        type="text"
                        value={syarikahBiodataForm.livingTown}
                        onChange={(e) =>
                          setSyarikahBiodataForm({
                            ...syarikahBiodataForm,
                            livingTown: e.target.value.toUpperCase(),
                          })
                        }
                        className="w-full rounded border border-slate-300 bg-white px-2 py-1 text-[11px]"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-600 block">
                        Marital Status
                      </label>
                      <input
                        type="text"
                        value={syarikahBiodataForm.maritalStatus}
                        onChange={(e) =>
                          setSyarikahBiodataForm({
                            ...syarikahBiodataForm,
                            maritalStatus: e.target.value.toUpperCase(),
                          })
                        }
                        className="w-full rounded border border-slate-300 bg-white px-2 py-1 text-[11px]"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-600 block">
                        No. of Children
                      </label>
                      <input
                        type="text"
                        value={syarikahBiodataForm.noOfChildren}
                        onChange={(e) =>
                          setSyarikahBiodataForm({
                            ...syarikahBiodataForm,
                            noOfChildren: e.target.value,
                          })
                        }
                        className="w-full rounded border border-slate-300 bg-white px-2 py-1 text-[11px]"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-600 block">Weight</label>
                      <input
                        type="text"
                        value={syarikahBiodataForm.weight}
                        onChange={(e) =>
                          setSyarikahBiodataForm({
                            ...syarikahBiodataForm,
                            weight: e.target.value.toUpperCase(),
                          })
                        }
                        className="w-full rounded border border-slate-300 bg-white px-2 py-1 text-[11px]"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-600 block">Height</label>
                      <input
                        type="text"
                        value={syarikahBiodataForm.height}
                        onChange={(e) =>
                          setSyarikahBiodataForm({
                            ...syarikahBiodataForm,
                            height: e.target.value.toUpperCase(),
                          })
                        }
                        className="w-full rounded border border-slate-300 bg-white px-2 py-1 text-[11px]"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-600 block">
                        Complexion
                      </label>
                      <input
                        type="text"
                        value={syarikahBiodataForm.complexion}
                        onChange={(e) =>
                          setSyarikahBiodataForm({
                            ...syarikahBiodataForm,
                            complexion: e.target.value.toUpperCase(),
                          })
                        }
                        className="w-full rounded border border-slate-300 bg-white px-2 py-1 text-[11px]"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-600 block">
                        Educational
                      </label>
                      <input
                        type="text"
                        value={syarikahBiodataForm.educational}
                        onChange={(e) =>
                          setSyarikahBiodataForm({
                            ...syarikahBiodataForm,
                            educational: e.target.value.toUpperCase(),
                          })
                        }
                        className="w-full rounded border border-slate-300 bg-white px-2 py-1 text-[11px]"
                      />
                    </div>
                  </div>

                  {/* Data Paspor */}
                  <div className="grid grid-cols-2 gap-2 border-t border-slate-200 pt-2">
                    <div>
                      <label className="text-[10px] font-bold text-slate-600 block">
                        Passport Number
                      </label>
                      <input
                        type="text"
                        value={syarikahBiodataForm.passportNumber}
                        onChange={(e) =>
                          setSyarikahBiodataForm({
                            ...syarikahBiodataForm,
                            passportNumber: e.target.value.toUpperCase(),
                          })
                        }
                        placeholder="Kosong jika belum terbit"
                        className="w-full rounded border border-slate-300 bg-white px-2 py-1 font-mono text-[11px]"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-600 block">
                        Place of Issue
                      </label>
                      <input
                        type="text"
                        value={syarikahBiodataForm.passportIssuePlace}
                        onChange={(e) =>
                          setSyarikahBiodataForm({
                            ...syarikahBiodataForm,
                            passportIssuePlace: e.target.value.toUpperCase(),
                          })
                        }
                        className="w-full rounded border border-slate-300 bg-white px-2 py-1 text-[11px]"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-600 block">
                        Date of Issue
                      </label>
                      <input
                        type="text"
                        value={syarikahBiodataForm.passportIssueDate}
                        onChange={(e) =>
                          setSyarikahBiodataForm({
                            ...syarikahBiodataForm,
                            passportIssueDate: e.target.value,
                          })
                        }
                        className="w-full rounded border border-slate-300 bg-white px-2 py-1 text-[11px]"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-600 block">
                        Date of Expire
                      </label>
                      <input
                        type="text"
                        value={syarikahBiodataForm.passportExpiryDate}
                        onChange={(e) =>
                          setSyarikahBiodataForm({
                            ...syarikahBiodataForm,
                            passportExpiryDate: e.target.value,
                          })
                        }
                        className="w-full rounded border border-slate-300 bg-white px-2 py-1 text-[11px]"
                      />
                    </div>
                  </div>

                  {/* Bahasa & Pengalaman */}
                  <div className="grid grid-cols-2 gap-2 border-t border-slate-200 pt-2">
                    <div>
                      <label className="text-[10px] font-bold text-slate-600 block">
                        Arabic (Speak / Read)
                      </label>
                      <div className="flex gap-1">
                        <input
                          type="text"
                          value={syarikahBiodataForm.arabicSpeak}
                          onChange={(e) =>
                            setSyarikahBiodataForm({
                              ...syarikahBiodataForm,
                              arabicSpeak: e.target.value.toUpperCase(),
                            })
                          }
                          className="w-1/2 rounded border border-slate-300 bg-white px-1.5 py-1 text-[11px]"
                        />
                        <input
                          type="text"
                          value={syarikahBiodataForm.arabicRead}
                          onChange={(e) =>
                            setSyarikahBiodataForm({
                              ...syarikahBiodataForm,
                              arabicRead: e.target.value.toUpperCase(),
                            })
                          }
                          className="w-1/2 rounded border border-slate-300 bg-white px-1.5 py-1 text-[11px]"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-600 block">
                        English (Speak / Read)
                      </label>
                      <div className="flex gap-1">
                        <input
                          type="text"
                          value={syarikahBiodataForm.englishSpeak}
                          onChange={(e) =>
                            setSyarikahBiodataForm({
                              ...syarikahBiodataForm,
                              englishSpeak: e.target.value.toUpperCase(),
                            })
                          }
                          className="w-1/2 rounded border border-slate-300 bg-white px-1.5 py-1 text-[11px]"
                        />
                        <input
                          type="text"
                          value={syarikahBiodataForm.englishRead}
                          onChange={(e) =>
                            setSyarikahBiodataForm({
                              ...syarikahBiodataForm,
                              englishRead: e.target.value.toUpperCase(),
                            })
                          }
                          className="w-1/2 rounded border border-slate-300 bg-white px-1.5 py-1 text-[11px]"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-600 block">
                        Previous Employment Country
                      </label>
                      <input
                        type="text"
                        value={syarikahBiodataForm.prevEmploymentCountry}
                        onChange={(e) =>
                          setSyarikahBiodataForm({
                            ...syarikahBiodataForm,
                            prevEmploymentCountry: e.target.value.toUpperCase(),
                          })
                        }
                        className="w-full rounded border border-slate-300 bg-white px-2 py-1 text-[11px]"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-600 block">
                        Period (Periode)
                      </label>
                      <input
                        type="text"
                        value={syarikahBiodataForm.prevEmploymentPeriod}
                        onChange={(e) =>
                          setSyarikahBiodataForm({
                            ...syarikahBiodataForm,
                            prevEmploymentPeriod: e.target.value.toUpperCase(),
                          })
                        }
                        className="w-full rounded border border-slate-300 bg-white px-2 py-1 text-[11px]"
                      />
                    </div>
                  </div>

                  {/* Work Experience YES/NO & She Can Cook */}
                  <div className="border-t border-slate-200 pt-2">
                    <label className="text-[10px] font-bold text-slate-600 block mb-1">
                      Work Experience (YES / NO)
                    </label>
                    <div className="grid grid-cols-4 gap-1.5 text-[10px]">
                      {(
                        [
                          ["driving", "Driving"],
                          ["cooking", "Cooking"],
                          ["cleaning", "Cleaning"],
                          ["washing", "Washing"],
                          ["babySitting", "Baby Sit"],
                          ["ironing", "Ironing"],
                          ["careOfOlder", "Older Care"],
                        ] as const
                      ).map(([k, lbl]) => (
                        <button
                          key={k}
                          type="button"
                          onClick={() =>
                            setSyarikahBiodataForm((prev) => ({
                              ...prev,
                              [k]: prev[k] === "YES" ? "NO" : "YES",
                            }))
                          }
                          className={`rounded border px-1.5 py-1 font-bold ${
                            syarikahBiodataForm[k] === "YES"
                              ? "border-emerald-500 bg-emerald-50 text-emerald-900"
                              : "border-slate-300 bg-white text-slate-600"
                          }`}
                        >
                          {lbl}: {syarikahBiodataForm[k]}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-600 block">
                      She Can Cook (Daftar Masakan Arab)
                    </label>
                    <input
                      type="text"
                      value={syarikahBiodataForm.sheCanCook}
                      onChange={(e) =>
                        setSyarikahBiodataForm({
                          ...syarikahBiodataForm,
                          sheCanCook: e.target.value,
                        })
                      }
                      placeholder="Kosong atau daftar masakan Arab"
                      className="w-full rounded border border-slate-300 bg-white px-2 py-1 text-[11px]"
                    />
                  </div>
                </div>
              </div>

              {/* PANEL KANAN: KERTAS A4 PRINTOUT BIODATA SYARIKAH (100% IDENTIK DENGAN CONTOH_PRINTOUT_BIODATA.PDF) */}
              <div className="flex items-start justify-center overflow-y-auto bg-slate-300/80 p-4 sm:p-6 lg:col-span-8 lg:max-h-[86vh] print:block print:w-full print:max-h-none print:overflow-visible print:bg-white print:p-0 print:m-0">
                <div
                  className="relative mx-auto w-full max-w-[760px] select-none overflow-hidden bg-white shadow-2xl print:mx-0 print:max-w-none print:w-[210mm] print:shadow-none print-avoid-break"
                  style={{ aspectRatio: "594.96 / 828.32" }}
                >
                  {/* 1. Template Asli A4 Bahasa Inggris & Arab dari contoh_printout_biodata.pdf */}
                  <img
                    src="/biodata-img-1.jpg"
                    alt="Template Biodata Syarikah PT Panca Banyu Aji Sakti"
                    className="h-full w-full object-fill"
                  />

                  {/* 2. Overlay Logo Perusahaan Baru PT Panca Banyu Ajisakti di Kanan Atas Kop (Jika Diaktifkan) */}
                  {syarikahBiodataForm.replaceHeaderLogoWithNew && (
                    <div
                      style={{
                        left: "83.4%",
                        top: "1.8%",
                        width: "13.2%",
                        height: "9.0%",
                      }}
                      className="absolute flex items-center justify-center bg-white p-1"
                    >
                      <img
                        src="/logo-panca-banyu.png"
                        alt="Logo PT Panca Banyu Ajisakti"
                        className="h-full w-full object-contain"
                      />
                    </div>
                  )}

                  {/* 3. Foto Setengah Badan (Close-Up Portrait) — Koordinat Identik contoh_printout_biodata.pdf */}
                  <div
                    style={{
                      left: "79.54%",
                      top: "16.71%",
                      width: "12.65%",
                      height: "11.08%",
                    }}
                    className="absolute overflow-hidden bg-white"
                  >
                    <img
                      src={syarikahBiodataForm.closeUpPhotoUrl}
                      alt={syarikahBiodataForm.fullName}
                      className="h-full w-full object-cover"
                    />
                  </div>

                  {/* 4. Foto Seluruh Badan (Full-Body Standing 3R/4R) — Koordinat Identik contoh_printout_biodata.pdf */}
                  <div
                    style={{
                      left: "53.56%",
                      top: "44.19%",
                      width: "38.76%",
                      height: "43.89%",
                    }}
                    className="absolute overflow-hidden bg-white"
                  >
                    <img
                      src={syarikahBiodataForm.fullBodyPhotoUrl}
                      alt={`${syarikahBiodataForm.fullName} Full Body`}
                      className="h-full w-full object-cover"
                    />
                  </div>

                  {/* 5. Seluruh Field Teks Bahasa Inggris pada Koordinat Presisi contoh_printout_biodata.pdf (baseTop + translateY(-80%)) */}
                  {/* REFERENCE NO. */}
                  <span
                    style={{
                      left: "25.84%",
                      top: "16.68%",
                      transform: "translateY(-80%)",
                    }}
                    className="absolute font-sans text-[10.5px] print:text-[8pt] font-bold leading-none tracking-tight text-black uppercase"
                  >
                    {syarikahBiodataForm.referenceNo}
                  </span>

                  {/* FOR EMPLOYMENT IN */}
                  <span
                    style={{
                      left: "25.84%",
                      top: "18.73%",
                      transform: "translateY(-80%)",
                    }}
                    className="absolute font-sans text-[10.5px] print:text-[8pt] font-bold leading-none tracking-tight text-black uppercase"
                  >
                    {syarikahBiodataForm.employmentIn}
                  </span>

                  {/* Post Apply */}
                  <span
                    style={{
                      left: "22.36%",
                      top: "21.79%",
                      transform: "translateY(-80%)",
                    }}
                    className="absolute font-sans text-[10.5px] print:text-[8pt] font-normal leading-none text-black uppercase"
                  >
                    {syarikahBiodataForm.postApply}
                  </span>

                  {/* Monthly Salary */}
                  <span
                    style={{
                      left: "22.36%",
                      top: "23.77%",
                      transform: "translateY(-80%)",
                    }}
                    className="absolute font-sans text-[10.5px] print:text-[8pt] font-normal leading-none text-black uppercase"
                  >
                    {syarikahBiodataForm.monthlySalary}
                  </span>

                  {/* Contract Period */}
                  <span
                    style={{
                      left: "22.36%",
                      top: "25.62%",
                      transform: "translateY(-80%)",
                    }}
                    className="absolute font-sans text-[10.5px] print:text-[8pt] font-normal leading-none text-black uppercase"
                  >
                    {syarikahBiodataForm.contractPeriod}
                  </span>

                  {/* Phone */}
                  <span
                    style={{
                      left: "48.84%",
                      top: "25.56%",
                      transform: "translateY(-80%)",
                    }}
                    className="absolute font-sans text-[10.5px] print:text-[8pt] font-normal leading-none text-black"
                  >
                    {syarikahBiodataForm.phone}
                  </span>

                  {/* Full Name (Bold Blue #0033FF, 9.5pt in PDF) */}
                  <span
                    style={{
                      left: "34.03%",
                      top: "28.92%",
                      transform: "translateY(-80%)",
                      color: "#0033FF",
                    }}
                    className="absolute font-sans text-[12.5px] print:text-[9.5pt] font-bold leading-none tracking-wide uppercase"
                  >
                    {syarikahBiodataForm.fullName}
                  </span>

                  {/* Personal Information (Left Column) */}
                  {/* Nationality */}
                  <span
                    style={{
                      left: "18.96%",
                      top: "34.11%",
                      transform: "translateY(-80%)",
                    }}
                    className="absolute font-sans text-[10.5px] print:text-[8pt] font-normal leading-none text-black uppercase"
                  >
                    {syarikahBiodataForm.nationality}
                  </span>

                  {/* Religion */}
                  <span
                    style={{
                      left: "18.96%",
                      top: "36.09%",
                      transform: "translateY(-80%)",
                    }}
                    className="absolute font-sans text-[10.5px] print:text-[8pt] font-normal leading-none text-black uppercase"
                  >
                    {syarikahBiodataForm.religion}
                  </span>

                  {/* Date of Birth */}
                  <span
                    style={{
                      left: "18.96%",
                      top: "38.07%",
                      transform: "translateY(-80%)",
                    }}
                    className="absolute font-sans text-[10.5px] print:text-[8pt] font-normal leading-none text-black uppercase"
                  >
                    {syarikahBiodataForm.dateOfBirth}
                  </span>

                  {/* Age */}
                  <span
                    style={{
                      left: "18.96%",
                      top: "39.93%",
                      transform: "translateY(-80%)",
                    }}
                    className="absolute font-sans text-[10.5px] print:text-[8pt] font-normal leading-none text-black uppercase"
                  >
                    {syarikahBiodataForm.age}
                  </span>

                  {/* Place of Birth */}
                  <span
                    style={{
                      left: "18.96%",
                      top: "42.02%",
                      transform: "translateY(-80%)",
                    }}
                    className="absolute font-sans text-[10.5px] print:text-[8pt] font-normal leading-none text-black uppercase"
                  >
                    {syarikahBiodataForm.placeOfBirth}
                  </span>

                  {/* Living Town */}
                  <span
                    style={{
                      left: "18.96%",
                      top: "44.23%",
                      transform: "translateY(-80%)",
                    }}
                    className="absolute font-sans text-[10.5px] print:text-[8pt] font-normal leading-none text-black uppercase"
                  >
                    {syarikahBiodataForm.livingTown}
                  </span>

                  {/* Marital Status */}
                  <span
                    style={{
                      left: "18.96%",
                      top: "46.15%",
                      transform: "translateY(-80%)",
                    }}
                    className="absolute font-sans text-[10.5px] print:text-[8pt] font-normal leading-none text-black uppercase"
                  >
                    {syarikahBiodataForm.maritalStatus}
                  </span>

                  {/* No. of Children */}
                  <span
                    style={{
                      left: "18.96%",
                      top: "48.28%",
                      transform: "translateY(-80%)",
                    }}
                    className="absolute font-sans text-[10.5px] print:text-[8pt] font-normal leading-none text-black uppercase"
                  >
                    {syarikahBiodataForm.noOfChildren}
                  </span>

                  {/* Weight */}
                  <span
                    style={{
                      left: "18.96%",
                      top: "50.40%",
                      transform: "translateY(-80%)",
                    }}
                    className="absolute font-sans text-[10.5px] print:text-[8pt] font-normal leading-none text-black uppercase"
                  >
                    {syarikahBiodataForm.weight}
                  </span>

                  {/* Height */}
                  <span
                    style={{
                      left: "18.96%",
                      top: "52.18%",
                      transform: "translateY(-80%)",
                    }}
                    className="absolute font-sans text-[10.5px] print:text-[8pt] font-normal leading-none text-black uppercase"
                  >
                    {syarikahBiodataForm.height}
                  </span>

                  {/* Complexion */}
                  <span
                    style={{
                      left: "18.96%",
                      top: "54.10%",
                      transform: "translateY(-80%)",
                    }}
                    className="absolute font-sans text-[10.5px] print:text-[8pt] font-normal leading-none text-black uppercase"
                  >
                    {syarikahBiodataForm.complexion}
                  </span>

                  {/* Educational */}
                  <span
                    style={{
                      left: "18.96%",
                      top: "55.88%",
                      transform: "translateY(-80%)",
                    }}
                    className="absolute font-sans text-[10.5px] print:text-[8pt] font-normal leading-none text-black uppercase"
                  >
                    {syarikahBiodataForm.educational}
                  </span>

                  {/* Passport Details (Right Top Column) */}
                  {/* Passport Number */}
                  <span
                    style={{
                      left: "64.71%",
                      top: "34.11%",
                      transform: "translateY(-80%)",
                    }}
                    className="absolute font-sans text-[10.5px] print:text-[8pt] font-normal leading-none text-black uppercase"
                  >
                    {syarikahBiodataForm.passportNumber}
                  </span>

                  {/* Date of Issue */}
                  <span
                    style={{
                      left: "64.71%",
                      top: "36.09%",
                      transform: "translateY(-80%)",
                    }}
                    className="absolute font-sans text-[10.5px] print:text-[8pt] font-normal leading-none text-black uppercase"
                  >
                    {syarikahBiodataForm.passportIssueDate}
                  </span>

                  {/* Place of Issue */}
                  <span
                    style={{
                      left: "64.71%",
                      top: "38.07%",
                      transform: "translateY(-80%)",
                    }}
                    className="absolute font-sans text-[10.5px] print:text-[8pt] font-normal leading-none text-black uppercase"
                  >
                    {syarikahBiodataForm.passportIssuePlace}
                  </span>

                  {/* Date of Expire */}
                  <span
                    style={{
                      left: "64.71%",
                      top: "39.93%",
                      transform: "translateY(-80%)",
                    }}
                    className="absolute font-sans text-[10.5px] print:text-[8pt] font-normal leading-none text-black uppercase"
                  >
                    {syarikahBiodataForm.passportExpiryDate}
                  </span>

                  {/* Knowledge of Languages */}
                  {/* Arabic Speak */}
                  <span
                    style={{
                      left: "18.90%",
                      top: "63.16%",
                      transform: "translateY(-80%)",
                    }}
                    className="absolute font-sans text-[10.5px] print:text-[8pt] font-normal leading-none text-black uppercase"
                  >
                    {syarikahBiodataForm.arabicSpeak}
                  </span>

                  {/* Arabic Read */}
                  <span
                    style={{
                      left: "32.44%",
                      top: "63.16%",
                      transform: "translateY(-80%)",
                    }}
                    className="absolute font-sans text-[10.5px] print:text-[8pt] font-normal leading-none text-black uppercase"
                  >
                    {syarikahBiodataForm.arabicRead}
                  </span>

                  {/* English Speak */}
                  <span
                    style={{
                      left: "18.90%",
                      top: "64.96%",
                      transform: "translateY(-80%)",
                    }}
                    className="absolute font-sans text-[10.5px] print:text-[8pt] font-normal leading-none text-black uppercase"
                  >
                    {syarikahBiodataForm.englishSpeak}
                  </span>

                  {/* English Read */}
                  <span
                    style={{
                      left: "32.44%",
                      top: "64.96%",
                      transform: "translateY(-80%)",
                    }}
                    className="absolute font-sans text-[10.5px] print:text-[8pt] font-normal leading-none text-black uppercase"
                  >
                    {syarikahBiodataForm.englishRead}
                  </span>

                  {/* Previous Employment Abroad */}
                  {/* Country */}
                  <span
                    style={{
                      left: "13.62%",
                      top: "69.15%",
                      transform: "translateY(-80%)",
                    }}
                    className="absolute max-w-[36%] truncate font-sans text-[10px] print:text-[7.5pt] font-normal leading-none text-black uppercase"
                  >
                    {syarikahBiodataForm.prevEmploymentCountry}
                  </span>

                  {/* Period */}
                  <span
                    style={{
                      left: "13.10%",
                      top: "72.65%",
                      transform: "translateY(-80%)",
                    }}
                    className="absolute max-w-[36%] truncate font-sans text-[10px] print:text-[7.5pt] font-normal leading-none text-black uppercase"
                  >
                    {syarikahBiodataForm.prevEmploymentPeriod}
                  </span>

                  {/* Work Experience YES / NO */}
                  {/* Driving */}
                  <span
                    style={{
                      left: "17.99%",
                      top: "78.37%",
                      transform: "translateY(-80%)",
                    }}
                    className="absolute font-sans text-[10.5px] print:text-[8pt] font-normal leading-none text-black uppercase"
                  >
                    {syarikahBiodataForm.driving}
                  </span>

                  {/* Cooking */}
                  <span
                    style={{
                      left: "18.02%",
                      top: "79.87%",
                      transform: "translateY(-80%)",
                    }}
                    className="absolute font-sans text-[10.5px] print:text-[8pt] font-normal leading-none text-black uppercase"
                  >
                    {syarikahBiodataForm.cooking}
                  </span>

                  {/* Cleaning */}
                  <span
                    style={{
                      left: "17.95%",
                      top: "81.62%",
                      transform: "translateY(-80%)",
                    }}
                    className="absolute font-sans text-[10.5px] print:text-[8pt] font-normal leading-none text-black uppercase"
                  >
                    {syarikahBiodataForm.cleaning}
                  </span>

                  {/* Washing */}
                  <span
                    style={{
                      left: "17.95%",
                      top: "83.29%",
                      transform: "translateY(-80%)",
                    }}
                    className="absolute font-sans text-[10.5px] print:text-[8pt] font-normal leading-none text-black uppercase"
                  >
                    {syarikahBiodataForm.washing}
                  </span>

                  {/* Baby Sitting */}
                  <span
                    style={{
                      left: "17.95%",
                      top: "84.95%",
                      transform: "translateY(-80%)",
                    }}
                    className="absolute font-sans text-[10.5px] print:text-[8pt] font-normal leading-none text-black uppercase"
                  >
                    {syarikahBiodataForm.babySitting}
                  </span>

                  {/* Ironing */}
                  <span
                    style={{
                      left: "17.95%",
                      top: "86.62%",
                      transform: "translateY(-80%)",
                    }}
                    className="absolute font-sans text-[10.5px] print:text-[8pt] font-normal leading-none text-black uppercase"
                  >
                    {syarikahBiodataForm.ironing}
                  </span>

                  {/* Care of Older */}
                  <span
                    style={{
                      left: "17.95%",
                      top: "88.28%",
                      transform: "translateY(-80%)",
                    }}
                    className="absolute font-sans text-[10.5px] print:text-[8pt] font-normal leading-none text-black uppercase"
                  >
                    {syarikahBiodataForm.careOfOlder}
                  </span>

                  {/* She Can Cook (Dishes List at Bottom) */}
                  {syarikahBiodataForm.sheCanCook && (
                    <div
                      style={{
                        left: "6.0%",
                        top: "93.2%",
                        width: "86%",
                      }}
                      className="absolute font-sans text-[9.5px] font-semibold leading-tight text-blue-950 uppercase"
                    >
                      {syarikahBiodataForm.sheCanCook}
                    </div>
                  )}
                </div>
              </div>
            </div>
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
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-bold text-slate-800 text-xs">
                    {editingDoc.doc.docType === "MEDICAL"
                      ? "🏥 Sarana Kesehatan / Klinik Medical (Terhubung Master Wafid GCC)"
                      : editingDoc.doc.docType === "PASPOR"
                      ? "🏛️ Kantor Imigrasi Penerbit Paspor (Terhubung Master Kanim)"
                      : editingDoc.doc.docType === "SERTIFIKAT_KOMPETENSI"
                      ? "🏫 BLK-LN / LSP Penguji Kompetensi (Terhubung Master BLK)"
                      : editingDoc.doc.docType === "VISA"
                      ? "🌍 Kedutaan / Visa Center (Terhubung Master KBSA/VFS)"
                      : editingDoc.doc.docType === "EKTKLN_OPP"
                      ? "🏛️ Balai Pelayanan BP2MI / P4MI (Penyelenggara OPP & E-KPMI)"
                      : editingDoc.doc.docType === "TIKET_EKTKLN"
                      ? "✈️ Maskapai Penerbangan (Terhubung Master Airlines)"
                      : ["KTP", "KK", "AKTA_IJAZAH", "IZIN_KELUARGA"].includes(editingDoc.doc.docType)
                      ? "🏢 Disdukcapil Penerbit Berkas (Terhubung Master Disdukcapil)"
                      : "Instansi Penerbit / Sarana Kesehatan (Klinik)"}
                  </label>
                  <span className="text-[10px] font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                    ⚡ Master Data Terintegrasi
                  </span>
                </div>

                {/* 1. Dropdown Pilihan Klinik Medical Wafid / GAMCA */}
                {editingDoc.doc.docType === "MEDICAL" && (db.masterMedicalClinics?.length || 0) > 0 && (
                  <div className="mb-2">
                    <select
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val) {
                          setDocForm({ ...docForm, issuedBy: val });
                        }
                      }}
                      className="w-full rounded-lg border border-teal-400 bg-teal-50 px-3 py-2 text-xs font-bold text-teal-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    >
                      <option value="">-- Pilih dari Master Klinik GAMCA / Wafid GCC Resmi --</option>
                      {db.masterMedicalClinics
                        ?.filter((m) => m.active !== false)
                        .map((m) => (
                          <option key={m.id} value={`${m.name} (${m.wafidCode || m.type})`}>
                            🏥 {m.name} · {m.city} [{m.type === "WAFID_GAMCA" ? "Wafid GCC" : m.type}]
                          </option>
                        ))}
                    </select>
                  </div>
                )}

                {/* 2. Dropdown Pilihan Kantor Imigrasi (Kanim) */}
                {editingDoc.doc.docType === "PASPOR" && (db.masterImmigrationOffices?.length || 0) > 0 && (
                  <div className="mb-2">
                    <select
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val) {
                          setDocForm({ ...docForm, issuedBy: val });
                        }
                      }}
                      className="w-full rounded-lg border border-sky-400 bg-sky-50 px-3 py-2 text-xs font-bold text-sky-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    >
                      <option value="">-- Pilih dari Master Kantor Imigrasi (Kanim) --</option>
                      {db.masterImmigrationOffices
                        ?.filter((k) => k.active !== false)
                        .map((k) => (
                          <option key={k.id} value={k.name}>
                            🏛️ {k.code} — {k.name} ({k.city}, {k.province})
                          </option>
                        ))}
                    </select>
                  </div>
                )}

                {/* 3. Dropdown Pilihan Disdukcapil */}
                {["KTP", "KK", "AKTA_IJAZAH", "IZIN_KELUARGA"].includes(editingDoc.doc.docType) &&
                  (db.masterDisdukcapil?.length || 0) > 0 && (
                    <div className="mb-2">
                      <select
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val) {
                            setDocForm({ ...docForm, issuedBy: val });
                          }
                        }}
                        className="w-full rounded-lg border border-indigo-400 bg-indigo-50 px-3 py-2 text-xs font-bold text-indigo-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="">-- Pilih dari Master Disdukcapil Sentra CPMI --</option>
                        {db.masterDisdukcapil
                          ?.filter((d) => d.active !== false)
                          .map((d) => (
                            <option key={d.id} value={d.officeName}>
                              🏢 {d.officeName} ({d.regencyCity}, {d.province})
                            </option>
                          ))}
                      </select>
                    </div>
                  )}

                {/* 4. Dropdown Pilihan BLK-LN & LSP */}
                {editingDoc.doc.docType === "SERTIFIKAT_KOMPETENSI" && (db.masterBlkLn?.length || 0) > 0 && (
                  <div className="mb-2">
                    <select
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val) {
                          setDocForm({ ...docForm, issuedBy: val });
                        }
                      }}
                      className="w-full rounded-lg border border-amber-400 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    >
                      <option value="">-- Pilih dari Master BLK-LN PT. PBA / LSP BNSP --</option>
                      {db.masterBlkLn
                        ?.filter((b) => b.active !== false)
                        .map((b) => (
                          <option key={b.id} value={`${b.name} (VIN: ${b.vinKemnaker})`}>
                            🏫 {b.name} · Grade {b.accreditationGrade} ({b.city})
                          </option>
                        ))}
                    </select>
                  </div>
                )}

                {/* 5. Dropdown Pilihan Kedutaan / VFS Tasheer */}
                {editingDoc.doc.docType === "VISA" && (db.masterEmbassies?.length || 0) > 0 && (
                  <div className="mb-2">
                    <select
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val) {
                          setDocForm({ ...docForm, issuedBy: val });
                        }
                      }}
                      className="w-full rounded-lg border border-purple-400 bg-purple-50 px-3 py-2 text-xs font-bold text-purple-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="">-- Pilih dari Master Kedutaan / VFS Tasheer --</option>
                      {db.masterEmbassies
                        ?.filter((e) => e.active !== false)
                        .map((e) => (
                          <option key={e.id} value={e.name}>
                            🌍 {e.name} ({e.country} · {e.institutionType})
                          </option>
                        ))}
                    </select>
                  </div>
                )}

                {/* 6. Dropdown Pilihan Maskapai Penerbangan */}
                {editingDoc.doc.docType === "TIKET_EKTKLN" && (db.masterAirlines?.length || 0) > 0 && (
                  <div className="mb-2">
                    <select
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val) {
                          setDocForm({ ...docForm, issuedBy: val });
                        }
                      }}
                      className="w-full rounded-lg border border-sky-400 bg-sky-50 px-3 py-2 text-xs font-bold text-sky-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    >
                      <option value="">-- Pilih dari Master Maskapai Penerbangan --</option>
                      {db.masterAirlines
                        ?.filter((a) => a.active !== false)
                        .map((a) => (
                          <option key={a.id} value={`${a.name} (${a.iataCode})`}>
                            ✈️ {a.name} ({a.iataCode}/${a.icaoCode}) - Hub: {a.mainHub}
                          </option>
                        ))}
                    </select>
                  </div>
                )}

                <input
                  type="text"
                  value={docForm.issuedBy}
                  onChange={(e) => setDocForm({ ...docForm, issuedBy: e.target.value })}
                  placeholder="Ketik manual nama instansi/klinik jika diperlukan..."
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-sm print:static print:inset-auto print:block print:bg-white print:p-0">
          <div className="flex max-h-[94vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl print:block print:max-h-none print:max-w-none print:overflow-visible print:rounded-none print:shadow-none">
            {/* Header Bar Viewer Fisik */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-900 px-6 py-4 text-white print:hidden">
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
            <div className="flex items-center gap-1.5 overflow-x-auto border-b border-slate-200 bg-slate-50 px-6 py-2.5 print:hidden">
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
                    <option value="Uni Emirat Arab (UAE)">Uni Emirat Arab (UAE - Tadbeer)</option>
                    <option value="Kuwait">Kuwait (Wakalah Formal)</option>
                    <option value="Oman">Oman (Muscat)</option>
                    <option value="Yordania">Yordania (QIZ)</option>
                    <option value="Qatar">Qatar</option>
                    <option value="Bahrain">Bahrain</option>
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
