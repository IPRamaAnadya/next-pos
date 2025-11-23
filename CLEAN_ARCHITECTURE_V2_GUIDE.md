# Clean Architecture V2 Implementation Guide

## Overview

This document outlines the clean architecture pattern implemented for the Order feature in our Next.js POS system. **All new v2 features must follow this exact structure** to ensure consistency, maintainability, and scalability.

## Architecture Layers

Our clean architecture consists of 4 main layers:

```text
src/
├── domain/                    # Layer 1: Domain (Business Logic)
├── application/              # Layer 2: Application (Use Cases)
├── infrastructure/           # Layer 3: Infrastructure (Data Access)
└── presentation/            # Layer 4: Presentation (Controllers & DTOs)
```

### Dependency Direction

```text
Presentation → Application → Domain
Infrastructure → Domain
```

## 📁 Directory Structure Template

For any new feature (e.g., `Product`, `Customer`, `Staff`), follow this structure:

```text
src/
├── domain/
│   ├── entities/
│   │   └── [Feature].ts                    # Domain entity
│   ├── repositories/
│   │   └── [Feature]Repository.ts          # Repository interface
│   └── services/
│       └── [Feature]DomainService.ts       # Domain business logic
├── application/
│   ├── use-cases/
│   │   ├── [Feature]UseCases.ts            # Application use cases
│   │   └── interfaces/
│   │       └── [Feature]QueryOptions.ts    # Query options interface
│   └── services/
│       └── [Feature]ServiceContainer.ts    # Dependency injection
├── infrastructure/
│   └── repositories/
│       └── Prisma[Feature]Repository.ts    # Prisma implementation
├── presentation/
│   ├── controllers/
│   │   └── [Feature]Controller.ts          # HTTP controllers
│   └── dto/
│       ├── [Feature]RequestDTO.ts          # Request validation
│       └── [Feature]ResponseDTO.ts         # Response formatting
└── app/
    └── api/
        └── v2/
            └── tenants/
                └── [tenantId]/
                    └── [features]/
                        └── route.ts         # API route (thin layer)
```

## 🏗️ Implementation Steps

### Step 1: Domain Layer

#### 1.1 Create Domain Entity (`src/domain/entities/[Feature].ts`)

```typescript
export class Feature {
  constructor(
    public readonly id: string,
    public readonly tenantId: string,
    public readonly name: string,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    // ... other properties
  ) {}

  // Business logic methods (if any)
  public isValid(): boolean {
    return this.name.length > 0;
  }
}
```

#### 1.2 Create Repository Interface (`src/domain/repositories/[Feature]Repository.ts`)

```typescript
import { Feature } from '../entities/Feature';
import { FeatureQueryOptions } from '../../application/use-cases/interfaces/FeatureQueryOptions';

export interface FeatureRepository {
  findById(id: string, tenantId: string): Promise<Feature | null>;
  findAll(tenantId: string, options: FeatureQueryOptions): Promise<PaginatedFeatures>;
  create(feature: Omit<Feature, 'id' | 'createdAt' | 'updatedAt'>): Promise<Feature>;
  update(id: string, tenantId: string, updates: Partial<Feature>): Promise<Feature>;
  delete(id: string, tenantId: string): Promise<void>;
}

export interface PaginatedFeatures {
  data: Feature[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
```

#### 1.3 Create Domain Service (Optional - `src/domain/services/[Feature]DomainService.ts`)

```typescript
export class FeatureDomainService {
  static validateBusinessRules(feature: Feature): void {
    if (!feature.isValid()) {
      throw new Error('Invalid feature data');
    }
    // Additional business validation
  }
}
```

### Step 2: Application Layer

#### 2.1 Create Query Options Interface (`src/application/use-cases/interfaces/[Feature]QueryOptions.ts`)

```typescript
export interface FeatureQueryOptions {
  limit: number;
  page: number;
  sortBy: string;
  sortDir: 'asc' | 'desc';
  filters?: {
    name?: string;
    status?: string;
    // ... other filters
  };
}
```

#### 2.2 Create Use Cases (`src/application/use-cases/[Feature]UseCases.ts`)

