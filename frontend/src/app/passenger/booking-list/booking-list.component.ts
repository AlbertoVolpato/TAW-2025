import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { BookingService } from '../../services/booking.service';
import { Booking } from '../../models/booking.model';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-booking-list',
  templateUrl: './booking-list.component.html',
  styleUrls: ['./booking-list.component.scss']
})
export class BookingListComponent implements OnInit {
  bookings: Booking[] = [];
  loading = false;
  error: string | null = null;
  
  // Pagination
  currentPage = 1;
  pageSize = 10;
  totalBookings = 0;
  totalPages = 0;
  
  // Filters
  selectedStatus = '';
  statusOptions = [
    { value: '', label: 'All Bookings' },
    { value: 'pending', label: 'Pending' },
    { value: 'confirmed', label: 'Confirmed' },
    { value: 'cancelled', label: 'Cancelled' },
    { value: 'completed', label: 'Completed' }
  ];

  constructor(
    private bookingService: BookingService,
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadBookings();
  }

  loadBookings(): void {
    this.loading = true;
    this.error = null;

    this.bookingService.getUserBookings(this.currentPage, this.pageSize, this.selectedStatus || undefined)
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.bookings = response.data.bookings;
            if (response.data.pagination) {
              this.totalBookings = response.data.pagination.total;
              this.totalPages = response.data.pagination.pages;
            } else {
              this.totalBookings = response.data.count || 0;
              this.totalPages = Math.ceil(this.totalBookings / this.pageSize);
            }
          } else {
            this.error = response.message || 'Failed to load bookings';
          }
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading bookings:', error);
          this.error = 'Failed to load bookings. Please try again.';
          this.loading = false;
          
