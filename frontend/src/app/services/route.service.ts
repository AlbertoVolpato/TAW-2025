import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface RouteData {
  _id?: string;
  origin: {
    _id: string;
    name: string;
    city: string;
    country: string;
    iataCode: string;
  };
  destination: {
    _id: string;
    name: string;
    city: string;
    country: string;
    iataCode: string;
  };
  airline?: {
    _id: string;
    name: string;
    iataCode: string;
  };
  distance?: number;
  flightTime?: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Airport {
  _id: string;
  name: string;
  city: string;
  country: string;
  code: string;
}

@Injectable({
  providedIn: 'root',
})
export class RouteService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    });
  }

  // Get all airports for route creation
  getAirports(search?: string, limit = 50): Observable<any> {
    let httpParams = new HttpParams();

    if (search) {
      httpParams = httpParams.set('search', search);
    }
    httpParams = httpParams.set('limit', limit.toString());

    return this.http.get(`${this.apiUrl}/airports`, {
      headers: this.getAuthHeaders(),
      params: httpParams,
    });
  }

  // Get all routes (for admin view) - use admin API
  getAllRoutes(): Observable<any> {
    return this.http.get(`${this.apiUrl}/admin/routes`, {
      headers: this.getAuthHeaders(),
      params: new HttpParams().set('limit', '100'),
    });
  }

  // Get routes for a specific airline
  getAirlineRoutes(): Observable<any> {
    return this.http.get(`${this.apiUrl}/routes`, {
      headers: this.getAuthHeaders(),
    });
  }

  // Create a new route (airline version)
  createAirlineRoute(routeData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/routes`, routeData, {
      headers: this.getAuthHeaders(),
    });
  }

  // Update an existing route (airline version)
  updateAirlineRoute(routeId: string, routeData: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/routes/${routeId}`, routeData, {
      headers: this.getAuthHeaders(),
    });
  }

  // Delete a route (airline version)
  deleteAirlineRoute(routeId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/routes/${routeId}`, {
      headers: this.getAuthHeaders(),
    });
  }

  // Create a new route (admin version)
  createRoute(routeData: Partial<RouteData>): Observable<any> {
    return this.http.post(`${this.apiUrl}/admin/routes`, routeData, {
      headers: this.getAuthHeaders(),
    });
  }

  // Update an existing route (admin version)
  updateRoute(routeId: string, routeData: Partial<RouteData>): Observable<any> {
    return this.http.put(`${this.apiUrl}/admin/routes/${routeId}`, routeData, {
      headers: this.getAuthHeaders(),
    });
  }

  // Delete a route (admin version)
  deleteRoute(routeId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/admin/routes/${routeId}`, {
      headers: this.getAuthHeaders(),
    });
  }

  // Calculate distance between two airports (simple approximation)
  calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c);
  }

  private toRad(deg: number): number {
    return deg * (Math.PI / 180);
  }
}
