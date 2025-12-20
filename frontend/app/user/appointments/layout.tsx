'use client';

/**
 * Layout for appointment booking flow
 * This layout does NOT require authentication to allow guest bookings
 */
export default function AppointmentsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
