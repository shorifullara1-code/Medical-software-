import { supabase, SUPABASE_PROJECT_ID, SUPABASE_PROJECT_NAME } from '../lib/supabase';
import {
  loadPatients,
  savePatients,
  loadInvoices,
  saveInvoices,
  loadPrescriptions,
  savePrescriptions,
  loadLabReports,
  saveLabReports,
  loadAppointments,
  saveAppointments,
  loadStaff,
  saveStaff,
  loadBeds,
  saveBeds,
  loadIPDAdmissions,
  saveIPDAdmissions,
  loadPharmacyMedicines,
  savePharmacyMedicines,
  loadPharmacySales,
  savePharmacySales,
  loadHospitalSettings,
  saveHospitalSettings,
} from './storage';

export interface SupabaseSyncState {
  isConnecting: boolean;
  isConnected: boolean;
  lastSyncedAt: string | null;
  syncMessage: string;
  totalSyncedRecords: number;
}

export interface FullHospitalDataPayload {
  patients: any[];
  invoices: any[];
  prescriptions: any[];
  labReports: any[];
  appointments: any[];
  staff: any[];
  beds: any[];
  ipdAdmissions: any[];
  pharmacyMedicines: any[];
  pharmacySales: any[];
  hospitalSettings: any;
  syncedAt?: string;
}

/**
 * Smartly merges a single item from cloud and local versions so payment/due updates are never reverted
 */
function mergeSingleItem<T extends Record<string, any>>(cloudItem: T, localItem: T): T {
  if (!cloudItem) return localItem;
  if (!localItem) return cloudItem;

  // 1. Invoices & Pharmacy Sales (financial records)
  if ('paidAmount' in localItem && 'dueAmount' in localItem) {
    const localPayCount = Array.isArray(localItem.paymentHistory) ? localItem.paymentHistory.length : 0;
    const cloudPayCount = Array.isArray(cloudItem.paymentHistory) ? cloudItem.paymentHistory.length : 0;

    // Item with more payments recorded is newer
    if (localPayCount > cloudPayCount) return localItem;
    if (cloudPayCount > localPayCount) return cloudItem;

    // Item with lower due amount is newer
    if ((localItem.dueAmount ?? 0) < (cloudItem.dueAmount ?? 0)) return localItem;
    if ((cloudItem.dueAmount ?? 0) < (localItem.dueAmount ?? 0)) return cloudItem;

    // Item with higher paid amount is newer
    if ((localItem.paidAmount ?? 0) > (cloudItem.paidAmount ?? 0)) return localItem;
    if ((cloudItem.paidAmount ?? 0) > (localItem.paidAmount ?? 0)) return cloudItem;
  }

  // 2. Timestamps comparison
  const localTime = new Date(localItem.updatedAt || localItem.deliveredAt || localItem.reportedAt || localItem.date || 0).getTime();
  const cloudTime = new Date(cloudItem.updatedAt || cloudItem.deliveredAt || cloudItem.reportedAt || cloudItem.date || 0).getTime();

  if (!isNaN(localTime) && !isNaN(cloudTime) && localTime !== cloudTime) {
    return localTime > cloudTime ? localItem : cloudItem;
  }

  // Fallback: merge properties with local taking precedence
  return { ...cloudItem, ...localItem };
}

/**
 * Merge arrays by unique item ID so local and cloud records are combined seamlessly without losing data or reverting payments
 */
function mergeArraysById<T extends { id: string }>(cloudArray: T[], localArray: T[]): T[] {
  const map = new Map<string, T>();

  // First add all cloud items
  (cloudArray || []).forEach((item) => {
    if (item && item.id) map.set(item.id, item);
  });

  // Then merge local items into map using smart merge
  (localArray || []).forEach((localItem) => {
    if (localItem && localItem.id) {
      const existingCloudItem = map.get(localItem.id);
      if (existingCloudItem) {
        map.set(localItem.id, mergeSingleItem(existingCloudItem, localItem));
      } else {
        map.set(localItem.id, localItem);
      }
    }
  });

  return Array.from(map.values());
}

/**
 * Pushes current hospital data state to Supabase Cloud Database
 */
