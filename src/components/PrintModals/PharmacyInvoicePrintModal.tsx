import React from 'react';
import { X, Printer, Download, Pill, AlertTriangle, CheckCircle2, Bed } from 'lucide-react';
import { PharmacySale, HospitalSettings } from '../../types';
import { BarcodeRenderer } from '../BarcodeRenderer';
import { HospitalEmblem } from '../HospitalEmblem';
import { loadHospitalSettings } from '../../utils/storage';

interface PharmacyInvoicePrintModalProps {
  sale: PharmacySale | null;
  onClose: () => void;
  hospitalSettings?: HospitalSettings;
}

export const PharmacyInvoicePrintModal: React.FC<PharmacyInvoicePrintModalProps> = ({
  sale,
  onClose,
  hospitalSettings: propSettings,
}) => {
  if (!sale) return null;

  const hospitalSettings = propSettings || loadHospitalSettings();

  const handlePrint = () => {
    window.print();
  };

  const isDue = sale.dueAmount > 0;
  const isIndoor = sale.saleType === 'indoor';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/70 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-300 w-full max-w-4xl my-auto overflow-hidden">
        {/* Top Control Bar */}
        <div className="no-print px-6 py-3.5 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded text-xs font-mono font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30">
              {sale.id}
            </span>
            <span className="text-sm font-medium">
              {isIndoor
                ? isDue
                  ? 'Inpatient Medicine Credit Dispensing Slip (ইনডোর ওষুধ বাকি স্লিপ)'
                  : 'Inpatient Medicine Paid Receipt'
                : 'Pharmacy Cash Memo / Medicine Receipt'}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md transition-all cursor-pointer"
              title="Print receipt or save as PDF"
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
          {/* Watermark */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.035] select-none z-0">
            <HospitalEmblem size={320} customLogoUrl={hospitalSettings.customLogoUrl} />
          </div>

          <div className="relative z-10 flex-1 flex flex-col justify-between space-y-6">
            <div>
              {/* 1. TOP OFFICIAL LETTERHEAD */}
              <div className="flex items-center justify-between border-b-2 border-slate-900 pb-4">
                <div className="flex items-center gap-4">
                  <div className="shrink-0">
                    <HospitalEmblem size={64} customLogoUrl={hospitalSettings.customLogoUrl} />
                  </div>
                  <div>
                    <h1 className="text-lg sm:text-xl font-black tracking-tight text-slate-900 uppercase">
                      {hospitalSettings.name}
                    </h1>
                    {hospitalSettings.nameBangla && (
                      <p className="text-xs font-semibold text-teal-800">
                        {hospitalSettings.nameBangla}
                      </p>
                    )}
                    <p className="text-[11px] text-slate-600 max-w-lg mt-0.5">
                      {hospitalSettings.address}
                    </p>
                    <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                      Tel: {hospitalSettings.phone} • Helpline: {hospitalSettings.hotline} • Reg No: {hospitalSettings.govtRegNo}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span className="px-3 py-1 rounded bg-teal-900 text-white text-[11px] font-black uppercase tracking-wider">
                    PHARMACY DISPENSARY & CASH COUNTER
                  </span>
                  <div className="mt-1">
                    <BarcodeRenderer value={sale.id} height={32} width={1.2} fontSize={10} />
                  </div>
                </div>
              </div>

              {/* Title & Receipt Meta */}
              <div className="mt-4 p-3 bg-slate-50 border border-slate-200 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
                <div>
                  <span className="font-mono text-slate-500">Receipt No:</span>{' '}
                  <strong className="font-mono text-slate-900 font-bold">{sale.invoiceNumber || sale.id}</strong>
                </div>
                <div>
                  <span className="text-slate-500">Dispense Date & Time:</span>{' '}
                  <strong className="font-mono text-slate-900">{sale.dispensedAt}</strong>
                </div>
                <div>
                  <span className="text-slate-500">Dispensed By:</span>{' '}
                  <strong className="text-slate-900">{sale.dispensedBy}</strong>
                </div>
                <div>
                  <span className="text-slate-500">Sale Category:</span>{' '}
                  <span className={`px-2 py-0.5 rounded font-bold uppercase text-[10px] ${
                    isIndoor ? 'bg-purple-100 text-purple-900 border border-purple-200' : 'bg-teal-100 text-teal-900 border border-teal-200'
                  }`}>
                    {isIndoor ? 'Inpatient / Bed Patient' : 'Outdoor / Walk-in'}
                  </span>
                </div>
              </div>

              {/* Patient Information Box */}
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-white border border-slate-300 rounded-xl text-xs">
                <div>
                  <span className="text-slate-400 font-semibold block text-[10px] uppercase">Patient Name</span>
                  <strong className="text-slate-900 font-bold text-sm">{sale.patientName}</strong>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold block text-[10px] uppercase">Patient ID / Reg No</span>
                  <strong className="font-mono text-teal-800 font-bold">{sale.patientId}</strong>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold block text-[10px] uppercase">Phone Number</span>
                  <span className="font-mono text-slate-800">{sale.patientPhone || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold block text-[10px] uppercase">
                    {isIndoor ? 'Bed Location' : 'Prescription Ref'}
                  </span>
                  {isIndoor ? (
                    <span className="font-mono font-bold text-purple-800 bg-purple-50 px-2 py-0.5 rounded border border-purple-200 inline-block">
                      {sale.bedNumber || 'Admitted Inpatient'}
                    </span>
                  ) : (
                    <span className="font-mono text-slate-700">{sale.prescriptionId || 'Direct Sale'}</span>
                  )}
                </div>
              </div>

              {/* Medicines Table */}
              <div className="mt-5 border border-slate-300 rounded-xl overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-900 text-white uppercase text-[10px] font-bold">
                    <tr>
                      <th className="py-2.5 px-3.5 text-center w-10">#</th>
                      <th className="py-2.5 px-3.5">Medicine Name & Dosage Form</th>
                      <th className="py-2.5 px-3.5">Generic Composition</th>
                      <th className="py-2.5 px-3.5 text-right w-24">Unit Price (BDT)</th>
                      <th className="py-2.5 px-3.5 text-center w-20">Quantity</th>
                      <th className="py-2.5 px-3.5 text-right w-28">Total (BDT)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {sale.items.map((item, idx) => (
                      <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                        <td className="py-2.5 px-3.5 text-center font-mono text-slate-400 font-bold">{idx + 1}</td>
                        <td className="py-2.5 px-3.5 font-bold text-slate-900">
                          <div className="flex items-center gap-1.5">
                            <Pill className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                            <span>{item.medicineName}</span>
                          </div>
                        </td>
                        <td className="py-2.5 px-3.5 text-slate-600 text-[11px]">{item.genericName}</td>
                        <td className="py-2.5 px-3.5 text-right font-mono">{item.unitPrice.toFixed(2)}</td>
                        <td className="py-2.5 px-3.5 text-center font-mono font-bold text-slate-900">{item.quantity}</td>
                        <td className="py-2.5 px-3.5 text-right font-mono font-bold text-slate-900">
                          {item.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Financial Calculation & Payment Status */}
              <div className="mt-4 flex flex-col sm:flex-row justify-between items-start gap-4">
                <div className="space-y-2 max-w-sm">
                  {isIndoor && isDue && (
                    <div className="p-3 bg-purple-50 border border-purple-300 rounded-xl text-[11px] text-purple-950 space-y-1">
                      <strong className="block font-bold text-purple-900 flex items-center gap-1">
                        <Bed className="w-3.5 h-3.5" />
                        ইনডোর পেশেন্ট ক্রেডিট হিসাব (Inpatient Credit Record)
                      </strong>
                      <p className="text-purple-800 leading-relaxed">
                        এই ওষুধগুলোর বিল পেশেন্টের আইডিতে বাকিতে অন্তর্ভুক্ত হয়েছে। ডিসচার্জের সময় এই বকেয়া বিল সম্পূর্ণ পরিশোধ সাপেক্ষে ডিসচার্জ পেপার প্রদান করা হবে।
                      </p>
                    </div>
                  )}

                  {!isIndoor && (
                    <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-600">
                      <strong>Policy Notice:</strong> Outdoor medicines sold are non-refundable once opened. Take medications exactly as prescribed by registered physician.
                    </div>
                  )}
                </div>

                <div className="w-full sm:w-72 bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal:</span>
                    <span className="font-mono font-bold">BDT {sale.subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                  {sale.discount > 0 && (
                    <div className="flex justify-between text-emerald-700">
                      <span>Discount:</span>
                      <span className="font-mono font-bold">- BDT {sale.discount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-slate-900 font-bold pt-1 border-t border-slate-300 text-sm">
                    <span>Net Total:</span>
                    <span className="font-mono font-black">BDT {sale.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between text-emerald-800 pt-1">
                    <span>Paid Amount:</span>
                    <span className="font-mono font-bold">BDT {sale.paidAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className={`flex justify-between font-bold pt-1 border-t border-slate-300 ${
                    isDue ? 'text-rose-700 font-black text-sm' : 'text-slate-800'
                  }`}>
                    <span>Due Balance:</span>
                    <span className="font-mono">BDT {sale.dueAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between text-slate-500 text-[11px] pt-1">
                    <span>Payment Mode:</span>
                    <span className="font-bold text-slate-800 uppercase">{sale.paymentMethod}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Official Signatures & Footer */}
            <div className="pt-8 border-t border-slate-200">
              <div className="grid grid-cols-3 gap-6 text-center text-xs text-slate-600 pb-4">
                <div className="flex flex-col items-center">
                  <div className="w-36 border-b border-slate-400 mb-1"></div>
                  <span className="font-bold">Customer / Attendant Signature</span>
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-36 border-b border-slate-400 mb-1"></div>
                  <span className="font-bold">Pharmacist / Dispenser</span>
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-36 border-b border-slate-400 mb-1"></div>
                  <span className="font-bold">Authorized Signatory</span>
                </div>
              </div>

              <div className="text-center text-[10px] text-slate-400 pt-2 border-t border-slate-100">
                {hospitalSettings.footerNotice || 'MedPulse Specialized Hospital Pharmacy • 24/7 Quality Healthcare & Genuine Medicines'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
