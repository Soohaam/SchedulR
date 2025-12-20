'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/store';
import { motion } from 'framer-motion';
import { ArrowLeft, Calendar, Clock, MapPin, User, DollarSign, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import api from '@/lib/api';

interface Provider {
    id: string;
    name: string;
    type: 'STAFF' | 'RESOURCE';
    title?: string;
    specialization?: string;
    profileImage?: string;
    imageUrl?: string;
}

interface AppointmentType {
    id: string;
    title: string;
    description: string;
    duration: number;
    location: string;
    price: number;
    requiresPayment: boolean;
    imageUrl?: string;
}

export default function AppointmentDetailPage() {
    const router = useRouter();
    const params = useParams();
    const appointmentId = params?.id as string;
    const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);

    const [appointment, setAppointment] = useState<AppointmentType | null>(null);
    const [providers, setProviders] = useState<Provider[]>([]);
    const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!isAuthenticated || user?.role !== 'CUSTOMER') {
            router.push('/login');
            return;
        }

        if (appointmentId) {
            fetchAppointmentDetails();
        }
    }, [appointmentId, isAuthenticated, user]);

    const fetchAppointmentDetails = async () => {
        try {
            setLoading(true);
            // Fetch appointment details
            const appointmentResponse = await api.get(`/api/v1/appointments/${appointmentId}/details`);
            setAppointment(appointmentResponse.data.appointmentType);

            // Fetch available providers (we'll use today's date as default or you can add date picker)
            const today = new Date().toISOString().split('T')[0];
            const providersResponse = await api.get(`/api/v1/appointments/${appointmentId}/available-providers`, {
                params: { date: today }
            });
            setProviders(providersResponse.data.providers || []);
        } catch (error) {
            console.error('Error fetching appointment details:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleProviderSelect = (provider: Provider) => {
        setSelectedProvider(provider);
    };

    const handleBooking = () => {
        if (!selectedProvider) return;

        router.push(
            `/user/appointments/${appointmentId}/book?providerId=${selectedProvider.id}&providerType=${selectedProvider.type}`
        );
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
                    <Button onClick={() => router.push('/user')} className="mt-4">
                        Back to Dashboard
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
                        onClick={() => router.back()}
                        className="flex items-center gap-2 mb-4"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back
                    </Button>
                    <h1 className="text-3xl font-bold text-primary">{appointment.title}</h1>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column - Appointment Details */}
                    <div className="lg:col-span-1">
                        <Card className="p-6 bg-card/80 backdrop-blur-sm border-border/50 sticky top-24">
                            {appointment.imageUrl && (
                                <div className="w-full h-48 rounded-lg overflow-hidden mb-6">
                                    <img
                                        src={appointment.imageUrl}
                                        alt={appointment.title}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            )}

                            <h2 className="text-xl font-semibold text-primary mb-4">Appointment Details</h2>

                            <div className="space-y-4">
                                <div className="flex items-start gap-3">
                                    <Clock className="w-5 h-5 text-accent mt-0.5" />
                                    <div>
                                        <p className="text-sm text-muted-foreground">Duration</p>
                                        <p className="font-medium text-primary">{appointment.duration} minutes</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <MapPin className="w-5 h-5 text-accent mt-0.5" />
                                    <div>
                                        <p className="text-sm text-muted-foreground">Location</p>
                                        <p className="font-medium text-primary">{appointment.location || 'TBD'}</p>
                                    </div>
                                </div>

                                {appointment.requiresPayment && (
                                    <div className="flex items-start gap-3">
                                        <DollarSign className="w-5 h-5 text-accent mt-0.5" />
                                        <div>
                                            <p className="text-sm text-muted-foreground">Price</p>
                                            <p className="font-medium text-primary">${appointment.price}</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {appointment.description && (
                                <div className="mt-6 pt-6 border-t border-border">
                                    <h3 className="font-semibold text-primary mb-2">Description</h3>
                                    <p className="text-sm text-muted-foreground leading-relaxed">
                                        {appointment.description}
                                    </p>
                                </div>
                            )}
                        </Card>
                    </div>

                    {/* Right Column - Provider Selection */}
                    <div className="lg:col-span-2">
                        <div className="mb-6">
                            <h2 className="text-2xl font-bold text-primary mb-2">Select User / Resource</h2>
                            <p className="text-muted-foreground">
                                Schedule your visit today and experience expert care brought right to your doorstep.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {providers.map((provider, index) => (
                                <motion.div
                                    key={provider.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.3, delay: index * 0.1 }}
                                >
                                    <Card
                                        className={`group cursor-pointer transition-all duration-300 hover:scale-[1.02] overflow-hidden ${selectedProvider?.id === provider.id
                                            ? 'ring-2 ring-accent bg-accent/5'
                                            : 'bg-card/80 backdrop-blur-sm border-border/50 hover:shadow-xl'
                                            }`}
                                        onClick={() => handleProviderSelect(provider)}
                                    >
                                        <div className="p-6">
                                            {/* Provider Image/Icon */}
                                            <div className="flex items-center justify-center mb-6">
                                                <div className="relative">
                                                    <div className="w-32 h-32 rounded-lg bg-gradient-to-br from-accent/20 to-accent/5 flex items-center justify-center overflow-hidden">
                                                        {provider.profileImage || provider.imageUrl ? (
                                                            <img
                                                                src={provider.profileImage || provider.imageUrl}
                                                                alt={provider.name}
                                                                className="w-full h-full object-cover"
                                                            />
                                                        ) : (
                                                            <div className="text-6xl font-bold text-accent/40">
                                                                {provider.type === 'STAFF' ? 'A' : 'R'}
                                                                {index + 1}
                                                            </div>
                                                        )}
                                                    </div>
                                                    {selectedProvider?.id === provider.id && (
                                                        <div className="absolute -top-2 -right-2 w-8 h-8 bg-accent rounded-full flex items-center justify-center">
                                                            <CheckCircle className="w-5 h-5 text-accent-foreground" />
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Provider Info */}
                                            <div className="text-center">
                                                <div className="flex items-center justify-center gap-2 mb-2">
                                                    <User className="w-4 h-4 text-accent" />
                                                    <span className="text-xs font-medium text-accent uppercase">
                                                        {provider.type === 'STAFF' ? 'Staff' : 'Resource'}
                                                    </span>
                                                </div>

                                                <h3 className="text-lg font-semibold text-primary mb-1">
                                                    {provider.name}
                                                </h3>

                                                {provider.title && (
                                                    <p className="text-sm text-muted-foreground mb-2">{provider.title}</p>
                                                )}

                                                {provider.specialization && (
                                                    <p className="text-xs text-muted-foreground">{provider.specialization}</p>
                                                )}
                                            </div>

                                            {/* Introduction Message */}
                                            <div className="mt-4 pt-4 border-t border-border">
                                                <p className="text-sm text-muted-foreground text-center italic">
                                                    {provider.type === 'STAFF'
                                                        ? `${appointment.location || 'Doctor\'s office'}`
                                                        : `${appointment.location || 'Tennis court'}`}
                                                </p>
                                            </div>
                                        </div>
                                    </Card>
                                </motion.div>
                            ))}
                        </div>

                        {/* Empty State */}
                        {providers.length === 0 && (
                            <div className="text-center py-12">
                                <User className="w-16 h-16 text-muted-foreground/40 mx-auto mb-4" />
                                <h3 className="text-lg font-semibold text-primary mb-2">No providers available</h3>
                                <p className="text-muted-foreground">
                                    Please check back later or contact support.
                                </p>
                            </div>
                        )}

                        {/* Book Button */}
                        {selectedProvider && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mt-8 flex justify-center"
                            >
                                <Button
                                    disabled={!selectedProvider}
                                    className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
                                    onClick={() => router.push(`/user/appointments/${appointmentId}/book`)}
                                >
                                    <Calendar className="w-5 h-5 mr-2" />
                                    Continue to Book
                                </Button>
                            </motion.div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
