import { Request, Response } from "express";
import { Route, IRoute } from "../models/Route";
import { Airline } from "../models/Airline";
import { Airport } from "../models/Airport";
import mongoose from "mongoose";

// Get all routes for the authenticated airline
export const getAirlineRoutes = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId || req.user?.role !== "airline") {
      return res
        .status(403)
        .json({ message: "Access denied. Airline account required." });
    }

    // Find the airline associated with this user
    const airline = await Airline.findOne({ userId, isActive: true });
    if (!airline) {
      return res
        .status(404)
        .json({ message: "No airline found for current user" });
    }

    const airlineId = airline._id;

    const routes = await Route.find({ airline: airlineId })
      .populate("origin", "name city country iataCode")
      .populate("destination", "name city country iataCode")
      .populate("airline", "name iataCode")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: routes,
      count: routes.length,
    });
  } catch (error) {
    console.error("Error fetching airline routes:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Get all active routes (public endpoint)
export const getAllRoutes = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 20, airline, origin, destination } = req.query;

    const filter: any = { isActive: true };

    if (airline) {
      filter.airline = airline;
    }

    if (origin) {
      filter.origin = origin;
    }

    if (destination) {
      filter.destination = destination;
    }

    const routes = await Route.find(filter)
      .populate("origin", "name city country iataCode")
      .populate("destination", "name city country iataCode")
      .populate("airline", "name iataCode")
      .limit(Number(limit) * 1)
      .skip((Number(page) - 1) * Number(limit))
      .sort({ createdAt: -1 });

    const total = await Route.countDocuments(filter);

    res.json({
      success: true,
      data: routes,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error("Error fetching routes:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Get route by ID
export const getRouteById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid route ID" });
    }

    const route = await Route.findById(id)
      .populate("origin", "name city country iataCode")
      .populate("destination", "name city country iataCode")
      .populate("airline", "name iataCode");

    if (!route) {
      return res.status(404).json({ message: "Route not found" });
    }

    res.json({
      success: true,
      data: route,
    });
  } catch (error) {
    console.error("Error fetching route:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Create new route (airline only)
export const createRoute = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId || req.user?.role !== "airline") {
      return res
        .status(403)
        .json({ message: "Access denied. Airline account required." });
    }

    // Find the airline associated with this user
    const airline = await Airline.findOne({ userId, isActive: true });
    if (!airline) {
      return res
        .status(404)
        .json({ message: "No airline found for current user" });
    }

    const airlineId = airline._id;

    const {
      routeCode,
      origin,
      destination,
      distance,
      estimatedDuration,
      operatingDays,
      seasonality,
    } = req.body;

    // Validate required fields
    if (
      !routeCode ||
      !origin ||
      !destination ||
      !distance ||
      !estimatedDuration
    ) {
      return res.status(400).json({
        message:
          "Missing required fields: routeCode, origin, destination, distance, estimatedDuration",
      });
    }

    // Validate airports exist
    const [originAirport, destinationAirport] = await Promise.all([
      Airport.findById(origin),
      Airport.findById(destination),
    ]);

    if (!originAirport) {
      return res.status(400).json({ message: "Origin airport not found" });
    }

    if (!destinationAirport) {
      return res.status(400).json({ message: "Destination airport not found" });
    }

    // Check if route code already exists for this airline
    const existingRoute = await Route.findOne({
      routeCode: routeCode.toUpperCase(),
      airline: airlineId,
    });

    if (existingRoute) {
      return res.status(400).json({
        message: "Route code already exists for this airline",
      });
    }

    // Create new route
    const newRoute = new Route({
      routeCode: routeCode.toUpperCase(),
      airline: airlineId,
      origin,
      destination,
      distance,
      estimatedDuration,
      operatingDays: operatingDays || [1, 2, 3, 4, 5, 6, 7], // Default to all days
      seasonality: seasonality || [],
    });

    await newRoute.save();

    // Populate the response
    const populatedRoute = await Route.findById(newRoute._id)
      .populate("origin", "name city country iataCode")
      .populate("destination", "name city country iataCode")
      .populate("airline", "name iataCode");

    return res.status(201).json({
      success: true,
      message: "Route created successfully",
      data: populatedRoute,
    });
  } catch (error) {
    console.error("Error creating route:", error);

    if (error instanceof Error && error.name === "ValidationError") {
      return res.status(400).json({
        message: "Validation error",
        details: error.message,
      });
    }

    return res.status(500).json({ message: "Internal server error" });
  }
};

// Update route (airline only)
export const updateRoute = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;

    if (!userId || req.user?.role !== "airline") {
      return res
        .status(403)
        .json({ message: "Access denied. Airline account required." });
    }

    // Find the airline associated with this user
    const airline = await Airline.findOne({ userId, isActive: true });
    if (!airline) {
      return res
        .status(404)
        .json({ message: "No airline found for current user" });
    }

    const airlineId = airline._id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid route ID" });
    }

    // Find route and verify ownership
    const route = await Route.findOne({ _id: id, airline: airlineId });

    if (!route) {
      return res
        .status(404)
        .json({ message: "Route not found or access denied" });
    }

    const {
      routeCode,
      origin,
      destination,
      distance,
      estimatedDuration,
      operatingDays,
      seasonality,
      isActive,
    } = req.body;

    // Validate airports if provided
    if (origin) {
      const originAirport = await Airport.findById(origin);
      if (!originAirport) {
        return res.status(400).json({ message: "Origin airport not found" });
      }
    }

    if (destination) {
      const destinationAirport = await Airport.findById(destination);
      if (!destinationAirport) {
        return res
          .status(400)
          .json({ message: "Destination airport not found" });
      }
    }

    // Check route code uniqueness if changed
    if (routeCode && routeCode.toUpperCase() !== route.routeCode) {
      const existingRoute = await Route.findOne({
        routeCode: routeCode.toUpperCase(),
        airline: airlineId,
        _id: { $ne: id },
      });

      if (existingRoute) {
        return res.status(400).json({
          message: "Route code already exists for this airline",
        });
      }
    }

    // Update route
    const updateData: Partial<IRoute> = {};

    if (routeCode) updateData.routeCode = routeCode.toUpperCase();
    if (origin) updateData.origin = origin;
    if (destination) updateData.destination = destination;
    if (distance) updateData.distance = distance;
    if (estimatedDuration) updateData.estimatedDuration = estimatedDuration;
    if (operatingDays) updateData.operatingDays = operatingDays;
    if (seasonality !== undefined) updateData.seasonality = seasonality;
    if (isActive !== undefined) updateData.isActive = isActive;

    const updatedRoute = await Route.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    })
      .populate("origin", "name city country iataCode")
      .populate("destination", "name city country iataCode")
      .populate("airline", "name iataCode");

    res.json({
      success: true,
      message: "Route updated successfully",
      data: updatedRoute,
    });
  } catch (error) {
    console.error("Error updating route:", error);

    if (error instanceof Error && error.name === "ValidationError") {
      return res.status(400).json({
        message: "Validation error",
        details: error.message,
      });
    }

    return res.status(500).json({ message: "Internal server error" });
  }
};

