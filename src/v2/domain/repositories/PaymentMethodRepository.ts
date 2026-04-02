/**
 * Domain Repository Interface: PaymentMethodRepository
 * Defines the contract for payment method data access
 */

import { PaymentMethod } from "../entities/PaymentMethod";

export interface CreatePaymentMethodParams {
  name: string;
  code: string;
  type: string;
  transactionFee: number;
  feePercentage?: number | null;
  taxPercentage?: number | null;
  minAmount: number;
  maxAmount?: number | null;
  iconUrl?: string | null;
  description?: string | null;
  displayOrder?: number;
}

export interface UpdatePaymentMethodParams {
  name?: string;
  transactionFee?: number;
  feePercentage?: number | null;
  taxPercentage?: number | null;
  minAmount?: number;
  maxAmount?: number | null;
  isActive?: boolean;
  iconUrl?: string | null;
  description?: string | null;
  displayOrder?: number;
}

export interface PaymentMethodRepository {
  /**
   * Create a new payment method (admin only)
   */
  create(params: CreatePaymentMethodParams): Promise<PaymentMethod>;

  /**
   * Find payment method by ID
   */
  findById(id: string): Promise<PaymentMethod | null>;

  /**
   * Find payment method by code
   */
  findByCode(code: string): Promise<PaymentMethod | null>;

  /**
   * Find all active payment methods
   */
  findAllActive(): Promise<PaymentMethod[]>;

  /**
   * Find all payment methods (admin only)
   */
  findAll(): Promise<PaymentMethod[]>;

  /**
   * Update payment method
   */
  update(id: string, params: UpdatePaymentMethodParams): Promise<PaymentMethod>;

  /**
   * Delete payment method
   */
  delete(id: string): Promise<void>;

  /**
   * Toggle payment method active status
   */
  toggleActive(id: string): Promise<PaymentMethod>;
}
