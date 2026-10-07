import React, { useState } from 'react';
import {
  Users,
  PlusCircle,
  Search,
  Phone,
  Clock,
  Edit2
} from 'lucide-react';
import { Staff, Role } from '../types';

interface StaffManagementViewProps {
  staffList: Staff[];
  onAddStaff: (staff: Staff) => void;
  onUpdateStaff: (staff: Staff) => void;
}

export const StaffManagementView: React.FC<StaffManagementViewProps> = ({
  staffList,
  onAddStaff,
  onUpdateStaff,
}) => {
  const [filterRole, setFilterRole] = useState<'all' | Role>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);

  const [name, setName] = useState('');
  const [role, setRole] = useState<Role>('doctor');
  const [department, setDepartment] = useState('Medicine Department');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [shift, setShift] = useState('Morning (8:00 AM - 2:00 PM)');
  const [qualification, setQualification] = useState('');
  const [bmdcReg, setBmdcReg] = useState('');
  const [consultationFee, setConsultationFee] = useState<number>(800);
  const [roomNo, setRoomNo] = useState('Chamber 402');
  const [specialization, setSpecialization] = useState('Medicine Specialist');

  const filteredStaff = staffList.filter((stf) => {
    const matchesRole = filterRole === 'all' || stf.role === filterRole;
    const q = searchQuery.toLowerCase().trim();
    return (
      matchesRole &&
      (!q ||
        stf.name.toLowerCase().includes(q) ||
        stf.department.toLowerCase().includes(q) ||
        (stf.specialization && stf.specialization.toLowerCase().includes(q)))
    );
  });

  const handleOpenAddModal = () => {
    setEditingStaff(null);
    setName('');
    setRole('doctor');
    setDepartment('Medicine Department');
    setPhone('');
    setEmail('');
    setShift('Morning (8:00 AM - 2:00 PM)');
    setQualification('MBBS, FCPS');
    setBmdcReg('A-');
    setConsultationFee(800);
    setRoomNo('Chamber 301');
    setSpecialization('Internal Medicine Specialist');
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (stf: Staff) => {
    setEditingStaff(stf);
    setName(stf.name);
    setRole(stf.role);
    setDepartment(stf.department);
    setPhone(stf.phone);
    setEmail(stf.email);
    setShift(stf.shift);
    setQualification(stf.qualification || '');
    setBmdcReg(stf.bmdcReg || '');
    setConsultationFee(stf.consultationFee || 800);
    setRoomNo(stf.roomNo || '');
    setSpecialization(stf.specialization || '');
    setIsAddModalOpen(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editingStaff) {
      const updated: Staff = {
        ...editingStaff,
        name: name.trim(),
        role,
        department: department.trim(),
        phone: phone.trim(),
        email: email.trim(),
        shift,
        qualification: role === 'doctor' ? qualification.trim() : undefined,
        bmdcReg: role === 'doctor' ? bmdcReg.trim() : undefined,
        consultationFee: role === 'doctor' ? Number(consultationFee) : undefined,
        roomNo: role === 'doctor' ? roomNo.trim() : undefined,
        specialization: role === 'doctor' ? specialization.trim() : undefined,
      };
      onUpdateStaff(updated);
    } else {
      const newStaff: Staff = {
        id: `STF-${String(staffList.length + 1).padStart(2, '0')}`,
        name: name.trim(),
        role,
        department: department.trim(),
        phone: phone.trim(),
        email: email.trim(),
        shift,
        status: 'active',
        qualification: role === 'doctor' ? qualification.trim() : undefined,
        bmdcReg: role === 'doctor' ? bmdcReg.trim() : undefined,
        consultationFee: role === 'doctor' ? Number(consultationFee) : undefined,
        roomNo: role === 'doctor' ? roomNo.trim() : undefined,
        specialization: role === 'doctor' ? specialization.trim() : undefined,
      };
      onAddStaff(newStaff);
    }

    setIsAddModalOpen(false);
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 flex flex-col sm:flex-row gap-2.5 items-center justify-between">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search name or department..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 rounded-lg border border-slate-200 text-xs focus:ring-1 focus:ring-purple-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-between">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setFilterRole('all')}
              className={`px-2.5 py-1 rounded text-xs font-bold ${
                filterRole === 'all' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'
              }`}
            >
              All ({staffList.length})
            </button>
            <button
              onClick={() => setFilterRole('doctor')}
              className={`px-2.5 py-1 rounded text-xs font-bold ${
                filterRole === 'doctor' ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-600'
              }`}
            >
              Doctors
            </button>
            <button
              onClick={() => setFilterRole('accountant')}
              className={`px-2.5 py-1 rounded text-xs font-bold ${
                filterRole === 'accountant' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'
              }`}
            >
              Cashiers
            </button>
          </div>

          <button
            onClick={handleOpenAddModal}
            className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer whitespace-nowrap"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            New Staff
          </button>
        </div>
      </div>

      {/* Staff Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredStaff.map((stf) => {
          const isDoctor = stf.role === 'doctor';
          return (
            <div
              key={stf.id}
              className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs hover:border-purple-300 transition-colors flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-9 h-9 rounded-lg text-white font-bold flex items-center justify-center text-xs ${
                        isDoctor ? 'bg-teal-600' : 'bg-slate-800'
                      }`}
                    >
                      {stf.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">{stf.name}</h3>
                      <span className="text-[10px] font-bold text-slate-500 uppercase">
                        {isDoctor ? stf.specialization : stf.role}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleOpenEdit(stf)}
                    className="p-1 text-slate-400 hover:text-slate-700 rounded"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="mt-3 space-y-1 text-xs text-slate-600">
                  <p>{stf.department}</p>
                  <p className="flex items-center gap-1 text-[11px] text-slate-500">
                    <Clock className="w-3 h-3 text-slate-400" /> {stf.shift}
                  </p>
                  <p className="flex items-center gap-1 font-mono text-[11px] text-slate-500">
                    <Phone className="w-3 h-3 text-slate-400" /> {stf.phone}
                  </p>
                  {isDoctor && (
                    <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-semibold text-teal-900">
                      <span>{stf.roomNo || 'Chamber'}</span>
                      <span className="font-mono">Fee: BDT {stf.consultationFee}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ADD / EDIT MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-lg my-auto overflow-hidden">
            <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm">{editingStaff ? 'Edit Staff Profile' : 'Add New Staff'}</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-5 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">Name *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">Role *</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as Role)}
                    className="w-full px-2.5 py-1.5 rounded border border-slate-300 bg-slate-50 font-bold"
                  >
                    <option value="doctor">Doctor</option>
                    <option value="admin">Administrator</option>
                    <option value="receptionist">Receptionist</option>
                    <option value="accountant">Cashier</option>
                    <option value="lab_technician">Pathologist</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">Department *</label>
                  <input
                    type="text"
                    required
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">Shift *</label>
                  <select
                    value={shift}
                    onChange={(e) => setShift(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded border border-slate-300 bg-slate-50"
                  >
                    <option value="Morning (8:00 AM - 2:00 PM)">Morning (8:00 AM - 2:00 PM)</option>
                    <option value="Evening (2:00 PM - 8:00 PM)">Evening (2:00 PM - 8:00 PM)</option>
                    <option value="Night (8:00 PM - 8:00 AM)">Night (8:00 PM - 8:00 AM)</option>
                    <option value="Regular (9:00 AM - 5:00 PM)">Regular (9:00 AM - 5:00 PM)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">Mobile Phone *</label>
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded border border-slate-300 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded border border-slate-300 font-mono"
                  />
                </div>
              </div>

              {role === 'doctor' && (
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[9px] text-slate-500">Specialization</label>
                    <input
                      type="text"
                      value={specialization}
                      onChange={(e) => setSpecialization(e.target.value)}
                      className="w-full px-2 py-1 rounded border border-slate-300 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] text-slate-500">Visit Fee (BDT)</label>
                    <input
                      type="number"
                      value={consultationFee}
                      onChange={(e) => setConsultationFee(Number(e.target.value))}
                      className="w-full px-2 py-1 rounded border border-slate-300 bg-white font-mono"
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3 py-1.5 rounded border border-slate-300 text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded font-bold cursor-pointer"
                >
                  Save Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
