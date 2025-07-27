import express from 'express';
import {
  createExpense,
  getAllExpenses,
  getExpenseById,
  updateExpense,
  deleteExpense,
  getExpensesByHotel,
  getExpenseStats
} from '../controllers/expenseController.js';
import { authenticateToken, authorizeRole } from '../middleware/auth.js';
import { checkManagerHotelAccess } from '../middleware/hotelAccess.js';
import { validateExpenseData, validateExpenseUpdate } from '../middleware/validation.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Create a new expense (managers and admins only)
router.post('/', authorizeRole('manager', 'admin'), validateExpenseData, createExpense);

// Get all expenses with filters and pagination (managers and admins only)
router.get('/', authorizeRole('manager', 'admin'), getAllExpenses);

// Get expense by ID (managers and admins only)
router.get('/:id', authorizeRole('manager', 'admin'), getExpenseById);

// Update expense (managers and admins only)
router.put('/:id', authorizeRole('manager', 'admin'), validateExpenseUpdate, updateExpense);

// Delete expense (managers and admins only)
router.delete('/:id', authorizeRole('manager', 'admin'), deleteExpense);

// Get expenses by hotel (managers and admins only)
router.get('/:hotelId', authorizeRole('manager', 'admin'), checkManagerHotelAccess, getExpensesByHotel);

// Get expense statistics (managers and admins only)
router.get('/stats', authorizeRole('manager', 'admin'), getExpenseStats);

export default router; 