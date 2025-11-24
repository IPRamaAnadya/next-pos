/**
 * Presentation: SummaryController
 * Handles HTTP requests for summary endpoints
 */

import { NextRequest } from 'next/server';
import { SummaryServiceContainer } from '@/application/services/SummaryServiceContainer';
import {
  summaryDateRangeSchema,
  todayQuerySchema,
  topCustomerQuerySchema,
} from '../dto/SummaryRequestDTO';
import {
  mapDailyOrdersSummaryResponse,
  mapPaymentMethodSummaryResponse,
  mapTodayOrdersSummaryResponse,
  mapTodayExpensesSummaryResponse,
  mapTopCustomersSummaryResponse,
  mapDailyPaymentReceivedSummaryResponse,
} from '../dto/SummaryResponseDTO';
import { apiResponse } from '@/app/api/utils/response';
import { verifyToken } from '@/app/api/utils/jwt';

export class SummaryController {
  private static instance: SummaryController;

  private constructor() {}

  public static getInstance(): SummaryController {
    if (!SummaryController.instance) {
      SummaryController.instance = new SummaryController();
    }
    return SummaryController.instance;
  }

  /**
   * Verify tenant authorization
   */
  private verifyTenantAccess(req: NextRequest, tenantId: string): boolean {
    try {
      const token = req.headers.get('authorization')?.split(' ')[1];
      if (!token) return false;
      
      const decoded: any = verifyToken(token);
      return decoded.tenantId === tenantId;
    } catch {
      return false;
    }
  }

  /**
   * Get default date range: first day of current month to today
   */
  private getDefaultDateRange(): { startDate: string; endDate: string } {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    return {
      startDate: firstDayOfMonth.toISOString(),
      endDate: now.toISOString(),
    };
  }

  /**
   * Get daily orders summary
   */
  async getDailyOrders(req: NextRequest, tenantId: string) {
    try {
      // Verify tenant access
      if (!this.verifyTenantAccess(req, tenantId)) {
        return apiResponse.unauthorized('Tenant ID mismatch');
      }

      // Parse and validate query parameters
      const { searchParams } = new URL(req.url);
      const defaults = this.getDefaultDateRange();
      const startDate = searchParams.get('startDate') || searchParams.get('start_date') || defaults.startDate;
      const endDate = searchParams.get('endDate') || searchParams.get('end_date') || defaults.endDate;

      const validatedData = await summaryDateRangeSchema.validate({
        startDate,
        endDate,
      });

      // Execute use case
      const useCase = SummaryServiceContainer.getGetDailyOrdersSummaryUseCase();
      const result = await useCase.execute(
        tenantId,
        new Date(validatedData.startDate),
        new Date(validatedData.endDate)
      );

      // Map and return response
      return apiResponse.success({
        data: mapDailyOrdersSummaryResponse(result),
        message: 'Daily orders summary retrieved successfully',
      });
    } catch (error: any) {
      console.error('Get daily orders summary error:', error);

      if (error.name === 'ValidationError') {
        return apiResponse.validationError(
          error.errors.map((err: string) => ({ field: 'query', message: err }))
        );
      }

      return apiResponse.internalError();
    }
  }

  /**
   * Get payment method summary
   */
  async getPaymentMethodSummary(req: NextRequest, tenantId: string) {
    try {
      if (!this.verifyTenantAccess(req, tenantId)) {
        return apiResponse.unauthorized('Tenant ID mismatch');
      }

      const { searchParams } = new URL(req.url);
      const defaults = this.getDefaultDateRange();
      const startDate = searchParams.get('startDate') || searchParams.get('start_date') || defaults.startDate;
      const endDate = searchParams.get('endDate') || searchParams.get('end_date') || defaults.endDate;

      const validatedData = await summaryDateRangeSchema.validate({
        startDate,
        endDate,
      });

      const useCase = SummaryServiceContainer.getGetPaymentMethodSummaryUseCase();
      const result = await useCase.execute(
        tenantId,
        new Date(validatedData.startDate),
        new Date(validatedData.endDate)
      );

      return apiResponse.success({
        data: mapPaymentMethodSummaryResponse(result),
        message: 'Payment method summary retrieved successfully',
      });
    } catch (error: any) {
      console.error('Get payment method summary error:', error);

      if (error.name === 'ValidationError') {
        return apiResponse.validationError(
          error.errors.map((err: string) => ({ field: 'query', message: err }))
        );
      }

      return apiResponse.internalError();
    }
  }

