import { PrismaClient } from '../src/app/generated/prisma';

const prisma = new PrismaClient();

async function updateCustomerPhone() {
  const customerId = '355a7e1d-b99f-41d3-9623-452dc5f6d8bb';
  
  // First, check the current customer data
  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
    select: {
      id: true,
      name: true,
      phone: true,
      email: true,
    },
  });
  
  if (!customer) {
    console.log('❌ Customer not found!');
    return;
  }
  
  console.log('Current customer data:', customer);
  
  if (!customer.phone) {
    console.log('\n⚠️ Customer has no phone number!');
    console.log('Updating customer phone number to: 6287862175374');
    
    // Update the customer with the phone number
    const updated = await prisma.customer.update({
      where: { id: customerId },
      data: {
        phone: '6287862175374',
      },
    });
    
    console.log('\n✅ Customer updated:', updated);
  } else {
    console.log('\n✅ Customer already has a phone number:', customer.phone);
  }
}

updateCustomerPhone()
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
