'use client';

import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useDispatch, useSelector } from 'react-redux';
import { loginUser } from '../../lib/features/auth/authSlice';
import { AppDispatch, RootState } from '../../lib/store';
import { GoldInput } from '../ui/GoldInput';
import { GoldButton } from '../ui/GoldButton';
import { useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginForm() {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const { isLoading, error, isAuthenticated, requiresTwoFactor, user } = useSelector(
    (state: RootState) => state.auth
  );
  const hasRedirected = useRef(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  useEffect(() => {
    if (isAuthenticated && user && !hasRedirected.current) {
      hasRedirected.current = true;
      const redirectPath = user.role === 'ORGANISER'
        ? '/organizer'
        : user.role === 'ADMIN'
          ? '/admin'
          : '/user';

      router.replace(redirectPath);
    }
  }, [isAuthenticated, user]);

  const onSubmit = (data: LoginFormData) => {
    dispatch(loginUser(data));
  };

  if (requiresTwoFactor) {
    return null; // Parent component should handle switching to 2FA form
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="inner-box space-y-6">
        <AnimatePresence mode="wait">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg text-sm"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="space-y-4">
          <GoldInput
            label="Email address"
            type="email"
            autoComplete="email"
            placeholder="name@example.com"
            error={errors.email?.message}
            {...register('email')}
            className="bg-background"
          />

          <GoldInput
            label="Password"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            error={errors.password?.message}
            {...register('password')}
            className="bg-background"
          />

          <div className="flex justify-end">
            <Link href="/forgot-password" className="text-sm font-medium text-accent hover:text-accent/80 transition-colors">
              Forgot password?
            </Link>
          </div>
        </div>

        <GoldButton
          type="submit"
          disabled={isLoading}
          className="w-full"
          isLoading={isLoading}
        >
          Sign in
        </GoldButton>
        </div>
      </form>
    </div>
  );
}