  /**
   * Get today's orders
   */
  async getTodayOrders(req: NextRequest, tenantId: string) {
    try {
      if (!this.verifyTenantAccess(req, tenantId)) {
        return apiResponse.unauthorized('Tenant ID mismatch');
      }

      const { searchParams } = new URL(req.url);
      const defaults = this.getDefaultDateRange();
      const todayStart = searchParams.get('todayStart') || searchParams.get('today_start') || searchParams.get('start_date') || defaults.startDate;
      const todayEnd = searchParams.get('todayEnd') || searchParams.get('today_end') || searchParams.get('end_date') || defaults.endDate;

      const validatedData = await todayQuerySchema.validate({
        todayStart,
        todayEnd,
      });

      const useCase = SummaryServiceContainer.getGetTodayOrdersUseCase();
      const result = await useCase.execute(
        tenantId,
        new Date(validatedData.todayStart),
        new Date(validatedData.todayEnd)
      );

      return apiResponse.success({
        data: mapTodayOrdersSummaryResponse(result),
        message: "Today's orders retrieved successfully",
      });
    } catch (error: any) {
      console.error("Get today's orders error:", error);

      if (error.name === 'ValidationError') {
        return apiResponse.validationError(
          error.errors.map((err: string) => ({ field: 'query', message: err }))
        );
      }

      return apiResponse.internalError();
    }
  }

  /**
   * Get today's expenses
   */
  async getTodayExpenses(req: NextRequest, tenantId: string) {
    try {
      if (!this.verifyTenantAccess(req, tenantId)) {
        return apiResponse.unauthorized('Tenant ID mismatch');
      }

      const { searchParams } = new URL(req.url);
      const defaults = this.getDefaultDateRange();
      const todayStart = searchParams.get('start_date') || defaults.startDate;
      const todayEnd = searchParams.get('end_date') || defaults.endDate;

      const validatedData = await todayQuerySchema.validate({
        todayStart,
        todayEnd,
      });

      const useCase = SummaryServiceContainer.getGetTodayExpensesUseCase();
      const result = await useCase.execute(
        tenantId,
        new Date(validatedData.todayStart),
        new Date(validatedData.todayEnd)
      );

      return apiResponse.success({
        data: mapTodayExpensesSummaryResponse(result),
        message: "Today's expenses retrieved successfully",
      });
    } catch (error: any) {
      console.error("Get today's expenses error:", error);
      return apiResponse.internalError();
    }
  }

  /**
   * Get top customers
   */
  async getTopCustomers(req: NextRequest, tenantId: string) {
    try {
      if (!this.verifyTenantAccess(req, tenantId)) {
        return apiResponse.unauthorized('Tenant ID mismatch');
      }

      const { searchParams } = new URL(req.url);
      const defaults = this.getDefaultDateRange();
      const startDate = searchParams.get('startDate') || searchParams.get('start_date') || defaults.startDate;
      const endDate = searchParams.get('endDate') || searchParams.get('end_date') || defaults.endDate;
      const limit = searchParams.get('limit');

      const validatedData = await topCustomerQuerySchema.validate({
        startDate,
        endDate,
        limit: limit ? parseInt(limit, 10) : 20,
      });

      const useCase = SummaryServiceContainer.getGetTopCustomersUseCase();
      const result = await useCase.execute(
        tenantId,
        new Date(validatedData.startDate),
        new Date(validatedData.endDate),
        validatedData.limit || 20
      );

      return apiResponse.success({
        data: mapTopCustomersSummaryResponse(result),
        message: 'Top customers retrieved successfully',
      });
    } catch (error: any) {
      console.error('Get top customers error:', error);

      if (error.name === 'ValidationError') {
        return apiResponse.validationError(
          error.errors.map((err: string) => ({ field: 'query', message: err }))
        );
      }

      return apiResponse.internalError();
    }
  }

  /**
   * Get daily payment received
   */
  async getDailyPaymentReceived(req: NextRequest, tenantId: string) {
    try {
      if (!this.verifyTenantAccess(req, tenantId)) {
        return apiResponse.unauthorized('Tenant ID mismatch');
      }

      const { searchParams } = new URL(req.url);
      const defaults = this.getDefaultDateRange();
      const startDate = searchParams.get('startDate') || searchParams.get('start_date') || defaults.startDate;
      const endDate = searchParams.get('endDate') || searchParams.get('end_date') || defaults.endDate;

      const validatedData = await summaryDateRangeSchema.validate({
        startDate,
        endDate,
      });

      const useCase = SummaryServiceContainer.getGetDailyPaymentReceivedUseCase();
      const result = await useCase.execute(
        tenantId,
        new Date(validatedData.startDate),
        new Date(validatedData.endDate)
      );

      return apiResponse.success({
        data: mapDailyPaymentReceivedSummaryResponse(result),
        message: 'Daily payment received retrieved successfully',
      });
    } catch (error: any) {
      console.error('Get daily payment received error:', error);

      if (error.name === 'ValidationError') {
        return apiResponse.validationError(
          error.errors.map((err: string) => ({ field: 'query', message: err }))
        );
      }

      return apiResponse.internalError();
    }
  }
}
