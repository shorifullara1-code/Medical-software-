import React, { useState, useMemo } from 'react';
import {
  Bed,
  PlusCircle,
  Search,
  User,
  Clock,
  Printer,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Receipt,
  Building,
  HeartPulse,
  Activity,
  FileText,
  ShieldCheck,
  Stethoscope,
  LogOut,
  History,
  Trash2,
  ChevronRight,
  Filter,
  X,
  DoorOpen,
  Layers,
  Lock,
  Pill,
  CreditCard,
  Ban,
} from 'lucide-react';
import {
  IPDAdmission,
  HospitalBed,
  Patient,
  Staff,
  Invoice,
  BillingItem,
  PaymentRecord,
  HospitalSettings,
  DischargeSummary,
  MedicineItem,
  WardType,
  PharmacySale,
} from '../types';
import { calculate24HourBedRent, getWardRate } from '../utils/bedRentBilling';

interface IPDViewProps {
  admissions: IPDAdmission[];
  beds: HospitalBed[];
  patients: Patient[];
  staff: Staff[];
  hospitalSettings: HospitalSettings;
  currentUser: Staff;
  pharmacySales?: PharmacySale[];
  invoices?: Invoice[];
  preselectedPatientId?: string | null;
  onAddAdmission: (admission: IPDAdmission, updatedBeds: HospitalBed[]) => void;
  onDischargeAdmission: (
    admissionId: string,
    dischargeSummary: DischargeSummary,
    updatedBeds: HospitalBed[],
    finalInvoice?: Invoice
  ) => void;
  onSettlePharmacyCredit?: (patientId: string) => void;
  onAddVitals: (admissionId: string, vitals: any) => void;
  onAddDoctorNote: (admissionId: string, note: any) => void;
  onOpenDischargeSummaryPrint: (summary: DischargeSummary) => void;
  onOpenPatientHistory: (patientId: string) => void;
  onOpenInvoicePrint: (invoice: Invoice) => void;
  onOpenAdmissionSlipPrint: (admission: IPDAdmission) => void;
}

