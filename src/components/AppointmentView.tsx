import React, { useState } from 'react';
import {
  Calendar,
  PlusCircle,
  Search,
  Clock,
  FileText,
  Printer
} from 'lucide-react';
import { Appointment, Patient, Staff } from '../types';

interface AppointmentViewProps {
  appointments: Appointment[];
  patients: Patient[];
  staff: Staff[];
  onAddAppointment: (appointment: Appointment) => void;
  onUpdateStatus: (appointmentId: string, status: Appointment['status']) => void;
  onNavigateToPrescription: (patientId: string, doctorId?: string) => void;
  onOpenAppointmentPrint?: (appointment: Appointment) => void;
  onOpenScanner: () => void;
  preselectedPatientId?: string | null;
  onClearPreselectedPatient?: () => void;
}

export const AppointmentView: React.FC<AppointmentViewProps> = ({
  appointments,
  patients,
  staff,
  onAddAppointment,
  onUpdateStatus,
  onNavigateToPrescription,
  onOpenAppointmentPrint,
  onOpenScanner,
  preselectedPatientId,
  onClearPreselectedPatient,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isBookModalOpen, setIsBookModalOpen] = useState(Boolean(preselectedPatientId));

  const [selectedPatientId, setSelectedPatientId] = useState<string>(preselectedPatientId || (patients[0]?.id ?? ''));
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>(
    staff.find((s) => s.role === 'doctor')?.id || ''
  );
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [timeSlot, setTimeSlot] = useState('10:00 AM');
  const [notes, setNotes] = useState('Regular Checkup');

  const doctors = staff.filter((s) => s.role === 'doctor');
  const selectedDoctor = staff.find((s) => s.id === selectedDoctorId);

  const handleBookSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const patient = patients.find((p) => p.id === selectedPatientId);
    const doctor = staff.find((s) => s.id === selectedDoctorId);

    if (!patient || !doctor) return;

    const doctorApts = appointments.filter((a) => a.doctorId === doctor.id && a.date === date);
    const serial = doctorApts.length + 1;

    const newApt: Appointment = {
      id: `APT-${100 + appointments.length + 1}`,
      patientId: patient.id,
      patientName: patient.name,
      doctorId: doctor.id,
      doctorName: doctor.name,
      specialization: doctor.specialization || 'Consultant',
      date,
      timeSlot,
      serialNumber: serial,
      fee: doctor.consultationFee || 800,
      status: 'scheduled',
      notes,
    };

    onAddAppointment(newApt);
    setIsBookModalOpen(false);
    onClearPreselectedPatient?.();
    onOpenAppointmentPrint?.(newApt);
  };

  const filteredAppointments = appointments.filter((apt) => {
    const matchesFilter = filterStatus === 'all' || apt.status === filterStatus;
    const q = searchQuery.toLowerCase().trim();
    if (!q) return matchesFilter;
    return (
      matchesFilter &&
      (apt.patientName.toLowerCase().includes(q) ||
        apt.patientId.toLowerCase().includes(q) ||
        apt.doctorName.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 flex flex-col sm:flex-row gap-2.5 items-center justify-between">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search patient or doctor..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 rounded-lg border border-slate-200 text-xs focus:ring-1 focus:ring-amber-500 font-mono"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-between">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-2.5 py-1 rounded text-xs font-bold ${
                filterStatus === 'all' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'
              }`}
            >
              All ({appointments.length})
            </button>
            <button
              onClick={() => setFilterStatus('waiting')}
              className={`px-2.5 py-1 rounded text-xs font-bold ${
                filterStatus === 'waiting' ? 'bg-amber-500 text-white' : 'bg-amber-50 text-amber-800'
              }`}
            >
              Waiting
            </button>
            <button
              onClick={() => setFilterStatus('completed')}
              className={`px-2.5 py-1 rounded text-xs font-bold ${
                filterStatus === 'completed' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'
              }`}
            >
              Completed
            </button>
          </div>

          <button
            onClick={() => {
              if (patients.length > 0 && !selectedPatientId) {
                setSelectedPatientId(patients[0].id);
              }
              setIsBookModalOpen(true);
            }}
            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer whitespace-nowrap"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            Book Serial
          </button>
        </div>
      </div>

      {/* Appointment Tokens List */}
      <div className="space-y-2.5">
        {filteredAppointments.length === 0 ? (
          <div className="py-8 bg-white rounded-xl border border-slate-200 text-center text-slate-400 text-xs">
            No appointments found.
          </div>
        ) : (
          filteredAppointments.map((apt) => (
            <div
              key={apt.id}
              className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
            >
              <div className="flex items-center gap-3">
                <span className="w-9 h-9 rounded-xl bg-amber-500 text-white font-mono font-black text-sm flex items-center justify-center shrink-0">
                  #{apt.serialNumber}
                </span>

                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-bold text-slate-900">{apt.patientName}</h3>
                    <span className="font-mono text-[10px] text-slate-500 bg-slate-100 px-1 rounded">
                      {apt.patientId}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {apt.timeSlot} • Fee: BDT {apt.fee}
                  </p>
                </div>
              </div>

              <div className="text-left sm:text-right">
                <p className="font-semibold text-teal-900">{apt.doctorName}</p>
                <p className="text-[11px] text-slate-400">{apt.specialization}</p>
              </div>

              <div className="flex items-center gap-2 justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                <select
                  value={apt.status}
                  onChange={(e) => onUpdateStatus(apt.id, e.target.value as any)}
                  className="px-2 py-1 rounded border border-slate-200 text-xs bg-slate-50 font-medium"
                >
                  <option value="waiting">Waiting</option>
                  <option value="in_consultation">In Consultation</option>
                  <option value="completed">Completed</option>
                </select>

                <button
                  onClick={() => onOpenAppointmentPrint?.(apt)}
                  className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                  title="Print appointment letter & token slip"
                >
                  <Printer className="w-3 h-3 text-amber-700" />
                  Print Letter
                </button>

                <button
                  onClick={() => onNavigateToPrescription(apt.patientId, apt.doctorId)}
                  className="px-2.5 py-1 bg-teal-600 hover:bg-teal-700 text-white rounded text-xs font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <FileText className="w-3 h-3" />
                  Prescription
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* BOOK APPOINTMENT MODAL */}
      {isBookModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-sm overflow-hidden">
            <div className="px-4 py-3 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm">New Serial Booking</h3>
              <button
                onClick={() => {
                  setIsBookModalOpen(false);
                  onClearPreselectedPatient?.();
                }}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleBookSubmit} className="p-4 space-y-3 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">Patient *</label>
                <select
                  value={selectedPatientId}
                  onChange={(e) => setSelectedPatientId(e.target.value)}
                  required
                  className="w-full px-2.5 py-1.5 rounded border border-slate-300 bg-slate-50"
                >
                  <option value="">Select Patient...</option>
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.id})
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
                  className="w-full px-2.5 py-1.5 rounded border border-slate-300 bg-slate-50"
                >
                  <option value="">Select Doctor...</option>
                  {doctors.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} — BDT {d.consultationFee}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">Date</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-2 py-1 rounded border border-slate-300 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">Time</label>
                  <select
                    value={timeSlot}
                    onChange={(e) => setTimeSlot(e.target.value)}
                    className="w-full px-2 py-1 rounded border border-slate-300 bg-slate-50"
                  >
                    <option value="10:00 AM">10:00 AM</option>
                    <option value="11:00 AM">11:00 AM</option>
                    <option value="04:00 PM">04:00 PM</option>
                    <option value="06:00 PM">06:00 PM</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsBookModalOpen(false)}
                  className="px-3 py-1.5 rounded border border-slate-300 text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded font-bold cursor-pointer"
                >
                  Complete Booking
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
