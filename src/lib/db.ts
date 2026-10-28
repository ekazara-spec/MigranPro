import fs from "fs";
import os from "os";
import path from "path";
import {
  AuditLog,
  BadilRecord,
  BpjsFinancingPartner,
  Branch,
  Candidate,
  CandidateFinance,
  CaseTicket,
  CpmiDocument,
  DOC_TEMPLATE_CONFIG,
  ForeignAgency,
  JobVacancy,
  JourneyStage,
  MedicalClinicPartner,
  RenewalTask,
  Sponsor,
  SponsorInstallment,
  StaffAccount,
  TrainingRecord,
} from "./types";

export interface DatabaseSchema {
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
  paidTermins: ("DP1" | "DP2" | "DP3" | "PELUNASAN")[] = []
): SponsorInstallment[] {
  if (totalCommission <= 0) return [];
  const dp1Amt = Math.round(totalCommission * 0.2); // 20% saat Medical FIT
  const dp2Amt = Math.round(totalCommission * 0.25); // 25% saat Paspor & ID SISKOP2MI
  const dp3Amt = Math.round(totalCommission * 0.25); // 25% saat Visa & PK Turun
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
      label: "DP 1 (20% · Lolos Medical FIT & Berkas Dasar)",
      pct: 20,
      amt: dp1Amt,
      reqStage: "CPMI",
    },
    {
      key: "DP2",
      label: "DP 2 (25% · Paspor Terbit & Rekom ID SISKOP2MI)",
      pct: 25,
      amt: dp2Amt,
      reqStage: "CPMI",
    },
    {
      key: "DP3",
      label: "DP 3 (25% · Kontrak PK & Visa Kerja Turun)",
      pct: 25,
      amt: dp3Amt,
      reqStage: "READY",
    },
    {
      key: "PELUNASAN",
      label: "Pelunasan (30% · CPMI Terbang / Deployed)",
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
    paidTermins
  );

  const isMiddleEast = [
    "Arab Saudi",
    "Kuwait",
    "Oman",
    "Yordania",
    "Uni Emirat Arab (UAE)",
  ].includes(c.destinationCountry);

  const costItems = [
    {
      id: `cost-${c.id}-1`,
      category: "MEDICAL_CHECKUP" as const,
      title: isMiddleEast
        ? "Medical Check-Up Wafid (eks-GAMCA) Klinik Terakreditasi GCC"
        : "Biaya Pemeriksaan Medical Check-Up Standar Negara Tujuan",
      amount: isMiddleEast ? 1650000 : 1250000,
      status: (c.stage === "LEAD" ? "PENDING" : "PAID") as "PAID" | "PENDING",
      paidDate: c.stage === "LEAD" ? undefined : relativeDate(-45),
      vendorName: isMiddleEast
        ? "Klinik Wafid / GAMCA Resmi (Jakarta/Cirebon)"
        : "Klinik Pramita / Prodia",
    },
    {
      id: `cost-${c.id}-2`,
      category: "PASPOR_IMIGRASI" as const,
      title: "Penerbitan Paspor 48 Hal & Rekom ID SISKOP2MI",
      amount: 650000,
      status: (["LEAD", "PROSPECT"].includes(c.stage) ? "PENDING" : "PAID") as
        | "PAID"
        | "PENDING",
      paidDate: ["LEAD", "PROSPECT"].includes(c.stage) ? undefined : relativeDate(-35),
      vendorName: "Kantor Imigrasi Kelas I",
    },
    {
      id: `cost-${c.id}-3`,
      category: "PELATIHAN_BLK_SERTIFIKASI" as const,
      title: isMiddleEast
        ? "Pelatihan Bahasa Arab/Inggris, Asrama BLK-LN & Sertifikasi BNSP"
        : "Pelatihan Bahasa, Asrama BLK-LN & Uji Kompetensi BNSP",
      amount: isMiddleEast ? 5800000 : 7500000,
      status: (["LEAD", "PROSPECT"].includes(c.stage) ? "PENDING" : "PAID") as
        | "PAID"
        | "PENDING",
      paidDate: ["LEAD", "PROSPECT"].includes(c.stage) ? undefined : relativeDate(-28),
      vendorName: "BLK-LN Panca Banyu Ajisakti",
    },
    {
      id: `cost-${c.id}-4`,
      category: "VISA_TETO_KEDUTAAN" as const,
      title: isMiddleEast
        ? "Biometrik Tasheer / VFS, Enjaz & Stamping Visa Wakalah / Musaned / e-Visa"
        : "Biaya Pengajuan Visa Kerja & Legalisir Kontrak Kerja",
      amount: isMiddleEast ? 4200000 : 3400000,
      status: (isAdvancedStage ? "PAID" : "PENDING") as "PAID" | "PENDING",
      paidDate: isAdvancedStage ? relativeDate(-14) : undefined,
      vendorName: isMiddleEast
        ? "Tasheer / Kedutaan Arab Saudi / UAE / Kuwait / Oman / Yordania"
        : "Kedutaan / TETO / Konsulat",
    },
    {
      id: `cost-${c.id}-5`,
      category: "BPJS_ASURANSI_PMI" as const,
      title: "Premi BPJS Ketenagakerjaan PMI (Pra, Masa, Purna)",
      amount: 540000,
      status: (isAdvancedStage ? "PAID" : "PENDING") as "PAID" | "PENDING",
      paidDate: isAdvancedStage ? relativeDate(-10) : undefined,
      vendorName: "BPJS Ketenagakerjaan",
    },
    {
      id: `cost-${c.id}-6`,
      category: "TIKET_PESAWAT_HANDLING" as const,
      title: isMiddleEast
        ? "Tiket Pesawat Internasional (Saudia / Emirates / Etihad / Kuwait Airways / Oman Air)"
        : "Tiket Pesawat Internasional One-Way & Airport Handling",
      amount: isMiddleEast ? 8200000 : 6800000,
      status: (isDeployedOrLater ? "PAID" : "PENDING") as "PAID" | "PENDING",
      paidDate: isDeployedOrLater ? relativeDate(-5) : undefined,
      vendorName: isMiddleEast
        ? "Saudia Airlines / Emirates / Etihad / Qatar Airways"
        : "Garuda Indonesia / China Airlines / Cathay",
    },
  ];

  const scheme =
    isMiddleEast || c.destinationCountry === "Hong Kong"
      ? "ZERO_COST_MAJIKAN"
      : c.destinationCountry === "Taiwan"
      ? "KUR_PMI_BANK"
      : c.destinationCountry === "Jepang"
      ? "MANDIRI_BERTAHAP"
      : "POTONG_GAJI_RESMI";

  return {
    fundingScheme: scheme,
    fundingBankOrAgency: isMiddleEast
      ? `100% Zero Cost — Ditanggung Syarikah / Majikan ${c.destinationCountry} (Wakalah Fee)`
      : scheme === "KUR_PMI_BANK"
      ? "KUR PMI Bank BNI (Bunga Subsidi Pemerintah)"
      : scheme === "ZERO_COST_MAJIKAN"
      ? "Full Employer Paid (Agensi Mitra Luar Negeri)"
      : scheme === "POTONG_GAJI_RESMI"
      ? "Pembiayaan Mitra Agensi Singapura"
      : "Pembayaran Bertahap via Rekening P3MI",
    agencyFeeRevenue: c.placementFee || (isMiddleEast ? 36000000 : 32000000),
    revenueReceived: isDeployedOrLater
      ? c.placementFee
      : c.stage === "READY"
      ? Math.round(c.placementFee * 0.5)
      : 0,
    kurStatus:
      scheme !== "KUR_PMI_BANK"
        ? "NOT_APPLICABLE"
        : isDeployedOrLater
        ? "CAIR_LUNAS"
        : c.stage === "READY"
        ? "DISETUJUI"
        : "PENGAJUAN",
    costItems,
    sponsorInstallments: installments,
  };
}

