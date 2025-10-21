import React from 'react';
import "../globals.css";
export const metadata = {
  title: 'Admin Dashboard',
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body style={{ fontFamily: 'Inter, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial' }}>
        <div style={{ display: 'flex', minHeight: '100vh' }}>
          <aside style={{ width: 220, background: '#0f172a', color: '#fff', padding: 20 }}>
            <h3 style={{ marginTop: 0 }}>Admin</h3>
            <nav>
              <a href="/dashboard" style={{ color: '#cbd5e1', display: 'block', marginBottom: 8 }}>Home</a>
              <a href="/dashboard/tenants" style={{ color: '#cbd5e1', display: 'block', marginBottom: 8 }}>Tenants</a>
              <a href="/dashboard/subscriptions" style={{ color: '#cbd5e1', display: 'block', marginBottom: 8 }}>Subscriptions</a>
              <a href="/dashboard/tenant-subscriptions" style={{ color: '#cbd5e1', display: 'block', marginBottom: 8 }}>Tenant Subscriptions</a>
              <a href="/dashboard/users" style={{ color: '#cbd5e1', display: 'block', marginBottom: 8 }}>Users</a>
              <a href="/dashboard/banner" style={{ color: '#cbd5e1', display: 'block', marginBottom: 8 }}>Banner</a>
            </nav>
          </aside>

          <main style={{ flex: 1, background: '#f8fafc', padding: 28 }}>
            <div style={{ maxWidth: 1100, margin: '0 auto' }}>{children}</div>
          </main>
        </div>
      </body>
    </html>
  );
}
