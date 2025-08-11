import { Hotel, User, HotelManager, sequelize } from '../models/index.js';
import { Op } from 'sequelize';

// Create hotel (admin only)
export const createHotel = async (req, res) => {
  try {
    const { name, address, phone,  totalRooms } = req.body;

    // Create hotel with the current user as creator
    const hotel = await Hotel.create({
      name,
      address,
      phone,
      
      totalRooms,
      createdBy: req.user.id
    });

    // Fetch the created hotel with creator details
    const createdHotel = await Hotel.findByPk(hotel.id, {
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'name', 'email']
        }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Hotel created successfully',
      data: createdHotel
    });
  } catch (error) {
    console.error('Create hotel error:', error);
    
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
      message: 'Failed to create hotel'
    });
  }
};

// Get all hotels (admin sees only hotels they created, manager sees assigned only)
export const getAllHotels = async (req, res) => {
  try {
    let hotels;

    if (req.user.role === 'admin') {
      // Admin can only see hotels they created
      hotels = await Hotel.findAll({
        where: { createdBy: req.user.id },
        include: [
          {
            model: User,
            as: 'creator',
            attributes: ['id', 'name', 'email']
          },
          {
            model: User,
            as: 'managers',
            attributes: ['id', 'name', 'email'],
            through: { attributes: [] }
          }
        ],
        order: [['createdAt', 'DESC']]
      });
    } else {
      // Manager can only see hotels they are assigned to
      hotels = await Hotel.findAll({
        include: [
          {
            model: User,
            as: 'creator',
            attributes: ['id', 'name', 'email']
          },
          {
            model: User,
            as: 'managers',
            attributes: ['id', 'name', 'email'],
            through: { attributes: [] },
            where: { id: req.user.id }
          }
        ],
        order: [['createdAt', 'DESC']]
      });
    }

    res.status(200).json({
      success: true,
      message: 'Hotels retrieved successfully',
      data: hotels,
      count: hotels.length
    });
  } catch (error) {
    console.error('Get all hotels error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to retrieve hotels'
    });
  }
};


// Update hotel (admin only)
export const updateHotel = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, address, phone, email, totalRooms } = req.body;

    // Find hotel
    const hotel = await Hotel.findByPk(id);
    
    if (!hotel) {
      return res.status(404).json({
        success: false,
        error: 'Hotel not found',
        message: 'Hotel not found'
      });
    }

    // Update hotel
    await hotel.update({
      name,
      address,
      phone,
      email,
      totalRooms
    });

    // Fetch updated hotel with associations
    const updatedHotel = await Hotel.findByPk(id, {
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'name', 'email']
        },
        {
          model: User,
          as: 'managers',
          attributes: ['id', 'name', 'email'],
          through: { attributes: [] }
        }
      ]
    });

    res.status(200).json({
      success: true,
      message: 'Hotel updated successfully',
      data: updatedHotel
    });
  } catch (error) {
    console.error('Update hotel error:', error);
    
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
      message: 'Failed to update hotel'
    });
  }
};

// Delete hotel (admin only)
export const deleteHotel = async (req, res) => {
  try {
    const { id } = req.params;

    // Find hotel
    const hotel = await Hotel.findByPk(id);
    
    if (!hotel) {
      return res.status(404).json({
        success: false,
        error: 'Hotel not found',
        message: 'Hotel not found'
      });
    }

    // Delete hotel (this will also delete related HotelManager records due to CASCADE)
    await hotel.destroy();

    res.status(200).json({
      success: true,
      message: 'Hotel deleted successfully'
    });
  } catch (error) {
    console.error('Delete hotel error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to delete hotel'
    });
  }
};

// Assign manager to hotel (admin only)
export const assignManager = async (req, res) => {
  try {
    const { hotelId, userId } = req.body;

    // Check if hotel exists
    const hotel = await Hotel.findByPk(hotelId);
    if (!hotel) {
      return res.status(404).json({
        success: false,
        error: 'Hotel not found',
        message: 'Hotel not found'
      });
    }

    // Check if user exists and is a manager
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
        message: 'User not found'
      });
    }

    if (user.role !== 'manager') {
      return res.status(400).json({
        success: false,
        error: 'Invalid user role',
        message: 'User must be a manager to be assigned to a hotel'
      });
    }

    // Check if assignment already exists
    const existingAssignment = await HotelManager.findOne({
      where: { hotelId, userId }
    });

    if (existingAssignment) {
      return res.status(400).json({
        success: false,
        error: 'Assignment exists',
        message: 'Manager is already assigned to this hotel'
      });
    }

    // Create assignment
    await HotelManager.create({
      hotelId,
      userId
    });

    res.status(201).json({
      success: true,
      message: 'Manager assigned to hotel successfully'
    });
  } catch (error) {
    console.error('Assign manager error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to assign manager to hotel'
    });
  }
};

// Remove manager from hotel (admin only)
export const removeManager = async (req, res) => {
  try {
    const { hotelId, userId } = req.params;

    // Check if assignment exists
    const assignment = await HotelManager.findOne({
      where: { hotelId, userId }
    });

    if (!assignment) {
      return res.status(404).json({
        success: false,
        error: 'Assignment not found',
        message: 'Manager is not assigned to this hotel'
      });
    }

    // Remove assignment
    await assignment.destroy();

    res.status(200).json({
      success: true,
      message: 'Manager removed from hotel successfully'
    });
  } catch (error) {
    console.error('Remove manager error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to remove manager from hotel'
    });
  }
}; 