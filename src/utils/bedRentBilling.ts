import { HospitalSettings, IPDAdmission, Invoice, WardType, PharmacySale } from '../types';

export const DEFAULT_WARD_RATES: Record<WardType, number> = {
  'General Ward': 800,
  'Male Ward': 1000,
  'Female Ward': 1000,
  'Semi-Cabin': 1800,
  'VIP Cabin': 3500,
  'ICU': 5500,
  'CCU': 6500,
  'Post-Operative': 2200,
};

export function getWardRate(settings?: HospitalSettings | null, wardType?: WardType | string): number {
  if (!wardType) return 1000;
  if (settings?.bedRates && (wardType in settings.bedRates)) {
    const customRate = settings.bedRates[wardType as WardType];
    if (typeof customRate === 'number' && customRate > 0) return customRate;
  }
  return DEFAULT_WARD_RATES[wardType as WardType] || 1000;
}

export interface BedRentAccrualDetail {
  admissionId: string;
  patientId: string;
  patientName: string;
  bedNumber: string;
  wardType: WardType;
  dailyBedCharge: number;
  admittedAt: string;
  isDischarged: boolean;
  dischargedAt?: string;
  elapsedHours: number;
  stayDays: number;
  timeRemainingInCycleHours: number;
  cycleProgressPercent: number;
  currentCycleDay: number;
  totalAccruedBedRent: number;
  advanceDeposit: number;
  netBedRentDue: number;
  formattedStayDuration: string;
  nextCycleTimestamp?: string;
}

/**
 * Parses admission date/time flexibly
 */
export function parseAdmissionDate(dateStr: string): Date {
  if (!dateStr) return new Date();

  // Try standard parse
  const parsed = new Date(dateStr);
  if (!isNaN(parsed.getTime())) return parsed;

  // Handle "YYYY-MM-DD HH:mm AM/PM" or "YYYY-MM-DD hh:mm"
  try {
    const parts = dateStr.split(' ');
    if (parts.length >= 2) {
      const [datePart, timePart, meridiem] = parts;
      const [year, month, day] = datePart.split('-').map(Number);
      let [hours, minutes] = (timePart || '00:00').split(':').map(Number);

      if (meridiem) {
        if (meridiem.toUpperCase() === 'PM' && hours < 12) hours += 12;
        if (meridiem.toUpperCase() === 'AM' && hours === 12) hours = 0;
      }

      const d = new Date(year, (month || 1) - 1, day || 1, hours || 0, minutes || 0);
      if (!isNaN(d.getTime())) return d;
    }
  } catch (err) {
    console.warn('Could not parse dateStr:', dateStr);
  }

  return new Date();
}

/**
 * Calculates 24-hour cycle bed rent accrual for an admission
 */
export function calculate24HourBedRent(
  admission: IPDAdmission,
  referenceDate?: Date
): BedRentAccrualDetail {
  const isDischarged = admission.status === 'discharged';
  const admDate = parseAdmissionDate(admission.admittedAt);
  const endDate = isDischarged && admission.dischargedAt
    ? parseAdmissionDate(admission.dischargedAt)
    : (referenceDate || new Date());

  const elapsedMs = Math.max(0, endDate.getTime() - admDate.getTime());
  const elapsedHours = Math.max(0, elapsedMs / (1000 * 60 * 60));

  // 24-Hour Cycle Rule:
  // - 0 to <24h = Day 1 (1 cycle)
  // - 24h to <48h = Day 2 (2 cycles)
  // - 48h to <72h = Day 3 (3 cycles), etc.
  const completedFullDays = Math.floor(elapsedHours / 24);
  const hoursInCurrentCycle = elapsedHours % 24;
  const stayDays = Math.max(1, Math.floor(elapsedHours / 24) + 1);

  const hoursRemainingInCycle = Math.max(0, 24 - hoursInCurrentCycle);
  const cycleProgressPercent = Math.min(100, Math.round((hoursInCurrentCycle / 24) * 100));

  const dailyRate = admission.dailyBedCharge > 0 ? admission.dailyBedCharge : 1000;
  const totalAccruedBedRent = stayDays * dailyRate;
  const advanceDeposit = admission.advancePayment || 0;
  const netBedRentDue = Math.max(0, totalAccruedBedRent - advanceDeposit);

  // Next cycle timestamp
  const nextCycleDate = new Date(admDate.getTime() + stayDays * 24 * 60 * 60 * 1000);

  const daysLabel = completedFullDays > 0 ? `${completedFullDays}d ` : '';
  const hoursLabel = `${Math.floor(hoursInCurrentCycle)}h`;
  const formattedStayDuration = `${daysLabel}${hoursLabel} (Cycle Day ${stayDays})`;

  return {
    admissionId: admission.id,
    patientId: admission.patientId,
    patientName: admission.patientName,
    bedNumber: admission.bedNumber,
    wardType: admission.wardType,
    dailyBedCharge: dailyRate,
    admittedAt: admission.admittedAt,
    isDischarged,
    dischargedAt: admission.dischargedAt,
    elapsedHours,
    stayDays,
    timeRemainingInCycleHours: hoursRemainingInCycle,
    cycleProgressPercent,
    currentCycleDay: stayDays,
    totalAccruedBedRent,
    advanceDeposit,
    netBedRentDue,
    formattedStayDuration,
    nextCycleTimestamp: nextCycleDate.toLocaleDateString() + ' ' + nextCycleDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  };
}

