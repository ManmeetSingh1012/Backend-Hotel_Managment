import express from 'express';
import { getPaymentModeReport } from '../controllers/reportsController.js';
import { authenticateToken } from '../middleware/auth.js';
import { checkManagerHotelAccess } from '../middleware/hotelAccess.js';

const router = express.Router();


router.get('/payment-mode/:hotelId', 
  authenticateToken, 
  checkManagerHotelAccess, 
  getPaymentModeReport
);

export default router;
