import { NextRequest, NextResponse } from 'next/server';
import { ProductCategoryServiceContainer } from '../../application/services/ProductCategoryServiceContainer';
import { ProductCategoryResponseMapper } from '../dto/ProductCategoryResponseDTO';
import { 
  createCategorySchema, 
  updateCategorySchema, 
  categoryQuerySchema,
  moveCategorySchema,
  CreateCategoryRequest,
  UpdateCategoryRequest,
  MoveCategoryRequest
} from '../dto/ProductCategoryRequestDTO';
import { verifyToken } from '@/app/api/utils/jwt';
import { apiResponse } from '@/app/api/utils/response';

export class ProductCategoryController {
  private static instance: ProductCategoryController;

  private constructor() {}

  public static getInstance(): ProductCategoryController {
    if (!ProductCategoryController.instance) {
      ProductCategoryController.instance = new ProductCategoryController();
    }
    return ProductCategoryController.instance;
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
    console.error('Product category operation error:', error);
    
    if (error.message === 'Product category not found') {
      return apiResponse.notFound('Product category not found');
    }
    
    if (error.message.includes('Unauthorized')) {
      return apiResponse.forbidden(error.message);
    }
    
    if (error.message.includes('already exists') || error.message.includes('Cannot delete') || 
        error.message.includes('cannot be') || error.message.includes('hierarchy cannot exceed')) {
      return apiResponse.validationError([
        { field: 'general', message: error.message }
      ]);
    }
    
    if (error.name === 'ValidationError') {
      return apiResponse.validationError(
        error.errors.map((err: string) => ({ field: 'general', message: err }))
      );
    }
    
    return apiResponse.internalError();
  }

  async getCategories(req: NextRequest, tenantId: string) {
    try {
      const tenantIdFromToken = this.validateAndGetTenantId(req, tenantId);

      // Parse and validate query parameters
      const { searchParams } = new URL(req.url);
      const queryParams = {
        p_limit: parseInt(searchParams.get('p_limit') || '10'),
        p_page: parseInt(searchParams.get('p_page') || '1'),
        p_sort_by: searchParams.get('p_sort_by') || 'name',
        p_sort_dir: searchParams.get('p_sort_dir') || 'asc',
        p_search_name: searchParams.get('p_search_name') || undefined,
        p_parent_id: searchParams.get('p_parent_id') || undefined,
        p_root_only: searchParams.get('p_root_only') === 'true',
      };

      const validatedQuery = await categoryQuerySchema.validate(queryParams);

      const options = {
        limit: validatedQuery.p_limit!,
        page: validatedQuery.p_page!,
        sortBy: validatedQuery.p_sort_by!,
        sortDir: validatedQuery.p_sort_dir! as 'asc' | 'desc',
        filters: {
          name: validatedQuery.p_search_name,
          parentId: validatedQuery.p_parent_id || undefined,
          rootOnly: validatedQuery.p_root_only,
        },
      };

      const categoryUseCases = ProductCategoryServiceContainer.getCategoryUseCases();
      const result = await categoryUseCases.getCategories(tenantIdFromToken, options);

      return apiResponse.success({
        data: {
          categories: result.data.map((category: any) => ProductCategoryResponseMapper.toCategoryListResponse(category)),
          pagination: ProductCategoryResponseMapper.toPaginationResponse(result.pagination),
        },
        message: 'Product categories retrieved successfully'
      });
    } catch (error) {
      return this.handleError(error);
    }
  }

  async getCategoryById(req: NextRequest, tenantId: string, categoryId: string) {
    try {
      const tenantIdFromToken = this.validateAndGetTenantId(req, tenantId);

      const categoryUseCases = ProductCategoryServiceContainer.getCategoryUseCases();
      const category = await categoryUseCases.getCategoryById(categoryId, tenantIdFromToken);

      return apiResponse.success({
        data: { category: ProductCategoryResponseMapper.toCategoryResponse(category) },
        message: 'Product category retrieved successfully'
      });
    } catch (error) {
      return this.handleError(error);
    }
  }

  async getCategoryHierarchy(req: NextRequest, tenantId: string) {
    try {
      const tenantIdFromToken = this.validateAndGetTenantId(req, tenantId);

      const categoryUseCases = ProductCategoryServiceContainer.getCategoryUseCases();
      const hierarchy = await categoryUseCases.getCategoryHierarchy(tenantIdFromToken);

      return apiResponse.success({
        data: { 
          hierarchy: hierarchy.map((h: any) => ProductCategoryResponseMapper.toHierarchyResponse(h)) 
        },
        message: 'Product category hierarchy retrieved successfully'
      });
    } catch (error) {
      return this.handleError(error);
    }
  }

