# Customer Messaging V2 Implementation Guide

## 📋 Overview

The Customer Messaging V2 feature provides a flexible, provider-agnostic messaging system for sending WhatsApp messages, SMS, and emails to customers. Built with Clean Architecture principles, it supports multiple providers (Fonnte, Twilio, SendGrid) and offers template-based messaging with customizable variables.

## 🏗️ Architecture

### Clean Architecture Layers

```
src/
├── domain/                          # Business Logic & Entities
│   ├── entities/
│   │   ├── MessageTemplate.ts       # Template entity with variable replacement
│   │   ├── MessagingConfig.ts       # Provider configuration entity
│   │   └── MessageLog.ts            # Message delivery tracking
│   ├── repositories/                # Repository interfaces
│   │   ├── MessageTemplateRepository.ts
│   │   ├── MessagingConfigRepository.ts
│   │   └── MessageLogRepository.ts
│   └── services/
│       └── IMessagingProvider.ts    # Provider interface (strategy pattern)
│
├── application/                     # Use Cases
│   ├── use-cases/
│   │   ├── CustomerMessagingUseCases.ts   # Send messages, get logs
│   │   ├── MessageTemplateUseCases.ts     # CRUD templates
│   │   └── MessagingConfigUseCases.ts     # Manage configs
│   └── services/
│       └── CustomerMessagingServiceContainer.ts  # DI container
│
├── infrastructure/                  # External Services & Data Access
│   ├── repositories/
│   │   ├── PrismaMessageTemplateRepository.ts
│   │   ├── PrismaMessagingConfigRepository.ts
│   │   └── PrismaMessageLogRepository.ts
│   └── services/
│       ├── FonnteProvider.ts        # Fonnte WhatsApp implementation
│       └── MessagingProviderFactory.ts  # Provider factory
│
└── presentation/                    # API Layer
    ├── controllers/
    │   └── CustomerMessagingController.ts
    └── dto/
        ├── CustomerMessagingRequestDTO.ts   # Request validation
        └── CustomerMessagingResponseDTO.ts  # Response formatting
```

### Database Schema

The feature uses existing database tables:
- `TenantNotificationConfig` - Provider configurations
- `NotificationTemplate` - Message templates
- `NotificationLog` - Message delivery logs

**Note:** Database names remain unchanged for production safety.

## 🎯 Features

### ✅ Core Features
- **Multiple Provider Support**: Fonnte (WhatsApp), Twilio, SendGrid, Custom
- **Template Management**: Create, update, delete message templates
- **Variable Replacement**: Dynamic `{{variable}}` placeholders
- **Message Logging**: Track all sent messages with status
- **Provider Testing**: Test connection before activation
- **Flexible Configuration**: Multiple providers per tenant

### ❌ Not Included (by design)
- Scheduled messages
- Bulk messaging
- Message retries
- Message queuing

## 📡 API Endpoints

### Base URL
```
/api/v2/tenants/[tenantId]/messaging
```

### 1. Send Direct Message

**POST** `/api/v2/tenants/[tenantId]/messaging/send`

Send a message without using a template.

**Request Body:**
```json
{
  "provider": "fonnte",
  "recipient": "628123456789",
  "message": "Hello customer, your order is ready!"
}
```

**Response:**
```json
{
  "meta": {
    "message": "Message sent successfully",
    "success": true,
    "code": 200
  },
  "data": {
    "message_log": {
      "id": "uuid",
      "tenant_id": "uuid",
      "config_id": "uuid",
      "recipient": "628123456789",
      "message": "Hello customer, your order is ready!",
      "status": "sent",
      "status_display": "Sent",
      "is_successful": true,
      "sent_at": "2025-11-23T10:00:00Z",
      "created_at": "2025-11-23T10:00:00Z"
    },
    "success": true
  }
}
```

### 2. Send Message with Template

**POST** `/api/v2/tenants/[tenantId]/messaging/send-with-template`

Send a message using a predefined template with variables.

**Request Body:**
```json
{
  "provider": "fonnte",
  "template_id": "template-uuid",
  "recipient": "628123456789",
  "variables": {
    "customerName": "John Doe",
    "orderNumber": "ORD-12345",
    "grandTotal": 150000
  }
}
```

**Response:** Same as Send Direct Message

### 3. Message Templates

