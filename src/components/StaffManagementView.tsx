import React, { useState } from 'react';
import {
  Users,
  PlusCircle,
  Search,
  Phone,
  Clock,
  Edit2,
  ShieldCheck,
  Lock,
  KeyRound,
  CheckSquare,
  Square,
  Sparkles,
  AlertTriangle,
  UserCheck,
} from 'lucide-react';
import { Staff, Role } from '../types';

export const ALL_SECTIONS = [
  { id: 'dashboard', label: 'Dashboard Overview' },
  { id: 'patients', label: 'Patient Registration' },
  { id: 'opd', label: 'OPD & Test Orders' },
  { id: 'ipd', label: 'IPD & Bed Admission' },
  { id: 'pharmacy', label: 'Pharmacy & Dispensary' },
  { id: 'billing', label: 'Billing & Collections' },
  { id: 'finance', label: 'Financial Analytics' },
  { id: 'prescriptions', label: 'Prescriptions Center' },
  { id: 'lab', label: 'Lab & Diagnostic Center' },
  { id: 'delivery', label: 'Report Delivery' },
  { id: 'appointments', label: 'Appointment Queue' },
  { id: 'staff', label: 'Doctors & Staff Roster' },
  { id: 'settings', label: 'Hospital Settings' },
] as const;

export const DEFAULT_ROLE_PRESETS: Record<Role, string[]> = {
  admin: ALL_SECTIONS.map((s) => s.id),
  doctor: ['dashboard', 'opd', 'prescriptions', 'patients', 'lab', 'appointments'],
  receptionist: ['dashboard', 'patients', 'appointments', 'opd', 'ipd'],
  accountant: ['dashboard', 'billing', 'finance', 'pharmacy', 'delivery'],
  lab_technician: ['dashboard', 'lab', 'delivery', 'opd'],
};

interface StaffManagementViewProps {
  staffList: Staff[];
  currentUser: Staff;
  onAddStaff: (staff: Staff) => void;
  onUpdateStaff: (staff: Staff) => void;
}

