import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Booking } from '../../../../models/booking.model';
import { BookingService } from '../../../../services/booking.service';
import { FlightService } from '../../../../services/flight.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-booking-detail',
  templateUrl: './booking-detail.component.html',
  styleUrls: ['./booking-detail.component.scss'],
})
export class BookingDetailComponent implements OnInit {
  booking: Booking | null = null;
  loading = false;
  error: string | null = null;
  bookingId: string;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private bookingService: BookingService,
    private flightService: FlightService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {
    this.bookingId = this.route.snapshot.params['id'];
  }

  ngOnInit(): void {
    this.loadBookingDetail();
  }

  loadBookingDetail(): void {
    this.loading = true;
    this.error = null;

    this.bookingService.getBookingById(this.bookingId).subscribe({
      next: (response) => {
        this.loading = false;
        console.log('Booking detail response:', response);
        if (response.success && response.data) {
          // Handle both possible response structures
          this.booking = response.data.booking || response.data;
        } else {
          this.error =
            response.message || 'Errore nel caricamento della prenotazione';
        }
      },
      error: (error) => {
        this.loading = false;
        console.error('Error loading booking detail:', error);
        this.error =
          error.error?.message || 'Errore nel caricamento della prenotazione';
      },
    });
  }

  onCheckIn(): void {
    if (!this.booking || this.booking.checkedIn) {
      return;
    }

    this.bookingService.checkIn(this.booking._id).subscribe({
      next: (response) => {
        if (response.success) {
          this.booking!.checkedIn = true;
          this.snackBar.open('Check-in completato con successo!', 'Chiudi', {
            duration: 3000,
            panelClass: ['success-snackbar'],
          });
        } else {
          this.snackBar.open(
            response.message || 'Errore durante il check-in',
            'Chiudi',
            {
              duration: 3000,
              panelClass: ['error-snackbar'],
            }
          );
        }
      },
      error: (error) => {
        console.error('Check-in error:', error);
        this.snackBar.open(
          error.error?.message || 'Errore durante il check-in',
          'Chiudi',
          {
            duration: 3000,
            panelClass: ['error-snackbar'],
          }
        );
      },
    });
  }

  onCancelBooking(): void {
    if (!this.booking || this.booking.status === 'cancelled') {
      return;
    }

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Conferma Cancellazione',
        message:
          'Sei sicuro di voler cancellare questa prenotazione? Questa azione non può essere annullata.',
        confirmText: 'Cancella',
        cancelText: 'Annulla',
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result && this.booking) {
        this.bookingService.cancelBooking(this.booking._id).subscribe({
          next: (response) => {
            if (response.success) {
              // Get refund amount from response
              const refundAmount =
                response.data?.refundAmount || this.booking!.totalPrice;

              // Show success message with refund info
              this.snackBar.open(
                `✅ Prenotazione cancellata! Rimborso di €${refundAmount} accreditato.`,
                'Chiudi',
                {
                  duration: 5000,
                  panelClass: ['success-snackbar'],
                }
              );

              // Navigate back to bookings list after a short delay
              setTimeout(() => {
                this.router.navigate(['/passenger/bookings']);
              }, 2000);
            } else {
              this.snackBar.open(
                response.message || 'Errore durante la cancellazione',
                'Chiudi',
                {
                  duration: 3000,
                  panelClass: ['error-snackbar'],
                }
              );
            }
          },
          error: (error) => {
            console.error('Cancel booking error:', error);
            this.snackBar.open(
              error.error?.message || 'Errore durante la cancellazione',
              'Chiudi',
              {
                duration: 3000,
                panelClass: ['error-snackbar'],
              }
            );
          },
        });
      }
    });
  }

  onDownloadBoardingPass(): void {
    if (!this.booking || !this.booking.checkedIn) {
      return;
    }

    // TODO: Implement boarding pass download when API is available
    this.snackBar.open("Funzionalità carta d'imbarco in arrivo", 'Chiudi', {
      duration: 3000,
      panelClass: ['info-snackbar'],
    });
  }

  goBack(): void {
    this.router.navigate(['/passenger/bookings']);
  }

  formatDuration(minutes: number): string {
    return this.flightService.formatDuration(minutes);
  }

  formatPrice(price: number): string {
    return this.flightService.formatPrice(price);
  }

  formatBookingReference(reference: string): string {
    return this.bookingService.formatBookingReference(reference);
  }

  getBookingStatusColor(status: string): string {
    return this.bookingService.getBookingStatusColor(status);
  }

  getBookingStatusText(status: string): string {
    return this.bookingService.getBookingStatusText(status);
  }

  getPaymentStatusColor(status: string | undefined): string {
    return this.bookingService.getPaymentStatusColor(status || 'pending');
  }

  getPaymentStatusText(status: string | undefined): string {
    return this.bookingService.getPaymentStatusText(status || 'pending');
  }

  canCheckIn(): boolean {
    if (
      !this.booking ||
      this.booking.checkedIn ||
      this.booking.status !== 'confirmed' ||
      this.booking.paymentStatus !== 'paid'
    ) {
      return false;
    }

    const flightTime = new Date(this.booking.flight.departureTime).getTime();
    const now = new Date().getTime();
    const hoursUntilFlight = (flightTime - now) / (1000 * 60 * 60);

    return hoursUntilFlight <= 24 && hoursUntilFlight > 2;
  }

  canCancel(): boolean {
    if (
      !this.booking ||
      this.booking.status === 'cancelled' ||
      this.booking.status === 'completed'
    ) {
      return false;
    }

    const flightTime = new Date(this.booking.flight.departureTime).getTime();
    const now = new Date().getTime();
    const hoursUntilFlight = (flightTime - now) / (1000 * 60 * 60);

    return hoursUntilFlight > 24;
  }
}

// Confirm Dialog Component (inline for simplicity)
@Component({
  selector: 'app-confirm-dialog',
  template: `
    <h2 mat-dialog-title>{{ data.title }}</h2>
    <mat-dialog-content>
      <p>{{ data.message }}</p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">{{ data.cancelText }}</button>
      <button mat-button color="warn" (click)="onConfirm()">
        {{ data.confirmText }}
      </button>
    </mat-dialog-actions>
  `,
})
export class ConfirmDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<ConfirmDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  onConfirm(): void {
    this.dialogRef.close(true);
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}

// Add missing imports
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Inject } from '@angular/core';
