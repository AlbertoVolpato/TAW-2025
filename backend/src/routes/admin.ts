import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth";
import { getDashboardStats } from "../controllers/adminController";
import {
  getAllRoutes,
  createRouteForAdmin,
  updateRouteForAdmin,
  deleteRouteForAdmin,
} from "../controllers/routeController";

const router = Router();

// Middleware per verificare che l'utente sia admin
router.use(authenticate, authorize("admin"));

// Rotte per statistiche dashboard admin
router.get("/dashboard-stats", getDashboardStats);

// Admin routes for route management
router.get("/routes", getAllRoutes);
router.post("/routes", createRouteForAdmin);
router.put("/routes/:id", updateRouteForAdmin);
router.delete("/routes/:id", deleteRouteForAdmin);

export default router;
