import express from 'express';
import {
  assignManager,
  unassignManager,
  getHotelManagers,
  getManagerHotels,
  updateAssignmentStatus
} from '../controllers/hotelManagerController.js';
import { authenticateToken, authorizeRole } from '../middleware/auth.js';
import { validateHotelManagerAssignment, validateAssignmentStatus } from '../middleware/validation.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

// POST /api/hotel-managers/assign - Assign manager to hotel (admin only)
router.post('/assign', authorizeRole('admin'), validateHotelManagerAssignment, assignManager);

// DELETE /api/hotel-managers/unassign - Remove manager from hotel (admin only)
router.delete('/unassign', authorizeRole('admin'), validateHotelManagerAssignment, unassignManager);

// GET /api/hotel-managers - Get all assignments (admin sees all, manager sees own)
router.get('/', getHotelManagers);

// GET /api/hotel-managers/manager/:managerId - Get manager's hotel assignments
router.get('/manager/:managerId', getManagerHotels);

// PUT /api/hotel-managers/:id/status - Update assignment status
router.put('/:id/status', authorizeRole('admin'), validateAssignmentStatus, updateAssignmentStatus);

export default router; 