import { Request, Response } from 'express';
import { Flight, IFlight } from '../models/Flight';
import { Airport } from '../models/Airport';
import { Airline } from '../models/Airline';
import mongoose from 'mongoose';

// Search flights with optional layovers
export const searchFlights = async (req: Request, res: Response) => {
  try {
    const {
      origin,
      destination,
      departureDate,
      returnDate,
      passengers = 1,
      class: seatClass = 'economy',
      maxLayovers = 1,
      minLayoverTime = 120 // minimum 2 hours in minutes
    } = req.query;

    // Validate required parameters
    if (!origin || !destination || !departureDate) {
      return res.status(400).json({
        success: false,
        message: 'Origin, destination, and departure date are required'
      });
    }

    // Validate airports exist
    // First try to find by code (IATA), then by ObjectId if it's a valid ObjectId
    const originQuery = mongoose.Types.ObjectId.isValid(origin as string) && (origin as string).length === 24
      ? { $or: [{ code: origin }, { _id: origin }] }
      : { code: origin };
    
    const destinationQuery = mongoose.Types.ObjectId.isValid(destination as string) && (destination as string).length === 24
      ? { $or: [{ code: destination }, { _id: destination }] }
      : { code: destination };
    
    const [originAirport, destinationAirport] = await Promise.all([
      Airport.findOne(originQuery),
      Airport.findOne(destinationQuery)
    ]);

    if (!originAirport || !destinationAirport) {
      return res.status(400).json({
        success: false,
        message: 'Invalid origin or destination airport'
      });
    }

    const searchDate = new Date(departureDate as string);
    const startOfDay = new Date(searchDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(searchDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Search for direct flights
    const directFlights = await Flight.find({
      departureAirport: originAirport._id,
      arrivalAirport: destinationAirport._id,
      departureTime: { $gte: startOfDay, $lte: endOfDay },
      status: { $in: ['scheduled', 'boarding'] },
      isActive: true
    })
      .populate('airline', 'name code')
      .populate('departureAirport', 'name city country code')
      .populate('arrivalAirport', 'name city country code')
      .sort({ departureTime: 1 });

    let connectingFlights: any[] = [];

    // Search for connecting flights if maxLayovers > 0
    if (Number(maxLayovers) > 0) {
      // Find flights from origin to any intermediate airport
      const firstLegFlights = await Flight.find({
        departureAirport: originAirport._id,
        arrivalAirport: { $ne: destinationAirport._id },
        departureTime: { $gte: startOfDay, $lte: endOfDay },
        status: { $in: ['scheduled', 'boarding'] },
        isActive: true
      })
        .populate('airline', 'name code')
        .populate('departureAirport', 'name city country code')
        .populate('arrivalAirport', 'name city country code')
        .sort({ departureTime: 1 });

      // For each first leg flight, find connecting flights
      for (const firstFlight of firstLegFlights) {
        const layoverAirport = firstFlight.arrivalAirport;
        const minConnectionTime = new Date(firstFlight.arrivalTime);
        minConnectionTime.setMinutes(minConnectionTime.getMinutes() + Number(minLayoverTime));
        
        const maxConnectionTime = new Date(firstFlight.arrivalTime);
        maxConnectionTime.setHours(maxConnectionTime.getHours() + 12); // Max 12 hours layover

        const secondLegFlights = await Flight.find({
          departureAirport: layoverAirport._id,
          arrivalAirport: destinationAirport._id,
          departureTime: { $gte: minConnectionTime, $lte: maxConnectionTime },
          status: { $in: ['scheduled', 'boarding'] },
          isActive: true
        })
          .populate('airline', 'name code')
          .populate('departureAirport', 'name city country code')
          .populate('arrivalAirport', 'name city country code');

        // Create connecting flight combinations
        for (const secondFlight of secondLegFlights) {
          const layoverDuration = Math.floor(
            (secondFlight.departureTime.getTime() - firstFlight.arrivalTime.getTime()) / (1000 * 60)
          );

          connectingFlights.push({
            type: 'connecting',
            totalDuration: firstFlight.duration + secondFlight.duration + layoverDuration,
            totalPrice: {
              economy: firstFlight.basePrice.economy + secondFlight.basePrice.economy,
              business: firstFlight.basePrice.business + secondFlight.basePrice.business,
              first: firstFlight.basePrice.first + secondFlight.basePrice.first
            },
            layovers: 1,
            segments: [
              {
                flight: firstFlight,
                segmentType: 'departure'
              },
              {
                layover: {
                  airport: layoverAirport,
                  duration: layoverDuration
                }
              },
              {
                flight: secondFlight,
                segmentType: 'arrival'
              }
            ]
          });
        }
      }
    }

    // Format direct flights
    const formattedDirectFlights = directFlights.map(flight => ({
      type: 'direct',
      totalDuration: flight.duration,
      totalPrice: flight.basePrice,
      layovers: 0,
      segments: [
        {
          flight: flight,
          segmentType: 'direct'
        }
      ]
    }));

    // Combine and sort all flights by total duration
    const allFlights = [...formattedDirectFlights, ...connectingFlights]
      .sort((a, b) => a.totalDuration - b.totalDuration);

    res.json({
      success: true,
      data: {
        flights: allFlights,
        searchCriteria: {
          origin: originAirport,
          destination: destinationAirport,
          departureDate: searchDate,
          passengers: Number(passengers),
          class: seatClass,
          maxLayovers: Number(maxLayovers)
        },
        summary: {
          total: allFlights.length,
          direct: formattedDirectFlights.length,
          connecting: connectingFlights.length
        }
      }
    });
  } catch (error) {
    console.error('Error searching flights:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get all flights (with filters)
export const getAllFlights = async (req: Request, res: Response) => {
  try {
    const {
      page = 1,
      limit = 20,
      airline,
      origin,
      destination,
      date,
      status
    } = req.query;

    const filter: any = { isActive: true };

    if (airline) {
      filter.airline = airline;
    }

    if (origin) {
      filter.departureAirport = origin;
    }

    if (destination) {
      filter.arrivalAirport = destination;
    }

    if (date) {
      const searchDate = new Date(date as string);
      const startOfDay = new Date(searchDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(searchDate);
      endOfDay.setHours(23, 59, 59, 999);
      filter.departureTime = { $gte: startOfDay, $lte: endOfDay };
    }

    if (status) {
      filter.status = status;
    }

    const flights = await Flight.find(filter)
      .populate('airline', 'name code')
      .populate('departureAirport', 'name city country code')
      .populate('arrivalAirport', 'name city country code')
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit))
      .sort({ departureTime: 1 });

    const total = await Flight.countDocuments(filter);

    res.json({
      success: true,
      data: {
        flights,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      }
    });
  } catch (error) {
    console.error('Error fetching flights:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get flight by ID
export const getFlightById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid flight ID'
      });
    }

    const flight = await Flight.findById(id)
      .populate('airline', 'name code')
      .populate('departureAirport', 'name city country code')
      .populate('arrivalAirport', 'name city country code');

    if (!flight) {
      return res.status(404).json({
        success: false,
        message: 'Flight not found'
      });
    }

    res.json({
      success: true,
      data: { flight }
    });
  } catch (error) {
    console.error('Error fetching flight:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Create new flight (airline only)
export const createFlight = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId || req.user?.role !== 'airline') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Airline account required.'
      });
    }

    // Find the airline associated with this user
    const airline = await Airline.findOne({ userId, isActive: true });
    if (!airline) {
      return res.status(404).json({
        success: false,
        message: 'No airline found for current user'
      });
    }

    const {
      flightNumber,
      departureAirport,
      arrivalAirport,
      departureTime,
      arrivalTime,
      aircraft,
      basePrice,
      baggage,
      services
    } = req.body;

    // Validate required fields
    if (!flightNumber || !departureAirport || !arrivalAirport || !departureTime || !arrivalTime) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Validate airports exist
    const [depAirport, arrAirport] = await Promise.all([
      Airport.findById(departureAirport),
      Airport.findById(arrivalAirport)
    ]);

    if (!depAirport || !arrAirport) {
      return res.status(400).json({
        success: false,
        message: 'Invalid departure or arrival airport'
      });
    }

    // Check if flight number already exists for the same date
    const existingFlight = await Flight.findOne({
      flightNumber: flightNumber.toUpperCase(),
      airline: airline._id,
      departureTime: {
        $gte: new Date(new Date(departureTime).setHours(0, 0, 0, 0)),
        $lt: new Date(new Date(departureTime).setHours(23, 59, 59, 999))
      }
    });

    if (existingFlight) {
      return res.status(400).json({
        success: false,
        message: 'Flight with this number already exists for the selected date'
      });
    }

    // Calculate duration
    const duration = Math.floor(
      (new Date(arrivalTime).getTime() - new Date(departureTime).getTime()) / (1000 * 60)
    );

    // Generate seats based on aircraft capacity
    const seats = [];
    const capacity = aircraft.capacity;
    const economySeats = Math.floor(capacity * 0.8);
    const businessSeats = Math.floor(capacity * 0.15);
    const firstSeats = capacity - economySeats - businessSeats;

    // Generate economy seats
    for (let i = 1; i <= economySeats; i++) {
      seats.push({
        seatNumber: `${Math.ceil(i / 6)}${String.fromCharCode(65 + ((i - 1) % 6))}`,
        class: 'economy',
        isAvailable: true,
        price: basePrice.economy
      });
    }

    // Generate business seats
    for (let i = 1; i <= businessSeats; i++) {
      seats.push({
        seatNumber: `B${i}${String.fromCharCode(65 + ((i - 1) % 4))}`,
        class: 'business',
        isAvailable: true,
        price: basePrice.business
      });
    }

    // Generate first class seats
    for (let i = 1; i <= firstSeats; i++) {
      seats.push({
        seatNumber: `F${i}${String.fromCharCode(65 + ((i - 1) % 2))}`,
        class: 'first',
        isAvailable: true,
        price: basePrice.first
      });
    }

    const newFlight = new Flight({
      flightNumber: flightNumber.toUpperCase(),
      airline: airline._id,
      departureAirport,
      arrivalAirport,
      departureTime: new Date(departureTime),
      arrivalTime: new Date(arrivalTime),
      duration,
      aircraft,
      seats,
      basePrice,
      baggage: baggage || {
        carryOn: { maxWeight: 7, maxDimensions: '55x40x20 cm' },
        checked: { included: 1, maxWeight: 23, extraBagPrice: 50 }
      },
      services: services || {
        meal: false,
        wifi: false,
        entertainment: false,
        extraLegroom: false
      }
    });

    await newFlight.save();

    const populatedFlight = await Flight.findById(newFlight._id)
      .populate('airline', 'name code')
      .populate('departureAirport', 'name city country code')
      .populate('arrivalAirport', 'name city country code');

    return res.status(201).json({
      success: true,
      data: { flight: populatedFlight },
      message: 'Flight created successfully'
    });
  } catch (error) {
    console.error('Error creating flight:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Update flight (airline only)
export const updateFlight = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;

    if (!userId || req.user?.role !== 'airline') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Airline account required.'
      });
    }

    // Find the airline associated with this user
    const airline = await Airline.findOne({ userId, isActive: true });
    if (!airline) {
      return res.status(404).json({
        success: false,
        message: 'No airline found for current user'
      });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid flight ID'
      });
    }

    // Find flight and verify ownership
    const flight = await Flight.findOne({ _id: id, airline: airline._id });

    if (!flight) {
      return res.status(404).json({
        success: false,
        message: 'Flight not found or access denied'
      });
    }

    const updateData = req.body;

    // Recalculate duration if times are updated
    if (updateData.departureTime || updateData.arrivalTime) {
      const depTime = updateData.departureTime ? new Date(updateData.departureTime) : flight.departureTime;
      const arrTime = updateData.arrivalTime ? new Date(updateData.arrivalTime) : flight.arrivalTime;
      updateData.duration = Math.floor((arrTime.getTime() - depTime.getTime()) / (1000 * 60));
    }

    const updatedFlight = await Flight.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    )
      .populate('airline', 'name code')
      .populate('departureAirport', 'name city country code')
      .populate('arrivalAirport', 'name city country code');

    res.json({
      success: true,
      data: { flight: updatedFlight },
      message: 'Flight updated successfully'
    });
  } catch (error) {
    console.error('Error updating flight:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Delete flight (airline only)
export const deleteFlight = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;

    if (!userId || req.user?.role !== 'airline') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Airline account required.'
      });
    }

    // Find the airline associated with this user
    const airline = await Airline.findOne({ userId, isActive: true });
    if (!airline) {
      return res.status(404).json({
        success: false,
        message: 'No airline found for current user'
      });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid flight ID'
      });
    }

    // Find flight and verify ownership
    const flight = await Flight.findOne({ _id: id, airline: airline._id });

    if (!flight) {
      return res.status(404).json({
        success: false,
        message: 'Flight not found or access denied'
      });
    }

    // Soft delete by setting isActive to false
    await Flight.findByIdAndUpdate(id, { isActive: false, status: 'cancelled' });

    res.json({
      success: true,
      message: 'Flight cancelled successfully'
    });
  } catch (error) {
    console.error('Error deleting flight:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get flights for airline (airline only)
export const getAirlineFlights = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId || req.user?.role !== 'airline') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Airline account required.'
      });
    }

    // Find the airline associated with this user
    const airline = await Airline.findOne({ userId, isActive: true });
    if (!airline) {
      return res.status(404).json({
        success: false,
        message: 'No airline found for current user'
      });
    }

    const { page = 1, limit = 20, status, date } = req.query;
    const filter: any = { airline: airline._id };

    if (status) {
      filter.status = status;
    }

    if (date) {
      const searchDate = new Date(date as string);
      const startOfDay = new Date(searchDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(searchDate);
      endOfDay.setHours(23, 59, 59, 999);
      filter.departureTime = { $gte: startOfDay, $lte: endOfDay };
    }

    const flights = await Flight.find(filter)
      .populate('airline', 'name code')
      .populate('departureAirport', 'name city country code')
      .populate('arrivalAirport', 'name city country code')
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit))
      .sort({ departureTime: 1 });

    const total = await Flight.countDocuments(filter);

    res.json({
      success: true,
      data: {
        flights,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      }
    });
  } catch (error) {
    console.error('Error fetching airline flights:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};