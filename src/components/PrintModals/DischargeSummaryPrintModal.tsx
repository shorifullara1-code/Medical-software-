import React from 'react';
import { X, Printer, Download, FileText, CheckCircle2, ShieldCheck, HeartPulse, Stethoscope, AlertTriangle } from 'lucide-react';
import { DischargeSummary, HospitalSettings } from '../../types';
import { BarcodeRenderer } from '../BarcodeRenderer';
import { HospitalEmblem } from '../HospitalEmblem';
import { loadHospitalSettings } from '../../utils/storage';

interface DischargeSummaryPrintModalProps {
  summary: DischargeSummary | null;
  onClose: () => void;
  hospitalSettings?: HospitalSettings;
}

export const DischargeSummaryPrintModal: React.FC<DischargeSummaryPrintModalProps> = ({
  summary,
  onClose,
  hospitalSettings: propSettings,
}) => {
  if (!summary) return null;

  const hospitalSettings = propSettings || loadHospitalSettings();

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/70 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-300 w-full max-w-4xl my-auto overflow-hidden">
        {/* Top Control Bar (Screen only) */}
        <div className="no-print px-6 py-3.5 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded text-xs font-mono font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30">
              {summary.id}
            </span>
            <span className="text-sm font-medium">
              Official Inpatient Discharge Summary Certificate (Print Ready A4)
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md transition-all cursor-pointer"
              title="Print discharge summary or save as PDF"
            >
              <Download className="w-4 h-4" />
              <Printer className="w-4 h-4" />
              <span>Download PDF & Print</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Area - Standard A4 dimensions */}
        <div className="printable-area relative p-8 sm:p-10 bg-white text-slate-900 max-w-[210mm] mx-auto min-h-[297mm] flex flex-col justify-between font-sans">
          {/* Subtle Watermark */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.035] select-none z-0">
            <HospitalEmblem size={320} customLogoUrl={hospitalSettings.customLogoUrl} />
          </div>

          <div className="relative z-10 flex-1 flex flex-col justify-between">
            <div>
              {/* 1. TOP LETTERHEAD (Hospital Branding) */}
              <div className="flex items-center gap-4 mb-4 pb-2 border-b-2 border-slate-900">
                <HospitalEmblem
                  size={74}
                  customLogoUrl={hospitalSettings.customLogoUrl}
                  altText={hospitalSettings.name}
                />
                <div className="flex-1 text-center">
                  <h1 className="text-xl sm:text-2xl font-black text-[#581c87] tracking-tight uppercase leading-none font-serif">
                    {hospitalSettings.name}
                  </h1>
                  <p className="text-xs sm:text-sm font-bold text-[#15803d] uppercase tracking-wider mt-0.5">
                    {hospitalSettings.addressEnglish || hospitalSettings.address}
                  </p>
                  <p className="text-xs font-bold text-[#0891b2] uppercase tracking-wide mt-0.5">
                    DEPARTMENT OF INPATIENT SERVICES (IPD) & CLINICAL AUDIT
                  </p>
                  <p className="text-[10px] text-slate-600 font-medium leading-tight mt-1">
                    Tel: {hospitalSettings.phone} {hospitalSettings.hotline ? `| Hotline: ${hospitalSettings.hotline}` : ''} | Email: {hospitalSettings.email} {hospitalSettings.website ? `| Website: ${hospitalSettings.website}` : ''}
                  </p>
                </div>
              </div>

              {/* 2. DUAL-BARCODE & PATIENT ADMISSION BOX */}
              <div className="border border-slate-600 text-xs mb-4 bg-white/90">
                {/* Barcode and Title Header */}
                <div className="px-3 pt-2 pb-1.5 border-b border-slate-600 flex items-center justify-between gap-2">
                  <div className="flex flex-col items-start w-36 shrink-0">
                    <span className="text-[8px] font-bold text-slate-600 uppercase">PATIENT ID</span>
                    <BarcodeRenderer value={summary.patientId} height={24} width={1.1} displayValue={false} />
                    <span className="text-[8px] font-mono text-slate-500 font-bold">{summary.patientId}</span>
                  </div>

                  <div className="flex-1 text-center">
                    <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-wide uppercase font-sans">
                      INPATIENT DISCHARGE SUMMARY CERTIFICATE
                    </h2>
                    <span className="inline-block mt-0.5 px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300">
                      Condition at Discharge: {summary.conditionAtDischarge}
                    </span>
                  </div>

                  <div className="flex flex-col items-end w-36 shrink-0">
                    <span className="text-[8px] font-bold text-slate-600 uppercase">DISCHARGE REF</span>
                    <BarcodeRenderer value={summary.id} height={24} width={1.1} displayValue={false} />
                    <span className="text-[8px] font-mono text-slate-500 font-bold">{summary.id}</span>
                  </div>
                </div>

                {/* Patient & Stay Details Strip */}
                <div className="p-3 text-[11px] grid grid-cols-2 sm:grid-cols-4 gap-2.5 bg-slate-50/70">
                  <div>
                    <span className="text-slate-500 block text-[9px] uppercase font-bold">Patient Name</span>
                    <span className="font-bold text-slate-900 uppercase text-xs">{summary.patientName}</span>
                    <span className="text-slate-500 block text-[10px]">{summary.patientAge} Yrs / {summary.patientGender}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[9px] uppercase font-bold">Admission & Discharge</span>
                    <span className="font-mono font-semibold text-slate-900 block">{summary.admissionDate}</span>
                    <span className="font-mono font-semibold text-slate-900 block">to {summary.dischargeDate}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[9px] uppercase font-bold">Bed / Ward / Length of Stay</span>
                    <span className="font-bold text-slate-900 block">{summary.bedNumber} ({summary.wardType})</span>
                    <span className="font-mono text-teal-700 font-bold text-[10px]">{summary.durationOfStayDays} Days Inpatient Stay</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[9px] uppercase font-bold">Attending Consultant</span>
                    <span className="font-bold text-slate-900 block">{summary.consultantName}</span>
                    <span className="text-slate-500 block text-[10px]">{summary.consultantSpecialty}</span>
                  </div>
                </div>
              </div>

              {/* 3. CLINICAL SUMMARY SECTIONS */}
              <div className="space-y-3.5 text-xs">
                {/* Final Diagnosis & Complaints */}
                <div className="p-3 bg-teal-50/50 border border-teal-200 rounded-lg space-y-1.5">
                  <div className="flex items-start gap-2">
                    <span className="w-32 font-bold uppercase text-[10px] text-teal-950 shrink-0">Final Diagnosis:</span>
                    <span className="font-bold text-slate-900 text-sm">{summary.finalDiagnosis}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="w-32 font-bold uppercase text-[10px] text-slate-600 shrink-0">Chief Complaints:</span>
                    <span className="text-slate-800 leading-snug">{summary.chiefComplaints}</span>
                  </div>
                </div>

                {/* Hospital Course & Clinical Summary */}
                <div className="border border-slate-300 rounded-lg p-3 space-y-1">
                  <h3 className="font-bold text-[10px] uppercase tracking-wider text-slate-700 border-b border-slate-200 pb-1 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-teal-600" />
                    Hospital Course & Summary of Treatment:
                  </h3>
                  <p className="text-slate-800 leading-relaxed whitespace-pre-line text-[11px] pt-1">
                    {summary.clinicalSummary}
                  </p>
                </div>

                {/* Procedures & Investigations Summary */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="border border-slate-300 rounded-lg p-3 space-y-1">
                    <h3 className="font-bold text-[10px] uppercase tracking-wider text-slate-700 border-b border-slate-200 pb-1 flex items-center gap-1.5">
                      <Stethoscope className="w-3.5 h-3.5 text-teal-600" />
                      Procedures & Interventions:
                    </h3>
                    <p className="text-slate-800 text-[11px] pt-1 leading-relaxed">
                      {summary.proceduresDone || 'Medical management with IV medications, oxygen therapy and conservative care.'}
                    </p>
                  </div>

                  <div className="border border-slate-300 rounded-lg p-3 space-y-1">
                    <h3 className="font-bold text-[10px] uppercase tracking-wider text-slate-700 border-b border-slate-200 pb-1 flex items-center gap-1.5">
                      <HeartPulse className="w-3.5 h-3.5 text-teal-600" />
                      Key Investigations & Lab Results:
                    </h3>
                    <p className="text-slate-800 text-[11px] pt-1 leading-relaxed">
                      {summary.investigationsSummary || 'CBC, blood glucose, electrolytes, and routine parameters reviewed and within acceptable limits.'}
                    </p>
                  </div>
                </div>

                {/* Discharge Medications Prescription Table */}
                <div className="border border-slate-300 rounded-lg overflow-hidden">
                  <div className="bg-slate-100 px-3 py-1.5 border-b border-slate-300 flex items-center justify-between">
                    <h3 className="font-bold text-[10px] uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                      <span className="text-base font-serif font-black text-teal-900 leading-none">℞</span>
                      Discharge Medications & Regimen:
                    </h3>
                    <span className="text-[10px] text-slate-500 font-medium">To be continued at home</span>
                  </div>
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="bg-slate-50 text-slate-600 font-bold text-[10px] border-b border-slate-200">
                        <th className="py-1.5 px-3 w-8">#</th>
                        <th className="py-1.5 px-3">Medicine Name & Strength</th>
                        <th className="py-1.5 px-3 w-28">Dosage / Frequency</th>
                        <th className="py-1.5 px-3 w-24">Duration</th>
                        <th className="py-1.5 px-3">Instructions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {summary.dischargeMedicines && summary.dischargeMedicines.length > 0 ? (
                        summary.dischargeMedicines.map((med, idx) => (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="py-1.5 px-3 font-mono text-slate-500">{idx + 1}</td>
                            <td className="py-1.5 px-3 font-bold text-slate-900">{med.name}</td>
                            <td className="py-1.5 px-3 font-mono font-bold text-teal-800">{med.dosage}</td>
                            <td className="py-1.5 px-3 font-medium text-slate-600">{med.duration}</td>
                            <td className="py-1.5 px-3 text-slate-700">{med.instruction}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="py-3 text-center text-slate-400 italic">
                            No oral discharge medications prescribed. Continue routine home medications.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Follow-up, Diet & Emergency Warnings */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="p-3 bg-slate-50 border border-slate-300 rounded-lg space-y-1">
                    <h4 className="font-bold text-[10px] uppercase tracking-wider text-slate-800">
                      Follow-up & Review Plan:
                    </h4>
                    <p className="text-slate-800 text-[11px] leading-relaxed">
                      {summary.followUpAdvice}
                    </p>
                    <p className="text-[11px] font-bold text-teal-900 mt-1">
                      Next Follow-Up Date: <span className="font-mono">{summary.nextVisitDate || 'As required'}</span>
                    </p>
                  </div>

                  <div className="p-3 bg-amber-50/60 border border-amber-300 rounded-lg space-y-1">
                    <h4 className="font-bold text-[10px] uppercase tracking-wider text-amber-900 flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-700" />
                      When to Seek Immediate Emergency Care:
                    </h4>
                    <p className="text-amber-950 text-[11px] leading-relaxed">
                      {summary.emergencyInstructions}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* 4. OFFICIAL SIGNATURES & STAMP */}
            <div className="mt-8 pt-4 border-t-2 border-slate-900 text-xs">
              <div className="grid grid-cols-3 gap-6 text-center">
                <div>
                  <div className="h-10 border-b border-slate-600 flex items-end justify-center pb-1">
                    <p className="text-[10px] font-serif italic text-slate-400">{summary.generatedBy}</p>
                  </div>
                  <p className="text-xs font-bold text-slate-900 mt-1">Duty Medical Officer</p>
                  <p className="text-[10px] text-slate-500">Inpatient Department (IPD)</p>
                </div>

                <div>
                  <div className="h-10 border-b border-slate-600 flex items-end justify-center pb-1">
                    <p className="text-[10px] font-serif italic text-slate-400">{summary.consultantName}</p>
                  </div>
                  <p className="text-xs font-bold text-slate-900 mt-1">{summary.consultantName}</p>
                  <p className="text-[10px] text-slate-500">Treating Consultant</p>
                </div>

                <div>
                  <div className="h-10 border-b border-slate-600 flex items-end justify-center pb-1">
                    <p className="text-[10px] font-serif italic text-slate-400">Authorized Hospital Stamp</p>
                  </div>
                  <p className="text-xs font-bold text-slate-900 mt-1">Medical Superintendent</p>
                  <p className="text-[10px] text-slate-500">{hospitalSettings.name}</p>
                </div>
              </div>

              <div className="mt-4 pt-2 border-t border-slate-200 text-center text-[9px] text-slate-500 flex items-center justify-between">
                <span>{hospitalSettings.govtRegNo || 'DGHS Reg No: 2026/DH-4821'}</span>
                <span>Generated on: {summary.generatedAt}</span>
                <span>Page 1/1 (A4 Official Medical Certificate)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
