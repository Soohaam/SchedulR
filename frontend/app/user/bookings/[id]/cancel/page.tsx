'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/store';
import { ArrowLeft, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { GlassCard } from '@/components/ui/GlassCard';
import { Input } from '@/components/ui/Input';
import api from '@/lib/api';
import { toast } from 'sonner';

export default function CancelBookingPage() {
    const router = useRouter();
    const params = useParams();
    const bookingId = params?.id as string;
    const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);

    const [reason, setReason] = useState('');
    const [loading, setLoading] = useState(false);
    const [bookingDetails, setBookingDetails] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

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
            setIsLoading(true);
            const response = await api.get(`/api/v1/customer/bookings/${bookingId}`);
            setBookingDetails(response.data.booking);
        } catch (error) {
            console.error('Error fetching booking details:', error);
            toast.error('Failed to load booking details');
            router.push('/user/my-bookings');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCancel = async () => {
        if (!reason.trim()) {
            toast.error('Please provide a reason for cancellation');
            return;
        }

        try {
            setLoading(true);
            await api.post(`/api/v1/customer/bookings/${bookingId}/cancel`, {
                reason: reason.trim()
            });

            toast.success('Booking cancelled successfully');
            router.push('/user/my-bookings');
        } catch (error: any) {
            console.error('Error cancelling booking:', error);
            const errorMsg = error?.response?.data?.message || 'Failed to cancel booking';
            toast.error(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-accent border-t-transparent" />
            </div>
        );
    }

    if (!bookingDetails) {
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
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <Button
                        variant="ghost"
                        onClick={() => router.push(`/user/bookings/${bookingId}`)}
                        className="flex items-center gap-2 mb-4"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back
                    </Button>
                    <h1 className="text-3xl font-bold text-primary">Cancel Booking</h1>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Warning Card */}
                <GlassCard className="p-6 bg-red-50 mb-6">
                    <div className="flex items-start gap-4">
                        <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
                        <div>
                            <h3 className="text-lg font-semibold text-red-900 mb-2">Are you sure?</h3>
                            <p className="text-red-800 mb-3">
                                Once you cancel this booking, it cannot be undone. Your appointment with{' '}
                                <span className="font-semibold">{bookingDetails.appointmentType.title}</span> on{' '}
                                <span className="font-semibold">
                                    {new Date(bookingDetails.date).toLocaleDateString()}
                                </span>{' '}
                                will be cancelled.
                            </p>
                            {bookingDetails.payment && bookingDetails.payment.status === 'SUCCESS' && (
                                <p className="text-red-800">
                                    A refund will be processed to your original payment method within 5-7 business days.
                                </p>
                            )}
                        </div>
                    </div>
                </GlassCard>

                {/* Booking Summary */}
                <GlassCard className="p-6 bg-card/80 backdrop-blur-sm border-border/50 mb-6">
                    <h2 className="text-xl font-semibold text-primary mb-4">Booking Summary</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <p className="text-sm text-muted-foreground mb-1">Appointment</p>
                            <p className="font-medium text-primary">{bookingDetails.appointmentType.title}</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground mb-1">Provider</p>
                            <p className="font-medium text-primary">{bookingDetails.provider.name}</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground mb-1">Date</p>
                            <p className="font-medium text-primary">{new Date(bookingDetails.date).toLocaleDateString()}</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground mb-1">Time</p>
                            <p className="font-medium text-primary">
                                {new Date(bookingDetails.startTime).toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })}
                            </p>
                        </div>
                    </div>
                </GlassCard>

                {/* Cancellation Reason */}
                <GlassCard className="p-6 bg-card/80 backdrop-blur-sm border-border/50 mb-6">
                    <label className="block mb-4">
                        <p className="text-lg font-semibold text-primary mb-2">Reason for Cancellation</p>
                        <p className="text-sm text-muted-foreground mb-3">
                            Please let us know why you're cancelling. This helps us improve our service.
                        </p>
                        <textarea
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="Enter your reason..."
                            rows={5}
                            className="w-full px-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent text-foreground"
                        />
                    </label>
                </GlassCard>

                {/* Action Buttons */}
                <div className="flex gap-4">
                    <Button
                        variant="outline"
                        onClick={() => router.push(`/user/bookings/${bookingId}`)}
                        className="flex-1"
                    >
                        Don't Cancel
                    </Button>
                    <Button
                        onClick={handleCancel}
                        disabled={loading || !reason.trim()}
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white flex items-center justify-center gap-2"
                    >
                        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                        {loading ? 'Cancelling...' : 'Confirm Cancellation'}
                    </Button>
                </div>
            </div>
        </div>
    );
}
