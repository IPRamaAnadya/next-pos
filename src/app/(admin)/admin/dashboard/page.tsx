"use client";

import React, { useEffect, useState } from 'react';
import AdminLayoutDashboard from '@/components/AdminLayout';

interface Tenant {
  id: string;
  name: string;
  email: string;
  is_subscribed: boolean;
  created_at: string;
}

interface Donation {
  id: string;
  tenant_name: string;
  amount: number;
  net_amount: number;
  payment_method: string;
  status: string;
  created_at: string;
}

interface TrendData {
  date: string;
  label: string;
  amount: number;
  count: number;
}

interface GrowthData {
  date: string;
  label: string;
  count: number;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState({
    totalTenants: 0,
    totalUsers: 0,
    totalDonations: 0,
    totalDonationAmount: 0,
  });
  const [recentTenants, setRecentTenants] = useState<Tenant[]>([]);
  const [recentDonations, setRecentDonations] = useState<Donation[]>([]);
  const [donationTrend, setDonationTrend] = useState<TrendData[]>([]);
  const [userGrowth, setUserGrowth] = useState<GrowthData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      
      const response = await fetch('/api/v2/admin/dashboard/statistics', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const result = await response.json();

      if (result.meta.success) {
        const data = result.data;
        setStats({
          totalTenants: data.statistics.total_tenants,
          totalUsers: data.statistics.total_users,
          totalDonations: data.statistics.total_donations,
          totalDonationAmount: data.statistics.total_donation_amount,
        });
        setRecentTenants(data.recent_tenants || []);
        setRecentDonations(data.recent_donations || []);
        setDonationTrend(data.donation_trend || []);
        setUserGrowth(data.user_growth || []);
      } else {
        setError(result.meta.message || 'Failed to load dashboard data');
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayoutDashboard>
      <div className="space-y-6">
        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Tenants"
            value={stats.totalTenants}
            icon={
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            }
            bgColor="bg-blue-500"
            loading={loading}
          />

          <StatCard
            title="Total Users"
            value={stats.totalUsers}
            icon={
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            }
            bgColor="bg-green-500"
            loading={loading}
          />

          <StatCard
            title="Total Donations"
            value={stats.totalDonations}
            icon={
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
            bgColor="bg-purple-500"
            loading={loading}
          />

          <StatCard
            title="Donation Amount"
            value={`Rp ${stats.totalDonationAmount.toLocaleString('id-ID')}`}
            icon={
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 8h6m-5 0a3 3 0 110 6H9l3 3m-3-6h6m6 1a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
            bgColor="bg-yellow-500"
            loading={loading}
          />
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Tenants</h3>
            <div className="space-y-4">
              {loading ? (
                <div className="animate-pulse space-y-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-16 bg-gray-200 rounded"></div>
                  ))}
                </div>
              ) : recentTenants.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No recent tenants
                </div>
              ) : (
                recentTenants.map((tenant) => (
                  <div key={tenant.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                    <div>
                      <p className="font-medium text-gray-900">{tenant.name}</p>
                      <p className="text-sm text-gray-600">{tenant.email}</p>
                    </div>
                    <div className="text-right">
                      <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                        tenant.is_subscribed ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {tenant.is_subscribed ? 'Active' : 'Inactive'}
                      </span>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(tenant.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Donations</h3>
            <div className="space-y-4">
              {loading ? (
                <div className="animate-pulse space-y-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-16 bg-gray-200 rounded"></div>
                  ))}
                </div>
              ) : recentDonations.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No recent donations
                </div>
              ) : (
                recentDonations.map((donation) => (
                  <div key={donation.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                    <div>
                      <p className="font-medium text-gray-900">{donation.tenant_name}</p>
                      <p className="text-sm text-gray-600">{donation.payment_method}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">
                        Rp {donation.amount.toLocaleString('id-ID')}
                      </p>
                      <span className={`inline-block px-2 py-1 text-xs rounded-full mt-1 ${
                        donation.status === 'PAID' ? 'bg-green-100 text-green-800' :
                        donation.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {donation.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Donation Trend (Last 7 Days)</h3>
            {loading ? (
              <div className="h-64 flex items-center justify-center">
                <div className="animate-pulse w-full h-full bg-gray-200 rounded"></div>
              </div>
            ) : (
              <DonationTrendChart data={donationTrend} />
            )}
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">User Growth (Last 7 Days)</h3>
            {loading ? (
              <div className="h-64 flex items-center justify-center">
                <div className="animate-pulse w-full h-full bg-gray-200 rounded"></div>
              </div>
            ) : (
              <UserGrowthChart data={userGrowth} />
            )}
          </div>
        </div>
      </div>
    </AdminLayoutDashboard>
  );
}

interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  bgColor: string;
  loading: boolean;
}

function StatCard({ title, value, icon, bgColor, loading }: StatCardProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6 animate-pulse">
        <div className="h-20 bg-gray-200 rounded"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`${bgColor} text-white p-3 rounded-lg`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

// Donation Trend Chart Component
function DonationTrendChart({ data }: { data: TrendData[] }) {
  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-400">
        <div className="text-center">
          <svg className="w-16 h-16 mx-auto mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <p>No donation data available</p>
        </div>
      </div>
    );
  }

  const maxAmount = Math.max(...data.map(d => d.amount), 1);
  const totalAmount = data.reduce((sum, d) => sum + d.amount, 0);
  const totalCount = data.reduce((sum, d) => sum + d.count, 0);

  return (
    <div className="space-y-6">
      {/* Chart Area */}
      <div className="relative" style={{ height: '200px' }}>
        <div className="absolute inset-0 flex items-end justify-between gap-3">
          {data.map((item, index) => {
            const heightPx = maxAmount > 0 ? (item.amount / maxAmount) * 180 : 0;
            const barHeight = Math.max(heightPx, 8); // Minimum 8px for visibility
            
            return (
              <div key={index} className="flex-1 flex flex-col items-center">
                <div className="relative w-full group">
                  {/* Bar */}
                  <div
                    className="w-full bg-gradient-to-t from-purple-600 to-purple-400 rounded-t-md transition-all duration-500 ease-out hover:from-purple-700 hover:to-purple-500 cursor-pointer shadow-sm"
                    style={{ 
                      height: `${barHeight}px`,
                      minHeight: item.amount > 0 ? '8px' : '2px'
                    }}
                  >
                    {/* Tooltip */}
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                      <div className="bg-gray-900 text-white text-xs rounded-lg px-3 py-2 shadow-lg whitespace-nowrap">
                        <div className="font-semibold mb-1">
                          Rp {item.amount.toLocaleString('id-ID')}
                        </div>
                        <div className="text-gray-300">
                          {item.count} donation{item.count !== 1 ? 's' : ''}
                        </div>
                        {/* Arrow */}
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-px">
                          <div className="border-4 border-transparent border-t-gray-900"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* X-axis Labels */}
      <div className="flex items-center justify-between gap-3 -mt-2">
        {data.map((item, index) => (
          <div key={index} className="flex-1 text-center">
            <div className="text-[10px] text-gray-500 font-medium">
              {item.label.split(' ')[0]}
            </div>
            <div className="text-[10px] text-gray-400">
              {item.label.split(' ').slice(1).join(' ')}
            </div>
          </div>
        ))}
      </div>

      {/* Summary Stats */}
      <div className="flex items-center justify-around pt-4 border-t border-gray-100">
        <div className="text-center">
          <div className="text-xl font-bold text-purple-600">
            Rp {(totalAmount / 1000).toFixed(0)}K
          </div>
          <div className="text-xs text-gray-500 mt-1">Total Amount</div>
        </div>
        <div className="w-px h-8 bg-gray-200"></div>
        <div className="text-center">
          <div className="text-xl font-bold text-purple-600">
            {totalCount}
          </div>
          <div className="text-xs text-gray-500 mt-1">Donations</div>
        </div>
        <div className="w-px h-8 bg-gray-200"></div>
        <div className="text-center">
          <div className="text-xl font-bold text-purple-600">
            {(totalAmount / Math.max(totalCount, 1)).toFixed(0)}
          </div>
          <div className="text-xs text-gray-500 mt-1">Avg/Donation</div>
        </div>
      </div>
    </div>
  );
}

// User Growth Chart Component
function UserGrowthChart({ data }: { data: GrowthData[] }) {
  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-400">
        <div className="text-center">
          <svg className="w-16 h-16 mx-auto mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p>No user data available</p>
        </div>
      </div>
    );
  }

  const maxCount = Math.max(...data.map(d => d.count), 1);
  const totalUsers = data.reduce((sum, d) => sum + d.count, 0);
  const avgPerDay = (totalUsers / 7).toFixed(1);

  return (
    <div className="space-y-6">
      {/* Chart Area */}
      <div className="relative" style={{ height: '200px' }}>
        <div className="absolute inset-0 flex items-end justify-between gap-3">
          {data.map((item, index) => {
            const heightPx = maxCount > 0 ? (item.count / maxCount) * 180 : 0;
            const barHeight = Math.max(heightPx, 8); // Minimum 8px for visibility
            
            return (
              <div key={index} className="flex-1 flex flex-col items-center">
                <div className="relative w-full group">
                  {/* Bar */}
                  <div
                    className="w-full bg-gradient-to-t from-green-600 to-green-400 rounded-t-md transition-all duration-500 ease-out hover:from-green-700 hover:to-green-500 cursor-pointer shadow-sm"
                    style={{ 
                      height: `${barHeight}px`,
                      minHeight: item.count > 0 ? '8px' : '2px'
                    }}
                  >
                    {/* Tooltip */}
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                      <div className="bg-gray-900 text-white text-xs rounded-lg px-3 py-2 shadow-lg whitespace-nowrap">
                        <div className="font-semibold">
                          {item.count} new user{item.count !== 1 ? 's' : ''}
                        </div>
                        {/* Arrow */}
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-px">
                          <div className="border-4 border-transparent border-t-gray-900"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* X-axis Labels */}
      <div className="flex items-center justify-between gap-3 -mt-2">
        {data.map((item, index) => (
          <div key={index} className="flex-1 text-center">
            <div className="text-[10px] text-gray-500 font-medium">
              {item.label.split(' ')[0]}
            </div>
            <div className="text-[10px] text-gray-400">
              {item.label.split(' ').slice(1).join(' ')}
            </div>
          </div>
        ))}
      </div>

      {/* Summary Stats */}
      <div className="flex items-center justify-around pt-4 border-t border-gray-100">
        <div className="text-center">
          <div className="text-xl font-bold text-green-600">
            {totalUsers}
          </div>
          <div className="text-xs text-gray-500 mt-1">New Users</div>
        </div>
        <div className="w-px h-8 bg-gray-200"></div>
        <div className="text-center">
          <div className="text-xl font-bold text-green-600">
            {avgPerDay}
          </div>
          <div className="text-xs text-gray-500 mt-1">Avg/Day</div>
        </div>
        <div className="w-px h-8 bg-gray-200"></div>
        <div className="text-center">
          <div className="text-xl font-bold text-green-600">
            {maxCount}
          </div>
          <div className="text-xs text-gray-500 mt-1">Peak Day</div>
        </div>
      </div>
    </div>
  );
}
