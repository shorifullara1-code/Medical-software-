import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import {
  Pill,
  Search,
  PlusCircle,
  ShoppingCart,
  Receipt,
  User,
  Bed,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Printer,
  FileText,
  CreditCard,
  Building,
  RotateCcw,
  Sparkles,
  Layers,
  Edit2,
  Trash2,
  ShieldCheck,
  Ban,
  PackageCheck,
  DollarSign,
  Droplet,
  ExternalLink,
  ChevronDown,
  Scan,
  Camera,
  CameraOff,
  X,
  Check,
  Tag,
  Upload,
  Volume2,
} from 'lucide-react';
import {
  PharmacyMedicine,
  PharmacySale,
  PharmacySaleItem,
  Patient,
  IPDAdmission,
  Prescription,
  Staff,
  HospitalSettings,
} from '../types';
import { MedicineBarcodePrintModal } from './PrintModals/MedicineBarcodePrintModal';
import { matchScannedEntity, playScanBeep } from '../utils/scanParser';

interface PharmacyViewProps {
  medicines: PharmacyMedicine[];
  sales: PharmacySale[];
  patients: Patient[];
  admissions: IPDAdmission[];
  prescriptions: Prescription[];
  currentUser: Staff;
  hospitalSettings: HospitalSettings;
  onSaveSale: (newSale: PharmacySale, updatedMedicines: PharmacyMedicine[]) => void;
  onUpdateMedicines: (medicines: PharmacyMedicine[]) => void;
  onOpenPrintSlip: (sale: PharmacySale) => void;
  onNavigateToIPD?: () => void;
}

