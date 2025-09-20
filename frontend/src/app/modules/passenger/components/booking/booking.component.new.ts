import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { Flight } from '../../../../models/flight.model';
import {
  Booking,
  BookingRequest,
  SeatMap,
} from '../../../../models/booking.model';
import { FlightService } from '../../../../services/flight.service';
import { BookingService } from '../../../../services/booking.service';
import { AuthService } from '../../../../services/auth.service';

@Component({
  selector: 'app-booking',
  templateUrl: './booking.component.html',
  styleUrls: ['./booking.component.scss'],
})
export class BookingComponent implements OnInit {
  flight: Flight | null = null;
  seatMap: SeatMap | null = null;

  // Forms
  passengersForm!: FormGroup;

  // State
  loading = false;
  error: string | null = null;
  currentStep = 0;
  selectedSeats: string[] = [];
  totalPrice = 0;
  basePrice = 0;

  // Virtual wallet
  walletBalance = 2000;
  bookingConfirmation: any = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private flightService: FlightService,
    private bookingService: BookingService,
    private authService: AuthService
  ) {
    this.initializeForms();
  }

  ngOnInit(): void {
    const pathFlightId = this.route.snapshot.paramMap.get('flightId');
    const queryFlightId = this.route.snapshot.queryParamMap.get('flightId');
    const flightId = pathFlightId || queryFlightId;

    const passengers = parseInt(
      this.route.snapshot.queryParamMap.get('passengers') || '1'
    );

    console.log('BookingComponent ngOnInit:', {
      pathFlightId,
      queryFlightId,
      flightId,
      passengers,
    });

    if (flightId) {
      this.loadFlight(flightId);
      this.setupPassengersForm(passengers);
    } else {
      console.error('No flightId found in path or query params');
      this.router.navigate(['/flights/search']);
    }
  }

  private initializeForms(): void {
    this.passengersForm = this.fb.group({
      passengers: this.fb.array([]),
    });
  }

  private setupPassengersForm(count: number): void {
    const passengersArray = this.passengersForm.get('passengers') as FormArray;
    passengersArray.clear();

    for (let i = 0; i < count; i++) {
      passengersArray.push(this.createPassengerForm());
    }

    this.selectedSeats = new Array(count).fill('');
  }

  private createPassengerForm(): FormGroup {
    return this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      dateOfBirth: ['', Validators.required],
      gender: ['', Validators.required],
      documentNumber: ['', [Validators.required, Validators.minLength(5)]],
      email: ['', [Validators.required, Validators.email]],
    });
  }

  private loadFlight(flightId: string): void {
    this.loading = true;
    this.error = null;

    this.flightService.getFlightById(flightId).subscribe({
      next: (response) => {
        console.log('Flight loaded:', response);
        if (response.success && response.data) {
          this.flight = response.data;
          this.basePrice = this.flight.basePrice?.economy || 0;
          this.calculateTotalPrice();
          this.loadSeatMap();
        } else {
          this.error = 'Volo non trovato';
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading flight:', error);
        this.error = 'Errore durante il caricamento del volo';
        this.loading = false;
      },
    });
  }

  private loadSeatMap(): void {
    if (!this.flight) return;

    // Generate a simple seat map for demonstration
    const seats = [];
    const rows = 30;
    const seatsPerRow = ['A', 'B', 'C', 'D', 'E', 'F'];

    for (let row = 1; row <= rows; row++) {
      for (const letter of seatsPerRow) {
        seats.push({
          seatNumber: `${row}${letter}`,
          class: 'economy',
          isAvailable: Math.random() > 0.3, // 70% availability
          price: this.basePrice + Math.floor(Math.random() * 50),
        });
      }
    }

    this.seatMap = {
      aircraft: this.flight.aircraft || { model: 'Boeing 737', capacity: 180 },
      seats: seats,
    };
  }

  getPassengersArray(): FormArray {
    return this.passengersForm.get('passengers') as FormArray;
  }

  getMaxBirthDate(): string {
    const today = new Date();
    today.setFullYear(today.getFullYear() - 18);
    return today.toISOString().split('T')[0];
  }

  // Step navigation
  nextStep(): void {
    if (this.currentStep < 3) {
      this.currentStep++;
    }
  }

  previousStep(): void {
    if (this.currentStep > 0) {
      this.currentStep--;
    }
  }

  // Seat selection
  selectSeat(seat: any): void {
    if (!seat.isAvailable) return;

    const seatNumber = seat.seatNumber;
    const passengerIndex = this.selectedSeats.findIndex((s) => s === '');

    if (this.isSelected(seatNumber)) {
      // Deselect seat
      const index = this.selectedSeats.indexOf(seatNumber);
      if (index > -1) {
        this.selectedSeats[index] = '';
      }
    } else if (passengerIndex !== -1) {
      // Select seat
      this.selectedSeats[passengerIndex] = seatNumber;
    }

    this.calculateTotalPrice();
  }

  isSelected(seatNumber: string): boolean {
    return this.selectedSeats.includes(seatNumber);
  }

  private calculateTotalPrice(): void {
    const passengersCount = this.getPassengersArray().length;
    const baseFlightPrice = this.basePrice * passengersCount;
    const seatPrice = this.selectedSeats.filter((s) => s !== '').length * 15;
    const taxes = Math.round(baseFlightPrice * 0.1);

    this.totalPrice = baseFlightPrice + seatPrice + taxes;
  }

  // Payment and booking
  confirmBooking(): void {
    if (this.totalPrice > this.walletBalance) {
      this.error = 'Saldo insufficiente nel portafoglio virtuale';
      return;
    }

    this.loading = true;

    // Simulate payment processing
    setTimeout(() => {
      this.walletBalance -= this.totalPrice;
      this.bookingConfirmation = {
        bookingReference:
          'VB' + Math.random().toString(36).substr(2, 9).toUpperCase(),
        totalAmount: this.totalPrice,
        status: 'confirmed',
      };

      this.loading = false;
      this.currentStep = 3; // Success step
    }, 2000);
  }

  // Navigation helpers
  goToBookings(): void {
    this.router.navigate(['/passenger/bookings']);
  }

  searchNewFlight(): void {
    this.router.navigate(['/flights/search']);
  }

  // Utility methods
  formatDuration(minutes: number): string {
    if (!minutes || isNaN(minutes) || minutes <= 0) {
      return 'N/A';
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    if (hours === 0) {
      return `${remainingMinutes}m`;
    } else if (remainingMinutes === 0) {
      return `${hours}h`;
    } else {
      return `${hours}h ${remainingMinutes}m`;
    }
  }

  formatPrice(price: number): string {
    return `€${price.toFixed(2)}`;
  }
}
