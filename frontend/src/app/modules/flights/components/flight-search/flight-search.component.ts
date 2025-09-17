import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Observable, of } from 'rxjs';
import { map, startWith, debounceTime, distinctUntilChanged, switchMap, catchError } from 'rxjs/operators';
import { Flight, Airport, FlightSearchRequest } from '../../../../models/flight.model';
import { FlightService } from '../../../../services/flight.service';

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
  
  // Calendar and suggestions
  showCalendar = false;
  showSuggestions = false;
  suggestedTargetDate = '';

  // Airports data from API
  airports: Airport[] = [];
  filteredDepartureAirports: Observable<Airport[]> = of([]);
  filteredArrivalAirports: Observable<Airport[]> = of([]);

  constructor(
    private fb: FormBuilder,
    private flightService: FlightService
  ) {
    this.searchForm = this.fb.group({
      tripType: ['oneWay', Validators.required],
      departureAirport: ['', Validators.required],
      arrivalAirport: ['', Validators.required],
      departureDate: [''],
      returnDate: [''],
      passengers: [1, [Validators.required, Validators.min(1), Validators.max(9)]],
      seatClass: ['economy', Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadAirports();
    this.setupAutocomplete();
    this.setupCalendarVisibility();
  }

  private loadAirports(): void {
    this.flightService.getAirports().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.airports = response.data.airports;
        }
      },
      error: (error) => {
        console.error('Error loading airports:', error);
        this.error = 'Errore nel caricamento degli aeroporti';
      }
    });
  }

  private setupAutocomplete(): void {
    // Setup departure airport autocomplete
    this.filteredDepartureAirports = this.searchForm.get('departureAirport')!.valueChanges.pipe(
      startWith(''),
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(value => {
        if (typeof value === 'string' && value.length >= 2) {
          return this.flightService.searchAirports(value).pipe(
            map(response => response.success ? response.data.airports : []),
            catchError(() => of([]))
          );
        }
        return of(this.airports.slice(0, 10));
      })
    );

    // Setup arrival airport autocomplete
    this.filteredArrivalAirports = this.searchForm.get('arrivalAirport')!.valueChanges.pipe(
      startWith(''),
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(value => {
        if (typeof value === 'string' && value.length >= 2) {
          return this.flightService.searchAirports(value).pipe(
            map(response => response.success ? response.data.airports : []),
            catchError(() => of([]))
          );
        }
        return of(this.airports.slice(0, 10));
      })
    );
  }

  displayAirport(airport: Airport): string {
    return airport ? `${airport.name} (${airport.iataCode || airport.code})` : '';
  }

  swapAirports(): void {
    const departure = this.searchForm.get('departureAirport')?.value;
    const arrival = this.searchForm.get('arrivalAirport')?.value;
    
    this.searchForm.patchValue({
      departureAirport: arrival,
      arrivalAirport: departure
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
    this.flights = [];

    const formValue = this.searchForm.value;
    const departureAirport = formValue.departureAirport;
    const arrivalAirport = formValue.arrivalAirport;

    // Extract airport codes or IDs
    const departureCode = typeof departureAirport === 'string' ? 
      departureAirport : (departureAirport.iataCode || departureAirport.code || departureAirport._id);
    const arrivalCode = typeof arrivalAirport === 'string' ? 
      arrivalAirport : (arrivalAirport.iataCode || arrivalAirport.code || arrivalAirport._id);

    const searchRequest: FlightSearchRequest = {
      departureAirport: departureCode,
      arrivalAirport: arrivalCode,
      departureDate: this.formatDate(formValue.departureDate),
      passengers: formValue.passengers,
      returnDate: formValue.returnDate ? this.formatDate(formValue.returnDate) : undefined,
      class: 'economy' // Default to economy for now
    };

    this.flightService.searchFlights(searchRequest).subscribe({
      next: (response) => {
        this.loading = false;
        if (response.success) {
          this.flights = response.data?.flights || response.flights || [];
          if (this.flights.length === 0) {
            this.error = 'Nessun volo trovato per i criteri di ricerca selezionati';
          }
        } else {
          this.error = response.message || 'Errore nella ricerca voli';
        }
      },
      error: (error) => {
        this.loading = false;
        console.error('Flight search error:', error);
        this.error = error.error?.message || 'Errore nella ricerca voli. Riprova più tardi.';
      }
    });
  }

  private formatDate(date: Date): string {
    if (!date) return '';
    const d = new Date(date);
    return d.toISOString().split('T')[0];
  }

  onSortChange(): void {
    this.sortFlights();
  }

  onClassFilterChange(): void {
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
        this.flights.sort((a, b) => {
          const durationA = this.calculateDuration(a.departureTime, a.arrivalTime);
          const durationB = this.calculateDuration(b.departureTime, b.arrivalTime);
          return durationA - durationB;
        });
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
    return arr.getTime() - dep.getTime();
  }

  private markFormGroupTouched(): void {
    Object.keys(this.searchForm.controls).forEach(key => {
      const control = this.searchForm.get(key);
      control?.markAsTouched();
    });
  }

  private setupCalendarVisibility(): void {
    // Mostra il calendario quando entrambi gli aeroporti sono selezionati
    this.searchForm.valueChanges.subscribe(() => {
      const departureAirport = this.searchForm.get('departureAirport')?.value;
      const arrivalAirport = this.searchForm.get('arrivalAirport')?.value;
      
      this.showCalendar = !!(departureAirport && arrivalAirport);
    });
  }

  onCalendarDateSelected(date: Date): void {
    this.searchForm.patchValue({
      departureDate: date
    });
  }

  onSuggestionsRequested(targetDate: string): void {
    this.suggestedTargetDate = targetDate;
    this.showSuggestions = true;
  }

  onSuggestionDateSelected(dateString: string): void {
    const date = new Date(dateString);
    this.searchForm.patchValue({
      departureDate: date
    });
    this.showSuggestions = false;
  }

  onSuggestionsClosed(): void {
    this.showSuggestions = false;
  }

  getAirportCode(airport: Airport | null): string {
    return airport?.code || '';
  }
}
