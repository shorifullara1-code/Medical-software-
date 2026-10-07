import React from 'react';
import {
  TrendingUp,
  AlertTriangle,
  Users,
  Calendar,
  Stethoscope,
  Activity,
  Receipt,
  FileText,
  Scan,
  CreditCard,
  CheckCircle2,
  Clock,
  Printer,
  ChevronRight,
  UserPlus,
  PackageCheck,
  Settings
} from 'lucide-react';
import {
  Patient,
  Invoice,
  Prescription,
  LabReport,
  Appointment,
  Staff,
  LabTestCatalogItem
} from '../types';
import { TabType } from './Sidebar';

interface DashboardViewProps {
  patients: Patient[];
  invoices: Invoice[];
  prescriptions: Prescription[];
  labReports: LabReport[];
  appointments: Appointment[];
  staff: Staff[];
  testCatalog: LabTestCatalogItem[];
  setActiveTab: (tab: TabType) => void;
  onOpenScanner: () => void;
  onOpenInvoicePrint: (invoice: Invoice) => void;
  onOpenPrescriptionPrint: (prescription: Prescription) => void;
  onOpenLabReportPrint: (report: LabReport) => void;
  onQuickCollectDue: (invoice: Invoice) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  patients,
  invoices,
  prescriptions,
  labReports,
  appointments,
  staff,
  testCatalog,
  setActiveTab,
  onOpenScanner,
  onOpenInvoicePrint,
  onOpenPrescriptionPrint,
  onOpenLabReportPrint,
  onQuickCollectDue,
}) => {
  const totalCollection = invoices.reduce((sum, inv) => sum + (inv.paidAmount || 0), 0);
  const totalDueAmount = invoices.reduce((sum, inv) => sum + (inv.dueAmount || 0), 0);
  const dueInvoices = invoices.filter((inv) => inv.dueAmount > 0);
  const doctorsList = staff.filter((s) => s.role === 'doctor');
  const todayAppointments = appointments;
  const readyReportsCount = labReports.filter((r) => r.status === 'completed' && !r.deliveredAt).length;

  return (
    <div className="space-y-5">
      {/* 4 KPI Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Collection */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Total Collection</span>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-black text-slate-900 font-mono mt-2">
            BDT {totalCollection.toLocaleString()}
          </h3>
          <p className="text-[11px] text-emerald-600 font-semibold mt-1">Cash Collected</p>
        </div>

        {/* Total Due Amount */}
        <div
          onClick={() => setActiveTab('billing')}
          className="bg-white p-4 rounded-xl border border-rose-200 shadow-2xs cursor-pointer hover:border-rose-400 transition-colors"
        >
          <div className="flex items-center justify-between text-rose-600">
            <span className="text-xs font-bold uppercase tracking-wider">Total Outstanding Due</span>
            <div className="p-2 rounded-lg bg-rose-50 text-rose-600">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-black text-rose-600 font-mono mt-2">
            BDT {totalDueAmount.toLocaleString()}
          </h3>
          <p className="text-[11px] text-rose-500 font-semibold mt-1">
            Across {dueInvoices.length} Due Bills
          </p>
        </div>

        {/* Patients */}
        <div
          onClick={() => setActiveTab('patients')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs cursor-pointer hover:border-teal-300 transition-colors"
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Registered Patients</span>
            <div className="p-2 rounded-lg bg-teal-50 text-teal-600">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-black text-slate-900 font-mono mt-2">
            {patients.length}
          </h3>
          <p className="text-[11px] text-teal-700 font-medium mt-1">Barcode Profiles</p>
        </div>

        {/* Doctors & Appointments */}
        <div
          onClick={() => setActiveTab('appointments')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs cursor-pointer hover:border-amber-300 transition-colors"
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Today's Serials</span>
            <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-black text-slate-900 font-mono mt-2">
            {todayAppointments.length}
          </h3>
          <p className="text-[11px] text-slate-500 font-medium mt-1">
            {doctorsList.length} Doctors Active
          </p>
        </div>
      </div>

      {/* Quick Action Navigation Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <button
          onClick={() => setActiveTab('patients')}
          className="p-3 bg-white rounded-xl border border-slate-200 hover:border-teal-400 transition-colors text-left flex items-center gap-3 cursor-pointer"
        >
          <div className="p-2 rounded-lg bg-teal-50 text-teal-600">
            <UserPlus className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-800">Patient Reg</h4>
            <p className="text-[10px] text-slate-400">New Profile</p>
          </div>
        </button>

        <button
          onClick={() => setActiveTab('billing')}
          className="p-3 bg-white rounded-xl border border-slate-200 hover:border-indigo-400 transition-colors text-left flex items-center gap-3 cursor-pointer"
        >
          <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
            <Receipt className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-800">Billing Counter</h4>
            <p className="text-[10px] text-slate-400">Invoices & Dues</p>
          </div>
        </button>

        <button
          onClick={() => setActiveTab('finance')}
          className="p-3 bg-white rounded-xl border border-slate-200 hover:border-teal-400 transition-colors text-left flex items-center gap-3 cursor-pointer"
        >
          <div className="p-2 rounded-lg bg-teal-50 text-teal-600">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-800">Finance & Audit</h4>
            <p className="text-[10px] text-teal-600 font-semibold">Revenue Dashboard</p>
          </div>
        </button>

        <button
          onClick={() => setActiveTab('prescriptions')}
          className="p-3 bg-white rounded-xl border border-slate-200 hover:border-emerald-400 transition-colors text-left flex items-center gap-3 cursor-pointer"
        >
          <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-800">Prescriptions</h4>
            <p className="text-[10px] text-slate-400">Digital Pad</p>
          </div>
        </button>

        <button
          onClick={() => setActiveTab('lab')}
          className="p-3 bg-white rounded-xl border border-slate-200 hover:border-sky-400 transition-colors text-left flex items-center gap-3 cursor-pointer"
        >
          <div className="p-2 rounded-lg bg-sky-50 text-sky-600">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-800">Lab Tests</h4>
            <p className="text-[10px] text-slate-400">CBC & Rates</p>
          </div>
        </button>

        <button
          onClick={() => setActiveTab('delivery')}
          className="p-3 bg-white rounded-xl border border-slate-200 hover:border-teal-400 transition-colors text-left flex items-center gap-3 cursor-pointer"
        >
          <div className="p-2 rounded-lg bg-teal-50 text-teal-600">
            <PackageCheck className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-800">Report Delivery</h4>
            <p className="text-[10px] text-teal-600 font-semibold">
              {readyReportsCount > 0 ? `${readyReportsCount} Ready` : 'Counter'}
            </p>
          </div>
        </button>

        <button
          onClick={() => setActiveTab('appointments')}
          className="p-3 bg-white rounded-xl border border-slate-200 hover:border-amber-400 transition-colors text-left flex items-center gap-3 cursor-pointer"
        >
          <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
            <Calendar className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-800">Appointments</h4>
            <p className="text-[10px] text-slate-400">Token Queue</p>
          </div>
        </button>

        <button
          onClick={() => setActiveTab('staff')}
          className="p-3 bg-white rounded-xl border border-slate-200 hover:border-purple-400 transition-colors text-left flex items-center gap-3 cursor-pointer"
        >
          <div className="p-2 rounded-lg bg-purple-50 text-purple-600">
            <Stethoscope className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-800">Doctor Roster</h4>
            <p className="text-[10px] text-slate-400">Staff Shifts</p>
          </div>
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className="p-3 bg-white rounded-xl border border-slate-200 hover:border-teal-400 transition-colors text-left flex items-center gap-3 cursor-pointer"
        >
          <div className="p-2 rounded-lg bg-teal-50 text-teal-600">
            <Settings className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-800">Hospital Settings</h4>
            <p className="text-[10px] text-teal-600 font-semibold">Name & Branding</p>
          </div>
        </button>
      </div>

      {/* Main Grid: Pending Due Invoices & Chamber Schedule */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Pending Due Invoices */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-rose-600" />
              <h3 className="font-bold text-sm text-slate-900">Outstanding Due Bills</h3>
            </div>
            <button
              onClick={() => setActiveTab('billing')}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-0.5"
            >
              All Invoices <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {dueInvoices.length === 0 ? (
            <p className="py-6 text-center text-slate-400 text-xs">No pending due bills.</p>
          ) : (
            <div className="space-y-2">
              {dueInvoices.map((inv) => (
                <div
                  key={inv.id}
                  className="p-3 rounded-lg border border-slate-200 bg-slate-50/50 flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-900">{inv.id}</span>
                      <span className="font-mono text-[10px] bg-slate-200 px-1.5 py-0.5 rounded text-slate-700">
                        {inv.patientId}
                      </span>
                      <span className="font-semibold text-slate-800">{inv.patientName}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5 font-mono">
                      Total: BDT {inv.total} | Paid: BDT {inv.paidAmount}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-rose-600 bg-rose-50 px-2 py-1 rounded border border-rose-200">
                      Due: BDT {inv.dueAmount.toLocaleString()}
                    </span>

                    <button
                      onClick={() => onQuickCollectDue(inv)}
                      className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold cursor-pointer"
                    >
                      Collect
                    </button>

                    <button
                      onClick={() => onOpenInvoicePrint(inv)}
                      className="p-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-600 cursor-pointer"
                      title="Print Receipt"
                    >
                      <Printer className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Active Doctors on Chamber */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Stethoscope className="w-4 h-4 text-teal-600" />
              <h3 className="font-bold text-sm text-slate-900">Doctors in Chamber</h3>
            </div>
            <button
              onClick={() => setActiveTab('staff')}
              className="text-xs font-bold text-teal-600 hover:text-teal-800 flex items-center gap-0.5"
            >
              Roster <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2">
            {doctorsList.map((doc) => (
              <div
                key={doc.id}
                className="p-2.5 rounded-lg border border-slate-100 bg-slate-50 flex items-center justify-between text-xs"
              >
                <div>
                  <h4 className="font-bold text-slate-900">{doc.name}</h4>
                  <p className="text-[11px] text-teal-800 font-medium">{doc.specialization}</p>
                  <p className="text-[10px] text-slate-400">
                    {doc.roomNo || 'Chamber'} • {doc.shift}
                  </p>
                </div>
                <span className="font-mono font-bold text-slate-700 bg-white px-2 py-1 rounded border border-slate-200">
                  BDT {doc.consultationFee || 800}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
