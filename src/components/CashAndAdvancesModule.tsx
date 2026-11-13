"use client";

import React, { useState } from "react";
import {
  Coins,
  ArrowDownLeft,
  ArrowUpRight,
  Wallet,
  Receipt,
  Plus,
  Search,
  Filter,
  DollarSign,
  Building2,
  Users,
  Calendar,
  CheckCircle2,
  Clock,
  Lock,
  Edit3,
  CreditCard,
  Banknote,
  FileText,
  Printer,
  X,
} from "lucide-react";
import {
  Branch,
  Candidate,
  CashAdvance,
  CashJournal,
  CashJournalCategory,
  CashTransactionType,
  ForeignAgency,
  Sponsor,
  StaffAccount,
  SyarikahInvoice,
  UserRole,
} from "@/lib/types";

interface CashAndAdvancesModuleProps {
  cashJournals: CashJournal[];
  cashAdvances: CashAdvance[];
  syarikahInvoices: SyarikahInvoice[];
  sponsors: Sponsor[];
  staffAccounts: StaffAccount[];
  candidates: Candidate[];
  branches: Branch[];
  foreignAgencies?: ForeignAgency[];
  isBranchViewOnly: boolean;
  actorRole: UserRole;
  actorName: string;
  onRefreshDb: () => void;
}

