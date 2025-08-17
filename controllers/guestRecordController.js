import { GuestRecord, Hotel, HotelManager, GuestTransaction, GuestExpense, PaymentMode, sequelize } from '../models/index.js';
import { Op } from 'sequelize';
import { convertNestedDecimalFields, convertDecimalFields } from '../utils/decimalConverter.js';

// Create a new guest record (manager only for assigned hotels)
export const createGuestRecord = async (req, res) => {
  try {
    const {
      hotelId,
      guestName,
      phoneNo,
      roomNo,
      checkinTime,
      paymentId,
      advancePayment,
      rent,
      bill
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



    // Verify payment mode exists if provided
    let paymentModeRecord = null;
    if (paymentId) {
      paymentModeRecord = await PaymentMode.findByPk(paymentId);
      if (!paymentModeRecord) {
        return res.status(404).json({
          success: false,
          error: 'Payment mode not found',
          message: 'The specified payment mode does not exist'
        });
      }
    }

    // Prepare data for creation
    const guestData = {
      hotelId,
      guestName,
      phoneNo,
      roomNo,
      checkinTime,
      rent,
      bill
    };

 
    // Use transaction to ensure data consistency
    const result = await sequelize.transaction(async (t) => {
      // Create guest record
      const guestRecord = await GuestRecord.create(guestData, { transaction: t });


    
     

      // Create payment transaction if payment mode, type, and amount are provided
  
      if(advancePayment){
        await GuestTransaction.create({
          bookingId: guestRecord?.id,
          paymentType: 'advance',
          paymentModeId: paymentId,
          amount: advancePayment,
          
        }, { transaction: t });
      }

      return guestRecord;
    });

    // Fetch the created record with hotel details, expenses, and transactions
    const createdRecord = await GuestRecord.findByPk(result.id, {
      include: [
        {
          model: Hotel,
          as: 'hotel',
          attributes: ['id', 'name']
        }
      ]
    });

    // Get all guest IDs for fetching transactions and expenses
    const guestIds = [createdRecord.id];

    // Fetch transactions for this guest
    const transactions = await GuestTransaction.findAll({
      where: {
        bookingId: { [Op.in]: guestIds }
      },
      include: [
        {
          model: PaymentMode,
          as: 'paymentMode',
          attributes: ['id', 'paymentMode']
        }
      ],
      attributes: ['bookingId', 'amount', 'paymentType', 'paymentModeId']
    });

    // Fetch expenses for this guest
    const expenses = await GuestExpense.findAll({
      where: {
        bookingId: { [Op.in]: guestIds }
      },
      attributes: ['bookingId', 'expenseType', 'amount'],
      raw: true
    });

    // Group transactions by bookingId
    const transactionsByBooking = {};
    transactions.forEach(transaction => {
      if (!transactionsByBooking[transaction.bookingId]) {
        transactionsByBooking[transaction.bookingId] = [];
      }
      transactionsByBooking[transaction.bookingId].push({
        amount: transaction.amount,
        paymentType: transaction.paymentType,
        paymentMode: transaction.paymentMode ? transaction.paymentMode.paymentMode : null
      });
    });

    // Group and consolidate expenses by bookingId and expenseType
    const expensesByBooking = {};
    expenses.forEach(expense => {
      if (!expensesByBooking[expense.bookingId]) {
        expensesByBooking[expense.bookingId] = {};
      }
      
      if (!expensesByBooking[expense.bookingId][expense.expenseType]) {
        expensesByBooking[expense.bookingId][expense.expenseType] = 0;
      }
      
      // Add amounts for the same expense type
      expensesByBooking[expense.bookingId][expense.expenseType] += parseFloat(expense.amount || 0);
    });

    // Convert consolidated expenses to array format
    const consolidatedExpensesByBooking = {};
    Object.keys(expensesByBooking).forEach(bookingId => {
      consolidatedExpensesByBooking[bookingId] = Object.keys(expensesByBooking[bookingId]).map(expenseType => ({
        expenseType: expenseType,
        amount: expensesByBooking[bookingId][expenseType]
      }));
    });

    // Calculate pending amounts for this guest
    const guestRecord = await GuestRecord.findByPk(createdRecord.id, {
      attributes: ['id', 'checkinDate', 'bill'],
      raw: true
    });

    // Calculate total food expenses for this guest
    const foodExpenses = await GuestExpense.findAll({
      attributes: [
        'bookingId',
        [
          sequelize.literal(`
            SUM(CASE WHEN "GuestExpense"."expenseType" = 'food' THEN "GuestExpense"."amount" ELSE 0 END)
          `),
          'totalFoodExpenses'
        ]
      ],
      where: {
        bookingId: createdRecord.id
      },
      group: ['bookingId'],
      raw: true
    });

    // Calculate total payments for this guest
    const totalPaymentsResult = await GuestTransaction.findAll({
      attributes: [
        'bookingId',
        [
          sequelize.literal(`
            SUM(CASE WHEN "GuestTransaction"."paymentType" IN ('partial', 'advance', 'final') THEN "GuestTransaction"."amount" ELSE 0 END)
          `),
          'totalPayments'
        ]
      ],
      where: {
        bookingId: createdRecord.id
      },
      group: ['bookingId'],
      raw: true
    });

    // Calculate pending amount
    const totalBill = parseFloat(guestRecord.bill || 0);
    const totalFoodExpenses = parseFloat(foodExpenses[0]?.totalFoodExpenses || 0);
    const totalPayments = parseFloat(totalPaymentsResult[0]?.totalPayments || 0);
    const pendingAmount = Math.max(0, (totalBill + totalFoodExpenses) - totalPayments);

    // Process record to include transactions, expenses, and pending amounts
    const recordData = createdRecord.toJSON();
    const recordId = recordData.id;
    
    // Get transactions for this guest (empty array if none)
    const guestTransactions = transactionsByBooking[recordId] || [];
    
    // Get expenses for this guest (empty array if none)
    const guestExpenses = consolidatedExpensesByBooking[recordId] || [];

    // Return structured data matching getGuestRecordsByHotel format
    const processedRecord = convertNestedDecimalFields({
      ...recordData,
      transactions: guestTransactions,
      expenses: guestExpenses,
      pendingAmount: pendingAmount
    });

    res.status(201).json({
      success: true,
      message: 'Guest record created successfully',
      records: [processedRecord],
      pagination: {
        currentPage: 1,
        totalPages: 1,
        totalRecords: 1,
        recordsPerPage: 1
      },
      todayTotalSales: totalBill + totalFoodExpenses
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


// Update guest record (manager only)
export const updateGuestRecord = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      hotelId,
      guestName,
      phoneNo,
      roomNo,
      checkinTime,
      checkoutTime,
      paymentId, // This will be used as paymentModeId
      paymentType,
      paymentAmount,
      rent,
      amount,
      bill,
      expenseType, // New field for expense type
      ...otherData
    } = req.body;
    
    const updateData = {
      guestName,
      phoneNo,
      roomNo,
      checkinTime,
      checkoutTime,
      rent,
      bill,
      ...otherData
    };
    
    const userId = req.user.id;
    const userRole = req.user.role;
    console.log("Update guest record request:", {
      guestId: id,
      userId,
      userRole,
      requestData: req.body
    });

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

    // Validate paymentAmount is positive if provided
    if (paymentAmount && parseFloat(paymentAmount) <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid payment amount',
        message: 'Payment amount must be greater than 0'
      });
    }

    // Verify payment mode exists if provided
    let paymentModeRecord = null;
    if (paymentId) {
      paymentModeRecord = await PaymentMode.findByPk(paymentId);
      if (!paymentModeRecord) {
        return res.status(404).json({
          success: false,
          error: 'Payment mode not found',
          message: 'The specified payment mode does not exist'
        });
      }
      console.log(`Payment mode verified: ${paymentModeRecord.paymentMode} (ID: ${paymentId})`);
    }

    // If checkoutTime is present in update, set checkoutDate to today's date
    if (updateData.hasOwnProperty('checkoutTime') && updateData.checkoutTime) {
      const today = new Date();
      const yyyy = today.getFullYear();
      const mm = String(today.getMonth() + 1).padStart(2, '0');
      const dd = String(today.getDate()).padStart(2, '0');
      updateData.checkoutDate = `${yyyy}-${mm}-${dd}`;
    }

    // Get today's date for comparison
    const today = new Date();
    const todayDate = today.toISOString().split('T')[0];
    
    console.log(`Processing update for guest ${id} on date: ${todayDate}`);

    // Use transaction to ensure data consistency
    const result = await sequelize.transaction(async (t) => {
      try {
        // Update the guest record
        await guestRecord.update(updateData, { transaction: t });

        let transactionUpdated = false;
        let expenseUpdated = false;

        // Handle payment transaction - always create/update when payment details are provided
        if (paymentId && paymentType && paymentAmount && parseFloat(paymentAmount) > 0) {
          // Check if a transaction with same payment type exists today
          const existingTransaction = await GuestTransaction.findOne({
            where: {
              bookingId: guestRecord.id,
              paymentType: paymentType,
              createdAt: {
                [Op.gte]: new Date(todayDate + ' 00:00:00'),
                [Op.lt]: new Date(todayDate + ' 23:59:59')
              }
            },
            transaction: t
          });

          console.log(existingTransaction, "existingTransaction");
          if (existingTransaction) {
            // Update existing transaction amount
            const newAmount = parseFloat(existingTransaction.amount) + parseFloat(paymentAmount);
            await existingTransaction.update({
              amount: newAmount
            }, { transaction: t });
            transactionUpdated = true;
            console.log(`Updated existing ${paymentType} transaction for guest ${guestRecord.id}, new total: ${newAmount}`);
          } else {
            // Create new transaction
            await GuestTransaction.create({
              bookingId: guestRecord.id,
              paymentType: paymentType,
              paymentModeId: paymentId,
              amount: paymentAmount,
            }, { transaction: t });
            console.log(`Created new ${paymentType} transaction for guest ${guestRecord.id}, amount: ${paymentAmount}`);
          }
        }

        // Handle food expense - create/update food expense when expenseType is food
        if (expenseType === 'food' && amount && parseFloat(amount) > 0) {
          // Check if a food expense exists today
          const existingFoodExpense = await GuestExpense.findOne({
            where: {
              bookingId: guestRecord.id,
              expenseType: 'food',
              createdAt: {
                [Op.gte]: new Date(todayDate + ' 00:00:00'),
                [Op.lt]: new Date(todayDate + ' 23:59:59')
              }
            },
            transaction: t
          });

          if (existingFoodExpense) {
            // Update existing food expense amount
            const newFoodAmount = parseFloat(existingFoodExpense.amount) + parseFloat(amount);
            await existingFoodExpense.update({
              amount: newFoodAmount
            }, { transaction: t });
            expenseUpdated = true;
            console.log(`Updated existing food expense for guest ${guestRecord.id}, new total: ${newFoodAmount}`);
          } else {
            // Create new food expense
            await GuestExpense.create({
              bookingId: guestRecord.id,
              expenseType: 'food',
              amount: amount
            }, { transaction: t });
            console.log(`Created new food expense for guest ${guestRecord.id}, amount: ${amount}`);
          }
        }

        return { guestRecord, transactionUpdated, expenseUpdated };
      } catch (transactionError) {
        console.error('Transaction error:', transactionError);
        throw transactionError;
      }
    });

    // Fetch updated record with hotel details
    const updatedRecord = await GuestRecord.findByPk(id, {
      include: [
        {
          model: Hotel,
          as: 'hotel',
          attributes: ['id', 'name']
        }
      ]
    });

    // Get all guest IDs for fetching transactions and expenses
    const guestIds = [updatedRecord.id];

    // Fetch transactions for today's date based on createdAt field (matching getGuestRecordsByHotel)
    const transactions = await GuestTransaction.findAll({
      where: {
        bookingId: { [Op.in]: guestIds },
        [Op.and]: [
          sequelize.where(
            sequelize.fn('DATE', sequelize.col('GuestTransaction.createdAt')),
            todayDate
          )
        ]
      },
      include: [
        {
          model: PaymentMode,
          as: 'paymentMode',
          attributes: ['id', 'paymentMode']
        }
      ],
      attributes: ['bookingId', 'amount', 'paymentType', 'paymentModeId']
    });

    // Fetch expenses for today's date based on createdAt field (matching getGuestRecordsByHotel)
    const expenses = await GuestExpense.findAll({
      where: {
        bookingId: { [Op.in]: guestIds },
        [Op.and]: [
          sequelize.where(
            sequelize.fn('DATE', sequelize.col('GuestExpense.createdAt')),
            todayDate
          )
        ]
      },
      attributes: ['bookingId', 'expenseType', 'amount'],
      raw: true
    });

    // Group transactions by bookingId (matching getGuestRecordsByHotel)
    const transactionsByBooking = {};
    transactions.forEach(transaction => {
      if (!transactionsByBooking[transaction.bookingId]) {
        transactionsByBooking[transaction.bookingId] = [];
      }
      transactionsByBooking[transaction.bookingId].push({
        amount: transaction.amount,
        paymentType: transaction.paymentType,
        paymentMode: transaction.paymentMode ? transaction.paymentMode.paymentMode : null
      });
    });

    // Group and consolidate expenses by bookingId and expenseType (matching getGuestRecordsByHotel)
    const expensesByBooking = {};
    expenses.forEach(expense => {
      if (!expensesByBooking[expense.bookingId]) {
        expensesByBooking[expense.bookingId] = {};
      }
      
      if (!expensesByBooking[expense.bookingId][expense.expenseType]) {
        expensesByBooking[expense.bookingId][expense.expenseType] = 0;
      }
      
      // Add amounts for the same expense type
      expensesByBooking[expense.bookingId][expense.expenseType] += parseFloat(expense.amount || 0);
    });

    // Convert consolidated expenses to array format (matching getGuestRecordsByHotel)
    const consolidatedExpensesByBooking = {};
    Object.keys(expensesByBooking).forEach(bookingId => {
      consolidatedExpensesByBooking[bookingId] = Object.keys(expensesByBooking[bookingId]).map(expenseType => ({
        expenseType: expenseType,
        amount: expensesByBooking[bookingId][expenseType]
      }));
    });

    // Calculate pending amounts the same way as getGuestRecordsByHotel
    const guestRecordsData = await GuestRecord.findAll({
      attributes: ['id', 'checkinDate'],
      where: {
        id: { [Op.in]: guestIds }
      },
      raw: true
    });

    // Calculate pending amount for this guest (matching getGuestRecordsByHotel logic)
    const guestId = updatedRecord.id;
    const guestRecordData = guestRecordsData.find(record => record.id === guestId);
    let pendingAmount = 0;

    if (guestRecordData && guestRecordData.checkinDate) {
      const checkinDate = guestRecordData.checkinDate;
      
      // Get all bills for this guest from checkin_date to today
      const guestBills = await GuestRecord.findAll({
        attributes: [
          [
            sequelize.literal(`
              SUM(
                "GuestRecord"."bill" * 
                (DATE_PART('day', '${todayDate}'::timestamp - "GuestRecord"."checkinDate"::timestamp) + 1)
              )
            `),
            'totalBill'
          ]
        ],
        where: {
          id: guestId,
          checkinDate: { [Op.ne]: null },
          [Op.or]: [
            { checkoutDate: null },
            {
              checkoutDate: {
                [Op.lte]: todayDate
              }
            }
          ]
        },
        raw: true
      });
      
      // Get food expenses for this guest from checkin_date to today
      const guestFoodExpenses = await GuestExpense.findAll({
        attributes: [
          [
            sequelize.literal(`
              SUM(CASE WHEN "GuestExpense"."expenseType" = 'food' THEN "GuestExpense"."amount" ELSE 0 END)
            `),
            'totalFoodExpenses'
          ]
        ],
        where: {
          bookingId: guestId,
          createdAt: {
            [Op.gte]: checkinDate,
            [Op.lte]: sequelize.literal(`'${todayDate} 23:59:59'`)
          }
        },
        raw: true
      });
      
      // Get payments for this guest from checkin_date to today
      const guestPayments = await GuestTransaction.findAll({
        attributes: [
          [
            sequelize.literal(`
              SUM(CASE WHEN "GuestTransaction"."paymentType" IN ('partial', 'advance', 'final') THEN "GuestTransaction"."amount" ELSE 0 END)
            `),
            'totalPayments'
          ]
        ],
        where: {
          bookingId: guestId,
          createdAt: {
            [Op.gte]: checkinDate,
            [Op.lte]: sequelize.literal(`'${todayDate} 23:59:59'`)
          }
        },
        raw: true
      });
      
      // Calculate pending amount for this guest
      const totalBill = parseFloat(guestBills[0]?.totalBill || 0);
      const totalFoodExpenses = parseFloat(guestFoodExpenses[0]?.totalFoodExpenses || 0);
      const totalPayments = parseFloat(guestPayments[0]?.totalPayments || 0);
      
      pendingAmount = Math.max(0, (totalBill + totalFoodExpenses) - totalPayments);
    }

    // Calculate today's total sales (matching getGuestRecordsByHotel)
    const todaySales = await GuestRecord.findAll({
      attributes: [
        [
          sequelize.literal(`
            SUM("GuestRecord"."bill")
          `),
          'totalBillSales'
        ]
      ],
      where: {
        hotelId: updatedRecord.hotelId,
        checkinDate: { [Op.ne]: null },
        [Op.or]: [
          { checkoutDate: null },
          { checkoutDate: todayDate }
        ]
      },
      raw: true
    });

    // Get all guest IDs for today for accurate sales calculation
    const allGuestIdsForDate = await GuestRecord.findAll({
      attributes: ['id'],
      where: {
        hotelId: updatedRecord.hotelId,
        checkinDate: { [Op.ne]: null },
        [Op.or]: [
          { checkoutDate: null },
          { checkoutDate: todayDate }
        ]
      },
      raw: true
    });

    const allGuestIds = allGuestIdsForDate.map(record => record.id);

    const todayFoodSales = await GuestExpense.findAll({
      attributes: [
        [
          sequelize.literal(`
            SUM(CASE WHEN "GuestExpense"."expenseType" = 'food' THEN "GuestExpense"."amount" ELSE 0 END)
          `),
          'totalFoodSales'
        ]
      ],
      where: {
        bookingId: { [Op.in]: allGuestIds }
      },
      raw: true
    });

    const totalBillSales = parseFloat(todaySales[0]?.totalBillSales || 0);
    const totalFoodSales = parseFloat(todayFoodSales[0]?.totalFoodSales || 0);
    const todayTotalSales = totalBillSales + totalFoodSales;

    // Process record to include transactions, expenses, and pending amounts (matching getGuestRecordsByHotel)
    const recordData = updatedRecord.toJSON();
    const recordId = recordData.id;
    
    // Get transactions for this guest (empty array if none)
    const guestTransactions = transactionsByBooking[recordId] || [];
    
    // Get expenses for this guest (empty array if none)
    const guestExpenses = consolidatedExpensesByBooking[recordId] || [];

    // Return structured data matching getGuestRecordsByHotel format
    const processedRecord = convertNestedDecimalFields({
      ...recordData,
      transactions: guestTransactions,
      expenses: guestExpenses,
      pendingAmount: pendingAmount
    });

    // Prepare response message based on what was updated
    let message = 'Guest record updated successfully';
    if (result.transactionUpdated) {
      message += ', existing transaction updated';
    }
    if (result.expenseUpdated) {
      message += ', existing food expense updated';
    }

    console.log(`Guest record update completed successfully for guest ${id}. Message: ${message}`);

    res.json({
      success: true,
      message: message,
      records: [processedRecord],
      pagination: {
        currentPage: 1,
        totalPages: 1,
        totalRecords: 1,
        recordsPerPage: 1
      },
      todayTotalSales: todayTotalSales
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

    if (error.name === 'SequelizeForeignKeyConstraintError') {
      return res.status(400).json({
        success: false,
        error: 'Reference error',
        message: 'One or more referenced records do not exist'
      });
    }

    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({
        success: false,
        error: 'Duplicate error',
        message: 'A record with this information already exists'
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

    // Convert decimal fields to numbers
    const processedRecords = rows.map(record => {
      const recordData = record.toJSON();
      return convertNestedDecimalFields(recordData, ['bill', 'rent']);
    });

    res.json({
      success: true,
      message: 'Search completed successfully',
      data: {
        records: processedRecords,
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

    // Convert decimal fields to numbers
    const processedRecords = records.map(record => {
      const recordData = record.toJSON();
      return convertDecimalFields(recordData, ['bill', 'rent']);
    });

    res.json({
      success: true,
      message: 'Guest records retrieved successfully',
      data: {
        records: processedRecords,
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

// Get guest records by hotel for today with transactions
export const getGuestRecordsByHotel = async (req, res) => {
  try {
    const { hotelId } = req.params;
    const { page = 1, limit = 10, date } = req.query;
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

    // Get the target date - use provided date filter or today's date
    const targetDate = date || new Date().toISOString().split('T')[0];

    // Calculate pagination
    const offset = (page - 1) * limit;

    // Fetch guest records where:
    // 1. hotelId matches
    // 2. checkin_date is set (not null)
    // 3. checkin_date is less than or equal to target date (not future bookings)
    // 4. checkout_date is null (guest has not checked out) OR checkout_date equals target date (checked out today)
    const { count, rows } = await GuestRecord.findAndCountAll({
      where: {
        hotelId,
        checkinDate: { 
          [Op.and]: [
            { [Op.ne]: null },
            { [Op.lte]: targetDate }
          ]
        },
        [Op.or]: [
          { checkoutDate: null },
          { checkoutDate: targetDate }
        ]
      },
      include: [
        {
          model: Hotel,
          as: 'hotel',
          attributes: ['id', 'name']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: offset
    });

    // Get all guest IDs for fetching transactions and expenses
    const guestIds = rows.map(record => record.id);

    // Fetch transactions for the target date based on createdAt field
    // Fix: Remove 'raw: true' to allow Sequelize to hydrate associations (PaymentMode)
    const transactions = await GuestTransaction.findAll({
      where: {
        bookingId: { [Op.in]: guestIds },
        [Op.and]: [
          sequelize.where(
            sequelize.fn('DATE', sequelize.col('GuestTransaction.createdAt')),
            targetDate
          )
        ]
      },
      include: [
        {
          model: PaymentMode,
          as: 'paymentMode',
          attributes: ['id', 'paymentMode']
        }
      ],
      attributes: ['bookingId', 'amount', 'paymentType', 'paymentModeId']
      // Do not use raw: true so that paymentMode is properly populated
    });

    // Fetch expenses for all guests on the target date based on createdAt field
    const expenses = await GuestExpense.findAll({
      where: {
        bookingId: { [Op.in]: guestIds },
        [Op.and]: [
          sequelize.where(
            sequelize.fn('DATE', sequelize.col('GuestExpense.createdAt')),
            targetDate
          )
        ]
      },
      attributes: ['bookingId', 'expenseType', 'amount'],
      raw: true
    });

    // Group transactions by bookingId
    const transactionsByBooking = {};
    transactions.forEach(transaction => {
      if (!transactionsByBooking[transaction.bookingId]) {
        transactionsByBooking[transaction.bookingId] = [];
      }
      transactionsByBooking[transaction.bookingId].push({
        amount: transaction.amount,
        paymentType: transaction.paymentType,
        paymentMode: transaction.paymentMode ? transaction.paymentMode.paymentMode : null
      });
    });

    // Group and consolidate expenses by bookingId and expenseType
    // If multiple entries with same expense type, add the amounts and make one entry
    const expensesByBooking = {};
    expenses.forEach(expense => {
      if (!expensesByBooking[expense.bookingId]) {
        expensesByBooking[expense.bookingId] = {};
      }
      
      if (!expensesByBooking[expense.bookingId][expense.expenseType]) {
        expensesByBooking[expense.bookingId][expense.expenseType] = 0;
      }
      
      // Add amounts for the same expense type
      expensesByBooking[expense.bookingId][expense.expenseType] += parseFloat(expense.amount || 0);
    });

    // Convert consolidated expenses to array format
    const consolidatedExpensesByBooking = {};
    Object.keys(expensesByBooking).forEach(bookingId => {
      consolidatedExpensesByBooking[bookingId] = Object.keys(expensesByBooking[bookingId]).map(expenseType => ({
        expenseType: expenseType,
        amount: expensesByBooking[bookingId][expenseType]
      }));
    });

    // Calculate pending amounts for each guest
    // Pending = (Sum of bills from checkin_date to today) + (Sum of food expenses from checkin_date to today) - (Sum of transaction amounts of type partial, advance, or final from checkin_date to today)
    
    // For each guest, we need to get the total bill from checkin_date to target date
    const guestRecords = await GuestRecord.findAll({
      attributes: ['id', 'checkinDate'],
      where: {
        id: { [Op.in]: guestIds }
      },
      raw: true
    });

    // Create a map of guest checkin dates
    const guestCheckinDates = {};
    guestRecords.forEach(record => {
      guestCheckinDates[record.id] = record.checkinDate;
    });

    // Calculate pending amounts for each guest individually
    // This approach ensures we get the correct cumulative amounts from checkin_date to target_date
    const pendingAmountMap = {};
    
    for (const guestId of guestIds) {
      // Get the guest's checkin date
      const guestRecord = guestRecords.find(record => record.id === guestId);
      if (!guestRecord || !guestRecord.checkinDate) continue;
      
      const checkinDate = guestRecord.checkinDate;
      
      // Get all bills for this guest from checkin_date to target_date
      const guestBills = await GuestRecord.findAll({
        attributes: [
          [
            sequelize.literal(`
              SUM(
                "GuestRecord"."bill" * 
                (DATE_PART('day', '${targetDate}'::timestamp - "GuestRecord"."checkinDate"::timestamp) + 1)
              )
            `),
            'totalBill'
          ]
        ],
        where: {
          id: guestId,
          checkinDate: { 
            [Op.and]: [
              { [Op.ne]: null },
              { [Op.lte]: targetDate }
            ]
          },
          [Op.or]: [
            { checkoutDate: null },
            {
              checkoutDate: {
                [Op.lte]: targetDate
              }
            }
          ]
        },
        raw: true
      });
      
      // Get food expenses for this guest from checkin_date to target_date
      const guestFoodExpenses = await GuestExpense.findAll({
        attributes: [
          [
            sequelize.literal(`
              SUM(CASE WHEN "GuestExpense"."expenseType" = 'food' THEN "GuestExpense"."amount" ELSE 0 END)
            `),
            'totalFoodExpenses'
          ]
        ],
        where: {
          bookingId: guestId,
          createdAt: {
            [Op.gte]: checkinDate,
            [Op.lte]: sequelize.literal(`'${targetDate} 23:59:59'`)
          }
        },
        raw: true
      });
      
      // Get payments for this guest from checkin_date to target_date
      const guestPayments = await GuestTransaction.findAll({
        attributes: [
          [
            sequelize.literal(`
              SUM(CASE WHEN "GuestTransaction"."paymentType" IN ('partial', 'advance', 'final') THEN "GuestTransaction"."amount" ELSE 0 END)
            `),
            'totalPayments'
          ]
        ],
        where: {
          bookingId: guestId,
          createdAt: {
            [Op.gte]: checkinDate,
            [Op.lte]: sequelize.literal(`'${targetDate} 23:59:59'`)
          }
        },
        raw: true
      });
      
      // Calculate pending amount for this guest
      const totalBill = parseFloat(guestBills[0]?.totalBill || 0);
      const totalFoodExpenses = parseFloat(guestFoodExpenses[0]?.totalFoodExpenses || 0);
      const totalPayments = parseFloat(guestPayments[0]?.totalPayments || 0);
      
      pendingAmountMap[guestId] = Math.max(0, (totalBill + totalFoodExpenses) - totalPayments);
    }

    // Get today's food expenses and payments for display purposes
    // Note: The pending amounts are calculated above using cumulative data from checkin_date
    const foodExpenses = await GuestExpense.findAll({
      attributes: [
        'bookingId',
        [
          sequelize.literal(`
            SUM(CASE WHEN "GuestExpense"."expenseType" = 'food' THEN "GuestExpense"."amount" ELSE 0 END)
          `),
          'totalFoodExpenses'
        ]
      ],
      where: {
        bookingId: { [Op.in]: guestIds },
        createdAt: {
          [Op.gte]: sequelize.literal(`'${targetDate} 00:00:00'`),
          [Op.lte]: sequelize.literal(`'${targetDate} 23:59:59'`)
        }
      },
      group: ['bookingId'],
      raw: true
    });

    const totalPayments = await GuestTransaction.findAll({
      attributes: [
        'bookingId',
        [
          sequelize.literal(`
            SUM(CASE WHEN "GuestTransaction"."paymentType" IN ('partial', 'advance', 'final') THEN "GuestTransaction"."amount" ELSE 0 END)
          `),
          'totalPayments'
        ]
      ],
      where: {
        bookingId: { [Op.in]: guestIds },
        createdAt: {
          [Op.gte]: sequelize.literal(`'${targetDate} 00:00:00'`),
          [Op.lte]: sequelize.literal(`'${targetDate} 23:59:59'`)
        }
      },
      group: ['bookingId'],
      raw: true
    });

    // The pendingAmountMap is already calculated above in the loop

    // Update maps to use today's data for display purposes
    // The pending amounts are already calculated above using cumulative data from checkin_date
    const foodExpensesMap = {};
    const totalPaymentsMap = {};
    
    foodExpenses.forEach(item => {
      foodExpensesMap[item.bookingId] = parseFloat(item.totalFoodExpenses || 0);
    });

    totalPayments.forEach(item => {
      totalPaymentsMap[item.bookingId] = parseFloat(item.totalPayments || 0);
    });

    // Calculate today's total sales (Bill + Food expenses for the target date)
    const todaySales = await GuestRecord.findAll({
      attributes: [
        [
          sequelize.literal(`
            SUM("GuestRecord"."bill")
          `),
          'totalBillSales'
        ]
      ],
      where: {
        hotelId,
        checkinDate: { 
          [Op.and]: [
            { [Op.ne]: null },
            { [Op.lte]: targetDate }
          ]
        },
        [Op.or]: [
          { checkoutDate: null },
          { checkoutDate: targetDate }
        ]
      },
      raw: true
    });

    // Get all guest IDs for the target date (not just the current page) for accurate sales calculation
    const allGuestIdsForDate = await GuestRecord.findAll({
      attributes: ['id'],
      where: {
        hotelId,
        checkinDate: { 
          [Op.and]: [
            { [Op.ne]: null },
            { [Op.lte]: targetDate }
          ]
        },
        [Op.or]: [
          { checkoutDate: null },
          { checkoutDate: targetDate }
        ]
      },
      raw: true
    });

    const allGuestIds = allGuestIdsForDate.map(record => record.id);

    const todayFoodSales = await GuestExpense.findAll({
      attributes: [
        [
          sequelize.literal(`
            SUM(CASE WHEN "GuestExpense"."expenseType" = 'food' THEN "GuestExpense"."amount" ELSE 0 END)
          `),
          'totalFoodSales'
        ]
      ],
      where: {
        bookingId: { [Op.in]: allGuestIds }
      },
      raw: true
    });

    const totalBillSales = parseFloat(todaySales[0]?.totalBillSales || 0);
    const totalFoodSales = parseFloat(todayFoodSales[0]?.totalFoodSales || 0);
    const todayTotalSales = totalBillSales + totalFoodSales;

    // Process records to include transactions, expenses, and pending amounts
    const processedRecords = rows.map(record => {
      const recordData = record.toJSON();
      const recordId = recordData.id;
      
      // Get transactions for this guest (empty array if none)
      const guestTransactions = transactionsByBooking[recordId] || [];
      
      // Get expenses for this guest (empty array if none)
      const guestExpenses = consolidatedExpensesByBooking[recordId] || [];
      
      // Get the pending amount calculated from checkin_date to target_date
      const pendingAmount = pendingAmountMap[recordId] || 0;

      // Return structured data
      return convertNestedDecimalFields({
        ...recordData,
        transactions: guestTransactions,
        expenses: guestExpenses,
        pendingAmount: pendingAmount
      });
    });

    const totalPages = Math.ceil(count / limit);

    res.json({
      success: true,
      message: 'Guest records retrieved successfully',
      records: processedRecords,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalRecords: count,
        recordsPerPage: parseInt(limit)
      },
      todayTotalSales: todayTotalSales
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