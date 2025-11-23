import { NextRequest, NextResponse } from 'next/server';
import { ProductServiceContainer } from '../../application/services/ProductServiceContainer';
import { ProductResponseMapper } from '../dto/ProductResponseDTO';
import { 
  createProductSchema, 
  updateProductSchema, 
  productQuerySchema,
  updateStockSchema,
  CreateProductRequest,
  UpdateProductRequest,
  UpdateStockRequest
} from '../dto/ProductRequestDTO';
import { verifyToken } from '@/app/api/utils/jwt';
import { apiResponse } from '@/app/api/utils/response';

export class ProductController {
  private static instance: ProductController;

  private constructor() {}

  public static getInstance(): ProductController {
    if (!ProductController.instance) {
      ProductController.instance = new ProductController();
    }
    return ProductController.instance;
  }

  private validateAndGetTenantId(req: NextRequest, tenantId: string): string {
    const token = req.headers.get('authorization')?.split(' ')[1];
    const decoded: any = verifyToken(token as string);
    
    if (decoded.tenantId !== tenantId) {
      throw new Error('Unauthorized: Tenant ID mismatch');
    }
    
    return decoded.tenantId;
  }

  private handleError(error: any): NextResponse {
    console.error('Product operation error:', error);
    
    if (error.message === 'Product not found') {
      return apiResponse.notFound('Product not found');
    }
    
    if (error.message.includes('Unauthorized')) {
      return apiResponse.forbidden(error.message);
    }
    
    if (error.message.includes('already exists')) {
      return apiResponse.validationError([
        { field: 'sku', message: error.message }
      ]);
    }
    
    if (error.name === 'ValidationError') {
      return apiResponse.validationError(
        error.errors.map((err: string) => ({ field: 'general', message: err }))
      );
    }
    
    return apiResponse.internalError();
  }

  async getProducts(req: NextRequest, tenantId: string) {
    try {
      const tenantIdFromToken = this.validateAndGetTenantId(req, tenantId);

      // Parse and validate query parameters
      const { searchParams } = new URL(req.url);
      const queryParams = {
        p_limit: parseInt(searchParams.get('limit') || searchParams.get('p_limit') || '10'),
        p_page: parseInt(searchParams.get('page') || searchParams.get('p_page') || '1'),
        p_sort_by: searchParams.get('sortBy') || searchParams.get('p_sort_by') || 'name',
        p_sort_dir: searchParams.get('sortDir') || searchParams.get('p_sort_dir') || 'asc',
        p_search_name: searchParams.get('search') || searchParams.get('p_search_name') || undefined,
        p_category_id: searchParams.get('categoryId') || searchParams.get('p_category_id') || undefined,
        p_type: searchParams.get('type') || searchParams.get('p_type') || undefined,
        p_sku: searchParams.get('sku') || searchParams.get('p_sku') || undefined,
        p_in_stock: searchParams.get('inStock') ? searchParams.get('inStock') === 'true' : 
                    searchParams.get('p_in_stock') ? searchParams.get('p_in_stock') === 'true' : undefined,
      };

      const validatedQuery = await productQuerySchema.validate(queryParams);

      const options = {
        limit: validatedQuery.p_limit!,
        page: validatedQuery.p_page!,
        sortBy: validatedQuery.p_sort_by!,
        sortDir: validatedQuery.p_sort_dir! as 'asc' | 'desc',
        filters: {
          name: validatedQuery.p_search_name,
          categoryId: validatedQuery.p_category_id,
          type: validatedQuery.p_type as 'good' | 'service' | undefined,
          sku: validatedQuery.p_sku,
          inStock: validatedQuery.p_in_stock,
        },
      };

      const productUseCases = ProductServiceContainer.getProductUseCases();
      const result = await productUseCases.getProducts(tenantIdFromToken, options);

      return apiResponse.success({
        data: {
          products: result.data.map((product: any) => ProductResponseMapper.toProductListResponse(product)),
          pagination: ProductResponseMapper.toPaginationResponse(result.pagination),
        },
        message: 'Products retrieved successfully'
      });
    } catch (error) {
      return this.handleError(error);
    }
  }

  async getProductById(req: NextRequest, tenantId: string, productId: string) {
    try {
      const tenantIdFromToken = this.validateAndGetTenantId(req, tenantId);

      const productUseCases = ProductServiceContainer.getProductUseCases();
      const product = await productUseCases.getProductById(productId, tenantIdFromToken);

      return apiResponse.success({
        data: { product: ProductResponseMapper.toProductResponse(product) },
        message: 'Product retrieved successfully'
      });
    } catch (error) {
      return this.handleError(error);
    }
  }

