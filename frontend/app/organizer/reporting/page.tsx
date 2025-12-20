'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Search, Filter, Calendar as CalendarIcon, Download, Loader2 } from 'lucide-react';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/store';
import axios from 'axios';

export default function ReportingPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const { token } = useSelector((state: RootState) => state.auth);

  const fetchBookings = async () => {
    setIsLoading(true);
    try {
      // Fetch confirmed, completed, and cancelled bookings for reporting
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/organiser/bookings`, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          // We want "reporting" data, so mostly confirmed/completed history
          // But fetching all non-pending is essentially reporting
          status: statusFilter || undefined,
          search: searchTerm || undefined,
          limit: 50 // Fetch more for reporting
        }
      });

      // Filter out pending requests from reporting view if API returns them
      const nonPending = response.data.data.filter((b: any) => b.status !== 'PENDING');
      setBookings(nonPending);
    } catch (error) {
      console.error('Failed to fetch bookings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchBookings();
    }
  }, [token, searchTerm, statusFilter]);

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-primary font-['Georgia']">Reporting</h1>
          <p className="text-muted-foreground">Overview of all confirmed appointments and activity.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="flex gap-2">
            <Download className="w-4 h-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Stats Overview - calculated from fetched data for now */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 border-border/50">
          <p className="text-sm text-muted-foreground">Total Bookings</p>
          <h3 className="text-2xl font-bold">{bookings.length}</h3>
        </Card>
        <Card className="p-4 border-border/50">
          <p className="text-sm text-muted-foreground">Completed</p>
          <h3 className="text-2xl font-bold text-green-600">
            {bookings.filter(b => b.status === 'COMPLETED').length}
          </h3>
        </Card>
        <Card className="p-4 border-border/50">
          <p className="text-sm text-muted-foreground">Confirmed/Upcoming</p>
          <h3 className="text-2xl font-bold text-blue-600">
            {bookings.filter(b => b.status === 'CONFIRMED').length}
          </h3>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 bg-card p-4 rounded-lg border border-border/50 shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by customer, subject..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2 items-center">
          {/* 
            <Button variant="outline" className="flex gap-2">
                <CalendarIcon className="w-4 h-4" />
                <span className="hidden sm:inline">Date Range</span>
            </Button>
             */}
          <div className="relative">
            <select
              className="h-10 pl-3 pr-8 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring appearance-none"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
            <Filter className="absolute right-2.5 top-3 w-4 h-4 text-muted-foreground pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Table */}
      <Card className="overflow-hidden border-border/50 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-secondary/30 border-b border-border/50">
              <tr>
                <th className="px-6 py-4 font-medium">Customer</th>
                <th className="px-6 py-4 font-medium">Subject</th>
                <th className="px-6 py-4 font-medium">Resource/Staff</th>
                <th className="px-6 py-4 font-medium">Date & Time</th>
                <th className="px-6 py-4 font-medium">Duration</th>
                <th className="px-6 py-4 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
                  </td>
                </tr>
              ) : bookings.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground italic">
                    No confirmed bookings found.
                  </td>
                </tr>
              ) : (
                bookings.map((booking) => (
                  <tr key={booking.id} className="bg-card hover:bg-secondary/10 transition-colors">
                    <td className="px-6 py-4 font-medium">
                      {booking.customer?.fullName || booking.customerEmail || 'Guest'}
                    </td>
                    <td className="px-6 py-4">{booking.appointmentType?.title || 'Appointment'}</td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {booking.resource?.name || booking.staffMember?.name || '—'}
                    </td>
                    <td className="px-6 py-4">
                      {new Date(booking.startTime).toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      {booking.appointmentType?.duration}m
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${booking.status === 'COMPLETED' ? 'bg-gray-100 text-gray-800 border-gray-200' :
                        booking.status === 'CONFIRMED' ? 'bg-green-50 text-green-700 border-green-200' :
                          'bg-red-50 text-red-700 border-red-200'
                        }`}>
                        {booking.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
