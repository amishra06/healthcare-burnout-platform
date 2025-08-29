// This file will contain TypeScript type definitions

export interface User {
  id: number;
  name: string;
  email: string;
}

export interface Staff {
  id: number;
  name: string;
  email: string;
  department: 'ICU' | 'Emergency' | 'General';
  role: string;
  hire_date: string;
  created_at: string;
  updated_at: string;
}

export interface WorkHour {
  id: number;
  staff_id: number;
  date: string;
  hours_worked: number;
  overtime_hours: number;
  created_at: string;
}

export interface RiskScore {
  id: number;
  staff_id: number;
  date: string;
  score: number;
  risk_level: 'Low' | 'Medium' | 'High';
  factors: {
    baseScore: number;
    consecutiveDays: number;
    overtimeHours: number;
    weeklyHours: number;
    weekendWork: number;
  };
  created_at: string;
}

export interface StaffDetail extends Staff {
  workHours: WorkHour[];
  riskHistory: RiskScore[];
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface StaffListResponse {
  staff: Staff[];
  pagination: Pagination;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}