export function buildDefaultTrainingForCandidate(c: Candidate): TrainingRecord {
  const langMap: Record<string, string> = {
    Taiwan: "Bahasa Mandarin (Traditional) & Caregiving",
    "Hong Kong": "Bahasa Kantonis & Housekeeping",
    Jepang: "Bahasa Jepang (JFT-Basic A2 / N4) & Manufaktur SSW",
    Singapura: "Bahasa Inggris Praktis & Elderly Care",
    "Korea Selatan": "Bahasa Korea (EPS-TOPIK) & Keselamatan Kerja",
    Malaysia: "Bahasa Melayu & SOP Industri",
    "Arab Saudi": "Bahasa Arab Praktis (Percakapan) & Layanan Syarikah SPSK",
    "Uni Emirat Arab (UAE)": "Bahasa Inggris Perhotelan & Bahasa Arab Dasar (Tadbeer/MOHRE)",
    Kuwait: "Bahasa Arab & Bahasa Inggris Hospitality / Medis Kuwait",
    Oman: "Bahasa Arab & Standar Perhotelan/Caregiver Kesultanan Oman",
    Yordania: "Bahasa Arab & SOP Industri Garment (Kawasan QIZ) / Caregiving",
  };
  const isTrained = ["READY", "DEPLOYED", "ACTIVE_WORKER", "RETURNED", "ALUMNI"].includes(
    c.stage
  );
  return {
    blkLocation: "BLK-LN Panca Banyu Ajisakti (Pusat)",
    targetLanguage: langMap[c.destinationCountry] || "Bahasa Negara Tujuan",
    attendancePct: isTrained ? 98 : c.stage === "CPMI" ? 76 : 0,
    languageScore: isTrained ? 88 : c.stage === "CPMI" ? 72 : 0,
    skillScore: isTrained ? 91 : c.stage === "CPMI" ? 78 : 0,
    examStatus: isTrained
      ? "LULUS_KOMPETEN"
      : c.stage === "CPMI"
      ? "BELUM_UJIAN"
      : "BELUM_UJIAN",
    dormitoryCheckIn: c.stage === "LEAD" ? undefined : c.createdAt,
    instructorNotes: isTrained
      ? "Kompeten & lulus ujian sertifikasi BNSP serta wawancara Syarikah/Majikan."
      : "Sedang mengikuti kelas intensif harian di asrama BLK-LN.",
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
      name: "H. Bambang Wijaya, S.E.",
      email: "direktur@pasmigranpro.id",
      role: "DIREKTUR",
      roleLabel: "Direktur Utama (Akses Penuh)",
      branchId: "ALL",
      phone: "0811-1000-2200",
      active: true,
      pinCode: "1234",
    },
    {
      id: "stf-2",
      name: "Rina Kartika, S.Psi.",
      email: "admin.pusat@pasmigranpro.id",
      role: "ADMIN_PUSAT",
      roleLabel: "Admin Operasional & Keuangan Pusat",
      branchId: "ALL",
      phone: "0812-8800-1122",
      active: true,
      pinCode: "1234",
    },
    {
      id: "stf-3",
      name: "Dimas Saputra",
      email: "dokumen@pasmigranpro.id",
      role: "STAF_DOKUMEN",
      roleLabel: "Staf Dokumen, Medical & Visa",
      branchId: "ALL",
      phone: "0813-7700-3344",
      active: true,
      pinCode: "1234",
    },
    {
      id: "stf-4",
      name: "Hj. Siti Aminah",
      email: "cabang.indramayu@pasmigranpro.id",
      role: "KEPALA_CABANG",
      roleLabel: "Kepala Cabang Indramayu",
      branchId: "br-idm",
      phone: "0812-2345-6789",
      active: true,
      pinCode: "1234",
    },
    {
      id: "stf-5",
      name: "Hendro Prasetyo",
      email: "cabang.cilacap@pasmigranpro.id",
      role: "KEPALA_CABANG",
      roleLabel: "Kepala Cabang Cilacap",
      branchId: "br-clp",
      phone: "0813-2820-9900",
      active: true,
      pinCode: "1234",
    },
    {
      id: "stf-6",
      name: "Kang Dedi Kusnadi (PL)",
      email: "sponsor.dedi@pasmigranpro.id",
      role: "PEREKRUT_PL",
      roleLabel: "Perekrut / Sponsor Lapangan (PL)",
      branchId: "br-idm",
      phone: "0812-2300-4411",
      active: true,
      pinCode: "1234",
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
      destinationCountry: "Hong Kong",
      employerName: "Mrs. Anita Cheung",
      category: "GAJI_TERLAMBAT",
      priority: "CRITICAL",
      status: "ESCALATED",
      title: "Keterlambatan Pembayaran Gaji Bulan ke-10 & Jam Istirahat Kurang",
      description:
        "PMI melaporkan melalui Portal Mandiri bahwa pembayaran gaji bulan September mundur 9 hari dari jadwal kontrak ID407, serta jam istirahat malam kurang dari 8 jam.",
      picName: "Rina Kartika (Admin Pusat)",
      escalatedTo: "Golden Harbour Agency (HK) & Atase Ketenagakerjaan KJRI Hong Kong",
      targetResolutionDate: relativeDate(-2),
      reportedBy: "Portal Mandiri PMI (Siti Khodijah)",
      createdAt: relativeDate(-6),
      updatedAt: relativeDate(-1),
      timeline: [
        {
          id: "cn-1",
          authorName: "Siti Khodijah (PMI)",
          authorRole: "PMI Aktif",
          note: "Melaporkan pengaduan lewat Portal Mandiri: Gaji bulan ini belum ditransfer majikan dan jam kerja terlalu malam.",
          createdAt: relativeDate(-6) + " 20:15 WIB",
        },
        {
          id: "cn-2",
          authorName: "Rina Kartika, S.Psi.",
          authorRole: "ADMIN_PUSAT",
          note: "Menghubungi agensi mitra Golden Harbour Employment Agency di Hong Kong untuk klarifikasi tertulis ke majikan Mrs. Anita Cheung.",
          createdAt: relativeDate(-4) + " 10:30 WIB",
        },
        {
          id: "cn-3",
          authorName: "H. Bambang Wijaya, S.E.",
          authorRole: "DIREKTUR",
          note: "Eskalasi resmi ditembuskan ke KJRI Hong Kong bila dalam 2x24 jam bukti transfer gaji belum diterima.",
          createdAt: relativeDate(-1) + " 15:40 WIB",
        },
      ],
    },
    {
      id: "case-2",
      ticketNumber: "CASE-2026-0019",
      candidateId: "cpmi-6",
      candidateName: "Ratna Kumalasari",
      candidateNik: "3175042209950008",
      branchId: "br-jkt",
      destinationCountry: "Taiwan",
      employerName: "Taipei Senior Care Foundation",
      category: "MAJIKAN_PEKERJAAN",
      priority: "MEDIUM",
      status: "IN_PROGRESS",
      title: "Pendampingan Adaptasi Bahasa Mandarin & Jadwal Shift Minggu Pertama",
      description:
        "PMI baru tiba 5 hari lalu di Taipei dan meminta bantuan penerjemah dari agensi mitra terkait pembagian shift malam di panti lansia.",
      picName: "Dimas Saputra (Staf Dokumen & Penempatan)",
      escalatedTo: "Formosa Manpower Co., Ltd (Taipei)",
      targetResolutionDate: relativeDate(3),
      reportedBy: "Tim Monitoring Purna Penempatan",
      createdAt: relativeDate(-3),
      updatedAt: relativeDate(-1),
      timeline: [
        {
          id: "cn-4",
          authorName: "Dimas Saputra",
          authorRole: "STAF_DOKUMEN",
          note: "Koordinasi dengan penerjemah Indonesia di Formosa Manpower Taipei untuk mendampingi briefing shift besok pagi.",
          createdAt: relativeDate(-2) + " 09:20 WIB",
        },
      ],
    },
    {
      id: "case-3",
      ticketNumber: "CASE-2026-0014",
      candidateId: "cpmi-8",
      candidateName: "Wati Susilawati",
      candidateNik: "3212156201930007",
      branchId: "br-idm",
      destinationCountry: "Taiwan",
      employerName: "Lin Shu-Hua Family",
      category: "DOKUMEN_IMIGRASI",
      priority: "LOW",
      status: "RESOLVED",
      title: "Pengurusan Surat Pengantar Pencairan Jaminan Pensiun (Labor Insurance) Taiwan",
      description:
        "PMI purna (Alumni) membutuhkan legalisir dokumen kontrak lama untuk klaim tunjangan purna kerja.",
      picName: "Hj. Siti Aminah (Cabang Indramayu)",
      targetResolutionDate: relativeDate(-12),
      reportedBy: "Kunjungan Cabang Indramayu",
      createdAt: relativeDate(-18),
      updatedAt: relativeDate(-11),
      resolvedAt: relativeDate(-11),
      timeline: [
        {
          id: "cn-5",
          authorName: "Hj. Siti Aminah",
          authorRole: "KEPALA_CABANG",
          note: "Berkas klaim selesai diverifikasi TETO dan dana telah cair ke rekening BNI PMI.",
          createdAt: relativeDate(-11) + " 14:00 WIB",
        },
      ],
    },
  ];
}