  async getProductBySku(req: NextRequest, tenantId: string, sku: string) {
    try {
      const tenantIdFromToken = this.validateAndGetTenantId(req, tenantId);

      const productUseCases = ProductServiceContainer.getProductUseCases();
      const product = await productUseCases.getProductBySku(sku, tenantIdFromToken);

      return apiResponse.success({
        data: { product: ProductResponseMapper.toProductResponse(product) },
        message: 'Product retrieved successfully'
      });
    } catch (error) {
      return this.handleError(error);
    }
  }

  async createProduct(req: NextRequest, tenantId: string) {
    try {
      const tenantIdFromToken = this.validateAndGetTenantId(req, tenantId);

      const body = await req.json();
      const validatedData: CreateProductRequest = await createProductSchema.validate(body);

      const productData = {
        tenantId: tenantIdFromToken,
        name: validatedData.name,
        description: validatedData.description || null,
        price: validatedData.price,
        type: validatedData.type,
        stock: validatedData.stock || null,
        sku: validatedData.sku || null,
        imageUrl: validatedData.image_url || null,
        alias: validatedData.alias || null,
        productCategoryId: validatedData.productCategoryId,
        isCountable: validatedData.is_countable ?? true,
        unit: validatedData.unit ?? 'pcs',
      };

      const productUseCases = ProductServiceContainer.getProductUseCases();
      const product = await productUseCases.createProduct(productData);

      return apiResponse.success({
        data: { product: ProductResponseMapper.toProductResponse(product) },
        message: 'Product created successfully'
      });
    } catch (error) {
      return this.handleError(error);
    }
  }

  async updateProduct(req: NextRequest, tenantId: string, productId: string) {
    try {
      const tenantIdFromToken = this.validateAndGetTenantId(req, tenantId);

      const body = await req.json();
      const validatedData: UpdateProductRequest = await updateProductSchema.validate(body);

      const updates: any = {};
      if (validatedData.name !== undefined) updates.name = validatedData.name;
      if (validatedData.description !== undefined) updates.description = validatedData.description;
      if (validatedData.price !== undefined) updates.price = validatedData.price;
      if (validatedData.type !== undefined) updates.type = validatedData.type;
      if (validatedData.stock !== undefined) updates.stock = validatedData.stock;
      if (validatedData.sku !== undefined) updates.sku = validatedData.sku;
      if (validatedData.image_url !== undefined) updates.imageUrl = validatedData.image_url;
      if (validatedData.alias !== undefined) updates.alias = validatedData.alias;
      if (validatedData.product_category_id !== undefined) updates.productCategoryId = validatedData.product_category_id;
      if (validatedData.is_countable !== undefined) updates.isCountable = validatedData.is_countable;
      if (validatedData.unit !== undefined) updates.unit = validatedData.unit;

      const productUseCases = ProductServiceContainer.getProductUseCases();
      const product = await productUseCases.updateProduct(productId, tenantIdFromToken, updates);

      return apiResponse.success({
        data: { product: ProductResponseMapper.toProductResponse(product) },
        message: 'Product updated successfully'
      });
    } catch (error) {
      return this.handleError(error);
    }
  }

  async deleteProduct(req: NextRequest, tenantId: string, productId: string) {
    try {
      const tenantIdFromToken = this.validateAndGetTenantId(req, tenantId);

      const productUseCases = ProductServiceContainer.getProductUseCases();
      await productUseCases.deleteProduct(productId, tenantIdFromToken);

      return apiResponse.success({
        data: null,
        message: 'Product deleted successfully'
      });
    } catch (error) {
      return this.handleError(error);
    }
  }

  async updateProductStock(req: NextRequest, tenantId: string, productId: string) {
    try {
      const tenantIdFromToken = this.validateAndGetTenantId(req, tenantId);

      const body = await req.json();
      const validatedData: UpdateStockRequest = await updateStockSchema.validate(body);

      const productUseCases = ProductServiceContainer.getProductUseCases();
      const product = await productUseCases.updateProductStock(
        productId, 
        tenantIdFromToken, 
        validatedData.stock_change
      );

      return apiResponse.success({
        data: { product: ProductResponseMapper.toProductResponse(product) },
        message: 'Product stock updated successfully'
      });
    } catch (error) {
      return this.handleError(error);
    }
  }

  async checkProductAvailability(req: NextRequest, tenantId: string, productId: string) {
    try {
      const tenantIdFromToken = this.validateAndGetTenantId(req, tenantId);

      const { searchParams } = new URL(req.url);
      const quantity = parseInt(searchParams.get('quantity') || '1');

      const productUseCases = ProductServiceContainer.getProductUseCases();
      const isAvailable = await productUseCases.checkProductAvailability(
        productId, 
        tenantIdFromToken, 
        quantity
      );

      return apiResponse.success({
        data: { 
          product_id: productId,
          required_quantity: quantity,
          is_available: isAvailable
        },
        message: 'Product availability checked successfully'
      });
    } catch (error) {
      return this.handleError(error);
    }
  }
}