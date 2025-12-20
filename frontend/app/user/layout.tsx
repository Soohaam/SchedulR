'use client';

import ProtectedRoute from '@/components/auth/ProtectedRoute';

export default function UserLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <ProtectedRoute allowedRoles={['CUSTOMER']}>
            {children}
        </ProtectedRoute>
    );
}
