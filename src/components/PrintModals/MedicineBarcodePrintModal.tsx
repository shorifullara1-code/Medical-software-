import React, { useState } from 'react';
import { X, Printer, Download, Pill, Tag, Layers, CheckCircle2 } from 'lucide-react';
import { PharmacyMedicine, HospitalSettings } from '../../types';
import { BarcodeRenderer } from '../BarcodeRenderer';
import { HospitalEmblem } from '../HospitalEmblem';
import { loadHospitalSettings } from '../../utils/storage';

interface MedicineBarcodePrintModalProps {
  medicine: PharmacyMedicine | null;
  onClose: () => void;
  hospitalSettings?: HospitalSettings;
}

export const MedicineBarcodePrintModal: React.FC<MedicineBarcodePrintModalProps> = ({
  medicine,
  onClose,
  hospitalSettings: propSettings,
}) => {
  const [labelCount, setLabelQuantity] = useState<number>(24);
  const [layoutColumns, setLayoutColumns] = useState<2 | 3 | 4>(3);

  if (!medicine) return null;

  const hospitalSettings = propSettings || loadHospitalSettings();

  const handlePrint = () => {
    window.print();
  };

  const barcodeValue = medicine.code || medicine.id;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-300 w-full max-w-4xl my-auto overflow-hidden animate-fadeIn">
        {/* Top Controls Header Bar */}
        <div className="no-print px-6 py-4 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-teal-500/20 text-teal-300 border border-teal-500/30">
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg text-white flex items-center gap-2">
                <span>Medicine Price & Barcode Sticker Generator</span>
                <span className="font-mono text-xs text-teal-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                  {medicine.code}
                </span>
              </h3>
              <p className="text-[11px] text-slate-400 font-medium">
                Print price and scannable barcode stickers for medicine box / strip packaging
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-teal-500/20 transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <Printer className="w-4 h-4" />
              <span>Print {labelCount} Stickers</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Configuration Bar */}
        <div className="no-print px-6 py-3.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="font-bold text-slate-700">Sticker Quantity to Print:</label>
              <select
                value={labelCount}
                onChange={(e) => setLabelQuantity(Number(e.target.value) || 12)}
                className="px-3 py-1.5 bg-white border border-slate-300 rounded-xl font-bold font-mono text-slate-900"
              >
                <option value={6}>6 Stickers</option>
                <option value={12}>12 Stickers</option>
                <option value={24}>24 Stickers (1 A4 Sheet)</option>
                <option value={48}>48 Stickers (2 Sheets)</option>
                <option value={96}>96 Stickers</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label className="font-bold text-slate-700">Columns Layout:</label>
              <div className="flex items-center bg-white p-0.5 rounded-xl border border-slate-300">
                <button
                  type="button"
                  onClick={() => setLayoutColumns(2)}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                    layoutColumns === 2 ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  2 Columns
                </button>
                <button
                  type="button"
                  onClick={() => setLayoutColumns(3)}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                    layoutColumns === 3 ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  3 Columns (Standard)
                </button>
                <button
                  type="button"
                  onClick={() => setLayoutColumns(4)}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                    layoutColumns === 4 ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  4 Columns (Dense)
                </button>
              </div>
            </div>
          </div>

          <div className="text-[11px] text-slate-500 font-semibold flex items-center gap-1.5">
            <Pill className="w-4 h-4 text-teal-600" />
            <span>Medicine: <strong>{medicine.name}</strong> • Price: <strong>BDT {medicine.unitPrice}</strong></span>
          </div>
        </div>

        {/* Printable Area - Grid of Medicine Barcode Price Labels */}
        <div className="printable-area p-6 sm:p-8 bg-slate-100 max-h-[65vh] overflow-y-auto">
          <div
            className={`grid gap-3 ${
              layoutColumns === 2
                ? 'grid-cols-2'
                : layoutColumns === 3
                ? 'grid-cols-2 sm:grid-cols-3'
                : 'grid-cols-2 sm:grid-cols-4'
            }`}
          >
            {Array.from({ length: labelCount }).map((_, index) => (
              <div
                key={index}
                className="bg-white rounded-xl border-2 border-slate-900 p-2.5 flex flex-col justify-between shadow-2xs text-slate-900 relative overflow-hidden break-inside-avoid min-h-[140px]"
              >
                {/* Header */}
                <div className="text-center border-b border-slate-200 pb-1 mb-1">
                  <span className="font-bold text-[9px] uppercase tracking-wider block text-slate-500 truncate">
                    {hospitalSettings.name} PHARMACY
                  </span>
                  <h4 className="font-black text-xs text-slate-900 leading-tight truncate">
                    {medicine.name}
                  </h4>
                  <p className="text-[9px] font-semibold text-teal-800 truncate">
                    {medicine.genericName}
                  </p>
                </div>

                {/* Details & Price Box */}
                <div className="flex items-center justify-between gap-1 my-1 px-1">
                  <div className="text-[9px] text-slate-600 space-y-0.5">
                    <p className="font-mono">
                      <strong>Batch:</strong> {medicine.batchNo}
                    </p>
                    <p className="font-mono">
                      <strong>Exp:</strong> {medicine.expiryDate}
                    </p>
                    {medicine.rackLocation && (
                      <p className="text-slate-500 font-semibold">Rack: {medicine.rackLocation}</p>
                    )}
                  </div>

                  <div className="bg-slate-900 text-white px-2 py-1 rounded-lg text-right">
                    <span className="text-[8px] uppercase tracking-wider text-teal-300 block font-bold leading-none">
                      MRP / Unit
                    </span>
                    <span className="font-mono font-black text-xs text-white leading-none block mt-0.5">
                      BDT {medicine.unitPrice.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Scannable Barcode SVG */}
                <div className="text-center border-t border-slate-200 pt-1 flex justify-center">
                  <BarcodeRenderer
                    value={barcodeValue}
                    height={28}
                    width={1.2}
                    fontSize={9}
                    textMargin={1}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Printable Page Footer */}
          <div className="mt-4 pt-2 border-t border-slate-300 flex items-center justify-between text-[9px] text-slate-500 font-medium">
            <span>Hospital Pharmacy Dispensary • Scannable Barcode Labels</span>
            <span className="font-bold text-slate-800 tracking-wide">Software By : Shoriful Islam</span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="no-print p-4 bg-white border-t border-slate-200 flex items-center justify-between">
          <span className="text-xs text-slate-500 font-semibold">
            Ready to print on sticker sheets or thermal roll printer.
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
            >
              Close
            </button>
            <button
              onClick={handlePrint}
              className="px-5 py-2 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-md cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print Stickers Now</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
