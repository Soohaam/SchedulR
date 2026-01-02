'use client';

import { useState, useEffect } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Plus, Search, Trash2, Edit2, Loader2, Users } from 'lucide-react';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/store';
import axios from 'axios';
import { toast } from 'sonner';

export default function ResourcesSettingsPage() {
    const [resources, setResources] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newResource, setNewResource] = useState({ name: '', description: '', location: '', resourceType: 'OTHER', capacity: 1 });

    const { token } = useSelector((state: RootState) => state.auth);

    const fetchResources = async () => {
        setIsLoading(true);
        try {
            const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/organiser/resources`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setResources(response.data.data);
        } catch (error) {
            console.error('Failed to fetch resources:', error);
            toast.error('Failed to load resources');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (token) fetchResources();
    }, [token]);

    const handleCreate = async () => {
        try {
            await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/organiser/resources`, newResource, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success('Resource created');
            setIsModalOpen(false);
            setNewResource({ name: '', description: '', location: '', resourceType: 'OTHER', capacity: 1 });
            fetchResources();
        } catch (error) {
            toast.error('Failed to create resource');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure?')) return;
        try {
            await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/organiser/resources/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success('Resource deleted');
            fetchResources();
        } catch (error) {
            toast.error('Failed to delete resource');
        }
    };

    const filteredResources = resources.filter(r =>
        r.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="max-w-5xl mx-auto space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Resources</h1>
                    <p className="text-muted-foreground">Manage physical resources (rooms, equipment, etc.)</p>
                </div>
                <Button onClick={() => setIsModalOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" /> Add Resource
                </Button>
            </div>

            {/* Modal (Simple inline for now) */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
                    <Card className="p-6 w-full max-w-md space-y-4">
                        <h2 className="text-xl font-bold">Add New Resource</h2>
                        <Input
                            placeholder="Resource Name"
                            value={newResource.name}
                            onChange={e => setNewResource({ ...newResource, name: e.target.value })}
                        />
                        <Input
                            placeholder="Description"
                            value={newResource.description}
                            onChange={e => setNewResource({ ...newResource, description: e.target.value })}
                        />
                        <div className="grid grid-cols-2 gap-4">
                            <Input
                                placeholder="Location"
                                value={newResource.location}
                                onChange={e => setNewResource({ ...newResource, location: e.target.value })}
                            />
                            <div className="relative">
                                <Users className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                                <Input
                                    type="number"
                                    min="1"
                                    placeholder="Capacity"
                                    className="pl-9"
                                    value={newResource.capacity}
                                    onChange={e => setNewResource({ ...newResource, capacity: parseInt(e.target.value) || 1 })}
                                />
                            </div>
                        </div>
                        <select
                            className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                            value={newResource.resourceType}
                            onChange={e => setNewResource({ ...newResource, resourceType: e.target.value })}
                        >
                            <option value="ROOM">Room</option>
                            <option value="EQUIPMENT">Equipment</option>
                            <option value="VEHICLE">Vehicle</option>
                            <option value="OTHER">Other</option>
                        </select>
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
                ) : filteredResources.map((resource) => (
                    <Card key={resource.id} className="p-4 flex items-center justify-between">
                        <div>
                            <h3 className="font-semibold flex items-center gap-2">
                                {resource.name}
                                <span className="text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full flex items-center gap-1">
                                    <Users className="w-3 h-3" />
                                    {resource.capacity}
                                </span>
                            </h3>
                            <p className="text-sm text-muted-foreground">{resource.description || 'No description'}</p>
                            {resource.location && (
                                <p className="text-xs text-muted-foreground mt-1">📍 {resource.location}</p>
                            )}
                        </div>
                        <div className="flex gap-2">
                            <Button variant="ghost" size="icon" onClick={() => handleDelete(resource.id)}>
                                <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                        </div>
                    </Card>
                ))}
                {filteredResources.length === 0 && !isLoading && (
                    <p className="text-muted-foreground italic">No resources found.</p>
                )}
            </div>
        </div>
    );
}
