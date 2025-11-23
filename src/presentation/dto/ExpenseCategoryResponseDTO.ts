export interface ExpenseCategoryResponseDTO {
  id: string;
  tenant_id: string;
  name: string;
  code: string;
  is_private: boolean;
  created_at: string;
}

export interface ExpenseCategoryListResponseDTO {
  data: ExpenseCategoryResponseDTO[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface ExpenseCategoryValidationResponseDTO {
  is_valid: boolean;
  message?: string;
}

export interface ExpenseCategoryDeleteResponseDTO {
  success: boolean;
  message: string;
}