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

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: 'passenger';
}

export interface AuthResponse {
  success: boolean;
  message: string;
  user?: User;
  token?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface ForceChangePasswordRequest {
  email: string;
  newPassword: string;
}

export interface CreateAirlineInvitation {
  email: string;
  firstName: string;
  lastName: string;
  airlineName: string;
  airlineCode: string;
  country?: string;
}

export interface UserSearchParams {
  role?: 'admin' | 'airline' | 'passenger';
  active?: boolean;
  page?: number;
  limit?: number;
  search?: string;
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
