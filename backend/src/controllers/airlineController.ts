import { Request, Response, NextFunction } from 'express';
import { Airline, IAirline } from '../models/Airline';
import { User } from '../models/User';
import { Flight } from '../models/Flight';
import { Booking } from '../models/Booking';
import mongoose from 'mongoose';

// Get all airlines
export const getAllAirlines = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { country, active } = req.query;
    
    // Build filter object
    const filter: any = {};
    if (country) filter.country = new RegExp(country as string, 'i');
    if (active !== undefined) filter.isActive = active === 'true';

    const airlines = await Airline.find(filter)
      .populate('userId', 'firstName lastName email')
      .sort({ name: 1 })
      .lean();

    return res.status(200).json({
      success: true,
      data: {
        airlines,
        count: airlines.length
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get airline by ID
export const getAirlineById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    
    const airline = await Airline.findById(id)
      .populate('userId', 'firstName lastName email');
      
    if (!airline) {
      return res.status(404).json({
        success: false,
        message: 'Airline not found'
      });
      return;
    }

    return res.status(200).json({
      success: true,
      data: { airline }
    });
  } catch (error) {
    next(error);
  }
};

// Get airline by code
export const getAirlineByCode = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { code } = req.params;
    
    const airline = await Airline.findOne({ code: code.toUpperCase(), isActive: true })
      .populate('userId', 'firstName lastName email');
      
    if (!airline) {
      return res.status(404).json({
        success: false,
        message: 'Airline not found'
      });
      return;
    }

    return res.status(200).json({
      success: true,
      data: { airline }
    });
  } catch (error) {
    next(error);
  }
};

// Create new airline by invitation (admin only)
export const createAirlineByInvitation = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      name,
      code,
      country,
      headquarters,
      website,
      contactInfo,
      userEmail,
      firstName,
      lastName
    } = req.body;

    // Only admin can create airlines by invitation
    if (req.user?.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
      return;
    }

    // Check if airline code already exists
    const existingAirline = await Airline.findOne({ code: code.toUpperCase() });
    if (existingAirline) {
      return res.status(400).json({
        success: false,
        message: 'Airline code already exists'
      });
      return;
    }

    // Check if user email already exists
    const existingUser = await User.findOne({ email: userEmail.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
      return;
    }

    // Generate temporary password
    const tempPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);

    // Create airline user with temporary password
    const airlineUser = new User({
      firstName,
      lastName,
      email: userEmail.toLowerCase(),
      password: tempPassword,
      role: 'airline',
      isEmailVerified: true, // Admin-created accounts are pre-verified
      mustChangePassword: true // Force password change on first login
    });

    await airlineUser.save();

    // Create airline associated with the new user
    const airline = new Airline({
      name,
      code: code.toUpperCase(),
      country,
      headquarters,
      website,
      contactInfo,
      userId: airlineUser._id
    });

    await airline.save();

    // Populate user data for response
    await airline.populate('userId', 'firstName lastName email');

    return res.status(201).json({
      success: true,
      message: 'Airline created successfully by invitation',
      data: {
        airline,
        temporaryPassword: tempPassword, // Return temp password for admin to share
        loginInstructions: 'The airline user must change their password on first login'
      }
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

// Legacy create airline method (kept for backward compatibility but restricted)
export const createAirline = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Redirect to invitation-based creation
    return res.status(400).json({
      success: false,
      message: 'Direct airline creation is not allowed. Airlines must be created by invitation through admin.',
      redirectTo: '/api/airlines/invite'
    });
  } catch (error) {
    next(error);
  }
};

