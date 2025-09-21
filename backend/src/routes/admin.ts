import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth";
import { getDashboardStats } from "../controllers/adminController";

const router = Router();

// Middleware per verificare che l'utente sia admin
router.use(authenticate, authorize("admin"));

// Rotte per statistiche dashboard admin
router.get("/dashboard-stats", getDashboardStats);

export default router;
