import React, { useState } from 'react';
import { X, Printer, Phone, MapPin, Globe, Download, PenTool, Layout, FileText } from 'lucide-react';
import { Prescription, HospitalSettings } from '../../types';
import { BarcodeRenderer } from '../BarcodeRenderer';
import { HospitalEmblem } from '../HospitalEmblem';
import { loadHospitalSettings } from '../../utils/storage';

interface PrescriptionPrintModalProps {
  prescription: Prescription | null;
  onClose: () => void;
  hospitalSettings?: HospitalSettings;
}

export const PrescriptionPrintModal: React.FC<PrescriptionPrintModalProps> = ({
  prescription,
  onClose,
  hospitalSettings: propSettings,
}) => {
  if (!prescription) return null;

  const hospitalSettings = propSettings || loadHospitalSettings();
  const [printMode, setPrintMode] = useState<'blank' | 'digital'>('blank');
  const [lineStyle, setLineStyle] = useState<'ruled' | 'clean'>('ruled');


  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/70 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-300 w-full max-w-4xl my-auto overflow-hidden">
        {/* Actions Bar (hidden when printing) */}
        <div className="no-print px-4 sm:px-6 py-3 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-0.5 rounded text-xs font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
              {prescription.id}
            </span>
            <span className="text-xs sm:text-sm font-medium">Prescription Print Preview (Print Ready A4)</span>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="px-3 py-1 rounded-lg bg-slate-800 text-emerald-400 font-semibold border border-slate-700 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              Dual Barcode: Patient ID (Left) & Rx No (Right)
            </span>
          </div>

          {/* Mode Switcher */}
          <div className="flex items-center gap-2 bg-slate-800 p-1 rounded-xl border border-slate-700">
            <button
              onClick={() => setPrintMode('blank')}
              className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                printMode === 'blank'
                  ? 'bg-teal-500 text-slate-950 shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700'
              }`}
            >
              <PenTool className="w-3.5 h-3.5" />
              <span>Handwriting Rx Pad</span>
            </button>
            <button
              onClick={() => setPrintMode('digital')}
              className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                printMode === 'digital'
                  ? 'bg-purple-500 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Digital Prescription</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {printMode === 'blank' && (
              <button
                onClick={() => setLineStyle(lineStyle === 'ruled' ? 'clean' : 'ruled')}
                title="Toggle Ruled / Clean Lines"
                className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer"
              >
                <Layout className="w-3.5 h-3.5" />
                <span>{lineStyle === 'ruled' ? 'Ruled Lines' : 'Plain Blank'}</span>
              </button>
            )}

            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md transition-all cursor-pointer"
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
        <div className="printable-area relative p-8 sm:p-10 bg-white text-slate-900 max-w-[210mm] mx-auto min-h-[297mm] flex flex-col justify-between">
          {/* Background Watermark */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.035] select-none z-0">
            <HospitalEmblem size={320} customLogoUrl={hospitalSettings.customLogoUrl} />
          </div>

          <div className="relative z-10 flex flex-col flex-1">
            {/* Top Letterhead Header */}
            <div className="flex items-center gap-4 mb-4 pb-2 border-b-2 border-slate-900">
              <HospitalEmblem size={74} customLogoUrl={hospitalSettings.customLogoUrl} altText={hospitalSettings.name} />
              <div className="flex-1 text-center">
                <h1 className="text-xl sm:text-2xl font-black text-[#581c87] tracking-tight uppercase leading-none font-serif">
                  {hospitalSettings.name}
                </h1>
                <p className="text-xs sm:text-sm font-bold text-[#15803d] uppercase tracking-wider mt-0.5">
                  {hospitalSettings.addressEnglish || hospitalSettings.address}
                </p>
                <p className="text-xs font-bold text-[#0891b2] uppercase tracking-wide mt-0.5">
                  {hospitalSettings.prescriptionDept || 'DEPARTMENT OF CLINICAL CONSULTATION (OPD)'}
                </p>
                <p className="text-[10px] text-slate-600 font-medium leading-tight mt-1">
                  Tel: {hospitalSettings.phone} {hospitalSettings.hotline ? `| Hotline: ${hospitalSettings.hotline}` : ''} | Email: {hospitalSettings.email} {hospitalSettings.website ? `| Website: ${hospitalSettings.website}` : ''}
                </p>
              </div>
            </div>

            {/* Doctor & Dual High-Scannability Barcode Box */}
            <div className="border border-slate-600 p-3 mb-4 bg-white">
              {/* Doctor Details Header */}
              <div className="text-center pb-2.5 border-b border-slate-300">
                <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-wide">{prescription.doctorName}</h2>
                <p className="text-xs text-slate-700 font-semibold">{prescription.doctorDegrees}</p>
                <p className="text-xs font-bold text-purple-900">{prescription.doctorSpecialty}</p>
                <p className="text-[10px] font-mono text-slate-500 font-bold">{prescription.doctorBmdc}</p>
              </div>

              {/* Dual-Barcode Strip: Left = Patient ID Barcode, Right = Prescription Barcode */}
              <div className="py-2.5 px-3 border-b border-slate-300 grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50/50">
                {/* Left: Patient ID Barcode (Identical to Health Card) */}
                <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-xs flex flex-col items-center justify-center">
                  <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wide mb-1 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                    Patient Health ID Barcode
                  </span>
                  <BarcodeRenderer
                    value={prescription.patientId}
                    height={44}
                    width={1.5}
                    fontSize={11}
                    margin={8}
                  />
                </div>

                {/* Right: Prescription Barcode */}
                <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-xs flex flex-col items-center justify-center">
                  <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wide mb-1 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-purple-600"></span>
                    Official Prescription Barcode
                  </span>
                  <BarcodeRenderer
                    value={prescription.id}
                    height={44}
                    width={1.5}
                    fontSize={11}
                    margin={8}
                  />
                </div>
              </div>

              {/* Patient Info Strip */}
              <div className="pt-2 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Patient Name</span>
                  <span className="font-bold text-slate-900">{prescription.patientName}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Patient ID</span>
                  <span className="font-mono font-bold text-slate-900">{prescription.patientId}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Age & Gender</span>
                  <span className="font-semibold text-slate-900">
                    {prescription.patientAge} Yrs / {prescription.patientGender === 'male' ? 'Male' : 'Female'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Date</span>
                  <span className="font-mono text-slate-900">{prescription.date}</span>
                </div>
              </div>
            </div>

            {/* Vitals Ribbon */}
            <div className="flex flex-wrap items-center gap-x-5 gap-y-1 py-1.5 px-3 mb-4 bg-teal-50/70 border border-teal-200/80 rounded-md text-[11px]">
              <span className="font-bold text-teal-900">Vitals:</span>
              <span>
                <strong className="text-slate-700">BP:</strong> {prescription.vitals?.bp || '____/____ mmHg'}
              </span>
              <span>
                <strong className="text-slate-700">Pulse:</strong> {prescription.vitals?.pulse || '____ bpm'}
              </span>
              <span>
                <strong className="text-slate-700">Temp:</strong> {prescription.vitals?.temp || '____°F'}
              </span>
              <span>
                <strong className="text-slate-700">Weight:</strong> {prescription.vitals?.weight || '____ kg'}
              </span>
              <span>
                <strong className="text-slate-700">SpO2:</strong> {prescription.vitals?.spo2 || '____%'}
              </span>
              <span>
                <strong className="text-slate-700">RBS:</strong> {prescription.vitals?.rbs || '____ mmol/L'}
              </span>
            </div>

            {/* PRESCRIPTION MAIN BODY */}
            {printMode === 'blank' ? (
              <div className="grid grid-cols-12 gap-5 flex-1 min-h-[520px]">
                {/* Left Column (35%): Chief Complaints, O/E, Diagnosis, Investigations */}
                <div className="col-span-4 border-r-2 border-slate-400 pr-4 flex flex-col justify-between space-y-4 text-xs">
                  <div>
                    <h3 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] mb-2 border-b border-slate-300 pb-1 flex items-center justify-between">
                      <span>Chief Complaints (C/C)</span>
                    </h3>
                    {lineStyle === 'ruled' ? (
                      <div className="space-y-4 pt-1">
                        <div className="border-b border-slate-300 h-5"></div>
                        <div className="border-b border-slate-300 h-5"></div>
                        <div className="border-b border-slate-300 h-5"></div>
                      </div>
                    ) : (
                      <div className="h-16 border border-dashed border-slate-200 rounded"></div>
                    )}
                  </div>

                  <div>
                    <h3 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] mb-2 border-b border-slate-300 pb-1">
                      On Examination (O/E)
                    </h3>
                    {lineStyle === 'ruled' ? (
                      <div className="space-y-4 pt-1">
                        <div className="border-b border-slate-300 h-5"></div>
                        <div className="border-b border-slate-300 h-5"></div>
                        <div className="border-b border-slate-300 h-5"></div>
                      </div>
                    ) : (
                      <div className="h-16 border border-dashed border-slate-200 rounded"></div>
                    )}
                  </div>

                  <div>
                    <h3 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] mb-1 border-b border-slate-300 pb-1">
                      Diagnosis (Dx)
                    </h3>
                    <div className="h-10 border border-slate-300 rounded bg-slate-50/40 p-1"></div>
                  </div>

                  <div className="flex-1 flex flex-col pt-1">
                    <h3 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] mb-2 border-b-2 border-teal-800 pb-1 text-teal-950 flex items-center justify-between">
                      <span>Investigations</span>
                    </h3>
                    {lineStyle === 'ruled' ? (
                      <div className="space-y-4 pt-1">
                        {[1, 2, 3, 4, 5, 6, 7].map((num) => (
                          <div key={num} className="flex items-center gap-1.5 border-b border-slate-300 pb-0.5">
                            <span className="text-[10px] font-mono text-slate-400 font-bold">{num}.</span>
                            <div className="flex-1 h-3"></div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex-1 min-h-[140px] border border-dashed border-slate-200 rounded"></div>
                    )}
                  </div>
                </div>

                {/* Right Column (65%): Rx Sign, Medicines, Instructions */}
                <div className="col-span-8 pl-1 flex flex-col justify-between">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-4xl font-serif font-black text-teal-900 leading-none select-none">℞</span>
                    <div className="h-0.5 flex-1 bg-gradient-to-r from-teal-800 via-slate-300 to-transparent"></div>
                  </div>

                  <div className="flex-1 flex flex-col justify-between py-1">
                    {lineStyle === 'ruled' ? (
                      <div className="space-y-6 pt-2 flex-1">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((lineIndex) => (
                          <div
                            key={lineIndex}
                            className="border-b border-slate-200/90 h-5 flex items-end justify-between text-[10px] text-slate-300"
                          >
                            <span className="text-slate-300 font-mono text-[9px] select-none pl-1">{lineIndex}.</span>
                            <span className="text-slate-200 font-mono text-[8px] select-none pr-2">
                              {lineIndex % 2 === 0 ? 'After meal / Before meal' : ''}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex-1 min-h-[380px] border border-dashed border-slate-200 rounded-lg p-3"></div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-slate-300">
                    <h4 className="font-bold text-xs uppercase tracking-wider text-slate-800 mb-1">
                      Advice:
                    </h4>
                    {lineStyle === 'ruled' ? (
                      <div className="space-y-4 pt-1">
                        <div className="border-b border-slate-300 h-4"></div>
                        <div className="border-b border-slate-300 h-4"></div>
                      </div>
                    ) : (
                      <div className="h-10 border border-dashed border-slate-200 rounded"></div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              /* DIGITAL MODE */
              <div className="grid grid-cols-12 gap-6 min-h-[460px]">
                <div className="col-span-4 border-r border-slate-300 pr-5 space-y-5 text-xs">
                  {prescription.chiefComplaints && prescription.chiefComplaints.length > 0 && (
                    <div>
                      <h3 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] mb-1.5 border-b border-slate-200 pb-1">
                        Chief Complaints
                      </h3>
                      <ul className="list-disc list-inside space-y-1 text-slate-700 leading-snug">
                        {prescription.chiefComplaints.map((c, i) => (
                          <li key={i}>{c}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {prescription.clinicalFindings && (
                    <div>
                      <h3 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] mb-1.5 border-b border-slate-200 pb-1">
                        On Examination
                      </h3>
                      <p className="text-slate-700 leading-relaxed">{prescription.clinicalFindings}</p>
                    </div>
                  )}

                  {prescription.diagnosis && (
                    <div>
                      <h3 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] mb-1.5 border-b border-slate-200 pb-1">
                        Diagnosis (Dx)
                      </h3>
                      <p className="font-bold text-teal-900 bg-teal-50 p-2 rounded border border-teal-100">
                        {prescription.diagnosis}
                      </p>
                    </div>
                  )}

                  {prescription.recommendedTests && prescription.recommendedTests.length > 0 && (
                    <div>
                      <h3 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] mb-1.5 border-b border-slate-200 pb-1">
                        Investigations
                      </h3>
                      <ul className="list-decimal list-inside space-y-1 text-slate-800 font-medium">
                        {prescription.recommendedTests.map((t, idx) => (
                          <li key={idx} className="text-teal-900">
                            {t}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                <div className="col-span-8 space-y-6">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl font-serif font-black text-teal-800 leading-none">℞</span>
                    <div className="h-0.5 flex-1 bg-slate-200"></div>
                  </div>

                  <div className="space-y-4">
                    {prescription.medicines && prescription.medicines.length > 0 ? (
                      prescription.medicines.map((med, idx) => (
                        <div key={idx} className="border-b border-dashed border-slate-200 pb-3">
                          <div className="flex items-baseline justify-between">
                            <span className="font-bold text-slate-900 text-sm">
                              {idx + 1}. {med.name}
                            </span>
                            <span className="font-mono text-xs text-slate-600 font-bold bg-slate-100 px-2 py-0.5 rounded">
                              {med.dosage}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 mt-1 text-xs text-slate-600 pl-4">
                            <span className="text-slate-500 font-medium">Duration: {med.duration}</span>
                            <span className="text-teal-800 font-semibold">• {med.instruction}</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="py-12 text-center text-slate-400 text-xs italic">
                        No digital medicines added. Switch to "Handwriting Rx Pad" mode above.
                      </div>
                    )}
                  </div>

                  {prescription.advice && (
                    <div className="pt-4 border-t border-slate-300">
                      <h4 className="font-bold text-xs uppercase tracking-wider text-slate-800 mb-1.5">
                        Advice:
                      </h4>
                      <p className="text-xs text-slate-700 whitespace-pre-line leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-200">
                        {prescription.advice}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Bottom Footer Section */}
          <div className="mt-6 pt-3 border-t-2 border-slate-900">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-xs font-bold text-slate-900">
                  Next Visit Date:{' '}
                  <span className="text-teal-800 font-mono">{prescription.nextVisitDate || 'As required'}</span>
                </p>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  * Do not take antibiotics without prescription. Keep all medicines out of reach of children.
                </p>
              </div>

              {/* Signature Line */}
              <div className="text-center w-52">
                <div className="border-b border-slate-800 pb-1 mb-1">
                  <p className="text-xs font-serif italic text-slate-500">Authorized Doctor Signature</p>
                </div>
                <p className="text-xs font-bold text-slate-900">{prescription.doctorName}</p>
                <p className="text-[10px] text-slate-500">{prescription.doctorSpecialty}</p>
              </div>
            </div>

            {/* Document Footer Branding */}
            <div className="mt-3 pt-1.5 border-t border-slate-200 flex items-center justify-between text-[9px] text-slate-500 font-medium">
              <span>{hospitalSettings?.footerNotice || 'Thank you for choosing our specialized medical healthcare services.'}</span>
              <span className="font-bold text-slate-800 tracking-wide">Software By : Shoriful Islam</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
