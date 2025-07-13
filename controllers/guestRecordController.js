import { GuestRecord, Hotel, HotelManager } from '../models/index.js';
import { Op } from 'sequelize';

// Create a new guest record (manager only for assigned hotels)
export const createGuestRecord = async (req, res) => {
  try {
    const {
      hotelId,
      guestName,
      phoneNo,
      roomNo,
      checkIn,
      checkOut,
      paymentModes,
      advancePayment,
      rentBill,
      foodBill,
      date
    } = req.body;

    const userId = req.user.id;
    const userRole = req.user.role;

    // Check authorization
    if (userRole === 'manager') {
      const assignment = await HotelManager.findOne({
        where: {
          managerId: userId,
          hotelId: hotelId,
          status: 'active'
        }
      });

      if (!assignment) {
        return res.status(403).json({
          success: false,
          error: 'Access denied',
          message: 'You do not have access to this hotel'
        });
      }
    } else if (userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        message: 'Only managers and admins can create guest records'
      });
    }

    // Verify hotel exists
    const hotel = await Hotel.findByPk(hotelId);
    if (!hotel) {
      return res.status(404).json({
        success: false,
        error: 'Hotel not found',
        message: 'The specified hotel does not exist'
      });
    }

    // Create guest record
    const guestRecord = await GuestRecord.create({
      hotelId,
      guestName,
      phoneNo,
      roomNo,
      checkIn,
      checkOut,
      paymentModes,
      advancePayment: advancePayment || 0,
      rentBill,
      foodBill: foodBill || 0,
      date: date || new Date()
    });

    // Fetch the created record with hotel details
    const createdRecord = await GuestRecord.findByPk(guestRecord.id, {
      include: [{
        model: Hotel,
        as: 'hotel',
        attributes: ['id', 'name']
      }]
    });

    res.status(201).json({
      success: true,
      message: 'Guest record created successfully',
      data: createdRecord
    });

  } catch (error) {
    console.error('Create guest record error:', error);
    
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        message: error.errors.map(err => err.message).join(', ')
      });
    }

    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({
        success: false,
        error: 'Duplicate error',
        message: 'A guest record with this serial number already exists'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to create guest record'
    });
  }
};

// Get all guest records (filtered by hotel access)
export const getAllGuestRecords = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      hotelId,
      startDate,
      endDate,
      roomNo,
      guestName
    } = req.query;

    const userId = req.user.id;
    const userRole = req.user.role;

    // Build where clause
    let whereClause = {};
    let hotelIds = [];

    // Filter by hotel access
    if (userRole === 'manager') {
      const assignments = await HotelManager.findAll({
        where: {
          managerId: userId,
          status: 'active'
        },
        attributes: ['hotelId']
      });
      hotelIds = assignments.map(assignment => assignment.hotelId);
      
      if (hotelIds.length === 0) {
        return res.status(403).json({
          success: false,
          error: 'No access',
          message: 'You do not have access to any hotels'
        });
      }
      
      whereClause.hotelId = { [Op.in]: hotelIds };
    } else if (userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        message: 'You do not have permission to view guest records'
      });
    }

    // Apply filters
    if (hotelId) {
      if (userRole === 'manager' && !hotelIds.includes(parseInt(hotelId))) {
        return res.status(403).json({
          success: false,
          error: 'Access denied',
          message: 'You do not have access to this hotel'
        });
      }
      whereClause.hotelId = hotelId;
    }

    if (startDate && endDate) {
      whereClause.date = {
        [Op.between]: [startDate, endDate]
      };
    }

    if (roomNo) {
      whereClause.roomNo = { [Op.iLike]: `%${roomNo}%` };
    }

    if (guestName) {
      whereClause.guestName = { [Op.iLike]: `%${guestName}%` };
    }

    // Calculate pagination
    const offset = (page - 1) * limit;

    // Fetch records with pagination
    const { count, rows } = await GuestRecord.findAndCountAll({
      where: whereClause,
      include: [{
        model: Hotel,
        as: 'hotel',
        attributes: ['id', 'name']
      }],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: offset
    });

    const totalPages = Math.ceil(count / limit);

    res.json({
      success: true,
      message: 'Guest records retrieved successfully',
      data: {
        records: rows,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalRecords: count,
          recordsPerPage: parseInt(limit)
        }
      }
    });

  } catch (error) {
    console.error('Get all guest records error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to retrieve guest records'
    });
  }
};

