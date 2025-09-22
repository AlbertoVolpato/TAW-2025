import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AirlineService } from '../../../../services/airline.service';

interface AirlineStatsData {
  summary: {
    totalPassengers: number;
    totalRevenue: number;
    totalFlights: number;
    totalBookings: number;
    averageRevenuePerFlight: number;
    averagePassengersPerFlight: number;
  };
  mostDemandedRoutes: any[];
  monthlyStatistics: any[];
  period: {
    startDate: string;
    endDate: string;
  };
}

interface AirlineStatsResponse {
  success: boolean;
  data: AirlineStatsData;
  message?: string;
}

@Component({
  selector: 'app-airline-dashboard',
  templateUrl: './airline-dashboard.component.html',
  styleUrls: ['./airline-dashboard.component.scss'],
})
export class AirlineDashboardComponent implements OnInit {
  isLoading = false;
  errorMessage = '';
  stats: AirlineStatsData | null = null;

  constructor(
    private router: Router,
    private airlineService: AirlineService
  ) {}

  ngOnInit(): void {
    this.loadStatistics();
  }

  loadStatistics(): void {
    this.isLoading = true;
    this.errorMessage = '';
    
    // Usa il metodo corretto dell'airline service
    this.airlineService.getGeneralStats().subscribe({
      next: (response: any) => { // Cast temporaneo
        this.isLoading = false;
        if (response.success) {
          this.stats = response.data;
          console.log('Stats loaded:', this.stats);
        } else {
          this.errorMessage = response.message || 'Errore nel caricamento delle statistiche';
        }
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Error loading stats:', error);
        this.errorMessage = 'Errore nel caricamento delle statistiche';
      },
    });
  }

  navigateToFlights() {
    this.router.navigate(['/airline/flights']);
  }

  navigateToRoutes() {
    this.router.navigate(['/airline/routes']);
  }

  getMaxRoutePassengers(): number {
    if (!this.stats?.mostDemandedRoutes || this.stats.mostDemandedRoutes.length === 0) {
      return 1;
    }
    return Math.max(...this.stats.mostDemandedRoutes.map(route => route.passengers || 0), 1);
  }
}
