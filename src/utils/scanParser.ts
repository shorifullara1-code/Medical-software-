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
 * Parses URLs, JSON, ID patterns, and raw text
 */
export function parseScannedRawText(rawText: string): string[] {
  if (!rawText) return [];
  const text = rawText.trim();
  const candidates: string[] = [text];

  // 1. Try parsing JSON if input is JSON format
  if (text.startsWith('{') && text.endsWith('}')) {
    try {
      const parsed = JSON.parse(text);
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
  if (text.includes('://') || text.includes('?') || text.includes('=')) {
    try {
      const urlStr = text.includes('://') ? text : `http://localhost/${text}`;
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

  // 3. Regex extraction for standard prefixes
  const regexPatterns = [
    /P-\d{4}-\d+/gi,       // Patient ID e.g. P-2026-001
    /INV-\d{4}-\d+/gi,     // Invoice ID e.g. INV-2026-1001
    /RX-\d{4}-\d+/gi,      // Prescription ID e.g. RX-2026-001
    /LAB-\d{4}-\d+/gi,     // Lab Report ID e.g. LAB-2026-1001
    /IPD-\d{4}-\d+/gi,     // Admission ID e.g. IPD-2026-001
    /MED-\d+/gi,           // Medicine ID e.g. MED-101
    /01[3-9]\d{8}/g,       // BD Phone numbers e.g. 01712345678
  ];

  regexPatterns.forEach((pattern) => {
    const matches = text.match(pattern);
    if (matches) {
      matches.forEach((m) => candidates.push(m));
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

  return cleanList.length > 0 ? cleanList : [text.toUpperCase()];
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
        m.batchNo.toUpperCase() === code ||
        m.name.toUpperCase() === code
    );
    if (med) {
      playScanBeep(true);
      return {
        type: 'medicine',
        medicine: med,
        extractedCode: code,
        rawInput: rawText,
        message: `Medicine Found: ${med.name} (${med.code}) - BDT ${med.unitPrice}`,
      };
    }
  }

  // B. Check Patients by Patient ID or Phone
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
        message: `Patient Verified: ${patient.name} (${patient.id}) - ${patient.phone}`,
      };
    }
  }

  // C. Check IPD Admissions
  for (const code of candidates) {
    const adm = admissions.find(
      (a) =>
        a.id.toUpperCase() === code ||
        a.patientId.toUpperCase() === code ||
        (a.admissionNumber && a.admissionNumber.toUpperCase() === code)
    );
    if (adm) {
      const p = patients.find((p) => p.id === adm.patientId);
      playScanBeep(true);
      return {
        type: 'admission',
        admission: adm,
        patient: p,
        extractedCode: code,
        rawInput: rawText,
        message: `Inpatient Linked: ${adm.patientName} (${adm.bedNumber} - ${adm.wardType})`,
      };
    }
  }

  // D. Check Invoices
  for (const code of candidates) {
    const inv = invoices.find((i) => i.id.toUpperCase() === code);
    if (inv) {
      const p = patients.find((p) => p.id === inv.patientId);
      playScanBeep(true);
      return {
        type: 'invoice',
        invoice: inv,
        patient: p,
        extractedCode: code,
        rawInput: rawText,
        message: `Invoice Verified: ${inv.id} - BDT ${inv.total} (${inv.patientName})`,
      };
    }
  }

  // E. Check Prescriptions
  for (const code of candidates) {
    const rx = prescriptions.find((r) => r.id.toUpperCase() === code);
    if (rx) {
      const p = patients.find((p) => p.id === rx.patientId);
      playScanBeep(true);
      return {
        type: 'prescription',
        prescription: rx,
        patient: p,
        extractedCode: code,
        rawInput: rawText,
        message: `Prescription Found: ${rx.id} - ${rx.patientName} (Dr. ${rx.doctorName})`,
      };
    }
  }

  // F. Check Lab Reports
  for (const code of candidates) {
    const lab = labReports.find((l) => l.id.toUpperCase() === code);
    if (lab) {
      const p = patients.find((p) => p.id === lab.patientId);
      playScanBeep(true);
      return {
        type: 'lab',
        labReport: lab,
        patient: p,
        extractedCode: code,
        rawInput: rawText,
        message: `Lab Report Found: ${lab.id} - ${lab.testName} (${lab.patientName})`,
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
        message: `Matched Patient: ${p.name} (${p.id})`,
      };
    }
  }

  playScanBeep(false);
  return {
    type: 'unknown',
    extractedCode: firstCandidate,
    rawInput: rawText,
    message: `No record found matching code '${firstCandidate}'`,
  };
}
