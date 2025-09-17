import { Component, Input, OnInit } from '@angular/core';
import { Flight } from '../../../../models/flight.model';

@Component({
  selector: 'app-flight-list',
  templateUrl: './flight-list.component.html',
  styleUrls: ['./flight-list.component.scss']
})
export class FlightListComponent implements OnInit {
  @Input() flights: Flight[] = [];
  @Input() loading: boolean = false;

  constructor() {}

  ngOnInit(): void {}

  trackByFlightId(index: number, flight: Flight): string {
    return flight._id || index.toString();
  }

  formatDuration(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR'
    }).format(price);
  }

  formatTime(date: Date | string): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleTimeString('it-IT', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatDate(date: Date | string): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  getClassDisplayName(flightClass: string): string {
    const classNames: { [key: string]: string } = {
      'economy': 'Economy',
      'business': 'Business',
      'first': 'Prima Classe'
    };
    return classNames[flightClass] || flightClass;
  }

  getClassColor(flightClass: string): string {
    const classColors: { [key: string]: string } = {
      'economy': 'primary',
      'business': 'accent',
      'first': 'warn'
    };
    return classColors[flightClass] || 'primary';
  }

  getClassBadgeStyle(flightClass: string): string {
    const classStyles: { [key: string]: string } = {
      'economy': 'bg-blue-100 text-blue-800',
      'business': 'bg-purple-100 text-purple-800',
      'first': 'bg-amber-100 text-amber-800'
    };
    return classStyles[flightClass] || 'bg-gray-100 text-gray-800';
  }

  getAvailableSeats(flight: Flight): number {
    if (!flight.seats || flight.seats.length === 0) {
      return 0;
    }
    return flight.seats.filter(seat => seat.isAvailable).length;
  }

  getFlightStatus(status: string): string {
    const statusMap: { [key: string]: string } = {
      'scheduled': 'Programmato',
      'boarding': 'Imbarco',
      'departed': 'Partito',
      'arrived': 'Arrivato',
      'cancelled': 'Cancellato',
      'delayed': 'Ritardato'
    };
    return statusMap[status] || 'In orario';
  }

  onSelectFlight(flight: Flight): void {
    // TODO: Implementare la selezione del volo per la prenotazione
    console.log('Volo selezionato:', flight);
  }
}
