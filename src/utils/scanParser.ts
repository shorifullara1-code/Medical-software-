import { Patient, Invoice, Prescription, LabReport, IPDAdmission, PharmacyMedicine } from '../types';

export interface ScanMatchResult {
  type: 'patient' | 'medicine' | 'invoice' | 'prescription' | 'lab' | 'admission' | 'unknown';
  patient?: Patient;
  medicine?: PharmacyMedicine;
  invoice?: Invoice;
  prescription?: Prescription;
  labReport?: LabReport;
  admission?: IPDAdmission;
  extractedCode: string;
  rawInput: string;
  message: string;
}

/**
 * Audio Beep Sound Generator using Web Audio API
 */
export function playScanBeep(success: boolean = true) {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(success ? 880 : 300, ctx.currentTime); // A5 for success, low for fail
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.2);
  } catch (err) {
    // Audio context may be restricted by browser policy
  }
}

/**
 * Universal Scanned Text Extractor
 * Parses URLs, JSON, ID patterns, and raw text with high tolerance
 */
export function parseScannedRawText(rawText: string): string[] {
  if (!rawText) return [];
  // Strip control chars, scanner carriage returns, quotes, square brackets
  const cleanRaw = rawText.replace(/[\r\n\t\x00-\x1F\x7F-\x9F]/g, ' ').trim();
  const candidates: string[] = [cleanRaw];

  // If text contains colon like "PATIENT ID: P-2026-001" or "INVOICE REF: INV-2026-1001"
  if (cleanRaw.includes(':')) {
    const parts = cleanRaw.split(':');
    parts.forEach((part) => {
      const p = part.trim();
      if (p.length >= 2) candidates.push(p);
    });
  }

  // 1. Try parsing JSON if input is JSON format
  if (cleanRaw.startsWith('{') && cleanRaw.endsWith('}')) {
    try {
      const parsed = JSON.parse(cleanRaw);
      if (parsed.id) candidates.push(String(parsed.id));
      if (parsed.patientId) candidates.push(String(parsed.patientId));
      if (parsed.code) candidates.push(String(parsed.code));
      if (parsed.barcode) candidates.push(String(parsed.barcode));
      if (parsed.invoiceId) candidates.push(String(parsed.invoiceId));
      if (parsed.rxId) candidates.push(String(parsed.rxId));
      if (parsed.admissionId) candidates.push(String(parsed.admissionId));
    } catch (e) {
      // Ignore
    }
  }

  // 2. Try parsing URL query parameters
  if (cleanRaw.includes('://') || cleanRaw.includes('?') || cleanRaw.includes('=')) {
    try {
      const urlStr = cleanRaw.includes('://') ? cleanRaw : `http://localhost/${cleanRaw}`;
      const url = new URL(urlStr);
      const params = url.searchParams;
      ['id', 'patientId', 'patient', 'code', 'barcode', 'inv', 'rx', 'admission'].forEach((paramKey) => {
        const val = params.get(paramKey);
        if (val) candidates.push(val);
      });
      // Path trailing part
      const pathParts = url.pathname.split('/').filter(Boolean);
      if (pathParts.length > 0) {
        candidates.push(pathParts[pathParts.length - 1]);
      }
    } catch (e) {
      // Ignore
    }
  }

  // 3. Regex extraction for flexible standard hospital prefixes
  const regexPatterns = [
    /P(?:AT)?-[A-Z0-9-]+/gi,             // Patient ID e.g. P-2026-001, PAT-2026-001, P-001
    /INV-[A-Z0-9-]+/gi,                 // Invoice ID e.g. INV-2026-1001, INV-583921, INV-DIS-123456, INV-ADV-123456
    /PH-INV-[A-Z0-9-]+/gi,              // Pharmacy Invoice e.g. PH-INV-1001
    /RX-[A-Z0-9-]+/gi,                  // Prescription ID e.g. RX-2026-001, RX-PAD-2026-001
    /LAB-[A-Z0-9-]+/gi,                 // Lab Report ID e.g. LAB-2026-1001
    /IPD-[A-Z0-9-]+/gi,                 // Inpatient Admission ID e.g. IPD-2026-001
    /APT-[A-Z0-9-]+/gi,                 // Appointment ID e.g. APT-2026-001
    /MED-[A-Z0-9-]+/gi,                 // Medicine ID e.g. MED-101
    /(?:\+?88)?01[3-9]\d{8}/g,          // BD Phone numbers e.g. 01712345678
  ];

  regexPatterns.forEach((pattern) => {
    const matches = cleanRaw.match(pattern);
    if (matches) {
      matches.forEach((m) => candidates.push(m.trim()));
    }
  });

  // Extract separate whitespace or dash-separated tokens
  cleanRaw.split(/[\s,;|]+/).forEach((token) => {
    const tk = token.trim();
    if (tk.length >= 3 && /^[A-Za-z0-9-]+$/.test(tk)) {
      candidates.push(tk);
    }
  });

  // Clean candidates (uppercase, trimmed, unique)
  const cleanList = Array.from(
    new Set(
      candidates
        .map((c) => c.trim().toUpperCase())
        .filter((c) => c.length >= 2)
    )
  );

  return cleanList.length > 0 ? cleanList : [cleanRaw.toUpperCase()];
}