function createInitialVacancies(): JobVacancy[] {
  return [
    {
      id: "vac-1",
      code: "JOB-2026-TW01",
      title: "Caregiver (Perawat Lansia Rumahan & Panti)",
      destinationCountry: "Taiwan",
      jobSector: "Caregiver (Perawat Lansia)",
      agencyPartner: "Formosa Manpower Co., Ltd (Taipei)",
      employerName: "Multiple Verified Families & Care Centers",
      salaryForeign: "NT$ 24.000 - 27.470 / bulan",
      salaryIdrEstimate: 13200000,
      placementFee: 32000000,
      quotaTotal: 25,
      quotaFilled: 14,
      genderPref: "P",
      minEducation: "SMP / SMA / SMK",
      ageRange: "21 - 42 Tahun",
      requirements: [
        "Wajib KTP Elektronik 16 digit & KK asli",
        "Tinggi badan minimal 150 cm, sehat jasmani & rohani (Medical FIT)",
        "Bersedia mengikuti pelatihan bahasa Mandarin & Caregiver di BLK-LN",
        "Surat Izin Suami / Orang Tua diketahui Kepala Desa",
      ],
      isPublished: true,
      closingDate: relativeDate(30),
      createdAt: relativeDate(-25),
    },
    {
      id: "vac-2",
      code: "JOB-2026-JP02",
      title: "Operator Manufaktur Komponen Otomotif (Specified Skilled Worker / SSW)",
      destinationCountry: "Jepang",
      jobSector: "Operator Manufaktur (SSW)",
      agencyPartner: "Kansai Kumiai Federation (Osaka)",
      employerName: "Takahashi Precision Co., Ltd",
      salaryForeign: "¥ 185.000 / bulan (Sebelum Lembur)",
      salaryIdrEstimate: 19500000,
      placementFee: 45000000,
      quotaTotal: 15,
      quotaFilled: 6,
      genderPref: "P/L",
      minEducation: "SMA / SMK / D3",
      ageRange: "19 - 32 Tahun",
      requirements: [
        "Sertifikat Bahasa Jepang JFT-Basic A2 atau JLPT N4",
        "Sertifikat SSW Bidang Manufaktur / Pengolahan Mesin",
        "Tidak buta warna & lulus Medical Check-Up standar Jepang",
      ],
      isPublished: true,
      closingDate: relativeDate(45),
      createdAt: relativeDate(-20),
    },
    {
      id: "vac-3",
      code: "JOB-2026-HK03",
      title: "Domestic Worker (Penata Laksana Rumah Tangga)",
      destinationCountry: "Hong Kong",
      jobSector: "Domestic Worker (PRT)",
      agencyPartner: "Golden Harbour Employment Agency (HK)",
      employerName: "Verified Hong Kong Employers",
      salaryForeign: "HK$ 4.870 / bulan (Standar Resmi KJRI)",
      salaryIdrEstimate: 9800000,
      placementFee: 28000000,
      quotaTotal: 30,
      quotaFilled: 22,
      genderPref: "P",
      minEducation: "SMP / SMA",
      ageRange: "21 - 40 Tahun",
      requirements: [
        "KTP, KK, Akta Kelahiran, Ijazah asli",
        "Bisa memasak masakan dasar & mengurus anak/lansia",
        "Pelatihan bahasa Kantonis dasar di BLK-LN (Skema Zero Cost / KUR PMI)",
      ],
      isPublished: true,
      closingDate: relativeDate(20),
      createdAt: relativeDate(-35),
    },
    {
      id: "vac-4",
      code: "JOB-2026-SG04",
      title: "Home Care & Domestic Helper Singapura",
      destinationCountry: "Singapura",
      placementRegion: "ASIA_PASIFIK",
      middleEastScheme: "REGULER_ASIA_TIMUR",
      jobSector: "Domestic Worker (PRT)",
      agencyPartner: "Merlion Home Care Pte Ltd",
      employerName: "Singapore Residential Families",
      salaryForeign: "SGD 700 - 850 / bulan",
      salaryIdrEstimate: 9200000,
      placementFee: 25000000,
      quotaTotal: 20,
      quotaFilled: 9,
      genderPref: "P",
      minEducation: "SMP / SMA",
      ageRange: "23 - 38 Tahun",
      requirements: [
        "Usia minimal 23 tahun sesuai regulasi MOM Singapura",
        "Sehat jasmani (Medical FIT) & tidak memiliki riwayat alergi berat",
        "Komunikasi dasar Bahasa Inggris / Melayu",
      ],
      isPublished: true,
      closingDate: relativeDate(25),
      createdAt: relativeDate(-15),
    },
    {
      id: "vac-5",
      code: "JOB-2026-SA05",
      title: "Skema SPSK (Sistem Penempatan Satu Kanal) & Hospitality Riyad/Jeddah",
      destinationCountry: "Arab Saudi",
      placementRegion: "TIMUR_TENGAH",
      middleEastScheme: "SPSK_MUSANED_SAUDI",
      jobSector: "Home Care / Hospitality Syarikah (SPSK)",
      agencyPartner: "Al-Mawarid Manpower / ARCO (Syarikah Resmi Musaned)",
      employerName: "Syarikah Al-Mawarid (Kontrak Resmi Kemnaker SPSK)",
      salaryForeign: "SAR 1.500 - 2.200 / bulan (Bebas Potongan)",
      salaryIdrEstimate: 8800000,
      placementFee: 38000000,
      quotaTotal: 50,
      quotaFilled: 28,
      genderPref: "P",
      minEducation: "SD / SMP / SMA",
      ageRange: "21 - 42 Tahun",
      requirements: [
        "100% ZERO COST (Seluruh biaya tiket, visa, paspor & pelatihan ditanggung Syarikah)",
        "Wajib lolos Medical Check-Up Wafid (eks-GAMCA) di klinik terakreditasi GCC",
        "Rekam Biometrik Tasheer & terdaftar di Sistem Satu Kanal (SPSK) SISKOP2MI - Musaned",
        "Majikan adalah Badan Usaha (Syarikah Resmi), gaji ditransfer via Bank Saudi tiap bulan",
      ],
      isPublished: true,
      closingDate: relativeDate(40),
      createdAt: relativeDate(-18),
    },
    {
      id: "vac-6",
      code: "JOB-2026-AE06",
      title: "Hospitality Housekeeping & Tadbeer Center Dubai / Abu Dhabi",
      destinationCountry: "Uni Emirat Arab (UAE)",
      placementRegion: "TIMUR_TENGAH",
      middleEastScheme: "TADBEER_MOHRE_UAE",
      jobSector: "Hospitality & Housekeeping (Tadbeer / Hotel)",
      agencyPartner: "Emirates Tadbeer & Hospitality Services LLC (Dubai)",
      employerName: "Dubai Marina Hospitality & Tadbeer Center",
      salaryForeign: "AED 1.800 - 2.500 / bulan",
      salaryIdrEstimate: 9500000,
      placementFee: 36000000,
      quotaTotal: 35,
      quotaFilled: 19,
      genderPref: "P/L",
      minEducation: "SMP / SMA / SMK Perhotelan",
      ageRange: "21 - 38 Tahun",
      requirements: [
        "100% Zero Cost (Full Employer Paid sesuai regulasi MOHRE UAE)",
        "Medical Check-Up Wafid (GAMCA) FIT & e-Visa Kerja MOHRE Dubai",
        "Komunikasi dasar Bahasa Inggris atau Bahasa Arab praktis",
      ],
      isPublished: true,
      closingDate: relativeDate(35),
      createdAt: relativeDate(-14),
    },
    {
      id: "vac-7",
      code: "JOB-2026-KW07",
      title: "Spa Therapist, Salon Wanita, Barista & Perawat Klinik Kuwait City",
      destinationCountry: "Kuwait",
      placementRegion: "TIMUR_TENGAH",
      middleEastScheme: "FORMAL_WAKALAH_GCC",
      jobSector: "Spa Therapist / Hospitality / Perawat Formal",
      agencyPartner: "Al-Dhow International Recruitment (Kuwait City)",
      employerName: "Royal Orchid Ladies Spa & Medical Center Kuwait",
      salaryForeign: "KWD 150 - 230 / bulan (Kurs Dinar Tinggi)",
      salaryIdrEstimate: 10500000,
      placementFee: 35000000,
      quotaTotal: 20,
      quotaFilled: 11,
      genderPref: "P/L",
      minEducation: "SMA / SMK Kecantikan / Perhotelan / D3 Keperawatan",
      ageRange: "21 - 38 Tahun",
      requirements: [
        "Penempatan Sektor Formal Berbadan Hukum (Bukan Perseorangan)",
        "Lolos Medical Wafid (GAMCA), SKCK Mabes Polri & Legalisir Kedutaan Kuwait",
        "100% Zero Cost bagi CPMI + Akomodasi Apartemen & Transportasi Disediakan",
      ],
      isPublished: true,
      closingDate: relativeDate(30),
      createdAt: relativeDate(-12),
    },
    {
      id: "vac-8",
      code: "JOB-2026-OM08",
      title: "Waitress, Room Attendant Hotel Bintang 5 & Caregiver Muscat",
      destinationCountry: "Oman",
      placementRegion: "TIMUR_TENGAH",
      middleEastScheme: "FORMAL_WAKALAH_GCC",
      jobSector: "Perhotelan (Hospitality) & Caregiver Formal",
      agencyPartner: "Muscat Gulf Manpower Solutions LLC",
      employerName: "Al-Bustan Palace & Muscat Healthcare Group",
      salaryForeign: "OMR 150 - 200 / bulan",
      salaryIdrEstimate: 8900000,
      placementFee: 33000000,
      quotaTotal: 25,
      quotaFilled: 10,
      genderPref: "P/L",
      minEducation: "SMA / SMK",
      ageRange: "21 - 40 Tahun",
      requirements: [
        "Medical Wafid (GAMCA) FIT & Visa Kerja Resmi Kesultanan Oman",
        "Skema Zero Cost (Biaya Tiket & Visa Ditanggung Perusahaan di Muscat)",
        "Bersedia mengikuti pelatihan bahasa Arab/Inggris dasar di BLK-LN",
      ],
      isPublished: true,
      closingDate: relativeDate(32),
      createdAt: relativeDate(-10),
    },
    {
      id: "vac-9",
      code: "JOB-2026-JO09",
      title: "Operator Garment Ekspor (Kawasan Industri QIZ) & Caregiver Amman",
      destinationCountry: "Yordania",
      placementRegion: "TIMUR_TENGAH",
      middleEastScheme: "QIZ_GARMENT_JORDAN",
      jobSector: "Operator Garment / Tekstil & Hospitality",
      agencyPartner: "Amman Industrial Apparel & Manpower Co.",
      employerName: "Classic Fashion Apparel Industry (Kawasan QIZ Amman/Irbid)",
      salaryForeign: "JOD 260 - 330 / bulan + Insentif Lembur",
      salaryIdrEstimate: 7800000,
      placementFee: 29000000,
      quotaTotal: 40,
      quotaFilled: 21,
      genderPref: "P",
      minEducation: "SMP / SMA / SMK Tata Busana",
      ageRange: "20 - 38 Tahun",
      requirements: [
        "Penempatan Sektor Formal Pabrik Garment Ekspor AS/Eropa di Yordania",
        "Mampu mengoperasikan mesin jahit industri (Single Needle / Overlock)",
        "Skema Zero Cost — Makan 3x, Asrama & Tiket Pulang-Pergi Ditanggung Pabrik",
      ],
      isPublished: true,
      closingDate: relativeDate(28),
      createdAt: relativeDate(-9),
    },
  ];
}

