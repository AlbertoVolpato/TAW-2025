import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { FlightService } from '../../../../services/flight.service';

export interface DateSuggestion {
  date: string;
  daysDifference: number;
  flightCount: number;
  minPrice: number;
  reason: string;
}

@Component({
  selector: 'app-date-suggestions',
  templateUrl: './date-suggestions.component.html',
  styleUrls: ['./date-suggestions.component.scss']
})
export class DateSuggestionsComponent implements OnChanges {
  @Input() origin: string = '';
  @Input() destination: string = '';
  @Input() targetDate: string = '';
  @Input() passengers: number = 1;
  @Input() seatClass: string = 'economy';
  @Input() visible: boolean = false;
  @Output() dateSelected = new EventEmitter<string>();
  @Output() closed = new EventEmitter<void>();

  suggestions: DateSuggestion[] = [];
  loading = false;
  error: string | null = null;

  constructor(private flightService: FlightService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['visible'] && this.visible && this.targetDate) {
      this.loadSuggestions();
    }
  }

  private loadSuggestions(): void {
    if (!this.origin || !this.destination || !this.targetDate) {
      return;
    }

    this.loading = true;
    this.error = null;

    this.flightService.suggestAlternativeDates(
      this.origin,
      this.destination,
      this.targetDate,
      this.passengers,
      this.seatClass,
      7, // giorni prima
      7  // giorni dopo
    ).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.suggestions = response.data.suggestions;
        } else {
          this.error = 'Nessun suggerimento disponibile per le date alternative.';
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Errore nel caricamento dei suggerimenti:', error);
        this.error = 'Errore nel caricamento dei suggerimenti. Riprova più tardi.';
        this.loading = false;
      }
    });
  }

  onSuggestionSelected(suggestion: DateSuggestion): void {
    this.dateSelected.emit(suggestion.date);
    this.onClose();
  }

  onClose(): void {
    this.visible = false;
    this.closed.emit();
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('it-IT', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR'
    }).format(price);
  }

  getDifferenceText(daysDifference: number): string {
    if (daysDifference === 0) {
      return 'Stesso giorno';
    } else if (daysDifference > 0) {
      return `${daysDifference} giorno${daysDifference > 1 ? 'i' : ''} dopo`;
    } else {
      return `${Math.abs(daysDifference)} giorno${Math.abs(daysDifference) > 1 ? 'i' : ''} prima`;
    }
  }

  getSuggestionIcon(daysDifference: number): string {
    if (daysDifference < 0) {
      return 'arrow_back';
    } else if (daysDifference > 0) {
      return 'arrow_forward';
    } else {
      return 'today';
    }
  }

  trackBySuggestion(index: number, suggestion: DateSuggestion): string {
    return suggestion.date;
  }
}