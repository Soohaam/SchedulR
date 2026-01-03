'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '@/lib/store';
import { logout } from '@/lib/features/auth/authSlice';
import {
  BarChart3,
  Users,
  Calendar,
  LogOut,
  Menu,
  X,
  Home,
  Settings,
  Bell,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { motion } from 'framer-motion';

const SIDEBAR_ITEMS = [
  {
    label: 'Dashboard',
    href: '/admin',
    icon: Home,
    description: 'Overview and statistics',
  },
  {
    label: 'Users',
    href: '/admin/users',
    icon: Users,
    description: 'Manage all users',
  },
  {
    label: 'Appointments',
    href: '/admin/appointments',
    icon: Calendar,
    description: 'View all appointments',
  },
  {
    label: 'Analytics',
    href: '/admin/analytics',
    icon: BarChart3,
    description: 'View reports and analytics',
  },
  {
    label: 'Settings',
    href: '/admin/settings',
    icon: Settings,
    description: 'Admin settings',
  },
];

interface NavItemProps {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  description: string;
  isActive: boolean;
  isMobile?: boolean;
}

const NavItem: React.FC<NavItemProps> = ({
  href,
  icon: Icon,
  label,
  description,
  isActive,
  isMobile = false,
}) => (
  <Link href={href}>
    <motion.div
      whileHover={{ x: 4 }}
      className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
        isActive
          ? 'bg-accent text-accent-foreground shadow-lg'
          : 'text-foreground hover:bg-secondary'
      }`}
    >
      <Icon className="w-5 h-5 flex-shrink-0" />
      <div className={`${isMobile ? 'block' : 'hidden lg:block'}`}>
        <p className="font-medium text-sm">{label}</p>
        {!isMobile && (
          <p className="text-xs opacity-70">{description}</p>
        )}
      </div>
    </motion.div>
  </Link>
);

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const { user, isAuthenticated } = useSelector(
    (state: RootState) => state.auth
  );
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Redirect if not authenticated or not admin
  React.useEffect(() => {
    if (!isAuthenticated || user?.role !== 'ADMIN') {
      router.push('/login');
    }
  }, [isAuthenticated, user?.role, router]);

  if (!isAuthenticated || user?.role !== 'ADMIN') {
    return null;
  }

  const handleLogout = () => {
    dispatch(logout());
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-card border-r border-border h-screen sticky top-0">
        {/* Logo Section */}
        <div className="flex items-center gap-3 px-6 py-6 border-b border-border bg-gradient-to-b from-background to-background/50">
          <div className="p-2 bg-gradient-to-br from-accent to-accent/80 rounded-lg shadow-lg">
            <BarChart3 className="w-6 h-6 text-accent-foreground" />
          </div>
          <div>
            <h1 className="font-bold text-lg text-primary">Admin Panel</h1>
            <p className="text-xs text-muted-foreground">Management</p>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-2">
          {SIDEBAR_ITEMS.map((item) => (
            <NavItem
              key={item.href}
              href={item.href}
              icon={item.icon}
              label={item.label}
              description={item.description}
              isActive={pathname === item.href || pathname.startsWith(`${item.href}/`)}
            />
          ))}
        </nav>

        {/* User Profile Section */}
        <div className="border-t border-border p-4 space-y-3">
          <div className="px-4 py-3 bg-gradient-to-br from-secondary to-secondary/50 rounded-lg border border-border/50">
            <p className="text-xs text-muted-foreground font-medium">Logged in as</p>
            <p className="font-semibold text-sm truncate text-primary mt-1">{user?.fullName}</p>
            <p className="text-xs text-muted-foreground truncate mt-0.5">{user?.email}</p>
          </div>
          <Button
            onClick={handleLogout}
            variant="outline"
            className="w-full flex items-center justify-center gap-2 hover:bg-destructive/10 hover:text-destructive hover:border-destructive transition-all"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-sm border-b border-border">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-accent" />
            <span className="font-bold text-lg">Admin</span>
          </div>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-secondary rounded-lg transition-colors"
          >
            {sidebarOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Sidebar */}
      {sidebarOpen && (
        <>
          <motion.aside
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed lg:hidden inset-y-0 left-0 w-64 bg-card border-r border-border shadow-lg z-30 mt-14"
          >
            <div className="flex flex-col h-full">
              {/* Navigation Items */}
              <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-2">
                {SIDEBAR_ITEMS.map((item) => (
                  <NavItem
                    key={item.href}
                    href={item.href}
                    icon={item.icon}
                    label={item.label}
                    description={item.description}
                    isActive={pathname === item.href || pathname.startsWith(`${item.href}/`)}
                    isMobile={true}
                  />
                ))}
              </nav>

              {/* User Profile Section */}
              <div className="border-t border-border p-4 space-y-3">
                <div className="px-4 py-3 bg-secondary rounded-lg">
                  <p className="text-xs text-muted-foreground">Logged in as</p>
                  <p className="font-medium text-sm truncate">{user?.fullName}</p>
                  <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                </div>
                <Button
                  onClick={handleLogout}
                  variant="outline"
                  className="w-full flex items-center justify-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </Button>
              </div>
            </div>
          </motion.aside>
          <div
            className="fixed inset-0 bg-black/50 z-20 lg:hidden mt-14"
            onClick={() => setSidebarOpen(false)}
          />
        </>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col mt-14 lg:mt-0">
        {/* Top Bar */}
        <div className="sticky top-0 z-10 bg-card/80 backdrop-blur-sm border-b border-border">
          <div className="px-4 lg:px-8 py-4 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-primary">
                {SIDEBAR_ITEMS.find(
                  (item) => pathname === item.href || pathname.startsWith(`${item.href}/`)
                )?.label || 'Admin'}
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Manage your system efficiently
              </p>
            </div>

            {/* Right side icons */}
            <div className="flex items-center gap-4">
              <ThemeToggle />
              <button className="p-2 hover:bg-secondary rounded-lg transition-colors relative hidden sm:block">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full animate-pulse"></span>
              </button>

              {/* Profile menu for desktop */}
              <div className="hidden lg:flex items-center gap-3 pl-4 border-l border-border">
                <div className="w-10 h-10 bg-gradient-to-br from-accent to-accent/80 rounded-full flex items-center justify-center shadow-lg">
                  <span className="text-sm font-bold text-accent-foreground">
                    {user?.fullName?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="hidden xl:block">
                  <p className="text-sm font-medium text-foreground">{user?.fullName}</p>
                  <p className="text-xs text-muted-foreground">Administrator</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {children}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
