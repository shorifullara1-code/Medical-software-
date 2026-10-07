import React, { useState } from 'react';
import {
  Activity,
  PlusCircle,
  Search,
  Printer,
  DollarSign,
  Edit2,
  Check,
  X,
  Scan,
  Compass,
  MapPin,
  Building,
  Layers,
  Save,
  Clock,
  Sparkles,
  HelpCircle,
} from 'lucide-react';
import { LabReport, LabTestCatalogItem, Patient, Staff } from '../types';

interface LabManagementViewProps {
  labReports: LabReport[];
  testCatalog: LabTestCatalogItem[];
  patients: Patient[];
  staff: Staff[];
  onSaveReport: (report: LabReport) => void;
  onUpdateTestCatalog: (catalog: LabTestCatalogItem[]) => void;
  onOpenPrint: (report: LabReport) => void;
  onOpenScanner: () => void;
  preselectedPatientId?: string | null;
  onClearPreselectedPatient?: () => void;
}

export const LabManagementView: React.FC<LabManagementViewProps> = ({
  labReports,
  testCatalog,
  patients,
  staff,
  onSaveReport,
  onUpdateTestCatalog,
  onOpenPrint,
  onOpenScanner,
  preselectedPatientId,
  onClearPreselectedPatient,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'reports' | 'pricing' | 'rooms'>('reports');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(Boolean(preselectedPatientId));

  // Edit Test Modal / State
  const [editingTest, setEditingTest] = useState<LabTestCatalogItem | null>(null);
  const [isAddTestModalOpen, setIsAddTestModalOpen] = useState(false);

  // New Test Form State
  const [newTestCode, setNewTestCode] = useState('');
  const [newTestName, setNewTestName] = useState('');
  const [newTestCategory, setNewTestCategory] = useState<LabTestCatalogItem['category']>('Hematology');
  const [newTestPrice, setNewTestPrice] = useState<number>(500);
  const [newTestRoomNo, setNewTestRoomNo] = useState('102');
  const [newTestFloor, setNewTestFloor] = useState('1st Floor');
  const [newTestRoomLocation, setNewTestRoomLocation] = useState('Room 102 (1st Floor, Pathology Lab)');
  const [newTestSampleType, setNewTestSampleType] = useState('Blood / Serum');
  const [newTestDeliveryHours, setNewTestDeliveryHours] = useState<number>(4);
  const [newTestDescription, setNewTestDescription] = useState('');

  // New CBC Report Form State
  const [selectedPatientId, setSelectedPatientId] = useState<string>(preselectedPatientId || (patients[0]?.id ?? ''));
  const [referringDoctorName, setReferringDoctorName] = useState<string>(
    staff.find((s) => s.role === 'doctor')?.name || 'Dr. Rafiqul Islam'
  );
  const [pathologistName, setPathologistName] = useState('Dr. Fahmida Sultana');
  const [pathologistDegree, setPathologistDegree] = useState('MBBS, M.Phil (Pathology)');

  // CBC Parameters
  const [hb, setHb] = useState(13.5);
  const [esr, setEsr] = useState(15);
  const [wbc, setWbc] = useState(7500);
  const [neutro, setNeutro] = useState(65);
  const [lympho, setLympho] = useState(28);
  const [mono, setMono] = useState(4);
  const [eosino, setEosino] = useState(3);
  const [baso, setBaso] = useState(0);
  const [platelets, setPlatelets] = useState(250000);
  const [rbc, setRbc] = useState(4.6);
  const [pcv, setPcv] = useState(41.0);
  const [mcv, setMcv] = useState(86.0);
  const [mch, setMch] = useState(29.0);
  const [mchc, setMchc] = useState(33.5);
  const [remarks, setRemarks] = useState('Red blood cells are normocytic and normochromic.');

  const handleStartEditTest = (test: LabTestCatalogItem) => {
    setEditingTest({ ...test });
  };

  const handleSaveEditTest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTest) return;

    const locationText =
      editingTest.roomLocation?.trim() ||
      `Room ${editingTest.roomNo || '102'} (${editingTest.floor || '1st Floor'})`;

    const updated = testCatalog.map((t) =>
      t.id === editingTest.id
        ? {
            ...editingTest,
            price: Number(editingTest.price),
            roomNo: editingTest.roomNo?.trim() || '102',
            floor: editingTest.floor?.trim() || '1st Floor',
            roomLocation: locationText,
          }
        : t
    );
    onUpdateTestCatalog(updated);
    setEditingTest(null);
  };

  const handleAddNewTestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTestName.trim() || !newTestCode.trim()) return;

    const newTest: LabTestCatalogItem = {
      id: `TEST-${Date.now().toString().slice(-4)}`,
      code: newTestCode.toUpperCase().trim(),
      name: newTestName.trim(),
      category: newTestCategory,
      price: Number(newTestPrice) || 0,
      roomNo: newTestRoomNo.trim() || '102',
      floor: newTestFloor.trim() || '1st Floor',
      roomLocation:
        newTestRoomLocation.trim() ||
        `Room ${newTestRoomNo.trim() || '102'} (${newTestFloor.trim() || '1st Floor'})`,
      sampleType: newTestSampleType.trim() || 'Sample',
      deliveryHours: Number(newTestDeliveryHours) || 4,
      description: newTestDescription.trim(),
    };

    onUpdateTestCatalog([...testCatalog, newTest]);
    setIsAddTestModalOpen(false);
    // Reset inputs
    setNewTestCode('');
    setNewTestName('');
    setNewTestPrice(500);
    setNewTestDescription('');
  };

  const checkStatus = (val: number, min: number, max: number): 'normal' | 'low' | 'high' => {
    if (val < min) return 'low';
    if (val > max) return 'high';
    return 'normal';
  };

  const handleSubmitReport = (e: React.FormEvent) => {
    e.preventDefault();
    const patient = patients.find((p) => p.id === selectedPatientId);
    if (!patient) return;

    const newLabId = `LAB-${new Date().getFullYear()}-${500 + labReports.length + 1}`;
    const now = new Date();
    const formattedDate = `${now.toISOString().split('T')[0]} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

    const newReport: LabReport = {
      id: newLabId,
      patientId: patient.id,
      patientName: patient.name,
      patientAge: patient.age,
      patientGender: patient.gender,
      testType: 'CBC',
      testName: 'Complete Blood Count (CBC) with ESR',
      referredByDoctor: referringDoctorName,
      sampleCollectedAt: formattedDate,
      reportedAt: formattedDate,
      pathologistName,
      pathologistDegree,
      status: 'completed',
      cbcParameters: {
        hemoglobin: { val: Number(hb), unit: 'g/dL', refRange: '12.0 - 17.5', status: checkStatus(hb, 12, 17.5) },
        esr: { val: Number(esr), unit: 'mm/1st hr', refRange: '0 - 20', status: checkStatus(esr, 0, 20) },
        totalWbc: { val: Number(wbc), unit: '/cu.mm', refRange: '4,000 - 11,000', status: checkStatus(wbc, 4000, 11000) },
        neutrophils: { val: Number(neutro), unit: '%', refRange: '40 - 75', status: checkStatus(neutro, 40, 75) },
        lymphocytes: { val: Number(lympho), unit: '%', refRange: '20 - 45', status: checkStatus(lympho, 20, 45) },
        monocytes: { val: Number(mono), unit: '%', refRange: '2 - 10', status: checkStatus(mono, 2, 10) },
        eosinophils: { val: Number(eosino), unit: '%', refRange: '1 - 6', status: checkStatus(eosino, 1, 6) },
        basophils: { val: Number(baso), unit: '%', refRange: '0 - 1', status: checkStatus(baso, 0, 1) },
        plateletCount: { val: Number(platelets), unit: '/cu.mm', refRange: '150,000 - 450,000', status: checkStatus(platelets, 150000, 450000) },
        rbcCount: { val: Number(rbc), unit: 'mil/cu.mm', refRange: '4.0 - 5.9', status: checkStatus(rbc, 4.0, 5.9) },
        pcvHematocrit: { val: Number(pcv), unit: '%', refRange: '36 - 52', status: checkStatus(pcv, 36, 52) },
        mcv: { val: Number(mcv), unit: 'fL', refRange: '80.0 - 96.0', status: checkStatus(mcv, 80, 96) },
        mch: { val: Number(mch), unit: 'pg', refRange: '27.0 - 33.0', status: checkStatus(mch, 27, 33) },
        mchc: { val: Number(mchc), unit: 'g/dL', refRange: '32.0 - 36.0', status: checkStatus(mchc, 32, 36) },
      },
      clinicalRemarks: remarks,
    };

    onSaveReport(newReport);
    setIsCreateModalOpen(false);
    onClearPreselectedPatient?.();
    onOpenPrint(newReport);
  };

  const filteredReports = labReports.filter((r) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      r.id.toLowerCase().includes(q) ||
      r.patientId.toLowerCase().includes(q) ||
      r.patientName.toLowerCase().includes(q)
    );
  });

  const filteredCatalog = testCatalog.filter((t) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      t.code.toLowerCase().includes(q) ||
      t.name.toLowerCase().includes(q) ||
      t.category.toLowerCase().includes(q) ||
      (t.roomNo && t.roomNo.toLowerCase().includes(q)) ||
      (t.roomLocation && t.roomLocation.toLowerCase().includes(q))
    );
  });

  // Group tests by room number for Room Directory View
  const roomGroups = testCatalog.reduce((acc, item) => {
    const rKey = item.roomNo || 'Others';
    if (!acc[rKey]) {
      acc[rKey] = {
        roomNo: rKey,
        floor: item.floor || '1st Floor',
        location: item.roomLocation || `Room ${rKey}`,
        tests: [],
      };
    }
    acc[rKey].tests.push(item);
    return acc;
  }, {} as Record<string, { roomNo: string; floor: string; location: string; tests: LabTestCatalogItem[] }>);

  return (
    <div className="space-y-4">
      {/* Sub Tabs Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-2">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveSubTab('reports')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'reports'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Lab Reports ({labReports.length})</span>
          </button>
          <button
            onClick={() => setActiveSubTab('pricing')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'pricing'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" />
            <span>Catalog & Room Setup ({testCatalog.length})</span>
          </button>
          <button
            onClick={() => setActiveSubTab('rooms')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'rooms'
                ? 'bg-teal-700 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>🧭 Test Room Directory ({Object.keys(roomGroups).length} Rooms)</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          {activeSubTab === 'pricing' && (
            <button
              onClick={() => setIsAddTestModalOpen(true)}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-2xs cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              Add New Test & Room
            </button>
          )}

          {activeSubTab === 'reports' && (
            <button
              onClick={() => {
                if (patients.length > 0 && !selectedPatientId) {
                  setSelectedPatientId(patients[0].id);
                }
                setIsCreateModalOpen(true);
              }}
              className="px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-2xs cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              New CBC Report
            </button>
          )}
        </div>
      </div>

      {/* Search Filter Bar */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 flex items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={
              activeSubTab === 'pricing' || activeSubTab === 'rooms'
                ? 'Search test name, code or room no (102, 204...)'
                : 'Report ID (LAB-...), patient name or ID...'
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-sky-500"
          />
        </div>
        <span className="text-[11px] text-slate-500 font-medium hidden sm:inline">
          {activeSubTab === 'reports'
            ? `Showing: ${filteredReports.length} Reports`
            : `Showing: ${filteredCatalog.length} Tests`}
        </span>
      </div>

      {/* TAB 1: REPORTS */}
      {activeSubTab === 'reports' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredReports.length === 0 ? (
            <div className="col-span-full py-12 text-center text-slate-400 bg-white rounded-xl border border-slate-200 text-xs">
              No lab reports found.
            </div>
          ) : (
            filteredReports.map((report) => (
              <div
                key={report.id}
                className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs hover:border-sky-300 transition-colors flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 text-xs">
                    <span className="font-mono font-bold text-sky-800">{report.id}</span>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                      Result Ready ✓
                    </span>
                  </div>

                  <div className="mt-2.5">
                    <h4 className="font-bold text-slate-900 text-sm">{report.testName}</h4>
                    <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-600">
                      <span className="font-semibold text-slate-900">{report.patientName}</span>
                      <span className="font-mono text-[10px] text-slate-500 bg-slate-100 px-1 rounded">
                        {report.patientId}
                      </span>
                    </div>
                  </div>

                  {report.cbcParameters && (
                    <div className="mt-2.5 p-2 bg-slate-50 rounded text-xs grid grid-cols-3 gap-2 text-center font-mono">
                      <div>
                        <span className="text-[10px] text-slate-500 block">Hb</span>
                        <strong className="text-slate-900">{report.cbcParameters.hemoglobin.val}</strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block">Platelets</span>
                        <strong className="text-slate-900">
                          {report.cbcParameters.plateletCount.val.toLocaleString()}
                        </strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block">WBC</span>
                        <strong className="text-slate-900">
                          {report.cbcParameters.totalWbc.val.toLocaleString()}
                        </strong>
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-100 flex justify-end">
                  <button
                    onClick={() => onOpenPrint(report)}
                    className="px-3 py-1 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    Print Report
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 2: PRICING & ROOM NUMBER SETUP */}
      {activeSubTab === 'pricing' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
          <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-teal-700" />
              <span className="text-xs font-bold text-slate-800">
                Test Price List & Room Configuration
              </span>
            </div>
            <span className="text-[10px] text-slate-500">
              * Room numbers saved here automatically display on billing receipts.
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-100 text-slate-700 uppercase font-bold text-[10px] border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3 w-20">Code</th>
                  <th className="py-2.5 px-3">Test Name & Sample</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3 text-left">Allocated Room & Location</th>
                  <th className="py-2.5 px-3 text-right">Fee (BDT)</th>
                  <th className="py-2.5 px-3 text-center w-24">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCatalog.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 px-3 font-mono font-bold text-sky-800">{t.code}</td>
                    <td className="py-2.5 px-3">
                      <div className="font-bold text-slate-900">{t.name}</div>
                      <div className="text-[10px] text-slate-500">
                        {t.sampleType} • Delivery: {t.deliveryHours} Hours
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-slate-600">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-[10px] font-medium">
                        {t.category}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-teal-50 border border-teal-200 text-teal-950 font-semibold text-xs">
                        <MapPin className="w-3.5 h-3.5 text-teal-700 shrink-0" />
                        <span>Room No {t.roomNo || '102'}</span>
                        <span className="text-[10px] text-teal-700 font-normal">({t.floor || '1st Floor'})</span>
                      </div>
                      {t.roomLocation && (
                        <div className="text-[10px] text-slate-500 mt-0.5 pl-1">{t.roomLocation}</div>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-700 text-sm">
                      BDT {t.price.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <button
                        onClick={() => handleStartEditTest(t)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-sky-50 text-slate-700 hover:text-sky-700 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-colors mx-auto cursor-pointer border border-slate-200"
                      >
                        <Edit2 className="w-3 h-3" />
                        <span>Edit</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: ROOM DIRECTORY VIEW */}
      {activeSubTab === 'rooms' && (
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-teal-900 via-teal-800 to-slate-900 text-white rounded-2xl p-5 shadow-lg flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="text-base font-bold flex items-center gap-2">
                <Compass className="w-5 h-5 text-teal-400" />
                <span>Hospital Diagnostic Room Directory Guide</span>
              </h3>
              <p className="text-xs text-teal-200/90 leading-relaxed">
                Organized room guide for all diagnostic and pathology procedures. Automatically printed on patient receipts.
              </p>
            </div>
            <div className="text-right">
              <span className="text-2xl font-black text-teal-300 font-mono">
                {Object.keys(roomGroups).length}
              </span>
              <span className="text-xs text-slate-300 block">Active Test Rooms</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.values(roomGroups).map((grp) => (
              <div
                key={grp.roomNo}
                className="bg-white rounded-xl border border-teal-200/80 shadow-2xs overflow-hidden flex flex-col justify-between"
              >
                <div>
                  {/* Room Header */}
                  <div className="p-3.5 bg-teal-50 border-b border-teal-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-teal-600 text-white font-black flex items-center justify-center text-xs shadow-xs">
                        {grp.roomNo}
                      </div>
                      <div>
                        <h4 className="font-bold text-xs text-teal-950">Room No: {grp.roomNo}</h4>
                        <p className="text-[10px] text-teal-700 font-medium">{grp.floor}</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-teal-800 bg-white px-2 py-0.5 rounded-full border border-teal-200">
                      {grp.tests.length} Tests
                    </span>
                  </div>

                  {/* Test List inside Room */}
                  <div className="p-3.5 space-y-2">
                    <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mb-1">
                      Tests conducted in this room:
                    </p>
                    <ul className="space-y-1.5">
                      {grp.tests.map((t) => (
                        <li
                          key={t.id}
                          className="text-xs flex items-center justify-between gap-2 p-1.5 rounded-md hover:bg-slate-50 border border-slate-100"
                        >
                          <div className="flex items-center gap-2 truncate">
                            <span className="w-2 h-2 rounded-full bg-teal-500 shrink-0"></span>
                            <span className="font-semibold text-slate-800 truncate text-[11px]">{t.name}</span>
                          </div>
                          <span className="font-mono text-[10px] font-bold text-emerald-700 shrink-0">
                            BDT {t.price}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="p-2.5 bg-slate-50 border-t border-slate-100 text-[10px] text-slate-500 flex items-center justify-between">
                  <span className="truncate">{grp.location}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* EDIT TEST & ROOM MODAL */}
      {editingTest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg my-auto overflow-hidden">
            <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-teal-400" />
                <h3 className="font-bold text-sm">Edit Test Fee & Room Allocation</h3>
              </div>
              <button
                onClick={() => setEditingTest(null)}
                className="p-1 text-slate-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEditTest} className="p-5 space-y-4 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-[10px] font-bold text-slate-500 uppercase">Selected Test:</span>
                <h4 className="font-bold text-sm text-slate-900 mt-0.5">{editingTest.name}</h4>
                <p className="text-xs text-sky-700 font-mono font-bold mt-0.5">Code: {editingTest.code}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">
                    Test Fee (BDT) *
                  </label>
                  <input
                    type="number"
                    required
                    value={editingTest.price}
                    onChange={(e) =>
                      setEditingTest({ ...editingTest, price: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono font-bold text-sm text-emerald-800"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">
                    Allocated Room Number *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 102 or 204"
                    value={editingTest.roomNo || ''}
                    onChange={(e) =>
                      setEditingTest({ ...editingTest, roomNo: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-teal-300 bg-teal-50/50 font-bold text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">
                    Floor
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 1st Floor, 2nd Floor"
                    value={editingTest.floor || ''}
                    onChange={(e) =>
                      setEditingTest({ ...editingTest, floor: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">
                    Delivery Time (Hours)
                  </label>
                  <input
                    type="number"
                    value={editingTest.deliveryHours || 4}
                    onChange={(e) =>
                      setEditingTest({ ...editingTest, deliveryHours: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">
                  Full Room Location & Guide
                </label>
                <input
                  type="text"
                  placeholder="e.g. Room 102 (1st Floor, Hematology Lab)"
                  value={editingTest.roomLocation || ''}
                  onChange={(e) =>
                    setEditingTest({ ...editingTest, roomLocation: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-slate-300"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  * This location will automatically be printed on the patient money receipt.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setEditingTest(null)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-bold flex items-center gap-1.5 shadow-md cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD NEW TEST & ROOM MODAL */}
      {isAddTestModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg my-auto overflow-hidden">
            <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <PlusCircle className="w-4 h-4 text-emerald-400" />
                <h3 className="font-bold text-sm">Add New Test & Room Allocation</h3>
              </div>
              <button
                onClick={() => setIsAddTestModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddNewTestSubmit} className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">
                    Test Code *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. CBC, FBS"
                    value={newTestCode}
                    onChange={(e) => setNewTestCode(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono uppercase font-bold"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">
                    Test Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Serum Calcium with Ionized Ca"
                    value={newTestName}
                    onChange={(e) => setNewTestName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">
                    Category *
                  </label>
                  <select
                    value={newTestCategory}
                    onChange={(e) => setNewTestCategory(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
                  >
                    <option value="Hematology">Hematology</option>
                    <option value="Biochemistry">Biochemistry</option>
                    <option value="Clinical Pathology">Clinical Pathology</option>
                    <option value="Radiology">Radiology</option>
                    <option value="Cardiology">Cardiology</option>
                    <option value="Microbiology">Microbiology</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">
                    Test Fee (BDT) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={newTestPrice}
                    onChange={(e) => setNewTestPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono font-bold text-emerald-700"
                  />
                </div>
              </div>

              {/* Room Setup Box */}
              <div className="bg-teal-50/70 p-3.5 rounded-xl border border-teal-200 space-y-3">
                <span className="text-[10px] font-bold text-teal-900 uppercase flex items-center gap-1.5">
                  <Compass className="w-3.5 h-3.5 text-teal-700" />
                  Room Allocation Details
                </span>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">
                      Room Number *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 102, 204"
                      value={newTestRoomNo}
                      onChange={(e) => setNewTestRoomNo(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg border border-teal-300 bg-white font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">
                      Floor
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 1st Floor, 2nd Floor"
                      value={newTestFloor}
                      onChange={(e) => setNewTestFloor(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg border border-teal-300 bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">
                    Room Location & Guide
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Room 102 (1st Floor, Pathology Lab)"
                    value={newTestRoomLocation}
                    onChange={(e) => setNewTestRoomLocation(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-teal-300 bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">
                    Sample Type
                  </label>
                  <input
                    type="text"
                    value={newTestSampleType}
                    onChange={(e) => setNewTestSampleType(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">
                    Delivery Time (Hours)
                  </label>
                  <input
                    type="number"
                    value={newTestDeliveryHours}
                    onChange={(e) => setNewTestDeliveryHours(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsAddTestModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold flex items-center gap-1.5 shadow-md cursor-pointer"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  Add Test
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE CBC REPORT MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-3xl my-auto overflow-hidden">
            <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm">Create New CBC Test Report</h3>
              <button
                onClick={() => {
                  setIsCreateModalOpen(false);
                  onClearPreselectedPatient?.();
                }}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitReport} className="p-5 space-y-4 max-h-[82vh] overflow-y-auto text-xs">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
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
                        {p.name} — {p.id}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">Referred Doctor</label>
                  <input
                    type="text"
                    value={referringDoctorName}
                    onChange={(e) => setReferringDoctorName(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded border border-slate-300 bg-white"
                  />
                </div>
              </div>

              {/* CBC Parameters Input */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 bg-white p-3 rounded-lg border border-slate-200">
                <div>
                  <label className="block text-[9px] font-bold text-slate-500 uppercase">Hb (g/dL)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={hb}
                    onChange={(e) => setHb(Number(e.target.value))}
                    className="w-full px-2 py-1 rounded border border-slate-300 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-slate-500 uppercase">ESR (mm/1st hr)</label>
                  <input
                    type="number"
                    value={esr}
                    onChange={(e) => setEsr(Number(e.target.value))}
                    className="w-full px-2 py-1 rounded border border-slate-300 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-slate-500 uppercase">WBC (/cu.mm)</label>
                  <input
                    type="number"
                    value={wbc}
                    onChange={(e) => setWbc(Number(e.target.value))}
                    className="w-full px-2 py-1 rounded border border-slate-300 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-slate-500 uppercase">Platelets (/cu.mm)</label>
                  <input
                    type="number"
                    value={platelets}
                    onChange={(e) => setPlatelets(Number(e.target.value))}
                    className="w-full px-2 py-1 rounded border border-slate-300 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-slate-500 uppercase">Neutrophils (%)</label>
                  <input
                    type="number"
                    value={neutro}
                    onChange={(e) => setNeutro(Number(e.target.value))}
                    className="w-full px-2 py-1 rounded border border-slate-300 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-slate-500 uppercase">Lymphocytes (%)</label>
                  <input
                    type="number"
                    value={lympho}
                    onChange={(e) => setLympho(Number(e.target.value))}
                    className="w-full px-2 py-1 rounded border border-slate-300 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-slate-500 uppercase">Total RBC</label>
                  <input
                    type="number"
                    step="0.1"
                    value={rbc}
                    onChange={(e) => setRbc(Number(e.target.value))}
                    className="w-full px-2 py-1 rounded border border-slate-300 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-slate-500 uppercase">PCV (%)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={pcv}
                    onChange={(e) => setPcv(Number(e.target.value))}
                    className="w-full px-2 py-1 rounded border border-slate-300 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">Remarks</label>
                <input
                  type="text"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded border border-slate-300"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-3 py-1.5 rounded border border-slate-300 text-slate-600 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded font-bold cursor-pointer"
                >
                  Create & Print Report
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