/**
 * Universal Scanned Code Matcher across all entities
 */
export function matchScannedEntity(
  rawText: string,
  patients: Patient[] = [],
  medicines: PharmacyMedicine[] = [],
  invoices: Invoice[] = [],
  prescriptions: Prescription[] = [],
  labReports: LabReport[] = [],
  admissions: IPDAdmission[] = []
): ScanMatchResult {
  const candidates = parseScannedRawText(rawText);

  // A. Check Pharmacy Medicines first
  for (const code of candidates) {
    const med = medicines.find(
      (m) =>
        m.code.toUpperCase() === code ||
        m.id.toUpperCase() === code ||
        (m.batchNo && m.batchNo.toUpperCase() === code) ||
        m.name.toUpperCase() === code
    );
    if (med) {
      playScanBeep(true);
      return {
        type: 'medicine',
        medicine: med,
        extractedCode: code,
        rawInput: rawText,
        message: `ঔষধ সনাক্ত হয়েছে: ${med.name} (${med.code}) - BDT ${med.unitPrice}`,
      };
    }
  }

  // B. Check Prescriptions (Handles Prescription Barcode scans immediately)
  for (const code of candidates) {
    const rx = prescriptions.find(
      (r) => r.id.toUpperCase() === code || (r.patientId && r.patientId.toUpperCase() === code && code.startsWith('RX'))
    );
    if (rx) {
      let p = patients.find((pt) => pt.id === rx.patientId);
      if (!p && rx.patientPhone) {
        p = patients.find((pt) => pt.phone.replace(/\D/g, '') === rx.patientPhone?.replace(/\D/g, ''));
      }
      if (!p) {
        const validGender: 'male' | 'female' | 'other' =
          rx.patientGender === 'female' ? 'female' : rx.patientGender === 'other' ? 'other' : 'male';
        p = {
          id: rx.patientId,
          name: rx.patientName,
          age: rx.patientAge || 35,
          gender: validGender,
          phone: rx.patientPhone || 'N/A',
          bloodGroup: 'B+',
          address: 'Prescription Consultation Patient',
          emergencyContact: rx.patientPhone || 'N/A',
          registeredAt: rx.date,
        };
      }
      playScanBeep(true);
      return {
        type: 'prescription',
        prescription: rx,
        patient: p,
        extractedCode: code,
        rawInput: rawText,
        message: `প্রেসক্রিপশন সনাক্ত হয়েছে: ${rx.id} | রোগী: ${rx.patientName} (ডাঃ ${rx.doctorName})`,
      };
    }
  }

  // C. Check Invoices / Money Receipts (Handles Money Receipt Barcode scans immediately)
  for (const code of candidates) {
    const inv = invoices.find(
      (i) =>
        i.id.toUpperCase() === code ||
        (i.patientId && i.patientId.toUpperCase() === code && (code.startsWith('INV') || code.startsWith('PH-INV')))
    );
    if (inv) {
      let p = patients.find((pt) => pt.id === inv.patientId);
      if (!p && inv.patientPhone) {
        p = patients.find((pt) => pt.phone.replace(/\D/g, '') === inv.patientPhone?.replace(/\D/g, ''));
      }
      if (!p) {
        p = {
          id: inv.patientId,
          name: inv.patientName,
          age: 32,
          gender: 'male',
          phone: inv.patientPhone || 'N/A',
          bloodGroup: 'O+',
          address: 'Billing Cash Counter Patient',
          emergencyContact: inv.patientPhone || 'N/A',
          registeredAt: inv.date,
        };
      }
      playScanBeep(true);
      return {
        type: 'invoice',
        invoice: inv,
        patient: p,
        extractedCode: code,
        rawInput: rawText,
        message: `মানি রিসিট / বিল সনাক্ত হয়েছে: ${inv.id} | রোগী: ${inv.patientName} (মোট: BDT ${inv.total}, বাকি: BDT ${inv.dueAmount})`,
      };
    }
  }

  // D. Check Patients by Patient ID or Phone Number
  for (const code of candidates) {
    const cleanPhone = code.replace(/\D/g, '');
    const patient = patients.find(
      (p) =>
        p.id.toUpperCase() === code ||
        (cleanPhone.length >= 6 && p.phone.replace(/\D/g, '').includes(cleanPhone)) ||
        p.phone.replace(/\D/g, '') === cleanPhone
    );
    if (patient) {
      playScanBeep(true);
      return {
        type: 'patient',
        patient,
        extractedCode: code,
        rawInput: rawText,
        message: `রোগীর আইডি কার্ড যাচাই সম্পন্ন: ${patient.name} (${patient.id}) - ${patient.phone}`,
      };
    }
  }

  // E. Check IPD Inpatient Admissions
  for (const code of candidates) {
    const adm = admissions.find(
      (a) =>
        a.id.toUpperCase() === code ||
        a.patientId.toUpperCase() === code ||
        (a.admissionNumber && a.admissionNumber.toUpperCase() === code)
    );
    if (adm) {
      const p = patients.find((pt) => pt.id === adm.patientId);
      playScanBeep(true);
      return {
        type: 'admission',
        admission: adm,
        patient: p,
        extractedCode: code,
        rawInput: rawText,
        message: `ভর্তিকৃত রোগী সনাক্ত: ${adm.patientName} (${adm.bedNumber} - ${adm.wardType})`,
      };
    }
  }

  // F. Check Lab Reports
  for (const code of candidates) {
    const lab = labReports.find(
      (l) => l.id.toUpperCase() === code || (l.invoiceId && l.invoiceId.toUpperCase() === code)
    );
    if (lab) {
      const p = patients.find((pt) => pt.id === lab.patientId);
      playScanBeep(true);
      return {
        type: 'lab',
        labReport: lab,
        patient: p,
        extractedCode: code,
        rawInput: rawText,
        message: `ল্যাব রিপোর্ট সনাক্ত হয়েছে: ${lab.id} | টেস্ট: ${lab.testName} (${lab.patientName})`,
      };
    }
  }

  // G. Loose / Partial Match Fallback
  const firstCandidate = candidates[0] || rawText.toUpperCase();
  for (const p of patients) {
    if (
      p.id.toUpperCase().includes(firstCandidate) ||
      p.name.toUpperCase().includes(firstCandidate)
    ) {
      playScanBeep(true);
      return {
        type: 'patient',
        patient: p,
        extractedCode: firstCandidate,
        rawInput: rawText,
        message: `ম্যাচিং রোগী পাওয়া গেছে: ${p.name} (${p.id})`,
      };
    }
  }

  playScanBeep(false);
  return {
    type: 'unknown',
    extractedCode: firstCandidate,
    rawInput: rawText,
    message: `কোড '${firstCandidate}' এর সাথে কোনো প্রেসক্রিপশন, মানি রিসিট বা রোগী পাওয়া যায়নি।`,
  };
}
