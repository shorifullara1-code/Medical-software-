import React from 'react';
import { X, Printer, Download, Bed, ShieldCheck, HeartPulse, Stethoscope, AlertCircle, FileText, CheckCircle2 } from 'lucide-react';
import { IPDAdmission, HospitalSettings } from '../../types';
import { BarcodeRenderer } from '../BarcodeRenderer';
import { HospitalEmblem } from '../HospitalEmblem';
import { loadHospitalSettings } from '../../utils/storage';

interface AdmissionSlipPrintModalProps {
  admission: IPDAdmission | null;
  onClose: () => void;
  hospitalSettings?: HospitalSettings;
}

export const AdmissionSlipPrintModal: React.FC<AdmissionSlipPrintModalProps> = ({
  admission,
  onClose,
  hospitalSettings: propSettings,
}) => {
  if (!admission) return null;

  const hospitalSettings = propSettings || loadHospitalSettings();

  const handlePrint = () => {
    window.print();
  };

  const latestVitals = admission.vitalsHistory && admission.vitalsHistory.length > 0
    ? admission.vitalsHistory[admission.vitalsHistory.length - 1]
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/70 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-300 w-full max-w-4xl my-auto overflow-hidden animate-fadeIn">
        {/* Top Control Bar (Screen only) */}
        <div className="no-print px-6 py-3.5 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded text-xs font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
              {admission.id}
            </span>
            <span className="text-sm font-medium">
              Official Inpatient Admission Slip & Bed Ticket (Print Ready A4)
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md transition-all cursor-pointer"
              title="Print admission slip or save as PDF"
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

          <div className="relative z-10 flex-1 flex flex-col justify-between space-y-5">
            <div>
              {/* 1. TOP LETTERHEAD (Hospital Branding) */}
              <div className="flex items-center gap-4 mb-3 pb-2 border-b-2 border-slate-900">
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
                    DEPARTMENT OF INPATIENT SERVICES (IPD) & ADMISSION DESK
                  </p>
                  <p className="text-[10px] text-slate-600 font-medium leading-tight mt-1">
                    Tel: {hospitalSettings.phone} {hospitalSettings.hotline ? `| Hotline: ${hospitalSettings.hotline}` : ''} | Email: {hospitalSettings.email} {hospitalSettings.website ? `| Website: ${hospitalSettings.website}` : ''}
                  </p>
                  {hospitalSettings.govtRegNo && (
                    <p className="text-[9px] text-slate-500 font-mono mt-0.5">
                      {hospitalSettings.govtRegNo}
                    </p>
                  )}
                </div>
              </div>

              {/* 2. DUAL-BARCODE & ADMISSION SLIP TITLE BOX */}
              <div className="border border-slate-600 text-xs mb-4 bg-white/95">
                <div className="px-3 pt-2 pb-1.5 border-b border-slate-600 flex items-center justify-between gap-2">
                  <div className="flex flex-col items-start w-36 shrink-0">
                    <span className="text-[8px] font-bold text-slate-600 uppercase">PATIENT ID</span>
                    <BarcodeRenderer value={admission.patientId} height={24} width={1.1} displayValue={false} />
                    <span className="text-[8px] font-mono text-slate-600 font-bold">{admission.patientId}</span>
                  </div>

                  <div className="flex-1 text-center">
                    <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-wide uppercase font-sans">
                      INPATIENT ADMISSION SLIP & BED TICKET
                    </h2>
                    <span className="inline-block mt-0.5 px-3 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-purple-100 text-purple-900 border border-purple-300">
                      STATUS: ADMITTED INPATIENT ({admission.wardType})
                    </span>
                  </div>

                  <div className="flex flex-col items-end w-36 shrink-0">
                    <span className="text-[8px] font-bold text-slate-600 uppercase">ADMISSION REF</span>
                    <BarcodeRenderer value={admission.id} height={24} width={1.1} displayValue={false} />
                    <span className="text-[8px] font-mono text-slate-600 font-bold">{admission.id}</span>
                  </div>
                </div>

                {/* Patient Information Strip */}
                <div className="p-3 text-[11px] grid grid-cols-2 sm:grid-cols-4 gap-2.5 bg-slate-50/70 border-b border-slate-200">
                  <div>
                    <span className="text-slate-500 block text-[9px] uppercase font-bold">Patient Full Name</span>
                    <span className="font-bold text-slate-900 uppercase text-xs block">{admission.patientName}</span>
                    <span className="text-slate-600 text-[10px]">{admission.patientAge} Yrs / {admission.patientGender}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[9px] uppercase font-bold">Contact Phone</span>
                    <span className="font-mono font-bold text-slate-900 text-xs block">{admission.patientPhone}</span>
                    <span className="text-slate-500 text-[10px]">Primary Contact</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[9px] uppercase font-bold">Blood Group</span>
                    <span className="inline-block font-black text-xs text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                      {admission.patientBloodGroup || 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[9px] uppercase font-bold">Admission Date & Time</span>
                    <span className="font-mono font-bold text-slate-900 text-xs block">{admission.admittedAt}</span>
                    <span className="text-slate-500 text-[10px]">Time of Indoor Entry</span>
                  </div>
                </div>

                {/* Bed Allocation & Financial Deposit Box */}
                <div className="p-3 text-[11px] grid grid-cols-1 sm:grid-cols-3 gap-3 bg-purple-50/40">
                  <div className="p-2.5 bg-white rounded-lg border border-purple-200 space-y-1">
                    <span className="text-purple-900 block text-[9px] uppercase font-bold flex items-center gap-1">
                      <Bed className="w-3 h-3 text-purple-700" />
                      <span>Allocated Bed & Ward</span>
                    </span>
                    <p className="font-black text-slate-900 text-sm font-mono">
                      {admission.bedNumber}
                    </p>
                    <p className="text-[10px] font-semibold text-slate-600">
                      Unit: {admission.wardType}
                    </p>
                    <p className="text-[10px] text-teal-800 font-bold font-mono">
                      Daily Rate: ${admission.dailyBedCharge.toLocaleString()} / Day
                    </p>
                  </div>

                  <div className="p-2.5 bg-white rounded-lg border border-purple-200 space-y-1">
                    <span className="text-purple-900 block text-[9px] uppercase font-bold flex items-center gap-1">
                      <Stethoscope className="w-3 h-3 text-purple-700" />
                      <span>Admitting Consultant</span>
                    </span>
                    <p className="font-bold text-slate-900 text-xs">
                      {admission.admittingDoctorName}
                    </p>
                    <p className="text-[10px] text-slate-600">
                      {admission.admittingDepartment}
                    </p>
                    <p className="text-[9px] text-slate-500">
                      Primary Inpatient Attending Physician
                    </p>
                  </div>

                  <div className="p-2.5 bg-white rounded-lg border border-purple-200 space-y-1">
                    <span className="text-purple-900 block text-[9px] uppercase font-bold flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-purple-700" />
                      <span>Admission Financials</span>
                    </span>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-600">Advance Deposit:</span>
                      <span className="font-mono font-bold text-emerald-800">
                        ${(admission.advancePayment || 0).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-[9px] text-slate-500 font-mono">
                      Receipt: REC-ADV-{admission.id}
                    </p>
                    <p className="text-[9px] text-emerald-700 font-semibold">
                      ✓ Deposit adjusted on final discharge
                    </p>
                  </div>
                </div>
              </div>

              {/* 3. CLINICAL DIAGNOSIS & REASON FOR ADMISSION */}
              <div className="border border-slate-300 p-3.5 mb-3.5 bg-white space-y-1.5 rounded-lg">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                  <HeartPulse className="w-3.5 h-3.5 text-rose-600" />
                  <span>Provisional Diagnosis & Clinical Indications for Inpatient Care</span>
                </span>
                <p className="text-xs font-bold text-slate-900 bg-slate-50 p-2.5 rounded border border-slate-200 leading-relaxed">
                  {admission.admissionDiagnosis}
                </p>
              </div>

              {/* 4. INITIAL VITALS ON ADMISSION (IF RECORDED) */}
              {latestVitals && (
                <div className="border border-slate-300 p-3 mb-3.5 bg-slate-50/60 rounded-lg">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-slate-700 block mb-1.5">
                    Baseline Vital Signs at Time of Bed Allocation:
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-xs">
                    <div className="bg-white p-1.5 rounded border border-slate-200">
                      <span className="text-[9px] text-slate-500 block uppercase">Blood Pressure</span>
                      <span className="font-mono font-bold text-slate-900">{latestVitals.bp || '120/80'}</span>
                    </div>
                    <div className="bg-white p-1.5 rounded border border-slate-200">
                      <span className="text-[9px] text-slate-500 block uppercase">Pulse Rate</span>
                      <span className="font-mono font-bold text-slate-900">{latestVitals.pulse || '76'} bpm</span>
                    </div>
                    <div className="bg-white p-1.5 rounded border border-slate-200">
                      <span className="text-[9px] text-slate-500 block uppercase">Temperature</span>
                      <span className="font-mono font-bold text-slate-900">{latestVitals.temp || '98.6'}°F</span>
                    </div>
                    <div className="bg-white p-1.5 rounded border border-slate-200">
                      <span className="text-[9px] text-slate-500 block uppercase">Oxygen (SpO2)</span>
                      <span className="font-mono font-bold text-slate-900">{latestVitals.spo2 || '99%'}</span>
                    </div>
                    <div className="bg-white p-1.5 rounded border border-slate-200">
                      <span className="text-[9px] text-slate-500 block uppercase">Recorded By</span>
                      <span className="font-bold text-slate-800 text-[10px] truncate block">{latestVitals.recordedBy || 'Duty Nurse'}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* 5. INPATIENT CARE RULES & ATTENDANT PASS GUIDELINES */}
              <div className="border border-slate-300 p-3.5 bg-slate-50/80 rounded-lg space-y-1.5 text-[10px] text-slate-700">
                <div className="flex items-center gap-1.5 text-slate-900 font-bold uppercase text-[10px]">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                  <span>Important Instructions for Inpatient & Attendants:</span>
                </div>
                <ul className="list-disc list-inside space-y-1 leading-relaxed text-slate-600">
                  <li><strong>Attendant Pass:</strong> Only 1 (one) attendant pass is issued for ward beds and 2 (two) for private cabins. Please wear attendant pass at all times.</li>
                  <li><strong>Visiting Hours:</strong> General visiting hours are 04:00 PM to 07:00 PM daily. Outside these hours, visitors are not allowed to ensure patient rest.</li>
                  <li><strong>Medications & Treatment:</strong> All medicines must be administered by duty nurses. Do not consume outside food or medicines without doctor approval.</li>
                  <li><strong>Emergency Assistance:</strong> Press the bedside Nurse Call Bell anytime for immediate nursing or duty doctor assistance.</li>
                  <li><strong>Preservation:</strong> Keep this official Admission Slip safe. It is required during pharmacy requisitions, diagnostic lab tests, and final discharge billing settlement.</li>
                </ul>
              </div>
            </div>

            {/* 6. BOTTOM SIGNATURES & OFFICIAL HOSPITAL STAMP */}
            <div className="pt-8 border-t border-slate-400">
              <div className="grid grid-cols-3 gap-6 text-center text-xs">
                <div>
                  <div className="border-b border-slate-400 pb-1 mb-1 h-10 flex items-end justify-center">
                    <span className="text-[10px] font-mono text-slate-400">Signed electronically</span>
                  </div>
                  <span className="font-bold text-slate-800 block text-[11px]">Patient / Guardian</span>
                  <span className="text-[9px] text-slate-500">Consent & Acceptance</span>
                </div>

                <div>
                  <div className="border-b border-slate-400 pb-1 mb-1 h-10 flex items-end justify-center">
                    <span className="text-[10px] font-mono text-slate-500 font-bold">Duty Incharge Nurse</span>
                  </div>
                  <span className="font-bold text-slate-800 block text-[11px]">Floor Nursing Station</span>
                  <span className="text-[9px] text-slate-500">Bed Allocation Confirmed</span>
                </div>

                <div>
                  <div className="border-b border-slate-400 pb-1 mb-1 h-10 flex items-end justify-center">
                    <span className="text-[10px] font-bold text-purple-900 font-serif">
                      {admission.admittingDoctorName}
                    </span>
                  </div>
                  <span className="font-bold text-slate-800 block text-[11px]">Admitting Consultant / Registrar</span>
                  <span className="text-[9px] text-slate-500">Department of Inpatient Care (IPD)</span>
                </div>
              </div>

              {/* Document Audit Footer */}
              <div className="mt-4 pt-2 border-t border-slate-200 text-center text-[8px] text-slate-400 flex items-center justify-between">
                <span>System Reference: {admission.id} • Generated via Hospital IPD ERP</span>
                <span>{hospitalSettings.footerNotice || 'For emergency ambulance or critical queries, call hospital hotline.'}</span>
                <span>Page 1 of 1 (Official IPD Record)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
