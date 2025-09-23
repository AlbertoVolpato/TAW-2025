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

  // Round-trip info
  isRoundTrip = false;
  returnFlightId: string | null = null;
  returnFlightPrice = 0;

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
    const queryFlightId = this.route.snapshot.queryParamMap.get('flight');
    const flightId = pathFlightId || queryFlightId;

    const passengers = parseInt(
      this.route.snapshot.queryParamMap.get('passengers') || '1'
    );

    // Check for round-trip parameters
    this.isRoundTrip =
      this.route.snapshot.queryParamMap.get('isRoundTrip') === 'true';
    this.returnFlightId = this.route.snapshot.queryParamMap.get('returnFlight');
    this.returnFlightPrice = parseFloat(
      this.route.snapshot.queryParamMap.get('returnPrice') || '0'
    );

    console.log('BookingComponent ngOnInit:', {
      pathFlightId,
      queryFlightId,
      flightId,
      passengers,
      isRoundTrip: this.isRoundTrip,
      returnFlightId: this.returnFlightId,
      returnFlightPrice: this.returnFlightPrice,
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
    if (!this.flight || !this.flight.seats) {
      console.error('No flight data or seats available');
      return;
    }

    console.log('Loading real seat map from flight data:', this.flight.seats);

    // Group seats by row
    const seatsByRow: { [key: number]: any[] } = {};

    this.flight.seats.forEach((seat) => {
      // Extract row number from seat number (e.g., "12A" -> row 12)
      const rowMatch = seat.seatNumber.match(/^(\d+)([A-Z])$/);
      if (rowMatch) {
        const rowNum = parseInt(rowMatch[1]);
        const letter = rowMatch[2];

        if (!seatsByRow[rowNum]) {
          seatsByRow[rowNum] = [];
        }

        // Determine seat type based on letter position
        let seatType: 'window' | 'middle' | 'aisle';
        if (letter === 'A' || letter === 'F') {
          seatType = 'window';
        } else if (letter === 'C' || letter === 'D') {
          seatType = 'aisle';
        } else {
          seatType = 'middle';
        }

        seatsByRow[rowNum].push({
          seatNumber: seat.seatNumber,
          isAvailable: seat.isAvailable,
          isSelected: false,
          price: seat.price,
          type: seatType,
          class: seat.class,
        });
      }
    });

    // Convert to rows array and sort seats within each row
    const rows = [];
    const sortedRowNumbers = Object.keys(seatsByRow)
      .map((n) => parseInt(n))
      .sort((a, b) => a - b);

    for (const rowNum of sortedRowNumbers) {
      const seats = seatsByRow[rowNum];
      // Sort seats by letter (A, B, C, D, E, F)
      seats.sort((a, b) => {
        const letterA = a.seatNumber.slice(-1);
        const letterB = b.seatNumber.slice(-1);
        return letterA.localeCompare(letterB);
      });

      rows.push({
        rowNumber: rowNum,
        seats: seats,
        class: seats[0].class, // Use class from first seat in row
      });
    }

    this.seatMap = {
      rows: rows,
      aircraft: this.flight?.aircraft || {
        model: 'Unknown',
        capacity: this.flight.seats.length,
      },
    };

    console.log('Seat map loaded:', this.seatMap);
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

        // Recalculate total price with new seat selection
        this.calculateTotalPrice();
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

    // Calculate seat prices based on actual seat selection and prices
    let seatPrice = 0;
    const selectedSeatsWithPrices: {
      seatNumber: string;
      price: number;
      class: string;
    }[] = [];

    for (const seatNumber of this.selectedSeats.filter((s) => s !== '')) {
      if (this.seatMap) {
        for (const row of this.seatMap.rows) {
          const seat = row.seats.find((s) => s.seatNumber === seatNumber);
          if (seat) {
            // Calculate additional cost over base economy price
            const baseSeatPrice = this.basePrice; // Economy base price
            const seatUpgrade = seat.price - baseSeatPrice;
            seatPrice += Math.max(0, seatUpgrade); // Only add upgrade cost if positive

            selectedSeatsWithPrices.push({
              seatNumber: seat.seatNumber,
              price: seat.price,
              class: seat.class,
            });
            break;
          }
        }
      }
    }

    console.log('Selected seats with prices:', selectedSeatsWithPrices);
    console.log('Total seat upgrade cost:', seatPrice);

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
    console.log('Selected seats:', this.selectedSeats);
    console.log('Contact info:', bookingData.contactInfo);
    console.log('Baggage:', bookingData.baggage);
    console.log('Special services:', bookingData.specialServices);
    console.log('Full booking data:', JSON.stringify(bookingData, null, 2));
    console.log('================================');

    // Check seat availability before creating booking
    const selectedSeats = this.selectedSeats.filter(
      (seat) => seat && seat !== ''
    );
    if (selectedSeats.length > 0) {
      console.log('Checking seat availability for seats:', selectedSeats);

      // Refresh flight data to get current seat availability
      this.loadFlight(this.flight?._id || '');

      // Wait a moment for the flight data to refresh, then proceed
      setTimeout(() => {
        // Verify selected seats are still available
        const unavailableSeats = selectedSeats.filter((seatNumber) => {
          for (const row of this.seatMap?.rows || []) {
            const seat = row.seats.find((s) => s.seatNumber === seatNumber);
            if (seat && !seat.isAvailable) {
              return true; // Seat is no longer available
            }
          }
          return false;
        });

        if (unavailableSeats.length > 0) {
          alert(
            `I seguenti posti non sono più disponibili: ${unavailableSeats.join(
              ', '
            )}. Si prega di selezionare altri posti.`
          );
          this.loading = false;
          return;
        }

        // Proceed with booking creation
        this.proceedWithBookingCreation(bookingData);
      }, 500);
    } else {
      // No specific seats selected, proceed with booking
      this.proceedWithBookingCreation(bookingData);
    }
  }

  private proceedWithBookingCreation(bookingData: any): void {
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

        // Clear loading first
        this.loading = false;

        // Check if this is a round-trip booking
        if (this.isRoundTrip && this.returnFlightId) {
          // Show success message with round-trip info, then navigate to return flight booking
          setTimeout(() => {
            this.currentStep = 5; // Success step
            console.log(
              'Outbound flight booked, preparing return flight booking'
            );

            // After showing success for a moment, navigate to return flight booking
            setTimeout(() => {
              this.proceedToReturnBooking();
            }, 3000); // Wait 3 seconds to show success message
          }, 100);
        } else {
          // Regular single flight booking completion
          setTimeout(() => {
            this.currentStep = 5; // Success step
            console.log('Current step set to:', this.currentStep);
          }, 100);
        }
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

  // Navigate to return flight booking for round-trip
  proceedToReturnBooking(): void {
    if (this.returnFlightId) {
      const passengers =
        this.passengersForm.get('passengers')?.value?.length || 1;
      const seatClass = 'economy'; // Could be extracted from form if needed

      console.log('Proceeding to return flight booking:', {
        returnFlightId: this.returnFlightId,
        passengers: passengers,
        seatClass: seatClass,
      });

      this.router.navigate(['/booking'], {
        queryParams: {
          flight: this.returnFlightId,
          passengers: passengers,
          class: seatClass,
          isReturnFlight: 'true', // Mark this as the return flight booking
        },
      });
    } else {
      // Fallback: go to bookings list
      this.goToBookings();
    }
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

  // Seat class helper methods
  getClassLabel(seatClass: string): string {
    switch (seatClass) {
      case 'first':
        return 'Prima Classe';
      case 'business':
        return 'Business';
      case 'economy':
        return 'Economy';
      default:
        return 'Economy';
    }
  }

  getSeatClass(seatNumber: string): string {
    if (!this.seatMap) return 'Economy';

    for (const row of this.seatMap.rows) {
      const seat = row.seats.find((s) => s.seatNumber === seatNumber);
      if (seat) {
        return this.getClassLabel(seat.class);
      }
    }
    return 'Economy';
  }

  getSeatPrice(seatNumber: string): number {
    if (!this.seatMap) return 0;

    for (const row of this.seatMap.rows) {
      const seat = row.seats.find((s) => s.seatNumber === seatNumber);
      if (seat) {
        return seat.price;
      }
    }
    return 0;
  }
}