// Get guest record by ID with authorization
export const getGuestRecordById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    const guestRecord = await GuestRecord.findByPk(id, {
      include: [{
        model: Hotel,
        as: 'hotel',
        attributes: ['id', 'name']
      }]
    });

    if (!guestRecord) {
      return res.status(404).json({
        success: false,
        error: 'Record not found',
        message: 'Guest record not found'
      });
    }

    // Check authorization
    if (userRole === 'manager') {
      const assignment = await HotelManager.findOne({
        where: {
          managerId: userId,
          hotelId: guestRecord.hotelId,
          status: 'active'
        }
      });

      if (!assignment) {
        return res.status(403).json({
          success: false,
          error: 'Access denied',
          message: 'You do not have access to this guest record'
        });
      }
    } else if (userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        message: 'You do not have permission to view this guest record'
      });
    }

    res.json({
      success: true,
      message: 'Guest record retrieved successfully',
      data: guestRecord
    });

  } catch (error) {
    console.error('Get guest record by ID error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to retrieve guest record'
    });
  }
};

// Update guest record (manager only)
export const updateGuestRecord = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Find the guest record
    const guestRecord = await GuestRecord.findByPk(id);
    if (!guestRecord) {
      return res.status(404).json({
        success: false,
        error: 'Record not found',
        message: 'Guest record not found'
      });
    }

    // Check authorization
    if (userRole === 'manager') {
      const assignment = await HotelManager.findOne({
        where: {
          managerId: userId,
          hotelId: guestRecord.hotelId,
          status: 'active'
        }
      });

      if (!assignment) {
        return res.status(403).json({
          success: false,
          error: 'Access denied',
          message: 'You do not have access to this guest record'
        });
      }
    } else if (userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        message: 'Only managers and admins can update guest records'
      });
    }

    // Prevent updating hotelId and serialNo
    delete updateData.hotelId;
    delete updateData.serialNo;

    // Update the record
    await guestRecord.update(updateData);

    // Fetch updated record with hotel details
    const updatedRecord = await GuestRecord.findByPk(id, {
      include: [{
        model: Hotel,
        as: 'hotel',
        attributes: ['id', 'name']
      }]
    });

    res.json({
      success: true,
      message: 'Guest record updated successfully',
      data: updatedRecord
    });

  } catch (error) {
    console.error('Update guest record error:', error);
    
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
      message: 'Failed to update guest record'
    });
  }
};

// Delete guest record (manager only)
export const deleteGuestRecord = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Find the guest record
    const guestRecord = await GuestRecord.findByPk(id);
    if (!guestRecord) {
      return res.status(404).json({
        success: false,
        error: 'Record not found',
        message: 'Guest record not found'
      });
    }

    // Check authorization
    if (userRole === 'manager') {
      const assignment = await HotelManager.findOne({
        where: {
          managerId: userId,
          hotelId: guestRecord.hotelId,
          status: 'active'
        }
      });

      if (!assignment) {
        return res.status(403).json({
          success: false,
          error: 'Access denied',
          message: 'You do not have access to this guest record'
        });
      }
    } else if (userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        message: 'Only managers and admins can delete guest records'
      });
    }

    // Delete the record
    await guestRecord.destroy();

    res.json({
      success: true,
      message: 'Guest record deleted successfully'
    });

  } catch (error) {
    console.error('Delete guest record error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to delete guest record'
    });
  }
};

// Search guest records
export const searchGuestRecords = async (req, res) => {
  try {
    const {
      query,
      hotelId,
      startDate,
      endDate,
      page = 1,
      limit = 10
    } = req.query;

    const userId = req.user.id;
    const userRole = req.user.role;

    // Build where clause
    let whereClause = {};
    let hotelIds = [];

    // Filter by hotel access
    if (userRole === 'manager') {
      const assignments = await HotelManager.findAll({
        where: {
          managerId: userId,
          status: 'active'
        },
        attributes: ['hotelId']
      });
      hotelIds = assignments.map(assignment => assignment.hotelId);
      
      if (hotelIds.length === 0) {
        return res.status(403).json({
          success: false,
          error: 'No access',
          message: 'You do not have access to any hotels'
        });
      }
      
      whereClause.hotelId = { [Op.in]: hotelIds };
    } else if (userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        message: 'You do not have permission to search guest records'
      });
    }

    // Apply filters
    if (hotelId) {
      if (userRole === 'manager' && !hotelIds.includes(parseInt(hotelId))) {
        return res.status(403).json({
          success: false,
          error: 'Access denied',
          message: 'You do not have access to this hotel'
        });
      }
      whereClause.hotelId = hotelId;
    }

    if (startDate && endDate) {
      whereClause.date = {
        [Op.between]: [startDate, endDate]
      };
    }

    // Search query
    if (query) {
      whereClause[Op.or] = [
        { guestName: { [Op.iLike]: `%${query}%` } },
        { phoneNo: { [Op.iLike]: `%${query}%` } },
        { roomNo: { [Op.iLike]: `%${query}%` } },
        { serialNo: { [Op.iLike]: `%${query}%` } }
      ];
    }

    // Calculate pagination
    const offset = (page - 1) * limit;

    // Search records
    const { count, rows } = await GuestRecord.findAndCountAll({
      where: whereClause,
      include: [{
        model: Hotel,
        as: 'hotel',
        attributes: ['id', 'name']
      }],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: offset
    });

    const totalPages = Math.ceil(count / limit);

    res.json({
      success: true,
      message: 'Search completed successfully',
      data: {
        records: rows,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalRecords: count,
          recordsPerPage: parseInt(limit)
        }
      }
    });

  } catch (error) {
    console.error('Search guest records error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to search guest records'
    });
  }
};

