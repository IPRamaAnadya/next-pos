import { NextRequest, NextResponse } from 'next/server';
import { DiscountServiceContainer } from '../../application/services/DiscountServiceContainer';
import { DiscountResponseDTO } from '../dto/DiscountResponseDTO';
import { 
  createDiscountSchema, 
  updateDiscountSchema, 
  discountQuerySchema,
  validateDiscountSchema,
  CreateDiscountRequest,
  UpdateDiscountRequest,
  ValidateDiscountRequest
} from '../dto/DiscountRequestDTO';
import { verifyToken } from '@/app/api/utils/jwt';
import { apiResponse } from '@/app/api/utils/response';

export class DiscountController {
  private static instance: DiscountController;

  private constructor() {}

  public static getInstance(): DiscountController {
    if (!DiscountController.instance) {
      DiscountController.instance = new DiscountController();
    }
    return DiscountController.instance;
  }

  async getDiscounts(req: NextRequest, tenantId: string) {
    try {
      // Verify token and tenant access
      const token = req.headers.get('authorization')?.split(' ')[1];
      const decoded: any = verifyToken(token as string);
      
      if (decoded.tenantId !== tenantId) {
        return apiResponse.forbidden('Unauthorized: Tenant ID mismatch');
      }

      // Parse and validate query parameters
      const { searchParams } = new URL(req.url);
      const queryParams = {
        p_limit: parseInt(searchParams.get('p_limit') || '10'),
        p_page: parseInt(searchParams.get('p_page') || '1'),
        p_sort_by: searchParams.get('p_sort_by') || 'created_at',
        p_sort_dir: searchParams.get('p_sort_dir') || 'desc',
        p_name: searchParams.get('p_name') || undefined,
        p_code: searchParams.get('p_code') || undefined,
        p_type: searchParams.get('p_type') || undefined,
        p_is_active: searchParams.get('p_is_active') === 'true' ? true : 
                     searchParams.get('p_is_active') === 'false' ? false : undefined,
        p_is_member_only: searchParams.get('p_is_member_only') === 'true' ? true : 
                          searchParams.get('p_is_member_only') === 'false' ? false : undefined,
        p_reward_type: searchParams.get('p_reward_type') || undefined,
      };

      const validatedQuery = await discountQuerySchema.validate(queryParams);

      const options = {
        limit: validatedQuery.p_limit,
        page: validatedQuery.p_page,
        sortBy: validatedQuery.p_sort_by,
        sortDir: validatedQuery.p_sort_dir as 'asc' | 'desc',
        filters: {
          name: validatedQuery.p_name,
          code: validatedQuery.p_code,
          type: validatedQuery.p_type,
          isActive: validatedQuery.p_is_active,
          isMemberOnly: validatedQuery.p_is_member_only,
          rewardType: validatedQuery.p_reward_type,
        },
      };

      const discountUseCases = DiscountServiceContainer.getDiscountUseCases();
      const result = await discountUseCases.getDiscounts(tenantId, options);

      return DiscountResponseDTO.mapPaginatedResponse(result);
    } catch (error: any) {
      console.error('Get discounts error:', error);
      
      if (error.name === 'ValidationError') {
        return apiResponse.validationError(error.errors.map((err: any) => ({ field: err.path, message: err.message })));
      }

      return apiResponse.internalError();
    }
  }

  async getDiscountById(req: NextRequest, tenantId: string, discountId: string) {
    try {
      // Verify token and tenant access
      const token = req.headers.get('authorization')?.split(' ')[1];
      const decoded: any = verifyToken(token as string);
      
      if (decoded.tenantId !== tenantId) {
        return apiResponse.forbidden('Unauthorized: Tenant ID mismatch');
      }

      const discountUseCases = DiscountServiceContainer.getDiscountUseCases();
      const discount = await discountUseCases.getDiscountById(discountId, tenantId);

      return DiscountResponseDTO.mapSingleResponse(discount);
    } catch (error: any) {
      console.error('Get discount by ID error:', error);
      
      if (error.message === 'Discount not found') {
        return apiResponse.notFound('Discount not found');
      }

      return apiResponse.internalError();
    }
  }

