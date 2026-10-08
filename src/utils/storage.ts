import {
  Staff,
  Patient,
  Appointment,
  Invoice,
  Prescription,
  LabTestCatalogItem,
  LabReport,
  HospitalSettings,
  AuthSession,
  HospitalBed,
  IPDAdmission,
  OPDOrder,
  PharmacyMedicine,
  PharmacySale,
} from '../types';
import {
  INITIAL_STAFF,
  INITIAL_PATIENTS,
  INITIAL_APPOINTMENTS,
  INITIAL_INVOICES,
  INITIAL_PRESCRIPTIONS,
  INITIAL_LAB_REPORTS,
  INITIAL_TEST_CATALOG,
  INITIAL_HOSPITAL_SETTINGS,
  INITIAL_BEDS,
  INITIAL_IPD_ADMISSIONS,
  INITIAL_OPD_ORDERS,
  INITIAL_PHARMACY_MEDICINES,
  INITIAL_PHARMACY_SALES,
} from '../data/mockData';

const STORAGE_KEYS = {
  STAFF: 'medpulse_staff_v1',
  PATIENTS: 'medpulse_patients_v1',
  APPOINTMENTS: 'medpulse_appointments_v1',
  INVOICES: 'medpulse_invoices_v1',
  PRESCRIPTIONS: 'medpulse_prescriptions_v1',
  LAB_REPORTS: 'medpulse_lab_reports_v1',
  TEST_CATALOG: 'medpulse_test_catalog_v1',
  ACTIVE_USER: 'medpulse_active_user_v1',
  HOSPITAL_SETTINGS: 'medpulse_hospital_settings_v1',
  AUTH_SESSION: 'medpulse_auth_session_v1',
  BEDS: 'medpulse_beds_v1',
  IPD_ADMISSIONS: 'medpulse_ipd_admissions_v1',
  OPD_ORDERS: 'medpulse_opd_orders_v1',
  PHARMACY_MEDICINES: 'medpulse_pharmacy_medicines_v1',
  PHARMACY_SALES: 'medpulse_pharmacy_sales_v1',
};

function safeGet<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(key);
    if (!item) return fallback;
    return JSON.parse(item) as T;
  } catch (err) {
    console.error(`Error loading ${key} from storage:`, err);
    return fallback;
  }
}

function safeSet<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.error(`Error saving ${key} to storage:`, err);
  }
}

export const loadStaff = (): Staff[] => {
  const loaded = safeGet<Staff[]>(STORAGE_KEYS.STAFF, INITIAL_STAFF);
  return loaded.map((s) => {
    const initMatch = INITIAL_STAFF.find((init) => init.id === s.id);
    return {
      ...s,
      password: s.password || initMatch?.password || '123456',
      allowedTabs:
        s.allowedTabs && s.allowedTabs.length > 0
          ? s.allowedTabs
          : initMatch?.allowedTabs || (s.role === 'admin' ? ['dashboard', 'patients', 'opd', 'ipd', 'pharmacy', 'billing', 'finance', 'prescriptions', 'lab', 'delivery', 'appointments', 'staff', 'settings'] : ['dashboard']),
    };
  });
};
export const saveStaff = (staff: Staff[]) => safeSet(STORAGE_KEYS.STAFF, staff);

export const loadPatients = (): Patient[] => safeGet(STORAGE_KEYS.PATIENTS, INITIAL_PATIENTS);
export const savePatients = (patients: Patient[]) => safeSet(STORAGE_KEYS.PATIENTS, patients);

export const loadAppointments = (): Appointment[] => safeGet(STORAGE_KEYS.APPOINTMENTS, INITIAL_APPOINTMENTS);
export const saveAppointments = (appointments: Appointment[]) => safeSet(STORAGE_KEYS.APPOINTMENTS, appointments);

export const loadInvoices = (): Invoice[] => safeGet(STORAGE_KEYS.INVOICES, INITIAL_INVOICES);
export const saveInvoices = (invoices: Invoice[]) => safeSet(STORAGE_KEYS.INVOICES, invoices);

