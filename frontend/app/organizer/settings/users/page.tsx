'use client';

import { useState, useEffect } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Plus, Search, Trash2, Loader2, Mail } from 'lucide-react';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/store';
import axios from 'axios';
import { toast } from 'sonner';

export default function UsersSettingsPage() {
    const [staff, setStaff] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newStaff, setNewStaff] = useState({ name: '', email: '', title: '' });

    const { token } = useSelector((state: RootState) => state.auth);

    const fetchStaff = async () => {
        setIsLoading(true);
        try {
            const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/organiser/staff`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setStaff(response.data.data);
        } catch (error) {
            console.error('Failed to fetch staff:', error);
            toast.error('Failed to load staff');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (token) fetchStaff();
    }, [token]);

    const handleCreate = async () => {
        try {
            await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/organiser/staff`, newStaff, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success('Staff member created');
            setIsModalOpen(false);
            setNewStaff({ name: '', email: '', title: '' });
            fetchStaff();
        } catch (error) {
            toast.error('Failed to create staff member');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure?')) return;
        try {
            await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/organiser/staff/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success('Staff member deleted');
            fetchStaff();
        } catch (error) {
            toast.error('Failed to delete staff member');
        }
    };

    return (
        <div className="max-w-5xl mx-auto space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Users / Staff</h1>
                    <p className="text-muted-foreground">Manage your team members and providers.</p>
                </div>
                <Button onClick={() => setIsModalOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" /> Add Staff
                </Button>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
                    <Card className="p-6 w-full max-w-md space-y-4">
                        <h2 className="text-xl font-bold">Add Staff Member</h2>
                        <Input
                            placeholder="Full Name"
                            value={newStaff.name}
                            onChange={e => setNewStaff({ ...newStaff, name: e.target.value })}
                        />
                        <Input
                            placeholder="Email"
                            type="email"
                            value={newStaff.email}
                            onChange={e => setNewStaff({ ...newStaff, email: e.target.value })}
                        />
                        <Input
                            placeholder="Title (e.g. Dr., Consultant)"
                            value={newStaff.title}
                            onChange={e => setNewStaff({ ...newStaff, title: e.target.value })}
                        />
                        <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                            <Button onClick={handleCreate}>Save</Button>
                        </div>
                    </Card>
                </div>
            )}

            <div className="grid gap-4">
                {isLoading ? (
                    <Loader2 className="animate-spin" />
                ) : staff.map((member) => (
                    <Card key={member.id} className="p-4 flex items-center justify-between">
                        <div>
                            <h3 className="font-semibold">{member.name}</h3>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Mail className="w-3 h-3" /> {member.email}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">{member.title}</p>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="ghost" size="icon" onClick={() => handleDelete(member.id)}>
                                <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                        </div>
                    </Card>
                ))}
                {staff.length === 0 && !isLoading && (
                    <p className="text-muted-foreground italic">No staff members found.</p>
                )}
            </div>
        </div>
    );
}