#### GET All Templates
**GET** `/api/v2/tenants/[tenantId]/messaging/templates?event=ORDER_CREATED&is_custom=true`

**Query Parameters:**
- `event` (optional): Filter by event type
- `is_custom` (optional): Filter custom vs system templates

**Response:**
```json
{
  "meta": {
    "message": "Templates retrieved successfully",
    "success": true,
    "code": 200
  },
  "data": [
    {
      "id": "uuid",
      "tenant_id": "uuid",
      "name": "Order Created Notification",
      "event": "ORDER_CREATED",
      "message": "Hello {{customerName}}, your order {{orderNumber}} has been created. Total: Rp{{grandTotal}}",
      "is_custom": false,
      "required_variables": ["customerName", "orderNumber", "grandTotal"],
      "created_at": "2025-11-23T10:00:00Z",
      "updated_at": "2025-11-23T10:00:00Z"
    }
  ]
}
```

#### POST Create Template
**POST** `/api/v2/tenants/[tenantId]/messaging/templates`

**Request Body:**
```json
{
  "name": "Order Paid Notification",
  "event": "ORDER_PAID",
  "message": "Hi {{customerName}}, payment received for order {{orderNumber}}. Thank you!",
  "is_custom": true
}
```

#### GET Template by ID
**GET** `/api/v2/tenants/[tenantId]/messaging/templates/[templateId]`

#### PUT Update Template
**PUT** `/api/v2/tenants/[tenantId]/messaging/templates/[templateId]`

**Request Body:**
```json
{
  "name": "Updated Name",
  "message": "Updated message with {{variable}}"
}
```

#### DELETE Template
**DELETE** `/api/v2/tenants/[tenantId]/messaging/templates/[templateId]`

#### POST Preview Template
**POST** `/api/v2/tenants/[tenantId]/messaging/templates/[templateId]/preview`

Test template rendering before sending.

**Request Body:**
```json
{
  "variables": {
    "customerName": "John",
    "orderNumber": "ORD-123"
  }
}
```

**Response:**
```json
{
  "meta": {
    "message": "Template preview generated successfully",
    "success": true,
    "code": 200
  },
  "data": {
    "success": true,
    "rendered_message": "Hi John, payment received for order ORD-123. Thank you!",
    "missing_variables": []
  }
}
```

### 4. Provider Configuration

#### GET All Configs
**GET** `/api/v2/tenants/[tenantId]/messaging/configs`

**Response:**
```json
{
  "meta": {
    "message": "Messaging configurations retrieved successfully",
    "success": true,
    "code": 200
  },
  "data": [
    {
      "id": "uuid",
      "tenant_id": "uuid",
      "provider": "fonnte",
      "provider_name": "Fonnte (WhatsApp)",
      "config": {
        "api_url": "https://api.fonnte.com/send",
        "api_token": "abcd****"
      },
      "is_active": true,
      "is_ready": true,
      "validation_errors": [],
      "created_at": "2025-11-23T10:00:00Z",
      "updated_at": "2025-11-23T10:00:00Z"
    }
  ]
}
```

#### POST Create Config
**POST** `/api/v2/tenants/[tenantId]/messaging/configs`

**Request Body (Fonnte):**
```json
{
  "provider": "fonnte",
  "config": {
    "api_token": "your-fonnte-token",
    "api_url": "https://api.fonnte.com/send"
  },
  "is_active": true
}
```

**Request Body (Twilio - coming soon):**
```json
{
  "provider": "twilio",
  "config": {
    "account_sid": "your-account-sid",
    "auth_token": "your-auth-token",
    "sender_id": "+1234567890"
  },
  "is_active": true
}
```

#### GET Config by ID
**GET** `/api/v2/tenants/[tenantId]/messaging/configs/[configId]`

#### PUT Update Config
**PUT** `/api/v2/tenants/[tenantId]/messaging/configs/[configId]`

**Request Body:**
```json
{
  "config": {
    "api_token": "new-token"
  },
  "is_active": false
}
```

#### DELETE Config
**DELETE** `/api/v2/tenants/[tenantId]/messaging/configs/[configId]`

#### POST Test Config
**POST** `/api/v2/tenants/[tenantId]/messaging/configs/[configId]/test`

Test provider connection without sending messages.