export const IPDView: React.FC<IPDViewProps> = ({
  admissions,
  beds,
  patients,
  staff,
  hospitalSettings,
  currentUser,
  pharmacySales = [],
  invoices = [],
  preselectedPatientId,
  onAddAdmission,
  onDischargeAdmission,
  onSettlePharmacyCredit,
  onAddVitals,
  onAddDoctorNote,
  onOpenDischargeSummaryPrint,
  onOpenPatientHistory,
  onOpenInvoicePrint,
  onOpenAdmissionSlipPrint,
}) => {
  const [activeTab, setActiveTab] = useState<'active' | 'beds' | 'discharged'>('active');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWardFilter, setSelectedWardFilter] = useState<string>('all');
  const [bedDirectoryViewMode, setBedDirectoryViewMode] = useState<'rooms' | 'grid'>('rooms');

  // Modals state
  const [isAdmissionModalOpen, setIsAdmissionModalOpen] = useState(false);
  const [dischargingAdmission, setDischargingAdmission] = useState<IPDAdmission | null>(null);
  const [vitalsModalAdmission, setVitalsModalAdmission] = useState<IPDAdmission | null>(null);
  const [doctorNoteModalAdmission, setDoctorNoteModalAdmission] = useState<IPDAdmission | null>(null);

  // New Admission Form State
  const [admPatientId, setAdmPatientId] = useState<string>(preselectedPatientId || patients[0]?.id || '');
  const [admBedId, setAdmBedId] = useState<string>('');
  const [admDoctorId, setAdmDoctorId] = useState<string>(
    staff.find((s) => s.role === 'doctor')?.id || staff[0]?.id || ''
  );
  const [admDiagnosis, setAdmDiagnosis] = useState('');
  const [admAdvancePayment, setAdmAdvancePayment] = useState<number>(0);
  const [bedStatusFilter, setBedStatusFilter] = useState<'all' | 'available' | 'occupied'>('all');
  const [bedWardFilter, setBedWardFilter] = useState<string>('all');
  const [bedSearchQuery, setBedSearchQuery] = useState<string>('');

  // Admission Modal Bed Selection State
  const [admissionBedFilterWard, setAdmissionBedFilterWard] = useState<string>('all');
  const [admissionBedViewTab, setAdmissionBedViewTab] = useState<'available' | 'all'>('available');
  const [admissionBedSearch, setAdmissionBedSearch] = useState<string>('');

  // Auto-open admission modal if preselectedPatientId is provided
  React.useEffect(() => {
    if (preselectedPatientId) {
      setAdmPatientId(preselectedPatientId);
      setIsAdmissionModalOpen(true);
    }
  }, [preselectedPatientId]);

  // Discharge Form State
  const [dischargeCondition, setDischargeCondition] = useState<
    'Recovered' | 'Clinically Improved' | 'Stable' | 'Referred' | 'Discharged on Request (DORB)'
  >('Clinically Improved');
  const [dischargeFinalDiagnosis, setDischargeFinalDiagnosis] = useState('');
  const [dischargeComplaints, setDischargeComplaints] = useState('');
  const [dischargeClinicalSummary, setDischargeClinicalSummary] = useState('');
  const [dischargeProcedures, setDischargeProcedures] = useState('');
  const [dischargeInvestigations, setDischargeInvestigations] = useState('');
  const [dischargeFollowUpAdvice, setDischargeFollowUpAdvice] = useState('');
  const [dischargeNextVisitDate, setDischargeNextVisitDate] = useState('');
  const [dischargeEmergencyInstructions, setDischargeEmergencyInstructions] = useState('');
  const [dischargeDietaryAdvice, setDischargeDietaryAdvice] = useState('');
  const [dischargeMedicines, setDischargeMedicines] = useState<MedicineItem[]>([
    { name: '', dosage: '1+0+1', duration: '7 Days', instruction: 'After meal' },
  ]);

  // Discharge Settlement & Clearance State
  const [dischargePaymentMethod, setDischargePaymentMethod] = useState<'Cash' | 'bKash' | 'Nagad' | 'Card'>('Cash');
  const [dischargeSettlementConfirmed, setDischargeSettlementConfirmed] = useState(true);
  const [dischargeBlockWarning, setDischargeBlockWarning] = useState<string | null>(null);

  // Vitals recording form
  const [newVitals, setNewVitals] = useState({
    bp: '120/80',
    pulse: '76',
    temp: '98.6',
    spo2: '99',
    rbs: '',
  });

  // Doctor Note recording form
  const [newDoctorNote, setNewDoctorNote] = useState({
    note: '',
    orders: '',
  });

  const doctorsList = useMemo(() => staff.filter((s) => s.role === 'doctor'), [staff]);
  const availableBeds = useMemo(() => beds.filter((b) => !b.isOccupied), [beds]);

  const activeAdmissions = useMemo(() => admissions.filter((a) => a.status === 'admitted'), [admissions]);
  const dischargedAdmissions = useMemo(() => admissions.filter((a) => a.status === 'discharged'), [admissions]);

  // Bed statistics
  const bedStats = useMemo(() => {
    const total = beds.length;
    const occupied = beds.filter((b) => b.isOccupied).length;
    const vacant = total - occupied;
    const icuTotal = beds.filter((b) => b.wardType === 'ICU' || b.wardType === 'CCU').length;
    const icuOccupied = beds.filter((b) => (b.wardType === 'ICU' || b.wardType === 'CCU') && b.isOccupied).length;
    const occupancyRate = total > 0 ? Math.round((occupied / total) * 100) : 0;
    return { total, occupied, vacant, icuTotal, icuOccupied, occupancyRate };
  }, [beds]);

  // Filtered active admissions
  const filteredActive = useMemo(() => {
    return activeAdmissions.filter((adm) => {
      const matchWard = selectedWardFilter === 'all' || adm.wardType === selectedWardFilter;
      const q = searchQuery.toLowerCase();
      const matchSearch =
        !q ||
        adm.patientName.toLowerCase().includes(q) ||
        adm.patientId.toLowerCase().includes(q) ||
        adm.bedNumber.toLowerCase().includes(q) ||
        adm.admissionDiagnosis.toLowerCase().includes(q);
      return matchWard && matchSearch;
    });
  }, [activeAdmissions, selectedWardFilter, searchQuery]);

  // Bed Directory Filtered Beds (Tab 2)
  const filteredBeds = useMemo(() => {
    return beds.filter((b) => {
      const matchWard = bedWardFilter === 'all' || b.wardType === bedWardFilter;
      const matchStatus =
        bedStatusFilter === 'all' ||
        (bedStatusFilter === 'available' && !b.isOccupied) ||
        (bedStatusFilter === 'occupied' && b.isOccupied);
      const q = (bedSearchQuery || searchQuery).toLowerCase();
      const matchSearch =
        !q ||
        b.bedNumber.toLowerCase().includes(q) ||
        (b.roomNumber && b.roomNumber.toLowerCase().includes(q)) ||
        b.floor.toLowerCase().includes(q) ||
        (b.currentPatientName && b.currentPatientName.toLowerCase().includes(q)) ||
        (b.currentPatientId && b.currentPatientId.toLowerCase().includes(q)) ||
        (b.admissionDiagnosis && b.admissionDiagnosis.toLowerCase().includes(q)) ||
        (b.admittingDoctorName && b.admittingDoctorName.toLowerCase().includes(q));
      return matchWard && matchStatus && matchSearch;
    });
  }, [beds, bedWardFilter, bedStatusFilter, bedSearchQuery, searchQuery]);

  // Group filtered beds by room for Tab 2
  const roomsGrouped = useMemo(() => {
    const map = new Map<string, { roomName: string; wardType: string; floor: string; beds: HospitalBed[] }>();
    filteredBeds.forEach((b) => {
      const roomKey = b.roomNumber || `${b.wardType} - Room`;
      if (!map.has(roomKey)) {
        map.set(roomKey, {
          roomName: roomKey,
          wardType: b.wardType,
          floor: b.floor,
          beds: [],
        });
      }
      map.get(roomKey)!.beds.push(b);
    });
    return Array.from(map.values());
  }, [filteredBeds]);

  // Admission Modal Beds
  const modalFilteredBeds = useMemo(() => {
    return beds.filter((b) => {
      if (admissionBedViewTab === 'available' && b.isOccupied) return false;
      const matchWard = admissionBedFilterWard === 'all' || b.wardType === admissionBedFilterWard;
      const q = admissionBedSearch.toLowerCase();
      const matchSearch =
        !q ||
        b.bedNumber.toLowerCase().includes(q) ||
        (b.roomNumber && b.roomNumber.toLowerCase().includes(q)) ||
        b.floor.toLowerCase().includes(q) ||
        (b.currentPatientName && b.currentPatientName.toLowerCase().includes(q));
      return matchWard && matchSearch;
    });
  }, [beds, admissionBedViewTab, admissionBedFilterWard, admissionBedSearch]);

  const modalRoomsGrouped = useMemo(() => {
    const map = new Map<string, { roomName: string; wardType: string; floor: string; beds: HospitalBed[] }>();
    modalFilteredBeds.forEach((b) => {
      const roomKey = b.roomNumber || `${b.wardType} - Room`;
      if (!map.has(roomKey)) {
        map.set(roomKey, {
          roomName: roomKey,
          wardType: b.wardType,
          floor: b.floor,
          beds: [],
        });
      }
      map.get(roomKey)!.beds.push(b);
    });
    return Array.from(map.values());
  }, [modalFilteredBeds]);

  // Discharge Financials Memo (Bed Rent + Pharmacy Credit Dues + Other Dues)
  const dischargeFinancials = useMemo(() => {
    if (!dischargingAdmission) return null;
    const accrual = calculate24HourBedRent(dischargingAdmission);
    const stayDays = accrual.stayDays;
    const totalBedCharges = accrual.totalAccruedBedRent;
    const advanceDeposit = dischargingAdmission.advancePayment || 0;
    const netBedRentDue = Math.max(0, totalBedCharges - advanceDeposit);

    // Unpaid pharmacy credit dues for this patient
    const patientMedSales = (pharmacySales || []).filter(
      (s) => s.patientId === dischargingAdmission.patientId && (s.dueAmount || 0) > 0
    );
    const totalPharmacyDue = patientMedSales.reduce((sum, s) => sum + (s.dueAmount || 0), 0);

    // Other unpaid invoices for this patient
    const patientInvs = (invoices || []).filter(
      (i) => i.patientId === dischargingAdmission.patientId && (i.dueAmount || 0) > 0
    );
    const totalInvoiceDue = patientInvs.reduce((sum, i) => sum + (i.dueAmount || 0), 0);

    const grandTotalDue = netBedRentDue + totalPharmacyDue + totalInvoiceDue;

    return {
      stayDays,
      dailyRate: accrual.dailyBedCharge,
      totalBedCharges,
      advanceDeposit,
      netBedRentDue,
      patientMedSales,
      totalPharmacyDue,
      patientInvs,
      totalInvoiceDue,
      grandTotalDue,
    };
  }, [dischargingAdmission, pharmacySales, invoices]);

  // Helper to open discharge modal with prefilled data
  const handleOpenDischargeModal = (adm: IPDAdmission) => {
    setDischargingAdmission(adm);
    setDischargeFinalDiagnosis(adm.admissionDiagnosis);
    setDischargeComplaints('Admitted with acute symptoms; now stabilized.');
    setDischargeClinicalSummary(
      `Patient was admitted on ${adm.admittedAt} under ${adm.admittingDoctorName} for ${adm.admissionDiagnosis}. Managed conservatively with IV fluids, medications and supportive care. Condition responded well to treatment.`
    );
    setDischargeProcedures('Routine inpatient nursing care, continuous vitals monitoring, medication administration and conservative management.');
    setDischargeInvestigations('Routine blood investigations reviewed. Vital signs normalized.');
    setDischargeFollowUpAdvice('Continue prescribed discharge medications. Rest at home and follow proper nutrition and hydration.');
    const d = new Date();
    d.setDate(d.getDate() + 7);
    setDischargeNextVisitDate(d.toISOString().slice(0, 10));
    setDischargeEmergencyInstructions('Seek immediate hospital care if fever exceeds 102°F, breathing difficulty or severe pain recurs.');
    setDischargeDietaryAdvice('Normal balanced diet with adequate hydration.');
    setDischargeMedicines([
      { name: 'Tab. Paracetamol 500mg', dosage: '1+1+1', duration: '3 Days', instruction: 'After meal' },
      { name: 'Cap. Omeprazole 20mg', dosage: '1+0+1', duration: '7 Days', instruction: 'Before meal' },
    ]);
    setDischargePaymentMethod('Cash');
    setDischargeSettlementConfirmed(true);
    setDischargeBlockWarning(null);
  };

  // Medicine items handlers in discharge modal
  const addDischargeMedicineRow = () => {
    setDischargeMedicines([
      ...dischargeMedicines,
      { name: '', dosage: '1+0+1', duration: '7 Days', instruction: 'After meal' },
    ]);
  };

  const removeDischargeMedicineRow = (index: number) => {
    setDischargeMedicines(dischargeMedicines.filter((_, i) => i !== index));
  };

  const updateDischargeMedicineRow = (index: number, field: keyof MedicineItem, value: string) => {
    const updated = [...dischargeMedicines];
    updated[index] = { ...updated[index], [field]: value };
    setDischargeMedicines(updated);
  };

  // Submit Admission
  const handleAdmissionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const patient = patients.find((p) => p.id === admPatientId);
    const bed = beds.find((b) => b.id === admBedId);
    const doctor = staff.find((s) => s.id === admDoctorId);

    if (!patient || !bed || !doctor) return;

    const admissionId = `IPD-${Date.now().toString().slice(-6)}`;
    const nowStr = new Date().toLocaleString();

    const newAdmission: IPDAdmission = {
      id: admissionId,
      patientId: patient.id,
      patientName: patient.name,
      patientPhone: patient.phone,
      patientAge: patient.age,
      patientGender: patient.gender,
      patientBloodGroup: patient.bloodGroup,
      admittedAt: nowStr,
      admittingDoctorId: doctor.id,
      admittingDoctorName: doctor.name,
      admittingDepartment: doctor.department,
      bedId: bed.id,
      bedNumber: bed.bedNumber,
      wardType: bed.wardType,
      dailyBedCharge: bed.dailyRate,
      admissionDiagnosis: admDiagnosis || 'Inpatient Evaluation & Care',
      status: 'admitted',
      advancePayment: admAdvancePayment,
      vitalsHistory: [
        {
          id: `VIT-${Date.now()}`,
          date: nowStr,
          bp: '120/80',
          pulse: '76',
          temp: '98.6',
          spo2: '99%',
          recordedBy: currentUser.name,
        },
      ],
      doctorNotes: [
        {
          id: `NOTE-${Date.now()}`,
          date: nowStr,
          doctorName: doctor.name,
          note: `Patient admitted to ${bed.bedNumber} for ${admDiagnosis}. Initial treatment initiated.`,
          orders: 'Bed rest, routine vitals monitoring, IV access, routine labs.',
        },
      ],
    };

    // Update bed to occupied
    const updatedBeds = beds.map((b) =>
      b.id === bed.id
        ? {
            ...b,
            isOccupied: true,
            currentPatientId: patient.id,
            currentPatientName: patient.name,
            currentAdmissionId: admissionId,
            admittedAt: nowStr,
            admissionDiagnosis: admDiagnosis || 'Inpatient Evaluation & Care',
            admittingDoctorName: doctor.name,
          }
        : b
    );

    onAddAdmission(newAdmission, updatedBeds);
    setIsAdmissionModalOpen(false);
    setAdmDiagnosis('');
    setAdmAdvancePayment(0);

    // Immediately trigger official printable Admission Slip!
    onOpenAdmissionSlipPrint(newAdmission);
  };

  // Submit Discharge Workflow
  const handleDischargeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dischargingAdmission) return;

    const dischargeId = `DIS-${Date.now().toString().slice(-6)}`;
    const nowStr = new Date().toISOString().slice(0, 10);
    const nowDateTime = new Date().toLocaleString();

    // Calculate exact 24-hour cycle duration of stay in days
    const accrual = calculate24HourBedRent(dischargingAdmission);
    const stayDays = accrual.stayDays;
    const totalBedCharges = accrual.totalAccruedBedRent;

    const summary: DischargeSummary = {
      id: dischargeId,
      admissionId: dischargingAdmission.id,
      patientId: dischargingAdmission.patientId,
      patientName: dischargingAdmission.patientName,
      patientAge: dischargingAdmission.patientAge,
      patientGender: dischargingAdmission.patientGender,
      patientPhone: dischargingAdmission.patientPhone,
      admissionDate: dischargingAdmission.admittedAt.split(' ')[0] || nowStr,
      dischargeDate: nowStr,
      durationOfStayDays: stayDays,
      bedNumber: dischargingAdmission.bedNumber,
      wardType: dischargingAdmission.wardType,
      consultantName: dischargingAdmission.admittingDoctorName,
      consultantSpecialty: dischargingAdmission.admittingDepartment,
      finalDiagnosis: dischargeFinalDiagnosis || dischargingAdmission.admissionDiagnosis,
      chiefComplaints: dischargeComplaints,
      clinicalSummary: dischargeClinicalSummary,
      proceduresDone: dischargeProcedures,
      investigationsSummary: dischargeInvestigations,
      conditionAtDischarge: dischargeCondition,
      dischargeMedicines: dischargeMedicines.filter((m) => m.name.trim()),
      followUpAdvice: dischargeFollowUpAdvice,
      nextVisitDate: dischargeNextVisitDate,
      emergencyInstructions: dischargeEmergencyInstructions,
      dietaryAdvice: dischargeDietaryAdvice,
      totalBedCharges,
      generatedBy: currentUser.name,
      generatedAt: nowDateTime,
    };

    // Strict Due Check: "কোনো বকেয়া থাকলে যেন সে ডিসচার্জ পেপার না দেওয়া হয় এটা যেন সিস্টেমে ইনপুট থাকে"
    if (dischargeFinancials && dischargeFinancials.grandTotalDue > 0) {
      if (!dischargeSettlementConfirmed) {
        setDischargeBlockWarning(
          `বকেয়া পরিশোধ না করা পর্যন্ত ডিসচার্জ পেপার প্রদান করা যাবে না। রোগীর মোট বকেয়া BDT ${dischargeFinancials.grandTotalDue.toLocaleString()} সম্পূর্ণ পরিশোধ সাপেক্ষে ডিসচার্জ পেপার ইস্যু করুন।`
        );
        return;
      }
    }

    // Free up the bed
    const updatedBeds = beds.map((b) =>
      b.id === dischargingAdmission.bedId
        ? {
            ...b,
            isOccupied: false,
            currentPatientId: undefined,
            currentPatientName: undefined,
            currentAdmissionId: undefined,
            admittedAt: undefined,
            admissionDiagnosis: undefined,
            admittingDoctorName: undefined,
          }
        : b
    );

    // Create final Bed & Clearance Billing Invoice
    const invoiceId = `INV-DIS-${Date.now().toString().slice(-6)}`;
    const invoiceItems: BillingItem[] = [
      {
        id: `ITEM-BED-${Date.now()}`,
        name: `Inpatient Bed Charge: ${dischargingAdmission.bedNumber} (${dischargingAdmission.wardType}) - ${stayDays} Days`,
        category: 'bed',
        price: dischargingAdmission.dailyBedCharge,
        quantity: stayDays,
        total: totalBedCharges,
      },
    ];

    if (dischargeFinancials && dischargeFinancials.totalPharmacyDue > 0) {
      invoiceItems.push({
        id: `ITEM-PHARM-${Date.now()}`,
        name: `Inpatient Pharmacy Medicine Credit Settlement (${dischargeFinancials.patientMedSales.length} bills)`,
        category: 'medicine',
        price: dischargeFinancials.totalPharmacyDue,
        quantity: 1,
        total: dischargeFinancials.totalPharmacyDue,
      });
    }

    const totalInvoiceBill = totalBedCharges + (dischargeFinancials?.totalPharmacyDue || 0);
    const advancePaid = dischargingAdmission.advancePayment || 0;
    const finalSettlementAmount = Math.max(0, totalInvoiceBill - advancePaid);

    const bedInvoice: Invoice = {
      id: invoiceId,
      patientId: dischargingAdmission.patientId,
      patientName: dischargingAdmission.patientName,
      patientPhone: dischargingAdmission.patientPhone,
      date: nowStr,
      items: invoiceItems,
      subtotal: totalInvoiceBill,
      discount: advancePaid,
      total: finalSettlementAmount,
      paidAmount: finalSettlementAmount, // Settled upon discharge clearance (advance adjusted)
      dueAmount: 0,
      status: 'paid',
      collectedBy: currentUser.name,
      paymentHistory: [
        ...(finalSettlementAmount > 0
          ? [
              {
                id: `PAY-DIS-${Date.now()}`,
                date: nowStr,
                amount: finalSettlementAmount,
                method: dischargePaymentMethod,
                collectedBy: currentUser.name,
                receiptNo: `REC-DIS-${dischargeId}`,
                notes: `Discharge final dues clearance after advance deposit adjustment (${dischargePaymentMethod})`,
              },
            ]
          : []),
      ],
    };

    // Mark pharmacy credit sales for this patient as cleared
    if (onSettlePharmacyCredit) {
      onSettlePharmacyCredit(dischargingAdmission.patientId);
    }

    onDischargeAdmission(dischargingAdmission.id, summary, updatedBeds, bedInvoice);
    setDischargingAdmission(null);

    // Immediately trigger official printable discharge summary preview!
    onOpenDischargeSummaryPrint(summary);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-purple-950 to-slate-900 text-white p-6 rounded-3xl shadow-md border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-1.5">
              <Bed className="w-3.5 h-3.5" />
              IPD Inpatient Department & Ward System
            </span>
            <span className="text-xs text-slate-400 font-mono">
              {hospitalSettings.name}
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
            Indoor Admissions, Bed Management & Discharge Center
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
            Manage hospital bed occupancies, monitor active inpatients, record doctor rounds & vitals, execute patient discharge, and automatically generate official printable Discharge Summaries.
          </p>
        </div>

        {/* Action Button */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            onClick={() => {
              if (availableBeds.length > 0) {
                setAdmBedId(availableBeds[0].id);
              }
              setIsAdmissionModalOpen(true);
            }}
            className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-purple-600/30 transition-all cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Admit New Patient to IPD</span>
          </button>
        </div>
      </div>

      {/* 4 Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Hospital Beds</span>
            <h3 className="text-2xl font-black font-mono text-slate-900 mt-1">{bedStats.total}</h3>
            <span className="text-[11px] text-slate-400 font-medium">All wards & cabins</span>
          </div>
          <div className="p-3 rounded-2xl bg-slate-100 text-slate-700">
            <Building className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-purple-700">Occupied Beds (Admitted)</span>
            <h3 className="text-2xl font-black font-mono text-purple-700 mt-1">{bedStats.occupied}</h3>
            <span className="text-[11px] text-purple-600 font-bold">{bedStats.occupancyRate}% Occupancy Rate</span>
          </div>
          <div className="p-3 rounded-2xl bg-purple-50 text-purple-600">
            <Bed className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">Available / Vacant Beds</span>
            <h3 className="text-2xl font-black font-mono text-emerald-700 mt-1">{bedStats.vacant}</h3>
            <span className="text-[11px] text-emerald-600 font-medium">Ready for admission</span>
          </div>
          <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-600">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-rose-700">ICU / CCU Critical Beds</span>
            <h3 className="text-2xl font-black font-mono text-rose-700 mt-1">
              {bedStats.icuOccupied} / {bedStats.icuTotal}
            </h3>
            <span className="text-[11px] text-rose-600 font-medium">Critical care status</span>
          </div>
          <div className="p-3 rounded-2xl bg-rose-50 text-rose-600">
            <HeartPulse className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Tabs Bar: Active Inpatients / Bed Map / Discharged History */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl w-full md:w-auto">
          <button
            onClick={() => setActiveTab('active')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'active'
                ? 'bg-white text-purple-950 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Active Inpatients ({activeAdmissions.length})
          </button>
          <button
            onClick={() => setActiveTab('beds')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'beds'
                ? 'bg-white text-purple-950 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Ward & Bed Directory ({beds.length})
          </button>
          <button
            onClick={() => setActiveTab('discharged')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'discharged'
                ? 'bg-white text-purple-950 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Discharge Summaries Archive ({dischargedAdmissions.length})
          </button>
        </div>

        {/* Search & Ward Filter */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-56">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search inpatient or bed..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>
      </div>

      {/* TAB 1: ACTIVE INPATIENTS */}
      {activeTab === 'active' && (
        <div className="space-y-4">
          {filteredActive.length === 0 ? (
            <div className="py-16 text-center bg-white rounded-3xl border border-slate-200 text-slate-400 space-y-2">
              <Bed className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-sm font-semibold text-slate-600">No active admitted inpatients matching filter.</p>
              <button
                onClick={() => setIsAdmissionModalOpen(true)}
                className="mt-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Admit Patient to Bed</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredActive.map((adm) => {
                const accrual = calculate24HourBedRent(adm);

                return (
                  <div
                    key={adm.id}
                    className="bg-white rounded-2xl border-2 border-purple-200 hover:border-purple-400 p-5 shadow-xs flex flex-col justify-between space-y-4 transition-all"
                  >
                    <div>
                      {/* Top Header: Bed Badge & Stay Days */}
                      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-1 rounded-lg bg-purple-100 text-purple-900 font-mono font-black text-xs border border-purple-200">
                            {adm.bedNumber}
                          </span>
                          <span className="text-[11px] font-bold text-slate-500">{adm.wardType}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-900 border border-purple-200 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-purple-700" />
                            <span>Cycle Day {accrual.currentCycleDay}</span>
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            Admitted
                          </span>
                        </div>
                      </div>

                      {/* Patient Information */}
                      <div className="mt-3 space-y-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-base text-slate-900">{adm.patientName}</h4>
                          <span className="font-mono text-[10px] text-teal-700 bg-teal-50 px-2 py-0.5 rounded">
                            {adm.patientId}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500">
                          {adm.patientAge} Yrs • {adm.patientGender} • Blood: <strong className="text-rose-600">{adm.patientBloodGroup || 'N/A'}</strong>
                        </p>
                        <p className="text-xs text-slate-600 font-mono">{adm.patientPhone}</p>
                      </div>

                      {/* 24-Hour Bed Rent Accrual Live Box */}
                      <div className="mt-3 p-3 bg-gradient-to-br from-indigo-50/70 via-purple-50/50 to-white rounded-xl border border-indigo-200/80 space-y-2">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-bold text-indigo-950 flex items-center gap-1">
                            <Receipt className="w-3.5 h-3.5 text-indigo-700" />
                            <span>24h Bed Rent Status (২৪ ঘণ্টা সাইকেল)</span>
                          </span>
                          <span className="font-mono text-[10px] text-slate-600 font-semibold">
                            BDT {accrual.dailyBedCharge}/Day
                          </span>
                        </div>

                        {/* Progress bar in current 24-hour cycle */}
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[10px] text-slate-500">
                            <span>Stayed: <strong>{Math.floor(accrual.elapsedHours)}h</strong> ({accrual.stayDays} Day Billing)</span>
                            <span className="text-indigo-800 font-semibold">{Math.floor(accrual.timeRemainingInCycleHours)}h until Day {accrual.stayDays + 1}</span>
                          </div>
                          <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                            <div
                              className="bg-indigo-600 h-full rounded-full transition-all"
                              style={{ width: `${accrual.cycleProgressPercent}%` }}
                            />
                          </div>
                        </div>

                        {/* Financial figures */}
                        <div className="grid grid-cols-3 gap-1.5 pt-1.5 border-t border-indigo-100 text-center text-xs">
                          <div className="p-1 bg-white rounded-lg border border-slate-100">
                            <span className="text-[9px] text-slate-400 block font-bold uppercase">Accrued Rent</span>
                            <span className="font-mono font-bold text-slate-900">BDT {accrual.totalAccruedBedRent.toLocaleString()}</span>
                          </div>
                          <div className="p-1 bg-white rounded-lg border border-slate-100">
                            <span className="text-[9px] text-slate-400 block font-bold uppercase">Advance Paid</span>
                            <span className="font-mono font-bold text-emerald-700">BDT {accrual.advanceDeposit.toLocaleString()}</span>
                          </div>
                          <div className={`p-1 rounded-lg border ${accrual.netBedRentDue > 0 ? 'bg-rose-50 border-rose-200 text-rose-700' : 'bg-emerald-50 border-emerald-200 text-emerald-800'}`}>
                            <span className="text-[9px] block font-bold uppercase">Net Bed Due</span>
                            <span className="font-mono font-bold">BDT {accrual.netBedRentDue.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>

                      {/* Diagnosis & Admitting Doctor */}
                      <div className="mt-3 p-2.5 bg-slate-50 rounded-xl border border-slate-200/80 text-xs space-y-1">
                        <span className="text-[10px] uppercase font-bold text-slate-500 block">Admission Diagnosis</span>
                        <p className="font-semibold text-slate-900 line-clamp-2">{adm.admissionDiagnosis}</p>
                        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                          <span>Doctor: <strong>{adm.admittingDoctorName}</strong></span>
                          <span className="font-mono text-[10px]">{adm.admittedAt}</span>
                        </div>
                      </div>

                      {/* Latest Vitals Snippet */}
                      {adm.vitalsHistory && adm.vitalsHistory.length > 0 && (
                        <div className="mt-2.5 p-2 bg-slate-50 rounded-lg text-[10px] font-mono flex items-center justify-between text-slate-700">
                          <span>Latest Vitals:</span>
                          <span className="font-bold text-slate-900">
                            BP: {adm.vitalsHistory[adm.vitalsHistory.length - 1].bp} • Pulse: {adm.vitalsHistory[adm.vitalsHistory.length - 1].pulse}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Actions Bar */}
                    <div className="pt-3 border-t border-slate-100 space-y-2">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => onOpenAdmissionSlipPrint(adm)}
                          title="Print Official Inpatient Admission Slip"
                          className="py-1.5 px-2.5 bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1"
                        >
                          <Printer className="w-3.5 h-3.5 text-purple-700" />
                          <span>Slip</span>
                        </button>
                        <button
                          onClick={() => setVitalsModalAdmission(adm)}
                          className="flex-1 py-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors cursor-pointer text-center"
                        >
                          + Vitals
                        </button>
                        <button
                          onClick={() => setDoctorNoteModalAdmission(adm)}
                          className="flex-1 py-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors cursor-pointer text-center"
                        >
                          + Doctor Note
                        </button>
                        <button
                          onClick={() => onOpenPatientHistory(adm.patientId)}
                          title="View Full Patient History"
                          className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg cursor-pointer"
                        >
                          <History className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Primary Discharge Button */}
                      <button
                        onClick={() => handleOpenDischargeModal(adm)}
                        className="w-full py-2 bg-purple-700 hover:bg-purple-600 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Discharge & Settle Bill ({accrual.stayDays} Days)</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: WARD & BED DIRECTORY (ROOM-WISE & GRID LAYOUT) */}
      {activeTab === 'beds' && (
        <div className="space-y-5">
          {/* Bed Directory Controls */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
            {/* View Mode & Status Filter */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center bg-slate-100 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setBedDirectoryViewMode('rooms')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    bedDirectoryViewMode === 'rooms'
                      ? 'bg-purple-900 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <DoorOpen className="w-3.5 h-3.5" />
                  <span>Room-Wise View</span>
                </button>
                <button
                  type="button"
                  onClick={() => setBedDirectoryViewMode('grid')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    bedDirectoryViewMode === 'grid'
                      ? 'bg-purple-900 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Grid Matrix</span>
                </button>
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setBedStatusFilter('all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    bedStatusFilter === 'all'
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  All ({beds.length})
                </button>
                <button
                  type="button"
                  onClick={() => setBedStatusFilter('available')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
                    bedStatusFilter === 'available'
                      ? 'bg-emerald-700 text-white shadow-xs'
                      : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Available ({availableBeds.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setBedStatusFilter('occupied')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
                    bedStatusFilter === 'occupied'
                      ? 'bg-purple-700 text-white shadow-xs'
                      : 'bg-purple-50 text-purple-800 hover:bg-purple-100'
                  }`}
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Booked ({beds.filter((b) => b.isOccupied).length})</span>
                </button>
              </div>
            </div>

            {/* Ward Filter & Search */}
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={bedWardFilter}
                onChange={(e) => setBedWardFilter(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-hidden"
              >
                <option value="all">All Wards & Units</option>
                <option value="General Ward">General Ward</option>
                <option value="Male Ward">Male Ward</option>
                <option value="Female Ward">Female Ward</option>
                <option value="Semi-Cabin">Semi-Cabin</option>
                <option value="VIP Cabin">VIP Cabin</option>
                <option value="ICU">ICU (Critical)</option>
                <option value="CCU">CCU (Cardiac)</option>
                <option value="Post-Operative">Post-Operative</option>
              </select>

              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter room, bed, patient..."
                  value={bedSearchQuery}
                  onChange={(e) => setBedSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs w-48 sm:w-56 focus:bg-white focus:outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* VIEW MODE 1: ROOM-WISE LAYOUT */}
          {bedDirectoryViewMode === 'rooms' && (
            <div className="space-y-5">
              {roomsGrouped.length === 0 ? (
                <div className="py-16 text-center bg-white rounded-3xl border border-slate-200 text-slate-400 space-y-2">
                  <DoorOpen className="w-10 h-10 text-slate-300 mx-auto" />
                  <p className="text-sm font-semibold text-slate-600">No rooms or beds matching current filter.</p>
                </div>
              ) : (
                roomsGrouped.map((room) => {
                  const roomTotal = room.beds.length;
                  const roomOccupied = room.beds.filter((b) => b.isOccupied).length;
                  const roomVacant = roomTotal - roomOccupied;

                  return (
                    <div
                      key={room.roomName}
                      className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden"
                    >
                      {/* Room Header */}
                      <div className="px-5 py-3.5 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-300">
                            <DoorOpen className="w-4 h-4" />
                          </div>
                          <div>
                            <h3 className="font-black text-sm text-white tracking-tight flex items-center gap-2">
                              <span>{room.roomName}</span>
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                                {room.wardType}
                              </span>
                            </h3>
                            <p className="text-[11px] text-slate-400 font-medium">{room.floor}</p>
                          </div>
                        </div>

                        {/* Occupancy Indicator */}
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-bold border ${
                              roomOccupied === roomTotal
                                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                                : roomOccupied > 0
                                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                                : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                            }`}
                          >
                            {roomOccupied === roomTotal
                              ? `All ${roomTotal} Beds Booked`
                              : `${roomVacant} Vacant, ${roomOccupied} Booked`}
                          </span>
                        </div>
                      </div>

                      {/* Beds within Room */}
                      <div className="p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {room.beds.map((b) => {
                          const activeAdm = admissions.find((a) => a.bedId === b.id && a.status === 'admitted');

                          return (
                            <div
                              key={b.id}
                              className={`p-4 rounded-xl border-2 transition-all flex flex-col justify-between ${
                                b.isOccupied
                                  ? 'bg-purple-50/50 border-purple-300'
                                  : 'bg-slate-50/50 border-slate-200 hover:border-emerald-400 hover:bg-white'
                              }`}
                            >
                              <div>
                                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                                  <span className="font-mono font-black text-sm text-slate-900">{b.bedNumber}</span>
                                  <span
                                    className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 ${
                                      b.isOccupied
                                        ? 'bg-purple-200 text-purple-900 border border-purple-300'
                                        : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                    }`}
                                  >
                                    {b.isOccupied ? (
                                      <>
                                        <Lock className="w-3 h-3 text-purple-700" />
                                        <span>Booked</span>
                                      </>
                                    ) : (
                                      <>
                                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                        <span>Available</span>
                                      </>
                                    )}
                                  </span>
                                </div>

                                <div className="mt-2.5 space-y-1.5 text-xs">
                                  <div className="flex items-center justify-between text-slate-600">
                                    <span className="text-[11px] font-medium text-slate-500">Daily Charge:</span>
                                    <span className="font-mono font-bold text-teal-800">${b.dailyRate} / day</span>
                                  </div>

                                  {/* Patient Inpatient Card */}
                                  {b.isOccupied ? (
                                    <div className="mt-2 p-2.5 bg-white rounded-xl border border-purple-200 space-y-1.5 text-xs">
                                      <div className="flex items-center justify-between">
                                        <span className="text-[9px] uppercase font-bold text-purple-800">
                                          Admitted Inpatient
                                        </span>
                                        <span className="font-mono text-[9px] font-bold text-teal-700 bg-teal-50 px-1.5 py-0.2 rounded">
                                          {b.currentPatientId}
                                        </span>
                                      </div>
                                      <p className="font-black text-slate-900 text-xs">
                                        {b.currentPatientName || 'Admitted Patient'}
                                      </p>
                                      {b.admissionDiagnosis && (
                                        <p className="text-[10px] text-slate-600 italic line-clamp-1">
                                          {b.admissionDiagnosis}
                                        </p>
                                      )}
                                      {b.admittingDoctorName && (
                                        <p className="text-[10px] text-slate-500">
                                          Doctor: {b.admittingDoctorName}
                                        </p>
                                      )}
                                      {b.admittedAt && (
                                        <p className="text-[9px] text-slate-400 font-mono">
                                          Admitted: {b.admittedAt}
                                        </p>
                                      )}
                                    </div>
                                  ) : (
                                    <div className="mt-2 p-2.5 bg-emerald-50/70 rounded-xl border border-emerald-200 text-emerald-800 text-[11px] font-semibold flex items-center gap-1.5">
                                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                      <span>Vacant • Ready for admission</span>
                                    </div>
                                  )}

                                  {/* Features */}
                                  {b.features && b.features.length > 0 && (
                                    <div className="pt-1.5 flex flex-wrap gap-1">
                                      {b.features.map((feat, i) => (
                                        <span
                                          key={i}
                                          className="px-1.5 py-0.5 rounded bg-white border border-slate-200 text-[9px] text-slate-600"
                                        >
                                          {feat}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Bed Actions */}
                              <div className="mt-3 pt-2.5 border-t border-slate-200 flex items-center justify-between gap-2">
                                {b.isOccupied ? (
                                  <>
                                    {activeAdm && (
                                      <div className="flex items-center gap-1 w-full">
                                        <button
                                          type="button"
                                          onClick={() => setVitalsModalAdmission(activeAdm)}
                                          className="flex-1 py-1 px-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10px] font-bold text-center cursor-pointer"
                                        >
                                          + Vitals
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => setDoctorNoteModalAdmission(activeAdm)}
                                          className="flex-1 py-1 px-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10px] font-bold text-center cursor-pointer"
                                        >
                                          + Note
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => handleOpenDischargeModal(activeAdm)}
                                          className="flex-1 py-1 px-1.5 bg-purple-700 hover:bg-purple-600 text-white rounded-lg text-[10px] font-bold text-center cursor-pointer"
                                        >
                                          Discharge
                                        </button>
                                      </div>
                                    )}
                                  </>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setAdmBedId(b.id);
                                      setIsAdmissionModalOpen(true);
                                    }}
                                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                                  >
                                    <PlusCircle className="w-3.5 h-3.5" />
                                    <span>Admit Patient to this Bed</span>
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* VIEW MODE 2: GRID VIEW */}
          {bedDirectoryViewMode === 'grid' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredBeds.map((bed) => {
                const activeAdm = admissions.find((a) => a.bedId === bed.id && a.status === 'admitted');

                return (
                  <div
                    key={bed.id}
                    className={`p-4 rounded-2xl border-2 transition-all flex flex-col justify-between ${
                      bed.isOccupied
                        ? 'bg-purple-50/40 border-purple-300'
                        : 'bg-white border-slate-200 hover:border-emerald-400'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                        <span className="font-mono font-black text-sm text-slate-900">{bed.bedNumber}</span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            bed.isOccupied ? 'bg-purple-200 text-purple-900' : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {bed.isOccupied ? 'Booked' : 'Available'}
                        </span>
                      </div>

                      <div className="mt-2.5 space-y-1 text-xs">
                        <p className="font-bold text-slate-800">{bed.roomNumber || bed.wardType}</p>
                        <p className="text-[11px] text-slate-500">{bed.floor}</p>
                        <p className="font-mono font-bold text-teal-800 text-xs">${bed.dailyRate} / day</p>

                        {bed.isOccupied && bed.currentPatientName && (
                          <div className="mt-2 p-2 bg-white rounded-lg border border-purple-200 space-y-0.5">
                            <span className="text-[9px] uppercase font-bold text-purple-800 block">Current Inpatient</span>
                            <p className="font-bold text-slate-900 text-xs truncate">{bed.currentPatientName}</p>
                            <span className="font-mono text-[10px] text-slate-500">{bed.currentPatientId}</span>
                          </div>
                        )}

                        {bed.features && (
                          <div className="pt-2 flex flex-wrap gap-1 text-[9px] text-slate-500">
                            {bed.features.map((f, i) => (
                              <span key={i} className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200">
                                {f}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-100">
                      {bed.isOccupied ? (
                        activeAdm ? (
                          <button
                            type="button"
                            onClick={() => handleOpenDischargeModal(activeAdm)}
                            className="w-full py-1.5 bg-purple-700 hover:bg-purple-600 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                          >
                            Discharge Inpatient
                          </button>
                        ) : (
                          <span className="text-[10px] text-slate-400 italic block text-center">Occupied</span>
                        )
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setAdmBedId(bed.id);
                            setIsAdmissionModalOpen(true);
                          }}
                          className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                        >
                          Admit to this Bed
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: DISCHARGE SUMMARIES ARCHIVE */}
      {activeTab === 'discharged' && (
        <div className="space-y-4">
          {dischargedAdmissions.length === 0 ? (
            <div className="py-16 text-center bg-white rounded-3xl border border-slate-200 text-slate-400 space-y-2">
              <FileText className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-sm font-semibold text-slate-600">No discharged patient summaries recorded yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {dischargedAdmissions.map((adm) => (
                <div
                  key={adm.id}
                  className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between space-y-4"
                >
                  <div>
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                          {adm.dischargeSummary?.id || adm.id}
                        </span>
                        <span className="font-bold text-xs text-slate-900">{adm.bedNumber} ({adm.wardType})</span>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800">
                        Discharged ✓
                      </span>
                    </div>

                    <div className="mt-3 space-y-1">
                      <h4 className="font-bold text-sm text-slate-900">{adm.patientName}</h4>
                      <p className="text-xs text-slate-500">
                        Stay: <strong>{adm.dischargeSummary?.durationOfStayDays || 1} Days</strong> • {adm.dischargeSummary?.admissionDate} to {adm.dischargeSummary?.dischargeDate}
                      </p>
                      <p className="text-xs text-slate-700 mt-1">
                        <strong>Final Diagnosis:</strong> {adm.dischargeSummary?.finalDiagnosis || adm.admissionDiagnosis}
                      </p>
                      <p className="text-xs text-slate-600">Consultant: {adm.admittingDoctorName}</p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <button
                      onClick={() => onOpenPatientHistory(adm.patientId)}
                      className="text-xs font-bold text-teal-700 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <History className="w-3.5 h-3.5" />
                      <span>Full History</span>
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onOpenAdmissionSlipPrint(adm)}
                        className="px-3 py-2 bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                        title="Print Original Admission Slip"
                      >
                        <Printer className="w-3.5 h-3.5 text-purple-700" />
                        <span>Admission Slip</span>
                      </button>

                      {adm.dischargeSummary && (
                        <button
                          onClick={() => onOpenDischargeSummaryPrint(adm.dischargeSummary!)}
                          className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>Print Summary</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: NEW IPD ADMISSION WITH ROOM-WISE BED SELECTOR */}
      {/* ========================================================================= */}
      {isAdmissionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/70 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-300 w-full max-w-4xl my-auto p-6 sm:p-8 space-y-6 max-h-[92vh] overflow-y-auto animate-fadeIn">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-purple-100 text-purple-700">
                  <Bed className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">New Inpatient (IPD) Admission</h3>
                  <p className="text-[11px] text-slate-500">
                    Allocate hospital bed from room inventory and register indoor clinical admission
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAdmissionModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAdmissionSubmit} className="space-y-5">
              {/* Patient & Doctor Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Select Inpatient *</label>
                  <select
                    required
                    value={admPatientId}
                    onChange={(e) => setAdmPatientId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900"
                  >
                    {patients.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.id}) — {p.phone} • {p.age} Yrs ({p.gender})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Admitting Consultant *</label>
                  <select
                    required
                    value={admDoctorId}
                    onChange={(e) => setAdmDoctorId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900"
                  >
                    {doctorsList.map((doc) => (
                      <option key={doc.id} value={doc.id}>
                        {doc.name} ({doc.specialization})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* ROOM-WISE BED SELECTION SECTION (KEY USER REQUIREMENT) */}
              <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2.5 pb-2.5 border-b border-slate-200">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                      <DoorOpen className="w-4 h-4 text-purple-700" />
                      <span>Select Hospital Bed (Room-Wise Layout) *</span>
                    </span>
                  </div>

                  {/* Filter & View Tabs */}
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Available Only vs All Toggle */}
                    <div className="flex items-center bg-white p-0.5 rounded-xl border border-slate-200 text-[11px] font-bold">
                      <button
                        type="button"
                        onClick={() => setAdmissionBedViewTab('available')}
                        className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                          admissionBedViewTab === 'available'
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Available Only ({availableBeds.length})</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setAdmissionBedViewTab('all')}
                        className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                          admissionBedViewTab === 'all'
                            ? 'bg-purple-900 text-white shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <Layers className="w-3 h-3" />
                        <span>All Hospital Beds ({beds.length})</span>
                      </button>
                    </div>

                    {/* Ward filter */}
                    <select
                      value={admissionBedFilterWard}
                      onChange={(e) => setAdmissionBedFilterWard(e.target.value)}
                      className="px-2.5 py-1 bg-white border border-slate-200 rounded-xl text-[11px] font-semibold text-slate-700"
                    >
                      <option value="all">All Wards</option>
                      <option value="General Ward">General Ward</option>
                      <option value="Male Ward">Male Ward</option>
                      <option value="Female Ward">Female Ward</option>
                      <option value="Semi-Cabin">Semi-Cabin</option>
                      <option value="VIP Cabin">VIP Cabin</option>
                      <option value="ICU">ICU</option>
                      <option value="CCU">CCU</option>
                      <option value="Post-Operative">Post-Op</option>
                    </select>

                    {/* Search */}
                    <div className="relative">
                      <Search className="w-3 h-3 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Search room/bed..."
                        value={admissionBedSearch}
                        onChange={(e) => setAdmissionBedSearch(e.target.value)}
                        className="pl-7 pr-2.5 py-1 bg-white border border-slate-200 rounded-xl text-[11px] w-32 sm:w-40"
                      />
                    </div>
                  </div>
                </div>

                {/* All beds full warning */}
                {availableBeds.length === 0 && (
                  <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl text-amber-900 text-xs font-semibold flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>
                      Notice: All {beds.length} hospital beds are currently occupied! You must discharge a patient or add new beds in Hospital Settings.
                    </span>
                  </div>
                )}

                {/* Room-Wise Bed Cards Grid */}
                <div className="max-h-64 overflow-y-auto space-y-3.5 pr-1">
                  {modalRoomsGrouped.length === 0 ? (
                    <div className="py-8 text-center text-slate-400 text-xs">
                      No beds found matching the filter criteria.
                    </div>
                  ) : (
                    modalRoomsGrouped.map((room) => (
                      <div key={room.roomName} className="bg-white rounded-xl border border-slate-200 p-3 space-y-2.5 shadow-2xs">
                        <div className="flex items-center justify-between text-xs pb-1.5 border-b border-slate-100">
                          <div className="flex items-center gap-2">
                            <DoorOpen className="w-3.5 h-3.5 text-purple-600" />
                            <span className="font-bold text-slate-900">{room.roomName}</span>
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-slate-100 text-slate-600">
                              {room.wardType}
                            </span>
                            <span className="text-[10px] text-slate-400">{room.floor}</span>
                          </div>
                          <span className="text-[10px] font-bold text-slate-500">
                            {room.beds.filter((b) => !b.isOccupied).length} of {room.beds.length} Available
                          </span>
                        </div>

                        {/* Beds in Room */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                          {room.beds.map((b) => {
                            const isSelected = admBedId === b.id;

                            if (b.isOccupied) {
                              // BOOKED BED: Clearly disabled so staff NEVER waste time or double book!
                              return (
                                <div
                                  key={b.id}
                                  className="p-2.5 rounded-xl border border-slate-200 bg-slate-100/80 text-slate-400 cursor-not-allowed select-none opacity-80"
                                  title={`Bed ${b.bedNumber} is currently occupied by ${b.currentPatientName}. Cannot be selected until discharged.`}
                                >
                                  <div className="flex items-center justify-between pb-1 border-b border-slate-200">
                                    <span className="font-mono font-bold text-xs text-slate-600">{b.bedNumber}</span>
                                    <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-rose-100 text-rose-700 border border-rose-200 flex items-center gap-1">
                                      <Lock className="w-2.5 h-2.5 text-rose-600" />
                                      <span>BOOKED</span>
                                    </span>
                                  </div>
                                  <div className="mt-1.5 text-[10px] space-y-0.5">
                                    <p className="font-bold text-slate-700 truncate">
                                      Patient: {b.currentPatientName || 'Inpatient'}
                                    </p>
                                    <p className="font-mono text-slate-500 text-[9px]">{b.currentPatientId}</p>
                                    <p className="text-[9px] text-rose-600 font-semibold italic">
                                      Occupied • Discharge in IPD to vacate
                                    </p>
                                  </div>
                                </div>
                              );
                            }

                            // AVAILABLE BED: Clickable to select!
                            return (
                              <button
                                key={b.id}
                                type="button"
                                onClick={() => setAdmBedId(b.id)}
                                className={`p-2.5 text-left rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                                  isSelected
                                    ? 'bg-purple-50 border-purple-600 shadow-sm ring-2 ring-purple-600/30'
                                    : 'bg-white border-emerald-300 hover:border-emerald-500 hover:bg-emerald-50/40'
                                }`}
                              >
                                <div>
                                  <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                                    <span className="font-mono font-black text-xs text-slate-900">{b.bedNumber}</span>
                                    <span
                                      className={`px-1.5 py-0.5 rounded text-[9px] font-bold flex items-center gap-1 ${
                                        isSelected
                                          ? 'bg-purple-600 text-white'
                                          : 'bg-emerald-100 text-emerald-800'
                                      }`}
                                    >
                                      {isSelected ? '✓ SELECTED' : '🟢 AVAILABLE'}
                                    </span>
                                  </div>

                                  <div className="mt-1.5 text-[10px] space-y-0.5">
                                    <p className="font-mono font-bold text-teal-800">${b.dailyRate} / day</p>
                                    {b.features && b.features[0] && (
                                      <p className="text-slate-500 text-[9px] truncate">• {b.features.slice(0, 2).join(', ')}</p>
                                    )}
                                  </div>
                                </div>

                                <div className="mt-1 pt-1 border-t border-slate-100 text-[9px] font-bold text-right text-purple-700">
                                  {isSelected ? 'Click to change' : 'Click to select bed'}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Selected Bed Highlight Banner */}
                {admBedId ? (
                  (() => {
                    const sel = beds.find((b) => b.id === admBedId);
                    return sel ? (
                      <div className="p-2.5 bg-purple-100/80 border border-purple-300 rounded-xl text-purple-950 text-xs flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-purple-700 shrink-0" />
                          <span>
                            Selected: <strong>{sel.bedNumber}</strong> in <strong>{sel.roomNumber}</strong> ({sel.wardType}, {sel.floor}) • Daily Rate: <strong>${sel.dailyRate}/day</strong>
                          </span>
                        </div>
                        <span className="text-[10px] font-bold text-purple-800 font-mono shrink-0">
                          Ready for Patient
                        </span>
                      </div>
                    ) : null;
                  })()
                ) : (
                  <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Please click on any green <strong>AVAILABLE</strong> bed above to allocate it.</span>
                  </div>
                )}
              </div>

              {/* Admission Diagnosis */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Admission Diagnosis & Clinical Notes *
                </label>
                <textarea
                  required
                  rows={2}
                  value={admDiagnosis}
                  onChange={(e) => setAdmDiagnosis(e.target.value)}
                  placeholder="e.g. Acute appendicitis / Severe pneumonia / Uncontrolled diabetes with dehydration..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
                />
              </div>

              {/* Advance Payment */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Advance Admission Deposit ($)
                </label>
                <input
                  type="number"
                  min="0"
                  value={admAdvancePayment || ''}
                  onChange={(e) => setAdmAdvancePayment(Number(e.target.value) || 0)}
                  placeholder="0"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsAdmissionModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!admBedId}
                  className="px-5 py-2.5 bg-purple-700 hover:bg-purple-600 disabled:opacity-50 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Confirm IPD Admission & Allocate Bed</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: DISCHARGE PATIENT & CREATE DISCHARGE SUMMARY (KEY REQUIREMENT) */}
      {/* ========================================================================= */}
      {dischargingAdmission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-300 w-full max-w-4xl my-auto p-6 sm:p-8 space-y-6 max-h-[92vh] overflow-y-auto animate-fadeIn">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-2xl bg-purple-100 text-purple-700">
                  <LogOut className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-slate-900">
                    Discharge Inpatient & Generate Discharge Summary
                  </h3>
                  <p className="text-xs text-slate-500">
                    Patient: <strong>{dischargingAdmission.patientName}</strong> ({dischargingAdmission.patientId}) • Bed: {dischargingAdmission.bedNumber}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setDischargingAdmission(null)}
                className="p-2 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleDischargeSubmit} className="space-y-5">
              {/* Condition at discharge & Final Diagnosis */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Condition on Discharge *
                  </label>
                  <select
                    value={dischargeCondition}
                    onChange={(e) => setDischargeCondition(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900"
                  >
                    <option value="Clinically Improved">Clinically Improved</option>
                    <option value="Recovered">Recovered / Cured</option>
                    <option value="Stable">Stable</option>
                    <option value="Referred">Referred to Higher Center</option>
                    <option value="Discharged on Request (DORB)">Discharged on Request (DORB / DAMA)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Final Clinical Diagnosis *
                  </label>
                  <input
                    type="text"
                    required
                    value={dischargeFinalDiagnosis}
                    onChange={(e) => setDischargeFinalDiagnosis(e.target.value)}
                    placeholder="e.g. Acute Gastroenteritis, resolved; Type 2 Diabetes, controlled"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900"
                  />
                </div>
              </div>

              {/* Chief Complaints & Clinical Course */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Presenting Complaints & History on Admission
                </label>
                <input
                  type="text"
                  value={dischargeComplaints}
                  onChange={(e) => setDischargeComplaints(e.target.value)}
                  placeholder="e.g. High fever, productive cough, and shortness of breath for 4 days"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Hospital Course & Summary of Treatment *
                </label>
                <textarea
                  required
                  rows={3}
                  value={dischargeClinicalSummary}
                  onChange={(e) => setDischargeClinicalSummary(e.target.value)}
                  placeholder="Detail the patient's hospital stay, medications administered, response to therapy..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              {/* Procedures & Investigations */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Procedures & Interventions Performed
                  </label>
                  <input
                    type="text"
                    value={dischargeProcedures}
                    onChange={(e) => setDischargeProcedures(e.target.value)}
                    placeholder="e.g. IV Cannulation, Continuous nebulization, Chest physiotherapy..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Key Diagnostic Lab Results Summary
                  </label>
                  <input
                    type="text"
                    value={dischargeInvestigations}
                    onChange={(e) => setDischargeInvestigations(e.target.value)}
                    placeholder="e.g. CBC: Hb 12.2, WBC normalized; Chest X-ray clear; S. Creatinine 0.9"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
              </div>

              {/* Discharge Medications Prescription Table */}
              <div className="space-y-2.5 pt-2 border-t border-slate-200">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                    <span className="text-base font-serif font-black text-teal-800 leading-none">℞</span>
                    Discharge Medications to be Continued at Home
                  </label>
                  <button
                    type="button"
                    onClick={addDischargeMedicineRow}
                    className="px-2.5 py-1 bg-teal-50 hover:bg-teal-100 text-teal-800 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>Add Medicine</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {dischargeMedicines.map((med, idx) => (
                    <div key={idx} className="flex flex-wrap sm:flex-nowrap items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200">
                      <input
                        type="text"
                        placeholder="Medicine name & strength (e.g. Tab. Cefixime 200mg)"
                        value={med.name}
                        onChange={(e) => updateDischargeMedicineRow(idx, 'name', e.target.value)}
                        className="flex-2 px-2.5 py-1 bg-white border border-slate-300 rounded-lg text-xs font-semibold"
                      />
                      <input
                        type="text"
                        placeholder="Dosage (1+0+1)"
                        value={med.dosage}
                        onChange={(e) => updateDischargeMedicineRow(idx, 'dosage', e.target.value)}
                        className="w-24 px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs font-mono"
                      />
                      <input
                        type="text"
                        placeholder="Duration (7 Days)"
                        value={med.duration}
                        onChange={(e) => updateDischargeMedicineRow(idx, 'duration', e.target.value)}
                        className="w-24 px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs"
                      />
                      <input
                        type="text"
                        placeholder="Instruction (After meal)"
                        value={med.instruction}
                        onChange={(e) => updateDischargeMedicineRow(idx, 'instruction', e.target.value)}
                        className="flex-1 px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs"
                      />
                      {dischargeMedicines.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeDischargeMedicineRow(idx)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Follow-up Plan & Emergency Warning */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-200">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Follow-up Instructions & Next Visit Date
                  </label>
                  <textarea
                    rows={2}
                    value={dischargeFollowUpAdvice}
                    onChange={(e) => setDischargeFollowUpAdvice(e.target.value)}
                    placeholder="Visit OPD for stitches removal / follow-up evaluation in 7 days..."
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs mb-2"
                  />
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-slate-600">Review Date:</span>
                    <input
                      type="date"
                      value={dischargeNextVisitDate}
                      onChange={(e) => setDischargeNextVisitDate(e.target.value)}
                      className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Emergency Warning Signs (Danger Signs)
                  </label>
                  <textarea
                    rows={2}
                    value={dischargeEmergencyInstructions}
                    onChange={(e) => setDischargeEmergencyInstructions(e.target.value)}
                    placeholder="Seek emergency care if high fever, severe breathlessness or acute pain occurs..."
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs mb-2"
                  />
                  <input
                    type="text"
                    value={dischargeDietaryAdvice}
                    onChange={(e) => setDischargeDietaryAdvice(e.target.value)}
                    placeholder="Diet advice (e.g. Low sodium, high protein, plenty of water...)"
                    className="w-full px-3 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
              </div>

              {/* Discharge Billing, Pharmacy Medicine Credit & Final Settlement Gate */}
              {dischargeFinancials && (
                <div className="p-4 bg-gradient-to-r from-purple-50 via-slate-50 to-indigo-50 rounded-2xl border-2 border-purple-200 text-xs space-y-3.5">
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-purple-200">
                    <div className="flex items-center gap-2">
                      <Receipt className="w-4 h-4 text-purple-700" />
                      <span className="font-black text-purple-950 text-sm">
                        Discharge Billing Clearance & Dues Settlement (ডিসচার্জের সময় বকেয়া পরিশোধ)
                      </span>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full bg-purple-200 text-purple-950 font-bold font-mono text-[11px]">
                      {dischargeFinancials.stayDays} Days Stayed
                    </span>
                  </div>

                  {/* 3 Financial Pillars: Bed Rent, Pharmacy Medicine Credit, Other Invoices */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {/* 1. Bed Rent */}
                    <div className="bg-white p-3 rounded-xl border border-purple-200 space-y-1">
                      <span className="text-[10px] text-purple-900 font-bold uppercase tracking-wider block flex items-center gap-1">
                        <Bed className="w-3.5 h-3.5 text-purple-700" />
                        1. Bed Rent Dues
                      </span>
                      <div className="text-slate-600 text-[11px] flex justify-between">
                        <span>Total Bed Charge:</span>
                        <span className="font-mono font-bold text-slate-900">BDT {dischargeFinancials.totalBedCharges.toLocaleString()}</span>
                      </div>
                      <div className="text-emerald-700 text-[11px] flex justify-between">
                        <span>Advance Adjusted:</span>
                        <span className="font-mono font-bold">- BDT {dischargeFinancials.advanceDeposit.toLocaleString()}</span>
                      </div>
                      <div className="pt-1 border-t border-slate-100 flex justify-between font-bold text-xs text-purple-950">
                        <span>Net Bed Due:</span>
                        <span className="font-mono font-black">BDT {dischargeFinancials.netBedRentDue.toLocaleString()}</span>
                      </div>
                    </div>

                    {/* 2. Pharmacy Medicine Credit */}
                    <div className="bg-white p-3 rounded-xl border border-purple-200 space-y-1">
                      <span className="text-[10px] text-teal-900 font-bold uppercase tracking-wider block flex items-center gap-1">
                        <Pill className="w-3.5 h-3.5 text-teal-700" />
                        2. Pharmacy Medicine Credit
                      </span>
                      <div className="text-slate-600 text-[11px] flex justify-between">
                        <span>Credit Dispensing Bills:</span>
                        <span className="font-mono font-bold text-slate-900">{dischargeFinancials.patientMedSales.length} times</span>
                      </div>
                      <div className="text-slate-500 text-[10px] truncate">
                        {dischargeFinancials.patientMedSales.length > 0
                          ? dischargeFinancials.patientMedSales.map((s) => s.items.map((i) => i.medicineName).join(', ')).join(' • ')
                          : 'No medicine taken on credit'}
                      </div>
                      <div className="pt-1 border-t border-slate-100 flex justify-between font-bold text-xs text-rose-700">
                        <span>Medicine Due (বাকি):</span>
                        <span className="font-mono font-black">BDT {dischargeFinancials.totalPharmacyDue.toLocaleString()}</span>
                      </div>
                    </div>

                    {/* 3. Other Invoices / Lab Dues */}
                    <div className="bg-white p-3 rounded-xl border border-purple-200 space-y-1">
                      <span className="text-[10px] text-slate-700 font-bold uppercase tracking-wider block flex items-center gap-1">
                        <FileText className="w-3.5 h-3.5 text-slate-600" />
                        3. Lab & Other Invoices
                      </span>
                      <div className="text-slate-600 text-[11px] flex justify-between">
                        <span>Unpaid OPD/Lab Bills:</span>
                        <span className="font-mono font-bold text-slate-900">{dischargeFinancials.patientInvs.length} bills</span>
                      </div>
                      <div className="pt-1 border-t border-slate-100 flex justify-between font-bold text-xs text-slate-900">
                        <span>Invoice Due:</span>
                        <span className="font-mono font-black">BDT {dischargeFinancials.totalInvoiceDue.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Grand Total Settlement Banner */}
                  <div className={`p-3.5 rounded-xl border-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                    dischargeFinancials.grandTotalDue > 0
                      ? 'bg-rose-50 border-rose-300 text-rose-950'
                      : 'bg-emerald-50 border-emerald-300 text-emerald-950'
                  }`}>
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider block">
                        Grand Total Discharge Dues Payable (সর্বমোট বকেয়া পাওনা)
                      </span>
                      <p className="text-xs text-slate-600 mt-0.5">
                        {dischargeFinancials.grandTotalDue > 0
                          ? 'ডিসচার্জ পেপার ইস্যু করার জন্য নিচের পেমেন্ট গেটের মাধ্যমে বকেয়া পরিশোধ নিশ্চিত করুন।'
                          : 'সকল পাওনা পরিশোধিত। ডিসচার্জ সার্টিফিকেট প্রস্তুত।'}
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="font-mono font-black text-xl text-rose-700 block">
                        BDT {dischargeFinancials.grandTotalDue.toLocaleString()}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {dischargeFinancials.grandTotalDue > 0 ? 'Due Balance to Clear' : 'Paid in Full'}
                      </span>
                    </div>
                  </div>

                  {/* Settlement Payment Gate Controls */}
                  {dischargeFinancials.grandTotalDue > 0 && (
                    <div className="p-3.5 bg-white rounded-xl border border-slate-300 space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <label className="text-xs font-bold text-slate-900 uppercase flex items-center gap-1.5">
                          <CreditCard className="w-4 h-4 text-purple-700" />
                          <span>Select Payment Method to Settle Dues (বকেয়া আদায়ের মাধ্যম) *</span>
                        </label>

                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={dischargeSettlementConfirmed}
                            onChange={(e) => {
                              setDischargeSettlementConfirmed(e.target.checked);
                              setDischargeBlockWarning(null);
                            }}
                            className="rounded text-purple-600 focus:ring-purple-500 w-4 h-4"
                          />
                          <span className="text-xs font-bold text-slate-800">
                            Clear and collect BDT {dischargeFinancials.grandTotalDue.toLocaleString()} now
                          </span>
                        </label>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {(['Cash', 'bKash', 'Nagad', 'Card'] as const).map((method) => (
                          <button
                            key={method}
                            type="button"
                            onClick={() => setDischargePaymentMethod(method)}
                            className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                              dischargePaymentMethod === method
                                ? 'bg-purple-900 text-white border-purple-900 shadow-xs'
                                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            {method}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Warning if blocked */}
                  {dischargeBlockWarning && (
                    <div className="p-3 bg-rose-100 border border-rose-400 rounded-xl text-xs font-bold text-rose-900 flex items-center gap-2 animate-pulse">
                      <AlertTriangle className="w-4 h-4 text-rose-700 shrink-0" />
                      <span>{dischargeBlockWarning}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Submit Button */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setDischargingAdmission(null)}
                  className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-purple-700 hover:bg-purple-600 text-white font-bold rounded-xl text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-purple-700/20 cursor-pointer transition-all"
                >
                  <FileText className="w-4 h-4" />
                  <span>
                    {dischargeFinancials && dischargeFinancials.grandTotalDue > 0
                      ? `Settle BDT ${dischargeFinancials.grandTotalDue.toLocaleString()} & Issue Discharge Paper`
                      : 'Generate Discharge Summary & Print Certificate'}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: ADD INPATIENT VITALS */}
      {/* ========================================================================= */}
      {vitalsModalAdmission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl border border-slate-300 space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="font-bold text-sm text-slate-900">Record Inpatient Vitals</h3>
              <button onClick={() => setVitalsModalAdmission(null)}>
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>
            <p className="text-xs text-slate-500">
              Patient: <strong>{vitalsModalAdmission.patientName}</strong> ({vitalsModalAdmission.bedNumber})
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-0.5">BP (mmHg)</label>
                <input
                  type="text"
                  value={newVitals.bp}
                  onChange={(e) => setNewVitals({ ...newVitals, bp: e.target.value })}
                  className="w-full p-2 border rounded-lg font-mono text-xs"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Pulse (bpm)</label>
                <input
                  type="text"
                  value={newVitals.pulse}
                  onChange={(e) => setNewVitals({ ...newVitals, pulse: e.target.value })}
                  className="w-full p-2 border rounded-lg font-mono text-xs"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Temp (°F)</label>
                <input
                  type="text"
                  value={newVitals.temp}
                  onChange={(e) => setNewVitals({ ...newVitals, temp: e.target.value })}
                  className="w-full p-2 border rounded-lg font-mono text-xs"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-0.5">SpO2 (%)</label>
                <input
                  type="text"
                  value={newVitals.spo2}
                  onChange={(e) => setNewVitals({ ...newVitals, spo2: e.target.value })}
                  className="w-full p-2 border rounded-lg font-mono text-xs"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t">
              <button
                type="button"
                onClick={() => setVitalsModalAdmission(null)}
                className="px-3 py-1.5 text-xs font-bold text-slate-600 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onAddVitals(vitalsModalAdmission.id, {
                    id: `VIT-${Date.now()}`,
                    date: new Date().toLocaleString(),
                    ...newVitals,
                    recordedBy: currentUser.name,
                  });
                  setVitalsModalAdmission(null);
                }}
                className="px-4 py-1.5 bg-purple-700 text-white rounded-lg text-xs font-bold"
              >
                Save Vitals
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: ADD DOCTOR ROUND NOTE */}
      {/* ========================================================================= */}
      {doctorNoteModalAdmission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 w-full max-w-lg shadow-2xl border border-slate-300 space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="font-bold text-sm text-slate-900">Doctor Daily Round Progress Note</h3>
              <button onClick={() => setDoctorNoteModalAdmission(null)}>
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>
            <p className="text-xs text-slate-500">
              Patient: <strong>{doctorNoteModalAdmission.patientName}</strong> ({doctorNoteModalAdmission.bedNumber})
            </p>
            <div className="space-y-2 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Clinical Progress Note *</label>
                <textarea
                  rows={3}
                  value={newDoctorNote.note}
                  onChange={(e) => setNewDoctorNote({ ...newDoctorNote, note: e.target.value })}
                  placeholder="Patient afebrile, chest clear, tolerating oral diet..."
                  className="w-full p-2 border rounded-lg text-xs"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Doctor Orders / Medication adjustments</label>
                <input
                  type="text"
                  value={newDoctorNote.orders}
                  onChange={(e) => setNewDoctorNote({ ...newDoctorNote, orders: e.target.value })}
                  placeholder="e.g. Stop IV saline, start oral Tab Cefuroxime..."
                  className="w-full p-2 border rounded-lg text-xs"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t">
              <button
                type="button"
                onClick={() => setDoctorNoteModalAdmission(null)}
                className="px-3 py-1.5 text-xs font-bold text-slate-600 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!newDoctorNote.note.trim()) return;
                  onAddDoctorNote(doctorNoteModalAdmission.id, {
                    id: `NOTE-${Date.now()}`,
                    date: new Date().toLocaleString(),
                    doctorName: currentUser.name,
                    ...newDoctorNote,
                  });
                  setDoctorNoteModalAdmission(null);
                  setNewDoctorNote({ note: '', orders: '' });
                }}
                className="px-4 py-1.5 bg-purple-700 text-white rounded-lg text-xs font-bold"
              >
                Save Doctor Note
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
