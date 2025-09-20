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

  // Form and UI state
  loading = false;
  error = '';
  currentStep = 1;
  selectedSeats: string[] = [];
  totalPrice = 0;
  basePrice = 0;

  // Price breakdown for detailed display
  priceBreakdown = {
    basePrice: 0,
    seatPrice: 0,
    extras: [] as { name: string; price: number }[],
    taxes: 0,
    total: 0,
  };

  // Extra services - simplified
  selectedExtras = {
    extraBaggage: 0,
    insurance: false,
    priorityBoarding: false,
    extraLegroom: false,
  };

  // Available extras (populated from flight data)
  availableExtras = {
    hasWifi: false,
    hasEntertainment: false,
    extraBaggage: {
      available: true,
      price: 75, // Default price
      maxWeight: 0,
    },
  };

  // Virtual wallet
  walletBalance = 2000;
  bookingConfirmation: any = null;

  // Make Math available in template
  Math = Math;

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
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.minLength(10)]],
      dateOfBirth: ['', Validators.required],
      nationality: ['', Validators.required],
      gender: ['', Validators.required],
      documentNumber: ['', [Validators.required, Validators.minLength(5)]],
    });
  }

  private loadFlight(flightId: string): void {
    this.loading = true;
    this.error = '';

    this.flightService.getFlightById(flightId).subscribe({
      next: (response) => {
        console.log('Flight loaded:', response);
        if (response.success && response.data) {
          this.flight = response.data.flight || response.data;
          this.basePrice = this.flight?.basePrice?.economy || 0;
          this.loadAvailableExtras();
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

  private loadAvailableExtras(): void {
    if (!this.flight) return;

    // Load wifi and entertainment info
    this.availableExtras.hasWifi = this.flight.services?.wifi || false;
    this.availableExtras.hasEntertainment =
      this.flight.services?.entertainment || false;

    // Load extra baggage info
    if (this.flight.baggage?.checked?.extraBagPrice) {
      this.availableExtras.extraBaggage = {
        available: true,
        price: this.flight.baggage.checked.extraBagPrice,
        maxWeight: this.flight.baggage.checked.maxWeight || 23,
      };
    }
  }

  private loadSeatMap(): void {
    if (!this.flight) return;

    // Generate a simple seat map for demonstration
    const rows = [];
    const seatsPerRow = ['A', 'B', 'C', 'D', 'E', 'F'];

    for (let rowNum = 1; rowNum <= 30; rowNum++) {
      const seats = [];
      for (let i = 0; i < seatsPerRow.length; i++) {
        const letter = seatsPerRow[i];
        let seatType: 'window' | 'middle' | 'aisle';

        if (i === 0 || i === seatsPerRow.length - 1) {
          seatType = 'window';
        } else if (i === 2 || i === 3) {
          seatType = 'aisle';
        } else {
          seatType = 'middle';
        }

        seats.push({
          seatNumber: `${rowNum}${letter}`,
          isAvailable: Math.random() > 0.3,
          isSelected: false,
          price: this.basePrice + Math.floor(Math.random() * 50),
          type: seatType,
          class: 'economy' as const,
        });
      }

      rows.push({
        rowNumber: rowNum,
        seats: seats,
        class: 'economy' as const,
      });
    }

    this.seatMap = {
      rows: rows,
      aircraft: this.flight?.aircraft || { model: 'Boeing 737', capacity: 180 },
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
    if (this.currentStep < 4) {
      this.currentStep++;
    }
  }

  previousStep(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  // Seat selection
  selectSeat(seatNumber: string): void {
    if (!this.seatMap) return;

    // Find the seat across all rows
    for (const row of this.seatMap.rows) {
      const seat = row.seats.find((s) => s.seatNumber === seatNumber);
      if (seat) {
        if (!seat.isAvailable) return;

        // Deselect previously selected seat
        this.deselectAllSeats();

        // Select this seat
        seat.isSelected = true;
        this.selectedSeats = [seatNumber];
        this.basePrice = seat.price;
        break;
      }
    }
  }

  private deselectAllSeats(): void {
    if (!this.seatMap) return;

    for (const row of this.seatMap.rows) {
      for (const seat of row.seats) {
        seat.isSelected = false;
      }
    }
  }

  isSelected(seatNumber: string): boolean {
    return this.selectedSeats.includes(seatNumber);
  }

  private calculateTotalPrice(): void {
    const passengersCount = this.getPassengersArray().length;
    const baseFlightPrice = this.basePrice * passengersCount;
    const seatPrice = this.selectedSeats.filter((s) => s !== '').length * 15;

    // Calculate extras
    let extrasPrice = 0;
    this.priceBreakdown = {
      basePrice: baseFlightPrice,
      seatPrice: seatPrice,
      extras: [],
      taxes: 0,
      total: 0,
    };

    // Extra baggage
    const extraBaggageCost =
      this.selectedExtras.extraBaggage *
      (this.availableExtras.extraBaggage.price || 75);
    if (extraBaggageCost > 0) {
      extrasPrice += extraBaggageCost;
      this.priceBreakdown.extras.push({
        name: `Bagaglio extra (${this.selectedExtras.extraBaggage})`,
        price: extraBaggageCost,
      });
    }

    // Insurance
    if (this.selectedExtras.insurance) {
      extrasPrice += 25;
      this.priceBreakdown.extras.push({
        name: 'Assicurazione di viaggio',
        price: 25,
      });
    }

    // Priority boarding
    if (this.selectedExtras.priorityBoarding) {
      extrasPrice += 15;
      this.priceBreakdown.extras.push({
        name: 'Imbarco prioritario',
        price: 15,
      });
    }

    // Extra legroom
    if (this.selectedExtras.extraLegroom) {
      extrasPrice += 35;
      this.priceBreakdown.extras.push({
        name: 'Spazio gambe extra',
        price: 35,
      });
    }

    const taxes = Math.round((baseFlightPrice + extrasPrice) * 0.1);
    this.priceBreakdown.taxes = taxes;
    this.priceBreakdown.total =
      baseFlightPrice + seatPrice + extrasPrice + taxes;

    this.totalPrice = this.priceBreakdown.total;
  }

  // Extra services methods - simplified
  updateExtraBaggage(count: number): void {
    this.selectedExtras.extraBaggage = Math.max(0, count);
    this.calculateTotalPrice();
  }

  toggleInsurance(): void {
    this.selectedExtras.insurance = !this.selectedExtras.insurance;
    this.calculateTotalPrice();
  }

  togglePriorityBoarding(): void {
    this.selectedExtras.priorityBoarding =
      !this.selectedExtras.priorityBoarding;
    this.calculateTotalPrice();
  }

  toggleExtraLegroom(): void {
    this.selectedExtras.extraLegroom = !this.selectedExtras.extraLegroom;
    this.calculateTotalPrice();
  }

  // Payment and booking
  confirmBooking(): void {
    // Validation
    if (!this.flight) {
      this.error = 'Informazioni del volo mancanti';
      return;
    }

    if (this.passengersForm.invalid) {
      this.error = 'Completa tutti i campi passeggeri richiesti';
      this.passengersForm.markAllAsTouched();
      return;
    }

    const passengers = this.passengersForm.get('passengers')?.value || [];
    if (passengers.length === 0) {
      this.error = 'Almeno un passeggero è richiesto';
      return;
    }

    // Check that all passengers have required fields
    for (let i = 0; i < passengers.length; i++) {
      const passenger = passengers[i];
      if (!passenger.firstName || !passenger.lastName || !passenger.email) {
        this.error = `Completa tutti i campi obbligatori per il passeggero ${
          i + 1
        }`;
        return;
      }

      // Additional validation for required fields
      if (!passenger.phone) {
        this.error = `Numero di telefono mancante per il passeggero ${i + 1}`;
        return;
      }

      if (!passenger.nationality) {
        this.error = `Nazionalità mancante per il passeggero ${i + 1}`;
        return;
      }

      if (!passenger.dateOfBirth) {
        this.error = `Data di nascita mancante per il passeggero ${i + 1}`;
        return;
      }

      if (!passenger.gender) {
        this.error = `Genere mancante per il passeggero ${i + 1}`;
        return;
      }

      if (!passenger.documentNumber || passenger.documentNumber.length < 5) {
        this.error = `Numero documento non valido per il passeggero ${i + 1}`;
        return;
      }
    }

    // Validate seat selection
    if (this.selectedSeats.length !== passengers.length) {
      this.error = 'Seleziona un posto per ogni passeggero';
      return;
    }

    if (this.totalPrice > this.walletBalance) {
      this.error = 'Saldo insufficiente nel portafoglio virtuale';
      return;
    }

    this.loading = true;
    this.error = '';

    // Prepare booking data
    const passengersData = this.passengersForm.get('passengers')?.value || [];
    const processedPassengers = passengersData.map(
      (passenger: any, index: number) => ({
        ...passenger,
        seatClass: 'economy' as const, // Default to economy class
        seatNumber: this.selectedSeats[index] || null,
      })
    );

    const bookingData: any = {
      flightId: this.flight?._id || '',
      passengers: processedPassengers,
      contactInfo: {
        email: processedPassengers[0]?.email || '',
        phone: processedPassengers[0]?.phone || '',
      },
      baggage: {
        carryOn: 1,
        checked: 1, // Default
        extraBags: this.selectedExtras.extraBaggage,
      },
      specialServices: {
        wheelchairAssistance: false,
        specialMeal: '', // Empty string means no special meal
        unaccompaniedMinor: false,
        petTransport: false,
      },
    };

    console.log('=== BOOKING SUBMISSION DEBUG ===');
    console.log('Flight ID:', bookingData.flightId);
    console.log('Passengers count:', bookingData.passengers.length);
    console.log('Processed passengers:', bookingData.passengers);
    console.log('Contact info:', bookingData.contactInfo);
    console.log('Baggage:', bookingData.baggage);
    console.log('Special services:', bookingData.specialServices);
    console.log('Full booking data:', JSON.stringify(bookingData, null, 2));
    console.log('================================');

    // Create actual booking
    this.bookingService.createBooking(bookingData).subscribe({
      next: (response) => {
        console.log('Booking response:', response);
        this.walletBalance -= this.totalPrice;

        // Handle different response structures - using any to avoid type issues
        const bookingData: any =
          response.data?.booking || response.data || response.booking;

        this.bookingConfirmation = {
          bookingReference: bookingData?.bookingReference || 'N/A',
          totalAmount: this.totalPrice,
          status: 'confirmed',
        };

        console.log('Booking confirmation set:', this.bookingConfirmation);

        // Clear loading first, then set step
        this.loading = false;

        // Use setTimeout to ensure the DOM update happens
        setTimeout(() => {
          this.currentStep = 5; // Success step
          console.log('Current step set to:', this.currentStep);
        }, 100);
      },
      error: (error) => {
        this.loading = false;
        console.error('Booking error details:', {
          status: error.status,
          statusText: error.statusText,
          error: error.error,
          message: error.message,
        });

        // More specific error messages
        let errorMessage = 'Errore durante la conferma della prenotazione';

        if (error.status === 400) {
          if (error.error?.message) {
            errorMessage = error.error.message;
          } else if (error.error?.details) {
            errorMessage = `Dati non validi: ${error.error.details}`;
          } else {
            errorMessage = 'I dati della prenotazione non sono validi';
          }
        } else if (error.status === 404) {
          errorMessage = 'Volo non trovato o non più disponibile';
        } else if (error.status === 409) {
          errorMessage = 'Il posto selezionato non è più disponibile';
        } else if (error.status === 500) {
          errorMessage = 'Errore del server. Riprova più tardi';
        } else if (error.error?.message) {
          errorMessage = error.error.message;
        }

        this.error = errorMessage;
      },
    });
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
