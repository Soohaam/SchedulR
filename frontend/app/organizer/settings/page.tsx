'use client';

import { useSelector } from 'react-redux';
import { RootState } from '@/lib/store';
import { Card } from '@/components/ui/Card';
import TwoFactorSettings from '@/components/auth/TwoFactorSettings';
import { User, Mail, Phone, Shield } from 'lucide-react';

export default function SettingsPage() {
  const { user } = useSelector((state: RootState) => state.auth);

  if (!user) return null;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-serif text-slate-900 dark:text-white mb-2">
          Settings
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          Manage your account preferences and security
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Profile Information */}
        <Card className="p-6 border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <User className="w-5 h-5 text-blue-500" />
            </div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
              Profile Information
            </h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">
                Full Name
              </label>
              <div className="text-slate-900 dark:text-white font-medium">
                {user.firstName} {user.lastName}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">
                Email Address
              </label>
              <div className="flex items-center gap-2 text-slate-900 dark:text-white font-medium">
                <Mail className="w-4 h-4 text-slate-400" />
                {user.email}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">
                Role
              </label>
              <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 capitalize">
                {user.role}
              </div>
            </div>
          </div>
        </Card>

        {/* Security Settings */}
        <Card className="p-6 border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-purple-500/10 rounded-lg">
              <Shield className="w-5 h-5 text-purple-500" />
            </div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
              Security
            </h2>
          </div>

          <TwoFactorSettings />
        </Card>
      </div>
    </div>
  );
}
