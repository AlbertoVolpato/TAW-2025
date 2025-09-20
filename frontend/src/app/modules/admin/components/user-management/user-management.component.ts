import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AdminService } from '../../../../services/admin.service';
import { AuthService } from '../../../../services/auth.service';
import { User } from '../../../../models/user.model';

@Component({
  selector: 'app-user-management',
  templateUrl: './user-management.component.html',
  styleUrls: ['./user-management.component.scss'],
})
export class UserManagementComponent implements OnInit {
  users: User[] = [];
  loading = false;
  error: string | null = null;

  // Forms
  inviteAirlineForm: FormGroup;
  showInviteForm = false;

  // Table columns
  displayedColumns: string[] = [
    'email',
    'firstName',
    'lastName',
    'role',
    'isActive',
    'actions',
  ];

  // Pagination
  currentPage = 1;
  pageSize = 10;
  totalUsers = 0;
  totalPages = 0;

  constructor(
    private fb: FormBuilder,
    private adminService: AdminService,
    private authService: AuthService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {
    this.inviteAirlineForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      airlineName: ['', [Validators.required, Validators.minLength(2)]],
      airlineCode: [
        '',
        [Validators.required, Validators.minLength(2), Validators.maxLength(3)],
      ],
      country: ['Italy'],
    });
  }

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

    this.adminService
      .getAllUsers({
        page: this.currentPage,
        limit: this.pageSize,
      })
      .subscribe({
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

  toggleInviteForm(): void {
    this.showInviteForm = !this.showInviteForm;
    this.error = null;
    if (!this.showInviteForm) {
      this.inviteAirlineForm.reset();
      this.inviteAirlineForm.patchValue({ country: 'Italy' });
    }
  }

  onInviteAirline(): void {
    if (this.inviteAirlineForm.invalid) {
      this.markFormGroupTouched(this.inviteAirlineForm);
      return;
    }

    this.loading = true;
    this.error = null;

    const formData = {
      email: this.inviteAirlineForm.value.email,
      firstName: this.inviteAirlineForm.value.firstName,
      lastName: this.inviteAirlineForm.value.lastName,
      airlineName: this.inviteAirlineForm.value.airlineName,
      airlineCode: this.inviteAirlineForm.value.airlineCode,
      country: this.inviteAirlineForm.value.country,
    };

    this.adminService.createAirlineByInvitation(formData).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.snackBar.open(
            `Compagnia aerea creata con successo! Password temporanea: ${response.data.temporaryPassword}`,
            'Chiudi',
            { duration: 10000 }
          );
          this.showInviteForm = false;
          this.inviteAirlineForm.reset();
          this.inviteAirlineForm.patchValue({ country: 'Italy' });
          this.loadUsers(); // Reload users list
        }
        this.loading = false;
      },
      error: (error: any) => {
        this.error =
          error.error?.message ||
          'Errore nella creazione della compagnia aerea';
        this.loading = false;
        console.error('Error creating airline:', error);
      },
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

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach((key) => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }
}