  async getActiveDiscounts(req: NextRequest, tenantId: string) {
    try {
      // Verify token and tenant access
      const token = req.headers.get('authorization')?.split(' ')[1];
      const decoded: any = verifyToken(token as string);
      
      if (decoded.tenantId !== tenantId) {
        return apiResponse.forbidden('Unauthorized: Tenant ID mismatch');
      }

      const discountUseCases = DiscountServiceContainer.getDiscountUseCases();
      const discounts = await discountUseCases.getActiveDiscounts(tenantId);

      return DiscountResponseDTO.mapActiveDiscountsResponse(discounts);
    } catch (error: any) {
      console.error('Get active discounts error:', error);
      
      return apiResponse.internalError();
    }
  }

  async createDiscount(req: NextRequest, tenantId: string) {
    try {
      // Verify token and tenant access
      const token = req.headers.get('authorization')?.split(' ')[1];
      const decoded: any = verifyToken(token as string);
      
      if (decoded.tenantId !== tenantId) {
        return apiResponse.forbidden('Unauthorized: Tenant ID mismatch');
      }

      const body = await req.json();
      const validatedData: CreateDiscountRequest = await createDiscountSchema.validate(body);

      const discountData = {
        tenantId,
        code: validatedData.code || undefined,
        name: validatedData.name,
        description: validatedData.description || undefined,
        type: validatedData.type,
        value: validatedData.value,
        validFrom: validatedData.valid_from || undefined,
        validTo: validatedData.valid_to || undefined,
        minPurchase: validatedData.min_purchase || undefined,
        maxDiscount: validatedData.max_discount || undefined,
        applicableItems: validatedData.applicable_items || undefined,
        rewardType: validatedData.reward_type || undefined,
        isMemberOnly: validatedData.is_member_only || undefined,
      };

      console.log('Creating discount with data:', discountData);

      const discountUseCases = DiscountServiceContainer.getDiscountUseCases();
      const discount = await discountUseCases.createDiscount(discountData);

      return DiscountResponseDTO.mapCreatedResponse(discount);
    } catch (error: any) {
      console.error('Create discount error:', error);
      
      if (error.name === 'ValidationError') {
        return apiResponse.validationError(error.errors.map((err: any) => ({ field: err.path, message: err.message })));
      }

      if (error.message.includes('already exists') || error.message.includes('Invalid') || error.message.includes('required') || error.message.includes('greater than')) {
        return apiResponse.validationError([{ field: 'general', message: error.message }]);
      }

      return apiResponse.internalError();
    }
  }

  async updateDiscount(req: NextRequest, tenantId: string, discountId: string) {
    try {
      // Verify token and tenant access
      const token = req.headers.get('authorization')?.split(' ')[1];
      const decoded: any = verifyToken(token as string);
      
      if (decoded.tenantId !== tenantId) {
        return apiResponse.forbidden('Unauthorized: Tenant ID mismatch');
      }

      const body = await req.json();
      const validatedData: UpdateDiscountRequest = await updateDiscountSchema.validate(body);

      console.log('Updating discount with data:', validatedData);

      const updates: any = {};
      if (validatedData.code !== undefined) updates.code = validatedData.code;
      if (validatedData.name !== undefined) updates.name = validatedData.name;
      if (validatedData.description !== undefined) updates.description = validatedData.description;
      if (validatedData.type !== undefined) updates.type = validatedData.type;
      if (validatedData.value !== undefined) updates.value = validatedData.value;
      if (validatedData.valid_from !== undefined) updates.validFrom = validatedData.valid_from;
      if (validatedData.valid_to !== undefined) updates.validTo = validatedData.valid_to;
      if (validatedData.min_purchase !== undefined) updates.minPurchase = validatedData.min_purchase;
      if (validatedData.max_discount !== undefined) updates.maxDiscount = validatedData.max_discount;
      if (validatedData.applicable_items !== undefined) updates.applicableItems = validatedData.applicable_items;
      if (validatedData.reward_type !== undefined) updates.rewardType = validatedData.reward_type;
      if (validatedData.is_member_only !== undefined) updates.isMemberOnly = validatedData.is_member_only;

      const discountUseCases = DiscountServiceContainer.getDiscountUseCases();
      const discount = await discountUseCases.updateDiscount(discountId, tenantId, updates);

      return DiscountResponseDTO.mapUpdatedResponse(discount);
    } catch (error: any) {
      console.error('Update discount error:', error);
      
      if (error.message === 'Discount not found') {
        return apiResponse.notFound('Discount not found');
      }

      if (error.name === 'ValidationError') {
        return apiResponse.validationError(error.errors.map((err: any) => ({ field: err.path, message: err.message })));
      }

      if (error.message.includes('already exists') || error.message.includes('Invalid') || error.message.includes('cannot be') || error.message.includes('greater than')) {
        return apiResponse.validationError([{ field: 'general', message: error.message }]);
      }

      return apiResponse.internalError();
    }
  }

