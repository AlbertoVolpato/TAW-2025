import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { MatStepper } from '@angular/material/stepper';
import { Flight } from '../../../../models/flight.model';
import { 
  Booking, 
  BookingRequest, 
  Passenger, 
  BookingPassenger,
  SeatMap, 
  PaymentRequest 
} from '../../../../models/booking.model';
import { FlightService } from '../../../../services/flight.service';
import { BookingService } from '../../../../services/booking.service';
import { AuthService } from '../../../../services/auth.service';

@Component({
  selector: 'app-booking',
  templateUrl: './booking.component.html',
  styleUrls: ['./booking.component.scss']
})
export class BookingComponent implements OnInit {
  flight: Flight | null = null;
  seatMap: SeatMap | null = null;
  
  // Forms
  passengersForm!: FormGroup;
  extrasForm!: FormGroup;
  paymentForm!: FormGroup;
  
  // State
  loading = false;
  error: string | null = null;
  currentStep = 0;
  selectedSeats: string[] = [];
  currentPassengerIndex = 0;
  totalPrice = 0;
  basePrice = 0;
  
  // Booking data
  bookingData: Partial<BookingRequest> = {};
  
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
    this.route.queryParams.subscribe(params => {
      const flightId = params['flightId'];
      const passengers = parseInt(params['passengers']) || 1;
      
      if (flightId) {
        this.loadFlight(flightId);
        this.setupPassengersForm(passengers);
      } else {
        this.router.navigate(['/flights/search']);
      }
    });
  }

  private initializeForms(): void {
    this.passengersForm = this.fb.group({
      passengers: this.fb.array([])
    });

    this.extrasForm = this.fb.group({
      meals: this.fb.array([]),
      baggage: this.fb.group({
        checked: [0, [Validators.min(0), Validators.max(5)]]
      }),
      insurance: [false],
      priorityBoarding: [false],
      extraLegroom: [false]
    });

    this.paymentForm = this.fb.group({
      cardNumber: ['', [Validators.required, Validators.pattern(/^[0-9]{16}$/)]],
      expiryDate: ['', [Validators.required, Validators.pattern(/^(0[1-9]|1[0-2])\/([0-9]{2})$/)]],
      cvv: ['', [Validators.required, Validators.pattern(/^[0-9]{3,4}$/)]],
      cardholderName: ['', [Validators.required, Validators.minLength(2)]],
      billingAddress: this.fb.group({
        street: ['', Validators.required],
        city: ['', Validators.required],
        postalCode: ['', Validators.required],
        country: ['Italia', Validators.required]
      })
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
      documentType: ['passport', Validators.required],
      documentNumber: ['', [Validators.required, Validators.minLength(5)]],
      documentExpiry: ['', Validators.required],
      nationality: ['IT', Validators.required],
      email: ['', [Validators.email]],
      phone: ['', [Validators.pattern(/^\+?[0-9\s\-\(\)]{8,15}$/)]]
    });
  }

  private loadFlight(flightId: string): void {
    this.loading = true;
    this.error = null;

    this.flightService.getFlightById(flightId).subscribe({
      next: (response) => {
        this.loading = false;
        if (response.success && response.data) {
          this.flight = response.data.flight;
          this.basePrice = typeof this.flight.basePrice === 'object' ? this.flight.basePrice.economy : this.flight.basePrice;
          this.calculateTotalPrice();
          this.loadSeatMap(flightId);
        } else {
          this.error = response.message || 'Volo non trovato';
        }
      },
      error: (error) => {
        this.loading = false;
        console.error('Error loading flight:', error);
        this.error = error.error?.message || 'Errore nel caricamento del volo';
      }
    });
  }

  private loadSeatMap(flightId: string): void {
    this.bookingService.getSeatMap(flightId).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.seatMap = response.data.seatMap;
        }
      },
      error: (error) => {
        console.error('Error loading seat map:', error);
      }
    });
  }

  onSeatSelected(seatNumber: string, passengerIndex: number): void {
    // Remove previous seat selection for this passenger
    const previousSeat = this.selectedSeats[passengerIndex];
    if (previousSeat) {
      this.updateSeatAvailability(previousSeat, true);
    }

    // Set new seat
    this.selectedSeats[passengerIndex] = seatNumber;
    this.updateSeatAvailability(seatNumber, false);
    
    this.calculateTotalPrice();
  }

  private updateSeatAvailability(seatNumber: string, available: boolean): void {
    if (!this.seatMap) return;

    for (const row of this.seatMap.rows) {
      const seat = row.seats.find(s => s.seatNumber === seatNumber);
      if (seat) {
        seat.isAvailable = available;
        break;
      }
    }
  }

  calculateTotalPrice(): void {
    if (!this.flight) return;

    const passengersCount = this.getPassengersArray().length;
    const extrasData = this.extrasForm.value;
    
    this.totalPrice = this.bookingService.calculateTotalPrice(
      this.basePrice,
      passengersCount,
      extrasData
    );
  }

  onStepChange(event: any): void {
    this.currentStep = event.selectedIndex;
    
    if (this.currentStep === 2) { // Extras step
      this.calculateTotalPrice();
    }
  }

  onNextStep(stepper: MatStepper): void {
    if (this.currentStep === 0 && !this.passengersForm.valid) {
      this.markFormGroupTouched(this.passengersForm);
      return;
    }

    if (this.currentStep === 1 && this.selectedSeats.some(seat => !seat)) {
      this.error = 'Seleziona un posto per ogni passeggero';
      return;
    }

    if (this.currentStep === 3 && !this.paymentForm.valid) {
      this.markFormGroupTouched(this.paymentForm);
      return;
    }

    this.error = null;
    stepper.next();
  }

  onPreviousStep(stepper: MatStepper): void {
    stepper.previous();
  }

  onConfirmBooking(): void {
    if (!this.flight || !this.passengersForm.valid || !this.paymentForm.valid) {
      return;
    }

    this.loading = true;
    this.error = null;

    // Prepare booking data
    const passengers: BookingPassenger[] = this.getPassengersArray().controls.map((control, index) => ({
      ...control.value,
      seatNumber: this.selectedSeats[index],
      seatClass: 'economy' as const
    }));

    const bookingRequest: BookingRequest = {
      flightId: this.flight._id,
      passengers,
      seats: {
        outbound: this.selectedSeats
      },
      extras: this.extrasForm.value
    };

    // Create booking
    this.bookingService.createBooking(bookingRequest).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          // Process payment
          this.processPayment(response.data.booking);
        } else {
          this.loading = false;
          this.error = response.message || 'Errore nella creazione della prenotazione';
        }
      },
      error: (error) => {
        this.loading = false;
        console.error('Booking error:', error);
        this.error = error.error?.message || 'Errore nella creazione della prenotazione';
      }
    });
  }

  private processPayment(booking: Booking): void {
    const paymentData: PaymentRequest = {
      bookingId: booking._id,
      paymentMethod: 'credit_card',
      paymentDetails: {
        cardNumber: this.paymentForm.value.cardNumber,
        expiryDate: this.paymentForm.value.expiryDate,
        cvv: this.paymentForm.value.cvv,
        cardholderName: this.paymentForm.value.cardholderName
      }
    };

    this.bookingService.processPayment(paymentData).subscribe({
      next: (response) => {
        this.loading = false;
        if (response.success) {
          // Redirect to booking confirmation
          this.router.navigate(['/passenger/booking', booking._id], {
            queryParams: { confirmed: 'true' }
          });
        } else {
          this.error = response.message || 'Errore nel pagamento';
        }
      },
      error: (error) => {
        this.loading = false;
        console.error('Payment error:', error);
        this.error = error.error?.message || 'Errore nel pagamento';
      }
    });
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      } else if (control instanceof FormArray) {
        control.controls.forEach(arrayControl => {
          if (arrayControl instanceof FormGroup) {
            this.markFormGroupTouched(arrayControl);
          } else {
            arrayControl.markAsTouched();
          }
        });
      } else {
        control?.markAsTouched();
      }
    });
  }

  getPassengersArray(): FormArray {
    return this.passengersForm.get('passengers') as FormArray;
  }

  getMealsArray(): FormArray {
    return this.extrasForm.get('meals') as FormArray;
  }

  formatPrice(price: number): string {
    return this.flightService.formatPrice(price);
  }

  formatDuration(minutes: number): string {
    return this.flightService.formatDuration(minutes);
  }

  getSeatClass(seat: any): string {
    const classes = ['seat'];
    
    if (!seat.available) classes.push('occupied');
    if (seat.type === 'premium') classes.push('premium');
    if (seat.type === 'exit') classes.push('exit-row');
    if (this.selectedSeats.includes(seat.seatNumber)) classes.push('selected');
    
    return classes.join(' ');
  }

  isSeatSelectable(seat: any): boolean {
    return seat.isAvailable && !this.selectedSeats.includes(seat.seatNumber);
  }

  getCurrentPassengerIndex(): number {
    return this.currentPassengerIndex;
  }

  setCurrentPassenger(index: number): void {
    this.currentPassengerIndex = index;
  }
}