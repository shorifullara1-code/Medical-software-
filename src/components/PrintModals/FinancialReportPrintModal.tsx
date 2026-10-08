import React from 'react';
import { X, Printer, Download, TrendingUp, AlertTriangle, CreditCard, ShieldCheck } from 'lucide-react';
import { Invoice, HospitalSettings, Staff } from '../../types';
import { BarcodeRenderer } from '../BarcodeRenderer';
import { HospitalEmblem } from '../HospitalEmblem';
import { loadHospitalSettings } from '../../utils/storage';

interface FinancialReportPrintModalProps {
  invoices: Invoice[];
  periodLabel: string;
  startDate?: string;
  endDate?: string;
  currentUser: Staff;
  onClose: () => void;
  hospitalSettings?: HospitalSettings;
}

export const FinancialReportPrintModal: React.FC<FinancialReportPrintModalProps> = ({
  invoices,
  periodLabel,
  startDate,
  endDate,
  currentUser,
  onClose,
  hospitalSettings: propSettings,
}) => {
  const hospitalSettings = propSettings || loadHospitalSettings();

  const handlePrint = () => {
    window.print();
  };

  // Calculations for filtered invoices
  const totalBilled = invoices.reduce((sum, i) => sum + (i.subtotal || 0), 0);
  const totalDiscount = invoices.reduce((sum, i) => sum + (i.discount || 0), 0);
  const totalNet = invoices.reduce((sum, i) => sum + (i.total || 0), 0);
  const totalPaid = invoices.reduce((sum, i) => sum + (i.paidAmount || 0), 0);
  const totalDue = invoices.reduce((sum, i) => sum + (i.dueAmount || 0), 0);

  // Category breakdown
  const categoryTotals: Record<string, number> = {
    consultation: 0,
    lab_test: 0,
    medicine: 0,
    service: 0,
    bed: 0,
  };

  invoices.forEach((inv) => {
    inv.items.forEach((item) => {
      const cat = item.category || 'service';
      categoryTotals[cat] = (categoryTotals[cat] || 0) + (item.total || item.price * item.quantity);
    });
  });

  const categoryLabels: Record<string, string> = {
    consultation: 'Doctor Consultation & Fees',
    lab_test: 'Lab & Diagnostics Tests',
    medicine: 'Pharmacy & Medicines',
    service: 'Nursing & Clinical Services',
    bed: 'Bed & Cabin Charges',
  };

  // Payment methods breakdown
  const methodTotals: Record<string, number> = {
    Cash: 0,
    bKash: 0,
    Nagad: 0,
    Card: 0,
  };

  invoices.forEach((inv) => {
    inv.paymentHistory?.forEach((p) => {
      const m = p.method || 'Cash';
      methodTotals[m] = (methodTotals[m] || 0) + p.amount;
    });
  });

  const reportId = `FIN-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-AUDIT`;
  const reportDate = new Date().toISOString().slice(0, 10);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/70 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-300 w-full max-w-4xl my-auto overflow-hidden">
        {/* Top Control Bar */}
        <div className="no-print px-6 py-3.5 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded text-xs font-mono font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30">
              {reportId}
            </span>
            <span className="text-sm font-medium">
              Financial Audit & Revenue Report Preview (A4 Print Ready)
            </span>
          </div>
          <div className="flex items-center gap-3">
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

        {/* Printable Area */}
        <div className="printable-area relative p-8 sm:p-10 bg-white text-slate-900 max-w-[210mm] mx-auto min-h-[297mm] flex flex-col justify-between font-sans">
          {/* Subtle Watermark */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.035] select-none z-0">
            <HospitalEmblem size={320} customLogoUrl={hospitalSettings.customLogoUrl} />
          </div>

          <div className="relative z-10 space-y-4">
            {/* 1. TOP LETTERHEAD */}
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
                  {hospitalSettings.billingDept || 'DEPARTMENT OF FINANCE & ACCOUNTS AUDIT'}
                </p>
                <p className="text-[10px] text-slate-600 font-medium leading-tight mt-1">
                  Tel: {hospitalSettings.phone} {hospitalSettings.hotline ? `| Hotline: ${hospitalSettings.hotline}` : ''} | Email: {hospitalSettings.email} {hospitalSettings.website ? `| Website: ${hospitalSettings.website}` : ''}
                </p>
              </div>
            </div>

            {/* 2. DUAL-BARCODE & STATEMENT HEADER BOX */}
            <div className="border border-slate-600 text-xs bg-white/90">
              <div className="px-3 pt-2 pb-1.5 border-b border-slate-600 flex items-center justify-between gap-2">
                <div className="flex flex-col items-start w-36 shrink-0">
                  <span className="text-[8px] font-bold text-slate-600 uppercase">AUDIT REF</span>
                  <BarcodeRenderer value={reportId} height={22} width={1.1} displayValue={false} />
                  <span className="text-[8px] font-mono text-slate-500 font-bold">{reportId}</span>
                </div>

                <div className="flex-1 text-center">
                  <h2 className="text-base font-black text-slate-900 tracking-wide uppercase">
                    OFFICIAL FINANCIAL AUDIT & REVENUE STATEMENT
                  </h2>
                  <p className="text-xs font-bold text-teal-800 mt-0.5">Period: {periodLabel}</p>
                </div>

                <div className="flex flex-col items-end w-36 shrink-0">
                  <span className="text-[8px] font-bold text-slate-600 uppercase">REPORT DATE</span>
                  <BarcodeRenderer value={reportDate} height={22} width={1.1} displayValue={false} />
                  <span className="text-[8px] font-mono text-slate-500 font-bold">{reportDate}</span>
                </div>
              </div>

              <div className="p-2.5 grid grid-cols-4 gap-2 text-[11px] bg-slate-50/60">
                <div>
                  <span className="text-slate-500 block text-[9px] uppercase font-bold">Total Invoices</span>
                  <span className="font-bold text-slate-900">{invoices.length}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[9px] uppercase font-bold">Auditor / Staff</span>
                  <span className="font-bold text-slate-900">{currentUser.name}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[9px] uppercase font-bold">Role</span>
                  <span className="font-medium text-slate-800 capitalize">{currentUser.role}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[9px] uppercase font-bold">Print Time</span>
                  <span className="font-mono text-slate-900">{new Date().toLocaleTimeString()}</span>
                </div>
              </div>
            </div>

            {/* 3. EXECUTIVE FINANCIAL SUMMARY TABLE */}
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-teal-600" />
                1. Executive Financial Summary
              </h3>
              <table className="w-full border border-slate-700 text-xs">
                <thead>
                  <tr className="bg-slate-900 text-white font-bold text-[11px]">
                    <th className="p-2 text-left border-r border-slate-700">Account / Description</th>
                    <th className="p-2 text-right border-r border-slate-700">Gross Billed ($)</th>
                    <th className="p-2 text-right border-r border-slate-700">Discounts ($)</th>
                    <th className="p-2 text-right border-r border-slate-700">Net Payable ($)</th>
                    <th className="p-2 text-right border-r border-slate-700 bg-emerald-900 text-emerald-100">
                      Collected ($)
                    </th>
                    <th className="p-2 text-right bg-rose-900 text-rose-100">Total Dues ($)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-300 font-semibold">
                  <tr className="bg-white">
                    <td className="p-2 border-r border-slate-300">Hospital Total ({periodLabel})</td>
                    <td className="p-2 text-right border-r border-slate-300 font-mono">
                      ${totalBilled.toLocaleString()}
                    </td>
                    <td className="p-2 text-right border-r border-slate-300 font-mono text-slate-600">
                      ${totalDiscount.toLocaleString()}
                    </td>
                    <td className="p-2 text-right border-r border-slate-300 font-mono">
                      ${totalNet.toLocaleString()}
                    </td>
                    <td className="p-2 text-right border-r border-slate-300 font-mono font-bold text-emerald-700 bg-emerald-50/50">
                      ${totalPaid.toLocaleString()}
                    </td>
                    <td className="p-2 text-right font-mono font-bold text-rose-700 bg-rose-50/50">
                      ${totalDue.toLocaleString()}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* 4. BREAKDOWN BY SERVICE CATEGORY */}
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-sky-600" />
                2. Service Category Breakdown
              </h3>
              <table className="w-full border border-slate-400 text-xs">
                <thead>
                  <tr className="bg-slate-200 text-slate-900 font-bold text-[10px]">
                    <th className="p-1.5 text-left border-r border-slate-400">Service Category</th>
                    <th className="p-1.5 text-right border-r border-slate-400">Total Amount ($)</th>
                    <th className="p-1.5 text-right border-r border-slate-400">Share (%)</th>
                    <th className="p-1.5 text-left">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {Object.entries(categoryTotals).map(([catKey, amount], idx) => {
                    const totalCatSum = Object.values(categoryTotals).reduce((a, b) => a + b, 0) || 1;
                    const pct = ((amount / totalCatSum) * 100).toFixed(1);
                    return (
                      <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                        <td className="p-1.5 font-bold text-slate-800 border-r border-slate-300">
                          {categoryLabels[catKey] || catKey}
                        </td>
                        <td className="p-1.5 text-right font-mono font-bold text-slate-900 border-r border-slate-300">
                          ${amount.toLocaleString()}
                        </td>
                        <td className="p-1.5 text-right font-mono font-semibold text-slate-700 border-r border-slate-300">
                          {pct}%
                        </td>
                        <td className="p-1.5 text-[10px] text-slate-500">
                          {amount > 0 ? 'Active Transactions' : 'No Transactions'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* 5. PAYMENT METHODS BREAKDOWN */}
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-purple-600" />
                3. Payment Channels Breakdown
              </h3>
              <div className="grid grid-cols-4 gap-2">
                {Object.entries(methodTotals).map(([mName, mAmount], i) => (
                  <div key={i} className="p-2 border border-slate-300 rounded-lg bg-slate-50 text-center">
                    <span className="text-[10px] font-bold text-slate-600 uppercase block">{mName}</span>
                    <span className="text-sm font-mono font-bold text-slate-900 block mt-0.5">
                      ${mAmount.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* 6. OUTSTANDING DUES LIST */}
            {totalDue > 0 && (
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-1.5 flex items-center gap-1.5 text-rose-700">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                  4. Outstanding Dues Summary
                </h3>
                <div className="border border-slate-300 rounded-lg overflow-hidden">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-rose-100/70 text-rose-950 font-bold text-[10px] border-b border-slate-300">
                        <th className="p-1 text-left">Invoice Ref</th>
                        <th className="p-1 text-left">Patient Name & ID</th>
                        <th className="p-1 text-left">Date</th>
                        <th className="p-1 text-right">Total Bill</th>
                        <th className="p-1 text-right">Paid</th>
                        <th className="p-1 text-right text-rose-900">Due ($)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {invoices
                        .filter((inv) => inv.dueAmount > 0)
                        .map((inv, idx) => (
                          <tr key={idx} className="bg-white">
                            <td className="p-1 font-mono font-bold text-slate-800">{inv.id}</td>
                            <td className="p-1 font-bold text-slate-900">
                              {inv.patientName} <span className="text-[9px] font-normal text-slate-500 font-mono">({inv.patientId})</span>
                            </td>
                            <td className="p-1 font-mono text-slate-600">{inv.date}</td>
                            <td className="p-1 text-right font-mono">${inv.total.toLocaleString()}</td>
                            <td className="p-1 text-right font-mono text-emerald-700">${inv.paidAmount.toLocaleString()}</td>
                            <td className="p-1 text-right font-mono font-bold text-rose-700">${inv.dueAmount.toLocaleString()}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* 7. SIGNATURE AND AUDIT FOOTER */}
          <div className="mt-8 pt-4 border-t-2 border-slate-900">
            <div className="flex items-end justify-between">
              <div className="text-center w-48">
                <div className="border-b border-slate-800 pb-1 mb-1">
                  <p className="text-[10px] font-serif italic text-slate-500">{currentUser.name}</p>
                </div>
                <p className="text-xs font-bold text-slate-900">Prepared By (Accounts)</p>
                <p className="text-[9px] text-slate-500">Department of Finance</p>
              </div>

              <div className="text-center w-48">
                <div className="border-b border-slate-800 pb-1 mb-1">
                  <p className="text-[10px] font-serif italic text-slate-400">Internal Audit Verified</p>
                </div>
                <p className="text-xs font-bold text-slate-900">Internal Auditor</p>
                <p className="text-[9px] text-slate-500">Finance & Accounts</p>
              </div>

              <div className="text-center w-52">
                <div className="border-b border-slate-800 pb-1 mb-1">
                  <p className="text-[10px] font-serif italic text-slate-400">Authorized Official Stamp</p>
                </div>
                <p className="text-xs font-bold text-slate-900">Medical Director / Superintendent</p>
                <p className="text-[9px] text-slate-500">{hospitalSettings.name}</p>
              </div>
            </div>

            <div className="mt-4 pt-2 border-t border-slate-200 text-center text-[9px] text-slate-500 flex items-center justify-between">
              <span>{hospitalSettings.govtRegNo || 'DGHS Reg No: Verified'}</span>
              <span className="font-bold text-slate-800 tracking-wide">Software By : Shoriful Islam</span>
              <span>Page 1/1 (A4)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
