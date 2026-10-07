import React, { useState, useMemo, useEffect } from 'react';
import {
  Receipt,
  PlusCircle,
  Search,
  CreditCard,
  Printer,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  User,
  Sparkles,
  FileText,
  Compass,
  MapPin,
  Building,
  ChevronDown,
  Layers,
  Edit2,
  Eye,
  Bed,
  Clock,
  ExternalLink,
  Scan,
} from 'lucide-react';
import { Invoice, Patient, BillingItem, PaymentRecord, LabTestCatalogItem, Staff, IPDAdmission } from '../types';
import { calculate24HourBedRent, getPatientFinancialSummary } from '../utils/bedRentBilling';

interface BillingCenterViewProps {
  invoices: Invoice[];
  patients: Patient[];
  staff: Staff[];
  testCatalog: LabTestCatalogItem[];
  admissions?: IPDAdmission[];
  currentCollectorName: string;
  onSaveInvoice: (invoice: Invoice) => void;
  onUpdateInvoice: (invoice: Invoice) => void;
  onOpenPrint: (invoice: Invoice) => void;
  onOpenScanner: () => void;
  onNavigateToPrescription?: (patientId: string) => void;
  onNavigateToIPD?: () => void;
  onOpenAdmissionSlipPrint?: (admission: IPDAdmission) => void;
  initialDueInvoice?: Invoice | null;
  onClearInitialDue?: () => void;
  preselectedPatientId?: string | null;
  onClearPreselectedPatient?: () => void;
}

