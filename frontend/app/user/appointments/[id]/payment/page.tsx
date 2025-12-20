'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/store';
import { motion } from 'framer-motion';
import { ArrowLeft, CreditCard, DollarSign, Lock } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';

export default function PaymentPage() {
    const router = useRouter();
    const params = useParams();
    const appointmentId = params?.id as string;
    const { user } = useSelector((state: RootState) => state.auth);

    const [bookingData, setBookingData] = useState<any>(null);
    const [paymentMethod, setPaymentMethod] = useState<'CREDIT_CARD' | 'DEBIT_CARD' | 'UPI' | 'PAYPAL'>('CREDIT_CARD');
    const [cardDetails, setCardDetails] = useState({
        nameOnCard: '',
        cardNumber: '',
        expirationDate: '',
        cvv: ''
    });
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        // Get booking data from sessionStorage
        const stored = sessionStorage.getItem('bookingData');
        if (!stored) {
            router.push(`/user/appointments/${appointmentId}/book`);
            return;
        }

        const data = JSON.parse(stored);
        if (!data.appointment.requiresPayment) {
            router.push(`/user/appointments/${appointmentId}/confirm`);
            return;
        }

        setBookingData(data);
    }, [appointmentId]);

    const calculateTotal = () => {
        if (!bookingData) return 0;
        const subtotal = bookingData.appointment.price * bookingData.capacity;
        const tax = subtotal * 0.1; // 10% tax
        return {
            subtotal,
            tax,
            total: subtotal + tax
        };
    };

    const handlePayment = async () => {
        setProcessing(true);

        // Simulate payment processing
        setTimeout(() => {
            // Update booking data with payment info
            const updatedBookingData = {
                ...bookingData,
                payment: {
                    method: paymentMethod,
                    amount: calculateTotal().total,
                    status: 'SUCCESS'
                }
            };

            sessionStorage.setItem('bookingData', JSON.stringify(updatedBookingData));
            setProcessing(false);
            router.push(`/user/appointments/${appointmentId}/confirm`);
        }, 2000);
    };

    if (!bookingData) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-accent border-t-transparent" />
            </div>
        );
    }

    const { subtotal, tax, total } = calculateTotal();

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <div className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-40">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <Button
                        variant="ghost"
                        onClick={() => router.push(`/user/appointments/${appointmentId}/questions`)}
                        className="flex items-center gap-2 mb-4"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back
                    </Button>
                    <h1 className="text-3xl font-bold text-primary">Payment</h1>
                    <p className="text-muted-foreground mt-1">Complete your booking payment</p>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Payment Form */}
                    <div className="lg:col-span-2">
                        <Card className="p-6">
                            <h2 className="text-xl font-semibold text-primary mb-6">Choose a payment method</h2>

                            {/* Payment Method Selection */}
                            <div className="space-y-3 mb-6">
                                {[
                                    { value: 'CREDIT_CARD', label: 'Credit Card', icon: CreditCard },
                                    { value: 'DEBIT_CARD', label: 'Debit Card', icon: CreditCard },
                                    { value: 'UPI', label: 'UPI Pay', icon: DollarSign },
                                    { value: 'PAYPAL', label: 'PayPal', icon: DollarSign },
                                ].map((method) => (
                                    <label
                                        key={method.value}
                                        className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${paymentMethod === method.value
                                                ? 'border-accent bg-accent/10'
                                                : 'border-border hover:border-accent/50'
                                            }`}
                                    >
                                        <input
                                            type="radio"
                                            name="paymentMethod"
                                            value={method.value}
                                            checked={paymentMethod === method.value}
                                            onChange={(e) => setPaymentMethod(e.target.value as any)}
                                            className="w-4 h-4 text-accent"
                                        />
                                        <method.icon className="w-5 h-5 text-accent" />
                                        <span className="font-medium text-primary">{method.label}</span>
                                    </label>
                                ))}
                            </div>

                            {/* Card Details Form */}
                            {(paymentMethod === 'CREDIT_CARD' || paymentMethod === 'DEBIT_CARD') && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="space-y-4"
                                >
                                    <div>
                                        <label className="block text-sm font-medium text-primary mb-2">
                                            Name on Card
                                        </label>
                                        <Input
                                            type="text"
                                            placeholder="John Doe"
                                            value={cardDetails.nameOnCard}
                                            onChange={(e) => setCardDetails({ ...cardDetails, nameOnCard: e.target.value })}
                                            className="bg-background"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-primary mb-2">
                                            Card Number
                                        </label>
                                        <Input
                                            type="text"
                                            placeholder="•••• •••• •••• ••••"
                                            value={cardDetails.cardNumber}
                                            onChange={(e) => setCardDetails({ ...cardDetails, cardNumber: e.target.value })}
                                            maxLength={19}
                                            className="bg-background"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-primary mb-2">
                                                Expiration Date
                                            </label>
                                            <Input
                                                type="text"
                                                placeholder="MM/YY"
                                                value={cardDetails.expirationDate}
                                                onChange={(e) => setCardDetails({ ...cardDetails, expirationDate: e.target.value })}
                                                maxLength={5}
                                                className="bg-background"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-primary mb-2">
                                                Security Code (CVV)
                                            </label>
                                            <Input
                                                type="text"
                                                placeholder="•••"
                                                value={cardDetails.cvv}
                                                onChange={(e) => setCardDetails({ ...cardDetails, cvv: e.target.value })}
                                                maxLength={4}
                                                className="bg-background"
                                            />
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {/* UPI/PayPal placeholder */}
                            {(paymentMethod === 'UPI' || paymentMethod === 'PAYPAL') && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="p-6 bg-secondary/20 rounded-lg text-center"
                                >
                                    <p className="text-muted-foreground">
                                        {paymentMethod === 'UPI' ? 'UPI' : 'PayPal'} integration coming soon
                                    </p>
                                </motion.div>
                            )}

                            {/* Security Notice */}
                            <div className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
                                <Lock className="w-4 h-4" />
                                <span>Your payment information is secure and encrypted</span>
                            </div>
                        </Card>
                    </div>

                    {/* Order Summary */}
                    <div className="lg:col-span-1">
                        <Card className="p-6 sticky top-24">
                            <h2 className="text-xl font-semibold text-primary mb-4">Order Summary</h2>

                            <div className="space-y-3 mb-6">
                                <div>
                                    <p className="text-sm text-muted-foreground">Appointment</p>
                                    <p className="font-semibold text-primary">{bookingData.appointment.title}</p>
                                </div>

                                <div>
                                    <p className="text-sm text-muted-foreground">Date & Time</p>
                                    <p className="font-medium text-primary">
                                        {new Date(bookingData.date).toLocaleDateString()}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        {new Date(bookingData.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-sm text-muted-foreground">Duration</p>
                                    <p className="font-medium text-primary">{bookingData.appointment.duration} minutes</p>
                                </div>

                                {bookingData.capacity > 1 && (
                                    <div>
                                        <p className="text-sm text-muted-foreground">Number of People</p>
                                        <p className="font-medium text-primary">{bookingData.capacity}</p>
                                    </div>
                                )}
                            </div>

                            <div className="border-t border-border pt-4 space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Subtotal</span>
                                    <span className="font-medium text-primary">${subtotal.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Taxes</span>
                                    <span className="font-medium text-primary">${tax.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-lg font-bold pt-2 border-t border-border">
                                    <span className="text-primary">Total</span>
                                    <span className="text-accent">${total.toFixed(2)}</span>
                                </div>
                            </div>

                            <Button
                                onClick={handlePayment}
                                disabled={processing}
                                className="w-full mt-6 bg-accent text-accent-foreground hover:bg-accent/90"
                            >
                                {processing ? (
                                    <div className="flex items-center gap-2">
                                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                        Processing...
                                    </div>
                                ) : (
                                    'Pay Now'
                                )}
                            </Button>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}
