import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Booking } from '../../../../models/booking.model';
import { BookingService } from '../../../../services/booking.service';
import { FlightService } from '../../../../services/flight.service';

@Component({
  selector: 'app-booking-list',
  templateUrl: './booking-list.component.html',
  styleUrls: ['./booking-list.component.scss']
})
export class BookingListComponent implements OnInit {
  bookings: Booking[] = [];
  loading = false;
  error: string | null = null;

  constructor(
    private bookingService: BookingService,
    private flightService: FlightService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadBookings();
  }

  loadBookings(): void {
    this.loading = true;
    this.error = null;

    this.bookingService.getUserBookings().subscribe({
      next: (response) => {
        this.loading = false;
        if (response.success) {
          this.bookings = response.data.bookings || [];
        } else {
          this.error = response.message || 'Errore nel caricamento delle prenotazioni';
        }
      },
      error: (error) => {
        this.loading = false;
        console.error('Error loading bookings:', error);
        this.error = error.error?.message || 'Errore nel caricamento delle prenotazioni';
      }
    });
  }

  onViewBooking(booking: Booking): void {
    this.router.navigate(['/passenger/booking', booking._id]);
  }

  onCheckIn(booking: Booking): void {
    if (booking.checkedIn) {
      return;
    }

    this.bookingService.checkIn(booking._id).subscribe({
      next: (response) => {
        if (response.success) {
          booking.checkedIn = true;
          // Show success message or navigate to boarding pass
        } else {
          this.error = response.message || 'Errore durante il check-in';
        }
      },
      error: (error) => {
        console.error('Check-in error:', error);
        this.error = error.error?.message || 'Errore durante il check-in';
      }
    });
  }

  onCancelBooking(booking: Booking): void {
    if (booking.status === 'cancelled' || booking.status === 'completed') {
      return;
    }

    if (confirm('Sei sicuro di voler cancellare questa prenotazione?')) {
      this.bookingService.cancelBooking(booking._id).subscribe({
        next: (response) => {
          if (response.success) {
            booking.status = 'cancelled';
          } else {
            this.error = response.message || 'Errore durante la cancellazione';
          }
        },
        error: (error) => {
          console.error('Cancel booking error:', error);
          this.error = error.error?.message || 'Errore durante la cancellazione';
        }
      });
    }
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

  canCheckIn(booking: Booking): boolean {
    if (booking.checkedIn || booking.status !== 'confirmed' || booking.paymentStatus !== 'paid') {
      return false;
    }

    // Check if flight is within 24 hours
    const flightTime = new Date(booking.flight.departureTime).getTime();
    const now = new Date().getTime();
    const hoursUntilFlight = (flightTime - now) / (1000 * 60 * 60);

    return hoursUntilFlight <= 24 && hoursUntilFlight > 2;
  }

  canCancel(booking: Booking): boolean {
    if (booking.status === 'cancelled' || booking.status === 'completed') {
      return false;
    }

    // Check if flight is more than 24 hours away
    const flightTime = new Date(booking.flight.departureTime).getTime();
    const now = new Date().getTime();
    const hoursUntilFlight = (flightTime - now) / (1000 * 60 * 60);

    return hoursUntilFlight > 24;
  }

  trackByBookingId(index: number, booking: Booking): string {
    return booking._id;
  }
}