function createInitialSeed(): DatabaseSchema {
  const branches: Branch[] = [
    {
      id: "br-jkt",
      code: "JKT-HQ",
      name: "Kantor Pusat Jakarta",
      city: "Jakarta Timur",
      headName: "H. Bambang Wijaya, S.E.",
      phone: "021-87901122",
    },
    {
      id: "br-idm",
      code: "IDM-01",
      name: "Cabang Indramayu",
      city: "Indramayu, Jawa Barat",
      headName: "Hj. Siti Aminah",
      phone: "0234-274511",
    },
    {
      id: "br-clp",
      code: "CLP-02",
      name: "Cabang Cilacap",
      city: "Cilacap, Jawa Tengah",
      headName: "Hendro Prasetyo",
      phone: "0282-534901",
    },
    {
      id: "br-mlg",
      code: "MLG-03",
      name: "Cabang Malang",
      city: "Malang, Jawa Timur",
      headName: "Wahyu Setiawan",
      phone: "0341-491822",
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
      destinationCountry: "Taiwan",
      jobSector: "Caregiver (Perawat Lansia)",
      employerName: "Chen Mei-Ling Family",
      agencyPartner: "Formosa Manpower Co., Ltd (Taipei)",
      vacancyId: "vac-1",
      stage: "READY",
      specialStatus: "NORMAL",
      siskop2miId: "SISKOP-2026-TW-88291",
      flightInfo: "China Airlines · CI762",
      departureDate: relativeDate(6),
      placementFee: 32000000,
      costIncurred: 20140000,
      sponsorCommission: 4500000,
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
          docNumber: "MCU-PRM-2026-9912",
          issuedBy: "Klinik Utama Pramita Cirebon",
          issueDate: relativeDate(-78),
          expiryDate: relativeDate(12),
          medicalResult: "FIT",
          aiCheckStatus: "MATCH",
          aiCheckNotes: "Status FIT terdeteksi. Perhatian: Masa berlaku MCU tersisa 12 hari.",
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
        SERTIFIKAT_KOMPETENSI: {
          status: "VERIFIED",
          docNumber: "BNSP-CG-2026-4410",
          issuedBy: "BLK-LN Panca Banyu Ajisakti",
          verifiedBy: "Admin Pusat (Rina)",
          verifiedAt: relativeDate(-20),
        },
        PERJANJIAN_PENEMPATAN: {
          status: "VERIFIED",
          docNumber: "PP-TW/P3MI/IX/2026/101",
          issuedBy: "PT Panca Banyu Ajisakti & TETO",
          issueDate: relativeDate(-18),
          expiryDate: relativeDate(160),
          verifiedBy: "Admin Pusat (Rina)",
          verifiedAt: relativeDate(-18),
        },
        VISA: {
          status: "VERIFIED",
          docNumber: "TW-VISA-9920184",
          issuedBy: "TETO Jakarta",
          issueDate: relativeDate(-10),
          expiryDate: relativeDate(80),
          aiCheckStatus: "MATCH",
          verifiedBy: "Staf Dokumen (Dimas)",
          verifiedAt: relativeDate(-9),
        },
        TIKET_EKTKLN: {
          status: "UPLOADED",
          docNumber: "CI762-CGK-TPE",
          issuedBy: "China Airlines / SISKOP2MI",
          notes: "Menunggu verifikasi final E-KTKLN sebelum status naik ke Deployed.",
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
      destinationCountry: "Jepang",
      jobSector: "Operator Manufaktur (SSW)",
      employerName: "Takahashi Precision Co., Ltd",
      agencyPartner: "Kansai Kumiai Federation (Osaka)",
      vacancyId: "vac-2",
      stage: "CPMI",
      specialStatus: "NORMAL",
      siskop2miId: "SISKOP-2026-JP-41029",
      placementFee: 45000000,
      costIncurred: 9400000,
      sponsorCommission: 4000000,
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
          docNumber: "MCU-CLP-2026-1182",
          issuedBy: "RSUD Cilacap Medical Center",
          issueDate: relativeDate(-85),
          expiryDate: relativeDate(5),
          medicalResult: "FIT",
          aiCheckStatus: "MATCH",
          aiCheckNotes: "KRITIS: Masa berlaku Medical Check-Up habis dalam 5 hari!",
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
          aiCheckNotes: "Masa berlaku paspor kurang dari 6 bulan (sisa 24 hari). Wajib perpanjangan sebelum pengajuan Visa Jepang.",
          verifiedBy: "Staf Dokumen (Dimas)",
          verifiedAt: relativeDate(-40),
        },
        SERTIFIKAT_KOMPETENSI: {
          status: "VERIFIED",
          docNumber: "JFT-BASIC-A2-88120",
          issuedBy: "Japan Foundation & Prometric",
          verifiedBy: "Admin Pusat (Rina)",
          verifiedAt: relativeDate(-30),
        },
        PERJANJIAN_PENEMPATAN: {
          status: "UPLOADED",
          docNumber: "PK-JP-2026-088",
          issuedBy: "Takahashi Precision Co., Ltd",
          notes: "Menunggu verifikasi tanda tangan kontrak SSW.",
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
      destinationCountry: "Hong Kong",
      jobSector: "Domestic Worker (PRT)",
      employerName: "Mr. Raymond Wong",
      agencyPartner: "Golden Harbour Employment Agency (HK)",
      vacancyId: "vac-3",
      stage: "CPMI",
      specialStatus: "NORMAL",
      siskop2miId: "SISKOP-2026-HK-66102",
      placementFee: 28000000,
      costIncurred: 9400000,
      sponsorCommission: 5000000,
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
          docNumber: "MCU-MLG-2026-0412",
          issuedBy: "Laboratorium Klinik Prodia Malang",
          issueDate: relativeDate(-94),
          expiryDate: relativeDate(-4),
          medicalResult: "FIT",
          aiCheckStatus: "MISMATCH",
          aiCheckNotes: "EXPIRED: Masa berlaku hasil medical sudah lewat 4 hari lalu. Blokir kenaikan ke tahap READY.",
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
        SERTIFIKAT_KOMPETENSI: {
          status: "VERIFIED",
          docNumber: "BNSP-HK-2026-1920",
          issuedBy: "BLK-LN Malang Raya",
          verifiedBy: "Admin Pusat (Rina)",
          verifiedAt: relativeDate(-45),
        },
        PERJANJIAN_PENEMPATAN: {
          status: "VERIFIED",
          docNumber: "ID407-HK-2026-8812",
          issuedBy: "KJRI Hong Kong & P3MI",
          issueDate: relativeDate(-30),
          expiryDate: relativeDate(150),
          verifiedBy: "Admin Pusat (Rina)",
          verifiedAt: relativeDate(-28),
        },
        VISA: {
          status: "VERIFIED",
          docNumber: "HK-VISA-551920",
          issuedBy: "Hong Kong Immigration Dept",
          issueDate: relativeDate(-15),
          expiryDate: relativeDate(45),
          verifiedBy: "Staf Dokumen (Dimas)",
          verifiedAt: relativeDate(-14),
        },
      }),
    },
    {
      id: "cpmi-4",
      regNumber: "P3MI-2026-0104",
      nik: "3212104411000005",
      fullName: "Nurmala Sari",
      gender: "P",
      birthPlace: "Indramayu",
      birthDate: "2000-11-04",
      phone: "0812-9981-4410",
      address: "Kec. Karangampel RT 01/05, Kab. Indramayu",
      maritalStatus: "Belum Kawin",
      education: "SMP",
      destinationCountry: "Singapura",
      jobSector: "Domestic Worker (PRT)",
      employerName: "Mrs. Evelyn Tan",
      agencyPartner: "Merlion Home Care Pte Ltd",
      vacancyId: "vac-4",
      stage: "PROSPECT",
      specialStatus: "NORMAL",
      placementFee: 25000000,
      costIncurred: 1250000,
      sponsorCommission: 4500000,
      commissionPaid: false,
      branchId: "br-idm",
      sponsorId: "sp-1",
      portalPin: "000005",
      createdAt: relativeDate(-14),
      updatedAt: relativeDate(-1),
      documents: buildDocsForCandidate("cpmi-4", {
        KTP: {
          status: "VERIFIED",
          docNumber: "3212104411000005",
          issuedBy: "Disdukcapil Kab. Indramayu",
          aiCheckStatus: "MATCH",
          aiCheckNotes: "NIK 16 digit valid & unik.",
          verifiedBy: "Admin Pusat (Rina)",
          verifiedAt: relativeDate(-12),
        },
        KK: {
          status: "VERIFIED",
          docNumber: "3212100802170003",
          issuedBy: "Disdukcapil Kab. Indramayu",
          aiCheckStatus: "MATCH",
          verifiedBy: "Admin Pusat (Rina)",
          verifiedAt: relativeDate(-12),
        },
        AKTA_IJAZAH: {
          status: "UPLOADED",
          docNumber: "DN-02 DI 0192834",
          issuedBy: "SMPN 1 Karangampel",
          aiCheckStatus: "MISMATCH",
          aiCheckNotes: "AI mendeteksi perbedaan ejaan tempat lahir di Ijazah vs KTP. Mohon periksa manual sebelum verifikasi.",
          notes: "Menunggu verifikasi Admin Pusat.",
        },
        MEDICAL: {
          status: "UPLOADED",
          docNumber: "MCU-CRB-2026-7712",
          issuedBy: "Klinik Budi Sehat",
          issueDate: relativeDate(-3),
          medicalResult: "FIT",
          notes: "Foto diunggah perekrut dari lapangan, tanggal kedaluwarsa belum diisi admin.",
        },
      }),
    },
    {
      id: "cpmi-5",
      regNumber: "P3MI-2026-0105",
      fullName: "Rizky Pratama Putra",
      gender: "L",
      birthPlace: "Cilacap",
      phone: "0813-7712-9011",
      address: "Kec. Majenang, Kab. Cilacap",
      destinationCountry: "Korea Selatan",
      jobSector: "Manufaktur Otomotif",
      stage: "LEAD",
      specialStatus: "NORMAL",
      placementFee: 38000000,
      costIncurred: 0,
      sponsorCommission: 4000000,
      commissionPaid: false,
      branchId: "br-clp",
      sponsorId: "sp-2",
      portalPin: "123456",
      createdAt: relativeDate(-3),
      updatedAt: relativeDate(-1),
      documents: buildDocsForCandidate("cpmi-5", {}),
    },
    {
      id: "cpmi-6",
      regNumber: "P3MI-2026-0089",
      nik: "3175042209950008",
      fullName: "Ratna Kumalasari",
      gender: "P",
      birthPlace: "Jakarta",
      birthDate: "1995-09-22",
      phone: "0811-8291-0021",
      address: "Jl. Condet Raya No. 19, Kramat Jati, Jakarta Timur",
      maritalStatus: "Kawin",
      education: "SMA/SMK",
      destinationCountry: "Taiwan",
      jobSector: "Caregiver (Panti Jompo)",
      employerName: "Taipei Senior Care Foundation",
      agencyPartner: "Formosa Manpower Co., Ltd (Taipei)",
      vacancyId: "vac-1",
      stage: "DEPLOYED",
      specialStatus: "NORMAL",
      siskop2miId: "SISKOP-2026-TW-51092",
      flightInfo: "Garuda Indonesia · GA872",
      departureDate: relativeDate(-5),
      placementFee: 32000000,
      costIncurred: 20140000,
      sponsorCommission: 0,
      commissionPaid: true,
      branchId: "br-jkt",
      portalPin: "950008",
      createdAt: relativeDate(-110),
      updatedAt: relativeDate(-5),
      documents: buildDocsForCandidate("cpmi-6", {
        KTP: { status: "VERIFIED", docNumber: "3175042209950008", verifiedBy: "Admin Pusat (Rina)" },
        KK: { status: "VERIFIED", docNumber: "3175041102120001", verifiedBy: "Admin Pusat (Rina)" },
        AKTA_IJAZAH: { status: "VERIFIED", docNumber: "DN-01 Mk 0029182", verifiedBy: "Admin Pusat (Rina)" },
        IZIN_KELUARGA: { status: "VERIFIED", docNumber: "470/09/KJ/2026", verifiedBy: "Admin Pusat (Rina)" },
        MEDICAL: {
          status: "VERIFIED",
          docNumber: "MCU-JKT-2026-3011",
          issuedBy: "RS Polri Kramat Jati",
          issueDate: relativeDate(-45),
          expiryDate: relativeDate(45),
          medicalResult: "FIT",
          verifiedBy: "Staf Dokumen (Dimas)",
        },
        PASPOR: {
          status: "VERIFIED",
          docNumber: "E7712091",
          issuedBy: "Imigrasi Jakarta Timur",
          issueDate: "2025-02-10",
          expiryDate: "2030-02-10",
          verifiedBy: "Staf Dokumen (Dimas)",
        },
        SERTIFIKAT_KOMPETENSI: { status: "VERIFIED", docNumber: "BNSP-TW-2026-0912", verifiedBy: "Admin Pusat (Rina)" },
        PERJANJIAN_PENEMPATAN: {
          status: "VERIFIED",
          docNumber: "PP-TW/P3MI/VIII/2026/089",
          expiryDate: relativeDate(720),
          verifiedBy: "Admin Pusat (Rina)",
        },
        VISA: {
          status: "VERIFIED",
          docNumber: "TW-VISA-771201",
          expiryDate: relativeDate(170),
          verifiedBy: "Staf Dokumen (Dimas)",
        },
        TIKET_EKTKLN: {
          status: "VERIFIED",
          docNumber: "GA872-EKTKLN-9910",
          verifiedBy: "Admin Pusat (Rina)",
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
      destinationCountry: "Hong Kong",
      jobSector: "Domestic Worker (PRT)",
      employerName: "Mrs. Anita Cheung",
      agencyPartner: "Golden Harbour Employment Agency (HK)",
      vacancyId: "vac-3",
      stage: "ACTIVE_WORKER",
      specialStatus: "NORMAL",
      siskop2miId: "SISKOP-2025-HK-11902",
      flightInfo: "Cathay Pacific · CX798",
      departureDate: "2025-11-15",
      placementFee: 28000000,
      costIncurred: 20140000,
      sponsorCommission: 5000000,
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
        MEDICAL: { status: "VERIFIED", docNumber: "MCU-MLG-2025-881", medicalResult: "FIT", verifiedBy: "Staf Dokumen (Dimas)" },
        PASPOR: {
          status: "VERIFIED",
          docNumber: "C8819201",
          issuedBy: "Imigrasi Malang",
          issueDate: "2021-12-01",
          expiryDate: relativeDate(45),
          verifiedBy: "Staf Dokumen (Dimas)",
        },
        SERTIFIKAT_KOMPETENSI: { status: "VERIFIED", docNumber: "BNSP-HK-2025-0012", verifiedBy: "Admin Pusat (Rina)" },
        PERJANJIAN_PENEMPATAN: { status: "VERIFIED", docNumber: "ID407-HK-2025-331", expiryDate: "2027-11-15", verifiedBy: "Admin Pusat (Rina)" },
        VISA: { status: "VERIFIED", docNumber: "HK-VISA-2025-881", expiryDate: "2027-11-15", verifiedBy: "Staf Dokumen (Dimas)" },
        TIKET_EKTKLN: { status: "VERIFIED", docNumber: "CX798-EKTKLN-112", verifiedBy: "Admin Pusat (Rina)" },
      }),
    },
    {
      id: "cpmi-8",
      regNumber: "P3MI-2024-0019",
      nik: "3212156201930007",
      fullName: "Wati Susilawati",
      gender: "P",
      birthPlace: "Indramayu",
      birthDate: "1993-01-22",
      phone: "0812-3391-8800",
      address: "Kec. Sliyeg, Kab. Indramayu",
      maritalStatus: "Kawin",
      education: "SMA/SMK",
      destinationCountry: "Taiwan",
      jobSector: "Caregiver (Perawat Lansia)",
      employerName: "Lin Shu-Hua Family",
      agencyPartner: "Formosa Manpower Co., Ltd (Taipei)",
      stage: "ALUMNI",
      specialStatus: "REHIRE",
      siskop2miId: "SISKOP-2024-TW-00912",
      departureDate: "2023-09-01",
      returnDate: "2026-09-05",
      placementFee: 30000000,
      costIncurred: 20140000,
      sponsorCommission: 4500000,
      commissionPaid: true,
      branchId: "br-idm",
      sponsorId: "sp-1",
      portalPin: "930007",
      createdAt: "2023-06-10",
      updatedAt: relativeDate(-10),
      documents: buildDocsForCandidate("cpmi-8", {
        KTP: { status: "VERIFIED", docNumber: "3212156201930007", verifiedBy: "Admin Pusat (Rina)" },
        PASPOR: {
          status: "VERIFIED",
          docNumber: "E1129044",
          issuedBy: "Imigrasi Cirebon",
          issueDate: "2023-07-01",
          expiryDate: "2028-07-01",
          verifiedBy: "Staf Dokumen (Dimas)",
        },
      }),
    },
    {
      id: "cpmi-9",
      regNumber: "P3MI-2026-0109",
      nik: "3212154903960009",
      fullName: "Halimah Tusadiyah",
      gender: "P",
      birthPlace: "Indramayu",
      birthDate: "1996-03-09",
      phone: "0812-9940-7712",
      address: "Kec. Karangampel, Kab. Indramayu",
      maritalStatus: "Kawin",
      education: "SMA/SMK",
      destinationCountry: "Arab Saudi",
      jobSector: "Home Care / Hospitality Syarikah (SPSK)",
      employerName: "Syarikah Al-Mawarid Manpower (Riyadh)",
      agencyPartner: "Al-Mawarid Manpower / Musaned SPSK",
      vacancyId: "vac-5",
      stage: "READY",
      specialStatus: "NORMAL",
      siskop2miId: "SISKOP-SPSK-SA-2026-9910",
      flightInfo: "Saudia Airlines · SV819",
      departureDate: relativeDate(9),
      placementFee: 38000000,
      costIncurred: 12840000,
      sponsorCommission: 7000000,
      commissionPaid: false,
      branchId: "br-idm",
      sponsorId: "sp-1",
      portalPin: "960009",
      createdAt: relativeDate(-42),
      updatedAt: relativeDate(-1),
      documents: buildDocsForCandidate("cpmi-9", {
        KTP: {
          status: "VERIFIED",
          docNumber: "3212154903960009",
          issuedBy: "Disdukcapil Kab. Indramayu",
          aiCheckStatus: "MATCH",
          verifiedBy: "Admin Pusat (Rina)",
        },
        KK: {
          status: "VERIFIED",
          docNumber: "3212150104180002",
          issuedBy: "Disdukcapil Kab. Indramayu",
          aiCheckStatus: "MATCH",
          verifiedBy: "Admin Pusat (Rina)",
        },
        AKTA_IJAZAH: {
          status: "VERIFIED",
          docNumber: "DN-02 Ma 0091823",
          issuedBy: "MAN 1 Indramayu",
          aiCheckStatus: "MATCH",
          verifiedBy: "Admin Pusat (Rina)",
        },
        IZIN_KELUARGA: {
          status: "VERIFIED",
          docNumber: "470/211/KRA/2026",
          issuedBy: "Kuwu Karangampel",
          verifiedBy: "Admin Pusat (Rina)",
        },
        MEDICAL: {
          status: "VERIFIED",
          docNumber: "WAFID-GAMCA-2026-7741",
          issuedBy: "Klinik Wafid / GAMCA Terakreditasi GCC Jakarta",
          issueDate: relativeDate(-35),
          expiryDate: relativeDate(55),
          medicalResult: "FIT",
          aiCheckStatus: "MATCH",
          aiCheckNotes: "Medical Wafid (GAMCA) FIT Valid. Tersinkronisasi ke Enjaz & Musaned SPSK.",
          verifiedBy: "Staf Dokumen (Dimas)",
        },
        PASPOR: {
          status: "VERIFIED",
          docNumber: "E9941205",
          issuedBy: "Imigrasi Kelas I Cirebon",
          issueDate: "2025-04-10",
          expiryDate: "2030-04-10",
          aiCheckStatus: "MATCH",
          verifiedBy: "Staf Dokumen (Dimas)",
        },
        SERTIFIKAT_KOMPETENSI: {
          status: "VERIFIED",
          docNumber: "BNSP-SPSK-2026-8812",
          issuedBy: "BLK-LN Panca Banyu Ajisakti",
          verifiedBy: "Admin Pusat (Rina)",
        },
        PERJANJIAN_PENEMPATAN: {
          status: "VERIFIED",
          docNumber: "PK-MUSANED-SA-2026-551",
          issuedBy: "Syarikah Al-Mawarid & KBRI Riyadh",
          issueDate: relativeDate(-15),
          expiryDate: relativeDate(715),
          verifiedBy: "Admin Pusat (Rina)",
        },
        VISA: {
          status: "VERIFIED",
          docNumber: "SA-TASHEER-VISA-88412",
          issuedBy: "Kedutaan Besar Arab Saudi (Tasheer Biometric)",
          issueDate: relativeDate(-8),
          expiryDate: relativeDate(82),
          aiCheckStatus: "MATCH",
          verifiedBy: "Staf Dokumen (Dimas)",
        },
      }),
    },
    {
      id: "cpmi-10",
      regNumber: "P3MI-2026-0110",
      nik: "3301125811970005",
      fullName: "Nadia Permatasari",
      gender: "P",
      birthPlace: "Cilacap",
      birthDate: "1997-11-18",
      phone: "0813-7721-5509",
      address: "Kec. Majenang, Kab. Cilacap",
      maritalStatus: "Belum Kawin",
      education: "SMA/SMK",
      destinationCountry: "Uni Emirat Arab (UAE)",
      jobSector: "Hospitality & Housekeeping (Tadbeer / Hotel)",
      employerName: "Dubai Marina Hospitality & Tadbeer Center",
      agencyPartner: "Emirates Tadbeer & Hospitality Services LLC (Dubai)",
      vacancyId: "vac-6",
      stage: "CPMI",
      specialStatus: "NORMAL",
      siskop2miId: "SISKOP-AE-2026-3319",
      placementFee: 36000000,
      costIncurred: 8100000,
      sponsorCommission: 6000000,
      commissionPaid: false,
      branchId: "br-clp",
      sponsorId: "sp-2",
      portalPin: "970005",
      createdAt: relativeDate(-24),
      updatedAt: relativeDate(-2),
      documents: buildDocsForCandidate("cpmi-10", {
        KTP: { status: "VERIFIED", docNumber: "3301125811970005", verifiedBy: "Admin Pusat (Rina)" },
        KK: { status: "VERIFIED", docNumber: "3301120402160008", verifiedBy: "Admin Pusat (Rina)" },
        AKTA_IJAZAH: { status: "VERIFIED", docNumber: "DN-03 Mk 0771920", verifiedBy: "Admin Pusat (Rina)" },
        IZIN_KELUARGA: { status: "VERIFIED", docNumber: "470/91/MJN/2026", verifiedBy: "Admin Pusat (Rina)" },
        MEDICAL: {
          status: "VERIFIED",
          docNumber: "WAFID-AE-2026-3391",
          issuedBy: "Klinik Wafid GCC Resmi",
          issueDate: relativeDate(-18),
          expiryDate: relativeDate(72),
          medicalResult: "FIT",
          aiCheckStatus: "MATCH",
          verifiedBy: "Staf Dokumen (Dimas)",
        },
        PASPOR: {
          status: "VERIFIED",
          docNumber: "E7719022",
          issuedBy: "Imigrasi Cilacap",
          issueDate: "2025-08-01",
          expiryDate: "2030-08-01",
          verifiedBy: "Staf Dokumen (Dimas)",
        },
      }),
    },
    {
      id: "cpmi-11",
      regNumber: "P3MI-2026-0111",
      nik: "3507186104950006",
      fullName: "Laila Nurjanah",
      gender: "P",
      birthPlace: "Malang",
      birthDate: "1995-04-21",
      phone: "0857-8812-4490",
      address: "Kec. Dampit, Kab. Malang",
      maritalStatus: "Kawin",
      education: "SMA/SMK",
      destinationCountry: "Kuwait",
      jobSector: "Spa Therapist / Hospitality / Perawat Formal",
      employerName: "Royal Orchid Ladies Spa & Medical Center Kuwait",
      agencyPartner: "Al-Dhow International Recruitment (Kuwait City)",
      vacancyId: "vac-7",
      stage: "DEPLOYED",
      specialStatus: "NORMAL",
      siskop2miId: "SISKOP-KW-2026-6610",
      flightInfo: "Kuwait Airways · KU418",
      departureDate: relativeDate(-3),
      placementFee: 35000000,
      costIncurred: 21040000,
      sponsorCommission: 6500000,
      commissionPaid: true,
      branchId: "br-mlg",
      sponsorId: "sp-3",
      portalPin: "950006",
      createdAt: relativeDate(-60),
      updatedAt: relativeDate(-3),
      documents: buildDocsForCandidate("cpmi-11", {
        KTP: { status: "VERIFIED", docNumber: "3507186104950006", verifiedBy: "Admin Pusat (Rina)" },
        KK: { status: "VERIFIED", docNumber: "3507180209150003", verifiedBy: "Admin Pusat (Rina)" },
        AKTA_IJAZAH: { status: "VERIFIED", docNumber: "DN-05 Mk 0992811", verifiedBy: "Admin Pusat (Rina)" },
        IZIN_KELUARGA: { status: "VERIFIED", docNumber: "470/119/DMP/2026", verifiedBy: "Admin Pusat (Rina)" },
        MEDICAL: {
          status: "VERIFIED",
          docNumber: "WAFID-KW-2026-5510",
          issuedBy: "Klinik Wafid GCC Surabaya",
          issueDate: relativeDate(-50),
          expiryDate: relativeDate(40),
          medicalResult: "FIT",
          verifiedBy: "Staf Dokumen (Dimas)",
        },
        PASPOR: {
          status: "VERIFIED",
          docNumber: "E5510982",
          issuedBy: "Imigrasi Malang",
          issueDate: "2025-02-11",
          expiryDate: "2030-02-11",
          verifiedBy: "Staf Dokumen (Dimas)",
        },
        SERTIFIKAT_KOMPETENSI: { status: "VERIFIED", docNumber: "BNSP-SPA-2026-119", verifiedBy: "Admin Pusat (Rina)" },
        PERJANJIAN_PENEMPATAN: { status: "VERIFIED", docNumber: "PK-KW-2026-771", expiryDate: "2028-10-14", verifiedBy: "Admin Pusat (Rina)" },
        VISA: { status: "VERIFIED", docNumber: "KW-EVISA-2026-9910", expiryDate: "2028-10-14", verifiedBy: "Staf Dokumen (Dimas)" },
        TIKET_EKTKLN: { status: "VERIFIED", docNumber: "KU418-EKTKLN-991", verifiedBy: "Admin Pusat (Rina)" },
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
      summary: "Memverifikasi Visa Kerja Taiwan (TW-VISA-9920184) untuk Sri Wahyuni",
      details: "Masa berlaku visa s/d " + relativeDate(80) + ". Status CPMI naik ke tahap READY.",
      timestamp: relativeDate(-2) + " 14:22 WIB",
    },
    {
      id: "aud-2",
      candidateId: "cpmi-9",
      candidateName: "Halimah Tusadiyah",
      actorName: "Rina Kartika, S.Psi.",
      actorRole: "ADMIN_PUSAT",
      branchName: "Kantor Pusat Jakarta",
      actionType: "FINANCE_PAYMENT",
      summary: "Mencairkan Komisi Sponsor Termin DP 3 Skema SPSK Arab Saudi (Rp 1.750.000) a.n Halimah Tusadiyah",
      details: "Medical Wafid FIT & Visa Biometrik Tasheer Saudi telah terbit. Sisa Pelunasan 30% saat terbang SV819.",
      timestamp: relativeDate(-1) + " 11:10 WIB",
    },
    {
      id: "aud-3",
      candidateId: "cpmi-2",
      candidateName: "Ahmad Fauzi",
      actorName: "H. Bambang Wijaya, S.E.",
      actorRole: "DIREKTUR",
      branchName: "Kantor Pusat Jakarta",
      actionType: "SENSITIVE_DOC_VIEW",
      summary: "Membuka dokumen sensitif: Paspor RI & Hasil Medical Check-Up Ahmad Fauzi",
      details: "Tercatat sesuai kepatuhan UU Perlindungan Data Pribadi (UU PDP).",
      timestamp: relativeDate(0) + " 09:15 WIB",
    },
  ];

  const db: DatabaseSchema = {
    branches,
    sponsors,
    staffAccounts: createInitialStaff(),
    candidates,
    cases: createInitialCases(),
    vacancies: createInitialVacancies(),
    renewalTasks: [],
    auditLogs,
    badilRecords: createInitialBadilRecords(),
    foreignAgencies: createInitialForeignAgencies(),
    medicalClinics: createInitialMedicalClinics(),
    bpjsFinancingPartners: createInitialBpjsFinancing(),
  };

  syncExpirationsAndTasks(db);
  return db;
}

export function createInitialBadilRecords(): BadilRecord[] {
  return [
    {
      id: "bdl-1",
      code: "BDL-SA-2026-001",
      badilType: "PRA_TERBANG",
      reason: "UNFIT_WAFID_MEDICAL",
      reasonNotes:
        "Kandidat awal (Nurhayati Binti Hasan) dinyatakan UNFIT saat Medical Wafid (GAMCA) ulang untuk slot SPSK Arab Saudi. Slot Wakalah/Musaned dialihkan ke Halimah Tusadiyah (P3MI-2026-0115).",
      originalCandidateId: "cpmi-hist-01",
      originalCandidateName: "Nurhayati Binti Hasan (Arsip Batal Wafid)",
      originalRegNumber: "P3MI-2026-0071",
      replacementCandidateId: "cpmi-9",
      replacementCandidateName: "Halimah Tusadiyah",
      replacementRegNumber: "P3MI-2026-0115",
      destinationCountry: "Arab Saudi",
      agencyPartner: "Al-Maharah Human Resources Co. (Riyadh - SPSK)",
      employerName: "Al-Maharah Hospitality & Senior Care Division",
      vacancyId: "vac-5",
      sponsorDpTreatment: "CARRY_OVER_TO_REPLACEMENT",
      transferredSponsorDpAmount: 1400000,
      sunkCostAmount: 1650000,
      wakalahFeeScheme: "FULL_WAKALAH_FEE",
      createdAt: relativeDate(-14),
      processedBy: "Rina Kartika, S.Psi. (Admin Pusat)",
    },
  ];
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
      code: "AGN-TW-001",
      name: "Formosa Manpower Co., Ltd (Taipei)",
      country: "Taiwan",
      region: "ASIA_PASIFIK",
      licenseOrWakalahNo: "MOL-TW-TETO-1092-A",
      scheme: "Reguler TETO (Caregiver & Manufaktur Formal)",
      picName: "Mr.Kevin Chen",
      phoneEmail: "+886-2-2391-8800 · kevin@formosamanpower.com.tw",
      defaultAgencyFeeIdr: 32000000,
      warrantyDays: 90,
      mouExpiryDate: "2028-09-30",
      status: "ACTIVE",
    },
    {
      id: "agn-7",
      code: "AGN-HK-001",
      name: "Golden Lotus Employment Agency Ltd",
      country: "Hong Kong",
      region: "ASIA_PASIFIK",
      licenseOrWakalahNo: "HK-LD-EA-77210",
      scheme: "KJRI Hong Kong Accredited Employment Agency",
      picName: "Ms. Wendy Lau",
      phoneEmail: "+852-2577-9011 · wendy@goldenlotus.hk",
      defaultAgencyFeeIdr: 34000000,
      warrantyDays: 90,
      mouExpiryDate: "2028-05-15",
      status: "ACTIVE",
    },
    {
      id: "agn-8",
      code: "AGN-JP-001",
      name: "Sakura Kaigo Support TSK (Tokyo)",
      country: "Jepang",
      region: "ASIA_PASIFIK",
      licenseOrWakalahNo: "ISA-TSK-JP-21-00981",
      scheme: "Specified Skilled Worker (SSW / Tokutei Ginou)",
      picName: "Tanaka Kenji-san",
      phoneEmail: "+81-3-5512-9901 · tanaka@sakura-tsk.jp",
      defaultAgencyFeeIdr: 42000000,
      warrantyDays: 180,
      mouExpiryDate: "2029-03-31",
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
      targetCountries: "Arab Saudi, Kuwait, Oman, UAE (GCC)",
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
      targetCountries: "Arab Saudi, Kuwait, Oman, UAE (GCC)",
      status: "ACTIVE",
    },
    {
      id: "mcu-3",
      code: "KLINIK-MKS-01",
      name: "Klinik Utama Pramita Cirebon (Akreditasi Kemenkes & TETO)",
      accreditation: "WAFID_DAN_KEMENKES",
      city: "Cirebon / Indramayu",
      picName: "dr. Bambang Setiawan",
      phone: "0231-208911",
      standardMcuFeeIdr: 1250000,
      targetCountries: "Taiwan, Hong Kong, Singapura, Malaysia, Yordania",
      status: "ACTIVE",
    },
    {
      id: "mcu-4",
      code: "KLINIK-MKS-02",
      name: "RS Polri Kramat Jati — Unit MCU CPMI",
      accreditation: "KEMENKES_RI_ASIA",
      city: "Jakarta Timur",
      picName: "dr. Hendra Kusuma, Sp.Ok",
      phone: "021-8093288",
      standardMcuFeeIdr: 1350000,
      targetCountries: "Taiwan, Jepang, Korea Selatan, Hong Kong",
      status: "ACTIVE",
    },
    {
      id: "mcu-5",
      code: "KLINIK-MKS-03",
      name: "Klinik Budi Sehat Cilacap (Mitra Kemenkes RI)",
      accreditation: "KEMENKES_RI_ASIA",
      city: "Cilacap",
      picName: "dr. Wahyu Nugroho",
      phone: "0282-531290",
      standardMcuFeeIdr: 1200000,
      targetCountries: "Asia Pasifik & Pra-Skrining Awal Timur Tengah",
      status: "ACTIVE",
    },
  ];
}

