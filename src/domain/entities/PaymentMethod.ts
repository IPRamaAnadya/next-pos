/**
 * Domain Entity: Payment Method
 * Represents a payment method available for donations
 */

export class PaymentMethod {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly code: string,
    public readonly type: string,
    public readonly transactionFee: number,
    public readonly feePercentage: number | null,
    public readonly taxPercentage: number | null,
    public readonly minAmount: number,
    public readonly maxAmount: number | null,
    public readonly isActive: boolean,
    public readonly iconUrl: string | null,
    public readonly description: string | null,
    public readonly displayOrder: number,
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {}

  /**
   * Check if payment method is active
   */
  isAvailable(): boolean {
    return this.isActive;
  }

  /**
   * Check if amount is within allowed range
   */
  isAmountValid(amount: number): boolean {
    if (amount < this.minAmount) return false;
    if (this.maxAmount && amount > this.maxAmount) return false;
    return true;
  }

  /**
   * Calculate total fee for a given amount
   * Fee = Fixed Fee + (Amount × Fee Percentage) + (Amount × Tax Percentage)
   */
  calculateTotalFee(amount: number): number {
    let fee = this.transactionFee;
    
    // Add percentage-based fee (e.g., 2% for GoPay)
    if (this.feePercentage && this.feePercentage > 0) {
      fee += (amount * this.feePercentage) / 100;
    }
    
    // Add tax/PPN (e.g., 11% PPN)
    if (this.taxPercentage && this.taxPercentage > 0) {
      fee += (amount * this.taxPercentage) / 100;
    }
    
    return Math.round(fee);
  }

  /**
   * Calculate net amount after deducting fees
   */
  calculateNetAmount(amount: number): number {
    const totalFee = this.calculateTotalFee(amount);
    return amount - totalFee;
  }

  /**
   * Get recommended minimum donation amount (considering transaction fee)
   */
  getRecommendedMinAmount(): number {
    // Recommend at least 3x the transaction fee to make it worthwhile
    const recommendedByFee = this.transactionFee * 3;
    return Math.max(this.minAmount, recommendedByFee);
  }

  /**
   * Check if this is a bank transfer method
   */
  isBankTransfer(): boolean {
    return this.type === "bank_transfer";
  }

  /**
   * Check if this is an e-wallet method
   */
  isEWallet(): boolean {
    return this.type === "ewallet";
  }

  /**
   * Check if this is QRIS
   */
  isQRIS(): boolean {
    return this.type === "qris";
  }
}
