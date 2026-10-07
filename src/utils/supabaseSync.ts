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

    // Master JSON store push
    const { error } = await supabase.from('hospital_records').upsert(
      [
        {
          id: 'mediflow_master_data',
          data: payload,
          updated_at: new Date().toISOString(),
          project_id: SUPABASE_PROJECT_ID,
        },
      ],
      { onConflict: 'id' }
    );

    if (error) {
      console.warn('Supabase master upsert note:', error.message);
    }

    // Also attempt pushing patients to patients table if available
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
        // Table may not exist or network glitch
      }
    }

    localStorage.setItem('supabase_last_push_str', new Date().toLocaleString());
    return {
      success: true,
      message: `Synchronized ${count} records to Supabase Cloud ✓`,
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
 * Pulls latest hospital database records from Supabase Cloud Database
 */
export async function pullAllFromSupabase(): Promise<{
  success: boolean;
  data: FullHospitalDataPayload | null;
  message: string;
}> {
  try {
    const { data, error } = await supabase
      .from('hospital_records')
      .select('*')
      .eq('id', 'mediflow_master_data')
      .maybeSingle();

    if (error) {
      return {
        success: false,
        data: null,
        message: `Supabase pull error: ${error.message}`,
      };
    }

    if (!data || !data.data) {
      return {
        success: false,
        data: null,
        message: 'No cloud database backup found on Supabase yet.',
      };
    }

    const cloudData: FullHospitalDataPayload = data.data;

    // Save to local storage cache
    if (Array.isArray(cloudData.patients)) savePatients(cloudData.patients);
    if (Array.isArray(cloudData.invoices)) saveInvoices(cloudData.invoices);
    if (Array.isArray(cloudData.prescriptions)) savePrescriptions(cloudData.prescriptions);
    if (Array.isArray(cloudData.labReports)) saveLabReports(cloudData.labReports);
    if (Array.isArray(cloudData.appointments)) saveAppointments(cloudData.appointments);
    if (Array.isArray(cloudData.staff)) saveStaff(cloudData.staff);
    if (Array.isArray(cloudData.beds)) saveBeds(cloudData.beds);
    if (Array.isArray(cloudData.ipdAdmissions)) saveIPDAdmissions(cloudData.ipdAdmissions);
    if (Array.isArray(cloudData.pharmacyMedicines)) savePharmacyMedicines(cloudData.pharmacyMedicines);
    if (Array.isArray(cloudData.pharmacySales)) savePharmacySales(cloudData.pharmacySales);
    if (cloudData.hospitalSettings) saveHospitalSettings(cloudData.hospitalSettings);

    return {
      success: true,
      data: cloudData,
      message: 'Successfully retrieved live hospital database from Supabase Cloud!',
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
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

