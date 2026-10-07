export type Role = 'admin' | 'doctor' | 'receptionist' | 'accountant' | 'lab_technician';

export interface Staff {
  id: string;
  name: string;
  role: Role;
  department: string;
  phone: string;
  email: string;
  shift: string;
  status: 'active' | 'on_leave';
  qualification?: string;
  bmdcReg?: string;
  consultationFee?: number;
  roomNo?: string;
  specialization?: string;
  avatar?: string;
  password?: string;
  allowedTabs?: string[];
}

export interface Patient {
  id: string; // e.g. P-2026-001
  name: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  phone: string;
  bloodGroup: 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';
  address: string;
  emergencyContact: string;
  registeredAt: string;
  allergies?: string;
  medicalHistory?: string;
}

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  specialization: string;
  date: string;
  timeSlot: string;
  serialNumber: number;
  fee: number;
  status: 'scheduled' | 'waiting' | 'in_consultation' | 'completed' | 'cancelled';
  notes?: string;
}

export interface BillingItem {
  id: string;
  name: string;
  category: 'consultation' | 'lab_test' | 'medicine' | 'service' | 'bed';
  price: number;
  quantity: number;
  total: number;
  roomNo?: string;
  roomLocation?: string;
}

export interface PaymentRecord {
  id: string;
  date: string;
  amount: number;
  method: 'Cash' | 'bKash' | 'Nagad' | 'Card';
  collectedBy: string;
  receiptNo: string;
  notes?: string;
}

export interface Invoice {
  id: string; // e.g. INV-2026-1001
  patientId: string;
  patientName: string;
  patientPhone: string;
  date: string;
  items: BillingItem[];
  subtotal: number;
  discount: number;
  total: number;
  paidAmount: number;
  dueAmount: number;
  status: 'paid' | 'partial' | 'due';
  collectedBy: string;
  paymentHistory: PaymentRecord[];
}

export interface MedicineItem {
  name: string;
  dosage: string; // e.g., "1+0+1" or "1+1+1"
  duration: string; // e.g., "7 Days"
  instruction: string; // e.g., "After meal"
}

export interface Prescription {
  id: string; // e.g. RX-2026-001
  patientId: string;
  patientName: string;
  patientAge: number;
  patientGender: string;
  patientPhone: string;
  doctorId: string;
  doctorName: string;
  doctorSpecialty: string;
  doctorDegrees: string;
  doctorBmdc: string;
  date: string;
  vitals: {
    bp: string;
    pulse: string;
    temp: string;
    weight: string;
    spo2: string;
    rbs: string;
  };
  chiefComplaints: string[];
  clinicalFindings: string;
  diagnosis: string;
  medicines: MedicineItem[];
  recommendedTests: string[];
  advice: string;
  nextVisitDate: string;
}

export interface LabTestCatalogItem {
  id: string;
  code: string;
  name: string;
  category: 'Hematology' | 'Biochemistry' | 'Clinical Pathology' | 'Radiology' | 'Microbiology' | 'Cardiology';
  price: number;
  sampleType: string;
  deliveryHours: number;
  description: string;
  roomNo?: string;
  floor?: string;
  roomLocation?: string;
}

export interface CbcParameterDetail {
  val: number;
  unit: string;
  refRange: string;
  status: 'normal' | 'low' | 'high';
}

export interface TestParameterResult {
  name: string;
  result: string;
  unit: string;
  refRange: string;
  status: 'normal' | 'low' | 'high' | 'abnormal';
}

export interface TestTemplateParameter {
  name: string;
  defaultVal?: string;
  unit: string;
  refRange: string;
  minNormal?: number;
  maxNormal?: number;
  type?: 'number' | 'text' | 'select';
  options?: string[];
}

export interface TestTemplate {
  id: string;
  code: string;
  name: string;
  category: string;
  defaultPrice: number;
  sampleType: string;
  parameters: TestTemplateParameter[];
  defaultRemarks?: string;
  isRadiology?: boolean;
}

