'use client';

import Link from 'next/link';
import { useSelector } from 'react-redux';
import LoginForm from '../../components/auth/LoginForm';
import TwoFactorForm from '../../components/auth/TwoFactorForm';
import { Card } from '../../components/ui/Card';
import { RootState } from '../../lib/store';

export default function LoginPage() {
  const { requiresTwoFactor } = useSelector((state: RootState) => state.auth);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          {requiresTwoFactor ? 'Verify Identity' : 'Sign in to your account'}
        </h2>
        {!requiresTwoFactor && (
          <p className="mt-2 text-center text-sm text-gray-600">
            Or{' '}
            <Link href="/register" className="font-medium text-blue-600 hover:text-blue-500">
              create a new account
            </Link>
          </p>
        )}
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Card>
          {requiresTwoFactor ? <TwoFactorForm /> : <LoginForm />}
        </Card>
      </div>
    </div>
  );
}