// Update airline (admin or airline owner)
export const updateAirline = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const userRole = req.user?.role;
    const userId = req.user?.userId;

    // Find the airline first
    const existingAirline = await Airline.findById(id);
    if (!existingAirline) {
      return res.status(404).json({
        success: false,
        message: 'Airline not found'
      });
      return;
    }

    // Check permissions
    if (userRole === 'airline' && (existingAirline as any).user?.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only update your own airline'
      });
      return;
    }

    // If updating code, check for duplicates
    if (updateData.code) {
      const duplicateAirline = await Airline.findOne({ 
        code: updateData.code.toUpperCase(),
        _id: { $ne: id }
      });
      if (duplicateAirline) {
        return res.status(400).json({
          success: false,
          message: 'Airline with this code already exists'
        });
        return;
      }
    }

    // If updating user, validate
    if (updateData.user) {
      const user = await User.findById(updateData.user);
      if (!user || user.role !== 'airline') {
        return res.status(400).json({
          success: false,
          message: 'Invalid user or user must have airline role'
        });
        return;
      }
    }

    const airline = await Airline.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('userId', 'firstName lastName email');

    return res.status(200).json({
      success: true,
      message: 'Airline updated successfully',
      data: { airline }
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

// Delete airline (admin only)
export const deleteAirline = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    
    const airline = await Airline.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    );

    if (!airline) {
      return res.status(404).json({
        success: false,
        message: 'Airline not found'
      });
      return;
    }

    return res.status(200).json({
      success: true,
      message: 'Airline deactivated successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Get current user's airline (for airline users)
export const getMyAirline = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    
    const airline = await Airline.findOne({ userId: userId, isActive: true })
      .populate('userId', 'firstName lastName email');
      
    if (!airline) {
      return res.status(404).json({
        success: false,
        message: 'No airline found for current user'
      });
      return;
    }

    return res.status(200).json({
      success: true,
      data: { airline }
    });
  } catch (error) {
    next(error);
  }
};

// Get airline statistics (airline only)
export const getAirlineStatistics = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    
    if (!userId || req.user?.role !== 'airline') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Airline account required.'
      });
      return;
    }

    // Find the airline associated with this user
    const airline = await Airline.findOne({ userId, isActive: true });
    if (!airline) {
      return res.status(404).json({
        success: false,
        message: 'No airline found for current user'
      });
      return;
    }

    const airlineId = airline._id;
    const { startDate, endDate } = req.query;

    // Build date filter
    const dateFilter: any = {};
    if (startDate) {
      dateFilter.$gte = new Date(startDate as string);
    }
    if (endDate) {
      dateFilter.$lte = new Date(endDate as string);
    }

    // Get flights for this airline
     const flightFilter: any = { airline: airlineId };
     if (Object.keys(dateFilter).length > 0) {
       flightFilter['departureTime'] = dateFilter;
     }

    const flights = await Flight.find(flightFilter);
    const flightIds = flights.map(f => f._id);

    // Get bookings for these flights
    const bookings = await Booking.find({
      flight: { $in: flightIds },
      status: { $in: ['confirmed', 'completed'] }
    }).populate('flight', 'flightNumber route schedule');

    // Calculate statistics
     const totalPassengers = bookings.reduce((sum, booking) => {
       return sum + (booking.passengers?.length || 0);
     }, 0);

     const totalRevenue = bookings.reduce((sum, booking) => {
       return sum + (booking.pricing?.totalPrice || 0);
     }, 0);

    // Most demanded routes
    const routeStats: { [key: string]: { count: number; revenue: number; route: any } } = {};
    
    bookings.forEach(booking => {
      if (booking.flight && (booking.flight as any).route) {
        const routeKey = `${(booking.flight as any).route.origin}-${(booking.flight as any).route.destination}`;
        if (!routeStats[routeKey]) {
          routeStats[routeKey] = {
            count: 0,
            revenue: 0,
            route: (booking.flight as any).route
          };
        }
        routeStats[routeKey].count += booking.passengers?.length || 0;
         routeStats[routeKey].revenue += booking.pricing?.totalPrice || 0;
      }
    });

    const mostDemandedRoutes = Object.entries(routeStats)
      .map(([key, stats]) => ({
        route: key,
        passengers: stats.count,
        revenue: stats.revenue,
        routeDetails: stats.route
      }))
      .sort((a, b) => b.passengers - a.passengers)
      .slice(0, 10);

    // Monthly statistics
    const monthlyStats: { [key: string]: { passengers: number; revenue: number; flights: number } } = {};
    
    bookings.forEach(booking => {
       if (booking.flight && (booking.flight as any).departureTime) {
         const date = new Date((booking.flight as any).departureTime);
         const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
         
         if (!monthlyStats[monthKey]) {
           monthlyStats[monthKey] = { passengers: 0, revenue: 0, flights: 0 };
         }
         
         monthlyStats[monthKey].passengers += booking.passengers?.length || 0;
         monthlyStats[monthKey].revenue += booking.pricing?.totalPrice || 0;
       }
     });

    // Count unique flights
    const uniqueFlights = new Set(bookings.map(b => b.flight?.toString())).size;
    flights.forEach(flight => {
       const date = new Date(flight.departureTime);
       const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
       
       if (monthlyStats[monthKey]) {
         monthlyStats[monthKey].flights = (monthlyStats[monthKey].flights || 0) + 1;
       }
     });

    const monthlyData = Object.entries(monthlyStats)
      .map(([month, stats]) => ({ month, ...stats }))
      .sort((a, b) => a.month.localeCompare(b.month));

    return res.status(200).json({
      success: true,
      data: {
        summary: {
          totalPassengers,
          totalRevenue,
          totalFlights: flights.length,
          totalBookings: bookings.length,
          averageRevenuePerFlight: flights.length > 0 ? totalRevenue / flights.length : 0,
          averagePassengersPerFlight: flights.length > 0 ? totalPassengers / flights.length : 0
        },
        mostDemandedRoutes,
        monthlyStatistics: monthlyData,
        period: {
          startDate: startDate || 'All time',
          endDate: endDate || 'All time'
        }
      }
    });
  } catch (error) {
    console.error('Error fetching airline statistics:', error);
    next(error);
  }
};

