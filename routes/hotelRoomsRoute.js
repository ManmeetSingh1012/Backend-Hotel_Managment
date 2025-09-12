import express from 'express';
import { authenticateToken, authorizeRole } from '../middleware/auth.js';
import { 
  validateHotelRoomData, 
  validateHotelRoomUpdate
} from '../middleware/validation.js';
import {
  createHotelRoom,
  getHotelRooms,
  getHotelRoomById,
  updateHotelRoom,
  deleteHotelRoom
} from '../controllers/hotelRoomController.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

// POST /api/hotel-rooms - Create hotel room (admin only)
router.post('/', 
  authorizeRole('admin'),
  validateHotelRoomData,
  createHotelRoom
);

// GET /api/hotel-rooms/hotel/:hotelId - Get all rooms for a hotel
router.get('/hotel/:hotelId', getHotelRooms);

// GET /api/hotel-rooms/:id - Get room by ID
router.get('/:id', getHotelRoomById);

// PUT /api/hotel-rooms/:id - Update room (admin only)
router.put('/:id',
  authorizeRole('admin'),
  validateHotelRoomUpdate,
  updateHotelRoom
);

// DELETE /api/hotel-rooms/:id - Delete room (admin only)
router.delete('/:id',
  authorizeRole('admin'),
  deleteHotelRoom
);

export default router;