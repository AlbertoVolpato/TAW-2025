import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Flight } from '../models/flight.model';
import {
  AirlineStats,
  AirlineRevenueStats,
  PopularRoute,
  PopularRoutesStats,
  PassengerStats,
  AirlineInfo,
} from '../models/airline-stats.model';

export interface CreateFlightRequest {
  flightNumber: string;
  departureAirport: string;
  arrivalAirport: string;
  departureTime: string;
  arrivalTime: string;
  aircraft: string;
  economyPrice: number;
  businessPrice: number;
  firstPrice: number;
  gate?: string;
  terminal?: string;
}

export interface CreateAircraftRequest {
  model: string;
  registrationNumber: string;
  capacity: number;
  type: string;
}

export interface AirlineStatsResponse {
  success: boolean;
  data: {
    totalFlights: number;
    activeFlights: number;
    totalPassengers: number;
    totalRevenue: number;
    popularRoutes: Array<{
      route: string;
      count: number;
      revenue: number;
    }>;
  };
  message?: string;
}

@Injectable({
  providedIn: 'root',
})
export class AirlineService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    });
  }

  // Get airline flights
  getAirlineFlights(params?: {
    page?: number;
    limit?: number;
    status?: string;
  }): Observable<{
    success: boolean;
    data: { flights: Flight[] };
    message?: string;
  }> {
    let httpParams = new HttpParams();

    if (params) {
      if (params.page)
        httpParams = httpParams.set('page', params.page.toString());
      if (params.limit)
        httpParams = httpParams.set('limit', params.limit.toString());
      if (params.status) httpParams = httpParams.set('status', params.status);
    }

    return this.http.get<{
      success: boolean;
      data: { flights: Flight[] };
      message?: string;
    }>(`${this.apiUrl}/flights/airline/my`, {
      headers: this.getAuthHeaders(),
      params: httpParams,
    });
  }

  // Create new flight
  createFlight(flightData: CreateFlightRequest): Observable<{
    success: boolean;
    data: { flight: Flight };
    message?: string;
  }> {
    return this.http.post<{
      success: boolean;
      data: { flight: Flight };
      message?: string;
    }>(`${this.apiUrl}/flights`, flightData, {
      headers: this.getAuthHeaders(),
    });
  }

  // Update flight
  updateFlight(
    flightId: string,
    flightData: Partial<CreateFlightRequest>
  ): Observable<{
    success: boolean;
    data: { flight: Flight };
    message?: string;
  }> {
    return this.http.put<{
      success: boolean;
      data: { flight: Flight };
      message?: string;
    }>(`${this.apiUrl}/flights/${flightId}`, flightData, {
      headers: this.getAuthHeaders(),
    });
  }

  // Delete flight
  deleteFlight(
    flightId: string
  ): Observable<{ success: boolean; message?: string }> {
    return this.http.delete<{ success: boolean; message?: string }>(
      `${this.apiUrl}/flights/${flightId}`,
      {
        headers: this.getAuthHeaders(),
      }
    );
  }

  // Get airline aircraft
  getAirlineAircraft(): Observable<{
    success: boolean;
    data: { aircraft: any[] };
    message?: string;
  }> {
    return this.http.get<{
      success: boolean;
      data: { aircraft: any[] };
      message?: string;
    }>(`${this.apiUrl}/aircraft`, {
      headers: this.getAuthHeaders(),
    });
  }

  // Create new aircraft
  createAircraft(aircraftData: CreateAircraftRequest): Observable<{
    success: boolean;
    data: { aircraft: any };
    message?: string;
  }> {
    return this.http.post<{
      success: boolean;
      data: { aircraft: any };
      message?: string;
    }>(`${this.apiUrl}/aircraft`, aircraftData, {
      headers: this.getAuthHeaders(),
    });
  }

  // Get airline statistics
  getAirlineStats(): Observable<AirlineStatsResponse> {
    return this.http.get<AirlineStatsResponse>(
      `${this.apiUrl}/airlines/stats`,
      {
        headers: this.getAuthHeaders(),
      }
    );
  }

  // Get airline profile
  getAirlineProfile(): Observable<{
    success: boolean;
    data: { airline: AirlineInfo };
    message?: string;
  }> {
    return this.http.get<{
      success: boolean;
      data: { airline: AirlineInfo };
      message?: string;
    }>(`${this.apiUrl}/airlines/my/airline`, {
      headers: this.getAuthHeaders(),
    });
  }

  // New Statistics Methods
  getRevenueStats(period?: number): Observable<AirlineRevenueStats> {
    let httpParams = new HttpParams();
    if (period) httpParams = httpParams.set('period', period.toString());

    return this.http.get<AirlineRevenueStats>(
      `${this.apiUrl}/airlines/my/revenue-stats`,
      {
        headers: this.getAuthHeaders(),
        params: httpParams,
      }
    );
  }

  getPassengerStats(period?: number): Observable<PassengerStats> {
    let httpParams = new HttpParams();
    if (period) httpParams = httpParams.set('period', period.toString());

    return this.http.get<PassengerStats>(
      `${this.apiUrl}/airlines/my/passengers`,
      {
        headers: this.getAuthHeaders(),
        params: httpParams,
      }
    );
  }

  getPopularRoutes(
    period?: number,
    limit?: number
  ): Observable<PopularRoutesStats> {
    let httpParams = new HttpParams();
    if (period) httpParams = httpParams.set('period', period.toString());
    if (limit) httpParams = httpParams.set('limit', limit.toString());

    return this.http.get<PopularRoutesStats>(
      `${this.apiUrl}/airlines/my/popular-routes`,
      {
        headers: this.getAuthHeaders(),
        params: httpParams,
      }
    );
  }

  // General Statistics (for backwards compatibility)
  getGeneralStats(): Observable<AirlineStats> {
    return this.http.get<AirlineStats>(
      `${this.apiUrl}/airlines/my/statistics`,
      {
        headers: this.getAuthHeaders(),
      }
    );
  }

  // Route Management
  getAirlineRoutes(): Observable<{
    success: boolean;
    data: any[];
    count: number;
  }> {
    return this.http.get<{ success: boolean; data: any[]; count: number }>(
      `${this.apiUrl}/routes/airline`,
      {
        headers: this.getAuthHeaders(),
      }
    );
  }

  createRoute(
    routeData: any
  ): Observable<{ success: boolean; data: any; message?: string }> {
    return this.http.post<{ success: boolean; data: any; message?: string }>(
      `${this.apiUrl}/routes`,
      routeData,
      {
        headers: this.getAuthHeaders(),
      }
    );
  }

  updateRoute(
    routeId: string,
    routeData: any
  ): Observable<{ success: boolean; data: any; message?: string }> {
    return this.http.put<{ success: boolean; data: any; message?: string }>(
      `${this.apiUrl}/routes/${routeId}`,
      routeData,
      {
        headers: this.getAuthHeaders(),
      }
    );
  }

  deleteRoute(
    routeId: string
  ): Observable<{ success: boolean; message?: string }> {
    return this.http.delete<{ success: boolean; message?: string }>(
      `${this.apiUrl}/routes/${routeId}`,
      {
        headers: this.getAuthHeaders(),
      }
    );
  }
}
