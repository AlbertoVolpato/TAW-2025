import { Flight } from '../models/Flight';
import { Airport } from '../models/Airport';
import mongoose from 'mongoose';

export interface FlightAvailabilityQuery {
  origin: string; // Airport code
  destination: string; // Airport code
  startDate: Date;
  endDate: Date;
  passengers?: number;
  seatClass?: 'economy' | 'business' | 'first';
}

export interface DateAvailability {
  date: string; // YYYY-MM-DD format
  available: boolean;
  flightCount: number;
  minPrice?: number;
  maxPrice?: number;
}

export interface AlternativeDateSuggestion {
  date: string;
  daysDifference: number;
  flightCount: number;
  minPrice: number;
  reason: string;
}

class FlightAvailabilityService {
  /**
   * Verifica la disponibilità dei voli per un range di date
   */
  async checkAvailabilityForDateRange(query: FlightAvailabilityQuery): Promise<DateAvailability[]> {
    try {
      // Trova gli aeroporti
      const [originAirport, destinationAirport] = await Promise.all([
        Airport.findOne({ code: query.origin.toUpperCase() }),
        Airport.findOne({ code: query.destination.toUpperCase() })
      ]);

      if (!originAirport || !destinationAirport) {
        throw new Error('Airport not found');
      }

      const passengers = query.passengers || 1;
      const seatClass = query.seatClass || 'economy';
      const results: DateAvailability[] = [];

      // Itera attraverso ogni giorno nel range
      const currentDate = new Date(query.startDate);
      const endDate = new Date(query.endDate);

      while (currentDate <= endDate) {
        const startOfDay = new Date(currentDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(currentDate);
        endOfDay.setHours(23, 59, 59, 999);

        // Cerca voli per questa data
        const flights = await Flight.find({
          departureAirport: originAirport._id,
          arrivalAirport: destinationAirport._id,
          departureTime: { $gte: startOfDay, $lte: endOfDay },
          status: { $in: ['scheduled', 'boarding'] },
          isActive: true
        }).populate('airline', 'name code');

        // Filtra voli con posti disponibili
        const availableFlights = flights.filter(flight => {
          const availableSeats = flight.seats.filter(seat => 
            seat.class === seatClass && seat.isAvailable
          );
          return availableSeats.length >= passengers;
        });

        const prices = availableFlights.map(flight => flight.basePrice[seatClass]);
        
        results.push({
          date: currentDate.toISOString().split('T')[0],
          available: availableFlights.length > 0,
          flightCount: availableFlights.length,
          minPrice: prices.length > 0 ? Math.min(...prices) : undefined,
          maxPrice: prices.length > 0 ? Math.max(...prices) : undefined
        });

        // Passa al giorno successivo
        currentDate.setDate(currentDate.getDate() + 1);
      }

      return results;
    } catch (error) {
      console.error('Error checking flight availability:', error);
      throw error;
    }
  }

  /**
   * Suggerisce date alternative quando una data specifica non ha voli disponibili
   */
  async suggestAlternativeDates(
    origin: string,
    destination: string,
    targetDate: Date,
    passengers: number = 1,
    seatClass: 'economy' | 'business' | 'first' = 'economy',
    daysBefore: number = 7,
    daysAfter: number = 7
  ): Promise<AlternativeDateSuggestion[]> {
    try {
      // Calcola il range di date da controllare
      const startDate = new Date(targetDate);
      startDate.setDate(startDate.getDate() - daysBefore);
      
      const endDate = new Date(targetDate);
      endDate.setDate(endDate.getDate() + daysAfter);

      // Ottieni la disponibilità per il range
      const availability = await this.checkAvailabilityForDateRange({
        origin,
        destination,
        startDate,
        endDate,
        passengers,
        seatClass
      });

      // Filtra solo le date disponibili (escludendo la data target)
      const targetDateStr = targetDate.toISOString().split('T')[0];
      const availableDates = availability.filter(day => 
        day.available && day.date !== targetDateStr
      );

      // Crea suggerimenti con calcolo della differenza in giorni
      const suggestions: AlternativeDateSuggestion[] = availableDates.map(day => {
        const dayDate = new Date(day.date);
        const daysDifference = Math.abs(
          Math.floor((dayDate.getTime() - targetDate.getTime()) / (1000 * 60 * 60 * 24))
        );

        let reason = '';
        if (dayDate < targetDate) {
          reason = `${daysDifference} giorni prima`;
        } else {
          reason = `${daysDifference} giorni dopo`;
        }

        return {
          date: day.date,
          daysDifference,
          flightCount: day.flightCount,
          minPrice: day.minPrice || 0,
          reason
        };
      });

      // Ordina per vicinanza alla data target, poi per prezzo
      suggestions.sort((a, b) => {
        if (a.daysDifference !== b.daysDifference) {
          return a.daysDifference - b.daysDifference;
        }
        return a.minPrice - b.minPrice;
      });

      // Restituisci massimo 10 suggerimenti
      return suggestions.slice(0, 10);
    } catch (error) {
      console.error('Error suggesting alternative dates:', error);
      throw error;
    }
  }

  /**
   * Verifica se una data specifica ha voli disponibili
   */
  async isDateAvailable(
    origin: string,
    destination: string,
    date: Date,
    passengers: number = 1,
    seatClass: 'economy' | 'business' | 'first' = 'economy'
  ): Promise<boolean> {
    try {
      const availability = await this.checkAvailabilityForDateRange({
        origin,
        destination,
        startDate: date,
        endDate: date,
        passengers,
        seatClass
      });

      return availability.length > 0 && availability[0].available;
    } catch (error) {
      console.error('Error checking date availability:', error);
      return false;
    }
  }

  /**
   * Ottieni le date disponibili per un mese specifico
   */
  async getAvailableDatesForMonth(
    origin: string,
    destination: string,
    year: number,
    month: number, // 1-12
    passengers: number = 1,
    seatClass: 'economy' | 'business' | 'first' = 'economy'
  ): Promise<string[]> {
    try {
      // Primo e ultimo giorno del mese
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0); // Ultimo giorno del mese

      const availability = await this.checkAvailabilityForDateRange({
        origin,
        destination,
        startDate,
        endDate,
        passengers,
        seatClass
      });

      return availability
        .filter(day => day.available)
        .map(day => day.date);
    } catch (error) {
      console.error('Error getting available dates for month:', error);
      return [];
    }
  }
}

export const flightAvailabilityService = new FlightAvailabilityService();
export default flightAvailabilityService;