import React, { useState, useMemo } from 'react';
import {
  X,
  Search,
  User,
  Activity,
  FileText,
  Receipt,
  Calendar,
  Building,
  Bed,
  Phone,
  Droplet,
  Clock,
  Printer,
  Download,
  AlertTriangle,
  CheckCircle2,
  Stethoscope,
  HeartPulse,
  ChevronRight,
  ShieldCheck,
  Filter,
} from 'lucide-react';
import {
  Patient,
  Prescription,
  LabReport,
  Invoice,
  Appointment,
  IPDAdmission,
  DischargeSummary,
  HospitalSettings,
  PharmacySale,
} from '../types';
import { HospitalEmblem } from './HospitalEmblem';
import { BarcodeRenderer } from './BarcodeRenderer';
import { getPatientFinancialSummary } from '../utils/bedRentBilling';
import { Pill } from 'lucide-react';

interface PatientHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientId: string | null;
  patients: Patient[];
  prescriptions: Prescription[];
  labReports: LabReport[];
  invoices: Invoice[];
  appointments: Appointment[];
  ipdAdmissions: IPDAdmission[];
  pharmacySales?: PharmacySale[];
  hospitalSettings: HospitalSettings;
  onOpenPrescriptionPrint: (rx: Prescription) => void;
  onOpenLabReportPrint: (report: LabReport) => void;
  onOpenInvoicePrint: (inv: Invoice) => void;
  onOpenDischargeSummaryPrint: (summary: DischargeSummary) => void;
  onOpenAdmissionSlipPrint?: (adm: IPDAdmission) => void;
  onOpenPharmacySlipPrint?: (sale: PharmacySale) => void;
  onSelectPatient?: (patientId: string) => void;
}

