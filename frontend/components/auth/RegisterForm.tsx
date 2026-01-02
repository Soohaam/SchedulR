'use client';

import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useDispatch, useSelector } from 'react-redux';
import { registerUser } from '../../lib/features/auth/authSlice';
import { AppDispatch, RootState } from '../../lib/store';
import { GoldInput } from '../ui/GoldInput';
import { GoldButton } from '../ui/GoldButton';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Briefcase } from 'lucide-react';

const registerSchema = z.object({
  fullName: z.string().min(2, 'Full name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must include at least one uppercase letter')
    .regex(/[a-z]/, 'Password must include at least one lowercase letter')
    .regex(/[0-9]/, 'Password must include at least one number'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterForm() {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const { isLoading, error, isAuthenticated, user } = useSelector(
    (state: RootState) => state.auth
  );
  const [role, setRole] = useState<'customer' | 'organiser'>('customer');
  const hasRedirected = useRef(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
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

  const onSubmit = (data: RegisterFormData) => {
    const { confirmPassword, ...userData } = data;
    dispatch(registerUser({ ...userData, role }));
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Luxury Role Toggle */}
      <div className="mb-10 flex justify-center">
        <div className="luxury-toggle inline-flex relative w-full max-w-[320px]">
          <div className="relative z-10 grid grid-cols-2 w-full gap-1">
            <button
              onClick={() => setRole('customer')}
              className={`luxury-toggle-option ${
                role === 'customer' ? 'luxury-toggle-active' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {role === 'customer' && (
                <motion.div
                  layoutId="activeRole"
                  className="absolute inset-0 bg-gradient-to-r from-accent via-accent/90 to-accent rounded-lg"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
              <span className="relative z-10 flex items-center justify-center gap-2 text-sm">
                <User size={16} />
                Customer
              </span>
            </button>
            <button
              onClick={() => setRole('organiser')}
              className={`luxury-toggle-option ${
                role === 'organiser' ? 'luxury-toggle-active' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {role === 'organiser' && (
                <motion.div
                  layoutId="activeRole"
                  className="absolute inset-0 bg-gradient-to-r from-accent via-accent/90 to-accent rounded-lg"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
              <span className="relative z-10 flex items-center justify-center gap-2 text-sm">
                <Briefcase size={16} />
                Organizer
              </span>
            </button>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="inner-box space-y-8">
        <AnimatePresence mode="wait">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-destructive/10 border border-destructive/20 text-destructive px-6 py-4 rounded-xl text-sm backdrop-blur-sm"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="space-y-8">
          <GoldInput
            label="Full Name"
            type="text"
            placeholder={role === 'customer' ? "John Doe" : "Event Organization Inc."}
            error={errors.fullName?.message}
            {...register('fullName')}
          />

          <GoldInput
            label="Email Address"
            type="email"
            autoComplete="email"
            placeholder="name@example.com"
            error={errors.email?.message}
            {...register('email')}
          />

          <GoldInput
            label="Password"
            type="password"
            autoComplete="new-password"
            placeholder="••••••••"
            error={errors.password?.message}
            {...register('password')}
          />

          <GoldInput
            label="Confirm Password"
            type="password"
            autoComplete="new-password"
            placeholder="••••••••"
            error={errors.confirmPassword?.message}
            {...register('confirmPassword')}
          />
        </div>

        <div className="pt-4">
          <GoldButton
            type="submit"
            disabled={isLoading}
            className="w-full"
            isLoading={isLoading}
          >
            {isLoading ? 'Creating Account...' : `Register as ${role === 'customer' ? 'Customer' : 'Organizer'}`}
          </GoldButton>
        </div>
        </div>
      </form>
    </div>
  );
}
