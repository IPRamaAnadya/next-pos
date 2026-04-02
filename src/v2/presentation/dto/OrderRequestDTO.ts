import * as yup from 'yup';

const orderItemSchema = yup.object({
  productId: yup.string().uuid().required(),
  productName: yup.string().required(),
  productPrice: yup.number().required().min(0),
  qty: yup.number().required().moreThan(0),
});

export const createOrderRequestSchema = yup.object({
  customerName: yup.string().optional(),
  customerId: yup.string().uuid().optional().nullable(),
  discountId: yup.string().uuid().optional().nullable(),
  discountName: yup.string().optional().nullable(),
  discountType: yup.string().optional().nullable().oneOf(['percentage', 'fixed', 'point']),
  discountRewardType: yup.string().optional().nullable().oneOf(['cash', 'point']),
  discountValue: yup.number().optional().nullable().min(0),
  discountAmount: yup.number().optional().nullable().min(0),
  subtotal: yup.number().required().min(0),
  taxAmount: yup.number().optional().min(0),
  totalAmount: yup.number().required().min(0),
  grandTotal: yup.number().required().min(0),
  pointUsed: yup.number().integer().optional().nullable().min(0),
  paidAmount: yup.number().required().min(0),
  change: yup.number().required(),
  paymentMethod: yup.string().optional().nullable(),
  paymentStatus: yup.string().required().oneOf(['unpaid', 'paid', 'partial']),
  orderStatus: yup.string().required(),
  staffId: yup.string().uuid().required(),
  note: yup.string().optional().nullable(),
  orderItems: yup.array().of(orderItemSchema).required().min(1),
});

export const updateOrderRequestSchema = createOrderRequestSchema.shape({
  id: yup.string().uuid().required(),
});

export const orderQuerySchema = yup.object({
  p_limit: yup.number().optional().min(1).max(100).default(5),
  p_page: yup.number().optional().min(1).default(1),
  p_search: yup.string().optional(),
  p_order_status: yup.string().optional(),
  p_payment_status: yup.string().optional(),
  p_customer_name: yup.string().optional(),
  p_customer_id: yup.string().uuid().optional(),
  p_sort_by: yup.string().optional().default('created_at'),
  p_sort_dir: yup.string().optional().oneOf(['asc', 'desc']).default('desc'),
});

export type CreateOrderRequest = yup.InferType<typeof createOrderRequestSchema>;
export type UpdateOrderRequest = yup.InferType<typeof updateOrderRequestSchema>;
export type OrderQueryRequest = yup.InferType<typeof orderQuerySchema>;