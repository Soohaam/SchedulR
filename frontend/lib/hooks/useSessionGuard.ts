'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useSelector } from 'react-redux';
import { RootState } from '../store';

/**
 * Custom hook to prevent unauthorized access via browser back button
 * after logout or session expiration
 */
export function useSessionGuard() {
    const router = useRouter();
    const pathname = usePathname();
    const { isAuthenticated, token } = useSelector((state: RootState) => state.auth);

    useEffect(() => {
        // Handle popstate (back/forward button) events
        const handlePopState = () => {
            // If user is not authenticated and trying to access protected routes
            const protectedRoutes = ['/organizer', '/user', '/admin'];
            const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));

            if (!isAuthenticated && !token && isProtectedRoute) {
                // Redirect to login and replace history
                router.replace('/login');
            }
        };

        // Listen for popstate events
        window.addEventListener('popstate', handlePopState);

        // Cleanup
        return () => {
            window.removeEventListener('popstate', handlePopState);
        };
    }, [isAuthenticated, token, pathname, router]);
}

/**
 * Custom hook to warn users about unsaved changes before leaving
 */
export function useBeforeUnload(hasUnsavedChanges: boolean) {
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (hasUnsavedChanges) {
                e.preventDefault();
                e.returnValue = '';
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [hasUnsavedChanges]);
}
