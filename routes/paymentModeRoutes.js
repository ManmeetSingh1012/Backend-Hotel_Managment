import express from 'express';
import {
  createPaymentMode,
  getPaymentModes,
  getPaymentModeById,
  updatePaymentMode,
  deletePaymentMode
} from '../controllers/paymentModeController.js';
import { authenticateToken } from '../middleware/auth.js';
import { validatePaymentModeData } from '../middleware/validation.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Create a new payment mode
router.post('/', validatePaymentModeData, createPaymentMode);

// Get all payment modes
router.get('/', getPaymentModes);

// Get a specific payment mode by ID
router.get('/:id', getPaymentModeById);

// Update a payment mode
router.put('/:id', validatePaymentModeData, updatePaymentMode);

// Delete a payment mode
router.delete('/:id', deletePaymentMode);

export default router; 