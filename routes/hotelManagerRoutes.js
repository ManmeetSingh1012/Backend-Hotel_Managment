import express from "express";
import {

  unassignManager,
  getHotelManagers,

  updateAssignmentStatus,
  createManagerAndAssign,
} from "../controllers/hotelManagerController.js";
import { authenticateToken, authorizeRole } from "../middleware/auth.js";
import {
  validateHotelManagerAssignment,
  validateAssignmentStatus,
  validateCreateManagerAndAssign,
} from "../middleware/validation.js";

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

// POST /api/hotel-managers/:hotelId/create-manager - Create user and assign as hotel manager (admin only)
router.post(
  "/create-manager/:hotelId",
  authorizeRole("admin"),
  validateCreateManagerAndAssign,
  createManagerAndAssign
);

// DELETE /api/hotel-managers/unassign - Remove manager from hotel (admin only)
router.delete(
  "/unassign",
  authorizeRole("admin"),
  validateHotelManagerAssignment,
  unassignManager
);

// GET /api/hotel-managers/:hotelId - Get all managers for specific hotel
router.get("/:hotelId", getHotelManagers);

// PUT /api/hotel-managers/:id/status - Update assignment status
router.put(
  "/:id/status",
  authorizeRole("admin"),
  validateAssignmentStatus,
  updateAssignmentStatus
);

export default router;
