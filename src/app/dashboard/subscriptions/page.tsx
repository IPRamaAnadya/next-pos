"use client";

import React, { useEffect, useState } from 'react';
import type { SubscriptionLimitation } from '@/types/subscription';

type Plan = {
  id: string;
  name: string;
  description?: string | null;
  pricePerMonth: string;
  pricePerYear?: string | null;
  isBetaTest: boolean;
  customLimits?: any;
  createdAt?: string;
};

export default function SubscriptionsPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Plan | null>(null);
  const [form, setForm] = useState({ name: '', description: '', pricePerMonth: '', pricePerYear: '', isBetaTest: false, customLimits: { staff: 5, product: 100, transaction: 1000, report: true, payroll: false, discount: true, attendance: false, online_store: false } as SubscriptionLimitation });

  useEffect(() => { fetchPlans(); }, []);

  async function fetchPlans() {
    setLoading(true); setError(null);
    try {
      const res = await fetch('/api/admin/subscription-plans', { credentials: 'same-origin' });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error || 'Failed to load plans');
      setPlans(body.data || []);
    } catch (err: any) {
      setError(err.message || 'Unknown error');
    } finally { setLoading(false); }
  }

  const activeBeta = plans.find(p => p.isBetaTest);

  const defaultLimits: SubscriptionLimitation = { staff: 5, product: 100, transaction: 1000, report: true, payroll: false, discount: true, attendance: false, online_store: false };

  function openCreate() {
    setEditing(null);
    setForm({ name: '', description: '', pricePerMonth: '', pricePerYear: '', isBetaTest: false, customLimits: defaultLimits });
  }

  function openEdit(p: Plan) {
    setEditing(p);
    setForm({ name: p.name || '', description: p.description || '', pricePerMonth: p.pricePerMonth?.toString() || '', pricePerYear: p.pricePerYear?.toString() || '', isBetaTest: !!p.isBetaTest, customLimits: p.customLimits || { staff: 5, product: 100, transaction: 1000, report: true, payroll: false, discount: true, attendance: false, online_store: false } as SubscriptionLimitation });
  }

  async function submitForm(e?: React.FormEvent) {
    if (e) e.preventDefault();
    setLoading(true); setError(null);
    try {
      // validate numeric prices
      if (!form.pricePerMonth || isNaN(Number(form.pricePerMonth))) throw new Error('pricePerMonth must be a number');
      if (form.pricePerYear && isNaN(Number(form.pricePerYear))) throw new Error('pricePerYear must be a number');
  const payload = { ...form, pricePerMonth: String(form.pricePerMonth), pricePerYear: form.pricePerYear ? String(form.pricePerYear) : null };
      let res: Response;
      if (editing) {
        res = await fetch('/api/admin/subscription-plans', { method: 'PUT', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: editing.id, ...payload }) });
      } else {
        res = await fetch('/api/admin/subscription-plans', { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      }
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error || 'Operation failed');
      await fetchPlans();
  setEditing(null);
  setForm({ name: '', description: '', pricePerMonth: '', pricePerYear: '', isBetaTest: false, customLimits: defaultLimits });
    } catch (err: any) {
      setError(err.message || 'Unknown error');
    } finally { setLoading(false); }
  }

  async function removePlan(id: string) {
    if (!confirm('Delete this plan?')) return;
    setLoading(true); setError(null);
    try {
      const res = await fetch('/api/admin/subscription-plans', { method: 'DELETE', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
      if (res.status !== 204) {
        const body = await res.json();
        throw new Error(body?.error || 'Delete failed');
      }
      await fetchPlans();
    } catch (err: any) {
      setError(err.message || 'Unknown error');
    } finally { setLoading(false); }
  }

  return (
    <div style={{ padding: 20 }}>
      <h1>Subscription Plans</h1>
      <div style={{ marginBottom: 16 }}>
        <button onClick={openCreate}>Create Plan</button>
        <button onClick={fetchPlans} style={{ marginLeft: 8 }}>Refresh</button>
      </div>
      {error && <div style={{ color: 'crimson' }}>{error}</div>}

      <div style={{ display: 'flex', gap: 24 }}>
        <div style={{ flex: 1 }}>
          <h2>Plans</h2>
          {loading ? <div>Loading...</div> : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: 8 }}>Name</th>
                  <th style={{ textAlign: 'left', padding: 8 }}>Monthly</th>
                  <th style={{ textAlign: 'left', padding: 8 }}>Beta</th>
                  <th style={{ textAlign: 'left', padding: 8 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {plans.map(p => (
                  <tr key={p.id}>
                    <td style={{ padding: 8 }}>{p.name}</td>
                    <td style={{ padding: 8 }}>{p.pricePerMonth}</td>
                    <td style={{ padding: 8 }}>{p.isBetaTest ? 'Yes' : 'No'}</td>
                    <td style={{ padding: 8 }}>
                      <button onClick={() => openEdit(p)}>Edit</button>
                      <button onClick={() => removePlan(p.id)} style={{ marginLeft: 8, color: 'crimson' }}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div style={{ width: 380 }}>
          <h2>{editing ? 'Edit Plan' : 'Create Plan'}</h2>
          <form onSubmit={submitForm}>
            <div style={{ marginBottom: 8 }}>
              <label style={{ display: 'block' }}>Name</label>
              <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required style={{ width: '100%' }} />
            </div>
            <div style={{ marginBottom: 8 }}>
              <label style={{ display: 'block' }}>Description</label>
              <input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} style={{ width: '100%' }} />
            </div>
            <div style={{ marginBottom: 8 }}>
              <label style={{ display: 'block' }}>Price / Month</label>
              <input value={form.pricePerMonth} onChange={e => setForm({ ...form, pricePerMonth: e.target.value })} required style={{ width: '100%' }} />
            </div>
            <div style={{ marginBottom: 8 }}>
              <label style={{ display: 'block' }}>Price / Year</label>
              <input value={form.pricePerYear} onChange={e => setForm({ ...form, pricePerYear: e.target.value })} style={{ width: '100%' }} />
            </div>
            <div style={{ marginBottom: 8 }}>
              <label style={{ display: 'inline-flex', alignItems: 'center' }}>
                <input type="checkbox" checked={form.isBetaTest} onChange={e => setForm({ ...form, isBetaTest: e.target.checked })} />
                <span style={{ marginLeft: 8 }}>Mark as Beta Plan (only one allowed)</span>
              </label>
            </div>

            <fieldset style={{ border: '1px solid #eee', padding: 12, borderRadius: 6, marginBottom: 8 }}>
              <legend style={{ fontSize: 13 }}>Custom Limits</legend>
              <div style={{ marginBottom: 8 }}>
                <label style={{ display: 'block' }}>Staff limit</label>
                <input type="number" value={String(form.customLimits.staff)} onChange={e => setForm({ ...form, customLimits: { ...form.customLimits, staff: Number(e.target.value) } })} style={{ width: '100%' }} />
              </div>
              <div style={{ marginBottom: 8 }}>
                <label style={{ display: 'block' }}>Product limit</label>
                <input type="number" value={String(form.customLimits.product)} onChange={e => setForm({ ...form, customLimits: { ...form.customLimits, product: Number(e.target.value) } })} style={{ width: '100%' }} />
              </div>
              <div style={{ marginBottom: 8 }}>
                <label style={{ display: 'block' }}>Transaction limit</label>
                <input type="number" value={String(form.customLimits.transaction)} onChange={e => setForm({ ...form, customLimits: { ...form.customLimits, transaction: Number(e.target.value) } })} style={{ width: '100%' }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <label style={{ display: 'flex', alignItems: 'center' }}>
                  <input type="checkbox" checked={form.customLimits.report} onChange={e => setForm({ ...form, customLimits: { ...form.customLimits, report: e.target.checked } })} />
                  <span style={{ marginLeft: 8 }}>Reports</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center' }}>
                  <input type="checkbox" checked={form.customLimits.payroll} onChange={e => setForm({ ...form, customLimits: { ...form.customLimits, payroll: e.target.checked } })} />
                  <span style={{ marginLeft: 8 }}>Payroll</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center' }}>
                  <input type="checkbox" checked={form.customLimits.discount} onChange={e => setForm({ ...form, customLimits: { ...form.customLimits, discount: e.target.checked } })} />
                  <span style={{ marginLeft: 8 }}>Discount</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center' }}>
                  <input type="checkbox" checked={form.customLimits.attendance} onChange={e => setForm({ ...form, customLimits: { ...form.customLimits, attendance: e.target.checked } })} />
                  <span style={{ marginLeft: 8 }}>Attendance</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center' }}>
                  <input type="checkbox" checked={form.customLimits.online_store} onChange={e => setForm({ ...form, customLimits: { ...form.customLimits, online_store: e.target.checked } })} />
                  <span style={{ marginLeft: 8 }}>Online Store</span>
                </label>
              </div>
            </fieldset>

            <div style={{ marginTop: 12 }}>
              <button type="submit" disabled={loading}>{editing ? 'Save' : 'Create'}</button>
              {editing && <button type="button" onClick={() => { setEditing(null); setForm({ name: '', description: '', pricePerMonth: '', pricePerYear: '', isBetaTest: false, customLimits: defaultLimits }); }} style={{ marginLeft: 8 }}>Cancel</button>}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
