import {
  CashAdvance,
  CashJournal,
  CashJournalCategory,
  CashTransactionType,
  CostCategory,
} from "./types";

export interface MinimalDbForCashflow {
  cashJournals?: CashJournal[];
  cashAdvances?: CashAdvance[];
}

export function mapPaymentMethodToCashMethod(
  method?: string
): "BANK_TRANSFER" | "CASH" | "GIRO" {
  const upper = String(method || "").toUpperCase();
  if (upper.includes("TUNAI") || upper.includes("CASH")) return "CASH";
  if (upper.includes("GIRO")) return "GIRO";
  return "BANK_TRANSFER";
}

export function getDefaultBankAccountLabel(method?: string): string {
  const cashMethod = mapPaymentMethodToCashMethod(method);
  if (cashMethod === "CASH") return "Kas Tunai Operasional Kantor";
  if (cashMethod === "GIRO") return "Rekening Giro Operasional P3MI";
  return "Rekening Bank Operasional PT Panca Banyu Ajisakti";
}

export function mapCostCategoryToCashCategory(
  category: CostCategory
): CashJournalCategory {
  switch (category) {
    case "MEDICAL_CHECKUP":
      return "MEDICAL_PAYMENT";
    case "PASPOR_IMIGRASI":
      return "PASPOR_PAYMENT";
    case "PELATIHAN_BLK_SERTIFIKASI":
      return "BLK_TRAINING";
    case "TIKET_PESAWAT_HANDLING":
      return "TIKET_FLIGHT";
    default:
      return "OPERASIONAL_KANTOR";
  }
}

/** Finds all unpaid/open cash advances belonging to a sponsor (matched by ID or name). */
export function getOpenSponsorAdvances(
  cashAdvances: CashAdvance[] | undefined,
  sponsorId?: string,
  sponsorName?: string
): CashAdvance[] {
  if (!Array.isArray(cashAdvances) || cashAdvances.length === 0) return [];
  const normName = (sponsorName || "").trim().toLowerCase();
  return cashAdvances
    .filter((adv) => {
      if (adv.borrowerType !== "SPONSOR") return false;
      if (adv.status === "LUNAS" || adv.remainingAmount <= 0) return false;
      if (sponsorId && adv.borrowerId === sponsorId) return true;
      if (normName && adv.borrowerName.trim().toLowerCase() === normName) return true;
      return false;
    })
    .sort((a, b) => a.dateGiven.localeCompare(b.dateGiven));
}

export function getOpenSponsorKasbonTotal(
  cashAdvances: CashAdvance[] | undefined,
  sponsorId?: string,
  sponsorName?: string
): number {
  return getOpenSponsorAdvances(cashAdvances, sponsorId, sponsorName).reduce(
    (sum, adv) => sum + Math.max(0, adv.remainingAmount || 0),
    0
  );
}

export function computeKasbonDeductionPreview(
  grossPaymentAmount: number,
  openKasbonTotal: number,
  deductEnabled: boolean
): { kasbonDeducted: number; netCashPaid: number } {
  const gross = Math.max(0, Math.round(grossPaymentAmount || 0));
  if (!deductEnabled || openKasbonTotal <= 0 || gross <= 0) {
    return { kasbonDeducted: 0, netCashPaid: gross };
  }
  const kasbonDeducted = Math.min(gross, Math.round(openKasbonTotal));
  return {
    kasbonDeducted,
    netCashPaid: Math.max(0, gross - kasbonDeducted),
  };
}

/** Deducts up to maxDeductAmount sequentially from oldest open sponsor cash advances. */
export function applySponsorKasbonDeduction(
  db: MinimalDbForCashflow,
  params: {
    sponsorId?: string;
    sponsorName: string;
    maxDeductAmount: number;
    referenceNo: string;
    date: string;
    deductEnabled?: boolean;
  }
): { totalDeducted: number; netCashPaid: number } {
  const gross = Math.max(0, Math.round(params.maxDeductAmount || 0));
  if (params.deductEnabled === false || gross <= 0) {
    return { totalDeducted: 0, netCashPaid: gross };
  }

  const openAdvances = getOpenSponsorAdvances(
    db.cashAdvances,
    params.sponsorId,
    params.sponsorName
  );
  let remainingToDeduct = gross;
  let totalDeducted = 0;

  for (const adv of openAdvances) {
    if (remainingToDeduct <= 0) break;
    const take = Math.min(adv.remainingAmount, remainingToDeduct);
    if (take <= 0) continue;

    adv.remainingAmount = Math.max(0, adv.remainingAmount - take);
    adv.deductions.push({
      id: `ded-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      date: params.date,
      amount: take,
      note: `Potong otomatis pencairan Fee Sponsor (${params.referenceNo})`,
    });
    if (adv.remainingAmount <= 0) {
      adv.status = "LUNAS";
    }
    remainingToDeduct -= take;
    totalDeducted += take;
  }

  return {
    totalDeducted,
    netCashPaid: Math.max(0, gross - totalDeducted),
  };
}

/** Appends a real cash journal entry into db.cashJournals (no-op when amount <= 0). */
export function appendCashJournalEntry(
  db: MinimalDbForCashflow,
  params: {
    branchId?: string;
    transactionDate: string;
    type: CashTransactionType;
    category: CashJournalCategory;
    amount: number;
    recipientOrPayer: string;
    description: string;
    paymentMethod?: string;
    bankAccountName?: string;
    referenceNumber?: string;
    candidateId?: string;
    createdBy: string;
    createdAt: string;
  }
): CashJournal | null {
  const cleanAmount = Math.round(Number(params.amount || 0));
  if (cleanAmount <= 0) return null;

  if (!db.cashJournals) db.cashJournals = [];
  const cashMethod = mapPaymentMethodToCashMethod(params.paymentMethod);
  const entry: CashJournal = {
    id: `cj-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    tenantId: "tenant-panca",
    branchId: params.branchId || "br-jkt",
    transactionDate: params.transactionDate,
    type: params.type,
    category: params.category,
    amount: cleanAmount,
    recipientOrPayer: params.recipientOrPayer,
    description: params.description,
    paymentMethod: cashMethod,
    bankAccountName:
      params.bankAccountName || getDefaultBankAccountLabel(params.paymentMethod),
    referenceNumber: params.referenceNumber,
    candidateId: params.candidateId,
    createdBy: params.createdBy,
    createdAt: params.createdAt,
  };
  db.cashJournals.unshift(entry);
  return entry;
}