export function createInitialBpjsFinancing(): BpjsFinancingPartner[] {
  return [
    {
      id: "bpjs-1",
      code: "BPJS-TK-PMI",
      name: "BPJS Ketenagakerjaan — Perlindungan Jaminan Sosial PMI",
      partnerType: "BPJS_KETENAGAKERJAAN",
      programPackage: "Paket Lengkap JKK + JKM (Pra-Penempatan, Masa Penempatan 24 Bln & Purna)",
      premiumOrRateInfo: "Rp 370.000 / CPMI (Pra Rp 37.000 + Masa & Purna Rp 333.000)",
      picName: "Rizky Pratama (Account Representative PMI)",
      phone: "175 / 021-5207797",
      status: "ACTIVE",
    },
    {
      id: "bpjs-2",
      code: "ASR-JASINDO-PMI",
      name: "Konsorsium Asuransi Jasindo — Proteksi Tambahan & Repatriasi",
      partnerType: "ASURANSI_PMI",
      programPackage: "Asuransi Kesehatan, Gagal Berangkat & Pemulangan Dini (Timteng & Asia)",
      premiumOrRateInfo: "Rp 450.000 / Kontrak 2 Tahun",
      picName: "Dewi Sartika, AAIK",
      phone: "021-3924888",
      status: "ACTIVE",
    },
    {
      id: "bpjs-3",
      code: "KUR-BNI-PMI",
      name: "PT Bank Negara Indonesia (Persero) Tbk — KUR Pekerja Migran",
      partnerType: "BANK_KUR_PMI",
      programPackage: "KUR PMI Penempatan Taiwan, Jepang, Hong Kong, Singapura & Korea",
      premiumOrRateInfo: "Plafon s/d Rp 45.000.000 · Bunga Subsidi 6% Efektif/Tahun (Tanpa Agunan)",
      picName: "Andi Wijaya (Divisi Kredit Program BNI)",
      phone: "1500046 / 021-2511946",
      status: "ACTIVE",
    },
    {
      id: "bpjs-4",
      code: "KUR-BRI-PMI",
      name: "PT Bank Rakyat Indonesia (Persero) Tbk — KUR TKI / PMI",
      partnerType: "BANK_KUR_PMI",
      programPackage: "KUR TKI Cabang Indramayu, Cilacap & Malang",
      premiumOrRateInfo: "Plafon s/d Rp 25.000.000 – Rp 40.000.000 · Bunga 6% p.a. Tenor 12–24 Bln",
      picName: "Budi Santoso (Mantri KUR PMI BRI)",
      phone: "14017 / 0234-272110",
      status: "ACTIVE",
    },
    {
      id: "bpjs-5",
      code: "BANK-BSI-SYARIAH",
      name: "PT Bank Syariah Indonesia Tbk (BSI) — Mitra Payroll & Wakalah Timteng",
      partnerType: "BANK_KUR_PMI",
      programPackage: "Rekening Tabungan Migran Syariah & Remitansi Arab Saudi / UAE / Kuwait",
      premiumOrRateInfo: "Bebas Biaya Admin Bulanan · Kurs Remitansi Khusus SAR/AED/KWD",
      picName: "Ust. Fauzan Hakim (BSI International Desk)",
      phone: "14040 / 021-30405555",
      status: "ACTIVE",
    },
  ];
}

