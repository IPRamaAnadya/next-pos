"use client";

import React, { useEffect, useState } from 'react';

type Tenant = {
  id: string;
  name: string;
  email: string;
  address?: string | null;
  phone?: string | null;
  isSubscribed?: boolean;
  subscribedUntil?: string | null;
  createdAt?: string;
};

export default function TenantsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // create/edit form state
  const [editing, setEditing] = useState<Tenant | null>(null);
  const [form, setForm] = useState({ name: '', email: '', address: '', phone: '' });

  useEffect(() => {
    fetchTenants();
  }, []);

  async function fetchTenants() {
    setLoading(true);
    setError(null);
    try {
  const res = await fetch('/api/admin/tenants', { credentials: 'same-origin' });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed to load tenants');
      setTenants(data.data || []);
    } catch (err: any) {
      setError(err.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  function openCreate() {
    setEditing(null);
    setForm({ name: '', email: '', address: '', phone: '' });
  }

  function openEdit(t: Tenant) {
    setEditing(t);
    setForm({ name: t.name || '', email: t.email || '', address: t.address || '', phone: t.phone || '' });
  }

  async function submitForm(e?: React.FormEvent) {
    if (e) e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const payload = { ...form };
      let res: Response;
      if (editing) {
        res = await fetch('/api/admin/tenants', { method: 'PUT', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: editing.id, ...payload }) });
      } else {
        res = await fetch('/api/admin/tenants', { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      }
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error || 'Operation failed');
      await fetchTenants();
      setEditing(null);
      setForm({ name: '', email: '', address: '', phone: '' });
    } catch (err: any) {
      setError(err.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  async function removeTenant(id: string) {
    if (!confirm('Delete this tenant? This action cannot be undone.')) return;
    setLoading(true);
    setError(null);
    try {
  const res = await fetch('/api/admin/tenants', { method: 'DELETE', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
      if (res.status !== 204) {
        const body = await res.json();
        throw new Error(body?.error || 'Delete failed');
      }
      await fetchTenants();
    } catch (err: any) {
      setError(err.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: 20 }}>
      <h1>Tenants</h1>

      <div style={{ marginBottom: 16 }}>
        <button onClick={openCreate}>Create Tenant</button>
        <button onClick={fetchTenants} style={{ marginLeft: 8 }}>Refresh</button>
      </div>

      {error && <div style={{ color: 'crimson', marginBottom: 12 }}>{error}</div>}

      <div style={{ display: 'flex', gap: 24 }}>
        <div style={{ flex: 1 }}>
          <h2>List</h2>
          {loading ? (
            <div>Loading...</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd', padding: '8px' }}>Name</th>
                  <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd', padding: '8px' }}>Email</th>
                  <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd', padding: '8px' }}>Subscribed</th>
                  <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd', padding: '8px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {tenants.map((t) => (
                  <tr key={t.id}>
                    <td style={{ padding: '8px', borderBottom: '1px solid #f0f0f0' }}>{t.name}</td>
                    <td style={{ padding: '8px', borderBottom: '1px solid #f0f0f0' }}>{t.email}</td>
                    <td style={{ padding: '8px', borderBottom: '1px solid #f0f0f0' }}>{t.isSubscribed ? 'Yes' : 'No'}</td>
                    <td style={{ padding: '8px', borderBottom: '1px solid #f0f0f0' }}>
                      <button onClick={() => openEdit(t)}>Edit</button>
                      <button onClick={() => removeTenant(t.id)} style={{ marginLeft: 8, color: 'crimson' }}>Delete</button>
                    </td>
                  </tr>
                ))}
                {tenants.length === 0 && !loading && (
                  <tr>
                    <td colSpan={4} style={{ padding: '8px' }}>No tenants found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        <div style={{ width: 360 }}>
          <h2>{editing ? 'Edit Tenant' : 'Create Tenant'}</h2>
          <form onSubmit={submitForm}>
            <div style={{ marginBottom: 8 }}>
              <label style={{ display: 'block', fontSize: 13 }}>Name</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required style={{ width: '100%' }} />
            </div>
            <div style={{ marginBottom: 8 }}>
              <label style={{ display: 'block', fontSize: 13 }}>Email</label>
              <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required style={{ width: '100%' }} />
            </div>
            <div style={{ marginBottom: 8 }}>
              <label style={{ display: 'block', fontSize: 13 }}>Address</label>
              <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} style={{ width: '100%' }} />
            </div>
            <div style={{ marginBottom: 8 }}>
              <label style={{ display: 'block', fontSize: 13 }}>Phone</label>
              <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} style={{ width: '100%' }} />
            </div>

            <div style={{ marginTop: 12 }}>
              <button type="submit" disabled={loading}>{editing ? 'Save' : 'Create'}</button>
              {editing && <button type="button" onClick={() => { setEditing(null); setForm({ name: '', email: '', address: '', phone: '' }); }} style={{ marginLeft: 8 }}>Cancel</button>}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
