import express from "express";
import {
  getPaymentModeReport,
  exportPaymentModeReportCSV,
  generateCustomerBill,
  exportGuestRecordsByHotelCSV,
  exportPendingPaymentsReportCSV,
} from "../controllers/reportsController.js";
import { authenticateToken, authorizeRole } from "../middleware/auth.js";
import {
  checkManagerHotelAccess,
  checkGuestRecordAccess,
} from "../middleware/hotelAccess.js";
const router = express.Router();

router.use(authenticateToken);

router.get(
  "/payment-mode/:hotelId",
  authenticateToken,
  checkManagerHotelAccess,
  getPaymentModeReport
);

router.get(
  "/payment-mode/:hotelId/csv",
  authenticateToken,
  checkManagerHotelAccess,
  exportPaymentModeReportCSV
);

router.get(
  "/customer-bill/:bookingId",
  authenticateToken,
  checkGuestRecordAccess,
  generateCustomerBill
);

// Export guest records by hotel to CSV (managers and admins only)
router.get(
  "/:hotelId/csv",
  authorizeRole("manager", "admin"),
  checkManagerHotelAccess,
  exportGuestRecordsByHotelCSV
);

// Export pending payments report for current month in CSV format
router.get(
  "/pending-payments/:hotelId/csv",
  authorizeRole("manager", "admin"),
  checkManagerHotelAccess,
  exportPendingPaymentsReportCSV
);

export default router;
