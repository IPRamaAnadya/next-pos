import cron from 'node-cron';

// You need to provide the correct base URL for your API
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

// Example: you should have a way to get all tenant IDs, e.g. from a config or a static list
// For demo, replace this with your actual tenant ID list or fetch from a service
const tenantIds = process.env.TENANT_IDS ? process.env.TENANT_IDS.split(',') : [];

cron.schedule('*/10 * * * * *', async () => {
  try {
    console.log('Running daily subscription check at 8:00 AM UTC+8');
    for (const tenantId of tenantIds) {
      try {
        const res = await fetch(`${BASE_URL}/api/subscription/check-duration`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tenantId }),
        });
        const data = await res.json();
        console.log(`Checked tenant ${tenantId}:`, data);
      } catch (err) {
        console.error(`Error checking tenant ${tenantId}:`, err);
      }
    }
  } catch (error) {
    console.error('Cron job error:', error);
  }
});
