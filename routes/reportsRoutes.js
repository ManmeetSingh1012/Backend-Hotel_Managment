import express from "express";
import {
  getPaymentModeReport,
  exportPaymentModeReportCSV,
  generateCustomerBill,
  exportGuestRecordsByHotelCSV,
  exportPendingPaymentsReportCSV,
  exportDailyBalanceSheetCSV,
  exportMonthlyBalanceSheetCSV,
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

// Export daily balance sheet CSV report for specified date or today
router.get(
  "/daily-balance-sheet/:hotelId/csv",
  authorizeRole("manager", "admin"),
  checkManagerHotelAccess,
  exportDailyBalanceSheetCSV
);

// Export monthly balance sheet CSV report for current month (1st to current day)
router.get(
  "/monthly-balance-sheet/:hotelId/csv",
  authorizeRole("manager", "admin"),
  checkManagerHotelAccess,
  exportMonthlyBalanceSheetCSV
);

export default router;
