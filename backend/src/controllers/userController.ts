import { Request, Response, NextFunction } from "express";
import { User } from "../models/User";
import { Airline } from "../models/Airline";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

// Get all users (admin only)
export const getAllUsers = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Check if user is admin
    if (req.user?.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Admin privileges required.",
      });
    }

    const {
      role,
      active,
      page = 1,
      limit = 20,
      search,
      excludeRole,
    } = req.query;

    // Build query
    const query: any = {};

    if (role) {
      query.role = role;
    }

    // Exclude specific roles (e.g., airline users from user management)
    if (excludeRole) {
      if (Array.isArray(excludeRole)) {
        query.role = { $nin: excludeRole };
      } else {
        query.role = { $ne: excludeRole };
      }
    }

    if (active !== undefined) {
      query.isActive = active === "true";
    }

    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: "i" } },
        { lastName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const users = await User.find(query)
      .select("-password")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .populate("airline", "name code");

    const total = await User.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        users,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// Create airline user by invitation (admin only)
export const createAirlineByInvitation = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Check if user is admin
    if (req.user?.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Admin privileges required.",
      });
    }

    const {
      email,
      firstName,
      lastName,
      airlineName,
      airlineCode,
      country = "Italy",
    } = req.body;

    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Email already registered",
      });
    }

    // Check if airline code already exists
    const existingAirline = await Airline.findOne({
      code: airlineCode.toUpperCase(),
    });
    if (existingAirline) {
      return res.status(409).json({
        success: false,
        message: "Airline code already exists",
      });
    }

    // Generate simple temporary password (easier to read and type)
    const tempPassword = `temp${Date.now().toString().slice(-6)}${Math.floor(
      Math.random() * 100
    )
      .toString()
      .padStart(2, "0")}`;

    // Create airline user (password will be hashed by middleware)
    const airlineUser = new User({
      email,
      password: tempPassword, // Simple password, let middleware handle hashing
      firstName,
      lastName,
      role: "airline",
      isActive: true,
      isEmailVerified: false,
      mustChangePassword: true,
    });

    await airlineUser.save();

    // Create airline company
    const airline = new Airline({
      name: airlineName,
      code: airlineCode.toUpperCase(),
      country,
      contactEmail: email,
      userId: airlineUser._id,
      isActive: true,
    });

    await airline.save();

    // Update user with airline reference
    airlineUser.airline = airline._id as mongoose.Types.ObjectId;
    await airlineUser.save();

    // In a real application, you would send an email with the temporary password
    console.log(`Temporary password for ${email}: ${tempPassword}`);

    res.status(201).json({
      success: true,
      message:
        "Airline user created successfully. Temporary password sent via email.",
      data: {
        user: {
          id: airlineUser._id,
          email: airlineUser.email,
          firstName: airlineUser.firstName,
          lastName: airlineUser.lastName,
          role: airlineUser.role,
          mustChangePassword: airlineUser.mustChangePassword,
        },
        airline: {
          id: airline._id,
          name: airline.name,
          code: airline.code,
          country: airline.country,
        },
        temporaryPassword: tempPassword, // Remove this in production
      },
    });
  } catch (error) {
    next(error);
  }
};

// Delete user (admin only)
export const deleteUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Check if user is admin
    if (req.user?.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Admin privileges required.",
      });
    }

    const { userId } = req.params;

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Prevent deletion of admin users
    if (user.role === "admin") {
      return res.status(403).json({
        success: false,
        message: "Cannot delete admin users",
      });
    }

    // If it's an airline user, also delete the airline
    if (user.role === "airline" && user.airline) {
      await Airline.findByIdAndDelete(user.airline);
    }

    // Delete user
    await User.findByIdAndDelete(userId);

    res.status(200).json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

// Toggle user active status (admin only)
export const toggleUserStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Check if user is admin
    if (req.user?.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Admin privileges required.",
      });
    }

    const { userId } = req.params;

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Prevent deactivation of admin users
    if (user.role === "admin") {
      return res.status(403).json({
        success: false,
        message: "Cannot modify admin user status",
      });
    }

    // Toggle status
    user.isActive = !user.isActive;
    await user.save();

    // If it's an airline user, also update airline status
    if (user.role === "airline" && user.airline) {
      await Airline.findByIdAndUpdate(user.airline, {
        isActive: user.isActive,
      });
    }

    res.status(200).json({
      success: true,
      message: `User ${
        user.isActive ? "activated" : "deactivated"
      } successfully`,
      data: {
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          isActive: user.isActive,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get user by ID (admin only)
export const getUserById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Check if user is admin
    if (req.user?.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Admin privileges required.",
      });
    }

    const { userId } = req.params;

    const user = await User.findById(userId)
      .select("-password")
      .populate("airline", "name code country");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};

// Delete own account
export const deleteProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    // Delete user's bookings first
    const Booking = require("../models/Booking").default;
    await Booking.deleteMany({ userId: userId });

    // Delete the user
    const deletedUser = await User.findByIdAndDelete(userId);

    if (!deletedUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Account deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};
