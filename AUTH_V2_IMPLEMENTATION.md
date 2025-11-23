# Auth V2 Clean Architecture Implementation

## Overview

This document outlines the complete migration of the authentication system to Clean Architecture V2, following the established patterns and principles.

## 🏗️ Architecture Implementation

### Domain Layer

#### Entities
- **User** (`src/domain/entities/User.ts`)
  - Core user entity with business logic methods
  - Email validation, password validation, account status checks
  - Safe object transformation for API responses

- **AuthSession** (`src/domain/entities/AuthSession.ts`)
  - Authentication session representation with token management
  - Session validation, expiration checks, role/tenant verification
  - Business logic for access control and permissions

- **Tenant** (`src/domain/entities/Tenant.ts`)
  - Tenant entity with validation logic
  - Contact information validation, activation checks
  - User association verification

#### Repository Interfaces
- **UserRepository** (`src/domain/repositories/UserRepository.ts`)
  - CRUD operations for users
  - User-tenant relationship queries
  - Supports both individual user operations and user-with-tenants queries

- **TenantRepository** (`src/domain/repositories/TenantRepository.ts`)
  - Tenant CRUD operations with proper data types
  - Transaction-based tenant creation with related entities

- **AuthRepository** (`src/domain/repositories/AuthRepository.ts`)
  - Token service interfaces (JWT generation/verification)
  - Password service interfaces (hashing/comparison)
  - Authorization service interfaces

#### Domain Services
- **AuthDomainService** (`src/domain/services/AuthDomainService.ts`)
  - Business rule validation for authentication
  - Password strength validation and secure hashing
  - Session and access validation logic

### Application Layer

#### Use Cases
- **AuthUseCases** (`src/application/use-cases/AuthUseCases.ts`)
  - Complete authentication workflows: login, signup, cashier login
  - Token validation and authorization checks
  - User profile management
  - Comprehensive error handling and business logic enforcement

#### Service Container
- **AuthServiceContainer** (`src/application/services/AuthServiceContainer.ts`)
  - Dependency injection for authentication services
  - Singleton pattern implementation
  - Clean service instantiation and management

### Infrastructure Layer

#### Repositories
- **PrismaUserRepository** (`src/infrastructure/repositories/PrismaUserRepository.ts`)
  - Full Prisma implementation of UserRepository interface
  - User-tenant relationship handling
  - Comprehensive error handling and logging

- **PrismaTenantRepository** (`src/infrastructure/repositories/PrismaTenantRepository.ts`)
  - Complete tenant creation with transaction support
  - Automatic setup of related entities (settings, payroll, staff, subscriptions)
  - Proper staff account creation with inherited user credentials

#### Services
- **JwtAuthTokenService** (`src/infrastructure/services/JwtAuthTokenService.ts`)
  - JWT token generation with subscription enrichment
  - Token verification and session creation
  - Automatic subscription limits and expiration handling

- **BcryptPasswordService** (`src/infrastructure/services/BcryptPasswordService.ts`)
  - Secure password hashing with bcrypt
  - Password comparison for authentication
  - Error handling and security best practices

### Presentation Layer

#### DTOs
- **AuthRequestDTO** (`src/presentation/dto/AuthRequestDTO.ts`)
  - Yup validation schemas for all auth endpoints
  - TypeScript type inference for request validation
  - Comprehensive validation rules with proper error messages

- **AuthResponseDTO** (`src/presentation/dto/AuthResponseDTO.ts`)
  - Standardized response formatting using apiResponse utility
  - Consistent error response mapping
  - Proper data transformation for API compatibility

#### Controllers
- **AuthController** (`src/presentation/controllers/AuthController.ts`)
  - Singleton pattern implementation
  - Complete endpoint coverage: login, signup, cashier login, validation
  - Comprehensive error handling and response mapping
  - Role and tenant access validation methods

### API Routes (V2)

#### Endpoints
- `POST /api/v2/auth/login` - Owner/manager login
- `POST /api/v2/auth/signup` - Account registration with tenant creation
- `POST /api/v2/auth/login/cashier` - Staff/cashier login
- `GET /api/v2/auth/validate` - Token validation
- `GET /api/v2/auth/profile` - User profile retrieval

#### Route Implementation
- Thin route layers following Clean Architecture principles
- Singleton controller usage to prevent memory leaks
- Consistent error handling and response formatting

## 🔑 Key Features

### Authentication Flows
1. **Owner Login**
   - Email/password validation
   - Automatic tenant association
   - Subscription limits enrichment
   - JWT token with full user context

2. **User Registration**
   - Account creation with validation
   - Automatic tenant setup with defaults
   - Staff account creation for owner
   - Trial subscription assignment
   - Complete onboarding transaction

3. **Cashier Login**
   - Staff credential validation
   - Tenant-specific access
   - Role-based permissions
   - Limited access token generation

4. **Token Validation**
   - JWT verification and session creation
   - Tenant access validation
   - Role-based access control
   - Subscription status checking

### Security Features
- Bcrypt password hashing with salt rounds
- JWT tokens with subscription context
- Tenant isolation and access control
- Role-based permission system
- Session expiration handling
- Comprehensive input validation

### Business Logic
- User account validation and activation
- Tenant creation with complete setup
- Subscription limit enforcement
- Multi-tenant access control
- Staff account management
- Profile management capabilities

## 🛠️ Utility Integration

### Auth V2 Utils (`src/lib/authV2.ts`)
- **validateAuth()** - Basic authentication validation
- **validateTenantAuth()** - Tenant-specific access validation
- **validateRoleAuth()** - Role-based access validation
- **validateTenantAndRoleAuth()** - Combined validation
- Helper methods for user/tenant ID extraction and role checking

### Usage Examples
```typescript
// Basic auth validation
const authResult = await AuthV2Utils.validateAuth(request);

// Tenant-specific validation
const tenantResult = await AuthV2Utils.validateTenantAuth(request, tenantId);

// Role-based validation
const roleResult = await AuthV2Utils.validateRoleAuth(request, ['owner', 'manager']);

// Combined validation
const combinedResult = await AuthV2Utils.validateTenantAndRoleAuth(
  request, 
  tenantId, 
  ['owner', 'manager']
);
```

## 📋 Migration Benefits

1. **Clean Separation of Concerns**
   - Domain logic isolated from infrastructure
   - Business rules centralized in domain services
   - Clear dependency direction

2. **Enhanced Testability**
   - Interface-based design enables easy mocking
   - Business logic separated from external dependencies
   - Isolated unit testing capabilities

3. **Improved Maintainability**
   - Consistent error handling across all layers
   - Standardized response formatting
   - Clear service boundaries

4. **Better Security**
   - Centralized authentication logic
   - Consistent validation and authorization
   - Secure token and password handling

5. **Scalability**
   - Singleton pattern prevents memory leaks
   - Service container for dependency management
   - Easy extension and modification

## 🚀 Next Steps

1. **Integration Testing**
   - Test all authentication flows
   - Verify token validation across different scenarios
   - Test error handling and edge cases

2. **Migration Planning**
   - Plan gradual migration from V1 to V2 endpoints
   - Update existing routes to use V2 utilities
   - Maintain backward compatibility during transition

3. **Documentation**
   - API endpoint documentation
   - Integration examples for other services
   - Security best practices guide

4. **Monitoring**
   - Add logging for authentication events
   - Monitor token validation performance
   - Track authentication success/failure rates

---

The Auth V2 system is now fully implemented following Clean Architecture principles, providing a robust, secure, and maintainable authentication system for the POS application.