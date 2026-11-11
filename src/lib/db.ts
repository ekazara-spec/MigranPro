import fs from "fs";
import os from "os";
import path from "path";
import { createExcel2026Sponsors } from "./sponsor-seed-2026";
import {
  AppRole,
  AuditLog,
  BadilRecord,
  BpjsFinancingPartner,
  Branch,
  Candidate,
  CandidateFinance,
  CaseTicket,
  CashAdvance,
  CashJournal,
  CpmiDocument,
  DOC_TEMPLATE_CONFIG,
  EmployerInterview,
  ForeignAgency,
  JobVacancy,
  JourneyStage,
  MasterAirline,
  MasterBlkLn,
  MasterDisdukcapil,
  MasterEmbassy,
  MasterImmigrationOffice,
  MasterMedicalClinic,
  MedicalClinicPartner,
  OfficialRegistrationForm,
  ProcessTrack,
  RenewalTask,
  Sponsor,
  SponsorFormSubmission,
  SponsorInstallment,
  StaffAccount,
  SyarikahInvoice,
  TenantCompany,
  TrainingRecord,
  WhatsAppNotification,
} from "./types";

export interface DatabaseSchema {
  isCleanProduction?: boolean;
  sponsors2026ExcelImported?: boolean;
  demoCpmiTrimmedTo4?: boolean;
  demoVacanciesTrimmedTo2?: boolean;
  demoSponsorSubmissionsCleared?: boolean;
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

const IS_SERVERLESS = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
const LOCAL_DB_DIR = path.join(process.cwd(), "data");
const LOCAL_DB_FILE = path.join(LOCAL_DB_DIR, "p3mi-db.json");
const DB_DIR = IS_SERVERLESS ? os.tmpdir() : LOCAL_DB_DIR;
const DB_FILE = IS_SERVERLESS ? path.join(os.tmpdir(), "p3mi-db.json") : LOCAL_DB_FILE;

export function getDaysRemaining(expiryDate?: string): number | null {
  if (!expiryDate) return null;
  const now = new Date();
  const todayUtc = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  const parts = expiryDate.split("-").map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) return null;
  const expUtc = Date.UTC(parts[0], parts[1] - 1, parts[2]);
  return Math.round((expUtc - todayUtc) / (1000 * 60 * 60 * 24));
}

function relativeDate(daysOffset: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysOffset);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function buildDefaultSponsorInstallments(
  candidateId: string,
  totalCommission: number,
  paidTermins: ("DP1" | "DP2" | "DP3" | "PELUNASAN")[] = [],
  processTrack: ProcessTrack = "REKOM"
): SponsorInstallment[] {
  if (totalCommission <= 0) return [];
  const dp1Amt = Math.round(totalCommission * 0.2); // 20% saat Medical FIT
  const dp2Amt = Math.round(totalCommission * 0.25); // 25% saat Paspor Terbit
  const dp3Amt = Math.round(totalCommission * 0.25); // 25% saat Visa Turun
  const pelunasanAmt = totalCommission - (dp1Amt + dp2Amt + dp3Amt); // 30% saat Terbang (Deployed)

  const configs: {
    key: "DP1" | "DP2" | "DP3" | "PELUNASAN";
    label: string;
    pct: number;
    amt: number;
    reqStage: JourneyStage;
  }[] = [
    {
      key: "DP1",
      label: "DP 1 (20% · Lolos Medical Wafid FIT & Berkas Dasar)",
      pct: 20,
      amt: dp1Amt,
      reqStage: "CPMI",
    },
    {
      key: "DP2",
      label:
        processTrack === "NON_REKOM"
          ? "DP 2 (25% · Paspor Terbit & Pengajuan Visa Non-Rekom)"
          : "DP 2 (25% · Paspor Terbit & Rekom ID SISKOP2MI)",
      pct: 25,
      amt: dp2Amt,
      reqStage: "CPMI",
    },
    {
      key: "DP3",
      label:
        processTrack === "NON_REKOM"
          ? "DP 3 (25% · Visa Kerja Turun · Siap Langsung Tiket)"
          : "DP 3 (25% · Kontrak Syarikah/PK & Visa Kerja Turun)",
      pct: 25,
      amt: dp3Amt,
      reqStage: "READY",
    },
    {
      key: "PELUNASAN",
      label: "Pelunasan (30% · Tiket Terbit & CPMI Terbang / Deployed)",
      pct: 30,
      amt: pelunasanAmt,
      reqStage: "DEPLOYED",
    },
  ];

  return configs.map((cfg, idx) => {
    const isPaid = paidTermins.includes(cfg.key);
    return {
      id: `inst-${candidateId}-${cfg.key.toLowerCase()}`,
      terminKey: cfg.key,
      label: cfg.label,
      percentage: cfg.pct,
      amount: cfg.amt,
      requiredStage: cfg.reqStage,
      status: isPaid ? "PAID" : "UNPAID",
      paidAt: isPaid ? relativeDate(-(25 - idx * 6)) : undefined,
      paymentMethod: isPaid ? "Transfer Bank BRI" : undefined,
      receiptNumber: isPaid
        ? `KW-PAS/${cfg.key}/2026/${candidateId.replace("cpmi-", "00")}${idx + 1}`
        : undefined,
      approvedBy: isPaid ? "Rina Kartika (Admin Pusat)" : undefined,
    };
  });
}

export function buildDefaultFinanceForCandidate(c: Candidate): CandidateFinance {
  const track: ProcessTrack = c.processTrack || "REKOM";
  const isAdvancedStage = ["READY", "DEPLOYED", "ACTIVE_WORKER", "RETURNED", "ALUMNI"].includes(
    c.stage
  );
  const isDeployedOrLater = ["DEPLOYED", "ACTIVE_WORKER", "RETURNED", "ALUMNI"].includes(
    c.stage
  );

  let paidTermins: ("DP1" | "DP2" | "DP3" | "PELUNASAN")[] = [];
  if (isDeployedOrLater || c.commissionPaid) {
    paidTermins = ["DP1", "DP2", "DP3", "PELUNASAN"];
  } else if (c.stage === "READY") {
    paidTermins = ["DP1", "DP2", "DP3"]; // Tinggal Pelunasan saat terbang!
  } else if (c.stage === "CPMI") {
    paidTermins = ["DP1"]; // Baru cair DP1 karena sudah lolos Medical FIT
  }

  const installments = buildDefaultSponsorInstallments(
    c.id,
    c.sponsorCommission || 0,
    paidTermins,
    track
  );

  const costItems = [
    {
      id: `cost-${c.id}-1`,
      category: "MEDICAL_CHECKUP" as const,
      title: "Medical Check-Up Wafid (eks-GAMCA) Klinik Terakreditasi GCC",
      amount: 1650000,
      borneBy: "AGENSI_MAJIKAN" as const,
      status: (c.stage === "LEAD" ? "PENDING" : "PAID") as "PAID" | "PENDING",
      paidDate: c.stage === "LEAD" ? undefined : relativeDate(-45),
      vendorName: "Klinik Wafid / GAMCA Resmi (Jakarta/Cirebon/Surabaya)",
    },
    {
      id: `cost-${c.id}-2`,
      category: "PASPOR_IMIGRASI" as const,
      title:
        track === "NON_REKOM"
          ? "Penerbitan Paspor RI 48 Halaman (Jalur Non-Rekom)"
          : "Penerbitan Paspor RI 48 Hal & Rekom ID SISKOP2MI",
      amount: 650000,
      borneBy: "AGENSI_MAJIKAN" as const,
      status: (["LEAD", "PROSPECT"].includes(c.stage) ? "PENDING" : "PAID") as
        | "PAID"
        | "PENDING",
      paidDate: ["LEAD", "PROSPECT"].includes(c.stage) ? undefined : relativeDate(-35),
      vendorName: "Kantor Imigrasi Kelas I",
    },
    {
      id: `cost-${c.id}-3`,
      category: "PELATIHAN_BLK_SERTIFIKASI" as const,
      title:
        track === "NON_REKOM"
          ? "Pembekalan Singkat Bahasa Arab/Inggris & Persiapan Asrama"
          : "Pelatihan Bahasa Arab/Inggris, Asrama BLK-LN & Sertifikasi BNSP",
      amount: track === "NON_REKOM" ? 2800000 : 5800000,
      borneBy: "AGENSI_MAJIKAN" as const,
      status: (["LEAD", "PROSPECT"].includes(c.stage) ? "PENDING" : "PAID") as
        | "PAID"
        | "PENDING",
      paidDate: ["LEAD", "PROSPECT"].includes(c.stage) ? undefined : relativeDate(-28),
      vendorName: "BLK-LN Panca Banyu Ajisakti",
    },
    {
      id: `cost-${c.id}-4`,
      category: "VISA_TETO_KEDUTAAN" as const,
      title: "Biometrik Tasheer / VFS, Enjaz & Stamping Visa Wakalah / Musaned / e-Visa",
      amount: 4200000,
      borneBy: "AGENSI_MAJIKAN" as const,
      status: (isAdvancedStage ? "PAID" : "PENDING") as "PAID" | "PENDING",
      paidDate: isAdvancedStage ? relativeDate(-14) : undefined,
      vendorName: `Tasheer / Kedutaan Besar ${c.destinationCountry}`,
    },
    ...(track === "REKOM"
      ? [
          {
            id: `cost-${c.id}-5`,
            category: "BPJS_ASURANSI_PMI" as const,
            title: "Premi BPJS Ketenagakerjaan PMI (Pra, Masa, Purna), PAP & E-KTKLN SISKOP2MI",
            amount: 540000,
            borneBy: "AGENSI_MAJIKAN" as const,
            status: (isAdvancedStage ? "PAID" : "PENDING") as "PAID" | "PENDING",
            paidDate: isAdvancedStage ? relativeDate(-10) : undefined,
            vendorName: "BPJS Ketenagakerjaan & SISKOP2MI",
          },
        ]
      : []),
    {
      id: `cost-${c.id}-6`,
      category: "TIKET_PESAWAT_HANDLING" as const,
      title:
        track === "NON_REKOM"
          ? "Tiket Pesawat Internasional Langsung & Airport Handling (Jalur Non-Rekom)"
          : "Tiket Pesawat Internasional (Saudia / Emirates / Etihad / Kuwait Airways / Oman Air)",
      amount: 8200000,
      borneBy: "AGENSI_MAJIKAN" as const,
      status: (isDeployedOrLater ? "PAID" : "PENDING") as "PAID" | "PENDING",
      paidDate: isDeployedOrLater ? relativeDate(-5) : undefined,
      vendorName: "Saudia Airlines / Emirates / Etihad / Kuwait Airways / Oman Air",
    },
  ];

  return {
    fundingScheme: "ZERO_COST_MAJIKAN",
    fundingBankOrAgency: `100% Zero Cost — Dibiayai Langsung Syarikah / Majikan ${c.destinationCountry} (${
      track === "NON_REKOM" ? "Jalur Non-Rekom" : "Jalur Rekom Resmi"
    })`,
    agencyFeeRevenue: c.placementFee || 36000000,
    revenueReceived: isDeployedOrLater
      ? c.placementFee || 36000000
      : c.stage === "READY"
      ? Math.round((c.placementFee || 36000000) * 0.5)
      : 0,
    kurStatus: "NOT_APPLICABLE",
    costItems,
    sponsorInstallments: installments,
  };
}

export function buildDefaultTrainingForCandidate(c: Candidate): TrainingRecord {
  const langMap: Record<string, string> = {
    "Arab Saudi": "Bahasa Arab Praktis (Percakapan) & Tata Graha Timur Tengah",
    "Uni Emirat Arab (UAE)": "Bahasa Arab & Bahasa Inggris Perhotelan / Tadbeer UAE",
    Kuwait: "Bahasa Arab & Bahasa Inggris Hospitality / Caregiver Kuwait",
    Oman: "Bahasa Arab & Standar Perhotelan / Caregiver Kesultanan Oman",
    Yordania: "Bahasa Arab & Tata Graha / Industri Kawasan Timur Tengah",
    Qatar: "Bahasa Arab & Bahasa Inggris Hospitality Doha Qatar",
    Bahrain: "Bahasa Arab & Tata Graha Bahrain",
  };
  const isTrained = ["READY", "DEPLOYED", "ACTIVE_WORKER", "RETURNED", "ALUMNI"].includes(
    c.stage
  );
  return {
    blkLocation: "BLK-LN Panca Banyu Ajisakti (Pusat)",
    targetLanguage:
      langMap[c.destinationCountry] || "Bahasa Arab Praktis & Tata Graha Timur Tengah",
    attendancePct: isTrained ? 98 : c.stage === "CPMI" ? 76 : 0,
    languageScore: isTrained ? 88 : c.stage === "CPMI" ? 72 : 0,
    skillScore: isTrained ? 91 : c.stage === "CPMI" ? 78 : 0,
    examStatus: isTrained
      ? "LULUS_KOMPETEN"
      : c.stage === "CPMI"
      ? "BELUM_UJIAN"
      : "BELUM_UJIAN",
    dormitoryCheckIn: c.stage === "LEAD" ? undefined : c.createdAt,
    instructorNotes:
      c.processTrack === "NON_REKOM"
        ? "Jalur Non-Rekom: Tanpa wajib PAP/E-KTKLN, fokus kesiapan bahasa Arab/Inggris praktis & langsung proses tiket keberangkatan."
        : isTrained
        ? "Kompeten & lulus uji kompetensi LSP serta sertifikat resmi BNSP dari BLK-LN."
        : "Sedang mengikuti kelas intensif Bahasa Arab & keterampilan di asrama BLK-LN.",
  };
}

function buildDocsForCandidate(
  candidateId: string,
  overrides: Partial<Record<string, Partial<CpmiDocument>>>
): CpmiDocument[] {
  return DOC_TEMPLATE_CONFIG.map((tpl, idx) => {
    const ov = overrides[tpl.docType] || {};
    return {
      id: `doc-${candidateId}-${idx + 1}`,
      candidateId,
      docType: tpl.docType,
      title: tpl.title,
      isSensitive: tpl.isSensitive,
      requiredAtStage: tpl.requiredAtStage,
      status: ov.status || "MISSING",
      docNumber: ov.docNumber,
      issuedBy: ov.issuedBy,
      issueDate: ov.issueDate,
      expiryDate: ov.expiryDate,
      medicalResult: ov.medicalResult,
      aiCheckStatus: ov.aiCheckStatus || "UNCHECKED",
      aiCheckNotes: ov.aiCheckNotes,
      verifiedBy: ov.verifiedBy,
      verifiedAt: ov.verifiedAt,
      lastReminderTier: ov.lastReminderTier ?? null,
      notes: ov.notes,
    };
  });
}

function createInitialStaff(): StaffAccount[] {
  return [
    {
      id: "stf-1",
      name: "Ahmad Sarkoni",
      email: "direktur@pasmigranpro.id",
      role: "DIREKTUR",
      roleLabel: "Direktur Utama (Superadmin)",
      branchId: "ALL",
      phone: "0811-1000-2200",
      active: true,
      pinCode: "PBAS-Dir#2026",
    },
    {
      id: "stf-dewi",
      name: "Dewi",
      email: "dewi@pasmigranpro.id",
      role: "INTERVIEW_PENDAFTARAN",
      secondaryRoles: ["MARKETING"],
      roleLabel: "Interview / Pendaftaran & Marketing",
      branchId: "ALL",
      phone: "-",
      active: true,
      pinCode: "PBAS-Dewi#26",
    },
    {
      id: "stf-sukma",
      name: "Sukma",
      email: "sukma@pasmigranpro.id",
      role: "INTERVIEW_PENDAFTARAN",
      roleLabel: "Interview / Pendaftaran",
      branchId: "ALL",
      phone: "-",
      active: true,
      pinCode: "PBAS-Sukma#26",
    },
    {
      id: "stf-wandi",
      name: "Wandi",
      email: "wandi@pasmigranpro.id",
      role: "INTERVIEW_PENDAFTARAN",
      secondaryRoles: ["MARKETING"],
      roleLabel: "Interview / Pendaftaran & Marketing",
      branchId: "ALL",
      phone: "-",
      active: true,
      pinCode: "PBAS-Wandi#26",
    },
    {
      id: "stf-arik",
      name: "Arik",
      email: "arik@pasmigranpro.id",
      role: "PENDATAAN_MEDICAL",
      roleLabel: "Pendataan & Medical Checkup",
      branchId: "ALL",
      phone: "-",
      active: true,
      pinCode: "PBAS-Arik#26",
    },
    {
      id: "stf-ichwan",
      name: "Ichwan",
      email: "ichwan@pasmigranpro.id",
      role: "PASPOR_ENJAZ_TASHEEL",
      roleLabel: "Pasporan / Enjaz / Tasheel",
      branchId: "ALL",
      phone: "-",
      active: true,
      pinCode: "PBAS-Ichwan#26",
    },
    {
      id: "stf-yusuf",
      name: "Yusuf",
      email: "yusuf@pasmigranpro.id",
      role: "PASPOR_ENJAZ_TASHEEL",
      roleLabel: "Pasporan / Enjaz / Tasheel",
      branchId: "ALL",
      phone: "-",
      active: true,
      pinCode: "PBAS-Yusuf#26",
    },
    {
      id: "stf-tikfi",
      name: "Tikfi",
      email: "tikfi@pasmigranpro.id",
      role: "KEUANGAN",
      roleLabel: "Keuangan",
      branchId: "ALL",
      phone: "-",
      active: true,
      pinCode: "PBAS-Tikfi#26",
    },
    {
      id: "stf-taufik",
      name: "Taufik",
      email: "taufik@pasmigranpro.id",
      role: "KEUANGAN",
      roleLabel: "Keuangan",
      branchId: "ALL",
      phone: "-",
      active: true,
      pinCode: "PBAS-Taufik#26",
    },
    {
      id: "stf-ami",
      name: "Ami",
      email: "ami@pasmigranpro.id",
      role: "TICKETING_HANDLE",
      roleLabel: "Ticketing / Handle",
      branchId: "ALL",
      phone: "-",
      active: true,
      pinCode: "PBAS-Ami#26",
    },
    {
      id: "stf-zaenal",
      name: "Zaenal",
      email: "zaenal@pasmigranpro.id",
      role: "TICKETING_HANDLE",
      roleLabel: "Ticketing / Handle",
      branchId: "ALL",
      phone: "-",
      active: true,
      pinCode: "PBAS-Zaenal#26",
    },
    {
      id: "stf-alam",
      name: "Alam",
      email: "alam@pasmigranpro.id",
      role: "MARKETING",
      secondaryRoles: ["CASE_CARECENTER"],
      roleLabel: "Marketing & Manajemen Case / CareCenter",
      branchId: "ALL",
      phone: "-",
      active: true,
      pinCode: "PBAS-Alam#26",
    },
    {
      id: "stf-iyan",
      name: "Iyan",
      email: "iyan@pasmigranpro.id",
      role: "OPP",
      roleLabel: "OPP",
      branchId: "ALL",
      phone: "-",
      active: true,
      pinCode: "PBAS-Iyan#26",
    },
  ];
}

