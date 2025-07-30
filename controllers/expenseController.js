import { Expense, Hotel, HotelManager, sequelize } from '../models/index.js';
import { Op } from 'sequelize';

// Create a new expense (manager only for assigned hotels, admin for all)
export const createExpense = async (req, res) => {
  try {
    const {
      hotelId,
      expenseType,
      amount,
      paymentMode,
      description
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
        message: 'Only managers and admins can create expenses'
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

    // Create expense
    const expense = await Expense.create({
      hotelId,
      expenseType,
      amount,
      paymentMode,
      description
    });

    // Fetch the created expense with hotel details
    const createdExpense = await Expense.findByPk(expense.id, {
      include: [{
        model: Hotel,
        as: 'hotel',
        attributes: ['id', 'name']
      }]
    });

    res.status(201).json({
      success: true,
      message: 'Expense created successfully',
      data: createdExpense
    });

  } catch (error) {
    console.error('Create expense error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to create expense'
    });
  }
};

// Get all expenses with pagination and current month filter
export const getAllExpenses = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      hotelId,
      expenseType,
      paymentMode,
      startDate,
      endDate,
      sortBy = 'createdAt',
      sortOrder = 'DESC'
    } = req.query;

    const userId = req.user.id;
    const userRole = req.user.role;

    // Build where clause
    const whereClause = {};

    // Filter by hotel access
    if (userRole === 'manager') {
      const assignments = await HotelManager.findAll({
        where: {
          managerId: userId,
          status: 'active'
        },
        attributes: ['hotelId']
      });

      const accessibleHotelIds = assignments.map(assignment => assignment.hotelId);
      
      if (hotelId) {
        if (!accessibleHotelIds.includes(hotelId)) {
          return res.status(403).json({
            success: false,
            error: 'Access denied',
            message: 'You do not have access to this hotel'
          });
        }
        whereClause.hotelId = hotelId;
      } else {
        whereClause.hotelId = { [Op.in]: accessibleHotelIds };
      }
    } else if (userRole === 'admin') {
      if (hotelId) {
        whereClause.hotelId = hotelId;
      }
    } else {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        message: 'Only managers and admins can view expenses'
      });
    }

    // Filter by expense type
    if (expenseType) {
      whereClause.expenseType = expenseType;
    }

    // Filter by payment mode
    if (paymentMode) {
      whereClause.paymentMode = paymentMode;
    }

    // Filter by date range (default to current month if no dates provided)
    if (startDate && endDate) {
      whereClause.createdAt = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    } else {
      // Default to current month
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      
      whereClause.createdAt = {
        [Op.between]: [startOfMonth, endOfMonth]
      };
    }

    // Pagination
    const offset = (page - 1) * limit;
    const limitNum = parseInt(limit);

    // Validate sort parameters
    const allowedSortFields = ['createdAt', 'amount', 'expenseType', 'paymentMode'];
    const allowedSortOrders = ['ASC', 'DESC'];
    
    const finalSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';
    const finalSortOrder = allowedSortOrders.includes(sortOrder.toUpperCase()) ? sortOrder.toUpperCase() : 'DESC';

    // Get expenses with pagination
    const { count, rows: expenses } = await Expense.findAndCountAll({
      where: whereClause,
      include: [{
        model: Hotel,
        as: 'hotel',
        attributes: ['id', 'name']
      }],
      order: [[finalSortBy, finalSortOrder]],
      limit: limitNum,
      offset: offset
    });

    // Calculate pagination info
    const totalPages = Math.ceil(count / limitNum);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    res.status(200).json({
      success: true,
      message: 'Expenses retrieved successfully',
      data: {
        expenses,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalItems: count,
          itemsPerPage: limitNum,
          hasNextPage,
          hasPrevPage
        }
      }
    });

  } catch (error) {
    console.error('Get all expenses error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to retrieve expenses'
    });
  }
};