  async getRootCategories(req: NextRequest, tenantId: string) {
    try {
      const tenantIdFromToken = this.validateAndGetTenantId(req, tenantId);

      const categoryUseCases = ProductCategoryServiceContainer.getCategoryUseCases();
      const categories = await categoryUseCases.getRootCategories(tenantIdFromToken);

      return apiResponse.success({
        data: { 
          categories: categories.map((category: any) => ProductCategoryResponseMapper.toCategoryListResponse(category)) 
        },
        message: 'Root product categories retrieved successfully'
      });
    } catch (error) {
      return this.handleError(error);
    }
  }

  async getCategoriesByParent(req: NextRequest, tenantId: string, parentId: string) {
    try {
      const tenantIdFromToken = this.validateAndGetTenantId(req, tenantId);

      const categoryUseCases = ProductCategoryServiceContainer.getCategoryUseCases();
      const categories = await categoryUseCases.getCategoriesByParent(parentId === 'null' ? null : parentId, tenantIdFromToken);

      return apiResponse.success({
        data: { 
          categories: categories.map((category: any) => ProductCategoryResponseMapper.toCategoryListResponse(category)) 
        },
        message: 'Child product categories retrieved successfully'
      });
    } catch (error) {
      return this.handleError(error);
    }
  }

  async createCategory(req: NextRequest, tenantId: string) {
    try {
      const tenantIdFromToken = this.validateAndGetTenantId(req, tenantId);

      const body = await req.json();
      const validatedData: CreateCategoryRequest = await createCategorySchema.validate(body);

      const categoryData = {
        tenantId: tenantIdFromToken,
        name: validatedData.name,
        description: validatedData.description || null,
        parentId: validatedData.parent_id || null,
      };

      const categoryUseCases = ProductCategoryServiceContainer.getCategoryUseCases();
      const category = await categoryUseCases.createCategory(categoryData);

      return apiResponse.success({
        data: { category: ProductCategoryResponseMapper.toCategoryResponse(category) },
        message: 'Product category created successfully'
      });
    } catch (error) {
      return this.handleError(error);
    }
  }

  async updateCategory(req: NextRequest, tenantId: string, categoryId: string) {
    try {
      const tenantIdFromToken = this.validateAndGetTenantId(req, tenantId);

      const body = await req.json();
      const validatedData: UpdateCategoryRequest = await updateCategorySchema.validate(body);

      const updates: any = {};
      if (validatedData.name !== undefined) updates.name = validatedData.name;
      if (validatedData.description !== undefined) updates.description = validatedData.description;
      if (validatedData.parent_id !== undefined) updates.parentId = validatedData.parent_id;

      const categoryUseCases = ProductCategoryServiceContainer.getCategoryUseCases();
      const category = await categoryUseCases.updateCategory(categoryId, tenantIdFromToken, updates);

      return apiResponse.success({
        data: { category: ProductCategoryResponseMapper.toCategoryResponse(category) },
        message: 'Product category updated successfully'
      });
    } catch (error) {
      return this.handleError(error);
    }
  }

  async deleteCategory(req: NextRequest, tenantId: string, categoryId: string) {
    try {
      const tenantIdFromToken = this.validateAndGetTenantId(req, tenantId);

      const categoryUseCases = ProductCategoryServiceContainer.getCategoryUseCases();
      await categoryUseCases.deleteCategory(categoryId, tenantIdFromToken);

      return apiResponse.success({
        data: null,
        message: 'Product category deleted successfully'
      });
    } catch (error) {
      return this.handleError(error);
    }
  }

  async moveCategory(req: NextRequest, tenantId: string, categoryId: string) {
    try {
      const tenantIdFromToken = this.validateAndGetTenantId(req, tenantId);

      const body = await req.json();
      const validatedData: MoveCategoryRequest = await moveCategorySchema.validate(body);

      const categoryUseCases = ProductCategoryServiceContainer.getCategoryUseCases();
      const category = await categoryUseCases.moveCategoryToParent(
        categoryId, 
        validatedData.new_parent_id || null,
        tenantIdFromToken
      );

      return apiResponse.success({
        data: { category: ProductCategoryResponseMapper.toCategoryResponse(category) },
        message: 'Product category moved successfully'
      });
    } catch (error) {
      return this.handleError(error);
    }
  }
}