export default function CashAndAdvancesModule({
  cashJournals,
  cashAdvances,
  syarikahInvoices,
  sponsors,
  staffAccounts,
  candidates,
  branches,
  foreignAgencies = [],
  isBranchViewOnly,
  actorRole,
  actorName,
  onRefreshDb,
}: CashAndAdvancesModuleProps) {
  const [activeSubTab, setActiveSubTab] = useState<"jurnal" | "kasbon" | "invoice">("jurnal");

  // Modal Jurnal Kas
  const [showAddJournalModal, setShowAddJournalModal] = useState(false);
  const [journalForm, setJournalForm] = useState({
    type: "MASUK" as CashTransactionType,
    category: "INVOICE_WAKALAH" as CashJournalCategory,
    amount: 0,
    recipientOrPayer: "",
    description: "",
    paymentMethod: "BANK_TRANSFER" as "BANK_TRANSFER" | "CASH" | "GIRO",
    bankAccountName: "BSI Rek. 7192830192 a/n PT Panca Banyu Ajisakti",
    referenceNumber: "",
    branchId: "br-jkt",
  });

  // Modal Kasbon Baru
  const [showAddAdvanceModal, setShowAddAdvanceModal] = useState(false);
  const [advanceForm, setAdvanceForm] = useState({
    borrowerType: "SPONSOR" as "SPONSOR" | "STAF",
    borrowerId: sponsors[0]?.id || "",
    borrowerName: sponsors[0]?.name || "",
    amount: 0,
    reason: "",
    dateGiven: new Date().toISOString().split("T")[0],
  });

  // Modal Pelunasan Kasbon
  const [showRepayModal, setShowRepayModal] = useState(false);
  const [selectedAdvance, setSelectedAdvance] = useState<CashAdvance | null>(null);
  const [repayAmount, setRepayAmount] = useState(0);
  const [repayNote, setRepayNote] = useState("Dipotong langsung dari pencairan DP1 Komisi");

  // Modal Invoice Syarikah
  const [showAddInvoiceModal, setShowAddInvoiceModal] = useState(false);
  const [invoiceForm, setInvoiceForm] = useState({
    invoiceNumber: `INV-PBA/SAR/2026/0${syarikahInvoices.length + 1}`,
    syarikahName:
      foreignAgencies[0]?.name || "Al-Maharah Human Resources Co. (ARCO / SPSK)",
    destinationCountry: (foreignAgencies[0]?.country || "Arab Saudi") as string,
    candidateCount: 3,
    currency: "SAR" as "SAR" | "USD" | "IDR",
    totalAmount: 15000,
    dueDate: new Date(Date.now() + 15 * 86400000).toISOString().split("T")[0],
    notes: "Invoice termin 1 recruitment fee & proses visa penempatan SPSK",
  });

  // Modal Bayar Invoice Syarikah
  const [showPayInvoiceModal, setShowPayInvoiceModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<SyarikahInvoice | null>(null);
  const [payInvoiceAmount, setPayInvoiceAmount] = useState(0);

  // Modal Cetak Laporan Harian Petty Cash (F4/A4) Format Excel PT Panca
  const [showPettyCashModal, setShowPettyCashModal] = useState(false);
  const [pettyCashDate, setPettyCashDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [pettyCashDataSource, setPettyCashDataSource] = useState<"LIVE" | "EXCEL_DEMO">("LIVE");
  const [pettyCashDateFilter, setPettyCashDateFilter] = useState<"SELECTED_DATE" | "ALL">("ALL");
  const [pettyCashOpeningBalance, setPettyCashOpeningBalance] = useState<number>(15000000.87);
  const [pettyCashPaperSize, setPettyCashPaperSize] = useState<"F4" | "A4">("F4");

  // Nama Pembuat Laporan (Dinamis Berdasarkan Login: TIKFI & TAUFIK pada role Keuangan)
  const defaultPettyCashCreator = React.useMemo(() => {
    const raw = String(actorName || "").trim().toUpperCase();
    if (raw.includes("TAUFIK")) return "TAUFIK";
    if (raw.includes("TIKFI") || raw.includes("TIFKI")) return "TIKFI";
    return raw || "TIKFI";
  }, [actorName]);

  const [pettyCashCreator, setPettyCashCreator] = useState(defaultPettyCashCreator);
  const [pettyCashApprover, setPettyCashApprover] = useState("MOH. KOSIM");

  React.useEffect(() => {
    setPettyCashCreator(defaultPettyCashCreator);
  }, [defaultPettyCashCreator]);

  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Perhitungan Ringkasan Kas
  const totalKasMasuk = cashJournals
    .filter((j) => j.type === "MASUK")
    .reduce((acc, curr) => acc + curr.amount, 0);

  const totalKasKeluar = cashJournals
    .filter((j) => j.type === "KELUAR")
    .reduce((acc, curr) => acc + curr.amount, 0);

  const saldoKasBersih = totalKasMasuk - totalKasKeluar;

  // Perhitungan Ringkasan Kasbon
  const totalKasbonDiberikan = cashAdvances.reduce((acc, curr) => acc + curr.amount, 0);
  const totalKasbonSisa = cashAdvances.reduce((acc, curr) => acc + curr.remainingAmount, 0);
  const totalKasbonTerlunaskan = totalKasbonDiberikan - totalKasbonSisa;
  const activeSponsorKasbonSisa = cashAdvances
    .filter((a) => a.borrowerType === "SPONSOR" && a.status !== "LUNAS")
    .reduce((acc, curr) => acc + curr.remainingAmount, 0);

  // Ringkasan Sinkronisasi Real-Time dengan Modul Keuangan & Fee Sponsor
  const totalSponsorFeeCair = candidates.reduce((acc, c) => {
    const paid = (c.finance?.sponsorInstallments || [])
      .filter((i) => i.status === "PAID")
      .reduce((sum, i) => sum + i.amount, 0);
    return acc + paid;
  }, 0);
  const totalSponsorFeeTerutang = candidates.reduce((acc, c) => {
    const totalFee = Math.max(
      c.sponsorCommission || 0,
      (c.finance?.sponsorInstallments || []).reduce((sum, i) => sum + i.amount, 0)
    );
    const paid = (c.finance?.sponsorInstallments || [])
      .filter((i) => i.status === "PAID")
      .reduce((sum, i) => sum + i.amount, 0);
    return acc + Math.max(0, totalFee - paid);
  }, 0);

  // Perhitungan Ringkasan Invoice Syarikah (SAR)
  const totalTagihanSyarikahSar = syarikahInvoices
    .filter((i) => i.currency === "SAR")
    .reduce((acc, curr) => acc + curr.totalAmount, 0);

  const totalTerbayarSyarikahSar = syarikahInvoices
    .filter((i) => i.currency === "SAR")
    .reduce((acc, curr) => acc + curr.paidAmount, 0);

  const sisaPiutangSyarikahSar = totalTagihanSyarikahSar - totalTerbayarSyarikahSar;

  // Helper Format Tanggal & Angka Sesuai Template Excel PT Panca
  const formatIndonesianDateHeader = (dateStr: string) => {
    if (!dateStr) return "00 OKTOBER 2026";
    try {
      const d = new Date(dateStr);
      if (Number.isNaN(d.getTime())) return dateStr.toUpperCase();
      const day = String(d.getDate()).padStart(2, "0");
      const months = [
        "JANUARI", "FEBRUARI", "MARET", "APRIL", "MEI", "JUNI",
        "JULI", "AGUSTUS", "SEPTEMBER", "OKTOBER", "NOVEMBER", "DESEMBER"
      ];
      const month = months[d.getMonth()] || "OKTOBER";
      const year = d.getFullYear() || 2026;
      return `${day} ${month} ${year}`;
    } catch {
      return dateStr.toUpperCase();
    }
  };

  const formatExcelCurrency = (val: number): string => {
    if (!val || val === 0) return "";
    return val.toLocaleString("id-ID", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  // Data Contoh Riil Sesuai Screenshot Excel PT Panca
  const demoExcelPettyCash = React.useMemo(() => {
    return {
      incomes: [
        {
          id: "demo-in-1",
          desc: "PANCA BANYU",
          code: "",
          debet: 0,
          kredit: 50000000,
          saldo: 65000000.87,
        },
      ],
      expenses: [
        {
          id: "demo-ex-1",
          desc: "Ahmad A / Sidik Jari Kuningan 3 Org (Siti,Zaenab,Fatimah)",
          code: "",
          debet: 900000,
          kredit: 0,
          saldo: 64100000.87,
        },
        {
          id: "demo-ex-2",
          desc: "Aminah / Dp 3 Org Saudi (Dina, Sahni, Supiati)",
          code: "",
          debet: 15000000,
          kredit: 0,
          saldo: 49100000.87,
        },
        {
          id: "demo-ex-3",
          desc: "Hidayat / Trans Antar Sidik Jari",
          code: "",
          debet: 200000,
          kredit: 0,
          saldo: 48900000.87,
        },
        {
          id: "demo-ex-4",
          desc: "Fira / Kopi+Gula+The",
          code: "",
          debet: 150000,
          kredit: 0,
          saldo: 48750000.87,
        },
        {
          id: "demo-ex-5",
          desc: "Andi / Pelunasan Terbang Saudi 00/00 untuk 2 Org (Nanda, Septi)",
          code: "",
          debet: 18000000,
          kredit: 0,
          saldo: 30750000.87,
        },
      ],
      totalDebet: 34250000,
      totalKredit: 50000000,
      finalSaldo: 30750000.87,
    };
  }, []);

  // Perhitungan Transaksi Petty Cash (Live atau Demo)
  const pettyCashReportData = React.useMemo(() => {
    if (pettyCashDataSource === "EXCEL_DEMO") {
      return {
        incomes: demoExcelPettyCash.incomes,
        expenses: demoExcelPettyCash.expenses,
        totalDebet: demoExcelPettyCash.totalDebet,
        totalKredit: demoExcelPettyCash.totalKredit,
        finalSaldo: demoExcelPettyCash.finalSaldo,
        itemCount: 6,
      };
    }

    let journals = [...cashJournals];
    if (pettyCashDateFilter === "SELECTED_DATE" && pettyCashDate) {
      journals = journals.filter((j) => {
        const d = (j.transactionDate || "").split("T")[0];
        return d === pettyCashDate;
      });
    }

    let running = pettyCashOpeningBalance;

    const incomes = journals
      .filter((j) => j.type === "MASUK")
      .map((j) => {
        running += j.amount;
        return {
          id: j.id,
          desc: j.description || j.recipientOrPayer,
          code: j.referenceNumber || (j.category === "INVOICE_WAKALAH" ? "WAKALAH" : ""),
          debet: 0,
          kredit: j.amount,
          saldo: running,
        };
      });

    const expenses = journals
      .filter((j) => j.type === "KELUAR")
      .map((j) => {
        running -= j.amount;
        return {
          id: j.id,
          desc: j.description || j.recipientOrPayer,
          code: j.referenceNumber || (j.category === "DP_SPONSOR" ? "DP-SPS" : j.category === "PELUNASAN_SPONSOR" ? "LNS-SPS" : j.category === "MEDICAL_PAYMENT" ? "MED" : ""),
          debet: j.amount,
          kredit: 0,
          saldo: running,
        };
      });

    const totalDebet = expenses.reduce((sum, item) => sum + item.debet, 0);
    const totalKredit = incomes.reduce((sum, item) => sum + item.kredit, 0);
    const finalSaldo = running;

    return {
      incomes,
      expenses,
      totalDebet,
      totalKredit,
      finalSaldo,
      itemCount: journals.length,
    };
  }, [pettyCashDataSource, cashJournals, pettyCashDateFilter, pettyCashDate, pettyCashOpeningBalance, demoExcelPettyCash]);

  async function handleSaveJournal(e: React.FormEvent) {
    e.preventDefault();
    if (isBranchViewOnly) {
      alert("Akses Ditolak: Administrasi eksekusi pencatatan kas hanya dapat dilakukan oleh Admin Pusat.");
      return;
    }
    setSaving(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/p3mi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "CREATE_CASH_JOURNAL",
          actorName,
          actorRole,
          payload: journalForm,
        }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Gagal menyimpan transaksi kas.");

      setFeedback({ type: "success", text: "Transaksi kas berhasil dibukukan ke jurnal!" });
      setShowAddJournalModal(false);
      onRefreshDb();
    } catch (err: unknown) {
      setFeedback({ type: "error", text: err instanceof Error ? err.message : "Gagal menyimpan." });
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveAdvance(e: React.FormEvent) {
    e.preventDefault();
    if (isBranchViewOnly) {
      alert("Akses Ditolak: Administrasi eksekusi persetujuan kasbon hanya dapat dilakukan oleh Admin Pusat.");
      return;
    }
    setSaving(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/p3mi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "CREATE_CASH_ADVANCE",
          actorName,
          actorRole,
          payload: advanceForm,
        }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Gagal mencatat pinjaman kasbon.");

      setFeedback({ type: "success", text: "Kasbon baru berhasil disetujui & dicatat!" });
      setShowAddAdvanceModal(false);
      onRefreshDb();
    } catch (err: unknown) {
      setFeedback({ type: "error", text: err instanceof Error ? err.message : "Gagal menyimpan." });
    } finally {
      setSaving(false);
    }
  }

  async function handleRepayAdvance(e: React.FormEvent) {
    e.preventDefault();
    if (isBranchViewOnly) {
      alert("Akses Ditolak: Administrasi eksekusi potong/bayar kasbon hanya dapat dilakukan oleh Admin Pusat.");
      return;
    }
    if (!selectedAdvance) return;
    setSaving(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/p3mi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "REPAY_CASH_ADVANCE",
          actorName,
          actorRole,
          payload: {
            advanceId: selectedAdvance.id,
            amount: repayAmount,
            note: repayNote,
          },
        }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Gagal memproses pembayaran kasbon.");

      setFeedback({ type: "success", text: "Pembayaran / Pemotongan kasbon berhasil dicatat!" });
      setShowRepayModal(false);
      setSelectedAdvance(null);
      onRefreshDb();
    } catch (err: unknown) {
      setFeedback({ type: "error", text: err instanceof Error ? err.message : "Gagal menyimpan." });
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveInvoice(e: React.FormEvent) {
    e.preventDefault();
    if (isBranchViewOnly) {
      alert("Akses Ditolak: Administrasi penagihan invoice hanya dapat dilakukan oleh Admin Pusat.");
      return;
    }
    setSaving(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/p3mi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "CREATE_SYARIKAH_INVOICE",
          actorName,
          actorRole,
          payload: invoiceForm,
        }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Gagal membuat invoice Syarikah.");

      setFeedback({ type: "success", text: "Tagihan Invoice Wakalah berhasil diterbitkan!" });
      setShowAddInvoiceModal(false);
      onRefreshDb();
    } catch (err: unknown) {
      setFeedback({ type: "error", text: err instanceof Error ? err.message : "Gagal menyimpan." });
    } finally {
      setSaving(false);
    }
  }

  async function handlePayInvoice(e: React.FormEvent) {
    e.preventDefault();
    if (isBranchViewOnly) {
      alert("Akses Ditolak: Penerimaan dana invoice hanya dapat dilakukan oleh Admin Pusat.");
      return;
    }
    if (!selectedInvoice) return;
    setSaving(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/p3mi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "UPDATE_SYARIKAH_INVOICE",
          actorName,
          actorRole,
          payload: {
            invoiceId: selectedInvoice.id,
            paidAmountDelta: payInvoiceAmount,
            notes: `Pembayaran termin diterima via BSI Swift Bank (${payInvoiceAmount} ${selectedInvoice.currency})`,
          },
        }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Gagal mencatat pembayaran invoice.");

      setFeedback({ type: "success", text: "Penerimaan termin pembayaran invoice berhasil dicatat!" });
      setShowPayInvoiceModal(false);
      setSelectedInvoice(null);
      onRefreshDb();
    } catch (err: unknown) {
      setFeedback({ type: "error", text: err instanceof Error ? err.message : "Gagal menyimpan." });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Banner Hak Akses Cabang */}
      {isBranchViewOnly && (
        <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-amber-200">
          <div className="flex items-center gap-3">
            <Lock className="h-5 w-5 shrink-0 text-amber-400" />
            <div className="text-sm">
              <span className="font-bold">Mode Pantau Cabang (View-Only): </span>
              Pencatatan kas masuk/keluar, persetujuan kasbon sponsor, dan penagihan invoice Syarikah hanya dapat dieksekusi oleh Bagian Keuangan / Admin Pusat. Cabang memiliki akses pantau transparansi buku kas.
            </div>
          </div>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-700/60 bg-gradient-to-r from-slate-900 via-amber-950/30 to-slate-900 p-6 shadow-xl lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400">
            <Coins className="h-4 w-4" />
            Modul 4: Akuntansi & Arus Kas Bank / Kasbon
          </div>
          <h2 className="mt-1 text-2xl font-black text-white">
            Buku Kas Masuk/Keluar, Kasbon Operasional & Invoice Wakalah
          </h2>
          <p className="mt-1 text-sm text-slate-300">
            Pencatatan real-time arus kas kantor pusat & cabang, pelacakan pinjaman kasbon sponsor/staf dengan sistem potong komisi otomatis, serta invoice dana penempatan Zero Cost dari Syarikah Timur Tengah.
          </p>
        </div>

        {/* Sub-tab Switcher */}
        <div className="flex rounded-xl border border-slate-700 bg-slate-800 p-1">
          <button
            onClick={() => setActiveSubTab("jurnal")}
            className={`rounded-lg px-3.5 py-1.5 text-xs font-bold transition ${
              activeSubTab === "jurnal"
                ? "bg-amber-500 text-slate-950 shadow"
                : "text-slate-300 hover:text-white"
            }`}
          >
            1. Jurnal Kas & Bank
          </button>
          <button
            onClick={() => setActiveSubTab("kasbon")}
            className={`rounded-lg px-3.5 py-1.5 text-xs font-bold transition ${
              activeSubTab === "kasbon"
                ? "bg-amber-500 text-slate-950 shadow"
                : "text-slate-300 hover:text-white"
            }`}
          >
            2. Buku Kasbon ({cashAdvances.length})
          </button>
          <button
            onClick={() => setActiveSubTab("invoice")}
            className={`rounded-lg px-3.5 py-1.5 text-xs font-bold transition ${
              activeSubTab === "invoice"
                ? "bg-amber-500 text-slate-950 shadow"
                : "text-slate-300 hover:text-white"
            }`}
          >
            3. Invoice Syarikah ({syarikahInvoices.length})
          </button>
        </div>
      </div>

      {feedback && (
        <div
          className={`rounded-xl border p-4 text-sm ${
            feedback.type === "success"
              ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-200"
              : "border-rose-500/40 bg-rose-500/10 text-rose-200"
          }`}
        >
          <div className="flex items-center justify-between">
            <span>{feedback.text}</span>
            <button
              onClick={() => setFeedback(null)}
              className="text-xs font-semibold underline hover:text-white"
            >
              Tutup
            </button>
          </div>
        </div>
      )}

      {/* Strip Status Integrasi Real-Time dengan Modul Keuangan & Fee Sponsor */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-500/50 bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 px-4 py-3 text-xs text-slate-100 shadow-lg">
        <div className="flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/40 bg-emerald-600/30 px-2.5 py-1 text-[11px] font-bold text-emerald-200">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-300" />
            Terintegrasi Real-Time · Keuangan & Fee Sponsor
          </span>
          <span>
            Fee Sponsor Cair: <strong className="text-white">Rp {totalSponsorFeeCair.toLocaleString("id-ID")}</strong>
          </span>
          <span className="text-slate-500">·</span>
          <span>
            Sisa Fee Terutang: <strong className="text-amber-300">Rp {totalSponsorFeeTerutang.toLocaleString("id-ID")}</strong>
          </span>
          <span className="text-slate-500">·</span>
          <span>
            Kasbon Sponsor Aktif: <strong className="text-rose-300">Rp {activeSponsorKasbonSisa.toLocaleString("id-ID")}</strong>{" "}
            <span className="text-slate-300">(otomatis terpotong saat bayar termin fee)</span>
          </span>
        </div>
        <span className="text-[11px] font-medium text-emerald-200">
          DP/Pelunasan Sponsor, Biaya HPP Paid, Kasbon & Invoice Wakalah otomatis masuk Jurnal
        </span>
      </div>

      {/* --- SUB-TAB 1: BUKU KAS & BANK (JURNAL) --- */}
      {activeSubTab === "jurnal" && (
        <div className="space-y-6">
          {/* 3 Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-2xl border border-slate-700/60 bg-slate-800/80 p-5 shadow-lg">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase">Total Kas Masuk</span>
                <ArrowDownLeft className="h-5 w-5 text-emerald-400" />
              </div>
              <p className="mt-2 text-2xl font-black text-emerald-400">
                Rp {totalKasMasuk.toLocaleString("id-ID")}
              </p>
              <p className="mt-1 text-[11px] text-slate-400">
                Penerimaan Wakalah Syarikah & Termin Penempatan
              </p>
            </div>

            <div className="rounded-2xl border border-slate-700/60 bg-slate-800/80 p-5 shadow-lg">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase">Total Kas Keluar</span>
                <ArrowUpRight className="h-5 w-5 text-rose-400" />
              </div>
              <p className="mt-2 text-2xl font-black text-rose-400">
                Rp {totalKasKeluar.toLocaleString("id-ID")}
              </p>
              <p className="mt-1 text-[11px] text-slate-400">
                DP Sponsor, Medical, Paspor, BLK & Operasional
              </p>
            </div>

            <div className="rounded-2xl border border-slate-700/60 bg-gradient-to-br from-slate-800 to-slate-900 p-5 shadow-lg">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase">Saldo Kas Bersih</span>
                <Wallet className="h-5 w-5 text-sky-400" />
              </div>
              <p className="mt-2 text-2xl font-black text-sky-400">
                Rp {saldoKasBersih.toLocaleString("id-ID")}
              </p>
              <p className="mt-1 text-[11px] text-slate-400">
                Posisi Kas & Rekening Bank Operasional Aktif
              </p>
            </div>
          </div>

          {/* Tabel Jurnal Arus Kas */}
          <div className="rounded-2xl border border-slate-700/60 bg-slate-800/80 p-6 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-700 pb-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Receipt className="h-5 w-5 text-amber-400" />
                  Buku Jurnal Kas Masuk & Keluar ({cashJournals.length} Transaksi)
                </h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  Seluruh transaksi terhubung dengan rekening bank BSI / BRI serta kwitansi operasional.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowPettyCashModal(true)}
                  className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-md hover:from-teal-400 hover:to-emerald-500 transition cursor-pointer"
                >
                  <Printer className="h-4 w-4" />
                  Cetak Format Laporan Harian Petty Cash (F4/A4)
                </button>

                {!isBranchViewOnly && (
                  <button
                    onClick={() => setShowAddJournalModal(true)}
                    className="flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-amber-400 transition"
                  >
                    <Plus className="h-4 w-4" />
                    Catat Transaksi Kas Masuk / Keluar
                  </button>
                )}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-900/80 text-[10px] uppercase tracking-wider text-slate-400 border-b border-slate-700">
                  <tr>
                    <th className="px-4 py-3">Tanggal</th>
                    <th className="px-4 py-3">Arus Kas</th>
                    <th className="px-4 py-3">Kategori</th>
                    <th className="px-4 py-3">Pihak / Rekening</th>
                    <th className="px-4 py-3">Uraian / Keterangan</th>
                    <th className="px-4 py-3 text-right">Nominal (Rp)</th>
                    <th className="px-4 py-3">Pencatat</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/60">
                  {cashJournals.map((j) => (
                    <tr key={j.id} className="hover:bg-slate-700/40 transition">
                      <td className="px-4 py-3 font-mono text-slate-400 whitespace-nowrap">
                        {j.transactionDate}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-bold ${
                            j.type === "MASUK"
                              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                              : "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                          }`}
                        >
                          {j.type === "MASUK" ? <ArrowDownLeft className="h-3 w-3" /> : <ArrowUpRight className="h-3 w-3" />}
                          {j.type}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="rounded bg-slate-700 px-2 py-0.5 text-[10px] text-slate-200">
                          {j.category}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="font-semibold text-white">{j.recipientOrPayer}</div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {j.bankAccountName || j.paymentMethod}
                        </div>
                      </td>
                      <td className="px-4 py-3 max-w-xs">
                        <p className="line-clamp-1">{j.description}</p>
                        {j.referenceNumber && (
                          <span className="text-[10px] font-mono text-sky-400">
                            Ref: {j.referenceNumber}
                          </span>
                        )}
                      </td>
                      <td
                        className={`px-4 py-3 text-right font-mono font-bold whitespace-nowrap ${
                          j.type === "MASUK" ? "text-emerald-400" : "text-rose-400"
                        }`}
                      >
                        {j.type === "MASUK" ? "+" : "-"} Rp {j.amount.toLocaleString("id-ID")}
                      </td>
                      <td className="px-4 py-3 text-[11px] text-slate-400 whitespace-nowrap">
                        {j.createdBy}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* --- SUB-TAB 2: BUKU KASBON SPONSOR & STAF --- */}
      {activeSubTab === "kasbon" && (
        <div className="space-y-6">
          {/* 3 Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-2xl border border-slate-700/60 bg-slate-800/80 p-5 shadow-lg">
              <span className="text-xs font-bold text-slate-400 uppercase">Total Kasbon Disetujui</span>
              <p className="mt-2 text-2xl font-black text-amber-400">
                Rp {totalKasbonDiberikan.toLocaleString("id-ID")}
              </p>
              <p className="mt-1 text-[11px] text-slate-400">Bantuan transport operasional lapangan</p>
            </div>

            <div className="rounded-2xl border border-slate-700/60 bg-slate-800/80 p-5 shadow-lg">
              <span className="text-xs font-bold text-slate-400 uppercase">Sisa Tagihan Kasbon Aktif</span>
              <p className="mt-2 text-2xl font-black text-rose-400">
                Rp {totalKasbonSisa.toLocaleString("id-ID")}
              </p>
              <p className="mt-1 text-[11px] text-slate-400">Akan dipotong saat termin komisi cair</p>
            </div>

            <div className="rounded-2xl border border-slate-700/60 bg-slate-800/80 p-5 shadow-lg">
              <span className="text-xs font-bold text-slate-400 uppercase">Kasbon Terpotong / Lunas</span>
              <p className="mt-2 text-2xl font-black text-emerald-400">
                Rp {totalKasbonTerlunaskan.toLocaleString("id-ID")}
              </p>
              <p className="mt-1 text-[11px] text-slate-400">Sukses dipotong otomatis dari komisi</p>
            </div>
          </div>

          {/* Tabel Buku Kasbon */}
          <div className="rounded-2xl border border-slate-700/60 bg-slate-800/80 p-6 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-700 pb-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Banknote className="h-5 w-5 text-amber-400" />
                  Daftar Pinjaman Kasbon Sponsor & Staf Lapangan
                </h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  Sistem pemotongan otomatis komisi saat termin DP1, DP2, DP3 atau Pelunasan ditransfer.
                </p>
              </div>

              {!isBranchViewOnly && (
                <button
                  onClick={() => setShowAddAdvanceModal(true)}
                  className="flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-amber-400 transition"
                >
                  <Plus className="h-4 w-4" />
                  Ajukan Kasbon Baru
                </button>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-900/80 text-[10px] uppercase tracking-wider text-slate-400 border-b border-slate-700">
                  <tr>
                    <th className="px-4 py-3">Tgl Pinjam</th>
                    <th className="px-4 py-3">Penerima Kasbon</th>
                    <th className="px-4 py-3">Keperluan / Alasan</th>
                    <th className="px-4 py-3 text-right">Total Pinjaman</th>
                    <th className="px-4 py-3 text-right">Sisa Kasbon</th>
                    <th className="px-4 py-3 text-center">Status</th>
                    <th className="px-4 py-3">Riwayat Pemotongan</th>
                    <th className="px-4 py-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/60">
                  {cashAdvances.map((adv) => (
                    <tr key={adv.id} className="hover:bg-slate-700/40 transition">
                      <td className="px-4 py-3 font-mono text-slate-400 whitespace-nowrap">
                        {adv.dateGiven}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="font-bold text-white">{adv.borrowerName}</div>
                        <span className="rounded bg-slate-700 px-1.5 py-0.2 text-[9px] text-amber-300 font-semibold">
                          {adv.borrowerType}
                        </span>
                      </td>
                      <td className="px-4 py-3 max-w-xs">
                        <p className="line-clamp-1">{adv.reason}</p>
                        <p className="text-[10px] text-slate-400">Disetujui: {adv.approvedBy}</p>
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-white whitespace-nowrap">
                        Rp {adv.amount.toLocaleString("id-ID")}
                      </td>
                      <td
                        className={`px-4 py-3 text-right font-mono font-bold whitespace-nowrap ${
                          adv.remainingAmount > 0 ? "text-rose-400" : "text-emerald-400"
                        }`}
                      >
                        Rp {adv.remainingAmount.toLocaleString("id-ID")}
                      </td>
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            adv.status === "LUNAS"
                              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                              : "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                          }`}
                        >
                          {adv.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 max-w-xs text-[11px]">
                        {adv.deductions.length > 0 ? (
                          <div className="space-y-1">
                            {adv.deductions.map((d) => (
                              <div key={d.id} className="text-slate-400">
                                • {d.date}: -Rp {d.amount.toLocaleString("id-ID")} ({d.note})
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-500 italic">Belum ada pemotongan</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        {adv.remainingAmount > 0 && !isBranchViewOnly ? (
                          <button
                            onClick={() => {
                              setSelectedAdvance(adv);
                              setRepayAmount(adv.remainingAmount);
                              setShowRepayModal(true);
                            }}
                            className="rounded-lg bg-emerald-600 px-3 py-1.5 text-[11px] font-bold text-white hover:bg-emerald-500 transition"
                          >
                            Potong / Bayar
                          </button>
                        ) : (
                          <span className="text-xs text-slate-500">Selesai</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* --- SUB-TAB 3: INVOICE WAKALAH SYARIKAH TIMUR TENGAH --- */}
      {activeSubTab === "invoice" && (
        <div className="space-y-6">
          {/* 3 Metric Cards (SAR) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-2xl border border-slate-700/60 bg-slate-800/80 p-5 shadow-lg">
              <span className="text-xs font-bold text-slate-400 uppercase">Total Invoice Syarikah</span>
              <p className="mt-2 text-2xl font-black text-sky-400">
                SAR {totalTagihanSyarikahSar.toLocaleString("id-ID")}
              </p>
              <p className="mt-1 text-[11px] text-slate-400">Nilai kontrak rekrutmen penempatan (SPSK)</p>
            </div>

            <div className="rounded-2xl border border-slate-700/60 bg-slate-800/80 p-5 shadow-lg">
              <span className="text-xs font-bold text-slate-400 uppercase">Sudah Diterima (Paid)</span>
              <p className="mt-2 text-2xl font-black text-emerald-400">
                SAR {totalTerbayarSyarikahSar.toLocaleString("id-ID")}
              </p>
              <p className="mt-1 text-[11px] text-slate-400">Masuk ke rekening BSI Syariah P3MI</p>
            </div>

            <div className="rounded-2xl border border-slate-700/60 bg-slate-800/80 p-5 shadow-lg">
              <span className="text-xs font-bold text-slate-400 uppercase">Sisa Piutang (Pending)</span>
              <p className="mt-2 text-2xl font-black text-amber-400">
                SAR {sisaPiutangSyarikahSar.toLocaleString("id-ID")}
              </p>
              <p className="mt-1 text-[11px] text-slate-400">Jatuh tempo saat visa stamped / tiket issued</p>
            </div>
          </div>

          {/* Tabel Invoice Syarikah */}
          <div className="rounded-2xl border border-slate-700/60 bg-slate-800/80 p-6 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-700 pb-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <FileText className="h-5 w-5 text-sky-400" />
                  Daftar Tagihan Invoice Wakalah Syarikah Timur Tengah ({syarikahInvoices.length} Invoice)
                </h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  Penagihan resmi biaya penempatan Zero Cost ke Syarikah Mitra (Maharah, SMASCO, dll.).
                </p>
              </div>

              {!isBranchViewOnly && (
                <button
                  onClick={() => setShowAddInvoiceModal(true)}
                  className="flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2 text-xs font-bold text-white hover:bg-sky-500 transition"
                >
                  <Plus className="h-4 w-4" />
                  Terbitkan Invoice Baru
                </button>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-900/80 text-[10px] uppercase tracking-wider text-slate-400 border-b border-slate-700">
                  <tr>
                    <th className="px-4 py-3">No. Invoice</th>
                    <th className="px-4 py-3">Syarikah & Negara</th>
                    <th className="px-4 py-3">Kandidat</th>
                    <th className="px-4 py-3 text-right">Total Tagihan</th>
                    <th className="px-4 py-3 text-right">Sudah Dibayar</th>
                    <th className="px-4 py-3 text-center">Status</th>
                    <th className="px-4 py-3">Jatuh Tempo</th>
                    <th className="px-4 py-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/60">
                  {syarikahInvoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-700/40 transition">
                      <td className="px-4 py-3 font-mono font-bold text-sky-400 whitespace-nowrap">
                        {inv.invoiceNumber}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="font-bold text-white">{inv.syarikahName}</div>
                        <div className="text-[10px] text-slate-400">{inv.destinationCountry}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-bold text-white">{inv.candidateCount} CPMI</span>
                        <p className="text-[10px] text-slate-400 line-clamp-1">
                          {inv.candidateNames?.join(", ")}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-white whitespace-nowrap">
                        {inv.currency} {inv.totalAmount.toLocaleString("id-ID")}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-emerald-400 whitespace-nowrap">
                        {inv.currency} {inv.paidAmount.toLocaleString("id-ID")}
                      </td>
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            inv.status === "PAID"
                              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                              : inv.status === "PARTIAL"
                              ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                              : "bg-sky-500/20 text-sky-300 border border-sky-500/40"
                          }`}
                        >
                          {inv.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-400 whitespace-nowrap">
                        {inv.dueDate}
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        {inv.paidAmount < inv.totalAmount && !isBranchViewOnly ? (
                          <button
                            onClick={() => {
                              setSelectedInvoice(inv);
                              setPayInvoiceAmount(inv.totalAmount - inv.paidAmount);
                              setShowPayInvoiceModal(true);
                            }}
                            className="rounded-lg bg-emerald-600 px-3 py-1.5 text-[11px] font-bold text-white hover:bg-emerald-500 transition"
                          >
                            Catat Termin Masuk
                          </button>
                        ) : (
                          <span className="text-xs text-emerald-400 font-bold">Lunas 100%</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL CATAT JURNAL KAS --- */}
      {showAddJournalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-700 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Receipt className="h-5 w-5 text-amber-400" />
                Catat Transaksi Kas & Bank
              </h3>
              <button onClick={() => setShowAddJournalModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleSaveJournal} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Jenis Arus Kas</label>
                  <select
                    value={journalForm.type}
                    onChange={(e) => setJournalForm({ ...journalForm, type: e.target.value as any })}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white font-bold"
                  >
                    <option value="MASUK">KAS MASUK (+)</option>
                    <option value="KELUAR">KAS KELUAR (-)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Kategori Transaksi</label>
                  <select
                    value={journalForm.category}
                    onChange={(e) => setJournalForm({ ...journalForm, category: e.target.value as any })}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white"
                  >
                    <option value="INVOICE_WAKALAH">Penerimaan Invoice Wakalah Syarikah</option>
                    <option value="DP_SPONSOR">Pembayaran DP Komisi Sponsor</option>
                    <option value="PELUNASAN_SPONSOR">Pelunasan Komisi Sponsor</option>
                    <option value="MEDICAL_PAYMENT">Biaya Medical Gamca / Wafid</option>
                    <option value="PASPOR_PAYMENT">Biaya PNBP Paspor Kanim</option>
                    <option value="BLK_TRAINING">Biaya Pelatihan BLK-LN</option>
                    <option value="TIKET_FLIGHT">Biaya Tiket Pesawat Saudia / Emirates</option>
                    <option value="KASBON_SPONSOR">Penyaluran Kasbon Sponsor</option>
                    <option value="OPERASIONAL_KANTOR">Operasional Kantor & Cabang</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Nominal (Rupiah)</label>
                <input
                  type="number"
                  required
                  min="1000"
                  value={journalForm.amount}
                  onChange={(e) => setJournalForm({ ...journalForm, amount: Number(e.target.value) })}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white font-mono text-sm font-bold"
                  placeholder="Contoh: 3000000"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Pihak Penerima / Penyetor</label>
                <input
                  type="text"
                  required
                  value={journalForm.recipientOrPayer}
                  onChange={(e) => setJournalForm({ ...journalForm, recipientOrPayer: e.target.value })}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white"
                  placeholder="Contoh: H. Salimudin (Sponsor) / Maharah HR"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Metode & Rekening Bank</label>
                <input
                  type="text"
                  required
                  value={journalForm.bankAccountName}
                  onChange={(e) => setJournalForm({ ...journalForm, bankAccountName: e.target.value })}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white"
                  placeholder="BSI Rek. 7192830192 a/n PT Panca Banyu Ajisakti"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Uraian / Keterangan Transaksi</label>
                <textarea
                  rows={2}
                  required
                  value={journalForm.description}
                  onChange={(e) => setJournalForm({ ...journalForm, description: e.target.value })}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white"
                  placeholder="Uraian pembayaran atau tanda bukti"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-700">
                <button
                  type="button"
                  onClick={() => setShowAddJournalModal(false)}
                  className="rounded-lg border border-slate-600 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-amber-500 px-5 py-2 text-xs font-bold text-slate-950 hover:bg-amber-400 disabled:opacity-50"
                >
                  {saving ? "Menyimpan..." : "Simpan ke Jurnal"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL AJUKAN KASBON --- */}
      {showAddAdvanceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-700 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Banknote className="h-5 w-5 text-amber-400" />
                Pengajuan Pinjaman Kasbon Baru
              </h3>
              <button onClick={() => setShowAddAdvanceModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleSaveAdvance} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Jenis Peminjam</label>
                  <select
                    value={advanceForm.borrowerType}
                    onChange={(e) => setAdvanceForm({ ...advanceForm, borrowerType: e.target.value as any })}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white font-bold"
                  >
                    <option value="SPONSOR">Mitra Sponsor / PL</option>
                    <option value="STAF">Staf Lapangan / Kantor</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Nama Peminjam</label>
                  <input
                    type="text"
                    required
                    value={advanceForm.borrowerName}
                    onChange={(e) => setAdvanceForm({ ...advanceForm, borrowerName: e.target.value })}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white"
                    placeholder="Nama Sponsor / Petugas"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Jumlah Kasbon (Rp)</label>
                <input
                  type="number"
                  required
                  min="50000"
                  value={advanceForm.amount}
                  onChange={(e) => setAdvanceForm({ ...advanceForm, amount: Number(e.target.value) })}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white font-mono text-sm font-bold"
                  placeholder="2500000"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Keperluan / Alasan Pinjaman</label>
                <textarea
                  rows={2}
                  required
                  value={advanceForm.reason}
                  onChange={(e) => setAdvanceForm({ ...advanceForm, reason: e.target.value })}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white"
                  placeholder="Bantuan operasional rekrutmen CPMI wilayah Indramayu"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-700">
                <button
                  type="button"
                  onClick={() => setShowAddAdvanceModal(false)}
                  className="rounded-lg border border-slate-600 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-amber-500 px-5 py-2 text-xs font-bold text-slate-950 hover:bg-amber-400 disabled:opacity-50"
                >
                  {saving ? "Menyetujui..." : "Setujui & Cairkan Kasbon"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL PELUNASAN KASBON --- */}
      {showRepayModal && selectedAdvance && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-700 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Wallet className="h-5 w-5 text-emerald-400" />
                Potong / Bayar Kasbon
              </h3>
              <button onClick={() => setShowRepayModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleRepayAdvance} className="space-y-4 text-xs">
              <div className="rounded-lg border border-slate-700 bg-slate-800 p-3 space-y-1">
                <p className="font-bold text-white">{selectedAdvance.borrowerName}</p>
                <p className="text-slate-400">Total Pinjaman: Rp {selectedAdvance.amount.toLocaleString("id-ID")}</p>
                <p className="text-rose-400 font-bold">Sisa Kasbon Saat Ini: Rp {selectedAdvance.remainingAmount.toLocaleString("id-ID")}</p>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Nominal Pembayaran / Potongan (Rp)</label>
                <input
                  type="number"
                  required
                  min="1000"
                  max={selectedAdvance.remainingAmount}
                  value={repayAmount}
                  onChange={(e) => setRepayAmount(Number(e.target.value))}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white font-mono text-sm font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Catatan Pemotongan</label>
                <input
                  type="text"
                  required
                  value={repayNote}
                  onChange={(e) => setRepayNote(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white"
                  placeholder="Dipotong dari pencairan DP1 Komisi"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-700">
                <button
                  type="button"
                  onClick={() => setShowRepayModal(false)}
                  className="rounded-lg border border-slate-600 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-emerald-600 px-5 py-2 text-xs font-bold text-white hover:bg-emerald-500 disabled:opacity-50"
                >
                  {saving ? "Memproses..." : "Konfirmasi Potong Kasbon"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL BUAT INVOICE SYARIKAH --- */}
      {showAddInvoiceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-700 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <FileText className="h-5 w-5 text-sky-400" />
                Terbitkan Invoice Wakalah Syarikah Baru
              </h3>
              <button onClick={() => setShowAddInvoiceModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleSaveInvoice} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Nomor Invoice Resmi</label>
                <input
                  type="text"
                  required
                  value={invoiceForm.invoiceNumber}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, invoiceNumber: e.target.value })}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Nama Syarikah (Master Data)
                  </label>
                  <select
                    required
                    value={invoiceForm.syarikahName}
                    onChange={(e) => {
                      const val = e.target.value;
                      const matched = foreignAgencies.find((a) => a.name === val);
                      setInvoiceForm({
                        ...invoiceForm,
                        syarikahName: val,
                        destinationCountry:
                          matched?.country || invoiceForm.destinationCountry,
                      });
                    }}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white font-semibold"
                  >
                    {foreignAgencies.map((a) => (
                      <option key={a.id} value={a.name}>
                        {a.name} — {a.country} ({a.code})
                        {a.status !== "ACTIVE" ? ` [${a.status}]` : ""}
                      </option>
                    ))}
                    {invoiceForm.syarikahName &&
                      !foreignAgencies.some((a) => a.name === invoiceForm.syarikahName) && (
                        <option value={invoiceForm.syarikahName}>
                          {invoiceForm.syarikahName}
                        </option>
                      )}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Negara Tujuan</label>
                  <input
                    type="text"
                    required
                    value={invoiceForm.destinationCountry}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, destinationCountry: e.target.value })}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Mata Uang</label>
                  <select
                    value={invoiceForm.currency}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, currency: e.target.value as any })}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white font-bold"
                  >
                    <option value="SAR">SAR (Riyal Arab Saudi)</option>
                    <option value="USD">USD (Dollar AS)</option>
                    <option value="IDR">IDR (Rupiah)</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-slate-300 font-semibold mb-1">Total Tagihan ({invoiceForm.currency})</label>
                  <input
                    type="number"
                    required
                    min="100"
                    value={invoiceForm.totalAmount}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, totalAmount: Number(e.target.value) })}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white font-mono text-sm font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Jumlah CPMI</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={invoiceForm.candidateCount}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, candidateCount: Number(e.target.value) })}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Tanggal Jatuh Tempo</label>
                  <input
                    type="date"
                    required
                    value={invoiceForm.dueDate}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, dueDate: e.target.value })}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Keterangan / Catatan Termin</label>
                <textarea
                  rows={2}
                  value={invoiceForm.notes}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, notes: e.target.value })}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-700">
                <button
                  type="button"
                  onClick={() => setShowAddInvoiceModal(false)}
                  className="rounded-lg border border-slate-600 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-sky-600 px-5 py-2 text-xs font-bold text-white hover:bg-sky-500 disabled:opacity-50"
                >
                  {saving ? "Menerbitkan..." : "Terbitkan Invoice"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL BAYAR INVOICE SYARIKAH --- */}
      {showPayInvoiceModal && selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-700 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-emerald-400" />
                Catat Pembayaran Termin Invoice
              </h3>
              <button onClick={() => setShowPayInvoiceModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handlePayInvoice} className="space-y-4 text-xs">
              <div className="rounded-lg border border-slate-700 bg-slate-800 p-3 space-y-1">
                <p className="font-bold text-sky-400">{selectedInvoice.invoiceNumber}</p>
                <p className="font-bold text-white">{selectedInvoice.syarikahName}</p>
                <p className="text-slate-400">Total Invoice: {selectedInvoice.currency} {selectedInvoice.totalAmount.toLocaleString("id-ID")}</p>
                <p className="text-amber-400 font-bold">
                  Sisa Belum Dibayar: {selectedInvoice.currency} {(selectedInvoice.totalAmount - selectedInvoice.paidAmount).toLocaleString("id-ID")}
                </p>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Nominal Diterima ({selectedInvoice.currency})
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  max={selectedInvoice.totalAmount - selectedInvoice.paidAmount}
                  value={payInvoiceAmount}
                  onChange={(e) => setPayInvoiceAmount(Number(e.target.value))}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white font-mono text-sm font-bold"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-700">
                <button
                  type="button"
                  onClick={() => setShowPayInvoiceModal(false)}
                  className="rounded-lg border border-slate-600 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-emerald-600 px-5 py-2 text-xs font-bold text-white hover:bg-emerald-500 disabled:opacity-50"
                >
                  {saving ? "Memproses..." : "Konfirmasi Penerimaan Dana"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL CETAK FORMAT LAPORAN HARIAN PETTY CASH (F4/A4) FORMAT EXCEL PT PANCA --- */}
      {showPettyCashModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-2 sm:p-4 backdrop-blur-sm overflow-y-auto print:static print:bg-white print:p-0 print:backdrop-blur-none print:overflow-visible">
          <div className="relative w-full max-w-5xl rounded-2xl border border-slate-700 bg-slate-900 p-4 sm:p-6 shadow-2xl text-white print:border-none print:bg-white print:p-0 print:shadow-none print:text-black">
            {/* Header Kontrol Modal (Disembunyikan Saat Dicetak) */}
            <div className="flex flex-col gap-3 border-b border-slate-700 pb-4 print:hidden">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                    <Printer className="h-5 w-5 text-teal-400" />
                    Cetak Format Laporan Harian Petty Cash (F4/A4)
                  </h3>
                  <p className="text-xs text-slate-300">
                    Format resmi operasional kas kecil PT. Panca Banyu Ajisakti (identik format Excel pembukuan manual).
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPettyCashModal(false)}
                  className="rounded-lg bg-slate-800 p-1.5 text-slate-400 hover:bg-slate-700 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Panel Kontrol & Filter Pengaturan Laporan */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 rounded-xl border border-slate-700/80 bg-slate-800/90 p-3.5 text-xs">
                {/* 1. Sumber Data */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Sumber Data Transaksi:
                  </label>
                  <select
                    value={pettyCashDataSource}
                    onChange={(e) => setPettyCashDataSource(e.target.value as "LIVE" | "EXCEL_DEMO")}
                    className="w-full rounded-lg border border-slate-600 bg-slate-900 px-2.5 py-1.5 text-xs text-white"
                  >
                    <option value="LIVE">Live Jurnal Kas Sistem ({cashJournals.length} Transaksi)</option>
                    <option value="EXCEL_DEMO">⚡ Contoh Excel PT. Panca (Demo)</option>
                  </select>
                </div>

                {/* 2. Filter Tanggal & Saldo Awal */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Tanggal Laporan:
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="date"
                      value={pettyCashDate}
                      onChange={(e) => setPettyCashDate(e.target.value)}
                      className="w-full rounded-lg border border-slate-600 bg-slate-900 px-2.5 py-1.5 text-xs text-white font-mono"
                    />
                    {pettyCashDataSource === "LIVE" && (
                      <select
                        value={pettyCashDateFilter}
                        onChange={(e) => setPettyCashDateFilter(e.target.value as "SELECTED_DATE" | "ALL")}
                        className="rounded-lg border border-slate-600 bg-slate-900 px-2 py-1.5 text-[11px] text-white"
                      >
                        <option value="SELECTED_DATE">Hari Ini</option>
                        <option value="ALL">Semua</option>
                      </select>
                    )}
                  </div>
                </div>

                {/* 3. Saldo Awal / Sisa Saldo Kemarin */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Sisa Saldo Awal (Rp):
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={pettyCashOpeningBalance}
                    onChange={(e) => setPettyCashOpeningBalance(Number(e.target.value))}
                    className="w-full rounded-lg border border-slate-600 bg-slate-900 px-2.5 py-1.5 text-xs text-white font-mono"
                  />
                </div>

                {/* 4. Pembuat & Penyetuju */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Yang Membuat (Staff Keuangan):
                  </label>
                  <div className="flex items-center gap-1">
                    <select
                      value={pettyCashCreator}
                      onChange={(e) => setPettyCashCreator(e.target.value)}
                      className="w-full rounded-lg border border-slate-600 bg-slate-900 px-2.5 py-1.5 text-xs font-bold text-amber-300"
                    >
                      <option value="TIKFI">TIKFI (Staff Keuangan)</option>
                      <option value="TAUFIK">TAUFIK (Staff Keuangan)</option>
                      {defaultPettyCashCreator !== "TIKFI" && defaultPettyCashCreator !== "TAUFIK" && (
                        <option value={defaultPettyCashCreator}>{defaultPettyCashCreator} (Login Anda)</option>
                      )}
                    </select>
                  </div>
                </div>
              </div>

              {/* Action Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <div className="flex items-center gap-2 text-xs">
                  <span className="font-semibold text-slate-300">Format Kertas:</span>
                  <div className="inline-flex rounded-lg border border-slate-700 bg-slate-800 p-0.5">
                    <button
                      type="button"
                      onClick={() => setPettyCashPaperSize("F4")}
                      className={`rounded px-2.5 py-1 text-xs font-bold transition ${
                        pettyCashPaperSize === "F4" ? "bg-teal-500 text-slate-950" : "text-slate-300 hover:text-white"
                      }`}
                    >
                      F4 / Folio (215 x 330 mm)
                    </button>
                    <button
                      type="button"
                      onClick={() => setPettyCashPaperSize("A4")}
                      className={`rounded px-2.5 py-1 text-xs font-bold transition ${
                        pettyCashPaperSize === "A4" ? "bg-teal-500 text-slate-950" : "text-slate-300 hover:text-white"
                      }`}
                    >
                      A4 (210 x 297 mm)
                    </button>
                  </div>
                  <span className="text-[11px] text-slate-400">
                    Penyetuju Default: <strong className="text-white">{pettyCashApprover}</strong> (Pimpinan PT. Panca)
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 px-5 py-2.5 text-xs font-extrabold text-white shadow-lg hover:from-teal-400 hover:to-emerald-500 transition cursor-pointer"
                  >
                    <Printer className="h-4 w-4" />
                    🖨️ Cetak / Simpan PDF ({pettyCashPaperSize})
                  </button>
                </div>
              </div>
            </div>

            {/* AREA LEMBAR CETAK PETTY CASH (IDENTIK 100% PERSIS FORMAT EXCEL MANUAL PT PANCA BANYU AJISAKTI) */}
            <div className="mt-4 max-h-[70vh] overflow-y-auto rounded-xl bg-slate-100 p-3 sm:p-6 print:max-h-none print:overflow-visible print:bg-white print:p-0">
              <div
                className={`petty-cash-sheet mx-auto bg-white p-6 sm:p-10 font-sans text-slate-950 shadow-xl border border-slate-300 print:shadow-none print:border-none print:p-4 ${
                  pettyCashPaperSize === "F4" ? "max-w-[850px]" : "max-w-[800px]"
                }`}
              >
                {/* 1. KOP JUDUL LAPORAN IDENTIK EXCEL */}
                <div className="text-center font-serif leading-tight text-black">
                  <h1 className="text-base sm:text-lg font-bold tracking-wider uppercase underline">
                    LAPORAN HARIAN
                  </h1>
                  <h2 className="text-sm sm:text-base font-bold tracking-wide mt-0.5">
                    PT. Panca Banyu Ajisakti
                  </h2>
                  <h3 className="text-xs sm:text-sm font-bold tracking-wide mt-0.5 uppercase">
                    PENGELUARAN PETTY CASH {formatIndonesianDateHeader(pettyCashDate)}
                  </h3>
                </div>

                {/* 2. TABEL DATA PETTY CASH IDENTIK EXCEL */}
                <div className="mt-6 overflow-x-auto">
                  <table className="w-full border-collapse border border-black text-xs font-sans text-black">
                    <thead>
                      <tr className="border-b border-black font-bold text-center bg-slate-50 print:bg-transparent">
                        <th className="border border-black px-3 py-2 w-[44%] text-center uppercase">
                          KETERANGAN
                        </th>
                        <th className="border border-black px-2 py-2 w-[10%] text-center uppercase">
                          CODE
                        </th>
                        <th className="border border-black px-3 py-2 w-[15%] text-center uppercase">
                          DEBET
                        </th>
                        <th className="border border-black px-3 py-2 w-[15%] text-center uppercase">
                          KREDIT
                        </th>
                        <th className="border border-black px-3 py-2 w-[16%] text-center uppercase">
                          SALDO
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {/* Baris Sisa Saldo Kemarin */}
                      <tr className="border-b border-black">
                        <td className="border border-black px-3 py-1.5 font-medium">
                          Sisa Saldo {formatIndonesianDateHeader(pettyCashDate)}
                        </td>
                        <td className="border border-black px-2 py-1.5 text-center font-mono"></td>
                        <td className="border border-black px-3 py-1.5 text-right font-mono"></td>
                        <td className="border border-black px-3 py-1.5 text-right font-mono"></td>
                        <td className="border border-black px-3 py-1.5 text-right font-mono font-medium">
                          {formatExcelCurrency(pettyCashOpeningBalance)}
                        </td>
                      </tr>

                      {/* Baris Kosong Pemisah */}
                      <tr className="border-b border-black h-5">
                        <td className="border border-black"></td>
                        <td className="border border-black"></td>
                        <td className="border border-black"></td>
                        <td className="border border-black"></td>
                        <td className="border border-black"></td>
                      </tr>

                      {/* Header PEMASUKAN */}
                      <tr className="border-b border-black font-bold">
                        <td className="border border-black px-3 py-1.5 text-center tracking-wider">
                          PEMASUKAN
                        </td>
                        <td className="border border-black"></td>
                        <td className="border border-black"></td>
                        <td className="border border-black"></td>
                        <td className="border border-black"></td>
                      </tr>

                      {/* Data Pemasukan */}
                      {pettyCashReportData.incomes.length > 0 ? (
                        pettyCashReportData.incomes.map((inc) => (
                          <tr key={inc.id} className="border-b border-black">
                            <td className="border border-black px-3 py-1.5">
                              {inc.desc}
                            </td>
                            <td className="border border-black px-2 py-1.5 text-center font-mono text-[11px]">
                              {inc.code || "-"}
                            </td>
                            <td className="border border-black px-3 py-1.5 text-right font-mono">
                              {inc.debet > 0 ? formatExcelCurrency(inc.debet) : ""}
                            </td>
                            <td className="border border-black px-3 py-1.5 text-right font-mono font-medium">
                              {formatExcelCurrency(inc.kredit)}
                            </td>
                            <td className="border border-black px-3 py-1.5 text-right font-mono font-medium">
                              {formatExcelCurrency(inc.saldo)}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr className="border-b border-black text-slate-400">
                          <td className="border border-black px-3 py-1.5 italic text-center text-[11px]">
                            (Tidak ada transaksi pemasukan kas pada periode ini)
                          </td>
                          <td className="border border-black text-center">-</td>
                          <td className="border border-black"></td>
                          <td className="border border-black text-right font-mono">-</td>
                          <td className="border border-black text-right font-mono">
                            {formatExcelCurrency(pettyCashOpeningBalance)}
                          </td>
                        </tr>
                      )}

                      {/* Header PENGELUARAN */}
                      <tr className="border-b border-black font-bold">
                        <td className="border border-black px-3 py-1.5 text-center tracking-wider">
                          PENGELUARAN
                        </td>
                        <td className="border border-black"></td>
                        <td className="border border-black"></td>
                        <td className="border border-black"></td>
                        <td className="border border-black"></td>
                      </tr>

                      {/* Data Pengeluaran */}
                      {pettyCashReportData.expenses.length > 0 ? (
                        pettyCashReportData.expenses.map((exp) => (
                          <tr key={exp.id} className="border-b border-black">
                            <td className="border border-black px-3 py-1.5">
                              {exp.desc}
                            </td>
                            <td className="border border-black px-2 py-1.5 text-center font-mono text-[11px]">
                              {exp.code || "-"}
                            </td>
                            <td className="border border-black px-3 py-1.5 text-right font-mono font-medium">
                              {formatExcelCurrency(exp.debet)}
                            </td>
                            <td className="border border-black px-3 py-1.5 text-right font-mono">
                              {exp.kredit > 0 ? formatExcelCurrency(exp.kredit) : ""}
                            </td>
                            <td className="border border-black px-3 py-1.5 text-right font-mono font-medium">
                              {formatExcelCurrency(exp.saldo)}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr className="border-b border-black text-slate-400">
                          <td className="border border-black px-3 py-1.5 italic text-center text-[11px]">
                            (Tidak ada transaksi pengeluaran kas pada periode ini)
                          </td>
                          <td className="border border-black text-center">-</td>
                          <td className="border border-black text-right font-mono">-</td>
                          <td className="border border-black"></td>
                          <td className="border border-black text-right font-mono">
                            {formatExcelCurrency(pettyCashOpeningBalance)}
                          </td>
                        </tr>
                      )}

                      {/* Baris Kosong Pemisah Sebelum TOTAL */}
                      <tr className="border-b border-black h-5">
                        <td className="border border-black"></td>
                        <td className="border border-black"></td>
                        <td className="border border-black"></td>
                        <td className="border border-black"></td>
                        <td className="border border-black"></td>
                      </tr>

                      {/* Baris TOTAL Sesuai Excel */}
                      <tr className="border-t-2 border-black font-bold">
                        <td className="border border-black px-3 py-2 text-center uppercase tracking-wider">
                          TOTAL
                        </td>
                        <td className="border border-black"></td>
                        <td className="border border-black px-3 py-2 text-right font-mono font-bold">
                          {formatExcelCurrency(pettyCashReportData.totalDebet)}
                        </td>
                        <td className="border border-black px-3 py-2 text-right font-mono font-bold">
                          {formatExcelCurrency(pettyCashReportData.totalKredit)}
                        </td>
                        <td className="border border-black px-3 py-2 text-right font-mono font-bold">
                          {formatExcelCurrency(pettyCashReportData.finalSaldo)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* 3. TANDA TANGAN IDENTIK EXCEL */}
                <div className="mt-10 grid grid-cols-2 text-xs font-sans text-black">
                  <div className="flex flex-col items-center">
                    <p className="font-medium">Yang membuat</p>
                    <div className="h-20" />
                    <p className="font-bold tracking-wider">
                      (&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{pettyCashCreator}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;)
                    </p>
                  </div>
                  <div className="flex flex-col items-center">
                    <p className="font-medium">Yang menyetujui</p>
                    <div className="h-20" />
                    <p className="font-bold tracking-wider">
                      (&nbsp;&nbsp;&nbsp;{pettyCashApprover}&nbsp;&nbsp;&nbsp;)
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
