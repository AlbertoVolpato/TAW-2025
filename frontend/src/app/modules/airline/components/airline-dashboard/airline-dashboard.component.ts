import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AirlineService } from '../../../../services/airline.service';

interface DashboardStats {
  summary: {
    totalPassengers: number;
    totalRevenue: number;
    totalFlights: number;
    totalBookings: number;
    averageRevenuePerFlight: number;
    averagePassengersPerFlight: number;
  };
  mostDemandedRoutes: Array<{
    routeId: string;
    route: string;
    departureCode: string;
    arrivalCode: string;
    totalBookings: number;
    passengers: number;
    totalRevenue: number;
  }>;
  monthlyStatistics: any[];
  period: {
    startDate: string;
    endDate: string;
  };
}

@Component({
  selector: 'app-airline-dashboard',
  templateUrl: './airline-dashboard.component.html',
  styleUrls: ['./airline-dashboard.component.scss'],
})
export class AirlineDashboardComponent implements OnInit {
  isLoading = false;
  errorMessage = '';
  stats: DashboardStats | null = null;

  constructor(private router: Router, private airlineService: AirlineService) {}

  ngOnInit(): void {
    this.loadStatistics();
  }

  loadStatistics(): void {
    this.isLoading = true;
    this.errorMessage = '';

    console.log('Loading airline statistics...');

    this.airlineService.getAirlineStats().subscribe({
      next: (response) => {
        console.log('Statistics response:', response);

        if (response.success) {
          // The backend response already has the correct structure
          this.stats = response.data;
          console.log('Mapped stats:', this.stats);
        } else {
          this.errorMessage =
            response.message || 'Errore nel caricamento delle statistiche';
          console.error('Statistics failed:', response);
        }
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('Error loading statistics:', error);

        if (error.status === 403) {
          this.errorMessage =
            'Accesso negato. È necessario essere autenticati come compagnia aerea.';
        } else if (error.status === 404) {
          this.errorMessage =
            "Nessuna compagnia aerea trovata per l'utente corrente.";
        } else {
          this.errorMessage =
            'Errore nel caricamento delle statistiche. Controllare la connessione.';
        }

        this.isLoading = false;
      },
    });
  }

  getMaxRoutePassengers(): number {
    if (
      !this.stats?.mostDemandedRoutes ||
      this.stats.mostDemandedRoutes.length === 0
    ) {
      return 1;
    }
    return Math.max(
      ...this.stats.mostDemandedRoutes.map((route: any) => route.passengers)
    );
  }

  navigateToFlights() {
    this.router.navigate(['/airline/flights']);
  }

  navigateToRoutes() {
    this.router.navigate(['/airline/routes']);
  }
}
