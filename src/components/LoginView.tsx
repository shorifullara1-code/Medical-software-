import React, { useState } from 'react';
import {
  ShieldCheck,
  User,
  Lock,
  Phone,
  Building2,
  Stethoscope,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowRight,
  Eye,
  EyeOff,
  UserCheck,
  FileText,
  Activity,
  CreditCard,
} from 'lucide-react';
import { Staff, Patient, HospitalSettings, AuthSession } from '../types';
import { HospitalEmblem } from './HospitalEmblem';

interface LoginViewProps {
  staffList: Staff[];
  patientsList: Patient[];
  hospitalSettings: HospitalSettings;
  onLoginSuccess: (session: AuthSession) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({
  staffList,
  patientsList,
  hospitalSettings,
  onLoginSuccess,
}) => {
  const [authRoleTab, setAuthRoleTab] = useState<'patient' | 'staff'>('patient');

  // Patient Login Form State
  const [patientIdInput, setPatientIdInput] = useState('');
  const [patientPhoneInput, setPatientPhoneInput] = useState('');
  const [patientError, setPatientError] = useState<string | null>(null);

  // Staff Login Form State
  const [staffIdOrEmail, setStaffIdOrEmail] = useState('');
  const [staffPassword, setStaffPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [staffError, setStaffError] = useState<string | null>(null);

  // Handle Patient Login
  const handlePatientLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setPatientError(null);

    const cleanId = patientIdInput.trim().toUpperCase();
    const cleanPhone = patientPhoneInput.trim().replace(/[\s-]/g, '');

    if (!cleanId || !cleanPhone) {
      setPatientError('Please provide both Patient ID and registered Phone Number.');
      return;
    }

    const matchedPatient = patientsList.find((p) => {
      const pId = p.id.toUpperCase();
      const pPhone = p.phone.replace(/[\s-]/g, '');
      return pId === cleanId && (pPhone === cleanPhone || p.phone.includes(cleanPhone));
    });

    if (matchedPatient) {
      const session: AuthSession = {
        isAuthenticated: true,
        type: 'patient',
        patientUser: matchedPatient,
        loginTime: new Date().toISOString(),
      };
      onLoginSuccess(session);
    } else {
      setPatientError(
        'Invalid Patient ID or Phone Number. Please enter the registered phone number as your password.'
      );
    }
  };

  // Quick Patient Login Helper
  const handleQuickPatientSelect = (p: Patient) => {
    setPatientIdInput(p.id);
    setPatientPhoneInput(p.phone);
    setPatientError(null);
  };

  // Handle Staff Login
  const handleStaffLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setStaffError(null);

    const cleanId = staffIdOrEmail.trim().toLowerCase();
    if (!cleanId) {
      setStaffError('Please enter Staff ID or Email.');
      return;
    }

    const matchedStaff = staffList.find(
      (s) =>
        s.id.toLowerCase() === cleanId ||
        s.email.toLowerCase() === cleanId ||
        s.name.toLowerCase().includes(cleanId)
    );

    if (matchedStaff) {
      const session: AuthSession = {
        isAuthenticated: true,
        type: 'staff',
        staffUser: matchedStaff,
        loginTime: new Date().toISOString(),
      };
      onLoginSuccess(session);
    } else {
      setStaffError('Staff record not found. Please enter a valid Staff ID or Email.');
    }
  };

