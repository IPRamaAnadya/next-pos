export interface ShiftQueryOptions {
  limit: number;
  page: number;
  sortBy: string;
  sortDir: 'asc' | 'desc';
  filters?: {
    name?: string;
    isActive?: boolean;
    startTime?: string;
    endTime?: string;
  };
}