export const PatientHistoryModal: React.FC<PatientHistoryModalProps> = ({
  isOpen,
  onClose,
  patientId,
  patients,
  prescriptions,
  labReports,
  invoices,
  appointments,
  ipdAdmissions,
  pharmacySales = [],
  hospitalSettings,
  onOpenPrescriptionPrint,
  onOpenLabReportPrint,
  onOpenInvoicePrint,
  onOpenDischargeSummaryPrint,
  onOpenAdmissionSlipPrint,
  onOpenPharmacySlipPrint,
  onSelectPatient,
}) => {
  const [selectedId, setSelectedId] = useState<string>(patientId || (patients[0]?.id ?? ''));
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'timeline' | 'ipd' | 'opd' | 'prescriptions' | 'lab' | 'billing'>('timeline');

  // Sync when patientId prop changes
  React.useEffect(() => {
    if (patientId) {
      setSelectedId(patientId);
    } else if (patients.length > 0 && !selectedId) {
      setSelectedId(patients[0].id);
    }
  }, [patientId, patients]);

  const activePatient = useMemo(() => {
    return patients.find((p) => p.id === selectedId) || patients[0];
  }, [patients, selectedId]);

  // Filtered lists for this patient
  const patientPrescriptions = useMemo(
    () => prescriptions.filter((p) => p.patientId === activePatient?.id),
    [prescriptions, activePatient]
  );

  const patientLabReports = useMemo(
    () => labReports.filter((r) => r.patientId === activePatient?.id),
    [labReports, activePatient]
  );

  const patientInvoices = useMemo(
    () => invoices.filter((i) => i.patientId === activePatient?.id),
    [invoices, activePatient]
  );

  const patientAppointments = useMemo(
    () => appointments.filter((a) => a.patientId === activePatient?.id),
    [appointments, activePatient]
  );

  const patientAdmissions = useMemo(
    () => ipdAdmissions.filter((adm) => adm.patientId === activePatient?.id),
    [ipdAdmissions, activePatient]
  );

  // Filtered patients for dropdown/search
  const matchingPatients = useMemo(() => {
    if (!searchQuery.trim()) return patients.slice(0, 10);
    const q = searchQuery.toLowerCase();
    return patients.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.id.toLowerCase().includes(q) ||
        p.phone.includes(q)
    );
  }, [patients, searchQuery]);

  // Combined Medical Events Timeline
  const timelineEvents = useMemo(() => {
    const list: Array<{
      id: string;
      date: string;
      type: 'ipd' | 'opd' | 'prescription' | 'lab' | 'billing';
      title: string;
      subtitle: string;
      badge: string;
      badgeColor: string;
      data: any;
    }> = [];

    // IPD Admissions
    patientAdmissions.forEach((adm) => {
      list.push({
        id: adm.id,
        date: adm.admittedAt,
        type: 'ipd',
        title: `IPD Admission (${adm.bedNumber} - ${adm.wardType})`,
        subtitle: `Diagnosis: ${adm.admissionDiagnosis} • Admitted by: ${adm.admittingDoctorName}`,
        badge: adm.status === 'discharged' ? 'Discharged' : 'Active Inpatient',
        badgeColor: adm.status === 'discharged' ? 'bg-purple-100 text-purple-800' : 'bg-emerald-100 text-emerald-800',
        data: adm,
      });
    });

    // OPD Consultations / Appointments
    patientAppointments.forEach((apt) => {
      list.push({
        id: apt.id,
        date: `${apt.date} ${apt.timeSlot}`,
        type: 'opd',
        title: `OPD Consultation: ${apt.doctorName}`,
        subtitle: `Specialty: ${apt.specialization} • Serial #${apt.serialNumber}${apt.notes ? ` • Notes: ${apt.notes}` : ''}`,
        badge: `OPD (${apt.status})`,
        badgeColor: 'bg-amber-100 text-amber-800',
        data: apt,
      });
    });

    // Prescriptions
    patientPrescriptions.forEach((rx) => {
      list.push({
        id: rx.id,
        date: rx.date,
        type: 'prescription',
        title: `Prescription: ${rx.diagnosis || 'Clinical Consultation'}`,
        subtitle: `Doctor: ${rx.doctorName} • ${rx.medicines?.length || 0} Medications prescribed`,
        badge: 'Prescription ℞',
        badgeColor: 'bg-teal-100 text-teal-800',
        data: rx,
      });
    });

    // Lab Reports
    patientLabReports.forEach((lab) => {
      list.push({
        id: lab.id,
        date: lab.reportedAt || lab.sampleCollectedAt || '2026-10-05',
        type: 'lab',
        title: `Diagnostic Report: ${lab.testName}`,
        subtitle: `Referred by: ${lab.referredByDoctor} • Status: ${lab.status}`,
        badge: 'Lab Report',
        badgeColor: lab.status === 'completed' ? 'bg-sky-100 text-sky-800' : 'bg-slate-100 text-slate-800',
        data: lab,
      });
    });

    // Invoices
    patientInvoices.forEach((inv) => {
      list.push({
        id: inv.id,
        date: inv.date,
        type: 'billing',
        title: `Invoice & Money Receipt: BDT ${inv.total.toLocaleString()}`,
        subtitle: `Paid: BDT ${inv.paidAmount.toLocaleString()} • Due: BDT ${inv.dueAmount.toLocaleString()} • ${inv.items.map((i) => i.name).join(', ')}`,
        badge: inv.dueAmount > 0 ? 'Due Balance' : 'Paid',
        badgeColor: inv.dueAmount > 0 ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800',
        data: inv,
      });
    });

    // Pharmacy Medicine Sales & Credit Records
    const patientMedSales = pharmacySales.filter((s) => s.patientId === activePatient?.id);
    patientMedSales.forEach((sale) => {
      const isCredit = sale.dueAmount > 0;
      list.push({
        id: sale.id,
        date: sale.dispensedAt.split(' ')[0] || '2026-10-05',
        type: 'billing',
        title: `Pharmacy Medicine Sale: BDT ${sale.total.toLocaleString()} (${sale.saleType === 'indoor' ? 'Indoor Patient' : 'Outdoor'})`,
        subtitle: `Items: ${sale.items.map((i) => `${i.medicineName} (x${i.quantity})`).join(', ')} • Paid: BDT ${sale.paidAmount.toLocaleString()} • Due: BDT ${sale.dueAmount.toLocaleString()}`,
        badge: isCredit ? 'Medicine Credit (বাকি)' : 'Medicine Paid',
        badgeColor: isCredit ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'bg-teal-100 text-teal-800',
        data: sale,
      });
    });

    return list.sort((a, b) => b.date.localeCompare(a.date));
  }, [patientAdmissions, patientAppointments, patientPrescriptions, patientLabReports, patientInvoices, pharmacySales, activePatient]);

  const financialSummary = useMemo(() => {
    if (!activePatient) return null;
    return getPatientFinancialSummary(activePatient.id, patientInvoices, ipdAdmissions, pharmacySales);
  }, [activePatient, patientInvoices, ipdAdmissions, pharmacySales]);

  const totalBilled = patientInvoices.reduce((sum, i) => sum + i.total, 0);
  const totalPaid = patientInvoices.reduce((sum, i) => sum + i.paidAmount, 0);
  const totalDue = financialSummary?.grandTotalOutstandingDue ?? patientInvoices.reduce((sum, i) => sum + i.dueAmount, 0);

  if (!isOpen || !activePatient) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-300 w-full max-w-5xl my-auto overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header Bar */}
        <div className="px-6 py-4 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-teal-500/20 text-teal-300 border border-teal-500/30">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-tight flex items-center gap-2">
                <span>Patient Electronic Medical History (EMR)</span>
                <span className="font-mono text-xs text-teal-400 px-2 py-0.5 rounded bg-slate-800 border border-slate-700">
                  {activePatient.id}
                </span>
              </h2>
              <p className="text-[11px] text-slate-400 font-medium">
                Comprehensive timeline of OPD visits, IPD admissions, lab investigations, prescriptions & discharge summaries
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Quick Patient Switcher */}
            <div className="relative">
              <input
                type="text"
                placeholder="Switch patient by name/phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-56 px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
              />
              {searchQuery && (
                <div className="absolute top-full mt-1 left-0 w-64 bg-slate-800 border border-slate-700 rounded-xl shadow-xl z-20 max-h-48 overflow-y-auto p-1 divide-y divide-slate-700">
                  {matchingPatients.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => {
                        setSelectedId(p.id);
                        setSearchQuery('');
                        if (onSelectPatient) onSelectPatient(p.id);
                      }}
                      className="w-full text-left p-2 hover:bg-slate-700 rounded-lg text-xs text-white flex justify-between items-center cursor-pointer"
                    >
                      <div>
                        <span className="font-bold">{p.name}</span>
                        <span className="text-[10px] text-slate-400 block font-mono">{p.phone}</span>
                      </div>
                      <span className="font-mono text-[10px] text-teal-300">{p.id}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Patient Profile Card (Sticky Banner) */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-50 via-teal-50/30 to-indigo-50/30 border-b border-slate-200 shrink-0">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-teal-600 text-white font-black text-lg flex items-center justify-center shadow-md">
                {activePatient.name.charAt(0)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-black text-slate-900">{activePatient.name}</h3>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-teal-100 text-teal-800 border border-teal-200">
                    {activePatient.id}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 font-medium mt-0.5">
                  <span>Age: {activePatient.age} Yrs</span>
                  <span>•</span>
                  <span>Gender: {activePatient.gender === 'male' ? 'Male' : 'Female'}</span>
                  <span>•</span>
                  <span className="font-bold text-rose-600 flex items-center gap-1">
                    <Droplet className="w-3.5 h-3.5 fill-rose-500" />
                    {activePatient.bloodGroup}
                  </span>
                  <span>•</span>
                  <span className="font-mono text-slate-800">{activePatient.phone}</span>
                </div>
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="flex flex-wrap items-center gap-3 text-xs font-mono">
              <div className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 shadow-2xs text-center">
                <span className="text-[10px] text-slate-400 block font-sans uppercase font-bold">OPD Visits</span>
                <span className="font-bold text-slate-900">{patientAppointments.length}</span>
              </div>
              <div className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 shadow-2xs text-center">
                <span className="text-[10px] text-slate-400 block font-sans uppercase font-bold">IPD Admissions</span>
                <span className="font-bold text-purple-700">{patientAdmissions.length}</span>
              </div>
              <div className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 shadow-2xs text-center">
                <span className="text-[10px] text-slate-400 block font-sans uppercase font-bold">Lab Tests</span>
                <span className="font-bold text-sky-700">{patientLabReports.length}</span>
              </div>
              <div className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 shadow-2xs text-center">
                <span className="text-[10px] text-slate-400 block font-sans uppercase font-bold">Total Dues</span>
                <span className={`font-bold ${totalDue > 0 ? 'text-rose-600' : 'text-emerald-700'}`}>
                  BDT {totalDue.toLocaleString()}
                </span>
                {financialSummary?.activeBedRentDetail && financialSummary.activeBedRentDetail.netBedRentDue > 0 && (
                  <span className="text-[9px] text-purple-700 block font-semibold">
                    (Bed Due: BDT {financialSummary.activeBedRentDetail.netBedRentDue.toLocaleString()})
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Medical Alerts & Address */}
          <div className="mt-3 pt-2 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-3 text-slate-600">
              <span><strong>Address:</strong> {activePatient.address}</span>
              <span>•</span>
              <span><strong>Emergency Contact:</strong> {activePatient.emergencyContact || 'N/A'}</span>
            </div>
            {activePatient.allergies && (
              <span className="px-2.5 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200 font-bold text-[11px] flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                Allergies: {activePatient.allergies}
              </span>
            )}
          </div>
        </div>

        {/* Tabs Bar */}
        <div className="px-6 border-b border-slate-200 bg-white flex flex-wrap items-center gap-2 pt-2 shrink-0">
          <button
            onClick={() => setActiveTab('timeline')}
            className={`px-3.5 py-2 font-bold text-xs rounded-t-xl transition-all cursor-pointer border-b-2 flex items-center gap-1.5 ${
              activeTab === 'timeline'
                ? 'border-teal-600 text-teal-800 bg-teal-50/50'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Complete Medical Timeline ({timelineEvents.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('ipd')}
            className={`px-3.5 py-2 font-bold text-xs rounded-t-xl transition-all cursor-pointer border-b-2 flex items-center gap-1.5 ${
              activeTab === 'ipd'
                ? 'border-purple-600 text-purple-800 bg-purple-50/50'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Bed className="w-3.5 h-3.5" />
            <span>IPD Admissions & Discharge Summaries ({patientAdmissions.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('prescriptions')}
            className={`px-3.5 py-2 font-bold text-xs rounded-t-xl transition-all cursor-pointer border-b-2 flex items-center gap-1.5 ${
              activeTab === 'prescriptions'
                ? 'border-teal-600 text-teal-800 bg-teal-50/50'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Prescriptions ({patientPrescriptions.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('lab')}
            className={`px-3.5 py-2 font-bold text-xs rounded-t-xl transition-all cursor-pointer border-b-2 flex items-center gap-1.5 ${
              activeTab === 'lab'
                ? 'border-sky-600 text-sky-800 bg-sky-50/50'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Lab & Pathology Reports ({patientLabReports.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('billing')}
            className={`px-3.5 py-2 font-bold text-xs rounded-t-xl transition-all cursor-pointer border-b-2 flex items-center gap-1.5 ${
              activeTab === 'billing'
                ? 'border-indigo-600 text-indigo-800 bg-indigo-50/50'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>Billing & Invoices ({patientInvoices.length})</span>
          </button>
        </div>

        {/* Tab Content Body (Scrollable) */}
        <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-slate-50/40">
          {/* TAB 1: ALL MEDICAL TIMELINE */}
          {activeTab === 'timeline' && (
            <div className="space-y-4">
              {timelineEvents.length === 0 ? (
                <div className="py-16 text-center text-slate-400 space-y-2">
                  <Activity className="w-10 h-10 text-slate-300 mx-auto" />
                  <p className="text-sm font-semibold">No medical history events recorded yet for this patient.</p>
                </div>
              ) : (
                <div className="relative border-l-2 border-slate-200 ml-4 space-y-6">
                  {timelineEvents.map((ev, idx) => (
                    <div key={idx} className="relative pl-6">
                      {/* Timeline Node Dot */}
                      <div
                        className={`absolute -left-[9px] top-1.5 w-4 h-4 rounded-full border-2 border-white shadow-xs ${
                          ev.type === 'ipd'
                            ? 'bg-purple-600'
                            : ev.type === 'opd'
                            ? 'bg-amber-500'
                            : ev.type === 'prescription'
                            ? 'bg-teal-500'
                            : ev.type === 'lab'
                            ? 'bg-sky-500'
                            : 'bg-indigo-600'
                        }`}
                      />

                      {/* Event Card */}
                      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-xs transition-shadow">
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${ev.badgeColor}`}>
                              {ev.badge}
                            </span>
                            <span className="text-xs font-bold text-slate-900">{ev.title}</span>
                          </div>
                          <span className="text-[11px] font-mono text-slate-400">{ev.date}</span>
                        </div>

                        <p className="text-xs text-slate-600 leading-relaxed">{ev.subtitle}</p>

                        {/* Quick View / Print Action */}
                        <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
                          {ev.type === 'prescription' && (
                            <button
                              onClick={() => onOpenPrescriptionPrint(ev.data)}
                              className="px-3 py-1 bg-teal-50 hover:bg-teal-100 text-teal-800 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                            >
                              <Printer className="w-3.5 h-3.5" />
                              <span>View Prescription</span>
                            </button>
                          )}

                          {ev.type === 'lab' && (
                            <button
                              onClick={() => onOpenLabReportPrint(ev.data)}
                              className="px-3 py-1 bg-sky-50 hover:bg-sky-100 text-sky-800 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                            >
                              <Printer className="w-3.5 h-3.5" />
                              <span>View Lab Report</span>
                            </button>
                          )}

                          {ev.type === 'billing' && (
                            <button
                              onClick={() => onOpenInvoicePrint(ev.data)}
                              className="px-3 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                            >
                              <Printer className="w-3.5 h-3.5" />
                              <span>View Money Receipt</span>
                            </button>
                          )}

                          {ev.type === 'ipd' && (
                            <div className="flex items-center gap-2">
                              {onOpenAdmissionSlipPrint && (
                                <button
                                  onClick={() => onOpenAdmissionSlipPrint(ev.data)}
                                  className="px-3 py-1 bg-purple-50 hover:bg-purple-100 text-purple-800 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                                >
                                  <Printer className="w-3.5 h-3.5" />
                                  <span>Admission Slip</span>
                                </button>
                              )}
                              {ev.data.dischargeSummary && (
                                <button
                                  onClick={() => onOpenDischargeSummaryPrint(ev.data.dischargeSummary)}
                                  className="px-3 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                                >
                                  <Printer className="w-3.5 h-3.5" />
                                  <span>Discharge Summary</span>
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: IPD ADMISSIONS & DISCHARGE SUMMARIES */}
          {activeTab === 'ipd' && (
            <div className="space-y-4">
              {patientAdmissions.length === 0 ? (
                <div className="py-16 text-center text-slate-400 space-y-2">
                  <Bed className="w-10 h-10 text-slate-300 mx-auto" />
                  <p className="text-sm font-semibold">No inpatient admission records found for this patient.</p>
                </div>
              ) : (
                patientAdmissions.map((adm) => (
                  <div key={adm.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-xs text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                            {adm.id}
                          </span>
                          <h4 className="font-bold text-sm text-slate-900">
                            {adm.bedNumber} ({adm.wardType})
                          </h4>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              adm.status === 'discharged'
                                ? 'bg-purple-100 text-purple-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {adm.status === 'discharged' ? 'Discharged' : 'Active Inpatient'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                          Admitted: <strong className="text-slate-800">{adm.admittedAt}</strong>
                          {adm.dischargedAt && (
                            <> • Discharged: <strong className="text-slate-800">{adm.dischargedAt}</strong></>
                          )}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        {onOpenAdmissionSlipPrint && (
                          <button
                            onClick={() => onOpenAdmissionSlipPrint(adm)}
                            className="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
                          >
                            <Printer className="w-3.5 h-3.5 text-purple-700" />
                            <span>Admission Slip</span>
                          </button>
                        )}
                        {adm.dischargeSummary && (
                          <button
                            onClick={() => onOpenDischargeSummaryPrint(adm.dischargeSummary!)}
                            className="px-4 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>Discharge Summary</span>
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                        <span className="text-[10px] uppercase font-bold text-slate-500 block">Admitting Diagnosis</span>
                        <p className="font-semibold text-slate-900">{adm.admissionDiagnosis}</p>
                        <p className="text-slate-600">Consultant: {adm.admittingDoctorName} ({adm.admittingDepartment})</p>
                      </div>

                      <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                        <span className="text-[10px] uppercase font-bold text-slate-500 block">Financials</span>
                        <p className="font-mono text-slate-800">Daily Bed Rate: ${adm.dailyBedCharge.toLocaleString()} / day</p>
                        <p className="font-mono text-slate-800">Advance Deposit: ${adm.advancePayment?.toLocaleString() || 0}</p>
                      </div>
                    </div>

                    {/* Vitals Logs in Admission */}
                    {adm.vitalsHistory && adm.vitalsHistory.length > 0 && (
                      <div className="pt-2">
                        <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
                          Vitals Chart During Stay:
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                          {adm.vitalsHistory.map((v) => (
                            <div key={v.id} className="p-2.5 bg-teal-50/50 border border-teal-100 rounded-lg text-[11px] font-mono">
                              <span className="text-slate-500 block text-[10px]">{v.date} (By: {v.recordedBy})</span>
                              <span className="font-bold text-slate-900">BP: {v.bp} • Pulse: {v.pulse} • Temp: {v.temp} • SpO2: {v.spo2}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 3: PRESCRIPTIONS */}
          {activeTab === 'prescriptions' && (
            <div className="space-y-4">
              {patientPrescriptions.length === 0 ? (
                <div className="py-16 text-center text-slate-400 space-y-2">
                  <FileText className="w-10 h-10 text-slate-300 mx-auto" />
                  <p className="text-sm font-semibold">No prescriptions found for this patient.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {patientPrescriptions.map((rx) => (
                    <div key={rx.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between space-y-3">
                      <div>
                        <div className="flex items-center justify-between pb-2 border-b border-slate-100 text-xs">
                          <span className="font-mono font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                            {rx.id}
                          </span>
                          <span className="font-mono text-slate-500">{rx.date}</span>
                        </div>

                        <div className="mt-2.5 space-y-1">
                          <h4 className="font-bold text-sm text-slate-900">{rx.doctorName}</h4>
                          <p className="text-xs text-teal-700 font-semibold">{rx.doctorSpecialty}</p>
                          {rx.diagnosis && (
                            <p className="text-xs text-slate-700 mt-1">
                              <strong>Diagnosis:</strong> {rx.diagnosis}
                            </p>
                          )}
                        </div>

                        {/* Medicines list */}
                        {rx.medicines && rx.medicines.length > 0 && (
                          <div className="mt-3 pt-2 border-t border-slate-100 space-y-1">
                            <span className="text-[10px] uppercase font-bold text-slate-400">Prescribed Drugs:</span>
                            <ul className="text-xs space-y-1 text-slate-800">
                              {rx.medicines.slice(0, 3).map((m, i) => (
                                <li key={i} className="flex justify-between items-center text-[11px]">
                                  <span className="font-medium">• {m.name}</span>
                                  <span className="font-mono text-teal-800">{m.dosage}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>

                      <div className="pt-2 border-t border-slate-100 flex justify-end">
                        <button
                          onClick={() => onOpenPrescriptionPrint(rx)}
                          className="px-3.5 py-1.5 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>Print Prescription</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: LAB REPORTS */}
          {activeTab === 'lab' && (
            <div className="space-y-4">
              {patientLabReports.length === 0 ? (
                <div className="py-16 text-center text-slate-400 space-y-2">
                  <Activity className="w-10 h-10 text-slate-300 mx-auto" />
                  <p className="text-sm font-semibold">No lab diagnostic reports on record.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {patientLabReports.map((report) => (
                    <div key={report.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between space-y-3">
                      <div>
                        <div className="flex items-center justify-between pb-2 border-b border-slate-100 text-xs">
                          <span className="font-mono font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                            {report.id}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              report.status === 'completed'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {report.status === 'completed' ? 'Completed ✓' : 'Processing'}
                          </span>
                        </div>

                        <div className="mt-2.5 space-y-1">
                          <h4 className="font-bold text-sm text-slate-900">{report.testName}</h4>
                          <p className="text-xs text-slate-500">Referred: {report.referredByDoctor}</p>
                          <p className="text-[11px] font-mono text-slate-400">Date: {report.reportedAt || report.sampleCollectedAt}</p>
                        </div>

                        {/* CBC quick numbers */}
                        {report.cbcParameters && (
                          <div className="mt-3 p-2 bg-slate-50 rounded-xl grid grid-cols-3 gap-2 text-center text-xs font-mono">
                            <div>
                              <span className="text-[9px] text-slate-400 block font-sans">Hb</span>
                              <span className="font-bold text-slate-800">{report.cbcParameters.hemoglobin.val} g/dL</span>
                            </div>
                            <div>
                              <span className="text-[9px] text-slate-400 block font-sans">Platelets</span>
                              <span className="font-bold text-slate-800">{report.cbcParameters.plateletCount.val.toLocaleString()}</span>
                            </div>
                            <div>
                              <span className="text-[9px] text-slate-400 block font-sans">WBC</span>
                              <span className="font-bold text-slate-800">{report.cbcParameters.totalWbc.val.toLocaleString()}</span>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="pt-2 border-t border-slate-100 flex justify-end">
                        <button
                          onClick={() => onOpenLabReportPrint(report)}
                          className="px-3.5 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>View Lab Report</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 5: BILLING & INVOICES */}
          {activeTab === 'billing' && (
            <div className="space-y-4">
              {patientInvoices.length === 0 ? (
                <div className="py-16 text-center text-slate-400 space-y-2">
                  <Receipt className="w-10 h-10 text-slate-300 mx-auto" />
                  <p className="text-sm font-semibold">No invoices recorded for this patient.</p>
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 text-slate-600 uppercase font-bold text-[10px] border-b border-slate-200">
                      <tr>
                        <th className="p-3">Invoice ID</th>
                        <th className="p-3">Date</th>
                        <th className="p-3">Services / Items</th>
                        <th className="p-3 text-right">Total Fee</th>
                        <th className="p-3 text-right">Paid</th>
                        <th className="p-3 text-right">Due Balance</th>
                        <th className="p-3 text-center">Status</th>
                        <th className="p-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {patientInvoices.map((inv) => (
                        <tr key={inv.id} className="hover:bg-slate-50">
                          <td className="p-3 font-mono font-bold text-slate-900">{inv.id}</td>
                          <td className="p-3 font-mono text-slate-500">{inv.date}</td>
                          <td className="p-3">
                            <span className="font-medium text-slate-800">
                              {inv.items.map((it) => it.name).join(', ')}
                            </span>
                          </td>
                          <td className="p-3 text-right font-mono font-bold text-slate-900">${inv.total.toLocaleString()}</td>
                          <td className="p-3 text-right font-mono font-bold text-emerald-700">${inv.paidAmount.toLocaleString()}</td>
                          <td className="p-3 text-right font-mono font-black text-rose-600">
                            {inv.dueAmount > 0 ? `$${inv.dueAmount.toLocaleString()}` : '$0'}
                          </td>
                          <td className="p-3 text-center">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                inv.status === 'paid'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              {inv.status === 'paid' ? 'Paid' : 'Due'}
                            </span>
                          </td>
                          <td className="p-3 text-right">
                            <button
                              onClick={() => onOpenInvoicePrint(inv)}
                              className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg cursor-pointer"
                              title="Print Receipt"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
