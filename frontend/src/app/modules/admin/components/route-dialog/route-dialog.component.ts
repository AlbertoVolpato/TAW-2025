import { Component, EventEmitter, Input, OnInit, Output, OnChanges, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouteService, Airport } from '../../../../services/route.service';

export interface RouteDialogData {
  route?: any;
  isEdit?: boolean;
}

@Component({
  selector: 'app-route-dialog',
  templateUrl: './route-dialog.component.html',
  styleUrls: ['./route-dialog.component.scss'],
})
export class RouteDialogComponent implements OnInit, OnChanges {
  @Input() isVisible = false;
  @Input() data: RouteDialogData = { isEdit: false };
  @Output() dialogClosed = new EventEmitter<any>();

  routeForm: FormGroup;
  isSubmitting = false;
  errorMessage = '';
  successMessage = '';
  airports: Airport[] = [];

  constructor(private fb: FormBuilder, private routeService: RouteService) {
    this.routeForm = this.fb.group({
      origin: ['', [Validators.required, Validators.pattern(/^[A-Z]{3}$/)]],
      destination: [
        '',
        [Validators.required, Validators.pattern(/^[A-Z]{3}$/)],
      ],
      distance: [null, [Validators.required, Validators.min(1)]],
      flightTime: [null, [Validators.required, Validators.min(1)]],
      status: ['active', Validators.required],
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isVisible'] && changes['isVisible'].currentValue) {
      // Dialog is opening, reset messages
      this.errorMessage = '';
      this.successMessage = '';
      
      if (this.data.route) {
        this.routeForm.patchValue({
          origin: this.data.route.origin || '',
          destination: this.data.route.destination || '',
          distance: this.data.route.distance || null,
          flightTime: this.data.route.flightTime || null,
          status: this.data.route.status || 'active'
        });
      } else {
        // Reset form for new route
        this.routeForm.reset();
        this.routeForm.patchValue({
          origin: '',
          destination: '',
          distance: null,
          flightTime: null,
          status: 'active'
        });
      }
    }
  }

  ngOnInit(): void {
    this.loadAirports();
    
    // Reset messages when dialog opens
    this.errorMessage = '';
    this.successMessage = '';
    
    if (this.data.route) {
      this.routeForm.patchValue({
        origin: this.data.route.origin || '',
        destination: this.data.route.destination || '',
        distance: this.data.route.distance || null,
        flightTime: this.data.route.flightTime || null,
        status: this.data.route.status || 'active'
      });
    } else {
      // Reset form for new route
      this.routeForm.reset();
      this.routeForm.patchValue({
        origin: '',
        destination: '',
        distance: null,
        flightTime: null,
        status: 'active'
      });
    }
  }

  loadAirports(): void {
    this.routeService.getAirports().subscribe({
      next: (response: any) => {
        if (response.success && response.data) {
          this.airports = response.data.airports;
        }
      },
      error: (error: any) => {
        console.error('Error loading airports:', error);
        this.errorMessage = 'Errore nel caricamento degli aeroporti';
      },
    });
  }

  closeDialog(result?: any) {
    // Reset form and messages when closing
    this.routeForm.reset();
    this.errorMessage = '';
    this.successMessage = '';
    this.isSubmitting = false;
    
    // Reset form to default values
    this.routeForm.patchValue({
      origin: '',
      destination: '',
      distance: null,
      flightTime: null,
      status: 'active'
    });
    
    this.dialogClosed.emit(result);
  }

  onCancel(): void {
    this.closeDialog();
  }

  onSubmit(): void {
    if (this.routeForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    const formValue = this.routeForm.value;

    // Converti in maiuscolo i codici aeroporto
    formValue.origin = formValue.origin.toUpperCase();
    formValue.destination = formValue.destination.toUpperCase();

    // Validazione logica: origin e destination non possono essere uguali
    if (formValue.origin === formValue.destination) {
      this.errorMessage =
        'Aeroporto di partenza e arrivo devono essere diversi';
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';
    this.successMessage = '';

    // For now, simulate API call since route management is primarily for airlines
    // In a real admin implementation, you would have dedicated admin APIs
    setTimeout(() => {
      const routeData = {
        id: this.data.route?.id || Date.now().toString(),
        ...formValue,
        airlines: this.data.route?.airlines || ['Sistema'],
        createdAt: this.data.route?.createdAt || new Date(),
      };

      // Show success message first
      this.successMessage = `Rotta ${formValue.origin}-${formValue.destination} ${
        this.data.isEdit ? 'aggiornata' : 'creata'
      } con successo!`;
      this.isSubmitting = false;

      // Close dialog after showing success message
      setTimeout(() => {
        this.closeDialog(routeData);
      }, 1500);
    }, 1000);
  }

  private markFormGroupTouched() {
    Object.keys(this.routeForm.controls).forEach((key) => {
      const control = this.routeForm.get(key);
      control?.markAsTouched();
    });
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.routeForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string): string {
    const field = this.routeForm.get(fieldName);
    if (field && field.errors) {
      if (field.errors['required']) {
        return `${this.getFieldLabel(fieldName)} richiesto`;
      }
      if (field.errors['pattern']) {
        return 'Inserisci codice IATA valido (3 lettere)';
      }
      if (field.errors['min']) {
        return `${this.getFieldLabel(fieldName)} deve essere maggiore di 0`;
      }
    }
    return '';
  }

  private getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      origin: 'Aeroporto di partenza',
      destination: 'Aeroporto di arrivo',
      distance: 'Distanza',
      flightTime: 'Tempo di volo',
    };
    return labels[fieldName] || fieldName;
  }
}
