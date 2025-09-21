import { Component, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AdminService } from '../../../../services/admin.service';

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
  showInviteDialog = false;

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
  totalPages = 0;

  // Expose Math for template
  Math = Math;

  constructor(
    private adminService: AdminService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadAirlines();
  }

  loadAirlines(): void {
    this.loading = true;
    this.error = null;

    // Build query parameters for pagination and search
    const params: any = {
      page: this.currentPage,
      limit: this.pageSize,
      role: 'airline',
    };

    if (this.searchTerm) {
      params.search = this.searchTerm;
    }

    this.adminService.getAllUsers(params).subscribe({
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

          // Update pagination info
          if (response.data.pagination) {
            this.totalAirlines = response.data.pagination.total;
            this.totalPages = response.data.pagination.pages;
          } else {
            this.totalAirlines = this.airlines.length;
            this.totalPages = 1;
          }
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
    this.showInviteDialog = true;
  }

  onInviteDialogClosed(success: boolean): void {
    this.showInviteDialog = false;
    if (success) {
      this.loadAirlines();
    }
  }

  onSearch(event: any): void {
    const searchTerm = event.target.value;
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      this.searchTerm = searchTerm;
      this.currentPage = 1; // Reset to first page
      this.loadAirlines();
    }, 300);
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadAirlines();
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.onPageChange(page);
    }
  }

  getVisiblePages(): number[] {
    const visiblePages: number[] = [];
    const maxVisible = 5; // Show max 5 page numbers
    let start = Math.max(1, this.currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(this.totalPages, start + maxVisible - 1);

    // Adjust start if we're near the end
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }

    for (let i = start; i <= end; i++) {
      visiblePages.push(i);
    }

    return visiblePages;
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
    this.adminService.toggleUserStatus(airline.userId._id).subscribe({
      next: (response: any) => {
        if (response.success) {
          airline.isActive = !airline.isActive;
          this.snackBar.open(
            `${airline.name} ${
              airline.isActive ? 'attivata' : 'disattivata'
            } con successo`,
            'Chiudi',
            { duration: 3000 }
          );
        } else {
          this.snackBar.open(
            response.message || 'Errore nel cambio di stato',
            'Chiudi',
            { duration: 3000 }
          );
        }
      },
      error: (error: any) => {
        this.snackBar.open(
          error.error?.message || 'Errore nel cambio di stato',
          'Chiudi',
          { duration: 3000 }
        );
      },
    });
  }

  viewAirlineDetails(airline: Airline): void {
    // Per ora mostriamo i dettagli in una snackbar,
    // in futuro si può implementare un dialog con più dettagli
    const details = [
      `Nome: ${airline.name}`,
      `Codice: ${airline.code}`,
      `Paese: ${airline.country}`,
      `Email: ${airline.contactEmail}`,
      `Status: ${airline.isActive ? 'Attiva' : 'Inattiva'}`,
      `Registrata: ${new Date(airline.createdAt).toLocaleDateString()}`,
    ].join('\n');

    this.snackBar.open(details, 'Chiudi', {
      duration: 8000,
      panelClass: ['multiline-snackbar'],
    });
  }

  getStatusColor(isActive: boolean): string {
    return isActive ? 'success' : 'warn';
  }

  getStatusText(isActive: boolean): string {
    return isActive ? 'Attiva' : 'Inattiva';
  }
}
