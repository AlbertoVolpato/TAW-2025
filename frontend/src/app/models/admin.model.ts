// Admin Models
export interface AdminStats {
  totalUsers: number;
  totalAirlines: number;
  totalFlights: number;
  totalBookings: number;
  recentRegistrations: User[];
}

export interface CreateAirlineInvitation {
  email: string;
  firstName: string;
  lastName: string;
  airlineName: string;
  airlineCode: string;
  country?: string;
}

export interface UserListResponse {
  success: boolean;
  data: {
    users: User[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  };
}

export interface DeleteUserResponse {
  success: boolean;
  message: string;
  data: {
    deletedUser: User;
  };
}

export interface User {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'airline' | 'passenger';
  isActive: boolean;
  isEmailVerified: boolean;
  mustChangePassword: boolean;
  airline?: {
    _id: string;
    name: string;
    code: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

export interface AdminDashboardStats {
  totalUsers: number;
  activeUsers: number;
  newUsersThisMonth: number;
  totalAirlines: number;
  activeAirlines: number;
  totalFlights: number;
  activeFlights: number;
  totalBookings: number;
  bookingsThisMonth: number;
  totalRevenue: number;
  recentUsers: User[];
  usersByRole: {
    admin: number;
    airline: number;
    passenger: number;
  };
  userGrowth: {
    date: string;
    count: number;
  }[];
}

export interface SystemStats {
  totalUsers: number;
  totalAirlines: number;
  totalFlights: number;
  totalBookings: number;
  usersByRole: {
    _id: string;
    count: number;
  }[];
  recentBookings: number;
  newUsers: number;
  growthRate: string;
  collections?: {
    name: string;
    count: number;
    size: number;
  }[];
  performance?: {
    averageResponseTime: number;
    requestsPerMinute: number;
    errorRate: number;
  };
  systemHealth?: {
    memoryUsage: number;
    cpuUsage: number;
    uptime: number;
  };
}
