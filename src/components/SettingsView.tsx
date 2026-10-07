import React, { useState, useRef, useMemo } from 'react';
import {
  Building2,
  Save,
  RotateCcw,
  CheckCircle2,
  FileText,
  Receipt,
  Activity,
  Calendar,
  Sparkles,
  Phone,
  Mail,
  Globe,
  MapPin,
  ShieldCheck,
  Eye,
  Upload,
  Image as ImageIcon,
  Trash2,
  Link,
  Check,
  Bed,
  PlusCircle,
  Edit2,
  Search,
  Filter,
  Layers,
  DoorOpen,
  AlertCircle,
  X,
  Lock,
  User,
  Clock,
  Stethoscope,
} from 'lucide-react';
import { HospitalSettings, HospitalBed, IPDAdmission, WardType } from '../types';
import { HospitalEmblem } from './HospitalEmblem';
import { BarcodeRenderer } from './BarcodeRenderer';
import { DEFAULT_WARD_RATES, getWardRate } from '../utils/bedRentBilling';

interface SettingsViewProps {
  settings: HospitalSettings;
  onUpdateSettings: (newSettings: HospitalSettings) => void;
  beds?: HospitalBed[];
  onUpdateBeds?: (newBeds: HospitalBed[]) => void;
  admissions?: IPDAdmission[];
}

