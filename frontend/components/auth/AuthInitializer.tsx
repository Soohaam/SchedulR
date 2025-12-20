'use client';

import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/lib/store';
import { validateSession } from '@/lib/features/auth/authSlice';

export default function AuthInitializer({ children }: { children: React.ReactNode }) {
    const dispatch = useDispatch<AppDispatch>();
    const { isAuthenticated, token, sessionExpiry } = useSelector((state: RootState) => state.auth);
    const [isInitialized, setIsInitialized] = useState(false);

    useEffect(() => {
        const initAuth = async () => {
            // If we have a token, validate the session
            if (token) {
                // Check if session is expired
                if (sessionExpiry && Date.now() > sessionExpiry) {
                    console.log('Session expired on init');
                    setIsInitialized(true);
                    return;
                }

                // Validate session with backend if not authenticated
                if (!isAuthenticated) {
                    try {
                        await dispatch(validateSession()).unwrap();
                    } catch (error) {
                        console.error('Failed to restore session:', error);
                    }
                }
            }
            setIsInitialized(true);
        };

        initAuth();
    }, []); // Run only once on mount

    useEffect(() => {
        // Validate session when user returns to the tab
        const handleVisibilityChange = async () => {
            if (document.visibilityState === 'visible' && token && isAuthenticated) {
                // Check if session is expired
                if (sessionExpiry && Date.now() > sessionExpiry) {
                    console.log('Session expired while tab was hidden');
                    return;
                }

                // Optionally revalidate session with backend
                try {
                    await dispatch(validateSession()).unwrap();
                } catch (error) {
                    console.error('Session validation failed on tab focus:', error);
                }
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [token, isAuthenticated, sessionExpiry, dispatch]);

    // Show nothing while initializing to prevent flash of wrong content
    if (!isInitialized) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-accent border-t-transparent" />
            </div>
        );
    }

    return <>{children}</>;
}
