import { NextRequest, NextResponse } from "next/server";
import {
  buildDefaultFinanceForCandidate,
  buildDefaultTrainingForCandidate,
  getDaysRemaining,
  readDb,
  resetDbToSeed,
  validateStageTransition,
  writeDb,
} from "@/lib/db";
import {
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
  CostCategory,
  DestinationCountry,
  DOC_TEMPLATE_CONFIG,
  ForeignAgency,
  FundingScheme,
  JobVacancy,
  JourneyStage,
  MedicalClinicPartner,
  Sponsor,
  StaffAccount,
  UserRole,
} from "@/lib/types";

function nowTimestamp(): string {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const hh = String(now.getHours()).padStart(2, "0");
  const min = String(now.getMinutes()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd} ${hh}:${min} WIB`;
}

export async function GET() {
  const db = readDb();
  return NextResponse.json(db);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      action,
      actorName = "Admin Pusat (Rina)",
      actorRole = "ADMIN_PUSAT",
      branchName = "Kantor Pusat Jakarta",
    } = body;
    const db = readDb();

    if (action === "RESET_DEMO_DATA") {
      const fresh = resetDbToSeed();
      return NextResponse.json({ ok: true, db: fresh });
    }

    // 1. AUTENTIKASI LOGIN MULTI-USER STAF
    if (action === "LOGIN_STAFF") {
      const { email, pinCode } = body.payload;
      const staff = db.staffAccounts.find(
        (s) => s.email.toLowerCase() === String(email).toLowerCase().trim()
      );
      if (!staff) {
        return NextResponse.json(
          { ok: false, error: "Akun staf tidak ditemukan." },
          { status: 404 }
        );
      }
      if (!staff.active) {
        return NextResponse.json(
          { ok: false, error: "Akun staf ini sedang dinonaktifkan oleh Direktur/Admin." },
          { status: 403 }
        );
      }
      if (staff.pinCode !== String(pinCode).trim()) {
        return NextResponse.json(
          { ok: false, error: "PIN / Kata Sandi salah. Gunakan PIN demo: 1234" },
          { status: 401 }
        );
      }

      const staffBranch =
        staff.branchId === "ALL"
          ? "Kantor Pusat Jakarta"
          : db.branches.find((b) => b.id === staff.branchId)?.name || "Cabang";

      db.auditLogs.unshift({
        id: `aud-${Date.now()}`,
        actorName: staff.name,
        actorRole: staff.role,
        branchName: staffBranch,
        actionType: "USER_LOGIN",
        summary: `Login ke Command Center PASMigranPro sebagai ${staff.roleLabel}`,
        details: `Email: ${staff.email} · Akses Cabang: ${staffBranch}`,
        timestamp: nowTimestamp(),
      });
      writeDb(db);
      return NextResponse.json({ ok: true, staff, db });
    }

    // 2. MANAJEMEN STAF BARU
    if (action === "CREATE_STAFF") {
      const { name, email, role, branchId, phone, pinCode = "1234" } = body.payload;
      const roleLabels: Record<UserRole, string> = {
        DIREKTUR: "Direktur Utama (Akses Penuh)",
        ADMIN_PUSAT: "Admin Operasional & Keuangan Pusat",
        STAF_DOKUMEN: "Staf Dokumen, Medical & Visa",
        KEPALA_CABANG: "Kepala Cabang Daerah",
        PEREKRUT_PL: "Perekrut / Sponsor Lapangan (PL)",
      };
      const newStaff: StaffAccount = {
        id: `stf-${Date.now()}`,
        name: String(name).trim(),
        email: String(email).trim().toLowerCase(),
        role: role as UserRole,
        roleLabel: roleLabels[role as UserRole] || role,
        branchId: branchId || "ALL",
        phone: phone || "-",
        active: true,
        pinCode: String(pinCode || "1234"),
      };
      db.staffAccounts.push(newStaff);
      writeDb(db);
      return NextResponse.json({ ok: true, staff: newStaff, db });
    }

    // 3. MODUL KEUANGAN: PEMBAYARAN FEE SPONSOR BERTAHAP (DP1, DP2, DP3, PELUNASAN)
    if (action === "PAY_SPONSOR_TERMIN") {
      const {
        candidateId,
        terminKey,
        paymentMethod = "Transfer Bank BRI",
        notes = "",
        forceOverride = false,
      } = body.payload;

      const candidate = db.candidates.find((c) => c.id === candidateId);
      if (!candidate || !candidate.finance) {
        return NextResponse.json(
          { ok: false, error: "Data kandidat / keuangan tidak ditemukan." },
          { status: 404 }
        );
      }

      const inst = candidate.finance.sponsorInstallments.find(
        (i) => i.terminKey === terminKey
      );
      if (!inst) {
        return NextResponse.json(
          { ok: false, error: "Termin komisi tidak ditemukan." },
          { status: 404 }
        );
      }

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
      const curIdx = stageOrder.indexOf(candidate.stage);
      const reqIdx = stageOrder.indexOf(inst.requiredStage);

      // Validasi urutan termin sebelumnya
      const terminOrder = ["DP1", "DP2", "DP3", "PELUNASAN"];
      const tIdx = terminOrder.indexOf(terminKey);
      if (tIdx > 0) {
        const prevTermin = candidate.finance.sponsorInstallments[tIdx - 1];
        if (prevTermin && prevTermin.status !== "PAID") {
          return NextResponse.json(
            {
              ok: false,
              error: `Termin sebelumnya (${prevTermin.terminKey}) wajib dicairkan terlebih dahulu sebelum mencairkan ${terminKey}.`,
            },
            { status: 400 }
          );
        }
      }

      if (curIdx < reqIdx && !forceOverride) {
        return NextResponse.json(
          {
            ok: false,
            stageWarning: true,
            error: `Peringatan Kendali Keuangan: Tahap ${candidate.fullName} saat ini baru "${candidate.stage}", sedangkan syarat pencairan ${inst.label} adalah tahap "${inst.requiredStage}". Gunakan Otorisasi Direktur jika tetap ingin mencairkan lebih awal.`,
          },
          { status: 422 }
        );
      }

      const today = nowTimestamp().split(" ")[0];
      const receiptNo = `KW-PAS/${terminKey}/2026/${String(Date.now()).slice(-4)}`;
      inst.status = "PAID";
      inst.paidAt = today;
      inst.paymentMethod = paymentMethod;
      inst.receiptNumber = receiptNo;
      inst.approvedBy = actorName;
      inst.notes = notes;

      const sponsorName =
        db.sponsors.find((s) => s.id === candidate.sponsorId)?.name || "Sponsor PL";

      db.auditLogs.unshift({
        id: `aud-${Date.now()}`,
        candidateId: candidate.id,
        candidateName: candidate.fullName,
        actorName,
        actorRole: actorRole as UserRole,
        branchName,
        actionType: "FINANCE_PAYMENT",
        summary: `Mencairkan Komisi Sponsor ${inst.terminKey} (Rp ${inst.amount.toLocaleString("id-ID")}) kepada ${sponsorName} untuk CPMI ${candidate.fullName}`,
        details: `No Kwitansi: ${receiptNo} · Metode: ${paymentMethod}${
          forceOverride ? " [Otorisasi Khusus Sebelum Tahap]" : ""
        }`,
        timestamp: nowTimestamp(),
      });

      writeDb(db);
      return NextResponse.json({ ok: true, installment: inst, candidate, db });
    }

    // 4. MODUL KEUANGAN: UPDATE KOMPONEN BIAYA PENEMPATAN (HPP) & PENDAPATAN/KUR PMI
    if (action === "UPDATE_COST_ITEM") {
      const { candidateId, costItemId, status, amount, vendorName } = body.payload;
      const candidate = db.candidates.find((c) => c.id === candidateId);
      if (!candidate || !candidate.finance) {
        return NextResponse.json({ ok: false, error: "Kandidat tidak ditemukan." }, { status: 404 });
      }
      const item = candidate.finance.costItems.find((ci) => ci.id === costItemId);
      if (!item) {
        return NextResponse.json({ ok: false, error: "Komponen biaya tidak ditemukan." }, { status: 404 });
      }

      if (status !== undefined) {
        item.status = status;
        item.paidDate = status === "PAID" ? nowTimestamp().split(" ")[0] : undefined;
      }
      if (amount !== undefined) item.amount = Number(amount);
      if (vendorName !== undefined) item.vendorName = vendorName;

      db.auditLogs.unshift({
        id: `aud-${Date.now()}`,
        candidateId: candidate.id,
        candidateName: candidate.fullName,
        actorName,
        actorRole: actorRole as UserRole,
        branchName,
        actionType: "FINANCE_PAYMENT",
        summary: `Memperbarui komponen HPP "${item.title}" (${candidate.fullName}) — Status: ${item.status} (Rp ${item.amount.toLocaleString("id-ID")})`,
        timestamp: nowTimestamp(),
      });

      writeDb(db);
      return NextResponse.json({ ok: true, candidate, db });
    }

    if (action === "ADD_COST_ITEM") {
      const { candidateId, category = "LAINNYA", title, amount, vendorName, status = "PAID" } =
        body.payload;
      const candidate = db.candidates.find((c) => c.id === candidateId);
      if (!candidate || !candidate.finance) {
        return NextResponse.json({ ok: false, error: "Kandidat tidak ditemukan." }, { status: 404 });
      }
      candidate.finance.costItems.push({
        id: `cost-${Date.now()}`,
        category: category as CostCategory,
        title: String(title).trim(),
        amount: Number(amount) || 0,
        status: status as "PAID" | "PENDING",
        paidDate: status === "PAID" ? nowTimestamp().split(" ")[0] : undefined,
        vendorName: vendorName || "Vendor Rekanan",
      });
      writeDb(db);
      return NextResponse.json({ ok: true, candidate, db });
    }

    if (action === "UPDATE_FINANCE_SCHEME") {
      const {
        candidateId,
        fundingScheme,
        fundingBankOrAgency,
        agencyFeeRevenue,
        revenueReceived,
        kurStatus,
      } = body.payload;
      const candidate = db.candidates.find((c) => c.id === candidateId);
      if (!candidate || !candidate.finance) {
        return NextResponse.json({ ok: false, error: "Kandidat tidak ditemukan." }, { status: 404 });
      }

      if (fundingScheme !== undefined)
        candidate.finance.fundingScheme = fundingScheme as FundingScheme;
      if (fundingBankOrAgency !== undefined)
        candidate.finance.fundingBankOrAgency = fundingBankOrAgency;
      if (agencyFeeRevenue !== undefined) {
        candidate.finance.agencyFeeRevenue = Number(agencyFeeRevenue);
        candidate.placementFee = Number(agencyFeeRevenue);
      }
      if (revenueReceived !== undefined)
        candidate.finance.revenueReceived = Number(revenueReceived);
      if (kurStatus !== undefined) candidate.finance.kurStatus = kurStatus;

      db.auditLogs.unshift({
        id: `aud-${Date.now()}`,
        candidateId: candidate.id,
        candidateName: candidate.fullName,
        actorName,
        actorRole: actorRole as UserRole,
        branchName,
        actionType: "FINANCE_PAYMENT",
        summary: `Memperbarui Skema Pembiayaan & Penerimaan Fee ${candidate.fullName}`,
        details: `Skema: ${candidate.finance.fundingScheme} · Diterima: Rp ${candidate.finance.revenueReceived.toLocaleString("id-ID")} dari Rp ${candidate.finance.agencyFeeRevenue.toLocaleString("id-ID")}`,
        timestamp: nowTimestamp(),
      });

      writeDb(db);
      return NextResponse.json({ ok: true, candidate, db });
    }

    // 5. MODUL PELATIHAN BLK-LN & ASRAMA
    if (action === "UPDATE_TRAINING") {
      const {
        candidateId,
        attendancePct,
        languageScore,
        skillScore,
        examStatus,
        instructorNotes,
      } = body.payload;
      const candidate = db.candidates.find((c) => c.id === candidateId);
      if (!candidate) {
        return NextResponse.json({ ok: false, error: "Kandidat tidak ditemukan." }, { status: 404 });
      }
      if (!candidate.training) {
        candidate.training = buildDefaultTrainingForCandidate(candidate);
      }
      if (attendancePct !== undefined) candidate.training.attendancePct = Number(attendancePct);
      if (languageScore !== undefined) candidate.training.languageScore = Number(languageScore);
      if (skillScore !== undefined) candidate.training.skillScore = Number(skillScore);
      if (examStatus !== undefined) candidate.training.examStatus = examStatus;
      if (instructorNotes !== undefined) candidate.training.instructorNotes = instructorNotes;

      db.auditLogs.unshift({
        id: `aud-${Date.now()}`,
        candidateId: candidate.id,
        candidateName: candidate.fullName,
        actorName,
        actorRole: actorRole as UserRole,
        branchName,
        actionType: "TRAINING_UPDATED",
        summary: `Memperbarui nilai pelatihan BLK-LN ${candidate.fullName} — Status Ujian: ${candidate.training.examStatus}`,
        details: `Bahasa: ${candidate.training.languageScore} · Keterampilan: ${candidate.training.skillScore} · Kehadiran: ${candidate.training.attendancePct}%`,
        timestamp: nowTimestamp(),
      });

      writeDb(db);
      return NextResponse.json({ ok: true, candidate, db });
    }

    // 6. PENANGANAN KASUS & PENGADUAN PMI
    if (action === "CREATE_CASE") {
      const {
        candidateId,
        category = "LAINNYA",
        priority = "HIGH",
        title,
        description,
        picName = "Rina Kartika (Admin Pusat)",
        escalatedTo = "",
        targetResolutionDate,
        reportedBy = "Laporan Internal Staf",
      } = body.payload;

      const candidate = db.candidates.find((c) => c.id === candidateId);
      if (!candidate) {
        return NextResponse.json(
          { ok: false, error: "Data PMI/CPMI tidak ditemukan." },
          { status: 404 }
        );
      }

      const today = nowTimestamp().split(" ")[0];
      const newCase: CaseTicket = {
        id: `case-${Date.now()}`,
        ticketNumber: `CASE-2026-${String(db.cases.length + 20).padStart(4, "0")}`,
        candidateId: candidate.id,
        candidateName: candidate.fullName,
        candidateNik: candidate.nik,
        branchId: candidate.branchId,
        destinationCountry: candidate.destinationCountry,
        employerName: candidate.employerName,
        category: category as CaseCategory,
        priority: priority as CasePriority,
        status: escalatedTo ? "ESCALATED" : "OPEN",
        title: String(title).trim(),
        description: String(description).trim(),
        picName,
        escalatedTo: escalatedTo || undefined,
        targetResolutionDate: targetResolutionDate || today,
        reportedBy,
        createdAt: today,
        updatedAt: today,
        timeline: [
          {
            id: `cn-${Date.now()}`,
            authorName: reportedBy,
            authorRole: actorRole,
            note: `Tiket pengaduan dibuka: ${title}. ${description}`,
            createdAt: nowTimestamp(),
          },
        ],
      };

      db.cases.unshift(newCase);
      db.auditLogs.unshift({
        id: `aud-${Date.now()}`,
        candidateId: candidate.id,
        candidateName: candidate.fullName,
        actorName,
        actorRole: actorRole as UserRole,
        branchName,
        actionType: "CASE_UPDATED",
        summary: `Membuka tiket penanganan kasus ${newCase.ticketNumber} (${newCase.priority}) untuk ${candidate.fullName}`,
        details: `${newCase.title} · Pelapor: ${reportedBy}`,
        timestamp: nowTimestamp(),
      });

      writeDb(db);
      return NextResponse.json({ ok: true, caseTicket: newCase, db });
    }

    if (action === "ADD_CASE_NOTE") {
      const { caseId, note, newStatus, escalatedTo } = body.payload;
      const cTicket = db.cases.find((c) => c.id === caseId);
      if (!cTicket) {
        return NextResponse.json(
          { ok: false, error: "Tiket kasus tidak ditemukan." },
          { status: 404 }
        );
      }

      if (newStatus) {
        cTicket.status = newStatus as CaseStatus;
        if (newStatus === "RESOLVED") {
          cTicket.resolvedAt = nowTimestamp().split(" ")[0];
        }
      }
      if (escalatedTo !== undefined && escalatedTo !== "") {
        cTicket.escalatedTo = escalatedTo;
      }
      cTicket.updatedAt = nowTimestamp().split(" ")[0];

      cTicket.timeline.push({
        id: `cn-${Date.now()}`,
        authorName: actorName,
        authorRole: actorRole,
        note: String(note).trim(),
        createdAt: nowTimestamp(),
      });

      db.auditLogs.unshift({
        id: `aud-${Date.now()}`,
        candidateId: cTicket.candidateId,
        candidateName: cTicket.candidateName,
        actorName,
        actorRole: actorRole as UserRole,
        branchName,
        actionType: "CASE_UPDATED",
        summary: `Menambahkan tindak lanjut pada kasus ${cTicket.ticketNumber} (${cTicket.candidateName}) — Status: ${cTicket.status}`,
        details: note,
        timestamp: nowTimestamp(),
      });

      writeDb(db);
      return NextResponse.json({ ok: true, caseTicket: cTicket, db });
    }

    // 7. PUBLIKASI LOWONGAN (VACANCY) & PELAMAR MASUK JADI LEAD
    if (action === "CREATE_VACANCY") {
      const {
        title,
        destinationCountry,
        jobSector,
        agencyPartner,
        employerName,
        salaryForeign,
        salaryIdrEstimate,
        placementFee,
        quotaTotal,
        genderPref = "P/L",
        minEducation = "SMP / SMA",
        ageRange = "21 - 40 Tahun",
        requirementsText = "",
        closingDate,
      } = body.payload;

      const today = nowTimestamp().split(" ")[0];
      const newVac: JobVacancy = {
        id: `vac-${Date.now()}`,
        code: `JOB-2026-0${db.vacancies.length + 5}`,
        title: String(title).trim(),
        destinationCountry,
        jobSector: String(jobSector).trim(),
        agencyPartner: String(agencyPartner).trim(),
        employerName: String(employerName || "Verified Partner Employer").trim(),
        salaryForeign: String(salaryForeign).trim(),
        salaryIdrEstimate: Number(salaryIdrEstimate) || 12000000,
        placementFee: Number(placementFee) || 30000000,
        quotaTotal: Number(quotaTotal) || 20,
        quotaFilled: 0,
        genderPref,
        minEducation,
        ageRange,
        requirements: String(requirementsText)
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean),
        isPublished: true,
        closingDate: closingDate || today,
        createdAt: today,
      };

      db.vacancies.unshift(newVac);
      writeDb(db);
      return NextResponse.json({ ok: true, vacancy: newVac, db });
    }

    if (action === "TOGGLE_VACANCY_PUBLISH") {
      const { vacancyId } = body.payload;
      const vac = db.vacancies.find((v) => v.id === vacancyId);
      if (vac) {
        vac.isPublished = !vac.isPublished;
        writeDb(db);
      }
      return NextResponse.json({ ok: true, db });
    }

    if (action === "APPLY_VACANCY_PUBLIC") {
      const {
        vacancyId,
        fullName,
        phone,
        nik,
        branchId = "br-idm",
        gender = "P",
        sponsorId = "sp-1",
      } = body.payload;
      const vac = db.vacancies.find((v) => v.id === vacancyId);
      if (!vac) {
        return NextResponse.json(
          { ok: false, error: "Lowongan tidak ditemukan." },
          { status: 404 }
        );
      }

      const cleanNik = nik ? String(nik).trim() : undefined;
      if (cleanNik) {
        if (!/^\d{16}$/.test(cleanNik)) {
          return NextResponse.json(
            { ok: false, error: "NIK harus 16 digit angka." },
            { status: 400 }
          );
        }
        const dup = db.candidates.find((c) => c.nik === cleanNik);
        if (dup) {
          return NextResponse.json(
            {
              ok: false,
              duplicateNik: true,
              existingCandidate: dup,
              error: `NIK ${cleanNik} sudah terdaftar atas nama ${dup.fullName} (${dup.regNumber}). Silakan login di Portal Mandiri CPMI.`,
            },
            { status: 409 }
          );
        }
      }

      const id = `cpmi-${Date.now()}`;
      const regNum = `P3MI-2026-${String(db.candidates.length + 101).padStart(4, "0")}`;
      const today = nowTimestamp().split(" ")[0];

      const newCandidate: Candidate = {
        id,
        regNumber: regNum,
        nik: cleanNik,
        fullName: String(fullName).trim(),
        gender,
        phone: String(phone).trim(),
        destinationCountry: vac.destinationCountry,
        jobSector: vac.jobSector,
        employerName: vac.employerName,
        agencyPartner: vac.agencyPartner,
        vacancyId: vac.id,
        stage: "LEAD",
        specialStatus: "NORMAL",
        placementFee: vac.placementFee,
        costIncurred: 0,
        sponsorCommission: 4500000,
        commissionPaid: false,
        branchId,
        sponsorId,
        portalPin: cleanNik ? cleanNik.slice(-6) : "123456",
        createdAt: today,
        updatedAt: today,
        documents: DOC_TEMPLATE_CONFIG.map((tpl, idx) => ({
          id: `doc-${id}-${idx + 1}`,
          candidateId: id,
          docType: tpl.docType,
          title: tpl.title,
          isSensitive: tpl.isSensitive,
          requiredAtStage: tpl.requiredAtStage,
          status: "MISSING",
          aiCheckStatus: "UNCHECKED",
          lastReminderTier: null,
        })),
      };
      newCandidate.finance = buildDefaultFinanceForCandidate(newCandidate);
      newCandidate.training = buildDefaultTrainingForCandidate(newCandidate);

      vac.quotaFilled = Math.min(vac.quotaTotal, vac.quotaFilled + 1);
      db.candidates.unshift(newCandidate);

      db.auditLogs.unshift({
        id: `aud-${Date.now()}`,
        candidateId: newCandidate.id,
        candidateName: newCandidate.fullName,
        actorName: "Kanal Lowongan Publik",
        actorRole: "ADMIN_PUSAT",
        branchName: db.branches.find((b) => b.id === branchId)?.name || "Kantor Pusat",
        actionType: "VACANCY_APPLIED",
        summary: `Pelamar baru "${newCandidate.fullName}" masuk dari lowongan ${vac.code} (${vac.title})`,
        details: `Otomatis tercatat sebagai LEAD (${newCandidate.regNumber}) tanpa salin ulang data.`,
        timestamp: nowTimestamp(),
      });

      writeDb(db);
      return NextResponse.json({ ok: true, candidate: newCandidate, db });
    }

    // 8. CREATE CANDIDATE INTERNAL
    if (action === "CREATE_CANDIDATE") {
      const {
        nik,
        fullName,
        gender,
        avatarUrl,
        birthPlace,
        birthDate,
        phone,
        address,
        maritalStatus,
        education,
        destinationCountry,
        jobSector,
        employerName,
        agencyPartner,
        stage = "LEAD",
        branchId,
        sponsorId,
        placementFee = 32000000,
      } = body.payload;

      const cleanNik = nik ? String(nik).trim() : undefined;

      if (cleanNik) {
        if (!/^\d{16}$/.test(cleanNik)) {
          return NextResponse.json(
            {
              ok: false,
              error: "Format NIK tidak valid. NIK wajib terdiri dari tepat 16 digit angka.",
            },
            { status: 400 }
          );
        }

        const existing = db.candidates.find((c) => c.nik === cleanNik);
        if (existing) {
          const existingBranch =
            db.branches.find((b) => b.id === existing.branchId)?.name || existing.branchId;

          db.auditLogs.unshift({
            id: `aud-${Date.now()}`,
            candidateId: existing.id,
            candidateName: existing.fullName,
            actorName,
            actorRole: actorRole as UserRole,
            branchName,
            actionType: "NIK_DUPLICATE_BLOCKED",
            summary: `Pendaftaran ganda ditolak untuk NIK ${cleanNik} (${fullName})`,
            details: `NIK sudah terdaftar atas nama ${existing.fullName} (${existing.regNumber}) di ${existingBranch} pada tahap ${existing.stage}.`,
            timestamp: nowTimestamp(),
          });
          writeDb(db);

          return NextResponse.json(
            {
              ok: false,
              duplicateNik: true,
              existingCandidate: existing,
              existingBranchName: existingBranch,
              error: `NIK ${cleanNik} sudah terdaftar di sistem atas nama "${existing.fullName}" (${existing.regNumber} - ${existingBranch}). Sistem menolak membuat berkas ganda.`,
            },
            { status: 409 }
          );
        }
      } else if (stage !== "LEAD") {
        return NextResponse.json(
          {
            ok: false,
            error: "Untuk pendaftaran langsung ke tahap selain Lead, NIK 16 digit wajib diisi.",
          },
          { status: 400 }
        );
      }

      const id = `cpmi-${Date.now()}`;
      const regNum = `P3MI-2026-${String(db.candidates.length + 101).padStart(4, "0")}`;
      const today = nowTimestamp().split(" ")[0];
      const spObj = db.sponsors.find((s) => s.id === sponsorId);

      const newCandidate: Candidate = {
        id,
        regNumber: regNum,
        nik: cleanNik,
        fullName: fullName.trim(),
        gender: gender || "P",
        avatarUrl: avatarUrl || undefined,
        birthPlace: birthPlace || "",
        birthDate: birthDate || "",
        phone: phone || "",
        address: address || "",
        maritalStatus: maritalStatus || "Belum Kawin",
        education: education || "SMA/SMK",
        destinationCountry: destinationCountry || "Taiwan",
        jobSector: jobSector || "Caregiver",
        employerName: employerName || "",
        agencyPartner: agencyPartner || "",
        stage: stage as JourneyStage,
        specialStatus: "NORMAL",
        placementFee: Number(placementFee) || 32000000,
        costIncurred: 0,
        sponsorCommission: spObj ? spObj.commissionPerCpmi : 0,
        commissionPaid: false,
        branchId: branchId || "br-jkt",
        sponsorId: sponsorId || undefined,
        portalPin: cleanNik ? cleanNik.slice(-6) : "123456",
        createdAt: today,
        updatedAt: today,
        documents: DOC_TEMPLATE_CONFIG.map((tpl, idx) => ({
          id: `doc-${id}-${idx + 1}`,
          candidateId: id,
          docType: tpl.docType,
          title: tpl.title,
          isSensitive: tpl.isSensitive,
          requiredAtStage: tpl.requiredAtStage,
          status: "MISSING",
          aiCheckStatus: "UNCHECKED",
          lastReminderTier: null,
        })),
      };
      newCandidate.finance = buildDefaultFinanceForCandidate(newCandidate);
      newCandidate.training = buildDefaultTrainingForCandidate(newCandidate);

      db.candidates.unshift(newCandidate);
      db.auditLogs.unshift({
        id: `aud-${Date.now()}`,
        candidateId: newCandidate.id,
        candidateName: newCandidate.fullName,
        actorName,
        actorRole: actorRole as UserRole,
        branchName,
        actionType: "CANDIDATE_CREATED",
        summary: `Mendaftarkan berkas baru ${newCandidate.fullName} (${newCandidate.regNumber}) pada tahap ${newCandidate.stage}`,
        details: cleanNik
          ? `NIK 16 digit tervalidasi unik: ${cleanNik}. Tujuan: ${newCandidate.destinationCountry}.`
          : `Terdaftar sebagai Lead lapangan (Nama & Kontak dulu, NIK menyusul).`,
        timestamp: nowTimestamp(),
      });

      writeDb(db);
      return NextResponse.json({ ok: true, candidate: newCandidate, db });
    }

    if (action === "UPDATE_CANDIDATE") {
      const { candidateId, updates } = body.payload;
      const candidate = db.candidates.find((c) => c.id === candidateId);
      if (!candidate) {
        return NextResponse.json(
          { ok: false, error: "Berkas CPMI tidak ditemukan." },
          { status: 404 }
        );
      }

      if (updates.nik !== undefined && updates.nik !== candidate.nik) {
        const cleanNik = String(updates.nik).trim();
        if (cleanNik && !/^\d{16}$/.test(cleanNik)) {
          return NextResponse.json(
            { ok: false, error: "NIK harus terdiri dari tepat 16 digit angka." },
            { status: 400 }
          );
        }
        if (cleanNik) {
          const duplicate = db.candidates.find(
            (c) => c.id !== candidateId && c.nik === cleanNik
          );
          if (duplicate) {
            return NextResponse.json(
              {
                ok: false,
                duplicateNik: true,
                existingCandidate: duplicate,
                error: `NIK ${cleanNik} sudah digunakan oleh berkas ${duplicate.fullName} (${duplicate.regNumber}).`,
              },
              { status: 409 }
            );
          }
        }
        candidate.nik = cleanNik || undefined;
        if (cleanNik) {
          candidate.portalPin = cleanNik.slice(-6);
        }
      }

      const prevSpecial = candidate.specialStatus;
      Object.assign(candidate, {
        ...updates,
        nik: candidate.nik,
        updatedAt: nowTimestamp().split(" ")[0],
      });

      if (updates.specialStatus && updates.specialStatus !== prevSpecial) {
        db.auditLogs.unshift({
          id: `aud-${Date.now()}`,
          candidateId: candidate.id,
          candidateName: candidate.fullName,
          actorName,
          actorRole: actorRole as UserRole,
          branchName,
          actionType: "SPECIAL_STATUS",
          summary: `Mengubah status jalur khusus ${candidate.fullName}: ${prevSpecial} -> ${updates.specialStatus}`,
          details: updates.statusNote || "Perubahan jalur non-linier tercatat pada berkas CPMI.",
          timestamp: nowTimestamp(),
        });
      }

      writeDb(db);
      return NextResponse.json({ ok: true, candidate, db });
    }

    if (action === "CHANGE_STAGE") {
      const { candidateId, targetStage, reason } = body.payload;
      const candidate = db.candidates.find((c) => c.id === candidateId);
      if (!candidate) {
        return NextResponse.json(
          { ok: false, error: "Berkas CPMI tidak ditemukan." },
          { status: 404 }
        );
      }

      const validation = validateStageTransition(candidate, targetStage as JourneyStage);
      if (!validation.allowed) {
        return NextResponse.json(
          {
            ok: false,
            blockers: validation.blockers,
            error:
              "Tidak dapat naik ke tahap " +
              targetStage +
              " karena syarat dokumen/tahapan belum terpenuhi.",
          },
          { status: 422 }
        );
      }

      const oldStage = candidate.stage;
      candidate.stage = targetStage as JourneyStage;
      candidate.updatedAt = nowTimestamp().split(" ")[0];

      db.auditLogs.unshift({
        id: `aud-${Date.now()}`,
        candidateId: candidate.id,
        candidateName: candidate.fullName,
        actorName,
        actorRole: actorRole as UserRole,
        branchName,
        actionType: "STAGE_CHANGE",
        summary: `Tahapan penempatan ${candidate.fullName} naik: ${oldStage} → ${targetStage}`,
        details:
          reason ||
          `Seluruh syarat dokumen wajib tahap ${targetStage} telah terverifikasi dan aktif.`,
        timestamp: nowTimestamp(),
      });

      writeDb(db);
      return NextResponse.json({ ok: true, candidate, db });
    }

    if (action === "UPDATE_DOCUMENT") {
      const {
        candidateId,
        documentId,
        status,
        docNumber,
        issuedBy,
        issueDate,
        expiryDate,
        medicalResult,
        notes,
        fileDataUrl,
        fileName,
      } = body.payload;

      const candidate = db.candidates.find((c) => c.id === candidateId);
      if (!candidate) {
        return NextResponse.json(
          { ok: false, error: "Kandidat tidak ditemukan." },
          { status: 404 }
        );
      }
      const doc = candidate.documents.find((d) => d.id === documentId);
      if (!doc) {
        return NextResponse.json(
          { ok: false, error: "Dokumen tidak ditemukan." },
          { status: 404 }
        );
      }

      if (docNumber !== undefined) doc.docNumber = docNumber;
      if (issuedBy !== undefined) doc.issuedBy = issuedBy;
      if (issueDate !== undefined) doc.issueDate = issueDate;
      if (expiryDate !== undefined) doc.expiryDate = expiryDate || undefined;
      if (medicalResult !== undefined) doc.medicalResult = medicalResult;
      if (notes !== undefined) doc.notes = notes;
      if (fileDataUrl !== undefined) doc.fileDataUrl = fileDataUrl;
      if (fileName !== undefined) doc.fileName = fileName;
      if (status !== undefined) doc.status = status;

      const daysLeft = getDaysRemaining(doc.expiryDate);
      if (daysLeft !== null && daysLeft < 0 && doc.status !== "MISSING") {
        doc.status = "EXPIRED";
      }

      if (doc.status === "VERIFIED") {
        doc.verifiedBy = `${actorName}`;
        doc.verifiedAt = nowTimestamp().split(" ")[0];
      }

      if (daysLeft !== null && daysLeft > 60) {
        const task = db.renewalTasks.find(
          (t) => t.candidateId === candidate.id && t.documentId === doc.id
        );
        if (task) {
          task.status = "COMPLETED";
          task.completedAt = nowTimestamp();
          task.daysLeft = daysLeft;
          task.dueDate = doc.expiryDate!;
        }
      }

      candidate.updatedAt = nowTimestamp().split(" ")[0];

      db.auditLogs.unshift({
        id: `aud-${Date.now()}`,
        candidateId: candidate.id,
        candidateName: candidate.fullName,
        actorName,
        actorRole: actorRole as UserRole,
        branchName,
        actionType: doc.status === "VERIFIED" ? "DOC_VERIFIED" : "DOC_UPLOADED",
        summary: `Memperbarui dokumen "${doc.title}" milik ${candidate.fullName} (Status: ${doc.status})`,
        details: `No: ${doc.docNumber || "-"} | Berlaku s/d: ${doc.expiryDate || "Tidak diisi"}`,
        timestamp: nowTimestamp(),
      });

      writeDb(db);
      return NextResponse.json({ ok: true, candidate, db });
    }

    if (action === "RUN_AI_CHECK") {
      const { candidateId, documentId } = body.payload;
      const candidate = db.candidates.find((c) => c.id === candidateId);
      if (!candidate) {
        return NextResponse.json(
          { ok: false, error: "Kandidat tidak ditemukan." },
          { status: 404 }
        );
      }
      const doc = candidate.documents.find((d) => d.id === documentId);
      if (!doc) {
        return NextResponse.json(
          { ok: false, error: "Dokumen tidak ditemukan." },
          { status: 404 }
        );
      }

      const daysLeft = getDaysRemaining(doc.expiryDate);
      let checkStatus: "MATCH" | "MISMATCH" = "MATCH";
      const notesList: string[] = [];

      if (doc.status === "MISSING") {
        checkStatus = "MISMATCH";
        notesList.push(
          "Berkas belum diunggah. Unggah berkas atau isi nomor dokumen terlebih dahulu."
        );
      } else {
        if (doc.docType === "KTP") {
          if (!candidate.nik || doc.docNumber !== candidate.nik) {
            checkStatus = "MISMATCH";
            notesList.push(
              `Nomor pada KTP (${doc.docNumber || "kosong"}) tidak sama dengan NIK profil (${
                candidate.nik || "belum diisi"
              }).`
            );
          } else {
            notesList.push(
              `OCR KTP: NIK ${candidate.nik} & Nama "${candidate.fullName}" cocok 100%.`
            );
          }
        } else if (doc.docType === "PASPOR") {
          if (!doc.expiryDate) {
            checkStatus = "MISMATCH";
            notesList.push(
              "Tanggal habis berlaku paspor belum diisi. Sistem tidak dapat memantau pengingat."
            );
          } else if (daysLeft !== null && daysLeft < 180) {
            checkStatus = "MISMATCH";
            notesList.push(
              `Peringatan MRZ Paspor: Sisa masa berlaku hanya ${daysLeft} hari (< 6 bulan). Wajib perpanjang paspor!`
            );
          } else {
            notesList.push(
              `MRZ Paspor (${doc.docNumber || "E-Passport"}) cocok dengan nama "${
                candidate.fullName
              }". Sisa berlaku ${daysLeft} hari (Aman).`
            );
          }
        } else if (doc.docType === "MEDICAL") {
          if (doc.medicalResult !== "FIT") {
            checkStatus = "MISMATCH";
            notesList.push(
              `Hasil Medical tercatat "${
                doc.medicalResult || "Belum FIT"
              }". Wajib FIT untuk penempatan.`
            );
          } else if (!doc.expiryDate) {
            checkStatus = "MISMATCH";
            notesList.push(
              "Hasil FIT terbaca, namun tanggal kedaluwarsa MCU belum diisi oleh admin."
            );
          } else if (daysLeft !== null && daysLeft <= 14) {
            checkStatus = "MISMATCH";
            notesList.push(
              `Perhatian MCU: Status FIT, tetapi masa berlaku kritis (${
                daysLeft < 0
                  ? `Sudah lewat ${Math.abs(daysLeft)} hari`
                  : `Sisa ${daysLeft} hari`
              }).`
            );
          } else {
            notesList.push(
              `Hasil Medical FIT terkonfirmasi untuk "${candidate.fullName}". Sisa masa berlaku ${daysLeft} hari.`
            );
          }
        } else {
          if (daysLeft !== null && daysLeft < 0) {
            checkStatus = "MISMATCH";
            notesList.push(`Dokumen telah kedaluwarsa pada ${doc.expiryDate}.`);
          } else {
            notesList.push(
              `Asisten AI memeriksa kecocokan nama "${candidate.fullName}" & nomor dokumen (${
                doc.docNumber || "Terlampir"
              }): Sesuai.`
            );
          }
        }
      }

      doc.aiCheckStatus = checkStatus;
      doc.aiCheckNotes = notesList.join(" ");

      db.auditLogs.unshift({
        id: `aud-${Date.now()}`,
        candidateId: candidate.id,
        candidateName: candidate.fullName,
        actorName,
        actorRole: actorRole as UserRole,
        branchName,
        actionType: "AI_VERIFICATION",
        summary: `Menjalankan Periksa Awal AI pada dokumen "${doc.title}" milik ${candidate.fullName}`,
        details: `Hasil: ${checkStatus} — ${doc.aiCheckNotes}`,
        timestamp: nowTimestamp(),
      });

      writeDb(db);
      return NextResponse.json({ ok: true, doc, candidate, db });
    }

    if (action === "LOG_SENSITIVE_VIEW") {
      const { candidateId, documentId } = body.payload;
      const candidate = db.candidates.find((c) => c.id === candidateId);
      const doc = candidate?.documents.find((d) => d.id === documentId);
      if (candidate && doc) {
        db.auditLogs.unshift({
          id: `aud-${Date.now()}`,
          candidateId: candidate.id,
          candidateName: candidate.fullName,
          actorName,
          actorRole: actorRole as UserRole,
          branchName,
          actionType: "SENSITIVE_DOC_VIEW",
          summary: `Membuka dokumen sensitif "${doc.title}" milik ${candidate.fullName}`,
          details: `No Dokumen: ${doc.docNumber || "-"} | Akses dicatat sesuai kepatuhan UU PDP.`,
          timestamp: nowTimestamp(),
        });
        writeDb(db);
      }
      return NextResponse.json({ ok: true, db });
    }

    if (action === "UPDATE_RENEWAL_TASK") {
      const { taskId, status, newExpiryDate } = body.payload;
      const task = db.renewalTasks.find((t) => t.id === taskId);
      if (!task) {
        return NextResponse.json(
          { ok: false, error: "Tugas perpanjangan tidak ditemukan." },
          { status: 404 }
        );
      }

      task.status = status;
      if (status === "COMPLETED") {
        task.completedAt = nowTimestamp();
      }

      if (newExpiryDate) {
        const candidate = db.candidates.find((c) => c.id === task.candidateId);
        const doc = candidate?.documents.find((d) => d.id === task.documentId);
        if (candidate && doc) {
          doc.expiryDate = newExpiryDate;
          doc.status = "VERIFIED";
          doc.verifiedBy = actorName;
          doc.verifiedAt = nowTimestamp().split(" ")[0];
          const dl = getDaysRemaining(newExpiryDate);
          if (dl !== null) {
            task.daysLeft = dl;
            task.dueDate = newExpiryDate;
          }
        }
      }

      db.auditLogs.unshift({
        id: `aud-${Date.now()}`,
        candidateId: task.candidateId,
        candidateName: task.candidateName,
        actorName,
        actorRole: actorRole as UserRole,
        branchName,
        actionType: "RENEWAL_TASK",
        summary: `Memperbarui tugas perpanjangan "${task.docTitle}" milik ${task.candidateName} menjadi ${status}`,
        details: newExpiryDate
          ? `Dokumen berhasil diperpanjang hingga ${newExpiryDate}.`
          : `Status tugas: ${status}.`,
        timestamp: nowTimestamp(),
      });

      writeDb(db);
      return NextResponse.json({ ok: true, db });
    }

    // 13. PROSES PERGANTIAN KANDIDAT BADIL (PRA-TERBANG / MASA GARANSI 90 HARI)
    if (action === "PROCESS_BADIL") {
      const {
        originalCandidateId,
        replacementCandidateId,
        badilType,
        reason,
        reasonNotes,
        sponsorDpTreatment,
        wakalahFeeScheme,
      } = body.payload as {
        originalCandidateId: string;
        replacementCandidateId: string;
        badilType: BadilType;
        reason: BadilReason;
        reasonNotes: string;
        sponsorDpTreatment: "CARRY_OVER_TO_REPLACEMENT" | "REFUND_CLAWBACK" | "ABSORBED_BY_P3MI";
        wakalahFeeScheme: "FULL_WAKALAH_FEE" | "FREE_WARRANTY_REPLACEMENT";
      };

      if (!originalCandidateId || !replacementCandidateId) {
        return NextResponse.json(
          { ok: false, error: "Kandidat awal dan kandidat pengganti (Badil) wajib dipilih." },
          { status: 400 }
        );
      }
      if (originalCandidateId === replacementCandidateId) {
        return NextResponse.json(
          { ok: false, error: "Kandidat pengganti (Badil) tidak boleh orang yang sama." },
          { status: 400 }
        );
      }

      const orig = db.candidates.find((c) => c.id === originalCandidateId);
      const repl = db.candidates.find((c) => c.id === replacementCandidateId);

      if (!orig || !repl) {
        return NextResponse.json(
          { ok: false, error: "Data kandidat tidak ditemukan." },
          { status: 404 }
        );
      }

      const today = nowTimestamp().split(" ")[0];
      const paidSponsorInstallments = (orig.finance?.sponsorInstallments || []).filter(
        (i) => i.status === "PAID"
      );
      const transferredDpAmt =
        sponsorDpTreatment === "CARRY_OVER_TO_REPLACEMENT"
          ? paidSponsorInstallments.reduce((acc, i) => acc + i.amount, 0)
          : 0;
      const sunkCostAmt = orig.costIncurred || 0;

      // Update Kandidat Awal (Original)
      orig.specialStatus = "REPLACED_OUT";
      if (badilType === "GARANSI_90_HARI") {
        orig.stage = "RETURNED";
        orig.returnDate = today;
      }
      // Kunci sisa termin sponsor yang belum cair pada kandidat yang batal/digantikan
      if (orig.finance && sponsorDpTreatment === "CARRY_OVER_TO_REPLACEMENT") {
        for (const inst of orig.finance.sponsorInstallments) {
          if (inst.status === "UNPAID") {
            inst.amount = 0;
            inst.status = "PAID";
            inst.notes = `Dialihkan ke Kandidat Badil: ${repl.fullName} (${repl.regNumber})`;
          }
        }
      }

      // Salin slot penempatan (Negara, Sektor, Majikan, Syarikah, Job Order) ke Kandidat Pengganti (Badil)
      repl.destinationCountry = orig.destinationCountry;
      repl.jobSector = orig.jobSector;
      repl.employerName = orig.employerName || repl.employerName;
      repl.agencyPartner = orig.agencyPartner || repl.agencyPartner;
      repl.vacancyId = orig.vacancyId || repl.vacancyId;
      repl.specialStatus = "BADIL_REPLACEMENT";
      repl.updatedAt = today;

      if (!repl.finance) {
        repl.finance = buildDefaultFinanceForCandidate(repl);
      }

      // Sesuaikan Wakalah Fee / Pendapatan Agensi untuk Badil Garansi 90 Hari vs Pra-Terbang
      if (wakalahFeeScheme === "FREE_WARRANTY_REPLACEMENT") {
        repl.placementFee = 0;
        repl.finance.agencyFeeRevenue = 0;
        repl.finance.fundingBankOrAgency = `Free Replacement (Badil Garansi <90 Hari menggantikan ${orig.fullName})`;
      } else {
        repl.placementFee = orig.placementFee;
        repl.finance.agencyFeeRevenue = orig.finance?.agencyFeeRevenue || orig.placementFee;
      }

      // Jika Carry-Over DP Sponsor aktif, tandai termin yang sudah dibayar di kandidat awal menjadi PAID di kandidat Badil
      if (
        sponsorDpTreatment === "CARRY_OVER_TO_REPLACEMENT" &&
        paidSponsorInstallments.length > 0 &&
        repl.finance.sponsorInstallments.length > 0
      ) {
        for (const paidOrigInst of paidSponsorInstallments) {
          const targetInst = repl.finance.sponsorInstallments.find(
            (ri) => ri.terminKey === paidOrigInst.terminKey
          );
          if (targetInst && targetInst.status === "UNPAID") {
            targetInst.status = "PAID";
            targetInst.paidAt = today;
            targetInst.paymentMethod = "Carry-Over Deposit Badil";
            targetInst.receiptNumber = `BDL-CARRY/${paidOrigInst.terminKey}/${orig.regNumber.slice(-4)}`;
            targetInst.approvedBy = actorName;
            targetInst.notes = `Kompensasi Carry-Over dari ${orig.fullName} (${orig.regNumber})`;
          }
        }
      }

      const badilId = `bdl-${Date.now()}`;
      const badilCode = `BDL-${orig.destinationCountry.slice(0, 2).toUpperCase()}-2026-${String(
        (db.badilRecords?.length || 0) + 1
      ).padStart(3, "0")}`;

      const newBadilRecord: BadilRecord = {
        id: badilId,
        code: badilCode,
        badilType,
        reason,
        reasonNotes:
          reasonNotes ||
          `Pergantian slot penempatan ${orig.destinationCountry} dari ${orig.fullName} ke ${repl.fullName}.`,
        originalCandidateId: orig.id,
        originalCandidateName: orig.fullName,
        originalRegNumber: orig.regNumber,
        replacementCandidateId: repl.id,
        replacementCandidateName: repl.fullName,
        replacementRegNumber: repl.regNumber,
        destinationCountry: orig.destinationCountry,
        agencyPartner: orig.agencyPartner || "Agensi / Syarikah Mitra",
        employerName: orig.employerName || "Majikan / Pemberi Kerja",
        vacancyId: orig.vacancyId,
        sponsorDpTreatment,
        transferredSponsorDpAmount: transferredDpAmt,
        sunkCostAmount: sunkCostAmt,
        wakalahFeeScheme,
        createdAt: today,
        processedBy: `${actorName}`,
      };

      if (!db.badilRecords) db.badilRecords = [];
      db.badilRecords.unshift(newBadilRecord);

      orig.badilInfo = {
        role: "REPLACED_ORIGINAL",
        badilRecordId: badilId,
        badilType,
        reason,
        linkedCandidateId: repl.id,
        linkedCandidateName: repl.fullName,
        linkedRegNumber: repl.regNumber,
        transferredSponsorDpAmount: transferredDpAmt,
        sunkCostAmount: sunkCostAmt,
        wakalahFeeScheme,
        processedAt: today,
      };

      repl.badilInfo = {
        role: "REPLACEMENT_CANDIDATE",
        badilRecordId: badilId,
        badilType,
        reason,
        linkedCandidateId: orig.id,
        linkedCandidateName: orig.fullName,
        linkedRegNumber: orig.regNumber,
        transferredSponsorDpAmount: transferredDpAmt,
        sunkCostAmount: sunkCostAmt,
        wakalahFeeScheme,
        processedAt: today,
      };

      db.auditLogs.unshift({
        id: `aud-${Date.now()}`,
        candidateId: repl.id,
        candidateName: repl.fullName,
        actorName,
        actorRole: actorRole as UserRole,
        branchName,
        actionType: "BADIL_PROCESSED",
        summary: `Memproses Badil (${badilCode}): ${repl.fullName} menggantikan ${orig.fullName} (${orig.destinationCountry})`,
        details: `Tipe: ${badilType} · Alasan: ${reason} · Carry-Over DP Sponsor: Rp ${transferredDpAmt.toLocaleString(
          "id-ID"
        )} · Sunk Cost: Rp ${sunkCostAmt.toLocaleString("id-ID")}`,
        timestamp: nowTimestamp(),
      });

      writeDb(db);
      return NextResponse.json({
        ok: true,
        badilRecord: newBadilRecord,
        originalCandidate: orig,
        replacementCandidate: repl,
        db,
      });
    }

    // 14. MODUL MASTER DATA: TAMBAH AGENSI MITRA LUAR NEGERI / SYARIKAH
    if (action === "CREATE_FOREIGN_AGENCY") {
      const {
        code,
        name,
        country,
        licenseOrWakalahNo,
        scheme,
        picName,
        phoneEmail,
        defaultAgencyFeeIdr,
        warrantyDays,
        mouExpiryDate,
      } = body.payload;

      const middleEastCountries = [
        "Arab Saudi",
        "Uni Emirat Arab (UAE)",
        "Kuwait",
        "Oman",
        "Yordania",
      ];
      const newAgency: ForeignAgency = {
        id: `agn-${Date.now()}`,
        code:
          code ||
          `AGN-${String(country || "SA")
            .slice(0, 2)
            .toUpperCase()}-00${(db.foreignAgencies?.length || 0) + 1}`,
        name,
        country: country as DestinationCountry,
        region: middleEastCountries.includes(country) ? "TIMUR_TENGAH" : "ASIA_PASIFIK",
        licenseOrWakalahNo: licenseOrWakalahNo || "-",
        scheme: scheme || "Reguler / Wakalah Resmi",
        picName: picName || "-",
        phoneEmail: phoneEmail || "-",
        defaultAgencyFeeIdr: Number(defaultAgencyFeeIdr) || 35000000,
        warrantyDays: Number(warrantyDays) || 90,
        mouExpiryDate: mouExpiryDate || "2028-12-31",
        status: "ACTIVE",
      };

      if (!db.foreignAgencies) db.foreignAgencies = [];
      db.foreignAgencies.unshift(newAgency);

      db.auditLogs.unshift({
        id: `aud-${Date.now()}`,
        actorName,
        actorRole: actorRole as UserRole,
        branchName,
        actionType: "MASTER_DATA_UPDATED",
        summary: `Menambahkan Master Agensi Mitra / Syarikah Baru: ${newAgency.name} (${newAgency.country})`,
        details: `No. Lisensi/Wakalah: ${newAgency.licenseOrWakalahNo} · Masa Garansi Badil: ${newAgency.warrantyDays} Hari`,
        timestamp: nowTimestamp(),
      });

      writeDb(db);
      return NextResponse.json({ ok: true, agency: newAgency, db });
    }

    // 15. MODUL MASTER DATA: TAMBAH SPONSOR / PEREKRUT LAPANGAN (PL)
    if (action === "CREATE_SPONSOR") {
      const { name, phone, area, branchId, bankAccount, commissionPerCpmi } = body.payload;
      const newSponsor: Sponsor = {
        id: `sp-${Date.now()}`,
        code: `SP-0${db.sponsors.length + 1}`,
        name,
        phone: phone || "-",
        area: area || "-",
        branchId: branchId || "br-idm",
        bankAccount: bankAccount || "-",
        commissionPerCpmi: Number(commissionPerCpmi) || 5000000,
        paidAmount: 0,
        payableAmount: 0,
      };
      db.sponsors.push(newSponsor);

      db.auditLogs.unshift({
        id: `aud-${Date.now()}`,
        actorName,
        actorRole: actorRole as UserRole,
        branchName,
        actionType: "MASTER_DATA_UPDATED",
        summary: `Menambahkan Master Sponsor / PL Baru: ${newSponsor.name} (${newSponsor.area})`,
        details: `Rekening: ${newSponsor.bankAccount} · Standar Fee: Rp ${newSponsor.commissionPerCpmi.toLocaleString(
          "id-ID"
        )}`,
        timestamp: nowTimestamp(),
      });

      writeDb(db);
      return NextResponse.json({ ok: true, sponsor: newSponsor, db });
    }

    // 16. MODUL MASTER DATA: TAMBAH KLINIK MEDICAL CHECK-UP / WAFID GCC
    if (action === "CREATE_MEDICAL_CLINIC") {
      const { name, accreditation, city, picName, phone, standardMcuFeeIdr, targetCountries } =
        body.payload;
      const newClinic: MedicalClinicPartner = {
        id: `mcu-${Date.now()}`,
        code: `KLINIK-0${(db.medicalClinics?.length || 0) + 1}`,
        name,
        accreditation: accreditation || "WAFID_GCC_GAMCA",
        city: city || "Jakarta",
        picName: picName || "-",
        phone: phone || "-",
        standardMcuFeeIdr: Number(standardMcuFeeIdr) || 1650000,
        targetCountries: targetCountries || "Arab Saudi, UAE, Kuwait, Oman",
        status: "ACTIVE",
      };
      if (!db.medicalClinics) db.medicalClinics = [];
      db.medicalClinics.push(newClinic);

      db.auditLogs.unshift({
        id: `aud-${Date.now()}`,
        actorName,
        actorRole: actorRole as UserRole,
        branchName,
        actionType: "MASTER_DATA_UPDATED",
        summary: `Menambahkan Master Klinik Medical Check-Up: ${newClinic.name} (${newClinic.city})`,
        details: `Akreditasi: ${newClinic.accreditation} · Tarif Standar: Rp ${newClinic.standardMcuFeeIdr.toLocaleString(
          "id-ID"
        )}`,
        timestamp: nowTimestamp(),
      });

      writeDb(db);
      return NextResponse.json({ ok: true, clinic: newClinic, db });
    }

    // 17. MODUL MASTER DATA: TAMBAH MITRA BPJS / ASURANSI / BANK KUR PMI
    if (action === "CREATE_BPJS_FINANCING") {
      const { name, partnerType, programPackage, premiumOrRateInfo, picName, phone } =
        body.payload;
      const newPartner: BpjsFinancingPartner = {
        id: `bpjs-${Date.now()}`,
        code: `MITRA-0${(db.bpjsFinancingPartners?.length || 0) + 1}`,
        name,
        partnerType: partnerType || "BPJS_KETENAGAKERJAAN",
        programPackage: programPackage || "-",
        premiumOrRateInfo: premiumOrRateInfo || "-",
        picName: picName || "-",
        phone: phone || "-",
        status: "ACTIVE",
      };
      if (!db.bpjsFinancingPartners) db.bpjsFinancingPartners = [];
      db.bpjsFinancingPartners.push(newPartner);

      db.auditLogs.unshift({
        id: `aud-${Date.now()}`,
        actorName,
        actorRole: actorRole as UserRole,
        branchName,
        actionType: "MASTER_DATA_UPDATED",
        summary: `Menambahkan Mitra Pelindungan / Pembiayaan PMI: ${newPartner.name}`,
        details: `Kategori: ${newPartner.partnerType} · Paket: ${newPartner.programPackage}`,
        timestamp: nowTimestamp(),
      });

      writeDb(db);
      return NextResponse.json({ ok: true, partner: newPartner, db });
    }

    // 18. MODUL MASTER DATA: TAMBAH KANTOR CABANG P3MI BARU
    if (action === "CREATE_BRANCH") {
      const { code, name, city, headName, phone } = body.payload;
      const newBranch: Branch = {
        id: `br-${Date.now()}`,
        code: code || `CBG-0${db.branches.length + 1}`,
        name,
        city: city || "-",
        headName: headName || "-",
        phone: phone || "-",
      };
      db.branches.push(newBranch);

      db.auditLogs.unshift({
        id: `aud-${Date.now()}`,
        actorName,
        actorRole: actorRole as UserRole,
        branchName,
        actionType: "MASTER_DATA_UPDATED",
        summary: `Menambahkan Kantor Cabang P3MI Baru: ${newBranch.name} (${newBranch.city})`,
        details: `Kepala Cabang: ${newBranch.headName}`,
        timestamp: nowTimestamp(),
      });

      writeDb(db);
      return NextResponse.json({ ok: true, branch: newBranch, db });
    }

    return NextResponse.json(
      { ok: false, error: "Action tidak dikenali." },
      { status: 400 }
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
