import express from 'express';
import {
  createGuestRecord,
  getAllGuestRecords,
  getGuestRecordById,
  updateGuestRecord,
  deleteGuestRecord,
  searchGuestRecords,
  getGuestRecordsByDateRange,
  getGuestRecordsByHotel,
  getGuestRecordStats
} from '../controllers/guestRecordController.js';
import { authenticateToken, authorizeRole } from '../middleware/auth.js';
import { checkManagerHotelAccess } from '../middleware/hotelAccess.js';
import { validateGuestRecordData, validateGuestRecordUpdate } from '../middleware/validation.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Create a new guest record (managers and admins only)
router.post('/', authorizeRole('manager', 'admin'), validateGuestRecordData, createGuestRecord);

// Get all guest records with filters (managers and admins only)
router.get('/', authorizeRole('manager', 'admin'), getAllGuestRecords);

// Get guest record by ID (managers and admins only)
router.get('/:id', authorizeRole('manager', 'admin'), getGuestRecordById);

// Update guest record (managers and admins only)
router.put('/:id', authorizeRole('manager', 'admin'), validateGuestRecordUpdate, updateGuestRecord);

// Delete guest record (managers and admins only)
router.delete('/:id', authorizeRole('manager', 'admin'), deleteGuestRecord);

// Search guest records (managers and admins only)
router.get('/search', authorizeRole('manager', 'admin'), searchGuestRecords);

// Get guest records by date range (managers and admins only)
router.get('/date-range', authorizeRole('manager', 'admin'), getGuestRecordsByDateRange);

// Get guest records by hotel (managers and admins only)
router.get('/hotel/:hotelId', authorizeRole('manager', 'admin'), checkManagerHotelAccess, getGuestRecordsByHotel);

// Get guest record statistics (managers and admins only)
router.get('/stats', authorizeRole('manager', 'admin'), getGuestRecordStats);

export default router; 