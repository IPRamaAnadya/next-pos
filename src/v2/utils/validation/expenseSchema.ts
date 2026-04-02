import * as yup from 'yup';

export const expenseCategoryCreateSchema = yup.object({
  name: yup.string().required('Nama kategori harus diisi.'),
  code: yup.string().required('Kode kategori harus diisi.'),
  isPrivate: yup.boolean().optional(),
});

export const expenseCategoryUpdateSchema = yup.object({
  name: yup.string().optional(),
  code: yup.string().optional(),
  isPrivate: yup.boolean().optional(),
});

export const expenseCreateSchema = yup.object({
  expenseCategoryId: yup.string().uuid().required('ID kategori pengeluaran harus diisi.'),
  staffId: yup.string().uuid().required('ID staff harus diisi.'),
  description: yup.string().required('Deskripsi harus diisi.'),
  amount: yup.number().required('Jumlah harus diisi.').min(0, 'Jumlah tidak boleh negatif.'),
  paidAt: yup.date().optional().nullable(),
  attachmentUrl: yup.string().optional().url('URL lampiran tidak valid.'),
  paymentType: yup.string().optional().default('Cash'),
  isShow: yup.boolean().optional(),
});

export const expenseUpdateSchema = yup.object({
  expenseCategoryId: yup.string().uuid().optional(),
  staffId: yup.string().uuid().optional(),
  description: yup.string().optional(),
  amount: yup.number().optional().min(0, 'Jumlah tidak boleh negatif.'),
  paidAt: yup.date().optional(),
  attachmentUrl: yup.string().optional().url('URL lampiran tidak valid.'),
  paymentType: yup.string().optional(),
  isShow: yup.boolean().optional(),
});