import { PrismaClient } from '../src/app/generated/prisma';

const prisma = new PrismaClient();

async function listTemplates() {
  const tenantId = process.argv[2];
  
  if (!tenantId) {
    console.log('Usage: npx tsx scripts/list-templates.ts <tenantId>');
    return;
  }
  
  const templates = await prisma.notificationTemplate.findMany({
    where: { tenantId },
    select: {
      id: true,
      name: true,
      message: true,
      event: true,
      isActive: true,
      isCustom: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  });
  
  if (templates.length === 0) {
    console.log('❌ No templates found for this tenant');
    return;
  }
  
  console.log(`\n✅ Found ${templates.length} template(s):\n`);
  
  templates.forEach((template, index) => {
    console.log(`${index + 1}. ${template.name}`);
    console.log(`   ID: ${template.id}`);
    console.log(`   Event: ${template.event || 'CUSTOM'}`);
    console.log(`   Message: ${template.message}`);
    console.log(`   Active: ${template.isActive}`);
    console.log(`   Created: ${template.createdAt}`);
    console.log('');
  });
}

listTemplates()
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