export const loadPrescriptions = (): Prescription[] => safeGet(STORAGE_KEYS.PRESCRIPTIONS, INITIAL_PRESCRIPTIONS);
export const savePrescriptions = (prescriptions: Prescription[]) => safeSet(STORAGE_KEYS.PRESCRIPTIONS, prescriptions);

export const loadLabReports = (): LabReport[] => safeGet(STORAGE_KEYS.LAB_REPORTS, INITIAL_LAB_REPORTS);
export const saveLabReports = (reports: LabReport[]) => safeSet(STORAGE_KEYS.LAB_REPORTS, reports);

export const loadTestCatalog = (): LabTestCatalogItem[] => {
  const loaded = safeGet<LabTestCatalogItem[]>(STORAGE_KEYS.TEST_CATALOG, INITIAL_TEST_CATALOG);
  // Ensure default room numbers are populated if older storage lacked them
  return loaded.map((item) => {
    const defaultMatch = INITIAL_TEST_CATALOG.find((init) => init.id === item.id || init.code === item.code);
    return {
      ...item,
      roomNo: item.roomNo || defaultMatch?.roomNo || '102',
      floor: item.floor || defaultMatch?.floor || '1st Floor',
      roomLocation: item.roomLocation || defaultMatch?.roomLocation || (item.roomNo ? `Room ${item.roomNo} (${item.floor || '1st Floor'})` : defaultMatch?.roomLocation || '1st Floor Lab'),
    };
  });
};
export const saveTestCatalog = (catalog: LabTestCatalogItem[]) => safeSet(STORAGE_KEYS.TEST_CATALOG, catalog);

export const loadActiveUser = (): Staff => {
  const staff = loadStaff();
  const saved = safeGet<Staff | null>(STORAGE_KEYS.ACTIVE_USER, null);
  if (saved && staff.some(s => s.id === saved.id)) return saved;
  // Default to Admin or first staff
  return staff.find(s => s.role === 'admin') || staff[0];
};

export const saveActiveUser = (user: Staff) => safeSet(STORAGE_KEYS.ACTIVE_USER, user);

export const loadHospitalSettings = (): HospitalSettings => {
  const loaded = safeGet<HospitalSettings>(STORAGE_KEYS.HOSPITAL_SETTINGS, INITIAL_HOSPITAL_SETTINGS);
  return {
    ...loaded,
    softwareCredits: loaded.softwareCredits || 'Software By : Shoriful Islam',
  };
};
export const saveHospitalSettings = (settings: HospitalSettings) =>
  safeSet(STORAGE_KEYS.HOSPITAL_SETTINGS, settings);

export const loadAuthSession = (): AuthSession | null =>
  safeGet<AuthSession | null>(STORAGE_KEYS.AUTH_SESSION, null);

export const saveAuthSession = (session: AuthSession | null) => {
  if (session) {
    safeSet(STORAGE_KEYS.AUTH_SESSION, session);
  } else {
    localStorage.removeItem(STORAGE_KEYS.AUTH_SESSION);
  }
};

export const clearAuthSession = () => {
  localStorage.removeItem(STORAGE_KEYS.AUTH_SESSION);
};