export const PharmacyView: React.FC<PharmacyViewProps> = ({
  medicines,
  sales,
  patients,
  admissions,
  prescriptions,
  currentUser,
  hospitalSettings,
  onSaveSale,
  onUpdateMedicines,
  onOpenPrintSlip,
  onNavigateToIPD,
}) => {
  const [activeTab, setActiveTab] = useState<'pos' | 'inventory' | 'sales'>('pos');

  // POS State
  const [saleType, setSaleType] = useState<'outdoor' | 'indoor'>('outdoor');
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');
  const [selectedAdmissionId, setSelectedAdmissionId] = useState<string>('');
  const [outdoorName, setOutdoorName] = useState<string>('');
  const [outdoorPhone, setOutdoorPhone] = useState<string>('');
  const [outdoorAge, setOutdoorAge] = useState<string>('');
  const [outdoorGender, setOutdoorGender] = useState<string>('Male');
  const [selectedPrescriptionId, setSelectedPrescriptionId] = useState<string>('');

  // Cart State
  const [cart, setCart] = useState<PharmacySaleItem[]>([]);
  const [discount, setDiscount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'bKash' | 'Nagad' | 'Card' | 'IPD_Credit'>('Cash');
  const [paidAmountInput, setPaidAmountInput] = useState<number>(0);
  const [saleNotes, setSaleNotes] = useState<string>('');

  // Search & Filters in POS
  const [medSearchQuery, setMedSearchQuery] = useState('');
  const [medCategoryFilter, setMedCategoryFilter] = useState('all');

  // Inventory Management State
  const [inventorySearch, setInventorySearch] = useState('');
  const [inventoryCategoryFilter, setInventoryCategoryFilter] = useState('all');
  const [stockFilter, setStockFilter] = useState<'all' | 'low' | 'available'>('all');
  const [isAddMedModalOpen, setIsAddMedModalOpen] = useState(false);
  const [editingMed, setEditingMed] = useState<PharmacyMedicine | null>(null);

  // Medicine Form Modal State
  const [medFormCode, setMedFormCode] = useState('');
  const [medFormName, setMedFormName] = useState('');
  const [medFormGeneric, setMedFormGeneric] = useState('');
  const [medFormCategory, setMedFormCategory] = useState<PharmacyMedicine['category']>('Tablet');
  const [medFormManufacturer, setMedFormManufacturer] = useState('');
  const [medFormUnitPrice, setMedFormUnitPrice] = useState<number>(5);
  const [medFormPackSize, setMedFormPackSize] = useState('Strip of 10');
  const [medFormStock, setMedFormStock] = useState<number>(100);
  const [medFormReorder, setMedFormReorder] = useState<number>(20);
  const [medFormRack, setMedFormRack] = useState('Rack A-1');
  const [medFormBatch, setMedFormBatch] = useState('BATCH-2026-01');
  const [medFormExpiry, setMedFormExpiry] = useState('2027-12-31');
  const [medFormDescription, setMedFormDescription] = useState('');

  // Sales Archive State
  const [salesSearch, setSalesSearch] = useState('');
  const [salesTypeFilter, setSalesTypeFilter] = useState<'all' | 'indoor' | 'outdoor' | 'due' | 'paid'>('all');

  // Patient ID Search & Scanner State
  const [patientSearchInput, setPatientSearchInput] = useState<string>('');
  const [isPharmacyScannerOpen, setIsPharmacyScannerOpen] = useState<boolean>(false);
  const [scanFeedbackMsg, setScanFeedbackMsg] = useState<string | null>(null);
  const [barcodeStickerMed, setBarcodeStickerMed] = useState<PharmacyMedicine | null>(null);
  const pharmacyScannerRef = useRef<Html5Qrcode | null>(null);

  // Active Inpatients List
  const activeAdmissions = useMemo(() => {
    return admissions.filter((a) => a.status === 'admitted');
  }, [admissions]);

  // Matching patient lists for the POS search bar
  const matchingSearchPatients = useMemo(() => {
    const q = patientSearchInput.trim().toLowerCase();
    if (!q) return [];
    return patients
      .filter(
        (p) =>
          p.id.toLowerCase().includes(q) ||
          p.name.toLowerCase().includes(q) ||
          p.phone.replaceAll('-', '').includes(q.replaceAll('-', ''))
      )
      .slice(0, 6);
  }, [patients, patientSearchInput]);

  const matchingSearchAdmissions = useMemo(() => {
    const q = patientSearchInput.trim().toLowerCase();
    if (!q) return [];
    return activeAdmissions
      .filter(
        (a) =>
          a.id.toLowerCase().includes(q) ||
          a.patientId.toLowerCase().includes(q) ||
          a.patientName.toLowerCase().includes(q) ||
          a.bedNumber.toLowerCase().includes(q) ||
          a.patientPhone.replaceAll('-', '').includes(q.replaceAll('-', ''))
      )
      .slice(0, 6);
  }, [activeAdmissions, patientSearchInput]);

  // Select patient by Patient object (Automates Indoor vs Outdoor fill)
  const handleSelectPatientByObject = (patient: Patient) => {
    setSelectedPatientId(patient.id);
    setOutdoorName(patient.name);
    setOutdoorPhone(patient.phone);
    setOutdoorAge(String(patient.age));
    setOutdoorGender(patient.gender);

    // Check if this patient is currently admitted as an Inpatient in IPD
    const activeAdm = activeAdmissions.find((a) => a.patientId === patient.id);
    if (activeAdm) {
      setSaleType('indoor');
      setPaymentMethod('IPD_Credit');
      setSelectedAdmissionId(activeAdm.id);
      setScanFeedbackMsg(`Indoor Patient Verified: ${patient.name} (${activeAdm.bedNumber} - ${activeAdm.wardType})`);
    } else {
      setSaleType('outdoor');
      setPaymentMethod('Cash');
      setSelectedAdmissionId('');
      setScanFeedbackMsg(`Registered OPD Patient Verified: ${patient.name} (${patient.id})`);
    }
  };

  // Select patient by Admission object
  const handleSelectAdmissionByObject = (adm: IPDAdmission) => {
    setSaleType('indoor');
    setPaymentMethod('IPD_Credit');
    setSelectedAdmissionId(adm.id);
    setSelectedPatientId(adm.patientId);

    const foundP = patients.find((p) => p.id === adm.patientId);
    if (foundP) {
      setOutdoorName(foundP.name);
      setOutdoorPhone(foundP.phone);
      setOutdoorAge(String(foundP.age));
      setOutdoorGender(foundP.gender);
    } else {
      setOutdoorName(adm.patientName);
      setOutdoorPhone(adm.patientPhone);
      setOutdoorAge(String(adm.patientAge));
      setOutdoorGender(adm.patientGender);
    }
    setScanFeedbackMsg(`Inpatient Linked: ${adm.patientName} (${adm.bedNumber} - ${adm.wardType})`);
  };

  // Handle scanned barcode / QR code (from Camera, Image file or USB hardware scanner)
  const handleBarcodeScannedInPharmacy = (code: string) => {
    if (!code || !code.trim()) return;
    const result = matchScannedEntity(
      code,
      patients,
      medicines,
      [],
      prescriptions,
      [],
      activeAdmissions
    );

    setScanFeedbackMsg(result.message);

    if (result.type === 'medicine' && result.medicine) {
      if (result.medicine.stockQuantity <= 0) {
        setScanFeedbackMsg(`⚠️ Stock Warning: '${result.medicine.name}' has 0 stock left!`);
        return;
      }
      handleAddToCart(result.medicine);
      setIsPharmacyScannerOpen(false);
      return;
    }

    if (result.type === 'admission' && result.admission) {
      handleSelectAdmissionByObject(result.admission);
      setPatientSearchInput(result.admission.patientId);
      setIsPharmacyScannerOpen(false);
      return;
    }

    const matchedP = result.patient;
    if (matchedP) {
      handleSelectPatientByObject(matchedP);
      setPatientSearchInput(matchedP.id);
      setIsPharmacyScannerOpen(false);
      return;
    }
  };

  // USB / Bluetooth Hardware Barcode Scanner Listener in Pharmacy POS
  useEffect(() => {
    if (activeTab !== 'pos') return;
    let buffer = '';
    let lastKeyTime = Date.now();

    const handleKeyDown = (e: KeyboardEvent) => {
      const currentTime = Date.now();
      if (currentTime - lastKeyTime > 120) {
        buffer = '';
      }
      lastKeyTime = currentTime;

      if (e.key === 'Enter') {
        if (buffer.trim().length >= 2) {
          handleBarcodeScannedInPharmacy(buffer.trim());
          buffer = '';
        }
      } else if (e.key.length === 1) {
        buffer += e.key;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTab, activeAdmissions, patients, medicines]);

  // Live Camera Scanner Initialization
  useEffect(() => {
    let html5QrCode: Html5Qrcode | null = null;
    if (isPharmacyScannerOpen) {
      const timer = setTimeout(() => {
        try {
          html5QrCode = new Html5Qrcode('pharmacy-pos-camera-region');
          pharmacyScannerRef.current = html5QrCode;
          html5QrCode
            .start(
              { facingMode: 'environment' },
              { fps: 10, qrbox: { width: 220, height: 220 } },
              (decodedText) => {
                handleBarcodeScannedInPharmacy(decodedText);
              },
              () => {}
            )
            .catch((err) => {
              console.warn('Pharmacy Camera init error:', err);
            });
        } catch (e) {
          console.warn('Pharmacy Camera exception:', e);
        }
      }, 250);

      return () => {
        clearTimeout(timer);
        if (pharmacyScannerRef.current && pharmacyScannerRef.current.isScanning) {
          pharmacyScannerRef.current.stop().catch(() => {});
        }
      };
    }
  }, [isPharmacyScannerOpen]);

  // Handle Inpatient selection in POS
  const selectedAdmission = useMemo(() => {
    if (!selectedAdmissionId) return null;
    return activeAdmissions.find((a) => a.id === selectedAdmissionId) || null;
  }, [activeAdmissions, selectedAdmissionId]);

  // When switching to indoor, auto set paymentMethod to IPD_Credit or Cash
  const handleSwitchSaleType = (type: 'outdoor' | 'indoor') => {
    setSaleType(type);
    if (type === 'indoor') {
      setPaymentMethod('IPD_Credit');
      if (activeAdmissions.length > 0 && !selectedAdmissionId) {
        const first = activeAdmissions[0];
        setSelectedAdmissionId(first.id);
        setSelectedPatientId(first.patientId);
      }
    } else {
      setPaymentMethod('Cash');
      setSelectedAdmissionId('');
    }
  };

  // Cart Calculations
  const cartSubtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.total, 0);
  }, [cart]);

  const cartNetTotal = useMemo(() => {
    return Math.max(0, cartSubtotal - (discount || 0));
  }, [cartSubtotal, discount]);

  // Auto-sync paid amount based on sale type and payment method
  const effectivePaidAmount = useMemo(() => {
    if (saleType === 'outdoor') {
      // Outdoor patients MUST pay 100% upfront
      return cartNetTotal;
    }
    if (paymentMethod === 'IPD_Credit') {
      return paidAmountInput > 0 ? Math.min(paidAmountInput, cartNetTotal) : 0;
    }
    return paidAmountInput > 0 ? paidAmountInput : cartNetTotal;
  }, [saleType, paymentMethod, paidAmountInput, cartNetTotal]);

  const effectiveDueAmount = useMemo(() => {
    if (saleType === 'outdoor') {
      return 0; // Strictly zero due for outdoor
    }
    return Math.max(0, cartNetTotal - effectivePaidAmount);
  }, [saleType, cartNetTotal, effectivePaidAmount]);

  // Add Medicine to Cart
  const handleAddToCart = (med: PharmacyMedicine) => {
    if (med.stockQuantity <= 0) return;

    setCart((prevCart) => {
      const existing = prevCart.find((item) => item.medicineId === med.id);
      if (existing) {
        if (existing.quantity >= med.stockQuantity) return prevCart;
        return prevCart.map((item) =>
          item.medicineId === med.id
            ? {
                ...item,
                quantity: item.quantity + 1,
                total: (item.quantity + 1) * item.unitPrice,
              }
            : item
        );
      }
      return [
        ...prevCart,
        {
          medicineId: med.id,
          medicineName: med.name,
          genericName: med.genericName,
          category: med.category,
          unitPrice: med.unitPrice,
          quantity: 1,
          total: med.unitPrice,
        },
      ];
    });
  };

  const handleUpdateCartQuantity = (medicineId: string, qty: number) => {
    const targetMed = medicines.find((m) => m.id === medicineId);
    const maxStock = targetMed ? targetMed.stockQuantity : 999;
    const safeQty = Math.max(1, Math.min(maxStock, qty));

    setCart((prev) =>
      prev.map((item) =>
        item.medicineId === medicineId
          ? {
              ...item,
              quantity: safeQty,
              total: safeQty * item.unitPrice,
            }
          : item
      )
    );
  };

  const handleRemoveFromCart = (medicineId: string) => {
    setCart((prev) => prev.filter((item) => item.medicineId !== medicineId));
  };

  // Load medicines from a doctor's prescription
  const handleLoadPrescription = (rxId: string) => {
    setSelectedPrescriptionId(rxId);
    if (!rxId) return;

    const rx = prescriptions.find((p) => p.id === rxId);
    if (!rx || !rx.medicines) return;

    // Prefill patient details
    if (saleType === 'outdoor') {
      setSelectedPatientId(rx.patientId);
      setOutdoorName(rx.patientName);
      setOutdoorPhone(rx.patientPhone);
      setOutdoorAge(String(rx.patientAge));
      setOutdoorGender(rx.patientGender);
    }

    const newCartItems: PharmacySaleItem[] = [];

    rx.medicines.forEach((rxMed) => {
      // Find matching medicine in pharmacy catalog
      const rxCleanName = rxMed.name.toLowerCase();
      const match = medicines.find(
        (m) =>
          rxCleanName.includes(m.name.toLowerCase()) ||
          rxCleanName.includes(m.genericName.toLowerCase()) ||
          m.name.toLowerCase().includes(rxCleanName.replace(/tab\.|cap\.|inj\.|syr\./g, '').trim())
      );

      if (match && match.stockQuantity > 0) {
        newCartItems.push({
          medicineId: match.id,
          medicineName: match.name,
          genericName: match.genericName,
          category: match.category,
          unitPrice: match.unitPrice,
          quantity: 10,
          total: match.unitPrice * 10,
        });
      }
    });

    if (newCartItems.length > 0) {
      setCart(newCartItems);
    }
  };

  // Submit Medicine Dispense / Sale
  const handleConfirmDispense = (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;

    let patientId = selectedPatientId || 'WALK-IN';
    let patientName = outdoorName || 'Walk-in Customer';
    let patientPhone = outdoorPhone || '';
    let patientAge = outdoorAge ? Number(outdoorAge) : undefined;
    let patientGender = outdoorGender;
    let bedNumber: string | undefined = undefined;
    let admissionId: string | undefined = undefined;

    if (saleType === 'indoor') {
      if (!selectedAdmission) return;
      patientId = selectedAdmission.patientId;
      patientName = selectedAdmission.patientName;
      patientPhone = selectedAdmission.patientPhone;
      patientAge = selectedAdmission.patientAge;
      patientGender = selectedAdmission.patientGender;
      bedNumber = `${selectedAdmission.bedNumber} (${selectedAdmission.wardType})`;
      admissionId = selectedAdmission.id;
    } else {
      if (selectedPatientId) {
        const found = patients.find((p) => p.id === selectedPatientId);
        if (found) {
          patientName = found.name;
          patientPhone = found.phone;
          patientAge = found.age;
          patientGender = found.gender;
        }
      }
    }

    const saleId = `PHARM-${Date.now().toString().slice(-6)}`;
    const invoiceNumber = `PH-INV-${Date.now().toString().slice(-4)}`;
    const nowStr = new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const newSale: PharmacySale = {
      id: saleId,
      invoiceNumber,
      saleType,
      patientId,
      patientName,
      patientPhone,
      patientAge,
      patientGender,
      bedNumber,
      admissionId,
      prescriptionId: selectedPrescriptionId || undefined,
      items: [...cart],
      subtotal: cartSubtotal,
      discount: discount || 0,
      total: cartNetTotal,
      paidAmount: effectivePaidAmount,
      dueAmount: effectiveDueAmount,
      paymentMethod,
      paymentStatus:
        effectiveDueAmount === 0
          ? 'paid'
          : effectivePaidAmount > 0
          ? 'partial'
          : 'due',
      dispensedBy: `${currentUser.name} (${currentUser.role})`,
      dispensedAt: nowStr,
      notes:
        saleNotes ||
        (saleType === 'indoor' && effectiveDueAmount > 0
          ? `Inpatient Credit: Dispensed to ${bedNumber}. BDT ${effectiveDueAmount} added to Inpatient Due Account.`
          : `Paid in full via ${paymentMethod}`),
    };

    // Deduct stock from inventory
    const updatedMedicines = medicines.map((med) => {
      const soldItem = cart.find((item) => item.medicineId === med.id);
      if (soldItem) {
        return {
          ...med,
          stockQuantity: Math.max(0, med.stockQuantity - soldItem.quantity),
        };
      }
      return med;
    });

    onSaveSale(newSale, updatedMedicines);

    // Reset Form
    setCart([]);
    setDiscount(0);
    setPaidAmountInput(0);
    setSaleNotes('');
    setSelectedPrescriptionId('');
    if (saleType === 'outdoor') {
      setOutdoorName('');
      setOutdoorPhone('');
      setSelectedPatientId('');
    }

    // Immediately trigger printable pharmacy bill
    onOpenPrintSlip(newSale);
  };

  // Medicine Inventory Management Handlers
  const handleOpenAddMedicine = () => {
    setEditingMed(null);
    setMedFormCode(`MED-${Date.now().toString().slice(-4)}`);
    setMedFormName('');
    setMedFormGeneric('');
    setMedFormCategory('Tablet');
    setMedFormManufacturer('Square Pharmaceuticals Ltd');
    setMedFormUnitPrice(5);
    setMedFormPackSize('Strip of 10');
    setMedFormStock(100);
    setMedFormReorder(20);
    setMedFormRack('Rack A-1');
    setMedFormBatch(`BATCH-${new Date().getFullYear()}-01`);
    setMedFormExpiry('2028-12-31');
    setMedFormDescription('');
    setIsAddMedModalOpen(true);
  };

  const handleOpenEditMedicine = (med: PharmacyMedicine) => {
    setEditingMed(med);
    setMedFormCode(med.code);
    setMedFormName(med.name);
    setMedFormGeneric(med.genericName);
    setMedFormCategory(med.category);
    setMedFormManufacturer(med.manufacturer);
    setMedFormUnitPrice(med.unitPrice);
    setMedFormPackSize(med.packSize);
    setMedFormStock(med.stockQuantity);
    setMedFormReorder(med.reorderLevel);
    setMedFormRack(med.rackLocation);
    setMedFormBatch(med.batchNo);
    setMedFormExpiry(med.expiryDate);
    setMedFormDescription(med.description || '');
    setIsAddMedModalOpen(true);
  };

  const handleSaveMedicineForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!medFormName.trim()) return;

    if (editingMed) {
      const updated = medicines.map((m) =>
        m.id === editingMed.id
          ? {
              ...m,
              code: medFormCode,
              name: medFormName,
              genericName: medFormGeneric,
              category: medFormCategory,
              manufacturer: medFormManufacturer,
              unitPrice: Number(medFormUnitPrice) || 0,
              packSize: medFormPackSize,
              stockQuantity: Number(medFormStock) || 0,
              reorderLevel: Number(medFormReorder) || 0,
              rackLocation: medFormRack,
              batchNo: medFormBatch,
              expiryDate: medFormExpiry,
              description: medFormDescription,
            }
          : m
      );
      onUpdateMedicines(updated);
    } else {
      const newMed: PharmacyMedicine = {
        id: `MED-${Date.now().toString().slice(-5)}`,
        code: medFormCode || `MED-${Date.now().toString().slice(-4)}`,
        name: medFormName,
        genericName: medFormGeneric,
        category: medFormCategory,
        manufacturer: medFormManufacturer,
        unitPrice: Number(medFormUnitPrice) || 0,
        packSize: medFormPackSize,
        stockQuantity: Number(medFormStock) || 0,
        reorderLevel: Number(medFormReorder) || 0,
        rackLocation: medFormRack,
        batchNo: medFormBatch,
        expiryDate: medFormExpiry,
        description: medFormDescription,
      };
      onUpdateMedicines([newMed, ...medicines]);
    }
    setIsAddMedModalOpen(false);
  };

  const handleDeleteMedicine = (medId: string) => {
    if (confirm('Are you sure you want to remove this medicine from inventory?')) {
      onUpdateMedicines(medicines.filter((m) => m.id !== medId));
    }
  };

  // Filtered Catalog in POS
  const filteredCatalog = useMemo(() => {
    return medicines.filter((m) => {
      const matchesCat = medCategoryFilter === 'all' || m.category === medCategoryFilter;
      const q = medSearchQuery.toLowerCase().trim();
      const matchesQ =
        !q ||
        m.name.toLowerCase().includes(q) ||
        m.genericName.toLowerCase().includes(q) ||
        m.manufacturer.toLowerCase().includes(q) ||
        m.code.toLowerCase().includes(q);
      return matchesCat && matchesQ;
    });
  }, [medicines, medCategoryFilter, medSearchQuery]);

  // Filtered Inventory
  const filteredInventory = useMemo(() => {
    return medicines.filter((m) => {
      const matchesCat = inventoryCategoryFilter === 'all' || m.category === inventoryCategoryFilter;
      const q = inventorySearch.toLowerCase().trim();
      const matchesQ =
        !q ||
        m.name.toLowerCase().includes(q) ||
        m.genericName.toLowerCase().includes(q) ||
        m.manufacturer.toLowerCase().includes(q) ||
        m.rackLocation.toLowerCase().includes(q) ||
        m.batchNo.toLowerCase().includes(q);

      const matchesStock =
        stockFilter === 'all'
          ? true
          : stockFilter === 'low'
          ? m.stockQuantity <= m.reorderLevel
          : m.stockQuantity > m.reorderLevel;

      return matchesCat && matchesQ && matchesStock;
    });
  }, [medicines, inventoryCategoryFilter, inventorySearch, stockFilter]);

  // Filtered Sales Archive
  const filteredSales = useMemo(() => {
    return sales.filter((s) => {
      const matchesType =
        salesTypeFilter === 'all'
          ? true
          : salesTypeFilter === 'indoor'
          ? s.saleType === 'indoor'
          : salesTypeFilter === 'outdoor'
          ? s.saleType === 'outdoor'
          : salesTypeFilter === 'due'
          ? s.dueAmount > 0
          : s.dueAmount === 0;

      const q = salesSearch.toLowerCase().trim();
      const matchesSearch =
        !q ||
        s.id.toLowerCase().includes(q) ||
        (s.invoiceNumber && s.invoiceNumber.toLowerCase().includes(q)) ||
        s.patientName.toLowerCase().includes(q) ||
        s.patientId.toLowerCase().includes(q) ||
        s.patientPhone.includes(q) ||
        (s.bedNumber && s.bedNumber.toLowerCase().includes(q));

      return matchesType && matchesSearch;
    });
  }, [sales, salesTypeFilter, salesSearch]);

  // Top Metrics
  const totalSalesBilled = sales.reduce((sum, s) => sum + s.total, 0);
  const totalCashCollected = sales.reduce((sum, s) => sum + s.paidAmount, 0);
  const totalInpatientCreditDue = sales.reduce((sum, s) => sum + (s.dueAmount || 0), 0);
  const lowStockCount = medicines.filter((m) => m.stockQuantity <= m.reorderLevel).length;

  return (
    <div className="space-y-5">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-teal-950 via-slate-900 to-teal-900 text-white p-6 rounded-2xl shadow-md border border-teal-800/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30 flex items-center gap-1.5">
              <Pill className="w-3.5 h-3.5" />
              Central Hospital Pharmacy & Dispensary (ফার্মেসি বিভাগ)
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
            Hospital Pharmacy & Medicine Dispensary
          </h2>
          <p className="text-xs sm:text-sm text-teal-200 mt-1 max-w-2xl leading-relaxed">
            Dispense medications for Outdoor and Indoor Inpatients. Inpatient credit is automatically linked to bed admissions for settlement upon discharge.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            onClick={() => setActiveTab('pos')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'pos'
                ? 'bg-teal-500 text-slate-950 shadow-lg shadow-teal-500/20'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            <ShoppingCart className="w-4 h-4" />
            <span>POS Medicine Counter</span>
          </button>

          <button
            onClick={() => setActiveTab('inventory')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'inventory'
                ? 'bg-teal-500 text-slate-950 shadow-lg shadow-teal-500/20'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Inventory & Stock ({medicines.length})</span>
            {lowStockCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-400 text-slate-950">
                {lowStockCount} Low
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('sales')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'sales'
                ? 'bg-teal-500 text-slate-950 shadow-lg shadow-teal-500/20'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            <Receipt className="w-4 h-4" />
            <span>Sales & Credit Ledger ({sales.length})</span>
          </button>
        </div>
      </div>

      {/* Quick Financial Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Pharmacy Revenue</span>
          <h3 className="text-xl font-black text-slate-900 font-mono mt-0.5">BDT {totalSalesBilled.toLocaleString()}</h3>
          <span className="text-[10px] text-slate-500">{sales.length} Dispensing transactions</span>
        </div>

        <div className="bg-emerald-50/70 p-3.5 rounded-xl border border-emerald-200 shadow-2xs">
          <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">Cash & Digital Collected</span>
          <h3 className="text-xl font-black text-emerald-700 font-mono mt-0.5">BDT {totalCashCollected.toLocaleString()}</h3>
          <span className="text-[10px] text-emerald-700">100% upfront for outdoor</span>
        </div>

        <div className="bg-purple-50/80 p-3.5 rounded-xl border border-purple-200 shadow-2xs">
          <span className="text-[10px] font-bold text-purple-900 uppercase tracking-wider block">Inpatient Credit Dues (ইনডোর বাকি)</span>
          <h3 className="text-xl font-black text-purple-700 font-mono mt-0.5">BDT {totalInpatientCreditDue.toLocaleString()}</h3>
          <span className="text-[10px] text-purple-700 font-semibold">Payable at patient discharge</span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Catalog Stock Alert</span>
            <h3 className="text-xl font-black text-slate-900 font-mono mt-0.5">{medicines.length} Medicines</h3>
            <span className={`text-[10px] font-bold ${lowStockCount > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
              {lowStockCount > 0 ? `${lowStockCount} items low in stock` : 'All items in stock'}
            </span>
          </div>
          <button
            onClick={handleOpenAddMedicine}
            className="p-2 bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200 rounded-xl transition-colors cursor-pointer"
            title="Add New Medicine to Pharmacy"
          >
            <PlusCircle className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: POS MEDICINE DISPENSING COUNTER */}
      {/* ========================================================================= */}
      {activeTab === 'pos' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left Column: Patient Type Selector & Medicine Catalog (7 Cols) */}
          <div className="lg:col-span-7 space-y-4">
            {/* Patient Category Selection Card */}
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <User className="w-4 h-4 text-teal-600" />
                  <span>Select Patient Category (রোগীর ধরন নির্বাচন)</span>
                </span>

                {/* Patient Type Switcher */}
                <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
                  <button
                    type="button"
                    onClick={() => handleSwitchSaleType('outdoor')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                      saleType === 'outdoor'
                        ? 'bg-teal-700 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <User className="w-3.5 h-3.5" />
                    <span>Outdoor / Walk-in (বাইরের রোগী)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSwitchSaleType('indoor')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                      saleType === 'indoor'
                        ? 'bg-purple-900 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Bed className="w-3.5 h-3.5" />
                    <span>Inpatient / Bed (ইনডোর রোগী)</span>
                    {activeAdmissions.length > 0 && (
                      <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-purple-500 text-white font-bold">
                        {activeAdmissions.length}
                      </span>
                    )}
                  </button>
                </div>
              </div>

              {/* Universal Patient ID Search & Barcode Scanner Bar */}
              <div className="p-3.5 bg-slate-900 text-white rounded-2xl space-y-2.5 shadow-sm">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-teal-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Type Patient ID (e.g. PAT-2026-001 or IPD-2026-001), phone or name..."
                      value={patientSearchInput}
                      onChange={(e) => setPatientSearchInput(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 text-white placeholder-slate-400 rounded-xl text-xs font-mono focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                    />
                    {patientSearchInput && (
                      <button
                        type="button"
                        onClick={() => setPatientSearchInput('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsPharmacyScannerOpen(true)}
                    className="px-4 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-md transition-all cursor-pointer shrink-0"
                    title="Scan Patient Health Card / Admission Slip Barcode"
                  >
                    <Scan className="w-4 h-4 animate-pulse" />
                    <span>Scan Barcode Card</span>
                  </button>
                </div>

                {/* Scan Feedback Banner */}
                {scanFeedbackMsg && (
                  <div className="text-[11px] font-semibold text-teal-300 bg-teal-950/80 px-3 py-1 rounded-lg border border-teal-800/60 flex items-center justify-between">
                    <span>{scanFeedbackMsg}</span>
                    <button onClick={() => setScanFeedbackMsg(null)} className="text-teal-400 hover:text-white">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}

                {/* Live Autocomplete Dropdown Search Results */}
                {patientSearchInput.trim().length > 0 && (
                  <div className="bg-white text-slate-900 rounded-xl border border-slate-300 shadow-xl p-2.5 space-y-2 max-h-60 overflow-y-auto">
                    {/* 1. Matching Inpatients */}
                    {matchingSearchAdmissions.length > 0 && (
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-purple-900 uppercase tracking-wider block px-1 flex items-center gap-1">
                          <Bed className="w-3 h-3 text-purple-700" />
                          <span>Admitted Inpatients (ইনডোর পেশেন্ট)</span>
                        </span>
                        {matchingSearchAdmissions.map((adm) => (
                          <button
                            key={adm.id}
                            type="button"
                            onClick={() => {
                              handleSelectAdmissionByObject(adm);
                              setPatientSearchInput('');
                            }}
                            className="w-full text-left p-2 rounded-lg bg-purple-50 hover:bg-purple-100 border border-purple-200 transition-colors flex items-center justify-between cursor-pointer"
                          >
                            <div>
                              <div className="font-bold text-xs text-slate-900">{adm.patientName}</div>
                              <div className="text-[10px] text-purple-800 font-mono">
                                ID: {adm.patientId} • Bed: {adm.bedNumber} ({adm.wardType})
                              </div>
                            </div>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-900 text-white">
                              Select Inpatient
                            </span>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* 2. Matching Registered OPD Patients */}
                    {matchingSearchPatients.length > 0 && (
                      <div className="space-y-1 pt-1 border-t border-slate-100">
                        <span className="text-[10px] font-bold text-teal-900 uppercase tracking-wider block px-1 flex items-center gap-1">
                          <User className="w-3 h-3 text-teal-700" />
                          <span>Registered Hospital Patients (রেজিস্টার্ড আউটডোর)</span>
                        </span>
                        {matchingSearchPatients.map((p) => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => {
                              handleSelectPatientByObject(p);
                              setPatientSearchInput('');
                            }}
                            className="w-full text-left p-2 rounded-lg bg-teal-50/60 hover:bg-teal-100 border border-teal-200 transition-colors flex items-center justify-between cursor-pointer"
                          >
                            <div>
                              <div className="font-bold text-xs text-slate-900">{p.name}</div>
                              <div className="text-[10px] text-teal-800 font-mono">
                                ID: {p.id} • Phone: {p.phone} • {p.age} Yrs ({p.gender})
                              </div>
                            </div>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-800 text-white">
                              Select Registered
                            </span>
                          </button>
                        ))}
                      </div>
                    )}

                    {matchingSearchAdmissions.length === 0 && matchingSearchPatients.length === 0 && (
                      <div className="p-3 text-center text-xs text-slate-500 italic">
                        No registered patient or admission found matching "{patientSearchInput}".
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Policy Indicator Box */}
              {saleType === 'outdoor' ? (
                <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl flex items-start gap-2.5 text-xs text-amber-900">
                  <Ban className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block font-bold">বাইরের পেশেন্টদের বাকিতে ওষুধ বিক্রয় নিষিদ্ধ:</strong>
                    <span className="text-[11px] text-amber-800">
                      বহির্বিভাগের (Outdoor) পেশেন্টদের ওষুধ ক্রয়ের সময় ১০০% নগদ/বিকাশ/কার্ডে মূল্য পরিশোধ করতে হবে। কোনো বকেয়া রাখা যাবে না।
                    </span>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-purple-50 border border-purple-300 rounded-xl flex items-start gap-2.5 text-xs text-purple-900">
                  <ShieldCheck className="w-4 h-4 text-purple-700 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block font-bold">বেডে ভর্তি ইনডোর পেশেন্টদের বাকিতে ওষুধ বিতরণ অনুমোদিত:</strong>
                    <span className="text-[11px] text-purple-800">
                      ইনডোর পেশেন্টরা বেডে থাকাকালীন বাকিতে ওষুধ নিতে পারবেন। ডিসচার্জের সময় এই বিল বকেয়া হিসেবে অন্তর্ভুক্ত থাকবে এবং সম্পূর্ণ পরিশোধ সাপেক্ষে ডিসচার্জ সার্টিফিকেট প্রদান করা হবে।
                    </span>
                  </div>
                </div>
              )}

              {/* Patient Profile Card / Form */}
              {saleType === 'indoor' ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-purple-950 uppercase">
                      Inpatient Bed & Profile Information (ইনডোর রোগীর বিবরণ) *
                    </label>
                  </div>

                  {selectedAdmission ? (
                    <div className="p-4 bg-gradient-to-br from-purple-950 via-slate-900 to-purple-900 text-white rounded-2xl border border-purple-700 shadow-md space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-purple-800/80 pb-2.5">
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-purple-500 text-white uppercase tracking-wider">
                            Bed: {selectedAdmission.bedNumber} ({selectedAdmission.wardType})
                          </span>
                          <span className="font-mono text-xs text-purple-300 font-bold">
                            ID: {selectedAdmission.patientId}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-400 text-slate-950">
                            IPD Credit Active (বাকি)
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        <div>
                          <p className="text-[10px] text-purple-300 uppercase font-bold">Patient Name</p>
                          <p className="font-bold text-sm text-white">{selectedAdmission.patientName}</p>
                          <p className="text-[11px] text-purple-200">
                            Phone: {selectedAdmission.patientPhone} • {selectedAdmission.patientAge} Yrs ({selectedAdmission.patientGender})
                          </p>
                        </div>

                        <div>
                          <p className="text-[10px] text-purple-300 uppercase font-bold">Consultant & Diagnosis</p>
                          <p className="font-semibold text-white truncate">{selectedAdmission.admittingDoctorName}</p>
                          <p className="text-[11px] text-purple-200 italic truncate">{selectedAdmission.admissionDiagnosis}</p>
                        </div>
                      </div>

                      {/* Doctor Prescription Auto-Fill Option */}
                      {prescriptions.some((p) => p.patientId === selectedAdmission.patientId) && (
                        <div className="pt-2 border-t border-purple-800/80 flex items-center justify-between gap-2">
                          <span className="text-[11px] font-semibold text-teal-300 flex items-center gap-1">
                            <FileText className="w-3.5 h-3.5 text-teal-400" />
                            <span>Doctor Prescription Available for this Inpatient!</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              const rx = prescriptions.find((p) => p.patientId === selectedAdmission.patientId);
                              if (rx) handleLoadPrescription(rx.id);
                            }}
                            className="px-3 py-1 bg-teal-500 hover:bg-teal-400 text-slate-950 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                          >
                            Auto-Fill Medicines (℞)
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div>
                      {activeAdmissions.length === 0 ? (
                        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-center text-xs text-slate-500">
                          <p>Currently no active admitted inpatients in wards.</p>
                          {onNavigateToIPD && (
                            <button
                              type="button"
                              onClick={onNavigateToIPD}
                              className="mt-2 text-purple-700 font-bold hover:underline inline-flex items-center gap-1"
                            >
                              <span>Go to IPD & Admit Patient</span>
                              <ExternalLink className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {activeAdmissions.map((adm) => (
                            <button
                              key={adm.id}
                              type="button"
                              onClick={() => handleSelectAdmissionByObject(adm)}
                              className="p-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-purple-50 text-left transition-all cursor-pointer flex flex-col justify-between"
                            >
                              <div className="flex items-center justify-between">
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-900">
                                  {adm.bedNumber} ({adm.wardType})
                                </span>
                                <span className="font-mono text-[10px] text-slate-500">{adm.patientId}</span>
                              </div>
                              <div className="mt-1.5">
                                <h4 className="font-bold text-xs text-slate-900">{adm.patientName}</h4>
                                <p className="text-[10px] text-slate-500 line-clamp-1">{adm.admissionDiagnosis}</p>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Selected Registered Patient Card vs Walk-in Form */}
                  {selectedPatientId ? (
                    <div className="p-4 bg-teal-900 text-white rounded-2xl border border-teal-700 shadow-md space-y-2.5">
                      <div className="flex items-center justify-between border-b border-teal-800 pb-2">
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-0.5 rounded text-[10px] font-black bg-teal-500 text-slate-950 uppercase">
                            Registered Hospital Patient
                          </span>
                          <span className="font-mono text-xs text-teal-300 font-bold">{selectedPatientId}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedPatientId('');
                            setOutdoorName('');
                            setOutdoorPhone('');
                          }}
                          className="text-xs text-teal-300 hover:text-white underline cursor-pointer"
                        >
                          Clear / Walk-in Guest
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        <div>
                          <p className="text-[10px] text-teal-300 font-bold uppercase">Patient Name</p>
                          <p className="font-bold text-sm text-white">{outdoorName}</p>
                          <p className="text-[11px] text-teal-200">Phone: {outdoorPhone}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-teal-300 font-bold uppercase">Age & Gender</p>
                          <p className="font-semibold text-white">{outdoorAge || 'N/A'} Yrs ({outdoorGender})</p>
                          <p className="text-[10px] text-amber-300 font-bold">100% Cash / Digital Payment</p>
                        </div>
                      </div>

                      {/* Doctor Prescription Auto-Fill Option */}
                      {prescriptions.some((p) => p.patientId === selectedPatientId) && (
                        <div className="pt-2 border-t border-teal-800 flex items-center justify-between gap-2">
                          <span className="text-[11px] font-semibold text-teal-200 flex items-center gap-1">
                            <FileText className="w-3.5 h-3.5 text-teal-300" />
                            <span>Prescription ℞ available for this patient!</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              const rx = prescriptions.find((p) => p.patientId === selectedPatientId);
                              if (rx) handleLoadPrescription(rx.id);
                            }}
                            className="px-3 py-1 bg-teal-400 hover:bg-teal-300 text-slate-950 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                          >
                            Auto-Fill Medicines (℞)
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                            Patient Name *
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Md. Shoriful Islam"
                            value={outdoorName}
                            onChange={(e) => setOutdoorName(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                            Phone Number *
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="01711-XXXXXX"
                            value={outdoorPhone}
                            onChange={(e) => setOutdoorPhone(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                            Pick Registered Patient
                          </label>
                          <select
                            value={selectedPatientId}
                            onChange={(e) => {
                              const pId = e.target.value;
                              const p = patients.find((pt) => pt.id === pId);
                              if (p) handleSelectPatientByObject(p);
                            }}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                          >
                            <option value="">-- Select Registered Patient --</option>
                            {patients.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.name} ({p.id}) — {p.phone}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Load from Prescription Option */}
                      <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                        <span className="text-slate-600 font-semibold flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5 text-teal-600" />
                          <span>Dispense From Prescription:</span>
                        </span>
                        <select
                          value={selectedPrescriptionId}
                          onChange={(e) => handleLoadPrescription(e.target.value)}
                          className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-800"
                        >
                          <option value="">-- Select Prescription ℞ --</option>
                          {prescriptions.map((rx) => (
                            <option key={rx.id} value={rx.id}>
                              {rx.id} - {rx.patientName} ({rx.diagnosis || 'General'})
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Medicine Catalog & Quick Add Grid */}
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search medicine by trade name, generic or category..."
                    value={medSearchQuery}
                    onChange={(e) => setMedSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <select
                  value={medCategoryFilter}
                  onChange={(e) => setMedCategoryFilter(e.target.value)}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                >
                  <option value="all">All Dosage Forms</option>
                  <option value="Tablet">Tablet</option>
                  <option value="Capsule">Capsule</option>
                  <option value="Injection">Injection</option>
                  <option value="Saline/IV">Saline / IV Fluid</option>
                  <option value="Inhaler">Inhaler</option>
                  <option value="Suspension">Suspension/Respule</option>
                  <option value="Surgical & Consumables">Surgical & Cannula</option>
                </select>
              </div>

              {/* Medicine Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[420px] overflow-y-auto pr-1">
                {filteredCatalog.length === 0 ? (
                  <div className="col-span-2 py-8 text-center text-slate-400 text-xs">
                    No medicine found matching "{medSearchQuery}".
                  </div>
                ) : (
                  filteredCatalog.map((med) => {
                    const isOutOfStock = med.stockQuantity <= 0;
                    const isLowStock = med.stockQuantity > 0 && med.stockQuantity <= med.reorderLevel;

                    return (
                      <div
                        key={med.id}
                        className={`p-3 rounded-xl border flex flex-col justify-between transition-all ${
                          isOutOfStock
                            ? 'bg-slate-50 border-slate-200 opacity-60'
                            : 'bg-white border-slate-200 hover:border-teal-400 hover:shadow-2xs'
                        }`}
                      >
                        <div>
                          <div className="flex items-start justify-between gap-1">
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-slate-100 text-slate-600">
                              {med.category}
                            </span>
                            <span
                              className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                                isOutOfStock
                                  ? 'bg-rose-100 text-rose-700'
                                  : isLowStock
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}
                            >
                              {isOutOfStock ? 'Out of Stock' : `${med.stockQuantity} in stock`}
                            </span>
                          </div>

                          <h4 className="font-bold text-xs text-slate-900 mt-1">{med.name}</h4>
                          <p className="text-[10px] text-slate-500 line-clamp-1">{med.genericName}</p>
                          <p className="text-[9px] text-slate-400 mt-0.5">{med.manufacturer}</p>
                        </div>

                        <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between">
                          <span className="font-mono font-black text-xs text-teal-800">
                            BDT {med.unitPrice.toFixed(2)}
                          </span>

                          <button
                            type="button"
                            onClick={() => handleAddToCart(med)}
                            disabled={isOutOfStock}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
                              isOutOfStock
                                ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                : 'bg-teal-600 hover:bg-teal-500 text-white shadow-2xs'
                            }`}
                          >
                            <PlusCircle className="w-3.5 h-3.5" />
                            <span>Add</span>
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Right Column: POS Billing Cart & Settlement Form (5 Cols) */}
          <div className="lg:col-span-5">
            <form
              onSubmit={handleConfirmDispense}
              className="bg-white rounded-2xl border-2 border-slate-300 shadow-lg p-5 flex flex-col justify-between space-y-4 sticky top-4"
            >
              <div>
                {/* Cart Header */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-teal-100 text-teal-800">
                      <ShoppingCart className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-black text-base text-slate-900">Medicine Cart</h3>
                      <span className="text-[11px] text-slate-500">{cart.length} unique medicines</span>
                    </div>
                  </div>

                  <span
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase ${
                      saleType === 'indoor'
                        ? 'bg-purple-100 text-purple-900 border border-purple-200'
                        : 'bg-teal-100 text-teal-900 border border-teal-200'
                    }`}
                  >
                    {saleType === 'indoor' ? 'Indoor Credit' : 'Outdoor Cash'}
                  </span>
                </div>

                {/* Selected Patient Banner */}
                <div className="mt-3 p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-semibold">Dispensing for:</span>
                    <strong className="text-slate-900 font-bold">
                      {saleType === 'indoor'
                        ? selectedAdmission?.patientName || 'Please select Inpatient'
                        : outdoorName || 'Walk-in Outdoor Patient'}
                    </strong>
                  </div>
                  {saleType === 'indoor' && selectedAdmission && (
                    <div className="mt-1 flex items-center justify-between text-[11px] text-purple-800 font-mono">
                      <span>Bed: {selectedAdmission.bedNumber}</span>
                      <span>ID: {selectedAdmission.patientId}</span>
                    </div>
                  )}
                </div>

                {/* Cart Items List */}
                <div className="mt-3 space-y-2 max-h-56 overflow-y-auto pr-1">
                  {cart.length === 0 ? (
                    <div className="py-10 text-center text-slate-400 space-y-1">
                      <Pill className="w-8 h-8 mx-auto text-slate-300" />
                      <p className="text-xs font-semibold">Cart is empty.</p>
                      <p className="text-[10px]">Select medicines from the catalog to add.</p>
                    </div>
                  ) : (
                    cart.map((item) => (
                      <div
                        key={item.medicineId}
                        className="p-2.5 rounded-xl border border-slate-200 bg-slate-50/70 flex items-center justify-between gap-2 text-xs"
                      >
                        <div className="flex-1 min-w-0">
                          <h5 className="font-bold text-slate-900 truncate">{item.medicineName}</h5>
                          <div className="flex items-center gap-2 text-[10px] text-slate-500">
                            <span>BDT {item.unitPrice.toFixed(2)}/unit</span>
                          </div>
                        </div>

                        {/* Quantity Controls */}
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            min="1"
                            max="999"
                            value={item.quantity}
                            onChange={(e) => handleUpdateCartQuantity(item.medicineId, Number(e.target.value) || 1)}
                            className="w-14 px-2 py-1 bg-white border border-slate-300 rounded-lg text-center font-mono font-bold text-xs"
                          />
                          <span className="font-mono font-black text-slate-900 w-16 text-right">
                            BDT {item.total.toFixed(2)}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveFromCart(item.medicineId)}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Calculation Breakdown */}
                {cart.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-slate-200 space-y-2 text-xs">
                    <div className="flex justify-between text-slate-600">
                      <span>Subtotal:</span>
                      <span className="font-mono font-bold">BDT {cartSubtotal.toFixed(2)}</span>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <span className="text-slate-600">Discount (BDT):</span>
                      <input
                        type="number"
                        min="0"
                        max={cartSubtotal}
                        value={discount}
                        onChange={(e) => setDiscount(Math.max(0, Number(e.target.value) || 0))}
                        className="w-24 px-2 py-0.5 bg-slate-50 border border-slate-200 rounded-lg text-right font-mono font-bold text-xs"
                      />
                    </div>

                    <div className="flex justify-between text-slate-900 font-bold text-sm pt-1 border-t border-slate-200">
                      <span>Net Total Payable:</span>
                      <span className="font-mono font-black text-base text-teal-900">
                        BDT {cartNetTotal.toFixed(2)}
                      </span>
                    </div>

                    {/* Payment Mode Selection */}
                    <div className="pt-2 border-t border-slate-200 space-y-1.5">
                      <label className="block text-[11px] font-bold text-slate-700 uppercase">
                        Payment Mode (পরিশোধের মাধ্যম) *
                      </label>

                      {saleType === 'indoor' ? (
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setPaymentMethod('IPD_Credit');
                              setPaidAmountInput(0);
                            }}
                            className={`p-2 rounded-xl text-xs font-bold border transition-all cursor-pointer text-center ${
                              paymentMethod === 'IPD_Credit'
                                ? 'bg-purple-900 text-white border-purple-900 shadow-xs'
                                : 'bg-purple-50 text-purple-900 border-purple-200 hover:bg-purple-100'
                            }`}
                          >
                            <span>বাকিতে নিন (IPD Credit)</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setPaymentMethod('Cash');
                              setPaidAmountInput(cartNetTotal);
                            }}
                            className={`p-2 rounded-xl text-xs font-bold border transition-all cursor-pointer text-center ${
                              paymentMethod === 'Cash'
                                ? 'bg-teal-700 text-white border-teal-700 shadow-xs'
                                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            <span>নগদ পরিশোধ (Cash)</span>
                          </button>
                        </div>
                      ) : (
                        <div className="grid grid-cols-4 gap-1.5">
                          {(['Cash', 'bKash', 'Nagad', 'Card'] as const).map((method) => (
                            <button
                              key={method}
                              type="button"
                              onClick={() => setPaymentMethod(method)}
                              className={`py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                                paymentMethod === method
                                  ? 'bg-teal-700 text-white border-teal-700'
                                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                              }`}
                            >
                              {method}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Paid Amount vs Due Breakdown for Inpatient */}
                    {saleType === 'indoor' && (
                      <div className="p-3 bg-purple-50/70 border border-purple-200 rounded-xl space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-purple-950 font-bold text-[11px]">Paid Now (জমা):</span>
                          <input
                            type="number"
                            min="0"
                            max={cartNetTotal}
                            value={paidAmountInput}
                            onChange={(e) => setPaidAmountInput(Math.max(0, Number(e.target.value) || 0))}
                            className="w-28 px-2 py-1 bg-white border border-purple-300 rounded-lg text-right font-mono font-bold text-xs"
                          />
                        </div>
                        <div className="flex items-center justify-between text-rose-700 font-bold">
                          <span>Inpatient Credit Due (বকেয়া):</span>
                          <span className="font-mono font-black text-sm">BDT {effectiveDueAmount.toFixed(2)}</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={cart.length === 0 || (saleType === 'indoor' && !selectedAdmission)}
                  className={`w-full py-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer ${
                    cart.length === 0 || (saleType === 'indoor' && !selectedAdmission)
                      ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                      : saleType === 'indoor'
                      ? 'bg-purple-900 hover:bg-purple-800 text-white shadow-purple-900/20'
                      : 'bg-teal-600 hover:bg-teal-500 text-white shadow-teal-600/20'
                  }`}
                >
                  <Receipt className="w-4 h-4" />
                  <span>
                    {saleType === 'indoor'
                      ? `Confirm Inpatient Dispense (BDT ${cartNetTotal.toFixed(2)})`
                      : `Confirm Sale & Collect BDT ${cartNetTotal.toFixed(2)}`}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: MEDICINE INVENTORY & STOCK MANAGEMENT */}
      {/* ========================================================================= */}
      {activeTab === 'inventory' && (
        <div className="space-y-4">
          {/* Inventory Controls Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
              <div className="relative flex-1 max-w-sm">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search brand, generic, rack location or batch..."
                  value={inventorySearch}
                  onChange={(e) => setInventorySearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <select
                value={inventoryCategoryFilter}
                onChange={(e) => setInventoryCategoryFilter(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
              >
                <option value="all">All Dosage Forms</option>
                <option value="Tablet">Tablet</option>
                <option value="Capsule">Capsule</option>
                <option value="Injection">Injection</option>
                <option value="Saline/IV">Saline / IV Fluid</option>
                <option value="Inhaler">Inhaler</option>
                <option value="Suspension">Suspension/Respule</option>
                <option value="Surgical & Consumables">Surgical & Cannula</option>
              </select>

              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setStockFilter('all')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    stockFilter === 'all' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
                  }`}
                >
                  All ({medicines.length})
                </button>
                <button
                  type="button"
                  onClick={() => setStockFilter('low')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    stockFilter === 'low' ? 'bg-amber-500 text-slate-950 shadow-2xs' : 'text-slate-600'
                  }`}
                >
                  Low Stock ({lowStockCount})
                </button>
              </div>
            </div>

            <button
              onClick={handleOpenAddMedicine}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>+ Add New Medicine</span>
            </button>
          </div>

          {/* Medicines Table */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-900 text-white uppercase text-[10px] font-bold">
                  <tr>
                    <th className="py-3 px-3.5">Code</th>
                    <th className="py-3 px-3.5">Brand / Medicine Name</th>
                    <th className="py-3 px-3.5">Generic & Form</th>
                    <th className="py-3 px-3.5">Manufacturer</th>
                    <th className="py-3 px-3.5 text-right">Unit Price</th>
                    <th className="py-3 px-3.5 text-center">Stock Level</th>
                    <th className="py-3 px-3.5">Rack Location</th>
                    <th className="py-3 px-3.5">Batch / Expiry</th>
                    <th className="py-3 px-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredInventory.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-10 text-center text-slate-400">
                        No medicines match the selected filter.
                      </td>
                    </tr>
                  ) : (
                    filteredInventory.map((med) => {
                      const isLow = med.stockQuantity <= med.reorderLevel;

                      return (
                        <tr key={med.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-3.5 font-mono font-bold text-slate-700">{med.code}</td>
                          <td className="py-3 px-3.5 font-bold text-slate-900">{med.name}</td>
                          <td className="py-3 px-3.5">
                            <span className="font-semibold text-slate-800">{med.genericName}</span>
                            <span className="text-[10px] text-slate-400 block">{med.category} • {med.packSize}</span>
                          </td>
                          <td className="py-3 px-3.5 text-slate-600">{med.manufacturer}</td>
                          <td className="py-3 px-3.5 text-right font-mono font-bold text-teal-800">
                            BDT {med.unitPrice.toFixed(2)}
                          </td>
                          <td className="py-3 px-3.5 text-center">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-bold ${
                                med.stockQuantity === 0
                                  ? 'bg-rose-100 text-rose-800'
                                  : isLow
                                  ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}
                            >
                              {med.stockQuantity} units
                            </span>
                          </td>
                          <td className="py-3 px-3.5 font-mono text-slate-600">{med.rackLocation}</td>
                          <td className="py-3 px-3.5 font-mono text-[11px] text-slate-500">
                            <div>{med.batchNo}</div>
                            <div className="text-[10px] text-slate-400">Exp: {med.expiryDate}</div>
                          </td>
                          <td className="py-3 px-3.5 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => setBarcodeStickerMed(med)}
                                className="px-2 py-1 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                                title="Generate & Print Price & Barcode Stickers for this Medicine"
                              >
                                <Tag className="w-3.5 h-3.5 text-teal-700" />
                                <span>Barcode Stickers</span>
                              </button>
                              <button
                                onClick={() => handleOpenEditMedicine(med)}
                                className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg cursor-pointer"
                                title="Edit Medicine Details"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteMedicine(med.id)}
                                className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                                title="Delete Medicine"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
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
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: SALES ARCHIVE & INPATIENT CREDIT LEDGER */}
      {/* ========================================================================= */}
      {activeTab === 'sales' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="relative flex-1 min-w-[280px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by invoice, patient name, ID or bed number..."
                value={salesSearch}
                onChange={(e) => setSalesSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setSalesTypeFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  salesTypeFilter === 'all' ? 'bg-slate-900 text-white shadow-2xs' : 'text-slate-600'
                }`}
              >
                All Sales ({sales.length})
              </button>
              <button
                type="button"
                onClick={() => setSalesTypeFilter('indoor')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  salesTypeFilter === 'indoor' ? 'bg-purple-900 text-white shadow-2xs' : 'text-slate-600'
                }`}
              >
                Indoor Inpatients ({sales.filter((s) => s.saleType === 'indoor').length})
              </button>
              <button
                type="button"
                onClick={() => setSalesTypeFilter('due')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  salesTypeFilter === 'due' ? 'bg-rose-600 text-white shadow-2xs' : 'text-slate-600'
                }`}
              >
                Credit Due ({sales.filter((s) => s.dueAmount > 0).length})
              </button>
              <button
                type="button"
                onClick={() => setSalesTypeFilter('outdoor')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  salesTypeFilter === 'outdoor' ? 'bg-teal-700 text-white shadow-2xs' : 'text-slate-600'
                }`}
              >
                Outdoor ({sales.filter((s) => s.saleType === 'outdoor').length})
              </button>
            </div>
          </div>

          {/* Sales Table */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-900 text-white uppercase text-[10px] font-bold">
                  <tr>
                    <th className="py-3 px-3.5">Invoice #</th>
                    <th className="py-3 px-3.5">Patient Details</th>
                    <th className="py-3 px-3.5">Type & Bed</th>
                    <th className="py-3 px-3.5">Medicines Dispensed</th>
                    <th className="py-3 px-3.5 text-right">Total (BDT)</th>
                    <th className="py-3 px-3.5 text-right">Paid (BDT)</th>
                    <th className="py-3 px-3.5 text-right">Due (BDT)</th>
                    <th className="py-3 px-3.5 text-center">Status</th>
                    <th className="py-3 px-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredSales.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-10 text-center text-slate-400">
                        No pharmacy transactions match the filter.
                      </td>
                    </tr>
                  ) : (
                    filteredSales.map((sale) => (
                      <tr key={sale.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-3.5 font-mono font-bold text-slate-800">
                          {sale.invoiceNumber || sale.id}
                        </td>
                        <td className="py-3 px-3.5">
                          <span className="font-bold text-slate-900 block">{sale.patientName}</span>
                          <span className="font-mono text-[10px] text-slate-500">{sale.patientId} • {sale.patientPhone}</span>
                        </td>
                        <td className="py-3 px-3.5">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              sale.saleType === 'indoor'
                                ? 'bg-purple-100 text-purple-900 border border-purple-200'
                                : 'bg-teal-100 text-teal-900 border border-teal-200'
                            }`}
                          >
                            {sale.saleType === 'indoor' ? 'Inpatient' : 'Outdoor'}
                          </span>
                          {sale.bedNumber && (
                            <span className="text-[10px] text-slate-600 block font-semibold mt-0.5">
                              {sale.bedNumber}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3.5 text-slate-600 max-w-xs truncate">
                          {sale.items.map((i) => `${i.medicineName} (${i.quantity})`).join(', ')}
                        </td>
                        <td className="py-3 px-3.5 text-right font-mono font-bold text-slate-900">
                          {sale.total.toFixed(2)}
                        </td>
                        <td className="py-3 px-3.5 text-right font-mono font-bold text-emerald-700">
                          {sale.paidAmount.toFixed(2)}
                        </td>
                        <td className={`py-3 px-3.5 text-right font-mono font-bold ${sale.dueAmount > 0 ? 'text-rose-700' : 'text-slate-400'}`}>
                          {sale.dueAmount.toFixed(2)}
                        </td>
                        <td className="py-3 px-3.5 text-center">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              sale.dueAmount === 0
                                ? 'bg-emerald-100 text-emerald-800'
                                : sale.paidAmount > 0
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {sale.dueAmount === 0 ? 'Paid' : 'Credit Due'}
                          </span>
                        </td>
                        <td className="py-3 px-3.5 text-right">
                          <button
                            type="button"
                            onClick={() => onOpenPrintSlip(sale)}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-teal-50 hover:text-teal-800 text-slate-700 rounded-lg text-xs font-semibold inline-flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            <Printer className="w-3.5 h-3.5 text-slate-500" />
                            <span>Slip</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ADD / EDIT MEDICINE MODAL */}
      {/* ========================================================================= */}
      {isAddMedModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl my-auto overflow-hidden">
            <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <Pill className="w-4 h-4 text-teal-400" />
                <span>{editingMed ? `Edit Medicine: ${editingMed.name}` : 'Add New Medicine to Pharmacy'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsAddMedModalOpen(false)}
                className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveMedicineForm} className="p-5 space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Medicine Trade Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Tab. Napa Extra 500mg+65mg"
                    value={medFormName}
                    onChange={(e) => setMedFormName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Generic Composition *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Paracetamol + Caffeine"
                    value={medFormGeneric}
                    onChange={(e) => setMedFormGeneric(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Dosage Form *
                  </label>
                  <select
                    value={medFormCategory}
                    onChange={(e) => setMedFormCategory(e.target.value as PharmacyMedicine['category'])}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                  >
                    <option value="Tablet">Tablet</option>
                    <option value="Capsule">Capsule</option>
                    <option value="Syrup">Syrup</option>
                    <option value="Suspension">Suspension</option>
                    <option value="Injection">Injection</option>
                    <option value="Saline/IV">Saline/IV</option>
                    <option value="Ointment">Ointment</option>
                    <option value="Inhaler">Inhaler</option>
                    <option value="Eye/Ear Drops">Eye/Ear Drops</option>
                    <option value="Surgical & Consumables">Surgical & Consumables</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Manufacturer *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Square Pharma"
                    value={medFormManufacturer}
                    onChange={(e) => setMedFormManufacturer(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Unit Price (BDT) *
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    required
                    value={medFormUnitPrice}
                    onChange={(e) => setMedFormUnitPrice(Number(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Current Stock Quantity *
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={medFormStock}
                    onChange={(e) => setMedFormStock(Number(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Reorder Alert Level *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={medFormReorder}
                    onChange={(e) => setMedFormReorder(Number(e.target.value) || 1)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Rack Location *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Rack A-1"
                    value={medFormRack}
                    onChange={(e) => setMedFormRack(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Batch Number *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="BATCH-2026-01"
                    value={medFormBatch}
                    onChange={(e) => setMedFormBatch(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Expiry Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={medFormExpiry}
                    onChange={(e) => setMedFormExpiry(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsAddMedModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{editingMed ? 'Save Medicine Updates' : 'Confirm & Add Medicine'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PHARMACY BARCODE SCANNER CAMERA MODAL */}
      {/* ========================================================================= */}
      {isPharmacyScannerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 text-white rounded-3xl p-6 w-full max-w-md shadow-2xl border border-slate-700 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-teal-500/20 text-teal-300">
                  <Scan className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">Scan Patient Card Barcode</h3>
                  <p className="text-[11px] text-slate-400">Outdoor OPD Card or Inpatient Admission Slip</p>
                </div>
              </div>

              <button
                onClick={() => setIsPharmacyScannerOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Camera Region */}
            <div className="relative">
              <div
                id="pharmacy-pos-camera-region"
                className="w-full h-64 bg-black rounded-2xl overflow-hidden border-2 border-teal-500 flex items-center justify-center"
              ></div>

              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="w-48 h-48 border-2 border-teal-400/60 rounded-xl relative animate-pulse">
                  <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-teal-400"></div>
                  <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-teal-400"></div>
                  <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-teal-400"></div>
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-teal-400"></div>
                </div>
              </div>
            </div>

            {/* Helper Instructions */}
            <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700 text-xs text-slate-300 text-center space-y-1">
              <p className="font-bold text-white">Position barcode card in front of camera</p>
              <p className="text-[11px] text-slate-400">
                You can also use a physical USB Barcode Scanner gun anywhere on the screen!
              </p>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setIsPharmacyScannerOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Close Camera
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MEDICINE PRICE & BARCODE STICKER PRINT MODAL */}
      {/* ========================================================================= */}
      <MedicineBarcodePrintModal
        medicine={barcodeStickerMed}
        onClose={() => setBarcodeStickerMed(null)}
        hospitalSettings={hospitalSettings}
      />
    </div>
  );
};