```typescript
import { Feature } from '../../domain/entities/Feature';
import { FeatureRepository } from '../../domain/repositories/FeatureRepository';
import { FeatureQueryOptions } from './interfaces/FeatureQueryOptions';

export class FeatureUseCases {
  private static instance: FeatureUseCases;

  private constructor(private featureRepository: FeatureRepository) {}

  public static getInstance(featureRepository: FeatureRepository): FeatureUseCases {
    if (!FeatureUseCases.instance) {
      FeatureUseCases.instance = new FeatureUseCases(featureRepository);
    }
    return FeatureUseCases.instance;
  }

  async getFeatures(tenantId: string, options: FeatureQueryOptions) {
    return await this.featureRepository.findAll(tenantId, options);
  }

  async getFeatureById(id: string, tenantId: string) {
    const feature = await this.featureRepository.findById(id, tenantId);
    if (!feature) {
      throw new Error('Feature not found');
    }
    return feature;
  }

  async createFeature(data: Omit<Feature, 'id' | 'createdAt' | 'updatedAt'>) {
    // Business validation
    if (!data.name || data.name.trim().length === 0) {
      throw new Error('Feature name is required');
    }
    
    return await this.featureRepository.create(data);
  }

  async updateFeature(id: string, tenantId: string, updates: Partial<Feature>) {
    const existingFeature = await this.getFeatureById(id, tenantId);
    return await this.featureRepository.update(id, tenantId, updates);
  }

  async deleteFeature(id: string, tenantId: string) {
    await this.getFeatureById(id, tenantId); // Ensure exists
    await this.featureRepository.delete(id, tenantId);
  }
}
```

#### 2.3 Create Service Container (`src/application/services/[Feature]ServiceContainer.ts`)

```typescript
import { FeatureUseCases } from '../use-cases/FeatureUseCases';
import { PrismaFeatureRepository } from '../../infrastructure/repositories/PrismaFeatureRepository';

export class FeatureServiceContainer {
  private static featureUseCases: FeatureUseCases;

  static getFeatureUseCases(): FeatureUseCases {
    if (!this.featureUseCases) {
      const featureRepository = PrismaFeatureRepository.getInstance();
      this.featureUseCases = FeatureUseCases.getInstance(featureRepository);
    }
    return this.featureUseCases;
  }
}
```

### Step 3: Infrastructure Layer

#### 3.1 Create Prisma Repository (`src/infrastructure/repositories/Prisma[Feature]Repository.ts`)

