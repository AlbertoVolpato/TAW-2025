import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AdminService } from '../../../../services/admin.service';

@Component({
  selector: 'app-airline-invitation-dialog',
  templateUrl: './airline-invitation-dialog.component.html',
  styleUrls: ['./airline-invitation-dialog.component.scss'],
})
export class AirlineInvitationDialogComponent {
  inviteForm: FormGroup;
  loading = false;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<AirlineInvitationDialogComponent>,
    private adminService: AdminService,
    private snackBar: MatSnackBar,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.inviteForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      airlineName: ['', [Validators.required, Validators.minLength(2)]],
      airlineCode: [
        '',
        [
          Validators.required,
          Validators.minLength(2),
          Validators.maxLength(3),
          Validators.pattern(/^[A-Z]{2,3}$/),
        ],
      ],
      country: ['Italy', [Validators.required]],
      contactEmail: ['', [Validators.email]],
    });
  }

  onSubmit(): void {
    if (this.inviteForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    this.loading = true;

    const formData = {
      email: this.inviteForm.value.email,
      firstName: this.inviteForm.value.firstName,
      lastName: this.inviteForm.value.lastName,
      airlineName: this.inviteForm.value.airlineName,
      airlineCode: this.inviteForm.value.airlineCode,
      country: this.inviteForm.value.country,
      contactEmail:
        this.inviteForm.value.contactEmail || this.inviteForm.value.email,
    };

    this.adminService.createAirlineByInvitation(formData).subscribe({
      next: (response: any) => {
        this.loading = false;
        if (response.success) {
          this.snackBar.open(
            `Compagnia aerea ${formData.airlineName} creata con successo!`,
            'Chiudi',
            {
              duration: 5000,
              panelClass: ['success-snackbar'],
            }
          );
          this.dialogRef.close(true);
        }
      },
      error: (error: any) => {
        this.loading = false;
        const errorMessage =
          error.error?.message ||
          'Errore nella creazione della compagnia aerea';
        this.snackBar.open(errorMessage, 'Chiudi', {
          duration: 5000,
          panelClass: ['error-snackbar'],
        });
        console.error('Error creating airline:', error);
      },
    });
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }

  private markFormGroupTouched(): void {
    Object.keys(this.inviteForm.controls).forEach((field) => {
      const control = this.inviteForm.get(field);
      control?.markAsTouched({ onlySelf: true });
    });
  }
}
