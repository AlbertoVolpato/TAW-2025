import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AdminService } from '../../../../services/admin.service';
import { AirlineInvitationDialogComponent } from '../airline-invitation-dialog/airline-invitation-dialog.component';

export interface Airline {
  _id: string;
  name: string;
  code: string;
  country: string;
  website?: string;
  contactEmail: string;
  contactPhone?: string;
  isActive: boolean;
  userId: {
    _id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

@Component({
  selector: 'app-airline-management',
  templateUrl: './airline-management.component.html',
  styleUrls: ['./airline-management.component.scss'],
})
export class AirlineManagementComponent implements OnInit {
  airlines: Airline[] = [];
  loading = false;
  error: string | null = null;

  // Search and filtering
  searchTerm = '';
  selectedCountry = '';
  selectedStatus = '';
  searchTimeout: any;

  // Table columns
  displayedColumns: string[] = [
    'code',
    'name',
    'country',
    'contactEmail',
    'isActive',
    'createdAt',
    'actions',
  ];

  // Pagination
  currentPage = 1;
  pageSize = 10;
  totalAirlines = 0;

  constructor(
    private adminService: AdminService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadAirlines();
  }

  loadAirlines(): void {
    this.loading = true;
    this.error = null;

    // For now, we'll use a placeholder. In a real implementation,
    // you'd have a dedicated airline management API
    this.adminService.getAllUsers({ role: 'airline' }).subscribe({
      next: (response: any) => {
        if (response.success && response.data) {
          // Transform users to show airline information
          this.airlines = response.data.users
            .filter((user: any) => user.airline)
            .map((user: any) => ({
              _id: user.airline._id,
              name: user.airline.name,
              code: user.airline.code,
              country: user.airline.country || 'N/A',
              contactEmail: user.email,
              isActive: user.isActive,
              userId: {
                _id: user._id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
              },
              createdAt: user.createdAt,
              updatedAt: user.updatedAt,
            }));
          this.totalAirlines = this.airlines.length;
        }
        this.loading = false;
      },
      error: (error: any) => {
        this.error =
          error.error?.message || 'Errore nel caricamento delle compagnie';
        this.loading = false;
        console.error('Error loading airlines:', error);
      },
    });
  }

  openInviteDialog(): void {
    const dialogRef = this.dialog.open(AirlineInvitationDialogComponent, {
      width: '700px',
      maxWidth: '90vw',
      disableClose: false,
      autoFocus: true,
      panelClass: 'airline-invitation-dialog-container',
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.loadAirlines();
      }
    });
  }

  onSearch(event: any): void {
    const searchTerm = event.target.value;
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      this.searchTerm = searchTerm;
      this.loadAirlines();
    }, 300);
  }

  onFilterChange(): void {
    this.loadAirlines();
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.selectedCountry = '';
    this.selectedStatus = '';
    this.loadAirlines();
  }

  toggleAirlineStatus(airline: Airline): void {
    // This would call an airline-specific toggle endpoint
    this.snackBar.open(
      `Funzionalità in sviluppo: Toggle status per ${airline.name}`,
      'Chiudi',
      { duration: 3000 }
    );
  }

  viewAirlineDetails(airline: Airline): void {
    this.snackBar.open(
      `Funzionalità in sviluppo: Dettagli per ${airline.name}`,
      'Chiudi',
      { duration: 3000 }
    );
  }

  getStatusColor(isActive: boolean): string {
    return isActive ? 'success' : 'warn';
  }

  getStatusText(isActive: boolean): string {
    return isActive ? 'Attiva' : 'Inattiva';
  }
}
