'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/store';
import { motion } from 'framer-motion';
import { ArrowLeft, Calendar as CalendarIcon, Clock, Users, MapPin, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import api from '@/lib/api';
import { Calendar } from '@/components/ui/Calendar';

interface Provider {
    id: string;
    name: string;
    type: string;
    profileImage?: string;
    availableSlots: Array<{
        startTime: string;
        endTime: string;
        available: boolean;
    }>;
    totalAvailableSlots: number;
}

interface AppointmentDetail {
    id: string;
    title: string;
    description: string;
    duration: number;
    price: number;
    location: string;
    requiresPayment: boolean;
    manageCapacity: boolean;
    maxBookingsPerSlot: number;
    organizer: {
        name: string;
    };
}

export default function BookAppointmentPage() {
    const router = useRouter();
    const params = useParams();
    const appointmentId = params?.id as string;
    const { user } = useSelector((state: RootState) => state.auth);

    const [appointment, setAppointment] = useState<AppointmentDetail | null>(null);
    const [providers, setProviders] = useState<Provider[]>([]);
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
    const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
    const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
    const [capacity, setCapacity] = useState<number>(1);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAppointmentDetails();
    }, [appointmentId]);

    useEffect(() => {
        if (selectedDate) {
            fetchAvailableProviders();
        }
    }, [selectedDate]);

    const fetchAppointmentDetails = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/api/v1/appointments/${appointmentId}/details`);
            setAppointment(response.data.appointmentType);
        } catch (error) {
            console.error('Error fetching appointment:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchAvailableProviders = async () => {
        if (!selectedDate) return;

        try {
            const dateStr = selectedDate.toISOString().split('T')[0];
            const response = await api.get(`/api/v1/appointments/${appointmentId}/available-providers`, {
                params: { date: dateStr }
            });
            setProviders(response.data.providers || []);
        } catch (error) {
            console.error('Error fetching providers:', error);
        }
    };

    const handleContinue = () => {
        if (!selectedProvider || !selectedSlot || !selectedDate) return;

        // Store booking data in sessionStorage
        const bookingData = {
            appointmentId,
            providerId: selectedProvider,
            providerType: providers.find(p => p.id === selectedProvider)?.type,
            date: selectedDate.toISOString().split('T')[0],
            startTime: selectedSlot,
            capacity,
            appointment,
        };

        sessionStorage.setItem('bookingData', JSON.stringify(bookingData));
        router.push(`/user/appointments/${appointmentId}/questions`);
    };

    const formatTime = (dateString: string) => {
        return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-accent border-t-transparent" />
            </div>
        );
    }

    if (!appointment) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-primary mb-2">Appointment not found</h2>
                    <Button onClick={() => router.push('/user')}>Back to Dashboard</Button>
                </div>
            </div>
        );
    }

    const selectedProviderData = providers.find(p => p.id === selectedProvider);
    const availableSlots = selectedProviderData?.availableSlots.filter(s => s.available) || [];

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <div className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <Button
                        variant="ghost"
                        onClick={() => router.push('/user')}
                        className="flex items-center gap-2 mb-4"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back
                    </Button>
                    <h1 className="text-3xl font-bold text-primary">{appointment.title}</h1>
                    <p className="text-muted-foreground mt-1">Select date, time, and provider</p>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column - Date & Provider Selection */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Date Picker */}
                        <Card className="p-6">
                            <h2 className="text-xl font-semibold text-primary mb-4 flex items-center gap-2">
                                <CalendarIcon className="w-5 h-5" />
                                Select Date
                            </h2>
                            <Calendar
                                mode="single"
                                selected={selectedDate}
                                onSelect={setSelectedDate}
                                disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                                className="rounded-md border"
                            />
                        </Card>

                        {/* Provider Selection */}
                        {selectedDate && providers.length > 0 && (
                            <Card className="p-6">
                                <h2 className="text-xl font-semibold text-primary mb-4">Select Provider</h2>
                                <div className="space-y-3">
                                    {providers.map((provider) => (
                                        <div
                                            key={provider.id}
                                            onClick={() => setSelectedProvider(provider.id)}
                                            className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${selectedProvider === provider.id
                                                    ? 'border-accent bg-accent/10'
                                                    : 'border-border hover:border-accent/50'
                                                }`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-accent/20 to-accent/5 flex items-center justify-center">
                                                        <span className="text-lg font-bold text-accent">
                                                            {provider.name.charAt(0)}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-primary">{provider.name}</p>
                                                        <p className="text-sm text-muted-foreground capitalize">{provider.type.toLowerCase()}</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-sm font-medium text-accent">
                                                        {provider.totalAvailableSlots} slots available
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        )}

                        {/* Time Slots */}
                        {selectedProvider && availableSlots.length > 0 && (
                            <Card className="p-6">
                                <h2 className="text-xl font-semibold text-primary mb-4 flex items-center gap-2">
                                    <Clock className="w-5 h-5" />
                                    Select Time Slot
                                </h2>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                                    {availableSlots.map((slot, index) => (
                                        <button
                                            key={index}
                                            onClick={() => setSelectedSlot(slot.startTime)}
                                            className={`p-3 rounded-lg border-2 text-sm font-medium transition-all ${selectedSlot === slot.startTime
                                                    ? 'border-accent bg-accent text-accent-foreground'
                                                    : 'border-border hover:border-accent/50 text-foreground'
                                                }`}
                                        >
                                            {formatTime(slot.startTime)}
                                        </button>
                                    ))}
                                </div>
                            </Card>
                        )}

                        {/* Capacity Selection */}
                        {appointment.manageCapacity && selectedSlot && (
                            <Card className="p-6">
                                <h2 className="text-xl font-semibold text-primary mb-4 flex items-center gap-2">
                                    <Users className="w-5 h-5" />
                                    Number of People
                                </h2>
                                <div className="flex items-center gap-4">
                                    <Button
                                        variant="outline"
                                        onClick={() => setCapacity(Math.max(1, capacity - 1))}
                                        disabled={capacity <= 1}
                                    >
                                        -
                                    </Button>
                                    <span className="text-2xl font-bold text-primary w-12 text-center">{capacity}</span>
                                    <Button
                                        variant="outline"
                                        onClick={() => setCapacity(Math.min(appointment.maxBookingsPerSlot, capacity + 1))}
                                        disabled={capacity >= appointment.maxBookingsPerSlot}
                                    >
                                        +
                                    </Button>
                                    <span className="text-sm text-muted-foreground">
                                        (Max: {appointment.maxBookingsPerSlot})
                                    </span>
                                </div>
                            </Card>
                        )}
                    </div>

                    {/* Right Column - Summary */}
                    <div className="lg:col-span-1">
                        <Card className="p-6 sticky top-24">
                            <h2 className="text-xl font-semibold text-primary mb-4">Booking Summary</h2>

                            <div className="space-y-4">
                                <div>
                                    <p className="text-sm text-muted-foreground">Appointment</p>
                                    <p className="font-semibold text-primary">{appointment.title}</p>
                                </div>

                                <div>
                                    <p className="text-sm text-muted-foreground">Organizer</p>
                                    <p className="font-medium text-primary">{appointment.organizer.name}</p>
                                </div>

                                {selectedDate && (
                                    <div>
                                        <p className="text-sm text-muted-foreground">Date</p>
                                        <p className="font-medium text-primary">
                                            {selectedDate.toLocaleDateString('en-US', {
                                                weekday: 'long',
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric'
                                            })}
                                        </p>
                                    </div>
                                )}

                                {selectedSlot && (
                                    <div>
                                        <p className="text-sm text-muted-foreground">Time</p>
                                        <p className="font-medium text-primary">{formatTime(selectedSlot)}</p>
                                    </div>
                                )}

                                {selectedProviderData && (
                                    <div>
                                        <p className="text-sm text-muted-foreground">Provider</p>
                                        <p className="font-medium text-primary">{selectedProviderData.name}</p>
                                    </div>
                                )}

                                <div>
                                    <p className="text-sm text-muted-foreground">Duration</p>
                                    <p className="font-medium text-primary">{appointment.duration} minutes</p>
                                </div>

                                <div>
                                    <p className="text-sm text-muted-foreground">Location</p>
                                    <p className="font-medium text-primary flex items-center gap-1">
                                        <MapPin className="w-4 h-4" />
                                        {appointment.location}
                                    </p>
                                </div>

                                {appointment.manageCapacity && (
                                    <div>
                                        <p className="text-sm text-muted-foreground">Number of People</p>
                                        <p className="font-medium text-primary">{capacity}</p>
                                    </div>
                                )}

                                {appointment.requiresPayment && (
                                    <div className="pt-4 border-t border-border">
                                        <div className="flex justify-between items-center">
                                            <p className="text-sm text-muted-foreground">Price</p>
                                            <p className="text-2xl font-bold text-accent flex items-center gap-1">
                                                <DollarSign className="w-5 h-5" />
                                                {appointment.price * capacity}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <Button
                                onClick={handleContinue}
                                disabled={!selectedProvider || !selectedSlot || !selectedDate}
                                className="w-full mt-6 bg-accent text-accent-foreground hover:bg-accent/90"
                            >
                                Continue to Questions
                            </Button>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}
