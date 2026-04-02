# Product API — V3

Base URLs:
- Products: `/api/v3/products`
- Categories: `/api/v3/product-categories`

All responses follow the standard envelope:

```json
{
  "meta": { "message": "string", "success": true, "code": 200, "errors": [] },
  "data": null,
  "pagination": null
}
```

---

## Authorization

All endpoints require a Bearer token in the `Authorization` header.

```
Authorization: Bearer <token>
```

Both `owner` and `staff` tokens have full access to all product and category endpoints. The tenant is derived from the token — there are no `tenantId` path parameters.

---

## Product Endpoints

### 1. List Products

```
GET /api/v3/products
```

Returns a paginated list of products for the current tenant.

**Query parameters**

| Parameter | Type | Default | Notes |
|---|---|---|---|
| `page` | number | `1` | 1-based page number |
| `pageSize` | number | `20` | Max `100` |
| `search` | string | — | Matches name, alias, or SKU (case-insensitive) |
| `categoryId` | uuid | — | Filter by category |
| `type` | string | — | `good` or `service` |
| `sortBy` | string | — | `name`, `price`, `stock`, or `createdAt` |
| `sortOrder` | string | `asc` | `asc` or `desc` |

**Response `200`**
```json
{
  "meta": { "message": "Success", "success": true, "code": 200, "errors": [] },
  "data": [
    {
      "id": "uuid",
      "tenantId": "uuid",
      "name": "Nasi Goreng",
      "description": "Nasi goreng spesial",
      "price": 25000,
      "type": "good",
      "stock": 50,
      "sku": "NGS-001",
      "imageUrl": null,
      "alias": "nasgeng",
      "isCountable": true,
      "unit": "pcs",
      "productCategoryId": "uuid",
      "category": {
        "id": "uuid",
        "name": "Makanan",
        "description": null,
        "parentId": null
      },
      "createdAt": "2026-01-01T00:00:00.000Z",
      "updatedAt": "2026-04-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "total": 1,
    "totalPages": 1
  }
}
```

**Errors**

| Code | Reason |
|---|---|
| `401` | Missing or invalid token |

---

### 2. Create Product

```
POST /api/v3/products
```

Creates a new product under the current tenant.

**Request body**

