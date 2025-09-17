import { Component, OnInit } from '@angular/core';
import { FlightService } from '../../../../services/flight.service';
import { AuthService } from '../../../../services/auth.service';
import { Flight, Airline } from '../../../../models/flight.model';

@Component({
  selector: 'app-admin-dashboard',
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.scss']
})
export class AdminDashboardComponent implements OnInit {
  flights: Flight[] = [];
  airlines: Airline[] = [];
  loading = false;
  error: string | null = null;

  // Statistics
  totalFlights = 0;
  totalAirlines = 0;
  activeFlights = 0;

  constructor(
    private flightService: FlightService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    this.loading = true;
    this.error = null;

    // Load flights
    this.flightService.getAllFlights().subscribe({
      next: (response: any) => {
        if (response.success && response.data) {
          this.flights = response.data.flights || [];
          this.totalFlights = this.flights.length;
          this.activeFlights = this.flights.filter(f => f.status === 'scheduled').length;
        }
      },
      error: (error: any) => {
        this.error = 'Errore nel caricamento dei voli';
        console.error('Error loading flights:', error);
      }
    });

    // Load airlines
    this.flightService.getAirlines().subscribe({
      next: (response: any) => {
        if (response.success && response.data) {
          this.airlines = response.data.airlines || [];
          this.totalAirlines = this.airlines.length;
        }
        this.loading = false;
      },
      error: (error: any) => {
        this.error = 'Errore nel caricamento delle compagnie aeree';
        this.loading = false;
        console.error('Error loading airlines:', error);
      }
    });
  }

  getFlightStatusColor(status: string): string {
    const statusColors: { [key: string]: string } = {
      'scheduled': 'primary',
      'boarding': 'accent',
      'departed': 'warn',
      'arrived': 'primary',
      'cancelled': 'warn',
      'delayed': 'accent'
    };
    return statusColors[status] || 'primary';
  }

  getFlightStatusText(status: string): string {
    const statusTexts: { [key: string]: string } = {
      'scheduled': 'Programmato',
      'boarding': 'Imbarco',
      'departed': 'Partito',
      'arrived': 'Arrivato',
      'cancelled': 'Cancellato',
      'delayed': 'Ritardato'
    };
    return statusTexts[status] || status;
  }
}