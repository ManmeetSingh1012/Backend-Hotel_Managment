import express from "express";
import {
  getPendingPaymentsByHotel,
  createPendingPayment,
  updatePendingPayment,
  deletePendingPayment,
} from "../controllers/guestPendingPaymentController.js";
import {
  validateGuestPendingPaymentData,
  validateGuestPendingPaymentUpdate,
} from "../middleware/validation.js";

const router = express.Router();

// Get all pending payments for a specific hotel with pagination and search
// GET /api/guest-pending-payments/:hotelId?page=1&limit=10&search=guestName
router.get("/:hotelId", getPendingPaymentsByHotel);

// Create a new pending payment
// POST /api/guest-pending-payments
router.post("/", validateGuestPendingPaymentData, createPendingPayment);

// Update a pending payment
// PUT /api/guest-pending-payments/:id
router.put("/:id", validateGuestPendingPaymentUpdate, updatePendingPayment);

// Delete a pending payment
// DELETE /api/guest-pending-payments/:id
router.delete("/:id", deletePendingPayment);

export default router;
