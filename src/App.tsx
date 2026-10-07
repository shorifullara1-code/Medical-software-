import React, { useState, useEffect } from 'react';
import {
  loadStaff,
  saveStaff,
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
  loadTestCatalog,
  saveTestCatalog,
  loadActiveUser,
  saveActiveUser,
  loadHospitalSettings,
  saveHospitalSettings,
  loadAuthSession,
  saveAuthSession,
  clearAuthSession,
  resetAllData,
  loadBeds,
  saveBeds,
  loadIPDAdmissions,
  saveIPDAdmissions,
  loadPharmacyMedicines,
  savePharmacyMedicines,
  loadPharmacySales,
  savePharmacySales,
} from './utils/storage';
import {
  pullAllFromSupabase,
  pushAllToSupabase,
  subscribeToSupabaseRealtime,
} from './utils/supabaseSync';
import {
  Staff,
  Patient,
  Invoice,
  Prescription,
  LabReport,
  Appointment,
  LabTestCatalogItem,
  HospitalSettings,
  AuthSession,
  HospitalBed,
  IPDAdmission,
  DischargeSummary,
  PharmacyMedicine,
  PharmacySale,
} from './types';
import { Sidebar, TabType } from './components/Sidebar';
import { Topbar } from './components/Topbar';
import { DashboardView } from './components/DashboardView';
import { BillingCenterView } from './components/BillingCenterView';
import { PrescriptionView } from './components/PrescriptionView';
import { LabReportCenterView } from './components/LabReportCenterView';
import { ReportDeliveryView } from './components/ReportDeliveryView';
import { StaffManagementView } from './components/StaffManagementView';
import { PatientRegistrationView } from './components/PatientRegistrationView';
import { AppointmentView } from './components/AppointmentView';
import { FinancialSummaryView } from './components/FinancialSummaryView';
import { SettingsView } from './components/SettingsView';
import { LoginView } from './components/LoginView';
import { PatientPortalView } from './components/PatientPortalView';
import { OPDView } from './components/OPDView';
import { IPDView } from './components/IPDView';
import { PharmacyView } from './components/PharmacyView';
import { PatientHistoryModal } from './components/PatientHistoryModal';
import { BarcodeScannerModal } from './components/BarcodeScannerModal';
import { SupabaseModal } from './components/SupabaseModal';
import { PrescriptionPrintModal } from './components/PrintModals/PrescriptionPrintModal';
import { InvoicePrintModal } from './components/PrintModals/InvoicePrintModal';
import { LabReportPrintModal } from './components/PrintModals/LabReportPrintModal';
import { PatientCardPrintModal } from './components/PrintModals/PatientCardPrintModal';
import { AppointmentPrintModal } from './components/PrintModals/AppointmentPrintModal';
import { FinancialReportPrintModal } from './components/PrintModals/FinancialReportPrintModal';
import { DischargeSummaryPrintModal } from './components/PrintModals/DischargeSummaryPrintModal';
import { AdmissionSlipPrintModal } from './components/PrintModals/AdmissionSlipPrintModal';
import { PharmacyInvoicePrintModal } from './components/PrintModals/PharmacyInvoicePrintModal';
import { CheckCircle2 } from 'lucide-react';

