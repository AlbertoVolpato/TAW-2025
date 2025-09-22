import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AirlineService } from '../../../../services/airline.service';
import { AuthService } from '../../../../services/auth.service';
import { Flight } from '../../../../models/flight.model';
import {
  AirlineStats,
  AirlineRevenueStats,
  PopularRoutesStats,
} from '../../../../models/airline-stats.model';

@Component({
  selector: 'app-airline-dashboard',
  templateUrl: './airline-dashboard.component.html',
  styleUrls: ['./airline-dashboard.component.scss'],
})
export class AirlineDashboardComponent implements OnInit {
  flights: Flight[] = [];
  stats: AirlineStats | null = null;
  revenueStats: AirlineRevenueStats | null = null;
  popularRoutes: PopularRoutesStats[] = [];
  loading = false;
  error: string | null = null;

  // Properties for template compatibility
  totalFlights = 0;
  activeFlights = 0;
  todayFlights = 0;
  activeRoutes = 0;
  aircraftCount = 0;
  totalBookings = 0;
  recentFlights: Flight[] = [];
  errorMessage: string | null = null;
  isLoading = false;

  // Pagination properties
  currentPage = 1;
  pageSize = 10;
  itemsPerPage = 10; // Alias for template compatibility
  totalPages = 1;
  paginatedFlights: Flight[] = [];

  // Math for template
  Math = Math;

  constructor(
    private airlineService: AirlineService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    if (this.authService.isAirline()) {
      this.loadAirlineData();
    } else {
      this.error = 'Accesso negato. Privilegi di compagnia aerea richiesti.';
    }
  }

  loadAirlineData(): void {
    this.isLoading = true;
    this.loading = true;
    this.error = null;
    this.errorMessage = null;

    // Load routes to count active routes
    this.airlineService.getAirlineRoutes().subscribe({
      next: (response: any) => {
        if (response.success && response.data) {
          this.activeRoutes = response.data.filter(
            (route: any) => route.isActive
          ).length;
        }
      },
      error: (error: any) => {
        console.error('Error loading routes:', error);
      },
    });

    // Load flights (this gives us the real flight count)
    this.airlineService.getAirlineFlights().subscribe({
      next: (response: any) => {
        if (response.success) {
          this.recentFlights = response.data || [];
          // Use actual flights length instead of summary stats
          this.totalFlights = this.recentFlights.length;
        }
        this.isLoading = false;
        this.loading = false;
      },
      error: (error: any) => {
        console.error('Error loading flights:', error);
        this.isLoading = false;
        this.loading = false;
      },
    });

    // Load bookings stats (keep this for bookings count)
    this.airlineService.getGeneralStats().subscribe({
      next: (response: any) => {
        console.log('Stats response:', response); // Debug log
        if (response.success && response.data) {
          this.stats = response.data;
          // Access summary properties correctly
          const summary = response.data.summary || {};
          this.totalBookings = summary.totalBookings || 0;
        }
      },
      error: (error: any) => {
        console.error('Error loading stats:', error);
        this.errorMessage = 'Error loading statistics';
      },
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
      },
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
      },
    });
  }

  updatePagination(): void {
    this.totalPages = Math.ceil(this.flights.length / this.pageSize);
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.paginatedFlights = this.flights.slice(startIndex, endIndex);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePagination();
    }
  }

  nextPage(): void {
    this.goToPage(this.currentPage + 1);
  }

  previousPage(): void {
    this.goToPage(this.currentPage - 1);
  }

  createFlight(): void {
    // Navigate to flight creation page
    console.log('Navigate to create flight');
    // this.router.navigate(['/airline/flights/create']);
  }

  manageRoutes(): void {
    // Navigate to route management page
    console.log('Navigate to manage routes');
    // this.router.navigate(['/airline/routes']);
  }

  editFlight(flight: Flight): void {
    // Navigate to flight edit page
    console.log('Edit flight:', flight.flightNumber);
    // this.router.navigate(['/airline/flights/edit', flight._id]);
  }

  deleteFlight(flight: Flight): void {
    if (
      confirm(`Sei sicuro di voler eliminare il volo ${flight.flightNumber}?`)
    ) {
      this.loading = true;
      this.error = null;

      this.airlineService.deleteFlight(flight._id).subscribe({
        next: (response: any) => {
          if (response.success) {
            // Remove flight from local array
            this.flights = this.flights.filter((f) => f._id !== flight._id);
            this.updatePagination();
            // If current page is empty and not the first page, go to previous page
            if (this.paginatedFlights.length === 0 && this.currentPage > 1) {
              this.previousPage();
            }
          }
          this.loading = false;
        },
        error: (error: any) => {
          this.error = "Errore nell'eliminazione del volo";
          this.loading = false;
          console.error('Error deleting flight:', error);
        },
      });
    }
  }

  getFlightStatusColor(status: string): string {
    const statusColors: { [key: string]: string } = {
      scheduled: 'primary',
      boarding: 'accent',
      departed: 'warn',
      arrived: 'primary',
      cancelled: 'warn',
      delayed: 'accent',
    };
    return statusColors[status] || 'primary';
  }

  getFlightStatusText(status: string): string {
    const statusTexts: { [key: string]: string } = {
      scheduled: 'Programmato',
      boarding: 'Imbarco',
      departed: 'Partito',
      arrived: 'Arrivato',
      cancelled: 'Cancellato',
      delayed: 'Ritardato',
    };
    return statusTexts[status] || status;
  }

  refreshData(): void {
    this.loadAirlineData();
  }

  navigateToRoutes(): void {
    this.router.navigate(['/airline/routes']);
  }

  navigateToFlights(): void {
    this.router.navigate(['/airline/flights']);
  }
}