```json
{
  "name": "Nasi Goreng",
  "description": "Nasi goreng spesial",
  "price": 25000,
  "type": "good",
  "stock": 50,
  "sku": "NGS-001",
  "imageUrl": null,
  "alias": "nasgeng",
  "productCategoryId": "uuid",
  "isCountable": true,
  "unit": "pcs"
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `name` | string | ✅ | |
| `price` | number | ✅ | Must be ≥ 0 |
| `type` | string | ✅ | `good` or `service` |
| `description` | string | ❌ | |
| `stock` | integer | ❌ | Only meaningful when `isCountable: true` and `type: "good"` |
| `sku` | string | ❌ | |
| `imageUrl` | string | ❌ | |
| `alias` | string | ❌ | Alternative name for search |
| `productCategoryId` | uuid | ❌ | |
| `isCountable` | boolean | ❌ | Default `true` |
| `unit` | string | ❌ | Default `"pcs"` |

**Response `200`**
```json
{
  "meta": { "message": "Product created successfully", "success": true, "code": 200, "errors": [] },
  "data": { "...same shape as list item..." },
  "pagination": null
}
```

**Errors**

| Code | Reason |
|---|---|
| `400` | `name` missing, `price` missing, or `type` is invalid |
| `401` | Missing or invalid token |

---

### 3. Get Product

```
GET /api/v3/products/:productId
```

Returns a single product by ID. The product must belong to the current tenant.

**Response `200`**
```json
{
  "meta": { "message": "Success", "success": true, "code": 200, "errors": [] },
  "data": { "...same shape as list item..." },
  "pagination": null
}
```

**Errors**

| Code | Reason |
|---|---|
| `401` | Missing or invalid token |
| `404` | Product not found or belongs to another tenant |

---

### 4. Update Product

```
PUT /api/v3/products/:productId
```

Updates a product. All fields are optional; only provided fields are changed.

**Request body** — all fields optional

```json
{
  "name": "Nasi Goreng Special",
  "price": 28000,
  "type": "good",
  "stock": 40,
  "sku": "NGS-001",
  "imageUrl": "https://example.com/image.jpg",
  "alias": "nasgeng",
  "description": "Updated description",
  "productCategoryId": "uuid",
  "isCountable": true,
  "unit": "pcs"
}
```

> Set `productCategoryId: null` to remove category assignment.

**Response `200`**
```json
{
  "meta": { "message": "Product updated successfully", "success": true, "code": 200, "errors": [] },
  "data": { "...same shape as list item..." },
  "pagination": null
}
```

**Errors**

| Code | Reason |
|---|---|
| `400` | `name` was provided but is empty, `price` < 0, or invalid `type` |
| `401` | Missing or invalid token |
| `404` | Product not found |

---

### 5. Delete Product

```
DELETE /api/v3/products/:productId
```

Permanently deletes a product. The product must belong to the current tenant.

**Response `200`**
```json
{
  "meta": { "message": "Product deleted successfully", "success": true, "code": 200, "errors": [] },
  "data": null,
  "pagination": null
}
```

**Errors**

| Code | Reason |
|---|---|
| `401` | Missing or invalid token |
| `404` | Product not found |

---

### 6. Update Stock

```
PUT /api/v3/products/:productId/stock
```

Sets the absolute stock value for a product. Only valid for countable `good` products.

> This sets the stock to the given value, it does not add or subtract.

**Request body**

```json
{
  "stock": 100
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `stock` | integer | ✅ | Must be ≥ 0 |

**Response `200`**
```json
{
  "meta": { "message": "Stock updated successfully", "success": true, "code": 200, "errors": [] },
  "data": { "...same shape as list item..." },
  "pagination": null
}
```

**Errors**

| Code | Reason |
|---|---|
| `400` | `stock` missing, not an integer, or < 0 |
| `401` | Missing or invalid token |
| `404` | Product not found |
| `422` | Product is a `service` or has `isCountable: false` |

---

## Category Endpoints

### 7. List Categories

```
GET /api/v3/product-categories
```

Returns a paginated list of categories for the current tenant.

**Query parameters**

| Parameter | Type | Default | Notes |
|---|---|---|---|
| `page` | number | `1` | |
| `pageSize` | number | `20` | Max `100` |
| `search` | string | — | Matches name (case-insensitive) |
| `parentId` | string | — | Pass `root` to return only root categories; pass a UUID to return children of that category; omit to return all |

**Response `200`**
```json
{
  "meta": { "message": "Success", "success": true, "code": 200, "errors": [] },
  "data": [
    {
      "id": "uuid",
      "name": "Makanan",
      "description": null,
      "parentId": null,
      "childrenCount": 3,
      "createdAt": "2026-01-01T00:00:00.000Z",
      "updatedAt": "2026-04-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "total": 1,
    "totalPages": 1
  }
}
```

---

### 8. Create Category

```
POST /api/v3/product-categories
```

Creates a new product category.

**Request body**

```json
{
  "name": "Makanan",
  "description": "Kategori makanan",
  "parentId": null
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `name` | string | ✅ | |
| `description` | string | ❌ | |
| `parentId` | uuid | ❌ | Omit or `null` for a root category |

**Response `200`**
```json
{
  "meta": { "message": "Category created successfully", "success": true, "code": 200, "errors": [] },
  "data": { "...same shape as list item..." },
  "pagination": null
}
```

**Errors**

| Code | Reason |
|---|---|
| `400` | `name` missing |
| `401` | Missing or invalid token |

---

### 9. Get Category

```
GET /api/v3/product-categories/:categoryId
```

Returns a single category with its `childrenCount`.

**Response `200`**
```json
{
  "meta": { "message": "Success", "success": true, "code": 200, "errors": [] },
  "data": {
    "id": "uuid",
    "name": "Makanan",
    "description": null,
    "parentId": null,
    "childrenCount": 3,
    "createdAt": "2026-01-01T00:00:00.000Z",
    "updatedAt": "2026-04-01T00:00:00.000Z"
  },
  "pagination": null
}
```

**Errors**

| Code | Reason |
|---|---|
| `401` | Missing or invalid token |
| `404` | Category not found |

---

### 10. Update Category

```
PUT /api/v3/product-categories/:categoryId
```

Updates a category. All fields are optional.

**Request body**

```json
{
  "name": "Makanan Berat",
  "description": "Makanan dengan porsi besar",
  "parentId": null
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `name` | string | ❌ | Cannot be empty if provided |
| `description` | string | ❌ | |
| `parentId` | uuid \| null | ❌ | Set `null` to promote to root; cannot set to itself |

**Response `200`**
```json
{
  "meta": { "message": "Category updated successfully", "success": true, "code": 200, "errors": [] },
  "data": { "...same shape as list item..." },
  "pagination": null
}
```

**Errors**

| Code | Reason |
|---|---|
| `400` | `name` was provided but is empty, or `parentId` references the category itself |
| `401` | Missing or invalid token |
| `404` | Category not found |

---

### 11. Delete Category

```
DELETE /api/v3/product-categories/:categoryId
```

Permanently deletes a category. Deletion is blocked if the category still has subcategories or products assigned to it.

**Response `200`**
```json
{
  "meta": { "message": "Category deleted successfully", "success": true, "code": 200, "errors": [] },
  "data": null,
  "pagination": null
}
```

**Errors**

| Code | Reason |
|---|---|
| `401` | Missing or invalid token |
| `404` | Category not found |
| `422` | Category has subcategories — remove them first |
| `422` | Category has products assigned — reassign or delete them first |
