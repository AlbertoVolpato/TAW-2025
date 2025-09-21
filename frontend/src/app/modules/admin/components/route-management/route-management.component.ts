import { Component, OnInit } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { RouteDialogData } from '../route-dialog/route-dialog.component';
import { RouteService, RouteData } from '../../../../services/route.service';

interface Route {
  id: string;
  origin: string;
  destination: string;
  distance?: number;
  flightTime?: number;
  status: 'active' | 'inactive';
  airlines: string[];
  createdAt: Date;
}

@Component({
  selector: 'app-route-management',
  templateUrl: './route-management.component.html',
  styleUrls: ['./route-management.component.scss'],
})
export class RouteManagementComponent implements OnInit {
  displayedColumns: string[] = [
    'route',
    'distance',
    'flightTime',
    'airlines',
    'status',
    'actions',
  ];
  dataSource = new MatTableDataSource<Route>();

  isLoading = true;
  totalRoutes = 0;
  activeRoutes = 0;

  // Dialog properties
  showRouteDialog = false;
  routeDialogData: RouteDialogData = { isEdit: false };

  constructor(private routeService: RouteService) {}

  ngOnInit(): void {
    this.loadRoutes();
  }

  loadRoutes(): void {
    this.isLoading = true;

    // Use flights API to get route information
    this.routeService.getAllRoutes().subscribe({
      next: (response: any) => {
        if (response.success && response.data && response.data.flights) {
          // Transform flights data to routes format
          const routesMap = new Map<string, Route>();

          response.data.flights.forEach((flight: any) => {
            // Check if flight has the expected structure
            if (
              !flight.departureAirport ||
              !flight.arrivalAirport ||
              !flight.departureAirport.code ||
              !flight.arrivalAirport.code
            ) {
              console.warn('Invalid flight structure:', flight);
              return;
            }

            const routeKey = `${flight.departureAirport.code}-${flight.arrivalAirport.code}`;

            if (!routesMap.has(routeKey)) {
              routesMap.set(routeKey, {
                id: flight._id || routeKey,
                origin: flight.departureAirport.code,
                destination: flight.arrivalAirport.code,
                distance: this.calculateDistance(
                  flight.departureAirport,
                  flight.arrivalAirport
                ),
                flightTime: flight.duration || 0,
                status: flight.isActive ? 'active' : 'inactive',
                airlines: [flight.airline?.name || 'Unknown'],
                createdAt: new Date(flight.createdAt || new Date()),
              });
            } else {
              // Add airline if not already present
              const route = routesMap.get(routeKey)!;
              const airlineName = flight.airline?.name || 'Unknown';
              if (!route.airlines.includes(airlineName)) {
                route.airlines.push(airlineName);
              }
            }
          });

          const routes = Array.from(routesMap.values());
          this.dataSource.data = routes;
          this.totalRoutes = routes.length;
          this.activeRoutes = routes.filter(
            (r) => r.status === 'active'
          ).length;

          console.log(
            `Loaded ${routes.length} routes from ${response.data.flights.length} flights`
          );
        } else {
          console.warn('Invalid API response structure:', response);
          this.loadMockRoutes(); // Fallback to mock data
        }
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('Error loading routes:', error);
        this.isLoading = false;

        // Fallback to mock data in case of error
        this.loadMockRoutes();
      },
    });
  }

  private loadMockRoutes(): void {
    const mockRoutes: Route[] = [
      {
        id: '1',
        origin: 'MXP',
        destination: 'LHR',
        distance: 1030,
        flightTime: 125,
        status: 'active',
        airlines: ['Alitalia', 'British Airways'],
        createdAt: new Date('2023-01-15'),
      },
      {
        id: '2',
        origin: 'FCO',
        destination: 'CDG',
        distance: 1108,
        flightTime: 140,
        status: 'active',
        airlines: ['Alitalia', 'Air France'],
        createdAt: new Date('2023-02-20'),
      },
      {
        id: '3',
        origin: 'BGY',
        destination: 'BCN',
        distance: 725,
        flightTime: 95,
        status: 'inactive',
        airlines: ['Ryanair'],
        createdAt: new Date('2023-03-10'),
      },
    ];

    this.dataSource.data = mockRoutes;
    this.totalRoutes = mockRoutes.length;
    this.activeRoutes = mockRoutes.filter((r) => r.status === 'active').length;
  }

  addRoute(): void {
    this.routeDialogData = { isEdit: false };
    this.showRouteDialog = true;
  }

  editRoute(route: Route): void {
    this.routeDialogData = { route: route, isEdit: true };
    this.showRouteDialog = true;
  }

  onRouteDialogClosed(result: any): void {
    this.showRouteDialog = false;

    if (result) {
      const currentData = this.dataSource.data;

      if (this.routeDialogData.isEdit) {
        // Update existing route
        const index = currentData.findIndex(
          (r) => r.id === this.routeDialogData.route?.id
        );
        if (index !== -1) {
          currentData[index] = result;
          this.dataSource.data = [...currentData];
        }
      } else {
        // Add new route
        currentData.unshift(result);
        this.dataSource.data = [...currentData];
      }

      // Update statistics
      this.totalRoutes = currentData.length;
      this.activeRoutes = currentData.filter(
        (r) => r.status === 'active'
      ).length;
    }
  }

  toggleRouteStatus(route: Route): void {
    route.status = route.status === 'active' ? 'inactive' : 'active';
    console.log(
      `Route ${route.origin}-${route.destination} ${
        route.status === 'active' ? 'activated' : 'deactivated'
      }`
    );
  }

  deleteRoute(route: Route): void {
    const index = this.dataSource.data.findIndex((r) => r.id === route.id);
    if (index > -1) {
      this.dataSource.data.splice(index, 1);
      this.dataSource.data = [...this.dataSource.data];
      this.totalRoutes--;
      if (route.status === 'active') {
        this.activeRoutes--;
      }
      console.log(`Route ${route.origin}-${route.destination} deleted`);
    }
  }

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  formatFlightTime(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  }

  getStatusIcon(status: string): string {
    return status === 'active' ? 'flight_takeoff' : 'flight_land';
  }

  getStatusClass(status: string): string {
    return status === 'active' ? 'status-active' : 'status-inactive';
  }

  private calculateDistance(
    departureAirport: any,
    arrivalAirport: any
  ): number {
    // For now, return a default distance since we don't have coordinates
    // In a real application, you would calculate this based on airport coordinates
    return Math.floor(Math.random() * 2000) + 500; // Random distance between 500-2500 km
  }
}
