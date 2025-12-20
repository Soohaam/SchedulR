'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/lib/store';
import { fetchAvailableAppointments } from '@/lib/features/customer/customerSlice';
import { logout } from '@/lib/features/auth/authSlice';
import { motion } from 'framer-motion';
import { Search, Filter, Calendar, MapPin, Clock, User, LogOut } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

export default function UserDashboard() {
    const router = useRouter();
    const dispatch = useDispatch<AppDispatch>();
    const { user } = useSelector((state: RootState) => state.auth);
    const { appointments, isLoading } = useSelector((state: RootState) => state.customer);

    const [searchQuery, setSearchQuery] = useState('');
    const [typeFilter, setTypeFilter] = useState<'all' | 'free' | 'paid'>('all');

    const handleLogout = () => {
        dispatch(logout());
        router.push('/login');
    };

    useEffect(() => {
        // Fetch appointments on mount and when search changes
        dispatch(fetchAvailableAppointments({ search: searchQuery }));
    }, [dispatch, searchQuery]);

    // Filter appointments based on search and type
    const filteredAppointments = appointments.filter(apt => {
        // Search filter
        const matchesSearch = searchQuery === '' ||
            apt.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            apt.description?.toLowerCase().includes(searchQuery.toLowerCase());

        // Type filter
        const matchesType = typeFilter === 'all' ||
            (typeFilter === 'free' && !apt.requiresPayment) ||
            (typeFilter === 'paid' && apt.requiresPayment);

        return matchesSearch && matchesType;
    });

    const handleAppointmentClick = (appointmentId: string) => {
        router.push(`/user/appointments/${appointmentId}`);
    };

    const handleSearch = (value: string) => {
        setSearchQuery(value);
        // Debounce the API call
        dispatch(fetchAvailableAppointments({ search: value }));
    };

    if (isLoading && appointments.length === 0) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-accent border-t-transparent" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <div className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-primary">Available Appointments</h1>
                            <p className="text-sm text-muted-foreground mt-1">
                                Browse and book appointments that suit your needs
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <Button
                                onClick={() => router.push('/user/my-bookings')}
                                variant="outline"
                                className="flex items-center gap-2"
                            >
                                <Calendar className="w-4 h-4" />
                                My Bookings
                            </Button>
                            <Button
                                onClick={handleLogout}
                                variant="outline"
                                className="flex items-center gap-2"
                            >
                                <LogOut className="w-4 h-4" />
                                Logout
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Search and Filters */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <div className="flex flex-col sm:flex-row gap-4 mb-8">
                    {/* Search */}
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <Input
                            placeholder="Search appointments..."
                            value={searchQuery}
                            onChange={(e) => handleSearch(e.target.value)}
                            className="pl-10 bg-card"
                        />
                    </div>

                    {/* Type Filter */}
                    <div className="flex gap-2">
                        <Button
                            variant={typeFilter === 'all' ? 'default' : 'outline'}
                            onClick={() => setTypeFilter('all')}
                            className="flex items-center gap-2"
                        >
                            <Filter className="w-4 h-4" />
                            All
                        </Button>
                        <Button
                            variant={typeFilter === 'free' ? 'default' : 'outline'}
                            onClick={() => setTypeFilter('free')}
                        >
                            Free
                        </Button>
                        <Button
                            variant={typeFilter === 'paid' ? 'default' : 'outline'}
                            onClick={() => setTypeFilter('paid')}
                        >
                            Paid
                        </Button>
                    </div>
                </div>

                {/* Appointments Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
                    {filteredAppointments.map((appointment, index) => (
                        <motion.div
                            key={appointment.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: index * 0.05 }}
                        >
                            <Card
                                className="group cursor-pointer hover:shadow-xl transition-all duration-300 hover:scale-[1.02] overflow-hidden bg-card/80 backdrop-blur-sm border-border/50"
                                onClick={() => handleAppointmentClick(appointment.id)}
                            >
                                <div className="flex gap-4 p-6">
                                    {/* Image */}
                                    <div className="flex-shrink-0">
                                        <div className="w-32 h-32 rounded-lg bg-gradient-to-br from-accent/20 to-accent/5 flex items-center justify-center overflow-hidden">
                                            <Calendar className="w-16 h-16 text-accent/40" />
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-lg font-semibold text-primary mb-2 group-hover:text-accent transition-colors">
                                            {appointment.title}
                                        </h3>

                                        {/* Organizer */}
                                        <div className="flex items-center gap-2 mb-3">
                                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-accent/10 text-accent text-xs rounded-full">
                                                <User className="w-3 h-3" />
                                                {appointment.organizer.name}
                                            </span>
                                            {appointment.organizer.rating && (
                                                <span className="text-xs text-muted-foreground">
                                                    ⭐ {appointment.organizer.rating.toFixed(1)} ({appointment.organizer.reviewCount})
                                                </span>
                                            )}
                                        </div>

                                        {/* Meta Info */}
                                        <div className="space-y-1 text-sm text-muted-foreground">
                                            <div className="flex items-center gap-2">
                                                <Clock className="w-4 h-4" />
                                                <span>{appointment.duration} minutes</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <MapPin className="w-4 h-4" />
                                                <span>{appointment.location || 'Location TBD'}</span>
                                            </div>
                                        </div>

                                        {/* Description */}
                                        {appointment.description && (
                                            <p className="mt-3 text-sm text-muted-foreground line-clamp-2">
                                                {appointment.description}
                                            </p>
                                        )}

                                        {/* Price Tag */}
                                        {appointment.requiresPayment && (
                                            <div className="mt-3">
                                                <span className="inline-block px-3 py-1 bg-accent/20 text-accent font-semibold text-sm rounded-full">
                                                    ${appointment.price}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </Card>
                        </motion.div>
                    ))}
                </div>

                {/* Empty State */}
                {filteredAppointments.length === 0 && !isLoading && (
                    <div className="text-center py-12">
                        <Calendar className="w-16 h-16 text-muted-foreground/40 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-primary mb-2">No appointments found</h3>
                        <p className="text-muted-foreground">
                            {searchQuery || typeFilter !== 'all'
                                ? 'Try adjusting your filters'
                                : 'No appointments available at the moment'}
                        </p>
                    </div>
                )}

                {/* Loading State */}
                {isLoading && appointments.length > 0 && (
                    <div className="text-center py-4">
                        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent" />
                    </div>
                )}
            </div>
        </div>
    );
}
