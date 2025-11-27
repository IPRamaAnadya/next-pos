import * as yup from 'yup';

export interface CreateOrderStatusRequest {
  code: string;
  name: string;
  order: number;
  isFinal?: boolean;
  isActive?: boolean;
}

export interface UpdateOrderStatusRequest {
  code?: string;
  name?: string;
  order?: number;
  isFinal?: boolean;
  isActive?: boolean;
}

export interface OrderStatusQueryRequest {
  p_limit?: number;
  p_page?: number;
  p_search?: string;
  p_is_active?: boolean;
  p_sort_by?: string;
  p_sort_dir?: 'asc' | 'desc';
}

export interface ReorderOrderStatusesRequest {
  orders: Array<{
    id: string;
    order: number;
  }>;
}

export const createOrderStatusRequestSchema = yup.object({
  code: yup.string().required('Code is required').min(1).max(50),
  name: yup.string().required('Name is required').min(1).max(100),
  order: yup.number().required('Order is required').positive(),
  isFinal: yup.boolean().optional(),
  isActive: yup.boolean().optional(),
});

export const updateOrderStatusRequestSchema = yup.object({
  code: yup.string().min(1).max(50).optional(),
  name: yup.string().min(1).max(100).optional(),
  order: yup.number().positive().optional(),
  isFinal: yup.boolean().optional(),
  isActive: yup.boolean().optional(),
});

export const reorderOrderStatusesRequestSchema = yup.object({
  orders: yup
    .array()
    .of(
      yup.object({
        id: yup.string().required('Status ID is required'),
        order: yup.number().required('Order is required').positive(),
      })
    )
    .required('Orders array is required')
    .min(1, 'At least one status must be provided'),
});

export const orderStatusQuerySchema = yup.object({
  p_limit: yup.number().positive().optional(),
  p_page: yup.number().positive().optional(),
  p_search: yup.string().optional(),
  p_is_active: yup.boolean().optional(),
  p_sort_by: yup.string().optional(),
  p_sort_dir: yup.string().oneOf(['asc', 'desc']).optional(),
});
