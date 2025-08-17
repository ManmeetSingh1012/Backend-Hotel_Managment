import ExpenseMode from '../models/ExpenseMode.js';

// Create a new expense mode
export const createExpenseMode = async (req, res) => {
  try {
    const { expenseMode } = req.body;
    const createdBy = req.user.id; // Get from authenticated user

    
    const expenseModeRecord = await ExpenseMode.create({
      createdBy,
      expenseMode: expenseMode.trim()
    });

    res.status(201).json({
      success: true,
      message: 'Expense mode created successfully',
      data: expenseModeRecord
    });
  } catch (error) {
    console.error('Error creating expense mode:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating expense mode',
      error: error.message
    });
  }
};

// Get all expense modes
export const getExpenseModes = async (req, res) => {
  try {
    const userId = req.user.id;

    const expenseModes = await ExpenseMode.findAll({
      where: { createdBy: userId },
      order: [['createdAt', 'DESC']]
    });

    // Always return success, even if no data (empty array)
    res.status(200).json({
      success: true,
      message: 'Expense modes retrieved successfully',
      data: expenseModes,
      count: expenseModes.length
    });
  } catch (error) {
    console.error('Error fetching expense modes:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching expense modes',
      error: error.message
    });
  }
};

// Get a single expense mode by ID
export const getExpenseModeById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const expenseMode = await ExpenseMode.findOne({
      where: { 
        id: id,
        createdBy: userId
      }
    });

    if (!expenseMode) {
      return res.status(404).json({
        success: false,
        message: 'Expense mode not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Expense mode retrieved successfully',
      data: expenseMode
    });
  } catch (error) {
    console.error('Error fetching expense mode:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching expense mode',
      error: error.message
    });
  }
};

// Update an expense mode
export const updateExpenseMode = async (req, res) => {
  try {
    const { id } = req.params;
    const { expenseMode } = req.body;
    const userId = req.user.id;



    const expenseModeRecord = await ExpenseMode.findOne({
      where: { 
        id: id,
        createdBy: userId
      }
    });

    if (!expenseModeRecord) {
      return res.status(404).json({
        success: false,
        message: 'Expense mode not found'
      });
    }

    await expenseModeRecord.update({
      expenseMode: expenseMode.trim()
    });

    res.status(200).json({
      success: true,
      message: 'Expense mode updated successfully',
      data: expenseModeRecord
    });
  } catch (error) {
    console.error('Error updating expense mode:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating expense mode',
      error: error.message
    });
  }
};

// Delete an expense mode
export const deleteExpenseMode = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const expenseMode = await ExpenseMode.findOne({
      where: { 
        id: id,
        createdBy: userId
      }
    });

    if (!expenseMode) {
      return res.status(404).json({
        success: false,
        message: 'Expense mode not found'
      });
    }

    await expenseMode.destroy();

    res.status(200).json({
      success: true,
      message: 'Expense mode deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting expense mode:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting expense mode',
      error: error.message
    });
  }
};
