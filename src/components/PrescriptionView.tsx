import React, { useState, useEffect } from 'react';
import {
  FileText,
  PlusCircle,
  Search,
  Printer,
  Trash2,
  Scan,
  PenTool,
} from 'lucide-react';
import { Prescription, Patient, Staff, LabTestCatalogItem, MedicineItem } from '../types';

interface PrescriptionViewProps {
  prescriptions: Prescription[];
  patients: Patient[];
  staff: Staff[];
  testCatalog: LabTestCatalogItem[];
  onSavePrescription: (prescription: Prescription) => void;
  onOpenPrint: (prescription: Prescription) => void;
  onOpenScanner: () => void;
  preselectedPatientId?: string | null;
  onClearPreselectedPatient?: () => void;
}

export const PrescriptionView: React.FC<PrescriptionViewProps> = ({
  prescriptions,
  patients,
  staff,
  testCatalog,
  onSavePrescription,
  onOpenPrint,
  onOpenScanner,
  preselectedPatientId,
  onClearPreselectedPatient,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(Boolean(preselectedPatientId));

  // Form State
  const [selectedPatientId, setSelectedPatientId] = useState<string>(preselectedPatientId || (patients[0]?.id ?? ''));

  useEffect(() => {
    if (preselectedPatientId) {
      setSelectedPatientId(preselectedPatientId);
      setIsCreateModalOpen(true);
    }
  }, [preselectedPatientId]);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>(
    staff.find((s) => s.role === 'doctor')?.id || ''
  );

  // Vitals
  const [bp, setBp] = useState('120/80 mmHg');
  const [pulse, setPulse] = useState('76 bpm');
  const [temp, setTemp] = useState('98.6°F');
  const [weight, setWeight] = useState('65 kg');
  const [spo2, setSpo2] = useState('98%');
  const [rbs, setRbs] = useState('6.2 mmol/L');

  // Clinical
  const [complaintInput, setComplaintInput] = useState('');
  const [complaintsList, setComplaintsList] = useState<string[]>([
    'Headache and mild dizziness',
  ]);
  const [clinicalFindings, setClinicalFindings] = useState('Chest clear, S1 S2 normal');
  const [diagnosis, setDiagnosis] = useState('Acute URTI');

  // Medicines
  const [medicines, setMedicines] = useState<MedicineItem[]>([
    { name: 'Tab. Napa Extra', dosage: '1 + 0 + 1', duration: '5 Days', instruction: 'After meal' },
    { name: 'Cap. Sergel 20mg', dosage: '1 + 0 + 1', duration: '14 Days', instruction: '30 mins before meal' },
  ]);

  const [medName, setMedName] = useState('');
  const [medDosage, setMedDosage] = useState('1 + 0 + 1');
  const [medDuration, setMedDuration] = useState('7 Days');
  const [medInstruction, setMedInstruction] = useState('After meal');

  const [selectedTests, setSelectedTests] = useState<string[]>([
    'Complete Blood Count (CBC) with ESR',
  ]);

  const [advice, setAdvice] = useState(
    'Drink plenty of purified water. Avoid oily and spicy foods.'
  );
  const [nextVisit, setNextVisit] = useState('In 7 Days');

  const handleAddComplaint = (complaintText?: string) => {
    const text = (complaintText || complaintInput).trim();
    if (!text) return;
    if (!complaintsList.includes(text)) {
      setComplaintsList([...complaintsList, text]);
    }
    setComplaintInput('');
  };

  const handleRemoveComplaint = (idx: number) => {
    setComplaintsList(complaintsList.filter((_, i) => i !== idx));
  };

  const handleAddMedicine = () => {
    if (!medName.trim()) return;
    setMedicines([
      ...medicines,
      {
        name: medName.trim(),
        dosage: medDosage,
        duration: medDuration,
        instruction: medInstruction,
      },
    ]);
    setMedName('');
  };

  const handleRemoveMedicine = (idx: number) => {
    setMedicines(medicines.filter((_, i) => i !== idx));
  };

  const handleToggleTest = (testName: string) => {
    if (selectedTests.includes(testName)) {
      setSelectedTests(selectedTests.filter((t) => t !== testName));
    } else {
      setSelectedTests([...selectedTests, testName]);
    }
  };

  const handleSubmitPrescription = (e: React.FormEvent) => {
    e.preventDefault();
    const patient = patients.find((p) => p.id === selectedPatientId);
    const doctor = staff.find((s) => s.id === selectedDoctorId);

    if (!patient || !doctor) {
      alert('Patient and Doctor selection is required.');
      return;
    }

    const newRxId = `RX-${new Date().getFullYear()}-${String(prescriptions.length + 1).padStart(3, '0')}`;
    const todayStr = new Date().toISOString().split('T')[0];

    const newPrescription: Prescription = {
      id: newRxId,
      patientId: patient.id,
      patientName: patient.name,
      patientAge: patient.age,
      patientGender: patient.gender === 'male' ? 'Male' : 'Female',
      patientPhone: patient.phone,
      doctorId: doctor.id,
      doctorName: doctor.name,
      doctorSpecialty: doctor.specialization || 'Medicine Consultant',
      doctorDegrees: doctor.qualification || 'MBBS, FCPS',
      doctorBmdc: doctor.bmdcReg ? `BMDC Reg: ${doctor.bmdcReg}` : 'BMDC Reg: A-Registered',
      date: todayStr,
      vitals: {
        bp,
        pulse,
        temp,
        weight,
        spo2,
        rbs,
      },
      chiefComplaints: complaintsList,
      clinicalFindings,
      diagnosis,
      medicines,
      recommendedTests: selectedTests,
      advice,
      nextVisitDate: nextVisit,
    };

    onSavePrescription(newPrescription);
    setIsCreateModalOpen(false);
    onClearPreselectedPatient?.();
    onOpenPrint(newPrescription);
  };

  const filteredPrescriptions = prescriptions.filter((rx) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      rx.id.toLowerCase().includes(q) ||
      rx.patientId.toLowerCase().includes(q) ||
      rx.patientName.toLowerCase().includes(q) ||
      rx.doctorName.toLowerCase().includes(q)
    );
  });

  const doctors = staff.filter((s) => s.role === 'doctor');
  const selectedPatient = patients.find((p) => p.id === selectedPatientId);

  return (
    <div className="space-y-4">
      {/* Top Toolbar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 flex items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Prescription No (RX-...), Patient ID or Name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 rounded-lg border border-slate-200 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-teal-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              const defaultDoctor = staff.find((s) => s.role === 'doctor') || staff[0];
              const defaultPatient = patients[0] || {
                id: 'PT-WALKIN',
                name: 'Walk-in Patient',
                age: 30,
                gender: 'male',
                phone: '01700-000000',
              };
              const blankRx: Prescription = {
                id: `RX-PAD-${new Date().getFullYear()}-${String(prescriptions.length + 1).padStart(3, '0')}`,
                patientId: defaultPatient.id,
                patientName: defaultPatient.name,
                patientAge: defaultPatient.age,
                patientGender: defaultPatient.gender === 'male' ? 'Male' : 'Female',
                patientPhone: defaultPatient.phone,
                doctorId: defaultDoctor?.id || 'DR-001',
                doctorName: defaultDoctor?.name || 'Dr. Kazi Shamim Ahmed',
                doctorSpecialty: defaultDoctor?.specialization || 'Medicine & Diabetes Specialist',
                doctorDegrees: defaultDoctor?.qualification || 'MBBS, FCPS (Medicine), MD',
                doctorBmdc: defaultDoctor?.bmdcReg ? `BMDC Reg: ${defaultDoctor.bmdcReg}` : 'BMDC Reg: A-54912',
                date: new Date().toISOString().split('T')[0],
                vitals: { bp: '', pulse: '', temp: '', weight: '', spo2: '', rbs: '' },
                chiefComplaints: [],
                clinicalFindings: '',
                diagnosis: '',
                medicines: [],
                recommendedTests: [],
                advice: '',
                nextVisitDate: '',
              };
              onOpenPrint(blankRx);
            }}
            className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-teal-300 border border-slate-700 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-2xs cursor-pointer whitespace-nowrap"
          >
            <PenTool className="w-3.5 h-3.5 text-teal-400" />
            <span>Blank Rx Pad (For Handwriting)</span>
          </button>

          <button
            onClick={() => {
              if (patients.length > 0 && !selectedPatientId) {
                setSelectedPatientId(patients[0].id);
              }
              setIsCreateModalOpen(true);
            }}
            className="px-3.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-2xs cursor-pointer whitespace-nowrap"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            New Prescription
          </button>
        </div>
      </div>

      {/* Prescriptions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredPrescriptions.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-400 bg-white rounded-xl border border-slate-200 text-xs">
            No prescriptions found.
          </div>
        ) : (
          filteredPrescriptions.map((rx) => (
            <div
              key={rx.id}
              className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs hover:border-teal-400 transition-colors flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 text-xs">
                  <span className="font-mono font-bold text-teal-700">{rx.id}</span>
                  <span className="text-slate-400 font-mono text-[11px]">{rx.date}</span>
                </div>

                <div className="mt-2.5">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-slate-900 text-sm">{rx.patientName}</h3>
                    <span className="font-mono text-[10px] font-bold bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded">
                      {rx.patientId}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {rx.patientAge} Yrs • {rx.patientGender}
                  </p>
                  <p className="text-xs font-semibold text-teal-900 mt-1.5">{rx.doctorName}</p>
                </div>

                <div className="mt-3 p-2.5 bg-slate-50 rounded-lg text-xs space-y-1">
                  <p className="font-bold text-slate-800 line-clamp-1">
                    Diagnosis: <span className="font-normal text-slate-600">{rx.diagnosis || 'General Checkup'}</span>
                  </p>
                  <p className="text-[11px] text-slate-500">Medicines: {rx.medicines.length}</p>
                </div>
              </div>

              <div className="mt-3 pt-2.5 border-t border-slate-100 flex justify-end">
                <button
                  onClick={() => onOpenPrint(rx)}
                  className="px-3 py-1 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* CREATE NEW PRESCRIPTION MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-3xl my-auto overflow-hidden">
            <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm">Create New Prescription</h3>
              <button
                onClick={() => {
                  setIsCreateModalOpen(false);
                  onClearPreselectedPatient?.();
                }}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitPrescription} className="p-5 space-y-4 max-h-[82vh] overflow-y-auto text-xs">
              {/* Patient & Doctor */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">Patient *</label>
                  <select
                    value={selectedPatientId}
                    onChange={(e) => setSelectedPatientId(e.target.value)}
                    required
                    className="w-full px-2.5 py-1.5 rounded border border-slate-300 bg-white"
                  >
                    <option value="">Select Patient...</option>
                    {patients.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} — {p.id} ({p.phone})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">Doctor *</label>
                  <select
                    value={selectedDoctorId}
                    onChange={(e) => setSelectedDoctorId(e.target.value)}
                    required
                    className="w-full px-2.5 py-1.5 rounded border border-slate-300 bg-white"
                  >
                    <option value="">Select Doctor...</option>
                    {doctors.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.specialization})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Vitals */}
              <div>
                <span className="font-bold text-slate-600 uppercase text-[10px] block mb-1">Vitals:</span>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  <div>
                    <label className="block text-[9px] text-slate-500">BP</label>
                    <input
                      type="text"
                      value={bp}
                      onChange={(e) => setBp(e.target.value)}
                      className="w-full px-2 py-1 rounded border border-slate-300 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] text-slate-500">Pulse</label>
                    <input
                      type="text"
                      value={pulse}
                      onChange={(e) => setPulse(e.target.value)}
                      className="w-full px-2 py-1 rounded border border-slate-300 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] text-slate-500">Temp</label>
                    <input
                      type="text"
                      value={temp}
                      onChange={(e) => setTemp(e.target.value)}
                      className="w-full px-2 py-1 rounded border border-slate-300 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] text-slate-500">Weight</label>
                    <input
                      type="text"
                      value={weight}
                      onChange={(e) => setWeight(e.target.value)}
                      className="w-full px-2 py-1 rounded border border-slate-300 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] text-slate-500">SpO2</label>
                    <input
                      type="text"
                      value={spo2}
                      onChange={(e) => setSpo2(e.target.value)}
                      className="w-full px-2 py-1 rounded border border-slate-300 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] text-slate-500">RBS</label>
                    <input
                      type="text"
                      value={rbs}
                      onChange={(e) => setRbs(e.target.value)}
                      className="w-full px-2 py-1 rounded border border-slate-300 font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Complaints & Diagnosis */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">Chief Complaints</label>
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      placeholder="Type complaint..."
                      value={complaintInput}
                      onChange={(e) => setComplaintInput(e.target.value)}
                      className="flex-1 px-2.5 py-1.5 rounded border border-slate-300"
                    />
                    <button
                      type="button"
                      onClick={() => handleAddComplaint()}
                      className="px-2.5 py-1.5 bg-slate-800 text-white rounded font-bold"
                    >
                      +
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {complaintsList.map((c, i) => (
                      <span key={i} className="px-2 py-0.5 bg-slate-100 rounded text-[11px] flex items-center gap-1">
                        {c}
                        <button type="button" onClick={() => handleRemoveComplaint(i)} className="text-rose-500 font-bold">×</button>
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">Diagnosis *</label>
                  <input
                    type="text"
                    required
                    value={diagnosis}
                    onChange={(e) => setDiagnosis(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded border border-slate-300 font-semibold"
                  />
                </div>
              </div>

              {/* Medicine Builder */}
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-2">
                <span className="font-bold text-slate-700 uppercase text-[10px] block">Prescribe Medicines (Rx):</span>
                <div className="grid grid-cols-12 gap-1.5 items-end">
                  <div className="col-span-5">
                    <input
                      type="text"
                      placeholder="Medicine Name (e.g. Tab. Napa)"
                      value={medName}
                      onChange={(e) => setMedName(e.target.value)}
                      className="w-full px-2 py-1 rounded border border-slate-300 bg-white"
                    />
                  </div>
                  <div className="col-span-3">
                    <select
                      value={medDosage}
                      onChange={(e) => setMedDosage(e.target.value)}
                      className="w-full px-2 py-1 rounded border border-slate-300 bg-white font-mono"
                    >
                      <option value="1 + 0 + 1">1 + 0 + 1</option>
                      <option value="1 + 1 + 1">1 + 1 + 1</option>
                      <option value="1 + 0 + 0">1 + 0 + 0</option>
                      <option value="0 + 0 + 1">0 + 0 + 1</option>
                      <option value="0 + 1 + 0">0 + 1 + 0</option>
                    </select>
                  </div>
                  <div className="col-span-3">
                    <input
                      type="text"
                      placeholder="7 Days"
                      value={medDuration}
                      onChange={(e) => setMedDuration(e.target.value)}
                      className="w-full px-2 py-1 rounded border border-slate-300 bg-white"
                    />
                  </div>
                  <div className="col-span-1">
                    <button
                      type="button"
                      onClick={handleAddMedicine}
                      className="w-full py-1 bg-teal-600 text-white rounded font-bold"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="space-y-1 mt-1 max-h-32 overflow-y-auto">
                  {medicines.map((m, idx) => (
                    <div key={idx} className="p-1.5 bg-white border border-slate-200 rounded flex items-center justify-between">
                      <span><strong>{idx + 1}. {m.name}</strong> — {m.dosage} ({m.duration})</span>
                      <button type="button" onClick={() => handleRemoveMedicine(idx)} className="text-rose-500">✕</button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Lab Tests */}
              <div>
                <span className="font-bold text-slate-600 uppercase text-[10px] block mb-1">Recommended Lab Tests:</span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                  {testCatalog.map((t) => {
                    const checked = selectedTests.includes(t.name);
                    return (
                      <label key={t.id} className="flex items-center gap-1.5 p-1 bg-slate-50 border rounded text-[11px] cursor-pointer">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => handleToggleTest(t.name)}
                          className="rounded text-teal-600"
                        />
                        <span className="truncate">{t.code}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Advice */}
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">Advice</label>
                  <input
                    type="text"
                    value={advice}
                    onChange={(e) => setAdvice(e.target.value)}
                    className="w-full px-2 py-1 rounded border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">Follow-up Visit</label>
                  <input
                    type="text"
                    value={nextVisit}
                    onChange={(e) => setNextVisit(e.target.value)}
                    className="w-full px-2 py-1 rounded border border-slate-300"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-3 py-1.5 rounded border border-slate-300 text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded font-bold cursor-pointer"
                >
                  Print Prescription
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
