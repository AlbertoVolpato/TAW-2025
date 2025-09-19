import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Flight, Airport, FlightSearchRequest, FlightSearchResponse, AirportSearchResponse } from '../../../../models/flight.model';
import { FlightService } from '../../../../services/flight.service';
import { AutocompleteOption } from '../../../../shared/components/custom-autocomplete/custom-autocomplete.component';

@Component({
  selector: 'app-flight-search',
  templateUrl: './flight-search.component.html',
  styleUrls: ['./flight-search.component.scss']
})
export class FlightSearchComponent implements OnInit {
  searchForm: FormGroup;
  flights: Flight[] = [];
  loading = false;
  error: string | null = null;
  sortBy = 'price';
  classFilter = 'all';

  // Calendar and suggestions - removed
  // showCalendar = false;
  // showSuggestions = false;
  // suggestedTargetDate = '';

  // Airports data
  airports: AutocompleteOption[] = [];

  constructor(
    private fb: FormBuilder,
    private flightService: FlightService
  ) {
    this.searchForm = this.fb.group({
      tripType: ['oneWay', Validators.required],
      departureAirport: [null, Validators.required],
      arrivalAirport: [null, Validators.required],
      departureDate: ['', Validators.required],
      returnDate: [''],
      passengers: [1, [Validators.required, Validators.min(1)]],
      seatClass: ['economy', Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadAirports();
  }

  private loadAirports(): void {
    this.flightService.getAirports().subscribe({
      next: (response: AirportSearchResponse) => {
        if (response.success && response.data) {
          this.airports = response.data.airports.map(airport => ({
            id: airport._id || airport.code,
            name: airport.name,
            code: airport.code,
            city: airport.city,
            country: airport.country
          }));
        }
      },
      error: (error) => {
        console.error('Error loading airports:', error);
        this.error = 'Errore nel caricamento degli aeroporti';
      }
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
      arrivalAirport: departureValue
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

    const formValue = this.searchForm.value;
    const searchRequest: FlightSearchRequest = {
      departureAirport: formValue.departureAirport?.code,
      arrivalAirport: formValue.arrivalAirport?.code,
      departureDate: this.formatDate(new Date(formValue.departureDate)),
      returnDate: formValue.returnDate ? this.formatDate(new Date(formValue.returnDate)) : undefined,
      passengers: formValue.passengers,
      class: formValue.seatClass
    };

    console.log('Searching flights with request:', searchRequest);

    this.flightService.searchFlights(searchRequest).subscribe({
      next: (response: FlightSearchResponse) => {
        console.log('Flight search response:', response);
        this.loading = false;
        if (response.success) {
          this.flights = (response.data?.flights || response.flights || []).map(flight => ({
            ...flight,
            duration: this.calculateDuration(flight.departureTime, flight.arrivalTime)
          }));
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
      }
    });
  }

  private suggestAlternativeDates(originalRequest: FlightSearchRequest): void {
    if (!originalRequest.departureAirport || !originalRequest.arrivalAirport || !originalRequest.departureDate) {
      this.error = 'Nessun volo trovato per i criteri di ricerca selezionati';
      return;
    }

    console.log('Suggesting alternative dates for:', originalRequest);

    this.flightService.suggestAlternativeDates(
      originalRequest.departureAirport,
      originalRequest.arrivalAirport,
      originalRequest.departureDate,
      originalRequest.passengers,
      originalRequest.class || 'economy'
    ).subscribe({
      next: (response) => {
        console.log('Alternative dates response:', response);
        if (response.success && response.data.suggestions.length > 0) {
          // Cerca automaticamente voli nelle date alternative
          this.searchAlternativeDates(originalRequest, response.data.suggestions);
        } else {
          this.error = `Nessun volo trovato per il ${this.formatDisplayDate(originalRequest.departureDate)} e nessuna data alternativa disponibile nei giorni vicini.`;
        }
      },
      error: (error) => {
        console.error('Error getting alternative dates:', error);
        this.error = 'Nessun volo trovato per i criteri di ricerca selezionati';
      }
    });
  }

  private searchAlternativeDates(originalRequest: FlightSearchRequest, suggestions: any[]): void {
    // Prendi le prime 3 date alternative più vicine
    const topSuggestions = suggestions.slice(0, 3);
    let foundFlights = false;

    console.log('Searching flights in alternative dates:', topSuggestions);

    // Cerca voli per ogni data alternativa
    const searchPromises = topSuggestions.map(suggestion => {
      const altRequest = {
        ...originalRequest,
        departureDate: suggestion.date
      };

      return this.flightService.searchFlights(altRequest).toPromise();
    });

    Promise.all(searchPromises).then(responses => {
      // Combina tutti i voli trovati
      const allFlights: any[] = [];
      
      responses.forEach((response, index) => {
        if (response?.success && response.data?.flights && response.data.flights.length > 0) {
          foundFlights = true;
          // Aggiungi informazioni sulla data alternativa
          const flightsWithAltDate = response.data.flights.map((flight: any) => ({
            ...flight,
            isAlternativeDate: true,
            originalDate: originalRequest.departureDate,
            alternativeDate: topSuggestions[index].date,
            daysDifference: topSuggestions[index].daysDifference,
            duration: this.calculateDuration(flight.departureTime, flight.arrivalTime)
          }));
          allFlights.push(...flightsWithAltDate);
        }
      });

      if (foundFlights) {
        this.flights = allFlights;
        this.sortFlights();
        this.error = `Nessun volo trovato per il ${this.formatDisplayDate(originalRequest.departureDate)}. Ecco i voli disponibili nei giorni vicini:`;
      } else {
        this.error = `Nessun volo trovato per il ${this.formatDisplayDate(originalRequest.departureDate)} e nessun volo disponibile nei giorni vicini.`;
      }
    }).catch(error => {
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
      day: 'numeric'
    });
  }

  formatSelectedDate(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('it-IT', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
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
          const priceA = a.basePrice?.economy || 0;
          const priceB = b.basePrice?.economy || 0;
          return priceA - priceB;
        });
        break;
      case 'duration':
        this.flights.sort((a, b) => (a.duration || 0) - (b.duration || 0));
        break;
      case 'departure':
        this.flights.sort((a, b) => {
          const timeA = new Date(a.departureTime).getTime();
          const timeB = new Date(b.departureTime).getTime();
          return timeA - timeB;
        });
        break;
    }
  }

  private calculateDuration(departure: Date | string, arrival: Date | string): number {
    const dep = new Date(departure);
    const arr = new Date(arrival);
    return Math.round((arr.getTime() - dep.getTime()) / (1000 * 60)); // minutes
  }

  private markFormGroupTouched(): void {
    Object.keys(this.searchForm.controls).forEach(key => {
      this.searchForm.get(key)?.markAsTouched();
    });
  }

  formatDuration(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  }

  getAirportCode(airport: AutocompleteOption | null): string {
    return airport?.code || '';
  }
}
