"use client";

import React, { useEffect, useState } from 'react';
import type { SubscriptionLimitation } from '@/types/subscription';

type Tenant = {
  id: string;
  name: string;
  email: string;
  isSubscribed?: boolean;
  subscribedUntil?: string | null;
};

type Plan = {
  id: string;
  name: string;
  pricePerMonth: string;
  customLimits?: SubscriptionLimitation | null;
};

type TenantSubscription = {
  id: string;
  tenantId: string;
  planId: string;
  startDate: string;
  endDate: string;
  status: string;
  subscriptionPlan?: Plan;
  tenant?: Tenant;
  customLimits?: SubscriptionLimitation | null;
};

export default function TenantSubscriptionsPage() {
  const [items, setItems] = useState<TenantSubscription[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const [editingSubscriptionId, setEditingSubscriptionId] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const defaultLimits: SubscriptionLimitation = { staff: 5, product: 100, transaction: 1000, report: true, payroll: false, discount: true, attendance: false, online_store: false };
  const [form, setForm] = useState({ tenantId: '', planId: '', startDate: '', endDate: '', customLimits: defaultLimits as SubscriptionLimitation });

  useEffect(() => { fetchAll(); fetchPlans(); fetchTenants(); }, []);

  async function fetchAll() {
    setLoading(true); setError(null);
    try {
      const res = await fetch('/api/admin/tenant-subscriptions', { credentials: 'same-origin' });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error || 'Failed to load');
      setItems(body.data || []);
    } catch (err: any) {
      setError(err.message || 'Unknown error');
    } finally { setLoading(false); }
  }

  async function fetchPlans() {
    try {
      const res = await fetch('/api/admin/subscription-plans', { credentials: 'same-origin' });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error || 'Failed to load plans');
      setPlans(body.data || []);
    } catch (err: any) {
      console.error(err);
    }
  }

  async function fetchTenants() {
    try {
      const res = await fetch('/api/admin/tenants', { credentials: 'same-origin' });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error || 'Failed to load tenants');
      setTenants(body.data || []);
    } catch (err: any) {
      console.error(err);
    }
  }

  function openAssign(t?: Tenant) {
    // open modal for creating new subscription for tenant t (or blank)
    setEditingSubscriptionId(null);
    setEditingTenant(t || null);
    setForm({ tenantId: t?.id || '', planId: plans[0]?.id || '', startDate: new Date().toISOString().slice(0,10), endDate: '', customLimits: defaultLimits });
    setShowModal(true);
  }

  function openEditSubscription(sub: TenantSubscription) {
    setEditingSubscriptionId(sub.id);
    setEditingTenant(sub.tenant || null);
    setForm({ tenantId: sub.tenantId, planId: sub.planId, startDate: sub.startDate?.slice(0,10) || new Date().toISOString().slice(0,10), endDate: sub.endDate?.slice(0,10) || '', customLimits: sub.customLimits || defaultLimits });
    setShowModal(true);
  }

  async function submitAssign(e?: React.FormEvent) {
    if (e) e.preventDefault();
    setLoading(true); setError(null);
    try {
      if (!form.tenantId || !form.planId || !form.endDate) throw new Error('tenant, plan and end date are required');
      const payload = { tenantId: form.tenantId, planId: form.planId, startDate: form.startDate || new Date().toISOString(), endDate: form.endDate, customLimits: form.customLimits };
      let res: Response;
      if (editingSubscriptionId) {
        // update existing subscription
        res = await fetch('/api/admin/tenant-subscriptions', { method: 'PUT', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: editingSubscriptionId, ...payload }) });
      } else {
        res = await fetch('/api/admin/tenant-subscriptions', { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      }
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error || 'Assign failed');
      await fetchAll();
      setEditingTenant(null);
      setEditingSubscriptionId(null);
    } catch (err: any) {
      setError(err.message || 'Unknown error');
    } finally { setLoading(false); }
  }

  async function updateSubscription(sub: TenantSubscription) {
    setLoading(true); setError(null);
    try {
      const payload = { tenantId: sub.tenantId, id: sub.id, planId: sub.planId, startDate: sub.startDate, endDate: sub.endDate, status: sub.status, customLimits: sub.customLimits };
      const res = await fetch('/api/admin/tenant-subscriptions', { method: 'PUT', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error || 'Update failed');
      await fetchAll();
    } catch (err: any) {
      setError(err.message || 'Unknown error');
    } finally { setLoading(false); }
  }

  async function cancelSubscription(sub: TenantSubscription) {
    if (!confirm('Cancel subscription for this tenant?')) return;
    setLoading(true); setError(null);
    try {
      const res = await fetch('/api/admin/tenant-subscriptions', { method: 'DELETE', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tenantId: sub.tenantId }) });
      if (res.status !== 204) {
        const body = await res.json();
        throw new Error(body?.error || 'Cancel failed');
      }
      await fetchAll();
    } catch (err: any) {
      setError(err.message || 'Unknown error');
    } finally { setLoading(false); }
  }

  return (
    <div style={{ padding: 20 }}>
      <h1>Tenant Subscriptions</h1>
      <div style={{ marginBottom: 12 }}>
        <button onClick={() => openAssign()}>Assign Subscription</button>
        <button onClick={fetchAll} style={{ marginLeft: 8 }}>Refresh</button>
      </div>

      {error && <div style={{ color: 'crimson' }}>{error}</div>}

      <div style={{ display: 'grid', gap: 12 }}>
        {loading ? <div>Loading...</div> : (
          items.map(item => (
            <div key={item.id} style={{ padding: 12, border: '1px solid #eee', borderRadius: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div>
                  <strong>{item.tenant?.name || item.tenantId}</strong>
                  <div style={{ fontSize: 13, color: '#666' }}>{item.subscriptionPlan?.name || item.planId} — ends {new Date(item.endDate).toLocaleDateString()}</div>
                </div>
                <div>
                  <button onClick={() => openEditSubscription(item)}>Reassign</button>
                  <button onClick={() => cancelSubscription(item)} style={{ marginLeft: 8, color: 'crimson' }}>Cancel</button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 60 }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)' }} onClick={() => { setShowModal(false); setEditingTenant(null); setEditingSubscriptionId(null); }} />
          <div style={{ position: 'relative', width: 760, maxHeight: '80vh', overflowY: 'auto', background: '#fff', padding: 18, borderRadius: 8, boxShadow: '0 10px 30px rgba(0,0,0,0.2)' }}>
            <h3>{editingTenant ? `Assign to ${editingTenant.name}` : 'Assign subscription'}</h3>
            <form onSubmit={submitAssign}>
            <div style={{ marginBottom: 8 }}>
              <label style={{ display: 'block' }}>Tenant</label>
              <select value={form.tenantId} onChange={e => setForm({ ...form, tenantId: e.target.value })} required style={{ width: '100%' }}>
                <option value="">Select tenant</option>
                {tenants.map(t => <option key={t.id} value={t.id}>{t.name} — {t.email}</option>)}
              </select>
            </div>

            <div style={{ marginBottom: 8 }}>
              <label style={{ display: 'block' }}>Plan</label>
              <select value={form.planId} onChange={e => setForm({ ...form, planId: e.target.value })} required style={{ width: '100%' }}>
                <option value="">Select plan</option>
                {plans.map(p => <option key={p.id} value={p.id}>{p.name} — {p.pricePerMonth}</option>)}
              </select>
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block' }}>Start date</label>
                <input type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} style={{ width: '100%' }} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block' }}>End date</label>
                <input type="date" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} required style={{ width: '100%' }} />
              </div>
            </div>

            <fieldset style={{ border: '1px solid #eee', padding: 12, borderRadius: 6, marginTop: 8 }}>
              <legend style={{ fontSize: 13 }}>Custom Limits (optional)</legend>
              <div style={{ display: 'grid', gap: 8 }}>
                <div>
                  <label>Staff</label>
                  <input type="number" value={String(form.customLimits.staff)} onChange={e => setForm({ ...form, customLimits: { ...form.customLimits, staff: Number(e.target.value) } })} style={{ width: '100%' }} />
                </div>
                <div>
                  <label>Product</label>
                  <input type="number" value={String(form.customLimits.product)} onChange={e => setForm({ ...form, customLimits: { ...form.customLimits, product: Number(e.target.value) } })} style={{ width: '100%' }} />
                </div>
                <div>
                  <label>Transaction</label>
                  <input type="number" value={String(form.customLimits.transaction)} onChange={e => setForm({ ...form, customLimits: { ...form.customLimits, transaction: Number(e.target.value) } })} style={{ width: '100%' }} />
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <label style={{ display: 'flex', alignItems: 'center' }}><input type="checkbox" checked={form.customLimits.report} onChange={e => setForm({ ...form, customLimits: { ...form.customLimits, report: e.target.checked } })} /> <span style={{ marginLeft: 8 }}>Report</span></label>
                  <label style={{ display: 'flex', alignItems: 'center' }}><input type="checkbox" checked={form.customLimits.payroll} onChange={e => setForm({ ...form, customLimits: { ...form.customLimits, payroll: e.target.checked } })} /> <span style={{ marginLeft: 8 }}>Payroll</span></label>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <label style={{ display: 'flex', alignItems: 'center' }}><input type="checkbox" checked={form.customLimits.discount} onChange={e => setForm({ ...form, customLimits: { ...form.customLimits, discount: e.target.checked } })} /> <span style={{ marginLeft: 8 }}>Discount</span></label>
                  <label style={{ display: 'flex', alignItems: 'center' }}><input type="checkbox" checked={form.customLimits.attendance} onChange={e => setForm({ ...form, customLimits: { ...form.customLimits, attendance: e.target.checked } })} /> <span style={{ marginLeft: 8 }}>Attendance</span></label>
                </div>
                <div>
                  <label style={{ display: 'flex', alignItems: 'center' }}><input type="checkbox" checked={form.customLimits.online_store} onChange={e => setForm({ ...form, customLimits: { ...form.customLimits, online_store: e.target.checked } })} /> <span style={{ marginLeft: 8 }}>Online Store</span></label>
                </div>
              </div>
            </fieldset>

              <div style={{ marginTop: 12 }}>
                <button type="submit" disabled={loading}>{editingSubscriptionId ? 'Update' : 'Assign'}</button>
                <button type="button" onClick={() => { setShowModal(false); setEditingTenant(null); setEditingSubscriptionId(null); }} style={{ marginLeft: 8 }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