export async function pushAllToSupabase(overridePayload?: FullHospitalDataPayload): Promise<{
  success: boolean;
  message: string;
  count: number;
}> {
  try {
    const payload: FullHospitalDataPayload = overridePayload || {
      patients: loadPatients(),
      invoices: loadInvoices(),
      prescriptions: loadPrescriptions(),
      labReports: loadLabReports(),
      appointments: loadAppointments(),
      staff: loadStaff(),
      beds: loadBeds(),
      ipdAdmissions: loadIPDAdmissions(),
      pharmacyMedicines: loadPharmacyMedicines(),
      pharmacySales: loadPharmacySales(),
      hospitalSettings: loadHospitalSettings(),
      syncedAt: new Date().toISOString(),
    };

    const count =
      (payload.patients?.length || 0) +
      (payload.invoices?.length || 0) +
      (payload.prescriptions?.length || 0) +
      (payload.labReports?.length || 0) +
      (payload.ipdAdmissions?.length || 0) +
      (payload.pharmacySales?.length || 0) +
      (payload.pharmacyMedicines?.length || 0);

    // Push to master JSON store 'hospital_records'
    const recordPayload = {
      id: 'mediflow_master_data',
      data: payload,
      updated_at: new Date().toISOString(),
      project_id: SUPABASE_PROJECT_ID,
    };

    let pushSuccess = false;

    // Try hospital_records
    const { error: err1 } = await supabase.from('hospital_records').upsert([recordPayload], { onConflict: 'id' });
    if (!err1) pushSuccess = true;

    // Try hospital_data_store as secondary fallback
    const { error: err2 } = await supabase.from('hospital_data_store').upsert([recordPayload], { onConflict: 'id' });
    if (!err2) pushSuccess = true;

    // Push to relational 'patients' table if exists
    if (payload.patients && payload.patients.length > 0) {
      const patientRows = payload.patients.map((p: any) => ({
        id: p.id,
        name: p.name,
        age: p.age,
        gender: p.gender,
        phone: p.phone,
        blood_group: p.bloodGroup,
        address: p.address,
        emergency_contact: p.emergencyContact,
        allergies: p.allergies || null,
        medical_history: p.medicalHistory || null,
        registered_at: p.registeredAt || new Date().toISOString(),
      }));

      try {
        await supabase.from('patients').upsert(patientRows, { onConflict: 'id' });
      } catch (err) {
        // Ignored
      }
    }

    // Push to relational 'staff' table if exists (keeps credentials & roles synced with PostgreSQL)
    if (payload.staff && payload.staff.length > 0) {
      const staffRows = payload.staff.map((s: any) => ({
        id: s.id,
        name: s.name,
        role: s.role,
        department: s.department,
        phone: s.phone,
        email: s.email,
        shift: s.shift,
        status: s.status || 'active',
        qualification: s.qualification || null,
        bmdc_reg: s.bmdcReg || null,
        consultation_fee: s.consultationFee || 0,
        room_no: s.roomNo || null,
        specialization: s.specialization || null,
        password: s.password || '123456',
        allowed_tabs: s.allowedTabs || ['dashboard'],
      }));

      try {
        await supabase.from('staff').upsert(staffRows, { onConflict: 'id' });
      } catch (err) {
        // Ignored if table has slightly different columns or uncreated
      }
    }

    localStorage.setItem('supabase_last_push_str', new Date().toLocaleString());
    return {
      success: pushSuccess,
      message: pushSuccess
        ? `Successfully synchronized ${count} records across all devices on Supabase ✓`
        : `Local state updated. (Run SQL script in Supabase if cloud tables are uncreated)`,
      count,
    };
  } catch (err: any) {
    console.error('Supabase push error:', err);
    return {
      success: false,
      message: `Push failed: ${err?.message || 'Network timeout'}`,
      count: 0,
    };
  }
}

/**
 * Pulls latest hospital database records from Supabase Cloud Database and merges with local data
 */
