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
  DocHandoverType,
  ForeignAgency,
  FundingScheme,
  JOURNEY_STAGES,
  JobVacancy,
  JourneyStage,
  LangSkillLevel,
  MedicalClinicPartner,
  OfficialRegistrationForm,
  PlacementCostItem,
  RenewalTask,
  SpecialStatus,
  Sponsor,
  SponsorFormSubmission,
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
  sponsorSubmissions?: SponsorFormSubmission[];
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
  const [financeSearchQuery, setFinanceSearchQuery] = useState<string>("");
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

  // Modal Tambah CPMI / Lead Baru (Formulir Pendaftaran Resmi PT Panca Banyu Ajisakti)
  const [showAddModal, setShowAddModal] = useState(false);
  const [regModalTab, setRegModalTab] = useState<
    "INBOX_SPONSOR" | "SCAN_DAN_WA" | "FORM_LENGKAP"
  >("INBOX_SPONSOR");
  const [activeSponsorSubmissionId, setActiveSponsorSubmissionId] = useState<string | null>(null);
  const [physicalFormScanUrl, setPhysicalFormScanUrl] = useState<string>(
    "/form-pendaftaran-asli.jpg"
  );
  const [physicalFormZoom, setPhysicalFormZoom] = useState<number>(100);
  const [waRawText, setWaRawText] = useState<string>(
    `FORMULIR PENDAFTARAN CPMI PT PANCA BANYU AJISAKTI
Nama Lengkap: Siti Munawaroh Binti H. Karim
Nama Panggilan: Muna
NIK: 3212156804990007
TTL: Indramayu, 1999-04-28
JK: P
Tinggi/Berat: 160 cm / 53 kg
Agama: Islam
Status: Kawin
Pendidikan: SMA/SMK (Lulus: 2017)
Alamat: Blok Karanganyar RT 003/001 Kec. Karangampel, Indramayu (Kode Pos: 45283)
HP: 0812-9988-4412
Nama Bapak: H. Karim (59 Th)
Nama Ibu: Hj. Maryam (54 Th)
Suami/Wali: Dadan Ramdani (33 Th - Wiraswasta)
Anak Laki: 1 Orang (5 Th) | Anak Perempuan: -
Anak Ke: 2 dari 4 Bersaudara
Kontak Darurat: Dadan Ramdani (Suami) - 0813-8877-2219
Pengalaman 1: 2020-2023 Caregiver & Housekeeping di Hong Kong (Selesai Kontrak)
Pengalaman 2: 2023-2025 Asisten Perawat Klinik Medika Cirebon
Negara Tujuan: Arab Saudi
Pekerjaan: Cleaner, Nurse
Dokumen Asli: KTP, KK, AKTE, IZIN KELUARGA, IJAZAH, PASPOR
Dokumen Copy: SKCK
Bahasa: Inggris CUKUP, Mandarin BAIK, Arab BAIK
Sponsor: Kang Dedi Kusnadi (PL-IDM-001) - 0812-2301-4455
Catatan Sponsor: Berkas fisik asli sudah lengkap diserahkan ke Data Entry.`
  );
  const [printingRegFormCandidate, setPrintingRegFormCandidate] = useState<Candidate | null>(
    null
  );
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
    destinationCountry: "Arab Saudi",
    jobSector: "Housekeeping & Caregiver (SPSK Syarikah)",
    employerName: "",
    agencyPartner: "",
    branchId: "br-idm",
    sponsorId: "sp-1",
  });
  const [regForm, setRegForm] = useState<OfficialRegistrationForm>({
    nickname: "",
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
    spouseOrGuardianName: "",
    spouseAge: 32,
    spouseOccupation: "Wiraswasta",
    boysCountAndAges: "-",
    girlsCountAndAges: "-",
    childOrder: 1,
    siblingsCount: 3,
    emergencyContactName: "",
    emergencyContactRelation: "Suami / Orang Tua",
    emergencyContactPhone: "",
    workExperience1: "",
    workExperience2: "",
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
      sttbIjazah: "ASLI",
      skck: "COPY",
      paspor: "NONE",
      otherDoc8Name: "Buku Nikah / Akte Cerai",
      otherDoc8Status: "ASLI",
      otherDoc9Name: "Pas Foto 4x6 (6 Lembar)",
      otherDoc9Status: "ASLI",
    },
    languageSkills: {
      english: "CUKUP",
      mandarin: "BURUK",
      arabic: "BAIK",
      otherLanguageName: "",
      otherLanguageLevel: "NONE",
    },
    candidateNotes: "",
    sponsorOfficerName: "Kang Dedi Kusnadi (PL-IDM-001)",
    sponsorOfficerPhone: "0812-2301-4455",
    sponsorNotes: "",
    receivedByPtOfficer: "Rina Kartika (Staf Data Entry PT Panca Banyu Ajisakti)",
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

  // Handler Salin Draft Formulir dari Antrean Sponsor ke Form Data Entry
  function handleApplySponsorSubmission(sub: SponsorFormSubmission) {
    setActiveSponsorSubmissionId(sub.id);
    setPhysicalFormScanUrl(sub.physicalFormImageUrl || "/form-pendaftaran-asli.jpg");
    setNewForm({
      stage: sub.nik && sub.nik.length === 16 ? "PROSPECT" : "LEAD",
      nik: sub.nik || "",
      fullName: sub.fullName,
      gender: sub.gender,
      avatarUrl: sub.avatarUrl || "",
      birthPlace: sub.birthPlace,
      birthDate: sub.birthDate,
      phone: sub.phone,
      address: sub.address,
      education: sub.education,
      maritalStatus: sub.maritalStatus,
      destinationCountry: sub.destinationCountry,
      jobSector: sub.jobSector,
      employerName: "",
      agencyPartner: "",
      branchId: sub.branchId,
      sponsorId: sub.sponsorId,
    });
    setRegForm({
      ...sub.registrationForm,
      receivedByPtOfficer:
        loggedInStaff?.name || "Rina Kartika (Staf Data Entry PT Panca Banyu Ajisakti)",
    });
    setRegModalTab("FORM_LENGKAP");
    setToast({
      type: "success",
      title: `Draft Formulir "${sub.fullName}" (${sub.submissionCode}) Disalin ke Form Data Entry`,
      details: [
        `Pengirim: ${sub.sponsorName} · Seluruh 35+ kolom formulir fisik PT Panca Banyu Ajisakti telah terisi otomatis.`,
        "Silakan periksa kembali checklist dokumen ASLI/COPY lalu klik 'Simpan Formulir & Daftarkan ke Sistem'.",
      ],
    });
  }

  // Handler AI OCR Ekstraksi Otomatis dari Foto Lembar Kertas Formulir Pendaftaran
  function handleRunFormOcrSimulation() {
    setNewForm({
      stage: "PROSPECT",
      nik: "3212156205970004",
      fullName: "Titi Sari Binti Kartono",
      gender: "P",
      avatarUrl: AVATAR_PRESETS[0].url,
      birthPlace: "Indramayu",
      birthDate: "1997-05-22",
      phone: "0813-9455-2210",
      address: "Blok Desa RT 004/002 Desa Juntinyuat, Kec. Juntinyuat, Kab. Indramayu",
      education: "SMA/SMK",
      maritalStatus: "Kawin",
      destinationCountry: "Arab Saudi",
      jobSector: "Housekeeping & Caregiver (SPSK Syarikah)",
      employerName: "",
      agencyPartner: "",
      branchId: "br-idm",
      sponsorId: "sp-1",
    });
    setRegForm({
      nickname: "Titi",
      heightCm: 159,
      weightKg: 54,
      religion: "Islam",
      postalCode: "45282",
      graduationYear: "2015",
      ktpOrPassportNo: "3212156205970004",
      fatherName: "Kartono",
      fatherAge: 58,
      motherName: "Rasminah",
      motherAge: 53,
      spouseOrGuardianName: "Hendrik Setiawan",
      spouseAge: 32,
      spouseOccupation: "Nelayan / Wiraswasta",
      boysCountAndAges: "1 Orang (6 Th)",
      girlsCountAndAges: "-",
      childOrder: 1,
      siblingsCount: 3,
      emergencyContactName: "Hendrik Setiawan",
      emergencyContactRelation: "Suami Kandung",
      emergencyContactPhone: "0852-2411-9088",
      workExperience1: "2019 - 2023 : Asisten Rumah Tangga & Babysitter di Jakarta (4 Tahun)",
      workExperience2: "2023 - 2025 : Eks-PMI Arab Saudi (Riyadh) - Selesai Kontrak 2 Tahun Baik",
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
        sttbIjazah: "ASLI",
        skck: "COPY",
        paspor: "ASLI",
        otherDoc8Name: "Buku Nikah Asli",
        otherDoc8Status: "ASLI",
        otherDoc9Name: "Paspor Lama Eks-Riyadh",
        otherDoc9Status: "ASLI",
      },
      languageSkills: {
        english: "CUKUP",
        mandarin: "BURUK",
        arabic: "BAIK",
        otherLanguageName: "",
        otherLanguageLevel: "NONE",
      },
      candidateNotes: "Hasil bacaan AI OCR dari foto lembar Formulir Pendaftaran fisik.",
      sponsorOfficerName: "Kang Dedi Kusnadi (PL-IDM-001)",
      sponsorOfficerPhone: "0812-2301-4455",
      sponsorNotes: "Dokumen fisik asli KTP, KK, Akte, Ijazah, Buku Nikah & Izin Suami lengkap.",
      receivedByPtOfficer:
        loggedInStaff?.name || "Rina Kartika (Staf Data Entry PT Panca Banyu Ajisakti)",
      formSignedDate: new Date().toISOString().slice(0, 10),
    });
    setToast({
      type: "success",
      title: "✨ AI OCR Berhasil Mengekstrak Isi Foto Formulir Fisik!",
      details: [
        "Biodata, Tinggi/Berat Badan, Data Orang Tua/Suami, Pengalaman Kerja, Checklist Dokumen ASLI/COPY, dan Bahasa berhasil disalin ke formulir.",
      ],
    });
  }

  // Handler Smart Parser Format Chat WhatsApp dari Sponsor Lapangan
  function handleParseWhatsAppText() {
    const lines = waRawText.split("\n");
    const getVal = (keyPattern: RegExp): string => {
      const found = lines.find((l) => keyPattern.test(l));
      if (!found) return "";
      const idx = found.indexOf(":");
      return idx >= 0 ? found.slice(idx + 1).trim() : "";
    };

    const fullName = getVal(/nama lengkap/i) || "Siti Munawaroh Binti H. Karim";
    const nickname = getVal(/nama panggilan/i) || fullName.split(" ")[0] || "Muna";
    const nikRaw = getVal(/^nik/i).replace(/\D/g, "").slice(0, 16);
    const ttlRaw = getVal(/ttl|tempat/i);
    const [birthPlacePart, birthDatePart] = ttlRaw.includes(",")
      ? ttlRaw.split(",").map((s) => s.trim())
      : ["Indramayu", "1999-04-28"];
    const jkRaw = getVal(/^jk|jenis kelamin/i).toUpperCase();
    const gender: "P" | "L" = jkRaw.startsWith("L") ? "L" : "P";
    const tbBbRaw = getVal(/tinggi/i);
    const tbMatch = tbBbRaw.match(/(\d{3})/);
    const bbMatch = tbBbRaw.match(/\/\s*(\d{2,3})/);
    const religion = getVal(/agama/i) || "Islam";
    const maritalStatus = getVal(/^status/i) || "Kawin";
    const eduRaw = getVal(/pendidikan/i);
    const gradMatch = eduRaw.match(/(\d{4})/);
    const addrRaw = getVal(/alamat/i);
    const postalMatch = addrRaw.match(/(\d{5})/);
    const phone = getVal(/^hp|telp/i) || "0812-9988-4412";
    const fatherRaw = getVal(/nama bapak/i);
    const fatherAgeMatch = fatherRaw.match(/(\d{2})/);
    const motherRaw = getVal(/nama ibu/i);
    const motherAgeMatch = motherRaw.match(/(\d{2})/);
    const spouseRaw = getVal(/suami|istri|wali/i);
    const spouseAgeMatch = spouseRaw.match(/(\d{2})/);
    const emergRaw = getVal(/kontak darurat/i);
    const exp1 = getVal(/pengalaman 1/i);
    const exp2 = getVal(/pengalaman 2/i);
    const dest = getVal(/negara tujuan/i) || "Arab Saudi";
    const jobRaw = getVal(/pekerjaan/i);
    const docAsliRaw = getVal(/dokumen asli/i).toUpperCase();
    const docCopyRaw = getVal(/dokumen copy/i).toUpperCase();
    const sponsorRaw = getVal(/^sponsor/i);
    const sponsorNotes = getVal(/catatan sponsor/i);

    const resolveDoc = (keyword: string): DocHandoverType => {
      if (docAsliRaw.includes(keyword)) return "ASLI";
      if (docCopyRaw.includes(keyword)) return "COPY";
      return "NONE";
    };

    setNewForm((prev) => ({
      ...prev,
      stage: nikRaw.length === 16 ? "PROSPECT" : "LEAD",
      nik: nikRaw,
      fullName,
      gender,
      avatarUrl: gender === "L" ? AVATAR_PRESETS[3].url : AVATAR_PRESETS[0].url,
      birthPlace: birthPlacePart || "Indramayu",
      birthDate: birthDatePart || "1999-04-28",
      phone,
      address: addrRaw.replace(/\(Kode Pos:.*?\)/i, "").trim() || prev.address,
      education: eduRaw.split("(")[0].trim() || "SMA/SMK",
      maritalStatus,
      destinationCountry: dest,
      jobSector: jobRaw || "Housekeeping & Caregiver",
    }));

    setRegForm((prev) => ({
      ...prev,
      nickname,
      heightCm: tbMatch ? Number(tbMatch[1]) : 160,
      weightKg: bbMatch ? Number(bbMatch[1]) : 53,
      religion,
      postalCode: postalMatch ? postalMatch[1] : "45283",
      graduationYear: gradMatch ? gradMatch[1] : "2017",
      ktpOrPassportNo: nikRaw,
      fatherName: fatherRaw.split("(")[0].trim() || "H. Karim",
      fatherAge: fatherAgeMatch ? Number(fatherAgeMatch[1]) : 59,
      motherName: motherRaw.split("(")[0].trim() || "Hj. Maryam",
      motherAge: motherAgeMatch ? Number(motherAgeMatch[1]) : 54,
      spouseOrGuardianName: spouseRaw.split("(")[0].trim() || "Dadan Ramdani",
      spouseAge: spouseAgeMatch ? Number(spouseAgeMatch[1]) : 33,
      emergencyContactName: emergRaw.split("(")[0].trim() || "Dadan Ramdani",
      emergencyContactRelation: "Suami / Keluarga",
      emergencyContactPhone: (emergRaw.split("-").pop() || "").trim() || phone,
      workExperience1: exp1 || prev.workExperience1,
      workExperience2: exp2 || prev.workExperience2,
      desiredJobCleaner: /clean/i.test(jobRaw),
      desiredJobFactory: /pabrik|factory/i.test(jobRaw),
      desiredJobNurse: /nurse|perawat|caregiver/i.test(jobRaw),
      desiredJobHospitality: /hotel|hospitality/i.test(jobRaw),
      docHandover: {
        ...prev.docHandover,
        ktp: resolveDoc("KTP"),
        kk: resolveDoc("KK"),
        akteKelahiran: resolveDoc("AKTE"),
        izinKeluarga: resolveDoc("IZIN"),
        sttbIjazah: resolveDoc("IJAZAH"),
        skck: resolveDoc("SKCK"),
        paspor: resolveDoc("PASPOR"),
      },
      sponsorOfficerName: sponsorRaw.split("-")[0].trim() || prev.sponsorOfficerName,
      sponsorOfficerPhone: (sponsorRaw.split("-").slice(1).join("-") || "").trim() || prev.sponsorOfficerPhone,
      sponsorNotes: sponsorNotes || prev.sponsorNotes,
    }));

    setRegModalTab("FORM_LENGKAP");
    setToast({
      type: "success",
      title: `📲 Chat WhatsApp Sponsor Berhasil Dikonversi ke Formulir (${fullName})`,
      details: [
        "Seluruh atribut biodata, keluarga, pengalaman kerja, dan status dokumen ASLI/COPY otomatis masuk ke kolom formulir.",
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

            <a
              href="/flowchart-pasmigranpro.html"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-sky-300 bg-sky-50 px-3 py-2 text-xs font-bold text-sky-900 shadow-xs transition hover:bg-sky-100"
            >
              <FolderKanban className="h-3.5 w-3.5 text-sky-700" />
              🗺️ Flowchart (PDF)
            </a>

            <a
              href="/erd-dfd-pasmigranpro.html"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-purple-300 bg-purple-50 px-3 py-2 text-xs font-bold text-purple-900 shadow-xs transition hover:bg-purple-100"
            >
              <FolderKanban className="h-3.5 w-3.5 text-purple-700" />
              🗄️ ERD & DFD (PDF)
            </a>

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

                    {/* Baris Filter Cepat Sponsor (Chip Ringkas) */}
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setFinanceSponsorFilter("ALL")}
                        className={`rounded-lg border px-3 py-1.5 text-xs font-bold transition ${
                          financeSponsorFilter === "ALL"
                            ? "border-slate-900 bg-slate-900 text-white"
                            : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                        }`}
                      >
                        Semua Sponsor ({db.sponsors.length})
                      </button>
                      {db.sponsors.map((sp) => {
                        const active = financeSponsorFilter === sp.id;
                        return (
                          <button
                            key={sp.id}
                            type="button"
                            onClick={() =>
                              setFinanceSponsorFilter(active ? "ALL" : sp.id)
                            }
                            className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs transition ${
                              active
                                ? "border-emerald-600 bg-emerald-600 text-white font-bold"
                                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                            }`}
                          >
                            <span className="font-semibold">{sp.name}</span>
                            <span
                              className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                                active
                                  ? "bg-white/20 text-white"
                                  : "bg-rose-50 text-rose-700"
                              }`}
                            >
                              Sisa: {formatRupiah(sp.payableAmount)}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Baris Pencarian & Filter Status Pembayaran */}
                    <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-12">
                      <div className="relative sm:col-span-6">
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
                      <div className="sm:col-span-3">
                        <select
                          value={financeSponsorFilter}
                          onChange={(e) => setFinanceSponsorFilter(e.target.value)}
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-800"
                        >
                          <option value="ALL">Pilih Sponsor / PL (Semua)</option>
                          {db.sponsors.map((sp) => (
                            <option key={sp.id} value={sp.id}>
                              {sp.code} · {sp.name}
                            </option>
                          ))}
                        </select>
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
                                  <th className="py-3 px-2.5 text-center">DP 1 (20%)</th>
                                  <th className="py-3 px-2.5 text-center">DP 2 (25%)</th>
                                  <th className="py-3 px-2.5 text-center">DP 3 (25%)</th>
                                  <th className="py-3 px-2.5 text-center">Pelunasan (30%)</th>
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
                                                {formatRupiah(inst.amount)}
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
          MODAL FORMULIR PENDAFTARAN CPMI/CTKI RESMI PT PANCA BANYU AJISAKTI
          (MENCAKUP IDE 1: SPLIT-SCREEN AI OCR & WA PARSER, IDE 2: INBOX SERAH-TERIMA SPONSOR, IDE 3: FORMULIR LENGKAP & CETAK FISIK)
         ========================================================= */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-3 sm:p-5 backdrop-blur-sm">
          <div className="flex max-h-[94vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
            {/* HEADER RESMI PT PANCA BANYU AJISAKTI */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 bg-slate-900 px-6 py-4 text-white">
              <div className="flex items-center gap-3.5">
                <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl border-2 border-rose-500 bg-white text-rose-600 shadow-sm">
                  <span className="text-lg font-black leading-none">▲</span>
                  <span className="text-[8px] font-black tracking-tighter text-slate-900">
                    PBA
                  </span>
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded bg-sky-500 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-white">
                      FORMULIR PENDAFTARAN CPMI/CTKI RESMI
                    </span>
                    <span className="text-xs font-bold text-amber-300">
                      PT. PANCA BANYU AJISAKTI — Indonesia Manpower Service
                    </span>
                  </div>
                  <h3 className="mt-0.5 text-base sm:text-lg font-bold text-white">
                    Pusat Akuisisi Formulir Sponsor & Input Data Entry Terpadu
                  </h3>
                  <p className="text-[11px] text-slate-300">
                    Jl. Kayu Manis No. 51, Kel. Balekambang, Kec. Kramatjati, Jakarta Timur · NIK 16 Digit Dijaga Unik Lintas Cabang
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const tempCand: Candidate = {
                      id: "temp-preview",
                      regNumber: `P3MI-2026-${String((db.candidates?.length || 11) + 101).padStart(
                        4,
                        "0"
                      )}`,
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
                  onClick={() => setShowAddModal(false)}
                  className="rounded-lg bg-white/10 p-1.5 text-slate-300 hover:bg-white/20 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* 3 TAB MODE PENYALINAN DATA SPONSOR -> USER DATA ENTRY */}
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
                  <span>📥 1. Antrean Draft Formulir dari Sponsor</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold ${
                      regModalTab === "INBOX_SPONSOR"
                        ? "bg-emerald-400 text-slate-950"
                        : "bg-emerald-100 text-emerald-800"
                    }`}
                  >
                    {db.sponsorSubmissions?.filter((s) => s.status === "MENUNGGU_DATA_ENTRY")
                      .length || 0}{" "}
                    Menunggu
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
                  <span>📸 2. Scan Foto Kertas Formulir & Tempel WA Sponsor (Auto-Fill)</span>
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
                  <span>📝 3. Formulir Lengkap PT Panca Banyu Ajisakti (Verifikasi Data Entry)</span>
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
                  TAB 1: ANTREAN SERAH-TERIMA DRAFT FORMULIR SPONSOR -> DATA ENTRY (IDE 2)
                 ========================================================= */}
              {regModalTab === "INBOX_SPONSOR" && (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4">
                    <div>
                      <span className="rounded bg-emerald-600 px-2 py-0.5 text-[10px] font-bold uppercase text-white">
                        ALUR SERAH-TERIMA SPONSOR LAPANGAN ➔ USER DATA ENTRY
                      </span>
                      <h4 className="mt-1 text-sm font-bold text-slate-900">
                        Daftar Formulir Pendaftaran CPMI yang Dikirim oleh Sponsor (Siap Disalin 1-Klik)
                      </h4>
                      <p className="text-xs text-slate-600">
                        Sponsor mengisi/mengunggah formulir dari lapangan. User Data Entry cukup klik{" "}
                        <strong>&ldquo;⚡ Salin ke Form Data Entry&rdquo;</strong> tanpa perlu mengetik ulang puluhan kolom dari awal.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={async () => {
                        const randNum = Math.floor(1000 + Math.random() * 8999);
                        const { data } = await callApi("CREATE_SPONSOR_SUBMISSION", {
                          sponsorId: "sp-1",
                          branchId: "br-idm",
                          sourceMethod: "FORM_DIGITAL_SPONSOR",
                          physicalFormImageUrl: "/form-pendaftaran-asli.jpg",
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
                            heightCm: 158,
                            weightKg: 52,
                            ktpOrPassportNo: `321215580998${randNum}`,
                            fatherName: "H. 워노 (Wono)",
                            fatherAge: 57,
                            motherName: "Hj. রোহিত (Rohimah)",
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
                              "Formulir fisik dan berkas ASLI KTP, KK, Akte, Ijazah, Buku Nikah diserahkan ke meja Data Entry.",
                          },
                        });
                        if (data.ok) {
                          setToast({
                            type: "success",
                            title: `Simulasi Kiriman Formulir Sponsor (${data.submission.submissionCode}) Masuk ke Antrean!`,
                          });
                        }
                      }}
                      className="rounded-xl bg-emerald-700 px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-800"
                    >
                      + Simulasikan Sponsor Kirim Formulir Baru
                    </button>
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
                          IDE 1 · SPLIT-SCREEN SCAN FORMULIR FISIK
                        </span>
                        <h4 className="text-xs font-bold">
                          Lembar Kertas &ldquo;FORMULIR PENDAFTARAN CPMI/CTKI&rdquo; dari Sponsor
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
                      <label className="cursor-pointer inline-flex items-center gap-1.5 rounded-xl border border-sky-300 bg-sky-50 px-3 py-2 text-xs font-bold text-sky-900 hover:bg-sky-100">
                        <span>📤 Upload Foto Formulir Kertas dari HP Sponsor (JPG/PNG)</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            const reader = new FileReader();
                            reader.onload = () => {
                              setPhysicalFormScanUrl(String(reader.result || ""));
                              setToast({
                                type: "success",
                                title: `Foto Formulir Kertas "${file.name}" Berhasil Dimuat`,
                                details: [
                                  "Klik tombol '✨ Ekstrak Isi Foto Formulir Otomatis (AI OCR)' untuk menyalin isinya ke form Data Entry.",
                                ],
                              });
                            };
                            reader.readAsDataURL(file);
                          }}
                        />
                      </label>

                      <button
                        type="button"
                        onClick={() => {
                          handleRunFormOcrSimulation();
                          setRegModalTab("FORM_LENGKAP");
                        }}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-sky-600 to-teal-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:from-sky-700 hover:to-teal-700"
                      >
                        <Sparkles className="h-4 w-4" />
                        ✨ Ekstrak Isi Foto Formulir Otomatis (AI OCR)
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
                          alt="Scan Formulir Pendaftaran CPMI PT Panca Banyu Ajisakti"
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
                            SMART WHATSAPP PARSER SPONSOR ➔ DATA ENTRY
                          </span>
                          <h4 className="mt-1 text-sm font-bold text-slate-900">
                            Tempel Chat WhatsApp dari Sponsor Lapangan ➔ Auto-Fill 35+ Kolom
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
                              title: "Template Format WA Sponsor Disalin ke Clipboard!",
                              details: [
                                "Kirimkan format ini ke grup WhatsApp Sponsor Lapangan agar mereka mudah mengirim data sesuai urutan formulir PT Panca Banyu Ajisakti.",
                              ],
                            });
                          }}
                          className="rounded-lg border border-teal-300 bg-white px-2.5 py-1.5 text-[11px] font-bold text-teal-800 hover:bg-teal-100"
                        >
                          📋 Copy Template WA untuk Sponsor
                        </button>
                      </div>

                      <textarea
                        rows={11}
                        value={waRawText}
                        onChange={(e) => setWaRawText(e.target.value)}
                        placeholder="Tempel (Paste) pesan WhatsApp berisi biodata CPMI dari Sponsor di sini..."
                        className="w-full rounded-xl border border-slate-300 bg-white p-3 font-mono text-[11px] leading-relaxed text-slate-800"
                      />

                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-[11px] text-slate-600">
                          Otomatis mengenali Biodata, Tinggi/Berat, Orang Tua, Suami/Wali, Pengalaman, Dokumen ASLI/COPY & Bahasa.
                        </span>
                        <button
                          type="button"
                          onClick={handleParseWhatsAppText}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-teal-700 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-teal-800"
                        >
                          ⚡ Konversi Chat WA ke Formulir Lengkap →
                        </button>
                      </div>
                    </div>

                    {/* Ringkasan Cepat Data yang Sudah Masuk ke Memori Formulir */}
                    <div className="rounded-2xl border border-slate-200 bg-white p-4 text-xs space-y-2">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                        <strong className="text-slate-900">
                          Status Data di Memori Formulir Saat Ini:
                        </strong>
                        <button
                          type="button"
                          onClick={() => setRegModalTab("FORM_LENGKAP")}
                          className="font-bold text-sky-700 hover:underline"
                        >
                          Buka Formulir Lengkap (35+ Kolom) →
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-[11px]">
                        <div>
                          <span className="text-slate-400 block">Nama Lengkap & Panggilan:</span>
                          <strong className="text-slate-900">
                            {newForm.fullName || "(Belum diisi)"}{" "}
                            {regForm.nickname ? `(${regForm.nickname})` : ""}
                          </strong>
                        </div>
                        <div>
                          <span className="text-slate-400 block">NIK / No. KTP:</span>
                          <strong className="font-mono text-teal-700">
                            {newForm.nik || "(Belum diisi)"}
                          </strong>
                        </div>
                        <div>
                          <span className="text-slate-400 block">Tinggi / Berat & Tujuan:</span>
                          <strong className="text-slate-900">
                            {regForm.heightCm} cm / {regForm.weightKg} kg ·{" "}
                            {newForm.destinationCountry}
                          </strong>
                        </div>
                        <div>
                          <span className="text-slate-400 block">Sponsor Pengirim:</span>
                          <strong className="text-slate-900">{regForm.sponsorOfficerName}</strong>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* =========================================================
                  TAB 3: FORMULIR LENGKAP PT PANCA BANYU AJISAKTI (100% MEWAKILI KERTAS FISIK)
                 ========================================================= */}
              {regModalTab === "FORM_LENGKAP" && (
                <form onSubmit={handleCreateCandidate} className="space-y-6 text-xs">
                  {activeSponsorSubmissionId && (
                    <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-xs text-emerald-950">
                      <div>
                        <strong>✓ Mode Verifikasi Serah-Terima Sponsor Aktif:</strong> Data di bawah disalin otomatis dari draft Sponsor. Setelah Anda klik{" "}
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

                  {/* BAGIAN A: PAS FOTO 4x6 & IDENTITAS PRIBADI + FISIK (SESUAI BARIS ATAS FORMULIR) */}
                  <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2.5">
                      <div>
                        <span className="rounded bg-slate-900 px-2 py-0.5 text-[10px] font-bold uppercase text-white">
                          BAGIAN 1 · IDENTITAS PRIBADI & FISIK CPMI/CTKI
                        </span>
                        <h4 className="mt-1 text-sm font-bold text-slate-900">
                          Biodata Diri, Tinggi/Berat Badan, Pendidikan & Nomor KTP/Paspor
                        </h4>
                      </div>
                      <span className="font-mono text-xs font-bold text-sky-800 bg-sky-100 px-2.5 py-1 rounded-lg">
                        No. Pendaftaran Otomatis: P3MI-2026-
                        {String((db.candidates?.length || 11) + 101).padStart(4, "0")}
                      </span>
                    </div>

                    {/* Pilihan Pas Foto 4x6 */}
                    <div className="flex flex-wrap items-center gap-4 rounded-xl border border-slate-200 bg-white p-3">
                      <img
                        src={newForm.avatarUrl || AVATAR_PRESETS[0].url}
                        alt="Pas Foto 4x6"
                        className="h-20 w-16 shrink-0 rounded-lg border-2 border-blue-700 object-cover shadow-xs"
                      />
                      <div className="flex-1 space-y-2">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="font-bold text-slate-800">
                            📷 Kotak Pas Foto Resmi 4x6 (Tampil di Sudut Kanan Atas Formulir Cetak, e-KTP & Paspor)
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
                                    : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
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
                    </div>

                    <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
                      <div className="lg:col-span-2">
                        <label className="font-bold text-slate-700 block mb-1">
                          Nama Lengkap (Sesuai KTP) *
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
                          Nama Panggilan
                        </label>
                        <input
                          type="text"
                          value={regForm.nickname}
                          onChange={(e) => setRegForm({ ...regForm, nickname: e.target.value })}
                          placeholder="Nama panggilan"
                          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2"
                        />
                      </div>

                      <div>
                        <label className="font-bold text-slate-700 block mb-1">
                          Tahap Awal Sistem
                        </label>
                        <select
                          value={newForm.stage}
                          onChange={(e) =>
                            setNewForm({ ...newForm, stage: e.target.value as JourneyStage })
                          }
                          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-semibold"
                        >
                          <option value="LEAD">Lead (NIK Boleh Menyusul)</option>
                          <option value="PROSPECT">Prospect (NIK 16 Digit Wajib)</option>
                        </select>
                      </div>

                      <div>
                        <label className="font-bold text-slate-700 block mb-1">
                          Tempat Lahir
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
                          Tanggal Lahir (DD-MM-YYYY)
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
                          Tinggi Badan (Cm)
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
                          Berat Badan (Kg)
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

                      <div>
                        <label className="font-bold text-slate-700 block mb-1">Agama</label>
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
                          Jenis Kelamin
                        </label>
                        <select
                          value={newForm.gender}
                          onChange={(e) =>
                            setNewForm({ ...newForm, gender: e.target.value as "P" | "L" })
                          }
                          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2"
                        >
                          <option value="P">Perempuan (P)</option>
                          <option value="L">Laki-Laki (L)</option>
                        </select>
                      </div>

                      <div>
                        <label className="font-bold text-slate-700 block mb-1">
                          Status Perkawinan
                        </label>
                        <select
                          value={newForm.maritalStatus}
                          onChange={(e) =>
                            setNewForm({ ...newForm, maritalStatus: e.target.value })
                          }
                          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2"
                        >
                          <option value="Belum Kawin">Belum Kawin</option>
                          <option value="Kawin">Kawin</option>
                          <option value="Cerai Hidup">Cerai Hidup</option>
                          <option value="Cerai Mati">Cerai Mati</option>
                        </select>
                      </div>

                      <div>
                        <label className="font-bold text-slate-700 block mb-1">
                          Telp / HP Aktif *
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

                      <div className="lg:col-span-3">
                        <label className="font-bold text-slate-700 block mb-1">
                          Alamat Lengkap (Sesuai KTP / Formulir)
                        </label>
                        <input
                          type="text"
                          value={newForm.address}
                          onChange={(e) => setNewForm({ ...newForm, address: e.target.value })}
                          placeholder="Nama Jalan/Blok, RT/RW, Desa/Kelurahan, Kecamatan, Kabupaten"
                          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2"
                        />
                      </div>

                      <div>
                        <label className="font-bold text-slate-700 block mb-1">Kode Pos</label>
                        <input
                          type="text"
                          value={regForm.postalCode}
                          onChange={(e) => setRegForm({ ...regForm, postalCode: e.target.value })}
                          placeholder="45282"
                          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono"
                        />
                      </div>

                      <div>
                        <label className="font-bold text-slate-700 block mb-1">
                          Pendidikan Terakhir
                        </label>
                        <select
                          value={newForm.education}
                          onChange={(e) => setNewForm({ ...newForm, education: e.target.value })}
                          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2"
                        >
                          <option value="SD">SD / Sederajat</option>
                          <option value="SMP">SMP / MTs</option>
                          <option value="SMA/SMK">SMA / SMK / MA</option>
                          <option value="D3/S1">Diploma / Sarjana (D3/S1)</option>
                        </select>
                      </div>

                      <div>
                        <label className="font-bold text-slate-700 block mb-1">
                          Lulus Tahun
                        </label>
                        <input
                          type="text"
                          value={regForm.graduationYear}
                          onChange={(e) =>
                            setRegForm({ ...regForm, graduationYear: e.target.value })
                          }
                          placeholder="2018"
                          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono"
                        />
                      </div>

                      <div className="lg:col-span-2">
                        <label className="font-bold text-slate-700 block mb-1">
                          No. KTP (NIK 16 Digit Unik) / Paspor{" "}
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

                  {/* BAGIAN B: DATA KELUARGA (BAPAK, IBU, SUAMI/ISTRI/WALI, ANAK, BERSAUDARA & KONTAK DARURAT) */}
                  <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 space-y-4">
                    <div className="border-b border-slate-200 pb-2">
                      <span className="rounded bg-slate-900 px-2 py-0.5 text-[10px] font-bold uppercase text-white">
                        BAGIAN 2 · DATA ORANG TUA, SUAMI/ISTRI/WALI, ANAK & KONTAK DARURAT
                      </span>
                      <h4 className="mt-1 text-sm font-bold text-slate-900">
                        Keluarga Kandung & Keluarga yang Mudah Dihubungi (Sesuai Lembar Formulir)
                      </h4>
                    </div>

                    <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
                      <div>
                        <label className="font-bold text-slate-700 block mb-1">Nama Bapak</label>
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
                          Umur Bapak (Th)
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
                        <label className="font-bold text-slate-700 block mb-1">Nama Ibu</label>
                        <input
                          type="text"
                          value={regForm.motherName}
                          onChange={(e) => setRegForm({ ...regForm, motherName: e.target.value })}
                          placeholder="Nama ibu kandung"
                          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2"
                        />
                      </div>
                      <div>
                        <label className="font-bold text-slate-700 block mb-1">
                          Umur Ibu (Th)
                        </label>
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
                        <label className="font-bold text-slate-700 block mb-1">
                          Nama Suami / Istri / Wali Pemberi Izin
                        </label>
                        <input
                          type="text"
                          value={regForm.spouseOrGuardianName}
                          onChange={(e) =>
                            setRegForm({ ...regForm, spouseOrGuardianName: e.target.value })
                          }
                          placeholder="Nama suami / istri / wali resmi"
                          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2"
                        />
                      </div>
                      <div>
                        <label className="font-bold text-slate-700 block mb-1">
                          Umur Suami/Istri/Wali (Th)
                        </label>
                        <input
                          type="number"
                          value={regForm.spouseAge || ""}
                          onChange={(e) =>
                            setRegForm({ ...regForm, spouseAge: Number(e.target.value) })
                          }
                          placeholder="33"
                          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono"
                        />
                      </div>
                      <div>
                        <label className="font-bold text-slate-700 block mb-1">
                          Pekerjaan Suami/Istri/Wali
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

                      <div className="lg:col-span-2">
                        <label className="font-bold text-slate-700 block mb-1">
                          Jumlah dan Umur Anak Laki-laki
                        </label>
                        <input
                          type="text"
                          value={regForm.boysCountAndAges}
                          onChange={(e) =>
                            setRegForm({ ...regForm, boysCountAndAges: e.target.value })
                          }
                          placeholder="Contoh: 1 Orang (6 Th) atau -"
                          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2"
                        />
                      </div>
                      <div className="lg:col-span-2">
                        <label className="font-bold text-slate-700 block mb-1">
                          Jumlah dan Umur Anak Perempuan
                        </label>
                        <input
                          type="text"
                          value={regForm.girlsCountAndAges}
                          onChange={(e) =>
                            setRegForm({ ...regForm, girlsCountAndAges: e.target.value })
                          }
                          placeholder="Contoh: 1 Orang (4 Th) atau -"
                          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2"
                        />
                      </div>

                      <div>
                        <label className="font-bold text-slate-700 block mb-1">
                          Saya Anak Ke- ... Dari ... Bersaudara
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            value={regForm.childOrder || ""}
                            onChange={(e) =>
                              setRegForm({ ...regForm, childOrder: Number(e.target.value) })
                            }
                            placeholder="1"
                            className="w-20 rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-center font-mono"
                          />
                          <span className="text-slate-500 font-semibold">dari</span>
                          <input
                            type="number"
                            value={regForm.siblingsCount || ""}
                            onChange={(e) =>
                              setRegForm({ ...regForm, siblingsCount: Number(e.target.value) })
                            }
                            placeholder="3"
                            className="w-20 rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-center font-mono"
                          />
                          <span className="text-slate-500 text-[11px]">Bersaudara</span>
                        </div>
                      </div>

                      <div>
                        <label className="font-bold text-slate-700 block mb-1">
                          Nama Keluarga yg Mudah Dihubungi
                        </label>
                        <input
                          type="text"
                          value={regForm.emergencyContactName}
                          onChange={(e) =>
                            setRegForm({ ...regForm, emergencyContactName: e.target.value })
                          }
                          placeholder="Nama kontak darurat"
                          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2"
                        />
                      </div>

                      <div>
                        <label className="font-bold text-slate-700 block mb-1">
                          Hubungan Keluarga
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

                      <div>
                        <label className="font-bold text-slate-700 block mb-1">
                          No. Telp / HP Keluarga Darurat
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

                  {/* BAGIAN C: PENGALAMAN KERJA 1 & 2, NEGARA TUJUAN, DAN CHECKBOX PEKERJAAN YANG DIINGINKAN */}
                  <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 space-y-4">
                    <div className="border-b border-slate-200 pb-2">
                      <span className="rounded bg-slate-900 px-2 py-0.5 text-[10px] font-bold uppercase text-white">
                        BAGIAN 3 · PENGALAMAN KERJA, NEGARA TUJUAN & PEKERJAAN YANG DIINGINKAN
                      </span>
                      <h4 className="mt-1 text-sm font-bold text-slate-900">
                        Riwayat Pengalaman Kerja 1 & 2 serta Pilihan Sektor Pekerjaan
                      </h4>
                    </div>

                    <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                      <div>
                        <label className="font-bold text-slate-700 block mb-1">
                          Pengalaman Kerja 1
                        </label>
                        <input
                          type="text"
                          value={regForm.workExperience1}
                          onChange={(e) =>
                            setRegForm({ ...regForm, workExperience1: e.target.value })
                          }
                          placeholder="Tahun, Tempat & Posisi Pengalaman Kerja 1"
                          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2"
                        />
                      </div>
                      <div>
                        <label className="font-bold text-slate-700 block mb-1">
                          Pengalaman Kerja 2
                        </label>
                        <input
                          type="text"
                          value={regForm.workExperience2}
                          onChange={(e) =>
                            setRegForm({ ...regForm, workExperience2: e.target.value })
                          }
                          placeholder="Tahun, Tempat & Posisi Pengalaman Kerja 2"
                          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2"
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
                          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-bold"
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
                          Sektor / Jabatan Spesifik di Sistem
                        </label>
                        <input
                          type="text"
                          value={newForm.jobSector}
                          onChange={(e) => setNewForm({ ...newForm, jobSector: e.target.value })}
                          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2"
                        />
                      </div>
                    </div>

                    {/* 5 CHECKBOX PEKERJAAN YANG DIINGINKAN SESUAI FORMULIR ASLI */}
                    <div className="rounded-xl border border-slate-200 bg-white p-3">
                      <label className="font-bold text-slate-800 block mb-2">
                        Kotak Centang &ldquo;Pekerjaan yang diinginkan&rdquo; (Sesuai Lembar Formulir PT Panca Banyu Ajisakti):
                      </label>
                      <div className="flex flex-wrap items-center gap-4">
                        {[
                          { key: "desiredJobCleaner", label: "Cleaner (Kebersihan / PRT)" },
                          { key: "desiredJobFactory", label: "Pekerja Pabrik (Manufaktur)" },
                          { key: "desiredJobNurse", label: "Nurse / Caregiver (Perawat)" },
                          { key: "desiredJobHospitality", label: "Hospitality (Perhotelan)" },
                          { key: "desiredJobOther", label: "Pekerja Lain" },
                        ].map((item) => {
                          const checked = Boolean(
                            regForm[item.key as keyof OfficialRegistrationForm]
                          );
                          return (
                            <label
                              key={item.key}
                              className={`inline-flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-1.5 font-semibold transition ${
                                checked
                                  ? "border-sky-600 bg-sky-50 text-sky-900"
                                  : "border-slate-200 bg-slate-50 text-slate-600"
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={(e) =>
                                  setRegForm({
                                    ...regForm,
                                    [item.key]: e.target.checked,
                                  })
                                }
                                className="h-4 w-4 rounded text-sky-600"
                              />
                              {item.label}
                            </label>
                          );
                        })}
                        {regForm.desiredJobOther && (
                          <input
                            type="text"
                            value={regForm.desiredJobOtherText}
                            onChange={(e) =>
                              setRegForm({ ...regForm, desiredJobOtherText: e.target.value })
                            }
                            placeholder="Sebutkan pekerjaan lain..."
                            className="rounded-lg border border-slate-300 px-3 py-1.5"
                          />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* BAGIAN D & E: TABEL DOKUMEN (ASLI / COPY) & TABEL KEMAMPUAN BAHASA (BAIK / CUKUP / BURUK) */}
                  <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
                    {/* TABEL 9 DOKUMEN SERAH TERIMA (ASLI / COPY) */}
                    <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 lg:col-span-7 space-y-3">
                      <div>
                        <span className="rounded bg-teal-700 px-2 py-0.5 text-[10px] font-bold uppercase text-white">
                          BAGIAN 4 · DOKUMEN YANG DISERAHKAN (ASLI / COPY)
                        </span>
                        <h4 className="mt-1 text-sm font-bold text-slate-900">
                          Checklist Serah-Terima 9 Dokumen Fisik (Otomatis Sinkron ke Berkas Digital)
                        </h4>
                      </div>

                      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                        <table className="w-full text-left text-xs">
                          <thead className="border-b border-slate-200 bg-slate-100 text-[10px] font-bold uppercase text-slate-700">
                            <tr>
                              <th className="px-3 py-2">No.</th>
                              <th className="px-3 py-2">Nama Dokumen</th>
                              <th className="px-3 py-2 text-center">ASLI</th>
                              <th className="px-3 py-2 text-center">COPY</th>
                              <th className="px-3 py-2 text-center">Belum Ada</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {[
                              { no: 1, key: "ktp", label: "KTP" },
                              { no: 2, key: "kk", label: "KARTU KELUARGA" },
                              { no: 3, key: "akteKelahiran", label: "AKTE KELAHIRAN" },
                              { no: 4, key: "izinKeluarga", label: "IZIN KELUARGA" },
                              { no: 5, key: "sttbIjazah", label: "STTB / IJAZAH" },
                              { no: 6, key: "skck", label: "S K C K" },
                              { no: 7, key: "paspor", label: "PASPOR" },
                            ].map((docRow) => {
                              const curVal =
                                regForm.docHandover[
                                  docRow.key as keyof typeof regForm.docHandover
                                ] as DocHandoverType;
                              return (
                                <tr key={docRow.key} className="hover:bg-slate-50">
                                  <td className="px-3 py-2 font-mono font-bold text-slate-500">
                                    {docRow.no}.
                                  </td>
                                  <td className="px-3 py-2 font-bold text-slate-900">
                                    {docRow.label}
                                  </td>
                                  {(["ASLI", "COPY", "NONE"] as DocHandoverType[]).map((opt) => (
                                    <td key={opt} className="px-3 py-2 text-center">
                                      <input
                                        type="radio"
                                        name={`doc-${docRow.key}`}
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
                            {/* Baris 8 & 9 (Dokumen Tambahan) */}
                            <tr className="hover:bg-slate-50">
                              <td className="px-3 py-2 font-mono font-bold text-slate-500">8.</td>
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
                                  placeholder="Dokumen 8 (Misal: Buku Nikah)"
                                  className="w-full rounded border border-slate-200 px-2 py-1 text-xs"
                                />
                              </td>
                              {(["ASLI", "COPY", "NONE"] as DocHandoverType[]).map((opt) => (
                                <td key={opt} className="px-3 py-2 text-center">
                                  <input
                                    type="radio"
                                    name="doc-other8"
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
                            <tr className="hover:bg-slate-50">
                              <td className="px-3 py-2 font-mono font-bold text-slate-500">9.</td>
                              <td className="px-3 py-1.5">
                                <input
                                  type="text"
                                  value={regForm.docHandover.otherDoc9Name}
                                  onChange={(e) =>
                                    setRegForm({
                                      ...regForm,
                                      docHandover: {
                                        ...regForm.docHandover,
                                        otherDoc9Name: e.target.value,
                                      },
                                    })
                                  }
                                  placeholder="Dokumen 9 (Misal: Paspor Lama)"
                                  className="w-full rounded border border-slate-200 px-2 py-1 text-xs"
                                />
                              </td>
                              {(["ASLI", "COPY", "NONE"] as DocHandoverType[]).map((opt) => (
                                <td key={opt} className="px-3 py-2 text-center">
                                  <input
                                    type="radio"
                                    name="doc-other9"
                                    checked={regForm.docHandover.otherDoc9Status === opt}
                                    onChange={() =>
                                      setRegForm({
                                        ...regForm,
                                        docHandover: {
                                          ...regForm.docHandover,
                                          otherDoc9Status: opt,
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
                    </div>

                    {/* TABEL KEMAMPUAN BAHASA (BAIK / CUKUP / BURUK) + CATATAN CPMI */}
                    <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 lg:col-span-5 space-y-3">
                      <div>
                        <span className="rounded bg-sky-700 px-2 py-0.5 text-[10px] font-bold uppercase text-white">
                          BAGIAN 5 · KEMAMPUAN BAHASA
                        </span>
                        <h4 className="mt-1 text-sm font-bold text-slate-900">
                          Matriks Bahasa (Baik / Cukup / Buruk)
                        </h4>
                      </div>

                      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                        <table className="w-full text-left text-xs">
                          <thead className="border-b border-slate-200 bg-slate-100 text-[10px] font-bold uppercase text-slate-700">
                            <tr>
                              <th className="px-3 py-2">Bahasa</th>
                              <th className="px-2.5 py-2 text-center">Baik</th>
                              <th className="px-2.5 py-2 text-center">Cukup</th>
                              <th className="px-2.5 py-2 text-center">Buruk</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {[
                              { key: "english", label: "Bahasa Inggris" },
                              { key: "mandarin", label: "Bahasa Mandarin" },
                              { key: "arabic", label: "Bahasa Arab" },
                            ].map((lang) => {
                              const val =
                                regForm.languageSkills[
                                  lang.key as keyof typeof regForm.languageSkills
                                ] as LangSkillLevel;
                              return (
                                <tr key={lang.key} className="hover:bg-slate-50">
                                  <td className="px-3 py-2.5 font-bold text-slate-900">
                                    {lang.label}
                                  </td>
                                  {(["BAIK", "CUKUP", "BURUK"] as LangSkillLevel[]).map((lv) => (
                                    <td key={lv} className="px-2.5 py-2.5 text-center">
                                      <input
                                        type="radio"
                                        name={`lang-${lang.key}`}
                                        checked={val === lv}
                                        onChange={() =>
                                          setRegForm({
                                            ...regForm,
                                            languageSkills: {
                                              ...regForm.languageSkills,
                                              [lang.key]: lv,
                                            },
                                          })
                                        }
                                        className="h-4 w-4 cursor-pointer accent-sky-600"
                                      />
                                    </td>
                                  ))}
                                </tr>
                              );
                            })}
                            <tr className="hover:bg-slate-50">
                              <td className="px-3 py-1.5">
                                <input
                                  type="text"
                                  value={regForm.languageSkills.otherLanguageName}
                                  onChange={(e) =>
                                    setRegForm({
                                      ...regForm,
                                      languageSkills: {
                                        ...regForm.languageSkills,
                                        otherLanguageName: e.target.value,
                                      },
                                    })
                                  }
                                  placeholder="Bahasa Lain (Jepang/Korea)"
                                  className="w-full rounded border border-slate-200 px-2 py-1 text-xs"
                                />
                              </td>
                              {(["BAIK", "CUKUP", "BURUK"] as LangSkillLevel[]).map((lv) => (
                                <td key={lv} className="px-2.5 py-2 text-center">
                                  <input
                                    type="radio"
                                    name="lang-other"
                                    checked={regForm.languageSkills.otherLanguageLevel === lv}
                                    onChange={() =>
                                      setRegForm({
                                        ...regForm,
                                        languageSkills: {
                                          ...regForm.languageSkills,
                                          otherLanguageLevel: lv,
                                        },
                                      })
                                    }
                                    className="h-4 w-4 cursor-pointer accent-sky-600"
                                  />
                                </td>
                              ))}
                            </tr>
                          </tbody>
                        </table>
                      </div>

                      <div>
                        <label className="font-bold text-slate-700 block mb-1">
                          Catatan Biodata / Dokumen
                        </label>
                        <textarea
                          rows={2}
                          value={regForm.candidateNotes}
                          onChange={(e) =>
                            setRegForm({ ...regForm, candidateNotes: e.target.value })
                          }
                          placeholder="Catatan tambahan terkait dokumen yang diserahkan..."
                          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2"
                        />
                      </div>
                    </div>
                  </div>

                  {/* BAGIAN F: PETUGAS LAPANGAN / REKRUT / SPONSOR & PETUGAS PT PENERIMA (DATA ENTRY) */}
                  <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4 space-y-4">
                    <div className="border-b border-amber-200/80 pb-2">
                      <span className="rounded bg-amber-600 px-2 py-0.5 text-[10px] font-bold uppercase text-white">
                        BAGIAN 6 · DATA SPONSOR PENGIRIM & PENGESAHAN PETUGAS PT (DATA ENTRY)
                      </span>
                      <h4 className="mt-1 text-sm font-bold text-slate-900">
                        Kolom Bawah Formulir: Petugas Lapangan / Rekrut / Sponsor & Petugas PT Penerima CPMI
                      </h4>
                    </div>

                    <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
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
                          Pilih Master Sponsor / PL
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
                          Nama Petugas Lapangan / Sponsor (Tercetak)
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
                          Nomor Telp / HP Sponsor
                        </label>
                        <input
                          type="text"
                          value={regForm.sponsorOfficerPhone}
                          onChange={(e) =>
                            setRegForm({ ...regForm, sponsorOfficerPhone: e.target.value })
                          }
                          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono"
                        />
                      </div>

                      <div className="lg:col-span-2">
                        <label className="font-bold text-slate-700 block mb-1">
                          Catatan Petugas Lapangan / Sponsor
                        </label>
                        <input
                          type="text"
                          value={regForm.sponsorNotes}
                          onChange={(e) => setRegForm({ ...regForm, sponsorNotes: e.target.value })}
                          placeholder="Catatan hasil wawancara lapangan / kelengkapan izin keluarga..."
                          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2"
                        />
                      </div>

                      <div>
                        <label className="font-bold text-slate-700 block mb-1">
                          Yang Menerima CPMI (Petugas PT / Data Entry)
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
                          Tanggal Tandatangan Formulir
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
                        ← Lihat Foto Scan Formulir / WA Sponsor
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
                        Simpan Formulir PT Panca Banyu Ajisakti ke Sistem
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
          PT PANCA BANYU AJISAKTI (100% IDENTIK DENGAN KERTAS ASLI)
         ========================================================= */}
      {printingRegFormCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-3 sm:p-6 backdrop-blur-sm">
          <div className="flex max-h-[95vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-slate-200 shadow-2xl">
            {/* Toolbar Cetak */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 px-6 py-3.5 text-white">
              <div>
                <span className="rounded bg-amber-500 px-2 py-0.5 text-[10px] font-extrabold uppercase text-slate-950">
                  IDE 3 · CETAK LEMBAR FISIK IDENTIK 100%
                </span>
                <h3 className="mt-0.5 text-sm font-bold">
                  Pratinjau Cetak: FORMULIR PENDAFTARAN CPMI/CTKI —{" "}
                  {printingRegFormCandidate.fullName} ({printingRegFormCandidate.regNumber})
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-sky-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-sky-500"
                >
                  <Printer className="h-4 w-4" />
                  🖨️ Cetak / Simpan PDF (A4/F4)
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

            {/* KERTAS FORMULIR PENDAFTARAN CPMI/CTKI PT PANCA BANYU AJISAKTI */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-8">
              {(() => {
                const cand = printingRegFormCandidate;
                const rf: OfficialRegistrationForm = cand.registrationForm || regForm;
                const bDateParts = (cand.birthDate || "1998-08-14").split("-");
                const yyyy = bDateParts[0] || "1998";
                const mm = bDateParts[1] || "08";
                const dd = bDateParts[2] || "14";
                const dateBoxes = [
                  dd[0] || "1",
                  dd[1] || "4",
                  mm[0] || "0",
                  mm[1] || "8",
                  yyyy[0] || "1",
                  yyyy[1] || "9",
                  yyyy[2] || "9",
                  yyyy[3] || "8",
                ];

                return (
                  <div className="mx-auto max-w-[820px] rounded-sm border-2 border-slate-800 bg-white p-6 sm:p-8 text-[11px] leading-snug text-slate-900 shadow-2xl">
                    {/* KOP SURAT PT PANCA BANYU AJISAKTI + KOTAK PAS FOTO 4x6 */}
                    <div className="grid grid-cols-12 gap-3 items-start">
                      <div className="col-span-9">
                        <div className="flex items-center gap-3">
                          {/* Logo Segitiga Merah Panca Banyu Ajisakti */}
                          <div className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-full border-2 border-slate-800 bg-white p-1 text-center">
                            <span className="text-[7px] font-black tracking-tighter text-slate-900 uppercase">
                              PANCA BANYU
                            </span>
                            <span className="text-2xl font-black leading-none text-red-600">
                              ▲
                            </span>
                            <span className="text-[7px] font-black tracking-tighter text-slate-900 uppercase">
                              AJISAKTI
                            </span>
                          </div>
                          <div className="flex-1 text-center">
                            <h2 className="text-xl sm:text-2xl font-black tracking-wider text-blue-900 uppercase">
                              PANCA BANYU AJISAKTI
                            </h2>
                            <p className="text-[11px] font-extrabold tracking-widest text-blue-950 uppercase">
                              JASA TENAGA KERJA - INDONESIA MANPOWER SERVICE
                            </p>
                            <p className="mt-0.5 text-[10px] text-slate-700">
                              Jl. Kayu Manis No. 51, Kel. Balekambang, Kec. Kramatjati, Jakarta Timur
                            </p>
                            <p className="text-[10px] text-slate-700">
                              Telp. +62-21 29373673, Fax.: +62-21 29826026, Email : pancabanyu@yahoo.com
                            </p>
                          </div>
                        </div>

                        {/* Banner Biru FORMULIR PENDAFTARAN CPMI/CTKI + Nomor Pendaftaran */}
                        <div className="mt-3 flex items-stretch gap-2">
                          <div className="flex-1 bg-sky-600 px-3 py-1.5 text-center text-sm font-black tracking-wider text-white uppercase border border-sky-700">
                            FORMULIR PENDAFTARAN CPMI/CTKI
                          </div>
                          <div className="w-48 border-2 border-slate-800 px-2 py-1 text-center">
                            <span className="block text-[9px] font-semibold text-slate-600">
                              Nomor Pendaftaran :
                            </span>
                            <strong className="font-mono text-xs font-black text-slate-950">
                              {cand.regNumber}
                            </strong>
                          </div>
                        </div>

                        {/* Paragraf Pernyataan */}
                        <p className="mt-2 text-justify text-[10.5px] leading-tight text-slate-800">
                          Saya yang mengisi Biodata ini dengan sebenar-benarnya dan tanpa paksaan dari pihak manapun. Saya bertanggung jawab tentang kebenaran isinya dan bersedia menanggung kerugian pihak lain atau tuntutan hukum apa bila dikemudian hari saya terbukti memalsukan data-data pribadi saya. Data pribadi saya adalah sebagai berikut :
                        </p>
                      </div>

                      {/* Kotak Pas Foto 4x6 Biru di Kanan Atas */}
                      <div className="col-span-3 flex justify-end">
                        <div className="flex h-40 w-32 flex-col items-center justify-center overflow-hidden border-[3px] border-blue-900 bg-slate-50 p-1">
                          <img
                            src={getCandidateAvatarUrl(cand)}
                            alt={cand.fullName}
                            className="h-full w-full object-cover"
                          />
                        </div>
                      </div>
                    </div>

                    {/* BARIS-BARIS KOTAK FORMULIR IDENTIK DENGAN KERTAS FISIK */}
                    <div className="mt-3 space-y-1.5">
                      {/* Baris 1: Nama Lengkap & Nama Panggilan */}
                      <div className="grid grid-cols-12 gap-2 items-center">
                        <div className="col-span-2 font-bold">Nama Lengkap :</div>
                        <div className="col-span-5 border border-slate-700 px-2 py-1 font-bold uppercase">
                          {cand.fullName}
                        </div>
                        <div className="col-span-2 text-right font-bold">Nama Panggilan :</div>
                        <div className="col-span-3 border border-slate-700 px-2 py-1 font-bold">
                          {rf.nickname || cand.fullName.split(" ")[0]}
                        </div>
                      </div>

                      {/* Baris 2: Tempat & Tanggal Lahir (Kotak 8 Digit) + Tinggi Badan + Berat Badan */}
                      <div className="grid grid-cols-12 gap-1.5 items-center">
                        <div className="col-span-2 text-[10px] font-bold leading-tight">
                          Tempat, dan Tanggal lahir :
                        </div>
                        <div className="col-span-3 border border-slate-700 px-2 py-1 font-semibold">
                          {cand.birthPlace || "Indramayu"}
                        </div>
                        <div className="col-span-3 flex items-center gap-0.5">
                          {dateBoxes.map((digit, i) => (
                            <span
                              key={i}
                              className="flex h-6 w-5 items-center justify-center border border-slate-700 font-mono text-[11px] font-bold"
                            >
                              {digit}
                            </span>
                          ))}
                        </div>
                        <div className="col-span-2 flex items-center gap-1">
                          <span className="text-[9.5px] font-bold leading-none">
                            Tinggi Badan :
                          </span>
                          <div className="flex-1 border border-slate-700 px-1.5 py-1 text-center font-mono font-bold">
                            {rf.heightCm} <span className="font-normal text-[9px]">Cm</span>
                          </div>
                        </div>
                        <div className="col-span-2 flex items-center gap-1">
                          <span className="text-[9.5px] font-bold leading-none">
                            Berat Badan :
                          </span>
                          <div className="flex-1 border border-slate-700 px-1.5 py-1 text-center font-mono font-bold">
                            {rf.weightKg} <span className="font-normal text-[9px]">Kg</span>
                          </div>
                        </div>
                      </div>

                      {/* Baris 3: Agama, Jenis Kelamin, Status Perkawinan, Alamat lengkap label */}
                      <div className="grid grid-cols-12 gap-2 items-center">
                        <div className="col-span-1 font-bold">Agama :</div>
                        <div className="col-span-2 border border-slate-700 px-2 py-1">
                          {rf.religion}
                        </div>
                        <div className="col-span-2 text-right font-bold">Jenis Kelamin :</div>
                        <div className="col-span-2 border border-slate-700 px-2 py-1">
                          {cand.gender === "L" ? "Laki-laki" : "Perempuan"}
                        </div>
                        <div className="col-span-2 text-right font-bold">Status Perkawinan :</div>
                        <div className="col-span-3 border border-slate-700 px-2 py-1">
                          {cand.maritalStatus}
                        </div>
                      </div>

                      {/* Baris 4 & 5: Alamat Lengkap + Kode Pos + Telp / Hp */}
                      <div className="grid grid-cols-12 gap-2 items-center">
                        <div className="col-span-2 font-bold">Alamat lengkap :</div>
                        <div className="col-span-10 border border-slate-700 px-2 py-1">
                          {cand.address}
                        </div>
                      </div>
                      <div className="grid grid-cols-12 gap-2 items-center">
                        <div className="col-span-5 border border-slate-700 px-2 py-1 text-slate-600">
                          Cabang P3MI: {db.branches.find((b) => b.id === cand.branchId)?.name}
                        </div>
                        <div className="col-span-1 text-right font-bold">Kode Pos :</div>
                        <div className="col-span-2 border border-slate-700 px-2 py-1 font-mono">
                          {rf.postalCode}
                        </div>
                        <div className="col-span-1 text-right font-bold">Telp / Hp :</div>
                        <div className="col-span-3 border border-slate-700 px-2 py-1 font-mono font-bold">
                          {cand.phone}
                        </div>
                      </div>

                      {/* Baris 6: Pendidikan Terakhir, Lulus Tahun, No. KTP / Paspor */}
                      <div className="grid grid-cols-12 gap-2 items-center">
                        <div className="col-span-2 font-bold">Pendidikan Terakhir :</div>
                        <div className="col-span-2 border border-slate-700 px-2 py-1">
                          {cand.education}
                        </div>
                        <div className="col-span-2 text-right font-bold">Lulus Tahun :</div>
                        <div className="col-span-1 border border-slate-700 px-2 py-1 font-mono text-center">
                          {rf.graduationYear}
                        </div>
                        <div className="col-span-2 text-right font-bold">No. KTP / Paspor :</div>
                        <div className="col-span-3 border border-slate-700 px-2 py-1 font-mono font-bold">
                          {cand.nik || rf.ktpOrPassportNo}
                        </div>
                      </div>

                      {/* Baris 7: Nama Bapak + Umur & Nama Ibu + Umur */}
                      <div className="grid grid-cols-12 gap-2 items-center">
                        <div className="col-span-2 font-bold">Nama Bapak :</div>
                        <div className="col-span-3 border border-slate-700 px-2 py-1">
                          {rf.fatherName}
                        </div>
                        <div className="col-span-1 text-right font-bold">Umur :</div>
                        <div className="col-span-1 border border-slate-700 px-1.5 py-1 text-center font-mono">
                          {rf.fatherAge} Th.
                        </div>
                        <div className="col-span-1 text-right font-bold">Nama Ibu :</div>
                        <div className="col-span-2 border border-slate-700 px-2 py-1">
                          {rf.motherName}
                        </div>
                        <div className="col-span-1 text-right font-bold">Umur :</div>
                        <div className="col-span-1 border border-slate-700 px-1.5 py-1 text-center font-mono">
                          {rf.motherAge} Th.
                        </div>
                      </div>

                      {/* Baris 8: Nama Suami / Istri / Wali + Umur + Pekerjaan */}
                      <div className="grid grid-cols-12 gap-2 items-center">
                        <div className="col-span-2 font-bold text-[10px]">
                          Nama Suami / Istri / Wali :
                        </div>
                        <div className="col-span-4 border border-slate-700 px-2 py-1">
                          {rf.spouseOrGuardianName}
                        </div>
                        <div className="col-span-1 text-right font-bold">Umur :</div>
                        <div className="col-span-1 border border-slate-700 px-1.5 py-1 text-center font-mono">
                          {rf.spouseAge} Th.
                        </div>
                        <div className="col-span-1 text-right font-bold">Pekerjaan :</div>
                        <div className="col-span-3 border border-slate-700 px-2 py-1">
                          {rf.spouseOccupation}
                        </div>
                      </div>

                      {/* Baris 9: Jumlah & umur anak Laki-laki & Perempuan */}
                      <div className="grid grid-cols-12 gap-2 items-center">
                        <div className="col-span-3 font-bold text-[10px]">
                          Jumlah dan umur anak Laki-laki :
                        </div>
                        <div className="col-span-3 border border-slate-700 px-2 py-1">
                          {rf.boysCountAndAges}
                        </div>
                        <div className="col-span-3 text-right font-bold text-[10px]">
                          Jumlah dan umur anak Perempuan :
                        </div>
                        <div className="col-span-3 border border-slate-700 px-2 py-1">
                          {rf.girlsCountAndAges}
                        </div>
                      </div>

                      {/* Baris 10: Saya anak ke ... dari ... Bersaudara + Keluarga yg mudah dihubungi + Hubungan */}
                      <div className="grid grid-cols-12 gap-2 items-center">
                        <div className="col-span-4 flex items-center gap-1">
                          <span className="font-bold text-[10px]">Saya anak ke :</span>
                          <span className="border border-slate-700 px-2 py-0.5 font-mono font-bold">
                            {rf.childOrder}
                          </span>
                          <span className="text-[10px]">dari :</span>
                          <span className="border border-slate-700 px-2 py-0.5 font-mono font-bold">
                            {rf.siblingsCount}
                          </span>
                          <span className="text-[10px]">Bersaudara</span>
                        </div>
                        <div className="col-span-2 font-bold text-[9.5px] leading-none">
                          Nama Keluarga yang mudah di hubungi :
                        </div>
                        <div className="col-span-3 border border-slate-700 px-2 py-1">
                          {rf.emergencyContactName}
                        </div>
                        <div className="col-span-1 text-right font-bold text-[10px]">
                          Hubungan :
                        </div>
                        <div className="col-span-2 border border-slate-700 px-2 py-1">
                          {rf.emergencyContactRelation}
                        </div>
                      </div>

                      {/* Baris 11: Nomor Telp / Hp keluarga yang mudah dihubungi */}
                      <div className="grid grid-cols-12 gap-2 items-center">
                        <div className="col-span-3 font-bold text-[10px] leading-tight">
                          Nomor Telp / Hp keluarga yang mudah di hubungi :
                        </div>
                        <div className="col-span-9 border border-slate-700 px-2 py-1 font-mono font-bold">
                          {rf.emergencyContactPhone}
                        </div>
                      </div>

                      {/* Baris 12 & 13: Pengalaman Kerja 1 & 2 */}
                      <div className="grid grid-cols-12 gap-2 items-center">
                        <div className="col-span-2 font-bold">Pengalaman Kerja 1 :</div>
                        <div className="col-span-10 border border-slate-700 px-2 py-1">
                          {rf.workExperience1 || "-"}
                        </div>
                      </div>
                      <div className="grid grid-cols-12 gap-2 items-center">
                        <div className="col-span-2 font-bold">Pengalaman Kerja 2 :</div>
                        <div className="col-span-10 border border-slate-700 px-2 py-1">
                          {rf.workExperience2 || "-"}
                        </div>
                      </div>

                      {/* Baris 14 & 15: Negara Tujuan & Pekerjaan yang diinginkan (Kotak Centang) */}
                      <div className="grid grid-cols-12 gap-2 items-center pt-1">
                        <div className="col-span-2 font-bold">Negara Tujuan :</div>
                        <div className="col-span-3 border border-slate-700 px-2 py-1 font-bold uppercase">
                          {cand.destinationCountry}
                        </div>
                        <div className="col-span-2 text-right font-bold text-[10px]">
                          Pekerjaan yang diinginkan :
                        </div>
                        <div className="col-span-5 flex flex-wrap items-center gap-3">
                          <span className="inline-flex items-center gap-1">
                            <span className="flex h-4 w-4 items-center justify-center border border-slate-800 font-bold">
                              {rf.desiredJobCleaner ? "✓" : ""}
                            </span>
                            Cleaner
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <span className="flex h-4 w-4 items-center justify-center border border-slate-800 font-bold">
                              {rf.desiredJobFactory ? "✓" : ""}
                            </span>
                            Pekerja Pabrik
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <span className="flex h-4 w-4 items-center justify-center border border-slate-800 font-bold">
                              {rf.desiredJobNurse ? "✓" : ""}
                            </span>
                            Nurse
                          </span>
                        </div>
                      </div>
                      <div className="grid grid-cols-12 gap-2 items-center">
                        <div className="col-span-2 flex items-center gap-1">
                          <span className="flex h-4 w-4 items-center justify-center border border-slate-800 font-bold">
                            {rf.desiredJobHospitality ? "✓" : ""}
                          </span>
                          Hospitality
                        </div>
                        <div className="col-span-2 flex items-center gap-1">
                          <span className="flex h-4 w-4 items-center justify-center border border-slate-800 font-bold">
                            {rf.desiredJobOther ? "✓" : ""}
                          </span>
                          Pekerja Lain :
                        </div>
                        <div className="col-span-8 border border-slate-700 px-2 py-1">
                          {cand.jobSector}
                        </div>
                      </div>
                    </div>

                    {/* TABEL DOKUMEN (1-9 ASLI/COPY) & TABEL BAHASA (BAIK/CUKUP/BURUK) */}
                    <div className="mt-3 grid grid-cols-12 gap-3 items-start">
                      <div className="col-span-8">
                        <p className="font-bold text-[10.5px] mb-1">
                          Dokumen-dokumen yang saya serahkan untuk proses sebagai berikut :
                        </p>
                        <div className="grid grid-cols-3 gap-2 text-[9.5px]">
                          {/* Kolom Dokumen 1-3 */}
                          <table className="w-full border-collapse border border-slate-700">
                            <thead>
                              <tr className="bg-slate-100">
                                <th className="border border-slate-700 px-1 py-0.5">NO.</th>
                                <th className="border border-slate-700 px-1 py-0.5">DOKUMEN</th>
                                <th className="border border-slate-700 px-1 py-0.5">ASLI</th>
                                <th className="border border-slate-700 px-1 py-0.5">COPY</th>
                              </tr>
                            </thead>
                            <tbody>
                              {[
                                { no: "1.", name: "KTP", val: rf.docHandover.ktp },
                                { no: "2.", name: "KARTU KELUARGA", val: rf.docHandover.kk },
                                {
                                  no: "3.",
                                  name: "AKTE KELAHIRAN",
                                  val: rf.docHandover.akteKelahiran,
                                },
                              ].map((r) => (
                                <tr key={r.no}>
                                  <td className="border border-slate-700 px-1 py-1 text-center">
                                    {r.no}
                                  </td>
                                  <td className="border border-slate-700 px-1 py-1 font-semibold">
                                    {r.name}
                                  </td>
                                  <td className="border border-slate-700 px-1 py-1 text-center font-bold">
                                    {r.val === "ASLI" ? "✓" : ""}
                                  </td>
                                  <td className="border border-slate-700 px-1 py-1 text-center font-bold">
                                    {r.val === "COPY" ? "✓" : ""}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>

                          {/* Kolom Dokumen 4-6 */}
                          <table className="w-full border-collapse border border-slate-700">
                            <thead>
                              <tr className="bg-slate-100">
                                <th className="border border-slate-700 px-1 py-0.5">NO.</th>
                                <th className="border border-slate-700 px-1 py-0.5">DOKUMEN</th>
                                <th className="border border-slate-700 px-1 py-0.5">ASLI</th>
                                <th className="border border-slate-700 px-1 py-0.5">COPY</th>
                              </tr>
                            </thead>
                            <tbody>
                              {[
                                {
                                  no: "4.",
                                  name: "IZIN KELUARGA",
                                  val: rf.docHandover.izinKeluarga,
                                },
                                {
                                  no: "5.",
                                  name: "STTB / IJAZAH",
                                  val: rf.docHandover.sttbIjazah,
                                },
                                { no: "6.", name: "S K C K", val: rf.docHandover.skck },
                              ].map((r) => (
                                <tr key={r.no}>
                                  <td className="border border-slate-700 px-1 py-1 text-center">
                                    {r.no}
                                  </td>
                                  <td className="border border-slate-700 px-1 py-1 font-semibold">
                                    {r.name}
                                  </td>
                                  <td className="border border-slate-700 px-1 py-1 text-center font-bold">
                                    {r.val === "ASLI" ? "✓" : ""}
                                  </td>
                                  <td className="border border-slate-700 px-1 py-1 text-center font-bold">
                                    {r.val === "COPY" ? "✓" : ""}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>

                          {/* Kolom Dokumen 7-9 */}
                          <table className="w-full border-collapse border border-slate-700">
                            <thead>
                              <tr className="bg-slate-100">
                                <th className="border border-slate-700 px-1 py-0.5">NO.</th>
                                <th className="border border-slate-700 px-1 py-0.5">DOKUMEN</th>
                                <th className="border border-slate-700 px-1 py-0.5">ASLI</th>
                                <th className="border border-slate-700 px-1 py-0.5">COPY</th>
                              </tr>
                            </thead>
                            <tbody>
                              {[
                                { no: "7.", name: "PASPOR", val: rf.docHandover.paspor },
                                {
                                  no: "8.",
                                  name: rf.docHandover.otherDoc8Name || "................",
                                  val: rf.docHandover.otherDoc8Status,
                                },
                                {
                                  no: "9.",
                                  name: rf.docHandover.otherDoc9Name || "................",
                                  val: rf.docHandover.otherDoc9Status,
                                },
                              ].map((r) => (
                                <tr key={r.no}>
                                  <td className="border border-slate-700 px-1 py-1 text-center">
                                    {r.no}
                                  </td>
                                  <td className="border border-slate-700 px-1 py-1 font-semibold truncate max-w-[80px]">
                                    {r.name}
                                  </td>
                                  <td className="border border-slate-700 px-1 py-1 text-center font-bold">
                                    {r.val === "ASLI" ? "✓" : ""}
                                  </td>
                                  <td className="border border-slate-700 px-1 py-1 text-center font-bold">
                                    {r.val === "COPY" ? "✓" : ""}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Tabel Kemampuan Bahasa */}
                      <div className="col-span-4">
                        <table className="w-full border-collapse border border-slate-700 text-[9.5px] mt-4">
                          <thead>
                            <tr className="bg-slate-100">
                              <th className="border border-slate-700 px-1.5 py-0.5 text-left">
                                Bahasa
                              </th>
                              <th className="border border-slate-700 px-1 py-0.5">Baik</th>
                              <th className="border border-slate-700 px-1 py-0.5">Cukup</th>
                              <th className="border border-slate-700 px-1 py-0.5">Buruk</th>
                            </tr>
                          </thead>
                          <tbody>
                            {[
                              { name: "Bahasa Inggris", val: rf.languageSkills.english },
                              { name: "Bahasa Mandarin", val: rf.languageSkills.mandarin },
                              { name: "Bahasa Arab", val: rf.languageSkills.arabic },
                              {
                                name: rf.languageSkills.otherLanguageName || "................",
                                val: rf.languageSkills.otherLanguageLevel,
                              },
                            ].map((l, idx) => (
                              <tr key={idx}>
                                <td className="border border-slate-700 px-1.5 py-1 font-semibold">
                                  {l.name}
                                </td>
                                <td className="border border-slate-700 px-1 py-1 text-center font-bold">
                                  {l.val === "BAIK" ? "✓" : ""}
                                </td>
                                <td className="border border-slate-700 px-1 py-1 text-center font-bold">
                                  {l.val === "CUKUP" ? "✓" : ""}
                                </td>
                                <td className="border border-slate-700 px-1 py-1 text-center font-bold">
                                  {l.val === "BURUK" ? "✓" : ""}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* CATATAN & DATA PETUGAS LAPANGAN / REKRUT / SPONSOR */}
                    <div className="mt-2.5 space-y-1.5">
                      <div className="grid grid-cols-12 gap-2 items-center">
                        <div className="col-span-2 font-bold">Catatan :</div>
                        <div className="col-span-10 border border-slate-700 px-2 py-1">
                          {rf.candidateNotes || "-"}
                        </div>
                      </div>

                      <div className="grid grid-cols-12 gap-2 items-center">
                        <div className="col-span-3 font-bold text-[10px] leading-tight">
                          Nama Petugas Lapangan / Petugas Rekrut / Sponsor :
                        </div>
                        <div className="col-span-4 border border-slate-700 px-2 py-1 font-bold">
                          {rf.sponsorOfficerName}
                        </div>
                        <div className="col-span-2 text-right font-bold">Nomor Telp / Hp :</div>
                        <div className="col-span-3 border border-slate-700 px-2 py-1 font-mono font-bold">
                          {rf.sponsorOfficerPhone}
                        </div>
                      </div>

                      <div className="grid grid-cols-12 gap-2 items-center">
                        <div className="col-span-2 font-bold">Catatan :</div>
                        <div className="col-span-10 border border-slate-700 px-2 py-1.5">
                          {rf.sponsorNotes || "-"}
                        </div>
                      </div>
                    </div>

                    {/* 3 KOLOM TANDA TANGAN BAWAH (CALON PMI, PETUGAS LAPANGAN/REKRUT, PETUGAS PT) */}
                    <div className="mt-6 grid grid-cols-3 gap-6 text-center text-[11px]">
                      <div>
                        <p className="border-t border-slate-700 pt-1 font-semibold">
                          Yang mengisi biodata
                        </p>
                        <div className="h-14 flex items-center justify-center text-[10px] italic text-slate-400">
                          (Ttd. {rf.formSignedDate})
                        </div>
                        <p className="font-bold underline">( {cand.fullName} )</p>
                        <p className="text-[10px] font-bold">Calon PMI</p>
                      </div>

                      <div>
                        <p className="pt-1 font-semibold">Mengetahui / Saksi</p>
                        <div className="h-14 flex items-center justify-center text-[10px] italic text-slate-400">
                          (Terverifikasi Sponsor)
                        </div>
                        <p className="font-bold underline">( {rf.sponsorOfficerName} )</p>
                        <p className="text-[10px] font-bold">Petugas Lapangan / Rekrut</p>
                      </div>

                      <div>
                        <p className="pt-1 font-semibold">Yang menerima CPMI</p>
                        <div className="h-14 flex items-center justify-center text-[10px] italic text-teal-700 font-semibold">
                          ✓ Diterima & Diinput Sistem
                        </div>
                        <p className="font-bold underline">( {rf.receivedByPtOfficer} )</p>
                        <p className="text-[10px] font-bold">Petugas PT</p>
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