```typescript
import { Feature } from '../../domain/entities/Feature';
import { FeatureRepository, PaginatedFeatures } from '../../domain/repositories/FeatureRepository';
import { FeatureQueryOptions } from '../../application/use-cases/interfaces/FeatureQueryOptions';
import prisma from '@/lib/prisma';

export class PrismaFeatureRepository implements FeatureRepository {
  private static instance: PrismaFeatureRepository;

  private constructor() {}

  public static getInstance(): PrismaFeatureRepository {
    if (!PrismaFeatureRepository.instance) {
      PrismaFeatureRepository.instance = new PrismaFeatureRepository();
    }
    return PrismaFeatureRepository.instance;
  }

  // Field mapping for API compatibility
  private fieldMapping: Record<string, string> = {
    'created_at': 'createdAt',
    'updated_at': 'updatedAt',
    'tenant_id': 'tenantId',
    // Add all API field mappings here
  };

  private validSortFields = new Set([
    'id', 'tenantId', 'name', 'createdAt', 'updatedAt'
    // Add all valid sort fields here
  ]);

  private mapSortField(apiFieldName: string): string {
    // First check if it's already a valid Prisma field name
    if (this.validSortFields.has(apiFieldName)) {
      return apiFieldName;
    }
    
    // Then check if we have a mapping from API field name to Prisma field name
    const mappedField = this.fieldMapping[apiFieldName];
    if (mappedField && this.validSortFields.has(mappedField)) {
      return mappedField;
    }
    
    // Default to createdAt for invalid field names
    console.warn(`Invalid sort field: ${apiFieldName}, defaulting to createdAt`);
    return 'createdAt';
  }

  async findById(id: string, tenantId: string): Promise<Feature | null> {
    try {
      const feature = await prisma.feature.findUnique({
        where: { id, tenantId },
      });

      if (!feature) return null;
      return this.mapToEntity(feature);
    } catch (error) {
      console.error('Error finding feature by ID:', error);
      throw new Error(`Failed to find feature with ID: ${id}`);
    }
  }

  async findAll(tenantId: string, options: FeatureQueryOptions): Promise<PaginatedFeatures> {
    try {
      const { limit, page, sortBy, sortDir, filters } = options;
      
      const whereClause: any = { tenantId };
      
      // Apply filters
      if (filters?.name) {
        whereClause.name = { contains: filters.name, mode: 'insensitive' };
      }

      const totalCount = await prisma.feature.count({ where: whereClause });
      const totalPages = Math.ceil(totalCount / limit);
      
      // Map the sort field to the correct Prisma field name
      const mappedSortField = this.mapSortField(sortBy);
      
      const features = await prisma.feature.findMany({
        where: whereClause,
        take: limit,
        skip: (page - 1) * limit,
        orderBy: { [mappedSortField]: sortDir },
      });

      return {
        data: features.map(this.mapToEntity),
        pagination: {
          total: totalCount,
          page,
          limit,
          totalPages,
        },
      };
    } catch (error) {
      console.error('Error finding features:', error);
      throw new Error('Failed to retrieve features');
    }
  }

  async create(data: Omit<Feature, 'id' | 'createdAt' | 'updatedAt'>): Promise<Feature> {
    const feature = await prisma.feature.create({
      data: {
        ...data,
      },
    });
    return this.mapToEntity(feature);
  }

  async update(id: string, tenantId: string, updates: Partial<Feature>): Promise<Feature> {
    const feature = await prisma.feature.update({
      where: { id, tenantId },
      data: updates,
    });
    return this.mapToEntity(feature);
  }

  async delete(id: string, tenantId: string): Promise<void> {
    await prisma.feature.delete({
      where: { id, tenantId },
    });
  }

  private mapToEntity(data: any): Feature {
    return new Feature(
      data.id,
      data.tenantId,
      data.name,
      data.createdAt,
      data.updatedAt,
      // ... other properties
    );
  }
}
```

### Step 4: Presentation Layer

#### 4.1 Create Request DTO (`src/presentation/dto/[Feature]RequestDTO.ts`)

```typescript
import * as yup from 'yup';

export const createFeatureSchema = yup.object({
  name: yup.string().required('Name is required').min(1, 'Name cannot be empty'),
  // ... other validation rules
});

export const updateFeatureSchema = yup.object({
  name: yup.string().optional().min(1, 'Name cannot be empty'),
  // ... other validation rules
});

export const featureQuerySchema = yup.object({
  p_limit: yup.number().optional().min(1).max(100).default(10),
  p_page: yup.number().optional().min(1).default(1),
  p_sort_by: yup.string().optional().default('created_at'),
  p_sort_dir: yup.string().optional().oneOf(['asc', 'desc']).default('desc'),
  p_name: yup.string().optional(),
  // ... other query parameters
});

export type CreateFeatureRequest = yup.InferType<typeof createFeatureSchema>;
export type UpdateFeatureRequest = yup.InferType<typeof updateFeatureSchema>;
export type FeatureQueryRequest = yup.InferType<typeof featureQuerySchema>;
```

#### 4.2 Create Response DTO (`src/presentation/dto/[Feature]ResponseDTO.ts`)

