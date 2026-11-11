import { NextRequest, NextResponse } from "next/server";
import {
  DatabaseSchema,
  buildDefaultFinanceForCandidate,
  buildDefaultRegistrationFormForCandidate,
  buildDefaultTrainingForCandidate,
  createInitialRoles,
  createInitialTenants,
  getDaysRemaining,
  readDb,
  resetDbToSeed,
  validateStageTransition,
  writeDb,
} from "@/lib/db";
import {
  AppRole,
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
  CashAdvance,
  CashJournal,
  CashJournalCategory,
  CashTransactionType,
  CostCategory,
  DestinationCountry,
  DOC_TEMPLATE_CONFIG,
  EmployerInterview,
  ForeignAgency,
  FundingScheme,
  InterviewStatus,
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
  Sponsor,
  SponsorFormSubmission,
  SponsorInstallment,
  StaffAccount,
  SyarikahInvoice,
  TenantCompany,
  UserRole,
  WhatsAppMessageType,
  WhatsAppNotification,
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

    // Helper Otorisasi Kelola Akun Staf & Maintenance (Hanya Superadmin / Role dengan canManageStaff)
    function isSuperadminActor(): boolean {
      if (actorRole === "DIREKTUR") return true;
      const matchedActorRole = (db.roles || []).find((r) => r.code === actorRole);
      return Boolean(matchedActorRole?.permissions?.canManageStaff);
    }

    if (action === "RESET_DEMO_DATA") {
      if (!isSuperadminActor()) {
        return NextResponse.json(
          {
            ok: false,
            error: "Akses Ditolak: Hanya Direktur Utama (Superadmin) yang dapat mereset database.",
          },
          { status: 403 }
        );
      }
      const fresh = resetDbToSeed();
      return NextResponse.json({ ok: true, db: fresh });
    }

    if (action === "BACKUP_DATABASE") {
      if (!isSuperadminActor()) {
        return NextResponse.json(
          {
            ok: false,
            error: "Akses Ditolak: Hanya Superadmin yang dapat mengunduh backup database.",
          },
          { status: 403 }
        );
      }
      const { scope = "FULL" } = body.payload || {};
      db.auditLogs.unshift({
        id: `aud-${Date.now()}`,
        actorName: actorName || "Superadmin",
        actorRole: actorRole as UserRole,
        branchName: branchName || "Kantor Pusat Jakarta",
        actionType: "MAINTENANCE_ACTION",
        summary: `Melakukan Backup Database (${scope === "CORE" ? "User, Role & Master Data" : "Full Database"})`,
        details: `CPMI: ${db.candidates.length} · Staf: ${db.staffAccounts.length} · Role: ${(db.roles || []).length}`,
        timestamp: nowTimestamp(),
      });
      writeDb(db);

      const snapshot: Partial<DatabaseSchema> & { exportedAt: string; scope: string } =
        scope === "CORE"
          ? {
              exportedAt: nowTimestamp(),
              scope: "CORE",
              tenants: db.tenants,
              branches: db.branches,
              roles: db.roles,
              staffAccounts: db.staffAccounts,
              foreignAgencies: db.foreignAgencies,
              medicalClinics: db.medicalClinics,
              bpjsFinancingPartners: db.bpjsFinancingPartners,
              masterImmigrationOffices: db.masterImmigrationOffices,
              masterDisdukcapil: db.masterDisdukcapil,
              masterMedicalClinics: db.masterMedicalClinics,
              masterAirlines: db.masterAirlines,
              masterBlkLn: db.masterBlkLn,
              masterEmbassies: db.masterEmbassies,
            }
          : {
              exportedAt: nowTimestamp(),
              scope: "FULL",
              ...db,
            };

      return NextResponse.json({ ok: true, snapshot, db });
    }

    if (action === "RESTORE_DATABASE") {
      if (!isSuperadminActor()) {
        return NextResponse.json(
          {
            ok: false,
            error: "Akses Ditolak: Hanya Superadmin yang dapat me-restore database.",
          },
          { status: 403 }
        );
      }
      const { snapshot } = body.payload || {};
      if (
        !snapshot ||
        typeof snapshot !== "object" ||
        !Array.isArray(snapshot.branches) ||
        !Array.isArray(snapshot.staffAccounts)
      ) {
        return NextResponse.json(
          {
            ok: false,
            error: "Format file backup JSON tidak valid (harus memuat branches dan staffAccounts).",
          },
          { status: 400 }
        );
      }

      const restored: DatabaseSchema = {
        ...db,
        ...snapshot,
        candidates: Array.isArray(snapshot.candidates) ? snapshot.candidates : [],
        sponsors: Array.isArray(snapshot.sponsors) ? snapshot.sponsors : [],
        cases: Array.isArray(snapshot.cases) ? snapshot.cases : [],
        vacancies: Array.isArray(snapshot.vacancies) ? snapshot.vacancies : [],
        renewalTasks: Array.isArray(snapshot.renewalTasks) ? snapshot.renewalTasks : [],
        auditLogs: Array.isArray(snapshot.auditLogs) ? snapshot.auditLogs : [],
      };
      restored.auditLogs.unshift({
        id: `aud-${Date.now()}`,
        actorName: actorName || "Superadmin",
        actorRole: actorRole as UserRole,
        branchName: branchName || "Kantor Pusat Jakarta",
        actionType: "MAINTENANCE_ACTION",
        summary: "Melakukan Restore Database dari File Backup JSON",
        details: `Dipulihkan: ${restored.candidates.length} CPMI · ${restored.staffAccounts.length} Staf · ${(restored.roles || []).length} Role`,
        timestamp: nowTimestamp(),
      });
      writeDb(restored);
      return NextResponse.json({ ok: true, db: restored });
    }

    if (action === "CLEAR_OPERATIONAL_DATA") {
      if (!isSuperadminActor()) {
        return NextResponse.json(
          {
            ok: false,
            error: "Akses Ditolak: Hanya Superadmin yang dapat membersihkan data dummy operasional.",
          },
          { status: 403 }
        );
      }
      const { includeMaster = false } = body.payload || {};
      const cleared: DatabaseSchema = {
        ...db,
        isCleanProduction: true,
        candidates: [],
        sponsors: includeMaster ? [] : [],
        cases: [],
        vacancies: [],
        renewalTasks: [],
        badilRecords: [],
        cashJournals: [],
        cashAdvances: [],
        syarikahInvoices: [],
        employerInterviews: [],
        sponsorSubmissions: [],
        whatsAppLogs: [],
        auditLogs: [
          {
            id: `aud-${Date.now()}`,
            actorName: actorName || "Direktur Utama",
            actorRole: actorRole as UserRole,
            branchName: branchName || "Kantor Pusat Jakarta",
            actionType: "MAINTENANCE_ACTION",
            summary:
              "Membersihkan Seluruh Data Dummy Operasional (Mode Produksi Bersih PT. Panca Banyu Ajisakti)",
            details: `Dipertahankan: Direktur Utama, ${db.staffAccounts.length} User Staf, ${(db.roles || []).length} Role RBAC, Profil PT & Master Referensi.`,
            timestamp: nowTimestamp(),
          },
        ],
      };
      writeDb(cleared);
      return NextResponse.json({ ok: true, db: cleared });
    }

    // Aturan Otorisasi: Administrasi eksekusi seluruh proses operasional hanya dilakukan oleh Admin Pusat & Direktur
    // Cabang & Sponsor hanya sebatas View / Pantau (Read-Only)
    const restrictedActionsForBranch = [
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
      "CREATE_FOREIGN_AGENCY",
      "CREATE_SPONSOR",
      "CREATE_MEDICAL_CLINIC",
      "CREATE_BPJS_FINANCING",
      "CREATE_STAFF",
      "UPDATE_STAFF",
      "DELETE_STAFF",
      "CREATE_ROLE",
      "UPDATE_ROLE",
      "DELETE_ROLE",
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

    if (
      (actorRole === "KEPALA_CABANG" || actorRole === "PEREKRUT_PL") &&
      restrictedActionsForBranch.includes(action)
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Akses Ditolak: Administrasi eksekusi seluruh proses operasional hanya dapat dilakukan oleh Admin Pusat / Direktur. Akun Cabang hanya memiliki hak pantau (View-Only).",
        },
        { status: 403 }
      );
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
          { ok: false, error: "Password / PIN salah. Silakan periksa kembali atau hubungi Direktur Utama." },
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

    // Helper Otorisasi Kelola Akun Staf (Hanya Superadmin / Role dengan canManageStaff)
    function actorCanManageStaff(): boolean {
      return isSuperadminActor();
    }

    // 2. MANAJEMEN STAF BARU
    if (action === "CREATE_STAFF") {
      if (!actorCanManageStaff()) {
        return NextResponse.json(
          {
            ok: false,
            error:
              "Akses Ditolak: Hanya Superadmin atau peran dengan izin kelola akun staf yang dapat menambah user.",
          },
          { status: 403 }
        );
      }
      const { name, email, role, secondaryRoles, branchId, phone, pinCode = "1234" } = body.payload;
      const cleanName = String(name || "").trim();
      const cleanEmail = String(email || "").trim().toLowerCase();
      if (!cleanName || !cleanEmail) {
        return NextResponse.json(
          { ok: false, error: "Nama lengkap dan email login wajib diisi." },
          { status: 400 }
        );
      }
      if (db.staffAccounts.some((s) => s.email.toLowerCase() === cleanEmail)) {
        return NextResponse.json(
          { ok: false, error: `Email '${cleanEmail}' sudah terdaftar pada akun staf lain.` },
          { status: 409 }
        );
      }
      if (!db.roles) db.roles = createInitialRoles();
      const matchedRole = db.roles.find((r) => r.code === role);
      const cleanSecondaryRoles: UserRole[] = Array.isArray(secondaryRoles)
        ? secondaryRoles.filter((sr) => sr && sr !== role)
        : [];
      const secondaryLabels = cleanSecondaryRoles
        .map((sr) => db.roles?.find((r) => r.code === sr)?.name || String(sr))
        .filter(Boolean);
      const primaryLabel = matchedRole ? matchedRole.name : String(role);
      const roleLabel =
        secondaryLabels.length > 0
          ? `${primaryLabel} & ${secondaryLabels.join(" & ")}`
          : primaryLabel;
      const newStaff: StaffAccount = {
        id: `stf-${Date.now()}`,
        name: cleanName,
        email: cleanEmail,
        role: role as UserRole,
        secondaryRoles: cleanSecondaryRoles.length > 0 ? cleanSecondaryRoles : undefined,
        roleLabel,
        branchId: branchId || "ALL",
        phone: String(phone || "-").trim() || "-",
        active: true,
        pinCode: String(pinCode || "1234").trim() || "1234",
      };
      db.staffAccounts.push(newStaff);
      db.auditLogs.unshift({
        id: `aud-${Date.now()}`,
        actorName: actorName || "Superadmin",
        actorRole: actorRole || "DIREKTUR",
        branchName: "Kantor Pusat Jakarta",
        actionType: "STAFF_CREATED",
        summary: `Menambahkan Akun Staf Baru: ${newStaff.name} (${newStaff.roleLabel})`,
        details: `Email: ${newStaff.email} · Cabang: ${newStaff.branchId}`,
        timestamp: nowTimestamp(),
      });
      writeDb(db);
      return NextResponse.json({ ok: true, staff: newStaff, db });
    }

    // 2.0.1 EDIT AKUN STAF (KHUSUS SUPERADMIN / KELOLA STAF)
    if (action === "UPDATE_STAFF") {
      if (!actorCanManageStaff()) {
        return NextResponse.json(
          {
            ok: false,
            error:
              "Akses Ditolak: Hanya Superadmin atau role dengan hak akses kelola user yang dapat mengedit akun staf.",
          },
          { status: 403 }
        );
      }
      const { id, name, email, role, secondaryRoles, branchId, phone, pinCode, active } = body.payload || {};
      const idx = db.staffAccounts.findIndex((s) => s.id === id);
      if (idx === -1) {
        return NextResponse.json(
          { ok: false, error: "Data akun staf tidak ditemukan." },
          { status: 404 }
        );
      }

      const existing = db.staffAccounts[idx];
      const cleanName = String(name ?? existing.name).trim();
      const cleanEmail = String(email ?? existing.email).trim().toLowerCase();
      if (!cleanName || !cleanEmail) {
        return NextResponse.json(
          { ok: false, error: "Nama lengkap dan email login tidak boleh kosong." },
          { status: 400 }
        );
      }
      if (db.staffAccounts.some((s) => s.id !== id && s.email.toLowerCase() === cleanEmail)) {
        return NextResponse.json(
          { ok: false, error: `Email '${cleanEmail}' sudah dipakai akun staf lain.` },
          { status: 409 }
        );
      }

      if (!db.roles) db.roles = createInitialRoles();
      const nextRole = (role ?? existing.role) as UserRole;
      const nextSecondaryRoles: UserRole[] = Array.isArray(secondaryRoles)
        ? secondaryRoles.filter((sr) => sr && sr !== nextRole)
        : existing.secondaryRoles?.filter((sr) => sr !== nextRole) || [];
      const nextActive = active !== undefined ? Boolean(active) : existing.active;

      // Pastikan masih ada minimal 1 akun DIREKTUR aktif agar tidak mengunci akses Superadmin
      const isExistingDirector = existing.role === "DIREKTUR" && existing.active;
      const losesDirectorAccess = nextRole !== "DIREKTUR" || !nextActive;
      if (isExistingDirector && losesDirectorAccess) {
        const otherActiveDirectors = db.staffAccounts.filter(
          (s) => s.id !== id && s.role === "DIREKTUR" && s.active
        );
        if (otherActiveDirectors.length === 0) {
          return NextResponse.json(
            {
              ok: false,
              error:
                "Sistem harus memiliki minimal 1 akun Direktur Utama (Superadmin) aktif.",
            },
            { status: 400 }
          );
        }
      }

      const matchedRole = db.roles.find((r) => r.code === nextRole);
      const primaryLabel = matchedRole ? matchedRole.name : String(nextRole);
      const secondaryLabels = nextSecondaryRoles
        .map((sr) => db.roles?.find((r) => r.code === sr)?.name || String(sr))
        .filter(Boolean);
      const nextRoleLabel =
        secondaryLabels.length > 0
          ? `${primaryLabel} & ${secondaryLabels.join(" & ")}`
          : primaryLabel;

      const updatedStaff: StaffAccount = {
        ...existing,
        name: cleanName,
        email: cleanEmail,
        role: nextRole,
        secondaryRoles: nextSecondaryRoles.length > 0 ? nextSecondaryRoles : undefined,
        roleLabel: nextRoleLabel,
        branchId: branchId !== undefined ? String(branchId) : existing.branchId,
        phone: phone !== undefined ? String(phone).trim() || "-" : existing.phone,
        pinCode:
          pinCode !== undefined && String(pinCode).trim()
            ? String(pinCode).trim()
            : existing.pinCode,
        active: nextActive,
      };

      db.staffAccounts[idx] = updatedStaff;
      db.auditLogs.unshift({
        id: `aud-${Date.now()}`,
        actorName: actorName || "Superadmin",
        actorRole: actorRole || "DIREKTUR",
        branchName: branchName || "Kantor Pusat Jakarta",
        actionType: "STAFF_UPDATED",
        summary: `Memperbarui Akun Staf: ${updatedStaff.name} (${updatedStaff.roleLabel})`,
        details: `Email: ${updatedStaff.email} · Cabang: ${updatedStaff.branchId} · Status: ${
          updatedStaff.active ? "Aktif" : "Non-Aktif"
        }`,
        timestamp: nowTimestamp(),
      });
      writeDb(db);
      return NextResponse.json({ ok: true, staff: updatedStaff, db });
    }

    // 2.0.2 HAPUS AKUN STAF (KHUSUS SUPERADMIN / KELOLA STAF)
    if (action === "DELETE_STAFF") {
      if (!actorCanManageStaff()) {
        return NextResponse.json(
          {
            ok: false,
            error:
              "Akses Ditolak: Hanya Superadmin atau role dengan hak akses kelola user yang dapat menghapus akun staf.",
          },
          { status: 403 }
        );
      }
      const { id, currentLoggedInStaffId } = body.payload || {};
      const target = db.staffAccounts.find((s) => s.id === id);
      if (!target) {
        return NextResponse.json(
          { ok: false, error: "Data akun staf tidak ditemukan." },
          { status: 404 }
        );
      }
      if (currentLoggedInStaffId && target.id === currentLoggedInStaffId) {
        return NextResponse.json(
          {
            ok: false,
            error: "Akun yang sedang aktif login tidak dapat dihapus. Beralih ke akun lain terlebih dahulu.",
          },
          { status: 400 }
        );
      }
      if (target.role === "DIREKTUR") {
        const remainingDirectors = db.staffAccounts.filter(
          (s) => s.id !== id && s.role === "DIREKTUR" && s.active
        );
        if (remainingDirectors.length === 0) {
          return NextResponse.json(
            {
              ok: false,
              error: "Akun Direktur Utama (Superadmin) terakhir tidak dapat dihapus.",
            },
            { status: 400 }
          );
        }
      }

      db.staffAccounts = db.staffAccounts.filter((s) => s.id !== id);
      db.auditLogs.unshift({
        id: `aud-${Date.now()}`,
        actorName: actorName || "Superadmin",
        actorRole: actorRole || "DIREKTUR",
        branchName: branchName || "Kantor Pusat Jakarta",
        actionType: "STAFF_DELETED",
        summary: `Menghapus Akun Staf: ${target.name} (${target.roleLabel})`,
        details: `Email: ${target.email} · Cabang: ${target.branchId}`,
        timestamp: nowTimestamp(),
      });
      writeDb(db);
      return NextResponse.json({ ok: true, deletedId: id, db });
    }

    // 2.1 MANAJEMEN ROLE: TAMBAH ROLE BARU (CUSTOM DYNAMIC ROLE)
    if (action === "CREATE_ROLE") {
      const {
        code,
        name,
        description,
        isReadOnly = false,
        allowedScope = "ALL",
        allowedMenus = [],
        permissions,
      } = body.payload;

      if (!name || !code) {
        return NextResponse.json(
          { ok: false, error: "Nama Peran (Role) dan Kode Peran wajib diisi." },
          { status: 400 }
        );
      }

      const cleanCode = String(code).trim().toUpperCase().replace(/[^A-Z0-9_]/g, "_");
      if (!db.roles) db.roles = createInitialRoles();

      if (db.roles.some((r) => r.code === cleanCode)) {
        return NextResponse.json(
          { ok: false, error: `Kode Role '${cleanCode}' sudah digunakan. Silakan gunakan kode lain.` },
          { status: 400 }
        );
      }

      const newRole: AppRole = {
        id: `role-${Date.now()}`,
        code: cleanCode,
        name: String(name).trim(),
        description: String(description || "").trim(),
        isSystemRole: false,
        isReadOnly: Boolean(isReadOnly),
        allowedScope: allowedScope || "ALL",
        allowedMenus: Array.isArray(allowedMenus) && allowedMenus.length > 0 ? allowedMenus : ["beranda"],
        permissions: permissions || {
          canVerify: false,
          canViewSensitive: false,
          canSeeFinance: false,
          canManageStaff: false,
          canExecuteOperation: !isReadOnly,
        },
        createdAt: nowTimestamp().split(" ")[0],
      };

      db.roles.push(newRole);
      db.auditLogs.unshift({
        id: `aud-${Date.now()}`,
        actorName: actorName || "Superadmin",
        actorRole: actorRole || "DIREKTUR",
        branchName: "Kantor Pusat Jakarta",
        actionType: "ROLE_CREATED",
        summary: `Membuat Peran Hak Akses Baru: ${newRole.name} (${newRole.code})`,
        details: `Total Modul Diizinkan: ${newRole.allowedMenus.length} Modul · Mode: ${newRole.isReadOnly ? "View-Only" : "Akses Penuh"}`,
        timestamp: nowTimestamp(),
      });

      writeDb(db);
      return NextResponse.json({ ok: true, role: newRole, db });
    }

    // 2.2 MANAJEMEN ROLE: UPDATE MATRIX HAK AKSES MENU & PERIZINAN
    if (action === "UPDATE_ROLE") {
      const {
        id,
        name,
        description,
        isReadOnly,
        allowedScope,
        allowedMenus,
        permissions,
      } = body.payload;

      if (!db.roles) db.roles = createInitialRoles();
      const roleIndex = db.roles.findIndex((r) => r.id === id);
      if (roleIndex === -1) {
        return NextResponse.json(
          { ok: false, error: "Data Peran (Role) tidak ditemukan." },
          { status: 404 }
        );
      }

      const target = db.roles[roleIndex];
      if (name) target.name = String(name).trim();
      if (description !== undefined) target.description = String(description).trim();
      if (isReadOnly !== undefined) target.isReadOnly = Boolean(isReadOnly);
      if (allowedScope) target.allowedScope = allowedScope;
      if (Array.isArray(allowedMenus)) target.allowedMenus = allowedMenus;
      if (permissions) target.permissions = { ...target.permissions, ...permissions };
      target.updatedAt = nowTimestamp().split(" ")[0];

      db.auditLogs.unshift({
        id: `aud-${Date.now()}`,
        actorName: actorName || "Superadmin",
        actorRole: actorRole || "DIREKTUR",
        branchName: "Kantor Pusat Jakarta",
        actionType: "ROLE_UPDATED",
        summary: `Memperbarui Hak Akses Modul Role: ${target.name} (${target.code})`,
        details: `Total Modul Diizinkan: ${target.allowedMenus.length} Modul · Read-Only: ${target.isReadOnly}`,
        timestamp: nowTimestamp(),
      });

      writeDb(db);
      return NextResponse.json({ ok: true, role: target, db });
    }

    // 2.3 MANAJEMEN ROLE: HAPUS ROLE KUSTOM
    if (action === "DELETE_ROLE") {
      const { id } = body.payload;
      if (!db.roles) db.roles = createInitialRoles();
      const role = db.roles.find((r) => r.id === id);
      if (!role) {
        return NextResponse.json(
          { ok: false, error: "Peran (Role) tidak ditemukan." },
          { status: 404 }
        );
      }

      if (role.isSystemRole) {
        return NextResponse.json(
          { ok: false, error: "Role bawaan sistem tidak dapat dihapus demi integritas keamanan." },
          { status: 400 }
        );
      }

      const staffUsingRole = db.staffAccounts.filter((s) => s.role === role.code);
      if (staffUsingRole.length > 0) {
        return NextResponse.json(
          {
            ok: false,
            error: `Peran ini sedang digunakan oleh ${staffUsingRole.length} akun staf (${staffUsingRole.map((s) => s.name).join(", ")}). Silakan ubah peran staf terlebih dahulu.`,
          },
          { status: 400 }
        );
      }

      db.roles = db.roles.filter((r) => r.id !== id);
      db.auditLogs.unshift({
        id: `aud-${Date.now()}`,
        actorName: actorName || "Superadmin",
        actorRole: actorRole || "DIREKTUR",
        branchName: "Kantor Pusat Jakarta",
        actionType: "ROLE_DELETED",
        summary: `Menghapus Peran Hak Akses: ${role.name} (${role.code})`,
        details: "Peran kustom berhasil dihapus dari sistem.",
        timestamp: nowTimestamp(),
      });

      writeDb(db);
      return NextResponse.json({ ok: true, db });
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
      const regNum = `2611${String(db.candidates.length + 1).padStart(4, "0")}`;
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
        fullBodyPhotoUrl,
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
        processTrack,
        branchId,
        sponsorId,
        placementFee = 36000000,
        customRegNumber,
        registrationForm,
        sponsorSubmissionId,
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
      const systemGeneratedRegNum = `2611${String(db.candidates.length + 1).padStart(4, "0")}`;
      const regNum =
        customRegNumber && String(customRegNumber).trim()
          ? String(customRegNumber).trim()
          : systemGeneratedRegNum;
      const today = nowTimestamp().split(" ")[0];
      const spObj = db.sponsors.find((s) => s.id === sponsorId);

      const resolvedTrack: ProcessTrack =
        processTrack ||
        (registrationForm as OfficialRegistrationForm | undefined)?.processTrack ||
        "REKOM";

      const newCandidate: Candidate = {
        id,
        regNumber: regNum,
        nik: cleanNik,
        fullName: fullName.trim(),
        gender: gender || "P",
        avatarUrl: avatarUrl || undefined,
        fullBodyPhotoUrl: fullBodyPhotoUrl || undefined,
        birthPlace: birthPlace || "",
        birthDate: birthDate || "",
        phone: phone || "",
        address: address || "",
        maritalStatus: maritalStatus || "Belum Kawin",
        education: education || "SMA/SMK",
        destinationCountry: destinationCountry || "Arab Saudi",
        jobSector: jobSector || "Housekeeping & Caregiver",
        employerName: employerName || "",
        agencyPartner: agencyPartner || "",
        stage: stage as JourneyStage,
        specialStatus: "NORMAL",
        processTrack: resolvedTrack,
        placementFee: Number(placementFee) || 36000000,
        costIncurred: 0,
        sponsorCommission: spObj ? spObj.commissionPerCpmi : 0,
        commissionPaid: false,
        branchId: branchId || "br-jkt",
        sponsorId: sponsorId || undefined,
        portalPin: cleanNik ? cleanNik.slice(-6) : "123456",
        createdAt: today,
        updatedAt: today,
        documents: DOC_TEMPLATE_CONFIG.map((tpl, idx) => {
          const hand = (registrationForm as OfficialRegistrationForm | undefined)?.docHandover;
          let handoverVal: "NONE" | "ASLI" | "COPY" = "NONE";
          if (hand) {
            if (tpl.docType === "KTP") handoverVal = hand.ktp;
            else if (tpl.docType === "KK") handoverVal = hand.kk;
            else if (tpl.docType === "AKTA_IJAZAH")
              handoverVal =
                hand.akteKelahiran !== "NONE" ? hand.akteKelahiran : hand.sttbIjazah;
            else if (tpl.docType === "IZIN_KELUARGA") handoverVal = hand.izinKeluarga;
            else if (tpl.docType === "PASPOR") handoverVal = hand.paspor;
          }
          const isHandedOver = handoverVal === "ASLI" || handoverVal === "COPY";
          return {
            id: `doc-${id}-${idx + 1}`,
            candidateId: id,
            docType: tpl.docType,
            title: tpl.title,
            isSensitive: tpl.isSensitive,
            requiredAtStage: tpl.requiredAtStage,
            status: (isHandedOver ? "UPLOADED" : "MISSING") as "UPLOADED" | "MISSING",
            docNumber:
              tpl.docType === "KTP" && cleanNik
                ? cleanNik
                : isHandedOver
                ? `FISIK-${handoverVal}`
                : undefined,
            issuedBy: isHandedOver
              ? `Diserahkan Fisik (${handoverVal}) via Formulir Pendaftaran`
              : undefined,
            issueDate: isHandedOver ? today : undefined,
            aiCheckStatus: (isHandedOver ? "MATCH" : "UNCHECKED") as "MATCH" | "UNCHECKED",
            aiCheckNotes: isHandedOver
              ? `Tercatat pada Formulir Pendaftaran PT Panca Banyu Ajisakti sebagai dokumen ${handoverVal}.`
              : undefined,
            lastReminderTier: null,
          };
        }),
      };
      newCandidate.finance = buildDefaultFinanceForCandidate(newCandidate);
      newCandidate.training = buildDefaultTrainingForCandidate(newCandidate);
      newCandidate.registrationForm = registrationForm
        ? (registrationForm as OfficialRegistrationForm)
        : buildDefaultRegistrationFormForCandidate(newCandidate, db.sponsors);

      if (sponsorSubmissionId && db.sponsorSubmissions) {
        const sub = db.sponsorSubmissions.find((s) => s.id === sponsorSubmissionId);
        if (sub) {
          sub.status = "SUDAH_DIINPUT";
          sub.processedCandidateId = newCandidate.id;
          sub.processedRegNumber = newCandidate.regNumber;
          sub.processedBy = actorName;
          sub.processedAt = nowTimestamp();
        }
      }

      db.candidates.unshift(newCandidate);
      db.auditLogs.unshift({
        id: `aud-${Date.now()}`,
        candidateId: newCandidate.id,
        candidateName: newCandidate.fullName,
        actorName,
        actorRole: actorRole as UserRole,
        branchName,
        actionType: "CANDIDATE_CREATED",
        summary: `Mendaftarkan Formulir CPMI/CTKI baru ${newCandidate.fullName} (${newCandidate.regNumber}) pada tahap ${newCandidate.stage}`,
        details: cleanNik
          ? `Formulir Pendaftaran PT Panca Banyu Ajisakti lengkap. NIK 16 digit: ${cleanNik}. Tujuan: ${newCandidate.destinationCountry}.`
          : `Terdaftar via Formulir Pendaftaran PT Panca Banyu Ajisakti sebagai Lead lapangan.`,
        timestamp: nowTimestamp(),
      });

      writeDb(db);
      return NextResponse.json({ ok: true, candidate: newCandidate, db });
    }

    if (action === "CREATE_SPONSOR_SUBMISSION") {
      const {
        sponsorId,
        branchId,
        sourceMethod = "FORM_DIGITAL_SPONSOR",
        physicalFormImageUrl = "/form-pendaftaran-asli.jpg",
        fullName,
        nik,
        gender = "P",
        avatarUrl,
        birthPlace = "",
        birthDate = "",
        phone = "",
        address = "",
        maritalStatus = "Belum Kawin",
        education = "SMA/SMK",
        destinationCountry = "Arab Saudi",
        jobSector = "Housekeeping & Caregiver",
        registrationForm,
      } = body.payload;

      const spObj = db.sponsors.find((s) => s.id === sponsorId) || db.sponsors[0];
      if (!db.sponsorSubmissions) db.sponsorSubmissions = [];
      const newSub: SponsorFormSubmission = {
        id: `sub-form-${Date.now()}`,
        submissionCode: `FORM-SP/2026/040${db.sponsorSubmissions.length + 1}`,
        submittedAt: nowTimestamp(),
        sponsorId: spObj?.id || "sp-1",
        sponsorName: spObj ? `${spObj.name} (${spObj.code})` : "Sponsor Lapangan",
        sponsorPhone: spObj?.phone || "0812-0000-0000",
        branchId: branchId || spObj?.branchId || "br-idm",
        status: "MENUNGGU_DATA_ENTRY",
        sourceMethod,
        physicalFormImageUrl,
        fullName: String(fullName || "Calon PMI Baru").trim(),
        nik: nik ? String(nik).trim() : undefined,
        gender,
        avatarUrl,
        birthPlace,
        birthDate,
        phone,
        address,
        maritalStatus,
        education,
        destinationCountry: destinationCountry as DestinationCountry,
        jobSector,
        registrationForm: registrationForm as OfficialRegistrationForm,
      };
      db.sponsorSubmissions.unshift(newSub);
      writeDb(db);
      return NextResponse.json({ ok: true, submission: newSub, db });
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
      const prevTrack = candidate.processTrack || "REKOM";
      Object.assign(candidate, {
        ...updates,
        nik: candidate.nik,
        updatedAt: nowTimestamp().split(" ")[0],
      });

      if (updates.processTrack && updates.processTrack !== prevTrack) {
        candidate.finance = buildDefaultFinanceForCandidate(candidate);
        if (candidate.registrationForm) {
          candidate.registrationForm.processTrack = updates.processTrack;
        }
        db.auditLogs.unshift({
          id: `aud-${Date.now()}`,
          candidateId: candidate.id,
          candidateName: candidate.fullName,
          actorName,
          actorRole: actorRole as UserRole,
          branchName,
          actionType: "SPECIAL_STATUS",
          summary: `Mengubah Alur Proses Penempatan ${candidate.fullName}: ${
            prevTrack === "NON_REKOM" ? "Jalur Non-Rekom" : "Jalur Rekom"
          } → ${
            updates.processTrack === "NON_REKOM"
              ? "Jalur Non-Rekom (Tanpa BPJS-TK/KTKLN · Langsung Tiket & Keberangkatan)"
              : "Jalur Rekom Resmi (SISKOP2MI + BPJS-TK & E-KTKLN)"
          }`,
          details:
            updates.processTrack === "NON_REKOM"
              ? "Tahapan BPJS-TK, PAP & E-KTKLN dilewati. Setelah Medical, Paspor & Visa langsung menuju Tiket & Keberangkatan."
              : "Menggunakan alur penempatan normal lengkap (BPJS-TK, PAP & E-KTKLN).",
          timestamp: nowTimestamp(),
        });
      }

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
      const { tenantId = "tenant-panca", code, name, city, headName, phone, address } = body.payload;
      const newBranch: Branch = {
        id: `br-${Date.now()}`,
        tenantId,
        code: code || `CBG-0${db.branches.length + 1}`,
        name,
        city: city || "-",
        headName: headName || "-",
        phone: phone || "-",
        address: address || "-",
        status: "ACTIVE",
      };
      db.branches.push(newBranch);

      db.auditLogs.unshift({
        id: `aud-${Date.now()}`,
        actorName,
        actorRole: actorRole as UserRole,
        branchName,
        actionType: "MASTER_DATA_UPDATED",
        summary: `Menambahkan Kantor Cabang P3MI Baru: ${newBranch.name} (${newBranch.city})`,
        details: `Kepala Cabang: ${newBranch.headName} · Tenant ID: ${newBranch.tenantId}`,
        timestamp: nowTimestamp(),
      });

      writeDb(db);
      return NextResponse.json({ ok: true, branch: newBranch, db });
    }

    if (action === "UPDATE_BRANCH") {
      const { branchId, updates } = body.payload;
      const b = db.branches.find((x) => x.id === branchId);
      if (!b) {
        return NextResponse.json({ ok: false, error: "Cabang tidak ditemukan." }, { status: 404 });
      }
      Object.assign(b, updates);

      db.auditLogs.unshift({
        id: `aud-${Date.now()}`,
        actorName,
        actorRole: actorRole as UserRole,
        branchName,
        actionType: "MASTER_DATA_UPDATED",
        summary: `Memperbarui Data Kantor Cabang: ${b.name}`,
        details: `Kota: ${b.city} · Kepala: ${b.headName} · Status: ${b.status || "ACTIVE"}`,
        timestamp: nowTimestamp(),
      });

      writeDb(db);
      return NextResponse.json({ ok: true, branch: b, db });
    }

    // 19. MODUL 1 (SAAS): KELOLA PERUSAHAAN P3MI (TENANT) & LISENSI
    if (action === "CREATE_TENANT") {
      const {
        code,
        name,
        brandName,
        licenseNo,
        logoUrl = "/logo-panca-banyu.png",
        planTier = "PRO",
        planExpiresAt = "2027-12-31",
        maxCandidates = 500,
        maxBranches = 10,
        address = "-",
        phone = "-",
        email = "-",
        picName = "-",
      } = body.payload;

      const newTenant: TenantCompany = {
        id: `tenant-${Date.now()}`,
        code: code || `P3MI-00${(db.tenants?.length || 0) + 1}`,
        name,
        brandName: brandName || name,
        licenseNo: licenseNo || "SIP3MI Menaker RI",
        logoUrl,
        planTier,
        planExpiresAt,
        maxCandidates: Number(maxCandidates) || 500,
        maxBranches: Number(maxBranches) || 10,
        status: "ACTIVE",
        address,
        phone,
        email,
        picName,
        createdAt: nowTimestamp().split(" ")[0],
      };

      if (!db.tenants) db.tenants = [];
      db.tenants.push(newTenant);

      db.auditLogs.unshift({
        id: `aud-${Date.now()}`,
        actorName,
        actorRole: actorRole as UserRole,
        branchName,
        actionType: "MASTER_DATA_UPDATED",
        summary: `Menambahkan Perusahaan P3MI Baru (Tenant SaaS): ${newTenant.name}`,
        details: `SIP3MI: ${newTenant.licenseNo} · Paket: ${newTenant.planTier} (Max: ${newTenant.maxCandidates} CPMI, ${newTenant.maxBranches} Cabang)`,
        timestamp: nowTimestamp(),
      });

      writeDb(db);
      return NextResponse.json({ ok: true, tenant: newTenant, db });
    }

    if (action === "UPDATE_TENANT") {
      const { tenantId, updates } = body.payload;
      if (!db.tenants || db.tenants.length === 0) {
        db.tenants = createInitialTenants();
      }
      const list = db.tenants!;
      let t = list.find((x) => x.id === tenantId) || list[0];
      if (!t) {
        t = createInitialTenants()[0];
        list.push(t);
      }
      Object.assign(t, updates);

      db.auditLogs.unshift({
        id: `aud-${Date.now()}`,
        actorName,
        actorRole: actorRole as UserRole,
        branchName,
        actionType: "MASTER_DATA_UPDATED",
        summary: `Memperbarui Data Perusahaan P3MI (Tenant SaaS): ${t.name}`,
        details: `Status: ${t.status} · Lisensi: ${t.licenseNo} · Paket: ${t.planTier}`,
        timestamp: nowTimestamp(),
      });

      writeDb(db);
      return NextResponse.json({ ok: true, tenant: t, db });
    }

    // --- MODUL 3: INTEGRASI WHATSAPP GATEWAY OTOMATIS ---
    if (action === "SEND_WHATSAPP_MESSAGE") {
      const {
        recipientPhone,
        recipientName,
        recipientRole = "CPMI",
        candidateId,
        candidateName,
        messageType = "GENERAL",
        title,
        messageBody,
      } = body.payload;

      if (!recipientPhone || !messageBody) {
        return NextResponse.json({ ok: false, error: "Nomor WhatsApp & isi pesan wajib diisi." }, { status: 400 });
      }

      if (!db.whatsAppLogs) db.whatsAppLogs = [];
      const newWaLog: WhatsAppNotification = {
        id: `wa-${Date.now()}`,
        recipientPhone,
        recipientName,
        recipientRole,
        candidateId,
        candidateName,
        messageType,
        title: title || "Notifikasi Operasional PT. Panca Banyu Ajisakti",
        messageBody,
        status: "SENT",
        sentAt: nowTimestamp(),
      };

      db.whatsAppLogs.unshift(newWaLog);

      db.auditLogs.unshift({
        id: `aud-${Date.now()}`,
        actorName,
        actorRole: actorRole as UserRole,
        branchName,
        actionType: "MASTER_DATA_UPDATED",
        summary: `Kirim Notifikasi WhatsApp Gateway ke ${recipientName} (${recipientPhone})`,
        details: `Tipe: ${messageType} · Judul: ${title || "Notifikasi"}`,
        timestamp: nowTimestamp(),
      });

      writeDb(db);
      return NextResponse.json({ ok: true, whatsAppLog: newWaLog, db });
    }

    // --- MODUL 4: AKUNTANSI, ARUS KAS BANK & KASBON ---
    if (action === "CREATE_CASH_JOURNAL") {
      const {
        tenantId = "tenant-panca",
        branchId = "br-jkt",
        transactionDate = nowTimestamp().split(" ")[0],
        type,
        category,
        amount,
        recipientOrPayer,
        description,
        paymentMethod = "BANK_TRANSFER",
        bankAccountName,
        referenceNumber,
        candidateId,
      } = body.payload;

      if (!amount || amount <= 0 || !recipientOrPayer || !description) {
        return NextResponse.json({ ok: false, error: "Nominal, pihak terkait, dan uraian transaksi wajib diisi." }, { status: 400 });
      }

      if (!db.cashJournals) db.cashJournals = [];
      const newJournal: CashJournal = {
        id: `cj-${Date.now()}`,
        tenantId,
        branchId,
        transactionDate,
        type: type as CashTransactionType,
        category: category as CashJournalCategory,
        amount: Number(amount),
        recipientOrPayer,
        description,
        paymentMethod,
        bankAccountName,
        referenceNumber,
        candidateId,
        createdBy: actorName,
        createdAt: nowTimestamp(),
      };

      db.cashJournals.unshift(newJournal);

      db.auditLogs.unshift({
        id: `aud-${Date.now()}`,
        actorName,
        actorRole: actorRole as UserRole,
        branchName,
        actionType: "FINANCE_PAYMENT",
        summary: `Pencatatan Jurnal Arus Kas (${type}): Rp ${Number(amount).toLocaleString("id-ID")}`,
        details: `${category} · ${recipientOrPayer} · Ket: ${description}`,
        timestamp: nowTimestamp(),
      });

      writeDb(db);
      return NextResponse.json({ ok: true, journal: newJournal, db });
    }

    if (action === "CREATE_CASH_ADVANCE") {
      const {
        tenantId = "tenant-panca",
        borrowerId,
        borrowerName,
        borrowerType = "SPONSOR",
        amount,
        reason,
        dateGiven = nowTimestamp().split(" ")[0],
      } = body.payload;

      if (!amount || amount <= 0 || !borrowerName) {
        return NextResponse.json({ ok: false, error: "Data penerima kasbon dan jumlah wajib diisi." }, { status: 400 });
      }

      if (!db.cashAdvances) db.cashAdvances = [];
      const newAdvance: CashAdvance = {
        id: `ca-${Date.now()}`,
        tenantId,
        borrowerId,
        borrowerName,
        borrowerType,
        amount: Number(amount),
        remainingAmount: Number(amount),
        reason: reason || "Kasbon operasional lapangan",
        dateGiven,
        status: "DISETUJUI",
        approvedBy: actorName,
        deductions: [],
      };

      db.cashAdvances.unshift(newAdvance);

      db.auditLogs.unshift({
        id: `aud-${Date.now()}`,
        actorName,
        actorRole: actorRole as UserRole,
        branchName,
        actionType: "FINANCE_PAYMENT",
        summary: `Pengajuan Kasbon Disetujui: ${borrowerName} (${borrowerType}) Rp ${Number(amount).toLocaleString("id-ID")}`,
        details: `Alasan: ${reason}`,
        timestamp: nowTimestamp(),
      });

      writeDb(db);
      return NextResponse.json({ ok: true, advance: newAdvance, db });
    }

    if (action === "REPAY_CASH_ADVANCE") {
      const { advanceId, amount, note = "Potong komisi / Pengembalian tunai" } = body.payload;
      const adv = db.cashAdvances?.find((a) => a.id === advanceId);
      if (!adv) {
        return NextResponse.json({ ok: false, error: "Data Kasbon tidak ditemukan." }, { status: 404 });
      }

      const repayAmt = Math.min(Number(amount), adv.remainingAmount);
      adv.remainingAmount -= repayAmt;
      adv.deductions.push({
        id: `ded-${Date.now()}`,
        date: nowTimestamp().split(" ")[0],
        amount: repayAmt,
        note,
      });

      if (adv.remainingAmount <= 0) {
        adv.status = "LUNAS";
        adv.remainingAmount = 0;
      }

      db.auditLogs.unshift({
        id: `aud-${Date.now()}`,
        actorName,
        actorRole: actorRole as UserRole,
        branchName,
        actionType: "FINANCE_PAYMENT",
        summary: `Pembayaran Kasbon ${adv.borrowerName}: Rp ${repayAmt.toLocaleString("id-ID")}`,
        details: `Sisa Kasbon: Rp ${adv.remainingAmount.toLocaleString("id-ID")} (Status: ${adv.status})`,
        timestamp: nowTimestamp(),
      });

      writeDb(db);
      return NextResponse.json({ ok: true, advance: adv, db });
    }

    if (action === "CREATE_SYARIKAH_INVOICE") {
      const {
        tenantId = "tenant-panca",
        invoiceNumber,
        syarikahName,
        destinationCountry = "Arab Saudi",
        candidateCount,
        candidateNames = [],
        currency = "SAR",
        totalAmount,
        dueDate,
        notes,
      } = body.payload;

      if (!invoiceNumber || !syarikahName || !totalAmount) {
        return NextResponse.json({ ok: false, error: "Nomor invoice, nama syarikah, dan nominal wajib diisi." }, { status: 400 });
      }

      if (!db.syarikahInvoices) db.syarikahInvoices = [];
      const newInvoice: SyarikahInvoice = {
        id: `inv-${Date.now()}`,
        tenantId,
        invoiceNumber,
        syarikahName,
        destinationCountry,
        candidateCount: Number(candidateCount) || candidateNames.length || 1,
        candidateNames: Array.isArray(candidateNames) ? candidateNames : [candidateNames],
        currency,
        totalAmount: Number(totalAmount),
        paidAmount: 0,
        dueDate: dueDate || nowTimestamp().split(" ")[0],
        issuedDate: nowTimestamp().split(" ")[0],
        status: "SENT",
        notes,
      };

      db.syarikahInvoices.unshift(newInvoice);

      db.auditLogs.unshift({
        id: `aud-${Date.now()}`,
        actorName,
        actorRole: actorRole as UserRole,
        branchName,
        actionType: "FINANCE_PAYMENT",
        summary: `Terbitkan Tagihan Invoice Wakalah: ${invoiceNumber} (${syarikahName})`,
        details: `Total: ${currency} ${Number(totalAmount).toLocaleString("id-ID")} (${newInvoice.candidateCount} CPMI)`,
        timestamp: nowTimestamp(),
      });

      writeDb(db);
      return NextResponse.json({ ok: true, invoice: newInvoice, db });
    }

    if (action === "UPDATE_SYARIKAH_INVOICE") {
      const { invoiceId, paidAmountDelta = 0, status, notes } = body.payload;
      const inv = db.syarikahInvoices?.find((i) => i.id === invoiceId);
      if (!inv) {
        return NextResponse.json({ ok: false, error: "Invoice tidak ditemukan." }, { status: 404 });
      }

      if (paidAmountDelta) {
        inv.paidAmount = Math.min(inv.totalAmount, inv.paidAmount + Number(paidAmountDelta));
      }
      if (status) inv.status = status;
      if (inv.paidAmount >= inv.totalAmount) inv.status = "PAID";
      else if (inv.paidAmount > 0) inv.status = "PARTIAL";
      if (notes) inv.notes = notes;

      db.auditLogs.unshift({
        id: `aud-${Date.now()}`,
        actorName,
        actorRole: actorRole as UserRole,
        branchName,
        actionType: "FINANCE_PAYMENT",
        summary: `Update Status/Pembayaran Invoice Wakalah: ${inv.invoiceNumber}`,
        details: `Status: ${inv.status} · Terbayar: ${inv.currency} ${inv.paidAmount.toLocaleString("id-ID")} / ${inv.totalAmount.toLocaleString("id-ID")}`,
        timestamp: nowTimestamp(),
      });

      writeDb(db);
      return NextResponse.json({ ok: true, invoice: inv, db });
    }

    // --- MODUL 5: SELEKSI & WAWANCARA MAJIKAN (MATCHING) ---
    if (action === "CREATE_EMPLOYER_INTERVIEW") {
      const {
        tenantId = "tenant-panca",
        candidateId,
        candidateName,
        syarikahName,
        jobSector,
        interviewDate,
        interviewTimeKsa,
        interviewMethod = "ZOOM",
        meetingLinkOrPhone,
        interviewerName,
        interpreterName = "Ust. Fauzan Hakim (P3MI Pusat)",
        notes,
      } = body.payload;

      if (!candidateName || !syarikahName || !interviewDate) {
        return NextResponse.json({ ok: false, error: "Nama CPMI, nama syarikah, dan jadwal interview wajib diisi." }, { status: 400 });
      }

      if (!db.employerInterviews) db.employerInterviews = [];
      const newInterview: EmployerInterview = {
        id: `int-${Date.now()}`,
        tenantId,
        candidateId: candidateId || `cpmi-${Date.now()}`,
        candidateName,
        syarikahName,
        jobSector: jobSector || "Penata Laksana Rumah Tangga (PLRT)",
        interviewDate,
        interviewTimeKsa: interviewTimeKsa || "11:00 KSA",
        interviewMethod,
        meetingLinkOrPhone: meetingLinkOrPhone || "https://meet.google.com/xyz",
        interviewerName: interviewerName || "Perwakilan Syarikah KSA",
        interpreterName,
        status: "SCHEDULED",
        notes,
        createdAt: nowTimestamp(),
      };

      db.employerInterviews.unshift(newInterview);

      // Otomatis buat notifikasi WhatsApp ke CPMI
      const c = db.candidates.find((x) => x.id === candidateId || x.fullName === candidateName);
      if (c && c.phone) {
        if (!db.whatsAppLogs) db.whatsAppLogs = [];
        db.whatsAppLogs.unshift({
          id: `wa-${Date.now()}`,
          recipientPhone: c.phone,
          recipientName: c.fullName,
          recipientRole: "CPMI",
          candidateId: c.id,
          candidateName: c.fullName,
          messageType: "INTERVIEW_INVITE",
          title: `Jadwal Wawancara Video Call Syarikah ${syarikahName}`,
          messageBody: `Halo Sdri ${c.fullName}, Anda dijadwalkan wawancara video call (${interviewMethod}) dengan Syarikah ${syarikahName} untuk posisi ${newInterview.jobSector} pada tanggal ${interviewDate} pukul ${interviewTimeKsa}. Harap hadir di kantor P3MI tepat waktu.`,
          status: "SENT",
          sentAt: nowTimestamp(),
        });
      }

      db.auditLogs.unshift({
        id: `aud-${Date.now()}`,
        actorName,
        actorRole: actorRole as UserRole,
        branchName,
        actionType: "MASTER_DATA_UPDATED",
        summary: `Jadwalkan Wawancara Video Call Majikan/Syarikah: ${candidateName} - ${syarikahName}`,
        details: `Tanggal: ${interviewDate} (${interviewTimeKsa}) via ${interviewMethod}`,
        timestamp: nowTimestamp(),
      });

      writeDb(db);
      return NextResponse.json({ ok: true, interview: newInterview, db });
    }

    if (action === "UPDATE_EMPLOYER_INTERVIEW") {
      const { interviewId, status, agreedSalarySar, notes } = body.payload;
      const item = db.employerInterviews?.find((i) => i.id === interviewId);
      if (!item) {
        return NextResponse.json({ ok: false, error: "Jadwal interview tidak ditemukan." }, { status: 404 });
      }

      if (status) item.status = status;
      if (agreedSalarySar) item.agreedSalarySar = Number(agreedSalarySar);
      if (notes) item.notes = notes;

      // Jika lolos seleksi majikan, kirim notifikasi WhatsApp kelulusan
      if (status === "PASSED") {
        const c = db.candidates.find((x) => x.id === item.candidateId);
        if (c && c.phone) {
          if (!db.whatsAppLogs) db.whatsAppLogs = [];
          db.whatsAppLogs.unshift({
            id: `wa-${Date.now()}`,
            recipientPhone: c.phone,
            recipientName: c.fullName,
            recipientRole: "CPMI",
            candidateId: c.id,
            candidateName: c.fullName,
            messageType: "STAGE_UPDATE",
            title: `Selamat! Anda Lolos Wawancara Majikan ${item.syarikahName}`,
            messageBody: `Yth. Sdri ${c.fullName}, Selamat! Hasil interview video call dengan ${item.syarikahName} dinyatakan LOLOS (Gaji disepakati: ${item.agreedSalarySar || 1500} SAR). Berkas Anda segera diajukan untuk penerbitan Visa Kerja Timur Tengah resmi (SPSK).`,
            status: "SENT",
            sentAt: nowTimestamp(),
          });
        }
      }

      db.auditLogs.unshift({
        id: `aud-${Date.now()}`,
        actorName,
        actorRole: actorRole as UserRole,
        branchName,
        actionType: "MASTER_DATA_UPDATED",
        summary: `Update Hasil Wawancara Majikan: ${item.candidateName} - Status: ${item.status}`,
        details: `Gaji: ${item.agreedSalarySar || "-"} SAR · Catatan: ${item.notes || "-"}`,
        timestamp: nowTimestamp(),
      });

      writeDb(db);
      return NextResponse.json({ ok: true, interview: item, db });
    }

    // ============================================================
    // MODUL MASTER DATA OPERASIONAL TERPADU P3MI
    // (Kanim, Disdukcapil, Medical Wafid, Airlines, BLK-LN, Kedutaan)
    // ============================================================

    if (action === "CREATE_MASTER_ITEM") {
      const { entityType, data } = body.payload;
      const ts = Date.now();
      let createdName = "";

      if (entityType === "KANIM") {
        if (!db.masterImmigrationOffices) db.masterImmigrationOffices = [];
        const newItem: MasterImmigrationOffice = {
          id: `kanim-${ts}`,
          code: data.code || `KANIM-${db.masterImmigrationOffices.length + 1}`,
          name: data.name,
          city: data.city || "-",
          province: data.province || "-",
          address: data.address || "-",
          phone: data.phone || "-",
          headOfOfficeName: data.headOfOfficeName || "-",
          headOfOfficeTitle: data.headOfOfficeTitle || "Kepala Kantor Imigrasi",
          active: true,
        };
        db.masterImmigrationOffices.push(newItem);
        createdName = newItem.name;
      } else if (entityType === "DISDUKCAPIL") {
        if (!db.masterDisdukcapil) db.masterDisdukcapil = [];
        const newItem: MasterDisdukcapil = {
          id: `dukcapil-${ts}`,
          code: data.code || `DUKCAPIL-${db.masterDisdukcapil.length + 1}`,
          regencyCity: data.regencyCity,
          province: data.province || "-",
          officeName: data.officeName || `Disdukcapil ${data.regencyCity}`,
          address: data.address || "-",
          phone: data.phone || "-",
          active: true,
        };
        db.masterDisdukcapil.push(newItem);
        createdName = newItem.officeName;
      } else if (entityType === "CLINIC") {
        if (!db.masterMedicalClinics) db.masterMedicalClinics = [];
        const newItem: MasterMedicalClinic = {
          id: `med-${ts}`,
          code: data.code || `WAFID-${db.masterMedicalClinics.length + 1}`,
          name: data.name,
          type: data.type || "WAFID_GAMCA",
          wafidCode: data.wafidCode || "-",
          city: data.city || "-",
          address: data.address || "-",
          phone: data.phone || "-",
          doctorInCharge: data.doctorInCharge || "-",
          active: true,
        };
        db.masterMedicalClinics.push(newItem);
        createdName = newItem.name;
      } else if (entityType === "AIRLINE") {
        if (!db.masterAirlines) db.masterAirlines = [];
        const newItem: MasterAirline = {
          id: `air-${ts}`,
          iataCode: (data.iataCode || "XX").toUpperCase(),
          icaoCode: (data.icaoCode || "XXX").toUpperCase(),
          name: data.name,
          country: data.country || "Arab Saudi",
          mainHub: data.mainHub || "-",
          active: true,
        };
        db.masterAirlines.push(newItem);
        createdName = `${newItem.name} (${newItem.iataCode})`;
      } else if (entityType === "BLK") {
        if (!db.masterBlkLn) db.masterBlkLn = [];
        const newItem: MasterBlkLn = {
          id: `blk-${ts}`,
          code: data.code || `BLK-${db.masterBlkLn.length + 1}`,
          name: data.name,
          ownership: data.ownership || "INTERNAL_PBA",
          vinKemnaker: data.vinKemnaker || "-",
          accreditationGrade: data.accreditationGrade || "A",
          city: data.city || "-",
          address: data.address || "-",
          phone: data.phone || "-",
          picName: data.picName || "-",
          capacity: Number(data.capacity) || 50,
          active: true,
        };
        db.masterBlkLn.push(newItem);
        createdName = newItem.name;
      } else if (entityType === "EMBASSY") {
        if (!db.masterEmbassies) db.masterEmbassies = [];
        const newItem: MasterEmbassy = {
          id: `emb-${ts}`,
          code: data.code || `EMB-${db.masterEmbassies.length + 1}`,
          country: data.country || "Arab Saudi",
          institutionType: data.institutionType || "EMBASSY",
          name: data.name,
          address: data.address || "-",
          phone: data.phone || "-",
          email: data.email || "-",
          appointmentUrl: data.appointmentUrl || "",
          active: true,
        };
        db.masterEmbassies.push(newItem);
        createdName = newItem.name;
      } else {
        return NextResponse.json({ ok: false, error: "Tipe entitas master tidak valid." }, { status: 400 });
      }

      db.auditLogs.unshift({
        id: `aud-${Date.now()}`,
        actorName,
        actorRole: actorRole as UserRole,
        branchName,
        actionType: "MASTER_DATA_UPDATED",
        summary: `Menambahkan Master Data [${entityType}]: ${createdName}`,
        details: `Tersimpan dalam database master PT. Panca Banyu Ajisakti secara permanen.`,
        timestamp: nowTimestamp(),
      });

      writeDb(db);
      return NextResponse.json({ ok: true, db });
    }

    if (action === "UPDATE_MASTER_ITEM") {
      const { entityType, id, data } = body.payload;
      let updatedName = "";

      if (entityType === "KANIM") {
        const item = db.masterImmigrationOffices?.find((x) => x.id === id);
        if (!item) return NextResponse.json({ ok: false, error: "Data Kantor Imigrasi tidak ditemukan." }, { status: 404 });
        Object.assign(item, data);
        updatedName = item.name;
      } else if (entityType === "DISDUKCAPIL") {
        const item = db.masterDisdukcapil?.find((x) => x.id === id);
        if (!item) return NextResponse.json({ ok: false, error: "Data Disdukcapil tidak ditemukan." }, { status: 404 });
        Object.assign(item, data);
        updatedName = item.officeName;
      } else if (entityType === "CLINIC") {
        const item = db.masterMedicalClinics?.find((x) => x.id === id);
        if (!item) return NextResponse.json({ ok: false, error: "Data Klinik Medical tidak ditemukan." }, { status: 404 });
        Object.assign(item, data);
        updatedName = item.name;
      } else if (entityType === "AIRLINE") {
        const item = db.masterAirlines?.find((x) => x.id === id);
        if (!item) return NextResponse.json({ ok: false, error: "Data Maskapai tidak ditemukan." }, { status: 404 });
        Object.assign(item, data);
        updatedName = item.name;
      } else if (entityType === "BLK") {
        const item = db.masterBlkLn?.find((x) => x.id === id);
        if (!item) return NextResponse.json({ ok: false, error: "Data BLK-LN tidak ditemukan." }, { status: 404 });
        Object.assign(item, data);
        updatedName = item.name;
      } else if (entityType === "EMBASSY") {
        const item = db.masterEmbassies?.find((x) => x.id === id);
        if (!item) return NextResponse.json({ ok: false, error: "Data Kedutaan / Visa Center tidak ditemukan." }, { status: 404 });
        Object.assign(item, data);
        updatedName = item.name;
      }

      db.auditLogs.unshift({
        id: `aud-${Date.now()}`,
        actorName,
        actorRole: actorRole as UserRole,
        branchName,
        actionType: "MASTER_DATA_UPDATED",
        summary: `Memperbarui Master Data [${entityType}]: ${updatedName}`,
        details: `Perubahan data operasional master berhasil disimpan ke database.`,
        timestamp: nowTimestamp(),
      });

      writeDb(db);
      return NextResponse.json({ ok: true, db });
    }

    if (action === "TOGGLE_MASTER_STATUS") {
      const { entityType, id } = body.payload;
      let targetName = "";
      let newStatus = true;

      if (entityType === "KANIM") {
        const item = db.masterImmigrationOffices?.find((x) => x.id === id);
        if (item) { item.active = !item.active; targetName = item.name; newStatus = item.active; }
      } else if (entityType === "DISDUKCAPIL") {
        const item = db.masterDisdukcapil?.find((x) => x.id === id);
        if (item) { item.active = !item.active; targetName = item.officeName; newStatus = item.active; }
      } else if (entityType === "CLINIC") {
        const item = db.masterMedicalClinics?.find((x) => x.id === id);
        if (item) { item.active = !item.active; targetName = item.name; newStatus = item.active; }
      } else if (entityType === "AIRLINE") {
        const item = db.masterAirlines?.find((x) => x.id === id);
        if (item) { item.active = !item.active; targetName = item.name; newStatus = item.active; }
      } else if (entityType === "BLK") {
        const item = db.masterBlkLn?.find((x) => x.id === id);
        if (item) { item.active = !item.active; targetName = item.name; newStatus = item.active; }
      } else if (entityType === "EMBASSY") {
        const item = db.masterEmbassies?.find((x) => x.id === id);
        if (item) { item.active = !item.active; targetName = item.name; newStatus = item.active; }
      }

      db.auditLogs.unshift({
        id: `aud-${Date.now()}`,
        actorName,
        actorRole: actorRole as UserRole,
        branchName,
        actionType: "MASTER_DATA_UPDATED",
        summary: `Ubah Status Master [${entityType}]: ${targetName} -> ${newStatus ? "AKTIF" : "NON-AKTIF"}`,
        details: `Status data master telah disinkronisasi.`,
        timestamp: nowTimestamp(),
      });

      writeDb(db);
      return NextResponse.json({ ok: true, db });
    }

    if (action === "DELETE_MASTER_ITEM") {
      const { entityType, id } = body.payload;
      let deletedName = "";

      if (entityType === "KANIM") {
        const item = db.masterImmigrationOffices?.find((x) => x.id === id);
        deletedName = item?.name || id;
        db.masterImmigrationOffices = db.masterImmigrationOffices?.filter((x) => x.id !== id);
      } else if (entityType === "DISDUKCAPIL") {
        const item = db.masterDisdukcapil?.find((x) => x.id === id);
        deletedName = item?.officeName || id;
        db.masterDisdukcapil = db.masterDisdukcapil?.filter((x) => x.id !== id);
      } else if (entityType === "CLINIC") {
        const item = db.masterMedicalClinics?.find((x) => x.id === id);
        deletedName = item?.name || id;
        db.masterMedicalClinics = db.masterMedicalClinics?.filter((x) => x.id !== id);
      } else if (entityType === "AIRLINE") {
        const item = db.masterAirlines?.find((x) => x.id === id);
        deletedName = item?.name || id;
        db.masterAirlines = db.masterAirlines?.filter((x) => x.id !== id);
      } else if (entityType === "BLK") {
        const item = db.masterBlkLn?.find((x) => x.id === id);
        deletedName = item?.name || id;
        db.masterBlkLn = db.masterBlkLn?.filter((x) => x.id !== id);
      } else if (entityType === "EMBASSY") {
        const item = db.masterEmbassies?.find((x) => x.id === id);
        deletedName = item?.name || id;
        db.masterEmbassies = db.masterEmbassies?.filter((x) => x.id !== id);
      }

      db.auditLogs.unshift({
        id: `aud-${Date.now()}`,
        actorName,
        actorRole: actorRole as UserRole,
        branchName,
        actionType: "MASTER_DATA_UPDATED",
        summary: `Hapus Master Data [${entityType}]: ${deletedName}`,
        details: `Entri data telah dihapus dari database master.`,
        timestamp: nowTimestamp(),
      });

      writeDb(db);
      return NextResponse.json({ ok: true, db });
    }

    // UPDATE / DELETE UNTUK SYARIKAH, KLINIK, SPONSOR, BPJS
    if (action === "UPDATE_FOREIGN_AGENCY") {
      const { id, updates } = body.payload;
      const agn = db.foreignAgencies?.find((x) => x.id === id);
      if (!agn) return NextResponse.json({ ok: false, error: "Agensi tidak ditemukan." }, { status: 404 });
      Object.assign(agn, updates);
      writeDb(db);
      return NextResponse.json({ ok: true, db });
    }

    if (action === "UPDATE_SPONSOR") {
      const { id, updates } = body.payload || {};
      const sp = db.sponsors?.find((x) => x.id === id);
      if (!sp) return NextResponse.json({ ok: false, error: "Sponsor tidak ditemukan." }, { status: 404 });
      Object.assign(sp, updates);
      db.auditLogs.unshift({
        id: `aud-${Date.now()}`,
        actorName: actorName || "Superadmin",
        actorRole: actorRole as UserRole,
        branchName: branchName || "Kantor Pusat Jakarta",
        actionType: "MASTER_DATA_UPDATED",
        summary: `Memperbarui Data Sponsor / PL: ${sp.name} (${sp.code})`,
        details: `Wilayah: ${sp.area} · Kontak: ${sp.phone} · Rekening: ${sp.bankAccount || "-"}`,
        timestamp: nowTimestamp(),
      });
      writeDb(db);
      return NextResponse.json({ ok: true, sponsor: sp, db });
    }

    if (action === "DELETE_SPONSOR") {
      if (!actorCanManageStaff()) {
        return NextResponse.json(
          {
            ok: false,
            error:
              "Akses Ditolak: Hanya Superadmin atau role dengan hak akses kelola data yang dapat menghapus Sponsor / PL.",
          },
          { status: 403 }
        );
      }
      const { id } = body.payload || {};
      const target = db.sponsors?.find((x) => x.id === id);
      if (!target) {
        return NextResponse.json({ ok: false, error: "Sponsor tidak ditemukan." }, { status: 404 });
      }
      const linkedCandidates = (db.candidates || []).filter((c) => c.sponsorId === id);
      if (linkedCandidates.length > 0) {
        return NextResponse.json(
          {
            ok: false,
            error: `Sponsor '${target.name}' tidak dapat dihapus karena masih tertaut pada ${linkedCandidates.length} data CPMI. Ubah sponsor pada data CPMI terkait terlebih dahulu.`,
          },
          { status: 400 }
        );
      }

      db.sponsors = db.sponsors.filter((x) => x.id !== id);
      db.auditLogs.unshift({
        id: `aud-${Date.now()}`,
        actorName: actorName || "Superadmin",
        actorRole: actorRole as UserRole,
        branchName: branchName || "Kantor Pusat Jakarta",
        actionType: "MASTER_DATA_UPDATED",
        summary: `Menghapus Data Sponsor / PL: ${target.name} (${target.code})`,
        details: `Wilayah: ${target.area} · Kontak: ${target.phone}`,
        timestamp: nowTimestamp(),
      });
      writeDb(db);
      return NextResponse.json({ ok: true, deletedId: id, db });
    }

    if (action === "UPDATE_MEDICAL_CLINIC") {
      const { id, updates } = body.payload;
      const cl = db.medicalClinics?.find((x) => x.id === id);
      if (!cl) return NextResponse.json({ ok: false, error: "Klinik tidak ditemukan." }, { status: 404 });
      Object.assign(cl, updates);
      writeDb(db);
      return NextResponse.json({ ok: true, db });
    }

    if (action === "UPDATE_BPJS_FINANCING") {
      const { id, updates } = body.payload;
      const bp = db.bpjsFinancingPartners?.find((x) => x.id === id);
      if (!bp) return NextResponse.json({ ok: false, error: "Mitra BPJS/Bank tidak ditemukan." }, { status: 404 });
      Object.assign(bp, updates);
      writeDb(db);
      return NextResponse.json({ ok: true, db });
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
