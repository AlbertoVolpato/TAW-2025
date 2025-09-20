import express from "express";
import {
  getAllAirlines,
  getAirlineById,
  getAirlineByCode,
  createAirline,
  createAirlineByInvitation,
  updateAirline,
  deleteAirline,
  getMyAirline,
  getAirlineStatistics,
  getRevenueStatistics,
  getPassengerStatistics,
  getAirlineRevenueStats,
  getPopularRoutes,
} from "../controllers/airlineController";
import { authenticate, authorize } from "../middleware/auth";

const router = express.Router();

// Public routes
router.get("/", getAllAirlines);
router.get("/code/:code", getAirlineByCode);
router.get("/:id", getAirlineById);

// Airline user routes
router.get("/my/airline", authenticate, authorize("airline"), getMyAirline);
router.get(
  "/my/statistics",
  authenticate,
  authorize("airline"),
  getAirlineStatistics
);
router.get(
  "/my/revenue",
  authenticate,
  authorize("airline"),
  getRevenueStatistics
);
router.get(
  "/my/revenue-stats",
  authenticate,
  authorize("airline"),
  getAirlineRevenueStats
);
router.get(
  "/my/passengers",
  authenticate,
  authorize("airline"),
  getPassengerStatistics
);
router.get(
  "/my/popular-routes",
  authenticate,
  authorize("airline"),
  getPopularRoutes
);

// Admin only routes
router.post("/", authenticate, authorize("admin"), createAirline);
router.post(
  "/invite",
  authenticate,
  authorize("admin"),
  createAirlineByInvitation
);
router.delete("/:id", authenticate, authorize("admin"), deleteAirline);

// Admin or airline owner routes
router.put("/:id", authenticate, authorize("admin", "airline"), updateAirline);

export default router;
