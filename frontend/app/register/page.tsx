'use client';

import Link from 'next/link';
import { useSelector } from 'react-redux';
import RegisterForm from '../../components/auth/RegisterForm';
import EmailVerificationForm from '../../components/auth/EmailVerificationForm';
import { Card } from '../../components/ui/Card';
import { RootState } from '../../lib/store';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

export default function RegisterPage() {
  const { requiresEmailVerification } = useSelector((state: RootState) => state.auth);

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center py-12 sm:px-6 lg:px-8 transition-colors duration-300">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center mb-6">
          <div className="w-12 h-12 bg-accent rounded-xl flex items-center justify-center text-accent-foreground font-bold text-2xl shadow-lg shadow-accent/20">S</div>
        </div>
        <h2 className="text-center text-3xl font-bold text-primary tracking-tight">
          {requiresEmailVerification ? 'Verify your email' : 'Create your account'}
        </h2>
        {!requiresEmailVerification && (
          <p className="mt-2 text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link href="/login" className="font-medium text-accent hover:text-accent/80 transition-colors">
              Sign in
            </Link>
          </p>
        )}
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <Card className="bg-card border-border shadow-xl">
          {requiresEmailVerification ? <EmailVerificationForm /> : <RegisterForm />}
        </Card>
      </div>
    </div>
  );
}
