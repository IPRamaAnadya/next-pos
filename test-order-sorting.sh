#!/bin/bash

# Test script for Order API sorting functionality
# This script tests the sortBy and sortDir parameters

BASE_URL="http://localhost:3000"
TENANT_ID="your-tenant-id-here"
TOKEN="your-jwt-token-here"

echo "=================================="
echo "Order API Sorting Test"
echo "=================================="
echo ""

# Test 1: Default sorting (should be createdAt desc)
echo "Test 1: Default sorting (no params)"
echo "URL: $BASE_URL/api/v2/tenants/$TENANT_ID/orders"
curl -s -H "Authorization: Bearer $TOKEN" \
  "$BASE_URL/api/v2/tenants/$TENANT_ID/orders" | \
  jq '.data.orders[] | {orderNo, createdAt}'
echo ""

# Test 2: Sort by createdAt ASC
echo "Test 2: Sort by createdAt ASC"
echo "URL: $BASE_URL/api/v2/tenants/$TENANT_ID/orders?sortBy=createdAt&sortDir=asc"
curl -s -H "Authorization: Bearer $TOKEN" \
  "$BASE_URL/api/v2/tenants/$TENANT_ID/orders?sortBy=createdAt&sortDir=asc" | \
  jq '.data.orders[] | {orderNo, createdAt}'
echo ""

# Test 3: Sort by createdAt DESC
echo "Test 3: Sort by createdAt DESC"
echo "URL: $BASE_URL/api/v2/tenants/$TENANT_ID/orders?sortBy=createdAt&sortDir=desc"
curl -s -H "Authorization: Bearer $TOKEN" \
  "$BASE_URL/api/v2/tenants/$TENANT_ID/orders?sortBy=createdAt&sortDir=desc" | \
  jq '.data.orders[] | {orderNo, createdAt}'
echo ""

# Test 4: Sort by grandTotal ASC
echo "Test 4: Sort by grandTotal ASC"
echo "URL: $BASE_URL/api/v2/tenants/$TENANT_ID/orders?sortBy=grandTotal&sortDir=asc"
curl -s -H "Authorization: Bearer $TOKEN" \
  "$BASE_URL/api/v2/tenants/$TENANT_ID/orders?sortBy=grandTotal&sortDir=asc" | \
  jq '.data.orders[] | {orderNo, grandTotal}'
echo ""

# Test 5: Sort by grandTotal DESC
echo "Test 5: Sort by grandTotal DESC"
echo "URL: $BASE_URL/api/v2/tenants/$TENANT_ID/orders?sortBy=grandTotal&sortDir=desc"
curl -s -H "Authorization: Bearer $TOKEN" \
  "$BASE_URL/api/v2/tenants/$TENANT_ID/orders?sortBy=grandTotal&sortDir=desc" | \
  jq '.data.orders[] | {orderNo, grandTotal}'
echo ""

# Test 6: Sort using snake_case param names (p_sort_by, p_sort_dir)
echo "Test 6: Sort using snake_case params (p_sort_by=created_at&p_sort_dir=asc)"
echo "URL: $BASE_URL/api/v2/tenants/$TENANT_ID/orders?p_sort_by=created_at&p_sort_dir=asc"
curl -s -H "Authorization: Bearer $TOKEN" \
  "$BASE_URL/api/v2/tenants/$TENANT_ID/orders?p_sort_by=created_at&p_sort_dir=asc" | \
  jq '.data.orders[] | {orderNo, createdAt}'
echo ""

echo "=================================="
echo "Tests completed!"
echo "=================================="
