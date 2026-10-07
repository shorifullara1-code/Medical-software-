import React, { useState, useMemo } from 'react';
import {
  Stethoscope,
  Activity,
  PlusCircle,
  Search,
  User,
  Clock,
  Printer,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Receipt,
  Bed,
  MapPin,
  Building,
  ChevronRight,
  Filter,
  DollarSign,
  HeartPulse,
  History,
  FileText,
  Droplet,
} from 'lucide-react';
import {
  Patient,
  Staff,
  LabTestCatalogItem,
  Invoice,
  BillingItem,
  PaymentRecord,
  HospitalSettings,
  Appointment,
  OPDOrder,
} from '../types';

interface OPDViewProps {
  patients: Patient[];
  staff: Staff[];
  testCatalog: LabTestCatalogItem[];
  appointments: Appointment[];
  invoices: Invoice[];
  hospitalSettings: HospitalSettings;
  currentUser: Staff;
  onSaveInvoice: (invoice: Invoice) => void;
  onOpenInvoicePrint: (invoice: Invoice) => void;
  onNavigateToIPDAdmission: (patientId: string) => void;
  onNavigateToPrescription: (patientId: string) => void;
  onOpenPatientHistory: (patientId: string) => void;
}

export const OPDView: React.FC<OPDViewProps> = ({
  patients,
  staff,
  testCatalog,
  appointments,
  invoices,
  hospitalSettings,
  currentUser,
  onSaveInvoice,
  onOpenInvoicePrint,
  onNavigateToIPDAdmission,
  onNavigateToPrescription,
  onOpenPatientHistory,
}) => {
  const [selectedPatientId, setSelectedPatientId] = useState<string>(patients[0]?.id || '');
  const [patientSearch, setPatientSearch] = useState('');
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>(
    staff.find((s) => s.role === 'doctor')?.id || staff[0]?.id || ''
  );

  // OPD Lab Test Selection State
  const [testSearch, setTestSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedTests, setSelectedTests] = useState<LabTestCatalogItem[]>([]);
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'bKash' | 'Nagad' | 'Card'>('Cash');
  const [paidAmountInput, setPaidAmountInput] = useState<number | ''>('');
  const [orderComplaints, setOrderComplaints] = useState('');

  // OPD Vitals Input
  const [opdVitals, setOpdVitals] = useState({
    bp: '120/80',
    pulse: '76',
    temp: '98.6',
    spo2: '99',
    weight: '65',
    rbs: '',
  });

  const doctorsList = useMemo(() => staff.filter((s) => s.role === 'doctor'), [staff]);

  const activePatient = useMemo(
    () => patients.find((p) => p.id === selectedPatientId) || patients[0],
    [patients, selectedPatientId]
  );

  const activeDoctor = useMemo(
    () => staff.find((s) => s.id === selectedDoctorId) || doctorsList[0],
    [staff, selectedDoctorId, doctorsList]
  );

  // Filter Catalog
  const filteredCatalog = useMemo(() => {
    return testCatalog.filter((item) => {
      const matchCat = selectedCategory === 'all' || item.category === selectedCategory;
      const matchSearch =
        !testSearch.trim() ||
        item.name.toLowerCase().includes(testSearch.toLowerCase()) ||
        item.code.toLowerCase().includes(testSearch.toLowerCase()) ||
        (item.roomNo && item.roomNo.includes(testSearch));
      return matchCat && matchSearch;
    });
  }, [testCatalog, selectedCategory, testSearch]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    testCatalog.forEach((t) => set.add(t.category));
    return ['all', ...Array.from(set)];
  }, [testCatalog]);

  // Test Selection toggle
  const toggleTest = (test: LabTestCatalogItem) => {
    if (selectedTests.some((t) => t.id === test.id)) {
      setSelectedTests(selectedTests.filter((t) => t.id !== test.id));
    } else {
      setSelectedTests([...selectedTests, test]);
    }
  };

  const removeTest = (testId: string) => {
    setSelectedTests(selectedTests.filter((t) => t.id !== testId));
  };

  // Calculations for OPD Lab Orders
  const testSubtotal = useMemo(() => {
    return selectedTests.reduce((sum, t) => sum + t.price, 0);
  }, [selectedTests]);

  const totalPayable = Math.max(0, testSubtotal - discountAmount);

  const paidAmount = paidAmountInput === '' ? totalPayable : Number(paidAmountInput);
  const dueAmount = Math.max(0, totalPayable - paidAmount);

  // Patient Search for Quick Selector
  const filteredPatients = useMemo(() => {
    if (!patientSearch.trim()) return patients.slice(0, 8);
    const q = patientSearch.toLowerCase();
    return patients.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.id.toLowerCase().includes(q) ||
        p.phone.includes(q)
    );
  }, [patients, patientSearch]);

  // Handle OPD Test Order & Billing Submission
  const handleCreateOPDTestOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePatient || selectedTests.length === 0) return;

    const invoiceId = `INV-${Date.now().toString().slice(-6)}`;
    const nowStr = new Date().toISOString().slice(0, 10);

    const billingItems: BillingItem[] = selectedTests.map((t) => ({
      id: `ITEM-${Date.now()}-${t.id}`,
      name: t.name,
      category: 'lab_test',
      price: t.price,
      quantity: 1,
      total: t.price,
      roomNo: t.roomNo || '102',
      roomLocation: t.roomLocation || `Room ${t.roomNo || '102'} (${t.floor || '1st Floor'})`,
    }));

    const paymentRecords: PaymentRecord[] =
      paidAmount > 0
        ? [
            {
              id: `PAY-${Date.now()}`,
              date: nowStr,
              amount: paidAmount,
              method: paymentMethod,
              collectedBy: currentUser.name,
              receiptNo: `REC-${Date.now().toString().slice(-4)}`,
              notes: `OPD Lab Investigation Order (${selectedTests.length} tests)`,
            },
          ]
        : [];

    const newInvoice: Invoice = {
      id: invoiceId,
      patientId: activePatient.id,
      patientName: activePatient.name,
      patientPhone: activePatient.phone,
      date: nowStr,
      items: billingItems,
      subtotal: testSubtotal,
      discount: discountAmount,
      total: totalPayable,
      paidAmount: paidAmount,
      dueAmount: dueAmount,
      status: dueAmount === 0 ? 'paid' : paidAmount > 0 ? 'partial' : 'due',
      collectedBy: currentUser.name,
      paymentHistory: paymentRecords,
    };

    onSaveInvoice(newInvoice);
    onOpenInvoicePrint(newInvoice);

    // Reset selection
    setSelectedTests([]);
    setDiscountAmount(0);
    setPaidAmountInput('');
    setOrderComplaints('');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 text-white p-6 rounded-3xl shadow-md border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30 flex items-center gap-1.5">
              <Stethoscope className="w-3.5 h-3.5" />
              OPD Outpatient Department
            </span>
            <span className="text-xs text-slate-400 font-mono">
              {hospitalSettings.name}
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
            OPD Consultation & Diagnostic Test Center
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
            Order all laboratory & diagnostic investigations for outpatient patients, verify room numbers, track OPD tokens, write prescriptions, and seamlessly admit patients to IPD when required.
          </p>
        </div>

        {/* Quick OPD Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={() => onOpenPatientHistory(selectedPatientId)}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer"
          >
            <History className="w-4 h-4 text-teal-400" />
            <span>Check Patient History</span>
          </button>

          <button
            onClick={() => onNavigateToIPDAdmission(selectedPatientId)}
            className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md transition-all cursor-pointer"
          >
            <Bed className="w-4 h-4" />
            <span>Admit to IPD (Indoor)</span>
          </button>
        </div>
      </div>

      {/* Main OPD Workspace: 2-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (5 Cols): Patient Selector, Vitals & Consultation Notes */}
        <div className="lg:col-span-5 space-y-6">
          {/* Patient Selection Card */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                <User className="w-4 h-4 text-teal-600" />
                Select OPD Patient
              </h3>
              <button
                onClick={() => onOpenPatientHistory(selectedPatientId)}
                className="text-[11px] font-bold text-teal-700 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <History className="w-3.5 h-3.5" />
                <span>View Full Medical History</span>
              </button>
            </div>

            {/* Quick Search */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search patient by name, ID or phone..."
                value={patientSearch}
                onChange={(e) => setPatientSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-500"
              />
            </div>

            {/* Patient Pills Selector */}
            <div className="max-h-36 overflow-y-auto space-y-1 pr-1 divide-y divide-slate-100">
              {filteredPatients.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setSelectedPatientId(p.id)}
                  className={`w-full p-2 rounded-xl text-left text-xs transition-colors cursor-pointer flex items-center justify-between ${
                    p.id === selectedPatientId
                      ? 'bg-teal-50/80 border border-teal-200 text-teal-950 font-bold'
                      : 'hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-teal-100 text-teal-800 font-bold text-xs flex items-center justify-center shrink-0">
                      {p.name.charAt(0)}
                    </div>
                    <div>
                      <span className="block leading-tight">{p.name}</span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {p.phone} • {p.age} Yrs
                      </span>
                    </div>
                  </div>
                  <span className="font-mono text-[10px] text-teal-700">{p.id}</span>
                </button>
              ))}
            </div>

            {/* Selected Patient Banner */}
            {activePatient && (
              <div className="p-3.5 bg-gradient-to-r from-teal-50 to-emerald-50 rounded-xl border border-teal-200 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-xs">{activePatient.name}</span>
                  <span className="font-mono text-xs font-bold text-teal-800">{activePatient.id}</span>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-600">
                  <span>Age: {activePatient.age} Yrs</span>
                  <span>•</span>
                  <span>Gender: {activePatient.gender}</span>
                  <span>•</span>
                  <span className="font-bold text-rose-600 flex items-center gap-0.5">
                    <Droplet className="w-3 h-3 fill-rose-500" />
                    {activePatient.bloodGroup}
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 truncate">Address: {activePatient.address}</p>
              </div>
            )}
          </div>

          {/* OPD Doctor & Vitals Entry */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2 border-b border-slate-100 pb-2">
              <HeartPulse className="w-4 h-4 text-rose-600" />
              OPD Doctor & Patient Vitals
            </h3>

            {/* Doctor Selector */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                Consultant Doctor
              </label>
              <select
                value={selectedDoctorId}
                onChange={(e) => setSelectedDoctorId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-500"
              >
                {doctorsList.map((doc) => (
                  <option key={doc.id} value={doc.id}>
                    {doc.name} — {doc.specialization} ({doc.roomNo || 'OPD Chamber'})
                  </option>
                ))}
              </select>
            </div>

            {/* Vitals Grid */}
            <div className="grid grid-cols-3 gap-2.5">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-0.5">BP (mmHg)</label>
                <input
                  type="text"
                  value={opdVitals.bp}
                  onChange={(e) => setOpdVitals({ ...opdVitals, bp: e.target.value })}
                  placeholder="120/80"
                  className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs font-mono"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Pulse (bpm)</label>
                <input
                  type="text"
                  value={opdVitals.pulse}
                  onChange={(e) => setOpdVitals({ ...opdVitals, pulse: e.target.value })}
                  placeholder="76"
                  className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs font-mono"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Temp (°F)</label>
                <input
                  type="text"
                  value={opdVitals.temp}
                  onChange={(e) => setOpdVitals({ ...opdVitals, temp: e.target.value })}
                  placeholder="98.6"
                  className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs font-mono"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-0.5">SpO2 (%)</label>
                <input
                  type="text"
                  value={opdVitals.spo2}
                  onChange={(e) => setOpdVitals({ ...opdVitals, spo2: e.target.value })}
                  placeholder="99"
                  className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs font-mono"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Weight (kg)</label>
                <input
                  type="text"
                  value={opdVitals.weight}
                  onChange={(e) => setOpdVitals({ ...opdVitals, weight: e.target.value })}
                  placeholder="68"
                  className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs font-mono"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-0.5">RBS (mmol/L)</label>
                <input
                  type="text"
                  value={opdVitals.rbs}
                  onChange={(e) => setOpdVitals({ ...opdVitals, rbs: e.target.value })}
                  placeholder="6.5"
                  className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs font-mono"
                />
              </div>
            </div>

            {/* Quick OPD Shortcuts */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => onNavigateToPrescription(selectedPatientId)}
                className="flex-1 py-2 px-3 bg-teal-50 hover:bg-teal-100 text-teal-800 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Write Prescription</span>
              </button>

              <button
                type="button"
                onClick={() => onNavigateToIPDAdmission(selectedPatientId)}
                className="flex-1 py-2 px-3 bg-purple-50 hover:bg-purple-100 text-purple-800 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Bed className="w-3.5 h-3.5" />
                <span>Admit to IPD Bed</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column (7 Cols): All Lab Tests Ordering Center (OPD patients can undergo and order all laboratory tests here) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-teal-600" />
                  OPD Diagnostic & Lab Test Requisition
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Select tests from catalog below. Room numbers and floor locations will automatically appear.
                </p>
              </div>

              <span className="px-2.5 py-1 rounded-lg bg-teal-50 text-teal-800 font-bold text-xs border border-teal-200">
                {selectedTests.length} Tests Selected
              </span>
            </div>

            {/* Catalog Filters: Category Tabs + Search */}
            <div className="space-y-3">
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 rounded-lg font-bold capitalize whitespace-nowrap transition-all cursor-pointer ${
                      selectedCategory === cat
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {cat === 'all' ? 'All Categories' : cat}
                  </button>
                ))}
              </div>

              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search test name, code or room number..."
                  value={testSearch}
                  onChange={(e) => setTestSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            {/* Test Catalog Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-64 overflow-y-auto pr-1">
              {filteredCatalog.map((test) => {
                const isSelected = selectedTests.some((t) => t.id === test.id);
                return (
                  <div
                    key={test.id}
                    onClick={() => toggleTest(test)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'bg-teal-50/80 border-teal-500 shadow-2xs'
                        : 'bg-white hover:bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-[10px] text-slate-400 font-bold">{test.code}</span>
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-slate-100 text-slate-600">
                            {test.category}
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-slate-900 leading-snug mt-0.5">{test.name}</h4>
                      </div>
                      <span className="font-mono font-bold text-teal-800 text-xs shrink-0">
                        ${test.price.toLocaleString()}
                      </span>
                    </div>

                    {/* Room & Floor Indicator Badge */}
                    <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                      <span className="px-2 py-0.5 rounded bg-red-50 text-red-700 font-bold font-mono text-[10px] border border-red-200">
                        Room {test.roomNo || '102'}
                      </span>
                      <span className="text-slate-500 text-[10px] truncate">
                        {test.roomLocation || `${test.floor || '1st Floor'} Lab`}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Selected Tests Summary Box & Red Room Allocation Preview */}
            {selectedTests.length > 0 && (
              <div className="space-y-4 pt-2 border-t border-slate-200">
                <div className="border-2 border-red-500 rounded-xl p-3 bg-red-50/20 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-red-900">
                    <span className="flex items-center gap-1.5">
                      <Building className="w-4 h-4 text-red-600" />
                      Automatic Test Room Guide (Left-to-Right Serial)
                    </span>
                    <span className="text-[10px] font-mono text-red-700">{selectedTests.length} Tests</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {selectedTests.map((t, idx) => (
                      <div
                        key={t.id}
                        className="bg-white border border-red-200 rounded-lg p-2 text-xs flex flex-col justify-between shadow-2xs relative group"
                      >
                        <div className="flex items-start justify-between gap-1">
                          <span className="font-bold text-slate-900 text-[11px] line-clamp-1">
                            {idx + 1}. {t.name}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeTest(t.id);
                            }}
                            className="text-slate-400 hover:text-rose-600 text-[10px] font-bold"
                          >
                            ×
                          </button>
                        </div>
                        <div className="mt-1 flex items-center justify-between text-[10px]">
                          <span className="font-mono font-bold text-red-700 bg-red-50 px-1.5 py-0.2 rounded border border-red-200">
                            Room {t.roomNo || '102'}
                          </span>
                          <span className="font-mono font-bold text-slate-700">${t.price}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Billing & Payment Form */}
                <form onSubmit={handleCreateOPDTestOrder} className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase font-bold">Subtotal:</span>
                      <span className="text-base font-black font-mono text-slate-900">${testSubtotal.toLocaleString()}</span>
                    </div>

                    <div>
                      <label className="text-slate-500 block text-[10px] uppercase font-bold mb-0.5">Discount ($):</label>
                      <input
                        type="number"
                        min="0"
                        max={testSubtotal}
                        value={discountAmount || ''}
                        onChange={(e) => setDiscountAmount(Number(e.target.value) || 0)}
                        placeholder="0"
                        className="w-full px-2.5 py-1 bg-white border border-slate-300 rounded-lg text-xs font-mono"
                      />
                    </div>

                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase font-bold">Net Payable:</span>
                      <span className="text-base font-black font-mono text-teal-800">${totalPayable.toLocaleString()}</span>
                    </div>

                    <div>
                      <label className="text-slate-500 block text-[10px] uppercase font-bold mb-0.5">Payment Method:</label>
                      <select
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value as any)}
                        className="w-full px-2.5 py-1 bg-white border border-slate-300 rounded-lg text-xs font-semibold"
                      >
                        <option value="Cash">Cash</option>
                        <option value="bKash">bKash</option>
                        <option value="Nagad">Nagad</option>
                        <option value="Card">Card</option>
                      </select>
                    </div>
                  </div>

                  <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200">
                    <div className="flex items-center gap-3 text-xs">
                      <div>
                        <label className="text-slate-500 text-[10px] uppercase font-bold mr-2">Paid Amount ($):</label>
                        <input
                          type="number"
                          min="0"
                          max={totalPayable}
                          value={paidAmountInput}
                          onChange={(e) => setPaidAmountInput(e.target.value === '' ? '' : Number(e.target.value))}
                          placeholder={totalPayable.toString()}
                          className="w-24 px-2.5 py-1 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold"
                        />
                      </div>
                      {dueAmount > 0 && (
                        <span className="font-mono text-xs font-bold text-rose-600">
                          Due: ${dueAmount.toLocaleString()}
                        </span>
                      )}
                    </div>

                    <button
                      type="submit"
                      className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
                    >
                      <Receipt className="w-4 h-4" />
                      <span>Generate OPD Test Bill & Print Receipt</span>
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
