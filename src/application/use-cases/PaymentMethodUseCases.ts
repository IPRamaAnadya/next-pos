/**
 * Application Use Cases: Payment Method Operations
 * Contains business logic for payment method operations
 */

import { PaymentMethodRepository } from "@/domain/repositories/PaymentMethodRepository";
import { PaymentMethod } from "@/domain/entities/PaymentMethod";

/**
 * Get Active Payment Methods Use Case
 */
export class GetActivePaymentMethodsUseCase {
  constructor(private paymentMethodRepository: PaymentMethodRepository) {}

  async execute(): Promise<PaymentMethod[]> {
    return await this.paymentMethodRepository.findAllActive();
  }
}

/**
 * Get Payment Method Detail Use Case
 */
export class GetPaymentMethodDetailUseCase {
  constructor(private paymentMethodRepository: PaymentMethodRepository) {}

  async execute(id: string): Promise<PaymentMethod> {
    const paymentMethod = await this.paymentMethodRepository.findById(id);

    if (!paymentMethod) {
      throw new Error("Payment method not found");
    }

    return paymentMethod;
  }
}

/**
 * Get All Payment Methods (Admin) Use Case
 */
export class GetAllPaymentMethodsUseCase {
  constructor(private paymentMethodRepository: PaymentMethodRepository) {}

  async execute(): Promise<PaymentMethod[]> {
    return await this.paymentMethodRepository.findAll();
  }
}

/**
 * Create Payment Method (Admin) Use Case
 */
export class CreatePaymentMethodUseCase {
  constructor(private paymentMethodRepository: PaymentMethodRepository) {}

  async execute(params: {
    name: string;
    code: string;
    type: string;
    transactionFee: number;
    feePercentage?: number;
    taxPercentage?: number;
    minAmount: number;
    maxAmount?: number;
    iconUrl?: string;
    description?: string;
    displayOrder?: number;
  }): Promise<PaymentMethod> {
    // Check if code already exists
    const existing = await this.paymentMethodRepository.findByCode(params.code);

    if (existing) {
      throw new Error("Payment method with this code already exists");
    }

    return await this.paymentMethodRepository.create(params);
  }
}

/**
 * Update Payment Method (Admin) Use Case
 */
export class UpdatePaymentMethodUseCase {
  constructor(private paymentMethodRepository: PaymentMethodRepository) {}

  async execute(
    id: string,
    params: {
      name?: string;
      transactionFee?: number;
      feePercentage?: number;
      taxPercentage?: number;
      minAmount?: number;
      maxAmount?: number;
      isActive?: boolean;
      iconUrl?: string;
      description?: string;
      displayOrder?: number;
    }
  ): Promise<PaymentMethod> {
    // Check if payment method exists
    const existing = await this.paymentMethodRepository.findById(id);

    if (!existing) {
      throw new Error("Payment method not found");
    }

    return await this.paymentMethodRepository.update(id, params);
  }
}

/**
 * Toggle Payment Method Active Status (Admin) Use Case
 */
export class TogglePaymentMethodActiveUseCase {
  constructor(private paymentMethodRepository: PaymentMethodRepository) {}

  async execute(id: string): Promise<PaymentMethod> {
    const existing = await this.paymentMethodRepository.findById(id);

    if (!existing) {
      throw new Error("Payment method not found");
    }

    return await this.paymentMethodRepository.toggleActive(id);
  }
}

/**
 * Delete Payment Method (Admin) Use Case
 */
export class DeletePaymentMethodUseCase {
  constructor(private paymentMethodRepository: PaymentMethodRepository) {}

  async execute(id: string): Promise<void> {
    const existing = await this.paymentMethodRepository.findById(id);

    if (!existing) {
      throw new Error("Payment method not found");
    }

    await this.paymentMethodRepository.delete(id);
  }
}
