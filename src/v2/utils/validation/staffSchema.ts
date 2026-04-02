import * as yup from 'yup';

export const staffCreateSchema = yup.object({
  username: yup.string().required('Username harus diisi.'),
  password: yup.string().required('Password harus diisi.').min(6, 'Password minimal 6 karakter.'),
  role: yup.string().required('Role harus diisi.').oneOf(['cashier', 'manager', 'owner'], 'Role tidak valid.'),
});

export const staffUpdateSchema = yup.object({
  username: yup.string().optional(),
  password: yup.string().min(6, 'Password minimal 6 karakter.').optional(),
  role: yup.string().oneOf(['cashier', 'manager', 'owner'], 'Role tidak valid.').optional(),
});