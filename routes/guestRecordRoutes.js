import express from 'express';
import {
  createGuestRecord,
  updateGuestRecord,
  deleteGuestRecord,
  searchGuestRecords,
  getGuestRecordsByDateRange,
  getGuestRecordsByHotel,
  addFoodExpense,
  updateFoodExpense
} from '../controllers/guestRecordController.js';
import { authenticateToken, authorizeRole } from '../middleware/auth.js';
import { checkManagerHotelAccess } from '../middleware/hotelAccess.js';
import { validateGuestRecordData, validateGuestRecordUpdate, validateAddFoodExpense, validateUpdateFoodExpense } from '../middleware/validation.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Create a new guest record (managers and admins only)
router.post('/', authorizeRole('manager', 'admin'), validateGuestRecordData, createGuestRecord);

// Update guest record (managers and admins only)
router.put('/:id', authorizeRole('manager', 'admin'), validateGuestRecordUpdate, updateGuestRecord);

// Update guest record (managers and admins only)
//router.put('/updatefood/:id', authorizeRole('manager', 'admin'), validateGuestRecordUpdate, updateGuestRecord);

// Delete guest record (managers and admins only)
router.delete('/:id', authorizeRole('manager', 'admin'), deleteGuestRecord);

// Search guest records (managers and admins only)
router.get('/search', authorizeRole('manager', 'admin'), searchGuestRecords);

// Get guest records by date range (managers and admins only)
router.get('/date-range', authorizeRole('manager', 'admin'), getGuestRecordsByDateRange);

// Get guest records by hotel (managers and admins only)
router.get('/:hotelId', authorizeRole('manager', 'admin'), checkManagerHotelAccess, getGuestRecordsByHotel);

// Add food expense (managers and admins only)
router.post('/food-expense/add/:bookingId', authorizeRole('manager', 'admin'), validateAddFoodExpense, addFoodExpense);

// Update food expense (managers and admins only)
router.put('/food-expense/update/:expenseId', authorizeRole('manager', 'admin'), validateUpdateFoodExpense, updateFoodExpense);

export default router; 