'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/store';

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
    const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);

    useEffect(() => {
        // Only redirect if we're sure the user is not authenticated
        if (isAuthenticated === false) {
            router.replace(redirectTo);
            return;
        }

        // If authenticated but wrong role, redirect
        if (isAuthenticated && user && !allowedRoles.includes(user.role)) {
            const correctPath = user.role === 'ORGANISER'
                ? '/organizer'
                : user.role === 'ADMIN'
                    ? '/admin'
                    : '/user';

            router.replace(correctPath);
        }
    }, [isAuthenticated, user, allowedRoles, redirectTo, router]);

    // Show nothing while checking authentication
    if (isAuthenticated === undefined || isAuthenticated === null) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-accent border-t-transparent" />
            </div>
        );
    }

    // Don't render if not authenticated
    if (!isAuthenticated) {
        return null;
    }

    // Don't render if wrong role
    if (user && !allowedRoles.includes(user.role)) {
        return null;
    }

    // Render children if authenticated and correct role
    return <>{children}</>;
}
