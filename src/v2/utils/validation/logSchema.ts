// utils/validation/logSchema.ts
import * as yup from 'yup';

export const logCreateSchema = yup.object({
  staffId: yup.string().uuid().required('ID staff harus diisi.'),
  action: yup.string().required('Aksi harus diisi.'),
  data: yup.object().optional().nullable(),
});