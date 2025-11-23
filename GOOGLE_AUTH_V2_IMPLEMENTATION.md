# Google Authentication V2 Implementation Guide

## Overview

This document outlines the complete Google authentication implementation using Firebase for the Clean Architecture V2 POS system. The implementation supports both new user registration and existing user login through Google OAuth.

## 🔧 Setup & Configuration

### Environment Variables

The following Firebase configuration has been added to `.env`:

```env
# FIREBASE
NEXT_PUBLIC_FIREBASE_API_KEY='AIzaSyCRiiOjN7crixe0qy3BsTe44Zb5UdXCE14'
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN='punipos-byrama.firebaseapp.com'
NEXT_PUBLIC_FIREBASE_PROJECT_ID='punipos-byrama'
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET='punipos-byrama.firebasestorage.app'
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID='337999246000'
NEXT_PUBLIC_FIREBASE_APP_ID='1:337999246000:web:f32c99326e212642ba8175'
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID='G-3C6HNS52HL'
```

### Database Schema Changes

Updated User model in `prisma/schema.prisma`:

```prisma
model User {
  id            String   @id @default(uuid()) @db.Uuid
  email         String   @unique
  password      String
  displayName   String?
  photoURL      String?
  provider      String?  @default("email")
  providerId    String?
  emailVerified Boolean? @default(false)
  createdAt     DateTime @default(now()) @db.Timestamptz(6)
  updatedAt     DateTime @updatedAt @db.Timestamptz(6)
  tenants       Tenant[]

  @@unique([provider, providerId])
}
```

### Dependencies

Added Firebase dependency:
```bash
npm install firebase
```

## 🏗️ Architecture Implementation

### Domain Layer

#### New Entities

**GoogleUser** (`src/domain/entities/GoogleUser.ts`)
- Represents Google user data from Firebase
- Business logic for validation and account creation
- Secure password generation for Google users
- Data transformation methods

**Enhanced User Entity** (`src/domain/entities/User.ts`)
- Added Google authentication fields
- Methods for provider detection and display name handling
- Enhanced safe object transformation

#### Repository Interfaces

**Updated UserRepository** (`src/domain/repositories/UserRepository.ts`)
- Added `findByProviderId()` method
- Enhanced `UserData` interface with Google fields

**New GoogleAuthService Interface** (`src/domain/repositories/AuthRepository.ts`)
- `verifyGoogleToken()` for token verification
- `signInWithGoogle()` for authentication flow

#### Domain Services

**Enhanced AuthDomainService** (`src/domain/services/AuthDomainService.ts`)
- Google user validation methods
- Provider-specific validation logic
- Email verification checks

### Application Layer

#### Use Cases

**Enhanced AuthUseCases** (`src/application/use-cases/AuthUseCases.ts`)
- `googleLogin()` method for complete Google authentication flow
- Handles both new user registration and existing user login
- Automatic tenant creation for new users
- Subscription limits integration

#### Interfaces

**New GoogleLoginRequest** (`src/application/use-cases/interfaces/AuthQueryOptions.ts`)
```typescript
export interface GoogleLoginRequest {
  idToken: string;
  tenantName?: string;
  tenantAddress?: string;
  tenantPhone?: string;
}
```

### Infrastructure Layer

#### Services

**FirebaseGoogleAuthService** (`src/infrastructure/services/FirebaseGoogleAuthService.ts`)
- Firebase authentication integration
- Google token verification
- Error handling for Firebase-specific issues
- User session management

**Enhanced PrismaUserRepository** (`src/infrastructure/repositories/PrismaUserRepository.ts`)
- Support for Google authentication fields
- Provider-based user lookup
- Enhanced user creation and mapping

#### Configuration

**Firebase Setup** (`src/lib/firebase.ts`)
- Firebase app initialization
- Authentication service configuration
- Environment variable integration

### Presentation Layer

#### DTOs

**Enhanced AuthRequestDTO** (`src/presentation/dto/AuthRequestDTO.ts`)
- Google login validation schema
- TypeScript type definitions
- Yup validation rules

**Enhanced AuthResponseDTO** (`src/presentation/dto/AuthResponseDTO.ts`)
- Google login response mapping
- New user indication
- Enhanced user data formatting

#### Controllers

**Enhanced AuthController** (`src/presentation/controllers/AuthController.ts`)
- `googleLogin()` method
- Comprehensive error handling
- Firebase-specific error mapping

### API Routes

**New Google Login Endpoint**
- `POST /api/v2/auth/login/google`
- Clean Architecture compliance
- Singleton controller pattern

## 🔑 API Usage

### Google Login Endpoint

**POST** `/api/v2/auth/login/google`

**Request Body:**
```json
{
  "idToken": "eyJhbGciOiJSUzI1NiIs...",
  "tenantName": "My Business", // Optional, for new users
  "tenantAddress": "123 Main St", // Optional  
  "tenantPhone": "+1234567890" // Optional
}
```

