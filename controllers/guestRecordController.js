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
      checkinTime,
      checkoutTime,
      paymentMode,
      advancePayment,
      rent,
      food,
      bill
    } = req.body;

    console.log("guestRecord6", req.body);

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

    // Prepare data for creation
    const guestData = {
      hotelId,
      guestName,
      phoneNo,
      roomNo,
      checkinTime,
      paymentMode,
      advancePayment: advancePayment || null,
      rent,
      food: food || null,
      bill
    };

    // If checkoutTime is provided, set checkoutTime and populate checkoutDate with today's date
    if (checkoutTime) {
      guestData.checkoutTime = checkoutTime;
      // Populate checkoutDate with today's date in YYYY-MM-DD format
      const today = new Date();
      const yyyy = today.getFullYear();
      const mm = String(today.getMonth() + 1).padStart(2, '0');
      const dd = String(today.getDate()).padStart(2, '0');
      guestData.checkoutDate = `${yyyy}-${mm}-${dd}`;
    }

    // Create guest record
    const guestRecord = await GuestRecord.create(guestData);

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

    // Handle custom validation errors from model hooks
    if (error.message && error.message.includes('Check-out date/time must be after check-in date/time')) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        message: error.message
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
      if (userRole === 'manager' && !hotelIds.includes(hotelId)) {
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

// Get guest records by hotelId with authorization
export const getGuestRecordById = async (req, res) => {
  try {
    const { id: hotelId } = req.params; // 'id' is now hotelId
    const { filter } = req.query;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Build base query options
    let queryOptions = {
      where: { hotelId },
      include: [{
        model: Hotel,
        as: 'hotel',
        attributes: ['id', 'name']
      }]
    };

    // If filter is not present, return entries only if 'date' is today
    if (!filter) {
      // Get today's date in YYYY-MM-DD format
      const today = new Date();
      const yyyy = today.getFullYear();
      const mm = String(today.getMonth() + 1).padStart(2, '0');
      const dd = String(today.getDate()).padStart(2, '0');
      const todayStr = `${yyyy}-${mm}-${dd}`;

      // Add where clause to match today's 'date' field (assuming 'date' is stored as a Date or string in YYYY-MM-DD)
      queryOptions.where = {
        ...queryOptions.where,
        date: todayStr
      };
    } else if (filter === 'continuity') {
      // If filter is 'continuity', return entries only if checkoutTime is null (i.e., guest is still checked in)
      queryOptions.where = {
        ...queryOptions.where,
        checkoutTime: null
      };
    }
    // else: no additional filter, just by hotelId

    // Find the guest records for the hotel
    const guestRecords = await GuestRecord.findAll(queryOptions);

    // Check authorization for each record's hotelId (should be the same for all)
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
          message: 'You do not have access to these guest records'
        });
      }
    } else if (userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        message: 'You do not have permission to view these guest records'
      });
    }

    // If no records found, return 200 with empty array
    if (!guestRecords || guestRecords.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No guest records found for this hotel',
        data: []
      });
    }

    res.json({
      success: true,
      message: 'Guest records retrieved successfully',
      data: guestRecords
    });

  } catch (error) {
    console.error('Get guest records by hotelId error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to retrieve guest records'
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
    console.log("guestRecord5", updateData);

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

    // If checkoutTime is present in update, set checkoutDate to today's date
    if (updateData.hasOwnProperty('checkoutTime') && updateData.checkoutTime) {
      const today = new Date();
      const yyyy = today.getFullYear();
      const mm = String(today.getMonth() + 1).padStart(2, '0');
      const dd = String(today.getDate()).padStart(2, '0');
      updateData.checkoutDate = `${yyyy}-${mm}-${dd}`;
    }

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

    // Handle custom validation errors from model hooks
    if (error.message && error.message.includes('Check-out date/time must be after check-in date/time')) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        message: error.message
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
      if (userRole === 'manager' && !hotelIds.includes(hotelId)) {
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
      if (userRole === 'manager' && !hotelIds.includes(hotelId)) {
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
      totalBill: records.reduce((sum, record) => sum + parseFloat(record.bill || 0), 0),
      totalPending: records.reduce((sum, record) => sum + parseFloat(record.pending || 0), 0),
      totalAdvancePayment: records.reduce((sum, record) => sum + parseFloat(record.advancePayment || 0), 0),
      totalRent: records.reduce((sum, record) => sum + parseFloat(record.rent || 0), 0),
      totalFood: records.reduce((sum, record) => sum + parseFloat(record.food || 0), 0)
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

// Get guest record statistics (managers and admins only)
export const getGuestRecordStats = async (req, res) => {
  try {
    const { hotelId, startDate, endDate } = req.query;
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
        message: 'You do not have permission to view guest record statistics'
      });
    }

    // Apply filters
    if (hotelId) {
      if (userRole === 'manager' && !hotelIds.includes(hotelId)) {
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

    // Get all records for statistics
    const records = await GuestRecord.findAll({
      where: whereClause,
      include: [{
        model: Hotel,
        as: 'hotel',
        attributes: ['id', 'name']
      }]
    });

    // Calculate comprehensive statistics
    const stats = {
      totalRecords: records.length,
      totalBill: records.reduce((sum, record) => sum + parseFloat(record.bill || 0), 0),
      totalPending: records.reduce((sum, record) => sum + parseFloat(record.pending || 0), 0),
      totalAdvancePayment: records.reduce((sum, record) => sum + parseFloat(record.advancePayment || 0), 0),
      totalRent: records.reduce((sum, record) => sum + parseFloat(record.rent || 0), 0),
      totalFood: records.reduce((sum, record) => sum + parseFloat(record.food || 0), 0),
      averageBill: records.length > 0 ? records.reduce((sum, record) => sum + parseFloat(record.bill || 0), 0) / records.length : 0,
      averagePending: records.length > 0 ? records.reduce((sum, record) => sum + parseFloat(record.pending || 0), 0) / records.length : 0,
      paymentModeBreakdown: records.reduce((acc, record) => {
        if (record.paymentMode && Array.isArray(record.paymentMode)) {
          record.paymentMode.forEach(mode => {
            acc[mode] = (acc[mode] || 0) + 1;
          });
        }
        return acc;
      }, {}),
      recordsWithPendingPayment: records.filter(record => parseFloat(record.pending || 0) > 0).length,
      recordsFullyPaid: records.filter(record => parseFloat(record.pending || 0) === 0).length
    };

    res.json({
      success: true,
      message: 'Guest record statistics retrieved successfully',
      data: stats
    });

  } catch (error) {
    console.error('Get guest record stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to retrieve guest record statistics'
    });
  }
}; 