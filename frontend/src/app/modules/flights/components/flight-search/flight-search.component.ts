import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import {
  Flight,
  Airport,
  FlightSearchRequest,
  FlightSearchResponse,
  AirportSearchResponse,
} from '../../../../models/flight.model';
import { FlightService } from '../../../../services/flight.service';
import { AutocompleteOption } from '../../../../shared/components/custom-autocomplete/custom-autocomplete.component';

@Component({
  selector: 'app-flight-search',
  templateUrl: './flight-search.component.html',
  styleUrls: ['./flight-search.component.scss'],
})
export class FlightSearchComponent implements OnInit {
  searchForm: FormGroup;
  flights: any[] = []; // Outbound flights
  returnFlights: any[] = []; // Return flights for round-trip
  loading = false;
  error: string | null = null;
  sortBy = 'price';
  classFilter = 'all';

  // Round-trip selection
  selectedOutbound: any = null;
  selectedReturn: any = null;
  isRoundTripSearch = false;

  // Cheapest flights for recommendations
  cheapestFlights: Flight[] = [];
  loadingCheapestFlights = false;

  // Calendar and suggestions - removed
  // showCalendar = false;
  // showSuggestions = false;
  // suggestedTargetDate = '';

  // Airports data
  airports: AutocompleteOption[] = [];

  constructor(
    private fb: FormBuilder,
    private flightService: FlightService,
    private router: Router
  ) {
    this.searchForm = this.fb.group({
      tripType: ['oneWay', Validators.required],
      departureAirport: [null, Validators.required],
      arrivalAirport: [null, Validators.required],
      departureDate: ['', Validators.required],
      returnDate: [''],
      passengers: [1, [Validators.required, Validators.min(1)]],
      seatClass: ['economy', Validators.required],
    });
  }

  ngOnInit(): void {
    this.loadAirports();
    this.loadCheapestFlights();
  }

  private loadAirports(): void {
    this.flightService.getAirports().subscribe({
      next: (response: AirportSearchResponse) => {
        if (response.success && response.data) {
          this.airports = response.data.airports.map((airport) => ({
            id: airport._id || airport.code,
            name: airport.name,
            code: airport.code,
            city: airport.city,
            country: airport.country,
          }));
        }
      },
      error: (error) => {
        console.error('Error loading airports:', error);
        this.error = 'Errore nel caricamento degli aeroporti';
      },
    });
  }

  onDepartureAirportSelected(airport: AutocompleteOption): void {
    this.searchForm.patchValue({ departureAirport: airport });
  }

  onArrivalAirportSelected(airport: AutocompleteOption): void {
    this.searchForm.patchValue({ arrivalAirport: airport });
  }

  swapAirports(): void {
    const departureValue = this.searchForm.get('departureAirport')?.value;
    const arrivalValue = this.searchForm.get('arrivalAirport')?.value;

    this.searchForm.patchValue({
      departureAirport: arrivalValue,
      arrivalAirport: departureValue,
    });
  }

  onTripTypeChange(): void {
    const tripType = this.searchForm.get('tripType')?.value;
    const returnDateControl = this.searchForm.get('returnDate');

    if (tripType === 'roundTrip') {
      returnDateControl?.setValidators([Validators.required]);
    } else {
      returnDateControl?.clearValidators();
      returnDateControl?.setValue('');
    }
    returnDateControl?.updateValueAndValidity();
  }

