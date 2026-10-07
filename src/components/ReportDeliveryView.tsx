import React, { useState, useEffect } from 'react';
import {
  PackageCheck,
  Search,
  Lock,
  Unlock,
  Printer,
  AlertTriangle,
  CheckCircle2,
  Scan,
  CreditCard,
  User,
  Clock,
  ArrowRight,
  ShieldCheck,
  ShieldAlert,
  Download,
  Calendar,
  Droplet
} from 'lucide-react';
import { Patient, Invoice, LabReport, PaymentRecord, Staff } from '../types';
import { BarcodeRenderer } from './BarcodeRenderer';

interface ReportDeliveryViewProps {
  patients: Patient[];
  invoices: Invoice[];
  labReports: LabReport[];
  staff: Staff[];
  currentUser: Staff;
  onUpdateInvoice: (invoice: Invoice) => void;
  onUpdateLabReport: (report: LabReport) => void;
  onOpenPrintReport: (report: LabReport) => void;
  onOpenScanner: () => void;
  preselectedPatientId?: string | null;
  onClearPreselectedPatient?: () => void;
}

export const ReportDeliveryView: React.FC<ReportDeliveryViewProps> = ({
  patients,
  invoices,
  labReports,
  staff,
  currentUser,
  onUpdateInvoice,
  onUpdateLabReport,
  onOpenPrintReport,
  onOpenScanner,
  preselectedPatientId,
  onClearPreselectedPatient,
}) => {
  const [searchId, setSearchId] = useState(preselectedPatientId || (patients[0]?.id ?? ''));
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  // Due collection state inside delivery desk
  const [isCollectDueOpen, setIsCollectDueOpen] = useState(false);
  const [dueInvoiceToPay, setDueInvoiceToPay] = useState<Invoice | null>(null);
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payMethod, setPayMethod] = useState<'Cash' | 'bKash' | 'Nagad' | 'Card'>('Cash');
  const [payNote, setPayNote] = useState('Due collection prior to report delivery');

  // Match patient when searchId changes
  useEffect(() => {
    if (!searchId) {
      setSelectedPatient(null);
      return;
    }
    const clean = searchId.trim().toUpperCase();
    const cleanAlphanum = clean.replace(/[^A-Z0-9]/g, '');
    const cleanDigits = searchId.replace(/[^0-9]/g, '');

    const found = patients.find(
      (p) =>
        p.id.toUpperCase() === clean ||
        p.id.replace(/[^A-Z0-9]/g, '') === cleanAlphanum ||
        (cleanDigits.length >= 3 && p.id.replace(/[^0-9]/g, '').endsWith(cleanDigits)) ||
        (cleanDigits.length >= 5 && p.phone.replace(/[^0-9]/g, '').includes(cleanDigits))
    );
    if (found) {
      setSelectedPatient(found);
    } else {
      const loose = patients.find(
        (p) =>
          p.name.toLowerCase().includes(searchId.toLowerCase()) ||
          p.id.toLowerCase().includes(searchId.toLowerCase())
      );
      setSelectedPatient(loose || null);
    }
  }, [searchId, patients]);

  useEffect(() => {
    if (preselectedPatientId) {
      setSearchId(preselectedPatientId);
    }
  }, [preselectedPatientId]);

  // Financial status for selected patient
  const patientInvoices = selectedPatient
    ? invoices.filter((inv) => inv.patientId === selectedPatient.id)
    : [];

  const totalPatientBilled = patientInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
  const totalPatientPaid = patientInvoices.reduce((sum, inv) => sum + (inv.paidAmount || 0), 0);
  const totalPatientDue = patientInvoices.reduce((sum, inv) => sum + (inv.dueAmount || 0), 0);
  const hasDue = totalPatientDue > 0;

  // Published / completed reports for this patient
  const publishedReports = selectedPatient
    ? labReports.filter((r) => r.patientId === selectedPatient.id && r.status === 'completed')
    : [];

  const pendingReportsForPatient = selectedPatient
    ? labReports.filter((r) => r.patientId === selectedPatient.id && r.status === 'pending')
    : [];

  // Handle Pay Due inside Delivery Desk
  const handleOpenPayDue = (inv?: Invoice) => {
    const target = inv || patientInvoices.find((i) => i.dueAmount > 0) || null;
    if (target) {
      setDueInvoiceToPay(target);
      setPayAmount(target.dueAmount);
      setIsCollectDueOpen(true);
    }
  };

  const handlePayDueSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dueInvoiceToPay || payAmount <= 0) return;

    let remainingToDistribute = payAmount;
    const now = new Date();
    const formattedDate = `${now.toISOString().split('T')[0]} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

    // Find all due invoices for selected patient
    const patientDueInvoices = patientInvoices.filter((i) => i.dueAmount > 0);
    const sortedDueInvoices = [
      dueInvoiceToPay,
      ...patientDueInvoices.filter((i) => i.id !== dueInvoiceToPay.id),
    ];

    sortedDueInvoices.forEach((inv) => {
      if (remainingToDistribute <= 0) return;

      const payForThis = Math.min(remainingToDistribute, inv.dueAmount);
      const newPaid = inv.paidAmount + payForThis;
      const newDue = Math.max(0, inv.dueAmount - payForThis);

      const newPaymentRecord: PaymentRecord = {
        id: `PAY-DEL-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
        date: formattedDate,
        amount: payForThis,
        method: payMethod,
        collectedBy: currentUser.name,
        receiptNo: `REC-${Date.now().toString().slice(-4)}`,
        notes: payNote,
      };

      const updatedInvoice: Invoice = {
        ...inv,
        paidAmount: newPaid,
        dueAmount: newDue,
        status: newDue === 0 ? 'paid' : 'partial',
        paymentHistory: [...(inv.paymentHistory || []), newPaymentRecord],
      };

      onUpdateInvoice(updatedInvoice);
      remainingToDistribute -= payForThis;
    });

    setIsCollectDueOpen(false);
    setDueInvoiceToPay(null);
  };

  // Mark Report as Delivered
  const handleMarkAsDelivered = (report: LabReport) => {
    const now = new Date();
    const formattedDate = `${now.toISOString().split('T')[0]} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

    const updated: LabReport = {
      ...report,
      deliveredAt: formattedDate,
      deliveredBy: currentUser.name,
    };

    onUpdateLabReport(updated);
  };

  return (
    <div className="space-y-4">
      {/* Search Header Banner */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Enter Patient ID (e.g. P-2026-001) or Mobile Number..."
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 rounded-xl border border-slate-200 text-xs font-mono font-bold focus:ring-2 focus:ring-teal-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={onOpenScanner}
              className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs cursor-pointer whitespace-nowrap"
            >
              <Scan className="w-4 h-4 text-emerald-400 stroke-[2.5]" />
              Barcode Scan
            </button>
          </div>
        </div>

        {/* Quick Patient Selector Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto text-xs text-slate-600 pt-1">
          <span className="font-semibold text-slate-500 text-[11px] whitespace-nowrap">Quick Select:</span>
          {patients.map((p) => (
            <button
              key={p.id}
              onClick={() => setSearchId(p.id)}
              className={`px-2.5 py-1 rounded-lg border text-xs font-mono transition-colors whitespace-nowrap cursor-pointer ${
                selectedPatient?.id === p.id
                  ? 'bg-slate-900 text-white border-slate-900 font-bold'
                  : 'bg-white border-slate-200 hover:bg-slate-100 text-slate-700'
              }`}
            >
              {p.name.split(' ')[0]} ({p.id})
            </button>
          ))}
        </div>
      </div>

      {!selectedPatient ? (
        <div className="py-16 text-center text-slate-400 bg-white rounded-xl border border-slate-200 text-xs">
          <PackageCheck className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p className="font-semibold text-slate-600 text-sm">Enter Patient ID or Scan Barcode</p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Entering Patient ID will instantly verify ready reports and due balance clearance
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Patient Header & Payment Verification Bar */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-teal-600 text-white flex items-center justify-center text-lg font-bold">
                {selectedPatient.name.charAt(0)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-black text-slate-900 text-base">{selectedPatient.name}</h3>
                  <span className="font-mono text-xs font-bold bg-slate-900 text-white px-2 py-0.5 rounded">
                    {selectedPatient.id}
                  </span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-0.5">
                    <Droplet className="w-2.5 h-2.5 text-rose-500 fill-rose-500" />
                    {selectedPatient.bloodGroup}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Age: {selectedPatient.age} Yrs • {selectedPatient.gender === 'male' ? 'Male' : 'Female'} • Phone: {selectedPatient.phone}
                </p>
              </div>
            </div>

            {/* Financial Clearance Card */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full md:w-auto pt-3 md:pt-0 border-t md:border-t-0 border-slate-100">
              {hasDue ? (
                <div className="flex items-center gap-3 bg-rose-50 border border-rose-300 p-2.5 rounded-xl text-xs">
                  <div className="p-2 bg-rose-100 text-rose-700 rounded-lg">
                    <ShieldAlert className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-rose-800 uppercase block">
                      Outstanding Bill Unpaid
                    </span>
                    <span className="text-sm font-mono font-black text-rose-700">
                      BDT {totalPatientDue.toLocaleString()} Due
                    </span>
                  </div>
                  <button
                    onClick={() => handleOpenPayDue()}
                    className="ml-2 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold shadow-2xs transition-colors cursor-pointer whitespace-nowrap"
                  >
                    Clear Due Balance
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2.5 bg-emerald-50 border border-emerald-300 px-3.5 py-2 rounded-xl text-xs">
                  <ShieldCheck className="w-5 h-5 text-emerald-600" />
                  <div>
                    <span className="text-[10px] font-bold text-emerald-800 uppercase block">
                      Fee Cleared (Paid)
                    </span>
                    <span className="font-bold text-emerald-700 text-xs">
                      All Bills Fully Paid ✓
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Warning Banner if Due > 0 */}
          {hasDue && (
            <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl flex items-center justify-between text-xs text-amber-900">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-amber-700 shrink-0" />
                <span>
                  <strong>Delivery Locked:</strong> Report printing and download are disabled until hospital and lab dues are cleared.
                </span>
              </div>
              <button
                onClick={() => handleOpenPayDue()}
                className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded text-[11px] font-bold cursor-pointer whitespace-nowrap ml-2"
              >
                Clear Due Now
              </button>
            </div>
          )}

          {/* Published Reports Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <PackageCheck className="w-4 h-4 text-teal-600" />
                Ready Reports from Laboratory ({publishedReports.length}):
              </h3>
              {pendingReportsForPatient.length > 0 && (
                <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  {pendingReportsForPatient.length} Tests Pending in Lab
                </span>
              )}
            </div>

            {publishedReports.length === 0 ? (
              <div className="py-12 bg-white rounded-xl border border-slate-200 text-center text-slate-400 text-xs">
                No ready lab reports found for this patient.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {publishedReports.map((report) => {
                  const isDelivered = Boolean(report.deliveredAt);
                  return (
                    <div
                      key={report.id}
                      className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-col justify-between"
                    >
                      <div>
                        {/* Card Header */}
                        <div className="flex items-center justify-between pb-2 border-b border-slate-100 text-xs">
                          <span className="font-mono font-bold text-sky-800 bg-sky-50 px-1.5 py-0.5 rounded border border-sky-200">
                            {report.id}
                          </span>
                          {isDelivered ? (
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              Delivered
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded">
                              Ready for Delivery
                            </span>
                          )}
                        </div>

                        {/* Test details */}
                        <div className="mt-2.5">
                          <h4 className="font-bold text-slate-900 text-sm">{report.testName}</h4>
                          <p className="text-[11px] text-slate-500 mt-1">Referred: {report.referredByDoctor}</p>
                          <p className="text-[10px] text-slate-400 font-mono mt-0.5">Published Date: {report.reportedAt}</p>
                          <p className="text-[10px] text-slate-400">Authorized: {report.pathologistName}</p>

                          {report.deliveredAt && (
                            <p className="mt-2 text-[10px] font-semibold text-emerald-700 bg-emerald-50/80 p-1.5 rounded border border-emerald-200">
                              Dispatched to patient: {report.deliveredAt} ({report.deliveredBy || 'Counter'})
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Download / Print Actions */}
                      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                        {!isDelivered && !hasDue && (
                          <button
                            onClick={() => handleMarkAsDelivered(report)}
                            className="px-2.5 py-1 text-[11px] font-semibold text-slate-600 hover:bg-slate-100 rounded border border-slate-200 transition-colors cursor-pointer"
                          >
                            Mark Delivered
                          </button>
                        )}

                        <div className="ml-auto flex items-center gap-2">
                          {hasDue ? (
                            <>
                              <button
                                onClick={() => handleOpenPayDue()}
                                className="px-2.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-2xs transition-colors cursor-pointer"
                                title="Clear due balance to unlock report"
                              >
                                <CreditCard className="w-3.5 h-3.5" />
                                <span>Pay Due</span>
                              </button>
                              <button
                                disabled
                                title="Clear due balance to enable report download"
                                className="px-3.5 py-1.5 bg-rose-50 text-rose-600 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-not-allowed border border-rose-200"
                              >
                                <Lock className="w-3.5 h-3.5 text-rose-500" />
                                <span>Locked (Due Exists)</span>
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => {
                                if (!report.deliveredAt) {
                                  handleMarkAsDelivered(report);
                                }
                                onOpenPrintReport(report);
                              }}
                              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span>Download / Print</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* QUICK PAY DUE MODAL INSIDE DELIVERY COUNTER */}
      {isCollectDueOpen && dueInvoiceToPay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-sm overflow-hidden">
            <div className="px-4 py-3 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm">Collect Due & Unlock Report</h3>
              <button
                onClick={() => setIsCollectDueOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handlePayDueSubmit} className="p-4 space-y-3 text-xs">
              <div className="p-2.5 bg-rose-50 border border-rose-200 rounded flex items-center justify-between">
                <div>
                  <span className="font-bold text-rose-800">Total Due:</span>
                  <p className="text-[10px] text-slate-500 font-mono">{dueInvoiceToPay.id}</p>
                </div>
                <span className="text-base font-mono font-black text-rose-700">
                  BDT {dueInvoiceToPay.dueAmount.toLocaleString()}
                </span>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                  Collection Amount (BDT) *
                </label>
                <input
                  type="number"
                  min="1"
                  max={dueInvoiceToPay.dueAmount}
                  value={payAmount || ''}
                  onChange={(e) => setPayAmount(Number(e.target.value))}
                  required
                  className="w-full px-2.5 py-1.5 rounded border border-slate-300 font-mono font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Payment Method</label>
                <select
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value as any)}
                  className="w-full px-2.5 py-1.5 rounded border border-slate-300 bg-slate-50"
                >
                  <option value="Cash">Cash</option>
                  <option value="bKash">bKash</option>
                  <option value="Nagad">Nagad</option>
                  <option value="Card">Card</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsCollectDueOpen(false)}
                  className="px-3 py-1.5 rounded border border-slate-300 text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold cursor-pointer"
                >
                  Collect Due & Unlock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
