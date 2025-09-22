import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../../services/auth.service';
import { User } from '../../../../models/user.model';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss'],
})
export class ProfileComponent implements OnInit {
  profileForm: FormGroup;
  currentUser: User | null = null;
  loading = false;
  error = '';
  success = '';
  isEditing = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.profileForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      email: [{ value: '', disabled: true }],
    });
  }

  ngOnInit(): void {
    this.loadUserProfile();
  }

  loadUserProfile(): void {
    this.loading = true;
    this.authService.getProfile().subscribe({
      next: (response) => {
        if (response.success && response.user) {
          this.currentUser = response.user;
          this.profileForm.patchValue({
            firstName: response.user.firstName,
            lastName: response.user.lastName,
            email: response.user.email,
          });
        }
        this.loading = false;
      },
      error: (error) => {
        this.error =
          error.error?.message || 'Errore nel caricamento del profilo';
        this.loading = false;
      },
    });
  }

  toggleEdit(): void {
    this.isEditing = !this.isEditing;
    if (!this.isEditing) {
      // Reset form to original values
      this.loadUserProfile();
    }
    this.error = '';
    this.success = '';
  }

  onSubmit(): void {
    if (this.profileForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    this.loading = true;
    this.error = '';
    this.success = '';

    const updateData = {
      firstName: this.profileForm.value.firstName,
      lastName: this.profileForm.value.lastName,
    };

    this.authService.updateProfile(updateData).subscribe({
      next: (response) => {
        if (response.success) {
          this.success = 'Profilo aggiornato con successo';
          this.isEditing = false;
          this.currentUser = response.user || this.currentUser;
        } else {
          this.error =
            response.message || "Errore nell'aggiornamento del profilo";
        }
        this.loading = false;
      },
      error: (error) => {
        this.error =
          error.error?.message || "Errore nell'aggiornamento del profilo";
        this.loading = false;
      },
    });
  }

  navigateToChangePassword(): void {
    this.router.navigate(['/change-password']);
  }

  navigateToBookings(): void {
    this.router.navigate(['/passenger/bookings']);
  }

  addFunds(): void {
    // Per ora mostra un messaggio, in futuro implementerà la ricarica del portafoglio
    alert('Funzionalità di ricarica del portafoglio non ancora disponibile');
  }

  logout(): void {
    this.authService.logout();
  }

  deleteAccount(): void {
    const confirmMessage = `⚠️ ATTENZIONE! ⚠️\n\nStai per eliminare definitivamente il tuo account.\n\nQuesta azione:\n• Cancellerà tutti i tuoi dati personali\n• Rimuoverà tutte le prenotazioni attive\n• Non può essere annullata\n\nSei SICURO di voler procedere?`;

    if (confirm(confirmMessage)) {
      const doubleConfirm = prompt(
        'Per confermare, scrivi "ELIMINA" (tutto maiuscolo):'
      );

      if (doubleConfirm === 'ELIMINA') {
        this.loading = true;
        this.authService.deleteAccount().subscribe({
          next: (response) => {
            if (response.success) {
              alert(
                '✅ Account eliminato con successo.\n\nGrazie per aver utilizzato i nostri servizi.'
              );
              this.authService.logout();
            } else {
              this.error =
                response.message ||
                "Errore durante l'eliminazione dell'account";
            }
            this.loading = false;
          },
          error: (error) => {
            this.error =
              error.error?.message ||
              "Errore durante l'eliminazione dell'account";
            this.loading = false;
          },
        });
      } else if (doubleConfirm !== null) {
        alert('❌ Testo non corretto. Operazione annullata per sicurezza.');
      }
    }
  }

  private markFormGroupTouched(): void {
    Object.keys(this.profileForm.controls).forEach((key) => {
      const control = this.profileForm.get(key);
      control?.markAsTouched();
    });
  }

  get f() {
    return this.profileForm.controls;
  }
}
