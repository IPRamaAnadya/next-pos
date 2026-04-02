import * as yup from 'yup';

const orderItemSchema = yup.object({
  productId: yup.string().uuid().required(),
  productName: yup.string().required(),
  productPrice: yup.number().required().min(0),
  qty: yup.number().required().moreThan(0),
});

const orderBaseSchema = yup.object({
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

export const orderCreateSchema = orderBaseSchema.shape({
  // No extra fields needed for create
});

export const orderUpdateSchema = orderBaseSchema.shape({
  id: yup.string().uuid().required(),
});