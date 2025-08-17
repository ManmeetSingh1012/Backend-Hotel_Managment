import express from 'express';
import {
  createExpenseMode,
  getExpenseModes,
  getExpenseModeById,
  updateExpenseMode,
  deleteExpenseMode
} from '../controllers/expenseModeController.js';
import { authenticateToken } from '../middleware/auth.js';
import { validateExpenseModeData } from '../middleware/validation.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Create a new expense mode
router.post('/', validateExpenseModeData, createExpenseMode);

// Get all expense modes
router.get('/', getExpenseModes);

// Get a specific expense mode by ID
router.get('/:id', getExpenseModeById);

// Update an expense mode
router.put('/:id', validateExpenseModeData, updateExpenseMode);

// Delete an expense mode
router.delete('/:id', deleteExpenseMode);

export default router;