function createInitialCases(): CaseTicket[] {
  return [
    {
      id: "case-1",
      ticketNumber: "CASE-2026-0018",
      candidateId: "cpmi-7",
      candidateName: "Siti Khodijah",
      candidateNik: "3507185006940004",
      branchId: "br-mlg",
      destinationCountry: "Uni Emirat Arab (UAE)",
      employerName: "Al-Maktoum Residence & Tadbeer Dubai",
      category: "GAJI_TERLAMBAT",
      priority: "CRITICAL",
      status: "ESCALATED",
      title: "Keterlambatan Transfer Gaji Bulan ke-10 & Penyesuaian Jam Istirahat",
      description:
        "PMI melaporkan melalui Portal Mandiri bahwa transfer gaji bulanan dari majikan/Syarikah di Dubai mundur 7 hari dari jadwal kontrak, serta jam istirahat malam kurang dari 8 jam.",
      picName: "Rina Kartika (Admin Pusat)",
      escalatedTo: "Emirates Tadbeer Services (Dubai) & Atase Ketenagakerjaan KBRI Abu Dhabi / KJRI Dubai",
      targetResolutionDate: relativeDate(-2),
      reportedBy: "Portal Mandiri PMI (Siti Khodijah)",
      createdAt: relativeDate(-6),
      updatedAt: relativeDate(-1),
      timeline: [
        {
          id: "cn-1",
          authorName: "Siti Khodijah (PMI)",
          authorRole: "PMI Aktif",
          note: "Melaporkan pengaduan lewat Portal Mandiri: Gaji bulan ini belum masuk rekening payroll UAE dan jam kerja terlalu malam.",
          createdAt: relativeDate(-6) + " 20:15 WIB",
        },
        {
          id: "cn-2",
          authorName: "Rina Kartika, S.Psi.",
          authorRole: "ADMIN_PUSAT",
          note: "Menghubungi Syarikah mitra Emirates Tadbeer di Dubai untuk klarifikasi tertulis ke majikan.",
          createdAt: relativeDate(-4) + " 10:30 WIB",
        },
        {
          id: "cn-3",
          authorName: "Ahmad Sarkoni",
          authorRole: "DIREKTUR",
          note: "Eskalasi resmi ditembuskan ke KJRI Dubai bila dalam 2x24 jam bukti transfer gaji WPS belum diterima.",
          createdAt: relativeDate(-1) + " 15:40 WIB",
        },
      ],
    },
  ];
}

function createInitialVacancies(): JobVacancy[] {
  return [
    {
      id: "vac-1",
      code: "JOB-2026-SA01",
      title: "Penata Laksana Rumah Tangga & Babysitter (Jalur Non-Rekom · Langsung Tiket)",
      destinationCountry: "Arab Saudi",
      placementRegion: "TIMUR_TENGAH",
      middleEastScheme: "NON_REKOM_DIRECT_MAJIKAN",
      jobSector: "Housekeeping & Babysitter (Majikan Langsung)",
      agencyPartner: "Maktab Istiqdam Al-Wataniyah (Riyadh & Jeddah)",
      employerName: "Verified Saudi Families (Riyadh / Jeddah / Dammam)",
      salaryForeign: "SAR 1.500 - 1.800 / bulan (Zero Cost)",
      salaryIdrEstimate: 7200000,
      placementFee: 36000000,
      quotaTotal: 45,
      quotaFilled: 24,
      genderPref: "P",
      minEducation: "SD / SMP / SMA",
      ageRange: "21 - 42 Tahun",
      requirements: [
        "100% ZERO COST — Seluruh biaya dibiayai langsung oleh Syarikah / Majikan (Tanpa Potong Gaji)",
        "Jalur Non-Rekom: Tanpa proses BPJS-TK, PAP & KTKLN — setelah Medical Wafid, Paspor & Visa langsung Tiket & Terbang",
        "Wajib KTP Elektronik, KK, Akta/Ijazah & Surat Izin Suami/Orang Tua",
      ],
      isPublished: true,
      closingDate: relativeDate(30),
      createdAt: relativeDate(-25),
    },
    {
      id: "vac-2",
      code: "JOB-2026-SA02",
      title: "Driver Keluarga & Teknisi Gedung (Riyadh / Makkah / Madinah)",
      destinationCountry: "Arab Saudi",
      placementRegion: "TIMUR_TENGAH",
      middleEastScheme: "FORMAL_WAKALAH_GCC",
      jobSector: "Family Driver & Building Maintenance",
      agencyPartner: "Al-Jazeera Recruitment Office (Riyadh)",
      employerName: "Syarikah & Keluarga Majikan Riyadh / Makkah",
      salaryForeign: "SAR 1.800 - 2.200 / bulan (Zero Cost)",
      salaryIdrEstimate: 8500000,
      placementFee: 35000000,
      quotaTotal: 20,
      quotaFilled: 9,
      genderPref: "L",
      minEducation: "SMP / SMA / SMK",
      ageRange: "22 - 40 Tahun",
      requirements: [
        "100% Zero Cost — Dibiayai penuh oleh Syarikah / Majikan Arab Saudi",
        "Memiliki SIM A aktif & lulus Medical Check-Up Wafid (GAMCA) FIT",
        "Tersedia pilihan Jalur Rekom (SISKOP2MI) maupun Jalur Non-Rekom (Langsung Tiket)",
      ],
      isPublished: true,
      closingDate: relativeDate(45),
      createdAt: relativeDate(-20),
    },
  ];
}

export function createInitialTenants(): TenantCompany[] {
  // Aplikasi didedikasikan tunggal khusus PT. PANCA BANYU AJISAKTI
  return [
    {
      id: "tenant-panca",
      code: "P3MI-PBAS",
      name: "PT. PANCA BANYU AJISAKTI",
      brandName: "Panca Banyu Ajisakti",
      licenseNo: "SIP3MI NO. 502/MEN/2021",
      logoUrl: "/logo-panca-banyu.png",
      planTier: "ENTERPRISE",
      planExpiresAt: "2028-12-31",
      maxCandidates: 2500,
      maxBranches: 25,
      status: "ACTIVE",
      address: "Jl. Kayu Manis No. 51, Kel. Balekambang, Kec. Kramat Jati, Jakarta Timur",
      phone: "+62-21 2937373",
      email: "pancabanyu@yahoo.com",
      picName: "Ahmad Sarkoni (Direktur Utama)",
      isPrimary: true,
      createdAt: "2021-06-15",
    },
  ];
}

export function createInitialRoles(): AppRole[] {
  return [
    {
      id: "role-direktur",
      code: "DIREKTUR",
      name: "Direktur Utama",
      description:
        "Superadmin tertinggi PT. Panca Banyu Ajisakti dengan hak akses penuh ke seluruh modul, kelola user, keuangan, dan maintenance sistem.",
      isSystemRole: true,
      isReadOnly: false,
      allowedScope: "ALL",
      allowedMenus: [
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
        "keuangan",
        "aruskas_kasbon",
        "saas_tenants",
        "cabang_audit",
        "master_data",
        "whatsapp_gateway",
        "maintenance",
      ],
      permissions: {
        canVerify: true,
        canViewSensitive: true,
        canSeeFinance: true,
        canManageStaff: true,
        canExecuteOperation: true,
      },
      createdAt: "2024-01-01",
    },
    {
      id: "role-interview-pendaftaran",
      code: "INTERVIEW_PENDAFTARAN",
      name: "Interview / Pendaftaran",
      description:
        "Tim penerimaan pendaftaran awal CPMI (Jalur Rekom & Non-Rekom), seleksi interview, pencocokan Job Order & Portal CPMI.",
      isSystemRole: true,
      isReadOnly: false,
      allowedScope: "ALL",
      allowedMenus: [
        "beranda",
        "cpmi",
        "vacancy",
        "employer_matching",
        "portal_cpmi",
        "pengingat",
      ],
      permissions: {
        canVerify: true,
        canViewSensitive: true,
        canSeeFinance: false,
        canManageStaff: false,
        canExecuteOperation: true,
      },
      createdAt: "2026-01-01",
    },
    {
      id: "role-pendataan-medical",
      code: "PENDATAAN_MEDICAL",
      name: "Pendataan & Medical Checkup",
      description:
        "Tim pendataan berkas dasar CPMI, jadwal & verifikasi hasil Medical Checkup (Wafid/GAMCA) serta pelatihan BLK-LN.",
      isSystemRole: true,
      isReadOnly: false,
      allowedScope: "ALL",
      allowedMenus: ["beranda", "cpmi", "medical_visa", "pelatihan", "pengingat"],
      permissions: {
        canVerify: true,
        canViewSensitive: true,
        canSeeFinance: false,
        canManageStaff: false,
        canExecuteOperation: true,
      },
      createdAt: "2026-01-01",
    },
    {
      id: "role-paspor-enjaz-tasheel",
      code: "PASPOR_ENJAZ_TASHEEL",
      name: "Pasporan / Enjaz / Tasheel",
      description:
        "Tim pengurusan paspor imigrasi, cetak surat rekom/PK resmi, Enjaz/Tasheel biometrik, dan penerbitan Visa kerja.",
      isSystemRole: true,
      isReadOnly: false,
      allowedScope: "ALL",
      allowedMenus: ["beranda", "cpmi", "medical_visa", "doc_print", "pengingat"],
      permissions: {
        canVerify: true,
        canViewSensitive: true,
        canSeeFinance: false,
        canManageStaff: false,
        canExecuteOperation: true,
      },
      createdAt: "2026-01-01",
    },
    {
      id: "role-keuangan",
      code: "KEUANGAN",
      name: "Keuangan",
      description:
        "Tim keuangan P3MI pengelola Fee Sponsor DP1–Pelunasan, arus kas bank, kasbon, HPP penempatan & invoice Syarikah.",
      isSystemRole: true,
      isReadOnly: false,
      allowedScope: "ALL",
      allowedMenus: [
        "beranda",
        "keuangan",
        "aruskas_kasbon",
        "cpmi",
        "pengingat",
        "master_data",
      ],
      permissions: {
        canVerify: false,
        canViewSensitive: true,
        canSeeFinance: true,
        canManageStaff: false,
        canExecuteOperation: true,
      },
      createdAt: "2026-01-01",
    },
    {
      id: "role-ticketing-handle",
      code: "TICKETING_HANDLE",
      name: "Ticketing / Handle",
      description:
        "Tim reservasi tiket penerbangan keberangkatan PMI, handling bandara, validasi visa terbang & jadwal kepulangan.",
      isSystemRole: true,
      isReadOnly: false,
      allowedScope: "ALL",
      allowedMenus: ["beranda", "cpmi", "medical_visa", "doc_print", "pengingat"],
      permissions: {
        canVerify: true,
        canViewSensitive: true,
        canSeeFinance: false,
        canManageStaff: false,
        canExecuteOperation: true,
      },
      createdAt: "2026-01-01",
    },
    {
      id: "role-marketing",
      code: "MARKETING",
      name: "Marketing",
      description:
        "Tim pemasaran lowongan kerja (Job Order), akusisi kandidat, pencocokan majikan/Syarikah & broadcast WhatsApp.",
      isSystemRole: true,
      isReadOnly: false,
      allowedScope: "ALL",
      allowedMenus: [
        "beranda",
        "vacancy",
        "cpmi",
        "employer_matching",
        "whatsapp_gateway",
        "portal_cpmi",
      ],
      permissions: {
        canVerify: false,
        canViewSensitive: false,
        canSeeFinance: false,
        canManageStaff: false,
        canExecuteOperation: true,
      },
      createdAt: "2026-01-01",
    },
    {
      id: "role-opp",
      code: "OPP",
      name: "OPP",
      description:
        "Tim pengurusan Orientasi Pra-Pemberangkatan (OPP/BP2MI), biometrik E-KTKLN / E-KPMI & kesiapan berangkat.",
      isSystemRole: true,
      isReadOnly: false,
      allowedScope: "ALL",
      allowedMenus: [
        "beranda",
        "cpmi",
        "pelatihan",
        "medical_visa",
        "doc_print",
        "pengingat",
      ],
      permissions: {
        canVerify: true,
        canViewSensitive: true,
        canSeeFinance: false,
        canManageStaff: false,
        canExecuteOperation: true,
      },
      createdAt: "2026-01-01",
    },
    {
      id: "role-case-carecenter",
      code: "CASE_CARECENTER",
      name: "Manajemen Case / CareCenter",
      description:
        "Tim penanganan kasus pengaduan PMI, perlindungan hukum, monitoring Portal Mandiri & komunikasi darurat.",
      isSystemRole: true,
      isReadOnly: false,
      allowedScope: "ALL",
      allowedMenus: [
        "beranda",
        "cases",
        "cpmi",
        "pengingat",
        "portal_cpmi",
        "whatsapp_gateway",
      ],
      permissions: {
        canVerify: false,
        canViewSensitive: true,
        canSeeFinance: false,
        canManageStaff: false,
        canExecuteOperation: true,
      },
      createdAt: "2026-01-01",
    },
  ];
}