const PRESET_TEMPLATES: Array<{ label: string; settings: HospitalSettings }> = [
  {
    label: '🏥 MedPulse Specialized Hospital & Diagnostic Center',
    settings: {
      name: 'MEDPULSE SPECIALIZED HOSPITAL & DIAGNOSTIC CENTER',
      nameBangla: 'MedPulse Specialized Hospital & Diagnostic Center',
      slogan: 'Excellence in Healthcare • 24/7 Emergency & Specialist Medical Services',
      address: 'House # 12, Road # 7, Dhanmondi, Dhaka-1205, Bangladesh',
      addressEnglish: 'DHANMONDI, DHAKA-1205, BANGLADESH',
      phone: '+880 2-9876543, +880 1711-000000, +880 1769-015993',
      hotline: '10678 (Hotline)',
      email: 'info@medpulsebd.com',
      website: 'www.medpulsebd.com',
      govtRegNo: 'DGHS Reg No: 2026/DH-4821',
      prescriptionDept: 'DEPARTMENT OF CLINICAL CONSULTATION (OPD)',
      billingDept: 'DEPARTMENT OF FINANCE & CASH COUNTER',
      labDept: 'DEPARTMENT OF PATHOLOGY & CLINICAL LAB',
      appointmentDept: 'DEPARTMENT OF OUTPATIENT (OPD) & APPOINTMENT DESK',
      footerNotice: 'For emergencies, call our helpline 10678. Wishing you good health.',
    },
  },
  {
    label: '🏨 Central Care Hospital & Research Institute',
    settings: {
      name: 'CENTRAL CARE HOSPITAL & RESEARCH INSTITUTE',
      nameBangla: 'Central Care Hospital & Research Institute',
      slogan: 'Accurate Diagnosis & Compassionate Medical Care',
      address: 'Main Road, Mirpur-10, Dhaka-1216, Bangladesh',
      addressEnglish: 'MIRPUR-10, DHAKA-1216, BANGLADESH',
      phone: '+880 2-809876, +880 1819-112233',
      hotline: '+880 9612-334455',
      email: 'contact@centralcarebd.org',
      website: 'www.centralcarebd.org',
      govtRegNo: 'DGHS Reg No: 2026/MR-9901',
      prescriptionDept: 'DEPARTMENT OF CLINICAL CONSULTATION (OPD)',
      billingDept: 'ACCOUNTS & CASH COLLECTION DESK',
      labDept: 'DEPARTMENT OF DIAGNOSTIC & MOLECULAR LAB',
      appointmentDept: 'PATIENT CARE & APPOINTMENT DESK',
      footerNotice: '24/7 Emergency & Critical Care Services available.',
    },
  },
  {
    label: '🔬 Popular Digital Diagnostic & Lab Complex',
    settings: {
      name: 'POPULAR DIGITAL DIAGNOSTIC & CONSULTATION COMPLEX',
      nameBangla: 'Popular Digital Diagnostic & Consultation Complex',
      slogan: 'Advanced Technology & Precision Diagnostic Services',
      address: 'Chawkbazar Road, Kotwali, Chattogram, Bangladesh',
      addressEnglish: 'CHAWKBAZAR, CHATTOGRAM, BANGLADESH',
      phone: '+880 31-654321, +880 1912-987654',
      hotline: '+880 1800-778899',
      email: 'info@populardiagnosticctgbd.com',
      website: 'www.populardiagnosticctgbd.com',
      govtRegNo: 'DGHS Reg No: 2026/CTG-3312',
      prescriptionDept: 'DEPARTMENT OF SPECIALIST CONSULTATION (OPD)',
      billingDept: 'BILLING & CASH COUNTER',
      labDept: 'DEPARTMENT OF CLINICAL PATHOLOGY & IMAGING',
      appointmentDept: 'APPOINTMENT & REGISTRATION DESK',
      footerNotice: 'Reports & test results can be verified online via Patient Portal.',
    },
  },
];

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onUpdateSettings,
  beds = [],
  onUpdateBeds,
  admissions = [],
}) => {
  const [formData, setFormData] = useState<HospitalSettings>({ ...settings });
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [activeSettingsTab, setActiveSettingsTab] = useState<'branding' | 'beds' | 'rates'>('branding');
  const [activePreviewType, setActivePreviewType] = useState<
    'prescription' | 'invoice' | 'lab' | 'appointment'
  >('prescription');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Bed & Cabin Rental Rates State
  const [wardRates, setWardRates] = useState<Record<WardType, number>>(() => ({
    'General Ward': getWardRate(settings, 'General Ward'),
    'Male Ward': getWardRate(settings, 'Male Ward'),
    'Female Ward': getWardRate(settings, 'Female Ward'),
    'Semi-Cabin': getWardRate(settings, 'Semi-Cabin'),
    'VIP Cabin': getWardRate(settings, 'VIP Cabin'),
    'ICU': getWardRate(settings, 'ICU'),
    'CCU': getWardRate(settings, 'CCU'),
    'Post-Operative': getWardRate(settings, 'Post-Operative'),
  }));

  // Beds Management State
  const [bedSearch, setBedSearch] = useState('');
  const [wardFilter, setWardFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'available' | 'occupied'>('all');
  const [bedViewMode, setBedViewMode] = useState<'rooms' | 'table'>('rooms');

  // Add / Edit Bed Modal State
  const [isBedModalOpen, setIsBedModalOpen] = useState(false);
  const [editingBed, setEditingBed] = useState<HospitalBed | null>(null);
  const [bedFormNumber, setBedFormNumber] = useState('');
  const [bedFormRoom, setBedFormRoom] = useState('');
  const [bedFormWard, setBedFormWard] = useState<WardType>('General Ward');
  const [bedFormFloor, setBedFormFloor] = useState('2nd Floor (Ward A)');
  const [bedFormRate, setBedFormRate] = useState<number>(() => wardRates['General Ward'] || 800);
  const [bedFormFeatures, setBedFormFeatures] = useState<string[]>(['Oxygen Support', 'Nurse Call Bell']);
  const [customFeatureInput, setCustomFeatureInput] = useState('');
  const [bedActionMsg, setBedActionMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Batch Room Setup State
  const [isBatchRoomModalOpen, setIsBatchRoomModalOpen] = useState(false);
  const [batchRoomName, setBatchRoomName] = useState('Room 103');
  const [batchWard, setBatchWard] = useState<WardType>('General Ward');
  const [batchFloor, setBatchFloor] = useState('2nd Floor (Ward A)');
  const [batchBedCount, setBatchBedCount] = useState<number>(3);
  const [batchBedPrefix, setBatchBedPrefix] = useState('Bed 103-');
  const [batchRate, setBatchRate] = useState<number>(() => wardRates['General Ward'] || 800);
  const [batchFeatures, setBatchFeatures] = useState<string[]>(['Oxygen Support', 'Nurse Call Bell']);

  const AVAILABLE_AMENITIES = [
    'Oxygen Support',
    'Nurse Call Bell',
    'Adjustable Bed',
    'Bedside Monitor',
    'IV Stand',
    'Attached Bath',
    'Air Conditioned',
    'Attendant Bed',
    'LED TV',
    'Ventilator Compatible',
    'Central Suction',
  ];

  const handleOpenAddBed = (prefilled?: { roomName?: string; wardType?: WardType; floor?: string }) => {
    const targetWard = prefilled?.wardType || 'General Ward';
    setEditingBed(null);
    setBedFormNumber(`Bed ${beds.length + 101}`);
    setBedFormRoom(prefilled?.roomName || 'Room 101');
    setBedFormWard(targetWard);
    setBedFormFloor(prefilled?.floor || '2nd Floor (Ward A)');
    setBedFormRate(wardRates[targetWard] || 1000);
    setBedFormFeatures(['Oxygen Support', 'Nurse Call Bell']);
    setCustomFeatureInput('');
    setIsBedModalOpen(true);
  };

  const handleOpenBatchRoomSetup = () => {
    const nextRoomNum = `Room ${101 + Math.floor(beds.length / 2)}`;
    setBatchRoomName(nextRoomNum);
    setBatchWard('General Ward');
    setBatchFloor('2nd Floor (Ward A)');
    setBatchBedCount(3);
    setBatchBedPrefix(`${nextRoomNum.replace('Room ', 'Bed ')}-`);
    setBatchRate(wardRates['General Ward'] || 800);
    setBatchFeatures(['Oxygen Support', 'Nurse Call Bell']);
    setIsBatchRoomModalOpen(true);
  };

  const handleSaveRates = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const updatedSettings: HospitalSettings = {
      ...formData,
      bedRates: wardRates,
    };
    setFormData(updatedSettings);
    onUpdateSettings(updatedSettings);
    setSavedSuccess(true);
    setBedActionMsg({
      text: 'Bed & Cabin daily rental rates updated and saved successfully!',
      type: 'success',
    });
    setTimeout(() => {
      setSavedSuccess(false);
      setBedActionMsg(null);
    }, 4000);
  };

  const handleSyncRatesToAllBeds = () => {
    if (!onUpdateBeds) return;
    const updatedBeds = beds.map((b) => ({
      ...b,
      dailyRate: wardRates[b.wardType] || b.dailyRate,
    }));
    onUpdateBeds(updatedBeds);
    setBedActionMsg({
      text: `Successfully synced & applied current rate matrix across all ${beds.length} hospital beds!`,
      type: 'success',
    });
    setTimeout(() => setBedActionMsg(null), 4000);
  };

  const handleResetRatesToDefault = () => {
    setWardRates({ ...DEFAULT_WARD_RATES });
    setBedActionMsg({
      text: 'Reset bed & cabin rates to standard factory defaults. Click "Save Pricing Rates" to apply.',
      type: 'success',
    });
    setTimeout(() => setBedActionMsg(null), 3500);
  };

  const handleSaveBatchRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!batchRoomName.trim() || !onUpdateBeds) return;

    const count = Math.max(1, Math.min(12, Number(batchBedCount) || 1));
    const newGeneratedBeds: HospitalBed[] = [];

    for (let i = 0; i < count; i++) {
      const suffix = String.fromCharCode(65 + i); // A, B, C, D...
      const bedNum = `${batchBedPrefix.trim()}${suffix}`;
      newGeneratedBeds.push({
        id: `BED-${Date.now().toString().slice(-4)}-${i + 1}`,
        bedNumber: bedNum,
        roomNumber: batchRoomName.trim(),
        wardType: batchWard,
        floor: batchFloor.trim() || '2nd Floor',
        dailyRate: Number(batchRate) || 1200,
        isOccupied: false,
        features: batchFeatures,
      });
    }

    onUpdateBeds([...beds, ...newGeneratedBeds]);
    setIsBatchRoomModalOpen(false);
    setBedActionMsg({
      text: `Successfully created "${batchRoomName}" with ${count} beds (${batchBedPrefix}A to ${batchBedPrefix}${String.fromCharCode(64 + count)})!`,
      type: 'success',
    });
    setTimeout(() => setBedActionMsg(null), 4000);
  };

  const handleOpenEditBed = (b: HospitalBed) => {
    setEditingBed(b);
    setBedFormNumber(b.bedNumber);
    setBedFormRoom(b.roomNumber || '');
    setBedFormWard(b.wardType);
    setBedFormFloor(b.floor);
    setBedFormRate(b.dailyRate);
    setBedFormFeatures(b.features || []);
    setCustomFeatureInput('');
    setIsBedModalOpen(true);
  };

  const handleSaveBed = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bedFormNumber.trim()) return;
    if (!onUpdateBeds) return;

    if (editingBed) {
      const updated = beds.map((b) =>
        b.id === editingBed.id
          ? {
              ...b,
              bedNumber: bedFormNumber.trim(),
              roomNumber: bedFormRoom.trim() || `${bedFormWard} - Room`,
              wardType: bedFormWard,
              floor: bedFormFloor.trim(),
              dailyRate: Number(bedFormRate) || 0,
              features: bedFormFeatures,
            }
          : b
      );
      onUpdateBeds(updated);
      setBedActionMsg({ text: `Bed "${bedFormNumber}" updated successfully!`, type: 'success' });
    } else {
      const newBed: HospitalBed = {
        id: `BED-${Date.now().toString().slice(-4)}`,
        bedNumber: bedFormNumber.trim(),
        roomNumber: bedFormRoom.trim() || `${bedFormWard} - Room`,
        wardType: bedFormWard,
        floor: bedFormFloor.trim() || '2nd Floor',
        dailyRate: Number(bedFormRate) || 1200,
        isOccupied: false,
        features: bedFormFeatures,
      };
      onUpdateBeds([newBed, ...beds]);
      setBedActionMsg({ text: `New Bed "${newBed.bedNumber}" registered in hospital setup!`, type: 'success' });
    }

    setIsBedModalOpen(false);
    setTimeout(() => setBedActionMsg(null), 3500);
  };

  const handleDeleteBed = (b: HospitalBed) => {
    if (b.isOccupied) {
      setBedActionMsg({
        text: `Cannot delete ${b.bedNumber}: A patient is currently admitted! Discharge patient first in IPD.`,
        type: 'error',
      });
      setTimeout(() => setBedActionMsg(null), 4000);
      return;
    }
    if (window.confirm(`Are you sure you want to remove "${b.bedNumber}" from hospital inventory?`)) {
      if (onUpdateBeds) {
        const updated = beds.filter((item) => item.id !== b.id);
        onUpdateBeds(updated);
        setBedActionMsg({ text: `${b.bedNumber} removed from hospital inventory.`, type: 'success' });
        setTimeout(() => setBedActionMsg(null), 3000);
      }
    }
  };

  const toggleFeature = (feat: string) => {
    if (bedFormFeatures.includes(feat)) {
      setBedFormFeatures(bedFormFeatures.filter((f) => f !== feat));
    } else {
      setBedFormFeatures([...bedFormFeatures, feat]);
    }
  };

  const addCustomFeature = () => {
    if (customFeatureInput.trim() && !bedFormFeatures.includes(customFeatureInput.trim())) {
      setBedFormFeatures([...bedFormFeatures, customFeatureInput.trim()]);
      setCustomFeatureInput('');
    }
  };

  const filteredBeds = useMemo(() => {
    return beds.filter((b) => {
      const matchWard = wardFilter === 'all' || b.wardType === wardFilter;
      const matchStatus =
        statusFilter === 'all' ||
        (statusFilter === 'available' && !b.isOccupied) ||
        (statusFilter === 'occupied' && b.isOccupied);
      const q = bedSearch.toLowerCase();
      const matchSearch =
        !q ||
        b.bedNumber.toLowerCase().includes(q) ||
        (b.roomNumber && b.roomNumber.toLowerCase().includes(q)) ||
        b.floor.toLowerCase().includes(q) ||
        (b.currentPatientName && b.currentPatientName.toLowerCase().includes(q)) ||
        (b.currentPatientId && b.currentPatientId.toLowerCase().includes(q));
      return matchWard && matchStatus && matchSearch;
    });
  }, [beds, wardFilter, statusFilter, bedSearch]);

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

  // Overall Statistics
  const totalBedsCount = beds.length;
  const occupiedBedsCount = beds.filter((b) => b.isOccupied).length;
  const availableBedsCount = totalBedsCount - occupiedBedsCount;
  const totalRoomsCount = new Set(beds.map((b) => b.roomNumber || b.wardType)).size;

  const handleChange = (field: keyof HospitalSettings, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    setSavedSuccess(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setUploadError('Please select a valid image file (PNG, JPG, SVG, WebP).');
      return;
    }

    setUploadError(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (!dataUrl) return;

      const img = new Image();
      img.onload = () => {
        const maxDim = 360;
        let width = img.width;
        let height = img.height;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const optimized = canvas.toDataURL('image/png', 0.95);
          handleChange('customLogoUrl', optimized);
        } else {
          handleChange('customLogoUrl', dataUrl);
        }
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    handleChange('customLogoUrl', '');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSettings(formData);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 4000);
  };

  const handleApplyPreset = (preset: HospitalSettings) => {
    setFormData(preset);
    onUpdateSettings(preset);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-2xl shadow-md border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5" />
              Hospital Settings & Capacity Setup
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
            Hospital System Configuration
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
            Configure hospital branding, official letterheads, and manage your complete inventory of hospital beds and rooms for patient admissions.
          </p>
        </div>

        {activeSettingsTab === 'branding' && (
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={handleSubmit}
              className="px-5 py-2.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-xl text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-teal-500/20 transition-all cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Save Branding</span>
            </button>
          </div>
        )}

        {activeSettingsTab === 'beds' && (
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={handleOpenBatchRoomSetup}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-purple-200 hover:text-white font-bold rounded-xl text-xs sm:text-sm flex items-center gap-2 border border-slate-700 transition-all cursor-pointer"
            >
              <DoorOpen className="w-4 h-4 text-purple-400" />
              <span>+ Setup Room (Multi-Bed)</span>
            </button>
            <button
              onClick={() => handleOpenAddBed()}
              className="px-4 py-2.5 bg-purple-500 hover:bg-purple-400 text-white font-bold rounded-xl text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-purple-500/20 transition-all cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>+ Add Hospital Bed</span>
            </button>
          </div>
        )}

        {activeSettingsTab === 'rates' && (
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleSyncRatesToAllBeds}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-indigo-200 hover:text-white font-bold rounded-xl text-xs sm:text-sm flex items-center gap-2 border border-slate-700 transition-all cursor-pointer"
              title="Apply these daily rates to all beds currently registered"
            >
              <RotateCcw className="w-4 h-4 text-indigo-400" />
              <span>Apply to All {beds.length} Beds</span>
            </button>
            <button
              type="button"
              onClick={() => handleSaveRates()}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-indigo-500/20 transition-all cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Save Pricing Rates</span>
            </button>
          </div>
        )}
      </div>

      {/* Settings Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveSettingsTab('branding')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
            activeSettingsTab === 'branding'
              ? 'bg-slate-900 text-white shadow-md'
              : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Building2 className="w-4 h-4 text-teal-400" />
          <span>Hospital Profile & Branding</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSettingsTab('beds')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
            activeSettingsTab === 'beds'
              ? 'bg-purple-900 text-white shadow-md'
              : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Bed className="w-4 h-4 text-purple-400" />
          <span>Hospital Beds & Rooms ({beds.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSettingsTab('rates')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
            activeSettingsTab === 'rates'
              ? 'bg-indigo-950 text-white shadow-md'
              : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Receipt className="w-4 h-4 text-indigo-400" />
          <span>Bed & Cabin Rent Pricing</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-900 border border-indigo-200">
            24h Auto-Billing
          </span>
        </button>
      </div>

      {bedActionMsg && (
        <div
          className={`p-3.5 rounded-xl border text-xs sm:text-sm font-semibold flex items-center gap-2 animate-fadeIn ${
            bedActionMsg.type === 'success'
              ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
              : 'bg-rose-50 border-rose-300 text-rose-800'
          }`}
        >
          {bedActionMsg.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{bedActionMsg.text}</span>
        </div>
      )}

      {savedSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-800 text-xs sm:text-sm font-semibold flex items-center gap-2.5 animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>
            Hospital settings saved successfully! All prescriptions, invoices, money receipts, and lab reports have been updated with the new branding.
          </span>
        </div>
      )}

      {/* TAB 1: HOSPITAL BRANDING & PRINT PROFILE */}
      {activeSettingsTab === 'branding' && (
        <>
          {/* Quick Presets */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            Quick Preset Templates (1-Click Setup)
          </h3>
          <span className="text-[11px] text-slate-500 font-medium hidden sm:inline">
            Clicking a preset populates all branding fields automatically
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {PRESET_TEMPLATES.map((tmpl, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleApplyPreset(tmpl.settings)}
              className="p-3 text-left rounded-xl border border-slate-200 hover:border-teal-500 hover:bg-teal-50/40 transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div className="font-bold text-xs text-slate-900 group-hover:text-teal-900 line-clamp-1">
                {tmpl.label}
              </div>
              <div className="text-[11px] text-slate-500 mt-1 font-mono line-clamp-1">
                {tmpl.settings.addressEnglish}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Form on Left, Live Preview on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Settings Form (7 Columns) */}
        <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Section 0: Hospital Logo Upload */}
            <div className="space-y-4 p-4.5 rounded-2xl bg-slate-50/80 border border-slate-200">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-teal-600" />
                  Hospital Logo Upload & Customization
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-teal-100 text-teal-800">
                  Visible on all printable documents
                </span>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-5">
                {/* Logo Preview Circle */}
                <div className="flex flex-col items-center gap-1.5 shrink-0">
                  <div className="w-24 h-24 rounded-2xl border-2 border-dashed border-teal-400 bg-white p-2 flex items-center justify-center shadow-xs overflow-hidden relative group">
                    <HospitalEmblem
                      size={72}
                      customLogoUrl={formData.customLogoUrl}
                      altText={formData.name || 'Hospital Logo'}
                    />
                  </div>
                  <span className="text-[10px] text-slate-500 font-medium">
                    {formData.customLogoUrl ? 'Custom Logo Active' : 'Default Emblem Active'}
                  </span>
                </div>

                {/* Upload Action Buttons */}
                <div className="flex-1 space-y-2.5 text-center sm:text-left w-full">
                  <p className="text-xs text-slate-600 font-medium">
                    Upload your hospital or clinic logo. It will print at the top of prescriptions, billing receipts, lab reports, and appointment letters.
                  </p>

                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                      id="hospital-logo-file-input"
                    />

                    <label
                      htmlFor="hospital-logo-file-input"
                      className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-xs cursor-pointer transition-all active:scale-95"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload Logo File</span>
                    </label>

                    {formData.customLogoUrl && (
                      <button
                        type="button"
                        onClick={handleRemoveLogo}
                        className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                        title="Remove custom logo and restore default emblem"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                        <span>Remove</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => setShowUrlInput(!showUrlInput)}
                      className="px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Link className="w-3.5 h-3.5 text-slate-500" />
                      <span>{showUrlInput ? 'Hide URL' : 'Use Image URL'}</span>
                    </button>
                  </div>

                  {uploadError && (
                    <p className="text-[11px] text-rose-600 font-bold">{uploadError}</p>
                  )}

                  {showUrlInput && (
                    <div className="pt-2 animate-fadeIn">
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">
                        Online Image URL:
                      </label>
                      <input
                        type="url"
                        value={formData.customLogoUrl || ''}
                        onChange={(e) => handleChange('customLogoUrl', e.target.value)}
                        placeholder="https://example.com/hospital-logo.png"
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Section 1: Hospital Primary Identity */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-teal-600" />
                1. Hospital Name & Primary Branding (Header Title)
              </h3>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Hospital Official Name (English - Printable Header) *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="e.g. MEDPULSE SPECIALIZED HOSPITAL & DIAGNOSTIC CENTER"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-500 uppercase"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  Printed in large, bold font at the top of prescriptions, receipts, and lab reports.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Secondary Name / Local Name
                </label>
                <input
                  type="text"
                  value={formData.nameBangla}
                  onChange={(e) => handleChange('nameBangla', e.target.value)}
                  placeholder="e.g. MedPulse Specialized Hospital & Diagnostic Complex"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Slogan / Tagline
                </label>
                <input
                  type="text"
                  value={formData.slogan}
                  onChange={(e) => handleChange('slogan', e.target.value)}
                  placeholder="e.g. Excellence in Healthcare • 24/7 Emergency & Specialist Medical Care"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            {/* Section 2: Address & Location */}
            <div className="space-y-4 pt-2">
              <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-600" />
                2. Address & Location
              </h3>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Header Address (English - Subtitle) *
                </label>
                <input
                  type="text"
                  required
                  value={formData.addressEnglish}
                  onChange={(e) => handleChange('addressEnglish', e.target.value)}
                  placeholder="e.g. DHANMONDI, DHAKA-1205, BANGLADESH"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-500 uppercase"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Full Street Address
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => handleChange('address', e.target.value)}
                  placeholder="e.g. House # 12, Road # 7, Dhanmondi, Dhaka-1205"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            {/* Section 3: Contact & Communication */}
            <div className="space-y-4 pt-2">
              <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
                <Phone className="w-4 h-4 text-sky-600" />
                3. Contact Numbers & Online Details
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Phone / Reception Desk
                  </label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    placeholder="e.g. +880 2-9876543, +880 1711-000000"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    24/7 Emergency Helpline / Hotline
                  </label>
                  <input
                    type="text"
                    value={formData.hotline}
                    onChange={(e) => handleChange('hotline', e.target.value)}
                    placeholder="e.g. 10678, +880 1769-015993"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Official Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    placeholder="e.g. info@medpulsebd.com"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Website</label>
                  <input
                    type="text"
                    value={formData.website}
                    onChange={(e) => handleChange('website', e.target.value)}
                    placeholder="e.g. www.medpulsebd.com"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Government License / DGHS Reg No.
                </label>
                <input
                  type="text"
                  value={formData.govtRegNo}
                  onChange={(e) => handleChange('govtRegNo', e.target.value)}
                  placeholder="e.g. DGHS Reg No: 2026/DH-4821"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-500 font-mono"
                />
              </div>
            </div>

            {/* Section 4: Departments Subtitle Headers */}
            <div className="space-y-4 pt-2">
              <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-purple-600" />
                4. Printable Department Subtitles
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Prescription Department Title
                  </label>
                  <input
                    type="text"
                    value={formData.prescriptionDept}
                    onChange={(e) => handleChange('prescriptionDept', e.target.value)}
                    placeholder="DEPARTMENT OF CLINICAL CONSULTATION (OPD)"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 uppercase"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Billing & Accounts Department Title
                  </label>
                  <input
                    type="text"
                    value={formData.billingDept}
                    onChange={(e) => handleChange('billingDept', e.target.value)}
                    placeholder="DEPARTMENT OF FINANCE & CASH COUNTER"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 uppercase"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Lab & Pathology Department Title
                  </label>
                  <input
                    type="text"
                    value={formData.labDept}
                    onChange={(e) => handleChange('labDept', e.target.value)}
                    placeholder="DEPARTMENT OF PATHOLOGY & CLINICAL LAB"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 uppercase"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Appointment & OPD Desk Title
                  </label>
                  <input
                    type="text"
                    value={formData.appointmentDept}
                    onChange={(e) => handleChange('appointmentDept', e.target.value)}
                    placeholder="DEPARTMENT OF OUTPATIENT (OPD) & APPOINTMENT DESK"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 uppercase"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Document Footer Notice Message
                </label>
                <input
                  type="text"
                  value={formData.footerNotice || ''}
                  onChange={(e) => handleChange('footerNotice', e.target.value)}
                  placeholder="e.g. For emergency medical assistance, contact helpline 10678."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            {/* Save Button */}
            <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setFormData({ ...settings })}
                className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Reset
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl text-xs sm:text-sm flex items-center gap-2 shadow-md transition-all cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Save Changes</span>
              </button>
            </div>
          </form>
        </div>

        {/* Live Preview Column (5 Columns) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="sticky top-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-teal-600" />
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Live Print Preview
                </h3>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-teal-50 text-teal-700 font-bold border border-teal-200">
                A4 Header View
              </span>
            </div>

            {/* Document Type Switcher */}
            <div className="grid grid-cols-4 gap-1 p-1 bg-slate-100 rounded-xl">
              <button
                type="button"
                onClick={() => setActivePreviewType('prescription')}
                className={`py-1.5 px-2 text-[10px] font-bold rounded-lg transition-all text-center cursor-pointer ${
                  activePreviewType === 'prescription'
                    ? 'bg-white text-purple-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Prescription
              </button>
              <button
                type="button"
                onClick={() => setActivePreviewType('invoice')}
                className={`py-1.5 px-2 text-[10px] font-bold rounded-lg transition-all text-center cursor-pointer ${
                  activePreviewType === 'invoice'
                    ? 'bg-white text-indigo-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Receipt & Due
              </button>
              <button
                type="button"
                onClick={() => setActivePreviewType('lab')}
                className={`py-1.5 px-2 text-[10px] font-bold rounded-lg transition-all text-center cursor-pointer ${
                  activePreviewType === 'lab'
                    ? 'bg-white text-emerald-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Lab Report
              </button>
              <button
                type="button"
                onClick={() => setActivePreviewType('appointment')}
                className={`py-1.5 px-2 text-[10px] font-bold rounded-lg transition-all text-center cursor-pointer ${
                  activePreviewType === 'appointment'
                    ? 'bg-white text-sky-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Appointment
              </button>
            </div>

            {/* Rendered Live Header Paper Card */}
            <div className="bg-white border-2 border-slate-400 p-4 rounded-xl shadow-inner space-y-3 font-sans">
              {/* 1. Header with Custom Logo / Emblem and Hospital Name */}
              <div className="flex items-center gap-3 pb-2 border-b-2 border-slate-900">
                <HospitalEmblem
                  size={56}
                  customLogoUrl={formData.customLogoUrl}
                  altText={formData.name || 'Hospital Logo'}
                />
                <div className="flex-1 text-center min-w-0">
                  <h4 className="text-xs sm:text-sm font-black text-[#581c87] tracking-tight uppercase leading-tight font-serif truncate">
                    {formData.name || 'HOSPITAL NAME'}
                  </h4>
                  <p className="text-[10px] font-bold text-[#15803d] uppercase tracking-wider truncate">
                    {formData.addressEnglish || 'LOCATION, DHAKA, BANGLADESH'}
                  </p>
                  <p className="text-[9px] font-bold text-[#0891b2] uppercase tracking-wide truncate">
                    {activePreviewType === 'prescription'
                      ? formData.prescriptionDept
                      : activePreviewType === 'invoice'
                      ? formData.billingDept
                      : activePreviewType === 'lab'
                      ? formData.labDept
                      : formData.appointmentDept}
                  </p>
                  <p className="text-[8px] text-slate-600 font-medium leading-tight truncate">
                    Tel: {formData.phone} | Hotline: {formData.hotline} | Email: {' '}
                    {formData.email}
                  </p>
                </div>
              </div>

              {/* 2. Dual-Barcode & Patient Row */}
              <div className="border border-slate-600 p-2 text-[10px] bg-slate-50/70">
                <div className="flex items-center justify-between gap-1 pb-1.5 border-b border-slate-400">
                  <div className="flex flex-col items-start w-28 shrink-0">
                    <span className="text-[7px] font-bold text-slate-600 uppercase">
                      PATIENT ID
                    </span>
                    <BarcodeRenderer
                      value="P-2026-001"
                      height={18}
                      width={0.9}
                      displayValue={false}
                    />
                    <span className="text-[7px] font-mono text-slate-500 font-bold">
                      P-2026-001
                    </span>
                  </div>

                  <div className="flex-1 text-center font-bold text-slate-900 text-[10px] uppercase">
                    {activePreviewType === 'prescription'
                      ? 'PRESCRIPTION LETTERHEAD'
                      : activePreviewType === 'invoice'
                      ? 'OFFICIAL MONEY RECEIPT / DUE'
                      : activePreviewType === 'lab'
                      ? 'LAB TEST REPORT'
                      : 'APPOINTMENT CONFIRMATION'}
                  </div>

                  <div className="flex flex-col items-end w-28 shrink-0">
                    <span className="text-[7px] font-bold text-slate-600 uppercase">
                      {activePreviewType === 'prescription'
                        ? 'RX ID'
                        : activePreviewType === 'invoice'
                        ? 'INVOICE ID'
                        : activePreviewType === 'lab'
                        ? 'REPORT ID'
                        : 'SLIP ID'}
                    </span>
                    <BarcodeRenderer
                      value={
                        activePreviewType === 'prescription'
                          ? 'RX-2026-001'
                          : activePreviewType === 'invoice'
                          ? 'INV-2026-1001'
                          : activePreviewType === 'lab'
                          ? 'LAB-2026-501'
                          : 'APT-101'
                      }
                      height={18}
                      width={0.9}
                      displayValue={false}
                    />
                    <span className="text-[7px] font-mono text-slate-500 font-bold">
                      {activePreviewType === 'prescription'
                        ? 'RX-2026-001'
                        : activePreviewType === 'invoice'
                        ? 'INV-2026-1001'
                        : activePreviewType === 'lab'
                        ? 'LAB-2026-501'
                        : 'APT-101'}
                    </span>
                  </div>
                </div>

                <div className="pt-1.5 grid grid-cols-3 gap-1 text-[9px]">
                  <div>
                    <span className="text-slate-500 block text-[7px] uppercase font-bold">
                      Patient Name
                    </span>
                    <span className="font-bold text-slate-800">Md. Kamal Hossain</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[7px] uppercase font-bold">
                      Age / Gender
                    </span>
                    <span className="font-medium text-slate-800">45 Yrs / Male</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[7px] uppercase font-bold">
                      Date
                    </span>
                    <span className="font-mono text-slate-800">2026-10-05</span>
                  </div>
                </div>
              </div>

              {/* Sample Body Snippet */}
              <div className="p-3 bg-white border border-slate-200 rounded-lg text-[9px] text-slate-600 space-y-1">
                <div className="flex items-center justify-between text-[10px] font-bold text-slate-800 border-b pb-1">
                  <span>Document Content Body</span>
                  <span className="text-teal-700">✓ Dynamic Header & Logo Linked</span>
                </div>
                <p className="text-[9px] text-slate-500 italic">
                  Prescriptions, invoices, due slips, lab reports, and appointment cards will print with the configured header and logo above.
                </p>
              </div>

              {/* Footer Notice */}
              <div className="pt-2 border-t border-slate-300 text-center text-[8px] text-slate-500">
                {formData.footerNotice || 'For emergency medical assistance, contact helpline.'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )}

      {/* TAB 2: HOSPITAL BEDS & ROOM SETUP */}
      {activeSettingsTab === 'beds' && (
        <div className="space-y-6">
          {/* Capacity Metrics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[11px] font-bold uppercase text-slate-500 flex items-center gap-1.5">
                <Bed className="w-3.5 h-3.5 text-purple-600" />
                Total Hospital Beds
              </span>
              <p className="text-2xl font-black text-slate-900 mt-1">{totalBedsCount}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Configured in hospital database</p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[11px] font-bold uppercase text-slate-500 flex items-center gap-1.5">
                <DoorOpen className="w-3.5 h-3.5 text-indigo-600" />
                Rooms & Cabins
              </span>
              <p className="text-2xl font-black text-slate-900 mt-1">{totalRoomsCount}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Distinct hospital wards/rooms</p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-emerald-200 bg-emerald-50/20 shadow-xs">
              <span className="text-[11px] font-bold uppercase text-emerald-800 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Available / Vacant
              </span>
              <p className="text-2xl font-black text-emerald-700 mt-1">{availableBedsCount}</p>
              <p className="text-[10px] text-emerald-600 mt-0.5">Ready for patient admission</p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-purple-200 bg-purple-50/20 shadow-xs">
              <span className="text-[11px] font-bold uppercase text-purple-900 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-purple-600" />
                Booked / Occupied
              </span>
              <p className="text-2xl font-black text-purple-900 mt-1">{occupiedBedsCount}</p>
              <p className="text-[10px] text-purple-600 mt-0.5">
                {totalBedsCount > 0 ? Math.round((occupiedBedsCount / totalBedsCount) * 100) : 0}% Occupancy rate
              </p>
            </div>
          </div>

          {/* Controls Bar: Search, Filters, View Modes & Add Bed */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto flex-1">
              {/* Search */}
              <div className="relative flex-1 sm:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search bed no, room, patient..."
                  value={bedSearch}
                  onChange={(e) => setBedSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {/* Ward Filter */}
              <select
                value={wardFilter}
                onChange={(e) => setWardFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 cursor-pointer"
              >
                <option value="all">All Wards & Units</option>
                <option value="General Ward">General Ward</option>
                <option value="Female Ward">Female Ward</option>
                <option value="Male Ward">Male Ward</option>
                <option value="Semi-Cabin">Semi-Cabin</option>
                <option value="VIP Cabin">VIP Cabin</option>
                <option value="ICU">ICU (Intensive Care)</option>
                <option value="CCU">CCU (Coronary Care)</option>
                <option value="Post-Operative">Post-Operative</option>
              </select>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 cursor-pointer"
              >
                <option value="all">All Statuses</option>
                <option value="available">Vacant Only (Available)</option>
                <option value="occupied">Occupied Only (Booked)</option>
              </select>
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto justify-end">
              {/* View Mode Toggle */}
              <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setBedViewMode('rooms')}
                  className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                    bedViewMode === 'rooms'
                      ? 'bg-white text-purple-950 shadow-xs'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <DoorOpen className="w-3.5 h-3.5" />
                  <span>Room-Wise View</span>
                </button>
                <button
                  type="button"
                  onClick={() => setBedViewMode('table')}
                  className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                    bedViewMode === 'table'
                      ? 'bg-white text-purple-950 shadow-xs'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Table View</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => handleOpenAddBed()}
                className="px-4 py-2 bg-purple-700 hover:bg-purple-600 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer shrink-0"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>+ Add Bed</span>
              </button>
            </div>
          </div>

          {/* VIEW MODE 1: ROOM-WISE GROUPED VIEW */}
          {bedViewMode === 'rooms' && (
            <div className="space-y-5">
              {roomsGrouped.length === 0 ? (
                <div className="py-16 text-center bg-white rounded-3xl border border-slate-200 text-slate-400 space-y-2">
                  <DoorOpen className="w-10 h-10 text-slate-300 mx-auto" />
                  <p className="text-sm font-semibold text-slate-600">No rooms or beds matching the selected filters.</p>
                  <button
                    type="button"
                    onClick={() => handleOpenAddBed()}
                    className="mt-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>Create New Hospital Bed</span>
                  </button>
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

                        {/* Room Occupancy Badge & Quick Add Bed */}
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

                          <button
                            type="button"
                            onClick={() =>
                              handleOpenAddBed({
                                roomName: room.roomName,
                                wardType: room.wardType as WardType,
                                floor: room.floor,
                              })
                            }
                            className="px-2.5 py-1 bg-purple-500/20 hover:bg-purple-500 text-purple-200 hover:text-white border border-purple-500/30 rounded-lg text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
                            title={`Add another bed to ${room.roomName}`}
                          >
                            <PlusCircle className="w-3.5 h-3.5" />
                            <span>+ Add Bed</span>
                          </button>
                        </div>
                      </div>

                      {/* Beds within this Room */}
                      <div className="p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {room.beds.map((b) => (
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
                                <div className="flex items-center gap-2">
                                  <span className="font-mono font-black text-sm text-slate-900">{b.bedNumber}</span>
                                </div>
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
                                  <span className="text-[11px] font-medium text-slate-500">Daily Bed Rate:</span>
                                  <span className="font-mono font-bold text-teal-800">${b.dailyRate} / day</span>
                                </div>

                                {/* Patient Admitted Details if Occupied */}
                                {b.isOccupied ? (
                                  <div className="mt-2 p-2.5 bg-white rounded-xl border border-purple-200 space-y-1 text-xs">
                                    <div className="flex items-center justify-between">
                                      <span className="text-[9px] uppercase font-bold text-purple-800">
                                        Current Admitted Inpatient
                                      </span>
                                      <span className="font-mono text-[9px] font-bold text-teal-700 bg-teal-50 px-1.5 py-0.2 rounded">
                                        {b.currentPatientId}
                                      </span>
                                    </div>
                                    <p className="font-black text-slate-900 text-xs truncate">
                                      {b.currentPatientName || 'Admitted Patient'}
                                    </p>
                                    {b.admissionDiagnosis && (
                                      <p className="text-[10px] text-slate-600 line-clamp-1 italic">
                                        {b.admissionDiagnosis}
                                      </p>
                                    )}
                                    {b.admittedAt && (
                                      <p className="text-[9px] text-slate-400 font-mono">
                                        Admitted: {b.admittedAt}
                                      </p>
                                    )}
                                    <p className="text-[9px] text-purple-700 font-semibold pt-1 border-t border-purple-100">
                                      ✓ Automatically becomes available when discharged in IPD
                                    </p>
                                  </div>
                                ) : (
                                  <div className="mt-2 p-2 bg-emerald-50/60 rounded-xl border border-emerald-200 text-emerald-800 text-[11px] font-semibold flex items-center gap-1.5">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                    <span>Vacant and ready for patient admission</span>
                                  </div>
                                )}

                                {/* Features / Amenities */}
                                {b.features && b.features.length > 0 && (
                                  <div className="pt-2 flex flex-wrap gap-1">
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

                            {/* Actions on Bed */}
                            <div className="mt-3 pt-2.5 border-t border-slate-200 flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => handleOpenEditBed(b)}
                                className="px-2.5 py-1 text-slate-700 hover:bg-slate-200 bg-white border border-slate-300 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer"
                              >
                                <Edit2 className="w-3 h-3 text-slate-600" />
                                <span>Edit</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDeleteBed(b)}
                                disabled={b.isOccupied}
                                title={b.isOccupied ? 'Cannot delete an occupied bed' : 'Remove bed'}
                                className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 ${
                                  b.isOccupied
                                    ? 'opacity-40 cursor-not-allowed bg-slate-100 text-slate-400'
                                    : 'text-rose-600 hover:bg-rose-50 bg-white border border-rose-200 cursor-pointer'
                                }`}
                              >
                                <Trash2 className="w-3 h-3" />
                                <span>Delete</span>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* VIEW MODE 2: TABLE LIST VIEW */}
          {bedViewMode === 'table' && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-900 text-slate-300 uppercase font-bold text-[10px] border-b border-slate-800">
                    <tr>
                      <th className="py-3 px-4">Bed Number</th>
                      <th className="py-3 px-4">Room / Cabin</th>
                      <th className="py-3 px-4">Ward Unit</th>
                      <th className="py-3 px-4">Floor</th>
                      <th className="py-3 px-4 text-right">Daily Rate</th>
                      <th className="py-3 px-4 text-center">Status</th>
                      <th className="py-3 px-4">Current Patient</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredBeds.map((b) => (
                      <tr key={b.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 font-mono font-black text-slate-900">{b.bedNumber}</td>
                        <td className="py-3 px-4 font-bold text-slate-800">{b.roomNumber || '—'}</td>
                        <td className="py-3 px-4 text-slate-600">{b.wardType}</td>
                        <td className="py-3 px-4 text-slate-500">{b.floor}</td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-teal-800">
                          ${b.dailyRate}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              b.isOccupied
                                ? 'bg-purple-100 text-purple-900 border border-purple-200'
                                : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            }`}
                          >
                            {b.isOccupied ? 'Booked' : 'Available'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {b.isOccupied ? (
                            <div>
                              <span className="font-bold text-slate-900">{b.currentPatientName}</span>
                              <span className="font-mono text-[10px] text-slate-400 block">{b.currentPatientId}</span>
                            </div>
                          ) : (
                            <span className="text-slate-400 italic">None (Vacant)</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenEditBed(b)}
                              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg cursor-pointer"
                              title="Edit Bed"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteBed(b)}
                              disabled={b.isOccupied}
                              className={`p-1.5 rounded-lg ${
                                b.isOccupied
                                  ? 'text-slate-300 cursor-not-allowed'
                                  : 'text-rose-600 hover:bg-rose-50 cursor-pointer'
                              }`}
                              title={b.isOccupied ? 'Cannot delete occupied bed' : 'Delete Bed'}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: BED & CABIN RENT PRICING & 24-HOUR AUTO-BILLING RULES */}
      {/* ========================================================================= */}
      {activeSettingsTab === 'rates' && (
        <div className="space-y-6">
          {/* 24-Hour Cycle Rule Explanation Box */}
          <div className="p-5 bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-900 text-white rounded-2xl shadow-md border border-indigo-800/60">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1.5 max-w-3xl">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>24-Hour Automated Billing Logic</span>
                  </span>
                  <span className="text-xs font-semibold text-emerald-400">● Live Synchronization Active</span>
                </div>
                <h3 className="text-base sm:text-lg font-black tracking-tight text-white">
                  বেড ও কেবিন ভাড়া নির্ধারণ এবং ২৪-ঘণ্টা চক্রে স্বয়ংক্রিয় বকেয়া হিসাব
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  পেশেন্টকে অ্যাডমিশন দেওয়ার সাথে সাথে ১ম দিনের বেড ভাড়া কার্যকর হয়। এরপর প্রতি ২৪ ঘণ্টা অতিক্রান্ত হলে স্বয়ংক্রিয়ভাবে পরবর্তী দিনের বেড ভাড়া পেশেন্টের আইডিতে ধার্য হবে। পেশেন্ট যতদিন হাসপাতালে ভর্তি থাকবে, ততদিন এই ২৪ ঘণ্টা হিসাব করে ভাড়া জমা হতে থাকবে এবং ডিসচার্জের সময় সম্পূর্ণ বকেয়া পরিশোধ করতে হবে।
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleResetRatesToDefault}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition-all border border-slate-700 cursor-pointer"
                >
                  Reset Defaults
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveRates()}
                  className="px-4 py-2 bg-indigo-500 hover:bg-indigo-400 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Pricing</span>
                </button>
              </div>
            </div>
          </div>

          {/* Pricing Matrix Form */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
              <div>
                <h4 className="font-black text-sm sm:text-base text-slate-900">
                  Ward & Cabin Category Daily Rent Rate Setup (দৈনিক ভাড়া নির্ধারণ তালিকা)
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Set standard 24-hour daily charges for General Wards, Cabins, and Critical Care Units.
                </p>
              </div>
              <button
                type="button"
                onClick={handleSyncRatesToAllBeds}
                className="px-3.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer self-start sm:self-auto"
              >
                <RotateCcw className="w-3.5 h-3.5 text-indigo-700" />
                <span>Sync to All {beds.length} Registered Beds</span>
              </button>
            </div>

            {/* Matrix Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {(
                [
                  {
                    ward: 'General Ward',
                    labelBangla: 'সাধারণ ওয়ার্ড বেড',
                    badge: 'Standard Ward',
                    badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-200',
                    desc: 'Shared ward with standard patient facilities and nursing support.',
                  },
                  {
                    ward: 'Male Ward',
                    labelBangla: 'পুরুষ ওয়ার্ড বেড',
                    badge: 'Gender Specific',
                    badgeColor: 'bg-blue-50 text-blue-800 border-blue-200',
                    desc: 'Dedicated male patient ward with centralized oxygen lines.',
                  },
                  {
                    ward: 'Female Ward',
                    labelBangla: 'মহিলা ওয়ার্ড বেড',
                    badge: 'Gender Specific',
                    badgeColor: 'bg-pink-50 text-pink-800 border-pink-200',
                    desc: 'Dedicated female patient ward with private partition curtains.',
                  },
                  {
                    ward: 'Semi-Cabin',
                    labelBangla: 'সেমি-কেবিন রুম',
                    badge: 'Semi-Private',
                    badgeColor: 'bg-purple-50 text-purple-800 border-purple-200',
                    desc: 'Dual occupancy semi-private room with attached washroom.',
                  },
                  {
                    ward: 'VIP Cabin',
                    labelBangla: 'ভিআইপি / লাক্সারি কেবিন',
                    badge: 'Luxury Private',
                    badgeColor: 'bg-amber-50 text-amber-800 border-amber-200',
                    desc: 'AC single private cabin, attendant bed, LED TV & sofa set.',
                  },
                  {
                    ward: 'ICU',
                    labelBangla: 'আইসিইউ নিবিড় পরিচর্যা',
                    badge: 'Critical Care (24/7)',
                    badgeColor: 'bg-rose-50 text-rose-800 border-rose-200',
                    desc: 'Intensive Care Unit with dedicated ventilator & multi-para monitor.',
                  },
                  {
                    ward: 'CCU',
                    labelBangla: 'সিসিইউ কার্ডিয়াক কেয়ার',
                    badge: 'Cardiac Critical',
                    badgeColor: 'bg-red-50 text-red-800 border-red-200',
                    desc: 'Coronary Care Unit for acute cardiovascular observation.',
                  },
                  {
                    ward: 'Post-Operative',
                    labelBangla: 'পোস্ট-অপারেটিভ বেড',
                    badge: 'Surgical Recovery',
                    badgeColor: 'bg-teal-50 text-teal-800 border-teal-200',
                    desc: 'Immediate post-surgical observation and recovery station.',
                  },
                ] as const
              ).map((item) => {
                const currentCount = beds.filter((b) => b.wardType === item.ward).length;
                const rateVal = wardRates[item.ward] || 1000;

                return (
                  <div
                    key={item.ward}
                    className="bg-white p-4 rounded-xl border border-slate-200 hover:border-indigo-300 shadow-2xs hover:shadow-xs transition-all space-y-3 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1.5 pb-2 border-b border-slate-100">
                        <span className="font-bold text-slate-900 text-xs">{item.ward}</span>
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${item.badgeColor}`}>
                          {item.badge}
                        </span>
                      </div>

                      <div className="mt-2 space-y-1">
                        <p className="text-[11px] font-semibold text-indigo-900">{item.labelBangla}</p>
                        <p className="text-[10px] text-slate-500 leading-snug line-clamp-2">{item.desc}</p>
                        <span className="inline-block text-[10px] font-mono text-slate-400 pt-1">
                          Current Inventory: <strong>{currentCount} Beds</strong>
                        </span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 space-y-1.5">
                      <label className="text-[10px] font-bold uppercase text-slate-600 block">
                        Daily Rent Rate (24 Hours)
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono font-bold text-xs">
                          ৳ / $
                        </span>
                        <input
                          type="number"
                          min="0"
                          step="50"
                          value={rateVal}
                          onChange={(e) =>
                            setWardRates({
                              ...wardRates,
                              [item.ward]: Math.max(0, Number(e.target.value) || 0),
                            })
                          }
                          className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono pt-1">
                        <span>3 Days: ${rateVal * 3}</span>
                        <span>7 Days: ${rateVal * 7}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bottom Actions */}
            <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <div className="text-xs text-slate-500">
                <span>💡 Changing rates here sets the default pricing for newly registered beds and IPD admissions.</span>
              </div>
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={handleSyncRatesToAllBeds}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-slate-600" />
                  <span>Update All Existing Beds ({beds.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveRates()}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Pricing Configuration</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

          {/* ADD / EDIT BED MODAL */}
          {isBedModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
              <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg my-auto overflow-hidden animate-fadeIn">
                <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between">
                  <h3 className="font-bold text-sm flex items-center gap-2">
                    <Bed className="w-4 h-4 text-purple-400" />
                    <span>{editingBed ? `Edit Bed: ${editingBed.bedNumber}` : 'Register New Hospital Bed'}</span>
                  </h3>
                  <button
                    type="button"
                    onClick={() => setIsBedModalOpen(false)}
                    className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleSaveBed} className="p-5 space-y-4 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                        Bed Number / Code *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Bed 105, Cabin 305"
                        value={bedFormNumber}
                        onChange={(e) => setBedFormNumber(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-purple-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                        Room / Cabin Name *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Room 101, Cabin 305"
                        value={bedFormRoom}
                        onChange={(e) => setBedFormRoom(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                        Ward / Department Type *
                      </label>
                      <select
                        value={bedFormWard}
                        onChange={(e) => {
                          const w = e.target.value as WardType;
                          setBedFormWard(w);
                          if (!editingBed) {
                            setBedFormRate(wardRates[w] || 1000);
                          }
                        }}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                      >
                        <option value="General Ward">General Ward</option>
                        <option value="Female Ward">Female Ward</option>
                        <option value="Male Ward">Male Ward</option>
                        <option value="Semi-Cabin">Semi-Cabin</option>
                        <option value="VIP Cabin">VIP Cabin</option>
                        <option value="ICU">ICU (Intensive Care)</option>
                        <option value="CCU">CCU (Coronary Care)</option>
                        <option value="Post-Operative">Post-Operative</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                        Floor Location *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. 2nd Floor (Ward A)"
                        value={bedFormFloor}
                        onChange={(e) => setBedFormFloor(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                      Daily Bed Rate ($ / Day) *
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      placeholder="1200"
                      value={bedFormRate}
                      onChange={(e) => setBedFormRate(Number(e.target.value) || 0)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900"
                    />
                  </div>

                  {/* Amenities / Features Selection */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1.5">
                      Bed Amenities & Medical Features
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {AVAILABLE_AMENITIES.map((feat) => {
                        const selected = bedFormFeatures.includes(feat);
                        return (
                          <button
                            key={feat}
                            type="button"
                            onClick={() => toggleFeature(feat)}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold border transition-all cursor-pointer ${
                              selected
                                ? 'bg-purple-600 text-white border-purple-600'
                                : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            {selected ? '✓ ' : '+ '}
                            {feat}
                          </button>
                        );
                      })}
                    </div>

                    <div className="mt-2.5 flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Add custom amenity..."
                        value={customFeatureInput}
                        onChange={(e) => setCustomFeatureInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addCustomFeature();
                          }
                        }}
                        className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                      />
                      <button
                        type="button"
                        onClick={addCustomFeature}
                        className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-lg text-xs cursor-pointer"
                      >
                        Add
                      </button>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2.5">
                    <button
                      type="button"
                      onClick={() => setIsBedModalOpen(false)}
                      className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2.5 bg-purple-700 hover:bg-purple-600 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{editingBed ? 'Save Bed Updates' : 'Confirm & Save Bed'}</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* BATCH ROOM & MULTI-BED SETUP MODAL */}
          {isBatchRoomModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
              <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg my-auto overflow-hidden animate-fadeIn">
                <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between">
                  <h3 className="font-bold text-sm flex items-center gap-2">
                    <DoorOpen className="w-4 h-4 text-purple-400" />
                    <span>Setup Complete Room with Multiple Beds</span>
                  </h3>
                  <button
                    type="button"
                    onClick={() => setIsBatchRoomModalOpen(false)}
                    className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleSaveBatchRoom} className="p-5 space-y-4 text-xs">
                  <div className="p-3 bg-purple-50/70 border border-purple-200 rounded-xl text-purple-900 text-[11px] leading-relaxed">
                    Quickly configure an entire room or ward unit and automatically generate all its individual beds (e.g. <strong>{batchBedPrefix}A</strong>, <strong>{batchBedPrefix}B</strong>, <strong>{batchBedPrefix}C</strong>) in one click.
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                        Room / Cabin Name *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Room 104, Cabin 401"
                        value={batchRoomName}
                        onChange={(e) => {
                          const val = e.target.value;
                          setBatchRoomName(val);
                          setBatchBedPrefix(`${val.replace('Room ', 'Bed ')}-`);
                        }}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                        Ward / Unit Type *
                      </label>
                      <select
                        value={batchWard}
                        onChange={(e) => {
                          const w = e.target.value as WardType;
                          setBatchWard(w);
                          setBatchRate(wardRates[w] || 1000);
                        }}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                      >
                        <option value="General Ward">General Ward</option>
                        <option value="Female Ward">Female Ward</option>
                        <option value="Male Ward">Male Ward</option>
                        <option value="Semi-Cabin">Semi-Cabin</option>
                        <option value="VIP Cabin">VIP Cabin</option>
                        <option value="ICU">ICU (Intensive Care)</option>
                        <option value="CCU">CCU (Coronary Care)</option>
                        <option value="Post-Operative">Post-Operative</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                        Number of Beds *
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="12"
                        required
                        value={batchBedCount}
                        onChange={(e) => setBatchBedCount(Math.max(1, Math.min(12, Number(e.target.value) || 1)))}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                        Bed Code Prefix *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Bed 104-"
                        value={batchBedPrefix}
                        onChange={(e) => setBatchBedPrefix(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                        Rate ($ / Day) *
                      </label>
                      <input
                        type="number"
                        min="0"
                        required
                        value={batchRate}
                        onChange={(e) => setBatchRate(Number(e.target.value) || 0)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                      Floor Location *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 2nd Floor (Ward A)"
                      value={batchFloor}
                      onChange={(e) => setBatchFloor(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1.5">
                      Included Amenities for All Beds in this Room
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {AVAILABLE_AMENITIES.map((feat) => {
                        const selected = batchFeatures.includes(feat);
                        return (
                          <button
                            key={feat}
                            type="button"
                            onClick={() => {
                              if (batchFeatures.includes(feat)) {
                                setBatchFeatures(batchFeatures.filter((f) => f !== feat));
                              } else {
                                setBatchFeatures([...batchFeatures, feat]);
                              }
                            }}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold border transition-all cursor-pointer ${
                              selected
                                ? 'bg-purple-600 text-white border-purple-600'
                                : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            {selected ? '✓ ' : '+ '}
                            {feat}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-slate-600 text-[11px]">
                    Preview Generated Beds: {Array.from({ length: batchBedCount }).map((_, idx) => (
                      <span key={idx} className="font-mono font-bold text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded mr-1">
                        {batchBedPrefix}{String.fromCharCode(65 + idx)}
                      </span>
                    ))}
                  </div>

                  <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2.5">
                    <button
                      type="button"
                      onClick={() => setIsBatchRoomModalOpen(false)}
                      className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2.5 bg-purple-700 hover:bg-purple-600 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md cursor-pointer"
                    >
                      <DoorOpen className="w-4 h-4" />
                      <span>Create Room & Register {batchBedCount} Beds</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
    </div>
  );
};
