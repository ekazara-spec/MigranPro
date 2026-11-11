"use client";

import React, { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Bell,
  Briefcase,
  Building2,
  ChevronDown,
  ChevronRight,
  FolderKanban,
  GraduationCap,
  LayoutDashboard,
  LifeBuoy,
  LogOut,
  MessageSquarePlus,
  Printer,
  Receipt,
  ShieldCheck,
  Smartphone,
  Stethoscope,
  UserCheck,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { Branch } from "@/lib/types";

export type NavKey =
  | "beranda"
  | "saas_tenants"
  | "doc_print"
  | "whatsapp_gateway"
  | "aruskas_kasbon"
  | "employer_matching"
  | "cpmi"
  | "keuangan"
  | "pelatihan"
  | "pengingat"
  | "cases"
  | "vacancy"
  | "portal_cpmi"
  | "medical_visa"
  | "master_data"
  | "cabang_audit";

interface SidebarItem {
  id: NavKey;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
  badgeTone?: "rose" | "amber" | "slate";
}

interface SidebarGroup {
  key: string;
  title: string;
  items: SidebarItem[];
}

interface SidebarNavProps {
  activeNav: NavKey;
  onSelectNav: (nav: NavKey) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  isMenuAllowed: (menuId: string) => boolean;
  selectedBranchId: string;
  onChangeBranch: (branchId: string) => void;
  branchLocked: boolean;
  branches: Branch[];
  totalCandidatesCount: number;
  stats: {
    totalCpmi: number;
    criticalDocsCount: number;
    openCasesCount: number;
  };
  vacanciesCount: number;
  staffName: string;
  onLogout: () => void;
}

export default function SidebarNav({
  activeNav,
  onSelectNav,
  isCollapsed,
  onToggleCollapse,
  isMobileOpen,
  onCloseMobile,
  isMenuAllowed,
  selectedBranchId,
  onChangeBranch,
  branchLocked,
  branches,
  totalCandidatesCount,
  stats,
  vacanciesCount,
  staffName,
  onLogout,
}: SidebarNavProps) {
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  function toggleGroup(groupKey: string) {
    setCollapsedGroups((prev) => ({
      ...prev,
      [groupKey]: !prev[groupKey],
    }));
  }

  const groups: SidebarGroup[] = [
    {
      key: "information",
      title: "INFORMATION",
      items: [
        { id: "beranda", label: "Beranda (Dashboard)", icon: LayoutDashboard },
        {
          id: "pengingat",
          label: "Pengingat Dokumen",
          icon: Bell,
          badge: stats.criticalDocsCount > 0 ? stats.criticalDocsCount : undefined,
          badgeTone: "rose",
        },
        {
          id: "cases",
          label: "Case (Pengaduan PMI)",
          icon: LifeBuoy,
          badge: stats.openCasesCount > 0 ? stats.openCasesCount : undefined,
          badgeTone: "amber",
        },
        { id: "portal_cpmi", label: "Portal Mandiri CPMI", icon: Smartphone },
      ],
    },
    {
      key: "operasional",
      title: "OPERASIONAL",
      items: [
        {
          id: "cpmi",
          label: "Person (Data CPMI)",
          icon: Users,
          badge: stats.totalCpmi,
          badgeTone: "slate",
        },
        {
          id: "vacancy",
          label: "Job Order (Lowongan)",
          icon: Briefcase,
          badge: vacanciesCount > 0 ? vacanciesCount : undefined,
          badgeTone: "slate",
        },
        { id: "employer_matching", label: "Wawancara Majikan", icon: UserCheck },
        { id: "pelatihan", label: "BLK-LN & Pelatihan", icon: GraduationCap },
        { id: "medical_visa", label: "Medical, Visa & Terbang", icon: Stethoscope },
        { id: "doc_print", label: "Cetak Dokumen (PDF)", icon: Printer },
      ],
    },
    {
      key: "finance",
      title: "FINANCE & ACCOUNTING",
      items: [
        { id: "keuangan", label: "Keuangan & Fee Sponsor", icon: Wallet },
        { id: "aruskas_kasbon", label: "Arus Kas & Kasbon", icon: Receipt },
      ],
    },
    {
      key: "administrator",
      title: "ADMINISTRATOR",
      items: [
        { id: "saas_tenants", label: "Profil PT & Cabang", icon: Building2 },
        { id: "cabang_audit", label: "Staf, Role & Audit", icon: ShieldCheck },
      ],
    },
    {
      key: "settings",
      title: "SETTINGS",
      items: [
        { id: "master_data", label: "Master Data & Mitra", icon: FolderKanban },
        { id: "whatsapp_gateway", label: "WhatsApp Gateway", icon: MessageSquarePlus },
      ],
    },
  ];

  function renderNavBody(collapsed: boolean, isMobileDrawer: boolean) {
    return (
      <div className="flex h-full flex-col bg-[#131d3b] text-slate-200 select-none">
        {/* TOP BRAND BAR */}
        <div
          className={`flex h-16 shrink-0 items-center border-b border-white/10 ${
            collapsed ? "justify-center px-2" : "justify-between px-4"
          }`}
        >
          {!collapsed && (
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white p-1 shadow-sm">
                <img
                  src="/logo-pas.png"
                  alt="PASMigranPro"
                  className="h-full w-full object-contain"
                />
              </div>
              <div className="min-w-0">
                <p className="truncate text-[15px] font-extrabold tracking-wide text-white">
                  PASMIGRANPRO
                </p>
                <p className="truncate text-[10px] font-medium text-slate-400">
                  PT. Panca Banyu Ajisakti
                </p>
              </div>
            </div>
          )}

          {collapsed && (
            <button
              type="button"
              onClick={onToggleCollapse}
              title="Perbesar Sidebar"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white p-1 shadow-sm hover:ring-2 hover:ring-sky-400 transition cursor-pointer"
            >
              <img
                src="/logo-pas.png"
                alt="PASMigranPro"
                className="h-full w-full object-contain"
              />
            </button>
          )}

          {!isMobileDrawer && !collapsed && (
            <button
              type="button"
              onClick={onToggleCollapse}
              title="Kecilkan Sidebar"
              className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white transition cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
          )}

          {isMobileDrawer && (
            <button
              type="button"
              onClick={onCloseMobile}
              title="Tutup Menu"
              className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white transition cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* COLLAPSE EXPAND BAR WHEN COLLAPSED ON DESKTOP */}
        {!isMobileDrawer && collapsed && (
          <div className="flex justify-center border-b border-white/10 py-2">
            <button
              type="button"
              onClick={onToggleCollapse}
              title="Besarkan Sidebar"
              className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white transition cursor-pointer"
            >
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* FILTER CABANG (COMPACT) */}
        {!collapsed ? (
          <div className="border-b border-white/10 px-4 py-3">
            <label className="mb-1.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              <Building2 className="h-3 w-3 text-sky-400" />
              Cabang Aktif
            </label>
            <select
              value={selectedBranchId}
              disabled={branchLocked}
              onChange={(e) => onChangeBranch(e.target.value)}
              className="w-full rounded-lg border border-white/15 bg-white/5 px-2.5 py-1.5 text-xs font-medium text-white focus:border-sky-400 focus:outline-none disabled:opacity-60"
            >
              <option value="ALL" className="bg-slate-900 text-white">
                Seluruh Cabang ({totalCandidatesCount} CPMI)
              </option>
              {branches.map((b) => (
                <option key={b.id} value={b.id} className="bg-slate-900 text-white">
                  {b.code} · {b.name}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div className="flex justify-center border-b border-white/10 py-2.5">
            <button
              type="button"
              onClick={onToggleCollapse}
              title="Pilih Filter Cabang"
              className="rounded-lg p-2 text-slate-400 hover:bg-white/10 hover:text-sky-400 transition cursor-pointer"
            >
              <Building2 className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* NAVIGATION GROUPS */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
          {groups.map((group, groupIndex) => {
            const visibleItems = group.items.filter((item) => isMenuAllowed(item.id));
            if (visibleItems.length === 0) return null;

            const isGroupCollapsed = collapsedGroups[group.key] === true;

            return (
              <div
                key={group.key}
                className={groupIndex > 0 ? "border-t border-white/10 pt-3" : ""}
              >
                {!collapsed && (
                  <button
                    type="button"
                    onClick={() => toggleGroup(group.key)}
                    className="mb-1.5 flex w-full items-center justify-between px-2.5 py-1 text-[10.5px] font-semibold uppercase tracking-wider text-slate-400 hover:text-slate-200 transition cursor-pointer"
                  >
                    <span className="truncate">{group.title}</span>
                    {isGroupCollapsed ? (
                      <ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-70" />
                    ) : (
                      <ChevronDown className="h-3.5 w-3.5 shrink-0 opacity-70" />
                    )}
                  </button>
                )}

                {(!isGroupCollapsed || collapsed) && (
                  <div className="space-y-0.5">
                    {visibleItems.map((item) => {
                      const Icon = item.icon;
                      const isActive = activeNav === item.id;

                      const badgeClass =
                        item.badgeTone === "rose"
                          ? "bg-rose-500 text-white"
                          : item.badgeTone === "amber"
                          ? "bg-amber-400 text-slate-950"
                          : "bg-white/15 text-slate-200";

                      return (
                        <button
                          key={item.id}
                          type="button"
                          title={collapsed ? item.label : undefined}
                          onClick={() => {
                            onSelectNav(item.id);
                            if (isMobileDrawer) {
                              onCloseMobile();
                            }
                          }}
                          className={`group relative flex w-full items-center rounded-lg transition cursor-pointer ${
                            collapsed
                              ? "justify-center px-2 py-2.5"
                              : "justify-between px-2.5 py-2"
                          } ${
                            isActive
                              ? "bg-sky-500 text-white font-semibold shadow-sm"
                              : "text-slate-300 hover:bg-white/8 hover:text-white font-normal"
                          }`}
                        >
                          <span className="flex items-center gap-3 min-w-0">
                            <Icon
                              className={`h-4 w-4 shrink-0 ${
                                isActive
                                  ? "text-white"
                                  : "text-slate-400 group-hover:text-white"
                              }`}
                            />
                            {!collapsed && (
                              <span className="truncate whitespace-nowrap text-[13px] leading-tight">
                                {item.label}
                              </span>
                            )}
                          </span>

                          {!collapsed && item.badge !== undefined && (
                            <span
                              className={`ml-2 shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none ${
                                isActive ? "bg-white/25 text-white" : badgeClass
                              }`}
                            >
                              {item.badge}
                            </span>
                          )}

                          {collapsed && item.badge !== undefined && item.badge > 0 && item.badgeTone !== "slate" && (
                            <span
                              className={`absolute top-1.5 right-1.5 h-2 w-2 rounded-full ${
                                item.badgeTone === "rose" ? "bg-rose-500" : "bg-amber-400"
                              }`}
                            />
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* FOOTER & KELUAR */}
        <div className="shrink-0 border-t border-white/10 p-3 space-y-2">
          {!collapsed && (
            <div className="flex items-center gap-2.5 rounded-lg bg-white/5 px-2.5 py-2">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-sky-500/20 text-sky-300">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-white">{staffName}</p>
                <p className="truncate text-[10px] text-slate-400">PT Panca Banyu Ajisakti</p>
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={onLogout}
            title={collapsed ? "Keluar" : undefined}
            className={`flex w-full items-center rounded-lg text-slate-300 hover:bg-rose-500/15 hover:text-rose-300 transition cursor-pointer ${
              collapsed ? "justify-center p-2.5" : "gap-3 px-2.5 py-2 text-[13px] font-medium"
            }`}
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {!collapsed && <span>Keluar</span>}
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* DESKTOP SIDEBAR (COLLAPSIBLE: w-64 / w-[72px]) */}
      <aside
        className={`hidden lg:flex shrink-0 flex-col transition-all duration-300 ease-in-out print:hidden ${
          isCollapsed ? "w-[72px]" : "w-[260px]"
        }`}
      >
        <div className="sticky top-0 h-screen w-full overflow-hidden">
          {renderNavBody(isCollapsed, false)}
        </div>
      </aside>

      {/* MOBILE / TABLET SLIDE-OVER DRAWER */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden print:hidden">
          {/* Backdrop */}
          <div
            onClick={onCloseMobile}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity"
          />
          {/* Drawer panel */}
          <aside className="relative z-10 flex h-full w-64 max-w-[82vw] flex-col shadow-2xl">
            {renderNavBody(false, true)}
          </aside>
        </div>
      )}
    </>
  );
}
