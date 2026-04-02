export interface StaffShiftQueryOptions {
  limit: number;
  page: number;
  sortBy: string;
  sortDir: 'asc' | 'desc';
  filters?: {
    staffId?: string;
    shiftId?: string;
    date?: Date;
    dateFrom?: Date;
    dateTo?: string;
    isCompleted?: boolean;
    hasCheckedIn?: boolean;
    hasCheckedOut?: boolean;
  };
}