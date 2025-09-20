import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth";
import {
  getSystemStats,
  getRecentActivities,
  sendAirlineInvite,
} from "../controllers/systemController";

const router = Router();

// Middleware per verificare che l'utente sia admin
router.use(authenticate, authorize("admin"));

// Rotte per statistiche sistema
router.get("/stats", getSystemStats);

// Rotte per attività recenti
router.get("/activities/recent", getRecentActivities);

// Rotte per inviti compagnie aeree
router.post("/invite/airline", sendAirlineInvite);

export default router;
