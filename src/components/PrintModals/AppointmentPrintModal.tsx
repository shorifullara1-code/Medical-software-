import React, { useState } from 'react';
import { X, Printer, Download, CheckCircle2, ShieldCheck, Calendar, Clock, User, Stethoscope } from 'lucide-react';
import { Appointment, HospitalSettings } from '../../types';
import { BarcodeRenderer } from '../BarcodeRenderer';
import { HospitalEmblem } from '../HospitalEmblem';
import { loadHospitalSettings } from '../../utils/storage';

interface AppointmentPrintModalProps {
  appointment: Appointment | null;
  onClose: () => void;
  hospitalSettings?: HospitalSettings;
}

export const AppointmentPrintModal: React.FC<AppointmentPrintModalProps> = ({
  appointment,
  onClose,
  hospitalSettings: propSettings,
}) => {
  if (!appointment) return null;

  const hospitalSettings = propSettings || loadHospitalSettings();
  const [barcodeType, setBarcodeType] = useState<'patient' | 'appointment'>('patient');

  const activeBarcodeValue = barcodeType === 'patient' ? appointment.patientId : appointment.id;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/70 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-300 w-full max-w-4xl my-auto overflow-hidden">
        {/* Top Control Bar */}
        <div className="no-print px-6 py-3.5 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded text-xs font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
              {appointment.id}
            </span>
            <span className="text-sm font-medium">
              Appointment Letter & Token Slip Preview (A4)
            </span>
          </div>

          {/* Barcode Mode Switcher */}
          <div className="flex items-center gap-1.5 bg-slate-800 p-1 rounded-xl border border-slate-700 text-xs">
            <span className="text-slate-400 font-semibold px-1 text-[11px]">Barcode:</span>
            <button
              onClick={() => setBarcodeType('patient')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                barcodeType === 'patient'
                  ? 'bg-emerald-500 text-slate-950 font-black shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700'
              }`}
              title="Health Card Mode (Same barcode as Patient ID card) - guaranteed scanner detection"
            >
              Patient ID ({appointment.patientId})
            </button>
            <button
              onClick={() => setBarcodeType('appointment')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                barcodeType === 'appointment'
                  ? 'bg-indigo-500 text-white font-black shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700'
              }`}
              title="Appointment Token ID barcode"
            >
              Token No ({appointment.id})
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md transition-all cursor-pointer"
              title="Print appointment letter or save as PDF"
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

        {/* Printable Area */}
        <div className="printable-area relative p-8 sm:p-10 bg-white text-slate-900 max-w-[210mm] mx-auto min-h-[297mm] flex flex-col justify-between">
          {/* Subtle Watermark */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.035] select-none z-0">
            <HospitalEmblem size={320} customLogoUrl={hospitalSettings.customLogoUrl} />
          </div>

          <div className="relative z-10">
            {/* 1. TOP LETTERHEAD */}
            <div className="flex items-center gap-4 mb-4 pb-1">
              <HospitalEmblem size={74} customLogoUrl={hospitalSettings.customLogoUrl} altText={hospitalSettings.name} />
              <div className="flex-1 text-center">
                <h1 className="text-xl sm:text-2xl font-black text-[#581c87] tracking-tight uppercase leading-none font-serif">
                  {hospitalSettings.name}
                </h1>
                <p className="text-xs sm:text-sm font-bold text-[#15803d] uppercase tracking-wider mt-0.5">
                  {hospitalSettings.addressEnglish || hospitalSettings.address}
                </p>
                <p className="text-xs font-bold text-[#0891b2] uppercase tracking-wide mt-0.5">
                  {hospitalSettings.appointmentDept || 'DEPARTMENT OF OUTPATIENT (OPD) & APPOINTMENT DESK'}
                </p>
                <p className="text-[10px] text-slate-600 font-medium leading-tight mt-1">
                  Tel: {hospitalSettings.phone} {hospitalSettings.hotline ? `| Hotline: ${hospitalSettings.hotline}` : ''} | Email: {hospitalSettings.email} {hospitalSettings.website ? `| Website: ${hospitalSettings.website}` : ''}
                </p>
              </div>
            </div>

            {/* 2. PATIENT & DUAL-BARCODE FRAMED BOX */}
            <div className="border border-slate-600 text-xs mb-5 bg-white">
              {/* Title Header */}
              <div className="px-3 pt-2.5 pb-2 border-b border-slate-300 text-center">
                <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-wide font-sans">
                  APPOINTMENT CONFIRMATION LETTER
                </h2>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Doctor Consultation Appointment Token
                </span>
              </div>

              {/* Clean Master Barcode Strip (Health Card Compatible Layout & Ultra-Fast Scanning) */}
              <div className="py-2 border-b border-slate-300 flex flex-col items-center justify-center bg-white">
                <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-xs my-1 w-full max-w-sm flex flex-col items-center">
                  <BarcodeRenderer
                    value={activeBarcodeValue}
                    height={48}
                    width={1.8}
                    fontSize={12}
                    margin={14}
                  />
                </div>
              </div>

              {/* Grid Section 1: Details */}
              <div className="p-3 space-y-1 leading-relaxed text-[11px] font-sans">
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-1">
                  <div className="sm:col-span-4 flex items-baseline">
                    <span className="w-24 text-slate-700 font-medium">Invoice No</span>
                    <span className="mr-1">:</span>
                    <span className="font-mono font-bold text-slate-900">{appointment.id}</span>
                  </div>
                  <div className="sm:col-span-3 flex items-baseline">
                    <span className="w-24 text-slate-700 font-medium">Invoice Date</span>
                    <span className="mr-1">:</span>
                    <span className="font-mono text-slate-800">{appointment.date}</span>
                  </div>
                  <div className="sm:col-span-2 flex items-baseline">
                    <span className="w-20 text-slate-700 font-medium">Visit Date</span>
                    <span className="mr-1">:</span>
                    <span className="font-mono text-slate-800">{appointment.date}</span>
                  </div>
                  <div className="sm:col-span-3 flex items-baseline justify-start sm:justify-end">
                    <span className="w-20 text-slate-700 font-medium">Serial No</span>
                    <span className="mr-1">:</span>
                    <span className="font-mono font-bold text-slate-900">SERIAL #{appointment.serialNumber}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-1">
                  <div className="sm:col-span-7 flex items-baseline">
                    <span className="w-24 text-slate-700 font-medium">Patient</span>
                    <span className="mr-1">:</span>
                    <span className="font-bold text-slate-950 uppercase">{appointment.patientName}</span>
                  </div>
                  <div className="sm:col-span-2 flex items-baseline">
                    <span className="w-12 text-slate-700 font-medium">Serial</span>
                    <span className="mr-1">:</span>
                    <span className="font-mono font-black text-amber-700 text-xs">#{appointment.serialNumber}</span>
                  </div>
                  <div className="sm:col-span-3 flex items-baseline justify-start sm:justify-end">
                    <span className="w-16 text-slate-700 font-medium">Status</span>
                    <span className="mr-1">:</span>
                    <span className="font-bold uppercase text-[10px] px-1.5 py-0.2 rounded border bg-emerald-100 text-emerald-800 border-emerald-300">
                      Confirmed
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-1">
                  <div className="sm:col-span-7 flex items-baseline">
                    <span className="w-24 text-slate-700 font-medium">Referred By</span>
                    <span className="mr-1">:</span>
                    <span className="text-slate-900 font-medium">{appointment.doctorName} ({appointment.specialization})</span>
                  </div>
                  <div className="sm:col-span-5 flex items-baseline justify-start sm:justify-end">
                    <span className="w-16 text-slate-700 font-medium">Type</span>
                    <span className="mr-1">:</span>
                    <span className="text-slate-800">Self / Outpatient</span>
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-400"></div>

              <div className="p-3 space-y-1 text-[11px] font-sans">
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-1">
                  <div className="sm:col-span-5 flex items-baseline">
                    <span className="w-24 text-slate-700 font-medium">Service</span>
                    <span className="mr-1">:</span>
                    <span className="font-medium text-slate-900">OPD Chamber Consultation</span>
                  </div>
                  <div className="sm:col-span-7 flex items-baseline">
                    <span className="w-20 text-slate-700 font-medium">Chamber</span>
                    <span className="mr-1">:</span>
                    <span className="font-mono font-bold text-slate-900">ROOM 402 (4TH FLOOR)</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-1">
                  <div className="sm:col-span-12 flex items-baseline">
                    <span className="w-24 text-slate-700 font-medium">Doctor</span>
                    <span className="mr-1">:</span>
                    <span className="font-bold text-slate-900 uppercase">
                      CONSULTATION BY {appointment.doctorName.toUpperCase()} — {appointment.specialization.toUpperCase()}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-1">
                  <div className="sm:col-span-12 flex items-baseline">
                    <span className="w-24 text-slate-700 font-medium">Patient ID</span>
                    <span className="mr-1">:</span>
                    <span className="font-mono font-bold text-slate-900">{appointment.patientId}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 3. APPOINTMENT SCHEDULE & DOCTOR SUMMARY TABLE */}
            <div className="mb-5">
              <table className="w-full text-xs border-collapse border border-slate-400">
                <thead>
                  <tr className="bg-slate-100 text-slate-900 font-bold text-[11px] border-b border-slate-400">
                    <th className="py-2 px-3 border-r border-slate-400 text-left w-2/5">
                      Consultation Schedule & Doctor
                    </th>
                    <th className="py-2 px-3 border-r border-slate-400 text-center w-1/4">
                      Time & Serial
                    </th>
                    <th className="py-2 px-3 text-left w-1/3">
                      Visiting Location & Fee
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-300 font-sans">
                  <tr>
                    <td className="py-2 px-3 border-r border-slate-300 font-medium">
                      <p className="font-bold text-slate-950 text-sm">{appointment.doctorName}</p>
                      <p className="text-[11px] text-slate-600">{appointment.specialization}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">Department: Outpatient Specialty Wing</p>
                    </td>
                    <td className="py-2 px-3 border-r border-slate-300 text-center font-bold">
                      <span className="text-amber-700 font-black text-sm block">SERIAL #{appointment.serialNumber}</span>
                      <span className="text-slate-900 block text-xs mt-0.5">{appointment.timeSlot}</span>
                      <span className="text-slate-500 font-normal text-[10px] block">{appointment.date}</span>
                    </td>
                    <td className="py-2 px-3 text-[11px] text-slate-700 leading-snug space-y-1">
                      <p>
                        <strong>Chamber:</strong> Room 402, 4th Floor
                      </p>
                      <p>
                        <strong>Consultation Fee:</strong> <span className="font-mono font-bold text-emerald-700">${appointment.fee.toLocaleString()}</span>
                      </p>
                      <p className="text-emerald-700 font-semibold">
                        Status: Confirmed & Logged ✓
                      </p>
                    </td>
                  </tr>

                  {appointment.notes && (
                    <tr className="bg-slate-50/60">
                      <td colSpan={3} className="py-2 px-3 text-[11px] text-slate-700">
                        <strong>Chief Complaints / Appointment Notes:</strong> {appointment.notes}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* 4. CLINICAL ADVISORY & PATIENT INSTRUCTIONS */}
            <div className="border border-slate-400 p-3 mb-6 bg-slate-50/70 text-xs">
              <span className="font-bold text-slate-800 uppercase text-[10px] tracking-wider block mb-1">
                Patient Instructions:
              </span>
              <ul className="space-y-1 text-[11px] text-slate-800 list-disc list-inside leading-relaxed">
                <li>
                  Please arrive at the doctor's waiting lounge <strong>15 minutes prior</strong> to your scheduled time.
                </li>
                <li>
                  Bring all previous prescriptions and diagnostic test reports with you.
                </li>
                <li>
                  Barcodes on top allow automated check-in and file opening at reception.
                </li>
                <li>
                  For any assistance, contact helpline or the duty receptionist.
                </li>
              </ul>
            </div>
          </div>

          {/* 5. FOOTER & OFFICIAL SIGNATURES */}
          <div className="relative z-10 pt-4 border-t-2 border-slate-800 text-xs">
            <div className="grid grid-cols-2 gap-10">
              <div className="text-center w-48">
                <div className="h-10 border-b border-slate-600 flex items-end justify-center pb-1">
                  <p className="text-[11px] font-serif italic text-slate-400">Duty Receptionist</p>
                </div>
                <p className="text-xs font-bold text-slate-800 mt-1">Front Desk Officer</p>
                <p className="text-[10px] text-slate-500">OPD Registration Desk</p>
              </div>

              <div className="text-center w-48 ml-auto">
                <div className="h-10 border-b border-slate-600 flex items-end justify-center pb-1">
                  <p className="text-[11px] font-serif italic text-slate-400">Medical Officer / Coordinator</p>
                </div>
                <p className="text-xs font-bold text-slate-800 mt-1">Chamber Coordinator</p>
                <p className="text-[10px] text-slate-500">Department of Outpatient</p>
              </div>
            </div>

            <div className="mt-4 pt-1.5 border-t border-slate-200 flex items-center justify-between text-[9px] text-slate-500 font-medium">
              <span>* This is a computer generated OPD appointment confirmation letter.</span>
              <span className="font-bold text-slate-800 tracking-wide">Software By : Shoriful Islam</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
