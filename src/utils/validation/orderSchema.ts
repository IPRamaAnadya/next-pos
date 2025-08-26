import * as yup from 'yup';

const orderItemSchema = yup.object({
  productId: yup.string().uuid().required(),
  productName: yup.string().required(),
  productPrice: yup.number().required().min(0),
  qty: yup.number().required().min(1),
});

const orderBaseSchema = yup.object({
  customerName: yup.string().optional(),
  customerId: yup.string().uuid().optional(),
  discountId: yup.string().uuid().optional(),
  discountName: yup.string().optional(),
  discountType: yup.string().optional().oneOf(['percentage', 'fixed', 'point']),
  discountValue: yup.number().optional().min(0),
  subtotal: yup.number().required().min(0),
  taxAmount: yup.number().optional().min(0),
  totalAmount: yup.number().required().min(0),
  grandTotal: yup.number().required().min(0),
  pointUsed: yup.number().integer().optional().min(0),
  paidAmount: yup.number().required().min(0),
  change: yup.number().required(),
  paymentMethod: yup.string().required(),
  paymentStatus: yup.string().required().oneOf(['unpaid', 'paid', 'partial']),
  orderStatus: yup.string().required(),
  staffId: yup.string().uuid().required(),
  note: yup.string().optional(),
  orderItems: yup.array().of(orderItemSchema).required().min(1),
});

export const orderCreateSchema = orderBaseSchema.shape({
  // No extra fields needed for create
});

export const orderUpdateSchema = orderBaseSchema.shape({
  id: yup.string().uuid().required(),
});