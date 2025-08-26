// utils/validation/productSchema.ts
import * as yup from 'yup';
export const productCreateSchema = yup.object({
  name: yup.string().required('Nama produk harus diisi.'),
  description: yup.string().optional(),
  price: yup.number().required('Harga harus diisi.').min(0, 'Harga tidak boleh negatif.'),
  type: yup.string().required('Tipe produk harus diisi.').oneOf(['good', 'service'], 'Tipe tidak valid.'),
  stock: yup.number().optional().min(0, 'Stok tidak boleh negatif.').integer('Stok harus berupa bilangan bulat.'),
  sku: yup.string().optional(),
  image_url: yup.string().optional().url('URL gambar tidak valid.'),
  productCategoryId: yup.string().optional(),
});
export const productUpdateSchema = yup.object({
  name: yup.string().optional(),
  description: yup.string().optional(),
  price: yup.number().optional().min(0, 'Harga tidak boleh negatif.'),
  type: yup.string().optional().oneOf(['good', 'service'], 'Tipe tidak valid.'),
  stock: yup.number().optional().min(0, 'Stok tidak boleh negatif.').integer('Stok harus berupa bilangan bulat.'),
  sku: yup.string().optional(),
  image_url: yup.string().optional().url('URL gambar tidak valid.'),
  productCategoryId: yup.string().optional(),
});
