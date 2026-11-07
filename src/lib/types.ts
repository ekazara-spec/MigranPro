export type JourneyStage =
  | "LEAD"
  | "PROSPECT"
  | "CPMI"
  | "READY"
  | "DEPLOYED"
  | "ACTIVE_WORKER"
  | "RETURNED"
  | "ALUMNI";

export type SpecialStatus =
  | "NORMAL"
  | "REHIRE"
  | "BLACKLISTED"
  | "INACTIVE"
  | "BADIL_REPLACEMENT"
  | "REPLACED_OUT";

export type UserRole =
  | "DIREKTUR"
  | "ADMIN_PUSAT"
  | "KEPALA_CABANG"
  | "STAF_DOKUMEN"
  | "PEREKRUT_PL";

export type DocType =
  | "KTP"
  | "KK"
  | "AKTA_IJAZAH"
  | "IZIN_KELUARGA"
  | "PASPOR"
  | "MEDICAL"
  | "SERTIFIKAT_KOMPETENSI"
  | "PERJANJIAN_PENEMPATAN"
  | "VISA"
  | "TIKET_EKTKLN";

export type DocStatus =
  | "MISSING"
  | "UPLOADED"
  | "VERIFIED"
  | "REJECTED"
  | "EXPIRED";

export interface Branch {
  id: string;
  code: string;
  name: string;
  city: string;
  headName: string;
  phone: string;
}

export interface Sponsor {
  id: string;
  code: string;
  name: string;
  phone: string;
  area: string;
  branchId: string;
  bankAccount?: string;
  commissionPerCpmi: number;
  paidAmount: number;
  payableAmount: number;
}

export type CommissionTerminKey = "DP1" | "DP2" | "DP3" | "PELUNASAN";

export interface SponsorInstallment {
  id: string;
  terminKey: CommissionTerminKey;
  label: string; // "DP 1 (Lolos Medical FIT)", "DP 2 (Paspor & ID SISKOP2MI)", "DP 3 (Visa & PK Turun)", "Pelunasan (Sudah Terbang)"
  percentage: number; // misal: 25%, 25%, 25%, 25%
  amount: number;
  requiredStage: JourneyStage; // Tahap minimum agar termin disarankan cair
  status: "UNPAID" | "PAID";
  paidAt?: string;
  paymentMethod?: string; // "Transfer BCA", "Transfer BRI", "Kas Cabang"
  receiptNumber?: string; // KW-SP-2026-XXXX
  approvedBy?: string;
  notes?: string;
}

export type CostCategory =
  | "MEDICAL_CHECKUP"
  | "PASPOR_IMIGRASI"
  | "PELATIHAN_BLK_SERTIFIKASI"
  | "VISA_TETO_KEDUTAAN"
  | "TIKET_PESAWAT_HANDLING"
  | "BPJS_ASURANSI_PMI"
  | "LAINNYA";

export interface PlacementCostItem {
  id: string;
  category: CostCategory;
  title: string;
  amount: number;
  borneBy?: "AGENSI_MAJIKAN" | "CPMI_KUR" | "TALANGAN_P3MI";
  status: "PAID" | "PENDING";
  paidDate?: string;
  vendorName?: string;
}

export type FundingScheme =
  | "ZERO_COST_MAJIKAN"
  | "KUR_PMI_BANK"
  | "POTONG_GAJI_RESMI"
  | "MANDIRI_BERTAHAP";

export interface CandidateFinance {
  fundingScheme: FundingScheme;
  fundingBankOrAgency: string; // Misal: "KUR PMI BNI", "Full Employer Paid (Formosa)", dll.
  agencyFeeRevenue: number; // Pendapatan P3MI dari Agensi Mitra / Placement Fee (Rp)
  revenueReceived: number; // Jumlah yang sudah cair ke rekening P3MI
  kurStatus: "NOT_APPLICABLE" | "PENGAJUAN" | "DISETUJUI" | "CAIR_LUNAS";
  costItems: PlacementCostItem[]; // Rincian HPP biaya penempatan per CPMI
  sponsorInstallments: SponsorInstallment[]; // Pembayaran bertahap DP1, DP2, DP3, Pelunasan
}

