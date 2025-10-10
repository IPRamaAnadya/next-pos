"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
// small JWT payload decoder (no dependency)
function decodeJwtPayload<T = any>(token: string): T | null {
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const payload = parts[1];
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decodeURIComponent(escape(json))) as T;
  } catch (e) {
    return null;
  }
}

type AdminToken = {
  adminId?: string;
  role?: string;
  username?: string;
  email?: string;
  iat?: number;
  exp?: number;
};

function getCookie(name: string) {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  if (match) return match[2];
  return null;
}

export default function DashboardPage() {
  const router = useRouter();
  const [admin, setAdmin] = useState<AdminToken | null>(null);

  useEffect(() => {
    const token = getCookie('token');
    if (!token) {
      router.replace('/admin/login');
      return;
    }
    try {
      const decoded = decodeJwtPayload<AdminToken>(token);
      if (!decoded) throw new Error('invalid');
      setAdmin(decoded);
    } catch (e) {
      router.replace('/admin/login');
    }
  }, [router]);

  function logout() {
    document.cookie = 'token=; path=/; max-age=0';
    router.replace('/admin/login');
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
        <h1 style={{ margin: 0 }}>Dashboard</h1>
        <div>
          {admin ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 13 }}>{admin.username}</div>
                <div style={{ fontSize: 12, color: '#6b7280' }}>{admin.email}</div>
              </div>
              <button onClick={logout} style={{ padding: '8px 12px', borderRadius: 6 }}>Logout</button>
            </div>
          ) : (
            <div>Loading...</div>
          )}
        </div>
      </div>

      <section>
        <h2>Welcome{admin?.username ? `, ${admin.username}` : ''}!</h2>
        <p>This is the admin dashboard. From here you can manage tenants, subscriptions, and users.</p>
      </section>
    </div>
  );
}
