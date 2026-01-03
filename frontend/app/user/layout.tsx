'use client';

import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

export default function UserLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <ProtectedRoute allowedRoles={['CUSTOMER']}>
            <div className="min-h-screen flex flex-col bg-background">
                <header className="w-full py-4 px-4 border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-20">
                    <div className="max-w-7xl mx-auto flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-foreground">Dashboard</h2>
                        <ThemeToggle />
                    </div>
                </header>
                <main className="flex-1">
                    {children}
                </main>
            </div>
        </ProtectedRoute>
    );
}