export interface PatientFinancialSummary {
  patientId: string;
  totalInvoiceBilled: number;
  totalInvoicePaid: number;
  totalInvoiceDue: number;
  hasActiveAdmission: boolean;
  activeAdmission?: IPDAdmission;
  activeBedRentDetail?: BedRentAccrualDetail;
  totalBedChargesAccrued: number;
  totalBedAdvancePaid: number;
  netActiveBedRentDue: number;
  totalPharmacyBilled: number;
  totalPharmacyPaid: number;
  totalPharmacyDue: number;
  unpaidPharmacySales: PharmacySale[];
  grandTotalOutstandingDue: number;
}

/**
 * Calculates unified financial summary for a patient, merging OPD/Lab invoices, Live 24h IPD Bed Dues, and Inpatient Pharmacy Credit Dues
 */
export function getPatientFinancialSummary(
  patientId: string,
  invoices: Invoice[] = [],
  admissions: IPDAdmission[] = [],
  pharmacySales: PharmacySale[] = []
): PatientFinancialSummary {
  const patientInvoices = invoices.filter((i) => i.patientId === patientId);
  const totalInvoiceBilled = patientInvoices.reduce((sum, i) => sum + i.total, 0);
  const totalInvoicePaid = patientInvoices.reduce((sum, i) => sum + i.paidAmount, 0);
  const totalInvoiceDue = patientInvoices.reduce((sum, i) => sum + i.dueAmount, 0);

  const patientPharmacy = pharmacySales.filter((s) => s.patientId === patientId);
  const totalPharmacyBilled = patientPharmacy.reduce((sum, s) => sum + s.total, 0);
  const totalPharmacyPaid = patientPharmacy.reduce((sum, s) => sum + s.paidAmount, 0);
  const totalPharmacyDue = patientPharmacy.reduce((sum, s) => sum + (s.dueAmount || 0), 0);
  const unpaidPharmacySales = patientPharmacy.filter((s) => (s.dueAmount || 0) > 0);

  const activeAdm = admissions.find((a) => a.patientId === patientId && a.status === 'admitted');
  let activeBedRentDetail: BedRentAccrualDetail | undefined;
  let totalBedChargesAccrued = 0;
  let totalBedAdvancePaid = 0;
  let netActiveBedRentDue = 0;

  if (activeAdm) {
    activeBedRentDetail = calculate24HourBedRent(activeAdm);
    totalBedChargesAccrued = activeBedRentDetail.totalAccruedBedRent;
    totalBedAdvancePaid = activeBedRentDetail.advanceDeposit;
    netActiveBedRentDue = activeBedRentDetail.netBedRentDue;
  }

  // Grand Total Due = Invoice Due + Active Bed Rent Net Due + Pharmacy Medicine Credit Due
  const grandTotalOutstandingDue = totalInvoiceDue + netActiveBedRentDue + totalPharmacyDue;

  return {
    patientId,
    totalInvoiceBilled,
    totalInvoicePaid,
    totalInvoiceDue,
    hasActiveAdmission: !!activeAdm,
    activeAdmission: activeAdm,
    activeBedRentDetail,
    totalBedChargesAccrued,
    totalBedAdvancePaid,
    netActiveBedRentDue,
    totalPharmacyBilled,
    totalPharmacyPaid,
    totalPharmacyDue,
    unpaidPharmacySales,
    grandTotalOutstandingDue,
  };
}