export const loadBeds = (): HospitalBed[] => {
  const loaded = safeGet<HospitalBed[]>(STORAGE_KEYS.BEDS, INITIAL_BEDS);
  const admissions = safeGet<IPDAdmission[]>(STORAGE_KEYS.IPD_ADMISSIONS, INITIAL_IPD_ADMISSIONS);
  const activeAdmissions = admissions.filter((a) => a.status === 'admitted');

  return loaded.map((bed) => {
    let room = bed.roomNumber;
    if (!room) {
      if (bed.bedNumber.includes('101') || bed.bedNumber.includes('102')) room = 'Room 101';
      else if (bed.bedNumber.includes('201') || bed.bedNumber.includes('202')) room = 'Room 201';
      else if (bed.bedNumber.toLowerCase().includes('301') || bed.id === 'BED-105') room = 'Cabin 301';
      else if (bed.bedNumber.toLowerCase().includes('302') || bed.id === 'BED-106') room = 'Cabin 302';
      else if (bed.wardType === 'ICU') room = 'ICU Unit A';
      else if (bed.wardType === 'CCU') room = 'CCU Unit B';
      else room = `${bed.wardType} - Room`;
    }

    const matchingAdm = activeAdmissions.find((a) => a.bedId === bed.id);
    if (matchingAdm) {
      return {
        ...bed,
        roomNumber: room,
        isOccupied: true,
        currentPatientId: matchingAdm.patientId,
        currentPatientName: matchingAdm.patientName,
        currentAdmissionId: matchingAdm.id,
        admittedAt: matchingAdm.admittedAt,
        admissionDiagnosis: matchingAdm.admissionDiagnosis,
        admittingDoctorName: matchingAdm.admittingDoctorName,
      };
    } else {
      return {
        ...bed,
        roomNumber: room,
        isOccupied: false,
        currentPatientId: undefined,
        currentPatientName: undefined,
        currentAdmissionId: undefined,
        admittedAt: undefined,
        admissionDiagnosis: undefined,
        admittingDoctorName: undefined,
      };
    }
  });
};
export const saveBeds = (beds: HospitalBed[]) =>
  safeSet(STORAGE_KEYS.BEDS, beds);

export const loadIPDAdmissions = (): IPDAdmission[] =>
  safeGet(STORAGE_KEYS.IPD_ADMISSIONS, INITIAL_IPD_ADMISSIONS);
export const saveIPDAdmissions = (admissions: IPDAdmission[]) =>
  safeSet(STORAGE_KEYS.IPD_ADMISSIONS, admissions);

export const loadOPDOrders = (): OPDOrder[] =>
  safeGet(STORAGE_KEYS.OPD_ORDERS, INITIAL_OPD_ORDERS);
export const saveOPDOrders = (orders: OPDOrder[]) =>
  safeSet(STORAGE_KEYS.OPD_ORDERS, orders);

export const loadPharmacyMedicines = (): PharmacyMedicine[] =>
  safeGet(STORAGE_KEYS.PHARMACY_MEDICINES, INITIAL_PHARMACY_MEDICINES);
export const savePharmacyMedicines = (medicines: PharmacyMedicine[]) =>
  safeSet(STORAGE_KEYS.PHARMACY_MEDICINES, medicines);

export const loadPharmacySales = (): PharmacySale[] =>
  safeGet(STORAGE_KEYS.PHARMACY_SALES, INITIAL_PHARMACY_SALES);
export const savePharmacySales = (sales: PharmacySale[]) =>
  safeSet(STORAGE_KEYS.PHARMACY_SALES, sales);

export const resetAllData = () => {
  localStorage.removeItem(STORAGE_KEYS.STAFF);
  localStorage.removeItem(STORAGE_KEYS.PATIENTS);
  localStorage.removeItem(STORAGE_KEYS.APPOINTMENTS);
  localStorage.removeItem(STORAGE_KEYS.INVOICES);
  localStorage.removeItem(STORAGE_KEYS.PRESCRIPTIONS);
  localStorage.removeItem(STORAGE_KEYS.LAB_REPORTS);
  localStorage.removeItem(STORAGE_KEYS.TEST_CATALOG);
  localStorage.removeItem(STORAGE_KEYS.ACTIVE_USER);
  localStorage.removeItem(STORAGE_KEYS.HOSPITAL_SETTINGS);
  localStorage.removeItem(STORAGE_KEYS.AUTH_SESSION);
  localStorage.removeItem(STORAGE_KEYS.BEDS);
  localStorage.removeItem(STORAGE_KEYS.IPD_ADMISSIONS);
  localStorage.removeItem(STORAGE_KEYS.OPD_ORDERS);
  localStorage.removeItem(STORAGE_KEYS.PHARMACY_MEDICINES);
  localStorage.removeItem(STORAGE_KEYS.PHARMACY_SALES);
  window.location.reload();
};
