'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Search, Filter, Check, X, Clock, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/store';
import axios from 'axios';
import { toast } from 'sonner';

export default function MeetingsPage() {
    const searchParams = useSearchParams();
    const filterType = searchParams.get('type') || '';

    const [bookings, setBookings] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedBooking, setExpandedBooking] = useState<string | null>(null);
    const { token } = useSelector((state: RootState) => state.auth);

    const fetchRequests = async () => {
        setIsLoading(true);
        try {
            const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/organiser/bookings`, {
                headers: { Authorization: `Bearer ${token}` },
                params: {
                    status: 'PENDING',
                    appointmentTypeId: filterType || undefined,
                    search: searchTerm || undefined
                }
            });
            console.log('Meetings API response:', response.data); // Debug log
            setBookings(response.data.bookings || []);
        } catch (error) {
            console.error('Failed to fetch requests:', error);
            toast.error('Failed to load pending requests');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (token) {
            fetchRequests();
        }
    }, [token, filterType, searchTerm]);

    const handleAction = async (id: string, action: 'confirm' | 'reject') => {
        try {
            await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/organiser/bookings/${id}/${action}`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success(`Booking ${action}ed successfully`);
            fetchRequests(); // Refresh list
        } catch (error) {
            console.error(`Failed to ${action} booking:`, error);
            toast.error(`Failed to ${action} booking`);
        }
    };

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-12">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-primary font-['Georgia']">Meetings / Requests</h1>
                    <p className="text-muted-foreground">Review and manage pending appointment requests.</p>
                </div>
                <div className="flex gap-2">
                    <Link href="/organizer/settings">
                        <Button variant="outline">Settings</Button>
                    </Link>
                </div>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-4 bg-card p-4 rounded-lg border border-border/50 shadow-sm">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Search requests..."
                        className="pl-9"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Table */}
            <Card className="overflow-hidden border-border/50 shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-muted-foreground uppercase bg-secondary/30 border-b border-border/50">
                            <tr>
                                <th className="px-6 py-4 font-medium">Subject</th>
                                <th className="px-6 py-4 font-medium">Type</th>
                                <th className="px-6 py-4 font-medium">Booked By</th>
                                <th className="px-6 py-4 font-medium">Resource/User</th>
                                <th className="px-6 py-4 font-medium">Requested Time</th>
                                <th className="px-6 py-4 font-medium">Answers</th>
                                <th className="px-6 py-4 font-medium">Status</th>
                                <th className="px-6 py-4 font-medium text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/40">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={8} className="px-6 py-12 text-center">
                                        <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
                                    </td>
                                </tr>
                            ) : bookings && bookings.length > 0 ? (
                                bookings.map((booking) => (
                                    <>
                                        <tr key={booking.id} className="bg-card hover:bg-secondary/10 transition-colors">
                                            <td className="px-6 py-4 font-medium">{booking.appointmentType?.title || 'Appointment'}</td>
                                            <td className="px-6 py-4 text-muted-foreground">{booking.appointmentType?.type}</td>
                                            <td className="px-6 py-4">{booking.customer?.fullName || booking.customerEmail}</td>
                                            <td className="px-6 py-4">{booking.resource?.name || booking.staffMember?.name || '—'}</td>
                                            <td className="px-6 py-4 flex flex-col">
                                                <span>{new Date(booking.startTime).toLocaleDateString()}</span>
                                                <span className="text-xs text-muted-foreground">
                                                    {new Date(booking.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -
                                                    {new Date(booking.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-muted-foreground">
                                                {/* Render answers if available */}
                                                {booking.answers && booking.answers.length > 0 ? (
                                                    <button
                                                        onClick={() => setExpandedBooking(expandedBooking === booking.id ? null : booking.id)}
                                                        className="flex items-center gap-1 text-blue-600 hover:text-blue-800 hover:underline"
                                                    >
                                                        {booking.answers.length} answer(s)
                                                        {expandedBooking === booking.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                                    </button>
                                                ) : '—'}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-50 text-yellow-700 border border-yellow-200">
                                                    <Clock className="w-3 h-3 mr-1" />
                                                    Request
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Button
                                                        size="sm"
                                                        variant="default"
                                                        className="bg-green-600 hover:bg-green-700 h-8 px-3"
                                                        onClick={() => handleAction(booking.id, 'confirm')}
                                                    >
                                                        <Check className="w-4 h-4 mr-1" /> Approve
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="border-red-200 text-red-600 hover:bg-red-50 h-8 px-3"
                                                        onClick={() => handleAction(booking.id, 'reject')}
                                                    >
                                                        <X className="w-4 h-4 mr-1" /> Decline
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                        {/* Expandable row for answers */}
                                        {expandedBooking === booking.id && booking.answers && booking.answers.length > 0 && (
                                            <tr className="bg-secondary/20">
                                                <td colSpan={8} className="px-6 py-4">
                                                    <div className="space-y-3">
                                                        <h4 className="font-semibold text-sm">Customer Answers:</h4>
                                                        {booking.answers.map((answer: any, idx: number) => (
                                                            <div key={idx} className="bg-card p-3 rounded border border-border/50">
                                                                <p className="text-sm font-medium text-muted-foreground mb-1">
                                                                    {answer.questionText || `Question ${idx + 1}`}
                                                                </p>
                                                                <p className="text-sm">{answer.answer}</p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={8} className="px-6 py-12 text-center text-muted-foreground italic">
                                        No pending requests found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
}
