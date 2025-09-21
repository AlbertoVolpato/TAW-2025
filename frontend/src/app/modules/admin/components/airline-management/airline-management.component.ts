import { Component, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AdminService } from '../../../../services/admin.service';
import { FlightService } from '../../../../services/flight.service';
import { Airline as BaseAirline } from '../../../../models/flight.model';

export interface AirlineDetails extends BaseAirline {
  website?: string;
  contactEmail: string;
  contactPhone?: string;
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
  airlines: AirlineDetails[] = [];
  filteredAirlines: AirlineDetails[] = [];
  displayedAirlines: AirlineDetails[] = [];
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
    private flightService: FlightService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadAirlines();
  }

  loadAirlines(): void {
    this.loading = true;
    this.error = null;

    this.flightService.getAirlines().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          // The API response actually contains all required fields
          this.airlines = response.data.airlines as AirlineDetails[];
          this.applyFiltersAndPagination();
        }
        this.loading = false;
      },
      error: (error: any) => {
        this.error =
          error.error?.message ||
          'Errore nel caricamento delle compagnie aeree';
        this.loading = false;
        console.error('Error loading airlines:', error);
      },
    });
  }

  applyFiltersAndPagination(): void {
    // Start with all airlines
    this.filteredAirlines = [...this.airlines];

    // Apply search filter
    if (this.searchTerm) {
      this.filteredAirlines = this.filteredAirlines.filter(
        (airline) =>
          airline.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
          airline.code.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
          airline.country
            .toLowerCase()
            .includes(this.searchTerm.toLowerCase()) ||
          airline.contactEmail
            .toLowerCase()
            .includes(this.searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (this.selectedStatus) {
      const isActive = this.selectedStatus === 'active';
      this.filteredAirlines = this.filteredAirlines.filter(
        (airline) => airline.isActive === isActive
      );
    }

    // Apply country filter
    if (this.selectedCountry) {
      this.filteredAirlines = this.filteredAirlines.filter((airline) =>
        airline.country
          .toLowerCase()
          .includes(this.selectedCountry.toLowerCase())
      );
    }

    // Update totals based on filtered results
    this.totalAirlines = this.filteredAirlines.length;
    this.totalPages = Math.ceil(this.totalAirlines / this.pageSize);

    // Reset to page 1 if current page is beyond available pages
    if (this.currentPage > this.totalPages && this.totalPages > 0) {
      this.currentPage = 1;
    }

    // Apply pagination
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.displayedAirlines = this.filteredAirlines.slice(startIndex, endIndex);
  }

  openInviteDialog(): void {
    this.showInviteDialog = true;
  }

  onInviteDialogClosed(success: boolean): void {
    this.showInviteDialog = false;
    if (success) {
      this.loadAirlines(); // Reload all data when new airline is added
    }
  }

  onSearch(event: any): void {
    const searchTerm = event.target.value;
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      this.searchTerm = searchTerm;
      this.currentPage = 1; // Reset to first page when searching
      this.applyFiltersAndPagination();
    }, 300);
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.applyFiltersAndPagination();
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.applyFiltersAndPagination();
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
    this.currentPage = 1; // Reset to first page
    this.applyFiltersAndPagination();
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.selectedCountry = '';
    this.selectedStatus = '';
    this.currentPage = 1;
    this.applyFiltersAndPagination();
  }

  toggleAirlineStatus(airline: AirlineDetails): void {
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

  getStatusColor(isActive: boolean): string {
    return isActive ? 'success' : 'warn';
  }

  getStatusText(isActive: boolean): string {
    return isActive ? 'Attiva' : 'Inattiva';
  }
}
