# V2 Feature Implementation Checklist

## Quick Reference for Clean Architecture Implementation

### 📁 File Structure Checklist

- [ ] `src/domain/entities/[Feature].ts` - Domain entity
- [ ] `src/domain/repositories/[Feature]Repository.ts` - Repository interface  
- [ ] `src/application/use-cases/[Feature]UseCases.ts` - Use cases
- [ ] `src/application/use-cases/interfaces/[Feature]QueryOptions.ts` - Query options
- [ ] `src/application/services/[Feature]ServiceContainer.ts` - DI container
- [ ] `src/infrastructure/repositories/Prisma[Feature]Repository.ts` - Repository implementation
- [ ] `src/presentation/dto/[Feature]RequestDTO.ts` - Request validation
- [ ] `src/presentation/dto/[Feature]ResponseDTO.ts` - Response formatting
- [ ] `src/presentation/controllers/[Feature]Controller.ts` - HTTP controller
- [ ] `src/app/api/v2/tenants/[tenantId]/[features]/route.ts` - API routes
- [ ] `src/app/api/v2/tenants/[tenantId]/[features]/[featureId]/route.ts` - Individual resource routes

### 🔧 Implementation Checklist

#### Domain Layer

- [ ] Domain entity with proper constructor
- [ ] Business logic methods in entity (if needed)
- [ ] Repository interface with CRUD methods
- [ ] Proper TypeScript interfaces for paginated results

#### Application Layer

- [ ] Use cases class with singleton pattern
- [ ] Query options interface with proper types
- [ ] Service container for dependency injection
- [ ] Business validation in use cases

#### Infrastructure Layer

- [ ] Prisma repository with singleton pattern
- [ ] Field mapping dictionary (snake_case to camelCase)
- [ ] `mapSortField()` method with validation
- [ ] Valid sort fields Set
- [ ] Try-catch error handling in all methods
- [ ] `mapToEntity()` private method

#### Presentation Layer

- [ ] Request DTOs with Yup validation schemas
- [ ] Separate schemas for create/update/query
- [ ] Response DTOs with proper field mapping
- [ ] Controller with singleton pattern
- [ ] JWT token verification in all methods
- [ ] Tenant ID validation
- [ ] Proper error handling and status codes
- [ ] API routes as thin wrappers

### 🛡️ Security & Validation Checklist

- [ ] JWT token verification in controllers
- [ ] Tenant ID matching between token and URL
- [ ] Input validation with Yup schemas
- [ ] SQL injection prevention (Prisma handles this)
- [ ] Proper error messages without sensitive data
- [ ] Authentication for all endpoints

### 📝 Code Quality Checklist

- [ ] Consistent naming conventions
- [ ] Proper TypeScript types throughout
- [ ] No `any` types (use proper interfaces)
- [ ] Comprehensive error handling
- [ ] Meaningful error messages
- [ ] Console logging for debugging
- [ ] Clean code principles

### 🚀 Performance Checklist

- [ ] Singleton pattern for all services
- [ ] Efficient database queries
- [ ] Proper pagination implementation
- [ ] Field mapping for API compatibility
- [ ] Memory leak prevention

### 🧪 Testing Considerations

- [ ] Each layer can be tested independently
- [ ] Mock interfaces for testing
- [ ] Repository pattern allows easy mocking
- [ ] Validation schemas are testable
- [ ] Business logic is in domain/use cases

### 📋 API Standards Checklist

- [ ] Consistent response format using `createResponse()`
- [ ] Proper HTTP status codes (200, 201, 400, 404, 500)
- [ ] Pagination metadata in responses
- [ ] Snake_case for API field names
- [ ] CamelCase for internal/database field names
- [ ] RESTful endpoint naming

### 🔍 Field Mapping Template

```typescript
private fieldMapping: Record<string, string> = {
  'created_at': 'createdAt',
  'updated_at': 'updatedAt',
  'tenant_id': 'tenantId',
  // Add feature-specific mappings here
};

private validSortFields = new Set([
  'id', 'tenantId', 'createdAt', 'updatedAt',
  // Add feature-specific fields here
]);
```

### 🎯 Common Patterns

#### Singleton Implementation

```typescript
export class FeatureService {
  private static instance: FeatureService;
  
  public static getInstance(): FeatureService {
    if (!FeatureService.instance) {
      FeatureService.instance = new FeatureService();
    }
    return FeatureService.instance;
  }
}
```

#### Error Handling Pattern

```typescript
try {
  // Implementation
} catch (error) {
  console.error('Operation error:', error);
  throw new Error(`Failed to perform operation: ${error.message}`);
}
```

#### Response Mapping Pattern

```typescript
static mapToResponse(entity: Feature) {
  return {
    id: entity.id,
    tenant_id: entity.tenantId,
    created_at: entity.createdAt.toISOString(),
    // Map all fields
  };
}
```

---

## 🚫 Common Mistakes to Avoid

- ❌ Forgetting singleton pattern
- ❌ Missing field mapping in repositories
- ❌ Not validating tenant ID access
- ❌ Using `any` types instead of proper interfaces
- ❌ Missing error handling in repository methods
- ❌ Inconsistent response formatting
- ❌ Mixing business logic in controllers
- ❌ Missing input validation

## ✅ Success Criteria

- All endpoints return consistent response format
- Field mapping works for all API parameters
- No memory leaks (singleton pattern used)
- Proper error handling at all layers
- Clean separation of concerns
- TypeScript compilation without errors
- All authentication/authorization checks pass

---

**Reference Implementation**: See Order feature for complete example
