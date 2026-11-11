import type {
  Candidate,
  CommissionTerminKey,
  JourneyStage,
  SponsorInstallment,
} from "./types";

export const TERMIN_ORDER: readonly CommissionTerminKey[] = [
  "DP1",
  "DP2",
  "DP3",
  "PELUNASAN",
];

export const TERMIN_STAGE_ORDER: readonly JourneyStage[] = [
  "LEAD",
  "PROSPECT",
  "CPMI",
  "READY",
  "DEPLOYED",
  "ACTIVE_WORKER",
  "RETURNED",
  "ALUMNI",
];

export const DEFAULT_TERMIN_WEIGHTS: Record<CommissionTerminKey, number> = {
  DP1: 20,
  DP2: 25,
  DP3: 25,
  PELUNASAN: 30,
};

export function getTerminShortTitle(terminKey: CommissionTerminKey): string {
  switch (terminKey) {
    case "DP1":
      return "DP 1";
    case "DP2":
      return "DP 2";
    case "DP3":
      return "DP 3";
    case "PELUNASAN":
      return "Pelunasan";
  }
}

export function getCandidateSponsorTotals(candidate: Candidate): {
  totalFee: number;
  paidAmount: number;
  remainingAmount: number;
} {
  const installments = candidate.finance?.sponsorInstallments || [];
  const totalFee = candidate.sponsorCommission || 0;
  const paidAmount = installments
    .filter((i) => i.status === "PAID")
    .reduce((acc, i) => acc + i.amount, 0);
  return {
    totalFee,
    paidAmount,
    remainingAmount: Math.max(0, totalFee - paidAmount),
  };
}

export function checkCandidateTerminEligibility(
  candidate: Candidate,
  terminKey: CommissionTerminKey
): {
  eligible: boolean;
  reason?: string;
  installment?: SponsorInstallment;
  needsStageOverride: boolean;
} {
  const installments = candidate.finance?.sponsorInstallments || [];
  const tIdx = TERMIN_ORDER.indexOf(terminKey);
  const inst = installments.find((i) => i.terminKey === terminKey);
  if (!inst) {
    return {
      eligible: false,
      reason: "Termin komisi belum tersedia",
      needsStageOverride: false,
    };
  }
  if (inst.status === "PAID") {
    return {
      eligible: false,
      reason: `${getTerminShortTitle(terminKey)} sudah lunas`,
      installment: inst,
      needsStageOverride: false,
    };
  }
  if (tIdx > 0) {
    const prevKey = TERMIN_ORDER[tIdx - 1];
    const prevInst = installments.find((i) => i.terminKey === prevKey);
    if (prevInst && prevInst.status !== "PAID") {
      return {
        eligible: false,
        reason: `Menunggu ${getTerminShortTitle(prevKey)} dicairkan`,
        installment: inst,
        needsStageOverride: false,
      };
    }
  }

  const curStageIdx = TERMIN_STAGE_ORDER.indexOf(candidate.stage);
  const reqStageIdx = TERMIN_STAGE_ORDER.indexOf(inst.requiredStage);
  return {
    eligible: true,
    installment: inst,
    needsStageOverride: curStageIdx < reqStageIdx,
  };
}

export interface BatchDistributionRow {
  candidate: Candidate;
  assignedAmount: number;
  currentTotalFee: number;
  alreadyPaid: number;
  remainingBefore: number;
  effectiveTotalFee: number;
  remainingAfter: number;
  percentageOfFee: number;
  exceedsRemaining: boolean;
  needsStageOverride: boolean;
  requiredStage: JourneyStage;
}

