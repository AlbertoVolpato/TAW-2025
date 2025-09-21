import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AdminService } from '../../../../services/admin.service';
import { AuthService } from '../../../../services/auth.service';
import { User } from '../../../../models/user.model';
import { AirlineInvitationDialogComponent } from '../airline-invitation-dialog/airline-invitation-dialog.component';

@Component({
  selector: 'app-user-management',
  templateUrl: './user-management.component.html',
  styleUrls: ['./user-management.component.scss'],
})
export class UserManagementComponent implements OnInit {
  users: User[] = [];
  loading = false;
  error: string | null = null;

  // Search and filtering
  searchTerm = '';
  selectedRole = '';
  selectedStatus = '';
  searchTimeout: any;

  // Table columns
  displayedColumns: string[] = [
    'email',
    'role',
    'isActive',
    'walletBalance',
    'createdAt',
    'actions',
  ];

  // Pagination
  currentPage = 1;
  pageSize = 10;
  totalUsers = 0;
  totalPages = 0;

  // Expose Math for template
  Math = Math;

  constructor(
    private adminService: AdminService,
    private authService: AuthService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    if (this.authService.isAdmin()) {
      this.loadUsers();
    } else {
      this.error = 'Accesso negato. Privilegi di amministratore richiesti.';
    }
  }

  loadUsers(): void {
    this.loading = true;
    this.error = null;

    const params: any = {
      page: this.currentPage,
      limit: this.pageSize,
      excludeRole: 'airline', // Exclude airline users from user management
    };

    // Add filters if set
    if (this.searchTerm) {
      params.search = this.searchTerm;
    }
    if (this.selectedRole) {
      params.role = this.selectedRole;
    }
    if (this.selectedStatus) {
      params.active = this.selectedStatus === 'active';
    }

    this.adminService.getAllUsers(params).subscribe({
      next: (response: any) => {
        if (response.success && response.data) {
          this.users = response.data.users;
          this.totalUsers = response.data.pagination.total;
          this.totalPages = response.data.pagination.pages;
        }
        this.loading = false;
      },
      error: (error: any) => {
        this.error =
          error.error?.message || 'Errore nel caricamento degli utenti';
        this.loading = false;
        console.error('Error loading users:', error);
      },
    });
  }

  onSearchChange(): void {
    // Debounce search to avoid too many API calls
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      this.currentPage = 1; // Reset to first page
      this.loadUsers();
    }, 500);
  }

  onFilterChange(): void {
    this.currentPage = 1; // Reset to first page
    this.loadUsers();
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.selectedRole = '';
    this.selectedStatus = '';
    this.currentPage = 1;
    this.loadUsers();
  }

  openInviteAirlineDialog(): void {
    const dialogRef = this.dialog.open(AirlineInvitationDialogComponent, {
      width: '700px',
      maxWidth: '90vw',
      disableClose: false,
      autoFocus: true,
      panelClass: 'airline-invitation-dialog-container',
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        // Dialog was closed with success, reload users list
        this.loadUsers();
      }
    });
  }

  deleteUser(user: User): void {
    if (user.role === 'admin') {
      this.error = 'Non è possibile eliminare un amministratore';
      return;
    }

    if (confirm(`Sei sicuro di voler eliminare l'utente ${user.email}?`)) {
      this.loading = true;
      this.error = null;

      this.adminService.deleteUser(user._id).subscribe({
        next: (response: any) => {
          if (response.success) {
            this.snackBar.open('Utente eliminato con successo', 'Chiudi', {
              duration: 3000,
            });
            this.loadUsers(); // Reload users list
          }
          this.loading = false;
        },
        error: (error: any) => {
          this.error =
            error.error?.message || "Errore nell'eliminazione dell'utente";
          this.loading = false;
          console.error('Error deleting user:', error);
        },
      });
    }
  }

  toggleUserStatus(user: User): void {
    if (user.role === 'admin') {
      this.error = 'Non è possibile modificare lo stato di un amministratore';
      return;
    }

    this.loading = true;
    this.error = null;

    this.adminService.toggleUserStatus(user._id).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.snackBar.open(
            response.message || 'Stato utente modificato con successo',
            'Chiudi',
            { duration: 3000 }
          );
          this.loadUsers(); // Reload users list
        }
        this.loading = false;
      },
      error: (error: any) => {
        this.error =
          error.error?.message || 'Errore nella modifica dello stato utente';
        this.loading = false;
        console.error('Error toggling user status:', error);
      },
    });
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadUsers();
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

  editUser(user: User): void {
    // TODO: Implementare dialog per editing utente
    this.snackBar.open('Funzionalità di editing in sviluppo', 'Chiudi', {
      duration: 3000,
    });
  }

  getRoleText(role: string): string {
    const roleTexts: { [key: string]: string } = {
      admin: 'Amministratore',
      airline: 'Compagnia Aerea',
      passenger: 'Passeggero',
    };
    return roleTexts[role] || role;
  }

  getRoleColor(role: string): string {
    const roleColors: { [key: string]: string } = {
      admin: 'warn',
      airline: 'accent',
      passenger: 'primary',
    };
    return roleColors[role] || 'primary';
  }
}
