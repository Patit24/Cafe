-- Enable uuid-ossp extension for UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enum types
CREATE TYPE salary_type_enum AS ENUM ('hourly', 'daily', 'monthly');
CREATE TYPE attendance_status_enum AS ENUM ('working', 'on_break', 'completed', 'exception');
CREATE TYPE payroll_status_enum AS ENUM ('generated', 'locked', 'paid');
CREATE TYPE leave_status_enum AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE leave_type_enum AS ENUM ('paid', 'unpaid');

-- Departments
CREATE TABLE departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Roles
CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    department_id UUID REFERENCES departments(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (department_id, name)
);

-- Shift Templates
CREATE TABLE shift_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    required_hours DECIMAL(5, 2) NOT NULL,
    max_break_hours DECIMAL(5, 2) DEFAULT 0,
    late_penalty_rules JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (name)
);

-- Employees
CREATE TABLE employees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    department_id UUID REFERENCES departments(id),
    role_id UUID REFERENCES roles(id),
    shift_id UUID REFERENCES shift_templates(id),
    salary_type salary_type_enum NOT NULL,
    salary_rate DECIMAL(10, 2) NOT NULL,
    overtime_rate DECIMAL(10, 2) DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Employee Faces (For Face Recognition)
CREATE TABLE employee_faces (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    image_url TEXT,
    angle VARCHAR(50),
    face_embedding JSONB NOT NULL, -- Store embedding array
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_employee_faces_employee_id ON employee_faces(employee_id);

-- Attendance Records
CREATE TABLE attendance_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    shift_id UUID REFERENCES shift_templates(id),
    date DATE NOT NULL,
    check_in_time TIMESTAMP WITH TIME ZONE,
    check_out_time TIMESTAMP WITH TIME ZONE,
    net_working_minutes INT DEFAULT 0,
    break_minutes INT DEFAULT 0,
    regular_minutes INT DEFAULT 0,
    overtime_minutes INT DEFAULT 0,
    penalty_deduction_minutes INT DEFAULT 0,
    face_match_score DECIMAL(5, 2),
    status attendance_status_enum NOT NULL DEFAULT 'working',
    device_id VARCHAR(255),
    gps_location VARCHAR(255),
    photo_url TEXT,
    liveness_passed BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (employee_id, date)
);
CREATE INDEX idx_attendance_records_date ON attendance_records(date);

-- Attendance Breaks
CREATE TABLE attendance_breaks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    attendance_record_id UUID REFERENCES attendance_records(id) ON DELETE CASCADE,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_attendance_breaks_record_id ON attendance_breaks(attendance_record_id);

-- Payroll Entries
CREATE TABLE payroll_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    total_working_hours DECIMAL(10, 2) DEFAULT 0,
    total_overtime_hours DECIMAL(10, 2) DEFAULT 0,
    base_salary DECIMAL(10, 2) DEFAULT 0,
    overtime_pay DECIMAL(10, 2) DEFAULT 0,
    bonuses DECIMAL(10, 2) DEFAULT 0,
    deductions DECIMAL(10, 2) DEFAULT 0,
    penalty_deductions DECIMAL(10, 2) DEFAULT 0,
    net_salary DECIMAL(10, 2) DEFAULT 0,
    status payroll_status_enum NOT NULL DEFAULT 'generated',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (employee_id, period_start, period_end)
);
CREATE INDEX idx_payroll_entries_period ON payroll_entries(period_start, period_end);

-- Audit Logs
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity_type VARCHAR(255) NOT NULL,
    entity_id UUID NOT NULL,
    action VARCHAR(255) NOT NULL,
    changes JSONB,
    performed_by UUID, -- Can be admin ID or system
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Leave Applications
CREATE TABLE leave_applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason TEXT NOT NULL,
    status leave_status_enum NOT NULL DEFAULT 'approved',
    type leave_type_enum NOT NULL DEFAULT 'unpaid',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_leave_applications_employee_period ON leave_applications(employee_id, start_date, end_date);
