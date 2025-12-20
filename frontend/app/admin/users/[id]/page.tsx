'use client';

import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter, useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { AppDispatch, RootState } from '../../../../lib/store';
import {
  fetchUserById,
  toggleUserStatus,
  changeUserRole,
  clearSelectedUser,
} from '../../../../lib/features/admin/adminSlice';
import { Card } from '../../../../components/ui/Card';
import { Button } from '../../../../components/ui/Button';
import { Badge } from '../../../../components/admin/TableComponents';

export default function AdminUserDetailPage() {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const params = useParams();
  const userId = params?.id as string;

  const { selectedUser, isLoading, error } = useSelector(
    (state: RootState) => state.admin
  );

  useEffect(() => {
    if (userId) {
      dispatch(fetchUserById(userId));
    }

    return () => {
      dispatch(clearSelectedUser());
    };
  }, [dispatch, userId]);

  const handleToggleStatus = async () => {
    if (!selectedUser) return;
    if (
      confirm(
        `Are you sure you want to ${selectedUser.isActive ? 'deactivate' : 'activate'} this user?`
      )
    ) {
      await dispatch(
        toggleUserStatus({ userId: selectedUser.id, isActive: !selectedUser.isActive })
      );
      dispatch(fetchUserById(userId));
    }
  };

  const handleChangeRole = async () => {
    if (!selectedUser) return;
    const roles = ['CUSTOMER', 'ORGANISER', 'ADMIN'];
    const newRole = prompt(
      `Enter new role for user (Current: ${selectedUser.role})\nOptions: CUSTOMER, ORGANISER, ADMIN`
    );

    if (newRole && roles.includes(newRole.toUpperCase())) {
      await dispatch(
        changeUserRole({ userId: selectedUser.id, newRole: newRole.toUpperCase() })
      );
      dispatch(fetchUserById(userId));
    } else if (newRole) {
      alert('Invalid role. Please use CUSTOMER, ORGANISER, or ADMIN');
    }
  };

  if (isLoading && !selectedUser) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <p className="text-destructive text-lg font-medium">{error}</p>
          <Button onClick={() => router.push('/admin/users')} className="mt-4">
            Back to Users
          </Button>
        </div>
      </div>
    );
  }

  if (!selectedUser) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={() => router.push('/admin/users')}>
          ← Back to Users
        </Button>
        <div className="flex gap-3">
          <Button variant="outline" onClick={handleChangeRole}>
            Change Role
          </Button>
          <Button
            variant={selectedUser.isActive ? 'destructive' : 'default'}
            onClick={handleToggleStatus}
          >
            {selectedUser.isActive ? 'Deactivate User' : 'Activate User'}
          </Button>
        </div>
      </div>

      {/* User Profile Card */}
      <Card>
        <div className="flex items-start gap-6">
          <div className="w-24 h-24 bg-accent rounded-full flex items-center justify-center text-accent-foreground font-bold text-4xl shadow-lg">
            {selectedUser.fullName?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-2xl font-bold text-foreground">
                {selectedUser.fullName || 'N/A'}
              </h2>
              <Badge
                variant={
                  selectedUser.role === 'ADMIN'
                    ? 'danger'
                    : selectedUser.role === 'ORGANISER'
                    ? 'info'
                    : 'default'
                }
              >
                {selectedUser.role}
              </Badge>
              <Badge variant={selectedUser.isActive ? 'success' : 'danger'}>
                {selectedUser.isActive ? 'Active' : 'Inactive'}
              </Badge>
              <Badge variant={selectedUser.isVerified ? 'success' : 'warning'}>
                {selectedUser.isVerified ? 'Verified' : 'Not Verified'}
              </Badge>
            </div>
            <p className="text-muted-foreground mb-4">{selectedUser.email}</p>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Phone:</span>
                <span className="ml-2 text-foreground">
                  {selectedUser.phone || 'N/A'}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Timezone:</span>
                <span className="ml-2 text-foreground">
                  {selectedUser.timezone || 'N/A'}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Login Count:</span>
                <span className="ml-2 text-foreground">{selectedUser.loginCount}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Last Login:</span>
                <span className="ml-2 text-foreground">
                  {selectedUser.lastLoginAt
                    ? new Date(selectedUser.lastLoginAt).toLocaleString()
                    : 'Never'}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Created:</span>
                <span className="ml-2 text-foreground">
                  {new Date(selectedUser.createdAt).toLocaleDateString()}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Updated:</span>
                <span className="ml-2 text-foreground">
                  {new Date(selectedUser.updatedAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Notification Settings */}
      <Card>
        <h3 className="text-lg font-semibold text-foreground mb-4">
          Notification Preferences
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-3">
            <div
              className={`w-12 h-6 rounded-full ${
                selectedUser.emailNotifications ? 'bg-green-500' : 'bg-gray-300'
              } relative transition-colors`}
            >
              <div
                className={`absolute top-1 ${
                  selectedUser.emailNotifications ? 'right-1' : 'left-1'
                } w-4 h-4 bg-white rounded-full transition-all`}
              />
            </div>
            <span className="text-sm text-foreground">Email Notifications</span>
          </div>
          <div className="flex items-center gap-3">
            <div
              className={`w-12 h-6 rounded-full ${
                selectedUser.smsNotifications ? 'bg-green-500' : 'bg-gray-300'
              } relative transition-colors`}
            >
              <div
                className={`absolute top-1 ${
                  selectedUser.smsNotifications ? 'right-1' : 'left-1'
                } w-4 h-4 bg-white rounded-full transition-all`}
              />
            </div>
            <span className="text-sm text-foreground">SMS Notifications</span>
          </div>
        </div>
      </Card>

      {/* Statistics Card */}
      {selectedUser.statistics && Object.keys(selectedUser.statistics).length > 0 && (
        <Card>
          <h3 className="text-lg font-semibold text-foreground mb-4">Statistics</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {selectedUser.role === 'CUSTOMER' && (
              <>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-muted/30 rounded-lg p-4"
                >
                  <p className="text-sm text-muted-foreground mb-1">Total Bookings</p>
                  <p className="text-3xl font-bold text-foreground">
                    {selectedUser.statistics.bookingCount || 0}
                  </p>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-muted/30 rounded-lg p-4"
                >
                  <p className="text-sm text-muted-foreground mb-1">Total Spent</p>
                  <p className="text-3xl font-bold text-accent">
                    ${(selectedUser.statistics.totalSpend || 0).toLocaleString()}
                  </p>
                </motion.div>
              </>
            )}
            {selectedUser.role === 'ORGANISER' && (
              <>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-muted/30 rounded-lg p-4"
                >
                  <p className="text-sm text-muted-foreground mb-1">Services Created</p>
                  <p className="text-3xl font-bold text-foreground">
                    {selectedUser.statistics.servicesCreated || 0}
                  </p>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-muted/30 rounded-lg p-4"
                >
                  <p className="text-sm text-muted-foreground mb-1">Bookings Received</p>
                  <p className="text-3xl font-bold text-foreground">
                    {selectedUser.statistics.bookingsReceived || 0}
                  </p>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-muted/30 rounded-lg p-4"
                >
                  <p className="text-sm text-muted-foreground mb-1">Total Revenue</p>
                  <p className="text-3xl font-bold text-accent">
                    ${(selectedUser.statistics.totalRevenue || 0).toLocaleString()}
                  </p>
                </motion.div>
              </>
            )}
          </div>
        </Card>
      )}

      {/* User ID Card */}
      <Card>
        <h3 className="text-lg font-semibold text-foreground mb-4">User ID</h3>
        <div className="bg-muted/30 rounded-lg p-4">
          <code className="text-sm font-mono text-foreground break-all">
            {selectedUser.id}
          </code>
        </div>
      </Card>
    </div>
  );
}
