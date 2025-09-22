import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouteService } from '../../../../services/route.service';
import { FlightService } from '../../../../services/flight.service';

interface Airport {
  _id: string;
  code: string;
  name: string;
  city: string;
  country: string;
}

interface AirlineRoute {
  _id: string;
  routeCode: string;
  origin: Airport;
  destination: Airport;
  distance: number;
  estimatedDuration: number;
  isActive: boolean;
  createdAt: string;
}

@Component({
  selector: 'app-airline-route-management',
  templateUrl: './airline-route-management.component.html',
  styleUrls: ['./airline-route-management.component.scss'],
})
export class AirlineRouteManagementComponent implements OnInit {
  // Route Form
  routeForm: FormGroup;
  showRouteForm = false;

  // Data
  routes: AirlineRoute[] = [];
  airports: Airport[] = [];

  // State
  isLoading = true;
  loading = false;
  errorMessage: string = '';
  success: string | null = null;
  error: string | null = null;

  constructor(
    private fb: FormBuilder,
    private routeService: RouteService,
    private flightService: FlightService
  ) {
    this.routeForm = this.fb.group({
      routeCode: [
        '',
        [Validators.required, Validators.pattern(/^[A-Z]{2}\d{3,4}$/)],
      ],
      origin: ['', Validators.required],
      destination: ['', Validators.required],
      distance: ['', [Validators.required, Validators.min(1)]],
      estimatedDuration: ['', [Validators.required, Validators.min(30)]],
      // Operating days as individual checkboxes
      monday: [true],
      tuesday: [true],
      wednesday: [true],
      thursday: [true],
      friday: [true],
      saturday: [true],
      sunday: [true],
      // Seasonality dates (required by backend)
      startDate: ['', Validators.required],
      endDate: ['', Validators.required],
      isActive: [true],
    });
  }

  ngOnInit(): void {
    this.loadRoutes();
    this.loadAirports();
  }

  loadRoutes(): void {
    this.isLoading = true;
    this.error = null;

    this.routeService.getAirlineRoutes().subscribe({
      next: (response: any) => {
        if (response.success && response.data) {
          this.routes = response.data;
          console.log(`Loaded ${response.data.length} routes for airline`);
        } else {
          console.error('Invalid API response structure:', response);
          this.error = 'Error loading routes';
        }
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('Error loading airline routes:', error);
        this.error = 'Error loading routes';
        this.isLoading = false;
      },
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
      },
    });
  }

  toggleRouteForm(): void {
    this.showRouteForm = !this.showRouteForm;
    if (this.showRouteForm) {
      this.routeForm.reset();
      this.routeForm.patchValue({ isActive: true });
    }
  }

  onCreateRoute(): void {
    this.onSubmitRoute();
  }

  onSubmitRoute(): void {
    if (this.routeForm.valid) {
      this.loading = true;
      const formData = this.routeForm.value;

      // Validate dates
      const startDate = new Date(formData.startDate);
      const endDate = new Date(formData.endDate);

      if (endDate <= startDate) {
        this.error = 'End date must be after start date';
        this.loading = false;
        return;
      }

      const routeData = {
        routeCode: formData.routeCode.toUpperCase(),
        origin: formData.origin, // Airport ObjectId
        destination: formData.destination, // Airport ObjectId
        distance: Number(formData.distance),
        estimatedDuration: Number(formData.estimatedDuration),
        // Backend expects operatingDays as object
        operatingDays: {
          monday: formData.monday,
          tuesday: formData.tuesday,
          wednesday: formData.wednesday,
          thursday: formData.thursday,
          friday: formData.friday,
          saturday: formData.saturday,
          sunday: formData.sunday,
        },
        // Backend requires seasonality with dates
        seasonality: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        },
      };

      this.routeService.createAirlineRoute(routeData).subscribe({
        next: (response: any) => {
          if (response.success) {
            console.log('Route created successfully');
            this.success = 'Route created successfully';
            this.error = null;
            this.loadRoutes();
            this.showRouteForm = false;
            this.routeForm.reset();
            // Reset to default values
            this.routeForm.patchValue({
              monday: true,
              tuesday: true,
              wednesday: true,
              thursday: true,
              friday: true,
              saturday: true,
              sunday: true,
              isActive: true,
            });

            // Clear success message after 3 seconds
            setTimeout(() => {
              this.success = null;
            }, 3000);
          } else {
            this.error = 'Error creating route';
            this.success = null;
          }
          this.loading = false;
        },
        error: (error: any) => {
          console.error('Error creating route:', error);
          this.error = 'Error creating route';
          this.success = null;
          this.loading = false;
        },
      });
    }
  }

  cancelRouteForm(): void {
    this.showRouteForm = false;
    this.routeForm.reset();
  }

  deleteRoute(routeId: string): void {
    if (confirm('Are you sure you want to delete this route?')) {
      this.routeService.deleteAirlineRoute(routeId).subscribe({
        next: (response: any) => {
          if (response.success) {
            console.log('Route deleted successfully');
            this.loadRoutes();
          }
        },
        error: (error: any) => {
          console.error('Error deleting route:', error);
        },
      });
    }
  }

  onRouteCodeInput(event: any): void {
    const input = event.target;
    const value = input.value.toUpperCase();
    this.routeForm.patchValue({ routeCode: value });
  }

  private markFormGroupTouched(formGroup: any): void {
    Object.keys(formGroup.controls).forEach((field) => {
      const control = formGroup.get(field);
      control?.markAsTouched({ onlySelf: true });
    });
  }
}
