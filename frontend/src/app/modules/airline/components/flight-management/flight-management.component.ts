import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AirlineService, CreateFlightRequest, CreateAircraftRequest } from '../../../../services/airline.service';
import { FlightService } from '../../../../services/flight.service';
import { Flight, Airport } from '../../../../models/flight.model';

@Component({
  selector: 'app-flight-management',
  templateUrl: './flight-management.component.html',
  styleUrls: ['./flight-management.component.scss']
})
export class FlightManagementComponent implements OnInit {
  flights: Flight[] = [];
  airports: Airport[] = [];
  loading = false;
  error: string | null = null;
  success: string | null = null;
  
  // Forms
  flightForm: FormGroup;
  aircraftForm: FormGroup;
  showFlightForm = false;
  showAircraftForm = false;

  // Aircraft types
  aircraftTypes = [
    { model: 'Boeing 737-800', capacity: 189, type: 'narrow-body' },
    { model: 'Airbus A320', capacity: 180, type: 'narrow-body' },
    { model: 'Boeing 777-300ER', capacity: 396, type: 'wide-body' },
    { model: 'Airbus A350-900', capacity: 325, type: 'wide-body' },
    { model: 'Boeing 787-9', capacity: 290, type: 'wide-body' }
  ];

  constructor(
    private fb: FormBuilder,
    private airlineService: AirlineService,
    private flightService: FlightService
  ) {
    this.flightForm = this.fb.group({
      flightNumber: ['', [Validators.required, Validators.pattern(/^[A-Z]{2}\d{3,4}$/)]],
      departureAirport: ['', Validators.required],
      arrivalAirport: ['', Validators.required],
      departureTime: ['', Validators.required],
      arrivalTime: ['', Validators.required],
      aircraft: ['', Validators.required],
      economyPrice: ['', [Validators.required, Validators.min(0)]],
      businessPrice: ['', [Validators.required, Validators.min(0)]],
      firstPrice: ['', [Validators.required, Validators.min(0)]],
      gate: [''],
      terminal: ['']
    });

    this.aircraftForm = this.fb.group({
      model: ['', Validators.required],
      registrationNumber: ['', [Validators.required, Validators.pattern(/^[A-Z]{1,2}-[A-Z0-9]{3,6}$/)]],
      capacity: ['', [Validators.required, Validators.min(50)]],
      type: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadFlights();
    this.loadAirports();
  }

  loadFlights(): void {
    this.loading = true;
    this.error = null;

    this.airlineService.getAirlineFlights().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.flights = response.data.flights || [];
        }
        this.loading = false;
      },
      error: (error) => {
        this.error = error.error?.message || 'Errore nel caricamento dei voli';
        this.loading = false;
        console.error('Error loading flights:', error);
      }
    });
  }

  loadAirports(): void {
    this.flightService.getAirports().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.airports = response.data.airports || [];
        }
      },
      error: (error) => {
        console.error('Error loading airports:', error);
      }
    });
  }

  toggleFlightForm(): void {
    this.showFlightForm = !this.showFlightForm;
    this.error = null;
    this.success = null;
    if (!this.showFlightForm) {
      this.flightForm.reset();
    }
  }

  toggleAircraftForm(): void {
    this.showAircraftForm = !this.showAircraftForm;
    this.error = null;
    this.success = null;
    if (!this.showAircraftForm) {
      this.aircraftForm.reset();
    }
  }

  onCreateFlight(): void {
    if (this.flightForm.invalid) {
      this.markFormGroupTouched(this.flightForm);
      return;
    }

    this.loading = true;
    this.error = null;
    this.success = null;
    
    const formData: CreateFlightRequest = this.flightForm.value;

    this.airlineService.createFlight(formData).subscribe({
      next: (response) => {
        if (response.success) {
          this.success = 'Volo creato con successo!';
          this.showFlightForm = false;
          this.flightForm.reset();
          this.loadFlights(); // Reload flights
        }
        this.loading = false;
      },
      error: (error) => {
        this.error = error.error?.message || 'Errore nella creazione del volo';
        this.loading = false;
        console.error('Error creating flight:', error);
      }
    });
  }

  onCreateAircraft(): void {
    if (this.aircraftForm.invalid) {
      this.markFormGroupTouched(this.aircraftForm);
      return;
    }

    this.loading = true;
    this.error = null;
    this.success = null;
    
    const formData: CreateAircraftRequest = this.aircraftForm.value;

    this.airlineService.createAircraft(formData).subscribe({
      next: (response) => {
        if (response.success) {
          this.success = 'Aeromobile registrato con successo!';
          this.showAircraftForm = false;
          this.aircraftForm.reset();
        }
        this.loading = false;
      },
      error: (error) => {
        this.error = error.error?.message || 'Errore nella registrazione dell\'aeromobile';
        this.loading = false;
        console.error('Error creating aircraft:', error);
      }
    });
  }

  deleteFlight(flight: Flight): void {
    if (confirm(`Sei sicuro di voler eliminare il volo ${flight.flightNumber}?`)) {
      this.loading = true;
      this.error = null;
      this.success = null;
      
      this.airlineService.deleteFlight(flight._id).subscribe({
        next: (response) => {
          if (response.success) {
            this.success = 'Volo eliminato con successo';
            this.loadFlights(); // Reload flights
          }
          this.loading = false;
        },
        error: (error) => {
          this.error = error.error?.message || 'Errore nell\'eliminazione del volo';
          this.loading = false;
          console.error('Error deleting flight:', error);
        }
      });
    }
  }

  getFlightStatusColor(status: string): string {
    const statusColors: { [key: string]: string } = {
      'scheduled': 'primary',
      'boarding': 'accent',
      'departed': 'warn',
      'arrived': 'primary',
      'cancelled': 'warn',
      'delayed': 'accent'
    };
    return statusColors[status] || 'primary';
  }

  getFlightStatusText(status: string): string {
    const statusTexts: { [key: string]: string } = {
      'scheduled': 'Programmato',
      'boarding': 'Imbarco',
      'departed': 'Partito',
      'arrived': 'Arrivato',
      'cancelled': 'Cancellato',
      'delayed': 'Ritardato'
    };
    return statusTexts[status] || status;
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }
}