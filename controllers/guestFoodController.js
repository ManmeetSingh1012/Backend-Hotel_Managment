import { GuestRecord, Hotel, HotelManager, GuestTransaction, GuestExpense, PaymentMode, Menu, GuestFoodOrder, sequelize } from '../models/index.js';
import { Op } from 'sequelize';
import { convertNestedDecimalFields, convertDecimalFields } from '../utils/decimalConverter.js';



// Add food expense with single item
export const addFoodExpense = async (req, res) => {
    try {
      const { menuId, portionType, quantity } = req.body;
      const { bookingId } = req.params;
      const userId = req.user.id;
      const userRole = req.user.role;
  
      // Find the guest record to verify it exists and get hotel info
      const guestRecord = await GuestRecord.findByPk(bookingId, {
        include: [{
          model: Hotel,
          as: 'hotel',
          attributes: ['id', 'name']
        }]
      });
  
      if (!guestRecord) {
        return res.status(404).json({
          success: false,
          error: 'Guest record not found',
          message: 'The specified booking ID does not exist'
        });
      }
  
      // Check authorization - user must have access to the hotel
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
            message: 'You do not have access to this hotel'
          });
        }
      } else if (userRole !== 'admin') {
        return res.status(403).json({
          success: false,
          error: 'Access denied',
          message: 'Only managers and admins can add food expenses'
        });
      }
  
      // Fetch the menu item to validate it exists and get price
      const menu = await Menu.findByPk(menuId);
      
      if (!menu) {
        return res.status(404).json({
          success: false,
          error: 'Menu item not found',
          message: `Menu item with ID ${menuId} does not exist`
        });
      }
  
      // Get price based on portion type
      let pricePerItem;
      if (portionType === 'half') {
        if (!menu.halfPlatePrice) {
          return res.status(400).json({
            success: false,
            error: 'Half plate not available',
            message: `Half plate is not available for menu item: ${menu.name}`
          });
        }
        pricePerItem = parseFloat(menu.halfPlatePrice);
      } else {
        pricePerItem = parseFloat(menu.fullPlatePrice);
      }
  
      const totalAmount = pricePerItem * parseInt(quantity);
  
      // Use transaction to ensure data consistency
      const result = await sequelize.transaction(async (t) => {
        // Create the GuestExpense record
        const guestExpense = await GuestExpense.create({
          bookingId: bookingId,
          expenseType: 'food',
          amount: totalAmount
        }, { transaction: t });
  
        // Create the GuestFoodOrder record
        const foodOrder = await GuestFoodOrder.create({
          guestExpenseId: guestExpense.id,
          menuId: menuId,
          portionType: portionType,
          quantity: parseInt(quantity),
          unitPrice: pricePerItem
        }, { transaction: t });
  
        return { guestExpense, foodOrder };
      });
  
      // Fetch the created expense with food order and menu details
      const createdExpense = await GuestExpense.findByPk(result.guestExpense.id, {
        include: [
          {
            model: GuestFoodOrder,
            as: 'foodOrders',
            include: [{
              model: Menu,
              as: 'menu',
              attributes: ['name']
            }]
          }
        ]
      });

      // Format the data to match getFoodExpenseByBookingId response format
      const formattedData = [];
      
      createdExpense.foodOrders.forEach(order => {
        formattedData.push({
          foodOrderId: order.id,
          expenseId: createdExpense.id,
          name: order.menu.name,
          quantity: order.quantity,
          portionType: order.portionType, // 'half' or 'full'
          unitPrice: parseFloat(order.unitPrice).toFixed(2), // Price per single portion
          totalPrice: parseFloat(order.unitPrice * order.quantity).toFixed(2)
        });
      });
      
      // Calculate grand total
      const grandTotal = formattedData.reduce((sum, item) => sum + parseFloat(item.totalPrice), 0);

      res.status(201).json({
        success: true,
        message: 'Food expense added successfully',
        data: {
          orders: formattedData,
          grandTotal: grandTotal.toFixed(2),
          date: new Date().toISOString().split('T')[0] // Current date
        }
      });
  
    } catch (error) {
      console.error('Add food expense error:', error);
  
      if (error.name === 'SequelizeValidationError') {
        return res.status(400).json({
          success: false,
          error: 'Validation error',
          message: error.errors.map(err => err.message).join(', ')
        });
      }
  
      if (error.name === 'SequelizeForeignKeyConstraintError') {
        return res.status(400).json({
          success: false,
          error: 'Reference error',
          message: 'One or more referenced records do not exist'
        });
      }
  
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to add food expense'
      });
    }
  };
  
  // Update food expense with new items
  export const updateFoodExpense = async (req, res) => {
    try {
      const { items } = req.body;
      const { expenseId } = req.params;
  
      const userId = req.user.id;
      const userRole = req.user.role;
  
      // Find the expense record with its guest record and hotel info
      const existingExpense = await GuestExpense.findByPk(expenseId, {
        include: [
          {
            model: GuestRecord,
            as: 'guestRecord',
            include: [{
              model: Hotel,
              as: 'hotel',
              attributes: ['id', 'name']
            }]
          },
          {
            model: GuestFoodOrder,
            as: 'foodOrders'
          }
        ]
      });
  
      if (!existingExpense) {
        return res.status(404).json({
          success: false,
          error: 'Expense not found',
          message: 'The specified expense ID does not exist'
        });
      }
  
      // Verify this is a food expense
      if (existingExpense.expenseType !== 'food') {
        return res.status(400).json({
          success: false,
          error: 'Invalid expense type',
          message: 'This function can only update food expenses'
        });
      }
  
      // Check authorization - user must have access to the hotel
      if (userRole === 'manager') {
        const assignment = await HotelManager.findOne({
          where: {
            managerId: userId,
            hotelId: existingExpense.guestRecord.hotelId,
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
          message: 'Only managers and admins can update food expenses'
        });
      }
  
      // Fetch all menu items at once to validate they exist and get prices
      const menuIds = items.map(item => item.menuId);
      const menuItems = await Menu.findAll({
        where: {
          id: { [Op.in]: menuIds }
        }
      });
  
      // Create a map for quick lookup
      const menuMap = {};
      menuItems.forEach(menu => {
        menuMap[menu.id] = menu;
      });
  
      // Validate all menu items exist and calculate new total amount
      let totalAmount = 0;
      const calculatedItems = [];
  
      for (const item of items) {
        const menu = menuMap[item.menuId];
        if (!menu) {
          return res.status(404).json({
            success: false,
            error: 'Menu item not found',
            message: `Menu item with ID ${item.menuId} does not exist`
          });
        }
  
        // Get price based on portion type
        let pricePerItem;
        if (item.portionType === 'half') {
          if (!menu.halfPlatePrice) {
            return res.status(400).json({
              success: false,
              error: 'Half plate not available',
              message: `Half plate is not available for menu item: ${menu.name}`
            });
          }
          pricePerItem = parseFloat(menu.halfPlatePrice);
        } else {
          pricePerItem = parseFloat(menu.fullPlatePrice);
        }
  
        const itemTotal = pricePerItem * parseInt(item.quantity);
        totalAmount += itemTotal;
  
        calculatedItems.push({
          menuId: item.menuId,
          portionType: item.portionType,
          quantity: parseInt(item.quantity),
          price: itemTotal,
          menu: menu
        });
      }
  
      // Use transaction to ensure data consistency
      const result = await sequelize.transaction(async (t) => {
        // Delete all existing food order entries
        await GuestFoodOrder.destroy({
          where: {
            guestExpenseId: expenseId
          },
          transaction: t
        });
  
        // Update the expense amount
        await existingExpense.update({
          amount: totalAmount
        }, { transaction: t });
  
        // Create new food order entries
        const foodOrders = await Promise.all(
          calculatedItems.map(item =>
            GuestFoodOrder.create({
              guestExpenseId: expenseId,
              menuId: item.menuId,
              portionType: item.portionType,
              quantity: item.quantity,
              unitPrice: item.price
            }, { transaction: t })
          )
        );
  
        return { updatedExpense: existingExpense, foodOrders };
      });
  
            // Fetch the updated expense with all food orders and menu details
      const updatedExpense = await GuestExpense.findByPk(expenseId, {
        include: [
          {
            model: GuestFoodOrder,
            as: 'foodOrders',
            include: [{
              model: Menu,
              as: 'menu',
              attributes: ['name']
            }]
          }
        ]
      });

      // Format the data to match getFoodExpenseByBookingId response format
      const formattedData = [];
      
      updatedExpense.foodOrders.forEach(order => {
        formattedData.push({
          foodOrderId: order.id,
          expenseId: updatedExpense.id,
          name: order.menu.name,
          quantity: order.quantity,
          portionType: order.portionType, // 'half' or 'full'
          unitPrice: parseFloat(order.unitPrice).toFixed(2), // Price per single portion
          totalPrice: parseFloat(order.unitPrice * order.quantity).toFixed(2)
        });
      });
      
      // Calculate grand total
      const grandTotal = formattedData.reduce((sum, item) => sum + parseFloat(item.totalPrice), 0);

      res.json({
        success: true,
        message: 'Food expense updated successfully',
        data: {
          orders: formattedData,
          grandTotal: grandTotal.toFixed(2),
          date: new Date().toISOString().split('T')[0] // Current date
        }
      });
  
    } catch (error) {
      console.error('Update food expense error:', error);
  
      if (error.name === 'SequelizeValidationError') {
        return res.status(400).json({
          success: false,
          error: 'Validation error',
          message: error.errors.map(err => err.message).join(', ')
        });
      }
  
      if (error.name === 'SequelizeForeignKeyConstraintError') {
        return res.status(400).json({
          success: false,
          error: 'Reference error',
          message: 'One or more referenced records do not exist'
        });
      }
  
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to update food expense'
      });
    }
  };
  
  export const getFoodExpenseByBookingId = async (req, res) => {
    try {
      const { bookingId } = req.params;
      const { date } = req.query; // Get date from query parameter
      
      // Set up date filtering - use provided date or today's date
      const targetDate = date ? new Date(date) : new Date();
      const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
      const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));
      
      const foodExpenses = await GuestExpense.findAll({
        where: { 
          bookingId,
          expenseType: 'food', // Only get food expenses
          createdAt: {
            [Op.between]: [startOfDay, endOfDay]
          }
        },
        include: [
          {
            model: GuestFoodOrder,
            as: 'foodOrders',
            include: [
              {
                model: Menu,
                as: 'menu',
                attributes: ['name']
              }
            ]
          }
        ]
      });
      
      // Format the data as requested: name, qty, half/full portion, unit price, total price
      const formattedData = [];
      
      foodExpenses.forEach(expense => {
        expense.foodOrders.forEach(order => {
          formattedData.push({
            foodOrderId: order.id,
            expenseId: expense.id,
            name: order.menu.name,
            quantity: order.quantity,
            portionType: order.portionType, // 'half' or 'full'
            unitPrice: parseFloat(order.unitPrice).toFixed(2), // Price per single portion
            totalPrice: parseFloat(order.unitPrice * order.quantity).toFixed(2)
          });
        });
      });
      
      // Calculate grand total
      const grandTotal = formattedData.reduce((sum, item) => sum + parseFloat(item.totalPrice), 0);
      
      res.json({
        success: true,
        message: 'Food expense retrieved successfully',
        data: {
          orders: formattedData,
          grandTotal: grandTotal.toFixed(2),
          date: targetDate.toISOString().split('T')[0] // Return the date used for filtering
        }
      });
      
    } catch (error) {
      console.error('Get food expense by booking ID error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to get food expense by booking ID'
      });
    }
  };