export interface TrainingRecord {
  blkLocation: string;
  targetLanguage: string; // Mandarin, Jepang, Kantonis, Inggris
  attendancePct: number;
  languageScore: number; // 0 - 100
  skillScore: number; // 0 - 100
  examStatus: "BELUM_UJIAN" | "LULUS_KOMPETEN" | "REMEDIAL";
  dormitoryCheckIn?: string;
  instructorNotes?: string;
}

export interface StaffAccount {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  roleLabel: string;
  branchId: string;
  phone: string;
  active: boolean;
  pinCode: string;
}

export type CasePriority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type CaseStatus = "OPEN" | "IN_PROGRESS" | "ESCALATED" | "RESOLVED";
export type CaseCategory =
  | "GAJI_TERLAMBAT"
  | "MAJIKAN_PEKERJAAN"
  | "KESEHATAN_KECELAKAAN"
  | "DOKUMEN_IMIGRASI"
  | "PEMULANGAN_DINI"
  | "LAINNYA";

export interface CaseTimelineNote {
  id: string;
  authorName: string;
  authorRole: string;
  note: string;
  createdAt: string;
}

export interface CaseTicket {
  id: string;
  ticketNumber: string;
  candidateId: string;
  candidateName: string;
  candidateNik?: string;
  branchId: string;
  destinationCountry: string;
  employerName?: string;
  category: CaseCategory;
  priority: CasePriority;
  status: CaseStatus;
  title: string;
  description: string;
  picName: string;
  escalatedTo?: string;
  targetResolutionDate: string;
  reportedBy: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  timeline: CaseTimelineNote[];
}

export type DestinationCountry =
  | "Taiwan"
  | "Hong Kong"
  | "Jepang"
  | "Malaysia"
  | "Singapura"
  | "Korea Selatan"
  | "Arab Saudi"
  | "Kuwait"
  | "Oman"
  | "Yordania"
  | "Uni Emirat Arab (UAE)";

export type MiddleEastPlacementScheme =
  | "SPSK_MUSANED_SAUDI"
  | "TADBEER_MOHRE_UAE"
  | "FORMAL_WAKALAH_GCC"
  | "QIZ_GARMENT_JORDAN"
  | "REGULER_ASIA_TIMUR";

export interface JobVacancy {
  id: string;
  code: string;
  title: string;
  destinationCountry: DestinationCountry;
  placementRegion?: "TIMUR_TENGAH" | "ASIA_PASIFIK";
  middleEastScheme?: MiddleEastPlacementScheme;
  jobSector: string;
  agencyPartner: string;
  employerName: string;
  salaryForeign: string;
  salaryIdrEstimate: number;
  placementFee: number;
  quotaTotal: number;
  quotaFilled: number;
  genderPref: "P" | "L" | "P/L";
  minEducation: string;
  ageRange: string;
  requirements: string[];
  isPublished: boolean;
  closingDate: string;
  createdAt: string;
}

export interface CpmiDocument {
  id: string;
  candidateId: string;
  docType: DocType;
  title: string;
  docNumber?: string;
  issuedBy?: string;
  issueDate?: string;
  expiryDate?: string;
  status: DocStatus;
  medicalResult?: "FIT" | "UNFIT" | "PENDING";
  isSensitive: boolean;
  requiredAtStage: JourneyStage;
  aiCheckStatus?: "MATCH" | "MISMATCH" | "UNCHECKED";
  aiCheckNotes?: string;
  verifiedBy?: string;
  verifiedAt?: string;
  lastReminderTier?: number | null;
  notes?: string;
  fileDataUrl?: string; // Hasil upload foto/scan fisik dokumen (Data URL / Gambar / PDF)
  fileName?: string; // Nama file fisik yang diunggah (misal: scan-paspor-siti.jpg)
}

export interface RenewalTask {
  id: string;
  candidateId: string;
  candidateName: string;
  branchId: string;
  documentId: string;
  docType: DocType;
  docTitle: string;
  docNumber?: string;
  dueDate: string;
  daysLeft: number;
  tierLabel: "EXPIRED" | "7_HARI" | "14_HARI" | "30_HARI" | "60_HARI";
  status: "OPEN" | "IN_PROGRESS" | "COMPLETED";
  assignedTo: string;
  createdAt: string;
  completedAt?: string;
}

