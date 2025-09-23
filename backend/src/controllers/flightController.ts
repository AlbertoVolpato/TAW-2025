import { Request, Response } from "express";
import { Flight, IFlight, ISeat } from "../models/Flight";
import { Airport } from "../models/Airport";
import { Airline } from "../models/Airline";
import mongoose from "mongoose";

// Search flights with optional layovers
export const searchFlights = async (req: Request, res: Response) => {
  try {
    const {
      origin,
      destination,
      departureDate,
      returnDate,
      passengers = 1,
      class: seatClass = "economy",
      maxLayovers = 1,
      minLayoverTime = 120, // minimum 2 hours in minutes
    } = req.query;

    // Validate required parameters
    if (!origin || !destination || !departureDate) {
      return res.status(400).json({
        success: false,
        message: "Origin, destination, and departure date are required",
      });
    }

    // Validate airports exist
    // First try to find by code (IATA), then by ObjectId if it's a valid ObjectId
    const originQuery =
      mongoose.Types.ObjectId.isValid(origin as string) &&
      (origin as string).length === 24
        ? { $or: [{ code: origin }, { _id: origin }] }
        : { code: origin };

    const destinationQuery =
      mongoose.Types.ObjectId.isValid(destination as string) &&
      (destination as string).length === 24
        ? { $or: [{ code: destination }, { _id: destination }] }
        : { code: destination };

    const [originAirport, destinationAirport] = await Promise.all([
      Airport.findOne(originQuery),
      Airport.findOne(destinationQuery),
    ]);

    if (!originAirport || !destinationAirport) {
      return res.status(400).json({
        success: false,
        message: "Invalid origin or destination airport",
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
      status: { $in: ["scheduled", "boarding"] },
      isActive: true,
    })
      .populate("airline", "name code")
      .populate("departureAirport", "name city country code")
      .populate("arrivalAirport", "name city country code")
      .sort({ departureTime: 1 });

    let connectingFlights: any[] = [];

    // Search for connecting flights if maxLayovers > 0
    if (Number(maxLayovers) > 0) {
      // Find flights from origin to any intermediate airport
      const firstLegFlights = await Flight.find({
        departureAirport: originAirport._id,
        arrivalAirport: { $ne: destinationAirport._id },
        departureTime: { $gte: startOfDay, $lte: endOfDay },
        status: { $in: ["scheduled", "boarding"] },
        isActive: true,
      })
        .populate("airline", "name code")
        .populate("departureAirport", "name city country code")
        .populate("arrivalAirport", "name city country code")
        .sort({ departureTime: 1 });

      // For each first leg flight, find connecting flights
      for (const firstFlight of firstLegFlights) {
        const layoverAirport = firstFlight.arrivalAirport;
        const minConnectionTime = new Date(firstFlight.arrivalTime);
        minConnectionTime.setMinutes(
          minConnectionTime.getMinutes() + Number(minLayoverTime)
        );

        const maxConnectionTime = new Date(firstFlight.arrivalTime);
        maxConnectionTime.setHours(maxConnectionTime.getHours() + 12); // Max 12 hours layover

        const secondLegFlights = await Flight.find({
          departureAirport: layoverAirport._id,
          arrivalAirport: destinationAirport._id,
          departureTime: { $gte: minConnectionTime, $lte: maxConnectionTime },
          status: { $in: ["scheduled", "boarding"] },
          isActive: true,
        })
          .populate("airline", "name code")
          .populate("departureAirport", "name city country code")
          .populate("arrivalAirport", "name city country code");

        // Create connecting flight combinations
        for (const secondFlight of secondLegFlights) {
          const layoverDuration = Math.floor(
            (secondFlight.departureTime.getTime() -
              firstFlight.arrivalTime.getTime()) /
              (1000 * 60)
          );

          connectingFlights.push({
            type: "connecting",
            totalDuration:
              firstFlight.duration + secondFlight.duration + layoverDuration,
            totalPrice: {
              economy:
                firstFlight.basePrice.economy + secondFlight.basePrice.economy,
              business:
                firstFlight.basePrice.business +
                secondFlight.basePrice.business,
              first: firstFlight.basePrice.first + secondFlight.basePrice.first,
            },
            layovers: 1,
            segments: [
              {
                flight: firstFlight,
                segmentType: "departure",
              },
              {
                layover: {
                  airport: layoverAirport,
                  duration: layoverDuration,
                },
              },
              {
                flight: secondFlight,
                segmentType: "arrival",
              },
            ],
          });
        }
      }
    }

    // Format direct flights
    const formattedDirectFlights = directFlights.map((flight) => ({
      type: "direct",
      totalDuration: flight.duration,
      totalPrice: flight.basePrice,
      layovers: 0,
      segments: [
        {
          flight: flight,
          segmentType: "direct",
        },
      ],
    }));

    // Combine and sort all flights by total duration
    const allFlights = [...formattedDirectFlights, ...connectingFlights].sort(
      (a, b) => a.totalDuration - b.totalDuration
    );

    // Search for return flights if returnDate is provided
    let returnFlights: any[] = [];
    let returnSearchDate: Date | undefined;
    console.log("Return date parameter:", returnDate);
    if (returnDate) {
      console.log("Processing return date:", returnDate);
      returnSearchDate = new Date(returnDate as string);
      const returnStartOfDay = new Date(returnSearchDate);
      returnStartOfDay.setHours(0, 0, 0, 0);
      const returnEndOfDay = new Date(returnSearchDate);
      returnEndOfDay.setHours(23, 59, 59, 999);

      // Search for direct return flights (swap origin and destination)
      const directReturnFlights = await Flight.find({
        departureAirport: destinationAirport._id, // Swap: destination becomes origin
        arrivalAirport: originAirport._id, // Swap: origin becomes destination
        departureTime: { $gte: returnStartOfDay, $lte: returnEndOfDay },
        status: { $in: ["scheduled", "boarding"] },
        isActive: true,
      })
        .populate("airline", "name code")
        .populate("departureAirport", "name city country code")
        .populate("arrivalAirport", "name city country code")
        .sort({ departureTime: 1 });

      // Format return flights
      returnFlights = directReturnFlights.map((flight) => ({
        type: "direct",
        totalDuration: flight.duration,
        totalPrice: flight.basePrice,
        layovers: 0,
        segments: [
          {
            flight: flight,
            segmentType: "direct",
          },
        ],
      }));
    }

    const response: any = {
      success: true,
      data: {
        flights: allFlights,
        returnFlights: returnFlights, // Always include, even if empty
        searchCriteria: {
          origin: originAirport,
          destination: destinationAirport,
          departureDate: searchDate,
          passengers: Number(passengers),
          class: seatClass,
          maxLayovers: Number(maxLayovers),
        },
        summary: {
          total: allFlights.length,
          direct: formattedDirectFlights.length,
          connecting: connectingFlights.length,
          returnFlights: returnFlights.length,
        },
      },
    };

    // Add return date to searchCriteria if provided
    if (returnDate && returnSearchDate) {
      response.data.searchCriteria.returnDate = returnSearchDate;
    }

    res.json(response);
  } catch (error) {
    console.error("Error searching flights:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
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
      status,
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
      .populate("airline", "name code")
      .populate("departureAirport", "name city country code")
      .populate("arrivalAirport", "name city country code")
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
          pages: Math.ceil(total / Number(limit)),
        },
      },
    });
  } catch (error) {
    console.error("Error fetching flights:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Get flight by ID
export const getFlightById = async (req: Request, res: Response) => {
  console.log("getFlightById called with id:", req.params.id);
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid flight ID",
      });
    }

    const flight = await Flight.findById(id)
      .populate("airline", "name code")
      .populate("departureAirport", "name city country code")
      .populate("arrivalAirport", "name city country code");

    if (!flight) {
      return res.status(404).json({
        success: false,
        message: "Flight not found",
      });
    }

    res.json({
      success: true,
      data: { flight },
    });
  } catch (error) {
    console.error("Error fetching flight:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Create new flight (airline only)
export const createFlight = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId || req.user?.role !== "airline") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Airline account required.",
      });
    }

    // Find the airline associated with this user
    const airline = await Airline.findOne({ userId, isActive: true });
    if (!airline) {
      return res.status(404).json({
        success: false,
        message: "No airline found for current user",
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
      services,
    } = req.body;

    // Validate required fields
    if (
      !flightNumber ||
      !departureAirport ||
      !arrivalAirport ||
      !departureTime ||
      !arrivalTime
    ) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    // Validate airports exist
    const [depAirport, arrAirport] = await Promise.all([
      Airport.findById(departureAirport),
      Airport.findById(arrivalAirport),
    ]);

    if (!depAirport || !arrAirport) {
      return res.status(400).json({
        success: false,
        message: "Invalid departure or arrival airport",
      });
    }

    // Check if flight number already exists for the same date
    const existingFlight = await Flight.findOne({
      flightNumber: flightNumber.toUpperCase(),
      airline: airline._id,
      departureTime: {
        $gte: new Date(new Date(departureTime).setHours(0, 0, 0, 0)),
        $lt: new Date(new Date(departureTime).setHours(23, 59, 59, 999)),
      },
    });

    if (existingFlight) {
      return res.status(400).json({
        success: false,
        message: "Flight with this number already exists for the selected date",
      });
    }

    // Calculate duration
    const duration = Math.floor(
      (new Date(arrivalTime).getTime() - new Date(departureTime).getTime()) /
        (1000 * 60)
    );

    // Generate seats based on aircraft capacity with realistic layout
    const seats = [];
    const capacity = aircraft.capacity;

    // Calculate seat distribution (more realistic)
    const firstSeats = Math.floor(capacity * 0.1); // 10% first class
    const businessSeats = Math.floor(capacity * 0.2); // 20% business class
    const economySeats = capacity - firstSeats - businessSeats; // 70% economy

    let currentRow = 1;

    // Generate first class seats (rows 1-3, 2 seats per row: A, F)
    const firstRows = Math.ceil(firstSeats / 2);
    for (let row = 1; row <= firstRows; row++) {
      const seatsInRow = ["A", "F"]; // Only window seats in first class
      for (
        let i = 0;
        i < seatsInRow.length && (row - 1) * 2 + i + 1 <= firstSeats;
        i++
      ) {
        seats.push({
          seatNumber: `${row}${seatsInRow[i]}`,
          class: "first",
          isAvailable: true,
          price: basePrice.first,
        });
      }
      currentRow = row + 1;
    }

    // Generate business class seats (rows after first class, 4 seats per row: A, C, D, F)
    const businessRows = Math.ceil(businessSeats / 4);
    for (let row = 0; row < businessRows; row++) {
      const actualRow = currentRow + row;
      const seatsInRow = ["A", "C", "D", "F"]; // Business class layout
      for (
        let i = 0;
        i < seatsInRow.length && row * 4 + i + 1 <= businessSeats;
        i++
      ) {
        seats.push({
          seatNumber: `${actualRow}${seatsInRow[i]}`,
          class: "business",
          isAvailable: true,
          price: basePrice.business,
        });
      }
    }
    currentRow += businessRows;

    // Generate economy class seats (remaining rows, 6 seats per row: A, B, C, D, E, F)
    const economyRows = Math.ceil(economySeats / 6);
    for (let row = 0; row < economyRows; row++) {
      const actualRow = currentRow + row;
      const seatsInRow = ["A", "B", "C", "D", "E", "F"]; // Full economy layout
      for (
        let i = 0;
        i < seatsInRow.length && row * 6 + i + 1 <= economySeats;
        i++
      ) {
        seats.push({
          seatNumber: `${actualRow}${seatsInRow[i]}`,
          class: "economy",
          isAvailable: true,
          price: basePrice.economy,
        });
      }
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
        carryOn: { maxWeight: 7, maxDimensions: "55x40x20 cm" },
        checked: { included: 1, maxWeight: 23, extraBagPrice: 50 },
      },
      services: services || {
        meal: false,
        wifi: false,
        entertainment: false,
        extraLegroom: false,
      },
    });

    await newFlight.save();

    const populatedFlight = await Flight.findById(newFlight._id)
      .populate("airline", "name code")
      .populate("departureAirport", "name city country code")
      .populate("arrivalAirport", "name city country code");

    return res.status(201).json({
      success: true,
      data: { flight: populatedFlight },
      message: "Flight created successfully",
    });
  } catch (error) {
    console.error("Error creating flight:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Update flight (airline only)
export const updateFlight = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;

    if (!userId || req.user?.role !== "airline") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Airline account required.",
      });
    }

    // Find the airline associated with this user
    const airline = await Airline.findOne({ userId, isActive: true });
    if (!airline) {
      return res.status(404).json({
        success: false,
        message: "No airline found for current user",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid flight ID",
      });
    }

    // Find flight and verify ownership
    const flight = await Flight.findOne({ _id: id, airline: airline._id });

    if (!flight) {
      return res.status(404).json({
        success: false,
        message: "Flight not found or access denied",
      });
    }

    const updateData = req.body;

    // If regenerateSeats flag is provided, regenerate seats with proper class distribution
    if (updateData.regenerateSeats) {
      await flight.populate("aircraft");
      const capacity = flight.aircraft.capacity;
      const basePrice = flight.basePrice;

      // Generate seats based on aircraft capacity with realistic layout
      const seats: ISeat[] = [];

      // Calculate seat distribution
      const firstSeats = Math.floor(capacity * 0.1); // 10% first class
      const businessSeats = Math.floor(capacity * 0.2); // 20% business class
      const economySeats = capacity - firstSeats - businessSeats; // 70% economy

      let currentRow = 1;

      // Generate first class seats (rows 1-3, 2 seats per row: A, F)
      const firstRows = Math.ceil(firstSeats / 2);
      for (let row = currentRow; row < currentRow + firstRows; row++) {
        const seatsInRow = ["A", "F"]; // Only window seats in first class
        for (
          let i = 0;
          i < seatsInRow.length && (row - currentRow) * 2 + i + 1 <= firstSeats;
          i++
        ) {
          seats.push({
            seatNumber: `${row}${seatsInRow[i]}`,
            class: "first" as const,
            isAvailable: true,
            price: Math.floor(basePrice.first * (0.9 + Math.random() * 0.2)), // ±10% variation
          });
        }
      }
      currentRow += firstRows;

      // Generate business class seats (rows after first class, 4 seats per row: A, C, D, F)
      const businessRows = Math.ceil(businessSeats / 4);
      for (let row = currentRow; row < currentRow + businessRows; row++) {
        const seatsInRow = ["A", "C", "D", "F"]; // Business class layout
        for (
          let i = 0;
          i < seatsInRow.length &&
          (row - currentRow) * 4 + i + 1 <= businessSeats;
          i++
        ) {
          seats.push({
            seatNumber: `${row}${seatsInRow[i]}`,
            class: "business" as const,
            isAvailable: true,
            price: Math.floor(basePrice.business * (0.9 + Math.random() * 0.2)), // ±10% variation
          });
        }
      }
      currentRow += businessRows;

      // Generate economy class seats (remaining rows, 6 seats per row: A, B, C, D, E, F)
      const economyRows = Math.ceil(economySeats / 6);
      for (let row = currentRow; row < currentRow + economyRows; row++) {
        const seatsInRow = ["A", "B", "C", "D", "E", "F"]; // Full economy layout
        for (
          let i = 0;
          i < seatsInRow.length &&
          (row - currentRow) * 6 + i + 1 <= economySeats;
          i++
        ) {
          seats.push({
            seatNumber: `${row}${seatsInRow[i]}`,
            class: "economy" as const,
            isAvailable: true,
            price: Math.floor(basePrice.economy * (0.9 + Math.random() * 0.2)), // ±10% variation
          });
        }
      }

      // Update seats in the flight
      updateData.seats = seats;
      delete updateData.regenerateSeats; // Remove the flag from update data
    }

    // Recalculate duration if times are updated
    if (updateData.departureTime || updateData.arrivalTime) {
      const depTime = updateData.departureTime
        ? new Date(updateData.departureTime)
        : flight.departureTime;
      const arrTime = updateData.arrivalTime
        ? new Date(updateData.arrivalTime)
        : flight.arrivalTime;
      updateData.duration = Math.floor(
        (arrTime.getTime() - depTime.getTime()) / (1000 * 60)
      );
    }

    const updatedFlight = await Flight.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    })
      .populate("airline", "name code")
      .populate("departureAirport", "name city country code")
      .populate("arrivalAirport", "name city country code");

    res.json({
      success: true,
      data: { flight: updatedFlight },
      message: "Flight updated successfully",
    });
  } catch (error) {
    console.error("Error updating flight:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Delete flight (airline only)
export const deleteFlight = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;

    if (!userId || req.user?.role !== "airline") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Airline account required.",
      });
    }

    // Find the airline associated with this user
    const airline = await Airline.findOne({ userId, isActive: true });
    if (!airline) {
      return res.status(404).json({
        success: false,
        message: "No airline found for current user",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid flight ID",
      });
    }

    // Find flight and verify ownership
    const flight = await Flight.findOne({ _id: id, airline: airline._id });

    if (!flight) {
      return res.status(404).json({
        success: false,
        message: "Flight not found or access denied",
      });
    }

    // Soft delete by setting isActive to false
    await Flight.findByIdAndUpdate(id, {
      isActive: false,
      status: "cancelled",
    });

    res.json({
      success: true,
      message: "Flight cancelled successfully",
    });
  } catch (error) {
    console.error("Error deleting flight:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Get flights for airline (airline only)
export const getAirlineFlights = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId || req.user?.role !== "airline") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Airline account required.",
      });
    }

    // Find the airline associated with this user
    const airline = await Airline.findOne({ userId, isActive: true });
    if (!airline) {
      return res.status(404).json({
        success: false,
        message: "No airline found for current user",
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
      .populate("airline", "name code")
      .populate("departureAirport", "name city country code")
      .populate("arrivalAirport", "name city country code")
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit))
      .sort({ departureTime: -1 });

    const total = await Flight.countDocuments(filter);

    res.json({
      success: true,
      data: {
        flights,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
      },
    });
  } catch (error) {
    console.error("Error fetching airline flights:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Get cheapest flights for homepage
export const getCheapestFlights = async (req: Request, res: Response) => {
  console.log("getCheapestFlights called with query:", req.query);
  try {
    const limit = parseInt(req.query.limit as string) || 5;

    // Get active flights for the next 30 days, sorted by cheapest economy price
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const flights = await Flight.find({
      isActive: true,
      status: "scheduled",
      departureTime: {
        $gte: new Date(),
        $lte: thirtyDaysFromNow,
      },
      "basePrice.economy": { $exists: true, $gt: 0 },
    })
      .populate("airline", "name code logo")
      .populate("departureAirport", "name code city country")
      .populate("arrivalAirport", "name code city country")
      .populate("aircraft", "model")
      .sort({ "basePrice.economy": 1 })
      .limit(limit)
      .select(
        "flightNumber departureTime arrivalTime basePrice duration airline departureAirport arrivalAirport aircraft status"
      );

    return res.status(200).json({
      success: true,
      message: "Cheapest flights retrieved successfully",
      data: flights,
    });
  } catch (error) {
    console.error("Error fetching cheapest flights:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Regenerate seats for a flight with proper class distribution
export const regenerateFlightSeats = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const flight = await Flight.findById(id).populate("aircraft");

    if (!flight) {
      return res.status(404).json({
        success: false,
        message: "Flight not found",
      });
    }

    // Check if user owns the airline (for airline users)
    if (
      req.user &&
      "airline" in req.user &&
      flight.airline.toString() !== req.user.airline
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to modify this flight",
      });
    }

    const capacity = flight.aircraft.capacity;

    // Generate seats based on aircraft capacity with realistic layout
    const seats: ISeat[] = [];
    const basePrice = flight.basePrice;

    // Calculate seat distribution
    const firstSeats = Math.floor(capacity * 0.1); // 10% first class
    const businessSeats = Math.floor(capacity * 0.2); // 20% business class
    const economySeats = capacity - firstSeats - businessSeats; // 70% economy

    let currentRow = 1;

    // Generate first class seats (rows 1-3, 2 seats per row: A, F)
    const firstRows = Math.ceil(firstSeats / 2);
    for (let row = currentRow; row < currentRow + firstRows; row++) {
      const seatsInRow = ["A", "F"]; // Only window seats in first class
      for (
        let i = 0;
        i < seatsInRow.length && (row - currentRow) * 2 + i + 1 <= firstSeats;
        i++
      ) {
        seats.push({
          seatNumber: `${row}${seatsInRow[i]}`,
          class: "first" as const,
          isAvailable: true,
          price: Math.floor(basePrice.first * (0.9 + Math.random() * 0.2)), // ±10% variation
        });
      }
    }
    currentRow += firstRows;

    // Generate business class seats (rows after first class, 4 seats per row: A, C, D, F)
    const businessRows = Math.ceil(businessSeats / 4);
    for (let row = currentRow; row < currentRow + businessRows; row++) {
      const seatsInRow = ["A", "C", "D", "F"]; // Business class layout
      for (
        let i = 0;
        i < seatsInRow.length &&
        (row - currentRow) * 4 + i + 1 <= businessSeats;
        i++
      ) {
        seats.push({
          seatNumber: `${row}${seatsInRow[i]}`,
          class: "business" as const,
          isAvailable: true,
          price: Math.floor(basePrice.business * (0.9 + Math.random() * 0.2)), // ±10% variation
        });
      }
    }
    currentRow += businessRows;

    // Generate economy class seats (remaining rows, 6 seats per row: A, B, C, D, E, F)
    const economyRows = Math.ceil(economySeats / 6);
    for (let row = currentRow; row < currentRow + economyRows; row++) {
      const seatsInRow = ["A", "B", "C", "D", "E", "F"]; // Full economy layout
      for (
        let i = 0;
        i < seatsInRow.length && (row - currentRow) * 6 + i + 1 <= economySeats;
        i++
      ) {
        seats.push({
          seatNumber: `${row}${seatsInRow[i]}`,
          class: "economy" as const,
          isAvailable: true,
          price: Math.floor(basePrice.economy * (0.9 + Math.random() * 0.2)), // ±10% variation
        });
      }
    }

    // Update the flight with new seats
    flight.seats = seats;
    await flight.save();

    return res.status(200).json({
      success: true,
      message: "Flight seats regenerated successfully",
      data: {
        flight: await Flight.findById(id)
          .populate("airline", "name code")
          .populate("departureAirport", "name code city country")
          .populate("arrivalAirport", "name code city country")
          .populate("aircraft", "model capacity"),
        seatsGenerated: {
          first: firstSeats,
          business: businessSeats,
          economy: economySeats,
          total: seats.length,
        },
      },
    });
  } catch (error) {
    console.error("Error regenerating flight seats:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
