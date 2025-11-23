export class Product {
  constructor(
    public readonly id: string,
    public readonly tenantId: string,
    public readonly name: string,
    public readonly description: string | null,
    public readonly price: number,
    public readonly type: string,
    public readonly stock: number | null,
    public readonly sku: string | null,
    public readonly imageUrl: string | null,
    public readonly alias: string | null,
    public readonly productCategoryId: string | null,
    public readonly isCountable: boolean,
    public readonly unit: string,
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {}

  // Business logic methods
  public isValid(): boolean {
    return this.name.length > 0 && this.price >= 0;
  }

  public isInStock(): boolean {
    if (this.type === 'service') return true; // Services don't have stock
    if (!this.isCountable) return true; // Non-countable products are always "in stock"
    if (this.stock === null) return true; // Products without stock tracking are always "in stock"
    return this.stock > 0;
  }

  public canDecreaseStock(quantity: number): boolean {
    if (this.type === 'service') return true; // Services don't have stock
    if (!this.isCountable) return true; // Non-countable products can always be "sold"
    if (this.stock === null) return true; // Products without stock tracking can always be "sold"
    return this.stock >= quantity;
  }

  public getFormattedPrice(): string {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(this.price);
  }

  public isService(): boolean {
    return this.type === 'service';
  }

  public isGood(): boolean {
    return this.type === 'good';
  }
}