export type BadilType = "PRA_TERBANG" | "GARANSI_90_HARI";

export type BadilReason =
  | "UNFIT_WAFID_MEDICAL"
  | "MUNDUR_SEPIHAK"
  | "GAGAL_VISA_TASHEER"
  | "PULANG_GARANSI_90_HARI"
  | "LAINNYA";

export interface BadilInfo {
  role: "REPLACED_ORIGINAL" | "REPLACEMENT_CANDIDATE";
  badilRecordId: string;
  badilType: BadilType;
  reason: BadilReason;
  linkedCandidateId: string;
  linkedCandidateName: string;
  linkedRegNumber: string;
  transferredSponsorDpAmount: number;
  sunkCostAmount: number;
  wakalahFeeScheme: "FULL_WAKALAH_FEE" | "FREE_WARRANTY_REPLACEMENT";
  processedAt: string;
}

export interface BadilRecord {
  id: string;
  code: string;
  badilType: BadilType;
  reason: BadilReason;
  reasonNotes: string;
  originalCandidateId: string;
  originalCandidateName: string;
  originalRegNumber: string;
  replacementCandidateId: string;
  replacementCandidateName: string;
  replacementRegNumber: string;
  destinationCountry: DestinationCountry;
  agencyPartner: string;
  employerName: string;
  vacancyId?: string;
  sponsorDpTreatment: "CARRY_OVER_TO_REPLACEMENT" | "REFUND_CLAWBACK" | "ABSORBED_BY_P3MI";
  transferredSponsorDpAmount: number;
  sunkCostAmount: number;
  wakalahFeeScheme: "FULL_WAKALAH_FEE" | "FREE_WARRANTY_REPLACEMENT";
  createdAt: string;
  processedBy: string;
}

export interface ForeignAgency {
  id: string;
  code: string;
  name: string;
  country: DestinationCountry;
  region: "TIMUR_TENGAH" | "ASIA_PASIFIK";
  licenseOrWakalahNo: string;
  scheme: string;
  picName: string;
  phoneEmail: string;
  defaultAgencyFeeIdr: number;
  warrantyDays: number;
  mouExpiryDate: string;
  status: "ACTIVE" | "EXPIRED_MOU" | "SUSPENDED";
}

export interface MedicalClinicPartner {
  id: string;
  code: string;
  name: string;
  accreditation: "WAFID_GCC_GAMCA" | "KEMENKES_RI_ASIA" | "WAFID_DAN_KEMENKES";
  city: string;
  picName: string;
  phone: string;
  standardMcuFeeIdr: number;
  targetCountries: string;
  status: "ACTIVE" | "INACTIVE";
}

export interface BpjsFinancingPartner {
  id: string;
  code: string;
  name: string;
  partnerType: "BPJS_KETENAGAKERJAAN" | "ASURANSI_PMI" | "BANK_KUR_PMI";
  programPackage: string;
  premiumOrRateInfo: string;
  picName: string;
  phone: string;
  status: "ACTIVE" | "INACTIVE";
}

export interface AuditLog {
  id: string;
  candidateId?: string;
  candidateName?: string;
  actorName: string;
  actorRole: UserRole;
  branchName: string;
  actionType:
    | "STAGE_CHANGE"
    | "DOC_VERIFIED"
    | "DOC_UPLOADED"
    | "SENSITIVE_DOC_VIEW"
    | "NIK_DUPLICATE_BLOCKED"
    | "RENEWAL_TASK"
    | "CANDIDATE_CREATED"
    | "SPECIAL_STATUS"
    | "AI_VERIFICATION"
    | "CASE_UPDATED"
    | "VACANCY_APPLIED"
    | "USER_LOGIN"
    | "FINANCE_PAYMENT"
    | "TRAINING_UPDATED"
    | "BADIL_PROCESSED"
    | "MASTER_DATA_UPDATED";
  summary: string;
  details?: string;
  timestamp: string;
}

export type DocHandoverType = "NONE" | "ASLI" | "COPY";
export type LangSkillLevel = "NONE" | "BAIK" | "CUKUP" | "BURUK";
export type F4LangLevel = "TIDAK_BISA" | "SEDIKIT" | "LANCAR";

