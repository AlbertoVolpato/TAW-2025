import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { FlightService } from '../../../../services/flight.service';
import { MatCalendarCellClassFunction } from '@angular/material/datepicker';

export interface DateAvailability {
  date: string;
  available: boolean;
  flightCount: number;
  minPrice?: number;
}

@Component({
  selector: 'app-flight-calendar',
  templateUrl: './flight-calendar.component.html',
  styleUrls: ['./flight-calendar.component.scss']
})
export class FlightCalendarComponent implements OnInit, OnChanges {
  @Input() origin: string = '';
  @Input() destination: string = '';
  @Input() passengers: number = 1;
  @Input() seatClass: string = 'economy';
  @Input() selectedDate: Date | null = null;
  @Output() dateSelected = new EventEmitter<Date>();
  @Output() suggestionsRequested = new EventEmitter<string>();

  availableDates: Set<string> = new Set();
  loading = false;
  currentMonth: Date = new Date();
  minDate = new Date();

  constructor(private flightService: FlightService) {}

  ngOnInit(): void {
    this.loadAvailableDates();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['origin'] || changes['destination'] || changes['passengers'] || changes['seatClass']) {
      if (this.origin && this.destination) {
        this.loadAvailableDates();
      }
    }
  }

  onMonthChanged(date: Date): void {
    this.currentMonth = date;
    this.loadAvailableDates();
  }

  onDateSelected(date: Date | null): void {
    if (!date) return;
    
    this.selectedDate = date;
    this.dateSelected.emit(date);
  }

  showAlternativeDates(): void {
    const today = new Date();
    const targetDate = this.selectedDate || today;
    const dateString = this.formatDate(targetDate);
    this.suggestionsRequested.emit(dateString);
  }

  private loadAvailableDates(): void {
    if (!this.origin || !this.destination) {
      return;
    }

    this.loading = true;
    const year = this.currentMonth.getFullYear();
    const month = this.currentMonth.getMonth() + 1;

    this.flightService.getAvailableDates(
      year, 
      month, 
      this.origin, 
      this.destination, 
      this.passengers, 
      this.seatClass
    ).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.availableDates = new Set(response.data.availableDates);
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Errore nel caricamento delle date disponibili:', error);
        this.loading = false;
      }
    });
  }

  // Funzione per personalizzare le classi CSS delle celle del calendario
  dateClass: MatCalendarCellClassFunction<Date> = (cellDate, view) => {
    if (view === 'month') {
      const dateString = this.formatDate(cellDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Date passate sono disabilitate
      if (cellDate < today) {
        return 'unavailable';
      }
      
      // Controlla se la data è disponibile
      return this.availableDates.has(dateString) ? 'available' : 'unavailable';
    }
    return '';
  };

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // Metodo per verificare se una data è selezionabile
  dateFilter = (date: Date | null): boolean => {
    if (!date) return false;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Disabilita date passate
    if (date < today) {
      return false;
    }
    
    const dateString = this.formatDate(date);
    // Permetti solo le date disponibili
    return this.availableDates.has(dateString);
  };
}