'use client';

import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/lib/store';
import { fetchAppointmentTypes } from '@/lib/features/organizer/appointmentTypeSlice';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Plus, Clock, ExternalLink, Edit, MoreVertical, Copy, Globe } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function AppointmentTypesPage() {
  const dispatch = useDispatch<AppDispatch>();
  const { types, isLoading } = useSelector((state: RootState) => state.appointmentType);

  useEffect(() => {
    dispatch(fetchAppointmentTypes());
  }, [dispatch]);

  const copyLink = (link: string) => {
    navigator.clipboard.writeText(link);
    // Ideally use a toast here
    alert('Link copied to clipboard!');
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center border-b border-border/40 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Globe className="w-6 h-6 text-primary" />
            </div>
            <h1 className="text-3xl font-bold text-primary font-['Georgia']">Appointments View</h1>
          </div>
          <p className="text-muted-foreground mt-2 ml-1">Manage your appointment types and availability.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline">Reporting</Button>
          <Button variant="outline">Settings</Button>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <Link href="/organizer/appointments/create">
          <Button className="metallic-gold-bg text-accent-foreground shadow-lg shadow-accent/20">
            <Plus className="w-4 h-4 mr-2" />
            New
          </Button>
        </Link>
        <div className="relative w-1/3">
          <input type="text" placeholder="Search" className="w-full bg-secondary/30 border border-border/50 rounded-md px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
        </div>
      </div>

      <div className="space-y-4">
        {isLoading ? (
          <p className="text-muted-foreground text-center py-12">Loading appointment types...</p>
        ) : types.length === 0 ? (
          <div className="text-center py-12 bg-card rounded-xl border border-border/50">
            <p className="text-muted-foreground mb-4">You haven't created any appointment types yet.</p>
            <Link href="/organizer/appointments/create">
              <Button variant="outline">Create your first one</Button>
            </Link>
          </div>
        ) : (
          types.map((type) => (
            <motion.div
              key={type.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="group relative"
            >
              <Card className="p-6 bg-card border-border/50 shadow-sm hover:shadow-md transition-all border-l-4 border-l-primary flex flex-col md:flex-row items-center gap-6">
                {/* Left: Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-lg font-semibold text-foreground truncate">{type.title || type.name}</h3>
                  </div>

                  <div className="flex items-center gap-6 text-sm text-muted-foreground">
                    <span className="flex items-center">
                      <Clock className="w-4 h-4 mr-1.5 opacity-70" />
                      {type.duration} Min Duration
                    </span>
                    {/* Mocking resources for now as per wireframe */}
                    <div className="flex items-center gap-1">
                      <div className="w-6 h-6 rounded bg-secondary flex items-center justify-center text-[10px] font-bold">R1</div>
                      <div className="w-6 h-6 rounded bg-secondary flex items-center justify-center text-[10px] font-bold">R2</div>
                    </div>
                    <span className="hidden md:inline-block">
                      {type.statistics?.upcomingBookings || 0} Meeting Upcoming
                    </span>
                  </div>
                </div>

                {/* Middle: Actions */}
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyLink(type.shareLink || '')}
                    className="h-9"
                  >
                    <Copy className="w-3 h-3 mr-2" />
                    Share
                  </Button>
                  <Link href={`/organizer/appointments/${type.id}/edit`}>
                    <Button variant="outline" size="sm" className="h-9">
                      <Edit className="w-3 h-3 mr-2" />
                      Edit
                    </Button>
                  </Link>
                </div>

                {/* Right: Status Badge */}
                {type.isPublished && (
                  <div className="absolute -top-3 -right-3 md:top-auto md:bottom-auto md:right-8 transform rotate-12 bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 border-2 border-green-600/20 px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-sm shadow-sm pointer-events-none">
                    Published
                  </div>
                )}
              </Card>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