export interface OverseasWorkExperienceRow {
  no: number;
  countryAndCity: string; // NEGARA DAN KOTA
  duration: string; // LAMA
  period: string; // PERIODE
  returnStatus: "SELESAI" | "KASUS" | "NONE"; // STATUS PEMULANGAN (SELESAI / KASUS)
  remarks: string; // KETERANGAN
}

export interface OfficialRegistrationForm {
  nickname: string; // Nama Panggilan
  realAge?: number; // 4. Umur Asli (Tahun)
  heightCm: number; // 10. Tinggi Badan (Cm)
  weightKg: number; // 10. Berat Badan (Kg)
  religion: string; // 5. Agama
  postalCode: string; // Kode Pos
  graduationYear: string; // Lulus Tahun
  ktpOrPassportNo: string; // No. KTP / Paspor
  fatherName: string; // 12. Nama Bapak
  fatherAge: number; // 12. Umur Bapak (Th)
  motherName: string; // 12. Nama Ibu
  motherAge: number; // 12. Umur Ibu (Th)
  paternalGrandfatherName?: string; // 12. Kakek dari Bapak
  spouseOrGuardianName: string; // 13. Suami
  spouseAge: number; // 13. Umur Suami (Th)
  spouseOccupation: string; // 13. Pekerjaan Suami
  childrenTotalCount?: number; // 9. Jumlah Anak (... Orang)
  firstChildAge?: string; // 9. Anak Pertama (... Tahun)
  lastChildAge?: string; // 9. Anak Terakhir (... Tahun)
  boysCountAndAges: string;
  girlsCountAndAges: string;
  childOrder: number; // 7. Anak ke
  siblingsCount: number; // 7. dari ... bersaudara
  emergencyContactName: string; // 14. Keluarga Lain: nama
  emergencyContactRelation: string; // 14. hubungan
  emergencyContactPhone: string; // 14. no tlp
  workExperience1: string;
  workExperience2: string;
  overseasExperiences?: OverseasWorkExperienceRow[]; // 15. PENGALAMAN BEKERJA DILUAR NEGERI (Ex/Non)
  overseasExperienceNotes?: string; // Keterangan di bawah tabel 15
  arabicLevelF4?: F4LangLevel; // 15.A. Bahasa Arab (Tidak Bisa / Sedikit / lancar)
  arabicNotesF4?: string; // Ket. Bahasa Arab
  englishLevelF4?: F4LangLevel; // 15.B. Bahasa Inggris (Tidak Bisa / Sedikit / lancar)
  englishNotesF4?: string; // Ket. Bahasa Inggris
  willingCareBaby?: boolean; // 16.a. Merawat Anak Bayi / Anak Kecil
  willingCareBabyNotes?: string; // Ket. 16.a
  willingCareElderly?: boolean; // 16.b. Merawat Orang Tua Jompo
  willingCareElderlyNotes?: string; // Ket. 16.b
  willingHousekeeping?: boolean; // 16.c. Bersih-bersih Rumah / Cuci Baju/Menyertrika dll.
  willingHousekeepingNotes?: string; // Ket. 16.c
  arabicCookingSkills?: string[]; // 16.d. Memasak masakan Arab (Ruz Kabsah, Ruz Bukhari, dll.)
  desiredJobCleaner: boolean;
  desiredJobFactory: boolean;
  desiredJobNurse: boolean;
  desiredJobHospitality: boolean;
  desiredJobOther: boolean;
  desiredJobOtherText: string;
  docHandover: {
    ktp: DocHandoverType; // 17.b. KTP (copy / asli)
    kk: DocHandoverType; // 17.c. KK (copy / asli)
    akteKelahiran: DocHandoverType; // 17.b. Akta Lahir (copy / asli)
    izinKeluarga: DocHandoverType; // 17.b. Surat Izin Orang Tua (copy / asli)
    izinSuami?: DocHandoverType; // 17.c. Surat Izin Suami (copy / asli)
    sttbIjazah: DocHandoverType; // 17.a. Ijazah/STTB (copy / asli)
    kartuBpjs?: DocHandoverType; // 17.a. Kartu BPJS (copy / asli)
    skck: DocHandoverType;
    paspor: DocHandoverType; // 17.a. Passport Lama (copy / asli)
    otherDoc8Name: string; // 17.c. Dokumen Lain..........
    otherDoc8Status: DocHandoverType;
    otherDoc9Name: string;
    otherDoc9Status: DocHandoverType;
  };
  languageSkills: {
    english: LangSkillLevel;
    mandarin: LangSkillLevel;
    arabic: LangSkillLevel;
    otherLanguageName: string;
    otherLanguageLevel: LangSkillLevel;
  };
  acceptanceDecision?: "TERIMA" | "TIDAK_DITERIMA" | "PENDING"; // Terima ( ) / Tidak diterima ( )
  accByName?: string; // ACC: (...................................)
  interviewMethod?: "TELEPON" | "VIDEO_CALL" | "DATANG_LANGSUNG"; // Metode Interview oleh Petugas PT Panca
  candidateNotes: string; // Catatan berkas
  sponsorOfficerName: string; // 2. Nama Sponsor & Petugas Lapangan/Rekrut
  sponsorOfficerPhone: string; // Nomor Telp / Hp Sponsor
  sponsorNotes: string; // Catatan Hasil Interview Petugas PT
  receivedByPtOfficer: string; // Yang menerima / menginterview CPMI (Petugas PT.)
  formSignedDate: string; // Tgl ......... / ........ / .................
}