export default function App() {
  const [authSession, setAuthSession] = useState<AuthSession | null>(() => loadAuthSession());
  const [staff, setStaff] = useState<Staff[]>(() => loadStaff());
  const [patients, setPatients] = useState<Patient[]>(() => loadPatients());
  const [invoices, setInvoices] = useState<Invoice[]>(() => loadInvoices());
  const [prescriptions, setPrescriptions] = useState<Prescription[]>(() => loadPrescriptions());
  const [labReports, setLabReports] = useState<LabReport[]>(() => loadLabReports());
  const [appointments, setAppointments] = useState<Appointment[]>(() => loadAppointments());
  const [testCatalog, setTestCatalog] = useState<LabTestCatalogItem[]>(() => loadTestCatalog());
  const [currentUser, setCurrentUser] = useState<Staff>(() => loadActiveUser());
  const [hospitalSettings, setHospitalSettings] = useState<HospitalSettings>(() => loadHospitalSettings());
  const [beds, setBeds] = useState<HospitalBed[]>(() => loadBeds());
  const [ipdAdmissions, setIpdAdmissions] = useState<IPDAdmission[]>(() => loadIPDAdmissions());
  const [pharmacyMedicines, setPharmacyMedicines] = useState<PharmacyMedicine[]>(() => loadPharmacyMedicines());
  const [pharmacySales, setPharmacySales] = useState<PharmacySale[]>(() => loadPharmacySales());

  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState(false);
  const [patientHistoryModalId, setPatientHistoryModalId] = useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Pre-selected Patient for Cross-Navigation
  const [targetPatientId, setTargetPatientId] = useState<string | null>(null);
  const [targetDueInvoice, setTargetDueInvoice] = useState<Invoice | null>(null);

  // Print Modals
  const [printPrescription, setPrintPrescription] = useState<Prescription | null>(null);
  const [printInvoice, setPrintInvoice] = useState<Invoice | null>(null);
  const [printLabReport, setPrintLabReport] = useState<LabReport | null>(null);
  const [printPatientCard, setPrintPatientCard] = useState<Patient | null>(null);
  const [printAppointment, setPrintAppointment] = useState<Appointment | null>(null);
  const [printDischargeSummary, setPrintDischargeSummary] = useState<DischargeSummary | null>(null);
  const [printAdmissionSlip, setPrintAdmissionSlip] = useState<IPDAdmission | null>(null);
  const [printPharmacySale, setPrintPharmacySale] = useState<PharmacySale | null>(null);
  const [printFinancialReport, setPrintFinancialReport] = useState<{
    invoices: Invoice[];
    periodLabel: string;
  } | null>(null);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Cloud Auto Sync Helper
  const syncToCloud = () => {
    pushAllToSupabase().catch((err) => console.error('Cloud auto-sync error:', err));
  };

  // Helper to load cloud data into state
  const applyCloudDataToState = (cloudData: any) => {
    if (!cloudData) return;
    if (Array.isArray(cloudData.patients)) setPatients(cloudData.patients);
    if (Array.isArray(cloudData.invoices)) setInvoices(cloudData.invoices);
    if (Array.isArray(cloudData.prescriptions)) setPrescriptions(cloudData.prescriptions);
    if (Array.isArray(cloudData.labReports)) setLabReports(cloudData.labReports);
    if (Array.isArray(cloudData.appointments)) setAppointments(cloudData.appointments);
    if (Array.isArray(cloudData.staff)) setStaff(cloudData.staff);
    if (Array.isArray(cloudData.beds)) setBeds(cloudData.beds);
    if (Array.isArray(cloudData.ipdAdmissions)) setIpdAdmissions(cloudData.ipdAdmissions);
    if (Array.isArray(cloudData.pharmacyMedicines)) setPharmacyMedicines(cloudData.pharmacyMedicines);
    if (Array.isArray(cloudData.pharmacySales)) setPharmacySales(cloudData.pharmacySales);
    if (cloudData.hospitalSettings) setHospitalSettings(cloudData.hospitalSettings);
  };

  // Multi-Device Cloud Realtime Sync & Polling Effect
  useEffect(() => {
    // 1. Fetch & merge latest state on app load
    pullAllFromSupabase().then((res) => {
      if (res.success && res.data) {
        applyCloudDataToState(res.data);
        // Push unified merged dataset back to Supabase Cloud
        pushAllToSupabase(res.data);
      } else {
        pushAllToSupabase();
      }
    });

    // 2. Realtime WebSocket listener for instant multi-phone updates
    const unsubscribe = subscribeToSupabaseRealtime((newCloudData) => {
      applyCloudDataToState(newCloudData);
    });

    // 3. Fallback interval polling every 4 seconds to ensure non-stop multi-device sync
    const syncInterval = setInterval(() => {
      pullAllFromSupabase().then((res) => {
        if (res.success && res.data) {
          applyCloudDataToState(res.data);
        }
      });
    }, 4000);

    return () => {
      unsubscribe();
      clearInterval(syncInterval);
    };
  }, []);

  const handleLoginSuccess = (session: AuthSession) => {
    setAuthSession(session);
    saveAuthSession(session);
    if (session.type === 'staff' && session.staffUser) {
      setCurrentUser(session.staffUser);
      saveActiveUser(session.staffUser);
      showToast(`Welcome, ${session.staffUser.name}!`);
    } else if (session.type === 'patient' && session.patientUser) {
      showToast(`Welcome, ${session.patientUser.name}!`);
    }
  };

  const handleLogout = () => {
    setAuthSession(null);
    clearAuthSession();
    showToast('Logged out successfully');
  };

  const handleAddPatient = (newPatient: Patient) => {
    const updated = [newPatient, ...patients];
    setPatients(updated);
    savePatients(updated);
    syncToCloud();
    showToast(`Patient '${newPatient.name}' registered successfully`);
  };

  const handleSaveInvoice = (newInvoice: Invoice) => {
    const updated = [newInvoice, ...invoices];
    setInvoices(updated);
    saveInvoices(updated);
    syncToCloud();
    showToast(`Invoice '${newInvoice.id}' generated`);
  };

  const handleUpdateInvoice = (updatedInvoice: Invoice) => {
    const updated = invoices.map((inv) => (inv.id === updatedInvoice.id ? updatedInvoice : inv));
    setInvoices(updated);
    saveInvoices(updated);
    syncToCloud();
    showToast(`Invoice updated successfully`);
  };

  const handleSavePrescription = (newRx: Prescription) => {
    const updated = [newRx, ...prescriptions];
    setPrescriptions(updated);
    savePrescriptions(updated);
    syncToCloud();
    showToast(`Prescription '${newRx.id}' saved`);
  };

  const handleSaveLabReport = (newReport: LabReport) => {
    const updated = [newReport, ...labReports];
    setLabReports(updated);
    saveLabReports(updated);
    syncToCloud();
    showToast(`Lab report '${newReport.id}' created`);
  };

  const handleUpdateLabReport = (updatedReport: LabReport) => {
    const updated = labReports.map((r) => (r.id === updatedReport.id ? updatedReport : r));
    setLabReports(updated);
    saveLabReports(updated);
    syncToCloud();
    showToast(`Lab report '${updatedReport.id}' updated`);
  };

  const handleUpdateTestCatalog = (newCatalog: LabTestCatalogItem[]) => {
    setTestCatalog(newCatalog);
    saveTestCatalog(newCatalog);
    syncToCloud();
    showToast(`Test catalog updated`);
  };

  const handleUpdateHospitalSettings = (newSettings: HospitalSettings) => {
    setHospitalSettings(newSettings);
    saveHospitalSettings(newSettings);
    syncToCloud();
    showToast(`Hospital settings saved`);
  };

  const handleAddStaff = (newStaff: Staff) => {
    const updated = [...staff, newStaff];
    setStaff(updated);
    saveStaff(updated);
    syncToCloud();
    showToast(`New staff member added`);
  };

  const handleUpdateStaff = (updatedStaff: Staff) => {
    const updated = staff.map((s) => (s.id === updatedStaff.id ? updatedStaff : s));
    setStaff(updated);
    saveStaff(updated);
    syncToCloud();
    if (currentUser.id === updatedStaff.id) {
      setCurrentUser(updatedStaff);
      saveActiveUser(updatedStaff);
    }
    showToast(`Staff profile updated`);
  };

  const handleAddAppointment = (newApt: Appointment) => {
    const updated = [newApt, ...appointments];
    setAppointments(updated);
    saveAppointments(updated);
    syncToCloud();
    showToast(`Appointment #${newApt.serialNumber} booked successfully`);
  };

  const handleUpdateAppointmentStatus = (id: string, status: Appointment['status']) => {
    const updated = appointments.map((a) => (a.id === id ? { ...a, status } : a));
    setAppointments(updated);
    saveAppointments(updated);
    syncToCloud();
    showToast(`Status updated`);
  };

  const handleSwitchUser = (user: Staff) => {
    setCurrentUser(user);
    saveActiveUser(user);
    showToast(`Active User: ${user.name}`);
  };

  const handleScannerSelectAction = (
    action: 'prescribe' | 'bill' | 'collect_due' | 'lab' | 'appointment' | 'delivery' | 'ipd' | 'pharmacy',
    patientId: string
  ) => {
    setTargetPatientId(patientId);
    if (action === 'prescribe') setActiveTab('prescriptions');
    else if (action === 'bill') setActiveTab('billing');
    else if (action === 'collect_due') {
      const invWithDue = invoices.find((i) => i.patientId === patientId && i.dueAmount > 0);
      if (invWithDue) setTargetDueInvoice(invWithDue);
      setActiveTab('billing');
    } else if (action === 'lab') setActiveTab('lab');
    else if (action === 'delivery') setActiveTab('delivery');
    else if (action === 'appointment') setActiveTab('appointments');
    else if (action === 'ipd') setActiveTab('ipd');
    else if (action === 'pharmacy') setActiveTab('pharmacy');
  };

  const handleSavePharmacySale = (newSale: PharmacySale, updatedMeds: PharmacyMedicine[]) => {
    const updatedSales = [newSale, ...pharmacySales];
    setPharmacySales(updatedSales);
    savePharmacySales(updatedSales);
    setPharmacyMedicines(updatedMeds);
    savePharmacyMedicines(updatedMeds);
    syncToCloud();
    setPrintPharmacySale(newSale);
    showToast(
      newSale.saleType === 'indoor' && newSale.dueAmount > 0
        ? `Inpatient credit sale '${newSale.id}' recorded. Due will be cleared at discharge.`
        : `Pharmacy sale '${newSale.id}' processed successfully!`
    );
  };

  const handleUpdatePharmacyMedicines = (updatedMeds: PharmacyMedicine[]) => {
    setPharmacyMedicines(updatedMeds);
    savePharmacyMedicines(updatedMeds);
    syncToCloud();
    showToast('Medicine stock inventory updated successfully');
  };

  const handleSettlePharmacyCredit = (patientId: string) => {
    const updatedSales = pharmacySales.map((s) => {
      if (s.patientId === patientId && (s.dueAmount || 0) > 0) {
        return {
          ...s,
          dueAmount: 0,
          paidAmount: s.total,
          paymentStatus: 'paid' as const,
          clearedAtDischarge: true,
        };
      }
      return s;
    });
    setPharmacySales(updatedSales);
    savePharmacySales(updatedSales);
    syncToCloud();
  };

  const handleQuickCollectDueFromDashboard = (inv: Invoice) => {
    setTargetDueInvoice(inv);
    setActiveTab('billing');
  };

  const handleAddAdmission = (newAdmission: IPDAdmission, updatedBeds: HospitalBed[]) => {
    const updatedAdmissions = [newAdmission, ...ipdAdmissions];
    setIpdAdmissions(updatedAdmissions);
    saveIPDAdmissions(updatedAdmissions);
    setBeds(updatedBeds);
    saveBeds(updatedBeds);
    syncToCloud();
    setPrintAdmissionSlip(newAdmission);
    showToast(`IPD Admission #${newAdmission.admissionNumber || newAdmission.id} created for Bed ${newAdmission.bedNumber}`);
  };

  const handleDischargeAdmission = (
    admissionId: string,
    dischargeSummary: DischargeSummary,
    updatedBeds: HospitalBed[],
    finalInvoice?: Invoice
  ) => {
    const updatedAdmissions = ipdAdmissions.map((adm) => {
      if (adm.id === admissionId) {
        return {
          ...adm,
          status: 'discharged' as const,
          dischargeDate: dischargeSummary.dischargeDate,
          dischargeSummary,
          finalInvoiceId: finalInvoice ? finalInvoice.id : adm.finalInvoiceId,
        };
      }
      return adm;
    });
    setIpdAdmissions(updatedAdmissions);
    saveIPDAdmissions(updatedAdmissions);
    setBeds(updatedBeds);
    saveBeds(updatedBeds);

    if (finalInvoice) {
      const updatedInvs = [finalInvoice, ...invoices];
      setInvoices(updatedInvs);
      saveInvoices(updatedInvs);
    }

    syncToCloud();
    setPrintDischargeSummary(dischargeSummary);
    showToast(`Patient discharged successfully. Discharge summary certificate generated!`);
  };

  const handleAddVitals = (admissionId: string, vitals: any) => {
    const updated = ipdAdmissions.map((adm) => {
      if (adm.id === admissionId) {
        return {
          ...adm,
          vitalsHistory: [vitals, ...(adm.vitalsHistory || [])],
        };
      }
      return adm;
    });
    setIpdAdmissions(updated);
    saveIPDAdmissions(updated);
    syncToCloud();
    showToast('Patient vitals recorded successfully');
  };

  const handleAddDoctorNote = (admissionId: string, note: any) => {
    const updated = ipdAdmissions.map((adm) => {
      if (adm.id === admissionId) {
        return {
          ...adm,
          doctorNotes: [note, ...(adm.doctorNotes || [])],
        };
      }
      return adm;
    });
    setIpdAdmissions(updated);
    saveIPDAdmissions(updated);
    syncToCloud();
    showToast('Doctor clinical note added');
  };

  const totalDueAmount = invoices.reduce((sum, inv) => sum + (inv.dueAmount || 0), 0);
  const dueCount = invoices.filter((i) => i.dueAmount > 0).length;
  const waitingAptCount = appointments.filter((a) => a.status === 'waiting').length;
  const pendingLabCount = labReports.filter((r) => r.status === 'pending').length;
  const readyDeliveryCount = labReports.filter((r) => r.status === 'completed' && !r.deliveredAt).length;

  // If not logged in, show LoginView
  if (!authSession || !authSession.isAuthenticated) {
    return (
      <>
        <LoginView
          staffList={staff}
          patientsList={patients}
          hospitalSettings={hospitalSettings}
          onLoginSuccess={handleLoginSuccess}
        />
        {toastMessage && (
          <div className="fixed bottom-5 right-5 z-50 animate-fadeIn">
            <div className="bg-slate-900 text-white px-3.5 py-2 rounded-xl shadow-lg border border-slate-700 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>{toastMessage}</span>
            </div>
          </div>
        )}
      </>
    );
  }

  // If patient session, show PatientPortalView
  if (authSession.type === 'patient') {
    const activePatient = authSession.patientUser
      ? patients.find((p) => p.id === authSession.patientUser?.id) || authSession.patientUser
      : null;

    if (!activePatient) {
      handleLogout();
      return null;
    }

    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 font-['Hind_Siliguri','Plus_Jakarta_Sans',sans-serif]">
        <PatientPortalView
          patient={activePatient}
          invoices={invoices}
          prescriptions={prescriptions}
          labReports={labReports}
          appointments={appointments}
          hospitalSettings={hospitalSettings}
          onUpdateInvoice={handleUpdateInvoice}
          onOpenPrintLabReport={(report) => setPrintLabReport(report)}
          onOpenPrintPrescription={(rx) => setPrintPrescription(rx)}
          onOpenPrintInvoice={(inv) => setPrintInvoice(inv)}
          onOpenPrintPatientCard={(patient) => setPrintPatientCard(patient)}
          onLogout={handleLogout}
        />

        {/* Modals for Patient */}
        <PrescriptionPrintModal
          prescription={printPrescription}
          onClose={() => setPrintPrescription(null)}
          hospitalSettings={hospitalSettings}
        />
        <InvoicePrintModal
          invoice={printInvoice}
          onClose={() => setPrintInvoice(null)}
          hospitalSettings={hospitalSettings}
        />
        <LabReportPrintModal
          report={printLabReport}
          onClose={() => setPrintLabReport(null)}
          hospitalSettings={hospitalSettings}
        />
        <PatientCardPrintModal
          patient={printPatientCard}
          onClose={() => setPrintPatientCard(null)}
          hospitalSettings={hospitalSettings}
        />

        {toastMessage && (
          <div className="fixed bottom-5 right-5 z-50 animate-fadeIn">
            <div className="bg-slate-900 text-white px-3.5 py-2 rounded-xl shadow-lg border border-slate-700 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>{toastMessage}</span>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 overflow-hidden font-['Hind_Siliguri','Plus_Jakarta_Sans',sans-serif]">
      {/* Desktop & Mobile Left Sidebar */}
      <div className={`hidden sm:flex shrink-0 h-full`}>
        <Sidebar
          activeTab={activeTab}
          setActiveTab={(tab) => {
            setActiveTab(tab);
            setMobileSidebarOpen(false);
          }}
          staffList={staff}
          currentUser={currentUser}
          setCurrentUser={handleSwitchUser}
          onOpenScanner={() => setIsScannerOpen(true)}
          onResetData={resetAllData}
          onLogout={handleLogout}
          collapsed={sidebarCollapsed}
          setCollapsed={setSidebarCollapsed}
          dueCount={dueCount}
          waitingAptCount={waitingAptCount}
          pendingLabCount={pendingLabCount}
          readyDeliveryCount={readyDeliveryCount}
          ipdActiveCount={ipdAdmissions.filter((a) => a.status === 'admitted').length}
          hospitalSettings={hospitalSettings}
        />
      </div>

      {/* Mobile Slide-Over Sidebar */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 sm:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
            onClick={() => setMobileSidebarOpen(false)}
          />
          <div className="relative w-64 h-full z-10">
            <Sidebar
              activeTab={activeTab}
              setActiveTab={(tab) => {
                setActiveTab(tab);
                setMobileSidebarOpen(false);
              }}
              staffList={staff}
              currentUser={currentUser}
              setCurrentUser={handleSwitchUser}
              onOpenScanner={() => {
                setIsScannerOpen(true);
                setMobileSidebarOpen(false);
              }}
              onResetData={resetAllData}
              onLogout={handleLogout}
              collapsed={false}
              setCollapsed={() => setMobileSidebarOpen(false)}
              dueCount={dueCount}
              waitingAptCount={waitingAptCount}
              pendingLabCount={pendingLabCount}
              readyDeliveryCount={readyDeliveryCount}
              ipdActiveCount={ipdAdmissions.filter((a) => a.status === 'admitted').length}
              hospitalSettings={hospitalSettings}
            />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Top Header Bar */}
        <Topbar
          activeTab={activeTab}
          currentUser={currentUser}
          onOpenScanner={() => setIsScannerOpen(true)}
          onOpenPatientHistory={() => setPatientHistoryModalId(targetPatientId || patients[0]?.id || '')}
          onOpenSupabaseModal={() => setIsSupabaseModalOpen(true)}
          onToggleSidebarMobile={() => setMobileSidebarOpen(!mobileSidebarOpen)}
          onLogout={handleLogout}
          totalDueAmount={totalDueAmount}
        />

        {/* Scrollable Page Body */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-100/60">
          <div className="max-w-6xl mx-auto">
            {activeTab === 'dashboard' && (
              <DashboardView
                patients={patients}
                invoices={invoices}
                prescriptions={prescriptions}
                labReports={labReports}
                appointments={appointments}
                staff={staff}
                testCatalog={testCatalog}
                setActiveTab={setActiveTab}
                onOpenScanner={() => setIsScannerOpen(true)}
                onOpenInvoicePrint={(inv) => setPrintInvoice(inv)}
                onOpenPrescriptionPrint={(rx) => setPrintPrescription(rx)}
                onOpenLabReportPrint={(lab) => setPrintLabReport(lab)}
                onQuickCollectDue={handleQuickCollectDueFromDashboard}
              />
            )}

            {activeTab === 'patients' && (
              <PatientRegistrationView
                patients={patients}
                onAddPatient={handleAddPatient}
                onOpenCardPrint={(patient) => setPrintPatientCard(patient)}
                onOpenScanner={() => setIsScannerOpen(true)}
                onOpenPatientHistory={(pid) => setPatientHistoryModalId(pid)}
                onNavigateToPrescription={(pid) => {
                  setTargetPatientId(pid);
                  setActiveTab('prescriptions');
                }}
                onNavigateToBilling={(pid) => {
                  setTargetPatientId(pid);
                  setActiveTab('billing');
                }}
                onNavigateToAppointment={(pid) => {
                  setTargetPatientId(pid);
                  setActiveTab('appointments');
                }}
              />
            )}

            {activeTab === 'opd' && (
              <OPDView
                patients={patients}
                staff={staff}
                testCatalog={testCatalog}
                appointments={appointments}
                invoices={invoices}
                hospitalSettings={hospitalSettings}
                currentUser={currentUser}
                onSaveInvoice={handleSaveInvoice}
                onOpenInvoicePrint={(inv) => setPrintInvoice(inv)}
                onNavigateToIPDAdmission={(pid) => {
                  setTargetPatientId(pid);
                  setActiveTab('ipd');
                }}
                onNavigateToPrescription={(pid) => {
                  setTargetPatientId(pid);
                  setActiveTab('prescriptions');
                }}
                onOpenPatientHistory={(pid) => setPatientHistoryModalId(pid)}
              />
            )}

            {activeTab === 'ipd' && (
              <IPDView
                admissions={ipdAdmissions}
                beds={beds}
                patients={patients}
                staff={staff}
                hospitalSettings={hospitalSettings}
                currentUser={currentUser}
                pharmacySales={pharmacySales}
                invoices={invoices}
                preselectedPatientId={targetPatientId}
                onAddAdmission={handleAddAdmission}
                onDischargeAdmission={handleDischargeAdmission}
                onSettlePharmacyCredit={handleSettlePharmacyCredit}
                onAddVitals={handleAddVitals}
                onAddDoctorNote={handleAddDoctorNote}
                onOpenDischargeSummaryPrint={(summary) => setPrintDischargeSummary(summary)}
                onOpenPatientHistory={(pid) => setPatientHistoryModalId(pid)}
                onOpenInvoicePrint={(inv) => setPrintInvoice(inv)}
                onOpenAdmissionSlipPrint={(adm) => setPrintAdmissionSlip(adm)}
              />
            )}

            {activeTab === 'pharmacy' && (
              <PharmacyView
                medicines={pharmacyMedicines}
                sales={pharmacySales}
                patients={patients}
                admissions={ipdAdmissions}
                prescriptions={prescriptions}
                currentUser={currentUser}
                hospitalSettings={hospitalSettings}
                onSaveSale={handleSavePharmacySale}
                onUpdateMedicines={handleUpdatePharmacyMedicines}
                onOpenPrintSlip={(sale) => setPrintPharmacySale(sale)}
                onNavigateToIPD={() => setActiveTab('ipd')}
                preselectedPatientId={targetPatientId}
                onClearPreselectedPatient={() => setTargetPatientId(null)}
              />
            )}

            {activeTab === 'billing' && (
              <BillingCenterView
                invoices={invoices}
                patients={patients}
                staff={staff}
                testCatalog={testCatalog}
                currentCollectorName={currentUser.name}
                onSaveInvoice={handleSaveInvoice}
                onUpdateInvoice={handleUpdateInvoice}
                onOpenPrint={(inv) => setPrintInvoice(inv)}
                onOpenScanner={() => setIsScannerOpen(true)}
                onNavigateToPrescription={(pid) => {
                  setTargetPatientId(pid);
                  setActiveTab('prescriptions');
                }}
                initialDueInvoice={targetDueInvoice}
                onClearInitialDue={() => setTargetDueInvoice(null)}
                preselectedPatientId={targetPatientId}
                onClearPreselectedPatient={() => setTargetPatientId(null)}
              />
            )}

            {activeTab === 'finance' && (
              <FinancialSummaryView
                invoices={invoices}
                patients={patients}
                staff={staff}
                currentUser={currentUser}
                hospitalSettings={hospitalSettings}
                onOpenInvoicePrint={(inv) => setPrintInvoice(inv)}
                onQuickCollectDue={handleQuickCollectDueFromDashboard}
                onOpenFinancialReportPrint={(filteredInvs, pLabel) =>
                  setPrintFinancialReport({ invoices: filteredInvs, periodLabel: pLabel })
                }
              />
            )}

            {activeTab === 'prescriptions' && (
              <PrescriptionView
                prescriptions={prescriptions}
                patients={patients}
                staff={staff}
                testCatalog={testCatalog}
                onSavePrescription={handleSavePrescription}
                onOpenPrint={(rx) => setPrintPrescription(rx)}
                onOpenScanner={() => setIsScannerOpen(true)}
                preselectedPatientId={targetPatientId}
                onClearPreselectedPatient={() => setTargetPatientId(null)}
              />
            )}

            {activeTab === 'lab' && (
              <LabReportCenterView
                labReports={labReports}
                testCatalog={testCatalog}
                patients={patients}
                staff={staff}
                onSaveReport={handleSaveLabReport}
                onUpdateReport={handleUpdateLabReport}
                onUpdateTestCatalog={handleUpdateTestCatalog}
                onOpenPrint={(report) => setPrintLabReport(report)}
                onOpenScanner={() => setIsScannerOpen(true)}
                onNavigateToDelivery={(pid) => {
                  setTargetPatientId(pid);
                  setActiveTab('delivery');
                }}
                preselectedPatientId={targetPatientId}
                onClearPreselectedPatient={() => setTargetPatientId(null)}
              />
            )}

            {activeTab === 'delivery' && (
              <ReportDeliveryView
                patients={patients}
                invoices={invoices}
                labReports={labReports}
                staff={staff}
                currentUser={currentUser}
                onUpdateInvoice={handleUpdateInvoice}
                onUpdateLabReport={handleUpdateLabReport}
                onOpenPrintReport={(report) => setPrintLabReport(report)}
                onOpenScanner={() => setIsScannerOpen(true)}
                preselectedPatientId={targetPatientId}
                onClearPreselectedPatient={() => setTargetPatientId(null)}
              />
            )}

            {activeTab === 'appointments' && (
              <AppointmentView
                appointments={appointments}
                patients={patients}
                staff={staff}
                onAddAppointment={handleAddAppointment}
                onUpdateStatus={handleUpdateAppointmentStatus}
                onNavigateToPrescription={(pid) => {
                  setTargetPatientId(pid);
                  setActiveTab('prescriptions');
                }}
                onOpenAppointmentPrint={(apt) => setPrintAppointment(apt)}
                onOpenScanner={() => setIsScannerOpen(true)}
                preselectedPatientId={targetPatientId}
                onClearPreselectedPatient={() => setTargetPatientId(null)}
              />
            )}

            {activeTab === 'staff' && (
              <StaffManagementView
                staffList={staff}
                onAddStaff={handleAddStaff}
                onUpdateStaff={handleUpdateStaff}
              />
            )}

            {activeTab === 'settings' && (
              <SettingsView
                settings={hospitalSettings}
                onUpdateSettings={handleUpdateHospitalSettings}
                beds={beds}
                onUpdateBeds={(newBeds) => {
                  setBeds(newBeds);
                  saveBeds(newBeds);
                }}
                admissions={ipdAdmissions}
              />
            )}
          </div>
        </main>
      </div>

      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 animate-fadeIn">
          <div className="bg-slate-900 text-white px-3.5 py-2 rounded-xl shadow-lg border border-slate-700 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      {/* Barcode Scanner Global Modal */}
      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        patients={patients}
        invoices={invoices}
        prescriptions={prescriptions}
        labReports={labReports}
        appointments={appointments}
        admissions={ipdAdmissions}
        pharmacySales={pharmacySales}
        onSelectAction={handleScannerSelectAction}
        onOpenInvoicePrint={(inv) => setPrintInvoice(inv)}
        onOpenPrescriptionPrint={(rx) => setPrintPrescription(rx)}
        onOpenLabReportPrint={(lab) => setPrintLabReport(lab)}
        onOpenAppointmentPrint={(apt) => setPrintAppointment(apt)}
        onOpenAdmissionSlipPrint={(adm) => setPrintAdmissionSlip(adm)}
      />

      {/* Official Print Modals */}
      <PrescriptionPrintModal
        prescription={printPrescription}
        onClose={() => setPrintPrescription(null)}
        hospitalSettings={hospitalSettings}
      />

      <InvoicePrintModal
        invoice={printInvoice}
        onClose={() => setPrintInvoice(null)}
        hospitalSettings={hospitalSettings}
      />

      <LabReportPrintModal
        report={printLabReport}
        onClose={() => setPrintLabReport(null)}
        hospitalSettings={hospitalSettings}
      />

      <PatientCardPrintModal
        patient={printPatientCard}
        onClose={() => setPrintPatientCard(null)}
        hospitalSettings={hospitalSettings}
      />

      <AppointmentPrintModal
        appointment={printAppointment}
        onClose={() => setPrintAppointment(null)}
        hospitalSettings={hospitalSettings}
      />

      <DischargeSummaryPrintModal
        summary={printDischargeSummary}
        onClose={() => setPrintDischargeSummary(null)}
        hospitalSettings={hospitalSettings}
      />

      <AdmissionSlipPrintModal
        admission={printAdmissionSlip}
        onClose={() => setPrintAdmissionSlip(null)}
        hospitalSettings={hospitalSettings}
      />

      <PharmacyInvoicePrintModal
        sale={printPharmacySale}
        onClose={() => setPrintPharmacySale(null)}
        hospitalSettings={hospitalSettings}
      />

      <PatientHistoryModal
        isOpen={patientHistoryModalId !== null}
        onClose={() => setPatientHistoryModalId(null)}
        patientId={patientHistoryModalId}
        patients={patients}
        prescriptions={prescriptions}
        labReports={labReports}
        invoices={invoices}
        appointments={appointments}
        ipdAdmissions={ipdAdmissions}
        pharmacySales={pharmacySales}
        hospitalSettings={hospitalSettings}
        onOpenPrescriptionPrint={(rx) => setPrintPrescription(rx)}
        onOpenLabReportPrint={(report) => setPrintLabReport(report)}
        onOpenInvoicePrint={(inv) => setPrintInvoice(inv)}
        onOpenDischargeSummaryPrint={(summary) => setPrintDischargeSummary(summary)}
        onOpenAdmissionSlipPrint={(adm) => setPrintAdmissionSlip(adm)}
        onOpenPharmacySlipPrint={(sale) => setPrintPharmacySale(sale)}
      />

      {printFinancialReport && (
        <FinancialReportPrintModal
          invoices={printFinancialReport.invoices}
          periodLabel={printFinancialReport.periodLabel}
          currentUser={currentUser}
          onClose={() => setPrintFinancialReport(null)}
          hospitalSettings={hospitalSettings}
        />
      )}

      <SupabaseModal
        isOpen={isSupabaseModalOpen}
        onClose={() => setIsSupabaseModalOpen(false)}
        onDataRestored={() => {
          pullAllFromSupabase().then((res) => {
            if (res.success && res.data) {
              applyCloudDataToState(res.data);
            }
          });
        }}
      />
    </div>
  );
}
