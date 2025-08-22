import { sequelize } from '../config/database.js';
import GuestTransaction from '../models/GuestTransaction.js';
import GuestRecord from '../models/GuestRecord.js';
import PaymentMode from '../models/PaymentMode.js';
import { Op } from 'sequelize';

export const getPaymentModeReport = async (req, res) => {
    try {
      const { hotelId } = req.params;
      const userId = req.user.id;
      // Validate required parameters
      if (!hotelId) {
        return res.status(400).json({
          success: false,
          error: 'Hotel ID is required'
        });
      }
  
      const now = new Date();
  
      // Calculate date range for today (00:00:00 to 23:59:59 today only)
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  
      // Calculate date range for this month (from 1st day to last day of current month)
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      // More reliable way: start of next month minus 1 millisecond
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1, 0, 0, 0, -1);
  
      console.log('Date Ranges:');
      console.log('Today:', todayStart.toISOString(), 'to', todayEnd.toISOString());
      console.log('Month:', monthStart.toISOString(), 'to', monthEnd.toISOString());
  
            // First, get all payment modes created by the current user
      const allPaymentModes = await PaymentMode.findAll({
        attributes: ['id', 'paymentMode'],
        where: { createdBy: userId },
        raw: true
      });

      // Query for today's data (paymentDate between todayStart and todayEnd)
      const todayTransactions = await GuestTransaction.findAll({
        attributes: [
          [sequelize.col('paymentMode.id'), 'paymentModeId'],
          [sequelize.col('paymentMode.paymentMode'), 'paymentMode'],
          [sequelize.fn('SUM', sequelize.col('GuestTransaction.amount')), 'totalAmount']
        ],
        include: [
          {
            model: GuestRecord,
            as: 'booking',
            attributes: [],
            where: {
              hotelId: hotelId
            },
            required: true
          },
          {
            model: PaymentMode,
            as: 'paymentMode',
            attributes: [],
            where: { createdBy: userId },
            required: true
          }
        ],
        where: {
          paymentDate: {
            [Op.gte]: todayStart,
            [Op.lte]: todayEnd
          }
        },
        group: ['paymentMode.id', 'paymentMode.paymentMode'],
        raw: true
      });

      // Query for this month's data (paymentDate between monthStart and monthEnd)
      const monthTransactions = await GuestTransaction.findAll({
        attributes: [
          [sequelize.col('paymentMode.id'), 'paymentModeId'],
          [sequelize.col('paymentMode.paymentMode'), 'paymentMode'],
          [sequelize.fn('SUM', sequelize.col('GuestTransaction.amount')), 'totalAmount']
        ],
        include: [
          {
            model: GuestRecord,
            as: 'booking',
            attributes: [],
            where: {
              hotelId: hotelId
            },
            required: true
          },
          {
            model: PaymentMode,
            as: 'paymentMode',
            attributes: [],
            where: { createdBy: userId },
            required: true
          }
        ],
        where: {
          paymentDate: {
            [Op.gte]: monthStart,
            [Op.lte]: monthEnd
          }
        },
        group: ['paymentMode.id', 'paymentMode.paymentMode'],
        raw: true
      });
  
            
    // Create maps for quick lookup of transaction amounts
    const todayAmountMap = {};
    todayTransactions.forEach(item => {
      todayAmountMap[item.paymentModeId] = parseFloat(item.totalAmount) || 0;
    });

    const monthAmountMap = {};
    monthTransactions.forEach(item => {
      monthAmountMap[item.paymentModeId] = parseFloat(item.totalAmount) || 0;
    });

    // Format today's data - include all payment modes with their amounts (0 if no transactions)
    const todayData = allPaymentModes.map(paymentMode => ({
      paymentMode: paymentMode.paymentMode,
      totalAmount: todayAmountMap[paymentMode.id] || 0
    }));

    // Format this month's data - include all payment modes with their amounts (0 if no transactions)
    const monthData = allPaymentModes.map(paymentMode => ({
      paymentMode: paymentMode.paymentMode,
      totalAmount: monthAmountMap[paymentMode.id] || 0
    }));
  
      // Return successful response with both datasets
      res.status(200).json({
        success: true,
        data: {
          today: todayData,
          thisMonth: monthData,
          meta: {
            hotelId,
            todayTotal: todayData.reduce((sum, item) => sum + item.totalAmount, 0),
            monthTotal: monthData.reduce((sum, item) => sum + item.totalAmount, 0)
          }
        },
        });
  
    } catch (error) {
      console.error('Error fetching payment mode report:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Failed to fetch payment mode report'
      });
    }
  };