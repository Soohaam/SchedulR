'use client';

import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { User, Monitor, ArrowLeft, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function SettingsPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/organizer/appointments">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-primary font-['Georgia']">Settings</h1>
          <p className="text-muted-foreground">Manage your organization's resources and staff.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* USERS / STAFF */}
        <Link href="/organizer/settings/users">
          <GlassCard className="p-6 hover:shadow-lg transition-all group cursor-pointer hover:border-primary/50">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg text-purple-600 dark:text-purple-400">
                <User className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">Users</h2>
                <p className="text-sm text-muted-foreground">Manage staff members and roles.</p>
              </div>
            </div>
            <div className="flex justify-end">
              <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
          </GlassCard>
        </Link>

        {/* RESOURCES */}
        <Link href="/organizer/settings/resources">
          <GlassCard className="p-6 hover:shadow-lg transition-all group cursor-pointer hover:border-primary/50">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
                <Monitor className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">Resources</h2>
                <p className="text-sm text-muted-foreground">Manage rooms, equipment, etc.</p>
              </div>
            </div>
            <div className="flex justify-end">
              <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
          </GlassCard>
        </Link>
      </div>
    </div>
  );
}