export const BillingCenterView: React.FC<BillingCenterViewProps> = ({
  invoices,
  patients,
  staff,
  testCatalog,
  admissions = [],
  currentCollectorName,
  onSaveInvoice,
  onUpdateInvoice,
  onOpenPrint,
  onOpenScanner,
  onNavigateToPrescription,
  onNavigateToIPD,
  onOpenAdmissionSlipPrint,
  initialDueInvoice,
  onClearInitialDue,
  preselectedPatientId,
  onClearPreselectedPatient,
}) => {
  const [filterType, setFilterType] = useState<'all' | 'due' | 'paid'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Auto-fill when preselectedPatientId changes
  useEffect(() => {
    if (preselectedPatientId) {
      setSearchQuery(preselectedPatientId);
      const invWithDue = invoices.find((i) => i.patientId === preselectedPatientId && i.dueAmount > 0);
      if (invWithDue) {
        setCollectDueInvoice(invWithDue);
        setCollectAmount(invWithDue.dueAmount);
      }
    }
  }, [preselectedPatientId, invoices]);

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [collectDueInvoice, setCollectDueInvoice] = useState<Invoice | null>(initialDueInvoice || null);
  const [collectAmount, setCollectAmount] = useState<number>(0);
  const [collectMethod, setCollectMethod] = useState<'Cash' | 'bKash' | 'Nagad' | 'Card'>('Cash');
  const [collectNotes, setCollectNotes] = useState('');

  // New Invoice Form State
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');
  const [invoiceItems, setInvoiceItems] = useState<BillingItem[]>([]);
  const [discount, setDiscount] = useState<number>(0);
  const [paidNow, setPaidNow] = useState<number>(0);
  const [initialPaymentMethod, setInitialPaymentMethod] = useState<'Cash' | 'bKash' | 'Nagad' | 'Card'>('Cash');

  // Test catalog search selector inside create modal
  const [testSearchInput, setTestSearchInput] = useState('');

  // Custom Item Inputs
  const [customItemName, setCustomItemName] = useState('');
  const [customItemPrice, setCustomItemPrice] = useState<number>(0);
  const [customItemRoomNo, setCustomItemRoomNo] = useState('102');
  const [customCategory, setCustomCategory] = useState<'consultation' | 'lab_test' | 'medicine' | 'service' | 'bed'>('service');

  // Active Inpatients Matched by Search or Overall
  const activeAdmissionsList = useMemo(() => {
    return admissions.filter((a) => a.status === 'admitted');
  }, [admissions]);

  const matchedActiveAdmissions = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return [];
    return activeAdmissionsList.filter(
      (a) =>
        a.patientId.toLowerCase().includes(q) ||
        a.patientName.toLowerCase().includes(q) ||
        a.patientPhone.includes(q) ||
        a.bedNumber.toLowerCase().includes(q) ||
        a.id.toLowerCase().includes(q)
    );
  }, [activeAdmissionsList, searchQuery]);

  const activeAdmForSelectedPatient = useMemo(() => {
    if (!selectedPatientId) return null;
    return activeAdmissionsList.find((a) => a.patientId === selectedPatientId) || null;
  }, [activeAdmissionsList, selectedPatientId]);

  // Filtered List
  const filteredInvoices = invoices.filter((inv) => {
    const matchesFilter =
      filterType === 'all'
        ? true
        : filterType === 'due'
        ? inv.dueAmount > 0
        : inv.dueAmount === 0;

    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      inv.id.toLowerCase().includes(q) ||
      inv.patientId.toLowerCase().includes(q) ||
      inv.patientName.toLowerCase().includes(q) ||
      inv.patientPhone.includes(q);

    return matchesFilter && matchesSearch;
  });

  const totalBilled = invoices.reduce((sum, i) => sum + i.total, 0);
  const totalPaid = invoices.reduce((sum, i) => sum + i.paidAmount, 0);
  const totalDue = invoices.reduce((sum, i) => sum + i.dueAmount, 0);

  const itemsSubtotal = invoiceItems.reduce((sum, itm) => sum + itm.total, 0);
  const netTotal = Math.max(0, itemsSubtotal - (discount || 0));
  const calculatedDue = Math.max(0, netTotal - (paidNow || 0));

  const handleOpenCreateModal = (preselectedPatientId?: string) => {
    setSelectedPatientId(preselectedPatientId || (patients[0]?.id ?? ''));
    setInvoiceItems([]);
    setDiscount(0);
    setPaidNow(0);
    setTestSearchInput('');
    setIsCreateModalOpen(true);
  };

  const handleAddItemFromCatalog = (test: LabTestCatalogItem) => {
    const existingIndex = invoiceItems.findIndex((it) => it.name === test.name);
    if (existingIndex >= 0) {
      const updated = [...invoiceItems];
      updated[existingIndex].quantity += 1;
      updated[existingIndex].total = updated[existingIndex].quantity * updated[existingIndex].price;
      setInvoiceItems(updated);
    } else {
      const roomNumber = test.roomNo || '102';
      const floorInfo = test.floor || '1st Floor';
      const locationText =
        test.roomLocation || `Room ${roomNumber} (${floorInfo}, ${test.category})`;

      setInvoiceItems([
        ...invoiceItems,
        {
          id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          name: test.name,
          category: 'lab_test',
          price: test.price,
          quantity: 1,
          total: test.price,
          roomNo: roomNumber,
          roomLocation: locationText,
        },
      ]);
    }
  };

  const handleAddDoctorConsultation = (doctor: Staff) => {
    const fee = doctor.consultationFee || 800;
    const name = `Consultation (${doctor.name})`;
    const doctorRoom = doctor.roomNo || '402 (4th Floor)';

    setInvoiceItems([
      ...invoiceItems,
      {
        id: `doc-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        name,
        category: 'consultation',
        price: fee,
        quantity: 1,
        total: fee,
        roomNo: doctorRoom,
        roomLocation: `Doctor Chamber ${doctorRoom} • ${doctor.specialization || 'Consultant'}`,
      },
    ]);
  };

  const handleAddCustomItem = () => {
    if (!customItemName.trim() || customItemPrice <= 0) return;
    setInvoiceItems([
      ...invoiceItems,
      {
        id: `custom-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        name: customItemName.trim(),
        category: customCategory,
        price: Number(customItemPrice),
        quantity: 1,
        total: Number(customItemPrice),
        roomNo: customItemRoomNo.trim() || 'Counter',
        roomLocation: `Room ${customItemRoomNo.trim() || 'Counter'}`,
      },
    ]);
    setCustomItemName('');
    setCustomItemPrice(0);
  };

  const handleRemoveItem = (index: number) => {
    setInvoiceItems(invoiceItems.filter((_, i) => i !== index));
  };

  const handleUpdateItemRoom = (index: number, newRoom: string) => {
    const updated = [...invoiceItems];
    updated[index].roomNo = newRoom;
    updated[index].roomLocation = `Room ${newRoom}`;
    setInvoiceItems(updated);
  };

  const handleCreateInvoiceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatientId) return;
    const patient = patients.find((p) => p.id === selectedPatientId);
    if (!patient) return;
    if (invoiceItems.length === 0) {
      alert('Please add at least one item.');
      return;
    }

    const newInvoiceId = `INV-${new Date().getFullYear()}-${1000 + invoices.length + 1}`;
    const todayStr = new Date().toISOString().split('T')[0];

    const initialPayments: PaymentRecord[] = [];
    if (paidNow > 0) {
      initialPayments.push({
        id: `PAY-${Date.now()}`,
        date: `${todayStr} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
        amount: Number(paidNow),
        method: initialPaymentMethod,
        collectedBy: currentCollectorName,
        receiptNo: `REC-${100 + invoices.length + 1}`,
        notes: calculatedDue > 0 ? `Partial Payment` : 'Fully Paid',
      });
    }

    const newInvoice: Invoice = {
      id: newInvoiceId,
      patientId: patient.id,
      patientName: patient.name,
      patientPhone: patient.phone,
      date: todayStr,
      items: invoiceItems,
      subtotal: itemsSubtotal,
      discount: Number(discount) || 0,
      total: netTotal,
      paidAmount: Number(paidNow) || 0,
      dueAmount: calculatedDue,
      status: calculatedDue === 0 ? 'paid' : Number(paidNow) > 0 ? 'partial' : 'due',
      collectedBy: currentCollectorName,
      paymentHistory: initialPayments,
    };

    onSaveInvoice(newInvoice);
    setIsCreateModalOpen(false);
    onOpenPrint(newInvoice);
  };

  const handleCollectDueSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!collectDueInvoice) return;
    const amount = Number(collectAmount);
    if (amount <= 0 || amount > collectDueInvoice.dueAmount) {
      alert('Please enter a valid collection amount.');
      return;
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const newPayment: PaymentRecord = {
      id: `PAY-${Date.now()}`,
      date: `${todayStr} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
      amount,
      method: collectMethod,
      collectedBy: currentCollectorName,
      receiptNo: `REC-${Date.now().toString().slice(-4)}`,
      notes: collectNotes || 'Due bill payment',
    };

    const newPaidAmount = collectDueInvoice.paidAmount + amount;
    const newDueAmount = Math.max(0, collectDueInvoice.dueAmount - amount);

    const updatedInvoice: Invoice = {
      ...collectDueInvoice,
      paidAmount: newPaidAmount,
      dueAmount: newDueAmount,
      status: newDueAmount === 0 ? 'paid' : 'partial',
      paymentHistory: [...collectDueInvoice.paymentHistory, newPayment],
    };

    onUpdateInvoice(updatedInvoice);
    setCollectDueInvoice(null);
    onClearInitialDue?.();
    onOpenPrint(updatedInvoice);
  };

  const matchingCatalogTests = testCatalog.filter((t) => {
    if (!testSearchInput.trim()) return true;
    const q = testSearchInput.toLowerCase();
    return (
      t.name.toLowerCase().includes(q) ||
      t.code.toLowerCase().includes(q) ||
      t.category.toLowerCase().includes(q) ||
      (t.roomNo && t.roomNo.includes(q))
    );
  });

  return (
    <div className="space-y-4">
      {/* Top Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-500 uppercase">Total Billed</span>
          <h3 className="text-xl font-black text-slate-900 font-mono mt-0.5">BDT {totalBilled.toLocaleString()}</h3>
        </div>
        <div className="bg-emerald-50/70 p-3.5 rounded-xl border border-emerald-200 shadow-2xs">
          <span className="text-[10px] font-bold text-emerald-800 uppercase">Total Cash Collected</span>
          <h3 className="text-xl font-black text-emerald-700 font-mono mt-0.5">BDT {totalPaid.toLocaleString()}</h3>
        </div>
        <div className="bg-rose-50/70 p-3.5 rounded-xl border border-rose-200 shadow-2xs">
          <span className="text-[10px] font-bold text-rose-800 uppercase">Total Outstanding Dues</span>
          <h3 className="text-xl font-black text-rose-700 font-mono mt-0.5">BDT {totalDue.toLocaleString()}</h3>
        </div>
      </div>

      {/* Main Billing Toolbar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {/* Search Box */}
          <div className="relative w-64 sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Invoice No (INV-...), Patient ID or Phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 rounded-lg border border-slate-200 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-teal-500"
            />
          </div>

          <button
            onClick={onOpenScanner}
            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
          >
            <Scan className="w-3.5 h-3.5 text-emerald-400" />
            <span>Barcode Scan</span>
          </button>

          {/* Filter Pills */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
            <button
              onClick={() => setFilterType('all')}
              className={`px-2.5 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
                filterType === 'all' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All ({invoices.length})
            </button>
            <button
              onClick={() => setFilterType('due')}
              className={`px-2.5 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
                filterType === 'due' ? 'bg-rose-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Due ({invoices.filter((i) => i.dueAmount > 0).length})
            </button>
            <button
              onClick={() => setFilterType('paid')}
              className={`px-2.5 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
                filterType === 'paid' ? 'bg-emerald-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Paid ({invoices.filter((i) => i.dueAmount === 0).length})
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleOpenCreateModal()}
            className="px-3.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>New Bill / Ticket Counter</span>
          </button>
        </div>
      </div>

      {/* Active Inpatients 24-Hour Bed Rent Dues Search Alert */}
      {matchedActiveAdmissions.length > 0 && (
        <div className="space-y-3">
          {matchedActiveAdmissions.map((adm) => {
            const accrual = calculate24HourBedRent(adm);
            const patientInvDues = invoices
              .filter((i) => i.patientId === adm.patientId)
              .reduce((sum, i) => sum + i.dueAmount, 0);
            const combinedDue = patientInvDues + accrual.netBedRentDue;

            return (
              <div
                key={adm.id}
                className="p-4 bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950 text-white rounded-2xl shadow-md border-2 border-purple-500/40 animate-fadeIn space-y-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-purple-800/60">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-purple-500/20 text-purple-300 rounded-xl border border-purple-500/30">
                      <Bed className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-purple-300">
                          Active Admitted Inpatient (আইপিডি ইনপেশেন্ট)
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/30 text-purple-200 border border-purple-400/30">
                          {adm.bedNumber} ({adm.wardType})
                        </span>
                      </div>
                      <h4 className="text-base font-black text-white mt-0.5">
                        {adm.patientName} <span className="text-xs font-mono font-normal text-teal-300">({adm.patientId})</span>
                      </h4>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {onOpenAdmissionSlipPrint && (
                      <button
                        type="button"
                        onClick={() => onOpenAdmissionSlipPrint(adm)}
                        className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer border border-white/10"
                      >
                        <Printer className="w-3.5 h-3.5 text-purple-300" />
                        <span>Bed Ticket</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleOpenCreateModal(adm.patientId)}
                      className="px-3.5 py-1.5 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md transition-colors cursor-pointer"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      <span>New Bill for Patient</span>
                    </button>
                    {onNavigateToIPD && (
                      <button
                        type="button"
                        onClick={onNavigateToIPD}
                        className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md transition-colors cursor-pointer"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Go to IPD Discharge</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* 24-Hour Cycle Figures */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                  <div className="p-2.5 bg-slate-800/80 rounded-xl border border-slate-700/80">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Stay Duration</span>
                    <span className="font-mono font-bold text-white text-xs">{accrual.stayDays} Days ({Math.floor(accrual.elapsedHours)}h)</span>
                    <span className="text-[9px] text-purple-300 block">Cycle Day {accrual.currentCycleDay}</span>
                  </div>

                  <div className="p-2.5 bg-slate-800/80 rounded-xl border border-slate-700/80">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Accrued 24h Bed Rent</span>
                    <span className="font-mono font-bold text-white text-xs">${accrual.totalAccruedBedRent.toLocaleString()}</span>
                    <span className="text-[9px] text-slate-400 block">${accrual.dailyBedCharge}/Day</span>
                  </div>

                  <div className="p-2.5 bg-slate-800/80 rounded-xl border border-slate-700/80">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Advance Adjusted</span>
                    <span className="font-mono font-bold text-emerald-400 text-xs">${accrual.advanceDeposit.toLocaleString()}</span>
                    <span className="text-[9px] text-emerald-300 block">Deposit on record</span>
                  </div>

                  <div className={`p-2.5 rounded-xl border ${accrual.netBedRentDue > 0 ? 'bg-rose-950/70 border-rose-600 text-rose-200' : 'bg-emerald-950/70 border-emerald-600 text-emerald-200'}`}>
                    <span className="text-[10px] font-bold uppercase block">Net Bed Rent Due</span>
                    <span className="font-mono font-black text-sm">${accrual.netBedRentDue.toLocaleString()}</span>
                    <span className="text-[9px] block">
                      {patientInvDues > 0 ? `+ $${patientInvDues} invoice dues = $${combinedDue}` : 'Current Bed Balance'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Invoices List Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-700 uppercase font-bold text-[10px] border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Bill No</th>
                <th className="py-2.5 px-3">Patient Details</th>
                <th className="py-2.5 px-3">Tests / Services & Rooms</th>
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3 text-right">Total (BDT)</th>
                <th className="py-2.5 px-3 text-right">Paid (BDT)</th>
                <th className="py-2.5 px-3 text-right">Due (BDT)</th>
                <th className="py-2.5 px-3 text-center">Status</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    No invoices found.
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => {
                  const hasDue = inv.dueAmount > 0;
                  return (
                    <tr key={inv.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-900">{inv.id}</td>
                      <td className="py-2.5 px-3">
                        <span className="font-bold text-slate-900 mr-1.5">{inv.patientName}</span>
                        <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-1 rounded">
                          {inv.patientId}
                        </span>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">{inv.patientPhone}</div>
                      </td>

                      {/* Items & Designated Room Badges */}
                      <td className="py-2.5 px-3 max-w-[280px]">
                        <div className="flex flex-wrap gap-1">
                          {inv.items.map((itm, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center gap-1 text-[10px] font-medium bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded border border-slate-200"
                              title={itm.roomLocation || itm.name}
                            >
                              <span className="truncate max-w-[120px]">{itm.name}</span>
                              {itm.roomNo && (
                                <span className="font-bold text-teal-800 bg-teal-100/90 px-1 rounded text-[9px]">
                                  Room {itm.roomNo}
                                </span>
                              )}
                            </span>
                          ))}
                        </div>
                      </td>

                      <td className="py-2.5 px-3 font-mono text-slate-500">{inv.date}</td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-900 font-bold">
                        BDT {inv.total.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-700">
                        BDT {inv.paidAmount.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold">
                        {hasDue ? (
                          <span className="text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                            BDT {inv.dueAmount.toLocaleString()}
                          </span>
                        ) : (
                          <span className="text-slate-400 font-normal">BDT 0</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            inv.status === 'paid'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {inv.status === 'paid' ? 'Paid' : 'Due'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {hasDue && (
                            <button
                              onClick={() => {
                                setCollectDueInvoice(inv);
                                setCollectAmount(inv.dueAmount);
                              }}
                              className="px-2 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded text-[11px] font-bold cursor-pointer shadow-2xs"
                            >
                              Collect
                            </button>
                          )}

                          <button
                            onClick={() => onOpenPrint(inv)}
                            className="p-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded cursor-pointer transition-colors"
                            title="Print Receipt"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>

                          {onNavigateToPrescription && (
                            <button
                              onClick={() => onNavigateToPrescription(inv.patientId)}
                              className="p-1 bg-teal-50 hover:bg-teal-100 text-teal-800 rounded cursor-pointer transition-colors"
                              title="Prescription"
                            >
                              <FileText className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE NEW BILL / TICKET COUNTER MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl my-auto overflow-hidden">
            <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-teal-400" />
                <h3 className="font-bold text-sm">New Bill & Test Ticket Counter</h3>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateInvoiceSubmit} className="p-5 space-y-4 max-h-[85vh] overflow-y-auto text-xs">
              {/* Patient Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Select Patient *</label>
                <select
                  value={selectedPatientId}
                  onChange={(e) => setSelectedPatientId(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-slate-50 font-medium"
                >
                  <option value="">Select Patient...</option>
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} — {p.id} ({p.phone})
                    </option>
                  ))}
                </select>
              </div>

              {/* Active Inpatient Bed Rent Alert & 1-Click Add */}
              {activeAdmForSelectedPatient && (
                (() => {
                  const accrual = calculate24HourBedRent(activeAdmForSelectedPatient);
                  const isAlreadyAdded = invoiceItems.some((it) => it.category === 'bed');

                  const handleAddBedRentToInvoice = () => {
                    const bedItem: BillingItem = {
                      id: `item-bed-${Date.now()}`,
                      name: `Inpatient Bed Rent: ${accrual.bedNumber} (${accrual.wardType}) - ${accrual.stayDays} Days (24h Cycles)`,
                      category: 'bed',
                      price: accrual.dailyBedCharge,
                      quantity: accrual.stayDays,
                      total: accrual.totalAccruedBedRent,
                      roomNo: accrual.bedNumber,
                      roomLocation: `IPD Ward: ${accrual.wardType}`,
                    };
                    setInvoiceItems([...invoiceItems, bedItem]);
                  };

                  return (
                    <div className="p-3 bg-purple-50 border border-purple-300 rounded-xl space-y-2 animate-fadeIn">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Bed className="w-4 h-4 text-purple-700" />
                          <span className="font-bold text-purple-950 text-xs">
                            Active Inpatient in {accrual.bedNumber} ({accrual.wardType})
                          </span>
                        </div>
                        <span className="font-mono font-bold text-purple-900 text-[11px] bg-purple-100 px-2 py-0.5 rounded">
                          {accrual.stayDays} Days Stayed (${accrual.dailyBedCharge}/day)
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
                        <span className="text-slate-600">
                          Accrued Rent: <strong>${accrual.totalAccruedBedRent}</strong> • Advance: <strong>${accrual.advanceDeposit}</strong> • Net Due: <strong className="text-rose-600">${accrual.netBedRentDue}</strong>
                        </span>
                        <button
                          type="button"
                          disabled={isAlreadyAdded}
                          onClick={handleAddBedRentToInvoice}
                          className="px-3 py-1 bg-purple-700 hover:bg-purple-600 disabled:opacity-50 text-white rounded-lg font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <PlusCircle className="w-3.5 h-3.5" />
                          <span>{isAlreadyAdded ? '✓ Bed Rent Added' : `+ Add ${accrual.stayDays} Days Bed Rent to Bill`}</span>
                        </button>
                      </div>
                    </div>
                  );
                })()
              )}

              {/* Quick Add Presets: Doctors & Popular Tests */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-600 uppercase block">
                    ⚡ Quick Add Tests & Services:
                  </span>
                  <span className="text-[10px] text-teal-800 font-semibold">
                    * Clicking will automatically associate designated room numbers
                  </span>
                </div>

                {/* Doctor Consultations */}
                <div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Doctor Consultations:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {staff
                      .filter((s) => s.role === 'doctor')
                      .map((doc) => (
                        <button
                          type="button"
                          key={doc.id}
                          onClick={() => handleAddDoctorConsultation(doc)}
                          className="px-2 py-1 bg-white hover:bg-teal-50 border border-slate-200 rounded text-xs text-slate-700 cursor-pointer flex items-center gap-1 shadow-2xs"
                        >
                          <span>{doc.name.split(' ')[1] || doc.name}</span>
                          <span className="font-mono text-emerald-700 font-bold text-[10px]">(BDT {doc.consultationFee})</span>
                          <span className="text-[9px] bg-teal-100 text-teal-800 px-1 rounded font-bold">
                            Room {doc.roomNo?.split(' ')[0] || '402'}
                          </span>
                        </button>
                      ))}
                  </div>
                </div>

                {/* Test Catalog Quick Grid / Search */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[9px] font-bold text-slate-400 uppercase">Lab & Diagnostic Catalog:</span>
                    <input
                      type="text"
                      placeholder="Filter by test or room..."
                      value={testSearchInput}
                      onChange={(e) => setTestSearchInput(e.target.value)}
                      className="px-2 py-0.5 text-[10px] border border-slate-200 rounded bg-white w-44"
                    />
                  </div>
                  <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto p-1 bg-white rounded-lg border border-slate-200">
                    {matchingCatalogTests.map((test) => (
                      <button
                        type="button"
                        key={test.id}
                        onClick={() => handleAddItemFromCatalog(test)}
                        className="px-2 py-1 bg-slate-50 hover:bg-sky-50 border border-slate-200 hover:border-sky-300 rounded text-xs text-slate-700 cursor-pointer flex items-center gap-1.5 transition-colors"
                      >
                        <span className="font-bold text-sky-900">{test.code}</span>
                        <span className="text-slate-600 truncate max-w-[110px]">{test.name}</span>
                        <span className="font-mono text-emerald-700 font-bold text-[10px]">BDT {test.price}</span>
                        <span className="text-[9px] bg-teal-100 text-teal-900 px-1 py-0.2 rounded font-bold">
                          Room {test.roomNo || '102'}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Custom Item Row */}
              <div className="grid grid-cols-12 gap-2 items-end bg-slate-50/50 p-2.5 rounded-lg border border-slate-200">
                <div className="col-span-5">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">Other Custom Service</label>
                  <input
                    type="text"
                    placeholder="Service or Test Name"
                    value={customItemName}
                    onChange={(e) => setCustomItemName(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded border border-slate-300 text-xs bg-white"
                  />
                </div>
                <div className="col-span-3">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">Room No</label>
                  <input
                    type="text"
                    placeholder="e.g. 102"
                    value={customItemRoomNo}
                    onChange={(e) => setCustomItemRoomNo(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded border border-slate-300 text-xs bg-white"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">Price (BDT)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={customItemPrice || ''}
                    onChange={(e) => setCustomItemPrice(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 rounded border border-slate-300 text-xs font-mono bg-white"
                  />
                </div>
                <div className="col-span-2">
                  <button
                    type="button"
                    onClick={handleAddCustomItem}
                    className="w-full py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded text-xs font-bold cursor-pointer"
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Added Items Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100 text-slate-700 text-[10px] uppercase font-bold">
                    <tr>
                      <th className="py-2 px-3 w-8">SL</th>
                      <th className="py-2 px-3">Test / Service Name</th>
                      <th className="py-2 px-3 text-center">Designated Room No</th>
                      <th className="py-2 px-3 text-right">Qty</th>
                      <th className="py-2 px-3 text-right">Price</th>
                      <th className="py-2 px-3 w-8 text-center"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {invoiceItems.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-6 text-center text-slate-400">
                          No tests or services added yet. Select from catalog above.
                        </td>
                      </tr>
                    ) : (
                      invoiceItems.map((itm, idx) => (
                        <tr key={itm.id} className="hover:bg-slate-50/70">
                          <td className="py-2 px-3 font-mono text-slate-500">{idx + 1}</td>
                          <td className="py-2 px-3 font-semibold text-slate-900">{itm.name}</td>
                          <td className="py-2 px-3 text-center">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-teal-50 border border-teal-200 text-teal-950 font-bold rounded text-[11px]">
                              <MapPin className="w-3 h-3 text-teal-600" />
                              Room {itm.roomNo || '102'}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-right font-mono">{itm.quantity}</td>
                          <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                            BDT {itm.total.toLocaleString()}
                          </td>
                          <td className="py-2 px-3 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(idx)}
                              className="text-rose-500 hover:text-rose-700 cursor-pointer p-0.5"
                            >
                              ✕
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* DYNAMIC ROOM BREAKDOWN IN HORIZONTAL RED BOX */}
              {invoiceItems.length > 0 && (
                <div className="border-2 border-red-600 rounded-xl overflow-hidden bg-white shadow-2xs space-y-0">
                  <div className="px-3 py-1.5 bg-red-600 text-white flex items-center justify-between font-bold text-[11px]">
                    <div className="flex items-center gap-1.5">
                      <Compass className="w-3.5 h-3.5 text-white" />
                      <span className="uppercase tracking-wide">
                        TEST ROOM DIRECTORY
                      </span>
                    </div>
                    <span className="text-[10px] bg-white text-red-700 px-2 py-0.2 rounded font-bold">
                      Serial Room Guide ({invoiceItems.length} Items)
                    </span>
                  </div>

                  <div className="p-2.5 bg-red-50/20">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {invoiceItems.map((itm, idx) => (
                        <div
                          key={itm.id}
                          className="bg-white border-2 border-red-200 hover:border-red-400 rounded-lg p-2 flex flex-col justify-between shadow-2xs transition-colors"
                        >
                          <div className="flex items-start gap-1.5 mb-1.5">
                            <span className="w-4 h-4 rounded-full bg-red-600 text-white font-mono font-bold text-[9px] flex items-center justify-center shrink-0 mt-0.5">
                              {idx + 1}
                            </span>
                            <span className="font-bold text-slate-900 text-[10px] leading-tight line-clamp-2" title={itm.name}>
                              {itm.name}
                            </span>
                          </div>

                          <div className="mt-auto pt-1 border-t border-red-100 flex items-center justify-between gap-1">
                            <div className="bg-red-50 border border-red-400 text-red-900 font-mono font-black text-xs py-0.5 px-2 rounded-md shadow-2xs">
                              Room {itm.roomNo || '102'}
                            </div>

                            <input
                              type="text"
                              title="Edit Room No"
                              placeholder="Room"
                              value={itm.roomNo || ''}
                              onChange={(e) => handleUpdateItemRoom(idx, e.target.value)}
                              className="w-12 px-1 py-0.5 bg-slate-50 border border-slate-300 rounded text-[9px] font-bold text-center focus:border-red-500"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Calculations & Payment */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="space-y-2.5">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">Discount (BDT)</label>
                    <input
                      type="number"
                      min="0"
                      value={discount || ''}
                      onChange={(e) => setDiscount(Number(e.target.value))}
                      placeholder="0"
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 font-mono bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">Cash Paid Now (BDT)</label>
                    <input
                      type="number"
                      min="0"
                      value={paidNow || ''}
                      onChange={(e) => setPaidNow(Number(e.target.value))}
                      placeholder="0"
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 font-mono bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">Payment Method</label>
                    <select
                      value={initialPaymentMethod}
                      onChange={(e) => setInitialPaymentMethod(e.target.value as any)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white"
                    >
                      <option value="Cash">Cash</option>
                      <option value="bKash">bKash</option>
                      <option value="Nagad">Nagad</option>
                      <option value="Card">Card</option>
                    </select>
                  </div>
                </div>

                <div className="p-3 bg-white rounded-lg border border-slate-200 flex flex-col justify-between font-mono">
                  <div className="space-y-1 text-slate-600">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span className="font-bold">BDT {itemsSubtotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-rose-600">
                      <span>Discount:</span>
                      <span>- BDT {(discount || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between font-bold text-slate-900 border-t border-slate-200 pt-1 text-sm">
                      <span>Net Total:</span>
                      <span className="text-teal-900">BDT {netTotal.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="mt-2 pt-2 border-t border-dashed border-slate-200">
                    <div className="flex justify-between text-emerald-700 font-bold">
                      <span>Paid Amount:</span>
                      <span>BDT {(paidNow || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-rose-700 font-bold text-sm mt-0.5">
                      <span>Due Balance:</span>
                      <span className={calculatedDue > 0 ? 'bg-rose-100 px-1 rounded' : ''}>
                        BDT {calculatedDue.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-bold flex items-center gap-1.5 shadow-md cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  Save Bill & Print Money Receipt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* COLLECT DUE MODAL */}
      {collectDueInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md my-auto overflow-hidden">
            <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-emerald-400" />
                <h3 className="font-bold text-sm">Collect Due Payment</h3>
              </div>
              <button
                onClick={() => {
                  setCollectDueInvoice(null);
                  onClearInitialDue?.();
                }}
                className="p-1 text-slate-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCollectDueSubmit} className="p-5 space-y-4 text-xs">
              <div className="bg-rose-50 p-3 rounded-xl border border-rose-200">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-rose-900">Invoice No: {collectDueInvoice.id}</span>
                  <span className="font-mono text-[10px] text-slate-500">{collectDueInvoice.date}</span>
                </div>
                <div className="mt-1 text-slate-700">
                  <strong>Patient:</strong> {collectDueInvoice.patientName} ({collectDueInvoice.patientId})
                </div>
                <div className="flex justify-between items-center mt-2 pt-2 border-t border-rose-200/80 font-mono">
                  <span>Total Outstanding Due:</span>
                  <span className="text-base font-black text-rose-700">
                    BDT {collectDueInvoice.dueAmount.toLocaleString()}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">
                  Collection Amount (BDT) *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  max={collectDueInvoice.dueAmount}
                  value={collectAmount}
                  onChange={(e) => setCollectAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono font-bold text-sm"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">
                  Payment Method *
                </label>
                <select
                  value={collectMethod}
                  onChange={(e) => setCollectMethod(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
                >
                  <option value="Cash">Cash</option>
                  <option value="bKash">bKash</option>
                  <option value="Nagad">Nagad</option>
                  <option value="Card">Card</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Full due payment cleared"
                  value={collectNotes}
                  onChange={(e) => setCollectNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    setCollectDueInvoice(null);
                    onClearInitialDue?.();
                  }}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold flex items-center gap-1.5 shadow-md cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Confirm Collection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
