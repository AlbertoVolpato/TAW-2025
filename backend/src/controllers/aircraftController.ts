import { Request, Response } from 'express';
import { Aircraft, IAircraft } from '../models/Aircraft';
import { Airline } from '../models/Airline';
import mongoose from 'mongoose';

// Get all aircraft for the authenticated airline
export const getAirlineAircraft = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    
    if (!userId || req.user?.role !== 'airline') {
      return res.status(403).json({ message: 'Access denied. Airline account required.' });
    }

    // Find the airline associated with this user
    const airline = await Airline.findOne({ userId, isActive: true });
    if (!airline) {
      return res.status(404).json({ message: 'No airline found for current user' });
    }

    const airlineId = airline._id;

    const aircraft = await Aircraft.find({ airline: airlineId })
      .populate('airline', 'name code')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: aircraft,
      count: aircraft.length
    });
  } catch (error) {
    console.error('Error fetching airline aircraft:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// Get all aircraft (public endpoint with filters)
export const getAllAircraft = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 20, airline, manufacturer, status } = req.query;
    
    const filter: any = { isActive: true };
    
    if (airline) {
      filter.airline = airline;
    }
    
    if (manufacturer) {
      filter.manufacturer = new RegExp(manufacturer as string, 'i');
    }
    
    if (status) {
      filter.status = status;
    }

    const aircraft = await Aircraft.find(filter)
      .populate('airline', 'name code')
      .limit(Number(limit) * 1)
      .skip((Number(page) - 1) * Number(limit))
      .sort({ createdAt: -1 });

    const total = await Aircraft.countDocuments(filter);

    res.json({
      success: true,
      data: aircraft,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching aircraft:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// Get aircraft by ID
export const getAircraftById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid aircraft ID' });
    }

    const aircraft = await Aircraft.findById(id)
      .populate('airline', 'name code');

    if (!aircraft) {
      return res.status(404).json({ message: 'Aircraft not found' });
    }

    res.json({
      success: true,
      data: aircraft
    });
  } catch (error) {
    console.error('Error fetching aircraft:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// Create new aircraft (airline only)
export const createAircraft = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    
    if (!userId || req.user?.role !== 'airline') {
      return res.status(403).json({ message: 'Access denied. Airline account required.' });
    }

    // Find the airline associated with this user
    const airline = await Airline.findOne({ userId, isActive: true });
    if (!airline) {
      return res.status(404).json({ message: 'No airline found for current user' });
    }

    const airlineId = airline._id;

    const {
      registrationNumber,
      aircraftModel,
      manufacturer,
      yearManufactured,
      seatConfiguration,
      specifications,
      maintenance
    } = req.body;

    // Validate required fields
    if (!registrationNumber || !aircraftModel || !manufacturer || !yearManufactured) {
      return res.status(400).json({ 
        message: 'Missing required fields: registrationNumber, aircraftModel, manufacturer, yearManufactured' 
      });
    }

    // Check if registration number already exists
    const existingAircraft = await Aircraft.findOne({ 
      registrationNumber: registrationNumber.toUpperCase()
    });

    if (existingAircraft) {
      return res.status(400).json({ 
        message: 'Aircraft with this registration number already exists' 
      });
    }

    // Calculate total capacity from seat configuration
    let totalCapacity = 0;
    if (seatConfiguration && Array.isArray(seatConfiguration)) {
      totalCapacity = seatConfiguration.reduce((total: number, config: any) => {
        return total + (config.totalSeats || 0);
      }, 0);
    }

    // Create new aircraft
    const newAircraft = new Aircraft({
      registrationNumber: registrationNumber.toUpperCase(),
      airline: airlineId,
      aircraftModel,
      manufacturer,
      yearManufactured,
      totalCapacity,
      seatConfiguration: seatConfiguration || [],
      specifications: specifications || {
        maxRange: 0,
        cruiseSpeed: 0,
        fuelCapacity: 0,
        maxTakeoffWeight: 0
      },
      maintenance: maintenance || {
        lastMaintenanceDate: new Date(),
        nextMaintenanceDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days from now
        flightHours: 0,
        cyclesCompleted: 0
      }
    });

    await newAircraft.save();

    // Populate the response
    const populatedAircraft = await Aircraft.findById(newAircraft._id)
      .populate('airline', 'name code');

    return res.status(201).json({
      success: true,
      message: 'Aircraft created successfully',
      data: populatedAircraft
    });
  } catch (error) {
    console.error('Error creating aircraft:', error);
    
    if (error instanceof Error && error.name === 'ValidationError') {
      return res.status(400).json({ 
        message: 'Validation error', 
        details: error.message 
      });
    }
    
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// Update aircraft (airline only)
export const updateAircraft = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;
    
    if (!userId || req.user?.role !== 'airline') {
      return res.status(403).json({ message: 'Access denied. Airline account required.' });
    }

    // Find the airline associated with this user
    const airline = await Airline.findOne({ userId, isActive: true });
    if (!airline) {
      return res.status(404).json({ message: 'No airline found for current user' });
    }

    const airlineId = airline._id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid aircraft ID' });
    }

    // Find aircraft and verify ownership
    const aircraft = await Aircraft.findOne({ _id: id, airline: airlineId });
    
    if (!aircraft) {
      return res.status(404).json({ message: 'Aircraft not found or access denied' });
    }

    const {
      registrationNumber,
      aircraftModel,
      manufacturer,
      yearManufactured,
      seatConfiguration,
      specifications,
      maintenance,
      status,
      isActive
    } = req.body;

    // Check registration number uniqueness if changed
    if (registrationNumber && registrationNumber.toUpperCase() !== aircraft.registrationNumber) {
      const existingAircraft = await Aircraft.findOne({ 
        registrationNumber: registrationNumber.toUpperCase(),
        _id: { $ne: id }
      });

      if (existingAircraft) {
        return res.status(400).json({ 
          message: 'Aircraft with this registration number already exists' 
        });
      }
    }

    // Update aircraft
    const updateData: Partial<IAircraft> = {};
    
    if (registrationNumber) updateData.registrationNumber = registrationNumber.toUpperCase();
    if (aircraftModel) updateData.aircraftModel = aircraftModel;
    if (manufacturer) updateData.manufacturer = manufacturer;
    if (yearManufactured) updateData.yearManufactured = yearManufactured;
    if (seatConfiguration) {
      updateData.seatConfiguration = seatConfiguration;
      // Recalculate total capacity
      updateData.totalCapacity = seatConfiguration.reduce((total: number, config: any) => {
        return total + (config.totalSeats || 0);
      }, 0);
    }
    if (specifications) updateData.specifications = specifications;
    if (maintenance) updateData.maintenance = maintenance;
    if (status) updateData.status = status;
    if (isActive !== undefined) updateData.isActive = isActive;

    const updatedAircraft = await Aircraft.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    )
      .populate('airline', 'name code');

    res.json({
      success: true,
      message: 'Aircraft updated successfully',
      data: updatedAircraft
    });
  } catch (error) {
    console.error('Error updating aircraft:', error);
    
    if (error instanceof Error && error.name === 'ValidationError') {
      return res.status(400).json({ 
        message: 'Validation error', 
        details: error.message 
      });
    }
    
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// Delete aircraft (airline only)
export const deleteAircraft = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;
    
    if (!userId || req.user?.role !== 'airline') {
      return res.status(403).json({ message: 'Access denied. Airline account required.' });
    }

    // Find the airline associated with this user
    const airline = await Airline.findOne({ userId, isActive: true });
    if (!airline) {
      return res.status(404).json({ message: 'No airline found for current user' });
    }

    const airlineId = airline._id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid aircraft ID' });
    }

    // Find aircraft and verify ownership
    const aircraft = await Aircraft.findOne({ _id: id, airline: airlineId });
    
    if (!aircraft) {
      return res.status(404).json({ message: 'Aircraft not found or access denied' });
    }

    // Check if aircraft has active flights
    // Note: This would require importing Flight model and checking
    // For now, we'll just soft delete by setting isActive to false
    
    await Aircraft.findByIdAndUpdate(id, { isActive: false, status: 'retired' });

    res.json({
      success: true,
      message: 'Aircraft retired successfully'
    });
  } catch (error) {
    console.error('Error deleting aircraft:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// Get aircraft by airline (public endpoint)
export const getAircraftByAirline = async (req: Request, res: Response) => {
  try {
    const { airlineId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(airlineId)) {
      return res.status(400).json({ message: 'Invalid airline ID' });
    }

    const aircraft = await Aircraft.find({
      airline: airlineId,
      isActive: true,
      status: 'active'
    })
      .populate('airline', 'name code')
      .sort({ aircraftModel: 1 });

    res.json({
      success: true,
      data: aircraft,
      count: aircraft.length
    });
  } catch (error) {
    console.error('Error fetching aircraft by airline:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// Get aircraft maintenance schedule (airline only)
export const getMaintenanceSchedule = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    
    if (!userId || req.user?.role !== 'airline') {
      return res.status(403).json({ message: 'Access denied. Airline account required.' });
    }

    // Find the airline associated with this user
    const airline = await Airline.findOne({ userId, isActive: true });
    if (!airline) {
      return res.status(404).json({ message: 'No airline found for current user' });
    }

    const airlineId = airline._id;
    const { days = 30 } = req.query;

    const upcomingDate = new Date();
    upcomingDate.setDate(upcomingDate.getDate() + Number(days));

    const aircraft = await Aircraft.find({
      airline: airlineId,
      isActive: true,
      'maintenance.nextMaintenanceDate': { $lte: upcomingDate }
    })
      .populate('airline', 'name code')
      .sort({ 'maintenance.nextMaintenanceDate': 1 });

    res.json({
      success: true,
      data: aircraft,
      count: aircraft.length,
      message: `Aircraft requiring maintenance within ${days} days`
    });
  } catch (error) {
    console.error('Error fetching maintenance schedule:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};