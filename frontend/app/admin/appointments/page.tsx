'use client';

import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { AppDispatch, RootState } from '../../../lib/store';
import { fetchAppointments } from '../../../lib/features/admin/adminSlice';
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

export default function AdminAppointmentsPage() {
  const dispatch = useDispatch<AppDispatch>();
  const { appointments, appointmentsPagination, isLoading, error } = useSelector(
    (state: RootState) => state.admin
  );

  const [filters, setFilters] = useState({
    status: '',
    organizerId: '',
    customerId: '',
    startDate: '',
    endDate: '',
    page: 1,
    limit: 10,
  });

  useEffect(() => {
    dispatch(fetchAppointments(filters));
  }, [dispatch, filters]);

  // Debug logging
  useEffect(() => {
    console.log('Appointments data:', appointments);
    console.log('Appointments pagination:', appointmentsPagination);
    console.log('Is loading:', isLoading);
    console.log('Error:', error);
  }, [appointments, appointmentsPagination, isLoading, error]);

  const handlePageChange = (newPage: number) => {
    setFilters({ ...filters, page: newPage });
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status.toUpperCase()) {
      case 'CONFIRMED':
        return 'success';
      case 'PENDING':
        return 'warning';
      case 'COMPLETED':
        return 'info';
      case 'CANCELLED':
        return 'danger';
      default:
        return 'default';
    }
  };

  const formatDateTime = (date: string, time: string) => {
    const dateObj = new Date(date);
    const timeStr = new Date(time).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
    return `${dateObj.toLocaleDateString()} ${timeStr}`;
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                Status
              </label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}
                className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
              >
                <option value="">All Status</option>
                <option value="PENDING">Pending</option>
                <option value="CONFIRMED">Confirmed</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                Start Date
              </label>
              <Input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value, page: 1 })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                End Date
              </label>
              <Input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value, page: 1 })}
              />
            </div>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={() => dispatch(fetchAppointments(filters))}
              className="w-full md:w-auto"
            >
              Apply Filters
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setFilters({
                  status: '',
                  organizerId: '',
                  customerId: '',
                  startDate: '',
                  endDate: '',
                  page: 1,
                  limit: 10,
                });
              }}
              className="w-full md:w-auto"
            >
              Clear Filters
            </Button>
          </div>
        </div>
      </Card>

      {/* Appointments Table */}
      <Card className="p-0 overflow-hidden">
        {isLoading && appointments.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-destructive">{error}</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Appointment</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Organiser</TableHead>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Venue</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Payment</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {appointments.length > 0 ? (
                    appointments.map((appointment) => (
                      <TableRow key={appointment.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium text-foreground">
                              {appointment.appointmentTitle}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              ID: {appointment.id.slice(0, 8)}...
                            </div>
                            {appointment.staffMemberName && (
                              <div className="text-xs text-muted-foreground">
                                Staff: {appointment.staffMemberName}
                              </div>
                            )}
                            {appointment.resourceName && (
                              <div className="text-xs text-muted-foreground">
                                Resource: {appointment.resourceName}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium text-foreground text-sm">
                              {appointment.customerName}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {appointment.customerEmail}
                            </div>
                            {appointment.customerPhone && (
                              <div className="text-xs text-muted-foreground">
                                {appointment.customerPhone}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium text-foreground text-sm">
                              {appointment.organiserName}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {appointment.organiserEmail}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">
                          {formatDateTime(appointment.date, appointment.startTime)}
                        </TableCell>
                        <TableCell className="text-sm">
                          {appointment.venue || 'N/A'}
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusBadgeVariant(appointment.status)}>
                            {appointment.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {appointment.paymentAmount ? (
                            <div>
                              <div className="font-semibold text-accent">
                                ${appointment.paymentAmount.toLocaleString()}
                              </div>
                              <Badge
                                variant={
                                  appointment.paymentStatus === 'SUCCESS'
                                    ? 'success'
                                    : appointment.paymentStatus === 'PENDING'
                                    ? 'warning'
                                    : 'danger'
                                }
                                className="text-xs mt-1"
                              >
                                {appointment.paymentStatus}
                              </Badge>
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">No payment</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-muted-foreground">
                        No appointments found
                      </td>
                    </tr>
                  )}
                </TableBody>
              </Table>
            </div>
            {appointmentsPagination && (
              <Pagination
                currentPage={appointmentsPagination.currentPage}
                totalPages={appointmentsPagination.totalPages}
                hasNextPage={appointmentsPagination.hasNextPage}
                hasPreviousPage={appointmentsPagination.hasPreviousPage}
                onPageChange={handlePageChange}
              />
            )}
          </>
        )}
      </Card>

      {/* Summary Stats */}
      {appointments.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <p className="text-sm text-muted-foreground mb-1">Total Shown</p>
            <p className="text-2xl font-bold text-foreground">{appointments.length}</p>
          </Card>
          <Card>
            <p className="text-sm text-muted-foreground mb-1">Total Appointments</p>
            <p className="text-2xl font-bold text-foreground">
              {appointmentsPagination?.totalAppointments || 0}
            </p>
          </Card>
          <Card>
            <p className="text-sm text-muted-foreground mb-1">Total Revenue</p>
            <p className="text-2xl font-bold text-accent">
              $
              {appointments
                .reduce((sum, apt) => sum + (apt.paymentAmount || 0), 0)
                .toLocaleString()}
            </p>
          </Card>
          <Card>
            <p className="text-sm text-muted-foreground mb-1">Avg. Booking Value</p>
            <p className="text-2xl font-bold text-accent">
              $
              {appointments.length > 0
                ? (
                    appointments.reduce((sum, apt) => sum + (apt.paymentAmount || 0), 0) /
                    appointments.length
                  ).toFixed(2)
                : '0.00'}
            </p>
          </Card>
        </div>
      )}
    </div>
  );
}
