import { Component, OnInit } from '@angular/core';
import { AdminService } from '../../../../services/admin.service';
import { AuthService } from '../../../../services/auth.service';
import { FlightService } from '../../../../services/flight.service';
import {
  AdminDashboardStats,
  SystemStats,
} from '../../../../models/admin.model';
import { Flight } from '../../../../models/flight.model';

@Component({
  selector: 'app-admin-dashboard',
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.scss'],
})
export class AdminDashboardComponent implements OnInit {
  dashboardStats: AdminDashboardStats | null = null;
  systemStats: SystemStats | null = null;
  flights: Flight[] = [];
  loading = false;
  error: string | null = null;

  // Quick stats properties for backward compatibility
  totalFlights = 0;
  activeFlights = 0;
  totalAirlines = 0;

  constructor(
    private adminService: AdminService,
    private authService: AuthService,
    private flightService: FlightService
  ) {}

  ngOnInit(): void {
    if (this.authService.isAdmin()) {
      this.loadDashboardData();
    } else {
      this.error = 'Accesso negato. Privilegi di amministratore richiesti.';
    }
  }

  loadDashboardData(): void {
    this.loading = true;
    this.error = null;

    // Load dashboard statistics
    this.adminService.getDashboardStats().subscribe({
      next: (response) => {
        if (response.success) {
          this.dashboardStats = response.data;
          // Update quick stats for backward compatibility
          this.totalFlights = response.data.totalFlights;
          this.activeFlights = response.data.activeFlights;
          this.totalAirlines = response.data.totalAirlines;
        }
      },
      error: (error) => {
        this.error = 'Errore nel caricamento delle statistiche';
        console.error('Error loading dashboard stats:', error);
      },
    });

    // Load system statistics
    this.adminService.getSystemStats().subscribe({
      next: (response) => {
        if (response.success) {
          this.systemStats = response.data;
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading system stats:', error);
        this.loading = false;
      },
    });

    // Load recent flights for display
    this.flightService.getAllFlights().subscribe({
      next: (response: any) => {
        if (response.success && response.data) {
          this.flights = response.data.flights || [];
        }
      },
      error: (error) => {
        console.error('Error loading flights:', error);
      },
    });
  }

  refreshData(): void {
    this.loadDashboardData();
  }

  exportUsers(): void {
    this.adminService.exportUsers('csv').subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `users-export-${
          new Date().toISOString().split('T')[0]
        }.csv`;
        link.click();
        window.URL.revokeObjectURL(url);
      },
      error: (error) => {
        console.error('Error exporting users:', error);
      },
    });
  }

  exportSystemReport(): void {
    this.adminService.exportSystemReport().subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `system-report-${
          new Date().toISOString().split('T')[0]
        }.pdf`;
        link.click();
        window.URL.revokeObjectURL(url);
      },
      error: (error) => {
        console.error('Error exporting system report:', error);
      },
    });
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
}