  // Quick Staff Login Helper
  const handleQuickStaffSelect = (s: Staff) => {
    const session: AuthSession = {
      isAuthenticated: true,
      type: 'staff',
      staffUser: s,
      loginTime: new Date().toISOString(),
    };
    onLoginSuccess(session);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-teal-950 flex flex-col justify-between text-slate-100 selection:bg-teal-500 selection:text-white">
      {/* Top Background Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(#14b8a6_1px,transparent_1px)] [background-size:24px_24px] opacity-10 pointer-events-none"></div>

      {/* Main Container */}
      <div className="relative z-10 flex-1 flex items-center justify-center p-4 sm:p-6 md:p-8">
        <div className="w-full max-w-xl bg-slate-900/90 backdrop-blur-xl border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden">
          {/* Header Brand Section */}
          <div className="p-6 sm:p-8 text-center border-b border-slate-800/80 bg-slate-950/50">
            <div className="flex justify-center mb-3">
              <HospitalEmblem
                size={84}
                customLogoUrl={hospitalSettings.customLogoUrl}
                altText={hospitalSettings.name}
              />
            </div>
            <h1 className="text-lg sm:text-2xl font-black text-white tracking-tight uppercase font-serif">
              {hospitalSettings.name || 'MEDPULSE SPECIALIZED HOSPITAL'}
            </h1>
            <p className="text-xs text-teal-400 font-medium mt-1">
              {hospitalSettings.slogan || 'Service is Our Motto • 24/7 Digital Healthcare'}
            </p>
          </div>

          {/* Role Tabs */}
          <div className="grid grid-cols-2 p-2 bg-slate-950/80 border-b border-slate-800 text-xs font-bold">
            <button
              onClick={() => {
                setAuthRoleTab('patient');
                setPatientError(null);
              }}
              className={`py-3 rounded-2xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
                authRoleTab === 'patient'
                  ? 'bg-teal-600 text-white shadow-lg shadow-teal-900/40'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <User className="w-4 h-4" />
              <span>Patient Portal Login</span>
            </button>
            <button
              onClick={() => {
                setAuthRoleTab('staff');
                setStaffError(null);
              }}
              className={`py-3 rounded-2xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
                authRoleTab === 'staff'
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/40'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <Stethoscope className="w-4 h-4" />
              <span>Staff & Admin Login</span>
            </button>
          </div>

          {/* Form Content Area */}
          <div className="p-6 sm:p-8">
            {/* ========================================================================= */}
            {/* 1. PATIENT PORTAL LOGIN FORM */}
            {/* ========================================================================= */}
            {authRoleTab === 'patient' && (
              <div className="space-y-5">
                <div className="space-y-1">
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    <Activity className="w-4 h-4 text-teal-400" />
                    <span>Patient Portal & Online Lab Reports</span>
                  </h2>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Enter your <strong>Patient ID (Username)</strong> and <strong>Registered Phone Number (Password)</strong> to view prescriptions and lab test reports.
                  </p>
                </div>

                {patientError && (
                  <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <span>{patientError}</span>
                  </div>
                )}

                <form onSubmit={handlePatientLogin} className="space-y-4 text-xs">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                      Username / Patient ID *
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        placeholder="e.g. P-2026-001 or P-2026-003"
                        value={patientIdInput}
                        onChange={(e) => setPatientIdInput(e.target.value)}
                        className="w-full pl-10 pr-3 py-2.5 bg-slate-950/60 border border-slate-700 rounded-xl font-mono text-sm text-white focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                      Password (Registered Phone Number) *
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        placeholder="e.g. 01712-349812"
                        value={patientPhoneInput}
                        onChange={(e) => setPatientPhoneInput(e.target.value)}
                        className="w-full pl-10 pr-3 py-2.5 bg-slate-950/60 border border-slate-700 rounded-xl font-mono text-sm text-white focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-500 hover:to-teal-400 text-slate-950 font-black rounded-xl text-sm shadow-lg shadow-teal-950/50 flex items-center justify-center gap-2 cursor-pointer transition-all transform active:scale-[0.99]"
                  >
                    <span>Login to Patient Portal</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>

                {/* Quick Demo Accounts Helper */}
                <div className="pt-4 border-t border-slate-800 space-y-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    ⚡ Quick Demo Patient Accounts (1-Click Login):
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {patientsList.slice(0, 4).map((patient) => (
                      <button
                        type="button"
                        key={patient.id}
                        onClick={() => handleQuickPatientSelect(patient)}
                        className="p-2.5 bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800 hover:border-teal-500/50 rounded-xl text-left transition-all cursor-pointer group"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-200 group-hover:text-teal-300 text-xs">
                            {patient.name}
                          </span>
                          <span className="font-mono text-[10px] bg-slate-800 text-teal-400 px-1.5 py-0.5 rounded">
                            {patient.id}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono mt-1">
                          <span>Phone: {patient.phone}</span>
                          <span className="text-slate-500">{patient.bloodGroup}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* 2. STAFF & ADMIN LOGIN FORM */}
            {/* ========================================================================= */}
            {authRoleTab === 'staff' && (
              <div className="space-y-5">
                <div className="space-y-1">
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    <Stethoscope className="w-4 h-4 text-purple-400" />
                    <span>Hospital Administration & Staff Portal</span>
                  </h2>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Sign in as Administrator, Doctor, Pathologist, or Billing Staff to access the ERP.
                  </p>
                </div>

                {staffError && (
                  <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <span>{staffError}</span>
                  </div>
                )}

                <form onSubmit={handleStaffLogin} className="space-y-4 text-xs">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                      Staff ID or Email *
                    </label>
                    <div className="relative">
                      <UserCheck className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        placeholder="e.g. STF-04 or admin@medpulse.bd"
                        value={staffIdOrEmail}
                        onChange={(e) => setStaffIdOrEmail(e.target.value)}
                        className="w-full pl-10 pr-3 py-2.5 bg-slate-950/60 border border-slate-700 rounded-xl font-mono text-sm text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                      Password *
                    </label>
                    <div className="relative">
                      <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Enter password (default: 123456)"
                        value={staffPassword}
                        onChange={(e) => setStaffPassword(e.target.value)}
                        className="w-full pl-10 pr-10 py-2.5 bg-slate-950/60 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black rounded-xl text-sm shadow-lg shadow-purple-950/50 flex items-center justify-center gap-2 cursor-pointer transition-all transform active:scale-[0.99]"
                  >
                    <span>Login to Staff ERP</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>

                {/* 1-Click Quick Staff Roles */}
                <div className="pt-4 border-t border-slate-800 space-y-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    ⚡ 1-Click Login by Staff Role:
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {staffList.map((st) => (
                      <button
                        type="button"
                        key={st.id}
                        onClick={() => handleQuickStaffSelect(st)}
                        className="p-2.5 bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800 hover:border-purple-500/50 rounded-xl text-left transition-all cursor-pointer group flex flex-col justify-between"
                      >
                        <div>
                          <span className="font-bold text-slate-200 group-hover:text-purple-300 text-xs line-clamp-1">
                            {st.name}
                          </span>
                          <span className="text-[10px] text-slate-400 block capitalize">
                            {st.role === 'admin'
                              ? '👑 Admin'
                              : st.role === 'doctor'
                              ? '🩺 Doctor'
                              : st.role === 'lab_technician'
                              ? '🔬 Pathologist'
                              : st.role === 'accountant'
                              ? '💳 Cashier'
                              : '💁 Receptionist'}
                          </span>
                        </div>
                        <span className="font-mono text-[9px] text-purple-400 font-bold mt-1">
                          {st.id}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer Notice */}
          <div className="p-4 bg-slate-950/70 border-t border-slate-800 text-center text-[11px] text-slate-500 flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-teal-500" />
            <span>Secure & Encrypted Hospital Information Management System (HIMS)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
