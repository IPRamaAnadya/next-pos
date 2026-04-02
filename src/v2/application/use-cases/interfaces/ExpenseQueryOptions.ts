export interface ExpenseQueryOptions {
  limit: number;
  page: number;
  sortBy: string;
  sortDir: 'asc' | 'desc';
  filters?: {
    description?: string;
    expenseCategoryId?: string;
    staffId?: string;
    paymentType?: string;
    isShow?: boolean;
    isPaid?: boolean;
    minAmount?: number;
    maxAmount?: number;
    startDate?: Date;
    endDate?: Date;
  };
  isCashier?: boolean;
}