```typescript
import { Feature } from '../../domain/entities/Feature';
import { PaginatedFeatures } from '../../domain/repositories/FeatureRepository';
import { apiResponse } from '@/app/api/utils/response';

export class FeatureResponseDTO {
  static mapToResponse(feature: Feature) {
    return {
      id: feature.id,
      tenant_id: feature.tenantId,
      name: feature.name,
      created_at: feature.createdAt.toISOString(),
      updated_at: feature.updatedAt.toISOString(),
      // ... other mapped properties
    };
  }

  static mapPaginatedResponse(paginatedFeatures: PaginatedFeatures) {
    return apiResponse.success({
      data: paginatedFeatures.data.map(this.mapToResponse),
      message: 'Features retrieved successfully',
      pagination: {
        page: paginatedFeatures.pagination.page,
        pageSize: paginatedFeatures.pagination.limit,
        total: paginatedFeatures.pagination.total,
      },
    });
  }

  static mapSingleResponse(feature: Feature) {
    return apiResponse.success({
      data: this.mapToResponse(feature),
      message: 'Feature retrieved successfully',
    });
  }

  static mapCreatedResponse(feature: Feature) {
    return apiResponse.success({
      data: this.mapToResponse(feature),
      message: 'Feature created successfully',
    });
  }

  static mapUpdatedResponse(feature: Feature) {
    return apiResponse.success({
      data: this.mapToResponse(feature),
      message: 'Feature updated successfully',
    });
  }

  static mapDeletedResponse() {
    return apiResponse.success({
      data: {},
      message: 'Feature deleted successfully',
    });
  }
}
```

#### 4.3 Create Controller (`src/presentation/controllers/[Feature]Controller.ts`)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { FeatureServiceContainer } from '../../application/services/FeatureServiceContainer';
import { FeatureResponseDTO } from '../dto/FeatureResponseDTO';
import { 
  createFeatureSchema, 
  updateFeatureSchema, 
  featureQuerySchema,
  CreateFeatureRequest,
  UpdateFeatureRequest 
} from '../dto/FeatureRequestDTO';
import { verifyToken } from '@/app/api/utils/jwt';
import { apiResponse } from '@/app/api/utils/response';

export class FeatureController {
  private static instance: FeatureController;

  private constructor() {}

  public static getInstance(): FeatureController {
    if (!FeatureController.instance) {
      FeatureController.instance = new FeatureController();
    }
    return FeatureController.instance;
  }

  async getFeatures(req: NextRequest, tenantId: string) {
    try {
      // Verify token and tenant access
      const token = req.headers.get('authorization')?.split(' ')[1];
      const decoded: any = verifyToken(token as string);
      
      if (decoded.tenantId !== tenantId) {
        return NextResponse.json(
          createResponse('Unauthorized: Tenant ID mismatch', null),
          { status: 403 }
        );
      }

      // Parse and validate query parameters
      const { searchParams } = new URL(req.url);
      const queryParams = {
        p_limit: parseInt(searchParams.get('p_limit') || '10'),
        p_page: parseInt(searchParams.get('p_page') || '1'),
        p_sort_by: searchParams.get('p_sort_by') || 'created_at',
        p_sort_dir: searchParams.get('p_sort_dir') || 'desc',
        p_name: searchParams.get('p_name') || undefined,
      };

      const validatedQuery = await featureQuerySchema.validate(queryParams);

      const options = {
        limit: validatedQuery.p_limit,
        page: validatedQuery.p_page,
        sortBy: validatedQuery.p_sort_by,
        sortDir: validatedQuery.p_sort_dir as 'asc' | 'desc',
        filters: {
          name: validatedQuery.p_name,
        },
      };

      const featureUseCases = FeatureServiceContainer.getFeatureUseCases();
      const result = await featureUseCases.getFeatures(tenantId, options);

      return FeatureResponseDTO.mapPaginatedResponse(result);
    } catch (error: any) {
      console.error('Get features error:', error);
      
      if (error.name === 'ValidationError') {
        return apiResponse.validationError(error.errors.map((err: any) => ({ field: err.path, message: err.message })));
      }

      return apiResponse.internalError();
    }
  }

  async getFeatureById(req: NextRequest, tenantId: string, featureId: string) {
    try {
      // Verify token and tenant access
      const token = req.headers.get('authorization')?.split(' ')[1];
      const decoded: any = verifyToken(token as string);
      
      if (decoded.tenantId !== tenantId) {
        return NextResponse.json(
          createResponse('Unauthorized: Tenant ID mismatch', null),
          { status: 403 }
        );
      }

      const featureUseCases = FeatureServiceContainer.getFeatureUseCases();
      const feature = await featureUseCases.getFeatureById(featureId, tenantId);

      return FeatureResponseDTO.mapSingleResponse(feature);
    } catch (error: any) {
      console.error('Get feature by ID error:', error);
      
      if (error.message === 'Feature not found') {
        return apiResponse.notFound('Feature not found');
      }

      return apiResponse.internalError();
    }
  }