export function computeBatchSponsorDistribution(
  candidates: Candidate[],
  totalBatchAmount: number,
  terminKey: CommissionTerminKey,
  mode: "EQUAL_SPLIT" | "PROPORTIONAL_CAP" = "EQUAL_SPLIT",
  autoAdjustCommissionIfExceeded = false
): BatchDistributionRow[] {
  const n = candidates.length;
  if (n === 0) return [];

  const cleanTotal = Math.max(0, Math.round(totalBatchAmount || 0));
  const assignedMap = new Map<string, number>();

  if (mode === "EQUAL_SPLIT" || cleanTotal === 0) {
    const base = Math.floor(cleanTotal / n);
    let rem = cleanTotal - base * n;
    for (const c of candidates) {
      const share = base + (rem > 0 ? 1 : 0);
      if (rem > 0) rem--;
      assignedMap.set(c.id, share);
    }
  } else {
    // PROPORTIONAL_CAP: alokasikan proporsional terhadap sisa masing-masing CPMI
    const rems = candidates.map((c) => getCandidateSponsorTotals(c).remainingAmount);
    const totalRem = rems.reduce((acc, v) => acc + v, 0);
    if (totalRem <= 0) {
      const base = Math.floor(cleanTotal / n);
      let rem = cleanTotal - base * n;
      for (const c of candidates) {
        assignedMap.set(c.id, base + (rem > 0 ? 1 : 0));
        if (rem > 0) rem--;
      }
    } else {
      let allocated = 0;
      candidates.forEach((c, idx) => {
        if (idx === n - 1) {
          assignedMap.set(c.id, Math.max(0, cleanTotal - allocated));
        } else {
          const share = Math.round((cleanTotal * rems[idx]) / totalRem);
          assignedMap.set(c.id, share);
          allocated += share;
        }
      });
    }
  }

  return candidates.map((c) => {
    const { totalFee, paidAmount, remainingAmount } = getCandidateSponsorTotals(c);
    const assignedAmount = assignedMap.get(c.id) || 0;
    const exceedsRemaining = assignedAmount > remainingAmount;
    const effectiveTotalFee =
      exceedsRemaining && autoAdjustCommissionIfExceeded
        ? paidAmount + assignedAmount
        : totalFee;
    const remainingAfter = Math.max(
      0,
      effectiveTotalFee - (paidAmount + assignedAmount)
    );
    const percentageOfFee =
      effectiveTotalFee > 0
        ? Math.round((assignedAmount / effectiveTotalFee) * 1000) / 10
        : 0;
    const elig = checkCandidateTerminEligibility(c, terminKey);

    return {
      candidate: c,
      assignedAmount,
      currentTotalFee: totalFee,
      alreadyPaid: paidAmount,
      remainingBefore: remainingAmount,
      effectiveTotalFee,
      remainingAfter,
      percentageOfFee,
      exceedsRemaining,
      needsStageOverride: elig.needsStageOverride,
      requiredStage: elig.installment?.requiredStage || "CPMI",
    };
  });
}