function createInitialSeed(): DatabaseSchema {
  const tenants = createInitialTenants();
  const branches: Branch[] = [
    {
      id: "br-jkt",
      tenantId: "tenant-panca",
      code: "JKT-HQ",
      name: "Kantor Pusat Jakarta",
      city: "Jakarta Timur",
      headName: "Ahmad Sarkoni",
      phone: "021-87901122",
      address: "Jl. Kayu Manis No. 51, Jakarta Timur",
      status: "ACTIVE",
    },
    {
      id: "br-idm",
      tenantId: "tenant-panca",
      code: "IDM-01",
      name: "Cabang Indramayu",
      city: "Indramayu, Jawa Barat",
      headName: "Hj. Siti Aminah",
      phone: "0234-274511",
      address: "Jl. Mayor Dasuki No. 12, Jatibarang, Indramayu",
      status: "ACTIVE",
    },
    {
      id: "br-clp",
      tenantId: "tenant-panca",
      code: "CLP-02",
      name: "Cabang Cilacap",
      city: "Cilacap, Jawa Tengah",
      headName: "Hendro Prasetyo",
      phone: "0282-534901",
      address: "Jl. Gatot Subroto No. 45, Cilacap",
      status: "ACTIVE",
    },
    {
      id: "br-mlg",
      tenantId: "tenant-panca",
      code: "MLG-03",
      name: "Cabang Malang",
      city: "Malang, Jawa Timur",
      headName: "Wahyu Setiawan",
      phone: "0341-491822",
      address: "Jl. Panji No. 80, Kepanjen, Malang",
      status: "ACTIVE",
    },
  ];

  const sponsors: Sponsor[] = [
    {
      id: "sp-1",
      code: "PL-IDM-001",
      name: "Kang Dedi Kusnadi",
      phone: "0812-2300-4411",
      area: "Jatibarang & Karangampel",
      branchId: "br-idm",
      bankAccount: "BRI 4192-01-009281-53-2 a.n. Dedi Kusnadi",
      commissionPerCpmi: 4500000,
      paidAmount: 0,
      payableAmount: 0,
    },
    {
      id: "sp-2",
      code: "PL-CLP-002",
      name: "Pak Slamet Riyadi",
      phone: "0813-9100-8821",
      area: "Kroya & Majenang",
      branchId: "br-clp",
      bankAccount: "BCA 0981-2291-01 a.n. Slamet Riyadi",
      commissionPerCpmi: 4000000,
      paidAmount: 0,
      payableAmount: 0,
    },
    {
      id: "sp-3",
      code: "PL-MLG-003",
      name: "Bu Nurhayati",
      phone: "0857-3310-9910",
      area: "Dampit & Kepanjen",
      branchId: "br-mlg",
      bankAccount: "Mandiri 144-00-9182731-9 a.n. Nurhayati",
      commissionPerCpmi: 5000000,
      paidAmount: 0,
      payableAmount: 0,
    },
  ];

  const candidates: Candidate[] = [
    {
      id: "cpmi-1",
      regNumber: "P3MI-2026-0101",
      nik: "3212155408980001",
      fullName: "Sri Wahyuni",
      gender: "P",
      birthPlace: "Indramayu",
      birthDate: "1998-08-14",
      phone: "0812-8821-3301",
      address: "Desa Bulak Blok Rabu RT 04/02, Jatibarang, Indramayu",
      maritalStatus: "Kawin",
      education: "SMA/SMK",
      destinationCountry: "Arab Saudi",
      jobSector: "Housekeeping & Babysitter (Majikan Langsung)",
      employerName: "Al-Otaibi Family Residence (Riyadh)",
      agencyPartner: "Maktab Istiqdam Al-Wataniyah (Riyadh)",
      vacancyId: "vac-1",
      stage: "READY",
      specialStatus: "NORMAL",
      processTrack: "NON_REKOM",
      flightInfo: "Saudia Airlines · SV819",
      departureDate: relativeDate(6),
      placementFee: 36000000,
      costIncurred: 17500000,
      sponsorCommission: 6500000,
      commissionPaid: false,
      branchId: "br-idm",
      sponsorId: "sp-1",
      portalPin: "980001",
      createdAt: relativeDate(-65),
      updatedAt: relativeDate(-1),
      documents: buildDocsForCandidate("cpmi-1", {
        KTP: {
          status: "VERIFIED",
          docNumber: "3212155408980001",
          issuedBy: "Disdukcapil Kab. Indramayu",
          issueDate: "2021-03-10",
          aiCheckStatus: "MATCH",
          aiCheckNotes: "NIK 16 digit & Nama cocok 100% dengan profil CPMI.",
          verifiedBy: "Admin Pusat (Rina)",
          verifiedAt: relativeDate(-60),
        },
        KK: {
          status: "VERIFIED",
          docNumber: "3212150911190004",
          issuedBy: "Disdukcapil Kab. Indramayu",
          aiCheckStatus: "MATCH",
          verifiedBy: "Admin Pusat (Rina)",
          verifiedAt: relativeDate(-60),
        },
        AKTA_IJAZAH: {
          status: "VERIFIED",
          docNumber: "DN-02 Mk 0081921",
          issuedBy: "SMKN 1 Jatibarang",
          aiCheckStatus: "MATCH",
          verifiedBy: "Admin Pusat (Rina)",
          verifiedAt: relativeDate(-59),
        },
        IZIN_KELUARGA: {
          status: "VERIFIED",
          docNumber: "470/118/DS-BLK/2026",
          issuedBy: "Kuwu Desa Bulak",
          verifiedBy: "Admin Pusat (Rina)",
          verifiedAt: relativeDate(-55),
        },
        MEDICAL: {
          status: "VERIFIED",
          docNumber: "WAFID-CRB-2026-9912",
          issuedBy: "Klinik Wafid GCC Resmi Cirebon",
          issueDate: relativeDate(-78),
          expiryDate: relativeDate(12),
          medicalResult: "FIT",
          aiCheckStatus: "MATCH",
          aiCheckNotes: "Status Wafid FIT terdeteksi. Perhatian: Masa berlaku MCU tersisa 12 hari.",
          verifiedBy: "Staf Dokumen (Dimas)",
          verifiedAt: relativeDate(-76),
        },
        PASPOR: {
          status: "VERIFIED",
          docNumber: "E8821940",
          issuedBy: "Kantor Imigrasi Kelas I TPI Cirebon",
          issueDate: "2024-05-12",
          expiryDate: "2029-05-12",
          aiCheckStatus: "MATCH",
          aiCheckNotes: "MRZ Paspor terbaca valid. Masa berlaku > 2 tahun.",
          verifiedBy: "Staf Dokumen (Dimas)",
          verifiedAt: relativeDate(-45),
        },
        VISA: {
          status: "VERIFIED",
          docNumber: "SA-VISA-9920184",
          issuedBy: "Kedutaan Besar Arab Saudi (Tasheer Jakarta)",
          issueDate: relativeDate(-10),
          expiryDate: relativeDate(80),
          aiCheckStatus: "MATCH",
          verifiedBy: "Staf Dokumen (Dimas)",
          verifiedAt: relativeDate(-9),
        },
        TIKET_EKTKLN: {
          status: "UPLOADED",
          docNumber: "SV819-CGK-RUH",
          issuedBy: "Saudia Airlines (Jalur Non-Rekom — Langsung Tiket)",
          notes: "Jalur Non-Rekom: Tanpa BPJS-TK, PAP & KTKLN. Menunggu konfirmasi boarding tiket SV819 untuk berangkat.",
        },
      }),
    },
    {
      id: "cpmi-2",
      regNumber: "P3MI-2026-0102",
      nik: "3301081904960003",
      fullName: "Ahmad Fauzi",
      gender: "L",
      birthPlace: "Cilacap",
      birthDate: "1996-04-19",
      phone: "0813-2901-7742",
      address: "Jl. Raya Kroya No. 45, Kec. Kroya, Cilacap",
      maritalStatus: "Belum Kawin",
      education: "SMA/SMK",
      destinationCountry: "Arab Saudi",
      jobSector: "Family Driver & Building Maintenance",
      employerName: "Syarikah Al-Jazeera & Al-Harbi Residence (Riyadh)",
      agencyPartner: "Al-Jazeera Recruitment Office (Riyadh)",
      vacancyId: "vac-2",
      stage: "CPMI",
      specialStatus: "NORMAL",
      processTrack: "REKOM",
      siskop2miId: "SISKOP-2026-SA-41029",
      placementFee: 35000000,
      costIncurred: 8100000,
      sponsorCommission: 5500000,
      commissionPaid: false,
      branchId: "br-clp",
      sponsorId: "sp-2",
      portalPin: "960003",
      createdAt: relativeDate(-50),
      updatedAt: relativeDate(-2),
      documents: buildDocsForCandidate("cpmi-2", {
        KTP: {
          status: "VERIFIED",
          docNumber: "3301081904960003",
          issuedBy: "Disdukcapil Kab. Cilacap",
          aiCheckStatus: "MATCH",
          verifiedBy: "Admin Pusat (Rina)",
          verifiedAt: relativeDate(-48),
        },
        KK: {
          status: "VERIFIED",
          docNumber: "3301080201150009",
          issuedBy: "Disdukcapil Kab. Cilacap",
          aiCheckStatus: "MATCH",
          verifiedBy: "Admin Pusat (Rina)",
          verifiedAt: relativeDate(-48),
        },
        AKTA_IJAZAH: {
          status: "VERIFIED",
          docNumber: "DN-03 Mk 0918231",
          issuedBy: "SMK YPE Kroya",
          verifiedBy: "Admin Pusat (Rina)",
          verifiedAt: relativeDate(-47),
        },
        IZIN_KELUARGA: {
          status: "VERIFIED",
          docNumber: "474/89/KRY/2026",
          issuedBy: "Kepala Desa Kroya",
          verifiedBy: "Admin Pusat (Rina)",
          verifiedAt: relativeDate(-44),
        },
        MEDICAL: {
          status: "VERIFIED",
          docNumber: "WAFID-CLP-2026-1182",
          issuedBy: "Ar-Razi Medical Center (Wafid GCC)",
          issueDate: relativeDate(-85),
          expiryDate: relativeDate(5),
          medicalResult: "FIT",
          aiCheckStatus: "MATCH",
          aiCheckNotes: "KRITIS: Masa berlaku Medical Wafid habis dalam 5 hari!",
          verifiedBy: "Staf Dokumen (Dimas)",
          verifiedAt: relativeDate(-84),
        },
        PASPOR: {
          status: "VERIFIED",
          docNumber: "C1092831",
          issuedBy: "Kantor Imigrasi Cilacap",
          issueDate: "2021-11-10",
          expiryDate: relativeDate(24),
          aiCheckStatus: "MISMATCH",
          aiCheckNotes: "Masa berlaku paspor kurang dari 6 bulan (sisa 24 hari). Wajib perpanjangan sebelum Stamping Visa Arab Saudi.",
          verifiedBy: "Staf Dokumen (Dimas)",
          verifiedAt: relativeDate(-40),
        },
        SERTIFIKAT_KOMPETENSI: {
          status: "VERIFIED",
          docNumber: "BNSP-DRV-SA-88120",
          issuedBy: "BLK-LN Panca Banyu Ajisakti",
          verifiedBy: "Admin Pusat (Rina)",
          verifiedAt: relativeDate(-30),
        },
        PERJANJIAN_PENEMPATAN: {
          status: "UPLOADED",
          docNumber: "PK-SA-2026-088",
          issuedBy: "Al-Jazeera Recruitment Office Riyadh",
          notes: "Menunggu verifikasi tanda tangan Perjanjian Penempatan & BPJS-TK.",
        },
      }),
    },
    {
      id: "cpmi-3",
      regNumber: "P3MI-2026-0103",
      nik: "3507126102990002",
      fullName: "Dewi Lestari",
      gender: "P",
      birthPlace: "Malang",
      birthDate: "1999-02-21",
      phone: "0857-4491-2201",
      address: "Dusun Krajan RT 02/01, Kec. Dampit, Kab. Malang",
      maritalStatus: "Belum Kawin",
      education: "SMA/SMK",
      destinationCountry: "Uni Emirat Arab (UAE)",
      jobSector: "Domestic Worker & Caregiver (PRT / Lansia)",
      employerName: "Al-Suwaidi Family Villa (Abu Dhabi)",
      agencyPartner: "Al-Noor Tadbeer & Domestic Services (Dubai)",
      stage: "CPMI",
      specialStatus: "NORMAL",
      processTrack: "NON_REKOM",
      placementFee: 35000000,
      costIncurred: 9300000,
      sponsorCommission: 6000000,
      commissionPaid: false,
      branchId: "br-mlg",
      sponsorId: "sp-3",
      portalPin: "990002",
      createdAt: relativeDate(-95),
      updatedAt: relativeDate(-3),
      documents: buildDocsForCandidate("cpmi-3", {
        KTP: {
          status: "VERIFIED",
          docNumber: "3507126102990002",
          issuedBy: "Disdukcapil Kab. Malang",
          aiCheckStatus: "MATCH",
          verifiedBy: "Admin Pusat (Rina)",
          verifiedAt: relativeDate(-90),
        },
        KK: {
          status: "VERIFIED",
          docNumber: "3507121104180002",
          issuedBy: "Disdukcapil Kab. Malang",
          verifiedBy: "Admin Pusat (Rina)",
          verifiedAt: relativeDate(-90),
        },
        AKTA_IJAZAH: {
          status: "VERIFIED",
          docNumber: "DN-05 Mk 0441290",
          issuedBy: "SMAN 1 Dampit",
          verifiedBy: "Admin Pusat (Rina)",
          verifiedAt: relativeDate(-88),
        },
        IZIN_KELUARGA: {
          status: "VERIFIED",
          docNumber: "470/212/DMP/2026",
          issuedBy: "Kepala Desa Dampit",
          verifiedBy: "Admin Pusat (Rina)",
          verifiedAt: relativeDate(-85),
        },
        MEDICAL: {
          status: "EXPIRED",
          docNumber: "WAFID-MLG-2026-0412",
          issuedBy: "Al-Haramain Diagnostic Center Surabaya (Wafid GCC)",
          issueDate: relativeDate(-94),
          expiryDate: relativeDate(-4),
          medicalResult: "FIT",
          aiCheckStatus: "MISMATCH",
          aiCheckNotes: "EXPIRED: Masa berlaku hasil Medical Wafid sudah lewat 4 hari lalu. Blokir kenaikan ke tahap READY.",
          verifiedBy: "Staf Dokumen (Dimas)",
          verifiedAt: relativeDate(-92),
        },
        PASPOR: {
          status: "VERIFIED",
          docNumber: "E9011823",
          issuedBy: "Kantor Imigrasi Kelas I TPI Malang",
          issueDate: "2025-01-15",
          expiryDate: "2030-01-15",
          aiCheckStatus: "MATCH",
          verifiedBy: "Staf Dokumen (Dimas)",
          verifiedAt: relativeDate(-70),
        },
        VISA: {
          status: "VERIFIED",
          docNumber: "UAE-EVISA-551920",
          issuedBy: "MOHRE / GDRFA Abu Dhabi UAE",
          issueDate: relativeDate(-15),
          expiryDate: relativeDate(45),
          verifiedBy: "Staf Dokumen (Dimas)",
          verifiedAt: relativeDate(-14),
        },
      }),
    },
    {
      id: "cpmi-7",
      regNumber: "P3MI-2025-0042",
      nik: "3507185006940004",
      fullName: "Siti Khodijah",
      gender: "P",
      birthPlace: "Malang",
      birthDate: "1994-06-10",
      phone: "0858-1120-9944",
      address: "Kec. Kepanjen, Kab. Malang",
      maritalStatus: "Kawin",
      education: "SMA/SMK",
      destinationCountry: "Uni Emirat Arab (UAE)",
      jobSector: "Hospitality & Housekeeping (Tadbeer / Hotel)",
      employerName: "Al-Maktoum Residence & Tadbeer Dubai",
      agencyPartner: "Emirates Tadbeer & Hospitality Services LLC (Dubai)",
      stage: "ACTIVE_WORKER",
      specialStatus: "NORMAL",
      processTrack: "REKOM",
      siskop2miId: "SISKOP-2025-AE-11902",
      flightInfo: "Emirates · EK359",
      departureDate: "2025-11-15",
      placementFee: 36000000,
      costIncurred: 21040000,
      sponsorCommission: 6000000,
      commissionPaid: true,
      branchId: "br-mlg",
      sponsorId: "sp-3",
      portalPin: "940004",
      createdAt: "2025-08-01",
      updatedAt: relativeDate(-20),
      documents: buildDocsForCandidate("cpmi-7", {
        KTP: { status: "VERIFIED", docNumber: "3507185006940004", verifiedBy: "Admin Pusat (Rina)" },
        KK: { status: "VERIFIED", docNumber: "3507180101140002", verifiedBy: "Admin Pusat (Rina)" },
        AKTA_IJAZAH: { status: "VERIFIED", docNumber: "DN-05 Mk 0119201", verifiedBy: "Admin Pusat (Rina)" },
        IZIN_KELUARGA: { status: "VERIFIED", docNumber: "470/88/KPJ/2025", verifiedBy: "Admin Pusat (Rina)" },
        MEDICAL: { status: "VERIFIED", docNumber: "WAFID-SUB-2025-881", medicalResult: "FIT", verifiedBy: "Staf Dokumen (Dimas)" },
        PASPOR: {
          status: "VERIFIED",
          docNumber: "C8819201",
          issuedBy: "Imigrasi Malang",
          issueDate: "2021-12-01",
          expiryDate: relativeDate(45),
          verifiedBy: "Staf Dokumen (Dimas)",
        },
        SERTIFIKAT_KOMPETENSI: { status: "VERIFIED", docNumber: "BNSP-AE-2025-0012", verifiedBy: "Admin Pusat (Rina)" },
        PERJANJIAN_PENEMPATAN: { status: "VERIFIED", docNumber: "MOHRE-AE-2025-331", expiryDate: "2027-11-15", verifiedBy: "Admin Pusat (Rina)" },
        VISA: { status: "VERIFIED", docNumber: "AE-VISA-2025-881", expiryDate: "2027-11-15", verifiedBy: "Staf Dokumen (Dimas)" },
        EKTKLN_OPP: { status: "VERIFIED", docNumber: "EKPMI-BP2MI-2025-0812", verifiedBy: "Admin Pusat (Rina)" },
        TIKET_EKTKLN: { status: "VERIFIED", docNumber: "EK359-CGK-DXB", issuedBy: "Emirates", verifiedBy: "Admin Pusat (Rina)" },
      }),
    },
  ];

  const auditLogs: AuditLog[] = [
    {
      id: "aud-1",
      candidateId: "cpmi-1",
      candidateName: "Sri Wahyuni",
      actorName: "Staf Dokumen (Dimas)",
      actorRole: "STAF_DOKUMEN",
      branchName: "Kantor Pusat Jakarta",
      actionType: "DOC_VERIFIED",
      summary: "Memverifikasi Visa Kerja Arab Saudi (SA-VISA-9920184) untuk Sri Wahyuni (Jalur Non-Rekom)",
      details: "Jalur Non-Rekom (Tanpa BPJS-TK, PAP & KTKLN): Langsung lanjut ke proses Tiket Penerbangan SV819 & Keberangkatan.",
      timestamp: relativeDate(-2) + " 14:22 WIB",
    },
    {
      id: "aud-2",
      candidateId: "cpmi-7",
      candidateName: "Siti Khodijah",
      actorName: "Rina Kartika, S.Psi.",
      actorRole: "ADMIN_PUSAT",
      branchName: "Kantor Pusat Jakarta",
      actionType: "FINANCE_PAYMENT",
      summary: "Mencairkan Pelunasan Komisi Sponsor Skema Zero Cost UEA (Rp 6.000.000) a.n Siti Khodijah",
      details: "100% Dibiayai Syarikah/Majikan. Medical Wafid FIT & Visa Kerja UAE telah terbit.",
      timestamp: relativeDate(-1) + " 11:10 WIB",
    },
    {
      id: "aud-3",
      candidateId: "cpmi-2",
      candidateName: "Ahmad Fauzi",
      actorName: "Ahmad Sarkoni",
      actorRole: "DIREKTUR",
      branchName: "Kantor Pusat Jakarta",
      actionType: "SENSITIVE_DOC_VIEW",
      summary: "Membuka dokumen sensitif: Paspor RI & Hasil Medical Wafid Ahmad Fauzi",
      details: "Tercatat sesuai kepatuhan UU Perlindungan Data Pribadi (UU PDP).",
      timestamp: relativeDate(0) + " 09:15 WIB",
    },
  ];

  const db: DatabaseSchema = {
    tenants,
    branches,
    sponsors,
    staffAccounts: createInitialStaff(),
    roles: createInitialRoles(),
    candidates,
    cases: createInitialCases(),
    vacancies: createInitialVacancies(),
    renewalTasks: [],
    auditLogs,
    badilRecords: createInitialBadilRecords(),
    foreignAgencies: createInitialForeignAgencies(),
    medicalClinics: createInitialMedicalClinics(),
    bpjsFinancingPartners: createInitialBpjsFinancing(),
    sponsorSubmissions: [],
    demoSponsorSubmissionsCleared: true,
    whatsAppLogs: createInitialWhatsAppLogs(),
    cashJournals: createInitialCashJournals(),
    cashAdvances: createInitialCashAdvances(),
    syarikahInvoices: createInitialSyarikahInvoices(),
    employerInterviews: createInitialEmployerInterviews(),
    masterImmigrationOffices: createInitialMasterImmigrationOffices(),
    masterDisdukcapil: createInitialMasterDisdukcapil(),
    masterMedicalClinics: createInitialMasterMedicalClinics(),
    masterAirlines: createInitialMasterAirlines(),
    masterBlkLn: createInitialMasterBlkLn(),
    masterEmbassies: createInitialMasterEmbassies(),
  };

  syncExpirationsAndTasks(db);
  return db;
}

export function createInitialBadilRecords(): BadilRecord[] {
  return [];
}

