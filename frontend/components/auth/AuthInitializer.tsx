'use client';

import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/lib/store';
import { fetchProfile } from '@/lib/features/auth/authSlice';

export default function AuthInitializer({ children }: { children: React.ReactNode }) {
    const dispatch = useDispatch<AppDispatch>();
    const { isAuthenticated, token } = useSelector((state: RootState) => state.auth);
    const [isInitialized, setIsInitialized] = useState(false);

    useEffect(() => {
        const initAuth = async () => {
            // If we have a token but no user data, fetch the profile
            if (token && !isAuthenticated) {
                try {
                    await dispatch(fetchProfile()).unwrap();
                } catch (error) {
                    console.error('Failed to restore session:', error);
                }
            }
            setIsInitialized(true);
        };

        initAuth();
    }, []); // Run only once on mount

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
