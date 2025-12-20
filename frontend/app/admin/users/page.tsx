'use client';

import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { AppDispatch, RootState } from '../../../lib/store';
import { fetchUsers, toggleUserStatus, changeUserRole } from '../../../lib/features/admin/adminSlice';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Badge,
  Pagination,
} from '../../../components/admin/TableComponents';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Card } from '../../../components/ui/Card';

export default function AdminUsersPage() {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const { users, usersPagination, isLoading, error } = useSelector(
    (state: RootState) => state.admin
  );

  const [filters, setFilters] = useState({
    role: '',
    isActive: '',
    isVerified: '',
    search: '',
    page: 1,
    limit: 10,
  });

  useEffect(() => {
    dispatch(fetchUsers(filters));
  }, [dispatch, filters]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setFilters({ ...filters, page: 1 });
  };

  const handlePageChange = (newPage: number) => {
    setFilters({ ...filters, page: newPage });
  };

  const handleToggleStatus = async (userId: string, currentStatus: boolean) => {
    if (
      confirm(
        `Are you sure you want to ${currentStatus ? 'deactivate' : 'activate'} this user?`
      )
    ) {
      await dispatch(toggleUserStatus({ userId, isActive: !currentStatus }));
      dispatch(fetchUsers(filters));
    }
  };

  const handleChangeRole = async (userId: string, currentRole: string) => {
    const roles = ['CUSTOMER', 'ORGANISER', 'ADMIN'];
    const newRole = prompt(
      `Enter new role for user (Current: ${currentRole})\nOptions: CUSTOMER, ORGANISER, ADMIN`
    );

    if (newRole && roles.includes(newRole.toUpperCase())) {
      await dispatch(changeUserRole({ userId, newRole: newRole.toUpperCase() }));
      dispatch(fetchUsers(filters));
    } else if (newRole) {
      alert('Invalid role. Please use CUSTOMER, ORGANISER, or ADMIN');
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'danger';
      case 'ORGANISER':
        return 'info';
      case 'CUSTOMER':
        return 'default';
      default:
        return 'default';
    }
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                Search
              </label>
              <Input
                type="text"
                placeholder="Name or email..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                Role
              </label>
              <select
                value={filters.role}
                onChange={(e) => setFilters({ ...filters, role: e.target.value, page: 1 })}
                className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
              >
                <option value="">All Roles</option>
                <option value="CUSTOMER">Customer</option>
                <option value="ORGANISER">Organiser</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                Status
              </label>
              <select
                value={filters.isActive}
                onChange={(e) =>
                  setFilters({ ...filters, isActive: e.target.value, page: 1 })
                }
                className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
              >
                <option value="">All Status</option>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                Verified
              </label>
              <select
                value={filters.isVerified}
                onChange={(e) =>
                  setFilters({ ...filters, isVerified: e.target.value, page: 1 })
                }
                className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
              >
                <option value="">All</option>
                <option value="true">Verified</option>
                <option value="false">Not Verified</option>
              </select>
            </div>
          </div>
          <Button type="submit" className="w-full md:w-auto">
            Apply Filters
          </Button>
        </form>
      </Card>

      {/* Users Table */}
      <Card className="p-0 overflow-hidden">
        {isLoading && users.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-destructive">{error}</p>
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Verified</TableHead>
                  <TableHead>Last Login</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.length > 0 ? (
                  users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-accent rounded-full flex items-center justify-center text-accent-foreground font-semibold mr-3">
                            {user.fullName?.charAt(0).toUpperCase() || 'U'}
                          </div>
                          <div>
                            <div className="font-medium text-foreground">
                              {user.fullName || 'N/A'}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              ID: {user.id.slice(0, 8)}...
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{user.email}</TableCell>
                      <TableCell>
                        <Badge variant={getRoleBadgeVariant(user.role)}>
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.isActive ? 'success' : 'danger'}>
                          {user.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.isVerified ? 'success' : 'warning'}>
                          {user.isVerified ? 'Verified' : 'Pending'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {user.lastLoginAt
                          ? new Date(user.lastLoginAt).toLocaleDateString()
                          : 'Never'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => router.push(`/admin/users/${user.id}`)}
                            className="px-3 py-1 text-xs font-medium text-accent hover:text-accent/80 transition-colors"
                          >
                            View
                          </button>
                          <button
                            onClick={() => handleToggleStatus(user.id, user.isActive)}
                            className={`px-3 py-1 text-xs font-medium ${
                              user.isActive
                                ? 'text-red-600 hover:text-red-700'
                                : 'text-green-600 hover:text-green-700'
                            } transition-colors`}
                          >
                            {user.isActive ? 'Deactivate' : 'Activate'}
                          </button>
                          <button
                            onClick={() => handleChangeRole(user.id, user.role)}
                            className="px-3 py-1 text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors"
                          >
                            Change Role
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-muted-foreground">
                      No users found
                    </td>
                  </tr>
                )}
              </TableBody>
            </Table>
            {usersPagination && (
              <Pagination
                currentPage={usersPagination.currentPage}
                totalPages={usersPagination.totalPages}
                hasNextPage={usersPagination.hasNextPage}
                hasPreviousPage={usersPagination.hasPreviousPage}
                onPageChange={handlePageChange}
              />
            )}
          </>
        )}
      </Card>
    </div>
  );
}
