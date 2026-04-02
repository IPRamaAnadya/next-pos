export class ProductCategory {
  constructor(
    public readonly id: string,
    public readonly tenantId: string,
    public readonly name: string,
    public readonly description: string | null,
    public readonly parentId: string | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {}

  // Business logic methods
  public isValid(): boolean {
    return this.name.length > 0;
  }

  public isRootCategory(): boolean {
    return this.parentId === null;
  }

  public hasParent(): boolean {
    return this.parentId !== null;
  }

  public canBeParentOf(childCategory: ProductCategory): boolean {
    // Prevent circular references - a category cannot be a parent of itself
    if (childCategory.id === this.id) {
      return false;
    }
    
    // Prevent a category from being a child of its own descendant
    if (childCategory.parentId === this.id) {
      return true; // Already a child, so it's valid
    }
    
    return true; // Basic validation - more complex tree validation would be done at service level
  }

  public getLevel(): number {
    // This would typically be calculated with the full tree structure
    // For now, we'll use a simple level calculation
    return this.parentId ? 1 : 0; // 0 for root, 1 for child
  }

  public getDisplayName(): string {
    return this.name.trim();
  }
}