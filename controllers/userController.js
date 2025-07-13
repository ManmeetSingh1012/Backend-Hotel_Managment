import { User, Hotel, HotelManager } from '../models/index.js';
import { Op } from 'sequelize';

// Get all users (admin only)
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ['id', 'name', 'username', 'email', 'role', 'createdAt', 'lastLogin'],
      order: [['createdAt', 'DESC']]
    });

    res.status(200).json({
      success: true,
      message: 'Users retrieved successfully',
      data: users,
      count: users.length
    });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to retrieve users'
    });
  }
};

// Get all managers (admin only)
export const getAllManagers = async (req, res) => {
  try {
    const managers = await User.findAll({
      where: { role: 'manager' },
      attributes: ['id', 'name', 'username', 'email', 'createdAt', 'lastLogin'],
      include: [
        {
          model: Hotel,
          as: 'managedHotels',
          attributes: ['id', 'name', 'address'],
          through: { attributes: [] }
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.status(200).json({
      success: true,
      message: 'Managers retrieved successfully',
      data: managers,
      count: managers.length
    });
  } catch (error) {
    console.error('Get all managers error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to retrieve managers'
    });
  }
};

// Get managers created by specific admin
export const getManagersByAdmin = async (req, res) => {
  try {
    const { adminId } = req.params;

    // Verify the requesting user is an admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        message: 'Only admins can view manager lists'
      });
    }

    // Get managers with their assigned hotels
    const managers = await User.findAll({
      where: { 
        role: 'manager',
        // You can add additional filtering here if needed
        // For example, if you want to track which admin created which manager
      },
      attributes: ['id', 'name', 'username', 'email', 'createdAt', 'lastLogin'],
      include: [
        {
          model: Hotel,
          as: 'managedHotels',
          attributes: ['id', 'name', 'address', 'phone', 'email'],
          through: { attributes: ['assignedAt'] }
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.status(200).json({
      success: true,
      message: 'Managers retrieved successfully',
      data: managers,
      count: managers.length
    });
  } catch (error) {
    console.error('Get managers by admin error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to retrieve managers'
    });
  }
};

// Get user by ID (admin only)
export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id, {
      attributes: ['id', 'name', 'username', 'email', 'role', 'createdAt', 'lastLogin'],
      include: [
        {
          model: Hotel,
          as: 'managedHotels',
          attributes: ['id', 'name', 'address'],
          through: { attributes: [] }
        },
        {
          model: Hotel,
          as: 'createdHotels',
          attributes: ['id', 'name', 'address']
        }
      ]
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'User retrieved successfully',
      data: user
    });
  } catch (error) {
    console.error('Get user by ID error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to retrieve user'
    });
  }
};

// Create new user (admin only)
export const createUser = async (req, res) => {
  try {
    const { name, username, email, password, role } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({
      where: {
        [Op.or]: [{ email }, { username }]
      }
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'User already exists',
        message: 'A user with this email or username already exists'
      });
    }

    // Create new user
    const user = await User.create({
      name,
      username,
      email,
      password,
      role: role || 'manager'
    });

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: {
        id: user.id,
        name: user.name,
        username: user.username,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Create user error:', error);
    
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        message: error.errors.map(err => err.message).join(', ')
      });
    }

    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to create user'
    });
  }
};

// Update user (admin only)
export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, role } = req.body;

    const user = await User.findByPk(id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
        message: 'User not found'
      });
    }

    // Check if email is being changed and if it's already taken
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          error: 'Email already exists',
          message: 'This email is already registered'
        });
      }
    }

    // Update user
    await user.update({
      name: name || user.name,
      email: email || user.email,
      role: role || user.role
    });

    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: {
        id: user.id,
        name: user.name,
        username: user.username,
        email: user.email,
        role: user.role,
        updatedAt: user.updatedAt
      }
    });
  } catch (error) {
    console.error('Update user error:', error);
    
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        message: error.errors.map(err => err.message).join(', ')
      });
    }

    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to update user'
    });
  }
};

// Delete user (admin only)
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
        message: 'User not found'
      });
    }

    // Prevent admin from deleting themselves
    if (user.id === req.user.id) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete self',
        message: 'You cannot delete your own account'
      });
    }

    // Delete user (this will also delete related HotelManager records due to CASCADE)
    await user.destroy();

    res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to delete user'
    });
  }
};

// Get managers with their hotel assignments
export const getManagersWithAssignments = async (req, res) => {
  try {
    const managers = await User.findAll({
      where: { role: 'manager' },
      attributes: ['id', 'name', 'username', 'email', 'createdAt', 'lastLogin'],
      include: [
        {
          model: Hotel,
          as: 'managedHotels',
          attributes: ['id', 'name', 'address', 'phone', 'email', 'totalRooms'],
          through: { 
            attributes: ['assignedAt'],
            as: 'assignment'
          }
        }
      ],
      order: [
        ['createdAt', 'DESC'],
        [{ model: Hotel, as: 'managedHotels' }, 'name', 'ASC']
      ]
    });

    res.status(200).json({
      success: true,
      message: 'Managers with assignments retrieved successfully',
      data: managers,
      count: managers.length
    });
  } catch (error) {
    console.error('Get managers with assignments error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to retrieve managers with assignments'
    });
  }
}; 