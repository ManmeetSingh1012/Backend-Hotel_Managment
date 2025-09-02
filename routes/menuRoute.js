import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { validateMenuData, validateMenuSearch } from '../middleware/validation.js';
import { createMenu , updateMenu , deleteMenu , getMenus , getMenuById, searchMenu } from '../controllers/menusController.js';
const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Create a new menu
router.post('/', validateMenuData, createMenu);

 // Get all menus
router.get('/', getMenus);

// Search menus
router.get('/search', validateMenuSearch, searchMenu);

// Get a specific menu by ID
router.get('/:id', getMenuById);

// Update an menu
router.put('/:id', validateMenuData, updateMenu);

// Delete an menu
router.delete('/:id', deleteMenu);

export default router;