  async createFeature(req: NextRequest, tenantId: string) {
    try {
      // Verify token and tenant access
      const token = req.headers.get('authorization')?.split(' ')[1];
      const decoded: any = verifyToken(token as string);
      
      if (decoded.tenantId !== tenantId) {
        return NextResponse.json(
          createResponse('Unauthorized: Tenant ID mismatch', null),
          { status: 403 }
        );
      }

      const body = await req.json();
      const validatedData: CreateFeatureRequest = await createFeatureSchema.validate(body);

      const featureData = {
        ...validatedData,
        tenantId,
      };

      const featureUseCases = FeatureServiceContainer.getFeatureUseCases();
      const feature = await featureUseCases.createFeature(featureData);

      return FeatureResponseDTO.mapSingleResponse(feature);
    } catch (error: any) {
      console.error('Create feature error:', error);
      
      if (error.name === 'ValidationError') {
        return apiResponse.validationError(error.errors.map((err: any) => ({ field: err.path, message: err.message })));
      }

      if (error.message.includes('required') || error.message.includes('Invalid')) {
        return apiResponse.validationError([{ field: 'general', message: error.message }]);
      }

      return apiResponse.internalError();
    }
  }

  async updateFeature(req: NextRequest, tenantId: string, featureId: string) {
    try {
      // Verify token and tenant access
      const token = req.headers.get('authorization')?.split(' ')[1];
      const decoded: any = verifyToken(token as string);
      
      if (decoded.tenantId !== tenantId) {
        return NextResponse.json(
          createResponse('Unauthorized: Tenant ID mismatch', null),
          { status: 403 }
        );
      }

      const body = await req.json();
      const validatedData: UpdateFeatureRequest = await updateFeatureSchema.validate(body);

      const featureUseCases = FeatureServiceContainer.getFeatureUseCases();
      const feature = await featureUseCases.updateFeature(featureId, tenantId, validatedData);

      return FeatureResponseDTO.mapSingleResponse(feature);
    } catch (error: any) {
      console.error('Update feature error:', error);
      
      if (error.message === 'Feature not found') {
        return apiResponse.notFound('Feature not found');
      }

      if (error.name === 'ValidationError') {
        return apiResponse.validationError(error.errors.map((err: any) => ({ field: err.path, message: err.message })));
      }

      return apiResponse.internalError();
    }
  }

  async deleteFeature(req: NextRequest, tenantId: string, featureId: string) {
    try {
      // Verify token and tenant access
      const token = req.headers.get('authorization')?.split(' ')[1];
      const decoded: any = verifyToken(token as string);
      
      if (decoded.tenantId !== tenantId) {
        return NextResponse.json(
          createResponse('Unauthorized: Tenant ID mismatch', null),
          { status: 403 }
        );
      }

      const featureUseCases = FeatureServiceContainer.getFeatureUseCases();
      await featureUseCases.deleteFeature(featureId, tenantId);

      return FeatureResponseDTO.mapDeletedResponse();
    } catch (error: any) {
      console.error('Delete feature error:', error);
      
      if (error.message === 'Feature not found') {
        return apiResponse.notFound('Feature not found');
      }

      return apiResponse.internalError();
    }
  }
}
```

### Step 5: API Routes

#### 5.1 Create API Routes (`src/app/api/v2/tenants/[tenantId]/[features]/route.ts`)

```typescript
import { NextRequest } from 'next/server';
import { FeatureController } from '../../../../../../presentation/controllers/FeatureController';

// Use singleton to prevent memory leaks
const getFeatureController = () => FeatureController.getInstance();

