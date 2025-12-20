'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useDispatch, useSelector } from 'react-redux';
import { verifyEmail } from '../../lib/features/auth/authSlice';
import { AppDispatch, RootState } from '../../lib/store';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

const emailVerificationSchema = z.object({
  code: z.string().length(6, 'Code must be 6 digits'),
});

type EmailVerificationFormData = z.infer<typeof emailVerificationSchema>;

export default function EmailVerificationForm() {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const { isLoading, error, isAuthenticated, emailToVerify, user } = useSelector(
    (state: RootState) => state.auth
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EmailVerificationFormData>({
    resolver: zodResolver(emailVerificationSchema),
  });

  useEffect(() => {
    if (isAuthenticated && user) {
      switch (user.role) {
        case 'ORGANISER':
          router.push('/organizer');
          break;
        case 'ADMIN':
          router.push('/admin');
          break;
        case 'CUSTOMER':
        default:
          router.push('/dashboard');
          break;
      }
    }
  }, [isAuthenticated, user, router]);

  const onSubmit = (data: EmailVerificationFormData) => {
    if (emailToVerify) {
      dispatch(verifyEmail({ email: emailToVerify, code: data.code }));
    }
  };

  return (
    <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
      <div className="text-center mb-4">
        <h3 className="text-lg font-medium text-gray-900">Verify your Email</h3>
        <p className="text-sm text-gray-500">
          We sent a verification code to <strong>{emailToVerify}</strong>.
          Please enter it below.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
          {error}
        </div>
      )}
      
      <Input
        label="Verification Code"
        type="text"
        placeholder="000000"
        maxLength={6}
        className="text-center tracking-widest text-lg"
        error={errors.code?.message}
        {...register('code')}
      />

      <Button type="submit" isLoading={isLoading}>
        Verify Email
      </Button>
    </form>
  );
}
