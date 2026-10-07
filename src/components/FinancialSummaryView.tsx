import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  CreditCard,
  AlertTriangle,
  Calendar,
  DollarSign,
  PieChart,
  BarChart3,
  Download,
  Printer,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  Clock,
  Search,
  Users,
  Stethoscope,
  Activity,
  Pill,
  Bed,
  Sparkles,
  ChevronRight,
  ExternalLink,
  Receipt,
  FileText,
} from 'lucide-react';
import { Invoice, Patient, Staff, HospitalSettings, BillingItem, IPDAdmission, PharmacySale } from '../types';

interface FinancialSummaryViewProps {
  invoices: Invoice[];
  patients: Patient[];
  staff: Staff[];
  currentUser: Staff;
  hospitalSettings: HospitalSettings;
  admissions?: IPDAdmission[];
  pharmacySales?: PharmacySale[];
  onOpenInvoicePrint: (invoice: Invoice) => void;
  onQuickCollectDue: (invoice: Invoice) => void;
  onOpenFinancialReportPrint: (filteredInvoices: Invoice[], periodLabel: string) => void;
}

type PeriodFilter = 'today' | 'week' | 'month' | 'all' | 'custom';

export const FinancialSummaryView: React.FC<FinancialSummaryViewProps> = ({
  invoices,
  patients,
  staff,
  currentUser,
  hospitalSettings,
  admissions = [],
  pharmacySales = [],
  onOpenInvoicePrint,
  onQuickCollectDue,
  onOpenFinancialReportPrint,
}) => {
  const [period, setPeriod] = useState<PeriodFilter>('month');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [dueSearchQuery, setDueSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Reference Date for today in simulation / local date
  const todayStr = useMemo(() => {
    const dates = invoices.map((i) => i.date).filter(Boolean);
    if (dates.length > 0) {
      return dates.sort().reverse()[0];
    }
    return new Date().toISOString().slice(0, 10);
  }, [invoices]);

  const todayDate = new Date(todayStr);

  const isToday = (dStr: string) => dStr === todayStr;

  const isThisWeek = (dStr: string) => {
    const d = new Date(dStr);
    const diffTime = Math.abs(todayDate.getTime() - d.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 7;
  };

  const isThisMonth = (dStr: string) => {
    if (!dStr) return false;
    return dStr.slice(0, 7) === todayStr.slice(0, 7);
  };

  // Filtered Invoices according to period
  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      if (period === 'today') return isToday(inv.date);
      if (period === 'week') return isThisWeek(inv.date);
      if (period === 'month') return isThisMonth(inv.date);
      if (period === 'custom') {
        if (customStartDate && inv.date < customStartDate) return false;
        if (customEndDate && inv.date > customEndDate) return false;
        return true;
      }
      return true;
    });
  }, [invoices, period, todayStr, customStartDate, customEndDate]);

  const periodLabel = useMemo(() => {
    if (period === 'today') return `Today's Summary (${todayStr})`;
    if (period === 'week') return `This Week (Last 7 Days)`;
    if (period === 'month') return `This Month (${todayStr.slice(0, 7)})`;
    if (period === 'custom') return `Custom Range (${customStartDate || 'Start'} to ${customEndDate || 'End'})`;
    return 'All Time Summary';
  }, [period, todayStr, customStartDate, customEndDate]);

  // Executive Metric Calculations
  const stats = useMemo(() => {
    const totalBilled = filteredInvoices.reduce((sum, i) => sum + (i.subtotal || 0), 0);
    const totalDiscount = filteredInvoices.reduce((sum, i) => sum + (i.discount || 0), 0);
    const totalNet = filteredInvoices.reduce((sum, i) => sum + (i.total || 0), 0);

    const invoicePaid = filteredInvoices.reduce((sum, i) => sum + (i.paidAmount || 0), 0);
    const standaloneIPDAdvance = admissions.reduce((sum, adm) => {
      if (!adm.advancePayment || adm.advancePayment <= 0) return sum;
      const hasInvoice = filteredInvoices.some(
        (inv) =>
          inv.paymentHistory?.some((p) => p.receiptNo === `REC-ADV-${adm.id}`) ||
          (inv.patientId === adm.patientId && inv.items?.some((it) => it.name.includes('Advance Deposit') && it.name.includes(adm.bedNumber)))
      );
      return sum + (hasInvoice ? 0 : adm.advancePayment);
    }, 0);
    const pharmacyPaidTotal = pharmacySales.reduce((sum, s) => sum + (s.paidAmount || 0), 0);

    const totalPaid = invoicePaid + standaloneIPDAdvance + pharmacyPaidTotal;
    const totalDue = filteredInvoices.reduce((sum, i) => sum + (i.dueAmount || 0), 0);

    const todayInvoices = invoices.filter((i) => isToday(i.date));
    const todayRevenue = todayInvoices.reduce((sum, i) => sum + (i.paidAmount || 0), 0) + standaloneIPDAdvance + pharmacyPaidTotal;
    const todayDue = todayInvoices.reduce((sum, i) => sum + (i.dueAmount || 0), 0);

    const weekInvoices = invoices.filter((i) => isThisWeek(i.date));
    const weekRevenue = weekInvoices.reduce((sum, i) => sum + (i.paidAmount || 0), 0);
    const weekDue = weekInvoices.reduce((sum, i) => sum + (i.dueAmount || 0), 0);

    const monthInvoices = invoices.filter((i) => isThisMonth(i.date));
    const monthRevenue = monthInvoices.reduce((sum, i) => sum + (i.paidAmount || 0), 0);
    const monthDue = monthInvoices.reduce((sum, i) => sum + (i.dueAmount || 0), 0);

    const globalTotalDue = invoices.reduce((sum, i) => sum + (i.dueAmount || 0), 0);
    const globalDueCount = invoices.filter((i) => i.dueAmount > 0).length;

    const collectionRate = totalNet > 0 ? Math.round((totalPaid / totalNet) * 100) : 0;

    return {
      totalBilled,
      totalDiscount,
      totalNet,
      totalPaid,
      totalDue,
      todayRevenue,
      todayDue,
      todayCount: todayInvoices.length,
      weekRevenue,
      weekDue,
      weekCount: weekInvoices.length,
      monthRevenue,
      monthDue,
      monthCount: monthInvoices.length,
      globalTotalDue,
      globalDueCount,
      collectionRate,
      invoiceCount: filteredInvoices.length,
    };
  }, [filteredInvoices, invoices, todayStr]);

  // Category Breakdown
  const categoryData = useMemo(() => {
    const counts: Record<string, { total: number; count: number; items: Record<string, number> }> = {
      consultation: { total: 0, count: 0, items: {} },
      lab_test: { total: 0, count: 0, items: {} },
      medicine: { total: 0, count: 0, items: {} },
      service: { total: 0, count: 0, items: {} },
      bed: { total: 0, count: 0, items: {} },
    };

    filteredInvoices.forEach((inv) => {
      inv.items.forEach((item) => {
        const cat = item.category || 'service';
        if (!counts[cat]) {
          counts[cat] = { total: 0, count: 0, items: {} };
        }
        const itemVal = item.total || item.price * item.quantity;
        counts[cat].total += itemVal;
        counts[cat].count += item.quantity || 1;
        counts[cat].items[item.name] = (counts[cat].items[item.name] || 0) + itemVal;
      });
    });

    const totalSum = Object.values(counts).reduce((sum, c) => sum + c.total, 0) || 1;

    return Object.entries(counts).map(([key, data]) => ({
      key,
      label:
        key === 'consultation'
          ? 'Doctor Consultation Fees'
          : key === 'lab_test'
          ? 'Lab & Diagnostic Tests'
          : key === 'medicine'
          ? 'Pharmacy & Medications'
          : key === 'bed'
          ? 'Cabin & Bed Charges'
          : 'Nursing & Other Services',
      icon:
        key === 'consultation'
          ? Stethoscope
          : key === 'lab_test'
          ? Activity
          : key === 'medicine'
          ? Pill
          : key === 'bed'
          ? Bed
          : Sparkles,
      color:
        key === 'consultation'
          ? 'text-teal-600 bg-teal-50 border-teal-200'
          : key === 'lab_test'
          ? 'text-sky-600 bg-sky-50 border-sky-200'
          : key === 'medicine'
          ? 'text-amber-600 bg-amber-50 border-amber-200'
          : key === 'bed'
          ? 'text-purple-600 bg-purple-50 border-purple-200'
          : 'text-emerald-600 bg-emerald-50 border-emerald-200',
      barColor:
        key === 'consultation'
          ? 'bg-teal-500'
          : key === 'lab_test'
          ? 'bg-sky-500'
          : key === 'medicine'
          ? 'bg-amber-500'
          : key === 'bed'
          ? 'bg-purple-500'
          : 'bg-emerald-500',
      total: data.total,
      count: data.count,
      percentage: Math.round((data.total / totalSum) * 100),
      topItems: Object.entries(data.items)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3),
    }));
  }, [filteredInvoices]);

  // Payment Method Breakdown
  const paymentMethods = useMemo(() => {
    const methods: Record<string, number> = {
      Cash: 0,
      bKash: 0,
      Nagad: 0,
      Card: 0,
    };

    filteredInvoices.forEach((inv) => {
      inv.paymentHistory?.forEach((p) => {
        const m = p.method || 'Cash';
        methods[m] = (methods[m] || 0) + p.amount;
      });
    });

    const totalMethods = Object.values(methods).reduce((a, b) => a + b, 0) || 1;

    return Object.entries(methods).map(([method, amount]) => ({
      name: method,
      amount,
      percentage: Math.round((amount / totalMethods) * 100),
      color:
        method === 'Cash'
          ? 'bg-emerald-500'
          : method === 'bKash'
          ? 'bg-pink-600'
          : method === 'Nagad'
          ? 'bg-orange-500'
          : 'bg-indigo-600',
      textColor:
        method === 'Cash'
          ? 'text-emerald-700 bg-emerald-50'
          : method === 'bKash'
          ? 'text-pink-700 bg-pink-50'
          : method === 'Nagad'
          ? 'text-orange-700 bg-orange-50'
          : 'text-indigo-700 bg-indigo-50',
    }));
  }, [filteredInvoices]);

  // Outstanding Dues List with search
  const dueInvoices = useMemo(() => {
    return invoices
      .filter((inv) => inv.dueAmount > 0)
      .filter((inv) => {
        if (!dueSearchQuery) return true;
        const q = dueSearchQuery.toLowerCase();
        return (
          inv.patientName.toLowerCase().includes(q) ||
          inv.patientId.toLowerCase().includes(q) ||
          inv.id.toLowerCase().includes(q) ||
          inv.patientPhone.includes(q)
        );
      });
  }, [invoices, dueSearchQuery]);

  // Daily Trend Data (Last 7 dates in reverse)
  const dailyTrends = useMemo(() => {
    const map: Record<string, { date: string; revenue: number; due: number; count: number }> = {};
    invoices.forEach((inv) => {
      if (!map[inv.date]) {
        map[inv.date] = { date: inv.date, revenue: 0, due: 0, count: 0 };
      }
      map[inv.date].revenue += inv.paidAmount || 0;
      map[inv.date].due += inv.dueAmount || 0;
      map[inv.date].count += 1;
    });

    const sorted = Object.values(map).sort((a, b) => a.date.localeCompare(b.date));
    const maxRev = Math.max(...sorted.map((s) => s.revenue + s.due), 1000);

    return sorted.slice(-8).map((item) => ({
      ...item,
      revHeightPct: Math.round((item.revenue / maxRev) * 100),
      dueHeightPct: Math.round((item.due / maxRev) * 100),
    }));
  }, [invoices]);

  // Doctor Performance
  const doctorRevenues = useMemo(() => {
    const map: Record<string, { doctorName: string; total: number; count: number }> = {};
    filteredInvoices.forEach((inv) => {
      inv.items
        .filter((it) => it.category === 'consultation')
        .forEach((it) => {
          const doc = it.name.includes('(') ? it.name.split('(')[1].replace(')', '') : 'Specialist Doctor';
          if (!map[doc]) map[doc] = { doctorName: doc, total: 0, count: 0 };
          map[doc].total += it.total || it.price * it.quantity;
          map[doc].count += it.quantity || 1;
        });
    });
    return Object.values(map).sort((a, b) => b.total - a.total);
  }, [filteredInvoices]);

  return (
    <div className="space-y-6">
      {/* Top Banner & Date Filter Bar */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-2xl shadow-md border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30 flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5" />
              Financial Audit & Revenue Analytics
            </span>
            <span className="text-xs text-slate-400 font-mono">
              {hospitalSettings.name}
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
            Hospital Financial Summary Dashboard
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
            Daily, weekly and monthly income, outstanding dues, and breakdown across service categories (consultation, lab, pharmacy & services).
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            onClick={() => onOpenFinancialReportPrint(filteredInvoices, periodLabel)}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-emerald-600/20 transition-all cursor-pointer active:scale-95"
          >
            <Printer className="w-4 h-4" />
            <span>Print Official Financial Report (A4)</span>
          </button>
        </div>
      </div>

      {/* Period Selector Tabs & Custom Filter */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col lg:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl w-full lg:w-auto overflow-x-auto">
          <button
            type="button"
            onClick={() => setPeriod('today')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              period === 'today'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Today
          </button>
          <button
            type="button"
            onClick={() => setPeriod('week')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              period === 'week'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            This Week (7 Days)
          </button>
          <button
            type="button"
            onClick={() => setPeriod('month')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              period === 'month'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            This Month
          </button>
          <button
            type="button"
            onClick={() => setPeriod('all')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              period === 'all'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Time
          </button>
          <button
            type="button"
            onClick={() => setPeriod('custom')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              period === 'custom'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Custom Range
          </button>
        </div>

        {period === 'custom' && (
          <div className="flex items-center gap-2 w-full lg:w-auto animate-fadeIn">
            <div className="flex items-center gap-1 text-xs text-slate-600">
              <span className="font-semibold">From:</span>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-mono"
              />
            </div>
            <div className="flex items-center gap-1 text-xs text-slate-600">
              <span className="font-semibold">To:</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-mono"
              />
            </div>
          </div>
        )}

        <div className="text-xs font-medium text-slate-500 font-mono flex items-center gap-2">
          <span>Active Filter:</span>
          <span className="font-bold text-slate-900 px-2.5 py-1 bg-teal-50 text-teal-800 rounded-lg border border-teal-200">
            {periodLabel}
          </span>
        </div>
      </div>

      {/* 4 Primary KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Revenue Paid */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Collected Revenue (Paid)
            </span>
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-slate-900 font-mono tracking-tight">
              ${stats.totalPaid.toLocaleString()}
            </div>
            <div className="flex items-center gap-1.5 mt-1.5 text-xs text-emerald-700 font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Collection Rate: {stats.collectionRate}%</span>
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Total Invoices: {stats.invoiceCount}</span>
            <span className="text-slate-700 font-semibold">Gross: ${stats.totalBilled.toLocaleString()}</span>
          </div>
        </div>

        {/* Card 2: Total Outstanding Dues */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Outstanding Dues
            </span>
            <div className="p-2.5 rounded-xl bg-rose-50 text-rose-600">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-rose-600 font-mono tracking-tight">
              ${stats.totalDue.toLocaleString()}
            </div>
            <div className="flex items-center gap-1.5 mt-1.5 text-xs text-rose-700 font-semibold">
              <span>All-Time Pending Dues: ${stats.globalTotalDue.toLocaleString()}</span>
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span className="text-rose-600 font-bold">{stats.globalDueCount} Patients with Dues</span>
            <span className="text-slate-400">Action Required</span>
          </div>
        </div>

        {/* Card 3: Total Discounts Offered */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Discounts Provided
            </span>
            <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600">
              <Receipt className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-slate-900 font-mono tracking-tight">
              ${stats.totalDiscount.toLocaleString()}
            </div>
            <div className="flex items-center gap-1.5 mt-1.5 text-xs text-slate-600 font-medium">
              <span>Net Bill Value: ${stats.totalNet.toLocaleString()}</span>
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Hospital Discount Policy</span>
            <span className="font-semibold text-teal-700">Transparent</span>
          </div>
        </div>

        {/* Card 4: Daily vs Weekly vs Monthly Quick Summary */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Today's Collection
            </span>
            <div className="p-2.5 rounded-xl bg-sky-50 text-sky-600">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-sky-900 font-mono tracking-tight">
              ${stats.todayRevenue.toLocaleString()}
            </div>
            <div className="flex items-center gap-1.5 mt-1.5 text-xs text-sky-700 font-semibold">
              <span>Today's Dues: ${stats.todayDue.toLocaleString()}</span>
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Invoices Today: {stats.todayCount}</span>
            <span className="text-emerald-700 font-bold">Active Desk</span>
          </div>
        </div>
      </div>

      {/* Revenue Periods Comparison Matrix: Daily, Weekly, Monthly */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Daily Block */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-teal-500 to-teal-700 text-white shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-teal-100">
                Daily Revenue
              </span>
              <h3 className="text-2xl font-black font-mono mt-1">
                ${stats.todayRevenue.toLocaleString()}
              </h3>
            </div>
            <div className="p-3 bg-white/15 rounded-xl backdrop-blur-xs">
              <Calendar className="w-6 h-6 text-white" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-teal-400/40 flex items-center justify-between text-xs text-teal-50">
            <span>Today's Dues: ${stats.todayDue.toLocaleString()}</span>
            <span className="font-bold">{stats.todayCount} Receipts</span>
          </div>
        </div>

        {/* Weekly Block */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-600 to-indigo-800 text-white shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-100">
                Weekly Revenue (7 Days)
              </span>
              <h3 className="text-2xl font-black font-mono mt-1">
                ${stats.weekRevenue.toLocaleString()}
              </h3>
            </div>
            <div className="p-3 bg-white/15 rounded-xl backdrop-blur-xs">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-indigo-400/40 flex items-center justify-between text-xs text-indigo-50">
            <span>Weekly Dues: ${stats.weekDue.toLocaleString()}</span>
            <span className="font-bold">{stats.weekCount} Receipts</span>
          </div>
        </div>

        {/* Monthly Block */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-purple-700 to-slate-900 text-white shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-purple-200">
                Monthly Revenue ({todayStr.slice(0, 7)})
              </span>
              <h3 className="text-2xl font-black font-mono mt-1">
                ${stats.monthRevenue.toLocaleString()}
              </h3>
            </div>
            <div className="p-3 bg-white/15 rounded-xl backdrop-blur-xs">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-purple-400/40 flex items-center justify-between text-xs text-purple-100">
            <span>Monthly Dues: ${stats.monthDue.toLocaleString()}</span>
            <span className="font-bold">{stats.monthCount} Receipts</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Service Category Breakdown & Payment Channels */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Income by Service Category */}
        <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <PieChart className="w-5 h-5 text-teal-600" />
                Income by Service Category
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Selected Period: <strong className="text-slate-800">{periodLabel}</strong>
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-teal-800 bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-200">
              Total: ${stats.totalBilled.toLocaleString()}
            </span>
          </div>

          {/* Category Cards */}
          <div className="space-y-4">
            {categoryData.map((cat) => {
              const Icon = cat.icon;
              return (
                <div
                  key={cat.key}
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-xl border ${cat.color}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">{cat.label}</h4>
                        <span className="text-[11px] text-slate-500">
                          {cat.count} items / services billed
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-black text-slate-900 font-mono">
                        ${cat.total.toLocaleString()}
                      </div>
                      <span className="text-[11px] font-bold text-slate-500">
                        {cat.percentage}% share
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${cat.barColor} transition-all duration-500 rounded-full`}
                      style={{ width: `${Math.max(cat.percentage, 2)}%` }}
                    />
                  </div>

                  {/* Top Items */}
                  {cat.topItems.length > 0 && (
                    <div className="pt-1 flex flex-wrap items-center gap-1.5 text-[10px] text-slate-500">
                      <span className="font-semibold text-slate-600">Top Services:</span>
                      {cat.topItems.map(([iName, iVal], idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700 font-medium"
                        >
                          {iName.slice(0, 24)}... (${iVal.toLocaleString()})
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Doctor Consultation Performance */}
          {doctorRevenues.length > 0 && (
            <div className="pt-4 border-t border-slate-200 space-y-3">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <Stethoscope className="w-4 h-4 text-teal-600" />
                Doctor Consultation Revenue
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {doctorRevenues.map((doc, i) => (
                  <div
                    key={i}
                    className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between"
                  >
                    <div>
                      <p className="text-xs font-bold text-slate-800">{doc.doctorName}</p>
                      <span className="text-[10px] text-slate-500">{doc.count} consultations</span>
                    </div>
                    <span className="text-xs font-mono font-bold text-teal-700">
                      ${doc.total.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Payment Channels & Daily Revenue Trends */}
        <div className="lg:col-span-5 space-y-6">
          {/* Payment Methods */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-purple-600" />
                Payment Channels Breakdown
              </h3>
              <span className="text-xs text-slate-500 font-medium">Collected via</span>
            </div>

            <div className="space-y-3">
              {paymentMethods.map((m) => (
                <div key={m.name} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-slate-800 flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${m.color}`} />
                      {m.name === 'Cash'
                        ? 'Cash'
                        : m.name === 'bKash'
                        ? 'bKash Mobile'
                        : m.name === 'Nagad'
                        ? 'Nagad Mobile'
                        : 'Debit/Credit Card'}
                    </span>
                    <span className="font-mono font-bold text-slate-900">
                      ${m.amount.toLocaleString()} ({m.percentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${m.color} rounded-full transition-all duration-500`}
                      style={{ width: `${m.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Daily Trend Visual Chart */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-teal-600" />
                  Daily Revenue & Due Trends
                </h3>
                <p className="text-[11px] text-slate-500">Collected vs Outstanding over recent days</p>
              </div>
              <div className="flex items-center gap-3 text-[10px] font-bold">
                <span className="flex items-center gap-1 text-teal-700">
                  <span className="w-2 h-2 rounded-full bg-teal-500" />
                  Collected
                </span>
                <span className="flex items-center gap-1 text-rose-700">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  Due
                </span>
              </div>
            </div>

            {/* Visual Bar Chart */}
            <div className="pt-4 flex items-end justify-between gap-2 h-44 border-b border-slate-200 px-2">
              {dailyTrends.map((d, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1 h-full justify-end group relative">
                  <div className="absolute -top-12 bg-slate-900 text-white text-[10px] px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10 shadow-lg">
                    <div>Collected: ${d.revenue.toLocaleString()}</div>
                    <div>Due: ${d.due.toLocaleString()}</div>
                  </div>

                  <div className="w-full max-w-[28px] flex items-end gap-0.5 h-full justify-center">
                    <div
                      className="w-1/2 bg-teal-500 hover:bg-teal-400 rounded-t-sm transition-all"
                      style={{ height: `${Math.max(d.revHeightPct, 4)}%` }}
                      title={`Collected: $${d.revenue}`}
                    />
                    <div
                      className="w-1/2 bg-rose-500 hover:bg-rose-400 rounded-t-sm transition-all"
                      style={{ height: `${Math.max(d.dueHeightPct, 2)}%` }}
                      title={`Due: $${d.due}`}
                    />
                  </div>

                  <span className="text-[9px] font-mono text-slate-500 truncate w-full text-center">
                    {d.date.slice(5)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Outstanding Dues Management Section */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-600" />
              Outstanding Dues Recovery Tracker
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Total Outstanding: <strong className="text-rose-600 font-mono">${stats.globalTotalDue.toLocaleString()}</strong> ({dueInvoices.length} patients with active dues)
            </p>
          </div>

          {/* Search Dues */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={dueSearchQuery}
              onChange={(e) => setDueSearchQuery(e.target.value)}
              placeholder="Search by name, phone or ID..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-500"
            />
          </div>
        </div>

        {/* Due Invoices Table */}
        {dueInvoices.length === 0 ? (
          <div className="py-8 text-center text-slate-400 space-y-1">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
            <p className="text-xs font-semibold text-slate-600">No outstanding dues found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                  <th className="p-3">Invoice ID</th>
                  <th className="p-3">Patient Name & Phone</th>
                  <th className="p-3">Date</th>
                  <th className="p-3 text-right">Total Bill</th>
                  <th className="p-3 text-right">Paid Amount</th>
                  <th className="p-3 text-right text-rose-600">Due Amount</th>
                  <th className="p-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {dueInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3 font-mono font-bold text-slate-900">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                        {inv.id}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="font-bold text-slate-900">{inv.patientName}</div>
                      <div className="text-[11px] font-mono text-slate-500">
                        ID: {inv.patientId} • {inv.patientPhone}
                      </div>
                    </td>
                    <td className="p-3 font-mono text-slate-600">{inv.date}</td>
                    <td className="p-3 text-right font-mono font-semibold text-slate-900">
                      ${inv.total.toLocaleString()}
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-emerald-700">
                      ${inv.paidAmount.toLocaleString()}
                    </td>
                    <td className="p-3 text-right font-mono font-black text-rose-600 text-sm">
                      ${inv.dueAmount.toLocaleString()}
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => onQuickCollectDue(inv)}
                          className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-xs transition-colors cursor-pointer"
                          title="Collect Due Amount"
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                          <span>Collect</span>
                        </button>
                        <button
                          onClick={() => onOpenInvoicePrint(inv)}
                          className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                          title="Print Receipt"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