export function createInitialForeignAgencies(): ForeignAgency[] {
  return [
    {
      id: "agn-1",
      code: "AGN-SA-001",
      name: "Al-Maharah Human Resources Co. (ARCO / SPSK)",
      country: "Arab Saudi",
      region: "TIMUR_TENGAH",
      licenseOrWakalahNo: "MUSANED-SPSK-SA-2026-8812",
      scheme: "SPSK (Sistem Penempatan Satu Kanal) / Musaned",
      picName: "Sheikh Khalid Al-Otaibi / Divisi Indonesia",
      phoneEmail: "+966-11-4509911 · indonesia@maharah.com.sa",
      defaultAgencyFeeIdr: 38000000,
      warrantyDays: 90,
      mouExpiryDate: "2028-06-30",
      status: "ACTIVE",
    },
    {
      id: "agn-2",
      code: "AGN-AE-001",
      name: "Tadbeer Al-Reaya & Emaar Hospitality Manpower",
      country: "Uni Emirat Arab (UAE)",
      region: "TIMUR_TENGAH",
      licenseOrWakalahNo: "MOHRE-TADBEER-DXB-4410",
      scheme: "Tadbeer / MOHRE Corporate Employment Visa",
      picName: "Mr. Tariq Al-Mansoori",
      phoneEmail: "+971-4-3391020 · partner@tadbeerdubai.ae",
      defaultAgencyFeeIdr: 36000000,
      warrantyDays: 90,
      mouExpiryDate: "2028-03-15",
      status: "ACTIVE",
    },
    {
      id: "agn-3",
      code: "AGN-KW-001",
      name: "Al-Dhow International Recruitment & Royal Hayat",
      country: "Kuwait",
      region: "TIMUR_TENGAH",
      licenseOrWakalahNo: "PAM-WAKALAH-KW-2026-309",
      scheme: "Formal Sector Wakalah (Legalisasi KBRI Kuwait)",
      picName: "Mrs. Fatima Al-Sabah",
      phoneEmail: "+965-2241-8890 · recruitment@aldhow-kw.com",
      defaultAgencyFeeIdr: 35000000,
      warrantyDays: 90,
      mouExpiryDate: "2027-12-31",
      status: "ACTIVE",
    },
    {
      id: "agn-4",
      code: "AGN-OM-001",
      name: "Muscat Care & Hospitality Manpower LLC",
      country: "Oman",
      region: "TIMUR_TENGAH",
      licenseOrWakalahNo: "ROP-OM-WAKALAH-2026-118",
      scheme: "Royal Oman Police Work Permit & Wakalah KBRI Muscat",
      picName: "Mr. Said Al-Balushi",
      phoneEmail: "+968-2456-7712 · info@muscatcare.om",
      defaultAgencyFeeIdr: 34000000,
      warrantyDays: 90,
      mouExpiryDate: "2027-11-20",
      status: "ACTIVE",
    },
    {
      id: "agn-5",
      code: "AGN-JO-001",
      name: "Classic Fashion Apparel Industry QIZ Jordan",
      country: "Yordania",
      region: "TIMUR_TENGAH",
      licenseOrWakalahNo: "MOL-QIZ-AMM-2026-552",
      scheme: "Sektor Formal Industri Garmen QIZ (Al-Karak / Amman)",
      picName: "Mr. Sanal Kumar / HRD Indonesia Desk",
      phoneEmail: "+962-6-4029111 · hr.indonesia@classicfashion.com.jo",
      defaultAgencyFeeIdr: 30000000,
      warrantyDays: 90,
      mouExpiryDate: "2028-01-31",
      status: "ACTIVE",
    },
    {
      id: "agn-6",
      code: "AGN-SA-002",
      name: "Maktab Istiqdam Al-Wataniyah (Riyadh & Jeddah)",
      country: "Arab Saudi",
      region: "TIMUR_TENGAH",
      licenseOrWakalahNo: "WAKALAH-SA-DIRECT-1092",
      scheme: "Wakalah Syarikah & Majikan Langsung (Jalur Rekom & Non-Rekom)",
      picName: "Sheikh Fahad Al-Harbi",
      phoneEmail: "+966-11-291-8800 · fahad@wataniyah-sa.com",
      defaultAgencyFeeIdr: 36000000,
      warrantyDays: 90,
      mouExpiryDate: "2028-09-30",
      status: "ACTIVE",
    },
    {
      id: "agn-7",
      code: "AGN-QA-001",
      name: "Doha Gulf Manpower & Hospitality W.L.L",
      country: "Qatar",
      region: "TIMUR_TENGAH",
      licenseOrWakalahNo: "MOL-QA-DOHA-77210",
      scheme: "Wakalah Hospitality & Home Care Doha Qatar (Zero Cost)",
      picName: "Mr. Hassan Al-Thani",
      phoneEmail: "+974-4412-9011 · recruitment@dohagulf.qa",
      defaultAgencyFeeIdr: 36000000,
      warrantyDays: 90,
      mouExpiryDate: "2028-05-15",
      status: "ACTIVE",
    },
  ];
}

export function createInitialMedicalClinics(): MedicalClinicPartner[] {
  return [
    {
      id: "mcu-1",
      code: "KLINIK-WAFID-01",
      name: "Ar-Razi Medical Center (Terakreditasi Wafid / eks-GAMCA)",
      accreditation: "WAFID_GCC_GAMCA",
      city: "Jakarta Selatan",
      picName: "dr. H. Farhan Al-Kaff, Sp.PD",
      phone: "021-7982-4410",
      standardMcuFeeIdr: 1650000,
      targetCountries: "Arab Saudi, UAE, Kuwait, Oman, Qatar, Bahrain (GCC)",
      status: "ACTIVE",
    },
    {
      id: "mcu-2",
      code: "KLINIK-WAFID-02",
      name: "Al-Haramain Diagnostic Center Surabaya (Wafid GCC)",
      accreditation: "WAFID_GCC_GAMCA",
      city: "Surabaya / Malang",
      picName: "dr. Siti Rahmawati, M.Kes",
      phone: "031-8291-0032",
      standardMcuFeeIdr: 1650000,
      targetCountries: "Arab Saudi, UAE, Kuwait, Oman, Qatar (GCC)",
      status: "ACTIVE",
    },
    {
      id: "mcu-3",
      code: "KLINIK-WAFID-03",
      name: "Klinik Utama Al-Syifa Cirebon (Wafid GCC & Kemenkes)",
      accreditation: "WAFID_DAN_KEMENKES",
      city: "Cirebon / Indramayu",
      picName: "dr. Bambang Setiawan",
      phone: "0231-208911",
      standardMcuFeeIdr: 1650000,
      targetCountries: "Arab Saudi, UAE, Kuwait, Oman, Yordania",
      status: "ACTIVE",
    },
    {
      id: "mcu-4",
      code: "KLINIK-MKS-02",
      name: "RS Polri Kramat Jati — Unit Pra-Medical & Wafid Timur Tengah",
      accreditation: "WAFID_DAN_KEMENKES",
      city: "Jakarta Timur",
      picName: "dr. Hendra Kusuma, Sp.Ok",
      phone: "021-8093288",
      standardMcuFeeIdr: 1500000,
      targetCountries: "Pra-Medical & Wafid Kawasan Timur Tengah",
      status: "ACTIVE",
    },
  ];
}

export function createInitialBpjsFinancing(): BpjsFinancingPartner[] {
  return [
    {
      id: "bpjs-1",
      code: "BPJS-TK-PMI",
      name: "BPJS Ketenagakerjaan — Perlindungan Jaminan Sosial PMI (Khusus Jalur Rekom)",
      partnerType: "BPJS_KETENAGAKERJAAN",
      programPackage: "Paket JKK + JKM (Pra, Masa 24 Bln & Purna — Wajib Jalur Rekom, Dilewati pada Non-Rekom)",
      premiumOrRateInfo: "Rp 370.000 / CPMI (Ditanggung Penuh Syarikah / Majikan — Zero Cost)",
      picName: "Rizky Pratama (Account Representative PMI)",
      phone: "175 / 021-5207797",
      status: "ACTIVE",
    },
    {
      id: "bpjs-2",
      code: "ASR-JASINDO-PMI",
      name: "Konsorsium Asuransi Jasindo — Proteksi & Repatriasi Timur Tengah",
      partnerType: "ASURANSI_PMI",
      programPackage: "Asuransi Kesehatan & Pemulangan Kawasan Timur Tengah (Dibiayai Syarikah)",
      premiumOrRateInfo: "Rp 450.000 / Kontrak 2 Tahun (Zero Cost CPMI)",
      picName: "Dewi Sartika, AAIK",
      phone: "021-3924888",
      status: "ACTIVE",
    },
    {
      id: "bpjs-5",
      code: "BANK-BSI-SYARIAH",
      name: "PT Bank Syariah Indonesia Tbk (BSI) — Mitra Payroll & Wakalah Syarikah Timteng",
      partnerType: "BANK_KUR_PMI",
      programPackage: "Penerimaan Dana Wakalah Zero Cost Syarikah & Remitansi Gaji PMI (SAR/AED/KWD/OMR/QAR)",
      premiumOrRateInfo: "100% Zero Cost (Tanpa Pinjaman/Tanpa Potong Gaji CPMI)",
      picName: "Ust. Fauzan Hakim (BSI International Desk)",
      phone: "14040 / 021-30405555",
      status: "ACTIVE",
    },
  ];
}

// ============================================================
// GENERATOR DATA AWAL MASTER DATA OPERASIONAL TERPADU P3MI
// (Kanim, Disdukcapil, Medical Wafid, Airlines, BLK-LN, Kedutaan)
// ============================================================

export function createInitialMasterImmigrationOffices(): MasterImmigrationOffice[] {
  return [
    {
      id: "kanim-jkt-timur",
      code: "KANIM-JKT-1",
      name: "Kantor Imigrasi Kelas I TPI Jakarta Timur",
      city: "Jakarta Timur",
      province: "DKI Jakarta",
      address: "Jl. Bekasi Timur Raya No. 169, Cipinang Besar Utara, Jatinegara, Jakarta Timur 13410",
      phone: "(021) 8509962 / (021) 8509964",
      headOfOfficeName: "R. H. Sigit Setyawan, S.H., M.H.",
      headOfOfficeTitle: "Kepala Kantor Imigrasi Kelas I TPI Jakarta Timur",
      active: true,
    },
    {
      id: "kanim-jkt-pusat",
      code: "KANIM-JKT-PUS",
      name: "Kantor Imigrasi Kelas I Khusus Non TPI Jakarta Pusat",
      city: "Jakarta Pusat",
      province: "DKI Jakarta",
      address: "Jl. Merpati Blok B12 No. 3, RW 10, Gn. Sahari Sel., Kemayoran, Jakarta Pusat 10720",
      phone: "(021) 6541209",
      headOfOfficeName: "Bambang Trianto, S.Sos., M.Si.",
      headOfOfficeTitle: "Kepala Kantor Imigrasi Kelas I Khusus Non TPI Jakarta Pusat",
      active: true,
    },
    {
      id: "kanim-cirebon",
      code: "KANIM-CRB-1",
      name: "Kantor Imigrasi Kelas I TPI Cirebon",
      city: "Cirebon",
      province: "Jawa Barat",
      address: "Jl. Sultan Ageng Tirtayasa No. 51, Kedawung, Cirebon, Jawa Barat 45153",
      phone: "(0231) 488241 / 488242",
      headOfOfficeName: "Nur Raisha Pujiastuti, S.H.",
      headOfOfficeTitle: "Kepala Kantor Imigrasi Kelas I TPI Cirebon",
      active: true,
    },
    {
      id: "kanim-cilacap",
      code: "KANIM-CLP-2",
      name: "Kantor Imigrasi Kelas II Non TPI Cilacap",
      city: "Cilacap",
      province: "Jawa Tengah",
      address: "Jl. Urip Sumoharjo No. 249, Gumilir, Cilacap Utara, Cilacap, Jawa Tengah 53231",
      phone: "(0282) 541133",
      headOfOfficeName: "Yoga Aria Perdana, S.H., M.Si.",
      headOfOfficeTitle: "Kepala Kantor Imigrasi Kelas II Non TPI Cilacap",
      active: true,
    },
    {
      id: "kanim-semarang",
      code: "KANIM-SMG-1",
      name: "Kantor Imigrasi Kelas I TPI Semarang",
      city: "Semarang",
      province: "Jawa Tengah",
      address: "Jl. Siliwangi No. 514, Kembangarum, Semarang Barat, Kota Semarang, Jawa Tengah 50148",
      phone: "(024) 7606166",
      headOfOfficeName: "Guntur Sahat Hamonangan, S.H.",
      headOfOfficeTitle: "Kepala Kantor Imigrasi Kelas I TPI Semarang",
      active: true,
    },
    {
      id: "kanim-surabaya",
      code: "KANIM-SBY-KHUSUS",
      name: "Kantor Imigrasi Kelas I Khusus TPI Surabaya",
      city: "Surabaya / Sidoarjo",
      province: "Jawa Timur",
      address: "Jl. Raya Juanda No. 22, Sedati Agung, Sedati, Sidoarjo, Jawa Timur 61253",
      phone: "(031) 8690534",
      headOfOfficeName: "Chicco Ahmad Muttaqin, S.E., M.M.",
      headOfOfficeTitle: "Kepala Kantor Imigrasi Kelas I Khusus TPI Surabaya",
      active: true,
    },
    {
      id: "kanim-soetta",
      code: "KANIM-CGK-TPI",
      name: "Kantor Imigrasi Kelas I Khusus TPI Soekarno-Hatta",
      city: "Tangerang",
      province: "Banten",
      address: "Kawasan Bandara Internasional Soekarno-Hatta, Tangerang, Banten 15126",
      phone: "(021) 5507185",
      headOfOfficeName: "Subki Miuldi, S.Kom., M.H.",
      headOfOfficeTitle: "Kepala Kantor Imigrasi Kelas I Khusus TPI Soekarno-Hatta",
      active: true,
    },
    {
      id: "kanim-mataram",
      code: "KANIM-MTR-1",
      name: "Kantor Imigrasi Kelas I TPI Mataram",
      city: "Mataram",
      province: "Nusa Tenggara Barat",
      address: "Jl. Udayana No. 2, Monjok Barat, Selaparang, Kota Mataram, NTB 83122",
      phone: "(0370) 632520",
      headOfOfficeName: "Pungki Handoyo, S.H., M.Si.",
      headOfOfficeTitle: "Kepala Kantor Imigrasi Kelas I TPI Mataram",
      active: true,
    },
    {
      id: "kanim-karawang",
      code: "KANIM-KRW-2",
      name: "Kantor Imigrasi Kelas II Non TPI Karawang",
      city: "Karawang",
      province: "Jawa Barat",
      address: "Jl. Jend. Ahmad Yani No. 16, Nagasari, Kec. Karawang Barat, Karawang 41312",
      phone: "(0267) 402220",
      headOfOfficeName: "Petrus Teguh Aprianto, S.H.",
      headOfOfficeTitle: "Kepala Kantor Imigrasi Kelas II Non TPI Karawang",
      active: true,
    },
  ];
}

export function createInitialMasterDisdukcapil(): MasterDisdukcapil[] {
  return [
    {
      id: "dukcapil-idm",
      code: "DUKCAPIL-3212",
      regencyCity: "Kabupaten Indramayu",
      province: "Jawa Barat",
      officeName: "Dinas Kependudukan dan Pencatatan Sipil Kab. Indramayu",
      address: "Jl. RA Kartini No. 14, Margadadi, Kec. Indramayu, Kab. Indramayu, Jawa Barat 45211",
      phone: "(0234) 272046 / WhatsApp 0811-2442-120",
      active: true,
    },
    {
      id: "dukcapil-crb",
      code: "DUKCAPIL-3209",
      regencyCity: "Kabupaten Cirebon",
      province: "Jawa Barat",
      officeName: "Dinas Kependudukan dan Pencatatan Sipil Kab. Cirebon",
      address: "Jl. Sunan Kalijaga No. 10, Sumber, Cirebon, Jawa Barat 45611",
      phone: "(0231) 321197",
      active: true,
    },
    {
      id: "dukcapil-clp",
      code: "DUKCAPIL-3301",
      regencyCity: "Kabupaten Cilacap",
      province: "Jawa Tengah",
      officeName: "Dinas Kependudukan dan Pencatatan Sipil Kab. Cilacap",
      address: "Jl. Kauman No. 26, Kandang Macan, Sidanegara, Kec. Cilacap Tengah, Kab. Cilacap, Jawa Tengah 53223",
      phone: "(0282) 534015",
      active: true,
    },
    {
      id: "dukcapil-kdl",
      code: "DUKCAPIL-3324",
      regencyCity: "Kabupaten Kendal",
      province: "Jawa Tengah",
      officeName: "Dinas Kependudukan dan Pencatatan Sipil Kab. Kendal",
      address: "Jl. Pemuda No. 37, Pegulon, Kec. Kendal, Kab. Kendal, Jawa Tengah 51313",
      phone: "(0294) 381664",
      active: true,
    },
    {
      id: "dukcapil-sbg",
      code: "DUKCAPIL-3213",
      regencyCity: "Kabupaten Subang",
      province: "Jawa Barat",
      officeName: "Dinas Kependudukan dan Pencatatan Sipil Kab. Subang",
      address: "Jl. Mayjen Sutoyo No. 15, Karanganyar, Kec. Subang, Kab. Subang, Jawa Barat 41211",
      phone: "(0260) 411477",
      active: true,
    },
    {
      id: "dukcapil-mjl",
      code: "DUKCAPIL-3210",
      regencyCity: "Kabupaten Majalengka",
      province: "Jawa Barat",
      officeName: "Dinas Kependudukan dan Pencatatan Sipil Kab. Majalengka",
      address: "Jl. Gerakan Koperasi No. 19, Majalengka Wetan, Kec. Majalengka, Jawa Barat 45411",
      phone: "(0233) 281488",
      active: true,
    },
    {
      id: "dukcapil-krw",
      code: "DUKCAPIL-3215",
      regencyCity: "Kabupaten Karawang",
      province: "Jawa Barat",
      officeName: "Dinas Kependudukan dan Pencatatan Sipil Kab. Karawang",
      address: "Jl. Panatayuda I No. 4, Nagasari, Kec. Karawang Barat, Karawang, Jawa Barat 41314",
      phone: "(0267) 402241",
      active: true,
    },
    {
      id: "dukcapil-skb",
      code: "DUKCAPIL-3202",
      regencyCity: "Kabupaten Sukabumi",
      province: "Jawa Barat",
      officeName: "Dinas Kependudukan dan Pencatatan Sipil Kab. Sukabumi",
      address: "Jl. Raya Rambay No. 70, Cisaat, Kec. Cisaat, Kab. Sukabumi, Jawa Barat 43152",
      phone: "(0266) 224422",
      active: true,
    },
    {
      id: "dukcapil-cjr",
      code: "DUKCAPIL-3203",
      regencyCity: "Kabupaten Cianjur",
      province: "Jawa Barat",
      officeName: "Dinas Kependudukan dan Pencatatan Sipil Kab. Cianjur",
      address: "Jl. Raya Bandung No. 65, Sadewata, Bojong, Kec. Karangtengah, Kab. Cianjur, Jawa Barat 43281",
      phone: "(0263) 261664",
      active: true,
    },
    {
      id: "dukcapil-lotim",
      code: "DUKCAPIL-5203",
      regencyCity: "Kabupaten Lombok Timur",
      province: "Nusa Tenggara Barat",
      officeName: "Dinas Kependudukan dan Pencatatan Sipil Kab. Lombok Timur",
      address: "Jl. Prof. M. Yamin No. 55, Selong, Kab. Lombok Timur, Nusa Tenggara Barat 83612",
      phone: "(0376) 21102",
      active: true,
    },
    {
      id: "dukcapil-jkt-timur",
      code: "DUKCAPIL-3175",
      regencyCity: "Kota Jakarta Timur",
      province: "DKI Jakarta",
      officeName: "Suku Dinas Kependudukan dan Pencatatan Sipil Kota Adm. Jakarta Timur",
      address: "Jl. Dr. Sumarno Blok D Lt. 3, Sentra Primer Pulo Gebang, Penggilingan, Cakung, Jakarta Timur 13950",
      phone: "(021) 48703893",
      active: true,
    },
  ];
}

