import React from 'react';
import {
  LayoutDashboard,
  Users,
  UserPlus,
  Stethoscope,
  Receipt,
  FileText,
  Activity,
  Calendar,
  Scan,
  RotateCcw,
  ShieldCheck,
  Building2,
  ChevronDown
} from 'lucide-react';
import { Staff } from '../types';

export type TabType =
  | 'dashboard'
  | 'patients'
  | 'staff'
  | 'billing'
  | 'prescriptions'
  | 'lab'
  | 'appointments';

interface NavbarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  staffList: Staff[];
  currentUser: Staff;
  setCurrentUser: (user: Staff) => void;
  onOpenScanner: () => void;
  onResetData: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  staffList,
  currentUser,
  setCurrentUser,
  onOpenScanner,
  onResetData,
}) => {
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, badge: null },
    { id: 'patients', label: 'Patient Registration', icon: UserPlus, badge: null },
    { id: 'billing', label: 'Billing & Collections', icon: Receipt, badge: 'Due' },
    { id: 'prescriptions', label: 'Prescriptions', icon: FileText, badge: 'Rx' },
    { id: 'lab', label: 'Lab & Diagnostics', icon: Activity, badge: 'CBC' },
    { id: 'appointments', label: 'Appointments', icon: Calendar, badge: null },
    { id: 'staff', label: 'Doctors & Staff', icon: Stethoscope, badge: null },
  ] as const;

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-40 shadow-lg">
      {/* Top Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-500 to-emerald-400 flex items-center justify-center shadow-md shadow-teal-500/20">
              <Building2 className="w-6 h-6 text-slate-950 font-bold" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-lg text-white tracking-tight">MedPulse</span>
                <span className="text-[10px] uppercase font-bold tracking-widest bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                  Hospital ERP
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                General Hospital & Diagnostic Management System
              </p>
            </div>
          </div>

          {/* Center Right Actions: Barcode Scanner & Active User Switcher */}
          <div className="flex items-center gap-3">
            {/* Quick Barcode Scanner Trigger Button */}
            <button
              onClick={onOpenScanner}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all transform active:scale-95 cursor-pointer animate-pulse"
              title="Scan prescription or bill barcode"
            >
              <Scan className="w-4 h-4 stroke-[2.5]" />
              <span className="hidden sm:inline">Barcode Scanner</span>
              <span className="sm:hidden">Scan</span>
            </button>

            {/* Active Staff / Switcher */}
            <div className="relative group">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 cursor-pointer transition-colors">
                <div className="w-7 h-7 rounded-lg bg-teal-600/30 border border-teal-500/40 text-teal-300 flex items-center justify-center text-xs font-bold">
                  {currentUser.name.charAt(0)}
                </div>
                <div className="text-left hidden md:block">
                  <p className="text-xs font-bold text-white truncate max-w-[120px]">{currentUser.name}</p>
                  <p className="text-[10px] text-teal-400 font-medium capitalize">
                    {currentUser.role === 'admin'
                      ? 'Administrator'
                      : currentUser.role === 'doctor'
                      ? 'Doctor'
                      : currentUser.role === 'accountant'
                      ? 'Cashier'
                      : currentUser.role === 'lab_technician'
                      ? 'Pathologist'
                      : 'Receptionist'}
                  </p>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-1" />
              </div>

              {/* Staff Switcher Dropdown */}
              <div className="absolute right-0 mt-2 w-72 bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl py-2 hidden group-hover:block z-50 animate-fadeIn">
                <div className="px-3 py-1.5 border-b border-slate-700/80 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Switch Active Staff / Role
                </div>
                <div className="max-h-64 overflow-y-auto py-1">
                  {staffList.map((stf) => (
                    <button
                      key={stf.id}
                      onClick={() => setCurrentUser(stf)}
                      className={`w-full px-3 py-2 text-left text-xs flex items-center justify-between hover:bg-slate-700/60 transition-colors cursor-pointer ${
                        currentUser.id === stf.id ? 'bg-teal-500/10 text-teal-300 font-bold' : 'text-slate-300'
                      }`}
                    >
                      <div className="truncate">
                        <p className="font-semibold text-slate-100">{stf.name}</p>
                        <p className="text-[10px] text-slate-400">{stf.department}</p>
                      </div>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-900/60 font-mono text-slate-400">
                        {stf.role}
                      </span>
                    </button>
                  ))}
                </div>
                <div className="p-2 border-t border-slate-700">
                  <button
                    onClick={onResetData}
                    className="w-full px-3 py-1.5 text-left text-[11px] text-rose-300 hover:bg-rose-500/10 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3 text-rose-400" />
                    Restore System Defaults
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <div className="flex items-center gap-1 overflow-x-auto py-2.5 scrollbar-none border-t border-slate-800">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-teal-500 text-slate-950 font-bold shadow-md shadow-teal-500/20'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-slate-950' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold uppercase ${
                      isActive
                        ? 'bg-slate-950 text-teal-400'
                        : 'bg-slate-800 text-teal-300 border border-teal-500/30'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
