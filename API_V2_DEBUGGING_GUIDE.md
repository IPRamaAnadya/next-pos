# API V2 Debugging Guide

## Issue: Tenant Creation Error with Empty Validation Message

### Problem Description
When creating a tenant, you're getting a validation error but the error message is empty:

```json
{
    "meta": {
        "message": "Validation failed",
        "success": false,
        "code": 400,
        "errors": [
            {}
        ]
    },
    "data": null,
    "pagination": null
}
```

### Root Causes & Solutions

#### 1. Missing or Invalid JWT Token
**Problem**: The most common cause is missing or invalid authentication token.

**Solution**: 
1. First, login to get a valid token:
   ```
   POST {{base_url}}/api/v2/auth/login
   {
     "email": "testuser@example.com",
     "password": "TestPassword123"
   }
   ```

2. Copy the `accessToken` from the response
3. Set it as the `access_token` variable in Postman
4. Ensure the Authorization header is set: `Bearer {{access_token}}`

#### 2. Invalid Request Payload Format
**Problem**: Boolean values or other data types not properly formatted.

**Corrected Payload**:
```json
{
  "userId": "{{user_id}}",
  "name": "{{tenant_name}}",
  "email": "{{tenant_email}}",
  "address": "{{tenant_address}}",
  "phone": "{{tenant_phone}}",
  "isSubscribed": false,
  "subscribedUntil": null
}
```

**Key Points**:
- `isSubscribed` should be boolean (`true` or `false`), not string
- `subscribedUntil` should be `null` or valid ISO date string
- `userId` must be a valid user ID that exists in the database

#### 3. User ID Mismatch
**Problem**: The `userId` in the request doesn't match the authenticated user's ID.

**Solution**: 
- Use the same `userId` that was returned in the login response
- Or ensure you have admin role to create tenants for other users

### Testing Steps

#### Step 1: Authentication
1. Use "User Registration" or "User Login" endpoint
2. Copy the `accessToken` from response
3. Set it in Postman variables: `access_token = your_token_here`

#### Step 2: Get User ID
From the login response, copy the `userId` and set it in Postman variables:
```
user_id = cm123456789abcdef
```

#### Step 3: Create Tenant
Use this exact payload:
```json
{
  "userId": "{{user_id}}",
  "name": "Test Business",
  "email": "business@test.com",
  "address": "123 Test Street",
  "phone": "+1234567890",
  "isSubscribed": false,
  "subscribedUntil": null
}
```

### Common Validation Rules

1. **userId**: Required, must be valid user ID
2. **name**: Required, 1-255 characters
3. **email**: Required, valid email format, max 255 characters
4. **address**: Optional, max 500 characters
5. **phone**: Optional, min 10 characters if provided
6. **isSubscribed**: Optional boolean, defaults to false
7. **subscribedUntil**: Optional date, must be future date if provided

### Debugging Console Logs

Check the server console for detailed error messages:
```
Request body: { userId: "...", name: "...", ... }
Validated data: { userId: "...", name: "...", ... }
Create tenant error: ValidationError: ...
Error name: ValidationError
Error message: userId is required
Error details: [{ path: 'userId', message: 'userId is required' }]
```

### Test with cURL

If Postman isn't working, try with cURL:

```bash
# First login
curl -X POST http://localhost:3000/api/v2/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"testuser@example.com","password":"TestPassword123"}'

# Then create tenant (replace YOUR_TOKEN and USER_ID)
curl -X POST http://localhost:3000/api/v2/tenants \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "userId": "USER_ID",
    "name": "Test Business",
    "email": "business@test.com",
    "address": "123 Test Street",
    "phone": "+1234567890",
    "isSubscribed": false,
    "subscribedUntil": null
  }'
```

### Environment Setup

1. Import `postman_environment_v2.json` in Postman
2. Update variables with your actual values:
   - `base_url`: Your API base URL
   - `user_email`: Valid user email for testing
   - `user_password`: Valid password for testing
   - `user_id`: Will be populated after login

### Expected Success Response

```json
{
  "meta": {
    "message": "Tenant created successfully",
    "success": true,
    "code": 201,
    "errors": []
  },
  "data": {
    "id": "cm...",
    "userId": "cm...",
    "name": "Test Business",
    "email": "business@test.com",
    "address": "123 Test Street",
    "phone": "+1234567890",
    "isSubscribed": false,
    "subscribedUntil": null,
    "createdAt": "2024-11-16T...",
    "updatedAt": "2024-11-16T..."
  },
  "pagination": null
}
```