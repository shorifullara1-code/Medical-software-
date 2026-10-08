import React from 'react';
import { X, Printer, Download } from 'lucide-react';
import { LabReport, HospitalSettings } from '../../types';
import { BarcodeRenderer } from '../BarcodeRenderer';
import { HospitalEmblem } from '../HospitalEmblem';
import { loadHospitalSettings } from '../../utils/storage';

interface LabReportPrintModalProps {
  report: LabReport | null;
  onClose: () => void;
  hospitalSettings?: HospitalSettings;
}

export const LabReportPrintModal: React.FC<LabReportPrintModalProps> = ({
  report,
  onClose,
  hospitalSettings: propSettings,
}) => {
  if (!report) return null;

  const hospitalSettings = propSettings || loadHospitalSettings();

  const handlePrint = () => {
    window.print();
  };

  const cbc = report.cbcParameters;

  // Format title like the image: "Hormone REPORT" or "HEMATOLOGY REPORT"
  const reportCategoryTitle =
    report.testType === 'CBC'
      ? 'Hematology REPORT'
      : report.testType === 'LIPID'
      ? 'Lipid Profile REPORT'
      : report.testType === 'LFT'
      ? 'Liver Function REPORT'
      : report.testType === 'SUGAR'
      ? 'Blood Glucose REPORT'
      : report.testType === 'URINE'
      ? 'Clinical Pathology REPORT'
      : report.testType === 'THYROID'
      ? 'Hormone REPORT'
      : report.testType === 'RADIOLOGY'
      ? 'Radiology & Imaging REPORT'
      : `${report.testType || 'Diagnostic'} REPORT`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/70 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-300 w-full max-w-4xl my-auto overflow-hidden">
        {/* Top Control Bar (Screen only) */}
        <div className="no-print px-6 py-3.5 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded text-xs font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
              {report.id}
            </span>
            <span className="text-sm font-medium">Official Lab Report Template Preview (A4)</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md transition-all cursor-pointer"
              title="Print report or save as PDF"
            >
              <Download className="w-4 h-4" />
              <Printer className="w-4 h-4" />
              <span>Download (PDF) & Print</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Area - EXACT MATCH TO USER IMAGE */}
        <div className="printable-area relative p-8 sm:p-10 bg-white text-slate-900 max-w-[210mm] mx-auto min-h-[297mm] flex flex-col justify-between">
          {/* Subtle Watermark in background */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.035] select-none z-0">
            <HospitalEmblem size={320} customLogoUrl={hospitalSettings.customLogoUrl} />
          </div>

          <div className="relative z-10">
            {/* 1. TOP LETTERHEAD (Dynamic Hospital Branding) */}
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
                  {hospitalSettings.labDept || 'DEPARTMENT OF PATHOLOGY & CLINICAL LAB'}
                </p>
                <p className="text-[10px] text-slate-600 font-medium leading-tight mt-1">
                  Tel : {hospitalSettings.phone} {hospitalSettings.hotline ? `| Hotline : ${hospitalSettings.hotline}` : ''} | E-mail : {hospitalSettings.email} {hospitalSettings.website ? `| Website : ${hospitalSettings.website}` : ''}
                </p>
              </div>
            </div>

            {/* 2. THE EXACT PATIENT & DUAL-BARCODE FRAMED BOX (Matching User's Uploaded Image) */}
            <div className="border border-slate-600 text-xs mb-5 bg-white/90">
              {/* Top row with Two Barcodes and Center Title */}
              <div className="px-3 pt-2 pb-1.5 border-b border-slate-600 flex items-center justify-between gap-2">
                {/* Left Barcode */}
                <div className="flex flex-col items-start w-40 shrink-0">
                  <BarcodeRenderer
                    value={report.invoiceId || '12610069432'}
                    height={26}
                    width={1.2}
                    displayValue={false}
                  />
                </div>

                {/* Center Title (Exact style: Hormone REPORT) */}
                <div className="flex-1 text-center">
                  <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-wide font-sans">
                    {reportCategoryTitle}
                  </h2>
                </div>

                {/* Right Barcode */}
                <div className="flex flex-col items-end w-40 shrink-0">
                  <BarcodeRenderer
                    value={report.id || '12610309551'}
                    height={26}
                    width={1.2}
                    displayValue={false}
                  />
                </div>
              </div>

              {/* Grid Section 1: Patient & Invoice Details */}
              <div className="p-3 space-y-1 leading-relaxed text-[11px] font-sans">
                {/* Row 1 */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-1">
                  <div className="sm:col-span-4 flex items-baseline">
                    <span className="w-24 text-slate-700 font-medium">Invoice No</span>
                    <span className="mr-1">:</span>
                    <span className="font-mono font-bold text-slate-900">{report.invoiceId || '12610069432'}</span>
                  </div>
                  <div className="sm:col-span-3 flex items-baseline">
                    <span className="w-24 text-slate-700 font-medium">Invoice Date</span>
                    <span className="mr-1">:</span>
                    <span className="font-mono text-slate-800">{report.sampleCollectedAt?.split(' ')[0] || '01/10/26'}</span>
                  </div>
                  <div className="sm:col-span-2 flex items-baseline">
                    <span className="w-20 text-slate-700 font-medium">Delivery Date</span>
                    <span className="mr-1">:</span>
                    <span className="font-mono text-slate-800">{report.reportedAt?.split(' ')[0] || '04/10/26'}</span>
                  </div>
                  <div className="sm:col-span-3 flex items-baseline justify-start sm:justify-end">
                    <span className="w-20 text-slate-700 font-medium">Report No</span>
                    <span className="mr-1">:</span>
                    <span className="font-mono font-bold text-slate-900">{report.id}</span>
                  </div>
                </div>

                {/* Row 2 */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-1">
                  <div className="sm:col-span-7 flex items-baseline">
                    <span className="w-24 text-slate-700 font-medium">Patient</span>
                    <span className="mr-1">:</span>
                    <span className="font-bold text-slate-950 uppercase">{report.patientName}</span>
                  </div>
                  <div className="sm:col-span-2 flex items-baseline">
                    <span className="w-12 text-slate-700 font-medium">Age</span>
                    <span className="mr-1">:</span>
                    <span className="font-medium text-slate-900">{report.patientAge}Y 0M 0D</span>
                  </div>
                  <div className="sm:col-span-3 flex items-baseline justify-start sm:justify-end">
                    <span className="w-16 text-slate-700 font-medium">Gender</span>
                    <span className="mr-1">:</span>
                    <span className="capitalize text-slate-900">{report.patientGender === 'male' ? 'Male' : 'Female'}</span>
                  </div>
                </div>

                {/* Row 3 */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-1">
                  <div className="sm:col-span-7 flex items-baseline">
                    <span className="w-24 text-slate-700 font-medium">Referred By</span>
                    <span className="mr-1">:</span>
                    <span className="text-slate-900 font-medium">{report.referredByDoctor}</span>
                  </div>
                  <div className="sm:col-span-5 flex items-baseline justify-start sm:justify-end">
                    <span className="w-16 text-slate-700 font-medium">Relation</span>
                    <span className="mr-1">:</span>
                    <span className="text-slate-800">Self / Registered Patient</span>
                  </div>
                </div>
              </div>

              {/* Horizontal Divider Line (Exact as in user image) */}
              <div className="border-t border-slate-400"></div>

              {/* Grid Section 2: Sample & Test Info */}
              <div className="p-3 space-y-1 text-[11px] font-sans">
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-1">
                  <div className="sm:col-span-5 flex items-baseline">
                    <span className="w-24 text-slate-700 font-medium">Sample</span>
                    <span className="mr-1">:</span>
                    <span className="font-medium text-slate-900">
                      {report.testType === 'URINE' ? 'Fresh Urine' : 'Blood'}
                    </span>
                  </div>
                  <div className="sm:col-span-7 flex items-baseline">
                    <span className="w-20 text-slate-700 font-medium">LAB. No</span>
                    <span className="mr-1">:</span>
                    <span className="font-mono font-bold text-slate-900">
                      {report.id.replace(/[^0-9]/g, '') || '12610344274'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-1">
                  <div className="sm:col-span-12 flex items-baseline">
                    <span className="w-24 text-slate-700 font-medium">Tests</span>
                    <span className="mr-1">:</span>
                    <span className="font-bold text-slate-900 uppercase">{report.testName}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-1">
                  <div className="sm:col-span-12 flex items-baseline">
                    <span className="w-24 text-slate-700 font-medium">Per.No</span>
                    <span className="mr-1">:</span>
                    <span className="font-mono font-bold text-slate-900">{report.patientId}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 3. TEST RESULTS TABLE (Matching Image: Test | Result | Reference Value) */}
            <div className="mb-6">
              <table className="w-full text-xs border-collapse border border-slate-400">
                <thead>
                  <tr className="bg-slate-100 text-slate-900 font-bold text-[11px] border-b border-slate-400">
                    <th className="py-2 px-3 border-r border-slate-400 text-left w-2/5">
                      Test
                    </th>
                    <th className="py-2 px-3 border-r border-slate-400 text-center w-1/4">
                      Result
                    </th>
                    <th className="py-2 px-3 text-left w-1/3">
                      Reference Value
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-300 font-sans">
                  {cbc ? (
                    <>
                      {/* GENERAL HEMATOLOGY */}
                      <tr className="bg-slate-50 font-bold text-[11px]">
                        <td colSpan={3} className="py-1 px-3 uppercase tracking-wider text-slate-700 bg-slate-100/70 border-b border-slate-300">
                          COMPLETE BLOOD COUNT (CBC) & DIFFERENTIAL
                        </td>
                      </tr>

                      {/* Hemoglobin */}
                      <tr className={cbc.hemoglobin.status !== 'normal' ? 'bg-amber-50/50' : ''}>
                        <td className="py-1.5 px-3 border-r border-slate-300 font-medium">Hemoglobin (Hb)</td>
                        <td className="py-1.5 px-3 border-r border-slate-300 text-center font-bold">
                          <span className={cbc.hemoglobin.status !== 'normal' ? 'text-rose-600 font-black' : 'text-slate-950 font-black'}>
                            {cbc.hemoglobin.val}
                          </span>{' '}
                          <span className="font-normal text-slate-600">{cbc.hemoglobin.unit}</span>
                          {cbc.hemoglobin.status === 'low' && <span className="ml-1 text-[10px] text-rose-600 font-bold">(L)</span>}
                          {cbc.hemoglobin.status === 'high' && <span className="ml-1 text-[10px] text-rose-600 font-bold">(H)</span>}
                        </td>
                        <td className="py-1.5 px-3 text-[11px] text-slate-700 leading-snug">
                          {cbc.hemoglobin.refRange}
                        </td>
                      </tr>

                      {/* ESR */}
                      <tr className={cbc.esr.status !== 'normal' ? 'bg-amber-50/50' : ''}>
                        <td className="py-1.5 px-3 border-r border-slate-300 font-medium">ESR (Westergren)</td>
                        <td className="py-1.5 px-3 border-r border-slate-300 text-center font-bold">
                          <span className={cbc.esr.status !== 'normal' ? 'text-rose-600 font-black' : 'text-slate-950 font-black'}>
                            {cbc.esr.val}
                          </span>{' '}
                          <span className="font-normal text-slate-600">{cbc.esr.unit}</span>
                          {cbc.esr.status === 'high' && <span className="ml-1 text-[10px] text-rose-600 font-bold">(H)</span>}
                        </td>
                        <td className="py-1.5 px-3 text-[11px] text-slate-700 leading-snug">
                          {cbc.esr.refRange}
                        </td>
                      </tr>

                      {/* Total WBC */}
                      <tr className={cbc.totalWbc.status !== 'normal' ? 'bg-amber-50/50' : ''}>
                        <td className="py-1.5 px-3 border-r border-slate-300 font-medium">Total WBC Count (TLC)</td>
                        <td className="py-1.5 px-3 border-r border-slate-300 text-center font-bold">
                          <span className="text-slate-950 font-black">{cbc.totalWbc.val.toLocaleString()}</span>{' '}
                          <span className="font-normal text-slate-600">{cbc.totalWbc.unit}</span>
                        </td>
                        <td className="py-1.5 px-3 text-[11px] text-slate-700 leading-snug">
                          {cbc.totalWbc.refRange}
                        </td>
                      </tr>

                      {/* Neutrophils */}
                      <tr>
                        <td className="py-1 px-3 border-r border-slate-300 pl-6 text-slate-700">Neutrophils</td>
                        <td className="py-1 px-3 border-r border-slate-300 text-center font-bold">
                          <span className="text-slate-900 font-bold">{cbc.neutrophils.val}</span>{' '}
                          <span className="font-normal text-slate-600">{cbc.neutrophils.unit}</span>
                        </td>
                        <td className="py-1 px-3 text-[11px] text-slate-700 leading-snug">{cbc.neutrophils.refRange}</td>
                      </tr>

                      {/* Lymphocytes */}
                      <tr>
                        <td className="py-1 px-3 border-r border-slate-300 pl-6 text-slate-700">Lymphocytes</td>
                        <td className="py-1 px-3 border-r border-slate-300 text-center font-bold">
                          <span className="text-slate-900 font-bold">{cbc.lymphocytes.val}</span>{' '}
                          <span className="font-normal text-slate-600">{cbc.lymphocytes.unit}</span>
                        </td>
                        <td className="py-1 px-3 text-[11px] text-slate-700 leading-snug">{cbc.lymphocytes.refRange}</td>
                      </tr>

                      {/* Monocytes */}
                      <tr>
                        <td className="py-1 px-3 border-r border-slate-300 pl-6 text-slate-700">Monocytes</td>
                        <td className="py-1 px-3 border-r border-slate-300 text-center font-bold">
                          <span className="text-slate-900 font-bold">{cbc.monocytes.val}</span>{' '}
                          <span className="font-normal text-slate-600">{cbc.monocytes.unit}</span>
                        </td>
                        <td className="py-1 px-3 text-[11px] text-slate-700 leading-snug">{cbc.monocytes.refRange}</td>
                      </tr>

                      {/* Eosinophils */}
                      <tr>
                        <td className="py-1 px-3 border-r border-slate-300 pl-6 text-slate-700">Eosinophils</td>
                        <td className="py-1 px-3 border-r border-slate-300 text-center font-bold">
                          <span className="text-slate-900 font-bold">{cbc.eosinophils.val}</span>{' '}
                          <span className="font-normal text-slate-600">{cbc.eosinophils.unit}</span>
                        </td>
                        <td className="py-1 px-3 text-[11px] text-slate-700 leading-snug">{cbc.eosinophils.refRange}</td>
                      </tr>

                      {/* Platelet Count */}
                      <tr className={cbc.plateletCount.status !== 'normal' ? 'bg-amber-50/50' : ''}>
                        <td className="py-1.5 px-3 border-r border-slate-300 font-medium">Platelet Count</td>
                        <td className="py-1.5 px-3 border-r border-slate-300 text-center font-bold">
                          <span className="text-slate-950 font-black">{cbc.plateletCount.val.toLocaleString()}</span>{' '}
                          <span className="font-normal text-slate-600">{cbc.plateletCount.unit}</span>
                        </td>
                        <td className="py-1.5 px-3 text-[11px] text-slate-700 leading-snug">
                          {cbc.plateletCount.refRange}
                        </td>
                      </tr>

                      {/* RBC Count */}
                      <tr>
                        <td className="py-1 px-3 border-r border-slate-300 font-medium">Total RBC Count</td>
                        <td className="py-1 px-3 border-r border-slate-300 text-center font-bold">
                          <span className="text-slate-950 font-bold">{cbc.rbcCount.val}</span>{' '}
                          <span className="font-normal text-slate-600">{cbc.rbcCount.unit}</span>
                        </td>
                        <td className="py-1 px-3 text-[11px] text-slate-700 leading-snug">{cbc.rbcCount.refRange}</td>
                      </tr>

                      {/* PCV */}
                      <tr>
                        <td className="py-1 px-3 border-r border-slate-300 font-medium">PCV / Hematocrit</td>
                        <td className="py-1 px-3 border-r border-slate-300 text-center font-bold">
                          <span className="text-slate-950 font-bold">{cbc.pcvHematocrit.val}</span>{' '}
                          <span className="font-normal text-slate-600">{cbc.pcvHematocrit.unit}</span>
                        </td>
                        <td className="py-1 px-3 text-[11px] text-slate-700 leading-snug">{cbc.pcvHematocrit.refRange}</td>
                      </tr>

                      {/* MCV, MCH, MCHC */}
                      <tr>
                        <td className="py-1 px-3 border-r border-slate-300 font-medium">MCV</td>
                        <td className="py-1 px-3 border-r border-slate-300 text-center font-bold">
                          <span className="text-slate-900 font-bold">{cbc.mcv.val}</span>{' '}
                          <span className="font-normal text-slate-600">{cbc.mcv.unit}</span>
                        </td>
                        <td className="py-1 px-3 text-[11px] text-slate-700 leading-snug">{cbc.mcv.refRange}</td>
                      </tr>
                      <tr>
                        <td className="py-1 px-3 border-r border-slate-300 font-medium">MCH</td>
                        <td className="py-1 px-3 border-r border-slate-300 text-center font-bold">
                          <span className="text-slate-900 font-bold">{cbc.mch.val}</span>{' '}
                          <span className="font-normal text-slate-600">{cbc.mch.unit}</span>
                        </td>
                        <td className="py-1 px-3 text-[11px] text-slate-700 leading-snug">{cbc.mch.refRange}</td>
                      </tr>
                      <tr>
                        <td className="py-1 px-3 border-r border-slate-300 font-medium">MCHC</td>
                        <td className="py-1 px-3 border-r border-slate-300 text-center font-bold">
                          <span className="text-slate-900 font-bold">{cbc.mchc.val}</span>{' '}
                          <span className="font-normal text-slate-600">{cbc.mchc.unit}</span>
                        </td>
                        <td className="py-1 px-3 text-[11px] text-slate-700 leading-snug">{cbc.mchc.refRange}</td>
                      </tr>
                    </>
                  ) : report.parameters && report.parameters.length > 0 ? (
                    report.parameters.map((param, idx) => (
                      <tr key={idx} className={param.status !== 'normal' ? 'bg-amber-50/50' : ''}>
                        <td className="py-2 px-3 border-r border-slate-300 font-medium text-slate-900">
                          {param.name}
                        </td>
                        <td className="py-2 px-3 border-r border-slate-300 text-center font-bold">
                          <span className={param.status !== 'normal' ? 'text-rose-600 font-black' : 'text-slate-950 font-black'}>
                            {param.result}
                          </span>{' '}
                          <span className="font-normal text-slate-600">{param.unit}</span>
                          {param.status === 'low' && <span className="ml-1 text-[10px] text-rose-600 font-bold">(L)</span>}
                          {param.status === 'high' && <span className="ml-1 text-[10px] text-rose-600 font-bold">(H)</span>}
                        </td>
                        <td className="py-2 px-3 text-[11px] text-slate-700 leading-snug">
                          {param.refRange}
                        </td>
                      </tr>
                    ))
                  ) : (
                    /* Default Hormone Example matching the uploaded photo */
                    <tr>
                      <td className="py-2 px-3 border-r border-slate-300 font-medium text-slate-900">
                        {report.testName || 'Serum TSH'}
                      </td>
                      <td className="py-2 px-3 border-r border-slate-300 text-center font-bold">
                        <span className="text-slate-950 font-black text-sm">1.56</span>{' '}
                        <span className="font-normal text-slate-600">μIU/mL</span>
                      </td>
                      <td className="py-2 px-3 text-[11px] text-slate-700 leading-tight space-y-0.5">
                        <p>15 Day-2 Yrs: 0.8-9.1 μIU/ml</p>
                        <p>2 Yrs-15 Yrs: 0.7-5.7 μIU/ml</p>
                        <p className="font-semibold text-slate-900">16 Yrs-54 Yrs: 0.27-4.20 μIU/ml</p>
                        <p>&gt;55 Yrs : 0.5-8.9 μIU/ml</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Radiology findings if applicable */}
            {report.radiologyFindings && (
              <div className="border border-slate-400 p-3 mb-4 bg-slate-50 text-xs">
                <span className="font-bold text-slate-800 uppercase block mb-1">Radiological Findings:</span>
                <p className="text-slate-700 leading-relaxed">{report.radiologyFindings}</p>
                {report.radiologyImpression && (
                  <div className="mt-2 pt-2 border-t border-slate-300 font-bold text-slate-900">
                    <span>Impression: </span>
                    <span>{report.radiologyImpression}</span>
                  </div>
                )}
              </div>
            )}

            {/* Pathologist Clinical Remarks */}
            {report.clinicalRemarks && (
              <div className="border border-slate-400 p-3 mb-5 bg-slate-50/70 text-xs">
                <span className="font-bold text-slate-800 uppercase text-[10px] tracking-wider block mb-0.5">
                  Pathologist's Remarks / Opinion:
                </span>
                <p className="text-slate-800 leading-relaxed font-sans">{report.clinicalRemarks}</p>
              </div>
            )}
          </div>

          {/* 4. FOOTER & SIGNATURES (Official CMH / Diagnostic Format) */}
          <div className="relative z-10 pt-4 border-t-2 border-slate-800 text-xs">
            <div className="grid grid-cols-3 gap-6 text-center">
              <div>
                <div className="h-10 border-b border-slate-600 flex items-end justify-center pb-1">
                  <p className="text-[11px] font-serif italic text-slate-400">Medical Technologist</p>
                </div>
                <p className="text-xs font-bold text-slate-800 mt-1">Medical Technologist</p>
                <p className="text-[10px] text-slate-500">Clinical Pathology Wing</p>
              </div>

              <div>
                <div className="h-10 border-b border-slate-600 flex items-end justify-center pb-1">
                  <p className="text-[11px] font-serif italic text-slate-400">Checked By</p>
                </div>
                <p className="text-xs font-bold text-slate-800 mt-1">Assistant Pathologist</p>
                <p className="text-[10px] text-slate-500">Department of Pathology</p>
              </div>

              <div>
                <div className="h-10 border-b border-slate-600 flex items-end justify-center pb-1">
                  <p className="text-[11px] font-serif italic text-slate-400">Approved By</p>
                </div>
                <p className="text-xs font-bold text-slate-900 mt-1">{report.pathologistName}</p>
                <p className="text-[10px] text-slate-600">{report.pathologistDegree}</p>
                <p className="text-[9px] text-slate-500">Classified Pathologist & Head</p>
              </div>
            </div>

            <div className="mt-4 pt-1.5 border-t border-slate-200 flex items-center justify-between text-[9px] text-slate-500 font-medium">
              <span>* This is a computer generated diagnostic report verified by department pathologists.</span>
              <span className="font-bold text-slate-800 tracking-wide">Software By : Shoriful Islam</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
