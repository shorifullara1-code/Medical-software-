import React, { useState } from 'react';
import { X, Database, Cloud, RefreshCw, CheckCircle2, AlertTriangle, ArrowUpRight, ArrowDownLeft, ShieldCheck, ExternalLink, HardDrive } from 'lucide-react';
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
