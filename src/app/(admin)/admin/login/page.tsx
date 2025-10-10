"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/auth/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data?.error || 'Login failed');
        setLoading(false);
        return;
      }

      const token = data.token;
      if (!token) {
        setError('No token returned from server');
        setLoading(false);
        return;
      }

  // store token in cookie for middleware to read
  // Note: this is not httpOnly. For production consider setting cookie from server side.
  const maxAge = 60 * 60 * 24 * 7; // 7 days
  // encodeURIComponent to avoid cookie parsing issues with periods etc.
  document.cookie = `token=${encodeURIComponent(token)}; path=/; max-age=${maxAge};`;

      // redirect to dashboard
      router.push('/dashboard');
    } catch (err: any) {
      setError(err?.message || 'Unexpected error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', background: '#f7f7f8' }}>
      <div style={{ width: 420, padding: 28, background: '#fff', borderRadius: 8, boxShadow: '0 6px 18px rgba(0,0,0,0.08)' }}>
        <h2 style={{ margin: 0, marginBottom: 12 }}>Admin Login</h2>
        <p style={{ marginTop: 0, marginBottom: 18, color: '#666' }}>Sign in with your admin account</p>
        <form onSubmit={handleSubmit}>
          <label style={{ display: 'block', marginBottom: 8 }}>
            <div style={{ fontSize: 13, marginBottom: 6 }}>Username or Email</div>
            <input value={identifier} onChange={e => setIdentifier(e.target.value)} type="text" placeholder="username or email" style={{ width: '100%', padding: '10px 12px', borderRadius: 6, border: '1px solid #ddd' }} />
          </label>

          <label style={{ display: 'block', marginBottom: 12 }}>
            <div style={{ fontSize: 13, marginBottom: 6 }}>Password</div>
            <input value={password} onChange={e => setPassword(e.target.value)} type="password" placeholder="password" style={{ width: '100%', padding: '10px 12px', borderRadius: 6, border: '1px solid #ddd' }} />
          </label>

          {error && <div style={{ marginBottom: 12, color: 'crimson' }}>{error}</div>}

          <button type="submit" disabled={loading} style={{ width: '100%', padding: '10px 12px', borderRadius: 6, background: '#111827', color: '#fff', border: 'none' }}>
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}
