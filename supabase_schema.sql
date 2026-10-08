-- ============================================================
-- MediFlow Hospital ERP - Complete Supabase Database Schema
-- Paste this script into your Supabase SQL Editor and click RUN
-- ============================================================

-- Enable UUID extension if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------------------------
-- 1. MASTER DATA STORE TABLE (Used by App Cloud Sync)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.hospital_records (
    id VARCHAR(100) PRIMARY KEY,
    data JSONB NOT NULL,
    project_id VARCHAR(100) DEFAULT 'xgycqgklfduvxlkcyuyd',
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS and add public access policies for hospital_records
ALTER TABLE public.hospital_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public select hospital_records" 
    ON public.hospital_records FOR SELECT 
    USING (true);

CREATE POLICY "Allow public insert/update hospital_records" 
    ON public.hospital_records FOR ALL 
    USING (true)
    WITH CHECK (true);

-- ------------------------------------------------------------
-- 2. PATIENTS TABLE
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.patients (
    id VARCHAR(50) PRIMARY KEY, -- e.g. P-2026-001
    name VARCHAR(255) NOT NULL,
    age INT,
    gender VARCHAR(20),
    phone VARCHAR(50),
    blood_group VARCHAR(10),
    address TEXT,
    emergency_contact VARCHAR(50),
    allergies TEXT,
    medical_history TEXT,
    registered_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_patients_phone ON public.patients(phone);
CREATE INDEX IF NOT EXISTS idx_patients_name ON public.patients(name);

ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public access patients" ON public.patients FOR ALL USING (true) WITH CHECK (true);

-- ------------------------------------------------------------
-- 3. IPD ADMISSIONS TABLE (INPATIENT DEPARTMENT)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ipd_admissions (
    id VARCHAR(50) PRIMARY KEY, -- e.g. IPD-2026-001
    patient_id VARCHAR(50) REFERENCES public.patients(id) ON DELETE CASCADE,
    patient_name VARCHAR(255) NOT NULL,
    patient_age INT,
    patient_gender VARCHAR(20),
    patient_phone VARCHAR(50),
    bed_id VARCHAR(50),
    bed_number VARCHAR(50),
    category VARCHAR(100),
    rate_per_day NUMERIC(12,2) DEFAULT 0,
    doctor_id VARCHAR(50),
    doctor_name VARCHAR(255),
    admission_date TIMESTAMPTZ NOT NULL,
    discharge_date TIMESTAMPTZ,
    status VARCHAR(30) DEFAULT 'admitted', -- 'admitted', 'discharged'
    diagnosis TEXT,
    advance_paid NUMERIC(12,2) DEFAULT 0,
    daily_notes JSONB DEFAULT '[]'::jsonb,
    vitals_history JSONB DEFAULT '[]'::jsonb,
    discharge_summary JSONB,
    clearance_status VARCHAR(50) DEFAULT 'pending', -- 'cleared', 'pending'
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ipd_patient_id ON public.ipd_admissions(patient_id);
CREATE INDEX IF NOT EXISTS idx_ipd_status ON public.ipd_admissions(status);

ALTER TABLE public.ipd_admissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public access ipd_admissions" ON public.ipd_admissions FOR ALL USING (true) WITH CHECK (true);

-- ------------------------------------------------------------
-- 4. PHARMACY MEDICINES INVENTORY TABLE
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.pharmacy_medicines (
    id VARCHAR(50) PRIMARY KEY, -- e.g. MED-101
    barcode VARCHAR(100) UNIQUE,
    name VARCHAR(255) NOT NULL,
    generic_name VARCHAR(255),
    category VARCHAR(50), -- Tablet, Capsule, Syrup, Injection, Saline/IV
    brand_company VARCHAR(255),
    rack_number VARCHAR(50),
    buy_price NUMERIC(12,2) DEFAULT 0,
    sell_price NUMERIC(12,2) NOT NULL DEFAULT 0,
    strip_price NUMERIC(12,2),
    box_price NUMERIC(12,2),
    unit_per_box INT DEFAULT 100,
    stock_quantity INT DEFAULT 0,
    alert_quantity INT DEFAULT 20,
    batch_number VARCHAR(100),
    expire_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pharmacy_barcode ON public.pharmacy_medicines(barcode);
CREATE INDEX IF NOT EXISTS idx_pharmacy_name ON public.pharmacy_medicines(name);

ALTER TABLE public.pharmacy_medicines ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public access pharmacy_medicines" ON public.pharmacy_medicines FOR ALL USING (true) WITH CHECK (true);

-- ------------------------------------------------------------
-- 5. PHARMACY SALES & CREDIT DISPENSING TABLE
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.pharmacy_sales (
    id VARCHAR(50) PRIMARY KEY, -- e.g. PHARM-2026-1001
    patient_type VARCHAR(20) NOT NULL, -- 'indoor' or 'outdoor'
    patient_id VARCHAR(50),
    admission_id VARCHAR(50),
    patient_name VARCHAR(255) NOT NULL,
    patient_phone VARCHAR(50),
    bed_number VARCHAR(50),
    doctor_name VARCHAR(255),
    date TIMESTAMPTZ NOT NULL,
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    subtotal NUMERIC(12,2) DEFAULT 0,
    discount NUMERIC(12,2) DEFAULT 0,
    total NUMERIC(12,2) DEFAULT 0,
    paid_amount NUMERIC(12,2) DEFAULT 0,
    due_amount NUMERIC(12,2) DEFAULT 0,
    payment_status VARCHAR(30) DEFAULT 'paid', -- 'paid', 'credit_ipd', 'partial', 'settled_at_discharge'
    payment_method VARCHAR(50) DEFAULT 'Cash',
    served_by VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pharmacy_sales_patient ON public.pharmacy_sales(patient_id);
CREATE INDEX IF NOT EXISTS idx_pharmacy_sales_admission ON public.pharmacy_sales(admission_id);

ALTER TABLE public.pharmacy_sales ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public access pharmacy_sales" ON public.pharmacy_sales FOR ALL USING (true) WITH CHECK (true);

-- ------------------------------------------------------------
-- 6. INVOICES & BILLING RECEIPTS TABLE
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.invoices (
    id VARCHAR(50) PRIMARY KEY, -- e.g. INV-2026-1001
    patient_id VARCHAR(50) REFERENCES public.patients(id),
    patient_name VARCHAR(255) NOT NULL,
    patient_phone VARCHAR(50),
    date TIMESTAMPTZ NOT NULL,
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    subtotal NUMERIC(12,2) DEFAULT 0,
    discount NUMERIC(12,2) DEFAULT 0,
    total NUMERIC(12,2) DEFAULT 0,
    paid_amount NUMERIC(12,2) DEFAULT 0,
    due_amount NUMERIC(12,2) DEFAULT 0,
    status VARCHAR(30) DEFAULT 'paid', -- 'paid', 'partial', 'due'
    collected_by VARCHAR(255),
    payment_history JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_invoices_patient ON public.invoices(patient_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON public.invoices(status);

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public access invoices" ON public.invoices FOR ALL USING (true) WITH CHECK (true);

-- ------------------------------------------------------------
-- 7. PRESCRIPTIONS TABLE
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.prescriptions (
    id VARCHAR(50) PRIMARY KEY, -- e.g. RX-2026-001
    patient_id VARCHAR(50) REFERENCES public.patients(id),
    patient_name VARCHAR(255) NOT NULL,
    patient_age INT,
    patient_gender VARCHAR(20),
    patient_phone VARCHAR(50),
    doctor_id VARCHAR(50),
    doctor_name VARCHAR(255) NOT NULL,
    doctor_specialty VARCHAR(255),
    date TIMESTAMPTZ NOT NULL,
    vitals JSONB DEFAULT '{}'::jsonb,
    chief_complaints JSONB DEFAULT '[]'::jsonb,
    clinical_findings TEXT,
    diagnosis TEXT,
    medicines JSONB NOT NULL DEFAULT '[]'::jsonb,
    recommended_tests JSONB DEFAULT '[]'::jsonb,
    advice TEXT,
    next_visit_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_prescriptions_patient ON public.prescriptions(patient_id);

ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public access prescriptions" ON public.prescriptions FOR ALL USING (true) WITH CHECK (true);

-- ------------------------------------------------------------
-- 8. LAB REPORTS & DIAGNOSTICS TABLE
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.lab_reports (
    id VARCHAR(50) PRIMARY KEY, -- e.g. LAB-2026-1001
    patient_id VARCHAR(50) REFERENCES public.patients(id),
    patient_name VARCHAR(255) NOT NULL,
    patient_age INT,
    patient_gender VARCHAR(20),
    patient_phone VARCHAR(50),
    doctor_name VARCHAR(255),
    test_id VARCHAR(50),
    test_name VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    sample_type VARCHAR(100),
    room_location VARCHAR(100),
    order_date TIMESTAMPTZ NOT NULL,
    sample_collected_at TIMESTAMPTZ,
    report_ready_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    status VARCHAR(30) DEFAULT 'pending', -- 'pending', 'sample_collected', 'in_progress', 'ready', 'delivered'
    parameter_results JSONB DEFAULT '[]'::jsonb,
    cbc_data JSONB,
    technician_name VARCHAR(255),
    doctor_signature VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lab_reports_patient ON public.lab_reports(patient_id);
CREATE INDEX IF NOT EXISTS idx_lab_reports_status ON public.lab_reports(status);

ALTER TABLE public.lab_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public access lab_reports" ON public.lab_reports FOR ALL USING (true) WITH CHECK (true);

-- ------------------------------------------------------------
-- 9. APPOINTMENTS TABLE
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.appointments (
    id VARCHAR(50) PRIMARY KEY,
    patient_id VARCHAR(50) REFERENCES public.patients(id),
    patient_name VARCHAR(255) NOT NULL,
    doctor_id VARCHAR(50),
    doctor_name VARCHAR(255) NOT NULL,
    specialization VARCHAR(255),
    date DATE NOT NULL,
    time_slot VARCHAR(100),
    serial_number INT,
    fee NUMERIC(12,2) DEFAULT 0,
    status VARCHAR(30) DEFAULT 'scheduled', -- 'scheduled', 'waiting', 'in_consultation', 'completed', 'cancelled'
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public access appointments" ON public.appointments FOR ALL USING (true) WITH CHECK (true);

-- ------------------------------------------------------------
-- 10. BEDS MANAGEMENT TABLE
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.beds (
    id VARCHAR(50) PRIMARY KEY,
    number VARCHAR(50) UNIQUE NOT NULL,
    category VARCHAR(100) NOT NULL,
    rate_per_day NUMERIC(12,2) NOT NULL,
    status VARCHAR(30) DEFAULT 'available', -- 'available', 'occupied', 'maintenance'
    current_patient_id VARCHAR(50),
    current_patient_name VARCHAR(255),
    admission_id VARCHAR(50),
    floor VARCHAR(50),
    room_no VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.beds ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public access beds" ON public.beds FOR ALL USING (true) WITH CHECK (true);

-- ------------------------------------------------------------
-- 11. STAFF & DOCTORS ROSTER TABLE (RBAC & Credentials)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.staff (
    id VARCHAR(50) PRIMARY KEY, -- e.g. STF-01, STF-04, dr_rahim
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

-- Idempotent migrations for existing installations:
ALTER TABLE IF EXISTS public.staff ADD COLUMN IF NOT EXISTS password VARCHAR(255) DEFAULT '123456';
ALTER TABLE IF EXISTS public.staff ADD COLUMN IF NOT EXISTS allowed_tabs JSONB DEFAULT '["dashboard"]'::jsonb;
ALTER TABLE IF EXISTS public.staff ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_staff_phone ON public.staff(phone);
CREATE INDEX IF NOT EXISTS idx_staff_email ON public.staff(email);
CREATE INDEX IF NOT EXISTS idx_staff_role ON public.staff(role);

ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public access staff" ON public.staff;
CREATE POLICY "Allow public access staff" ON public.staff FOR ALL USING (true) WITH CHECK (true);

-- Seed / Upsert Default Hospital Staff Credentials
INSERT INTO public.staff (id, name, role, department, phone, email, shift, password, allowed_tabs)
VALUES 
  ('STF-04', 'Hospital Administrator', 'admin', 'Hospital Management & Operations', '01811-000000', 'admin@medpulse.bd', 'Morning (8:00 AM - 2:00 PM)', 'admin123', '["dashboard","patients","opd","ipd","pharmacy","billing","finance","prescriptions","lab","delivery","appointments","staff","settings"]'::jsonb),
  ('STF-01', 'Dr. Rafiqul Islam', 'doctor', 'Internal Medicine Department', '01711-234567', 'dr.rafiq@medpulse.bd', 'Morning (8:00 AM - 2:00 PM)', '123456', '["dashboard","opd","prescriptions","patients","lab","appointments"]'::jsonb),
  ('STF-02', 'Dr. Nusrat Jahan', 'doctor', 'Gynaecology & Obstetrics Department', '01819-876543', 'dr.nusrat@medpulse.bd', 'Evening (2:00 PM - 8:00 PM)', '123456', '["dashboard","opd","prescriptions","patients","lab","appointments"]'::jsonb),
  ('STF-05', 'Farzana Akter', 'receptionist', 'Patient Registration & Front Desk', '01912-345678', 'farzana@medpulse.bd', 'Morning (8:00 AM - 2:00 PM)', '123456', '["dashboard","patients","appointments","opd","ipd"]'::jsonb),
  ('STF-06', 'Md. Kamal Hossain', 'accountant', 'Billing & Finance Department', '01611-987654', 'kamal@medpulse.bd', 'Regular (9:00 AM - 5:00 PM)', '123456', '["dashboard","billing","finance","pharmacy","delivery"]'::jsonb),
  ('STF-07', 'Shahana Parvin', 'lab_technician', 'Pathology & Diagnostic Laboratory', '01511-234567', 'shahana@medpulse.bd', 'Morning (8:00 AM - 2:00 PM)', '123456', '["dashboard","lab","delivery","opd"]'::jsonb)
ON CONFLICT (id) DO UPDATE SET
  password = EXCLUDED.password,
  allowed_tabs = EXCLUDED.allowed_tabs,
  updated_at = NOW();

-- ------------------------------------------------------------
-- 12. HOSPITAL SETTINGS TABLE
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.hospital_settings (
    id VARCHAR(50) PRIMARY KEY DEFAULT 'primary_settings',
    name VARCHAR(255) NOT NULL,
    subtitle VARCHAR(255),
    address TEXT,
    phone VARCHAR(100),
    email VARCHAR(100),
    website VARCHAR(100),
    reg_number VARCHAR(100),
    currency VARCHAR(20) DEFAULT 'BDT (৳)',
    logo_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.hospital_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public access hospital_settings" ON public.hospital_settings FOR ALL USING (true) WITH CHECK (true);

-- Done! All MediFlow Hospital ERP SQL tables successfully configured.