export function createInitialMasterMedicalClinics(): MasterMedicalClinic[] {
  return [
    {
      id: "med-wafid-01",
      code: "WAFID-JKT-01",
      name: "Bio Medix Diagnostic Center Jakarta",
      type: "WAFID_GAMCA",
      wafidCode: "WAFID-ID-0012",
      city: "Jakarta Timur",
      address: "Jl. Dewi Sartika No. 294, Cawang, Kec. Kramat Jati, Jakarta Timur 13630",
      phone: "(021) 80878120",
      doctorInCharge: "dr. H. Muhammad Farhan, Sp.PK",
      active: true,
    },
    {
      id: "med-wafid-02",
      code: "WAFID-JKT-02",
      name: "Puri Medika Medical Examination Center",
      type: "WAFID_GAMCA",
      wafidCode: "WAFID-ID-0028",
      city: "Jakarta Utara",
      address: "Jl. Kebon Bawang No. 1, Tanjung Priok, Jakarta Utara 14320",
      phone: "(021) 43902341",
      doctorInCharge: "dr. Siti Rahmawati, Sp.Ok",
      active: true,
    },
    {
      id: "med-wafid-03",
      code: "WAFID-CRB-01",
      name: "Klinik Utama Kencana Cirebon (Wafid GCC)",
      type: "WAFID_GAMCA",
      wafidCode: "WAFID-ID-0045",
      city: "Cirebon",
      address: "Jl. Dr. Wahidin Sudirohusodo No. 42, Sukapura, Kejaksan, Cirebon 45122",
      phone: "(0231) 209811",
      doctorInCharge: "dr. Bambang Setiawan, Sp.Rad",
      active: true,
    },
    {
      id: "med-wafid-04",
      code: "WAFID-SBY-01",
      name: "Medilab Diagnostic Center Surabaya",
      type: "WAFID_GAMCA",
      wafidCode: "WAFID-ID-0033",
      city: "Surabaya",
      address: "Jl. Raya Darmo No. 88, DR. Soetomo, Tegalsari, Kota Surabaya 60264",
      phone: "(031) 5678229",
      doctorInCharge: "dr. Hendra Gunawan, Sp.PK",
      active: true,
    },
    {
      id: "med-pra-01",
      code: "PRA-MED-PBA",
      name: "Klinik Pratama Panca Banyu Husada (Internal In-House)",
      type: "PRA_MEDICAL",
      wafidCode: "-",
      city: "Jakarta Timur",
      address: "Jl. Kayu Manis No. 51-B, Balekambang, Kramat Jati, Jakarta Timur",
      phone: "(021) 2937373",
      doctorInCharge: "dr. Amanda Putri, MARS",
      active: true,
    },
    {
      id: "med-rujuk-01",
      code: "RS-RUJUK-POLRI",
      name: "RS Bhayangkara Tk. I R. Said Sukanto (RS Polri Kramat Jati)",
      type: "RS_RUJUKAN",
      wafidCode: "RS-RUJUK-001",
      city: "Jakarta Timur",
      address: "Jl. Raya Bogor No. 1, Kramat Jati, Jakarta Timur 13510",
      phone: "(021) 8093288",
      doctorInCharge: "dr. Ahmad Faisal, Sp.B",
      active: true,
    },
  ];
}

export function createInitialMasterAirlines(): MasterAirline[] {
  return [
    {
      id: "air-sv",
      iataCode: "SV",
      icaoCode: "SVA",
      name: "Saudia (Saudi Arabian Airlines)",
      country: "Arab Saudi",
      mainHub: "JED (King Abdulaziz Jeddah) / RUH (King Khalid Riyadh)",
      active: true,
    },
    {
      id: "air-ga",
      iataCode: "GA",
      icaoCode: "GIA",
      name: "Garuda Indonesia",
      country: "Indonesia",
      mainHub: "CGK (Soekarno-Hatta Jakarta) / DPS (Ngurah Rai Bali)",
      active: true,
    },
    {
      id: "air-xy",
      iataCode: "XY",
      icaoCode: "KNE",
      name: "Flynas",
      country: "Arab Saudi",
      mainHub: "RUH (King Khalid Riyadh) / JED (King Abdulaziz)",
      active: true,
    },
    {
      id: "air-f3",
      iataCode: "F3",
      icaoCode: "FAD",
      name: "Flyadeal",
      country: "Arab Saudi",
      mainHub: "JED (King Abdulaziz Jeddah)",
      active: true,
    },
    {
      id: "air-ek",
      iataCode: "EK",
      icaoCode: "UAE",
      name: "Emirates",
      country: "Uni Emirat Arab",
      mainHub: "DXB (Dubai International)",
      active: true,
    },
    {
      id: "air-qr",
      iataCode: "QR",
      icaoCode: "QTR",
      name: "Qatar Airways",
      country: "Qatar",
      mainHub: "DOH (Hamad International Doha)",
      active: true,
    },
    {
      id: "air-wy",
      iataCode: "WY",
      icaoCode: "OMA",
      name: "Oman Air",
      country: "Oman",
      mainHub: "MCT (Muscat International)",
      active: true,
    },
    {
      id: "air-ku",
      iataCode: "KU",
      icaoCode: "KAC",
      name: "Kuwait Airways",
      country: "Kuwait",
      mainHub: "KWI (Kuwait International)",
      active: true,
    },
  ];
}

export function createInitialMasterBlkLn(): MasterBlkLn[] {
  return [
    {
      id: "blk-pba-pusat",
      code: "BLK-PBA-01",
      name: "BLK-LN PT. Panca Banyu Ajisakti (Balai Latihan Kerja Mandiri Pusat)",
      ownership: "INTERNAL_PBA",
      vinKemnaker: "2105317501",
      accreditationGrade: "A",
      city: "Jakarta Timur",
      address: "Jl. Kayu Manis No. 51-53, Balekambang, Kec. Kramat Jati, Jakarta Timur 13530",
      phone: "(021) 2937373 / 0811-9877-665",
      picName: "Drs. H. Mulyadi (Instruktur Kepala)",
      capacity: 120,
      active: true,
    },
    {
      id: "blk-mitra-idm",
      code: "BLK-IDM-02",
      name: "BLK-LN Pantura Mandiri Indramayu",
      ownership: "MITRA_DAERAH",
      vinKemnaker: "1904321201",
      accreditationGrade: "A",
      city: "Indramayu",
      address: "Jl. Raya Jatibarang - Indramayu Km 3, Lobener Lor, Jatibarang, Indramayu 45273",
      phone: "(0234) 351890",
      picName: "Hj. Siti Aminah",
      capacity: 80,
      active: true,
    },
    {
      id: "blk-mitra-clp",
      code: "BLK-CLP-03",
      name: "BLK-LN Bina Taruna Mandiri Cilacap",
      ownership: "MITRA_DAERAH",
      vinKemnaker: "2008330101",
      accreditationGrade: "B",
      city: "Cilacap",
      address: "Jl. Gatot Subroto No. 45-B, Sidanegara, Cilacap Tengah 53223",
      phone: "(0282) 534901",
      picName: "Hendro Prasetyo",
      capacity: 60,
      active: true,
    },
    {
      id: "blk-lsp-bnsp",
      code: "LSP-PRAMUGRIYA-01",
      name: "Lembaga Sertifikasi Profesi (LSP) Pramugriya Indonesia · Terlisensi BNSP",
      ownership: "MITRA_DAERAH",
      vinKemnaker: "BNSP-LSP-899-ID",
      accreditationGrade: "A",
      city: "Jakarta Selatan",
      address: "Gedung Naker Promosi Lt. 4, Jl. Gatot Subroto Kav. 44, Jakarta Selatan",
      phone: "(021) 5255733",
      picName: "Ir. Bambang Trihatmojo (Master Asesor)",
      capacity: 200,
      active: true,
    },
  ];
}

export function createInitialMasterEmbassies(): MasterEmbassy[] {
  return [
    {
      id: "emb-kbsa",
      code: "EMB-SA-KBSA",
      country: "Arab Saudi",
      institutionType: "EMBASSY",
      name: "Kedutaan Besar Kerajaan Arab Saudi (KBSA Jakarta)",
      address: "Jl. H. R. Rasuna Said Kav. B-3, Kuningan Timur, Setiabudi, Jakarta Selatan 12950",
      phone: "(021) 28094000",
      email: "idemb@mofa.gov.sa",
      appointmentUrl: "https://visa.mofa.gov.sa",
      active: true,
    },
    {
      id: "emb-vfs-jkt",
      code: "VFS-TASHEER-JKT",
      country: "Arab Saudi",
      institutionType: "VFS_TASHEER",
      name: "VFS Tasheer International Visa Service Center - Jakarta Kuningan",
      address: "Kuningan City Mall Lantai 2, Jl. Prof. Dr. Satrio Kav. 18, Setiabudi, Jakarta Selatan 12940",
      phone: "(021) 30418700",
      email: "info.saudiarabia@vfstasheer.com",
      appointmentUrl: "https://vc.tasheer.com",
      active: true,
    },
    {
      id: "emb-vfs-sby",
      code: "VFS-TASHEER-SBY",
      country: "Arab Saudi",
      institutionType: "VFS_TASHEER",
      name: "VFS Tasheer International Visa Service Center - Surabaya",
      address: "Grand City Mall Lantai 3, Jl. Walikota Mustajab No. 1, Ketabang, Genteng, Kota Surabaya 60272",
      phone: "(031) 5459000",
      email: "info.sub.saudiarabia@vfstasheer.com",
      appointmentUrl: "https://vc.tasheer.com",
      active: true,
    },
    {
      id: "emb-oman",
      code: "EMB-OM-JKT",
      country: "Oman",
      institutionType: "EMBASSY",
      name: "Kedutaan Besar Kesultanan Oman Jakarta",
      address: "Jl. Denpasar Barat No. 1, Kuningan, Karet Kuningan, Setiabudi, Jakarta Selatan 12950",
      phone: "(021) 5268481",
      email: "jakarta@mofa.gov.om",
      appointmentUrl: "https://evisa.rop.gov.om",
      active: true,
    },
    {
      id: "emb-yordania",
      code: "EMB-JO-JKT",
      country: "Yordania",
      institutionType: "EMBASSY",
      name: "Kedutaan Besar Kerajaan Hashemite Yordania Jakarta",
      address: "Jl. Denpasar Raya Blok A.13 No. 1, Kuningan, Setiabudi, Jakarta Selatan 12950",
      phone: "(021) 5211185",
      email: "jakarta@fm.gov.jo",
      appointmentUrl: "https://international.moi.gov.jo",
      active: true,
    },
  ];
}

// --- GENERATOR DATA AWAL MODUL 3, 4, 5 ---
export function createInitialWhatsAppLogs(): WhatsAppNotification[] {
  return [
    {
      id: "wa-001",
      recipientPhone: "081223344551",
      recipientName: "Siti Aminah",
      recipientRole: "CPMI",
      candidateId: "cpmi-001",
      candidateName: "Siti Aminah",
      messageType: "STAGE_UPDATE",
      title: "Hasil Medical Check-Up FIT",
      messageBody: "Yth. Sdri Siti Aminah, Selamat! Hasil Medical Check-Up Pra-Terbang Anda di Klinik Barokah Medika dinyatakan FIT. Berkas Anda kini diproses untuk penerbitan Paspor & Pengajuan Visa Kerja Arab Saudi (Zero Cost Syarikah). Tetap jaga kesehatan dan stand by.",
      status: "SENT",
      sentAt: relativeDate(-5) + " 10:15",
    },
    {
      id: "wa-002",
      recipientPhone: "081298765432",
      recipientName: "H. Salimudin",
      recipientRole: "SPONSOR",
      candidateId: "cpmi-001",
      candidateName: "Siti Aminah",
      messageType: "COMMISSION_PAID",
      title: "Pencairan DP1 Komisi Sponsor",
      messageBody: "Yth. Bpk H. Salimudin (Sponsor), Dana Termin DP1 Komisi Sponsor atas nama CPMI Siti Aminah sebesar Rp 3.000.000 telah ditransfer ke rekening BRI Anda oleh Kasir Pusat PT. Panca Banyu Ajisakti. Kwitansi: KW-PAS/DP1/2026/0011. Terima kasih atas kerjasamanya.",
      status: "SENT",
      sentAt: relativeDate(-4) + " 14:30",
    },
    {
      id: "wa-003",
      recipientPhone: "081399887711",
      recipientName: "Eka Rahmawati",
      recipientRole: "CPMI",
      candidateId: "cpmi-003",
      candidateName: "Eka Rahmawati",
      messageType: "EXPIRY_REMINDER",
      title: "Pengingat Masa Berlaku Paspor H-30",
      messageBody: "PENTING: Yth. Sdri Eka Rahmawati, paspor Anda tersisa < 30 hari masa berlaku aktif. Petugas Admin Pusat PT. Panca Banyu Ajisakti telah menyiapkan Surat Pengantar Perpanjangan Paspor ke Kantor Imigrasi. Harap segera koordinasi dengan cabang.",
      status: "SENT",
      sentAt: relativeDate(-2) + " 09:00",
    },
    {
      id: "wa-004",
      recipientPhone: "081288776655",
      recipientName: "Nur Hayati",
      recipientRole: "CPMI",
      candidateId: "cpmi-002",
      candidateName: "Nur Hayati",
      messageType: "INTERVIEW_INVITE",
      title: "Undangan Video Call Interview Syarikah",
      messageBody: "Yth. Sdri Nur Hayati, Jadwal interview video call dengan perwakilan Syarikah SMASCO (Arab Saudi) telah dijadwalkan pada hari ini pukul 15:30 WIB (11:30 KSA Time). Petugas interpreter bahasa Arab kami akan mendampingi Anda di kantor.",
      status: "SENT",
      sentAt: relativeDate(0) + " 08:30",
    },
  ];
}

export function createInitialCashJournals(): CashJournal[] {
  return [
    {
      id: "cj-001",
      tenantId: "tenant-panca",
      branchId: "br-jkt",
      transactionDate: relativeDate(-12),
      type: "MASUK",
      category: "INVOICE_WAKALAH",
      amount: 75000000,
      recipientOrPayer: "Maharah Human Resources Co. (KSA)",
      description: "Penerimaan Termin 1 Wakalah Dana Rekrutmen 5 CPMI Arab Saudi (Zero Cost)",
      paymentMethod: "BANK_TRANSFER",
      bankAccountName: "BSI Rek. 7192830192 a/n PT Panca Banyu Ajisakti",
      referenceNumber: "SWIFT-BSIR/2026/02911",
      createdBy: "Rina Kartika (Kasir Pusat)",
      createdAt: relativeDate(-12) + " 11:20",
    },
    {
      id: "cj-002",
      tenantId: "tenant-panca",
      branchId: "br-jkt",
      transactionDate: relativeDate(-10),
      type: "KELUAR",
      category: "DP_SPONSOR",
      amount: 3000000,
      recipientOrPayer: "H. Salimudin (Sponsor Indramayu)",
      description: "Pembayaran DP1 Komisi Sponsor CPMI Siti Aminah (Kwitansi KW-PAS/DP1/2026/0011)",
      paymentMethod: "BANK_TRANSFER",
      bankAccountName: "BRI Rek. 0129384729",
      referenceNumber: "TRF-BRI/20260301-92",
      candidateId: "cpmi-001",
      createdBy: "Rina Kartika (Kasir Pusat)",
      createdAt: relativeDate(-10) + " 14:05",
    },
    {
      id: "cj-003",
      tenantId: "tenant-panca",
      branchId: "br-jkt",
      transactionDate: relativeDate(-8),
      type: "KELUAR",
      category: "MEDICAL_PAYMENT",
      amount: 3600000,
      recipientOrPayer: "Klinik Barokah Medika (Mitra Gamca/Wafid)",
      description: "Pelunasan Tagihan Medical Check-Up Pra-Terbang 4 CPMI (Siti Aminah, Nur Hayati, Eka, Marwah)",
      paymentMethod: "BANK_TRANSFER",
      bankAccountName: "Mandiri Rek. 158000492810",
      referenceNumber: "INV-MED/2026/03-19",
      createdBy: "Rina Kartika (Kasir Pusat)",
      createdAt: relativeDate(-8) + " 09:45",
    },
    {
      id: "cj-004",
      tenantId: "tenant-panca",
      branchId: "br-jkt",
      transactionDate: relativeDate(-6),
      type: "KELUAR",
      category: "PASPOR_PAYMENT",
      amount: 2800000,
      recipientOrPayer: "PNBP Kantor Imigrasi Kelas I",
      description: "Biaya PNBP Paspor RI 48 Halaman Elektronik x 4 CPMI ke Kanim",
      paymentMethod: "BANK_TRANSFER",
      bankAccountName: "Kas Negara Simponi DJA Kemenkeu",
      referenceNumber: "MPN-G2/8920194819",
      createdBy: "Rina Kartika (Kasir Pusat)",
      createdAt: relativeDate(-6) + " 13:10",
    },
    {
      id: "cj-005",
      tenantId: "tenant-panca",
      branchId: "br-jkt",
      transactionDate: relativeDate(-4),
      type: "KELUAR",
      category: "KASBON_SPONSOR",
      amount: 2500000,
      recipientOrPayer: "H. Salimudin (Sponsor)",
      description: "Kasbon Operasional Perekrutan Wilayah Pantura Indramayu (Dipelihara di Buku Kasbon)",
      paymentMethod: "CASH",
      referenceNumber: "BON-SPS/2026/012",
      createdBy: "Rina Kartika (Kasir Pusat)",
      createdAt: relativeDate(-4) + " 15:40",
    },
    {
      id: "cj-006",
      tenantId: "tenant-panca",
      branchId: "br-jkt",
      transactionDate: relativeDate(-2),
      type: "MASUK",
      category: "INVOICE_WAKALAH",
      amount: 45000000,
      recipientOrPayer: "SMASCO Recruitment (Riyadh, KSA)",
      description: "Penerimaan DP Rekrutmen 3 Tenaga Perawat & Caregiver Domestik",
      paymentMethod: "BANK_TRANSFER",
      bankAccountName: "BSI Rek. 7192830192 a/n PT Panca Banyu Ajisakti",
      referenceNumber: "SWIFT-BSIR/2026/03102",
      createdBy: "Rina Kartika (Kasir Pusat)",
      createdAt: relativeDate(-2) + " 16:15",
    },
  ];
}

