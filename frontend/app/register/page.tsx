'use client';

import Link from 'next/link';
import { useSelector } from 'react-redux';
import RegisterForm from '../../components/auth/RegisterForm';
import EmailVerificationForm from '../../components/auth/EmailVerificationForm';
import { Card } from '../../components/ui/Card';
import { RootState } from '../../lib/store';

export default function RegisterPage() {
  const { requiresEmailVerification } = useSelector((state: RootState) => state.auth);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          {requiresEmailVerification ? 'Verify your email' : 'Create your account'}
        </h2>
        {!requiresEmailVerification && (
          <p className="mt-2 text-center text-sm text-gray-600">
            Already have an account?{' '}
            <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
              Sign in
            </Link>
          </p>
        )}
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Card>
          {requiresEmailVerification ? <EmailVerificationForm /> : <RegisterForm />}
        </Card>
      </div>
    </div>
  );
}
