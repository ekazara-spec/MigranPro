import type { DatabaseSchema } from "./db";
import type { Candidate } from "./types";

export type MasterEntityTab =
  | "KANIM"
  | "DISDUKCAPIL"
  | "CLINIC"
  | "AIRLINE"
  | "BLK"
  | "EMBASSY"
  | "AGENCY"
  | "SPONSOR"
  | "BPJS_KUR";

export interface MasterLinkCheckResult {
  canDelete: boolean;
  entityLabel: string;
  candidateCount: number;
  linkedCandidateNames: string[];
  otherLinks: string[];
  reason: string;
}

function containsNorm(haystack: string | undefined, needle: string | undefined): boolean {
  const h = (haystack || "").trim().toLowerCase();
  const n = (needle || "").trim().toLowerCase();
  if (!h || n.length < 3) return false;
  return h.includes(n);
}

function getCorePartnerName(fullName: string | undefined): string {
  if (!fullName) return "";
  return fullName.split("—")[0].split("(")[0].trim();
}

function formatBlockedReason(
  entityLabel: string,
  linkedCandidates: Candidate[],
  otherLinks: string[]
): MasterLinkCheckResult {
  const candidateCount = linkedCandidates.length;
  const linkedCandidateNames = linkedCandidates.slice(0, 5).map((c) => c.fullName);

  if (candidateCount === 0 && otherLinks.length === 0) {
    return {
      canDelete: true,
      entityLabel,
      candidateCount: 0,
      linkedCandidateNames: [],
      otherLinks: [],
      reason: "",
    };
  }

  const parts: string[] = [];
  if (candidateCount > 0) {
    const sampleNames = linkedCandidateNames.join(", ");
    const suffix = candidateCount > 5 ? `, +${candidateCount - 5} lainnya` : "";
    parts.push(`${candidateCount} data CPMI/PMI (${sampleNames}${suffix})`);
  }
  if (otherLinks.length > 0) {
    parts.push(otherLinks.join(", "));
  }

  return {
    canDelete: false,
    entityLabel,
    candidateCount,
    linkedCandidateNames,
    otherLinks,
    reason: `KEAMANAN DATA: Master data "${entityLabel}" tidak dapat dihapus karena masih terhubung dengan ${parts.join(
      " serta "
    )}. Lepas atau pindahkan relasi data di modul CPMI/PMI terlebih dahulu.`,
  };
}

/**
 * Evaluates whether a master entity can be safely deleted by checking links
 * in CPMI/PMI records and related operational modules.
 */
