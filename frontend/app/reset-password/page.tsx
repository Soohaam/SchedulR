'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '@/lib/store';
import { resetPassword } from '@/lib/features/auth/authSlice';
import { Button } from '@/components/ui/Button';
import { GoldButton } from '@/components/ui/GoldButton';
import { GoldInput } from '@/components/ui/GoldInput';
import { GlassCard } from '@/components/ui/GlassCard';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { BackgroundParticles } from '@/components/ui/BackgroundParticles';
import { motion } from 'framer-motion';
import { Lock, CheckCircle, AlertCircle } from 'lucide-react';

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useDispatch<AppDispatch>();
  
  const token = searchParams.get('token');
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) {
      setError('Invalid or missing reset token');
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await dispatch(resetPassword({ token, password })).unwrap();
      setIsSuccess(true);
      setTimeout(() => {
        router.push('/login');
      }, 3000);
    } catch (err: any) {
      setError(err || 'Failed to reset password');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <GlassCard className="bg-card/80 backdrop-blur-xl border-border/50 p-8 text-center">
        <div className="inner-box space-y-6">
        <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto text-green-600 dark:text-green-400">
          <CheckCircle className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-semibold text-foreground">Password Reset Successful</h3>
          <p className="text-muted-foreground text-sm">
            Your password has been updated. Redirecting to login...
          </p>
        </div>
        <GoldButton
          className="w-full"
          onClick={() => router.push('/login')}
        >
          Go to Login
        </GoldButton>
        </div>
      </GlassCard>
    );
  }

  return (
    <GlassCard className="bg-card/80 backdrop-blur-xl border-border/50 p-8">
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm flex items-center gap-2 justify-center font-medium">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}
        
        <div className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="password" className="block text-sm font-medium text-foreground">
              New Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-muted-foreground">
                <Lock className="h-5 w-5" />
              </div>
              <GoldInput
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-12"
                placeholder="••••••••"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-foreground">
              Confirm Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-muted-foreground">
                <Lock className="h-5 w-5" />
              </div>
              <GoldInput
                id="confirmPassword"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="pl-12"
                placeholder="••••••••"
              />
            </div>
          </div>
        </div>

        <GoldButton
          type="submit"
          className="w-full"
          disabled={isLoading || !token}
          isLoading={isLoading}
        >
          {isLoading ? 'Resetting...' : 'Reset Password'}
        </GoldButton>
      </form>
    </GlassCard>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen mesh-background vignette flex flex-col justify-center py-12 sm:px-6 lg:px-8 transition-all duration-700 relative overflow-hidden">
      {/* Background Particles */}
      <BackgroundParticles />

      <div className="absolute top-4 right-4 z-50">
        <div className="frosted-glass-card p-2">
          <ThemeToggle />
        </div>
      </div> 

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="sm:mx-auto sm:w-full sm:max-w-md relative z-10"
      >
        <div className="flex justify-center mb-6">
          <div className="w-12 h-12 bg-gradient-to-br from-accent to-accent/80 rounded-xl flex items-center justify-center text-accent-foreground font-bold text-xl shadow-lg shadow-accent/20">
            S
          </div>
        </div>
        <h2 className="text-center text-3xl font-bold text-primary tracking-tight font-['Georgia']">
          Set New Password
        </h2>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          Create a strong password for your account
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0 relative z-10"
      >
        <Suspense fallback={<div className="text-center">Loading...</div>}>
          <ResetPasswordContent />
        </Suspense>
      </motion.div>
    </div>
  );
}