  async deleteDiscount(req: NextRequest, tenantId: string, discountId: string) {
    try {
      // Verify token and tenant access
      const token = req.headers.get('authorization')?.split(' ')[1];
      const decoded: any = verifyToken(token as string);
      
      if (decoded.tenantId !== tenantId) {
        return apiResponse.forbidden('Unauthorized: Tenant ID mismatch');
      }

      const discountUseCases = DiscountServiceContainer.getDiscountUseCases();
      await discountUseCases.deleteDiscount(discountId, tenantId);

      return DiscountResponseDTO.mapDeletedResponse();
    } catch (error: any) {
      console.error('Delete discount error:', error);
      
      if (error.message === 'Discount not found') {
        return apiResponse.notFound('Discount not found');
      }

      return apiResponse.internalError();
    }
  }

  async validateDiscount(req: NextRequest, tenantId: string) {
    try {
      // Verify token and tenant access
      const token = req.headers.get('authorization')?.split(' ')[1];
      const decoded: any = verifyToken(token as string);
      
      if (decoded.tenantId !== tenantId) {
        return apiResponse.forbidden('Unauthorized: Tenant ID mismatch');
      }

      const body = await req.json();
      const validatedData: ValidateDiscountRequest = await validateDiscountSchema.validate(body);

      const discountUseCases = DiscountServiceContainer.getDiscountUseCases();
      const result = await discountUseCases.validateDiscountForOrder(
        validatedData.discount_id,
        tenantId,
        validatedData.order_amount,
        validatedData.is_member_customer
      );

      if (result.isValid) {
        return DiscountResponseDTO.mapValidationResponse(result);
      } else {
        return DiscountResponseDTO.mapValidationResponse(result);
      }
    } catch (error: any) {
      console.error('Validate discount error:', error);
      
      if (error.name === 'ValidationError') {
        return apiResponse.validationError(error.errors.map((err: any) => ({ field: err.path, message: err.message })));
      }

      return apiResponse.internalError();
    }
  }

  async findDiscountByCode(req: NextRequest, tenantId: string, code: string) {
    try {
      // Verify token and tenant access
      const token = req.headers.get('authorization')?.split(' ')[1];
      const decoded: any = verifyToken(token as string);
      
      if (decoded.tenantId !== tenantId) {
        return apiResponse.forbidden('Unauthorized: Tenant ID mismatch');
      }

      const discountUseCases = DiscountServiceContainer.getDiscountUseCases();
      const discount = await discountUseCases.findDiscountByCode(code, tenantId);

      if (!discount) {
        return apiResponse.notFound('Discount not found');
      }

      return DiscountResponseDTO.mapSingleResponse(discount);
    } catch (error: any) {
      console.error('Find discount by code error:', error);
      
      return apiResponse.internalError();
    }
  }
}