export function syncExpirationsAndTasks(db: DatabaseSchema): void {
  if (!db.staffAccounts || db.staffAccounts.length === 0) {
    db.staffAccounts = createInitialStaff();
  }
  if (!db.cases || db.cases.length === 0) {
    db.cases = createInitialCases();
  }
  if (!db.badilRecords) {
    db.badilRecords = createInitialBadilRecords();
  }
  if (!db.foreignAgencies || db.foreignAgencies.length === 0) {
    db.foreignAgencies = createInitialForeignAgencies();
  }
  if (!db.medicalClinics || db.medicalClinics.length === 0) {
    db.medicalClinics = createInitialMedicalClinics();
  }
  if (!db.bpjsFinancingPartners || db.bpjsFinancingPartners.length === 0) {
    db.bpjsFinancingPartners = createInitialBpjsFinancing();
  }
  const initialVacancies = createInitialVacancies();
  if (!db.vacancies || db.vacancies.length === 0) {
    db.vacancies = initialVacancies;
  } else {
    for (const iv of initialVacancies) {
      if (!db.vacancies.some((v) => v.id === iv.id)) {
        db.vacancies.push(iv);
      }
    }
  }

  const activeTasksMap = new Map<string, RenewalTask>();
  for (const t of db.renewalTasks) {
    activeTasksMap.set(`${t.candidateId}-${t.documentId}`, t);
  }

  // Reset akumulasi komisi sponsor untuk dihitung akurat dari termin DP1, DP2, DP3, Pelunasan
  const sponsorPaidMap = new Map<string, number>();
  const sponsorPayableMap = new Map<string, number>();

  for (const cpmi of db.candidates) {
    if (!cpmi.portalPin) {
      cpmi.portalPin = cpmi.nik ? cpmi.nik.slice(-6) : "123456";
    }
    if (!cpmi.finance) {
      cpmi.finance = buildDefaultFinanceForCandidate(cpmi);
    }
    if (!cpmi.training) {
      cpmi.training = buildDefaultTrainingForCandidate(cpmi);
    }
    if (cpmi.id === "cpmi-9" && !cpmi.badilInfo) {
      cpmi.specialStatus = "BADIL_REPLACEMENT";
      cpmi.badilInfo = {
        role: "REPLACEMENT_CANDIDATE",
        badilRecordId: "bdl-1",
        badilType: "PRA_TERBANG",
        reason: "UNFIT_WAFID_MEDICAL",
        linkedCandidateId: "cpmi-hist-01",
        linkedCandidateName: "Nurhayati Binti Hasan (Batal Wafid)",
        linkedRegNumber: "P3MI-2026-0071",
        transferredSponsorDpAmount: 1400000,
        sunkCostAmount: 1650000,
        wakalahFeeScheme: "FULL_WAKALAH_FEE",
        processedAt: relativeDate(-14),
      };
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

  if (targetIdx >= 3) {
    const requiredForReady = candidate.documents.filter(
      (d) => d.requiredAtStage === "CPMI" || d.requiredAtStage === "READY"
    );
    for (const d of requiredForReady) {
      const daysLeft = getDaysRemaining(d.expiryDate);
      if (d.status === "EXPIRED" || (daysLeft !== null && daysLeft < 0)) {
        blockers.push(
          `Dokumen "${d.title}" sudah KEDALUWARSA (${d.expiryDate}) — berhenti dihitung lengkap!`
        );
      } else if (d.status !== "VERIFIED") {
        blockers.push(`Syarat tahap Ready "${d.title}" belum VERIFIED (Status: ${d.status}).`);
      }
      if (d.docType === "MEDICAL" && d.medicalResult !== "FIT") {
        blockers.push(
          `Hasil Medical Check-Up wajib berstatus FIT (Saat ini: ${d.medicalResult || "Belum diisi"}).`
        );
      }
    }
  }

  if (targetIdx >= 4) {
    const deployDocs = candidate.documents.filter((d) => d.requiredAtStage === "DEPLOYED");
    for (const d of deployDocs) {
      if (d.status !== "VERIFIED") {
        blockers.push(`Berkas keberangkatan "${d.title}" belum VERIFIED.`);
      }
    }
    if (!candidate.flightInfo || !candidate.departureDate) {
      blockers.push("Maskapai Penerbangan & Tanggal Keberangkatan wajib diisi sebelum status Deployed.");
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
