import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AdminService } from '../../../../services/admin.service';

@Component({
  selector: 'app-airline-invitation-dialog',
  templateUrl: './airline-invitation-dialog.component.html',
  styleUrls: ['./airline-invitation-dialog.component.scss'],
})
export class AirlineInvitationDialogComponent {
  @Input() isVisible = false;
  @Output() dialogClosed = new EventEmitter<boolean>();

  inviteForm: FormGroup;
  isSubmitting = false;
  showError = '';

  constructor(private fb: FormBuilder, private adminService: AdminService) {
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
      country: ['Italy', [Validators.required]], // Default value set to Italy
      contactEmail: ['', [Validators.email]],
      website: [''],
      message: [''],
    });
  }

  onSubmit(): void {
    if (this.inviteForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    this.isSubmitting = true;
    this.showError = '';

    const formData = {
      email: this.inviteForm.value.email,
      firstName: this.inviteForm.value.firstName,
      lastName: this.inviteForm.value.lastName,
      airlineName: this.inviteForm.value.airlineName,
      airlineCode: this.inviteForm.value.airlineCode.toUpperCase(),
      country: this.inviteForm.value.country,
      contactEmail:
        this.inviteForm.value.contactEmail || this.inviteForm.value.email,
      website: this.inviteForm.value.website,
      message: this.inviteForm.value.message,
    };

    this.adminService.createAirlineByInvitation(formData).subscribe({
      next: (response: any) => {
        this.isSubmitting = false;
        if (response.success) {
          // Reset form
          this.inviteForm.reset();
          this.dialogClosed.emit(true);
        }
      },
      error: (error: any) => {
        this.isSubmitting = false;
        this.showError =
          error.error?.message ||
          'Errore nella creazione della compagnia aerea';
        console.error('Error creating airline:', error);
      },
    });
  }

  onCancel(): void {
    this.inviteForm.reset();
    this.showError = '';
    this.dialogClosed.emit(false);
  }

  private markFormGroupTouched(): void {
    Object.keys(this.inviteForm.controls).forEach((field) => {
      const control = this.inviteForm.get(field);
      control?.markAsTouched({ onlySelf: true });
    });
  }
}
