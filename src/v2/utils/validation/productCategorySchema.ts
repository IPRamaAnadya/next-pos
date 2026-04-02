// utils/validation/productCategorySchema.ts
import * as yup from 'yup';
export const productCategoryCreateSchema = yup.object({
  name: yup.string().required('Nama kategori harus diisi.'),
  description: yup.string().optional(),
});
export const productCategoryUpdateSchema = yup.object({
  name: yup.string().optional(),
  description: yup.string().optional(),
});