export const StaffManagementView: React.FC<StaffManagementViewProps> = ({
  staffList,
  currentUser,
  onAddStaff,
  onUpdateStaff,
}) => {
  const isAdmin = currentUser.role === 'admin';
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
  const [password, setPassword] = useState('123456');
  const [allowedTabs, setAllowedTabs] = useState<string[]>(DEFAULT_ROLE_PRESETS['doctor']);

  // Access Control & Permissions Dedicated Modal State
  const [accessModalStaff, setAccessModalStaff] = useState<Staff | null>(null);
  const [accessPassword, setAccessPassword] = useState('');
  const [accessAllowedTabs, setAccessAllowedTabs] = useState<string[]>([]);
  const [showAccessPassword, setShowAccessPassword] = useState(false);

  const handleOpenAccessModal = (stf: Staff) => {
    setAccessModalStaff(stf);
    setAccessPassword(stf.password || '123456');
    setAccessAllowedTabs(
      stf.allowedTabs && stf.allowedTabs.length > 0
        ? stf.allowedTabs
        : DEFAULT_ROLE_PRESETS[stf.role] || ['dashboard']
    );
    setShowAccessPassword(false);
  };

  const handleAccessToggleTab = (tabId: string) => {
    if (accessAllowedTabs.includes(tabId)) {
      setAccessAllowedTabs(accessAllowedTabs.filter((t) => t !== tabId));
    } else {
      setAccessAllowedTabs([...accessAllowedTabs, tabId]);
    }
  };

  const handleAccessApplyPreset = (targetRole: Role) => {
    setAccessAllowedTabs(DEFAULT_ROLE_PRESETS[targetRole] || ['dashboard']);
  };

  const handleSaveAccess = (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessModalStaff) return;
    const updated: Staff = {
      ...accessModalStaff,
      password: accessPassword.trim() || '123456',
      allowedTabs: accessAllowedTabs.length > 0 ? accessAllowedTabs : ['dashboard'],
    };
    onUpdateStaff(updated);
    setAccessModalStaff(null);
  };

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

  const handleApplyPreset = (targetRole: Role) => {
    setAllowedTabs(DEFAULT_ROLE_PRESETS[targetRole] || DEFAULT_ROLE_PRESETS['doctor']);
  };

  const handleToggleTab = (tabId: string) => {
    if (allowedTabs.includes(tabId)) {
      setAllowedTabs(allowedTabs.filter((t) => t !== tabId));
    } else {
      setAllowedTabs([...allowedTabs, tabId]);
    }
  };

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
    setPassword('123456');
    setAllowedTabs(DEFAULT_ROLE_PRESETS['doctor']);
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
    setPassword(stf.password || '123456');
    setAllowedTabs(stf.allowedTabs || DEFAULT_ROLE_PRESETS[stf.role] || DEFAULT_ROLE_PRESETS['admin']);
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
        password: password.trim() || '123456',
        allowedTabs: allowedTabs.length > 0 ? allowedTabs : DEFAULT_ROLE_PRESETS[role],
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
        password: password.trim() || '123456',
        allowedTabs: allowedTabs.length > 0 ? allowedTabs : DEFAULT_ROLE_PRESETS[role],
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

          {isAdmin && (
            <button
              onClick={() => handleOpenAccessModal(filteredStaff[0] || staffList[0])}
              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer whitespace-nowrap"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
              <span>Section Access Manager</span>
            </button>
          )}

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
                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-500">
                    <span>ID: {stf.id}</span>
                    <span className="text-slate-400">Shift: {stf.shift.split(' ')[0]}</span>
                  </div>
                  <p>{stf.department}</p>
                  <p className="flex items-center gap-1 font-mono text-[11px] text-slate-500">
                    <Phone className="w-3 h-3 text-slate-400" /> {stf.phone}
                  </p>
                  
                  {/* Access Control Permission Badge */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-1 text-[10px] text-purple-700 bg-purple-50 px-2 py-0.5 rounded font-bold">
                      <ShieldCheck className="w-3 h-3 text-purple-600" />
                      <span>
                        {stf.role === 'admin'
                          ? 'All Sections (Admin)'
                          : `${stf.allowedTabs?.length || DEFAULT_ROLE_PRESETS[stf.role]?.length || 0} Sections Allowed`}
                      </span>
                    </div>
                    {isDoctor && (
                      <span className="font-mono text-[11px] text-teal-800 font-bold">
                        BDT {stf.consultationFee}
                      </span>
                    )}
                  </div>

                  {isAdmin && (
                    <button
                      onClick={() => handleOpenAccessModal(stf)}
                      className="mt-2.5 w-full py-1.5 px-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
                      <span>Section Access & Password</span>
                    </button>
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

              {/* Password Setting */}
              <div className="p-3 bg-purple-50/70 border border-purple-200 rounded-xl space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-purple-900 flex items-center gap-1.5 uppercase">
                    <KeyRound className="w-3.5 h-3.5 text-purple-600" />
                    <span>Login Password (লগইন পাসওয়ার্ড) *</span>
                  </label>
                  <span className="text-[10px] text-purple-700 font-mono">Default: 123456</span>
                </div>
                <input
                  type="text"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Set password for this staff ID"
                  className="w-full px-2.5 py-1.5 rounded border border-purple-300 bg-white text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <p className="text-[10px] text-purple-700">
                  Staff member must use this password to sign in. Only Admin can view or change this.
                </p>
              </div>

              {/* Tab Permissions (RBAC) */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <span>Section & Tab Permissions (সেকশন এক্সেস কন্ট্রোল)</span>
                    </h4>
                    <p className="text-[10px] text-slate-500">
                      Staff will ONLY see and access the checked sections after login.
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setAllowedTabs(ALL_SECTIONS.map((s) => s.id))}
                      className="px-2 py-0.5 rounded bg-slate-200 hover:bg-slate-300 text-[10px] font-bold text-slate-700 cursor-pointer"
                    >
                      Select All
                    </button>
                    <button
                      type="button"
                      onClick={() => setAllowedTabs([])}
                      className="px-2 py-0.5 rounded bg-slate-200 hover:bg-slate-300 text-[10px] font-bold text-slate-700 cursor-pointer"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                {/* Preset Buttons */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Presets:</span>
                  <button
                    type="button"
                    onClick={() => handleApplyPreset('admin')}
                    className="px-2 py-0.5 bg-white border border-slate-300 hover:bg-slate-100 rounded text-[10px] font-semibold text-slate-700 cursor-pointer"
                  >
                    👑 Admin (All)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyPreset('doctor')}
                    className="px-2 py-0.5 bg-teal-50 border border-teal-200 hover:bg-teal-100 rounded text-[10px] font-semibold text-teal-800 cursor-pointer"
                  >
                    🩺 Doctor
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyPreset('receptionist')}
                    className="px-2 py-0.5 bg-amber-50 border border-amber-200 hover:bg-amber-100 rounded text-[10px] font-semibold text-amber-800 cursor-pointer"
                  >
                    💁 Receptionist
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyPreset('accountant')}
                    className="px-2 py-0.5 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 rounded text-[10px] font-semibold text-indigo-800 cursor-pointer"
                  >
                    💳 Cashier
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyPreset('lab_technician')}
                    className="px-2 py-0.5 bg-sky-50 border border-sky-200 hover:bg-sky-100 rounded text-[10px] font-semibold text-sky-800 cursor-pointer"
                  >
                    🔬 Pathologist
                  </button>
                </div>

                {/* Permission Checkbox Grid */}
                <div className="grid grid-cols-2 gap-1.5 max-h-44 overflow-y-auto pr-1">
                  {ALL_SECTIONS.map((sec) => {
                    const isChecked = allowedTabs.includes(sec.id);
                    return (
                      <label
                        key={sec.id}
                        className={`flex items-center gap-2 p-2 rounded-lg border text-xs cursor-pointer transition-colors ${
                          isChecked
                            ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950 font-bold'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleTab(sec.id)}
                          className="rounded text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5 cursor-pointer"
                        />
                        <span className="truncate">{sec.label}</span>
                      </label>
                    );
                  })}
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
      {/* DEDICATED SECTION ACCESS & PERMISSIONS MODAL */}
      {accessModalStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/75 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-300 w-full max-w-xl my-auto overflow-hidden animate-fadeIn">
            {/* Modal Header */}
            <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base flex items-center gap-2">
                    <span>Section Access & Permissions</span>
                    <span className="font-mono text-xs px-2 py-0.5 rounded bg-purple-900/60 border border-purple-400 text-purple-200">
                      ID: {accessModalStaff.id}
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-300">
                    Admin Access Control: Configure allowed sections and login password per user ID
                  </p>
                </div>
              </div>
              <button
                onClick={() => setAccessModalStaff(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveAccess} className="p-5 space-y-4 text-xs">
              {/* Staff Selector to easily switch between staff */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Select Staff Member by User ID
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <select
                    value={accessModalStaff.id}
                    onChange={(e) => {
                      const selected = staffList.find((s) => s.id === e.target.value);
                      if (selected) handleOpenAccessModal(selected);
                    }}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white font-mono text-xs font-bold text-slate-900"
                  >
                    {staffList.map((stf) => (
                      <option key={stf.id} value={stf.id}>
                        {stf.id} - {stf.name} ({stf.role})
                      </option>
                    ))}
                  </select>

                  <div className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 flex items-center justify-between text-xs text-slate-600">
                    <span className="font-bold text-slate-900 truncate">{accessModalStaff.name}</span>
                    <span className="text-[10px] font-mono text-purple-700 font-bold uppercase ml-1">
                      {accessModalStaff.role}
                    </span>
                  </div>
                </div>
              </div>

              {/* Login Password Setting */}
              <div className="p-3.5 bg-purple-50/80 border border-purple-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-purple-950 flex items-center gap-1.5 uppercase">
                    <KeyRound className="w-4 h-4 text-purple-600" />
                    <span>Staff Login Password (লগইন পাসওয়ার্ড) *</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowAccessPassword(!showAccessPassword)}
                    className="text-[10px] text-purple-700 font-bold underline cursor-pointer hover:text-purple-900"
                  >
                    {showAccessPassword ? 'Hide Password' : 'Show Password'}
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showAccessPassword ? 'text' : 'password'}
                    required
                    value={accessPassword}
                    onChange={(e) => setAccessPassword(e.target.value)}
                    placeholder="Enter login password for this staff ID"
                    className="w-full px-3 py-2 rounded-lg border border-purple-300 bg-white text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <p className="text-[11px] text-purple-800">
                  ⚠️ When this staff logs in with User ID <strong>{accessModalStaff.id}</strong>, they MUST enter this password. Only the Admin can view or modify this.
                </p>
              </div>

              {/* Section Access Checkboxes */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <span>Authorized Sections ({accessAllowedTabs.length} of {ALL_SECTIONS.length} Selected)</span>
                    </h4>
                    <p className="text-[10px] text-slate-500">
                      This user will ONLY be able to log in to and view the checked sections. All other sections will be strictly blocked.
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setAccessAllowedTabs(ALL_SECTIONS.map((s) => s.id))}
                      className="px-2.5 py-1 rounded bg-slate-200 hover:bg-slate-300 text-[10px] font-bold text-slate-700 cursor-pointer"
                    >
                      Select All
                    </button>
                    <button
                      type="button"
                      onClick={() => setAccessAllowedTabs([])}
                      className="px-2.5 py-1 rounded bg-slate-200 hover:bg-slate-300 text-[10px] font-bold text-slate-700 cursor-pointer"
                    >
                      Clear All
                    </button>
                  </div>
                </div>

                {/* Quick Presets */}
                <div className="flex items-center gap-1.5 flex-wrap pt-1 border-t border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Apply Role Preset:</span>
                  <button
                    type="button"
                    onClick={() => handleAccessApplyPreset('admin')}
                    className="px-2 py-0.5 bg-white border border-slate-300 hover:bg-slate-100 rounded text-[10px] font-bold text-purple-700 cursor-pointer"
                  >
                    👑 Admin (All)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAccessApplyPreset('doctor')}
                    className="px-2 py-0.5 bg-white border border-slate-300 hover:bg-slate-100 rounded text-[10px] font-bold text-teal-700 cursor-pointer"
                  >
                    🩺 Doctor
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAccessApplyPreset('receptionist')}
                    className="px-2 py-0.5 bg-white border border-slate-300 hover:bg-slate-100 rounded text-[10px] font-bold text-amber-700 cursor-pointer"
                  >
                    💁 Receptionist
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAccessApplyPreset('accountant')}
                    className="px-2 py-0.5 bg-white border border-slate-300 hover:bg-slate-100 rounded text-[10px] font-bold text-indigo-700 cursor-pointer"
                  >
                    🧾 Cashier/Billing
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAccessApplyPreset('lab_technician')}
                    className="px-2 py-0.5 bg-white border border-slate-300 hover:bg-slate-100 rounded text-[10px] font-bold text-rose-700 cursor-pointer"
                  >
                    🔬 Lab Pathologist
                  </button>
                </div>

                {/* Checkbox Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
                  {ALL_SECTIONS.map((sec) => {
                    const isChecked = accessAllowedTabs.includes(sec.id);
                    return (
                      <label
                        key={sec.id}
                        className={`flex items-center gap-2 p-2 rounded-lg border text-xs cursor-pointer select-none transition-all ${
                          isChecked
                            ? 'bg-purple-50/80 border-purple-300 text-purple-950 font-bold'
                            : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleAccessToggleTab(sec.id)}
                          className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500 cursor-pointer"
                        />
                        <span className="truncate">{sec.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-200">
                <span className="text-[11px] text-slate-500">
                  Changes take effect immediately for User ID <strong>{accessModalStaff.id}</strong>.
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setAccessModalStaff(null)}
                    className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 cursor-pointer font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold flex items-center gap-1.5 shadow-md cursor-pointer transition-all"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>Save Access Permissions</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
