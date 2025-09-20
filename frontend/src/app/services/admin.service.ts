import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  User,
  AuthResponse,
  CreateAirlineInvitation,
  UserListResponse,
  UserSearchParams,
} from '../models/user.model';
import { AdminDashboardStats, SystemStats } from '../models/admin.model';

@Injectable({
  providedIn: 'root',
})
export class AdminService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    });
  }

  // User Management
  getAllUsers(params?: UserSearchParams): Observable<UserListResponse> {
    let httpParams = new HttpParams();

    if (params) {
      if (params.role) httpParams = httpParams.set('role', params.role);
      if (params.active !== undefined)
        httpParams = httpParams.set('active', params.active.toString());
      if (params.page)
        httpParams = httpParams.set('page', params.page.toString());
      if (params.limit)
        httpParams = httpParams.set('limit', params.limit.toString());
      if (params.search) httpParams = httpParams.set('search', params.search);
    }

    return this.http.get<UserListResponse>(`${this.apiUrl}/users`, {
      headers: this.getAuthHeaders(),
      params: httpParams,
    });
  }

  getUserById(
    userId: string
  ): Observable<{ success: boolean; data: { user: User } }> {
    return this.http.get<{ success: boolean; data: { user: User } }>(
      `${this.apiUrl}/users/${userId}`,
      {
        headers: this.getAuthHeaders(),
      }
    );
  }

  deleteUser(userId: string): Observable<AuthResponse> {
    return this.http.delete<AuthResponse>(`${this.apiUrl}/users/${userId}`, {
      headers: this.getAuthHeaders(),
    });
  }

  toggleUserStatus(userId: string): Observable<AuthResponse> {
    return this.http.patch<AuthResponse>(
      `${this.apiUrl}/users/${userId}/toggle-status`,
      {},
      {
        headers: this.getAuthHeaders(),
      }
    );
  }

  // Airline Invitation Management
  createAirlineByInvitation(
    data: CreateAirlineInvitation
  ): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(
      `${this.apiUrl}/users/create-airline-invitation`,
      data,
      {
        headers: this.getAuthHeaders(),
      }
    );
  }

  // Admin Statistics
  getDashboardStats(): Observable<{
    success: boolean;
    data: AdminDashboardStats;
  }> {
    return this.http.get<{ success: boolean; data: AdminDashboardStats }>(
      `${this.apiUrl}/admin/dashboard-stats`,
      {
        headers: this.getAuthHeaders(),
      }
    );
  }

  getSystemStats(): Observable<{ success: boolean; data: SystemStats }> {
    return this.http.get<{ success: boolean; data: SystemStats }>(
      `${this.apiUrl}/admin/system-stats`,
      {
        headers: this.getAuthHeaders(),
      }
    );
  }

  // System Maintenance (if needed)
  initializeDatabase(): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>(
      `${this.apiUrl}/admin/initialize-db`,
      {},
      {
        headers: this.getAuthHeaders(),
      }
    );
  }

  cleanupInactiveUsers(): Observable<{
    success: boolean;
    message: string;
    data: { deletedCount: number };
  }> {
    return this.http.delete<{
      success: boolean;
      message: string;
      data: { deletedCount: number };
    }>(`${this.apiUrl}/admin/cleanup-users`, {
      headers: this.getAuthHeaders(),
    });
  }

  // Bulk Operations
  bulkUpdateUsers(
    userIds: string[],
    updates: Partial<User>
  ): Observable<AuthResponse> {
    return this.http.patch<AuthResponse>(
      `${this.apiUrl}/admin/bulk-update-users`,
      {
        userIds,
        updates,
      },
      {
        headers: this.getAuthHeaders(),
      }
    );
  }

  bulkDeleteUsers(
    userIds: string[]
  ): Observable<{
    success: boolean;
    message: string;
    data: { deletedCount: number };
  }> {
    return this.http.post<{
      success: boolean;
      message: string;
      data: { deletedCount: number };
    }>(
      `${this.apiUrl}/admin/bulk-delete-users`,
      {
        userIds,
      },
      {
        headers: this.getAuthHeaders(),
      }
    );
  }

  // Export functionalities
  exportUsers(format: 'csv' | 'excel' = 'csv'): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/admin/export-users`, {
      headers: this.getAuthHeaders(),
      params: new HttpParams().set('format', format),
      responseType: 'blob',
    });
  }

  exportSystemReport(): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/admin/export-system-report`, {
      headers: this.getAuthHeaders(),
      responseType: 'blob',
    });
  }
}
