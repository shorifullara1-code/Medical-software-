import React, { useState } from 'react';
import {
  User,
  Activity,
  FileText,
  Receipt,
  Calendar,
  Lock,
  Unlock,
  Download,
  Printer,
  CreditCard,
  Building2,
  AlertTriangle,
  CheckCircle2,
  ShieldCheck,
  Phone,
  Droplet,
  LogOut,
  MapPin,
  Clock,
  Stethoscope,
  Sparkles,
  Search,
  ExternalLink,
} from 'lucide-react';
import {
  Patient,
  Invoice,
  Prescription,
  LabReport,
  Appointment,
  HospitalSettings,
  PaymentRecord,
} from '../types';
import { HospitalEmblem } from './HospitalEmblem';
import { BarcodeRenderer } from './BarcodeRenderer';

interface PatientPortalViewProps {
  patient: Patient;
  invoices: Invoice[];
  prescriptions: Prescription[];
  labReports: LabReport[];
  appointments: Appointment[];
  hospitalSettings: HospitalSettings;
  onUpdateInvoice: (updatedInvoice: Invoice) => void;
  onOpenPrintLabReport: (report: LabReport) => void;
  onOpenPrintPrescription: (prescription: Prescription) => void;
  onOpenPrintInvoice: (invoice: Invoice) => void;
  onOpenPrintPatientCard: (patient: Patient) => void;
  onLogout: () => void;
}

