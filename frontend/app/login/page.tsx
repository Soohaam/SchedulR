'use client';

import Link from 'next/link';
import { useSelector } from 'react-redux';
import LoginForm from '../../components/auth/LoginForm';
import TwoFactorForm from '../../components/auth/TwoFactorForm';
import { Card } from '../../components/ui/Card';
import { RootState } from '../../lib/store';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { motion } from 'framer-motion';

export default function LoginPage() {
  const { requiresTwoFactor } = useSelector((state: RootState) => state.auth);

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center py-12 sm:px-6 lg:px-8 transition-colors duration-300 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-accent/5 blur-[100px] animate-pulse" />
        <div className="absolute top-[40%] -right-[10%] w-[40%] h-[40%] rounded-full bg-primary/5 blur-[100px] animate-pulse delay-1000" />
        <div className="absolute -bottom-[20%] left-[20%] w-[60%] h-[60%] rounded-full bg-accent/5 blur-[120px] animate-pulse delay-2000" />
      </div>

      <div className="absolute top-4 right-4 z-50">
        <ThemeToggle />
      </div>
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="sm:mx-auto sm:w-full sm:max-w-md relative z-10"
      >
        <div className="flex justify-center mb-6">
          <motion.div 
            whileHover={{ scale: 1.05, rotate: 5 }}
            className="w-14 h-14 bg-gradient-to-br from-accent to-accent/80 rounded-2xl flex items-center justify-center text-accent-foreground font-bold text-2xl shadow-xl shadow-accent/20"
          >
            S
          </motion.div>
        </div>
        <h2 className="text-center text-3xl font-bold text-primary tracking-tight">
          {requiresTwoFactor ? 'Verify Identity' : 'Welcome Back'}
        </h2>
        {!requiresTwoFactor && (
          <p className="mt-2 text-center text-sm text-muted-foreground">
            Or{' '}
            <Link href="/register" className="font-medium text-accent hover:text-accent/80 transition-colors underline-offset-4 hover:underline">
              create a new account
            </Link>
          </p>
        )}
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0 relative z-10"
      >
        <Card className="bg-card/80 backdrop-blur-xl border-border/50 shadow-2xl ring-1 ring-black/5 dark:ring-white/10">
          {requiresTwoFactor ? <TwoFactorForm /> : <LoginForm />}
        </Card>
      </motion.div>
    </div>
  );
}