// Delete route (airline only)
export const deleteRoute = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;

    if (!userId || req.user?.role !== "airline") {
      return res
        .status(403)
        .json({ message: "Access denied. Airline account required." });
    }

    // Find the airline associated with this user
    const airline = await Airline.findOne({ userId, isActive: true });
    if (!airline) {
      return res
        .status(404)
        .json({ message: "No airline found for current user" });
    }

    const airlineId = airline._id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid route ID" });
    }

    // Find route and verify ownership
    const route = await Route.findOne({ _id: id, airline: airlineId });

    if (!route) {
      return res
        .status(404)
        .json({ message: "Route not found or access denied" });
    }

    // Check if route has active flights
    // Note: This would require importing Flight model and checking
    // For now, we'll just soft delete by setting isActive to false

    await Route.findByIdAndUpdate(id, { isActive: false });

    res.json({
      success: true,
      message: "Route deactivated successfully",
    });
  } catch (error) {
    console.error("Error deleting route:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Get routes between two airports (public endpoint)
export const getRoutesBetweenAirports = async (req: Request, res: Response) => {
  try {
    const { origin, destination } = req.query;

    if (!origin || !destination) {
      return res.status(400).json({
        message: "Origin and destination airport IDs are required",
      });
    }

    const routes = await Route.find({
      origin,
      destination,
      isActive: true,
    })
      .populate("origin", "name city country iataCode")
      .populate("destination", "name city country iataCode")
      .populate("airline", "name iataCode")
      .sort({ distance: 1 });

    res.json({
      success: true,
      data: routes,
      count: routes.length,
    });
  } catch (error) {
    console.error("Error fetching routes between airports:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Admin-specific route management functions

// Admin create route - can create routes for any airline
export const createRouteForAdmin = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId || req.user?.role !== "admin") {
      return res
        .status(403)
        .json({ message: "Access denied. Admin account required." });
    }

    const {
      origin,
      destination,
      distance,
      flightTime,
      isActive,
      airline, // Optional: if not provided, will use a default system airline
    } = req.body;

    // Validate required fields
    if (!origin || !destination || !distance || !flightTime) {
      return res.status(400).json({
        message:
          "Missing required fields: origin, destination, distance, flightTime",
      });
    }

    // Validate airports exist
    const [originAirport, destinationAirport] = await Promise.all([
      Airport.findOne({
        $or: [{ _id: origin._id }, { code: origin.iataCode }],
      }),
      Airport.findOne({
        $or: [{ _id: destination._id }, { code: destination.iataCode }],
      }),
    ]);

    if (!originAirport) {
      return res.status(400).json({ message: "Origin airport not found" });
    }

    if (!destinationAirport) {
      return res.status(400).json({ message: "Destination airport not found" });
    }

    // Generate route code
    const routeCode = `${originAirport.code}${destinationAirport.code}`;

    // Get or create system airline if no specific airline provided
    let airlineId = airline?._id;
    if (!airlineId) {
      let systemAirline = await Airline.findOne({ name: "Sistema" });
      if (!systemAirline) {
        systemAirline = new Airline({
          name: "Sistema",
          iataCode: "SYS",
          icaoCode: "SYS",
          country: "System",
          isActive: true,
        });
        await systemAirline.save();
      }
      airlineId = systemAirline._id;
    }

    // Create new route
    const newRoute = new Route({
      routeCode,
      airline: airlineId,
      origin: originAirport._id,
      destination: destinationAirport._id,
      distance,
      estimatedDuration: flightTime,
      isActive: isActive !== false,
      operatingDays: [1, 2, 3, 4, 5, 6, 7],
    });

    await newRoute.save();

    // Populate the response
    const populatedRoute = await Route.findById(newRoute._id)
      .populate("origin", "name city country iataCode")
      .populate("destination", "name city country iataCode")
      .populate("airline", "name iataCode");

    return res.status(201).json({
      success: true,
      message: "Route created successfully",
      data: populatedRoute,
    });
  } catch (error) {
    console.error("Error creating route (admin):", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Admin update route - can update any route
export const updateRouteForAdmin = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId || req.user?.role !== "admin") {
      return res
        .status(403)
        .json({ message: "Access denied. Admin account required." });
    }

    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid route ID" });
    }

    const route = await Route.findById(id);
    if (!route) {
      return res.status(404).json({ message: "Route not found" });
    }

    const { distance, flightTime, isActive } = req.body;

    // Update allowed fields
    if (distance !== undefined) route.distance = distance;
    if (flightTime !== undefined) route.estimatedDuration = flightTime;
    if (isActive !== undefined) route.isActive = isActive;

    await route.save();

    // Populate the response
    const populatedRoute = await Route.findById(route._id)
      .populate("origin", "name city country iataCode")
      .populate("destination", "name city country iataCode")
      .populate("airline", "name iataCode");

    return res.json({
      success: true,
      message: "Route updated successfully",
      data: populatedRoute,
    });
  } catch (error) {
    console.error("Error updating route (admin):", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Admin delete route - can delete any route
export const deleteRouteForAdmin = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId || req.user?.role !== "admin") {
      return res
        .status(403)
        .json({ message: "Access denied. Admin account required." });
    }

    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid route ID" });
    }

    const route = await Route.findById(id);
    if (!route) {
      return res.status(404).json({ message: "Route not found" });
    }

    // Soft delete by setting isActive to false
    await Route.findByIdAndUpdate(id, { isActive: false });

    res.json({
      success: true,
      message: "Route deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting route (admin):", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
