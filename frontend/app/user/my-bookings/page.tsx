'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '@/lib/store';
import { logout } from '@/lib/features/auth/authSlice';
import { motion } from 'framer-motion';
import { ArrowLeft, Calendar, Clock, MapPin, DollarSign, CheckCircle, XCircle, AlertCircle, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { GlassCard } from '@/components/ui/GlassCard';
import { BackgroundParticles } from '@/components/ui/BackgroundParticles';
import api from '@/lib/api';

interface Booking {
    id: string;
    appointmentType: {
        title: string;
        duration: number;
    };
    provider: {
        name: string;
        type: string;
        profileImage?: string;
    };
    date: string;
    startTime: string;
    endTime: string;
    status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
    venue?: string;
    canCancel: boolean;
    cancellationDeadline?: string;
}

export default function MyBookingsPage() {
    const router = useRouter();
    const dispatch = useDispatch<AppDispatch>();
    const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [filter, setFilter] = useState<'all' | 'upcoming' | 'past'>('all');
    const [loading, setLoading] = useState(true);

    const handleLogout = () => {
        dispatch(logout());
        router.push('/login');
    };

    useEffect(() => {
        if (!isAuthenticated || user?.role !== 'CUSTOMER') {
            router.push('/login');
            return;
        }

        fetchBookings();
    }, [isAuthenticated, user, filter]);

    const fetchBookings = async () => {
        try {
            setLoading(true);
            const params: any = {};
            if (filter === 'upcoming') params.upcoming = true;
            if (filter === 'past') params.past = true;

            const response = await api.get('/api/v1/customer/bookings/my-bookings', { params });
            setBookings(response.data.bookings || []);
        } catch (error) {
            console.error('Error fetching bookings:', error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'CONFIRMED':
                return 'text-green-600 bg-green-50 border-green-200';
            case 'PENDING':
                return 'text-yellow-600 bg-yellow-50 border-yellow-200';
            case 'CANCELLED':
                return 'text-red-600 bg-red-50 border-red-200';
            case 'COMPLETED':
                return 'text-blue-600 bg-blue-50 border-blue-200';
            default:
                return 'text-gray-600 bg-gray-50 border-gray-200';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'CONFIRMED':
                return <CheckCircle className="w-5 h-5" />;
            case 'PENDING':
                return <AlertCircle className="w-5 h-5" />;
            case 'CANCELLED':
                return <XCircle className="w-5 h-5" />;
            case 'COMPLETED':
                return <CheckCircle className="w-5 h-5" />;
            default:
                return <AlertCircle className="w-5 h-5" />;
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-accent border-t-transparent" />
            </div>
        );
    }

    return (
        <div className="min-h-screen mesh-background vignette relative overflow-hidden bg-background">
            <BackgroundParticles />
            {/* Header */}
            <div className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Button
                                variant="ghost"
                                onClick={() => router.push('/user')}
                                className="flex items-center gap-2"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                Back
                            </Button>
                            <h1 className="text-2xl font-bold text-primary">My Bookings</h1>
                        </div>
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

            {/* Filters */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <div className="flex gap-2 mb-6">
                    <Button
                        variant={filter === 'all' ? 'default' : 'outline'}
                        onClick={() => setFilter('all')}
                    >
                        All Bookings
                    </Button>
                    <Button
                        variant={filter === 'upcoming' ? 'default' : 'outline'}
                        onClick={() => setFilter('upcoming')}
                    >
                        Upcoming
                    </Button>
                    <Button
                        variant={filter === 'past' ? 'default' : 'outline'}
                        onClick={() => setFilter('past')}
                    >
                        Past
                    </Button>
                </div>

                {/* Bookings List */}
                <div className="space-y-4">
                    {bookings.map((booking, index) => (
                        <motion.div
                            key={booking.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: index * 0.05 }}
                        >
                            <GlassCard
                                className="cursor-pointer hover:shadow-lg transition-all duration-300"
                                onClick={() => router.push(`/user/bookings/${booking.id}`)}
                            >
                                <div className="p-6">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex-1">
                                            <h3 className="text-xl font-semibold text-primary mb-2">
                                                {booking.appointmentType.title}
                                            </h3>
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                <span className="font-medium">{booking.provider.name}</span>
                                                <span>•</span>
                                                <span className="capitalize">{booking.provider.type.toLowerCase()}</span>
                                            </div>
                                        </div>
                                        <div className={`flex items-center gap-2 px-3 py-1 rounded-full border ${getStatusColor(booking.status)}`}>
                                            {getStatusIcon(booking.status)}
                                            <span className="font-medium text-sm">{booking.status}</span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <Calendar className="w-4 h-4 text-accent" />
                                            <span>{new Date(booking.date).toLocaleDateString()}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <Clock className="w-4 h-4 text-accent" />
                                            <span>
                                                {new Date(booking.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -
                                                {new Date(booking.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                        {booking.venue && (
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                <MapPin className="w-4 h-4 text-accent" />
                                                <span>{booking.venue}</span>
                                            </div>
                                        )}
                                    </div>

                                    {booking.canCancel && (
                                        <div className="flex items-center justify-between pt-4 border-t border-border">
                                            <span className="text-sm text-muted-foreground">
                                                Can cancel until: {booking.cancellationDeadline ? new Date(booking.cancellationDeadline).toLocaleString() : 'N/A'}
                                            </span>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="text-red-600 hover:bg-red-50"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    router.push(`/user/bookings/${booking.id}/cancel`);
                                                }}
                                            >
                                                Cancel Booking
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </Card>
                        </motion.div>
                    ))}
                </div>

                {/* Empty State */}
                {bookings.length === 0 && (
                    <div className="text-center py-12">
                        <Calendar className="w-16 h-16 text-muted-foreground/40 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-primary mb-2">No bookings found</h3>
                        <p className="text-muted-foreground mb-4">
                            {filter === 'upcoming'
                                ? "You don't have any upcoming bookings"
                                : filter === 'past'
                                    ? "You don't have any past bookings"
                                    : "You haven't made any bookings yet"}
                        </p>
                        <Button onClick={() => router.push('/user')}>
                            Browse Appointments
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