function updateLabelPercentage(label: string, percentage: number): string {
  if (/\(\s*[\d.]+%/.test(label)) {
    return label.replace(/\(\s*[\d.]+%/, `(${percentage}%`);
  }
  return `${label} (${percentage}%)`;
}

export interface CustomPaymentMeta {
  paidAt: string;
  paymentMethod: string;
  receiptNumber: string;
  approvedBy: string;
  notes?: string;
  autoAdjustCommissionIfExceeded?: boolean;
}

/**
 * Mencatat pembayaran termin sponsor dengan nominal custom dan menyeimbangkan
 * sisa nominal/persentase pada termin-termin berikutnya agar total tetap akurat.
 */
export function applyCustomSponsorInstallmentPayment(
  candidate: Candidate,
  terminKey: CommissionTerminKey,
  customAmount: number,
  meta: CustomPaymentMeta
): { ok: true; installment: SponsorInstallment } | { ok: false; error: string } {
  if (!candidate.finance || candidate.finance.sponsorInstallments.length === 0) {
    return { ok: false, error: `Data termin fee sponsor untuk ${candidate.fullName} belum tersedia.` };
  }

  const cleanAmount = Math.round(customAmount);
  if (!Number.isFinite(cleanAmount) || cleanAmount < 0) {
    return { ok: false, error: "Nominal pembayaran custom tidak boleh bernilai negatif." };
  }

  const installments = candidate.finance.sponsorInstallments;
  const targetIdx = installments.findIndex((i) => i.terminKey === terminKey);
  if (targetIdx === -1) {
    return { ok: false, error: `Termin ${terminKey} tidak ditemukan untuk ${candidate.fullName}.` };
  }

  const alreadyPaidBefore = installments
    .filter((i, idx) => idx !== targetIdx && i.status === "PAID")
    .reduce((acc, i) => acc + i.amount, 0);

  const currentTotalFee = candidate.sponsorCommission || 0;
  const remainingBefore = Math.max(0, currentTotalFee - alreadyPaidBefore);

  if (cleanAmount > remainingBefore && !meta.autoAdjustCommissionIfExceeded) {
    return {
      ok: false,
      error: `Nominal bayar Rp ${cleanAmount.toLocaleString("id-ID")} untuk ${candidate.fullName} melebihi sisa fee Rp ${remainingBefore.toLocaleString("id-ID")}. Aktifkan opsi penyesuaian Total Fee CPMI jika ingin tetap melanjutkan.`,
    };
  }

  const effectiveTotalFee =
    cleanAmount > remainingBefore && meta.autoAdjustCommissionIfExceeded
      ? alreadyPaidBefore + cleanAmount
      : currentTotalFee;

  candidate.sponsorCommission = effectiveTotalFee;

  const targetInst = installments[targetIdx];
  const targetPct =
    effectiveTotalFee > 0
      ? Math.round((cleanAmount / effectiveTotalFee) * 1000) / 10
      : 0;

  targetInst.amount = cleanAmount;
  targetInst.percentage = targetPct;
  targetInst.label = updateLabelPercentage(targetInst.label, targetPct);
  targetInst.status = "PAID";
  targetInst.paidAt = meta.paidAt;
  targetInst.paymentMethod = meta.paymentMethod;
  targetInst.receiptNumber = meta.receiptNumber;
  targetInst.approvedBy = meta.approvedBy;
  targetInst.notes = meta.notes || "";

  // Hitung ulang termin berikutnya yang masih UNPAID agar jumlah seluruh termin === effectiveTotalFee
  const remainingAfter = Math.max(0, effectiveTotalFee - (alreadyPaidBefore + cleanAmount));
  const subsequentIndices: number[] = [];
  for (let i = targetIdx + 1; i < installments.length; i++) {
    if (installments[i].status !== "PAID") {
      subsequentIndices.push(i);
    }
  }

  if (subsequentIndices.length > 0) {
    if (remainingAfter === 0) {
      for (const idx of subsequentIndices) {
        const subInst = installments[idx];
        subInst.amount = 0;
        subInst.percentage = 0;
        subInst.label = updateLabelPercentage(subInst.label, 0);
        subInst.status = "PAID";
        subInst.paidAt = meta.paidAt;
        subInst.paymentMethod = meta.paymentMethod;
        subInst.receiptNumber = meta.receiptNumber;
        subInst.approvedBy = meta.approvedBy;
        subInst.notes = `Lunas (tertutup pembayaran custom ${getTerminShortTitle(terminKey)})`;
      }
    } else {
      const totalWeight = subsequentIndices.reduce(
        (acc, idx) => acc + (DEFAULT_TERMIN_WEIGHTS[installments[idx].terminKey] || 1),
        0
      );
      let distributed = 0;
      subsequentIndices.forEach((instIdx, pos) => {
        const subInst = installments[instIdx];
        const isLast = pos === subsequentIndices.length - 1;
        const w = DEFAULT_TERMIN_WEIGHTS[subInst.terminKey] || 1;
        const newAmt = isLast
          ? Math.max(0, remainingAfter - distributed)
          : Math.round((remainingAfter * w) / totalWeight);
        distributed += newAmt;
        const newPct =
          effectiveTotalFee > 0
            ? Math.round((newAmt / effectiveTotalFee) * 1000) / 10
            : 0;
        subInst.amount = newAmt;
        subInst.percentage = newPct;
        subInst.label = updateLabelPercentage(subInst.label, newPct);
      });
    }
  }

  const finalUnpaid = installments
    .filter((i) => i.status !== "PAID")
    .reduce((acc, i) => acc + i.amount, 0);
  candidate.commissionPaid = finalUnpaid === 0;

  return { ok: true, installment: targetInst };
}
