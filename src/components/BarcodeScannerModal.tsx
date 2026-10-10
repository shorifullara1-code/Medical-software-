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
  Upload,
  Volume2,
  Pill,
} from 'lucide-react';
import { Patient, Invoice, Prescription, LabReport, Appointment, IPDAdmission, PharmacySale } from '../types';
import { BarcodeRenderer } from './BarcodeRenderer';
import { calculate24HourBedRent, getPatientFinancialSummary } from '../utils/bedRentBilling';
import { matchScannedEntity, playScanBeep } from '../utils/scanParser';
import { FastBarcodeEngine } from '../utils/fastScannerEngine';
import { Zap } from 'lucide-react';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  patients: Patient[];
  invoices: Invoice[];
  prescriptions: Prescription[];
  labReports: LabReport[];
  appointments: Appointment[];
  admissions?: IPDAdmission[];
  pharmacySales?: PharmacySale[];
  onSelectAction?: (action: 'prescribe' | 'bill' | 'collect_due' | 'lab' | 'appointment' | 'delivery' | 'ipd' | 'pharmacy', patientId: string) => void;
  onOpenInvoicePrint?: (invoice: Invoice) => void;
  onOpenPrescriptionPrint?: (prescription: Prescription) => void;
  onOpenLabReportPrint?: (report: LabReport) => void;
  onOpenAppointmentPrint?: (appointment: Appointment) => void;
  onOpenAdmissionSlipPrint?: (admission: IPDAdmission) => void;
  onOpenPatientCardPrint?: (patient: Patient) => void;
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
  pharmacySales = [],
  onSelectAction,
  onOpenInvoicePrint,
  onOpenPrescriptionPrint,
  onOpenLabReportPrint,
  onOpenAppointmentPrint,
  onOpenAdmissionSlipPrint,
  onOpenPatientCardPrint,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [scannedPatient, setScannedPatient] = useState<Patient | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [scanFeedback, setScanFeedback] = useState<string | null>(null);
  const [matchedScanResult, setMatchedScanResult] = useState<{
    type: 'patient' | 'invoice' | 'prescription' | 'admission' | 'lab';
    id: string;
    invoice?: Invoice;
    prescription?: Prescription;
    labReport?: LabReport;
    admission?: IPDAdmission;
  } | null>(null);
  const [lastScanDebug, setLastScanDebug] = useState<{
    raw: string;
    type: string;
    extractedCode: string;
    timestamp: string;
  } | null>(null);
  const [isTorchSupported, setIsTorchSupported] = useState(false);
  const [isTorchOn, setIsTorchOn] = useState(false);
  const fastScannerRef = useRef<FastBarcodeEngine | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const html5QrCodeRegionId = 'interactive-barcode-reader';

  // Handle hardware barcode scanner inputs (works globally with high latency tolerance)
  useEffect(() => {
    let buffer = '';
    let lastKeyTime = Date.now();

    const handleKeyDown = (e: KeyboardEvent) => {
      const currentTime = Date.now();
      // 250ms threshold to prevent dropped characters from USB / wireless barcode guns
      if (currentTime - lastKeyTime > 250) {
        buffer = '';
      }
      lastKeyTime = currentTime;

      if (e.key === 'Enter') {
        const cleanCode = buffer.replace(/[\r\n\t]/g, '').trim();
        if (cleanCode.length >= 2) {
          handleBarcodeScanned(cleanCode);
          buffer = '';
        }
      } else if (e.key.length === 1) {
        buffer += e.key;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [patients, invoices, prescriptions, labReports, admissions, isOpen]);

  const handleBarcodeScanned = (code: string) => {
    if (!code || !code.trim()) return;

    // Detailed debug logging to capture exact scan output across all modules
    console.log('[BARCODE_SCANNER_MODAL] Raw Scanned Payload:', code);

    const result = matchScannedEntity(
      code,
      patients,
      [],
      invoices,
      prescriptions,
      labReports,
      admissions
    );

    console.log('[BARCODE_SCANNER_MODAL] Entity Matched Result:', result);

    setLastScanDebug({
      raw: code,
      type: result.type,
      extractedCode: result.extractedCode,
      timestamp: new Date().toLocaleTimeString(),
    });

    setScanFeedback(result.message);

    if (result.type === 'prescription' && result.prescription) {
      setMatchedScanResult({
        type: 'prescription',
        id: result.prescription.id,
        prescription: result.prescription,
      });
      if (result.patient) {
        setScannedPatient(result.patient);
        setSearchTerm(result.patient.id);
      }
      stopCamera();
    } else if (result.type === 'invoice' && result.invoice) {
      setMatchedScanResult({
        type: 'invoice',
        id: result.invoice.id,
        invoice: result.invoice,
      });
      if (result.patient) {
        setScannedPatient(result.patient);
        setSearchTerm(result.patient.id);
      }
      stopCamera();
    } else if (result.type === 'lab' && result.labReport) {
      setMatchedScanResult({
        type: 'lab',
        id: result.labReport.id,
        labReport: result.labReport,
      });
      const foundP = result.patient || patients.find((p) => p.id === result.labReport?.patientId);
      if (foundP) {
        setScannedPatient(foundP);
        setSearchTerm(foundP.id);
      }
      stopCamera();
    } else if (result.type === 'admission' && result.admission) {
      setMatchedScanResult({
        type: 'admission',
        id: result.admission.id,
        admission: result.admission,
      });
      const foundP = result.patient || patients.find((p) => p.id === result.admission?.patientId);
      if (foundP) {
        setScannedPatient(foundP);
        setSearchTerm(foundP.id);
      }
      stopCamera();
    } else if (result.patient) {
      setMatchedScanResult({
        type: 'patient',
        id: result.patient.id,
      });
      setScannedPatient(result.patient);
      setSearchTerm(result.patient.id);
      stopCamera();
    }
  };

  const handleImageFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setScanFeedback('Scanning QR Code image file...');
    try {
      const tempReaderId = 'qr-image-file-temp-reader';
      let element = document.getElementById(tempReaderId);
      if (!element) {
        element = document.createElement('div');
        element.id = tempReaderId;
        element.style.display = 'none';
        document.body.appendChild(element);
      }

      const html5QrCode = new Html5Qrcode(tempReaderId);
      const decodedText = await html5QrCode.scanFile(file, true);
      handleBarcodeScanned(decodedText);
      html5QrCode.clear();
    } catch (err: any) {
      console.warn('Scan file error:', err);
      playScanBeep(false);
      setScanFeedback('Could not detect scannable QR / Barcode in uploaded image.');
    }
  };

  const startCamera = async () => {
    setIsCameraActive(true);
    setScanFeedback('Starting 60 FPS hardware scanner engine...');

    setTimeout(async () => {
      try {
        if (fastScannerRef.current) {
          await fastScannerRef.current.stop();
          fastScannerRef.current = null;
        }

        const engine = new FastBarcodeEngine({
          containerId: html5QrCodeRegionId,
          onScanSuccess: (decodedText) => {
            handleBarcodeScanned(decodedText);
          },
        });

        fastScannerRef.current = engine;
        await engine.start();

        setIsTorchSupported(engine.torchSupported);
        setScanFeedback('⚡ High-Speed Hardware Scanner Active: Instant detection ready!');
      } catch (err: any) {
        console.error('Camera barcode scanner error:', err);
        setIsCameraActive(false);
        const errMsg = err?.message || '';
        if (errMsg.includes('NotAllowedError') || errMsg.includes('Permission')) {
          setScanFeedback('Camera permission denied. Please enable camera access in browser settings.');
        } else {
          setScanFeedback('Could not start camera. Search using manual ID or upload image.');
        }
      }
    }, 100);
  };

  const toggleFlashlight = async () => {
    if (fastScannerRef.current) {
      const active = await fastScannerRef.current.toggleTorch();
      setIsTorchOn(active);
    }
  };

  const stopCamera = async () => {
    if (fastScannerRef.current) {
      await fastScannerRef.current.stop();
      fastScannerRef.current = null;
    }
    setIsCameraActive(false);
    setIsTorchOn(false);
  };

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setScannedPatient(null);
      setSearchTerm('');
      setScanFeedback(null);
      setMatchedScanResult(null);
    } else {
      fastScannerRef.current?.resetScannedMemory();
      const timer = setTimeout(() => {
        startCamera();
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Patient associated data
  const patientInvoices = scannedPatient ? invoices.filter((i) => i.patientId === scannedPatient.id) : [];
  const patientPrescriptions = scannedPatient ? prescriptions.filter((p) => p.patientId === scannedPatient.id) : [];
  const patientLabReports = scannedPatient ? labReports.filter((l) => l.patientId === scannedPatient.id) : [];
  const patientAppointments = scannedPatient ? appointments.filter((a) => a.patientId === scannedPatient.id) : [];

  const financialSummary = scannedPatient
    ? getPatientFinancialSummary(scannedPatient.id, invoices, admissions, pharmacySales)
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
              placeholder="Scan or Type Patient ID (e.g. P-2026-001), Bill / Prescription No..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                handleBarcodeScanned(e.target.value);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleBarcodeScanned(searchTerm);
                }
              }}
              className="w-full pl-10 pr-4 py-2.5 bg-white rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono font-semibold"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              className="hidden"
              onChange={handleImageFileUpload}
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3.5 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Upload QR Code or Barcode image file from gallery"
            >
              <Upload className="w-4 h-4 text-slate-700" />
              <span>Upload Image</span>
            </button>

            {isCameraActive && isTorchSupported && (
              <button
                type="button"
                onClick={toggleFlashlight}
                className={`px-3 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  isTorchOn
                    ? 'bg-amber-400 text-slate-950 font-black shadow-md shadow-amber-400/30'
                    : 'bg-slate-800 text-amber-300 border border-slate-700 hover:bg-slate-700'
                }`}
                title="Toggle Camera Flashlight / Torch"
              >
                <Zap className="w-4 h-4 fill-current" />
                <span>{isTorchOn ? 'Torch ON' : 'Torch Off'}</span>
              </button>
            )}

            {!isCameraActive ? (
              <button
                type="button"
                onClick={startCamera}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-medium flex items-center gap-2 shadow-sm transition-all cursor-pointer"
              >
                <Camera className="w-4 h-4" />
                <span>Start Camera Scanner</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={stopCamera}
                className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-sm font-medium flex items-center gap-2 shadow-sm transition-all cursor-pointer"
              >
                <CameraOff className="w-4 h-4" />
                <span>Stop Camera</span>
              </button>
            )}
          </div>
        </div>

        {/* Live Camera View Box */}
        <div className={`p-4 bg-slate-900 border-b border-slate-800 flex flex-col items-center ${isCameraActive ? 'block' : 'hidden'}`}>
          <div className="w-full max-w-sm rounded-xl overflow-hidden border-2 border-emerald-400 shadow-lg relative bg-black min-h-[180px]">
            <div id={html5QrCodeRegionId} className="w-full"></div>
            {/* Viewfinder corner guides */}
            <div className="absolute inset-3 pointer-events-none border border-emerald-400/30 rounded-lg flex flex-col justify-between p-2">
              <div className="flex justify-between">
                <div className="w-4 h-4 border-t-2 border-l-2 border-emerald-400"></div>
                <div className="w-4 h-4 border-t-2 border-r-2 border-emerald-400"></div>
              </div>
              <div className="flex justify-between">
                <div className="w-4 h-4 border-b-2 border-l-2 border-emerald-400"></div>
                <div className="w-4 h-4 border-b-2 border-r-2 border-emerald-400"></div>
              </div>
            </div>
            <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-0.5 bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.9)] animate-pulse pointer-events-none"></div>
          </div>
          <div className="mt-2.5 text-center px-4 w-full max-w-sm">
            <p className="text-xs font-semibold text-emerald-300 flex items-center justify-center gap-1.5">
              <Scan className="w-3.5 h-3.5 text-emerald-400 animate-spin" />
              মোবাইল/কম্পিউটার স্ক্রিন বা কাগজের বারকোড অথবা QR কোড সামনে ধরুন
            </p>
            {scanFeedback && (
              <p className="text-xs font-bold text-emerald-200 mt-1.5 bg-emerald-950/80 border border-emerald-600/50 px-3 py-1.5 rounded-lg shadow-sm">
                {scanFeedback}
              </p>
            )}
          </div>
        </div>

        {/* Quick Demo Barcode Buttons */}
        <div className="px-4 py-2 bg-emerald-50/70 border-b border-emerald-100 flex items-center gap-2 overflow-x-auto text-xs text-emerald-900">
          <span className="font-semibold text-emerald-800 whitespace-nowrap">দ্রুত টেস্ট (Quick Test):</span>
          {patients.slice(0, 3).map(p => (
            <button
              key={p.id}
              onClick={() => handleBarcodeScanned(p.id)}
              className="px-2.5 py-1 rounded-md bg-white border border-teal-200 text-teal-800 hover:bg-teal-600 hover:text-white transition-colors font-mono whitespace-nowrap flex items-center gap-1 cursor-pointer shadow-2xs"
              title={`পেশেন্ট আইডি: ${p.name}`}
            >
              <span>{p.name.split(' ')[0]}</span>
              <span className="text-[10px] opacity-75 font-semibold">({p.id})</span>
            </button>
          ))}
          {prescriptions.slice(0, 2).map(rx => (
            <button
              key={rx.id}
              onClick={() => handleBarcodeScanned(rx.id)}
              className="px-2.5 py-1 rounded-md bg-white border border-indigo-200 text-indigo-800 hover:bg-indigo-600 hover:text-white transition-colors font-mono whitespace-nowrap flex items-center gap-1 cursor-pointer shadow-2xs"
              title={`প্রেসক্রিপশন: ${rx.id}`}
            >
              <FileText className="w-3 h-3 text-indigo-500" />
              <span>প্রেসক্রিপশন</span>
              <span className="text-[10px] opacity-75 font-semibold">({rx.id})</span>
            </button>
          ))}
          {invoices.slice(0, 2).map(inv => (
            <button
              key={inv.id}
              onClick={() => handleBarcodeScanned(inv.id)}
              className="px-2.5 py-1 rounded-md bg-white border border-emerald-300 text-emerald-900 hover:bg-emerald-600 hover:text-white transition-colors font-mono whitespace-nowrap flex items-center gap-1 cursor-pointer shadow-2xs"
              title={`মানি রিসিট: ${inv.id}`}
            >
              <Receipt className="w-3 h-3 text-emerald-600" />
              <span>মানি রিসিট</span>
              <span className="text-[10px] opacity-75 font-semibold">({inv.id})</span>
            </button>
          ))}
          {labReports.slice(0, 2).map(lab => (
            <button
              key={lab.id}
              onClick={() => handleBarcodeScanned(lab.id)}
              className="px-2.5 py-1 rounded-md bg-white border border-sky-300 text-sky-900 hover:bg-sky-600 hover:text-white transition-colors font-mono whitespace-nowrap flex items-center gap-1 cursor-pointer shadow-2xs"
              title={`ল্যাব রিপোর্ট: ${lab.id}`}
            >
              <Activity className="w-3 h-3 text-sky-600" />
              <span>ল্যাব রিপোর্ট</span>
              <span className="text-[10px] opacity-75 font-semibold">({lab.id})</span>
            </button>
          ))}
          {scanFeedback && (
            <span className="ml-auto text-xs font-semibold text-emerald-900 bg-emerald-200/80 px-2.5 py-1 rounded-md shadow-2xs whitespace-nowrap">
              {scanFeedback}
            </span>
          )}
        </div>

        {/* Live Scan Output & Debug Feed (Captures exact scan output across all modules) */}
        {lastScanDebug && (
          <div className="px-4 py-2 bg-slate-900 text-slate-200 border-b border-slate-800 flex items-center justify-between text-xs font-mono flex-wrap gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-emerald-400 font-bold font-sans text-[11px] uppercase tracking-wider">Live Debug Scan Output:</span>
              <span className="bg-slate-800 px-2 py-0.5 rounded text-amber-300 font-bold text-[11px] border border-amber-500/30">
                Type: {lastScanDebug.type.toUpperCase()}
              </span>
              <span className="bg-slate-800 px-2 py-0.5 rounded text-cyan-300 font-bold text-[11px] border border-cyan-500/30">
                ID: {lastScanDebug.extractedCode}
              </span>
            </div>
            <div className="text-[11px] text-slate-400 truncate max-w-xs sm:max-w-md">
              <span className="text-slate-500 font-sans">Raw:</span> "{lastScanDebug.raw}" ({lastScanDebug.timestamp})
            </div>
          </div>
        )}

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-5">
          {!scannedPatient ? (
            <div className="h-64 flex flex-col items-center justify-center text-center text-slate-400">
              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                <Scan className="w-8 h-8 text-slate-400" />
              </div>
              <p className="text-base font-semibold text-slate-700">Scan Barcode or Select Patient ID</p>
              <p className="text-xs text-slate-500 max-w-sm mt-1">
                Scanning a prescription, money receipt, lab report, or health card barcode will instantly display the patient's due balance, medical history, prescriptions, and lab reports.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Direct Scanned Document Match Banner */}
              {matchedScanResult && (matchedScanResult.type === 'prescription' || matchedScanResult.type === 'invoice') && (
                <div className={`p-4 rounded-2xl border shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fadeIn ${
                  matchedScanResult.type === 'prescription'
                    ? 'bg-gradient-to-r from-teal-50 via-teal-100/60 to-emerald-50 border-teal-300 text-teal-900'
                    : 'bg-gradient-to-r from-emerald-50 via-emerald-100/60 to-cyan-50 border-emerald-300 text-emerald-900'
                }`}>
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl text-white ${
                      matchedScanResult.type === 'prescription' ? 'bg-teal-700' : 'bg-emerald-700'
                    }`}>
                      {matchedScanResult.type === 'prescription' ? (
                        <FileText className="w-5 h-5" />
                      ) : (
                        <Receipt className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-white/80 border border-slate-300">
                          {matchedScanResult.type === 'prescription' ? 'PRESCRIPTION SCANNED' : 'MONEY RECEIPT SCANNED'}
                        </span>
                        <span className="font-mono font-black text-sm">{matchedScanResult.id}</span>
                      </div>
                      <p className="text-xs font-semibold mt-0.5 opacity-90">
                        {matchedScanResult.type === 'prescription'
                          ? `প্রেসক্রিপশনটি সফলভাবে স্ক্যান করা হয়েছে (ডাঃ ${matchedScanResult.prescription?.doctorName || 'উপলব্ধ'})`
                          : `মানি রিসিট / বিল সফলভাবে স্ক্যান করা হয়েছে (মোট: BDT ${matchedScanResult.invoice?.total || 0})`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                    {matchedScanResult.type === 'prescription' && matchedScanResult.prescription && (
                      <button
                        onClick={() => {
                          onOpenPrescriptionPrint?.(matchedScanResult.prescription!);
                          onClose();
                        }}
                        className="px-3.5 py-1.5 bg-teal-800 hover:bg-teal-900 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>প্রেসক্রিপশন দেখুন / প্রিন্ট</span>
                      </button>
                    )}
                    {matchedScanResult.type === 'invoice' && matchedScanResult.invoice && (
                      <button
                        onClick={() => {
                          onOpenInvoicePrint?.(matchedScanResult.invoice!);
                          onClose();
                        }}
                        className="px-3.5 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>মানি রিসিট দেখুন / প্রিন্ট</span>
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Direct Scanned Lab Report Match Banner */}
              {matchedScanResult && matchedScanResult.type === 'lab' && (
                <div className="p-4 rounded-2xl border-2 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fadeIn bg-gradient-to-r from-sky-50 via-cyan-50 to-blue-50 border-sky-400 text-sky-950">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-sky-700 text-white shadow-sm">
                      <Activity className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-sky-700 text-white">
                          ল্যাব রিপোর্ট স্ক্যান সফল (LAB REPORT VERIFIED)
                        </span>
                        <span className="font-mono font-black text-sm text-sky-900">{matchedScanResult.id}</span>
                      </div>
                      <p className="text-xs font-bold mt-0.5 text-sky-800">
                        {matchedScanResult.labReport?.testName || 'ডায়াগনস্টিক টেস্ট রিপোর্ট'} • রোগী: {matchedScanResult.labReport?.patientName || scannedPatient?.name || 'N/A'} • স্ট্যাটাস: {matchedScanResult.labReport?.status === 'completed' ? 'রিপোর্ট রেডি' : 'পেন্ডিং'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-wrap">
                    {onOpenLabReportPrint && matchedScanResult.labReport && (
                      <button
                        onClick={() => {
                          onOpenLabReportPrint(matchedScanResult.labReport!);
                          onClose();
                        }}
                        className="px-3.5 py-1.5 bg-sky-800 hover:bg-sky-900 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>ল্যাব রিপোর্ট প্রিন্ট</span>
                      </button>
                    )}
                    <button
                      onClick={() => {
                        onSelectAction?.('delivery', scannedPatient?.id || matchedScanResult.labReport?.patientId || '');
                        onClose();
                      }}
                      className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <PackageCheck className="w-3.5 h-3.5 text-teal-400" />
                      <span>রিপোর্ট ডেলিভারি</span>
                    </button>
                    <button
                      onClick={() => {
                        onSelectAction?.('lab', scannedPatient?.id || matchedScanResult.labReport?.patientId || '');
                        onClose();
                      }}
                      className="px-3.5 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Activity className="w-3.5 h-3.5" />
                      <span>ল্যাব সেন্টার</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Direct Scanned Admission Slip Match Banner */}
              {matchedScanResult && matchedScanResult.type === 'admission' && (
                <div className="p-4 rounded-2xl border-2 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fadeIn bg-gradient-to-r from-purple-50 via-indigo-50 to-slate-50 border-purple-400 text-purple-950">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-purple-700 text-white shadow-sm">
                      <Bed className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-purple-700 text-white">
                          ইনপেশেন্ট এডমিশন স্লিপ স্ক্যান সফল (IPD ADMISSION VERIFIED)
                        </span>
                        <span className="font-mono font-black text-sm text-purple-900">{matchedScanResult.id}</span>
                      </div>
                      <p className="text-xs font-bold mt-0.5 text-purple-800">
                        ভর্তিকৃত রোগী: {matchedScanResult.admission?.patientName || scannedPatient?.name || 'N/A'} • বেড: {matchedScanResult.admission?.bedNumber || 'N/A'} ({matchedScanResult.admission?.wardType || ''})
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-wrap">
                    {onOpenAdmissionSlipPrint && matchedScanResult.admission && (
                      <button
                        onClick={() => {
                          onOpenAdmissionSlipPrint(matchedScanResult.admission!);
                          onClose();
                        }}
                        className="px-3.5 py-1.5 bg-purple-800 hover:bg-purple-900 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>বেড টিকিট / এডমিশন স্লিপ প্রিন্ট</span>
                      </button>
                    )}
                    <button
                      onClick={() => {
                        onSelectAction?.('ipd', scannedPatient?.id || matchedScanResult.admission?.patientId || '');
                        onClose();
                      }}
                      className="px-3.5 py-1.5 bg-indigo-700 hover:bg-indigo-800 text-white rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Bed className="w-3.5 h-3.5" />
                      <span>ইনডোর ওয়ার্ড (IPD)</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Direct Scanned Patient Card Match Banner */}
              {matchedScanResult && matchedScanResult.type === 'patient' && scannedPatient && (
                <div className="p-4 rounded-2xl border-2 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fadeIn bg-gradient-to-r from-emerald-50 via-teal-50 to-cyan-50 border-emerald-400 text-emerald-950">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-emerald-700 text-white shadow-sm">
                      <User className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-emerald-700 text-white">
                          রোগীর হেলথ কার্ড স্ক্যান সফল
                        </span>
                        <span className="font-mono font-black text-sm text-emerald-900">{scannedPatient.id}</span>
                      </div>
                      <p className="text-xs font-bold mt-0.5 text-emerald-800">
                        {scannedPatient.name} • {scannedPatient.age} বছর • রক্তের গ্রুপ: {scannedPatient.bloodGroup} • ফোন: {scannedPatient.phone}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-wrap">
                    {onOpenPatientCardPrint && (
                      <button
                        onClick={() => {
                          onOpenPatientCardPrint(scannedPatient);
                          onClose();
                        }}
                        className="px-3.5 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>স্মার্ট হেলথ কার্ড প্রিন্ট</span>
                      </button>
                    )}
                    <button
                      onClick={() => {
                        onSelectAction?.('bill', scannedPatient.id);
                        onClose();
                      }}
                      className="px-3.5 py-1.5 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Receipt className="w-3.5 h-3.5" />
                      <span>নতুন বিল / রিসিট</span>
                    </button>
                    <button
                      onClick={() => {
                        onSelectAction?.('prescribe', scannedPatient.id);
                        onClose();
                      }}
                      className="px-3.5 py-1.5 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>প্রেসক্রিপশন</span>
                    </button>
                  </div>
                </div>
              )}

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
                    onSelectAction?.('pharmacy', scannedPatient.id);
                    onClose();
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white flex items-center gap-2 shadow-sm transition-all cursor-pointer"
                >
                  <Pill className="w-4 h-4 text-emerald-300" />
                  Pharmacy Dispense
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
                      {patientInvoices.map((inv) => {
                        const isDirectMatch = matchedScanResult?.id === inv.id;
                        return (
                          <div
                            key={inv.id}
                            className={`p-3 rounded-xl border transition-all text-xs ${
                              isDirectMatch
                                ? 'bg-emerald-50/90 border-emerald-400 ring-2 ring-emerald-500 shadow-md'
                                : 'border-slate-100 bg-slate-50/50 hover:bg-white hover:border-slate-300'
                            }`}
                          >
                            <div className="flex items-center justify-between font-medium">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-slate-800 font-bold">{inv.id}</span>
                                {isDirectMatch && (
                                  <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-emerald-600 text-white animate-pulse">
                                    Scanned Match ✓
                                  </span>
                                )}
                              </div>
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
                        );
                      })}
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
                      {patientPrescriptions.map((rx) => {
                        const isDirectMatch = matchedScanResult?.id === rx.id;
                        return (
                          <div
                            key={rx.id}
                            className={`p-3 rounded-xl border transition-all text-xs ${
                              isDirectMatch
                                ? 'bg-teal-50/90 border-teal-400 ring-2 ring-teal-500 shadow-md'
                                : 'border-slate-100 bg-slate-50/50 hover:bg-white hover:border-slate-300'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-teal-700">{rx.id}</span>
                                {isDirectMatch && (
                                  <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-teal-600 text-white animate-pulse">
                                    Scanned Match ✓
                                  </span>
                                )}
                              </div>
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
                        );
                      })}
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
