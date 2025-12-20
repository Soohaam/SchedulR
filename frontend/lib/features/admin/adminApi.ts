import api from '../../api';

export interface User {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  profileImage: string | null;
  timezone: string | null;
  role: 'ADMIN' | 'ORGANISER' | 'CUSTOMER';
  isActive: boolean;
  isVerified: boolean;
  isEmailVerified: boolean;
  lastLoginAt: string | null;
  loginCount: number;
  emailNotifications: boolean;
  smsNotifications: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserWithStats extends User {
  statistics?: {
    bookingCount?: number;
    totalSpend?: number;
    servicesCreated?: number;
    bookingsReceived?: number;
    totalRevenue?: number;
  };
}

export interface Appointment {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  customerEmail: string;
  customerPhone: string;
  venue: string;
  notes: string;
  createdAt: string;
  appointmentTypeId: string;
  appointmentTitle: string;
  organizerId: string;
  customerName: string;
  customerEmailFromUser: string;
  organiserName: string;
  organiserEmail: string;
  staffMemberName: string | null;
  resourceName: string | null;
  paymentAmount: number | null;
  paymentStatus: string | null;
}

export interface DashboardStats {
  users: {
    total: number;
    customers: number;
    organisers: number;
    admins: number;
    newThisMonth: number;
  };
  appointments: {
    total: number;
    completed: number;
    upcoming: number;
    cancelled: number;
    pending: number;
  };
  revenue: {
    total: number;
    thisMonth: number;
    lastMonth: number;
    growth: number;
  };
  topOrganisers: Array<{
    id: string;
    name: string;
    email: string;
    bookings: number;
    revenue: number;
  }>;
}

export interface Pagination {
  currentPage: number;
  totalPages: number;
  totalUsers?: number;
  totalAppointments?: number;
  limit: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

// Get dashboard statistics
export const getDashboardStats = async (): Promise<DashboardStats> => {
  const response = await api.get('/api/v1/admin/dashboard');
  return response.data.data;
};

// Get all users with filters
export const getAllUsers = async (filters: {
  role?: string;
  isActive?: boolean;
  isVerified?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<{ users: User[]; pagination: Pagination }> => {
  // Clean up filters - remove empty strings and undefined values
  const cleanedFilters: any = {};
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== '' && value !== undefined && value !== null) {
      cleanedFilters[key] = value;
    }
  });
  
  const response = await api.get('/api/v1/admin/users', { params: cleanedFilters });
  return response.data;
};

// Get user by ID
export const getUserById = async (
  userId: string
): Promise<{ user: UserWithStats; statistics: any }> => {
  const response = await api.get(`/api/v1/admin/users/${userId}`);
  return response.data;
};

// Toggle user status
export const toggleUserStatus = async (
  userId: string,
  isActive: boolean
): Promise<{ message: string; user: User }> => {
  const response = await api.patch(`/api/v1/admin/users/${userId}/toggle-status`, {
    isActive,
  });
  return response.data;
};

// Change user role
export const changeUserRole = async (
  userId: string,
  newRole: string
): Promise<{ message: string; user: User }> => {
  const response = await api.patch(`/api/v1/admin/users/${userId}/change-role`, {
    newRole,
  });
  return response.data;
};

// Get all appointments
export const getAllAppointments = async (filters: {
  status?: string;
  organizerId?: string;
  customerId?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}): Promise<{ appointments: Appointment[]; pagination: Pagination }> => {
  // Clean up filters - remove empty strings and undefined values
  const cleanedFilters: any = {};
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== '' && value !== undefined && value !== null) {
      cleanedFilters[key] = value;
    }
  });
  
  const response = await api.get('/api/v1/admin/appointments', { params: cleanedFilters });
  return response.data;
};