**Response:**
```json
{
  "meta": {
    "message": "Connection test successful",
    "success": true,
    "code": 200
  },
  "data": {
    "success": true,
    "message": "Connection successful. Device is connected."
  }
}
```

### 5. Message Logs

#### GET All Logs
**GET** `/api/v2/tenants/[tenantId]/messaging/logs?page=1&page_size=10&status=sent`

**Query Parameters:**
- `page` (optional, default: 1)
- `page_size` (optional, default: 10, max: 100)
- `config_id` (optional)
- `template_id` (optional)
- `status` (optional): pending, sent, failed, delivered
- `recipient` (optional)
- `start_date` (optional, ISO 8601)
- `end_date` (optional, ISO 8601)

**Response:**
```json
{
  "meta": {
    "message": "Message logs retrieved successfully",
    "success": true,
    "code": 200
  },
  "data": [
    {
      "id": "uuid",
      "tenant_id": "uuid",
      "config_id": "uuid",
      "template_id": "uuid",
      "recipient": "628123456789",
      "message": "Hi John, your order ORD-123 is ready!",
      "status": "sent",
      "status_display": "Sent",
      "provider_response": "{\"status\":true,\"id\":\"msg-123\"}",
      "error_message": null,
      "sent_at": "2025-11-23T10:00:00Z",
      "is_from_template": true,
      "is_successful": true,
      "created_at": "2025-11-23T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 10,
    "total": 50
  }
}
```

#### GET Log by ID
**GET** `/api/v2/tenants/[tenantId]/messaging/logs/[logId]`

### 6. Available Providers (Public)

#### GET Providers
**GET** `/api/v2/messaging/providers`

Get list of available messaging providers (no authentication required).

**Response:**
```json
{
  "meta": {
    "message": "Available providers retrieved successfully",
    "success": true,
    "code": 200
  },
  "data": [
    {
      "type": "fonnte",
      "name": "Fonnte",
      "description": "WhatsApp messaging service",
      "status": "available"
    },
    {
      "type": "twilio",
      "name": "Twilio",
      "description": "SMS and WhatsApp messaging",
      "status": "coming_soon"
    }
  ]
}
```

## 🔧 Usage Examples

### Example 1: Send Order Notification

```typescript
// 1. Create a template
POST /api/v2/tenants/{tenantId}/messaging/templates
{
  "name": "Order Created",
  "event": "ORDER_CREATED",
  "message": "Hi {{customerName}}, your order {{orderNumber}} totaling Rp{{grandTotal}} has been created!",
  "is_custom": false
}

// 2. Send message using template
POST /api/v2/tenants/{tenantId}/messaging/send-with-template
{
  "provider": "fonnte",
  "template_id": "template-uuid",
  "recipient": "628123456789",
  "variables": {
    "customerName": "John Doe",
    "orderNumber": "ORD-12345",
    "grandTotal": "150000"
  }
}
```

### Example 2: Setup Fonnte Provider

```typescript
// 1. Get Fonnte API token from https://fonnte.com

// 2. Create configuration
POST /api/v2/tenants/{tenantId}/messaging/configs
{
  "provider": "fonnte",
  "config": {
    "api_token": "your-fonnte-token-here",
    "api_url": "https://api.fonnte.com/send"
  },
  "is_active": true
}

// 3. Test connection
POST /api/v2/tenants/{tenantId}/messaging/configs/{configId}/test

// 4. Send test message
POST /api/v2/tenants/{tenantId}/messaging/send
{
  "provider": "fonnte",
  "recipient": "628123456789",
  "message": "Test message"
}
```

### Example 3: Monitor Message Logs

```typescript
// Get failed messages
GET /api/v2/tenants/{tenantId}/messaging/logs?status=failed&page=1&page_size=20

// Get messages sent today
GET /api/v2/tenants/{tenantId}/messaging/logs?start_date=2025-11-23T00:00:00Z&end_date=2025-11-23T23:59:59Z

// Get details of specific message
GET /api/v2/tenants/{tenantId}/messaging/logs/{logId}
```

## 🔌 Adding New Providers

To add a new messaging provider (e.g., Twilio, SendGrid):

### Step 1: Create Provider Implementation

