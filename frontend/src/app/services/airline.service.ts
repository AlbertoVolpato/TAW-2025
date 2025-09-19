import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Flight } from '../models/flight.model';

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
  providedIn: 'root'
})
export class AirlineService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // Get airline flights
  getAirlineFlights(params?: {
    page?: number;
    limit?: number;
    status?: string;
  }): Observable<{ success: boolean; data: { flights: Flight[] }; message?: string }> {
    let httpParams = new HttpParams();
    
    if (params) {
      if (params.page) httpParams = httpParams.set('page', params.page.toString());
      if (params.limit) httpParams = httpParams.set('limit', params.limit.toString());
      if (params.status) httpParams = httpParams.set('status', params.status);
    }

    return this.http.get<{ success: boolean; data: { flights: Flight[] }; message?: string }>(`${this.apiUrl}/flights/airline`, { params: httpParams });
  }

  // Create new flight
  createFlight(flightData: CreateFlightRequest): Observable<{ success: boolean; data: { flight: Flight }; message?: string }> {
    return this.http.post<{ success: boolean; data: { flight: Flight }; message?: string }>(`${this.apiUrl}/flights`, flightData);
  }

  // Update flight
  updateFlight(flightId: string, flightData: Partial<CreateFlightRequest>): Observable<{ success: boolean; data: { flight: Flight }; message?: string }> {
    return this.http.put<{ success: boolean; data: { flight: Flight }; message?: string }>(`${this.apiUrl}/flights/${flightId}`, flightData);
  }

  // Delete flight
  deleteFlight(flightId: string): Observable<{ success: boolean; message?: string }> {
    return this.http.delete<{ success: boolean; message?: string }>(`${this.apiUrl}/flights/${flightId}`);
  }

  // Get airline aircraft
  getAirlineAircraft(): Observable<{ success: boolean; data: { aircraft: any[] }; message?: string }> {
    return this.http.get<{ success: boolean; data: { aircraft: any[] }; message?: string }>(`${this.apiUrl}/aircraft/airline`);
  }

  // Create new aircraft
  createAircraft(aircraftData: CreateAircraftRequest): Observable<{ success: boolean; data: { aircraft: any }; message?: string }> {
    return this.http.post<{ success: boolean; data: { aircraft: any }; message?: string }>(`${this.apiUrl}/aircraft`, aircraftData);
  }

  // Get airline statistics
  getAirlineStats(): Observable<AirlineStatsResponse> {
    return this.http.get<AirlineStatsResponse>(`${this.apiUrl}/airlines/stats`);
  }

  // Get airline profile
  getAirlineProfile(): Observable<{ success: boolean; data: { airline: any }; message?: string }> {
    return this.http.get<{ success: boolean; data: { airline: any }; message?: string }>(`${this.apiUrl}/airlines/profile`);
  }
}