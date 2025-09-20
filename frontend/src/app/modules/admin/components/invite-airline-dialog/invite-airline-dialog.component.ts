import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AdminService } from '../../../../services/admin.service';

@Component({
  selector: 'app-invite-airline-dialog',
  templateUrl: './invite-airline-dialog.component.html',
  styleUrls: ['./invite-airline-dialog.component.scss']
})
export class InviteAirlineDialogComponent {
  inviteForm: FormGroup;
  loading = false;

  constructor(
    private fb: FormBuilder,
    private adminService: AdminService,
    private snackBar: MatSnackBar,
    public dialogRef: MatDialogRef<InviteAirlineDialogComponent>,
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
          Validators.pattern(/^[A-Z]{2,3}$/),
          Validators.minLength(2),
          Validators.maxLength(3),
        ],
      ],
      country: ['Italy', Validators.required],
    });
  }

  onSubmit(): void {
    if (this.inviteForm.invalid) {
      this.markFormGroupTouched(this.inviteForm);
      return;
    }

    this.loading = true;

    const formData = {
      contactEmail: this.inviteForm.value.email,
      email: this.inviteForm.value.email,
      firstName: this.inviteForm.value.firstName,
      lastName: this.inviteForm.value.lastName,
      airlineName: this.inviteForm.value.airlineName,
      airlineCode: this.inviteForm.value.airlineCode,
      country: this.inviteForm.value.country,
    };

    this.adminService.createAirlineByInvitation(formData).subscribe({
      next: (response: any) => {
        this.loading = false;
        this.snackBar.open(
          'Invito inviato con successo! La compagnia riceverà una password temporanea.',
          'Chiudi',
          {
            duration: 5000,
            panelClass: ['success-snackbar']
          }
        );
        this.dialogRef.close(true);
      },
      error: (error: any) => {
        this.loading = false;
        console.error('Error inviting airline:', error);
        this.snackBar.open(
          error.error?.message || 'Errore durante l\'invio dell\'invito',
          'Chiudi',
          {
            duration: 5000,
            panelClass: ['error-snackbar']
          }
        );
      },
    });
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach((key) => {
      const control = formGroup.get(key);
      control?.markAsTouched();
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }
}