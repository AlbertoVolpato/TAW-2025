import express from "express";
import {
  getProfile,
  updateProfile,
  changePassword,
} from "../controllers/authController";
import { authenticate, authorize } from "../middleware/auth";
import {
  getAllUsers,
  createAirlineByInvitation,
  deleteUser,
  toggleUserStatus,
  getUserById,
  deleteProfile,
} from "../controllers/userController";

const router = express.Router();

// Protected routes (user profile management)
router.get("/profile", authenticate, getProfile);
router.put("/profile", authenticate, updateProfile);
router.delete("/profile", authenticate, deleteProfile);
router.put("/change-password", authenticate, changePassword);

// Admin-only user management routes
router.get("/admin/all", authenticate, authorize("admin"), getAllUsers);
router.get("/admin/:userId", authenticate, authorize("admin"), getUserById);
router.post(
  "/admin/invite-airline",
  authenticate,
  authorize("admin"),
  createAirlineByInvitation
);
router.patch(
  "/admin/:userId/toggle-status",
  authenticate,
  authorize("admin"),
  toggleUserStatus
);
router.delete("/admin/:userId", authenticate, authorize("admin"), deleteUser);

export default router;
