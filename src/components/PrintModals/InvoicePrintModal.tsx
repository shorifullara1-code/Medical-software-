import React, { useState } from 'react';
import { X, Printer, Download, AlertCircle, Compass, MapPin, Building } from 'lucide-react';
import { Invoice, HospitalSettings } from '../../types';
import { BarcodeRenderer } from '../BarcodeRenderer';
import { QRCodeRenderer } from '../QRCodeRenderer';
import { HospitalEmblem } from '../HospitalEmblem';
import { loadHospitalSettings } from '../../utils/storage';

interface InvoicePrintModalProps {
  invoice: Invoice | null;
  onClose: () => void;
  hospitalSettings?: HospitalSettings;
}

export const InvoicePrintModal: React.FC<InvoicePrintModalProps> = ({
  invoice,
  onClose,
  hospitalSettings: propSettings,
}) => {
  if (!invoice) return null;

  const hospitalSettings = propSettings || loadHospitalSettings();

  const handlePrint = () => {
    window.print();
  };

  const isDue = invoice.dueAmount > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/70 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-300 w-full max-w-4xl my-auto overflow-hidden">
        {/* Top Control Bar */}
        <div className="no-print px-6 py-3.5 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded text-xs font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              {invoice.id}
            </span>
            <span className="text-sm font-medium">
              {isDue ? 'Due Money Receipt' : 'Official Cash Receipt'}
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="px-3 py-1 rounded-lg bg-slate-800 text-emerald-400 font-semibold border border-slate-700 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              Dual Barcode: Patient ID (Left) & Receipt No (Right)
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md transition-all cursor-pointer"
              title="Print money receipt or save as PDF"
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

          <div className="relative z-10 flex-1 flex flex-col justify-between">
            <div>
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
                    {hospitalSettings.billingDept || 'DEPARTMENT OF FINANCE & CASH COUNTER'}
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
                    {isDue ? 'DUE MONEY RECEIPT' : 'OFFICIAL MONEY RECEIPT'}
                  </h2>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Hospital Cash & Billing Counter Slip
                  </span>
                </div>

                {/* Dual-Barcode & QR Strip: Left = Patient ID, Right = Invoice No */}
                <div className="p-3 border-b border-slate-300 grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50/50">
                  {/* Left: Patient ID Barcode (বাম পাশে পেশেন্ট আইডির বারকোড) + QR Code */}
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-xs flex flex-col items-center justify-center">
                    <span className="text-[10px] font-bold text-slate-800 uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                      পেশেন্ট আইডি বারকোড (Patient ID)
                    </span>
                    <div className="flex items-center justify-center gap-3 w-full">
                      <BarcodeRenderer
                        value={invoice.patientId}
                        height={46}
                        width={1.6}
                        fontSize={11}
                        margin={8}
                      />
                      <div className="flex flex-col items-center shrink-0 border-l border-slate-200 pl-2.5">
                        <QRCodeRenderer value={invoice.patientId} size={48} margin={1} />
                        <span className="text-[7.5px] font-bold text-slate-500 uppercase mt-0.5">Mobile QR</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Invoice No Barcode (ডান পাশে ইনভয়েসের বারকোড) + QR Code */}
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-xs flex flex-col items-center justify-center">
                    <span className="text-[10px] font-bold text-slate-800 uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
                      ইনভয়েস বারকোড (Invoice No)
                    </span>
                    <div className="flex items-center justify-center gap-3 w-full">
                      <BarcodeRenderer
                        value={invoice.id}
                        height={46}
                        width={1.6}
                        fontSize={11}
                        margin={8}
                      />
                      <div className="flex flex-col items-center shrink-0 border-l border-slate-200 pl-2.5">
                        <QRCodeRenderer value={invoice.id} size={48} margin={1} />
                        <span className="text-[7.5px] font-bold text-slate-500 uppercase mt-0.5">Mobile QR</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Patient Details */}
                <div className="p-3 space-y-1 text-[11px] font-sans">
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-1">
                    <div className="sm:col-span-5 flex items-baseline">
                      <span className="w-24 text-slate-700 font-medium">Patient ID</span>
                      <span className="mr-1">:</span>
                      <span className="font-mono font-bold text-slate-950">{invoice.patientId}</span>
                    </div>
                    <div className="sm:col-span-7 flex items-baseline justify-start sm:justify-end">
                      <span className="w-24 text-slate-700 font-medium">Receipt Date</span>
                      <span className="mr-1">:</span>
                      <span className="font-mono font-semibold text-slate-900">{invoice.date}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-1">
                    <div className="sm:col-span-7 flex items-baseline">
                      <span className="w-24 text-slate-700 font-medium">Patient Name</span>
                      <span className="mr-1">:</span>
                      <span className="font-bold text-slate-950 uppercase">{invoice.patientName}</span>
                    </div>
                    <div className="sm:col-span-2 flex items-baseline">
                      <span className="w-12 text-slate-700 font-medium">Phone</span>
                      <span className="mr-1">:</span>
                      <span className="font-mono text-slate-900">{invoice.patientPhone}</span>
                    </div>
                    <div className="sm:col-span-3 flex items-baseline justify-start sm:justify-end">
                      <span className="w-16 text-slate-700 font-medium">Status</span>
                      <span className="mr-1">:</span>
                      <span
                        className={`font-bold uppercase text-[10px] px-1.5 py-0.2 rounded border ${
                          isDue ? 'bg-rose-100 text-rose-800 border-rose-300' : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                        }`}
                      >
                        {isDue ? 'Due Balance' : 'Fully Paid'}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-1">
                    <div className="sm:col-span-7 flex items-baseline">
                      <span className="w-24 text-slate-700 font-medium">Referred By</span>
                      <span className="mr-1">:</span>
                      <span className="text-slate-900 font-medium">OPD / Duty Consultant</span>
                    </div>
                    <div className="sm:col-span-5 flex items-baseline justify-start sm:justify-end">
                      <span className="w-16 text-slate-700 font-medium">Cashier</span>
                      <span className="mr-1">:</span>
                      <span className="text-slate-800">{invoice.collectedBy}</span>
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-400"></div>

                <div className="p-3 space-y-1 text-[11px] font-sans">
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-1">
                    <div className="sm:col-span-5 flex items-baseline">
                      <span className="w-24 text-slate-700 font-medium">Service Desk</span>
                      <span className="mr-1">:</span>
                      <span className="font-medium text-slate-900">Hospital Billing & Cash Counter</span>
                    </div>
                    <div className="sm:col-span-7 flex items-baseline">
                      <span className="w-20 text-slate-700 font-medium">LAB No</span>
                      <span className="mr-1">:</span>
                      <span className="font-mono font-bold text-slate-900">{invoice.id.replace(/[^0-9]/g, '')}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-1">
                    <div className="sm:col-span-12 flex items-baseline">
                      <span className="w-24 text-slate-700 font-medium">Tests</span>
                      <span className="mr-1">:</span>
                      <span className="font-bold text-slate-900 uppercase">
                        {invoice.items.map((i) => i.name).join(', ')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. ITEMIZED CHARGES TABLE */}
              <div className="mb-4">
                <table className="w-full text-xs border-collapse border border-slate-400">
                  <thead>
                    <tr className="bg-slate-100 text-slate-900 font-bold text-[11px] border-b border-slate-400">
                      <th className="py-2 px-3 border-r border-slate-400 text-center w-10">SL</th>
                      <th className="py-2 px-3 border-r border-slate-400 text-left">Description / Test / Service</th>
                      <th className="py-2 px-3 border-r border-slate-400 text-center w-28">Category</th>
                      <th className="py-2 px-3 border-r border-slate-400 text-center w-14">Qty</th>
                      <th className="py-2 px-3 border-r border-slate-400 text-right w-24">Rate ($)</th>
                      <th className="py-2 px-3 text-right w-28">Total ($)</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-300 font-sans">
                    {invoice.items.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="py-1.5 px-3 border-r border-slate-300 text-center font-mono text-slate-600">
                          {idx + 1}
                        </td>
                        <td className="py-1.5 px-3 border-r border-slate-300 font-semibold text-slate-900">
                          {item.name}
                        </td>
                        <td className="py-1.5 px-3 border-r border-slate-300 text-center text-[10px] uppercase text-slate-600">
                          {item.category === 'consultation'
                            ? 'Consultation'
                            : item.category === 'lab_test'
                            ? 'Lab Test'
                            : item.category === 'medicine'
                            ? 'Pharmacy'
                            : item.category}
                        </td>
                        <td className="py-1.5 px-3 border-r border-slate-300 text-center font-mono">
                          {item.quantity}
                        </td>
                        <td className="py-1.5 px-3 border-r border-slate-300 text-right font-mono">
                          ${item.price.toLocaleString()}
                        </td>
                        <td className="py-1.5 px-3 text-right font-mono font-bold text-slate-900">
                          ${item.total.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* 4. TOTAL CALCULATIONS & DUE BANNER */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div className="border border-slate-400 p-3 bg-slate-50/70 text-xs">
                  <span className="font-bold text-slate-800 uppercase text-[10px] tracking-wider block mb-1.5">
                    Payment History & Transaction Logs:
                  </span>
                  {invoice.paymentHistory && invoice.paymentHistory.length > 0 ? (
                    <div className="space-y-1 font-mono text-[11px]">
                      {invoice.paymentHistory.map((pay, i) => (
                        <div key={i} className="flex justify-between border-b border-dashed border-slate-300 pb-1">
                          <span className="text-slate-600">{pay.date} ({pay.method})</span>
                          <span className="font-bold text-emerald-700">${pay.amount.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-slate-400 text-[11px]">No payment logs recorded</p>
                  )}

                  {isDue && (
                    <div className="mt-2 p-1.5 bg-rose-50 border border-rose-200 rounded text-rose-800 text-[10px] font-medium flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                      <span>Lab reports will be delivered upon clearing remaining dues.</span>
                    </div>
                  )}
                </div>

                <div className="border border-slate-400 overflow-hidden text-xs">
                  <div className="p-3 space-y-1 bg-white">
                    <div className="flex justify-between text-slate-600">
                      <span>Subtotal:</span>
                      <span className="font-mono font-medium">${invoice.subtotal.toLocaleString()}</span>
                    </div>
                    {invoice.discount > 0 && (
                      <div className="flex justify-between text-emerald-700">
                        <span>Discount:</span>
                        <span className="font-mono font-medium">-${invoice.discount.toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-slate-900 font-bold border-t border-slate-200 pt-1 text-sm">
                      <span>Net Payable:</span>
                      <span className="font-mono">${invoice.total.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-emerald-700 font-bold">
                      <span>Paid Amount:</span>
                      <span className="font-mono">${invoice.paidAmount.toLocaleString()}</span>
                    </div>
                  </div>

                  <div
                    className={`p-2 text-center border-t border-slate-400 ${
                      isDue ? 'bg-rose-600 text-white font-bold' : 'bg-emerald-600 text-white font-bold'
                    }`}
                  >
                    <div className="flex items-center justify-between text-sm sm:text-base">
                      <span>{isDue ? 'DUE AMOUNT:' : 'FULLY PAID:'}</span>
                      <span className="font-mono text-base sm:text-lg font-black">
                        ${invoice.dueAmount.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 5. SERIAL HORIZONTAL RED BOX FOR TEST ROOM DIRECTORY */}
              <div className="border-2 border-red-600 rounded-xl mb-4 bg-white overflow-hidden text-xs shadow-2xs">
                <div className="px-3 py-1 bg-red-600 text-white flex items-center justify-between font-bold text-[11px]">
                  <div className="flex items-center gap-1.5">
                    <Compass className="w-3.5 h-3.5 text-white" />
                    <span className="uppercase tracking-wide font-sans">
                      TEST ROOM ALLOCATION GUIDE
                    </span>
                  </div>
                  <span className="text-[10px] bg-white text-red-700 px-2 py-0.2 rounded font-bold font-sans">
                    Serial Order Left to Right
                  </span>
                </div>

                <div className="p-2.5 bg-red-50/20">
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                    {invoice.items.map((item, idx) => (
                      <div
                        key={idx}
                        className="bg-white border-2 border-red-200 hover:border-red-400 rounded-lg p-2 flex flex-col justify-between shadow-2xs transition-colors"
                      >
                        <div className="flex items-start gap-1.5 mb-1.5">
                          <span className="w-4 h-4 rounded-full bg-red-600 text-white font-mono font-bold text-[9px] flex items-center justify-center shrink-0 mt-0.5">
                            {idx + 1}
                          </span>
                          <span
                            className="font-bold text-slate-900 text-[10px] leading-tight line-clamp-2"
                            title={item.name}
                          >
                            {item.name}
                          </span>
                        </div>

                        <div className="mt-auto pt-1 border-t border-red-100 text-center">
                          <div className="bg-red-50 border border-red-400 text-red-900 font-mono font-black text-xs py-0.5 px-2 rounded-md shadow-2xs inline-block w-full">
                            Room No: {item.roomNo || '102'}
                          </div>
                          <p className="text-[9px] text-slate-600 font-medium truncate mt-0.5">
                            {item.roomLocation || '1st Floor Lab'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* 6. FOOTER & OFFICIAL SIGNATURES */}
            <div className="relative z-10 pt-3 border-t-2 border-slate-800 text-xs">
              <div className="grid grid-cols-2 gap-10">
                <div className="text-center w-48">
                  <div className="h-8 border-b border-slate-600 flex items-end justify-center pb-1">
                    <p className="text-[10px] font-serif italic text-slate-400">Received By (Cashier)</p>
                  </div>
                  <p className="text-xs font-bold text-slate-800 mt-0.5">{invoice.collectedBy}</p>
                  <p className="text-[9px] text-slate-500">Duty Billing Counter</p>
                </div>

                <div className="text-center w-48 ml-auto">
                  <div className="h-8 border-b border-slate-600 flex items-end justify-center pb-1">
                    <p className="text-[10px] font-serif italic text-slate-400">Accounts & Audit Officer</p>
                  </div>
                  <p className="text-xs font-bold text-slate-800 mt-0.5">Accounts & Audit Dept</p>
                  <p className="text-[9px] text-slate-500">Department of Finance</p>
                </div>
              </div>

              <div className="mt-3 pt-1 border-t border-slate-200 flex items-center justify-between text-[9px] text-slate-500 font-medium">
                <span>* Computer generated official money receipt. Barcodes correspond to Patient ID & Invoice Reference.</span>
                <span className="font-bold text-slate-800 tracking-wide">Software By : Shoriful Islam</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
