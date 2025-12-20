'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useDispatch, useSelector } from 'react-redux';
import { registerUser } from '../../lib/features/auth/authSlice';
import { AppDispatch, RootState } from '../../lib/store';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
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
  const { isLoading, error, isAuthenticated } = useSelector(
    (state: RootState) => state.auth
  );
  const [role, setRole] = useState<'customer' | 'organiser'>('customer');

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, router]);

  const onSubmit = (data: RegisterFormData) => {
    const { confirmPassword, ...userData } = data;
    dispatch(registerUser({ ...userData, role }));
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="mb-8 flex justify-center">
        <div className="bg-muted p-1 rounded-xl inline-flex relative">
          <motion.div
            className="absolute inset-y-1 bg-card shadow-sm rounded-lg"
            initial={false}
            animate={{
              x: role === 'customer' ? 0 : '100%',
              width: '50%'
            }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          />
          <button
            onClick={() => setRole('customer')}
            className={`relative z-10 px-6 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
              role === 'customer' ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <User size={16} />
            Customer
          </button>
          <button
            onClick={() => setRole('organiser')}
            className={`relative z-10 px-6 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
              role === 'organiser' ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Briefcase size={16} />
            Organizer
          </button>
        </div>
      </div>

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
            label="Full Name"
            type="text"
            placeholder={role === 'customer' ? "John Doe" : "Event Organization Inc."}
            error={errors.fullName?.message}
            {...register('fullName')}
            className="bg-background"
          />
          
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
            autoComplete="new-password"
            placeholder="••••••••"
            error={errors.password?.message}
            {...register('password')}
            className="bg-background"
          />

          <Input
            label="Confirm Password"
            type="password"
            autoComplete="new-password"
            placeholder="••••••••"
            error={errors.confirmPassword?.message}
            {...register('confirmPassword')}
            className="bg-background"
          />
        </div>

        <Button
          type="submit"
          disabled={isLoading}
          className="w-full bg-accent text-accent-foreground hover:bg-accent/90 h-11 text-base shadow-lg shadow-accent/20 transition-all hover:scale-[1.02]"
        >
          {isLoading ? (
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              Creating account...
            </div>
          ) : (
            `Register as ${role === 'customer' ? 'Customer' : 'Organizer'}`
          )}
        </Button>
      </form>
    </div>
  );
}