export interface LabReport {
  id: string; // e.g. LAB-2026-501
  invoiceId?: string;
  patientId: string;
  patientName: string;
  patientAge: number;
  patientGender: string;
  testType: string; // 'CBC' | 'LIPID' | 'LFT' | 'KIDNEY' | 'SUGAR' | 'ELECTROLYTES' | 'URINE' | 'THYROID' | 'RADIOLOGY' | 'CUSTOM'
  testName: string;
  referredByDoctor: string;
  sampleCollectedAt: string;
  reportedAt: string;
  pathologistName: string;
  pathologistDegree: string;
  status: 'pending' | 'in_progress' | 'completed';
  parameters?: TestParameterResult[];
  radiologyFindings?: string;
  radiologyImpression?: string;
  cbcParameters?: {
    hemoglobin: CbcParameterDetail;
    esr: CbcParameterDetail;
    totalWbc: CbcParameterDetail;
    neutrophils: CbcParameterDetail;
    lymphocytes: CbcParameterDetail;
    monocytes: CbcParameterDetail;
    eosinophils: CbcParameterDetail;
    basophils: CbcParameterDetail;
    plateletCount: CbcParameterDetail;
    rbcCount: CbcParameterDetail;
    pcvHematocrit: CbcParameterDetail;
    mcv: CbcParameterDetail;
    mch: CbcParameterDetail;
    mchc: CbcParameterDetail;
  };
  customParameters?: Array<{
    parameter: string;
    result: string;
    unit: string;
    refRange: string;
    flag: 'normal' | 'low' | 'high' | 'abnormal';
  }>;
  clinicalRemarks: string;
  deliveredAt?: string;
  deliveredBy?: string;
}

export interface HospitalSettings {
  name: string;
  nameBangla: string;
  slogan: string;
  address: string;
  addressEnglish: string;
  phone: string;
  hotline: string;
  email: string;
  website: string;
  govtRegNo: string;
  prescriptionDept: string;
  billingDept: string;
  labDept: string;
  appointmentDept: string;
  footerNotice?: string;
  customLogoUrl?: string;
  bedRates?: Record<WardType, number>;
  autoChargeBedRentHours?: number; // default 24
}

export type AuthType = 'staff' | 'patient';

export interface AuthSession {
  isAuthenticated: boolean;
  type: AuthType;
  staffUser?: Staff;
  patientUser?: Patient;
  loginTime?: string;
}

export type WardType =
  | 'General Ward'
  | 'Female Ward'
  | 'Male Ward'
  | 'Semi-Cabin'
  | 'VIP Cabin'
  | 'ICU'
  | 'CCU'
  | 'Post-Operative';

export interface HospitalBed {
  id: string;
  bedNumber: string;
  roomNumber?: string; // e.g. "Room 101", "Cabin 301", "ICU Room A"
  wardType: WardType;
  floor: string;
  dailyRate: number;
  isOccupied: boolean;
  currentPatientId?: string;
  currentPatientName?: string;
  currentAdmissionId?: string;
  admittedAt?: string;
  admissionDiagnosis?: string;
  admittingDoctorName?: string;
  features?: string[];
}

export interface DischargeSummary {
  id: string; // e.g. DIS-2026-001
  admissionId: string;
  patientId: string;
  patientName: string;
  patientAge: number;
  patientGender: string;
  patientPhone: string;
  admissionDate: string;
  dischargeDate: string;
  durationOfStayDays: number;
  bedNumber: string;
  wardType: string;
  consultantName: string;
  consultantSpecialty: string;
  finalDiagnosis: string;
  chiefComplaints: string;
  clinicalSummary: string; // Hospital Course
  proceduresDone?: string;
  investigationsSummary: string;
  conditionAtDischarge: 'Recovered' | 'Clinically Improved' | 'Stable' | 'Referred' | 'Discharged on Request (DORB)';
  dischargeMedicines: MedicineItem[];
  followUpAdvice: string;
  nextVisitDate: string;
  emergencyInstructions: string;
  dietaryAdvice?: string;
  totalBedCharges: number;
  generatedBy: string;
  generatedAt: string;
}