export async function GET(
  req: NextRequest,
  { params }: { params: { tenantId: string } }
) {
  const { tenantId } = await params;
  const featureController = getFeatureController();
  return await featureController.getFeatures(req, tenantId);
}

export async function POST(
  req: NextRequest,
  { params }: { params: { tenantId: string } }
) {
  const { tenantId } = await params;
  const featureController = getFeatureController();
  return await featureController.createFeature(req, tenantId);
}
```

#### 5.2 Create Individual Resource Route (`src/app/api/v2/tenants/[tenantId]/[features]/[featureId]/route.ts`)

```typescript
import { NextRequest } from 'next/server';
import { FeatureController } from '../../../../../../../presentation/controllers/FeatureController';

// Use singleton to prevent memory leaks
const getFeatureController = () => FeatureController.getInstance();

export async function GET(
  req: NextRequest,
  { params }: { params: { tenantId: string; featureId: string } }
) {
  const { tenantId, featureId } = await params;
  const featureController = getFeatureController();
  return await featureController.getFeatureById(req, tenantId, featureId);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { tenantId: string; featureId: string } }
) {
  const { tenantId, featureId } = await params;
  const featureController = getFeatureController();
  return await featureController.updateFeature(req, tenantId, featureId);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { tenantId: string; featureId: string } }
) {
  const { tenantId, featureId } = await params;
  const featureController = getFeatureController();
  return await featureController.deleteFeature(req, tenantId, featureId);
}
```

## 🔑 Key Principles

### 1. Singleton Pattern

- **All repositories, use cases, and controllers must use the singleton pattern**
- This prevents memory leaks and ensures consistent instances across requests
- Always implement `getInstance()` static method

### 2. Field Mapping

- **Always implement field mapping in repositories**
- Map API field names (snake_case) to Prisma field names (camelCase)
- Include comprehensive field validation
- Provide fallback for invalid sort fields

### 3. Error Handling

- **Implement comprehensive error handling at every layer**
- Repository layer: Database errors
- Use case layer: Business logic errors
- Controller layer: HTTP errors and validation errors
- Always log errors for debugging

### 4. Validation

- **Use Yup for request validation**
- Validate at the presentation layer (DTOs)
- Separate schemas for create/update/query operations
- Include proper TypeScript types

### 5. Response Formatting

- **Always use the centralized response utility**
- **IMPORTANT: Never wrap apiResponse with NextResponse.json() - apiResponse already returns NextResponse**
- Consistent response structure across all endpoints
- Proper HTTP status codes
- Map domain entities to API response format

### 6. Authentication & Authorization

- **Always verify JWT tokens**
- Check tenant ID matches between token and URL
- Return proper error responses for unauthorized access

## 📋 Checklist for New Features

- [ ] Domain entity created with business logic
- [ ] Repository interface defined
- [ ] Repository implementation with field mapping
- [ ] Use cases implemented with error handling
- [ ] Service container for dependency injection
- [ ] Request DTOs with Yup validation
- [ ] Response DTOs with proper mapping
- [ ] Controller with singleton pattern
- [ ] API routes as thin layers
- [ ] Comprehensive error handling
- [ ] Field mapping for API compatibility
- [ ] JWT authentication verification
- [ ] Tenant ID validation
- [ ] Proper TypeScript types throughout

## 🚀 Benefits of This Architecture

1. **Maintainability**: Clear separation of concerns
2. **Testability**: Each layer can be tested independently
3. **Scalability**: Easy to add new features following the same pattern
4. **Consistency**: Standardized structure across all features
5. **Performance**: Singleton pattern prevents memory leaks
6. **Flexibility**: Easy to switch implementations (e.g., from Prisma to another ORM)

## 📖 Reference Implementation

See the Order feature implementation as the complete reference:

- `src/domain/entities/Order.ts`
- `src/infrastructure/repositories/PrismaOrderRepository.ts`
- `src/application/use-cases/OrderUseCases.ts`
- `src/presentation/controllers/OrderController.ts`
- `src/app/api/v2/tenants/[tenantId]/orders/route.ts`

---

**Remember: Consistency is key!** Every v2 feature must follow this exact pattern to maintain code quality and developer experience.