export function createInitialCashAdvances(): CashAdvance[] {
  return [
    {
      id: "ca-001",
      tenantId: "tenant-panca",
      borrowerId: "sp-001",
      borrowerName: "H. Salimudin",
      borrowerType: "SPONSOR",
      amount: 2500000,
      remainingAmount: 1000000,
      reason: "Bantuan Transport & Operasional Rekrutmen CPMI Indramayu Barat",
      dateGiven: relativeDate(-20),
      status: "DISETUJUI",
      approvedBy: "Ahmad Sarkoni (Direktur)",
      deductions: [
        {
          id: "ded-01",
          date: relativeDate(-4),
          amount: 1500000,
          note: "Dipotong otomatis dari pencairan DP1 Komisi CPMI Siti Aminah",
        },
      ],
    },
    {
      id: "ca-002",
      tenantId: "tenant-panca",
      borrowerId: "staf-04",
      borrowerName: "Ahmad Fauzi (Staf Lapangan)",
      borrowerType: "STAF",
      amount: 1000000,
      remainingAmount: 500000,
      reason: "Operasional Antar Jemput CPMI ke Kanim Imigrasi & Klinik Gamca",
      dateGiven: relativeDate(-7),
      status: "DISETUJUI",
      approvedBy: "Rina Kartika (Admin Pusat)",
      deductions: [
        {
          id: "ded-02",
          date: relativeDate(-2),
          amount: 500000,
          note: "Setoran reimburse bon bensin & tol",
        },
      ],
    },
  ];
}

export function createInitialSyarikahInvoices(): SyarikahInvoice[] {
  return [
    {
      id: "inv-001",
      tenantId: "tenant-panca",
      invoiceNumber: "INV-PBA/SAR/2026/03-01",
      syarikahName: "Maharah Human Resources Co. (Riyadh, KSA)",
      destinationCountry: "Arab Saudi",
      candidateCount: 5,
      candidateNames: ["Siti Aminah", "Marwah binti Hasan", "Sri Wahyuni", "Aisyah Putri", "Halimah"],
      currency: "SAR",
      totalAmount: 25000,
      paidAmount: 15000,
      dueDate: relativeDate(15),
      issuedDate: relativeDate(-12),
      status: "PARTIAL",
      notes: "DP 15,000 SAR telah diterima via transfer BSI Swift. Pelunasan 10,000 SAR saat visa stamping dan tiket issued.",
    },
    {
      id: "inv-002",
      tenantId: "tenant-panca",
      invoiceNumber: "INV-PBA/SAR/2026/03-02",
      syarikahName: "SMASCO (Saudi Manpower Solutions Co.)",
      destinationCountry: "Arab Saudi",
      candidateCount: 3,
      candidateNames: ["Nur Hayati", "Dewi Sartika", "Rani Andriani"],
      currency: "SAR",
      totalAmount: 18000,
      paidAmount: 0,
      dueDate: relativeDate(20),
      issuedDate: relativeDate(-3),
      status: "SENT",
      notes: "Invoice recruitment fee & visa authorization termin 1 menunggu validasi finance SMASCO.",
    },
    {
      id: "inv-003",
      tenantId: "tenant-panca",
      invoiceNumber: "INV-PBA/AED/2026/02-08",
      syarikahName: "Al-Jazeera International Recruitment (Dubai, UEA)",
      destinationCountry: "Uni Emirat Arab",
      candidateCount: 4,
      candidateNames: ["Eka Rahmawati", "Khadijah", "Fitriani", "Ratna Sari"],
      currency: "SAR",
      totalAmount: 22000,
      paidAmount: 22000,
      dueDate: relativeDate(-5),
      issuedDate: relativeDate(-25),
      status: "PAID",
      notes: "Lunas 100%. Kandidat sudah proses e-Visa MoHRE UEA.",
    },
  ];
}

export function createInitialEmployerInterviews(): EmployerInterview[] {
  return [
    {
      id: "int-001",
      tenantId: "tenant-panca",
      candidateId: "cpmi-001",
      candidateName: "Siti Aminah",
      syarikahName: "Maharah Human Resources Co. (KSA)",
      jobSector: "Penata Laksana Rumah Tangga (PLRT / Housemaid)",
      interviewDate: relativeDate(-3),
      interviewTimeKsa: "11:00 KSA (15:00 WIB)",
      interviewMethod: "ZOOM",
      meetingLinkOrPhone: "https://zoom.us/j/89123049182",
      interviewerName: "Sheikh Abdulrahman Al-Otaibi",
      interpreterName: "Ust. Fauzan Hakim (P3MI Pusat)",
      status: "PASSED",
      agreedSalarySar: 1500,
      notes: "Kandidat mampu percakapan dasar bahasa Arab, bersedia di Riyadh keluarga 4 orang, lolos seleksi majikan.",
      createdAt: relativeDate(-5) + " 09:00",
    },
    {
      id: "int-002",
      tenantId: "tenant-panca",
      candidateId: "cpmi-002",
      candidateName: "Nur Hayati",
      syarikahName: "SMASCO (Saudi Manpower Solutions Co.)",
      jobSector: "Pengasuh Balita / Babysitter",
      interviewDate: relativeDate(1),
      interviewTimeKsa: "13:30 KSA (17:30 WIB)",
      interviewMethod: "GOOGLE_MEET",
      meetingLinkOrPhone: "https://meet.google.com/xyz-pqr-abc",
      interviewerName: "Madam Noura Al-Zahrani",
      interpreterName: "Ust. Fauzan Hakim (P3MI Pusat)",
      status: "SCHEDULED",
      agreedSalarySar: 1600,
      notes: "Syarikah mencari pengasuh 2 anak usia 2 dan 4 tahun, kandidat berpengalaman eks-Saudi.",
      createdAt: relativeDate(-2) + " 11:30",
    },
    {
      id: "int-003",
      tenantId: "tenant-panca",
      candidateId: "cpmi-003",
      candidateName: "Eka Rahmawati",
      syarikahName: "Al-Jazeera International Recruitment (Dubai, UEA)",
      jobSector: "Pendamping Lansia / Elderly Caregiver",
      interviewDate: relativeDate(2),
      interviewTimeKsa: "14:00 KSA (18:00 WIB)",
      interviewMethod: "WHATSAPP_VIDEO",
      meetingLinkOrPhone: "+971501234567",
      interviewerName: "Mr. Tariq Mansoor",
      interpreterName: "Ust. Fauzan Hakim (P3MI Pusat)",
      status: "SCHEDULED",
      agreedSalarySar: 1750,
      notes: "Majikan lansia wanita 68 tahun di Abu Dhabi, memerlukan bantuan aktivitas harian dan obat.",
      createdAt: relativeDate(-1) + " 13:00",
    },
  ];
}

