'use client';

import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useDispatch, useSelector } from 'react-redux';
import { loginUser } from '../../lib/features/auth/authSlice';
import { AppDispatch, RootState } from '../../lib/store';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginForm() {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const { isLoading, error, isAuthenticated, requiresTwoFactor } = useSelector(
    (state: RootState) => state.auth
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, router]);

  const onSubmit = (data: LoginFormData) => {
    dispatch(loginUser(data));
  };

  if (requiresTwoFactor) {
    return null; // Parent component should handle switching to 2FA form
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
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
          <Input
            label="Email address"
            type="email"
            autoComplete="email"
            placeholder="name@example.com"
            error={errors.email?.message}
            {...register('email')}
            className="bg-background"
          />

          <Input
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

        <Button
          type="submit"
          disabled={isLoading}
          className="w-full bg-accent text-accent-foreground hover:bg-accent/90 h-11 text-base shadow-lg shadow-accent/20 transition-all hover:scale-[1.02]"
        >
          {isLoading ? (
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              Signing in...
            </div>
          ) : (
            'Sign in'
          )}
        </Button>
      </form>
    </div>
  );
}
