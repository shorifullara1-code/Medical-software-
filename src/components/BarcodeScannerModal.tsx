import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import {
  Scan,
  X,
  Search,
  Camera,
  CameraOff,
  User,
  Phone,
  Droplet,
  AlertTriangle,
  Receipt,
  FileText,
  Activity,
  Calendar,
  CheckCircle2,
  ExternalLink,
  PlusCircle,
  CreditCard,
  Printer,
  PackageCheck,
  Lock,
  Bed,
  Clock,
} from 'lucide-react';
import { Patient, Invoice, Prescription, LabReport, Appointment, IPDAdmission } from '../types';
import { BarcodeRenderer } from './BarcodeRenderer';
import { calculate24HourBedRent, getPatientFinancialSummary } from '../utils/bedRentBilling';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  patients: Patient[];
  invoices: Invoice[];
  prescriptions: Prescription[];
  labReports: LabReport[];
  appointments: Appointment[];
  admissions?: IPDAdmission[];
  onSelectAction?: (action: 'prescribe' | 'bill' | 'collect_due' | 'lab' | 'appointment' | 'delivery' | 'ipd', patientId: string) => void;
  onOpenInvoicePrint?: (invoice: Invoice) => void;
  onOpenPrescriptionPrint?: (prescription: Prescription) => void;
  onOpenLabReportPrint?: (report: LabReport) => void;
  onOpenAppointmentPrint?: (appointment: Appointment) => void;
  onOpenAdmissionSlipPrint?: (admission: IPDAdmission) => void;
}

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  isOpen,
  onClose,
  patients,
  invoices,
  prescriptions,
  labReports,
  appointments,
  admissions = [],
  onSelectAction,
  onOpenInvoicePrint,
  onOpenPrescriptionPrint,
  onOpenLabReportPrint,
  onOpenAppointmentPrint,
  onOpenAdmissionSlipPrint,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [scannedPatient, setScannedPatient] = useState<Patient | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [scanFeedback, setScanFeedback] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const html5QrCodeRegionId = 'interactive-barcode-reader';

  // Handle hardware barcode scanner inputs
  useEffect(() => {
    let buffer = '';
    let lastKeyTime = Date.now();

    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isInput = activeEl?.tagName === 'INPUT' || activeEl?.tagName === 'TEXTAREA';
      
      const currentTime = Date.now();
      if (currentTime - lastKeyTime > 100) {
        buffer = '';
      }
      lastKeyTime = currentTime;

      if (e.key === 'Enter') {
        if (buffer.length >= 4) {
          handleBarcodeScanned(buffer.trim());
          buffer = '';
        }
      } else if (e.key.length === 1 && !isInput) {
        buffer += e.key;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [patients, isOpen]);

  const handleBarcodeScanned = (code: string) => {
    const clean = code.trim().toUpperCase();
    setScanFeedback(`Scanned Code: ${clean}`);

    // Try finding by Patient ID, Phone, or partial match
    let found = patients.find(p => p.id.toUpperCase() === clean || p.phone.replace(/[^0-9]/g, '') === clean.replace(/[^0-9]/g, ''));
    
    // If code is an Invoice ID (e.g. INV-2026-1001)
    if (!found) {
      const matchedInv = invoices.find(inv => inv.id.toUpperCase() === clean);
      if (matchedInv) {
        found = patients.find(p => p.id === matchedInv.patientId);
      }
    }

    // If code is a Prescription ID (e.g. RX-2026-001)
    if (!found) {
      const matchedRx = prescriptions.find(rx => rx.id.toUpperCase() === clean);
      if (matchedRx) {
        found = patients.find(p => p.id === matchedRx.patientId);
      }
    }

    // If code is a Lab report ID
    if (!found) {
      const matchedLab = labReports.find(lab => lab.id.toUpperCase() === clean);
      if (matchedLab) {
        found = patients.find(p => p.id === matchedLab.patientId);
      }
    }

    if (found) {
      setScannedPatient(found);
      setSearchTerm(found.id);
      stopCamera();
    } else {
      // Try loose match
      const loose = patients.find(p => p.id.toLowerCase().includes(clean.toLowerCase()) || p.name.toLowerCase().includes(clean.toLowerCase()));
      if (loose) {
        setScannedPatient(loose);
        setSearchTerm(loose.id);
        stopCamera();
      } else {
        setScanFeedback(`No patient record found for (${clean})`);
      }
    }
  };

  const startCamera = async () => {
    setIsCameraActive(true);
    setScanFeedback('Starting camera...');

    setTimeout(async () => {
      try {
        const element = document.getElementById(html5QrCodeRegionId);
        if (!element) {
          console.warn(`Element with ID ${html5QrCodeRegionId} not found`);
          setIsCameraActive(false);
          setScanFeedback('Camera frame not found. Use manual ID search.');
          return;
        }

        if (scannerRef.current) {
          try {
            if (scannerRef.current.isScanning) {
              await scannerRef.current.stop();
            }
            await scannerRef.current.clear();
          } catch (e) {
            // ignore
          }
          scannerRef.current = null;
        }

        const scanner = new Html5Qrcode(html5QrCodeRegionId);
        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: { width: 250, height: 150 },
            aspectRatio: 1.5,
          },
          (decodedText) => {
            handleBarcodeScanned(decodedText);
          },
          () => {
            // frame decode failures normal
          }
        );
        setScanFeedback('Camera active: Align barcode inside frame');
      } catch (err: any) {
        console.error('Camera barcode scanner error:', err);
        setIsCameraActive(false);
        const errMsg = err?.message || '';
        if (errMsg.includes('NotAllowedError') || errMsg.includes('Permission')) {
          setScanFeedback('Camera permission denied. Please allow camera access in browser settings.');
        } else {
          setScanFeedback('Could not start camera. Search using manual ID.');
        }
      }
    }, 100);
  };

  const stopCamera = async () => {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
        await scannerRef.current.clear();
      } catch (err) {
        console.warn('Error stopping scanner:', err);
      }
      scannerRef.current = null;
    }
    setIsCameraActive(false);
  };

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setScannedPatient(null);
      setSearchTerm('');
      setScanFeedback(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Patient associated data
  const patientInvoices = scannedPatient ? invoices.filter((i) => i.patientId === scannedPatient.id) : [];
  const patientPrescriptions = scannedPatient ? prescriptions.filter((p) => p.patientId === scannedPatient.id) : [];
  const patientLabReports = scannedPatient ? labReports.filter((l) => l.patientId === scannedPatient.id) : [];
  const patientAppointments = scannedPatient ? appointments.filter((a) => a.patientId === scannedPatient.id) : [];

  const financialSummary = scannedPatient
    ? getPatientFinancialSummary(scannedPatient.id, invoices, admissions)
    : null;

  const totalPatientDue = financialSummary?.grandTotalOutstandingDue || 0;
  const totalPatientPaid = financialSummary?.totalInvoicePaid || 0;
  const activeBedDetail = financialSummary?.activeBedRentDetail;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 bg-gradient-to-r from-emerald-700 via-teal-700 to-cyan-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/15 rounded-xl backdrop-blur-md">
              <Scan className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight">Smart Patient Barcode Scanner & Profile</h2>
              <p className="text-xs text-emerald-100">
                Scan prescription or bill barcode to instantly load patient history and outstanding dues
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scanner Bar & Search Controls */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row gap-3 items-center">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Enter Patient ID (e.g. P-2026-001), Bill or Prescription No..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                handleBarcodeScanned(e.target.value);
              }}
              className="w-full pl-10 pr-4 py-2.5 bg-white rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            {!isCameraActive ? (
              <button
                onClick={startCamera}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-medium flex items-center gap-2 shadow-sm transition-all cursor-pointer"
              >
                <Camera className="w-4 h-4" />
                Start Camera Scanner
              </button>
            ) : (
              <button
                onClick={stopCamera}
                className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-sm font-medium flex items-center gap-2 shadow-sm transition-all cursor-pointer"
              >
                <CameraOff className="w-4 h-4" />
                Stop Camera
              </button>
            )}
          </div>
        </div>

        {/* Live Camera View Box */}
        <div className={`p-4 bg-slate-900 border-b border-slate-800 flex flex-col items-center ${isCameraActive ? 'block' : 'hidden'}`}>
          <div className="w-full max-w-sm rounded-xl overflow-hidden border-2 border-emerald-400 shadow-lg relative bg-black min-h-[160px]">
            <div id={html5QrCodeRegionId} className="w-full"></div>
            <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-0.5 bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.9)] animate-pulse pointer-events-none"></div>
          </div>
          <p className="text-xs text-slate-300 mt-2 flex items-center gap-1.5">
            <Scan className="w-3.5 h-3.5 text-emerald-400 animate-spin" />
            Hold the printed barcode straight in front of camera...
          </p>
        </div>

        {/* Quick Demo Barcode Buttons */}
        <div className="px-4 py-2 bg-emerald-50/70 border-b border-emerald-100 flex items-center gap-2 overflow-x-auto text-xs text-emerald-900">
          <span className="font-semibold text-emerald-800 whitespace-nowrap">Demo Scan Test:</span>
          {patients.map(p => (
            <button
              key={p.id}
              onClick={() => handleBarcodeScanned(p.id)}
              className="px-2.5 py-1 rounded-md bg-white border border-emerald-200 text-emerald-700 hover:bg-emerald-600 hover:text-white transition-colors font-mono whitespace-nowrap flex items-center gap-1 cursor-pointer"
            >
              <span>{p.name.split(' ')[0]}</span>
              <span className="text-[10px] opacity-75 font-semibold">({p.id})</span>
            </button>
          ))}
          {scanFeedback && (
            <span className="ml-auto text-xs font-medium text-emerald-800 bg-emerald-200/60 px-2 py-0.5 rounded">
              {scanFeedback}
            </span>
          )}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-5">
          {!scannedPatient ? (
            <div className="h-64 flex flex-col items-center justify-center text-center text-slate-400">
              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                <Scan className="w-8 h-8 text-slate-400" />
              </div>
              <p className="text-base font-semibold text-slate-700">Scan Barcode or Select Patient ID</p>
              <p className="text-xs text-slate-500 max-w-sm mt-1">
                Scanning a prescription or money receipt barcode will instantly display the patient's due balance, medical history, prescriptions, and lab reports.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Patient Top Summary Card */}
              <div className="bg-gradient-to-br from-slate-50 to-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col md:flex-row gap-5 items-start justify-between">
                <div className="flex gap-4 items-start">
                  <div className="w-16 h-16 rounded-2xl bg-teal-600 text-white flex items-center justify-center text-2xl font-bold shadow-md shadow-teal-500/20">
                    {scannedPatient.name.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-3 flex-wrap">
                      <h3 className="text-xl font-bold text-slate-900">{scannedPatient.name}</h3>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-slate-900 text-white">
                        {scannedPatient.id}
                      </span>
                      <span className="px-2 py-0.5 rounded-md text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1">
                        <Droplet className="w-3 h-3 text-rose-500" /> {scannedPatient.bloodGroup}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 mt-2 text-xs text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span>Age: {scannedPatient.age} Yrs ({scannedPatient.gender === 'male' ? 'Male' : 'Female'})</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-mono">{scannedPatient.phone}</span>
                      </div>
                      <div className="sm:col-span-2 text-slate-500 mt-1">
                        Address: {scannedPatient.address}
                      </div>
                      {scannedPatient.emergencyContact && (
                        <div className="sm:col-span-2 text-slate-500">
                          Emergency Contact: {scannedPatient.emergencyContact}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Patient Barcode & Due Warning Badge */}
                <div className="flex flex-col items-center sm:items-end gap-2 w-full md:w-auto pt-2 md:pt-0 border-t md:border-t-0 border-slate-200">
                  <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center">
                    <BarcodeRenderer value={scannedPatient.id} height={36} width={1.4} fontSize={11} />
                  </div>
                  {totalPatientDue > 0 ? (
                    <div className="bg-rose-50 border border-rose-200 text-rose-700 px-3.5 py-1.5 rounded-xl text-xs font-bold flex flex-col items-end gap-0.5 shadow-sm animate-pulse">
                      <div className="flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4 text-rose-600" />
                        <span>Total Due: BDT {totalPatientDue.toLocaleString()}</span>
                      </div>
                      {activeBedDetail && activeBedDetail.netBedRentDue > 0 && (
                        <span className="text-[10px] font-normal text-rose-600">
                          (Invoices: BDT {financialSummary?.totalInvoiceDue.toLocaleString()} + Bed Due: BDT {activeBedDetail.netBedRentDue.toLocaleString()})
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-3 py-1 rounded-xl text-xs font-semibold flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>No Outstanding Dues</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Active Inpatient 24-Hour Bed Rent Banner */}
              {activeBedDetail && (
                <div className="p-4 bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950 text-white rounded-2xl border-2 border-purple-500/40 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-purple-800/60">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 bg-purple-500/20 text-purple-300 rounded-xl border border-purple-500/30">
                        <Bed className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-[11px] font-bold text-purple-300 uppercase tracking-wider block">
                          Active Inpatient Bed Status (২৪ ঘণ্টা সাইকেল বেড ভাড়া)
                        </span>
                        <span className="font-mono text-xs font-black text-white">
                          {activeBedDetail.bedNumber} • {activeBedDetail.wardType}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-lg bg-purple-500/30 text-purple-200 border border-purple-400/30 text-xs font-mono font-bold flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Cycle Day {activeBedDetail.currentCycleDay}</span>
                      </span>
                      {onOpenAdmissionSlipPrint && financialSummary?.activeAdmission && (
                        <button
                          type="button"
                          onClick={() => onOpenAdmissionSlipPrint(financialSummary.activeAdmission!)}
                          className="px-3 py-1 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer border border-white/10"
                        >
                          <Printer className="w-3 h-3 text-purple-300" />
                          <span>Bed Ticket</span>
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    <div className="p-2.5 bg-slate-800/80 rounded-xl border border-slate-700/80">
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Stay Duration</span>
                      <span className="font-mono font-bold text-white text-xs">{activeBedDetail.stayDays} Days ({Math.floor(activeBedDetail.elapsedHours)}h)</span>
                      <span className="text-[9px] text-purple-300 block">{Math.floor(activeBedDetail.timeRemainingInCycleHours)}h in current cycle</span>
                    </div>

                    <div className="p-2.5 bg-slate-800/80 rounded-xl border border-slate-700/80">
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Accrued 24h Rent</span>
                      <span className="font-mono font-bold text-white text-xs">BDT {activeBedDetail.totalAccruedBedRent.toLocaleString()}</span>
                      <span className="text-[9px] text-slate-400 block">BDT {activeBedDetail.dailyBedCharge}/Day</span>
                    </div>

                    <div className="p-2.5 bg-slate-800/80 rounded-xl border border-slate-700/80">
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Advance Adjusted</span>
                      <span className="font-mono font-bold text-emerald-400 text-xs">BDT {activeBedDetail.advanceDeposit.toLocaleString()}</span>
                      <span className="text-[9px] text-emerald-300 block">Deposit on record</span>
                    </div>

                    <div className={`p-2.5 rounded-xl border ${activeBedDetail.netBedRentDue > 0 ? 'bg-rose-950/70 border-rose-600 text-rose-200' : 'bg-emerald-950/70 border-emerald-600 text-emerald-200'}`}>
                      <span className="text-[10px] font-bold uppercase block">Net Bed Due</span>
                      <span className="font-mono font-black text-sm">BDT {activeBedDetail.netBedRentDue.toLocaleString()}</span>
                      <span className="text-[9px] block">Accrued Live Balance</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons Bar */}
              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  onClick={() => {
                    onSelectAction?.('collect_due', scannedPatient.id);
                    onClose();
                  }}
                  className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition-all cursor-pointer ${
                    totalPatientDue > 0
                      ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/20'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <CreditCard className="w-4 h-4" />
                  Collect Due Bill (BDT {totalPatientDue})
                </button>

                <button
                  onClick={() => {
                    onSelectAction?.('prescribe', scannedPatient.id);
                    onClose();
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white flex items-center gap-2 shadow-sm transition-all cursor-pointer"
                >
                  <FileText className="w-4 h-4" />
                  Write New Prescription
                </button>

                <button
                  onClick={() => {
                    onSelectAction?.('bill', scannedPatient.id);
                    onClose();
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-2 shadow-sm transition-all cursor-pointer"
                >
                  <Receipt className="w-4 h-4" />
                  Create New Bill
                </button>

                <button
                  onClick={() => {
                    onSelectAction?.('lab', scannedPatient.id);
                    onClose();
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-sky-600 hover:bg-sky-700 text-white flex items-center gap-2 shadow-sm transition-all cursor-pointer"
                >
                  <Activity className="w-4 h-4" />
                  New Lab Report
                </button>

                <button
                  onClick={() => {
                    onSelectAction?.('appointment', scannedPatient.id);
                    onClose();
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white flex items-center gap-2 shadow-sm transition-all cursor-pointer"
                >
                  <Calendar className="w-4 h-4" />
                  Schedule Appointment
                </button>

                <button
                  onClick={() => {
                    onSelectAction?.('delivery', scannedPatient.id);
                    onClose();
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white flex items-center gap-2 shadow-sm transition-all cursor-pointer"
                >
                  <PackageCheck className="w-4 h-4 text-teal-400" />
                  Report Delivery
                </button>
              </div>

              {/* Patient Record Tabs / Sections */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* 1. Invoices & Due Center */}
                <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col">
                  <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <Receipt className="w-4 h-4 text-emerald-600" />
                      <h4 className="font-bold text-sm text-slate-800">Billing & Payment History ({patientInvoices.length})</h4>
                    </div>
                    <span className="text-xs font-semibold text-slate-500">
                      Paid: BDT {totalPatientPaid.toLocaleString()}
                    </span>
                  </div>

                  {patientInvoices.length === 0 ? (
                    <p className="text-xs text-slate-400 py-6 text-center">No bill generated yet</p>
                  ) : (
                    <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                      {patientInvoices.map((inv) => (
                        <div
                          key={inv.id}
                          className="p-3 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:border-slate-300 transition-all text-xs"
                        >
                          <div className="flex items-center justify-between font-medium">
                            <span className="font-mono text-slate-800 font-bold">{inv.id}</span>
                            <span className="text-slate-400">{inv.date}</span>
                          </div>
                          <div className="flex items-center justify-between mt-1 text-slate-600">
                            <span>Total: BDT {inv.total} | Paid: BDT {inv.paidAmount}</span>
                            {inv.dueAmount > 0 ? (
                              <span className="text-rose-600 font-bold bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                                Due: BDT {inv.dueAmount}
                              </span>
                            ) : (
                              <span className="text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                Paid ✓
                              </span>
                            )}
                          </div>
                          <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
                            <button
                              onClick={() => {
                                onOpenInvoicePrint?.(inv);
                                onClose();
                              }}
                              className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded text-[11px] font-semibold text-slate-700 flex items-center gap-1 cursor-pointer"
                            >
                              <Printer className="w-3 h-3 text-slate-500" />
                              Print Receipt
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 2. Prescriptions */}
                <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col">
                  <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-teal-600" />
                      <h4 className="font-bold text-sm text-slate-800">Prescriptions List ({patientPrescriptions.length})</h4>
                    </div>
                  </div>

                  {patientPrescriptions.length === 0 ? (
                    <p className="text-xs text-slate-400 py-6 text-center">No prescriptions written yet</p>
                  ) : (
                    <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                      {patientPrescriptions.map((rx) => (
                        <div
                          key={rx.id}
                          className="p-3 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:border-slate-300 transition-all text-xs"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-mono font-bold text-teal-700">{rx.id}</span>
                            <span className="text-slate-400">{rx.date}</span>
                          </div>
                          <p className="font-semibold text-slate-800 mt-1">{rx.doctorName}</p>
                          <p className="text-[11px] text-slate-500 truncate mt-0.5">
                            Diagnosis: {rx.diagnosis || 'General Checkup'}
                          </p>
                          <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                            <span>Medicines: {rx.medicines.length}</span>
                            <button
                              onClick={() => {
                                onOpenPrescriptionPrint?.(rx);
                                onClose();
                              }}
                              className="px-2.5 py-1 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 rounded font-semibold flex items-center gap-1 cursor-pointer"
                            >
                              <Printer className="w-3 h-3 text-teal-600" />
                              Print Prescription
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 3. Lab Reports (CBC etc.) */}
                <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col md:col-span-2">
                  <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <Activity className="w-4 h-4 text-sky-600" />
                      <h4 className="font-bold text-sm text-slate-800">Lab Test Reports ({patientLabReports.length})</h4>
                    </div>
                  </div>

                  {patientLabReports.length === 0 ? (
                    <p className="text-xs text-slate-400 py-6 text-center">No test report generated yet</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {patientLabReports.map((lab) => (
                        <div
                          key={lab.id}
                          className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-white text-xs flex flex-col justify-between"
                        >
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-mono font-bold text-sky-700">{lab.id}</span>
                              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                                {lab.status === 'completed' ? 'Report Ready' : 'Pending'}
                              </span>
                            </div>
                            <h5 className="font-bold text-slate-800 mt-1">{lab.testName}</h5>
                            <p className="text-[11px] text-slate-500 mt-0.5">Referred: {lab.referredByDoctor}</p>
                            <p className="text-[11px] text-slate-400 mt-0.5">Date: {lab.reportedAt}</p>
                          </div>

                          <div className="mt-3 pt-2 border-t border-slate-200 flex items-center justify-between">
                            {totalPatientDue > 0 ? (
                              <button
                                onClick={() => {
                                  onSelectAction?.('delivery', scannedPatient.id);
                                  onClose();
                                }}
                                className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer ml-auto"
                                title="Clear dues to unlock report"
                              >
                                <Lock className="w-3 h-3 text-rose-600" />
                                <span>Locked (Clear Due Balance)</span>
                              </button>
                            ) : (
                              <button
                                onClick={() => {
                                  onOpenLabReportPrint?.(lab);
                                  onClose();
                                }}
                                className="px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm cursor-pointer ml-auto"
                              >
                                <Printer className="w-3.5 h-3.5" />
                                Print Lab Report
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 4. Appointments */}
                <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col md:col-span-2">
                  <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-amber-600" />
                      <h4 className="font-bold text-sm text-slate-800">Appointments & Tokens ({patientAppointments.length})</h4>
                    </div>
                  </div>

                  {patientAppointments.length === 0 ? (
                    <p className="text-xs text-slate-400 py-4 text-center">No active appointments</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {patientAppointments.map((apt) => (
                        <div
                          key={apt.id}
                          className="p-3 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-white text-xs flex items-center justify-between gap-2"
                        >
                          <div>
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="font-mono font-bold text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                                {apt.id} • #{apt.serialNumber}
                              </span>
                              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                                {apt.status === 'completed' ? 'Completed' : 'Confirmed'}
                              </span>
                            </div>
                            <h5 className="font-bold text-slate-900 mt-1">{apt.doctorName}</h5>
                            <p className="text-[11px] text-slate-500 mt-0.5">{apt.date} • {apt.timeSlot}</p>
                          </div>

                          <button
                            onClick={() => {
                              onOpenAppointmentPrint?.(apt);
                              onClose();
                            }}
                            className="px-2.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-2xs cursor-pointer shrink-0 transition-colors"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            Print Token
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