// Get revenue statistics (airline only)
export const getRevenueStatistics = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    
    if (!userId || req.user?.role !== 'airline') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Airline account required.'
      });
      return;
    }

    // Find the airline associated with this user
    const airline = await Airline.findOne({ userId, isActive: true });
    if (!airline) {
      return res.status(404).json({
        success: false,
        message: 'No airline found for current user'
      });
      return;
    }

    const airlineId = airline._id;
    const { year = new Date().getFullYear() } = req.query;

    // Get flights for this airline in the specified year
    const startOfYear = new Date(`${year}-01-01`);
    const endOfYear = new Date(`${year}-12-31`);

    const flights = await Flight.find({
       airline: airlineId,
       'departureTime': {
         $gte: startOfYear,
         $lte: endOfYear
       }
     });

    const flightIds = flights.map(f => f._id);

    // Aggregate revenue by month
    const revenueByMonth = await Booking.aggregate([
      {
        $match: {
          flight: { $in: flightIds },
          status: { $in: ['confirmed', 'completed'] }
        }
      },
      {
        $lookup: {
          from: 'flights',
          localField: 'flight',
          foreignField: '_id',
          as: 'flightData'
        }
      },
      {
        $unwind: '$flightData'
      },
      {
        $group: {
           _id: {
             month: { $month: '$flightData.departureTime' },
             year: { $year: '$flightData.departureTime' }
           },
           totalRevenue: { $sum: '$pricing.totalPrice' },
           totalBookings: { $sum: 1 },
           totalPassengers: { $sum: { $size: '$passengers' } }
         }
      },
      {
        $sort: { '_id.month': 1 }
      }
    ]);

    // Format the data
    const monthlyRevenue = Array.from({ length: 12 }, (_, i) => {
      const monthData = revenueByMonth.find(item => item._id.month === i + 1);
      return {
        month: i + 1,
        monthName: new Date(2024, i, 1).toLocaleString('default', { month: 'long' }),
        revenue: monthData?.totalRevenue || 0,
        bookings: monthData?.totalBookings || 0,
        passengers: monthData?.totalPassengers || 0
      };
    });

    const totalYearRevenue = monthlyRevenue.reduce((sum, month) => sum + month.revenue, 0);
    const totalYearBookings = monthlyRevenue.reduce((sum, month) => sum + month.bookings, 0);
    const totalYearPassengers = monthlyRevenue.reduce((sum, month) => sum + month.passengers, 0);

    return res.status(200).json({
      success: true,
      data: {
        year: Number(year),
        monthlyRevenue,
        summary: {
          totalRevenue: totalYearRevenue,
          totalBookings: totalYearBookings,
          totalPassengers: totalYearPassengers,
          averageMonthlyRevenue: totalYearRevenue / 12,
          averageRevenuePerBooking: totalYearBookings > 0 ? totalYearRevenue / totalYearBookings : 0
        }
      }
    });
  } catch (error) {
    console.error('Error fetching revenue statistics:', error);
    next(error);
  }
};

// Get passenger statistics (airline only)
export const getPassengerStatistics = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    
    if (!userId || req.user?.role !== 'airline') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Airline account required.'
      });
      return;
    }

    // Find the airline associated with this user
    const airline = await Airline.findOne({ userId, isActive: true });
    if (!airline) {
      return res.status(404).json({
        success: false,
        message: 'No airline found for current user'
      });
      return;
    }

    const airlineId = airline._id;
    const { period = '30' } = req.query; // days

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - Number(period));

    // Get flights for this airline in the specified period
     const flights = await Flight.find({
       airline: airlineId,
       'departureTime': { $gte: startDate }
     });

    const flightIds = flights.map(f => f._id);

    // Get passenger statistics
    const passengerStats = await Booking.aggregate([
      {
        $match: {
          flight: { $in: flightIds },
          status: { $in: ['confirmed', 'completed'] }
        }
      },
      {
        $lookup: {
          from: 'flights',
          localField: 'flight',
          foreignField: '_id',
          as: 'flightData'
        }
      },
      {
        $unwind: '$flightData'
      },
      {
        $group: {
          _id: {
            date: {
               $dateToString: {
                 format: '%Y-%m-%d',
                 date: '$flightData.departureTime'
               }
             }
          },
          totalPassengers: { $sum: { $size: '$passengers' } },
          totalBookings: { $sum: 1 },
          totalFlights: { $addToSet: '$flight' }
        }
      },
      {
        $addFields: {
          totalFlights: { $size: '$totalFlights' }
        }
      },
      {
        $sort: { '_id.date': 1 }
      }
    ]);

    const totalPassengers = passengerStats.reduce((sum, day) => sum + day.totalPassengers, 0);
    const totalBookings = passengerStats.reduce((sum, day) => sum + day.totalBookings, 0);
    const totalFlights = flights.length;

    return res.status(200).json({
      success: true,
      data: {
        period: `Last ${period} days`,
        dailyStatistics: passengerStats.map(stat => ({
          date: stat._id.date,
          passengers: stat.totalPassengers,
          bookings: stat.totalBookings,
          flights: stat.totalFlights
        })),
        summary: {
          totalPassengers,
          totalBookings,
          totalFlights,
          averagePassengersPerDay: passengerStats.length > 0 ? totalPassengers / passengerStats.length : 0,
          averagePassengersPerFlight: totalFlights > 0 ? totalPassengers / totalFlights : 0,
          loadFactor: 0 // This would require aircraft capacity data
        }
      }
    });
  } catch (error) {
    console.error('Error fetching passenger statistics:', error);
    next(error);
  }
};