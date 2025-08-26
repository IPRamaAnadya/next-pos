// prisma/seed.ts

import prisma from '../src/lib/prisma';
import bcrypt from 'bcryptjs';

const main = async () => {
  console.log('Start seeding...');

  const hashedPassword = await bcrypt.hash('password', 10);
  const tenantId = '123e4567-e89b-12d3-a456-426614174001';

  // 1. Create a User (Owner) and a Tenant
  const owner = await prisma.user.create({
    data: {
      email: 'owner@example.com',
      password: hashedPassword,
      tenants: {
        create: {
          id: tenantId,
          name: 'My POS Tenant',
          email: 'tenant@example.com',
          address: '123 Main St',
          isSubscribed: true,
        },
      },
    },
    include: {
      tenants: true,
    },
  });

  const tenant = owner.tenants[0];

  console.log(`Created user with email: ${owner.email}`);
  console.log(`Created tenant with ID: ${tenant.id}`);

  // 2. Create Staff members
  const staff1 = await prisma.staff.create({
    data: {
      tenantId: tenant.id,
      username: 'cashier1',
      password: hashedPassword,
      role: 'cashier',
    },
  });
  const staff2 = await prisma.staff.create({
    data: {
      tenantId: tenant.id,
      username: 'manager1',
      password: hashedPassword,
      role: 'manager',
    },
  });

  console.log('Created staff: cashier1, manager1');

  // 3. Create Product Categories
  const category1 = await prisma.productCategory.create({
    data: {
      tenantId: tenant.id,
      name: 'Makanan',
    },
  });
  const category2 = await prisma.productCategory.create({
    data: {
      tenantId: tenant.id,
      name: 'Minuman',
    },
  });

  console.log('Created product categories: Makanan, Minuman');

  // 4. Create Products
  const product1 = await prisma.product.create({
    data: {
      tenantId: tenant.id,
      productCategoryId: category1.id,
      name: 'Nasi Goreng',
      price: 25000,
      type: 'good',
      stock: 50,
      sku: 'NSG-001',
      imageUrl: 'https://example.com/nasigoreng.jpg',
    },
  });
  const product2 = await prisma.product.create({
    data: {
      tenantId: tenant.id,
      productCategoryId: category2.id,
      name: 'Es Teh Manis',
      price: 10000,
      type: 'good',
      stock: 100,
      sku: 'ETM-002',
      imageUrl: 'https://example.com/estehmanis.jpg',
    },
  });

  console.log('Created products: Nasi Goreng, Es Teh Manis');

  // 5. Create Customers
  const customer1 = await prisma.customer.create({
    data: {
      tenantId: tenant.id,
      name: 'Budi Santoso',
      phone: '081234567890',
      email: 'budi@example.com',
      points: 100,
    },
  });

  console.log(`Created customer: ${customer1.name}`);

  // 6. Create Discounts
  const discount1 = await prisma.discount.create({
    data: {
      tenantId: tenant.id,
      code: 'HALAL-HEMAT',
      name: 'Diskon 10%',
      type: 'percentage',
      value: 10,
      minPurchase: 50000,
    },
  });

  console.log(`Created discount: ${discount1.name}`);

  // 7. Create Expense Categories and Expenses
  const expenseCategory1 = await prisma.expenseCategory.create({
    data: {
      tenantId: tenant.id,
      name: 'Biaya Bahan Baku',
      code: 'BB-001',
    },
  });

  const expense1 = await prisma.expense.create({
    data: {
      tenantId: tenant.id,
      expenseCategoryId: expenseCategory1.id,
      staffId: staff2.id,
      description: 'Pembelian beras dan telur',
      amount: 150000,
      paymentType: 'Cash',
      paidAt: new Date(),
    },
  });

  console.log('Created expense category and expense');

  // 8. Create an Order with Order Items
  const orderItems = [
    {
      tenantId: tenant.id,
      productId: product1.id,
      productName: product1.name,
      productPrice: product1.price,
      qty: 2,
    },
    {
      tenantId: tenant.id,
      productId: product2.id,
      productName: product2.name,
      productPrice: product2.price,
      qty: 3,
    },
  ];

  const subtotal = orderItems.reduce((acc, item) => acc + item.productPrice.toNumber() * item.qty, 0);
  const discountAmount = subtotal * discount1.value.toNumber() / 100;
  const grandTotal = subtotal - discountAmount;
  const paidAmount = grandTotal;

  const order = await prisma.order.create({
    data: {
      tenantId: tenant.id,
      staffId: staff1.id,
      customerId: customer1.id,
      orderNo: `ORD-${Date.now()}`,
      subtotal: subtotal,
      discountId: discount1.id,
      discountName: discount1.name,
      discountType: discount1.type,
      discountValue: discount1.value,
      discountAmount: discountAmount,
      totalAmount: grandTotal,
      grandTotal: grandTotal,
      paidAmount: paidAmount,
      change: paidAmount - grandTotal,
      paymentMethod: 'Cash',
      paymentStatus: 'paid',
      orderStatus: 'completed',
      items: {
        createMany: {
          data: orderItems,
        },
      },
    },
  });

  console.log(`Created order with ID: ${order.id}`);
  console.log('Seeding finished.');
};

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });