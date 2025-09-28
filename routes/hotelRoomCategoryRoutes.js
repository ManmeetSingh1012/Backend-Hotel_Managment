import express from 'express';
import { authenticateToken, authorizeRole } from '../middleware/auth.js';
import { 
  validateHotelRoomCategoryData, 
  validateHotelRoomCategoryUpdate
} from '../middleware/validation.js';
import {
  createHotelRoomCategory,
  getHotelRoomCategories,
  getHotelRoomCategoryById,
  updateHotelRoomCategory,
  deleteHotelRoomCategory
} from '../controllers/hotelRoomCategoryController.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

// POST /api/hotel-room-categories - Create hotel room category (admin only)
router.post('/', 
  authorizeRole('admin'),
  validateHotelRoomCategoryData,
  createHotelRoomCategory
);

// GET /api/hotel-room-categories/hotel/:hotelId - Get all room categories for a hotel
router.get('/:hotelId', getHotelRoomCategories);

// GET /api/hotel-room-categories/:id - Get room category by ID
router.get('/:id', getHotelRoomCategoryById);

// PUT /api/hotel-room-categories/:id - Update room category (admin only)
router.put('/:id',
  authorizeRole('admin'),
  validateHotelRoomCategoryUpdate,
  updateHotelRoomCategory
);

// DELETE /api/hotel-room-categories/:id - Delete room category (admin only)
router.delete('/:id',
  authorizeRole('admin'),
  deleteHotelRoomCategory
);

export default router;
