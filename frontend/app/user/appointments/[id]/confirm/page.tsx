'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/store';
import { motion } from 'framer-motion';
import { CheckCircle, Calendar, Clock, MapPin, User, DollarSign, AlertCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import api from '@/lib/api';

export default function ConfirmationPage() {
    const router = useRouter();
    const params = useParams();
    const appointmentId = params?.id as string;
    const { user } = useSelector((state: RootState) => state.auth);

    const [bookingData, setBookingData] = useState<any>(null);
    const [confirming, setConfirming] = useState(false);
    const [confirmed, setConfirmed] = useState(false);
    const [bookingId, setBookingId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Get booking data from sessionStorage
        const stored = sessionStorage.getItem('bookingData');
        if (!stored) {
            router.push(`/user/appointments/${appointmentId}/book`);
            return;
        }

        setBookingData(JSON.parse(stored));
    }, [appointmentId]);

    const handleConfirmBooking = async () => {
        if (!bookingData) return;

        setConfirming(true);
        setError(null);

        try {
            // Create booking
            const response = await api.post('/api/v1/customer/bookings/create', {
                appointmentTypeId: bookingData.appointmentId,
                providerId: bookingData.providerId,
                providerType: bookingData.providerType,
                date: bookingData.date,
                startTime: bookingData.startTime,
                capacity: bookingData.capacity,
                answers: bookingData.answers || [],
                notes: '',
            });

            const createdBookingId = response.data.booking.id;
            setBookingId(createdBookingId);

            // If payment was made, confirm payment
            if (bookingData.payment) {
                await api.post(`/api/v1/customer/bookings/${createdBookingId}/confirm-payment`, {
                    paymentMethod: bookingData.payment.method,
                    amount: bookingData.payment.amount,
                    transactionId: `TXN${Date.now()}`, // Mock transaction ID
                });
            }

            setConfirmed(true);
            // Clear session storage
            sessionStorage.removeItem('bookingData');
        } catch (error: any) {
            console.error('Error creating booking:', error);
            setError(error.response?.data?.message || 'Failed to create booking. Please try again.');
        } finally {
            setConfirming(false);
        }
    };

    const handleCancelBooking = () => {
        sessionStorage.removeItem('bookingData');
        router.push(`/user/appointments/${appointmentId}/book`);
    };

    if (!bookingData) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-accent border-t-transparent" />
            </div>
        );
    }

    if (confirmed && bookingId) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="max-w-2xl w-full"
                >
                    <Card className="p-8 text-center">
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.2, type: 'spring' }}
                            className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6"
                        >
                            <CheckCircle className="w-12 h-12 text-green-600 dark:text-green-400" />
                        </motion.div>

                        <h1 className="text-3xl font-bold text-primary mb-2">
                            {bookingData.appointment.manualConfirmation
                                ? 'Appointment Reserved!'
                                : 'Appointment Confirmed!'}
                        </h1>

                        <p className="text-lg text-muted-foreground mb-8">
                            {bookingData.appointment.manualConfirmation
                                ? 'You will get an email when organizer confirms your booking'
                                : 'Your appointment has been successfully booked'}
                        </p>

                        <div className="bg-secondary/20 rounded-lg p-6 mb-6 text-left">
                            <h3 className="font-semibold text-primary mb-4">Booking Details</h3>

                            <div className="space-y-3">
                                <div className="flex items-start gap-3">
                                    <Calendar className="w-5 h-5 text-accent mt-0.5" />
                                    <div>
                                        <p className="text-sm text-muted-foreground">Date</p>
                                        <p className="font-medium text-primary">
                                            {new Date(bookingData.date).toLocaleDateString('en-US', {
                                                weekday: 'long',
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric'
                                            })}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <Clock className="w-5 h-5 text-accent mt-0.5" />
                                    <div>
                                        <p className="text-sm text-muted-foreground">Time</p>
                                        <p className="font-medium text-primary">
                                            {new Date(bookingData.startTime).toLocaleTimeString([], {
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <MapPin className="w-5 h-5 text-accent mt-0.5" />
                                    <div>
                                        <p className="text-sm text-muted-foreground">Location</p>
                                        <p className="font-medium text-primary">{bookingData.appointment.location}</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <User className="w-5 h-5 text-accent mt-0.5" />
                                    <div>
                                        <p className="text-sm text-muted-foreground">Provider</p>
                                        <p className="font-medium text-primary">
                                            {bookingData.providerType === 'STAFF' ? 'Staff Member' : 'Resource'}
                                        </p>
                                    </div>
                                </div>

                                {bookingData.capacity > 1 && (
                                    <div className="flex items-start gap-3">
                                        <User className="w-5 h-5 text-accent mt-0.5" />
                                        <div>
                                            <p className="text-sm text-muted-foreground">Number of People</p>
                                            <p className="font-medium text-primary">{bookingData.capacity}</p>
                                        </div>
                                    </div>
                                )}

                                {bookingData.payment && (
                                    <div className="flex items-start gap-3">
                                        <DollarSign className="w-5 h-5 text-accent mt-0.5" />
                                        <div>
                                            <p className="text-sm text-muted-foreground">Payment</p>
                                            <p className="font-medium text-green-600 dark:text-green-400">
                                                Paid ${bookingData.payment.amount.toFixed(2)}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {bookingData.appointment.confirmationMessage && (
                            <div className="bg-accent/10 border border-accent/20 rounded-lg p-4 mb-6">
                                <p className="text-sm text-primary">{bookingData.appointment.confirmationMessage}</p>
                            </div>
                        )}

                        <div className="flex gap-4">
                            <Button
                                onClick={() => router.push('/user/my-bookings')}
                                variant="outline"
                                className="flex-1"
                            >
                                View My Bookings
                            </Button>
                            <Button
                                onClick={() => router.push('/user')}
                                className="flex-1 bg-accent text-accent-foreground"
                            >
                                Book Another
                            </Button>
                        </div>
                    </Card>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <div className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-40">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <h1 className="text-3xl font-bold text-primary">Confirm Your Booking</h1>
                    <p className="text-muted-foreground mt-1">Review your booking details before confirming</p>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3"
                    >
                        <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5" />
                        <div className="flex-1">
                            <p className="text-sm font-medium text-red-800 dark:text-red-200">{error}</p>
                        </div>
                        <button onClick={() => setError(null)} className="text-red-600 dark:text-red-400">
                            <X className="w-4 h-4" />
                        </button>
                    </motion.div>
                )}

                <Card className="p-6 mb-6">
                    <h2 className="text-xl font-semibold text-primary mb-6">Appointment Details</h2>

                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm text-muted-foreground mb-1">Appointment</p>
                                <p className="font-semibold text-primary">{bookingData.appointment.title}</p>
                            </div>

                            <div>
                                <p className="text-sm text-muted-foreground mb-1">Organizer</p>
                                <p className="font-medium text-primary">{bookingData.appointment.organizer.name}</p>
                            </div>

                            <div>
                                <p className="text-sm text-muted-foreground mb-1">Date</p>
                                <p className="font-medium text-primary">
                                    {new Date(bookingData.date).toLocaleDateString('en-US', {
                                        weekday: 'long',
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                    })}
                                </p>
                            </div>

                            <div>
                                <p className="text-sm text-muted-foreground mb-1">Time</p>
                                <p className="font-medium text-primary">
                                    {new Date(bookingData.startTime).toLocaleTimeString([], {
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })}
                                </p>
                            </div>

                            <div>
                                <p className="text-sm text-muted-foreground mb-1">Duration</p>
                                <p className="font-medium text-primary">{bookingData.appointment.duration} minutes</p>
                            </div>

                            <div>
                                <p className="text-sm text-muted-foreground mb-1">Location</p>
                                <p className="font-medium text-primary">{bookingData.appointment.location}</p>
                            </div>

                            {bookingData.capacity > 1 && (
                                <div>
                                    <p className="text-sm text-muted-foreground mb-1">Number of People</p>
                                    <p className="font-medium text-primary">{bookingData.capacity}</p>
                                </div>
                            )}

                            {bookingData.payment && (
                                <div>
                                    <p className="text-sm text-muted-foreground mb-1">Total Paid</p>
                                    <p className="font-semibold text-accent">${bookingData.payment.amount.toFixed(2)}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </Card>

                {bookingData.answers && bookingData.answers.length > 0 && (
                    <Card className="p-6 mb-6">
                        <h2 className="text-xl font-semibold text-primary mb-4">Your Responses</h2>
                        <div className="space-y-3">
                            {bookingData.answers.map((answer: any, index: number) => (
                                <div key={index} className="border-b border-border pb-3 last:border-0">
                                    <p className="text-sm font-medium text-muted-foreground mb-1">{answer.question}</p>
                                    <p className="text-primary">{answer.answer}</p>
                                </div>
                            ))}
                        </div>
                    </Card>
                )}

                <div className="flex gap-4">
                    <Button
                        variant="outline"
                        onClick={handleCancelBooking}
                        disabled={confirming}
                        className="flex-1"
                    >
                        Cancel & Start Over
                    </Button>
                    <Button
                        onClick={handleConfirmBooking}
                        disabled={confirming}
                        className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90"
                    >
                        {confirming ? (
                            <div className="flex items-center gap-2">
                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                Confirming...
                            </div>
                        ) : (
                            'Confirm Booking'
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
}
