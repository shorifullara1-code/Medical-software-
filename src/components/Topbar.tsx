import React from 'react';
import { Scan, Menu, Bell, LogOut, UserCheck, History, Database } from 'lucide-react';
import { TabType } from './Sidebar';
import { Staff } from '../types';

interface TopbarProps {
  activeTab: TabType;
  currentUser: Staff;
  onOpenScanner: () => void;
  onOpenPatientHistory?: () => void;
  onOpenSupabaseModal?: () => void;
  onToggleSidebarMobile: () => void;
  onLogout?: () => void;
  totalDueAmount?: number;
}

const TAB_TITLES: Record<TabType, { title: string; subtitle: string }> = {
  dashboard: { title: 'Dashboard Overview', subtitle: 'Hospital operations & live metrics summary' },
  patients: { title: 'Patient Registration', subtitle: 'Patient ID profiles & barcode health cards' },
  opd: { title: 'OPD Outpatient Department', subtitle: 'Consultations, vitals, test catalog & diagnostic orders' },
  ipd: { title: 'IPD Inpatient Department', subtitle: 'Bed occupancy, admissions, rounds & discharge management' },
  pharmacy: { title: 'Pharmacy & Dispensary', subtitle: 'Medicine inventory, OPD POS & indoor credit dispensing' },
  billing: { title: 'Billing & Due Collections', subtitle: 'Official money receipts & invoice management' },
  finance: { title: 'Financial Summary & Analytics', subtitle: 'Daily, weekly & monthly revenue and service breakdowns' },
  prescriptions: { title: 'Prescriptions Center', subtitle: 'Digital prescriptions & ℞ handwriting pad' },
  lab: { title: 'Lab & Diagnostic Center', subtitle: 'Test catalog, pricing, room guide & result templates' },
  delivery: { title: 'Report Delivery Counter', subtitle: 'Due verification & pathology report dispatch' },
  appointments: { title: 'Appointment Management', subtitle: 'Serial queues, OPD scheduling & doctor consultation' },
  staff: { title: 'Doctors & Staff Roster', subtitle: 'Staff directory, roles & duty assignments' },
  settings: { title: 'Hospital Settings & Branding', subtitle: 'Name, address, phone & printable header customization' },
};

export const Topbar: React.FC<TopbarProps> = ({
  activeTab,
  currentUser,
  onOpenScanner,
  onOpenPatientHistory,
  onOpenSupabaseModal,
  onToggleSidebarMobile,
  onLogout,
  totalDueAmount = 0,
}) => {
  const currentInfo = TAB_TITLES[activeTab] || { title: 'Hospital ERP', subtitle: '' };

  return (
    <header className="no-print h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-20 shadow-2xs">
      {/* Left: Mobile Toggle & Page Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebarMobile}
          className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 sm:hidden cursor-pointer"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight leading-none">
            {currentInfo.title}
          </h2>
          <p className="text-[11px] text-slate-400 font-medium hidden sm:block mt-0.5">
            {currentInfo.subtitle}
          </p>
        </div>
      </div>

      {/* Right: Quick Barcode Scan & User / Logout */}
      <div className="flex items-center gap-2.5">
        {totalDueAmount > 0 && (
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold font-mono">
            <span>Total Dues:</span>
            <span>BDT {totalDueAmount.toLocaleString()}</span>
          </div>
        )}

        {onOpenSupabaseModal && (
          <button
            onClick={onOpenSupabaseModal}
            className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Connected to Supabase Project (shorifullara1-code's Project). Click to manage cloud database sync."
          >
            <Database className="w-3.5 h-3.5 text-emerald-600 stroke-[2.5] animate-pulse" />
            <span className="hidden sm:inline">Supabase Live</span>
          </button>
        )}

        {onOpenPatientHistory && (
          <button
            onClick={onOpenPatientHistory}
            className="px-3 py-1.5 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Search & view complete patient medical history, IPD records, prescriptions & lab reports"
          >
            <History className="w-3.5 h-3.5 text-teal-600 stroke-[2.5]" />
            <span className="hidden sm:inline">Medical History</span>
          </button>
        )}

        <button
          onClick={onOpenScanner}
          className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
        >
          <Scan className="w-3.5 h-3.5 text-emerald-400 stroke-[2.5]" />
          <span className="hidden sm:inline">Barcode Scan</span>
        </button>

        {/* User Info & Logout Button */}
        {onLogout && (
          <button
            onClick={onLogout}
            title="Logout to return to login page"
            className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        )}
      </div>
    </header>
  );
};