export interface SponsorFormSubmission {
  id: string;
  submissionCode: string;
  submittedAt: string;
  sponsorId: string;
  sponsorName: string;
  sponsorPhone: string;
  branchId: string;
  status: "MENUNGGU_DATA_ENTRY" | "SUDAH_DIINPUT";
  sourceMethod: "SCAN_FORM_FISIK" | "FORM_DIGITAL_SPONSOR" | "PARSE_WA_SPONSOR";
  interviewMethod?: "TELEPON" | "VIDEO_CALL" | "DATANG_LANGSUNG";
  physicalFormImageUrl?: string;
  processedCandidateId?: string;
  processedRegNumber?: string;
  processedBy?: string;
  processedAt?: string;
  fullName: string;
  nik?: string;
  gender: "P" | "L";
  avatarUrl?: string;
  birthPlace: string;
  birthDate: string;
  phone: string;
  address: string;
  maritalStatus: string;
  education: string;
  destinationCountry: DestinationCountry;
  jobSector: string;
  registrationForm: OfficialRegistrationForm;
}

export interface Candidate {
  id: string;
  regNumber: string;
  nik?: string;
  fullName: string;
  gender: "P" | "L";
  avatarUrl?: string; // Pas Foto / Avatar CPMI (Data URL / Preset SVG / Foto Upload)
  birthPlace?: string;
  birthDate?: string;
  phone: string;
  address?: string;
  maritalStatus?: string;
  education?: string;
  destinationCountry: DestinationCountry;
  jobSector: string;
  employerName?: string;
  agencyPartner?: string;
  vacancyId?: string;
  stage: JourneyStage;
  specialStatus: SpecialStatus;
  siskop2miId?: string;
  flightInfo?: string;
  departureDate?: string;
  returnDate?: string;
  placementFee: number;
  costIncurred: number;
  sponsorCommission: number;
  commissionPaid: boolean;
  branchId: string;
  sponsorId?: string;
  portalPin?: string;
  createdAt: string;
  updatedAt: string;
  documents: CpmiDocument[];
  finance?: CandidateFinance;
  training?: TrainingRecord;
  badilInfo?: BadilInfo;
  registrationForm?: OfficialRegistrationForm;
}