// Get expense by ID
export const getExpenseById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Get expense with hotel details
    const expense = await Expense.findByPk(id, {
      include: [{
        model: Hotel,
        as: 'hotel',
        attributes: ['id', 'name']
      }]
    });

    if (!expense) {
      return res.status(404).json({
        success: false,
        error: 'Expense not found',
        message: 'The specified expense does not exist'
      });
    }

    // Check authorization
    if (userRole === 'manager') {
      const assignment = await HotelManager.findOne({
        where: {
          managerId: userId,
          hotelId: expense.hotelId,
          status: 'active'
        }
      });

      if (!assignment) {
        return res.status(403).json({
          success: false,
          error: 'Access denied',
          message: 'You do not have access to this expense'
        });
      }
    } else if (userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        message: 'Only managers and admins can view expenses'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Expense retrieved successfully',
      data: expense
    });

  } catch (error) {
    console.error('Get expense by ID error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to retrieve expense'
    });
  }
};

// Update expense
export const updateExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      expenseType,
      amount,
      paymentMode,
      description
    } = req.body;

    const userId = req.user.id;
    const userRole = req.user.role;

    // Get expense
    const expense = await Expense.findByPk(id);
    if (!expense) {
      return res.status(404).json({
        success: false,
        error: 'Expense not found',
        message: 'The specified expense does not exist'
      });
    }

    // Check authorization
    if (userRole === 'manager') {
      const assignment = await HotelManager.findOne({
        where: {
          managerId: userId,
          hotelId: expense.hotelId,
          status: 'active'
        }
      });

      if (!assignment) {
        return res.status(403).json({
          success: false,
          error: 'Access denied',
          message: 'You do not have access to this expense'
        });
      }
    } else if (userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        message: 'Only managers and admins can update expenses'
      });
    }

    // Update expense
    await expense.update({
      expenseType,
      amount,
      paymentMode,
      description
    });

    // Fetch updated expense with hotel details
    const updatedExpense = await Expense.findByPk(id, {
      include: [{
        model: Hotel,
        as: 'hotel',
        attributes: ['id', 'name']
      }]
    });

    res.status(200).json({
      success: true,
      message: 'Expense updated successfully',
      data: updatedExpense
    });

  } catch (error) {
    console.error('Update expense error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to update expense'
    });
  }
};

// Delete expense
export const deleteExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Get expense
    const expense = await Expense.findByPk(id);
    if (!expense) {
      return res.status(404).json({
        success: false,
        error: 'Expense not found',
        message: 'The specified expense does not exist'
      });
    }

    // Check authorization
    if (userRole === 'manager') {
      const assignment = await HotelManager.findOne({
        where: {
          managerId: userId,
          hotelId: expense.hotelId,
          status: 'active'
        }
      });

      if (!assignment) {
        return res.status(403).json({
          success: false,
          error: 'Access denied',
          message: 'You do not have access to this expense'
        });
      }
    } else if (userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        message: 'Only managers and admins can delete expenses'
      });
    }

    // Delete expense
    await expense.destroy();

    res.status(200).json({
      success: true,
      message: 'Expense deleted successfully'
    });

  } catch (error) {
    console.error('Delete expense error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to delete expense'
    });
  }
};

