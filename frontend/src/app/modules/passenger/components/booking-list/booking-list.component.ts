import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Booking } from '../../../../models/booking.model';
import { BookingService } from '../../../../services/booking.service';
import { FlightService } from '../../../../services/flight.service';

@Component({
  selector: 'app-booking-list',
  templateUrl: './booking-list.component.html',
  styleUrls: ['./booking-list.component.scss'],
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

    console.log('Loading bookings...');

    this.bookingService.getUserBookings().subscribe({
      next: (response) => {
        this.loading = false;
        console.log('Bookings response:', response);
        if (response.success) {
          this.bookings = response.data?.bookings || [];
          console.log('Loaded bookings:', this.bookings);
        } else {
          this.error =
            response.message || 'Errore nel caricamento delle prenotazioni';
        }
      },
      error: (error) => {
        this.loading = false;
        console.error('Error loading bookings:', error);

        // Better error handling to avoid showing MongoDB/technical errors to users
        let userFriendlyError = 'Errore nel caricamento delle prenotazioni';

        if (error.status === 0) {
          userFriendlyError = 'Impossibile connettersi al server';
        } else if (error.status === 401) {
          userFriendlyError = 'Sessione scaduta, effettua il login';
        } else if (error.status === 404) {
          userFriendlyError = 'Servizio non disponibile';
        } else if (error.status >= 500) {
          userFriendlyError = 'Errore interno del server, riprova più tardi';
        } else if (
          error.error?.message &&
          !error.error.message.includes('StrictPopulateError') &&
          !error.error.message.includes('Cannot populate')
        ) {
          userFriendlyError = error.error.message;
        }

        this.error = userFriendlyError;
      },
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
      },
    });
  }

  onCancelBooking(booking: Booking): void {
    if (booking.status === 'cancelled' || booking.status === 'completed') {
      return;
    }

    const totalPrice = booking.pricing?.totalPrice || booking.totalPrice || 0;
    const confirmMessage = `Sei sicuro di voler cancellare questa prenotazione?\n\nRiceverai un rimborso di €${totalPrice} nel tuo portafoglio virtuale.`;

    if (confirm(confirmMessage)) {
      this.bookingService.cancelBooking(booking._id).subscribe({
        next: (response) => {
          if (response.success) {
            // Remove the booking from the list completely
            this.bookings = this.bookings.filter((b) => b._id !== booking._id);

            // Show success message with refund info
            const refundAmount = response.data?.refundAmount || totalPrice;

            // Create a more professional modal-style notification
            const successMessage = `✅ Prenotazione cancellata con successo!\n\n💰 Rimborso di €${refundAmount} aggiunto al tuo portafoglio virtuale.\n\n📧 Riceverai una conferma via email a breve.`;
            alert(successMessage);
          } else {
            this.error = response.message || 'Errore durante la cancellazione';
          }
        },
        error: (error) => {
          console.error('Cancel booking error:', error);
          this.error =
            error.error?.message || 'Errore durante la cancellazione';
        },
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
    if (
      booking.checkedIn ||
      booking.status !== 'confirmed' ||
      (booking.payment?.status !== 'completed' &&
        booking.paymentStatus !== 'paid')
    ) {
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