export function buildDefaultRegistrationFormForCandidate(
  c: Candidate,
  sponsors: Sponsor[] = []
): OfficialRegistrationForm {
  const sp = sponsors.find((s) => s.id === c.sponsorId);
  const firstWord = c.fullName.split(" ")[0] || c.fullName;
  const isMidEast = [
    "Arab Saudi",
    "Uni Emirat Arab (UAE)",
    "Kuwait",
    "Oman",
    "Yordania",
  ].includes(c.destinationCountry);
  const isMandarin = ["Taiwan", "Hong Kong", "Singapura"].includes(c.destinationCountry);
  const hasPassport = c.documents?.some(
    (d) => d.docType === "PASPOR" && d.status === "VERIFIED"
  );
  const hasSkck = c.documents?.some(
    (d) => d.docType === "IZIN_KELUARGA" && d.status === "VERIFIED"
  );

  const bYear = c.birthDate ? Number(c.birthDate.split("-")[0]) : 1998;
  const calcAge = bYear > 1950 && bYear < 2015 ? 2026 - bYear : 28;

  return {
    nickname: firstWord,
    realAge: calcAge,
    heightCm: c.gender === "L" ? 168 : 158,
    weightKg: c.gender === "L" ? 62 : 52,
    religion: "Islam",
    postalCode: c.branchId === "br-idm" ? "45272" : c.branchId === "br-clp" ? "53212" : "65141",
    graduationYear: "2018",
    ktpOrPassportNo: c.nik || "Menyusul",
    fatherName: "H. Kartono",
    fatherAge: 56,
    motherName: "Hj. Sumiati",
    motherAge: 51,
    paternalGrandfatherName: "H. Abdul Karim",
    spouseOrGuardianName:
      c.maritalStatus === "Kawin" ? "Hendrik Setiawan" : "H. Kartono (Wali Kandung)",
    spouseAge: c.maritalStatus === "Kawin" ? 33 : 56,
    spouseOccupation: "Wiraswasta / Petani",
    childrenTotalCount: c.maritalStatus === "Kawin" ? 1 : 0,
    firstChildAge: c.maritalStatus === "Kawin" ? "7" : "-",
    lastChildAge: "-",
    boysCountAndAges: c.maritalStatus === "Kawin" ? "1 orang (7 Th)" : "-",
    girlsCountAndAges: "-",
    childOrder: 2,
    siblingsCount: 3,
    emergencyContactName:
      c.maritalStatus === "Kawin" ? "Hendrik Setiawan" : "H. Kartono",
    emergencyContactRelation: c.maritalStatus === "Kawin" ? "Suami Kandung" : "Orang Tua",
    emergencyContactPhone: c.phone ? `${c.phone.slice(0, -2)}99` : "0812-8899-7711",
    workExperience1:
      c.stage === "ALUMNI"
        ? `Eks-PMI ${c.destinationCountry} (${c.jobSector}) selama 2 Kontrak (Selesai Baik)`
        : "2021 - 2024 : Bekerja di Sektor Jasa / Perawatan / Industri Lokal (3 Tahun)",
    workExperience2: "2019 - 2021 : Pengalaman Kerja Mandiri & Pelatihan Keterampilan",
    overseasExperiences: [
      {
        no: 1,
        countryAndCity: isMidEast ? `${c.destinationCountry} - Riyadh` : `${c.destinationCountry}`,
        duration: "2 Tahun",
        period: "2023 - 2025",
        returnStatus: "SELESAI",
        remarks: "Selesai Kontrak 2 Tahun Baik (Ex-Passport Ada)",
      },
      {
        no: 2,
        countryAndCity: "Indonesia - Jakarta",
        duration: "2 Tahun",
        period: "2021 - 2023",
        returnStatus: "SELESAI",
        remarks: "Pengalaman Kerja Lokal",
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
    overseasExperienceNotes: isMidEast
      ? "Eks-Timur Tengah, lancar komunikasi bahasa Arab harian & terbiasa memasak masakan Arab."
      : "Siap mengikuti pelatihan intensif BLK-LN dan penempatan sesuai kontrak kerja.",
    arabicLevelF4: isMidEast ? "LANCAR" : "SEDIKIT",
    arabicNotesF4: isMidEast ? "Lancar percakapan rumah tangga Arab Saudi/Timteng" : "Dasar sapaan",
    englishLevelF4: isMidEast ? "SEDIKIT" : "LANCAR",
    englishNotesF4: isMidEast ? "Dasar angka & instruksi" : "Lancar komunikasi kerja",
    willingCareBaby: true,
    willingCareBabyNotes: "Sanggup & berpengalaman merawat anak",
    willingCareElderly: true,
    willingCareElderlyNotes: "Sanggup merawat lansia dengan sabar",
    willingHousekeeping: true,
    willingHousekeepingNotes: "Sanggup bersih-bersih rumah, cuci baju & menyetrika",
    arabicCookingSkills: isMidEast
      ? [
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
        ]
      : ["Pizza", "Cake", "Juice"],
    desiredJobCleaner:
      c.jobSector.toLowerCase().includes("clean") ||
      c.jobSector.toLowerCase().includes("house") ||
      c.jobSector.toLowerCase().includes("domestic"),
    desiredJobFactory:
      c.jobSector.toLowerCase().includes("pabrik") ||
      c.jobSector.toLowerCase().includes("manufaktur") ||
      c.jobSector.toLowerCase().includes("industri"),
    desiredJobNurse:
      c.jobSector.toLowerCase().includes("caregiver") ||
      c.jobSector.toLowerCase().includes("lansia") ||
      c.jobSector.toLowerCase().includes("nurse") ||
      c.jobSector.toLowerCase().includes("perawat"),
    desiredJobHospitality:
      c.jobSector.toLowerCase().includes("hotel") ||
      c.jobSector.toLowerCase().includes("hospitality") ||
      c.jobSector.toLowerCase().includes("waiter"),
    desiredJobOther: false,
    desiredJobOtherText: c.jobSector,
    docHandover: {
      ktp: "ASLI",
      kk: "ASLI",
      akteKelahiran: "ASLI",
      izinKeluarga: "ASLI",
      izinSuami: c.maritalStatus === "Kawin" ? "ASLI" : "NONE",
      sttbIjazah: "ASLI",
      kartuBpjs: "COPY",
      skck: hasSkck ? "ASLI" : "COPY",
      paspor: hasPassport ? "ASLI" : "ASLI",
      otherDoc8Name: "Buku Nikah / Akte Cerai",
      otherDoc8Status: c.maritalStatus === "Belum Kawin" ? "NONE" : "ASLI",
      otherDoc9Name: "Pas Foto 4x6 & Kartu Kuning AK-1",
      otherDoc9Status: "ASLI",
    },
    languageSkills: {
      english: isMidEast ? "CUKUP" : "BAIK",
      mandarin: isMandarin ? "BAIK" : "BURUK",
      arabic: isMidEast ? "BAIK" : "CUKUP",
      otherLanguageName: c.destinationCountry === "Jepang" ? "Bahasa Jepang" : "",
      otherLanguageLevel: c.destinationCountry === "Jepang" ? "BAIK" : "NONE",
    },
    acceptanceDecision: "TERIMA",
    accByName: "Ahmad Sarkoni",
    candidateNotes:
      "Berkas fisik asli telah diserahkan saat pendaftaran awal di kantor cabang PT Panca Banyu Ajisakti.",
    sponsorOfficerName: sp ? sp.name : "Petugas Rekrut Lapangan (PL)",
    sponsorOfficerPhone: sp ? sp.phone : "0812-2345-6789",
    sponsorNotes:
      "Kandidat sehat jasmani & rohani, keluarga mendukung penuh keberangkatan dan telah menandatangani surat izin bermaterai.",
    receivedByPtOfficer: "Rina Kartika (Petugas PT. Panca Banyu Ajisakti)",
    formSignedDate: c.createdAt || relativeDate(-10),
  };
}

function createInitialSponsorSubmissions(): SponsorFormSubmission[] {
  return [
    {
      id: "sub-form-001",
      submissionCode: "FORM-F4/2026/0401",
      submittedAt: `${relativeDate(0)} 08:45 WIB`,
      sponsorId: "sp-1",
      sponsorName: "Kang Dedi Kusnadi (PL-IDM-001)",
      sponsorPhone: "0812-2301-4455",
      branchId: "br-idm",
      status: "MENUNGGU_DATA_ENTRY",
      sourceMethod: "SCAN_FORM_FISIK",
      physicalFormImageUrl: "/form-pendaftaran-f4-baru.svg",
      fullName: "Titi Sari Binti Kartono",
      nik: "3212156205970004",
      gender: "P",
      avatarUrl: "/avatars/cpmi-hijab-red.svg",
      birthPlace: "Indramayu",
      birthDate: "1997-05-22",
      phone: "0813-9455-2210",
      address: "Blok Desa RT 004/002 Desa Juntinyuat, Kec. Juntinyuat, Kab. Indramayu",
      maritalStatus: "Kawin",
      education: "SMA/SMK",
      destinationCountry: "Arab Saudi",
      jobSector: "Housekeeping & Caregiver (SPSK Syarikah)",
      registrationForm: {
        nickname: "Titi",
        realAge: 29,
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
        paternalGrandfatherName: "H. Abdul Halim",
        spouseOrGuardianName: "Hendrik Setiawan",
        spouseAge: 32,
        spouseOccupation: "Nelayan / Wiraswasta",
        childrenTotalCount: 1,
        firstChildAge: "6",
        lastChildAge: "-",
        boysCountAndAges: "1 Orang (6 Th)",
        girlsCountAndAges: "-",
        childOrder: 1,
        siblingsCount: 3,
        emergencyContactName: "Hendrik Setiawan",
        emergencyContactRelation: "Suami Kandung",
        emergencyContactPhone: "0852-2411-9088",
        workExperience1: "2023 - 2025 : Eks-PMI Arab Saudi (Riyadh) - Selesai Kontrak 2 Tahun Baik",
        workExperience2: "2019 - 2023 : Asisten Rumah Tangga & Babysitter di Jakarta (4 Tahun)",
        overseasExperiences: [
          {
            no: 1,
            countryAndCity: "Arab Saudi - Riyadh",
            duration: "2 Tahun",
            period: "2023 - 2025",
            returnStatus: "SELESAI",
            remarks: "Finish Kontrak 2 Tahun Baik (Ada Exit Final)",
          },
          {
            no: 2,
            countryAndCity: "Indonesia - Jakarta",
            duration: "4 Tahun",
            period: "2019 - 2023",
            returnStatus: "SELESAI",
            remarks: "ART & Babysitter Lokal",
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
          "Eks-Riyadh lancar komunikasi bahasa Arab harian & masakan Timur Tengah.",
        arabicLevelF4: "LANCAR",
        arabicNotesF4: "Lancar percakapan rumah tangga Saudi",
        englishLevelF4: "SEDIKIT",
        englishNotesF4: "Dasar angka & sapaan",
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
        acceptanceDecision: "TERIMA",
        accByName: "Ahmad Sarkoni",
        candidateNotes: "Siap langsung masuk pemeriksaan Wafid (GAMCA) minggu ini.",
        sponsorOfficerName: "Kang Dedi Kusnadi (PL-IDM-001)",
        sponsorOfficerPhone: "0812-2301-4455",
        sponsorNotes:
          "Dokumen fisik asli KTP, KK, Akta Lahir, Ijazah/STTB, Paspor Lama & Surat Izin Suami sudah lengkap diserahkan ke meja Data Entry.",
        receivedByPtOfficer: "Rina Kartika (Petugas PT.)",
        formSignedDate: relativeDate(0),
      },
    },
    {
      id: "sub-form-002",
      submissionCode: "FORM-F4/2026/0402",
      submittedAt: `${relativeDate(0)} 10:15 WIB`,
      sponsorId: "sp-2",
      sponsorName: "Pak Slamet Riyadi (PL-CLP-002)",
      sponsorPhone: "0813-2700-9911",
      branchId: "br-clp",
      status: "MENUNGGU_DATA_ENTRY",
      sourceMethod: "FORM_DIGITAL_SPONSOR",
      physicalFormImageUrl: "/form-pendaftaran-f4-baru.svg",
      fullName: "Siti Khodijah Binti Mulyono",
      nik: "3301145809980002",
      gender: "P",
      avatarUrl: "/avatars/cpmi-hijab-blue.svg",
      birthPlace: "Cilacap",
      birthDate: "1998-09-18",
      phone: "0857-4288-3319",
      address: "Jl. Laut Selatan RT 002/005 Kec. Majenang, Kab. Cilacap, Jawa Tengah",
      maritalStatus: "Belum Kawin",
      education: "SMA/SMK",
      destinationCountry: "Uni Emirat Arab (UAE)",
      jobSector: "Housekeeping & Babysitter (Tadbeer Dubai)",
      registrationForm: {
        nickname: "Khodijah",
        realAge: 28,
        heightCm: 160,
        weightKg: 53,
        religion: "Islam",
        postalCode: "53257",
        graduationYear: "2017",
        ktpOrPassportNo: "3301145809980002",
        fatherName: "Mulyono",
        fatherAge: 55,
        motherName: "Siti Aminah",
        motherAge: 50,
        paternalGrandfatherName: "H. Ahmad Dahlan",
        spouseOrGuardianName: "-",
        spouseAge: 0,
        spouseOccupation: "-",
        childrenTotalCount: 0,
        firstChildAge: "-",
        lastChildAge: "-",
        boysCountAndAges: "-",
        girlsCountAndAges: "-",
        childOrder: 1,
        siblingsCount: 2,
        emergencyContactName: "Mulyono",
        emergencyContactRelation: "Ayah Kandung",
        emergencyContactPhone: "0813-2890-4412",
        workExperience1: "2022 - 2024 : Eks-PMI Dubai UAE (Selesai Kontrak 2 Tahun)",
        workExperience2: "2020 - 2022 : Babysitter di Bandung",
        overseasExperiences: [
          {
            no: 1,
            countryAndCity: "UAE - Dubai",
            duration: "2 Tahun",
            period: "2022 - 2024",
            returnStatus: "SELESAI",
            remarks: "Finish Kontrak Tadbeer Dubai Baik",
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
        overseasExperienceNotes: "Eks-Dubai lancar Bahasa Inggris & Bahasa Arab praktis.",
        arabicLevelF4: "LANCAR",
        arabicNotesF4: "Lancar komunikasi majikan UAE",
        englishLevelF4: "LANCAR",
        englishNotesF4: "Aktif percakapan harian",
        willingCareBaby: true,
        willingCareBabyNotes: "Berpengalaman merawat balita di Dubai",
        willingCareElderly: false,
        willingCareElderlyNotes: "Fokus anak kecil & rumah tangga",
        willingHousekeeping: true,
        willingHousekeepingNotes: "Sanggup bersih-bersih apartemen/villa",
        arabicCookingSkills: [
          "Ruz Kabsah",
          "Ruz Briyani",
          "Macarona",
          "Pizza",
          "Sambosa",
          "Salatah",
          "Cake",
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
          izinSuami: "NONE",
          sttbIjazah: "ASLI",
          kartuBpjs: "ASLI",
          skck: "ASLI",
          paspor: "ASLI",
          otherDoc8Name: "Visa Lama Dubai UAE",
          otherDoc8Status: "COPY",
          otherDoc9Name: "",
          otherDoc9Status: "NONE",
        },
        languageSkills: {
          english: "BAIK",
          mandarin: "BURUK",
          arabic: "BAIK",
          otherLanguageName: "",
          otherLanguageLevel: "NONE",
        },
        acceptanceDecision: "TERIMA",
        accByName: "Ahmad Sarkoni",
        candidateNotes: "Siap proses biometrik & Wafid.",
        sponsorOfficerName: "Pak Slamet Riyadi (PL-CLP-002)",
        sponsorOfficerPhone: "0813-2700-9911",
        sponsorNotes:
          "Berkas asli Ijazah, KTP, KK, Akta Lahir & Surat Izin Orang Tua sudah diverifikasi di Cabang Cilacap.",
        receivedByPtOfficer: "Rina Kartika (Petugas PT.)",
        formSignedDate: relativeDate(0),
      },
    },
    {
      id: "sub-form-003",
      submissionCode: "FORM-F4/2026/0403",
      submittedAt: `${relativeDate(0)} 11:30 WIB`,
      sponsorId: "sp-3",
      sponsorName: "Bu Nurhayati (PL-MLG-003)",
      sponsorPhone: "0812-3388-7766",
      branchId: "br-mlg",
      status: "MENUNGGU_DATA_ENTRY",
      sourceMethod: "PARSE_WA_SPONSOR",
      physicalFormImageUrl: "/form-pendaftaran-f4-baru.svg",
      fullName: "Lilis Karlina Wulandari",
      nik: "3507195408990003",
      gender: "P",
      avatarUrl: "/avatars/cpmi-hijab-red.svg",
      birthPlace: "Malang",
      birthDate: "1999-08-14",
      phone: "0821-4319-8872",
      address: "Dusun Krajan RT 006/002 Kec. Kepanjen, Kab. Malang, Jawa Timur",
      maritalStatus: "Janda",
      education: "SMA/SMK",
      destinationCountry: "Kuwait",
      jobSector: "Caregiver & Housekeeping",
      registrationForm: {
        nickname: "Lilis",
        realAge: 27,
        heightCm: 156,
        weightKg: 51,
        religion: "Islam",
        postalCode: "65163",
        graduationYear: "2017",
        ktpOrPassportNo: "3507195408990003",
        fatherName: "Suparman",
        fatherAge: 60,
        motherName: "Sulastri",
        motherAge: 55,
        paternalGrandfatherName: "H. Matsari",
        spouseOrGuardianName: "-",
        spouseAge: 0,
        spouseOccupation: "-",
        childrenTotalCount: 1,
        firstChildAge: "5",
        lastChildAge: "-",
        boysCountAndAges: "-",
        girlsCountAndAges: "1 Orang (5 Th)",
        childOrder: 2,
        siblingsCount: 4,
        emergencyContactName: "Sulastri",
        emergencyContactRelation: "Ibu Kandung",
        emergencyContactPhone: "0822-3109-5541",
        workExperience1: "2022 - 2024 : Eks-PMI Arab Saudi (Jeddah) - Selesai Kontrak 2 Tahun",
        workExperience2: "2020 - 2022 : Perawat Lansia Homecare di Surabaya",
        overseasExperiences: [
          {
            no: 1,
            countryAndCity: "Arab Saudi - Jeddah",
            duration: "2 Tahun",
            period: "2022 - 2024",
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
        overseasExperienceNotes: "Terampil merawat lansia & memasak masakan Arab.",
        arabicLevelF4: "LANCAR",
        arabicNotesF4: "Lancar dialek Hijaz/Jeddah",
        englishLevelF4: "SEDIKIT",
        englishNotesF4: "Percakapan dasar",
        willingCareBaby: true,
        willingCareBabyNotes: "Sanggup",
        willingCareElderly: true,
        willingCareElderlyNotes: "Berpengalaman merawat lansia",
        willingHousekeeping: true,
        willingHousekeepingNotes: "Sanggup bersih-bersih rumah & setrika",
        arabicCookingSkills: [
          "Ruz Kabsah",
          "Ruz Bukhari",
          "Ruz Makbus",
          "Saluna/Idam",
          "Warag Enab",
          "Fatair",
          "Sambosa",
          "Salatah",
          "Cream Caramel",
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
          izinSuami: "NONE",
          sttbIjazah: "ASLI",
          kartuBpjs: "ASLI",
          skck: "ASLI",
          paspor: "ASLI",
          otherDoc8Name: "Akte Cerai Resmi Pengadilan Agama",
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
        candidateNotes: "Formulir Baru F4 sudah diisi lengkap.",
        sponsorOfficerName: "Bu Nurhayati (PL-MLG-003)",
        sponsorOfficerPhone: "0812-3388-7766",
        sponsorNotes:
          "Formulir pendaftaran F4 fisik telah ditandatangani oleh Calon PMI & Sponsor, siap diinput oleh Data Entry.",
        receivedByPtOfficer: "Rina Kartika (Petugas PT.)",
        formSignedDate: relativeDate(0),
      },
    },
  ];
}

export function syncExpirationsAndTasks(db: DatabaseSchema): void {
  const legacyAsiaCountries = [
    "Taiwan",
    "Hong Kong",
    "Jepang",
    "Singapura",
    "Korea Selatan",
    "Malaysia",
  ];

  // Aplikasi didedikasikan tunggal khusus PT. PANCA BANYU AJISAKTI
  if (!db.tenants || db.tenants.length === 0) {
    db.tenants = createInitialTenants();
  } else {
    // Pertahankan perubahan profil PT. Panca Banyu Ajisakti yang sudah diedit user
    const pancaTenant =
      db.tenants.find((t) => t.id === "tenant-panca" || t.isPrimary) ||
      db.tenants[0];
    if (pancaTenant) {
      pancaTenant.id = "tenant-panca";
      pancaTenant.isPrimary = true;
      db.tenants = [pancaTenant];
    } else {
      db.tenants = createInitialTenants();
    }
  }
  if (!db.sponsors2026ExcelImported) {
    if (!db.sponsors) db.sponsors = [];
    const existingNames = new Set(
      db.sponsors.map((s) => s.name.trim().toLowerCase())
    );
    for (const sp of createExcel2026Sponsors()) {
      const key = sp.name.trim().toLowerCase();
      if (!existingNames.has(key)) {
        db.sponsors.push(sp);
        existingNames.add(key);
      }
    }
    db.sponsors2026ExcelImported = true;
  }

  for (const b of db.branches) {
    b.tenantId = "tenant-panca";
    if (!b.status) b.status = "ACTIVE";
  }

  // Migrasi otomatis user & role dummy lama ke struktur divisi & user baru PT. Panca Banyu Ajisakti (sambil mempertahankan data Direktur Utama jika sudah diubah)
  const existingDirector = Array.isArray(db.staffAccounts)
    ? db.staffAccounts.find((s) => s.role === "DIREKTUR" || s.id === "stf-1")
    : undefined;

  const hasLegacyDummyStaff =
    Array.isArray(db.staffAccounts) &&
    db.staffAccounts.some(
      (s) => s.email === "admin.pusat@pasmigranpro.id" || s.email === "dokumen@pasmigranpro.id"
    ) &&
    !db.staffAccounts.some((s) => s.id === "stf-dewi");

  if (!db.roles || db.roles.length === 0 || hasLegacyDummyStaff) {
    db.roles = createInitialRoles();
  }
  if (!db.staffAccounts || db.staffAccounts.length === 0 || hasLegacyDummyStaff) {
    const freshStaff = createInitialStaff();
    if (existingDirector && existingDirector.name && !existingDirector.name.includes("Bambang")) {
      const dirIdx = freshStaff.findIndex((s) => s.role === "DIREKTUR");
      if (dirIdx !== -1) {
        freshStaff[dirIdx] = {
          ...freshStaff[dirIdx],
          ...existingDirector,
          role: "DIREKTUR",
        };
      }
    }
    db.staffAccounts = freshStaff;
  }

  // Pastikan nama Direktur Utama bawaan lama tidak menimpa nama resmi Ahmad Sarkoni
  for (const st of db.staffAccounts) {
    if (st.role === "DIREKTUR" && st.name.includes("Bambang Wijaya")) {
      st.name = "Ahmad Sarkoni";
    }
  }
  for (const tn of db.tenants || []) {
    if (tn.picName && tn.picName.includes("Bambang Wijaya")) {
      tn.picName = "Ahmad Sarkoni (Direktur Utama)";
    }
  }
  for (const br of db.branches || []) {
    if (br.headName && br.headName.includes("Bambang Wijaya")) {
      br.headName = "Ahmad Sarkoni";
    }
  }
  // Pastikan DIREKTUR selalu memiliki akses modul maintenance
  const directorRole = db.roles.find((r) => r.code === "DIREKTUR");
  if (directorRole && !directorRole.allowedMenus.includes("maintenance")) {
    directorRole.allowedMenus.push("maintenance");
  }

  if (db.isCleanProduction) {
    if (!db.cases) db.cases = [];
    if (!db.badilRecords) db.badilRecords = [];
    if (!db.whatsAppLogs) db.whatsAppLogs = [];
    if (!db.cashJournals) db.cashJournals = [];
    if (!db.cashAdvances) db.cashAdvances = [];
    if (!db.syarikahInvoices) db.syarikahInvoices = [];
    if (!db.employerInterviews) db.employerInterviews = [];
    if (!db.sponsorSubmissions) db.sponsorSubmissions = [];
    if (!db.vacancies) db.vacancies = [];
  } else {
    if (
      !db.cases ||
      db.cases.length === 0 ||
      db.cases.some((cs) => legacyAsiaCountries.includes(cs.destinationCountry))
    ) {
      db.cases = createInitialCases();
    }
    if (!db.badilRecords) {
      db.badilRecords = createInitialBadilRecords();
    }
    if (!db.whatsAppLogs || db.whatsAppLogs.length === 0) {
      db.whatsAppLogs = createInitialWhatsAppLogs();
    }
    if (!db.cashJournals || db.cashJournals.length === 0) {
      db.cashJournals = createInitialCashJournals();
    }
    if (!db.cashAdvances || db.cashAdvances.length === 0) {
      db.cashAdvances = createInitialCashAdvances();
    }
    if (!db.syarikahInvoices || db.syarikahInvoices.length === 0) {
      db.syarikahInvoices = createInitialSyarikahInvoices();
    }
    if (!db.employerInterviews || db.employerInterviews.length === 0) {
      db.employerInterviews = createInitialEmployerInterviews();
    }
    if (!db.demoSponsorSubmissionsCleared) {
      const demoSubmissionIds = new Set([
        "sub-form-001",
        "sub-form-002",
        "sub-form-003",
      ]);
      db.sponsorSubmissions = (db.sponsorSubmissions || []).filter(
        (s) => !demoSubmissionIds.has(s.id)
      );
      db.demoSponsorSubmissionsCleared = true;
    } else if (!db.sponsorSubmissions) {
      db.sponsorSubmissions = [];
    }
    const initialVacancies = createInitialVacancies();
    if (
      !db.vacancies ||
      (db.vacancies.length === 0 && !db.demoVacanciesTrimmedTo2) ||
      db.vacancies.some((v) => legacyAsiaCountries.includes(v.destinationCountry))
    ) {
      db.vacancies = initialVacancies;
      db.demoVacanciesTrimmedTo2 = true;
    } else if (!db.demoVacanciesTrimmedTo2) {
      const removedDemoVacancyIds = new Set([
        "vac-3",
        "vac-4",
        "vac-5",
        "vac-6",
        "vac-7",
        "vac-8",
        "vac-9",
      ]);
      db.vacancies = db.vacancies.filter((v) => !removedDemoVacancyIds.has(v.id));
      db.demoVacanciesTrimmedTo2 = true;
    }
  }
  if (
    !db.foreignAgencies ||
    db.foreignAgencies.length === 0 ||
    db.foreignAgencies.some((fa) => fa.region === "ASIA_PASIFIK")
  ) {
    db.foreignAgencies = createInitialForeignAgencies();
  }
  if (!db.medicalClinics || db.medicalClinics.length === 0) {
    db.medicalClinics = createInitialMedicalClinics();
  }
  if (!db.bpjsFinancingPartners || db.bpjsFinancingPartners.length === 0 || db.bpjsFinancingPartners.some((bp) => bp.code.includes("KUR-"))) {
    db.bpjsFinancingPartners = createInitialBpjsFinancing();
  }
  if (!db.masterImmigrationOffices || db.masterImmigrationOffices.length === 0) {
    db.masterImmigrationOffices = createInitialMasterImmigrationOffices();
  }
  if (!db.masterDisdukcapil || db.masterDisdukcapil.length === 0) {
    db.masterDisdukcapil = createInitialMasterDisdukcapil();
  }
  if (!db.masterMedicalClinics || db.masterMedicalClinics.length === 0) {
    db.masterMedicalClinics = createInitialMasterMedicalClinics();
  }
  if (!db.masterAirlines || db.masterAirlines.length === 0) {
    db.masterAirlines = createInitialMasterAirlines();
  }
  if (!db.masterBlkLn || db.masterBlkLn.length === 0) {
    db.masterBlkLn = createInitialMasterBlkLn();
  }
  if (!db.masterEmbassies || db.masterEmbassies.length === 0) {
    db.masterEmbassies = createInitialMasterEmbassies();
  }

  // Sisakan hanya 2 CPMI jalur Rekom & 2 CPMI jalur Non-Rekom untuk data contoh awal (tanpa menyentuh CPMI inputan user)
  if (!db.demoCpmiTrimmedTo4) {
    const removedDemoIds = new Set([
      "cpmi-4",
      "cpmi-5",
      "cpmi-6",
      "cpmi-8",
      "cpmi-9",
      "cpmi-10",
      "cpmi-11",
    ]);
    db.candidates = db.candidates.filter((c) => !removedDemoIds.has(c.id));
    if (Array.isArray(db.cases)) {
      db.cases = db.cases.filter((cs) => !removedDemoIds.has(cs.candidateId));
    }
    if (Array.isArray(db.badilRecords)) {
      db.badilRecords = db.badilRecords.filter(
        (b) =>
          !removedDemoIds.has(b.originalCandidateId) &&
          !removedDemoIds.has(b.replacementCandidateId)
      );
    }
    if (Array.isArray(db.renewalTasks)) {
      db.renewalTasks = db.renewalTasks.filter((t) => !removedDemoIds.has(t.candidateId));
    }
    if (Array.isArray(db.auditLogs)) {
      db.auditLogs = db.auditLogs.filter(
        (al) => !al.candidateId || !removedDemoIds.has(al.candidateId)
      );
    }
    db.demoCpmiTrimmedTo4 = true;
  }

  const activeTasksMap = new Map<string, RenewalTask>();
  for (const t of db.renewalTasks) {
    activeTasksMap.set(`${t.candidateId}-${t.documentId}`, t);
  }

  // Reset akumulasi komisi sponsor untuk dihitung akurat dari termin DP1, DP2, DP3, Pelunasan
  const sponsorPaidMap = new Map<string, number>();
  const sponsorPayableMap = new Map<string, number>();

  for (const cpmi of db.candidates) {
    // Migrasi otomatis kandidat lama Asia Pasifik menjadi Kawasan Timur Tengah (Zero Cost Syarikah/Majikan)
    if (legacyAsiaCountries.includes(cpmi.destinationCountry)) {
      if (cpmi.id === "cpmi-1") {
        cpmi.destinationCountry = "Arab Saudi";
        cpmi.jobSector = "Housekeeping & Babysitter (Majikan Langsung)";
        cpmi.employerName = "Al-Otaibi Family Residence (Riyadh)";
        cpmi.agencyPartner = "Maktab Istiqdam Al-Wataniyah (Riyadh)";
        cpmi.processTrack = "NON_REKOM";
        cpmi.flightInfo = "Saudia Airlines · SV819";
        cpmi.placementFee = 36000000;
      } else if (cpmi.id === "cpmi-2") {
        cpmi.destinationCountry = "Arab Saudi";
        cpmi.jobSector = "Family Driver & Building Maintenance";
        cpmi.employerName = "Syarikah Al-Jazeera & Al-Harbi Residence (Riyadh)";
        cpmi.agencyPartner = "Al-Jazeera Recruitment Office (Riyadh)";
        cpmi.processTrack = "REKOM";
        cpmi.placementFee = 35000000;
      } else if (cpmi.id === "cpmi-3") {
        cpmi.destinationCountry = "Uni Emirat Arab (UAE)";
        cpmi.jobSector = "Domestic Worker & Caregiver (PRT / Lansia)";
        cpmi.employerName = "Al-Suwaidi Family Villa (Abu Dhabi)";
        cpmi.agencyPartner = "Al-Noor Tadbeer & Domestic Services (Dubai)";
        cpmi.processTrack = "NON_REKOM";
        cpmi.placementFee = 35000000;
      } else if (cpmi.id === "cpmi-4") {
        cpmi.destinationCountry = "Kuwait";
        cpmi.jobSector = "Housekeeping & Caregiver (Wakalah Kuwait)";
        cpmi.employerName = "Al-Sabah Family Residence (Kuwait City)";
        cpmi.agencyPartner = "Al-Dhow International Recruitment (Kuwait City)";
        cpmi.processTrack = "NON_REKOM";
        cpmi.placementFee = 35000000;
      } else if (cpmi.id === "cpmi-5") {
        cpmi.destinationCountry = "Qatar";
        cpmi.jobSector = "Hospitality & Home Care Doha";
        cpmi.employerName = "Doha Pearl Hospitality Group";
        cpmi.agencyPartner = "Doha Gulf Manpower & Hospitality W.L.L";
        cpmi.processTrack = "REKOM";
        cpmi.placementFee = 36000000;
      } else if (cpmi.id === "cpmi-6") {
        cpmi.destinationCountry = "Arab Saudi";
        cpmi.jobSector = "Housekeeping & Babysitter (Majikan Langsung)";
        cpmi.employerName = "Al-Rajhi Family Residence (Riyadh)";
        cpmi.agencyPartner = "Maktab Istiqdam Al-Wataniyah (Riyadh)";
        cpmi.processTrack = "NON_REKOM";
        cpmi.flightInfo = "Saudia Airlines · SV817";
        cpmi.placementFee = 36000000;
      } else if (cpmi.id === "cpmi-7") {
        cpmi.destinationCountry = "Uni Emirat Arab (UAE)";
        cpmi.jobSector = "Hospitality & Housekeeping (Tadbeer / Hotel)";
        cpmi.employerName = "Al-Maktoum Residence & Tadbeer Dubai";
        cpmi.agencyPartner = "Emirates Tadbeer & Hospitality Services LLC (Dubai)";
        cpmi.processTrack = "REKOM";
        cpmi.flightInfo = "Emirates · EK359";
        cpmi.placementFee = 36000000;
      } else {
        cpmi.destinationCountry = "Arab Saudi";
        cpmi.jobSector = "Housekeeping & Caregiver Lansia (Jeddah)";
        cpmi.employerName = "Sheikh Abdullah Al-Qahtani Family (Jeddah)";
        cpmi.agencyPartner = "Maktab Istiqdam Al-Wataniyah (Jeddah)";
        cpmi.processTrack = "NON_REKOM";
        cpmi.placementFee = 36000000;
      }
      cpmi.finance = buildDefaultFinanceForCandidate(cpmi);
      cpmi.training = buildDefaultTrainingForCandidate(cpmi);
    }

    if (!cpmi.processTrack) {
      cpmi.processTrack = ["cpmi-1", "cpmi-3"].includes(cpmi.id)
        ? "NON_REKOM"
        : "REKOM";
    }

    if (!cpmi.portalPin) {
      cpmi.portalPin = cpmi.nik ? cpmi.nik.slice(-6) : "123456";
    }
    if (!cpmi.finance || cpmi.finance.fundingScheme !== "ZERO_COST_MAJIKAN") {
      cpmi.finance = buildDefaultFinanceForCandidate(cpmi);
    }
    if (cpmi.processTrack === "NON_REKOM" && cpmi.finance) {
      cpmi.finance.costItems = cpmi.finance.costItems.filter(
        (ci) => ci.category !== "BPJS_ASURANSI_PMI"
      );
      cpmi.finance.fundingBankOrAgency = `100% Zero Cost — Dibiayai Langsung Syarikah / Majikan ${cpmi.destinationCountry} (Jalur Non-Rekom)`;
    }
    // Sinkronkan judul dokumen ke-10 (OPP/E-KPMI) & ke-11 (Tiket) sesuai jalur proses
    for (const d of cpmi.documents) {
      if (d.docType === "EKTKLN_OPP") {
        d.title = "Tahap 7: Orientasi Pra-Pemberangkatan (OPP / PAP BP2MI) & E-KPMI (E-KTKLN)";
      }
      if (d.docType === "TIKET_EKTKLN") {
        d.title =
          cpmi.processTrack === "NON_REKOM"
            ? "Tahap 8: Tiket Penerbangan Langsung (Jalur Non-Rekom — Langsung Tiket & Terbang)"
            : "Tahap 8: Tiket Penerbangan & Keberangkatan ke Negara Tujuan (Lapor Diri KBRI/KJRI)";
      }
    }

    if (!cpmi.training) {
      cpmi.training = buildDefaultTrainingForCandidate(cpmi);
    }
    if (!cpmi.registrationForm || !cpmi.registrationForm.overseasExperiences) {
      cpmi.registrationForm = buildDefaultRegistrationFormForCandidate(cpmi, db.sponsors);
    }
    if (cpmi.registrationForm && !cpmi.registrationForm.processTrack) {
      cpmi.registrationForm.processTrack = cpmi.processTrack;
    }

    // Hitung total biaya HPP yang sudah PAID & status komisi bertahap
    const paidCostTotal = cpmi.finance.costItems
      .filter((ci) => ci.status === "PAID")
      .reduce((acc, ci) => acc + ci.amount, 0);
    cpmi.costIncurred = paidCostTotal;

    if (cpmi.sponsorId && cpmi.finance.sponsorInstallments.length > 0) {
      let paidForCpmi = 0;
      let unpaidForCpmi = 0;
      for (const inst of cpmi.finance.sponsorInstallments) {
        if (inst.status === "PAID") {
          paidForCpmi += inst.amount;
        } else {
          unpaidForCpmi += inst.amount;
        }
      }
      cpmi.commissionPaid = unpaidForCpmi === 0;
      sponsorPaidMap.set(
        cpmi.sponsorId,
        (sponsorPaidMap.get(cpmi.sponsorId) || 0) + paidForCpmi
      );
      sponsorPayableMap.set(
        cpmi.sponsorId,
        (sponsorPayableMap.get(cpmi.sponsorId) || 0) + unpaidForCpmi
      );
    }

    if (
      cpmi.stage === "RETURNED" ||
      cpmi.specialStatus === "BLACKLISTED" ||
      cpmi.specialStatus === "REPLACED_OUT"
    ) {
      continue;
    }

    for (const doc of cpmi.documents) {
      if (!doc.expiryDate) continue;
      const daysLeft = getDaysRemaining(doc.expiryDate);
      if (daysLeft === null) continue;

      if (daysLeft < 0 && doc.status !== "MISSING") {
        doc.status = "EXPIRED";
      }

      let tierLabel: RenewalTask["tierLabel"] | null = null;
      let tierNumber: number | null = null;

      if (daysLeft < 0) {
        tierLabel = "EXPIRED";
        tierNumber = 0;
      } else if (daysLeft <= 7) {
        tierLabel = "7_HARI";
        tierNumber = 7;
      } else if (daysLeft <= 14) {
        tierLabel = "14_HARI";
        tierNumber = 14;
      } else if (daysLeft <= 30) {
        tierLabel = "30_HARI";
        tierNumber = 30;
      } else if (daysLeft <= 60) {
        tierLabel = "60_HARI";
        tierNumber = 60;
      }

      if (tierLabel && tierNumber !== null) {
        const key = `${cpmi.id}-${doc.id}`;
        const existing = activeTasksMap.get(key);
        if (!existing) {
          doc.lastReminderTier = tierNumber;
          const newTask: RenewalTask = {
            id: `task-${cpmi.id}-${doc.docType.toLowerCase()}`,
            candidateId: cpmi.id,
            candidateName: cpmi.fullName,
            branchId: cpmi.branchId,
            documentId: doc.id,
            docType: doc.docType,
            docTitle: doc.title,
            docNumber: doc.docNumber,
            dueDate: doc.expiryDate,
            daysLeft,
            tierLabel,
            status: "OPEN",
            assignedTo: "Staf Dokumen & Admin Cabang",
            createdAt: relativeDate(0),
          };
          db.renewalTasks.push(newTask);
          activeTasksMap.set(key, newTask);
        } else {
          existing.daysLeft = daysLeft;
          existing.tierLabel = tierLabel;
          existing.dueDate = doc.expiryDate;
          if (daysLeft < 0 && existing.status === "COMPLETED") {
            existing.status = "OPEN";
          }
        }
      }
    }
  }

  for (const sp of db.sponsors) {
    sp.paidAmount = sponsorPaidMap.get(sp.id) || 0;
    sp.payableAmount = sponsorPayableMap.get(sp.id) || 0;
  }

  db.renewalTasks.sort((a, b) => a.daysLeft - b.daysLeft);
}

export function validateStageTransition(
  candidate: Candidate,
  targetStage: JourneyStage
): { allowed: boolean; blockers: string[] } {
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

  const targetIdx = stageOrder.indexOf(targetStage);
  const blockers: string[] = [];

  if (candidate.specialStatus === "BLACKLISTED") {
    blockers.push("Kandidat berstatus BLACKLISTED dan tidak dapat dinaikkan tahapannya.");
    return { allowed: false, blockers };
  }

  if (targetIdx >= 1) {
    if (!candidate.nik || !/^\d{16}$/.test(candidate.nik)) {
      blockers.push("NIK 16 digit wajib diisi & valid sebelum naik ke tahap Prospect/berikutnya.");
    }
  }

  if (targetIdx >= 2) {
    const prospectDocs = candidate.documents.filter((d) => d.requiredAtStage === "PROSPECT");
    for (const d of prospectDocs) {
      if (d.status === "EXPIRED") {
        blockers.push(`Dokumen ${d.title} sudah KEDALUWARSA (EXPIRED).`);
      } else if (d.status !== "VERIFIED") {
        blockers.push(`Dokumen dasar wajib "${d.title}" belum terverifikasi (Status: ${d.status}).`);
      }
    }
  }

  const isNonRekom = candidate.processTrack === "NON_REKOM";

  if (targetIdx >= 3) {
    const requiredForReady = candidate.documents.filter((d) => {
      if (d.requiredAtStage !== "CPMI" && d.requiredAtStage !== "READY") return false;
      // Untuk Jalur Non-Rekom: lewati syarat Sertifikat Kompetensi/PAP dan Perjanjian Penempatan/BPJS-TK, langsung fokus ke Medical, Paspor & Visa
      if (
        isNonRekom &&
        (d.docType === "SERTIFIKAT_KOMPETENSI" || d.docType === "PERJANJIAN_PENEMPATAN")
      ) {
        return false;
      }
      return true;
    });
    for (const d of requiredForReady) {
      const daysLeft = getDaysRemaining(d.expiryDate);
      if (d.status === "EXPIRED" || (daysLeft !== null && daysLeft < 0)) {
        blockers.push(
          `Dokumen "${d.title}" sudah KEDALUWARSA (${d.expiryDate}) — berhenti dihitung lengkap!`
        );
      } else if (d.status !== "VERIFIED") {
        blockers.push(
          `Syarat tahap Ready (${isNonRekom ? "Jalur Non-Rekom" : "Jalur Rekom"}) "${d.title}" belum VERIFIED (Status: ${d.status}).`
        );
      }
      if (d.docType === "MEDICAL" && d.medicalResult !== "FIT") {
        blockers.push(
          `Hasil Medical Check-Up Wafid wajib berstatus FIT (Saat ini: ${d.medicalResult || "Belum diisi"}).`
        );
      }
    }
  }

  if (targetIdx >= 4) {
    const deployDocs = candidate.documents.filter((d) => {
      if (d.requiredAtStage !== "DEPLOYED") return false;
      if (isNonRekom && d.docType === "EKTKLN_OPP") return false; // Jalur Non-Rekom melewati OPP/E-KTKLN
      return true;
    });
    for (const d of deployDocs) {
      if (d.status !== "VERIFIED") {
        blockers.push(
          `Berkas "${d.title}" belum berstatus VERIFIED.`
        );
      }
    }
    if (!candidate.flightInfo || !candidate.departureDate) {
      blockers.push(
        "Maskapai Penerbangan & Tanggal Keberangkatan wajib diisi sebelum status Deployed (Berangkat)."
      );
    }
  }

  return {
    allowed: blockers.length === 0,
    blockers,
  };
}

export function readDb(): DatabaseSchema {
  try {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }
    if (!fs.existsSync(DB_FILE)) {
      // Jika berjalan di Vercel/Serverless dan ada file data/p3mi-db.json bawaan repo, salin dulu ke /tmp
      if (IS_SERVERLESS && fs.existsSync(LOCAL_DB_FILE)) {
        const bundledRaw = fs.readFileSync(LOCAL_DB_FILE, "utf-8");
        const bundledParsed = JSON.parse(bundledRaw) as DatabaseSchema;
        syncExpirationsAndTasks(bundledParsed);
        fs.writeFileSync(DB_FILE, JSON.stringify(bundledParsed, null, 2), "utf-8");
        return bundledParsed;
      }
      const seed = createInitialSeed();
      fs.writeFileSync(DB_FILE, JSON.stringify(seed, null, 2), "utf-8");
      return seed;
    }
    const raw = fs.readFileSync(DB_FILE, "utf-8");
    const parsed = JSON.parse(raw) as DatabaseSchema;
    syncExpirationsAndTasks(parsed);
    return parsed;
  } catch {
    const seed = createInitialSeed();
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(seed, null, 2), "utf-8");
    } catch {
      // Fallback in-memory jika filesystem terkunci
    }
    return seed;
  }
}

export function writeDb(db: DatabaseSchema): void {
  syncExpirationsAndTasks(db);
  try {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), "utf-8");
  } catch {
    // Fallback ke os.tmpdir() apabila folder kerja bersifat read-only
    const fallbackFile = path.join(os.tmpdir(), "p3mi-db.json");
    fs.writeFileSync(fallbackFile, JSON.stringify(db, null, 2), "utf-8");
  }
}

export function resetDbToSeed(): DatabaseSchema {
  const seed = createInitialSeed();
  writeDb(seed);
  return seed;
}
