'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '@/lib/store';
import { validateSession } from '@/lib/features/auth/authSlice';
import { useSessionGuard } from '@/lib/hooks/useSessionGuard';

interface ProtectedRouteProps {
    children: React.ReactNode;
    allowedRoles: string[];
    redirectTo?: string;
}

export default function ProtectedRoute({
    children,
    allowedRoles,
    redirectTo = '/login'
}: ProtectedRouteProps) {
    const router = useRouter();
    const dispatch = useDispatch<AppDispatch>();
    const { isAuthenticated, user, token, sessionExpiry } = useSelector((state: RootState) => state.auth);
    const [isValidating, setIsValidating] = useState(true);

    // Use session guard to prevent back button access
    useSessionGuard();

    useEffect(() => {
        const checkSession = async () => {
            // If no token, redirect to login
            if (!token) {
                router.replace(redirectTo);
                setIsValidating(false);
                return;
            }

            // Check if session is expired
            if (sessionExpiry && Date.now() > sessionExpiry) {
                router.replace(redirectTo);
                setIsValidating(false);
                return;
            }

            // Validate session with backend if authenticated but no user data
            if (token && !user) {
                try {
                    await dispatch(validateSession()).unwrap();
                } catch (error) {
                    router.replace(redirectTo);
                    setIsValidating(false);
                    return;
                }
            }

            setIsValidating(false);
        };

        checkSession();
    }, [token, sessionExpiry, user, dispatch, router, redirectTo]);

    useEffect(() => {
        // If authenticated but wrong role, redirect to correct dashboard
        if (isAuthenticated && user && !allowedRoles.includes(user.role)) {
            const correctPath = user.role === 'ORGANISER'
                ? '/organizer'
                : user.role === 'ADMIN'
                    ? '/admin'
                    : '/user';

            router.replace(correctPath);
        }
    }, [isAuthenticated, user, allowedRoles, router]);

    // Show loading while validating
    if (isValidating || !isAuthenticated || !user) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-accent border-t-transparent" />
            </div>
        );
    }

    // Don't render if wrong role
    if (!allowedRoles.includes(user.role)) {
        return null;
    }

    // Render children if authenticated and correct role
    return <>{children}</>;
}
