import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';
import {
  User,
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  ChangePasswordRequest,
  ForceChangePasswordRequest,
} from '../models/user.model';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = environment.apiUrl;
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient, private router: Router) {
    // Check if user is already logged in
    this.loadUserFromStorage();
  }

  private loadUserFromStorage(): void {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');

    console.log('Loading user from storage:', { token: !!token, user: !!user });

    if (token && user) {
      try {
        const parsedUser = JSON.parse(user);

        // Validate token before setting user
        const payload = JSON.parse(atob(token.split('.')[1]));
        const isTokenValid = payload.exp > Date.now() / 1000;

        if (isTokenValid) {
          this.currentUserSubject.next(parsedUser);
          console.log('User restored from storage:', parsedUser);
        } else {
          console.log('Token expired, clearing storage');
          this.logout();
        }
      } catch (error) {
        console.error('Error parsing user from storage:', error);
        this.logout();
      }
    } else {
      console.log('No valid user/token found in storage');
    }
  }

  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.apiUrl}/auth/login`, credentials)
      .pipe(
        tap((response) => {
          console.log('Login response:', response);

          // Case 1: Normal successful login with token
          if (
            response.success &&
            response.data &&
            response.data.token &&
            response.data.user
          ) {
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('user', JSON.stringify(response.data.user));
            this.currentUserSubject.next(response.data.user);
            console.log('User logged in:', response.data.user);
            console.log('Token saved:', response.data.token);
          }

          // Case 2: Password change required - save user temporarily without token
          else if (
            response.success &&
            response.data &&
            response.data.user &&
            (response.data.requiresPasswordChange ||
              response.data.user.mustChangePassword)
          ) {
            // Save user info temporarily for password change process
            localStorage.setItem('user', JSON.stringify(response.data.user));
            localStorage.setItem('requiresPasswordChange', 'true');
            this.currentUserSubject.next(response.data.user);
            console.log('User requires password change:', response.data.user);
          }
        })
      );
  }

  register(userData: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(
      `${this.apiUrl}/auth/register`,
      userData
    );
  }

  forceChangePassword(
    data: ForceChangePasswordRequest
  ): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.apiUrl}/auth/force-change-password`, data)
      .pipe(
        tap((response) => {
          // Handle both old and new response structures
          if (response.success) {
            let user: any = null;
            let token: string = '';

            if (response.data && response.data.token && response.data.user) {
              user = response.data.user;
              token = response.data.token;
            } else if (response.token && response.user) {
              user = response.user;
              token = response.token;
            }

            if (user && token) {
              localStorage.setItem('token', token);
              localStorage.setItem('user', JSON.stringify(user));
              localStorage.removeItem('requiresPasswordChange'); // Remove the temporary flag
              this.currentUserSubject.next(user);
            }
          }
        })
      );
  }

  changePassword(data: ChangePasswordRequest): Observable<AuthResponse> {
    return this.http.put<AuthResponse>(
      `${this.apiUrl}/users/change-password`,
      data,
      {
        headers: this.getAuthHeaders(),
      }
    );
  }

  getProfile(): Observable<AuthResponse> {
    return this.http.get<AuthResponse>(`${this.apiUrl}/users/profile`, {
      headers: this.getAuthHeaders(),
    });
  }

  updateProfile(userData: Partial<User>): Observable<AuthResponse> {
    return this.http
      .put<AuthResponse>(`${this.apiUrl}/users/profile`, userData, {
        headers: this.getAuthHeaders(),
      })
      .pipe(
        tap((response) => {
          if (response.success && response.user) {
            localStorage.setItem('user', JSON.stringify(response.user));
            this.currentUserSubject.next(response.user);
          }
        })
      );
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('requiresPasswordChange'); // Clean up password change flag
    this.currentUserSubject.next(null);
    // Don't auto-navigate, let components handle navigation
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    const user = this.getCurrentUser();

    if (!token || !user) return false;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const isTokenValid = payload.exp > Date.now() / 1000;

      // If token is expired, clear localStorage and update subject
      if (!isTokenValid) {
        this.logout();
        return false;
      }

      return true;
    } catch (error) {
      this.logout();
      return false;
    }
  }

  // Check if user can access change-password (either authenticated or requires password change)
  canAccessChangePassword(): boolean {
    const user = this.getCurrentUser();
    const requiresChange = this.requiresPasswordChange();

    // Allow access if user is fully authenticated OR if they need to change password
    return this.isAuthenticated() || (user && requiresChange);
  }

  getCurrentUser(): any {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }

  requiresPasswordChange(): boolean {
    return localStorage.getItem('requiresPasswordChange') === 'true';
  }

  hasRole(role: string): boolean {
    const user = this.getCurrentUser();
    return user?.role === role;
  }

  isAdmin(): boolean {
    return this.hasRole('admin');
  }

  isAirline(): boolean {
    return this.hasRole('airline');
  }

  isPassenger(): boolean {
    return this.hasRole('passenger');
  }

  mustChangePassword(): boolean {
    const user = this.getCurrentUser();
    return user ? user.mustChangePassword : false;
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('token');
  }

  redirectBasedOnRole(): void {
    const user = this.getCurrentUser();
    if (!user) {
      this.router.navigate(['/login']);
      return;
    }

    switch (user.role) {
      case 'admin':
        this.router.navigate(['/admin/profile']);
        break;
      case 'airline':
        this.router.navigate(['/airline']);
        break;
      case 'passenger':
        this.router.navigate(['/flights/search']);
        break;
      default:
        this.router.navigate(['/flights/search']);
        break;
    }
  }

  deleteAccount(): Observable<{ success: boolean; message: string }> {
    return this.http
      .delete<{ success: boolean; message: string }>(
        `${this.apiUrl}/users/profile`,
        {
          headers: this.getAuthHeaders(),
        }
      )
      .pipe(
        tap((response) => {
          if (response.success) {
            // Clear all user data and logout
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            this.currentUserSubject.next(null);
            this.router.navigate(['/login']);
          }
        })
      );
  }

  private getAuthHeaders(): HttpHeaders {
    const token = this.getToken();
    return new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    });
  }
}
