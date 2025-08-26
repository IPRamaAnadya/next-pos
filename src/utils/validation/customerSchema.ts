import * as yup from 'yup';

export const customerCreateSchema = yup.object({
  name: yup.string().required('Nama customer harus diisi.'),
  membershipCode: yup.string().optional(),
  email: yup.string().email('Format email tidak valid.').optional(),
  phone: yup.string().optional(),
  address: yup.string().optional(),
  birthday: yup.date().optional(),
  points: yup.number().integer().min(0).optional(),
});

export const customerUpdateSchema = yup.object({
  name: yup.string().optional(),
  membershipCode: yup.string().optional(),
  email: yup.string().email('Format email tidak valid.').optional(),
  phone: yup.string().optional(),
  address: yup.string().optional(),
  birthday: yup.date().optional(),
  points: yup.number().integer().min(0).optional(),
});