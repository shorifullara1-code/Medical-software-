import React, { useState } from 'react';
import {
  UserPlus,
  Search,
  Printer,
  Droplet,
  Phone,
  MapPin,
  History,
} from 'lucide-react';
import { Patient } from '../types';
import { BarcodeRenderer } from './BarcodeRenderer';

interface PatientRegistrationViewProps {
  patients: Patient[];
  onAddPatient: (patient: Patient) => void;
  onOpenCardPrint: (patient: Patient) => void;
  onOpenScanner: () => void;
  onNavigateToPrescription: (patientId: string) => void;
  onNavigateToBilling: (patientId: string) => void;
  onNavigateToAppointment: (patientId: string) => void;
  onOpenPatientHistory?: (patientId: string) => void;
}

export const PatientRegistrationView: React.FC<PatientRegistrationViewProps> = ({
  patients,
  onAddPatient,
  onOpenCardPrint,
  onOpenScanner,
  onNavigateToPrescription,
  onNavigateToBilling,
  onNavigateToAppointment,
  onOpenPatientHistory,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);

  // New Patient Form State
  const [name, setName] = useState('');
  const [age, setAge] = useState<number>(30);
  const [gender, setGender] = useState<'male' | 'female' | 'other'>('male');
  const [phone, setPhone] = useState('');
  const [bloodGroup, setBloodGroup] = useState<'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-'>('B+');
  const [address, setAddress] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [medicalHistory, setMedicalHistory] = useState('');

  const nextIdNumber = String(patients.length + 1).padStart(3, '0');
  const previewNewId = `P-${new Date().getFullYear()}-${nextIdNumber}`;

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;

    const newPatient: Patient = {
      id: previewNewId,
      name: name.trim(),
      age: Number(age),
      gender,
      phone: phone.trim(),
      bloodGroup,
      address: address.trim() || 'Dhaka, Bangladesh',
      emergencyContact: emergencyContact.trim(),
      registeredAt: new Date().toISOString().split('T')[0],
      medicalHistory: medicalHistory.trim(),
    };

    onAddPatient(newPatient);
    setIsRegisterModalOpen(false);

    setName('');
    setAge(30);
    setPhone('');
    setAddress('');
    setEmergencyContact('');
    setMedicalHistory('');

    onOpenCardPrint(newPatient);
  };

  const filteredPatients = patients.filter((p) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      p.id.toLowerCase().includes(q) ||
      p.name.toLowerCase().includes(q) ||
      p.phone.includes(q)
    );
  });

  return (
    <div className="space-y-4">
      {/* Top Search & Add Toolbar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 flex items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by Patient ID, Name, or Phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 rounded-lg border border-slate-200 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-teal-500"
          />
        </div>

        <button
          onClick={() => setIsRegisterModalOpen(true)}
          className="px-3.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-2xs cursor-pointer whitespace-nowrap"
        >
          <UserPlus className="w-3.5 h-3.5" />
          Register New Patient
        </button>
      </div>

      {/* Patient Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredPatients.map((patient) => (
          <div
            key={patient.id}
            className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs hover:border-teal-300 transition-colors flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-2 pb-2.5 border-b border-slate-100">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">{patient.name}</h3>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="font-mono text-[10px] font-bold bg-slate-900 text-white px-1.5 py-0.5 rounded">
                      {patient.id}
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-0.5">
                      <Droplet className="w-2.5 h-2.5 text-rose-500 fill-rose-500" />
                      {patient.bloodGroup}
                    </span>
                  </div>
                </div>

                <div className="p-1 bg-slate-50 border border-slate-200 rounded">
                  <BarcodeRenderer value={patient.id} height={26} width={1.1} fontSize={8} />
                </div>
              </div>

              <div className="mt-2.5 space-y-1 text-xs text-slate-600">
                <p>Age: {patient.age} Yrs ({patient.gender === 'male' ? 'Male' : 'Female'})</p>
                <p className="font-mono text-slate-700">{patient.phone}</p>
                <p className="text-[11px] text-slate-400 truncate">{patient.address}</p>
              </div>
            </div>

            <div className="mt-3 pt-2.5 border-t border-slate-100 space-y-1.5">
              <div className="grid grid-cols-3 gap-1 text-center">
                <button
                  onClick={() => onNavigateToPrescription(patient.id)}
                  className="py-1 px-1 bg-teal-50 hover:bg-teal-100 text-teal-800 rounded text-[11px] font-semibold cursor-pointer"
                >
                  Prescriptions
                </button>
                <button
                  onClick={() => onNavigateToBilling(patient.id)}
                  className="py-1 px-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 rounded text-[11px] font-semibold cursor-pointer"
                >
                  Billing
                </button>
                <button
                  onClick={() => onNavigateToAppointment(patient.id)}
                  className="py-1 px-1 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded text-[11px] font-semibold cursor-pointer"
                >
                  Queue
                </button>
              </div>

              <div className="grid grid-cols-2 gap-1.5 pt-1">
                {onOpenPatientHistory && (
                  <button
                    onClick={() => onOpenPatientHistory(patient.id)}
                    className="w-full py-1 bg-teal-50 hover:bg-teal-100 text-teal-800 rounded text-[11px] font-semibold flex items-center justify-center gap-1 cursor-pointer transition-colors"
                  >
                    <History className="w-3 h-3 text-teal-600" />
                    Medical History
                  </button>
                )}
                <button
                  onClick={() => onOpenCardPrint(patient)}
                  className={`w-full py-1 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded text-[11px] font-medium flex items-center justify-center gap-1 cursor-pointer ${
                    !onOpenPatientHistory ? 'col-span-2' : ''
                  }`}
                >
                  <Printer className="w-3 h-3 text-slate-500" />
                  Health Card
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* REGISTER NEW PATIENT MODAL */}
      {isRegisterModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-lg my-auto overflow-hidden">
            <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm">New Patient Registration (ID: {previewNewId})</h3>
              <button onClick={() => setIsRegisterModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleRegisterSubmit} className="p-5 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">Patient Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="Enter full name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">Phone Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="01700-000000"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded border border-slate-300 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">Age *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={age}
                    onChange={(e) => setAge(Number(e.target.value))}
                    className="w-full px-2 py-1.5 rounded border border-slate-300 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">Gender *</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value as any)}
                    className="w-full px-2 py-1.5 rounded border border-slate-300 bg-slate-50"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">Blood Group</label>
                  <select
                    value={bloodGroup}
                    onChange={(e) => setBloodGroup(e.target.value as any)}
                    className="w-full px-2 py-1.5 rounded border border-slate-300 bg-slate-50 font-bold text-rose-700"
                  >
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">Address</label>
                <input
                  type="text"
                  placeholder="Enter patient address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded border border-slate-300"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">Medical History / Allergies</label>
                <input
                  type="text"
                  placeholder="e.g. Diabetes, Hypertension, Asthma"
                  value={medicalHistory}
                  onChange={(e) => setMedicalHistory(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded border border-slate-300"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsRegisterModalOpen(false)}
                  className="px-3 py-1.5 rounded border border-slate-300 text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded font-bold cursor-pointer"
                >
                  Confirm Registration
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
