import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { User } from '../models/user.model';

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
  message?: string;
}

export interface CreateAirlineRequest {
  email: string;
  firstName: string;
  lastName: string;
  airlineName: string;
  airlineCode: string;
  country?: string;
}

export interface CreateAirlineResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
    airline: {
      id: string;
      name: string;
      code: string;
      country: string;
    };
    temporaryPassword: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // Get all users (admin only)
  getAllUsers(params?: {
    role?: string;
    active?: boolean;
    page?: number;
    limit?: number;
    search?: string;
  }): Observable<UserListResponse> {
    let httpParams = new HttpParams();
    
    if (params) {
      if (params.role) httpParams = httpParams.set('role', params.role);
      if (params.active !== undefined) httpParams = httpParams.set('active', params.active.toString());
      if (params.page) httpParams = httpParams.set('page', params.page.toString());
      if (params.limit) httpParams = httpParams.set('limit', params.limit.toString());
      if (params.search) httpParams = httpParams.set('search', params.search);
    }

    return this.http.get<UserListResponse>(`${this.apiUrl}/users/admin/all`, { params: httpParams });
  }

  // Get user by ID (admin only)
  getUserById(userId: string): Observable<{ success: boolean; data: { user: User }; message?: string }> {
    return this.http.get<{ success: boolean; data: { user: User }; message?: string }>(`${this.apiUrl}/users/admin/${userId}`);
  }

  // Create airline by invitation (admin only)
  createAirlineByInvitation(data: CreateAirlineRequest): Observable<CreateAirlineResponse> {
    return this.http.post<CreateAirlineResponse>(`${this.apiUrl}/users/admin/invite-airline`, data);
  }

  // Toggle user status (admin only)
  toggleUserStatus(userId: string): Observable<{ success: boolean; message: string; data: { user: User } }> {
    return this.http.patch<{ success: boolean; message: string; data: { user: User } }>(`${this.apiUrl}/users/admin/${userId}/toggle-status`, {});
  }

  // Delete user (admin only)
  deleteUser(userId: string): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(`${this.apiUrl}/users/admin/${userId}`);
  }
}