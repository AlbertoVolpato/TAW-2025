import { Component, OnInit } from '@angular/core';
import { FlightService } from '../../../../services/flight.service';
import { AuthService } from '../../../../services/auth.service';
import { Flight } from '../../../../models/flight.model';

@Component({
  selector: 'app-airline-dashboard',
  templateUrl: './airline-dashboard.component.html',
  styleUrls: ['./airline-dashboard.component.scss']
})
export class AirlineDashboardComponent implements OnInit {
  flights: Flight[] = [];
  loading = false;
  error: string | null = null;

  // Statistics
  totalFlights = 0;
  activeFlights = 0;
  todayFlights = 0;

  constructor(
    private flightService: FlightService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadAirlineData();
  }

  loadAirlineData(): void {
    this.loading = true;
    this.error = null;

    // Load airline flights
    this.flightService.getAllFlights().subscribe({
      next: (response: any) => {
        if (response.success && response.data) {
          // Filter flights for current airline (in a real app, this would be done server-side)
          this.flights = response.data.flights || [];
          this.totalFlights = this.flights.length;
          this.activeFlights = this.flights.filter(f => f.status === 'scheduled').length;
          
          // Calculate today's flights
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const tomorrow = new Date(today);
          tomorrow.setDate(tomorrow.getDate() + 1);
          
          this.todayFlights = this.flights.filter(f => {
            const flightDate = new Date(f.departureTime);
            return flightDate >= today && flightDate < tomorrow;
          }).length;
        }
        this.loading = false;
      },
      error: (error: any) => {
        this.error = 'Errore nel caricamento dei dati';
        this.loading = false;
        console.error('Error loading airline data:', error);
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