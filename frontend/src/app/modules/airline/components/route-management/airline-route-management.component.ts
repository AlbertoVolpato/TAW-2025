import { Component, OnInit } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { RouteService } from '../../../../services/route.service';

interface AirlineRoute {
  _id: string;
  routeCode: string;
  departureAirport: {
    name: string;
    code?: string;
    city: string;
    country: string;
  };
  arrivalAirport: {
    name: string;
    code?: string;
    city: string;
    country: string;
  };
  distance: number;
  estimatedDuration: number;
  operatingDays: {
    monday: boolean;
    tuesday: boolean;
    wednesday: boolean;
    thursday: boolean;
    friday: boolean;
    saturday: boolean;
    sunday: boolean;
  };
  seasonality: {
    startDate: string;
    endDate: string;
  };
  isActive: boolean;
  createdAt: string;
}

@Component({
  selector: 'app-airline-route-management',
  templateUrl: './airline-route-management.component.html',
  styleUrls: ['./airline-route-management.component.scss'],
})
export class AirlineRouteManagementComponent implements OnInit {
  displayedColumns: string[] = [
    'routeCode',
    'route',
    'distance',
    'duration',
    'operatingDays',
    'seasonality',
    'status',
    'actions',
  ];
  dataSource = new MatTableDataSource<AirlineRoute>();

  isLoading = true;
  totalRoutes = 0;
  activeRoutes = 0;
  routes: AirlineRoute[] = [];
  errorMessage: string = '';

  // Dialog properties
  showRouteDialog = false;
  routeDialogData: any = { isEdit: false };

  constructor(private routeService: RouteService) {}

  ngOnInit(): void {
    this.loadRoutes();
  }

  loadRoutes(): void {
    this.isLoading = true;
    this.errorMessage = '';

    // Use airline-specific routes API
    this.routeService.getAirlineRoutes().subscribe({
      next: (response: any) => {
        if (response.success && response.data) {
          this.routes = response.data;
          this.dataSource.data = response.data;
          this.totalRoutes = response.data.length;
          this.activeRoutes = response.data.filter(
            (route: AirlineRoute) => route.isActive
          ).length;
          console.log(`Loaded ${response.data.length} routes for airline`);
        } else {
          console.error('Invalid API response structure:', response);
          this.errorMessage = 'Errore nel caricamento delle rotte';
        }
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('Error loading airline routes:', error);
        this.errorMessage = 'Errore nel caricamento delle rotte';
        this.isLoading = false;
      },
    });
  }

  getOperatingDaysText(operatingDays: any): string {
    if (!operatingDays) return 'N/A';

    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const dayKeys = [
      'monday',
      'tuesday',
      'wednesday',
      'thursday',
      'friday',
      'saturday',
      'sunday',
    ];

    const activeDays = dayKeys
      .filter((day) => operatingDays[day])
      .map((_, index) => days[index]);

    return activeDays.join(', ') || 'None';
  }

  getSeasonalityText(seasonality: any): string {
    if (!seasonality || !seasonality.startDate || !seasonality.endDate)
      return 'N/A';

    const start = new Date(seasonality.startDate).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
    });
    const end = new Date(seasonality.endDate).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
    });

    return `${start} - ${end}`;
  }

  addRoute(): void {
    this.routeDialogData = { isEdit: false };
    this.showRouteDialog = true;
  }

  createRoute(): void {
    // Redirect to create route page or open dialog
    this.addRoute();
  }

  getActiveRoutesCount(): number {
    return this.routes.filter((route) => route.isActive).length;
  }

  getInactiveRoutesCount(): number {
    return this.routes.filter((route) => !route.isActive).length;
  }

  formatDuration(minutes: number): string {
    if (!minutes) return 'N/A';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  }

  editRoute(route: AirlineRoute): void {
    this.routeDialogData = { route: route, isEdit: true };
    this.showRouteDialog = true;
  }

  deleteRoute(routeId: string): void {
    if (confirm('Are you sure you want to delete this route?')) {
      this.routeService.deleteAirlineRoute(routeId).subscribe({
        next: (response: any) => {
          if (response.success) {
            console.log('Route deleted successfully');
            this.loadRoutes(); // Reload the routes
          }
        },
        error: (error: any) => {
          console.error('Error deleting route:', error);
        },
      });
    }
  }

  onRouteDialogClosed(result: any): void {
    this.showRouteDialog = false;

    if (result) {
      // Reload routes after successful operation
      this.loadRoutes();
    }
  }

  toggleRouteStatus(route: AirlineRoute): void {
    const updateData = {
      isActive: !route.isActive,
    };

    this.routeService.updateAirlineRoute(route._id, updateData).subscribe({
      next: (response: any) => {
        if (response.success) {
          console.log('Route status updated successfully');
          this.loadRoutes(); // Reload the routes
        }
      },
      error: (error: any) => {
        console.error('Error updating route status:', error);
      },
    });
  }
}