export async function pullAllFromSupabase(): Promise<{
  success: boolean;
  data: FullHospitalDataPayload | null;
  message: string;
}> {
  try {
    let rawCloudData: any = null;

    // Try reading from hospital_records
    const { data: d1, error: err1 } = await supabase
      .from('hospital_records')
      .select('data')
      .eq('id', 'mediflow_master_data')
      .maybeSingle();

    if (d1 && d1.data) {
      rawCloudData = d1.data;
    } else {
      // Fallback try reading from hospital_data_store
      const { data: d2 } = await supabase
        .from('hospital_data_store')
        .select('data')
        .eq('id', 'mediflow_master_data')
        .maybeSingle();
      if (d2 && d2.data) rawCloudData = d2.data;
    }

    const localPayload: FullHospitalDataPayload = {
      patients: loadPatients(),
      invoices: loadInvoices(),
      prescriptions: loadPrescriptions(),
      labReports: loadLabReports(),
      appointments: loadAppointments(),
      staff: loadStaff(),
      beds: loadBeds(),
      ipdAdmissions: loadIPDAdmissions(),
      pharmacyMedicines: loadPharmacyMedicines(),
      pharmacySales: loadPharmacySales(),
      hospitalSettings: loadHospitalSettings(),
    };

    if (!rawCloudData) {
      return {
        success: true,
        data: localPayload,
        message: 'No cloud database record found yet. Presenting local device state.',
      };
    }

    // Smart Merge Cloud + Local so no device's data is lost
    const mergedData: FullHospitalDataPayload = {
      patients: mergeArraysById(rawCloudData.patients || [], localPayload.patients || []),
      invoices: mergeArraysById(rawCloudData.invoices || [], localPayload.invoices || []),
      prescriptions: mergeArraysById(rawCloudData.prescriptions || [], localPayload.prescriptions || []),
      labReports: mergeArraysById(rawCloudData.labReports || [], localPayload.labReports || []),
      appointments: mergeArraysById(rawCloudData.appointments || [], localPayload.appointments || []),
      staff: mergeArraysById(rawCloudData.staff || [], localPayload.staff || []),
      beds: mergeArraysById(rawCloudData.beds || [], localPayload.beds || []),
      ipdAdmissions: mergeArraysById(rawCloudData.ipdAdmissions || [], localPayload.ipdAdmissions || []),
      pharmacyMedicines: mergeArraysById(rawCloudData.pharmacyMedicines || [], localPayload.pharmacyMedicines || []),
      pharmacySales: mergeArraysById(rawCloudData.pharmacySales || [], localPayload.pharmacySales || []),
      hospitalSettings: rawCloudData.hospitalSettings || localPayload.hospitalSettings,
      syncedAt: new Date().toISOString(),
    };

    // Save merged data locally
    savePatients(mergedData.patients);
    saveInvoices(mergedData.invoices);
    savePrescriptions(mergedData.prescriptions);
    saveLabReports(mergedData.labReports);
    saveAppointments(mergedData.appointments);
    saveStaff(mergedData.staff);
    saveBeds(mergedData.beds);
    saveIPDAdmissions(mergedData.ipdAdmissions);
    savePharmacyMedicines(mergedData.pharmacyMedicines);
    savePharmacySales(mergedData.pharmacySales);
    if (mergedData.hospitalSettings) saveHospitalSettings(mergedData.hospitalSettings);

    return {
      success: true,
      data: mergedData,
      message: 'Successfully merged & synchronized live hospital database from Supabase Cloud!',
    };
  } catch (err: any) {
    return {
      success: false,
      data: null,
      message: `Pull error: ${err?.message || 'Unknown network error'}`,
    };
  }
}

/**
 * Subscribes to Realtime updates from Supabase so when another device/phone registers a patient,
 * this device gets notified and receives updated state instantly!
 */
export function subscribeToSupabaseRealtime(
  onDataReceived: (data: FullHospitalDataPayload) => void
) {
  const channel = supabase
    .channel('mediflow_realtime_sync')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'hospital_records',
        filter: 'id=eq.mediflow_master_data',
      },
      (payload) => {
        if (payload.new && (payload.new as any).data) {
          const cloudData = (payload.new as any).data as FullHospitalDataPayload;
          onDataReceived(cloudData);
        }
      }
    )
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'hospital_data_store',
        filter: 'id=eq.mediflow_master_data',
      },
      (payload) => {
        if (payload.new && (payload.new as any).data) {
          const cloudData = (payload.new as any).data as FullHospitalDataPayload;
          onDataReceived(cloudData);
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

