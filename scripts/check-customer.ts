import { PrismaClient } from '../src/app/generated/prisma';

const prisma = new PrismaClient();

async function checkCustomer() {
  const customerId = '263018e4-4eaf-4ec4-9288-6cc098b86da0';
  const tenantId = '8cbb2d6e-c644-4b2d-b812-3b6e353ee52f';
  
  console.log('Checking customer with:');
  console.log('Customer ID:', customerId);
  console.log('Tenant ID:', tenantId);
  console.log('');
  
  // Try findUnique with just ID
  console.log('1️⃣ findUnique with ID only:');
  const customer1 = await prisma.customer.findUnique({
    where: { id: customerId },
  });
  console.log('Result:', customer1 ? {
    id: customer1.id,
    tenantId: customer1.tenantId,
    name: customer1.name,
    phone: customer1.phone,
    email: customer1.email
  } : 'null');
  console.log('');
  
  // Try findFirst with both
  console.log('2️⃣ findFirst with ID + tenantId:');
  const customer2 = await prisma.customer.findFirst({
    where: { 
      id: customerId,
      tenantId: tenantId
    },
  });
  console.log('Result:', customer2 ? {
    id: customer2.id,
    tenantId: customer2.tenantId,
    name: customer2.name,
    phone: customer2.phone,
    email: customer2.email
  } : 'null');
  console.log('');
  
  // Try findMany to see all customers for this tenant
  console.log('3️⃣ findMany - All customers for this tenant:');
  const customers = await prisma.customer.findMany({
    where: { tenantId: tenantId },
    select: {
      id: true,
      name: true,
      phone: true,
    },
    take: 5,
  });
  console.log('Found', customers.length, 'customers:');
  customers.forEach((c, i) => {
    console.log(`  ${i + 1}. ${c.name} - ${c.phone} (${c.id})`);
  });
}

checkCustomer()
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
