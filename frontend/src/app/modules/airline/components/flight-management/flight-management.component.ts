import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
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

    this.flightService.getAllFlights().subscribe({
      next: (response: any) => {
        if (response.success && response.data) {
          // In a real app, filter by airline
          this.flights = response.data.flights || [];
        }
        this.loading = false;
      },
      error: (error: any) => {
        this.error = 'Errore nel caricamento dei voli';
        this.loading = false;
        console.error('Error loading flights:', error);
      }
    });
  }

  loadAirports(): void {
    this.flightService.getAirports().subscribe({
      next: (response: any) => {
        if (response.success && response.data) {
          this.airports = response.data.airports || [];
        }
      },
      error: (error: any) => {
        console.error('Error loading airports:', error);
      }
    });
  }

  toggleFlightForm(): void {
    this.showFlightForm = !this.showFlightForm;
    if (!this.showFlightForm) {
      this.flightForm.reset();
    }
  }

  toggleAircraftForm(): void {
    this.showAircraftForm = !this.showAircraftForm;
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
    const formData = this.flightForm.value;

    // In a real implementation, this would call an API to create the flight
    console.log('Creating flight:', formData);
    
    // Simulate API call
    setTimeout(() => {
      this.loading = false;
      this.showFlightForm = false;
      this.flightForm.reset();
      this.loadFlights(); // Reload flights
    }, 1000);
  }

  onCreateAircraft(): void {
    if (this.aircraftForm.invalid) {
      this.markFormGroupTouched(this.aircraftForm);
      return;
    }

    this.loading = true;
    const formData = this.aircraftForm.value;

    // In a real implementation, this would call an API to create the aircraft
    console.log('Creating aircraft:', formData);
    
    // Simulate API call
    setTimeout(() => {
      this.loading = false;
      this.showAircraftForm = false;
      this.aircraftForm.reset();
    }, 1000);
  }

  deleteFlight(flight: Flight): void {
    if (confirm(`Sei sicuro di voler eliminare il volo ${flight.flightNumber}?`)) {
      this.loading = true;
      
      // In a real implementation, this would call an API to delete the flight
      console.log('Deleting flight:', flight);
      
      // Simulate API call
      setTimeout(() => {
        this.flights = this.flights.filter(f => f._id !== flight._id);
        this.loading = false;
      }, 500);
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