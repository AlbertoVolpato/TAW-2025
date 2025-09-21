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

export const getSystemStats = async (req: Request, res: Response) => {
  try {
    // Ottieni statistiche generali del sistema
    const totalUsers = await User.countDocuments();
    const totalAirlines = await Airline.countDocuments();
    const totalFlights = await Flight.countDocuments();
    const totalBookings = await Booking.countDocuments();

    // Statistiche più dettagliate
    const activeUsers = await User.countDocuments({ active: true });
    const pendingInvites = await User.countDocuments({
      role: "airline",
      active: false,
    });

    const stats = {
      totalUsers,
      totalAirlines,
      totalFlights,
      totalBookings,
      activeUsers,
      pendingInvites,
    };

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("Error getting system stats:", error);
    res.status(500).json({
      success: false,
      message: "Errore nel recupero delle statistiche di sistema",
    });
  }
};

export const getRecentActivities = async (req: Request, res: Response) => {
  try {
    // Simuliamo alcune attività recenti
    // In un'implementazione reale, dovreste avere una tabella di audit log
    const activities = [
      {
        id: "1",
        type: "user_registration",
        description: "Nuovo utente registrato: Mario Rossi",
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 ore fa
      },
      {
        id: "2",
        type: "airline_invite",
        description: "Invito inviato a Lufthansa per registrazione",
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 ore fa
      },
      {
        id: "3",
        type: "booking_created",
        description: "Nuova prenotazione creata per il volo AZ123",
        timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 ore fa
      },
      {
        id: "4",
        type: "route_created",
        description: "Nuova rotta creata: Roma FCO → Milano MXP",
        timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 ore fa
      },
      {
        id: "5",
        type: "system_config",
        description: "Configurazione sistema aggiornata",
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 giorno fa
      },
    ];

    res.json(activities);
  } catch (error) {
    console.error("Error getting recent activities:", error);
    res.status(500).json({
      success: false,
      message: "Errore nel recupero delle attività recenti",
    });
  }
};

export const sendAirlineInvite = async (req: Request, res: Response) => {
  try {
    const { companyName, email, iataCode, message } = req.body;

    // Validazione input
    if (!companyName || !email) {
      return res.status(400).json({
        success: false,
        message: "Nome compagnia e email sono richiesti",
      });
    }

    // Verifica se email già esistente
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Un utente con questa email esiste già",
      });
    }

    // In un'implementazione reale, qui inviereste un'email con un link di invito
    // Per ora simuliamo solo la creazione di un utente airline inattivo

    const airlineUser = new User({
      firstName: companyName,
      lastName: "Admin",
      email,
      password: "temp_password_to_change", // Password temporanea
      role: "airline",
      active: false, // L'account sarà attivato quando completano la registrazione
      metadata: {
        iataCode,
        inviteMessage: message,
        invitedAt: new Date(),
        invitedBy: req.user?.userId,
      },
    });

    await airlineUser.save();

    // Log dell'attività
    console.log(
      `Admin ${req.user?.userId} invited ${companyName} (${email}) to register as airline`
    );

    res.json({
      success: true,
      message: `Invito inviato con successo a ${companyName}`,
      data: {
        userId: airlineUser._id,
        email: airlineUser.email,
        companyName,
      },
    });
  } catch (error) {
    console.error("Error sending airline invite:", error);
    res.status(500).json({
      success: false,
      message: "Errore nell'invio dell'invito",
    });
  }
};
