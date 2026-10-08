import React, { useState } from 'react';
import { X, Database, Cloud, RefreshCw, CheckCircle2, AlertTriangle, ArrowUpRight, ArrowDownLeft, ShieldCheck, ExternalLink, HardDrive, Code, Copy, Check } from 'lucide-react';
import { SUPABASE_URL, SUPABASE_PROJECT_ID, SUPABASE_PROJECT_NAME, testSupabaseConnection } from '../lib/supabase';
import { pushAllToSupabase, pullAllFromSupabase } from '../utils/supabaseSync';

interface SupabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDataRestored?: () => void;
}

export const SupabaseModal: React.FC<SupabaseModalProps> = ({
  isOpen,
  onClose,
  onDataRestored,
}) => {
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [connectionState, setConnectionState] = useState<'connected' | 'idle' | 'error'>('connected');
  const [showSqlScript, setShowSqlScript] = useState<boolean>(false);
  const [copiedSql, setCopiedSql] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleTestPing = async () => {
    setIsProcessing(true);
    setStatusMessage('Pinging Supabase database...');
    const result = await testSupabaseConnection();
    setIsProcessing(false);
    setStatusMessage(result.message);
    setConnectionState(result.connected ? 'connected' : 'error');
  };

  const handlePushData = async () => {
    setIsProcessing(true);
    setStatusMessage('Synchronizing hospital records to Supabase Cloud Database...');
    const result = await pushAllToSupabase();
    setIsProcessing(false);
    setStatusMessage(result.message);
    setConnectionState(result.success ? 'connected' : 'error');
  };

  const handlePullData = async () => {
    if (!confirm('This will replace local hospital data with the backup stored in Supabase. Continue?')) return;
    setIsProcessing(true);
    setStatusMessage('Restoring hospital records from Supabase Cloud Database...');
    const result = await pullAllFromSupabase();
    setIsProcessing(false);
    setStatusMessage(result.message);
    if (result.success) {
      setConnectionState('connected');
      if (onDataRestored) {
        setTimeout(() => {
          onDataRestored();
        }, 1200);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/80 backdrop-blur-sm overflow-y-auto animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-300 w-full max-w-2xl my-auto overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 text-white flex items-center justify-between border-b border-emerald-800/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Database className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg text-white flex items-center gap-2">
                <span>Supabase Database Connected</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-500 text-slate-950 uppercase tracking-wider">
                  Live
                </span>
              </h3>
              <p className="text-[11px] text-emerald-200/80 font-medium">
                Cloud Postgres Database integration for MediFlow Hospital ERP
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5 text-xs text-slate-800">
          {/* Supabase Information Card */}
          <div className="p-4 bg-slate-900 text-white rounded-2xl border border-slate-800 space-y-3 shadow-md">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <Cloud className="w-3.5 h-3.5 text-emerald-400" />
                <span>Supabase Project Metadata</span>
              </span>

              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-800/80 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                <span>Status: Connected</span>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono text-[11px]">
              <div>
                <span className="text-[10px] text-slate-400 font-sans block uppercase font-bold">Project Name</span>
                <span className="text-white font-bold text-xs">{SUPABASE_PROJECT_NAME}</span>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 font-sans block uppercase font-bold">Project Reference ID</span>
                <span className="text-emerald-300 font-bold text-xs">{SUPABASE_PROJECT_ID}</span>
              </div>

              <div className="sm:col-span-2">
                <span className="text-[10px] text-slate-400 font-sans block uppercase font-bold">Database Endpoint URL</span>
                <a
                  href={SUPABASE_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="text-teal-300 hover:underline flex items-center gap-1 font-bold text-xs truncate"
                >
                  <span>{SUPABASE_URL}</span>
                  <ExternalLink className="w-3 h-3 text-teal-400 shrink-0" />
                </a>
              </div>
            </div>
          </div>

          {/* Sync Status Banner */}
          {statusMessage && (
            <div
              className={`p-3.5 rounded-2xl border text-xs font-semibold flex items-center gap-2.5 ${
                connectionState === 'connected'
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                  : connectionState === 'error'
                  ? 'bg-rose-50 border-rose-300 text-rose-950'
                  : 'bg-slate-50 border-slate-300 text-slate-900'
              }`}
            >
              {connectionState === 'connected' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{statusMessage}</span>
            </div>
          )}

          {/* Cloud Synchronization Actions */}
          <div className="space-y-3">
            <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <HardDrive className="w-4 h-4 text-teal-700" />
              <span>Cloud Synchronization Actions (ডেটাবেজ সিঙ্ক)</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Push Local Data to Supabase */}
              <button
                type="button"
                disabled={isProcessing}
                onClick={handlePushData}
                className="p-4 bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-300 text-emerald-950 rounded-2xl text-left transition-all cursor-pointer flex flex-col justify-between space-y-2 group disabled:opacity-50"
              >
                <div className="flex items-center justify-between">
                  <div className="p-2 rounded-xl bg-emerald-600 text-white font-bold">
                    <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                  <span className="text-[10px] font-bold bg-emerald-200/80 text-emerald-950 px-2 py-0.5 rounded-md">
                    Local ➔ Supabase
                  </span>
                </div>

                <div>
                  <h5 className="font-bold text-xs text-emerald-950">Push Local Data to Supabase</h5>
                  <p className="text-[11px] text-emerald-800 mt-0.5">
                    Syncs Patients, IPD Admissions, Invoices, Pharmacy Stock & Settings to Supabase Cloud.
                  </p>
                </div>
              </button>

              {/* Pull Data from Supabase */}
              <button
                type="button"
                disabled={isProcessing}
                onClick={handlePullData}
                className="p-4 bg-slate-50 hover:bg-slate-100 border border-slate-300 text-slate-900 rounded-2xl text-left transition-all cursor-pointer flex flex-col justify-between space-y-2 group disabled:opacity-50"
              >
                <div className="flex items-center justify-between">
                  <div className="p-2 rounded-xl bg-slate-800 text-white font-bold">
                    <ArrowDownLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                  </div>
                  <span className="text-[10px] font-bold bg-slate-200 text-slate-800 px-2 py-0.5 rounded-md">
                    Supabase ➔ Local
                  </span>
                </div>

                <div>
                  <h5 className="font-bold text-xs text-slate-900">Restore Data from Supabase</h5>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    Restores full hospital database backup from Supabase Cloud Database.
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* Support SQL Script Section */}
          <div className="p-4 bg-indigo-50/70 border border-indigo-200 rounded-2xl space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Code className="w-4 h-4 text-indigo-700" />
                <span className="font-bold text-xs text-indigo-950">Database SQL Code for Support & Supabase Editor</span>
              </div>
              <button
                type="button"
                onClick={() => setShowSqlScript(!showSqlScript)}
                className="text-xs font-bold text-indigo-700 hover:text-indigo-900 bg-white px-2.5 py-1 rounded-lg border border-indigo-200 cursor-pointer shadow-2xs"
              >
                {showSqlScript ? 'Hide SQL Code' : 'View / Copy SQL Code'}
              </button>
            </div>

            {showSqlScript && (
              <div className="space-y-2 animate-fadeIn pt-1">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] text-indigo-900">
                    Run in Supabase <strong>SQL Editor</strong> or provide to technical support:
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      const text = `-- MediFlow Hospital ERP - Staff & Roles Database SQL Script
CREATE TABLE IF NOT EXISTS public.staff (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    department VARCHAR(100),
    phone VARCHAR(50),
    email VARCHAR(100),
    shift VARCHAR(50),
    status VARCHAR(30) DEFAULT 'active',
    qualification TEXT,
    bmdc_reg VARCHAR(100),
    consultation_fee NUMERIC(12,2) DEFAULT 0,
    room_no VARCHAR(50),
    specialization VARCHAR(255),
    avatar TEXT,
    password VARCHAR(255) DEFAULT '123456',
    allowed_tabs JSONB DEFAULT '["dashboard"]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE IF EXISTS public.staff ADD COLUMN IF NOT EXISTS password VARCHAR(255) DEFAULT '123456';
ALTER TABLE IF EXISTS public.staff ADD COLUMN IF NOT EXISTS allowed_tabs JSONB DEFAULT '["dashboard"]'::jsonb;
ALTER TABLE IF EXISTS public.staff ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access staff" ON public.staff;
CREATE POLICY "Allow all access staff" ON public.staff FOR ALL USING (true) WITH CHECK (true);

INSERT INTO public.staff (id, name, role, department, phone, email, shift, password, allowed_tabs)
VALUES 
  ('STF-04', 'Hospital Administrator', 'admin', 'Hospital Management & Operations', '01811-000000', 'admin@medpulse.bd', 'Morning (8:00 AM - 2:00 PM)', 'admin123', '["dashboard","patients","opd","ipd","pharmacy","billing","finance","prescriptions","lab","delivery","appointments","staff","settings"]'::jsonb),
  ('STF-01', 'Dr. Rafiqul Islam', 'doctor', 'Internal Medicine Department', '01711-234567', 'dr.rafiq@medpulse.bd', 'Morning (8:00 AM - 2:00 PM)', '123456', '["dashboard","opd","prescriptions","patients","lab","appointments"]'::jsonb),
  ('STF-05', 'Farzana Akter', 'receptionist', 'Patient Registration & Front Desk', '01912-345678', 'farzana@medpulse.bd', 'Morning (8:00 AM - 2:00 PM)', '123456', '["dashboard","patients","appointments","opd","ipd"]'::jsonb)
ON CONFLICT (id) DO UPDATE SET password = EXCLUDED.password, allowed_tabs = EXCLUDED.allowed_tabs, updated_at = NOW();`;
                      navigator.clipboard.writeText(text);
                      setCopiedSql(true);
                      setTimeout(() => setCopiedSql(false), 3000);
                    }}
                    className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                  >
                    {copiedSql ? (
                      <>
                        <Check className="w-3 h-3" />
                        <span>কপি হয়েছে ✓</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy SQL</span>
                      </>
                    )}
                  </button>
                </div>
                <pre className="p-3 bg-slate-950 text-emerald-400 rounded-xl font-mono text-[10px] overflow-x-auto max-h-48 border border-slate-800">
{`CREATE TABLE IF NOT EXISTS public.staff (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    phone VARCHAR(50),
    email VARCHAR(100),
    password VARCHAR(255) DEFAULT '123456',
    allowed_tabs JSONB DEFAULT '["dashboard"]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE IF EXISTS public.staff ADD COLUMN IF NOT EXISTS password VARCHAR(255) DEFAULT '123456';
ALTER TABLE IF EXISTS public.staff ADD COLUMN IF NOT EXISTS allowed_tabs JSONB DEFAULT '["dashboard"]'::jsonb;
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access staff" ON public.staff FOR ALL USING (true) WITH CHECK (true);`}
                </pre>
              </div>
            )}
          </div>

          {/* Security & Reliability Box */}
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex items-start gap-2.5 text-[11px] text-slate-600">
            <ShieldCheck className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
            <div>
              <strong className="block text-slate-900 font-bold">Automatic Cloud Backup Enabled:</strong>
              <span>
                All new patients, IPD bed admissions, pharmacy sales, and invoice money receipts created in MediFlow are stored safely with Supabase real-time persistence.
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            disabled={isProcessing}
            onClick={handleTestPing}
            className="px-3.5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isProcessing ? 'animate-spin' : ''}`} />
            <span>Test Connection Ping</span>
          </button>

          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
