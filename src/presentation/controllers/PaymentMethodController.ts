/**
 * Presentation Controller: Payment Method Controller
 * Handles HTTP requests for payment method operations
 */

import { NextResponse } from "next/server";
import { apiResponse } from "@/app/api/utils/response";
import {
  GetActivePaymentMethodsUseCase,
  GetPaymentMethodDetailUseCase,
  GetAllPaymentMethodsUseCase,
  CreatePaymentMethodUseCase,
  UpdatePaymentMethodUseCase,
  TogglePaymentMethodActiveUseCase,
  DeletePaymentMethodUseCase,
} from "@/application/use-cases/PaymentMethodUseCases";
import {
  createPaymentMethodSchema,
  updatePaymentMethodSchema,
} from "@/presentation/dto/DonationRequestDTO";
import {
  toPaymentMethodResponse,
  toPaymentMethodListResponse,
} from "@/presentation/dto/DonationResponseDTO";

export class PaymentMethodController {
  constructor(
    private getActivePaymentMethodsUseCase: GetActivePaymentMethodsUseCase,
    private getPaymentMethodDetailUseCase: GetPaymentMethodDetailUseCase,
    private getAllPaymentMethodsUseCase: GetAllPaymentMethodsUseCase,
    private createPaymentMethodUseCase: CreatePaymentMethodUseCase,
    private updatePaymentMethodUseCase: UpdatePaymentMethodUseCase,
    private togglePaymentMethodActiveUseCase: TogglePaymentMethodActiveUseCase,
    private deletePaymentMethodUseCase: DeletePaymentMethodUseCase
  ) {}

  /**
   * Get Active Payment Methods (Public)
   */
  async getActivePaymentMethods(request: Request) {
    try {
      const paymentMethods =
        await this.getActivePaymentMethodsUseCase.execute();

      return apiResponse.success({
        data: toPaymentMethodListResponse(paymentMethods),
        message: "Active payment methods retrieved successfully"
      });
    } catch (error: any) {
      console.error("Get active payment methods error:", error);
      return apiResponse.internalError();
    }
  }

  /**
   * Get Payment Method Detail (Public)
   */
  async getPaymentMethodDetail(request: Request, id: string) {
    try {
      const paymentMethod = await this.getPaymentMethodDetailUseCase.execute(
        id
      );

      return apiResponse.success({
        data: toPaymentMethodResponse(paymentMethod),
        message: "Payment method retrieved successfully"
      });
    } catch (error: any) {
      console.error("Get payment method detail error:", error);
      if (error.message === "Payment method not found") {
        return apiResponse.notFound(error.message);
      }
      return apiResponse.internalError();
    }
  }

  /**
   * Get All Payment Methods (Admin)
   */
  async getAllPaymentMethods(request: Request) {
    try {
      const paymentMethods = await this.getAllPaymentMethodsUseCase.execute();

      return apiResponse.success({
        data: toPaymentMethodListResponse(paymentMethods),
        message: "All payment methods retrieved successfully"
      });
    } catch (error: any) {
      console.error("Get all payment methods error:", error);
      return apiResponse.internalError();
    }
  }

  /**
   * Create Payment Method (Admin)
   */
  async createPaymentMethod(request: Request) {
    try {
      const body = await request.json();

      const validatedData = await createPaymentMethodSchema.validate(body, {
        abortEarly: false,
        stripUnknown: true,
      });

      const paymentMethod = await this.createPaymentMethodUseCase.execute({
        name: validatedData.name,
        code: validatedData.code,
        type: validatedData.type,
        transactionFee: validatedData.transaction_fee,
        feePercentage: validatedData.fee_percentage,
        taxPercentage: validatedData.tax_percentage,
        minAmount: validatedData.min_amount,
        maxAmount: validatedData.max_amount,
        iconUrl: validatedData.icon_url,
        description: validatedData.description,
        displayOrder: validatedData.display_order,
      });

      return apiResponse.success({
        data: toPaymentMethodResponse(paymentMethod),
        message: "Payment method created successfully"
      });
    } catch (error: any) {
      console.error("Create payment method error:", error);

      if (error.name === "ValidationError") {
        return apiResponse.validationError(
          error.errors.map((err: string) => ({ field: "general", message: err }))
        );
      }

      return apiResponse.internalError();
    }
  }

  /**
   * Update Payment Method (Admin)
   */
  async updatePaymentMethod(request: Request, id: string) {
    try {
      const body = await request.json();

      const validatedData = await updatePaymentMethodSchema.validate(body, {
        abortEarly: false,
        stripUnknown: true,
      });

      const paymentMethod = await this.updatePaymentMethodUseCase.execute(id, {
        name: validatedData.name,
        transactionFee: validatedData.transaction_fee,
        feePercentage: validatedData.fee_percentage,
        taxPercentage: validatedData.tax_percentage,
        minAmount: validatedData.min_amount,
        maxAmount: validatedData.max_amount,
        isActive: validatedData.is_active,
        iconUrl: validatedData.icon_url,
        description: validatedData.description,
        displayOrder: validatedData.display_order,
      });

      return apiResponse.success({
        data: toPaymentMethodResponse(paymentMethod),
        message: "Payment method updated successfully"
      });
    } catch (error: any) {
      console.error("Update payment method error:", error);

      if (error.name === "ValidationError") {
        return apiResponse.validationError(
          error.errors.map((err: string) => ({ field: "general", message: err }))
        );
      }

      if (error.message === "Payment method not found") {
        return apiResponse.notFound(error.message);
      }

      return apiResponse.internalError();
    }
  }

  /**
   * Toggle Payment Method Active Status (Admin)
   */
  async togglePaymentMethodActive(request: Request, id: string) {
    try {
      const paymentMethod =
        await this.togglePaymentMethodActiveUseCase.execute(id);

      return apiResponse.success({
        data: toPaymentMethodResponse(paymentMethod),
        message: "Payment method status toggled successfully"
      });
    } catch (error: any) {
      console.error("Toggle payment method active error:", error);
      if (error.message === "Payment method not found") {
        return apiResponse.notFound(error.message);
      }
      return apiResponse.internalError();
    }
  }

  /**
   * Delete Payment Method (Admin)
   */
  async deletePaymentMethod(request: Request, id: string) {
    try {
      await this.deletePaymentMethodUseCase.execute(id);

      return apiResponse.success({
        data: { success: true },
        message: "Payment method deleted successfully"
      });
    } catch (error: any) {
      console.error("Delete payment method error:", error);
      if (error.message === "Payment method not found") {
        return apiResponse.notFound(error.message);
      }
      return apiResponse.internalError();
    }
  }
}
