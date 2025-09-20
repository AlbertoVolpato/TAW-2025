import { Component, OnInit } from '@angular/core';
import { AirlineService } from '../../../../services/airline.service';
import { AuthService } from '../../../../services/auth.service';
import { Flight } from '../../../../models/flight.model';
import { AirlineStats, AirlineRevenueStats, PopularRoutesStats } from '../../../../models/airline-stats.model';

@Component({
  selector: 'app-airline-dashboard',
  templateUrl: './airline-dashboard.component.html',
  styleUrls: ['./airline-dashboard.component.scss']
})
export class AirlineDashboardComponent implements OnInit {
  flights: Flight[] = [];
  stats: AirlineStats | null = null;
  revenueStats: AirlineRevenueStats | null = null;
  popularRoutes: PopularRoutesStats[] = [];
  loading = false;
  error: string | null = null;

  constructor(
    private airlineService: AirlineService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    if (this.authService.isAirline()) {
      this.loadDashboardData();
    } else {
      this.error = 'Accesso negato. Privilegi di compagnia aerea richiesti.';
    }
  }

  loadDashboardData(): void {
    this.loading = true;
    this.error = null;

        // Load airline statistics  
    this.airlineService.getGeneralStats().subscribe({
      next: (response: any) => {
        if (response.success) {
          this.stats = response.data;
        }
      },
      error: (error: any) => {
        console.error('Error loading stats:', error);
      }
    });

    // Load revenue statistics
    this.airlineService.getRevenueStats().subscribe({
      next: (response: any) => {
        if (response.success) {
          this.revenueStats = response.data;
        }
      },
      error: (error: any) => {
        console.error('Error loading revenue stats:', error);
      }
    });

    // Load popular routes
    this.airlineService.getPopularRoutes().subscribe({
      next: (response: any) => {
        if (response.success) {
          this.popularRoutes = response.data;
        }
      },
      error: (error: any) => {
        console.error('Error loading popular routes:', error);
      }
    });

    // Load recent flights for display
    this.airlineService.getAirlineFlights({ limit: 10 }).subscribe({
  }

  refreshData(): void {
    this.loadDashboardData();
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