export const PatientPortalView: React.FC<PatientPortalViewProps> = ({
  patient,
  invoices,
  prescriptions,
  labReports,
  appointments,
  hospitalSettings,
  onUpdateInvoice,
  onOpenPrintLabReport,
  onOpenPrintPrescription,
  onOpenPrintInvoice,
  onOpenPrintPatientCard,
  onLogout,
}) => {
  const [activeTab, setActiveTab] = useState<'reports' | 'prescriptions' | 'invoices' | 'appointments' | 'card'>('reports');

  // Filter records for this logged in patient
  const patientInvoices = invoices.filter((i) => i.patientId === patient.id);
  const patientLabReports = labReports.filter((r) => r.patientId === patient.id);
  const patientPrescriptions = prescriptions.filter((p) => p.patientId === patient.id);
  const patientAppointments = appointments.filter((a) => a.patientId === patient.id);

  // Financial calculations
  const totalBilled = patientInvoices.reduce((sum, i) => sum + i.total, 0);
  const totalPaid = patientInvoices.reduce((sum, i) => sum + i.paidAmount, 0);
  const totalDue = patientInvoices.reduce((sum, i) => sum + i.dueAmount, 0);

  // Crucial Rule: Has Dues or Not
  const hasDues = totalDue > 0;

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-between selection:bg-teal-500 selection:text-white">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-30 bg-slate-950/95 backdrop-blur-md border-b border-slate-800 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <HospitalEmblem
            size={42}
            customLogoUrl={hospitalSettings.customLogoUrl}
            altText={hospitalSettings.name}
          />
          <div>
            <h1 className="font-black text-sm sm:text-base text-white tracking-tight leading-tight">
              {hospitalSettings.name}
            </h1>
            <p className="text-[10px] text-teal-400 font-bold uppercase tracking-wider">
              Digital Patient Portal & Health Profile
            </p>
          </div>
        </div>

        {/* Patient Profile Badge & Logout */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2.5 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl">
            <div className="w-8 h-8 rounded-full bg-teal-500/20 border border-teal-500/40 text-teal-300 font-bold text-xs flex items-center justify-center">
              {patient.name.charAt(0)}
            </div>
            <div className="text-left">
              <span className="font-bold text-xs text-white block leading-tight">{patient.name}</span>
              <span className="font-mono text-[10px] text-teal-400">{patient.id}</span>
            </div>
          </div>

          <button
            onClick={onLogout}
            className="px-3.5 py-1.5 bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/30 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
            title="Logout"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Logout</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 p-4 sm:p-6 md:p-8 max-w-7xl w-full mx-auto space-y-6">

        {/* 1. PATIENT QUICK ID CARD & PROFILE BANNER */}
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-teal-950 p-5 sm:p-6 rounded-3xl border border-slate-800 shadow-xl flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-teal-600 to-emerald-400 text-slate-950 font-black text-xl flex items-center justify-center shadow-lg shrink-0">
              {patient.name.charAt(0)}
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black text-white">{patient.name}</h2>
                <span className="px-2 py-0.5 rounded-md bg-teal-500/20 text-teal-300 border border-teal-500/30 text-xs font-mono font-bold">
                  {patient.id}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 font-medium">
                <span>Age: {patient.age} Yrs</span>
                <span>•</span>
                <span>Gender: {patient.gender === 'male' ? 'Male' : 'Female'}</span>
                <span>•</span>
                <span className="text-rose-400 font-bold flex items-center gap-1">
                  <Droplet className="w-3.5 h-3.5 fill-rose-500" />
                  Blood Group: {patient.bloodGroup}
                </span>
                <span>•</span>
                <span className="font-mono text-slate-300">{patient.phone}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onOpenPrintPatientCard(patient)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4 text-teal-400" />
              <span>Print Digital Card</span>
            </button>
          </div>
        </div>

        {/* 2. DUES & REPORT UNLOCK STATUS BANNER */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase">Total Billed Fees</span>
              <h3 className="text-xl font-black text-white font-mono mt-0.5">${totalBilled.toLocaleString()}</h3>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-800 text-slate-300">
              <Receipt className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-emerald-950/30 p-4 rounded-2xl border border-emerald-500/30 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-emerald-400 uppercase">Total Paid Amount</span>
              <h3 className="text-xl font-black text-emerald-300 font-mono mt-0.5">${totalPaid.toLocaleString()}</h3>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>

          <div
            className={`p-4 rounded-2xl border shadow-sm flex items-center justify-between ${
              hasDues
                ? 'bg-rose-950/40 border-rose-500/50 text-rose-200 animate-pulse-subtle'
                : 'bg-slate-900/90 border-slate-800 text-slate-300'
            }`}
          >
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider">
                {hasDues ? '⚠️ Outstanding Dues' : 'Due Status'}
              </span>
              <h3
                className={`text-xl font-black font-mono mt-0.5 ${
                  hasDues ? 'text-rose-400' : 'text-slate-400'
                }`}
              >
                ${totalDue.toLocaleString()}
              </h3>
            </div>
            <div
              className={`p-2.5 rounded-xl ${
                hasDues ? 'bg-rose-500/20 text-rose-400' : 'bg-slate-800 text-slate-400'
              }`}
            >
              {hasDues ? <Lock className="w-5 h-5" /> : <Unlock className="w-5 h-5 text-emerald-400" />}
            </div>
          </div>
        </div>

        {/* CRITICAL REPORT LOCK / UNLOCK ALERT */}
        {hasDues ? (
          <div className="p-5 bg-gradient-to-r from-rose-950/90 via-rose-900/60 to-slate-900 border-2 border-rose-500/60 rounded-3xl shadow-xl flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-start gap-3.5 max-w-3xl">
              <div className="p-2.5 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-300 shrink-0">
                <Lock className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-sm sm:text-base text-rose-200 flex items-center gap-2">
                  <span>Online test report viewing & PDF downloads are locked due to ${totalDue.toLocaleString()} outstanding dues</span>
                </h3>
                <p className="text-xs text-rose-300/80 leading-relaxed">
                  Per hospital policy, online lab test reports are accessible only when all dues are fully paid. Please visit the <strong>Hospital Cash / Billing Counter</strong> to clear your dues. Once hospital staff updates your payment, your reports will be unlocked immediately.
                </p>
              </div>
            </div>

            <div className="px-4 py-2.5 bg-slate-950/80 border border-rose-500/30 rounded-xl text-xs font-semibold text-rose-300 flex items-center gap-2 shrink-0">
              <Building2 className="w-4 h-4 text-rose-400" />
              <span>Contact Hospital Cash Counter</span>
            </div>
          </div>
        ) : (
          <div className="p-4 bg-emerald-950/40 border border-emerald-500/40 rounded-3xl flex items-center gap-3.5 text-xs text-emerald-200">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-sm text-emerald-100 block">
                All Dues Cleared (No Outstanding Balance)
              </span>
              <span className="text-emerald-300/80">
                You have zero dues. You can freely view and download all lab reports and prescriptions in official PDF format.
              </span>
            </div>
          </div>
        )}

        {/* 3. PORTAL NAVIGATION TABS */}
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-3">
          <button
            onClick={() => setActiveTab('reports')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'reports'
                ? 'bg-teal-600 text-white shadow-lg shadow-teal-950/50'
                : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Lab Test Reports ({patientLabReports.length})</span>
            {hasDues && <Lock className="w-3 h-3 text-rose-400" />}
          </button>

          <button
            onClick={() => setActiveTab('prescriptions')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'prescriptions'
                ? 'bg-teal-600 text-white shadow-lg shadow-teal-950/50'
                : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Prescriptions ({patientPrescriptions.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('invoices')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'invoices'
                ? 'bg-teal-600 text-white shadow-lg shadow-teal-950/50'
                : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Receipt className="w-4 h-4" />
            <span>Money Receipts & Payment History ({patientInvoices.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('appointments')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'appointments'
                ? 'bg-teal-600 text-white shadow-lg shadow-teal-950/50'
                : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Doctor Appointments ({patientAppointments.length})</span>
          </button>
        </div>

        {/* TAB 1: LAB REPORTS */}
        {activeTab === 'reports' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-teal-400" />
                <span>My Lab Test & Pathology Reports</span>
              </h3>
              <span className="text-xs text-slate-400">
                {hasDues ? '⚠️ Reports Locked Due to Unpaid Balance' : '✅ Reports Unlocked & Downloadable'}
              </span>
            </div>

            {patientLabReports.length === 0 ? (
              <div className="py-16 text-center bg-slate-900/50 rounded-2xl border border-slate-800 text-xs text-slate-400 space-y-2">
                <Activity className="w-8 h-8 text-slate-600 mx-auto" />
                <p>No lab reports found for your account.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {patientLabReports.map((report) => (
                  <div
                    key={report.id}
                    className="bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 shadow-sm flex flex-col justify-between space-y-4 transition-all"
                  >
                    <div>
                      <div className="flex items-center justify-between pb-2.5 border-b border-slate-800 text-xs">
                        <span className="font-mono font-bold text-teal-400">{report.id}</span>
                        <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full font-bold text-[10px]">
                          Result Completed ✓
                        </span>
                      </div>

                      <div className="mt-3 space-y-1">
                        <h4 className="font-bold text-sm sm:text-base text-white">{report.testName}</h4>
                        <p className="text-xs text-slate-400 font-medium">
                          Referred Doctor: <span className="text-slate-200">{report.referredByDoctor}</span>
                        </p>
                        <p className="text-[11px] text-slate-400 font-mono">
                          Date & Time: {report.reportedAt || report.sampleCollectedAt}
                        </p>
                      </div>

                      {/* CBC Summary Snippet if available */}
                      {report.cbcParameters && (
                        <div className="mt-3 p-2.5 bg-slate-950/60 rounded-xl border border-slate-800/80 grid grid-cols-3 gap-2 text-center text-xs font-mono">
                          <div>
                            <span className="text-[10px] text-slate-500 block">Hemoglobin</span>
                            <span className="font-bold text-slate-200">
                              {report.cbcParameters.hemoglobin.val} g/dL
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-500 block">Platelets</span>
                            <span className="font-bold text-slate-200">
                              {report.cbcParameters.plateletCount.val.toLocaleString()}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-500 block">Total WBC</span>
                            <span className="font-bold text-slate-200">
                              {report.cbcParameters.totalWbc.val.toLocaleString()}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Action button guarded by Dues Check */}
                    <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                      <div className="text-[11px] text-slate-400">
                        {hasDues ? (
                          <span className="text-rose-400 flex items-center gap-1 font-semibold">
                            <Lock className="w-3.5 h-3.5" />
                            Locked Due to Balance
                          </span>
                        ) : (
                          <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Ready for PDF Download
                          </span>
                        )}
                      </div>

                      {hasDues ? (
                        <div className="px-3 py-1.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-[11px] font-semibold flex items-center gap-1.5">
                          <Lock className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                          <span>Pay at Cash Counter to Unlock</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => onOpenPrintLabReport(report)}
                          className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-slate-950 font-black rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-teal-950/40 transition-all cursor-pointer"
                        >
                          <Download className="w-4 h-4" />
                          <Printer className="w-4 h-4" />
                          <span>View & Download Report (PDF)</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: PRESCRIPTIONS */}
        {activeTab === 'prescriptions' && (
          <div className="space-y-4">
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-teal-400" />
              <span>Digital Prescriptions & Prescribed Medications</span>
            </h3>

            {patientPrescriptions.length === 0 ? (
              <div className="py-16 text-center bg-slate-900/50 rounded-2xl border border-slate-800 text-xs text-slate-400 space-y-2">
                <FileText className="w-8 h-8 text-slate-600 mx-auto" />
                <p>No prescription records found.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {patientPrescriptions.map((rx) => (
                  <div
                    key={rx.id}
                    className="bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 shadow-sm flex flex-col justify-between space-y-4 transition-all"
                  >
                    <div>
                      <div className="flex items-center justify-between pb-2.5 border-b border-slate-800 text-xs">
                        <span className="font-mono font-bold text-teal-400">{rx.id}</span>
                        <span className="font-mono text-slate-400">{rx.date}</span>
                      </div>

                      <div className="mt-3 space-y-1">
                        <h4 className="font-bold text-sm text-white">{rx.doctorName}</h4>
                        <p className="text-xs text-teal-400 font-semibold">{rx.doctorSpecialty}</p>
                        <p className="text-[11px] text-slate-400">{rx.doctorDegrees}</p>
                      </div>

                      {rx.diagnosis && (
                        <div className="mt-2.5 p-2 bg-teal-950/40 rounded-lg border border-teal-500/20 text-xs">
                          <span className="text-[10px] text-teal-400 font-bold uppercase block">Diagnosis:</span>
                          <span className="font-semibold text-teal-200">{rx.diagnosis}</span>
                        </div>
                      )}

                      {/* Medicines preview */}
                      <div className="mt-3 space-y-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Prescribed Medications ({rx.medicines?.length || 0}):</span>
                        <ul className="space-y-1">
                          {rx.medicines?.slice(0, 3).map((med, i) => (
                            <li key={i} className="text-xs text-slate-300 flex items-center justify-between">
                              <span className="font-medium">• {med.name}</span>
                              <span className="font-mono text-[10px] text-teal-400">{med.dosage}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-800 flex justify-end">
                      <button
                        onClick={() => onOpenPrintPrescription(rx)}
                        className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-slate-950 font-black rounded-xl text-xs flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
                      >
                        <Download className="w-4 h-4" />
                        <Printer className="w-4 h-4" />
                        <span>View & Print Prescription (PDF)</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: INVOICES & DUE PAYMENT */}
        {activeTab === 'invoices' && (
          <div className="space-y-4">
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <Receipt className="w-4 h-4 text-teal-400" />
              <span>Money Receipts & Invoice History</span>
            </h3>

            {patientInvoices.length === 0 ? (
              <div className="py-16 text-center bg-slate-900/50 rounded-2xl border border-slate-800 text-xs text-slate-400 space-y-2">
                <Receipt className="w-8 h-8 text-slate-600 mx-auto" />
                <p>No invoice records found.</p>
              </div>
            ) : (
              <div className="bg-slate-900/90 rounded-2xl border border-slate-800 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-950 text-slate-400 uppercase font-bold text-[10px] border-b border-slate-800">
                      <tr>
                        <th className="py-3 px-4">Invoice No</th>
                        <th className="py-3 px-4">Date</th>
                        <th className="py-3 px-4">Services / Tests</th>
                        <th className="py-3 px-4 text-right">Total Fee</th>
                        <th className="py-3 px-4 text-right">Paid Amount</th>
                        <th className="py-3 px-4 text-right">Due Balance</th>
                        <th className="py-3 px-4 text-center">Status</th>
                        <th className="py-3 px-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {patientInvoices.map((inv) => (
                        <tr key={inv.id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="py-3 px-4 font-mono font-bold text-white">{inv.id}</td>
                          <td className="py-3 px-4 font-mono text-slate-400">{inv.date}</td>
                          <td className="py-3 px-4">
                            <span className="font-medium text-slate-200">
                              {inv.items.map((i) => i.name).join(', ')}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-white">
                            ${inv.total.toLocaleString()}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-emerald-400">
                            ${inv.paidAmount.toLocaleString()}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold">
                            {inv.dueAmount > 0 ? (
                              <span className="text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-md border border-rose-500/30">
                                ${inv.dueAmount.toLocaleString()}
                              </span>
                            ) : (
                              <span className="text-slate-500 font-normal">$0</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                inv.status === 'paid'
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                  : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                              }`}
                            >
                              {inv.status === 'paid' ? 'Paid' : 'Due Pending'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {inv.dueAmount > 0 && (
                                <span className="text-[10px] text-rose-400 font-semibold bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                                  Pay at Counter
                                </span>
                              )}
                              <button
                                onClick={() => onOpenPrintInvoice(inv)}
                                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg cursor-pointer transition-colors"
                                title="Print Money Receipt"
                              >
                                <Printer className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: APPOINTMENTS */}
        {activeTab === 'appointments' && (
          <div className="space-y-4">
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-teal-400" />
              <span>Doctor Consultation & Appointment Schedule</span>
            </h3>

            {patientAppointments.length === 0 ? (
              <div className="py-16 text-center bg-slate-900/50 rounded-2xl border border-slate-800 text-xs text-slate-400 space-y-2">
                <Calendar className="w-8 h-8 text-slate-600 mx-auto" />
                <p>No appointment records found.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {patientAppointments.map((apt) => (
                  <div
                    key={apt.id}
                    className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-3"
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-xs">
                      <span className="font-mono font-bold text-teal-400">{apt.id}</span>
                      <span className="px-2.5 py-0.5 bg-teal-500/20 text-teal-300 font-mono font-black rounded-lg border border-teal-500/30">
                        Serial No: #{apt.serialNumber}
                      </span>
                    </div>

                    <div>
                      <h4 className="font-bold text-sm text-white">{apt.doctorName}</h4>
                      <p className="text-xs text-teal-400">{apt.specialization}</p>
                    </div>

                    <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 grid grid-cols-2 gap-2 text-xs">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>Date: {apt.date}</span>
                      </div>
                      <div className="flex items-center gap-2 font-mono">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>Time: {apt.timeSlot}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="p-4 bg-slate-950 border-t border-slate-800 text-center text-xs text-slate-500">
        <p>
          {hospitalSettings.name} • {hospitalSettings.address}
        </p>
        <p className="text-[11px] text-slate-600 mt-0.5">
          Emergency Helpline: {hospitalSettings.hotline || hospitalSettings.phone}
        </p>
      </footer>
    </div>
  );
};