export const JOURNEY_STAGES: {
  key: JourneyStage;
  label: string;
  shortDesc: string;
  isEngineControlled: boolean;
}[] = [
  {
    key: "LEAD",
    label: "Lead",
    shortDesc: "Masuk dari lowongan atau sponsor (Cukup Nama & Kontak)",
    isEngineControlled: false,
  },
  {
    key: "PROSPECT",
    label: "Prospect",
    shortDesc: "Diseleksi, NIK & berkas identitas awal dikumpulkan",
    isEngineControlled: false,
  },
  {
    key: "CPMI",
    label: "CPMI",
    shortDesc: "Dokumen wajib dasar lengkap; Paspor, Medical & Visa berjalan",
    isEngineControlled: true,
  },
  {
    key: "READY",
    label: "Ready",
    shortDesc: "Paspor, Medical FIT, Visa & Kontrak lengkap — siap terbang",
    isEngineControlled: true,
  },
  {
    key: "DEPLOYED",
    label: "Deployed",
    shortDesc: "Tiket & E-KTKLN SISKOP2MI terbit, sudah diberangkatkan",
    isEngineControlled: true,
  },
  {
    key: "ACTIVE_WORKER",
    label: "Active Worker",
    shortDesc: "Aktif bekerja pada majikan di negara tujuan",
    isEngineControlled: true,
  },
  {
    key: "RETURNED",
    label: "Returned",
    shortDesc: "Kontrak selesai & kembali ke Indonesia (Proses Purna)",
    isEngineControlled: true,
  },
  {
    key: "ALUMNI",
    label: "Alumni",
    shortDesc: "Riwayat tersimpan rapi untuk kemudahan Rehire",
    isEngineControlled: true,
  },
];

export const DOC_TEMPLATE_CONFIG: {
  docType: DocType;
  title: string;
  isSensitive: boolean;
  requiredAtStage: JourneyStage;
  hasExpiry: boolean;
  description: string;
}[] = [
  {
    docType: "KTP",
    title: "KTP Elektronik (16 Digit NIK)",
    isSensitive: true,
    requiredAtStage: "PROSPECT",
    hasExpiry: false,
    description: "Identitas utama penentu keunikan berkas CPMI",
  },
  {
    docType: "KK",
    title: "Kartu Keluarga (KK)",
    isSensitive: false,
    requiredAtStage: "PROSPECT",
    hasExpiry: false,
    description: "Data susunan keluarga & kecocokan nama orang tua",
  },
  {
    docType: "AKTA_IJAZAH",
    title: "Akta Kelahiran / Ijazah Terakhir",
    isSensitive: false,
    requiredAtStage: "PROSPECT",
    hasExpiry: false,
    description: "Dokumen pendukung verifikasi tanggal lahir & pendidikan",
  },
  {
    docType: "IZIN_KELUARGA",
    title: "Surat Izin Keluarga (Diketahui Lurah/Kades)",
    isSensitive: false,
    requiredAtStage: "CPMI",
    hasExpiry: false,
    description: "Izin tertulis suami/istri/orang tua/wali bermeterai",
  },
  {
    docType: "MEDICAL",
    title: "Hasil Medical Check-Up (Pra-Penempatan)",
    isSensitive: true,
    requiredAtStage: "CPMI",
    hasExpiry: true,
    description: "Wajib berstatus FIT & masa berlaku belum habis (biasanya 90 hari)",
  },
  {
    docType: "PASPOR",
    title: "Paspor RI (48 Halaman)",
    isSensitive: true,
    requiredAtStage: "CPMI",
    hasExpiry: true,
    description: "Masa berlaku dipantau ketat (peringatan <60, <30, <14, <7 hari)",
  },
  {
    docType: "SERTIFIKAT_KOMPETENSI",
    title: "Sertifikat Kompetensi / Pelatihan BLK",
    isSensitive: false,
    requiredAtStage: "READY",
    hasExpiry: false,
    description: "Sertifikat keterampilan & bahasa sesuai negara tujuan",
  },
  {
    docType: "PERJANJIAN_PENEMPATAN",
    title: "Perjanjian Penempatan & Kontrak Kerja (PK)",
    isSensitive: true,
    requiredAtStage: "READY",
    hasExpiry: true,
    description: "Kontrak kerja antara CPMI, P3MI, dan Pemberi Kerja/Majikan",
  },
  {
    docType: "VISA",
    title: "Visa Kerja Negara Tujuan",
    isSensitive: true,
    requiredAtStage: "READY",
    hasExpiry: true,
    description: "Visa kerja resmi dari kedutaan/perwakilan negara tujuan",
  },
  {
    docType: "TIKET_EKTKLN",
    title: "Tiket Keberangkatan & Bukti OPP / E-KTKLN SISKOP2MI",
    isSensitive: false,
    requiredAtStage: "DEPLOYED",
    hasExpiry: false,
    description: "Syarat mutlak sebelum status CPMI menjadi Deployed",
  },
];
