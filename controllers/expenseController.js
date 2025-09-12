import { Expense, Hotel, HotelManager, ExpenseMode, sequelize } from '../models/index.js';
import { Op } from 'sequelize';

// Create a new expense (manager only for assigned hotels, admin for all)
export const createExpense = async (req, res) => {
  try {
    const {
      hotelId,
      expenseModeId,
      amount,
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

    // Verify expense mode exists
    const expenseMode = await ExpenseMode.findByPk(expenseModeId);
    if (!expenseMode) {
      return res.status(404).json({
        success: false,
        error: 'Expense mode not found',
        message: 'The specified expense mode does not exist'
      });
    }

    // Create expense
    const expense = await Expense.create({
      hotelId,
      expenseModeId,
      amount,
      description
    });

    // Fetch the created expense with hotel and expense mode details
    const createdExpense = await Expense.findByPk(expense.id, {
      include: [
        {
          model: Hotel,
          as: 'hotel',
          attributes: ['id', 'name']
        },
        {
          model: ExpenseMode,
          as: 'expenseMode',
          attributes: ['id', 'expenseMode']
        }
      ]
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

// Update expense
export const updateExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      expenseModeId,
      amount,
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

    // Verify expense mode exists if provided
    if (expenseModeId) {
      const expenseMode = await ExpenseMode.findByPk(expenseModeId);
      if (!expenseMode) {
        return res.status(404).json({
          success: false,
          error: 'Expense mode not found',
          message: 'The specified expense mode does not exist'
        });
      }
    }

    // Update expense
    await expense.update({
      expenseModeId,
      amount,
      description
    });

    // Fetch updated expense with hotel and expense mode details
    const updatedExpense = await Expense.findByPk(id, {
      include: [
        {
          model: Hotel,
          as: 'hotel',
          attributes: ['id', 'name']
        },
        {
          model: ExpenseMode,
          as: 'expenseMode',
          attributes: ['id', 'expenseMode']
        }
      ]
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
      expenseModeId,
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

    // Filter by expense mode
    if (expenseModeId) {
      whereClause.expenseModeId = expenseModeId;
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
    const allowedSortFields = ['createdAt', 'amount'];
    const allowedSortOrders = ['ASC', 'DESC'];
    
    const finalSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';
    const finalSortOrder = allowedSortOrders.includes(sortOrder.toUpperCase()) ? sortOrder.toUpperCase() : 'DESC';

    // Get expenses with pagination
    const { count, rows: expenses } = await Expense.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Hotel,
          as: 'hotel',
          attributes: ['id', 'name']
        },
        {
          model: ExpenseMode,
          as: 'expenseMode',
          attributes: ['expenseMode']
        }
      ],
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

