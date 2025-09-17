import { Request, Response, NextFunction } from 'express';
import flightAvailabilityService from '../services/flightAvailabilityService';

/**
 * Verifica la disponibilità dei voli per un range di date
 * GET /api/flights/availability
 */
export const checkFlightAvailability = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { origin, destination, startDate, endDate, passengers, seatClass } = req.query;

    // Validazione parametri richiesti
    if (!origin || !destination || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Missing required parameters: origin, destination, startDate, endDate'
      });
    }

    const start = new Date(startDate as string);
    const end = new Date(endDate as string);

    // Validazione date
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format. Use YYYY-MM-DD'
      });
    }

    if (start > end) {
      return res.status(400).json({
        success: false,
        message: 'Start date must be before or equal to end date'
      });
    }

    // Limite massimo di 31 giorni per evitare query troppo pesanti
    const daysDifference = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    if (daysDifference > 31) {
      return res.status(400).json({
        success: false,
        message: 'Date range cannot exceed 31 days'
      });
    }

    const availability = await flightAvailabilityService.checkAvailabilityForDateRange({
      origin: origin as string,
      destination: destination as string,
      startDate: start,
      endDate: end,
      passengers: passengers ? parseInt(passengers as string) : 1,
      seatClass: (seatClass as 'economy' | 'business' | 'first') || 'economy'
    });

    return res.status(200).json({
      success: true,
      data: {
        availability,
        summary: {
          totalDays: availability.length,
          availableDays: availability.filter(day => day.available).length,
          unavailableDays: availability.filter(day => !day.available).length
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Suggerisce date alternative per una data specifica
 * GET /api/flights/suggest-dates
 */
export const suggestAlternativeDates = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { origin, destination, targetDate, passengers, seatClass, daysBefore, daysAfter } = req.query;

    // Validazione parametri richiesti
    if (!origin || !destination || !targetDate) {
      return res.status(400).json({
        success: false,
        message: 'Missing required parameters: origin, destination, targetDate'
      });
    }

    const target = new Date(targetDate as string);

    // Validazione data
    if (isNaN(target.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format. Use YYYY-MM-DD'
      });
    }

    const suggestions = await flightAvailabilityService.suggestAlternativeDates(
      origin as string,
      destination as string,
      target,
      passengers ? parseInt(passengers as string) : 1,
      (seatClass as 'economy' | 'business' | 'first') || 'economy',
      daysBefore ? parseInt(daysBefore as string) : 7,
      daysAfter ? parseInt(daysAfter as string) : 7
    );

    return res.status(200).json({
      success: true,
      data: {
        targetDate: targetDate,
        suggestions,
        count: suggestions.length
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Verifica se una data specifica ha voli disponibili
 * GET /api/flights/check-date
 */
export const checkDateAvailability = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { origin, destination, date, passengers, seatClass } = req.query;

    // Validazione parametri richiesti
    if (!origin || !destination || !date) {
      return res.status(400).json({
        success: false,
        message: 'Missing required parameters: origin, destination, date'
      });
    }

    const targetDate = new Date(date as string);

    // Validazione data
    if (isNaN(targetDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format. Use YYYY-MM-DD'
      });
    }

    const isAvailable = await flightAvailabilityService.isDateAvailable(
      origin as string,
      destination as string,
      targetDate,
      passengers ? parseInt(passengers as string) : 1,
      (seatClass as 'economy' | 'business' | 'first') || 'economy'
    );

    return res.status(200).json({
      success: true,
      data: {
        date: date,
        available: isAvailable
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Ottieni le date disponibili per un mese specifico
 * GET /api/flights/available-dates/:year/:month
 */
export const getAvailableDatesForMonth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { year, month } = req.params;
    const { origin, destination, passengers, seatClass } = req.query;

    // Validazione parametri richiesti
    if (!origin || !destination) {
      return res.status(400).json({
        success: false,
        message: 'Missing required parameters: origin, destination'
      });
    }

    const yearNum = parseInt(year);
    const monthNum = parseInt(month);

    // Validazione anno e mese
    if (isNaN(yearNum) || isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
      return res.status(400).json({
        success: false,
        message: 'Invalid year or month. Month must be between 1 and 12'
      });
    }

    const availableDates = await flightAvailabilityService.getAvailableDatesForMonth(
      origin as string,
      destination as string,
      yearNum,
      monthNum,
      passengers ? parseInt(passengers as string) : 1,
      (seatClass as 'economy' | 'business' | 'first') || 'economy'
    );

    return res.status(200).json({
      success: true,
      data: {
        year: yearNum,
        month: monthNum,
        availableDates,
        count: availableDates.length
      }
    });
  } catch (error) {
    next(error);
  }
};