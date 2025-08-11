import express from 'express';
import {
  createExpense,

  updateExpense,
  deleteExpense,
  getExpensesByHotel,

} from '../controllers/expenseController.js';
import { authenticateToken, authorizeRole } from '../middleware/auth.js';
import { checkManagerHotelAccess } from '../middleware/hotelAccess.js';
import { validateExpenseData, validateExpenseUpdate } from '../middleware/validation.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Create a new expense (managers and admins only)
router.post('/', authorizeRole('manager', 'admin'), validateExpenseData, createExpense);


// Update expense (managers and admins only)
router.put('/:id', authorizeRole('manager', 'admin'), validateExpenseUpdate, updateExpense);

// Delete expense (managers and admins only)
router.delete('/:id', authorizeRole('manager', 'admin'), deleteExpense);

// Get expenses by hotel (managers and admins only)
router.get('/:hotelId', authorizeRole('manager', 'admin'), checkManagerHotelAccess, getExpensesByHotel);



export default router; 