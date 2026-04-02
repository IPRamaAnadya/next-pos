import cron from 'node-cron';

// You need to provide the correct base URL for your API
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';


cron.schedule('*/5 * * * * *', async () => {
  try {
    // Fetch all tenants from the API
    const tenantsRes = await fetch(`${BASE_URL}/api/tenants`);
    const tenants = await tenantsRes.json();
    const tenantIds = Array.isArray(tenants) ? tenants.map(t => t.id) : [];
    for (const tenantId of tenantIds) {
      try {
        const res = await fetch(`${BASE_URL}/api/subscription/check-duration`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tenantId }),
        });
        const data = await res.json();
      } catch (err) {
        console.error(`Error checking tenant ${tenantId}:`, err);
      }
    }
  } catch (error) {
    console.error('Cron job error:', error);
  }
});