**Response (Existing User):**
```json
{
  "meta": {
    "success": true,
    "message": "Google login successful",
    "code": 200
  },
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": "uuid",
      "email": "user@gmail.com",
      "display_name": "John Doe",
      "photo_url": "https://lh3.googleusercontent.com/...",
      "provider": "google",
      "email_verified": true,
      "tenant_id": "tenant-uuid",
      "tenant_name": "My Business",
      "role": "owner",
      "limits": {...}
    },
    "is_new_user": false
  }
}
```

**Response (New User):**
```json
{
  "meta": {
    "success": true,
    "message": "Google account created successfully",
    "code": 200
  },
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": "new-uuid",
      "email": "newuser@gmail.com",
      "display_name": "Jane Doe",
      "photo_url": "https://lh3.googleusercontent.com/...",
      "provider": "google",
      "email_verified": true,
      "tenant_id": "new-tenant-uuid",
      "tenant_name": "Jane's Business",
      "role": "owner",
      "limits": {...}
    },
    "is_new_user": true
  }
}
```

## 🖥️ Client-Side Integration

### Google Auth Client

**GoogleAuthClient** (`src/lib/googleAuth.ts`)
- Firebase popup authentication
- Token management
- Error handling
- State change listeners

### API Client

**AuthAPIClient** (`src/lib/authAPI.ts`)
- Complete authentication API wrapper
- Google sign-in flow automation
- Token storage management
- Logout functionality

### Usage Examples

#### Simple Google Login
```typescript
import { AuthAPIClient } from '@/lib/authAPI';

try {
  const result = await AuthAPIClient.signInWithGoogle();
  
  // Store token
  AuthAPIClient.storeToken(result.token);
  
  console.log('Login successful:', result.user);
  
  if (result.is_new_user) {
    console.log('Welcome! Your account has been created.');
  }
} catch (error) {
  console.error('Login failed:', error.message);
}
```

#### Google Login with Tenant Info (for new users)
```typescript
try {
  const result = await AuthAPIClient.signInWithGoogle({
    tenantName: 'My Restaurant',
    tenantAddress: '123 Main Street',
    tenantPhone: '+1234567890'
  });
  
  AuthAPIClient.storeToken(result.token);
} catch (error) {
  console.error('Login failed:', error.message);
}
```

#### Manual Flow
```typescript
import { GoogleAuthClient, AuthAPIClient } from '@/lib/googleAuth';

try {
  // Step 1: Get Google credentials
  const googleResult = await GoogleAuthClient.signInWithGoogle();
  
  // Step 2: Send to backend
  const authResult = await AuthAPIClient.googleLogin({
    idToken: googleResult.idToken,
    tenantName: 'My Business' // Optional
  });
  
  // Step 3: Store token
  AuthAPIClient.storeToken(authResult.token);
} catch (error) {
  console.error('Authentication failed:', error.message);
}
```

## 🔐 Security Features

### Token Verification
- Firebase ID token verification
- Email verification requirement
- Provider validation
- Secure password generation for Google users

### Error Handling
- Firebase-specific error mapping
- Rate limiting protection
- Network error handling
- User-friendly error messages

### Data Protection
- Secure user data mapping
- Provider isolation
- Email uniqueness enforcement
- Password security for mixed accounts

## 🔄 Authentication Flow

### New User Flow
1. User clicks "Sign in with Google"
2. Firebase popup opens for Google OAuth
3. User grants permissions and authenticates
4. Firebase returns ID token
5. Backend verifies token with Firebase
6. New user account created in database
7. Tenant created (if tenant info provided)
8. JWT token generated with user and tenant info
9. Client receives token and user data

### Existing User Flow
1. User clicks "Sign in with Google"
2. Firebase popup opens for Google OAuth
3. User authenticates with Google
4. Firebase returns ID token
5. Backend verifies token with Firebase
6. User account updated with Google provider info (if needed)
7. Existing tenants retrieved
8. JWT token generated with user and tenant info
9. Client receives token and user data

## 🧪 Testing Considerations

### Unit Tests
- GoogleUser entity validation
- AuthDomainService Google validation
- FirebaseGoogleAuthService token verification
- AuthUseCases Google login flow

### Integration Tests
- Complete Google authentication flow
- New user creation with tenant setup
- Existing user Google provider update
- Error scenarios and edge cases

### End-to-End Tests
- Frontend Google sign-in popup
- Backend token verification
- Database user and tenant creation
- JWT token generation and validation

## 🚀 Deployment Notes

### Environment Setup
- Ensure all Firebase environment variables are set
- Configure Firebase project settings
- Set up OAuth consent screen in Google Cloud Console
- Add authorized domains in Firebase console

### Security Considerations
- Enable Firebase security rules
- Configure CORS policies
- Set up proper error logging
- Monitor authentication attempts

## 📝 Migration Guide

### For Existing Users
- Existing email users can link Google accounts
- Provider field updated automatically
- Maintains existing tenant relationships
- Preserves all user data and settings

### Database Migration
```sql
-- Migration already created: 20251115171250_add_google_auth_fields
-- Adds: displayName, photoURL, provider, providerId, emailVerified
-- Creates unique constraint on (provider, providerId)
```

---

The Google Authentication V2 system is now fully implemented and ready for production use, providing seamless integration with Firebase Google OAuth while maintaining Clean Architecture principles and backward compatibility with existing authentication methods.