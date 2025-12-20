'use client';

import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import { fetchProfile, logout } from '../../lib/features/auth/authSlice';
import { AppDispatch, RootState } from '../../lib/store';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import TwoFactorSettings from '../../components/auth/TwoFactorSettings';

export default function DashboardPage() {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useSelector(
    (state: RootState) => state.auth
  );

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
    } else if (!user) {
      dispatch(fetchProfile());
    }
  }, [dispatch, router, user]);

  const handleLogout = () => {
    dispatch(logout());
    router.push('/login');
  };

  if (isLoading && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated && !user) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
            </div>
            <div className="flex items-center">
              <span className="text-gray-700 mr-4">
                Welcome, {user?.firstName} {user?.lastName}
              </span>
              <Button
                variant="secondary"
                onClick={handleLogout}
                className="w-auto"
              >
                Sign out
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0 space-y-6">
          <Card>
            <h2 className="text-lg font-medium text-gray-900 mb-4">Profile Information</h2>
            <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Full name</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {user?.firstName} {user?.lastName}
                </dd>
              </div>
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Email address</dt>
                <dd className="mt-1 text-sm text-gray-900">{user?.email}</dd>
              </div>
            </dl>
          </Card>

          <Card>
            <TwoFactorSettings />
          </Card>
        </div>
      </main>
    </div>
  );
}
