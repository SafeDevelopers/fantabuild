/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useEffect } from 'react';
import {
  ChartBarIcon,
  UsersIcon,
  DocumentTextIcon,
  CreditCardIcon,
  TrashIcon,
  ArrowPathIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';
import { getAnalytics, getAllUsers, getAllCreations, updateUserRole, updateUserSubscription, deleteUser, deleteCreation } from '../services/admin-api';
import type { Analytics, AdminUser, AdminCreation } from '../services/admin-api';
import { getCurrentUser, signOut } from '../services/auth-api';

export const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'creations'>('overview');
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [creations, setCreations] = useState<AdminCreation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usersTotal, setUsersTotal] = useState(0);
  const [creationsTotal, setCreationsTotal] = useState(0);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  // Check authentication and admin status first
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { user, error: authError } = await getCurrentUser();
        if (authError || !user) {
          setError('Please sign in to access the admin dashboard');
          setCheckingAuth(false);
          return;
        }
        
        if (user.role !== 'admin') {
          setError('Admin access required. Your account does not have admin privileges.');
          setCheckingAuth(false);
          return;
        }
        
        setIsAdmin(true);
        setCheckingAuth(false);
        // Now load data
        loadData();
      } catch (err: any) {
        setError(err.message || 'Failed to verify authentication');
        setCheckingAuth(false);
      }
    };
    
    checkAuth();
  }, []);

  useEffect(() => {
    if (isAdmin && !checkingAuth) {
      loadData();
    }
  }, [activeTab, isAdmin]);

  const loadData = async () => {
    if (!isAdmin) return;
    
    setLoading(true);
    setError(null);

    try {
      if (activeTab === 'overview') {
        const { data, error: analyticsError } = await getAnalytics();
        if (analyticsError) {
          // Check if it's an auth error
          if (analyticsError.includes('Authentication') || analyticsError.includes('401') || analyticsError.includes('403')) {
            throw new Error('Authentication failed. Please sign in again.');
          }
          throw new Error(analyticsError);
        }
        setAnalytics(data);
      } else if (activeTab === 'users') {
        const { users: usersData, total, error: usersError } = await getAllUsers(100, 0);
        if (usersError) {
          if (usersError.includes('Authentication') || usersError.includes('401') || usersError.includes('403')) {
            throw new Error('Authentication failed. Please sign in again.');
          }
          throw new Error(usersError);
        }
        setUsers(usersData);
        setUsersTotal(total);
      } else if (activeTab === 'creations') {
        const { creations: creationsData, total, error: creationsError } = await getAllCreations(100, 0);
        if (creationsError) {
          if (creationsError.includes('Authentication') || creationsError.includes('401') || creationsError.includes('403')) {
            throw new Error('Authentication failed. Please sign in again.');
          }
          throw new Error(creationsError);
        }
        setCreations(creationsData);
        setCreationsTotal(total);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRole = async (userId: string, newRole: 'user' | 'admin') => {
    if (!window.confirm(`Change user role to ${newRole}?`)) return;
    
    const { error } = await updateUserRole(userId, newRole);
    if (error) {
      alert(`Failed: ${error}`);
    } else {
      loadData();
    }
  };

  const handleUpdateSubscription = async (userId: string, newStatus: 'free' | 'pro') => {
    if (!window.confirm(`Change subscription to ${newStatus}?`)) return;
    
    const { error } = await updateUserSubscription(userId, newStatus);
    if (error) {
      alert(`Failed: ${error}`);
    } else {
      loadData();
    }
  };

  const handleDeleteUser = async (userId: string, email: string) => {
    if (!window.confirm(`Delete user ${email}? This cannot be undone.`)) return;
    
    const { error } = await deleteUser(userId);
    if (error) {
      alert(`Failed: ${error}`);
    } else {
      loadData();
    }
  };

  const handleDeleteCreation = async (creationId: string, name: string) => {
    if (!window.confirm(`Delete creation "${name}"? This cannot be undone.`)) return;
    
    const { error } = await deleteCreation(creationId);
    if (error) {
      alert(`Failed: ${error}`);
    } else {
      loadData();
    }
  };

  if (checkingAuth) {
    return (
      <div className="h-[100dvh] bg-[#050505] text-zinc-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-orange-500/30 border-t-orange-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-zinc-400 text-sm">Verifying authentication...</p>
        </div>
      </div>
    );
  }

  if (error && !isAdmin) {
    return (
      <div className="h-[100dvh] bg-[#050505] text-zinc-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-zinc-900 border border-red-500/50 rounded-lg p-6 text-center">
          <h2 className="text-xl font-bold text-red-400 mb-4">Access Denied</h2>
          <p className="text-zinc-300 mb-6">{error}</p>
          <div className="flex flex-col space-y-3">
            <button
              onClick={async () => {
                await signOut();
                window.location.href = '/';
              }}
              className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg"
            >
              Logout
            </button>
            <button
              onClick={() => window.location.href = '/'}
              className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-lg"
            >
              Return to App
            </button>
          </div>
          {error.includes('admin privileges') && (
            <div className="mt-4 p-3 bg-zinc-800 rounded text-left text-xs text-zinc-400">
              <p className="font-semibold mb-2">To get admin access:</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Make sure you're signed in</li>
                <li>Run: <code className="bg-zinc-900 px-1 rounded">node test-admin.js your-email@example.com</code></li>
                <li>Sign out and sign in again</li>
              </ol>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (loading && !analytics && activeTab === 'overview') {
    return (
      <div className="h-[100dvh] bg-[#050505] text-zinc-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-orange-500/30 border-t-orange-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-zinc-400 text-sm">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-[#050505] text-zinc-50">
      {/* Header */}
      <div className="bg-zinc-900 border-b border-zinc-800 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <ShieldCheckIcon className="w-6 h-6 text-orange-500" />
              <h1 className="text-xl font-bold">Admin Dashboard</h1>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={async () => {
                  await signOut();
                  window.location.href = '/';
                }}
                className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-sm transition-colors"
              >
                Logout
              </button>
              <button
                onClick={() => window.location.href = '/'}
                className="text-zinc-400 hover:text-white transition-colors text-sm"
              >
                ← Back to App
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex space-x-1 mt-4">
            {(['overview', 'users', 'creations'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === tab
                    ? 'bg-orange-600 text-white'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {activeTab === 'overview' && analytics && (
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                icon={UsersIcon}
                label="Total Users"
                value={analytics.total_users}
                subtitle={`${analytics.pro_users} Pro users`}
                color="blue"
              />
              <StatCard
                icon={DocumentTextIcon}
                label="Total Creations"
                value={analytics.total_creations}
                subtitle={`${analytics.purchased_creations} purchased`}
                color="green"
              />
              <StatCard
                icon={ChartBarIcon}
                label="Total Generations"
                value={analytics.total_generations}
                subtitle="All time"
                color="purple"
              />
              <StatCard
                icon={ArrowPathIcon}
                label="Last 7 Days"
                value={`${analytics.new_users_7d} users`}
                subtitle={`${analytics.new_creations_7d} creations`}
                color="orange"
              />
            </div>

            {/* Quick Actions */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
              <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => setActiveTab('users')}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm"
                >
                  View All Users
                </button>
                <button
                  onClick={() => setActiveTab('creations')}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm"
                >
                  View All Creations
                </button>
                <button
                  onClick={loadData}
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-500 rounded-lg text-sm"
                >
                  Refresh Data
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Users ({usersTotal})</h2>
              <button
                onClick={loadData}
                className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm"
              >
                Refresh
              </button>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-zinc-800">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400">Email</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400">Role</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400">Subscription</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400">Usage</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400">Creations</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800">
                    {users.map((user) => (
                      <tr key={user.id} className="hover:bg-zinc-800/50">
                        <td className="px-4 py-3 text-sm">{user.email}</td>
                        <td className="px-4 py-3">
                          <select
                            value={user.role}
                            onChange={(e) => handleUpdateRole(user.id, e.target.value as 'user' | 'admin')}
                            className="bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-xs"
                          >
                            <option value="user">User</option>
                            <option value="admin">Admin</option>
                          </select>
                        </td>
                        <td className="px-4 py-3">
                          <select
                            value={user.subscription_status}
                            onChange={(e) => handleUpdateSubscription(user.id, e.target.value as 'free' | 'pro')}
                            className="bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-xs"
                          >
                            <option value="free">Free</option>
                            <option value="pro">Pro</option>
                          </select>
                        </td>
                        <td className="px-4 py-3 text-sm text-zinc-400">{user.daily_usage_count}</td>
                        <td className="px-4 py-3 text-sm text-zinc-400">{user.creations_count}</td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => handleDeleteUser(user.id, user.email)}
                            className="text-red-400 hover:text-red-300 text-xs"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'creations' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Creations ({creationsTotal})</h2>
              <button
                onClick={loadData}
                className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm"
              >
                Refresh
              </button>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-zinc-800">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400">Name</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400">User</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400">Mode</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400">Purchased</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400">Created</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800">
                    {creations.map((creation) => (
                      <tr key={creation.id} className="hover:bg-zinc-800/50">
                        <td className="px-4 py-3 text-sm">{creation.name}</td>
                        <td className="px-4 py-3 text-sm text-zinc-400">{creation.user_email}</td>
                        <td className="px-4 py-3 text-sm text-zinc-400">{creation.mode}</td>
                        <td className="px-4 py-3">
                          {creation.purchased ? (
                            <span className="text-green-400 text-xs">✓ Yes</span>
                          ) : (
                            <span className="text-zinc-500 text-xs">No</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-zinc-400">
                          {new Date(creation.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => handleDeleteCreation(creation.id, creation.name)}
                            className="text-red-400 hover:text-red-300 text-xs"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const StatCard = ({
  icon: Icon,
  label,
  value,
  subtitle,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  subtitle?: string;
  color: 'blue' | 'green' | 'purple' | 'orange';
}) => {
  const colorClasses = {
    blue: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    green: 'bg-green-500/10 text-green-400 border-green-500/20',
    purple: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    orange: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  };

  return (
    <div className={`bg-zinc-900 border ${colorClasses[color]} rounded-lg p-4`}>
      <div className="flex items-center justify-between mb-2">
        <Icon className="w-5 h-5" />
        <span className="text-xs text-zinc-500">{label}</span>
      </div>
      <div className="text-2xl font-bold mb-1">{value.toLocaleString()}</div>
      {subtitle && <div className="text-xs text-zinc-500">{subtitle}</div>}
    </div>
  );
};

