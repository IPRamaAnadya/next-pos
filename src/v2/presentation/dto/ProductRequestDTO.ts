import * as yup from 'yup';

export const createProductSchema = yup.object({
  name: yup.string().required('Product name is required').min(1, 'Product name cannot be empty'),
  description: yup.string().optional().nullable(),
  price: yup.number().required('Price is required').min(0, 'Price cannot be negative'),
  type: yup.string().required('Product type is required').oneOf(['good', 'service'], 'Product type must be either "good" or "service"'),
  stock: yup.number().optional().nullable().min(0, 'Stock cannot be negative').integer('Stock must be a whole number').transform((value, originalValue) => {
    // Convert empty string or undefined to null for optional stock tracking
    if (originalValue === '' || originalValue === undefined) return null;
    return value;
  }),
  sku: yup.string().optional().nullable(),
  image_url: yup.string().optional().nullable().url('Image URL must be valid'),
  alias: yup.string().optional().nullable(),
  productCategoryId: yup.string().required().uuid('Product category ID must be a valid UUID'),
  is_countable: yup.boolean().optional().default(true),
  unit: yup.string().optional().default('pcs'),
});

export const updateProductSchema = yup.object({
  name: yup.string().optional().min(1, 'Product name cannot be empty'),
  description: yup.string().optional().nullable(),
  price: yup.number().optional().min(0, 'Price cannot be negative'),
  type: yup.string().optional().oneOf(['good', 'service'], 'Product type must be either "good" or "service"'),
  stock: yup.number().optional().nullable().min(0, 'Stock cannot be negative').integer('Stock must be a whole number').transform((value, originalValue) => {
    // Convert empty string or undefined to null for optional stock tracking
    if (originalValue === '' || originalValue === undefined) return null;
    return value;
  }),
  sku: yup.string().optional().nullable(),
  image_url: yup.string().optional().nullable().url('Image URL must be valid'),
  alias: yup.string().optional().nullable(),
  product_category_id: yup.string().optional().nullable().uuid('Product category ID must be a valid UUID'),
  is_countable: yup.boolean().optional(),
  unit: yup.string().optional(),
});

export const productQuerySchema = yup.object({
  p_limit: yup.number().optional().min(1).max(100).default(10),
  p_page: yup.number().optional().min(1).default(1),
  p_sort_by: yup.string().optional().default('name'),
  p_sort_dir: yup.string().optional().oneOf(['asc', 'desc']).default('asc'),
  p_search_name: yup.string().optional(),
  p_category_id: yup.string().optional().uuid(),
  p_type: yup.string().optional().oneOf(['good', 'service']),
  p_sku: yup.string().optional(),
  p_in_stock: yup.boolean().optional(),
});

export const updateStockSchema = yup.object({
  stock_change: yup.number().required('Stock change is required').integer('Stock change must be a whole number'),
});

export type CreateProductRequest = yup.InferType<typeof createProductSchema>;
export type UpdateProductRequest = yup.InferType<typeof updateProductSchema>;
export type ProductQueryRequest = yup.InferType<typeof productQuerySchema>;
export type UpdateStockRequest = yup.InferType<typeof updateStockSchema>;