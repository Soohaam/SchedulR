'use client';

import Link from 'next/link';
import { useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import RegisterForm from '../../components/auth/RegisterForm';
import EmailVerificationForm from '../../components/auth/EmailVerificationForm';
import { GlassCard } from '../../components/ui/GlassCard';
import { LuxuryLogo } from '../../components/ui/LuxuryLogo';
import { BackgroundParticles } from '../../components/ui/BackgroundParticles';
import { RootState } from '../../lib/store';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { motion } from 'framer-motion';

export default function RegisterPage() {
  const router = useRouter();
  const { requiresEmailVerification, isAuthenticated, user } = useSelector((state: RootState) => state.auth);

  // Redirect authenticated users to their dashboard
  useEffect(() => {
    if (isAuthenticated && user && !requiresEmailVerification) {
      const dashboardPath = user.role === 'ORGANISER'
        ? '/organizer'
        : user.role === 'ADMIN'
          ? '/admin'
          : '/user';
      router.replace(dashboardPath);
    }
  }, [isAuthenticated, user, requiresEmailVerification, router]);

  return (
    <div className="min-h-screen mesh-background vignette flex flex-col justify-center py-12 sm:px-6 lg:px-8 transition-all duration-700 relative overflow-hidden">
      {/* Background Particles */}
      <BackgroundParticles />

      {/* Theme Toggle */}
      <div className="absolute top-6 right-6 z-50">
        <div className="frosted-glass-card p-2">
          <ThemeToggle />
        </div>
      </div>

      {/* Header Section */}
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 text-center mb-8"
      >
        {/* Luxury Logo */}
        <div className="flex justify-center mb-8">
          <LuxuryLogo size="lg" />
        </div>

        {/* Membership Access Title */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="luxury-heading text-4xl md:text-5xl mb-4 tracking-wider"
        >
          MEMBERSHIP ACCESS
        </motion.h1>

        {/* Subtitle */}
        {!requiresEmailVerification && (
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="elegant-text text-center mb-6"
          >
            Already have an account?{' '}
            <Link 
              href="/login" 
              className="text-accent hover:text-accent/80 transition-all duration-500 font-medium underline-offset-4 hover:underline"
            >
              Enter Portal
            </Link>
          </motion.p>
        )}
      </motion.div>

      {/* Main Form Card */}
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
        className="sm:mx-auto sm:w-full sm:max-w-lg px-4 sm:px-0 relative z-10"
      >
        <GlassCard className="shadow-2xl">
          {requiresEmailVerification ? <EmailVerificationForm /> : <RegisterForm />}
        </GlassCard>
      </motion.div>

      {/* Decorative Elements */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1, delay: 0.6 }}
        className="flex justify-center mt-12 relative z-10"
      >
        <div className="flex items-center space-x-4 opacity-60">
          <div className="w-16 h-px bg-gradient-to-r from-transparent via-accent to-transparent"></div>
          <div className="w-3 h-3 border border-accent rotate-45 bg-accent/20"></div>
          <div className="w-16 h-px bg-gradient-to-r from-transparent via-accent to-transparent"></div>
        </div>
      </motion.div>
    </div>
  );
}
