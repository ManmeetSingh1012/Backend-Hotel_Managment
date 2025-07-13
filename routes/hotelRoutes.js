import express from 'express';
import { authenticateToken, authorizeRole } from '../middleware/auth.js';
import { validateHotelData } from '../middleware/validation.js';
import {
  createHotel,
  getAllHotels,
  getHotelById,
  updateHotel,
  deleteHotel,
  assignManager,
  removeManager
} from '../controllers/hotelController.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

// POST /api/hotels - Create hotel (admin only)
router.post('/', 
  authorizeRole('admin'),
  validateHotelData,
  createHotel
);

// GET /api/hotels - Get all hotels (admin sees all, manager sees assigned only)
router.get('/', getAllHotels);

// GET /api/hotels/:id - Get specific hotel with authorization
router.get('/:id', getHotelById);

// PUT /api/hotels/:id - Update hotel (admin only)
router.put('/:id',
  authorizeRole('admin'),
  validateHotelData,
  updateHotel
);

// DELETE /api/hotels/:id - Delete hotel (admin only)
router.delete('/:id',
  authorizeRole('admin'),
  deleteHotel
);

// POST /api/hotels/assign-manager - Assign manager to hotel (admin only)
router.post('/assign-manager',
  authorizeRole('admin'),
  assignManager
);

// DELETE /api/hotels/:hotelId/managers/:userId - Remove manager from hotel (admin only)
router.delete('/:hotelId/managers/:userId',
  authorizeRole('admin'),
  removeManager
);

export default router; 