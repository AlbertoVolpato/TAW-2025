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

    if (token && user) {
      try {
        const parsedUser = JSON.parse(user);
        this.currentUserSubject.next(parsedUser);
      } catch (error) {
        console.error('Error parsing user from storage:', error);
        this.logout();
      }
    }
  }

  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.apiUrl}/auth/login`, credentials)
      .pipe(
        tap((response) => {
          console.log('Login response:', response);
          if (response.success && response.token && response.user) {
            localStorage.setItem('token', response.token);
            localStorage.setItem('user', JSON.stringify(response.user));
            this.currentUserSubject.next(response.user);
            console.log('User logged in:', response.user);
            console.log('Token saved:', response.token);
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
          if (response.success && response.token && response.user) {
            localStorage.setItem('token', response.token);
            localStorage.setItem('user', JSON.stringify(response.user));
            this.currentUserSubject.next(response.user);
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
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) return false;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp > Date.now() / 1000;
    } catch {
      return false;
    }
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
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
        this.router.navigate(['/admin']);
        break;
      case 'airline':
        this.router.navigate(['/airline']);
        break;
      case 'passenger':
        this.router.navigate(['/passenger']);
        break;
      default:
        this.router.navigate(['/flights/search']);
        break;
    }
  }

  private getAuthHeaders(): HttpHeaders {
    const token = this.getToken();
    return new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    });
  }
}
