'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/store';
import { motion } from 'framer-motion';
import { ArrowLeft, Calendar, Clock, MapPin, DollarSign, User, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import api from '@/lib/api';

interface BookingDetail {
    id: string;
    appointmentType: {
        title: string;
        description: string;
        duration: number;
        location: string;
    };
    provider: {
        id: string;
        name: string;
        type: string;
        specialization?: string;
        profileImage?: string;
        title?: string;
    };
    customer: {
        name: string;
        email: string;
        phone?: string;
    };
    date: string;
    startTime: string;
    endTime: string;
    status: string;
    capacity: number;
    venue?: string;
    notes?: string;
    answers?: Array<{ question: string; answer: string }>;
    payment?: {
        amount: number;
        status: string;
        paidAt?: string;
    };
    confirmationMessage?: string;
    canCancel: boolean;
    cancellationDeadline?: string;
    createdAt: string;
}

export default function BookingDetailPage() {
    const router = useRouter();
    const params = useParams();
    const bookingId = params?.id as string;
    const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);
    const [booking, setBooking] = useState<BookingDetail | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!isAuthenticated || user?.role !== 'CUSTOMER') {
            router.push('/login');
            return;
        }

        if (bookingId) {
            fetchBookingDetails();
        }
    }, [bookingId, isAuthenticated, user]);

    const fetchBookingDetails = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/api/v1/customer/bookings/${bookingId}`);
            setBooking(response.data.booking);
        } catch (error) {
            console.error('Error fetching booking details:', error);
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
                return <CheckCircle className="w-6 h-6" />;
            case 'PENDING':
                return <AlertCircle className="w-6 h-6" />;
            case 'CANCELLED':
                return <XCircle className="w-6 h-6" />;
            case 'COMPLETED':
                return <CheckCircle className="w-6 h-6" />;
            default:
                return <AlertCircle className="w-6 h-6" />;
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-accent border-t-transparent" />
            </div>
        );
    }

    if (!booking) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-primary mb-2">Booking not found</h2>
                    <Button onClick={() => router.push('/user/my-bookings')} className="mt-4">
                        Back to My Bookings
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <div className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <Button
                        variant="ghost"
                        onClick={() => router.push('/user/my-bookings')}
                        className="flex items-center gap-2 mb-4"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to My Bookings
                    </Button>
                    <div className="flex items-center justify-between">
                        <h1 className="text-3xl font-bold text-primary">Booking Details</h1>
                        <div className={`flex items-center gap-2 px-4 py-2 rounded-full border ${getStatusColor(booking.status)}`}>
                            {getStatusIcon(booking.status)}
                            <span className="font-semibold">{booking.status}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Appointment Info */}
                        <Card className="p-6 bg-card/80 backdrop-blur-sm border-border/50">
                            <h2 className="text-2xl font-bold text-primary mb-4">{booking.appointmentType.title}</h2>
                            {booking.appointmentType.description && (
                                <p className="text-muted-foreground mb-4">{booking.appointmentType.description}</p>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="flex items-center gap-3">
                                    <Calendar className="w-5 h-5 text-accent" />
                                    <div>
                                        <p className="text-sm text-muted-foreground">Date</p>
                                        <p className="font-medium text-primary">{new Date(booking.date).toLocaleDateString()}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <Clock className="w-5 h-5 text-accent" />
                                    <div>
                                        <p className="text-sm text-muted-foreground">Time</p>
                                        <p className="font-medium text-primary">
                                            {new Date(booking.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -
                                            {new Date(booking.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <MapPin className="w-5 h-5 text-accent" />
                                    <div>
                                        <p className="text-sm text-muted-foreground">Location</p>
                                        <p className="font-medium text-primary">{booking.venue || booking.appointmentType.location}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <User className="w-5 h-5 text-accent" />
                                    <div>
                                        <p className="text-sm text-muted-foreground">Duration</p>
                                        <p className="font-medium text-primary">{booking.appointmentType.duration} minutes</p>
                                    </div>
                                </div>
                            </div>
                        </Card>

                        {/* Provider Info */}
                        <Card className="p-6 bg-card/80 backdrop-blur-sm border-border/50">
                            <h3 className="text-xl font-semibold text-primary mb-4">Provider Information</h3>
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-accent/20 to-accent/5 flex items-center justify-center">
                                    {booking.provider.profileImage ? (
                                        <img
                                            src={booking.provider.profileImage}
                                            alt={booking.provider.name}
                                            className="w-full h-full rounded-full object-cover"
                                        />
                                    ) : (
                                        <User className="w-8 h-8 text-accent" />
                                    )}
                                </div>
                                <div>
                                    <p className="font-semibold text-primary">{booking.provider.name}</p>
                                    {booking.provider.title && (
                                        <p className="text-sm text-muted-foreground">{booking.provider.title}</p>
                                    )}
                                    {booking.provider.specialization && (
                                        <p className="text-sm text-muted-foreground">{booking.provider.specialization}</p>
                                    )}
                                    <p className="text-xs text-accent mt-1 capitalize">{booking.provider.type.toLowerCase()}</p>
                                </div>
                            </div>
                        </Card>

                        {/* Answers */}
                        {booking.answers && booking.answers.length > 0 && (
                            <Card className="p-6 bg-card/80 backdrop-blur-sm border-border/50">
                                <h3 className="text-xl font-semibold text-primary mb-4">Your Responses</h3>
                                <div className="space-y-3">
                                    {booking.answers.map((answer, index) => (
                                        <div key={index} className="border-b border-border pb-3 last:border-0">
                                            <p className="text-sm font-medium text-muted-foreground mb-1">{answer.question}</p>
                                            <p className="text-primary">{answer.answer}</p>
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        )}

                        {/* Notes */}
                        {booking.notes && (
                            <Card className="p-6 bg-card/80 backdrop-blur-sm border-border/50">
                                <h3 className="text-xl font-semibold text-primary mb-4">Notes</h3>
                                <p className="text-muted-foreground">{booking.notes}</p>
                            </Card>
                        )}
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Payment Info */}
                        {booking.payment && (
                            <Card className="p-6 bg-card/80 backdrop-blur-sm border-border/50">
                                <h3 className="text-lg font-semibold text-primary mb-4">Payment</h3>
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center">
                                        <span className="text-muted-foreground">Amount</span>
                                        <span className="font-semibold text-primary">${booking.payment.amount}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-muted-foreground">Status</span>
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${booking.payment.status === 'SUCCESS' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                                            }`}>
                                            {booking.payment.status}
                                        </span>
                                    </div>
                                    {booking.payment.paidAt && (
                                        <div className="flex justify-between items-center">
                                            <span className="text-muted-foreground">Paid At</span>
                                            <span className="text-sm text-primary">{new Date(booking.payment.paidAt).toLocaleString()}</span>
                                        </div>
                                    )}
                                </div>
                            </Card>
                        )}

                        {/* Actions */}
                        {booking.canCancel && (
                            <Card className="p-6 bg-card/80 backdrop-blur-sm border-border/50">
                                <h3 className="text-lg font-semibold text-primary mb-4">Actions</h3>
                                <div className="space-y-3">
                                    <Button
                                        variant="outline"
                                        className="w-full"
                                        onClick={() => router.push(`/user/bookings/${booking.id}/reschedule`)}
                                    >
                                        Reschedule Booking
                                    </Button>
                                    <Button
                                        variant="outline"
                                        className="w-full text-red-600 hover:bg-red-50 border-red-200"
                                        onClick={() => router.push(`/user/bookings/${booking.id}/cancel`)}
                                    >
                                        Cancel Booking
                                    </Button>
                                    {booking.cancellationDeadline && (
                                        <p className="text-xs text-muted-foreground text-center">
                                            Can cancel until: {new Date(booking.cancellationDeadline).toLocaleString()}
                                        </p>
                                    )}
                                </div>
                            </Card>
                        )}

                        {/* Confirmation Message */}
                        {booking.confirmationMessage && (
                            <Card className="p-6 bg-accent/5 border-accent/20">
                                <p className="text-sm text-primary">{booking.confirmationMessage}</p>
                            </Card>
                        )}

                        {/* Booking Info */}
                        <Card className="p-6 bg-card/80 backdrop-blur-sm border-border/50">
                            <h3 className="text-lg font-semibold text-primary mb-4">Booking Info</h3>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Booking ID</span>
                                    <span className="text-primary font-mono text-xs">{booking.id.slice(0, 8)}...</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Created</span>
                                    <span className="text-primary">{new Date(booking.createdAt).toLocaleDateString()}</span>
                                </div>
                            </div>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}