export function checkMasterEntityDeletionLinks(
  db: Pick<
    DatabaseSchema,
    | "candidates"
    | "sponsors"
    | "sponsorSubmissions"
    | "cashAdvances"
    | "cashJournals"
    | "foreignAgencies"
    | "vacancies"
    | "employerInterviews"
    | "syarikahInvoices"
    | "bpjsFinancingPartners"
    | "masterImmigrationOffices"
    | "masterDisdukcapil"
    | "masterMedicalClinics"
    | "masterAirlines"
    | "masterBlkLn"
    | "masterEmbassies"
  >,
  entityType: MasterEntityTab | string,
  id: string
): MasterLinkCheckResult {
  const candidates = db.candidates || [];

  if (entityType === "SPONSOR") {
    const sp = (db.sponsors || []).find((x) => x.id === id);
    const label = sp ? `${sp.name} (${sp.code})` : id;
    const linkedCandidates = candidates.filter(
      (c) =>
        c.sponsorId === id ||
        (sp?.name && containsNorm(c.registrationForm?.sponsorOfficerName, sp.name))
    );
    const otherLinks: string[] = [];
    const submissionsCount = (db.sponsorSubmissions || []).filter(
      (s) => s.sponsorId === id
    ).length;
    if (submissionsCount > 0) {
      otherLinks.push(`${submissionsCount} form pendaftaran sponsor`);
    }
    const kasbonCount = (db.cashAdvances || []).filter(
      (a) =>
        a.borrowerId === id ||
        (a.borrowerType === "SPONSOR" && sp?.name && containsNorm(a.borrowerName, sp.name))
    ).length;
    if (kasbonCount > 0) {
      otherLinks.push(`${kasbonCount} catatan kasbon`);
    }
    return formatBlockedReason(label, linkedCandidates, otherLinks);
  }

  if (entityType === "BPJS_KUR") {
    const bp = (db.bpjsFinancingPartners || []).find((x) => x.id === id);
    const label = bp ? `${bp.name} (${bp.code})` : id;
    const coreName = getCorePartnerName(bp?.name);
    const linkedCandidates = candidates.filter((c) => {
      if (!bp) return false;
      const fundingMatch =
        containsNorm(c.finance?.fundingBankOrAgency, bp.name) ||
        containsNorm(c.finance?.fundingBankOrAgency, coreName) ||
        containsNorm(c.finance?.fundingBankOrAgency, bp.code);
      const costMatch = (c.finance?.costItems || []).some(
        (ci) =>
          containsNorm(ci.vendorName, bp.name) ||
          containsNorm(ci.vendorName, coreName)
      );
      const docMatch = (c.documents || []).some(
        (d) =>
          containsNorm(d.issuedBy, bp.name) ||
          containsNorm(d.issuedBy, coreName) ||
          containsNorm(d.issuedBy, bp.code)
      );
      return fundingMatch || costMatch || docMatch;
    });
    const otherLinks: string[] = [];
    const journalCount =
      coreName.length >= 6
        ? (db.cashJournals || []).filter(
            (j) =>
              containsNorm(j.recipientOrPayer, coreName) ||
              containsNorm(j.description, coreName)
          ).length
        : 0;
    if (journalCount > 0) {
      otherLinks.push(`${journalCount} transaksi jurnal kas`);
    }
    return formatBlockedReason(label, linkedCandidates, otherLinks);
  }

  if (entityType === "AGENCY") {
    const agn = (db.foreignAgencies || []).find((x) => x.id === id);
    const label = agn ? `${agn.name} (${agn.code})` : id;
    const coreName = getCorePartnerName(agn?.name);
    const linkedCandidates = candidates.filter((c) => {
      if (!agn) return false;
      return (
        c.agencyPartner === agn.name ||
        containsNorm(c.agencyPartner, coreName) ||
        containsNorm(c.employerName, coreName)
      );
    });
    const otherLinks: string[] = [];
    const vacancyCount = (db.vacancies || []).filter(
      (v) =>
        agn &&
        (v.agencyPartner === agn.name ||
          containsNorm(v.agencyPartner, coreName) ||
          containsNorm(v.employerName, coreName))
    ).length;
    if (vacancyCount > 0) {
      otherLinks.push(`${vacancyCount} lowongan job order`);
    }
    const interviewCount = (db.employerInterviews || []).filter(
      (i) =>
        agn &&
        (i.syarikahName === agn.name || containsNorm(i.syarikahName, coreName))
    ).length;
    if (interviewCount > 0) {
      otherLinks.push(`${interviewCount} jadwal wawancara majikan`);
    }
    const invoiceCount = (db.syarikahInvoices || []).filter(
      (inv) =>
        agn &&
        (inv.syarikahName === agn.name || containsNorm(inv.syarikahName, coreName))
    ).length;
    if (invoiceCount > 0) {
      otherLinks.push(`${invoiceCount} invoice wakalah`);
    }
    return formatBlockedReason(label, linkedCandidates, otherLinks);
  }

  if (entityType === "KANIM") {
    const item = (db.masterImmigrationOffices || []).find((x) => x.id === id);
    const label = item ? `${item.name} (${item.code})` : id;
    const cityKeyword = (item?.city || "").replace(/^(Kab\.|Kota)\s+/i, "").trim();
    const linkedCandidates = candidates.filter(
      (c) =>
        item &&
        (c.documents || []).some(
          (d) =>
            d.docType === "PASPOR" &&
            (containsNorm(d.issuedBy, item.name) ||
              containsNorm(d.issuedBy, item.code) ||
              (cityKeyword.length >= 4 &&
                containsNorm(d.issuedBy, "imigrasi") &&
                containsNorm(d.issuedBy, cityKeyword)))
        )
    );
    return formatBlockedReason(label, linkedCandidates, []);
  }

  if (entityType === "DISDUKCAPIL") {
    const item = (db.masterDisdukcapil || []).find((x) => x.id === id);
    const label = item ? `${item.officeName} (${item.code})` : id;
    const cityKeyword = (item?.regencyCity || "").replace(/^(Kab\.|Kota)\s+/i, "").trim();
    const linkedCandidates = candidates.filter(
      (c) =>
        item &&
        (c.documents || []).some(
          (d) =>
            ["KTP", "KK", "AKTA_IJAZAH", "IZIN_KELUARGA"].includes(d.docType) &&
            (containsNorm(d.issuedBy, item.officeName) ||
              containsNorm(d.issuedBy, item.code) ||
              (cityKeyword.length >= 4 &&
                containsNorm(d.issuedBy, "dukcapil") &&
                containsNorm(d.issuedBy, cityKeyword)))
        )
    );
    return formatBlockedReason(label, linkedCandidates, []);
  }

  if (entityType === "CLINIC") {
    const item = (db.masterMedicalClinics || []).find((x) => x.id === id);
    const label = item ? `${item.name} (${item.code})` : id;
    const linkedCandidates = candidates.filter(
      (c) =>
        item &&
        ((c.documents || []).some(
          (d) =>
            d.docType === "MEDICAL" &&
            (containsNorm(d.issuedBy, item.name) ||
              containsNorm(d.issuedBy, item.wafidCode) ||
              containsNorm(d.issuedBy, item.code))
        ) ||
          (c.finance?.costItems || []).some((ci) =>
            containsNorm(ci.vendorName, item.name)
          ))
    );
    return formatBlockedReason(label, linkedCandidates, []);
  }

  if (entityType === "AIRLINE") {
    const item = (db.masterAirlines || []).find((x) => x.id === id);
    const label = item ? `${item.name} (${item.iataCode})` : id;
    const linkedCandidates = candidates.filter(
      (c) =>
        item &&
        ((c.documents || []).some(
          (d) =>
            d.docType === "TIKET_EKTKLN" &&
            (containsNorm(d.issuedBy, item.name) ||
              (item.iataCode && containsNorm(d.issuedBy, `(${item.iataCode})`)))
        ) ||
          containsNorm(c.flightInfo, item.name))
    );
    return formatBlockedReason(label, linkedCandidates, []);
  }

  if (entityType === "BLK") {
    const item = (db.masterBlkLn || []).find((x) => x.id === id);
    const label = item ? `${item.name} (${item.code})` : id;
    const linkedCandidates = candidates.filter(
      (c) =>
        item &&
        (containsNorm(c.training?.blkLocation, item.name) ||
          containsNorm(c.training?.blkLocation, item.vinKemnaker) ||
          (c.documents || []).some(
            (d) =>
              d.docType === "SERTIFIKAT_KOMPETENSI" &&
              (containsNorm(d.issuedBy, item.name) ||
                containsNorm(d.issuedBy, item.vinKemnaker) ||
                containsNorm(d.issuedBy, item.code))
          ))
    );
    return formatBlockedReason(label, linkedCandidates, []);
  }

  if (entityType === "EMBASSY") {
    const item = (db.masterEmbassies || []).find((x) => x.id === id);
    const label = item ? `${item.name} (${item.code})` : id;
    const linkedCandidates = candidates.filter(
      (c) =>
        item &&
        (c.documents || []).some(
          (d) =>
            d.docType === "VISA" &&
            (containsNorm(d.issuedBy, item.name) ||
              containsNorm(d.issuedBy, item.code))
        )
    );
    return formatBlockedReason(label, linkedCandidates, []);
  }

  return {
    canDelete: true,
    entityLabel: id,
    candidateCount: 0,
    linkedCandidateNames: [],
    otherLinks: [],
    reason: "",
  };
}
