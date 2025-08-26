import * as yup from 'yup';

export const discountCreateSchema = yup.object({
  name: yup.string().required('Nama diskon harus diisi.'),
  code: yup.string().optional(),
  description: yup.string().optional(),
  type: yup.string().required('Tipe diskon harus diisi.').oneOf(['percentage', 'fixed'], 'Tipe tidak valid.'),
  value: yup.number().required('Nilai diskon harus diisi.').min(0, 'Nilai tidak boleh negatif.'),
  validFrom: yup.date().optional(),
  validTo: yup.date().optional(),
  minPurchase: yup.number().optional().min(0, 'Pembelian minimum tidak boleh negatif.'),
  maxDiscount: yup.number().optional(),
  applicableItems: yup.array().optional(),
  isMemberOnly: yup.boolean().optional(),
  rewardType: yup.string().optional(),
});

export const discountUpdateSchema = yup.object({
  name: yup.string().optional(),
  code: yup.string().optional(),
  description: yup.string().optional(),
  type: yup.string().optional().oneOf(['percentage', 'fixed'], 'Tipe tidak valid.'),
  value: yup.number().optional().min(0, 'Nilai tidak boleh negatif.'),
  validFrom: yup.date().optional(),
  validTo: yup.date().optional(),
  minPurchase: yup.number().optional().min(0, 'Pembelian minimum tidak boleh negatif.'),
  maxDiscount: yup.number().optional(),
  applicableItems: yup.array().optional(),
  isMemberOnly: yup.boolean().optional(),
  rewardType: yup.string().optional(),
});