          if (error.status === 401) {
            this.authService.logout();
            this.router.navigate(['/auth/login']);
          }
        }
      });
  }

  onStatusFilterChange(): void {
    this.currentPage = 1;
    this.loadBookings();
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadBookings();
  }

  viewBookingDetails(booking: Booking): void {
    this.router.navigate(['/passenger/booking', booking._id]);
  }

  checkIn(booking: Booking): void {
    if (booking.status !== 'confirmed') {
      this.snackBar.open('Only confirmed bookings can be checked in', 'Close', {
        duration: 3000,
        panelClass: ['error-snackbar']
      });
      return;
    }

    if (booking.checkedIn) {
      this.snackBar.open('You have already checked in for this flight', 'Close', {
        duration: 3000,
        panelClass: ['info-snackbar']
      });
      return;
    }

    this.bookingService.checkIn(booking._id).subscribe({
      next: (response) => {
        if (response.success) {
          this.snackBar.open('Check-in successful!', 'Close', {
            duration: 3000,
            panelClass: ['success-snackbar']
          });
          this.loadBookings(); // Refresh the list
        } else {
          this.snackBar.open(response.message || 'Check-in failed', 'Close', {
            duration: 3000,
            panelClass: ['error-snackbar']
          });
        }
      },
      error: (error) => {
        console.error('Check-in error:', error);
        this.snackBar.open(
          error.error?.message || 'Check-in failed. Please try again.',
          'Close',
          {
            duration: 3000,
            panelClass: ['error-snackbar']
          }
        );
      }
    });
  }

  cancelBooking(booking: Booking): void {
    if (booking.status === 'cancelled') {
      this.snackBar.open('Booking is already cancelled', 'Close', {
        duration: 3000,
        panelClass: ['info-snackbar']
      });
      return;
    }

    if (booking.status === 'completed') {
      this.snackBar.open('Cannot cancel completed booking', 'Close', {
        duration: 3000,
        panelClass: ['error-snackbar']
      });
      return;
    }

    const dialogRef = this.dialog.open(CancelBookingDialogComponent, {
      width: '400px',
      data: { booking }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.bookingService.cancelBooking(booking._id, result.reason).subscribe({
          next: (response) => {
            if (response.success) {
              this.snackBar.open('Booking cancelled successfully', 'Close', {
                duration: 3000,
                panelClass: ['success-snackbar']
              });
              this.loadBookings(); // Refresh the list
            } else {
              this.snackBar.open(response.message || 'Cancellation failed', 'Close', {
                duration: 3000,
                panelClass: ['error-snackbar']
              });
            }
          },
          error: (error) => {
            console.error('Cancellation error:', error);
            this.snackBar.open(
              error.error?.message || 'Cancellation failed. Please try again.',
              'Close',
              {
                duration: 3000,
                panelClass: ['error-snackbar']
              }
            );
          }
        });
      }
    });
  }

  getStatusColor(status: string): string {
    return this.bookingService.getBookingStatusColor(status);
  }

  getStatusText(status: string): string {
    return this.bookingService.getBookingStatusText(status);
  }

  getPaymentStatusColor(status: string | undefined): string {
    if (!status) return 'basic';
    return this.bookingService.getPaymentStatusColor(status);
  }

  getPaymentStatusText(status: string | undefined): string {
    if (!status) return 'Unknown';
    return this.bookingService.getPaymentStatusText(status);
  }

  formatBookingReference(reference: string): string {
    return this.bookingService.formatBookingReference(reference);
  }

  canCheckIn(booking: Booking): boolean {
    if (booking.status !== 'confirmed' || booking.checkedIn) {
      return false;
    }

    // Check if check-in is available (24 hours before departure)
    const departureTime = new Date(booking.flight.departureTime);
    const now = new Date();
    const timeDiff = departureTime.getTime() - now.getTime();
    const hoursDiff = timeDiff / (1000 * 3600);

    return hoursDiff <= 24 && hoursDiff > 0;
  }

  canCancel(booking: Booking): boolean {
    return booking.status !== 'cancelled' && booking.status !== 'completed';
  }

  getFlightRoute(booking: Booking): string {
    if (booking.flight) {
      // Assuming flight has origin and destination info
      return `Flight ${booking.flight.flightNumber}`;
    }
    return 'Route information not available';
  }

  getDepartureInfo(booking: Booking): string {
    if (booking.flight) {
      const date = new Date(booking.flight.departureTime).toLocaleDateString();
      const time = new Date(booking.flight.departureTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      return `${date} at ${time}`;
    }
    return 'Departure information not available';
  }

  getPassengerCount(booking: Booking): number {
    return booking.passengers?.length || 0;
  }

  getTotalPrice(booking: Booking): number {
    return booking.pricing?.totalPrice || booking.totalPrice || 0;
  }
}

// Cancel Booking Dialog Component
import { Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-cancel-booking-dialog',
  template: `
    <h2 mat-dialog-title>Cancel Booking</h2>
    <mat-dialog-content>
      <p>Are you sure you want to cancel this booking?</p>
      <p><strong>Booking Reference:</strong> {{ data.booking.bookingReference }}</p>
      <p><strong>Flight:</strong> {{ getFlightInfo() }}</p>
      
      <form [formGroup]="cancelForm">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Reason for cancellation (optional)</mat-label>
          <textarea matInput formControlName="reason" rows="3" placeholder="Please provide a reason for cancellation"></textarea>
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">Keep Booking</button>
      <button mat-raised-button color="warn" (click)="onConfirm()">Cancel Booking</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .full-width {
      width: 100%;
    }
  `]
})
export class CancelBookingDialogComponent {
  cancelForm: FormGroup;

  constructor(
    public dialogRef: MatDialogRef<CancelBookingDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { booking: Booking },
    private fb: FormBuilder
  ) {
    this.cancelForm = this.fb.group({
      reason: ['', [Validators.maxLength(500)]]
    });
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onConfirm(): void {
    this.dialogRef.close({
      reason: this.cancelForm.get('reason')?.value || ''
    });
  }

  getFlightInfo(): string {
    const booking = this.data.booking;
    if (booking.flight) {
      return `Flight ${booking.flight.flightNumber}`;
    }
    return 'Flight information not available';
  }
}