import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { 
  Flight, 
  FlightSearchRequest, 
  FlightSearchResponse, 
  Airport, 
  Airline,
  AirportSearchResponse
} from '../models/flight.model';

@Injectable({
  providedIn: 'root'
})
export class FlightService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // Flight search (public endpoint)
  searchFlights(searchParams: FlightSearchRequest): Observable<FlightSearchResponse> {
    let params = new HttpParams()
      .set('origin', searchParams.departureAirport)
      .set('destination', searchParams.arrivalAirport)
      .set('departureDate', searchParams.departureDate)
      .set('passengers', searchParams.passengers.toString());

    if (searchParams.returnDate) {
      params = params.set('returnDate', searchParams.returnDate);
    }

    if (searchParams.class) {
      params = params.set('class', searchParams.class);
    }

    return this.http.get<FlightSearchResponse>(`${this.apiUrl}/flights/search`, { params });
  }

  // Get all flights (public endpoint)
  getAllFlights(): Observable<FlightSearchResponse> {
    return this.http.get<FlightSearchResponse>(`${this.apiUrl}/flights`);
  }

  // Get flight by ID (public endpoint)
  getFlightById(id: string): Observable<{ success: boolean; data: { flight: Flight }; message?: string }> {
    return this.http.get<{ success: boolean; data: { flight: Flight }; message?: string }>(`${this.apiUrl}/flights/${id}`);
  }

  // Get airports (public endpoint)
  getAirports(): Observable<AirportSearchResponse> {
    return this.http.get<AirportSearchResponse>(`${this.apiUrl}/airports`);
  }

  // Get airlines (public endpoint)
  getAirlines(): Observable<{ success: boolean; data: { airlines: Airline[] }; message?: string }> {
    return this.http.get<{ success: boolean; data: { airlines: Airline[] }; message?: string }>(`${this.apiUrl}/airlines`);
  }

  // Search airports by query
  searchAirports(query: string): Observable<AirportSearchResponse> {
    const params = new HttpParams().set('query', query);
    return this.http.get<AirportSearchResponse>(`${this.apiUrl}/airports/search`, { params });
  }

  // Get available dates for a specific month
  getAvailableDates(year: number, month: number, origin: string, destination: string, passengers: number = 1, seatClass: string = 'economy'): Observable<{ success: boolean; data: { year: number; month: number; availableDates: string[]; count: number }; message?: string }> {
    const params = new HttpParams()
      .set('origin', origin)
      .set('destination', destination)
      .set('passengers', passengers.toString())
      .set('seatClass', seatClass);
    
    return this.http.get<{ success: boolean; data: { year: number; month: number; availableDates: string[]; count: number }; message?: string }>(`${this.apiUrl}/flights/available-dates/${year}/${month}`, { params });
  }

  // Suggest alternative dates
  suggestAlternativeDates(origin: string, destination: string, targetDate: string, passengers: number = 1, seatClass: string = 'economy', daysBefore: number = 7, daysAfter: number = 7): Observable<{ success: boolean; data: { targetDate: string; suggestions: Array<{ date: string; daysDifference: number; flightCount: number; minPrice: number; reason: string }>; count: number }; message?: string }> {
    const params = new HttpParams()
      .set('origin', origin)
      .set('destination', destination)
      .set('targetDate', targetDate)
      .set('passengers', passengers.toString())
      .set('seatClass', seatClass)
      .set('daysBefore', daysBefore.toString())
      .set('daysAfter', daysAfter.toString());
    
    return this.http.get<{ success: boolean; data: { targetDate: string; suggestions: Array<{ date: string; daysDifference: number; flightCount: number; minPrice: number; reason: string }>; count: number }; message?: string }>(`${this.apiUrl}/flights/suggest-dates`, { params });
  }

  // Check availability for a specific date
  checkDateAvailability(origin: string, destination: string, date: string, passengers: number = 1, seatClass: string = 'economy'): Observable<{ success: boolean; data: { date: string; available: boolean; flightCount: number; minPrice?: number }; message?: string }> {
    const params = new HttpParams()
      .set('origin', origin)
      .set('destination', destination)
      .set('date', date)
      .set('passengers', passengers.toString())
      .set('seatClass', seatClass);
    
    return this.http.get<{ success: boolean; data: { date: string; available: boolean; flightCount: number; minPrice?: number }; message?: string }>(`${this.apiUrl}/flights/check-date`, { params });
  }

  // Utility methods
  formatDuration(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EUR'
    }).format(price);
  }

  getFlightStatus(flight: Flight): { color: string; text: string } {
    switch (flight.status) {
      case 'scheduled':
        return { color: 'primary', text: 'On Time' };
      case 'boarding':
        return { color: 'accent', text: 'Boarding' };
      case 'departed':
        return { color: 'warn', text: 'Departed' };
      case 'arrived':
        return { color: 'primary', text: 'Arrived' };
      case 'cancelled':
        return { color: 'warn', text: 'Cancelled' };
      case 'delayed':
        return { color: 'warn', text: 'Delayed' };
      default:
        return { color: 'primary', text: 'Unknown' };
    }
  }
}