// Get expenses by hotel
export const getExpensesByHotel = async (req, res) => {
  try {
    const { hotelId } = req.params;
    const {
      page = 1,
      limit = 10,
      expenseType,
      paymentMode,
      startDate,
      endDate,
      sortBy = 'createdAt',
      sortOrder = 'DESC'
    } = req.query;

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
        message: 'Only managers and admins can view expenses'
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

    // Build where clause
    const whereClause = { hotelId };

    // Filter by expense type
    if (expenseType) {
      whereClause.expenseType = expenseType;
    }

    // Filter by payment mode
    if (paymentMode) {
      whereClause.paymentMode = paymentMode;
    }

    // Filter by date range
    if (startDate && endDate) {
      // Both start and end date present
      whereClause.createdAt = { 
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    } else if (startDate && !endDate) {
      // Only start date present
      whereClause.createdAt = {
        [Op.gte]: new Date(startDate)
      };
    } else {
      // Default to current month
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      whereClause.createdAt = {
        [Op.between]: [startOfMonth, endOfMonth]
      };
    }

    // Pagination
    const offset = (page - 1) * limit;
    const limitNum = parseInt(limit);

    // Validate sort parameters
    const allowedSortFields = ['createdAt', 'amount', 'expenseType', 'paymentMode'];
    const allowedSortOrders = ['ASC', 'DESC'];
    
    const finalSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';
    const finalSortOrder = allowedSortOrders.includes(sortOrder.toUpperCase()) ? sortOrder.toUpperCase() : 'DESC';

    // Get expenses with pagination
    const { count, rows: expenses } = await Expense.findAndCountAll({
      where: whereClause,
      include: [{
        model: Hotel,
        as: 'hotel',
        attributes: ['id', 'name']
      }],
      order: [[finalSortBy, finalSortOrder]],
      limit: limitNum,
      offset: offset
    });

    // Calculate pagination info
    const totalPages = Math.ceil(count / limitNum);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    res.status(200).json({
      success: true,
      message: 'Hotel expenses retrieved successfully',
      data: {
        hotel: {
          id: hotel.id,
          name: hotel.name
        },
        expenses,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalItems: count,
          itemsPerPage: limitNum,
          hasNextPage,
          hasPrevPage
        }
      }
    });

  } catch (error) {
    console.error('Get expenses by hotel error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to retrieve hotel expenses'
    });
  }
};

// Get expense statistics
export const getExpenseStats = async (req, res) => {
  try {
    const { hotelId, startDate, endDate } = req.query;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Build where clause
    const whereClause = {};

    // Filter by hotel access
    if (userRole === 'manager') {
      const assignments = await HotelManager.findAll({
        where: {
          managerId: userId,
          status: 'active'
        },
        attributes: ['hotelId']
      });

      const accessibleHotelIds = assignments.map(assignment => assignment.hotelId);
      
      if (hotelId) {
        if (!accessibleHotelIds.includes(hotelId)) {
          return res.status(403).json({
            success: false,
            error: 'Access denied',
            message: 'You do not have access to this hotel'
          });
        }
        whereClause.hotelId = hotelId;
      } else {
        whereClause.hotelId = { [Op.in]: accessibleHotelIds };
      }
    } else if (userRole === 'admin') {
      if (hotelId) {
        whereClause.hotelId = hotelId;
      }
    } else {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        message: 'Only managers and admins can view expense statistics'
      });
    }

    // Filter by date range (default to current month if no dates provided)
    if (startDate && endDate) {
      whereClause.createdAt = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    } else {
      // Default to current month
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      
      whereClause.createdAt = {
        [Op.between]: [startOfMonth, endOfMonth]
      };
    }

    // Get total expenses
    const totalExpenses = await Expense.sum('amount', { where: whereClause });

    // Get expenses by type
    const expensesByType = await Expense.findAll({
      where: whereClause,
      attributes: [
        'expenseType',
        [sequelize.fn('SUM', sequelize.col('amount')), 'totalAmount'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['expenseType']
    });

    // Get expenses by payment mode
    const expensesByPaymentMode = await Expense.findAll({
      where: whereClause,
      attributes: [
        'paymentMode',
        [sequelize.fn('SUM', sequelize.col('amount')), 'totalAmount'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['paymentMode']
    });

    // Get total count
    const totalCount = await Expense.count({ where: whereClause });

    res.status(200).json({
      success: true,
      message: 'Expense statistics retrieved successfully',
      data: {
        totalExpenses: parseFloat(totalExpenses) || 0,
        totalCount,
        expensesByType,
        expensesByPaymentMode
      }
    });

  } catch (error) {
    console.error('Get expense stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to retrieve expense statistics'
    });
  }
}; 