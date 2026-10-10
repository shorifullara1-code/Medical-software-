import React, { useState, useEffect } from 'react';
import {
  Activity,
  PlusCircle,
  Search,
  Printer,
  Edit2,
  Check,
  X,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileCheck,
  Sparkles,
  Layers,
  DollarSign,
  Scan,
  User,
  Filter,
  PackageCheck
} from 'lucide-react';
import { LabReport, LabTestCatalogItem, Patient, Staff, TestParameterResult, TestTemplate } from '../types';
import { STANDARD_TEST_TEMPLATES } from '../data/testTemplates';

interface LabReportCenterViewProps {
  labReports: LabReport[];
  testCatalog: LabTestCatalogItem[];
  patients: Patient[];
  staff: Staff[];
  onSaveReport: (report: LabReport) => void;
  onUpdateReport: (report: LabReport) => void;
  onUpdateTestCatalog: (catalog: LabTestCatalogItem[]) => void;
  onOpenPrint: (report: LabReport) => void;
  onOpenScanner: () => void;
  onNavigateToDelivery?: (patientId: string) => void;
  preselectedPatientId?: string | null;
  onClearPreselectedPatient?: () => void;
}

export const LabReportCenterView: React.FC<LabReportCenterViewProps> = ({
  labReports,
  testCatalog,
  patients,
  staff,
  onSaveReport,
  onUpdateReport,
  onUpdateTestCatalog,
  onOpenPrint,
  onOpenScanner,
  onNavigateToDelivery,
  preselectedPatientId,
  onClearPreselectedPatient,
}) => {
  // Main sub-navigation
  const [activeTab, setActiveTab] = useState<'pending' | 'completed' | 'pricing'>('completed');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals & Entry state
  const [isEntryModalOpen, setIsEntryModalOpen] = useState(Boolean(preselectedPatientId));
  const [completingPendingReport, setCompletingPendingReport] = useState<LabReport | null>(null);

  // Fee editing state
  const [editingTestId, setEditingTestId] = useState<string | null>(null);
  const [editingPrice, setEditingPrice] = useState<number>(0);
  const [isAddNewTestOpen, setIsAddNewTestOpen] = useState(false);
  const [newTestName, setNewTestName] = useState('');
  const [newTestCode, setNewTestCode] = useState('');
  const [newTestCategory, setNewTestCategory] = useState<LabTestCatalogItem['category']>('Biochemistry');
  const [newTestPrice, setNewTestPrice] = useState<number>(500);
  const [newTestSample, setNewTestSample] = useState('Serum');

  // Form State for Report Entry
  const [selectedPatientId, setSelectedPatientId] = useState<string>(preselectedPatientId || (patients[0]?.id ?? ''));

  useEffect(() => {
    if (preselectedPatientId) {
      setSelectedPatientId(preselectedPatientId);
      setIsEntryModalOpen(true);
    }
  }, [preselectedPatientId]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(STANDARD_TEST_TEMPLATES[0].id);
  const [referringDoctor, setReferringDoctor] = useState(
    staff.find((s) => s.role === 'doctor')?.name || 'Dr. Rafiqul Islam'
  );
  const [pathologistName, setPathologistName] = useState('Dr. Fahmida Sultana');
  const [pathologistDegree, setPathologistDegree] = useState('MBBS, M.Phil (Pathology)');

  // Parameters list being edited
  const [formParameters, setFormParameters] = useState<TestParameterResult[]>(() => {
    return STANDARD_TEST_TEMPLATES[0].parameters.map((p) => ({
      name: p.name,
      result: p.defaultVal || '',
      unit: p.unit,
      refRange: p.refRange,
      status: 'normal',
    }));
  });

  const [clinicalRemarks, setClinicalRemarks] = useState(STANDARD_TEST_TEMPLATES[0].defaultRemarks || '');
  const [radiologyFindings, setRadiologyFindings] = useState('');
  const [radiologyImpression, setRadiologyImpression] = useState('');

  // When template changes, load parameters
  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplateId(templateId);
    const tmpl = STANDARD_TEST_TEMPLATES.find((t) => t.id === templateId);
    if (!tmpl) return;

    setFormParameters(
      tmpl.parameters.map((p) => ({
        name: p.name,
        result: p.defaultVal || '',
        unit: p.unit,
        refRange: p.refRange,
        status: 'normal',
      }))
    );
    setClinicalRemarks(tmpl.defaultRemarks || '');
    if (tmpl.isRadiology) {
      setRadiologyFindings('Normal anatomical outlines. No focal space occupying lesions detected.');
      setRadiologyImpression('Normal study.');
    } else {
      setRadiologyFindings('');
      setRadiologyImpression('');
    }
  };

  // Auto flag status based on number vs range
  const handleParameterValueChange = (index: number, val: string) => {
    const tmpl = STANDARD_TEST_TEMPLATES.find((t) => t.id === selectedTemplateId);
    const tmplParam = tmpl?.parameters[index];

    let newStatus: 'normal' | 'low' | 'high' | 'abnormal' = 'normal';
    const num = parseFloat(val);

    if (tmplParam && !isNaN(num)) {
      if (tmplParam.minNormal !== undefined && num < tmplParam.minNormal) {
        newStatus = 'low';
      } else if (tmplParam.maxNormal !== undefined && num > tmplParam.maxNormal) {
        newStatus = 'high';
      }
    }

    const updated = [...formParameters];
    updated[index] = {
      ...updated[index],
      result: val,
      status: newStatus,
    };
    setFormParameters(updated);
  };

  // Open entry modal to complete a pending report
  const handleStartCompletingPending = (report: LabReport) => {
    setCompletingPendingReport(report);
    setSelectedPatientId(report.patientId);

    // Try finding matching template
    const matchedTmpl = STANDARD_TEST_TEMPLATES.find(
      (t) => t.code.toUpperCase() === report.testType.toUpperCase() || report.testName.includes(t.code)
    ) || STANDARD_TEST_TEMPLATES[0];

    handleTemplateChange(matchedTmpl.id);
    setIsEntryModalOpen(true);
  };

  // Open entry modal from scratch
  const handleOpenNewEntry = () => {
    setCompletingPendingReport(null);
    if (patients.length > 0 && !selectedPatientId) {
      setSelectedPatientId(patients[0].id);
    }
    handleTemplateChange(selectedTemplateId);
    setIsEntryModalOpen(true);
  };

  // Save report (as Completed or as Pending)
  const handleSaveReportSubmit = (status: 'completed' | 'pending') => {
    const patient = patients.find((p) => p.id === selectedPatientId);
    const tmpl = STANDARD_TEST_TEMPLATES.find((t) => t.id === selectedTemplateId) || STANDARD_TEST_TEMPLATES[0];

    if (!patient) {
      alert('Select patient.');
      return;
    }

    const now = new Date();
    const formattedDate = `${now.toISOString().split('T')[0]} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

    if (completingPendingReport) {
      // Update existing pending report
      const updatedReport: LabReport = {
        ...completingPendingReport,
        testType: tmpl.code,
        testName: tmpl.name,
        referredByDoctor: referringDoctor,
        reportedAt: formattedDate,
        pathologistName,
        pathologistDegree,
        status,
        parameters: formParameters,
        radiologyFindings: tmpl.isRadiology ? radiologyFindings : undefined,
        radiologyImpression: tmpl.isRadiology ? radiologyImpression : undefined,
        clinicalRemarks,
      };
      onUpdateReport(updatedReport);
      setIsEntryModalOpen(false);
      setCompletingPendingReport(null);
      if (status === 'completed') {
        onOpenPrint(updatedReport);
      }
    } else {
      // Create new report
      const newReportId = `LAB-${new Date().getFullYear()}-${500 + labReports.length + 1}`;
      const newReport: LabReport = {
        id: newReportId,
        patientId: patient.id,
        patientName: patient.name,
        patientAge: patient.age,
        patientGender: patient.gender,
        testType: tmpl.code,
        testName: tmpl.name,
        referredByDoctor: referringDoctor,
        sampleCollectedAt: formattedDate,
        reportedAt: status === 'completed' ? formattedDate : 'Pending (In Lab)',
        pathologistName,
        pathologistDegree,
        status,
        parameters: formParameters,
        radiologyFindings: tmpl.isRadiology ? radiologyFindings : undefined,
        radiologyImpression: tmpl.isRadiology ? radiologyImpression : undefined,
        clinicalRemarks,
      };

      onSaveReport(newReport);
      setIsEntryModalOpen(false);
      onClearPreselectedPatient?.();
      if (status === 'completed') {
        onOpenPrint(newReport);
      }
    }
  };

  // Pricing edit
  const handleStartEditPrice = (test: LabTestCatalogItem) => {
    setEditingTestId(test.id);
    setEditingPrice(test.price);
  };

  const handleSavePrice = (testId: string) => {
    const updated = testCatalog.map((t) => (t.id === testId ? { ...t, price: Number(editingPrice) } : t));
    onUpdateTestCatalog(updated);
    setEditingTestId(null);
  };

  const handleAddNewCatalogTest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTestName.trim() || !newTestCode.trim() || newTestPrice <= 0) return;

    const newTest: LabTestCatalogItem = {
      id: `TEST-${Date.now()}`,
      code: newTestCode.trim().toUpperCase(),
      name: newTestName.trim(),
      category: newTestCategory,
      price: Number(newTestPrice),
      sampleType: newTestSample,
      deliveryHours: 4,
      description: `${newTestName} Lab Test`,
    };

    onUpdateTestCatalog([...testCatalog, newTest]);
    setNewTestName('');
    setNewTestCode('');
    setNewTestPrice(500);
    setIsAddNewTestOpen(false);
  };

  const pendingReports = labReports.filter((r) => r.status === 'pending');
  const completedReports = labReports.filter((r) => r.status === 'completed');

  const filteredReports = (activeTab === 'pending' ? pendingReports : completedReports).filter((r) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      r.id.toLowerCase().includes(q) ||
      r.patientId.toLowerCase().includes(q) ||
      r.patientName.toLowerCase().includes(q) ||
      r.testName.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-4">
      {/* Top Navigation & Actions Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 flex flex-col sm:flex-row gap-3 items-center justify-between">
        {/* Sub-tab pills */}
        <div className="flex items-center gap-1.5 w-full sm:w-auto">
          <button
            onClick={() => setActiveTab('completed')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'completed'
                ? 'bg-sky-600 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <FileCheck className="w-3.5 h-3.5" />
            Ready Reports ({completedReports.length})
          </button>

          <button
            onClick={() => setActiveTab('pending')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'pending'
                ? 'bg-amber-600 text-white shadow-2xs'
                : 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            Pending Tests ({pendingReports.length})
          </button>

          <button
            onClick={() => setActiveTab('pricing')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'pricing'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" />
            Test Catalog & Pricing ({testCatalog.length})
          </button>
        </div>

        {/* Action Button */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button
            onClick={handleOpenNewEntry}
            className="px-3.5 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-2xs cursor-pointer whitespace-nowrap"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            Template & Result Entry
          </button>
        </div>
      </div>

      {/* SEARCH BAR (For reports) */}
      {activeTab !== 'pricing' && (
        <div className="bg-white p-3 rounded-xl border border-slate-200 flex items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Report ID, Patient Name or Test..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 rounded-lg border border-slate-200 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-sky-500"
            />
          </div>
          <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">
            Scan barcode to load report directly
          </span>
        </div>
      )}

      {/* TAB 1: COMPLETED REPORTS */}
      {activeTab === 'completed' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredReports.length === 0 ? (
            <div className="col-span-full py-12 text-center text-slate-400 bg-white rounded-xl border border-slate-200 text-xs">
              No ready lab reports found.
            </div>
          ) : (
            filteredReports.map((report) => (
              <div
                key={report.id}
                className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs hover:border-sky-300 transition-colors flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 text-xs">
                    <span className="font-mono font-bold text-sky-800 bg-sky-50 px-1.5 py-0.5 rounded border border-sky-200">
                      {report.id}
                    </span>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      Report Ready
                    </span>
                  </div>

                  <div className="mt-2.5">
                    <h4 className="font-bold text-slate-900 text-sm">{report.testName}</h4>
                    <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-600">
                      <span className="font-semibold text-slate-900">{report.patientName}</span>
                      <span className="font-mono text-[10px] text-slate-500 bg-slate-100 px-1.5 rounded">
                        {report.patientId}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">Referred: {report.referredByDoctor}</p>
                    <p className="text-[10px] text-slate-400 font-mono mt-0.5">Date: {report.reportedAt}</p>
                  </div>

                  {/* Parameter preview */}
                  {report.parameters && report.parameters.length > 0 && (
                    <div className="mt-2.5 p-2 bg-slate-50 rounded-lg text-xs space-y-1">
                      {report.parameters.slice(0, 3).map((p, idx) => (
                        <div key={idx} className="flex justify-between text-[11px]">
                          <span className="text-slate-600">{p.name}:</span>
                          <span className="font-mono font-bold text-slate-900">
                            {p.result} {p.unit}
                          </span>
                        </div>
                      ))}
                      {report.parameters.length > 3 && (
                        <p className="text-[10px] text-slate-400 text-right">
                          + {report.parameters.length - 3} more parameters
                        </p>
                      )}
                    </div>
                  )}

                  {report.cbcParameters && (
                    <div className="mt-2.5 p-2 bg-slate-50 rounded-lg text-xs grid grid-cols-3 gap-1 text-center font-mono">
                      <div>
                        <span className="text-[10px] text-slate-400 block">Hb</span>
                        <strong className="text-slate-900">{report.cbcParameters.hemoglobin.val}</strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">Platelets</span>
                        <strong className="text-slate-900">{report.cbcParameters.plateletCount.val.toLocaleString()}</strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">WBC</span>
                        <strong className="text-slate-900">{report.cbcParameters.totalWbc.val.toLocaleString()}</strong>
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 font-mono">Barcode Ready</span>
                  <div className="flex items-center gap-1.5">
                    {onNavigateToDelivery && (
                      <button
                        onClick={() => onNavigateToDelivery(report.patientId)}
                        className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-teal-300 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                        title="Check dues and deliver report at delivery counter"
                      >
                        <PackageCheck className="w-3.5 h-3.5" />
                        Delivery Counter
                      </button>
                    )}
                    <button
                      onClick={() => onOpenPrint(report)}
                      className="px-3 py-1 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-2xs transition-colors"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      Print Report
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 2: PENDING REPORTS */}
      {activeTab === 'pending' && (
        <div className="space-y-3">
          {filteredReports.length === 0 ? (
            <div className="py-12 bg-white rounded-xl border border-slate-200 text-center text-slate-400 text-xs">
              No pending tests. All reports have been processed.
            </div>
          ) : (
            filteredReports.map((report) => (
              <div
                key={report.id}
                className="bg-white rounded-xl border border-amber-200 p-4 shadow-2xs hover:border-amber-400 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                      {report.id}
                    </span>
                    <span className="font-bold text-slate-900 text-sm">{report.testName}</span>
                    <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded animate-pulse">
                      Pending (In Lab)
                    </span>
                  </div>

                  <div className="flex items-center gap-3 mt-1.5 text-slate-600">
                    <span className="font-bold text-slate-900">{report.patientName}</span>
                    <span className="font-mono text-[10px] text-slate-500 bg-slate-100 px-1.5 rounded">
                      {report.patientId}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Sample Collected: {report.sampleCollectedAt}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">{report.clinicalRemarks}</p>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <button
                    onClick={() => handleStartCompletingPending(report)}
                    className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-2xs cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    Result Entry & Publish
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 3: PRICING & CATALOG SETUP */}
      {activeTab === 'pricing' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-slate-200">
            <div>
              <h3 className="font-bold text-xs text-slate-800">Lab Test Catalog & Rates</h3>
              <p className="text-[11px] text-slate-400">Manage test pricing and add new diagnostic tests</p>
            </div>
            <button
              onClick={() => setIsAddNewTestOpen(!isAddNewTestOpen)}
              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              Add New Test
            </button>
          </div>

          {/* Add New Test Dropdown */}
          {isAddNewTestOpen && (
            <form onSubmit={handleAddNewCatalogTest} className="bg-slate-50 p-3.5 rounded-xl border border-slate-300 space-y-2 text-xs">
              <span className="font-bold text-slate-700 uppercase text-[10px]">New Test Details:</span>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                <input
                  type="text"
                  placeholder="Test Name (e.g. Serum Ferritin)"
                  value={newTestName}
                  onChange={(e) => setNewTestName(e.target.value)}
                  required
                  className="px-2.5 py-1.5 rounded border border-slate-300 bg-white"
                />
                <input
                  type="text"
                  placeholder="Code (e.g. FERRITIN)"
                  value={newTestCode}
                  onChange={(e) => setNewTestCode(e.target.value)}
                  required
                  className="px-2.5 py-1.5 rounded border border-slate-300 bg-white font-mono"
                />
                <select
                  value={newTestCategory}
                  onChange={(e) => setNewTestCategory(e.target.value as any)}
                  className="px-2.5 py-1.5 rounded border border-slate-300 bg-white"
                >
                  <option value="Biochemistry">Biochemistry</option>
                  <option value="Hematology">Hematology</option>
                  <option value="Clinical Pathology">Clinical Pathology</option>
                  <option value="Radiology">Radiology</option>
                  <option value="Microbiology">Microbiology</option>
                </select>
                <input
                  type="number"
                  placeholder="Standard Rate (BDT)"
                  value={newTestPrice}
                  onChange={(e) => setNewTestPrice(Number(e.target.value))}
                  required
                  className="px-2.5 py-1.5 rounded border border-slate-300 bg-white font-mono font-bold"
                />
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsAddNewTestOpen(false)}
                  className="px-2.5 py-1 rounded border border-slate-300 text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold"
                >
                  Save Test
                </button>
              </div>
            </form>
          )}

          {/* Pricing Table */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-700 uppercase font-bold text-[10px] border-b border-slate-200">
                <tr>
                  <th className="py-2 px-3">Code</th>
                  <th className="py-2 px-3">Test Name</th>
                  <th className="py-2 px-3">Category</th>
                  <th className="py-2 px-3">Sample Type</th>
                  <th className="py-2 px-3 text-right">Standard Rate (BDT)</th>
                  <th className="py-2 px-3 text-center w-16">Edit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {testCatalog.map((t) => {
                  const isEditing = editingTestId === t.id;
                  return (
                    <tr key={t.id} className="hover:bg-slate-50">
                      <td className="py-2 px-3 font-mono font-bold text-sky-800">{t.code}</td>
                      <td className="py-2 px-3 font-bold text-slate-900">{t.name}</td>
                      <td className="py-2 px-3 text-slate-500">{t.category}</td>
                      <td className="py-2 px-3 text-slate-500">{t.sampleType}</td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-emerald-700">
                        {isEditing ? (
                          <input
                            type="number"
                            value={editingPrice}
                            onChange={(e) => setEditingPrice(Number(e.target.value))}
                            className="w-20 px-1 py-0.5 border rounded text-right font-mono text-xs"
                            autoFocus
                          />
                        ) : (
                          <span>BDT {t.price.toLocaleString()}</span>
                        )}
                      </td>
                      <td className="py-2 px-3 text-center">
                        {isEditing ? (
                          <button
                            onClick={() => handleSavePrice(t.id)}
                            className="px-2 py-0.5 bg-emerald-600 text-white rounded text-[11px] font-bold"
                          >
                            Save
                          </button>
                        ) : (
                          <button
                            onClick={() => handleStartEditPrice(t)}
                            className="p-1 text-slate-400 hover:text-sky-600 rounded cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* FULL TEST TEMPLATE & RESULT ENTRY MODAL */}
      {isEntryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-4xl my-auto overflow-hidden">
            {/* Header */}
            <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm">
                  {completingPendingReport ? 'Pending Test Result Entry & Publish' : 'New Test Result & Template Entry'}
                </h3>
                <p className="text-[11px] text-slate-400">
                  Select test template for patient
                </p>
              </div>
              <button
                onClick={() => {
                  setIsEntryModalOpen(false);
                  setCompletingPendingReport(null);
                  onClearPreselectedPatient?.();
                }}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 max-h-[82vh] overflow-y-auto text-xs">
              {/* Patient & Template Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
                {/* Select Patient */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">
                    Select Patient *
                  </label>
                  <select
                    value={selectedPatientId}
                    onChange={(e) => setSelectedPatientId(e.target.value)}
                    required
                    className="w-full px-2.5 py-1.5 rounded border border-slate-300 bg-white font-medium"
                  >
                    <option value="">Select Patient...</option>
                    {patients.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} — {p.id} ({p.age} Yrs, {p.phone})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Select Test Template */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">
                    Select Test Template *
                  </label>
                  <select
                    value={selectedTemplateId}
                    onChange={(e) => handleTemplateChange(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded border border-slate-300 bg-white font-bold text-sky-900"
                  >
                    {STANDARD_TEST_TEMPLATES.map((tmpl) => (
                      <option key={tmpl.id} value={tmpl.id}>
                        {tmpl.name} ({tmpl.category})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">Referred Doctor</label>
                  <input
                    type="text"
                    value={referringDoctor}
                    onChange={(e) => setReferringDoctor(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded border border-slate-300 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">Approving Pathologist</label>
                  <input
                    type="text"
                    value={pathologistName}
                    onChange={(e) => setPathologistName(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded border border-slate-300 bg-white"
                  />
                </div>
              </div>

              {/* Template Parameters Form */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700 uppercase text-[10px]">
                    Test Parameters & Results:
                  </span>
                  <span className="text-[10px] text-slate-400">
                    Values outside reference range are automatically flagged HIGH or LOW
                  </span>
                </div>

                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-100 text-slate-700 text-[10px] uppercase font-bold">
                      <tr>
                        <th className="py-1.5 px-3">Parameter</th>
                        <th className="py-1.5 px-3 w-36">Result</th>
                        <th className="py-1.5 px-3 w-20">Unit</th>
                        <th className="py-1.5 px-3">Reference Range</th>
                        <th className="py-1.5 px-3 w-16 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {formParameters.map((param, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/60">
                          <td className="py-1.5 px-3 font-medium text-slate-800">{param.name}</td>
                          <td className="py-1 px-3">
                            <input
                              type="text"
                              value={param.result}
                              onChange={(e) => handleParameterValueChange(idx, e.target.value)}
                              className={`w-full px-2 py-1 rounded border text-xs font-mono font-bold ${
                                param.status === 'low' || param.status === 'high'
                                  ? 'border-rose-400 bg-rose-50 text-rose-700'
                                  : 'border-slate-300 bg-white text-slate-900'
                              }`}
                            />
                          </td>
                          <td className="py-1.5 px-3 font-mono text-slate-500">{param.unit || '-'}</td>
                          <td className="py-1.5 px-3 text-slate-500">{param.refRange}</td>
                          <td className="py-1.5 px-3 text-center">
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                param.status === 'low'
                                  ? 'bg-rose-100 text-rose-700'
                                  : param.status === 'high'
                                  ? 'bg-rose-100 text-rose-700'
                                  : 'bg-emerald-50 text-emerald-700'
                              }`}
                            >
                              {param.status === 'low' ? 'LOW' : param.status === 'high' ? 'HIGH' : 'NORMAL'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Radiology details if applicable */}
              {STANDARD_TEST_TEMPLATES.find((t) => t.id === selectedTemplateId)?.isRadiology && (
                <div className="space-y-2 bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">
                      Radiological Findings
                    </label>
                    <textarea
                      rows={2}
                      value={radiologyFindings}
                      onChange={(e) => setRadiologyFindings(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded border border-slate-300 bg-white text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">
                      Impression
                    </label>
                    <input
                      type="text"
                      value={radiologyImpression}
                      onChange={(e) => setRadiologyImpression(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded border border-slate-300 bg-white text-xs font-bold"
                    />
                  </div>
                </div>
              )}

              {/* Pathologist Remarks */}
              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">
                  Clinical Remarks
                </label>
                <input
                  type="text"
                  value={clinicalRemarks}
                  onChange={(e) => setClinicalRemarks(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded border border-slate-300 bg-white text-xs"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    setIsEntryModalOpen(false);
                    setCompletingPendingReport(null);
                    onClearPreselectedPatient?.();
                  }}
                  className="px-3 py-1.5 rounded border border-slate-300 text-slate-600 w-full sm:w-auto"
                >
                  Cancel
                </button>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <button
                    type="button"
                    onClick={() => handleSaveReportSubmit('pending')}
                    className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded font-bold cursor-pointer"
                  >
                    Save as Pending
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSaveReportSubmit('completed')}
                    className="px-4 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    Upload & Print Report
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