```typescript
// src/infrastructure/services/TwilioProvider.ts
import { IMessagingProvider, SendMessageParams, SendMessageResult } from "@/domain/services/IMessagingProvider";

export class TwilioProvider implements IMessagingProvider {
  constructor(config: ProviderConfig) {
    // Initialize Twilio client
  }

  async send(params: SendMessageParams): Promise<SendMessageResult> {
    // Implement Twilio API call
  }

  validateConfig(config: ProviderConfig) {
    // Validate Twilio configuration
  }

  getInfo() {
    return {
      name: "Twilio",
      type: MessagingProvider.TWILIO,
      description: "SMS and WhatsApp messaging",
      supportedChannels: ["SMS", "WhatsApp"],
      requiredConfig: ["account_sid", "auth_token", "sender_id"],
      features: ["SMS", "WhatsApp", "MMS", "Delivery reports"],
    };
  }

  async testConnection() {
    // Test Twilio API connection
  }
}
```

### Step 2: Register in Factory

```typescript
// src/infrastructure/services/MessagingProviderFactory.ts
public createProvider(providerType: MessagingProvider, config: ProviderConfig): IMessagingProvider {
  switch (providerType) {
    case MessagingProvider.FONNTE:
      return new FonnteProvider(config);
    case MessagingProvider.TWILIO:
      return new TwilioProvider(config);  // Add this
    // ...
  }
}
```

### Step 3: Update Available Providers

```typescript
public getAvailableProviders() {
  return [
    // ... existing providers
    {
      type: MessagingProvider.TWILIO,
      name: "Twilio",
      description: "SMS and WhatsApp messaging",
      status: "available",  // Change from "coming_soon"
    },
  ];
}
```

## 🎨 Template Variables

Templates support dynamic variable replacement using `{{variableName}}` syntax.

### Common Variables

**Order Events:**
- `{{customerName}}` - Customer name
- `{{orderNumber}}` - Order ID
- `{{grandTotal}}` - Total amount
- `{{items}}` - Order items
- `{{orderDate}}` - Order date

**Payment Events:**
- `{{amount}}` - Payment amount
- `{{paymentMethod}}` - Payment method name
- `{{transactionId}}` - Transaction ID

**Custom Variables:**
Any key-value pair can be passed as variables. The system will replace all matching placeholders.

### Example Template

```
Hello {{customerName}},

Your order {{orderNumber}} has been {{status}}.

Total: Rp{{grandTotal}}
Payment: {{paymentMethod}}

Thank you for shopping with us!
```

## 🚀 Production Checklist

Before deploying to production:

- [ ] Configure Fonnte API token
- [ ] Create default message templates
- [ ] Test message sending
- [ ] Test connection endpoints
- [ ] Set up monitoring for failed messages
- [ ] Configure rate limiting (if needed)
- [ ] Review message logs regularly
- [ ] Document custom variables for your team
- [ ] Train staff on template management

## 📊 Monitoring & Debugging

### Check Message Status

```typescript
GET /api/v2/tenants/{tenantId}/messaging/logs?status=failed

// Check specific message
GET /api/v2/tenants/{tenantId}/messaging/logs/{logId}
```

### Common Issues

**1. "No active configuration found"**
- Ensure a provider configuration is created and active
- Check `GET /api/v2/tenants/{tenantId}/messaging/configs`

**2. "Missing required variables"**
- Preview template before sending: `POST /templates/{id}/preview`
- Check `required_variables` field in template response

**3. "Failed to send message"**
- Check provider configuration
- Test connection: `POST /configs/{id}/test`
- Review `error_message` in message logs

**4. "Cannot edit system template"**
- System templates (`is_custom: false`) cannot be modified
- Create a custom template instead

## 🔒 Security

- All endpoints require tenant authentication
- API tokens are masked in responses (shows only first 4 characters)
- Provider credentials stored securely
- Message logs track all sent messages
- No sensitive data in error messages

## 📝 Notes

- Phone numbers are automatically formatted for Indonesia (+62)
- Maximum message length: 5000 characters
- Templates have no limit on number of variables
- One active configuration per provider per tenant
- Database table names unchanged for production safety

## 🆕 Future Enhancements

Potential features for future versions:
- Scheduled messaging
- Bulk message sending
- Automatic retries on failure
- Message queuing system
- Rich media support (images, documents)
- Message templates marketplace
- Analytics dashboard
- Webhook delivery status updates
- Multi-language template support

---

**Version:** 2.0  
**Last Updated:** November 23, 2025  
**Maintainer:** Development Team
