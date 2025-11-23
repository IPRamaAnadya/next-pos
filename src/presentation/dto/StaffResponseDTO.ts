export interface StaffResponseDTO {
  id: string;
  tenant_id: string;
  is_owner: boolean;
  role: string;
  username: string;
  created_at: string;
  updated_at: string;
}

export interface StaffListResponseDTO {
  data: StaffResponseDTO[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface SalaryResponseDTO {
  id: string;
  tenant_id: string;
  staff_id: string;
  basic_salary: number;
  fixed_allowance: number;
  type: 'MONTHLY' | 'DAILY' | 'HOURLY';
  total_salary: number;
  hourly_rate: number;
  created_at: string;
  updated_at: string;
}

export interface AttendanceResponseDTO {
  id: string;
  tenant_id: string;
  staff_id: string;
  date: string;
  check_in_time: string | null;
  check_out_time: string | null;
  total_hours: number | null;
  is_weekend: boolean;
  is_complete: boolean;
  created_at: string;
  updated_at: string;
}

export interface PayrollDetailResponseDTO {
  id: string;
  tenant_id: string;
  payroll_period_id: string;
  staff_id: string;
  basic_salary_amount: number;
  fixed_allowance_amount: number;
  overtime_hours: number;
  overtime_pay: number;
  bonus_amount: number;
  deductions_amount: number;
  gross_pay: number;
  take_home_pay: number;
  is_paid: boolean;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface StaffDeleteResponseDTO {
  success: boolean;
  message: string;
}