// Get guest records by date range
export const getGuestRecordsByDateRange = async (req, res) => {
  try {
    const { startDate, endDate, hotelId } = req.query;
    const userId = req.user.id;
    const userRole = req.user.role;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: 'Missing parameters',
        message: 'Start date and end date are required'
      });
    }

    // Build where clause
    let whereClause = {
      date: {
        [Op.between]: [startDate, endDate]
      }
    };
    let hotelIds = [];

    // Filter by hotel access
    if (userRole === 'manager') {
      const assignments = await HotelManager.findAll({
        where: {
          managerId: userId,
          status: 'active'
        },
        attributes: ['hotelId']
      });
      hotelIds = assignments.map(assignment => assignment.hotelId);
      
      if (hotelIds.length === 0) {
        return res.status(403).json({
          success: false,
          error: 'No access',
          message: 'You do not have access to any hotels'
        });
      }
      
      whereClause.hotelId = { [Op.in]: hotelIds };
    } else if (userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        message: 'You do not have permission to view guest records'
      });
    }

    // Apply hotel filter
    if (hotelId) {
      if (userRole === 'manager' && !hotelIds.includes(parseInt(hotelId))) {
        return res.status(403).json({
          success: false,
          error: 'Access denied',
          message: 'You do not have access to this hotel'
        });
      }
      whereClause.hotelId = hotelId;
    }

    // Fetch records
    const records = await GuestRecord.findAll({
      where: whereClause,
      include: [{
        model: Hotel,
        as: 'hotel',
        attributes: ['id', 'name']
      }],
      order: [['date', 'ASC']]
    });

    // Calculate summary statistics
    const summary = {
      totalRecords: records.length,
      totalAmount: records.reduce((sum, record) => sum + parseFloat(record.totalAmount), 0),
      totalPending: records.reduce((sum, record) => sum + parseFloat(record.pending), 0),
      totalAdvancePayment: records.reduce((sum, record) => sum + parseFloat(record.advancePayment), 0)
    };

    res.json({
      success: true,
      message: 'Guest records retrieved successfully',
      data: {
        records,
        summary,
        dateRange: { startDate, endDate }
      }
    });

  } catch (error) {
    console.error('Get guest records by date range error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to retrieve guest records'
    });
  }
};

// Get guest records by hotel
export const getGuestRecordsByHotel = async (req, res) => {
  try {
    const { hotelId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Check authorization
    if (userRole === 'manager') {
      const assignment = await HotelManager.findOne({
        where: {
          managerId: userId,
          hotelId: hotelId,
          status: 'active'
        }
      });

      if (!assignment) {
        return res.status(403).json({
          success: false,
          error: 'Access denied',
          message: 'You do not have access to this hotel'
        });
      }
    } else if (userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        message: 'You do not have permission to view guest records'
      });
    }

    // Verify hotel exists
    const hotel = await Hotel.findByPk(hotelId);
    if (!hotel) {
      return res.status(404).json({
        success: false,
        error: 'Hotel not found',
        message: 'The specified hotel does not exist'
      });
    }

    // Calculate pagination
    const offset = (page - 1) * limit;

    // Fetch records
    const { count, rows } = await GuestRecord.findAndCountAll({
      where: { hotelId },
      include: [{
        model: Hotel,
        as: 'hotel',
        attributes: ['id', 'name']
      }],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: offset
    });

    const totalPages = Math.ceil(count / limit);

    res.json({
      success: true,
      message: 'Guest records retrieved successfully',
      data: {
        records: rows,
        hotel: {
          id: hotel.id,
          name: hotel.name
        },
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalRecords: count,
          recordsPerPage: parseInt(limit)
        }
      }
    });

  } catch (error) {
    console.error('Get guest records by hotel error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to retrieve guest records'
    });
  }
}; 