import React from 'react';
import { X, Printer, Phone, MapPin, Droplet, User, Calendar } from 'lucide-react';
import { Patient, HospitalSettings } from '../../types';
import { BarcodeRenderer } from '../BarcodeRenderer';
import { HospitalEmblem } from '../HospitalEmblem';
import { loadHospitalSettings } from '../../utils/storage';

interface PatientCardPrintModalProps {
  patient: Patient | null;
  onClose: () => void;
  hospitalSettings?: HospitalSettings;
}

export const PatientCardPrintModal: React.FC<PatientCardPrintModalProps> = ({
  patient,
  onClose,
  hospitalSettings: propSettings,
}) => {
  if (!patient) return null;

  const hospitalSettings = propSettings || loadHospitalSettings();

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/70 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-300 w-full max-w-md my-auto overflow-hidden">
        {/* Top Control Bar */}
        <div className="no-print px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between">
          <span className="text-xs font-bold text-emerald-400 font-mono">
            {patient.id} - Patient Smart Card
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              Print Card
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Card Area */}
        <div className="printable-area p-6 bg-white text-slate-900 max-w-sm mx-auto">
          <div className="border-2 border-emerald-700 rounded-2xl p-5 shadow-lg bg-gradient-to-b from-emerald-50/50 via-white to-slate-50 flex flex-col items-center text-center relative overflow-hidden">
            {/* Top hospital header */}
            <div className="w-full flex items-center justify-between border-b border-emerald-200 pb-3 mb-4">
              <div className="text-left">
                <h3 className="font-black text-sm text-emerald-950 leading-tight">
                  {hospitalSettings.name}
                </h3>
                <p className="text-[9px] font-semibold text-slate-500 uppercase tracking-wider">
                  Patient Health ID Card
                </p>
              </div>
              <div className="w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center shrink-0">
                <HospitalEmblem
                  size={32}
                  customLogoUrl={hospitalSettings.customLogoUrl}
                  altText={hospitalSettings.name}
                />
              </div>
            </div>

            {/* Patient Name & Basic Info */}
            <div className="w-full space-y-1 mb-3">
              <h2 className="text-base font-bold text-slate-900">{patient.name}</h2>
              <div className="flex items-center justify-center gap-2 text-xs text-slate-600">
                <span>{patient.age} Yrs</span>
                <span>•</span>
                <span>{patient.gender === 'male' ? 'Male' : 'Female'}</span>
                <span>•</span>
                <span className="font-bold text-rose-600 flex items-center gap-0.5">
                  <Droplet className="w-3 h-3 text-rose-500 fill-rose-500" />
                  {patient.bloodGroup}
                </span>
              </div>
              <p className="text-xs font-mono text-slate-600">{patient.phone}</p>
            </div>

            {/* Central Barcode */}
            <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-xs my-2 w-full flex flex-col items-center">
              <BarcodeRenderer value={patient.id} height={44} width={1.6} fontSize={12} />
            </div>

            {/* Emergency & Address */}
            <div className="w-full text-left text-[10px] text-slate-600 space-y-1 border-t border-slate-200 pt-2.5 mt-2">
              <p className="truncate">
                <strong className="text-slate-800">Address:</strong> {patient.address}
              </p>
              <p>
                <strong className="text-slate-800">Emergency Contact:</strong> {patient.emergencyContact || 'N/A'}
              </p>
              <p>
                <strong className="text-slate-800">Registered Date:</strong> {patient.registeredAt}
              </p>
            </div>

            {/* Footer hotline */}
            <div className="w-full mt-3 pt-2 border-t border-dashed border-slate-300 flex items-center justify-between text-[9px] text-slate-500">
              <span>Emergency: {hospitalSettings.hotline || hospitalSettings.phone}</span>
              <span>{hospitalSettings.govtRegNo || 'Dhaka, Bangladesh'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
