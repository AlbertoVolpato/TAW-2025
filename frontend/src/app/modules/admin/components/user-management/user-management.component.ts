import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { AuthService } from '../../../../services/auth.service';
import { User } from '../../../../models/user.model';

@Component({
  selector: 'app-user-management',
  templateUrl: './user-management.component.html',
  styleUrls: ['./user-management.component.scss']
})
export class UserManagementComponent implements OnInit {
  users: User[] = [];
  loading = false;
  error: string | null = null;
  
  // Forms
  inviteAirlineForm: FormGroup;
  showInviteForm = false;

  // Table columns
  displayedColumns: string[] = ['email', 'firstName', 'lastName', 'role', 'isActive', 'actions'];

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private dialog: MatDialog
  ) {
    this.inviteAirlineForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      airlineName: ['', [Validators.required, Validators.minLength(2)]],
      airlineCode: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(3)]]
    });
  }

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.loading = true;
    this.error = null;

    // In a real implementation, this would call a user management service
    // For now, we'll simulate the functionality
    this.authService.getProfile().subscribe({
      next: (response: any) => {
        // This is a placeholder - in reality you'd have a proper user management endpoint
        this.users = [
          {
            _id: '1',
            email: 'admin@flightbooking.com',
            firstName: 'Admin',
            lastName: 'User',
            role: 'admin',
            isActive: true,
            isEmailVerified: true,
            mustChangePassword: false,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ];
        this.loading = false;
      },
      error: (error: any) => {
        this.error = 'Errore nel caricamento degli utenti';
        this.loading = false;
        console.error('Error loading users:', error);
      }
    });
  }

  toggleInviteForm(): void {
    this.showInviteForm = !this.showInviteForm;
    if (!this.showInviteForm) {
      this.inviteAirlineForm.reset();
    }
  }

  onInviteAirline(): void {
    if (this.inviteAirlineForm.invalid) {
      this.markFormGroupTouched(this.inviteAirlineForm);
      return;
    }

    this.loading = true;
    const formData = this.inviteAirlineForm.value;

    // In a real implementation, this would call an API to create the airline user
    console.log('Inviting airline:', formData);
    
    // Simulate API call
    setTimeout(() => {
      this.loading = false;
      this.showInviteForm = false;
      this.inviteAirlineForm.reset();
      
      // Add the new airline user to the list (simulation)
      const newUser: User = {
        _id: Date.now().toString(),
        email: formData.email,
        firstName: formData.firstName,
        lastName: formData.lastName,
        role: 'airline',
        isActive: true,
        isEmailVerified: false,
        mustChangePassword: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      this.users.push(newUser);
    }, 1000);
  }

  deleteUser(user: User): void {
    if (user.role === 'admin') {
      this.error = 'Non è possibile eliminare un amministratore';
      return;
    }

    if (confirm(`Sei sicuro di voler eliminare l'utente ${user.email}?`)) {
      this.loading = true;
      
      // In a real implementation, this would call an API to delete the user
      console.log('Deleting user:', user);
      
      // Simulate API call
      setTimeout(() => {
        this.users = this.users.filter(u => u._id !== user._id);
        this.loading = false;
      }, 500);
    }
  }

  toggleUserStatus(user: User): void {
    this.loading = true;
    
    // In a real implementation, this would call an API to toggle user status
    console.log('Toggling user status:', user);
    
    // Simulate API call
    setTimeout(() => {
      user.isActive = !user.isActive;
      this.loading = false;
    }, 500);
  }

  getRoleText(role: string): string {
    const roleTexts: { [key: string]: string } = {
      'admin': 'Amministratore',
      'airline': 'Compagnia Aerea',
      'passenger': 'Passeggero'
    };
    return roleTexts[role] || role;
  }

  getRoleColor(role: string): string {
    const roleColors: { [key: string]: string } = {
      'admin': 'warn',
      'airline': 'accent',
      'passenger': 'primary'
    };
    return roleColors[role] || 'primary';
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }
}