import React from 'react';
import {
  LayoutDashboard,
  UserPlus,
  Receipt,
  FileText,
  Activity,
  Calendar,
  Stethoscope,
  Scan,
  RotateCcw,
  Building2,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  PackageCheck,
  Settings,
  TrendingUp,
  LogOut,
  Bed,
  HeartPulse,
  Pill,
} from 'lucide-react';
import { Staff, HospitalSettings } from '../types';
import { HospitalEmblem } from './HospitalEmblem';

export type TabType =
  | 'dashboard'
  | 'patients'
  | 'opd'
  | 'ipd'
  | 'pharmacy'
  | 'billing'
  | 'finance'
  | 'prescriptions'
  | 'lab'
  | 'delivery'
  | 'appointments'
  | 'staff'
  | 'settings';

interface SidebarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  staffList: Staff[];
  currentUser: Staff;
  setCurrentUser: (user: Staff) => void;
  onOpenScanner: () => void;
  onResetData: () => void;
  onLogout?: () => void;
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  dueCount?: number;
  waitingAptCount?: number;
  pendingLabCount?: number;
  readyDeliveryCount?: number;
  ipdActiveCount?: number;
  hospitalSettings?: HospitalSettings;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  staffList,
  currentUser,
  setCurrentUser,
  onOpenScanner,
  onResetData,
  onLogout,
  collapsed,
  setCollapsed,
  dueCount = 0,
  waitingAptCount = 0,
  pendingLabCount = 0,
  readyDeliveryCount = 0,
  ipdActiveCount = 0,
  hospitalSettings,
}) => {
  const [showUserDropdown, setShowUserDropdown] = React.useState(false);

  const menuItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'patients',
      label: 'Patient Registration',
      icon: UserPlus,
      badge: null,
    },
    {
      id: 'opd',
      label: 'OPD & Test Orders',
      icon: HeartPulse,
      badge: null,
    },
    {
      id: 'ipd',
      label: 'IPD & Bed Admission',
      icon: Bed,
      badge: ipdActiveCount > 0 ? `${ipdActiveCount} Admitted` : null,
      badgeColor: 'bg-indigo-500 text-white',
    },
    {
      id: 'pharmacy',
      label: 'Pharmacy & Dispensary',
      icon: Pill,
      badge: null,
    },
    {
      id: 'billing',
      label: 'Billing & Collections',
      icon: Receipt,
      badge: dueCount > 0 ? `${dueCount} Due` : null,
      badgeColor: 'bg-rose-500 text-white',
    },
    {
      id: 'finance',
      label: 'Financial Analytics',
      icon: TrendingUp,
      badge: null,
    },
    {
      id: 'prescriptions',
      label: 'Prescriptions',
      icon: FileText,
      badge: null,
    },
    {
      id: 'lab',
      label: 'Lab & Test Center',
      icon: Activity,
      badge: pendingLabCount > 0 ? `${pendingLabCount} Pending` : null,
      badgeColor: 'bg-amber-500 text-white',
    },
    {
      id: 'delivery',
      label: 'Report Delivery',
      icon: PackageCheck,
      badge: readyDeliveryCount > 0 ? `${readyDeliveryCount} Ready` : null,
      badgeColor: 'bg-emerald-500 text-white',
    },
    {
      id: 'appointments',
      label: 'Appointment Queue',
      icon: Calendar,
      badge: waitingAptCount > 0 ? `${waitingAptCount}` : null,
      badgeColor: 'bg-amber-500 text-white',
    },
    {
      id: 'staff',
      label: 'Doctors & Staff',
      icon: Stethoscope,
      badge: null,
    },
    {
      id: 'settings',
      label: 'Hospital Settings',
      icon: Settings,
      badge: null,
    },
  ] as const;

  // Filter tabs for non-admin users based on Admin-assigned permissions
  const visibleMenuItems =
    currentUser.role === 'admin'
      ? menuItems
      : menuItems.filter((item) => (currentUser.allowedTabs || []).includes(item.id));

  return (
    <aside
      className={`no-print bg-slate-900 text-slate-300 border-r border-slate-800 flex flex-col justify-between transition-all duration-300 z-30 select-none ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Top Header / Brand */}
      <div>
        <div className="h-16 px-4 flex items-center justify-between border-b border-slate-800/80">
          {!collapsed ? (
            <div
              className="flex items-center gap-3 cursor-pointer overflow-hidden"
              onClick={() => setActiveTab('dashboard')}
            >
              <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center shadow-md shrink-0 overflow-hidden p-1">
                {hospitalSettings?.customLogoUrl ? (
                  <HospitalEmblem
                    size={30}
                    customLogoUrl={hospitalSettings.customLogoUrl}
                    altText={hospitalSettings.name}
                  />
                ) : (
                  <Building2 className="w-5 h-5 text-teal-400 stroke-[2.5]" />
                )}
              </div>
              <div className="truncate">
                <h1 className="font-black text-sm text-white tracking-tight leading-tight truncate">
                  {hospitalSettings?.nameBangla || hospitalSettings?.name?.split(' ')[0] || 'MedPulse'}
                </h1>
                <p className="text-[10px] text-teal-400 font-bold uppercase tracking-wider truncate">
                  {hospitalSettings?.nameBangla ? 'Hospital Management' : 'Hospital System'}
                </p>
              </div>
            </div>
          ) : (
            <div
              className="w-10 h-10 mx-auto rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center font-black cursor-pointer shadow-md overflow-hidden p-1"
              onClick={() => setActiveTab('dashboard')}
              title={hospitalSettings?.name || 'MedPulse Hospital'}
            >
              {hospitalSettings?.customLogoUrl ? (
                <HospitalEmblem
                  size={28}
                  customLogoUrl={hospitalSettings.customLogoUrl}
                  altText={hospitalSettings.name}
                />
              ) : (
                <span className="text-teal-400 font-bold">
                  {(hospitalSettings?.nameBangla || hospitalSettings?.name || 'M').charAt(0)}
                </span>
              )}
            </div>
          )}

          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors hidden sm:block"
            title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Quick Barcode Scanner Trigger Button */}
        <div className="p-3 border-b border-slate-800/60">
          <button
            onClick={onOpenScanner}
            className={`w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-500/20 active:scale-95 transition-all cursor-pointer ${
              collapsed ? 'px-0' : 'px-3'
            }`}
            title="Scan Barcode"
          >
            <Scan className="w-4 h-4 stroke-[2.5] shrink-0" />
            {!collapsed && <span>Scan Barcode</span>}
          </button>
        </div>

        {/* Navigation Menu */}
        <nav className="p-3 space-y-1">
          {visibleMenuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as TabType)}
                className={`w-full flex items-center justify-between rounded-xl px-3 py-2.5 text-xs font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-teal-500 text-slate-950 font-bold shadow-md shadow-teal-500/20'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
                } ${collapsed ? 'justify-center px-0' : ''}`}
                title={collapsed ? item.label : undefined}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 shrink-0 ${
                      isActive ? 'text-slate-950 stroke-[2.5]' : 'text-slate-400'
                    }`}
                  />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </div>

                {!collapsed && item.badge && (
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md leading-none ${
                      item.badgeColor || 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Profile & Actions */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-950/40 relative">
        {showUserDropdown && !collapsed && (
          <div className="absolute bottom-16 left-3 right-3 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl py-2 z-50 animate-fadeIn">
            {currentUser.role === 'admin' ? (
              <>
                <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-700/80 flex items-center justify-between">
                  <span>Switch Active User</span>
                  <span className="text-[9px] text-teal-400 font-mono">Admin Only</span>
                </div>
                <div className="max-h-52 overflow-y-auto py-1">
                  {staffList.map((stf) => (
                    <button
                      key={stf.id}
                      onClick={() => {
                        setCurrentUser(stf);
                        setShowUserDropdown(false);
                      }}
                      className={`w-full px-3 py-1.5 text-left text-xs flex items-center justify-between hover:bg-slate-700/60 ${
                        currentUser.id === stf.id ? 'text-teal-400 font-bold bg-teal-500/10' : 'text-slate-300'
                      }`}
                    >
                      <span className="truncate">{stf.name}</span>
                      <span className="text-[10px] font-mono text-slate-400 capitalize">{stf.role}</span>
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <div className="px-3 py-2 border-b border-slate-700/80 space-y-1">
                <p className="text-[11px] font-bold text-white truncate">{currentUser.name}</p>
                <div className="flex items-center justify-between text-[10px] text-slate-400">
                  <span className="font-mono text-teal-400 font-bold">ID: {currentUser.id}</span>
                  <span className="text-purple-300 font-semibold">
                    {currentUser.allowedTabs?.length || 0} Sections Permitted
                  </span>
                </div>
                <p className="text-[9px] text-slate-400 italic">
                  To change user, please log out and sign in with your User ID & Password.
                </p>
              </div>
            )}
            <div className="pt-1.5 border-t border-slate-700 px-2 space-y-1">
              {onLogout && (
                <button
                  onClick={() => {
                    setShowUserDropdown(false);
                    onLogout();
                  }}
                  className="w-full text-left text-[11px] text-rose-300 hover:bg-rose-500/20 p-1.5 rounded flex items-center gap-1.5 font-bold cursor-pointer transition-colors"
                >
                  <LogOut className="w-3 h-3 text-rose-400" />
                  Logout
                </button>
              )}
              <button
                onClick={() => {
                  onResetData();
                  setShowUserDropdown(false);
                }}
                className="w-full text-left text-[11px] text-slate-400 hover:bg-slate-700/50 p-1.5 rounded flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3 text-slate-400" />
                Reset System Data
              </button>
            </div>
          </div>
        )}

        <div
          onClick={() => setShowUserDropdown(!showUserDropdown)}
          className={`flex items-center gap-2.5 p-2 rounded-xl bg-slate-800/60 hover:bg-slate-800 cursor-pointer border border-slate-700/60 transition-colors ${
            collapsed ? 'justify-center p-1.5' : ''
          }`}
          title={currentUser.name}
        >
          <div className="w-8 h-8 rounded-lg bg-teal-500/20 text-teal-400 border border-teal-500/40 flex items-center justify-center text-xs font-bold shrink-0">
            {currentUser.name.charAt(0)}
          </div>

          {!collapsed && (
            <div className="flex-1 truncate text-left">
              <p className="text-xs font-bold text-white truncate leading-tight">
                {currentUser.name}
              </p>
              <p className="text-[10px] text-teal-400 font-medium capitalize">
                {currentUser.role === 'admin'
                  ? 'Administrator'
                  : currentUser.role === 'doctor'
                  ? 'Physician / Doctor'
                  : currentUser.role === 'accountant'
                  ? 'Billing Cashier'
                  : currentUser.role === 'lab_technician'
                  ? 'Pathologist'
                  : 'Receptionist'}
              </p>
            </div>
          )}

          {!collapsed && <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
        </div>
      </div>
    </aside>
  );
};
