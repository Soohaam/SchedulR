'use client';

import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/lib/store';
import { fetchOrganizerBookings } from '@/lib/features/organizer/organizerSlice';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Dropdown } from '@/components/ui/Dropdown';
import { 
  Search, 
  Calendar, 
  Clock, 
  MoreVertical, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Plus,
  Eye,
  Edit,
  Trash2
} from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export default function OrganizerDashboard() {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const { bookings, isLoading, stats } = useSelector((state: RootState) => state.organizer);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    dispatch(fetchOrganizerBookings({ search: searchTerm }));
  }, [dispatch, searchTerm]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED': return 'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400';
      case 'PENDING': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'CANCELLED': return 'text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-800 dark:text-gray-400';
    }
  };

  const handleViewDetails = (bookingId: string) => {
    router.push(`/organizer/appointments/${bookingId}`);
  };

  const handleEdit = (bookingId: string) => {
    toast.info('Edit functionality coming soon');
  };

  const handleDelete = (bookingId: string) => {
    toast.error('Delete functionality requires confirmation - coming soon');
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-primary font-['Georgia']">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, here's what's happening today.</p>
        </div>
        <Link href="/organizer/appointments/create">
          <Button className="metallic-gold-bg text-accent-foreground shadow-lg shadow-accent/20">
            <Plus className="w-4 h-4 mr-2" />
            New Appointment
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 bg-card border-border/50 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Bookings</p>
              <h3 className="text-2xl font-bold text-primary mt-1">{stats.totalBookings}</h3>
            </div>
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
        </Card>
        <Card className="p-6 bg-card border-border/50 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Pending</p>
              <h3 className="text-2xl font-bold text-yellow-600 dark:text-yellow-400 mt-1">{stats.pendingBookings}</h3>
            </div>
            <div className="w-10 h-10 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center text-yellow-600 dark:text-yellow-400">
              <AlertCircle className="w-5 h-5" />
            </div>
          </div>
        </Card>
        <Card className="p-6 bg-card border-border/50 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Confirmed</p>
              <h3 className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">{stats.confirmedBookings}</h3>
            </div>
            <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400">
              <CheckCircle className="w-5 h-5" />
            </div>
          </div>
        </Card>
      </div>

      {/* Recent Bookings */}
      <Card className="border-border/50 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-border/50 flex flex-col sm:flex-row justify-between items-center gap-4">
          <h2 className="text-xl font-semibold text-primary">Recent Bookings</h2>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search bookings..." 
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-secondary/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Service</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Date & Time</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50 bg-card">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">Loading bookings...</td>
                </tr>
              ) : bookings.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">No bookings found</td>
                </tr>
              ) : (
                bookings.map((booking) => (
                  <motion.tr 
                    key={booking.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-secondary/20 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs mr-3">
                          {booking.customer.fullName.charAt(0)}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-foreground">{booking.customer.fullName}</div>
                          <div className="text-xs text-muted-foreground">{booking.customer.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-foreground">{booking.appointmentType?.title || booking.appointmentType?.name}</div>
                      <div className="text-xs text-muted-foreground">{booking.appointmentType?.duration || 30} mins</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Calendar className="w-4 h-4 mr-2" />
                        {new Date(booking.startTime).toLocaleDateString()}
                      </div>
                      <div className="flex items-center text-xs text-muted-foreground mt-1">
                        <Clock className="w-3 h-3 mr-2" />
                        {new Date(booking.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(booking.status)}`}>
                        {booking.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Dropdown
                        trigger={
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-secondary/50">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        }
                        items={[
                          {
                            label: 'View Details',
                            onClick: () => handleViewDetails(booking.id),
                          },
                          {
                            label: 'Edit',
                            onClick: () => handleEdit(booking.id),
                          },
                          {
                            label: 'Delete',
                            onClick: () => handleDelete(booking.id),
                            variant: 'danger',
                          },
                        ]}
                        align="right"
                      />
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