  onSearch(): void {
    if (this.searchForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    this.loading = true;
    this.error = null;
    this.selectedOutbound = null;
    this.selectedReturn = null;

    const formValue = this.searchForm.value;
    this.isRoundTripSearch = formValue.tripType === 'roundTrip';

    const searchRequest: FlightSearchRequest = {
      departureAirport: formValue.departureAirport?.code,
      arrivalAirport: formValue.arrivalAirport?.code,
      departureDate: this.formatDate(new Date(formValue.departureDate)),
      returnDate: formValue.returnDate
        ? this.formatDate(new Date(formValue.returnDate))
        : undefined,
      passengers: formValue.passengers,
      class: formValue.seatClass,
    };

    console.log('Searching flights with request:', searchRequest);

    this.flightService.searchFlights(searchRequest).subscribe({
      next: (response: FlightSearchResponse) => {
        console.log('=== FLIGHT SEARCH RESPONSE ===');
        console.log(
          'Success:',
          response.success,
          'Outbound:',
          response.data?.flights?.length || 0,
          'Return:',
          response.data?.returnFlights?.length || 0
        );
        this.loading = false;
        if (response.success) {
          this.flights = response.data?.flights || response.flights || [];
          this.returnFlights = response.data?.returnFlights || [];

          console.log('✓ Search flights loaded successfully');
          console.log(`✓ Outbound flights: ${this.flights.length}`);
          console.log(`✓ Return flights: ${this.returnFlights.length}`);

          this.sortFlights();

          if (this.flights.length === 0) {
            // Se non ci sono voli per la data selezionata, suggerisci date alternative
            this.suggestAlternativeDates(searchRequest);
          }
        } else {
          this.error = response.message || 'Errore nella ricerca voli';
        }
      },
      error: (error) => {
        console.error('Error searching flights:', error);
        this.error = 'Errore nella ricerca dei voli. Riprova più tardi.';
        this.loading = false;
      },
    });
  }

  private suggestAlternativeDates(originalRequest: FlightSearchRequest): void {
    if (
      !originalRequest.departureAirport ||
      !originalRequest.arrivalAirport ||
      !originalRequest.departureDate
    ) {
      this.error = 'Nessun volo trovato per i criteri di ricerca selezionati';
      return;
    }

    console.log('Suggesting alternative dates for:', originalRequest);

    this.flightService
      .suggestAlternativeDates(
        originalRequest.departureAirport,
        originalRequest.arrivalAirport,
        originalRequest.departureDate,
        originalRequest.passengers,
        originalRequest.class || 'economy'
      )
      .subscribe({
        next: (response) => {
          console.log('Alternative dates response:', response);
          if (response.success && response.data.suggestions.length > 0) {
            // Cerca automaticamente voli nelle date alternative
            this.searchAlternativeDates(
              originalRequest,
              response.data.suggestions
            );
          } else {
            this.error = `Nessun volo trovato per il ${this.formatDisplayDate(
              originalRequest.departureDate
            )} e nessuna data alternativa disponibile nei giorni vicini.`;
          }
        },
        error: (error) => {
          console.error('Error getting alternative dates:', error);
          this.error =
            'Nessun volo trovato per i criteri di ricerca selezionati';
        },
      });
  }

  private searchAlternativeDates(
    originalRequest: FlightSearchRequest,
    suggestions: any[]
  ): void {
    // Prendi le prime 3 date alternative più vicine
    const topSuggestions = suggestions.slice(0, 3);
    let foundFlights = false;

    console.log('Searching flights in alternative dates:', topSuggestions);

    // Cerca voli per ogni data alternativa
    const searchPromises = topSuggestions.map((suggestion) => {
      const altRequest = {
        ...originalRequest,
        departureDate: suggestion.date,
      };

      return this.flightService.searchFlights(altRequest).toPromise();
    });

    Promise.all(searchPromises)
      .then((responses) => {
        // Combina tutti i voli trovati
        const allFlights: any[] = [];

        responses.forEach((response, index) => {
          if (
            response?.success &&
            response.data?.flights &&
            response.data.flights.length > 0
          ) {
            foundFlights = true;
            // Aggiungi informazioni sulla data alternativa
            const flightsWithAltDate = response.data.flights.map(
              (flight: any) => ({
                ...flight,
                isAlternativeDate: true,
                originalDate: originalRequest.departureDate,
                alternativeDate: topSuggestions[index].date,
                daysDifference: topSuggestions[index].daysDifference,
              })
            );
            allFlights.push(...flightsWithAltDate);
          }
        });

        if (foundFlights) {
          this.flights = allFlights;
          this.sortFlights();
          this.error = `Nessun volo trovato per il ${this.formatDisplayDate(
            originalRequest.departureDate
          )}. Ecco i voli disponibili nei giorni vicini:`;
        } else {
          this.error = `Nessun volo trovato per il ${this.formatDisplayDate(
            originalRequest.departureDate
          )} e nessun volo disponibile nei giorni vicini.`;
        }
      })
      .catch((error) => {
        console.error('Error searching alternative dates:', error);
        this.error = 'Errore durante la ricerca di date alternative';
      });
  }

  private formatDisplayDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('it-IT', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  formatSelectedDate(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('it-IT', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }

  getMinDate(): string {
    const today = new Date();
    return today.toISOString().split('T')[0];
  }

  getMaxDate(): string {
    const maxDate = new Date();
    maxDate.setFullYear(maxDate.getFullYear() + 1); // 1 anno nel futuro
    return maxDate.toISOString().split('T')[0];
  }

  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  onSortChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.sortBy = target.value;
    this.sortFlights();
  }

  onClassFilterChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.classFilter = target.value;
    // Filter flights by class if needed
    // For now, we'll just re-sort
    this.sortFlights();
  }

  private sortFlights(): void {
    switch (this.sortBy) {
      case 'price':
        this.flights.sort((a, b) => {
          const priceA = this.getFlightPrice(a);
          const priceB = this.getFlightPrice(b);
          return priceA - priceB;
        });
        break;
      case 'duration':
        this.flights.sort((a, b) => {
          const durationA = this.getFlightDuration(a);
          const durationB = this.getFlightDuration(b);
          return durationA - durationB;
        });
        break;
      case 'departure':
        this.flights.sort((a, b) => {
          const timeA = new Date(this.getDepartureTime(a)).getTime();
          const timeB = new Date(this.getDepartureTime(b)).getTime();
          return timeA - timeB;
        });
        break;
    }
  }

  private calculateDuration(
    departure: Date | string,
    arrival: Date | string
  ): number {
    if (!departure || !arrival) {
      return 0;
    }

    const dep = new Date(departure);
    const arr = new Date(arrival);

    if (isNaN(dep.getTime()) || isNaN(arr.getTime())) {
      return 0;
    }

    const durationMs = arr.getTime() - dep.getTime();
    if (durationMs <= 0) {
      return 0;
    }

    return Math.round(durationMs / (1000 * 60)); // minutes
  }

  private markFormGroupTouched(): void {
    Object.keys(this.searchForm.controls).forEach((key) => {
      this.searchForm.get(key)?.markAsTouched();
    });
  }

  formatDuration(minutes: number): string {
    if (!minutes || isNaN(minutes) || minutes <= 0) {
      return 'N/A';
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  }

  private loadCheapestFlights(): void {
    this.loadingCheapestFlights = true;
    this.flightService.getCheapestFlights(5).subscribe({
      next: (response) => {
        console.log('=== CHEAPEST FLIGHTS RESPONSE ===');
        console.log(
          'Success:',
          response.success,
          'Count:',
          response.data?.length || 0
        );
        if (response.success && response.data) {
          this.cheapestFlights = response.data;
          console.log('✓ Cheapest flights loaded successfully');
        }
        this.loadingCheapestFlights = false;
      },
      error: (error) => {
        console.error('Error loading cheapest flights:', error);
        this.loadingCheapestFlights = false;
      },
    });
  }

  formatPrice(price: number | undefined): string {
    if (!price || isNaN(price)) {
      return 'N/A';
    }
    return `€${price.toFixed(2)}`;
  }

  selectCheapFlight(flight: any): void {
    // Navigate to booking page with the selected flight
    this.navigateToBooking(flight);
  }

  // New method to handle flight booking navigation
  navigateToBooking(flight: any): void {
    console.log('=== NAVIGATE TO BOOKING ===');
    const flightId = this.getFlightId(flight);
    console.log('Flight type:', flight.type || 'direct', 'ID:', flightId);

    if (flightId) {
      if (this.isConnectingFlight(flight)) {
        console.log('✓ Navigating to connecting flight (first segment)');
      } else {
        console.log('✓ Navigating to direct flight');
      }
      this.router.navigate(['/passenger/bookings/new', flightId]);
    } else {
      console.error('✗ Flight ID missing - cannot navigate');
      console.error('Flight data:', {
        type: flight.type,
        _id: flight._id,
        hasSegments: !!flight.segments,
        segmentsCount: flight.segments?.length || 0,
      });
      this.error =
        'Impossibile procedere con la prenotazione. Seleziona un altro volo.';
    }
  }

  private findAirportOption(code: string): AutocompleteOption | null {
    return this.airports.find((airport) => airport.code === code) || null;
  }

  getAirportCode(airport: AutocompleteOption | null): string {
    return airport?.code || '';
  }

  // Helper methods to handle both direct flights and connecting flights
  getDepartureAirportCode(flight: any): string {
    // Handle new API structure where flight data is in segments[0].flight
    if (flight.segments && flight.segments.length > 0) {
      const firstSegment = flight.segments[0];
      return firstSegment?.flight?.departureAirport?.code || '';
    }
    // Fallback for direct flights without segments
    return flight.departureAirport?.code || '';
  }

  getDepartureAirportCity(flight: any): string {
    // Handle new API structure where flight data is in segments[0].flight
    if (flight.segments && flight.segments.length > 0) {
      const firstSegment = flight.segments[0];
      return firstSegment?.flight?.departureAirport?.city || '';
    }
    // Fallback for direct flights without segments
    return flight.departureAirport?.city || '';
  }

  getArrivalAirportCode(flight: any): string {
    // Handle new API structure where flight data is in segments[0].flight
    if (flight.segments && flight.segments.length > 0) {
      // For connecting flights, get the final destination
      const lastSegment = flight.segments[flight.segments.length - 1];
      return lastSegment?.flight?.arrivalAirport?.code || '';
    }
    // Fallback for direct flights without segments
    return flight.arrivalAirport?.code || '';
  }

  getArrivalAirportCity(flight: any): string {
    // Handle new API structure where flight data is in segments[0].flight
    if (flight.segments && flight.segments.length > 0) {
      // For connecting flights, get the final destination
      const lastSegment = flight.segments[flight.segments.length - 1];
      return lastSegment?.flight?.arrivalAirport?.city || '';
    }
    // Fallback for direct flights without segments
    return flight.arrivalAirport?.city || '';
  }

  getDepartureTime(flight: any): string {
    // Handle new API structure where flight data is in segments[0].flight
    if (flight.segments && flight.segments.length > 0) {
      const firstSegment = flight.segments[0];
      return firstSegment?.flight?.departureTime || '';
    }
    // Fallback for direct flights without segments
    return flight.departureTime || '';
  }

  getArrivalTime(flight: any): string {
    // Handle new API structure where flight data is in segments[0].flight
    if (flight.segments && flight.segments.length > 0) {
      // For connecting flights, get the final arrival time
      const lastSegment = flight.segments[flight.segments.length - 1];
      return lastSegment?.flight?.arrivalTime || '';
    }
    // Fallback for direct flights without segments
    return flight.arrivalTime || '';
  }

  getFlightDuration(flight: any): number {
    // Handle new API structure - use totalDuration first, then fallback to segments[0].flight.duration
    if (flight.totalDuration) {
      return flight.totalDuration;
    }
    if (flight.segments && flight.segments.length > 0) {
      const firstSegment = flight.segments[0];
      return firstSegment?.flight?.duration || 0;
    }
    // Fallback for old structure
    return flight.duration || 0;
  }

  getFlightPrice(flight: any): number {
    // Handle new API structure - use totalPrice first, then fallback to segments[0].flight.basePrice
    if (flight.totalPrice && flight.totalPrice.economy) {
      return flight.totalPrice.economy;
    }
    if (flight.segments && flight.segments.length > 0) {
      const firstSegment = flight.segments[0];
      return firstSegment?.flight?.basePrice?.economy || 0;
    }
    // Fallback for old structure
    return flight.basePrice?.economy || 0;
  }

  getAirlineName(flight: any): string {
    // Handle new API structure where flight data is in segments[0].flight
    if (flight.segments && flight.segments.length > 0) {
      const firstSegment = flight.segments[0];
      return firstSegment?.flight?.airline?.name || '';
    }
    // Fallback for direct flights without segments
    return flight.airline?.name || '';
  }

  getFlightNumber(flight: any): string {
    // Handle new API structure where flight data is in segments[0].flight
    if (flight.segments && flight.segments.length > 0) {
      const firstSegment = flight.segments[0];
      if (flight.segments.length > 1) {
        // For connecting flights, show first and last flight numbers
        const lastSegment = flight.segments[flight.segments.length - 1];
        const firstNumber = firstSegment?.flight?.flightNumber;
        const lastNumber = lastSegment?.flight?.flightNumber;
        if (firstNumber && lastNumber && firstNumber !== lastNumber) {
          return `${firstNumber} - ${lastNumber}`;
        }
      }
      return firstSegment?.flight?.flightNumber || '';
    }
    // Fallback for direct flights without segments
    return flight.flightNumber || '';
  }

  // Method to get a unique identifier for booking navigation
  getFlightId(flight: any): string {
    // Handle new API structure where flight data is in segments[0].flight
    if (flight.segments && flight.segments.length > 0) {
      const firstSegment = flight.segments[0];
      console.log(
        'Flight segments:',
        flight.segments.map((s: any) => ({
          hasFlight: !!s.flight,
          segmentType: s.segmentType,
          flightId: s.flight?._id,
        }))
      );
      return firstSegment?.flight?._id || '';
    }
    // Fallback for direct flights without segments
    return flight._id || '';
  }

  // Helper methods for template
  isConnectingFlight(flight: any): boolean {
    return (
      flight.type === 'connecting' ||
      (flight.segments && flight.segments.length > 1)
    );
  }

  getLayovers(flight: any): number {
    if (flight.layovers !== undefined) {
      return flight.layovers;
    }
    // Calculate layovers from segments
    if (flight.segments && flight.segments.length > 1) {
      return flight.segments.length - 1;
    }
    return 0;
  }

  // Round-trip selection methods
  selectOutboundFlight(flight: any): void {
    this.selectedOutbound = flight;
    console.log('Selected outbound flight:', flight);
  }

  selectReturnFlight(flight: any): void {
    this.selectedReturn = flight;
    console.log('Selected return flight:', flight);
  }

  isOutboundSelected(flight: any): boolean {
    return (
      this.selectedOutbound &&
      this.getFlightId(this.selectedOutbound) === this.getFlightId(flight)
    );
  }

  isReturnSelected(flight: any): boolean {
    return (
      this.selectedReturn &&
      this.getFlightId(this.selectedReturn) === this.getFlightId(flight)
    );
  }

  getTotalPrice(): number {
    let total = 0;
    if (this.selectedOutbound) {
      total += this.getFlightPrice(this.selectedOutbound);
    }
    if (this.selectedReturn) {
      total += this.getFlightPrice(this.selectedReturn);
    }
    return total;
  }

  canProceedToBooking(): boolean {
    if (this.isRoundTripSearch) {
      return this.selectedOutbound && this.selectedReturn;
    }
    return this.selectedOutbound !== null;
  }

  proceedToBooking(): void {
    if (!this.canProceedToBooking()) {
      return;
    }

    if (
      this.isRoundTripSearch &&
      this.selectedOutbound &&
      this.selectedReturn
    ) {
      // Round-trip: prima prenotazione andata, poi ritorno
      // Salva i dati del ritorno per dopo
      const returnFlightId = this.getFlightId(this.selectedReturn);
      const returnFlightPrice = this.getFlightPrice(this.selectedReturn);
      
      // Naviga alla prenotazione del volo di andata con info del ritorno
      const outboundId = this.getFlightId(this.selectedOutbound);
      this.router.navigate(['/booking'], {
        queryParams: {
          flight: outboundId,
          passengers: this.searchForm.get('passengers')?.value,
          class: this.searchForm.get('seatClass')?.value,
          // Aggiungiamo i dati del volo di ritorno per gestirlo dopo
          returnFlight: returnFlightId,
          returnPrice: returnFlightPrice,
          isRoundTrip: 'true'
        },
      });
    } else if (this.selectedOutbound) {
      // Navigate to booking with single flight
      const flightId = this.getFlightId(this.selectedOutbound);
      this.router.navigate(['/booking'], {
        queryParams: {
          flight: flightId,
          passengers: this.searchForm.get('passengers')?.value,
          class: this.searchForm.get('seatClass')?.value,
        },
      });
    }
  }
}
