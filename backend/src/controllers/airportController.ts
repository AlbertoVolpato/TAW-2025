import { Request, Response, NextFunction } from 'express';
import { Airport, IAirport } from '../models/Airport';

// Get all airports
export const getAllAirports = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { country, city, active } = req.query;
    
    // Build filter object
    const filter: any = {};
    if (country) filter.country = new RegExp(country as string, 'i');
    if (city) filter.city = new RegExp(city as string, 'i');
    if (active !== undefined) filter.isActive = active === 'true';

    const airports = await Airport.find(filter)
      .sort({ country: 1, city: 1, name: 1 })
      .lean();

    return res.status(200).json({
      success: true,
      data: {
        airports,
        count: airports.length
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get airport by ID
export const getAirportById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    
    const airport = await Airport.findById(id);
    if (!airport) {
      return res.status(404).json({
        success: false,
        message: 'Airport not found'
      });
      return;
    }

    return res.status(200).json({
      success: true,
      data: { airport }
    });
  } catch (error) {
    next(error);
  }
};

// Get airport by code
export const getAirportByCode = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { code } = req.params;
    
    const airport = await Airport.findOne({ code: code.toUpperCase(), isActive: true });
    if (!airport) {
      return res.status(404).json({
        success: false,
        message: 'Airport not found'
      });
      return;
    }

    return res.status(200).json({
      success: true,
      data: { airport }
    });
  } catch (error) {
    next(error);
  }
};

// Create new airport (admin only)
export const createAirport = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const airportData = req.body;
    
    // Check if airport code already exists
    const existingAirport = await Airport.findOne({ code: airportData.code?.toUpperCase() });
    if (existingAirport) {
      return res.status(400).json({
        success: false,
        message: 'Airport with this code already exists'
      });
      return;
    }

    const airport = new Airport(airportData);
    await airport.save();

    return res.status(201).json({
      success: true,
      message: 'Airport created successfully',
      data: { airport }
    });
  } catch (error: any) {
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map((err: any) => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors
      });
    } else {
      next(error);
    }
  }
};

// Update airport (admin only)
export const updateAirport = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // If updating code, check for duplicates
    if (updateData.code) {
      const existingAirport = await Airport.findOne({ 
        code: updateData.code.toUpperCase(),
        _id: { $ne: id }
      });
      if (existingAirport) {
        return res.status(400).json({
          success: false,
          message: 'Airport with this code already exists'
        });
        return;
      }
    }

    const airport = await Airport.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!airport) {
      return res.status(404).json({
        success: false,
        message: 'Airport not found'
      });
      return;
    }

    return res.status(200).json({
      success: true,
      message: 'Airport updated successfully',
      data: { airport }
    });
  } catch (error: any) {
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map((err: any) => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors
      });
    } else {
      next(error);
    }
  }
};

// Delete airport (admin only)
export const deleteAirport = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    
    const airport = await Airport.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    );

    if (!airport) {
      return res.status(404).json({
        success: false,
        message: 'Airport not found'
      });
      return;
    }

    return res.status(200).json({
      success: true,
      message: 'Airport deactivated successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Search airports by name or city
export const searchAirports = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { q } = req.query;
    
    if (!q || typeof q !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
      return;
    }

    // City synonyms mapping for better search experience
    const citySynonyms: { [key: string]: string[] } = {
      'Roma': ['Rome'],
      'Rome': ['Roma'],
      'Milano': ['Milan'],
      'Milan': ['Milano'],
      'Napoli': ['Naples'],
      'Naples': ['Napoli'],
      'Firenze': ['Florence'],
      'Florence': ['Firenze'],
      'Venezia': ['Venice'],
      'Venice': ['Venezia'],
      'Torino': ['Turin'],
      'Turin': ['Torino']
    };

    const searchTerms = [q];
    const lowerQ = q.toLowerCase();
    
    // Add synonyms to search terms
    Object.keys(citySynonyms).forEach(key => {
      if (key.toLowerCase() === lowerQ) {
        searchTerms.push(...citySynonyms[key]);
      }
    });

    // Create regex patterns for all search terms
    const searchRegexes = searchTerms.map(term => new RegExp(term, 'i'));
    
    const airports = await Airport.find({
      isActive: true,
      $or: [
        ...searchRegexes.flatMap(regex => [
          { name: regex },
          { city: regex },
          { code: regex },
          { country: regex }
        ])
      ]
    })
    .limit(20)
    .sort({ name: 1 })
    .lean();

    return res.status(200).json({
      success: true,
      data: {
        airports,
        count: airports.length
      }
    });
  } catch (error) {
    next(error);
  }
};