export interface IPDAdmission {
  id: string; // e.g. IPD-2026-001
  admissionNumber?: string;
  finalInvoiceId?: string;
  patientId: string;
  patientName: string;
  patientPhone: string;
  patientAge: number;
  patientGender: string;
  patientBloodGroup?: string;
  admittedAt: string;
  dischargedAt?: string;
  admittingDoctorId: string;
  admittingDoctorName: string;
  admittingDepartment: string;
  bedId: string;
  bedNumber: string;
  wardType: WardType;
  dailyBedCharge: number;
  admissionDiagnosis: string;
  status: 'admitted' | 'discharged' | 'transferred';
  advancePayment?: number;
  vitalsHistory?: Array<{
    id: string;
    date: string;
    bp: string;
    pulse: string;
    temp: string;
    spo2: string;
    rbs?: string;
    recordedBy: string;
  }>;
  doctorNotes?: Array<{
    id: string;
    date: string;
    doctorName: string;
    note: string;
    orders?: string;
  }>;
  dischargeSummary?: DischargeSummary;
}

export interface OPDOrder {
  id: string; // e.g. OPD-2026-101
  patientId: string;
  patientName: string;
  patientPhone: string;
  patientAge: number;
  patientGender: string;
  date: string;
  doctorId: string;
  doctorName: string;
  department: string;
  tokenNumber: number;
  vitals?: {
    bp: string;
    pulse: string;
    temp: string;
    weight?: string;
    spo2?: string;
  };
  complaints?: string;
  testItemIds: string[];
  invoiceId?: string;
  status: 'waiting' | 'in_consultation' | 'completed';
}

export type MedicineDosageForm =
  | 'Tablet'
  | 'Capsule'
  | 'Syrup'
  | 'Suspension'
  | 'Injection'
  | 'Saline/IV'
  | 'Ointment'
  | 'Inhaler'
  | 'Eye/Ear Drops'
  | 'Suppository'
  | 'Surgical & Consumables';

export interface PharmacyMedicine {
  id: string; // e.g. MED-001
  code: string; // e.g. NAPA-500
  name: string; // e.g. Napa Extra 500mg/65mg
  genericName: string; // e.g. Paracetamol + Caffeine
  category: MedicineDosageForm;
  manufacturer: string; // e.g. Beximco Pharma
  unitPrice: number; // e.g. 2.50
  packSize: string; // e.g. Strip of 10 / Box of 100
  stockQuantity: number; // e.g. 350
  reorderLevel: number; // e.g. 50
  rackLocation: string; // e.g. Rack A-1
  batchNo: string; // e.g. BATCH-2026-88
  expiryDate: string; // e.g. 2027-11-30
  description?: string;
}

export interface PharmacySaleItem {
  medicineId: string;
  medicineName: string;
  genericName: string;
  category: string;
  unitPrice: number;
  quantity: number;
  total: number;
}

export interface PharmacySale {
  id: string; // e.g. PHARM-2026-001
  invoiceNumber?: string;
  saleType: 'indoor' | 'outdoor';
  patientId: string;
  patientName: string;
  patientPhone: string;
  patientAge?: number;
  patientGender?: string;
  bedNumber?: string;
  admissionId?: string;
  prescriptionId?: string;
  items: PharmacySaleItem[];
  subtotal: number;
  discount: number;
  total: number;
  paidAmount: number;
  dueAmount: number;
  paymentMethod: 'Cash' | 'bKash' | 'Nagad' | 'Card' | 'IPD_Credit';
  paymentStatus: 'paid' | 'partial' | 'due';
  dispensedBy: string;
  dispensedAt: string;
  notes?: string;
  clearedAtDischarge?: boolean;
}

