import { Request, Response } from "express";
import { User } from "../models/User";
import { Flight } from "../models/Flight";
import { Airline } from "../models/Airline";
import { Booking } from "../models/Booking";

export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    // Statistiche dashboard specifiche per admin
    const totalUsers = await User.countDocuments();
    const totalAirlines = await Airline.countDocuments();
    const totalFlights = await Flight.countDocuments();
    const totalBookings = await Booking.countDocuments();

    // Statistiche per ruolo
    const usersByRole = await User.aggregate([
      {
        $group: {
          _id: "$role",
          count: { $sum: 1 },
        },
      },
    ]);

    // Prenotazioni recenti (ultimo mese)
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    const recentBookings = await Booking.countDocuments({
      createdAt: { $gte: lastMonth },
    });

    // Crescita utenti (ultimo mese)
    const newUsers = await User.countDocuments({
      createdAt: { $gte: lastMonth },
    });

    const stats = {
      totalUsers,
      totalAirlines,
      totalFlights,
      totalBookings,
      usersByRole,
      recentBookings,
      newUsers,
      growthRate:
        totalUsers > 0 ? ((newUsers / totalUsers) * 100).toFixed(1) : "0",
    };

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("Error getting dashboard stats:", error);
    res.status(500).json({
      success: false,
      message: "Errore nel recupero delle statistiche dashboard",
    });
  }
};
