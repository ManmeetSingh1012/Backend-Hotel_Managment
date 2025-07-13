import { HotelManager, User, Hotel } from '../models/index.js';
import { Op } from 'sequelize';

// Helper function to check if manager has access to specific hotel
export const checkManagerHotelAccess = async (managerId, hotelId) => {
  const assignment = await HotelManager.findOne({
    where: {
      managerId,
      hotelId,
      status: 'active'
    }
  });
  return !!assignment;
};

// Helper function to get all active hotel assignments for a manager
export const getManagerActiveAssignments = async (managerId) => {
  return await HotelManager.findAll({
    where: {
      managerId,
      status: 'active'
    },
    include: [
      {
        model: Hotel,
        as: 'hotel',
        attributes: ['id', 'name', 'address', 'phone', 'email']
      }
    ]
  });
};

// Assign manager to hotel (admin only)
export const assignManager = async (req, res) => {
  try {
    const { hotelId, managerId } = req.body;

    // Validate required fields
    if (!hotelId || !managerId) {
      return res.status(400).json({
        success: false,
        message: 'Hotel ID and Manager ID are required'
      });
    }

    // Check if manager exists and has 'manager' role
    const manager = await User.findOne({
      where: {
        id: managerId,
        role: 'manager'
      }
    });

    if (!manager) {
      return res.status(404).json({
        success: false,
        message: 'Manager not found or user is not a manager'
      });
    }

    // Check if hotel exists
    const hotel = await Hotel.findByPk(hotelId);
    if (!hotel) {
      return res.status(404).json({
        success: false,
        message: 'Hotel not found'
      });
    }

    // Check if assignment already exists
    const existingAssignment = await HotelManager.findOne({
      where: {
        hotelId,
        managerId
      }
    });

    if (existingAssignment) {
      if (existingAssignment.status === 'active') {
        return res.status(400).json({
          success: false,
          message: 'Manager is already assigned to this hotel'
        });
      } else {
        // Reactivate existing assignment
        existingAssignment.status = 'active';
        existingAssignment.assignedDate = new Date();
        await existingAssignment.save();

        return res.status(200).json({
          success: true,
          message: 'Manager assignment reactivated',
          data: existingAssignment
        });
      }
    }

    // Create new assignment
    const assignment = await HotelManager.create({
      hotelId,
      managerId,
      assignedDate: new Date(),
      status: 'active'
    });

    const assignmentWithDetails = await HotelManager.findByPk(assignment.id, {
      include: [
        {
          model: Hotel,
          as: 'hotel',
          attributes: ['id', 'name', 'address']
        },
        {
          model: User,
          as: 'manager',
          attributes: ['id', 'name', 'email']
        }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Manager assigned to hotel successfully',
      data: assignmentWithDetails
    });

  } catch (error) {
    console.error('Error assigning manager:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Unassign manager from hotel (admin only)
export const unassignManager = async (req, res) => {
  try {
    const { hotelId, managerId } = req.body;

    // Validate required fields
    if (!hotelId || !managerId) {
      return res.status(400).json({
        success: false,
        message: 'Hotel ID and Manager ID are required'
      });
    }

    // Find the assignment
    const assignment = await HotelManager.findOne({
      where: {
        hotelId,
        managerId,
        status: 'active'
      }
    });

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Active assignment not found'
      });
    }

    // Deactivate the assignment
    assignment.status = 'inactive';
    await assignment.save();

    res.status(200).json({
      success: true,
      message: 'Manager unassigned from hotel successfully',
      data: assignment
    });

  } catch (error) {
    console.error('Error unassigning manager:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get hotel managers (admin sees all, manager sees own assignments)
export const getHotelManagers = async (req, res) => {
  try {
    const { status, hotelId } = req.query;
    const userRole = req.user.role;
    const userId = req.user.id;

    let whereClause = {};
    let includeClause = [
      {
        model: Hotel,
        as: 'hotel',
        attributes: ['id', 'name', 'address', 'phone', 'email']
      },
      {
        model: User,
        as: 'manager',
        attributes: ['id', 'name', 'email', 'role']
      }
    ];

    // Filter by status if provided
    if (status && ['active', 'inactive'].includes(status)) {
      whereClause.status = status;
    }

    // Filter by hotel if provided
    if (hotelId) {
      whereClause.hotelId = hotelId;
    }

    // If user is manager, only show their assignments
    if (userRole === 'manager') {
      whereClause.managerId = userId;
    }

    const assignments = await HotelManager.findAll({
      where: whereClause,
      include: includeClause,
      order: [['createdAt', 'DESC']]
    });

    res.status(200).json({
      success: true,
      message: 'Hotel managers retrieved successfully',
      data: assignments
    });

  } catch (error) {
    console.error('Error getting hotel managers:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get manager's hotel assignments
export const getManagerHotels = async (req, res) => {
  try {
    const { managerId } = req.params;
    const { status } = req.query;
    const userRole = req.user.role;
    const userId = req.user.id;

    // Check if user has permission to view this manager's assignments
    if (userRole === 'manager' && parseInt(managerId) !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only view your own assignments.'
      });
    }

    let whereClause = {
      managerId: managerId
    };

    // Filter by status if provided
    if (status && ['active', 'inactive'].includes(status)) {
      whereClause.status = status;
    }

    const assignments = await HotelManager.findAll({
      where: whereClause,
      include: [
        {
          model: Hotel,
          as: 'hotel',
          attributes: ['id', 'name', 'address', 'phone', 'email', 'totalRooms']
        }
      ],
      order: [['assignedDate', 'DESC']]
    });

    res.status(200).json({
      success: true,
      message: 'Manager hotel assignments retrieved successfully',
      data: assignments
    });

  } catch (error) {
    console.error('Error getting manager hotels:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Update assignment status
export const updateAssignmentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Validate status
    if (!status || !['active', 'inactive'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Valid status (active/inactive) is required'
      });
    }

    // Find the assignment
    const assignment = await HotelManager.findByPk(id, {
      include: [
        {
          model: Hotel,
          as: 'hotel',
          attributes: ['id', 'name']
        },
        {
          model: User,
          as: 'manager',
          attributes: ['id', 'name', 'email']
        }
      ]
    });

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found'
      });
    }

    // Update status
    assignment.status = status;
    if (status === 'active') {
      assignment.assignedDate = new Date();
    }
    await assignment.save();

    res.status(200).json({
      success: true,
      message: 'Assignment status updated successfully',
      data: assignment
    });

  } catch (error) {
    console.error('Error updating assignment status:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
}; 