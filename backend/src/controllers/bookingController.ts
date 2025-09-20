import { Request, Response, NextFunction } from "express";
import { Booking, IBooking } from "../models/Booking";
import { Flight } from "../models/Flight";
import { User } from "../models/User";
import mongoose from "mongoose";

// Create a new booking
export const createBooking = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.userId;
    const { flightId, passengers, contactInfo, baggage, specialServices } =
      req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    // Validate required fields
    if (!flightId || !passengers || !contactInfo) {
      return res.status(400).json({
        success: false,
        message: "Missing required booking information",
      });
    }

    // Find the flight
    const flight = await Flight.findById(flightId);
    if (!flight) {
      return res.status(404).json({
        success: false,
        message: "Flight not found",
      });
    }

    // Check seat availability
    const requestedSeats = passengers.map((p: any) => p.seatNumber);
    const unavailableSeats = flight.seats.filter(
      (seat) => requestedSeats.includes(seat.seatNumber) && !seat.isAvailable
    );

    if (unavailableSeats.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Seats ${unavailableSeats
          .map((s) => s.seatNumber)
          .join(", ")} are not available`,
      });
    }

    // Calculate pricing
    const basePrice = flight.basePrice.economy; // Default to economy, adjust based on seat class
    let totalBasePrice = 0;
    const extras: { name: string; price: number }[] = [];

    passengers.forEach((passenger: any) => {
      let seatPrice = basePrice;
      if (passenger.seatClass === "business") {
        seatPrice = flight.basePrice.business || basePrice * 2;
      } else if (passenger.seatClass === "first") {
        seatPrice = flight.basePrice.first || basePrice * 3;
      }
      totalBasePrice += seatPrice;
    });

    // Add baggage fees
    let baggageFees = 0;
    if (baggage?.checked > 1) {
      baggageFees += (baggage.checked - 1) * 50; // €50 per extra checked bag
    }
    if (baggage?.extraBags > 0) {
      baggageFees += baggage.extraBags * 75; // €75 per extra bag
    }

    if (baggageFees > 0) {
      extras.push({ name: "Extra Baggage", price: baggageFees });
    }

    // Add special services fees
    let servicesFees = 0;
    if (specialServices?.wheelchairAssistance) {
      servicesFees += 0; // Usually free
    }
    if (specialServices?.specialMeal) {
      servicesFees += 25; // €25 for special meal
      extras.push({ name: "Special Meal", price: 25 });
    }
    if (specialServices?.unaccompaniedMinor) {
      servicesFees += 100; // €100 for unaccompanied minor service
      extras.push({ name: "Unaccompanied Minor Service", price: 100 });
    }
    if (specialServices?.petTransport) {
      servicesFees += 150; // €150 for pet transport
      extras.push({ name: "Pet Transport", price: 150 });
    }

    const taxes = totalBasePrice * 0.15; // 15% taxes
    const fees = 25; // Fixed booking fee
    const totalPrice =
      totalBasePrice + taxes + fees + baggageFees + servicesFees;

    // Generate unique booking reference
    const generateBookingReference = () => {
      const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
      let result = "";
      for (let i = 0; i < 6; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return result;
    };

    let bookingReference;
    let isUnique = false;
    while (!isUnique) {
      bookingReference = generateBookingReference();
      const existingBooking = await Booking.findOne({ bookingReference });
      if (!existingBooking) {
        isUnique = true;
      }
    }

    // Check user's wallet balance
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.walletBalance < totalPrice) {
      return res.status(400).json({
        success: false,
        message: `Saldo insufficiente. Saldo attuale: €${user.walletBalance.toFixed(
          2
        )}, Importo richiesto: €${totalPrice.toFixed(2)}`,
      });
    }

    // Deduct from wallet
    user.walletBalance -= totalPrice;
    await user.save();

    // Create booking
    const booking = new Booking({
      bookingReference,
      user: userId,
      flight: flightId,
      passengers,
      contactInfo,
      pricing: {
        basePrice: totalBasePrice,
        taxes,
        fees,
        extras,
        totalPrice,
      },
      payment: {
        method: "wallet",
        status: "completed",
        paidAt: new Date(),
      },
      status: "confirmed",
      baggage: baggage || { carryOn: 1, checked: 1, extraBags: 0 },
      specialServices: specialServices || {
        wheelchairAssistance: false,
        unaccompaniedMinor: false,
        petTransport: false,
      },
    });

    await booking.save();

    // Temporarily reserve seats (they will be confirmed after payment)
    requestedSeats.forEach((seatNumber: string) => {
      const seatIndex = flight.seats.findIndex(
        (seat) => seat.seatNumber === seatNumber
      );
      if (seatIndex !== -1) {
        flight.seats[seatIndex].isAvailable = false;
      }
    });
    await flight.save();

    // Populate booking for response
    const populatedBooking = await Booking.findById(booking._id)
      .populate("flight")
      .populate("user", "firstName lastName email");

    res.status(201).json({
      success: true,
      message: "Booking created successfully",
      data: populatedBooking,
    });
  } catch (error) {
    console.error("Error creating booking:", error);
    next(error);
  }
};

// Get user's bookings
export const getUserBookings = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.userId;
    const { page = 1, limit = 10, status } = req.query;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const filter: any = { user: userId };
    if (status) {
      filter.status = status;
    }

    const bookings = await Booking.find(filter)
      .populate({
        path: "flight",
        populate: [
          { path: "departureAirport", select: "name city country iataCode" },
          { path: "arrivalAirport", select: "name city country iataCode" },
          { path: "airline", select: "name iataCode logo" },
        ],
      })
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));

    const total = await Booking.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: {
        bookings,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
      },
    });
  } catch (error) {
    console.error("Error fetching user bookings:", error);
    next(error);
  }
};

// Get booking by ID
export const getBookingById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.userId;
    const { bookingId } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const booking = await Booking.findById(bookingId)
      .populate({
        path: "flight",
        populate: [
          { path: "departureAirport", select: "name city country iataCode" },
          { path: "arrivalAirport", select: "name city country iataCode" },
          { path: "airline", select: "name iataCode logo" },
        ],
      })
      .populate("user", "firstName lastName email");

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    // Check if user owns this booking or is admin
    if (booking.user._id.toString() !== userId && req.user?.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    res.status(200).json({
      success: true,
      data: booking,
    });
  } catch (error) {
    console.error("Error fetching booking:", error);
    next(error);
  }
};

// Update booking (limited fields)
export const updateBooking = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.userId;
    const { bookingId } = req.params;
    const { contactInfo, specialServices } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    // Check if user owns this booking
    if (booking.user.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    // Only allow updates if booking is still pending
    if (booking.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Cannot update confirmed or cancelled booking",
      });
    }

    // Update allowed fields
    if (contactInfo) {
      booking.contactInfo = { ...booking.contactInfo, ...contactInfo };
    }
    if (specialServices) {
      booking.specialServices = {
        ...booking.specialServices,
        ...specialServices,
      };
    }

    await booking.save();

    const updatedBooking = await Booking.findById(bookingId)
      .populate("flight")
      .populate("user", "firstName lastName email");

    res.status(200).json({
      success: true,
      message: "Booking updated successfully",
      data: updatedBooking,
    });
  } catch (error) {
    console.error("Error updating booking:", error);
    next(error);
  }
};

// Cancel booking
export const cancelBooking = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.userId;
    const { bookingId } = req.params;
    const { reason } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const booking = await Booking.findById(bookingId).populate("flight");
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    // Check if user owns this booking
    if (booking.user.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    // Check if booking can be cancelled
    if (booking.status === "cancelled") {
      return res.status(400).json({
        success: false,
        message: "Booking is already cancelled",
      });
    }

    if (booking.status === "completed") {
      return res.status(400).json({
        success: false,
        message: "Cannot cancel completed booking",
      });
    }

    // Process refund to user's wallet
    const user = await User.findById(userId);
    let refundAmount = 0;
    if (user && booking.payment.status === "completed") {
      refundAmount = booking.pricing.totalPrice;
      user.walletBalance += refundAmount;
      await user.save();

      console.log(
        `Refunded €${refundAmount} to user ${userId} for cancelled booking ${bookingId}`
      );
    }

    // Free up reserved seats
    if (booking.flight) {
      const flight = booking.flight as any;
      booking.passengers.forEach((passenger) => {
        const seatIndex = flight.seats?.findIndex(
          (seat: any) => seat.seatNumber === passenger.seatNumber
        );
        if (seatIndex !== -1 && flight.seats) {
          flight.seats[seatIndex].isAvailable = true;
        }
      });
      await flight.save();
    }

    // Delete the booking instead of marking as cancelled
    await Booking.findByIdAndDelete(bookingId);

    res.status(200).json({
      success: true,
      message: "Prenotazione cancellata con successo",
      data: {
        refundAmount: refundAmount,
        message:
          refundAmount > 0
            ? `Rimborso di €${refundAmount.toFixed(
                2
              )} accreditato nel portafoglio`
            : "Prenotazione eliminata",
      },
    });
  } catch (error) {
    console.error("Error cancelling booking:", error);
    next(error);
  }
};

// Check-in for booking
export const checkInBooking = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.userId;
    const { bookingId } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const booking = await Booking.findById(bookingId).populate("flight");
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    // Check if user owns this booking
    if (booking.user.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    // Check if booking is confirmed
    if (booking.status !== "confirmed") {
      return res.status(400).json({
        success: false,
        message: "Only confirmed bookings can be checked in",
      });
    }

    // Check if already checked in
    if (booking.checkedIn) {
      return res.status(400).json({
        success: false,
        message: "Booking is already checked in",
      });
    }

    // Check if check-in is available (24 hours before departure)
    const flight = booking.flight as any;
    const departureTime = new Date(flight.departureTime);
    const now = new Date();
    const timeDiff = departureTime.getTime() - now.getTime();
    const hoursDiff = timeDiff / (1000 * 3600);

    if (hoursDiff > 24) {
      return res.status(400).json({
        success: false,
        message: "Check-in is available 24 hours before departure",
      });
    }

    if (hoursDiff < 0) {
      return res.status(400).json({
        success: false,
        message: "Flight has already departed",
      });
    }

    // Update booking
    booking.checkedIn = true;
    booking.checkedInAt = new Date();
    await booking.save();

    res.status(200).json({
      success: true,
      message: "Check-in successful",
      data: {
        bookingId,
        checkedIn: true,
        checkedInAt: booking.checkedInAt,
      },
    });
  } catch (error) {
    console.error("Error checking in booking:", error);
    next(error);
  }
};

// Get booking by reference (public endpoint for booking lookup)
export const getBookingByReference = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { reference } = req.params;
    const { email } = req.query;

    if (!reference || !email) {
      return res.status(400).json({
        success: false,
        message: "Booking reference and email are required",
      });
    }

    const booking = await Booking.findOne({
      bookingReference: reference.toUpperCase(),
      "contactInfo.email": email,
    }).populate({
      path: "flight",
      populate: [
        { path: "departureAirport", select: "name city country iataCode" },
        { path: "arrivalAirport", select: "name city country iataCode" },
        { path: "airline", select: "name iataCode logo" },
      ],
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found with provided reference and email",
      });
    }

    res.status(200).json({
      success: true,
      data: booking,
    });
  } catch (error) {
    console.error("Error fetching booking by reference:", error);
    next(error);
  }
};
